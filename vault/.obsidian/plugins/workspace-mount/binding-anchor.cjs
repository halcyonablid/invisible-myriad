"use strict";
// Current binding evidence (anchors) and release tombstones (format 2), not a transaction history.
const k=require('./binding-transition.cjs');
const fail=s=>{throw Error(s)},same=(a,b)=>k.hash(a)===k.hash(b);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const HEX=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,MAX_RELEASED=1024,MAX_UNPROVEN=128;
const keys=(x,n)=>plain(x)&&Object.keys(x).sort().join('|')===n;
function validate(s){
 const anchors=s.binding?.anchors;if(!Array.isArray(anchors)||anchors.length>s.contexts.length)fail('anchor-schema');const seen=new Set();
 for(const a of anchors){
  if(!keys(a,'contextId|receiptHash|ref')||typeof a.contextId!=='string'||!HEX.test(a.receiptHash)||seen.has(a.contextId))fail('anchor-schema');
  const c=s.contexts.find(c=>c.contextId===a.contextId),refs=c?.bindings.filter(b=>b.ownerId==='collection-card-view');
  if(!c||c.subjects[0].domain!=='project'||c.naming.authority!=='center'||refs.length!==1||!keys(a.ref,'carrierId|ownerId|sourceScope')||!same(a.ref,refs[0]))fail('anchor-binding');seen.add(a.contextId);
 }
 released(s);return anchors;
}
// format 1: no tombstones. format 2: {ref,contextId,txId,operation,receiptHash|null}; a ref is never a current binding,
// at most one record per ref, at most 1024 records, at most 128 records without a receipt proof.
function released(s){
 if(s.binding.format===1){if(Object.hasOwn(s.binding,'released'))fail('released-format');return []}
 const list=s.binding.released;if(!Array.isArray(list)||list.length>MAX_RELEASED)fail('released-schema');
 const current=new Set(s.contexts.flatMap(c=>c.bindings.filter(b=>b.ownerId==='collection-card-view').map(b=>k.hash(b)))),seen=new Set();let unproven=0;
 for(const r of list){
  if(!keys(r,'contextId|operation|receiptHash|ref|txId')||!keys(r.ref,'carrierId|ownerId|sourceScope')||r.ref.ownerId!=='collection-card-view'||typeof r.ref.carrierId!=='string'||!r.ref.carrierId||typeof r.ref.sourceScope!=='string'||!r.ref.sourceScope||typeof r.contextId!=='string'||!UUID.test(r.txId)||!['replace','remove'].includes(r.operation))fail('released-schema');
  if(r.operation==='remove'?!HEX.test(r.receiptHash||''):r.receiptHash!==null)fail('released-schema');if(r.receiptHash===null)unproven++;
  const h=k.hash(r.ref);if(seen.has(h)||current.has(h))fail('released-binding');seen.add(h);
 }
 if(unproven>MAX_UNPROVEN)fail('released-schema');return list;
}
// Every binding receipt in a Collection keyword file must be proven by the center: an anchor, a release tombstone, or
// the pending plan of this source (its own receipt after the write; its anchored predecessor before it).
function assertReceipts(s,scope,d){
 const anchors=validate(s).filter(a=>a.ref.sourceScope===scope.sourceNotePath),receipts=Object.hasOwn(d,k.NEW)?d[k.NEW]:{};
 if(!plain(receipts))fail('anchor-receipt-schema');
 const p=s.binding.pending;let mine=null;
 if(p&&p.scope.sourceNotePath===scope.sourceNotePath){if(!same(p.scope,scope))fail('anchor-scope');if(p.version!==2)fail('binding-format-upgrade-required');k.validatePlan(p);mine=p;}
 const allowed=new Map();const allow=(id,h)=>{if(!allowed.has(id))allowed.set(id,new Set());allowed.get(id).add(h)};
 for(const a of anchors){
  allow(a.ref.carrierId,a.receiptHash);
  // A pending replace/remove of this anchor may already have consumed the predecessor receipt.
  const consumed=mine&&mine.beforeRef&&same(mine.beforeRef,a.ref);
  if(!consumed&&(!Object.hasOwn(receipts,a.ref.carrierId)||k.hash(receipts[a.ref.carrierId])!==a.receiptHash))fail('anchor-receipt-mismatch');
 }
 for(const r of released(s))if(r.receiptHash!==null&&r.ref.sourceScope===scope.sourceNotePath)allow(r.ref.carrierId,r.receiptHash);
 if(mine)allow(k.slot(mine),k.hash(k.receipt(mine)));
 for(const [id,r] of Object.entries(receipts))if(!allowed.get(id)?.has(k.hash(r))||!plain(r)||!same(r.scope,scope))fail('anchor-receipt-unproven');
 return true;
}
module.exports={validate,released,assertReceipts,MAX_RELEASED,MAX_UNPROVEN};
