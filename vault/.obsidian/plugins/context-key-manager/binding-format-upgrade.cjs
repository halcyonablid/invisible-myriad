'use strict';
// C3 Y1 explicit binding-format migration (format 1 -> 2) on a v6 store. Same shape as binding-upgrade.cjs (v4 -> v6):
// private to the host closure, preview token + in-lock recheck + six-party negotiation, classified readback.
// Only binding.format changes (plus the empty tombstone list); results, anchors and every other field are kept.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {hash}=require('./naming-store.cjs'),presence=require('./presence.cjs');
const fail=s=>{throw Object.assign(Error(s),{code:s})};
const TTL_MS=120000,MAX_TOKENS=4,KIND='binding-format-upgrade';
const same=(a,b)=>hash(a)===hash(b);
function disabled(){return Object.freeze({enabled:false,async preview(){fail('binding-format-upgrade-disabled')},async confirm(){fail('binding-format-upgrade-disabled')},revoke(){},close(){}})}
function createFormatUpgradeService({enabled,authority,negotiation,naming,service,isLive,now=()=>Date.now()}){
 if(enabled!==true)return disabled();
 const store=authority.store,root=store.root,tokens=new Map();let closed=false;
 const live=()=>{if(closed||authority.closed||!isLive())fail('binding-upgrade-host-closed');return true};
 const presenceBytes=()=>{const p=presence.location(store);try{return fs.readFileSync(p)}catch(e){if(e.code==='ENOENT')return null;throw e}};
 function ready(){
  const s=store.status();
  if(s.status==='unconfigured')fail('upgrade-unconfigured');
  if(s.status==='storage-missing')fail('upgrade-storage-missing');
  if(s.status==='recovery-required')fail('upgrade-store-needs-maintenance');
  if(s.status!=='ready')fail('upgrade-store-unavailable:'+s.status);
  if(s.frame.version!==6)fail('binding-upgrade-required');
  const st=s.frame.state;
  if(st.binding.format===2)fail('binding-format-upgrade-already-done');
  if(st.binding.format!==1)fail('unsupported-binding-format');
  if(st.binding.pending!==null)fail('binding-pending');
  if(st.contexts.some(c=>c.naming?.pending))fail('upgrade-naming-pending');
  const rec=path.join(root,'recovery');if(fs.existsSync(rec)&&fs.readdirSync(rec).length>=4)fail('upgrade-recovery-capacity');
  if(fs.readdirSync(root).some(n=>/^(lock-|reclaim-)/.test(n)))fail('upgrade-stale-lock-files');
  return s;
 }
 function keep(t){while(tokens.size>=MAX_TOKENS)tokens.delete(tokens.keys().next().value);tokens.set(t.id,t);}
 async function preview(modal){
  if(typeof modal!=='string'||!modal)fail('upgrade-modal-required');
  return naming.work(async guard=>{
   live();const s=ready();const att=await negotiation.attest();guard();live();att.guard();
   const again=ready();if(again.digest!==s.digest)fail('store-changed');
   const st=s.frame.state,t={id:crypto.randomUUID(),modal,digest:s.digest,frameHash:hash(s.frame),namespace:st.namespace,revision:st.revision,att,expires:now()+TTL_MS};
   keep(t);
   return {token:t.id,namespace:st.namespace,revision:st.revision,results:st.binding.results.length,anchors:st.binding.anchors.length,expiresInMs:TTL_MS};
  });
 }
 function receiptsOk(prev,next,t,rb){const last=next.at(-1),kept=prev.length>=128?prev.slice(1):prev;if(!last||next.length!==kept.length+1||!same(next.slice(0,-1),kept))return false;
  const m=/^r(\d+)_[0-9a-f-]{36}$/.exec(last.requestId||'');return !!m&&Number(m[1])===t.revision&&last.revision===rb&&last.commandHash===hash({kind:KIND,namespace:t.namespace,expectedRevision:t.revision,requestId:last.requestId});}
 function classify(t,before,beforePresence){
  let s;try{s=store.status()}catch{return {outcome:'unknown'}}
  if(s.status==='ready'&&s.frame.version===6&&s.frame.state.binding?.format===1)return {outcome:'unchanged'};
  if(s.status!=='ready'||s.frame.version!==6||s.frame.state.binding?.format!==2)return {outcome:'unknown'};
  const a=before.state,b=s.frame.state,{revision:ra,binding:ba,...restA}=a,{revision:rb,binding:bb,...restB}=b;
  const ok=rb===t.revision+1&&b.namespace===t.namespace&&same(restA,restB)&&same(before.observations,s.frame.observations)
   &&same(bb,{format:2,pending:null,results:ba.results,anchors:ba.anchors,released:[]})&&receiptsOk(before.receipts,s.frame.receipts,t,rb)
   &&Buffer.compare(beforePresence||Buffer.alloc(0),presenceBytes()||Buffer.alloc(0))===0;
  return {outcome:ok?'upgraded':'unknown',revision:rb};
 }
 async function confirm(id,modal){
  const t=tokens.get(id);tokens.delete(id);
  if(!t)fail('upgrade-preview-required');
  if(t.modal!==modal)fail('upgrade-preview-other-window');
  if(now()>t.expires)fail('upgrade-preview-expired');
  return naming.work(async guard=>{
   live();const s0=ready();if(s0.digest!==t.digest)fail('store-changed');
   const att2=await negotiation.attest();guard();live();
   const before=JSON.parse(JSON.stringify(s0.frame)),beforePresence=presenceBytes();
   const check=()=>{guard();live();if(now()>t.expires)fail('upgrade-preview-expired');t.att.guard();att2.guard();return true};
   const after=()=>live();
   let error=null;
   try{await store.formatUpgradeFrom({digest:t.digest,frameHash:t.frameHash,namespace:t.namespace,revision:t.revision},check,after);}catch(e){error=e}
   const r=classify(t,before,beforePresence);
   if(r.outcome==='upgraded'){naming.invalidate();service.invalidate();return {ok:true,revision:r.revision,warning:error?String(error.message||error):null}}
   if(r.outcome==='unchanged')throw Object.assign(error||Error('upgrade-not-applied'),{upgradeOutcome:'unchanged'});
   throw Object.assign(Error('upgrade-state-unknown'),{code:'upgrade-state-unknown',upgradeOutcome:'unknown',cause:error});
  });
 }
 return Object.freeze({enabled:true,preview,confirm,revoke(modal){for(const [k,t] of tokens)if(t.modal===modal)tokens.delete(k)},close(){closed=true;tokens.clear()}});
}
module.exports={createFormatUpgradeService};
