'use strict';
// Read-only compatibility boundary. The caller must ALSO verify the issued snapshot.
// Binding format 1 (strict historical shape) and 2 are readable; anything else is refused.
const A=require('./binding-anchor.cjs'),K=require('./binding-transition.cjs');
const fail=x=>{throw Error(x)},plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fields=(x,n)=>{if(!plain(x)||Object.keys(x).sort().join('|')!==n.split('|').sort().join('|'))fail('participant-snapshot-fields')};
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const readable=b=>plain(b)&&K.READABLE_FORMATS.includes(b.format);
function validate(s){
 if(!s||![1,3].includes(s.version))fail('participant-snapshot-version');
 if(s.version===1){if(Object.hasOwn(s,'binding'))fail('participant-legacy-binding');return s;}
 if(!readable(s.binding))fail('unsupported-binding-format');
 fields(s,'version|namespace|generation|revision|contexts|binding');
 if(typeof s.namespace!=='string'||!s.namespace||typeof s.generation!=='string'||!s.generation||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.contexts)||s.contexts.length>5000)fail('participant-snapshot');
 const ids=new Set(),refs=new Set(),subjects=new Set();
 for(const c of s.contexts){
  if(!plain(c)||typeof c.contextId!=='string'||!c.contextId.startsWith('ctx_')||!uuid(c.contextId.slice(4))||ids.has(c.contextId)||!Array.isArray(c.bindings)||!Array.isArray(c.subjects)||c.subjects.length!==1||!plain(c.subjects[0])||!['project','goal'].includes(c.subjects[0].domain)||typeof c.subjects[0].primaryNodeKey!=='string'||!c.subjects[0].primaryNodeKey||subjects.has(c.subjects[0].primaryNodeKey)||!['legacy','center'].includes(c.naming?.authority))fail('participant-context');
  ids.add(c.contextId);subjects.add(c.subjects[0].primaryNodeKey);
  for(const b of c.bindings){fields(b,'ownerId|sourceScope|carrierId');if(!['workspace-mount','gtd-task-manager','collection-card-view'].includes(b.ownerId)||typeof b.sourceScope!=='string'||!b.sourceScope||typeof b.carrierId!=='string'||!b.carrierId)fail('participant-binding');const k=K.hash(b);if(refs.has(k))fail('participant-binding-duplicate');refs.add(k);}
 }
 const f1=s.binding.format===1;
 fields(s.binding,f1?'format|pending|results|anchors':'format|pending|results|anchors|released');
 if(!Array.isArray(s.binding.results)||s.binding.results.length>128)fail('participant-results');
 const txs=new Set();for(const r of s.binding.results){fields(r,'txId|contextId|planHash|status|operation');if(!uuid(r.txId)||txs.has(r.txId)||!ids.has(r.contextId)||typeof r.planHash!=='string'||!/^[a-f0-9]{64}$/.test(r.planHash)||!['completed','cancelled'].includes(r.status)||!(f1?r.operation==='replace':K.OPERATIONS.includes(r.operation)))fail('participant-result');txs.add(r.txId);}
 A.validate(JSON.parse(JSON.stringify(s)));
 // Phase-aware migration publisher is a separate future integration, never an ordinary-save permit.
 if(s.binding.pending!==null)fail('participant-binding-pending');
 return s;
}
function rejectForeign(d){if(d&&Object.hasOwn(d,K.NEW))fail('participant-foreign-binding-receipt');return d;}
module.exports={validate,rejectForeign,NEW:K.NEW,BINDING_FORMAT:K.BINDING_FORMAT};
