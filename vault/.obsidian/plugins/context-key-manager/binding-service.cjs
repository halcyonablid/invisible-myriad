'use strict';
// C3 Y1 BindingService: Collection single-source replace | add | remove (binding format 2). Host-private.
const {randomUUID}=require('node:crypto'),K=require('./binding-transition.cjs'),M=require('./binding-model.cjs'),N=require('./naming-adapter.cjs'),G=require('./binding-negotiation.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>K.hash(a)===K.hash(b),fail=s=>{throw Error(s)};
const SCOPE='same-source-project-collection-v2';
const adapters=new WeakSet(),permits=new WeakMap(),requests=new WeakMap();
function verifyPermit(permit,part,contextId){const p=permits.get(permit);if(!p||p.part!==part||p.contextId!==contextId)fail('binding-permit-unissued');p.identity();return p;}
// Creation plans own their carrier tab 'tab_ck_<plan uuid>' until complete (center-peo-projection creationTouches).
const creationTab=job=>job.source==='context-creation-v1'&&/^create-[a-f0-9-]{36}$/.test(job.id)?'tab_ck_'+job.id.slice(7):null;
function createBindingAdapter({app,namingAdapter,negotiation}){
 if(!N.isAdapter(namingAdapter))fail('binding-real-adapter-required');
 if(!G.isNegotiator(negotiation))fail('binding-real-negotiator-required');
 const adapter=Object.freeze({
  async open(c,request){
   const req=requests.get(request);if(!req||req.adapter!==adapter||req.contextId!==c.contextId)fail('binding-service-request-unissued');
   const guard=()=>{if(requests.get(request)!==req)fail('binding-service-request-expired');return req.guard()};guard();
   const proof=await namingAdapter.attest();N.verify(namingAdapter,'attest',proof);guard();proof.guard();
   const bp=await negotiation.attest();guard();bp.guard();
   const plugin=app.plugins?.plugins?.['collection-card-view'],part=plugin?.getCenterBindingParticipantV1?.(),status=part?.status();
   if(status?.version!==1||status.mode!=='ready'||status.operation!==SCOPE)fail('binding-writer-unavailable');
   const identity=()=>{guard();proof.guard();bp.guard();if(app.plugins?.plugins?.['collection-card-view']!==plugin||plugin.getCenterBindingParticipantV1()!==part||part.status().generation!==status.generation)fail('binding-writer-changed');return true};
   const peo=app.plugins?.plugins?.['project-execution-overview']?.getCenterNamingParticipantV1();
   if(typeof peo?.bindingPending!=='function')fail('binding-journal-reader-unavailable');
   const jobsFor=async ctx=>{identity();const jobs=await peo.bindingPending(copy(ctx));identity();if(!Array.isArray(jobs))fail('binding-journal-invalid');return jobs};
   const quiescent=async()=>{const jobs=await jobsFor(c);if(jobs.length)throw Object.assign(Error('legacy-writers-not-quiescent'),{pendingJobs:copy(jobs),sourceScope:c.subjects[0].sourceScope});};
   // R9 (Q6): a target tab must not be touched by any unfinished creation/legacy job, judged as if already bound.
   const quiescentTarget=async ref=>{const jobs=await jobsFor({...c,bindings:[...c.bindings,ref]});if(jobs.length)throw Object.assign(Error('binding-target-creation-pending'),{pendingJobs:copy(jobs)});};
   const blockedTabs=async refs=>{if(!refs.length)return [];const jobs=await jobsFor({...c,bindings:[...c.bindings,...refs]});const ids=jobs.map(creationTab);
    // An unattributable job may touch any candidate: fail closed by offering none.
    if(ids.some(x=>x===null))return refs.map(r=>r.carrierId);return ids};
   return Object.freeze({identity,quiescent,quiescentTarget,blockedTabs,exclusive:async fn=>{const permit=Object.freeze({});permits.set(permit,{part,contextId:c.contextId,identity,quiescent});try{return await part.exclusive(c.contextId,permit,async session=>{identity();return fn(session)})}finally{permits.delete(permit)}}});
  },
  async capture(c,guard){const p=await namingAdapter.capture(c,guard);N.verify(namingAdapter,'capture',p,c.contextId);guard();p.guard();return p.guard;}
 });adapters.add(adapter);return adapter;
}
function createBindingService({authority,adapter,timeoutMs=15000,onSettled=null}){
 if(!require('./authority.cjs').isAuthority(authority))fail('binding-real-authority-required');
 if(!adapters.has(adapter))fail('binding-real-adapter-required');
 const store=authority.store,tokens=new Map();let busy=false,closed=false,epoch=0;
 const invalidate=()=>{epoch++;tokens.clear()};
 function enabled(){const r=authority.readView();if(r.status!=='ready')fail('binding-store-unavailable:'+r.status);if(r.frame.version!==6)fail('binding-upgrade-required');if(r.frame.state.binding?.format!==K.BINDING_FORMAT)fail('binding-format-upgrade-required');return true}
 function current(id){const r=authority.readView();if(r.status!=='ready'||r.frame.version!==6||r.frame.state.binding?.format!==K.BINDING_FORMAT)fail('binding-not-enabled');const s=r.frame.state,c=s.contexts.find(c=>c.contextId===id);if(!c||c.subjects[0].domain!=='project'||c.naming.authority!=='center'||s.contexts.some(c=>c.naming.pending))fail('binding-context-not-ready');return {s,c}}
 const op=x=>{if(!K.OPERATIONS.includes(x))fail('binding-operation-unknown');return x};
 async function work(fn,caller=()=>true){
  if(closed||busy)fail('binding-service-busy-or-closed');busy=true;const e=epoch,deadline=Date.now()+timeoutMs;let expired=false,timer;
  const guard=()=>{if(expired||closed||epoch!==e||Date.now()>=deadline||caller()!==true)fail('binding-operation-expired');return true};guard.remainingMs=()=>Math.max(0,deadline-Date.now());
  // A timeout revokes all late writes, but the real lock/queue is retained until the underlying job settles.
  const job=Promise.resolve().then(()=>fn(guard));const settle=()=>{busy=false;if(typeof onSettled==='function')setTimeout(()=>{try{onSettled()}catch{}},0)};job.then(settle,settle);
  try{return await Promise.race([job,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('binding-operation-timeout-refresh-before-retry'))},timeoutMs)})]);}finally{clearTimeout(timer)}
 }
 async function inside(id,g,fn){return store.bindingExclusive(id,async tx=>{g();const {c}=current(id),request=Object.freeze({});requests.set(request,{adapter,contextId:id,guard:()=>{g();tx.guard();if(!authority.writing)fail('binding-center-lock-required');return true}});try{const a=await adapter.open(c,request);a.identity();await a.quiescent();return await a.exclusive(async session=>{g();return fn(tx,session,a,c)})}finally{requests.delete(request)}})}
 const targetRef=(o,id)=>({ownerId:'collection-card-view',sourceScope:o.scope.sourceNotePath,carrierId:id});
 const service=Object.freeze({
  invalidate,close(){closed=true;invalidate()},clearPreviews(){tokens.clear()},revoke(token){tokens.delete(token)},
  // Read-only state for the object page: bound ref, scope and which operations apply.
  status(id,alive){return work(g=>enabled()&&inside(id,g,async(tx,o)=>{const p=tx.read().pending;return {bound:o.bound,scope:o.scope,pending:p&&p.contextId===id?copy(p):null,operations:o.bound?['replace','remove']:['add']}}),alive)},
  candidates(id,operation,alive){return work(g=>enabled()&&inside(id,g,async(tx,o,a)=>{op(operation);if(tx.read().pending)fail('binding-pending');await a.quiescent();g();const list=o.candidates(operation);
   const blocked=await a.blockedTabs(list.map(x=>targetRef(o,x.id)));g();return list.filter(x=>!blocked.includes(x.id))}),alive)},
  preview(id,operation,target,alive){return work(g=>enabled()&&inside(id,g,async(tx,o,a,c)=>{op(operation);const oldLease=await adapter.capture(c,g);g();oldLease();if(tx.read().pending)fail('binding-pending');
   const after=operation==='remove'?null:targetRef(o,target);if(after)await a.quiescentTarget(after);g();
   const plan=o.prepare(operation,after?.carrierId??null,randomUUID(),new Date().toISOString());M.releasedAfter(current(id).s.binding.released,plan);a.identity();oldLease();const revision=tx.read().revision;while(tokens.size>=16)tokens.delete(tokens.keys().next().value);const token=randomUUID();tokens.set(token,{plan:copy(plan),revision,expires:Date.now()+300000});return {token,plan:copy(plan)};}),alive)},
  confirm(token,alive){const issued=tokens.get(token);tokens.delete(token);if(!issued||issued.expires<Date.now())return Promise.reject(Error('binding-preview-expired'));return work(g=>enabled()&&inside(issued.plan.contextId,g,async(tx,o,a,c)=>{
   if(tx.read().revision!==issued.revision||tx.read().pending)fail('binding-preview-stale');const oldLease=await adapter.capture(c,g);const p=issued.plan;
   if(p.afterRef)await a.quiescentTarget(p.afterRef);const fresh=o.prepare(p.operation,p.afterRef?.carrierId??null,p.txId,p.at);if(!same(p,fresh))fail('binding-preview-stale');await a.quiescent();
   await tx.commit({kind:'begin',plan:p},()=>{g();a.identity();oldLease();if(o.inspect(p).state!=='before')fail('binding-before-required')});
   // begin changes the authority frame; never reuse the ordinary capture lease after this point.
   await finish(tx,o,a,p,g);return {status:'completed',contextId:p.contextId,operation:p.operation};
  }),alive)},
  resume(id,alive){return work(g=>enabled()&&inside(id,g,async(tx,o,a)=>{const p=tx.read().pending;if(!p||p.contextId!==id)fail('binding-no-pending');await finish(tx,o,a,p,g);return {status:'completed',contextId:id,operation:p.operation}}),alive)},
  cancel(id,alive){return work(g=>enabled()&&inside(id,g,async(tx,o,a)=>{const p=tx.read().pending;if(!p||p.contextId!==id)fail('binding-no-pending');await a.quiescent();const check=()=>{g();a.identity();if(o.inspect(p).state!=='before')fail('binding-cannot-cancel-written')};check();await tx.commit({kind:'cancel',txId:p.txId,planHash:p.planHash},check);g();a.identity();if(current(id).s.binding.pending!==null)fail('binding-cancel-unverified');return {status:'cancelled'}}),alive)}
 });
 async function finish(tx,o,a,p,g){
  const phase=()=>{g();a.identity();if(!same(tx.read().pending,p))fail('binding-pending-changed')};
  await a.quiescent();phase();await o.apply(p,phase,a.quiescent);await a.quiescent();phase();
  const after=()=>{phase();if(o.inspect(p).state!=='after')fail('binding-after-required')};after();await tx.commit({kind:'finish',txId:p.txId,planHash:p.planHash},after);
  g();a.identity();const {s,c}=current(p.contextId),anchor=s.binding.anchors.find(x=>x.contextId===p.contextId),has=r=>c.bindings.some(b=>same(b,r));
  const ok=s.binding.pending===null&&(p.afterRef?has(p.afterRef)&&anchor?.receiptHash===K.hash(K.receipt(p)):!anchor)&&(!p.beforeRef||!has(p.beforeRef)&&s.binding.released.some(r=>same(r.ref,p.beforeRef)&&r.txId===p.txId));
  if(!ok)fail('binding-finish-unverified');o.completed(p);g();a.identity();
 }
 return service;
}
module.exports={createBindingAdapter,createBindingService,verifyPermit,SCOPE};
