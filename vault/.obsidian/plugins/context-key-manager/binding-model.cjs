"use strict";
// schema6/4 state: v4 multi-context naming progress plus the binding area. Binding format 1 (first-replace only,
// read and naming operations) and format 2 (replace/add/remove + release tombstones) are readable; only 2 is written.
const naming=require('./naming-model.cjs'),kernel=require('./binding-transition.cjs'),A=require('./binding-anchor.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),fail=x=>{throw Error(x)};
const same=(a,b)=>kernel.hash(a)===kernel.hash(b);
const fields=(x,ks)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join('|')!==ks.slice().sort().join('|'))fail('binding-schema')};
const OWNER='collection-card-view';
function prior(s){const {binding,...rest}=copy(s);return {...rest,schemaVersion:2}}
const mineOf=(c)=>c.bindings.filter(b=>b.ownerId===OWNER);
function validate(s){
 fields(s,['schemaVersion','namespace','revision','contexts','reservedIds','binding']);if(s.schemaVersion!==4)fail('binding-version');naming.validate(prior(s));
 if(s.binding===null||typeof s.binding!=='object'||!kernel.READABLE_FORMATS.includes(s.binding.format))fail('unsupported-binding-format');
 const f1=s.binding.format===1;fields(s.binding,f1?['format','pending','results','anchors']:['format','pending','results','anchors','released']);A.validate(s);
 if(!Array.isArray(s.binding.results)||s.binding.results.length>128)fail('binding-results');const ids=new Set();
 for(const r of s.binding.results){fields(r,['txId','contextId','planHash','status','operation']);if(typeof r.txId!=='string'||typeof r.planHash!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(r.txId)||!s.contexts.some(c=>c.contextId===r.contextId)||! /^[a-f0-9]{64}$/.test(r.planHash)||!['completed','cancelled'].includes(r.status)||!(f1?r.operation==='replace':kernel.OPERATIONS.includes(r.operation))||ids.has(r.txId))fail('binding-result');ids.add(r.txId)}
 const p=s.binding.pending;
 if(p!==null){
  if(f1){kernel.validatePlanV1(p)}else kernel.validatePlan(p);
  if(ids.has(p.txId)||p.namespace!==s.namespace)fail('binding-plan');const c=s.contexts.find(c=>c.contextId===p.contextId);if(!c||c.subjects[0].domain!=='project'||c.naming.authority!=='center'||c.canonicalLabel!==p.label||s.contexts.some(c=>c.naming.pending))fail('binding-context');
  const mine=mineOf(c),anchor=s.binding.anchors.find(a=>a.contextId===p.contextId)||null;
  if(p.beforeRef){if(mine.length!==1||!same(mine[0],p.beforeRef))fail('binding-before')}else if(mine.length!==0||anchor)fail('binding-before');
  if(p.afterRef)for(const d of s.contexts)for(const b of d.bindings){if(b.ownerId!==p.afterRef.ownerId)continue;if(b.sourceScope.toLowerCase()===p.afterRef.sourceScope.toLowerCase()){if(b.sourceScope!==p.afterRef.sourceScope)fail('binding-source-alias');if(b.carrierId===p.afterRef.carrierId)fail('binding-occupied')}}
  if(!f1&&p.afterRef){const rel=s.binding.released.find(r=>same(r.ref,p.afterRef));if(p.releasedReceiptHash!==null&&rel?.receiptHash!==p.releasedReceiptHash)fail('binding-released-proof')}
 }
 return s;
}
// Tombstones after this plan finishes. Pure, so binding-begin (and preview) can refuse BEFORE any owner write
// (Y1-FINAL F1): the target consumes any record for its ref; the released before carrier gets one. Over either cap the
// oldest receipt-less records are dropped; receipt-proven ones and this tx's own record never are (Y1-PREFLIGHT R5;
// finish verification needs it), so if that is not enough the plan is refused with binding-released-capacity.
function releasedAfter(rel,p){
 let next=p.afterRef?rel.filter(r=>!same(r.ref,p.afterRef)):rel.slice(),own=null;
 if(p.beforeRef){next=next.filter(r=>!same(r.ref,p.beforeRef));own={ref:copy(p.beforeRef),contextId:p.contextId,txId:p.txId,operation:p.operation,receiptHash:p.operation==='remove'?kernel.hash(kernel.receipt(p)):null};next.push(own)}
 let n=next.filter(r=>r.receiptHash===null).length;const over=()=>next.length>A.MAX_RELEASED||n>A.MAX_UNPROVEN;
 for(let i=0;i<next.length&&over();){if(next[i].receiptHash===null&&next[i]!==own){next.splice(i,1);n--}else i++}
 if(over())fail('binding-released-capacity');return next;
}
function apply(state,q){
 if(state.schemaVersion===4)validate(state);else naming.validate(state);
 if(q.namespace!==state.namespace)fail('namespace-mismatch');
 if(q.expectedRevision!==state.revision)fail('revision-conflict');
 if(q.kind!=='upgrade-binding'&&state.schemaVersion!==4)fail('binding-upgrade-required');
 if(['register-identity','claim-naming','rename','attempt','verified','finish'].includes(q.kind)){
  if(state.binding.pending)fail('binding-pending');
  return validate({...naming.apply(prior(state),q),schemaVersion:4,binding:copy(state.binding)});
 }
 const common=['kind','namespace','expectedRevision','requestId'];
 if(['upgrade-binding','binding-format-upgrade'].includes(q.kind))fields(q,common);else if(q.kind==='binding-begin')fields(q,[...common,'contextId','plan']);else if(['binding-finish','binding-cancel'].includes(q.kind))fields(q,[...common,'contextId','txId','planHash']);
 let s=copy(state);
 if(q.kind==='upgrade-binding'){if(state.schemaVersion!==2||s.contexts.some(c=>c.naming.pending))fail('upgrade-not-ready');s={...s,schemaVersion:4,binding:{format:kernel.BINDING_FORMAT,pending:null,results:[],anchors:[],released:[]}};}
 else if(q.kind==='binding-format-upgrade'){
  // format 1 -> 2 only: results and anchors are kept byte for byte; no tombstones are invented for format-1 history.
  if(s.binding.format!==1||s.binding.pending!==null||s.contexts.some(c=>c.naming.pending))fail('binding-format-upgrade-not-ready');
  s.binding={format:2,pending:null,results:s.binding.results,anchors:s.binding.anchors,released:[]};
 }
 else{
  if(s.binding.format!==kernel.BINDING_FORMAT)fail('binding-format-upgrade-required');
  if(q.kind==='binding-begin'){
   if(q.contextId!==q.plan?.contextId||!s.contexts.some(c=>c.contextId===q.contextId))fail('binding-command-context');
   if(s.binding.pending||s.binding.results.some(r=>r.txId===q.plan?.txId))fail('binding-pending-or-used');
   const p=kernel.validatePlan(copy(q.plan)),anchor=s.binding.anchors.find(a=>a.contextId===p.contextId)||null;
   // replace/remove act on the anchored (or, for format-1 era identities, the registered) binding; add needs none.
   if(p.operation==='add'?anchor!==null:(anchor!==null&&!same(anchor.ref,p.beforeRef)))fail('binding-anchor-mismatch');
   releasedAfter(s.binding.released,p);
   s.binding.pending=p;
  }else if(['binding-finish','binding-cancel'].includes(q.kind)){
   const p=s.binding.pending;if(!p||p.txId!==q.txId||p.planHash!==q.planHash||p.contextId!==q.contextId)fail('binding-transaction');
   if(q.kind==='binding-finish'){
    const c=s.contexts.find(c=>c.contextId===p.contextId),receiptHash=kernel.hash(kernel.receipt(p));
    if(p.operation==='replace')c.bindings=c.bindings.map(b=>same(b,p.beforeRef)?copy(p.afterRef):b);
    else if(p.operation==='add')c.bindings=[...c.bindings,copy(p.afterRef)];
    else c.bindings=c.bindings.filter(b=>!same(b,p.beforeRef));
    // Exactly one anchor per bound context: updated in place, added, or removed (never pushed twice).
    const others=s.binding.anchors.filter(a=>a.contextId!==p.contextId);
    s.binding.anchors=p.operation==='remove'?others:[...others,{contextId:p.contextId,ref:copy(p.afterRef),receiptHash}];
    // Same computation begin already accepted; released cannot change while this plan is pending.
    s.binding.released=releasedAfter(s.binding.released,p);
   }
   s.binding.results=[...s.binding.results,{txId:p.txId,contextId:p.contextId,planHash:p.planHash,status:q.kind==='binding-finish'?'completed':'cancelled',operation:p.operation}].slice(-128);s.binding.pending=null;
  }else fail('binding-unsupported-command');
 }
 s.revision++;return validate(s);
}
module.exports={validate,prior,apply,releasedAfter};
