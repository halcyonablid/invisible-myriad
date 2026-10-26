'use strict';
// User-entered text only. No commands, previews, proofs or owner snapshots.
function createDrafts(storage,vault,namespace,contextId,session){
 const identity={vault,namespace,contextId,field:'canonicalLabel'},prefix='ckm.name-draft.v1:'+encodeURIComponent(JSON.stringify(identity))+':',key=prefix+session;
 const valid=x=>x&&x.version===1&&x.owner==='context-key-manager'&&x.contextId===contextId&&x.namespace===namespace&&x.field==='canonicalLabel'&&typeof x.text==='string'&&x.text.length<=4096&&typeof x.baseLabel==='string'&&Number.isSafeInteger(x.baseRevision)&&typeof x.updatedAt==='string';
 function list(){const result=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(prefix))continue;let x;try{x=JSON.parse(storage.getItem(k));}catch{throw Error('draft-invalid');}if(!valid(x))throw Error('draft-invalid');result.push({key:k,...x});}return result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 return {list,save(text,baseLabel,baseRevision){const value={version:1,owner:'context-key-manager',contextId,namespace,field:'canonicalLabel',text,baseLabel,baseRevision,updatedAt:new Date().toISOString()};if(!valid(value))throw Error('draft-invalid');const raw=JSON.stringify(value);storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('draft-readback-failed');},remove(){storage.removeItem(key);if(storage.getItem(key)!==null)throw Error('draft-remove-failed');},key};
}
module.exports={createDrafts};
