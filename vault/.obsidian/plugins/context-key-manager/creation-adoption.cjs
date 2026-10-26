'use strict';
// P2-E (P2E-CONTRACT v2): adopt a context created by the PEO managed creation. After the creation is complete, its
// identity is registered and its naming claimed through the audited RegistrationService and NamingService only.
// Host-private: the host exposes { status, statuses, adopt } and nothing else. status()/statuses() never call an owner's
// prepare/capture; they read the center store, the PEO creation facts and the Mandala effective/tracking lists.
// The txId is only a locator: domain, subject and bindings come from the PEO journal (chain-verified by PEO) and are
// confirmed by the independent owner evidence inside registration/claim. Caller-supplied data is never accepted.
const {hash}=require('./naming-store.cjs'),{model}=require('./store.cjs');
const TX=/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
// Bounded retry only for codes that mean "evidence moved under us" (P2E-PREFLIGHT F6); the naming service is
// single-flight and refuses while busy instead of queueing. preview-expired is added to the F6 list: any naming
// settle (rename, binding operation) between a preview and its confirm clears the previews; redoing the preview is safe.
const TRANSIENT=new Set(['preview-expired','service-busy','service-stale','provider-generation-changed','provider-revision-changed','registration-evidence-changed','preview-evidence-changed','claim-evidence-changed','store-changed']);
const OWNERS=['workspace-mount','gtd-task-manager','collection-card-view'];
const EFFECTIVE={project:'listEffectiveOperationalContextKeys',goal:'listEffectiveGoalOperationalContextKeys'},TRACKING={project:'listProjectTrackingDirectoryV1',goal:'listGoalTrackingDirectoryV1'};
const copy=x=>JSON.parse(JSON.stringify(x)),text=x=>typeof x==='string'&&x.length>0&&x.length<=8192&&x===x.trim();
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const bindKey=b=>JSON.stringify([b.ownerId,b.sourceScope,b.carrierId]);
const sameBindings=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.map(bindKey).sort().join('\n')===b.map(bindKey).sort().join('\n');
// One PEO creation fact (readManagedContextCreationFactsV1). Anything unexpected makes the job unusable, never guessed.
function validFact(j){
 if(!plain(j)||!TX.test(j.txId)||!['project','goal'].includes(j.domain)||!text(j.status)||!text(j.source)||!text(j.label))return false;
 if(!plain(j.declaration)||!text(j.declaration.nodeKey)||!text(j.declaration.sourceNotePath))return false;
 if(!Array.isArray(j.carriers)||j.carriers.length!==3||OWNERS.some(o=>j.carriers.filter(c=>plain(c)&&c.ownerId===o&&text(c.sourceScope)&&text(c.carrierId)).length!==1))return false;
 return true;
}
const subjectOf=j=>({domain:j.domain,ownerId:j.domain==='project'?'workspace-mount':'mandala-time-blocks',sourceScope:j.declaration.sourceNotePath,primaryNodeKey:j.declaration.nodeKey});
const bindingsOf=j=>j.carriers.map(c=>({ownerId:c.ownerId,sourceScope:c.sourceScope,carrierId:c.carrierId}));
function createAdoptionService({app,authority,naming,registration,validate,isLive,globals=()=>globalThis,sleep=ms=>new Promise(r=>setTimeout(r,ms)),retries=2,retryMs=500,onStep=()=>{}}){
 // PEO is taken from the plugin registry and must be the same object it published globally (P2E-PREFLIGHT F9).
 function peo(){const p=app.plugins?.plugins?.['project-execution-overview'],api=p?.projectExecutionOverviewPublicApi;if(!api||api!==globals().__projectExecutionOverviewPluginApi||typeof api.readManagedContextCreationFactsV1!=='function')return null;return api;}
 function store(){try{const s=authority.store.status();if(s.status==='unconfigured'||s.status==='storage-missing')return {state:'center-unavailable'};if(s.status!=='ready')return {state:'store-busy',storeStatus:s.status};if(![4,6].includes(s.frame.version))return {state:'center-unavailable'};return {state:'ready',frame:s.frame};}catch(e){return {state:'center-unavailable',code:String(e?.message||e).slice(0,160)};}}
 async function facts(){const api=peo();if(!api)return null;const r=await api.readManagedContextCreationFactsV1();if(!r||r.ok!==true||!Array.isArray(r.jobs))return null;return r.jobs;}
 function contextOf(frame,subject){const key=model.subjectKey(subject);return frame.state.contexts.find(c=>c.subjects.some(s=>model.subjectKey(s)===key))||null;}
 async function lists(domain,cache){if(cache.has(domain))return cache.get(domain);const p=(async()=>{const api=globals().__mandalaTimeBlocksPluginApi;if(typeof api?.[EFFECTIVE[domain]]!=='function')throw Error('mandala-unavailable');return validate(await api[EFFECTIVE[domain]]({source:'context-key-manager'}),domain);})();cache.set(domain,p);return p;}
 async function stopped(domain,nodeKey){try{const api=globals().__mandalaTimeBlocksPluginApi,rows=validate(await api[TRACKING[domain]]({source:'context-key-manager'}),domain==='goal'?'goalTracking':'tracking');return rows.some(r=>r.nodeKey===nodeKey&&r.trackingStatus==='stopped')?'stopped':'unknown';}catch{return 'undetermined';}}
 // Contract 3.2 status order. Pure read: store, PEO facts, Mandala lists.
 async function classify(txId,jobs,st,cache){
  if(typeof txId!=='string'||!TX.test(txId))return {txId,state:'tx-invalid'};
  if(!isLive())return {txId,state:'center-unavailable'};
  if(st.state==='center-unavailable')return {txId,state:'center-unavailable'};
  if(!jobs)return {txId,state:'peo-unavailable'};
  const hits=jobs.filter(j=>j?.txId===txId);if(!hits.length)return {txId,state:'tx-not-found'};
  const j=hits[0];if(hits.length!==1||!validFact(j))return {txId,state:'peo-unavailable',code:'creation-fact-invalid'};
  const base={txId,domain:j.domain,label:j.label};
  if(j.status!=='complete')return {...base,state:'creation-not-complete',creationStatus:j.status,reason:typeof j.reason==='string'?j.reason:''};
  if(st.state!=='ready')return {...base,state:'store-busy',storeStatus:st.storeStatus};
  // a structurally invalid plan subject (e.g. declaration source != nodeKey source) is a mismatch, never an exception
  const subject=subjectOf(j),bindings=bindingsOf(j);let c;try{c=contextOf(st.frame,subject);}catch{return {...base,state:'subject-mismatch'};}
  if(c){
   if(hash(c.subjects[0])!==hash(subject)||!sameBindings(c.bindings,bindings))return {...base,state:'binding-mismatch',contextId:c.contextId};
   if(c.naming?.authority==='center')return {...base,state:'center',contextId:c.contextId,label:c.canonicalLabel,bindings:copy(c.bindings),...(c.naming.pending?{projection:'pending'}:{})};
   return {...base,state:'registered-legacy',contextId:c.contextId,label:c.canonicalLabel};
  }
  if(st.frame.state.binding?.pending)return {...base,state:'store-busy',storeStatus:'binding-pending'};
  let rows;try{rows=await lists(j.domain,cache);}catch{return {...base,state:'not-effective',detail:'undetermined'};}
  const m=rows.filter(r=>r.nodeKey===j.declaration.nodeKey&&r.ownerSourceScope===j.declaration.sourceNotePath&&r.providerScope===j.source);
  if(m.length>1)return {...base,state:'ambiguous'};
  if(!m.length)return {...base,state:'not-effective',detail:await stopped(j.domain,j.declaration.nodeKey)};
  return {...base,state:'not-registered',_row:copy(m[0]),_subject:subject,_bindings:bindings};
 }
 const strip=s=>{const {_row,_subject,_bindings,...rest}=s;return rest;};
 // status()/statuses() never throw: an unexpected error is reported as a state, with no write attempted.
 const safe=async(txId,fn)=>{try{return await fn();}catch(e){return {txId,state:'undetermined',code:String(e?.message||e).slice(0,160)};}};
 async function status(txId){return safe(txId,async()=>strip(await classify(txId,await facts().catch(()=>null),store(),new Map())));}
 async function statuses(){const jobs=await facts().catch(()=>null),st=store(),cache=new Map();if(!jobs)return {ok:false,state:isLive()?'peo-unavailable':'center-unavailable',jobs:[]};
  const out=[];for(const j of jobs)if(j?.status==='complete')out.push(await safe(j.txId,async()=>strip(await classify(j.txId,jobs,st,cache))));return {ok:true,jobs:out};}
 // One pass of contract 3.2 adopt: register, then claim. Returns a final state or {next:true} after a write.
 async function step(txId){
  const s=await classify(txId,await facts().catch(()=>null),store(),new Map());
  if(s.state==='not-registered'){
   onStep('registration-preview',txId);const p=await registration.preview(s._row);
   if(p?.kind==='existing')return {next:true};
   if(!p?.payload||hash(p.payload.subjects?.[0])!==hash(s._subject))return {...strip(s),state:'subject-mismatch'};
   if(!sameBindings(p.payload.bindings,s._bindings))return {...strip(s),state:'binding-mismatch'};
   onStep('registration-confirm',txId);await registration.confirm(p.token);return {next:true};
  }
  if(s.state==='registered-legacy'){
   onStep('claim-preview',txId);const p=await naming.previewClaim(s.contextId);
   // re-read the stored identity right before the claim is committed (P2E-PREFLIGHT F3)
   const again=await classify(txId,await facts().catch(()=>null),store(),new Map());
   if(again.state!=='registered-legacy'||again.contextId!==s.contextId)return strip(again);
   onStep('claim-confirm',txId);await naming.confirmClaim(p.token);return {next:true};
  }
  return strip(s);
 }
 async function adopt(txId){
  let attempts=0,passes=0;
  for(;;){
   try{const r=await step(txId);if(!r.next)return {...r,attempts};if(++passes>4)return {...await status(txId),code:'adopt-not-converged',attempts};}
   catch(e){const code=String(e?.message||e).slice(0,160);
    if(TRANSIENT.has(code)&&attempts<retries){attempts++;await sleep(retryMs);continue;}
    const s=await status(txId);return {...s,code,attempts,...(Array.isArray(e?.pendingJobs)?{pendingJobs:copy(e.pendingJobs)}:{})};}
  }
 }
 const guard=fn=>async(...a)=>{if(!isLive())return {state:'center-unavailable'};return fn(...a);};
 return Object.freeze({status:guard(status),statuses:guard(statuses),adopt:guard(adopt)});
}
module.exports={createAdoptionService,TRANSIENT,validFact};
