"use strict";
const {NamingStore,hash,uuid}=require('./naming-store.cjs');
const model=require('./naming-model.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=x=>{throw Error(x);};
const FENCES=Object.freeze({
 'context-key-manager':['registration-bind','creation'],
 'project-execution-overview':['comment-save','comment-clear','rename','legacy-retry','creation','saveData'],
 'mandala-time-blocks':['primary-title','primary-keywords','primary-recovery','creation','persist'],
 'workspace-mount':['native-rename','binding-edit','legacy-rename','v2-commit','creation','persist'],
 'gtd-task-manager':['native-rename','binding-edit','legacy-rename','v2-commit','creation','persist'],
 'collection-card-view':['native-rename','binding-edit','legacy-rename','v2-commit','creation','persist']
});
function fences(rows){
 if(!Array.isArray(rows)||rows.length!==Object.keys(FENCES).length)fail('writer-fence-proof-invalid');
 for(const [ownerId,capabilities] of Object.entries(FENCES)){
   const matches=rows.filter(x=>x.ownerId===ownerId),r=matches[0];
   if(matches.length!==1||r.mode!=='ready'||typeof r.generation!=='string'||!r.generation||!Array.isArray(r.capabilities)||hash([...r.capabilities].sort())!==hash([...capabilities].sort()))fail('writer-fence-missing:'+ownerId);
 }
}
function proof(c,p){
 if(!p||p.version!==1||p.complete!==true||!Array.isArray(p.pending)||p.pending.length||!Array.isArray(p.fences))fail('legacy-writers-not-quiescent');
 if(hash(p.subject)!==hash(c.subjects[0])||hash(p.bindings)!==hash(c.bindings)||p.label!==c.canonicalLabel)fail('legacy-evidence-changed');
 if(!/^[a-f0-9]{64}$/.test(p.declarationHash)||!Array.isArray(p.fences)||p.fences.length!==Object.keys(FENCES).length)fail('writer-fence-proof-invalid');
 fences(p.fences);
 return p;
}
const HARNESS=Symbol.for('ckm.naming.test-harness');
// Production proofs are verified by the adapter module itself; nothing passed by a caller can stand in for it.
const production=()=>require('./naming-adapter.cjs');
class NamingService {
 constructor(store,adapter,{allowInternalHarness=false,timeoutMs=10000,onSettled=null}={}){this.onSettled=typeof onSettled==='function'?onSettled:null;
   // C1 A4: the internal harness only counts when test code set the module-level hook; production never sets it.
   this.store=store;this.adapter=adapter;this.internal=allowInternalHarness===true&&globalThis[HARNESS]===true;this.timeoutMs=timeoutMs;this.closed=false;this.busy=false;this.epoch=0;this.previews=new Map();
 }
 invalidate(){this.epoch++;this.previews.clear();}
 close(){this.closed=true;this.invalidate();}
 async work(fn){
   if(this.closed)fail('service-closed');if(this.busy)fail('service-busy');this.busy=true;
   const epoch=this.epoch,deadline=Date.now()+this.timeoutMs;let expired=false;const timer=setTimeout(()=>{expired=true;},this.timeoutMs);
   const guard=()=>{if(this.closed||epoch!==this.epoch||expired)fail(expired?'operation-timeout':'service-stale');};
   guard.remainingMs=()=>Math.max(0,deadline-Date.now());
   // Do not release the exclusive writer while an owner still has an outstanding
   // call. Timeout revokes publication permission; late results cannot complete.
   // Settled = the exclusive writer (if any) has been released; owners may now refresh views from disk.
   try{guard();return await fn(guard);}finally{clearTimeout(timer);this.busy=false;if(this.onSettled){const f=this.onSettled;setTimeout(()=>{try{f();}catch{}},0);}}
 }
 read(id){const s=this.store.status();if(s.status!=='ready')fail(s.status);return {status:s,c:id?s.frame.state.contexts.find(c=>c.contextId===id):null};}
 view(id){if(this.closed)fail('service-closed');const {status,c}=this.read(id),enabled=this.internal||production().isAdapter(this.adapter);return copy({version:1,namespace:status.frame.state.namespace,revision:status.frame.state.revision,item:c||null,authorityEnabled:enabled,implementation:this.internal?'internal-harness':enabled?'production-adapter':'adapter-not-installed'});}
 keep(p){while(this.previews.size>=16)this.previews.delete(this.previews.keys().next().value);const token=uuid();this.previews.set(token,{...copy(p),epoch:this.epoch,expires:Date.now()+300000});const enabled=this.internal||production().isAdapter(this.adapter);return copy({token,...p,canActivate:enabled,reason:enabled?'':'production-writer-adapters-not-installed'});}
 take(token,kind){const p=this.previews.get(token);if(!p||p.kind!==kind||p.epoch!==this.epoch||Date.now()>p.expires)fail('preview-expired');return p;}
 // Per command (C1 R9): the proof must be an adapter-issued object of the expected kind for this context.
 activation(kind,proof,contextId=null){if(this.internal)return;production().verify(this.adapter,kind,proof,contextId);}
 // No method of an adapter this module did not create is ever called outside the internal harness.
 trustedAdapter(){if(!this.internal&&!production().isAdapter(this.adapter))fail('production-adapter-proof-invalid');}
 async previewUpgrade(){return this.work(async guard=>{const {status}=this.read();if(status.frame.version!==3)fail('already-upgraded');guard();return this.keep({kind:'upgrade',digest:status.digest,namespace:status.frame.state.namespace,revision:status.frame.state.revision});});}
 async confirmUpgrade(token){return this.work(async guard=>{const p=this.take(token,'upgrade');if(this.store.status().digest!==p.digest)fail('store-changed');
   // Upgrade gate: all six participants attest every capability now (C1 R9/A9).
   this.trustedAdapter();const att=this.internal?{guard:()=>true}:await this.adapter.attest();guard();this.activation('attest',att);
   const r=await this.store.exclusive(tx=>{guard();att.guard();return tx.commit({kind:'upgrade-naming'});},()=>{guard();att.guard();},p.digest);this.invalidate();return copy(r);});}
 async capture(c,guard){
   this.trustedAdapter();if(typeof this.adapter?.capture!=='function')fail('writer-fence-provider-missing');
   const x=await this.adapter.capture(copy(c),guard);guard();if(typeof x?.guard!=='function')fail('writer-fence-lease-missing');if(!this.internal)production().verify(this.adapter,'capture',x,c.contextId);x.guard();proof(c,x.evidence);return x;
 }
 async previewClaim(id){return this.work(async guard=>{const {status,c}=this.read(id);if(!c||c.naming?.authority!=='legacy')fail('legacy-context-required');const x=await this.capture(c,guard);guard();return this.keep({kind:'claim',id,digest:status.digest,evidence:x.evidence});});}
 async confirmClaim(token){return this.work(async guard=>{
   const p=this.take(token,'claim'),{status,c}=this.read(p.id);if(status.digest!==p.digest)fail('store-changed');const x=await this.capture(c,guard);this.activation('capture',x,c.contextId);if(hash(x.evidence)!==hash(p.evidence))fail('preview-evidence-changed');
   const result=await this.store.exclusive(tx=>{guard();x.guard();return tx.commit({kind:'claim-naming',contextId:p.id,label:c.canonicalLabel,subject:c.subjects[0],bindings:c.bindings,proofHash:hash(x.evidence)});},()=>{guard();x.guard();},p.digest);this.invalidate();return copy(result);
 });}
 async prepare(c,newLabel,guard){
   this.trustedAdapter();const x=await this.adapter.prepare(copy(c),newLabel,guard);guard();if(typeof x?.guard!=='function')fail('projection-lease-missing');if(!this.internal)production().verify(this.adapter,'prepare',x,c.contextId);x.guard();model.validatePlans(c,x.plans,newLabel,c.canonicalLabel);return x;
 }
 async previewRename(id,newLabel){return this.work(async guard=>{
   const {status,c}=this.read(id);if(!c||c.naming?.authority!=='center'||c.naming.pending)fail('context-not-ready-for-rename');
   if(!model.label(newLabel)||model.address(newLabel)!==model.address(c.canonicalLabel)||newLabel.toLocaleLowerCase()===c.canonicalLabel.toLocaleLowerCase())fail('rename-label-invalid');
   const e=await this.capture(c,guard),p=await this.prepare(c,newLabel,guard);guard();e.guard();
   return this.keep({kind:'rename',id,newLabel,digest:status.digest,evidence:e.evidence,plans:p.plans,txId:uuid()});
 });}
 async confirmRename(token){return this.work(async guard=>{
   const p=this.take(token,'rename'),{status,c}=this.read(p.id);if(status.digest!==p.digest)fail('store-changed');
   const e=await this.capture(c,guard),plans=await this.prepare(c,p.newLabel,guard);guard();e.guard();this.activation('capture',e,c.contextId);this.activation('prepare',plans,c.contextId);
   if(hash(e.evidence)!==hash(p.evidence)||hash(plans.plans)!==hash(p.plans))fail('preview-evidence-changed');
   const r=await this.store.exclusive(tx=>tx.commit({kind:'rename',contextId:c.contextId,newLabel:p.newLabel,txId:p.txId,plans:p.plans}),()=>{guard();e.guard();plans.guard();},p.digest);
   this.invalidate();return copy({txId:p.txId,canonicalLabel:p.newLabel,projection:'pending',revision:r.state.revision});
 });}
 async resume(id){return this.work(async guard=>{
   // Checked before the exclusive write: a refusal here must not leave the store in recovery-required.
   this.trustedAdapter();
   const result=await this.store.exclusive(async tx=>{
     const current=()=>tx.read().state.contexts.find(c=>c.contextId===id);
     const c=current();if(!c?.naming?.pending)fail('projection-not-pending');
     const fixed=copy(c.naming.pending),hashes=fixed.plans.map(hash);
     // open supplies exact frozen plans to original owner adapters. No prepare,
     // name rediscovery, legacy journal confirm, or automatic timer is allowed.
     const session=await this.adapter.open(copy(c),tx.guard,tx.read().state.namespace);tx.guard();this.activation('session',session,id);
     if(!session||typeof session.guard!=='function'||typeof session.inspect!=='function'||typeof session.apply!=='function')fail('projection-session-invalid');
     if(session.contextId!==id||session.namespace!==tx.read().state.namespace||session.pendingHash!==hash(fixed))fail('projection-session-mismatch');fences(session.fences);
     const lease=()=>{tx.guard();session.guard();};
     const inspect=async i=>{lease();const r=await session.inspect(copy(fixed.plans[i]),fixed.txId,lease);lease();if(!r||r.planHash!==hashes[i]||r.txId!==fixed.txId||!['before','after'].includes(r.state)||!r.receiptHash||!/^[a-f0-9]{64}$/.test(r.receiptHash))fail('projection-inspection-invalid');return r;};
     // Check all previously verified steps BEFORE attempting any later step.
     for(let i=0;i<fixed.plans.length;i++)if(fixed.progress[i].verified){const r=await inspect(i);if(r.state!=='after'||r.receiptHash!==fixed.progress[i].receiptHash)fail('verified-projection-regressed');}
     for(let i=0;i<fixed.plans.length;i++){
       if(current().naming.pending.progress[i].verified)continue;
       let r=await inspect(i);
       if(r.state==='before'){
         lease();tx.commit({kind:'attempt',contextId:id,txId:fixed.txId,step:i});lease();
         try{await session.apply(copy(fixed.plans[i]),fixed.txId,lease);}catch(error){lease();/* Unknown ack is resolved by exact inspect, never a second blind write. */}
         r=await inspect(i);if(r.state!=='after')fail('projection-still-pending');
       }
       lease();tx.commit({kind:'verified',contextId:id,txId:fixed.txId,step:i,receiptHash:r.receiptHash});
     }
     for(let i=0;i<fixed.plans.length;i++){
       const r=await inspect(i),saved=current().naming.pending.progress[i];if(r.state!=='after'||r.receiptHash!==saved.receiptHash)fail('verified-projection-regressed');
     }
     lease();const frame=tx.commit({kind:'finish',contextId:id,txId:fixed.txId});lease();
     return {ok:true,contextId:id,txId:fixed.txId,revision:frame.state.revision,projection:'verified'};
   },guard);this.invalidate();return result;
 });}
}
module.exports={NamingService,FENCES,proof};
