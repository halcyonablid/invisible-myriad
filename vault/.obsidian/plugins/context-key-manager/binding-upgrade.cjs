'use strict';
// C3 explicit storage upgrade (v4 -> v6). Private to the host closure; never exposed on public plugin APIs.
// Gated off by default: the host enables it only together with the BindingService (same review, same deployment).
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {hash}=require('./naming-store.cjs'),binding=require('./binding-model.cjs'),presence=require('./presence.cjs'),K=require('./binding-transition.cjs');
const fail=s=>{throw Object.assign(Error(s),{code:s})};
const TTL_MS=120000,MAX_TOKENS=4;
const same=(a,b)=>hash(a)===hash(b);
function disabled(){return Object.freeze({enabled:false,async preview(){fail('binding-upgrade-disabled')},async confirm(){fail('binding-upgrade-disabled')},revoke(){},close(){}})}
function createUpgradeService({enabled,authority,negotiation,naming,service,isLive,now=()=>Date.now()}){
 if(enabled!==true)return disabled();
 const store=authority.store,root=store.root,tokens=new Map();let closed=false;
 const live=()=>{if(closed||authority.closed||!isLive())fail('binding-upgrade-host-closed');return true};
 const presenceBytes=()=>{const p=presence.location(store);try{return fs.readFileSync(p)}catch(e){if(e.code==='ENOENT')return null;throw e}};
 // Readiness of the store for an explicit upgrade (R8, R11). Read only.
 function ready(){
  const s=store.status();
  if(s.status==='unconfigured')fail('upgrade-unconfigured');
  if(s.status==='storage-missing')fail('upgrade-storage-missing');
  if(s.status==='recovery-required')fail('upgrade-store-needs-maintenance');
  if(s.status!=='ready')fail('upgrade-store-unavailable:'+s.status);
  const v=s.frame.version;
  if(v===3)fail('upgrade-needs-center-naming');
  if(v===6)fail('upgrade-already-done');
  if(v!==4)fail('upgrade-unsupported-version');
  const st=s.frame.state;
  if(st.binding!==undefined)fail('upgrade-already-done');
  if(st.contexts.some(c=>c.naming?.pending))fail('upgrade-naming-pending');
  const rec=path.join(root,'recovery');if(fs.existsSync(rec)&&fs.readdirSync(rec).length>=4)fail('upgrade-recovery-capacity');
  if(fs.readdirSync(root).some(n=>/^(lock-|reclaim-)/.test(n)))fail('upgrade-stale-lock-files');
  if(s.frame.receipts===undefined)fail('upgrade-unsupported-version');
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
   return {token:t.id,namespace:st.namespace,revision:st.revision,contexts:st.contexts.length,centerManaged:st.contexts.filter(c=>c.naming?.authority==='center').length,expiresInMs:TTL_MS};
  });
 }
 // A4: earlier receipts unchanged (aligned when the 128-entry window rolled over); the last one is exactly this upgrade.
 function receiptsOk(prev,next,t,rb){const last=next.at(-1),kept=prev.length>=128?prev.slice(1):prev;if(!last||next.length!==kept.length+1||!same(next.slice(0,-1),kept))return false;
  const m=/^r(\d+)_[0-9a-f-]{36}$/.exec(last.requestId||'');return !!m&&Number(m[1])===t.revision&&last.revision===rb&&last.commandHash===hash({kind:'upgrade-binding',namespace:t.namespace,expectedRevision:t.revision,requestId:last.requestId});}
 // R5: classify the store after the attempt, on success and failure alike.
 function classify(t,before,beforePresence){
  let s;try{s=store.status()}catch{return {outcome:'unknown'}}
  // F1: a ready v4 store (no WAL, no writer lock) was not upgraded, even if another writer changed it meanwhile.
  if(s.status==='ready'&&s.frame.version===4)return {outcome:'unchanged'};
  if(s.status!=='ready'||s.frame.version!==6)return {outcome:'unknown'};
  const a=before.state,b=s.frame.state,{revision:ra,...restA}=a,{revision:rb,...restB}=binding.prior(b);
  const ok=rb===t.revision+1&&b.namespace===t.namespace&&same(restA,restB)&&same(before.observations,s.frame.observations)
   &&same(b.binding,{format:K.BINDING_FORMAT,pending:null,results:[],anchors:[],released:[]})&&b.schemaVersion===4&&receiptsOk(before.receipts,s.frame.receipts,t,rb)
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
   // Pre-WAL participant check: runs inside the writer lock before the pending record is written.
   const check=()=>{guard();live();if(now()>t.expires)fail('upgrade-preview-expired');t.att.guard();att2.guard();return true};
   // Post-WAL lease: the WAL target is fixed and maintenance replays it without calling any owner, so only the
   // host's liveness is asserted here (lock ownership is asserted by the store itself on every lease).
   const after=()=>live();
   let error=null;
   try{await store.upgradeBindingFrom({digest:t.digest,frameHash:t.frameHash,namespace:t.namespace,revision:t.revision},check,after);}catch(e){error=e}
   const r=classify(t,before,beforePresence);
   if(r.outcome==='upgraded'){naming.invalidate();service.invalidate();return {ok:true,revision:r.revision,warning:error?String(error.message||error):null}}
   if(r.outcome==='unchanged')throw Object.assign(error||Error('upgrade-not-applied'),{upgradeOutcome:'unchanged'});
   throw Object.assign(Error('upgrade-state-unknown'),{code:'upgrade-state-unknown',upgradeOutcome:'unknown',cause:error});
  });
 }
 return Object.freeze({enabled:true,preview,confirm,revoke(modal){for(const [k,t] of tokens)if(t.modal===modal)tokens.delete(k)},close(){closed=true;tokens.clear()}});
}
module.exports={createUpgradeService};
