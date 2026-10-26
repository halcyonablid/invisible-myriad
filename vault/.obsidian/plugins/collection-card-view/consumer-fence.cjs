'use strict';
// Shared owner-local enforcement. Installation must connect guardFile to EVERY
// final writer, including standalone engines; this module alone installs none.
const crypto=require('node:crypto');
const S=require('./participant-snapshot.cjs'),A=require('./binding-anchor.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x)),fail=x=>{throw Error(x)},key=x=>String(x||'').trim().toLocaleLowerCase();
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const same=(a,b)=>stable(a)===stable(b),FIELD='centerNamingProjectionV1',permits=new WeakMap();
const HEX=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
function fileKey(s){if(typeof s!=='string'||!s||s.trim()!==s||/^(?:[a-z]:|\/)/i.test(s)||s.includes('\\')||/[\x00-\x1f:<>"|?*]/.test(s)||s.split('/').some(x=>['','.','..'].includes(x)||/[. ]$/.test(x)))fail('consumer-unsafe-path');return process.platform==='win32'?s.toLowerCase():s}
function scope(s){if(!plain(s)||Object.keys(s).sort().join('|')!=='dataPath|keywordPath|sourceNotePath')fail('consumer-scope');for(const v of Object.values(s))if(typeof v!=='string'||!v||v.trim()!==v||/^(?:[a-z]:|\/)/i.test(v)||v.includes('\\')||/[\x00-\x1f:<>"|?*]/.test(v)||v.split('/').some(p=>['','.','..'].includes(p)||/[. ]$/.test(p)))fail('consumer-scope');if(fileKey(s.dataPath)===fileKey(s.keywordPath))fail('consumer-scope');return s}
function fingerprint(e){const c={...e};delete c.keyword;delete c.keywordKey;delete c.updatedAt;return hash(c)}
class ConsumerFence{
 constructor(owner,resolveAuthority,io){this.owner=owner;this.resolveAuthority=resolveAuthority;this.io=io;this.generation=crypto.randomUUID();this.closed=false;}
 live(){if(this.closed)fail('consumer-closed');this.owner.assertLive()}
 close(){this.closed=true}
 sync(fn){const r=fn();if(r&&typeof r.then==='function'){Promise.resolve(r).catch(()=>{});fail('consumer-sync-required')}if(r===false)fail('consumer-denied');return r}
 capture(){
  this.live();const api=this.resolveAuthority();if(!api||typeof api.snapshot!=='function'||typeof api.assertCurrent!=='function')fail('consumer-authority-unavailable');
  if(typeof api.availability==='function'&&typeof api.assertAvailability==='function'){
   const proof=this.sync(()=>api.availability());this.sync(()=>api.assertAvailability(proof));
   if(proof?.version===1&&proof.state==='unconfigured')return {api,unconfigured:true,proof,generation:this.generation};
   if(proof?.state!=='configured')fail('consumer-authority-unavailable');
  }
  const s=this.sync(()=>api.snapshot());S.validate(s);if(![1,3].includes(s?.version)||typeof s.namespace!=='string'||!s.namespace||typeof s.generation!=='string'||!s.generation||!Array.isArray(s.contexts)||s.contexts.length>5000)fail('consumer-snapshot');this.sync(()=>api.assertCurrent(s));
  const seen=new Set(),bindings=new Set();for(const c of s.contexts){if(!/^ctx_[a-f0-9-]{36}$/.test(c.contextId)||seen.has(c.contextId)||!Array.isArray(c.bindings)||!['legacy','center'].includes(c.naming?.authority))fail('consumer-context');seen.add(c.contextId);for(const b of c.bindings){const k=stable(b);if(bindings.has(k))fail('consumer-binding-ambiguous');bindings.add(k)}}
  return {api,s:copy(s),generation:this.generation};
 }
 fresh(c){if(c.unconfigured)this.sync(()=>c.api.assertAvailability(c.proof));const n=this.capture();if(c.generation!==this.generation||c.api!==n.api||!!c.unconfigured!==!!n.unconfigured||!c.unconfigured&&(c.s.namespace!==n.s.namespace||c.s.generation!==n.s.generation))fail('consumer-generation-changed');return n}
 parse(raw){if(typeof raw!=='string'||Buffer.byteLength(raw)>8*1024*1024)fail('consumer-file-size');const d=JSON.parse(raw);if(!plain(d))fail('consumer-file-schema');return d}
 resolve(source){const s=scope(this.sync(()=>this.io.resolveScope(source)));if(s.sourceNotePath!==source)fail('consumer-source-changed');if(this.equivalent(s.dataPath,s.keywordPath))fail('consumer-scope');return s}
 equivalent(a,b){if(fileKey(a)===fileKey(b))return true;if(typeof this.io.sameFile!=='function')fail('consumer-file-identity-required');const same=this.io.sameFile(a,b);if(typeof same!=='boolean')fail('consumer-sync-required');return same}
 read(file){const raw=this.sync(()=>this.io.read(file));this.parse(raw);return raw}
 receipts(d){
  const m=Object.hasOwn(d,FIELD)?d[FIELD]:{};if(!plain(m)||Object.keys(m).length>5000)fail('consumer-receipts');
  for(const [id,r] of Object.entries(m)){
   if(!plain(r)||Object.keys(r).sort().join('|')!=='carrierId|contextId|namespace|newLabel|oldLabel|ownerId|planHash|scope|txId|version'||r.version!==1||r.carrierId!==id||r.ownerId!==this.owner.c.pluginId||!/^ctx_[a-f0-9-]{36}$/.test(r.contextId)||typeof r.namespace!=='string'||!r.namespace||!UUID.test(r.txId)||!HEX.test(r.planHash)||typeof r.oldLabel!=='string'||typeof r.newLabel!=='string')fail('consumer-receipt');scope(r.scope);
  }return m;
 }
 rows(snapshot){const rows=snapshot.contexts.filter(c=>c.naming.authority==='center').flatMap(c=>c.bindings.filter(b=>b.ownerId===this.owner.c.pluginId).map(b=>({context:c,binding:b,scope:this.resolve(b.sourceScope)})));const files=new Map();for(const r of rows)for(const p of [r.scope.dataPath,r.scope.keywordPath]){const k=fileKey(p),prior=files.get(k);if(prior&&prior!==r.scope.sourceNotePath)fail('consumer-source-alias-conflict');files.set(k,r.scope.sourceNotePath)}return rows}
 entry(d,id){const m=d[this.owner.c.map];if(!plain(m))fail('consumer-keyword-schema');const matches=Object.entries(m).filter(([,v])=>plain(v)&&String(v[this.owner.c.id])===id);if(matches.length!==1)fail('consumer-binding-missing-or-ambiguous');const [k,e]=matches[0];if(key(k)!==key(e.keyword))fail('consumer-keyword-key');return {k,e}}
 guardFile(file,before,after,permit=null){fileKey(file);return this.check(file,before,after,this.capture(),permit)}
 // Final predicate shared by guardFile and the claim dry-run (C1 A1); `captured` is a real capture or its local copy.
 check(file,before,after,captured,permit=null){
  const fileIdentity=fileKey(file),a=before===null?{}:this.parse(before),b=this.parse(after);
  this.bindingCheck(file,a,b,captured);
  if(captured.unconfigured){if(Object.keys(this.receipts(a)).length||Object.keys(this.receipts(b)).length)fail('consumer-receipt-without-authority');this.fresh(captured);return true}
  const rows=this.rows(captured.s),saved=permit&&permits.get(permit);
  if(before===null&&rows.some(r=>this.equivalent(file,r.scope.dataPath)||this.equivalent(file,r.scope.keywordPath)))fail('consumer-managed-file-missing');
  if(saved&&(saved.fence!==this||saved.file!==file||saved.before!==before||saved.after!==after))fail('consumer-permit');
  let exempt=null;if(saved){this.trusted(saved.plan,saved.txId,saved.capture);exempt=saved.contextId}
  const ar=this.receipts(a),br=this.receipts(b),ac=copy(ar),bc=copy(br);
  if(exempt){const id=saved.plan.targets[0]?.carrierId;delete ac[id];delete bc[id]}
  if(!same(ac,bc)||!exempt&&Object.hasOwn(a,FIELD)!==Object.hasOwn(b,FIELD))fail('consumer-receipt-changed');
  for(const r of Object.values(ar)){
   const row=rows.find(x=>x.context.contextId===r.contextId&&x.binding.carrierId===r.carrierId&&x.binding.sourceScope===r.scope.sourceNotePath);
   if(r.namespace!==captured.s.namespace||!row||!same(row.scope,r.scope)||!this.equivalent(file,r.scope.keywordPath))fail('consumer-receipt-orphan');
  }
  for(const row of rows){const {context:c,binding:ref,scope:s}=row;
   if(this.equivalent(file,s.dataPath)){const old=a[this.owner.c.carriers],next=b[this.owner.c.carriers];if(!plain(old)||!plain(next)||!plain(old[ref.carrierId])||!plain(next[ref.carrierId]))fail('consumer-carrier-deleted');}
   if(!this.equivalent(file,s.keywordPath))continue;
   const old=this.entry(a,ref.carrierId),next=this.entry(b,ref.carrierId);
   if(old.e.sourceNotePath&&old.e.sourceNotePath!==s.sourceNotePath||next.e.sourceNotePath&&next.e.sourceNotePath!==s.sourceNotePath)fail('consumer-entry-source');
   if(![c.canonicalLabel,c.naming.pending?.oldLabel].includes(old.e.keyword))fail('consumer-label-drift');
   if(c.contextId!==exempt&&!same(old,next))fail('consumer-managed-binding-changed');
   // Final callback invokes this synchronously, after the asynchronous queue.
   const carriers=this.parse(this.read(s.dataPath))[this.owner.c.carriers];if(!plain(carriers)||!plain(carriers[ref.carrierId]))fail('consumer-carrier-deleted');
  }
  if(saved){const t=this.trusted(saved.plan,saved.txId,saved.capture);if(this.inspectState(before,saved.plan,saved.txId,t).state!=='before'||this.inspectState(after,saved.plan,saved.txId,t).state!=='after')fail('consumer-permit-transition')}
  this.fresh(captured);return true;
 }
 bindingCheck(file,a,b,captured){
  const has=d=>Object.hasOwn(d,S.NEW);
  if(captured.unconfigured||captured.s.version!==3||this.owner.c.pluginId!=='collection-card-view'){
   S.rejectForeign(a);S.rejectForeign(b);return;
  }
  if(has(a)!==has(b)||has(a)&&!same(a[S.NEW],b[S.NEW]))fail('consumer-binding-receipt-changed');
  const relevant=this.rows(captured.s).filter(r=>this.equivalent(file,r.scope.dataPath)||this.equivalent(file,r.scope.keywordPath));
  let keyword=false;const checked=new Set();
  for(const r of relevant){const sc=r.scope;if(checked.has(sc.sourceNotePath))continue;checked.add(sc.sourceNotePath);
   if(this.equivalent(file,sc.keywordPath)){keyword=true;A.assertReceipts(captured.s,sc,a);A.assertReceipts(captured.s,sc,b);}
   else {S.rejectForeign(a);S.rejectForeign(b);A.assertReceipts(captured.s,sc,this.parse(this.read(sc.keywordPath)));}
  }
  if(!keyword&&(has(a)||has(b)))for(const r of (captured.s.binding?.released||[])){if(!r.receiptHash||r.ref.ownerId!==this.owner.c.pluginId||checked.has(r.ref.sourceScope))continue;let sc;try{sc=this.resolve(r.ref.sourceScope)}catch{continue}checked.add(sc.sourceNotePath);if(this.equivalent(file,sc.keywordPath)){keyword=true;A.assertReceipts(captured.s,sc,a);A.assertReceipts(captured.s,sc,b);}}
  if(!keyword&&(has(a)||has(b)))fail('consumer-binding-receipt-outside-keywords');
 }
 // C1 claim dry-run (read only): the real snapshot passes assertCurrent, then a local copy marks the context as
 // center and every file the final guard would cover must pass the same predicate unchanged.
 hypothetical(contextId){
  const real=this.capture();if(real.unconfigured)fail('consumer-claim-unconfigured');
  const s=copy(real.s),c=s.contexts.find(x=>x.contextId===contextId);if(!c)fail('consumer-claim-context');
  c.naming={...c.naming,authority:'center',pending:null};return {api:real.api,s,generation:real.generation,context:c};
 }
 dryRunClaim(contextId){
  this.live();const h=this.hypothetical(contextId),files=new Map();
  // Rename feasibility first: one binding per owner (C1 R2), then the final predicate on every covered file.
  const mine=h.context.bindings.filter(b=>b.ownerId===this.owner.c.pluginId);if(mine.length>1)fail('consumer-claim-multiple-bindings');
  for(const r of this.rows(h.s))for(const f of [r.scope.dataPath,r.scope.keywordPath])files.set(fileKey(f),f);
  for(const f of files.values()){const raw=this.read(f);this.check(f,raw,raw,h,null)}
  for(const b of mine)this.sameName(this.resolve(b.sourceScope),h.context.canonicalLabel,b.carrierId);
  return {generation:this.generation,digest:this.claimDigest(h.context)};
 }
 // Exact-name entries of `label` in the scope's keyword file must be exactly `carrierId` (or none when unbound).
 sameName(sc,label,carrierId=null){
  const raw=this.sync(()=>this.io.read(sc.keywordPath)),m=raw===null?{}:this.parse(raw)[this.owner.c.map];if(!plain(m))fail('consumer-keyword-schema');
  const hits=Object.values(m).filter(e=>plain(e)&&key(e.keyword)===key(label));
  if(carrierId===null?hits.length!==0:hits.length!==1||String(hits[0][this.owner.c.id])!==carrierId)fail('consumer-claim-unbound-same-name');
 }
 // R3 content digest: each bound keyword entry plus carrier presence, re-read synchronously by the lease.
 claimDigest(context){
  const out=[];for(const b of context.bindings.filter(b=>b.ownerId===this.owner.c.pluginId)){const sc=this.resolve(b.sourceScope),e=this.entry(this.parse(this.read(sc.keywordPath)),b.carrierId),carriers=this.parse(this.read(sc.dataPath))[this.owner.c.carriers];
   out.push({binding:b,scope:sc,entry:e,carrier:plain(carriers)&&plain(carriers[b.carrierId])})}
  return hash(stable(out));
 }
 trusted(plan,txId,captured){
  if(!UUID.test(txId))fail('consumer-transaction');const n=this.fresh(captured);if(n.unconfigured)fail('consumer-confirmation-required');const hits=n.s.contexts.filter(c=>c.naming.authority==='center'&&c.naming.pending?.txId===txId&&c.naming.pending.plans?.some(r=>r.ownerId===this.owner.c.pluginId&&same(r.plan,plan)));
  if(hits.length!==1)fail('consumer-confirmation-required');const c=hits[0],row=c.naming.pending.plans.find(r=>r.ownerId===this.owner.c.pluginId);
  if(row.id!==this.owner.c.pluginId||row.subject!==null||!same(row.bindings,c.bindings.filter(b=>b.ownerId===this.owner.c.pluginId))||plan.newDisplayLabel!==c.canonicalLabel||plan.pluginId!==this.owner.c.pluginId||plan.version!==2||!Array.isArray(plan.targets)||plan.targets.length>1||!same(this.resolve(plan.scope.sourceNotePath),plan.scope)||plan.targets.length!==row.bindings.length)fail('consumer-fixed-plan');
  for(const t of plan.targets)if(!row.bindings.some(b=>b.carrierId===t.carrierId&&b.sourceScope===plan.scope.sourceNotePath))fail('consumer-fixed-binding');
  return {n,c,row};
 }
 receipt(plan,txId,t){return {version:1,ownerId:this.owner.c.pluginId,namespace:t.n.s.namespace,contextId:t.c.contextId,carrierId:plan.targets[0].carrierId,scope:copy(plan.scope),txId,planHash:hash(t.row),oldLabel:t.c.naming.pending.oldLabel,newLabel:plan.newDisplayLabel}}
 inspectState(raw,plan,txId,t){
  this.bindingCheck(plan.scope.keywordPath,this.parse(raw),this.parse(raw),t.n);
  const data=this.parse(raw),receipts=this.receipts(data),carriers=this.parse(this.read(plan.scope.dataPath))[this.owner.c.carriers];
  const changes=this.owner.inspect(plan,{data,carriers});
  if(!plan.targets.length)return {state:'after',receiptHash:hash({namespace:t.n.s.namespace,contextId:t.c.contextId,txId,planHash:hash(t.row),empty:true})};
  const target=plan.targets[0],entry=this.entry(data,target.carrierId).e,expected=this.receipt(plan,txId,t);
  if(changes.length===1&&entry.keyword===t.c.naming.pending.oldLabel){if(receipts[target.carrierId]?.txId===txId)fail('consumer-receipt-conflict');return {state:'before',receiptHash:hash(expected)}}
  if(changes.length===0&&entry.keyword===plan.newDisplayLabel&&same(receipts[target.carrierId],expected))return {state:'after',receiptHash:hash(expected)};
  fail('consumer-unknown-acknowledgement');
 }
 async inspect(plan,txId){const c=this.capture();return this.owner.enqueue(plan.scope,async()=>{const t=this.trusted(plan,txId,c),r=this.inspectState(this.read(plan.scope.keywordPath),plan,txId,t);this.trusted(plan,txId,c);return {...r,txId,planHash:hash(t.row)}})}
 async apply(plan,txId,lease){
  if(typeof lease!=='function')fail('consumer-lease-required');const c=this.capture();return this.owner.enqueue(plan.scope,async()=>{
   this.sync(lease);const t=this.trusted(plan,txId,c),file=plan.scope.keywordPath,before=this.read(file),r=this.inspectState(before,plan,txId,t);if(r.state==='after')return {alreadyApplied:true};
   const next=this.parse(before),target=plan.targets[0],old=this.entry(next,target.carrierId);delete next[this.owner.c.map][old.k];
   const entry={...old.e,keyword:plan.newDisplayLabel};if(Object.hasOwn(entry,'keywordKey'))entry.keywordKey=key(plan.newDisplayLabel);next[this.owner.c.map][key(plan.newDisplayLabel)]=entry;
   next[FIELD]={...this.receipts(next),[target.carrierId]:this.receipt(plan,txId,t)};const after=JSON.stringify(next,null,2),permit={};
   permits.set(permit,{fence:this,file,before,after,plan:copy(plan),txId,capture:c,contextId:t.c.contextId});
   try{
    this.guardFile(file,before,after,permit);await this.io.backup(file,before,txId);this.sync(lease);
    await this.io.process(file,current=>{this.sync(lease);if(current!==before)fail('consumer-revision-conflict');this.guardFile(file,current,after,permit);return after});
    this.sync(lease);const fresh=this.trusted(plan,txId,c),result=this.inspectState(this.read(file),plan,txId,fresh);if(result.state!=='after')fail('consumer-readback');return {alreadyApplied:false};
   }finally{permits.delete(permit)}
  });
 }
}
// C1: the consumer module registers the RenameOwner publication function it installs; a participant reports
// capabilities only while that exact function is still the owner's final writer.
const issued=new WeakSet();
function issueProcess(fn){if(typeof fn!=='function')fail('consumer-process');issued.add(fn);return fn}
const CAPABILITIES=['native-rename','binding-edit','legacy-rename','v2-commit','creation','persist'];
// One read-only/projection participant per consumer owner. `defaultScope()` must return the owner's deterministic
// scope for an unbound context (unique resolution, C1 A3) or throw.
function createConsumerParticipant({fence,ownerId,owner,api,defaultScope,ready=()=>true}){
 const installedProcess=owner.c.process,C=require('./binding-compatibility-checks.cjs'),ownerMethods=C.pinMethods(owner,['enqueue','assertLive','read','prepare','inspect','assertFreshSave']),installedIO=fence.io,ioMethods=C.pinMethods(installedIO,['resolveScope','sameFile','read','readOptional','backup','process']);
 const installed=()=>{if(owner.c.process!==installedProcess||fence.io!==installedIO)fail('binding-writer-changed');ownerMethods();ioMethods();return true};
 const live=()=>{try{fence.live();return issued.has(owner.c.process)&&ready()===true}catch{return false}};
 const need=()=>{if(!live())fail('consumer-participant-unavailable')};
 const mine=c=>{const b=c.bindings.filter(x=>x.ownerId===ownerId);if(b.length>1)fail('consumer-claim-multiple-bindings');return b};
 const unbound=c=>{const d=scope(defaultScope());fence.sameName(d,c.canonicalLabel,null);return d};
 const digestOf=(r,d)=>hash(stable([r,d]));
 const participant=Object.freeze({ownerId,
  bindingCompatibility(){need();installed();C.validator(S);const method=C.pinPrototype(fence,ConsumerFence.prototype),w=C.pinMethods(owner),process=owner.c.process,generation=fence.generation,auth=C.pinAuthority(()=>fence.resolveAuthority(),()=>owner.c.app.vault.adapter.getBasePath());const guard=()=>{need();installed();if(owner.c.process!==process||fence.generation!==generation)fail('binding-writer-changed');method();w();auth();return true};guard();const proof=Object.freeze({version:1,ownerId,generation,bindingFormat:S.BINDING_FORMAT});compatibilityProofs.set(proof,{part:participant,guard});return proof;},
  status(){const ok=live();return {ownerId,mode:ok?'ready':'unavailable',generation:fence.generation,capabilities:ok?CAPABILITIES.slice():[]}},
  async evidence(c){need();const r=fence.dryRunClaim(c.contextId),d=mine(c).length?null:unbound(c);return {ownerId,generation:r.generation,digest:digestOf(r.digest,d),defaultScope:d,pending:[]}},
  digestNow(c){need();const d=mine(c).length?null:unbound(c);return digestOf(fence.claimDigest(c),d)},
  async prepare(c,newLabel){need();const b=mine(c),sc=b.length?fence.resolve(b[0].sourceScope):unbound(c);
   const r=await owner.prepare({oldDisplayLabel:c.canonicalLabel,newDisplayLabel:newLabel},sc);need();const ids=r.plan.targets.map(t=>t.carrierId);
   if(b.length?ids.length!==1||ids[0]!==b[0].carrierId:ids.length!==0)fail('consumer-plan-targets');return {id:ownerId,ownerId,subject:null,bindings:copy(b),plan:r.plan}},
  // NamingService hands the whole frozen row; the owner executor receives only its plan (C1 S2).
  inspect(row,txId){need();return api.inspect(row.plan,txId)},
  apply(row,txId,lease){need();return api.apply(row.plan,txId,lease)}
 });
 return participant;
}
module.exports={ConsumerFence,FIELD,issueProcess,createConsumerParticipant,CAPABILITIES};

const compatibilityProofs=new WeakMap();
function verifyBindingCompatibility(part,proof){const r=compatibilityProofs.get(proof);if(!r||r.part!==part)throw Error('binding-proof-unissued');r.guard();return r.guard;}
module.exports.verifyBindingCompatibility=verifyBindingCompatibility;
