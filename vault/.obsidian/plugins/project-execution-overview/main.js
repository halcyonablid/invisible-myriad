const __PeoSnapshotKeys=(()=>{const module={exports:{}};
'use strict';
// Flat, owner-derived display projection. It is not an identity registry or write grant.
const FIELDS=Object.freeze(['contextKeyId','declarationEvidenceId','address','canonicalLabel','displayLabel','color','icon','source','sourceMode','sourceGroupId','sourceGroupTitle','primaryNodeKey']);
function copyKeys(value){
 if(!Array.isArray(value))throw Error('key-directory-missing');
 const length=value.length,out=[];let total=0;
 if(!Number.isInteger(length)||length<0||length>50000)throw Error('key-directory-limit');
 for(let i=0;i<length;i++){
  const row=value[i],copy={};
  if(!row||typeof row!=='object')throw Error('key-directory-row');
  for(let j=0;j<FIELDS.length;j++){
   const field=FIELDS[j],text=row[field];
   if(typeof text!=='string'||text.length>16384)throw Error('key-directory-field');
   total+=text.length;if(total>8*1024*1024)throw Error('key-directory-size');
   copy[field]=text;
  }
  if(!copy.contextKeyId||!copy.displayLabel||copy.source!=='project-execution-overview')throw Error('key-directory-identity');
  out.push(Object.freeze(copy));
 }
 return Object.freeze(out);
}
module.exports={FIELDS,copyKeys};

return module.exports;})();
const __PeoObserverPublisher=(()=>{const module={exports:{}};
'use strict';
const {copyKeys}=__PeoSnapshotKeys;
const UNAVAILABLE=Object.freeze({contractVersion:1,status:'unavailable',stoppedLabels:Object.freeze([]),evidenceRevision:null,expiresAt:null});
function createPublisher({capture,captureReadGuard=()=>null,loadNavigation,loadEvidence,keyDirectory=null,notify=()=>{},clock=Date.now,schedule=(f,d)=>setTimeout(f,d),cancel=clearTimeout,navMaxAgeMs=30000,renewLeadMs=0,prepareRenewal=null,prepareEvidenceProof=null,diagnosticsLimit=64}={}){
 let closed=false,epoch=0,navEpoch=0,dirty=false,flight=null,timer=null,nav=null,writes=0,demandUntil=0,retries=0,publication=0;
 // r30: renew ahead of the published deadline. A renewal never extends or rewrites a published object.
 let renewTimer=null,renewFor=null,renewAttempt=0,renewNext=false,lastReadAt=-Infinity,lastRefreshAt=-Infinity;const diag=[];
 // r33: invalidation quiet window, write-derived demand, expired-ready retry state.
 let quietUntil=0,pendingSince=0,lastInvalidationAt=-Infinity,writeDemand=false,staleRetrying=false;
 // r34: write-derived demand window, separate from the refresh window so a consumer refresh cannot shorten it.
 let postWriteUntil=0;
 // r41: content-only changes (verified by the host) keep the published directory and rebuild navigation in a side flight
 // that never blocks renewals; failures self-heal slowly within bounds instead of parking in error.
 let soft=null,softFlight=null,softAgain=false,failRound=null,healTimer=false;const SOFT_MAX_MS=90000,SLOW_RETRY_MS=10000,FAIL_HEAL_MS=180000;
 // r31: refresh-requested background navigation rebuild (renewal semantics: never publishes stale).
 let navRefreshWanted=false,forceNavNext=false;
 const sourceTag=s=>{const v=String(s||'');return /^[A-Za-z0-9:_.-]{1,80}$/.test(v)?v:(v?'other':'');};
 const renewEnabled=Number.isFinite(renewLeadMs)&&renewLeadMs>0&&typeof prepareRenewal==='function';
 const navAge=Number.isFinite(navMaxAgeMs)&&navMaxAgeMs>0?navMaxAgeMs:30000;
 let snapshot=Object.freeze({...UNAVAILABLE,status:'unknown'}),expired=snapshot,publicationGuard=null;
 const time=()=>{try{const t=clock();return Number.isFinite(t)?t:NaN;}catch{return NaN;}};
 const deps=()=>{const x=capture();if(!Array.isArray(x)||!x.length)throw Error('dependencies-unavailable');return x.slice();};
 const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 // Diagnostics: timings, counts and codes only. Never labels, keys or paths.
 function note(kind,extra){try{diag.push(Object.freeze({at:time(),kind,...(extra||{})}));if(diag.length>diagnosticsLimit)diag.splice(0,diag.length-diagnosticsLimit);}catch{}}
 const codeOf=e=>{const c=String(e?.code||e?.message||'');return /^[A-Za-z0-9_-]{1,64}$/.test(c)?c:'other';};
 function clearRenew(){if(renewTimer!==null){cancel(renewTimer);renewTimer=null;}renewFor=null;renewAttempt=0;}
 function renewRetry(n,end){const d=[100,300,800,1500][renewAttempt++];if(d===undefined||!(time()+d<end-200)){note('renew-skip',{reason:'retry-exhausted'});return;}note('renew-wait',{attempt:renewAttempt});renewTimer=schedule(()=>{renewTimer=null;renewTick(n,end);},d);}
 function renewTick(n,end){
  if(closed||snapshot!==n||n.status!=='ready'||renewFor!==n)return;
  const t=time();if(!(t<end-200)){note('renew-skip',{reason:'late'});return;}
  // Only real demand (a valid ready read or an explicit refresh) qualifies; a renewal never creates demand.
  const lastDemandAt=Math.max(lastReadAt,lastRefreshAt);if(!(t-lastDemandAt<60000)){note('renew-skip',{reason:'no-demand'});return;}
  if(writes){note('renew-skip',{reason:'write'});return;}
  if(flight){renewRetry(n,end);return;}
  demandUntil=Math.max(demandUntil,lastDemandAt+60000);
  let ok=false;try{ok=prepareRenewal(end)===true;}catch{ok=false;}
  if(closed||snapshot!==n||renewFor!==n)return;
  if(!ok){renewRetry(n,end);return;}
  note('renew-start');renewNext=true;dirty=true;queue(0);
 }
 function armRenew(n,end){if(!renewEnabled||closed||!Number.isFinite(end))return;renewFor=n;renewAttempt=0;renewTimer=schedule(()=>{renewTimer=null;renewTick(n,end);},Math.max(0,end-renewLeadMs-time()));}
 function publish(status,result=null,expiresAt=null,guard=null,failureCode=null){
  const labels=Object.freeze(result?[...new Set(result.stoppedLabels)].sort():[]);
  const n=Object.freeze({contractVersion:1,coverage:'observed-navigation',status,createdAt:time(),publicationRevision:++publication,inputEpoch:epoch,navEpoch,sourceScope:result?.sourceScope||'',navigationHealthRevision:result?.navigationHealthRevision||'',trackingProviderGeneration:result?.providerGeneration||'',evidenceRevision:result?.evidenceRevision||null,stoppedLabels:labels,expiresAt,...(keyDirectory?{keyListVersion:1,contextKeys:result?.contextKeys||Object.freeze([])}:{}),...(result?.keyDirectoryCoverage?{keyDirectoryCoverage:result.keyDirectoryCoverage,currentConfiguredScope:result.currentConfiguredScope,qualificationRevisions:result.qualificationRevisions}:{}),...(failureCode?{diagnostics:Object.freeze([Object.freeze({code:failureCode})])}:{})});
  const at=time();
  const changed=snapshot.status!==status||snapshot.sourceScope!==n.sourceScope||snapshot.trackingProviderGeneration!==n.trackingProviderGeneration||JSON.stringify(snapshot.stoppedLabels)!==JSON.stringify(labels)||(keyDirectory&&JSON.stringify(snapshot.contextKeys)!==JSON.stringify(n.contextKeys))||(snapshot.status==='ready'&&!(at>=snapshot.createdAt&&at<snapshot.expiresAt));
  snapshot=n;publicationGuard=status==='ready'?guard:null;expired=Object.freeze({...n,status:status==='ready'?'stale':status,stoppedLabels:Object.freeze([]),evidenceRevision:null,...(keyDirectory?{contextKeys:Object.freeze([])}:{})});
  clearRenew();if(status==='ready')staleRetrying=false;
  if(changed)try{notify(n);}catch{}
  if(status==='ready'&&snapshot===n)armRenew(n,expiresAt);
 }
 const active=()=>!closed&&(time()<demandUntil||time()<postWriteUntil);
 // r33 P3: a build started with real demand may finish even if the 60s demand window lapses mid-build.
 const activeFor=token=>active()||(!closed&&Number.isFinite(token?.demandUntil)&&time()<token.demandUntil);
 // r33 P1: one scheduling path. An invalidation arriving within QUIET_MS of the previous one is a burst: the build waits
 // until the burst is quiet (bounded from the burst's first event); an isolated invalidation still builds immediately.
 const QUIET_MS=1500,QUIET_MAX_MS=8000;
 function quietDelay(){const t=time();if(!pendingSince||!(t<quietUntil))return 0;return Math.max(0,Math.min(quietUntil,pendingSince+QUIET_MAX_MS)-t);}
 function queue(delay=0){if(!active()||writes||flight||timer!==null||!dirty)return;timer=schedule(()=>{timer=null;start();},Math.max(delay,quietDelay()));}
 function invalidate(kind='navigation',source=''){
  if(closed)return;soft=null;softFlight=null;softAgain=false;failRound=null;if(healTimer&&timer!==null){cancel(timer);timer=null;}healTimer=false;note('invalidate',{scope:String(kind),source:sourceTag(source)});const qt=time();if(qt-lastInvalidationAt<QUIET_MS){quietUntil=qt+QUIET_MS;if(!pendingSince)pendingSince=qt;}else pendingSince=0;lastInvalidationAt=qt;
  epoch++;retries=0;dirty=true;if(kind!=='tracking'){navEpoch++;nav=null;}publish('stale');queue();
 }
 // r41: soft = delay, not skip. The ready object stays published (renewals keep running on the current navigation);
 // one background navigation rebuild always follows and a normal build then publishes. Bounded by SOFT_MAX_MS from the
 // first unpublished soft event; past it, or without a valid ready object, the change is handled as a hard invalidation.
 function softInvalidate(source=''){
  if(closed)return;const t=time(),s=snapshot,valid=s.status==='ready'&&t>=s.createdAt&&t<s.expiresAt;
  if(!valid||soft&&!(t-soft.since<SOFT_MAX_MS)){invalidate('navigation',valid?'soft-expired':'soft-unready');return;}
  if(!soft)soft={since:t};note('soft-invalidate',{source:sourceTag(source)});
  demandUntil=Math.max(demandUntil,t+60000);
  if(softFlight){softAgain=true;return;}
  startSoftNav(0);
 }
 function startSoftNav(delay){
  if(closed||!soft)return;
  const token={since:soft.since};softFlight=token;
  schedule(()=>{
   if(closed||softFlight!==token)return;
   if(writes){softFlight=null;return;}
   const live=()=>!closed&&!writes&&softFlight===token;note('soft-nav-start');
   Promise.resolve().then(async()=>{
    const d0=deps(),guard=captureReadGuard(time()),started=time();
    const value=await loadNavigation(Object.freeze({isCurrent:live,mark:()=>{}}));
    if(!live())return;
    if(!equal(d0,deps())||!guard.navigationCurrent())throw Object.assign(Error('soft-nav-source'),{code:'SOFT_NAV_SOURCE'});
    const createdAt=time();nav={value,epoch:navEpoch,deps:d0,guard,createdAt,expiresAt:createdAt+navAge};note('soft-nav-done',{ms:createdAt-started});
    softFlight=null;if(softAgain){softAgain=false;startSoftNav(0);return;}
    dirty=true;queue();
   }).catch(error=>{
    if(softFlight!==token)return;softFlight=null;
    const t=time();note('soft-nav-error',{code:codeOf(error)});
    if(soft&&t-soft.since<SOFT_MAX_MS){softAgain=false;demandUntil=Math.max(demandUntil,t+SLOW_RETRY_MS+5000);startSoftNav(SLOW_RETRY_MS);}
    else invalidate('navigation','soft-expired');
   });
  },Math.max(0,delay|0));
 }
 function current(token){
  if(closed||writes||epoch!==token.epoch||!activeFor(token)||!(time()>=token.started))return false;
  const observed=deps();
  if(closed||writes||epoch!==token.epoch||!activeFor(token))return false;
  if(!equal(token.deps,observed)){invalidate('navigation','deps');return false;}
  // r31: navigation phase checks navigation sources only; the tracking proof belongs to the evidence phase.
  if(token.guard){
   if(token.phase==='navigation'){if(!token.guard.navigationCurrent()){invalidate('navigation','nav-source');return false;}}
   else if(!token.guard(false,null,time())){let navOk=false;try{navOk=typeof token.guard.navigationCurrent!=='function'||token.guard.navigationCurrent();}catch{}
    // Evidence failure with unchanged sources keeps the completed navigation; only evidence is redone.
    invalidate(navOk?'tracking':'navigation',navOk?'evidence-guard':'nav-source');return false;}
  }
  return !closed&&!writes&&flight===token&&epoch===token.epoch&&activeFor(token);
 }
 function start(){
  if(!active()||writes||flight||!dirty)return;
  {const qd=quietDelay();if(qd>0){if(timer===null)timer=schedule(()=>{timer=null;start();},qd);return;}}pendingSince=0;
  dirty=false;const token={epoch,deps:null,started:time(),demandUntil:time()+300000,phase:'navigation',forceNav:forceNavNext,renewal:renewNext,renewBase:renewNext&&renewFor?renewFor.expiresAt:null};renewNext=false;forceNavNext=false;flight=token;let retryDelay=0,retryHeal=false;healTimer=false;
  const drop=stage=>{note('drop',{stage,renewal:token.renewal});};
  note('build-start',{renewal:token.renewal});
  Promise.resolve().then(async()=>{
   token.deps=deps();token.guard=captureReadGuard(time());if(!current(token))return drop('capture');
   let selected=nav;
   // Reuse is keyed by navigation epoch/deps/source observation; age is only a missed-event backstop.
   // Near the backstop a renewal rebuilds now so the next publication is not capped by it.
   const margin=renewEnabled?renewLeadMs*2:0;
   if(token.forceNav||!selected||selected.epoch!==navEpoch||!equal(selected.deps,token.deps)||selected.guard&&!selected.guard.navigationCurrent()||!(time()>=selected.createdAt&&time()<selected.expiresAt-margin)){
    const navStarted=time();note('nav-start',{renewal:token.renewal});
    const value=await loadNavigation(Object.freeze({isCurrent:()=>!closed&&!writes&&epoch===token.epoch,mark:(stage,ms,x)=>{const n=v=>Number.isFinite(v)?Math.round(v):null,g=x&&typeof x==='object'?x:{};note('nav-stage',{stage:sourceTag(stage),ms:n(ms),items:n(g.items),kwN:n(g.kwN),kwMs:n(g.kwMs),wsN:n(g.wsN),wsMs:n(g.wsMs)});}}));note('nav-done',{ms:time()-navStarted});if(!current(token))return drop('navigation');
    const createdAt=time();selected={value,epoch:navEpoch,deps:token.deps,guard:token.guard,createdAt,expiresAt:createdAt+navAge};nav=selected;navRefreshWanted=false;
   }else note('nav-reuse',{ageMs:time()-selected.createdAt});
   // r31: fresh tracking proof for the evidence phase (bounded wait for an owner renewal; never relaxed).
   if(typeof prepareEvidenceProof==='function'){for(const d of [0,100,300,800,1500,3000]){if(d){await new Promise(res=>schedule(res,d));if(!current(token))return drop('proof-wait');}let ok=false;try{ok=prepareEvidenceProof(time())===true;}catch{}if(ok)break;note('proof-wait',{delay:d});}}
   const navGuard=token.guard;
   token.guard=captureReadGuard(time());token.phase='evidence';
   if(navGuard&&typeof navGuard.navigationCurrent==='function'&&!navGuard.navigationCurrent()){invalidate('navigation','nav-source');return drop('nav-source');}
   if(!current(token))return drop('recapture');
   const evidenceStarted=time();
   const result=await loadEvidence(selected.value,()=>current(token),token.guard);note('evidence-done',{ms:time()-evidenceStarted});if(!current(token))return drop('evidence');
   const labels=result?.stoppedLabels,sourceScope=result?.sourceScope,providerGeneration=result?.providerGeneration,evidenceRevision=result?.evidenceRevision,deadline=result?.expiresAt;
   if(!Array.isArray(labels)||typeof sourceScope!=='string'||!sourceScope||typeof providerGeneration!=='string'||!providerGeneration||typeof evidenceRevision!=='string'||!evidenceRevision||!Number.isFinite(deadline))throw Error('evidence-invalid');
   const length=labels.length,plainLabels=[];
   if(!Number.isInteger(length)||length<0||length>50000)throw Error('evidence-invalid');
   for(let i=0;i<length;i++){const label=labels[i];if(typeof label!=='string'||!label||label.length>4096)throw Error('evidence-invalid');plainLabels.push(label);}
   const end=Math.min(deadline,selected.expiresAt);if(!(time()<end))throw Error('evidence-expired');
   const contextKeys=keyDirectory?copyKeys(result.contextKeys||keyDirectory(selected.value)):null;
   const captured={stoppedLabels:plainLabels,sourceScope,providerGeneration,evidenceRevision,contextKeys,navigationHealthRevision:result.navigationHealthRevision,
    keyDirectoryCoverage:result.keyDirectoryCoverage,currentConfiguredScope:result.currentConfiguredScope,qualificationRevisions:result.qualificationRevisions};
   if(!current(token))return drop('captured');
   const finalTime=time();if(!(finalTime>=selected.createdAt&&finalTime<end))throw Error('evidence-expired');
   if(token.guard&&!token.guard(true,captured,time()))throw Error('publication-lease-invalid');
   if(!current(token))return drop('final');
   // A renewal must move the deadline forward; otherwise stop and let the published object expire normally.
   // Changed content is still published (deadline not extended); unchanged content just stops renewing.
   if(token.renewal&&!(end>token.renewBase+1000)){const same=JSON.stringify(snapshot.stoppedLabels)===JSON.stringify([...new Set(plainLabels)].sort())&&(!keyDirectory||JSON.stringify(snapshot.contextKeys)===JSON.stringify(contextKeys));note('renew-skip',{reason:'no-progress',contentChanged:!same});if(same)return;}
   retries=0;failRound=null;if(!softFlight&&!softAgain)soft=null;publish('ready',captured,end,token.guard);
   note('ready',{ms:time()-token.started,remainingMs:end-time(),renewal:token.renewal,forceNav:token.forceNav});
   // r31 M4: a refresh was served from a reused (>30s) navigation; rebuild it in the background as a renewal.
   if(navRefreshWanted&&!token.forceNav&&nav&&time()-nav.createdAt>30000&&renewFor===snapshot){navRefreshWanted=false;renewNext=true;forceNavNext=true;dirty=true;note('nav-background');}
  }).catch(error=>{
   const code=codeOf(error),sub=/^[A-Za-z0-9_.-]{1,80}$/.test(String(error?.detail||''))?String(error.detail):'';
   if(closed||epoch!==token.epoch){note('drop',{stage:'superseded',code,renewal:token.renewal});return;}
   const t=time();let validReady=snapshot.status==='ready'&&t>=snapshot.createdAt&&t<snapshot.expiresAt;
   if(validReady&&publicationGuard){try{validReady=publicationGuard(true,null,time())===true;}catch{validReady=false;}}
   // r33 P5: a still-valid published directory is never overwritten by an error; it stays bounded by its own deadline/guard.
   if(validReady){note('error',{code,sub,renewal:token.renewal,kept:true});
    if(token.renewal&&renewFor===snapshot)renewRetry(snapshot,snapshot.expiresAt);else if(retries<3){retryDelay=[500,2000,5000][retries++];dirty=true;}
    else{const ft=time();if(!failRound)failRound={since:ft};if(ft-failRound.since<FAIL_HEAL_MS){retryDelay=SLOW_RETRY_MS;retryHeal=true;dirty=true;demandUntil=Math.max(demandUntil,ft+SLOW_RETRY_MS+5000);note('heal-retry',{kept:true});}}
    return;}
   const errCode=/^DIRECTORY_[A-Z0-9_]+$/.test(error?.code||'')?error.code:'DIRECTORY_BUILD_UNAVAILABLE';
   // r35 H2: a transient upstream ok:false (torn read / API not yet available / read failed) uses the health retry table.
   const healthRetry=['TRACKING_NOT_READY','NAVIGATION_HEALTH_NOT_READY'].includes(error?.code)||(error?.code==='DIRECTORY_SOURCE_NOT_READY'&&error.transient===true);
   // r33 A4: an expired ready publishes stale while bounded retries run; when they are exhausted the original error is published.
   // Health/tracking codes keep their original retry table; other codes use [500,2000,5000]. Quiet window still applies via queue().
   if((snapshot.status==='ready'||snapshot.status==='stale'&&staleRetrying)&&retries<3&&active()){note('error',{code,sub,renewal:token.renewal,kept:false,expired:true});staleRetrying=true;if(snapshot.status==='ready')publish('stale');staleRetrying=true;retryDelay=(healthRetry?[250,1000,3000]:[500,2000,5000])[retries++];dirty=true;return;}
   staleRetrying=false;note('error',{code,sub,renewal:token.renewal,kept:false});publish('error',null,null,null,errCode);
   if(healthRetry&&retries<3&&active()){retryDelay=[250,1000,3000][retries++];dirty=true;}
   else{const ft=time();if(!failRound)failRound={since:ft};if(ft-failRound.since<FAIL_HEAL_MS){retryDelay=SLOW_RETRY_MS;retryHeal=true;dirty=true;demandUntil=Math.max(demandUntil,ft+SLOW_RETRY_MS+5000);note('heal-retry');}}
  }).finally(()=>{if(flight===token)flight=null;queue(retryDelay);if(retryHeal&&timer!==null)healTimer=true;});
 }
 return Object.freeze({
  read(){
   const selected=snapshot,guard=publicationGuard,stale=expired;
   if(selected.status!=='ready')return selected;
   const t=time();let valid=t>=selected.createdAt&&t<selected.expiresAt;
   if(valid&&guard)try{valid=guard(true,null,time());}catch{valid=false;}
   // A reader may reenter invalidation/close. Never return the earlier ready object.
   if(closed||snapshot!==selected||publicationGuard!==guard)return UNAVAILABLE;
   const after=time();
   // Demand timestamp only: no IO, scheduling, notification or diagnostics from a read.
   if(valid&&after>=selected.createdAt&&after<selected.expiresAt){lastReadAt=after;return selected;}
   return stale;
  },
  requestRefresh(){
   if(closed||!Number.isFinite(time()))return false;
   demandUntil=time()+60000;retries=0;failRound=null;if(healTimer&&timer!==null){cancel(timer);timer=null;}healTimer=false;lastRefreshAt=time();note('refresh');
   // r31 M4: serve the refresh from the current navigation; an old one is rebuilt in the background after ready.
   if(nav&&!(time()-nav.createdAt<=30000))navRefreshWanted=true;
   let sourceCurrent=true;try{sourceCurrent=!nav?.guard||nav.guard.navigationCurrent();}catch{sourceCurrent=false;}
   if(!sourceCurrent){navEpoch++;nav=null;dirty=true;}
   if(flight?.guard){let ok=false,navOk=false;try{if(flight.phase==='navigation'){ok=flight.guard.navigationCurrent();navOk=ok;}else{ok=flight.guard(false,null,time());navOk=ok||typeof flight.guard.navigationCurrent!=='function'||flight.guard.navigationCurrent();}}catch{}
    if(!ok){invalidate(navOk?'tracking':'navigation','refresh-flight');return true;}}
   if(writes>0)writeDemand=true;
   if(!flight)dirty=true;queue();return true;
  },
  invalidate,
  softInvalidate,
  beginWrite(){if(closed)return ()=>{};
   // r33 P3: demand observed when the write starts (or a refresh during it) survives the write; nested writes OR it.
   // r34: it lasts 5 minutes after the outermost release (postWriteUntil); a release is an invalidation-like event for burst quiet.
   {const d=time()<demandUntil||time()-Math.max(lastReadAt,lastRefreshAt)<300000;writeDemand=writes===0?d:(writeDemand||d);}
   writes++;invalidate('navigation','write');let done=false;return ()=>{if(done)return;done=true;writes--;if(!closed){epoch++;navEpoch++;nav=null;dirty=true;if(writes===0){if(writeDemand)postWriteUntil=time()+300000;writeDemand=false;{const rt=time();if(rt-lastInvalidationAt<QUIET_MS){quietUntil=rt+QUIET_MS;pendingSince=rt;}lastInvalidationAt=rt;}}queue();}};},
  close(){if(closed)return;closed=true;epoch++;nav=null;dirty=false;if(timer!==null){cancel(timer);timer=null;}publish('unavailable');clearRenew();},
  diagnostics(){return Object.freeze({renewLeadMs:renewEnabled?renewLeadMs:0,navMaxAgeMs:navAge,status:snapshot.status,expiresAt:snapshot.expiresAt,events:Object.freeze(diag.slice())});}
 });
}
module.exports={createPublisher,UNAVAILABLE};

return module.exports;})();
const __PeoObserverEvidence=(()=>{const module={exports:{}};
'use strict';
async function loadEvidence(navigation,api,collectTracking,isCurrent,clock=Date.now){
 const read=api?.getContextTrackingRevisionV1;
 if(api?.operationalLifecyclePolicyV1!=='tracking-only-v2'||typeof read!=='function')throw Error('tracking-provider-unavailable');
 const before=read();
 const ready=v=>v?.contractVersion===1&&v.status==='ready'&&typeof v.contentRevision==='string'&&v.contentRevision&&Number.isFinite(v.expiresAt)&&clock()<v.expiresAt;
 if(!ready(before)){api.requestContextTrackingRevisionRefreshV1?.();const e=Error('tracking-not-ready');e.code='TRACKING_NOT_READY';throw e;}
 const {entries,groups}=navigation;
 if(!Array.isArray(entries)||entries.length>50000||!Array.isArray(groups)||groups.length>50000)throw Error('navigation-limit');
 let evidence;
 if(groups.length){evidence=await collectTracking({groups},api,isCurrent);}
 else{
  const scope=api.getContextTrackingScopeV1();
  if(scope?.ok!==true||scope.contractVersion!==1||scope.sourceScope!==before.sourceScope||scope.providerGeneration!==before.providerGeneration)throw Error('scope-mismatch');
  const r=await api.listContextTrackingStatesV1({contractVersion:1,sourceNotePath:scope.sourceScope,subjects:[]});
  if(!r?.ok||r.contractVersion!==1||r.snapshotType!=='mandala-context-tracking-states-v1'||r.coveredScope!=='requested-exact-subjects'||r.complete!==true||r.truncated!==false||r.hasMore!==false||r.sourceScope!==scope.sourceScope||r.providerGeneration!==scope.providerGeneration||r.count!==0||r.returnedCount!==0||r.totalCount!==0||!Array.isArray(r.items)||r.items.length!==0)throw Error('empty-evidence-invalid');
  evidence={ok:true,states:new Map(),sourceScope:r.sourceScope,providerGeneration:r.providerGeneration,revision:r.revision};
 }
 const after=read();
 if(!isCurrent()||!ready(before)||!ready(after)||before.sourceScope!==after.sourceScope||before.providerGeneration!==after.providerGeneration||before.epoch!==after.epoch||before.contentRevision!==after.contentRevision||!evidence.ok||evidence.sourceScope!==before.sourceScope||evidence.providerGeneration!==before.providerGeneration||evidence.revision!==before.contentRevision)throw Error('tracking-evidence-changed');
 const labels=new Map();
 for(const item of entries){
  const label=item.displayLabel.trim().replace(/\s+/g,' ').toLocaleLowerCase();
  let row=labels.get(label);if(!row)labels.set(label,row={ids:new Set(),roots:new Set(),complete:true});row.ids.add(item.contextKeyId);
  for(const s of item.sources){if(!['workspace','mandala'].includes(s.mode)||!s.primaryNodeKey)row.complete=false;else row.roots.add(s.primaryNodeKey);}
 }
 const stoppedLabels=[];
 for(const [label,row]of labels)if(row.complete&&row.ids.size===1&&row.roots.size&&[...row.roots].every(k=>evidence.states.get(k)==='stopped'))stoppedLabels.push(label);
 return {stoppedLabels,sourceScope:after.sourceScope,providerGeneration:after.providerGeneration,evidenceRevision:after.contentRevision,expiresAt:Math.min(before.expiresAt,after.expiresAt)};
}
module.exports={loadEvidence};

return module.exports;})();
const __PeoConfiguredDirectory=(()=>{const module={exports:{}};
'use strict';
const fail=code=>{throw Object.assign(Error(code),{code});};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const string=x=>typeof x==='string'&&x.length>0&&x.length<=16384&&x===x.trim();
const pathOk=x=>string(x)&&x.length<=4096&&!/[\\:\x00-\x1f\x7f]/.test(x)&&x.split('/').every(p=>p&&p!=='.'&&p!=='..');
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&typeof x.then!=='function';
const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
function canonical(key,domain,source){
 if(!string(key)||key.length>8192||!key.startsWith('jump:v1:'))return false;
 try{const raw=key.slice(8).split('|'),p=raw.map(decodeURIComponent);if(p.length!==5||raw.some((x,i)=>encodeURIComponent(p[i])!==x)||p[1]!==source||!p[4])return false;
  return domain==='project'?p[0]==='workspace-mount-view'&&p[2]==='tab'&&!!p[3]:p[0]==='mandala-time-blocks'&&p[2]==='node'&&p[3]==='mandala';
 }catch{return false;}
}
function keySource(key){try{return decodeURIComponent(key.slice(8).split('|')[1]);}catch{return '';}}
function identity(mode,key){return (mode==='workspace'?'project':mode==='mandala'?'goal':mode)+'\0'+key;}
function validate(result,domain,scope,generation){
 const goal=domain==='goal',owner=goal?scope.trackingSourceNotePath:scope.workspaceSourceNotePath;
 const type=goal?'mandala-effective-goal-operational-context-keys-v1':'mandala-effective-operational-context-keys-v1';
 const enumeration=goal?'mandala-goal-tracking-rows':'workspace-project-entry-list',view=goal?'mandala-time-blocks':'workspace-mount-view';
 {const __env=[['e00._object_result_',()=>!object(result)],['e01.ok___true',()=>{if(result.ok===true)return false;const r=typeof result.reason==='string'&&/^[a-z0-9-]{1,80}$/.test(result.reason)?result.reason:'other';throw Object.assign(Error('DIRECTORY_SOURCE_NOT_READY'),{code:'DIRECTORY_SOURCE_NOT_READY',detail:r,transient:/(-torn-read|-api-unavailable|-read-failed)$/.test(r)});}],['e02.complete___true',()=>result.complete!==true],['e03.contractVersion___1',()=>result.contractVersion!==1],['e04.snapshotType___type',()=>result.snapshotType!==type],['e05.operationalLifecyclePolicyV1____trac',()=>result.operationalLifecyclePolicyV1!=='tracking-only-v2'],['e06.readPurpose____display_',()=>result.readPurpose!=='display'],['e07.writeAuthorization___false',()=>result.writeAuthorization!==false],['e08.providerGeneration___generation',()=>result.providerGeneration!==generation],['e09.instanceId___generation',()=>result.instanceId!==generation],['e10.sourceScope___scope.trackingSourceNo',()=>result.sourceScope!==scope.trackingSourceNotePath],['e11.sourceNotePath___scope.trackingSourc',()=>result.sourceNotePath!==scope.trackingSourceNotePath],['e12._goal__workspaceSourceNotePath___own',()=>!goal&&result.workspaceSourceNotePath!==owner],['e13.typeof_revision____string_',()=>typeof result.revision!=='string'],['e14.____a_f0_9__64___.test_revision_',()=>!/^[a-f0-9]{64}$/.test(result.revision)],['e15.hasMore___false',()=>result.hasMore!==false],['e16.truncated___false',()=>result.truncated!==false],['e17._Number.isSafeInteger_limit_',()=>!Number.isSafeInteger(result.limit)],['e18.limit_1',()=>result.limit<1],['e19.limit_500',()=>result.limit>500],['e20._Number.isSafeInteger_totalCount_',()=>!Number.isSafeInteger(result.totalCount)],['e21.totalCount_0',()=>result.totalCount<0],['e22.totalCount_500',()=>result.totalCount>500],['e23._Array.isArray_items_',()=>!Array.isArray(result.items)],['e24._Array.isArray_targets_',()=>!Array.isArray(result.targets)],['e25.items.length_500',()=>result.items.length>500],['e26.count___items.length',()=>result.count!==result.items.length],['e27.returnedCount___count',()=>result.returnedCount!==result.count],['e28.targets.length___count',()=>result.targets.length!==result.count]];const __bad=__env.find(e=>e[1]());if(__bad)throw Object.assign(Error('DIRECTORY_FINAL_ENVELOPE'),{code:'DIRECTORY_FINAL_ENVELOPE',detail:__bad[0]});}
 const q=result.qualificationEvidence;
 if(!object(q)||q.contractVersion!==1||q.snapshotType!=='mandala-final-qualification-evidence-v1'||q.coverage!=='enumerated-owner-subjects'||q.domain!==domain
  ||q.trackingSourceNotePath!==scope.trackingSourceNotePath||q.ownerSourceNotePath!==owner||q.ownerViewType!==view||q.enumeration!==enumeration
  ||q.providerGeneration!==generation||q.revision!==result.revision||!Array.isArray(q.subjects)||q.subjects.length>result.limit||q.count!==q.subjects.length||result.totalCount<q.count)fail('DIRECTORY_FINAL_QUALIFICATION');
 if(q.visibilityEvidenceVersion!==1)fail('DIRECTORY_VISIBILITY_VERSION');
 const subjects=new Map(),eligible=new Map(),stopped=new Set(),visibilitySubjects=[];
 for(const s of q.subjects){
  if(!object(s)||!canonical(s.primaryNodeKey,domain,owner)||subjects.has(s.primaryNodeKey)||!['eligible','ineligible'].includes(s.status)
   ||!Array.isArray(s.reasons)||s.reasons.length>500||s.reasons.some(x=>!string(x))||s.status==='eligible'&&(!string(s.contextKeyId)||s.reasons.length!==0)
   ||s.status==='ineligible'&&(s.contextKeyId!==''||!s.reasons.length))fail('DIRECTORY_FINAL_SUBJECT');
  const v=s.visibility;
  if(!object(v)||typeof v.ownerPresent!=='boolean'||!['active','stopped','unrecorded','unknown'].includes(v.trackingState)||!Array.isArray(v.currentDeclarations)||v.currentDeclarations.length>500)fail('DIRECTORY_VISIBILITY_SCHEMA');
  const validDeclaration=d=>object(d)&&string(d.contextKeyId)&&d.contextKeyId.length<=8192&&string(d.displayLabel)&&d.displayLabel.length<=8192;
  if(v.currentDeclarations.some(d=>!validDeclaration(d)))fail('DIRECTORY_VISIBILITY_SCHEMA');
  if(v.currentDeclarations.length===1){const d=v.currentDeclarations[0];if(!validDeclaration(v.currentDeclaration)||v.currentDeclaration.contextKeyId!==d.contextKeyId||v.currentDeclaration.displayLabel!==d.displayLabel)fail('DIRECTORY_VISIBILITY_DECLARATION');}
  else if(v.currentDeclaration!==null)fail('DIRECTORY_VISIBILITY_DECLARATION');
  const stoppedReason=goal?'mandala-goal-tracking-stopped':'mandala-project-tracking-stopped';
  if((v.trackingState==='stopped')!==s.reasons.includes(stoppedReason))fail('DIRECTORY_VISIBILITY_TRACKING');
  if(s.status==='eligible'&&(!v.ownerPresent||v.trackingState!=='active'||!v.currentDeclaration||v.currentDeclaration.contextKeyId!==s.contextKeyId))fail('DIRECTORY_VISIBILITY_ELIGIBLE');
  visibilitySubjects.push({primaryNodeKey:s.primaryNodeKey,visibility:v});
  subjects.set(s.primaryNodeKey,s);
  if(s.status==='eligible')eligible.set(s.primaryNodeKey,s);
  if(s.status==='ineligible'&&s.reasons.includes(goal?'mandala-goal-tracking-stopped':'mandala-project-tracking-stopped'))stopped.add(identity(goal?'mandala':'workspace',s.primaryNodeKey));
 }
 const targets=[],seen=new Set();
 for(let i=0;i<result.items.length;i++){
  const t=result.items[i],other=result.targets[i],k=t?.sourceKey,s=eligible.get(k),c=t?.contextKey;
  if(!object(t)||!object(other)||!s||seen.has(k)||!canonical(k,domain,owner)||t.sourceId!==k||t.nodeId!==k||t.sourcePlugin!=='mandala-time-blocks'||t.domain!==domain||t.sourceType!==domain||t.identityVersion!==1
   ||t.sourceScope!==scope.trackingSourceNotePath||t.sourceNotePath!==scope.trackingSourceNotePath||t.eligibilityRevision!==result.revision||t.evidenceRevision!==result.revision
   ||t.status!=='active'||t.active!==true||t.lifecycleState!=='active'||!object(c)||c.contextKeyId!==s.contextKeyId||c.id!==s.contextKeyId
   ||!string(c.displayLabel)||!string(c.canonicalLabel)||typeof c.address!=='string'||t.label!==c.displayLabel
   ||['sourcePlugin','domain','sourceType','identityVersion','sourceScope','sourceNotePath','sourceId','sourceKey','nodeId','label','active','status','lifecycleState','eligibilityRevision','evidenceRevision'].some(field=>other[field]!==t[field])
   ||['contextKeyId','id','address','canonicalLabel','displayLabel'].some(field=>other.contextKey?.[field]!==c[field]))fail('DIRECTORY_FINAL_TARGET');
  if(s.visibility.currentDeclaration.displayLabel!==c.displayLabel)fail('DIRECTORY_VISIBILITY_TARGET');
  seen.add(k);targets.push({domain,mode:goal?'mandala':'workspace',primaryNodeKey:k,contextKeyId:c.contextKeyId,displayLabel:c.displayLabel,address:c.address,canonicalLabel:c.canonicalLabel,groupTitle:typeof t.pathLabel==='string'?t.pathLabel:''});
 }
 if(seen.size!==eligible.size)fail('DIRECTORY_FINAL_BIJECTION');
 return {domain,targets,stopped,visibilitySubjects,summary:{domain,ownerSourceNotePath:owner,trackingSourceNotePath:scope.trackingSourceNotePath,enumeration,subjectCount:q.count,eligibleCount:targets.length},revision:{providerGeneration:generation,revision:result.revision}};
}
// Build-time only; all witnesses are from the already validated configured observation.
function visibilityLabels(navigation, results, normalize) {
 const labelKey=x=>x.trim().replace(/\s+/g,' ').toLocaleLowerCase();
 const subjects=new Map(),labels=new Map(),blockedLabels=new Set();
 const record=(label,id,contextKeyId,stopped)=>{
  const key=labelKey(label);let row=labels.get(key);if(!row)labels.set(key,row={owners:new Set(),ids:new Set(),stopped:true});
  row.owners.add(id);row.ids.add(contextKeyId);row.stopped=row.stopped&&stopped;
 };
 for(const result of results)for(const s of result.visibilitySubjects){
  const id=identity(result.domain==='project'?'workspace':'mandala',s.primaryNodeKey),v=s.visibility;
  subjects.set(id,v);
  const stopped=v.ownerPresent&&v.trackingState==='stopped'&&v.currentDeclarations.length===1&&!!v.currentDeclaration;
  for(const d of v.currentDeclarations)record(d.displayLabel,id,d.contextKeyId,stopped);
 }
 for(const item of navigation.items){
  const label=typeof item.keyword==='string'?item.keyword.trim():'';if(!label)continue;
  const lk=labelKey(label),sources=Array.isArray(item.sources)&&item.sources.length?item.sources:[item];
  for(const source of sources){
   const mode=source?.mode,key=source?.primaryNodeKey;
   const known=(mode==='workspace'||mode==='mandala')&&canonical(key,mode==='workspace'?'project':'goal',keySource(key));
   const id=known?identity(mode,key):null,v=id&&subjects.get(id);
   const descriptor=normalize({...item,...source,keyword:item.keyword});
   if(v){
    const d=v.currentDeclaration;
    // Connect by stable owner first: even a disappeared or renamed old label must be revoked.
    if(!descriptor||!v.ownerPresent||v.trackingState!=='stopped'||!d||labelKey(d.displayLabel)!==lk||d.contextKeyId!==descriptor.contextKeyId){blockedLabels.add(lk);continue;}
    record(label,id,d.contextKeyId,true);
   }else if(labels.has(lk)||!known||!descriptor){blockedLabels.add(lk);}
  }
 }
 const stoppedLabels=[];
 for(const [label,row] of labels){
  if(!row.stopped||row.owners.size!==1||row.ids.size!==1)blockedLabels.add(label);
  if(!blockedLabels.has(label))stoppedLabels.push(label);
 }
 return {stoppedLabels,blockedLabels};
}

function compose(navigation,results,normalize){
 const qualified=results.flatMap(r=>r.targets),byIdentity=new Map(),eligibleIds=new Map(),stopped=new Set(results.flatMap(r=>[...r.stopped]));
 for(const t of qualified){const id=identity(t.mode,t.primaryNodeKey);if(byIdentity.has(id)||eligibleIds.has(t.contextKeyId)&&eligibleIds.get(t.contextKeyId)!==id)fail('DIRECTORY_CONTEXT_ID_CONFLICT');byIdentity.set(id,t);eligibleIds.set(t.contextKeyId,id);}
 const observed=[];
 for(let i=0;i<navigation.items.length;i++){
  const item=navigation.items[i],sources=Array.isArray(item.sources)&&item.sources.length?item.sources:[item];
  for(let j=0;j<sources.length;j++){
   const source=sources[j],descriptor=normalize({...item,...source,keyword:item.keyword});if(!descriptor)continue;
   const mode=typeof source.mode==='string'?source.mode:'',key=typeof source.primaryNodeKey==='string'?source.primaryNodeKey:'';
   const known=(mode==='workspace'||mode==='mandala')&&canonical(key,mode==='workspace'?'project':'goal',keySource(key));
   const id=known?identity(mode,key):'observed\0'+mode+'\0'+key+'\0'+i+'\0'+j;
   observed.push({id,descriptor});
  }
 }
 const rows=[],seenOwner=new Set();
 for(const row of observed){const target=byIdentity.get(row.id);if(target){if(!seenOwner.has(row.id)){rows.push({id:row.id,descriptor:{...row.descriptor,...normalize({keyword:target.displayLabel,contextKeyId:target.contextKeyId,mode:target.mode,primaryNodeKey:target.primaryNodeKey,groupId:target.primaryNodeKey,groupTitle:target.groupTitle}),color:row.descriptor.color,icon:row.descriptor.icon,declarationEvidenceId:row.descriptor.declarationEvidenceId}});seenOwner.add(row.id);}continue;}
  if(eligibleIds.has(row.descriptor.contextKeyId)&&stopped.has(row.id))continue;
  rows.push(row);
 }
 for(const [id,t]of byIdentity)if(!seenOwner.has(id))rows.push({id,descriptor:normalize({keyword:t.displayLabel,contextKeyId:t.contextKeyId,mode:t.mode,primaryNodeKey:t.primaryNodeKey,groupId:t.primaryNodeKey,groupTitle:t.groupTitle})});
 const ids=new Map(),keys=[];
 for(const row of rows){const key=row.descriptor;if(!key)fail('DIRECTORY_DESCRIPTOR_INVALID');const old=ids.get(key.contextKeyId);if(old&&old!==row.id)fail('DIRECTORY_CONTEXT_ID_CONFLICT');if(old)continue;ids.set(key.contextKeyId,row.id);keys.push(key);}
 if(keys.length>50000)fail('DIRECTORY_UNION_LIMIT');
 return {...visibilityLabels(navigation,results,normalize),contextKeys:keys,activeLabels:new Set(qualified.map(t=>t.displayLabel.trim().replace(/\s+/g,' ').toLocaleLowerCase()))};
}
function create(owner,onMappingChanged){
 const vault=owner.app?.vault,lookup=vault?.getAbstractFileByPath,on=vault?.on,offref=vault?.offref;
 if(typeof lookup!=='function'||typeof on!=='function'||typeof offref!=='function')fail('DIRECTORY_VAULT_MAPPING_UNAVAILABLE');
 let epoch=0,closed=false,mappingSelectors=null;const listeners=[];
 const clean=p=>p.replace(/\\/g,'/').replace(/^\/+/, '').toLocaleLowerCase();
 const base=p=>clean(p).split('/').pop().replace(/\.md$/,'');
 const relevant=(file,oldPath)=>{
  if(!mappingSelectors||typeof file?.path!=='string'||!file.path)return true;
  const paths=[file.path,...(typeof oldPath==='string'?[oldPath]:[])];
  return paths.some(p=>mappingSelectors.some(s=>clean(p)===s.path||base(p)===s.base||clean(p).endsWith(s.path)));
 };
 try{for(const name of ['create','delete','rename'])listeners.push(on.call(vault,name,(file,oldPath)=>{if(!relevant(file,oldPath))return;epoch++;onMappingChanged();}));}catch(error){listeners.forEach(ref=>offref.call(vault,ref));throw error;}
 const ids=['workspace-mount','gtd-task-manager','collection-card-view','mandala-time-blocks'];
 const methodNames=[['resolveApiSourceNotePath','getDefaultSourceNotePath','resolveSourceFile'],['resolveSourceContext','findSourceNotePath'],['getDefaultSourceNotePath','resolveNoteFile'],['getPaths','getPathsBeforeGoalBridge']];
 function inputs(){
  const plugins=ids.map(id=>owner.app?.plugins?.plugins?.[id]);if(plugins.some(p=>!p||p.isUnloading||p.unloaded||p.contextRenameClosed||p.actionEntryClosed))fail('DIRECTORY_CONFIG_PROVIDER_UNAVAILABLE');
  const [w,g,c,m]=plugins,api=owner.getMandalaTimeBlocksApi();
  const refs=[vault,lookup,on,offref,owner.getMandalaTimeBlocksApi,api,api?.listEffectiveOperationalContextKeys,api?.listEffectiveGoalOperationalContextKeys];
  plugins.forEach((p,i)=>{refs.push(p);for(const k of methodNames[i])refs.push(p[k]);});
  if(typeof w.resolveApiSourceNotePath!=='function'||typeof g.resolveSourceContext!=='function'||typeof c.getDefaultSourceNotePath!=='function'||typeof m.getPaths!=='function'
   ||typeof api?.listEffectiveOperationalContextKeys!=='function'||typeof api?.listEffectiveGoalOperationalContextKeys!=='function'||!string(m.effectiveOperationalContextProviderGeneration))fail('DIRECTORY_FINAL_PROVIDER_UNAVAILABLE');
  const raw=[w.settings?.defaultSourceNotePath,g.runtimeSourceNotePath,g.settings?.sourceNotePath,g.settings?.dataFolder,c.settings?.defaultSourceNotePath,m.settings?.defaultSourceNotePath,owner.settings?.startQuery,owner.settings?.startNodeKey,owner.settings?.groupingMode,m.effectiveOperationalContextProviderGeneration];
  return {plugins,api,refs,raw};
 }
 function capture(){
  if(closed)fail('DIRECTORY_CONFIG_CLOSED');const initial=inputs(),mappingEpoch=epoch,[w,g,c,m]=initial.plugins;
  const ws=w.resolveApiSourceNotePath(),gtd=g.resolveSourceContext(),collection=c.getDefaultSourceNotePath(),mandala=m.getPaths();
  if(!object(gtd)||!object(mandala))fail('DIRECTORY_CONFIG_SOURCE_INVALID');
  const scope=freeze({contractVersion:1,workspaceSourceNotePath:ws,trackingSourceNotePath:mandala?.sourceNotePath,gtdSourceNotePath:gtd?.path,gtdFolder:gtd?.folder,collectionSourceNotePath:collection,mandalaDbPath:mandala?.db,mandalaKeywordsPath:mandala?.keywords,mandalaWeeklyPath:mandala?.weeklyGoals});
  if([scope.workspaceSourceNotePath,scope.trackingSourceNotePath,scope.gtdSourceNotePath,scope.collectionSourceNotePath,scope.mandalaDbPath,scope.mandalaKeywordsPath,scope.mandalaWeeklyPath].some(x=>!pathOk(x))||typeof scope.gtdFolder!=='string')fail('DIRECTORY_CONFIG_SOURCE_INVALID');
  const paths=[scope.workspaceSourceNotePath,scope.trackingSourceNotePath,scope.gtdSourceNotePath,scope.collectionSourceNotePath];
  for(const x of initial.raw.slice(0,6))if(typeof x==='string'&&x){paths.push(x,x.replace(/\\/g,'/').replace(/^\/+/,''));}
  mappingSelectors=[...new Set(paths)].map(p=>({path:clean(p),base:base(p)}));
  const probes=[...new Set(paths)].map(p=>{const file=lookup.call(vault,p);return [p,file,file?.path];});
  const current=()=>{try{
   if(closed||epoch!==mappingEpoch||owner.app?.vault!==vault||vault.getAbstractFileByPath!==lookup||vault.on!==on||vault.offref!==offref)return false;
   const next=inputs();if(!equal(initial.refs,next.refs)||!equal(initial.raw,next.raw))return false;
   for(const [p,file,at]of probes){if(lookup.call(vault,p)!==file||file?.path!==at)return false;}
   return !closed&&epoch===mappingEpoch;
  }catch{return false;}};
  if(!current())fail('DIRECTORY_CONFIG_CHANGED');
  const read=async()=>{
   if(!current())fail('DIRECTORY_CONFIG_CHANGED');
   const common={readPurpose:'display',sourceNotePath:scope.trackingSourceNotePath,source:'peo-configured-directory'};
   const [project,goal]=await Promise.all([initial.api.listEffectiveOperationalContextKeys({...common,workspaceSourceNotePath:scope.workspaceSourceNotePath}),initial.api.listEffectiveGoalOperationalContextKeys({...common})]);
   if(!current())fail('DIRECTORY_CONFIG_CHANGED');
   const generation=initial.plugins[3].effectiveOperationalContextProviderGeneration;
   return [validate(project,'project',scope,generation),validate(goal,'goal',scope,generation)];
  };
  return Object.freeze({scope,current,read});
 }
 return Object.freeze({capture,close(){if(closed)return;closed=true;epoch++;listeners.forEach(ref=>offref.call(vault,ref));}});
}
module.exports={create,compose,freeze};
return module.exports;})();

const __PeoObserverHost=(()=>{const module={exports:{}};
'use strict';
const NAV_EVENTS=Object.freeze(['eva-cross-view-relations:changed','context-capsule-carrier:changed','context-key-manager:naming-settled-v1','project-execution-overview:context-key-renamed-v1','state-capsules:active-capsule-changed','supermemo-plan:changed','ontology-index-provider:ready','ontology-index-provider:unavailable','project-execution-overview:primary-key-lifecycle-changed']);
const TRACKING_EVENTS=Object.freeze(['mandala-time-blocks:tracking-lifecycle-changed','mandala-time-blocks:tracking-revision-changed-v1']);
const READ_METHODS=Object.freeze(['searchNodes','getAllNodeRecords','getNodeRecord','getNodeRelationSnapshot','getOutgoingRelationBatchSnapshot','getContextCapsuleCarrierSnapshot','getPlanningMilestoneSnapshot','getKeywordNotesForNode','getBoundNoteForNode','getContextTrackingScopeV1','listContextTrackingStatesV1','getContextTrackingRevisionV1','requestContextTrackingRevisionRefreshV1','listProjectPlanWorkspaceRows','listWorkspaceWeeklyGoalRows','listWeeklyGoalRows','getWeeklyProjectPlan']);
function createHost(owner,{createPublisher,loadEvidence,normalize,buildAliases,events,emit,unavailable}){
 let closed=false,apiEpoch=0,lastHealthStamp=null;
 // r41: an EVA health-stamp change that leaves the directory inputs unchanged (only the gtd adapter moved, or the primary
 // node fingerprint is identical) is aliased to the stamp the current build was captured with. Comparisons use the
 // effective stamp; an unverified change still breaks them (missed-event backstop kept). Only the latest alias is kept
 // (stamps only move forward), so the set cannot grow.
 const stampAlias=new Map();let base=null;
 const eff=raw=>stampAlias.get(raw)||raw;
 let publisher;
 const configuredDirectory=__PeoConfiguredDirectory.create(owner,()=>publisher?.invalidate('navigation'));
 const healthRequest=Object.freeze({viewTypes:Object.freeze(['workspace-mount-view','mandala-time-blocks','gtd'])});
 function health(requireReady=true,api=owner.getEva()){
  const read=api?.getAdapterIndexHealthV1;
  const value=typeof read==='function'?read.call(api,healthRequest):null;
  if(value?.contractVersion!==1||typeof value.then==='function'||value.coverage!=='observed-adapter-refreshes'||(requireReady&&value.status!=='ready')||typeof value.providerGeneration!=='string'||!value.providerGeneration||typeof value.revision!=='string'||!value.revision){const e=Error('navigation-index-not-ready');e.code='NAVIGATION_HEALTH_NOT_READY';throw e;}
  return {api,read,stamp:JSON.stringify([value.providerGeneration,value.revision])};
 }
 function fingerprint(eva){
  // Directory inputs owned by EVA: primary nodes per grouping mode (key + label), relation edges among them, their
  // declaration comments, and the start configuration. Read-only and bounded by the primary sets.
  if(!eva)throw Error('fingerprint-eva');
  const out=[owner.settings?.startQuery||'',owner.settings?.startNodeKey||'',owner.getCanonicalWorkspaceSourceNotePath?.()||''];
  const quiet=console.info;console.info=()=>{};
  try{
   const relations=Object.values(owner.app?.plugins?.plugins?.['eva-cross-view-relations']?.state?.relationsById||{});
   for(const mode of ['workspace','mandala']){
    const recs=owner.resolveStartRecords(eva,mode)||[],set=new Set(recs.map(r=>String(r?.nodeKey||'')));
    const rows=recs.map(r=>{const k=String(r?.nodeKey||'');return [k,String(r?.title||r?.label||''),String(owner.getComment?.(k)||'')];});
    const edges=[];for(const x of relations){const a=String(x?.sourceNodeKey||''),b=String(x?.targetNodeKey||'');if(set.has(a)&&set.has(b))edges.push([a,b,String(x?.relationType||x?.type||'')]);}
    out.push(mode,rows,edges.map(e=>JSON.stringify(e)).sort());
   }
  }finally{console.info=quiet;}
  return JSON.stringify(out);
 }
 function parseStamp(s){try{const a=JSON.parse(s),b=JSON.parse(a[1]);return {gen:a[0],closed:b[0],map:new Map(b[1])};}catch{return null;}}
 function acceptStamp(){
  // true when the current EVA stamp is (now) equivalent to the stamp of the last captured build
  const first=health(false);const raw=first.stamp;
  if(!base)return false;if(eff(raw)===base.eff)return true;
  const a=parseStamp(base.raw),b=parseStamp(raw);if(!a||!b||a.gen!==b.gen||a.closed!==b.closed)return false;
  const types=new Set([...a.map.keys(),...b.map.keys()]),changed=[...types].filter(t=>a.map.get(t)!==b.map.get(t));
  if(changed.some(t=>t!=='gtd')){
   const fp=fingerprint(first.api);
   if(health(false).stamp!==raw||fp!==base.fp)return false;
  }
  stampAlias.clear();stampAlias.set(raw,base.eff);return true;
 }
 function hard(kind,source){if(kind!=='tracking'){stampAlias.clear();base=null;}publisher.invalidate(kind,source);}
 function softOrHard(source){let ok=false;try{ok=acceptStamp();}catch{ok=false;}if(ok)publisher.softInvalidate(source);else hard('navigation',source);}
 function classify(name,event){
  const d=event?.detail;
  if(name==='context-capsule-carrier:changed')return d?.changeKind==='content';
  if(name==='eva-cross-view-relations:changed')return d?.reason==='index';
  return false;
 }
 function capture(){
  const validity=health();lastHealthStamp=validity.stamp;
  const es=eff(validity.stamp);if(!base||base.eff!==es){let fp=null;try{fp=fingerprint(validity.api);}catch{fp=null;}base={eff:es,raw:validity.stamp,fp};}
  const refs=[validity.api,validity.read,es,owner.operationalContextSnapshotProviderGeneration,owner.globalKeywordNavGeneration,owner.getGlobalKeywordNavScope(),owner.contextCarrierUnloading,owner.activeCapsuleInfo];
  for(const name of ['getEva','getWorkspaceMountApi','getGtdTaskManagerApi','getCollectionCardApi','getTimelinePlannerApi','getKeywordIndexApi','getMandalaTimeBlocksApi']){
   const api=owner[name]();refs.push(owner[name],api);
   if(api)for(const key of [...new Set([...Object.keys(api),...READ_METHODS])].sort()){const value=api[key];if(typeof value==='function'||key==='operationalLifecyclePolicyV1')refs.push(key,value);}
  }
  const center=owner.app?.plugins?.plugins?.['context-key-manager'];refs.push(center,center?.getNamingProjectionAuthorityV1);
  // Baseline may select the static EVA fallback even when a public API exists.
  const evaPlugin=owner.app?.plugins?.plugins?.['eva-cross-view-relations'],state=evaPlugin?.state,adapter=owner.app?.vault?.adapter;
  refs.push(evaPlugin,state,state?.nodeIndexByKey,state?.relationsById,adapter,adapter?.exists,adapter?.read,owner.getOverviewReadSource,owner.loadEvaStateFallback);
  return refs;
 }
 // Fixed allowlist only. Full capture above remains a build-time check, never a read path.
 const PROVIDERS=Object.freeze(['getEva','getWorkspaceMountApi','getGtdTaskManagerApi','getCollectionCardApi','getTimelinePlannerApi','getKeywordIndexApi','getMandalaTimeBlocksApi']);
 const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 function fixedReferences(){
  const refs=[owner.operationalContextSnapshotProviderGeneration,owner.globalKeywordNavGeneration,owner.contextCarrierUnloading,owner.activeCapsuleInfo,
   owner.getGlobalKeywordNavScope,owner.buildGlobalGroupKeywordNavItemsUncached,owner.getOverviewReadSource,owner.loadEvaStateFallback,
   owner.getTrackingProjectionModule,owner.trackingProjectionModule,owner.trackingProjectionModule?.collectTracking];
  const apis=[];
  for(const name of PROVIDERS){const getter=owner[name],api=typeof getter==='function'?getter.call(owner):null;apis.push(api);refs.push(getter,api);
   for(const key of READ_METHODS)refs.push(api?.[key]);refs.push(api?.operationalLifecyclePolicyV1);}
  const center=owner.app?.plugins?.plugins?.['context-key-manager'];refs.push(center,center?.getNamingProjectionAuthorityV1);
  const eva=owner.app?.plugins?.plugins?.['eva-cross-view-relations'],state=eva?.state,adapter=owner.app?.vault?.adapter;
  refs.push(eva,state,state?.nodeIndexByKey,state?.relationsById,adapter,adapter?.exists,adapter?.read,apis[0]?.getAdapterIndexHealthV1);
  return {refs,eva:apis[0],mandala:apis[6]};
 }
 function sourceObservation(){
  if(closed||owner.contextCarrierUnloading)throw Error('directory-source-closed');
  const fixed=fixedReferences(),scope=owner.getGlobalKeywordNavScope(),api=fixed.mandala;
  const readScope=api?.getContextTrackingScopeV1,readRevision=api?.getContextTrackingRevisionV1;
  if(api?.operationalLifecyclePolicyV1!=='tracking-only-v2'||typeof readScope!=='function'||typeof readRevision!=='function'||typeof scope!=='string')throw Error('directory-source-missing');
  // r32: read-time/source checks compare the EVA [providerGeneration,revision] stamp only; a transient adapter
  // refresh ('pending', same revision) is not a source change. New builds still require ready via capture().
  const source=readScope.call(api),validity=health(false,fixed.eva);
  if(source?.ok!==true||typeof source.then==='function'||source.contractVersion!==1||typeof source.sourceScope!=='string'||!source.sourceScope||typeof source.providerGeneration!=='string'||!source.providerGeneration)throw Error('directory-source-invalid');
  const navigation=[scope,eff(validity.stamp),source.sourceScope,source.providerGeneration];
  return {fixed,navigation,api,readRevision};
 }
 function captureReadGuard(){
  const configured=configuredDirectory.capture();
  const first=sourceObservation(),initial=first.readRevision.call(first.api);
  const fields=['contractVersion','status','sourceScope','providerGeneration','weeklyPath','epoch','contentRevision'];
  const values=value=>fields.map(key=>value?.[key]);
  const initialValues=values(initial);
  if(initial?.contractVersion!==1||typeof initial.then==='function'||typeof initial.status!=='string'||!initial.status)throw Error('directory-revision-invalid');
  // r31 M2: navigation reads Mandala weekly rows; its identity includes the owner revision epoch/source (same-content renewal keeps epoch).
  const navIdentity=v=>[v?.epoch,v?.weeklyPath,v?.sourceScope,v?.providerGeneration];const initialNavIdentity=navIdentity(initial);
  const navigationCurrent=()=>{try{const next=sourceObservation();if(!(configured.current()&&equal(first.fixed.refs,next.fixed.refs)&&equal(first.navigation,next.navigation)&&!closed&&!owner.contextCarrierUnloading))return false;const rev=next.readRevision.call(next.api);return !(rev&&typeof rev.then==='function')&&equal(initialNavIdentity,navIdentity(rev));}catch{return false;}};
  const guard=(requireReady,result,now)=>{
   try{
    if(!configured.current())return false;
    const next=sourceObservation();
    if(!equal(first.fixed.refs,next.fixed.refs)||!equal(first.navigation,next.navigation))return false;
    const revision=next.readRevision.call(next.api);
    if(typeof revision?.then==='function'||!equal(initialValues,values(revision)))return false;
    // A same-content renewal is not a new data revision. Keep the original deadline;
    // reject pending, gaps, backward timestamps and a shortened current proof.
    if(requireReady||revision.status==='ready'){
     if(initial.status!=='ready'||revision.status!=='ready'||!Number.isFinite(now)
       ||!Number.isFinite(initial.checkedAt)||!Number.isFinite(initial.expiresAt)
       ||!Number.isFinite(revision.checkedAt)||!Number.isFinite(revision.expiresAt)
       ||!(now>=initial.checkedAt&&now<initial.expiresAt&&now>=revision.checkedAt&&now<revision.expiresAt)
       ||revision.checkedAt<initial.checkedAt||revision.expiresAt<initial.expiresAt
       ||revision.checkedAt>=initial.expiresAt)return false;
    }
    if(requireReady&&(revision.status!=='ready'||revision.sourceScope!==next.navigation[2]||revision.providerGeneration!==next.navigation[3]
      ||typeof revision.contentRevision!=='string'||!revision.contentRevision||!Number.isSafeInteger(revision.epoch)||revision.epoch<0
      ||!Number.isFinite(revision.checkedAt)||!Number.isFinite(revision.expiresAt)||!Number.isFinite(now)||!(now>=revision.checkedAt&&now<revision.expiresAt)))return false;
    if(result&&(result.sourceScope!==revision.sourceScope||result.providerGeneration!==revision.providerGeneration||result.evidenceRevision!==revision.contentRevision))return false;
    // Scope/revision getters can reenter lifecycle code or replace a reader.
    const after=sourceObservation();
    return configured.current()&&!closed&&!owner.contextCarrierUnloading&&equal(first.fixed.refs,after.fixed.refs)&&equal(first.navigation,after.navigation);
   }catch{return false;}
  };
  guard.initialTrackingExpiresAt=initial.expiresAt;
  guard.navigationCurrent=navigationCurrent;
  guard.configured=configured;
  return Object.freeze(guard);
 }
 publisher=createPublisher({capture,captureReadGuard,navMaxAgeMs:300000,renewLeadMs:8000,
  // r31 M1: evidence needs an owner proof with >5s left; otherwise ask the owner (read-only stat/read/hash) and let the publisher retry.
  prepareEvidenceProof:now=>{const api=owner.getMandalaTimeBlocksApi(),read=api?.getContextTrackingRevisionV1;const r=typeof read==='function'?read.call(api):null;
   if(r&&typeof r.then!=='function'&&r.contractVersion===1&&r.status==='ready'&&Number.isFinite(r.expiresAt)&&Number.isFinite(now)&&r.expiresAt-now>5000)return true;
   try{api?.requestContextTrackingRevisionRefreshV1?.();}catch{}return false;},
  // Renew only on a fresher owner proof; otherwise ask the owner (read-only stat/read/hash) and retry.
  prepareRenewal:end=>{const api=owner.getMandalaTimeBlocksApi(),read=api?.getContextTrackingRevisionV1;const r=typeof read==='function'?read.call(api):null;
   if(r&&typeof r.then!=='function'&&r.contractVersion===1&&r.status==='ready'&&Number.isFinite(r.expiresAt)&&r.expiresAt>end+1000)return true;
   try{api?.requestContextTrackingRevisionRefreshV1?.();}catch{}return false;},
  loadNavigation:async(ctl)=>{
  const cache=owner.globalKeywordNavCache;
  const aliases=buildAliases(cache?.buildComplete===true&&owner.isGlobalKeywordNavCurrent(cache.generation,cache.scope)?cache.items:[]);
  const observerAliases=Object.freeze(aliases.map(x=>Object.freeze({displayLabel:x.displayLabel,canonicalLabel:x.canonicalLabel,address:x.address})));
  const items=await owner.buildGlobalGroupKeywordNavItemsUncached(Object.freeze({observerAliases,isCurrent:ctl?.isCurrent,mark:ctl?.mark}));
  if(!Array.isArray(items)||items.length>50000)throw Error('navigation-limit');
  const groups=[],entries=[];
  for(const item of items){
   const sources=(item.sources?.length?item.sources:[item]).map(s=>Object.freeze({mode:s.mode,primaryNodeKey:s.primaryNodeKey}));
   groups.push(...sources);const descriptor=normalize(item);
   if(descriptor)entries.push(Object.freeze({displayLabel:descriptor.displayLabel,contextKeyId:descriptor.contextKeyId,sources:Object.freeze(sources)}));
  }
  const fields=['keyword','contextKeyId','stableId','id','declarationId','color','icon','mode','primaryNodeKey','groupId','groupTitle'];
  const copy=item=>Object.freeze(Object.fromEntries(fields.map(k=>[k,typeof item?.[k]==='string'?item[k]:''])));
  const originals=items.map(item=>Object.freeze({...copy(item),sources:Object.freeze((item.sources?.length?item.sources:[item]).map(copy))}));
  return Object.freeze({groups:Object.freeze(groups),entries:Object.freeze(entries),contextKeys:buildAliases(items),items:Object.freeze(originals)});
 },keyDirectory:nav=>nav.contextKeys,loadEvidence:async(nav,current,guard)=>{
  const result=await loadEvidence(nav,owner.getMandalaTimeBlocksApi(),owner.getTrackingProjectionModule().collectTracking,current);
  if(!current())throw Error('directory-config-changed');
  const qualifications=await guard.configured.read();
  if(!current())throw Error('directory-config-changed');
  const union=__PeoConfiguredDirectory.compose(nav,qualifications,normalize);
  const keyDirectoryCoverage=__PeoConfiguredDirectory.freeze({contractVersion:1,kind:'observed-navigation-union-configured-eligible',complete:true,writeAuthorization:false,enumerations:qualifications.map(q=>q.summary)});
  const qualificationRevisions=__PeoConfiguredDirectory.freeze(Object.fromEntries(qualifications.map(q=>[q.domain,q.revision])));
  return {...result,expiresAt:Math.min(result.expiresAt,guard.initialTrackingExpiresAt),stoppedLabels:[...new Set([...result.stoppedLabels,...union.stoppedLabels])].filter(label=>!union.activeLabels.has(label)&&!union.blockedLabels.has(label)),contextKeys:union.contextKeys,keyDirectoryCoverage,currentConfiguredScope:guard.configured.scope,qualificationRevisions,navigationHealthRevision:health().stamp};
 },notify:s=>emit(s)});
 const listeners=[];
 const healthEvent='eva-cross-view-relations:index-health-changed-v1';
 const healthChanged=()=>{try{const h=health(false);if(h.stamp===lastHealthStamp)return;lastHealthStamp=h.stamp;}catch{}try{softOrHard('health');}catch{publisher.close();}};
 try{events.addEventListener(healthEvent,healthChanged);listeners.push([healthEvent,healthChanged]);for(const [names,kind]of [[NAV_EVENTS,'navigation'],[TRACKING_EVENTS,'tracking']])for(const name of names){
  const fn=event=>{try{if(kind==='navigation'&&classify(name,event))softOrHard(name);else hard(kind,name);}catch{publisher.close();}};
  events.addEventListener(name,fn);listeners.push([name,fn]);
 }}catch(error){for(const [name,fn]of listeners)events.removeEventListener(name,fn);publisher.close();configuredDirectory.close();throw error;}
 return Object.freeze({
  api(){const lease=++apiEpoch;if(!closed)publisher.invalidate('navigation','api');return Object.freeze({read:()=>{if(closed||lease!==apiEpoch)return unavailable;try{const s=publisher.read();return closed||lease!==apiEpoch?unavailable:s;}catch{return unavailable;}},refresh:()=>!closed&&lease===apiEpoch?publisher.requestRefresh():false});},
  invalidate(){if(!closed)hard('navigation','host');},
  diagnostics(){try{return publisher.diagnostics();}catch{return null;}},
  beginWrite(){try{const end=publisher.beginWrite();return()=>{try{end();}catch{publisher.close();}};}catch{publisher.close();return()=>{};}},
  close(){if(closed)return;closed=true;apiEpoch++;for(const [name,fn]of listeners)events.removeEventListener(name,fn);publisher.close();configuredDirectory.close();}
 });
}
module.exports={createHost,NAV_EVENTS,TRACKING_EVENTS};

return module.exports;})();
// BEGIN OWNER_SAVED_OBSERVATION_V1
// Private owner-local guard. A read is evidence of saved bytes, never a transaction or write permit.
const __OwnerSavedObservationV1 = (() => {
  const fs = require("node:fs"), path = require("node:path"), { createHash, randomUUID } = require("node:crypto");
  const states = new WeakMap();
  const state = owner => {
    let value = states.get(owner);
    if (!value) { value = { version: {}, pending: 0, session: "saved-owner:" + randomUUID() }; states.set(owner, value); }
    return value;
  };
  const begin = owner => {
    const value = state(owner); value.pending++; value.version = {};
    let ended = false;
    return () => { if (!ended) { ended = true; value.pending--; value.version = {}; } };
  };
  const freeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  const hash = value => createHash("sha256").update(value, "utf8").digest("hex");
  const validEvidence = (snapshot, providerId) => {
    const e = snapshot?.inputObservation;
    return snapshot?.readPurpose === "operation-check" && snapshot?.writeAuthorization === false
      && snapshot?.providerId === providerId && !!e && e.contractVersion === 1 && e.providerId === providerId
      && e.purpose === "saved-owner-file" && e.persisted === true && e.consistency === "single-file-observation"
      && e.atomic === false && e.ownerPath === ".obsidian/plugins/" + providerId + "/data.json"
      && e.readCount === 1 && typeof e.rawSha256 === "string" && /^[a-f0-9]{64}$/.test(e.rawSha256)
      && typeof e.projectionRevision === "string" && /^[a-f0-9]{64}$/.test(e.projectionRevision)
      && e.projectionRevision === snapshot.revision;
  };
  const capture = (owner, config) => {
    const value = state(owner), version = value.version;
    const adapter = owner.app?.vault?.adapter, baseFn = adapter?.getBasePath;
    const readFn = adapter?.read, statFn = adapter?.stat;
    const api = owner[config.apiKey], manifest = owner.manifest;
    const dir = ".obsidian/plugins/" + config.providerId, ownerPath = dir + "/data.json";
    const base = typeof baseFn === "function" ? baseFn.call(adapter) : null;
    if (!base || !path.isAbsolute(base) || manifest?.dir !== dir) throw Error("saved-owner-namespace");
    const absoluteDir = path.join(base, dir), file = path.join(absoluteDir, "data.json");
    const initial = fs.lstatSync(absoluteDir);
    const guard = () => {
      if (owner[config.unloadKey] || owner[config.apiKey] !== api || !api || owner.manifest !== manifest || manifest.dir !== dir
          || owner.app?.vault?.adapter !== adapter || adapter.getBasePath !== baseFn || baseFn.call(adapter) !== base
          || typeof readFn !== "function" || typeof statFn !== "function" || adapter.read !== readFn || adapter.stat !== statFn
          || state(owner) !== value || value.version !== version || value.pending !== 0
          || (config.providerId === "eva-cross-view-relations" && (owner._indexPersistencePending || 0) !== 0)) throw Error("saved-owner-not-current");
      for (let at = absoluteDir;; at = path.dirname(at)) {
        const info = fs.lstatSync(at);
        if (!info.isDirectory() || info.isSymbolicLink()) throw Error("saved-owner-directory");
        if (path.dirname(at) === at) break;
      }
      const currentDir = fs.lstatSync(absoluteDir), currentFile = fs.lstatSync(file);
      if (currentDir.dev !== initial.dev || currentDir.ino !== initial.ino || !currentFile.isFile()
          || currentFile.isSymbolicLink() || currentFile.size > config.max) throw Error("saved-owner-file");
    };
    guard();
    const current = () => { try { guard(); return true; } catch (_) { return false; } };
    return { adapter, readFn, statFn, guard, current, ownerPath, session: value.session };
  };
  const makeEvidence = (providerId, ownerPath, rawSha256) => projectionRevision => freeze({ contractVersion: 1, providerId,
    purpose: "saved-owner-file", persisted: true, consistency: "single-file-observation", atomic: false,
    ownerPath, rawSha256, projectionRevision, readCount: 1 });
  const read = async (owner, config) => {
    const input = capture(owner, config);
    const { adapter, readFn, statFn, guard, ownerPath } = input;
    const stat = await statFn.call(adapter, ownerPath); guard();
    if (!stat || stat.type !== "file" || !Number.isFinite(stat.size) || stat.size < 0 || stat.size > config.max) throw Error("saved-owner-size");
    const raw = await readFn.call(adapter, ownerPath); guard();
    if (typeof raw !== "string" || Buffer.byteLength(raw, "utf8") > config.max) throw Error("saved-owner-raw");
    const rawSha256 = hash(raw), data = config.parse(raw);
    guard();
    return { data, session: input.session, ownerPath, guard, current: input.current,
      evidence: makeEvidence(config.providerId, ownerPath, rawSha256) };
  };
  return Object.freeze({ begin, read, freeze, hash, validEvidence });
})();
// END OWNER_SAVED_OBSERVATION_V1


function __PeoObserverBeginWrite(owner) {
  const endSaved = __OwnerSavedObservationV1.begin(owner);
  let end;
  try { end = owner.trackingSnapshotHost?.beginWrite(); }
  catch (_) { try { owner.trackingSnapshotHost?.close(); } catch (_) {} }
  return () => { try { end?.(); } catch (_) { try { owner.trackingSnapshotHost?.close(); } catch (_) {} } finally { endSaved(); } };
}
const { ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");
const { createHash } = require("crypto");
// C1: inlined (Obsidian cannot resolve plugin-relative require).
const CenterPeoProjectionModule=(()=>{const defs={"./participant-snapshot.cjs":function(module,exports,require){
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

},"./binding-anchor.cjs":function(module,exports,require){
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

},"./binding-transition.cjs":function(module,exports,require){
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

},"./center-peo-projection.cjs":function(module,exports,require){
"use strict";
// Owner-local fixed-plan executor. No registration, journal, timer or authority activation.
const crypto=require('node:crypto');
const L=require('./legacy-goal-receipts.cjs');
const P=require('./primary-plan.cjs');
const S=require('./participant-snapshot.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x));
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const same=(a,b)=>stable(a)===stable(b),fail=x=>{throw Error(x);};
const FIELD='centerNamingProjectionV1',HEX=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const permits=new WeakMap();
function fields(v,names){if(!v||Array.isArray(v)||Object.keys(v).sort().join('|')!==[...names].sort().join('|'))fail('CENTER_PEO_SCHEMA');}
// Shared strict rule (primary-plan.cjs), same as the center claim command.
function subject(s){return P.strictSubject(s,'CENTER_PEO_SUBJECT')}
const receiptKey=P.peoReceiptKey;
class Projection {
 constructor(owner,writer,legacy,resolveAuthority){this.owner=owner;this.writer=writer;this.legacy=legacy;this.resolveAuthority=resolveAuthority;this.generation=crypto.randomUUID();}
 sync(f){const v=f();if(v&&typeof v.then==='function'){Promise.resolve(v).catch(()=>{});fail('CENTER_PEO_ASYNC_AUTHORITY')}if(v===false)fail('CENTER_PEO_AUTHORITY_DENIED');return v;}
 capture(){
  const api=this.resolveAuthority();if(!api||typeof api.snapshot!=='function'||typeof api.assertCurrent!=='function')fail('CENTER_PEO_AUTHORITY_UNAVAILABLE');
  // Same proof as the shared consumer fence: a proven never-initialized center keeps legacy PEO saves working.
  if(typeof api.availability==='function'&&typeof api.assertAvailability==='function'){
   const proof=this.sync(()=>api.availability());this.sync(()=>api.assertAvailability(proof));
   if(proof?.version===1&&proof.state==='unconfigured')return {api,unconfigured:true,proof,owner:this.writer.capture()};
   if(proof?.state!=='configured')fail('CENTER_PEO_AUTHORITY_UNAVAILABLE');
  }
  const s=this.sync(()=>api.snapshot());S.validate(s);if(!s||![1,3].includes(s.version)||typeof s.namespace!=='string'||!s.namespace||typeof s.generation!=='string'||!s.generation||!Array.isArray(s.contexts)||s.contexts.length>5000)fail('CENTER_PEO_SNAPSHOT');
  const ids=new Set(),refs=new Set();for(const c of s.contexts){if(!c||!/^ctx_[a-f0-9-]{36}$/.test(c.contextId)||ids.has(c.contextId)||!Array.isArray(c.subjects)||c.subjects.length!==1||!['legacy','center'].includes(c.naming?.authority)||typeof c.subjects[0]?.primaryNodeKey!=='string')fail('CENTER_PEO_SNAPSHOT');
   // Only center-managed subjects are protected here; a legacy registration this module cannot parse must not block every save.
   if(c.naming.authority==='center')subject(c.subjects[0]);const k=c.subjects[0].primaryNodeKey;if(refs.has(k))fail('CENTER_PEO_DUPLICATE_SUBJECT');ids.add(c.contextId);refs.add(k);}
  this.sync(()=>api.assertCurrent(s));return {api,s:copy(s),owner:this.writer.capture()};
 }
 fresh(c){this.writer.assert(c.owner);if(this.resolveAuthority()!==c.api)fail('CENTER_PEO_PROVIDER_CHANGED');if(c.unconfigured)this.sync(()=>c.api.assertAvailability(c.proof));const n=this.capture();if(!!n.unconfigured!==!!c.unconfigured||!c.unconfigured&&(n.s.namespace!==c.s.namespace||n.s.generation!==c.s.generation))fail('CENTER_PEO_GENERATION_CHANGED');return n;}
 // Rename confirmation, inspection and execution exist only for a configured center.
 configured(c){if(c.unconfigured)fail('CENTER_PEO_CONFIRMATION_REQUIRED');return c;}
 parse(raw){return S.rejectForeign(this.legacy.parse(raw));}
 map(d){
  const m=Object.hasOwn(d,FIELD)?d[FIELD]:{};if(!m||Array.isArray(m)||typeof m!=='object'||Object.keys(m).length>5000)fail('CENTER_PEO_RECEIPTS');
  const ids=new Set();for(const [k,r] of Object.entries(m)){
   fields(r,['version','namespace','contextId','txId','planHash','subject','oldLabel','newLabel','preconditionHash','receiptKey',...(r.version===2?['legacy']:[])]);subject(r.subject);
   if(![1,2].includes(r.version)||r.subject.primaryNodeKey!==k||typeof r.namespace!=='string'||!r.namespace||!/^ctx_[a-f0-9-]{36}$/.test(r.contextId)||ids.has(r.contextId)||!UUID.test(r.txId)||![r.planHash,r.preconditionHash,r.receiptKey].every(x=>HEX.test(x))||this.legacy.declaration(d.commentsByNodeKey?.[k]).label!==r.newLabel)fail('CENTER_PEO_RECEIPTS');
   L.match(L.entry(d,this.legacy.FIELD,k),r.subject,'peo',r.legacy);
   if(r.version===2){const p={version:2,ownerId:'project-execution-overview',subject:r.subject,oldLabel:r.oldLabel,newLabel:r.newLabel,preconditionHash:r.preconditionHash,legacy:r.legacy,receiptKey:r.receiptKey};P.validatePeoLegacy(p);if(hash(p)!==r.planHash)fail('CENTER_PEO_RECEIPT_PLAN');}ids.add(r.contextId);
  }return m;
 }
 validate(p){
  if(p?.version===2)return copy(P.validatePeoLegacy(p));
  fields(p,['version','ownerId','subject','oldLabel','newLabel','preconditionHash','receiptKey']);subject(p.subject);
  // Reuse the real PEO parser for both domains, including strict numbered labels.
  const old=this.legacy.declaration('---\n'+p.oldLabel+'\n---'),next=this.legacy.declaration('---\n'+p.newLabel+'\n---');
  if(p.version!==1||p.ownerId!=='project-execution-overview'||!HEX.test(p.preconditionHash)||p.receiptKey!==receiptKey(p)||old.label!==p.oldLabel||next.label!==p.newLabel||p.oldLabel.toLowerCase()===p.newLabel.toLowerCase()||p.oldLabel.match(/^([0-9A-Za-z]+)/)[1].toUpperCase()!==p.newLabel.match(/^([0-9A-Za-z]+)/)[1].toUpperCase())fail('CENTER_PEO_PLAN');return copy(p);
 }
 trusted(p,txId,c){
  p=this.validate(p);if(!UUID.test(txId))fail('CENTER_PEO_TX');const n=this.configured(this.fresh(c)),matches=n.s.contexts.filter(x=>same(x.subjects[0],p.subject));
  if(matches.length!==1)fail('CENTER_PEO_CONTEXT');const context=matches[0],pending=context.naming?.pending;
  const row=pending?.plans?.find(x=>x.id==='peo-declaration');
  if(context.naming.authority!=='center'||context.canonicalLabel!==p.newLabel||pending?.txId!==txId||pending.oldLabel!==p.oldLabel||pending.newLabel!==p.newLabel||!row||row.ownerId!==p.ownerId||!same(row.subject,p.subject)||!same(row.bindings,[])||!same(row.plan,p))fail('CENTER_PEO_CONFIRMATION_REQUIRED');
  return {n,context,row};
 }
 receipt(p,txId,t){return {version:p.version,namespace:t.n.s.namespace,contextId:t.context.contextId,txId,planHash:hash(p),subject:p.subject,oldLabel:p.oldLabel,newLabel:p.newLabel,preconditionHash:p.preconditionHash,receiptKey:p.receiptKey,...(p.version===2?{legacy:copy(p.legacy)}:{})};}
 read(c){this.fresh(c);const l=this.writer.location(c.owner);return l.fs.readFileSync(l.file,'utf8');}
 beforeOrAfter(raw,p,txId,t){
  const d=this.parse(raw),m=this.map(d),k=p.subject.primaryNodeKey,comment=d.commentsByNodeKey?.[k];this.legacy.unique(d,k,[p.oldLabel,p.newLabel]);
  L.match(L.entry(d,this.legacy.FIELD,k),p.subject,'peo',p.legacy);
  const label=this.legacy.declaration(comment).label;
  if(label===p.oldLabel&&hash(comment)===p.preconditionHash){if(m[k]?.txId===txId)fail('CENTER_PEO_RECEIPT_CONFLICT');return {state:'before',d};}
  if(label===p.newLabel&&hash(this.legacy.declaration(comment,p.oldLabel).comment)===p.preconditionHash&&same(m[k],this.receipt(p,txId,t)))return {state:'after',d};
  fail('CENTER_PEO_CONTENT_CONFLICT');
 }
 reconcile(d,p,t){
  // Confirmed recovery may rehydrate memory, never publish a file. Only the exact
  // old or exact new comment is safe; a user's divergent draft stays untouched.
  const k=p.subject.primaryNodeKey,after=d.commentsByNodeKey[k],before=this.legacy.declaration(after,p.oldLabel).comment;
  const memory=this.owner.settings,comment=memory.commentsByNodeKey?.[k],m=this.map(memory),r=m[k];
  L.match(L.entry(memory,this.legacy.FIELD,k),p.subject,'peo',p.legacy);
  if(comment!==before&&comment!==after)fail('CENTER_PEO_UNSAVED_COMMENT');
  if(r&&(r.namespace!==t.n.s.namespace||r.contextId!==t.context.contextId||!same(r.subject,p.subject)||r.txId===d[FIELD][k].txId&&!same(r,d[FIELD][k])))fail('CENTER_PEO_UNSAVED_RECEIPT');
  this.fresh(t.n);memory.commentsByNodeKey={...memory.commentsByNodeKey,[k]:after};memory[FIELD]={...(memory[FIELD]||{}),[k]:copy(d[FIELD][k])};
 }
 guardOrdinary(before,after,exempt=null,captured=null){return this.ordinaryCheck(captured?this.fresh(captured):this.capture(),before,after,exempt)}
 // Final predicate shared by guardOrdinary and the claim dry-run (C1 A1).
 ordinaryCheck(c,before,after,exempt=null){
  const a=this.parse(before??'{}'),b=this.parse(after),ar=this.map(a),br=this.map(b);
  if(c.unconfigured){if(Object.keys(ar).length||Object.keys(br).length)fail('CENTER_PEO_RECEIPT_WITHOUT_AUTHORITY');return c;}
  const ac=copy(ar),bc=copy(br);if(exempt){delete ac[exempt];delete bc[exempt];}
  if(!same(ac,bc)||!exempt&&Object.hasOwn(a,FIELD)!==Object.hasOwn(b,FIELD))fail('CENTER_PEO_RECEIPT_CHANGED');
  for(const [k,r] of Object.entries(ar))if(r.namespace!==c.s.namespace||!c.s.contexts.some(x=>x.contextId===r.contextId&&x.naming.authority==='center'&&same(x.subjects[0],r.subject)))fail('CENTER_PEO_RECEIPT_ORPHAN');
  for(const x of c.s.contexts.filter(x=>x.naming.authority==='center')){
   const k=x.subjects[0].primaryNodeKey;if(k===exempt)continue;
   const old=this.legacy.declaration(a.commentsByNodeKey?.[k]).label,next=this.legacy.declaration(b.commentsByNodeKey?.[k]).label;
   if(![x.canonicalLabel,x.naming.pending?.oldLabel].includes(old)||old!==next)fail('CENTER_PEO_MANAGED_DECLARATION_CHANGED');
   this.legacy.unique(b,k,[old,x.canonicalLabel]);
  }
  return c;
 }
 // C1 claim dry-run (read only, settings queue): local snapshot copy marks the context center; the final predicate and
 // every name-independent prepare refusal must pass, and the memory comment must equal the saved one (C1 A1/A2/R3).
 async dryRunClaim(contextId){
  return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   const real=this.configured(this.capture()),s=copy(real.s),context=s.contexts.find(x=>x.contextId===contextId);if(!context)fail('CENTER_PEO_CLAIM_CONTEXT');
   context.naming={...context.naming,authority:'center',pending:null};const sub=subject(context.subjects[0]),k=sub.primaryNodeKey;
   const raw=this.read(real),d=this.parse(raw),m=this.map(d),list=L.entry(d,this.legacy.FIELD,k),legacy=L.evidence(list,sub,'peo');this.legacy.receipts(d);
   this.ordinaryCheck({...real,s},raw,raw,null);L.match(L.entry(this.owner.settings,this.legacy.FIELD,k),sub,'peo',legacy);
   if(legacy&&!m[k]&&list.at(-1).newLabel!==context.canonicalLabel)fail('CENTER_PEO_LEGACY_HEAD_CHANGED');
   const comment=d.commentsByNodeKey?.[k];if(this.legacy.declaration(comment).label!==context.canonicalLabel||this.owner.settings.commentsByNodeKey?.[k]!==comment)fail('CENTER_PEO_UNSAVED_COMMENT');
   this.legacy.unique(d,k,[context.canonicalLabel]);this.fresh(real);
   return {generation:this.generation,digest:this.claimDigestOf(d,k),lineageHash:legacy?.lineageHash||null};
  }));
 }
 claimDigestOf(d,k){return hash(stable({comment:d.commentsByNodeKey?.[k]??null,legacy:L.entry(d,this.legacy.FIELD,k)??null,receipt:this.map(d)[k]??null}))}
 // Lease re-read: synchronous, disk and memory must still match the evidence digest.
 // Reads only the owner's own file: it runs inside the center's exclusive write, where the center snapshot is unreadable.
 claimDigestNow(k){const l=this.writer.location(this.writer.capture()),d=this.parse(l.fs.readFileSync(l.file,'utf8'));if(this.owner.settings.commentsByNodeKey?.[k]!==d.commentsByNodeKey?.[k])fail('CENTER_PEO_UNSAVED_COMMENT');return this.claimDigestOf(d,k)}
 // The writer names center-transition backups by txId without seeing the private permit table.
 permitTx(permit){const s=permit&&permits.get(permit);return s&&s.executor===this?s.txId:null;}
 guardPublish(before,after,permit){
  const saved=permit&&permits.get(permit);
  if(!saved)return this.guardOrdinary(before,after);
  if(saved.executor!==this||saved.before!==before||saved.after!==after)fail('CENTER_PEO_PERMIT');
  const t=this.trusted(saved.p,saved.txId,saved.c);this.guardOrdinary(before,after,saved.p.subject.primaryNodeKey,saved.c);
  if(this.beforeOrAfter(before,saved.p,saved.txId,t).state!=='before'||this.beforeOrAfter(after,saved.p,saved.txId,t).state!=='after')fail('CENTER_PEO_PERMIT_STATE');
  if(this.owner.settings.commentsByNodeKey?.[saved.p.subject.primaryNodeKey]!==this.parse(before).commentsByNodeKey[saved.p.subject.primaryNodeKey])fail('CENTER_PEO_UNSAVED_COMMENT');
  L.match(L.entry(this.owner.settings,this.legacy.FIELD,saved.p.subject.primaryNodeKey),saved.p.subject,'peo',saved.p.legacy);
  this.legacy.guardOrdinaryWrite(before,after);return t;
 }
 async prepare(contextId,newLabel){
  return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   const c=this.configured(this.capture()),context=c.s.contexts.find(x=>x.contextId===contextId);if(!context||context.naming.authority!=='center'||context.naming.pending)fail('CENTER_PEO_NOT_READY');
   const raw=this.read(c),d=this.parse(raw),s=context.subjects[0],k=s.primaryNodeKey;const m=this.map(d),list=L.entry(d,this.legacy.FIELD,k),legacy=L.evidence(list,s,'peo');this.legacy.receipts(d);
   this.guardOrdinary(raw,raw,null,c);L.match(L.entry(this.owner.settings,this.legacy.FIELD,k),s,'peo',legacy);
   if(legacy&&!m[k]&&list.at(-1).newLabel!==context.canonicalLabel)fail('CENTER_PEO_LEGACY_HEAD_CHANGED');
   const comment=d.commentsByNodeKey?.[k],old=this.legacy.declaration(comment).label;if(old!==context.canonicalLabel||this.owner.settings.commentsByNodeKey?.[k]!==comment)fail('CENTER_PEO_UNSAVED_COMMENT');this.legacy.unique(d,k,[old,newLabel]);
   const next=this.legacy.declaration(comment,newLabel).comment;if(this.legacy.declaration(next,old).comment!==comment)fail('CENTER_PEO_NONREVERSIBLE');
   const p={version:legacy?2:1,ownerId:'project-execution-overview',subject:copy(s),oldLabel:old,newLabel,preconditionHash:hash(comment),...(legacy?{legacy}:{})};p.receiptKey=receiptKey(p);this.validate(p);this.fresh(c);return p;
  }));
 }
 async inspect(plan,txId){
  const p=this.validate(plan),c=this.configured(this.capture());return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   const t=this.trusted(p,txId,c),r=this.beforeOrAfter(this.read(c),p,txId,t);this.trusted(p,txId,c);if(r.state==='after')this.reconcile(r.d,p,t);
   return {state:r.state,txId,planHash:hash(t.row),receiptHash:hash(this.receipt(p,txId,t))};
  }));
 }
 async apply(plan,txId,externalLease){
  const p=this.validate(plan),c=this.configured(this.capture());if(typeof externalLease!=='function')fail('CENTER_PEO_LEASE_REQUIRED');
  const lease=()=>{this.writer.sync(externalLease);this.trusted(p,txId,c);};
  return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   lease();const t=this.trusted(p,txId,c),before=this.read(c),r=this.beforeOrAfter(before,p,txId,t),k=p.subject.primaryNodeKey;
   L.match(L.entry(this.owner.settings,this.legacy.FIELD,k),p.subject,'peo',p.legacy);
   if(r.state==='after'){this.reconcile(r.d,p,t);return {state:'after',alreadyApplied:true};}
   if(this.owner.settings.commentsByNodeKey?.[k]!==r.d.commentsByNodeKey[k])fail('CENTER_PEO_UNSAVED_COMMENT');
   const previous=r.d.commentsByNodeKey[k];r.d.commentsByNodeKey[k]=this.legacy.declaration(previous,p.newLabel).comment;r.d[FIELD]={...(r.d[FIELD]||{}),[k]:this.receipt(p,txId,t)};
   const after=JSON.stringify(r.d);this.parse(after);this.map(r.d);const permit={};permits.set(permit,{executor:this,p,txId,c,before,after});
   try{await this.writer.publish(c.owner,before,after,lease,permit);}finally{permits.delete(permit);}
   lease();if(this.read(c)!==after)fail('CENTER_PEO_READBACK_UNKNOWN');
   // Preserve unrelated in-memory edits. Never replace the entire settings object.
   this.reconcile(r.d,p,t);return {state:'after',alreadyApplied:false};
  }));
 }
}
function preservedSettings(value,legacy){if(!value||!Object.hasOwn(value,FIELD))return {};const d=legacy.parse(JSON.stringify(value));Projection.prototype.map.call({legacy},d);return {[FIELD]:d[FIELD]};}
function legacyView(data,legacy){
 // Only validation sees this projection; callers retain and persist the original.
 const d=copy(data),map=Projection.prototype.map.call({legacy},d);
 for(const [key,r] of Object.entries(map))if(r.version===2){const list=L.entry(d,legacy.FIELD,key);d.commentsByNodeKey[key]=legacy.declaration(d.commentsByNodeKey[key],list.at(-1).newLabel).comment;}
 return d;
}
// C1 participant for the center naming adapter. Pending sources (fail-closed, C1 R5/A7): the legacy rename journal
// (pending/paused/review, empty plans matched by address), goal-full-rename-v1 and context-creation-v1.
const CAPABILITIES=['comment-save','comment-clear','rename','legacy-retry','creation','saveData'];
const address=x=>String(x||'').match(/^([0-9][0-9A-Za-z]*)\s*[-－—]/)?.[1]?.toLocaleLowerCase()||null;

// Excluding a pending job requires a complete, internally consistent production identity graph.
// Unknown historical shapes remain pending; display numbers are never identity evidence.
function creationTouches(c,plan){
 try{
  const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const text=x=>typeof x==='string'&&!!x&&x===x.trim()&&!/[\x00-\x1f]/.test(x);
  const path=x=>{P.path(x);return x;};
  const jump=(...parts)=>'jump:v1:'+parts.map(encodeURIComponent).join('|');
  const equal=(a,b)=>same(a,b);
  if(!object(plan)||plan.version!==1||!/^create-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(plan.id)||!['project','goal'].includes(plan.domain)||!object(plan.input)||!text(plan.input.contextKey)||!text(plan.input.projectName)||!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(plan.weekId))return true;
  path(plan.source);
  const goal=plan.domain==='goal',suffix=plan.id.slice(7);
  const order=[...(goal?['mandala-db','mandala-keywords']:['workspace-primary']),'gtd-tag','gtd-keyword','gtd-project','gtd-note','workspace-carrier','workspace-keyword','collection-carrier','collection-keyword',...(goal?['eva-carrier']:[]),'peo-declaration','mandala-weekly'];
  if(!Array.isArray(plan.steps)||plan.steps.length!==order.length)return true;
  const owners={'workspace':'workspace-mount','collection':'collection-card-view','gtd':'gtd-task-manager','mandala':'mandala-time-blocks','eva':'eva-cross-view-relations','peo':'project-execution-overview'};
  const rows={};
  for(let i=0;i<order.length;i++){
   const s=plan.steps[i],p=s?.plan;
   if(!object(s)||s.id!==order[i]||s.owner!==owners[s.id.split('-')[0]]||s.contract!==1||!object(p)||p.txId!==plan.id||s.source!==p.sourceNotePath||!equal(s.depends,i?[order[i-1]]:[]))return true;
   path(s.source);
   if(Object.hasOwn(p,'version')&&p.version!==1)return true;
   if(Object.hasOwn(p,'domain')&&p.domain!==plan.domain)return true;
   if(s.id!=='eva-carrier'&&(p.contextKey!==plan.input.contextKey||p.projectName!==plan.input.projectName))return true;
   rows[s.id]=p;
  }
  const d=rows['peo-declaration'],w=rows['mandala-weekly'],g=rows['gtd-tag'],wm=rows['workspace-carrier'],cc=rows['collection-carrier'];
  if(d.domain!==plan.domain||w.domain!==plan.domain||w.sourceNotePath!==plan.source||w.weekId!==plan.weekId||!text(w.nodeId))return true;
  P.strictSubject({domain:plan.domain,ownerId:goal?'mandala-time-blocks':'workspace-mount',sourceScope:d.sourceNotePath,primaryNodeKey:d.nodeKey});
  for(const group of [['gtd-tag','gtd-keyword','gtd-project','gtd-note'],['workspace-carrier','workspace-keyword'],['collection-carrier','collection-keyword']])if(group.some(id=>!equal(rows[id],rows[group[0]])))return true;
  if(g.tagId!=='context-'+suffix||g.projectId!=='project-'+suffix||wm.tabId!=='tab_ck_'+suffix||cc.tabId!=='tab_ck_'+suffix||wm.domain!==plan.domain||cc.domain!==plan.domain)return true;
  for(const p of [wm,cc]){path(p.dataPath);path(p.keywordPath);if(p.keywordKey!==p.contextKey.trim().toLocaleLowerCase()||!['present','absent'].includes(p.keywordFileState))return true;}
  for(const k of ['db','keywords','weeklyGoals'])path(w[k]);
  for(const k of ['folder','tagsPath','keywordsPath','dbPath','notePath'])path(g[k]);
  if(g.notePath!==g.folder+'/'+plan.input.projectName+'.md')return true;
  if(goal){
   const db=rows['mandala-db'],kw=rows['mandala-keywords'],expected={...w};delete expected.weeklyTargets;
   if(!equal(db,kw)||!equal(db,expected)||w.nodeId!=='node-'+suffix||db.parentNodeId!==plan.input.parentNodeId||!text(db.parentNodeId)||![0,1,2,3,5,6,7,8].includes(db.slot)||d.sourceNotePath!==plan.source||d.nodeKey!==jump('mandala-time-blocks',plan.source,'node','mandala',w.nodeId))return true;
   const e=rows['eva-carrier'],r=e.relation;
   if(e.sourceNotePath!==plan.source||!object(r)||r.id!=='rel-create-'+suffix||r.relationType!=='承载'||r.sourceNodeKey!==d.nodeKey||r.targetNodeKey!==jump('gtd',g.sourceNotePath,'note',g.sourceNotePath,g.projectId))return true;
  }else{
   const p=rows['workspace-primary'];path(p.dataPath);
   if(!text(p.tabId)||p.itemId!=='item_ck_'+suffix||p.sourceNotePath!==d.sourceNotePath||p.sourceNotePath!==wm.sourceNotePath||p.dataPath!==wm.dataPath||d.nodeKey!==jump('workspace-mount-view',p.sourceNotePath,'tab',p.tabId,p.itemId)||w.nodeId!==d.nodeKey)return true;
  }
  const buckets=goal?['rowsByKey','nodeStatesByKey','goalPlanRowsByKey']:['workspaceRowsByKey','workspaceNodeStatesByKey','projectPlanRowsByKey'];
  const key=plan.source+'::'+w.nodeId;
  if(!Array.isArray(w.weeklyTargets)||w.weeklyTargets.length!==3)return true;
  for(let i=0;i<3;i++){
   const t=w.weeklyTargets[i];
   if(!object(t)||t.bucket!==buckets[i]||t.key!==key+(i===0?'::'+plan.weekId:'')||!object(t.value)||t.value.sourceNotePath!==plan.source||t.value.nodeId!==w.nodeId||i===0&&t.value.weekId!==plan.weekId)return true;
  }
  if(!Array.isArray(c?.subjects)||!Array.isArray(c?.bindings))return true;
  if(c.subjects.some(s=>s.domain===plan.domain&&s.sourceScope===d.sourceNotePath&&s.primaryNodeKey===d.nodeKey))return true;
  return [['workspace-mount',wm,'tabId'],['gtd-task-manager',g,'tagId'],['collection-card-view',cc,'tabId']].some(([ownerId,p,field])=>c.bindings.some(b=>b.ownerId===ownerId&&b.sourceScope===p.sourceNotePath&&b.carrierId===p[field]));
 }catch{return true;}
}

function createParticipant(plugin){
 const ownerId='project-execution-overview',proj=()=>plugin.goalPeoWriter?.centerNaming,first=proj();
 const live=()=>!!first&&proj()===first&&!plugin.contextCarrierUnloading&&plugin.app?.plugins?.plugins?.[plugin.manifest?.id]===plugin;
 const need=()=>{if(!live())fail('CENTER_PEO_PARTICIPANT_UNAVAILABLE');return first};
 const C=require('./binding-compatibility-checks.cjs'),installedWriter=first?.writer,writerMethods=C.pinMethods(installedWriter,["serial", "capture", "assert", "sync", "location", "publishFirst", "publish", "save", "declarationOwner"]),installedEntries=["saveData"].map(k=>[k,plugin[k]]);
 const installed=()=>{if(first?.writer!==installedWriter||plugin.goalPeoWriter!==installedWriter)fail('binding-writer-changed');writerMethods();for(const [k,fn] of installedEntries)if(typeof fn!=='function'||plugin[k]!==fn)fail('binding-entry-changed:'+k);return true};
 async function pending(c){
  const s=c.subjects[0],k=s.primaryNodeKey,addr=address(c.canonicalLabel),out=[];
  const j=plugin.contextRenameJournal;if(!j||typeof j.snapshot!=='function')fail('CENTER_PEO_LEGACY_JOURNAL_UNREADABLE');const snap=j.snapshot();if(snap.error)fail('CENTER_PEO_LEGACY_JOURNAL_ERROR');
  for(const job of snap.jobs||[]){if(['complete','superseded'].includes(job.status))continue;
   const touches=job.primaryNodeKey===k||(job.providers||[]).some(pr=>pr.plan?(pr.plan.targets||[]).some(t=>c.bindings.some(b=>b.ownerId===pr.id&&b.sourceScope===pr.plan.scope?.sourceNotePath&&b.carrierId===t.carrierId)):[...(job.oldLabels||[]),job.newDisplayLabel].some(l=>addr&&address(l)===addr));
   if(touches)out.push({source:'context-key-renames.json',id:job.id,status:job.status})}
  const full=plugin.getGoalProductionCoordinator().journal(false);for(const x of full?await full.list():[])if(x.plan.nodeKey===k&&x.progress.status!=='complete')out.push({source:'goal-full-rename-v1',id:x.plan.txId,status:x.progress.status});
  const cre=plugin.getCreationProductionCoordinator().journal(false);for(const x of cre?await cre.list():[]){if(x.progress.status==='complete')continue;if(creationTouches(c,x.plan))out.push({source:'context-creation-v1',id:x.plan.id,status:x.progress.status})}
  return out;
 }
 const participant=Object.freeze({ownerId,
  bindingCompatibility(){installed();const x=need();C.validator(S);const method=C.pinPrototype(x,Projection.prototype),writer=x.writer,w=C.pinMethods(writer),generation=x.generation,auth=C.pinAuthority(()=>x.resolveAuthority(),()=>plugin.app.vault.adapter.getBasePath());const guard=()=>{installed();if(need()!==x||x.generation!==generation)fail('binding-writer-changed');method();w();auth();return true};guard();const proof=Object.freeze({version:1,ownerId,generation,bindingFormat:S.BINDING_FORMAT});compatibilityProofs.set(proof,{part:participant,guard});return proof;},
  status(){const ok=live();return {ownerId,mode:ok?'ready':'unavailable',generation:first?.generation||'',capabilities:ok?CAPABILITIES.slice():[]}},
  async bindingPending(c){need();const jobs=await pending(c);need();return jobs},
  async evidence(c){const x=need(),r=await x.dryRunClaim(c.contextId),pend=await pending(c);need();return {ownerId,generation:x.generation,digest:r.digest,lineageHash:r.lineageHash,pending:pend}},
  digestNow(c){return need().claimDigestNow(c.subjects[0].primaryNodeKey)},
  async prepare(c,newLabel){const plan=await need().prepare(c.contextId,newLabel);need();return {id:'peo-declaration',ownerId,subject:copy(c.subjects[0]),bindings:[],plan}},
  inspect(row,txId){return need().inspect(row.plan,txId)},
  apply(row,txId,lease){return need().apply(row.plan,txId,lease)}
 });
 return participant;
}
module.exports={Projection,FIELD,hash,receiptKey,preservedSettings,legacyView,createParticipant,CAPABILITIES,creationTouches};

const compatibilityProofs=new WeakMap();
function verifyBindingCompatibility(part,proof){const r=compatibilityProofs.get(proof);if(!r||r.part!==part)throw Error('binding-proof-unissued');r.guard();return r.guard;}
module.exports.verifyBindingCompatibility=verifyBindingCompatibility;

},
"./primary-plan.cjs":function(module,exports,require){
'use strict';
const {createHash}=require('node:crypto');
const L=require('./legacy-goal-receipts.cjs');
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const fail=x=>{throw Error(x)},fields=(x,ks)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join('|')!==ks.slice().sort().join('|'))fail('MANDALA_PLAN_SCHEMA')};
const path=p=>{if(typeof p!=='string'||!p||p.length>2048||p!==p.trim()||/[\\:\x00-\x1f]/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'))fail('MANDALA_PLAN_PATH');return p};
function subject(s){fields(s,['domain','ownerId','sourceScope','primaryNodeKey']);path(s.sourceScope);if(s.domain!=='goal'||s.ownerId!=='mandala-time-blocks'||typeof s.primaryNodeKey!=='string')fail('MANDALA_PLAN_SUBJECT');let parts;try{parts=s.primaryNodeKey.slice(8).split('|').map(decodeURIComponent)}catch{fail('MANDALA_PLAN_SUBJECT')}
 if(!s.primaryNodeKey.startsWith('jump:v1:')||parts.length!==5||parts[0]!==s.ownerId||parts[1]!==s.sourceScope||parts[2]!=='node'||parts[3]!=='mandala'||!parts[4]||parts[4]==='root'||parts[4]!==parts[4].trim()||/[\x00-\x1f]/.test(parts[4])||s.primaryNodeKey.slice(8)!==parts.map(encodeURIComponent).join('|'))fail('MANDALA_PLAN_SUBJECT');return parts[4];}
const label=s=>{if(typeof s!=='string'||s!==s.trim()||s.length>512||/[\x00-\x1f]/.test(s))fail('MANDALA_PLAN_LABEL');const m=/^([0-9]{3}[a-zA-Z0-9]*)\s*[-－—]\s*(\S.*)$/.exec(s);if(!m)fail('MANDALA_PLAN_LABEL');return m[1].toUpperCase()};
const digest=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const receiptKey=p=>hash([p.ownerId,p.subject,p.oldLabel,p.newLabel,p.preconditionHash]);
function validate(p){fields(p,['version','ownerId','subject','oldLabel','newLabel','sourcePaths','before','preconditionHash','receiptKey',...(p.version===3?['legacy']:[])]);subject(p.subject);fields(p.sourcePaths,['db','keywords','weeklyGoals']);fields(p.before,['db','keywords','receiptHash']);if(p.version===3)L.descriptor(p.legacy);
 if(![2,3].includes(p.version)||p.ownerId!=='mandala-time-blocks'||label(p.oldLabel)!==label(p.newLabel)||p.oldLabel.toLocaleLowerCase()===p.newLabel.toLocaleLowerCase()||new Set([p.subject.sourceScope,...Object.values(p.sourcePaths).map(path)]).size!==4||!Object.values(p.before).every(digest)||p.preconditionHash!==hash([p.sourcePaths,p.before,...(p.version===3?[p.legacy]:[])])||p.receiptKey!==receiptKey(p))fail('MANDALA_PLAN_INVALID');return p;}
const peoReceiptKey=p=>hash([p.ownerId,p.subject,p.oldLabel,p.newLabel,p.preconditionHash,...(p.version===2?[p.legacy]:[])]);
function validatePeoLegacy(p){fields(p,['version','ownerId','subject','oldLabel','newLabel','preconditionHash','receiptKey','legacy']);subject(p.subject);L.descriptor(p.legacy);if(p.version!==2||p.ownerId!=='project-execution-overview'||label(p.oldLabel)!==label(p.newLabel)||p.oldLabel.toLocaleLowerCase()===p.newLabel.toLocaleLowerCase()||!digest(p.preconditionHash)||p.receiptKey!==peoReceiptKey(p))fail('PEO_LEGACY_PLAN_INVALID');return p;}
// Strict subject rule shared by the center claim command and the PEO/Mandala projections (union of both former rules).
function strictSubject(s,code='STRICT_SUBJECT_INVALID'){const bad=()=>fail(code);try{fields(s,['domain','ownerId','sourceScope','primaryNodeKey']);path(s.sourceScope)}catch{bad()}
 if(typeof s.primaryNodeKey!=='string'||!s.primaryNodeKey.startsWith('jump:v1:'))bad();let p;try{p=s.primaryNodeKey.slice(8).split('|').map(decodeURIComponent)}catch{bad()}
 if(p.length!==5||p.some(x=>!x||x!==x.trim()||/[\x00-\x1f]/.test(x))||p.map(encodeURIComponent).join('|')!==s.primaryNodeKey.slice(8)||p[1]!==s.sourceScope)bad();
 if(!(s.domain==='project'&&s.ownerId==='workspace-mount'&&p[0]==='workspace-mount-view'&&p[2]==='tab')&&!(s.domain==='goal'&&s.ownerId==='mandala-time-blocks'&&p[0]===s.ownerId&&p[2]==='node'&&p[3]==='mandala'&&p[4]!=='root'))bad();return s;}
module.exports={hash,fields,path,subject,label,digest,receiptKey,validate,peoReceiptKey,validatePeoLegacy,strictSubject};

},
"./legacy-goal-receipts.cjs":function(module,exports,require){
'use strict';
const {createHash}=require('node:crypto');
const fail=x=>{throw Error(x)},plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':plain(x)?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex'),same=(a,b)=>stable(a)===stable(b);
const fields=(x,keys)=>{if(!plain(x)||Object.keys(x).sort().join('|')!==keys.slice().sort().join('|'))fail('LEGACY_GOAL_SCHEMA')};
function descriptor(x){fields(x,['receiptHash','lineageHash']);if(!Object.values(x).every(v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)))fail('LEGACY_GOAL_DIGEST');return x;}
const label=x=>{if(typeof x!=='string'||x!==x.trim()||x.length>512||/[\x00-\x1f]/.test(x))fail('LEGACY_GOAL_LABEL');const m=/^([0-9]{3}[a-zA-Z0-9]*)\s*[-－—]\s*\S/.exec(x);if(!m)fail('LEGACY_GOAL_LABEL');return m[1].toUpperCase()};
function evidence(list,subject,owner){
 if(list===undefined)return undefined;
 if(!['peo','mandala'].includes(owner)||subject?.domain!=='goal'||subject.ownerId!=='mandala-time-blocks')fail('LEGACY_GOAL_SUBJECT');
 let id;try{id=decodeURIComponent(subject.primaryNodeKey.split('|')[4])}catch{fail('LEGACY_GOAL_SUBJECT')}
 if(subject.primaryNodeKey!=='jump:v1:'+['mandala-time-blocks',subject.sourceScope,'node','mandala',id].map(encodeURIComponent).join('|')||!id||id==='root')fail('LEGACY_GOAL_SUBJECT');
 if(!Array.isArray(list)||!list.length||list.length>256)fail('LEGACY_GOAL_CHAIN');const seen=new Set(),lineage=[];
 for(let i=0;i<list.length;i++){const r=list[i];fields(r,['version','txId',owner==='peo'?'nodeKey':'nodeId','sourceNotePath','oldLabel','newLabel']);
  if(r.version!==1||r.sourceNotePath!==subject.sourceScope||(owner==='peo'?r.nodeKey!==subject.primaryNodeKey:r.nodeId!==id)||typeof r.txId!=='string'||!/^goal-rename-[a-zA-Z0-9-]{8,80}$/.test(r.txId)||seen.has(r.txId)||label(r.oldLabel)!==label(r.newLabel)||r.oldLabel.toLowerCase()===r.newLabel.toLowerCase()||i&&list[i-1].newLabel!==r.oldLabel)fail('LEGACY_GOAL_CHAIN');seen.add(r.txId);
  lineage.push({version:r.version,txId:r.txId,sourceNotePath:r.sourceNotePath,oldLabel:r.oldLabel,newLabel:r.newLabel});
 }return {receiptHash:hash(list),lineageHash:hash(lineage)};
}
function match(list,subject,owner,expected){if(expected!==undefined)descriptor(expected);const actual=evidence(list,subject,owner);if(!same(actual,expected))fail('LEGACY_GOAL_EVIDENCE_CHANGED');return actual;}
function entry(data,field,key){if(!Object.hasOwn(data,field))return undefined;if(!plain(data[field]))fail('LEGACY_GOAL_CONTAINER');return Object.hasOwn(data[field],key)?data[field][key]:undefined;}
module.exports={descriptor,evidence,match,entry,hash,same};

}},cache={};const req=n=>{if(Object.prototype.hasOwnProperty.call(defs,n)){if(!cache[n]){const m={exports:{}};cache[n]=m;defs[n](m,m.exports,req)}return cache[n].exports}try{return require(n)}catch(e){if(typeof n==="string"&&n.startsWith("node:"))return require(n.slice(5));throw e}};return req("./center-peo-projection.cjs")})();

const GoalPeoDeclarationModule=(()=>{const module={exports:{}};
'use strict';
// Internal owner candidate. A caller-created plan is never durable authorization.
const {createHash}=require('node:crypto');
const FIELD='managedGoalDeclarationReceiptsV1',MAX=8*1024*1024;
const fail=c=>{throw Object.assign(new Error(c),{code:c})};
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':plain(x)?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const equal=(a,b)=>stable(a)===stable(b);
function parse(raw){
 if(typeof raw!=='string'||Buffer.byteLength(raw)>MAX)fail('PEO_RAW_LIMIT');
 const x=JSON.parse(raw);let count=0;
 const walk=(v,d)=>{if(++count>100000||d>64)fail('PEO_STRUCTURE_LIMIT');if(v&&typeof v==='object')for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))fail('PEO_UNSAFE_KEY');walk(v[k],d+1)}};walk(x,0);
 if(!plain(x))fail('PEO_SETTINGS_SCHEMA');return x;
}
const clone=x=>parse(JSON.stringify(x));
function subject(k){
 if(typeof k!=='string'||k.length>4096)fail('PEO_NODE_KEY');const p=k.split('|');
 if(p.length!==5||p[0]!=='jump:v1:mandala-time-blocks'||p[2]!=='node'||p[3]!=='mandala')fail('PEO_NODE_KEY');
 let source,id;try{source=decodeURIComponent(p[1]);id=decodeURIComponent(p[4])}catch{fail('PEO_NODE_KEY')}
 if(!source||source.length>2048||/[\\:\x00-\x1f]/.test(source)||source.split('/').some(s=>!s||s==='.'||s==='..')||!id||id.length>256||/[\x00-\x1f|]/.test(id)||encodeURIComponent(source)!==p[1]||encodeURIComponent(id)!==p[4])fail('PEO_NODE_KEY');return {sourceNotePath:source,nodeId:id};
}
function address(s){if(typeof s!=='string'||s!==s.trim()||s.length>512||/[\x00-\x1f]/.test(s))fail('PEO_LABEL');const m=/^([0-9]{3}[a-zA-Z0-9]*)\s*[-－—]\s*(\S.*)$/.exec(s);if(!m)fail('PEO_LABEL');return m[1].toUpperCase()}
function declaration(comment,replacement){
 if(typeof comment!=='string')fail('PEO_DECLARATION');const lines=comment.split(/(\r?\n)/);let inside=false,labels=[];
 for(let i=0;i<lines.length;i+=2){const line=lines[i];if(line.trim()==='---'){inside=!inside;continue}if(!inside||!line.trim()||/^\s*(project_name|importance_group)\s*:/i.test(line))continue;
 const m=/^(\s*(?:(?:context_key|operation_context_key)\s*:\s*)?)(.*?)(\s*)$/i.exec(line);address(m[2]);labels.push(m[2]);if(replacement!==undefined)lines[i]=m[1]+replacement+m[3];}
 if(inside||labels.length!==1)fail('PEO_DECLARATION');return {label:labels[0],comment:lines.join('')};
}
function receipts(data){
 data=CenterPeoProjectionModule.legacyView(data,{FIELD,declaration});
 const map=Object.hasOwn(data,FIELD)?data[FIELD]:{};
 if(!plain(map)||Object.keys(map).length>10000)fail('PEO_RECEIPTS');const seen=new Set();
 for(const [key,list] of Object.entries(map)){
  const s=subject(key);if(!Array.isArray(list)||!list.length||list.length>256)fail('PEO_RECEIPTS');
  for(let i=0;i<list.length;i++){const r=list[i];if(!plain(r)||Object.keys(r).sort().join(',')!=='newLabel,nodeKey,oldLabel,sourceNotePath,txId,version'||r.version!==1||r.nodeKey!==key||r.sourceNotePath!==s.sourceNotePath||typeof r.txId!=='string'||!/^goal-rename-[a-zA-Z0-9-]{8,80}$/.test(r.txId)||seen.has(r.txId)||address(r.oldLabel)!==address(r.newLabel)||r.oldLabel.toLowerCase()===r.newLabel.toLowerCase()||i&&list[i-1].newLabel!==r.oldLabel)fail('PEO_RECEIPTS');seen.add(r.txId)}
  if(declaration(data.commentsByNodeKey?.[key]).label!==list.at(-1).newLabel)fail('PEO_RECEIPT_BINDING');
 }return map;
}
function guardOrdinaryWrite(beforeRaw,afterRaw){const a=parse(beforeRaw),b=parse(afterRaw);if(!equal(receipts(a),receipts(b))||Object.hasOwn(a,FIELD)!==Object.hasOwn(b,FIELD))fail('PEO_RECEIPT_CHANGED');return b}
function preservedSettings(value){if(!value||!Object.hasOwn(value,FIELD))return {};const data=clone(value);receipts(data);return data}
function unique(data,key,labels){
 if(!plain(data.commentsByNodeKey)||Object.values(data.commentsByNodeKey).some(v=>typeof v!=='string'))fail('PEO_COMMENT_MAP');
 const names=new Set(labels.map(s=>s.toLowerCase()));
 for(const [k,v] of Object.entries(data.commentsByNodeKey)){if(k===key)continue;let inside=false;for(const line of v.split(/\r?\n/)){if(line.trim()==='---'){inside=!inside;continue}if(inside&&names.has(line.trim().replace(/^(?:context_key|operation_context_key)\s*:\s*/i,'').toLowerCase()))fail('PEO_NAME_CONFLICT')}}
}
function derive(input){
 const {txId,nodeKey,sourceNotePath,oldLabel,newLabel,beforeRaw}=input,s=subject(nodeKey),data=parse(beforeRaw),map=receipts(data);
 if(sourceNotePath!==s.sourceNotePath||typeof txId!=='string'||!/^goal-rename-[a-zA-Z0-9-]{8,80}$/.test(txId)||address(oldLabel)!==address(newLabel)||oldLabel.toLowerCase()===newLabel.toLowerCase())fail('PEO_PLAN_IDENTITY');
 if(Object.values(map).flat().some(r=>r.txId===txId))fail('PEO_TX_REUSED');
 unique(data,nodeKey,[oldLabel,newLabel]);const beforeComment=data.commentsByNodeKey[nodeKey],change=declaration(beforeComment,newLabel);if(change.label!==oldLabel)fail('PEO_OLD_LABEL');
 const beforeReceipts=map[nodeKey]||[];if(beforeReceipts.length>=256)fail('PEO_RECEIPT_CAPACITY');
 const receipt={version:1,txId,nodeKey,sourceNotePath,oldLabel,newLabel};
 return {version:1,type:'peo-goal-declaration-v1',txId,nodeKey,sourceNotePath,oldLabel,newLabel,beforeRaw,beforeHash:hash(beforeRaw),beforeComment,afterComment:change.comment,beforeReceipts,afterReceipts:[...beforeReceipts,receipt]};
}
function validate(value){const p=clone(value),expected=derive(p);if(!equal(p,expected))fail('PEO_PLAN_TAMPERED');return p}
function inspectRaw(raw,p){const data=parse(raw),map=receipts(data);unique(data,p.nodeKey,[p.oldLabel,p.newLabel]);if(data.commentsByNodeKey[p.nodeKey]===p.afterComment&&equal(map[p.nodeKey],p.afterReceipts))return 'verified';if(data.commentsByNodeKey[p.nodeKey]===p.beforeComment&&equal(map[p.nodeKey]||[],p.beforeReceipts))return 'pending';fail('PEO_DECLARATION_CONFLICT')}
class DeclarationOwner {
 constructor(io){this.io=io}
 async authorized(input){const p=validate(input);this.io.assertLease();const trusted=await this.io.readConfirmedPlan(p.txId);this.io.assertLease();if(!equal(trusted,p))fail('PEO_CONFIRMATION_MISSING');return p}
 async inspect(input){return this.io.serialize(async()=>{const p=await this.authorized(input),raw=await this.io.read();this.io.assertLease();return {state:inspectRaw(raw,p)}})}
 async commit(input){return this.io.serialize(async()=>{const p=await this.authorized(input),before=await this.io.read();this.io.assertLease();if(inspectRaw(before,p)==='verified')return {state:'verified',alreadyApplied:true};
  const data=parse(before);data.commentsByNodeKey[p.nodeKey]=p.afterComment;data[FIELD]={...(data[FIELD]||{}),[p.nodeKey]:p.afterReceipts};const after=JSON.stringify(data);receipts(data);
  await this.io.compareAndSwap(before,after,()=>this.io.assertLease());this.io.assertLease();const raw=await this.io.read();this.io.assertLease();if(raw!==after)fail('PEO_READBACK_UNKNOWN');return {state:'verified',alreadyApplied:false};})}
}
module.exports={FIELD,MAX,parse,hash,derive,validate,receipts,guardOrdinaryWrite,preservedSettings,DeclarationOwner,declaration,unique};

return module.exports;})();
const PeoCreationModule=(()=>{const module={exports:{}};
'use strict';
const FIELD='managedContextCreationsV1',eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x)),plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x),fail=c=>{throw Object.assign(Error(c),{code:c})};
function parse(raw){if(typeof raw!=='string'||Buffer.byteLength(raw)>8*1024*1024)fail('PEO_CREATE_RAW');const d=JSON.parse(raw);let count=0;function walk(x,n){if(++count>200000||n>64)fail('PEO_CREATE_LIMIT');if(x&&typeof x==='object')for(const k of Object.keys(x)){if(['__proto__','constructor','prototype'].includes(k))fail('PEO_CREATE_UNSAFE');walk(x[k],n+1)}}walk(d,0);if(!plain(d)||!plain(d.commentsByNodeKey)||!plain(d.groupCapsuleLevels)||d[FIELD]!==undefined&&!plain(d[FIELD]))fail('PEO_CREATE_SCHEMA');return d}
function derive(input){if(!/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.txId)||!['project','goal'].includes(input.domain))fail('PEO_CREATE_ID');let parts;try{parts=input.nodeKey.slice(8).split('|').map(decodeURIComponent)}catch{fail('PEO_CREATE_KEY')}if(!input.nodeKey.startsWith('jump:v1:')||parts.length!==5||parts.some(s=>!s||/[\x00-\x1f]/.test(s))||parts.map(encodeURIComponent).join('|')!==input.nodeKey.slice(8)||parts[0]!==(input.domain==='goal'?'mandala-time-blocks':'workspace-mount-view')||parts[2]!==(input.domain==='goal'?'node':'tab')||input.domain==='goal'&&parts[3]!=='mandala')fail('PEO_CREATE_KEY');
 if(typeof input.contextKey!=='string'||input.contextKey!==input.contextKey.trim()||input.contextKey.length>512||!/^\d{3}[a-zA-Z0-9]*\s*[-－—]\s*\S/.test(input.contextKey)||/[\x00-\x1f]/.test(input.contextKey)||typeof input.projectName!=='string'||!input.projectName||/[\x00-\x1f]/.test(input.projectName)||!['0','A','B','C','CZ'].includes(input.importanceGroup))fail('PEO_CREATE_INPUT');
 const mode=input.domain==='goal'?'mandala':'workspace';return {version:1,txId:input.txId,domain:input.domain,nodeKey:input.nodeKey,sourceNotePath:parts[1],contextKey:input.contextKey,projectName:input.projectName,importanceGroup:input.importanceGroup,levelKey:mode+'::'+mode+':'+input.nodeKey,comment:`---\n${input.contextKey}\nproject_name: ${input.projectName}\nimportance_group: ${input.importanceGroup}\n---`};
}
function receipt(p){return {version:1,txId:p.txId,nodeKey:p.nodeKey,sourceNotePath:p.sourceNotePath,levelKey:p.levelKey}}
function labels(comment,strict=false){let inside=false;const out=[];for(const line of String(comment||'').split(/\r?\n/)){if(line.trim()==='---'){inside=!inside;continue}if(!inside)continue;const value=line.trim().replace(/^(?:context_key|operation_context_key)\s*:\s*/i,'');if(/^\d{3}[a-zA-Z0-9]*\s*[-－—]\s*\S/.test(value))out.push(value.toLowerCase())}return inside&&strict?[]:out}
function guard(before,after){const a=parse(before),b=parse(after),ar=a[FIELD]||{},br=b[FIELD]||{};if(!eq(ar,br))fail('PEO_CREATE_RECEIPT_LOST');for(const r of Object.values(ar))if(typeof b.commentsByNodeKey[r.nodeKey]!=='string'||labels(b.commentsByNodeKey[r.nodeKey],true).length!==1||!Object.hasOwn(b.groupCapsuleLevels,r.levelKey))fail('PEO_CREATE_BINDING_LOST');return after}
function preserve(value){if(!value||!Object.hasOwn(value,FIELD))return {};const raw=JSON.stringify(value);guard(raw,raw);return parse(raw)}
class PeoCreationOwner{
 constructor(owner,writer){this.owner=owner;this.writer=writer;this.capture=writer.capture();this.config=JSON.stringify([owner.settings.startQuery,owner.settings.startNodeKey,owner.settings.groupingMode])}
 current(){return JSON.stringify([this.owner.settings.startQuery,this.owner.settings.startNodeKey,this.owner.settings.groupingMode])===this.config}
 live(lease){this.writer.assert(this.capture);if(this.owner.managedCreationOwner!==this||lease&&lease()!==true||!this.current())fail('PEO_CREATE_LEASE')}
 read(){this.live();const l=this.writer.location(this.capture);return l.fs.readFileSync(l.file,'utf8')}
 state(raw,p){const d=parse(raw),r=d[FIELD]?.[p.txId],comment=d.commentsByNodeKey[p.nodeKey],level=d.groupCapsuleLevels[p.levelKey];for(const [k,v] of Object.entries(d.commentsByNodeKey)){if(k!==p.nodeKey&&labels(v).includes(p.contextKey.toLowerCase()))return {state:'conflict'}}
  if(r||comment!==undefined||level!==undefined)return eq(r,receipt(p))&&comment===p.comment&&level===p.importanceGroup?{state:'verified'}:{state:'conflict'};return {state:'absent'};
 }
 prepare(input){this.live(input.isCurrent);const p=derive(input);if(this.state(this.read(),p).state!=='absent'||this.state(JSON.stringify(this.owner.settings),p).state!=='absent')fail('PEO_CREATE_COLLISION');return {id:'peo-declaration',owner:'project-execution-overview',contract:1,source:p.sourceNotePath,plan:p,depends:[]}}
 async trusted(r){const p=r?.step?.plan;if(!p||r.step.id!=='peo-declaration'||r.step.owner!=='project-execution-overview'||r.step.contract!==1||r.intent?.id!==p.txId||!eq(derive(p),p)||typeof r.isCurrent!=='function'||typeof r.readConfirmedPlan!=='function')fail('PEO_CREATE_REQUEST');this.live(r.isCurrent);const stored=await r.readConfirmedPlan(p.txId);this.live(r.isCurrent);if(!stored?.steps?.some(s=>eq(s,r.step)))fail('PEO_CREATE_NOT_CONFIRMED');return p}
 reconcile(p,result){const m=this.state(JSON.stringify(this.owner.settings),p);if(m.state==='absent'){const s=this.owner.settings;s.commentsByNodeKey={...s.commentsByNodeKey,[p.nodeKey]:p.comment};s.groupCapsuleLevels={...s.groupCapsuleLevels,[p.levelKey]:p.importanceGroup};s[FIELD]={...(s[FIELD]||{}),[p.txId]:receipt(p)}}else if(m.state!=='verified')result.uiWarning='PEO_CREATE_UNSAVED_CONFLICT';return result}
 async inspect(r){return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{const p=await this.trusted(r),s=this.state(this.read(),p);this.live(r.isCurrent);return s.state==='verified'?this.reconcile(p,s):s}))}
 async commit(r){return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{const p=await this.trusted(r),before=this.read(),s=this.state(before,p);if(s.state==='verified')return this.reconcile(p,s);if(s.state!=='absent'||this.state(JSON.stringify(this.owner.settings),p).state!=='absent')fail('PEO_CREATE_CONFLICT');const d=parse(before);d.commentsByNodeKey[p.nodeKey]=p.comment;d.groupCapsuleLevels[p.levelKey]=p.importanceGroup;d[FIELD]={...(d[FIELD]||{}),[p.txId]:receipt(p)};
  const lease=()=>{this.live(r.isCurrent);if(this.state(JSON.stringify(this.owner.settings),p).state!=='absent')fail('PEO_CREATE_UNSAVED_CONFLICT')};
  await this.writer.publish(this.capture,before,JSON.stringify(d),lease,undefined,'creation');this.live(r.isCurrent);const result=this.state(this.read(),p);
  if(this.state(JSON.stringify(this.owner.settings),p).state==='absent'){const m=this.owner.settings;m.commentsByNodeKey={...m.commentsByNodeKey,[p.nodeKey]:p.comment};m.groupCapsuleLevels={...m.groupCapsuleLevels,[p.levelKey]:p.importanceGroup};m[FIELD]={...(m[FIELD]||{}),[p.txId]:receipt(p)}}else result.uiWarning='PEO_CREATE_DRAFT_CHANGED';
  return result;
 }))}
}
module.exports={PeoCreationOwner,FIELD,parse,guard,preserve,derive};

return module.exports;})();
// PEO-only data queue. Settings queue may enter this queue, never the reverse.
// Append-only receipt check for confirmed transactions: every existing key stays; creation receipts stay exactly
// equal, legacy declaration receipt lists keep their prefix (new entries may only be appended).
function preservedReceipts(kind,a,b){if(a===undefined||a===null)return true;if(!b||typeof b!=='object'||Array.isArray(b)||typeof a!=='object'||Array.isArray(a))return false;const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y),prefix=(x,y)=>Array.isArray(x)&&Array.isArray(y)&&y.length>=x.length&&x.every((v,i)=>same(v,y[i]));return Object.keys(a).every(k=>Object.hasOwn(b,k)&&(kind==='legacy'?prefix(a[k],b[k]):same(a[k],b[k])))}
// r39: when a prior-image backup group reaches its 64-file / 64 MB cap, move the oldest backups of that group into
// .goal-peo-archive/ (same volume; link then unlink, never overwrite, never delete) instead of refusing every later
// confirmed write. An interrupted move (archive link already exists with the same file identity) is completed by
// unlinking the source; a different file at the target is a conflict. FAT/exFAT (no hard links) fails safely.
function rotatePeoBackups(fs,path,dir,re,incomingBytes){
 const CAP_FILES=64,CAP_BYTES=64*1024*1024;
 if(incomingBytes>CAP_BYTES)throw Error("PEO_WRITER_BACKUP_CAPACITY");
 const files=fs.readdirSync(dir).filter(n=>re.test(n)).map(n=>{const p=path.join(dir,n),st=fs.lstatSync(p,{bigint:true});
  if(st.isSymbolicLink()||!st.isFile())throw Error("PEO_WRITER_BACKUP_SOURCE");return {n,p,st}});
 let total=files.reduce((s,f)=>s+Number(f.st.size),0),left=files.length;
 if(left<CAP_FILES&&total+incomingBytes<=CAP_BYTES)return 0;
 const root=fs.lstatSync(dir,{bigint:true}),archive=path.join(dir,".goal-peo-archive");
 const checkArchive=()=>{const a=fs.lstatSync(archive,{bigint:true});if(a.isSymbolicLink()||!a.isDirectory()||a.dev!==root.dev)throw Error("PEO_WRITER_BACKUP_ARCHIVE")};
 if(!fs.existsSync(archive))fs.mkdirSync(archive);
 checkArchive();
 files.sort((a,b)=>a.st.mtimeNs<b.st.mtimeNs?-1:a.st.mtimeNs>b.st.mtimeNs?1:a.n<b.n?-1:a.n>b.n?1:0);
 let moved=0;
 for(const f of files){
  if(left<CAP_FILES&&total+incomingBytes<=CAP_BYTES)break;
  const dst=path.join(archive,f.n);
  try{fs.linkSync(f.p,dst)}catch(e){
   if(e?.code!=="EEXIST")throw e;
   const d=fs.lstatSync(dst,{bigint:true});
   if(d.isSymbolicLink()||!d.isFile()||d.dev!==f.st.dev||d.ino!==f.st.ino)throw Error("PEO_WRITER_BACKUP_ARCHIVE_CONFLICT");
  }
  checkArchive();
  fs.unlinkSync(f.p);moved++;left--;total-=Number(f.st.size);
 }
 if(left>=CAP_FILES||total+incomingBytes>CAP_BYTES)throw Error("PEO_WRITER_BACKUP_CAPACITY");
 return moved;
}
class GoalPeoWriter {
 constructor(owner){this.owner=owner;this.tail=Promise.resolve();this.centerNaming=new CenterPeoProjectionModule.Projection(owner,this,GoalPeoDeclarationModule,()=>owner.app.plugins?.plugins?.["context-key-manager"]?.getNamingProjectionAuthorityV1?.())}
 serial(fn){const p=this.tail.then(fn,fn);this.tail=p.catch(()=>{});return p}
 capture(){const o=this.owner,base=o.app.vault.adapter.getBasePath?.(),dir=o.manifest?.dir;return {base,dir,generation:o.operationalContextSnapshotProviderGeneration,api:o.projectExecutionOverviewPublicApi}}
 assert(c){const n=this.capture();if(this.owner.contextCarrierUnloading||this.owner.goalPeoWriter!==this||Object.keys(c).some(k=>c[k]!==n[k]))throw Error('PEO_WRITER_LEASE_CHANGED')}
 sync(fn){const value=fn();if(value&&typeof value.then==='function'){Promise.resolve(value).catch(()=>{});throw Error('PEO_ASYNC_LEASE')}if(value===false)throw Error('PEO_INVALID_LEASE')}
 location(c){
  const fs=require('node:fs'),path=require('node:path');
  if(!c.base||!path.isAbsolute(c.base)||c.dir!=='.obsidian/plugins/project-execution-overview')throw Error('PEO_WRITER_NAMESPACE');
  const dir=path.join(c.base,c.dir),file=path.join(dir,'data.json');
  const check=()=>{for(let p=dir;;p=path.dirname(p)){const st=fs.lstatSync(p);if(st.isSymbolicLink()||!st.isDirectory())throw Error('PEO_WRITER_LINK');if(path.dirname(p)===p)break}const st=fs.lstatSync(file);if(st.isSymbolicLink()||!st.isFile()||st.size>GoalPeoDeclarationModule.MAX)throw Error('PEO_WRITER_FILE');};check();const root=fs.lstatSync(dir);
  return {fs,path,dir,file,check:()=>{check();const s=fs.lstatSync(dir);if(s.dev!==root.dev||s.ino!==root.ino)throw Error('PEO_WRITER_ROOT_CHANGED')}};
 }
 // First data.json: fsync'd temp then link (fails if the file appeared meanwhile), so it never overwrites.
 async publishFirst(c,after,externalLease){
  const endObserverWrite=__PeoObserverBeginWrite(this.owner);
  try { return await (async()=>{
  const fs=require('node:fs'),path=require('node:path');
  if(!c.base||!path.isAbsolute(c.base)||c.dir!=='.obsidian/plugins/project-execution-overview')throw Error('PEO_WRITER_NAMESPACE');
  const dir=path.join(c.base,c.dir),file=path.join(dir,'data.json');
  const guard=()=>{this.assert(c);if(externalLease)this.sync(externalLease);for(let p=dir;;p=path.dirname(p)){const st=fs.lstatSync(p);if(st.isSymbolicLink()||!st.isDirectory())throw Error('PEO_WRITER_LINK');if(path.dirname(p)===p)break}if(fs.existsSync(file))throw Error('PEO_WRITER_FIRST_FILE_EXISTS')};
  guard();if(Buffer.byteLength(after)>GoalPeoDeclarationModule.MAX)throw Error('PEO_WRITER_FILE');
  const temp=path.join(dir,`.goal-peo-first-${require('node:crypto').randomBytes(12).toString('hex')}.tmp`),fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,after,'utf8');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
  try{guard();fs.linkSync(temp,file)}finally{fs.unlinkSync(temp)}
  this.assert(c);if(fs.readFileSync(file,'utf8')!==after)throw Error('PEO_WRITER_READBACK_UNKNOWN');
  })(); } finally { endObserverWrite(); }
 }
 async publish(c,before,after,externalLease,centerPermit,transaction=null){
  const endObserverWrite=__PeoObserverBeginWrite(this.owner);
  try { return await (async()=>{
  const l=this.location(c),{fs,file,dir,path}=l;
  {const st=fs.lstatSync(file);if(st.nlink>1)for(const n of fs.readdirSync(dir).filter(n=>/^\.goal-peo-first-[a-f0-9]{24}\.tmp$/.test(n))){const t=fs.lstatSync(path.join(dir,n));if(t.isFile()&&t.ino===st.ino&&t.dev===st.dev)fs.unlinkSync(path.join(dir,n))}}
  const guard=()=>{this.assert(c);if(externalLease)this.sync(externalLease);this.centerNaming.guardPublish(before,after,centerPermit);if(transaction){if(!['creation','legacy-rename'].includes(transaction))throw Error('PEO_WRITER_TRANSACTION');const pa=JSON.parse(before),pb=JSON.parse(after);if(!preservedReceipts('creation',pa[PeoCreationModule.FIELD],pb[PeoCreationModule.FIELD])||!preservedReceipts('legacy',pa[GoalPeoDeclarationModule.FIELD],pb[GoalPeoDeclarationModule.FIELD]))throw Error('PEO_TRANSACTION_RECEIPT_LOST')}else{GoalPeoDeclarationModule.guardOrdinaryWrite(before,after);PeoCreationModule.guard(before,after)}l.check();if(fs.readFileSync(file,'utf8')!==before)throw Error('PEO_WRITER_CAS_CHANGED')};guard();
  // Only confirmed transactions keep an exact prior image: a center rename permit (own txId group) or a change of
  // P3 creation / legacy goal-rename receipts. Ordinary saves rely on temp+fsync+CAS+rename. Backups are never deleted;
  // at the cap the oldest of the group move to .goal-peo-archive/ (r39 rotatePeoBackups).
  const receiptsOf=(raw,field)=>JSON.stringify(JSON.parse(raw)[field]??null),centerTx=this.centerNaming.permitTx(centerPermit);
  const group=centerTx?'center':(transaction||[PeoCreationModule.FIELD,GoalPeoDeclarationModule.FIELD].some(f=>receiptsOf(before,f)!==receiptsOf(after,f)))?'other':null;
  const nonce=require('node:crypto').randomBytes(12).toString('hex'),temp=path.join(dir,`.goal-peo-${nonce}.tmp`),backup=path.join(dir,group==='center'?`.goal-peo-center-${centerTx}-${nonce}.before.json`:`.goal-peo-${nonce}.before.json`);
  // Retain exact prior bytes for review; never overwrite an existing backup.
  const write=(p,raw)=>{const fd=fs.openSync(p,'wx',0o600);try{fs.writeFileSync(fd,raw,'utf8');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
  try{if(group){const re=group==='center'?/^\.goal-peo-center-.*\.before\.json$/:/^\.goal-peo-(?!center-|first-).*\.before\.json$/;rotatePeoBackups(fs,path,dir,re,Buffer.byteLength(before));write(backup,before)}write(temp,after);guard();fs.renameSync(temp,file);this.assert(c);if(externalLease)this.sync(externalLease);l.check();if(fs.readFileSync(file,'utf8')!==after)throw Error('PEO_WRITER_READBACK_UNKNOWN')}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
  })(); } finally { endObserverWrite(); }
 }
 async save(value,original){
  const endObserverWrite=__PeoObserverBeginWrite(this.owner);
  try { return await (async()=>{
  const raw=JSON.stringify(value),frozen=GoalPeoDeclarationModule.parse(raw),c=this.capture();this.assert(c);
  return this.serial(async()=>{this.assert(c);const a=this.owner.app.vault.adapter,p=c.dir+'/data.json',exists=await a.exists(p);this.assert(c);const before=exists?await a.read(p):null;this.assert(c);
   const centerCapture=this.centerNaming.guardOrdinary(before,raw);
   const centerManaged=(centerCapture.unconfigured!==true&&centerCapture.s.contexts.some(x=>x.naming.authority==="center"))||Object.hasOwn(frozen,CenterPeoProjectionModule.FIELD)||(before!==null&&Object.hasOwn(JSON.parse(before),CenterPeoProjectionModule.FIELD));
   const field=GoalPeoDeclarationModule.FIELD,managed=Object.hasOwn(frozen,field)||(before!==null&&Object.hasOwn(GoalPeoDeclarationModule.parse(before),field));
   const creationManaged=Object.hasOwn(frozen,PeoCreationModule.FIELD)||(before!==null&&Object.hasOwn(JSON.parse(before),PeoCreationModule.FIELD));
   if(creationManaged){if(before===null)throw Error('PEO_CREATE_FILE_MISSING');PeoCreationModule.guard(before,raw)}
   // All existing-file saves reach the synchronous final guard; no async legacy publication bypass.
   if(before===null){if(centerManaged||managed)throw Error('PEO_MANAGED_FILE_MISSING');await this.publishFirst(c,raw,()=>{this.centerNaming.fresh(centerCapture)});this.assert(c);return}GoalPeoDeclarationModule.guardOrdinaryWrite(before,raw);await this.publish(c,before,raw,()=>{this.centerNaming.fresh(centerCapture)});this.assert(c);
  });
  })(); } finally { endObserverWrite(); }
 }
 // Only internal confirmed coordinator may supply readConfirmedPlan + full lease.
 declarationOwner(readConfirmedPlan,lease){
  if(typeof readConfirmedPlan!=='function'||typeof lease!=='function')throw Error('PEO_COORDINATOR_REQUIRED');
  const c=this.capture(),assert=()=>{this.assert(c);this.sync(lease)};
  return new GoalPeoDeclarationModule.DeclarationOwner({serialize:fn=>this.serial(fn),assertLease:assert,readConfirmedPlan,
   read:async()=>{assert();const l=this.location(c),raw=l.fs.readFileSync(l.file,'utf8');assert();return raw},compareAndSwap:(before,after)=>this.publish(c,before,after,lease,undefined,'legacy-rename')});
 }
}

const GoalProductionPrimaryModule=((require)=>{const module={exports:{}};
"use strict";
// Staging protocol only. No plugin registration. I/O and confirmed intent belong to owners.
const {createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const fail=code=>{throw Object.assign(new Error(code),{code})};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const key=s=>s.trim().toLocaleLowerCase();
const DB_RECEIPTS='managedGoalRenameReceiptsV1', KW_RECEIPTS='managedGoalRenameReceiptsV1';
const TX=/^goal-rename-[a-zA-Z0-9-]{8,80}$/;
function json(raw){
  if(typeof raw!=='string'||Buffer.byteLength(raw)>8*1024*1024)fail('RAW_LIMIT');
  const value=JSON.parse(raw);
  const walk=x=>{if(!x||typeof x!=='object')return;for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))fail('UNSAFE_KEY');walk(x[k])}};
  walk(value);return value;
}
function clone(x){return json(JSON.stringify(x))}
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(plain(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x)}
const equal=(a,b)=>stable(a)===stable(b);
function path(p){if(typeof p!=='string'||!p||p.length>2048||p!==p.trim()||/[\\:\x00-\x1f]/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'))fail('PATH_INVALID');return p}
function label(s){if(typeof s!=='string'||s!==s.trim()||s.length>512||/[\x00-\x1f]/.test(s))fail('LABEL_INVALID');const m=/^([0-9]{3}[a-zA-Z0-9]*)\s*[-－—]\s*(\S.*)$/.exec(s);if(!m)fail('LABEL_INVALID');return m[1].toUpperCase()}
function declaration(comment,replacement){
  if(typeof comment!=='string')fail('DECLARATION_INVALID');
  let inside=false,found=[];const lines=comment.split(/(\r?\n)/);
  for(let i=0;i<lines.length;i+=2){const line=lines[i];if(line.trim()==='---'){inside=!inside;continue}
    if(!inside||!line.trim()||/^\s*(project_name|importance_group)\s*:/i.test(line))continue;
    const match=/^(\s*(?:(?:context_key|operation_context_key)\s*:\s*)?)(.*?)(\s*)$/i.exec(line);
    label(match[2]);found.push(match[2]);if(replacement!==undefined)lines[i]=match[1]+replacement+match[3];
  }
  if(inside||found.length!==1)fail('DECLARATION_INVALID');return {label:found[0],comment:lines.join('')};
}
function receiptList(list,nodeId,source){
  if(!Array.isArray(list)||!list.length||list.length>256)fail('RECEIPT_SCHEMA');
  const seen=new Set();for(const r of list){
    if(!plain(r)||Object.keys(r).sort().join(',')!=='newLabel,nodeId,oldLabel,sourceNotePath,txId,version'||r.version!==1||r.nodeId!==nodeId||r.sourceNotePath!==source||!TX.test(r.txId)||seen.has(r.txId)||label(r.oldLabel)!==label(r.newLabel)||key(r.oldLabel)===key(r.newLabel))fail('RECEIPT_SCHEMA');
    seen.add(r.txId);
  }
  for(let i=1;i<list.length;i++)if(list[i].oldLabel!==list[i-1].newLabel)fail('RECEIPT_CHAIN');
  return list;
}
function keywordIndex(obj){
  if(obj.version!==1||!plain(obj.keywordToNode)||!plain(obj.nodeKeywords)||!plain(obj.keywordMeta))fail('KEYWORD_SCHEMA');
  const reverse=new Map();for(const [id,values] of Object.entries(obj.nodeKeywords)){
    if(!id||!Array.isArray(values))fail('KEYWORD_MAP');for(const v of values){if(typeof v!=='string'||!v.trim()||reverse.has(key(v)))fail('KEYWORD_MAP');reverse.set(key(v),{nodeId:id,keyword:v})}
  }
  if(reverse.size!==Object.keys(obj.keywordToNode).length)fail('KEYWORD_MAP');
  for(const [k,v] of Object.entries(obj.keywordToNode)){const expected=reverse.get(k);if(!plain(v)||!expected||v.nodeId!==expected.nodeId||v.keyword!==expected.keyword)fail('KEYWORD_MAP')}
  for(const [k,m] of Object.entries(obj.keywordMeta)){
    if(!reverse.has(k)||!plain(m)||typeof m.parentKey!=='string'||m.parentKey&&!reverse.has(m.parentKey))fail('KEYWORD_META');
    let cursor=k;const seen=new Set();while(cursor){if(seen.has(cursor))fail('KEYWORD_META');seen.add(cursor);cursor=obj.keywordMeta[cursor]?.parentKey||''}
  }
}
function receipts(kind,obj,source){
  const out=new Map(),txs=new Set();if(!plain(obj))fail('SCHEMA');
  if(kind==='keywords')keywordIndex(obj);
  if(kind==='keywords'&&Object.hasOwn(obj,KW_RECEIPTS)&&!plain(obj[KW_RECEIPTS]))fail('RECEIPT_SCHEMA');
  const candidates=kind==='db'?Object.entries(obj).filter(([,n])=>plain(n)&&Object.hasOwn(n,DB_RECEIPTS)).map(([id,n])=>[id,n[DB_RECEIPTS]]):Object.entries(obj[KW_RECEIPTS]||{});
  for(const [id,raw] of candidates){const list=receiptList(raw,id,source);for(const r of list){if(txs.has(r.txId))fail('RECEIPT_TX_REUSED');txs.add(r.txId)}out.set(id,list);const last=list.at(-1);
    if(kind==='db'){if(obj[id].id!==id||declaration(obj[id].comment).label!==last.newLabel)fail('RECEIPT_BINDING')}
    else {const entry=obj.keywordToNode?.[key(last.newLabel)],values=obj.nodeKeywords?.[id];if(!entry||entry.nodeId!==id||entry.keyword!==last.newLabel||!Array.isArray(values)||values.filter(x=>x===last.newLabel).length!==1)fail('RECEIPT_BINDING');
      const all=Object.values(obj.nodeKeywords).flat();if(all.filter(x=>typeof x==='string'&&key(x)===key(last.newLabel)).length!==1)fail('RECEIPT_BINDING');
      for(const r of list)if(key(r.oldLabel)!==key(last.newLabel)&&(Object.hasOwn(obj.keywordToNode,key(r.oldLabel))||all.some(x=>typeof x==='string'&&key(x)===key(r.oldLabel))))fail('RECEIPT_OLD_ALIAS');
    }
  }
  return out;
}
// Ordinary writers must call this INSIDE their real write queue/CAS, including deletes.
// It intentionally rejects receipt-bearing node deletion and receipt additions.
function guardOrdinaryWrite(kind,beforeRaw,afterRaw,source){
  if(!['db','keywords'].includes(kind))fail('STEP_INVALID');path(source);
  const a=receipts(kind,json(beforeRaw),source),b=receipts(kind,json(afterRaw),source);
  if(!equal([...a].sort(),[...b].sort()))fail('ORDINARY_RECEIPT_CHANGED');return true;
}
function derive(txId,evidence,dbRaw,keywordRaw){
  const e=clone(evidence);if(!TX.test(txId)||e.ok!==true||e.contractVersion!==1||e.domain!=='goal'||e.preparationType!=='mandala-goal-rename-primary-readonly-v1'||e.canCommit!==false||!['active','stopped'].includes(e.trackingStatus))fail('EVIDENCE_INVALID');
  path(e.sourceNotePath);const paths=e.sourcePaths;if(!plain(paths))fail('PATH_INVALID');for(const p of Object.values(paths))path(p);
  if(Object.keys(paths).sort().join(',')!=='db,keywords,weeklyGoals'||new Set([...Object.values(paths),e.sourceNotePath]).size!==4)fail('PATH_ALIAS');
  if(typeof e.nodeId!=='string'||!e.nodeId||e.nodeId==='root'||e.nodeId!==e.nodeId.trim()||e.nodeKey!=='jump:v1:'+['mandala-time-blocks',e.sourceNotePath,'node','mandala',e.nodeId].map(encodeURIComponent).join('|'))fail('IDENTITY_INVALID');
  if(label(e.oldDisplayLabel)!==label(e.newDisplayLabel)||key(e.oldDisplayLabel)===key(e.newDisplayLabel))fail('ADDRESS_OR_NAME_INVALID');
  if(hash(dbRaw)!==e.dbHash||hash(keywordRaw)!==e.keywordHash)fail('RAW_HASH_CHANGED');
  const db=json(dbRaw),kw=json(keywordRaw),node=db[e.nodeId];
  if(!plain(node)||hash(JSON.stringify(node))!==e.nodeHash||declaration(node.comment).label!==e.oldDisplayLabel)fail('NODE_CHANGED');
  const incoming=new Map();for(const [id,n] of Object.entries(db)){
    if(!plain(n)||n.id!==id||!plain(n.children))fail('TOPOLOGY');
    for(const [slot,child] of Object.entries(n.children)){if(child===null||child==='')continue;if(!/^[01235678]$/.test(slot)||typeof child!=='string'||!Object.hasOwn(db,child))fail('TOPOLOGY');const refs=incoming.get(child)||[];refs.push({parentNodeId:id,slotIndex:Number(slot)});incoming.set(child,refs)}
  }
  const ancestry=[],seen=new Set();let cursor=e.nodeId;
  while(cursor!=='root'){if(seen.has(cursor))fail('TOPOLOGY');seen.add(cursor);const refs=incoming.get(cursor)||[];if(refs.length!==1)fail('TOPOLOGY');ancestry.push({nodeId:cursor,...refs[0]});cursor=refs[0].parentNodeId}
  if(!Object.hasOwn(db,'root')||incoming.has('root')||!equal(ancestry,e.ancestry))fail('TOPOLOGY');
  if(kw.version!==1||!plain(kw.nodeKeywords)||!plain(kw.keywordToNode)||!plain(kw.keywordMeta))fail('KEYWORD_SCHEMA');
  const index=new Map();for(const [id,values] of Object.entries(kw.nodeKeywords)){if(!Object.hasOwn(db,id)||!Array.isArray(values))fail('KEYWORD_MAP');for(const v of values){if(typeof v!=='string'||!v.trim()||index.has(key(v)))fail('KEYWORD_MAP');index.set(key(v),{nodeId:id,keyword:v})}}
  if(index.size!==Object.keys(kw.keywordToNode).length)fail('KEYWORD_MAP');for(const [k,v] of Object.entries(kw.keywordToNode)){const x=index.get(k);if(!x||v.nodeId!==x.nodeId||v.keyword!==x.keyword)fail('KEYWORD_MAP')}
  const oldKey=key(e.oldDisplayLabel),newKey=key(e.newDisplayLabel),old=kw.keywordToNode[oldKey];
  if(!old||old.nodeId!==e.nodeId||old.keyword!==e.oldDisplayLabel||Object.hasOwn(kw.keywordToNode,newKey)||Object.hasOwn(kw.keywordMeta,newKey))fail('KEYWORD_CONFLICT');
  const children=[];for(const [k,m] of Object.entries(kw.keywordMeta)){
    if(!Object.hasOwn(kw.keywordToNode,k)||!plain(m)||typeof m.parentKey!=='string'||m.parentKey&&!Object.hasOwn(kw.keywordToNode,m.parentKey))fail('KEYWORD_META');
    let c=k;const seen=new Set();while(c){if(seen.has(c))fail('KEYWORD_META');seen.add(c);c=kw.keywordMeta[c]?.parentKey||''}if(m.parentKey===oldKey)children.push({keywordKey:k,recordHash:hash(JSON.stringify(m))});
  }
  if(!equal(e.keywordImpact,{nodeId:e.nodeId,oldKey,newKey,recordHash:hash(JSON.stringify(old)),ownMetadata:Object.hasOwn(kw.keywordMeta,oldKey),childMetadata:children}))fail('KEYWORD_EVIDENCE');
  const dr=receipts('db',db,e.sourceNotePath),kr=receipts('keywords',kw,e.sourceNotePath);
  if(!equal([...dr].sort(),[...kr].sort()))fail('PREVIOUS_RENAME_INCOMPLETE');
  if((dr.get(e.nodeId)||[]).length>=256)fail('RECEIPT_CAPACITY');
  for(const list of dr.values())if(list.some(r=>r.txId===txId))fail('TX_REUSED');
  const receipt={version:1,txId,nodeId:e.nodeId,sourceNotePath:e.sourceNotePath,oldLabel:e.oldDisplayLabel,newLabel:e.newDisplayLabel};
  node.comment=declaration(node.comment,e.newDisplayLabel).comment;
  node[DB_RECEIPTS]=[...(dr.get(e.nodeId)||[]),receipt];
  kw.nodeKeywords[e.nodeId]=kw.nodeKeywords[e.nodeId].map(v=>v===e.oldDisplayLabel?e.newDisplayLabel:v);
  delete kw.keywordToNode[oldKey];kw.keywordToNode[newKey]={...old,keyword:e.newDisplayLabel};
  if(Object.hasOwn(kw.keywordMeta,oldKey)){kw.keywordMeta[newKey]=kw.keywordMeta[oldKey];delete kw.keywordMeta[oldKey]}
  for(const {keywordKey} of children)kw.keywordMeta[keywordKey].parentKey=newKey;
  kw[KW_RECEIPTS]||={};kw[KW_RECEIPTS][e.nodeId]=clone(node[DB_RECEIPTS]);
  receipts('db',db,e.sourceNotePath);receipts('keywords',kw,e.sourceNotePath);
  const step=(p,b,a)=>({path:p,before:b,after:a,beforeHash:hash(b),afterHash:hash(a)});
  return {version:1,type:'goal-rename-primary-write-plan-v1',txId,evidence:e,steps:{db:step(paths.db,dbRaw,JSON.stringify(db,null,2)),keywords:step(paths.keywords,keywordRaw,JSON.stringify(kw,null,2))}};
}
function validate(plan){const p=clone(plan),rebuilt=derive(p.txId,p.evidence,p.steps?.db?.before,p.steps?.keywords?.before);if(!equal(p,rebuilt))fail('PLAN_TAMPERED');return p}
class GoalRenameWriteOwner {
  // serialize: original owner's shared queue. assertLease: synchronous, checks source,
  // generation, paths AND immutable confirmation token invalidation at publication.
  // compareAndSwap MUST await beforePublish immediately before replacing existing bytes.
  constructor(io){for(const k of ['read','serialize','readConfirmedPlan','assertLease','compareAndSwap'])if(typeof io?.[k]!=='function')fail('IO_CONTRACT');this.io=io}
  async authorized(p){this.io.assertLease(p.evidence,p.txId);const saved=await this.io.readConfirmedPlan(p.txId);this.io.assertLease(p.evidence,p.txId);if(saved?.status!=='confirmed'||!equal(saved.plan,p))fail('CONFIRMED_PLAN_REQUIRED')}
  async state(p,kind){const s=p.steps[kind];let raw;try{raw=await this.io.read(s.path)}catch(_){return {state:'unknown',reason:'READ_UNAVAILABLE'}}this.io.assertLease(p.evidence,p.txId);return {state:raw===s.after?'verified':raw===s.before?'pending':'conflict',reason:raw===null?'FILE_MISSING':''}}
  async inspect(plan){const p=validate(plan);return this.io.serialize(async()=>{await this.authorized(p);const db=await this.state(p,'db'),keywords=await this.state(p,'keywords');await this.authorized(p);return {db,keywords,complete:db.state==='verified'&&keywords.state==='verified'}})}
  async commit(plan,kind){if(!['db','keywords'].includes(kind))fail('STEP_INVALID');const p=validate(plan);return this.io.serialize(async()=>{
    await this.authorized(p);const current=await this.state(p,kind);if(current.state!=='pending'){
      if(kind==='keywords'&&current.state==='verified'&&(await this.state(p,'db')).state!=='verified')return {state:'conflict',reason:'OTHER_STEP_CHANGED'};
      await this.authorized(p);return current
    }
    const peer=kind==='db'?'keywords':'db',expected=kind==='db'?'pending':'verified';
    if((await this.state(p,peer)).state!==expected)return {state:'conflict',reason:'OTHER_STEP_CHANGED'};
    const s=p.steps[kind];let attempted=false;
    try {
      await this.authorized(p);this.io.assertLease(p.evidence,p.txId);attempted=true;
      await this.io.compareAndSwap(s.path,s.before,s.after,async()=>{
        await this.authorized(p);
        if((await this.state(p,peer)).state!==expected)fail('OTHER_STEP_CHANGED');
        this.io.assertLease(p.evidence,p.txId);
      });
      await this.authorized(p);const after=await this.state(p,kind);await this.authorized(p);
      return after.state==='verified'?after:{state:'unknown',reason:'READBACK_CHANGED'};
    } catch(e){if(!attempted)throw e;return {state:'unknown',reason:e.code||'PUBLICATION_UNCERTAIN'}}
  })}
}
module.exports={derive,validate,GoalRenameWriteOwner,guardOrdinaryWrite,hash,DB_RECEIPTS,KW_RECEIPTS};

return module.exports;})(require);
const GoalFullPlanModule=((require)=>{const module={exports:{}};
'use strict';
const primary=require('./goal-rename-write-owner.cjs'),peo=require('./goal-peo-declaration-owner.cjs');
const STEPS=['primary','declaration','workspace','gtd','collection'],IDS=['workspace-mount','gtd-task-manager','collection-card-view'];
const LIMIT=32*1024*1024,fail=c=>{throw Object.assign(new Error(c),{code:c})},plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function shape(x,keys){if(!plain(x)||Object.keys(x).sort().join(',')!==keys.slice().sort().join(','))fail('FULL_SCHEMA')}
function text(v){if(typeof v!=='string'||v!==v.trim()||!v||v.length>4096||/[\x00-\x1f]/.test(v))fail('FULL_TEXT');return v}
function relative(v){text(v);if(/[\\:]/.test(v)||v.length>2048||v.split('/').some(x=>!x||x==='.'||x==='..'))fail('FULL_PATH');return v}
function clone(input){
 const stack=[[input,0]],seen=new WeakSet();let count=0,bytes=0;
 while(stack.length){const [v,depth]=stack.pop();if(++count>300000||depth>64)fail('FULL_LIMIT');
  if(v===null||typeof v==='boolean')continue;
  if(typeof v==='string'){bytes+=Buffer.byteLength(v);if(bytes>LIMIT)fail('FULL_LIMIT');continue}
  if(typeof v==='number'){if(!Number.isFinite(v))fail('FULL_NON_JSON');continue}
  if(typeof v!=='object')fail('FULL_NON_JSON');
  if(seen.has(v))fail('FULL_NON_JSON');seen.add(v);
  const array=Array.isArray(v),proto=Object.getPrototypeOf(v);if(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null)fail('FULL_NON_JSON');
  const keys=Reflect.ownKeys(v);if(array&&(v.length>300000||keys.length!==v.length+1))fail('FULL_NON_JSON');
  for(const k of keys){if(array&&k==='length')continue;if(typeof k!=='string'||['__proto__','prototype','constructor','toJSON'].includes(k))fail('FULL_UNSAFE');
   if(array&&(!/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=v.length))fail('FULL_NON_JSON');
   const d=Object.getOwnPropertyDescriptor(v,k);if(!d.enumerable||!Object.hasOwn(d,'value'))fail('FULL_NON_JSON');bytes+=Buffer.byteLength(k);if(bytes>LIMIT)fail('FULL_LIMIT');stack.push([d.value,depth+1]);
  }
 }
 const raw=JSON.stringify(input);if(!raw||Buffer.byteLength(raw)>LIMIT)fail('FULL_LIMIT');return JSON.parse(raw);
}
function validate(input){
 const p=clone(input);shape(p,['version','type','txId','nodeKey','sourceNotePath','oldLabel','newLabel','primary','declaration','identity','consumers']);
 if(p.version!==1||p.type!=='goal-full-rename-v1')fail('FULL_TYPE');p.primary=primary.validate(p.primary);p.declaration=peo.validate(p.declaration);
 const e=p.primary.evidence,d=p.declaration;
 if(p.txId!==p.primary.txId||p.txId!==d.txId||p.nodeKey!==e.nodeKey||p.nodeKey!==d.nodeKey||p.sourceNotePath!==e.sourceNotePath||p.sourceNotePath!==d.sourceNotePath||p.oldLabel!==e.oldDisplayLabel||p.oldLabel!==d.oldLabel||p.newLabel!==e.newDisplayLabel||p.newLabel!==d.newLabel)fail('FULL_CROSS_PLAN');
 const i=p.identity;shape(i,['version','policy','primaryNodeKey','sourceNotePath','itemId','declaration','carrier','providerGeneration','revision','evidenceProviders']);
 if(i.version!==1||i.policy!=='goal-exact-carrier-and-explicit-binding-v1'||i.primaryNodeKey!==p.nodeKey||i.sourceNotePath!==p.sourceNotePath||i.itemId!==e.nodeId)fail('FULL_IDENTITY');
 const dec=i.declaration;shape(dec,['contextKeyId','declarationEvidenceId','address','canonicalLabel','displayLabel','color','icon','source','sourceMode','sourceGroupId','sourceGroupTitle','primaryNodeKey','archivedByAddress']);if(dec.primaryNodeKey!==p.nodeKey||dec.sourceGroupId!==p.nodeKey||dec.displayLabel!==p.oldLabel||dec.sourceMode!=='mandala'||dec.source!=='project-execution-overview'||dec.archivedByAddress!==false)fail('FULL_DECLARATION_IDENTITY');
 for(const k of ['canonicalLabel','color','icon','sourceGroupTitle'])if(typeof dec[k]!=='string'||dec[k].length>4096)fail('FULL_DECLARATION_IDENTITY');
 for(const k of ['contextKeyId','declarationEvidenceId','address'])text(dec[k]);if(dec.address!==/^([0-9]{3}[a-zA-Z0-9]*)/.exec(p.oldLabel)?.[1].toUpperCase())fail('FULL_ADDRESS');
 const c=i.carrier;shape(c,['nodeKey','projectId','sourceNotePath','tagId','relationId','relationType']);for(const k of Object.keys(c))text(c[k]);relative(c.sourceNotePath);
 if(c.relationType!=='承载'||c.nodeKey!==`jump:v1:gtd|${encodeURIComponent(c.sourceNotePath)}|note|${encodeURIComponent(c.sourceNotePath)}|${encodeURIComponent(c.projectId)}`)fail('FULL_CARRIER');
 text(i.providerGeneration);text(i.revision);shape(i.evidenceProviders,['eva','gtd']);for(const v of Object.values(i.evidenceProviders)){shape(v,['providerGeneration','revision']);text(v.providerGeneration);text(v.revision)}
 if(!Array.isArray(p.consumers)||p.consumers.length!==3)fail('FULL_CONSUMERS');
 const files=[e.sourcePaths.db,e.sourcePaths.keywords,'.obsidian/plugins/project-execution-overview/data.json'];
 for(let j=0;j<3;j++){
  const v=p.consumers[j];shape(v,['version','pluginId','scope','newDisplayLabel','targets','search']);shape(v.scope,['sourceNotePath','dataPath','keywordPath']);shape(v.search,['oldLabels','repair']);
  if(v.version!==2||v.pluginId!==IDS[j]||v.newDisplayLabel!==p.newLabel||v.search.repair!==false||!equal(v.search.oldLabels,[p.oldLabel])||!Array.isArray(v.targets)||v.targets.length>1)fail('FULL_CONSUMER_PLAN');
  Object.values(v.scope).forEach(relative);files.push(v.scope.dataPath,v.scope.keywordPath);
  for(const t of v.targets){shape(t,['carrierId','oldLabels','recordHash','storageKey']);text(t.carrierId);if(!equal(t.oldLabels,[p.oldLabel])||t.storageKey!==p.oldLabel.toLocaleLowerCase()||typeof t.recordHash!=='string'||!/^[a-f0-9]{64}$/.test(t.recordHash))fail('FULL_CONSUMER_TARGET')}
  if(j===1&&(v.targets.length!==1||v.targets[0].carrierId!==c.tagId||v.scope.sourceNotePath!==c.sourceNotePath))fail('FULL_GTD_BINDING');
 }
 files.forEach(relative);if(new Set(files.map(x=>x.toLowerCase())).size!==files.length)fail('FULL_PATH_COLLISION');return p;
}
module.exports={validate,clone,STEPS,LIMIT,hash:primary.hash};

return module.exports;})(name=>name==='./goal-rename-write-owner.cjs'?GoalProductionPrimaryModule:name==='./goal-peo-declaration-owner.cjs'?GoalPeoDeclarationModule:require(name));
const GoalFullJournalModule=((require)=>{const module={exports:{}};
"use strict";
const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {validate,hash,STEPS,LIMIT}=require('./goal-full-rename-plan.cjs');
const MAX_JOBS=128,MAX_EVENTS=512,TX=/^goal-rename-[a-zA-Z0-9-]{8,80}$/;
const queues=globalThis[Symbol.for('goal-full-rename.journal.queues.v1')] ||= new Map();
const copy=x=>JSON.parse(JSON.stringify(x)),fail=c=>{throw Object.assign(new Error(c),{code:c})};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function shape(x,keys){if(!plain(x)||Object.keys(x).sort().join(',')!==keys.slice().sort().join(','))fail('JOURNAL_SCHEMA')}
function noLinks(p){let current=path.resolve(p);while(true){const s=sync.lstatSync(current);if(s.isSymbolicLink())fail('JOURNAL_SYMLINK');const next=path.dirname(current);if(next===current)break;current=next}}
function initial(){return {status:'confirmed',reason:'',...Object.fromEntries(STEPS.map(k=>[k,{state:'pending',attempts:0,everVerified:false}]))}}
function progress(value,previous){
 shape(value,['status','reason',...STEPS]);if(!['confirmed','running','paused','review','complete'].includes(value.status)||typeof value.reason!=='string'||value.reason.length>512)fail('PROGRESS_SCHEMA');
 for(const kind of STEPS){const s=value[kind],p=previous[kind];shape(s,['state','attempts','everVerified']);if(!['pending','attempting','verified','unknown','conflict'].includes(s.state)||!Number.isSafeInteger(s.attempts)||s.attempts<0||s.attempts<p.attempts||s.attempts>p.attempts+1||typeof s.everVerified!=='boolean'||p.everVerified&&!s.everVerified||s.state==='verified'&&!s.everVerified||!p.everVerified&&s.everVerified&&s.state!=='verified')fail('PROGRESS_SCHEMA');
  if(s.attempts>p.attempts&&(s.state!=='attempting'||value.status!=='running'||p.everVerified))fail('PROGRESS_ATTEMPT');
  if(s.state==='attempting'&&(value.status!=='running'||s.attempts!==p.attempts+1))fail('PROGRESS_ATTEMPT');
  if(s.everVerified&&s.state==='pending'||value.status==='confirmed')fail('PROGRESS_REGRESSION');
 }
 for(let i=1;i<STEPS.length;i++)if(value[STEPS[i]].everVerified&&!value[STEPS[i-1]].everVerified)fail('PROGRESS_ORDER');
 if(value.status==='complete'&&STEPS.some(k=>value[k].state!=='verified'))fail('PROGRESS_ORDER');return value;
}
// Shared across runner instances; a timed-out request retains exclusion until it settles.
const requests=globalThis[Symbol.for('goal-full-rename.requests.v1')] ||= new Map();
class GoalFullRenameRunner {
 constructor({journal,owners,assertLease,verifyIdentity,timeoutMs=15000}){
  if(!(journal instanceof GoalFullRenameJournal)||typeof owners!=='function'||typeof assertLease!=='function'||typeof verifyIdentity!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)fail('FULL_RUNNER_CONTRACT');
  Object.assign(this,{journal,owners,assertLease,verifyIdentity,timeoutMs,closed:false});
 }
 close(){this.closed=true}
 async resume(id){return this.journal.serial(async token=>{
  const key=process.platform==='win32'?this.journal.directory.toLowerCase():this.journal.directory;if(requests.has(key))fail('FULL_REQUEST_STILL_RUNNING');
  let revoked=false,job=await this.journal.read(id),p=copy(job.progress);const intentHash=job.intentHash,plan=copy(job.plan);
  for(const k of STEPS)if(p[k].state==='attempting')p[k].state='unknown';
  const live=()=>{if(revoked||this.closed)fail('FULL_RUN_REVOKED');this.journal.assertIntent(id,intentHash);const r=this.assertLease();if(r&&typeof r.then==='function'){Promise.resolve(r).catch(()=>{});fail('FULL_ASYNC_LEASE')}if(r===false)fail('FULL_LEASE')};
  const bounded=async fn=>{
   live();let timer;const request=Promise.resolve().then(()=>{live();return fn()});requests.set(key,request);
   const clear=()=>{if(requests.get(key)===request)requests.delete(key)};request.then(clear,clear);
   try{const result=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{revoked=true;reject(Object.assign(Error('FULL_TIMEOUT'),{code:'FULL_TIMEOUT'}))},this.timeoutMs)})]);live();return result}finally{clearTimeout(timer)}
  };
  const readConfirmedPlan=async tx=>{live();if(tx!==id)fail('FULL_TX_CHANGED');const current=await this.journal.read(tx);live();if(current.intentHash!==intentHash)fail('FULL_INTENT_CHANGED');return copy(current.plan)};
  const ownerMap=this.owners(copy(plan),{assertLease:live,readConfirmedPlan});shape(ownerMap,STEPS);
  for(const k of STEPS)if(typeof ownerMap[k]?.inspect!=='function'||typeof ownerMap[k]?.commit!=='function')fail('FULL_OWNER_CAPABILITY');
  const save=async()=>{job=await this.journal._append(job,p,token,p.status==='complete'?live:undefined);return job};
  const pause=async(reason,review=false)=>{p.status=review?'review':'paused';p.reason=String(reason).slice(0,512);return save()};
  const inspect=async k=>{const r=await bounded(()=>ownerMap[k].inspect());if(!r||!['pending','verified','conflict','unknown'].includes(r.state))fail('FULL_INSPECT_SCHEMA');return r};
  const identity=async()=>{if(await bounded(()=>this.verifyIdentity(copy(plan),live))!==true)fail('FULL_IDENTITY_CHANGED')};
  try{await identity()}catch(e){return pause(e.code||'FULL_IDENTITY_UNAVAILABLE')}
  for(const k of STEPS){
   let s;try{s=await inspect(k)}catch(e){p[k].state='unknown';return pause(e.code||'FULL_INSPECT_UNAVAILABLE')}
   if(s.state==='verified'){p[k].state='verified';p[k].everVerified=true;p.status='running';p.reason='';await save();continue}
   if(p[k].everVerified||s.state==='conflict'){p[k].state='conflict';return pause('FULL_VERIFIED_DRIFT_OR_CONFLICT',true)}
   if(s.state!=='pending'){p[k].state='unknown';return pause('FULL_INSPECT_UNAVAILABLE')}
   try{await identity()}catch(e){p[k].state='unknown';return pause(e.code||'FULL_IDENTITY_UNAVAILABLE')}
   p.status='running';p.reason='';p[k].state='attempting';p[k].attempts++;await save();
   let error;try{await bounded(()=>ownerMap[k].commit())}catch(e){error=e}
   if(revoked){p[k].state='unknown';return pause(error?.code||'FULL_RUN_REVOKED')}
   try{s=await inspect(k)}catch(e){p[k].state='unknown';return pause(e.code||'FULL_INSPECT_UNAVAILABLE')}
   if(s.state!=='verified'){p[k].state=s.state==='conflict'?'conflict':'unknown';return pause(error?.code||'FULL_COMMIT_UNVERIFIED',s.state==='conflict')}
   p[k].state='verified';p[k].everVerified=true;await save();
  }
  try{await identity();for(const k of STEPS){const s=await inspect(k);if(s.state!=='verified'){p[k].state='conflict';return pause('FULL_FINAL_DRIFT',true)}}live()}catch(e){return pause(e.code||'FULL_FINAL_UNAVAILABLE')}
  p.status='complete';p.reason='';await save();live();return job;
 })}
}
class GoalFullRenameJournal {
 #token;
 assertIntent(id,expected){const dir=this.jobPath(id);noLinks(dir);const root=sync.lstatSync(this.directory);if(root.dev!==this.identity[0]||root.ino!==this.identity[1])fail('JOURNAL_DIRECTORY_CHANGED');const file=path.join(dir,'intent.json'),st=sync.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>LIMIT)fail('JOURNAL_FILE');if(hash(sync.readFileSync(file,'utf8'))!==expected)fail('FULL_INTENT_CHANGED')}
 // Directory must already exist. Opening/reading never creates a job or replays it.
 constructor(directory,{fault=async()=>{}}={}){
  if(!path.isAbsolute(directory))fail('JOURNAL_ABSOLUTE_PATH');noLinks(directory);this.directory=sync.realpathSync.native(directory);const s=sync.lstatSync(this.directory);if(!s.isDirectory())fail('JOURNAL_DIRECTORY');this.identity=[s.dev,s.ino];this.fault=fault;
 }
 async guard(){noLinks(this.directory);const s=await fs.lstat(this.directory);if(!s.isDirectory()||s.isSymbolicLink()||s.dev!==this.identity[0]||s.ino!==this.identity[1])fail('JOURNAL_DIRECTORY_CHANGED')}
 serial(fn){const k=process.platform==='win32'?this.directory.toLowerCase():this.directory,prior=queues.get(k)||Promise.resolve(),run=async()=>{const token=Symbol('journal-lock');this.#token=token;try{return await fn(token)}finally{this.#token=undefined}},job=prior.then(run,run),tail=job.catch(()=>{});queues.set(k,tail);tail.finally(()=>{if(queues.get(k)===tail)queues.delete(k)});return job}
 jobPath(id){if(!TX.test(id))fail('JOURNAL_ID');return path.join(this.directory,id)}
 async jobGuard(id){await this.guard();const p=this.jobPath(id);noLinks(p);const s=await fs.lstat(p);if(!s.isDirectory()||s.isSymbolicLink())fail('JOURNAL_JOB_DIRECTORY');return p}
 async raw(id,name){const dir=await this.jobGuard(id),file=path.join(dir,name),s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink()||s.size>LIMIT)fail('JOURNAL_FILE');const raw=await fs.readFile(file,'utf8');await this.jobGuard(id);if(Buffer.byteLength(raw)>LIMIT)fail('JOURNAL_LIMIT');return raw}
 async put(id,name,raw,beforePublish=()=>{}){if(Buffer.byteLength(raw)>LIMIT)fail('JOURNAL_LIMIT');const dir=await this.jobGuard(id),file=path.join(dir,name),tmp=path.join(dir,'.pending-'+randomUUID());await this.fault('before-write',name);const h=await fs.open(tmp,'wx');try{await h.writeFile(raw,'utf8');await h.sync()}finally{await h.close()}await this.jobGuard(id);await this.fault('before-publish',name);try{beforePublish()}catch(e){await fs.unlink(tmp);throw e}await fs.link(tmp,file);await fs.unlink(tmp);if(await this.raw(id,name)!==raw)fail('JOURNAL_READBACK');await this.fault('after-publish',name)}
 async read(id){
  const dir=await this.jobGuard(id),names=(await fs.readdir(dir)).sort();if(!names.includes('intent.json')||names.length>MAX_EVENTS+1)fail('JOURNAL_INCOMPLETE');
  const raw=await this.raw(id,'intent.json'),intent=JSON.parse(raw);shape(intent,['version','namespace','status','plan']);if(intent.version!==1||intent.namespace!==this.directory||intent.status!=='confirmed'||intent.plan.txId!==id)fail('JOURNAL_IDENTITY');const plan=validate(intent.plan),intentHash=hash(raw);let head=intentHash,seq=0,p=initial();
  for(const name of names.filter(n=>n!=='intent.json')){seq++;if(name!==String(seq).padStart(6,'0')+'.json')fail('JOURNAL_SEQUENCE');const rawEvent=await this.raw(id,name),ev=JSON.parse(rawEvent);shape(ev,['version','txId','seq','intentHash','previousHash','progress']);if(ev.version!==1||ev.txId!==id||ev.seq!==seq||ev.intentHash!==intentHash||ev.previousHash!==head)fail('JOURNAL_CHAIN');p=progress(ev.progress,p);head=hash(rawEvent)}
  return {plan,progress:p,seq,head,intentHash};
 }
 async list(){await this.guard();const names=await fs.readdir(this.directory);if(names.length>MAX_JOBS)fail('JOURNAL_JOB_LIMIT');const out=[];for(const n of names.sort())out.push(await this.read(n));return out}
 async confirm(plan,{fresh,assertLease}={}){const p=validate(plan);if(typeof fresh!=="function"||typeof assertLease!=="function")fail("FULL_CONFIRM_CAPABILITY");const live=()=>{const r=assertLease();if(r&&typeof r.then==="function"){Promise.resolve(r).catch(()=>{});fail("FULL_ASYNC_LEASE")}if(r===false)fail("FULL_LEASE")};return this.serial(async()=>{live();await this.guard();const jobs=await this.list(),prior=jobs.find(j=>j.plan.txId===p.txId);if(prior){if(JSON.stringify(prior.plan)!==JSON.stringify(p))fail('JOURNAL_TX_CHANGED');live();return prior}live();if(jobs.length>=MAX_JOBS)fail('JOURNAL_JOB_LIMIT');if(jobs.some(j=>j.plan.nodeKey===p.nodeKey&&j.progress.status!=='complete'))fail('JOURNAL_EXISTING_UNFINISHED');if(JSON.stringify(validate(await fresh(copy(p))))!==JSON.stringify(p))fail("FULL_CONFIRM_CHANGED");live();await fs.mkdir(this.jobPath(p.txId));await this.put(p.txId,'intent.json',JSON.stringify({version:1,namespace:this.directory,status:'confirmed',plan:p}),live);live();const confirmed=await this.read(p.txId);live();return confirmed})}
 // Internal helpers are used only while the directory queue is held by resume().
 async _append(expected,next,token,beforePublish){if(!token||token!==this.#token)fail('JOURNAL_LOCK_REQUIRED');const actual=await this.read(expected.plan.txId);if(actual.head!==expected.head||actual.seq!==expected.seq||actual.intentHash!==expected.intentHash)fail('JOURNAL_CHANGED');if(actual.seq>=MAX_EVENTS)fail('JOURNAL_EVENT_LIMIT');const checked=progress(copy(next),actual.progress),seq=actual.seq+1;await this.put(actual.plan.txId,String(seq).padStart(6,'0')+'.json',JSON.stringify({version:1,txId:actual.plan.txId,seq,intentHash:actual.intentHash,previousHash:actual.head,progress:checked}),beforePublish);return this.read(actual.plan.txId)}
}

module.exports={GoalFullRenameJournal,GoalFullRenameRunner};

return module.exports;})(name=>name==='./goal-full-rename-plan.cjs'?GoalFullPlanModule:require(name));
// Frozen identity validation also works between the primary and consumer commits.
// BEGIN PEO_SAVED_DECLARATIONS_V1
const __PeoSavedDeclarationsV1 = async (owner, domain, keys) => {
  const saved = await __OwnerSavedObservationV1.read(owner, { providerId: "project-execution-overview",
    apiKey: "projectExecutionOverviewPublicApi", unloadKey: "contextCarrierUnloading",
    max: GoalPeoDeclarationModule.MAX, parse: GoalPeoDeclarationModule.parse });
  const root = saved.data;
  const plain = value => !!value && typeof value === "object" && !Array.isArray(value);
  const comments = root.commentsByNodeKey === undefined ? {} : root.commentsByNodeKey;
  if (!plain(comments) || Object.values(comments).some(value => typeof value !== "string")) throw Error("saved-comment-schema");
  const records = root.primaryKeyLifecycleById === undefined ? {} : root.primaryKeyLifecycleById;
  if (!plain(records)) throw Error("saved-lifecycle-schema");
  const lifecycle = new Map();
  for (const entry of Object.values(records)) {
    if (!plain(entry) || typeof entry.domain !== "string" || typeof entry.primaryNodeKey !== "string"
        || !entry.primaryNodeKey.trim() || (entry.status !== undefined && typeof entry.status !== "string")) throw Error("saved-lifecycle-record");
    const normalizedDomain = normalizePrimaryKeyLifecycleDomain(entry.domain);
    const key = buildPrimaryKeyLifecycleId(normalizedDomain, entry.primaryNodeKey);
    if (!normalizedDomain || !key || lifecycle.has(key)) throw Error("saved-lifecycle-identity");
    lifecycle.set(key, entry.status === "killed");
  }
  const observations = new Map(keys.map(key => [key, { comment: Object.hasOwn(comments, key) ? text(comments[key]) : "",
    killed: lifecycle.get(buildPrimaryKeyLifecycleId(domain, key)) === true }]));
  saved.guard();
  return { observations, current: saved.current, evidence: saved.evidence, ownerPath: saved.ownerPath,
    lifecycleRevision: Number.isFinite(root.primaryKeyLifecycleRevision) ? root.primaryKeyLifecycleRevision : 0 };
};
// END PEO_SAVED_DECLARATIONS_V1


class GoalFrozenIdentityReader {
  constructor(owner, lease) {
    this.owner=owner;this.lease=lease;
    this.eva=owner.getEva();this.gtd=owner.getGtdTaskManagerApi();
    this.evaFn=this.eva?.getOutgoingRelationBatchSnapshot;
    this.gtdFn=this.gtd?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot;
    this.guard();
  }
  fail(){throw Object.assign(Error('GOAL_FROZEN_IDENTITY_UNAVAILABLE'),{code:'GOAL_FROZEN_IDENTITY_UNAVAILABLE'})}
  guard(){
    this.lease();
    if(typeof this.evaFn!=='function'||typeof this.gtdFn!=='function'||this.owner.getEva()!==this.eva||this.owner.getGtdTaskManagerApi()!==this.gtd
      ||this.eva.getOutgoingRelationBatchSnapshot!==this.evaFn||this.gtd.getContextCapsuleTopLevelProjectCarrierBatchSnapshot!==this.gtdFn)this.fail();
  }
  outer(s,id,type,count){
    const nonempty=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<16384;
    if(!s||s.ok!==true||s.complete!==true||s.decisionComplete!==true||s.contractVersion!==1||s.providerId!==id||s.snapshotType!==type
      ||!nonempty(s.providerGeneration)||!nonempty(s.revision)||!Number.isFinite(Date.parse(s.generatedAt))||s.limit!==500||s.hasMore!==false||s.truncated!==false
      ||!Array.isArray(s.diagnostics)||s.diagnostics.length||s.requestCount!==count||s.count!==count||s.returnedCount!==count||!Array.isArray(s.results)||s.results.length!==count)this.fail();
  }
  async read(plan){
    const savedObservationValid = snapshot => {
    const observation = snapshot?.inputObservation;
    const source = snapshot?.sourceNotePath;
    if (typeof source !== "string" || !source || source.trim() !== source
        || snapshot.readPurpose !== "operation-check" || snapshot.writeAuthorization !== false
        || !observation || observation.contractVersion !== 1 || observation.purpose !== "saved-owner-files"
        || observation.persisted !== true || observation.consistency !== "single-pass-non-atomic"
        || observation.atomic !== false || observation.sourceNotePath !== source || observation.readCount !== 3
        || !Array.isArray(observation.files) || observation.files.length !== 3
        || typeof observation.rawRevision !== "string" || !/^[a-f0-9]{64}$/.test(observation.rawRevision)) return false;
    const index = source.lastIndexOf("/");
    const folder = index < 0 ? "" : source.slice(0, index);
    const expected = [["database", "GTD_Database.json"], ["tags", "GTD_Tags.json"], ["keywords", "GTD_TagKeywords.json"]];
    for (let i = 0; i < expected.length; i++) {
        const file = observation.files[i], [role, name] = expected[i];
        if (!file || file.role !== role || file.path !== folder + "/" + name
            || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)) return false;
    }
    return observation.rawRevision === createHash("sha256")
        .update(JSON.stringify([source, observation.files.map(file => [file.role, file.path, file.sha256])]), "utf8").digest("hex");
};
    this.guard();const c=plan.identity.carrier,labels=[plan.oldLabel,plan.newLabel];
    const e=await this.evaFn.call(this.eva,{sourceNodeKeys:[plan.nodeKey],relationType:'承载',source:'project-execution-overview-effective-goal',readPurpose:'operation-check'});this.guard();
    const g=await this.gtdFn.call(this.gtd,{contextKeys:labels,source:'project-execution-overview-effective-goal',readPurpose:'operation-check'});this.guard();
    if(e?.ok===true&&!__OwnerSavedObservationV1.validEvidence(e,'eva-cross-view-relations'))this.fail();
    if(g?.ok===true&&!savedObservationValid(g))this.fail();
    this.outer(e,'eva-cross-view-relations','eva-outgoing-relation-batch-v1',1);
    this.outer(g,'gtd-task-manager','gtd-context-capsule-top-level-project-carrier-batch-v1',2);
    if(g.sourceNotePath!==c.sourceNotePath)this.fail();
    const b=e.results[0],relation=x=>x&&x.id===c.relationId&&x.sourceNodeKey===plan.nodeKey&&x.targetNodeKey===c.nodeKey&&x.relationType==='承载';
    if(b?.ok!==true||b.complete!==true||b.decisionComplete!==true||b.requestIndex!==0||b.sourceNodeKey!==plan.nodeKey||b.relationType!=='承载'||b.totalCount!==1
      ||b.diagnosticSampleTruncated!==false||!Array.isArray(b.diagnosticSample)||b.diagnosticSample.length!==1||!relation(b.uniqueItem)||!relation(b.diagnosticSample[0]))this.fail();
    let hits=0;
    for(let i=0;i<2;i++){
      const t=g.results[i];
      if(t?.ok!==true||t.complete!==true||t.decisionComplete!==true||t.requestIndex!==i||t.contextKey!==labels[i]||t.normalizedKey!==labels[i].toLocaleLowerCase()
        ||!Array.isArray(t.diagnosticSample)||!Array.isArray(t.diagnosticTagIdSample)||t.diagnosticSampleTruncated!==false||t.diagnosticTagIdSampleTruncated!==false)this.fail();
      if(t.matchedTagCount===0){
        if(t.totalCount!==0||t.topLevelProjectCount!==0||t.uniqueItem!==null||t.uniqueTagId!==''||t.diagnosticSample.length||t.diagnosticTagIdSample.length)this.fail();
      }else{
        const item=x=>x&&x.id===c.projectId&&x.nodeKey===c.nodeKey&&x.tagId===c.tagId&&x.type==='project'&&x.topLevel===true&&x.parentId==='';
        if(t.matchedTagCount!==1||t.totalCount!==1||t.topLevelProjectCount!==1||t.uniqueTagId!==c.tagId||t.diagnosticTagIdSample.length!==1||t.diagnosticTagIdSample[0]!==c.tagId
          ||t.diagnosticSample.length!==1||!item(t.uniqueItem)||!item(t.diagnosticSample[0]))this.fail();
        hits++;
      }
    }
    if(hits!==1)this.fail();this.guard();return true;
  }
}

class GoalProductionCoordinator {
  constructor(owner){
    this.owner=owner;this.api=owner.projectExecutionOverviewPublicApi;this.generation=owner.operationalContextSnapshotProviderGeneration;this.previews=new Map();this.busy=false;
    if(!owner.goalPeoWriter)owner.goalPeoWriter=new GoalPeoWriter(owner);
  }
  copy(x){return JSON.parse(JSON.stringify(x))}
  fail(code){throw Object.assign(Error(code),{code})}
  // Center-owned goal names are renamed only in the management center; this old entry must refuse them before any
  // preview, journal record or owner write (C2 native fix, same rule as context-key-rename-manager.centerOwner).
  centerOwned(ref){this.guard();return this.owner.getContextKeyRenameManager().centerOwner(ref.nodeKey)}
  refuseCenter(ref){if(this.centerOwned(ref))this.fail('GOAL_CENTER_MANAGED')}
  // Exact center row for opening the center's own naming window; null when not center-owned.
  centerRow(ref){if(!this.centerOwned(ref))return null;const c=this.owner.goalPeoWriter.centerNaming.capture();const x=c.unconfigured?null:c.s.contexts.find(x=>x.subjects[0].primaryNodeKey===ref.nodeKey);if(!x)return null;const s=x.subjects[0];return {domain:s.domain,ownerSourceScope:s.sourceScope,nodeKey:s.primaryNodeKey,label:x.canonicalLabel}}
  async auditCall(call){let timer;try{return await Promise.race([Promise.resolve().then(call),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('AUDIT_TIMEOUT')),1000)})])}finally{clearTimeout(timer)}}
  guard(){const o=this.owner;if(o.contextCarrierUnloading||o.goalProductionCoordinator!==this||o.projectExecutionOverviewPublicApi!==this.api||window.__projectExecutionOverviewPluginApi!==this.api||o.operationalContextSnapshotProviderGeneration!==this.generation)this.fail('GOAL_COORDINATOR_CLOSED')}
  ref(input){
    this.guard();const nodeKey=input?.nodeKey,sourceNotePath=input?.sourceNotePath;
    const parsed=parseJumpNodeKey(nodeKey);
    if(parsed?.viewType!=='mandala-time-blocks'||parsed.scopeType!=='node'||parsed.scopeId!=='mandala'||parsed.notePath!==sourceNotePath
      ||nodeKey!=='jump:v1:mandala-time-blocks|'+encodeURIComponent(sourceNotePath)+'|node|mandala|'+encodeURIComponent(parsed.itemId))this.fail('GOAL_SUBJECT_INVALID');
    return {nodeKey,sourceNotePath};
  }
  capture(ref){
    this.guard();const o=this.owner,m=o.app.plugins?.plugins?.['mandala-time-blocks'],api=window.__mandalaTimeBlocksPluginApi,bridge=m?.getGoalRenameWriteBridge?.();
    if(!m||!api||!bridge||typeof bridge.prepare!=='function'||typeof bridge.confirm!=='function'||typeof bridge.inspect!=='function'||typeof bridge.resume!=='function')this.fail('GOAL_PRIMARY_UNAVAILABLE');
    const paths=JSON.stringify(m.getPaths()),methods=['prepare','confirm','inspect','resume'].map(k=>bridge[k]),service=m.goalContextKeyManagement;
    const eva=o.getEva(),gtd=o.getGtdTaskManagerApi(),evaFn=eva?.getOutgoingRelationBatchSnapshot,gtdFn=gtd?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot;
    const peers=['workspace-mount','gtd-task-manager','collection-card-view'].map(id=>{const found=o.getContextCapsuleRenameConsumers().find(p=>p.id===id);if(typeof found?.api?.contextCapsuleRenameV2!=='function')this.fail('GOAL_CONSUMER_UNAVAILABLE');return {id,api:found.api,fn:found.api.contextCapsuleRenameV2}});
    const lease=()=>{
      this.guard();if(o.app.plugins.plugins['mandala-time-blocks']!==m||window.__mandalaTimeBlocksPluginApi!==api||m.goalRenameWriteBridge!==bridge||m.goalContextKeyManagement!==service||!service||service.closed||m.isUnloading||m.getPaths().sourceNotePath!==ref.sourceNotePath||JSON.stringify(m.getPaths())!==paths||['prepare','confirm','inspect','resume'].some((k,i)=>bridge[k]!==methods[i]))this.fail('GOAL_PRIMARY_LEASE_CHANGED');
      if(typeof evaFn!=='function'||typeof gtdFn!=='function'||o.getEva()!==eva||o.getGtdTaskManagerApi()!==gtd||eva.getOutgoingRelationBatchSnapshot!==evaFn||gtd.getContextCapsuleTopLevelProjectCarrierBatchSnapshot!==gtdFn)this.fail('GOAL_IDENTITY_LEASE_CHANGED');
      for(const p of peers){const now=o.getContextCapsuleRenameConsumers().find(x=>x.id===p.id);if(now?.api!==p.api||now.api.contextCapsuleRenameV2!==p.fn)this.fail('GOAL_CONSUMER_LEASE_CHANGED')}
      return true;
    };lease();return {bridge,lease,peers};
  }
  journal(create=false){
    this.guard();const w=this.owner.goalPeoWriter,l=w.location(w.capture()),root=l.path.join(l.dir,'goal-full-rename-v1');
    l.check();if(!l.fs.existsSync(root)){if(!create)return null;l.fs.mkdirSync(root)}
    this.guard();return new GoalFullJournalModule.GoalFullRenameJournal(root);
  }
  async build(input,txId,capture){
    const ref=this.ref(input),c=capture||this.capture(ref);c.lease();
    const preparation=this.owner.goalContextRenamePreparation||(this.owner.goalContextRenamePreparation=new GoalContextRenamePreparation(this.owner));
    const preview=await preparation.prepare({...ref,newDisplayLabel:input.newDisplayLabel});c.lease();
    const primary=this.copy(await c.bridge.prepare({...ref,oldDisplayLabel:preview.oldDisplayLabel,newDisplayLabel:preview.newDisplayLabel},txId,c.lease));c.lease();
    if(JSON.stringify(primary.evidence)!==JSON.stringify(preview.primary))this.fail('GOAL_PRIMARY_PREVIEW_CHANGED');
    const state=await this.owner.getContextKeyRenameManager().read();c.lease();
    if(GoalPeoDeclarationModule.hash(state.raw)!==preview.declaration.settingsHash||this.owner.settings.commentsByNodeKey?.[ref.nodeKey]!==state.data.commentsByNodeKey[ref.nodeKey])this.fail('GOAL_DECLARATION_PREVIEW_CHANGED');
    const declaration=GoalPeoDeclarationModule.derive({txId,...ref,oldLabel:preview.oldDisplayLabel,newLabel:preview.newDisplayLabel,beforeRaw:state.raw});
    const plan=GoalFullPlanModule.validate(this.copy({version:1,type:'goal-full-rename-v1',txId,...ref,oldLabel:preview.oldDisplayLabel,newLabel:preview.newDisplayLabel,primary,declaration,identity:preview.identity,consumers:preview.consumers.map(p=>p.plan)}));
    c.lease();return plan;
  }
  summary(job){const p=job.plan;return {txId:p.txId,nodeKey:p.nodeKey,sourceNotePath:p.sourceNotePath,oldLabel:p.oldLabel,newLabel:p.newLabel,status:job.progress.status,reason:job.progress.reason,steps:GoalFullPlanModule.STEPS.map(id=>({id,...job.progress[id]})),consumers:p.consumers.map(c=>({pluginId:c.pluginId,count:c.targets.length,sourceNotePath:c.scope.sourceNotePath}))}}
  async list(input){const ref=this.ref(input),j=this.journal(false),jobs=j?await j.list():[];this.guard();return jobs.filter(x=>x.plan.nodeKey===ref.nodeKey&&x.plan.sourceNotePath===ref.sourceNotePath).map(x=>this.summary(x))}
  async preview(input){
    if(this.busy)this.fail('GOAL_OPERATION_BUSY');this.busy=true;
    try{
      const ref=this.ref(input);this.refuseCenter(ref);const c=this.capture(ref),jobs=await this.list(ref);c.lease();if(jobs.some(j=>j.status!=='complete'))this.fail('GOAL_PENDING_USE_RESUME');
      const txId='goal-rename-'+require('node:crypto').randomUUID(),plan=await this.build(input,txId,c);c.lease();
      const token=require('node:crypto').randomUUID();if(this.previews.size>=16)this.previews.delete(this.previews.keys().next().value);this.previews.set(token,{plan,c});
      return {ok:true,contractVersion:1,token,txId,...ref,oldLabel:plan.oldLabel,newLabel:plan.newLabel,consumers:plan.consumers.map(p=>({pluginId:p.pluginId,count:p.targets.length,sourceNotePath:p.scope.sourceNotePath}))};
    }finally{this.busy=false}
  }
  async confirm(token){
    this.guard();const preview=typeof token==='string'?this.previews.get(token):null;if(!preview)this.fail('GOAL_PREVIEW_REQUIRED');if(this.busy)this.fail('GOAL_OPERATION_BUSY');this.busy=true;
    try{
      const {plan,c}=preview;c.lease();this.refuseCenter(plan);c.lease();const j=this.journal(true);
      const job=await j.confirm(plan,{assertLease:()=>{c.lease();this.refuseCenter(plan);return true},fresh:()=>this.build({nodeKey:plan.nodeKey,sourceNotePath:plan.sourceNotePath,newDisplayLabel:plan.newLabel},plan.txId,c)});c.lease();this.previews.delete(token);
      return {ok:true,...this.summary(job)};
    }finally{this.busy=false}
  }
  ownerFactory(plan,c,control,warnings){
    const o=this.owner,live=()=>{c.lease();control.assertLease();return true},warn=s=>{if(s&&!warnings.includes(s))warnings.push(s)};
    const declaration=o.goalPeoWriter.declarationOwner(async tx=>(await control.readConfirmedPlan(tx)).declaration,live);
    const memory=()=>({comment:o.settings.commentsByNodeKey?.[plan.nodeKey],receipts:this.copy(o.settings[GoalPeoDeclarationModule.FIELD]?.[plan.nodeKey]||[])});
    const acceptable=m=>(m.comment===plan.declaration.beforeComment&&JSON.stringify(m.receipts)===JSON.stringify(plan.declaration.beforeReceipts))||(m.comment===plan.declaration.afterComment&&JSON.stringify(m.receipts)===JSON.stringify(plan.declaration.afterReceipts));
    const merge=(before)=>{
      const now=memory();if(JSON.stringify(before)!==JSON.stringify(now)){warn('PEO_DRAFT_REQUIRES_RECONCILIATION');return}
      o.settings.commentsByNodeKey={...o.settings.commentsByNodeKey,[plan.nodeKey]:plan.declaration.afterComment};
      o.settings[GoalPeoDeclarationModule.FIELD]={...(o.settings[GoalPeoDeclarationModule.FIELD]||{}),[plan.nodeKey]:this.copy(plan.declaration.afterReceipts)};
    };
    const peo=operation=>o.enqueueSettingsWrite(async()=>{
      live();const before=memory();if(operation==='commit'&&!acceptable(before))this.fail('GOAL_PEO_UNSAVED_DRAFT');
      const r=await declaration[operation](plan.declaration);live();
      if(r.state==='verified'){if(acceptable(before))merge(before);else warn('PEO_DRAFT_REQUIRES_RECONCILIATION')}
      return r;
    });
    const out={primary:{inspect:()=>c.bridge.inspect(plan.txId,live),commit:async()=>{live();await c.bridge.confirm(plan.primary,live);live();return c.bridge.resume(plan.txId,live)}},declaration:{inspect:()=>peo('inspect'),commit:()=>peo('commit')}};
    for(let i=0;i<3;i++){
      const p=plan.consumers[i],peer=c.peers[i];
      const invoke=async phase=>{live();const r=await peer.fn.call(peer.api,{source:'project-execution-overview',phase,plan:this.copy(p),txId:plan.txId,isCurrent:live});live();
        if(r?.ok!==true||r.version!==2||typeof r.verified!=='boolean'||r.count!==p.targets.length)return {state:r?.ok===false?'conflict':'unknown',reason:r?.reason||'GOAL_V2_PACKET_INVALID'};
        if(r.uiWarning)warn(peer.id+': '+String(r.uiWarning).slice(0,512));
        return {state:r.verified?'verified':r.reason==='old-label-remains'?'pending':'unknown'};
      };out[GoalFullPlanModule.STEPS[i+2]]={inspect:()=>invoke('verify'),commit:()=>invoke('commit')};
    }return out;
  }
  async resume(txId){
    this.guard();if(this.busy)this.fail('GOAL_OPERATION_BUSY');this.busy=true;const warnings=[];let audit,operation;
    try{
      const j=this.journal(false);if(!j)this.fail('GOAL_CONFIRMATION_MISSING');const job=await j.read(txId);this.guard();this.refuseCenter(job.plan);const c=this.capture(this.ref(job.plan));
      const identity=new GoalFrozenIdentityReader(this.owner,c.lease);
      audit=window.__operationAuditTrailApi;
      try{operation=await this.auditCall(()=>audit?.beginOperation?.({'来源插件':'project-execution-overview','操作类型':'目标主键改名与恢复','修改摘要':'按已确认意图同步目标主键名称','会话编号':txId,'对象类型':'目标主键','对象名称':job.plan.newLabel,'结果':'pending'}))}catch(_){warnings.push('AUDIT_BEGIN_FAILED')}
      c.lease();const runner=new GoalFullJournalModule.GoalFullRenameRunner({journal:j,assertLease:c.lease,owners:(p,control)=>this.ownerFactory(p,c,control,warnings),verifyIdentity:async(p,live)=>{live();const result=await identity.read(p);live();return result}});
      const result=await runner.resume(txId);c.lease();
      try{window.dispatchEvent(new CustomEvent('context-capsule-carrier:changed',{detail:{providerId:'project-execution-overview',reason:'goal-managed-rename'}}))}catch(_){warnings.push('REFRESH_NOTIFICATION_FAILED')}
      try{if(operation?.operationId)await this.auditCall(()=>audit?.finishOperation?.(operation.operationId,{'结果':result.progress.status==='complete'?'success':'failed','失败原因':result.progress.reason}))}catch(_){warnings.push('AUDIT_FINISH_FAILED')}
      c.lease();
      return {ok:result.progress.status==='complete',...this.summary(result),warnings};
    }finally{this.busy=false}
  }
}

class GoalProductionRenameModal extends Modal {
  constructor(service,input){
    super(service.owner.app);this.service=service;this.ref=service.ref(input);this.busy=false;this.closed=false;this.token=null;this.txId=null;
    const base=service.owner.app.vault.adapter.getBasePath?.();if(!base)service.fail('GOAL_DRAFT_NAMESPACE');
    this.draftKey='goal-context-rename-draft-v1:'+base+':'+this.ref.nodeKey;
    const originalClose=this.close.bind(this);
    this.close=()=>{if(this.input&&!this.keepDraft()){this.status.textContent='草稿未能保存，请先复制名称，再重试关闭。';return}this.closed=true;originalClose()};
  }
  keepDraft(){
    try{const raw=JSON.stringify({version:1,...this.ref,value:this.input.value});window.localStorage.setItem(this.draftKey,raw);return window.localStorage.getItem(this.draftKey)===raw}catch(_){return false}
  }
  element(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;this.contentEl.appendChild(el);return el}
  async onOpen(){
    this.contentEl.empty();this.element('h2','修改目标主键名称');this.element('p','保留编号、原节点、正文和绑定。确认后可从此处继续未完成的同步。');
    this.input=this.element('input');this.input.style.width='100%';this.input.type='text';this.input.maxLength=512;
    const comment=this.service.owner.settings.commentsByNodeKey?.[this.ref.nodeKey],declarations=this.service.owner.getContextKeyRenameManager().declarations(comment||'');
    this.input.value=declarations.length===1?declarations[0].label:'';
    try{const raw=window.localStorage.getItem(this.draftKey);if(raw){const draft=JSON.parse(raw);if(draft.version===1&&draft.nodeKey===this.ref.nodeKey&&draft.sourceNotePath===this.ref.sourceNotePath&&typeof draft.value==='string'&&draft.value.length<=512)this.input.value=draft.value}}catch(_){}
    this.status=this.element('p','正在读取已确认的同步记录…');this.details=this.element('div');
    this.previewButton=this.element('button','预览同步范围');this.confirmButton=this.element('button','确认改名并同步');this.resumeButton=this.element('button','重新核验 / 继续同步');
    this.confirmButton.disabled=true;this.resumeButton.disabled=true;
    this.input.oninput=()=>{this.token=null;this.confirmButton.disabled=true;if(!this.keepDraft())this.status.textContent='草稿保存失败，关闭前请复制名称。'};
    this.previewButton.onclick=()=>this.run(async()=>{const value=this.input.value,r=await this.service.preview({...this.ref,newDisplayLabel:value});if(this.closed||this.input.value!==value)return;this.token=r.token;this.renderScopes(r.consumers);this.status.textContent='请核对同步范围；确认后开始保存。';this.confirmButton.disabled=false});
    this.confirmButton.onclick=()=>this.run(async()=>{if(!this.token)return;const r=await this.service.confirm(this.token);this.txId=r.txId;this.token=null;this.input.disabled=true;this.confirmButton.disabled=true;this.show(await this.service.resume(this.txId))});
    this.resumeButton.onclick=()=>this.run(async()=>{if(this.txId)this.show(await this.service.resume(this.txId))});
    await this.run(async()=>{
      const row=this.service.centerRow(this.ref);if(this.closed)return;if(row){this.redirect(row);return}
      const jobs=await this.service.list(this.ref);if(this.closed)return;
      const pending=jobs.filter(j=>j.status!=='complete');
      if(pending.length>1){this.status.textContent='有多项未完成记录，请先检查同步日志。';this.previewButton.disabled=true;return}
      if(pending.length){const j=pending[0];this.txId=j.txId;this.input.value=j.newLabel;this.input.disabled=true;this.previewButton.disabled=true;this.show(j)}
      else this.status.textContent='填写新名称，然后预览同步范围。';
    });
  }
  redirect(row){
    this.centerOwned=true;for(const b of [this.previewButton,this.confirmButton,this.resumeButton])b.style.display='none';this.input.readOnly=true;
    const draft=this.input.value!==row.label;
    this.status.textContent='这个目标的名称由主键管理中心维护（当前：'+row.label+'）。请在管理中心的“名称与同步”中修改；这里不会记录改名，也不会改动任何内容。'+(draft?'上面是你之前填写的新名称，可复制使用。':'');
    const open=this.element('button','打开该目标的“名称与同步”');open.className='mod-cta';
    open.onclick=()=>this.run(async()=>{const p=this.service.owner.app.plugins?.plugins?.['context-key-manager'];
      if(typeof p?.identityHost?.open==='function'){if(!p.identityHost.open(row))throw Error('主键管理中心暂不可用，未能打开名称窗口；请稍后重试或从主键管理中心列表进入');this.close();return}
      if(typeof p?.open!=='function')throw Error('主键管理中心未加载');await p.open();this.close()});
  }
  renderScopes(scopes){this.details.replaceChildren();for(const c of scopes||[]){const p=document.createElement('p');p.textContent=`${c.pluginId}：匹配 ${c.count} 个；来源 ${c.sourceNotePath}`;this.details.appendChild(p)}}
  show(result){
    if(this.closed)return;this.txId=result.txId;this.renderScopes(result.consumers);
    const done=result.status==='complete';this.status.textContent=done?'改名和同步已核验完成。':`同步未完成：${result.reason||result.status}。可明确点击“继续同步”重新核验。`;
    for(const step of result.steps||[]){const p=document.createElement('p');p.textContent=`${step.id}：${step.state}`;this.details.appendChild(p)}
    for(const warning of result.warnings||[]){const p=document.createElement('p');p.textContent='内容保存状态见上方；刷新或草稿提示：'+warning;this.details.appendChild(p)}
    this.resumeButton.disabled=done;this.confirmButton.disabled=true;this.previewButton.disabled=!done;this.input.disabled=!done;
    if(done){this.input.value=result.newLabel;try{window.localStorage.removeItem(this.draftKey)}catch(_){}this.token=null}
  }
  async run(fn){
    if(this.busy||this.closed)return;this.busy=true;
    try{await fn()}catch(e){if(!this.closed){this.status.textContent=e.code==='GOAL_CENTER_MANAGED'?'这个目标的名称由主键管理中心维护，请在管理中心的“名称与同步”中修改；这里没有记录或改动任何内容。':this.centerOwned||/^主键管理服务/.test(e.message)?`未完成：${e.code||e.message}。`:`未完成：${e.code||e.message}。名称已保留；可重新打开查看确认记录。`;this.keepDraft();this.previewButton.disabled=this.input.disabled;this.confirmButton.disabled=!this.token;this.resumeButton.disabled=!this.txId}}
    finally{this.busy=false}
  }
  onClose(){this.closed=true;this.contentEl.empty()}
}

const CreationPlanModule=((require)=>{const module={exports:{}};
'use strict';
const {clone,hash,LIMIT}=require('./goal-full-rename-plan.cjs');
const fail=c=>{throw Object.assign(Error(c),{code:c})};
function shape(x,required,optional=[]){if(!x||typeof x!=='object'||Array.isArray(x)||required.some(k=>!Object.hasOwn(x,k))||Object.keys(x).some(k=>![...required,...optional].includes(k)))fail('CREATE_PLAN_SCHEMA')}
function relative(p){if(typeof p!=='string'||!p||p.length>2048||/[\\:\x00-\x1f]/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'))fail('CREATE_PLAN_PATH')}
function validate(input){
 const p=clone(input);shape(p,['version','id','domain','source','weekId','input','steps']);shape(p.input,['projectName','contextKey'],['importanceGroup','parentNodeId']);
 if(p.version!==1||!/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.id)||!['project','goal'].includes(p.domain))fail('CREATE_PLAN_ID');
 relative(p.source);if(!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(p.weekId))fail('CREATE_PLAN_WEEK');
 for(const k of ['projectName','contextKey'])if(typeof p.input[k]!=='string'||p.input[k]!==p.input[k].trim()||!p.input[k]||p.input[k].length>512||/[\x00-\x1f]/.test(p.input[k]))fail('CREATE_PLAN_INPUT');
 if(p.input.importanceGroup!==undefined&&!['0','A','B','C','CZ'].includes(p.input.importanceGroup))fail('CREATE_PLAN_IMPORTANCE');
 if(p.domain==='goal'&&(typeof p.input.parentNodeId!=='string'||!p.input.parentNodeId||p.input.parentNodeId!==p.input.parentNodeId.trim()||/[\x00-\x1f]/.test(p.input.parentNodeId)||p.input.parentNodeId.length>256))fail('CREATE_PLAN_PARENT');
 if(p.domain==='project'&&Object.hasOwn(p.input,'parentNodeId'))fail('CREATE_PLAN_PARENT');
 if(!Array.isArray(p.steps)||!p.steps.length||p.steps.length>24)fail('CREATE_PLAN_STEPS');const ids=new Set();
 for(const s of p.steps){shape(s,['id','owner','source','contract','plan','depends']);relative(s.source);
  if(typeof s.id!=='string'||!/^[a-z][a-z0-9-]{0,47}$/.test(s.id)||['status','reason','constructor','prototype','toJSON'].includes(s.id)||ids.has(s.id)||s.contract!==1||!['workspace-mount','collection-card-view','gtd-task-manager','mandala-time-blocks','project-execution-overview','eva-cross-view-relations'].includes(s.owner)||!s.plan||typeof s.plan!=='object'||Array.isArray(s.plan)||!Array.isArray(s.depends)||new Set(s.depends).size!==s.depends.length||s.depends.some(id=>!ids.has(id)))fail('CREATE_PLAN_STEP');ids.add(s.id);
 }return p;
}
module.exports={validate,hash,LIMIT,clone};

return module.exports;})(name=>name==='./goal-full-rename-plan.cjs'?GoalFullPlanModule:require(name));
const CreationJournalModule=((require)=>{const module={exports:{}};
"use strict";
const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {validate,hash,LIMIT}=require('./creation-production-plan.cjs');
const MAX_JOBS=128,MAX_EVENTS=512,TX=/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const queues=globalThis[Symbol.for('managed-context-create.journal.queues.v1')] ||= new Map();
const copy=x=>JSON.parse(JSON.stringify(x)),fail=c=>{throw Object.assign(new Error(c),{code:c})};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function shape(x,keys){if(!plain(x)||Object.keys(x).sort().join(',')!==keys.slice().sort().join(','))fail('JOURNAL_SCHEMA')}
function noLinks(p){let current=path.resolve(p);while(true){const s=sync.lstatSync(current);if(s.isSymbolicLink())fail('JOURNAL_SYMLINK');const next=path.dirname(current);if(next===current)break;current=next}}
function initial(plan){const STEPS=plan.steps.map(s=>s.id);return {status:'confirmed',reason:'',...Object.fromEntries(STEPS.map(k=>[k,{state:'pending',attempts:0,everVerified:false}]))}}
function progress(value,previous,plan){const STEPS=plan.steps.map(s=>s.id);
 shape(value,['status','reason',...STEPS]);if(!['confirmed','running','paused','review','complete'].includes(value.status)||typeof value.reason!=='string'||value.reason.length>512)fail('PROGRESS_SCHEMA');
 for(const kind of STEPS){const s=value[kind],p=previous[kind];shape(s,['state','attempts','everVerified']);if(!['pending','attempting','verified','unknown','conflict'].includes(s.state)||!Number.isSafeInteger(s.attempts)||s.attempts<0||s.attempts<p.attempts||s.attempts>p.attempts+1||typeof s.everVerified!=='boolean'||p.everVerified&&!s.everVerified||s.state==='verified'&&!s.everVerified||!p.everVerified&&s.everVerified&&s.state!=='verified')fail('PROGRESS_SCHEMA');
  if(s.attempts>p.attempts&&(s.state!=='attempting'||value.status!=='running'||p.everVerified))fail('PROGRESS_ATTEMPT');
  if(s.state==='attempting'&&(value.status!=='running'||s.attempts!==p.attempts+1))fail('PROGRESS_ATTEMPT');
  if(s.everVerified&&s.state==='pending'||value.status==='confirmed')fail('PROGRESS_REGRESSION');
 }
 for(let i=1;i<STEPS.length;i++)if(value[STEPS[i]].everVerified&&!value[STEPS[i-1]].everVerified)fail('PROGRESS_ORDER');
 if(value.status==='complete'&&STEPS.some(k=>value[k].state!=='verified'))fail('PROGRESS_ORDER');return value;
}
// Shared across runner instances; a timed-out request retains exclusion until it settles.
const requests=globalThis[Symbol.for('managed-context-create.requests.v1')] ||= new Map();
class CreationProductionRunner {
 constructor({journal,owners,assertLease,verifyIdentity,verifyFinal,timeoutMs=15000}){
  if(!(journal instanceof CreationProductionJournal)||typeof owners!=='function'||typeof assertLease!=='function'||typeof verifyIdentity!=='function'||typeof verifyFinal!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)fail('FULL_RUNNER_CONTRACT');
  Object.assign(this,{journal,owners,assertLease,verifyIdentity,verifyFinal,timeoutMs,closed:false});
 }
 close(){this.closed=true}
 async resume(id){return this.journal.serial(async token=>{
  const key=process.platform==='win32'?this.journal.directory.toLowerCase():this.journal.directory;if(requests.has(key))fail('FULL_REQUEST_STILL_RUNNING');
  let revoked=false,job=await this.journal.read(id),p=copy(job.progress);const intentHash=job.intentHash,plan=copy(job.plan);const STEPS=plan.steps.map(s=>s.id);
  for(const k of STEPS)if(p[k].state==='attempting')p[k].state='unknown';
  const live=()=>{if(revoked||this.closed)fail('FULL_RUN_REVOKED');this.journal.assertIntent(id,intentHash);const r=this.assertLease();if(r&&typeof r.then==='function'){Promise.resolve(r).catch(()=>{});fail('FULL_ASYNC_LEASE')}if(r===false)fail('FULL_LEASE')};
  const bounded=async fn=>{
   live();let timer;const request=Promise.resolve().then(()=>{live();return fn()});requests.set(key,request);
   const clear=()=>{if(requests.get(key)===request)requests.delete(key)};request.then(clear,clear);
   try{const result=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{revoked=true;reject(Object.assign(Error('FULL_TIMEOUT'),{code:'FULL_TIMEOUT'}))},this.timeoutMs)})]);live();return result}finally{clearTimeout(timer)}
  };
  // r33 C2: read-only calls (inspect, lease identity) retry on timeout without revoking the run; waiting for an in-flight
  // read is capped at timeoutMs (single-flight kept). Commits and verifyFinal keep the original bounded/revoke semantics.
  const boundedRead=async fn=>{
   for(let attempt=0;;attempt++){
    const waitStart=Date.now();
    while(requests.has(key)){if(Date.now()-waitStart>this.timeoutMs)fail('FULL_TIMEOUT');const prior=requests.get(key);await Promise.race([Promise.resolve(prior).then(()=>{},()=>{}),new Promise(res=>setTimeout(res,250))]);}
    live();let timer,timedOut=false;const request=Promise.resolve().then(()=>{live();return fn()});requests.set(key,request);
    const clear=()=>{if(requests.get(key)===request)requests.delete(key)};request.then(clear,clear);
    try{const result=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;reject(Object.assign(Error('FULL_TIMEOUT'),{code:'FULL_TIMEOUT'}))},this.timeoutMs)})]);live();return result}
    catch(e){if(!timedOut||attempt>=2)throw e}
    finally{clearTimeout(timer)}
    await new Promise(res=>setTimeout(res,[1000,3000][attempt]));
   }
  };
  const readConfirmedPlan=async tx=>{live();if(tx!==id)fail('FULL_TX_CHANGED');const current=await this.journal.read(tx);live();if(current.intentHash!==intentHash)fail('FULL_INTENT_CHANGED');return copy(current.plan)};
  const ownerMap=this.owners(copy(plan),{assertLease:live,readConfirmedPlan});shape(ownerMap,STEPS);
  for(const k of STEPS)if(typeof ownerMap[k]?.inspect!=='function'||typeof ownerMap[k]?.commit!=='function')fail('FULL_OWNER_CAPABILITY');
  const save=async()=>{job=await this.journal._append(job,p,token,p.status==='complete'?live:undefined);return job};
  const pause=async(reason,review=false)=>{p.status=review?'review':'paused';p.reason=String(reason).slice(0,512);return save()};
  const inspect=async k=>{const r=await boundedRead(()=>ownerMap[k].inspect());if(!r||!['pending','verified','conflict','unknown'].includes(r.state))fail('FULL_INSPECT_SCHEMA');return r};
  const identity=async()=>{if(await boundedRead(()=>this.verifyIdentity(copy(plan),live))!==true)fail('FULL_IDENTITY_CHANGED')};
  try{await identity()}catch(e){return pause(e.code||'FULL_IDENTITY_UNAVAILABLE')}
  // r33 C3: pause reasons keep the original code first and append step/owner detail (sanitized, bounded).
  const why=(code,k,x)=>{const d=x&&(x.reason||x.uiWarning||(x instanceof Error?x.message:''));const extra=[k&&('step='+k),d&&('detail='+d)].filter(Boolean).join(';');return (String(code)+(extra?';'+extra:'')).replace(/[^A-Za-z0-9_.;=:-]/g,'_').slice(0,200)};
  const skipped=new Set();
  for(const k of STEPS){
   // r33 C1: steps already verified are not re-inspected in the first pass; the final pass re-inspects every step.
   if(p[k].state==='verified'&&p[k].everVerified){skipped.add(k);continue}
   let s;try{s=await inspect(k)}catch(e){p[k].state='unknown';return pause(why(e.code||'FULL_INSPECT_UNAVAILABLE',k,e))}
   if(s.state==='verified'){p[k].state='verified';p[k].everVerified=true;p.status='running';p.reason='';await save();continue}
   if(p[k].everVerified||s.state==='conflict'){p[k].state='conflict';return pause('FULL_VERIFIED_DRIFT_OR_CONFLICT',true)}
   if(s.state!=='pending'){p[k].state='unknown';return pause(why('FULL_INSPECT_UNAVAILABLE',k,s))}
   // r33 C1/A3: before committing, re-check a predecessor skipped in this pass (linear step dependency).
   {const prev=STEPS[STEPS.indexOf(k)-1];if(prev&&skipped.has(prev)){let ps;try{ps=await inspect(prev)}catch(e){p[prev].state='unknown';return pause(why(e.code||'FULL_INSPECT_UNAVAILABLE',prev,e))}if(ps.state!=='verified'){p[prev].state='conflict';return pause('FULL_VERIFIED_DRIFT_OR_CONFLICT',true)}skipped.delete(prev)}}
   try{await identity()}catch(e){p[k].state='unknown';return pause(why(e.code||'FULL_IDENTITY_UNAVAILABLE',k,e))}
   p.status='running';p.reason='';p[k].state='attempting';p[k].attempts++;await save();
   let error;try{await bounded(()=>ownerMap[k].commit())}catch(e){error=e}
   if(revoked){p[k].state='unknown';return pause(error?.code||'FULL_RUN_REVOKED')}
   try{s=await inspect(k)}catch(e){p[k].state='unknown';return pause(why(e.code||'FULL_INSPECT_UNAVAILABLE',k,e))}
   if(s.state!=='verified'){p[k].state=s.state==='conflict'?'conflict':'unknown';return pause(why(error?.code||'FULL_COMMIT_UNVERIFIED',k,s),s.state==='conflict')}
   p[k].state='verified';p[k].everVerified=true;await save();
  }
  try{await identity();if(await bounded(()=>this.verifyFinal(copy(plan),live))!==true)fail('CREATE_FINAL_QUALIFICATION');for(const k of STEPS){const s=await inspect(k);if(s.state!=='verified'){p[k].state='conflict';return pause('FULL_FINAL_DRIFT',true)}}live()}catch(e){return pause(why(e.code||'FULL_FINAL_UNAVAILABLE',null,e))}
  p.status='complete';p.reason='';await save();live();return job;
 })}
}
class CreationProductionJournal {
 #token;
 assertIntent(id,expected){const dir=this.jobPath(id);noLinks(dir);const root=sync.lstatSync(this.directory);if(root.dev!==this.identity[0]||root.ino!==this.identity[1])fail('JOURNAL_DIRECTORY_CHANGED');const file=path.join(dir,'intent.json'),st=sync.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>LIMIT)fail('JOURNAL_FILE');if(hash(sync.readFileSync(file,'utf8'))!==expected)fail('FULL_INTENT_CHANGED')}
 // Directory must already exist. Opening/reading never creates a job or replays it.
 constructor(directory,{fault=async()=>{}}={}){
  if(!path.isAbsolute(directory))fail('JOURNAL_ABSOLUTE_PATH');noLinks(directory);this.directory=sync.realpathSync.native(directory);const s=sync.lstatSync(this.directory);if(!s.isDirectory())fail('JOURNAL_DIRECTORY');this.identity=[s.dev,s.ino];this.fault=fault;
 }
 async guard(){noLinks(this.directory);const s=await fs.lstat(this.directory);if(!s.isDirectory()||s.isSymbolicLink()||s.dev!==this.identity[0]||s.ino!==this.identity[1])fail('JOURNAL_DIRECTORY_CHANGED')}
 serial(fn){const k=process.platform==='win32'?this.directory.toLowerCase():this.directory,prior=queues.get(k)||Promise.resolve(),run=async()=>{const token=Symbol('journal-lock');this.#token=token;try{return await fn(token)}finally{this.#token=undefined}},job=prior.then(run,run),tail=job.catch(()=>{});queues.set(k,tail);tail.finally(()=>{if(queues.get(k)===tail)queues.delete(k)});return job}
 jobPath(id){if(!TX.test(id))fail('JOURNAL_ID');return path.join(this.directory,id)}
 async jobGuard(id){await this.guard();const p=this.jobPath(id);noLinks(p);const s=await fs.lstat(p);if(!s.isDirectory()||s.isSymbolicLink())fail('JOURNAL_JOB_DIRECTORY');return p}
 async raw(id,name){const dir=await this.jobGuard(id),file=path.join(dir,name),s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink()||s.size>LIMIT)fail('JOURNAL_FILE');const raw=await fs.readFile(file,'utf8');await this.jobGuard(id);if(Buffer.byteLength(raw)>LIMIT)fail('JOURNAL_LIMIT');return raw}
 async put(id,name,raw,beforePublish=()=>{}){if(Buffer.byteLength(raw)>LIMIT)fail('JOURNAL_LIMIT');const dir=await this.jobGuard(id),file=path.join(dir,name),tmp=path.join(dir,'.pending-'+randomUUID());await this.fault('before-write',name);const h=await fs.open(tmp,'wx');try{await h.writeFile(raw,'utf8');await h.sync()}finally{await h.close()}await this.jobGuard(id);await this.fault('before-publish',name);try{beforePublish()}catch(e){await fs.unlink(tmp);throw e}await fs.link(tmp,file);await fs.unlink(tmp);if(await this.raw(id,name)!==raw)fail('JOURNAL_READBACK');await this.fault('after-publish',name)}
 async read(id){
  const dir=await this.jobGuard(id),names=(await fs.readdir(dir)).sort();if(!names.includes('intent.json')||names.length>MAX_EVENTS+1)fail('JOURNAL_INCOMPLETE');
  const raw=await this.raw(id,'intent.json'),intent=JSON.parse(raw);shape(intent,['version','namespace','status','plan']);if(intent.version!==1||intent.namespace!==this.directory||intent.status!=='confirmed'||intent.plan.id!==id)fail('JOURNAL_IDENTITY');const plan=validate(intent.plan),intentHash=hash(raw);let head=intentHash,seq=0,p=initial(plan);
  for(const name of names.filter(n=>n!=='intent.json')){seq++;if(name!==String(seq).padStart(6,'0')+'.json')fail('JOURNAL_SEQUENCE');const rawEvent=await this.raw(id,name),ev=JSON.parse(rawEvent);shape(ev,['version','txId','seq','intentHash','previousHash','progress']);if(ev.version!==1||ev.txId!==id||ev.seq!==seq||ev.intentHash!==intentHash||ev.previousHash!==head)fail('JOURNAL_CHAIN');p=progress(ev.progress,p,plan);head=hash(rawEvent)}
  return {plan,progress:p,seq,head,intentHash};
 }
 async list(){await this.guard();const names=await fs.readdir(this.directory);if(names.length>MAX_JOBS)fail('JOURNAL_JOB_LIMIT');const out=[];for(const n of names.sort())out.push(await this.read(n));return out}
 async confirm(plan,{fresh,assertLease}={}){const p=validate(plan);if(typeof fresh!=="function"||typeof assertLease!=="function")fail("FULL_CONFIRM_CAPABILITY");const live=()=>{const r=assertLease();if(r&&typeof r.then==="function"){Promise.resolve(r).catch(()=>{});fail("FULL_ASYNC_LEASE")}if(r===false)fail("FULL_LEASE")};return this.serial(async()=>{live();await this.guard();const jobs=await this.list(),prior=jobs.find(j=>j.plan.id===p.id);if(prior){if(JSON.stringify(prior.plan)!==JSON.stringify(p))fail('JOURNAL_TX_CHANGED');live();return prior}live();if(jobs.length>=MAX_JOBS)fail('JOURNAL_JOB_LIMIT');if(jobs.some(j=>j.plan.source===p.source&&j.plan.input.contextKey.toLocaleLowerCase()===p.input.contextKey.toLocaleLowerCase()&&j.progress.status!=='complete'))fail('JOURNAL_EXISTING_UNFINISHED');if(JSON.stringify(validate(await fresh(copy(p))))!==JSON.stringify(p))fail("FULL_CONFIRM_CHANGED");live();await fs.mkdir(this.jobPath(p.id));await this.put(p.id,'intent.json',JSON.stringify({version:1,namespace:this.directory,status:'confirmed',plan:p}),live);live();const confirmed=await this.read(p.id);live();return confirmed})}
 // Internal helpers are used only while the directory queue is held by resume().
 async _append(expected,next,token,beforePublish){if(!token||token!==this.#token)fail('JOURNAL_LOCK_REQUIRED');const actual=await this.read(expected.plan.id);if(actual.head!==expected.head||actual.seq!==expected.seq||actual.intentHash!==expected.intentHash)fail('JOURNAL_CHANGED');if(actual.seq>=MAX_EVENTS)fail('JOURNAL_EVENT_LIMIT');const checked=progress(copy(next),actual.progress,actual.plan),seq=actual.seq+1;await this.put(actual.plan.id,String(seq).padStart(6,'0')+'.json',JSON.stringify({version:1,txId:actual.plan.id,seq,intentHash:actual.intentHash,previousHash:actual.head,progress:checked}),beforePublish);return this.read(actual.plan.id)}
}

module.exports={CreationProductionJournal,CreationProductionRunner};

return module.exports;})(name=>name==='./creation-production-plan.cjs'?CreationPlanModule:require(name));
class CreationProductionCoordinator {
 constructor(owner){this.owner=owner;this.api=owner.projectExecutionOverviewPublicApi;this.generation=owner.operationalContextSnapshotProviderGeneration;this.previews=new Map();this.busy=false;if(!owner.goalPeoWriter)owner.goalPeoWriter=new GoalPeoWriter(owner)}
 copy(x){return JSON.parse(JSON.stringify(x))}
 fail(c){throw Object.assign(Error(c),{code:c})}
 async audit(call){let timer;try{return await Promise.race([Promise.resolve().then(call),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CREATE_AUDIT_TIMEOUT')),1000)})])}finally{clearTimeout(timer)}}
 async parents(){this.guard();const m=this.owner.app.plugins?.plugins?.['mandala-time-blocks'],api=window.__mandalaTimeBlocksPluginApi;if(!m||!api)this.fail('CREATE_MANDALA_UNAVAILABLE');const paths=JSON.stringify(m.getPaths()),raw=await m.app.vault.adapter.read(m.getPaths().db);this.guard();if(this.owner.app.plugins.plugins['mandala-time-blocks']!==m||window.__mandalaTimeBlocksPluginApi!==api||m.isUnloading||JSON.stringify(m.getPaths())!==paths)this.fail('CREATE_SOURCE_CHANGED');if(typeof raw!=='string'||Buffer.byteLength(raw)>16*1024*1024)this.fail('CREATE_PARENT_DATA');const db=JSON.parse(raw);if(!db||Array.isArray(db)||typeof db!=='object'||Object.keys(db).length>10000)this.fail('CREATE_PARENT_DATA');return Object.entries(db).filter(([id,n])=>n&&n.id===id&&n.children&&typeof n.children==='object'&&[0,1,2,3,5,6,7,8].some(slot=>!n.children[slot])).map(([id,n])=>({id,label:String(n.title||id)}))}
 guard(){const o=this.owner;if(o.contextCarrierUnloading||o.creationProductionCoordinator!==this||o.projectExecutionOverviewPublicApi!==this.api||window.__projectExecutionOverviewPluginApi!==this.api||o.operationalContextSnapshotProviderGeneration!==this.generation)this.fail('CREATE_COORDINATOR_CLOSED')}
 capture(){this.guard();const o=this.owner,ids=['workspace-mount','gtd-task-manager','collection-card-view','mandala-time-blocks','eva-cross-view-relations'],globals=['__workspaceMountPluginApi','__gtdTaskManagerPluginApi','__collectionCardViewPluginApi','__mandalaTimeBlocksPluginApi','evaCrossViewRelations'],methods=[['prepareProjectCreationV1','prepareContextCarrierCreationV1','inspectCreationStep','commitCreationStep'],['prepareManagedContextCreationV1','inspectCreationStep','commitCreationStep'],['prepareContextCarrierCreationV1','inspectCreationStep','commitCreationStep'],['prepareManagedContextCreationV1','inspectManagedContextCreationV1','commitManagedContextCreationV1','listEffectiveOperationalContextKeys','listEffectiveGoalOperationalContextKeys'],['prepareManagedContextCreationV1','inspectManagedContextCreationV1','commitManagedContextCreationV1']];
  const peers=ids.map((id,i)=>{const plugin=o.app.plugins?.plugins?.[id],api=window[globals[i]];if(!plugin||api?.creationContractVersion!==1||methods[i].some(k=>typeof api[k]!=='function'))this.fail('CREATE_PROVIDER_UNAVAILABLE: '+id);return {id,plugin,api,global:globals[i],functions:methods[i].map(k=>[k,api[k]])}});
  const source=()=>JSON.stringify([peers[0].plugin.resolveApiSourceNotePath(),peers[1].plugin.resolveSourceContext(),peers[2].plugin.getDefaultSourceNotePath(),peers[3].plugin.getPaths(),o.settings.startQuery,o.settings.startNodeKey,o.settings.groupingMode]);
  const stamp=source(),peo=o.getManagedCreationOwner();
  const lease=()=>{this.guard();if(source()!==stamp||o.managedCreationOwner!==peo)this.fail('CREATE_SOURCE_CHANGED');for(const p of peers)if(o.app.plugins.plugins[p.id]!==p.plugin||window[p.global]!==p.api||p.plugin.isUnloading||p.plugin.unloaded||p.plugin.actionEntryClosed||p.plugin.contextRenameClosed||p.functions.some(([k,f])=>p.api[k]!==f))this.fail('CREATE_PROVIDER_CHANGED');return true};lease();return {peers,peo,lease,mandala:peers[3].plugin};
 }
 journal(create=false){this.guard();const w=this.owner.goalPeoWriter,l=w.location(w.capture()),dir=l.path.join(l.dir,'context-creation-v1');l.check();if(!l.fs.existsSync(dir)){if(!create)return null;l.fs.mkdirSync(dir)}return new CreationJournalModule.CreationProductionJournal(dir)}
 async build(draft,txId,c,prior){c.lease();const input={projectName:String(draft.projectName||'').trim(),contextKey:String(draft.contextKey||'').trim(),importanceGroup:draft.importanceGroup||'A',...(draft.domain==='goal'?{parentNodeId:String(draft.parentNodeId||'').trim()}:{})};
  const domain=draft.domain,weekId=draft.weekId,createdDate=prior?.steps.find(s=>s.id==='gtd-tag')?.plan.createdDate||new Date().toISOString().slice(0,10),base={txId,domain,...input,weekId,createdDate};let steps=[],nodeKey;
  if(domain==='project'){const s=await c.peers[0].api.prepareProjectCreationV1(base);c.lease();steps.push(this.copy(s));nodeKey='jump:v1:workspace-mount-view|'+[s.plan.sourceNotePath,'tab',s.plan.tabId,s.plan.itemId].map(encodeURIComponent).join('|')}
  else if(domain==='goal')nodeKey='jump:v1:mandala-time-blocks|'+[c.mandala.getPaths().sourceNotePath,'node','mandala','node-'+txId.slice(7)].map(encodeURIComponent).join('|');else this.fail('CREATE_DOMAIN');
  const m=await c.peers[3].api.prepareManagedContextCreationV1({...base,...(domain==='project'?{nodeId:nodeKey}:{}),isCurrent:c.lease});c.lease();
  const gtd=await c.peers[1].api.prepareManagedContextCreationV1({...base,isCurrent:c.lease});c.lease();
  const workspace=await c.peers[0].api.prepareContextCarrierCreationV1(base);c.lease();const collection=await c.peers[2].api.prepareContextCarrierCreationV1(base);c.lease();
  if(domain==='goal')steps.push(...this.copy(m.filter(s=>s.id!=='mandala-weekly')));
  steps.push(...this.copy(gtd),...this.copy(workspace),...this.copy(collection));
  if(domain==='goal'){const gp=gtd[0].plan,targetNodeKey='jump:v1:gtd|'+[gp.sourceNotePath,'note',gp.sourceNotePath,gp.projectId].map(encodeURIComponent).join('|');steps.push(this.copy(await c.peers[4].api.prepareManagedContextCreationV1({txId,sourceNodeKey:nodeKey,targetNodeKey,isCurrent:c.lease})));c.lease()}
  steps.push(this.copy(c.peo.prepare({...base,nodeKey,isCurrent:c.lease})),...this.copy(m.filter(s=>s.id==='mandala-weekly')));c.lease();
  steps=steps.map((s,i)=>({...s,depends:i?[steps[i-1].id]:[]}));
  return CreationPlanModule.validate(this.copy({version:1,id:txId,domain,source:c.mandala.getPaths().sourceNotePath,weekId,input,steps}));
 }
 summary(job){return {txId:job.plan.id,domain:job.plan.domain,contextKey:job.plan.input.contextKey,source:job.plan.source,status:job.progress.status,reason:job.progress.reason,steps:job.plan.steps.map(s=>({id:s.id,owner:s.owner,source:s.source,...job.progress[s.id]}))}}
 async list(){this.guard();const j=this.journal(false),jobs=j?await j.list():[];this.guard();return jobs.map(j=>this.summary(j))}
 // P2-E: read-only creation facts for the center adoption (chain-verified journal reads; no write, no busy, no serial).
 fact(job){const p=job.plan||{},step=id=>(p.steps||[]).find(s=>s.id===id)?.plan||{},d=step('peo-declaration'),w=step('workspace-carrier'),g=step('gtd-tag'),c=step('collection-carrier'),r=p.domain==='goal'?step('eva-carrier').relation||{}:null;return {txId:p.id,domain:p.domain,status:job.progress?.status,reason:job.progress?.reason||'',source:p.source,label:p.input?.contextKey,declaration:{nodeKey:d.nodeKey,sourceNotePath:d.sourceNotePath},carriers:[{ownerId:'workspace-mount',sourceScope:w.sourceNotePath,carrierId:w.tabId},{ownerId:'gtd-task-manager',sourceScope:g.sourceNotePath,carrierId:g.tagId},{ownerId:'collection-card-view',sourceScope:c.sourceNotePath,carrierId:c.tabId}],goalCarrier:r?{relationId:r.id,targetNodeKey:r.targetNodeKey,tagId:g.tagId}:null}}
 async facts(){this.guard();const j=this.journal(false),jobs=j?await j.list():[];this.guard();return {ok:true,jobs:jobs.map(job=>this.fact(job))}}
 async preview(draft){if(this.busy)this.fail('CREATE_BUSY');this.busy=true;try{const c=this.capture(),txId='create-'+require('crypto').randomUUID(),plan=await this.build(draft,txId,c);c.lease();const token=require('crypto').randomUUID();if(this.previews.size>=16)this.previews.delete(this.previews.keys().next().value);this.previews.set(token,{plan,c});return {token,...this.summary({plan,progress:{status:'preview',reason:''}})}}finally{this.busy=false}}
 async confirm(token){this.guard();if(this.busy)this.fail('CREATE_BUSY');const entry=this.previews.get(token);if(!entry)this.fail('CREATE_PREVIEW_REQUIRED');this.busy=true;try{const {plan,c}=entry;c.lease();const j=this.journal(true),job=await j.confirm(plan,{assertLease:c.lease,fresh:()=>this.build({...plan.input,domain:plan.domain,weekId:plan.weekId},plan.id,c,plan)});c.lease();this.previews.delete(token);return this.summary(job)}finally{this.busy=false}}
 factory(plan,c,control,warnings,journal){const out={};for(const s of plan.steps){const peer=c.peers.find(x=>x.id===s.owner),call=async phase=>{
    c.lease();control.assertLease();const job=await journal.read(plan.id);control.assertLease();
    const request={intent:this.copy(plan),step:this.copy(s),receipts:plan.steps.map(x=>({id:x.id,...job.progress[x.id]})),readConfirmedPlan:control.readConfirmedPlan,isCurrent:()=>{c.lease();control.assertLease();return true}};
    let result;if(s.owner==='project-execution-overview')result=await c.peo[phase](request);
    else if(s.owner==='workspace-mount')result=await peer.plugin.getManagedCreationStepOwnerV1(request)[phase](request);
    else if(s.owner==='collection-card-view')result=await peer.plugin.getCarrierCreationOwnerV1()[phase](request);
    else{const method=s.owner==='gtd-task-manager'?(phase==='inspect'?'inspectCreationStep':'commitCreationStep'):(phase==='inspect'?'inspectManagedContextCreationV1':'commitManagedContextCreationV1');result=await peer.api[method](request)}
    control.assertLease();c.lease();if(result?.uiWarning){warnings.push(s.id+': '+result.uiWarning);if(/UNSAVED|DRAFT|MEMORY|HISTORY/.test(result.uiWarning))return {state:'unknown',reason:String(result.uiWarning).slice(0,80)}}
    if(!['absent','pending','partial','verified','unknown','conflict'].includes(result?.state))return {state:'unknown'};
    return {...result,state:['absent','partial'].includes(result.state)?'pending':result.state};
   };out[s.id]={inspect:()=>call('inspect'),commit:()=>call('commit')};}return out;
 }
 async qualification(plan,c,live){live();
  // Explicit recovery may finish a proven creation without reviving a later stopped object.
  const weekly=plan.steps.find(s=>s.id==='mandala-weekly'),journal=this.journal(false);
  if(weekly&&journal){
   const readConfirmedPlan=async id=>{live();if(id!==plan.id)this.fail('CREATE_TX_CHANGED');const saved=await journal.read(id);live();if(JSON.stringify(saved.plan)!==JSON.stringify(plan))this.fail('CREATE_PLAN_CHANGED');return this.copy(saved.plan)};
   const inspected=await c.peers[3].api.inspectManagedContextCreationV1({intent:this.copy(plan),step:this.copy(weekly),readConfirmedPlan,isCurrent:()=>{live();return true}});live();
   if(inspected?.state==='verified'&&inspected.lifecycle==='stopped')return true;
  }
  await c.mandala.syncRelationAdapter();live();const method=plan.domain==='goal'?'listEffectiveGoalOperationalContextKeys':'listEffectiveOperationalContextKeys',result=await c.peers[3].api[method]({source:'managed-context-creation',limit:5000,readPurpose:'operation-check'});live();
  const nonempty=x=>typeof x==='string'&&!!x.trim();
  if(result?.ok!==true||result.readPurpose!=='operation-check'||result.writeAuthorization!==false||result.complete!==true||result.contractVersion!==1||result.snapshotType!==(plan.domain==='goal'?'mandala-effective-goal-operational-context-keys-v1':'mandala-effective-operational-context-keys-v1')||result.sourceScope!==plan.source||(!nonempty(result.providerGeneration)||result.providerGeneration!==c.mandala.effectiveOperationalContextProviderGeneration)||!nonempty(result.revision)||result.hasMore!==false||result.truncated!==false||!Array.isArray(result.items)||!Array.isArray(result.targets)||JSON.stringify(result.items)!==JSON.stringify(result.targets)||result.count!==result.items.length||result.returnedCount!==result.items.length||!Number.isSafeInteger(result.totalCount)||result.totalCount<result.items.length)return false;
  const declaration=plan.steps.find(s=>s.id==='peo-declaration').plan;
  const matches=result.items.filter(x=>x.sourceKey===declaration.nodeKey);if(matches.length!==1)return false;const t=matches[0];
  if(t.sourcePlugin!=='mandala-time-blocks'||t.sourceType!==plan.domain||t.domain!==plan.domain||t.sourceScope!==plan.source||t.identityVersion!==1||t.active!==true||t.lifecycleState!=='active'||t.contextKey?.displayLabel!==plan.input.contextKey||!nonempty(t.contextKey.id)||t.evidenceRevision!==result.revision||t.eligibilityRevision!==result.revision)return false;
  if(plan.domain==='goal'){const relation=plan.steps.find(s=>s.id==='eva-carrier').plan.relation,gtd=plan.steps.find(s=>s.id==='gtd-tag').plan,carrier=t.gtdCarrier;if(!carrier||carrier.nodeKey!==relation.targetNodeKey||carrier.relationId!==relation.id||carrier.relationType!=='承载'||carrier.tagId!==gtd.tagId)return false}return true;
 }
 async resume(txId){this.guard();if(this.busy)this.fail('CREATE_BUSY');this.busy=true;const warnings=[];
  // r33 P4: suspend observer navigation builds while the creation transaction runs (in-memory hold only; released in finally).
  let endHold=null;try{endHold=this.owner.trackingSnapshotHost?.beginWrite?.()||null}catch{endHold=null}
  try{const j=this.journal(false);if(!j)this.fail('CREATE_CONFIRMATION_MISSING');const job=await j.read(txId),c=this.capture();if(c.mandala.getPaths().sourceNotePath!==job.plan.source)this.fail('CREATE_SOURCE_CHANGED');const audit=window.__operationAuditTrailApi;let operation;try{operation=await this.audit(()=>audit?.beginOperation?.({'来源插件':'project-execution-overview','操作类型':'统一主键创建或恢复','修改摘要':'按已确认计划创建主键及跨插件载体','会话编号':txId,'对象名称':job.plan.input.contextKey,'结果':'pending'}))}catch{warnings.push('CREATE_AUDIT_BEGIN_FAILED')}c.lease();const runner=new CreationJournalModule.CreationProductionRunner({journal:j,assertLease:c.lease,owners:(p,control)=>this.factory(p,c,control,warnings,j),verifyIdentity:async()=>c.lease(),verifyFinal:(p,live)=>this.qualification(p,c,live)});const result=await runner.resume(txId);c.lease();try{if(operation?.operationId)await this.audit(()=>audit?.finishOperation?.(operation.operationId,{'结果':result.progress.status==='complete'?'success':'failed','失败原因':result.progress.reason,'扩展_context_creation_steps':result.plan.steps.map(s=>({id:s.id,owner:s.owner,source:s.source,...result.progress[s.id]}))}))}catch{warnings.push('CREATE_AUDIT_FINISH_FAILED')}c.lease();try{window.dispatchEvent(new CustomEvent('context-capsule-carrier:changed',{detail:{reason:'managed-context-created',providerId:'project-execution-overview'}}))}catch{warnings.push('CREATE_REFRESH_NOTIFICATION_FAILED')}return {ok:result.progress.status==='complete',...this.summary(result),warnings}}finally{this.busy=false;try{endHold?.()}catch{}}}
}

class ManagedContextCreationModal extends Modal {
 constructor(service,options={}){super(service.owner.app);this.service=service;this.options=options;this.busy=false;this.closed=false;this.token=null;this.txId=null;this.domain=options.domain==='goal'?'goal':'project';this.draftKey='managed-context-create-v1:'+service.owner.app.vault.adapter.getBasePath()+':'+this.domain;const close=this.close.bind(this);this.close=()=>{if(this.fields&&!this.saveDraft()){this.setStatus('草稿未能保存，请先复制填写内容再关闭。');return}this.closed=true;close()}}
 setStatus(text){this.status.textContent=text;if(this.footerStatus)this.footerStatus.textContent=text}
 el(tag,text,parent=this.contentEl){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.appendChild(e);return e}
 draft(){return {domain:this.domain,...Object.fromEntries(Object.entries(this.fields||{}).map(([k,e])=>[k,e.value]))}}
 saveDraft(){if(!this.fields)return true;try{const raw=JSON.stringify(this.draft());window.localStorage.setItem(this.draftKey,raw);return window.localStorage.getItem(this.draftKey)===raw}catch{return false}}
 async onOpen(){this.contentEl.empty();this.el('h2',this.options.pending?'继续未完成的创建':this.domain==='goal'?'新增九宫格目标':'新增项目');this.el('p','先预览各插件的创建范围，再确认保存。中途失败会保留进度；继续时核对原对象，不重复创建。');this.status=this.el('p','');this.details=this.el('div');this.adoption=this.el('div');this.fields=this.options.pending?null:{};
  if(!this.options.pending){let draft={};try{draft=JSON.parse(window.localStorage.getItem(this.draftKey)||'{}')}catch{}for(const [key,label,value] of [['projectName','项目 / 目标名称',''],['contextKey','有效操作上下文主键（含编号）',''],['importanceGroup','重要度：0、A、B、C、CZ','A'],['weekId','追踪周（例如 2026-W42）',this.options.weekId||this.isoWeek()],...([])]){this.el('label',label);const field=this.el('input');field.type='text';field.style.width='100%';field.maxLength=512;field.value=typeof draft[key]==='string'?draft[key]:value;field.oninput=()=>{this.token=null;this.confirmButton.disabled=true;this.saveDraft()};this.fields[key]=field}
   if(this.domain==='goal'){this.el('label','放入哪个九宫格');const field=this.el('select');field.style.width='100%';field.disabled=true;this.fields.parentNodeId=field;this.el('option','正在读取可用九宫格…',field);try{const parents=await this.service.parents();if(this.closed)return;field.replaceChildren();for(const item of parents){const option=this.el('option',item.label,field);option.value=item.id}const preferred=draft.parentNodeId||this.options.parentNodeId;if(parents.some(p=>p.id===preferred))field.value=preferred;field.disabled=false;if(!parents.length)this.setStatus('没有空位，请先在九宫格中留出一个位置。')}catch(e){this.setStatus('无法读取九宫格：'+(e.code||e.message))}field.onchange=()=>{this.token=null;this.confirmButton.disabled=true;this.saveDraft()}}
   this.previewButton=this.el('button','预览创建范围');this.confirmButton=this.el('button','确认创建并同步');this.confirmButton.disabled=true;this.previewButton.onclick=()=>this.run(async()=>{const d=this.draft(),stamp=JSON.stringify(d),r=await this.service.preview(d);if(this.closed||JSON.stringify(this.draft())!==stamp)return;this.token=r.token;this.render(r);this.confirmButton.disabled=false;this.setStatus('请核对名称、来源和创建步骤；尚未创建任何业务内容。')});this.confirmButton.onclick=()=>this.run(async()=>{if(!this.token)return;const token=this.token;this.setStatus('正在确认并创建同步，请稍候；请勿重复创建。');for(const f of Object.values(this.fields||{}))f.disabled=true;this.previewButton.disabled=true;this.confirmButton.disabled=true;let r;try{r=await this.service.confirm(token)}catch(e){for(const f of Object.values(this.fields||{}))f.disabled=false;this.previewButton.disabled=false;this.token=null;throw e}this.txId=r.txId;this.ownedDraftTx=r.txId;this.token=null;this.confirmButton.disabled=true;for(const f of Object.values(this.fields||{}))f.disabled=true;this.previewButton.disabled=true;this.render(await this.service.resume(this.txId))});
  }
  this.resumeButton=this.el('button','核验并继续创建');this.resumeButton.disabled=true;this.resumeButton.onclick=()=>this.run(async()=>{if(this.txId){this.setStatus('正在核验并继续已确认的创建，请稍候…');this.render(await this.service.resume(this.txId))}});
  this.footerStatus=this.el('p',this.status.textContent);this.footerStatus.setAttribute('role','status');this.footerStatus.setAttribute('aria-live','polite');this.doneButton=this.el('button','完成并关闭');this.doneButton.hidden=true;this.doneButton.onclick=()=>this.close();
  this.pending=this.el('div');this.pendingJobs=new Map();await this.run(async()=>{const jobs=await this.service.list();if(this.closed)return;this.pendingJobs=new Map(jobs.filter(j=>j.status!=='complete').map(j=>[j.txId,j]));this.renderPending()});this.loadAdoptable();
 }
 renderPending(){if(this.closed||!this.pending)return;this.pending.replaceChildren();this.el('h3','已确认但尚未完成',this.pending);if(!this.pendingJobs.size)this.el('p','没有未完成的创建。',this.pending);for(const job of this.pendingJobs.values()){const row=this.el('div',undefined,this.pending);this.el('p',`${job.domain==='goal'?'目标':'项目'}：${job.contextKey||job.txId}；来源：${job.source||''}`,row);const b=this.el('button','查看进度',row);b.onclick=()=>{if(this.busy)return;this.txId=job.txId;this.render(job);if(this.previewButton)this.previewButton.disabled=true;if(this.confirmButton)this.confirmButton.disabled=true;for(const f of Object.values(this.fields||{}))f.disabled=true}}this.renderAdoptable()}
 // P2-E: after a complete creation the center registers the object and claims its naming (center service; this modal
 // only asks and shows). Nothing here re-enables the creation inputs; closing does not cancel a started center call.
 centerAdoption(){try{const p=this.service.owner.app.plugins?.plugins?.['context-key-manager'],api=p?.getCreatedContextAdoptionV1?.();return api&&typeof api.adopt==='function'&&typeof api.statuses==='function'?api:null}catch{return null}}
 adoptionReason(r){const M={'tx-invalid':'创建编号无效','tx-not-found':'找不到这条创建记录','creation-not-complete':'创建尚未完成','peo-unavailable':'项目执行总览暂不可用','center-unavailable':'主键管理中心未加载或中心存储未配置','store-busy':'中心存储正在处理其他操作','not-effective':'对象当前不在有效列表中（可能已停止追踪，或新建的关系尚未同步）','ambiguous':'有效列表中有多个匹配对象，请在主键管理中心手动处理','subject-mismatch':'对象身份与创建记录不一致，已停止，请在主键管理中心手动核对','binding-mismatch':'对象的载体与创建记录不一致，已停止，请在主键管理中心手动核对','registered-legacy':'已登记身份，名称尚未交由中心维护','not-registered':'尚未登记身份','error':'处理失败','service-busy':'中心正在处理其他操作','legacy-writers-not-quiescent':'有未完成的旧改名或同步任务','adopt-not-converged':'多次尝试后状态仍在变化'};
  let t=M[r.state]||r.state||'未知状态';if(r.state==='not-effective'&&r.detail==='stopped')t='对象已停止追踪，未交由中心维护名称';if(r.code&&r.code!==r.state)t+='；原因：'+(M[r.code]||r.code);
  if(Array.isArray(r.pendingJobs)&&r.pendingJobs.length)t+='。存在未完成的任务：'+r.pendingJobs.map(j=>`${j.source||''}#${j.id||''}（${j.status||''}）`).join('、');return t}
 adoptAfter(txId){if(this.closed||!txId||!this.adoption||this.adoptingTx===txId)return;const api=this.centerAdoption();this.adoption.replaceChildren();
  if(!api){this.el('p','对象已创建。主键管理中心未加载，暂不能交由中心维护名称；加载中心后可在“未完成的创建”中继续。',this.adoption);return}
  this.adoptingTx=txId;this.el('p','正在登记并交由主键管理中心维护名称…关闭此窗口不会中断已开始的中心操作，结果可在“未完成的创建”中查看。',this.adoption);
  Promise.resolve().then(()=>api.adopt(txId)).then(r=>this.renderAdoption(txId,r),e=>this.renderAdoption(txId,{state:'error',code:String(e?.message||e).slice(0,160)})).finally(()=>{if(this.adoptingTx===txId)this.adoptingTx=null})}
 renderAdoption(txId,r){if(this.closed||!this.adoption)return;this.adoption.replaceChildren();
  if(r?.state==='center'){this.el('p','已登记，名称由主键管理中心维护；以后请在主键管理中心修改名称。',this.adoption);this.el('p',`对象：${r.label||''}（${r.contextId||''}）`,this.adoption);for(const b of r.bindings||[])this.el('p',`${b.ownerId} · ${b.sourceScope} · ${b.carrierId}`,this.adoption);if(this.adoptable){this.adoptable=this.adoptable.filter(j=>j.txId!==txId);this.renderPending()}return}
  this.el('p','对象已创建，但尚未交由中心维护名称：'+this.adoptionReason(r||{}),this.adoption);const b=this.el('button','在中心继续登记/接管',this.adoption);b.onclick=()=>this.adoptAfter(txId)}
 loadAdoptable(){const api=this.centerAdoption();if(!api)return;Promise.resolve().then(()=>api.statuses()).then(r=>{if(this.closed||!r?.ok)return;this.adoptable=r.jobs.filter(j=>j.state==='not-registered'||j.state==='registered-legacy');this.renderPending()},()=>{})}
 renderAdoptable(){if(!this.pending||!this.adoptable?.length)return;this.el('h3','已创建、尚未交由中心维护名称',this.pending);for(const job of this.adoptable){const row=this.el('div',undefined,this.pending);this.el('p',`${job.domain==='goal'?'目标':'项目'}：${job.label||job.txId}`,row);const b=this.el('button','继续登记/接管',row);b.onclick=()=>{if(this.busy)return;this.txId=job.txId;this.adoptAfter(job.txId)}}}
 isoWeek(){const d=new Date(),x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=x.getUTCFullYear(),w=Math.ceil(((x-new Date(Date.UTC(y,0,1)))/86400000+1)/7);return y+'-W'+String(w).padStart(2,'0')}
 render(r){if(this.closed)return;this.details.replaceChildren();for(const s of r.steps||[])this.el('p',`${s.owner} · ${s.id}：${s.state||'待确认'}；${s.source}`,this.details);for(const w of r.warnings||[])this.el('p','提示：'+w,this.details);if(r.status==='preview')return;this.txId=r.txId;if(this.pendingJobs){if(r.status==='complete')this.pendingJobs.delete(r.txId);else this.pendingJobs.set(r.txId,r);this.renderPending()}this.doneButton.hidden=r.status!=='complete';this.setStatus(r.status==='complete'?'创建记录与载体已核验完成；若已停止追踪，停止状态保持不变。':`创建尚未完成：${r.reason||r.status}。点击“核验并继续创建”处理已有记录。`);this.resumeButton.disabled=r.status==='complete';if(r.status==='complete'){try{if(this.ownedDraftTx===r.txId)window.localStorage.removeItem(this.draftKey)}catch{}this.fields=null;if(this.previewButton)this.previewButton.disabled=true;if(this.confirmButton){this.confirmButton.disabled=true;this.confirmButton.textContent='已完成创建并同步'}this.adoptAfter(r.txId)}}
 async run(fn){if(this.busy||this.closed)return;this.busy=true;try{await fn()}catch(e){if(!this.closed){this.setStatus('未完成：'+(e.code||e.message)+'。已填写内容和已确认记录会保留。');if(this.fields)this.saveDraft();this.resumeButton.disabled=!this.txId}}finally{this.busy=false}}
 onClose(){this.closed=true;this.contentEl.empty()}
}

const VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW = "project-execution-overview-view";
const PLUGIN_VERSION = "0.1.5";
const OPERATIONAL_CONTEXT_SNAPSHOT_CONTRACT_VERSION = 1;
const OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES = 500;
const TIMELINE_PLANNER_PLUGIN_ID = "timeline-planner";
const TIMELINE_MILESTONE_PROJECTION_LIMIT = 1000;
const DEFAULT_START_QUERY = "项目清单和执行待办事项汇总";
const ORDER_ROOT_PARENT = "__root__";
const ORDER_GLOBAL_GROUP = "__global__";
const PEO_DND_TYPE = "application/x-project-execution-overview-order";
const SUPERMEMO_PLAN_VIEW_TYPES = new Set(["supermemo-plan-view", "supermemo-plan"]);
const SUPERMEMO_PLAN_STATUS_META_LABELS = ["status", "Status", "\u72b6\u6001", "\u00d7\u00b4\u00cc\u00ac"];
const EVA_NOTES_CANDIDATE_PATHS = [
  "项目/18-战略视图迭代/18E-GTD夹子/18E1-下一步代办事项清单文件夹/下一步代办的liner chain/EVA_Notes.json",
  "EVA_Notes.json",
  "data/EVA_Notes.json",
];

const DEFAULT_SETTINGS = {
  startQuery: DEFAULT_START_QUERY,
  startNodeKey: "",
  groupingMode: "workspace",
  enabledSources: {
    workspace: true,
    mandala: true,
    gtd: true,
    timeline: true,
    collection: true,
    keyword: true,
    paradigm: true,
  },
  collapsedColumns: {},
  commentsByNodeKey: {},
  manualOrders: {},
  firstSeenOrderByScope: {},
  groupCapsuleLevels: {},
  keywordNoteBindingsByNodeKey: {},
  primaryKeyLifecycleById: {},
  primaryKeyLifecycleRevision: 0,
};

const PROJECT_OVERVIEW_CAPSULE_SCHEMA_VERSION = "project-execution-overview-capsule-v2";
const GROUP_CAPSULE_LEVELS = ["0", "A", "B", "C", "CZ"];
const GROUP_CAPSULE_LEVEL_SORT_ORDER = ["A", "B", "C", "CZ", "0"];
const GROUP_CAPSULE_LEVEL_SORT_RANK = GROUP_CAPSULE_LEVEL_SORT_ORDER.reduce((acc, level, index) => {
  acc[level] = index;
  return acc;
}, {});
const GLOBAL_GROUP_CAPSULE_LEVELS = new Set(["0", "A", "CZ"]);

const GROUPING_MODES = [
  { id: "workspace", label: "Workspace 视图", primaryColumnId: "workspace" },
  { id: "mandala", label: "九宫格视图", primaryColumnId: "mandala" },
];

function normalizeGroupingMode(value, fallback = DEFAULT_SETTINGS.groupingMode) {
  const normalized = text(value);
  if (normalized === "timeline") return "workspace";
  return GROUPING_MODES.some((mode) => mode.id === normalized) ? normalized : fallback;
}

const MODEL_LIMITS = {
  maxNodes: 900,
  maxEdges: 1800,
  maxDepth: 2,
};
const CONTEXT_CARRIER_LIMITS = {
  perTargetPerProvider: 80,
  totalItems: 240,
};
const CONTEXT_CARRIER_HYDRATION_POLICY = {
  mode: "summary-first-visible-first-scaffold",
  visibleFirst: true,
  backgroundHydration: "deferred",
};
const CONTEXT_CARRIER_AUTO_REFRESH_DELAY_MS = 240;
const PRIMARY_KEY_LIFECYCLE_EVENT = "project-execution-overview:primary-key-lifecycle-changed";
const PRIMARY_KEY_LIFECYCLE_DOMAINS = new Set(["workspace", "mandala"]);
const PRIMARY_KEY_LIFECYCLE_EVENT_DELAY_MS = 80;
const CONTEXT_CARRIER_PROVIDER_IDS = new Set([
  "workspace-mount",
  "collection-card-view",
  "gtd-task-manager",
]);
const PEO_PERF_DIAG_FLAG = "__PEO_PERF_DIAG";

const AI_CONTEXT_EXPORT_VERSION = "project-overview-ai-context-v1";
const AI_CONTEXT_LIMITS = {
  maxItemsPerColumn: 20,
  maxRelations: 80,
  maxMandalaRows: 8,
  maxChars: 60000,
};

const COLUMN_DEFS = [
  { id: "workspace", label: "Workspace", aliases: ["workspace", "workspace-mount-view", "workspace-mount"] },
  { id: "mandala", label: "九宫格", aliases: ["mandala-time-blocks"] },
  { id: "keyword", label: "Keyword", aliases: ["keyword-index-plugin", "keyword-index-plugin-view"] },
  { id: "paradigm", label: "范式积累", aliases: [] },
  { id: "gtd", label: "GTD", aliases: ["gtd"] },
  { id: "collection", label: "Collection Card", aliases: ["collection-card-view", "collection"] },
  { id: "timeline", label: "Timeline", aliases: ["timeline", "supermemo-plan-view", "supermemo-plan"] },
];

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function isPeoPerfDiagEnabled() {
  try {
    return !!window?.[PEO_PERF_DIAG_FLAG];
  } catch (_) {
    return false;
  }
}

function peoNow() {
  try {
    return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
  } catch (_) {
    return Date.now();
  }
}

function logPeoPerf(event, payload = {}) {
  if (!isPeoPerfDiagEnabled()) return;
  console.info(`[ProjectOverview][perf.${event}]`, payload);
}

function nowMs() {
  try {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  } catch (_) {}
  return Date.now();
}

function clone(value, fallback = null) {
  try {
    return value == null ? fallback : JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function nowString() {
  return new Date().toISOString();
}

function markdownInline(value, fallback = "") {
  return text(value, fallback)
    .replace(/\r?\n+/g, " / ")
    .replace(/\|/g, "\\|")
    .trim();
}

function markdownBlock(value, maxLength = 1800) {
  const raw = text(value);
  if (!raw) return "";
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}\n\n[truncated ${normalized.length - maxLength} chars]`;
}

function projectMandalaImageFieldForAi(value) {
  let source = text(value);
  let imageCount = 0;
  const isImageTarget = (target) => /\.(?:png|jpe?g|webp|gif|bmp)(?:[?#].*)?$/i.test(text(target).replace(/^<|>$/g, ""));
  source = source.replace(/!\[\[([^\]]+)\]\]/g, (token, inner) => {
    const target = text(inner).split("|")[0];
    if (!isImageTarget(target)) return token;
    imageCount += 1;
    return "";
  });
  source = source.replace(/!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g, (token, target) => {
    if (!isImageTarget(target)) return token;
    imageCount += 1;
    return "";
  });
  const body = source.replace(/\n{3,}/g, "\n\n").trim();
  return [body, imageCount ? `[图片 ${imageCount} 张，见 Obsidian 附件]` : ""].filter(Boolean).join("\n");
}

function isContextCarrierDiagEnabled() {
  try {
    return typeof window !== "undefined"
      && (window.__PEO_CONTEXT_CARRIER_DIAG === true || window.__CONTEXT_CARRIER_DIAG === true);
  } catch (_) {
    return false;
  }
}

function previewContextCarrierText(value, maxLength = 40) {
  const normalized = text(value).replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function getContextCarrierMetaField(item = {}, label = "") {
  const normalizedLabel = text(label).toLocaleLowerCase();
  const fields = Array.isArray(item?.metaFields) ? item.metaFields : [];
  const field = fields.find((entry) => text(entry?.label).toLocaleLowerCase() === normalizedLabel);
  return text(field?.value);
}

function getWorkspaceCarrierSourceType(item = {}) {
  const pluginId = text(item?.sourcePlugin || item?.contextCarrier?.providerId);
  if (pluginId !== "workspace-mount") return "";
  const raw = text(
    item?.workspaceCarrierSourceType
      || item?.sourceType
      || item?.contextCarrier?.sourceType
      || getContextCarrierMetaField(item, "Source Type"),
    "tab",
  ).toLocaleLowerCase();
  if (raw === "paradigm") return "paradigm";
  return "tab";
}

function sampleContextCarrierItems(items = [], limit = 3) {
  return (Array.isArray(items) ? items : []).slice(0, limit).map((item) => ({
    labelPreview: previewContextCarrierText(item?.label || item?.title || item?.pathLabel || item?.nodeKey),
    nodeKey: text(item?.nodeKey),
    sourceType: text(item?.sourceType || item?.contextCarrier?.sourceType || getContextCarrierMetaField(item, "Source Type")),
    carrierId: text(item?.carrierId || item?.contextCarrier?.carrierId),
  }));
}

function stableContextCarrierValue(value) {
  if (Array.isArray(value)) return value.map((entry) => stableContextCarrierValue(entry));
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableContextCarrierValue(value[key]);
      return result;
    }, {});
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean" || value == null) return value;
  return String(value);
}

function hashContextCarrierProjection(value) {
  const source = String(value == null ? "" : value);
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function makeId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function encodeScopePart(value) {
  return encodeURIComponent(text(value, "_"));
}

function buildOrderScopeKey({ mode = "workspace", groupId = ORDER_GLOBAL_GROUP, columnId = "", parentNodeKey = ORDER_ROOT_PARENT } = {}) {
  return [
    "v1",
    encodeScopePart(mode),
    encodeScopePart(groupId || ORDER_GLOBAL_GROUP),
    encodeScopePart(columnId),
    encodeScopePart(parentNodeKey || ORDER_ROOT_PARENT),
  ].join("::");
}

function normalizeSettings(saved = {}) {
  const source = saved && typeof saved === "object" ? saved : {};
  return {
    ...PeoCreationModule.preserve(source),
    ...GoalPeoDeclarationModule.preservedSettings(source),
    ...CenterPeoProjectionModule.preservedSettings(source,GoalPeoDeclarationModule),
    startQuery: text(source.startQuery, DEFAULT_SETTINGS.startQuery),
    startNodeKey: text(source.startNodeKey),
    groupingMode: normalizeGroupingMode(source.groupingMode),
    enabledSources: Object.assign({}, DEFAULT_SETTINGS.enabledSources, source.enabledSources || {}),
    collapsedColumns: Object.assign({}, DEFAULT_SETTINGS.collapsedColumns, source.collapsedColumns || {}),
    commentsByNodeKey: source.commentsByNodeKey && typeof source.commentsByNodeKey === "object" ? source.commentsByNodeKey : {},
    manualOrders: source.manualOrders && typeof source.manualOrders === "object" ? source.manualOrders : {},
    firstSeenOrderByScope: normalizeOrderScopeMap(source.firstSeenOrderByScope),
    groupCapsuleLevels: source.groupCapsuleLevels && typeof source.groupCapsuleLevels === "object" ? source.groupCapsuleLevels : {},
    keywordNoteBindingsByNodeKey: normalizeKeywordNoteBindings(source.keywordNoteBindingsByNodeKey),
    primaryKeyLifecycleById: normalizePrimaryKeyLifecycleMap(source.primaryKeyLifecycleById),
    primaryKeyLifecycleRevision: Math.max(0, Number(source.primaryKeyLifecycleRevision || 0) || 0),
  };
}

function normalizePrimaryKeyLifecycleDomain(value = "") {
  const domain = text(value).toLocaleLowerCase();
  return PRIMARY_KEY_LIFECYCLE_DOMAINS.has(domain) ? domain : "";
}

function buildPrimaryKeyLifecycleId(domain = "", primaryNodeKey = "") {
  const normalizedDomain = normalizePrimaryKeyLifecycleDomain(domain);
  const nodeKey = text(primaryNodeKey);
  return normalizedDomain && nodeKey ? `${normalizedDomain}::${nodeKey}` : "";
}

function normalizePrimaryKeyLifecycleMap(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.values(value).forEach((entry) => {
    const domain = normalizePrimaryKeyLifecycleDomain(entry?.domain);
    const primaryNodeKey = text(entry?.primaryNodeKey);
    const lifecycleKey = buildPrimaryKeyLifecycleId(domain, primaryNodeKey);
    if (!lifecycleKey) return;
    result[lifecycleKey] = {
      lifecycleKey,
      domain,
      primaryNodeKey,
      status: entry?.status === "killed" ? "killed" : "active",
      label: text(entry?.label),
      contextKeyId: text(entry?.contextKeyId),
      killedAt: text(entry?.killedAt),
      revivedAt: text(entry?.revivedAt),
      updatedAt: text(entry?.updatedAt),
    };
  });
  return result;
}

function normalizeKeywordNoteBindings(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.entries(value).forEach(([nodeKey, binding]) => {
    const key = text(nodeKey);
    if (!key) return;
    if (typeof binding === "string") {
      const path = text(binding);
      if (path) result[key] = { path, ctime: null };
      return;
    }
    if (!binding || typeof binding !== "object" || Array.isArray(binding)) return;
    const path = text(binding.path);
    const ctime = Number.isFinite(Number(binding.ctime)) ? Number(binding.ctime) : null;
    if (path || Number.isFinite(ctime)) result[key] = { path, ctime };
  });
  return result;
}

function normalizeOrderScopeMap(value) {
  const result = {};
  if (!value || typeof value !== "object") return result;
  Object.entries(value).forEach(([scopeKey, order]) => {
    if (!Array.isArray(order)) return;
    const keys = [];
    order.forEach((nodeKey) => {
      const key = text(nodeKey);
      if (key && !keys.includes(key)) keys.push(key);
    });
    if (keys.length > 0) result[text(scopeKey)] = keys;
  });
  return result;
}

function normalizeCapsuleLevel(value) {
  const level = text(value).toUpperCase();
  return GROUP_CAPSULE_LEVELS.includes(level) ? level : "C";
}

function isGlobalGroupCapsuleLevel(level) {
  return GLOBAL_GROUP_CAPSULE_LEVELS.has(normalizeCapsuleLevel(level));
}

function getCapsuleLevelRank(level) {
  const normalized = normalizeCapsuleLevel(level);
  return Number.isFinite(GROUP_CAPSULE_LEVEL_SORT_RANK[normalized])
    ? GROUP_CAPSULE_LEVEL_SORT_RANK[normalized]
    : GROUP_CAPSULE_LEVEL_SORT_RANK.C;
}

function buildGroupCapsuleKey(mode, groupId) {
  return `${text(mode, DEFAULT_SETTINGS.groupingMode)}::${text(groupId)}`;
}

function normalizeGroupCapsuleLevelMap(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  Object.entries(value).forEach(([key, level]) => {
    const normalizedKey = text(key);
    if (!normalizedKey) return;
    result[normalizedKey] = normalizeCapsuleLevel(level);
  });
  return result;
}

function splitGroupCapsuleLevelsByScope(value) {
  const globalLevels = {};
  const localLevels = {};
  Object.entries(normalizeGroupCapsuleLevelMap(value)).forEach(([key, level]) => {
    if (isGlobalGroupCapsuleLevel(level)) globalLevels[key] = level;
    else localLevels[key] = level;
  });
  return { globalLevels, localLevels };
}

function normalizeProjectOverviewCapsuleState(state = {}) {
  const selectedGroupsByScope = {};
  const legacyTimelineSelections = [];
  const incomingSelections = state?.selectedGroupsByScope;
  if (incomingSelections && typeof incomingSelections === "object" && !Array.isArray(incomingSelections)) {
    Object.entries(incomingSelections).forEach(([rawScopeKey, rawSelection]) => {
      if (!rawSelection || typeof rawSelection !== "object" || Array.isArray(rawSelection)) return;
      const rawParts = text(rawScopeKey).split("::");
      const requestedGroupingMode = text(rawSelection.groupingMode || rawParts[0], DEFAULT_SETTINGS.groupingMode);
      const groupingMode = normalizeGroupingMode(requestedGroupingMode);
      const viewMode = text(rawSelection.viewMode || rawParts[1]).toLowerCase() === "kill" ? "kill" : "normal";
      const scopeKey = `${groupingMode}::${viewMode}`;
      const groupId = text(rawSelection.groupId);
      const primaryNodeKey = text(rawSelection.primaryNodeKey);
      if (!groupId && !primaryNodeKey) return;
      const normalizedSelection = {
        groupingMode,
        viewMode,
        groupId,
        primaryNodeKey,
      };
      if (requestedGroupingMode === "timeline" || rawParts[0] === "timeline") {
        legacyTimelineSelections.push({ scopeKey, selection: normalizedSelection });
        return;
      }
      selectedGroupsByScope[scopeKey] = normalizedSelection;
    });
  }
  legacyTimelineSelections.forEach(({ scopeKey, selection }) => {
    if (!selectedGroupsByScope[scopeKey]) selectedGroupsByScope[scopeKey] = selection;
  });
  const activeScopeParts = text(state?.activeScopeKey).split("::");
  const activeGroupingMode = activeScopeParts[0] ? normalizeGroupingMode(activeScopeParts[0], "") : "";
  const activeScopeKey = activeGroupingMode
    ? `${activeGroupingMode}::${activeScopeParts[1] === "kill" ? "kill" : "normal"}`
    : "";
  return {
    schemaVersion: PROJECT_OVERVIEW_CAPSULE_SCHEMA_VERSION,
    groupCapsuleLevels: normalizeGroupCapsuleLevelMap(state?.groupCapsuleLevels),
    selectedGroupsByScope,
    activeScopeKey,
  };
}

function getCommentSummary(commentText) {
  const value = text(commentText).replace(/\s+/g, " ");
  return value.length > 100 ? `${value.slice(0, 100)}...` : value;
}

function getCommentPreview(commentText) {
  const value = String(commentText == null ? "" : commentText).trim();
  return value.length > 1200 ? `${value.slice(0, 1200)}\n……` : value;
}

function upsertProjectMetaComment(existingComment = "", meta = {}) {
  const contextKey = text(meta.contextKey);
  const body = String(existingComment == null ? "" : existingComment).trim();
  const lines = body ? body.split(/\r?\n/) : [];
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (text(lines[i]) === "---") {
      if (start < 0) start = i;
      else {
        end = i;
        break;
      }
    }
  }
  const shouldReplaceLeadingBlock = start === 0 && end > start && lines.slice(start + 1, end).some((line) => {
    const trimmed = text(line);
    if (!trimmed) return false;
    if (parseContextCapsuleKeyword(trimmed).address) return true;
    const sep = String(line || "").indexOf(":");
    if (sep <= 0) return false;
    const key = text(String(line || "").slice(0, sep)).toLocaleLowerCase();
    return key === "context_key" || key === "operation_context_key" || key === "project_name" || key === "importance_group";
  });
  const rest = shouldReplaceLeadingBlock ? lines.slice(end + 1).join("\n").trim() : body;
  const block = contextKey ? ["---", contextKey, "---"] : [];
  if (!block.length) return rest;
  return rest ? `${block.join("\n")}\n\n${rest}` : block.join("\n");
}

function extractGroupKeywordsFromComment(commentText, options = {}) {
  const lines = String(commentText == null ? "" : commentText).split(/\r?\n/);
  const keywords = [];
  const normalizeKeywordLine = (line) => {
    const raw = String(line || "");
    const trimmed = text(raw);
    if (!trimmed) return "";
    const sep = raw.indexOf(":");
    if (sep > 0) {
      const key = text(raw.slice(0, sep)).toLocaleLowerCase();
      const value = text(raw.slice(sep + 1));
      if (key === "context_key" || key === "operation_context_key") return value;
      if (key === "project_name" || key === "importance_group") return "";
    }
    return trimmed;
  };
  let inKeywordBlock = false;
  let blockKeywords = [];
  for (const line of lines) {
    const trimmed = text(line);
    if (trimmed === "---") {
      if (inKeywordBlock) {
        keywords.push(...blockKeywords);
        blockKeywords = [];
        inKeywordBlock = false;
        continue;
      }
      inKeywordBlock = true;
      blockKeywords = [];
      continue;
    }
    if (inKeywordBlock) {
      const keyword = normalizeKeywordLine(line);
      if (keyword) blockKeywords.push(keyword);
    }
  }
  return options.preserveDuplicates === true ? keywords : Array.from(new Set(keywords));
}

function extractGroupKeywordDeclarationsFromComment(commentText, primaryNodeKey = "") {
  const occurrenceByKeyword = new Map();
  return extractGroupKeywordsFromComment(commentText, { preserveDuplicates: true }).map((keyword) => {
    const normalizedKeyword = text(keyword).toLocaleLowerCase();
    const occurrence = occurrenceByKeyword.get(normalizedKeyword) || 0;
    occurrenceByKeyword.set(normalizedKeyword, occurrence + 1);
    return {
      keyword,
      declarationId: `cck_comment_${hashContextKey(`${text(primaryNodeKey)}\u0000${normalizedKeyword}\u0000${occurrence}`)}`,
      occurrence,
    };
  });
}

function normalizeContextCapsuleDisplayLabel(value) {
  return parseContextCapsuleKeyword(value).displayLabel || text(value);
}

function detectContextCapsuleKeyRenameFromComments(previousComment = "", nextComment = "") {
  const previousLabels = extractGroupKeywordsFromComment(previousComment)
    .map((keyword) => normalizeContextCapsuleDisplayLabel(keyword))
    .filter(Boolean);
  const nextLabels = extractGroupKeywordsFromComment(nextComment)
    .map((keyword) => normalizeContextCapsuleDisplayLabel(keyword))
    .filter(Boolean);
  const previousSet = new Set(previousLabels.map((label) => label.toLocaleLowerCase()));
  const nextSet = new Set(nextLabels.map((label) => label.toLocaleLowerCase()));
  const removed = previousLabels.filter((label) => !nextSet.has(label.toLocaleLowerCase()));
  const added = nextLabels.filter((label) => !previousSet.has(label.toLocaleLowerCase()));
  if (removed.length !== 1 || added.length !== 1) return null;
  const oldDisplayLabel = removed[0];
  const newDisplayLabel = added[0];
  if (!oldDisplayLabel || !newDisplayLabel || oldDisplayLabel.toLocaleLowerCase() === newDisplayLabel.toLocaleLowerCase()) return null;
  return {
    oldDisplayLabel,
    newDisplayLabel,
    oldParsed: parseContextCapsuleKeyword(oldDisplayLabel),
    newParsed: parseContextCapsuleKeyword(newDisplayLabel),
  };
}

function extractContextCapsuleKeyFromTextBlock(value = "") {
  const raw = String(value == null ? "" : value);
  const patterns = [
    /(?:操作上下文主键|操作上下文主鍵)\s*[:：]\s*([^\r\n]+)/i,
    /(?:context_key|operation_context_key)\s*[:：]\s*([^\r\n]+)/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    const candidate = text(match?.[1]);
    if (candidate) return normalizeContextCapsuleDisplayLabel(candidate);
  }
  return "";
}

function extractContextCapsuleKeyFromMetaFields(metaFields = []) {
  for (const field of Array.isArray(metaFields) ? metaFields : []) {
    const key = text(field?.key || field?.name || field?.label).toLocaleLowerCase();
    const value = text(field?.value || field?.text || field?.displayValue);
    if (!value) continue;
    if (key === "操作上下文主键" || key === "操作上下文主鍵" || key === "context_key" || key === "operation_context_key") {
      return normalizeContextCapsuleDisplayLabel(value);
    }
    const inline = extractContextCapsuleKeyFromTextBlock(`${field?.key || field?.label || ""}：${value}`);
    if (inline) return inline;
  }
  return "";
}

function hashContextKey(value) {
  const input = text(value).toLocaleLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function parseContextCapsuleKeyword(value) {
  const raw = text(value);
  const match = raw.match(/^([0-9]{1,4}[A-Za-z0-9]*)\s*[-－—–]\s*(.*)$/);
  if (!match) {
    return {
      address: "",
      canonicalLabel: raw,
      displayLabel: raw,
    };
  }
  const address = text(match[1]).toUpperCase();
  const canonicalLabel = text(match[2], raw);
  return {
    address,
    canonicalLabel,
    displayLabel: canonicalLabel ? `${address}- ${canonicalLabel}` : address,
  };
}

function parseStandaloneContextCapsuleAddress(value) {
  const raw = text(value);
  return /^[0-9]{1,4}[A-Za-z0-9]*$/.test(raw) ? raw.toUpperCase() : "";
}

function normalizeContextCapsuleKeyFromKeywordItem(item = {}) {
  const keyword = text(item.keyword);
  const parsed = parseContextCapsuleKeyword(keyword);
  const standaloneAddress = parseStandaloneContextCapsuleAddress(keyword);
  const basis = parsed.address || parsed.displayLabel || keyword;
  if (!basis) return null;
  const explicitId = text(item.contextKeyId || item.stableId || item.id);
  const id = explicitId || (parsed.address
    ? `cck_addr_${parsed.address.toLocaleLowerCase()}_${hashContextKey(parsed.displayLabel || keyword)}`
    : `cck_label_${hashContextKey(parsed.displayLabel || keyword)}`);
  return {
    contextKeyId: id,
    declarationEvidenceId: text(item.declarationId, id),
    address: parsed.address || standaloneAddress,
    canonicalLabel: parsed.canonicalLabel,
    displayLabel: parsed.displayLabel || keyword,
    color: text(item.color),
    icon: text(item.icon),
    source: "project-execution-overview",
    sourceMode: text(item.mode),
    sourceGroupId: text(item.groupId),
    sourceGroupTitle: text(item.groupTitle),
    primaryNodeKey: text(item.primaryNodeKey),
  };
}

function buildContextCapsuleKeysFromKeywordItems(items = []) {
  const byId = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = normalizeContextCapsuleKeyFromKeywordItem(item);
    if (!key?.contextKeyId || byId.has(key.contextKeyId)) return;
    byId.set(key.contextKeyId, key);
  });
  return Array.from(byId.values()).sort((left, right) => {
    const leftAddress = text(left.address);
    const rightAddress = text(right.address);
    if (leftAddress && rightAddress) return leftAddress.localeCompare(rightAddress, "zh", { numeric: true });
    if (leftAddress) return -1;
    if (rightAddress) return 1;
    return text(left.displayLabel).localeCompare(text(right.displayLabel), "zh");
  });
}

function parseProjectKeywordAddress(value) {
  const raw = text(value);
  const match = raw.match(/^([0-9]{1,4}[A-Za-z0-9]*)\s*[-－—–]\s*(.*)$/);
  if (!match) return null;
  const address = text(match[1]).toUpperCase();
  const tokens = [];
  const tokenPattern = /(\d+|[A-Z]+)/g;
  let tokenMatch = null;
  while ((tokenMatch = tokenPattern.exec(address)) !== null) {
    const part = tokenMatch[0];
    tokens.push(/^\d+$/.test(part) ? { type: "number", value: Number(part), raw: part } : { type: "text", value: part, raw: part });
  }
  if (!tokens.length || !Number.isFinite(tokens[0]?.value)) return null;
  return {
    address,
    tokens,
    rest: text(match[2]),
  };
}

function compareProjectKeywordLabels(left, right) {
  const a = text(left);
  const b = text(right);
  const aAddress = parseProjectKeywordAddress(a);
  const bAddress = parseProjectKeywordAddress(b);
  if (aAddress && bAddress) {
    const maxLength = Math.max(aAddress.tokens.length, bAddress.tokens.length);
    for (let index = 0; index < maxLength; index += 1) {
      const aToken = aAddress.tokens[index];
      const bToken = bAddress.tokens[index];
      if (!aToken || !bToken) return aToken ? 1 : -1;
      if (aToken.type === bToken.type) {
        const tokenDiff = aToken.type === "number"
          ? aToken.value - bToken.value
          : aToken.value.localeCompare(bToken.value, "zh-CN", { numeric: true, sensitivity: "base" });
        if (tokenDiff) return tokenDiff;
        continue;
      }
      return aToken.type === "number" ? -1 : 1;
    }
    const restDiff = aAddress.rest.localeCompare(bAddress.rest, "zh-CN", { numeric: true, sensitivity: "base" });
    if (restDiff) return restDiff;
  } else if (aAddress || bAddress) {
    return aAddress ? -1 : 1;
  }
  return a.localeCompare(b, "zh-CN", { numeric: true, sensitivity: "base" });
}

function compareGlobalKeywordNavItems(left = {}, right = {}) {
  const keywordDiff = compareProjectKeywordLabels(left.keyword, right.keyword);
  if (keywordDiff) return keywordDiff;
  const leftModeRank = GROUPING_MODES.findIndex((mode) => mode.id === left.mode);
  const rightModeRank = GROUPING_MODES.findIndex((mode) => mode.id === right.mode);
  const modeDiff = (leftModeRank < 0 ? 999 : leftModeRank) - (rightModeRank < 0 ? 999 : rightModeRank);
  if (modeDiff) return modeDiff;
  return text(left.groupTitle, left.groupId).localeCompare(text(right.groupTitle, right.groupId), "zh-CN", { numeric: true, sensitivity: "base" });
}

function isArchivedProjectKeywordLabel() { return false; } // Number prefixes no longer express lifecycle.

class ProjectOverviewCommentModal extends Modal {
  constructor(app, options = {}) {
    super(app);
    this.options = options;
    this.result = null;
    this.didExplicitCancel = false;
    this.textareaEl = null;
    this.waiter = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  onOpen() {
    const { contentEl } = this;
    const { title = "评论", value = "", label = "", sourceInfo = [] } = this.options;
    this.result = null;
    this.didExplicitCancel = false;
    contentEl.empty();
    this.modalEl.style.maxWidth = "1100px";
    this.modalEl.style.width = "92vw";
    this.modalEl.style.height = "78vh";
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.height = "100%";
    contentEl.style.gap = "10px";
    contentEl.createEl("h3", { text: title });
    if (label) contentEl.createEl("div", { text: label, cls: "peo-comment-target" });
    if (Array.isArray(sourceInfo) && sourceInfo.length > 0) {
      const sourceBox = contentEl.createDiv({ cls: "peo-comment-source-box" });
      sourceBox.createDiv({ cls: "peo-comment-source-title", text: "来源信息（只读）" });
      sourceInfo.forEach((entry) => {
        if (!entry?.value) return;
        const row = sourceBox.createDiv({ cls: "peo-comment-source-row" });
        row.createSpan({ cls: "peo-comment-source-key", text: entry.label });
        row.createSpan({ cls: "peo-comment-source-value", text: entry.value });
      });
    }    contentEl.createEl("div", { text: "评论只保存在项目执行总览插件内，不写回 EVA 或源插件。", cls: "peo-comment-desc" });
    if (this.options.keywordNoteBinding) this.renderKeywordNoteBindingSection(contentEl);
    const textarea = contentEl.createEl("textarea", { text: value, cls: "peo-comment-textarea" });
    this.textareaEl = textarea;
    textarea.placeholder = "记录判断、推进原因、补充说明、执行细节...";
    textarea.focus();
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
    const counter = contentEl.createEl("div", { cls: "peo-comment-counter" });
    const updateCounter = () => { counter.textContent = `${textarea.value.length} 字`; };
    textarea.addEventListener("input", updateCounter);
    textarea.addEventListener("input", () => {
      try { this.options.onDraft?.(textarea.value); this.draftSaveFailed = false; }
      catch (error) { this.draftSaveFailed = true; new Notice(error.message || "草稿未能保存，请保留窗口"); }
    });
    updateCounter();
    this.saveStatus = contentEl.createEl("div", { attr: { role: "status", "aria-live": "polite" } });
    this.errorDetails = contentEl.createEl("details");
    this.errorDetails.createEl("summary", { text: "查看原因" });
    this.errorText = this.errorDetails.createEl("pre");
    this.errorText.style.whiteSpace = "pre-wrap";
    this.errorDetails.hidden = true;
    const actions = contentEl.createDiv({ cls: "peo-comment-actions" });
    const clearBtn = actions.createEl("button", { text: "清空评论" });
    clearBtn.onclick = () => this.submitComment({ action: "clear" });
    const cancelBtn = actions.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => { this.didExplicitCancel = true; this.close(); };
    const saveBtn = actions.createEl("button", { text: "保存评论", cls: "mod-cta" });
    saveBtn.onclick = () => this.submitComment({ action: "save", value: textarea.value });
    this.saveControls = [clearBtn, saveBtn];
  }

  async submitComment(result) {
    if (!this.options.onSubmit) { this.result = result; this.close(); return; }
    if (this.saving || this.savedOnce || this.editorClosed) return;
    const alive = () => !this.editorClosed && (!this.options.isLive || this.options.isLive());
    if (!alive()) { this.saveStatus.textContent = "插件已重新加载，请保留草稿后重新打开。"; return; }
    this.saving = true;
    for (const el of [...this.saveControls, this.textareaEl]) el.disabled = true;
    this.saveStatus.textContent = "正在保存，请稍候…";
    try {
      this.closedDraft = this.textareaEl.value;
      this.options.onDraft?.(this.closedDraft);
      const outcome = await this.options.onSubmit(result, alive, this.closedDraft);
      if (!alive()) return;
      this.savedOnce = true;
      this.skipDraftOnClose = true;
      this.result = { ...result, saved: true };
      if (outcome?.warning) { this.saveStatus.textContent = outcome.warning; return; }
      this.skipDraftOnClose = true;
      this.saving = false;
      this.close();
    } catch (error) {
      if (!alive()) return;
      const code = String(error?.message || error);
      this.saveStatus.textContent = /MANAGED_DECLARATION_CHANGED|managed-binding/.test(code)
        ? "未保存：这个主键的名称由管理中心维护。请在管理中心改名；当前评论草稿仍保留。"
        : /unsupported-binding-format|binding-format-unsupported/.test(code)
          ? "未保存：主键管理中心的绑定数据格式比本插件更新，请把本插件更新到匹配的版本；当前输入仍保留。"
        : /AUTHORITY|authority|recovery|presence|writer-fence/.test(code)
          ? "未保存：主键管理服务尚未就绪或需要恢复。请在管理中心核验后重试；当前输入仍保留。"
          : "保存未完成，请核对原因后重试。当前输入仍在窗口中；草稿是否保存请以提示为准。";
      this.errorText.textContent = code;
      this.errorDetails.hidden = false;
    } finally {
      this.saving = false;
      if (alive()) for (const el of [...this.saveControls, this.textareaEl]) el.disabled = !!this.savedOnce;
    }
  }

  close() {
    if (this.saving) return;
    if (!this.skipDraftOnClose && this.textareaEl && this.options.onDraft) {
      try { this.closedDraft = this.textareaEl.value; this.options.onDraft(this.closedDraft); this.draftSaveFailed = false; }
      catch (error) { this.draftSaveFailed = true; new Notice(error.message || "草稿保存失败，请保留窗口"); return; }
    }
    super.close();
  }

  onClose() {
    this.editorClosed = true;
    if (this.options.onSubmit && !this.skipDraftOnClose && !this.saving && this.textareaEl) { try { this.options.onDraft?.(this.textareaEl.value); } catch (error) { new Notice("窗口已关闭，但草稿未能保存：" + String(error?.message || error)); } }
    if (!this.result && !this.didExplicitCancel && !this.options.onSubmit) this.result = { action: "save", value: String(this.textareaEl?.value || "") };
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.width = "";
    this.modalEl.style.height = "";
    this.contentEl.style.display = "";
    this.contentEl.style.flexDirection = "";
    this.contentEl.style.height = "";
    this.contentEl.style.gap = "";
    this.textareaEl = null;
    this.contentEl.empty();
    this._resolve(this.result);
  }

  waitForResult() {
    this.open();
    return this.waiter;
  }

  renderKeywordNoteBindingSection(contentEl) {
    const binding = this.options.keywordNoteBinding || {};
    const section = contentEl.createDiv({ cls: "peo-comment-note-binding-section" });
    const head = section.createDiv({ cls: "peo-comment-note-binding-head" });
    head.createEl("span", { text: "Keyword bound note" });
    const boundRow = section.createDiv({ cls: `peo-comment-bound-note-row${binding.currentValue ? " has-binding" : ""}` });
    const renderBoundRow = (display = {}) => {
      const path = text(display.path || display.currentValue || "");
      const title = text(display.title || display.currentTitle || display.currentLabel || path);
      boundRow.empty();
      if (path) boundRow.addClass("has-binding");
      else boundRow.removeClass("has-binding");
      boundRow.createDiv({ cls: "peo-comment-bound-note-title", text: path ? title : "No bound note" });
      if (path) boundRow.createDiv({ cls: "peo-comment-bound-note-path", text: path });
      boundRow.onclick = path ? async () => {
        if (typeof binding.onOpen === "function") await binding.onOpen();
      } : null;
      return path;
    };
    let currentPath = renderBoundRow(binding);
    const actions = section.createDiv({ cls: "peo-comment-note-binding-actions" });
    const chooseBtn = actions.createEl("button", { text: binding.currentValue ? "Change Bound Note" : "Choose Bound Note" });
    chooseBtn.onclick = async () => {
      if (typeof binding.onChoose === "function") {
        const nextDisplay = await binding.onChoose();
        if (nextDisplay) {
          currentPath = renderBoundRow(nextDisplay);
          clearBtn.disabled = !currentPath;
          chooseBtn.textContent = currentPath ? "Change Bound Note" : "Choose Bound Note";
        }
      }
    };
    const clearBtn = actions.createEl("button", { text: "Clear Bound" });
    clearBtn.disabled = !binding.currentValue;
    clearBtn.onclick = async () => {
      if (typeof binding.onClear === "function") await binding.onClear();
      currentPath = renderBoundRow({});
      clearBtn.disabled = true;
      chooseBtn.textContent = "Choose Bound Note";
    };
  }
}

class ProjectOverviewNoteBindingModal extends Modal {
  constructor(app, options = {}) {
    super(app);
    this.options = options;
    this.result = null;
    this.didExplicitCancel = false;
    this.inputEl = null;
    this.listEl = null;
    this.noteIndex = Array.isArray(options.noteIndex) ? options.noteIndex : [];
    this.waiter = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  onOpen() {
    const { contentEl } = this;
    const { title = "Bind Note", value = "", label = "", currentLabel = "" } = this.options;
    this.result = null;
    this.didExplicitCancel = false;
    contentEl.empty();
    this.modalEl.style.maxWidth = "980px";
    this.modalEl.style.width = "88vw";
    this.modalEl.style.height = "72vh";
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.height = "100%";
    contentEl.style.gap = "10px";
    contentEl.createEl("h3", { text: title });
    if (label) contentEl.createEl("div", { text: label, cls: "peo-comment-target" });
    contentEl.createEl("div", { text: "Binding is stored only in Project Overview data. EVA is used only for note search candidates.", cls: "peo-comment-desc" });
    if (currentLabel) {
      const current = contentEl.createDiv({ cls: "peo-note-binding-current" });
      current.createSpan({ text: `Current: ${currentLabel}` });
      const openBtn = current.createEl("button", { text: "Open" });
      openBtn.onclick = async () => {
        if (typeof this.options.onOpenCurrent === "function") await this.options.onOpenCurrent();
      };
    }
    const input = contentEl.createEl("input", { type: "text", value, cls: "peo-note-binding-input" });
    this.inputEl = input;
    input.placeholder = "Type note title or path";
    const list = contentEl.createDiv({ cls: "peo-note-binding-results" });
    this.listEl = list;
    const renderList = () => {
      const query = text(input.value).toLowerCase();
      const items = this.noteIndex
        .filter((item) => !query || text(item.search || `${item.basename || ""} ${item.path || ""}`).toLowerCase().includes(query))
        .slice(0, 80);
      list.empty();
      if (items.length === 0) {
        list.createDiv({ cls: "peo-note-binding-empty", text: "No matching notes." });
        return;
      }
      items.forEach((item) => {
        const row = list.createDiv({ cls: "peo-note-binding-row" });
        row.createDiv({ cls: "peo-note-binding-title", text: item.basename || item.path });
        row.createDiv({ cls: "peo-note-binding-path", text: item.path });
        row.onclick = () => {
          this.result = { action: "save", value: item.path };
          this.close();
        };
      });
    };
    input.addEventListener("input", renderList);
    renderList();
    input.focus();
    input.selectionStart = input.value.length;
    input.selectionEnd = input.value.length;
    const actions = contentEl.createDiv({ cls: "peo-comment-actions" });
    const clearBtn = actions.createEl("button", { text: "Clear Binding" });
    clearBtn.onclick = () => { this.result = { action: "clear" }; this.close(); };
    const cancelBtn = actions.createEl("button", { text: "Cancel" });
    cancelBtn.onclick = () => { this.didExplicitCancel = true; this.close(); };
    const saveBtn = actions.createEl("button", { text: "Bind Input", cls: "mod-cta" });
    saveBtn.onclick = () => { this.result = { action: "save", value: input.value }; this.close(); };
  }

  onClose() {
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.width = "";
    this.modalEl.style.height = "";
    this.contentEl.style.display = "";
    this.contentEl.style.flexDirection = "";
    this.contentEl.style.height = "";
    this.contentEl.style.gap = "";
    this.inputEl = null;
    this.listEl = null;
    this.contentEl.empty();
    this._resolve(this.result);
  }

  waitForResult() {
    this.open();
    return this.waiter;
  }
}

class ProjectOverviewNoteChoiceModal extends Modal {
  constructor(app, options = {}) {
    super(app);
    this.options = options;
    this.result = null;
    this.waiter = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  onOpen() {
    const { contentEl } = this;
    const { title = "选择关联笔记", label = "", notes = [] } = this.options;
    this.result = null;
    contentEl.empty();
    this.modalEl.style.maxWidth = "980px";
    this.modalEl.style.width = "88vw";
    this.modalEl.style.height = "72vh";
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.height = "100%";
    contentEl.style.gap = "10px";
    contentEl.createEl("h3", { text: title });
    if (label) contentEl.createEl("div", { text: label, cls: "peo-comment-target" });
    const list = contentEl.createDiv({ cls: "peo-note-binding-results" });
    const rows = Array.isArray(notes) ? notes : [];
    if (rows.length === 0) {
      list.createDiv({ cls: "peo-note-binding-empty", text: "没有可打开的关联笔记" });
    }
    rows.forEach((note) => {
      const path = text(note?.path);
      const titleText = text(note?.title || note?.basename || path.split("/").pop()?.replace(/\.md$/i, "") || path);
      const row = list.createDiv({ cls: "peo-note-binding-row" });
      row.createDiv({ cls: "peo-note-binding-title", text: titleText });
      row.createDiv({ cls: "peo-note-binding-path", text: path });
      if (note?.keywordPath || note?.sourceType) {
        row.createDiv({ cls: "peo-note-choice-meta", text: [note.keywordPath, note.sourceType].filter(Boolean).join(" · ") });
      }
      row.onclick = () => {
        this.result = note;
        this.close();
      };
    });
    const actions = contentEl.createDiv({ cls: "peo-comment-actions" });
    const cancelBtn = actions.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => { this.result = null; this.close(); };
  }

  onClose() {
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.width = "";
    this.modalEl.style.height = "";
    this.contentEl.style.display = "";
    this.contentEl.style.flexDirection = "";
    this.contentEl.style.height = "";
    this.contentEl.style.gap = "";
    this.contentEl.empty();
    this._resolve(this.result);
  }

  waitForResult() {
    this.open();
    return this.waiter;
  }
}

class ContextCapsuleRenameConfirmModal extends Modal {
  constructor(app, options = {}) {
    super(app);
    this.options = options;
    this.result = false;
    this.waiter = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  onOpen() {
    const { contentEl } = this;
    const { oldDisplayLabel = "", newDisplayLabel = "", previews = [] } = this.options;
    contentEl.empty();
    this.modalEl.style.maxWidth = "720px";
    this.modalEl.style.width = "min(720px, 92vw)";
    contentEl.createEl("h3", { text: "同步修改操作上下文主键？" });
    contentEl.createDiv({
      cls: "peo-context-key-rename-desc",
      text: this.options.repair ? "这是同编号旧关键词修复。确认后记录下列插件的目标并逐项核验；不可用插件保留待处理，不自动扩大修复范围。Workspace 只修改 Tab 关键词。" : "确认后保存同步进度，再修改已绑定的旧主键并逐项回读核验。不可用插件恢复后补齐；Workspace 只修改 Tab 关键词，不修改范式、评论或标题。",
    });
    const diffBox = contentEl.createDiv({ cls: "peo-context-key-rename-diff" });
    diffBox.createDiv({ cls: "peo-context-key-rename-old", text: `旧：${oldDisplayLabel}` });
    diffBox.createDiv({ cls: "peo-context-key-rename-new", text: `新：${newDisplayLabel}` });
    const list = contentEl.createDiv({ cls: "peo-context-key-rename-preview-list" });
    (Array.isArray(previews) ? previews : []).forEach((entry) => {
      const row = list.createDiv({ cls: `peo-context-key-rename-preview-row${entry?.ok === false ? " has-error" : ""}` });
      row.createSpan({ cls: "peo-context-key-rename-plugin", text: entry?.label || entry?.pluginId || "Unknown" });
      const matched = Number(entry?.matchedCount || 0);
      const conflicts = Array.isArray(entry?.conflicts) ? entry.conflicts.length : 0;
      const reason = entry?.reason ? `；${entry.reason}` : "";
      row.createSpan({ cls: "peo-context-key-rename-count", text: entry?.ok === false ? `不可用${reason}` : `将修改 ${matched} 处${conflicts ? `；冲突 ${conflicts} 处` : ""}` });
    });
    const actions = contentEl.createDiv({ cls: "peo-context-key-rename-actions" });
    if (this.options.recovery) {
      for (const entry of previews.filter(p => p.pending || p.excluded)) contentEl.createEl("p", { text: `${entry.label}：${entry.excluded ? "未启用，本次不参与" : "数量待确认，恢复可用后继续核验"}` });
    }
    const onlySaveBtn = actions.createEl("button", { text: "仅保存项目总览" });
    onlySaveBtn.onclick = () => { this.result = false; this.close(); };
    const syncBtn = actions.createEl("button", { text: "确认同步改名", cls: "mod-cta" });
    syncBtn.onclick = () => { this.result = true; this.close(); };
  }

  onClose() {
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.width = "";
    this.contentEl.empty();
    this._resolve(this.result === true);
  }

  waitForResult() {
    this.open();
    return this.waiter;
  }
}

function parseJumpNodeKey(nodeKey) {
  const raw = text(nodeKey);
  if (!raw.startsWith("jump:v1:")) return null;
  const parts = raw.slice("jump:v1:".length).split("|").map((part) => {
    try { return decodeURIComponent(part); } catch (_) { return part; }
  });
  if (parts.length !== 5) return null;
  return { viewType: parts[0], notePath: parts[1], scopeType: parts[2], scopeId: parts[3], itemId: parts[4] };
}

function decodeNodeKeyText(nodeKey) {
  return text(nodeKey).split("|").map((part) => {
    try { return decodeURIComponent(part); } catch (_) { return part; }
  }).join(" ");
}

function resolveBaseColumnId(record = {}) {
  const viewType = text(record.viewType).toLowerCase();
  const nodeKey = text(record.nodeKey).toLowerCase();
  const parsed = parseJumpNodeKey(record.nodeKey);
  const parsedViewType = text(parsed?.viewType).toLowerCase();
  if (isOrdinaryNoteRecord(record)) return "paradigm";
  for (const column of COLUMN_DEFS) {
    if (column.id === "paradigm") continue;
    if (column.aliases.some((alias) => viewType === alias || parsedViewType === alias || nodeKey.startsWith(`${alias}:`) || nodeKey.includes(`:${alias}:`))) return column.id;
  }
  if (viewType.includes("workspace")) return "workspace";
  if (viewType.includes("mandala")) return "mandala";
  if (viewType.includes("gtd")) return "gtd";
  if (viewType.includes("timeline")) return "timeline";
  if (viewType.includes("collection")) return "collection";
  if (viewType.includes("keyword")) return "keyword";
  return "other";
}

function isTimelineMilestoneProjectionItem(item = {}) {
  return item?.isTimelineMilestoneProjection === true;
}

function compareTimelineMilestoneProjectionItems(left = {}, right = {}) {
  return text(left.date).localeCompare(text(right.date))
    || (Number.isFinite(Number(left.timeBlockOrder)) ? Number(left.timeBlockOrder) : 7)
      - (Number.isFinite(Number(right.timeBlockOrder)) ? Number(right.timeBlockOrder) : 7)
    || text(left.milestoneName || left.label).localeCompare(text(right.milestoneName || right.label), "zh-CN", { numeric: true, sensitivity: "base" })
    || text(left.milestoneId).localeCompare(text(right.milestoneId), "zh-CN", { numeric: true, sensitivity: "base" });
}

function resolveTimelineItemId(record = {}) {
  const explicit = text(record.timelineItemId || record.itemId);
  if (explicit) return explicit;
  const parsed = parseJumpNodeKey(record.nodeKey);
  if (text(parsed?.viewType).toLowerCase().includes("timeline")) return text(parsed?.itemId);
  const nodeKey = text(record.nodeKey);
  const rawParts = nodeKey.split("|");
  if (rawParts.length >= 3 && text(rawParts[0]).toLowerCase() === "item" && text(rawParts[1]).toLowerCase().includes("timeline_data")) {
    return text(rawParts[rawParts.length - 1]);
  }
  return "";
}

function isOrdinaryNoteRecord(record = {}) {
  const viewType = text(record.viewType).toLowerCase();
  const parsedViewType = text(parseJumpNodeKey(record.nodeKey)?.viewType).toLowerCase();
  return viewType === "eva-note" || viewType === "markdown-note" || parsedViewType === "eva-note" || parsedViewType === "markdown-note";
}

function stripAtomAddressPrefix(value) {
  const original = text(value);
  if (!original) return "";
  return original.replace(/^ATOM@[\d\.A-Z\+]+\s*-\s*/i, "").trim() || original;
}

function getDisplayLabel(record = {}) {
  const label = text(record.label, record.nodeKey);
  return isOrdinaryNoteRecord(record) ? stripAtomAddressPrefix(label) : label;
}

function isSuperMemoPlanRecord(record = {}) {
  const viewType = text(record.viewType).toLowerCase();
  const parsedViewType = text(parseJumpNodeKey(record.nodeKey)?.viewType).toLowerCase();
  return SUPERMEMO_PLAN_VIEW_TYPES.has(viewType) || SUPERMEMO_PLAN_VIEW_TYPES.has(parsedViewType);
}

function getMetaFieldValue(record = {}, label = "") {
  if (Array.isArray(label)) {
    const targets = new Set(label.map((item) => text(item)).filter(Boolean));
    const field = (Array.isArray(record.metaFields) ? record.metaFields : [])
      .find((item) => targets.has(text(item?.label)) || targets.has(text(item?.key)));
    return text(field?.value);
  }
  const target = text(label);
  const field = (Array.isArray(record.metaFields) ? record.metaFields : [])
    .find((item) => text(item?.label) === target);
  return text(field?.value);
}

function getOrdinaryNotePath(record = {}) {
  if (!isOrdinaryNoteRecord(record)) return "";
  return getMetaFieldValue(record, ["path", "Path", "文件路径", "路径"])
    || text(record.pathLabel)
    || text(record.filePath)
    || text(record.notePath);
}

function normalizeNotePathKey(path) {
  return text(path).replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
}

function getRecordNotePath(record = {}) {
  const parsed = parseJumpNodeKey(record.nodeKey);
  return text(record.notePath || parsed?.notePath || record.pathLabel);
}

function isSuppressedOrdinaryNoteItem(item = {}) {
  return item?.columnId === "paradigm" && isOrdinaryNoteRecord(item) && Array.isArray(item.suppressedByCarrier) && item.suppressedByCarrier.length > 0;
}

function getSuperMemoPlanStatus(record = {}) {
  return getMetaFieldValue(record, "状态") || text(record.superMemoPlanStatus);
}

function isCompletedSuperMemoPlanRecord(record = {}) {
  return getSuperMemoPlanStatusRobust(record).toLowerCase() === "completed";
}

function getSuperMemoPlanStatusRobust(record = {}) {
  return text(record.superMemoPlanStatus)
    || text(record.status)
    || getMetaFieldValue(record, SUPERMEMO_PLAN_STATUS_META_LABELS)
    || getSuperMemoPlanStatus(record)
    || "pending";
}

function getSuperMemoPlanOrder(record = {}) {
  const order = Number(record.superMemoPlanOrder);
  return Number.isFinite(order) && order >= 0 ? order : 999999;
}

function getCarrierOrderValue(item = {}) {
  const order = Number(item?.contextCarrier?.order ?? item?.carrierOrder ?? item?.order);
  return Number.isFinite(order) ? order : 999999;
}

function getCarrierOrderPathValue(item = {}) {
  const path = Array.isArray(item?.contextCarrier?.orderPath)
    ? item.contextCarrier.orderPath
    : (Array.isArray(item?.carrierOrderPath) ? item.carrierOrderPath : (Array.isArray(item?.orderPath) ? item.orderPath : []));
  return path.map((part) => {
    const number = Number(part);
    return Number.isFinite(number) ? String(number).padStart(6, "0") : text(part);
  }).join(".");
}

function compareCarrierSourceOrder(a = {}, b = {}) {
  const aProvider = text(a?.contextCarrier?.providerId || a?.sourcePlugin);
  const bProvider = text(b?.contextCarrier?.providerId || b?.sourcePlugin);
  const aContextKey = text(a?.contextCarrier?.contextKey);
  const bContextKey = text(b?.contextCarrier?.contextKey);
  const aCarrierId = text(a?.contextCarrier?.carrierId);
  const bCarrierId = text(b?.contextCarrier?.carrierId);
  const sameCarrierScope = aProvider && aProvider === bProvider
    && aContextKey && aContextKey === bContextKey
    && aCarrierId && aCarrierId === bCarrierId;
  if (!sameCarrierScope) return null;
  const pathDiff = getCarrierOrderPathValue(a).localeCompare(getCarrierOrderPathValue(b), "zh-CN", { numeric: true, sensitivity: "base" });
  if (pathDiff) return pathDiff;
  const orderDiff = getCarrierOrderValue(a) - getCarrierOrderValue(b);
  if (orderDiff) return orderDiff;
  return 0;
}

function compareItemsByDepthLabel(a = {}, b = {}) {
  const carrierDiff = compareCarrierSourceOrder(a, b);
  if (carrierDiff != null && carrierDiff !== 0) return carrierDiff;
  const aIsSuperMemo = isSuperMemoPlanRecord(a);
  const bIsSuperMemo = isSuperMemoPlanRecord(b);
  if (aIsSuperMemo && bIsSuperMemo) {
    const orderDiff = getSuperMemoPlanOrder(a) - getSuperMemoPlanOrder(b);
    if (orderDiff) return orderDiff;
  }
  return `${a.depth || 0} ${a.label}`.localeCompare(`${b.depth || 0} ${b.label}`, "zh-CN", { numeric: true, sensitivity: "base" });
}

function resolveColumnId(record = {}, context = {}) {
  const baseColumnId = resolveBaseColumnId(record);
  if (baseColumnId !== "workspace") return baseColumnId;
  const workspaceStartNodeKeys = context.workspaceStartNodeKeys instanceof Set
    ? context.workspaceStartNodeKeys
    : (context.startNodeKeys instanceof Set ? context.startNodeKeys : new Set());
  if (workspaceStartNodeKeys.has(record?.nodeKey)) return "workspace";
  return "paradigm";
}

function getWorkspaceItemId(record = {}) {
  const nodeKey = text(record?.nodeKey);
  if (!nodeKey) return "";
  const parsed = parseJumpNodeKey(nodeKey);
  if (parsed?.itemId) return parsed.itemId;
  if (nodeKey.startsWith("workspace:tab_item:")) {
    return nodeKey.slice("workspace:tab_item:".length);
  }
  return nodeKey;
}

function getWorkspaceRecordPriority(record = {}) {
  const nodeKey = text(record?.nodeKey);
  const viewType = text(record?.viewType);
  if (nodeKey.startsWith("jump:v1:workspace-mount-view|")) return 0;
  if (viewType === "workspace-mount-view") return 1;
  if (viewType === "workspace") return 2;
  return 3;
}

function dedupeWorkspaceSeedRecords(records = []) {
  const byWorkspaceItemId = new Map();
  const deduped = [];
  const diagnostics = {
    input: Array.isArray(records) ? records.length : 0,
    workspace: 0,
    nonWorkspace: 0,
    replaced: 0,
    dropped: 0,
    collisions: [],
  };
  const rememberCollision = (entry) => {
    if (diagnostics.collisions.length < 8) diagnostics.collisions.push(entry);
  };
  for (const record of records || []) {
    if (!record?.nodeKey) continue;
    if (resolveBaseColumnId(record) !== "workspace") {
      diagnostics.nonWorkspace += 1;
      deduped.push(clone(record, {}));
      continue;
    }
    diagnostics.workspace += 1;
    const workspaceItemId = getWorkspaceItemId(record);
    const current = byWorkspaceItemId.get(workspaceItemId);
    if (!current) {
      const next = clone(record, {});
      byWorkspaceItemId.set(workspaceItemId, next);
      deduped.push(next);
      continue;
    }
    const currentPriority = getWorkspaceRecordPriority(current);
    const nextPriority = getWorkspaceRecordPriority(record);
    if (nextPriority < currentPriority) {
      const index = deduped.findIndex((item) => item?.nodeKey === current.nodeKey);
      const next = clone(record, {});
      byWorkspaceItemId.set(workspaceItemId, next);
      if (index >= 0) deduped[index] = next;
      diagnostics.replaced += 1;
      rememberCollision({
        itemId: workspaceItemId,
        action: "replace",
        currentNodeKey: text(current.nodeKey),
        currentLabel: getDisplayLabel(current),
        currentPriority,
        nextNodeKey: text(record.nodeKey),
        nextLabel: getDisplayLabel(record),
        nextPriority,
      });
    } else {
      diagnostics.dropped += 1;
      rememberCollision({
        itemId: workspaceItemId,
        action: "drop",
        currentNodeKey: text(current.nodeKey),
        currentLabel: getDisplayLabel(current),
        currentPriority,
        nextNodeKey: text(record.nodeKey),
        nextLabel: getDisplayLabel(record),
        nextPriority,
      });
    }
  }
  if (diagnostics.replaced > 0 || diagnostics.dropped > 0) {
    console.info("[ProjectOverview][workspace-seed.dedupe]", diagnostics);
  }
  return deduped;
}

function getEvaApi(app) {
  return app?.plugins?.plugins?.["eva-cross-view-relations"]?.api || window.evaCrossViewRelations || null;
}

function getEvaMetaCaptureApi(app) {
  const evaPlugin = app?.plugins?.plugins?.["eva-cross-view-relations"];
  const candidates = [
    typeof window !== "undefined" ? window.evaCrossViewRelations : null,
    evaPlugin?.api,
    evaPlugin,
  ];
  return candidates.find((api) => api && typeof api.captureMetaNode === "function") || null;
}

function makeStaticEvaFacade(state = {}) {
  const nodeIndexByKey = state.nodeIndexByKey || {};
  const relationsById = state.relationsById || {};
  return {
    __projectOverviewStaticFallback: true,
    getAllNodeRecords() {
      return Object.values(nodeIndexByKey).filter((record) => !!record?.nodeKey).map((record) => clone(record, {}));
    },
    searchNodes(query, options = {}) {
      const needle = text(query).toLowerCase();
      const limit = Math.max(1, Number(options.limit) || 50);
      return Object.values(nodeIndexByKey)
        .filter((record) => !!record?.nodeKey)
        .filter((record) => {
          if (!needle) return true;
          return `${record.label || ""} ${record.pathLabel || ""} ${record.searchText || ""} ${record.viewType || ""} ${decodeNodeKeyText(record.nodeKey)}`.toLowerCase().includes(needle);
        })
        .slice(0, limit)
        .map((record) => clone(record, {}));
    },
    getNodeRecord(nodeKey) {
      return clone(nodeIndexByKey[text(nodeKey)] || null, null);
    },
    getNodeRelationSnapshot(nodeKey) {
      const key = text(nodeKey);
      const outgoing = [];
      const incoming = [];
      Object.values(relationsById).forEach((relation) => {
        if (!relation) return;
        if (relation.sourceNodeKey === key) outgoing.push(Object.assign({}, clone(relation, {}), { target: clone(nodeIndexByKey[relation.targetNodeKey] || null, null) }));
        if (relation.targetNodeKey === key) incoming.push(Object.assign({}, clone(relation, {}), { source: clone(nodeIndexByKey[relation.sourceNodeKey] || null, null) }));
      });
      return { outgoing, incoming };
    },
  };
}

function createSvgElement(tag, className = "") {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (className) el.setAttribute("class", className);
  return el;
}

class ProjectExecutionOverviewSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Project Execution Overview" });
    new Setting(containerEl)
      .setName("起点搜索文本")
      .setDesc("用于在 EVA 节点索引中定位 workspace mount 起点条目。建议后续固定 startNodeKey。")
      .addText((input) => {
        input.setValue(this.plugin.settings.startQuery);
        input.onChange(async (value) => {
          this.plugin.settings.startQuery = value;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("固定起点 nodeKey")
      .setDesc("可选。填入后优先使用该 nodeKey，避免按文本搜索。")
      .addTextArea((input) => {
        input.setValue(this.plugin.settings.startNodeKey);
        input.onChange(async (value) => {
          this.plugin.settings.startNodeKey = value;
          await this.plugin.saveSettings();
        });
      });
  }
}

class ProjectExecutionOverviewView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.model = null;
    this.selectedNodeKey = "";
    this.lastRenderId = "";
    this.pendingItemRevealId = "";
    this.pendingItemReveal = null;
    this.confirmedItemReveal = null;
    this.lastScrollState = this.plugin.getRememberedScrollState?.() || null;
    this.restoreScrollToken = 0;
    this.scrollFrame = null;
    this.scrollCaptureTimer = null;
    this.lastLinkDrawAt = 0;
    this.lastAutoScrollAt = 0;
    this.globalKeywordNavItems = [];
    this.globalKeywordNavRenderToken = 0;
    this.killMode = false;
    this.selectedGroupIds = new Map();
    this.columnHierarchyCache = new Map();
    this.linkDrawTimer = null;
    this.contextCarrierClosed = false;
    this.contextCarrierRequestGeneration = 0;
    this.contextCarrierRefreshRunning = false;
    this.contextCarrierRefreshQueued = false;
    this.contextCarrierEventProgress = new Map();
    this.contextCarrierLastVisibilitySignature = "";
    this.contextCarrierDeferredProbeGeneration = 0;
  }

  getViewType() { return VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW; }
  getDisplayText() { return "项目执行总览"; }
  getIcon() { return "network"; }

  async loadTrackingEvidence(model, epoch) {
    const api = window.__mandalaTimeBlocksPluginApi;
    const current = () => !this.contextCarrierClosed && epoch === this.trackingEvidenceEpoch && api === window.__mandalaTimeBlocksPluginApi;
    const nav = await this.plugin.buildGlobalGroupKeywordNavItems().catch(() => []);
    if (!current()) return false;
    const navGroups = nav.flatMap(item => (item.sources?.length ? item.sources : [item]).map(source => ({ mode: source.mode, primaryNodeKey: source.primaryNodeKey })));
    const result = await this.plugin.getTrackingProjectionModule().collectTracking({ ...model, groups: [...(model.groups || []), ...navGroups] }, api, current);
    if (!current()) return false;
    this.trackingEvidence = result;
    this.trackingEvidenceApi = api;
    return true;
  }
  getUsableTrackingEvidence() {
    try {
    const api = window.__mandalaTimeBlocksPluginApi;
    const scope = api?.getContextTrackingScopeV1?.();
    if (api !== this.trackingEvidenceApi || !scope?.ok || scope.sourceScope !== this.trackingEvidence?.sourceScope || scope.providerGeneration !== this.trackingEvidence?.providerGeneration) return { ok: false, states: new Map(), error: "追踪服务已变化，请刷新" };
    return this.trackingEvidence;
    } catch (_) { return { ok: false, states: new Map(), error: "追踪来源暂不可核验，请刷新" }; }
  }
  queueTrackingDisplayRefresh() {
    if (this.contextCarrierClosed) return;
    if (this.trackingDisplayFlight) { this.trackingDisplayQueued = true; return; }
    this.trackingDisplayFlight = this.refresh({ preserveScroll: true, reason: "tracking-state-changed" }).catch(() => {}).finally(() => {
      this.trackingDisplayFlight = null;
      if (this.trackingDisplayQueued && !this.contextCarrierClosed) { this.trackingDisplayQueued = false; this.queueTrackingDisplayRefresh(); }
    });
  }
  projectTrackingGroups(groups, history = this.killMode) {
    const evidence = this.getUsableTrackingEvidence();
    return this.plugin.getTrackingProjectionModule().projectGroups({ ...this.model, groups }, evidence?.ok ? evidence.states : new Map(), history);
  }
  renderStoppedTrackingHistory(board) {
    const evidence = this.getUsableTrackingEvidence();
    board.createEl("p", { text: "已停止追踪 · 只读回看。周追踪的旧周记录仍可从原历史入口查看。" });
    if (!evidence?.ok) { board.createEl("p", { text: evidence?.error || "追踪状态暂不可用，请刷新" }); return; }
    const groups = this.getSortedGroupsForCurrentView();
    if (!groups.length) { board.createEl("p", { text: "当前来源没有已停止追踪的胶囊。" }); return; }
    const selected = this.resolveSelectedGroup(groups) || groups[0];
    const nav = board.createDiv({ cls: "peo-group-capsules" });
    nav.createDiv({ cls: "peo-group-capsules-header", text: `已停止追踪 · ${groups.length} 组` });
    const navBody = nav.createDiv({ cls: "peo-group-capsules-body", attr: { role: "tablist" } });
    groups.forEach((group, index) => {
      const chip = navBody.createEl("button", { cls: `peo-group-capsule${group.id === selected.id ? " is-active" : ""}`, attr: { role: "tab", "aria-selected": String(group.id === selected.id) } });
      chip.dataset.groupId = group.id;
      chip.createSpan({ cls: "peo-group-capsule-index", text: String(index + 1).padStart(2, "0") });
      chip.createSpan({ cls: "peo-group-capsule-title", text: group.title });
      chip.createSpan({ cls: "peo-group-capsule-count", text: String(group.itemCount) });
      chip.onclick = () => { this.setSelectedGroupId(group.id); this.render({ preserveScroll: false, reason: "stopped-history-select" }); };
    });
    const group = selected;
    const box = board.createDiv({ cls: `peo-project-group${group.hasRelations ? " has-relations" : " is-isolated"}` });
    box.dataset.groupId = group.id;
    const header = box.createDiv({ cls: "peo-project-header" });
    header.createSpan({ cls: "peo-project-title", text: group.title });
    header.createSpan({ cls: "peo-project-meta", text: `已停止追踪 · 条目 ${group.itemCount} · 连线 ${group.edgeCount}` });
    if (group.mode === "workspace") for (const key of group.primaryNodeKeys) {
      const manage = header.createEl("button", { text: group.primaryNodeKeys.length > 1 ? `管理：${this.model.itemsByKey[key]?.label || "项目"}` : "管理追踪" });
      manage.onclick = () => {
        const api = window.__mandalaTimeBlocksPluginApi;
        try {
          const fresh = this.getUsableTrackingEvidence();
          if (!fresh?.ok || api !== this.trackingEvidenceApi || fresh.states.get(key) !== "stopped") throw new Error("追踪状态已变化，请刷新");
          api.openProjectContextManagerV1({ nodeKey: key, sourceNotePath: fresh.sourceScope }, { onClosed: () => this.queueTrackingDisplayRefresh() });
        } catch (e) { new Notice(e.message); }
      };
    }
    const columns = box.createDiv({ cls: "peo-project-columns" });
    COLUMN_DEFS.forEach(column => {
      if (this.plugin.settings.enabledSources?.[column.id] === false) return;
      const list = group.columns?.[column.id] || [];
      const col = columns.createDiv({ cls: `peo-column peo-column-${column.id}` });
      const head = col.createDiv({ cls: "peo-column-header" });
      head.createSpan({ cls: "peo-column-title", text: column.label });
      head.createSpan({ cls: "peo-column-count", text: String(list.length) });
      const body = col.createDiv({ cls: "peo-column-body" });
      if (!list.length) body.createDiv({ cls: "peo-column-empty", text: "-" });
      for (const item of list) {
        const row = body.createDiv({ cls: "peo-item" });
        row.dataset.nodeKey = item.nodeKey; row.dataset.groupId = group.id;
        const main = row.createDiv({ cls: "peo-item-main" });
        main.createSpan({ cls: "peo-item-label", text: item.label || "未命名条目" });
        const badges = main.createSpan({ cls: "peo-item-badges" });
        const jump = badges.createEl("button", { cls: "peo-jump-btn", text: "↗", attr: { "aria-label": "打开来源" } });
        jump.onclick = () => this.plugin.openHistoryNode(item.timelineNodeKey || item.nodeKey);
        const comment = this.plugin.getComment(item.nodeKey);
        if (comment) { const preview = row.createEl("div", { cls: "peo-comment-preview", text: comment }); preview.style.whiteSpace = "pre-wrap"; }
        const details = row.createEl("details"); details.createEl("summary", { text: "来源详情" });
        details.createEl("small", { text: item.nodeKey });
      }
    });
  }

  async onOpen() {
    this.contextCarrierClosed = false;
    this.contentEl.addClass("project-execution-overview-view");
    this.lastScrollState = this.plugin.getRememberedScrollState?.() || this.lastScrollState;
    await this.refresh({ preserveScroll: !!this.lastScrollState, reason: "on-open" });
  }

  clearScheduledViewWork() {
    this.restoreScrollToken += 1;
    if (this.scrollFrame) {
      if (window.cancelAnimationFrame) window.cancelAnimationFrame(this.scrollFrame);
      else window.clearTimeout(this.scrollFrame);
      this.scrollFrame = null;
    }
    if (this.scrollCaptureTimer) {
      window.clearTimeout(this.scrollCaptureTimer);
      this.scrollCaptureTimer = null;
    }
    if (this.linkDrawTimer) {
      window.clearTimeout(this.linkDrawTimer);
      this.linkDrawTimer = null;
    }
  }

  onClose() {
    this.contextCarrierClosed = true;
    this.trackingEvidenceEpoch = (this.trackingEvidenceEpoch || 0) + 1;
    this.globalKeywordNavRenderToken += 1;
    this.contextCarrierRequestGeneration += 1;
    this.contextCarrierRefreshQueued = false;
    this.cancelConfirmedItemReveal("view-closed");
    this.clearScheduledViewWork();
  }

  async refresh(options = {}) {
    const trackingEpoch = this.trackingEvidenceEpoch = (this.trackingEvidenceEpoch || 0) + 1;
    console.info("[ProjectOverview][scroll.refresh]", {
      reason: text(options.reason, "direct-refresh"),
      preserveScroll: options?.preserveScroll === true,
      hasBoardWrap: !!this.contentEl.querySelector(".peo-board-wrap"),
      lastScrollTop: Number(this.lastScrollState?.top) || 0,
      lastAnchorGroupId: text(this.lastScrollState?.anchorGroupId),
      lastAnchorNodeKey: text(this.lastScrollState?.anchorNodeKey),
    });
    const startedAt = peoNow();
    this.markRenderBusy(true, text(options.reason, "direct-refresh"));
    try {
      const nextModel = await this.plugin.buildOverviewModel();
      if (!await this.loadTrackingEvidence(nextModel, trackingEpoch)) { this.markRenderBusy(false); return false; }
      if (typeof options?.commitGuard === "function" && !options.commitGuard(nextModel)) {
        this.markRenderBusy(false);
        logPeoPerf("build-model-stale", {
          reason: text(options.reason, "direct-refresh"),
          durationMs: Math.round(peoNow() - startedAt),
        });
        return false;
      }
      this.model = nextModel;
      this.columnHierarchyCache.clear();
      logPeoPerf("build-model", {
        reason: text(options.reason, "direct-refresh"),
        durationMs: Math.round(peoNow() - startedAt),
        itemCount: Object.keys(this.model?.itemsByKey || {}).length,
        edgeCount: Object.keys(this.model?.edgesById || {}).length,
        groupCount: Array.isArray(this.model?.groups) ? this.model.groups.length : 0,
      });
      this.render(options);
      this.plugin.markContextCarrierViewCurrent?.(this);
      return true;
    } catch (error) {
      this.markRenderBusy(false);
      console.error("[ProjectOverview][refresh.failed]", error);
      new Notice("项目执行总览刷新失败，请查看控制台。");
      throw error;
    }
  }

  async refreshPreservingScroll() {
    const trackingEpoch = this.trackingEvidenceEpoch = (this.trackingEvidenceEpoch || 0) + 1;
    const startedAt = peoNow();
    this.markRenderBusy(true, "refresh-button");
    try {
      const nextModel = await this.plugin.buildOverviewModel();
      if (!await this.loadTrackingEvidence(nextModel, trackingEpoch)) { this.markRenderBusy(false); return false; }
      this.model = nextModel;
      this.columnHierarchyCache.clear();
      logPeoPerf("build-model", {
        reason: "refresh-button",
        durationMs: Math.round(peoNow() - startedAt),
        itemCount: Object.keys(this.model?.itemsByKey || {}).length,
        edgeCount: Object.keys(this.model?.edgesById || {}).length,
        groupCount: Array.isArray(this.model?.groups) ? this.model.groups.length : 0,
      });
      this.render({ preserveScroll: true, reason: "refresh-button" });
    } catch (error) {
      this.markRenderBusy(false);
      console.error("[ProjectOverview][refresh-preserving-scroll.failed]", error);
      new Notice("项目执行总览刷新失败，请查看控制台。");
      throw error;
    }
  }

  markRenderBusy(active, reason = "") {
    const root = this.contentEl.querySelector(".peo-root");
    if (!root) return;
    root.classList.toggle("is-render-pending", !!active);
    root.toggleAttribute("aria-busy", !!active);
    if (active) root.dataset.renderPendingReason = text(reason, "refresh");
    else delete root.dataset.renderPendingReason;
  }

  hasUsableBoardLayout(boardWrap) {
    if (!boardWrap) return false;
    const rect = boardWrap.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && Number(boardWrap.clientHeight) > 0 && Number(boardWrap.scrollHeight) > 0;
  }

  captureBoardScrollState(options = {}) {
    const boardWrap = this.contentEl.querySelector(".peo-board-wrap");
    if (!boardWrap) {
      if (options.log) {
        console.info("[ProjectOverview][scroll.capture]", {
          reason: text(options.reason, "unknown"),
          status: "NO_BOARD_WRAP",
          fallbackTop: Number(this.lastScrollState?.top) || 0,
          fallbackAnchorGroupId: text(this.lastScrollState?.anchorGroupId),
          fallbackAnchorNodeKey: text(this.lastScrollState?.anchorNodeKey),
        });
      }
      return this.lastScrollState || null;
    }
    if (!this.hasUsableBoardLayout(boardWrap)) {
      if (options.log) {
        console.info("[ProjectOverview][scroll.capture]", {
          reason: text(options.reason, "unknown"),
          status: "NO_LAYOUT",
          currentTop: Number(boardWrap.scrollTop) || 0,
          clientHeight: Number(boardWrap.clientHeight) || 0,
          scrollHeight: Number(boardWrap.scrollHeight) || 0,
          fallbackTop: Number(this.lastScrollState?.top) || 0,
          fallbackAnchorGroupId: text(this.lastScrollState?.anchorGroupId),
          fallbackAnchorNodeKey: text(this.lastScrollState?.anchorNodeKey),
        });
      }
      return this.lastScrollState || null;
    }
    const wrapRect = boardWrap.getBoundingClientRect();
    const groups = Array.from(boardWrap.querySelectorAll(".peo-project-group[data-group-id]"));
    const groupEntries = groups
      .map((groupEl) => {
        const rect = groupEl.getBoundingClientRect();
        return {
          groupId: text(groupEl.dataset.groupId),
          element: groupEl,
          index: 0,
          offsetTop: rect.top - wrapRect.top,
          distance: rect.top <= wrapRect.top && rect.bottom > wrapRect.top ? 0 : Math.abs(rect.top - wrapRect.top),
          visible: rect.bottom > wrapRect.top && rect.top < wrapRect.bottom,
        };
      });
    groupEntries.forEach((entry, index) => { entry.index = index; });
    const visibleGroups = groupEntries
      .filter((entry) => entry.groupId && entry.visible)
      .sort((a, b) => a.distance - b.distance);
    const groupAnchor = visibleGroups[0] || null;
    const itemEntries = Array.from(boardWrap.querySelectorAll(".peo-item[data-node-key]"))
      .map((itemEl) => {
        const rect = itemEl.getBoundingClientRect();
        const groupEl = itemEl.closest?.(".peo-project-group[data-group-id]");
        return {
          nodeKey: text(itemEl.dataset.nodeKey),
          groupId: text(itemEl.dataset.groupId || groupEl?.dataset?.groupId),
          offsetTop: rect.top - wrapRect.top,
          distance: rect.top <= wrapRect.top && rect.bottom > wrapRect.top ? 0 : Math.abs(rect.top - wrapRect.top),
          visible: rect.bottom > wrapRect.top && rect.top < wrapRect.bottom,
        };
      })
      .filter((entry) => entry.nodeKey && entry.visible)
      .sort((a, b) => a.distance - b.distance);
    const itemAnchor = itemEntries[0] || null;
    const anchorIndex = groupAnchor?.index ?? -1;
    const previous = this.lastScrollState || {};
    const state = {
      top: Number(boardWrap.scrollTop) || 0,
      left: Number(boardWrap.scrollLeft) || 0,
      scrollHeight: Number(boardWrap.scrollHeight) || 0,
      clientHeight: Number(boardWrap.clientHeight) || 0,
      groupCount: groupEntries.length,
      itemCount: boardWrap.querySelectorAll(".peo-item[data-node-key]").length,
      anchorNodeKey: itemAnchor?.nodeKey || previous.anchorNodeKey || "",
      anchorNodeOffsetTop: itemAnchor ? Number(itemAnchor.offsetTop) || 0 : Number(previous.anchorNodeOffsetTop) || 0,
      anchorNodeGroupId: itemAnchor?.groupId || previous.anchorNodeGroupId || "",
      anchorGroupId: groupAnchor?.groupId || previous.anchorGroupId || "",
      anchorGroupOffsetTop: groupAnchor ? Number(groupAnchor.offsetTop) || 0 : Number(previous.anchorGroupOffsetTop) || 0,
      previousGroupId: anchorIndex > 0 ? text(groupEntries[anchorIndex - 1]?.groupId) : (previous.previousGroupId || ""),
      nextGroupId: anchorIndex >= 0 && anchorIndex < groupEntries.length - 1 ? text(groupEntries[anchorIndex + 1]?.groupId) : (previous.nextGroupId || ""),
    };
    this.lastScrollState = state;
    this.plugin.rememberScrollState?.(state, "capture");
    if (options.log) {
      console.info("[ProjectOverview][scroll.capture]", {
        reason: text(options.reason, "unknown"),
        status: "OK",
        top: state.top,
        left: state.left,
        scrollHeight: state.scrollHeight,
        clientHeight: state.clientHeight,
        groupCount: state.groupCount,
        itemCount: state.itemCount,
        anchorNodeKey: text(state.anchorNodeKey),
        anchorNodeGroupId: text(state.anchorNodeGroupId),
        anchorGroupId: text(state.anchorGroupId),
        previousGroupId: text(state.previousGroupId),
        nextGroupId: text(state.nextGroupId),
      });
    }
    return state;
  }

  rememberCurrentScrollState(reason = "manual") {
    const state = this.captureBoardScrollState({ log: true, reason });
    if (!state) return null;
    this.lastScrollState = state;
    this.plugin.rememberScrollState?.(state, reason);
    console.info("[ProjectOverview][scroll.remember]", {
      reason,
      top: Number(state.top) || 0,
      anchorNodeKey: text(state.anchorNodeKey),
      anchorGroupId: text(state.anchorGroupId),
    });
    return state;
  }

  restoreBoardScrollState(scrollState, boardWrap, svg, renderId, options = {}) {
    if (!scrollState || !boardWrap) return;
    const token = ++this.restoreScrollToken;
    const restoreStartedAt = Date.now();
    const restore = (attempt = "unknown") => {
      if (token !== this.restoreScrollToken) {
        console.info("[ProjectOverview][scroll.restore]", {
          reason: text(options.reason, "unknown"),
          attempt,
          status: "CANCELLED",
          renderId,
        });
        return;
      }
      if (this.lastRenderId !== renderId) {
        console.info("[ProjectOverview][scroll.restore]", {
          reason: text(options.reason, "unknown"),
          attempt,
          status: "STALE_RENDER",
          renderId,
          currentRenderId: this.lastRenderId,
        });
        return;
      }
      const userScrolledAfterRestore = Number(boardWrap.dataset.userScrolledAt || 0) > restoreStartedAt + 40;
      if (userScrolledAfterRestore) {
        this.restoreScrollToken += 1;
        console.info("[ProjectOverview][scroll.restore]", {
          reason: text(options.reason, "unknown"),
          attempt,
          status: "USER_SCROLL_CANCEL",
          renderId,
          currentTop: Number(boardWrap.scrollTop) || 0,
        });
        return;
      }
      if (!this.hasUsableBoardLayout(boardWrap)) {
        console.info("[ProjectOverview][scroll.restore]", {
          reason: text(options.reason, "unknown"),
          attempt,
          status: "WAIT_LAYOUT",
          previousTop: Number(scrollState.top) || 0,
          actualTop: Number(boardWrap.scrollTop) || 0,
          clientHeightAfter: Number(boardWrap.clientHeight) || 0,
          scrollHeightAfter: Number(boardWrap.scrollHeight) || 0,
          groupCountAfter: boardWrap.querySelectorAll(".peo-project-group[data-group-id]").length,
          itemCountAfter: boardWrap.querySelectorAll(".peo-item[data-node-key]").length,
        });
        return;
      }
      let nextTop = Math.max(0, scrollState.top || 0);
      const wrapRect = boardWrap.getBoundingClientRect();
      const findGroup = (groupId) => Array.from(boardWrap.querySelectorAll(".peo-project-group[data-group-id]"))
        .find((el) => text(el.dataset.groupId) === text(groupId));
      const findItem = (nodeKey) => Array.from(boardWrap.querySelectorAll(".peo-item[data-node-key]"))
        .find((el) => text(el.dataset.nodeKey) === text(nodeKey));
      const topForElement = (element, offsetTop) => {
        const rect = element.getBoundingClientRect();
        return Math.max(0, boardWrap.scrollTop + rect.top - wrapRect.top - (Number(offsetTop) || 0));
      };
      const itemEl = findItem(scrollState.anchorNodeKey);
      let anchorFound = "none";
      if (itemEl) {
        anchorFound = "item";
        nextTop = topForElement(itemEl, scrollState.anchorNodeOffsetTop);
      } else {
        const groupEl = findGroup(scrollState.anchorGroupId);
        const nextGroupEl = findGroup(scrollState.nextGroupId);
        const previousGroupEl = findGroup(scrollState.previousGroupId);
        if (groupEl) {
          anchorFound = "group";
          nextTop = topForElement(groupEl, scrollState.anchorGroupOffsetTop);
        } else if (nextGroupEl) {
          anchorFound = "next-group";
          nextTop = topForElement(nextGroupEl, scrollState.anchorGroupOffsetTop);
        } else if (previousGroupEl) {
          anchorFound = "previous-group";
          nextTop = topForElement(previousGroupEl, scrollState.anchorGroupOffsetTop);
        }
      }
      this.lastAutoScrollAt = Date.now();
      boardWrap.scrollTop = nextTop;
      boardWrap.scrollLeft = Math.max(0, scrollState.left || 0);
      this.lastScrollState = Object.assign({}, scrollState, {
        top: Number(boardWrap.scrollTop) || 0,
        left: Number(boardWrap.scrollLeft) || 0,
      });
      this.plugin.rememberScrollState?.(this.lastScrollState, `restore:${attempt}`);
      console.info("[ProjectOverview][scroll.restore]", {
        reason: text(options.reason, "unknown"),
        attempt,
        status: "OK",
        anchorFound,
        requestedTop: Number(nextTop) || 0,
        actualTop: Number(boardWrap.scrollTop) || 0,
        previousTop: Number(scrollState.top) || 0,
        scrollHeightBefore: Number(scrollState.scrollHeight) || 0,
        scrollHeightAfter: Number(boardWrap.scrollHeight) || 0,
        clientHeightAfter: Number(boardWrap.clientHeight) || 0,
        groupCountAfter: boardWrap.querySelectorAll(".peo-project-group[data-group-id]").length,
        itemCountAfter: boardWrap.querySelectorAll(".peo-item[data-node-key]").length,
        anchorNodeKey: text(scrollState.anchorNodeKey),
        anchorGroupId: text(scrollState.anchorGroupId),
        previousGroupId: text(scrollState.previousGroupId),
        nextGroupId: text(scrollState.nextGroupId),
      });
      this.drawLinks(svg, boardWrap, { reason: "scroll-capture", force: true });
      this.restoreScrollToken += 1;
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(() => restore("raf"));
    else window.setTimeout(() => restore("timeout-0"), 0);
    window.setTimeout(() => restore("timeout-80"), 80);
    window.setTimeout(() => restore("timeout-240"), 240);
    window.setTimeout(() => restore("timeout-500"), 500);
    window.setTimeout(() => restore("timeout-1000"), 1000);
    window.setTimeout(() => restore("timeout-1800"), 1800);
  }

  render(options = {}) {
    this.clearScheduledViewWork();
    const renderStartedAt = peoNow();
    const renderId = makeId("render");
    this.lastRenderId = renderId;
    const reason = text(options.reason, "render");
    const selectedGroup = this.resolveSelectedGroup();
    let scrollState = options?.preserveScroll ? this.captureBoardScrollState({ log: true, reason }) : null;
    if (scrollState && text(scrollState.anchorGroupId) !== text(selectedGroup?.id)) scrollState = null;
    console.info("[ProjectOverview][scroll.render]", {
      renderId,
      reason,
      preserveScroll: options?.preserveScroll === true,
      captured: !!scrollState,
      capturedTop: Number(scrollState?.top) || 0,
      capturedAnchorGroupId: text(scrollState?.anchorGroupId),
      capturedAnchorNodeKey: text(scrollState?.anchorNodeKey),
    });
    const root = document.createElement("div");
    root.className = "peo-root";
    if (!this.model?.evaAvailable) {
      root.createDiv({ cls: "peo-empty", text: "EVA Cross View Relations 未加载或没有公开 API。请先启用 EVA 插件。" });
      this.contentEl.replaceChildren(root);
      return;
    }
    if (!this.model?.startRecord && (this.model?.startRecords || []).length === 0) {
      root.createDiv({ cls: "peo-empty", text: "未找到该 workspace tab 下的条目：项目清单和执行待办事项汇总。请确认 Workspace Mount 已向 EVA 注册索引。" });
    }
    const boardWrap = root.createDiv({ cls: "peo-board-wrap" });
    const svg = createSvgElement("svg", "peo-link-layer");
    boardWrap.appendChild(svg);
    this.renderGlobalKeywordNav(boardWrap);
    this.renderToolbar(boardWrap);
    if (!this.killMode) {
      this.renderGroupCapsules(boardWrap);
      this.primeGroupHierarchyCache(this.getSortedGroupsForCurrentView());
    }
    const tracking = this.getUsableTrackingEvidence();
    if (!tracking?.ok) boardWrap.createEl("p", { text: "追踪状态暂不可用，当前视图保留对象：" + (tracking?.error || "请刷新") });
    const board = boardWrap.createDiv({ cls: "peo-board peo-group-board", attr: { id: "peo-selected-group-board" } });
    this.renderGroups(board);
    this.renderDiagnostics(root);
    const beforeSwapAt = peoNow();
    this.contentEl.replaceChildren(root);
    window.setTimeout(() => this.scrollSelectedCapsuleIntoView("auto"), 0);
    logPeoPerf("render-dom", {
      renderId,
      reason,
      buildDetachedMs: Math.round(beforeSwapAt - renderStartedAt),
      swapMs: Math.round(peoNow() - beforeSwapAt),
      itemCount: boardWrap.querySelectorAll(".peo-item[data-node-key]").length,
      groupCount: boardWrap.querySelectorAll(".peo-project-group[data-group-id]").length,
    });
    this.restoreBoardScrollState(scrollState, boardWrap, svg, renderId, { reason });
    this.flushPendingItemReveal();
    boardWrap.onscroll = () => this.handleBoardScroll(boardWrap, svg);
    window.setTimeout(() => {
      if (this.lastRenderId === renderId) this.drawLinks(svg, boardWrap, { reason: "render-timeout-80", force: true });
    }, 80);
    window.setTimeout(() => {
      if (this.lastRenderId === renderId) this.drawLinks(svg, boardWrap, { reason: "render-timeout-400", force: true });
    }, 400);
  }

  handleBoardScroll(boardWrap, svg) {
    const now = Date.now();
    if (now - Number(this.lastAutoScrollAt || 0) > 80) {
      boardWrap.dataset.userScrolledAt = String(now);
      this.restoreScrollToken += 1;
    }
    if (this.hasUsableBoardLayout(boardWrap)) {
      this.lastScrollState = Object.assign({}, this.lastScrollState || {}, {
        top: Number(boardWrap.scrollTop) || 0,
        left: Number(boardWrap.scrollLeft) || 0,
        scrollHeight: Number(boardWrap.scrollHeight) || 0,
        clientHeight: Number(boardWrap.clientHeight) || 0,
      });
    }
    if (this.scrollCaptureTimer) window.clearTimeout(this.scrollCaptureTimer);
    this.scrollCaptureTimer = window.setTimeout(() => {
      this.scrollCaptureTimer = null;
      if (this.hasUsableBoardLayout(boardWrap)) this.lastScrollState = this.captureBoardScrollState() || this.lastScrollState;
      this.drawLinks(svg, boardWrap, { reason: "scroll-capture", force: true });
      this.plugin.maybeProbeContextCarrierOnVisibilityChange?.(this);
    }, 180);
    if (this.scrollFrame) return;
    this.scrollFrame = window.requestAnimationFrame
      ? window.requestAnimationFrame(() => {
        this.scrollFrame = null;
        const drawNow = Date.now();
        if (drawNow - Number(this.lastLinkDrawAt || 0) >= 80) {
          this.lastLinkDrawAt = drawNow;
          this.drawLinks(svg, boardWrap, { reason: "scroll-raf" });
        }
      })
      : window.setTimeout(() => {
        this.scrollFrame = null;
        const drawNow = Date.now();
        if (drawNow - Number(this.lastLinkDrawAt || 0) >= 80) {
          this.lastLinkDrawAt = drawNow;
          this.drawLinks(svg, boardWrap, { reason: "scroll-timeout" });
        }
      }, 16);
  }

  renderDiagnostics(root) {
    const diagnostics = this.model?.diagnostics || [];
    if (diagnostics.length === 0) return;
    const box = root.createDiv({ cls: "peo-diagnostics" });
    diagnostics.forEach((item) => box.createDiv({ text: `⚠️ ${item.code}: ${item.limit || ""}` }));
  }

  renderGlobalKeywordNav(root) {
    const section = root.createDiv({ cls: "peo-global-keywords" });
    section.dataset.globalKeywordNav = "true";
    const header = section.createDiv({ cls: "peo-global-keywords-header" });
    header.createSpan({ cls: "peo-global-keywords-title", text: "Keywords" });
    header.createSpan({ cls: "peo-global-keywords-meta", text: "跨 Workspace / 九宫格 / Timeline" });
    const body = section.createDiv({ cls: "peo-global-keywords-body" });
    this.renderGlobalKeywordNavBody(body, this.globalKeywordNavItems);
    this.updateGlobalKeywordNavSoon();
  }

  renderGlobalKeywordNavBody(body, items = []) {
    body.empty();
    const projectedItems = this.plugin.projectGlobalKeywordNavItems(items, { killMode: this.killMode, trackingEvidence: this.getUsableTrackingEvidence() });
    if (projectedItems.length === 0) {
      body.createDiv({ cls: "peo-global-keywords-empty", text: "暂无主键评论 --- keyword ---。" });
      return;
    }
    const currentMode = this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    const sortedItems = projectedItems.slice().sort(compareGlobalKeywordNavItems);
    const visibleItems = sortedItems.filter((item) => !isArchivedProjectKeywordLabel(item?.keyword));
    const archivedItems = sortedItems.filter((item) => isArchivedProjectKeywordLabel(item?.keyword));
    const renderKeywordChip = (parent, item, options = {}) => {
      const modeDef = GROUPING_MODES.find((mode) => mode.id === item.mode) || { label: item.mode };
      const chip = parent.createEl("button", {
        cls: `peo-global-keyword-chip${item.mode === currentMode ? " is-current-mode" : ""}${options.archived ? " is-archived-keyword" : ""}`,
        text: item.keyword,
        attr: {
          type: "button",
          title: `${modeDef.label} / ${item.groupTitle}`,
        },
      });
      chip.dataset.mode = item.mode;
      chip.dataset.groupId = item.groupId;
      chip.createSpan({ cls: "peo-global-keyword-mode", text: modeDef.label.replace(" 视图", "") });
      chip.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.openGlobalKeywordTarget(item);
      };
      return chip;
    };
    visibleItems.forEach((item) => renderKeywordChip(body, item));
    if (!archivedItems.length) return;
    const expanded = this.globalKeywordArchiveExpanded === true;
    const archiveToggle = body.createEl("button", {
      cls: `peo-global-keyword-chip peo-global-keyword-archive-toggle${expanded ? " is-expanded" : ""}`,
      text: `已归档 ${archivedItems.length}`,
      attr: {
        type: "button",
        title: expanded ? "收起 9XX 归档关键词" : "展开 9XX 归档关键词",
      },
    });
    archiveToggle.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.globalKeywordArchiveExpanded = !expanded;
      this.renderGlobalKeywordNavBody(body, items);
    };
    if (expanded) {
      const archiveSection = body.createDiv({ cls: "peo-global-keyword-archive-section" });
      archiveSection.createDiv({ cls: "peo-global-keyword-archive-title", text: "已归档关键词（9XX）" });
      const archiveRow = archiveSection.createDiv({ cls: "peo-global-keyword-archive-row" });
      archivedItems.forEach((item) => renderKeywordChip(archiveRow, item, { archived: true }));
    }
  }

  async updateGlobalKeywordNavSoon() {
    const token = ++this.globalKeywordNavRenderToken;
    const currentItems = this.plugin.extractGroupKeywordNavItemsFromModel(this.model, this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode);
    this.globalKeywordNavItems = this.plugin.mergeGlobalKeywordItems(currentItems, this.globalKeywordNavItems);
    const body = this.contentEl.querySelector("[data-global-keyword-nav='true'] .peo-global-keywords-body");
    if (body) this.renderGlobalKeywordNavBody(body, this.globalKeywordNavItems);
    const plugin = this.plugin;
    const scheduledScope = plugin.getGlobalKeywordNavScope();
    const scheduledGeneration = Number(plugin.globalKeywordNavGeneration || 0);
    window.setTimeout(async () => {
      if (token !== this.globalKeywordNavRenderToken || this.contextCarrierClosed || this.plugin !== plugin
        || !plugin.isGlobalKeywordNavCurrent(scheduledGeneration, scheduledScope)) return;
      try {
        const pending = plugin.buildGlobalGroupKeywordNavItems();
        const generation = Number(plugin.globalKeywordNavGeneration || 0);
        const scope = plugin.getGlobalKeywordNavScope();
        const items = await pending;
        if (token !== this.globalKeywordNavRenderToken || this.contextCarrierClosed || this.plugin !== plugin
          || !plugin.isGlobalKeywordNavCurrent(generation, scope)) return;
        this.globalKeywordNavItems = items;
        const latestBody = this.contentEl.querySelector("[data-global-keyword-nav='true'] .peo-global-keywords-body");
        if (latestBody) this.renderGlobalKeywordNavBody(latestBody, items);
      } catch (error) {
        console.warn("[ProjectOverview][global-keyword-nav.refresh-failed]", error);
      }
    }, 0);
  }

  async openGlobalKeywordTarget(item = {}) {
    const targetMode = text(item.mode, DEFAULT_SETTINGS.groupingMode);
    const targetGroupId = text(item.groupId);
    if (!targetGroupId) return false;
    const currentMode = this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    if (targetMode !== currentMode) {
      this.setSelectedGroupId(targetGroupId, { mode: targetMode });
      this.plugin.settings.groupingMode = targetMode;
      await this.plugin.saveSettings();
      await this.refresh({ preserveScroll: false, reason: "global-keyword-nav" });
      return true;
    }
    return this.selectGroup(targetGroupId, { reason: "global-keyword-nav" });
  }

  renderToolbar(root) {
    const toolbar = root.createDiv({ cls: "peo-toolbar" });
    toolbar.createDiv({ cls: "peo-title", text: "项目清单和执行待办事项汇总" });
    const modeTabs = toolbar.createDiv({ cls: "peo-mode-tabs" });
    GROUPING_MODES.forEach((mode) => {
      const btn = modeTabs.createEl("button", { text: mode.label, cls: `peo-mode-tab${this.plugin.settings.groupingMode === mode.id ? " is-active" : ""}` });
      btn.onclick = async () => {
        this.plugin.settings.groupingMode = mode.id;
        await this.plugin.saveSettings();
        await this.refresh();
      };
    });
    const killModeBtn = modeTabs.createEl("button", {
      text: this.killMode ? "返回当前" : "查看已停止追踪",
      cls: `peo-mode-tab peo-kill-mode-toggle${this.killMode ? " is-active" : ""}`,
      attr: {
        type: "button",
        "aria-pressed": this.killMode ? "true" : "false",
        title: this.killMode ? "返回当前胶囊" : "只读回看当前来源中已停止追踪的胶囊",
      },
    });
    killModeBtn.onclick = () => {
      const currentGroupId = this.getSelectedGroupId();
      this.killMode = !this.killMode;
      this.columnHierarchyCache.clear();
      if (currentGroupId && !this.getSelectedGroupId()) this.setSelectedGroupId(currentGroupId);
      this.contextCarrierLastVisibilitySignature = "";
      this.render({ preserveScroll: true, reason: this.killMode ? "enter-kill-mode" : "leave-kill-mode" });
      if (this.killMode) window.setTimeout(() => this.plugin.maybeProbeContextCarrierOnVisibilityChange(this), 0);
    };
    const meta = toolbar.createDiv({ cls: "peo-meta" });
    const mode = GROUPING_MODES.find((item) => item.id === this.plugin.settings.groupingMode) || GROUPING_MODES[0];
    meta.setText(`${mode.label} · 起点条目 ${(this.model?.startRecords || []).length} · 节点 ${Object.keys(this.model?.itemsByKey || {}).length} · 连线 ${Object.keys(this.model?.edgesById || {}).length}`);
    const refreshBtn = toolbar.createEl("button", { text: "刷新" });
    refreshBtn.onclick = async () => await this.refreshPreservingScroll();
    const weeklyProjectPlanBtn = toolbar.createEl("button", { text: "周项目计划" });
    weeklyProjectPlanBtn.onclick = async () => {
      this.rememberCurrentScrollState("before-open-weekly-project-plan");
      await this.plugin.openMandalaWeeklyProjectPlan();
    };
    const locateBtn = toolbar.createEl("button", { text: "定位起点" });
    locateBtn.onclick = async () => {
      if (!this.model?.startRecord?.nodeKey) return new Notice("未找到该 tab 下的起点条目");
      await this.plugin.openNode(this.model.startRecord.nodeKey);
    };
  }

  getSortedGroupsForCurrentView() {
    const groups = Array.isArray(this.model?.groups) ? this.model.groups : [];
    const sorted = this.sortGroupsForCurrentView(groups);
    return this.projectTrackingGroups(sorted);
  }

  sortGroupsForCurrentView(groups = []) {
    const mode = this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    return (Array.isArray(groups) ? groups : [])
      .map((group, index) => ({
        group,
        index,
        level: this.plugin.getGroupCapsuleLevel(mode, group.id),
      }))
      .sort((a, b) => {
        const rankDiff = getCapsuleLevelRank(a.level) - getCapsuleLevelRank(b.level);
        return rankDiff || a.index - b.index;
      })
      .map((entry) => entry.group);
  }

  getGroupSelectionScopeKey(options = {}) {
    const mode = normalizeGroupingMode(options.mode, normalizeGroupingMode(this.plugin.settings.groupingMode));
    const killMode = options.killMode === undefined ? this.killMode : options.killMode === true;
    return `${mode}::${killMode ? "kill" : "normal"}`;
  }

  getGroupsForSelectionScope(mode, killMode = false) {
    const groups = this.plugin.sortGroupsForMode(Array.isArray(this.model?.groups) ? this.model.groups : [], mode);
    return this.projectTrackingGroups(groups, killMode);
  }

  resolveCapsuleSelection(selection = {}) {
    const groupingMode = normalizeGroupingMode(selection?.groupingMode, normalizeGroupingMode(this.plugin.settings.groupingMode));
    const viewMode = text(selection?.viewMode).toLowerCase() === "kill" ? "kill" : "normal";
    const groups = this.getGroupsForSelectionScope(groupingMode, viewMode === "kill");
    const requestedGroupId = text(selection?.groupId);
    const requestedPrimaryNodeKey = text(selection?.primaryNodeKey);
    const exact = groups.find((group) => text(group?.id) === requestedGroupId && (!requestedPrimaryNodeKey || group.primaryNodeKeys?.includes(requestedPrimaryNodeKey) || group.primaryNodeKey === requestedPrimaryNodeKey)) || null;
    const byPrimary = !exact && requestedPrimaryNodeKey
      ? groups.find((group) => text(group?.primaryNodeKey) === requestedPrimaryNodeKey) || null
      : null;
    const selected = exact || byPrimary || (requestedPrimaryNodeKey ? null : groups[0]) || null;
    return {
      scopeKey: this.getGroupSelectionScopeKey({ mode: groupingMode, killMode: viewMode === "kill" }),
      groupingMode,
      viewMode,
      selected,
      matchMode: exact ? "group-id" : (byPrimary ? "primary-node-key" : (selected ? "first-visible" : "none")),
    };
  }

  captureCapsuleSelectionState() {
    const currentMode = this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    const currentScopeKey = this.getGroupSelectionScopeKey();
    const scopeKeys = new Set([...this.selectedGroupIds.keys(), currentScopeKey]);
    const selectedGroupsByScope = {};
    scopeKeys.forEach((scopeKey) => {
      const [rawMode, rawViewMode] = text(scopeKey).split("::");
      const groupingMode = GROUPING_MODES.some((entry) => entry.id === rawMode) ? rawMode : currentMode;
      const viewMode = rawViewMode === "kill" ? "kill" : "normal";
      const groups = this.getGroupsForSelectionScope(groupingMode, viewMode === "kill");
      const selectedId = text(this.selectedGroupIds.get(`${groupingMode}::${viewMode}`));
      const selected = groups.find((group) => text(group?.id) === selectedId)
        || (scopeKey === currentScopeKey ? groups[0] : null);
      if (!selected) return;
      selectedGroupsByScope[`${groupingMode}::${viewMode}`] = {
        groupingMode,
        viewMode,
        groupId: text(selected.id),
        primaryNodeKey: text(selected.primaryNodeKey),
      };
    });
    return {
      activeScopeKey: currentScopeKey,
      selectedGroupsByScope,
    };
  }

  applyCapsuleSelectionState(state = {}, options = {}) {
    const normalizedState = normalizeProjectOverviewCapsuleState(state);
    const activeScopeKey = text(normalizedState.activeScopeKey);
    const [activeMode, activeViewMode] = activeScopeKey.split("::");
    if (GROUPING_MODES.some((entry) => entry.id === activeMode)) {
      this.plugin.settings.groupingMode = activeMode;
      this.killMode = activeViewMode === "kill";
    }
    const outcomes = [];
    Object.values(normalizedState.selectedGroupsByScope || {}).forEach((selection) => {
      const resolved = this.resolveCapsuleSelection(selection);
      this.setSelectedGroupId(resolved.selected?.id || "", {
        mode: resolved.groupingMode,
        killMode: resolved.viewMode === "kill",
      });
      outcomes.push({
        scopeKey: resolved.scopeKey,
        requestedGroupId: text(selection?.groupId),
        requestedPrimaryNodeKey: text(selection?.primaryNodeKey),
        appliedGroupId: text(resolved.selected?.id),
        appliedPrimaryNodeKey: text(resolved.selected?.primaryNodeKey),
        matchMode: resolved.matchMode,
      });
    });
    if (options.renderCurrent === true) {
      const currentSelection = normalizedState.selectedGroupsByScope?.[this.getGroupSelectionScopeKey()];
      const resolved = currentSelection ? this.resolveCapsuleSelection(currentSelection) : null;
      if (resolved?.selected) {
        this.selectGroup(resolved.selected.id, {
          force: true,
          scrollToTop: false,
          reason: text(options?.reason, "state-capsule-tab-restore"),
        });
      }
    }
    return outcomes;
  }

  getSelectedGroupId(options = {}) {
    return text(this.selectedGroupIds.get(this.getGroupSelectionScopeKey(options)));
  }

  setSelectedGroupId(groupId, options = {}) {
    const normalizedGroupId = text(groupId);
    const scopeKey = this.getGroupSelectionScopeKey(options);
    if (normalizedGroupId) this.selectedGroupIds.set(scopeKey, normalizedGroupId);
    else this.selectedGroupIds.delete(scopeKey);
    return normalizedGroupId;
  }

  resolveSelectedGroup(groups = this.getSortedGroupsForCurrentView(), options = {}) {
    const visibleGroups = Array.isArray(groups) ? groups : [];
    const selectedGroupId = this.getSelectedGroupId(options);
    const selected = visibleGroups.find((group) => text(group?.id) === selectedGroupId) || visibleGroups[0] || null;
    this.setSelectedGroupId(selected?.id || "", options);
    return selected;
  }

  updateGroupCapsuleSelection(root = this.contentEl) {
    const selectedGroupId = this.getSelectedGroupId();
    root?.querySelectorAll?.(".peo-group-capsule[data-group-id]").forEach((capsule) => {
      const active = text(capsule.dataset.groupId) === selectedGroupId;
      capsule.classList.toggle("is-active", active);
      capsule.setAttribute("aria-selected", active ? "true" : "false");
      capsule.setAttribute("tabindex", active ? "0" : "-1");
    });
  }

  scrollSelectedCapsuleIntoView(behavior = "smooth") {
    const body = this.contentEl.querySelector(".peo-group-capsules-body");
    const selectedGroupId = this.getSelectedGroupId();
    const capsule = Array.from(body?.querySelectorAll?.(".peo-group-capsule[data-group-id]") || [])
      .find((entry) => text(entry.dataset.groupId) === selectedGroupId);
    if (!body || !capsule) return;
    const bodyRect = body.getBoundingClientRect();
    const capsuleRect = capsule.getBoundingClientRect();
    let nextLeft = Number(body.scrollLeft) || 0;
    if (capsuleRect.left < bodyRect.left + 8) nextLeft -= bodyRect.left + 8 - capsuleRect.left;
    else if (capsuleRect.right > bodyRect.right - 8) nextLeft += capsuleRect.right - bodyRect.right + 8;
    if (Math.abs(nextLeft - (Number(body.scrollLeft) || 0)) > 1) {
      body.scrollTo({ left: Math.max(0, nextLeft), behavior });
    }
  }

  selectGroup(groupId, options = {}) {
    const normalizedGroupId = text(groupId);
    const groups = this.getSortedGroupsForCurrentView();
    const selected = groups.find((group) => text(group?.id) === normalizedGroupId);
    if (!selected) return false;
    if (this.getSelectedGroupId() === normalizedGroupId && options.force !== true) {
      this.scrollSelectedCapsuleIntoView();
      return true;
    }
    this.setSelectedGroupId(normalizedGroupId);
    this.clearScheduledViewWork();
    this.lastRenderId = makeId("group-tab");
    const boardWrap = this.contentEl.querySelector(".peo-board-wrap");
    const board = this.contentEl.querySelector(".peo-group-board");
    const svg = boardWrap?.querySelector(".peo-link-layer");
    if (!boardWrap || !board || !svg) return false;
    board.replaceChildren();
    this.renderGroups(board);
    this.updateGroupCapsuleSelection();
    this.scrollSelectedCapsuleIntoView();
    this.contextCarrierLastVisibilitySignature = "";
    const settle = () => {
      if (options.scrollToTop !== false) {
        const boardRect = board.getBoundingClientRect();
        const wrapRect = boardWrap.getBoundingClientRect();
        const top = Math.max(0, boardWrap.scrollTop + boardRect.top - wrapRect.top - 10);
        this.lastAutoScrollAt = Date.now();
        boardWrap.scrollTop = top;
        this.lastScrollState = this.captureBoardScrollState() || this.lastScrollState;
      }
      this.drawLinks(svg, boardWrap, { reason: text(options.reason, "group-tab"), force: true });
      this.plugin.maybeProbeContextCarrierOnVisibilityChange?.(this);
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(settle);
    else window.setTimeout(settle, 0);
    return true;
  }

  renderGroupCapsules(root) {
    const groups = this.getSortedGroupsForCurrentView();
    const mode = this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    const modeDef = GROUPING_MODES.find((item) => item.id === mode) || GROUPING_MODES[0];
    const wrap = root.createDiv({ cls: "peo-group-capsules" });
    const header = wrap.createDiv({ cls: "peo-group-capsules-header" });
    header.createSpan({ cls: "peo-group-capsules-title", text: "分组导航" });
    header.createSpan({ cls: "peo-group-capsules-meta", text: `${modeDef.label} · ${groups.length} 组 · 0/A/CZ 全局 · B/C 当前胶囊` });
    const body = wrap.createDiv({ cls: "peo-group-capsules-body", attr: { role: "tablist", "aria-label": `${modeDef.label}主键` } });
    if (groups.length === 0) {
      body.createDiv({ cls: "peo-group-capsules-empty", text: "当前视图暂无分组。" });
      return;
    }
    const selectedGroup = this.resolveSelectedGroup(groups);
    groups.forEach((group, index) => {
      const level = this.plugin.getGroupCapsuleLevel(mode, group.id);
      const active = group.id === selectedGroup?.id;
      const capsule = body.createDiv({ cls: `peo-group-capsule is-level-${level.toLowerCase()}${active ? " is-active" : ""}` });
      capsule.dataset.groupId = group.id;
      capsule.dataset.groupLevel = level;
      capsule.setAttribute("role", "tab");
      capsule.setAttribute("aria-selected", active ? "true" : "false");
      capsule.setAttribute("aria-controls", "peo-selected-group-board");
      capsule.setAttribute("tabindex", active ? "0" : "-1");
      capsule.setAttribute("title", `切换到主键：${group.title}`);
      capsule.onclick = () => this.selectGroup(group.id, { reason: "capsule-tab" });
      capsule.onkeydown = (event) => {
        if (event.target !== capsule) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        this.selectGroup(group.id, { reason: "capsule-keyboard" });
      };
      capsule.createSpan({ cls: "peo-group-capsule-index", text: String(index + 1).padStart(2, "0") });
      capsule.createSpan({ cls: "peo-group-capsule-title", text: group.title || group.id });
      capsule.createSpan({ cls: "peo-group-capsule-count", text: `${group.itemCount}` });
      const levelBox = capsule.createSpan({ cls: "peo-group-capsule-levels" });
      GROUP_CAPSULE_LEVELS.forEach((candidate) => {
        const levelBtn = levelBox.createEl("button", {
          text: candidate,
          cls: `peo-group-capsule-level${candidate === level ? " is-active" : ""}`,
          attr: {
            "aria-label": `设置 ${group.title} 为 ${candidate} 级`,
            "data-level": candidate.toLowerCase(),
          },
        });
        levelBtn.onclick = async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await this.plugin.setGroupCapsuleLevel(mode, group.id, candidate);
          this.render({ preserveScroll: true });
        };
      });
    });
  }

  scrollToGroup(groupId) {
    return this.selectGroup(groupId, { reason: "scroll-to-group-compat" });
  }

  findGroupIdForItem(nodeKey, preferredGroupId = "") {
    const normalizedNodeKey = text(nodeKey);
    const groups = this.getSortedGroupsForCurrentView();
    const containsNode = (group) => Object.values(group?.columns || {}).some((items) =>
      (Array.isArray(items) ? items : []).some((item) => text(item?.nodeKey) === normalizedNodeKey));
    const preferred = groups.find((group) => text(group?.id) === text(preferredGroupId));
    if (preferred && containsNode(preferred)) return preferred.id;
    return groups.find(containsNode)?.id || preferred?.id || "";
  }

  getConfirmedRevealPrimaryKeys(options = {}) {
    return Array.from(new Set([
      text(options?.primaryNodeKey),
      ...(Array.isArray(options?.primaryAliases) ? options.primaryAliases.map((value) => text(value)) : []),
    ].filter(Boolean)));
  }

  groupMatchesConfirmedRevealPrimary(group = {}, options = {}) {
    const requested = new Set(this.getConfirmedRevealPrimaryKeys(options));
    if (!requested.size) return false;
    const domain = normalizePrimaryKeyLifecycleDomain(group?.mode || group?.primaryColumnId);
    const aliases = new Set();
    this.plugin.getPrimaryGroupNodeKeys(group).forEach((nodeKey) => {
      aliases.add(text(nodeKey));
      this.plugin.getPrimaryKeyLifecycleAliases(domain, nodeKey).forEach((alias) => aliases.add(text(alias)));
    });
    return Array.from(requested).some((key) => aliases.has(key));
  }

  findConfirmedRevealGroup(nodeKey, options = {}) {
    const normalizedNodeKey = text(nodeKey);
    if (!normalizedNodeKey || !this.getConfirmedRevealPrimaryKeys(options).length) return null;
    return this.getSortedGroupsForCurrentView().find((group) => {
      if (!this.groupMatchesConfirmedRevealPrimary(group, options)) return false;
      return Object.values(group?.columns || {}).some((items) => (
        (Array.isArray(items) ? items : []).some((item) => text(item?.nodeKey) === normalizedNodeKey)
      ));
    }) || null;
  }

  cancelConfirmedItemReveal(reason = "cancelled") {
    const session = this.confirmedItemReveal;
    if (!session) return false;
    this.confirmedItemReveal = null;
    session.cancelled = true;
    session.timers.forEach((timer) => window.clearTimeout?.(timer));
    session.timers.clear();
    session.resolve?.({
      ok: false,
      status: reason === "timeout" ? "timeout" : "cancelled",
      reason,
      revealId: session.revealId,
      nodeKey: session.nodeKey,
      groupId: session.groupId,
      groupingMode: session.groupingMode,
    });
    console.info("[ProjectOverview][item.reveal-confirmed.cancelled]", {
      revealId: session.revealId,
      nodeKey: session.nodeKey,
      groupId: session.groupId,
      reason,
    });
    return true;
  }

  async revealItemNodeConfirmed(nodeKey, options = {}) {
    const normalizedNodeKey = text(nodeKey);
    const primaryKeys = this.getConfirmedRevealPrimaryKeys(options);
    if (!normalizedNodeKey || !primaryKeys.length) {
      return {
        ok: false,
        status: "invalid-request",
        revealId: "",
        nodeKey: normalizedNodeKey,
        groupId: "",
        groupingMode: normalizeGroupingMode(this.plugin.settings.groupingMode),
      };
    }
    this.cancelConfirmedItemReveal("superseded");
    const group = this.findConfirmedRevealGroup(normalizedNodeKey, options);
    const groupingMode = normalizeGroupingMode(this.plugin.settings.groupingMode);
    const revealId = text(options?.revealId) || makeId("item-reveal-confirmed");
    if (!group) {
      console.info("[ProjectOverview][item.reveal-confirmed.not-found]", {
        revealId,
        nodeKey: normalizedNodeKey,
        primaryKeys,
        groupingMode,
        source: text(options?.source, "unknown"),
      });
      return { ok: false, status: "not-found", revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode };
    }
    this.selectGroup(group.id, { force: true, scrollToTop: false, reason: "confirmed-item-reveal" });
    const timeoutMs = Math.max(300, Math.min(5000, Number(options?.timeoutMs || 1800) || 1800));
    return await new Promise((resolve) => {
      const session = {
        revealId,
        nodeKey: normalizedNodeKey,
        groupId: text(group.id),
        groupingMode,
        timers: new Set(),
        cancelled: false,
        resolve,
      };
      this.confirmedItemReveal = session;
      const finish = (result) => {
        if (this.confirmedItemReveal !== session || session.cancelled) return false;
        this.confirmedItemReveal = null;
        session.timers.forEach((timer) => window.clearTimeout?.(timer));
        session.timers.clear();
        resolve(result);
        return true;
      };
      const attempt = (label, behavior = "auto") => {
        if (this.confirmedItemReveal !== session || session.cancelled || this.contextCarrierClosed) return false;
        const ok = this.scrollToItem(normalizedNodeKey, Object.assign({}, options, {
          groupId: group.id,
          behavior,
        }));
        console.info("[ProjectOverview][item.reveal-confirmed.attempt]", {
          revealId,
          nodeKey: normalizedNodeKey,
          groupId: text(group.id),
          primaryKeys,
          attempt: label,
          ok,
        });
        if (!ok) return false;
        return finish({ ok: true, status: "revealed", revealId, nodeKey: normalizedNodeKey, groupId: text(group.id), groupingMode });
      };
      attempt("immediate", "auto");
      if (this.confirmedItemReveal !== session) return;
      [40, 100, 220, 420, 760, 1200].filter((delay) => delay < timeoutMs).forEach((delay) => {
        const timer = window.setTimeout(() => attempt(`timeout-${delay}`, delay >= 220 ? "smooth" : "auto"), delay);
        session.timers.add(timer);
      });
      const timeout = window.setTimeout(() => {
        if (this.confirmedItemReveal === session) this.cancelConfirmedItemReveal("timeout");
      }, timeoutMs);
      session.timers.add(timeout);
    });
  }

  ensureGroupSelectedForItem(nodeKey, options = {}) {
    const groupId = this.findGroupIdForItem(nodeKey, options?.groupId);
    if (!groupId || groupId === this.getSelectedGroupId()) return !!groupId;
    return this.selectGroup(groupId, { reason: text(options?.source, "item-reveal-group"), scrollToTop: false });
  }

  findItemElement(nodeKey, options = {}) {
    const normalizedNodeKey = text(nodeKey);
    if (!normalizedNodeKey) return null;
    const boardWrap = this.contentEl.querySelector(".peo-board-wrap");
    const board = this.contentEl.querySelector(".peo-group-board");
    if (!boardWrap || !board) return null;
    const candidates = Array.from(boardWrap.querySelectorAll(".peo-item[data-node-key]"))
      .filter((el) => text(el.dataset.nodeKey) === normalizedNodeKey);
    const preferredGroupId = text(options?.groupId);
    const itemEl = preferredGroupId
      ? candidates.find((el) => text(el.dataset.groupId || el.closest?.(".peo-project-group[data-group-id]")?.dataset?.groupId) === preferredGroupId) || null
      : candidates[0];
    return { boardWrap, board, itemEl, preferredGroupId, normalizedNodeKey, candidateCount: candidates.length };
  }

  scrollToItem(nodeKey, options = {}) {
    this.ensureGroupSelectedForItem(nodeKey, options);
    const found = this.findItemElement(nodeKey, options);
    if (!found?.boardWrap || !found?.itemEl) return false;
    const { boardWrap, itemEl, preferredGroupId, normalizedNodeKey } = found;
    if (!this.hasUsableBoardLayout(boardWrap)) return false;
    const behavior = text(options?.behavior, "smooth");
    itemEl.scrollIntoView({ behavior, block: "center", inline: "nearest" });
    const wrapRect = boardWrap.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    const topPadding = Math.max(36, Math.round((Number(boardWrap.clientHeight) || 0) * 0.28));
    const top = Math.max(0, boardWrap.scrollTop + itemRect.top - wrapRect.top - topPadding);
    const left = Math.max(0, boardWrap.scrollLeft + itemRect.left - wrapRect.left - 24);
    boardWrap.scrollTo({ top, left, behavior });
    this.selectedNodeKey = normalizedNodeKey;
    itemEl.classList.add("is-capsule-target", "is-selected");
    window.setTimeout(() => itemEl.classList.remove("is-capsule-target"), 1200);
    window.setTimeout(() => this.drawLinks(boardWrap.querySelector(".peo-link-layer"), boardWrap, { reason: "scroll-to-item", force: true }), 260);
    console.info("[ProjectOverview][item.reveal]", {
      nodeKey: normalizedNodeKey,
      groupId: preferredGroupId,
      foundGroupId: text(itemEl.dataset.groupId),
      top,
      left,
      source: text(options?.source, "unknown"),
      behavior,
    });
    return true;
  }

  flushPendingItemReveal() {
    const pending = this.pendingItemReveal;
    if (!pending) return false;
    this.pendingItemReveal = null;
    const normalizedNodeKey = text(pending.nodeKey);
    if (!normalizedNodeKey) return false;
    const revealId = text(pending.revealId) || makeId("item-reveal");
    this.pendingItemRevealId = revealId;
    const run = (attempt, behavior = "auto") => {
      if (this.pendingItemRevealId !== revealId) return false;
      const ok = this.scrollToItem(normalizedNodeKey, Object.assign({}, pending.options || {}, { behavior }));
      console.info("[ProjectOverview][item.reveal-attempt]", {
        nodeKey: normalizedNodeKey,
        groupId: text(pending.options?.groupId),
        source: text(pending.options?.source, "unknown"),
        attempt,
        ok,
      });
      return ok;
    };
    run("flush", "auto");
    if (window.requestAnimationFrame) window.requestAnimationFrame(() => run("raf", "auto"));
    window.setTimeout(() => run("timeout-80", "smooth"), 80);
    window.setTimeout(() => run("timeout-180", "smooth"), 180);
    window.setTimeout(() => run("timeout-360", "smooth"), 360);
    window.setTimeout(() => run("timeout-700", "smooth"), 700);
    window.setTimeout(() => run("timeout-1100", "smooth"), 1100);
    return true;
  }

  scheduleItemReveal(nodeKey, options = {}) {
    const normalizedNodeKey = text(nodeKey);
    if (!normalizedNodeKey) return false;
    const found = this.findItemElement(normalizedNodeKey, options);
    if (!found?.itemEl && !this.model?.itemsByKey?.[normalizedNodeKey]) {
      console.info("[ProjectOverview][item.reveal-schedule]", {
        nodeKey: normalizedNodeKey,
        groupId: text(options?.groupId),
        source: text(options?.source, "unknown"),
        status: "NO_TARGET",
      });
      return false;
    }
    this.pendingItemReveal = {
      nodeKey: normalizedNodeKey,
      options: Object.assign({}, options),
      revealId: makeId("item-reveal"),
    };
    return this.flushPendingItemReveal() || !!found?.itemEl || !!this.model?.itemsByKey?.[normalizedNodeKey];
  }

  renderColumns(board) {
    const columns = this.model?.columnsById || {};
    COLUMN_DEFS.forEach((column) => {
      if (this.plugin.settings.enabledSources[column.id] === false) return;
      const columnModel = columns[column.id] || { items: [] };
      const col = board.createDiv({ cls: `peo-column peo-column-${column.id}` });
      const header = col.createDiv({ cls: "peo-column-header" });
      header.createSpan({ cls: "peo-column-title", text: column.label });
      header.createSpan({ cls: "peo-column-count", text: String(columnModel.items.length) });
      const body = col.createDiv({ cls: "peo-column-body" });
      if (this.plugin.settings.collapsedColumns[column.id]) {
        body.addClass("is-collapsed");
        return;
      }
      const groupStub = { id: ORDER_GLOBAL_GROUP, mode: this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode };
      this.getColumnHierarchyItems(groupStub, column.id, columnModel.items).forEach((entry) => this.renderItem(body, entry.item, entry, groupStub));
    });
  }

  renderGroups(board) {
    if (this.killMode) { this.renderStoppedTrackingHistory(board); return; }
    const groups = this.getSortedGroupsForCurrentView();
    if (groups.length === 0) {
      board.createDiv({ cls: "peo-empty", text: "暂无可展示项目组。" });
      return;
    }
    const selectedGroup = this.resolveSelectedGroup(groups);
    const selectedIndex = groups.findIndex((group) => group.id === selectedGroup?.id);
    if (!selectedGroup) {
      board.createDiv({ cls: "peo-empty", text: "暂无可展示项目组。" });
      return;
    }
    [selectedGroup].forEach((group) => {
      const index = Math.max(0, selectedIndex);
      const lifecycle = this.plugin.getPrimaryGroupLifecycleState(group);
      const lifecycleClass = ""; // Legacy Kill never controls presentation.
      const groupEl = board.createDiv({ cls: `peo-project-group${group.hasRelations ? " has-relations" : " is-isolated"}${lifecycleClass}` });
      groupEl.dataset.groupId = group.id;
      const header = groupEl.createDiv({ cls: "peo-project-header" });
      header.createSpan({ cls: "peo-project-index", text: String(index + 1).padStart(2, "0") });
      header.createSpan({ cls: "peo-project-title", text: group.title });
      header.createSpan({ cls: "peo-project-meta", text: `条目 ${group.itemCount} · 连线 ${group.edgeCount}` });
      const exportBtn = header.createEl("button", {
        cls: "peo-ai-context-export-btn",
        text: "AI",
        attr: {
          type: "button",
          "aria-label": "复制 AI 项目证据包",
        },
      });
      exportBtn.title = "复制当前项目组的 AI 只读证据包";
      exportBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.plugin.copyGroupAiContext(group, { view: this });
      };
      const columns = groupEl.createDiv({ cls: "peo-project-columns" });
      COLUMN_DEFS.forEach((column) => {
        if (this.plugin.settings.enabledSources[column.id] === false) return;
        const list = group.columns?.[column.id] || [];
        const col = columns.createDiv({ cls: `peo-column peo-column-${column.id}` });
        const colHeader = col.createDiv({ cls: "peo-column-header" });
        colHeader.createSpan({ cls: "peo-column-title", text: column.label });
        colHeader.createSpan({ cls: "peo-column-count", text: String(list.length) });
        const body = col.createDiv({ cls: "peo-column-body" });
        if (list.length === 0) body.createDiv({ cls: "peo-column-empty", text: "-" });
        this.getColumnHierarchyItems(group, column.id, list).forEach((entry) => this.renderItem(body, entry.item, entry, group));
      });
    });
  }

  primeGroupHierarchyCache(groups = []) {
    const previousDeferred = this.plugin.deferFirstSeenOrderSave === true;
    this.plugin.deferFirstSeenOrderSave = true;
    try {
      (Array.isArray(groups) ? groups : []).forEach((group) => {
        COLUMN_DEFS.forEach((column) => {
          if (this.plugin.settings.enabledSources[column.id] === false) return;
          this.getColumnHierarchyItems(group, column.id, group?.columns?.[column.id] || []);
        });
      });
    } finally {
      this.plugin.deferFirstSeenOrderSave = previousDeferred;
    }
    if (!previousDeferred && this.plugin.firstSeenOrderSaveDeferred) {
      this.plugin.firstSeenOrderSaveDeferred = false;
      this.plugin.scheduleFirstSeenOrderSave("group-hierarchy-prime", 0);
    }
  }

  getColumnHierarchyItems(group, columnId, list) {
    const items = Array.isArray(list) ? list : [];
    const mode = group?.mode || this.plugin.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    const groupId = group?.id || ORDER_GLOBAL_GROUP;
    const cacheKey = `${mode}\u0000${groupId}\u0000${columnId}\u0000${this.killMode}\u0000${(group.primaryNodeKeys || []).join("|")}`;
    if (this.columnHierarchyCache.has(cacheKey)) return this.columnHierarchyCache.get(cacheKey);
    const rootScopeKey = buildOrderScopeKey({ mode, groupId, columnId, parentNodeKey: ORDER_ROOT_PARENT });
    const rootHierarchy = (item, orderedRootKeys) => ({
      item,
      hierarchyDepth: 0,
      hasSameColumnParent: false,
      hasSameColumnChildren: false,
      parentNodeKey: ORDER_ROOT_PARENT,
      siblingKeys: orderedRootKeys,
      orderScopeKey: rootScopeKey,
    });
    const itemByKey = new Map(items.map((item) => [item.nodeKey, item]));
    const keys = new Set(items.map((item) => item.nodeKey).filter(Boolean));
    const sameColumnEdges = Object.values(this.model?.edgesById || {}).filter((edge) => {
      const source = this.model?.itemsByKey?.[edge.sourceNodeKey];
      const target = this.model?.itemsByKey?.[edge.targetNodeKey];
      return source?.columnId === columnId && target?.columnId === columnId && keys.has(edge.sourceNodeKey) && keys.has(edge.targetNodeKey);
    });
    if (sameColumnEdges.length === 0) {
      const hasSuperMemoPlanItems = items.some((item) => isSuperMemoPlanRecord(item));
      const orderedItems = hasSuperMemoPlanItems
        ? items.slice().sort(compareItemsByDepthLabel)
        : this.plugin.applyManualOrder(items, rootScopeKey, { allowManual: true });
      const orderedRootKeys = orderedItems.map((item) => item.nodeKey).filter(Boolean);
      const result = orderedItems.map((item) => rootHierarchy(item, orderedRootKeys));
      this.columnHierarchyCache.set(cacheKey, result);
      return result;
    }
    const childrenByParent = new Map();
    const parentsByChild = new Map();
    sameColumnEdges.forEach((edge) => {
      if (!childrenByParent.has(edge.sourceNodeKey)) childrenByParent.set(edge.sourceNodeKey, []);
      childrenByParent.get(edge.sourceNodeKey).push(edge.targetNodeKey);
      if (!parentsByChild.has(edge.targetNodeKey)) parentsByChild.set(edge.targetNodeKey, []);
      parentsByChild.get(edge.targetNodeKey).push(edge.sourceNodeKey);
    });
    const order = new Map(items.map((item, index) => [item.nodeKey, index]));
    const defaultItemSort = (a, b) => (order.get(a.nodeKey) ?? 9999) - (order.get(b.nodeKey) ?? 9999);
    const orderedRootItems = this.plugin.applyManualOrder(
      items.filter((item) => !(parentsByChild.get(item.nodeKey) || []).some((parentKey) => keys.has(parentKey))).sort(defaultItemSort),
      rootScopeKey,
      { allowManual: true }
    );
    const orderedRootKeys = orderedRootItems.map((item) => item.nodeKey).filter(Boolean);
    const childScopeKey = (parentNodeKey) => buildOrderScopeKey({ mode, groupId, columnId, parentNodeKey });
    const orderedChildren = (nodeKey) => {
      const childItems = (childrenByParent.get(nodeKey) || [])
        .map((childKey) => itemByKey.get(childKey))
        .filter(Boolean)
        .sort(defaultItemSort);
      if (childItems.some((item) => isSuperMemoPlanRecord(item))) {
        return childItems.slice().sort(compareItemsByDepthLabel).map((child) => child.nodeKey);
      }
      return this.plugin.applyManualOrder(childItems, childScopeKey(nodeKey), { allowManual: false }).map((child) => child.nodeKey);
    };
    const emitted = new Set();
    const result = [];
    const emit = (nodeKey, depth, parentNodeKey = ORDER_ROOT_PARENT, stack = new Set()) => {
      if (!keys.has(nodeKey) || emitted.has(nodeKey)) return;
      const item = itemByKey.get(nodeKey);
      if (!item) return;
      const siblingKeys = parentNodeKey === ORDER_ROOT_PARENT ? orderedRootKeys : orderedChildren(parentNodeKey);
      emitted.add(nodeKey);
      result.push({
        item,
        hierarchyDepth: Math.min(6, depth),
        hasSameColumnParent: (parentsByChild.get(nodeKey) || []).some((parentKey) => keys.has(parentKey)),
        hasSameColumnChildren: (childrenByParent.get(nodeKey) || []).some((childKey) => keys.has(childKey)),
        parentNodeKey,
        siblingKeys,
        orderScopeKey: buildOrderScopeKey({ mode, groupId, columnId, parentNodeKey }),
      });
      if (stack.has(nodeKey)) return;
      const nextStack = new Set(stack);
      nextStack.add(nodeKey);
      orderedChildren(nodeKey).forEach((childKey) => emit(childKey, depth + 1, nodeKey, nextStack));
    };
    orderedRootItems.forEach((item) => emit(item.nodeKey, 0, ORDER_ROOT_PARENT));
    items.forEach((item) => emit(item.nodeKey, 0, ORDER_ROOT_PARENT));
    this.columnHierarchyCache.set(cacheKey, result);
    return result;
  }

  renderItem(container, item, hierarchy = {}, group = null) {
    const row = container.createDiv({ cls: `peo-item${item.nodeKey === this.model?.startRecord?.nodeKey ? " is-start" : ""}${item.nodeKey === this.selectedNodeKey ? " is-selected" : ""}${hierarchy.hasSameColumnParent ? " is-same-column-child" : ""}${hierarchy.hasSameColumnChildren ? " has-same-column-children" : ""}` });
    const isTimelineMilestone = isTimelineMilestoneProjectionItem(item);
    if (isTimelineMilestone) row.addClass("is-timeline-milestone-projection");
    if (isSuperMemoPlanRecord(item)) row.addClass("is-supermemo-plan");
    const isOrdinaryNoteItem = item.columnId === "paradigm" && isOrdinaryNoteRecord(item);
    if (isOrdinaryNoteItem) row.addClass("is-eva-note-paradigm");
    const workspaceCarrierSourceType = getWorkspaceCarrierSourceType(item);
    if (workspaceCarrierSourceType === "tab") row.addClass("is-workspace-tab-carrier");
    if (workspaceCarrierSourceType === "paradigm") row.addClass("is-workspace-paradigm-carrier");
    row.dataset.nodeKey = item.nodeKey;
    if (!isTimelineMilestone) this.attachItemDragHandlers(row, item, hierarchy);
    const groupEl = container.closest?.(".peo-project-group");
    if (groupEl?.dataset?.groupId) row.dataset.groupId = groupEl.dataset.groupId;
    const hierarchyDepth = Number(hierarchy.hierarchyDepth || 0);
    row.style.marginLeft = `${Math.min(72, hierarchyDepth * 18)}px`;
    row.dataset.hierarchyDepth = String(hierarchyDepth);
    const main = row.createDiv({ cls: "peo-item-main" });
    main.createSpan({ cls: "peo-item-label", text: item.label || item.nodeKey });
    const badges = main.createSpan({ cls: "peo-item-badges" });
    if (isTimelineMilestone) {
      const schedule = [item.date, item.weekdayLabel, item.timeBlockLabel, item.timeBlockRange].map((value) => text(value)).filter(Boolean).join(" · ");
      main.createSpan({ cls: "peo-timeline-milestone-schedule", text: schedule });
      badges.createSpan({ cls: "peo-timeline-milestone-badge", text: item.completed === true ? "里程碑 · 完成" : "里程碑" });
      const jumpBtn = badges.createEl("button", { cls: "peo-jump-btn", text: "↗", attr: { "aria-label": "在 Timeline 中打开该里程碑所属事项" } });
      jumpBtn.title = "在 Timeline 中打开该里程碑所属事项";
      jumpBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.rememberCurrentScrollState("before-open-timeline-milestone");
        await this.plugin.openNode(item.timelineNodeKey);
      };
      row.dataset.nodeTitle = item.label || item.nodeKey;
      row.ondblclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.rememberCurrentScrollState("before-open-timeline-milestone-dblclick");
        await this.plugin.openNode(item.timelineNodeKey);
      };
      return;
    }
    if (isSuperMemoPlanRecord(item)) {
      const status = getSuperMemoPlanStatusRobust(item);
      badges.createSpan({
        cls: `peo-supermemo-badge${status === "in-progress" ? " is-active" : ""}`,
        text: status === "in-progress" ? "SM Plan · 进行中" : "SM Plan",
      });
    }
    if (workspaceCarrierSourceType) {
      badges.createSpan({
        cls: `peo-workspace-source-badge is-${workspaceCarrierSourceType}`,
        text: workspaceCarrierSourceType === "paradigm" ? "范式" : "Tab",
      });
    }
    const relationBtn = badges.createEl("button", { cls: "peo-relation-btn", text: "关系", attr: { "aria-label": "编辑 EVA 跨条目关系" } });
    relationBtn.title = "直接打开 EVA Cross 关系编辑器";
    relationBtn.onclick = async (event) => {
      event.stopPropagation();
      this.rememberCurrentScrollState("before-open-relation-editor");
      await this.plugin.openRelationEditor(item.nodeKey);
    };
    const metaBtn = badges.createEl("button", {
      cls: "peo-eva-meta-capture-btn eva-meta-capture-btn",
      text: "M",
      attr: { "aria-label": "EVA Meta 捕获项目条目" },
    });
    metaBtn.title = "EVA Meta 捕获项目条目";
    metaBtn.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const eva = getEvaMetaCaptureApi(this.app);
      if (!eva) {
        console.warn("[ProjectOverview][eva-meta.capture-unavailable]", { nodeKey: item.nodeKey, columnId: item.columnId });
        new Notice("EVA Meta 捕获未就绪");
        return;
      }
      const label = text(item.label, item.nodeKey);
      await eva.captureMetaNode({
        nodeKey: item.nodeKey,
        label,
        sourcePlugin: "project-execution-overview",
        viewType: text(item.viewType, item.columnId, "project-execution-overview"),
      });
      console.info("[ProjectOverview][eva-meta.capture-click]", { nodeKey: item.nodeKey, label, columnId: item.columnId });
    };
    const commentText = this.plugin.getComment(item.nodeKey);
    const keywordNotes = Array.isArray(item.keywordNotes) ? item.keywordNotes.filter((note) => text(note?.path)) : [];
    const workspaceBoundNote = item.workspaceBoundNote?.path ? item.workspaceBoundNote : null;
    const isMandalaPrimaryItem = group?.primaryColumnId === "mandala" && item.columnId === "mandala" && item.nodeKey === group.primaryNodeKey;
    const isWorkspacePrimaryItem = group?.primaryColumnId === "workspace" && item.columnId === "workspace" && item.nodeKey === group.primaryNodeKey;
    const commentBtn = badges.createEl("button", { cls: `peo-comment-btn${commentText ? " has-comment" : ""}`, text: commentText ? "💬" : "＋💬" });
    if (commentText) commentBtn.title = "编辑项目总览评论";
    if (commentText) {
      row.classList.add("has-comment-preview");
      main.dataset.commentPreview = getCommentPreview(commentText);
    }
    commentBtn.onclick = async (event) => {
      event.stopPropagation();
      await this.plugin.openCommentEditor(item);
    };
    if (workspaceBoundNote?.path) {
      const openBoundBtn = badges.createEl("button", { cls: "peo-bound-note-open-btn", text: "📄", attr: { "aria-label": "打开 Workspace 绑定笔记" } });
      openBoundBtn.title = `打开 Workspace 绑定笔记：${workspaceBoundNote.path}`;
      openBoundBtn.onclick = async (event) => {
        event.stopPropagation();
        this.rememberCurrentScrollState("before-open-workspace-bound-note");
        await this.plugin.openWorkspaceBoundNoteForItem(item);
      };
    }
    if (keywordNotes.length > 0) {
      const openKeywordNoteBtn = badges.createEl("button", { cls: "peo-keyword-note-open-btn", text: "📝", attr: { "aria-label": "打开关键词关联笔记" } });
      openKeywordNoteBtn.title = keywordNotes.length === 1
        ? `打开关键词关联笔记：${keywordNotes[0].path}`
        : `选择关键词关联笔记（${keywordNotes.length}）`;
      openKeywordNoteBtn.onclick = async (event) => {
        event.stopPropagation();
        this.rememberCurrentScrollState("before-open-keyword-note");
        await this.plugin.openKeywordNoteForItem(item);
      };
    }
    if (isMandalaPrimaryItem) {
      const weeklyGoalBtn = badges.createEl("button", { cls: "peo-mandala-weekly-goal-btn", text: "周", attr: { "aria-label": "打开九宫格主键周表" } });
      weeklyGoalBtn.title = "打开该九宫格主键条目的周追踪表";
      weeklyGoalBtn.onclick = async (event) => {
        event.stopPropagation();
        this.rememberCurrentScrollState("before-open-mandala-weekly-goal");
        await this.plugin.openMandalaWeeklyGoalTableForItem(item, group);
      };
    }
    if (isWorkspacePrimaryItem) {
      const workspaceWeekBtn = badges.createEl("button", { cls: "peo-mandala-weekly-goal-btn", text: "周", attr: { "aria-label": "打开项目管理 Workspace 主键周表" } });
      workspaceWeekBtn.title = "打开该项目管理 Workspace 主键的周追踪表";
      workspaceWeekBtn.onclick = async (event) => {
        event.stopPropagation();
        this.rememberCurrentScrollState("before-open-workspace-weekly-goal");
        await this.plugin.openWorkspaceWeeklyGoalTableForItem(item, group);
      };
    }
    const jumpBtn = badges.createEl("button", { cls: "peo-jump-btn", text: "↗", attr: { "aria-label": "跳转到来源位置" } });
    jumpBtn.title = isOrdinaryNoteItem ? "直接打开对应笔记" : "跳转到对应插件/视图位置";
    jumpBtn.onclick = async (event) => {
      event.stopPropagation();
      this.rememberCurrentScrollState("before-open-node");
      if (isOrdinaryNoteItem) await this.plugin.openOrdinaryNoteFile(item);
      else await this.plugin.openNode(item.nodeKey);
    };
    row.dataset.nodeTitle = item.label || item.nodeKey;
    row.onmouseenter = () => this.highlightNodeRelations(item.nodeKey, true);
    row.onmouseleave = () => this.highlightNodeRelations(item.nodeKey, false);
    row.ondblclick = async (event) => {
      event.stopPropagation();
      this.rememberCurrentScrollState("before-open-node-dblclick");
      if (isOrdinaryNoteItem) await this.plugin.openOrdinaryNoteFile(item);
      else await this.plugin.openNode(item.nodeKey);
    };
  }

  getDragPayload(event) {
    if (!event?.dataTransfer) return this.dragState || null;
    const raw = event.dataTransfer.getData(PEO_DND_TYPE) || event.dataTransfer.getData("text/plain");
    if (!raw) return this.dragState || null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.kind === "project-overview-order" && parsed.nodeKey && parsed.orderScopeKey) return parsed;
    } catch (_) {
      if (this.dragState?.nodeKey === raw) return this.dragState;
    }
    return this.dragState || null;
  }

  getDropPosition(row, event) {
    const rect = row.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  clearDropMarker(row) {
    row.removeClass("drag-over-before");
    row.removeClass("drag-over-after");
    row.removeAttribute("data-drop-position");
  }

  attachItemDragHandlers(row, item, hierarchy = {}) {
    if (isTimelineMilestoneProjectionItem(item)) return;
    const orderScopeKey = text(hierarchy.orderScopeKey);
    const siblingKeys = Array.isArray(hierarchy.siblingKeys) ? hierarchy.siblingKeys.filter(Boolean) : [];
    if (text(hierarchy.parentNodeKey, ORDER_ROOT_PARENT) !== ORDER_ROOT_PARENT) return;
    if (!orderScopeKey || siblingKeys.length <= 1) return;
    row.draggable = true;
    row.addClass("is-draggable");
    row.dataset.orderScopeKey = orderScopeKey;
    row.dataset.parentNodeKey = text(hierarchy.parentNodeKey, ORDER_ROOT_PARENT);
    row.addEventListener("dragstart", (event) => {
      if (event.target?.closest?.("button")) {
        event.preventDefault();
        return;
      }
      const payload = {
        kind: "project-overview-order",
        nodeKey: item.nodeKey,
        orderScopeKey,
      };
      this.dragState = payload;
      row.addClass("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(PEO_DND_TYPE, JSON.stringify(payload));
        event.dataTransfer.setData("text/plain", JSON.stringify(payload));
      }
    });
    row.addEventListener("dragend", () => {
      this.dragState = null;
      row.removeClass("is-dragging");
      this.clearDropMarker(row);
    });
    row.addEventListener("dragover", (event) => {
      const payload = this.getDragPayload(event);
      if (!payload || payload.nodeKey === item.nodeKey || payload.orderScopeKey !== orderScopeKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      const position = this.getDropPosition(row, event);
      this.clearDropMarker(row);
      row.addClass(position === "before" ? "drag-over-before" : "drag-over-after");
      row.dataset.dropPosition = position;
    });
    row.addEventListener("dragleave", () => this.clearDropMarker(row));
    row.addEventListener("drop", async (event) => {
      const payload = this.getDragPayload(event);
      if (!payload || payload.nodeKey === item.nodeKey || payload.orderScopeKey !== orderScopeKey) return;
      event.preventDefault();
      event.stopPropagation();
      const position = row.dataset.dropPosition || this.getDropPosition(row, event);
      this.clearDropMarker(row);
      const saved = await this.plugin.reorderManualOrder(orderScopeKey, siblingKeys, payload.nodeKey, item.nodeKey, position);
      if (saved) await this.refreshPreservingScroll();
    });
  }

  highlightNodeRelations(nodeKey, active) {
    const root = this.contentEl;
    const roleByNodeKey = new Map([[nodeKey, "focus"]]);
    Object.values(this.model?.edgesById || {}).forEach((edge) => {
      if (edge.sourceNodeKey !== nodeKey && edge.targetNodeKey !== nodeKey) return;
      const isOutgoing = edge.sourceNodeKey === nodeKey;
      const other = isOutgoing ? edge.targetNodeKey : edge.sourceNodeKey;
      const role = isOutgoing ? "outgoing" : "incoming";
      if (roleByNodeKey.get(other) !== "outgoing") roleByNodeKey.set(other, role);
      root.querySelectorAll(".peo-link[data-source-node-key][data-target-node-key]").forEach((path) => {
        if (path.dataset.sourceNodeKey !== edge.sourceNodeKey || path.dataset.targetNodeKey !== edge.targetNodeKey) return;
        path.classList.toggle("is-visible", !!active);
        path.classList.toggle("is-hovered", !!active);
        path.classList.toggle(isOutgoing ? "is-hovered-outgoing" : "is-hovered-incoming", !!active);
      });
    });
    root.querySelectorAll(".peo-item[data-node-key]").forEach((el) => {
      const role = roleByNodeKey.get(el.dataset.nodeKey || "");
      if (!role) return;
      el.classList.toggle("is-link-source", role === "focus" && !!active);
      el.classList.toggle("is-link-outgoing", role === "outgoing" && !!active);
      el.classList.toggle("is-link-incoming", role === "incoming" && !!active);
      el.classList.toggle("is-link-highlight", role !== "focus" && !!active);
    });
  }

  drawLinks(svg, boardWrap, options = {}) {
    if (!svg || !boardWrap) return;
    const reason = text(options.reason, "direct");
    const force = options.force === true;
    const now = Date.now();
    const minInterval = Number(options.minIntervalMs || 140);
    if (!force && now - Number(this.lastLinkDrawAt || 0) < minInterval) {
      if (!this.linkDrawTimer) {
        this.linkDrawTimer = window.setTimeout(() => {
          this.linkDrawTimer = null;
          if (this.lastRenderId) this.drawLinks(svg, boardWrap, { reason: `${reason}:deferred`, force: true });
        }, minInterval);
      }
      return;
    }
    this.lastLinkDrawAt = now;
    const startedAt = peoNow();
    svg.empty();
    const wrapRect = boardWrap.getBoundingClientRect();
    svg.setAttribute("width", String(Math.max(boardWrap.scrollWidth, wrapRect.width)));
    svg.setAttribute("height", String(Math.max(boardWrap.scrollHeight, wrapRect.height)));
    const groupOccurrencesById = new Map();
    boardWrap.querySelectorAll(".peo-project-group[data-group-id]").forEach((element, ordinal) => {
      const groupId = element.dataset.groupId || "";
      if (!groupOccurrencesById.has(groupId)) groupOccurrencesById.set(groupId, []);
      groupOccurrencesById.get(groupId).push({ groupId, ordinal, element });
    });
    const rows = new Map();
    const groupIdsByNodeKey = new Map();
    boardWrap.querySelectorAll(".peo-item[data-node-key]").forEach((el) => {
      const groupId = el.dataset.groupId || "";
      const nodeKey = el.dataset.nodeKey;
      rows.set(`${groupId}::${nodeKey}`, el);
      if (!groupIdsByNodeKey.has(nodeKey)) groupIdsByNodeKey.set(nodeKey, new Set());
      groupIdsByNodeKey.get(nodeKey).add(groupId);
    });
    let drawn = 0;
    Object.values(this.model?.edgesById || {}).forEach((edge) => {
      const sourceGroupIds = groupIdsByNodeKey.get(`${edge.sourceNodeKey}`);
      const targetGroupIds = groupIdsByNodeKey.get(`${edge.targetNodeKey}`);
      if (!sourceGroupIds || !targetGroupIds) return;
      const [smallerGroupIds, largerGroupIds] = sourceGroupIds.size <= targetGroupIds.size
        ? [sourceGroupIds, targetGroupIds]
        : [targetGroupIds, sourceGroupIds];
      const sharedGroupOccurrences = [];
      smallerGroupIds.forEach((groupId) => {
        if (!largerGroupIds.has(groupId)) return;
        (groupOccurrencesById.get(groupId) || []).forEach((occurrence) => sharedGroupOccurrences.push(occurrence));
      });
      sharedGroupOccurrences.sort((left, right) => left.ordinal - right.ordinal);
      sharedGroupOccurrences.forEach(({ groupId }) => {
        const source = rows.get(`${groupId}::${edge.sourceNodeKey}`);
        const target = rows.get(`${groupId}::${edge.targetNodeKey}`);
        if (!source || !target) return;
        if (source.closest?.(".peo-column") === target.closest?.(".peo-column")) return;
        const a = source.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const x1 = a.right - wrapRect.left + boardWrap.scrollLeft;
        const y1 = a.top + a.height / 2 - wrapRect.top + boardWrap.scrollTop;
        const x2 = b.left - wrapRect.left + boardWrap.scrollLeft;
        const y2 = b.top + b.height / 2 - wrapRect.top + boardWrap.scrollTop;
        const mid = Math.max(24, Math.abs(x2 - x1) / 2);
        const path = createSvgElement("path", `peo-link peo-link-${edge.kind || "relation"}`);
        path.dataset.edgeId = `${groupId}::${edge.id}`;
        path.dataset.sourceNodeKey = edge.sourceNodeKey;
        path.dataset.targetNodeKey = edge.targetNodeKey;
        path.setAttribute("d", `M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`);
        path.addEventListener("mouseenter", () => {
          path.classList.add("is-hovered");
          this.highlightLinkEndpoints(boardWrap, edge.sourceNodeKey, edge.targetNodeKey, true, groupId);
        });
        path.addEventListener("mouseleave", () => {
          path.classList.remove("is-hovered");
          this.highlightLinkEndpoints(boardWrap, edge.sourceNodeKey, edge.targetNodeKey, false, groupId);
        });
        svg.appendChild(path);
        drawn += 1;
      });
    });
    logPeoPerf("draw-links", {
      reason,
      force,
      durationMs: Math.round(peoNow() - startedAt),
      rows: rows.size,
      edges: Object.keys(this.model?.edgesById || {}).length,
      drawn,
    });
  }
  highlightLinkEndpoints(boardWrap, sourceNodeKey, targetNodeKey, active, groupId = "") {
    [
      { nodeKey: sourceNodeKey, className: "is-link-outgoing" },
      { nodeKey: targetNodeKey, className: "is-link-incoming" }
    ].forEach(({ nodeKey, className }) => {
      boardWrap.querySelectorAll(".peo-item[data-node-key]").forEach((item) => {
        if (groupId && item.dataset.groupId !== groupId) return;
        if (item.dataset.nodeKey !== nodeKey) return;
        item.classList.toggle("is-link-highlight", !!active);
        item.classList.toggle(className, !!active);
      });
    });
  }
}

// Read-only identity evidence for goal rename. No commit authorization.
class GoalRenameIdentityEvidence {
  constructor(preparation) {
    this.p=preparation; this.o=preparation.owner;
    this.eva=this.o.getEva();this.gtd=this.o.getGtdTaskManagerApi();
    this.evaFn=this.eva?.getOutgoingRelationBatchSnapshot;
    this.gtdFn=this.gtd?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot;
    this.snapshotFn=this.o.getMandalaOperationalContextKeySnapshot;
    this.generation=this.o.operationalContextSnapshotProviderGeneration;
    if(typeof this.evaFn!=="function"||typeof this.gtdFn!=="function"||typeof this.snapshotFn!=="function")this.fail("GOAL_IDENTITY_PROVIDER_UNAVAILABLE");
  }
  fail(code){this.p.fail(code)}
  guard(){
    if(this.o.contextCarrierUnloading||this.o.getEva()!==this.eva||this.o.getGtdTaskManagerApi()!==this.gtd
      ||this.eva.getOutgoingRelationBatchSnapshot!==this.evaFn||this.gtd.getContextCapsuleTopLevelProjectCarrierBatchSnapshot!==this.gtdFn
      ||this.o.getMandalaOperationalContextKeySnapshot!==this.snapshotFn||this.o.operationalContextSnapshotProviderGeneration!==this.generation)this.fail("GOAL_IDENTITY_PROVIDER_CHANGED");
  }
  async read(ref,primary){
    this.guard();
    const s=await this.p.bounded(()=>this.snapshotFn.call(this.o,{sourceNotePath:ref.sourceNotePath,primaryNodeKeys:[ref.nodeKey],operationalLifecyclePolicyV1:"tracking-only-v2",readPurpose:"operation-check"}));
    this.guard();
    if(!s||s.ok!==true||s.complete!==true||s.readPurpose!=="operation-check"||s.writeAuthorization!==false||s.contractVersion!==1||s.operationalLifecyclePolicyV1!=="tracking-only-v2"
      ||s.snapshotType!=="project-overview-mandala-operational-context-keys-v1"||s.sourceNotePath!==ref.sourceNotePath
      ||s.providerGeneration!==this.generation||s.instanceId!==this.generation||!Number.isFinite(Date.parse(s.generatedAt))
      ||s.count!==1||s.totalCount!==1||s.returnedCount!==1||s.limit!==OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES
      ||s.hasMore!==false||s.truncated!==false||!Array.isArray(s.items)||s.items.length!==1||!Array.isArray(s.diagnostics))this.fail("GOAL_IDENTITY_SNAPSHOT_INVALID");
    const item=s.items[0],d=item?.currentDeclaration,c=item?.gtdCarrier,parsed=parseJumpNodeKey(c?.nodeKey);
    const nonempty=v=>typeof v==="string"&&v.trim()===v&&v.length>0&&v.length<8192;
    if(item?.primaryNodeKey!==ref.nodeKey||item.groupId!==ref.nodeKey||item.sourceNotePath!==ref.sourceNotePath||item.itemId!==primary.nodeId)this.fail("GOAL_IDENTITY_OWNER_MISMATCH");
    if(item.eligible!==true||!Array.isArray(item.exclusionReasons)||item.exclusionReasons.length||s.diagnostics.length)this.fail("GOAL_IDENTITY_CARRIER_UNAVAILABLE");
    if(!Array.isArray(item.declarations)||item.declarations.length!==1||JSON.stringify(item.declarations[0])!==JSON.stringify(d)
      ||d?.displayLabel!==primary.oldDisplayLabel||!nonempty(d.contextKeyId)||!nonempty(d.declarationEvidenceId)||!nonempty(d.address)
      ||d.archivedByAddress!==false)this.fail("GOAL_IDENTITY_DECLARATION_MISMATCH");
    if(!c||!nonempty(c.relationId)||c.relationType!=="承载"||!nonempty(c.tagId)||!nonempty(c.nodeKey)
      ||parsed?.viewType!=="gtd"||parsed.scopeType!=="note"||!nonempty(parsed.notePath)||parsed.scopeId!==parsed.notePath||!nonempty(parsed.itemId)
      ||!this.p.scopeValid({sourceNotePath:parsed.notePath,dataPath:'identity-data.json',keywordPath:'identity-keywords.json'}))this.fail("GOAL_IDENTITY_CARRIER_INVALID");
    for(const role of ['eva','gtd'])if(!nonempty(s.evidenceProviders?.[role]?.providerGeneration)||!nonempty(s.evidenceProviders?.[role]?.revision))this.fail("GOAL_IDENTITY_REVISION_MISSING");
    if(!nonempty(s.revision))this.fail("GOAL_IDENTITY_REVISION_MISSING");
    const evidence={version:1,policy:'goal-exact-carrier-and-explicit-binding-v1',primaryNodeKey:ref.nodeKey,sourceNotePath:ref.sourceNotePath,itemId:item.itemId,
      declaration:JSON.parse(JSON.stringify(d)),carrier:{nodeKey:c.nodeKey,projectId:parsed.itemId,sourceNotePath:parsed.notePath,tagId:c.tagId,relationId:c.relationId,relationType:c.relationType},
      providerGeneration:s.providerGeneration,revision:s.revision,evidenceProviders:{eva:{providerGeneration:s.evidenceProviders.eva.providerGeneration,revision:s.evidenceProviders.eva.revision},gtd:{providerGeneration:s.evidenceProviders.gtd.providerGeneration,revision:s.evidenceProviders.gtd.revision}}};
    if(JSON.stringify(evidence).length>65536)this.fail('GOAL_IDENTITY_LIMIT');return evidence;
  }
  bindings(plans,evidence){
    return plans.map(plan=>{
      if(plan.pluginId==='gtd-task-manager'){
        if(plan.targets.length!==1||plan.targets[0].carrierId!==evidence.carrier.tagId||plan.scope.sourceNotePath!==evidence.carrier.sourceNotePath)this.fail('GOAL_GTD_BINDING_IDENTITY_MISMATCH');
        return {pluginId:plan.pluginId,state:'identity-verified',bindingPolicy:'unique-eva-gtd-project-and-tag',bindingVerified:true,relationshipVerified:true,identity:evidence.carrier,plan};
      }
      return {pluginId:plan.pluginId,state:plan.targets.length?'binding-verified':'no-explicit-binding',bindingPolicy:'persisted-exact-display-binding',bindingVerified:plan.targets.length===1,relationshipVerified:false,plan};
    });
  }
}

// PEO owns declaration checks and consumer discovery. Preparation has no writes.
class GoalContextRenamePreparation {
  constructor(owner) { this.owner=owner; this.inFlight=false; }
  fail(code) { throw Object.assign(new Error(code),{code}); }
  hash(value) { return createHash("sha256").update(value,"utf8").digest("hex"); }
  async bounded(fn) {
    let timer; try { return await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error("GOAL_RENAME_TIMEOUT"),{code:"GOAL_RENAME_TIMEOUT"})),8000);})]); }
    finally {clearTimeout(timer);}
  }
  scopeValid(scope) {
    return scope && ["sourceNotePath","dataPath","keywordPath"].every(k=>typeof scope[k]==="string" && scope[k] && !scope[k].includes("\\")
      && !scope[k].includes(":") && !scope[k].startsWith("/") && !scope[k].split("/").some(x=>!x||x==="."||x==="..")) && scope.dataPath!==scope.keywordPath;
  }
  validatePlan(id,r,oldLabel,newLabel) {
    const p=r?.plan;
    if(r?.ok!==true || r.version!==2 || p?.version!==2 || p.pluginId!==id || !this.scopeValid(p.scope)
      || p.newDisplayLabel!==newLabel || !Array.isArray(p.targets) || p.targets.length>1 || r.matchedCount!==p.targets.length
      || p.search?.repair!==false || JSON.stringify(p.search?.oldLabels)!==JSON.stringify([oldLabel])) this.fail("GOAL_CONSUMER_PREPARE_INVALID");
    for(const t of p.targets) if(typeof t.carrierId!=="string" || !t.carrierId.trim() || !/^[a-f0-9]{64}$/.test(t.recordHash)
      || JSON.stringify(t.oldLabels)!==JSON.stringify([oldLabel]) || typeof t.storageKey!=="string" || t.storageKey!==oldLabel.toLocaleLowerCase()) this.fail("GOAL_CONSUMER_TARGET_INVALID");
    if(JSON.stringify(p).length>65536) this.fail("GOAL_CONSUMER_PLAN_LIMIT");
    return JSON.parse(JSON.stringify(p));
  }
  async prepare(input={}) {
    if(this.inFlight) this.fail("GOAL_RENAME_PREVIEW_BUSY");
    this.inFlight=true; const started=Date.now();
    try {
      const ref=Object.freeze({nodeKey:input.nodeKey,sourceNotePath:input.sourceNotePath}),newLabel=input.newDisplayLabel;
      const o=this.owner, api=window.__mandalaTimeBlocksPluginApi, primaryFn=api?.prepareGoalContextRenamePrimaryV1;
      if(typeof primaryFn!=="function") this.fail("GOAL_RENAME_OWNER_UNAVAILABLE");
      const ownApi=o.projectExecutionOverviewPublicApi, generation=o.operationalContextSnapshotProviderGeneration;
      const manager=o.getContextKeyRenameManager(),journal=manager.journal(),config=manager.config(),memory=JSON.stringify(o.settings);
      const ids=["workspace-mount","gtd-task-manager","collection-card-view"];
      const consumers=ids.map(id=>{const p=o.getContextCapsuleRenameConsumers().find(x=>x.id===id);if(typeof p?.api?.contextCapsuleRenameV2!=="function")this.fail("GOAL_CONSUMER_UNAVAILABLE");return {id,api:p.api,fn:p.api.contextCapsuleRenameV2};});
      const journalMemory=JSON.stringify(journal.data), journalRaw=journal.raw;
      let identityReader=null;
      const guard=()=>{
        identityReader?.guard();
        if(o.contextCarrierUnloading || !ownApi || ownApi!==window.__projectExecutionOverviewPluginApi || !generation || generation!==o.operationalContextSnapshotProviderGeneration
          || api!==window.__mandalaTimeBlocksPluginApi || primaryFn!==api.prepareGoalContextRenamePrimaryV1
          || config!==manager.config() || memory!==JSON.stringify(o.settings) || journal!==o.contextRenameJournal || journal.closed || journal.error
          || journal.raw!==journalRaw || JSON.stringify(journal.data)!==journalMemory
          || consumers.some(c=>{const p=o.getContextCapsuleRenameConsumers().find(x=>x.id===c.id);return p?.api!==c.api||p?.api?.contextCapsuleRenameV2!==c.fn;})) this.fail("GOAL_RENAME_LEASE_CHANGED");
      };
      const readJournal=async()=>{const a=o.app.vault.adapter;return await a.exists(journal.path)?await a.read(journal.path):null;};
      guard();
      if(await this.bounded(readJournal)!==journalRaw) this.fail("GOAL_RENAME_JOURNAL_CHANGED");
      const prior=journal.prior(ref.nodeKey);
      if(prior && prior.status!=="complete") this.fail("GOAL_RENAME_PENDING_REQUIRES_RECOVERY");
      const state=await this.bounded(()=>manager.read());
      if(Buffer.byteLength(state.raw,"utf8")>8*1024*1024) this.fail("GOAL_DECLARATION_LIMIT");
      const comment=state.data.commentsByNodeKey[ref.nodeKey];
      if(typeof comment!=="string" || o.settings.commentsByNodeKey?.[ref.nodeKey]!==comment) this.fail("GOAL_DECLARATION_UNSAVED");
      const unclosed=value=>value.split(/\r?\n/).filter(line=>line.trim()==="---").length%2!==0;
      if(unclosed(comment)) this.fail("GOAL_PEO_DECLARATION_UNCLOSED");
      const replacement=manager.replace(comment,newLabel);
      const names=new Set([replacement.oldLabel,replacement.newLabel].map(v=>v.toLocaleLowerCase()));
      for(const [other,value] of Object.entries(state.data.commentsByNodeKey)) {
        // Existing extraction ignores trailing unclosed blocks. Close only the
        // temporary parse input to detect hidden collisions; never save it.
        if(other!==ref.nodeKey && unclosed(value) && manager.declarations(value+"\n---").some(d=>names.has(d.label.toLocaleLowerCase()))) this.fail("GOAL_PEO_CONFLICT_DECLARATION_UNCLOSED");
      }
      manager.unique(state.data,ref.nodeKey,[replacement.oldLabel,replacement.newLabel]);
      const request={...ref,oldDisplayLabel:replacement.oldLabel,newDisplayLabel:replacement.newLabel};
      const primary=await this.bounded(()=>primaryFn.call(api,request)); guard();
      if(!primary?.ok || primary.contractVersion!==1 || primary.preparationType!=="mandala-goal-rename-primary-readonly-v1" || primary.canCommit!==false
        || primary.nodeKey!==ref.nodeKey || primary.sourceNotePath!==ref.sourceNotePath || primary.oldDisplayLabel!==request.oldDisplayLabel
        || primary.newDisplayLabel!==request.newDisplayLabel || !primary.providerGeneration || !/^[a-f0-9]{64}$/.test(primary.revision)) this.fail("GOAL_PRIMARY_PREPARE_INVALID");
      identityReader=new GoalRenameIdentityEvidence(this);
      const identity=await identityReader.read(ref,primary);guard();
      const plans=[];
      const call=async c=>this.validatePlan(c.id,await this.bounded(()=>c.fn.call(c.api,{phase:"prepare",source:"project-execution-overview",oldLabels:[request.oldDisplayLabel],newDisplayLabel:request.newDisplayLabel,repair:false})),request.oldDisplayLabel,request.newDisplayLabel);
      for(const c of consumers) {plans.push(await call(c));guard();}
      for(let i=0;i<consumers.length;i++) {if(JSON.stringify(await call(consumers[i]))!==JSON.stringify(plans[i]))this.fail("GOAL_CONSUMER_PLAN_CHANGED");guard();}
      const primaryAfter=await this.bounded(()=>primaryFn.call(api,request));
      if(JSON.stringify(primaryAfter)!==JSON.stringify(primary)) this.fail("GOAL_PRIMARY_CHANGED");
      const identityAfter=await identityReader.read(ref,primary);
      if(JSON.stringify(identityAfter)!==JSON.stringify(identity))this.fail("GOAL_IDENTITY_CHANGED");
      const verifiedBindings=identityReader.bindings(plans,identity);guard();
      if((await this.bounded(()=>manager.read())).raw!==state.raw || await this.bounded(readJournal)!==journalRaw) this.fail("GOAL_DECLARATION_OR_JOURNAL_CHANGED");
      guard();
      return {ok:true,contractVersion:1,preparationType:"peo-goal-rename-readonly-v1",status:"prepared-readonly",canCommit:false,...ref,
        oldDisplayLabel:request.oldDisplayLabel,newDisplayLabel:request.newDisplayLabel,primary,
        declaration:{beforeHash:this.hash(comment),afterHash:this.hash(replacement.comment),settingsHash:this.hash(state.raw)},
        identity, consumers:verifiedBindings,
        limits:["No write authorization","Workspace/Collection prove persisted full-label bindings, not EVA relationships or permanent identity","Consumer full-file byte stability is not asserted","Historical/non-active GTD projects cannot be certified by the current carrier provider", "Two observed reads are not an atomic cross-provider snapshot", "Full confirmed coordinator required before commit"],
        metrics:{durationMs:Date.now()-started,primaryReads:2,consumerPrepareCalls:6,identitySnapshotReads:2}};
    } finally {this.inFlight=false;}
  }
}

module.exports = class ProjectExecutionOverviewPlugin extends Plugin {
  getContextKeyRenameManager() {
    if (!this.contextKeyRenameManager) {
      const pluginDir = this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
      const basePath = this.app.vault.adapter.basePath;
      if (!basePath) throw new Error("desktop-adapter-required");
      const code = require("fs").readFileSync(require("path").join(basePath, pluginDir, "context-key-rename-manager.cjs"), "utf8");
      const mod = { exports: {} }; new Function("require", "module", "exports", code)(require, mod, mod.exports);
      this.contextKeyRenameManager = new mod.exports.ContextKeyRenameManager({ owner: this, Modal, Notice,
        vaultId: basePath, storage: window.localStorage,
        declarations: extractGroupKeywordDeclarationsFromComment, normalize: normalizeContextCapsuleDisplayLabel, parse: parseContextCapsuleKeyword,
        workspace: () => window.__workspaceMountPluginApi,
        audit: () => window.__operationAuditTrailApi,
        publish: detail => window.dispatchEvent(new CustomEvent("project-execution-overview:context-key-renamed-v1", { detail })) });
    }
    return this.contextKeyRenameManager;
  }
  contextRenameLabel(nodeKey, comments = this.settings.commentsByNodeKey) {
    const labels = extractGroupKeywordsFromComment(comments?.[nodeKey] || "").map(normalizeContextCapsuleDisplayLabel);
    return labels.length === 1 ? labels[0] : "";
  }
  async initializeContextRenameJournal() {
    this.contextRenameStatusBar = this.addStatusBarItem();
    this.contextRenameStatusBar.onclick = () => this.openContextRenameRecovery();
    try {
      const pluginDir = this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
      if (!this.app.vault.adapter.basePath) throw new Error("desktop-adapter-required");
      const source = require("fs").readFileSync(require("path").join(this.app.vault.adapter.basePath, pluginDir, "context-rename-journal.cjs"), "utf8");
      const localModule = { exports: {} };
      new Function("require", "module", "exports", source)(require, localModule, localModule.exports);
      const { RenameJournal } = localModule.exports;
      this.contextRenameJournal = new RenameJournal({
        adapter: this.app.vault.adapter, pluginDir,
        api: id => this.getContextCapsuleRenameConsumers().find(p => p.id === id)?.api,
        participants: () => this.getContextCapsuleRenameConsumers().map(p => ({ id: p.id, label: p.label,
          excluded: p.id === "state-capsules" && !this.app.plugins?.enabledPlugins?.has?.(p.id) && !p.api })),
        managedGuard: job => this.getContextKeyRenameManager().guard(job),
        managedCurrent: job => !this.contextCarrierUnloading && job.managedRename.config === this.getContextKeyRenameManager().config()
          && require("crypto").createHash("sha256").update(String(this.settings.commentsByNodeKey?.[job.primaryNodeKey] || "")).digest("hex") === job.managedRename.afterHash,
        currentLabel: nodeKey => this.contextRenameLabel(nodeKey),
        savedLabel: async nodeKey => this.contextRenameLabel(nodeKey, (await this.loadData())?.commentsByNodeKey || {}),
        changed: snapshot => {
          const pending = snapshot.jobs.filter(j => !["complete", "superseded"].includes(j.status)).length;
          this.contextRenameStatusBar.setText(snapshot.error ? "主键同步：记录异常，点击检查" : pending ? `主键同步：${pending} 项待完成` : snapshot.jobs.length ? "主键同步：已核验" : "主键同步：无待处理");
          this.contextRenameStatusBar.title = "查看改名同步进度、失败原因并重试";
        },
      });
      await this.contextRenameJournal.load();
      this.contextRenameProviderReady = () => {
        if (this.contextRenameJournal.snapshot().jobs.some(j => j.status === "pending")) this.contextRenameJournal.schedule(1500);
      };
      window.addEventListener("ontology-index-provider:ready", this.contextRenameProviderReady);
      this.app.workspace.onLayoutReady(() => this.contextRenameJournal?.schedule(1500));
    } catch (error) {
      this.contextRenameInitializationError = error.message || "journal-unavailable";
      this.contextRenameStatusBar.setText("主键同步：恢复模块不可用");
    }
    this.addCommand({ id: "context-key-rename-recovery", name: "查看主键改名同步进度与重试", callback: () => this.openContextRenameRecovery() });
  }
  async confirmContextRenameRecovery(request) {
    if (!this.contextRenameJournal) { new Notice("主键同步记录不可用；未修改其他插件，请打开同步进度检查。"); return { ok: false }; }
    try {
      const prepared = await this.contextRenameJournal.preview(request);
      const previews = prepared.providers.map(p => ({ label: p.label, matchedCount: p.matchedCount || 0,
        ok: ["prepared", "excluded"].includes(p.state), reason: p.state === "excluded" ? "未启用，本次不参与" : p.reason,
        pending: p.state === "pending", excluded: p.state === "excluded" }));
      const confirmed = await new ContextCapsuleRenameConfirmModal(this.app, { oldDisplayLabel: prepared.oldDisplayLabel,
        newDisplayLabel: prepared.newDisplayLabel, previews, recovery: true, repair: !!prepared.repair }).waitForResult();
      if (!confirmed) return { ok: true, confirmed: false };
      const result = await this.contextRenameJournal.confirm(prepared);
      this.invalidateGlobalKeywordNavCache("context-rename-recovery");
      new Notice(result.status === "complete" ? "主键改名同步已逐项核验完成。" : "主键改名同步尚未完成；进度已保存，可点击状态栏查看和补齐。");
      return { ok: result.status === "complete", confirmed: true, result };
    } catch (error) {
      new Notice(`主键同步待处理：${error.message}。已完成的数据不会自动回滚，请查看同步进度。`);
      return { ok: false, reason: error.message };
    }
  }
  openContextRenameRecovery() {
    const modal = new Modal(this.app);
    const labels = { prepared: "待执行", committing: "待核验", verified: "已核验", "no-match": "无绑定", excluded: "未参与", pending: "待补齐", review: "需重新确认" };
    const render = () => {
      const el = modal.contentEl; el.empty(); el.createEl("h3", { text: "主键改名同步进度" });
      const snapshot = this.contextRenameJournal?.snapshot();
      if (!snapshot || snapshot.error) el.createEl("p", { text: `同步记录异常：${snapshot?.error || this.contextRenameInitializationError || "模块未就绪"}。原记录及 previous-good 保留；请排查后重新加载，勿清空记录。` });
      for (const job of (snapshot?.jobs || []).filter(j => j.status !== "superseded").reverse()) {
        el.createEl("h4", { text: `${job.oldDisplayLabel} → ${job.newDisplayLabel}` });
        el.createEl("p", { text: job.status === "complete" ? "全部已核验" : job.reason === "declaration-changed" ? "主键声明已变化，旧操作已暂停" : "同步尚未完成" });
        for (const provider of job.providers) el.createEl("p", { text: `${provider.label}：${labels[provider.state] || provider.state}${provider.reason ? "（" + provider.reason + "）" : ""}` });
        if (!["complete", "superseded"].includes(job.status) && !snapshot.error) {
          const retry = el.createEl("button", { text: "重试并核验未完成项" });
          retry.onclick = async () => { retry.disabled = true; try { await this.contextRenameJournal.retry(job.id); } catch (e) { new Notice(e.message); } render(); };
          if (job.providers.some(p => p.state === "review" || p.reason === "repair-preview-required")) {
            const review = el.createEl("button", { text: "重新预览并确认" });
            review.onclick = async () => { review.disabled = true; await this.confirmContextRenameRecovery({ primaryNodeKey: job.primaryNodeKey, domain: job.domain, oldDisplayLabel: job.oldDisplayLabel, newDisplayLabel: job.newDisplayLabel, repair: job.repair }); render(); };
          }
        }
      }
      if (snapshot && !snapshot.jobs.length) el.createEl("p", { text: "尚无已确认的改名同步记录。" });
      el.createEl("button", { text: "刷新状态" }).onclick = render;
    };
    modal.onOpen = render; modal.open();
  }
  async onload() {
    await this.loadSettings();
    this.lastScrollState = this.lastScrollState || null;
    this.firstSeenOrderSaveTimer = null;
    this.deferFirstSeenOrderSave = false;
    this.firstSeenOrderSaveDeferred = false;
    this.contextCarrierSnapshotCache = new Map();
    this.contextCarrierCacheGeneration = 0;
    this.contextCarrierDirtyProviders = new Map();
    this.contextCarrierEventGeneration = 0;
    this.contextCarrierAutoRefreshTimer = null;
    this.contextCarrierUnloading = false;
    this.confirmedItemRevealRequestGeneration = 0;
    this.confirmedItemRevealRequest = null;
    this.settingsWriteQueue = Promise.resolve();
    this.primaryKeyLifecycleEventTimer = null;
    this.primaryKeyLifecycleChangedKeys = new Set();
    this.primaryCollectionProjectionBuildPromises = new Map();
    this.activeCapsuleInfo = null;
    this.capsuleOverlayState = normalizeProjectOverviewCapsuleState({});
    this.suppressFirstSeenOrderSave = false;
    this.lastMandalaPrimaryOrderSnapshot = [];
    this.lastWorkspacePrimaryOrderSnapshot = [];
    this.globalKeywordNavCache = { items: [], builtAt: 0 };
    this.globalKeywordNavGeneration = 0;
    this.globalKeywordNavScope = this.getGlobalKeywordNavScope();
    this.globalKeywordNavBuildPromise = null;
    this.operationalContextSnapshotProviderGeneration = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.registerStateCapsulesApi();
    this.registerInterval(window.setInterval(() => {
      const cache = this.contextTrackingVisibility; if (!cache?.ok) return;
      let scope; const api = window.__mandalaTimeBlocksPluginApi; try { scope = api?.getContextTrackingScopeV1?.(); } catch (_) {}
      if (cache.api === api && scope?.ok && scope.sourceScope === cache.sourceScope && scope.providerGeneration === cache.providerGeneration && cache.generation === this.globalKeywordNavGeneration && Date.now() - cache.at < 30000) return;
      this.contextTrackingVisibility = null; this.contextTrackingVisibilitySignature = "unknown";
      window.dispatchEvent(new CustomEvent("context-key-tracking-visibility:changed", { detail: { provider: this.projectExecutionOverviewPublicApi } }));
    }, 5000));
    this.tryLoadActiveCapsuleContext();
    this.registerView(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW, (leaf) => new ProjectExecutionOverviewView(leaf, this));
    this.addRibbonIcon("network", "项目执行总览", async () => await this.activateView());
    this.addCommand({ id: "open-project-execution-overview", name: "Open Project Execution Overview", callback: async () => await this.activateView() });
    this.addCommand({ id: "refresh-project-execution-overview", name: "Refresh Project Execution Overview", callback: async () => await this.refreshViews({ preserveScroll: true, reason: "command-refresh" }) });
    this.addSettingTab(new ProjectExecutionOverviewSettingTab(this.app, this));
    const trackingChanged = event => {
      const source = window.__mandalaTimeBlocksPluginApi?.getContextTrackingScopeV1?.();
      if (!source?.ok || event?.detail?.sourceNotePath !== source.sourceScope) return;
      this.contextTrackingVisibilityEpoch = (this.contextTrackingVisibilityEpoch || 0) + 1;
      this.contextTrackingVisibility = null; this.contextTrackingVisibilityAttempt = 0;
      this.ensureContextTrackingVisibility();
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)) {
        const view = leaf.view;
        view.trackingEvidenceEpoch = (view.trackingEvidenceEpoch || 0) + 1;
        view.trackingEvidence = { ok: false, states: new Map(), error: "追踪状态更新中" };
        view.queueTrackingDisplayRefresh?.();
      }
    };
    window.addEventListener("mandala-time-blocks:tracking-lifecycle-changed", trackingChanged);
    this.register(() => window.removeEventListener("mandala-time-blocks:tracking-lifecycle-changed", trackingChanged));
    this.boundEvaChangedHandler = () => this.refreshViews({ preserveScroll: true, reason: "eva-cross-view-relations:changed" }).catch((error) => console.warn("[ProjectOverview][eva.changed-refresh-failed]", error));
    window.addEventListener?.("eva-cross-view-relations:changed", this.boundEvaChangedHandler);
    this.boundSuperMemoPlanChangedHandler = () => this.refreshViews({ preserveScroll: true, reason: "supermemo-plan:changed" }).catch((error) => console.warn("[ProjectOverview][supermemo.changed-refresh-failed]", error));
    window.addEventListener?.("supermemo-plan:changed", this.boundSuperMemoPlanChangedHandler);
    this.boundContextCarrierChangedHandler = (event) => {
      const detail = event?.detail || {};
      this.invalidateContextCarrierSnapshotCache(detail);
      this.markContextCarrierProviderDirty(detail);
      this.scheduleContextCarrierAutoRefresh("provider-change");
    };
    window.addEventListener?.("context-capsule-carrier:changed", this.boundContextCarrierChangedHandler);
    if (typeof this.app.workspace?.on === "function") {
      this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
          .map((leaf) => leaf.view)
          .forEach((view) => this.maybeProbeContextCarrierOnVisibilityChange(view));
      }));
    }
    this.boundStateCapsuleChangedHandler = (event) => {
      const detail = event?.detail || {};
      this.setCapsuleContext(detail.capsule || detail);
      this.applyCapsuleState(detail.projectExecutionOverview || {}, {
        capsuleId: detail.capsuleId,
        source: "state-capsules-event",
      }).catch((error) => console.warn("[ProjectOverview][state-capsule.apply-failed]", error));
    };
    window.addEventListener?.("state-capsules:active-capsule-changed", this.boundStateCapsuleChangedHandler);
    await this.initializeContextRenameJournal();
  }

  async onunload() {
    this.trackingSnapshotHost?.close();
    this.contextTrackingVisibility = null; this.contextCarrierUnloading = true;
    window.dispatchEvent(new CustomEvent("context-key-tracking-visibility:changed", { detail: { provider: this.projectExecutionOverviewPublicApi } }));
    this.contextKeyRenameManager?.close();
    this.contextRenameJournal?.close();
    if (this.contextRenameProviderReady) window.removeEventListener("ontology-index-provider:ready", this.contextRenameProviderReady);
    await this.cancelConfirmedRevealForUnload();
    this.contextCarrierEventGeneration += 1;
    if (this.contextCarrierAutoRefreshTimer) window.clearTimeout?.(this.contextCarrierAutoRefreshTimer);
    this.contextCarrierAutoRefreshTimer = null;
    this.contextCarrierDirtyProviders?.clear?.();
    if (this.primaryKeyLifecycleEventTimer) window.clearTimeout?.(this.primaryKeyLifecycleEventTimer);
    this.primaryKeyLifecycleEventTimer = null;
    this.primaryKeyLifecycleChangedKeys?.clear?.();
    this.primaryCollectionProjectionBuildPromises?.clear?.();
    if (this.firstSeenOrderSaveTimer) window.clearTimeout?.(this.firstSeenOrderSaveTimer);
    if (this.boundEvaChangedHandler) window.removeEventListener?.("eva-cross-view-relations:changed", this.boundEvaChangedHandler);
    if (this.boundSuperMemoPlanChangedHandler) window.removeEventListener?.("supermemo-plan:changed", this.boundSuperMemoPlanChangedHandler);
    if (this.boundContextCarrierChangedHandler) window.removeEventListener?.("context-capsule-carrier:changed", this.boundContextCarrierChangedHandler);
    if (this.boundStateCapsuleChangedHandler) window.removeEventListener?.("state-capsules:active-capsule-changed", this.boundStateCapsuleChangedHandler);
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .forEach((view) => view?.cancelConfirmedItemReveal?.("plugin-unload"));
    if (window.__projectExecutionOverviewPluginApi === this.projectExecutionOverviewPublicApi) delete window.__projectExecutionOverviewPluginApi;
    this.projectExecutionOverviewPublicApi = null;
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW).forEach((leaf) => leaf.detach());
  }

  normalizeContextCarrierCacheKey(value = "") {
    return normalizeContextCapsuleDisplayLabel(value).toLocaleLowerCase();
  }

  buildContextCarrierSnapshotCacheKey(providerId = "", options = {}) {
    const keys = Array.isArray(options?.contextKeys)
      ? options.contextKeys.map((entry) => this.normalizeContextCarrierCacheKey(entry)).filter(Boolean).sort()
      : [this.normalizeContextCarrierCacheKey(options?.contextKey || options?.displayLabel || "")].filter(Boolean);
    return JSON.stringify({
      providerId: text(providerId),
      contextKeys: keys,
      limit: Number(options?.limit || 0) || 0,
      source: text(options?.source),
      summaryOnly: options?.summaryOnly === true,
      cursor: text(options?.cursor || options?.nextCursor),
      detailLevel: text(options?.detailLevel),
      includeChildren: options?.includeChildren === true,
    });
  }

  async getContextCarrierSnapshotCached(provider, options = {}) {
    if (typeof provider?.api?.getContextCapsuleCarrierSnapshot !== "function") return null;
    const providerId = text(provider.id || provider.pluginId);
    const cacheKey = this.buildContextCarrierSnapshotCacheKey(providerId, options);
    const cached = this.contextCarrierSnapshotCache?.get(cacheKey);
    if (cached) {
      this.contextCarrierSnapshotCache.delete(cacheKey);
      this.contextCarrierSnapshotCache.set(cacheKey, cached);
      return cached.snapshot;
    }
    const generation = Number(this.contextCarrierCacheGeneration || 0);
    const snapshot = await provider.api.getContextCapsuleCarrierSnapshot(options);
    if (generation !== Number(this.contextCarrierCacheGeneration || 0)) return snapshot;
    if (!this.contextCarrierSnapshotCache) this.contextCarrierSnapshotCache = new Map();
    this.contextCarrierSnapshotCache.set(cacheKey, {
      providerId,
      contextKeys: Array.isArray(options?.contextKeys)
        ? options.contextKeys.map((entry) => this.normalizeContextCarrierCacheKey(entry)).filter(Boolean)
        : [this.normalizeContextCarrierCacheKey(options?.contextKey || options?.displayLabel || "")].filter(Boolean),
      revision: text(snapshot?.revision || snapshot?.version),
      snapshot,
      cachedAt: nowMs(),
    });
    while (this.contextCarrierSnapshotCache.size > 48) {
      const oldestKey = this.contextCarrierSnapshotCache.keys().next().value;
      if (!oldestKey) break;
      this.contextCarrierSnapshotCache.delete(oldestKey);
    }
    return snapshot;
  }

  invalidateContextCarrierSnapshotCache(detail = {}) {
    this.contextCarrierCacheGeneration = Number(this.contextCarrierCacheGeneration || 0) + 1;
    if (!(this.contextCarrierSnapshotCache instanceof Map) || this.contextCarrierSnapshotCache.size === 0) return;
    const providerId = text(detail?.providerId || detail?.pluginId || detail?.source);
    const rawKeys = Array.isArray(detail?.contextKeys)
      ? detail.contextKeys
      : [detail?.contextKey, detail?.displayLabel].filter(Boolean);
    const changedKeys = new Set(rawKeys.map((entry) => this.normalizeContextCarrierCacheKey(entry)).filter(Boolean));
    if (!providerId && changedKeys.size === 0) {
      this.contextCarrierSnapshotCache.clear();
      return;
    }
    for (const [cacheKey, entry] of this.contextCarrierSnapshotCache.entries()) {
      if (providerId && text(entry?.providerId) !== providerId) continue;
      if (changedKeys.size > 0) {
        const entryKeys = Array.isArray(entry?.contextKeys) ? entry.contextKeys : [];
        if (!entryKeys.some((key) => changedKeys.has(key))) continue;
      }
      this.contextCarrierSnapshotCache.delete(cacheKey);
    }
  }

  buildContextCarrierProjectionDescriptor(snapshot, provider = {}, contextKey = "", options = {}) {
    const providerId = text(provider.id || provider.providerId || provider.pluginId);
    const normalizedContextKey = this.normalizeContextCarrierCacheKey(contextKey || snapshot?.contextKey);
    const responseIsObject = !!snapshot && !Array.isArray(snapshot) && typeof snapshot === "object";
    const rawItems = Array.isArray(snapshot?.items) ? snapshot.items : (Array.isArray(snapshot) ? snapshot : []);
    const items = rawItems
      .map((item) => this.normalizeContextCarrierSnapshotItem(item, provider, contextKey))
      .filter(Boolean)
      .map((record) => ({
        nodeKey: text(record.nodeKey),
        label: text(record.label),
        pathLabel: text(record.pathLabel),
        notePath: text(record.notePath),
        viewType: text(record.viewType),
        viewLabel: text(record.viewLabel),
        sourcePlugin: text(record.sourcePlugin),
        sourceType: text(record.sourceType),
        workspaceCarrierSourceType: text(record.workspaceCarrierSourceType),
        depth: Number(record.depth || 0) || 0,
        order: Number(record.order || 0) || 0,
        orderPath: stableContextCarrierValue(record.orderPath || []),
        metaFields: stableContextCarrierValue(record.metaFields || []),
        contextCarrier: stableContextCarrierValue({
          providerId: text(record.contextCarrier?.providerId),
          contextKey: text(record.contextCarrier?.contextKey),
          carrierId: text(record.contextCarrier?.carrierId),
          carrierLabel: text(record.contextCarrier?.carrierLabel),
          sourceType: text(record.contextCarrier?.sourceType),
        }),
      }));
    const returnedCount = Number(snapshot?.returnedCount ?? snapshot?.count ?? rawItems.length);
    const totalCount = Number(snapshot?.totalCount ?? snapshot?.count ?? rawItems.length);
    const matchedCarrierCount = Number(snapshot?.matchedCarrierCount || 0) || 0;
    const hasMore = snapshot?.hasMore === true;
    const truncated = snapshot?.truncated === true;
    const ok = responseIsObject && snapshot?.ok !== false;
    const countsValid = Number.isFinite(returnedCount)
      && Number.isFinite(totalCount)
      && returnedCount >= 0
      && totalCount >= 0
      && returnedCount === rawItems.length
      && totalCount <= returnedCount;
    const targetPresent = options?.targetPresent !== false;
    const complete = ok && targetPresent && countsValid && !hasMore && !truncated;
    const canonical = JSON.stringify(stableContextCarrierValue({
      providerId,
      contextKey: normalizedContextKey,
      matchedCarrierCount,
      totalCount,
      returnedCount,
      hasMore,
      truncated,
      items,
    }));
    return {
      providerId,
      contextKey: normalizedContextKey,
      fingerprint: hashContextCarrierProjection(canonical),
      itemCount: items.length,
      matchedCarrierCount,
      totalCount,
      returnedCount,
      hasMore,
      truncated,
      cursor: text(snapshot?.cursor || snapshot?.nextCursor),
      revision: text(snapshot?.revision || snapshot?.version),
      ok,
      complete,
      targetPresent,
      reason: text(snapshot?.reason || snapshot?.status),
    };
  }

  getContextCarrierTargetSnapshot(targetsByKey, contextKey) {
    if (!targetsByKey || typeof targetsByKey !== "object") return null;
    const normalized = this.normalizeContextCarrierCacheKey(contextKey);
    return targetsByKey[contextKey]
      || targetsByKey[normalized]
      || Object.entries(targetsByKey).find(([key]) => this.normalizeContextCarrierCacheKey(key) === normalized)?.[1]
      || null;
  }

  markContextCarrierProviderDirty(detail = {}) {
    const providerId = text(detail?.providerId || detail?.pluginId || detail?.source);
    const providers = CONTEXT_CARRIER_PROVIDER_IDS.has(providerId)
      ? [providerId]
      : Array.from(CONTEXT_CARRIER_PROVIDER_IDS);
    const rawKeys = [
      ...(Array.isArray(detail?.contextKeys) ? detail.contextKeys : []),
      ...(Array.isArray(detail?.oldContextKeys) ? detail.oldContextKeys : []),
      ...(Array.isArray(detail?.newContextKeys) ? detail.newContextKeys : []),
      detail?.contextKey,
      detail?.displayLabel,
    ].filter(Boolean);
    const keys = new Set(rawKeys.map((entry) => this.normalizeContextCarrierCacheKey(entry)).filter(Boolean));
    const generation = Number(this.contextCarrierEventGeneration || 0) + 1;
    this.contextCarrierEventGeneration = generation;
    providers.forEach((id) => {
      const previous = this.contextCarrierDirtyProviders.get(id);
      const mergedKeys = new Set(previous?.keys || []);
      keys.forEach((key) => mergedKeys.add(key));
      this.contextCarrierDirtyProviders.set(id, {
        providerId: id,
        generation,
        wildcard: previous?.wildcard === true || keys.size === 0,
        keys: mergedKeys,
        reason: text(detail?.reason, "context-capsule-carrier:changed"),
        revision: text(detail?.revision),
      });
    });
  }

  isContextCarrierViewVisible(view) {
    if (!(view instanceof ProjectExecutionOverviewView) || view.contextCarrierClosed) return false;
    const boardWrap = view.contentEl?.querySelector?.(".peo-board-wrap");
    if (!boardWrap?.isConnected) return false;
    const rect = boardWrap.getBoundingClientRect?.();
    return !!rect && rect.width > 0 && rect.height > 0;
  }

  getVisibleContextCarrierKeysForView(view) {
    if (!this.isContextCarrierViewVisible(view)) return [];
    const index = view.model?.contextCarrierAutoRefreshIndex;
    const groupsByContextKey = index?.groupOccurrencesByContextKey;
    if (!groupsByContextKey || typeof groupsByContextKey !== "object") return [];
    const boardWrap = view.contentEl.querySelector(".peo-board-wrap");
    const wrapRect = boardWrap.getBoundingClientRect();
    const visibleGroupIds = new Set();
    boardWrap.querySelectorAll(".peo-project-group[data-group-id]").forEach((groupEl) => {
      const rect = groupEl.getBoundingClientRect();
      if (rect.bottom > wrapRect.top && rect.top < wrapRect.bottom && rect.right > wrapRect.left && rect.left < wrapRect.right) {
        visibleGroupIds.add(text(groupEl.dataset.groupId));
      }
    });
    return Object.entries(groupsByContextKey)
      .filter(([, occurrences]) => (Array.isArray(occurrences) ? occurrences : [])
        .some((entry) => visibleGroupIds.has(text(entry?.groupId))))
      .map(([contextKey]) => contextKey)
      .sort();
  }

  getContextCarrierEventProgress(view, providerId, generation) {
    const current = view.contextCarrierEventProgress.get(providerId);
    if (current?.generation === generation) return current;
    const next = { generation, checkedKeys: new Set(), handledAll: false };
    view.contextCarrierEventProgress.set(providerId, next);
    return next;
  }

  markContextCarrierViewCurrent(view) {
    if (!(view instanceof ProjectExecutionOverviewView)) return;
    this.contextCarrierDirtyProviders.forEach((entry, providerId) => {
      view.contextCarrierEventProgress.set(providerId, {
        generation: entry.generation,
        checkedKeys: new Set(),
        handledAll: true,
      });
    });
    view.contextCarrierLastVisibilitySignature = this.getVisibleContextCarrierKeysForView(view).join("\u0001");
    this.pruneHandledContextCarrierDirtyProviders();
  }

  pruneHandledContextCarrierDirtyProviders() {
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .filter((view) => view instanceof ProjectExecutionOverviewView && !view.contextCarrierClosed && !!view.model);
    this.contextCarrierDirtyProviders.forEach((entry, providerId) => {
      const handledByAll = views.length > 0 && views.every((view) => {
        const progress = view.contextCarrierEventProgress.get(providerId);
        return progress?.generation === entry.generation && progress.handledAll === true;
      });
      if (handledByAll) this.contextCarrierDirtyProviders.delete(providerId);
    });
  }

  scheduleContextCarrierAutoRefresh(reason = "provider-change", options = {}) {
    if (this.contextCarrierUnloading || this.contextCarrierDirtyProviders.size === 0) return;
    const hasProbeEligibleVisibleView = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .some((view) => this.isContextCarrierViewVisible(view)
        && !!view.model?.contextCarrierAutoRefreshIndex
        && Object.keys(view.model.contextCarrierAutoRefreshIndex.groupOccurrencesByContextKey || {}).length > 0);
    if (!hasProbeEligibleVisibleView) {
      this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
        .map((leaf) => leaf.view)
        .filter((view) => view instanceof ProjectExecutionOverviewView)
        .forEach((view) => { view.contextCarrierLastVisibilitySignature = ""; });
      return;
    }
    if (this.contextCarrierAutoRefreshTimer) return;
    const delay = options?.immediate === true ? 0 : CONTEXT_CARRIER_AUTO_REFRESH_DELAY_MS;
    this.contextCarrierAutoRefreshTimer = window.setTimeout?.(() => {
      this.contextCarrierAutoRefreshTimer = null;
      this.flushContextCarrierAutoRefresh(reason).catch((error) => {
        console.warn("[ProjectOverview][context-carrier.auto-refresh-failed]", error);
      });
    }, delay);
  }

  maybeProbeContextCarrierOnVisibilityChange(view) {
    if (this.contextCarrierDirtyProviders.size === 0 || !(view instanceof ProjectExecutionOverviewView)) return;
    if (!this.isContextCarrierViewVisible(view)) {
      view.contextCarrierLastVisibilitySignature = "";
      return;
    }
    const signature = this.getVisibleContextCarrierKeysForView(view).join("\u0001");
    if (!signature || signature === view.contextCarrierLastVisibilitySignature) return;
    view.contextCarrierLastVisibilitySignature = signature;
    this.scheduleContextCarrierAutoRefresh("visibility-change");
  }

  async flushContextCarrierAutoRefresh(reason = "provider-change") {
    if (this.contextCarrierUnloading || this.contextCarrierDirtyProviders.size === 0) return;
    if (this.contextCarrierProbeRunning) {
      this.contextCarrierProbeQueued = true;
      return;
    }
    this.contextCarrierProbeRunning = true;
    this.contextCarrierProbeQueued = false;
    const startedGeneration = Number(this.contextCarrierEventGeneration || 0);
    try {
      const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
        .map((leaf) => leaf.view)
        .filter((view) => this.isContextCarrierViewVisible(view));
      for (const view of views) await this.probeContextCarrierView(view, reason);
    } finally {
      this.contextCarrierProbeRunning = false;
      if (this.contextCarrierProbeQueued || startedGeneration !== Number(this.contextCarrierEventGeneration || 0)) {
        this.scheduleContextCarrierAutoRefresh("queued-provider-change");
      }
    }
  }

  async probeContextCarrierView(view, reason = "provider-change") {
    if (!this.isContextCarrierViewVisible(view)) return false;
    const visibilityRetry = reason === "visibility-change";
    if (!visibilityRetry
      && Number(view.contextCarrierDeferredProbeGeneration || 0) === Number(this.contextCarrierEventGeneration || 0)) return false;
    const visibleKeys = this.getVisibleContextCarrierKeysForView(view);
    if (visibleKeys.length === 0) return false;
    const autoRefreshIndex = view.model?.contextCarrierAutoRefreshIndex || {};
    const projectionIndex = autoRefreshIndex.projectionsByProviderContextKey || {};
    const displayLabelsByContextKey = autoRefreshIndex.displayLabelsByContextKey || {};
    const providersById = new Map(this.getContextCarrierProviders().map((provider) => [provider.id, provider]));
    let refreshRequest = null;
    let blockedByProviderFailure = false;
    for (const [providerId, dirty] of this.contextCarrierDirtyProviders.entries()) {
      const progress = this.getContextCarrierEventProgress(view, providerId, dirty.generation);
      if (progress.handledAll) continue;
      const keys = visibleKeys.filter((key) => (dirty.wildcard || dirty.keys.has(key)) && !progress.checkedKeys.has(key));
      if (keys.length === 0) continue;
      const provider = providersById.get(providerId);
      if (typeof provider?.api?.getContextCapsuleCarrierSnapshot !== "function") continue;
      const requestedContextKeys = keys.map((key) => text(displayLabelsByContextKey[key], key));
      let snapshot;
      try {
        snapshot = await this.getContextCarrierSnapshotCached(provider, {
          contextKeys: requestedContextKeys,
          limit: CONTEXT_CARRIER_LIMITS.perTargetPerProvider,
          source: "project-execution-overview-auto-probe",
          summaryOnly: false,
        });
      } catch (error) {
        console.warn("[ProjectOverview][context-carrier.probe-provider-failed]", { providerId, reason: text(error?.message || error) });
        blockedByProviderFailure = true;
        continue;
      }
      if (!this.isContextCarrierViewVisible(view)) return false;
      const targetsByKey = snapshot?.targets && typeof snapshot.targets === "object" ? snapshot.targets : null;
      const fallbackSnapshots = new Map();
      if (!targetsByKey && keys.length > 1) {
        for (const contextKey of keys) {
          const displayLabel = text(displayLabelsByContextKey[contextKey], contextKey);
          try {
            const targetSnapshot = await this.getContextCarrierSnapshotCached(provider, {
              contextKey: displayLabel,
              displayLabel,
              limit: CONTEXT_CARRIER_LIMITS.perTargetPerProvider,
              source: "project-execution-overview-auto-probe",
            });
            fallbackSnapshots.set(contextKey, targetSnapshot);
          } catch (error) {
            console.warn("[ProjectOverview][context-carrier.probe-target-failed]", {
              providerId,
              contextKey: previewContextCarrierText(contextKey, 60),
              reason: text(error?.message || error),
            });
          }
        }
      }
      let needsRefresh = false;
      for (const contextKey of keys) {
        const displayLabel = text(displayLabelsByContextKey[contextKey], contextKey);
        let targetSnapshot = this.getContextCarrierTargetSnapshot(targetsByKey, displayLabel) || fallbackSnapshots.get(contextKey);
        let targetPresent = !!targetSnapshot;
        if (!targetSnapshot && keys.length === 1 && !targetsByKey) {
          targetSnapshot = snapshot;
          targetPresent = !!snapshot;
        }
        const next = this.buildContextCarrierProjectionDescriptor(targetSnapshot, provider, displayLabel, { targetPresent });
        const previous = projectionIndex[`${providerId}::${contextKey}`];
        if (next.ok === false) {
          blockedByProviderFailure = true;
          continue;
        }
        if (!previous?.complete || !next.complete || previous.fingerprint !== next.fingerprint) {
          needsRefresh = true;
          break;
        }
        progress.checkedKeys.add(contextKey);
      }
      if (!dirty.wildcard && Array.from(dirty.keys).every((key) => progress.checkedKeys.has(key))) {
        progress.handledAll = true;
        this.pruneHandledContextCarrierDirtyProviders();
      }
      logPeoPerf("context-carrier-probe", {
        reason,
        providerId,
        keyCount: keys.length,
        needsRefresh,
        providerTimingMs: Number(snapshot?.timingMs || 0),
      });
      if (needsRefresh) {
        refreshRequest = refreshRequest || { providerId, contextKeys: keys, reason };
      }
    }
    if (refreshRequest && !blockedByProviderFailure) {
      await this.requestContextCarrierViewRefresh(view, refreshRequest);
      return true;
    }
    return false;
  }

  getContextCarrierValidationScopesForView(view) {
    const visibleKeys = this.getVisibleContextCarrierKeysForView(view);
    const scopes = [];
    this.contextCarrierDirtyProviders.forEach((dirty, providerId) => {
      const progress = this.getContextCarrierEventProgress(view, providerId, dirty.generation);
      if (progress.handledAll) return;
      const contextKeys = visibleKeys.filter((key) => dirty.wildcard || dirty.keys.has(key));
      if (contextKeys.length > 0) scopes.push({ providerId, contextKeys });
    });
    return scopes;
  }

  isContextCarrierAutoRefreshModelUsable(model, scopes = []) {
    const projections = model?.contextCarrierAutoRefreshIndex?.projectionsByProviderContextKey || {};
    return scopes.every((scope) => scope.contextKeys.every((contextKey) => {
      const projection = projections[`${scope.providerId}::${contextKey}`];
      return projection?.ok !== false && projection?.targetPresent === true;
    }));
  }

  async requestContextCarrierViewRefresh(view, request = {}) {
    if (!(view instanceof ProjectExecutionOverviewView) || !this.isContextCarrierViewVisible(view)) return false;
    view.contextCarrierRefreshQueued = true;
    if (view.contextCarrierRefreshRunning) return false;
    view.contextCarrierRefreshRunning = true;
    let committedAny = false;
    try {
      while (view.contextCarrierRefreshQueued && this.isContextCarrierViewVisible(view) && !this.contextCarrierUnloading) {
        view.contextCarrierRefreshQueued = false;
        const eventGeneration = Number(this.contextCarrierEventGeneration || 0);
        const requestGeneration = Number(view.contextCarrierRequestGeneration || 0) + 1;
        const validationScopes = this.getContextCarrierValidationScopesForView(view);
        view.contextCarrierRequestGeneration = requestGeneration;
        const committed = await view.refresh({
          preserveScroll: true,
          reason: `context-carrier-auto:${text(request.providerId, "provider")}`,
          commitGuard: (nextModel) => !this.contextCarrierUnloading
            && !view.contextCarrierClosed
            && this.isContextCarrierViewVisible(view)
            && requestGeneration === Number(view.contextCarrierRequestGeneration || 0)
            && eventGeneration === Number(this.contextCarrierEventGeneration || 0)
            && this.isContextCarrierAutoRefreshModelUsable(nextModel, validationScopes),
        });
        committedAny = committedAny || committed === true;
        if (committed === true) view.contextCarrierDeferredProbeGeneration = 0;
        else if (eventGeneration === Number(this.contextCarrierEventGeneration || 0)) {
          view.contextCarrierDeferredProbeGeneration = eventGeneration;
        }
        if (eventGeneration !== Number(this.contextCarrierEventGeneration || 0)) {
          view.contextCarrierRefreshQueued = false;
          this.scheduleContextCarrierAutoRefresh("stale-build-provider-change", { immediate: true });
          break;
        }
      }
    } catch (error) {
      console.warn("[ProjectOverview][context-carrier.refresh-failed]", error);
    } finally {
      view.contextCarrierRefreshRunning = false;
    }
    return committedAny;
  }

  getTrackingProjectionModule() {
    if (!this.trackingProjectionModule) {
      const base = this.app.vault.adapter.basePath;
      if (!base) throw new Error("desktop-adapter-required");
      const file = require("path").join(base, this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`, "tracking-projection.cjs");
      const mod = { exports: {} };
      new Function("require", "module", "exports", require("fs").readFileSync(file, "utf8"))(require, mod, mod.exports);
      this.trackingProjectionModule = mod.exports;
    }
    return this.trackingProjectionModule;
  }

  isContextKeywordStoppedV1(keyword) {
    this.ensureContextTrackingVisibility();
    const cache = this.contextTrackingVisibility;
    const api = window.__mandalaTimeBlocksPluginApi;
    try {
      const scope = api?.getContextTrackingScopeV1?.();
      if (api?.operationalLifecyclePolicyV1 !== "tracking-only-v2" || !cache?.ok || cache.api !== api || !scope?.ok || scope.sourceScope !== cache.sourceScope || scope.providerGeneration !== cache.providerGeneration || cache.generation !== this.globalKeywordNavGeneration || Date.now() - cache.at > 30000) return false;
      const label = String(keyword || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
      return cache.stoppedLabels.has(label);
    } catch (_) { return false; }
  }
  ensureContextTrackingVisibility() {
    const cache = this.contextTrackingVisibility;
    if (this.contextCarrierUnloading || this.contextTrackingVisibilityFlight || Date.now() - (this.contextTrackingVisibilityAttempt || 0) < 1500) return;
    const currentApi = window.__mandalaTimeBlocksPluginApi;
    let scope; try { scope = currentApi?.getContextTrackingScopeV1?.(); } catch (_) {}
    if (cache?.ok && cache.api === currentApi && scope?.ok && scope.sourceScope === cache.sourceScope && scope.providerGeneration === cache.providerGeneration && cache.generation === this.globalKeywordNavGeneration && Date.now() - cache.at < 15000) return;
    this.contextTrackingVisibilityAttempt = Date.now();
    const api = window.__mandalaTimeBlocksPluginApi;
    const epoch = this.contextTrackingVisibilityEpoch || 0;
    const live = () => !this.contextCarrierUnloading && api === window.__mandalaTimeBlocksPluginApi && epoch === (this.contextTrackingVisibilityEpoch || 0);
    this.contextTrackingVisibilityFlight = (async () => {
      if (api?.operationalLifecyclePolicyV1 !== "tracking-only-v2") throw new Error("tracking-policy-mismatch");
      const items = await this.buildGlobalGroupKeywordNavItems();
      const generation = this.globalKeywordNavGeneration;
      const groups = items.flatMap(item => (item.sources?.length ? item.sources : [item]).map(source => ({ mode: source.mode, primaryNodeKey: source.primaryNodeKey })));
      const evidence = await this.getTrackingProjectionModule().collectTracking({ groups }, api, () => live() && generation === this.globalKeywordNavGeneration);
      if (!live() || generation !== this.globalKeywordNavGeneration) return;
      const byLabel = new Map();
      for (const item of items) {
        const descriptor = normalizeContextCapsuleKeyFromKeywordItem(item);
        if (!descriptor) continue;
        const label = descriptor.displayLabel.trim().replace(/\s+/g, " ").toLocaleLowerCase();
        if (!byLabel.has(label)) byLabel.set(label, { ids: new Set(), roots: new Set(), complete: true });
        const entry = byLabel.get(label); entry.ids.add(descriptor.contextKeyId);
        for (const source of item.sources?.length ? item.sources : [item]) {
          if (!["workspace", "mandala"].includes(source.mode) || !source.primaryNodeKey) entry.complete = false;
          else entry.roots.add(source.primaryNodeKey);
        }
      }
      const stoppedLabels = new Set();
      if (evidence.ok) for (const [label, row] of byLabel) if (row.complete && row.ids.size === 1 && row.roots.size && [...row.roots].every(key => evidence.states.get(key) === "stopped")) stoppedLabels.add(label);
      const signature = JSON.stringify([evidence.ok, [...stoppedLabels].sort()]);
      const previous = this.contextTrackingVisibilitySignature;
      this.contextTrackingVisibilitySignature = signature;
      this.contextTrackingVisibility = { ...evidence, stoppedLabels, api, generation, at: Date.now(), signature };
      if (signature !== previous) window.dispatchEvent(new CustomEvent("context-key-tracking-visibility:changed", { detail: { provider: this.projectExecutionOverviewPublicApi } }));
    })().catch(() => {
      if (!live()) return;
      this.contextTrackingVisibility = null;
      const previous = this.contextTrackingVisibilitySignature;
      this.contextTrackingVisibilitySignature = "unknown";
      if (previous && previous !== "unknown") window.dispatchEvent(new CustomEvent("context-key-tracking-visibility:changed", { detail: { provider: this.projectExecutionOverviewPublicApi } }));
    }).finally(() => {
      this.contextTrackingVisibilityFlight = null;
      if (!this.contextCarrierUnloading && !live()) { this.contextTrackingVisibilityAttempt = 0; this.ensureContextTrackingVisibility(); }
    });
  }

  registerStateCapsulesApi() {
    if (!this.trackingSnapshotHost) {
      this.trackingSnapshotHost = __PeoObserverHost.createHost(this, {
        createPublisher: __PeoObserverPublisher.createPublisher,
        loadEvidence: __PeoObserverEvidence.loadEvidence,
        normalize: normalizeContextCapsuleKeyFromKeywordItem,
        buildAliases: buildContextCapsuleKeysFromKeywordItems,
        events: window,
        emit: snapshot => window.dispatchEvent(new CustomEvent("project-execution-overview:tracking-snapshot-changed-v1", {detail: snapshot})),
        unavailable: __PeoObserverPublisher.UNAVAILABLE,
      });
      this.register(() => this.trackingSnapshotHost?.close());
    }
    const trackingSnapshotApi = this.trackingSnapshotHost.api();
    this.projectExecutionOverviewPublicApi = {
      getContextTrackingVisibilitySnapshotV1: trackingSnapshotApi.read,
      requestContextTrackingVisibilityRefreshV1: trackingSnapshotApi.refresh,
      operationalLifecyclePolicyV1: "tracking-only-v2",
      isContextKeywordStoppedV1: keyword => this.isContextKeywordStoppedV1(keyword),
      previewManagedContextCreationV1: input => this.getCreationProductionCoordinator().preview(input),
      confirmManagedContextCreationV1: token => this.getCreationProductionCoordinator().confirm(token),
      resumeManagedContextCreationV1: txId => this.getCreationProductionCoordinator().resume(txId),
      listManagedContextCreationsV1: () => this.getCreationProductionCoordinator().list(),
      readManagedContextCreationFactsV1: () => this.getCreationProductionCoordinator().facts(),
      openManagedContextCreationV1: options => {new ManagedContextCreationModal(this.getCreationProductionCoordinator(),options).open();return true},
      previewGoalContextRenameV1: input => this.getGoalProductionCoordinator().preview(input),
      confirmGoalContextRenameV1: token => this.getGoalProductionCoordinator().confirm(token),
      resumeGoalContextRenameV1: txId => this.getGoalProductionCoordinator().resume(txId),
      listGoalContextRenamesV1: ref => this.getGoalProductionCoordinator().list(ref),
      openGoalContextRenameV1: ref => {new GoalProductionRenameModal(this.getGoalProductionCoordinator(),ref).open();return true},
      prepareGoalContextRenameV1: input => (this.goalContextRenamePreparation || (this.goalContextRenamePreparation = new GoalContextRenamePreparation(this))).prepare(input),
      openProjectContextRenameV1: (ref, options = {}) => this.getContextKeyRenameManager().open(ref, options),
      getProjectContextRenameSnapshotV1: ref => this.getContextKeyRenameManager().snapshot(ref),
      getCapsuleState: () => this.getCapsuleState(),
      applyCapsuleState: async (state, options = {}) => await this.applyCapsuleState(state, options),
      getCurrentGroupCapsuleLevels: () => this.getCurrentGroupCapsuleLevels(),
      getMandalaPrimaryOrderSnapshot: () => this.getMandalaPrimaryOrderSnapshot(),
      getWorkspacePrimaryOrderSnapshot: () => this.getWorkspacePrimaryOrderSnapshot(),
      getWorkspacePrimaryOrderSnapshotAsync: () => this.getWorkspacePrimaryOrderSnapshotAsync(),
      setCapsuleContext: (capsuleInfo = {}) => this.setCapsuleContext(capsuleInfo),
      revealItemNode: async (nodeKey, options = {}) => await this.revealItemNode(nodeKey, options),
      revealItemNodeConfirmed: async (nodeKey, options = {}) => await this.revealItemNodeConfirmed(nodeKey, options),
      buildGroupAiContextMarkdown: async (groupOrId, options = {}) => await this.buildGroupAiContextMarkdown(groupOrId, options),
      copyGroupAiContext: async (groupOrId, options = {}) => await this.copyGroupAiContext(groupOrId, options),
      getContextCapsuleKeys: async () => await this.getContextCapsuleKeys(),
      getContextCapsuleKeysSync: () => this.getContextCapsuleKeysSync(),
      getWorkspaceOperationalContextKeySnapshot: async (options = {}) => await this.getWorkspaceOperationalContextKeySnapshot(options),
      getMandalaOperationalContextKeySnapshot: async (options = {}) => await this.getMandalaOperationalContextKeySnapshot(options),
      getPrimaryKeyLifecycleSnapshot: (options = {}) => this.getPrimaryKeyLifecycleSnapshot(options),
      getPrimaryCollectionCardSnapshot: async (options = {}) => await this.getPrimaryCollectionCardSnapshot(options),
      syncWorkspaceProjectEntryMeta: async (nodeKey, meta = {}, options = {}) => await this.syncWorkspaceProjectEntryMeta(nodeKey, meta, options),
      syncMandalaContextGoalMeta: async (nodeKey, meta = {}, options = {}) => await this.syncMandalaContextGoalMeta(nodeKey, meta, options),
    };
    window.__projectExecutionOverviewPluginApi = this.projectExecutionOverviewPublicApi;
  }

  getContextCapsuleKeysSync() {
    this.ensureContextTrackingVisibility();
    const cache = this.globalKeywordNavCache;
    return buildContextCapsuleKeysFromKeywordItems(cache?.buildComplete === true
      && this.isGlobalKeywordNavCurrent(cache.generation, cache.scope) ? cache.items : []);
  }

  async getContextCapsuleKeys() {
    this.ensureContextTrackingVisibility();
    const scope = this.prepareGlobalKeywordNavScope();
    const generation = Number(this.globalKeywordNavGeneration || 0);
    const items = await this.buildGlobalGroupKeywordNavItems();
    if (!this.isGlobalKeywordNavCurrent(generation, scope)) throw new Error("global-keyword-nav-stale");
    return buildContextCapsuleKeysFromKeywordItems(items);
  }

  async getWorkspaceOperationalContextKeySnapshot(options = {}) {
    const requestedPurpose = options && typeof options === "object" && !Array.isArray(options) ? options.readPurpose : null;
    const readPurpose = requestedPurpose === undefined ? "display" : requestedPurpose;
    const providerGeneration = text(this.operationalContextSnapshotProviderGeneration);
    const trackingApi = window.__mandalaTimeBlocksPluginApi;
    const ownApi = this.projectExecutionOverviewPublicApi;
    const policyCurrent = () => !this.contextCarrierUnloading && this.projectExecutionOverviewPublicApi === ownApi && text(this.operationalContextSnapshotProviderGeneration) === providerGeneration && ownApi === window.__projectExecutionOverviewPluginApi && trackingApi === window.__mandalaTimeBlocksPluginApi && trackingApi?.operationalLifecyclePolicyV1 === "tracking-only-v2" && options?.operationalLifecyclePolicyV1 === "tracking-only-v2";
    const invalidSavedRequest = readPurpose === "operation-check" && (options.primaryNodeKeys !== undefined && !Array.isArray(options.primaryNodeKeys)
        || Array.isArray(options.primaryNodeKeys) && (options.primaryNodeKeys.length > OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES
          || options.primaryNodeKeys.some(key => typeof key !== "string" || !key.trim() || key.length > 8192))
        || options.sourceNotePath !== undefined && typeof options.sourceNotePath !== "string");
    const requestedRaw = !invalidSavedRequest && Array.isArray(options?.primaryNodeKeys) ? options?.primaryNodeKeys.map((value) => text(value)).filter(Boolean) : [];
    const sourceNotePath = text(options?.sourceNotePath);
    const fail = (reason, diagnostics = []) => ({
      ok: false,
      complete: false,
      contractVersion: OPERATIONAL_CONTEXT_SNAPSHOT_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
      operationalLifecyclePolicyV1: "tracking-only-v2",
      snapshotType: "project-overview-workspace-operational-context-keys-v1",
      providerGeneration,
      instanceId: providerGeneration,
      sourceNotePath,
      generatedAt: new Date().toISOString(),
      revision: "",
      count: 0,
      totalCount: requestedRaw.length,
      returnedCount: 0,
      limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
      hasMore: false,
      truncated: false,
      items: [],
      diagnostics: [{ code: reason }].concat(Array.isArray(diagnostics) ? diagnostics : []),
      reason,
    });
    if (readPurpose !== "display" && readPurpose !== "operation-check") return fail("read-purpose-invalid");
    if (invalidSavedRequest) return fail("invalid-saved-owner-request");
    if (!policyCurrent()) return fail("tracking-policy-incompatible-reload-mandala");
    if (requestedRaw.length > OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES) {
      const result = fail("operational-context-request-limit-exceeded", [{
        code: "operational-context-request-limit-exceeded",
        totalCount: requestedRaw.length,
        limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
      }]);
      result.hasMore = true;
      result.truncated = true;
      return result;
    }
    if (new Set(requestedRaw).size !== requestedRaw.length) return fail("operational-context-duplicate-owner-request");
    const parsedRequests = requestedRaw.map((primaryNodeKey) => ({ primaryNodeKey, parsed: parseJumpNodeKey(primaryNodeKey) }));
    const invalid = parsedRequests.filter(({ parsed }) => parsed?.viewType !== "workspace-mount-view" || !text(parsed?.itemId));
    if (invalid.length) return fail("operational-context-owner-invalid", invalid.slice(0, 20).map(({ primaryNodeKey }) => ({ code: "owner-invalid", primaryNodeKey })));
    if (sourceNotePath && parsedRequests.some(({ parsed }) => text(parsed?.notePath) !== sourceNotePath)) {
      return fail("operational-context-source-scope-mismatch");
    }
    let savedDeclarations = null;
    if (readPurpose === "operation-check" && requestedRaw.length) {
      try { savedDeclarations = await __PeoSavedDeclarationsV1(this, "workspace", requestedRaw); }
      catch (_) { return fail("peo-saved-declaration-unavailable"); }
      if (!policyCurrent() || !savedDeclarations.current()) return fail("peo-saved-declaration-changed");
    }
    const readComment = key => savedDeclarations ? savedDeclarations.observations.get(key).comment : this.getComment(key);
    const readKilled = key => savedDeclarations ? savedDeclarations.observations.get(key).killed : this.isPrimaryKeyKilled("workspace", key);
    const items = parsedRequests.map(({ primaryNodeKey, parsed }) => {
      const declarationById = new Map();
      extractGroupKeywordDeclarationsFromComment(readComment(primaryNodeKey), primaryNodeKey).forEach(({ keyword, declarationId }) => {
        const descriptor = normalizeContextCapsuleKeyFromKeywordItem({
          keyword,
          declarationId,
          mode: "workspace",
          groupId: primaryNodeKey,
          groupTitle: "",
          primaryNodeKey,
        });
        if (!descriptor?.contextKeyId) return;
        const key = `${text(descriptor.declarationEvidenceId, descriptor.contextKeyId).toLocaleLowerCase()}\u0000${text(descriptor.address).toLocaleLowerCase()}`;
        if (!declarationById.has(key)) declarationById.set(key, Object.assign({}, descriptor, {
          archivedByAddress: isArchivedProjectKeywordLabel(descriptor.displayLabel),
        }));
      });
      const declarations = Array.from(declarationById.values()).sort((left, right) => compareProjectKeywordLabels(left.displayLabel, right.displayLabel));
      const currentDeclarations = declarations.filter((entry) => entry.archivedByAddress !== true);
      const killed = readKilled(primaryNodeKey);
      const exclusionReasons = [];
      if (!declarations.length) exclusionReasons.push("comment-declaration-missing");
      else if (!currentDeclarations.length) exclusionReasons.push("all-declarations-archived-9xx");
      else if (currentDeclarations.length > 1) exclusionReasons.push("multiple-current-declarations");
      const eligibleDeclaration = currentDeclarations.length === 1 ? currentDeclarations[0] : null;
      return {
        primaryNodeKey,
        itemId: text(parsed?.itemId),
        sourceNotePath: text(parsed?.notePath),
        declarations,
        currentDeclaration: eligibleDeclaration,
        archivedDeclarationCount: declarations.length - currentDeclarations.length,
        killed,
        legacyKillOnly: true,
        eligible: !!eligibleDeclaration,
        exclusionReasons,
      };
    });
    const revisionPayload = items.map((item) => ({
      primaryNodeKey: item.primaryNodeKey,
      declarations: item.declarations.map((entry) => [entry.contextKeyId, entry.address, entry.displayLabel, entry.archivedByAddress === true]),
      killed: item.killed,
      exclusionReasons: item.exclusionReasons,
    }));
    let revision = createHash("sha256").update(JSON.stringify({ policy: "tracking-only-v2", items: revisionPayload }), "utf8").digest("hex");
    if (readPurpose === "operation-check") revision = __OwnerSavedObservationV1.hash(JSON.stringify(["workspace", requestedRaw, sourceNotePath, savedDeclarations?.ownerPath || null, revision]));
    if (!policyCurrent()) return fail("tracking-policy-provider-changed");
    if (savedDeclarations && !savedDeclarations.current()) return fail("peo-saved-declaration-changed");
    const output = {
      ok: true,
      complete: true,
      contractVersion: OPERATIONAL_CONTEXT_SNAPSHOT_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
      operationalLifecyclePolicyV1: "tracking-only-v2",
      snapshotType: "project-overview-workspace-operational-context-keys-v1",
      providerGeneration,
      instanceId: providerGeneration,
      sourceNotePath: sourceNotePath || text(parsedRequests[0]?.parsed?.notePath),
      generatedAt: new Date().toISOString(),
      revision,
      lifecycleRevision: readPurpose === "operation-check" ? savedDeclarations?.lifecycleRevision || 0 : Number(this.settings?.primaryKeyLifecycleRevision || 0),
      inputObservation: savedDeclarations ? savedDeclarations.evidence(revision) : null,
      count: items.length,
      totalCount: requestedRaw.length,
      returnedCount: items.length,
      limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
      hasMore: false,
      truncated: false,
      items,
      diagnostics: items.filter((item) => item.exclusionReasons.length).map((item) => ({
        code: "owner-ineligible",
        primaryNodeKey: item.primaryNodeKey,
        reasons: item.exclusionReasons,
      })),
    };
    return readPurpose === "operation-check" ? __OwnerSavedObservationV1.freeze(output) : output;
  }

  async getMandalaOperationalContextKeySnapshot(options = {}) {
    const requestedPurpose = options && typeof options === "object" && !Array.isArray(options) ? options.readPurpose : null;
    const readPurpose = requestedPurpose === undefined ? "display" : requestedPurpose;
    const providerGeneration = text(this.operationalContextSnapshotProviderGeneration);
    const trackingApi = window.__mandalaTimeBlocksPluginApi;
    const ownApi = this.projectExecutionOverviewPublicApi;
    const policyCurrent = () => !this.contextCarrierUnloading && this.projectExecutionOverviewPublicApi === ownApi && text(this.operationalContextSnapshotProviderGeneration) === providerGeneration && ownApi === window.__projectExecutionOverviewPluginApi && trackingApi === window.__mandalaTimeBlocksPluginApi && trackingApi?.operationalLifecyclePolicyV1 === "tracking-only-v2" && options?.operationalLifecyclePolicyV1 === "tracking-only-v2";
    const invalidSavedRequest = readPurpose === "operation-check" && (options.primaryNodeKeys !== undefined && !Array.isArray(options.primaryNodeKeys)
        || Array.isArray(options.primaryNodeKeys) && (options.primaryNodeKeys.length > OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES
          || options.primaryNodeKeys.some(key => typeof key !== "string" || !key.trim() || key.length > 8192))
        || options.sourceNotePath !== undefined && typeof options.sourceNotePath !== "string");
    const requestedRaw = !invalidSavedRequest && Array.isArray(options?.primaryNodeKeys) ? options?.primaryNodeKeys.map((value) => text(value)).filter(Boolean) : [];
    const sourceNotePath = text(options?.sourceNotePath);
    const fail = (reason, diagnostics = []) => ({
      ok: false,
      complete: false,
      contractVersion: OPERATIONAL_CONTEXT_SNAPSHOT_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
      operationalLifecyclePolicyV1: "tracking-only-v2",
      snapshotType: "project-overview-mandala-operational-context-keys-v1",
      providerGeneration,
      instanceId: providerGeneration,
      sourceNotePath,
      generatedAt: new Date().toISOString(),
      revision: "",
      count: 0,
      totalCount: requestedRaw.length,
      returnedCount: 0,
      limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
      hasMore: false,
      truncated: false,
      items: [],
      diagnostics: [{ code: reason }].concat(Array.isArray(diagnostics) ? diagnostics : []),
      reason,
    });
    if (readPurpose !== "display" && readPurpose !== "operation-check") return fail("read-purpose-invalid");
    if (invalidSavedRequest) return fail("invalid-saved-owner-request");
    if (!policyCurrent()) return fail("tracking-policy-incompatible-reload-mandala");
    if (requestedRaw.length > OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES) {
      const result = fail("operational-context-request-limit-exceeded", [{
        code: "operational-context-request-limit-exceeded",
        totalCount: requestedRaw.length,
        limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
      }]);
      result.hasMore = true;
      result.truncated = true;
      return result;
    }
    if (new Set(requestedRaw).size !== requestedRaw.length) return fail("operational-context-duplicate-owner-request");
    const parsedRequests = requestedRaw.map((primaryNodeKey) => ({ primaryNodeKey, parsed: parseJumpNodeKey(primaryNodeKey) }));
    const invalid = parsedRequests.filter(({ parsed }) => parsed?.viewType !== "mandala-time-blocks" || parsed?.scopeType !== "node" || parsed?.scopeId !== "mandala" || !text(parsed?.itemId));
    if (invalid.length) return fail("operational-context-owner-invalid", invalid.slice(0, 20).map(({ primaryNodeKey }) => ({ code: "owner-invalid", primaryNodeKey })));
    if (sourceNotePath && parsedRequests.some(({ parsed }) => text(parsed?.notePath) !== sourceNotePath)) {
      return fail("operational-context-source-scope-mismatch");
    }
    if (requestedRaw.length === 0) {
      return {
        ok: true,
        complete: true,
        contractVersion: OPERATIONAL_CONTEXT_SNAPSHOT_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
        operationalLifecyclePolicyV1: "tracking-only-v2",
      snapshotType: "project-overview-mandala-operational-context-keys-v1",
        providerGeneration,
        instanceId: providerGeneration,
        sourceNotePath,
        generatedAt: new Date().toISOString(),
        revision: createHash("sha256").update("[]", "utf8").digest("hex"),
        lifecycleRevision: readPurpose === "operation-check" ? 0 : Number(this.settings?.primaryKeyLifecycleRevision || 0),
        inputObservation: null,
        evidenceProviders: {},
        count: 0,
        totalCount: 0,
        returnedCount: 0,
        limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
        hasMore: false,
        truncated: false,
        items: [],
        diagnostics: [],
      };
    }
    let savedDeclarations = null, declarationObservations, declarationsCurrent;
    if (readPurpose === "operation-check") {
      try { savedDeclarations = await __PeoSavedDeclarationsV1(this, "mandala", requestedRaw); }
      catch (_) { return fail("peo-saved-declaration-unavailable"); }
      declarationObservations = savedDeclarations.observations;
      declarationsCurrent = savedDeclarations.current;
      if (!policyCurrent() || !declarationsCurrent()) return fail("peo-saved-declaration-changed");
    } else {
    // Request-local observation: no settings clone, writer wait, or retained cache.
    const declarationSettings = this.settings;
    const declarationComments = declarationSettings?.commentsByNodeKey;
    const declarationLifecycle = declarationSettings?.primaryKeyLifecycleById;
    const declarationReader = this.getComment;
    const lifecycleReader = this.isPrimaryKeyKilled;
    declarationObservations = new Map(requestedRaw.map((key) => [key, {
      comment: declarationReader.call(this, key),
      killed: lifecycleReader.call(this, "mandala", key),
    }]));
    declarationsCurrent = () => {
      try {
        return this.settings === declarationSettings
          && this.settings?.commentsByNodeKey === declarationComments
          && this.settings?.primaryKeyLifecycleById === declarationLifecycle
          && this.getComment === declarationReader && this.isPrimaryKeyKilled === lifecycleReader
          && requestedRaw.every((key) => {
            const observation = declarationObservations.get(key);
            return declarationReader.call(this, key) === observation.comment
              && lifecycleReader.call(this, "mandala", key) === observation.killed;
          });
      } catch (_) { return false; }
    };
    }
    const drafts = parsedRequests.map(({ primaryNodeKey, parsed }) => {
      const declarationById = new Map();
      extractGroupKeywordDeclarationsFromComment(declarationObservations.get(primaryNodeKey).comment, primaryNodeKey).forEach(({ keyword, declarationId }) => {
        const descriptor = normalizeContextCapsuleKeyFromKeywordItem({
          keyword,
          declarationId,
          mode: "mandala",
          groupId: primaryNodeKey,
          groupTitle: "",
          primaryNodeKey,
        });
        if (!descriptor?.contextKeyId) return;
        const key = `${text(descriptor.declarationEvidenceId, descriptor.contextKeyId).toLocaleLowerCase()}\u0000${text(descriptor.address).toLocaleLowerCase()}`;
        if (!declarationById.has(key)) declarationById.set(key, Object.assign({}, descriptor, {
          archivedByAddress: isArchivedProjectKeywordLabel(descriptor.displayLabel),
        }));
      });
      const declarations = Array.from(declarationById.values()).sort((left, right) => compareProjectKeywordLabels(left.displayLabel, right.displayLabel));
      const currentDeclarations = declarations.filter((entry) => entry.archivedByAddress !== true);
      const killed = declarationObservations.get(primaryNodeKey).killed;
      return { primaryNodeKey, parsed, declarations, currentDeclarations, killed };
    });
    const declarationOwnersByNormalizedKey = new Map();
    drafts.forEach((draft) => draft.currentDeclarations.forEach((entry) => {
      const normalizedKey = normalizeContextCapsuleDisplayLabel(entry.displayLabel).toLocaleLowerCase();
      if (!normalizedKey) return;
      if (!declarationOwnersByNormalizedKey.has(normalizedKey)) declarationOwnersByNormalizedKey.set(normalizedKey, new Set());
      declarationOwnersByNormalizedKey.get(normalizedKey).add(draft.primaryNodeKey);
    }));
    const duplicateContextOwners = Array.from(declarationOwnersByNormalizedKey.entries())
      .filter(([, owners]) => owners.size > 1)
      .map(([normalizedKey, owners]) => ({ code: "duplicate-normalized-context-declaration", normalizedKey, primaryNodeKeys: Array.from(owners) }));
    if (duplicateContextOwners.length) return fail("duplicate-normalized-context-declaration", duplicateContextOwners.slice(0, 20));
    const contextDrafts = drafts.filter((draft) => draft.currentDeclarations.length === 1);
    const contextKeys = contextDrafts.map((draft) => draft.currentDeclarations[0].displayLabel);
    const evaGetter = this.getEva, gtdGetter = this.getGtdTaskManagerApi;
    const evaApi = evaGetter.call(this), gtdApi = gtdGetter.call(this);
    const evaBatchReader = evaApi?.getOutgoingRelationBatchSnapshot;
    const gtdBatchReader = gtdApi?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot;
    const evidenceCurrent = () => {
      try {
        return this.getEva === evaGetter && this.getGtdTaskManagerApi === gtdGetter
          && evaGetter.call(this) === evaApi && gtdGetter.call(this) === gtdApi
          && evaApi?.getOutgoingRelationBatchSnapshot === evaBatchReader
          && gtdApi?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot === gtdBatchReader;
      } catch (_) { return false; }
    };
    if (typeof evaApi?.getOutgoingRelationBatchSnapshot !== "function") return fail("eva-outgoing-relation-batch-api-unavailable");
    if (typeof gtdApi?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot !== "function") return fail("gtd-top-level-project-carrier-batch-api-unavailable");
    if (!policyCurrent()) return fail("tracking-policy-provider-changed");
    if (!declarationsCurrent()) return fail("operational-context-declaration-changed");
    if (!evidenceCurrent()) return fail("goal-carrier-provider-changed");
    let evaSnapshot = null;
    let gtdSnapshot = null;
    try {
      [evaSnapshot, gtdSnapshot] = await Promise.all([
        Promise.resolve(evaBatchReader.call(evaApi, {
          sourceNodeKeys: requestedRaw,
          relationType: "承载",
          readPurpose,
          source: "project-execution-overview-effective-goal",
        })),
        Promise.resolve(gtdBatchReader.call(gtdApi, {
          contextKeys,
          readPurpose,
          source: "project-execution-overview-effective-goal",
        })),
      ]);
    } catch (error) {
      return fail("goal-carrier-provider-read-failed", [{ code: "goal-carrier-provider-read-failed", message: error?.message || String(error) }]);
    }
    if (!policyCurrent()) return fail("tracking-policy-provider-changed");
    if (!declarationsCurrent()) return fail("operational-context-declaration-changed");
    if (!evidenceCurrent()) return fail("goal-carrier-provider-changed");
    const validateOuter = (snapshot, expected = {}) => {
      if (!snapshot || snapshot.ok !== true || snapshot.complete !== true || snapshot.decisionComplete !== true) return false;
      if (text(snapshot.providerId) !== expected.providerId || text(snapshot.snapshotType) !== expected.snapshotType) return false;
      if (snapshot.contractVersion !== 1 || !text(snapshot.providerGeneration) || !text(snapshot.generatedAt)
        || !Number.isFinite(Date.parse(text(snapshot.generatedAt))) || !text(snapshot.revision)
        || snapshot.limit !== OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES
        || snapshot.hasMore !== false || snapshot.truncated !== false || !Array.isArray(snapshot.diagnostics)) return false;
      if (expected.sourceNotePathRequired === true && !text(snapshot.sourceNotePath)) return false;
      if (!Array.isArray(snapshot.results) || !Number.isInteger(snapshot.requestCount) || snapshot.requestCount !== expected.count) return false;
      return Number.isInteger(snapshot.count) && snapshot.count === expected.count
        && Number.isInteger(snapshot.returnedCount) && snapshot.returnedCount === expected.count
        && snapshot.results.length === expected.count;
    };
    if (readPurpose === "operation-check" && !__OwnerSavedObservationV1.validEvidence(evaSnapshot, "eva-cross-view-relations")) return fail("eva-saved-observation-invalid");
    if (!validateOuter(evaSnapshot, { providerId: "eva-cross-view-relations", snapshotType: "eva-outgoing-relation-batch-v1", count: requestedRaw.length })) {
      return fail("eva-outgoing-relation-batch-malformed");
    }
    if (gtdSnapshot?.ok === true && (gtdSnapshot.readPurpose !== readPurpose || gtdSnapshot.writeAuthorization !== false)) return fail("gtd-read-purpose-mismatch");
    const savedObservationValid = snapshot => {
    const observation = snapshot?.inputObservation;
    const source = snapshot?.sourceNotePath;
    if (typeof source !== "string" || !source || source.trim() !== source
        || snapshot.readPurpose !== "operation-check" || snapshot.writeAuthorization !== false
        || !observation || observation.contractVersion !== 1 || observation.purpose !== "saved-owner-files"
        || observation.persisted !== true || observation.consistency !== "single-pass-non-atomic"
        || observation.atomic !== false || observation.sourceNotePath !== source || observation.readCount !== 3
        || !Array.isArray(observation.files) || observation.files.length !== 3
        || typeof observation.rawRevision !== "string" || !/^[a-f0-9]{64}$/.test(observation.rawRevision)) return false;
    const index = source.lastIndexOf("/");
    const folder = index < 0 ? "" : source.slice(0, index);
    const expected = [["database", "GTD_Database.json"], ["tags", "GTD_Tags.json"], ["keywords", "GTD_TagKeywords.json"]];
    for (let i = 0; i < expected.length; i++) {
        const file = observation.files[i], [role, name] = expected[i];
        if (!file || file.role !== role || file.path !== folder + "/" + name
            || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)) return false;
    }
    return observation.rawRevision === createHash("sha256")
        .update(JSON.stringify([source, observation.files.map(file => [file.role, file.path, file.sha256])]), "utf8").digest("hex");
};
    if (readPurpose === "operation-check" && gtdSnapshot?.ok === true && !savedObservationValid(gtdSnapshot)) return fail("gtd-saved-observation-invalid");
    if (!validateOuter(gtdSnapshot, { providerId: "gtd-task-manager", snapshotType: "gtd-context-capsule-top-level-project-carrier-batch-v1", count: contextKeys.length, sourceNotePathRequired: true })) {
      const readinessReasons = ["engine-source-mismatch-or-not-ready", "engine-source-mismatch", "engine-api-not-ready"];
      if (gtdSnapshot?.ok === false && gtdSnapshot?.providerId === "gtd-task-manager"
        && readinessReasons.includes(gtdSnapshot?.reason)) {
        return fail("gtd-owner-not-ready", [{ code: "gtd-owner-not-ready", providerId: "gtd-task-manager", reason: gtdSnapshot.reason }]);
      }
      return fail("gtd-top-level-project-carrier-batch-malformed");
    }
    const evaByOwner = new Map();
    for (let index = 0; index < requestedRaw.length; index += 1) {
      const bucket = evaSnapshot.results[index];
      const totalCount = bucket?.totalCount;
      const sample = Array.isArray(bucket?.diagnosticSample) ? bucket.diagnosticSample : [];
      if (bucket?.ok !== true || bucket?.complete !== true || bucket?.decisionComplete !== true
        || !Number.isInteger(bucket?.requestIndex) || bucket.requestIndex !== index || text(bucket?.sourceNodeKey) !== requestedRaw[index]
        || text(bucket?.relationType) !== "承载" || !Number.isInteger(totalCount) || totalCount < 0
        || sample.length !== Math.min(totalCount, 2) || bucket?.diagnosticSampleTruncated !== (totalCount > 2)
        || sample.some((entry) => !text(entry?.id) || text(entry?.sourceNodeKey) !== requestedRaw[index]
          || !text(entry?.targetNodeKey) || text(entry?.relationType) !== "承载")) {
        return fail("eva-outgoing-relation-bucket-malformed", [{ code: "eva-outgoing-relation-bucket-malformed", requestIndex: index }]);
      }
      const unique = bucket.uniqueItem;
      if (totalCount === 1) {
        if (!unique || !text(unique.id) || text(unique.sourceNodeKey) !== requestedRaw[index]
          || !text(unique.targetNodeKey) || text(unique.relationType) !== "承载") {
          return fail("eva-outgoing-relation-unique-item-malformed", [{ code: "eva-outgoing-relation-unique-item-malformed", requestIndex: index }]);
        }
        const sampled = sample[0];
        if (text(unique.id) !== text(sampled?.id)
          || text(unique.sourceNodeKey) !== text(sampled?.sourceNodeKey)
          || text(unique.targetNodeKey) !== text(sampled?.targetNodeKey)
          || text(unique.relationType) !== text(sampled?.relationType)) {
          return fail("eva-outgoing-relation-unique-sample-mismatch", [{ code: "eva-outgoing-relation-unique-sample-mismatch", requestIndex: index }]);
        }
      } else if (unique != null) {
        return fail("eva-outgoing-relation-nonunique-item-leaked", [{ code: "eva-outgoing-relation-nonunique-item-leaked", requestIndex: index }]);
      }
      evaByOwner.set(requestedRaw[index], bucket);
    }
    const gtdByOwner = new Map();
    for (let index = 0; index < contextDrafts.length; index += 1) {
      const draft = contextDrafts[index];
      const bucket = gtdSnapshot.results[index];
      const expectedContextKey = contextKeys[index];
      const expectedNormalizedKey = normalizeContextCapsuleDisplayLabel(expectedContextKey).toLocaleLowerCase();
      const totalCount = bucket?.totalCount;
      const matchedTagCount = bucket?.matchedTagCount;
      const candidateSample = Array.isArray(bucket?.diagnosticSample) ? bucket.diagnosticSample : [];
      const tagSample = Array.isArray(bucket?.diagnosticTagIdSample) ? bucket.diagnosticTagIdSample : [];
      if (bucket?.ok !== true || bucket?.complete !== true || bucket?.decisionComplete !== true
        || !Number.isInteger(bucket?.requestIndex) || bucket.requestIndex !== index || text(bucket?.contextKey) !== expectedContextKey
        || text(bucket?.normalizedKey).toLocaleLowerCase() !== expectedNormalizedKey
        || !Number.isInteger(totalCount) || totalCount < 0
        || !Number.isInteger(bucket?.topLevelProjectCount) || bucket.topLevelProjectCount !== totalCount
        || !Number.isInteger(matchedTagCount) || matchedTagCount < 0
        || tagSample.length !== Math.min(matchedTagCount, 2) || tagSample.some((value) => !text(value))
        || bucket?.diagnosticTagIdSampleTruncated !== (matchedTagCount > 2)
        || (matchedTagCount === 1 ? text(bucket?.uniqueTagId) !== text(tagSample[0]) : !!text(bucket?.uniqueTagId))
        || candidateSample.length !== Math.min(totalCount, 2) || bucket?.diagnosticSampleTruncated !== (totalCount > 2)
        || candidateSample.some((entry) => !text(entry?.id) || !text(entry?.nodeKey))) {
        return fail("gtd-top-level-project-carrier-bucket-malformed", [{ code: "gtd-top-level-project-carrier-bucket-malformed", requestIndex: index }]);
      }
      const unique = bucket.uniqueItem;
      if (matchedTagCount === 1 && totalCount === 1) {
        const parsedGtdNode = parseJumpNodeKey(unique?.nodeKey);
        if (!unique || !text(unique.id) || !text(unique.nodeKey) || text(unique.type) !== "project"
          || unique.topLevel !== true || text(unique.parentId) || !text(unique.tagId)
          || text(unique.tagId) !== text(bucket.uniqueTagId)
          || parsedGtdNode?.viewType !== "gtd" || parsedGtdNode?.scopeType !== "note"
          || text(parsedGtdNode?.notePath) !== text(gtdSnapshot.sourceNotePath)
          || text(parsedGtdNode?.scopeId) !== text(gtdSnapshot.sourceNotePath)
          || text(parsedGtdNode?.itemId) !== text(unique.id)) {
          return fail("gtd-top-level-project-carrier-unique-item-malformed", [{ code: "gtd-top-level-project-carrier-unique-item-malformed", requestIndex: index }]);
        }
        const sampled = candidateSample[0];
        if (text(unique.id) !== text(sampled?.id) || text(unique.nodeKey) !== text(sampled?.nodeKey)
          || text(unique.type) !== text(sampled?.type) || unique.topLevel !== sampled?.topLevel
          || text(unique.parentId) !== text(sampled?.parentId) || text(unique.tagId) !== text(sampled?.tagId)) {
          return fail("gtd-top-level-project-carrier-unique-sample-mismatch", [{ code: "gtd-top-level-project-carrier-unique-sample-mismatch", requestIndex: index }]);
        }
      } else if (unique != null) {
        return fail("gtd-top-level-project-carrier-nonunique-item-leaked", [{ code: "gtd-top-level-project-carrier-nonunique-item-leaked", requestIndex: index }]);
      }
      gtdByOwner.set(draft.primaryNodeKey, bucket);
    }
    const items = drafts.map(({ primaryNodeKey, parsed, declarations, currentDeclarations, killed }) => {
      const evaBucket = evaByOwner.get(primaryNodeKey);
      const gtdBucket = gtdByOwner.get(primaryNodeKey) || null;
      const rawCarrierCount = evaBucket?.totalCount || 0;
      const rawCarrier = rawCarrierCount === 1 ? evaBucket?.uniqueItem || null : null;
      const gtdCarrier = gtdBucket?.uniqueItem || null;
      const exclusionReasons = [];
      if (rawCarrierCount === 0) exclusionReasons.push("gtd-carrier-relation-missing");
      else if (rawCarrierCount > 1) exclusionReasons.push("gtd-carrier-relation-ambiguous");
      if (!declarations.length) exclusionReasons.push("comment-declaration-missing");
      else if (!currentDeclarations.length) exclusionReasons.push("all-declarations-archived-9xx");
      else if (currentDeclarations.length > 1) exclusionReasons.push("multiple-current-declarations");
      if (currentDeclarations.length === 1) {
        if ((gtdBucket?.matchedTagCount || 0) === 0) exclusionReasons.push("gtd-context-tag-missing");
        else if ((gtdBucket?.matchedTagCount || 0) > 1) exclusionReasons.push("gtd-context-tag-ambiguous");
        if ((gtdBucket?.topLevelProjectCount || 0) === 0) exclusionReasons.push("gtd-top-level-project-carrier-missing");
        else if ((gtdBucket?.topLevelProjectCount || 0) > 1) exclusionReasons.push("gtd-top-level-project-carrier-ambiguous");
      }
      if (rawCarrier && gtdCarrier && text(rawCarrier.targetNodeKey) !== text(gtdCarrier.nodeKey)) exclusionReasons.push("gtd-carrier-target-context-mismatch");
      const eligibleDeclaration = currentDeclarations.length === 1 ? currentDeclarations[0] : null;
      return {
        primaryNodeKey,
        itemId: text(parsed?.itemId),
        sourceNotePath: text(parsed?.notePath),
        groupId: primaryNodeKey,
        gtdCarrier: rawCarrier && gtdCarrier && text(rawCarrier.targetNodeKey) === text(gtdCarrier.nodeKey)
          ? { nodeKey: text(gtdCarrier.nodeKey), label: text(gtdCarrier.label), pathLabel: "", relationId: text(rawCarrier.id), relationType: text(rawCarrier.relationType), tagId: text(gtdCarrier.tagId) }
          : null,
        declarations,
        currentDeclaration: eligibleDeclaration,
        archivedDeclarationCount: declarations.length - currentDeclarations.length,
        killed,
        legacyKillOnly: true,
        eligible: !!rawCarrier && !!gtdCarrier && !!eligibleDeclaration && exclusionReasons.length === 0,
        exclusionReasons,
      };
    });
    const revisionPayload = items.map((item) => ({
      primaryNodeKey: item.primaryNodeKey,
      groupId: item.groupId,
      gtdCarrier: item.gtdCarrier ? [item.gtdCarrier.nodeKey, item.gtdCarrier.relationId, item.gtdCarrier.relationType] : null,
      declarations: item.declarations.map((entry) => [entry.contextKeyId, entry.declarationEvidenceId, entry.address, entry.displayLabel, entry.archivedByAddress === true]),
      killed: item.killed,
      exclusionReasons: item.exclusionReasons,
    }));
    let revision = createHash("sha256").update(JSON.stringify({
      policy: "tracking-only-v2",
      evaProviderGeneration: text(evaSnapshot.providerGeneration),
      gtdProviderGeneration: text(gtdSnapshot.providerGeneration),
      evaRevision: text(evaSnapshot.revision),
      gtdRevision: text(gtdSnapshot.revision),
      items: revisionPayload,
    }), "utf8").digest("hex");
    if (readPurpose === "operation-check") revision = __OwnerSavedObservationV1.hash(JSON.stringify(["mandala", requestedRaw, sourceNotePath, savedDeclarations?.ownerPath || null, revision]));
    if (!policyCurrent()) return fail("tracking-policy-provider-changed");
    if (!declarationsCurrent()) return fail("operational-context-declaration-changed");
    if (!evidenceCurrent()) return fail("goal-carrier-provider-changed");
    const output = {
      ok: true,
      complete: true,
      contractVersion: OPERATIONAL_CONTEXT_SNAPSHOT_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
      operationalLifecyclePolicyV1: "tracking-only-v2",
      snapshotType: "project-overview-mandala-operational-context-keys-v1",
      providerGeneration,
      instanceId: providerGeneration,
      sourceNotePath: sourceNotePath || text(parsedRequests[0]?.parsed?.notePath),
      generatedAt: new Date().toISOString(),
      revision,
      lifecycleRevision: readPurpose === "operation-check" ? savedDeclarations?.lifecycleRevision || 0 : Number(this.settings?.primaryKeyLifecycleRevision || 0),
      inputObservation: savedDeclarations ? savedDeclarations.evidence(revision) : null,
      evidenceProviders: {
        eva: { providerGeneration: text(evaSnapshot.providerGeneration), revision: text(evaSnapshot.revision),
          ...(readPurpose === "operation-check" ? { inputObservation: evaSnapshot.inputObservation } : {}) },
        gtd: { providerGeneration: text(gtdSnapshot.providerGeneration), revision: text(gtdSnapshot.revision) },
      },
      count: items.length,
      totalCount: requestedRaw.length,
      returnedCount: items.length,
      limit: OPERATIONAL_CONTEXT_SNAPSHOT_MAX_ENTRIES,
      hasMore: false,
      truncated: false,
      items,
      diagnostics: items.filter((item) => item.exclusionReasons.length).map((item) => ({ code: "owner-ineligible", primaryNodeKey: item.primaryNodeKey, reasons: item.exclusionReasons })),
    };
    return readPurpose === "operation-check" ? __OwnerSavedObservationV1.freeze(output) : output;
  }

  getPrimaryKeyLifecycleAliases(domain = "", primaryNodeKey = "") {
    const normalizedDomain = normalizePrimaryKeyLifecycleDomain(domain);
    const nodeKey = text(primaryNodeKey);
    const parsed = parseJumpNodeKey(nodeKey) || {};
    const aliases = [nodeKey];
    if (normalizedDomain === "mandala") aliases.push(text(parsed.itemId));
    if (normalizedDomain === "workspace") aliases.push(text(parsed.itemId), text(parsed.tabId));
    return Array.from(new Set(aliases.filter(Boolean)));
  }

  getPrimaryKeyLifecycleEntry(domain = "", primaryNodeKey = "") {
    const lifecycleKey = buildPrimaryKeyLifecycleId(domain, primaryNodeKey);
    return lifecycleKey ? this.settings?.primaryKeyLifecycleById?.[lifecycleKey] || null : null;
  }

  isPrimaryKeyKilled(domain = "", primaryNodeKey = "") {
    return this.getPrimaryKeyLifecycleEntry(domain, primaryNodeKey)?.status === "killed";
  }

  getPrimaryGroupNodeKeys(group = {}) {
    const domain = normalizePrimaryKeyLifecycleDomain(group?.mode || group?.primaryColumnId);
    if (!domain) return [];
    const keys = Array.isArray(group?.primaryNodeKeys) && group.primaryNodeKeys.length
      ? group.primaryNodeKeys
      : [group?.primaryNodeKey];
    return Array.from(new Set(keys.map((key) => text(key)).filter(Boolean))).sort();
  }

  getPrimaryGroupLifecycleState(group = {}) {
    const domain = normalizePrimaryKeyLifecycleDomain(group?.mode || group?.primaryColumnId);
    const primaryNodeKeys = this.getPrimaryGroupNodeKeys(group);
    if (!domain || !primaryNodeKeys.length) return { domain, status: "none", killedCount: 0, totalCount: primaryNodeKeys.length, primaryNodeKeys };
    const killedCount = primaryNodeKeys.filter((nodeKey) => this.isPrimaryKeyKilled(domain, nodeKey)).length;
    const status = killedCount === 0 ? "none" : (killedCount === primaryNodeKeys.length ? "all" : "mixed");
    return { domain, status, killedCount, totalCount: primaryNodeKeys.length, primaryNodeKeys };
  }

  getPrimaryKeyLifecycleSnapshot(options = {}) {
    const requestedDomains = new Set((Array.isArray(options?.domains) ? options.domains : [options?.domain])
      .map((value) => normalizePrimaryKeyLifecycleDomain(value)).filter(Boolean));
    const requestedIdentities = new Set((Array.isArray(options?.identities) ? options.identities : [options?.identity])
      .map((value) => text(value)).filter(Boolean));
    const items = Object.values(this.settings?.primaryKeyLifecycleById || {})
      .map((entry) => {
        const aliases = this.getPrimaryKeyLifecycleAliases(entry.domain, entry.primaryNodeKey);
        return Object.assign({}, entry, {
          aliases,
          nodeId: aliases.find((alias) => alias !== entry.primaryNodeKey) || "",
        });
      })
      .filter((entry) => !requestedDomains.size || requestedDomains.has(entry.domain))
      .filter((entry) => !requestedIdentities.size || entry.aliases.some((alias) => requestedIdentities.has(alias)))
      .sort((left, right) => left.lifecycleKey.localeCompare(right.lifecycleKey, "zh-CN", { numeric: true, sensitivity: "base" }));
    return {
      ok: true,
      pluginId: "project-execution-overview",
      snapshotType: "primary-key-lifecycle",
      schemaVersion: 1,
      revision: Number(this.settings?.primaryKeyLifecycleRevision || 0),
      count: items.length,
      items,
    };
  }

  getPrimaryCollectionProjectionMode(options = {}) {
    const domain = text(options?.domain || options?.sourceType);
    const requestedMode = text(options?.groupingMode);
    if (requestedMode === "mandala" || requestedMode === "workspace") return requestedMode;
    if (domain === "goal") return "mandala";
    if (domain === "project") return "workspace";
    return "";
  }

  async getPrimaryCollectionProjectionModel(groupingMode = "", options = {}) {
    const mode = this.getPrimaryCollectionProjectionMode({ groupingMode });
    if (!mode) return null;
    if (!(this.primaryCollectionProjectionBuildPromises instanceof Map)) {
      this.primaryCollectionProjectionBuildPromises = new Map();
    }
    const purpose = options.purpose === "collection" ? "collection" : "full";
    const buildKey = `${mode}:${purpose}`;
    const current = this.primaryCollectionProjectionBuildPromises.get(buildKey);
    if (current) return await current;
    const build = Promise.resolve().then(() => this.buildOverviewModelForMode(mode, { purpose }));
    this.primaryCollectionProjectionBuildPromises.set(buildKey, build);
    try {
      return await build;
    } finally {
      if (this.primaryCollectionProjectionBuildPromises.get(buildKey) === build) {
        this.primaryCollectionProjectionBuildPromises.delete(buildKey);
      }
    }
  }

  getPrimaryCollectionGroupAliases(group = {}, groupingMode = "") {
    const mode = this.getPrimaryCollectionProjectionMode({ groupingMode });
    const aliases = new Set();
    const keys = Array.isArray(group?.primaryNodeKeys) && group.primaryNodeKeys.length
      ? group.primaryNodeKeys
      : [group?.primaryNodeKey];
    keys.forEach((nodeKey) => {
      const normalized = text(nodeKey);
      if (!normalized) return;
      aliases.add(normalized);
      this.getPrimaryKeyLifecycleAliases(mode, normalized).forEach((alias) => aliases.add(alias));
    });
    return aliases;
  }

  resolvePrimaryCollectionGroup(model = {}, options = {}) {
    const mode = this.getPrimaryCollectionProjectionMode(options);
    const primaryNodeKey = text(options?.primaryNodeKey || options?.sourceKey);
    const requestedAliases = new Set([
      ...(Array.isArray(options?.primaryAliases) ? options.primaryAliases : []),
      primaryNodeKey,
    ].map((value) => text(value)).filter(Boolean));
    const groups = (Array.isArray(model?.groups) ? model.groups : [])
      .filter((group) => text(group?.primaryColumnId) === mode && text(group?.primaryNodeKey));
    const exact = groups.filter((group) => {
      const keys = Array.isArray(group?.primaryNodeKeys) && group.primaryNodeKeys.length
        ? group.primaryNodeKeys
        : [group?.primaryNodeKey];
      return keys.some((value) => text(value) === primaryNodeKey);
    });
    if (exact.length === 1) return { ok: true, matchType: "primary-node-key", group: exact[0] };
    if (exact.length > 1) return { ok: false, reason: "ambiguous-primary", matchType: "primary-node-key", matches: exact.length };
    const aliasMatches = groups.filter((group) => {
      const groupAliases = this.getPrimaryCollectionGroupAliases(group, mode);
      return Array.from(requestedAliases).some((alias) => groupAliases.has(alias));
    });
    if (aliasMatches.length === 1) return { ok: true, matchType: "primary-alias", group: aliasMatches[0] };
    if (aliasMatches.length > 1) return { ok: false, reason: "ambiguous-primary", matchType: "primary-alias", matches: aliasMatches.length };
    return { ok: false, reason: "primary-not-found", matchType: "none", matches: 0 };
  }

  projectPrimaryCollectionItems(group = {}, limit = 200) {
    const boundedLimit = Math.max(1, Math.min(200, Number(limit) || 200));
    const seen = new Set();
    const items = (Array.isArray(group?.columns?.collection) ? group.columns.collection : [])
      .filter((item) => text(item?.nodeKey))
      .filter((item) => {
        const nodeKey = text(item.nodeKey);
        if (seen.has(nodeKey)) return false;
        seen.add(nodeKey);
        return true;
      })
      .map((item, index) => {
        const carrier = item?.contextCarrier && typeof item.contextCarrier === "object" ? item.contextCarrier : {};
        return {
          nodeKey: text(item.nodeKey),
          label: text(item.label, item.nodeKey),
          pathLabel: text(item.pathLabel || item.label, item.nodeKey),
          notePath: text(item.notePath),
          viewType: text(item.viewType, "collection-card-view"),
          carrierId: text(carrier.carrierId || item.carrierId),
          carrierLabel: text(carrier.carrierLabel || item.carrierLabel),
          contextKey: text(carrier.contextKey || item.contextKey),
          depth: Math.max(0, Number(item.depth) || 0),
          order: Number.isFinite(Number(item.carrierOrder ?? item.order)) ? Number(item.carrierOrder ?? item.order) : index,
          orderPath: Array.isArray(item.carrierOrderPath)
            ? item.carrierOrderPath.map((value) => Number(value) || 0)
            : (Array.isArray(item.orderPath) ? item.orderPath.map((value) => Number(value) || 0) : []),
        };
      });
    return {
      items: items.slice(0, boundedLimit),
      totalCount: items.length,
      returnedCount: Math.min(items.length, boundedLimit),
      truncated: items.length > boundedLimit,
    };
  }

  async getPrimaryCollectionCardSnapshot(options = {}) {
    const mode = this.getPrimaryCollectionProjectionMode(options);
    const primaryNodeKey = text(options?.primaryNodeKey || options?.sourceKey);
    const base = {
      ok: false,
      pluginId: "project-execution-overview",
      snapshotType: "primary-collection-card-projection",
      schemaVersion: 1,
      groupingMode: mode,
      primaryNodeKey,
      items: [],
      returnedCount: 0,
      totalCount: 0,
      complete: false,
      truncated: false,
    };
    if (!mode || !primaryNodeKey) return Object.assign(base, { reason: "invalid-request" });
    try {
      const model = await this.getPrimaryCollectionProjectionModel(mode, { purpose: "collection" });
      const hardLimitDiagnostics = (Array.isArray(model?.diagnostics) ? model.diagnostics : [])
        .filter((entry) => entry?.code === "max-nodes" || entry?.code === "max-edges");
      if (!model || model.evaAvailable !== true) {
        return Object.assign(base, { reason: "eva-unavailable" });
      }
      if (hardLimitDiagnostics.length) {
        return Object.assign(base, { reason: "model-truncated", diagnostics: hardLimitDiagnostics });
      }
      const resolved = this.resolvePrimaryCollectionGroup(model, options);
      if (resolved.ok !== true) {
        return Object.assign(base, { reason: resolved.reason, matchType: resolved.matchType, matchCount: resolved.matches });
      }
      const projection = this.projectPrimaryCollectionItems(resolved.group, options?.limit);
      return Object.assign(base, projection, {
        ok: true,
        complete: projection.truncated !== true,
        hasMore: projection.truncated === true,
        observationState: projection.truncated ? "fresh-truncated" : "fresh-complete",
        revision: text(model.generatedAt),
        generatedAt: text(model.generatedAt),
        matchType: resolved.matchType,
        groupId: text(resolved.group?.id),
        primaryLabel: text(resolved.group?.title, primaryNodeKey),
        primaryNodeKey: text(resolved.group?.primaryNodeKey, primaryNodeKey),
      });
    } catch (error) {
      console.warn("[ProjectOverview][primary-collection.snapshot-failed]", {
        groupingMode: mode,
        primaryNodeKey,
        message: error?.message || String(error),
      });
      return Object.assign(base, { reason: "model-build-failed", message: error?.message || String(error) });
    }
  }

  queuePrimaryKeyLifecycleChangedEvent(entries = [], reason = "owner-mutation") {
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const key = text(entry?.lifecycleKey || buildPrimaryKeyLifecycleId(entry?.domain, entry?.primaryNodeKey));
      if (key) this.primaryKeyLifecycleChangedKeys.add(key);
    });
    if (this.primaryKeyLifecycleEventTimer || !this.primaryKeyLifecycleChangedKeys.size) return;
    this.primaryKeyLifecycleEventTimer = window.setTimeout(() => {
      this.primaryKeyLifecycleEventTimer = null;
      const changedLifecycleKeys = Array.from(this.primaryKeyLifecycleChangedKeys || []);
      this.primaryKeyLifecycleChangedKeys?.clear?.();
      window.dispatchEvent?.(new window.CustomEvent(PRIMARY_KEY_LIFECYCLE_EVENT, {
        detail: {
          pluginId: "project-execution-overview",
          revision: Number(this.settings?.primaryKeyLifecycleRevision || 0),
          changedLifecycleKeys,
          reason: text(reason, "owner-mutation"),
          timestamp: Date.now(),
        },
      }));
    }, PRIMARY_KEY_LIFECYCLE_EVENT_DELAY_MS);
  }

  renderPrimaryKeyLifecycleViews(reason = "primary-key-lifecycle") {
    let rendered = 0;
    let failed = 0;
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .filter((view) => view?.model && view?.contextCarrierClosed !== true)
      .forEach((view) => {
        try {
          view.render({ preserveScroll: true, reason });
          rendered += 1;
        } catch (error) {
          failed += 1;
          console.warn("[ProjectOverview][primary-key-lifecycle.render-failed]", {
            reason: text(reason),
            message: error?.message || String(error),
          });
        }
      });
    return { rendered, failed };
  }

  async setPrimaryGroupLifecycle() {
    throw new Error("Kill 操作已停用，请通过管理主键停止或恢复追踪。");
  }

  invalidateGlobalKeywordNavCache(reason = "") {
    try { this.trackingSnapshotHost?.invalidate(); } catch (_) { this.trackingSnapshotHost?.close(); }
    this.globalKeywordNavGeneration = Number(this.globalKeywordNavGeneration || 0) + 1;
    this.globalKeywordNavScope = this.getGlobalKeywordNavScope();
    this.globalKeywordNavCache = { items: [], builtAt: 0 };
    this.globalKeywordNavBuildPromise = null;
    try { console.info("[ProjectOverview][global-keyword-nav.invalidate]", { reason: text(reason), generation: this.globalKeywordNavGeneration }); } catch (_) {}
  }

  getGlobalKeywordNavScope() {
    return JSON.stringify([this.settings?.startQuery || DEFAULT_START_QUERY, this.settings?.startNodeKey || ""]);
  }

  isGlobalKeywordNavCurrent(generation, scope) {
    return !this.contextCarrierUnloading && generation === Number(this.globalKeywordNavGeneration || 0)
      && scope === this.getGlobalKeywordNavScope();
  }

  prepareGlobalKeywordNavScope() {
    if (this.contextCarrierUnloading) throw new Error("global-keyword-nav-unloading");
    const scope = this.getGlobalKeywordNavScope();
    if (this.globalKeywordNavScope !== scope) this.invalidateGlobalKeywordNavCache("scope-change");
    return scope;
  }

  getContextCapsuleRenameConsumers() {
    return [
      {
        id: "workspace-mount",
        label: "Workspace Mount",
        api: window.__workspaceMountPluginApi,
      },
      {
        id: "gtd-task-manager",
        label: "GTD",
        api: window.__gtdTaskManagerPluginApi,
      },
      {
        id: "collection-card-view",
        label: "Collection Card",
        api: window.__collectionCardViewPluginApi,
      },
      {
        id: "state-capsules",
        label: "State Capsules",
        api: window.__stateCapsulesPluginApi,
      },
    ];
  }

  async callContextCapsuleRenameConsumers(rename = {}, options = {}) {
    const dryRun = options?.dryRun !== false;
    const payload = {
      oldDisplayLabel: text(rename.oldDisplayLabel),
      newDisplayLabel: text(rename.newDisplayLabel),
      dryRun,
      source: "project-execution-overview",
    };
    const results = [];
    for (const consumer of this.getContextCapsuleRenameConsumers()) {
      const api = consumer.api;
      if (typeof api?.renameContextCapsuleKey !== "function") {
        results.push({
          ok: false,
          pluginId: consumer.id,
          label: consumer.label,
          reason: "api-unavailable",
          matchedCount: 0,
          renamedCount: 0,
        });
        continue;
      }
      try {
        const result = await api.renameContextCapsuleKey(payload);
        results.push(Object.assign({
          pluginId: consumer.id,
          label: consumer.label,
          ok: true,
          matchedCount: 0,
          renamedCount: 0,
        }, result || {}, {
          pluginId: result?.pluginId || consumer.id,
          label: consumer.label,
        }));
      } catch (error) {
        console.warn("[ProjectOverview][context-capsule.rename.consumer-failed]", { pluginId: consumer.id, error });
        results.push({
          ok: false,
          pluginId: consumer.id,
          label: consumer.label,
          reason: error?.message || "exception",
          matchedCount: 0,
          renamedCount: 0,
        });
      }
    }
    return results;
  }

  async callContextCapsuleSyncConsumers(displayLabel = "", options = {}) {
    const dryRun = options?.dryRun !== false;
    const payload = {
      displayLabel: text(displayLabel),
      source: "project-execution-overview",
      dryRun,
    };
    const results = [];
    for (const consumer of this.getContextCapsuleRenameConsumers()) {
      const api = consumer.api;
      if (typeof api?.syncContextCapsuleKey !== "function") {
        results.push({
          ok: false,
          pluginId: consumer.id,
          label: consumer.label,
          reason: "api-unavailable",
          matchedCount: 0,
          renamedCount: 0,
        });
        continue;
      }
      try {
        const result = await api.syncContextCapsuleKey(payload);
        results.push(Object.assign({
          pluginId: consumer.id,
          label: consumer.label,
          ok: true,
          matchedCount: 0,
          renamedCount: 0,
        }, result || {}, {
          pluginId: result?.pluginId || consumer.id,
          label: consumer.label,
        }));
      } catch (error) {
        console.warn("[ProjectOverview][context-capsule.sync-repair.consumer-failed]", { pluginId: consumer.id, error });
        results.push({
          ok: false,
          pluginId: consumer.id,
          label: consumer.label,
          reason: error?.message || "exception",
          matchedCount: 0,
          renamedCount: 0,
        });
      }
    }
    return results;
  }

  async maybePropagateContextCapsuleKeyRename(rename = {}) {
    return this.confirmContextRenameRecovery({ ...rename, domain: parseJumpNodeKey(rename.primaryNodeKey)?.viewType === "mandala-time-blocks" ? "goal" : "project" });
  }
  async maybeRepairContextCapsuleKeyConsumers(displayLabel = "", primaryNodeKey = "") {
    if (!parseContextCapsuleKeyword(displayLabel).address) return { ok: false, reason: "missing-address" };
    return this.confirmContextRenameRecovery({ primaryNodeKey, newDisplayLabel: normalizeContextCapsuleDisplayLabel(displayLabel), repair: true,
      domain: parseJumpNodeKey(primaryNodeKey)?.viewType === "mandala-time-blocks" ? "goal" : "project" });
  }

  async getSourceContextCapsuleKeyForItem(item = {}) {
    const localCandidates = [
      extractContextCapsuleKeyFromMetaFields(item.metaFields),
      extractContextCapsuleKeyFromTextBlock(item.searchText),
      extractContextCapsuleKeyFromTextBlock(item.description),
      extractContextCapsuleKeyFromTextBlock(item.comment),
      extractContextCapsuleKeyFromTextBlock(item.pathLabel),
    ].filter(Boolean);
    if (localCandidates.length > 0) return localCandidates[0];
    const nodeKey = text(item?.nodeKey);
    if (!nodeKey) return "";
    try {
      const eva = await this.getOverviewReadSource();
      const record = eva?.getNodeRecord?.(nodeKey);
      const sourceCandidates = [
        extractContextCapsuleKeyFromMetaFields(record?.metaFields),
        extractContextCapsuleKeyFromTextBlock(record?.searchText),
        extractContextCapsuleKeyFromTextBlock(record?.description),
        extractContextCapsuleKeyFromTextBlock(record?.comment),
        extractContextCapsuleKeyFromTextBlock(record?.pathLabel),
      ].filter(Boolean);
      return sourceCandidates[0] || "";
    } catch (error) {
      console.warn("[ProjectOverview][context-capsule.source-key.read-failed]", { nodeKey, error });
      return "";
    }
  }

  async detectContextCapsuleKeyRenameForItem(item = {}, previousComment = "", nextComment = "") {
    const directRename = detectContextCapsuleKeyRenameFromComments(previousComment, nextComment);
    if (directRename) return directRename;
    const nextLabels = extractGroupKeywordsFromComment(nextComment)
      .map((keyword) => normalizeContextCapsuleDisplayLabel(keyword))
      .filter(Boolean);
    if (nextLabels.length !== 1) return null;
    const newDisplayLabel = nextLabels[0];
    const sourceDisplayLabel = await this.getSourceContextCapsuleKeyForItem(item);
    if (!sourceDisplayLabel || sourceDisplayLabel.toLocaleLowerCase() === newDisplayLabel.toLocaleLowerCase()) return null;
    return {
      oldDisplayLabel: sourceDisplayLabel,
      newDisplayLabel,
      oldParsed: parseContextCapsuleKeyword(sourceDisplayLabel),
      newParsed: parseContextCapsuleKeyword(newDisplayLabel),
      source: "source-record",
    };
  }

  tryLoadActiveCapsuleContext() {
    const api = window.__stateCapsulesPluginApi;
    if (!api || typeof api.getActiveCapsuleInfo !== "function") return false;
    try {
      const capsuleInfo = api.getActiveCapsuleInfo();
      this.setCapsuleContext(capsuleInfo);
      this.capsuleOverlayState = normalizeProjectOverviewCapsuleState({});
      return true;
    } catch (error) {
      console.warn("[ProjectOverview][state-capsule.context-load-failed]", error);
      return false;
    }
  }

  setCapsuleContext(capsuleInfo = {}) {
    const capsuleId = text(capsuleInfo?.id || capsuleInfo?.capsuleId);
    this.activeCapsuleInfo = capsuleId ? {
      id: capsuleId,
      name: text(capsuleInfo?.name),
    } : null;
    return this.activeCapsuleInfo;
  }

  getCurrentGroupCapsuleLevels() {
    return normalizeGroupCapsuleLevelMap(this.settings?.groupCapsuleLevels);
  }

  getMandalaPrimaryOrderSnapshot() {
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .filter((view) => view?.model && typeof view.getSortedGroupsForCurrentView === "function");
    const candidates = views.map((view) => {
      const groups = Array.isArray(view.model?.groups) ? view.model.groups : [];
      return {
        view,
        groups,
        mandalaCount: groups.filter((group) => group?.primaryColumnId === "mandala" && group.primaryNodeKey).length,
      };
    });
    const selected = candidates.find((candidate) => candidate.mandalaCount > 0);
    if (!selected) {
      const fallback = Array.isArray(this.lastMandalaPrimaryOrderSnapshot) ? this.lastMandalaPrimaryOrderSnapshot : [];
      console.info("[ProjectOverview][mandala-primary-order.snapshot]", {
        source: fallback.length ? "last-known" : "empty",
        viewCount: views.length,
        count: fallback.length,
      });
      return fallback.slice();
    }
    const snapshot = this.sortGroupsForMode(selected.groups, "mandala")
      .filter((group) => group?.primaryColumnId === "mandala" && group.primaryNodeKey)
      .map((group, index) => {
        const parsed = parseJumpNodeKey(group.primaryNodeKey);
        const capsuleLevel = this.getGroupCapsuleLevel("mandala", group.id);
        const memberNodeKeys = [];
        const memberNodeIds = [];
        const memberKeyById = new Map();
        let memberIdentityConflict = false;
        const addMember = (rawKey) => {
          const nodeKey = text(rawKey);
          if (!nodeKey) return;
          const member = parseJumpNodeKey(nodeKey);
          if (!member?.itemId) {
            memberIdentityConflict = true;
            return;
          }
          const memberId = text(member.itemId);
          const existingKey = memberKeyById.get(memberId);
          if (existingKey && existingKey !== nodeKey) {
            memberIdentityConflict = true;
            return;
          }
          if (!existingKey) {
            memberKeyById.set(memberId, nodeKey);
            memberNodeKeys.push(nodeKey);
            memberNodeIds.push(memberId);
          }
        };
        addMember(group.primaryNodeKey);
        (Array.isArray(group?.columns?.mandala) ? group.columns.mandala : []).forEach((item) => addMember(item?.nodeKey));
        return {
          index,
          groupId: group.id,
          title: text(group.title),
          nodeKey: group.primaryNodeKey,
          nodeId: text(parsed?.itemId),
          capsuleLevel,
          capsuleLevelRank: getCapsuleLevelRank(capsuleLevel),
          memberNodeKeys,
          memberNodeIds,
          memberIdentityConflict,
        };
      });
    const memberOwnerById = new Map();
    snapshot.forEach((entry) => {
      (Array.isArray(entry?.memberNodeIds) ? entry.memberNodeIds : []).forEach((memberId) => {
        const existingGroupId = memberOwnerById.get(memberId);
        if (existingGroupId && existingGroupId !== entry.groupId) {
          entry.memberIdentityConflict = true;
          const existing = snapshot.find((candidate) => candidate.groupId === existingGroupId);
          if (existing) existing.memberIdentityConflict = true;
        } else if (!existingGroupId) {
          memberOwnerById.set(memberId, entry.groupId);
        }
      });
    });
    this.lastMandalaPrimaryOrderSnapshot = snapshot;
    console.info("[ProjectOverview][mandala-primary-order.snapshot]", {
      source: "live-mandala-groups",
      viewCount: views.length,
      count: snapshot.length,
    });
    return snapshot.slice();
  }

  async getWorkspacePrimaryOrderSnapshotAsync() {
    const model = await this.getPrimaryCollectionProjectionModel("workspace");
    if (model?.evaAvailable !== true || !Array.isArray(model.groups) || model.diagnostics?.some(d => ["max-nodes", "max-edges"].includes(d.code))) {
      throw new Error("项目排序资料尚未完整就绪");
    }
    const snapshot = this.sortGroupsForMode(model.groups, "workspace")
      .filter((group) => group?.primaryColumnId === "workspace" && group.primaryNodeKey)
      .map((group, index) => {
        const workspaceItem = (Array.isArray(group?.columns?.workspace) ? group.columns.workspace : [])
          .find((entry) => entry?.nodeKey === group.primaryNodeKey)
          || (Array.isArray(group?.columns?.workspace) ? group.columns.workspace : [])[0];
        const capsuleLevel = this.getGroupCapsuleLevel("workspace", group.id);
        return {
          index,
          groupId: group.id,
          title: text(workspaceItem?.label || group.title),
          nodeKey: group.primaryNodeKey,
          nodeId: text(group.primaryNodeKey),
          capsuleLevel,
          capsuleLevelRank: getCapsuleLevelRank(capsuleLevel),
        };
      });
    return snapshot;
  }

  getWorkspacePrimaryOrderSnapshot() {
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .filter((view) => view?.model && typeof view.getSortedGroupsForCurrentView === "function");
    const candidates = views.map((view) => {
      const groups = Array.isArray(view.model?.groups) ? view.model.groups : [];
      return {
        view,
        groups,
        workspaceCount: groups.filter((group) => group?.primaryColumnId === "workspace" && group.primaryNodeKey).length,
      };
    });
    const selected = candidates.find((candidate) => candidate.workspaceCount > 0);
    if (!selected) {
      const fallback = Array.isArray(this.lastWorkspacePrimaryOrderSnapshot) ? this.lastWorkspacePrimaryOrderSnapshot : [];
      console.info("[ProjectOverview][workspace-primary-order.snapshot]", {
        source: fallback.length ? "last-known" : "empty",
        viewCount: views.length,
        count: fallback.length,
      });
      return fallback.slice();
    }
    const snapshot = this.sortGroupsForMode(selected.groups, "workspace")
      .filter((group) => group?.primaryColumnId === "workspace" && group.primaryNodeKey)
      .map((group, index) => {
        const workspaceItem = (Array.isArray(group?.columns?.workspace) ? group.columns.workspace : [])
          .find((entry) => entry?.nodeKey === group.primaryNodeKey)
          || (Array.isArray(group?.columns?.workspace) ? group.columns.workspace : [])[0];
        const capsuleLevel = this.getGroupCapsuleLevel("workspace", group.id);
        return {
          index,
          groupId: group.id,
          title: text(workspaceItem?.label || group.title),
          nodeKey: group.primaryNodeKey,
          nodeId: text(group.primaryNodeKey),
          capsuleLevel,
          capsuleLevelRank: getCapsuleLevelRank(capsuleLevel),
        };
      });
    this.lastWorkspacePrimaryOrderSnapshot = snapshot;
    console.info("[ProjectOverview][workspace-primary-order.snapshot]", {
      source: "live-workspace-groups",
      viewCount: views.length,
      count: snapshot.length,
    });
    return snapshot.slice();
  }

  getCapsuleState() {
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .filter((view) => view instanceof ProjectExecutionOverviewView && !!view.model);
    const activeView = typeof this.app.workspace.getActiveViewOfType === "function"
      ? this.app.workspace.getActiveViewOfType(ProjectExecutionOverviewView)
      : null;
    const sourceView = activeView instanceof ProjectExecutionOverviewView && activeView.model
      ? activeView
      : views[0] || null;
    const selectionState = sourceView?.captureCapsuleSelectionState?.() || {};
    return normalizeProjectOverviewCapsuleState(selectionState);
  }

  async applyCapsuleState(state = {}, options = {}) {
    const capsuleId = text(options?.capsuleId || state?.capsuleId);
    if (capsuleId) this.setCapsuleContext({ id: capsuleId, name: text(options?.capsuleName || state?.capsuleName) });
    const normalizedState = normalizeProjectOverviewCapsuleState(state || {});
    const ignoredGroupLevelCount = Object.keys(normalizedState.groupCapsuleLevels || {}).length;
    this.capsuleOverlayState = normalizeProjectOverviewCapsuleState({});
    console.info("[ProjectOverview][state-capsule.apply]", {
      capsuleId: text(this.activeCapsuleInfo?.id),
      source: text(options?.source, "unknown"),
      groupCapsuleLevelCount: 0,
      ignoredGroupLevelCount,
      selectionCount: Object.keys(normalizedState.selectedGroupsByScope || {}).length,
      activeScopeKey: text(normalizedState.activeScopeKey),
    });
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .filter((view) => view instanceof ProjectExecutionOverviewView);
    const preRefreshOutcomes = views.flatMap((view) => view.applyCapsuleSelectionState(normalizedState, {
      renderCurrent: false,
      reason: "state-capsule-pre-refresh",
    }));
    if (options?.refresh !== false) {
      const previousSuppress = this.suppressFirstSeenOrderSave;
      this.suppressFirstSeenOrderSave = true;
      try {
        await this.refreshViews({ preserveScroll: true, reason: text(options?.source, "state-capsules-apply") });
      } finally {
        this.suppressFirstSeenOrderSave = previousSuppress;
      }
    }
    const postRefreshOutcomes = views.flatMap((view) => view.applyCapsuleSelectionState(normalizedState, {
      renderCurrent: true,
      reason: "state-capsule-tab-restore",
    }));
    console.info("[ProjectOverview][state-capsule.selection-result]", {
      capsuleId: text(this.activeCapsuleInfo?.id),
      preRefreshOutcomes,
      postRefreshOutcomes,
      verticalScrollPolicy: "preserve",
    });
    return {
      ok: true,
      applied: ["selected-primary-tab"],
      selectionOutcomes: postRefreshOutcomes,
    };
  }

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  getCreationProductionCoordinator() {
    if(!this.creationProductionCoordinator)this.creationProductionCoordinator=new CreationProductionCoordinator(this);
    return this.creationProductionCoordinator;
  }
  getCenterNamingParticipantV1() {
    if(!this.goalPeoWriter)this.goalPeoWriter=new GoalPeoWriter(this);
    if(!this.centerNamingParticipantV1||this.centerNamingParticipantV1Writer!==this.goalPeoWriter){this.centerNamingParticipantV1=(()=>{const path=require('path'),fs=require('fs'),base=this.app.vault.adapter.getBasePath(),rel=this.manifest.dir;if(!path.isAbsolute(base)||typeof rel!=='string'||path.isAbsolute(rel)||rel.split(/[\\/]/).some(x=>!x||x==='.'||x==='..'))throw Error('binding-module-path');const file=path.resolve(base,rel,'center-peo-projection.cjs');if(!file.startsWith(path.resolve(base)+path.sep)||fs.realpathSync(file)!==file)throw Error('binding-module-path');return require(file).createParticipant(this)})();this.centerNamingParticipantV1Writer=this.goalPeoWriter}
    return this.centerNamingParticipantV1;
  }
  getManagedCreationOwner() {
    if(!this.goalPeoWriter)this.goalPeoWriter=new GoalPeoWriter(this);
    if(!this.managedCreationOwner||!this.managedCreationOwner.current())this.managedCreationOwner=new PeoCreationModule.PeoCreationOwner(this,this.goalPeoWriter);
    return this.managedCreationOwner;
  }
  getGoalProductionCoordinator() {
    if(!this.goalProductionCoordinator)this.goalProductionCoordinator=new GoalProductionCoordinator(this);
    return this.goalProductionCoordinator;
  }
  async saveData(value) {
    if(!this.goalPeoWriter)this.goalPeoWriter=new GoalPeoWriter(this);
    return this.goalPeoWriter.save(value, payload => super.saveData(payload));
  }

  async saveSettings() {
    await this.enqueueSettingsWrite(async () => {
      // Snapshot at execution, not enqueue time; serialization errors must reject.
      const snapshot = JSON.parse(JSON.stringify(this.settings));
      await this.saveData(snapshot);
    });
  }

  enqueueSettingsWrite(task) {
    const endSaved = __OwnerSavedObservationV1.begin(this);
    const queued = (this.settingsWriteQueue || Promise.resolve()).then(task, task).finally(endSaved);
    this.settingsWriteQueue = queued.catch(() => undefined);
    return queued;
  }

  rememberScrollState(state, reason = "unknown") {
    if (!state || typeof state !== "object") return;
    this.lastScrollState = Object.assign({}, state, {
      rememberedAt: nowString(),
      rememberedReason: text(reason, "unknown"),
    });
    console.info("[ProjectOverview][scroll.memory-save]", {
      reason: text(reason, "unknown"),
      top: Number(this.lastScrollState.top) || 0,
      anchorNodeKey: text(this.lastScrollState.anchorNodeKey),
      anchorGroupId: text(this.lastScrollState.anchorGroupId),
    });
  }

  getRememberedScrollState() {
    return this.lastScrollState && typeof this.lastScrollState === "object" ? Object.assign({}, this.lastScrollState) : null;
  }

  applyManualOrder(items, scopeKey, options = {}) {
    const list = Array.isArray(items) ? items.slice() : [];
    const projectedMilestones = list.filter((item) => isTimelineMilestoneProjectionItem(item));
    if (projectedMilestones.length) {
      const ordinaryItems = list.filter((item) => !isTimelineMilestoneProjectionItem(item));
      const orderedOrdinaryItems = this.applyManualOrder(ordinaryItems, scopeKey, options);
      return orderedOrdinaryItems.concat(projectedMilestones.sort(compareTimelineMilestoneProjectionItems));
    }
    const scope = text(scopeKey);
    if (!scope) return list;
    const allowManual = options?.allowManual !== false;
    const allowFirstSeen = options?.allowFirstSeen !== false;
    const manualOrder = allowManual ? this.settings?.manualOrders?.[scope] : null;
    const firstSeenOrder = allowFirstSeen ? this.ensureFirstSeenOrder(scope, list) : [];
    const manualIndexByKey = new Map((Array.isArray(manualOrder) ? manualOrder : []).map((nodeKey, index) => [nodeKey, index]));
    const firstSeenIndexByKey = new Map(firstSeenOrder.map((nodeKey, index) => [nodeKey, index]));
    const fallbackIndexByKey = new Map(list.map((item, index) => [item?.nodeKey, index]));
    return list.sort((a, b) => {
      const carrierDiff = compareCarrierSourceOrder(a, b);
      if (carrierDiff != null && carrierDiff !== 0) return carrierDiff;
      const aManual = manualIndexByKey.has(a?.nodeKey);
      const bManual = manualIndexByKey.has(b?.nodeKey);
      if (aManual && bManual) return manualIndexByKey.get(a.nodeKey) - manualIndexByKey.get(b.nodeKey);
      if (aManual) return -1;
      if (bManual) return 1;
      const aSeen = firstSeenIndexByKey.has(a?.nodeKey);
      const bSeen = firstSeenIndexByKey.has(b?.nodeKey);
      if (aSeen && bSeen) return firstSeenIndexByKey.get(a.nodeKey) - firstSeenIndexByKey.get(b.nodeKey);
      if (aSeen) return -1;
      if (bSeen) return 1;
      return (fallbackIndexByKey.get(a?.nodeKey) ?? 999999) - (fallbackIndexByKey.get(b?.nodeKey) ?? 999999);
    });
  }

  ensureFirstSeenOrder(scopeKey, items) {
    const scope = text(scopeKey);
    if (!scope) return [];
    const currentKeys = [];
    (Array.isArray(items) ? items : []).forEach((item) => {
      const key = text(item?.nodeKey);
      if (key && !currentKeys.includes(key)) currentKeys.push(key);
    });
    const existing = Array.isArray(this.settings?.firstSeenOrderByScope?.[scope])
      ? this.settings.firstSeenOrderByScope[scope].map((key) => text(key)).filter(Boolean)
      : [];
    const next = [];
    existing.forEach((key) => {
      if (key && !next.includes(key)) next.push(key);
    });
    currentKeys.forEach((key) => {
      if (!next.includes(key)) next.push(key);
    });
    if (next.length !== existing.length || next.some((key, index) => key !== existing[index])) {
      if (this.suppressFirstSeenOrderSave) return next;
      this.settings.firstSeenOrderByScope = Object.assign({}, this.settings.firstSeenOrderByScope || {}, { [scope]: next });
      if (this.deferFirstSeenOrderSave) this.firstSeenOrderSaveDeferred = true;
      else this.scheduleFirstSeenOrderSave(scope, currentKeys.length);
    }
    return next;
  }

  scheduleFirstSeenOrderSave(scopeKey, itemCount) {
    if (this.firstSeenOrderSaveTimer) window.clearTimeout?.(this.firstSeenOrderSaveTimer);
    this.firstSeenOrderSaveTimer = window.setTimeout(async () => {
      this.firstSeenOrderSaveTimer = null;
      try {
        await this.saveSettings();
        console.info("[ProjectOverview][first-seen-order.save]", {
          scopeKey: text(scopeKey),
          itemCount: Number(itemCount) || 0,
        });
      } catch (error) {
        console.warn("[ProjectOverview][first-seen-order.save-failed]", error);
      }
    }, 600);
  }

  async reorderManualOrder(scopeKey, siblingKeys, draggedKey, targetKey, position = "after") {
    const scope = text(scopeKey);
    const dragged = text(draggedKey);
    const target = text(targetKey);
    if (!scope || !dragged || !target || dragged === target) return false;
    const baseKeys = Array.isArray(siblingKeys) ? siblingKeys.map((key) => text(key)).filter(Boolean) : [];
    if (!baseKeys.includes(dragged) || !baseKeys.includes(target)) return false;
    const uniqueKeys = [];
    baseKeys.forEach((key) => {
      if (!uniqueKeys.includes(key)) uniqueKeys.push(key);
    });
    const reordered = uniqueKeys.filter((key) => key !== dragged);
    const targetIndex = reordered.indexOf(target);
    if (targetIndex < 0) return false;
    reordered.splice(position === "before" ? targetIndex : targetIndex + 1, 0, dragged);
    if (reordered.join("\n") === uniqueKeys.join("\n")) return false;
    const nextOrders = Object.assign({}, this.settings.manualOrders || {});
    nextOrders[scope] = reordered;
    this.settings.manualOrders = nextOrders;
    await this.saveSettings();
    console.info("[ProjectOverview][manual-order.save]", {
      scopeKey: scope,
      draggedKey: dragged,
      targetKey: target,
      position: position === "before" ? "before" : "after",
      count: reordered.length,
    });
    return true;
  }

  getGroupCapsuleLevel(mode, groupId) {
    const key = buildGroupCapsuleKey(mode, groupId);
    const settings = this.settings?.groupCapsuleLevels || {};
    return normalizeCapsuleLevel(settings[key]);
  }

  async setGroupCapsuleLevel(mode, groupId, level) {
    const key = buildGroupCapsuleKey(mode, groupId);
    if (!text(groupId)) return false;
    const normalizedLevel = normalizeCapsuleLevel(level);
    const nextLevels = Object.assign({}, this.settings.groupCapsuleLevels || {});
    nextLevels[key] = normalizedLevel;
    this.settings.groupCapsuleLevels = nextLevels;
    await this.saveSettings();
    console.info("[ProjectOverview][group-capsule-level.save]", {
      mode: text(mode, DEFAULT_SETTINGS.groupingMode),
      groupId: text(groupId),
      level: normalizedLevel,
      scope: "project-overview-global",
    });
    return true;
  }

  getComment(nodeKey) {
    return text(this.settings.commentsByNodeKey?.[nodeKey]);
  }

  async setComment(nodeKey, value, options = {}) {
    const key = text(nodeKey); if (!key) return;
    // Capture before awaiting the queue: callers may have prepared text from an older declaration.
    const expected = Object.prototype.hasOwnProperty.call(options, "expectedComment") ? options.expectedComment : this.getComment(key);
    return this.getContextKeyRenameManager().saveComment(key, value, expected);
  }

  async syncWorkspaceProjectEntryMeta(nodeKey, meta = {}, options = {}) {
    if (options?.reportCompletion === true) return await this.syncPrimaryMetaWithCompletion("workspace", nodeKey, meta, options);
    const normalizedNodeKey = text(nodeKey || meta?.nodeKey);
    if (!normalizedNodeKey) return { ok: false, reason: "missing-node-key" };
    const mode = "workspace";
    const view = this.getActiveOverviewView();
    let group = null;
    if (view?.model?.groups) {
      group = view.model.groups.find((entry) => text(entry?.primaryNodeKey) === normalizedNodeKey) || null;
    }
    if (!group) {
      const model = await this.buildOverviewModelForMode(mode);
      group = (Array.isArray(model?.groups) ? model.groups : []).find((entry) => text(entry?.primaryNodeKey) === normalizedNodeKey) || null;
    }
    if (!group) {
      console.warn("[ProjectOverview][workspace-project-entry-meta.group-missing]", { nodeKey: normalizedNodeKey });
      return { ok: false, reason: "group-not-found", nodeKey: normalizedNodeKey };
    }
    const level = normalizeCapsuleLevel(meta?.importanceGroup);
    const levelSaved = await this.setGroupCapsuleLevel(mode, group.id, level);
    const nextComment = upsertProjectMetaComment(this.getComment(normalizedNodeKey), {
      projectName: meta?.projectName,
      contextKey: meta?.contextKey || meta?.operationContextKey,
      importanceGroup: level,
    });
    await this.setComment(normalizedNodeKey, nextComment);
    this.invalidateGlobalKeywordNavCache("workspace-project-entry-meta");
    await this.refreshViews({ preserveScroll: true, reason: "workspace-project-entry-meta" });
    console.info("[ProjectOverview][workspace-project-entry-meta.sync]", {
      nodeKey: normalizedNodeKey,
      groupId: group.id,
      level,
      levelSaved,
      hasContextKey: !!text(meta?.contextKey || meta?.operationContextKey),
    });
    return {
      ok: true,
      nodeKey: normalizedNodeKey,
      groupId: group.id,
      groupTitle: text(group.title),
      importanceGroup: level,
      comment: nextComment,
    };
  }

  async syncMandalaContextGoalMeta(nodeKey, meta = {}, options = {}) {
    if (options?.reportCompletion === true) return await this.syncPrimaryMetaWithCompletion("mandala", nodeKey, meta, options);
    const normalizedNodeKey = text(nodeKey || meta?.nodeKey);
    if (!normalizedNodeKey) return { ok: false, reason: "missing-node-key" };
    const mode = "mandala";
    const view = this.getActiveOverviewView();
    let group = null;
    if (view?.model?.groups) {
      group = view.model.groups.find((entry) => text(entry?.primaryNodeKey) === normalizedNodeKey) || null;
    }
    if (!group) {
      const model = await this.buildOverviewModelForMode(mode);
      group = (Array.isArray(model?.groups) ? model.groups : []).find((entry) => text(entry?.primaryNodeKey) === normalizedNodeKey) || null;
    }
    if (!group) {
      console.warn("[ProjectOverview][mandala-context-goal-meta.group-missing]", { nodeKey: normalizedNodeKey });
      return { ok: false, reason: "group-not-found", nodeKey: normalizedNodeKey };
    }
    const level = normalizeCapsuleLevel(meta?.importanceGroup);
    const levelSaved = await this.setGroupCapsuleLevel(mode, group.id, level);
    const nextComment = upsertProjectMetaComment(this.getComment(normalizedNodeKey), {
      projectName: meta?.projectName || meta?.goalName,
      contextKey: meta?.contextKey || meta?.operationContextKey,
      importanceGroup: level,
    });
    await this.setComment(normalizedNodeKey, nextComment);
    this.invalidateGlobalKeywordNavCache("mandala-context-goal-meta");
    await this.refreshViews({ preserveScroll: true, reason: "mandala-context-goal-meta" });
    console.info("[ProjectOverview][mandala-context-goal-meta.sync]", {
      nodeKey: normalizedNodeKey,
      groupId: group.id,
      level,
      levelSaved,
      hasContextKey: !!text(meta?.contextKey || meta?.operationContextKey),
    });
    return {
      ok: true,
      nodeKey: normalizedNodeKey,
      groupId: group.id,
      groupTitle: text(group.title),
      importanceGroup: level,
      comment: nextComment,
    };
  }

  async syncPrimaryMetaWithCompletion(mode, nodeKey, meta = {}, options = {}) {
    const key = text(nodeKey || meta?.nodeKey);
    const sourceNotePath = text(options?.expectedSourceNotePath);
    const completion = {
      contractVersion: 1, txId: makeId("metadata-sync"), domain: mode, sourceNotePath, nodeKey: key,
      groupId: "", metadata: "not-started", scopeCurrent: true, mismatchFields: [],
      view: "not-started", views: [], automaticRetryAllowed: false,
      warnings: ["owner-existence-unverified", "effective-qualification-unverified",
        "model-may-update-derived-state", "refresh-may-save-derived-settings", "commit-is-save-acknowledgement-only"],
    };
    let group = null, nextComment = "", level = "", phase = "preflight", checkScope = null;
    const finish = (ok, reason = "") => {
      try { console.info("[ProjectOverview][primary-meta.completion]", {
        txId: completion.txId, domain: mode, nodeKey: key, groupId: completion.groupId,
        ok, reason, metadata: completion.metadata, view: completion.view,
        scopeCurrent: completion.scopeCurrent, mismatchFields: completion.mismatchFields,
      }); } catch (_) { /* A diagnostic sink must not discard the save receipt. */ }
      return { ok, reason, nodeKey: key, groupId: completion.groupId, groupTitle: text(group?.title),
        importanceGroup: level, comment: nextComment, completion };
    };
    const mismatch = field => {
      completion.scopeCurrent = false;
      if (!completion.mismatchFields.includes(field)) completion.mismatchFields.push(field);
    };
    try {
      let parsed;
      try {
        const parts = key.startsWith("jump:v1:") ? key.slice(8).split("|").map(decodeURIComponent) : [];
        if (parts.length !== 5 || parts.some(part => !text(part))) return finish(false, "invalid-node-key");
        parsed = { viewType: parts[0], notePath: parts[1], scopeType: parts[2], scopeId: parts[3], itemId: parts[4] };
      } catch (_) { return finish(false, "invalid-node-key"); }
      if (!sourceNotePath || parsed.notePath !== sourceNotePath) return finish(false, "source-scope-mismatch");
      if (!(mode === "workspace" && parsed.viewType === "workspace-mount-view" && parsed.scopeType === "tab")
        && !(mode === "mandala" && parsed.viewType === "mandala-time-blocks" && parsed.scopeType === "node" && parsed.scopeId === "mandala")) {
        return finish(false, "domain-scope-mismatch");
      }
      const contextKey = text(meta?.contextKey || meta?.operationContextKey);
      if (!contextKey) return finish(false, "missing-context-key");
      const payload = { contextKey, projectName: text(meta?.projectName || (mode === "mandala" ? meta?.goalName : "")),
        importanceGroup: normalizeCapsuleLevel(meta?.importanceGroup) };
      level = payload.importanceGroup;
      const settings = this.settings, api = this.projectExecutionOverviewPublicApi;
      const generation = text(this.operationalContextSnapshotProviderGeneration);
      const isMap = value => !!value && typeof value === "object" && !Array.isArray(value);
      const settingsValid = () => isMap(this.settings) && isMap(this.settings.commentsByNodeKey) && isMap(this.settings.groupCapsuleLevels);
      if (!settingsValid() || !api || !generation) return finish(false, "metadata-owner-not-ready");
      const config = JSON.stringify([settings.startQuery, settings.startNodeKey, settings.groupingMode]);
      const fingerprint = (map, id) => ({ exists: Object.prototype.hasOwnProperty.call(map, id), value: map[id] });
      const matchesStamp = (map, id, stamp) => Object.prototype.hasOwnProperty.call(map, id) === stamp.exists && Object.is(map[id], stamp.value);
      let expectedComment = fingerprint(settings.commentsByNodeKey, key), levelKey = "", expectedLevel = "";
      const guard = () => {
        if (this.contextCarrierUnloading) mismatch("unloading");
        if (this.settings !== settings) mismatch("settings-instance");
        if (this.projectExecutionOverviewPublicApi !== api || window.__projectExecutionOverviewPluginApi !== api
          || text(this.operationalContextSnapshotProviderGeneration) !== generation) mismatch("provider-instance");
        if (!settingsValid()) mismatch("settings-shape");
        else {
          if (JSON.stringify([this.settings.startQuery, this.settings.startNodeKey, this.settings.groupingMode]) !== config) mismatch("source-config");
          if (!matchesStamp(this.settings.commentsByNodeKey, key, expectedComment)) mismatch("comment");
          if (levelKey && !matchesStamp(this.settings.groupCapsuleLevels, levelKey, expectedLevel)) mismatch("level");
        }
        return completion.scopeCurrent;
      };
      checkScope = guard;
      if (!guard()) return finish(false, "metadata-scope-changed");
      phase = "model";
      // Existing aggregation is not an authoritative read of the primary owner.
      const model = await this.buildOverviewModelForMode(mode);
      if (!guard()) return finish(false, "metadata-scope-changed");
      const matches = (Array.isArray(model?.groups) ? model.groups : [])
        .filter(entry => entry?.primaryNodeKey === key && entry?.mode === mode);
      if (matches.length !== 1 || !text(matches[0]?.id) || !text(matches[0]?.title)) return finish(false, "group-not-unique-or-missing");
      group = { id: text(matches[0].id), title: text(matches[0].title) };
      completion.groupId = group.id;
      levelKey = buildGroupCapsuleKey(mode, group.id);
      expectedLevel = fingerprint(this.settings.groupCapsuleLevels, levelKey);
      phase = "metadata";
      await this.enqueueSettingsWrite(async () => {
        if (!guard()) throw new Error("metadata-scope-changed");
        const snapshot = JSON.parse(JSON.stringify(this.settings));
        nextComment = upsertProjectMetaComment(snapshot.commentsByNodeKey[key], payload);
        snapshot.commentsByNodeKey[key] = nextComment;
        snapshot.groupCapsuleLevels[levelKey] = level;
        completion.receipt = { commentSha256: createHash("sha256").update(nextComment, "utf8").digest("hex"), level };
        if (!guard()) throw new Error("metadata-scope-changed");
        completion.metadata = "unknown";
        await this.saveData(snapshot);
        // A later conflict must never erase this historical save acknowledgement.
        completion.metadata = "committed";
        this.invalidateGlobalKeywordNavCache("primary-meta-committed");
        if (!guard()) throw new Error("metadata-scope-changed");
        this.settings.commentsByNodeKey = Object.assign({}, this.settings.commentsByNodeKey, { [key]: nextComment });
        this.settings.groupCapsuleLevels = Object.assign({}, this.settings.groupCapsuleLevels, { [levelKey]: level });
        expectedComment = fingerprint(this.settings.commentsByNodeKey, key);
        expectedLevel = fingerprint(this.settings.groupCapsuleLevels, levelKey);
      });
      if (!guard()) return finish(false, "metadata-scope-changed");
      // Do not hold the settings queue while refresh may initiate another save.
      phase = "view";
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW).slice();
      if (!leaves.length) { completion.view = "not-open"; return finish(false, "no-open-view"); }
      completion.views = leaves.map((leaf, index) => ({ leafId: text(leaf.id, String(index)), state: "not-started" }));
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i], view = leaf.view, report = completion.views[i];
        let rejected = false;
        const viewGuard = () => {
          const current = guard() && view instanceof ProjectExecutionOverviewView && view.plugin === this
            && !view.contextCarrierClosed && leaf.view === view
            && this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW).includes(leaf);
          if (!current) rejected = true;
          return current && !rejected;
        };
        if (!viewGuard()) { report.state = "stale"; continue; }
        report.state = "pending";
        try {
          const refreshed = await view.refresh({ preserveScroll: true, reason: `${mode}-primary-meta-completion`, commitGuard: viewGuard });
          const current = viewGuard();
          report.state = refreshed === true && current ? "updated" : "not-updated";
        } catch (_) { report.state = "failed"; viewGuard(); }
      }
      const current = guard();
      completion.view = completion.views.every(view => view.state === "updated") ? "updated" : "incomplete";
      return finish(current && completion.view === "updated", current ? (completion.view === "updated" ? "" : "view-incomplete") : "metadata-scope-changed");
    } catch (_) {
      try { checkScope?.(); } catch (_) { mismatch("scope-check-failed"); }
      return finish(false, completion.scopeCurrent ? `${phase}-failed` : "metadata-scope-changed");
    }
  }

  getKeywordNoteBinding(nodeKey) {
    const key = text(nodeKey);
    if (!key) return null;
    return clone(this.settings.keywordNoteBindingsByNodeKey?.[key] || null, null);
  }

  async setKeywordNoteBinding(nodeKey, binding) {
    const key = text(nodeKey);
    if (!key) return false;
    const next = Object.assign({}, this.settings.keywordNoteBindingsByNodeKey || {});
    if (!binding) {
      delete next[key];
    } else {
      const path = text(binding.path);
      const ctime = Number.isFinite(Number(binding.ctime)) ? Number(binding.ctime) : null;
      if (!path && !Number.isFinite(ctime)) delete next[key];
      else next[key] = { path, ctime };
    }
    this.settings.keywordNoteBindingsByNodeKey = next;
    await this.saveSettings();
    console.info("[ProjectOverview][keyword-note-binding.save]", { nodeKey: key, hasBinding: !!next[key], path: text(next[key]?.path) });
    return true;
  }

  buildVaultIndexFromFiles(files) {
    return (Array.isArray(files) ? files : [])
      .filter((file) => file?.extension === "md")
      .map((file) => ({
        path: file.path,
        basename: file.basename,
        basenameLower: text(file.basename).toLowerCase(),
        pathLower: text(file.path).toLowerCase(),
        search: `${file.basename || ""} ${file.path || ""}`.toLowerCase(),
      }))
      .sort((a, b) => a.basename.localeCompare(b.basename, "zh-CN", { numeric: true, sensitivity: "base" }));
  }

  buildVaultIndexFromEvaNotes(evaNotes) {
    const items = [];
    Object.values(evaNotes || {}).forEach((note) => {
      const path = typeof note?.file_path === "string" ? note.file_path : null;
      if (!path) return;
      const fileName = typeof note?.file_name === "string" ? note.file_name : path.split("/").pop();
      const basename = (fileName || path).replace(/\.md$/i, "");
      const title = typeof note?.title === "string" ? note.title : "";
      items.push({
        path,
        basename,
        basenameLower: basename.toLowerCase(),
        pathLower: path.toLowerCase(),
        search: `${basename} ${path} ${title}`.toLowerCase(),
      });
    });
    return items.sort((a, b) => a.basename.localeCompare(b.basename, "zh-CN", { numeric: true, sensitivity: "base" }));
  }

  async loadEvaNoteIndex() {
    const candidates = EVA_NOTES_CANDIDATE_PATHS.slice();
    const seen = new Set();
    const itemsByPath = new Map();
    const loadedPaths = [];
    for (const candidate of candidates) {
      const normalized = text(candidate);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      try {
        if (!await this.app.vault.adapter.exists(normalized)) continue;
        const parsed = JSON.parse(await this.app.vault.adapter.read(normalized));
        if (parsed?.notes && typeof parsed.notes === "object") {
          const items = this.buildVaultIndexFromEvaNotes(parsed.notes);
          if (items.length > 0) {
            loadedPaths.push(normalized);
            items.forEach((item) => {
              const key = text(item.path).toLowerCase();
              if (key && !itemsByPath.has(key)) itemsByPath.set(key, item);
            });
          }
        }
      } catch (error) {
        console.warn("[ProjectOverview][eva-notes.load-failed]", { path: normalized, error });
      }
    }
    const items = Array.from(itemsByPath.values())
      .sort((a, b) => a.basename.localeCompare(b.basename, "zh-CN", { numeric: true, sensitivity: "base" }));
    return items.length > 0 ? { path: loadedPaths.join(";"), items } : null;
  }

  async getVaultNoteIndex() {
    const cache = this.vaultNoteIndexCache || { items: [], builtAt: 0, source: "none" };
    const now = Date.now();
    if (cache.items.length > 0 && (now - cache.builtAt) <= 30000) return cache.items;
    const eva = await this.loadEvaNoteIndex();
    if (eva?.items?.length > 0) {
      this.vaultNoteIndexCache = { items: eva.items, builtAt: now, source: "eva", sourcePath: eva.path };
      return eva.items;
    }
    const items = this.buildVaultIndexFromFiles(this.app.vault.getMarkdownFiles());
    this.vaultNoteIndexCache = { items, builtAt: now, source: "vault" };
    return items;
  }

  resolveExistingNoteFile(rawPath) {
    const clean = text(rawPath).replace(/\\/g, "/").replace(/^\/+/, "");
    if (!clean) return null;
    const noExt = clean.replace(/\.md$/i, "");
    const withExt = clean.endsWith(".md") ? clean : `${clean}.md`;
    const sourcePath = "";
    const hit = this.app.vault.getAbstractFileByPath(clean)
      || this.app.vault.getAbstractFileByPath(withExt)
      || this.app.metadataCache.getFirstLinkpathDest(clean, sourcePath)
      || this.app.metadataCache.getFirstLinkpathDest(noExt, sourcePath)
      || this.app.metadataCache.getFirstLinkpathDest(noExt.split("/").pop() || noExt, sourcePath)
      || this.app.vault.getMarkdownFiles().find((file) => file.basename.toLowerCase() === (noExt.split("/").pop() || noExt).toLowerCase())
      || null;
    return hit?.extension === "md" ? hit : null;
  }

  resolveKeywordBoundFileResult(binding) {
    if (!binding) return { file: null, binding: null, repairedByCtime: false, matchCount: 0 };
    const path = typeof binding === "string" ? text(binding) : text(binding.path);
    const ctime = typeof binding === "object" && Number.isFinite(Number(binding.ctime)) ? Number(binding.ctime) : null;
    if (!path && !Number.isFinite(ctime)) return { file: null, binding: null, repairedByCtime: false, matchCount: 0 };
    const normalizedBinding = { path, ctime };
    const direct = path ? this.resolveExistingNoteFile(path) : null;
    if (direct) return { file: direct, binding: normalizedBinding, repairedByCtime: false, matchCount: 1 };
    if (!Number.isFinite(ctime)) return { file: null, binding: normalizedBinding, repairedByCtime: false, matchCount: 0 };
    const matches = this.app.vault.getMarkdownFiles().filter((file) => Number(file?.stat?.ctime) === Number(ctime));
    if (matches.length === 1) return { file: matches[0], binding: normalizedBinding, repairedByCtime: true, matchCount: 1 };
    return { file: null, binding: normalizedBinding, repairedByCtime: false, matchCount: matches.length };
  }

  findOpenRootLeafForFile(file) {
    if (!file?.path || typeof this.app.workspace.iterateRootLeaves !== "function") return null;
    let found = null;
    this.app.workspace.iterateRootLeaves((leaf) => {
      if (found) return;
      if (leaf?.view?.file?.path === file.path) found = leaf;
    });
    return found;
  }

  getRightmostRootLeaf() {
    if (typeof this.app.workspace.iterateRootLeaves !== "function") return null;
    let rightmost = null;
    this.app.workspace.iterateRootLeaves((leaf) => {
      rightmost = leaf || rightmost;
    });
    return rightmost;
  }

  activateLeaf(leaf, focus = false) {
    if (!leaf || typeof this.app.workspace.setActiveLeaf !== "function") return false;
    try {
      this.app.workspace.setActiveLeaf(leaf, { focus });
      return true;
    } catch (error) {
      try {
        this.app.workspace.setActiveLeaf(leaf, focus);
        return true;
      } catch (innerError) {
        console.warn("[ProjectOverview][leaf.activate-failed]", { error: innerError || error });
      }
    }
    return false;
  }

  async openFileInRightmostRootLeaf(file) {
    const existingLeaf = this.findOpenRootLeafForFile(file);
    if (existingLeaf) {
      this.activateLeaf(existingLeaf, true);
      return true;
    }
    const rightmostLeaf = this.getRightmostRootLeaf();
    if (rightmostLeaf) this.activateLeaf(rightmostLeaf, false);
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file, { active: true });
    return true;
  }

  async openKeywordBoundNote(nodeKey, binding) {
    const result = this.resolveKeywordBoundFileResult(binding);
    if (!result.file) {
      new Notice("未找到绑定笔记，请重新绑定。");
      console.warn("[ProjectOverview][keyword-note-binding.open-missing]", { nodeKey, binding: result.binding, matchCount: result.matchCount });
      return false;
    }
    if (result.repairedByCtime) {
      await this.setKeywordNoteBinding(nodeKey, {
        path: result.file.path,
        ctime: Number(result.file?.stat?.ctime) || Number(result.binding?.ctime) || null,
      });
      new Notice("已自动修复 Keyword 绑定笔记路径");
    }
    await this.openFileInRightmostRootLeaf(result.file);
    console.info("[ProjectOverview][keyword-note-binding.open]", { nodeKey: text(nodeKey), path: result.file.path, repairedByCtime: !!result.repairedByCtime });
    return true;
  }

  async openKeywordNoteBindingEditor(item) {
    if (!item?.nodeKey || item.columnId !== "keyword") return false;
    const currentBinding = this.getKeywordNoteBinding(item.nodeKey);
    const currentValue = text(currentBinding?.path);
    const modal = new ProjectOverviewNoteBindingModal(this.app, {
      title: "Keyword 绑定笔记",
      label: item.label || item.nodeKey,
      value: currentValue,
      currentLabel: currentValue,
      noteIndex: await this.getVaultNoteIndex(),
      onOpenCurrent: async () => {
        if (currentBinding) await this.openKeywordBoundNote(item.nodeKey, currentBinding);
      },
    });
    const result = await modal.waitForResult();
    if (!result) return false;
    if (result.action === "clear") {
      await this.setKeywordNoteBinding(item.nodeKey, null);
      await this.refreshViews({ preserveScroll: true, reason: "keyword-note-binding-clear" });
      return true;
    }
    if (result.action !== "save") return false;
    const file = this.resolveExistingNoteFile(result.value);
    if (!file) {
      new Notice("没有找到这个 Obsidian 笔记，请输入库内真实路径或文件名。");
      return false;
    }
    await this.setKeywordNoteBinding(item.nodeKey, { path: file.path, ctime: Number(file?.stat?.ctime) || null });
    await this.refreshViews({ preserveScroll: true, reason: "keyword-note-binding-save" });
    new Notice(`已绑定笔记：${file.basename || file.path}`);
    return true;
  }

  getKeywordNoteBindingDisplay(binding) {
    const result = this.resolveKeywordBoundFileResult(binding);
    if (result.file) return {
      title: result.file.basename || result.file.name || result.file.path,
      path: result.file.path,
    };
    const path = text(binding?.path || binding);
    return {
      title: path ? path.split("/").pop()?.replace(/\.md$/i, "") || path : "",
      path,
    };
  }

  buildCommentSourceInfo(item = {}) {
    return [
      { label: "来源视图", value: text(item.viewLabel || item.viewType) },
      { label: "来源路径", value: text(item.pathLabel || item.notePath) },
      { label: "Note 路径", value: text(item.notePath) },
      { label: "EVA nodeKey", value: text(item.nodeKey) },
    ].filter((entry) => entry.value);
  }
  async openCommentEditor(item) {
    if (!item?.nodeKey) return false;
    const previousComment = this.getComment(item.nodeKey);
    const renameManager = this.getContextKeyRenameManager();
    let draft;
    try { draft = renameManager.draft(item.nodeKey, "comment"); }
    catch (error) { new Notice(error.message); return false; }
    if (draft !== null) new Notice("已恢复本项目评论草稿，请与当前主键名称核对后保存。");
    const modal = new ProjectOverviewCommentModal(this.app, {
      title: "项目总览评论",
      label: item.label || item.nodeKey,
      value: draft ?? previousComment,
      onDraft: value => renameManager.draft(item.nodeKey, "comment", value),
      sourceInfo: this.buildCommentSourceInfo(item),
      keywordNoteBinding: null,
      isLive: () => !this.contextCarrierUnloading && !renameManager.closed && this.app.plugins.plugins[this.manifest.id] === this,
      onSubmit: async (result, alive, submittedDraft) => {
        const need = () => { if (!alive()) throw Error("comment-editor-closed"); };
        need();
        let committed = false;
        try {
          const nextComment = result.action === "clear" ? "" : String(result.value || "");
          if (nextComment.trim() !== previousComment) {
            const rename = result.action === "clear" ? null : await this.detectContextCapsuleKeyRenameForItem(item, previousComment, nextComment);
            need();
            await this.setComment(item.nodeKey, nextComment, { expectedComment: previousComment });
            committed = true;
            need();
            this.invalidateGlobalKeywordNavCache("comment-editor-save");
            if (rename) { await this.maybePropagateContextCapsuleKeyRename({ ...rename, primaryNodeKey: item.nodeKey }); need(); }
            else if (result.action === "save") {
              const labels = extractGroupKeywordsFromComment(nextComment).map(normalizeContextCapsuleDisplayLabel).filter(Boolean);
              if (labels.length === 1) { await this.maybeRepairContextCapsuleKeyConsumers(labels[0], item.nodeKey); need(); }
            }
          } else committed = true;
          need();
          await this.refreshViews({ preserveScroll: true, reason: "comment-editor" });
          need();
          if (renameManager.draft(item.nodeKey, "comment") === submittedDraft) renameManager.draft(item.nodeKey, "comment", null);
          return { saved: true };
        } catch (error) {
          if (!committed) throw error;
          return { saved: true, warning: "评论已保存，但后续同步、刷新或草稿清理未完成。请关闭后在管理中心核验同步；不要重复提交。原因：" + String(error?.message || error) };
        }
      },
    });
    const result = await modal.waitForResult();
    return !!result?.saved;
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  async refreshViews(options = {}) {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)) {
      await leaf.view?.refresh?.(options);
    }
  }

  getActiveOverviewView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW) || [];
    return leaves.map((leaf) => leaf.view).find((view) => view instanceof ProjectExecutionOverviewView && view.model) || null;
  }

  resolveGroupAiContextSource(groupOrId, options = {}) {
    const view = options.view instanceof ProjectExecutionOverviewView ? options.view : this.getActiveOverviewView();
    const model = view?.model || null;
    if (!model || !Array.isArray(model.groups)) return { view, model: null, group: null };
    const groupId = text(groupOrId && typeof groupOrId === "object" ? groupOrId.id : groupOrId);
    const requestedRoot = groupOrId && typeof groupOrId === "object" ? text(groupOrId.primaryNodeKey) : "";
    const group = view.getSortedGroupsForCurrentView().find((entry) => (!requestedRoot || entry.primaryNodeKeys?.includes(requestedRoot) || entry.primaryNodeKey === requestedRoot) && (text(entry?.id) === groupId || text(entry?.primaryNodeKey) === groupId || text(entry?.title) === groupId)) || null;
    return { view, model, group };
  }

  async collectMandalaAiContextForGroup(group = {}, model = {}, limits = AI_CONTEXT_LIMITS) {
    const api = this.getMandalaTimeBlocksApi();
    const result = {
      hasApi: !!api,
      workspaceNodeKey: "",
      mandalaNodeId: "",
      weeklyProjectPlan: null,
      projectPlanRow: null,
      workspaceWeeklyRows: [],
      mandalaWeeklyRows: [],
      diagnostics: [],
    };
    if (!api) {
      result.diagnostics.push("mandala_api_unavailable");
      return result;
    }
    const workspacePrimaryItem = group.primaryColumnId === "workspace"
      ? model.itemsByKey?.[group.primaryNodeKey]
      : (Array.isArray(group.columns?.workspace) ? group.columns.workspace.find((item) => item?.nodeKey) : null);
    const mandalaPrimaryItem = group.primaryColumnId === "mandala"
      ? model.itemsByKey?.[group.primaryNodeKey]
      : (Array.isArray(group.columns?.mandala) ? group.columns.mandala.find((item) => item?.nodeKey) : null);
    result.workspaceNodeKey = text(workspacePrimaryItem?.nodeKey || (group.primaryColumnId === "workspace" ? group.primaryNodeKey : ""));
    const parsedMandala = parseJumpNodeKey(mandalaPrimaryItem?.nodeKey);
    result.mandalaNodeId = text(parsedMandala?.itemId || mandalaPrimaryItem?.nodeKey || (group.primaryColumnId === "mandala" ? group.primaryNodeKey : ""));

    if (typeof api.getWeeklyProjectPlan === "function") {
      try {
        result.weeklyProjectPlan = await api.getWeeklyProjectPlan();
      } catch (error) {
        result.diagnostics.push("mandala_weekly_project_plan_read_failed");
        console.warn("[ProjectOverview][ai-context.mandala-weekly-project-plan-failed]", error);
      }
    } else {
      result.diagnostics.push("mandala_weekly_project_plan_api_missing");
    }

    if (result.workspaceNodeKey && typeof api.listProjectPlanWorkspaceRows === "function") {
      try {
        const rows = await api.listProjectPlanWorkspaceRows();
        result.projectPlanRow = (Array.isArray(rows) ? rows : [])
          .find((row) => text(row?.nodeId) === result.workspaceNodeKey) || null;
      } catch (error) {
        result.diagnostics.push("mandala_project_plan_read_failed");
        console.warn("[ProjectOverview][ai-context.mandala-project-plan-failed]", error);
      }
    } else if (result.workspaceNodeKey) {
      result.diagnostics.push("mandala_project_plan_api_missing");
    }

    if (result.workspaceNodeKey && typeof api.listWorkspaceWeeklyGoalRows === "function") {
      try {
        const rows = await api.listWorkspaceWeeklyGoalRows({ nodeId: result.workspaceNodeKey });
        result.workspaceWeeklyRows = (Array.isArray(rows) ? rows : [])
          .filter((row) => text(row?.thisWeekGoal) || text(row?.completion) || text(row?.blockers) || text(row?.reflection) || (Array.isArray(row?.nextThree) && row.nextThree.some((item) => text(item))))
          .sort((a, b) => text(b?.weekId).localeCompare(text(a?.weekId), "zh-CN", { numeric: true, sensitivity: "base" }))
          .slice(0, limits.maxMandalaRows);
      } catch (error) {
        result.diagnostics.push("mandala_workspace_weekly_read_failed");
        console.warn("[ProjectOverview][ai-context.mandala-workspace-weekly-failed]", error);
      }
    } else if (result.workspaceNodeKey) {
      result.diagnostics.push("mandala_workspace_weekly_api_missing");
    }

    if (result.mandalaNodeId && typeof api.listWeeklyGoalRows === "function") {
      try {
        const rows = await api.listWeeklyGoalRows({ nodeId: result.mandalaNodeId });
        result.mandalaWeeklyRows = (Array.isArray(rows) ? rows : [])
          .filter((row) => text(row?.thisWeekGoal) || text(row?.completion) || text(row?.blockers) || text(row?.reflection) || (Array.isArray(row?.nextThree) && row.nextThree.some((item) => text(item))))
          .sort((a, b) => text(b?.weekId).localeCompare(text(a?.weekId), "zh-CN", { numeric: true, sensitivity: "base" }))
          .slice(0, limits.maxMandalaRows);
      } catch (error) {
        result.diagnostics.push("mandala_goal_weekly_read_failed");
        console.warn("[ProjectOverview][ai-context.mandala-goal-weekly-failed]", error);
      }
    } else if (result.mandalaNodeId) {
      result.diagnostics.push("mandala_goal_weekly_api_missing");
    }

    return result;
  }

  async collectGroupAiContextShards(group = {}, model = {}, limits = AI_CONTEXT_LIMITS, options = {}) {
    const settleShard = (name, run) => Promise.resolve()
      .then(run)
      .then((value) => ({ name, value }))
      .catch((error) => {
        if (error && typeof error === "object") error.aiContextShardName = name;
        throw error;
      });
    const groupItemKeys = new Set(Array.isArray(group.itemKeys) ? group.itemKeys : []);
    const tasks = [
      settleShard("primary", () => ({
        primaryItem: model.itemsByKey?.[group.primaryNodeKey] || null,
        primaryComment: this.getComment(group.primaryNodeKey),
      })),
      settleShard("columnEvidence", () => {
        const diagnostics = [];
        const columns = COLUMN_DEFS.map((column) => {
          const items = Array.isArray(group.columns?.[column.id]) ? group.columns[column.id] : [];
          if (items.length > limits.maxItemsPerColumn) diagnostics.push(`${column.id}_items_truncated:${items.length}->${limits.maxItemsPerColumn}`);
          return { column, items };
        });
        return { columns, diagnostics };
      }),
      settleShard("relations", () => {
        const edges = Object.values(model.edgesById || {})
          .filter((edge) => groupItemKeys.has(edge.sourceNodeKey) && groupItemKeys.has(edge.targetNodeKey));
        const diagnostics = edges.length > limits.maxRelations
          ? [`relations_truncated:${edges.length}->${limits.maxRelations}`]
          : [];
        return { edges, diagnostics };
      }),
      settleShard("mandala", async () => await this.collectMandalaAiContextForGroup(group, model, limits)),
      settleShard("contextCapsuleKey", () => {
        const items = Object.values(model.itemsByKey || {});
        const keywordAttachmentCount = items.reduce((count, item) => count + (Array.isArray(item?.keywordNotes) ? item.keywordNotes.length : 0), 0);
        const workspaceBoundNoteCount = items.filter((item) => item?.workspaceBoundNote?.path).length;
        return {
          cacheState: this.globalKeywordNavCache ? "available" : "unavailable",
          keywordAttachmentCount,
          workspaceBoundNoteCount,
        };
      }),
    ];
    const settled = await Promise.allSettled(tasks);
    const diagnostics = [];
    const shardStatuses = [];
    const values = {};
    settled.forEach((entry) => {
      if (entry.status === "fulfilled") {
        const { name, value } = entry.value || {};
        if (name) {
          values[name] = value;
          shardStatuses.push(`${name}:ok`);
        }
        if (Array.isArray(value?.diagnostics) && value.diagnostics.length) diagnostics.push(...value.diagnostics);
      } else {
        const name = text(entry.reason?.aiContextShardName || entry.reason?.name || "unknown");
        shardStatuses.push(`${name}:failed`);
        diagnostics.push(`ai_context_shard_failed:${name}`);
        console.warn("[ProjectOverview][ai-context.shard-failed]", entry.reason);
      }
    });
    return {
      primaryItem: values.primary?.primaryItem || null,
      primaryComment: text(values.primary?.primaryComment || ""),
      columns: Array.isArray(values.columnEvidence?.columns) ? values.columnEvidence.columns : [],
      groupEdges: Array.isArray(values.relations?.edges) ? values.relations.edges : [],
      mandalaContext: values.mandala || {
        hasApi: false,
        workspaceNodeKey: "",
        mandalaNodeId: "",
        weeklyProjectPlan: null,
        projectPlanRow: null,
        workspaceWeeklyRows: [],
        mandalaWeeklyRows: [],
        diagnostics: ["mandala_shard_unavailable"],
      },
      contextCapsuleKey: values.contextCapsuleKey || {},
      diagnostics,
      shardStatuses,
    };
  }

  async buildGroupAiContextMarkdown(groupOrId, options = {}) {
    const { model, group } = this.resolveGroupAiContextSource(groupOrId, options);
    if (!model || !group) return null;
    const limits = Object.assign({}, AI_CONTEXT_LIMITS, options.limits || {});
    const diagnostics = [];
    const lines = [];
    const modeDef = GROUPING_MODES.find((item) => item.id === group.mode) || { label: group.mode };
    const shards = await this.collectGroupAiContextShards(group, model, limits, options);
    const primaryItem = shards.primaryItem;
    const primaryComment = shards.primaryComment;
    const groupEdges = shards.groupEdges;
    const mandalaContext = shards.mandalaContext;
    const contextCapsuleKey = shards.contextCapsuleKey;
    const lifecycle = this.getPrimaryGroupLifecycleState(group);
    diagnostics.push(...shards.diagnostics);

    lines.push(`# Project Overview AI Context`);
    lines.push("");
    lines.push(`- export_version: ${AI_CONTEXT_EXPORT_VERSION}`);
    lines.push(`- generated_at: ${nowString()}`);
    lines.push(`- source_plugin: project-execution-overview`);
    lines.push(`- mode: ${markdownInline(group.mode)} (${markdownInline(modeDef.label)})`);
    lines.push(`- group_title: ${markdownInline(group.title)}`);
    lines.push(`- group_id: ${markdownInline(group.id)}`);
    lines.push(`- primary_column: ${markdownInline(group.primaryColumnId)}`);
    lines.push(`- primary_node_key: ${markdownInline(group.primaryNodeKey)}`);
    lines.push(`- legacy_kill_diagnostic_only: ${markdownInline(lifecycle.status === "all" ? "killed" : lifecycle.status)}`);
    lines.push(`- item_count: ${Number(group.itemCount || 0)}`);
    lines.push(`- relation_count: ${Number(group.edgeCount || 0)}`);
    if (shards.shardStatuses.length) lines.push(`- export_shards: ${markdownInline(shards.shardStatuses.join("; "))}`);
    if (contextCapsuleKey.cacheState) lines.push(`- source_cache: ${markdownInline(`context_capsule_key=${contextCapsuleKey.cacheState}; keyword_notes=${Number(contextCapsuleKey.keywordAttachmentCount || 0)}; workspace_bound_notes=${Number(contextCapsuleKey.workspaceBoundNoteCount || 0)}`)}`);
    if (model.diagnostics?.length) lines.push(`- model_diagnostics: ${markdownInline(model.diagnostics.map((item) => `${item.code}:${item.limit ?? ""}`).join("; "))}`);
    lines.push("");

    lines.push(`## Column Semantics`);
    lines.push("");
    [
      ["Workspace", "执行锚点 / workspace primary item"],
      ["九宫格", "目标或设计锚点"],
      ["Keyword", "索引入口符号 / 编号树位置"],
      ["范式积累", "普通 note、调查事实、工作环境、知识资产"],
      ["GTD", "启发式下一步 / 自我提示"],
      ["Collection Card", "由前序上下文派生的待办"],
      ["Timeline", "日期和阶段序列证据"],
    ].forEach(([name, meaning]) => lines.push(`- ${name}: ${meaning}`));
    lines.push("");

    lines.push(`## Primary`);
    lines.push("");
    lines.push(`| field | value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| label | ${markdownInline(primaryItem?.label || group.title)} |`);
    lines.push(`| viewType | ${markdownInline(primaryItem?.viewType)} |`);
    lines.push(`| viewLabel | ${markdownInline(primaryItem?.viewLabel)} |`);
    lines.push(`| pathLabel | ${markdownInline(primaryItem?.pathLabel)} |`);
    lines.push(`| notePath | ${markdownInline(primaryItem?.notePath)} |`);
    if (primaryItem?.workspaceBoundNote?.path) lines.push(`| workspaceBoundNote | ${markdownInline(primaryItem.workspaceBoundNote.path)} |`);
    if (primaryItem?.keywordNotes?.length) lines.push(`| keywordNotes | ${markdownInline(primaryItem.keywordNotes.map((note) => note.path).join("; "))} |`);
    lines.push("");
    if (primaryComment) {
      lines.push(`### Primary Comment`);
      lines.push("");
      lines.push(markdownBlock(primaryComment, 2400));
      lines.push("");
    }

    lines.push(`## Evidence By Column`);
    lines.push("");
    shards.columns.forEach(({ column, items }) => {
      lines.push(`### ${column.label} (${items.length})`);
      lines.push("");
      if (items.length === 0) {
        lines.push(`- none`);
        lines.push("");
        return;
      }
      lines.push(`| label | nodeKey | viewType | path / note | relations | attachments |`);
      lines.push(`| --- | --- | --- | --- | --- | --- |`);
      items.slice(0, limits.maxItemsPerColumn).forEach((item) => {
        const attachments = [];
        if (item.workspaceBoundNote?.path) attachments.push(`workspaceBoundNote=${item.workspaceBoundNote.path}`);
        if (Array.isArray(item.keywordNotes) && item.keywordNotes.length) attachments.push(`keywordNotes=${item.keywordNotes.map((note) => note.path).join("; ")}`);
        const relationSummary = `out:${Number(item.outgoingCount || 0)} in:${Number(item.incomingCount || 0)}`;
        lines.push(`| ${markdownInline(item.label || item.nodeKey)} | ${markdownInline(item.nodeKey)} | ${markdownInline(item.viewType || item.viewLabel || item.columnId)} | ${markdownInline(item.notePath || item.pathLabel)} | ${markdownInline(relationSummary)} | ${markdownInline(attachments.join("; "))} |`);
      });
      lines.push("");
    });

    lines.push(`## Mandala Project Tracking`);
    lines.push("");
    lines.push(`- api_available: ${mandalaContext.hasApi ? "true" : "false"}`);
    lines.push(`- workspace_node_key: ${markdownInline(mandalaContext.workspaceNodeKey)}`);
    lines.push(`- mandala_node_id: ${markdownInline(mandalaContext.mandalaNodeId)}`);
    lines.push("");
    if (mandalaContext.weeklyProjectPlan) {
      lines.push(`### Weekly Project Plan`);
      lines.push("");
      lines.push(`| field | value |`);
      lines.push(`| --- | --- |`);
      lines.push(`| week | ${markdownInline(mandalaContext.weeklyProjectPlan.weekLabel || mandalaContext.weeklyProjectPlan.weekId)} |`);
      lines.push(`| thisWeekPlan | ${markdownInline(mandalaContext.weeklyProjectPlan.thisWeekPlan)} |`);
      lines.push(`| execution | ${markdownInline(mandalaContext.weeklyProjectPlan.execution)} |`);
      lines.push(`| nextWeekPlan | ${markdownInline(mandalaContext.weeklyProjectPlan.nextWeekPlan)} |`);
      lines.push(`| updatedAt | ${markdownInline(mandalaContext.weeklyProjectPlan.updatedAt)} |`);
      lines.push("");
    } else {
      lines.push(`### Weekly Project Plan`);
      lines.push("");
      lines.push(`- none`);
      lines.push("");
    }
    if (mandalaContext.projectPlanRow) {
      lines.push(`### Workspace Project Plan`);
      lines.push("");
      lines.push(`| field | value |`);
      lines.push(`| --- | --- |`);
      lines.push(`| finalVision | ${markdownInline(mandalaContext.projectPlanRow.finalVision)} |`);
      lines.push(`| valueDirection | ${markdownInline(projectMandalaImageFieldForAi(mandalaContext.projectPlanRow.valueDirection))} |`);
      lines.push(`| currentReality | ${markdownInline(mandalaContext.projectPlanRow.currentReality)} |`);
      lines.push(`| nextAction | ${markdownInline(mandalaContext.projectPlanRow.nextAction)} |`);
      lines.push(`| milestone | ${markdownInline(mandalaContext.projectPlanRow.milestone)} |`);
      lines.push(`| updatedAt | ${markdownInline(mandalaContext.projectPlanRow.updatedAt)} |`);
      lines.push("");
    } else {
      lines.push(`### Workspace Project Plan`);
      lines.push("");
      lines.push(`- none`);
      lines.push("");
    }
    lines.push(`### Workspace Weekly Tracking (${mandalaContext.workspaceWeeklyRows.length})`);
    lines.push("");
    if (mandalaContext.workspaceWeeklyRows.length) {
      lines.push(`| week | thisWeekGoal | completion | blockers | nextThree | reflection |`);
      lines.push(`| --- | --- | --- | --- | --- | --- |`);
      mandalaContext.workspaceWeeklyRows.forEach((row) => {
        const nextThree = Array.isArray(row.nextThree) ? row.nextThree.filter((item) => text(item)).join("; ") : "";
        lines.push(`| ${markdownInline(row.weekLabel || row.weekId)} | ${markdownInline(row.thisWeekGoal)} | ${markdownInline(row.completion)} | ${markdownInline(row.blockers)} | ${markdownInline(nextThree)} | ${markdownInline(row.reflection)} |`);
      });
    } else {
      lines.push(`- none`);
    }
    lines.push("");
    lines.push(`### Mandala Goal Weekly Tracking (${mandalaContext.mandalaWeeklyRows.length})`);
    lines.push("");
    if (mandalaContext.mandalaWeeklyRows.length) {
      lines.push(`| week | thisWeekGoal | completion | blockers | nextThree | reflection |`);
      lines.push(`| --- | --- | --- | --- | --- | --- |`);
      mandalaContext.mandalaWeeklyRows.forEach((row) => {
        const nextThree = Array.isArray(row.nextThree) ? row.nextThree.filter((item) => text(item)).join("; ") : "";
        lines.push(`| ${markdownInline(row.weekLabel || row.weekId)} | ${markdownInline(row.thisWeekGoal)} | ${markdownInline(row.completion)} | ${markdownInline(row.blockers)} | ${markdownInline(nextThree)} | ${markdownInline(row.reflection)} |`);
      });
    } else {
      lines.push(`- none`);
    }
    lines.push("");

    lines.push(`## Relations In Group`);
    lines.push("");
    if (groupEdges.length === 0) {
      lines.push(`- none`);
    } else {
      lines.push(`| source | relation | target |`);
      lines.push(`| --- | --- | --- |`);
      groupEdges.slice(0, limits.maxRelations).forEach((edge) => {
        const source = model.itemsByKey?.[edge.sourceNodeKey];
        const target = model.itemsByKey?.[edge.targetNodeKey];
        lines.push(`| ${markdownInline(source?.label || edge.sourceNodeKey)} | ${markdownInline(edge.label || edge.kind || "关联")} | ${markdownInline(target?.label || edge.targetNodeKey)} |`);
      });
    }
    lines.push("");
    lines.push(`## Coach Use`);
    lines.push("");
    lines.push(`Read this packet as a read-only evidence ledger. Preserve column semantics, mark uncertain inferences, and suggest one to three visible next progress units.`);

    let output = lines.join("\n");
    if (diagnostics.length && !output.includes("- export_diagnostics:")) {
      output = output.replace(`- relation_count: ${Number(group.edgeCount || 0)}`, `- relation_count: ${Number(group.edgeCount || 0)}\n- export_diagnostics: ${markdownInline(diagnostics.join("; "))}`);
    }
    if (output.length > limits.maxChars) {
      output = `${output.slice(0, limits.maxChars).trim()}\n\n[AI context truncated at ${limits.maxChars} chars]`;
    }
    return output;
  }

  async copyGroupAiContext(groupOrId, options = {}) {
    const markdown = await this.buildGroupAiContextMarkdown(groupOrId, options);
    if (!markdown) {
      new Notice("当前项目组证据包不可用：请先打开项目执行总览视图。");
      console.warn("[ProjectOverview][ai-context.copy-unavailable]", { groupOrId: text(groupOrId?.id || groupOrId) });
      return false;
    }
    const ok = await this.writeTextToClipboard(markdown);
    if (ok) {
      new Notice(`已复制 AI 项目证据包（${markdown.length} 字符）`);
      console.info("[ProjectOverview][ai-context.copy]", { chars: markdown.length, group: text(groupOrId?.title || groupOrId?.id || groupOrId) });
      return true;
    }
    new Notice("复制 AI 项目证据包失败，请查看 console。");
    console.warn("[ProjectOverview][ai-context.copy-failed]", { chars: markdown.length });
    return false;
  }

  async writeTextToClipboard(value) {
    const payload = text(value);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        return true;
      }
    } catch (error) {
      console.warn("[ProjectOverview][clipboard.navigator-failed]", error);
    }
    let textarea = null;
    try {
      textarea = document.createElement("textarea");
      textarea.value = payload;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand?.("copy") === true;
      return ok;
    } catch (error) {
      console.warn("[ProjectOverview][clipboard.fallback-failed]", error);
      return false;
    } finally {
      textarea?.remove?.();
    }
  }

  getEva() {
    return getEvaApi(this.app);
  }

  async getEvaForRead() {
    const api = this.getEva();
    if (api?.searchNodes && api?.getNodeRelationSnapshot) return api;
    try {
      const state = await this.loadEvaStateFallback();
      if (state) return makeStaticEvaFacade(state);
    } catch (error) {
      console.warn("[ProjectOverview][eva.fallback-failed]", error);
    }
    return api;
  }

  getKeywordIndexApi() {
    return window.__keywordIndexPluginApi
      || this.app?.plugins?.plugins?.["keyword-index-plugin"]?.api
      || null;
  }

  getWorkspaceMountApi() {
    return window.__workspaceMountPluginApi
      || this.app?.plugins?.plugins?.["workspace-mount"]?.globalApi
      || null;
  }

  getCollectionCardApi() {
    return window.__collectionCardViewPluginApi
      || this.app?.plugins?.plugins?.["collection-card-view"]?.globalApi
      || null;
  }

  getGtdTaskManagerApi() {
    return window.__gtdTaskManagerPluginApi
      || this.app?.plugins?.plugins?.["gtd-task-manager"]?.globalApi
      || null;
  }

  getMandalaTimeBlocksApi() {
    return window.__mandalaTimeBlocksPluginApi
      || this.app?.plugins?.plugins?.["mandala-time-blocks"]?.globalApi
      || this.app?.plugins?.plugins?.["mandala-time-blocks"]?.api
      || null;
  }

  getTimelinePlannerApi() {
    return window.__timelinePlannerPluginApi
      || this.app?.plugins?.plugins?.[TIMELINE_PLANNER_PLUGIN_ID]?.globalApi
      || this.app?.plugins?.plugins?.[TIMELINE_PLANNER_PLUGIN_ID]?.api
      || null;
  }

  getTimelineProjectionGroupIdentity(group = {}, model = {}, mode = DEFAULT_SETTINGS.groupingMode) {
    const normalizedMode = normalizeGroupingMode(mode);
    const identities = [];
    (Array.isArray(group.primaryNodeKeys) ? group.primaryNodeKeys : [group.primaryNodeKey]).forEach((nodeKey) => {
      const item = model.itemsByKey?.[nodeKey] || null;
      if (normalizedMode === "workspace") {
        const exactKey = text(item?.nodeKey || nodeKey);
        if (exactKey) identities.push(exactKey);
        return;
      }
      const parsed = parseJumpNodeKey(item?.nodeKey || nodeKey);
      const goalId = text(parsed?.itemId || item?.entityId);
      if (goalId) identities.push(goalId);
    });
    return Array.from(new Set(identities));
  }

  async attachTimelineMilestoneProjectionToGroups(model, groupingMode = DEFAULT_SETTINGS.groupingMode) {
    const mode = normalizeGroupingMode(groupingMode);
    const sourceType = mode === "mandala" ? "goal" : "project";
    const api = this.getTimelinePlannerApi();
    if (typeof api?.getPlanningMilestoneSnapshot !== "function") {
      model.diagnostics.push({ code: "timeline-milestones.provider-unavailable", limit: 0 });
      return model;
    }
    let snapshot = null;
    try {
      snapshot = await api.getPlanningMilestoneSnapshot({
        sourceTypes: [sourceType],
        limit: TIMELINE_MILESTONE_PROJECTION_LIMIT,
      });
    } catch (error) {
      model.diagnostics.push({ code: "timeline-milestones.provider-rejected", limit: 0 });
      console.warn("[ProjectOverview][timeline-milestones.snapshot-failed]", error);
      return model;
    }
    if (snapshot?.ok !== true || !Array.isArray(snapshot?.items)) {
      model.diagnostics.push({
        code: snapshot?.ok === false ? "timeline-milestones.provider-not-ok" : "timeline-milestones.items-invalid",
        limit: 0,
      });
      return model;
    }
    const groupsByIdentity = new Map();
    (Array.isArray(model.groups) ? model.groups : []).forEach((group) => {
      this.getTimelineProjectionGroupIdentity(group, model, mode).forEach((identity) => {
        if (!groupsByIdentity.has(identity)) groupsByIdentity.set(identity, []);
        groupsByIdentity.get(identity).push(group);
      });
    });
    let attachedCount = 0;
    let duplicateCount = 0;
    let ambiguousIdentityCount = 0;
    let unmatchedCount = 0;
    snapshot.items.slice().sort(compareTimelineMilestoneProjectionItems).forEach((milestone) => {
      const stableSourceKey = text(milestone.sourceKey || milestone.sourceId);
      const matchedGroups = groupsByIdentity.get(stableSourceKey) || [];
      if (matchedGroups.length !== 1) {
        if (matchedGroups.length > 1) ambiguousIdentityCount += 1;
        else unmatchedCount += 1;
        return;
      }
      const timelineItemId = text(milestone.timelineItemId || milestone.itemId);
      const milestoneId = text(milestone.milestoneId || milestone.id);
      if (!timelineItemId || !milestoneId) return;
      const group = matchedGroups[0];
      const timelineItems = Array.isArray(group.columns?.timeline) ? group.columns.timeline : [];
      const virtualIdentity = `${timelineItemId}::${milestoneId}`;
      if (timelineItems.some((item) => text(item.timelineMilestoneIdentity) === virtualIdentity)) {
        duplicateCount += 1;
        return;
      }
      const parentItem = timelineItems.find((item) => !isTimelineMilestoneProjectionItem(item) && resolveTimelineItemId(item) === timelineItemId) || null;
      const milestoneScheduleLabel = [
        text(milestone.date),
        text(milestone.weekdayLabel),
        text(milestone.timeBlockLabel, "未安排时段"),
        text(milestone.timeBlockRange),
      ].filter(Boolean).join(" · ");
      const virtualItem = {
        nodeKey: `virtual:timeline-milestone:${encodeURIComponent(timelineItemId)}:${encodeURIComponent(milestoneId)}`,
        label: text(milestone.milestoneName || milestone.name, "未命名里程碑"),
        viewType: "timeline-milestone-projection",
        columnId: "timeline",
        sourcePlugin: TIMELINE_PLANNER_PLUGIN_ID,
        isTimelineMilestoneProjection: true,
        timelineMilestoneIdentity: virtualIdentity,
        timelineParentNodeKey: text(parentItem?.nodeKey),
        timelineNodeKey: text(milestone.timelineNodeKey),
        timelineItemId,
        milestoneId,
        milestoneName: text(milestone.milestoneName || milestone.name),
        pathLabel: milestoneScheduleLabel,
        date: text(milestone.date),
        weekdayLabel: text(milestone.weekdayLabel),
        timeBlockId: text(milestone.timeBlockId),
        timeBlockLabel: text(milestone.timeBlockLabel, "未安排时段"),
        timeBlockRange: text(milestone.timeBlockRange),
        timeBlockOrder: Number.isFinite(Number(milestone.timeBlockOrder)) ? Number(milestone.timeBlockOrder) : 7,
        completed: milestone.completed === true,
      };
      group.columns.timeline = timelineItems.concat(virtualItem);
      group.itemCount = Number(group.itemCount || 0) + 1;
      attachedCount += 1;
    });
    (Array.isArray(model.groups) ? model.groups : []).forEach((group) => {
      const timelineItems = Array.isArray(group.columns?.timeline) ? group.columns.timeline : [];
      const ordinaryItems = timelineItems.filter((item) => !isTimelineMilestoneProjectionItem(item));
      const projectedItems = timelineItems.filter((item) => isTimelineMilestoneProjectionItem(item)).sort(compareTimelineMilestoneProjectionItems);
      group.columns.timeline = ordinaryItems.concat(projectedItems);
    });
    model.diagnostics.push({ code: "timeline-milestones.projected", limit: attachedCount });
    if (snapshot.truncated === true) {
      model.diagnostics.push({
        code: "timeline-milestones.truncated",
        limit: `${Number(snapshot.count) || 0}/${Number(snapshot.totalCount) || 0}`,
      });
    }
    if (ambiguousIdentityCount) model.diagnostics.push({ code: "timeline-milestones.identity-ambiguous", limit: ambiguousIdentityCount });
    if (unmatchedCount) model.diagnostics.push({ code: "timeline-milestones.unmatched", limit: unmatchedCount });
    if (duplicateCount) model.diagnostics.push({ code: "timeline-milestones.duplicate-skipped", limit: duplicateCount });
    return model;
  }

  getCanonicalWorkspaceSourceNotePath() {
    const plugin = this.app?.plugins?.plugins?.["workspace-mount"];
    const configured = typeof plugin?.getDefaultSourceNotePath === "function"
      ? plugin.getDefaultSourceNotePath()
      : text(plugin?.settings?.defaultSourceNotePath || "④workspace挂载.md");
    const resolveSourceFile = typeof plugin?.resolveSourceFile === "function"
      ? plugin.resolveSourceFile.bind(plugin)
      : null;
    const sourceFile = resolveSourceFile ? resolveSourceFile(configured) : null;
    return text(sourceFile?.path || configured);
  }

  isCanonicalWorkspaceSourceRecord(record = {}, canonicalKey = undefined) {
    if (resolveBaseColumnId(record) !== "workspace") return false;
    const canonical = canonicalKey === undefined ? normalizeNotePathKey(this.getCanonicalWorkspaceSourceNotePath()) : canonicalKey;
    const recordPath = normalizeNotePathKey(getRecordNotePath(record));
    if (!canonical || !recordPath) return true;
    return recordPath === canonical;
  }

  async getKeywordNotesForItem(item = {}) {
    if (!item?.nodeKey || resolveBaseColumnId(item) !== "keyword") return [];
    const api = this.getKeywordIndexApi();
    if (typeof api?.getKeywordNotesForNode !== "function") return [];
    const notes = await api.getKeywordNotesForNode(item.nodeKey);
    return this.normalizeKeywordNotes(notes);
  }

  normalizeKeywordNotes(notes) {
    return (Array.isArray(notes) ? notes : [])
      .map((note) => Object.assign({}, note, { path: text(note?.path) }))
      .filter((note) => note.path);
  }

  async getWorkspaceBoundNoteForItem(item = {}) {
    const baseColumnId = resolveBaseColumnId(item);
    const isOrdinary = isOrdinaryNoteRecord(item);
    if (!item?.nodeKey || isOrdinary || baseColumnId !== "workspace") {
      if (item?.nodeKey && baseColumnId === "workspace") {
        console.info("[ProjectOverview][workspace-bound-note.probe-skip]", {
          nodeKey: text(item.nodeKey),
          label: text(item.label),
          columnId: text(item.columnId),
          baseColumnId,
          isOrdinary,
        });
      }
      return null;
    }
    const api = this.getWorkspaceMountApi();
    if (isContextCarrierDiagEnabled()) console.info("[ProjectOverview][workspace-bound-note.probe]", {
      nodeKey: text(item.nodeKey),
      label: text(item.label),
      columnId: text(item.columnId),
      baseColumnId,
      notePath: text(item.notePath),
      hasApi: !!api,
      hasGetter: typeof api?.getBoundNoteForNode === "function",
    });
    if (typeof api?.getBoundNoteForNode !== "function") return null;
    const result = await api.getBoundNoteForNode(item.nodeKey, { notePath: item.notePath });
    if (isContextCarrierDiagEnabled()) console.info("[ProjectOverview][workspace-bound-note.probe-result]", {
      nodeKey: text(item.nodeKey),
      label: text(item.label),
      path: text(result?.path),
      hasFile: result?.hasFile === true,
      matchCount: Number(result?.matchCount) || 0,
      sourceType: text(result?.sourceType),
    });
    return result?.path ? result : null;
  }

  async openKeywordNoteForItem(item = {}) {
    const notes = (Array.isArray(item.keywordNotes) ? item.keywordNotes : await this.getKeywordNotesForItem(item))
      .filter((note) => text(note?.path));
    if (notes.length === 0) {
      new Notice("该关键词没有可打开的关联笔记");
      return false;
    }
    let target = notes[0];
    if (notes.length > 1) {
      const modal = new ProjectOverviewNoteChoiceModal(this.app, {
        title: "选择关键词关联笔记",
        label: item.label || item.nodeKey,
        notes,
      });
      target = await modal.waitForResult();
      if (!target) return false;
    }
    const api = this.getKeywordIndexApi();
    if (typeof api?.openKeywordNote === "function") {
      const ok = await api.openKeywordNote(target);
      console.info("[ProjectOverview][keyword-note.open]", { nodeKey: text(item.nodeKey), path: text(target?.path), via: "keyword-index-api", ok });
      return ok;
    }
    const file = this.resolveExistingNoteFile(target.path);
    if (file) {
      await this.openFileInRightmostRootLeaf(file);
      console.info("[ProjectOverview][keyword-note.open]", { nodeKey: text(item.nodeKey), path: file.path, via: "local-fallback", ok: true });
      return true;
    }
    new Notice(`未找到关键词关联笔记：${text(target?.path)}`);
    return false;
  }

  async openWorkspaceBoundNoteForItem(item = {}) {
    const api = this.getWorkspaceMountApi();
    if (typeof api?.openBoundNoteForNode === "function") {
      const ok = await api.openBoundNoteForNode(item.nodeKey, { notePath: item.notePath });
      console.info("[ProjectOverview][workspace-bound-note.open]", { nodeKey: text(item.nodeKey), path: text(item.workspaceBoundNote?.path), via: "workspace-mount-api", ok });
      return ok;
    }
    const file = this.resolveExistingNoteFile(item.workspaceBoundNote?.path);
    if (file) {
      await this.openFileInRightmostRootLeaf(file);
      console.info("[ProjectOverview][workspace-bound-note.open]", { nodeKey: text(item.nodeKey), path: file.path, via: "local-fallback", ok: true });
      return true;
    }
    new Notice("Workspace Mount API 未就绪，无法打开绑定笔记");
    return false;
  }

  async openMandalaWeeklyGoalTableForItem(item = {}, group = null) {
    const api = this.getMandalaTimeBlocksApi();
    const isPrimary = group?.primaryColumnId === "mandala" && item?.columnId === "mandala" && item?.nodeKey === group.primaryNodeKey;
    console.info("[ProjectOverview][mandala-weekly-goals.open]", {
      nodeKey: text(item?.nodeKey),
      label: text(item?.label),
      groupId: text(group?.id),
      primaryNodeKey: text(group?.primaryNodeKey),
      isPrimary,
      hasApi: !!api,
      hasOpenWeeklyTrackingDashboard: typeof api?.openWeeklyTrackingDashboard === "function",
      hasOpenWeeklyGoalTable: typeof api?.openWeeklyGoalTable === "function",
    });
    if (!isPrimary) {
      new Notice("只有九宫格分组的主键条目可以打开周表");
      return false;
    }
    if (typeof api?.openWeeklyTrackingDashboard === "function") {
      return await api.openWeeklyTrackingDashboard(item.nodeKey, {
        source: "project-execution-overview",
        initialTab: "node",
        groupId: group?.id,
        primaryNodeKey: group?.primaryNodeKey,
        goalNodeId: item.nodeKey,
        mandalaNodeId: item.nodeKey,
        goalTitle: text(item?.label || group?.title),
        mandalaTitle: text(item?.label || group?.title),
      });
    }
    if (typeof api?.openWeeklyGoalTable !== "function") {
      new Notice("Mandala 周表 API 未就绪");
      return false;
    }
    return await api.openWeeklyGoalTable(item.nodeKey, {
      source: "project-execution-overview",
      groupId: group?.id,
      primaryNodeKey: group?.primaryNodeKey,
    });
  }

  async openMandalaWeeklyProjectPlan() {
    const api = this.getMandalaTimeBlocksApi();
    console.info("[ProjectOverview][mandala-weekly-project-plan.open]", {
      hasApi: !!api,
      hasOpenWeeklyTrackingDashboard: typeof api?.openWeeklyTrackingDashboard === "function",
      hasOpenWeeklyGoalTable: typeof api?.openWeeklyGoalTable === "function",
    });
    if (typeof api?.openWeeklyTrackingDashboard === "function") {
      return await api.openWeeklyTrackingDashboard("", {
        source: "project-execution-overview",
        initialTab: "projectPlan",
      });
    }
    if (typeof api?.openWeeklyGoalTable !== "function") {
      new Notice("Mandala 周表 API 未就绪");
      return false;
    }
    return await api.openWeeklyGoalTable("", {
      source: "project-execution-overview",
      initialTab: "projectPlan",
    });
  }

  async openWorkspaceWeeklyGoalTableForItem(item = {}, group = null) {
    const api = this.getMandalaTimeBlocksApi();
    const isPrimary = group?.primaryColumnId === "workspace" && item?.columnId === "workspace" && item?.nodeKey === group.primaryNodeKey;
    const mandalaPrimaryItem = (Array.isArray(group?.columns?.mandala) ? group.columns.mandala : [])
      .find((entry) => entry?.columnId === "mandala" && entry?.nodeKey);
    const mandalaParsed = parseJumpNodeKey(mandalaPrimaryItem?.nodeKey);
    const mandalaNodeId = text(mandalaParsed?.itemId || mandalaPrimaryItem?.nodeKey);
    console.info("[ProjectOverview][workspace-weekly-goals.open]", {
      nodeKey: text(item?.nodeKey),
      label: text(item?.label),
      groupId: text(group?.id),
      primaryNodeKey: text(group?.primaryNodeKey),
      mandalaNodeId,
      mandalaLabel: text(mandalaPrimaryItem?.label),
      isPrimary,
      hasApi: !!api,
      hasOpenWeeklyTrackingDashboard: typeof api?.openWeeklyTrackingDashboard === "function",
      hasOpenWeeklyGoalTable: typeof api?.openWeeklyGoalTable === "function",
    });
    if (!isPrimary) {
      new Notice("只有 Workspace 分组的主键条目可以打开周表");
      return false;
    }
    if (typeof api?.openWeeklyTrackingDashboard === "function") {
      return await api.openWeeklyTrackingDashboard(item.nodeKey, {
        source: "project-execution-overview",
        initialTab: "workspaceNode",
        groupId: group?.id,
        primaryNodeKey: group?.primaryNodeKey,
        workspaceNodeId: item.nodeKey,
        title: text(item?.label || group?.title),
        groupTitle: text(group?.title),
        itemLabel: text(item?.label),
        viewLabel: "项目管理 / Workspace 主键",
        mandalaNodeId,
        goalNodeId: mandalaNodeId,
        mandalaTitle: text(mandalaPrimaryItem?.label),
      });
    }
    if (typeof api?.openWeeklyGoalTable !== "function") {
      new Notice("Mandala 周表 API 未就绪");
      return false;
    }
    return await api.openWeeklyGoalTable(item.nodeKey, {
      source: "project-execution-overview",
      initialTab: "workspaceNode",
      groupId: group?.id,
      primaryNodeKey: group?.primaryNodeKey,
      workspaceNodeId: item.nodeKey,
      title: text(item?.label || group?.title),
      groupTitle: text(group?.title),
      itemLabel: text(item?.label),
      viewLabel: "项目管理 / Workspace 主键",
      mandalaNodeId,
      goalNodeId: mandalaNodeId,
      mandalaTitle: text(mandalaPrimaryItem?.label),
    });
  }

  async attachKeywordCarrierShard(items = []) {
    let keywordNoteCount = 0;
    let keywordItemCount = 0;
    let failedCount = 0;
    // r37 K3: one batched lookup (a single keyword index load) when the provider offers it. A failed batch discards
    // all partial results, is not counted, and falls back to the original per-item calls below.
    let batch = null;
    const keywordApi = this.getKeywordIndexApi();
    if (typeof keywordApi?.getKeywordNotesForNodes === "function") {
      try {
        const nodeKeys = [];
        for (const item of items) {
          try { if (item?.nodeKey && resolveBaseColumnId(item) === "keyword") nodeKeys.push(item.nodeKey); } catch (_) {}
        }
        const result = nodeKeys.length ? await keywordApi.getKeywordNotesForNodes(nodeKeys) : null;
        batch = result instanceof Map ? result : null;
      } catch (_) {
        batch = null;
      }
    }
    for (const item of items) {
      try {
        if (resolveBaseColumnId(item) === "keyword") {
          keywordItemCount += 1;
          item.keywordNotes = batch && item?.nodeKey && batch.has(item.nodeKey)
            ? this.normalizeKeywordNotes(batch.get(item.nodeKey))
            : await this.getKeywordNotesForItem(item);
          keywordNoteCount += item.keywordNotes.length;
        }
      } catch (error) {
        failedCount += 1;
        console.warn("[ProjectOverview][external-target.keyword-carrier-failed]", { nodeKey: text(item?.nodeKey), columnId: text(item?.columnId), error });
      }
    }
    return { name: "keywordCarrier", keywordItemCount, keywordNoteCount, failedCount };
  }

  async attachWorkspaceBoundNoteCarrierShard(items = []) {
    let workspaceItemCount = 0;
    let workspaceBoundCount = 0;
    let failedCount = 0;
    for (const item of items) {
      try {
        const baseColumnId = resolveBaseColumnId(item);
        if (!isOrdinaryNoteRecord(item) && baseColumnId === "workspace") {
          workspaceItemCount += 1;
          item.workspaceBoundNote = await this.getWorkspaceBoundNoteForItem(item);
          if (item.workspaceBoundNote?.path) workspaceBoundCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        console.warn("[ProjectOverview][external-target.workspace-bound-note-failed]", { nodeKey: text(item?.nodeKey), columnId: text(item?.columnId), error });
      }
    }
    return { name: "workspaceBoundNoteCarrier", workspaceItemCount, workspaceBoundCount, failedCount };
  }

  async collectExternalCarrierShards(model) {
    const items = Object.values(model.itemsByKey || {});
    // r35: time each parallel group (the stage cost is the slower group).
    let kwMs = null, wsMs = null;
    const settled = await Promise.allSettled([
      (async () => { const s = Date.now(); try { return await this.attachKeywordCarrierShard(items); } finally { kwMs = Date.now() - s; } })(),
      (async () => { const s = Date.now(); try { return await this.attachWorkspaceBoundNoteCarrierShard(items); } finally { wsMs = Date.now() - s; } })(),
    ]);
    const result = {
      itemCount: items.length,
      keywordItemCount: 0,
      keywordNoteCount: 0,
      workspaceItemCount: 0,
      workspaceBoundCount: 0,
      failedCount: 0,
      shardStatuses: [],
      keywordMs: kwMs,
      workspaceMs: wsMs,
    };
    settled.forEach((entry, index) => {
      const fallbackName = index === 0 ? "keywordCarrier" : "workspaceBoundNoteCarrier";
      if (entry.status === "fulfilled") {
        const value = entry.value || {};
        result.shardStatuses.push(`${text(value.name, fallbackName)}:ok`);
        result.keywordItemCount += Number(value.keywordItemCount || 0);
        result.keywordNoteCount += Number(value.keywordNoteCount || 0);
        result.workspaceItemCount += Number(value.workspaceItemCount || 0);
        result.workspaceBoundCount += Number(value.workspaceBoundCount || 0);
        result.failedCount += Number(value.failedCount || 0);
      } else {
        result.shardStatuses.push(`${fallbackName}:failed`);
        result.failedCount += 1;
        model.diagnostics.push({ code: "external-carrier-shard-failed", limit: fallbackName });
        console.warn("[ProjectOverview][external-target.shard-failed]", { shard: fallbackName, error: entry.reason });
      }
    });
    return result;
  }

  async attachExternalJumpTargets(model) {
    const shardResult = await this.collectExternalCarrierShards(model);
    const __stats = { items: shardResult.itemCount, kwN: shardResult.keywordItemCount, kwMs: shardResult.keywordMs, wsN: shardResult.workspaceItemCount, wsMs: shardResult.workspaceMs };
    console.info("[ProjectOverview][external-target.attach]", {
      itemCount: shardResult.itemCount,
      keywordItemCount: shardResult.keywordItemCount,
      keywordNoteCount: shardResult.keywordNoteCount,
      workspaceItemCount: shardResult.workspaceItemCount,
      workspaceBoundCount: shardResult.workspaceBoundCount,
      failedCount: shardResult.failedCount,
      shards: shardResult.shardStatuses,
    });
    return __stats;
  }

  collectContextCapsuleCarrierTargets(model, options = {}) {
    const targetsByKey = new Map();
    const contextKeyAliasMap = new Map();
    const aliasKeys = Object.hasOwn(options, "observerAliases") ? options.observerAliases : this.getContextCapsuleKeysSync();
    aliasKeys.forEach((key) => {
      const displayLabel = normalizeContextCapsuleDisplayLabel(key?.displayLabel || key?.canonicalLabel || "");
      if (!displayLabel) return;
      [
        key?.displayLabel,
        key?.canonicalLabel,
        key?.address,
        displayLabel,
      ].forEach((alias) => {
        const normalizedAlias = normalizeContextCapsuleDisplayLabel(alias).toLocaleLowerCase();
        if (!normalizedAlias || contextKeyAliasMap.has(normalizedAlias)) return;
        contextKeyAliasMap.set(normalizedAlias, displayLabel);
      });
    });
    const addTarget = (item, keyword) => {
      const rawDisplayLabel = normalizeContextCapsuleDisplayLabel(keyword);
      const displayLabel = contextKeyAliasMap.get(rawDisplayLabel.toLocaleLowerCase()) || rawDisplayLabel;
      const normalized = displayLabel.toLocaleLowerCase();
      if (!item?.nodeKey || !displayLabel || !normalized) return;
      if (!targetsByKey.has(normalized)) {
        targetsByKey.set(normalized, {
          contextKey: displayLabel,
          primaryNodeKeys: new Set(),
          primaryLabels: new Map(),
        });
      }
      const target = targetsByKey.get(normalized);
      target.primaryNodeKeys.add(item.nodeKey);
      target.primaryLabels.set(item.nodeKey, text(item.label, item.nodeKey));
    };
    Object.values(model.itemsByKey || {}).forEach((item) => {
      if (!item?.nodeKey) return;
      const isPrimaryCandidate = model.startNodeKeys?.has(item.nodeKey)
        || model.workspaceStartNodeKeys?.has(item.nodeKey)
        || !!this.getComment(item.nodeKey);
      if (!isPrimaryCandidate) return;
      extractGroupKeywordsFromComment(this.getComment(item.nodeKey)).forEach((keyword) => addTarget(item, keyword));
      const metaKey = extractContextCapsuleKeyFromMetaFields(item.metaFields);
      if (metaKey) addTarget(item, metaKey);
      addTarget(item, item.label);
    });
    return Array.from(targetsByKey.values());
  }

  getContextCarrierProviders() {
    return [
      { id: "workspace-mount", label: "Workspace Mount", api: this.getWorkspaceMountApi() },
      { id: "collection-card-view", label: "Collection Card", api: this.getCollectionCardApi() },
      { id: "gtd-task-manager", label: "GTD", api: this.getGtdTaskManagerApi() },
    ];
  }

  normalizeContextCarrierSnapshotItem(item = {}, provider = {}, contextKey = "") {
    const record = Object.assign({}, clone(item, {}));
    const nodeKey = text(record.nodeKey);
    if (!nodeKey) return null;
    const metaFields = Array.isArray(record.metaFields) ? clone(record.metaFields, []) : [];
    metaFields.push(
      { label: "Context Capsule Key", value: text(record.contextKey, contextKey) },
      { label: "Default Carrier Source", value: text(provider.id) },
    );
    return Object.assign(record, {
      nodeKey,
      label: text(record.label, nodeKey),
      pathLabel: text(record.pathLabel || record.notePath),
      notePath: text(record.notePath),
      viewType: text(record.viewType),
      viewLabel: text(record.viewLabel, provider.label || provider.id),
      metaFields,
      sourcePlugin: text(record.sourcePlugin, provider.id),
      workspaceCarrierSourceType: getWorkspaceCarrierSourceType(record),
      contextCarrier: Object.assign({}, clone(record.contextCarrier, {}), {
        providerId: text(provider.id),
        contextKey: text(record.contextKey, contextKey),
        carrierId: text(record.carrierId),
        carrierLabel: text(record.carrierLabel),
        sourceType: getWorkspaceCarrierSourceType(record),
      }),
    });
  }

  async collectContextCapsuleCarrierShards(model, options = {}) {
    const targets = this.collectContextCapsuleCarrierTargets(model, options);
    const providers = this.getContextCarrierProviders();
    const limits = Object.assign({}, CONTEXT_CARRIER_LIMITS, options?.limits || {});
    const contextKeys = targets.map((target) => target.contextKey).filter(Boolean);
    const normalizeTargetKey = (value = "") => normalizeContextCapsuleDisplayLabel(value).toLocaleLowerCase();
    const getTargetSnapshotFromBulk = (targetsByKey, contextKey) => {
      if (!targetsByKey || typeof targetsByKey !== "object") return null;
      const direct = targetsByKey[contextKey] || targetsByKey[normalizeTargetKey(contextKey)];
      if (direct) return direct;
      const normalized = normalizeTargetKey(contextKey);
      return Object.entries(targetsByKey).find(([key]) => normalizeTargetKey(key) === normalized)?.[1] || null;
    };
    const txId = `ctx-carrier-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const diagEnabled = isContextCarrierDiagEnabled();
    const startedAt = nowMs();
    const result = {
      targetCount: targets.length,
      providerStatuses: [],
      providerResults: [],
      contextStatuses: [],
      recordsByContextKey: new Map(),
      projectionsByProviderContextKey: new Map(),
      failedCount: 0,
      truncated: false,
      hydrationPolicy: Object.assign({}, CONTEXT_CARRIER_HYDRATION_POLICY),
      timingMs: 0,
    };
    if (diagEnabled) {
      console.debug("[ProjectOverview][context-carrier.diag][targets]", {
        txId,
        targetCount: targets.length,
        targetKeysPreview: targets.slice(0, 8).map((target) => previewContextCarrierText(target.contextKey)),
        providers: providers.map((provider) => ({
          providerId: provider.id,
          available: typeof provider.api?.getContextCapsuleCarrierSnapshot === "function",
        })),
      });
    }
    if (targets.length === 0) return result;
    const settled = await Promise.allSettled(providers.map(async (provider) => {
      if (typeof provider.api?.getContextCapsuleCarrierSnapshot !== "function") {
        if (diagEnabled) {
          console.debug("[ProjectOverview][context-carrier.diag][provider-unavailable]", {
            txId,
            providerId: provider.id,
            status: "unavailable",
          });
        }
        return { providerId: provider.id, status: "unavailable", count: 0 };
      }
      let count = 0;
      let truncated = false;
      let degradedCount = 0;
      const acceptSnapshotForTarget = (target, snapshot, bulkMode = false, targetPresent = true) => {
        const contextStartedAt = nowMs();
        const items = Array.isArray(snapshot?.items) ? snapshot.items : (Array.isArray(snapshot) ? snapshot : []);
        if (snapshot?.truncated === true) truncated = true;
        const observedCount = Number(snapshot?.count ?? snapshot?.totalCount ?? items.length) || 0;
        const hasMore = snapshot?.hasMore === true || snapshot?.truncated === true;
        const contextStatus = {
          providerId: provider.id,
          contextKey: target.contextKey,
          ok: snapshot?.ok !== false,
          status: text(snapshot?.status || snapshot?.reason, snapshot?.ok === false ? "failed" : "ok"),
          observedCount,
          returnedCount: items.length,
          acceptedCount: 0,
          matchedCarrierCount: Number(snapshot?.matchedCarrierCount || 0),
          truncated: snapshot?.truncated === true,
          hasMore,
          cursor: text(snapshot?.cursor || snapshot?.nextCursor),
          revision: text(snapshot?.revision || snapshot?.version),
          providerTimingMs: Number(snapshot?.timingMs || 0),
          timingMs: 0,
          reason: text(snapshot?.reason),
          bulkMode,
          fromIndex: snapshot?.fromIndex === true,
        };
        result.projectionsByProviderContextKey.set(
          `${provider.id}::${normalizeTargetKey(target.contextKey)}`,
          this.buildContextCarrierProjectionDescriptor(snapshot, provider, target.contextKey, { targetPresent }),
        );
        const key = target.contextKey.toLocaleLowerCase();
        if (!result.recordsByContextKey.has(key)) result.recordsByContextKey.set(key, []);
        const bucket = result.recordsByContextKey.get(key);
        let targetProviderCount = 0;
        for (const item of items) {
          if (targetProviderCount >= limits.perTargetPerProvider || bucket.length >= limits.totalItems) {
            truncated = true;
            contextStatus.truncated = true;
            contextStatus.hasMore = true;
            break;
          }
          const record = this.normalizeContextCarrierSnapshotItem(item, provider, target.contextKey);
          if (!record) continue;
          bucket.push(record);
          targetProviderCount += 1;
          contextStatus.acceptedCount += 1;
          count += 1;
        }
        contextStatus.timingMs = Math.round(nowMs() - contextStartedAt);
        if (diagEnabled) {
          console.debug("[ProjectOverview][context-carrier.diag][provider-context]", {
            txId,
            providerId: provider.id,
            bulkMode,
            fromIndex: contextStatus.fromIndex,
            contextKey: previewContextCarrierText(target.contextKey, 60),
            ok: contextStatus.ok,
            status: contextStatus.status,
            count: items.length,
            observedCount: contextStatus.observedCount,
            acceptedCount: contextStatus.acceptedCount,
            truncated: contextStatus.truncated,
            hasMore: contextStatus.hasMore,
            reason: contextStatus.reason,
            matchedCarrierCount: contextStatus.matchedCarrierCount,
            providerTimingMs: contextStatus.providerTimingMs,
            timingMs: contextStatus.timingMs,
            sample: sampleContextCarrierItems(items),
          });
        }
        result.contextStatuses.push(contextStatus);
      };
      const acceptFailedSnapshotForTarget = (target, error, bulkMode = false) => {
        degradedCount += 1;
        const reason = text(error?.message || error, "provider-target-failed");
        const contextStatus = {
          providerId: provider.id,
          contextKey: target.contextKey,
          ok: false,
          status: "failed",
          observedCount: 0,
          returnedCount: 0,
          acceptedCount: 0,
          matchedCarrierCount: 0,
          truncated: false,
          hasMore: false,
          cursor: "",
          revision: "",
          providerTimingMs: 0,
          timingMs: 0,
          reason,
          bulkMode,
          fromIndex: false,
        };
        result.contextStatuses.push(contextStatus);
        result.projectionsByProviderContextKey.set(
          `${provider.id}::${normalizeTargetKey(target.contextKey)}`,
          this.buildContextCarrierProjectionDescriptor(null, provider, target.contextKey, { targetPresent: false }),
        );
        if (diagEnabled) {
          console.debug("[ProjectOverview][context-carrier.diag][provider-context-failed]", {
            txId,
            providerId: provider.id,
            bulkMode,
            contextKey: previewContextCarrierText(target.contextKey, 60),
            reason,
          });
        }
      };
      let usedBulk = false;
      try {
        const bulkSnapshot = await this.getContextCarrierSnapshotCached(provider, {
          contextKeys,
          limit: limits.perTargetPerProvider,
          source: "project-execution-overview",
          summaryOnly: false,
        });
        const targetsByKey = bulkSnapshot?.targets && typeof bulkSnapshot.targets === "object" ? bulkSnapshot.targets : null;
        if (targetsByKey) {
          usedBulk = true;
          targets.forEach((target) => {
            const targetSnapshot = getTargetSnapshotFromBulk(targetsByKey, target.contextKey);
            acceptSnapshotForTarget(target, targetSnapshot || {
              ok: bulkSnapshot?.ok !== false,
              pluginId: provider.id,
              source: provider.id,
              contextKey: target.contextKey,
              matchedCarrierCount: 0,
              totalCount: 0,
              returnedCount: 0,
              count: 0,
              limit: limits.perTargetPerProvider,
              hasMore: false,
              cursor: "",
              revision: text(bulkSnapshot?.revision || bulkSnapshot?.version),
              timingMs: Number(bulkSnapshot?.timingMs || 0),
              items: [],
              truncated: false,
              fromIndex: bulkSnapshot?.fromIndex === true,
            }, true, !!targetSnapshot);
          });
        }
      } catch (error) {
        if (diagEnabled) {
          console.debug("[ProjectOverview][context-carrier.diag][provider-bulk-fallback]", {
            txId,
            providerId: provider.id,
            reason: text(error?.message || error),
          });
        }
      }
      if (!usedBulk) {
        for (const target of targets) {
          try {
            const snapshot = await this.getContextCarrierSnapshotCached(provider, {
              contextKey: target.contextKey,
              displayLabel: target.contextKey,
              limit: limits.perTargetPerProvider,
              source: "project-execution-overview",
            });
            acceptSnapshotForTarget(target, snapshot, false, true);
          } catch (error) {
            acceptFailedSnapshotForTarget(target, error, false);
          }
        }
      }
      return { providerId: provider.id, status: degradedCount > 0 ? "partial" : "ok", count, truncated, bulk: usedBulk, failedTargetCount: degradedCount };
    }));
    settled.forEach((entry, index) => {
      const provider = providers[index];
      if (entry.status === "fulfilled") {
        const value = entry.value || {};
        result.providerStatuses.push(`${provider.id}:${text(value.status, "ok")}:${Number(value.count || 0)}`);
        result.providerResults.push({
          providerId: provider.id,
          status: text(value.status, "ok"),
          acceptedCount: Number(value.count || 0),
          truncated: value.truncated === true,
          bulk: value.bulk === true,
        });
        if (value.truncated) result.truncated = true;
        if (value.status === "unavailable") model.diagnostics.push({ code: "context-capsule-carrier-unavailable", limit: provider.id });
        if (value.status === "partial") model.diagnostics.push({ code: "context-capsule-carrier-partial", limit: `${provider.id}:${Number(value.failedTargetCount || 0)}` });
      } else {
        result.failedCount += 1;
        result.providerStatuses.push(`${provider.id}:failed`);
        result.providerResults.push({
          providerId: provider.id,
          status: "failed",
          acceptedCount: 0,
          truncated: false,
          reason: text(entry.reason?.message || entry.reason),
        });
        model.diagnostics.push({ code: "context-capsule-carrier-failed", limit: provider.id });
        console.warn("[ProjectOverview][context-carrier.provider-failed]", { providerId: provider.id, error: entry.reason });
      }
    });
    result.timingMs = Math.round(nowMs() - startedAt);
    if (diagEnabled) {
      console.debug("[ProjectOverview][context-carrier.diag][summary]", {
        txId,
        targetCount: result.targetCount,
        providerStatuses: result.providerStatuses,
        providerResults: result.providerResults,
        contextStatuses: result.contextStatuses.slice(0, 24).map((entry) => Object.assign({}, entry, {
          contextKey: previewContextCarrierText(entry.contextKey, 60),
        })),
        failedCount: result.failedCount,
        truncated: result.truncated,
        timingMs: result.timingMs,
        hydrationPolicy: result.hydrationPolicy,
        contextBuckets: Array.from(result.recordsByContextKey.entries()).slice(0, 8).map(([contextKey, records]) => ({
          contextKey: previewContextCarrierText(contextKey, 60),
          count: Array.isArray(records) ? records.length : 0,
          sample: sampleContextCarrierItems(records),
        })),
      });
    }
    return result;
  }

  reduceContextCapsuleCarrierRecords(model, eva, shardResult, targetByKey) {
    let recordCount = 0;
    let edgeCount = 0;
    if (!(shardResult?.recordsByContextKey instanceof Map)) return { recordCount, edgeCount };
    shardResult.recordsByContextKey.forEach((records, contextKey) => {
      const target = targetByKey.get(contextKey);
      if (!target) return;
      const dedupedRecords = [];
      const seen = new Set();
      (Array.isArray(records) ? records : []).forEach((record) => {
        if (!record?.nodeKey || seen.has(record.nodeKey)) return;
        seen.add(record.nodeKey);
        dedupedRecords.push(record);
      });
      dedupedRecords.forEach((record) => {
        const added = this.addRecordToModel(model, eva, record);
        if (added?.added) recordCount += 1;
        target.primaryNodeKeys.forEach((primaryNodeKey) => {
          if (primaryNodeKey === record.nodeKey) return;
          const before = Object.keys(model.edgesById || {}).length;
          this.addRelationEdge(model, {
            id: `context-capsule-carrier::${contextKey}::${primaryNodeKey}::${record.nodeKey}`,
            sourceNodeKey: primaryNodeKey,
            targetNodeKey: record.nodeKey,
            relationType: "同操作上下文主键",
            kind: "context-capsule-carrier",
          });
          if (Object.keys(model.edgesById || {}).length > before) edgeCount += 1;
        });
      });
    });
    return { recordCount, edgeCount };
  }

  async attachContextCapsuleDefaultCarrierEdges(model, eva, options = {}) {
    const targets = this.collectContextCapsuleCarrierTargets(model, options);
    model.contextCarrierTargetDescriptors = targets.map((target) => ({
      contextKey: this.normalizeContextCarrierCacheKey(target.contextKey),
      displayLabel: target.contextKey,
      primaryNodeKeys: Array.from(target.primaryNodeKeys || []),
    }));
    if (targets.length === 0) {
      model.contextCarrierProjectionRecords = {};
      return { targetCount: 0, recordCount: 0, edgeCount: 0 };
    }
    const targetByKey = new Map(targets.map((target) => [target.contextKey.toLocaleLowerCase(), target]));
    const shardResult = await this.collectContextCapsuleCarrierShards(model, options);
    model.contextCarrierProjectionRecords = Object.fromEntries(shardResult.projectionsByProviderContextKey || []);
    const reduced = this.reduceContextCapsuleCarrierRecords(model, eva, shardResult, targetByKey);
    const recordCount = reduced.recordCount;
    const edgeCount = reduced.edgeCount;
    model.diagnostics.push({ code: "context-capsule-carrier-targets", limit: shardResult.targetCount });
    model.diagnostics.push({ code: "context-capsule-carrier-hydration-policy", limit: shardResult.hydrationPolicy?.mode || CONTEXT_CARRIER_HYDRATION_POLICY.mode });
    if (recordCount > 0) model.diagnostics.push({ code: "context-capsule-carrier-records", limit: recordCount });
    if (edgeCount > 0) model.diagnostics.push({ code: "context-capsule-carrier-edges", limit: edgeCount });
    if (shardResult.truncated) model.diagnostics.push({ code: "context-capsule-carrier-has-more", limit: "provider_snapshot_or_model_backstop" });
    console.info("[ProjectOverview][context-carrier.attach]", {
      targets: shardResult.targetCount,
      records: recordCount,
      edges: edgeCount,
      failed: shardResult.failedCount,
      truncated: shardResult.truncated,
      providers: shardResult.providerStatuses,
      providerResults: shardResult.providerResults,
      timingMs: shardResult.timingMs,
      hydrationPolicy: shardResult.hydrationPolicy,
    });
    return { targetCount: shardResult.targetCount, recordCount, edgeCount };
  }

  finalizeContextCarrierAutoRefreshIndex(model) {
    const groupOccurrencesByContextKey = {};
    const displayLabelsByContextKey = {};
    const groups = Array.isArray(model?.groups) ? model.groups : [];
    (Array.isArray(model?.contextCarrierTargetDescriptors) ? model.contextCarrierTargetDescriptors : []).forEach((target) => {
      const contextKey = this.normalizeContextCarrierCacheKey(target?.contextKey || target?.displayLabel);
      if (!contextKey) return;
      displayLabelsByContextKey[contextKey] = text(target?.displayLabel, contextKey);
      const primaryNodeKeys = new Set(Array.isArray(target?.primaryNodeKeys) ? target.primaryNodeKeys : []);
      const occurrences = [];
      groups.forEach((group, ordinal) => {
        const itemKeys = Array.isArray(group?.itemKeys) ? group.itemKeys : [];
        if (!primaryNodeKeys.has(group?.primaryNodeKey) && !itemKeys.some((key) => primaryNodeKeys.has(key))) return;
        occurrences.push({
          groupId: text(group?.id),
          primaryNodeKey: text(group?.primaryNodeKey),
          ordinal,
        });
      });
      groupOccurrencesByContextKey[contextKey] = occurrences;
    });
    model.contextCarrierAutoRefreshIndex = {
      projectionsByProviderContextKey: Object.assign({}, model?.contextCarrierProjectionRecords || {}),
      groupOccurrencesByContextKey,
      displayLabelsByContextKey,
      builtAt: nowString(),
    };
    delete model.contextCarrierProjectionRecords;
    delete model.contextCarrierTargetDescriptors;
    return model.contextCarrierAutoRefreshIndex;
  }

  suppressCarriedOrdinaryNotes(model) {
    const carriersByPath = new Map();
    const explicitPrimaryOrdinaryNoteKeys = new Set();
    const addCarrier = (path, carrier) => {
      const key = normalizeNotePathKey(path);
      if (!key) return;
      if (!carriersByPath.has(key)) carriersByPath.set(key, []);
      carriersByPath.get(key).push(carrier);
    };
    Object.values(model.edgesById || {}).forEach((edge) => {
      const source = model.itemsByKey?.[edge.sourceNodeKey];
      const target = model.itemsByKey?.[edge.targetNodeKey];
      if (!source || !target) return;
      const sourceIsOrdinary = source.columnId === "paradigm" && isOrdinaryNoteRecord(source);
      const targetIsOrdinary = target.columnId === "paradigm" && isOrdinaryNoteRecord(target);
      if (sourceIsOrdinary && (model.startNodeKeys?.has(target.nodeKey) || model.workspaceStartNodeKeys?.has(target.nodeKey))) {
        explicitPrimaryOrdinaryNoteKeys.add(source.nodeKey);
      }
      if (targetIsOrdinary && (model.startNodeKeys?.has(source.nodeKey) || model.workspaceStartNodeKeys?.has(source.nodeKey))) {
        explicitPrimaryOrdinaryNoteKeys.add(target.nodeKey);
      }
    });
    Object.values(model.itemsByKey || {}).forEach((item) => {
      if (!item?.nodeKey || isOrdinaryNoteRecord(item)) return;
      if (item.workspaceBoundNote?.path) {
        addCarrier(item.workspaceBoundNote.path, {
          nodeKey: item.nodeKey,
          columnId: item.columnId,
          label: item.label,
          kind: "workspace-bound-note",
        });
      }
      (Array.isArray(item.keywordNotes) ? item.keywordNotes : []).forEach((note) => {
        addCarrier(note.path, {
          nodeKey: item.nodeKey,
          columnId: item.columnId,
          label: item.label,
          kind: "keyword-note",
        });
      });
    });
    let suppressed = 0;
    let protectedExplicit = 0;
    Object.values(model.itemsByKey || {}).forEach((item) => {
      if (!(item.columnId === "paradigm" && isOrdinaryNoteRecord(item))) return;
      const pathKey = normalizeNotePathKey(getOrdinaryNotePath(item) || item.notePath);
      const carriers = pathKey ? (carriersByPath.get(pathKey) || []) : [];
      const effectiveCarriers = carriers.filter((carrier) => carrier.nodeKey !== item.nodeKey);
      if (effectiveCarriers.length === 0) {
        if (explicitPrimaryOrdinaryNoteKeys.has(item.nodeKey)) protectedExplicit += 1;
        return;
      }
      item.suppressedByCarrier = effectiveCarriers;
      if (explicitPrimaryOrdinaryNoteKeys.has(item.nodeKey)) item.suppressedByCarrierWasExplicitPrimary = true;
      suppressed += 1;
    });
    if (suppressed > 0) {
      model.diagnostics.push({ code: "ordinary-note-suppressed-by-carrier", limit: suppressed });
    }
    console.info("[ProjectOverview][ordinary-note.suppress-carried]", {
      carrierPathCount: carriersByPath.size,
      explicitPrimaryOrdinaryNoteCount: explicitPrimaryOrdinaryNoteKeys.size,
      protectedExplicit,
      suppressed,
    });
  }

  async getOverviewReadSource() {
    const api = this.getEva();
    const query = this.settings.startQuery || DEFAULT_START_QUERY;
    if (api?.searchNodes && api?.getNodeRelationSnapshot) {
      const preview = api.searchNodes(query, { limit: 240 }) || [];
      const workspacePreview = preview.filter((record) => resolveBaseColumnId(record) === "workspace");
      const tabPreview = this.filterStartTabChildren(workspacePreview, query);
      console.info("[ProjectOverview][read-source.preview]", {
        query,
        total: preview.length,
        workspace: workspacePreview.length,
        tabChildren: tabPreview.length,
        usingFallback: tabPreview.length === 0,
      });
      if (tabPreview.length > 0) return api;
    }
    try {
      const state = await this.loadEvaStateFallback();
      if (state) {
        console.info("[ProjectOverview][read-source.fallback]", {
          nodeCount: Object.keys(state.nodeIndexByKey || {}).length,
          relationCount: Object.keys(state.relationsById || {}).length,
        });
        return makeStaticEvaFacade(state);
      }
    } catch (error) {
      console.warn("[ProjectOverview][read-source.fallback-failed]", error);
    }
    return api;
  }

  async loadEvaStateFallback() {
    const evaPlugin = this.app?.plugins?.plugins?.["eva-cross-view-relations"];
    if (evaPlugin?.state?.nodeIndexByKey) {
      const state = clone(evaPlugin.state, null);
      console.info("[ProjectOverview][eva.fallback-plugin-state]", {
        nodeCount: Object.keys(state?.nodeIndexByKey || {}).length,
        relationCount: Object.keys(state?.relationsById || {}).length,
      });
      return state;
    }
    const candidates = [
      ".obsidian/plugins/eva-cross-view-relations/data.json",
      "data/eva-cross-view-relations.json",
    ];
    for (const path of candidates) {
      try {
        if (!(await this.app.vault.adapter.exists(path))) continue;
        const raw = await this.app.vault.adapter.read(path);
    const parsed = JSON.parse(raw || "{}");
        console.info("[ProjectOverview][eva.fallback-loaded]", {
          path,
          nodeCount: Object.keys(parsed.nodeIndexByKey || {}).length,
          relationCount: Object.keys(parsed.relationsById || {}).length,
        });
        return parsed;
      } catch (error) {
        console.warn("[ProjectOverview][eva.fallback-read-failed]", { path, error });
      }
    }
    return null;
  }

  async openHistoryNode(nodeKey) {
    const type = String(nodeKey || "").slice(8).split("|")[0];
    const providers = { "workspace-mount-view": window.__workspaceMountPluginApi, "collection-card-view": window.__collectionCardViewPluginApi, "gtd": window.__gtdTaskManagerPluginApi };
    if (!Object.prototype.hasOwnProperty.call(providers, type)) return this.openNode(nodeKey);
    const api = providers[type];
    try { if (typeof api?.openHistoryNodeV1 !== "function" || await api.openHistoryNodeV1(nodeKey) !== true) throw new Error("history-target-unavailable"); return true; }
    catch (_) { new Notice("历史条目未能定位，请检查目标插件已重载且来源仍存在。"); return false; }
  }
  async openNode(nodeKey) {
    const eva = this.getEva();
    if (eva?.openNode) {
      const ok = await eva.openNode(nodeKey);
      console.info("[ProjectOverview][open-node]", { nodeKey, via: "eva", ok });
      return ok;
    }
    console.warn("[ProjectOverview][open-node.unavailable]", { nodeKey, hasEva: !!eva, hasOpenNode: typeof eva?.openNode === "function" });
    new Notice("EVA openNode 不可用");
    return false;
  }

  async openOrdinaryNoteFile(record = {}) {
    const notePath = getOrdinaryNotePath(record);
    if (!notePath) {
      console.warn("[ProjectOverview][ordinary-note.open.missing-path]", { nodeKey: text(record?.nodeKey), label: text(record?.label) });
      new Notice("该普通笔记缺少可打开路径");
      return false;
    }
    const file = this.resolveExistingNoteFile(notePath);
    if (!file) {
      console.warn("[ProjectOverview][ordinary-note.open.missing-file]", { nodeKey: text(record?.nodeKey), label: text(record?.label), notePath });
      new Notice(`未找到对应笔记：${notePath}`);
      return false;
    }
    await this.openFileInRightmostRootLeaf(file);
    console.info("[ProjectOverview][ordinary-note.open]", { nodeKey: text(record?.nodeKey), path: file.path, requestedPath: notePath });
    return true;
  }

  async revealOrdinaryNoteInEvaTree(record = {}) {
    const notePath = getOrdinaryNotePath(record);
    if (!notePath) {
      console.warn("[ProjectOverview][eva-tree.reveal-note.missing-path]", { nodeKey: text(record?.nodeKey), label: text(record?.label) });
      new Notice("该普通笔记缺少可定位路径，无法跳转到 EVA 树状图");
      return false;
    }
    const api = window.__evaTreeViewPluginApi;
    if (!api || typeof api.revealNotePath !== "function") {
      console.warn("[ProjectOverview][eva-tree.reveal-note.unavailable]", {
        nodeKey: text(record?.nodeKey),
        notePath,
        hasApi: !!api,
        hasReveal: typeof api?.revealNotePath === "function",
      });
      new Notice("EVA Tree View 未就绪，无法定位树状图条目");
      return false;
    }
    const result = await api.revealNotePath(notePath);
    const ok = result === true || result?.ok === true;
    console.info("[ProjectOverview][eva-tree.reveal-note]", {
      nodeKey: text(record?.nodeKey),
      notePath,
      ok,
      result,
    });
    if (!ok) {
      new Notice(`EVA 树状图未命中该笔记：${notePath}`);
    }
    return ok;
  }

  async openItem(item) {
    if (item?.columnId === "paradigm" && isOrdinaryNoteRecord(item)) {
      return await this.openOrdinaryNoteFile(item);
    }
    return await this.openNode(item?.nodeKey);
  }

  async revealItemNode(nodeKey, options = {}) {
    const normalizedNodeKey = text(nodeKey);
    if (!normalizedNodeKey) return false;
    const previousMode = normalizeGroupingMode(this.settings.groupingMode);
    const requestedModeRaw = text(options?.groupingMode);
    const requestedMode = requestedModeRaw ? normalizeGroupingMode(requestedModeRaw) : "";
    const legacyTimelineFallback = requestedModeRaw === "timeline";
    if (requestedMode && requestedMode !== previousMode) {
      this.settings.groupingMode = requestedMode;
      if (!legacyTimelineFallback) await this.saveSettings();
    }
    const leaf = await this.activateView();
    const view = leaf?.view;
    if (!(view instanceof ProjectExecutionOverviewView)) return false;
    if (options?.groupId) {
      view.setSelectedGroupId(options.groupId, {
        mode: requestedMode || this.settings.groupingMode || DEFAULT_SETTINGS.groupingMode,
      });
    }
    view.pendingItemReveal = {
      nodeKey: normalizedNodeKey,
      options: Object.assign({}, options),
      revealId: makeId("item-reveal"),
    };
    await view.refresh({ preserveScroll: false, reason: text(options?.source, "reveal-item") });
    const ok = !!view.pendingItemRevealId || view.scrollToItem(normalizedNodeKey, options);
    if (!ok && requestedMode && requestedMode !== previousMode) {
      this.settings.groupingMode = previousMode;
      if (!legacyTimelineFallback) await this.saveSettings();
      await view.refresh({ preserveScroll: false, reason: "reveal-item-rollback" });
    }
    return ok;
  }

  cancelConfirmedRevealRequest(reason = "cancelled") {
    const session = this.confirmedItemRevealRequest;
    if (!session || session.cancelled) return false;
    session.cancelled = true;
    session.cancelReason = reason;
    if (session.timer) window.clearTimeout?.(session.timer);
    session.timer = null;
    const result = {
      ok: false,
      status: reason === "timeout" ? "timeout" : "cancelled",
      reason,
      revealId: session.revealId,
      nodeKey: session.nodeKey,
      groupId: "",
      groupingMode: normalizeGroupingMode(this.settings.groupingMode),
    };
    session.cancelResolve?.(result);
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECT_EXECUTION_OVERVIEW)
      .map((leaf) => leaf.view)
      .forEach((view) => view?.cancelConfirmedItemReveal?.(reason));
    console.info("[ProjectOverview][item.reveal-request.cancelled]", {
      revealId: session.revealId,
      nodeKey: session.nodeKey,
      reason,
      stage: session.stage,
    });
    return true;
  }

  async cancelConfirmedRevealForUnload() {
    const session = this.confirmedItemRevealRequest;
    const baselineMode = normalizeGroupingMode(session?.baselineMode || this.settings.groupingMode);
    const shouldRestoreMode = !!session && baselineMode !== normalizeGroupingMode(this.settings.groupingMode);
    this.cancelConfirmedRevealRequest("plugin-unload");
    this.contextCarrierUnloading = true;
    this.confirmedItemRevealRequestGeneration += 1;
    if (!shouldRestoreMode) return true;
    this.settings.groupingMode = baselineMode;
    try {
      await this.saveSettings();
      console.info("[ProjectOverview][item.reveal-request.unload-rollback]", {
        revealId: session.revealId,
        baselineMode,
        status: "restored",
      });
      return true;
    } catch (error) {
      console.warn("[ProjectOverview][item.reveal-request.unload-rollback-failed]", {
        revealId: session.revealId,
        baselineMode,
        message: error?.message || String(error),
      });
      return false;
    }
  }

  async revealItemNodeConfirmed(nodeKey, options = {}) {
    const normalizedNodeKey = text(nodeKey);
    const primaryKeys = [
      text(options?.primaryNodeKey),
      ...(Array.isArray(options?.primaryAliases) ? options.primaryAliases.map((value) => text(value)) : []),
    ].filter(Boolean);
    const currentMode = normalizeGroupingMode(this.settings.groupingMode);
    const revealId = makeId("item-reveal-confirmed");
    if (!normalizedNodeKey || !primaryKeys.length) {
      return { ok: false, status: "invalid-request", revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode: currentMode };
    }
    const previousSession = this.confirmedItemRevealRequest;
    const baselineMode = normalizeGroupingMode(previousSession?.baselineMode || currentMode);
    this.cancelConfirmedRevealRequest("superseded");
    const requestGeneration = Number(this.confirmedItemRevealRequestGeneration || 0) + 1;
    this.confirmedItemRevealRequestGeneration = requestGeneration;
    const timeoutMs = Math.max(300, Math.min(8000, Number(options?.timeoutMs || 2200) || 2200));
    let cancelResolve;
    const cancelPromise = new Promise((resolve) => { cancelResolve = resolve; });
    const session = {
      revealId,
      nodeKey: normalizedNodeKey,
      generation: requestGeneration,
      baselineMode,
      requestedMode: currentMode,
      startedAt: Date.now(),
      stage: "created",
      cancelled: false,
      cancelReason: "",
      cancelResolve,
      cancelPromise,
      timer: null,
    };
    this.confirmedItemRevealRequest = session;
    session.timer = window.setTimeout(() => {
      if (this.confirmedItemRevealRequest === session) this.cancelConfirmedRevealRequest("timeout");
    }, timeoutMs);
    const ownsGeneration = () => !this.contextCarrierUnloading
      && this.confirmedItemRevealRequest === session
      && requestGeneration === Number(this.confirmedItemRevealRequestGeneration || 0);
    const isCurrent = () => ownsGeneration() && !session.cancelled;
    const finish = (result) => {
      if (session.timer) window.clearTimeout?.(session.timer);
      session.timer = null;
      if (this.confirmedItemRevealRequest === session) this.confirmedItemRevealRequest = null;
      return result;
    };
    const awaitStep = async (stage, promise) => {
      session.stage = stage;
      const settled = await Promise.race([
        Promise.resolve(promise).then(
          (value) => ({ type: "value", value }),
          (error) => ({ type: "error", error }),
        ),
        cancelPromise.then((result) => ({ type: "cancelled", result })),
      ]);
      if (settled.type === "error") throw settled.error;
      return settled;
    };
    let view = null;
    let modeChanged = false;
    const rollbackMode = async (reason) => {
      if (!ownsGeneration() || !modeChanged) return false;
      this.settings.groupingMode = baselineMode;
      try {
        await this.saveSettings();
        if (view instanceof ProjectExecutionOverviewView && !view.contextCarrierClosed && ownsGeneration()) {
          await view.refresh({
            preserveScroll: false,
            reason: `confirmed-reveal-item-rollback:${reason}`,
            commitGuard: () => ownsGeneration(),
          });
        }
        return true;
      } catch (error) {
        console.warn("[ProjectOverview][item.reveal-request.rollback-failed]", {
          revealId,
          reason,
          message: error?.message || String(error),
        });
        return false;
      }
    };
    const requestedModeRaw = text(options?.groupingMode);
    const requestedMode = requestedModeRaw ? normalizeGroupingMode(requestedModeRaw) : currentMode;
    modeChanged = requestedMode !== baselineMode;
    session.requestedMode = requestedMode;
    try {
      const activation = await awaitStep("activate-view", this.activateView());
      if (activation.type === "cancelled") return finish(activation.result);
      if (!isCurrent()) return finish({ ok: false, status: "cancelled", reason: "superseded-after-activate", revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode: currentMode });
      const leaf = activation.value;
      view = leaf?.view;
      if (!(view instanceof ProjectExecutionOverviewView)) {
        return finish({ ok: false, status: "view-unavailable", revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode: currentMode });
      }
      if (requestedMode !== normalizeGroupingMode(this.settings.groupingMode)) {
        this.settings.groupingMode = requestedMode;
        modeChanged = true;
        const saved = await awaitStep("save-mode", this.saveSettings());
        if (saved.type === "cancelled") {
          if (saved.result?.status === "timeout") void rollbackMode("timeout-save-mode").finally(() => finish(saved.result));
          return saved.result;
        }
      }
      const refreshed = await awaitStep("refresh-view", view.refresh({
        preserveScroll: false,
        reason: text(options?.source, "confirmed-reveal-item"),
        commitGuard: () => isCurrent(),
      }));
      if (refreshed.type === "cancelled") {
        if (refreshed.result?.status === "timeout") void rollbackMode("timeout-refresh").finally(() => finish(refreshed.result));
        return refreshed.result;
      }
      if (!isCurrent()) return finish({ ok: false, status: "cancelled", reason: "superseded-during-refresh", revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode: currentMode });
      if (view.contextCarrierClosed) {
        await rollbackMode("view-closed");
        return finish({ ok: false, status: "cancelled", reason: "view-closed", revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode: currentMode });
      }
      const remainingMs = Math.max(1, timeoutMs - (Date.now() - session.startedAt));
      const revealed = await awaitStep("reveal-item", view.revealItemNodeConfirmed(normalizedNodeKey, Object.assign({}, options, {
        groupingMode: requestedMode,
        revealId,
        timeoutMs: remainingMs,
      })));
      if (revealed.type === "cancelled") {
        if (revealed.result?.status === "timeout") void rollbackMode("timeout-reveal").finally(() => finish(revealed.result));
        return revealed.result;
      }
      const result = revealed.value;
      if (result?.ok !== true) await rollbackMode(text(result?.reason || result?.status, "reveal-failed"));
      return finish(result);
    } catch (error) {
      await rollbackMode("exception");
      console.warn("[ProjectOverview][item.reveal-request.failed]", {
        revealId,
        nodeKey: normalizedNodeKey,
        stage: session.stage,
        message: error?.message || String(error),
      });
      return finish({ ok: false, status: "failed", reason: session.stage, revealId, nodeKey: normalizedNodeKey, groupId: "", groupingMode: baselineMode });
    }
  }

  async openRelationEditor(nodeKey) {
    const eva = getEvaApi(this.app);
    if (eva?.openRelationEditor) {
      await eva.openRelationEditor(nodeKey);
      console.info("[ProjectOverview][open-relation-editor]", { nodeKey, via: "eva" });
      return true;
    }
    console.warn("[ProjectOverview][open-relation-editor.unavailable]", {
      nodeKey,
      hasEva: !!eva,
      hasOpenRelationEditor: typeof eva?.openRelationEditor === "function",
      usingFallback: !!this.evaFallbackState,
    });
    new Notice("EVA 关系编辑器不可用。请确认 EVA Cross View Relations 插件已启用。");
    return false;
  }

  async buildOverviewModel() {
    return await this.buildOverviewModelForMode(this.settings.groupingMode || DEFAULT_SETTINGS.groupingMode);
  }

  async buildOverviewModelForMode(groupingMode = DEFAULT_SETTINGS.groupingMode, buildOptions = {}) {
    const eva = await this.getOverviewReadSource();
    const model = {
      schemaVersion: "overview-runtime-v1",
      generatedAt: nowString(),
      evaAvailable: !!eva,
      startRecord: null,
      startRecords: [],
      itemsByKey: {},
      edgesById: {},
      workspaceStartNodeKeys: new Set(),
      columnsById: Object.fromEntries(COLUMN_DEFS.map((column) => [column.id, { id: column.id, label: column.label, items: [] }])),
      groups: [],
      diagnostics: [],
    };
    if (!eva) return model;
    const mode = normalizeGroupingMode(groupingMode);
    const startRecords = this.resolveStartRecords(eva, mode);
    if (startRecords.length === 0 && !eva.__projectOverviewStaticFallback) {
      console.warn("[ProjectOverview][start-records.empty-api-fallback]", { query: this.settings.startQuery || DEFAULT_START_QUERY });
      const fallbackState = await this.loadEvaStateFallback();
      if (fallbackState) return await this.buildOverviewModelFromEva(makeStaticEvaFacade(fallbackState), true, mode, buildOptions);
    }
    return await this.buildOverviewModelFromResolved(eva, model, startRecords, mode, buildOptions);
  }

  extractGroupKeywordNavItemsFromModel(model, modeId = DEFAULT_SETTINGS.groupingMode) {
    const groups = this.sortGroupsForMode(Array.isArray(model?.groups) ? model.groups : [], modeId);
    const items = [];
    const localSeen = new Set();
    groups.forEach((group) => {
      const primaryNodeKey = text(group?.primaryNodeKey);
      if (!primaryNodeKey) return;
      const commentText = this.getComment(primaryNodeKey);
      extractGroupKeywordsFromComment(commentText).forEach((keyword) => {
        const key = text(keyword);
        const sourceIdentity = `${key.toLocaleLowerCase()}::${primaryNodeKey}::${text(group.id)}`;
        if (!key || localSeen.has(sourceIdentity)) return;
        localSeen.add(sourceIdentity);
        items.push({
          keyword: key,
          mode: text(modeId, DEFAULT_SETTINGS.groupingMode),
          groupId: text(group.id),
          groupTitle: text(group.title, group.id),
          primaryNodeKey,
        });
      });
    });
    return items;
  }

  mergeGlobalKeywordItems(...itemLists) {
    const byKeyword = new Map();
    itemLists.flat().forEach((item) => {
      const key = text(item?.keyword);
      const normalized = key.toLocaleLowerCase();
      if (!key) return;
      if (!byKeyword.has(normalized)) byKeyword.set(normalized, Object.assign({}, item, { keyword: key, sources: [] }));
      const target = byKeyword.get(normalized);
      const incomingSources = Array.isArray(item?.sources) && item.sources.length ? item.sources : [item];
      incomingSources.forEach((source) => {
        const identity = `${text(source?.mode)}::${text(source?.primaryNodeKey)}::${text(source?.groupId)}`;
        if (!target.sources.some((entry) => `${text(entry?.mode)}::${text(entry?.primaryNodeKey)}::${text(entry?.groupId)}` === identity)) {
          target.sources.push(Object.assign({}, source, { keyword: key }));
        }
      });
    });
    return Array.from(byKeyword.values()).sort(compareGlobalKeywordNavItems);
  }

  projectGlobalKeywordNavItems(items = [], options = {}) {
    const killMode = options?.killMode === true;
    const currentMode = text(this.settings?.groupingMode, DEFAULT_SETTINGS.groupingMode);
    return (Array.isArray(items) ? items : []).map((item) => {
      const sources = Array.isArray(item?.sources) && item.sources.length ? item.sources : [item];
      const evidence = options.trackingEvidence;
      const activeSources = sources.filter((source) => {
        const stopped = evidence?.ok === true && evidence.states.get(source?.primaryNodeKey) === "stopped";
        return stopped === killMode;
      });
      if (!activeSources.length) return null;
      const selected = activeSources.find((source) => text(source?.mode) === currentMode) || activeSources[0];
      return Object.assign({}, item, selected, { keyword: text(item?.keyword), sources: activeSources });
    }).filter(Boolean);
  }

  async buildGlobalGroupKeywordNavItems() {
    const scope = this.prepareGlobalKeywordNavScope();
    const generation = Number(this.globalKeywordNavGeneration || 0);
    const cache = this.globalKeywordNavCache || { items: [], builtAt: 0 };
    if (cache.buildComplete === true && cache.generation === generation && cache.scope === scope
      && Array.isArray(cache.items) && Date.now() - Number(cache.builtAt || 0) < 30000) {
      return cache.items.slice();
    }
    if (this.globalKeywordNavBuildPromise) return await this.globalKeywordNavBuildPromise;
    const promise = Promise.resolve().then(() => this.buildGlobalGroupKeywordNavItemsUncached()).then(items => {
      if (!this.isGlobalKeywordNavCurrent(generation, scope)) throw new Error("global-keyword-nav-stale");
      this.globalKeywordNavCache = { items: items.slice(), builtAt: Date.now(), generation, scope, buildComplete: true };
      return items;
    });
    this.globalKeywordNavBuildPromise = promise;
    try {
      return await promise;
    } finally {
      if (this.globalKeywordNavBuildPromise === promise) this.globalKeywordNavBuildPromise = null;
    }
  }

  // r33 P2: observer navigation builds stop at stage boundaries once superseded; other callers pass no isCurrent (no-op).
  assertNavBuildCurrent(buildOptions, stage) {
    if (typeof buildOptions?.isCurrent === "function" && buildOptions.isCurrent() !== true) throw Object.assign(new Error("NAV_BUILD_SUPERSEDED"), { code: "NAV_BUILD_SUPERSEDED", detail: String(stage || "").replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 40) });
  }
  markNavBuildStage(buildOptions, stage, ms, extra) { try { if (typeof buildOptions?.mark === "function") buildOptions.mark(stage, ms, extra); } catch (_) {} }

  async buildGlobalGroupKeywordNavItemsUncached(buildOptions = {}) {
    const all = [];
    for (const mode of GROUPING_MODES) {
      this.assertNavBuildCurrent(buildOptions, "mode." + mode.id);
      const modeStarted = Date.now();
      const model = await this.buildOverviewModelForMode(mode.id, buildOptions);
      this.markNavBuildStage(buildOptions, "mode." + mode.id, Date.now() - modeStarted);
      this.assertNavBuildCurrent(buildOptions, "mode-done." + mode.id);
      if (model?.evaAvailable !== true || !Array.isArray(model.groups)) throw new Error("global-keyword-nav-model-unavailable");
      all.push(this.extractGroupKeywordNavItemsFromModel(model, mode.id));
    }
    const merged = this.mergeGlobalKeywordItems(...all);
    console.info("[ProjectOverview][global-keyword-nav.build]", {
      keywordCount: merged.length,
      modes: GROUPING_MODES.map((mode) => mode.id),
    });
    return merged;
  }

  async buildOverviewModelFromEva(eva, isFallback = false, groupingMode = DEFAULT_SETTINGS.groupingMode, buildOptions = {}) {
    const model = {
      schemaVersion: "overview-runtime-v1",
      generatedAt: nowString(),
      evaAvailable: !!eva,
      startRecord: null,
      startRecords: [],
      itemsByKey: {},
      edgesById: {},
      workspaceStartNodeKeys: new Set(),
      columnsById: Object.fromEntries(COLUMN_DEFS.map((column) => [column.id, { id: column.id, label: column.label, items: [] }])),
      groups: [],
      diagnostics: isFallback ? [{ code: "using-eva-data-fallback", limit: "readonly" }] : [],
    };
    const mode = normalizeGroupingMode(groupingMode);
    const startRecords = this.resolveStartRecords(eva, mode);
    console.info("[ProjectOverview][start-records.resolved]", {
      query: this.settings.startQuery || DEFAULT_START_QUERY,
      source: isFallback ? "fallback" : "api",
      count: startRecords.length,
    });
    return await this.buildOverviewModelFromResolved(eva, model, startRecords, mode, buildOptions);
  }

  async buildOverviewModelFromResolved(eva, model, startRecords, groupingMode = DEFAULT_SETTINGS.groupingMode, buildOptions = {}) {
    const mode = normalizeGroupingMode(groupingMode);
    const shards = this.collectOverviewBuildShards(eva, startRecords, mode);
    return await this.mergeOverviewBuildShards(eva, model, shards, buildOptions);
  }

  collectOverviewBuildShards(eva, startRecords, groupingMode = DEFAULT_SETTINGS.groupingMode) {
    const mode = normalizeGroupingMode(groupingMode);
    const normalizedStartRecords = Array.isArray(startRecords) ? startRecords : [];
    const startNodeKeys = new Set(normalizedStartRecords.map((record) => record.nodeKey).filter(Boolean));
    const workspaceStartRecords = this.resolveWorkspaceStartTabRecords(eva);
    const workspaceStartNodeKeys = new Set((workspaceStartRecords || []).map((record) => record.nodeKey).filter(Boolean));
    const seedRecords = dedupeWorkspaceSeedRecords(this.collectSeedRecords(eva, normalizedStartRecords));
    return {
      mode,
      sourceShard: {
        evaAvailable: !!eva,
        staticFallback: eva?.__projectOverviewStaticFallback === true,
      },
      startRecordsShard: {
        records: normalizedStartRecords,
        nodeKeys: startNodeKeys,
      },
      workspaceStartShard: {
        records: workspaceStartRecords,
        nodeKeys: workspaceStartNodeKeys,
      },
      seedRecordsShard: {
        records: seedRecords,
      },
    };
  }

  async mergeOverviewBuildShards(eva, model, shards = {}, buildOptions = {}) {
    const mode = normalizeGroupingMode(shards.mode);
    const startRecords = Array.isArray(shards.startRecordsShard?.records) ? shards.startRecordsShard.records : [];
    const seedRecords = Array.isArray(shards.seedRecordsShard?.records) ? shards.seedRecordsShard.records : [];
    model.startRecords = startRecords;
    model.startNodeKeys = shards.startRecordsShard?.nodeKeys instanceof Set
      ? shards.startRecordsShard.nodeKeys
      : new Set(startRecords.map((record) => record.nodeKey).filter(Boolean));
    model.workspaceStartRecords = Array.isArray(shards.workspaceStartShard?.records) ? shards.workspaceStartShard.records : [];
    model.workspaceStartNodeKeys = shards.workspaceStartShard?.nodeKeys instanceof Set
      ? shards.workspaceStartShard.nodeKeys
      : new Set((model.workspaceStartRecords || []).map((record) => record.nodeKey).filter(Boolean));
    model.startRecord = startRecords[0] || null;
    this.currentStartNodeKeys = model.startNodeKeys;
    this.currentWorkspaceStartNodeKeys = model.workspaceStartNodeKeys;
    model.diagnostics.push({ code: `${mode}-seeds`, limit: seedRecords.length });
    console.info("[ProjectOverview][build-shards.collect]", {
      mode,
      evaAvailable: shards.sourceShard?.evaAvailable === true,
      staticFallback: shards.sourceShard?.staticFallback === true,
      startRecords: startRecords.length,
      workspaceStartRecords: model.workspaceStartRecords.length,
      seedRecords: seedRecords.length,
    });
    this.expandRecordsIntoModel(model, eva, seedRecords);
    this.assertNavBuildCurrent(buildOptions, "supermemo");
    { const __stageStarted = Date.now();
    await this.attachSuperMemoPlanTimelineChildren(model, eva, mode);
    this.markNavBuildStage(buildOptions, "supermemo", Date.now() - __stageStarted); }
    this.assertNavBuildCurrent(buildOptions, "supermemo-done");
    this.assertNavBuildCurrent(buildOptions, "carrier-edges");
    { const __stageStarted = Date.now();
    await this.attachContextCapsuleDefaultCarrierEdges(model, eva, buildOptions);
    this.markNavBuildStage(buildOptions, "carrier-edges", Date.now() - __stageStarted); }
    this.assertNavBuildCurrent(buildOptions, "carrier-edges-done");
    // Collection projection needs graph membership, not external-note display hydration.
    // Keep the full graph before grouping; ordinary-note bridges must remain traversable.
    this.assertNavBuildCurrent(buildOptions, "external-jumps");
    { const __stageStarted = Date.now();
    let __extStats = null;
    if (buildOptions.purpose !== "collection") __extStats = await this.attachExternalJumpTargets(model);
    this.markNavBuildStage(buildOptions, "external-jumps", Date.now() - __stageStarted, __extStats); }
    this.assertNavBuildCurrent(buildOptions, "external-jumps-done");
    this.suppressCarriedOrdinaryNotes(model);
    Object.values(model.itemsByKey).forEach((item) => {
      if (isSuppressedOrdinaryNoteItem(item)) return;
      const column = model.columnsById[item.columnId];
      if (column) column.items.push(item);
    });
    Object.values(model.columnsById).forEach((column) => column.items.sort(compareItemsByDepthLabel));
    this.logWorkspaceColumnDiagnostics(model, mode, seedRecords);
    model.groups = this.buildRelationGroups(model, mode);
    this.assertNavBuildCurrent(buildOptions, "timeline-milestones");
    { const __stageStarted = Date.now();
    await this.attachTimelineMilestoneProjectionToGroups(model, mode);
    this.markNavBuildStage(buildOptions, "timeline-milestones", Date.now() - __stageStarted); }
    this.assertNavBuildCurrent(buildOptions, "timeline-milestones-done");
    const mixedLifecycleGroups = model.groups.filter((group) => this.getPrimaryGroupLifecycleState(group).status === "mixed");
    if (mixedLifecycleGroups.length) model.diagnostics.push({ code: "primary-key-lifecycle-mixed-groups", limit: mixedLifecycleGroups.length });
    this.finalizeContextCarrierAutoRefreshIndex(model);
    this.logSparseGroupDiagnostics(model, mode);
    this.attachSuperMemoPlanToFirstTimelineGroup(model, mode);
    return model;
  }

  logWorkspaceColumnDiagnostics(model, groupingMode = DEFAULT_SETTINGS.groupingMode, seedRecords = []) {
    const workspaceItems = Object.values(model.itemsByKey || {})
      .filter((item) => resolveBaseColumnId(item) === "workspace");
    const workspaceColumnCount = workspaceItems.filter((item) => item.columnId === "workspace").length;
    const paradigmWorkspaceCount = workspaceItems.filter((item) => item.columnId === "paradigm").length;
    console.info("[ProjectOverview][workspace-column.resolve]", {
      mode: text(groupingMode, DEFAULT_SETTINGS.groupingMode),
      seedCount: Array.isArray(seedRecords) ? seedRecords.length : 0,
      workspaceStartCount: model.workspaceStartNodeKeys?.size || 0,
      workspaceBaseCount: workspaceItems.length,
      workspaceColumnCount,
      paradigmWorkspaceCount,
      samples: workspaceItems.slice(0, 16).map((item) => ({
        label: text(item.label),
        columnId: text(item.columnId),
        inWorkspaceStart: !!model.workspaceStartNodeKeys?.has(item.nodeKey),
        itemId: getWorkspaceItemId(item),
        pathLabel: text(item.pathLabel),
        nodeKey: text(item.nodeKey),
      })),
    });
  }

  logSparseGroupDiagnostics(model, groupingMode = DEFAULT_SETTINGS.groupingMode) {
    const sparse = (Array.isArray(model.groups) ? model.groups : [])
      .filter((group) => group?.hasRelations && Number(group?.itemCount || 0) <= 3)
      .slice(0, 12)
      .map((group) => ({
        title: text(group.title),
        id: text(group.id),
        itemCount: Number(group.itemCount || 0),
        edgeCount: Number(group.edgeCount || 0),
        primaryNodeKey: text(group.primaryNodeKey),
        columns: Object.fromEntries(Object.entries(group.columns || {}).map(([columnId, items]) => [
          columnId,
          (Array.isArray(items) ? items : []).map((item) => ({
            label: text(item.label),
            nodeKey: text(item.nodeKey),
            viewType: text(item.viewType),
            suppressedByCarrier: Array.isArray(item.suppressedByCarrier) ? item.suppressedByCarrier.length : 0,
          })),
        ])),
      }));
    if (sparse.length > 0) {
      console.info("[ProjectOverview][relation-group.sparse]", {
        mode: text(groupingMode, DEFAULT_SETTINGS.groupingMode),
        groupCount: model.groups.length,
        sparse,
      });
    }
  }

  async readSuperMemoPlanPluginRecords() {
    const plugin = this.app?.plugins?.plugins?.["supermemo-plan"];
    if (!plugin || typeof plugin.listRelationItems !== "function") return [];
    try {
      const rawRecords = await plugin.listRelationItems();
      const records = (Array.isArray(rawRecords) ? rawRecords : []).map((record, index) => Object.assign({}, record, { superMemoPlanOrder: index }));
      console.info("[ProjectOverview][supermemo-plan.direct-read]", {
        status: "OK",
        records: records.length,
        dataPath: typeof plugin.getPlanDataPath === "function" ? plugin.getPlanDataPath() : "",
      });
      return records;
    } catch (error) {
      console.warn("[ProjectOverview][supermemo-plan.direct-read]", {
        status: "FAIL",
        message: error?.message || String(error),
      });
      return [];
    }
  }

  normalizeSuperMemoPlanRecord(record = {}) {
    if (!record?.nodeKey) return null;
    const parsed = parseJumpNodeKey(record.nodeKey) || {};
    const plugin = this.app?.plugins?.plugins?.["supermemo-plan"];
    const normalized = Object.assign({}, clone(record, {}), {
      nodeKey: record.nodeKey,
      label: text(record.label, parsed.itemId || record.nodeKey),
      pathLabel: text(record.pathLabel || record.notePath || parsed.notePath),
      notePath: text(record.notePath || parsed.notePath || plugin?.settings?.sourceNotePath),
      viewType: text(record.viewType || parsed.viewType, "supermemo-plan-view"),
      viewLabel: text(record.viewLabel, "SuperMemo Plan"),
      metaFields: Array.isArray(record.metaFields) ? clone(record.metaFields, []) : [],
      sourcePlugin: text(record.sourcePlugin),
      searchText: text(record.searchText),
      contextCarrier: record.contextCarrier ? clone(record.contextCarrier, {}) : null,
      superMemoPlanStatus: getSuperMemoPlanStatusRobust(record),
      superMemoPlanOrder: getSuperMemoPlanOrder(record),
    });
    return isSuperMemoPlanRecord(normalized) ? normalized : null;
  }

  async collectSuperMemoPlanTimelineRecords(eva) {
    const recordsByKey = new Map();
    const directSeenKeys = new Set();
    const directCompletedKeys = new Set();
    const add = (record, source = "eva") => {
      const normalized = this.normalizeSuperMemoPlanRecord(record);
      if (!normalized) return;
      if (source === "direct") {
        directSeenKeys.add(normalized.nodeKey);
        if (isCompletedSuperMemoPlanRecord(normalized)) {
          directCompletedKeys.add(normalized.nodeKey);
          recordsByKey.delete(normalized.nodeKey);
          return;
        }
      }
      if (directCompletedKeys.has(normalized.nodeKey)) return;
      if (source !== "direct" && directSeenKeys.has(normalized.nodeKey)) return;
      if (isCompletedSuperMemoPlanRecord(normalized)) return;
      recordsByKey.set(normalized.nodeKey, Object.assign({}, recordsByKey.get(normalized.nodeKey) || {}, normalized));
    };
    const evaRecords = typeof eva.getAllNodeRecords === "function"
      ? eva.getAllNodeRecords()
      : (eva.searchNodes?.("", { limit: 5000 }) || []);
    (evaRecords || []).forEach((record) => add(record, "eva"));
    const directRecords = await this.readSuperMemoPlanPluginRecords();
    directRecords.forEach((record) => add(record, "direct"));
    console.info("[ProjectOverview][supermemo-plan.timeline-records]", {
      evaRecords: (evaRecords || []).filter((record) => isSuperMemoPlanRecord(record)).length,
      directRecords: directRecords.length,
      directCompletedRecords: directCompletedKeys.size,
      activeRecords: recordsByKey.size,
    });
    return Array.from(recordsByKey.values());
  }

  async attachSuperMemoPlanTimelineChildren(model, eva, groupingMode = DEFAULT_SETTINGS.groupingMode) {
    if (text(groupingMode, DEFAULT_SETTINGS.groupingMode) !== "timeline") return;
    const superMemoRecords = await this.collectSuperMemoPlanTimelineRecords(eva);
    if (superMemoRecords.length === 0) return;
    const expanded = this.expandSuperMemoPlanRelationNeighborhood(model, eva, superMemoRecords, 2);
    model.diagnostics.push({ code: "supermemo-plan.timeline-children", limit: expanded.addedRecords });
    console.info("[ProjectOverview][supermemo-plan.timeline-attach]", {
      status: "OK",
      activityCount: superMemoRecords.length,
      addedRecords: expanded.addedRecords,
      addedEdges: expanded.addedEdges,
    });
  }

  expandSuperMemoPlanRelationNeighborhood(model, eva, seedRecords, maxDepth = 2) {
    let addedRecords = 0;
    let addedEdges = 0;
    const queue = (seedRecords || [])
      .filter((record) => record?.nodeKey && !isCompletedSuperMemoPlanRecord(record))
      .map((record) => ({ record, depth: 0 }));
    const queued = new Set(queue.map((entry) => entry.record.nodeKey));
    while (queue.length > 0) {
      if (Object.keys(model.itemsByKey).length >= MODEL_LIMITS.maxNodes) break;
      const { record, depth } = queue.shift();
      const beforeRecordCount = Object.keys(model.itemsByKey).length;
      this.addRecordToModel(model, eva, record);
      if (Object.keys(model.itemsByKey).length > beforeRecordCount) addedRecords += 1;
      const snapshot = eva.getNodeRelationSnapshot?.(record.nodeKey) || { outgoing: [], incoming: [] };
      const relations = [...(snapshot.outgoing || []), ...(snapshot.incoming || [])];
      for (const relation of relations) {
        if (Object.keys(model.edgesById).length >= MODEL_LIMITS.maxEdges) break;
        const sourceRecord = relation.source || eva.getNodeRecord?.(relation.sourceNodeKey);
        const targetRecord = relation.target || eva.getNodeRecord?.(relation.targetNodeKey);
        for (const nextRecord of [sourceRecord, targetRecord]) {
          if (!nextRecord?.nodeKey) continue;
          if (isSuperMemoPlanRecord(nextRecord) && isCompletedSuperMemoPlanRecord(nextRecord)) continue;
          const before = Object.keys(model.itemsByKey).length;
          this.addRecordToModel(model, eva, nextRecord);
          if (Object.keys(model.itemsByKey).length > before) addedRecords += 1;
          if (depth < maxDepth && !queued.has(nextRecord.nodeKey)) {
            queued.add(nextRecord.nodeKey);
            queue.push({ record: nextRecord, depth: depth + 1 });
          }
        }
        const beforeEdgeCount = Object.keys(model.edgesById).length;
        this.addRelationEdge(model, relation);
        if (Object.keys(model.edgesById).length > beforeEdgeCount) addedEdges += 1;
      }
    }
    return { addedRecords, addedEdges };
  }

  sortGroupsForMode(groups = [], mode = DEFAULT_SETTINGS.groupingMode) {
    return (Array.isArray(groups) ? groups : [])
      .map((group, index) => ({
        group,
        index,
        level: this.getGroupCapsuleLevel(mode, group.id),
      }))
      .sort((a, b) => {
        const rankDiff = getCapsuleLevelRank(a.level) - getCapsuleLevelRank(b.level);
        return rankDiff || a.index - b.index;
      })
      .map((entry) => entry.group);
  }

  sortGroupsForCurrentView(groups = []) {
    const mode = this.settings.groupingMode || DEFAULT_SETTINGS.groupingMode;
    return this.sortGroupsForMode(groups, mode);
  }

  attachSuperMemoPlanToFirstTimelineGroup(model, groupingMode = DEFAULT_SETTINGS.groupingMode) {
    if (text(groupingMode, DEFAULT_SETTINGS.groupingMode) !== "timeline") return;
    Object.keys(model.itemsByKey || {}).forEach((nodeKey) => {
      const item = model.itemsByKey[nodeKey];
      if (isSuperMemoPlanRecord(item) && isCompletedSuperMemoPlanRecord(item)) delete model.itemsByKey[nodeKey];
    });
    const superMemoItems = Object.values(model.itemsByKey || {})
      .filter((item) => isSuperMemoPlanRecord(item) && !isCompletedSuperMemoPlanRecord(item))
      .sort((a, b) => {
        const orderDiff = getSuperMemoPlanOrder(a) - getSuperMemoPlanOrder(b);
        return orderDiff || text(a.label).localeCompare(text(b.label), "zh-CN", { numeric: true, sensitivity: "base" });
      });
    if (superMemoItems.length === 0 || !Array.isArray(model.groups) || model.groups.length === 0) return;
    Object.keys(model.edgesById || {}).forEach((edgeId) => {
      const edge = model.edgesById[edgeId];
      if (edge?.kind === "virtual-supermemo-plan-timeline" || edge?.kind === "virtual-supermemo-plan-first-timeline") delete model.edgesById[edgeId];
    });
    const displayGroups = this.sortGroupsForCurrentView(model.groups);
    const targetGroup = displayGroups.find((group) => {
      const primaryItem = model.itemsByKey?.[group.primaryNodeKey];
      return primaryItem?.columnId === "timeline" && !isSuperMemoPlanRecord(primaryItem);
    }) || displayGroups[0];
    const parentNodeKey = targetGroup.primaryNodeKey;
    const parentItem = model.itemsByKey?.[parentNodeKey];
    if (!parentNodeKey || !parentItem || isSuperMemoPlanRecord(parentItem)) {
      console.info("[ProjectOverview][supermemo-plan.timeline-first-group]", {
        status: "SKIP_NO_STABLE_PARENT",
        activityCount: superMemoItems.length,
      });
      return;
    }
    const firstGroupKeys = this.collectSuperMemoPlanFirstGroupKeys(model, superMemoItems, 2);
    firstGroupKeys.delete(parentNodeKey);
    model.groups = model.groups.filter((group) => {
      const primaryItem = model.itemsByKey?.[group.primaryNodeKey];
      return !isSuperMemoPlanRecord(primaryItem);
    });
    model.groups.forEach((group) => {
      group.itemKeys = (group.itemKeys || []).filter((key) => !firstGroupKeys.has(key));
      Object.keys(group.columns || {}).forEach((columnId) => {
        group.columns[columnId] = (group.columns[columnId] || []).filter((item) => !firstGroupKeys.has(item.nodeKey) && !(isSuperMemoPlanRecord(item) && isCompletedSuperMemoPlanRecord(item)));
      });
    });
    const existingKeys = new Set(targetGroup.itemKeys || []);
    const columnKeys = new Map(Object.keys(targetGroup.columns || {}).map((columnId) => [columnId, new Set((targetGroup.columns[columnId] || []).map((item) => item.nodeKey))]));
    let attached = 0;
    Array.from(firstGroupKeys).forEach((nodeKey) => {
      const item = model.itemsByKey?.[nodeKey];
      if (!item) return;
      if (!existingKeys.has(item.nodeKey)) {
        targetGroup.itemKeys.push(item.nodeKey);
        existingKeys.add(item.nodeKey);
      }
      const columnId = item.columnId;
      if (!targetGroup.columns[columnId]) targetGroup.columns[columnId] = [];
      if (!columnKeys.has(columnId)) columnKeys.set(columnId, new Set((targetGroup.columns[columnId] || []).map((entry) => entry.nodeKey)));
      if (!columnKeys.get(columnId).has(item.nodeKey)) {
        targetGroup.columns[columnId].push(item);
        columnKeys.get(columnId).add(item.nodeKey);
      }
      if (!isSuperMemoPlanRecord(item)) return;
      const edgeId = `virtual:supermemo-plan-first-timeline:${parentNodeKey}->${item.nodeKey}`;
      model.edgesById[edgeId] = {
        id: edgeId,
        sourceNodeKey: parentNodeKey,
        targetNodeKey: item.nodeKey,
        label: "SuperMemo Plan",
        kind: "virtual-supermemo-plan-first-timeline",
      };
      attached += 1;
    });
    Object.keys(targetGroup.columns || {}).forEach((columnId) => {
      targetGroup.columns[columnId] = (targetGroup.columns[columnId] || [])
        .filter((item) => !(isSuperMemoPlanRecord(item) && isCompletedSuperMemoPlanRecord(item)))
        .sort((a, b) => {
          if (a.nodeKey === parentNodeKey) return -1;
          if (b.nodeKey === parentNodeKey) return 1;
          return compareItemsByDepthLabel(a, b);
        });
    });
    targetGroup.itemCount = targetGroup.itemKeys.length;
    targetGroup.edgeCount = Object.values(model.edgesById || {}).filter((edge) => targetGroup.itemKeys.includes(edge.sourceNodeKey) && targetGroup.itemKeys.includes(edge.targetNodeKey)).length;
    targetGroup.hasRelations = targetGroup.edgeCount > 0;
    console.info("[ProjectOverview][supermemo-plan.timeline-first-group]", {
      status: "OK",
      parentNodeKey,
      groupId: targetGroup.id,
      attached,
      firstGroupItems: firstGroupKeys.size,
    });
  }

  collectSuperMemoPlanFirstGroupKeys(model, superMemoItems, maxDepth = 2) {
    const adjacency = new Map();
    Object.keys(model.itemsByKey || {}).forEach((nodeKey) => adjacency.set(nodeKey, new Set()));
    Object.values(model.edgesById || {}).forEach((edge) => {
      if (!edge?.sourceNodeKey || !edge?.targetNodeKey) return;
      if (edge.kind === "virtual-supermemo-plan-timeline" || edge.kind === "virtual-supermemo-plan-first-timeline") return;
      if (!adjacency.has(edge.sourceNodeKey) || !adjacency.has(edge.targetNodeKey)) return;
      adjacency.get(edge.sourceNodeKey).add(edge.targetNodeKey);
      adjacency.get(edge.targetNodeKey).add(edge.sourceNodeKey);
    });
    const result = new Set();
    const queue = superMemoItems.map((item) => ({ nodeKey: item.nodeKey, depth: 0 }));
    queue.forEach((entry) => result.add(entry.nodeKey));
    while (queue.length > 0) {
      const { nodeKey, depth } = queue.shift();
      if (depth >= maxDepth) continue;
      adjacency.get(nodeKey)?.forEach((nextKey) => {
        const nextItem = model.itemsByKey?.[nextKey];
        if (!nextItem) return;
        if (isSuperMemoPlanRecord(nextItem) && isCompletedSuperMemoPlanRecord(nextItem)) return;
        if (result.has(nextKey)) return;
        result.add(nextKey);
        queue.push({ nodeKey: nextKey, depth: depth + 1 });
      });
    }
    return result;
  }

  buildRelationGroups(model, groupingMode = "workspace") {
    const mode = GROUPING_MODES.find((item) => item.id === normalizeGroupingMode(groupingMode)) || GROUPING_MODES[0];
    const primaryColumnId = mode.primaryColumnId;
    const adjacency = new Map();
    Object.keys(model.itemsByKey || {}).forEach((nodeKey) => adjacency.set(nodeKey, new Set()));
    Object.values(model.edgesById || {}).forEach((edge) => {
      if (!adjacency.has(edge.sourceNodeKey) || !adjacency.has(edge.targetNodeKey)) return;
      adjacency.get(edge.sourceNodeKey).add(edge.targetNodeKey);
      adjacency.get(edge.targetNodeKey).add(edge.sourceNodeKey);
    });
    const primaryKeys = Object.values(model.itemsByKey || {})
      .filter((item) => item.columnId === primaryColumnId)
      .map((item) => item.nodeKey)
      .sort((a, b) => text(model.itemsByKey[a]?.label).localeCompare(text(model.itemsByKey[b]?.label), "zh-CN", { numeric: true, sensitivity: "base" }));
    const visitedPrimary = new Set();
    const groups = [];

    const collectDirectPrimaryCluster = (startKey) => {
      const cluster = [];
      const queue = [startKey];
      visitedPrimary.add(startKey);
      while (queue.length) {
        const current = queue.shift();
        cluster.push(current);
        adjacency.get(current)?.forEach((next) => {
          if (visitedPrimary.has(next)) return;
          if (model.itemsByKey[next]?.columnId !== primaryColumnId) return;
          visitedPrimary.add(next);
          queue.push(next);
        });
      }
      return cluster;
    };

    const collectGroupKeys = (primaryCluster) => {
      const keys = new Set(primaryCluster);
      primaryCluster.forEach((primaryKey) => {
        adjacency.get(primaryKey)?.forEach((next) => {
          if (model.itemsByKey[next]?.columnId === primaryColumnId) return;
          keys.add(next);
          adjacency.get(next)?.forEach((second) => {
            if (model.itemsByKey[second]?.columnId === primaryColumnId) return;
            keys.add(second);
          });
        });
      });
      return Array.from(keys);
    };

    primaryKeys.forEach((nodeKey) => {
      if (visitedPrimary.has(nodeKey)) return;
      const primaryCluster = collectDirectPrimaryCluster(nodeKey);
      const keys = collectGroupKeys(primaryCluster);
      const visibleKeys = keys.filter((key) => !isSuppressedOrdinaryNoteItem(model.itemsByKey[key]));
      const visibleKeySet = new Set(visibleKeys);
      const items = visibleKeys.map((key) => model.itemsByKey[key]).filter(Boolean);
      const edgeCount = Object.values(model.edgesById || {}).filter((edge) => visibleKeySet.has(edge.sourceNodeKey) && visibleKeySet.has(edge.targetNodeKey)).length;
      const primaryItem = model.itemsByKey[nodeKey] || items.find((item) => item.columnId === primaryColumnId) || items[0];
      const columns = Object.fromEntries(COLUMN_DEFS.map((column) => [column.id, []]));
      items.forEach((item) => columns[item.columnId]?.push(item));
      Object.values(columns).forEach((list) => list.sort(compareItemsByDepthLabel));
      groups.push({
        id: `${mode.id}:${primaryCluster.sort().join("|")}`,
        title: text(primaryItem?.label, "未命名项目"),
        mode: mode.id,
        primaryColumnId,
        primaryNodeKey: nodeKey,
        primaryNodeKeys: primaryCluster.slice().sort(),
        primarySiblingCount: primaryCluster.length,
        itemKeys: visibleKeys,
        columns,
        edgeCount,
        itemCount: items.length,
        hasRelations: edgeCount > 0,
      });
    });
    return groups.sort((a, b) => Number(b.hasRelations) - Number(a.hasRelations) || b.edgeCount - a.edgeCount || b.itemCount - a.itemCount || a.title.localeCompare(b.title, "zh-CN", { numeric: true, sensitivity: "base" }));
  }
  resolveStartRecords(eva, groupingMode = "workspace") {
    if (this.settings.startNodeKey && eva.getNodeRecord) {
      const fixed = eva.getNodeRecord(this.settings.startNodeKey);
      if (fixed) return [fixed];
    }
    const mode = GROUPING_MODES.find((item) => item.id === normalizeGroupingMode(groupingMode)) || GROUPING_MODES[0];
    if (mode.id !== "workspace") return this.resolvePrimaryRelationRecords(eva, mode.primaryColumnId);
    return this.resolveWorkspaceStartTabRecords(eva);
  }

  resolveWorkspaceStartTabRecords(eva) {
    if (!eva?.searchNodes) return [];
    const query = this.settings.startQuery || DEFAULT_START_QUERY;
    const results = eva.searchNodes(query, { limit: 240 }) || [];
    // r38: resolve the canonical source once per filter; workspace-mount resolveSourceFile falls back to a full vault
    // scan when the configured path is not exact, and this ran once per workspace record.
    const canonicalSourceNotePath = this.getCanonicalWorkspaceSourceNotePath();
    const canonicalKey = normalizeNotePathKey(canonicalSourceNotePath);
    const workspaceRecords = results.filter((record) => this.isCanonicalWorkspaceSourceRecord(record, canonicalKey));
    const tabChildren = this.filterStartTabChildren(workspaceRecords, query);
    const workspaceLikeCount = results.filter((record) => resolveBaseColumnId(record) === "workspace").length;
    console.info("[ProjectOverview][workspace-start-tab.search]", {
      query,
      results: results.length,
      workspace: workspaceRecords.length,
      workspaceLike: workspaceLikeCount,
      filteredNonCanonical: Math.max(0, workspaceLikeCount - workspaceRecords.length),
      canonicalSourceNotePath,
      tabChildren: tabChildren.length,
    });
    return (tabChildren.length > 0 ? tabChildren : workspaceRecords).slice(0, 160);
  }

  resolvePrimaryRelationRecords(eva, primaryColumnId) {
    const allRecords = typeof eva.getAllNodeRecords === "function"
      ? eva.getAllNodeRecords()
      : (eva.searchNodes?.("", { limit: 5000 }) || []);
    const records = (allRecords || [])
      .filter((record) => !(isSuperMemoPlanRecord(record) && isCompletedSuperMemoPlanRecord(record)))
      .filter((record) => resolveColumnId(record, { startNodeKeys: this.currentStartNodeKeys, workspaceStartNodeKeys: this.currentWorkspaceStartNodeKeys }) === primaryColumnId);
    const selected = records.filter((record) => {
      const snapshot = eva.getNodeRelationSnapshot?.(record.nodeKey) || { outgoing: [], incoming: [] };
      return [...(snapshot.outgoing || []), ...(snapshot.incoming || [])].some((relation) => {
        const other = relation.sourceNodeKey === record.nodeKey ? (relation.target || eva.getNodeRecord?.(relation.targetNodeKey)) : (relation.source || eva.getNodeRecord?.(relation.sourceNodeKey));
        return other && resolveColumnId(other, { workspaceStartNodeKeys: this.currentWorkspaceStartNodeKeys }) !== primaryColumnId;
      });
    });
    console.info("[ProjectOverview][primary-records.search]", { primaryColumnId, records: records.length, selected: selected.length });
    return selected.slice(0, 220);
  }

  filterStartTabChildren(records, query) {
    const target = text(query);
    return (records || []).filter((record) => {
      const haystack = `${record.pathLabel || ""} ${record.searchText || ""} ${decodeNodeKeyText(record.nodeKey)}`;
      return haystack.includes(target) && text(record.label) !== target;
    });
  }

  collectSeedRecords(eva, startRecords) {
    const records = new Map();
    const add = (record) => {
      if (record?.nodeKey && !records.has(record.nodeKey)) records.set(record.nodeKey, record);
    };
    (Array.isArray(startRecords) ? startRecords : [startRecords]).filter(Boolean).forEach(add);
    Array.from(records.values()).forEach((record) => {
      const snapshot = eva.getNodeRelationSnapshot?.(record.nodeKey);
      [...(snapshot?.outgoing || []), ...(snapshot?.incoming || [])].forEach((relation) => {
        add(relation.source);
        add(relation.target);
      });
    });
    return Array.from(records.values());
  }

  expandRecordsIntoModel(model, eva, seedRecords) {
    const queue = (seedRecords || []).filter((record) => !!record?.nodeKey).map((record) => ({ record, depth: 0 }));
    const queued = new Set(queue.map((entry) => entry.record.nodeKey));
    while (queue.length > 0) {
      if (Object.keys(model.itemsByKey).length >= MODEL_LIMITS.maxNodes) {
        model.diagnostics.push({ code: "max-nodes", limit: MODEL_LIMITS.maxNodes });
        break;
      }
      const { record, depth } = queue.shift();
      const result = this.addRecordToModel(model, eva, record);
      if (!result?.snapshot || depth >= MODEL_LIMITS.maxDepth) continue;
      const relations = [...(result.snapshot.outgoing || []), ...(result.snapshot.incoming || [])];
      for (const relation of relations) {
        if (Object.keys(model.edgesById).length >= MODEL_LIMITS.maxEdges) {
          model.diagnostics.push({ code: "max-edges", limit: MODEL_LIMITS.maxEdges });
          break;
        }
        const sourceRecord = relation.source || eva.getNodeRecord?.(relation.sourceNodeKey);
        const targetRecord = relation.target || eva.getNodeRecord?.(relation.targetNodeKey);
        [sourceRecord, targetRecord].forEach((nextRecord) => {
          if (!nextRecord?.nodeKey || queued.has(nextRecord.nodeKey) || model.itemsByKey[nextRecord.nodeKey]) return;
          queued.add(nextRecord.nodeKey);
          queue.push({ record: nextRecord, depth: depth + 1 });
        });
        this.addRelationEdge(model, relation);
      }
    }
  }

  addRecordToModel(model, eva, record) {
    if (isSuperMemoPlanRecord(record) && isCompletedSuperMemoPlanRecord(record)) return { added: false, snapshot: null };
    if (!record?.nodeKey || model.itemsByKey[record.nodeKey]) return { added: false, snapshot: null };
    const columnId = resolveColumnId(record, { startNodeKeys: model.startNodeKeys, workspaceStartNodeKeys: model.workspaceStartNodeKeys });
    if (!model.columnsById[columnId]) return { added: false, snapshot: null };
    const snapshot = eva.getNodeRelationSnapshot?.(record.nodeKey) || { outgoing: [], incoming: [] };
    model.itemsByKey[record.nodeKey] = {
      nodeKey: record.nodeKey,
      label: getDisplayLabel(record),
      pathLabel: text(record.pathLabel || record.notePath),
      notePath: text(record.notePath),
      viewType: text(record.viewType),
      viewLabel: text(record.viewLabel),
      metaFields: Array.isArray(record.metaFields) ? clone(record.metaFields, []) : [],
      sourcePlugin: text(record.sourcePlugin),
      contextCarrier: record.contextCarrier ? clone(record.contextCarrier, {}) : null,
      workspaceCarrierSourceType: getWorkspaceCarrierSourceType(record),
      carrierOrder: Number.isFinite(Number(record.order)) ? Number(record.order) : 999999,
      carrierOrderPath: Array.isArray(record.orderPath) ? clone(record.orderPath, []) : [],
      superMemoPlanStatus: getSuperMemoPlanStatusRobust(record),
      superMemoPlanOrder: getSuperMemoPlanOrder(record),
      columnId,
      outgoingCount: snapshot.outgoing?.length || 0,
      incomingCount: snapshot.incoming?.length || 0,
      depth: this.estimateDepth(record),
    };
    [...(snapshot.outgoing || []), ...(snapshot.incoming || [])].forEach((relation) => this.addRelationEdge(model, relation));
    return { added: true, snapshot };
  }

  addRelationEdge(model, relation) {
    if (!relation?.sourceNodeKey || !relation?.targetNodeKey) return;
    if (!model.itemsByKey[relation.sourceNodeKey] || !model.itemsByKey[relation.targetNodeKey]) return;
    if (Object.keys(model.edgesById).length >= MODEL_LIMITS.maxEdges) return;
    const edgeId = relation.id || `${relation.sourceNodeKey}->${relation.targetNodeKey}`;
    model.edgesById[edgeId] = {
      id: edgeId,
      sourceNodeKey: relation.sourceNodeKey,
      targetNodeKey: relation.targetNodeKey,
      label: text(relation.relationType, "关联"),
      kind: text(relation.kind, "relation"),
    };
  }

  estimateDepth(record) {
    const pathLabel = text(record.pathLabel);
    if (!pathLabel) return 0;
    return Math.max(0, Math.min(6, pathLabel.split(/\s*\/\s*|\s*>\s*/).length - 1));
  }
};
