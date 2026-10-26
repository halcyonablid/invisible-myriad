"use strict";
// Pure Collection binding transition (C3 Y1, binding format 2): replace | add | remove on one source.
// No IO or writer authority. Plans and receipts are version 2; version-1 plans are only validated (format-1 stores).
const {createHash}=require('node:crypto');
const OWNER='collection-card-view', MAP='assignmentsByKeywordKey', OLD='centerNamingProjectionV1', NEW='centerBindingReceiptsV1',BINDING_FORMAT=2,READABLE_FORMATS=[1,2];
const OPERATIONS=['replace','add','remove'];
const fail=s=>{throw Error(s)};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function json(x){ if(x===null||typeof x==='string'||typeof x==='boolean')return; if(typeof x==='number'&&Number.isFinite(x))return; if(Array.isArray(x)){if(Object.keys(x).length!==x.length||Array.from({length:x.length},(_,i)=>i).some(i=>!Object.hasOwn(x,i)))fail('sparse-array');x.forEach(json);return} if(!plain(x))fail('json-object');for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))fail('unsafe-key');json(x[k])} }
const clone=x=>{json(x);return JSON.parse(JSON.stringify(x))};
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':plain(x)?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const equal=(a,b)=>stable(a)===stable(b);
const key=x=>x.trim().toLocaleLowerCase();
const HEX=/^[a-f0-9]{64}$/;
function fields(x,ks){if(!plain(x)||Object.keys(x).sort().join('|')!==ks.slice().sort().join('|'))fail('fields')}
function text(x){if(typeof x!=='string'||!x||x!==x.trim()||x.length>4096||/[\x00-\x1f]/.test(x))fail('text')}
function id(x){text(x);if(['__proto__','prototype','constructor'].includes(x))fail('unsafe-id')}
function uuid(x){if(typeof x!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x))fail('uuid')}
function path(x){text(x);if(/^(?:[a-z]:|\/)/i.test(x)||/[\\:<>"|?*]/.test(x)||x.split('/').some(p=>['','.','..'].includes(p)||/[. ]$/.test(p)))fail('path')}
function scope(s){fields(s,['sourceNotePath','dataPath','keywordPath']);Object.values(s).forEach(path);if(new Set(Object.values(s).map(x=>x.toLowerCase())).size!==3)fail('scope-collision')}
function ref(r){fields(r,['ownerId','sourceScope','carrierId']);text(r.ownerId);path(r.sourceScope);id(r.carrierId)}
function entry(e){fields(e,['keyword','keywordKey','sourceNotePath','tabId','tabNameSnapshot','createdAt','updatedAt']);Object.values(e).forEach(text);path(e.sourceNotePath);id(e.tabId);if(e.keywordKey!==key(e.keyword))fail('keyword-key')}
function data(d){json(d);if(!plain(d)||!plain(d[MAP]))fail('map');for(const [k,e] of Object.entries(d[MAP])){entry(e);if(k!==key(e.keyword))fail('storage-key')}for(const f of [OLD,NEW])if(Object.hasOwn(d,f)){if(!plain(d[f]))fail('receipts');for(const r of Object.values(d[f]))if(!plain(r))fail('receipt-value')}}
function carrier(c,idValue,missing){if(!plain(c)||!Object.hasOwn(c,idValue)||!plain(c[idValue]))fail(missing);text(c[idValue].name);return {id:idValue,name:c[idValue].name}}
const refsOf=p=>[p.beforeRef,p.afterRef].filter(Boolean);
// Legacy C2 naming receipt on the current carrier (may coexist with a binding receipt: Y1-PREFLIGHT F2).
function validateLegacyReceipt(r,p){fields(r,['version','ownerId','namespace','contextId','carrierId','scope','txId','planHash','oldLabel','newLabel']);uuid(r.txId);if(r.version!==1||r.ownerId!==OWNER||r.namespace!==p.namespace||r.contextId!==p.contextId||r.carrierId!==p.beforeRef.carrierId||!equal(r.scope,p.scope)||r.newLabel!==p.label||!HEX.test(r.planHash))fail('legacy-receipt');text(r.oldLabel)}
// A binding receipt of this context whose afterRef is the plan's before carrier (version 1 from format 1, or version 2).
function validatePredecessor(r,p){if(!plain(r)||![1,2].includes(r.version)||r.namespace!==p.namespace||r.contextId!==p.contextId||!equal(r.afterRef,p.beforeRef)||!equal(r.scope,p.scope))fail('predecessor-receipt')}
function projection(d,p){const ids=refsOf(p).map(r=>r.carrierId);return {entries:Object.entries(d[MAP]).filter(([k,e])=>ids.includes(e.tabId)||k===key(p.label)),old:ids.map(id=>d[OLD]?.[id]??null),next:ids.map(id=>d[NEW]?.[id]??null)}}
const CORE=['version','operation','namespace','contextId','txId','scope','beforeRef','afterRef','label','at','oldEntryHash','legacyReceiptHash','predecessorReceiptHash','releasedReceiptHash','carriers'];
function core(p){return Object.fromEntries(CORE.map(k=>[k,p[k]]))}
// Receipt slot: replace/add -> after carrier; remove -> the released before carrier.
const slot=p=>p.operation==='remove'?p.beforeRef.carrierId:p.afterRef.carrierId;
function receipt(p){return {version:2,operation:p.operation,namespace:p.namespace,contextId:p.contextId,txId:p.txId,intentHash:hash(core(p)),beforeRef:p.beforeRef?clone(p.beforeRef):null,afterRef:p.afterRef?clone(p.afterRef):null,scope:clone(p.scope)}}
function newEntry(p){return {keyword:p.label,keywordKey:key(p.label),sourceNotePath:p.scope.sourceNotePath,tabId:p.afterRef.carrierId,tabNameSnapshot:p.carriers[p.carriers.length-1].name,createdAt:p.at,updatedAt:p.at}}
function transform(d,p){
 const n=clone(d),k=key(p.label);
 if(p.beforeRef){if(n[OLD])delete n[OLD][p.beforeRef.carrierId];if(n[NEW])delete n[NEW][p.beforeRef.carrierId]}
 if(p.operation==='remove'){delete n[MAP][k]}
 else{n[MAP][k]=newEntry(p);if(n[NEW])delete n[NEW][p.afterRef.carrierId]}
 n[NEW]={...(n[NEW]||{}),[slot(p)]:receipt(p)};return n;
}
// Format-1 plans (single first replace) are accepted only for reading a format-1 store.
const CORE_V1=['version','operation','namespace','contextId','txId','scope','beforeRef','afterRef','label','at','oldEntryHash','oldReceiptHash','carriers'];
function validatePlanV1(p){json(p);fields(p,[...CORE_V1,'planHash','beforeHash','afterHash']);scope(p.scope);ref(p.beforeRef);ref(p.afterRef);uuid(p.txId);text(p.namespace);if(!/^ctx_[a-f0-9-]{36}$/.test(p.contextId))fail('context');uuid(p.contextId.slice(4));text(p.label);id(key(p.label));
 if(p.version!==1||p.operation!=='replace'||[p.beforeRef,p.afterRef].some(r=>r.ownerId!==OWNER||r.sourceScope!==p.scope.sourceNotePath)||p.beforeRef.carrierId===p.afterRef.carrierId)fail('operation');
 for(const k of ['oldEntryHash','planHash','beforeHash','afterHash'])if(!HEX.test(p[k]))fail('hash');if(p.oldReceiptHash!==null&&!HEX.test(p.oldReceiptHash))fail('receipt-hash');
 if(p.planHash!==hash({...Object.fromEntries(CORE_V1.map(k=>[k,p[k]])),beforeHash:p.beforeHash,afterHash:p.afterHash}))fail('plan-hash');return p;}
function validatePlan(p){json(p);fields(p,[...CORE,'planHash','beforeHash','afterHash']);scope(p.scope);uuid(p.txId);text(p.namespace);if(!/^ctx_[a-f0-9-]{36}$/.test(p.contextId))fail('context');uuid(p.contextId.slice(4));text(p.label);id(key(p.label));
 if(typeof p.at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.at)||new Date(p.at).toISOString()!==p.at)fail('time');
 if(p.version!==2||!OPERATIONS.includes(p.operation))fail('operation');
 const want={replace:[true,true],add:[false,true],remove:[true,false]}[p.operation];
 if((p.beforeRef!==null)!==want[0]||(p.afterRef!==null)!==want[1])fail('operation-refs');
 for(const r of refsOf(p)){ref(r);if(r.ownerId!==OWNER||r.sourceScope!==p.scope.sourceNotePath)fail('operation')}
 if(p.operation==='replace'&&p.beforeRef.carrierId===p.afterRef.carrierId)fail('operation');
 if(!Array.isArray(p.carriers)||p.carriers.length!==refsOf(p).length)fail('carriers');p.carriers.forEach((c,i)=>{fields(c,['id','name']);id(c.id);text(c.name);if(c.id!==refsOf(p)[i].carrierId)fail('carrier-ref')});
 if(p.operation==='add'?p.oldEntryHash!==null:!HEX.test(p.oldEntryHash||''))fail('hash');
 for(const k of ['legacyReceiptHash','predecessorReceiptHash','releasedReceiptHash'])if(p[k]!==null&&!HEX.test(p[k]))fail('receipt-hash');
 if(!p.beforeRef&&(p.legacyReceiptHash!==null||p.predecessorReceiptHash!==null))fail('receipt-hash');if(!p.afterRef&&p.releasedReceiptHash!==null)fail('receipt-hash');
 for(const k of ['planHash','beforeHash','afterHash'])if(!HEX.test(p[k]))fail('hash');
 if(p.planHash!==hash({...core(p),beforeHash:p.beforeHash,afterHash:p.afterHash}))fail('plan-hash');return p;
}
// evidence is trusted input from the issuing writer (center snapshot + owner files), NOT an attestation.
// anchor: this context's current anchor on this source ({ref,receiptHash}) or null. released: center tombstones.
// blocked: carrier ids of this source that must not become targets (creation in progress).
function environment(p,e){
 fields(e,['scope','carriers','reservations','contextId','namespace','label','authority','domain','anchor','released','blocked']);scope(e.scope);json(e.carriers);
 if(!equal(e.scope,p.scope)||e.contextId!==p.contextId||e.namespace!==p.namespace||e.label!==p.label||e.authority!=='center'||e.domain!=='project')fail('environment');
 const got=[];if(p.beforeRef)got.push(carrier(e.carriers,p.beforeRef.carrierId,'binding-before-carrier-missing'));if(p.afterRef)got.push(carrier(e.carriers,p.afterRef.carrierId,'carrier-missing'));
 if(!equal(got,p.carriers))fail('carrier-changed');
 if(e.anchor!==null){fields(e.anchor,['ref','receiptHash']);ref(e.anchor.ref);if(!HEX.test(e.anchor.receiptHash))fail('anchor')}
 if(p.operation==='add'?e.anchor!==null:(e.anchor!==null&&!equal(e.anchor.ref,p.beforeRef)))fail('anchor');
 if(!Array.isArray(e.released))fail('released');for(const r of e.released){fields(r,['ref','contextId','txId','operation','receiptHash']);ref(r.ref);if(r.receiptHash!==null&&!HEX.test(r.receiptHash))fail('released')}
 if(!Array.isArray(e.blocked)||e.blocked.some(x=>typeof x!=='string'))fail('blocked');if(p.afterRef&&e.blocked.includes(p.afterRef.carrierId))fail('target-creation-pending');
 if(!Array.isArray(e.reservations))fail('reservations');let old=0;
 for(const r of e.reservations){fields(r,['contextId','ref','phase','txId']);ref(r.ref);if(!/^ctx_[a-f0-9-]{36}$/.test(r.contextId))fail('reservation-context');uuid(r.contextId.slice(4));if(!['committed','pending'].includes(r.phase)||r.phase==='committed'&&r.txId!==null)fail('reservation-phase');if(r.phase==='pending')uuid(r.txId);
  if(r.ref.ownerId!==OWNER)continue;
  const mineTarget=p.afterRef&&r.contextId===p.contextId&&r.phase==='pending'&&r.txId===p.txId&&equal(r.ref,p.afterRef);
  // add: the context may hold no Collection binding on ANY source (Y1-PREFLIGHT F4 / R7).
  if(p.operation==='add'&&r.contextId===p.contextId&&!mineTarget)fail('add-existing-binding');
  const relevant=r.ref.sourceScope.toLowerCase()===p.scope.sourceNotePath.toLowerCase();if(relevant&&r.ref.sourceScope!==p.scope.sourceNotePath)fail('source-alias');if(!relevant)continue;
  if(p.beforeRef&&r.ref.carrierId===p.beforeRef.carrierId){if(r.contextId!==p.contextId||r.phase!=='committed')fail('old-occupied');old++}
  if(p.afterRef&&r.ref.carrierId===p.afterRef.carrierId&&!mineTarget)fail('new-occupied');
 }if(old!==(p.beforeRef?1:0))fail('old-binding');
}
const releasedProof=(e,r,carrierId)=>e.released.some(x=>x.ref.carrierId===carrierId&&x.ref.sourceScope===e.scope.sourceNotePath&&x.receiptHash!==null&&x.receiptHash===hash(r));
function prepare(input,d,e){
 json(input);fields(input,['operation','namespace','contextId','txId','scope','beforeRef','afterRef','label','at']);data(d);
 if(!OPERATIONS.includes(input.operation))fail('operation');
 const p={version:2,...clone(input),oldEntryHash:null,legacyReceiptHash:null,predecessorReceiptHash:null,releasedReceiptHash:null,carriers:[]};
 scope(p.scope);refsOf(p).forEach(ref);text(p.label);id(key(p.label));const k=key(p.label);
 const carriers=e?.carriers;if(p.beforeRef)p.carriers.push(carrier(carriers,p.beforeRef.carrierId,'binding-before-carrier-missing'));if(p.afterRef)p.carriers.push(carrier(carriers,p.afterRef.carrierId,'carrier-missing'));
 if(p.beforeRef){
  const hits=Object.entries(d[MAP]).filter(([,x])=>x.tabId===p.beforeRef.carrierId);if(hits.length!==1||hits[0][0]!==k||hits[0][1].keyword!==p.label||hits[0][1].sourceNotePath!==p.scope.sourceNotePath)fail('old-mapping');
  p.oldEntryHash=hash(hits[0][1]);
  const legacy=d[OLD]?.[p.beforeRef.carrierId];if(legacy!==undefined){validateLegacyReceipt(legacy,p);p.legacyReceiptHash=hash(legacy)}
  const prev=d[NEW]?.[p.beforeRef.carrierId],anchor=e?.anchor??null;
  if(anchor){if(prev===undefined||hash(prev)!==anchor.receiptHash)fail('anchor-receipt-mismatch');validatePredecessor(prev,p);p.predecessorReceiptHash=hash(prev)}
  else if(prev!==undefined)fail('predecessor-unanchored');
 }
 if(p.afterRef){
  if(Object.values(d[MAP]).some(x=>x.tabId===p.afterRef.carrierId)||d[OLD]?.[p.afterRef.carrierId])fail('new-mapping-or-receipt');
  if(p.operation==='add'&&Object.hasOwn(d[MAP],k))fail('add-label-mapped');
  const r=d[NEW]?.[p.afterRef.carrierId];if(r!==undefined){if(!releasedProof(e,r,p.afterRef.carrierId))fail('new-mapping-or-receipt');p.releasedReceiptHash=hash(r)}
 }
 p.beforeHash=hash(projection(d,p));p.afterHash=hash(projection(transform(d,p),p));p.planHash=hash({...core(p),beforeHash:p.beforeHash,afterHash:p.afterHash});validatePlan(p);environment(p,e);return clone(p);
}
function classify(p,d,e){
 validatePlan(p);data(d);environment(p,e);const h=hash(projection(d,p)),k=key(p.label),opt=v=>v===undefined?null:hash(v);
 if(h===p.beforeHash){
  if(opt(d[MAP][k])!==p.oldEntryHash&&!(p.operation==='add'&&d[MAP][k]===undefined))return 'unknown';
  if(p.beforeRef&&(opt(d[OLD]?.[p.beforeRef.carrierId])!==p.legacyReceiptHash||opt(d[NEW]?.[p.beforeRef.carrierId])!==p.predecessorReceiptHash))return 'unknown';
  if(p.afterRef&&opt(d[NEW]?.[p.afterRef.carrierId])!==p.releasedReceiptHash)return 'unknown';
  return 'before';
 }
 if(h===p.afterHash&&equal(d[NEW]?.[slot(p)],receipt(p))){
  if(p.operation==='remove')return d[MAP][k]===undefined&&d[OLD]?.[p.beforeRef.carrierId]===undefined?'after':'unknown';
  return equal(d[MAP][k],newEntry(p))&&(!p.beforeRef||d[NEW]?.[p.beforeRef.carrierId]===undefined&&d[OLD]?.[p.beforeRef.carrierId]===undefined)?'after':'unknown';
 }
 return 'unknown';
}
function apply(p,d,e){const state=classify(p,d,e);if(state==='unknown')fail('unknown-state');if(state==='after')return clone(d);const next=transform(d,p);if(classify(p,next,e)!=='after')fail('after-plan-mismatch');return next}
module.exports={prepare,classify,apply,validatePlan,validatePlanV1,receipt,slot,hash,MAP,OLD,NEW,BINDING_FORMAT,READABLE_FORMATS,OPERATIONS};
