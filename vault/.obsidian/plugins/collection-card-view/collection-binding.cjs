'use strict';
// C3 Y1 Collection binding writer: replace | add | remove on one source (binding format 2). Never an arbitrary JSON writer.
const K=require('./binding-transition.cjs'),A=require('./binding-anchor.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>K.hash(a)===K.hash(b),fail=s=>{throw Error(s)};
const OWNER='collection-card-view',SCOPE='same-source-project-collection-v2',compatibilityProofs=new WeakMap();
function createBindingParticipant({owner,io,fence,authority,live,report,root,defaultScope}){
 const C=require('./binding-compatibility-checks.cjs'),ownerMethods=C.pinMethods(owner,['enqueue','assertLive','read','prepare','inspect','assertFreshSave']),fenceMethods=C.pinMethods(fence),ioMethods=C.pinMethods(io,['resolveScope','sameFile','read','readOptional','backup','process']);
 // The default source is needed only by add (unbound contexts); callers that never add may omit it.
 const defaultScopeOf=()=>{if(typeof defaultScope!=='function')fail('binding-default-scope-required');return defaultScope()};
 const installed=()=>{ownerMethods();fenceMethods();ioMethods();return true};
 const generation=fence.generation,installedProcess=owner.c.process,initialRoot=root();
 const need=()=>{live();fence.live();if(root()!==initialRoot)fail('binding-root-changed');if(owner.c.process!==installedProcess||fence.generation!==generation)fail('binding-writer-replaced')};
 function snapshot(){need();const api=authority();if(!api?.snapshot||!api.assertCurrent)fail('binding-authority-unavailable');const s=api.snapshot();api.assertCurrent(s);if(s.version!==3)fail('binding-not-enabled');if(s.binding?.format!==K.BINDING_FORMAT)fail('binding-format-upgrade-required');A.validate(copy(s));return {api,s:copy(s)}}
 function context(s,id){const c=s.contexts.find(c=>c.contextId===id);if(!c||c.subjects[0].domain!=='project'||c.naming.authority!=='center'||s.contexts.some(c=>c.naming.pending))fail('binding-context-not-ready');const mine=c.bindings.filter(b=>b.ownerId===OWNER);if(mine.length>1)fail('binding-single-source-required');return {c,ref:mine[0]||null}}
 // Unbound contexts use the owner's deterministic default source (same resolution as the C2 unbound path, R7).
 // An add pending for this context fixes its source in the plan; after the owner write the label IS mapped there, so
 // the unbound same-name precondition no longer applies (resume/cancel must still open the session).
 function scopeOf(s,id,ref,label){if(ref)return fence.resolve(ref.sourceScope);const sc=defaultScopeOf(),p=s.binding.pending;
  if(p&&p.contextId===id&&p.operation==='add'){if(!same(sc,p.scope))fail('binding-source-changed');return sc}
  fence.sameName(sc,label,null);return sc}
 const anchorOf=(s,id)=>{const a=s.binding.anchors.find(a=>a.contextId===id);return a?{ref:copy(a.ref),receiptHash:a.receiptHash}:null};
 function env(s,c,sc,carriers,blocked=[]){return {scope:sc,carriers,reservations:s.contexts.flatMap(x=>x.bindings.map(ref=>({contextId:x.contextId,ref,phase:'committed',txId:null}))),namespace:s.namespace,contextId:c.contextId,label:c.canonicalLabel,authority:c.naming.authority,domain:c.subjects[0].domain,anchor:anchorOf(s,c.contextId),released:copy(s.binding.released),blocked:copy(blocked)}}
 function inspect(p,permitPending=true){
  K.validatePlan(p);const cap=snapshot(),{s}=cap,{c,ref}=context(s,p.contextId);
  if(s.namespace!==p.namespace||c.canonicalLabel!==p.label)fail('binding-context-changed');
  if(p.beforeRef?!ref||!same(ref,p.beforeRef):ref!==null)fail('binding-context-changed');
  if(s.binding.pending!==null&&(!permitPending||!same(s.binding.pending,p)))fail('binding-pending-conflict');
  const sc=p.beforeRef?fence.resolve(ref.sourceScope):defaultScopeOf();if(!same(sc,p.scope))fail('binding-source-changed');
  // Every known Collection scope participates in alias and receipt validation, including legacy identities.
  const refs=s.contexts.flatMap(c=>c.bindings.filter(b=>b.ownerId===OWNER).map(b=>({c,b,sc:fence.resolve(b.sourceScope)})));
  for(const r of refs)for(const role of ['sourceNotePath','dataPath','keywordPath'])for(const other of ['sourceNotePath','dataPath','keywordPath']){
   if(sc.sourceNotePath===r.sc.sourceNotePath&&role===other)continue;
   if(fence.equivalent(sc[role],r.sc[other]))fail('binding-physical-alias');
  }
  io.read(sc.sourceNotePath);
  const raw=io.read(sc.keywordPath),d=fence.parse(raw),dataRaw=io.read(sc.dataPath),data=fence.parse(dataRaw),carriers=data[owner.c.carriers];
  if(Object.hasOwn(data,K.NEW)||Object.hasOwn(data,K.OLD))fail('binding-receipt-outside-keywords');
  const checked=new Set();
  for(const x of [sc,...refs.map(r=>r.sc)])if(!checked.has(x.sourceNotePath)){const rd=x.sourceNotePath===sc.sourceNotePath?d:fence.parse(io.read(x.keywordPath));A.assertReceipts(s,x,rd);fence.receipts(rd);checked.add(x.sourceNotePath);}
  for(const r of refs){
   if(r.sc.sourceNotePath!==sc.sourceNotePath||r.c.contextId===p.contextId||r.c.naming.authority!=='center')continue;
   const e=fence.entry(d,r.b.carrierId).e;if(e.keyword!==r.c.canonicalLabel||e.sourceNotePath!==sc.sourceNotePath||!carriers?.[r.b.carrierId])fail('binding-other-context-drift');
  }
  for(const r of Object.values(fence.receipts(d))){const target=refs.find(x=>x.c.contextId===r.contextId&&x.b.carrierId===r.carrierId&&same(x.sc,r.scope));if(!target||r.namespace!==s.namespace||r.scope.sourceNotePath!==sc.sourceNotePath)fail('binding-naming-receipt-orphan')}
  const e=env(s,c,sc,carriers);
  const state=K.classify(p,d,e);if(state==='unknown')fail('binding-owner-state-unknown');
  const now=snapshot();if(now.api!==cap.api||!same(now.s,s))fail('binding-authority-changed');return {state,raw,dataRaw,d,env:e,s};
 }
 async function exclusive(contextId,permit,task){
  // Resolve the sibling center module, not a public callback offered by the caller.
  const verify=()=>require('../context-key-manager/binding-service.cjs').verifyPermit(permit,participant,contextId);
  verify();
  const initial=snapshot(),{c:c0,ref}=context(initial.s,contextId),scope=scopeOf(initial.s,contextId,ref,c0.canonicalLabel);
  return owner.enqueue(scope,async()=>{
   let active=true;const lease=()=>{verify();need();if(!active)fail('binding-session-expired');const n=snapshot();if(n.api!==initial.api||n.s.namespace!==initial.s.namespace||n.s.generation!==initial.s.generation||!same(ref?fence.resolve(scope.sourceNotePath):defaultScopeOf(),scope))fail('binding-session-changed');return n.s};
   const check=(p,pending=false)=>{lease();if(p.contextId!==contextId||!same(p.scope,scope))fail('binding-session-scope');const r=inspect(p);if(pending&&!same(r.s.binding.pending,p))fail('binding-confirmation-required');lease();return r};
   const allowed=(s,op)=>{const {ref}=context(s,contextId);if(op==='add'?ref!==null:ref===null)fail(op==='add'?'binding-add-already-bound':'binding-not-bound')};
   const session=Object.freeze({
    scope:copy(scope),bound:ref?copy(ref):null,
    // Targets for replace/add: named tabs of this source with no mapping, no naming receipt, no current binding, and
    // no binding receipt unless it is a release receipt proven by a center tombstone (Q4).
    candidates(op){const s=lease();if(s.binding.pending)fail('binding-pending');if(op==='remove')return [];allowed(s,op);
     const d=fence.parse(io.read(scope.dataPath)),kw=fence.parse(io.read(scope.keywordPath)),rel=s.binding.released.filter(r=>r.receiptHash&&r.ref.sourceScope===scope.sourceNotePath);
     return Object.entries(d[owner.c.carriers]||{}).filter(([id,v])=>v?.name&&id!==ref?.carrierId&&!Object.values(kw[K.MAP]||{}).some(e=>e.tabId===id)&&!kw[K.OLD]?.[id]&&(!kw[K.NEW]?.[id]||rel.some(r=>r.ref.carrierId===id&&r.receiptHash===K.hash(kw[K.NEW][id])))&&!s.contexts.some(c=>c.bindings.some(b=>b.ownerId===OWNER&&b.sourceScope===scope.sourceNotePath&&b.carrierId===id))).map(([id,v])=>({id,name:v.name}));},
    prepare(op,targetId,txId,at,blocked=[]){const s=lease(),{c,ref}=context(s,contextId);if(s.binding.pending)fail('binding-pending');allowed(s,op);
     const d=fence.parse(io.read(scope.keywordPath)),carriers=fence.parse(io.read(scope.dataPath))[owner.c.carriers];
     const afterRef=op==='remove'?null:{ownerId:OWNER,sourceScope:scope.sourceNotePath,carrierId:targetId};
     const p=K.prepare({operation:op,namespace:s.namespace,contextId,txId,scope,beforeRef:op==='add'?null:ref,afterRef,label:c.canonicalLabel,at},d,env(s,c,scope,carriers,blocked));check(p);return p;},
    inspect(p){return {state:check(p).state}},
    completed(p){const s=lease();const c=s.contexts.find(c=>c.contextId===contextId);if(s.binding.pending!==null||!c)fail('binding-completed-context');
     const bound=b=>c.bindings.some(x=>same(x,b));if(p.afterRef?!bound(p.afterRef):bound(p.beforeRef))fail('binding-completed-context');
     const raw=io.read(scope.keywordPath),d=fence.parse(raw),dataRaw=io.read(scope.dataPath),data=fence.parse(dataRaw),k=p.label.trim().toLocaleLowerCase();A.assertReceipts(s,scope,d);
     if(!same(d[K.NEW]?.[K.slot(p)],K.receipt(p))||(p.afterRef?d[K.MAP]?.[k]?.tabId!==p.afterRef.carrierId:d[K.MAP]?.[k]!==undefined)||refsOk(p,data)===false)fail('binding-completed-receipt');
     fence.guardFile(scope.keywordPath,raw,raw);fence.guardFile(scope.dataPath,dataRaw,dataRaw);lease();return true;},
    async apply(p,guard,quiescent){
     const issued=verify();const supplied=guard;guard=()=>{issued.identity();return supplied()};quiescent=issued.quiescent;
     if(typeof guard!=='function'||typeof quiescent!=='function')fail('binding-lease-required');fence.sync(guard);const before=check(p,true);
     await quiescent();fence.sync(guard);const fresh=check(p,true);if(fresh.raw!==before.raw||fresh.dataRaw!==before.dataRaw)fail('binding-revision-conflict');
     if(fresh.state==='after'){fence.sync(guard);check(p,true);return {alreadyApplied:true}}
     const after=JSON.stringify(K.apply(p,fresh.d,fresh.env),null,2);
     await io.backup(scope.keywordPath,fresh.raw,p.txId);await quiescent();fence.sync(guard);
     const checked=check(p,true);if(checked.raw!==fresh.raw||checked.dataRaw!==fresh.dataRaw)fail('binding-revision-conflict');
     // Invalidate cached views before publication; a lost acknowledgement cannot leave a stale view writable.
     owner.generations.set(scope.keywordPath,(owner.generations.get(scope.keywordPath)||0)+1);
     await io.process(scope.keywordPath,current=>{fence.sync(guard);const r=check(p,true);if(current!==fresh.raw||r.raw!==fresh.raw||r.dataRaw!==fresh.dataRaw)fail('binding-revision-conflict');return after});
     await quiescent();fence.sync(guard);const end=check(p,true);if(end.raw!==after||end.dataRaw!==fresh.dataRaw||end.state!=='after')fail('binding-write-readback');return {alreadyApplied:false};
    }
   });
   try{lease();return await task(session)}catch(e){report(e);throw e}finally{active=false}
  });
 }
 // Carrier tabs referenced by the plan still exist (tabs and items are never written by binding operations).
 function refsOk(p,data){return [p.beforeRef,p.afterRef].filter(Boolean).every(r=>!!data[owner.c.carriers]?.[r.carrierId])}
 const participant=Object.freeze({ownerId:OWNER,bindingCompatibility(){need();installed();const methods=C.pinMethods(owner),f=C.pinMethods(fence),a=C.pinAuthority(authority,root);const guard=()=>{need();installed();methods();f();a();return true};guard();const proof=Object.freeze({version:1,ownerId:OWNER,generation,bindingFormat:K.BINDING_FORMAT});compatibilityProofs.set(proof,{part:participant,guard});return proof;},status(){need();return {version:1,generation,mode:'ready',operation:SCOPE}},exclusive});return participant;
}
function verifyBindingCompatibility(part,proof){const r=compatibilityProofs.get(proof);if(!r||r.part!==part)fail('binding-proof-unissued');r.guard();return r.guard;}
module.exports={createBindingParticipant,verifyBindingCompatibility,SCOPE};
