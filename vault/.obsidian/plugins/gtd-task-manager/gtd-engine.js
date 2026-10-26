"use strict";
function allStopped(entries, classify) {
  return Array.isArray(entries) && entries.length > 0 && entries.every(x => typeof x?.keyword === "string" && x.keyword.trim() && classify(x.keyword) === true);
}


const GtdTrackingModule=(()=>{const modules={},cache={};
modules["./key-directory.cjs"]=(module,exports,require)=>{
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

};
modules["./consumer.cjs"]=(module,exports,require)=>{
'use strict';
const {copyKeys,FIELDS}=require('./key-directory.cjs');
const SNAPSHOT_FIELDS=['contractVersion','keyListVersion','coverage','status','createdAt','expiresAt','sourceScope','trackingProviderGeneration','evidenceRevision','inputEpoch','navEpoch','publicationRevision','stoppedLabels','contextKeys'];
function dataOnly(value,fields){return value&&Object.isFrozen(value)&&fields.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&Object.hasOwn(d,'value');});}
const labelKey=value=>typeof value==='string'?value.trim().replace(/\s+/g,' ').toLocaleLowerCase():'';
// Pure synchronous frame. Mount/focus/events/expiry scheduling belongs to a future view adapter.
function createConsumer({getProvider,getScope,clock=Date.now}){
 let frame=null,closed=false;
 const owned=new WeakMap();
 function at(){try{const n=clock();return Number.isFinite(n)?n:NaN;}catch{return NaN;}}
 function unknown(){return Object.freeze({status:'unknown',keys:null,classify:()=> 'unknown'});}
 function capture(){
  if(closed)return unknown();
  try{
   const provider=getProvider(),scope=getScope(),read=provider?.getContextTrackingVisibilitySnapshotV1;
   if(typeof read!=='function'||typeof scope!=='string'||!scope)return unknown();
   const snapshot=read.call(provider),now=at();
   if(!dataOnly(snapshot,SNAPSHOT_FIELDS)||snapshot.contractVersion!==1||snapshot.keyListVersion!==1||snapshot.coverage!=='observed-navigation'||snapshot.status!=='ready')return unknown();
   const {createdAt,expiresAt,sourceScope,trackingProviderGeneration,evidenceRevision,inputEpoch,navEpoch,publicationRevision}=snapshot;
   if(!Number.isFinite(createdAt)||!Number.isFinite(expiresAt)||!(now>=createdAt&&now<expiresAt))return unknown();
   if(![sourceScope,trackingProviderGeneration,evidenceRevision].every(x=>typeof x==='string'&&x.length>0))return unknown();
   if(![inputEpoch,navEpoch,publicationRevision].every(x=>Number.isSafeInteger(x)&&x>=0))return unknown();
   const labels=snapshot.stoppedLabels;
   if(!Array.isArray(labels)||!Object.isFrozen(labels)||labels.length>50000)return unknown();
   const stopped=new Set();
   for(let i=0,n=labels.length;i<n;i++){if(!Object.hasOwn(Object.getOwnPropertyDescriptor(labels,i)||{},'value'))return unknown();const label=labels[i];if(typeof label!=='string'||!label||label.length>4096)return unknown();stopped.add(label);}
   const inputKeys=snapshot.contextKeys;
   if(!Array.isArray(inputKeys)||!Object.isFrozen(inputKeys)||inputKeys.length>50000)return unknown();
   for(let i=0,n=inputKeys.length;i<n;i++){if(!Object.hasOwn(Object.getOwnPropertyDescriptor(inputKeys,i)||{},'value')||!dataOnly(inputKeys[i],FIELDS))return unknown();}
   const keys=copyKeys(inputKeys);
   if(closed||getProvider()!==provider||provider.getContextTrackingVisibilitySnapshotV1!==read||getScope()!==scope||!(at()>=createdAt&&at()<expiresAt))return unknown();
   const pass=Object.freeze({status:'ready',keys,semanticKey:JSON.stringify([sourceScope,trackingProviderGeneration,labels,keys]),classify:label=>stopped.has(labelKey(label))?'stopped':'unproven'});
   owned.set(pass,{provider,read,scope,snapshot,createdAt,expiresAt});
   return pass;
  }catch{return unknown();}
 }
 function runSync(fn){
  if(closed)return fn(unknown());
  if(frame)return fn(frame);
  const pass=capture();frame=pass;
  // A returned Promise is allowed, but the frame ends before any continuation.
  try{return fn(pass);}finally{frame=null;}
 }
 return Object.freeze({
  capture,
  current:()=>frame||capture(),
  runSync,
  isCurrent(pass){
   const token=owned.get(pass);if(!token||closed)return false;
   try{
    const {provider,read,scope,snapshot,createdAt,expiresAt}=token;
    if(getProvider()!==provider||getScope()!==scope||provider.getContextTrackingVisibilitySnapshotV1!==read)return false;
    const next=read.call(provider),now=at();
    return !closed&&getProvider()===provider&&getScope()===scope&&provider.getContextTrackingVisibilitySnapshotV1===read&&next===snapshot&&now>=createdAt&&now<expiresAt;
   }catch{return false;}
  },
  close(){closed=true;frame=null;}
 });
}
module.exports={createConsumer};

};
modules["./lifecycle.cjs"]=(module,exports,require)=>{
'use strict';
const {createConsumer}=require('./consumer.cjs');
function createLifecycle({getProvider,getScope,isVisible,isPending=()=>false,onState,onError=()=>{},clock=Date.now,schedule=setTimeout,cancel=clearTimeout,enqueue=queueMicrotask}){
 let closed=false,queued=false,timer=null,api=null,reader=null,scope=null,lastSignature=null,visible=false,attempts=0,lastRequest=-Infinity,force=false,focusArmed=true;
 function clear(){if(timer!==null){cancel(timer);timer=null;}}
 function fail(){clear();if(!closed)try{onError();}catch{}}
 function arm(delay){clear();if(!closed)timer=schedule(()=>{timer=null;try{check();}catch{fail();}},Math.max(1,delay));}
 function check(){
  if(closed)return;clear();
  if(!isVisible()){visible=false;return;}
  const next=getProvider(),nextRead=next?.getContextTrackingVisibilitySnapshotV1,nextScope=getScope(),now=clock();
  if(!Number.isFinite(now))return;
  const changed=next!==api||nextRead!==reader||nextScope!==scope;
  if(changed){attempts=0;lastRequest=-Infinity;lastSignature=null;}
  visible=true;api=next;reader=nextRead;scope=nextScope;
  let snapshot=null;try{snapshot=typeof reader==='function'?reader.call(api):null;}catch{}
  // Validate the already-read object with the same contract as the view. No extra provider read.
  const validationApi={getContextTrackingVisibilitySnapshotV1:()=>snapshot};
  const validation=createConsumer({getProvider:()=>validationApi,getScope:()=>nextScope,clock:()=>now});
  const ready=validation.capture().status==='ready';validation.close();
  let signature;try{signature=JSON.stringify([scope,ready?'ready':'pending',snapshot?.sourceScope,snapshot?.trackingProviderGeneration,ready?snapshot.contextKeys:null,ready?snapshot.stoppedLabels:null]);}catch{signature='pending';}
  // r30: a pending view repaints on a ready snapshot even when the signature is unchanged (provider object renewal).
  let stillPending=false;if(ready)try{stillPending=isPending()===true;}catch{}
  const repaint=force||signature!==lastSignature||stillPending;force=false;lastSignature=signature;
  if(repaint)try{onState();}catch{}
  if(closed||!isVisible())return;
  if(getProvider()!==next||next?.getContextTrackingVisibilitySnapshotV1!==nextRead||getScope()!==nextScope){poke();return;}
  if(ready){attempts=0;arm(snapshot.expiresAt-clock());return;}
  if(attempts>=3)return;
  const remaining=5000-(now-lastRequest);
  if(remaining>0){arm(remaining);return;}
  attempts++;lastRequest=now;
  try{const request=api?.requestContextTrackingVisibilityRefreshV1;if(typeof request==='function')Promise.resolve(request.call(api)).catch(()=>{});}catch{}
  if(closed)return;
  if(getProvider()!==next||next?.getContextTrackingVisibilitySnapshotV1!==nextRead||getScope()!==nextScope){poke();return;}
  if(!closed&&attempts<3)arm(5000);
 }
 function poke(reason='event'){
  if(closed)return;
  if(reason==='manual'){attempts=0;lastRequest=-Infinity;force=true;}
  if(reason==='local')force=true;
  if(reason==='focus'&&focusArmed){focusArmed=false;attempts=0;/* Keep cooldown across duplicate focus or close blur/focus. */}
  if(queued)return;queued=true;enqueue(()=>{queued=false;if(!closed)try{check();}catch{fail();}});
 }
 return Object.freeze({poke,blur(){focusArmed=true;},close(){closed=true;clear();}});
}
module.exports={createLifecycle};

};
modules["./gtd-adapter.cjs"]=(module,exports,require)=>{
'use strict';
const {createConsumer}=require('./consumer.cjs');
const {createLifecycle}=require('./lifecycle.cjs');
const EVENT='project-execution-overview:tracking-snapshot-changed-v1';
const EVENTS=['click','dblclick','auxclick','contextmenu','pointerdown','dragstart','dragenter','dragover','drop','keydown','keypress','beforeinput','input','change','paste','cut','compositionstart','compositionupdate','compositionend'];
function createAdapter({root,window,document,getProvider,getScope,isLive,canLeave,render,clock=Date.now,schedule=setTimeout,cancel=clearTimeout,enqueue=queueMicrotask}){
 let closed=false,depth=0,pending=true,paint=null,banner=null,started=false,holds=0;
 const dirty=new Set(),editors=new Set(),cleanups=[];
 const consumer=createConsumer({getProvider,getScope,clock});
 const textInput=e=>!!e?.matches?.('textarea,[contenteditable]')||(e?.tagName==='INPUT'&&!['checkbox','radio','button','submit','reset','range','color','hidden'].includes(e.type||'text'));
 const live=()=>!closed&&isLive()&&root.isConnected;
 const identity=()=>{const p=getProvider();return {provider:p,reader:p?.getContextTrackingVisibilitySnapshotV1,scope:getScope()};};
 const matches=i=>{const n=identity();return i.provider===n.provider&&i.reader===n.reader&&i.scope===n.scope;};
 function hasInput(){
  for(const e of dirty)if(!e.isConnected)dirty.delete(e);
  const focused=document.activeElement;
  return holds>0||!!document.querySelector?.('.modal-container')||[...editors].some(e=>e.live())||dirty.size>0
   ||!!(focused&&root.contains(focused)&&textInput(focused));
 }
 function showPending(message='追踪状态待核验，原画面已保留。'){
  pending=true;if(!live())return;
  root.setAttribute('aria-busy','true');
  if(!banner?.isConnected){
   banner=root.createDiv({cls:'gtd-tracking-pending-banner',attr:{role:'status','aria-live':'polite'}});root.insertBefore(banner,root.firstChild);
   banner.style.cssText='position:sticky;top:0;z-index:15;display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:10px;background:var(--background-primary);border:1px solid var(--background-modifier-border);border-left:3px solid var(--interactive-accent);border-radius:8px;color:var(--text-muted)';
   banner.createSpan({cls:'gtd-tracking-pending-label'});
   banner.createEl('button',{text:'重新核验',attr:{type:'button'}}).onclick=()=>{if(hasInput())showPending('请先完成当前编辑，输入已保留。');else lifecycle.poke('manual');};
  }
  banner.querySelector('.gtd-tracking-pending-label').textContent=message;
 }
 function prepare(pass){
  if(!live())return false;
  if(hasInput()||canLeave()!==true){showPending('请先完成当前编辑，输入已保留。');return false;}
  if(pass.status!=='ready'){showPending();return false;}return true;
 }
 function current(pass=consumer.current()){
  return live()&&!pending&&pass.status==='ready'&&!!paint&&matches(paint)&&paint.semanticKey===pass.semanticKey;
 }
 function run(fn){return consumer.runSync(pass=>{
  if(depth)return fn(pass);
  if(!prepare(pass))return false;
  const id=identity();depth++;
  try{
   const result=fn(pass);
   if(result?.then)throw Error('GTD_PROJECTION_ASYNC_PAINT');
   if(result===false||!live()||!matches(id)||!consumer.isCurrent(pass)){showPending();return false;}
   paint={...id,semanticKey:pass.semanticKey};pending=false;banner?.remove();banner=null;root.removeAttribute('aria-busy');
   return result===undefined?true:result;
  }catch(error){showPending('页面更新未完成，原输入已保留。');throw error;}finally{depth--;}
 });}
 function registerEditor(element,{inputs=[],controls=[],targetLive=()=>true}={}){
  const source=getScope();let removed=false,busy=false;
  const valid=()=>!removed&&live()&&element.isConnected&&getScope()===source&&targetLive();
  const nodes=new Set([...inputs,...controls]);
  const entry={live:valid,allows:event=>valid()&&!busy&&[...nodes].some(n=>n===event.target||n.contains?.(event.target))};editors.add(entry);
  return {live:valid,get busy(){return busy;},async save(fn){
   if(!valid()||busy)return false;busy=true;
   const states=[...element.querySelectorAll('input,textarea,button,select')].map(n=>[n,!!n.disabled]);states.forEach(([n])=>n.disabled=true);
   try{return await fn(valid);}catch(error){if(valid())showPending('保存未完成，输入已保留，请重试。');throw error;}
   finally{busy=false;states.forEach(([n,v])=>{if(n.isConnected)n.disabled=v;});}
  },close(){removed=true;editors.delete(entry);for(const n of [...dirty])if(element.contains(n))dirty.delete(n);},allow(nodesToAdd){nodesToAdd.forEach(n=>nodes.add(n));}};
 }
 function fence(event){
  const key=String(event.key||'').toLowerCase();
  if(event.target?.closest?.('.gtd-tracking-pending-banner,.gtd-history-banner'))return;
  if(event.type==='keydown'&&((event.ctrlKey||event.metaKey)&&['a','c'].includes(key)||['tab','shift','control','alt','meta','arrowleft','arrowright','arrowup','arrowdown','home','end','pageup','pagedown'].includes(key)))return;
  if([...editors].some(e=>e.allows(event)))return;
  // Existing ordinary fields may finish text editing, never admit unrelated stale buttons.
  if(live()&&dirty.has(event.target)&&event.target?.matches?.('input,textarea,[contenteditable]')
      &&['keydown','keypress','beforeinput','input','change','paste','cut','compositionstart','compositionupdate','compositionend'].includes(event.type))return;
  if(current())return;
  showPending();event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
 }
 EVENTS.forEach(e=>root.addEventListener(e,fence,true));cleanups.push(()=>EVENTS.forEach(e=>root.removeEventListener(e,fence,true)));
 const input=e=>{if(textInput(e.target))dirty.add(e.target);};root.addEventListener('input',input,true);cleanups.push(()=>root.removeEventListener('input',input,true));
 const lifecycle=createLifecycle({getProvider,getScope,isVisible:()=>live()&&document.visibilityState!=='hidden',isPending:()=>pending,onState:()=>{if(!current())render();},onError:()=>showPending(),clock,schedule,cancel,enqueue});
 function listen(target,event,fn){target.addEventListener(event,fn);cleanups.push(()=>target.removeEventListener(event,fn));}
 return Object.freeze({consumer,lifecycle,run,current,prepare,showPending,hasInput,registerEditor,
  stopped:label=>consumer.current().classify(label)==='stopped',keys:()=>consumer.current().keys||[],
  async wait(promise){const source=getScope();holds++;try{const result=await promise;return live()&&source===getScope()?result:null;}finally{holds--;/* Caller continuation owns its next action; no queued repaint here. */}},
  start(){if(started||closed)return;started=true;listen(window,EVENT,()=>lifecycle.poke());listen(window,'focus',()=>lifecycle.poke('focus'));listen(window,'blur',()=>lifecycle.blur());listen(document,'visibilitychange',()=>lifecycle.poke());lifecycle.poke('local');},
  close(){if(closed)return;closed=true;lifecycle.close();consumer.close();cleanups.splice(0).forEach(fn=>fn());editors.clear();dirty.clear();},
 });
}
module.exports={createAdapter,EVENT};

};
const load=id=>{if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;modules[id](m,m.exports,load);return m.exports;};return load("./gtd-adapter.cjs");})();

const { createHash } = require("crypto");

const GtdCreationModule=(()=>{const module={exports:{}};
'use strict';
const {createHash}=require('node:crypto');
const FIELD='managedContextCreationV1',copy=x=>JSON.parse(JSON.stringify(x)),plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=code=>{throw Object.assign(Error(code),{code})},hash=x=>createHash('sha256').update(x).digest('hex');
function parse(raw,array=false){if(typeof raw!=='string'||Buffer.byteLength(raw)>16*1024*1024)fail('GTD_CREATE_RAW');const d=JSON.parse(raw);if(array?!Array.isArray(d):!plain(d))fail('GTD_CREATE_SCHEMA');let count=0;const walk=(v,depth)=>{if(++count>300000||depth>64)fail('GTD_CREATE_LIMIT');if(v&&typeof v==='object')for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))fail('GTD_CREATE_UNSAFE');walk(v[k],depth+1)}};walk(d,0);return d}
function safeName(value){if(typeof value!=='string'||value!==value.trim()||!value||value.length>160||/[\\/:*?"<>|\x00-\x1f]/.test(value)||/[. ]$/.test(value)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)||value==='.'||value==='..')fail('GTD_CREATE_NOTE_NAME');return value}
function guard(before,after,kind){
 const a=parse(before,kind==='project'),b=parse(after,kind==='project');
 const receipts=d=>{
  const rows=kind==='tag'?Object.entries(d.tags||{}):kind==='keyword'?Object.entries(d.keywords||{}):d.map(x=>[x.id,x]);
  const seen=new Set(),result=[];
  for(const [key,x] of rows){if(!x||!Object.hasOwn(x,FIELD))continue;const r=x[FIELD];
   if(!plain(r)||typeof r.txId!=='string'||seen.has(r.txId)||(kind==='tag'?key!==r.tagId:kind==='project'?key!==r.projectId:x.tagId!==r.tagId))fail('GTD_CREATE_RECEIPT_BINDING');
   seen.add(r.txId);result.push(r);
  }return result;
 };
 const ar=receipts(a),br=receipts(b);
 if(ar.length!==br.length||ar.some(r=>!br.some(x=>equal(x,r))))fail('GTD_CREATE_RECEIPT_LOST');return after;
}
class GtdCreationOwner {
 constructor(config){this.c=config}
 plan(input){
  if(!/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.txId))fail('GTD_CREATE_TX');
  const scope=this.c.scope(),projectName=safeName(input.projectName),contextKey=input.contextKey;
  if(typeof contextKey!=='string'||contextKey!==contextKey.trim()||contextKey.length>512||!/^\d{3}[a-zA-Z0-9]*\s*[-－—]\s*\S/.test(contextKey)||/[\x00-\x1f]/.test(contextKey))fail('GTD_CREATE_KEY');
  for(const v of Object.values(scope))if(typeof v!=='string'||!v||/[\\:]/.test(v)||v.split('/').some(s=>!s||s==='.'||s==='..'))fail('GTD_CREATE_SCOPE');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.createdDate))fail('GTD_CREATE_DATE');
  return {version:1,txId:input.txId,...scope,projectName,contextKey,createdDate:input.createdDate,tagId:'context-'+input.txId.slice(7),projectId:'project-'+input.txId.slice(7),notePath:scope.folder+'/'+projectName+'.md'};
 }
 receipt(p){return {version:1,txId:p.txId,sourceNotePath:p.sourceNotePath,projectId:p.projectId,tagId:p.tagId,contextKey:p.contextKey}}
 note(p){return `<!-- managed-context-creation:${p.txId} -->\n创建时间: ${p.createdDate}\n\n# ${p.projectName}\n\n## 项目概述\n\n## 相关资料\n\n`}
 path(p,kind){return {tag:p.tagsPath,keyword:p.keywordsPath,project:p.dbPath,note:p.notePath}[kind]}
 validate(request){
  const r=request,p=r?.step?.plan,kind=r?.step?.id?.replace(/^gtd-/,'');
  if(!['tag','keyword','project','note'].includes(kind)||r.step.owner!=='gtd-task-manager'||r.step.contract!==1||!p||r.intent?.id!==p.txId||r.step.source!==p.sourceNotePath||r.intent.input?.projectName!==p.projectName||r.intent.input?.contextKey!==p.contextKey||typeof r.isCurrent!=='function')fail('GTD_CREATE_REQUEST');
  if(!equal(this.plan(p),p))fail('GTD_CREATE_PLAN_CHANGED');this.live(r);return {r,p,kind};
 }
 live(r){const result=r.isCurrent();if(result!==true||this.c.closed())fail('GTD_CREATE_LEASE');}
 state(raw,p,kind){
  const receipt=this.receipt(p),verified=()=>({state:'verified',receipt:{...receipt,nodeKey:`jump:v1:gtd|${encodeURIComponent(p.sourceNotePath)}|note|${encodeURIComponent(p.sourceNotePath)}|${encodeURIComponent(p.projectId)}`,notePath:p.notePath}});
  if(kind==='note'){if(raw===null)return {state:'absent'};return raw===this.note(p)?verified():{state:'conflict',reason:'GTD_CREATE_NOTE_COLLISION'}}
  if(raw===null)return {state:'unknown',reason:'GTD_CREATE_STORE_MISSING'};
  const d=parse(raw,kind==='project');let item,collision;
  if(kind==='tag'){
   if(!plain(d.tags))fail('GTD_CREATE_TAG_SCHEMA');item=d.tags[p.tagId];collision=Object.values(d.tags).some(t=>t?.label===p.projectName);
   if(item&&(item.label!==p.projectName||item.parentId!==null||item.isCategory!==false))return {state:'conflict',reason:'GTD_CREATE_TAG_CHANGED'};
  }else if(kind==='keyword'){
   if(!plain(d.keywords))fail('GTD_CREATE_KEYWORD_SCHEMA');item=d.keywords[p.contextKey.toLocaleLowerCase()];collision=Object.values(d.keywords).some(t=>t?.keyword?.toLocaleLowerCase()===p.contextKey.toLocaleLowerCase()||t?.tagId===p.tagId);
   if(item&&(item.keyword!==p.contextKey||item.tagId!==p.tagId))return {state:'conflict',reason:'GTD_CREATE_KEYWORD_CHANGED'};
  }else{
   const ids=new Set();for(const x of d){if(!x||typeof x.id!=='string'||ids.has(x.id))fail('GTD_CREATE_DB_SCHEMA');ids.add(x.id)}
   item=d.find(x=>x.id===p.projectId);collision=d.some(x=>x.type==='project'&&x.project===p.projectName);
   if(item&&(item.type!=='project'||item.status!=='active'||item.parentId!==null||item.project!==p.projectName||!Array.isArray(item.tags)||item.tags.length!==1||item.tags[0]!==p.tagId))return {state:'conflict',reason:'GTD_CREATE_PROJECT_CHANGED'};
  }
  if(item)return equal(item[FIELD],receipt)?verified():{state:'conflict',reason:'GTD_CREATE_UNOWNED_ID'};
  return collision?{state:'conflict',reason:'GTD_CREATE_NAME_COLLISION'}:{state:'absent'};
 }
 add(raw,p,kind){
  const d=parse(raw,kind==='project'),receipt=this.receipt(p);
  if(kind==='tag')d.tags[p.tagId]={label:p.projectName,icon:'🏷️',color:'#3498db',parentId:null,isCategory:false,order:Object.keys(d.tags).length,[FIELD]:receipt};
  else if(kind==='keyword')d.keywords[p.contextKey.toLocaleLowerCase()]={keyword:p.contextKey,tagId:p.tagId,[FIELD]:receipt};
  else d.push({id:p.projectId,type:'project',status:'active',created:p.createdDate,project:p.projectName,content:null,scheduled:null,deadline:null,isFirstClass:false,isFocusSession:false,isDimmed:false,isCollapsed:false,tags:[p.tagId],parentId:null,sortOrder:Math.max(0,...d.filter(x=>x.type==='project'&&!x.parentId).map(x=>Number(x.sortOrder)||0))+10,[FIELD]:receipt});
  return JSON.stringify(d,null,2);
 }
 async prepare(input){
  const p=this.plan(input),steps=[];for(const kind of ['tag','keyword','project','note']){if(this.c.closed())fail('GTD_CREATE_LEASE');const raw=await this.c.read(this.path(p,kind)),s=this.state(raw,p,kind);if(s.state!=='absent')fail(s.reason||'GTD_CREATE_EXISTS');steps.push({id:'gtd-'+kind,owner:'gtd-task-manager',source:p.sourceNotePath,contract:1,plan:copy(p),depends:steps.length?[steps.at(-1).id]:[]})}
  if(!equal(this.plan(p),p)||this.c.closed())fail('GTD_CREATE_SCOPE_CHANGED');return steps;
 }
 async publish(r,p,kind,raw,state){if(state.state==='verified'){try{this.live(r);await this.c.publish(kind,raw,p)}catch(e){state.uiWarning=/^GTD_CREATE_(MEMORY_CONFLICT|HISTORY_REFRESH_DEFERRED)$/.test(e?.message)?e.message:'GTD_CREATE_REFRESH_FAILED'}this.live(r)}return state}
 async inspect(request){const {r,p,kind}=this.validate(request),raw=await this.c.read(this.path(p,kind));this.live(r);const state=this.state(raw,p,kind);if(kind==='note'&&state.state==='absent'&&(r.receipts||[]).find(s=>s.id===r.step.id)?.attempts>0)return {state:'unknown',reason:'GTD_CREATE_NOTE_ATTEMPTED_BUT_MISSING'};return this.publish(r,p,kind,raw,state)}
 async commit(request){
  const {r,p,kind}=this.validate(request),target=this.path(p,kind);
  const run=async()=>{
   this.live(r);const raw=await this.c.read(target);this.live(r);const s=this.state(raw,p,kind);if(s.state==='verified')return this.publish(r,p,kind,raw,s);if(s.state!=='absent')fail(s.reason||'GTD_CREATE_NOT_ABSENT');
   if(kind==='note'){
    if((r.receipts||[]).find(s=>s.id===r.step.id)?.attempts>1)fail('GTD_CREATE_NOTE_AMBIGUOUS_RETRY');
    this.live(r);await this.c.createNote(target,this.note(p),()=>this.live(r));
   }else await this.c.process(target,current=>{this.live(r);if(!equal(this.plan(p),p))fail('GTD_CREATE_SCOPE_CHANGED');const status=this.state(current,p,kind);if(status.state==='verified')return current;if(status.state!=='absent')fail(status.reason||'GTD_CREATE_CONFLICT');return this.add(current,p,kind)});
   this.live(r);const after=await this.c.read(target);this.live(r);const result=this.state(after,p,kind);if(result.state!=='verified')fail('GTD_CREATE_READBACK');
   return this.publish(r,p,kind,after,result);
  };return kind==='keyword'?this.c.keywordQueue(p,run):run();
 }
}
module.exports={GtdCreationOwner,FIELD,guard,parse};

return module.exports;})();
module.exports = async function runGtdTaskManagerEngine(context) {
  if (context.hostLifecycleVersion !== 1 || typeof context.isHostCurrent !== "function") throw Error("GTD_HOST_LIFECYCLE_REQUIRED");
  const hostCurrent = () => { try { return context.isHostCurrent() === true; } catch (_) { return false; } };
  const assertHostCurrent = () => { if (!hostCurrent()) throw Error("GTD_HOST_INVALIDATED"); };
  assertHostCurrent();
  const app = context.app;
  const obsidian = context.obsidian;
  const moment = context.moment;
  const Notice = context.Notice;
  const TFile = context.TFile;
  const container = context.container;
    // Engine-owned UI state. Shared preferences seed once; foreign drafts never enter this host.
    const ui = Object.create(null);
    for (const key of ["gtdTagFilters", "gtdTagFilterExpanded", "gtdTagManagerMode", "gtdKaioKenMode", "gtdShowOnlyFirstClass", "gtdShowOnlyFocus", "gtdQuickNavCollapsed", "gtdRelationRevealState", "gtdRecentIds", "gtdTagKeywordArchiveExpanded", "gtdPendingQuickNavRevealProjectId", "gtdCurrentDragId", "gtdCurrentDragTagId", "gtdCurrentDragProjectId"]) {
        const value=window[key];
        try { ui[key]=value&&typeof value==='object'?JSON.parse(JSON.stringify(value)):value; } catch (_) {}
    }
    ui.gtdCommentDrawerState={isOpen:false,itemId:null,mode:'preview',draft:''};
    ui.gtdCommentPreviewComponent=null;
    let tracking=null,commentEditorLease=null,previewSerial=0,navigationInProgress=false;
    let navigationReceipt=null,pendingHistoryBoot=null;
    const isStoppedContextKeyword=keyword=>tracking?.stopped(keyword)===true;

  const sourceContext = context.sourceContext || {};
  const pluginDiag = context.pluginDiag || {};
  // Final JSON writes go only through the publisher bound to the plugin instance that rendered this engine.
  const centerPublisher = context.centerPublisher || null;
  const getCurrentFile = () => ({
    path: String(sourceContext.path || "GTD待办事项管理系统.md"),
    folder: String(sourceContext.folder || ""),
    name: String(sourceContext.name || String(sourceContext.path || "GTD待办事项管理系统.md").replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") || "GTD待办事项管理系统"),
    basename: String(sourceContext.name || String(sourceContext.path || "GTD待办事项管理系统.md").replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") || "GTD待办事项管理系统"),
  });
  const createRootEl = (tag, value = "", options = {}) => {
    let finalOptions = options || {};
    let textValue = value;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      finalOptions = value;
      textValue = "";
    }
    const nextOptions = Object.assign({}, finalOptions);
    if (textValue !== undefined && textValue !== null && String(textValue) !== "") nextOptions.text = String(textValue);
    return container.createEl(tag, nextOptions);
  };
  const createParagraph = (value) => container.createEl("p", { text: String(value == null ? "" : value) });

// ============================================================
// 🚀 GTD 管理系统 (v20.0 多标签筛选与Quick Nav标签版)
// 新增：多标签筛选 + Quick Nav 项目标签同步显示
// 调整：移除 Timeline 功能，降低操作阻力
// ====================================

return (async () => {

    // --- 0. 标签数据文件管理 ---
    const JSON_FILENAME = "GTD_Database.json";
    const TAGS_FILENAME = "GTD_Tags.json";
    const TAG_KEYWORDS_FILENAME = "GTD_TagKeywords.json";
    const currentFolder = getCurrentFile().folder;
    const currentNotePath = getCurrentFile().path;
    const DB_PATH = currentFolder + "/" + JSON_FILENAME;
    const TAGS_PATH = currentFolder + "/" + TAGS_FILENAME;
    const TAG_KEYWORDS_PATH = currentFolder + "/" + TAG_KEYWORDS_FILENAME;
    const TAG_FILTER_PRESETS_STORAGE_KEY = `gtd.tagFilterPresets::${DB_PATH}`;
    const RELATIONS_PLUGIN_ID = "eva-cross-view-relations";
    const GTD_RELATION_VIEW_TYPE = "gtd";
    const GTD_PLUGIN_HOST_ACTIVE = () => !!container?.dataset?.gtdPluginHost && !!container?.closest?.(".workspace-leaf.mod-active");
    const PROJECT_OVERVIEW_PLUGIN_ID = "project-execution-overview";
    const TOP_LEVEL_PROJECT_CARRIER_BATCH_CONTRACT_VERSION = 1;
    const TOP_LEVEL_PROJECT_CARRIER_BATCH_MAX_CONTEXTS = 500;

    // Private, non-reusable input identity; sequence is diagnostic, not the identity proof.
    let carrierInputVersion = {}, carrierInputSequence = 0;
    const carrierBatchInputs = new WeakMap();
    let carrierSavedWritePending = 0;
    const savedCarrierProviderGeneration = currentNotePath + "|saved-engine-v1:" + Date.now() + ":" + Math.random();
    const invalidateCarrierInput = () => { carrierInputVersion = {}; carrierInputSequence += 1; };
    let inputRevisionRefreshPending = 0;
    const inputRevisionRefreshTickets = new Map();

    // Managed creation stays inside the ready engine, using its real paths and memory.
    let managedGtdCreationOwner=null;
    const getManagedGtdCreationOwner=()=>managedGtdCreationOwner||(managedGtdCreationOwner=new GtdCreationModule.GtdCreationOwner({
        scope:()=>({sourceNotePath:currentNotePath,folder:currentFolder,tagsPath:TAGS_PATH,keywordsPath:TAG_KEYWORDS_PATH,dbPath:DB_PATH}),
        closed:()=>!isEngineLeaseLive(),
        read:async path=>await app.vault.adapter.exists(path)?await app.vault.adapter.read(path):null,
        process:async(path,patch)=>{invalidateCarrierInput();carrierSavedWritePending += 1;try{if(engineIsDisposed())throw Error('GTD_ENGINE_DISPOSED');if(!centerPublisher)throw Error('GTD_CENTER_CONSUMER_UNAVAILABLE');const cb=current=>{if(current===null)throw Error('GTD_CREATE_CAS_UNAVAILABLE');return patch(current)};if(path===DB_PATH)await centerPublisher.publishDatabase(path,cb,currentNotePath);else await centerPublisher.publish(path,cb,currentNotePath);refreshDataRevision(path)}finally{carrierSavedWritePending -= 1;invalidateCarrierInput()}},
        createNote:async(relative,raw,guard)=>{
            const fs=require('node:fs'),path=require('node:path'),base=app.vault.adapter.getBasePath?.();
            if(!base||!path.isAbsolute(base))throw Error('GTD_CREATE_DESKTOP_REQUIRED');
            const target=path.resolve(base,relative),parent=path.dirname(target),root=path.resolve(base);
            if(!target.startsWith(root+path.sep))throw Error('GTD_CREATE_NOTE_SCOPE');
            const check=()=>{guard();for(let p=parent;;p=path.dirname(p)){const s=fs.lstatSync(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error('GTD_CREATE_NOTE_LINK');if(path.dirname(p)===p)break}};
            check();const temp=path.join(parent,'.gtd-create-'+require('node:crypto').randomUUID()+'.tmp');
            const fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,raw,'utf8');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
            try{check();fs.linkSync(temp,target);guard();if(fs.readFileSync(target,'utf8')!==raw)throw Error('GTD_CREATE_NOTE_READBACK')}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
        },
        keywordQueue:(p,fn)=>{const owner=app.plugins?.plugins?.['gtd-task-manager']?.getContextRenameOwner?.();if(!owner)throw Error('GTD_CREATE_RENAME_OWNER_MISSING');return owner.enqueue({sourceNotePath:p.sourceNotePath,dataPath:p.tagsPath,keywordPath:p.keywordsPath},fn)},
        publish:async(kind,raw,p)=>{
            if(historySession)throw Error('GTD_CREATE_HISTORY_REFRESH_DEFERRED');
            const merge=(store,key,value)=>{if(Object.hasOwn(store,key)&&JSON.stringify(store[key])!==JSON.stringify(value))throw Error('GTD_CREATE_MEMORY_CONFLICT');return {...store,[key]:JSON.parse(JSON.stringify(value))}};
            // r33 G1: publish only when engine memory actually changes. Inspecting already-merged data is a no-op (no carrier-input
            // invalidation, no repaint, no carrier-changed event); conflicts still throw; 'note' never changes engine memory.
            const tagValue=kind==='tag'?JSON.parse(raw).tags[p.tagId]:undefined;
            const kwKey=kind==='keyword'?p.contextKey.toLocaleLowerCase():'';
            const kwValue=kind==='keyword'?normalizeTagKeywordStore(JSON.parse(raw)).keywords[kwKey]:undefined;
            const projValue=kind==='project'?JSON.parse(raw).find(x=>x.id===p.projectId):undefined;
            const projMatches=kind==='project'?gtdList.filter(x=>x.id===p.projectId):[];
            if(kind==='project'&&(projMatches.length>1||projMatches.length&&JSON.stringify(projMatches[0])!==JSON.stringify(projValue)))throw Error('GTD_CREATE_MEMORY_CONFLICT');
            const changed=kind==='tag'?!Object.hasOwn(TAG_DEFINITIONS,p.tagId):kind==='keyword'?!Object.hasOwn(TAG_KEYWORD_STORE.keywords,kwKey):kind==='project'?!projMatches.length:false;
            if(!changed){if(kind==='tag')merge(TAG_DEFINITIONS,p.tagId,tagValue);if(kind==='keyword')merge(TAG_KEYWORD_STORE.keywords,kwKey,kwValue);return;}
            invalidateCarrierInput();
            if(kind==='tag')TAG_DEFINITIONS=merge(TAG_DEFINITIONS,p.tagId,tagValue);
            if(kind==='keyword'){const stamp=Object.getOwnPropertyDescriptor(TAG_KEYWORD_STORE,Symbol.for('contextKeyRenameGeneration'));const next={...TAG_KEYWORD_STORE,keywords:merge(TAG_KEYWORD_STORE.keywords,kwKey,kwValue)};if(stamp)Object.defineProperty(next,Symbol.for('contextKeyRenameGeneration'),stamp);TAG_KEYWORD_STORE=next}
            if(kind==='project')gtdList=[...gtdList,projValue];
            if(renderViewFn)renderViewFn();dispatchContextCarrierChanged('managed-context-created');
        }
    }));
    // engineDisposed is declared near the end of the engine; until that line runs (startup repair)
    // reading it throws a TDZ ReferenceError, and the engine cannot have been disposed yet.
    const engineIsDisposed=()=>{if(!hostCurrent())return true;try{return engineDisposed===true}catch(e){if(e instanceof ReferenceError)return false;throw e}};
    const managedGtdPersist=async(path,raw,kind,formGuard)=>{
        invalidateCarrierInput();
        carrierSavedWritePending += 1;
        try {
        if(engineIsDisposed())throw Error('GTD_ENGINE_DISPOSED');
        if(!centerPublisher)throw Error('GTD_CENTER_CONSUMER_UNAVAILABLE');
        const payload=current=>{if(formGuard){if(!formGuard.live()||formGuard.expectedRaw===undefined||current!==formGuard.expectedRaw)throw Error('GTD_TAG_SOURCE_CHANGED');}return current===null?raw:GtdCreationModule.guard(current,raw,kind);};
        if(kind==='project')await centerPublisher.publishDatabase(path,payload,currentNotePath);
        else await centerPublisher.publish(path,payload,currentNotePath);
        } finally { carrierSavedWritePending -= 1; invalidateCarrierInput(); }
    };

    // 默认标签定义（首次使用或文件不存在时）
    const DEFAULT_TAG_DEFINITIONS = {
        "work-type":     { label: "工作类型", icon: "📋", color: "#7f8c8d", parentId: null, isCategory: true, order: 0 },
        "system":        { label: "架构设计", icon: "🏗️", color: "#9b59b6", parentId: "work-type", isCategory: false, order: 0 },
        "learning":      { label: "学习钻研", icon: "📚", color: "#3498db", parentId: "work-type", isCategory: false, order: 1 },
        "review":        { label: "复盘沉淀", icon: "💡", color: "#f1c40f", parentId: "work-type", isCategory: false, order: 2 },
        "urgent":        { label: "紧急救火", icon: "🔥", color: "#e74c3c", parentId: "work-type", isCategory: false, order: 3 },
        "waiting":       { label: "外部等待", icon: "⏳", color: "#95a5a6", parentId: "work-type", isCategory: false, order: 4 },
        "domain":        { label: "能力域", icon: "🎯", color: "#2c3e50", parentId: null, isCategory: true, order: 1 },
        "tech":          { label: "技术能力", icon: "⚙️", color: "#1abc9c", parentId: "domain", isCategory: false, order: 0 },
        "mgmt":          { label: "管理能力", icon: "👔", color: "#e67e22", parentId: "domain", isCategory: false, order: 1 },
        "personal":      { label: "个人发展", icon: "🌱", color: "#27ae60", parentId: "domain", isCategory: false, order: 2 },
        "priority":      { label: "紧急程度", icon: "⚡", color: "#8e44ad", parentId: null, isCategory: true, order: 2 },
        "p1-critical":   { label: "P1-紧急", icon: "🔴", color: "#c0392b", parentId: "priority", isCategory: false, order: 0 },
        "p2-high":       { label: "P2-重要", icon: "🟠", color: "#d35400", parentId: "priority", isCategory: false, order: 1 },
        "p3-normal":     { label: "P3-正常", icon: "🟡", color: "#f39c12", parentId: "priority", isCategory: false, order: 2 },
        "p4-low":        { label: "P4-低", icon: "🟢", color: "#27ae60", parentId: "priority", isCategory: false, order: 3 }
    };

    // 从文件加载标签定义
    let tagDefinitionRawEvidence; // undefined=unknown, null=confirmed absent, string=confirmed raw
    const loadTagDefinitions = async () => {
        try {
            if (await app.vault.adapter.exists(TAGS_PATH)) {
                const content = await app.vault.adapter.read(TAGS_PATH);
                const data = JSON.parse(content);
                if(data.tags && typeof data.tags==='object' && !Array.isArray(data.tags))tagDefinitionRawEvidence=content;
                return data.tags || DEFAULT_TAG_DEFINITIONS;
            } else { tagDefinitionRawEvidence=null; }
        } catch (e) {
            console.error("加载标签定义失败:", e);
        }
        return DEFAULT_TAG_DEFINITIONS;
    };

    // 保存标签定义到文件
    const saveTagDefinitions = async (tags, formGuard) => { if (historySession && externalWriteDepth === 0) return rejectHistoryWrite("saveTagDefinitions");
        const data = {
            tags: tags,
            version: "1.0",
            lastModified: moment().format("YYYY-MM-DD HH:mm:ss")
        };
        const jsonString = JSON.stringify(data, null, 2);
        await managedGtdPersist(TAGS_PATH, jsonString, 'tag', formGuard);
        tagDefinitionRawEvidence=jsonString;
        refreshDataRevision(TAGS_PATH);
        dispatchContextCarrierChanged("gtd-tag-definitions-saved", { revision: data.lastModified });
        return jsonString;
    };

    const normalizeTagKeywordKey = (value) => String(value || "").trim().toLowerCase();
    const parseContextCapsuleAddress = (value) => {
        const match = String(value || "").trim().match(/^([0-9]{1,4}[A-Za-z0-9]*)\s*[-－—–]/);
        return match ? String(match[1] || "").trim().toUpperCase() : "";
    };
    const parseContextCapsuleLabel = (value) => {
        const raw = String(value || "").trim();
        const match = raw.match(/^([0-9]{1,4}[A-Za-z0-9]*)\s*[-－—–]\s*(.*)$/);
        if (!match) return { address: "", canonicalLabel: raw, displayLabel: raw };
        const address = String(match[1] || "").trim().toUpperCase();
        const canonicalLabel = String(match[2] || "").trim();
        return {
            address,
            canonicalLabel,
            displayLabel: canonicalLabel ? `${address}- ${canonicalLabel}` : address,
        };
    };
    const normalizeContextCapsuleKeyEntry = (entry = {}) => {
        if (!entry || typeof entry !== "object") return null;
        const contextKeyId = String(entry.contextKeyId || entry.id || "").trim();
        const address = String(entry.address || "").trim().toUpperCase();
        const canonicalLabel = String(entry.canonicalLabel || entry.label || entry.displayLabel || "").trim();
        const displayLabel = String(entry.displayLabel || (address && canonicalLabel ? `${address}- ${canonicalLabel}` : canonicalLabel || address)).trim();
        if (!contextKeyId || !displayLabel) return null;
        return {
            contextKeyId,
            address,
            canonicalLabel,
            displayLabel,
            color: String(entry.color || "").trim(),
            icon: String(entry.icon || "").trim(),
            source: String(entry.source || PROJECT_OVERVIEW_PLUGIN_ID).trim(),
        };
    };
    const normalizeContextCapsuleKeyList = (entries = []) => {
        const byId = new Map();
        (Array.isArray(entries) ? entries : []).forEach((entry) => {
            const key = normalizeContextCapsuleKeyEntry(entry);
            if (!key || byId.has(key.contextKeyId)) return;
            byId.set(key.contextKeyId, key);
        });
        return Array.from(byId.values()).sort((left, right) => {
            if (left.address && right.address) return left.address.localeCompare(right.address, "zh-CN", { numeric: true });
            if (left.address) return -1;
            if (right.address) return 1;
            return left.displayLabel.localeCompare(right.displayLabel, "zh-CN", { numeric: true, sensitivity: "base" });
        });
    };
    const getProjectOverviewApi = () => window.__projectExecutionOverviewPluginApi || app.plugins?.plugins?.[PROJECT_OVERVIEW_PLUGIN_ID]?.api || null;
    const getContextCapsuleKeysSync = () => normalizeContextCapsuleKeyList(tracking?.keys() || []);
    const buildContextCapsuleKeyLookup = (prefetchedKeys = undefined) => {
        const keys = prefetchedKeys === undefined
            ? getContextCapsuleKeysSync()
            : normalizeContextCapsuleKeyList(Array.isArray(prefetchedKeys) ? prefetchedKeys : []);
        const byDisplay = new Map();
        const byAnyLabel = new Map();
        keys.forEach((key) => {
            const displayKey = normalizeTagKeywordKey(key.displayLabel);
            const canonicalKey = normalizeTagKeywordKey(key.canonicalLabel);
            if (displayKey && !byDisplay.has(displayKey)) byDisplay.set(displayKey, key);
            [displayKey, canonicalKey].filter(Boolean).forEach((candidate) => {
                if (!byAnyLabel.has(candidate)) byAnyLabel.set(candidate, key);
            });
        });
        return { __contextCapsuleKeyLookup: true, keys, byDisplay, byAnyLabel };
    };
    const asContextCapsuleKeyLookup = (prefetched = undefined) => {
        if (prefetched?.__contextCapsuleKeyLookup === true) return prefetched;
        return buildContextCapsuleKeyLookup(prefetched);
    };
    const getContextCapsuleKeyForKeyword = (keywordLike = "", prefetched = undefined) => {
        const normalized = normalizeTagKeywordKey(keywordLike);
        const parsedKeyword = parseContextCapsuleLabel(keywordLike);
        const address = normalizeTagKeywordKey(parsedKeyword.address);
        const displayLabel = normalizeTagKeywordKey(parsedKeyword.displayLabel);
        if (!normalized) return null;
        const lookup = asContextCapsuleKeyLookup(prefetched);
        if (address) return (displayLabel && lookup.byDisplay.get(displayLabel)) || null;
        return lookup.byAnyLabel.get(normalized) || null;
    };
    const getVirtualContextCapsuleKeysForTagKeywords = (keywordEntries = [], prefetched = undefined) => {
        const assignedKeys = new Set();
        const assignedLabelsWithoutAddress = new Set();
        (Array.isArray(keywordEntries) ? keywordEntries : []).forEach((entry) => {
            const keyword = String(entry?.keyword || entry || "").trim();
            const keywordKey = normalizeTagKeywordKey(keyword);
            const parsedKeyword = parseContextCapsuleLabel(keyword);
            if (parsedKeyword.address) {
                if (parsedKeyword.displayLabel) assignedKeys.add(normalizeTagKeywordKey(parsedKeyword.displayLabel));
                if (keywordKey) assignedKeys.add(keywordKey);
            } else if (keywordKey) {
                assignedKeys.add(keywordKey);
                assignedLabelsWithoutAddress.add(keywordKey);
            }
        });
        return asContextCapsuleKeyLookup(prefetched).keys.filter((key) => {
            const displayKey = normalizeTagKeywordKey(key.displayLabel);
            const addressKey = normalizeTagKeywordKey(key.address);
            const labelKey = normalizeTagKeywordKey(key.canonicalLabel);
            if (displayKey && assignedKeys.has(displayKey)) return false;
            if (!addressKey && labelKey && assignedLabelsWithoutAddress.has(labelKey)) return false;
            return true;
        });
    };
    const getContextCapsuleSortLabel = (value) => parseContextCapsuleAddress(value) || String(value || "").trim();
    const normalizeTagKeywordList = (values = []) => {
        const result = [];
        const seen = new Set();
        (Array.isArray(values) ? values : []).forEach((value) => {
            const keyword = String(value || "").trim();
            const key = normalizeTagKeywordKey(keyword);
            if (!keyword || !key || seen.has(key)) return;
            seen.add(key);
            result.push(keyword);
        });
        return result;
    };
    const normalizeTagKeywordStore = (raw = {}) => {
        const keywords = {};
        Object.entries(raw?.keywords || {}).forEach(([key, value]) => {
            const keyword = String(value?.keyword || key || "").trim();
            const normalizedKey = normalizeTagKeywordKey(keyword);
            const tagId = String(value?.tagId || "").trim();
            if (!normalizedKey || !keyword || !tagId) return;
            keywords[normalizedKey] = { tagId, keyword, ...(value?.managedContextCreationV1 ? {managedContextCreationV1: JSON.parse(JSON.stringify(value.managedContextCreationV1))} : {}) };
        });
        const result = {
            schemaVersion: 1,
            updatedAt: raw?.updatedAt || "",
            keywords
        };
        // Center naming receipts are kept verbatim; a malformed value refuses the load/save.
        if (raw && raw.centerNamingProjectionV1 !== undefined) {
            const receipts = raw.centerNamingProjectionV1;
            if (!receipts || typeof receipts !== "object" || Array.isArray(receipts)) throw new Error("gtd-center-receipts-invalid");
            result.centerNamingProjectionV1 = JSON.parse(JSON.stringify(receipts));
        }
        if (raw[Symbol.for("contextKeyRenameGeneration")]) Object.defineProperty(result, Symbol.for("contextKeyRenameGeneration"), { value: raw[Symbol.for("contextKeyRenameGeneration")], configurable: true });
        return result;
    };
    let TAG_KEYWORDS_LOAD_FAILED = false;
    const loadTagKeywords = async () => {
        try {
            const renameOwner = app.plugins?.plugins?.["gtd-task-manager"]?.getContextRenameOwner?.();
            const readToken = renameOwner?.token({ keywordPath: TAG_KEYWORDS_PATH });
            if (!(await app.vault.adapter.exists(TAG_KEYWORDS_PATH))) {
                return normalizeTagKeywordStore();
            }
            const content = await app.vault.adapter.read(TAG_KEYWORDS_PATH);
            return renameOwner?.stamp(normalizeTagKeywordStore(JSON.parse(content)), { keywordPath: TAG_KEYWORDS_PATH }, readToken) || normalizeTagKeywordStore(JSON.parse(content));
        } catch (e) {
            TAG_KEYWORDS_LOAD_FAILED = true;
            console.error("[GTD][tag-keywords][load-fail]", e);
            return normalizeTagKeywordStore();
        }
    };
    const saveTagKeywords = async (store) => { if (historySession && externalWriteDepth === 0) return rejectHistoryWrite("saveTagKeywords");
        const plugin = app.plugins?.plugins?.["gtd-task-manager"];
        const owner = plugin?.getContextRenameOwner?.();
        if (!owner) throw new Error("gtd-rename-owner-unavailable");
        const scope = { sourceNotePath: currentNotePath, dataPath: TAGS_PATH, keywordPath: TAG_KEYWORDS_PATH };
        return owner.enqueue(scope, async () => {
            owner.assertLive();
            await owner.assertFreshSave(scope, store);
            return await saveTagKeywordsQueued(store);
        });
    };
    const saveTagKeywordsQueued = async (store) => {
        if (TAG_KEYWORDS_LOAD_FAILED) {
            new Notice("⚠️ 标签关键词文件读取失败，已阻止覆盖写入");
            throw new Error("GTD tag keywords load failed; refuse to overwrite");
        }
        const data = normalizeTagKeywordStore(store);
        data.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");
        const jsonString = JSON.stringify(data, null, 2);
        await managedGtdPersist(TAG_KEYWORDS_PATH, jsonString, 'keyword');
        refreshDataRevision(TAG_KEYWORDS_PATH);
        console.log("[GTD][tag-keywords][save]", {
            status: "OK",
            count: Object.keys(data.keywords || {}).length
        });
        dispatchContextCarrierChanged("gtd-tag-keywords-saved", { revision: data.updatedAt });
        return data;
    };

    // 加载标签定义
    // Per-file revision (mtime:size). An engine write refreshes only the file it wrote, so an outside
    // change to another file is never absorbed as "fresh".
    const REVISION_PATHS = [DB_PATH, TAGS_PATH, TAG_KEYWORDS_PATH];
    const statRevisionPart = async (path) => {
        const stat = await app.vault.adapter.stat(path);
        return stat ? `${stat.mtime}:${stat.size}` : "none";
    };
    const statDataRevision = async () => {
        try {
            const parts = {};
            for (const path of REVISION_PATHS) parts[path] = await statRevisionPart(path);
            return parts;
        } catch (e) { return null; }
    };
    let dataRevision = await statDataRevision();
    assertHostCurrent();
    const refreshDataRevision = (path) => {
        if (!dataRevision || !REVISION_PATHS.includes(path)) return;
        invalidateCarrierInput();
        const ticket = {};
        inputRevisionRefreshTickets.set(path, ticket);
        inputRevisionRefreshPending += 1;
        void statRevisionPart(path).then((part) => {
            if (inputRevisionRefreshTickets.get(path) === ticket && dataRevision) dataRevision[path] = part;
        }).catch(() => {
            if (inputRevisionRefreshTickets.get(path) === ticket) dataRevision = null;
        }).finally(() => {
            inputRevisionRefreshPending -= 1;
            invalidateCarrierInput();
        });
    };
    let TAG_DEFINITIONS = await loadTagDefinitions();
    assertHostCurrent();
    let TAG_KEYWORD_STORE = await loadTagKeywords();
    assertHostCurrent();
    let gtdList = [];
    let contextCarrierChangedTimer = null;
    const buildGtdStructuralMetaFields = (item = {}) => {
        const parentId = String(item?.parentId || "").trim();
        return [
            { label: "Type", value: String(item?.type || "").trim() },
            { label: "Parent ID", value: parentId },
            { label: "Top Level", value: parentId ? "false" : "true" },
            { label: "Project", value: String(item?.project || "").trim() },
            { label: "Tags", value: (Array.isArray(item?.tags) ? item.tags : []).map((tagId) => TAG_DEFINITIONS[tagId]?.label || tagId).join(", ") },
            { label: "Note", value: currentNotePath }
        ];
    };
    const getContextCarrierRevision = () => {
        const activeItems = Array.isArray(gtdList) ? gtdList.filter((item) => item && item.status === "active") : [];
        const maxItemStamp = activeItems.reduce((max, item) => {
            const stamp = String(item?.updatedAt || item?.modifiedAt || item?.createdAt || item?.created || item?.id || "");
            return stamp > max ? stamp : max;
        }, "");
        return [
            currentNotePath || "",
            `active:${activeItems.length}`,
            `items:${Array.isArray(gtdList) ? gtdList.length : 0}`,
            `max:${maxItemStamp}`,
            `tags:${Object.keys(TAG_DEFINITIONS || {}).length}`,
            `keywords:${Object.keys(TAG_KEYWORD_STORE?.keywords || {}).length}`,
            `kwUpdated:${String(TAG_KEYWORD_STORE?.updatedAt || "")}`
        ].join("|");
    };
    const dispatchContextCarrierChanged = (reason = "gtd-data-changed", detail = {}) => {
        if (contextCarrierChangedTimer) window.clearTimeout?.(contextCarrierChangedTimer);
        const payload = Object.assign({}, detail, {
            providerId: "gtd-task-manager",
            revision: String(detail?.revision || getContextCarrierRevision()),
            reason: String(reason || "gtd-data-changed"),
            timestamp: Date.now()
        });
        contextCarrierChangedTimer = window.setTimeout?.(() => {
            contextCarrierChangedTimer = null;
            window.dispatchEvent?.(new CustomEvent("context-capsule-carrier:changed", { detail: payload }));
        }, 180);
    };

    const getTagKeywords = (tagId) => {
        const targetId = String(tagId || "").trim();
        return Object.values(TAG_KEYWORD_STORE?.keywords || {})
            .filter((entry) => entry?.tagId === targetId)
            .map((entry) => entry.keyword)
            .sort((a, b) => String(a).localeCompare(String(b), "zh-CN", { numeric: true, sensitivity: "base" }));
    };
    const isStoppedContextTagRaw = id => allStopped(getTagKeywords(id).map(keyword => ({ keyword })), isStoppedContextKeyword);
    // Native read-only history session (N3). In-memory only; never written anywhere.
    let historySession = null;
    let historySessionSerial = 0;
    let externalWriteDepth = 0;
    let renderGeneration = 0;
    let historyNoticeAt = 0;
    let historyFenceCleanup = null;
    let deferredRepairWrite = false;
    const isStoppedContextTag = id => historySession ? false : isStoppedContextTagRaw(id);
    const HISTORY_GLOBALS = ["gtdTagFilters", "gtdTagFilterExpanded", "gtdTagManagerMode", "gtdKaioKenMode", "gtdShowOnlyFirstClass", "gtdShowOnlyFocus",
        "gtdQuickNavCollapsed", "gtdRelationRevealState", "gtdRecentIds", "gtdTagKeywordArchiveExpanded"];
    const cloneHistoryGlobal = value => (value && typeof value === "object") ? JSON.parse(JSON.stringify(value)) : value;
    const historyCollapsedFor = item => {
        const map = historySession?.collapsed;
        if (item?.id && map?.has(item.id)) return map.get(item.id) === true;
        return Boolean(item?.isCollapsed);
    };
    const rejectHistoryWrite = (op, quiet = false) => {
        console.info("[GTD][context-history.write-blocked]", { op });
        const now = Date.now();
        if (!quiet && now - historyNoticeAt > 2500) { historyNoticeAt = now; new Notice("历史回看为只读；点「返回当前」后再编辑。"); }
        return false;
    };
    const withExternalWrite = async (run) => {
        if (engineIsDisposed()) throw new Error("GTD_ENGINE_DISPOSED");
        externalWriteDepth += 1;
        try { return await run(); } finally { externalWriteDepth -= 1; }
    };
    const uninstallHistoryFence = () => { if (historyFenceCleanup) { historyFenceCleanup(); historyFenceCleanup = null; } };
    const installHistoryFence = () => {
        uninstallHistoryFence();
        const allow = ".gtd-history-banner button, .gtd-history-collapse-toggle, .proj-nav-toggle, .proj-nav-row, .tag-filter-btn, .tag-preset-chip";
        const deny = ".proj-nav-tag-edit, .tag-filter-icon-btn, .tag-preset-btn";
        const navigationKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", "Tab", "Shift", "Control", "Alt", "Meta"]);
        const plainSummaryClick = (target) => {
            const summary = target?.closest?.("summary");
            if (!summary || !container.contains(summary)) return false;
            for (let el = target; el && el !== summary; el = el.parentElement) {
                if (typeof el.onclick === "function" || /^(BUTTON|A|INPUT|TEXTAREA|SELECT|LABEL)$/.test(el.tagName || "")) return false;
            }
            return true;
        };
        const block = (event) => {
            if (!historySession) return;
            const target = event.target instanceof Element ? event.target : (event.target?.parentElement || null);
            if (target?.closest?.(".gtd-history-banner")) return;
            if (event.type === "keydown") {
                if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); exitHistory(); return; }
                if (navigationKeys.has(event.key)) return;
                if ((event.ctrlKey || event.metaKey) && !event.altKey && ["c", "a"].includes(String(event.key).toLowerCase())) return;
            } else if (event.type === "click" && target && !target.closest(deny)) {
                if (target.closest(allow) || plainSummaryClick(target)) return;
                const link = target.closest("a.internal-link");
                if (link && typeof link.onclick === "function") return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            if (["click", "dblclick", "contextmenu", "drop"].includes(event.type)) rejectHistoryWrite("interaction:" + event.type);
        };
        const types = ["click", "dblclick", "auxclick", "contextmenu", "dragstart", "dragenter", "dragover", "drop", "keydown", "beforeinput", "input", "change", "paste", "cut"];
        types.forEach((type) => container.addEventListener(type, block, true));
        historyFenceCleanup = () => types.forEach((type) => container.removeEventListener(type, block, true));
    };
    const exitHistory = (options = {}) => {
        const session = historySession;
        if (!session) return false;
        historySession = null;
        historySessionSerial += 1;
        uninstallHistoryFence();
        container.classList?.remove("is-gtd-history-readonly");
        Object.entries(session.snapshot).forEach(([key, value]) => { ui[key] = value; });
        if (options.dispose === true) return true;
        tracking.showPending();
        if (deferredRepairWrite && options.render !== false && !pendingHistoryBoot) void flushDeferredRepair().catch(e => console.error("[GTD][repair-persist-deferred]", e?.message || e));
        if (options.render !== false) renderViewFn?.();
        return true;
    };
    const focusHistoryTarget = (itemId) => {
        const nodeKey = getGtdNodeKey(itemId);
        const el = container.querySelector(`[data-gtd-node-key="${escapeSelectorValue(nodeKey)}"]`)
            || container.querySelector(`[data-gtd-anchor-id="${escapeSelectorValue(itemId)}"]`);
        if (!el || !el.isConnected) return false;
        el.classList.add("is-context-history-target");
        return focusGtdRelationTarget(el, { behavior: "auto", viewportRatio: 0.34 }) === true;
    };
    const enterHistory = (options = {}) => tracking.run(()=>enterHistoryBody(options));
    const enterHistoryBody = ({ itemId = "", tagId = "", isLive = null } = {}) => {
        if (engineDisposed || !container?.isConnected) return false;
        const id = String(itemId || "").trim();
        const tag = String(tagId || "").trim();
        const target = id ? getGtdItemById(id) : null;
        if (id && !target) return false;
        if (!id && !(tag && TAG_DEFINITIONS[tag] && isStoppedContextTagRaw(tag))) return false;
        if (typeof isLive === "function" && isLive() !== true) return false;
        if (historySession) exitHistory({ render: false });
        const snapshot = {};
        HISTORY_GLOBALS.forEach((key) => { snapshot[key] = cloneHistoryGlobal(ui[key]); });
        const session = { serial: ++historySessionSerial, itemId: id, tagId: tag, snapshot, collapsed: new Map() };
        historySession = session;
        ui.gtdTagManagerMode = false;
        ui.gtdKaioKenMode = false;
        ui.gtdShowOnlyFirstClass = false;
        ui.gtdShowOnlyFocus = false;
        ui.gtdTagFilters = tag ? [tag] : [];
        if (target) {
            ui.gtdRelationRevealState = Object.assign({}, ui.gtdRelationRevealState || {}, { archiveItemId: target.status === "completed" ? target.id : null });
            for (let parentId = target.parentId, guard = 0; parentId && guard < 1000; guard += 1) {
                session.collapsed.set(parentId, false);
                parentId = getGtdItemById(parentId)?.parentId;
            }
            for (let projectId = getGtdOwningProjectItemId(target.id), guard = 0; projectId && guard < 1000; guard += 1) {
                session.collapsed.set(projectId, false);
                projectId = getGtdItemById(projectId)?.parentId;
            }
        }
        installHistoryFence();
        if (renderViewFn() === false || historySession !== session || (isLive && isLive() !== true)) return false;
        if (target && !focusHistoryTarget(target.id)) {
            exitHistory({render:false});
            return false;
        }
        if (!target) container.scrollTop = 0;
        return true;
    };
    const flushDeferredRepair = async () => {
        if (!deferredRepairWrite || historySession || engineDisposed) return false;
        await updateGTD(() => {});
        return true;
    };
    const openContextHistory = (itemId = "", tagId = "") => enterHistory({ itemId, tagId });
    const renderHistoryBanner = () => {
        const session = historySession;
        if (!session) return;
        const banner = document.createElement("div");
        banner.className = "gtd-history-banner";
        banner.setAttribute("style", "position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;padding:8px 12px;margin-bottom:8px;border-radius:8px;background:var(--background-secondary-alt);border:1px solid var(--interactive-accent)");
        const style = document.createElement("style");
        style.textContent = ".is-gtd-history-readonly .is-context-history-target{outline:2px solid var(--interactive-accent);outline-offset:2px;border-radius:6px}";
        const title = document.createElement("strong");
        title.textContent = "历史回看 · 只读";
        title.style.color = "var(--interactive-accent)";
        const label = document.createElement("span");
        const tagLabel = session.tagId ? (TAG_DEFINITIONS[session.tagId]?.label || session.tagId) : (getGtdItemLabel(getGtdItemById(session.itemId)) || session.itemId);
        label.textContent = `${tagLabel} · 追踪已停止，内容原样保留`;
        const back = document.createElement("button");
        back.type = "button";
        back.textContent = "返回当前";
        back.onclick = () => { window.__gtdTaskManagerPluginApi?.cancelHistoryNavigationV1?.(); exitHistory(); };
        banner.append(style, title, label, back);
        container.prepend(banner);
    };
    const revalidateHistory = () => {
        const session = historySession;
        if (!session) return;
        if ((session.tagId && !TAG_DEFINITIONS[session.tagId]) || (session.itemId && !getGtdItemById(session.itemId))) {
            exitHistory({ render: false });
            new Notice("历史回看的条目已不可用，已返回当前。");
        }
    };
    const renderStoppedContextTags = host => {
      if (historySession) return;
      const ids = Object.keys(TAG_DEFINITIONS).filter(isStoppedContextTagRaw); if (!ids.length) return;
      const tray = host.createEl("details"); tray.createEl("summary", { text: `查看已停止追踪 (${ids.length})` });
      ids.forEach(id => { tray.createEl("button", { text: TAG_DEFINITIONS[id].label }).onclick = () => openContextHistory("", id); });
    };
    const buildTagKeywordEntries = () => Object.values(TAG_KEYWORD_STORE?.keywords || {})
        .filter((entry) => entry?.keyword && entry?.tagId && TAG_DEFINITIONS[entry.tagId])
        .sort((a, b) => String(a.keyword).localeCompare(String(b.keyword), "zh-CN", { numeric: true, sensitivity: "base" }));
    const validateTagKeywordAssignment = (targetTagId, keywords = [], aliasTagIds = []) => {
        const nextKeywords = normalizeTagKeywordList(keywords);
        const allowedTagIds = new Set([String(targetTagId || "").trim(), ...aliasTagIds.map((id) => String(id || "").trim()).filter(Boolean)]);
        const conflicts = nextKeywords
            .map((keyword) => {
                const key = normalizeTagKeywordKey(keyword);
                const existing = TAG_KEYWORD_STORE?.keywords?.[key];
                return existing && !allowedTagIds.has(existing.tagId)
                    ? { keyword, tagId: existing.tagId, tagLabel: TAG_DEFINITIONS[existing.tagId]?.label || existing.tagId }
                    : null;
            })
            .filter(Boolean);
        return { ok: conflicts.length === 0, keywords: nextKeywords, conflicts };
    };
    const setTagKeywordsForTag = async (tagId, keywords = [], previousTagId = null) => { if (historySession && externalWriteDepth === 0) return rejectHistoryWrite("setTagKeywordsForTag");
        const targetId = String(tagId || "").trim();
        const previousId = String(previousTagId || "").trim();
        const nextStore = normalizeTagKeywordStore(TAG_KEYWORD_STORE);
        Object.entries(nextStore.keywords || {}).forEach(([key, entry]) => {
            if (entry?.tagId === targetId || (previousId && entry?.tagId === previousId)) {
                delete nextStore.keywords[key];
            }
        });
        normalizeTagKeywordList(keywords).forEach((keyword) => {
            const prior = TAG_KEYWORD_STORE.keywords?.[normalizeTagKeywordKey(keyword)];
            nextStore.keywords[normalizeTagKeywordKey(keyword)] = { tagId: targetId, keyword,
                ...(prior?.tagId === targetId && prior?.managedContextCreationV1 ? { managedContextCreationV1: JSON.parse(JSON.stringify(prior.managedContextCreationV1)) } : {}) };
        });
        TAG_KEYWORD_STORE = await saveTagKeywords(nextStore);
        invalidateCarrierInput();
        return TAG_KEYWORD_STORE;
    };
    const renameContextCapsuleKey = async (options = {}) => {
        if (String(options?.source || "").trim() !== "project-execution-overview") {
            return { ok: false, pluginId: "gtd-task-manager", reason: "unsupported-source", matchedCount: 0, renamedCount: 0 };
        }
        const oldDisplayLabel = String(options?.oldDisplayLabel || options?.oldKey || "").trim();
        const newDisplayLabel = String(options?.newDisplayLabel || options?.newKey || "").trim();
        const dryRun = options?.dryRun === true;
        const oldKey = normalizeTagKeywordKey(oldDisplayLabel);
        const newKey = normalizeTagKeywordKey(newDisplayLabel);
        if (!oldKey || !newKey) return { ok: false, pluginId: "gtd-task-manager", reason: "missing-label", matchedCount: 0, renamedCount: 0 };
        if (oldKey === newKey) return { ok: true, pluginId: "gtd-task-manager", dryRun, matchedCount: 0, renamedCount: 0, skippedCount: 0 };
        if (TAG_KEYWORDS_LOAD_FAILED) {
            return { ok: false, pluginId: "gtd-task-manager", dryRun, reason: "keyword-load-error", matchedCount: 0, renamedCount: 0 };
        }
        const nextStore = normalizeTagKeywordStore(TAG_KEYWORD_STORE);
        const assignments = nextStore.keywords || {};
        const matches = Object.values(assignments)
            .filter((entry) => normalizeTagKeywordKey(entry?.keyword) === oldKey)
            .map((entry) => ({
                keywordKey: normalizeTagKeywordKey(entry?.keyword),
                tagId: String(entry?.tagId || "").trim(),
                tagLabel: TAG_DEFINITIONS[String(entry?.tagId || "").trim()]?.label || String(entry?.tagId || "").trim()
            }))
            .filter((entry) => entry.keywordKey && entry.tagId);
        const conflicts = [];
        const existingNew = assignments[newKey];
        if (existingNew && !matches.some((entry) => entry.tagId === existingNew.tagId)) {
            const tagId = String(existingNew.tagId || "").trim();
            conflicts.push({
                keyword: newDisplayLabel,
                tagId,
                tagLabel: TAG_DEFINITIONS[tagId]?.label || tagId
            });
        }
        const preview = {
            ok: conflicts.length === 0,
            pluginId: "gtd-task-manager",
            dryRun,
            oldDisplayLabel,
            newDisplayLabel,
            matchedCount: matches.length,
            renamedCount: dryRun || conflicts.length > 0 ? 0 : matches.length,
            skippedCount: 0,
            conflicts,
            details: matches
        };
        if (dryRun || conflicts.length > 0 || matches.length === 0) return preview;
        matches.forEach((match) => {
            const existing = assignments[match.keywordKey];
            if (!existing) return;
            delete assignments[match.keywordKey];
            assignments[newKey] = {
                tagId: existing.tagId,
                keyword: newDisplayLabel
            };
        });
        TAG_KEYWORD_STORE = await saveTagKeywords(nextStore);
        invalidateCarrierInput();
        console.log("[GTD][context-capsule.rename]", {
            oldDisplayLabel,
            newDisplayLabel,
            renamedCount: matches.length
        });
        if (renderViewFn) renderViewFn();
        return Object.assign({}, preview, { ok: true, renamedCount: matches.length });
    };

    const syncContextCapsuleKey = async (options = {}) => {
        if (String(options?.source || "").trim() !== "project-execution-overview") {
            return { ok: false, pluginId: "gtd-task-manager", reason: "unsupported-source", matchedCount: 0, renamedCount: 0 };
        }
        const displayLabel = parseContextCapsuleLabel(options?.displayLabel || options?.newDisplayLabel || options?.newKey || "").displayLabel;
        const dryRun = options?.dryRun === true;
        const target = parseContextCapsuleLabel(displayLabel);
        const targetKey = normalizeTagKeywordKey(target.displayLabel);
        const targetAddress = normalizeTagKeywordKey(target.address);
        if (!targetKey || !targetAddress) {
            return { ok: false, pluginId: "gtd-task-manager", dryRun, reason: "missing-address", matchedCount: 0, renamedCount: 0 };
        }
        if (TAG_KEYWORDS_LOAD_FAILED) {
            return { ok: false, pluginId: "gtd-task-manager", dryRun, reason: "keyword-load-error", matchedCount: 0, renamedCount: 0 };
        }
        const nextStore = normalizeTagKeywordStore(TAG_KEYWORD_STORE);
        const assignments = nextStore.keywords || {};
        const matches = Object.values(assignments)
            .map((entry) => {
                const parsed = parseContextCapsuleLabel(entry?.keyword);
                return {
                    keywordKey: normalizeTagKeywordKey(entry?.keyword),
                    displayLabel: parsed.displayLabel,
                    address: normalizeTagKeywordKey(parsed.address),
                    tagId: String(entry?.tagId || "").trim(),
                    tagLabel: TAG_DEFINITIONS[String(entry?.tagId || "").trim()]?.label || String(entry?.tagId || "").trim()
                };
            })
            .filter((entry) => entry.keywordKey && entry.tagId && entry.address === targetAddress && entry.keywordKey !== targetKey);
        const conflicts = [];
        const matchedTagIds = Array.from(new Set(matches.map((entry) => entry.tagId).filter(Boolean)));
        if (matchedTagIds.length > 1) {
            conflicts.push({
                keyword: target.displayLabel,
                reason: "multiple-same-address-carriers",
                carriers: matches.map((entry) => ({ tagId: entry.tagId, tagLabel: entry.tagLabel, displayLabel: entry.displayLabel }))
            });
        }
        const existingTarget = assignments[targetKey];
        if (existingTarget) {
            const targetTagId = String(existingTarget.tagId || "").trim();
            const sameTagMatch = matches.some((entry) => entry.tagId === targetTagId);
            if (!sameTagMatch && matches.length > 0) {
                conflicts.push({
                    keyword: target.displayLabel,
                    tagId: targetTagId,
                    tagLabel: TAG_DEFINITIONS[targetTagId]?.label || targetTagId
                });
            }
        }
        const preview = {
            ok: conflicts.length === 0,
            pluginId: "gtd-task-manager",
            dryRun,
            displayLabel: target.displayLabel,
            matchedCount: matches.length,
            renamedCount: dryRun || conflicts.length > 0 ? 0 : matches.length,
            skippedCount: 0,
            conflicts,
            details: matches
        };
        if (dryRun || conflicts.length > 0 || matches.length === 0) return preview;
        matches.forEach((match) => {
            const existing = assignments[match.keywordKey];
            if (!existing) return;
            delete assignments[match.keywordKey];
            assignments[targetKey] = {
                tagId: existing.tagId,
                keyword: target.displayLabel
            };
        });
        TAG_KEYWORD_STORE = await saveTagKeywords(nextStore);
        invalidateCarrierInput();
        console.log("[GTD][context-capsule.sync-repair]", {
            displayLabel: target.displayLabel,
            renamedCount: matches.length
        });
        if (renderViewFn) renderViewFn();
        return Object.assign({}, preview, { ok: true, renamedCount: matches.length });
    };

    const makeProjectContextTagId = (projectName = "", contextKey = "") => {
        const parsed = parseContextCapsuleLabel(contextKey || projectName);
        const base = String(parsed.address || projectName || contextKey || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const seed = base || `context-${Date.now()}`;
        let candidate = `context-${seed}`.replace(/-+/g, "-");
        let counter = 2;
        while (TAG_DEFINITIONS[candidate]) {
            const existing = TAG_DEFINITIONS[candidate];
            if (String(existing?.label || "").trim() === String(projectName || "").trim()) return candidate;
            candidate = `context-${seed}-${counter}`;
            counter += 1;
        }
        return candidate;
    };

    const ensureProjectContextTag = async (options = {}) => {
        const projectName = String(options?.projectName || options?.title || "").trim();
        const contextKey = String(options?.contextKey || projectName || "").trim();
        if (!projectName) return { ok: false, reason: "missing-project-name" };
        const matchingTopLevelProjects = (Array.isArray(gtdList) ? gtdList : [])
            .filter((item) => item?.type === "project"
                && item?.status === "active"
                && !String(item?.parentId || "").trim()
                && String(item?.project || "").trim() === projectName);
        if (matchingTopLevelProjects.length > 1) {
            return {
                ok: false,
                reason: "ambiguous-top-level-project-carrier",
                contextKey,
                projectIds: matchingTopLevelProjects.map((item) => String(item?.id || "").trim()).filter(Boolean)
            };
        }
        const contextKeywordKey = normalizeTagKeywordKey(contextKey);
        const existingKeyword = contextKeywordKey ? TAG_KEYWORD_STORE?.keywords?.[contextKeywordKey] : null;
        const existingByKeyword = existingKeyword?.tagId && TAG_DEFINITIONS[existingKeyword.tagId] ? existingKeyword.tagId : "";
        const existingByLabel = Object.keys(TAG_DEFINITIONS || {})
            .find((tagId) => String(TAG_DEFINITIONS[tagId]?.label || "").trim() === projectName) || "";
        const tagId = existingByKeyword || existingByLabel || makeProjectContextTagId(projectName, contextKey);
        let created = false;
        if (!TAG_DEFINITIONS[tagId]) {
            invalidateCarrierInput();
            TAG_DEFINITIONS[tagId] = {
                label: projectName,
                icon: String(options?.icon || "🏷️").trim() || "🏷️",
                color: String(options?.color || "#3498db").trim() || "#3498db",
                parentId: null,
                isCategory: false,
                order: getSortedChildTags(null).length
            };
            normalizeTagDefinitionOrders(TAG_DEFINITIONS);
            await saveTagDefinitions(TAG_DEFINITIONS);
            created = true;
        }
        if (contextKey) {
            const existingKeywords = getTagKeywords(tagId);
            const hasKeyword = existingKeywords.some((keyword) => normalizeTagKeywordKey(keyword) === contextKeywordKey);
            if (!hasKeyword) {
                const validation = validateTagKeywordAssignment(tagId, [...existingKeywords, contextKey], [tagId]);
                if (!validation.ok) {
                    return {
                        ok: false,
                        reason: "keyword-conflict",
                        conflicts: validation.conflicts,
                        tagId,
                        title: TAG_DEFINITIONS[tagId]?.label || projectName,
                        contextKey
                    };
                }
                await setTagKeywordsForTag(tagId, validation.keywords);
            }
        }
        let projectId = "";
        let projectCreated = false;
        let projectTagged = false;
        await getOrCreateProjectFile(projectName);
        await updateGTD((list) => {
            const activeProjects = (Array.isArray(list) ? list : [])
                .filter((item) => item?.type === "project" && item?.status === "active");
            let projectItem = activeProjects.find((item) => (
                !String(item?.parentId || "").trim()
                && String(item?.project || "").trim() === projectName
            )) || null;
            if (!projectItem) {
                const topLevelOrders = activeProjects
                    .filter((item) => !item.parentId)
                    .map((item) => Number(item?.sortOrder))
                    .filter((value) => Number.isFinite(value));
                projectItem = {
                    id: Date.now().toString(),
                    type: "project",
                    status: "active",
                    created: moment().format("YYYY-MM-DD"),
                    project: projectName,
                    content: null,
                    scheduled: null,
                    deadline: null,
                    isFirstClass: false,
                    isFocusSession: false,
                    isDimmed: false,
                    isCollapsed: false,
                    tags: [],
                    parentId: null,
                    sortOrder: topLevelOrders.length > 0 ? Math.max(...topLevelOrders) + 10 : 10
                };
                list.push(projectItem);
                if (Array.isArray(ui.gtdRecentIds)) ui.gtdRecentIds.push(projectItem.id);
                projectCreated = true;
            }
            if (!Array.isArray(projectItem.tags)) projectItem.tags = [];
            if (!projectItem.tags.includes(tagId)) {
                projectItem.tags.push(tagId);
                projectTagged = true;
            }
            projectId = String(projectItem.id || "");
        });
        if (renderViewFn) renderViewFn();
        return {
            ok: true,
            tagId,
            title: TAG_DEFINITIONS[tagId]?.label || projectName,
            contextKey,
            created,
            projectId,
            projectNodeKey: getGtdNodeKey(projectId),
            sourceNotePath: currentNotePath,
            projectCreated,
            projectTagged
        };
    };

    const getContextCapsuleCarrierSnapshot = (options = {}) => {
        const startedAt = Date.now();
        const requested = String(options?.contextKey || options?.displayLabel || "").trim();
        const limit = Math.max(1, Math.min(200, Number(options?.limit || 80) || 80));
        const activeItems = Array.isArray(gtdList) ? gtdList.filter((item) => item && item.status === "active") : [];
        const itemById = new Map(activeItems.map((item) => [String(item.id || "").trim(), item]));
        const tagIdsByKeyword = new Map();
        Object.values(TAG_KEYWORD_STORE?.keywords || {}).forEach((entry) => {
            const display = parseContextCapsuleLabel(entry?.keyword || "").displayLabel || entry?.keyword || "";
            const keywordKey = normalizeTagKeywordKey(display);
            const tagId = String(entry?.tagId || "").trim();
            if (!keywordKey || !tagId || !TAG_DEFINITIONS[tagId]) return;
            if (!tagIdsByKeyword.has(keywordKey)) tagIdsByKeyword.set(keywordKey, new Set());
            tagIdsByKeyword.get(keywordKey).add(tagId);
        });
        const buildOneSnapshot = (target = "") => {
            const targetStartedAt = Date.now();
            const requestedKey = normalizeTagKeywordKey(parseContextCapsuleLabel(target).displayLabel || target);
            const matchedTagIds = Array.from(tagIdsByKeyword.get(requestedKey) || []);
            if (matchedTagIds.length === 0) {
            return {
                ok: true,
                pluginId: "gtd-task-manager",
                source: "gtd-task-manager",
                contextKey: target,
                matchedCarrierCount: 0,
                totalCount: 0,
                returnedCount: 0,
                count: 0,
                limit,
                hasMore: false,
                cursor: "",
                revision: getContextCarrierRevision(),
                timingMs: Date.now() - targetStartedAt,
                items: [],
                truncated: false,
                indexVersion: "context-carrier-index-v1",
                fromIndex: true
            };
        }
        const taggedProjectIds = new Set();
            activeItems.forEach((item) => {
            if (item.type === "project" && tagMatchesFilter(item.tags, matchedTagIds)) taggedProjectIds.add(String(item.id || "").trim());
        });
        const isDescendantOfTaggedProject = (item) => {
            let cursor = String(item?.parentId || "").trim();
            const seen = new Set();
            while (cursor && !seen.has(cursor)) {
                seen.add(cursor);
                if (taggedProjectIds.has(cursor)) return true;
                    const parent = itemById.get(cursor) || getGtdItemById(cursor);
                cursor = String(parent?.parentId || "").trim();
            }
            return false;
        };
        const matchedItems = [];
            activeItems.forEach((item) => {
            const directTagMatch = tagMatchesFilter(item.tags, matchedTagIds);
            if (!directTagMatch && !isDescendantOfTaggedProject(item)) return;
            matchedItems.push(item);
        });
        const items = [];
        matchedItems.slice(0, limit).forEach((item, index) => {
            const pathLabel = buildGtdItemPathLabel(item.id);
            items.push({
                nodeKey: getGtdNodeKey(item.id),
                label: getGtdItemLabel(item),
                pathLabel,
                notePath: currentNotePath,
                viewType: GTD_RELATION_VIEW_TYPE,
                viewLabel: getCurrentFile()?.name || "GTD",
                searchText: [
                    getGtdItemLabel(item),
                    item.type || "",
                    item.project || "",
                    item.content || "",
                    pathLabel
                ].filter(Boolean).join(" "),
                metaFields: buildGtdStructuralMetaFields(item),
                depth: Math.max(0, pathLabel.split(/\s*\/\s*/).length - 1),
                sourcePlugin: "gtd-task-manager",
                carrierId: matchedTagIds.join(","),
                carrierLabel: matchedTagIds.map((tagId) => TAG_DEFINITIONS[tagId]?.label || tagId).join(" / "),
                    contextKey: target,
                order: index,
                orderPath: [index]
            });
        });
        const totalCount = matchedItems.length;
        const truncated = totalCount > items.length || items.length >= limit;
        return {
            ok: true,
            pluginId: "gtd-task-manager",
            source: "gtd-task-manager",
            contextKey: target,
            matchedCarrierCount: matchedTagIds.length,
            totalCount,
            returnedCount: items.length,
            count: items.length,
            limit,
            hasMore: truncated,
            cursor: truncated ? String(items.length) : "",
            revision: getContextCarrierRevision(),
                timingMs: Date.now() - targetStartedAt,
            items,
                truncated,
                indexVersion: "context-carrier-index-v1",
                fromIndex: true
        };
        };
        const requestedTargets = Array.isArray(options?.contextKeys)
            ? options.contextKeys.map((entry) => String(entry || "").trim()).filter(Boolean)
            : [];
        if (requestedTargets.length > 0) {
            const targets = {};
            let totalCount = 0;
            let returnedCount = 0;
            let hasMore = false;
            let matchedCarrierCount = 0;
            requestedTargets.forEach((target) => {
                const snapshot = buildOneSnapshot(target);
                const key = normalizeTagKeywordKey(parseContextCapsuleLabel(target).displayLabel || target);
                targets[key] = snapshot;
                totalCount += Number(snapshot.totalCount || 0);
                returnedCount += Number(snapshot.returnedCount || snapshot.items?.length || 0);
                matchedCarrierCount += Number(snapshot.matchedCarrierCount || 0);
                if (snapshot.hasMore || snapshot.truncated) hasMore = true;
            });
            return {
                ok: true,
                pluginId: "gtd-task-manager",
                source: "gtd-task-manager",
                contextKey: "",
                matchedCarrierCount,
                totalCount,
                returnedCount,
                count: returnedCount,
                limit,
                hasMore,
                cursor: "",
                revision: getContextCarrierRevision(),
                timingMs: Date.now() - startedAt,
                items: [],
                truncated: hasMore,
                targets,
                indexVersion: "context-carrier-index-v1",
                fromIndex: true
            };
        }
        return buildOneSnapshot(requested);
    };

    const getContextCapsuleTopLevelProjectCarrierBatchSnapshot = (options = {}, savedInput = null) => {
        const generatedAt = new Date().toISOString();
        const requested = Array.isArray(options?.contextKeys)
            ? options.contextKeys.map((value) => String(value || "").trim()).filter(Boolean)
            : [];
        const normalizedRequests = requested.map((contextKey) => (
            normalizeTagKeywordKey(parseContextCapsuleLabel(contextKey).displayLabel || contextKey)
        ));
        const inputList = savedInput ? savedInput.list : gtdList;
        const inputTags = savedInput ? savedInput.tags : TAG_DEFINITIONS;
        const inputKeywords = savedInput ? savedInput.keywords : TAG_KEYWORD_STORE;
        const providerGeneration = savedInput ? savedInput.providerGeneration : getContextCarrierRevision();
        const fail = (reason, diagnostics = []) => ({
            ok: false,
            complete: false,
            decisionComplete: false,
            contractVersion: TOP_LEVEL_PROJECT_CARRIER_BATCH_CONTRACT_VERSION,
            snapshotType: "gtd-context-capsule-top-level-project-carrier-batch-v1",
            providerId: "gtd-task-manager",
            providerGeneration,
            sourceNotePath: currentNotePath,
            generatedAt,
            revision: "",
            requestCount: requested.length,
            count: 0,
            returnedCount: 0,
            limit: TOP_LEVEL_PROJECT_CARRIER_BATCH_MAX_CONTEXTS,
            hasMore: false,
            truncated: false,
            results: [],
            diagnostics: [{ code: reason }].concat(Array.isArray(diagnostics) ? diagnostics : []),
            reason
        });
        if (requested.length > TOP_LEVEL_PROJECT_CARRIER_BATCH_MAX_CONTEXTS) {
            return fail("context-request-limit-exceeded", [{
                code: "context-request-limit-exceeded",
                requestCount: requested.length,
                limit: TOP_LEVEL_PROJECT_CARRIER_BATCH_MAX_CONTEXTS
            }]);
        }
        if (normalizedRequests.some((value) => !value)) return fail("invalid-context-request");
        if (new Set(normalizedRequests).size !== normalizedRequests.length) return fail("duplicate-normalized-context-request");
        const tagIdsByKeyword = new Map();
        let keywordVisitCount = 0;
        Object.values(inputKeywords?.keywords || {}).forEach((entry) => {
            keywordVisitCount += 1;
            const display = parseContextCapsuleLabel(entry?.keyword || "").displayLabel || entry?.keyword || "";
            const keywordKey = normalizeTagKeywordKey(display);
            const tagId = String(entry?.tagId || "").trim();
            if (!keywordKey || !tagId || !(savedInput ? Object.prototype.hasOwnProperty.call(inputTags, tagId) : inputTags[tagId])) return;
            if (!tagIdsByKeyword.has(keywordKey)) tagIdsByKeyword.set(keywordKey, new Set());
            tagIdsByKeyword.get(keywordKey).add(tagId);
        });
        const topLevelProjectsByTag = new Map();
        let itemVisitCount = 0;
        (Array.isArray(inputList) ? inputList : []).forEach((item) => {
            itemVisitCount += 1;
            if (!item || item.status !== "active" || item.type !== "project" || String(item.parentId || "").trim()) return;
            const itemId = String(item.id || "").trim();
            if (!itemId) return;
            Array.from(new Set(Array.isArray(item.tags) ? item.tags.map((value) => String(value || "").trim()).filter(Boolean) : []))
                .forEach((tagId) => {
                    if (!topLevelProjectsByTag.has(tagId)) topLevelProjectsByTag.set(tagId, []);
                    topLevelProjectsByTag.get(tagId).push(item);
                });
        });
        const revisionHash = createHash("sha256");
        revisionHash.update(JSON.stringify({ contextKeys: requested, sourceNotePath: currentNotePath }), "utf8");
        const results = requested.map((contextKey, requestIndex) => {
            const normalizedKey = normalizedRequests[requestIndex];
            const matchedTagIds = Array.from(tagIdsByKeyword.get(normalizedKey) || []).sort((left, right) => left.localeCompare(right, "en"));
            const candidatesById = new Map();
            matchedTagIds.forEach((tagId) => {
                (topLevelProjectsByTag.get(tagId) || []).forEach((item) => {
                    const id = String(item.id || "").trim();
                    if (!id || candidatesById.has(id)) return;
                    candidatesById.set(id, item);
                });
            });
            const candidates = Array.from(candidatesById.values()).sort((left, right) => (
                String(left.id || "").localeCompare(String(right.id || ""), "zh-CN", { numeric: true, sensitivity: "base" })
            ));
            const candidateEvidence = candidates.map((item) => ({
                id: String(item.id || "").trim(),
                nodeKey: savedInput ? buildJumpNodeKey({ viewType: GTD_RELATION_VIEW_TYPE, notePath: currentNotePath,
                    scopeType: "note", scopeId: currentNotePath, itemId: String(item.id).trim() }) : getGtdNodeKey(item.id),
                project: String(item.project || "").trim(),
                type: "project",
                topLevel: true,
                parentId: "",
                tagId: matchedTagIds.length === 1 ? matchedTagIds[0] : ""
            }));
            revisionHash.update(JSON.stringify({ contextKey, normalizedKey, matchedTagIds }), "utf8");
            candidateEvidence.forEach((candidate) => revisionHash.update(JSON.stringify(candidate), "utf8"));
            const uniqueItem = matchedTagIds.length === 1 && candidates.length === 1
                ? {
                    id: candidateEvidence[0].id,
                    nodeKey: candidateEvidence[0].nodeKey,
                    label: candidateEvidence[0].project,
                    type: "project",
                    topLevel: true,
                    parentId: "",
                    tagId: matchedTagIds[0]
                }
                : null;
            return {
                ok: true,
                complete: true,
                decisionComplete: true,
                requestIndex,
                contextKey,
                normalizedKey,
                matchedTagCount: matchedTagIds.length,
                uniqueTagId: matchedTagIds.length === 1 ? matchedTagIds[0] : "",
                diagnosticTagIdSample: matchedTagIds.slice(0, 2),
                diagnosticTagIdSampleTruncated: matchedTagIds.length > 2,
                totalCount: candidates.length,
                topLevelProjectCount: candidates.length,
                uniqueItem,
                diagnosticSample: candidateEvidence.slice(0, 2),
                diagnosticSampleTruncated: candidateEvidence.length > 2
            };
        });
        const revision = revisionHash.digest("hex");
        return {
            ok: true,
            complete: true,
            decisionComplete: true,
            contractVersion: TOP_LEVEL_PROJECT_CARRIER_BATCH_CONTRACT_VERSION,
            snapshotType: "gtd-context-capsule-top-level-project-carrier-batch-v1",
            providerId: "gtd-task-manager",
            providerGeneration,
            sourceNotePath: currentNotePath,
            generatedAt,
            revision,
            requestCount: requested.length,
            count: results.length,
            returnedCount: results.length,
            limit: TOP_LEVEL_PROJECT_CARRIER_BATCH_MAX_CONTEXTS,
            hasMore: false,
            truncated: false,
            keywordVisitCount,
            itemVisitCount,
            results,
            diagnostics: []
        };
    };

    const normalizeTagFilterList = (filters) => {
        const uniq = [];
        const seen = new Set();
        (Array.isArray(filters) ? filters : []).forEach((id) => {
            const key = String(id || "").trim();
            if (!key || seen.has(key)) return;
            if (!TAG_DEFINITIONS[key]) return;
            seen.add(key);
            uniq.push(key);
        });
        return uniq;
    };
    const setTagFilters = (filters) => {
        ui.gtdTagFilters = normalizeTagFilterList(filters);
    };
    const normalizeTagPresetName = (name) => String(name || "").trim().slice(0, 50);
    const normalizeTagFilterPresets = (presets) => {
        const result = [];
        const seen = new Set();
        (Array.isArray(presets) ? presets : []).forEach((preset) => {
            const rawName = typeof preset === "string" ? preset : (preset?.name ?? "");
            const name = normalizeTagPresetName(rawName);
            if (!name || seen.has(name)) return;
            seen.add(name);
            const filters = normalizeTagFilterList(typeof preset === "string" ? [] : preset?.filters);
            result.push({
                name,
                filters,
                createdAt: preset?.createdAt || preset?.updatedAt || moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: preset?.updatedAt || moment().format("YYYY-MM-DD HH:mm:ss")
            });
        });
        return result;
    };
    const loadPersistedTagFilterPresets = () => {
        try {
            const raw = localStorage.getItem(TAG_FILTER_PRESETS_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return normalizeTagFilterPresets(parsed);
        } catch (e) {
            return [];
        }
    };
    const savePersistedTagFilterPresets = (presets) => {
        try {
            localStorage.setItem(TAG_FILTER_PRESETS_STORAGE_KEY, JSON.stringify(normalizeTagFilterPresets(presets)));
        } catch (e) {}
    };
    const setTagFilterPresets = (presets) => { if (historySession && externalWriteDepth === 0) return rejectHistoryWrite("setTagFilterPresets");
        window.gtdTagFilterPresets = normalizeTagFilterPresets(presets);
        savePersistedTagFilterPresets(window.gtdTagFilterPresets);
    };
    const normalizeTagFilterExpandedState = (state) => {
        const result = {};
        if (!state || typeof state !== "object") return result;
        Object.keys(state).forEach((id) => {
            const key = String(id || "").trim();
            if (!key || !TAG_DEFINITIONS[key]) return;
            result[key] = state[id] !== false;
        });
        return result;
    };
    const setTagFilterExpandedState = (state) => {
        ui.gtdTagFilterExpanded = normalizeTagFilterExpandedState(state);
    };
    const isSameFilterSet = (a, b) => {
        const aa = normalizeTagFilterList(a).slice().sort();
        const bb = normalizeTagFilterList(b).slice().sort();
        if (aa.length !== bb.length) return false;
        for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
        return true;
    };
    const getTagPresetSummaryText = (filters) => {
        const normalized = normalizeTagFilterList(filters);
        if (normalized.length === 0) return "全部标签";
        return normalized.map((id) => {
            const def = TAG_DEFINITIONS[id];
            return def ? `${def.icon} ${def.label}` : id;
        }).join(" · ");
    };

    // ============================================================
    // 🔷 标签层级工具函数
    // ============================================================

    // --- 0.1 标签层级工具函数 ---
    // 获取标签的所有子孙标签ID（用于筛选时父级包含子级）
    const getDescendantTagIds = (tagId) => {
        const descendants = [];
        const findChildren = (parentId) => {
            Object.keys(TAG_DEFINITIONS).forEach(key => {
                if (TAG_DEFINITIONS[key].parentId === parentId) {
                    descendants.push(key);
                    findChildren(key); // 递归查找子孙
                }
            });
        };
        findChildren(tagId);
        return descendants;
    };

    // 获取标签的所有祖先标签ID（用于显示面包屑路径）
    const getAncestorTagIds = (tagId) => {
        const ancestors = [];
        let current = TAG_DEFINITIONS[tagId];
        while (current && current.parentId) {
            ancestors.unshift(current.parentId);
            current = TAG_DEFINITIONS[current.parentId];
        }
        return ancestors;
    };

    // 获取顶层标签（parentId为null的）
    const getTopLevelTags = () => {
        return Object.keys(TAG_DEFINITIONS).filter(key => TAG_DEFINITIONS[key].parentId === null);
    };

    // 获取某个标签的直接子标签
    const getChildTags = (parentId) => {
        return Object.keys(TAG_DEFINITIONS).filter(key => TAG_DEFINITIONS[key].parentId === parentId);
    };

    const getSortedChildTags = (parentId) => {
        return getChildTags(parentId).sort((a, b) => (TAG_DEFINITIONS[a].order || 0) - (TAG_DEFINITIONS[b].order || 0));
    };

    const normalizeTagDefinitionOrders = (tags = TAG_DEFINITIONS) => {
        if (tags === TAG_DEFINITIONS) invalidateCarrierInput();
        const grouped = new Map();
        Object.keys(tags || {}).forEach((id) => {
            const parentKey = tags[id]?.parentId || "__root__";
            if (!grouped.has(parentKey)) grouped.set(parentKey, []);
            grouped.get(parentKey).push(id);
        });
        grouped.forEach((ids) => {
            ids.sort((a, b) => (tags[a]?.order || 0) - (tags[b]?.order || 0));
            ids.forEach((id, idx) => {
                if (tags[id]) tags[id].order = idx;
            });
        });
    };

    const moveTagDefinition = async (draggedId, targetId = null, position = "after") => { if (historySession) return rejectHistoryWrite("moveTagDefinition");
        if (!draggedId || !TAG_DEFINITIONS[draggedId]) return;
        if (targetId && (!TAG_DEFINITIONS[targetId] || draggedId === targetId)) return;

        if (targetId) {
            let current = targetId;
            while (current) {
                if (current === draggedId) {
                    new Notice("⚠️ 不能将父标签拖入其子标签");
                    return;
                }
                current = TAG_DEFINITIONS[current]?.parentId || null;
            }
        }

        const dragged = TAG_DEFINITIONS[draggedId];
        const nextParentId = !targetId
            ? null
            : (position === "child" ? targetId : (TAG_DEFINITIONS[targetId].parentId || null));
        const siblingIds = Object.keys(TAG_DEFINITIONS)
            .filter((id) => id !== draggedId && (TAG_DEFINITIONS[id].parentId || null) === nextParentId)
            .sort((a, b) => (TAG_DEFINITIONS[a].order || 0) - (TAG_DEFINITIONS[b].order || 0));

        invalidateCarrierInput();
        dragged.parentId = nextParentId;
        if (!targetId) siblingIds.push(draggedId);
        else if (position === "child") siblingIds.unshift(draggedId);
        else {
            const targetIndex = siblingIds.indexOf(targetId);
            if (targetIndex < 0) siblingIds.push(draggedId);
            else siblingIds.splice(position === "before" ? targetIndex : targetIndex + 1, 0, draggedId);
        }

        siblingIds.forEach((id, idx) => {
            if (TAG_DEFINITIONS[id]) TAG_DEFINITIONS[id].order = idx;
        });
        normalizeTagDefinitionOrders(TAG_DEFINITIONS);
        await saveTagDefinitions(TAG_DEFINITIONS);
        if (renderViewFn) renderViewFn();
    };

    // 标签是否匹配筛选条件（支持多标签，父标签包含子孙标签）
    const tagMatchesFilter = (itemTags, filterTagIds) => {
        if (!filterTagIds || filterTagIds.length === 0) return true;
        if (!itemTags || itemTags.length === 0) return false;
        const matchesOne = (filterId) => {
            if (itemTags.includes(filterId)) return true;
            return itemTags.some(t => getDescendantTagIds(filterId).includes(t));
        };
        return filterTagIds.some(matchesOne);
    };

    const getProjectAncestorIds = (projectId) => {
        const ancestors = [];
        const seen = new Set();
        let cursor = String(projectId || "").trim();
        while (cursor) {
            const item = gtdList.find((entry) => entry?.id === cursor);
            const parentId = String(item?.parentId || "").trim();
            if (!parentId || seen.has(parentId)) break;
            seen.add(parentId);
            ancestors.unshift(parentId);
            cursor = parentId;
        }
        return ancestors;
    };

    const expandQuickNavAncestorsForProject = (projectId) => {
        const collapsed = ui.gtdQuickNavCollapsed && typeof ui.gtdQuickNavCollapsed === "object"
            ? ui.gtdQuickNavCollapsed
            : {};
        getProjectAncestorIds(projectId).forEach((ancestorId) => {
            collapsed[ancestorId] = false;
        });
        ui.gtdQuickNavCollapsed = collapsed;
    };

    const isProjectVisibleInCurrentQuickNav = (projectItem) => {
        if (!projectItem || projectItem.type !== "project" || projectItem.status !== "active") return false;
        const tagFilters = Array.isArray(ui.gtdTagFilters) ? ui.gtdTagFilters : [];
        if (!ui.gtdShowOnlyFirstClass && !ui.gtdShowOnlyFocus && tagFilters.length === 0) return true;

        const projectName = projectItem.project;
        const subs = gtdList.filter((item) => item.type === "next_action" && item.project === projectName && item.status === "active");
        const checkTreeCondition = (id, checker, chain = new Set()) => {
            if (!id || chain.has(id)) return false;
            const nextChain = new Set(chain);
            nextChain.add(id);
            const me = gtdList.find((item) => item.id === id);
            if (me && checker(me)) return true;
            const children = gtdList.filter((item) => item.parentId === id && item.status === "active");
            return children.some((child) => checkTreeCondition(child.id, checker, nextChain));
        };

        let passFocus = true;
        let passFirstClass = true;
        let passTag = true;
        if (ui.gtdShowOnlyFocus) {
            passFocus = projectItem.isFocusSession || subs.some((item) => checkTreeCondition(item.id, (entry) =>
                entry.isFocusSession || ui.gtdRecentIds.includes(entry.id)
            ));
        }
        if (ui.gtdShowOnlyFirstClass) {
            passFirstClass = projectItem.isFirstClass || subs.some((item) => checkTreeCondition(item.id, (entry) =>
                entry.isFirstClass || ui.gtdRecentIds.includes(entry.id)
            ));
        }
        if (tagFilters.length > 0) {
            passTag = tagMatchesFilter(projectItem.tags, tagFilters) ||
                ui.gtdRecentIds.includes(projectItem.id) ||
                subs.some((item) => checkTreeCondition(item.id, (entry) =>
                    tagMatchesFilter(entry.tags, tagFilters) || ui.gtdRecentIds.includes(entry.id)
                ));
        }
        return passFocus && passFirstClass && passTag;
    };

    const getProjectsUsingTag = (tagId) => {
        const targetId = String(tagId || "").trim();
        if (!targetId) return [];
        const isActiveItem = (item) => item?.status === "active";
        const itemUsesTargetTag = (item) => Array.isArray(item?.tags) && tagMatchesFilter(item.tags, [targetId]);
        const projectRecords = new Map();
        const ensureProjectRecord = (projectItem, reasonItem = null) => {
            if (!projectItem?.id) return null;
            if (projectItem.type !== "project" || !isActiveItem(projectItem)) return null;
            if (reasonItem && reasonItem.id !== projectItem.id && !isActiveItem(reasonItem)) return null;
            if (!projectRecords.has(projectItem.id)) {
                projectRecords.set(projectItem.id, {
                    item: projectItem,
                    index: gtdList.findIndex((entry) => entry?.id === projectItem.id),
                    direct: itemUsesTargetTag(projectItem),
                    relatedCount: 0,
                    examples: []
                });
            }
            const record = projectRecords.get(projectItem.id);
            if (reasonItem && reasonItem.id !== projectItem.id) {
                record.relatedCount += 1;
                const label = String(reasonItem.content || reasonItem.project || reasonItem.id || "").trim();
                if (label && record.examples.length < 3) record.examples.push(label);
            }
            return record;
        };

        gtdList.forEach((item) => {
            if (item?.type === "project" && isActiveItem(item) && itemUsesTargetTag(item)) {
                ensureProjectRecord(item, item);
            }
        });
        gtdList.forEach((item) => {
            if (!item || item.type === "project" || !isActiveItem(item) || !itemUsesTargetTag(item)) return;
            const ownerId = typeof getGtdOwningProjectItemId === "function" ? getGtdOwningProjectItemId(item.id) : null;
            const owner = ownerId ? gtdList.find((entry) => entry?.id === ownerId) : null;
            if (owner) ensureProjectRecord(owner, item);
        });

        return Array.from(projectRecords.values())
            .map((entry) => ({
                ...entry,
                visibleInQuickNav: isProjectVisibleInCurrentQuickNav(entry.item),
                statusLabel: entry.item.status === "active" ? "活跃" : (entry.item.status || "未设置")
            }))
            .sort((a, b) => {
                if (a.visibleInQuickNav !== b.visibleInQuickNav) return a.visibleInQuickNav ? -1 : 1;
                const activeDiff = (a.item.status === "active" ? 0 : 1) - (b.item.status === "active" ? 0 : 1);
                if (activeDiff !== 0) return activeDiff;
                const orderDiff = (Number(a.item.order) || 0) - (Number(b.item.order) || 0);
                if (orderDiff !== 0) return orderDiff;
                return String(a.item.project || "").localeCompare(String(b.item.project || ""), "zh-CN", { numeric: true, sensitivity: "base" });
            });
    };

    const requestQuickNavProjectReveal = (projectId) => {
        const targetId = String(projectId || "").trim();
        if (!targetId) return false;
        const projectItem = gtdList.find((item) => item?.id === targetId && item.type === "project");
        if (!projectItem) {
            new Notice("⚠️ 未找到对应项目");
            return false;
        }
        if (!isProjectVisibleInCurrentQuickNav(projectItem)) {
            new Notice("⚠️ 该项目当前不在项目快速导航中，请先调整精选/执行/标签筛选或项目状态");
            console.info("[GTD][tag-usage][quick-nav-reveal-blocked]", {
                projectId: targetId,
                project: projectItem.project,
                status: projectItem.status
            });
            return false;
        }
        expandQuickNavAncestorsForProject(targetId);
        ui.gtdPendingQuickNavRevealProjectId = targetId;
        setCurrentGtdMode("normal");
        console.info("[GTD][tag-usage][quick-nav-reveal-request]", {
            projectId: targetId,
            project: projectItem.project
        });
        if (renderViewFn) renderViewFn();
        return true;
    };

    const GTD_PLUGIN_DIAG_MARKER = "plugin diag 20260511-usage-projects";
    const logGtdPluginDiag = (eventName, payload = {}) => {
        try {
            console.info(`[GTD][plugin-diag][${eventName}]`, {
                marker: GTD_PLUGIN_DIAG_MARKER,
                ...payload
            });
        } catch (error) {
            // diagnostic logging must never affect the GTD UI
        }
    };

    const renderTagUsageProjectPanel = (targetEl, tagId, options = {}) => {
        if (!targetEl || !tagId) return;
        const projects = getProjectsUsingTag(tagId);
        logGtdPluginDiag("tag-usage-panel-render", {
            tagId,
            projectCount: projects.length,
            targetClass: targetEl.className || ""
        });
        const panel = targetEl.createEl("div", { cls: "tag-usage-project-card" });
        panel.setAttribute("data-tag-usage-project-panel", tagId);
        console.info("[GTD][tag-usage][panel-render]", {
            tagId,
            count: projects.length,
            projects: projects.map(({ item, direct, relatedCount, visibleInQuickNav }) => ({
                id: item?.id,
                name: item?.project || item?.content || "",
                status: item?.status,
                direct,
                relatedCount,
                visibleInQuickNav
            }))
        });
        const head = panel.createEl("div", { cls: "tag-usage-project-head" });
        head.createEl("div", { cls: "tag-usage-project-title", text: "📌 使用此标签的项目" });
        head.createEl("div", { cls: "tag-usage-project-count", text: `${projects.length} 个` });
        if (projects.length === 0) {
            panel.createEl("div", { cls: "tag-usage-project-empty", text: "暂无项目直接使用此标签。" });
            return;
        }
        const list = panel.createEl("div", { cls: "tag-usage-project-list" });
        projects.forEach(({ item, visibleInQuickNav, statusLabel, direct, relatedCount, examples }) => {
            const row = list.createEl("button", {
                cls: `tag-usage-project-row ${visibleInQuickNav ? "" : "is-disabled"}`,
                attr: { type: "button" }
            });
            row.createEl("span", { cls: "tag-usage-project-name", text: item.project || "未命名项目" });
            const reasonText = direct
                ? (relatedCount > 0 ? `项目自身 + ${relatedCount} 个事项` : "项目自身")
                : `${relatedCount} 个事项`;
            const meta = row.createEl("span", {
                cls: "tag-usage-project-meta",
                text: visibleInQuickNav ? `${reasonText} · 跳转到快速导航` : `${reasonText} · 当前不可见 · ${statusLabel}`
            });
            if (Array.isArray(examples) && examples.length > 0) {
                meta.title = `关联事项：${examples.join("；")}`;
            }
            row.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!visibleInQuickNav) {
                    new Notice("⚠️ 该项目当前不在项目快速导航中，请先调整筛选条件或项目状态");
                    return;
                }
                if (typeof options.beforeReveal === "function") options.beforeReveal();
                requestQuickNavProjectReveal(item.id);
            };
        });
    };



    class TagDefinitionModal extends obsidian.Modal {
        constructor(app, tagId = null, presetParentId = null, presetIsCategory = null) {
            super(app);
            this.tagId = tagId;
            this.presetParentId = presetParentId;
            this.presetIsCategory = presetIsCategory;
            this.modalEl.addClass("gtd-tag-definition-modal");
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("gtd-plugin-tag-definition-content");
            const tag = this.tagId ? TAG_DEFINITIONS[this.tagId] : null;
            logGtdPluginDiag("tag-definition-modal-open", {
                tagId: this.tagId,
                tagLabel: tag?.label || null,
                hasUsageButton: !!this.tagId
            });

            contentEl.createEl("h3", { cls: "gtd-plugin-modal-title", text: this.tagId ? "✏️ 配置标签" : "➕ 新建标签" });
            if (tag) {
                const sub = contentEl.createEl("div", { cls: "tag-modal-subtitle" });
                sub.innerHTML = `<span class="tag-modal-preview-icon" style="background:${tag.color || "#3498db"};">${tag.icon || "🏷️"}</span><span>${tag.label}</span><span class="tag-modal-preview-id">${this.tagId}</span>`;
            } else if (this.presetParentId && TAG_DEFINITIONS[this.presetParentId]) {
                const parentDef = TAG_DEFINITIONS[this.presetParentId];
                contentEl.createEl("div", { cls: "tag-modal-subtitle", text: `将作为「${parentDef.icon} ${parentDef.label}」的子标签` });
            }

            if (this.tagId) {
                const quickRow = contentEl.createEl("div", { cls: "tag-modal-quick-actions" });
                const addChildQuickBtn = quickRow.createEl("button", { cls: "mod-cta", text: "＋ 新增子标签" });
                addChildQuickBtn.onclick = () => {
                    this.close();
                    openTagDefinitionModal(null, this.tagId, false);
                };
                const addSiblingQuickBtn = quickRow.createEl("button", { text: "＋ 新建同级" });
                addSiblingQuickBtn.onclick = () => {
                    this.close();
                    openTagDefinitionModal(null, tag?.parentId || null, false);
                };
            }
            if (this.tagId) {
                renderTagUsageProjectPanel(contentEl, this.tagId, {
                    beforeReveal: () => this.close()
                });
            }

            const form = contentEl.createEl("div", { cls: "tag-form", attr: { style: "margin-top:12px; margin-bottom:0;" } });
            const idRow = form.createEl("div", { cls: "tag-form-row" });
            idRow.createEl("span", { text: "ID:", cls: "tag-form-label" });
            const idInput = idRow.createEl("input", {
                type: "text",
                cls: "tag-form-input",
                value: this.tagId || "",
                attr: this.tagId ? { placeholder: "唯一标识符 (英文)", disabled: "true" } : { placeholder: "唯一标识符 (英文)" }
            });

            const labelRow = form.createEl("div", { cls: "tag-form-row" });
            labelRow.createEl("span", { text: "名称:", cls: "tag-form-label" });
            const labelInput = labelRow.createEl("input", { type: "text", cls: "tag-form-input", value: tag?.label || "", attr: { placeholder: "显示名称" } });

            const iconRow = form.createEl("div", { cls: "tag-form-row" });
            iconRow.createEl("span", { text: "图标:", cls: "tag-form-label" });
            const iconInput = iconRow.createEl("input", { type: "text", cls: "tag-form-input", value: tag?.icon || "🏷️", attr: { placeholder: "Emoji图标" } });

            const colorRow = form.createEl("div", { cls: "tag-form-row" });
            colorRow.createEl("span", { text: "颜色:", cls: "tag-form-label" });
            const colorInput = colorRow.createEl("input", { type: "color", cls: "tag-form-input", value: tag?.color || "#3498db", attr: { style: "width:72px; padding:2px;" } });

            const parentRow = form.createEl("div", { cls: "tag-form-row" });
            parentRow.createEl("span", { text: "父级:", cls: "tag-form-label" });
            const parentSelector = parentRow.createEl("div", { cls: "tag-parent-selector" });
            const parentInputWrapper = parentSelector.createEl("div", { cls: "tag-parent-input-wrapper" });
            const parentInput = parentInputWrapper.createEl("input", { type: "text", cls: "tag-parent-input", attr: { placeholder: "输入标签名称筛选..." } });
            const parentClear = parentInputWrapper.createEl("span", { cls: "tag-parent-clear", text: "×" });
            const parentDropdown = parentSelector.createEl("div", { cls: "tag-parent-dropdown" });

            const excluded = new Set();
            if (this.tagId) {
                excluded.add(this.tagId);
                getDescendantTagIds(this.tagId).forEach(id => excluded.add(id));
            }
            const availableParents = Object.keys(TAG_DEFINITIONS)
                .filter(k => !excluded.has(k))
                .map(k => ({ id: k, ...TAG_DEFINITIONS[k] }))
                .sort((a, b) => (a.label || "").localeCompare(b.label || "", "zh-CN", { numeric: true, sensitivity: "base" }));

            let selectedParentId = tag ? (tag.parentId || null) : (this.presetParentId || null);
            let highlightedIndex = -1;
            const updateInputDisplay = () => {
                if (selectedParentId) {
                    const def = TAG_DEFINITIONS[selectedParentId];
                    parentInput.value = def ? `${def.icon} ${def.label}` : "";
                } else {
                    parentInput.value = "";
                }
            };
            updateInputDisplay();

            const renderParentOptions = (query = "") => {
                parentDropdown.innerHTML = "";
                const q = query.trim().toLowerCase();
                const filtered = q
                    ? availableParents.filter(p => (p.label || "").toLowerCase().includes(q) || (p.id || "").toLowerCase().includes(q))
                    : availableParents;

                const topOpt = parentDropdown.createEl("div", {
                    cls: `tag-parent-option ${!selectedParentId ? "selected" : ""}`,
                    attr: { "data-value": "" }
                });
                topOpt.innerHTML = `<span>🏠</span><span>-- 顶层标签 --</span>`;
                topOpt.onclick = () => {
                    selectedParentId = null;
                    updateInputDisplay();
                    parentDropdown.classList.remove("visible");
                    parentInput.blur();
                };

                if (filtered.length === 0) {
                    parentDropdown.createEl("div", { cls: "tag-parent-empty", text: "无匹配父级" });
                } else {
                    filtered.forEach((p, idx) => {
                        const opt = parentDropdown.createEl("div", {
                            cls: `tag-parent-option ${selectedParentId === p.id ? "selected" : ""} ${idx === highlightedIndex ? "highlighted" : ""}`,
                            attr: { "data-value": p.id }
                        });
                        opt.innerHTML = `<span>${p.icon}</span><span>${p.label}</span>`;
                        opt.onclick = () => {
                            selectedParentId = p.id;
                            updateInputDisplay();
                            parentDropdown.classList.remove("visible");
                            parentInput.blur();
                        };
                    });
                }
                parentDropdown.createEl("div", {
                    cls: "tag-parent-stats",
                    text: q ? `显示 ${filtered.length}/${availableParents.length} 个可选父级` : `共 ${availableParents.length} 个可选父级`
                });
                highlightedIndex = -1;
            };

            const showParentDropdown = () => {
                renderParentOptions(parentInput.value);
                parentDropdown.classList.add("visible");
            };
            const hideParentDropdown = () => {
                window.setTimeout(() => parentDropdown.classList.remove("visible"), 150);
            };
            parentInput.addEventListener("focus", showParentDropdown);
            parentInput.addEventListener("blur", hideParentDropdown);
            parentInput.addEventListener("input", () => {
                highlightedIndex = -1;
                showParentDropdown();
            });
            parentInput.addEventListener("keydown", (e) => {
                const options = parentDropdown.querySelectorAll(".tag-parent-option");
                if (options.length === 0) return;
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
                    options.forEach((opt, i) => opt.classList.toggle("highlighted", i === highlightedIndex));
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    highlightedIndex = Math.max(highlightedIndex - 1, 0);
                    options.forEach((opt, i) => opt.classList.toggle("highlighted", i === highlightedIndex));
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && options[highlightedIndex]) options[highlightedIndex].click();
                } else if (e.key === "Escape") {
                    parentDropdown.classList.remove("visible");
                    parentInput.blur();
                }
            });
            parentClear.onclick = (e) => {
                e.stopPropagation();
                selectedParentId = null;
                updateInputDisplay();
                parentInput.focus();
            };

            const categoryRow = form.createEl("div", { cls: "tag-form-row" });
            categoryRow.createEl("span", { text: "分类:", cls: "tag-form-label" });
            const categoryCheck = categoryRow.createEl("input", { type: "checkbox", cls: "tag-form-checkbox" });
            categoryCheck.checked = tag ? !!tag.isCategory : !!this.presetIsCategory;
            categoryRow.createEl("span", { text: "设为分类（只能包含子标签，不能直接标记条目）", attr: { style: "color:var(--text-muted); font-size:0.85em; margin-left:8px;" } });

            const keywordPanel = form.createEl("div", { cls: "tag-keyword-editor-card" });
            const keywordHead = keywordPanel.createEl("div", { cls: "tag-keyword-editor-head" });
            keywordHead.createEl("div", { cls: "tag-keyword-editor-title", text: "🔎 标签关键词" });
            keywordHead.createEl("div", { cls: "tag-keyword-editor-hint", text: "一行一个关键词；同一个关键词只能绑定一个标签" });
            const keywordInput = keywordPanel.createEl("textarea", {
                cls: "tag-keyword-editor-input",
                text: this.tagId ? getTagKeywords(this.tagId).join("\n") : "",
                attr: { placeholder: "例如：合同\n雷达\n下次行动" }
            });
            const btnRow = form.createEl("div", { cls: "tag-form-row", attr: { style: "justify-content:flex-end; margin-top:15px;" } });
            const cancelBtn = btnRow.createEl("button", { text: "取消" });
            const saveBtn = btnRow.createEl("button", { text: this.tagId ? "保存修改" : "创建标签", cls: "mod-cta" });
            cancelBtn.onclick = () => this.close();
            let formAttempt=null;
            const formLease=tracking.registerEditor(form,{inputs:[...form.querySelectorAll('input,textarea,select')],controls:[saveBtn,cancelBtn],targetLive:()=>true});
            this.formLease=formLease;
            saveBtn.onclick = async () => {
              try {return await formLease.save(async live=>{
                const newId = idInput.value.trim();
                if (!newId) { new Notice("⚠️ 请输入标签ID"); return; }
                if (!labelInput.value.trim()) { new Notice("⚠️ 请输入标签名称"); return; }
                if (!this.tagId && TAG_DEFINITIONS[newId] && !(formAttempt?.newId===newId && JSON.stringify(TAG_DEFINITIONS)===formAttempt.after)) { new Notice("⚠️ 该ID已存在"); return; }
                const keywordValidation = validateTagKeywordAssignment(newId, keywordInput.value.split(/\r?\n/), [this.tagId]);
                if (!keywordValidation.ok) {
                    new Notice(`⚠️ 关键词已被占用：${keywordValidation.conflicts.map((entry) => `${entry.keyword} -> ${entry.tagLabel}`).join("；")}`);
                    return;
                }

                const inputSignature=JSON.stringify([newId,labelInput.value.trim(),iconInput.value.trim(),colorInput.value,selectedParentId,categoryCheck.checked,keywordValidation.keywords]);
                if(formAttempt && formAttempt.inputSignature!==inputSignature)throw Error('GTD_TAG_PENDING_INPUT_CHANGED: 请恢复上次输入完成同步，或取消后重新编辑已保存标签');
                const nextDefinitions=JSON.parse(JSON.stringify(TAG_DEFINITIONS));
                nextDefinitions[newId] = {
                    label: labelInput.value.trim(),
                    icon: iconInput.value.trim() || "🏷️",
                    color: colorInput.value,
                    parentId: selectedParentId || null,
                    isCategory: categoryCheck.checked,
                    order: tag?.order ?? getSortedChildTags(selectedParentId || null).length
                };

                if (this.tagId && this.tagId !== newId) {
                    Object.keys(nextDefinitions).forEach((k) => {
                        if (nextDefinitions[k].parentId === this.tagId) nextDefinitions[k].parentId = newId;
                    });
                    delete nextDefinitions[this.tagId];
                }

                normalizeTagDefinitionOrders(nextDefinitions);
                if(!formAttempt)formAttempt={inputSignature,newId,before:JSON.stringify(TAG_DEFINITIONS),after:JSON.stringify(nextDefinitions),expectedRaw:tagDefinitionRawEvidence,definitionDone:false};
                const memory=JSON.stringify(TAG_DEFINITIONS);
                if(memory!==formAttempt.before && memory!==formAttempt.after)throw Error('GTD_TAG_MEMORY_CHANGED');
                if(!formAttempt.definitionDone){
                    const confirmedRaw=await saveTagDefinitions(JSON.parse(formAttempt.after),{expectedRaw:formAttempt.expectedRaw,live});
                    formAttempt.expectedRaw=confirmedRaw;formAttempt.definitionDone=true;
                } else {
                    const disk=await app.vault.adapter.exists(TAGS_PATH)?await app.vault.adapter.read(TAGS_PATH):null;
                    if(disk!==formAttempt.expectedRaw)throw Error('GTD_TAG_SOURCE_CHANGED');
                }
                if(!live())throw Error('GTD_TAG_EDITOR_STALE_AFTER_DEFINITION');
                if(JSON.stringify(TAG_DEFINITIONS)!==memory)throw Error('GTD_TAG_MEMORY_CHANGED_AFTER_SAVE');
                TAG_DEFINITIONS=JSON.parse(formAttempt.after);
                invalidateCarrierInput();
                if(!live())throw Error('GTD_TAG_EDITOR_STALE_AFTER_DEFINITION');
                await setTagKeywordsForTag(newId, keywordValidation.keywords, this.tagId);
                if(!live())return false;
                formLease.close();
                new Notice(this.tagId ? "✅ 标签已更新" : "✅ 标签已创建");
                this.close();
                if (renderViewFn) renderViewFn();
              });}catch(error){new Notice(String(error?.message||'').startsWith('GTD_TAG_PENDING_INPUT_CHANGED')?'本次输入已改变。请恢复上次输入完成同步，或取消后重新编辑已保存的标签。':'标签保存未完成，输入已保留；已完成步骤不会回滚，请核验后重试。');return false;}
            };

            window.setTimeout(() => {
                if(!formLease.live())return;
                if (this.tagId) labelInput.focus();
                else idInput.focus();
            }, 0);
        }
        close() { if(this.formLease?.busy && this.formLease.live())return; super.close(); }
        onClose() {
            this.formLease?.close();
            this.contentEl.empty();
        }
    }

    const openTagDefinitionModal = (tagId = null, presetParentId = null, presetIsCategory = null) => { if (historySession) return rejectHistoryWrite("openTagDefinitionModal");
        logGtdPluginDiag("open-tag-definition-modal-call", {
            tagId,
            presetParentId,
            presetIsCategory,
            tagLabel: tagId ? TAG_DEFINITIONS[tagId]?.label || null : null
        });
        return new TagDefinitionModal(app, tagId, presetParentId, presetIsCategory).open();
    };

    // 初始化全局状态
    if (ui.gtdShowOnlyFirstClass === undefined) ui.gtdShowOnlyFirstClass = false;
    if (ui.gtdShowOnlyFocus === undefined) ui.gtdShowOnlyFocus = false;
    if (!Array.isArray(ui.gtdTagFilters)) {
        if (window.gtdTagFilter) ui.gtdTagFilters = [window.gtdTagFilter];
        else ui.gtdTagFilters = [];
    }
    // UI state lives in memory only (resets on Obsidian restart); presets are written only on explicit save/delete.
    window.gtdTagFilterPresets = Array.isArray(window.gtdTagFilterPresets) ? normalizeTagFilterPresets(window.gtdTagFilterPresets) : loadPersistedTagFilterPresets();
    ui.gtdTagFilterExpanded = normalizeTagFilterExpandedState(ui.gtdTagFilterExpanded);
    ui.gtdTagFilters = normalizeTagFilterList(ui.gtdTagFilters);
    if (ui.gtdKaioKenMode === undefined) ui.gtdKaioKenMode = false;
    if (ui.gtdTagManagerMode === undefined) ui.gtdTagManagerMode = false;
    if (ui.gtdTagKeywordArchiveExpanded === undefined) ui.gtdTagKeywordArchiveExpanded = false;
    if (ui.gtdRecentIds === undefined) ui.gtdRecentIds = [];
    if (ui.gtdQuickNavCollapsed === undefined) ui.gtdQuickNavCollapsed = {};
    if (!ui.gtdCommentDrawerState || typeof ui.gtdCommentDrawerState !== "object") {
        ui.gtdCommentDrawerState = { isOpen: false, itemId: null, mode: "preview", draft: "" };
    }
    if (ui.gtdCommentPreviewComponent === undefined) ui.gtdCommentPreviewComponent = null;
    if (!(window.gtdOutlinerFileRawCache instanceof Map)) window.gtdOutlinerFileRawCache = new Map();
    if (!(window.gtdOutlinerMarkerBodyCache instanceof Map)) window.gtdOutlinerMarkerBodyCache = new Map();
    if (!window.gtdRelationBridgeRegistry || typeof window.gtdRelationBridgeRegistry !== "object") window.gtdRelationBridgeRegistry = {};
    if (window.gtdPendingRelationFocusNodeKey === undefined) window.gtdPendingRelationFocusNodeKey = "";
    if (!ui.gtdRelationRevealState || typeof ui.gtdRelationRevealState !== "object") {
        ui.gtdRelationRevealState = { archiveItemId: null };
    }
    if (ui.gtdPendingQuickNavRevealProjectId === undefined) ui.gtdPendingQuickNavRevealProjectId = "";

    ui.gtdCurrentDragId = null;
    ui.gtdCurrentDragTagId = null;
    ui.gtdCurrentDragProjectId = null;

    const normalizeGtdMode = (mode) => {
        const normalized = String(mode || "normal").trim().toLowerCase();
        if (["tag-manager", "tag_manager", "tagmanager"].includes(normalized)) return "tag-manager";
        if (["kaioken", "kaio", "kaio-ken"].includes(normalized)) return "kaioken";
        return "normal";
    };
    const setCurrentGtdMode = (mode) => {
        const normalized = normalizeGtdMode(mode);
        ui.gtdTagManagerMode = normalized === "tag-manager";
        ui.gtdKaioKenMode = normalized === "kaioken";
        return normalized;
    };
    const escapeSelectorValue = (value) => String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const JUMP_NODE_PREFIX = "jump:v1:";
    const JUMP_NODE_SEGMENT_COUNT = 5;
    const LEGACY_GTD_NODE_PREFIX = "gtd:item:";
    const encodeJumpSegment = (value) => encodeURIComponent(String(value || "").trim());
    const decodeJumpSegment = (value) => {
        try {
            return decodeURIComponent(String(value || ""));
        } catch (e) {
            return String(value || "").trim();
        }
    };
    const buildJumpNodeKey = ({ viewType = "", notePath = "", scopeType = "", scopeId = "", itemId = "" } = {}) => {
        const segments = [viewType, notePath, scopeType, scopeId, itemId].map((value) => String(value || "").trim());
        if (segments.some((segment) => !segment)) return "";
        return `${JUMP_NODE_PREFIX}${segments.map((segment) => encodeJumpSegment(segment)).join("|")}`;
    };
    const parseJumpNodeKey = (nodeKey) => {
        const normalized = String(nodeKey || "").trim();
        if (!normalized.startsWith(JUMP_NODE_PREFIX)) return null;
        const encodedSegments = normalized.slice(JUMP_NODE_PREFIX.length).split("|");
        if (encodedSegments.length !== JUMP_NODE_SEGMENT_COUNT) return null;
        const [viewType, notePath, scopeType, scopeId, itemId] = encodedSegments.map((segment) => decodeJumpSegment(segment));
        if (!viewType || !notePath || !scopeType || !scopeId || !itemId) return null;
        return {
            nodeKey: buildJumpNodeKey({ viewType, notePath, scopeType, scopeId, itemId }),
            viewType,
            notePath,
            scopeType,
            scopeId,
            itemId
        };
    };
    const getRelationsPluginApi = () => app.plugins?.plugins?.[RELATIONS_PLUGIN_ID]?.api || window.evaCrossViewRelations || null;
    const getLegacyGtdNodeKey = (itemId) => `${LEGACY_GTD_NODE_PREFIX}${String(itemId || "").trim()}`;
    const getGtdItemById = (itemId) => {
        const key = String(itemId || "").trim();
        if (!key) return null;
        return (Array.isArray(gtdList) ? gtdList : []).find((item) => String(item?.id || "").trim() === key) || null;
    };
    const getGtdItemLabel = (item) => {
        if (!item) return "";
        if (item.type === "project") return String(item.project || item.content || item.id || "").trim();
        return typeof getDisplayName === "function"
            ? String(getDisplayName(item) || item.content || item.id || "").trim()
            : String(item.content || item.project || item.id || "").trim();
    };
    const getGtdOwningProjectItemId = (itemId) => {
        const item = getGtdItemById(itemId);
        if (!item) return null;
        if (item.type === "project") return item.id;
        let cursor = item.parentId || null;
        while (cursor) {
            const parent = getGtdItemById(cursor);
            if (!parent) break;
            if (parent.type === "project") return parent.id;
            cursor = parent.parentId || null;
        }
        if (item.project) {
            const matched = (Array.isArray(gtdList) ? gtdList : []).find((entry) =>
                entry?.type === "project"
                && entry?.status === "active"
                && String(entry?.project || "").trim() === String(item.project || "").trim()
            );
            if (matched) return matched.id;
        }
        return null;
    };
    const getGtdScopeInfo = (itemOrId) => {
        const item = typeof itemOrId === "string" ? getGtdItemById(itemOrId) : itemOrId;
        if (!item) return { scopeType: "note", scopeId: currentNotePath };
        return { scopeType: "note", scopeId: currentNotePath };
    };
    const getGtdNodeKey = (itemId) => {
        const normalizedItemId = String(itemId || "").trim();
        if (!normalizedItemId) return "";
        const scopeInfo = getGtdScopeInfo(normalizedItemId);
        return buildJumpNodeKey({
            viewType: GTD_RELATION_VIEW_TYPE,
            notePath: currentNotePath,
            scopeType: scopeInfo.scopeType,
            scopeId: scopeInfo.scopeId,
            itemId: normalizedItemId
        });
    };
    const parseGtdNodeKey = (nodeKey) => {
        const normalized = String(nodeKey || "").trim();
        if (!normalized) return null;
        if (normalized.startsWith(LEGACY_GTD_NODE_PREFIX)) {
            const itemId = normalized.slice(LEGACY_GTD_NODE_PREFIX.length).trim();
            if (!itemId) return null;
            const scopeInfo = getGtdScopeInfo(itemId);
            return {
                nodeKey: normalized,
                viewType: GTD_RELATION_VIEW_TYPE,
                notePath: currentNotePath,
                scopeType: scopeInfo.scopeType,
                scopeId: scopeInfo.scopeId,
                itemId,
                isLegacy: true
            };
        }
        const parsed = parseJumpNodeKey(normalized);
        if (!parsed || parsed.viewType !== GTD_RELATION_VIEW_TYPE) return null;
        return Object.assign({}, parsed, { isLegacy: false });
    };
    const buildGtdItemPathLabel = (itemId) => {
        const item = getGtdItemById(itemId);
        if (!item) return String(itemId || "").trim();
        const parts = [];
        if (item.type === "project") parts.push("项目");
        else if (item.scheduled) parts.push("日程");
        else if (item.project) parts.push(`项目:${item.project}`);
        else parts.push("工作篮");
        const ancestors = [];
        let cursor = item.parentId || null;
        while (cursor) {
            const parent = getGtdItemById(cursor);
            if (!parent) break;
            ancestors.unshift(getGtdItemLabel(parent));
            cursor = parent.parentId || null;
        }
        if (ancestors.length) parts.push(...ancestors);
        parts.push(getGtdItemLabel(item));
        return parts.join(" / ");
    };
    const getGtdRelationSnapshot = (itemId) => {
        const api = getRelationsPluginApi();
        if (!api?.getNodeRelationSnapshot) return { outgoing: [], incoming: [] };
        const primary = api.getNodeRelationSnapshot(getGtdNodeKey(itemId)) || { outgoing: [], incoming: [] };
        const legacy = api.getNodeRelationSnapshot(getLegacyGtdNodeKey(itemId)) || { outgoing: [], incoming: [] };
        const mergeRelations = (listA = [], listB = []) => {
            const merged = [];
            const seen = new Set();
            [...listA, ...listB].forEach((relation) => {
                const key = String(relation?.id || "").trim() || JSON.stringify(relation || {});
                if (seen.has(key)) return;
                seen.add(key);
                merged.push(relation);
            });
            return merged;
        };
        return {
            outgoing: mergeRelations(primary.outgoing, legacy.outgoing),
            incoming: mergeRelations(primary.incoming, legacy.incoming)
        };
    };
    const canSafelyMigrateLegacyGtdKey = (itemId) => {
        const api = getRelationsPluginApi();
        const legacyKey = getLegacyGtdNodeKey(itemId);
        const legacyRecord = api?.getNodeRecord?.(legacyKey);
        if (legacyRecord) {
            return String(legacyRecord?.notePath || "").trim() === currentNotePath;
        }
        const currentItem = getGtdItemById(itemId);
        if (!currentItem) return false;
        const nextRecord = api?.getNodeRecord?.(getGtdNodeKey(itemId));
        if (nextRecord) {
            return String(nextRecord?.notePath || "").trim() === currentNotePath;
        }
        return false;
    };
    const migrateLegacyGtdRelationKeys = async () => {
        const api = getRelationsPluginApi();
        if (!api?.remapNodeKeys || !Array.isArray(gtdList) || gtdList.length === 0) return false;
        const mappings = (Array.isArray(gtdList) ? gtdList : [])
            .map((item) => {
                const itemId = String(item?.id || "").trim();
                if (!itemId || !canSafelyMigrateLegacyGtdKey(itemId)) return null;
                return {
                    from: getLegacyGtdNodeKey(itemId),
                    to: getGtdNodeKey(itemId)
                };
            })
            .filter((entry) => !!entry && entry.from !== entry.to);
        if (mappings.length === 0) return false;
        try {
            const result = await api.remapNodeKeys(mappings, {
                reason: `gtd-key-migration::${currentNotePath}`
            });
            return result?.changed === true;
        } catch (e) {
            console.error("[GTD] migrate legacy relation keys failed:", e);
            return false;
        }
    };
    const ensureGtdRelationTargetStructurallyVisible = (item) => {
        if (!item) return false;
        let changed = false;
        if (item.status === "completed") {
            if (ui.gtdRelationRevealState.archiveItemId !== item.id) {
                ui.gtdRelationRevealState.archiveItemId = item.id;
                changed = true;
            }
        } else if (ui.gtdRelationRevealState.archiveItemId) {
            ui.gtdRelationRevealState.archiveItemId = null;
            changed = true;
        }
        return changed;
    };
    const openGtdRelationHiddenWarningModal = (item) => { if (historySession) return rejectHistoryWrite("openGtdRelationHiddenWarningModal", true);
        const targetLabel = getGtdItemLabel(item) || item?.id || "目标条目";
        const reasons = [];
        if (ui.gtdTagManagerMode) reasons.push("当前在标签管理模式");
        if (ui.gtdKaioKenMode) reasons.push("当前在 KaioKen 模式");
        if (ui.gtdShowOnlyFirstClass) reasons.push("当前开启了“只看精选”");
        if (ui.gtdShowOnlyFocus) reasons.push("当前开启了“本次执行”");
        if (Array.isArray(ui.gtdTagFilters) && ui.gtdTagFilters.length > 0) reasons.push("当前启用了标签筛选");
        const reasonText = reasons.length > 0 ? reasons.join("、") : "当前视图状态未显示该条目";
        const modal = new obsidian.Modal(app);
        modal.onOpen = () => {
            modal.modalEl.style.maxWidth = "720px";
            modal.modalEl.style.width = "88vw";
            modal.contentEl.createEl("h3", { text: "目标条目当前不可见" });
            modal.contentEl.createEl("div", {
                text: `要跳转的 GTD 条目「${targetLabel}」没有出现在当前视图里。`,
                attr: { style: "line-height:1.7;" }
            });
            modal.contentEl.createEl("div", {
                text: `原因提示：${reasonText}。`,
                attr: { style: "margin-top:8px;color:var(--text-muted);line-height:1.7;" }
            });
            modal.contentEl.createEl("div", {
                text: "当前不会自动改动你的筛选或工作模式；你可以手动调整后再跳转。",
                attr: { style: "margin-top:8px;color:var(--text-muted);line-height:1.7;" }
            });
            const actions = modal.contentEl.createEl("div", {
                attr: { style: "display:flex;justify-content:flex-end;margin-top:14px;" }
            });
            const okBtn = actions.createEl("button", { text: "知道了", cls: "mod-cta" });
            okBtn.onclick = () => modal.close();
        };
        modal.open();
    };
    const pulseGtdRelationTarget = (el) => {
        if (!el) return;
        el.classList.add("gtd-rel-focus-hit");
        window.setTimeout(() => el.classList.remove("gtd-rel-focus-hit"), 1800);
    };
    const focusGtdRelationTarget = (targetEl, options = {}) => {
        if (engineIsDisposed()) return false;
        if (!targetEl) return false;
        const host = findScrollHost();
        if (!host) {
            targetEl.scrollIntoView({
                behavior: options.behavior || "smooth",
                block: "center",
                inline: "nearest"
            });
            return true;
        }
        const viewport = getHostViewportMetrics(host);
        const rect = targetEl.getBoundingClientRect();
        const viewportRatio = Number.isFinite(Number(options.viewportRatio)) ? Number(options.viewportRatio) : 0.34;
        const desiredTop = viewport.top + Math.max(18, Math.min(viewport.height - 18, viewport.height * viewportRatio));
        const delta = rect.top - desiredTop;
        const scrollingRoot = document.scrollingElement || document.documentElement;
        const behavior = options.behavior || "smooth";
        if (!Number.isFinite(delta)) return false;
        if (!host || host === scrollingRoot || host === document.documentElement || host === document.body) {
            window.scrollBy({ top: delta, left: 0, behavior });
            return true;
        }
        const maxTop = Math.max(0, host.scrollHeight - host.clientHeight);
        const nextTop = Math.max(0, Math.min(maxTop, Number(host.scrollTop || 0) + delta));
        if (typeof host.scrollTo === "function") {
            host.scrollTo({ top: nextTop, left: Number(host.scrollLeft || 0), behavior });
        } else {
            host.scrollTop = nextTop;
        }
        return true;
    };
    let localPendingNodeKey='';
    const acceptsNavigationKey=key=>{const p=parseGtdNodeKey(key);return !!p&&!p.isLegacy&&p.notePath===currentNotePath&&p.scopeType==='note'&&p.scopeId===currentNotePath&&getGtdNodeKey(p.itemId)===key;};
    const takeNavigationHandoff=()=>{
        const fromEva=String(getRelationsPluginApi()?.consumePendingFocus?.(GTD_RELATION_VIEW_TYPE,currentNotePath)?.nodeKey||'').trim();
        const fromMain=String(window.gtdPendingRelationFocusNodeKey||'').trim();
        const key=acceptsNavigationKey(fromEva)?fromEva:acceptsNavigationKey(fromMain)?fromMain:'';
        if(key){localPendingNodeKey=key;if(window.gtdPendingRelationFocusNodeKey===key)window.gtdPendingRelationFocusNodeKey='';}
        return key;
    };
    const revealGtdNodeKey = (nodeKey, options = {}) => tracking.run(()=>{
        if(engineIsDisposed()||historySession)return false;
        const parsed=parseGtdNodeKey(nodeKey);
        if(!parsed||parsed.isLegacy||parsed.notePath!==currentNotePath||parsed.scopeType!=='note'||parsed.scopeId!==currentNotePath||getGtdNodeKey(parsed.itemId)!==nodeKey)return false;
        const item=getGtdItemById(parsed.itemId);if(!item)return false;
        localPendingNodeKey=nodeKey;
        navigationReceipt=null;
        let needsRender=ensureGtdRelationTargetStructurallyVisible(item);
        const seen=new Set();
        for(let id=item.parentId;id&&!seen.has(id);){seen.add(id);const parent=getGtdItemById(id);if(!parent)break;if(parent.isCollapsed){parent.isCollapsed=false;needsRender=true;}id=parent.parentId;}
        if(needsRender){
            if(navigationInProgress)return false;
            navigationInProgress=true;
            try{if(renderViewFn()!==true)return false;}finally{navigationInProgress=false;}
        }
        const target=container.querySelector(`[data-gtd-node-key="${escapeSelectorValue(nodeKey)}"]`)
            ||container.querySelector(`[data-gtd-anchor-id="${escapeSelectorValue(item.id)}"]`);
        // r40: a hidden (background-tab) target has no layout; scrolling it is a no-op, so it is not a receipt.
        if(!target?.isConnected||target.getClientRects().length===0||focusGtdRelationTarget(target,{behavior:options.behavior||'auto',viewportRatio:0.34})!==true)return false;
        pulseGtdRelationTarget(target);
        navigationReceipt={key:nodeKey,source:currentNotePath,generation:renderGeneration,pass:tracking.consumer.current()};
        getRelationsPluginApi()?.markLastFocusedNode?.(nodeKey);
        if(localPendingNodeKey===nodeKey)localPendingNodeKey='';
        return true;
    });
    // Layout retries are not receipts. A caller can retry explicitly after a refused/pending focus.
    const scheduleGtdRelationFocusRestore = nodeKey => revealGtdNodeKey(String(nodeKey||'').trim());
    const restorePendingGtdRelationFocus = () => {
        const key=localPendingNodeKey;
        return key?revealGtdNodeKey(key):true;
    };
    const activateGtdRelationNote = async nodeKey => {
        if(engineIsDisposed()||!tracking.prepare(tracking.consumer.current()))return false;
        if(GTD_PLUGIN_HOST_ACTIVE())return revealGtdNodeKey(nodeKey);
        const api=window.__gtdTaskManagerPluginApi,pass=tracking.consumer.current();
        if(typeof api?.openView!=='function')return false;
        const result=await api.openView({notePath:currentNotePath,nodeKey});
        return result===true&&!engineIsDisposed()&&window.__gtdTaskManagerPluginApi===api&&tracking.consumer.isCurrent(pass);
    };

    const openGtdRelationEditor = async (itemId) => { if (historySession) return rejectHistoryWrite("openGtdRelationEditor");
        const api = getRelationsPluginApi();
        if (!api?.openRelationEditor) {
            new Notice("⚠️ 请先启用 EVA Cross View Relations 插件");
            return;
        }
        const nodeKey = getGtdNodeKey(itemId);
        const legacyKey = getLegacyGtdNodeKey(itemId);
        await migrateLegacyGtdRelationKeys();
        const legacySnapshot = api.getNodeRelationSnapshot?.(legacyKey) || { outgoing: [], incoming: [] };
        const hasLegacyRelations = (legacySnapshot.outgoing?.length || 0) > 0 || (legacySnapshot.incoming?.length || 0) > 0;
        const editorNodeKey = hasLegacyRelations && !canSafelyMigrateLegacyGtdKey(itemId)
            ? legacyKey
            : nodeKey;
        api.markLastFocusedNode?.(editorNodeKey);
        await api.openRelationEditor(editorNodeKey);
    };
    const captureGtdMetaNode = async (itemId) => { if (historySession) return rejectHistoryWrite("captureGtdMetaNode");
        const api = getRelationsPluginApi();
        if (!api?.captureMetaNode) {
            new Notice("⚠️ 请先启用 EVA Cross View Relations 插件并进入 Meta 模式");
            return false;
        }
        const nodeKey = getGtdNodeKey(itemId);
        api.markLastFocusedNode?.(nodeKey);
        const item = gtdList.find((entry) => String(entry?.id || "") === String(itemId || ""));
        const result = await api.captureMetaNode({
            nodeKey,
            label: getGtdItemLabel(item || {}) || nodeKey,
            sourcePlugin: "gtd-task-manager",
            viewType: GTD_RELATION_VIEW_TYPE
        });
        console.info("[GTD][eva-meta][capture.click]", {
            nodeKey,
            itemId,
            status: result?.ok ? "PASS" : "FAIL",
            phase: result?.state?.phase || "",
            reasonCodes: result?.reason ? [result.reason] : []
        });
        return !!result?.ok;
    };
    let gtdRelationRegistration = null;
async function verifyPersistedRelationMembershipV1(request, options) {
  const {adapter, sourcePath, viewType, notePath, adapterId, assertCurrent, keysFromData, hash} = options;
  assertCurrent();
  if (!request || request.version !== 1 || request.adapterId !== adapterId ||
      request.viewType !== viewType || request.notePath !== notePath || !request.requestToken ||
      !Array.isArray(request.nodeKeys) || !sourcePath) throw Error("INDEX_MEMBERSHIP_REQUEST");
  const wanted = [...request.nodeKeys].sort();
  if (wanted.some(x => typeof x !== "string" || !x || x.trim() !== x) || new Set(wanted).size !== wanted.length) throw Error("INDEX_MEMBERSHIP_KEYS");
  if (!await adapter.exists(sourcePath)) throw Error("INDEX_MEMBERSHIP_SOURCE_MISSING");
  assertCurrent();
  const raw = await adapter.read(sourcePath);
  assertCurrent();
  if (typeof raw !== "string") throw Error("INDEX_MEMBERSHIP_RAW");
  const keys = keysFromData(JSON.parse(raw)).sort();
  if (new Set(keys).size !== keys.length || JSON.stringify(keys) !== JSON.stringify(wanted)) throw Error("INDEX_MEMBERSHIP_MISMATCH");
  const after = await adapter.read(sourcePath);
  assertCurrent();
  if (after !== raw) throw Error("INDEX_MEMBERSHIP_CHANGED");
  return {version:1, kind:"persisted-owner-membership", adapterId, viewType, notePath, sourcePath,
    requestToken:request.requestToken, nodeKeys:keys, revision:hash(raw)};
}


    const releaseGtdRelationRegistration = (lease = gtdRelationRegistration) => {
        if (!lease) return false;
        const current = gtdRelationRegistration === lease;
        if (current) gtdRelationRegistration = null;
        if (typeof lease.api.releaseAdapterRegistration === "function") return lease.api.releaseAdapterRegistration(lease.id, lease.token);
        if (current) { lease.api.unregisterAdapter?.(lease.id); return true; }
        return false;
    };
    const registerGtdRelationAdapter = async () => {
        if (engineIsDisposed()) return false;
        const api = getRelationsPluginApi();
        if (!api?.registerAdapter || !currentNotePath) return;
        const id = `gtd::${currentNotePath}`, previous = gtdRelationRegistration;
        if (previous && (previous.id !== id || previous.api !== api)) releaseGtdRelationRegistration(previous);
        const lease = { api, id, token: {} };
        gtdRelationRegistration = lease;
        const assertRegistration = () => {
            if (engineIsDisposed() || gtdRelationRegistration !== lease || lease.id !== `gtd::${currentNotePath}` || getRelationsPluginApi() !== api) throw new Error("GTD_RELATION_REGISTRATION_CHANGED");
        };
        await api.registerAdapter({
            adapterId: id,
            registrationOwner: lease.token,
            viewType: GTD_RELATION_VIEW_TYPE,
            notePath: currentNotePath,
            viewLabel: getCurrentFile()?.name || "GTD",
            verifyIndexReplacementV1: request => {
                const sourcePath = DB_PATH, notePath = currentNotePath;
                return verifyPersistedRelationMembershipV1(request, {
                    adapter:app.vault.adapter, sourcePath, notePath, adapterId:lease.id, viewType:GTD_RELATION_VIEW_TYPE,
                    assertCurrent:() => { assertRegistration(); if (historySession || DB_PATH !== sourcePath || currentNotePath !== notePath) throw Error("GTD_MEMBERSHIP_SCOPE"); },
                    hash:raw => createHash("sha256").update(raw,"utf8").digest("hex"),
                    keysFromData:list => {
                        if (!Array.isArray(list)) throw Error("GTD_MEMBERSHIP_SHAPE");
                        const ids = new Set(), keys = [];
                        for (const item of list) {
                            if (!item || typeof item !== "object" || Array.isArray(item) ||
                                !["string","number"].includes(typeof item.id) || (typeof item.id === "number" && !Number.isFinite(item.id)) ||
                                !String(item.id) || String(item.id).trim() !== String(item.id) ||
                                !["project","next_action","inbox"].includes(item.type) || !["active","completed"].includes(item.status)) throw Error("GTD_MEMBERSHIP_ITEM");
                            const id = String(item.id);
                            if (ids.has(id)) throw Error("GTD_MEMBERSHIP_DUPLICATE");
                            ids.add(id);
                            if (item.status === "active") keys.push(getGtdNodeKey(item.id));
                        }
                        return keys;
                    }
                });
            },
            listItems: () => { assertRegistration(); return (Array.isArray(gtdList) ? gtdList : []).filter((item) => item?.status === "active").map((item) => ({
                nodeKey: getGtdNodeKey(item.id),
                label: getGtdItemLabel(item),
                pathLabel: buildGtdItemPathLabel(item.id),
                searchText: [
                    getGtdItemLabel(item),
                    item.type || "",
                    item.project || "",
                    buildGtdItemPathLabel(item.id)
                ].filter(Boolean).join(" "),
                metaFields: buildGtdStructuralMetaFields(item)
            })); },
            openNode: async (nodeKey, context = {}) => {
                assertRegistration();
                if (historySession) exitHistory();
                const activePath = app.workspace?.getActiveFile?.()?.path || "";
                const isActiveLeaf = !!container.closest(".workspace-leaf.mod-active");
                if (context?.fromPlugin !== false && !((isActiveLeaf && activePath === currentNotePath) || GTD_PLUGIN_HOST_ACTIVE())) {
                    console.info("[GTD Relations][open-node.defer-activate]", {
                        nodeKey,
                        notePath: currentNotePath,
                        activePath,
                        isActiveLeaf
                    });
                    return await activateGtdRelationNote(nodeKey);
                }
                const result = revealGtdNodeKey(nodeKey, { behavior: "smooth" });
                console.info("[GTD Relations][open-node.reveal-result]", {
                    nodeKey,
                    notePath: currentNotePath,
                    result
                });
                // A failed focus stays failed; do not hide it behind a second attempt.
                if (result === true) return true;
                return false;
            }
        });
        if (engineIsDisposed() || gtdRelationRegistration !== lease || lease.id !== `gtd::${currentNotePath}` || getRelationsPluginApi() !== api) { releaseGtdRelationRegistration(lease); return false; }
        if (!historySession) await migrateLegacyGtdRelationKeys();
    };
    let ownedRelationCleanup = null;
    const bindGtdRelationChangeListener = () => {
        if (engineIsDisposed()) return false;
        const registryKey = `gtd::${currentNotePath}`;
        const existing = window.gtdRelationBridgeRegistry?.[registryKey];
        if (typeof existing === "function") {
            try { existing(); } catch (e) {}
        }
        const onChanged = () => renderViewFn?.();
        window.addEventListener("eva-cross-view-relations:changed", onChanged);
        const cleanup = () => {
            window.removeEventListener("eva-cross-view-relations:changed", onChanged);
            if (window.gtdRelationBridgeRegistry?.[registryKey] === cleanup) delete window.gtdRelationBridgeRegistry[registryKey];
        };
        ownedRelationCleanup = cleanup;
        window.gtdRelationBridgeRegistry[registryKey] = cleanup;
    };
    const getScrollRange = (el) => {
        if (!el) return 0;
        return Math.max(0, Number(el.scrollHeight || 0) - Number(el.clientHeight || 0));
    };
    const findScrollHost = () => {
        const candidates = [];
        let el = container;
        while (el) {
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY || "";
            const overflowX = style.overflowX || "";
            const canScrollY = /(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight + 4;
            const canScrollX = /(auto|scroll|overlay)/.test(overflowX) && el.scrollWidth > el.clientWidth + 4;
            if (canScrollY || canScrollX) {
                let bonus = 0;
                const className = typeof el.className === "string" ? el.className : "";
                if (/\b(markdown-reading-view|markdown-preview-view|view-content|workspace-leaf-content)\b/.test(className)) {
                    bonus += 100000;
                }
                candidates.push({ el, score: getScrollRange(el) + bonus });
            }
            el = el.parentElement;
        }
        const docEl = document.scrollingElement || document.documentElement;
        candidates.push({ el: docEl, score: getScrollRange(docEl) + 50000 });
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0]?.el || docEl;
    };
    const getHostViewportMetrics = (host) => {
        const scrollingRoot = document.scrollingElement || document.documentElement;
        if (!host || host === scrollingRoot || host === document.documentElement || host === document.body) {
            return { top: 0, bottom: window.innerHeight, height: window.innerHeight, left: 0, right: window.innerWidth, width: window.innerWidth };
        }
        const rect = host.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, left: rect.left, right: rect.right, width: rect.width };
    };

    // --- 1. 核心交互组件 ---
    class QuickSuggester extends obsidian.FuzzySuggestModal {
        constructor(app, items, onChoose) { super(app); this.items = items; this.onChoose = onChoose; }
        getItems() { return this.items; }
        getItemText(item) { return item; }
        onChooseItem(item, evt) { this.onChoose(item); }
    }
    
    // --- 层级标签选择器（支持树状展示）---
    class TagSuggester extends obsidian.FuzzySuggestModal {
        constructor(app, currentTags, onChoose) {
            super(app);
            this.currentTags = currentTags || [];
            this.onChoose = onChoose;
            // 构建层级列表：先顶层，然后递归加入子级
            this.items = [];
            const buildTreeItems = (parentId, level) => {
                const children = getChildTags(parentId);
                children.forEach(key => {
                    const def = TAG_DEFINITIONS[key];
                    const isSelected = this.currentTags.includes(key);
                    const indent = "　".repeat(level); // 全角空格缩进
                    const prefix = level > 0 ? "└─ " : "";
                    this.items.push({
                        key: key,
                        label: def.label,
                        icon: def.icon,
                        color: def.color,
                        isCategory: def.isCategory || false,
                        level: level,
                        displayText: `${indent}${prefix}${def.icon} ${def.label}`,
                        desc: def.isCategory ? "📁 分类" : (isSelected ? "✅ 已应用" : "⬜ 点击添加"),
                        action: isSelected ? "remove" : "add"
                    });
                    buildTreeItems(key, level + 1); // 递归子级
                });
            };
            buildTreeItems(null, 0); // 从顶层开始
        }
        getItems() { return this.items; }
        getItemText(item) { return `${item.displayText}  ${item.desc}`; }
        onChooseItem(item, evt) {
            // 分类标签不可直接选择，只能选子标签
            if (item.isCategory) {
                new Notice(`📁 "${item.label}" 是分类，请选择其下的子标签`);
                return;
            }
            this.onChoose(item);
        }
    }

    class QuickPrompt extends obsidian.Modal {
        constructor(app, title, placeholder, onSubmit, defaultValue = "") {
            super(app); this.titleStr = title; this.placeholder = placeholder; this.defaultValue = defaultValue; this.onSubmit = onSubmit;
        }
        onOpen() {
            const { contentEl } = this; contentEl.createEl("h3", { text: this.titleStr });
            const input = contentEl.createEl("input", { type: "text", value: this.defaultValue });
            input.placeholder = this.placeholder; input.style.width = "100%"; input.focus();
            const btn = contentEl.createEl("button", { text: "确定", cls: "mod-cta", style: "margin-top:15px; float:right;" });
            const submit = async () => { if(!input.value||this.submitting||this.__inputRecovery&&!this.__inputRecovery.canLeave())return;this.submitting=true;btn.disabled=true;input.disabled=true;try{await this.onSubmit(input.value);this.close();}catch(error){new Notice('未完成，输入已保留：'+String(error.message||error),10000);}finally{this.submitting=false;btn.disabled=false;input.disabled=false;} };
            btn.onclick = submit; input.addEventListener("keypress", (e) => { if (e.key === "Enter") submit(); });
        }
        onClose() { this.contentEl.empty(); }
    }
    class ConfirmModal extends obsidian.Modal {
        constructor(app, title, message, onConfirm, confirmText = "确认") {
            super(app);
            this.titleStr = title;
            this.message = message;
            this.onConfirm = onConfirm;
            this.confirmText = confirmText;
            this.resolved = false;
        }
        resolve(value) {
            if (this.resolved) return;
            this.resolved = true;
            this.onConfirm(value);
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.createEl("h3", { text: this.titleStr });
            const msgEl = contentEl.createEl("div");
            msgEl.innerHTML = this.message;
            msgEl.style.marginBottom = "20px";
            
            const btnDiv = contentEl.createEl("div", { attr: { style: "display:flex; justify-content:flex-end; gap:10px;" } });
            const cancelBtn = btnDiv.createEl("button", { text: "取消" });
            cancelBtn.onclick = () => { this.resolve(false); this.close(); };
            const confirmBtn = btnDiv.createEl("button", { text: this.confirmText, cls: "mod-cta" });
            confirmBtn.onclick = () => { this.resolve(true); this.close(); };
        }
        onClose() {
            this.resolve(false);
            this.contentEl.empty();
        }
    }

    class GtdWorkspaceCommentModal extends obsidian.Modal {
        constructor(app, options = {}) {
            super(app);
            this.options = options;
            this.result = null;
            this.didExplicitCancel = false;
            this.textareaEl = null;
            this.waiter = new Promise((resolve) => { this._resolve = resolve; });
        }
        onOpen() {
            const { contentEl } = this;
            const { title = "评论", value = "" } = this.options;
            this.result = null;
            this.didExplicitCancel = false;
            this.textareaEl = null;
            contentEl.empty();
            this.modalEl.style.maxWidth = "1100px";
            this.modalEl.style.width = "92vw";
            this.modalEl.style.height = "78vh";
            contentEl.style.display = "flex";
            contentEl.style.flexDirection = "column";
            contentEl.style.height = "100%";
            contentEl.style.gap = "10px";
            contentEl.createEl("h3", { text: title });
            contentEl.createEl("div", { text: "可写长评论，列表中展示前 100 字摘要。", cls: "gtd-workspace-modal-desc" });
            const textarea = contentEl.createEl("textarea", { text: value, cls: "gtd-workspace-comment-textarea" });
            this.textareaEl = textarea;
            textarea.placeholder = "记录思路、补充信息、执行细节...";
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
            textarea.selectionEnd = textarea.value.length;
            const counter = contentEl.createEl("div", { cls: "gtd-workspace-comment-counter" });
            const updateCounter = () => { counter.textContent = `${textarea.value.length} 字`; };
            textarea.addEventListener("input", updateCounter);
            updateCounter();
            const actions = contentEl.createDiv({ cls: "gtd-workspace-modal-actions" });
            const clearBtn = actions.createEl("button", { text: "清空评论" });
            clearBtn.onclick = () => this.submitComment({ action: "clear" });
            const cancelBtn = actions.createEl("button", { text: "取消" });
            cancelBtn.onclick = () => { this.didExplicitCancel = true; this.close(); };
            const saveBtn = actions.createEl("button", { text: "保存评论", cls: "mod-cta" });
            saveBtn.onclick = () => this.submitComment({ action: "save", value: textarea.value });
        }
        async submitComment(result) {
            if (this.saving || this.closed || this.saved) return;
            if (this.__inputRecovery && !this.__inputRecovery.canLeave()) return;
            this.saving = true;
            for (const el of this.contentEl.querySelectorAll('button,textarea')) el.disabled = true;
            try {
                if (this.options.onSubmit) await this.options.onSubmit(result);
                this.saved = true;
                this.result = this.options.onSubmit ? null : result;
                this.saving = false;
                if (!this.closed) this.close();
            } catch (error) {
                if (!this.closed) {
                    if (!this.errorEl) this.errorEl = this.contentEl.createEl('p');
                    this.errorEl.textContent = '保存未完成，输入已保留，请核对后重试：' + String(error.message || error);
                }
            } finally {
                this.saving = false;
                if (!this.closed) for (const el of this.contentEl.querySelectorAll('button,textarea')) el.disabled = false;
            }
        }
        close() { if (this.saving) return; return super.close(); }
        onClose() {
            this.closed = true;
            if (!this.options.onSubmit && !this.result && !this.didExplicitCancel) {
                this.result = { action: "save", value: String(this.textareaEl?.value || "") };
            }
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
    }

    class GtdWorkspaceNoteBindingModal extends obsidian.Modal {
        constructor(app, options = {}) {
            super(app);
            this.options = options;
            this.result = null;
            this.filtered = [];
            this.activeIndex = 0;
            this.waiter = new Promise((resolve) => { this._resolve = resolve; });
        }
        onOpen() {
            const { contentEl } = this;
            const { title = "绑定笔记", value = "", noteIndex = [], onOpenCurrent = null } = this.options;
            this.filtered = [];
            this.activeIndex = 0;
            contentEl.empty();
            this.modalEl.style.maxWidth = "1100px";
            this.modalEl.style.width = "92vw";
            this.modalEl.style.height = "80vh";
            contentEl.style.display = "flex";
            contentEl.style.flexDirection = "column";
            contentEl.style.height = "100%";
            contentEl.style.gap = "8px";
            contentEl.createEl("h3", { text: title });
            contentEl.createEl("div", { text: "已有笔记会直接列出来；也可以手动输入文件名或路径绑定。", cls: "gtd-workspace-modal-desc" });
            if (value) {
                const currentWrap = contentEl.createDiv({ cls: "gtd-note-picker-current" });
                currentWrap.createEl("div", { text: "当前绑定", cls: "gtd-note-picker-label" });
                currentWrap.createEl("div", { text: value, cls: "gtd-note-picker-path" });
                const currentActions = currentWrap.createDiv({ cls: "gtd-workspace-modal-actions" });
                if (typeof onOpenCurrent === "function") {
                    const openBtn = currentActions.createEl("button", { text: "打开当前绑定" });
                    openBtn.onclick = () => { onOpenCurrent(); };
                }
                const clearCurrentBtn = currentActions.createEl("button", { text: "清除绑定" });
                clearCurrentBtn.onclick = () => { this.result = { action: "clear", value: "" }; this.close(); };
            }
            const input = contentEl.createEl("input", {
                type: "text",
                cls: "gtd-workspace-modal-input",
                attr: { placeholder: "输入关键词筛选，或直接输入文件名/路径后绑定" },
            });
            input.value = value || "";
            const stat = contentEl.createEl("div", { text: "", cls: "gtd-workspace-modal-desc" });
            const listEl = contentEl.createDiv({ cls: "gtd-note-picker-list" });
            const actions = contentEl.createDiv({ cls: "gtd-workspace-modal-actions" });
            const syncActiveRows = () => {
                Array.from(listEl.children).forEach((child, idx) => {
                    if (!(child instanceof HTMLElement)) return;
                    child.classList.toggle("is-active", idx === this.activeIndex);
                });
            };
            const renderList = () => {
                const q = String(input.value || "").trim().toLowerCase();
                const terms = q ? q.split(/\s+/).filter(Boolean) : [];
                const matched = !terms.length
                    ? noteIndex.slice(0, 240)
                    : noteIndex.filter((item) => {
                        const hay = `${item.search || ""} ${item.basenameLower || ""} ${item.pathLower || ""}`.toLowerCase();
                        return terms.every((term) => hay.includes(term));
                    }).slice(0, 240);
                this.filtered = matched;
                if (this.activeIndex >= matched.length) this.activeIndex = Math.max(0, matched.length - 1);
                stat.textContent = `共 ${matched.length} 条结果`;
                listEl.empty();
                if (matched.length === 0) {
                    listEl.createDiv({ text: "无匹配笔记", cls: "gtd-note-picker-empty" });
                    return;
                }
                matched.forEach((item, idx) => {
                    const row = listEl.createDiv({ cls: `gtd-note-picker-row ${idx === this.activeIndex ? "is-active" : ""}`.trim() });
                    row.createEl("div", { text: `📄 ${item.basename}`, cls: "gtd-note-picker-label" });
                    row.createEl("div", { text: item.path, cls: "gtd-note-picker-path" });
                    row.onclick = () => { this.result = { action: "save", value: item.path }; this.close(); };
                    row.onmouseenter = () => { this.activeIndex = idx; syncActiveRows(); };
                });
            };
            input.addEventListener("input", () => { this.activeIndex = 0; renderList(); });
            const clearBtn = actions.createEl("button", { text: "清除绑定" });
            clearBtn.onclick = () => { this.result = { action: "clear", value: "" }; this.close(); };
            const cancelBtn = actions.createEl("button", { text: "取消" });
            cancelBtn.onclick = () => this.close();
            const saveBtn = actions.createEl("button", { text: "绑定输入内容", cls: "mod-cta" });
            const submit = () => { this.result = { action: "save", value: String(input.value || "").trim() }; this.close(); };
            saveBtn.onclick = submit;
            input.addEventListener("keydown", (event) => {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    if (this.activeIndex < this.filtered.length - 1) this.activeIndex += 1;
                    syncActiveRows();
                } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    if (this.activeIndex > 0) this.activeIndex -= 1;
                    syncActiveRows();
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    const selected = this.filtered[this.activeIndex];
                    if (selected) {
                        this.result = { action: "save", value: selected.path };
                        this.close();
                    } else {
                        submit();
                    }
                }
            });
            renderList();
            window.setTimeout(() => { input.focus(); input.select(); }, 0);
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

        const prompt = (title, placeholder = "", defaultValue = "") => historySession ? (rejectHistoryWrite("prompt"), Promise.resolve(null)) : tracking.wait(new Promise(r => new QuickPrompt(app, title, placeholder, r, defaultValue).open()));
    const suggester = (items) => historySession ? (rejectHistoryWrite("suggester"), Promise.resolve(null)) : tracking.wait(new Promise(r => new QuickSuggester(app, items, r).open()));
    const tagSelector = (currentTags) => historySession ? (rejectHistoryWrite("tagSelector"), Promise.resolve(null)) : tracking.wait(new Promise(r => new TagSuggester(app, currentTags, r).open()));
    const confirm = (title, message, confirmText = "确认") => historySession ? (rejectHistoryWrite("confirm"), Promise.resolve(null)) : tracking.wait(new Promise(r => new ConfirmModal(app, title, message, r, confirmText).open()));

    // --- 2. 文件管理 ---
    const getOrCreateProjectFile = async (projectName) => { if (historySession && externalWriteDepth === 0) return rejectHistoryWrite("getOrCreateProjectFile");
        const projectPath = `${currentFolder}/${projectName}.md`;
        let projectFile = app.vault.getAbstractFileByPath(projectPath);
        if (!projectFile) {
            const initialContent = `创建时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}\n\n# ${projectName}\n\n## 项目概述\n\n## 相关资料\n\n`;
            await app.vault.create(projectPath, initialContent);
            projectFile = app.vault.getAbstractFileByPath(projectPath);
            new Notice(`📄 已自动创建项目文件: ${projectName}`);
        }
        return projectFile;
    };

    const openOrCreateNote = async (displayName) => { if (historySession) return rejectHistoryWrite("openOrCreateNote");
        const sourcePath = getCurrentFile().path;
        const existing = app.metadataCache.getFirstLinkpathDest(displayName, sourcePath);
        if (!existing) {
            const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
            const parentPath = sourceFile?.parent?.path || "";
            const newPath = parentPath && parentPath !== "/" ? `${parentPath}/${displayName}.md` : `${displayName}.md`;
            const initialContent = `创建时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}\n\n`;
            await app.vault.create(newPath, initialContent);
        }
        await app.workspace.openLinkText(displayName, sourcePath, true);
    };

    // --- 3. 数据处理与自愈机制 ---
    const repairOrphans = (list) => {
        let fixedCount = 0;
        const idMap = new Map(list.map(i => [i.id, i]));
        list.forEach(item => {
            if (item.status === 'active' && item.parentId) {
                const parent = idMap.get(item.parentId);
                if (parent && parent.status === 'completed') {
                    parent.status = 'active';
                    delete parent.completed_date;
                    delete parent.archived_by_project;
                    fixedCount++;
                }
            }
        });
        return fixedCount;
    };

    const repairHierarchyConsistency = (list) => {
        let fixedMissingParent = 0;
        let fixedInvalidParentType = 0;
        let fixedProjectMismatch = 0;
        const idMap = new Map(list.map(i => [i.id, i]));
        list.forEach(item => {
            if (item.status !== "active") return;
            if (item.type !== "next_action" && item.type !== "inbox") return;
            const parentId = item.parentId || null;
            if (!parentId) return;
            const parent = idMap.get(parentId);
            if (!parent) {
                item.parentId = null;
                fixedMissingParent++;
                return;
            }
            if (item.type === "next_action" && parent.type !== "next_action") {
                item.parentId = null;
                fixedInvalidParentType++;
                return;
            }
            if (item.type === "next_action" && parent.type === "next_action") {
                const parentProject = parent.project || null;
                if ((item.project || null) !== parentProject) {
                    item.project = parentProject;
                    fixedProjectMismatch++;
                }
            }
        });
        return { fixedMissingParent, fixedInvalidParentType, fixedProjectMismatch };
    };

    const repairTaskCycles = (list) => {
        let fixedCycles = 0;
        const idMap = new Map(list.map(i => [i.id, i]));
        list.forEach(item => {
            if (item.status !== "active") return;
            if (item.type !== "next_action" && item.type !== "inbox") return;
            let current = item;
            const seen = new Set([item.id]);
            while (current && current.parentId) {
                const nextId = current.parentId;
                if (seen.has(nextId)) {
                    current.parentId = null;
                    fixedCycles++;
                    break;
                }
                seen.add(nextId);
                current = idMap.get(nextId) || null;
            }
        });
        return fixedCycles;
    };

    const ensureProjectBucketsExist = (list) => {
        let fixedMissingProjectName = 0;
        let createdProjects = 0;
        const today = moment().format("YYYY-MM-DD");
        const activeProjectNames = new Set(
            list
                .filter(i => i.type === "project" && i.status === "active" && i.project)
                .map(i => i.project)
        );
        let nextSortOrder =
            list
                .filter(i => i.type === "project")
                .map(i => Number(i?.sortOrder))
                .filter(v => Number.isFinite(v))
                .reduce((max, value) => Math.max(max, value), 0) + 10;

        list.forEach(item => {
            if (item.status !== "active") return;
            if (item.type !== "next_action" && item.type !== "inbox") return;
            if (item.type === "next_action" && !item.project) {
                item.project = "未分类";
                fixedMissingProjectName++;
            }
            const projectName = item.project || null;
            if (!projectName || activeProjectNames.has(projectName)) return;
            list.push({
                id: `${Date.now()}${Math.random().toString().slice(2, 8)}`,
                type: "project",
                status: "active",
                created: today,
                project: projectName,
                content: null,
                scheduled: null,
                deadline: null,
                isFirstClass: false,
                isFocusSession: false,
                isDimmed: false,
                isCollapsed: false,
                tags: [],
                parentId: null,
                sortOrder: nextSortOrder
            });
            nextSortOrder += 10;
            activeProjectNames.add(projectName);
            createdProjects++;
        });

        return { fixedMissingProjectName, createdProjects };
    };

    const loadData = async (options = {}) => {
        if (!await app.vault.adapter.exists(DB_PATH)) return [];
        const content = await app.vault.adapter.read(DB_PATH);
        assertHostCurrent();
        try { 
            let list = JSON.parse(content);
            let modified = false;
            list.forEach(i => { 
                if(i.isFirstClass === undefined) i.isFirstClass = false;
                if(i.isFocusSession === undefined) i.isFocusSession = false;
                if(i.isDimmed === undefined) i.isDimmed = false; 
                if(i.isCollapsed === undefined) i.isCollapsed = false;
                if(i.tags === undefined) i.tags = []; 
                if(!i.id) i.id = Date.now() + Math.random().toString().slice(2,8);
                if(i.deadline === undefined) i.deadline = null;
                if(!i.created) i.created = moment().format("YYYY-MM-DD");
                if(i.parentId === undefined) i.parentId = null; 
            });
            const repairedCount = repairOrphans(list);
            if (repairedCount > 0) { new Notice(`🚑 自动修复 ${repairedCount} 个父级状态`); modified = true; }
            const hierarchyFix = repairHierarchyConsistency(list);
            const hierarchyFixCount = hierarchyFix.fixedMissingParent + hierarchyFix.fixedInvalidParentType + hierarchyFix.fixedProjectMismatch;
            if (hierarchyFixCount > 0) {
                new Notice(`🧩 自动修复层级异常 ${hierarchyFixCount} 处（孤儿/跨类型/项目不同步）`);
                modified = true;
            }
            const cycleFixCount = repairTaskCycles(list);
            if (cycleFixCount > 0) {
                new Notice(`♻️ 自动断开 ${cycleFixCount} 处循环父子关系`);
                modified = true;
            }
            const projectBucketFix = ensureProjectBucketsExist(list);
            const projectBucketFixCount = projectBucketFix.fixedMissingProjectName + projectBucketFix.createdProjects;
            if (projectBucketFixCount > 0) {
                new Notice(`🗂️ 自动修复 ${projectBucketFixCount} 处项目归属异常`);
                modified = true;
            }
            if (modified) options.onRepaired?.();
            if (modified && options.persistRepairs !== false) {
                const jsonString = JSON.stringify(list, null, 2);
                // A refused repair write keeps the parsed list visible; the repair is retried later.
                try { await managedGtdPersist(DB_PATH, jsonString, 'project'); refreshDataRevision(DB_PATH); }
                catch (e) { deferredRepairWrite = true; console.error("[GTD][repair-persist-deferred]", e?.message || e); }
            }
            return list;
        } catch (e) { return []; }
    };
    const historyBoot = pluginDiag?.historyBoot && typeof pluginDiag.historyBoot === "object" ? pluginDiag.historyBoot : null;
    gtdList = await loadData({ persistRepairs: !historyBoot, onRepaired: () => { if (historyBoot) deferredRepairWrite = true; } });
    invalidateCarrierInput();
    assertHostCurrent();
    let renderViewFn = null;
    let tagKeywordArchiveExpanded = false;

    const isArchivedKeywordLabel = keyword => isStoppedContextKeyword(keyword);

    let gtdWriteChain = Promise.resolve();
    const updateGTD = (operationFn) => {
        if (historySession && externalWriteDepth === 0) return Promise.resolve(rejectHistoryWrite("updateGTD"));
        const run = gtdWriteChain.then(() => updateGTDNow(operationFn));
        gtdWriteChain = run.catch(() => {});
        return run;
    };
    const updateGTDNow = async (operationFn) => {
        const sourceEvidence=operationFn.requireSourceCAS?await app.vault.adapter.read(DB_PATH):undefined;
        if(operationFn.requireSourceCAS&&typeof sourceEvidence!=='string')throw Error('GTD_COMMENT_SOURCE_UNKNOWN');
        let currentList = await loadData({ persistRepairs: false });
        const operationResult = operationFn(currentList);
        if(operationFn.requireSourceCAS&&operationResult===false)return;
        const jsonString = JSON.stringify(currentList, null, 2);
        const file = app.vault.getAbstractFileByPath(DB_PATH);
        await managedGtdPersist(DB_PATH, jsonString, 'project', operationFn.requireSourceCAS?{expectedRaw:sourceEvidence,live:()=>!engineIsDisposed()&&operationFn.editorLive()}:undefined);
        gtdList = currentList;
        invalidateCarrierInput();
        deferredRepairWrite = false;
        refreshDataRevision(DB_PATH);
        dispatchContextCarrierChanged("gtd-list-saved");
        if (renderViewFn) renderViewFn(); 
    };

    const disposeCommentPreviewComponent = () => {
        previewSerial++;
        const comp = ui.gtdCommentPreviewComponent;
        if (comp && typeof comp.unload === "function") {
            try { comp.unload(); } catch (e) {}
        }
        ui.gtdCommentPreviewComponent = null;
    };

    const getItemById = (id) => gtdList.find(i => i.id === id) || null;
    const getItemCommentText = (item) => (typeof item?.comment === "string" ? item.comment : "");
    const getItemNoteBinding = (item) => {
        if (!item?.noteBinding) return null;
        if (typeof item.noteBinding === "string") return item.noteBinding.trim() || null;
        if (typeof item.noteBinding === "object") {
            const path = String(item.noteBinding.path || "").trim();
            return path ? { path, ctime: Number(item.noteBinding.ctime) || null } : null;
        }
        return null;
    };
    const getBindingLabel = (noteBinding) => {
        if (!noteBinding) return "";
        const path = typeof noteBinding === "string" ? noteBinding : String(noteBinding.path || "");
        const clean = path.trim();
        if (!clean) return "";
        return clean.split("/").pop()?.replace(/\.md$/i, "") || clean;
    };
    const buildVaultNoteIndex = () => app.vault.getMarkdownFiles()
        .map((file) => ({
            path: file.path,
            basename: file.basename,
            basenameLower: file.basename.toLowerCase(),
            pathLower: file.path.toLowerCase(),
            search: `${file.basename} ${file.path}`.toLowerCase(),
        }))
        .sort((a, b) => a.basename.localeCompare(b.basename, "zh"));
    const resolveExistingNoteFile = (rawPath) => {
        const clean = String(rawPath || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
        if (!clean) return null;
        const noExt = clean.replace(/\.md$/i, "");
        const withExt = clean.endsWith(".md") ? clean : `${clean}.md`;
        const exact = app.vault.getAbstractFileByPath(clean) || app.vault.getAbstractFileByPath(withExt);
        if (exact && exact.extension === "md") return exact;
        const linked = app.metadataCache.getFirstLinkpathDest(clean, currentNotePath)
            || app.metadataCache.getFirstLinkpathDest(noExt, currentNotePath)
            || app.metadataCache.getFirstLinkpathDest(noExt.split("/").pop() || noExt, currentNotePath);
        if (linked && linked.extension === "md") return linked;
        const basename = withExt.split("/").pop()?.toLowerCase() || "";
        return app.vault.getMarkdownFiles().find((file) => file.name.toLowerCase() === basename) || null;
    };
    const resolveBoundFileResult = (noteBinding) => {
        const path = typeof noteBinding === "string" ? noteBinding : String(noteBinding?.path || "");
        const ctime = typeof noteBinding === "object" && Number.isFinite(Number(noteBinding?.ctime))
            ? Number(noteBinding.ctime)
            : null;
        if (!path && !Number.isFinite(ctime)) return { file: null, binding: null, repairedByCtime: false, matchCount: 0 };
        const binding = { path: String(path || "").trim(), ctime };
        const direct = binding.path ? resolveExistingNoteFile(binding.path) : null;
        if (direct) return { file: direct, binding, repairedByCtime: false, matchCount: 1 };
        if (!Number.isFinite(ctime)) return { file: null, binding, repairedByCtime: false, matchCount: 0 };
        const matches = app.vault.getMarkdownFiles().filter((file) => Number(file?.stat?.ctime) === Number(ctime));
        if (matches.length === 1) return { file: matches[0], binding, repairedByCtime: true, matchCount: 1 };
        return { file: null, binding, repairedByCtime: false, matchCount: matches.length };
    };
    const resolveBoundFile = (noteBinding) => {
        return resolveBoundFileResult(noteBinding).file;
    };
    const repairItemNoteBindingPathByCtime = async (itemId, binding, file) => { if (historySession) return rejectHistoryWrite("repairItemNoteBindingPathByCtime", true);
        if (!itemId || !file || !binding?.path || binding.path === file.path) return;
        const bindingValue = { path: file.path, ctime: Number(file?.stat?.ctime) || Number(binding.ctime) || null };
        await updateGTD((list) => {
            const idx = list.findIndex(i => i.id === itemId);
            if (idx < 0) return;
            list[idx].noteBinding = bindingValue;
        });
        new Notice("已自动修复绑定路径");
    };
    const findOpenRootLeafForFile = (file) => {
        if (!file?.path || typeof app.workspace.iterateRootLeaves !== "function") return null;
        let found = null;
        app.workspace.iterateRootLeaves((leaf) => {
            if (found) return;
            if (leaf?.view?.file?.path === file.path) found = leaf;
        });
        return found;
    };
    const activateLeaf = (leaf, focus = false) => {
        if (!leaf || typeof app.workspace.setActiveLeaf !== "function") return false;
        try {
            app.workspace.setActiveLeaf(leaf, { focus });
            return true;
        } catch (error) {
            try {
                app.workspace.setActiveLeaf(leaf, focus);
                return true;
            } catch (innerError) {
                console.warn("[GTD][leaf.activate-failed]", { error: innerError || error });
            }
        }
        return false;
    };
    const openFilePreferExistingLeaf = async (file) => {
        if (!file) return false;
        const existingLeaf = findOpenRootLeafForFile(file);
        if (existingLeaf) {
            activateLeaf(existingLeaf, true);
            return true;
        }
        await app.workspace.getLeaf("tab").openFile(file);
        return true;
    };
    const openBoundNote = async (noteBinding, itemId = null) => {
        const result = resolveBoundFileResult(noteBinding);
        const file = result.file;
        if (!file) {
            new Notice("未找到绑定笔记。");
            return false;
        }
        if (result.repairedByCtime && itemId) {
            await repairItemNoteBindingPathByCtime(itemId, result.binding, file);
        }
        await openFilePreferExistingLeaf(file);
        return true;
    };
    const summarizeComment = (text, maxLen = 24) => {
        const clean = String(text || "").replace(/\s+/g, " ").trim();
        if (!clean) return "";
        return clean.length > maxLen ? `${clean.slice(0, maxLen)}...` : clean;
    };

    const normalizeCommentDrawerMode = (mode) => {
        if (mode === "preview") return "preview";
        if (mode === "raw") return "raw";
        if (mode === "embed" || mode === "outliner") return "embed";
        return "preview";
    };

    const openCommentDrawer = async (itemId, mode = 'preview') => {
        if(historySession)return rejectHistoryWrite('openCommentDrawer');
        if(!tracking.current())return false;
        const matches=gtdList.filter(i=>i.id===itemId),item=matches[0];if(matches.length!==1||!item.type)return false;
        const baseline={id:item.id,type:item.type,comment:getItemCommentText(item)};
        const modal=new GtdWorkspaceCommentModal(app,{
            title:`评论：${getGtdItemLabel(item)||'未命名'}`,value:getItemCommentText(item),
            onSubmit:async result=>{
                if(historySession)throw Error('GTD_COMMENT_TARGET_UNAVAILABLE');
                await saveItemCommentById(itemId,result.action==='clear'?'':String(result.value||''),()=>!modal.closed&&modal.contentEl.isConnected,baseline);
            }
        });
        await tracking.wait(modal.waitForResult());
        if(!engineIsDisposed())renderViewFn();
        return true;
    };

    const editItemNoteBinding = async (itemId) => { if (historySession) return rejectHistoryWrite("editItemNoteBinding");
        const item = getItemById(itemId);
        if (!item) return;
        const currentBinding = getItemNoteBinding(item);
        const currentValue = typeof currentBinding === "string" ? currentBinding : String(currentBinding?.path || "");
        const result = await tracking.wait(new GtdWorkspaceNoteBindingModal(app, {
            title: `绑定笔记：${getGtdItemLabel(item) || "未命名"}`,
            value: currentValue,
            noteIndex: buildVaultNoteIndex(),
            onOpenCurrent: async () => await openBoundNote(currentBinding, itemId),
        }).waitForResult());
        if (!result) return;
        if (result.action === "clear") {
            await updateGTD((list) => {
                const idx = list.findIndex(i => i.id === itemId);
                if (idx < 0) return;
                delete list[idx].noteBinding;
            });
            new Notice("已清除笔记绑定");
            return;
        }
        const file = resolveExistingNoteFile(result.value);
        if (!file) {
            new Notice("没有找到这个 Obsidian 笔记，请输入库内真实路径。");
            return;
        }
        const bindingValue = { path: file.path, ctime: Number(file?.stat?.ctime) || null };
        await updateGTD((list) => {
            const idx = list.findIndex(i => i.id === itemId);
            if (idx < 0) return;
            list[idx].noteBinding = bindingValue;
        });
        new Notice(`已绑定笔记：${file.basename || file.path}`);
    };

    const saveItemCommentById = async (itemId, rawText, editorLive = () => commentEditorLease?.live() && ui.gtdCommentDrawerState.itemId===itemId, baseline = ui.gtdCommentBaseline) => {
        if(historySession)return rejectHistoryWrite('saveItemCommentById');
        if(engineIsDisposed()||!editorLive())throw Error('GTD_COMMENT_EDITOR_STALE');
        const finalText=String(rawText||'');
        if(!baseline||baseline.id!==itemId)throw Error('GTD_COMMENT_BASELINE_MISSING');
        const operation=list=>{
            if(engineIsDisposed()||!editorLive())throw Error('GTD_COMMENT_EDITOR_STALE');
            const matches=list.filter(i=>i.id===itemId),target=matches[0];
            if(matches.length!==1||target.type!==baseline.type||getItemCommentText(target)!==baseline.comment)throw Error('GTD_COMMENT_TARGET_CHANGED');
            if(getItemCommentText(target)===finalText)return false;
            if(finalText.trim())target.comment=finalText;else delete target.comment;
            return true;
        };
        operation.requireSourceCAS=true;operation.editorLive=editorLive;
        await updateGTD(operation);
        baseline.comment=finalText.trim()?finalText:'';
        return true;
    };
    const closeCommentDrawer = async (persistDraft = false) => {
        const lease=commentEditorLease;
        if(!lease?.live())return false;
        try{return await lease.save(async live=>{
            const state=ui.gtdCommentDrawerState;
            if(persistDraft)await saveItemCommentById(state.itemId,state.draft);
            if(!live())return false;
            lease.close();commentEditorLease=null;
            ui.gtdCommentDrawerState={isOpen:false,itemId:null,mode:'preview',draft:''};
            disposeCommentPreviewComponent();
            container.querySelectorAll('.gtd-comment-mask, .gtd-comment-drawer').forEach(el=>el.remove());
            renderViewFn();return true;
        });}catch(error){new Notice('评论未保存，输入仍保留，请重试。');return false;}
    };

    const getCurrentNoteLinkName = () => {
        const name = String(getCurrentFile()?.name || "");
        if (name) return name.replace(/\.md$/i, "");
        const path = String(getCurrentFile()?.path || "");
        const fallback = path.split("/").pop() || "";
        return fallback.replace(/\.md$/i, "");
    };

    const resolveRoamUidToTarget = (uidText) => {
        const raw = String(uidText || "").trim();
        if (!raw) return "";
        if (raw.includes("#")) return raw;
        const cleanUid = raw.replace(/^\^+/, "");
        if (!cleanUid) return "";
        const noteName = getCurrentNoteLinkName();
        return noteName ? `${noteName}#^${cleanUid}` : `#^${cleanUid}`;
    };

    const convertRoamRefsToEmbeds = (markdownText) => {
        const text = String(markdownText || "");
        return text.replace(/\(\(([^\)\n]+)\)\)/g, (full, uid) => {
            const target = resolveRoamUidToTarget(uid);
            if (!target) return full;
            return `![[${target}]]`;
        });
    };

    const buildAliasToTargetMap = (markdownText) => {
        const text = String(markdownText || "");
        const map = new Map();
        const matches = [...text.matchAll(/!\[\[([^\]]+)\]\]/g)];
        matches.forEach((m) => {
            const inner = String(m?.[1] || "").trim();
            if (!inner) return;
            const parts = inner.split("|");
            if (parts.length < 2) return;
            const rawTarget = String(parts[0] || "").trim();
            const alias = String(parts[parts.length - 1] || "").trim();
            if (!rawTarget || !alias || map.has(alias)) return;
            map.set(alias, rawTarget);
        });
        return map;
    };

    const escapeRegExp = (text) => String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalizeMarkerId = (markerId) => String(markerId || "").trim().replace(/^\^+/, "");

    const resolveOutlinerMarkerToTarget = (markerId, aliasMap) => {
        const normalizedId = normalizeMarkerId(markerId);
        if (!normalizedId) return "";
        const mappedRaw = aliasMap?.get?.(normalizedId) || "";
        if (mappedRaw) {
            const mapped = String(mappedRaw).trim();
            if (!mapped) return "";
            if (mapped.includes("#")) return mapped;
            return `${mapped}#^${normalizedId}`;
        }
        return "";
    };

    const convertOutlinerMarkerBlocks = (markdownText) => {
        const text = String(markdownText || "");
        const aliasMap = buildAliasToTargetMap(text);
        return text.replace(/%%([^\s%]+)%%\n?([\s\S]*?)\n?%%\1%%/g, (full, markerId, body) => {
            const target = resolveOutlinerMarkerToTarget(markerId, aliasMap);
            if (!target) return `\n${String(body || "").trim()}\n`;
            return `![[${target}]]`;
        });
    };

    const extractOutlinerMarkedBody = (rawText, markerId) => {
        const normalizedId = normalizeMarkerId(markerId);
        if (!normalizedId) return "";
        const pattern = new RegExp(`%%${escapeRegExp(normalizedId)}%%\\n?([\\s\\S]*?)\\n?%%${escapeRegExp(normalizedId)}%%`, "m");
        const matched = String(rawText || "").match(pattern);
        if (!matched) return "";
        return String(matched[1] || "").trim();
    };

    const readFileRawWithCache = async (file) => {
        const path = String(file?.path || "");
        if (!path) return "";
        const mtime = Number(file?.stat?.mtime || 0);
        const rawCache = window.gtdOutlinerFileRawCache;
        const cached = rawCache.get(path);
        if (cached && cached.mtime === mtime) return String(cached.raw || "");
        const raw = await app.vault.read(file);
        rawCache.set(path, { mtime, raw });
        return raw;
    };

    const getOutlinerMarkerBodyCached = async (targetLink, markerId, sourcePath) => {
        const target = String(targetLink || "").trim();
        const normalizedId = normalizeMarkerId(markerId);
        if (!target || !normalizedId) return "";
        const file = app.metadataCache.getFirstLinkpathDest(target, sourcePath);
        if (!file) return "";

        const filePath = String(file.path || "");
        const mtime = Number(file?.stat?.mtime || 0);
        const cacheKey = `${filePath}::${normalizedId}`;
        const bodyCache = window.gtdOutlinerMarkerBodyCache;
        const cached = bodyCache.get(cacheKey);
        if (cached && cached.mtime === mtime) return String(cached.body || "");

        const raw = await readFileRawWithCache(file);
        const body = extractOutlinerMarkedBody(raw, normalizedId);
        bodyCache.set(cacheKey, { mtime, body });
        return body;
    };

    const resolveOutlinerAliasEmbedsToBodies = async (markdownText, sourcePath) => {
        const text = String(markdownText || "");
        const pattern = /!\[\[([^\]|]+)\|([^\]]+)\]\]/g;
        const matches = [...text.matchAll(pattern)];
        if (matches.length === 0) return text;
        const requestMap = new Map();
        matches.forEach((m) => {
            const targetLink = String(m?.[1] || "").trim();
            const markerId = normalizeMarkerId(m?.[2]);
            if (!targetLink || !markerId) return;
            const key = `${targetLink}::${markerId}`;
            if (!requestMap.has(key)) requestMap.set(key, { targetLink, markerId });
        });
        const resolvedBodyMap = new Map();
        await Promise.all([...requestMap.entries()].map(async ([key, req]) => {
            let body = "";
            try {
                body = await getOutlinerMarkerBodyCached(req.targetLink, req.markerId, sourcePath);
            } catch (e) {}
            resolvedBodyMap.set(key, body);
        }));

        let output = "";
        let lastIndex = 0;
        for (const m of matches) {
            const idx = typeof m.index === "number" ? m.index : -1;
            if (idx < 0) continue;
            output += text.slice(lastIndex, idx);
            const full = String(m[0] || "");
            const targetLink = String(m[1] || "").trim();
            const markerId = normalizeMarkerId(m[2]);
            let replacement = full;
            if (targetLink && markerId) {
                const key = `${targetLink}::${markerId}`;
                const body = String(resolvedBodyMap.get(key) || "");
                if (body) replacement = `\n${body}\n`;
            }
            output += replacement;
            lastIndex = idx + full.length;
        }
        output += text.slice(lastIndex);
        return output;
    };

    const renderMarkdownInContainer = async (markdownText, containerEl) => {
        disposeCommentPreviewComponent();
        const serial=previewSerial, state=ui.gtdCommentDrawerState;
        const sourcePath=getCurrentFile().path;
        const current=()=>!engineIsDisposed()&&container.contains(containerEl)&&containerEl.isConnected
            &&serial===previewSerial&&getCurrentFile().path===sourcePath
            &&ui.gtdCommentDrawerState.itemId===state.itemId&&ui.gtdCommentDrawerState.mode==='preview';
        if(!current())return false;
        const staging=document.createElement('div');
        const text=String(markdownText||'');
        let component=null;
        try {
            if(!text.trim())staging.createDiv({text:'（暂无内容）'});
            else {
                let renderText=convertRoamRefsToEmbeds(convertOutlinerMarkerBlocks(text));
                renderText=await resolveOutlinerAliasEmbedsToBodies(renderText,sourcePath);
                if(!current())return false;
                component=new obsidian.Component();component.load();
                try {
                    if(obsidian.MarkdownRenderer?.render)await obsidian.MarkdownRenderer.render(app,renderText,staging,sourcePath,component);
                    else if(obsidian.MarkdownRenderer?.renderMarkdown)await obsidian.MarkdownRenderer.renderMarkdown(renderText,staging,sourcePath,component);
                    else staging.setText(renderText);
                } catch(error) {if(!current())return false;staging.setText(renderText);}
            }
            if(!current())return false;
            containerEl.empty();while(staging.firstChild)containerEl.appendChild(staging.firstChild);
            ui.gtdCommentPreviewComponent=component;component=null;
            containerEl.querySelectorAll('a.internal-link').forEach(link=>link.addEventListener('click',async event=>{
                event.preventDefault();event.stopPropagation();if(!current())return;
                const href=link.getAttribute('data-href')||link.getAttribute('href');
                if(href)try{await openLinkForEditing(href);}catch(error){if(current())new Notice('打开链接失败，请检查目标是否存在。');}
            }));
            return true;
        } finally {component?.unload();}
    };

    const extractEmbedTargets = (markdownText) => {
        const text = String(markdownText || "");
        const aliasMap = buildAliasToTargetMap(text);
        const embedMatches = [...text.matchAll(/!\[\[([^\]]+)\]\]/g)];
        const roamMatches = [...text.matchAll(/\(\(([^\)\n]+)\)\)/g)];
        const markerMatches = [...text.matchAll(/%%([^\s%]+)%%\n?[\s\S]*?\n?%%\1%%/g)];
        const targets = [];
        const seen = new Set();
        embedMatches.forEach((m) => {
            const inner = String(m?.[1] || "").trim();
            if (!inner) return;
            const target = inner.split("|")[0].trim();
            if (!target || seen.has(target)) return;
            seen.add(target);
            targets.push(target);
        });
        roamMatches.forEach((m) => {
            const inner = String(m?.[1] || "").trim();
            if (!inner) return;
            const target = resolveRoamUidToTarget(inner);
            if (!target || seen.has(target)) return;
            seen.add(target);
            targets.push(target);
        });
        markerMatches.forEach((m) => {
            const markerId = String(m?.[1] || "").trim();
            if (!markerId) return;
            const target = resolveOutlinerMarkerToTarget(markerId, aliasMap);
            if (!target || seen.has(target)) return;
            seen.add(target);
            targets.push(target);
        });
        return targets;
    };

    const openLinkForEditing = async (linkText) => { if (historySession) return rejectHistoryWrite("openLinkForEditing");
        const target = String(linkText || "").trim();
        if (!target) return;
        const sourcePath = getCurrentFile().path;
        await app.workspace.openLinkText(target, sourcePath, true);
        const markdownView = app.workspace.getActiveViewOfType?.(obsidian.MarkdownView);
        if (markdownView && typeof markdownView.getMode === "function" && typeof markdownView.setMode === "function") {
            if (markdownView.getMode() !== "source") {
                await markdownView.setMode("source");
            }
            markdownView.editor?.focus?.();
        }
    };

    // --- 功能函数区 ---
    const toggleFirstClass = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("toggleFirstClass"); await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) list[index].isFirstClass = !list[index].isFirstClass; }); };
    const toggleFocusSession = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("toggleFocusSession"); await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) list[index].isFocusSession = !list[index].isFocusSession; }); };
    const toggleDimmed = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("toggleDimmed"); await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) list[index].isDimmed = !list[index].isDimmed; }); };
    const toggleCollapse = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) { const item = gtdList[index]; if (item?.id) { historySession.collapsed.set(item.id, !historyCollapsedFor(item)); renderViewFn?.(); } return; } await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) list[index].isCollapsed = !list[index].isCollapsed; }); };
    
    const modifyTag = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("modifyTag");
        const item = gtdList[index];
        if (!item) return;
        const choice = await tagSelector(item.tags);
        if (!choice) return;
        
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]);
            if (!list[index]) return;
            if (!list[index].tags) list[index].tags = [];
            const tagId = choice.key;
            const action = choice.action;
            
            if (action === "add") {
                if (!list[index].tags.includes(tagId)) list[index].tags.push(tagId);
            } else {
                list[index].tags = list[index].tags.filter(t => t !== tagId);
            }
        });
        new Notice(choice.action === "add" ? `✅ 已添加: ${choice.label}` : `🗑️ 已移除: ${choice.label}`);
    };

    const moveInboxItem = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; const actionOriginalName=String(actionItem.content||''); if (historySession) return rejectHistoryWrite("moveInboxItem");
        const options = ["📂 转为新项目", "⚡ 转入已有项目"];
        const choice = await suggester(options);
        if (!choice) return;
        if (choice.startsWith("📂")) {
            await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); const item = list[index]; item.type = 'project'; item.project = item.content; item.content = null; });
            if(engineIsDisposed())return;await getOrCreateProjectFile(actionOriginalName); 
            new Notice("✅ 已升级为项目");
        } else {
            const activeProjects = gtdList.filter(i => i.type === 'project' && i.status === 'active').map(p => p.project).sort((a, b) => a.localeCompare(b, "zh"));
            if (activeProjects.length === 0) { new Notice("⚠️ 没有活跃项目"); return; }
            const targetProj = await suggester(activeProjects);
            if (!targetProj) return;
            await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); const item = list[index]; item.type = 'next_action'; item.project = targetProj; });
            new Notice(`✅ 已移动到项目: ${targetProj}`);
        }
    };

    const renameLinkedFile = async (oldName, newName) => { if (historySession) return rejectHistoryWrite("renameLinkedFile");
        const currentFile = getCurrentFile();
        const targetFile = app.metadataCache.getFirstLinkpathDest(oldName, currentFile.path);
        if (targetFile && targetFile.extension !== "md") return;
        if (targetFile) {
            try {
                const parentPath = targetFile.parent.path;
                const newPath = parentPath === "/" ? `${newName}.md` : `${parentPath}/${newName}.md`;
                await app.fileManager.renameFile(targetFile, newPath);
            } catch (e) {}
        }
    };
    
    const renameItem = async (index, type, oldName) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("renameItem");
        const newName = await prompt(`重命名${type === 'project' ? '项目' : '条目'}`, "请输入新名称", oldName);
        if (!newName || newName === oldName) return;
        await renameLinkedFile(oldName, newName);
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]);
            if (list[index]) {
                if (type === 'project') list[index].project = newName; else list[index].content = newName;
            }
            if (type === 'project') { list.forEach(item => { if (item.type === 'next_action' && item.project === oldName) item.project = newName; }); }
        });
        new Notice("✅ 重命名成功");
    };

    const setItemSchedule = async (index, oldDate) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("setItemSchedule");
        const newDate = await prompt("设置日程 (Schedule)", "格式: YYYY-MM-DD", oldDate || moment().format("YYYY-MM-DD"));
        if(newDate===null)return;
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) list[index].scheduled = newDate ? newDate : null; });
    };
    
    const setItemDeadline = async (index, oldDate) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("setItemDeadline");
        const newDate = await prompt("设置截止 (Deadline)", "格式: YYYY-MM-DD", oldDate || moment().format("YYYY-MM-DD"));
        if(newDate===null)return;
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) list[index].deadline = newDate ? newDate : null; });
    };

    const addNewItem = async (type, parentId = null, defaultProject = null, insertAfterId = null) => { if (historySession) return rejectHistoryWrite("addNewItem");
        let placeholder = type === 'project' ? "例如：年度总结报告" : (type === 'inbox' ? "例如：买牛奶" : "例如：整理Excel数据");
        let title = insertAfterId
            ? (type === 'project' ? "添加同级项目" : "添加同级任务")
            : (parentId ? (type === 'project' ? "添加子项目" : "添加子任务") : `添加【${type === 'project' ? '项目' : (type === 'inbox' ? '工作篮任务' : '下一步行动')}】`);
        const inputName = await prompt(title, placeholder);
        if (!inputName) return;
        const newId = Date.now().toString();
        let newItem = { 
            id: newId, type: type, status: "active", created: moment().format("YYYY-MM-DD"), 
            project: null, content: null, scheduled: null, deadline: null, 
            isFirstClass: false, isFocusSession: false, isDimmed: false, isCollapsed: false, tags: [], parentId: parentId 
        };
        if (type === 'project') {
            newItem.project = inputName;
            await getOrCreateProjectFile(inputName);
        }
        else if (type === 'inbox') newItem.content = inputName;
        else if (type === 'next_action') {
            let selectedProject = defaultProject;
            if (!selectedProject) {
                const activeProjects = gtdList.filter(i => i.type === 'project' && i.status === 'active').map(p => p.project).sort((a, b) => a.localeCompare(b, "zh"));
                if (activeProjects.length === 0) { new Notice("⚠️ 请先创建一个项目！"); return; }
                selectedProject = await suggester(activeProjects);
            }
            if (!selectedProject) return;
            newItem.project = selectedProject;
            newItem.content = inputName;
        }
        const siblingOrders = gtdList
            .filter(i => {
                if (i.status !== "active") return false;
                if (type === "project") {
                    return i.type === "project" && (i.parentId || null) === (newItem.parentId || null);
                }
                return (i.type === "next_action" || i.type === "inbox")
                    && (i.project || null) === (newItem.project || null)
                    && (i.parentId || null) === (newItem.parentId || null);
            })
            .map(i => Number(i?.sortOrder))
            .filter(v => Number.isFinite(v));
        if (insertAfterId) {
            // 同级新增由下方 update 回调精确插入在锚点后
        } else if (parentId) {
            // 新增子任务默认置顶，后续需要时再手动拖拽调整
            newItem.sortOrder = siblingOrders.length > 0 ? Math.min(...siblingOrders) - 10 : 0;
        } else if (type === "next_action" && newItem.project) {
            // 从项目条目直接新增的顶层下一步待办，也默认放到该项目的第一位
            newItem.sortOrder = siblingOrders.length > 0 ? Math.min(...siblingOrders) - 10 : 0;
        } else if (siblingOrders.length > 0) {
            newItem.sortOrder = Math.max(...siblingOrders) + 10;
        }
        ui.gtdRecentIds.push(newId);
        await updateGTD((list) => {
            list.push(newItem);

            if (!insertAfterId) return;
            const siblingScope = list
                .filter(i => {
                    if (i.status !== "active") return false;
                    if (type === "project") {
                        return i.type === "project" && (i.parentId || null) === (newItem.parentId || null);
                    }
                    return (i.type === "next_action" || i.type === "inbox")
                        && (i.project || null) === (newItem.project || null)
                        && (i.parentId || null) === (newItem.parentId || null);
                })
                .sort(compareByOrderThenName);
            const withoutNew = siblingScope.filter(i => i.id !== newId);
            const anchorPos = withoutNew.findIndex(i => i.id === insertAfterId);
            const insertAt = anchorPos >= 0 ? anchorPos + 1 : withoutNew.length;
            withoutNew.splice(insertAt, 0, newItem);
            resequenceSiblingOrders(list, withoutNew);
        });
    };

    const getManualOrder = (item) => {
        const num = Number(item?.sortOrder);
        return Number.isFinite(num) ? num : null;
    };

    const compareByOrderThenName = (a, b) => {
        const oa = getManualOrder(a);
        const ob = getManualOrder(b);
        if (oa !== null && ob !== null && oa !== ob) return oa - ob;
        if (oa !== null && ob === null) return -1;
        if (oa === null && ob !== null) return 1;
        const an = String(a?.content || a?.project || "");
        const bn = String(b?.content || b?.project || "");
        return an.localeCompare(bn, "zh");
    };

    const resequenceSiblingOrders = (list, siblings) => {
        siblings.forEach((s, idx) => {
            const ref = list.find(i => i.id === s.id);
            if (!ref) return;
            ref.sortOrder = (idx + 1) * 10;
        });
    };

    const wouldCreateTaskCycle = (list, draggedId, nextParentId) => {
        let cursor = nextParentId || null;
        while (cursor) {
            if (cursor === draggedId) return true;
            const cursorItem = list.find(i => i.id === cursor);
            cursor = cursorItem ? (cursorItem.parentId || null) : null;
        }
        return false;
    };
    const wouldCreateProjectCycle = (list, draggedId, nextParentId) => {
        let cursor = nextParentId || null;
        while (cursor) {
            if (cursor === draggedId) return true;
            const cursorItem = list.find(i => i.id === cursor && i.type === "project");
            cursor = cursorItem ? (cursorItem.parentId || null) : null;
        }
        return false;
    };

    const getDescendantIds = (list, rootId) => {
        const result = [];
        const stack = [rootId];
        while (stack.length > 0) {
            const current = stack.pop();
            if (!current) continue;
            list.forEach(i => {
                if ((i.parentId || null) === current) {
                    result.push(i.id);
                    stack.push(i.id);
                }
            });
        }
        return result;
    };

    const checkSubtasks = (parentId) => {
        return gtdList.some(item => item.parentId === parentId && item.status === 'active');
    };

    const completeItem = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("completeItem");
        const item = gtdList[index];
        if (!item) return;
        if (checkSubtasks(item.id)) { new Notice("无法完成：请先完成该任务下的所有子任务！"); return; }
        const ok = await confirm(
            "确认完成任务",
            `确定要完成「${item.content || item.project || "未命名任务"}」吗？完成后该条目会进入归档区，并从当前项目执行视图中隐藏。`,
            "确认完成"
        );
        if (!ok) return;
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) { list[index].status = "completed"; list[index].completed_date = moment().format("YYYY-MM-DD"); } });
    };
    
    const completeProject = async (index, projectName) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("completeProject");
        const activeActionCount = gtdList.filter((entry) => entry.type === 'next_action' && entry.project === projectName && entry.status === 'active').length;
        const ok = await confirm(
            "确认归档项目",
            `确定要归档项目「${projectName}」吗？该项目以及其下 ${activeActionCount} 个 active next_action 会进入归档区，并从当前项目执行视图中隐藏。`,
            "确认归档"
        );
        if (!ok) return;
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]);
            if (list[index]) { list[index].status = "completed"; list[index].completed_date = moment().format("YYYY-MM-DD"); }
            for (let i = 0; i < list.length; i++) {
                if (list[i].type === 'next_action' && list[i].project === projectName && list[i].status === 'active') {
                    list[i].status = "completed"; list[i].completed_date = moment().format("YYYY-MM-DD"); list[i].archived_by_project = true;
                }
            }
        });
        new Notice(`项目 [${projectName}] 已归档`);
    };

        const reactivateItem = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("reactivateItem"); await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); if (list[index]) { list[index].status = "active"; delete list[index].completed_date; delete list[index].archived_by_project; } }); };
    
    const reactivateProject = async (index, projectName) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("reactivateProject");
        let count = 0;
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]);
            if (list[index]) { list[index].status = "active"; delete list[index].completed_date; }
            for (let i = 0; i < list.length; i++) {
                if (list[i].type === 'next_action' && list[i].project === projectName && list[i].archived_by_project === true) {
                    list[i].status = "active"; delete list[i].completed_date; delete list[i].archived_by_project; count++;
                }
            }
        });
        new Notice(`📂 项目已回退，恢复 ${count} 个任务`);
    };

    const deleteItem = async (index) => { const actionItem=gtdList[index];if(!actionItem?.id||!actionItem.type)return;const actionIdentity={id:actionItem.id,type:actionItem.type}; if (historySession) return rejectHistoryWrite("deleteItem"); 
        const item = gtdList[index];
        if (!item) return;
        if (checkSubtasks(item.id)) { new Notice("无法删除：包含子任务！"); return; }
        const ok = await confirm("彻底删除", "确定要彻底删除这个任务吗？", "确认删除");
        if (!ok) return;
        await updateGTD((list) => {const matches=list.filter(row=>row?.id===actionIdentity.id);if(matches.length!==1||matches[0].type!==actionIdentity.type)throw Error('GTD_ACTION_TARGET_CHANGED');const index=list.indexOf(matches[0]); list.splice(index, 1); }); 
        new Notice("任务已彻底删除");
    };

        const handleDrop = async (draggedId, targetId, position, targetType = 'task') => { if (historySession) return rejectHistoryWrite("handleDrop");
        if (!draggedId || draggedId === targetId) return;
        const draggedItem = gtdList.find(i => i.id === draggedId);
        if (!draggedItem) return;
        const targetItem = targetType === 'task' ? gtdList.find(i => i.id === targetId) : null;
        const targetProjectItem = targetType === 'project'
            ? (gtdList.find(i => i.id === targetId && i.type === 'project' && i.status === 'active')
                || gtdList.find(i => i.type === 'project' && i.project === targetId && i.status === 'active')
                || null)
            : null;
        if (targetType === 'task' && !targetItem) return;
        if (targetType === 'project' && !targetProjectItem) return;
        if (targetType === 'task') {
            if (draggedItem.type !== targetItem.type) {
                new Notice("⚠️ 不支持 Inbox 与下一步行动 的跨类型拖拽，避免条目被隐藏");
                return;
            }
            const nextParentId = position === 'child' ? targetItem.id : (targetItem.parentId || null);
            if (wouldCreateTaskCycle(gtdList, draggedId, nextParentId)) {
                new Notice("⚠️ 无效操作：不能把条目拖到自己的子级链路中");
                return;
            }
        }
        const targetName = targetType === 'project' ? targetProjectItem.project : targetItem.content;
        await updateGTD((list) => {
            const draggedIndex = list.findIndex(i => i.id === draggedId);
            if (draggedIndex < 0) return;
            const item = list[draggedIndex];
            if (!item) return;
            const previousProject = item.project || null;
            if (targetType === 'project') {
                item.parentId = null;
                item.project = targetName;
                const siblingScope = list
                    .filter(i =>
                        i.status === "active" &&
                        (i.type === "next_action" || i.type === "inbox") &&
                        (i.project || null) === (item.project || null) &&
                        (i.parentId || null) === null
                    )
                    .sort(compareByOrderThenName)
                    .filter(i => i.id !== item.id);
                siblingScope.push(item);
                resequenceSiblingOrders(list, siblingScope);
            } else {
                const targetIndex = list.findIndex(i => i.id === targetId); const target = list[targetIndex];
                if (!target) return;
                if (position === 'child') { item.parentId = target.id; if (item.project !== target.project) item.project = target.project; }
                else { item.parentId = target.parentId; if (item.project !== target.project) item.project = target.project; }

                const siblingScope = list
                    .filter(i =>
                        i.status === "active" &&
                        (i.type === "next_action" || i.type === "inbox") &&
                        (i.project || null) === (item.project || null) &&
                        (i.parentId || null) === (item.parentId || null)
                    )
                    .sort(compareByOrderThenName);
                const withoutDragged = siblingScope.filter(i => i.id !== item.id);
                let insertAt = withoutDragged.length;
                if (position === "child") {
                    insertAt = 0;
                } else if (position === "before" || position === "after") {
                    const targetPos = withoutDragged.findIndex(i => i.id === target.id);
                    if (targetPos >= 0) insertAt = position === "before" ? targetPos : targetPos + 1;
                }
                withoutDragged.splice(insertAt, 0, item);
                resequenceSiblingOrders(list, withoutDragged);
            }
            const currentProject = item.project || null;
            if (previousProject !== currentProject) {
                const descendants = getDescendantIds(list, item.id);
                descendants.forEach((childId) => {
                    const child = list.find(i => i.id === childId);
                    if (!child) return;
                    if (child.type === "next_action" || child.type === "inbox") child.project = currentProject;
                });
            }
            return {
                rememberAnchorItemId: item.id,
                rememberAnchorSectionId: item.type === "inbox" ? "gtd-section-inbox" : "gtd-section-projects",
                rememberAnchorProjectId: targetType === "project"
                    ? (targetProjectItem?.id || null)
                    : (item.project ? (list.find((i) => i.type === "project" && i.project === item.project && i.status === "active")?.id || null) : null)
            };
        });
        new Notice("✅ 移动成功");
    };

    const moveProjectOrder = async (draggedProjectId, targetProjectId = null, position = "after") => { if (historySession) return rejectHistoryWrite("moveProjectOrder");
        if (!draggedProjectId) return;
        if (targetProjectId && draggedProjectId === targetProjectId) return;

        const draggedProject = gtdList.find(i => i.id === draggedProjectId && i.type === "project" && i.status === "active");
        if (!draggedProject) return;

        const targetProject = targetProjectId
            ? gtdList.find(i => i.id === targetProjectId && i.type === "project" && i.status === "active")
            : null;
        if (targetProjectId && !targetProject) return;

        const nextParentId = !targetProjectId
            ? null
            : (position === "child" ? targetProjectId : (targetProject.parentId || null));

        if (wouldCreateProjectCycle(gtdList, draggedProjectId, nextParentId)) {
            new Notice("⚠️ 无效操作：不能把项目拖到自己的子级下面");
            return;
        }

        await updateGTD((list) => {
            const idx = list.findIndex(i => i.id === draggedProjectId && i.type === "project");
            if (idx < 0) return;
            const item = list[idx];
            item.parentId = nextParentId;
            const siblingScope = list
                .filter(i =>
                    i.status === "active" &&
                    i.type === "project" &&
                    (i.parentId || null) === nextParentId
                )
                .sort(compareByOrderThenName);
            const withoutDragged = siblingScope.filter(i => i.id !== item.id);
            let insertAt = withoutDragged.length;
            if (!targetProjectId) {
                insertAt = withoutDragged.length;
            } else if (position === "child") {
                insertAt = 0;
            } else {
                const targetPos = withoutDragged.findIndex(i => i.id === targetProject.id);
                if (targetPos >= 0) insertAt = position === "before" ? targetPos : targetPos + 1;
            }
            withoutDragged.splice(insertAt, 0, item);
            resequenceSiblingOrders(list, withoutDragged);
            return {
                rememberAnchorItemId: draggedProjectId,
                rememberAnchorSectionId: "gtd-section-projects",
                rememberAnchorProjectId: draggedProjectId
            };
        });
        new Notice("✅ 项目顺序已更新");
    };

    // ==========================================================
    // 🎨 视图逻辑
    // ==========================================================
    const renderKaioKenView = (container) => tracking.run(()=>renderKaioKenViewBody(container));
    const renderKaioKenViewBody = (container) => {
        // ... (KaioKen视图逻辑省略，保持不变) ...
        const style = `<style>.kaio-container{background:var(--background-secondary);border-radius:12px;padding:20px;font-family:sans-serif;min-height:400px}.kaio-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid var(--interactive-accent)}.kaio-title{font-size:1.5em;font-weight:800;color:var(--text-normal);margin:0;display:flex;align-items:center;gap:8px}.kaio-icon{font-size:1.2em;color:#e74c3c;animation:kaio-glow 2s infinite alternate}@keyframes kaio-glow{from{text-shadow:0 0 5px rgba(231,76,60,.5)}to{text-shadow:0 0 15px #e74c3c}}.kaio-section-title{font-size:1.1em;font-weight:700;margin:25px 0 10px;color:var(--text-muted);border-bottom:1px solid var(--background-modifier-border);padding-bottom:4px;display:flex;justify-content:space-between}.kaio-proj-group{margin-bottom:15px;border-left:2px solid var(--interactive-accent);padding-left:12px}.kaio-proj-name{font-weight:700;font-size:.9em;color:var(--text-normal);margin-bottom:8px;opacity:.9}.kaio-item-card{background:var(--background-primary);border:1px solid var(--background-modifier-border);border-radius:8px;padding:10px 14px;display:grid;grid-template-columns:200px 1fr 100px;gap:15px;align-items:center;margin-bottom:8px;transition:transform .2s}.kaio-item-card:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.1)}.k-info{display:flex;flex-direction:column;gap:2px;overflow:hidden}.k-name{font-weight:700;font-size:1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-normal);cursor:pointer}.k-name:hover{color:var(--interactive-accent);text-decoration:underline}.k-sub{font-size:.75em;color:var(--text-muted);display:flex;gap:6px;align-items:center}.k-tag{background:var(--background-modifier-hover);padding:1px 4px;border-radius:3px}.k-timeline-container{position:relative;height:28px;width:100%;display:flex;flex-direction:column;justify-content:center}.k-track{width:100%;height:8px;background:var(--background-modifier-form-field);border-radius:4px;position:relative;overflow:visible}.k-zone-kaio{position:absolute;left:0;top:0;bottom:0;width:33.33%;background:linear-gradient(90deg,rgba(231,76,60,.4),rgba(243,156,18,.3));border-radius:4px 0 0 4px;border-right:1px dashed rgba(231,76,60,.6)}.k-marker-now{position:absolute;top:-3px;bottom:-3px;width:3px;background:#3498db;box-shadow:0 0 6px #3498db;z-index:10;border-radius:2px;transition:left .5s ease}.k-dates{display:flex;justify-content:space-between;font-size:.7em;color:var(--text-muted);margin-top:3px}.k-actions{display:flex;flex-direction:column;align-items:flex-end;gap:4px}.k-status{font-size:.8em;font-weight:700}.k-status.rush{color:#e74c3c;display:flex;align-items:center;gap:4px}.k-status.calm{color:#2ecc71}.k-mini-btn{font-size:12px;cursor:pointer;padding:2px 6px;border-radius:4px;background:var(--background-secondary);border:1px solid var(--background-modifier-border)}.k-mini-btn:hover{background:var(--interactive-accent);color:#fff;border-color:transparent}</style>`;
        if(context.canLeaveInput && !context.canLeaveInput())return false; container.innerHTML = style;
        const wrapper = container.createEl("div", { cls: "kaio-container" });
        const header = wrapper.createEl("div", { cls: "kaio-header" });
        header.createEl("div", { cls: "kaio-title" }).innerHTML = `<span class="kaio-icon">🔥</span> 界王拳突击看板`;
        const exitBtn = header.createEl("button", { text: "退出模式" });
        exitBtn.onclick = () => { ui.gtdKaioKenMode = false; if(renderViewFn) renderViewFn(); };

        const today = moment();
        let rawItems = gtdList.map((item, index) => ({ item, index })).filter(({ item }) => 
            item.status === 'active' && item.deadline
        );

        if (rawItems.length === 0) {
            wrapper.createEl("div", { text: "🧘 暂无带截止日期的突击任务", attr: { style: "text-align:center; padding:40px; color:var(--text-muted);" } });
            return;
        }

        rawItems.forEach(wrap => {
            const startStr = wrap.item.created;
            const endStr = wrap.item.deadline;
            let percent = 0;
            if (endStr) {
                const startDate = moment(startStr);
                const endDate = moment(endStr);
                const totalDays = endDate.diff(startDate, 'days');
                const passedDays = today.diff(startDate, 'days');
                totalDays <= 0 ? percent = 100 : percent = (passedDays / totalDays) * 100;
                percent = Math.max(0, Math.min(100, percent));
            }
            wrap.percent = percent;
            wrap.isSprint = percent <= 33.33;
            wrap.displayName = wrap.item.type === 'project' ? wrap.item.project : wrap.item.content;
            wrap.projectName = wrap.item.type === 'project' ? wrap.item.project : (wrap.item.project || "未分类");
        });

        const sprintItems = rawItems.filter(x => x.isSprint).sort((a, b) => a.item.deadline.localeCompare(b.item.deadline));
        const calmItems = rawItems.filter(x => !x.isSprint);

        const renderCard = (targetEl, wrap) => {
            const card = targetEl.createEl("div", { cls: "kaio-item-card" });
            const { item, index, displayName, percent } = wrap;
            const info = card.createEl("div", { cls: "k-info" });
            const link = info.createEl("div", { text: displayName, cls: "k-name" });
            link.onclick = async () => { await openOrCreateNote(displayName); };
            const sub = info.createEl("div", { cls: "k-sub" });
            if (item.type === 'next_action') sub.innerHTML = `<span class="k-tag">📂 ${item.project}</span>`;
            else if (item.type === 'inbox') sub.innerHTML = `<span class="k-tag">📥 Inbox</span>`; 
            else sub.innerHTML = `<span class="k-tag">🚩 Project</span>`;
            const timelineBox = card.createEl("div", { cls: "k-timeline-container" });
            const track = timelineBox.createEl("div", { cls: "k-track" });
            track.createEl("div", { cls: "k-zone-kaio" }); 
            const marker = track.createEl("div", { cls: "k-marker-now" });
            marker.style.left = `${percent}%`;
            const dateRow = timelineBox.createEl("div", { cls: "k-dates" });
            dateRow.createEl("span", { text: item.created }); dateRow.createEl("span", { text: `🏁 ${item.deadline}` });
            const actions = card.createEl("div", { cls: "k-actions" });
            const statusDiv = actions.createEl("div", { cls: "k-status" });
            if (today.isAfter(moment(item.deadline))) statusDiv.innerHTML = `<span style="color:#e74c3c">💀 已过期</span>`;
            else if (wrap.isSprint) { statusDiv.className += " rush"; statusDiv.innerHTML = `🔥 突击中`; }
            else { statusDiv.className += " calm"; statusDiv.innerHTML = `☕ 平稳期`; }
            const btnGroup = actions.createEl("div", { attr: { style: "display:flex; gap:4px;" } });
            const dlBtn = btnGroup.createEl("button", { text: "🏁", cls: "k-mini-btn", title: "修改" });
            dlBtn.onclick = () => setItemDeadline(index, item.deadline);
            const doneBtn = btnGroup.createEl("button", { text: "✅", cls: "k-mini-btn", title: "完成" });
            doneBtn.onclick = async () => { if (item.type === 'project') await completeProject(index, item.project); else await completeItem(index); };
        };

        const listContainer = wrapper.createEl("div");
        if (sprintItems.length > 0) {
            listContainer.createEl("div", { cls: "kaio-section-title" }).innerHTML = `<span style="color:#e74c3c">🔥 突击冲刺</span> <span>${sprintItems.length}</span>`;
            sprintItems.forEach(wrap => renderCard(listContainer, wrap));
        }
        if (calmItems.length > 0) {
            listContainer.createEl("div", { cls: "kaio-section-title" }).innerHTML = `<span style="color:#2ecc71">☕ 平稳推进</span> <span>${calmItems.length}</span>`;
            const groups = {};
            calmItems.forEach(wrap => { if (!groups[wrap.projectName]) groups[wrap.projectName] = []; groups[wrap.projectName].push(wrap); });
            Object.keys(groups).sort().forEach(projName => {
                const groupDiv = listContainer.createEl("div", { cls: "kaio-proj-group" });
                groupDiv.createEl("div", { text: `📂 ${projName}`, cls: "kaio-proj-name" });
                groups[projName].forEach(wrap => renderCard(groupDiv, wrap));
            });
        }
    };

    // ==========================================================
    // 🏷️ 标签管理视图
    // ==========================================================
    const renderTagManagerView = (container) => tracking.run(()=>renderTagManagerViewBody(container));
    const renderTagManagerViewBody = (container) => {
        const style = `<style>
            .tag-mgr-container { background: var(--background-secondary); border-radius: 12px; padding: 20px; font-family: sans-serif; min-height: 500px; }
            .tag-mgr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--interactive-accent); }
            .tag-mgr-title { font-size: 1.5em; font-weight: 800; color: var(--text-normal); margin: 0; display: flex; align-items: center; gap: 8px; }
            .tag-mgr-actions { display: flex; gap: 8px; }
            .tag-mgr-btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; }
            .tag-mgr-btn-primary { background: var(--interactive-accent); color: white; }
            .tag-mgr-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            .tag-mgr-btn-secondary { background: var(--background-modifier-border); color: var(--text-normal); }
            .tag-mgr-btn-secondary:hover { background: var(--background-modifier-hover); }
            .tag-tree { margin-top: 15px; }
            .tag-item { display: flex; align-items: center; padding: 10px 12px; margin: 4px 0; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; cursor: grab; transition: all 0.2s; user-select: none; }
            .tag-item:hover { border-color: var(--interactive-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .tag-item.is-category { background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%); border-width: 2px; }
            .tag-item.drag-over { border: 2px dashed var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.1); }
            .tag-item.drag-over-before { box-shadow: inset 0 3px 0 var(--interactive-accent); }
            .tag-item.drag-over-after { box-shadow: inset 0 -3px 0 var(--interactive-accent); }
            .tag-item.drag-over-child { border: 2px dashed var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.12); }
            .tag-item.dragging { opacity: 0.5; transform: scale(0.98); }
            .tag-icon { font-size: 1.3em; margin-right: 10px; width: 30px; text-align: center; }
            .tag-info { flex: 1; }
            .tag-label { font-weight: 600; color: var(--text-normal); }
            .tag-meta { font-size: 0.8em; color: var(--text-muted); margin-top: 2px; }
            .tag-color-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            .tag-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; }
            .tag-item:hover .tag-actions { opacity: 1; }
            .tag-action-btn { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); cursor: pointer; font-size: 12px; }
            .tag-action-btn:hover { background: var(--interactive-accent); color: white; border-color: transparent; }
            .tag-config-btn { border-radius: 999px; padding: 5px 12px; font-weight: 700; color: var(--interactive-accent); border-color: rgba(var(--interactive-accent-rgb), 0.36); background: rgba(var(--interactive-accent-rgb), 0.08); box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
            .tag-config-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(var(--interactive-accent-rgb), 0.18); }
            .tag-action-btn.delete:hover { background: #e74c3c; }
            .tag-children { margin-left: 30px; border-left: 2px solid var(--background-modifier-border); padding-left: 10px; }
            .tag-drop-zone { height: 30px; border: 2px dashed transparent; border-radius: 6px; margin: 4px 0; transition: all 0.2s; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85em; }
            .tag-drop-zone.active { border-color: var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.05); }
            .tag-drop-zone.active::before { content: "拖放到此处设为顶层标签"; }
            .tag-form { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 15px; margin-bottom: 15px; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden; }
            .tag-form-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; align-items: center; min-width: 0; max-width: 100%; box-sizing: border-box; }
            .tag-form-label { flex: 0 0 60px; width: 60px; font-weight: 500; color: var(--text-muted); font-size: 0.9em; }
            .tag-form-input { flex: 1; min-width: 0; box-sizing: border-box; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-secondary); color: var(--text-normal); font-size: 14px; }
            .tag-form-input:focus { outline: none; border-color: var(--interactive-accent); }
            .tag-parent-selector { position: relative; flex: 1; min-width: 0; }
            .tag-parent-input-wrapper { display: flex; align-items: center; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-secondary); overflow: hidden; }
            .tag-parent-input-wrapper:focus-within { border-color: var(--interactive-accent); }
            .tag-parent-input { flex: 1; min-width: 0; box-sizing: border-box; padding: 8px 12px; border: none; background: transparent; color: var(--text-normal); font-size: 14px; outline: none; }
            .tag-parent-clear { padding: 0 8px; cursor: pointer; color: var(--text-muted); }
            .tag-parent-clear:hover { color: var(--text-normal); }
            .tag-parent-dropdown { position: absolute; top: 100%; left: 0; right: 0; max-height: 260px; overflow-y: auto; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-top: none; border-radius: 0 0 6px 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100; display: none; }
            .tag-parent-dropdown.visible { display: block; }
            .tag-parent-option { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; transition: background 0.1s; }
            .tag-parent-option:hover, .tag-parent-option.highlighted { background: var(--background-modifier-hover); }
            .tag-parent-option.selected { background: rgba(var(--interactive-accent-rgb), 0.1); color: var(--interactive-accent); }
            .tag-parent-empty { padding: 8px 12px; color: var(--text-faint); font-size: 12px; }
            .tag-parent-stats { padding: 6px 12px; font-size: 11px; color: var(--text-faint); border-top: 1px solid var(--background-modifier-border); background: var(--background-secondary); }
            .tag-form-checkbox { width: 18px; height: 18px; cursor: pointer; }
            .tag-stats { display: flex; gap: 20px; padding: 10px 15px; background: var(--background-primary); border-radius: 8px; margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted); }
            .tag-stat-item { display: flex; align-items: center; gap: 6px; }
            .tag-stat-num { font-weight: 700; color: var(--text-normal); }
            .tag-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; overflow: hidden; box-sizing: border-box; }
            .tag-modal-card { width: min(1120px, calc(100vw - 32px)); max-width: calc(100vw - 32px); box-sizing: border-box; max-height: 90vh; overflow-y: auto; overflow-x: hidden; box-shadow: 0 24px 70px rgba(15,23,42,0.34); border-radius: 22px; border: 1px solid rgba(var(--interactive-accent-rgb), 0.34); background: linear-gradient(180deg, var(--background-primary), var(--background-secondary)); }
            .gtd-plugin-tag-form-card { padding: 0 18px 18px; }
            .tag-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin: 0 0 18px; padding: 18px 22px; max-width: 100%; box-sizing: border-box; border-bottom: 1px solid rgba(var(--interactive-accent-rgb), 0.26); background: linear-gradient(135deg, rgba(var(--interactive-accent-rgb),0.18), var(--background-secondary)); border-radius: 22px 22px 0 0; box-shadow: inset 0 -1px 0 rgba(255,255,255,0.06); }
            .tag-modal-title { font-weight: 900; font-size: 1.24em; letter-spacing: 0.02em; color: var(--text-normal); }
            .tag-modal-close { cursor: pointer; font-size: 18px; color: var(--text-muted); padding: 2px 8px; border-radius: 6px; }
            .tag-modal-close:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
            .gtd-plugin-modal-title { margin: 0 0 12px; padding-bottom: 10px; border-bottom: 1px solid var(--background-modifier-border); font-size: 1.32em; font-weight: 900; }
            .gtd-plugin-tag-definition-content .tag-form,
            .gtd-plugin-tag-form-card .tag-form-row { border-radius: 12px; }
            .tag-keyword-index { margin: 12px 0 14px; padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 12px; background: var(--background-primary); }
            .tag-keyword-index-title { font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
            .tag-keyword-index-row { display: flex; gap: 6px; flex-wrap: wrap; }
            .tag-keyword-index-empty { color: var(--text-muted); font-size: 12px; }
            .tag-keyword-chip, .tag-keyword-mini-chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--background-modifier-border); border-radius: 999px; background: var(--background-secondary); color: var(--text-normal); cursor: pointer; }
            .tag-keyword-chip { padding: 4px 10px; font-size: 12px; }
            .tag-keyword-chip:hover { border-color: var(--interactive-accent); color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .tag-keyword-chip.is-context-capsule-synced { border-color: color-mix(in srgb, var(--interactive-accent) 55%, var(--background-modifier-border) 45%); background: color-mix(in srgb, var(--interactive-accent) 13%, var(--background-secondary) 87%); }
            .tag-keyword-chip.is-context-capsule-local-only { border-color: rgba(245,158,11,.70); background: rgba(245,158,11,.13); }
            .tag-keyword-chip.context-capsule-virtual-chip { border-style: dashed; border-color: color-mix(in srgb, var(--interactive-accent) 42%, var(--background-modifier-border) 58%); background: color-mix(in srgb, var(--interactive-accent) 7%, var(--background-primary) 93%); color: var(--text-muted); }
            .tag-keyword-context-badge { padding: 1px 5px; border-radius: 999px; font-size: 10px; font-weight: 800; line-height: 1.2; color: var(--text-accent); background: color-mix(in srgb, var(--interactive-accent) 14%, transparent); }
            .tag-keyword-chip.context-capsule-virtual-chip .tag-keyword-context-badge { color: var(--text-muted); background: var(--background-modifier-hover); }
            .tag-keyword-archive-toggle { border-style: dashed; border-color: rgba(245,158,11,.45); background: rgba(245,158,11,.10); color: var(--text-muted); }
            .tag-keyword-archive-toggle.is-expanded { border-style: solid; border-color: rgba(245,158,11,.70); background: rgba(245,158,11,.18); color: var(--text-normal); }
            .tag-keyword-archive-section { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding: 10px; border: 1px solid rgba(245,158,11,.25); border-radius: 12px; background: rgba(245,158,11,.05); }
            .tag-keyword-archive-title { font-size: 12px; font-weight: 800; color: var(--text-muted); }
            .tag-keyword-chip.is-archived-keyword { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.08); }
            .tag-keyword-mini-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
            .tag-keyword-mini-chip { padding: 1px 7px; font-size: 11px; color: var(--text-muted); cursor: default; }
            .tag-item.is-keyword-focus { outline: 2px solid var(--interactive-accent); box-shadow: 0 0 0 4px rgba(var(--interactive-accent-rgb), 0.14), 0 8px 22px rgba(0,0,0,0.12); }
            .tag-keyword-editor-card { margin-top: 14px; padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 12px; background: var(--background-secondary); }
            .tag-keyword-editor-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
            .tag-keyword-editor-title { font-weight: 800; color: var(--text-normal); }
            .tag-keyword-editor-hint { color: var(--text-muted); font-size: 12px; }
            .tag-keyword-editor-input { width: 100%; min-height: 96px; resize: vertical; box-sizing: border-box; padding: 10px 12px; line-height: 1.55; border-radius: 10px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); font-family: var(--font-interface); }
            .tag-keyword-editor-input:focus { outline: none; border-color: var(--interactive-accent); box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.12); }
            .tag-usage-open-btn { border: 1px solid rgba(var(--interactive-accent-rgb), 0.38); border-radius: 999px; padding: 6px 12px; background: rgba(var(--interactive-accent-rgb), 0.10); color: var(--interactive-accent); font-weight: 800; cursor: pointer; box-shadow: 0 6px 14px rgba(0,0,0,0.08); }
            .tag-usage-open-btn:hover { background: var(--interactive-accent); color: var(--text-on-accent); transform: translateY(-1px); }
            .gtd-tag-usage-projects-modal .modal-content { min-width: min(760px, 92vw); }
            .tag-usage-modal-header { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--background-modifier-border); }
            .tag-usage-modal-title { margin: 0 0 6px; font-size: 1.25em; }
            .tag-usage-modal-subtitle { color: var(--text-muted); font-size: 12px; line-height: 1.6; }
            .tag-usage-modal-empty { padding: 18px; border: 1px dashed var(--background-modifier-border); border-radius: 12px; color: var(--text-muted); background: var(--background-secondary); }
            .tag-usage-modal-list { display: flex; flex-direction: column; gap: 8px; max-height: 58vh; overflow: auto; padding-right: 4px; }
            .tag-usage-modal-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; width: 100%; max-width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid var(--background-modifier-border); border-radius: 12px; background: var(--background-primary); color: var(--text-normal); cursor: pointer; text-align: left; }
            .tag-usage-modal-row:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .tag-usage-modal-row.is-disabled { opacity: 0.58; cursor: not-allowed; }
            .tag-usage-modal-row-main { min-width: 0; }
            .tag-usage-modal-project-name { font-weight: 900; font-size: 14px; margin-bottom: 4px; }
            .tag-usage-modal-project-reason { color: var(--text-muted); font-size: 12px; overflow-wrap: anywhere; white-space: normal; }
            .tag-usage-modal-project-action { flex-shrink: 0; color: var(--interactive-accent); font-weight: 800; font-size: 12px; }
            .tag-usage-modal-actions { display: flex; justify-content: flex-end; margin-top: 14px; }
            .tag-usage-project-card { margin: 12px 0 14px; padding: 14px; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; border: 2px solid rgba(var(--interactive-accent-rgb), 0.38); border-radius: 14px; background: linear-gradient(180deg, rgba(var(--interactive-accent-rgb), 0.13), var(--background-primary)); box-shadow: 0 8px 22px rgba(0,0,0,0.08); }
            .tag-usage-project-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
            .tag-usage-project-title { font-weight: 900; color: var(--text-normal); font-size: 14px; }
            .tag-usage-project-count { color: var(--text-muted); font-size: 12px; }
            .tag-usage-project-list { display: flex; flex-direction: column; gap: 6px; }
            .tag-usage-project-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px 12px; width: 100%; max-width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--background-modifier-border); border-radius: 10px; background: var(--background-primary); color: var(--text-normal); cursor: pointer; text-align: left; }
            .tag-usage-project-row:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .tag-usage-project-row.is-disabled { opacity: 0.58; cursor: not-allowed; }
            .tag-usage-project-name { flex: 1 1 260px; font-weight: 700; min-width: 0; overflow-wrap: anywhere; white-space: normal; }
            .tag-usage-project-meta { flex: 1 1 220px; min-width: 0; color: var(--text-muted); font-size: 12px; text-align: right; overflow-wrap: anywhere; white-space: normal; }
            .tag-usage-project-empty { color: var(--text-muted); font-size: 12px; padding: 4px 0; }
        </style>`;
        if(context.canLeaveInput && !context.canLeaveInput())return false; container.innerHTML = style;

        const wrapper = container.createEl("div", { cls: "tag-mgr-container" });

        // 头部
        const header = wrapper.createEl("div", { cls: "tag-mgr-header" });
        header.createEl("div", { cls: "tag-mgr-title" }).innerHTML = `🏷️ 标签管理器`;
        const headerActions = header.createEl("div", { cls: "tag-mgr-actions" });
        const addTagBtn = headerActions.createEl("button", { text: "➕ 新建标签", cls: "tag-mgr-btn tag-mgr-btn-primary" });
        const addCategoryBtn = headerActions.createEl("button", { text: "📁 新建分类", cls: "tag-mgr-btn tag-mgr-btn-secondary" });
        const exitBtn = headerActions.createEl("button", { text: "返回主界面", cls: "tag-mgr-btn tag-mgr-btn-secondary" });
        exitBtn.onclick = () => { ui.gtdTagManagerMode = false; if (renderViewFn) renderViewFn(); };

        // 统计信息
        const topLevelCount = Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k].parentId === null).length;
        const categoryCount = Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k].isCategory).length;
        const leafCount = Object.keys(TAG_DEFINITIONS).filter(k => !TAG_DEFINITIONS[k].isCategory).length;
        const stats = wrapper.createEl("div", { cls: "tag-stats" });
        stats.innerHTML = `
            <div class="tag-stat-item">📊 总计: <span class="tag-stat-num">${Object.keys(TAG_DEFINITIONS).length}</span> 个标签</div>
            <div class="tag-stat-item">📁 分类: <span class="tag-stat-num">${categoryCount}</span></div>
            <div class="tag-stat-item">🏷️ 叶子标签: <span class="tag-stat-num">${leafCount}</span></div>
            <div class="tag-stat-item">🌲 顶层: <span class="tag-stat-num">${topLevelCount}</span></div>
        `;

        let treeContainer = null;
        const revealTagInManager = (tagId) => {
            if (!treeContainer) return;
            const target = Array.from(treeContainer.querySelectorAll(".tag-item"))
                .find((el) => el?.dataset?.tagId === tagId);
            if (!target) {
                new Notice("⚠️ 未找到对应标签位置");
                console.log("[GTD][tag-keywords][reveal]", { status: "MISS", tagId });
                return;
            }
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.classList.add("is-keyword-focus");
            window.setTimeout(() => target.classList.remove("is-keyword-focus"), 1800);
            console.log("[GTD][tag-keywords][reveal]", { status: "OK", tagId });
        };
        const keywordIndex = wrapper.createEl("div", { cls: "tag-keyword-index" });
        keywordIndex.createEl("div", { cls: "tag-keyword-index-title", text: "🔎 标签关键词索引" });
        const keywordIndexRow = keywordIndex.createEl("div", { cls: "tag-keyword-index-row" });
        const keywordEntries = buildTagKeywordEntries();
        const contextCapsuleKeyLookup = buildContextCapsuleKeyLookup();
        const virtualContextKeys = getVirtualContextCapsuleKeysForTagKeywords(keywordEntries, contextCapsuleKeyLookup);
        const archivedVirtualContextKeys = virtualContextKeys.filter((key) => isArchivedKeywordLabel(key.displayLabel));
        const visibleVirtualContextKeys = virtualContextKeys.filter((key) => !isArchivedKeywordLabel(key.displayLabel));
        const archivedKeywordEntries = keywordEntries.filter((entry) => isArchivedKeywordLabel(entry.keyword));
        const visibleKeywordEntries = keywordEntries.filter((entry) => !isArchivedKeywordLabel(entry.keyword));
        if (keywordEntries.length === 0 && virtualContextKeys.length === 0) {
            keywordIndexRow.createEl("div", { cls: "tag-keyword-index-empty", text: "暂无标签关键词。点击标签的 ⚙️ 配置标签后可录入关键词。" });
        } else {
            const visibleContextRows = [
                ...visibleKeywordEntries.map((entry) => ({ kind: "bound", entry, sortLabel: getContextCapsuleSortLabel(entry.keyword) })),
                ...visibleVirtualContextKeys.map((key) => ({ kind: "virtual", key, sortLabel: getContextCapsuleSortLabel(key.displayLabel) })),
            ].sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, "zh-CN", { numeric: true, sensitivity: "base" }));
            visibleContextRows.forEach((rowItem) => {
                if (rowItem.kind === "virtual") {
                    const key = rowItem.key;
                    const chip = keywordIndexRow.createEl("button", {
                        cls: "tag-keyword-chip context-capsule-virtual-chip",
                        attr: { type: "button", title: `${key.displayLabel} · 虚位以待，尚未绑定 GTD 标签` },
                    });
                    if (key.color) chip.style.setProperty("--gtd-context-capsule-color", key.color);
                    chip.dataset.contextKeyId = key.contextKeyId;
                    chip.createEl("span", { text: key.displayLabel });
                    chip.createEl("span", { cls: "tag-keyword-context-badge", text: "虚位" });
                    chip.onclick = () => new Notice(`操作上下文主键尚未绑定 GTD 标签：${key.displayLabel}`);
                    return;
                }
                const entry = rowItem.entry;
                const def = TAG_DEFINITIONS[entry.tagId];
                const matchedContextKey = getContextCapsuleKeyForKeyword(entry.keyword, contextCapsuleKeyLookup);
                const chip = keywordIndexRow.createEl("button", {
                    cls: `tag-keyword-chip${matchedContextKey ? " is-context-capsule-synced" : " is-context-capsule-local-only"}`,
                    attr: { type: "button", title: `${def?.icon || "🏷️"} ${def?.label || entry.tagId}` },
                });
                if (matchedContextKey?.contextKeyId) chip.dataset.contextKeyId = matchedContextKey.contextKeyId;
                if (matchedContextKey?.color) chip.style.setProperty("--gtd-context-capsule-color", matchedContextKey.color);
                chip.createEl("span", { text: entry.keyword });
                if (matchedContextKey) chip.createEl("span", { cls: "tag-keyword-context-badge", text: "同步" });
                else chip.createEl("span", { cls: "tag-keyword-context-badge", text: "本地" });
                chip.onclick = () => revealTagInManager(entry.tagId);
            });
            const archivedContextRows = [
                ...archivedKeywordEntries.map((entry) => ({ kind: "bound", entry, sortLabel: getContextCapsuleSortLabel(entry.keyword) })),
                ...archivedVirtualContextKeys.map((key) => ({ kind: "virtual", key, sortLabel: getContextCapsuleSortLabel(key.displayLabel) })),
            ].sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, "zh-CN", { numeric: true, sensitivity: "base" }));
            if (archivedContextRows.length > 0) {
                const archiveToggle = keywordIndexRow.createEl("button", {
                    cls: `tag-keyword-chip tag-keyword-archive-toggle${tagKeywordArchiveExpanded ? " is-expanded" : ""}`,
                    text: `已停止追踪 ${archivedContextRows.length}`,
                    attr: { type: "button", title: tagKeywordArchiveExpanded ? "收起 已停止追踪的主键" : "展开 已停止追踪的主键" },
                });
                archiveToggle.onclick = () => {
                    tagKeywordArchiveExpanded = !tagKeywordArchiveExpanded;
                    if (renderViewFn) renderViewFn();
                };
                if (tagKeywordArchiveExpanded) {
                    const archiveSection = keywordIndex.createEl("div", { cls: "tag-keyword-archive-section" });
                    archiveSection.createEl("div", { cls: "tag-keyword-archive-title", text: "已停止追踪的主键" });
                    const archiveRow = archiveSection.createEl("div", { cls: "tag-keyword-index-row" });
                    archivedContextRows.forEach((rowItem) => {
                        if (rowItem.kind === "virtual") {
                            const key = rowItem.key;
                            const chip = archiveRow.createEl("button", {
                                cls: "tag-keyword-chip is-archived-keyword context-capsule-virtual-chip",
                                attr: { type: "button", title: `${key.displayLabel} · 虚位以待，尚未绑定 GTD 标签` },
                            });
                            if (key.color) chip.style.setProperty("--gtd-context-capsule-color", key.color);
                            chip.dataset.contextKeyId = key.contextKeyId;
                            chip.createEl("span", { text: key.displayLabel });
                            chip.createEl("span", { cls: "tag-keyword-context-badge", text: "虚位" });
                            chip.onclick = () => new Notice(`操作上下文主键尚未绑定 GTD 标签：${key.displayLabel}`);
                            return;
                        }
                        const entry = rowItem.entry;
                        const def = TAG_DEFINITIONS[entry.tagId];
                        const matchedContextKey = getContextCapsuleKeyForKeyword(entry.keyword, contextCapsuleKeyLookup);
                        const chip = archiveRow.createEl("button", {
                            cls: `tag-keyword-chip is-archived-keyword${matchedContextKey ? " is-context-capsule-synced" : " is-context-capsule-local-only"}`,
                            attr: { type: "button", title: `${def?.icon || "🏷️"} ${def?.label || entry.tagId}` },
                        });
                        if (matchedContextKey?.contextKeyId) chip.dataset.contextKeyId = matchedContextKey.contextKeyId;
                        if (matchedContextKey?.color) chip.style.setProperty("--gtd-context-capsule-color", matchedContextKey.color);
                        chip.createEl("span", { text: entry.keyword });
                        if (matchedContextKey) chip.createEl("span", { cls: "tag-keyword-context-badge", text: "同步" });
                        else chip.createEl("span", { cls: "tag-keyword-context-badge", text: "本地" });
                        chip.onclick = () => openContextHistory("", entry.tagId);
                    });
                }
            }
        }

        // 新建/编辑弹窗（默认隐藏）
        const formOverlay = wrapper.createEl("div", { cls: "tag-modal-overlay", attr: { style: "display:none;" } });
        const formContainer = formOverlay.createEl("div", { cls: "tag-form tag-modal-card" });
        formContainer.addClass("gtd-plugin-tag-form-card");
        formOverlay.addEventListener("click", (e) => {
            if (e.target === formOverlay) { if(inlineFormLease?.busy)return; inlineFormLease?.close(); formOverlay.style.display = "none"; }
        });
        let editingTagId = null;

        let inlineFormLease=null;
        const showTagForm = (tagId = null, presetParentId = null, presetIsCategory = null) => {
            editingTagId = tagId;
            const tag = tagId ? TAG_DEFINITIONS[tagId] : null;
            if(context.canLeaveInput && !context.canLeaveInput())return false; if(inlineFormLease?.busy)return false; inlineFormLease?.close(); formContainer.innerHTML = "";
            formOverlay.style.display = "flex";
            logGtdPluginDiag("tag-manager-form-open", {
                tagId,
                tagLabel: tag?.label || null,
                hasUsageButton: !!tagId
            });

            const modalHeader = formContainer.createEl("div", { cls: "tag-modal-header" });
            modalHeader.createEl("div", { text: tagId ? "✏️ 编辑标签" : "➕ 新建标签", cls: "tag-modal-title" });
            const closeBtn = modalHeader.createEl("span", { text: "×", cls: "tag-modal-close" });
            closeBtn.onclick = () => { if(inlineFormLease?.busy)return; inlineFormLease?.close(); formOverlay.style.display = "none"; };
            if (tagId) {
                renderTagUsageProjectPanel(formContainer, tagId, {
                    beforeReveal: () => { if(inlineFormLease?.busy)return; inlineFormLease?.close(); formOverlay.style.display = "none"; }
                });
            }

            // ID（新建时可编辑，编辑时禁用）
            const idRow = formContainer.createEl("div", { cls: "tag-form-row" });
            idRow.createEl("span", { text: "ID:", cls: "tag-form-label" });
            const idInputAttr = tagId
                ? { placeholder: "唯一标识符 (英文)", disabled: "true" }
                : { placeholder: "唯一标识符 (英文)" };
            const idInput = idRow.createEl("input", { type: "text", cls: "tag-form-input", value: tagId || "", attr: idInputAttr });

            // 名称
            const labelRow = formContainer.createEl("div", { cls: "tag-form-row" });
            labelRow.createEl("span", { text: "名称:", cls: "tag-form-label" });
            const labelInput = labelRow.createEl("input", { type: "text", cls: "tag-form-input", value: tag?.label || "", attr: { placeholder: "显示名称" } });

            // 图标
            const iconRow = formContainer.createEl("div", { cls: "tag-form-row" });
            iconRow.createEl("span", { text: "图标:", cls: "tag-form-label" });
            const iconInput = iconRow.createEl("input", { type: "text", cls: "tag-form-input", value: tag?.icon || "🏷️", attr: { placeholder: "Emoji图标" } });

            // 颜色
            const colorRow = formContainer.createEl("div", { cls: "tag-form-row" });
            colorRow.createEl("span", { text: "颜色:", cls: "tag-form-label" });
            const colorInput = colorRow.createEl("input", { type: "color", cls: "tag-form-input", value: tag?.color || "#3498db", attr: { style: "width:60px; padding:2px;" } });

            // 父级
            const parentRow = formContainer.createEl("div", { cls: "tag-form-row" });
            parentRow.createEl("span", { text: "父级:", cls: "tag-form-label" });
            const parentSelector = parentRow.createEl("div", { cls: "tag-parent-selector" });
            const parentInputWrapper = parentSelector.createEl("div", { cls: "tag-parent-input-wrapper" });
            const parentInput = parentInputWrapper.createEl("input", { type: "text", cls: "tag-parent-input", attr: { placeholder: "输入标签名称筛选..." } });
            const parentClear = parentInputWrapper.createEl("span", { cls: "tag-parent-clear", text: "×" });
            const parentDropdown = parentSelector.createEl("div", { cls: "tag-parent-dropdown" });

            const excluded = new Set();
            if (tagId) {
                excluded.add(tagId);
                getDescendantTagIds(tagId).forEach(id => excluded.add(id));
            }
            const availableParents = Object.keys(TAG_DEFINITIONS)
                .filter(k => !excluded.has(k))
                .map(k => ({ id: k, ...TAG_DEFINITIONS[k] }))
                .sort((a, b) => (a.label || '').localeCompare(b.label || '', 'zh-CN', { numeric: true, sensitivity: 'base' }));

            let selectedParentId = tag ? (tag.parentId || null) : (presetParentId || null);
            let highlightedIndex = -1;

            const updateInputDisplay = () => {
                if (selectedParentId) {
                    const def = TAG_DEFINITIONS[selectedParentId];
                    parentInput.value = def ? `${def.icon} ${def.label}` : "";
                } else {
                    parentInput.value = "";
                }
            };
            updateInputDisplay();

            const renderParentOptions = (query = "") => {
                parentDropdown.innerHTML = "";
                const q = query.trim().toLowerCase();
                const filtered = q
                    ? availableParents.filter(p =>
                        (p.label || "").toLowerCase().includes(q) ||
                        (p.id || "").toLowerCase().includes(q)
                      )
                    : availableParents;

                const topOpt = parentDropdown.createEl("div", {
                    cls: `tag-parent-option ${!selectedParentId ? "selected" : ""}`,
                    attr: { "data-value": "" }
                });
                topOpt.innerHTML = `<span>🏠</span><span>-- 顶层标签 --</span>`;
                inlineFormLease?.allow([topOpt]);
                topOpt.onclick = () => {
                    selectedParentId = null;
                    updateInputDisplay();
                    parentDropdown.classList.remove("visible");
                    parentInput.blur();
                };

                if (filtered.length === 0) {
                    parentDropdown.createEl("div", { cls: "tag-parent-empty", text: "无匹配父级" });
                } else {
                    filtered.forEach((p, idx) => {
                        const opt = parentDropdown.createEl("div", {
                            cls: `tag-parent-option ${selectedParentId === p.id ? "selected" : ""} ${idx === highlightedIndex ? "highlighted" : ""}`,
                            attr: { "data-value": p.id }
                        });
                        opt.innerHTML = `<span>${p.icon}</span><span>${p.label}</span>`;
                        inlineFormLease?.allow([opt]);
                        opt.onclick = () => {
                            selectedParentId = p.id;
                            updateInputDisplay();
                            parentDropdown.classList.remove("visible");
                            parentInput.blur();
                        };
                    });
                }

                const statsText = q
                    ? `显示 ${filtered.length}/${availableParents.length} 个可选父级`
                    : `共 ${availableParents.length} 个可选父级`;
                parentDropdown.createEl("div", { cls: "tag-parent-stats", text: statsText });
                highlightedIndex = -1;
            };

            const showParentDropdown = () => {
                renderParentOptions(parentInput.value);
                parentDropdown.classList.add("visible");
            };
            const hideParentDropdown = () => {
                setTimeout(() => parentDropdown.classList.remove("visible"), 150);
            };

            parentInput.addEventListener("focus", showParentDropdown);
            parentInput.addEventListener("blur", hideParentDropdown);
            parentInput.addEventListener("input", () => {
                highlightedIndex = -1;
                showParentDropdown();
            });
            parentInput.addEventListener("keydown", (e) => {
                const options = parentDropdown.querySelectorAll(".tag-parent-option");
                if (options.length === 0) return;
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
                    options.forEach((opt, i) => opt.classList.toggle("highlighted", i === highlightedIndex));
                    if (options[highlightedIndex]) options[highlightedIndex].scrollIntoView({ block: "nearest" });
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    highlightedIndex = Math.max(highlightedIndex - 1, 0);
                    options.forEach((opt, i) => opt.classList.toggle("highlighted", i === highlightedIndex));
                    if (options[highlightedIndex]) options[highlightedIndex].scrollIntoView({ block: "nearest" });
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && options[highlightedIndex]) {
                        options[highlightedIndex].click();
                    } else if (options[0]) {
                        options[0].click();
                    }
                } else if (e.key === "Escape") {
                    parentDropdown.classList.remove("visible");
                    parentInput.blur();
                }
            });

            parentClear.onclick = (e) => {
                e.stopPropagation();
                selectedParentId = null;
                updateInputDisplay();
                parentInput.focus();
            };

            // 是否为分类
            const categoryRow = formContainer.createEl("div", { cls: "tag-form-row" });
            categoryRow.createEl("span", { text: "分类:", cls: "tag-form-label" });
            const categoryCheck = categoryRow.createEl("input", { type: "checkbox", cls: "tag-form-checkbox" });
            categoryCheck.checked = tag ? !!tag.isCategory : !!presetIsCategory;
            categoryRow.createEl("span", { text: "设为分类（只能包含子标签，不能直接标记条目）", attr: { style: "color:var(--text-muted); font-size:0.85em; margin-left:8px;" } });

            const keywordPanel = formContainer.createEl("div", { cls: "tag-keyword-editor-card" });
            const keywordHead = keywordPanel.createEl("div", { cls: "tag-keyword-editor-head" });
            keywordHead.createEl("div", { cls: "tag-keyword-editor-title", text: "🔎 标签关键词" });
            keywordHead.createEl("div", { cls: "tag-keyword-editor-hint", text: "一行一个关键词；保存后可从上方关键词区直达标签" });
            const keywordInput = keywordPanel.createEl("textarea", {
                cls: "tag-keyword-editor-input",
                text: tagId ? getTagKeywords(tagId).join("\n") : "",
                attr: { placeholder: "例如：合同\n雷达\n下次行动" }
            });
            // 按钮
            const btnRow = formContainer.createEl("div", { cls: "tag-form-row", attr: { style: "justify-content:flex-end; margin-top:15px;" } });
            const cancelBtn = btnRow.createEl("button", { text: "取消", cls: "tag-mgr-btn tag-mgr-btn-secondary" });
            cancelBtn.onclick = () => { if(inlineFormLease?.busy)return; inlineFormLease?.close(); formOverlay.style.display = "none"; };
            const saveBtn = btnRow.createEl("button", { text: tagId ? "保存修改" : "创建标签", cls: "tag-mgr-btn tag-mgr-btn-primary" });
            let formAttempt=null;
            const formLease=tracking.registerEditor(formContainer,{inputs:[...formContainer.querySelectorAll('input,textarea,select')],controls:[saveBtn,cancelBtn],targetLive:()=>formOverlay.style.display!=="none"});
            inlineFormLease=formLease;
            formLease.allow([closeBtn,parentClear]);
            
            saveBtn.onclick = async () => {
              try {return await formLease.save(async live=>{
                const newId = idInput.value.trim();
                if (!newId) { new Notice("⚠️ 请输入标签ID"); return; }
                if (!labelInput.value.trim()) { new Notice("⚠️ 请输入标签名称"); return; }
                if (!tagId && TAG_DEFINITIONS[newId] && !(formAttempt?.newId===newId && JSON.stringify(TAG_DEFINITIONS)===formAttempt.after)) { new Notice("⚠️ 该ID已存在"); return; }
                const keywordValidation = validateTagKeywordAssignment(newId, keywordInput.value.split(/\r?\n/), [tagId]);
                if (!keywordValidation.ok) {
                    new Notice(`⚠️ 关键词已被占用：${keywordValidation.conflicts.map((entry) => `${entry.keyword} -> ${entry.tagLabel}`).join("；")}`);
                    return;
                }

                const inputSignature=JSON.stringify([newId,labelInput.value.trim(),iconInput.value.trim(),colorInput.value,selectedParentId,categoryCheck.checked,keywordValidation.keywords]);
                if(formAttempt && formAttempt.inputSignature!==inputSignature)throw Error('GTD_TAG_PENDING_INPUT_CHANGED: 请恢复上次输入完成同步，或取消后重新编辑已保存标签');
                const nextDefinitions=JSON.parse(JSON.stringify(TAG_DEFINITIONS));
                nextDefinitions[newId] = {
                    label: labelInput.value.trim(),
                    icon: iconInput.value.trim() || "🏷️",
                    color: colorInput.value,
                    parentId: selectedParentId || null,
                    isCategory: categoryCheck.checked,
                    order: tag?.order || Object.keys(nextDefinitions).filter(k => nextDefinitions[k].parentId === (selectedParentId || null)).length
                };

                if (tagId && tagId !== newId) {
                    // ID变更，需要更新所有子标签的parentId
                    Object.keys(nextDefinitions).forEach(k => {
                        if (nextDefinitions[k].parentId === tagId) nextDefinitions[k].parentId = newId;
                    });
                    delete nextDefinitions[tagId];
                }

                if(!formAttempt)formAttempt={inputSignature,newId,before:JSON.stringify(TAG_DEFINITIONS),after:JSON.stringify(nextDefinitions),expectedRaw:tagDefinitionRawEvidence,definitionDone:false};
                const memory=JSON.stringify(TAG_DEFINITIONS);
                if(memory!==formAttempt.before && memory!==formAttempt.after)throw Error('GTD_TAG_MEMORY_CHANGED');
                if(!formAttempt.definitionDone){
                    const confirmedRaw=await saveTagDefinitions(JSON.parse(formAttempt.after),{expectedRaw:formAttempt.expectedRaw,live});
                    formAttempt.expectedRaw=confirmedRaw;formAttempt.definitionDone=true;
                } else {
                    const disk=await app.vault.adapter.exists(TAGS_PATH)?await app.vault.adapter.read(TAGS_PATH):null;
                    if(disk!==formAttempt.expectedRaw)throw Error('GTD_TAG_SOURCE_CHANGED');
                }
                if(!live())throw Error('GTD_TAG_EDITOR_STALE_AFTER_DEFINITION');
                if(JSON.stringify(TAG_DEFINITIONS)!==memory)throw Error('GTD_TAG_MEMORY_CHANGED_AFTER_SAVE');
                TAG_DEFINITIONS=JSON.parse(formAttempt.after);
                invalidateCarrierInput();
                if(!live())throw Error('GTD_TAG_EDITOR_STALE_AFTER_DEFINITION');
                await setTagKeywordsForTag(newId, keywordValidation.keywords, tagId);
                if(!live())return false;
                formLease.close();
                new Notice(tagId ? "✅ 标签已更新" : "✅ 标签已创建");
                formOverlay.style.display = "none";
                if (renderViewFn) renderViewFn();
              });}catch(error){new Notice(String(error?.message||'').startsWith('GTD_TAG_PENDING_INPUT_CHANGED')?'本次输入已改变。请恢复上次输入完成同步，或取消后重新编辑已保存的标签。':'标签保存未完成，输入已保留；已完成步骤不会回滚，请核验后重试。');return false;}
            };
        };

        addTagBtn.onclick = () => showTagForm(null);
        addCategoryBtn.onclick = () => {
            showTagForm(null, null, true);
        };

        const normalizeTagOrders = () => {
            invalidateCarrierInput();
            const grouped = new Map();
            Object.keys(TAG_DEFINITIONS).forEach((id) => {
                const parentKey = TAG_DEFINITIONS[id].parentId || "__root__";
                if (!grouped.has(parentKey)) grouped.set(parentKey, []);
                grouped.get(parentKey).push(id);
            });
            grouped.forEach((ids) => {
                ids.sort((a, b) => (TAG_DEFINITIONS[a].order || 0) - (TAG_DEFINITIONS[b].order || 0));
                ids.forEach((id, idx) => { TAG_DEFINITIONS[id].order = idx; });
            });
        };

        const moveTagDefinition = async (draggedId, targetId = null, position = "after") => { if (historySession) return rejectHistoryWrite("moveTagDefinition");
            if (!draggedId || !TAG_DEFINITIONS[draggedId]) return;
            if (targetId && (!TAG_DEFINITIONS[targetId] || draggedId === targetId)) return;

            if (targetId) {
                let current = targetId;
                while (current) {
                    if (current === draggedId) {
                        new Notice("⚠️ 不能将父标签拖入其子标签");
                        return;
                    }
                    current = TAG_DEFINITIONS[current]?.parentId || null;
                }
            }

            const dragged = TAG_DEFINITIONS[draggedId];
            const nextParentId = !targetId
                ? null
                : (position === "child" ? targetId : (TAG_DEFINITIONS[targetId].parentId || null));

            const siblingIds = Object.keys(TAG_DEFINITIONS)
                .filter((id) => id !== draggedId && (TAG_DEFINITIONS[id].parentId || null) === nextParentId)
                .sort((a, b) => (TAG_DEFINITIONS[a].order || 0) - (TAG_DEFINITIONS[b].order || 0));

            invalidateCarrierInput();
        dragged.parentId = nextParentId;
            if (!targetId) {
                siblingIds.push(draggedId);
            } else if (position === "child") {
                siblingIds.unshift(draggedId);
            } else {
                const targetIndex = siblingIds.indexOf(targetId);
                if (targetIndex < 0) siblingIds.push(draggedId);
                else siblingIds.splice(position === "before" ? targetIndex : targetIndex + 1, 0, draggedId);
            }

            siblingIds.forEach((id, idx) => { TAG_DEFINITIONS[id].order = idx; });
            normalizeTagOrders();
            await saveTagDefinitions(TAG_DEFINITIONS);
            if (renderViewFn) renderViewFn();
        };

        // 标签树
        treeContainer = wrapper.createEl("div", { cls: "tag-tree" });

        // 顶层拖放区
        const topDropZone = treeContainer.createEl("div", { cls: "tag-drop-zone" });
        topDropZone.addEventListener("dragover", (e) => { e.preventDefault(); topDropZone.classList.add("active"); });
        topDropZone.addEventListener("dragleave", () => { topDropZone.classList.remove("active"); });
        topDropZone.addEventListener("drop", async (e) => {
            e.preventDefault();
            topDropZone.classList.remove("active");
            const draggedId = ui.gtdCurrentDragTagId;
            if (draggedId && TAG_DEFINITIONS[draggedId]) await moveTagDefinition(draggedId, null, "after");
        });

        // 递归渲染标签树
        const renderTagTree = (parentId, container, level = 0) => {
            const children = Object.keys(TAG_DEFINITIONS)
                .filter(k => TAG_DEFINITIONS[k].parentId === parentId)
                .sort((a, b) => (TAG_DEFINITIONS[a].order || 0) - (TAG_DEFINITIONS[b].order || 0));

            children.forEach(tagId => {
                if (isStoppedContextTag(tagId)) { renderTagTree(tagId, container, level); return; }
                const def = TAG_DEFINITIONS[tagId];
                const item = container.createEl("div", {
                    cls: `tag-item ${def.isCategory ? 'is-category' : ''}`,
                    attr: { draggable: "true", "data-tag-id": tagId }
                });

                // 拖拽事件
                item.addEventListener("dragstart", (e) => {
                    ui.gtdCurrentDragTagId = tagId;
                    item.classList.add("dragging");
                    e.dataTransfer.effectAllowed = "move";
                });
                item.addEventListener("dragend", () => {
                    ui.gtdCurrentDragTagId = null;
                    item.classList.remove("dragging", "drag-over", "drag-over-before", "drag-over-after", "drag-over-child");
                });
                item.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    if (ui.gtdCurrentDragTagId && ui.gtdCurrentDragTagId !== tagId) {
                        const rect = item.getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / Math.max(rect.width, 1);
                        item.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child");
                        if (ratio > 0.66) item.classList.add("drag-over-child");
                        else if ((e.clientY - rect.top) < rect.height / 2) item.classList.add("drag-over-before");
                        else item.classList.add("drag-over-after");
                    }
                });
                item.addEventListener("dragleave", () => { item.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child"); });
                item.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child");
                    const draggedId = ui.gtdCurrentDragTagId;
                    if (draggedId && draggedId !== tagId && TAG_DEFINITIONS[draggedId]) {
                        const rect = item.getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / Math.max(rect.width, 1);
                        const position = ratio > 0.66 ? "child" : ((e.clientY - rect.top) < rect.height / 2 ? "before" : "after");
                        await moveTagDefinition(draggedId, tagId, position);
                    }
                });

                // 颜色点
                const colorDot = item.createEl("div", { cls: "tag-color-dot" });
                colorDot.style.backgroundColor = def.color;

                // 图标
                item.createEl("span", { text: def.icon, cls: "tag-icon" });

                // 信息
                const info = item.createEl("div", { cls: "tag-info" });
                info.createEl("div", { text: def.label, cls: "tag-label" });
                const childCount = Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k].parentId === tagId).length;
                const usageCount = gtdList.filter(i => i.status === "active" && Array.isArray(i.tags) && tagMatchesFilter(i.tags, [tagId])).length;
                info.createEl("div", {
                    cls: "tag-meta",
                    text: `ID: ${tagId} | ${def.isCategory ? '📁 分类' : '🏷️ 标签'} | 子级: ${childCount} | 使用: ${usageCount}次`
                });
                const tagKeywords = getTagKeywords(tagId);
                if (tagKeywords.length > 0) {
                    const keywordRow = info.createEl("div", { cls: "tag-keyword-mini-row" });
                    tagKeywords.forEach((keyword) => {
                        keywordRow.createEl("span", { cls: "tag-keyword-mini-chip", text: keyword });
                    });
                }

                // 操作按钮
                const actions = item.createEl("div", { cls: "tag-actions" });
                const addChildBtn = actions.createEl("button", { text: "＋", cls: "tag-action-btn", title: "新增子标签" });
                addChildBtn.onclick = (e) => { e.stopPropagation(); showTagForm(null, tagId, false); };
                const editBtn = actions.createEl("button", { text: "⚙️ 配置", cls: "tag-action-btn tag-config-btn", title: "配置标签" });
                editBtn.dataset.gtdTagConfigButton = "manager-edit";
                editBtn.dataset.tagId = tagId;
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    logGtdPluginDiag("manager-tag-config-click", {
                        tagId,
                        tagLabel: def.label,
                        buttonTitle: editBtn.title
                    });
                    showTagForm(tagId);
                };
                const deleteBtn = actions.createEl("button", { text: "🗑️", cls: "tag-action-btn delete", title: "删除" });
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (childCount > 0) {
                        new Notice("⚠️ 请先删除或移动该标签下的子标签");
                        return;
                    }
                    if (usageCount > 0) {
                        new Notice(`⚠️ 该标签正在被 ${usageCount} 个条目使用，请先移除`);
                        return;
                    }
                    invalidateCarrierInput();
                    delete TAG_DEFINITIONS[tagId];
                    await saveTagDefinitions(TAG_DEFINITIONS);
                    new Notice("🗑️ 标签已删除");
                    if (renderViewFn) renderViewFn();
                };

                // 子标签容器
                const hasChildren = Object.keys(TAG_DEFINITIONS).some(k => TAG_DEFINITIONS[k].parentId === tagId);
                if (hasChildren) {
                    const childrenContainer = container.createEl("div", { cls: "tag-children" });
                    renderTagTree(tagId, childrenContainer, level + 1);
                }
            });
        };

        renderStoppedContextTags(treeContainer);
        renderTagTree(null, treeContainer, 0);

        // 提示信息
        if (Object.keys(TAG_DEFINITIONS).length === 0) {
            treeContainer.createEl("div", {
                text: "暂无标签，点击上方按钮创建你的第一个标签！",
                attr: { style: "text-align:center; padding:40px; color:var(--text-muted);" }
            });
        }

        wrapper.createEl("div", {
            attr: { style: "margin-top:20px; padding:12px; background:var(--background-primary); border-radius:8px; font-size:0.85em; color:var(--text-muted);" }
        }).innerHTML = `
            <strong>💡 使用提示：</strong><br>
            • 拖拽标签可以调整前后顺序或层级关系（上半部=前面，下半部=后面，向右拖入=子标签，顶部区域=顶层）<br>
            • 点击标签右侧的 ⚙️ 可弹窗配置名称、图标、颜色、父级与分类属性；点击 ＋ 可直接新增子标签<br>
            • 分类标签只能包含子标签，不能直接用于标记任务条目<br>
            • 删除标签前需要先移除其子标签和使用该标签的条目
        `;
    };

    const renderNormalView = () => tracking.run(()=>renderNormalViewBody());
    const renderNormalViewBody = () => {
        disposeCommentPreviewComponent();
        if(context.canLeaveInput && !context.canLeaveInput())return false; container.innerHTML = "";
        if (!gtdList) { createParagraph(`⏳ 读取数据中...`); return; }

        const getDisplayName = (item) => item.type === 'project' ? (item.project || "未命名") : (item.content || "未命名");
        const isItemEffectivelyCollapsed = (item) => historyCollapsedFor(item);
        const isProjectEffectivelyCollapsed = (item) => historyCollapsedFor(item);
        const nameSort = (a, b) => getDisplayName(a.item).localeCompare(getDisplayName(b.item), "zh"); 
        const scheduleSort = (a, b) => {
            const d1 = a.item.scheduled || "9999-99-99";
            const d2 = b.item.scheduled || "9999-99-99";
            if (d1 !== d2) return d1.localeCompare(d2);
            const p1 = a.item.project || "";
            const p2 = b.item.project || "";
            if (p1 !== p2) return p1.localeCompare(p2, "zh");
            return getDisplayName(a.item).localeCompare(getDisplayName(b.item), "zh");
        };
        
        const containerStyle = "margin-bottom: 20px; padding: 15px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background-color: var(--background-primary-alt);";
        const headerStyle = "margin: 0 0 10px 0; font-size: 1.1em; font-weight: bold; color: var(--text-normal); border-bottom: 2px solid var(--interactive-accent); padding-bottom: 5px; display:flex; justify-content:space-between; align-items:center;";
        const btnStyle = "background-color: var(--interactive-accent); color: var(--text-on-accent); padding: 6px 16px; font-weight: bold; cursor: pointer; border-radius: 6px; border: none; font-size: 13px; margin-right: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";

        container.createEl("style", { text: `
            .gtd-item-line { user-select: none; position: relative; }
            .gtd-item-line.is-first-class {
                box-shadow: inset 3px 0 0 rgba(241, 196, 15, 0.78);
                background-image: linear-gradient(90deg, rgba(241, 196, 15, 0.20) 0%, rgba(241, 196, 15, 0.11) 28%, rgba(241, 196, 15, 0.04) 56%, transparent 88%);
            }
            .gtd-item-line.is-focus-session {
                border-right: 2px solid rgba(233, 30, 99, 0.55);
                box-shadow: none;
                background-image: linear-gradient(270deg, rgba(233, 30, 99, 0.14) 0%, rgba(233, 30, 99, 0.08) 28%, rgba(233, 30, 99, 0.03) 58%, transparent 88%);
            }
            .gtd-item-line.is-first-class.is-focus-session {
                box-shadow: inset 3px 0 0 rgba(241, 196, 15, 0.78);
                background-image:
                    linear-gradient(90deg, rgba(241, 196, 15, 0.16) 0%, rgba(241, 196, 15, 0.07) 24%, rgba(241, 196, 15, 0.02) 52%, transparent 75%),
                    linear-gradient(270deg, rgba(233, 30, 99, 0.13) 0%, rgba(233, 30, 99, 0.07) 30%, rgba(233, 30, 99, 0.02) 58%, transparent 88%);
            }
            .gtd-item-line.is-focus-session::after {
                content: attr(data-focus-badge);
                position: absolute;
                right: 8px;
                top: -8px;
                background: #e91e63;
                color: #fff;
                border-radius: 999px;
                font-size: 10px;
                line-height: 1;
                padding: 2px 6px;
                letter-spacing: 0.3px;
                box-shadow: 0 2px 6px rgba(233, 30, 99, 0.35);
            }
            .gtd-item-line.gtd-rel-focus-hit,
            summary.gtd-rel-focus-hit {
                box-shadow: 0 0 0 2px rgba(38, 166, 154, 0.18), 0 10px 24px rgba(38, 166, 154, 0.12);
                border-radius: 8px;
            }
            .gtd-relation-chip {
                display: inline-flex;
                align-items: center;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                margin-left: 6px;
                cursor: pointer;
                border: 1px solid var(--background-modifier-border);
                background: var(--background-secondary);
                font-weight: 700;
            }
            .gtd-relation-chip.outgoing {
                color: #116b5a;
                border-color: rgba(17,107,90,.26);
                background: linear-gradient(180deg, rgba(26,188,156,.18) 0%, rgba(26,188,156,.08) 100%);
            }
            .gtd-relation-chip.incoming {
                color: #9a5b00;
                border-color: rgba(154,91,0,.24);
                background: linear-gradient(180deg, rgba(243,156,18,.18) 0%, rgba(243,156,18,.08) 100%);
            }
            .drag-over-top { border-top: 3px solid #2ecc71 !important; }
            .drag-over-bottom { border-bottom: 3px solid #2ecc71 !important; }
            .drag-over-child { background-color: rgba(46, 204, 113, 0.2) !important; border-left: 3px solid #2ecc71 !important; }
            .drag-over-project { background-color: rgba(46, 204, 113, 0.3) !important; border: 2px dashed #2ecc71 !important; border-radius: 6px; }
            summary.gtd-focus-project {
                border: none;
                border-right: 2px solid rgba(233, 30, 99, 0.5);
                border-radius: 8px;
                padding: 4px 8px;
                background: linear-gradient(270deg, rgba(233, 30, 99, 0.12) 0%, rgba(233, 30, 99, 0.06) 32%, transparent 86%);
                box-shadow: none;
            }
            .is-dragging { opacity: 0.4; background: var(--background-modifier-hover); transform: scale(0.99); }
            .completed-line { opacity: 0.9; }
            .ghost-line { opacity: 0.5; font-style: italic; pointer-events: none; }
            .gtd-drag-handle { color: var(--text-faint); cursor: grab; letter-spacing: -1px; user-select: none; padding: 0 2px; }
            .gtd-drag-handle:active { cursor: grabbing; }
            .proj-nav-drop-root { border: 1px dashed var(--background-modifier-border); border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; color: var(--text-muted); font-size: 0.85em; text-align: center; transition: all 0.2s; }
            .proj-nav-drop-root.drag-over { border-color: #2ecc71; background: rgba(46, 204, 113, 0.15); color: var(--text-normal); }
            .proj-nav-row { display: flex; align-items: center; gap: 2px; border-radius: 6px; padding: 1px 2px; transition: background 0.2s, box-shadow 0.2s; }
            .proj-nav-row.drag-over { background: rgba(46, 204, 113, 0.18); outline: 1px dashed #2ecc71; }
            .proj-nav-row.drag-over-before { box-shadow: inset 0 2px 0 #2ecc71; }
            .proj-nav-row.drag-over-after { box-shadow: inset 0 -2px 0 #2ecc71; }
            .proj-nav-row.drag-over-child { background: rgba(46, 204, 113, 0.18); outline: 1px dashed #2ecc71; }
            .proj-nav-row.is-dragging { opacity: 0.45; }
            .proj-nav-toggle { width: 16px; text-align: center; color: var(--text-muted); cursor: pointer; user-select: none; font-size: 11px; }
            .proj-nav-toggle.spacer { opacity: 0.35; cursor: default; }
            .proj-nav-tag { cursor: pointer; font-size: 0.9em; display:flex; align-items:center; gap:6px; flex-wrap:nowrap; background: transparent; padding: 4px 8px; margin-bottom: 2px; border-radius: 4px; color: var(--text-muted); transition: all 0.2s; border: 1px solid transparent; user-select: none; flex: 1; }
            .proj-nav-tag:hover { color: var(--interactive-accent); border-color: var(--background-modifier-border); background: var(--background-primary); }
            .proj-nav-main { color: var(--text-normal); font-weight: 600; line-height: 1.25; white-space: nowrap; }
            .proj-nav-tags { display: inline-flex; flex-wrap: nowrap; gap: 4px; }
            .proj-nav-pill { display: inline-flex; align-items: center; gap: 3px; padding: 0 6px; border-radius: 10px; font-size: 0.72em; color: var(--text-normal); border: 1px solid var(--background-modifier-border); background: transparent; box-shadow: none; white-space: nowrap; }
            .proj-nav-tag-edit { cursor: pointer; user-select: none; font-size: 13px; line-height: 1; padding: 2px 6px; border-radius: 10px; border: 1px solid transparent; color: var(--text-muted); transition: all 0.2s; }
            .proj-nav-tag-edit:hover { color: var(--interactive-accent); border-color: var(--background-modifier-border); background: var(--background-primary); }
            .proj-nav-row.gtd-quick-nav-focus-hit { outline: 2px solid var(--interactive-accent); box-shadow: 0 0 0 4px rgba(var(--interactive-accent-rgb), 0.14), 0 8px 22px rgba(0,0,0,0.12); background: var(--background-primary); }
            @keyframes highlight-pulse { 0% { background-color: rgba(255, 235, 59, 0.4); } 50% { background-color: rgba(255, 235, 59, 0.2); } 100% { background-color: transparent; } }
            .highlight-target { animation: highlight-pulse 1.5s ease-out; border-radius: 8px; }
            .tag-pill { display: inline-flex; align-items: center; gap: 4px; padding: 0px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 6px; font-weight: 500; color: white; opacity: 0.9; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
            .tag-filter-btn { padding: 4px 10px; border-radius: 12px; border: 1px solid var(--background-modifier-border); cursor: pointer; font-size: 12px; background: transparent; transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
            .tag-filter-btn.active { color: white; border-color: transparent; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
            .tag-filter-btn:hover { background: var(--background-modifier-hover); }
            .tag-filter-node { display: inline-flex; align-items: center; gap: 4px; padding: 0; border-radius: 12px; }
            .tag-filter-node.active { background: transparent; }
            .tag-filter-node.active .tag-filter-btn { color: white; border-color: transparent; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transform: none; }
            .tag-filter-node.active .tag-filter-icon-btn { color: white; border-color: transparent; }
            .tag-filter-icon-btn { width: 24px; height: 24px; border-radius: 12px; border: 1px solid var(--background-modifier-border); background: transparent; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; padding: 0; }
            .tag-filter-icon-btn:hover { color: var(--interactive-accent); border-color: var(--background-modifier-border); background: var(--background-primary); transform: none; box-shadow: none; }
            .tag-filter-label-text { white-space: nowrap; }
            .tag-filter-drop-root { padding: 4px 10px; border-radius: 12px; border: 1px dashed var(--background-modifier-border); color: var(--text-muted); font-size: 11px; cursor: default; background: transparent; }
            .tag-filter-drop-target { transition: box-shadow 0.18s ease, outline 0.18s ease, background 0.18s ease; border-radius: 12px; }
            .tag-filter-drop-target.drag-over-before { box-shadow: inset 0 2px 0 var(--interactive-accent); }
            .tag-filter-drop-target.drag-over-after { box-shadow: inset 0 -2px 0 var(--interactive-accent); }
            .tag-filter-drop-target.drag-over-child { outline: 2px dashed var(--interactive-accent); outline-offset: 2px; }
            .tag-filter-drop-root.drag-over-child,
            .tag-filter-drop-root.drag-over-before,
            .tag-filter-drop-root.drag-over-after { background: var(--background-modifier-hover); border-color: var(--interactive-accent); color: var(--text-normal); }
            .tag-category-group { display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; border-radius: 8px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); margin-left: 6px; }
            .tag-category-group.active { box-shadow: none; }
            .tag-category-header { display: flex; align-items: center; gap: 4px; padding: 0; border-radius: 12px; }
            .tag-category-header.active { background: transparent; }
            .tag-filter-fold-toggle { width: 16px; text-align: center; color: var(--text-muted); cursor: pointer; user-select: none; font-size: 11px; flex-shrink: 0; }
            .tag-filter-fold-toggle:hover { color: var(--interactive-accent); }
            .tag-category-label { font-size: 13px; cursor: pointer; padding: 2px 6px; border-radius: 10px; transition: all 0.2s; font-weight: 600; border: 1px solid transparent; background: transparent; }
            .tag-category-label:hover { background: var(--background-modifier-hover); border-color: transparent; }
            .tag-category-label.active { color: white; }
            .tag-category-header.active .tag-filter-icon-btn { color: white; border-color: transparent; }
            .tag-children-group { display: flex; gap: 4px; flex-wrap: wrap; padding-left: 12px; border-left: 2px solid var(--background-modifier-border); margin-left: 8px; margin-top: 4px; }
            .tag-filter-keyword-index { width: 100%; max-width: none; box-sizing: border-box; display: flex; justify-content: space-evenly; align-items: center; gap: 8px 10px; flex-wrap: wrap; padding: 8px 10px; border: 1px solid var(--background-modifier-border); border-radius: 12px; background: var(--background-primary); }
            .tag-filter-keyword-title { color: var(--text-muted); font-size: 12px; font-weight: 700; padding: 3px 8px; flex: 0 0 auto; }
            .tag-filter-keyword-chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--background-modifier-border); border-radius: 999px; background: var(--background-secondary); color: var(--text-normal); cursor: pointer; padding: 3px 9px; font-size: 12px; }
            .tag-filter-keyword-chip:hover { border-color: var(--interactive-accent); color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .tag-filter-keyword-chip.is-context-capsule-synced { border-color: color-mix(in srgb, var(--interactive-accent) 55%, var(--background-modifier-border) 45%); background: color-mix(in srgb, var(--interactive-accent) 13%, var(--background-secondary) 87%); }
            .tag-filter-keyword-chip.is-context-capsule-local-only { border-color: rgba(245,158,11,.70); background: rgba(245,158,11,.13); }
            .tag-filter-keyword-chip.context-capsule-virtual-chip { border-style: dashed; border-color: color-mix(in srgb, var(--interactive-accent) 42%, var(--background-modifier-border) 58%); background: color-mix(in srgb, var(--interactive-accent) 7%, var(--background-primary) 93%); color: var(--text-muted); }
            .tag-filter-keyword-context-badge { padding: 1px 5px; border-radius: 999px; font-size: 10px; font-weight: 800; line-height: 1.2; color: var(--text-accent); background: color-mix(in srgb, var(--interactive-accent) 14%, transparent); }
            .tag-filter-keyword-chip.context-capsule-virtual-chip .tag-filter-keyword-context-badge { color: var(--text-muted); background: var(--background-modifier-hover); }
            .tag-filter-keyword-archive-toggle { border-style: dashed; border-color: rgba(245,158,11,.45); background: rgba(245,158,11,.10); color: var(--text-muted); }
            .tag-filter-keyword-archive-toggle.is-expanded { border-style: solid; border-color: rgba(245,158,11,.70); background: rgba(245,158,11,.18); color: var(--text-normal); }
            .tag-filter-keyword-archive-section { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 6px; padding: 10px; border: 1px solid rgba(245,158,11,.25); border-radius: 12px; background: rgba(245,158,11,.05); }
            .tag-filter-keyword-archive-title { font-size: 12px; font-weight: 800; color: var(--text-muted); }
            .tag-filter-keyword-index-row { display: flex; gap: 8px 10px; flex-wrap: wrap; justify-content: space-evenly; width: 100%; }
            .tag-filter-keyword-chip.is-archived-keyword { border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.08); }
            .tag-filter-keyword-empty { color: var(--text-muted); font-size: 12px; padding: 3px 2px; }
            .tag-filter-node.is-keyword-focus,
            .tag-category-header.is-keyword-focus { outline: 2px solid var(--interactive-accent); box-shadow: 0 0 0 4px rgba(var(--interactive-accent-rgb), 0.14), 0 8px 22px rgba(0,0,0,0.12); }
            .gtd-tag-definition-modal { width: min(1120px, calc(100vw - 32px)); max-width: calc(100vw - 32px); overflow-x: hidden; }
            .gtd-tag-definition-modal .modal-content { width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box; overflow-x: hidden; padding: 22px; border-radius: 22px; border: 1px solid rgba(var(--interactive-accent-rgb), 0.34); background: linear-gradient(180deg, var(--background-primary), var(--background-secondary)); box-shadow: 0 24px 70px rgba(15,23,42,0.34); }
            .gtd-tag-definition-modal .modal-content *,
            .tag-modal-card * { box-sizing: border-box; max-width: 100%; }
            .gtd-plugin-modal-title { margin: 0 0 12px; padding-bottom: 10px; border-bottom: 1px solid var(--background-modifier-border); font-size: 1.32em; font-weight: 900; }
            .gtd-plugin-tag-definition-content .tag-form { border-radius: 16px; border: 1px solid rgba(var(--interactive-accent-rgb),0.20); background: var(--background-primary); box-shadow: 0 8px 22px rgba(0,0,0,0.08); }
            .tag-modal-subtitle { margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: var(--text-muted); font-size: 12px; }
            .tag-modal-preview-icon { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18); }
            .tag-modal-preview-id { padding: 2px 8px; border-radius: 999px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); font-family: var(--font-monospace); font-size: 11px; }
            .tag-modal-quick-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
            .tag-usage-open-btn { border: 1px solid rgba(var(--interactive-accent-rgb), 0.38); border-radius: 999px; padding: 6px 12px; background: rgba(var(--interactive-accent-rgb), 0.10); color: var(--interactive-accent); font-weight: 800; cursor: pointer; box-shadow: 0 6px 14px rgba(0,0,0,0.08); }
            .tag-usage-open-btn:hover { background: var(--interactive-accent); color: var(--text-on-accent); transform: translateY(-1px); }
            .gtd-tag-usage-projects-modal { width: min(920px, calc(100vw - 32px)); max-width: calc(100vw - 32px); overflow-x: hidden; }
            .gtd-tag-usage-projects-modal .modal-content { width: 100%; min-width: 0; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
            .tag-usage-modal-header { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--background-modifier-border); }
            .tag-usage-modal-title { margin: 0 0 6px; font-size: 1.25em; }
            .tag-usage-modal-subtitle { color: var(--text-muted); font-size: 12px; line-height: 1.6; }
            .tag-usage-modal-empty { padding: 18px; border: 1px dashed var(--background-modifier-border); border-radius: 12px; color: var(--text-muted); background: var(--background-secondary); }
            .tag-usage-modal-list { display: flex; flex-direction: column; gap: 8px; max-height: 58vh; overflow: auto; padding-right: 4px; }
            .tag-usage-modal-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; width: 100%; max-width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid var(--background-modifier-border); border-radius: 12px; background: var(--background-primary); color: var(--text-normal); cursor: pointer; text-align: left; }
            .tag-usage-modal-row:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .tag-usage-modal-row.is-disabled { opacity: 0.58; cursor: not-allowed; }
            .tag-usage-modal-row-main { min-width: 0; }
            .tag-usage-modal-project-name { font-weight: 900; font-size: 14px; margin-bottom: 4px; }
            .tag-usage-modal-project-reason { color: var(--text-muted); font-size: 12px; overflow-wrap: anywhere; white-space: normal; }
            .tag-usage-modal-project-action { flex-shrink: 0; color: var(--interactive-accent); font-weight: 800; font-size: 12px; }
            .tag-usage-modal-actions { display: flex; justify-content: flex-end; margin-top: 14px; }
            .tag-keyword-editor-card { margin-top: 14px; padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 12px; background: var(--background-secondary); }
            .tag-keyword-editor-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
            .tag-keyword-editor-title { font-weight: 800; color: var(--text-normal); }
            .tag-keyword-editor-hint { color: var(--text-muted); font-size: 12px; }
            .tag-keyword-editor-input { width: 100%; min-height: 96px; resize: vertical; box-sizing: border-box; padding: 10px 12px; line-height: 1.55; border-radius: 10px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); font-family: var(--font-interface); }
            .tag-keyword-editor-input:focus { outline: none; border-color: var(--interactive-accent); box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.12); }
            .tag-usage-project-card { margin: 12px 0 14px; padding: 14px; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; border: 2px solid rgba(var(--interactive-accent-rgb), 0.38); border-radius: 14px; background: linear-gradient(180deg, rgba(var(--interactive-accent-rgb), 0.13), var(--background-primary)); box-shadow: 0 8px 22px rgba(0,0,0,0.08); }
            .tag-usage-project-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
            .tag-usage-project-title { font-weight: 900; color: var(--text-normal); font-size: 14px; }
            .tag-usage-project-count { color: var(--text-muted); font-size: 12px; }
            .tag-usage-project-list { display: flex; flex-direction: column; gap: 6px; }
            .tag-usage-project-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px 12px; width: 100%; max-width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--background-modifier-border); border-radius: 10px; background: var(--background-primary); color: var(--text-normal); cursor: pointer; text-align: left; }
            .tag-usage-project-row:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .tag-usage-project-row.is-disabled { opacity: 0.58; cursor: not-allowed; }
            .tag-usage-project-name { flex: 1 1 260px; font-weight: 700; min-width: 0; overflow-wrap: anywhere; white-space: normal; }
            .tag-usage-project-meta { flex: 1 1 220px; min-width: 0; color: var(--text-muted); font-size: 12px; text-align: right; overflow-wrap: anywhere; white-space: normal; }
            .tag-usage-project-empty { color: var(--text-muted); font-size: 12px; padding: 4px 0; }
            .tag-preset-toolbar { display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
            .tag-preset-btn { padding: 2px 8px; border-radius: 10px; border: 1px solid var(--background-modifier-border); cursor: pointer; background: transparent; color: var(--text-normal); font-size: 11px; }
            .tag-preset-btn:hover { background: var(--background-modifier-hover); }
            .tag-preset-chip { padding: 2px 8px; border-radius: 10px; border: 1px solid var(--background-modifier-border); cursor: pointer; background: var(--background-secondary); color: var(--text-normal); font-size: 11px; }
            .tag-preset-chip.active { color: var(--text-on-accent); background: var(--interactive-accent); border-color: transparent; }
            .gtd-comment-chip { display: inline-flex; align-items: center; max-width: 360px; padding: 2px 8px; border: 1px solid var(--background-modifier-border); border-radius: 10px; font-size: 11px; color: var(--text-muted); background: var(--background-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: 8px; cursor: pointer; }
            .gtd-comment-chip:hover { color: var(--text-normal); border-color: var(--interactive-accent); }
            .gtd-bound-label { display: inline-flex; align-items: center; max-width: 300px; padding: 1px 7px; border: 1px solid var(--background-modifier-border); border-radius: 10px; font-size: 11px; color: var(--text-muted); background: var(--background-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: 8px; }
            .gtd-workspace-modal-desc { color: var(--text-muted); font-size: 12px; line-height: 1.6; }
            .gtd-workspace-modal-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
            .gtd-workspace-modal-input { width: 100%; padding: 8px 10px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-primary); color: var(--text-normal); }
            .gtd-workspace-comment-textarea { width: 100%; flex: 1; min-height: 420px; resize: none; padding: 12px; line-height: 1.6; border-radius: 8px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); }
            .gtd-workspace-comment-counter { text-align: right; color: var(--text-muted); font-size: 12px; }
            .gtd-note-picker-current { display: flex; flex-direction: column; gap: 6px; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 10px; background: var(--background-primary); }
            .gtd-note-picker-list { flex: 1; min-height: 0; overflow: auto; border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 8px; background: var(--background-primary-alt); }
            .gtd-note-picker-row { cursor: pointer; margin-bottom: 6px; padding: 8px 10px; border: 1px solid var(--background-modifier-border); border-radius: 10px; background: var(--background-primary); }
            .gtd-note-picker-row.is-active, .gtd-note-picker-row:hover { border-color: var(--interactive-accent); background: var(--background-modifier-hover); }
            .gtd-note-picker-label { font-weight: 700; word-break: break-word; }
            .gtd-note-picker-path { font-size: 12px; color: var(--text-muted); word-break: break-all; }
            .gtd-note-picker-empty { padding: 12px; color: var(--text-muted); text-align: center; }
            .gtd-comment-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35); z-index: 9998; }
            .gtd-comment-drawer { position: fixed; right: 0; top: 0; width: min(760px, 92vw); height: 100vh; background: var(--background-primary); border-left: 1px solid var(--background-modifier-border); box-shadow: -8px 0 24px rgba(0, 0, 0, 0.22); z-index: 9999; display: flex; flex-direction: column; }
            .gtd-comment-drawer-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; padding: 14px 16px 10px; border-bottom: 1px solid var(--background-modifier-border); }
            .gtd-comment-drawer-title { margin: 0; font-size: 1em; color: var(--text-normal); }
            .gtd-comment-drawer-sub { margin-top: 3px; color: var(--text-muted); font-size: 12px; }
            .gtd-comment-drawer-close { border: 1px solid var(--background-modifier-border); background: transparent; color: var(--text-muted); border-radius: 6px; cursor: pointer; padding: 2px 8px; }
            .gtd-comment-drawer-close:hover { color: var(--text-normal); border-color: var(--interactive-accent); }
            .gtd-comment-tabs { display: flex; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--background-modifier-border); }
            .gtd-comment-tab-btn { border: 1px solid var(--background-modifier-border); background: transparent; color: var(--text-muted); border-radius: 999px; padding: 3px 10px; cursor: pointer; font-size: 12px; }
            .gtd-comment-tab-btn.active { color: var(--text-on-accent); background: var(--interactive-accent); border-color: transparent; }
            .gtd-comment-drawer-body { padding: 12px 16px; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
            .gtd-comment-outliner-panel { display: none; flex-direction: column; gap: 10px; border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 12px; background: var(--background-primary-alt); }
            .gtd-comment-outliner-row { display: flex; flex-wrap: wrap; gap: 8px; }
            .gtd-comment-editor { width: 100%; min-height: 220px; flex: 1; resize: vertical; border-radius: 8px; border: 1px solid var(--background-modifier-border); background: var(--background-primary-alt); color: var(--text-normal); padding: 10px 12px; line-height: 1.6; font-family: var(--font-text); }
            .gtd-comment-editor:focus { outline: none; border-color: var(--interactive-accent); }
            .gtd-comment-counter { text-align: right; color: var(--text-muted); font-size: 12px; }
            .gtd-comment-preview-wrap { flex: 1; min-height: 0; overflow: auto; border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 12px; background: var(--background-primary-alt); }
            .gtd-comment-preview-wrap .internal-link { cursor: pointer; }
            .gtd-comment-drawer-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; padding: 10px 16px 14px; border-top: 1px solid var(--background-modifier-border); }
            .gtd-comment-drawer-btn { border: 1px solid var(--background-modifier-border); background: transparent; color: var(--text-normal); border-radius: 8px; cursor: pointer; padding: 6px 12px; }
            .gtd-comment-drawer-btn.save { background: var(--interactive-accent); color: var(--text-on-accent); border-color: transparent; }
            .gtd-comment-drawer-btn:hover { filter: brightness(1.03); }
            @media (max-width: 768px) {
                .gtd-comment-drawer { width: 100vw; }
            }
        `});

        const topAnchor = createRootEl("div", "", { attr: { id: "gtd-top-anchor", style: "height:0;" } });

        const controlContainer = createRootEl("div", "", { attr: { style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;" } });
        const leftBtns = controlContainer.createEl("div");
        const createMainBtn = (text, onClick, style = btnStyle) => { const btn = leftBtns.createEl("button", { text: text, attr: { style: style } }); btn.onclick = onClick; return btn; };
        createMainBtn("📥 添加到工作篮", () => addNewItem('inbox')); createMainBtn("📂 创建新项目", () => addNewItem('project')); createMainBtn("⚡ 添加下一步行动", () => addNewItem('next_action'));
        
        const kaioBtnStyle = "background-color: #c0392b; color: white; padding: 6px 16px; font-weight: bold; cursor: pointer; border-radius: 6px; border: none; font-size: 13px; margin-right: 10px; box-shadow: 0 0 10px rgba(192, 57, 43, 0.4); animation: pulse 2s infinite;";
        controlContainer.createEl("style", { text: "@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(192, 57, 43, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(192, 57, 43, 0); } 100% { box-shadow: 0 0 0 0 rgba(192, 57, 43, 0); } }" });
        createMainBtn("🔥 界王拳模式", () => { ui.gtdKaioKenMode = true; if(renderViewFn) renderViewFn(); }, kaioBtnStyle);

        const tagMgrBtnStyle = "background-color: #9b59b6; color: white; padding: 6px 16px; font-weight: bold; cursor: pointer; border-radius: 6px; border: none; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
        createMainBtn("🏷️ 标签管理", () => { ui.gtdTagManagerMode = true; if(renderViewFn) renderViewFn(); }, tagMgrBtnStyle);

        const rightBtns = controlContainer.createEl("div", { attr: { style: "display:flex; flex-direction:column; align-items:stretch; gap:8px; flex:1 1 100%; width:100%;" } });
        
        const mainFilterRow = rightBtns.createEl("div", { attr: { style: "display:flex; gap:8px;" } });
        const toggleFirstBtn = mainFilterRow.createEl("button", { text: ui.gtdShowOnlyFirstClass ? "⭐ 只看精选" : "👁️ 显示全部", attr: { style: `padding: 6px 12px; border-radius: 6px; border: 1px solid var(--text-muted); cursor: pointer; background: ${ui.gtdShowOnlyFirstClass ? 'var(--background-modifier-active-hover)' : 'transparent'}; color: var(--text-normal);` } });
        toggleFirstBtn.onclick = () => { ui.gtdShowOnlyFirstClass = !ui.gtdShowOnlyFirstClass; ui.gtdRecentIds = []; if(renderViewFn) renderViewFn(); };
        const toggleFocusBtn = mainFilterRow.createEl("button", { text: ui.gtdShowOnlyFocus ? "🎯 本次执行" : "🎯 加入执行", attr: { style: `padding: 6px 12px; border-radius: 6px; border: 1px solid var(--text-muted); cursor: pointer; background: ${ui.gtdShowOnlyFocus ? '#e91e63' : 'transparent'}; color: ${ui.gtdShowOnlyFocus ? 'white' : 'var(--text-normal)'};` } });
        toggleFocusBtn.onclick = (e) => { ui.gtdShowOnlyFocus = !ui.gtdShowOnlyFocus; ui.gtdRecentIds = []; if(renderViewFn) renderViewFn(); };

        const tagKeywordIndex = rightBtns.createEl("div", { cls: "tag-filter-keyword-index" });
        const tagKeywordTitle = tagKeywordIndex.createEl("span", { cls: "tag-filter-keyword-title", text: "标签关键词" });
        tagKeywordTitle.title = "点击关键词后滚动到对应标签胶囊";
        const tagKeywordEntries = buildTagKeywordEntries();
        const tagFilterContextCapsuleKeyLookup = buildContextCapsuleKeyLookup();
        const virtualTagContextKeys = getVirtualContextCapsuleKeysForTagKeywords(tagKeywordEntries, tagFilterContextCapsuleKeyLookup);
        const archivedVirtualTagContextKeys = virtualTagContextKeys.filter((key) => isStoppedContextKeyword(key?.displayLabel));
        const visibleVirtualTagContextKeys = virtualTagContextKeys.filter((key) => !isStoppedContextKeyword(key?.displayLabel));
        const archivedTagKeywordEntries = tagKeywordEntries.filter((entry) => isStoppedContextKeyword(entry?.keyword));
        const visibleTagKeywordEntries = tagKeywordEntries.filter((entry) => !isStoppedContextKeyword(entry?.keyword));
        if (tagKeywordEntries.length === 0 && virtualTagContextKeys.length === 0) {
            tagKeywordIndex.createEl("span", { cls: "tag-filter-keyword-empty", text: "暂无关键词" });
        } else {
            const visibleTagContextRows = [
                ...visibleTagKeywordEntries.map((entry) => ({ kind: "bound", entry, sortLabel: getContextCapsuleSortLabel(entry.keyword) })),
                ...visibleVirtualTagContextKeys.map((key) => ({ kind: "virtual", key, sortLabel: getContextCapsuleSortLabel(key.displayLabel) })),
            ].sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, "zh-CN", { numeric: true, sensitivity: "base" }));
            visibleTagContextRows.forEach((rowItem) => {
                if (rowItem.kind === "virtual") {
                    const key = rowItem.key;
                    const chip = tagKeywordIndex.createEl("button", {
                        cls: "tag-filter-keyword-chip context-capsule-virtual-chip",
                        attr: { type: "button", title: `${key.displayLabel} · 虚位以待，尚未绑定 GTD 标签` },
                    });
                    if (key.color) chip.style.setProperty("--gtd-context-capsule-color", key.color);
                    chip.dataset.contextKeyId = key.contextKeyId;
                    chip.createEl("span", { text: key.displayLabel });
                    chip.createEl("span", { cls: "tag-filter-keyword-context-badge", text: "虚位" });
                    chip.onclick = () => new Notice(`操作上下文主键尚未绑定 GTD 标签：${key.displayLabel}`);
                    return;
                }
                const entry = rowItem.entry;
                const def = TAG_DEFINITIONS[entry.tagId];
                const matchedContextKey = getContextCapsuleKeyForKeyword(entry.keyword, tagFilterContextCapsuleKeyLookup);
                const chip = tagKeywordIndex.createEl("button", {
                    cls: `tag-filter-keyword-chip${matchedContextKey ? " is-context-capsule-synced" : " is-context-capsule-local-only"}`,
                    attr: { type: "button", title: `${def?.icon || "🏷️"} ${def?.label || entry.tagId}` },
                });
                if (matchedContextKey?.contextKeyId) chip.dataset.contextKeyId = matchedContextKey.contextKeyId;
                if (matchedContextKey?.color) chip.style.setProperty("--gtd-context-capsule-color", matchedContextKey.color);
                chip.createEl("span", { text: entry.keyword });
                if (matchedContextKey) chip.createEl("span", { cls: "tag-filter-keyword-context-badge", text: "同步" });
                else chip.createEl("span", { cls: "tag-filter-keyword-context-badge", text: "本地" });
                chip.onclick = () => revealTagFilterCapsuleAfterRender(entry.tagId);
            });
            const archivedTagContextRows = [
                ...archivedTagKeywordEntries.map((entry) => ({ kind: "bound", entry, sortLabel: getContextCapsuleSortLabel(entry.keyword) })),
                ...archivedVirtualTagContextKeys.map((key) => ({ kind: "virtual", key, sortLabel: getContextCapsuleSortLabel(key.displayLabel) })),
            ].sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, "zh-CN", { numeric: true, sensitivity: "base" }));
            if (archivedTagContextRows.length > 0) {
                const archiveToggle = tagKeywordIndex.createEl("button", {
                    cls: `tag-filter-keyword-chip tag-filter-keyword-archive-toggle${ui.gtdTagKeywordArchiveExpanded ? " is-expanded" : ""}`,
                    text: `已停止追踪 ${archivedTagContextRows.length}`,
                    attr: {
                        type: "button",
                        title: ui.gtdTagKeywordArchiveExpanded ? "收起 已停止追踪的主键" : "展开 已停止追踪的主键"
                    }
                });
                archiveToggle.onclick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    ui.gtdTagKeywordArchiveExpanded = !ui.gtdTagKeywordArchiveExpanded;
                    if (renderViewFn) renderViewFn();
                };
                if (ui.gtdTagKeywordArchiveExpanded) {
                    const archiveSection = tagKeywordIndex.createDiv({ cls: "tag-filter-keyword-archive-section" });
                    archiveSection.createDiv({ cls: "tag-filter-keyword-archive-title", text: "已停止追踪的主键" });
                    const archiveRow = archiveSection.createDiv({ cls: "tag-filter-keyword-index-row" });
                    archivedTagContextRows.forEach((rowItem) => {
                        if (rowItem.kind === "virtual") {
                            const key = rowItem.key;
                            const chip = archiveRow.createEl("button", {
                                cls: "tag-filter-keyword-chip is-archived-keyword context-capsule-virtual-chip",
                                attr: { type: "button", title: `${key.displayLabel} · 虚位以待，尚未绑定 GTD 标签` },
                            });
                            if (key.color) chip.style.setProperty("--gtd-context-capsule-color", key.color);
                            chip.dataset.contextKeyId = key.contextKeyId;
                            chip.createEl("span", { text: key.displayLabel });
                            chip.createEl("span", { cls: "tag-filter-keyword-context-badge", text: "虚位" });
                            chip.onclick = () => new Notice(`操作上下文主键尚未绑定 GTD 标签：${key.displayLabel}`);
                            return;
                        }
                        const entry = rowItem.entry;
                        const def = TAG_DEFINITIONS[entry.tagId];
                        const matchedContextKey = getContextCapsuleKeyForKeyword(entry.keyword, tagFilterContextCapsuleKeyLookup);
                        const chip = archiveRow.createEl("button", {
                            cls: `tag-filter-keyword-chip is-archived-keyword${matchedContextKey ? " is-context-capsule-synced" : " is-context-capsule-local-only"}`,
                            attr: { type: "button", title: `${def?.icon || "🏷️"} ${def?.label || entry.tagId}` },
                        });
                        if (matchedContextKey?.contextKeyId) chip.dataset.contextKeyId = matchedContextKey.contextKeyId;
                        if (matchedContextKey?.color) chip.style.setProperty("--gtd-context-capsule-color", matchedContextKey.color);
                        chip.createEl("span", { text: entry.keyword });
                        if (matchedContextKey) chip.createEl("span", { cls: "tag-filter-keyword-context-badge", text: "同步" });
                        else chip.createEl("span", { cls: "tag-filter-keyword-context-badge", text: "本地" });
                        chip.onclick = () => openContextHistory("", entry.tagId);
                    });
                }
            }
        }

        const tagFilterRow = rightBtns.createEl("div", { attr: { style: "display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; align-items:flex-start;" } });

        const clearTagDragClasses = (el) => {
            if (!el) return;
            el.classList.remove("dragging", "drag-over-before", "drag-over-after", "drag-over-child");
        };
        const getTagDropPosition = (targetEl, event) => {
            const rect = targetEl.getBoundingClientRect();
            const xRatio = (event.clientX - rect.left) / Math.max(rect.width, 1);
            if (xRatio > 0.72) return "child";
            return (event.clientY - rect.top) < rect.height / 2 ? "before" : "after";
        };
        const applyTagDragClasses = (targetEl, position) => {
            clearTagDragClasses(targetEl);
            if (position === "before") targetEl.classList.add("drag-over-before");
            else if (position === "after") targetEl.classList.add("drag-over-after");
            else if (position === "child") targetEl.classList.add("drag-over-child");
        };
        const bindHomepageTagDrag = (targetEl, tagId) => {
            targetEl.classList.add("tag-filter-drop-target");
            targetEl.setAttribute("draggable", "true");
            targetEl.addEventListener("dragstart", (e) => {
                if (e.target?.closest?.(".tag-filter-icon-btn")) {
                    e.preventDefault();
                    return;
                }
                ui.gtdCurrentDragTagId = tagId;
                targetEl.classList.add("dragging");
                if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
            });
            targetEl.addEventListener("dragend", () => {
                ui.gtdCurrentDragTagId = null;
                clearTagDragClasses(targetEl);
            });
            targetEl.addEventListener("dragover", (e) => {
                const draggedId = ui.gtdCurrentDragTagId;
                if (!draggedId || draggedId === tagId) return;
                e.preventDefault();
                applyTagDragClasses(targetEl, getTagDropPosition(targetEl, e));
            });
            targetEl.addEventListener("dragleave", () => clearTagDragClasses(targetEl));
            targetEl.addEventListener("drop", async (e) => {
                const draggedId = ui.gtdCurrentDragTagId;
                clearTagDragClasses(targetEl);
                if (!draggedId || draggedId === tagId) return;
                e.preventDefault();
                e.stopPropagation();
                await moveTagDefinition(draggedId, tagId, getTagDropPosition(targetEl, e));
            });
        };

        const allTagBtn = tagFilterRow.createEl("div", { cls: `tag-filter-btn ${(ui.gtdTagFilters || []).length === 0 ? 'active' : ''}`, text: "All" });
        if ((ui.gtdTagFilters || []).length === 0) allTagBtn.style.background = "var(--interactive-normal)";
        allTagBtn.onclick = () => { setTagFilters([]); if(renderViewFn) renderViewFn(); };

        const topDropZone = tagFilterRow.createEl("div", { cls: "tag-filter-drop-root tag-filter-drop-target", text: "↖ 顶层" });
        topDropZone.title = "把标签拖到这里可恢复为顶层";
        topDropZone.addEventListener("dragover", (e) => {
            const draggedId = ui.gtdCurrentDragTagId;
            if (!draggedId || !TAG_DEFINITIONS[draggedId]) return;
            e.preventDefault();
            topDropZone.classList.add("drag-over-child");
        });
        topDropZone.addEventListener("dragleave", () => clearTagDragClasses(topDropZone));
        topDropZone.addEventListener("drop", async (e) => {
            const draggedId = ui.gtdCurrentDragTagId;
            clearTagDragClasses(topDropZone);
            if (!draggedId || !TAG_DEFINITIONS[draggedId]) return;
            e.preventDefault();
            await moveTagDefinition(draggedId, null, "after");
        });

        const addTagBtn = tagFilterRow.createEl("button", { cls: "tag-filter-icon-btn", text: "＋" });
        addTagBtn.title = "直接新增顶层标签";
        addTagBtn.dataset.gtdTagConfigButton = "homepage-add-root";
        addTagBtn.onclick = () => {
            logGtdPluginDiag("homepage-add-root-tag-click", {
                tagId: null,
                buttonText: addTagBtn.textContent || ""
            });
            openTagDefinitionModal(null, null, false);
        };

        const toggleTagFilter = (id) => {
            const nextFilters = Array.isArray(ui.gtdTagFilters) ? [...ui.gtdTagFilters] : [];
            if (nextFilters.includes(id)) {
                setTagFilters(nextFilters.filter(t => t !== id));
            } else {
                nextFilters.push(id);
                setTagFilters(nextFilters);
            }
            if(renderViewFn) renderViewFn();
        };
        const isTagBranchExpanded = (id) => {
            const stored = ui.gtdTagFilterExpanded?.[id];
            return stored !== false;
        };
        const toggleTagBranchExpanded = (id) => {
            const nextState = {
                ...(ui.gtdTagFilterExpanded && typeof ui.gtdTagFilterExpanded === "object" ? ui.gtdTagFilterExpanded : {}),
                [id]: !isTagBranchExpanded(id)
            };
            setTagFilterExpandedState(nextState);
            if (renderViewFn) renderViewFn();
        };

        // [优化] 嵌套层级标签筛选器：有子标签的都展开到下一行显示
        const revealTagFilterCapsule = (tagId) => {
            const target = Array.from(tagFilterRow.querySelectorAll(".tag-category-header, .tag-filter-node"))
                .find((el) => el?.dataset?.tagId === tagId);
            if (!target) {
                console.log("[GTD][tag-keywords][capsule-reveal]", { status: "MISS", tagId });
                return false;
            }
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.classList.add("is-keyword-focus");
            window.setTimeout(() => target.classList.remove("is-keyword-focus"), 1800);
            console.log("[GTD][tag-keywords][capsule-reveal]", { status: "OK", tagId });
            return true;
        };
        const revealTagFilterCapsuleAfterRender = (tagId) => {
            window.gtdPendingTagKeywordReveal = tagId;
            const nextState = {
                ...(ui.gtdTagFilterExpanded && typeof ui.gtdTagFilterExpanded === "object" ? ui.gtdTagFilterExpanded : {})
            };
            getAncestorTagIds(tagId).forEach((ancestorId) => {
                nextState[ancestorId] = true;
            });
            setTagFilterExpandedState(nextState);
            if (renderViewFn) renderViewFn();
        };
        renderStoppedContextTags(tagFilterRow);
        const renderNestedTagFilter = (parentId, container) => {
            const children = getSortedChildTags(parentId);
            if (children.length === 0) return;

            children.forEach(key => {
                if (isStoppedContextTag(key)) { renderNestedTagFilter(key, container); return; }
                const def = TAG_DEFINITIONS[key];
                const isActive = (ui.gtdTagFilters || []).includes(key);
                const subChildren = getSortedChildTags(key);
                const hasSubChildren = subChildren.length > 0;

                if (hasSubChildren) {
                    const isExpanded = isTagBranchExpanded(key);
                    const groupWrapper = container.createEl("div", { cls: `tag-category-group ${isActive ? "active" : ""}` });
                    groupWrapper.dataset.tagId = key;
                    groupWrapper.style.borderColor = def.color;

                    const headerRow = groupWrapper.createEl("div", { cls: `tag-category-header tag-filter-drop-target ${isActive ? "active" : ""}` });
                    headerRow.dataset.tagId = key;
                    bindHomepageTagDrag(headerRow, key);
                    const foldToggle = headerRow.createEl("span", { cls: "tag-filter-fold-toggle", text: isExpanded ? "▼" : "▶" });
                    foldToggle.title = isExpanded ? "收起子标签" : "展开子标签";
                    foldToggle.onclick = (e) => {
                        e.stopPropagation();
                        toggleTagBranchExpanded(key);
                    };
                    const iconBtn = headerRow.createEl("button", { cls: "tag-filter-icon-btn", text: def.icon || "🏷️" });
                    iconBtn.title = `管理「${def.label}」`;
                    iconBtn.dataset.gtdTagConfigButton = "homepage-parent";
                    iconBtn.dataset.tagId = key;
                    iconBtn.setAttribute("draggable", "false");
                    if (isActive) {
                        iconBtn.style.backgroundColor = def.color;
                        iconBtn.style.color = "white";
                    }
                    iconBtn.onclick = (e) => {
                        e.stopPropagation();
                        logGtdPluginDiag("homepage-tag-config-click", {
                            source: "parent",
                            tagId: key,
                            tagLabel: def.label,
                            buttonTitle: iconBtn.title
                        });
                        openTagDefinitionModal(key);
                    };
                    const parentLabel = headerRow.createEl("span", {
                        text: def.label,
                        cls: `tag-category-label ${isActive ? 'active' : ''}`,
                        attr: { title: def.isCategory
                            ? `📁 分类：点击筛选「${def.label}」下所有子标签`
                            : `🏷️ 标签：点击筛选「${def.label}」及其子标签` }
                    });
                    if (isActive) parentLabel.style.backgroundColor = def.color;
                    parentLabel.onclick = () => toggleTagFilter(key);

                    const childContainer = groupWrapper.createEl("div", { cls: "tag-children-group" });
                    childContainer.style.borderColor = def.color + "80";
                    if (isExpanded) renderNestedTagFilter(key, childContainer);
                    else childContainer.style.display = "none";
                } else {
                    const node = container.createEl("div", { cls: `tag-filter-node tag-filter-drop-target ${isActive ? "active" : ""}` });
                    node.dataset.tagId = key;
                    bindHomepageTagDrag(node, key);
                    const iconBtn = node.createEl("button", { cls: "tag-filter-icon-btn", text: def.icon || "🏷️" });
                    iconBtn.title = `管理「${def.label}」`;
                    iconBtn.dataset.gtdTagConfigButton = "homepage-leaf";
                    iconBtn.dataset.tagId = key;
                    iconBtn.setAttribute("draggable", "false");
                    if (isActive) {
                        iconBtn.style.backgroundColor = def.color;
                        iconBtn.style.color = "white";
                    }
                    iconBtn.onclick = (e) => {
                        e.stopPropagation();
                        logGtdPluginDiag("homepage-tag-config-click", {
                            source: "leaf",
                            tagId: key,
                            tagLabel: def.label,
                            buttonTitle: iconBtn.title
                        });
                        openTagDefinitionModal(key);
                    };
                    const btn = node.createEl("div", { cls: `tag-filter-btn ${isActive ? 'active' : ''}` });
                    btn.innerHTML = `<span class="tag-filter-label-text">${def.label}</span>`;
                    if (isActive) btn.style.backgroundColor = def.color;
                    btn.onclick = () => toggleTagFilter(key);
                }
            });
        };
        renderNestedTagFilter(null, tagFilterRow);
        if (window.gtdPendingTagKeywordReveal) {
            const pendingTagId = window.gtdPendingTagKeywordReveal;
            window.gtdPendingTagKeywordReveal = null;
            window.requestAnimationFrame(() => revealTagFilterCapsule(pendingTagId));
        }

        const activeTagChipRow = rightBtns.createEl("div", { attr: { style: "display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end;" } });
        if (!ui.gtdTagFilters || ui.gtdTagFilters.length === 0) {
            activeTagChipRow.createEl("span", { text: "✓ 显示全部标签", attr: { style: "color:var(--text-muted); font-size:12px;" } });
        } else {
            const clearBtn = activeTagChipRow.createEl("button", {
                text: "清空标签",
                attr: { style: "padding:2px 8px; border-radius:10px; border:1px solid var(--background-modifier-border); cursor:pointer; background:transparent; color:var(--text-normal); font-size:11px;" }
            });
            clearBtn.onclick = () => { setTagFilters([]); if(renderViewFn) renderViewFn(); };
            ui.gtdTagFilters.forEach(id => {
                const def = TAG_DEFINITIONS[id];
                const chip = activeTagChipRow.createEl("span", { text: def ? `${def.icon} ${def.label}` : id, attr: { style: `padding:2px 8px; border-radius:10px; color:white; background:${def?.color || "var(--background-modifier-border)"}; font-size:11px; cursor:pointer;` } });
                chip.onclick = () => toggleTagFilter(id);
            });
        }

        const tagPresetToolbar = rightBtns.createEl("div", { cls: "tag-preset-toolbar" });
        const currentPreset = (window.gtdTagFilterPresets || []).find((preset) => isSameFilterSet(preset.filters, ui.gtdTagFilters || []));
        const savePresetBtn = tagPresetToolbar.createEl("button", { cls: "tag-preset-btn", text: "💾 保存筛选" });
        savePresetBtn.onclick = async () => {
            const currentFilters = normalizeTagFilterList(ui.gtdTagFilters || []);
            if (currentFilters.length === 0) {
                new Notice("⚠️ 请先选择至少一个标签再保存预设");
                return;
            }
            const defaultName = currentPreset?.name || `筛选-${moment().format("MMDD-HHmm")}`;
            const inputName = await prompt("保存标签筛选预设", "请输入预设名称", defaultName);
            const name = normalizeTagPresetName(inputName);
            if (!name) {
                new Notice("⚠️ 请输入有效名称");
                return;
            }
            const nextPresets = Array.isArray(window.gtdTagFilterPresets) ? [...window.gtdTagFilterPresets] : [];
            const existingIndex = nextPresets.findIndex((preset) => preset.name === name);
            const now = moment().format("YYYY-MM-DD HH:mm:ss");
            const payload = {
                name,
                filters: currentFilters,
                createdAt: existingIndex >= 0
                    ? nextPresets[existingIndex]?.createdAt || nextPresets[existingIndex]?.updatedAt || now
                    : now,
                updatedAt: now
            };
            if (existingIndex >= 0) {
                nextPresets[existingIndex] = payload;
                new Notice(`♻️ 已更新筛选预设：${name}`);
            } else {
                nextPresets.push(payload);
                new Notice(`✅ 已保存筛选预设：${name}`);
            }
            setTagFilterPresets(nextPresets);
            if (renderViewFn) renderViewFn();
        };
        const applyPresetBtn = tagPresetToolbar.createEl("button", { cls: "tag-preset-btn", text: "📚 读取预设" });
        applyPresetBtn.onclick = async () => {
            const presets = Array.isArray(window.gtdTagFilterPresets) ? window.gtdTagFilterPresets : [];
            if (presets.length === 0) {
                new Notice("ℹ️ 还没有标签筛选预设");
                return;
            }
            const options = presets.map((preset, idx) => `${idx + 1}. ${preset.name} ｜ ${getTagPresetSummaryText(preset.filters)}`);
            const picked = await suggester(options);
            if (!picked) return;
            const match = picked.match(/^(\d+)\./);
            const idx = match ? Number(match[1]) - 1 : -1;
            const selected = idx >= 0 && idx < presets.length ? presets[idx] : null;
            if (!selected) return;
            setTagFilters(selected.filters);
            ui.gtdRecentIds = [];
            new Notice(`🎯 已应用预设：${selected.name}`);
            if (renderViewFn) renderViewFn();
        };
        const deletePresetBtn = tagPresetToolbar.createEl("button", { cls: "tag-preset-btn", text: "🗑️ 删除预设" });
        deletePresetBtn.onclick = async () => {
            const presets = Array.isArray(window.gtdTagFilterPresets) ? window.gtdTagFilterPresets : [];
            if (presets.length === 0) {
                new Notice("ℹ️ 没有可删除的预设");
                return;
            }
            const options = presets.map((preset, idx) => `${idx + 1}. ${preset.name}`);
            const picked = await suggester(options);
            if (!picked) return;
            const match = picked.match(/^(\d+)\./);
            const idx = match ? Number(match[1]) - 1 : -1;
            const selected = idx >= 0 && idx < presets.length ? presets[idx] : null;
            if (!selected) return;
            setTagFilterPresets(presets.filter((preset) => preset.name !== selected.name));
            new Notice(`🗑️ 已删除预设：${selected.name}`);
            if (renderViewFn) renderViewFn();
        };

        const tagPresetRow = rightBtns.createEl("div", { attr: { style: "display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end;" } });
        if (!window.gtdTagFilterPresets || window.gtdTagFilterPresets.length === 0) {
            tagPresetRow.createEl("span", { text: "暂无筛选预设", attr: { style: "color:var(--text-muted); font-size:12px;" } });
        } else {
            window.gtdTagFilterPresets.forEach((preset) => {
                const chip = tagPresetRow.createEl("button", {
                    cls: `tag-preset-chip ${isSameFilterSet(preset.filters, ui.gtdTagFilters || []) ? 'active' : ''}`,
                    text: `📌 ${preset.name}`
                });
                chip.title = getTagPresetSummaryText(preset.filters);
                chip.onclick = () => {
                    setTagFilters(preset.filters);
                    ui.gtdRecentIds = [];
                    if (renderViewFn) renderViewFn();
                };
            });
        }

        const filterFn = (item) => {
            let visible = true;
            if (ui.gtdShowOnlyFirstClass && item.isFirstClass !== true && !ui.gtdRecentIds.includes(item.id)) visible = false;
            return visible;
        };

        const renderCommentDrawer = () => {
        if(context.canLeaveInput && !context.canLeaveInput())return false;
            container.querySelectorAll(".gtd-comment-mask, .gtd-comment-drawer").forEach((el) => {
                try { el.remove(); } catch (e) {}
            });
            const state = ui.gtdCommentDrawerState || {};
            if (!state.isOpen || !state.itemId) return;

            const item = getItemById(state.itemId);
            if (!item) {
                ui.gtdCommentDrawerState = { isOpen: false, itemId: null, mode: "preview", draft: "" };
                disposeCommentPreviewComponent();
                return;
            }

            let mode = normalizeCommentDrawerMode(state.mode);
            let draft = typeof state.draft === "string" ? state.draft : getItemCommentText(item);

            const syncDrawerState = () => {
                ui.gtdCommentDrawerState = { isOpen: true, itemId: item.id, mode, draft };
            };
            syncDrawerState();

            const mask = container.createEl("div", { cls: "gtd-comment-mask" });
            const drawer = container.createEl("aside", { cls: "gtd-comment-drawer" });
            mask.onclick = async () => { await closeCommentDrawer(true); };
            drawer.addEventListener("click", (e) => e.stopPropagation());

            const header = drawer.createEl("div", { cls: "gtd-comment-drawer-header" });
            const titleWrap = header.createEl("div");
            titleWrap.createEl("h3", { cls: "gtd-comment-drawer-title", text: `🗒️ 条目评论：${getDisplayName(item)}` });
            titleWrap.createEl("div", { cls: "gtd-comment-drawer-sub", text: "默认先预览；支持 ((blockId))，会自动按当前笔记解析并跳转编辑。" });
            const closeBtn = header.createEl("button", { cls: "gtd-comment-drawer-close", text: "关闭" });
            closeBtn.onclick = async () => { await closeCommentDrawer(true); };

            const tabs = drawer.createEl("div", { cls: "gtd-comment-tabs" });
            const previewTabBtn = tabs.createEl("button", { cls: "gtd-comment-tab-btn", text: "预览" });
            const outlinerTabBtn = tabs.createEl("button", { cls: "gtd-comment-tab-btn", text: "引用块编辑" });
            const rawTabBtn = tabs.createEl("button", { cls: "gtd-comment-tab-btn", text: "源码兜底" });

            const body = drawer.createEl("div", { cls: "gtd-comment-drawer-body" });
            const outlinerPanel = body.createEl("div", { cls: "gtd-comment-outliner-panel" });
            outlinerPanel.createEl("div", {
                text: "识别 ![[文件|o-id]] / ![[#^...]] / ((blockId)) / %%id%%...%%id%%，点击后跳转到原块。",
                attr: { style: "color:var(--text-muted);font-size:12px;line-height:1.6;" }
            });
            const outlinerRow = outlinerPanel.createEl("div", { cls: "gtd-comment-outliner-row" });
            const outlinerEmbedBtn = outlinerRow.createEl("button", { cls: "gtd-comment-drawer-btn", text: "跳转编辑引用块" });

            const editor = body.createEl("textarea", { cls: "gtd-comment-editor", text: draft });
            editor.placeholder = "记录想法、上下文；支持 ![[文件|o-id]]、![[文件#^块]]、((块ID))、%%id%%...%%id%%";
            const counter = body.createEl("div", { cls: "gtd-comment-counter", text: `${draft.length} 字` });
            const previewWrap = body.createEl("div", { cls: "gtd-comment-preview-wrap" });

            commentEditorLease?.close();
            ui.gtdCommentBaseline={id:item.id,type:item.type,comment:getItemCommentText(item)};
            const lease=tracking.registerEditor(drawer,{inputs:[editor],controls:[mask,closeBtn,rawTabBtn,previewTabBtn,outlinerTabBtn],
                targetLive:()=>ui.gtdCommentDrawerState.itemId===item.id});
            commentEditorLease=lease;
            const refreshPreview = async () => {
                await renderMarkdownInContainer(draft, previewWrap);
            };

            const refreshModeUI = async () => {
                outlinerTabBtn.classList.toggle("active", mode === "embed");
                rawTabBtn.classList.toggle("active", mode === "raw");
                previewTabBtn.classList.toggle("active", mode === "preview");
                outlinerPanel.style.display = mode === "embed" ? "flex" : "none";
                editor.style.display = mode === "raw" ? "block" : "none";
                counter.style.display = mode === "raw" ? "block" : "none";
                previewWrap.style.display = mode === "preview" ? "block" : "none";
                if (mode === "preview") await refreshPreview();
                else disposeCommentPreviewComponent();
            };

            editor.addEventListener("input", () => {
                if(!lease.live()||lease.busy)return;
                draft = editor.value;
                counter.textContent = `${draft.length} 字`;
                syncDrawerState();
            });
            outlinerEmbedBtn.onclick = async () => {
                const targets = extractEmbedTargets(draft);
                if (targets.length === 0) {
                    new Notice("ℹ️ 当前评论未检测到可跳转引用（![[...]] / ((...)) / %%...%%）");
                    return;
                }
                let selected = targets[0];
                if (targets.length > 1) {
                    const options = targets.map((t, idx) => `${idx + 1}. ${t}`);
                    const picked = await suggester(options);
                    if (!picked) return;
                    const m = picked.match(/^\d+\.\s*(.+)$/);
                    selected = m ? m[1].trim() : picked.trim();
                }
                if (!selected || !lease.live()) return;
                await openLinkForEditing(selected);
            };
            outlinerTabBtn.onclick = async () => {
                mode = "embed";
                syncDrawerState();
                await refreshModeUI();
            };
            rawTabBtn.onclick = async () => {
                mode = "raw";
                syncDrawerState();
                await refreshModeUI();
                if(lease.live()&&mode==="raw")editor.focus();
            };
            previewTabBtn.onclick = async () => {
                mode = "preview";
                syncDrawerState();
                await refreshModeUI();
            };

            const actions = drawer.createEl("div", { cls: "gtd-comment-drawer-actions" });
            const clearBtn = actions.createEl("button", { cls: "gtd-comment-drawer-btn", text: "清空" });
            const saveBtn = actions.createEl('button',{cls:'gtd-comment-drawer-btn save',text:'保存评论'});
            lease.allow([clearBtn,saveBtn]);
            const saveDraft=async clear=>{
                try{return await lease.save(async live=>{
                    const text=clear?'':draft;
                    await saveItemCommentById(item.id,text);
                    if(!live())return false;
                    if(clear){draft='';editor.value='';counter.textContent='0 字';syncDrawerState();if(mode==='preview')await refreshPreview();}
                    if(live())new Notice(clear?'评论已清空':'评论已保存');return true;
                });}catch(error){new Notice('评论未保存，输入仍保留，请重试。');return false;}
            };
            clearBtn.onclick=()=>saveDraft(true);
            saveBtn.onclick=()=>saveDraft(false);

            if (mode === "raw") {
                editor.focus();
                editor.selectionStart = editor.value.length;
                editor.selectionEnd = editor.value.length;
            }
            void refreshModeUI().catch(()=>{if(lease.live())new Notice("预览未完成，源码仍保留。");});
        };

        const getProjectLevelBackground = (level) => {
            const palette = [
                "rgba(52, 152, 219, 0.06)",
                "rgba(46, 204, 113, 0.08)",
                "rgba(241, 196, 15, 0.09)",
                "rgba(230, 126, 34, 0.09)",
                "rgba(231, 76, 60, 0.08)",
                "rgba(155, 89, 182, 0.08)"
            ];
            if (!Number.isFinite(level) || level < 0) return palette[0];
            return palette[level % palette.length];
        };

        const renderItemLine = (container, item, originalIndex, isCompleted = false, showProjectContext = false, level = 0, draggable = false, isGhost = false, levelBgOverride = "") => {
            const marginLeft = level * 30 + "px";
            const isChild = level > 0;
            const borderStyle = isChild ? (isGhost ? `2px dashed rgba(var(--text-muted-rgb), 0.3)` : `2px solid rgba(var(--interactive-accent-rgb), 0.5)`) : 'none';
            const normalizedLevelBg = String(levelBgOverride || "").trim();
            const bgStyle = isGhost
                ? `background-color: transparent;`
                : (normalizedLevelBg
                    ? `background-color: ${normalizedLevelBg};`
                    : (isChild ? `background-color: rgba(var(--mono-rgb-100), 0.03);` : ''));
            const fontStyle = isChild ? `font-size: 0.95em;` : `font-weight: 500;`; 
            const completedClass = isCompleted ? "completed-line" : (isGhost ? "ghost-line" : "");
            const commentText = getItemCommentText(item);
            const commentSummary = summarizeComment(commentText, 26);
            const noteBinding = getItemNoteBinding(item);
            const boundFile = resolveBoundFile(noteBinding);
            const bindingLabel = getBindingLabel(noteBinding);

            const isFocusSession = !isCompleted && !isGhost && item.isFocusSession === true;
            const isFirstClass = !isCompleted && !isGhost && item.isFirstClass === true;
            const lineClass = `gtd-item-line ${completedClass} ${isFirstClass ? "is-first-class" : ""} ${isFocusSession ? "is-focus-session" : ""}`.trim();
            const line = container.createEl("div", { 
                cls: lineClass, 
                attr: { 
                    style: `display: flex; align-items: center; margin-bottom: 4px; padding: 6px 0; margin-left: ${marginLeft}; border-left: ${borderStyle}; padding-left: ${isChild?'10px':'0'}; border-radius: 4px; transition: background 0.2s; ${bgStyle} ${fontStyle}` 
                } 
            });
            if (item?.id) line.dataset.gtdAnchorId = String(item.id);
            if (item?.id) line.dataset.gtdNodeKey = getGtdNodeKey(item.id);
            const sectionHost = container?.closest?.("[id^='gtd-section-']");
            if (sectionHost?.id) line.dataset.gtdSectionId = sectionHost.id;
            line.addEventListener("pointerdown", () => {
                getRelationsPluginApi()?.markLastFocusedNode?.(getGtdNodeKey(item.id));
            }, { passive: true });
            if (isFocusSession) line.setAttribute("data-focus-badge", "🎯 执行中");

            const canDrag = draggable && !isCompleted && !isGhost && (item.type === 'next_action' || item.type === 'inbox');
            const beginDrag = (e) => {
                e.stopPropagation();
                ui.gtdCurrentDragId = item.id;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", item.id);
                setTimeout(() => line.classList.add("is-dragging"), 0);
            };
            const endDrag = (e) => {
                e.stopPropagation();
                ui.gtdCurrentDragId = null;
                line.classList.remove("is-dragging");
                line.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-child");
            };
            if (canDrag) {
                line.addEventListener("dragover", (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (ui.gtdCurrentDragId === item.id) return;
                    const rect = line.getBoundingClientRect();
                    line.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-child");
                    if ((e.clientX - rect.left) > 40) line.classList.add("drag-over-child");
                    else if ((e.clientY - rect.top) < rect.height / 2) line.classList.add("drag-over-top");
                    else line.classList.add("drag-over-bottom");
                });
                line.addEventListener("dragleave", (e) => { e.stopPropagation(); line.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-child"); });
                line.addEventListener("drop", async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    line.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-child");
                    const draggedId = ui.gtdCurrentDragId;
                    const rect = line.getBoundingClientRect();
                    let position = 'after';
                    if ((e.clientX - rect.left) > 40) position = 'child';
                    else if ((e.clientY - rect.top) < rect.height / 2) position = 'before';
                    await handleDrop(draggedId, item.id, position, 'task');
                });
            }

            const actionContainer = line.createEl("span", { cls: "gtd-action-container", attr: { style: "display: inline-flex; align-items: center; gap: 8px; margin-right: 10px; min-width: 100px;" } });
            if (canDrag) {
                const dragHandle = actionContainer.createEl("span", { text: "⋮⋮", cls: "gtd-drag-handle", attr: { title: "拖拽调整位置（前/后/子）" } });
                dragHandle.draggable = true;
                dragHandle.onmousedown = (e) => { e.stopPropagation(); };
                dragHandle.addEventListener("dragstart", beginDrag);
                dragHandle.addEventListener("dragend", endDrag);
            }
            
            const hasActiveChildren = checkSubtasks(item.id);
            const isCollapsed = isItemEffectivelyCollapsed(item);
            if (!isGhost && hasActiveChildren) {
                const arrowBtn = actionContainer.createEl("span", { 
                    cls: "gtd-history-collapse-toggle",
                    text: isCollapsed ? "▶" : "▼", 
                    attr: { style: "cursor: pointer; font-size: 12px; width: 14px; color: var(--text-muted);" } 
                });
                arrowBtn.onclick = (e) => { e.stopPropagation(); toggleCollapse(originalIndex); };
            }

            if (isChild) {
                actionContainer.createEl("span", { text: "└─", attr: { style: `color: ${isGhost ? 'var(--text-faint)' : 'var(--text-faint)'}; font-family: monospace; font-size: 1.1em; line-height: 1; margin-right: -4px;` } });
            }

            const displayText = getDisplayName(item);
            const targetFile = app.metadataCache.getFirstLinkpathDest(displayText, getCurrentFile().path);
            const fileExists = targetFile !== null;

            if (isGhost) {
                actionContainer.createEl("span", { text: "⚰️", attr: { title: "未完成的父级容器" } });
            } else if (isCompleted) {
                const reactivateBtn = actionContainer.createEl("span", { text: "↩️", attr: { style: "cursor: pointer; font-size: 14px; color: var(--text-warning);" }, title: "回退" });
                if(originalIndex !== -1) reactivateBtn.onclick = (e) => { e.stopPropagation(); item.type === 'project' ? reactivateProject(originalIndex, item.project) : reactivateItem(originalIndex); };
                actionContainer.createEl("span", { text: "✅", attr: { style: "margin-left:4px; color: var(--interactive-success);" } });
                const commentBtn = actionContainer.createEl("span", {
                    text: commentText.trim() ? "💬" : "🗒️",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-left:6px;", title: commentText.trim() ? "编辑评论（已填写）" : "添加评论" }
                });
                if(originalIndex !== -1) commentBtn.onclick = (e) => { e.stopPropagation(); openCommentDrawer(item.id); };
                const bindBtn = actionContainer.createEl("span", {
                    text: noteBinding ? "🔗" : "📄",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-left:6px;", title: noteBinding ? "修改/清除绑定笔记" : "绑定 Obsidian 笔记" }
                });
                if(originalIndex !== -1) bindBtn.onclick = (e) => { e.stopPropagation(); editItemNoteBinding(item.id); };
                if (boundFile) {
                    const openBoundBtn = actionContainer.createEl("span", {
                        text: "↗",
                        attr: { style: "cursor: pointer; font-size: 14px; margin-left:4px;", title: "打开绑定笔记" }
                    });
                    openBoundBtn.onclick = (e) => { e.stopPropagation(); openBoundNote(noteBinding, item.id); };
                }
                const relationBtn = actionContainer.createEl("span", {
                    text: "↔",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-left:6px;", title: "管理跨视图引用关系" }
                });
                relationBtn.onclick = async (e) => { e.stopPropagation(); await openGtdRelationEditor(item.id); };
                const metaBtn = actionContainer.createEl("span", {
                    text: "M",
                    cls: "eva-meta-capture-btn gtd-eva-meta-capture-btn",
                    attr: { style: "cursor: pointer; font-size: 14px;", title: "EVA Meta 捕获这个条目" }
                });
                metaBtn.onclick = async (e) => { e.stopPropagation(); await captureGtdMetaNode(item.id); };
                const renameBtn = actionContainer.createEl("span", { text: "✏️", attr: { style: "cursor: pointer; font-size: 14px; margin-left:6px; color:var(--text-muted);" }, title: "重命名 (同步更新子级)" });
                if(originalIndex !== -1) renameBtn.onclick = (e) => { e.stopPropagation(); renameItem(originalIndex, item.type, displayText); };
                const deleteBtn = actionContainer.createEl("span", { text: "✖", attr: { style: "cursor: pointer; font-size: 14px; color: var(--text-muted); margin-left: 6px;" }, title: "彻底删除" });
                if(originalIndex !== -1) deleteBtn.onclick = (e) => { e.stopPropagation(); deleteItem(originalIndex); };
            } else {
                const dimCheckbox = actionContainer.createEl("input", { type: "checkbox", attr: { style: "margin-right: 6px; cursor: pointer;" } });
                dimCheckbox.checked = item.isDimmed || false;
                dimCheckbox.onclick = (e) => { e.stopPropagation(); toggleDimmed(originalIndex); };

                if (hasActiveChildren) {
                    actionContainer.createEl("span", { text: "🔒", attr: { title: "请先完成子任务", style: "cursor: not-allowed; font-size: 14px; color: var(--text-muted); opacity: 0.5;" } });
                } else {
                    const completeBtn = actionContainer.createEl("span", { text: "⭕", attr: { style: "cursor: pointer; font-size: 14px; color: var(--interactive-accent);" }, title: "标记完成" });
                    completeBtn.onclick = (e) => { e.stopPropagation(); completeItem(originalIndex); };
                }

                const renameBtn = actionContainer.createEl("span", { text: "✏️", attr: { style: "cursor: pointer; font-size: 14px;" }, title: "重命名" });
                renameBtn.onclick = (e) => { e.stopPropagation(); renameItem(originalIndex, item.type, displayText); };
                const commentBtn = actionContainer.createEl("span", {
                    text: commentText.trim() ? "💬" : "🗒️",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-left:2px;", title: commentText.trim() ? "编辑评论（已填写）" : "添加评论" }
                });
                commentBtn.onclick = (e) => { e.stopPropagation(); openCommentDrawer(item.id); };
                const bindBtn = actionContainer.createEl("span", {
                    text: noteBinding ? "🔗" : "📄",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-left:2px;", title: noteBinding ? "修改/清除绑定笔记" : "绑定 Obsidian 笔记" }
                });
                bindBtn.onclick = (e) => { e.stopPropagation(); editItemNoteBinding(item.id); };
                if (boundFile) {
                    const openBoundBtn = actionContainer.createEl("span", {
                        text: "↗",
                        attr: { style: "cursor: pointer; font-size: 14px; margin-left:2px;", title: "打开绑定笔记" }
                    });
                    openBoundBtn.onclick = (e) => { e.stopPropagation(); openBoundNote(noteBinding, item.id); };
                }
                const relationBtn = actionContainer.createEl("span", {
                    text: "↔",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-left:2px;", title: "管理跨视图引用关系" }
                });
                relationBtn.onclick = async (e) => { e.stopPropagation(); await openGtdRelationEditor(item.id); };
                const metaBtn = actionContainer.createEl("span", {
                    text: "M",
                    cls: "eva-meta-capture-btn gtd-eva-meta-capture-btn",
                    attr: { style: "cursor: pointer; font-size: 14px;", title: "EVA Meta 捕获这个条目" }
                });
                metaBtn.onclick = async (e) => { e.stopPropagation(); await captureGtdMetaNode(item.id); };

                // [升级] 标签按钮：如果条目有标签则显示第一个标签的图标，否则显示默认🏷️
                const firstTagDef = (item.tags && item.tags.length > 0) ? TAG_DEFINITIONS[item.tags[0]] : null;
                const tagBtnIcon = firstTagDef ? firstTagDef.icon : "🏷️";
                const tagBtnColor = firstTagDef ? firstTagDef.color : "var(--text-muted)";
                const tagBtnTitle = firstTagDef ? `已设置: ${firstTagDef.label} (点击修改)` : "设置类型标签";
                const tagBtn = actionContainer.createEl("span", {
                    text: tagBtnIcon,
                    attr: { style: `cursor: pointer; font-size: 14px; margin-left:2px; ${firstTagDef ? 'filter: drop-shadow(0 0 2px ' + tagBtnColor + ');' : ''}`, title: tagBtnTitle }
                });
                tagBtn.onclick = (e) => { e.stopPropagation(); modifyTag(originalIndex); };

                if (item.type === 'next_action') {
                    const addSiblingBtn = actionContainer.createEl("span", { text: "＋", attr: { style: "cursor: pointer; font-size: 14px; color: var(--text-accent); font-weight: bold;", title: "在后面添加同级任务" } });
                    addSiblingBtn.onclick = (e) => { e.stopPropagation(); addNewItem('next_action', item.parentId || null, item.project, item.id); };
                    const addSubBtn = actionContainer.createEl("span", { text: "↳", attr: { style: "cursor: pointer; font-size: 14px; color: var(--text-accent); font-weight: bold;" }, title: "添加子任务" });
                    addSubBtn.onclick = (e) => { e.stopPropagation(); addNewItem('next_action', item.id, item.project); };
                }
                if (item.type === 'inbox') {
                    const moveBtn = actionContainer.createEl("span", { text: "➡️", attr: { style: "cursor: pointer; font-size: 14px;" }, title: "整理" });
                    moveBtn.onclick = (e) => { e.stopPropagation(); moveInboxItem(originalIndex); };
                }
                const starBtn = actionContainer.createEl("span", { text: item.isFirstClass ? "⭐" : "☆", attr: { style: `cursor: pointer; font-size: 14px; color: ${item.isFirstClass ? '#f1c40f' : 'var(--text-muted)'};` } });
                starBtn.onclick = (e) => { e.stopPropagation(); toggleFirstClass(originalIndex); };
                const focusBtn = actionContainer.createEl("span", { text: item.isFocusSession ? "🎯" : "◎", attr: { style: `cursor: pointer; font-size: 14px; margin-left:2px; color: ${item.isFocusSession ? '#e91e63' : 'var(--text-muted)'};` } });
                focusBtn.onclick = (e) => { e.stopPropagation(); toggleFocusSession(originalIndex); };
                const schedBtn = actionContainer.createEl("span", { text: "📅", attr: { style: "cursor: pointer; font-size: 14px;" }, title: "计划日程" });
                schedBtn.onclick = (e) => { e.stopPropagation(); setItemSchedule(originalIndex, item.scheduled); };
                const deadlineBtn = actionContainer.createEl("span", { text: "🏁", attr: { style: "cursor: pointer; font-size: 14px; color: #e67e22;" }, title: "截止日期" });
                deadlineBtn.onclick = (e) => { e.stopPropagation(); setItemDeadline(originalIndex, item.deadline); };
            }

            const contentSpan = line.createEl("span", { attr: { style: "flex: 1; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center;" } });
            
            const textEl = contentSpan.createEl("span");
            if (item.isDimmed) {
                textEl.style.textDecoration = "line-through";
                textEl.style.opacity = "0.5";
                textEl.style.color = "var(--text-muted)";
            }

            // 如果 showProjectContext 为 true 且条目有项目，则在前面显示 [项目名称]
            if (showProjectContext && item.project && item.type !== 'project') {
                textEl.createEl("span", {
                    text: `[${item.project}] `,
                    attr: { style: "color: var(--text-accent); font-weight: 500; opacity: 0.8;" }
                });
            }

            let link = null;
            if (boundFile) {
                link = textEl.createEl("a", { text: displayText, cls: "internal-link", attr: { "data-href": boundFile.path, "href": boundFile.path, "target": "_blank", "rel": "noopener", title: `打开 ${boundFile.path}` } });
                link.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await openBoundNote(noteBinding, item.id);
                };
            } else {
                link = textEl.createEl("a", { text: displayText, cls: "internal-link", attr: { "data-href": displayText, "href": displayText, "target": "_blank", "rel": "noopener" } });
            }
            const relationSnapshot = getGtdRelationSnapshot(item.id);
            if (!isGhost && relationSnapshot.outgoing.length > 0) {
                const outgoingChip = contentSpan.createEl("span", {
                    text: `→ ${relationSnapshot.outgoing.length}`,
                    cls: "gtd-relation-chip outgoing"
                });
                outgoingChip.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await openGtdRelationEditor(item.id);
                };
            }
            if (!isGhost && relationSnapshot.incoming.length > 0) {
                const incomingChip = contentSpan.createEl("span", {
                    text: `← ${relationSnapshot.incoming.length}`,
                    cls: "gtd-relation-chip incoming"
                });
                incomingChip.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await openGtdRelationEditor(item.id);
                };
            }
            if (!isGhost && commentSummary) {
                const commentChip = contentSpan.createEl("span", {
                    cls: "gtd-comment-chip",
                    text: `💬 ${commentSummary}`,
                    attr: { title: commentText }
                });
                commentChip.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openCommentDrawer(item.id);
                };
            }
            if (!isGhost && bindingLabel) {
                contentSpan.createEl("span", {
                    cls: "gtd-bound-label",
                    text: `🔗 ${bindingLabel}`,
                    attr: { title: boundFile?.path || bindingLabel }
                });
            }
            
            if (!isGhost && item.tags && item.tags.length > 0) {
                item.tags.forEach(t => {
                    const def = TAG_DEFINITIONS[t];
                    if (def) {
                        const pill = contentSpan.createEl("span", { cls: "tag-pill", title: def.label });
                        pill.style.backgroundColor = def.color;
                        pill.innerHTML = `${def.icon} ${def.label}`;
                    }
                });
            }

            if (!isGhost && ui.gtdRecentIds.includes(item.id)) {
                contentSpan.createEl("span", {
                    text: " [新]",
                    attr: { style: "color: #ff5252; font-weight: bold; font-size: 0.8em; margin-left: 4px; vertical-align: text-top;" }
                });
            }

            if (isGhost) {
                link.style.color = "var(--text-faint)";
                link.style.opacity = "0.7";
                link.style.fontStyle = "italic";
            } else if (isCompleted) {
                if (fileExists) {
                    link.style.color = "#5F9EA0"; 
                    link.style.textDecoration = "underline";
                    link.style.opacity = "1"; 
                    link.style.fontWeight = "bold";
                } else {
                    link.style.color = "var(--text-muted)";
                    link.style.textDecoration = "none";
                    link.style.opacity = "0.8"; 
                }
            } else {
                if (fileExists) {
                    link.style.color = "var(--text-accent)";
                    link.style.fontWeight = "bold";
                } else {
                    link.style.color = "var(--text-muted)";
                    link.style.fontStyle = "italic";
                }
            }
            
            if (item.isDimmed) {
                link.style.color = "inherit"; 
            }

            if (!isGhost && item.scheduled) {
                const today = moment().format("YYYY-MM-DD");
                let dateColor = "var(--text-muted)";
                if (item.scheduled < today && !isCompleted) dateColor = "var(--text-error)"; else if (item.scheduled === today) dateColor = "var(--text-success)";
                contentSpan.createEl("span", { text: ` 📅 ${item.scheduled}`, attr: { style: `font-size: 0.8em; color: ${dateColor}; margin-left: 8px; background: var(--background-secondary); padding: 2px 6px; border-radius: 4px;` } });
            }
            if (!isGhost && item.deadline) {
                const today = moment().format("YYYY-MM-DD");
                let dlColor = "#e67e22";
                if (item.deadline < today && !isCompleted) dlColor = "#c0392b"; 
                contentSpan.createEl("span", { text: ` 🏁 ${item.deadline}`, attr: { style: `font-size: 0.8em; color: ${dlColor}; margin-left: 4px; font-weight:bold;` } });
            }
        };

        const renderTaskTree = (container, tasks, parentId = null, level = 0, ancestorMatchedTag = false) => {
            const currentLevelTasks = tasks.filter(wrap => { return (wrap.item.parentId || null) === parentId; });
            currentLevelTasks.sort((a, b) => compareByOrderThenName(a.item, b.item));
            currentLevelTasks.forEach(wrap => {
                // [筛选逻辑]
                // - 标签筛选：匹配标签的条目，其所有子层级都显示（向下继承）
                // - Focus/FirstClass：必须当前节点或子孙满足条件（不变）

                // 递归检查：当前节点或其任意子孙是否满足特定条件
                const checkTreeCondition = (id, checker) => {
                    const me = gtdList.find(i => i.id === id);
                    if (me && checker(me)) return true;
                    const children = gtdList.filter(i => i.parentId === id && i.status === 'active');
                    return children.some(c => checkTreeCondition(c.id, checker));
                };

                // 检查当前条目是否匹配标签
                const currentMatchesTag = tagMatchesFilter(wrap.item.tags, ui.gtdTagFilters);
                // 标签向下继承：祖先匹配则子孙都通过
                const tagInherited = ancestorMatchedTag || currentMatchesTag;

                let passFocus = true;
                let passFirstClass = true;
                let passTag = true;

                // Focus 模式检查（不变）
                if (ui.gtdShowOnlyFocus) {
                    passFocus = checkTreeCondition(wrap.item.id, (item) =>
                        item.isFocusSession || ui.gtdRecentIds.includes(item.id)
                    );
                }

                // FirstClass 模式检查（不变）
                if (ui.gtdShowOnlyFirstClass) {
                    passFirstClass = checkTreeCondition(wrap.item.id, (item) =>
                        item.isFirstClass || ui.gtdRecentIds.includes(item.id)
                    );
                }

                // 标签模式检查：祖先匹配(向下继承) 或 当前匹配 或 子孙匹配(向上冒泡) 或 新添加的条目
                if (ui.gtdTagFilters && ui.gtdTagFilters.length > 0) {
                    passTag = tagInherited || checkTreeCondition(wrap.item.id, (item) =>
                        tagMatchesFilter(item.tags, ui.gtdTagFilters) || ui.gtdRecentIds.includes(item.id)
                    );
                }

                // 所有启用的条件都必须通过
                const shouldRender = passFocus && passFirstClass && passTag;

                if (shouldRender) {
                    renderItemLine(container, wrap.item, wrap.index, false, false, level, true, false, getProjectLevelBackground(level));
                    if (!isItemEffectivelyCollapsed(wrap.item)) {
                        // 传递标签继承状态给子节点
                        renderTaskTree(container, tasks, wrap.item.id, level + 1, tagInherited);
                    }
                }
            });
        };

        const renderCompletedTree = (container) => {
            const completedItemsRaw = gtdList.map((item, index) => ({ item, index })).filter(({ item }) => item.status === 'completed');
            if (completedItemsRaw.length === 0) {
                container.createEl("div", { text: "_暂无数据_", attr: { style: "color:var(--text-faint);font-style:italic;" } });
                return;
            }
            const allItemsMap = new Map(gtdList.map((item, index) => [item.id, { item, index }]));
            const displayNodes = new Map();
            completedItemsRaw.forEach(wrap => {
                displayNodes.set(wrap.item.id, { ...wrap, isGhost: false, isCompleted: true });
                let currentParentId = wrap.item.parentId;
                while (currentParentId) {
                    if (displayNodes.has(currentParentId)) break; 
                    const parentWrap = allItemsMap.get(currentParentId);
                    if (parentWrap) {
                        if (parentWrap.item.status !== 'completed') {
                            displayNodes.set(currentParentId, { ...parentWrap, isGhost: true, isCompleted: false });
                        }
                    } else break; 
                    currentParentId = parentWrap ? parentWrap.item.parentId : null;
                }
            });
            const treeNodes = Array.from(displayNodes.values());
            const nodesByProject = {};
            treeNodes.forEach(node => {
                const projName = node.item.project || "未分类";
                if (!nodesByProject[projName]) nodesByProject[projName] = [];
                nodesByProject[projName].push(node);
            });
            const renderGhostTree = (container, tasks, parentId = null, level = 0) => {
                const currentLevelTasks = tasks.filter(node => (node.item.parentId || null) === parentId);
                currentLevelTasks.sort((a, b) => getDisplayName(a.item).localeCompare(getDisplayName(b.item), "zh"));
                currentLevelTasks.forEach(node => {
                    renderItemLine(container, node.item, node.index, node.isCompleted, false, level, false, node.isGhost);
                    renderGhostTree(container, tasks, node.item.id, level + 1);
                });
            };
            Object.keys(nodesByProject).sort().forEach(projName => {
                const projDiv = container.createEl("div", { attr: { style: "margin-bottom: 10px;" } });
                projDiv.createEl("div", { text: `📂 ${projName}`, attr: { style: "font-weight: bold; color: var(--text-muted); margin-bottom: 5px; font-size: 0.9em;" } });
                renderGhostTree(projDiv, nodesByProject[projName], null, 0);
            });
            container.createEl("div", { text: `共 ${completedItemsRaw.length} 条已完成记录`, attr: { style: "color:var(--text-muted);font-size:0.8em;margin-top:15px;text-align:right;border-top:1px dashed var(--background-modifier-border);padding-top:5px;" } });
        };

        // --- 核心修复：按顺序构建DOM，最后再挂载 ---
        
        // 1. 工作篮模块
        const inboxDiv = createRootEl("div", "", { attr: { id: "gtd-section-inbox", style: containerStyle } });
        inboxDiv.createEl("div", { text: "📥 工作篮 (Inbox)", attr: { style: headerStyle } });
        const inboxIndices = gtdList.map((item, index) => ({ item, index }))
            .filter(({ item }) => item.type === 'inbox' && item.status === 'active' && filterFn(item))
            .filter(({ item }) => !ui.gtdShowOnlyFocus || item.isFocusSession || ui.gtdRecentIds.includes(item.id))
            // [升级] 工作篮标签筛选：使用tagMatchesFilter支持层级匹配，新添加的条目临时显示
            .filter(({ item }) => {
                if (!tagMatchesFilter(item.tags, ui.gtdTagFilters) && !ui.gtdRecentIds.includes(item.id)) return false;
                return true;
            })
            .sort((a, b) => compareByOrderThenName(a.item, b.item));
        if (inboxIndices.length === 0) inboxDiv.createEl("div", { text: "_空空如也_", attr: { style: "color:var(--text-faint);font-style:italic;" } });
        else inboxIndices.forEach(({ item, index }) => renderItemLine(inboxDiv, item, index, false, false, 0, true));

        // 2. 导航模块 (现在只是创建Div，不挂载点击事件里的逻辑，因为目标还没生成)
        const navDiv = createRootEl("div", "", { attr: { id: "gtd-section-quick-nav", style: containerStyle + "background-color: var(--background-secondary);" } });
        navDiv.createEl("div", { text: "⚡ 项目快速导航 (Quick Nav)", attr: { style: headerStyle + "border-color: var(--text-muted);" } });
        const navContainer = navDiv.createEl("div", { attr: { style: "display:flex; flex-direction:column; gap:2px;" } });

        // 3. 日程模块
        const scheduleDiv = createRootEl("div", "", { attr: { id: "gtd-section-schedule", style: containerStyle + "border-color: var(--interactive-accent);" } });
        scheduleDiv.createEl("div", { text: "📅 日程安排 (Schedule)", attr: { style: headerStyle } });
        const scheduledIndices = gtdList.map((item, index) => ({ item, index })).filter(({ item }) => item.status === 'active' && item.scheduled && filterFn(item)).sort(scheduleSort);
        if (scheduledIndices.length === 0) scheduleDiv.createEl("div", { text: "_暂无日程安排_", attr: { style: "color:var(--text-faint);font-style:italic;" } });
        else scheduledIndices.forEach(({ item, index }) => renderItemLine(scheduleDiv, item, index, false, true));

        // 4. 项目清单模块
        const projectDiv = createRootEl("div", "", { attr: { id: "gtd-section-projects", style: containerStyle } });
        projectDiv.createEl("div", { text: "📂 项目清单 (Projects)", attr: { style: headerStyle } });

        const activeProjectsForNav = gtdList.map((item, index) => ({ item, index }))
            .filter(({ item }) => item.type === 'project' && item.status === 'active')
            .filter(({ item }) => {
                // 无任何筛选条件时显示所有项目
                if (!ui.gtdShowOnlyFirstClass && !ui.gtdShowOnlyFocus && (!ui.gtdTagFilters || ui.gtdTagFilters.length === 0)) return true;

                const projName = item.project;
                const subs = gtdList.filter(s => s.type === 'next_action' && s.project === projName && s.status === 'active');

                // 递归检查：当前节点或其任意子孙是否满足特定条件
                const checkTreeCondition = (id, checker) => {
                    const me = gtdList.find(i => i.id === id);
                    if (me && checker(me)) return true;
                    const children = gtdList.filter(i => i.parentId === id && i.status === 'active');
                    return children.some(c => checkTreeCondition(c.id, checker));
                };

                let passFocus = true;
                let passFirstClass = true;
                let passTag = true;

                // Focus 模式检查：项目或子任务有焦点标记
                if (ui.gtdShowOnlyFocus) {
                    passFocus = item.isFocusSession || subs.some(s => checkTreeCondition(s.id, (i) =>
                        i.isFocusSession || ui.gtdRecentIds.includes(i.id)
                    ));
                }

                // FirstClass 模式检查：项目或子任务有星标
                if (ui.gtdShowOnlyFirstClass) {
                    passFirstClass = item.isFirstClass || subs.some(s => checkTreeCondition(s.id, (i) =>
                        i.isFirstClass || ui.gtdRecentIds.includes(i.id)
                    ));
                }

                // 标签模式检查：项目本身或任意子任务匹配标签即可，新添加的条目临时通过
                if (ui.gtdTagFilters && ui.gtdTagFilters.length > 0) {
                    passTag = tagMatchesFilter(item.tags, ui.gtdTagFilters) ||
                        ui.gtdRecentIds.includes(item.id) ||
                        subs.some(s => checkTreeCondition(s.id, (i) =>
                            tagMatchesFilter(i.tags, ui.gtdTagFilters) || ui.gtdRecentIds.includes(i.id)
                        ));
                }

                // 所有启用的条件都必须通过
                return passFocus && passFirstClass && passTag;
            });
        const visibleProjectIdSet = new Set(activeProjectsForNav.map(({ item }) => item.id));
        const getVisibleRootProjects = () => activeProjectsForNav
            .filter(({ item }) => {
                const p = item.parentId || null;
                return p === null || !visibleProjectIdSet.has(p);
            })
            .sort((a, b) => compareByOrderThenName(a.item, b.item));
        const getVisibleChildren = (parentId) => {
            return activeProjectsForNav
                .filter(({ item }) => (item.parentId || null) === parentId)
                .sort((a, b) => compareByOrderThenName(a.item, b.item));
        };
        const collectVisibleProjectsInOrder = (parentId = null, chain = new Set()) => {
            const entries = parentId === null ? getVisibleRootProjects() : getVisibleChildren(parentId);
            const ordered = [];
            entries.forEach((entry) => {
                const projectId = entry?.item?.id;
                if (!projectId || chain.has(projectId)) return;
                ordered.push(entry);
                const nextChain = new Set(chain);
                nextChain.add(projectId);
                ordered.push(...collectVisibleProjectsInOrder(projectId, nextChain));
            });
            return ordered;
        };

        // 填充 Quick Nav：树状项目导航（支持拖拽改父子、折叠、同级名称排序）
        if (activeProjectsForNav.length > 0) {
            const getProjectRowDropPosition = (row, event) => {
                const rect = row.getBoundingClientRect();
                const xRatio = (event.clientX - rect.left) / Math.max(rect.width, 1);
                if (xRatio > 0.72) return "child";
                return (event.clientY - rect.top) < rect.height / 2 ? "before" : "after";
            };
            const applyProjectDropClass = (row, position) => {
                row.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child");
                row.classList.add(`drag-over-${position}`);
            };

            const rootDropZone = navContainer.createEl("div", { cls: "proj-nav-drop-root", text: "↥ 拖拽到这里设为顶层项目" });
            rootDropZone.addEventListener("dragover", (e) => {
                e.preventDefault();
                if (!ui.gtdCurrentDragProjectId) return;
                rootDropZone.classList.add("drag-over");
            });
            rootDropZone.addEventListener("dragleave", () => rootDropZone.classList.remove("drag-over"));
            rootDropZone.addEventListener("drop", async (e) => {
                e.preventDefault();
                rootDropZone.classList.remove("drag-over");
                if (!ui.gtdCurrentDragProjectId) return;
                await moveProjectOrder(ui.gtdCurrentDragProjectId, null, "after");
            });

            const jumpToProject = (projectId) => {
                const targetId = `proj-${projectId}`;
                setTimeout(() => {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.open = true;
                        setTimeout(() => {
                            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                            targetElement.classList.add("highlight-target");
                            setTimeout(() => targetElement.classList.remove("highlight-target"), 1500);
                        }, 50);
                    } else {
                        new Notice("定位失败：目标项目当前不可见（可能被筛选隐藏）");
                    }
                }, 10);
            };

            const createQuickNavTagEditor = (row, item, index) => {
                const firstTagDef = (item.tags && item.tags.length > 0) ? TAG_DEFINITIONS[item.tags[0]] : null;
                const icon = firstTagDef ? firstTagDef.icon : "🏷️";
                const title = firstTagDef ? `修改标签（当前: ${firstTagDef.label}）` : "添加标签";
                const editBtn = row.createEl("span", { cls: "proj-nav-tag-edit", text: icon, attr: { title } });
                editBtn.draggable = false;
                editBtn.onmousedown = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                };
                editBtn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await modifyTag(index);
                };
                editBtn.addEventListener("dragstart", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            };

            const revealProjectInQuickNav = (projectId) => {
                const targetId = String(projectId || "").trim();
                if (!targetId) return false;
                const selector = `.proj-nav-row[data-project-id="${escapeSelectorValue(targetId)}"]`;
                const targetRow = navContainer.querySelector(selector);
                if (!targetRow) {
                    ui.gtdPendingQuickNavRevealProjectId = "";
                    new Notice("定位失败：目标项目当前不在项目快速导航中");
                    console.info("[GTD][tag-usage][quick-nav-reveal]", { status: "MISS", projectId: targetId });
                    return false;
                }
                focusGtdRelationTarget(targetRow, { behavior: "smooth", viewportRatio: 0.28 });
                targetRow.classList.add("gtd-quick-nav-focus-hit", "highlight-target");
                window.setTimeout(() => targetRow.classList.remove("gtd-quick-nav-focus-hit", "highlight-target"), 1800);
                ui.gtdPendingQuickNavRevealProjectId = "";
                console.info("[GTD][tag-usage][quick-nav-reveal]", { status: "OK", projectId: targetId });
                return true;
            };

            const renderNavTree = (parentId, level = 0, chain = new Set()) => {
                const children = getVisibleChildren(parentId);
                children.forEach(({ item, index }) => {
                    // 防御：若数据中已有循环引用，直接跳过该分支
                    if (chain.has(item.id)) return;
                    const nextChain = new Set(chain);
                    nextChain.add(item.id);

                    const hasChildren = getVisibleChildren(item.id).length > 0;
                    const isCollapsed = !!ui.gtdQuickNavCollapsed[item.id];

                    const row = navContainer.createEl("div", { cls: "proj-nav-row", attr: { style: `margin-left:${level * 18}px;`, "data-project-id": item.id } });
                    row.draggable = true;
                    row.addEventListener("dragstart", (e) => {
                        ui.gtdCurrentDragProjectId = item.id;
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", item.id);
                        setTimeout(() => row.classList.add("is-dragging"), 0);
                    });
                    row.addEventListener("dragend", () => {
                        ui.gtdCurrentDragProjectId = null;
                        row.classList.remove("is-dragging");
                    });
                    row.addEventListener("dragover", (e) => {
                        e.preventDefault();
                        const draggedId = ui.gtdCurrentDragProjectId;
                        if (!draggedId || draggedId === item.id) return;
                        applyProjectDropClass(row, getProjectRowDropPosition(row, e));
                    });
                    row.addEventListener("dragleave", () => row.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child"));
                    row.addEventListener("drop", async (e) => {
                        e.preventDefault();
                        const position = getProjectRowDropPosition(row, e);
                        row.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child");
                        const draggedId = ui.gtdCurrentDragProjectId;
                        if (!draggedId || draggedId === item.id) return;
                        await moveProjectOrder(draggedId, item.id, position);
                    });

                    if (hasChildren) {
                        const toggle = row.createEl("span", { cls: "proj-nav-toggle", text: isCollapsed ? "▶" : "▼" });
                        toggle.onclick = (e) => {
                            e.stopPropagation();
                            ui.gtdQuickNavCollapsed[item.id] = !isCollapsed;
                            if (renderViewFn) renderViewFn();
                        };
                    } else {
                        row.createEl("span", { cls: "proj-nav-toggle spacer", text: "•" });
                    }

                    const navTag = row.createEl("span", { cls: "proj-nav-tag" });
                    navTag.createEl("span", { text: `📂 ${item.project}`, cls: "proj-nav-main" });
                    if (item.tags && item.tags.length > 0) {
                        const navTags = navTag.createEl("span", { cls: "proj-nav-tags" });
                        item.tags.forEach(t => {
                            const def = TAG_DEFINITIONS[t];
                            if (!def) return;
                            const pill = navTags.createEl("span", { cls: "proj-nav-pill", text: `${def.icon} ${def.label}` });
                            pill.style.borderColor = def.color;
                            pill.style.color = def.color;
                        });
                    }
                    navTag.onclick = () => jumpToProject(item.id);
                    createQuickNavTagEditor(row, item, index);

                    if (hasChildren && !isCollapsed) renderNavTree(item.id, level + 1, nextChain);
                });
            };

            // 根节点：parentId为空，或父节点被筛选隐藏时也提升为根显示
            const rootProjects = getVisibleRootProjects();

            rootProjects.forEach(({ item, index }) => {
                const hasChildren = getVisibleChildren(item.id).length > 0;
                const isCollapsed = !!ui.gtdQuickNavCollapsed[item.id];

                const row = navContainer.createEl("div", { cls: "proj-nav-row", attr: { style: "margin-left:0px;", "data-project-id": item.id } });
                row.draggable = true;
                row.addEventListener("dragstart", (e) => {
                    ui.gtdCurrentDragProjectId = item.id;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", item.id);
                    setTimeout(() => row.classList.add("is-dragging"), 0);
                });
                row.addEventListener("dragend", () => {
                    ui.gtdCurrentDragProjectId = null;
                    row.classList.remove("is-dragging");
                });
                row.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    const draggedId = ui.gtdCurrentDragProjectId;
                    if (!draggedId || draggedId === item.id) return;
                    applyProjectDropClass(row, getProjectRowDropPosition(row, e));
                });
                row.addEventListener("dragleave", () => row.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child"));
                row.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    const position = getProjectRowDropPosition(row, e);
                    row.classList.remove("drag-over", "drag-over-before", "drag-over-after", "drag-over-child");
                    const draggedId = ui.gtdCurrentDragProjectId;
                    if (!draggedId || draggedId === item.id) return;
                    await moveProjectOrder(draggedId, item.id, position);
                });

                if (hasChildren) {
                    const toggle = row.createEl("span", { cls: "proj-nav-toggle", text: isCollapsed ? "▶" : "▼" });
                    toggle.onclick = (e) => {
                        e.stopPropagation();
                        ui.gtdQuickNavCollapsed[item.id] = !isCollapsed;
                        if (renderViewFn) renderViewFn();
                    };
                } else {
                    row.createEl("span", { cls: "proj-nav-toggle spacer", text: "•" });
                }

                const navTag = row.createEl("span", { cls: "proj-nav-tag" });
                navTag.createEl("span", { text: `📂 ${item.project}`, cls: "proj-nav-main" });
                if (item.tags && item.tags.length > 0) {
                    const navTags = navTag.createEl("span", { cls: "proj-nav-tags" });
                    item.tags.forEach(t => {
                        const def = TAG_DEFINITIONS[t];
                        if (!def) return;
                        const pill = navTags.createEl("span", { cls: "proj-nav-pill", text: `${def.icon} ${def.label}` });
                        pill.style.borderColor = def.color;
                        pill.style.color = def.color;
                    });
                }
                navTag.onclick = () => jumpToProject(item.id);
                createQuickNavTagEditor(row, item, index);

                if (hasChildren && !isCollapsed) renderNavTree(item.id, 1, new Set([item.id]));
            });
            if (ui.gtdPendingQuickNavRevealProjectId) {
                const pendingProjectId = String(ui.gtdPendingQuickNavRevealProjectId || "").trim();
                window.requestAnimationFrame(() => revealProjectInQuickNav(pendingProjectId));
            }
        } else {
            if (ui.gtdPendingQuickNavRevealProjectId) {
                const pendingProjectId = String(ui.gtdPendingQuickNavRevealProjectId || "").trim();
                ui.gtdPendingQuickNavRevealProjectId = "";
                console.info("[GTD][tag-usage][quick-nav-reveal]", { status: "MISS_NO_NAV", projectId: pendingProjectId });
            }
            navDiv.style.display = 'none'; // 没有项目时隐藏导航栏
        }

        if (activeProjectsForNav.length === 0) projectDiv.createEl("div", { text: "_暂无活跃项目_", attr: { style: "color:var(--text-faint);font-style:italic;" } });
        else {
            const orderedProjectsForDisplay = collectVisibleProjectsInOrder();
            orderedProjectsForDisplay.forEach(({ item: projItem, index: projIndex }) => {
                const projName = projItem.project;
                const projCommentText = getItemCommentText(projItem);
                const projCommentSummary = summarizeComment(projCommentText, 30);
                const projNoteBinding = getItemNoteBinding(projItem);
                const projBoundFile = resolveBoundFile(projNoteBinding);
                const projBindingLabel = getBindingLabel(projNoteBinding);
                const details = projectDiv.createEl("details", { attr: { id: `proj-${projItem.id}`, style: "margin-bottom:8px;border-bottom:1px dashed var(--background-modifier-border);padding-bottom:8px;" } });
                details.dataset.gtdAnchorId = String(projItem.id);
                details.dataset.gtdSectionId = "gtd-section-projects";
                details.open = !isProjectEffectivelyCollapsed(projItem);
                const toggleRenderGeneration = renderGeneration;
                const renderedInHistory = !!historySession;
                details.addEventListener("toggle", async () => {
                    if (!details.isConnected || toggleRenderGeneration !== renderGeneration) return;
                    const nextCollapsed = !details.open;
                    if (historySession) {
                        if (nextCollapsed !== historyCollapsedFor(projItem)) historySession.collapsed.set(projItem.id, nextCollapsed);
                        return;
                    }
                    if (renderedInHistory) return;
                    if (nextCollapsed === !!projItem.isCollapsed) return;
                    await updateGTD((list) => {
                        if (!list[projIndex]) return;
                        list[projIndex].isCollapsed = nextCollapsed;
                    });
                });
                const summary = details.createEl("summary", { attr: { style: "cursor:pointer;margin-bottom:5px;font-weight:600;color:var(--text-normal);" } });
                summary.dataset.gtdAnchorId = String(projItem.id);
                summary.dataset.gtdNodeKey = getGtdNodeKey(projItem.id);
                summary.dataset.gtdSectionId = "gtd-section-projects";
                summary.addEventListener("pointerdown", () => {
                    getRelationsPluginApi()?.markLastFocusedNode?.(getGtdNodeKey(projItem.id));
                }, { passive: true });
                if (projItem.isFocusSession) summary.classList.add("gtd-focus-project");
                
                summary.addEventListener("dragover", (e) => { e.preventDefault(); e.stopPropagation(); if (!ui.gtdCurrentDragId) return; summary.classList.add("drag-over-project"); });
                summary.addEventListener("dragleave", (e) => { e.stopPropagation(); summary.classList.remove("drag-over-project"); });
                summary.addEventListener("drop", async (e) => { e.preventDefault(); e.stopPropagation(); summary.classList.remove("drag-over-project"); await handleDrop(ui.gtdCurrentDragId, projItem.id, null, 'project'); });

                const summaryContent = summary.createEl("span");
                const projDoneBtn = summaryContent.createEl("span", { text: "⭕", attr: { style: "margin-right:6px;cursor:pointer;color:var(--interactive-accent);" }, title: "归档项目" });
                projDoneBtn.onclick = (e) => { e.preventDefault(); completeProject(projIndex, projName); };
                const projRenameBtn = summaryContent.createEl("span", { text: "✏️", attr: { style: "margin-right:6px;cursor:pointer;font-size:14px;" }, title: "重命名项目" });
                projRenameBtn.onclick = (e) => { e.preventDefault(); renameItem(projIndex, 'project', projName); };
                const projAddProjectBtn = summaryContent.createEl("span", { text: "＋", attr: { style: "margin-right:6px;cursor:pointer;font-size:14px;color:var(--text-accent);font-weight:bold;" }, title: "在后面新增同级项目" });
                projAddProjectBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addNewItem('project', projItem.parentId || null, null, projItem.id);
                };
                const projAddActionBtn = summaryContent.createEl("span", { text: "↳", attr: { style: "margin-right:6px;cursor:pointer;font-size:14px;color:var(--text-accent);font-weight:bold;" }, title: "新增下属下一步待办事项" });
                projAddActionBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addNewItem('next_action', null, projName);
                };
                const projFocusBtn = summaryContent.createEl("span", { text: projItem.isFocusSession ? "🎯" : "◎", attr: { style: `margin-right:6px;cursor:pointer;color: ${projItem.isFocusSession ? '#e91e63' : 'var(--text-muted)'};` }, title: "加入本次执行" });
                projFocusBtn.onclick = (e) => { e.preventDefault(); toggleFocusSession(projIndex); };
                const projSchedBtn = summaryContent.createEl("span", { text: "📅", attr: { style: "margin-right:4px;cursor:pointer;font-size:14px;" }, title: "设置计划" });
                projSchedBtn.onclick = (e) => { e.preventDefault(); setItemSchedule(projIndex, projItem.scheduled); };
                const projDlBtn = summaryContent.createEl("span", { text: "🏁", attr: { style: "margin-right:8px;cursor:pointer;font-size:14px;color:#e67e22;" }, title: "设置死线" });
                projDlBtn.onclick = (e) => { e.preventDefault(); setItemDeadline(projIndex, projItem.deadline); };
                
                // [修复] 标签设置按钮（项目也可以打标签了！）
                const projTagBtn = summaryContent.createEl("span", { text: "🏷️", attr: { style: "cursor: pointer; font-size: 14px; margin-right:6px;", title: "设置项目类型" } });
                projTagBtn.onclick = (e) => { e.preventDefault(); modifyTag(projIndex); };
                const projCommentBtn = summaryContent.createEl("span", {
                    text: projCommentText.trim() ? "💬" : "🗒️",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-right:6px;", title: projCommentText.trim() ? "编辑项目评论（已填写）" : "添加项目评论" }
                });
                projCommentBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openCommentDrawer(projItem.id);
                };
                const projBindBtn = summaryContent.createEl("span", {
                    text: projNoteBinding ? "🔗" : "📄",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-right:6px;", title: projNoteBinding ? "修改/清除绑定笔记" : "绑定 Obsidian 笔记" }
                });
                projBindBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editItemNoteBinding(projItem.id);
                };
                if (projBoundFile) {
                    const projOpenBoundBtn = summaryContent.createEl("span", {
                        text: "↗",
                        attr: { style: "cursor: pointer; font-size: 14px; margin-right:6px;", title: "打开绑定笔记" }
                    });
                    projOpenBoundBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openBoundNote(projNoteBinding, projItem.id);
                    };
                }
                const projRelationBtn = summaryContent.createEl("span", {
                    text: "↔",
                    attr: { style: "cursor: pointer; font-size: 14px; margin-right:6px;", title: "管理跨视图引用关系" }
                });
                projRelationBtn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await openGtdRelationEditor(projItem.id);
                };

                if (projBoundFile) {
                    const projLink = summaryContent.createEl("a", { text: projName, cls: "internal-link", attr: { "data-href": projBoundFile.path, "href": projBoundFile.path, "target": "_blank", "rel": "noopener", title: `打开 ${projBoundFile.path}` } });
                    projLink.onclick = async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await openBoundNote(projNoteBinding, projItem.id);
                    };
                } else {
                    summaryContent.createEl("a", { text: projName, cls: "internal-link", attr: { "data-href": projName, "href": projName, "target": "_blank", "rel": "noopener" } });
                }
                const projRelationSnapshot = getGtdRelationSnapshot(projItem.id);
                if (projRelationSnapshot.outgoing.length > 0) {
                    const outgoingChip = summaryContent.createEl("span", {
                        text: `→ ${projRelationSnapshot.outgoing.length}`,
                        cls: "gtd-relation-chip outgoing"
                    });
                    outgoingChip.onclick = async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await openGtdRelationEditor(projItem.id);
                    };
                }
                if (projRelationSnapshot.incoming.length > 0) {
                    const incomingChip = summaryContent.createEl("span", {
                        text: `← ${projRelationSnapshot.incoming.length}`,
                        cls: "gtd-relation-chip incoming"
                    });
                    incomingChip.onclick = async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await openGtdRelationEditor(projItem.id);
                    };
                }
                if (projCommentSummary) {
                    const projCommentChip = summaryContent.createEl("span", {
                        cls: "gtd-comment-chip",
                        text: `💬 ${projCommentSummary}`,
                        attr: { title: projCommentText }
                    });
                    projCommentChip.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCommentDrawer(projItem.id);
                    };
                }
                
                // [新增] 渲染项目的标签
                if (projBindingLabel) {
                    summaryContent.createEl("span", {
                        cls: "gtd-bound-label",
                        text: `🔗 ${projBindingLabel}`,
                        attr: { title: projBoundFile?.path || projBindingLabel }
                    });
                }

                if (projItem.tags && projItem.tags.length > 0) {
                    projItem.tags.forEach(t => {
                        const def = TAG_DEFINITIONS[t];
                        if (def) {
                            const pill = summaryContent.createEl("span", { cls: "tag-pill", title: def.label });
                            pill.style.backgroundColor = def.color;
                            pill.innerHTML = `${def.icon} ${def.label}`;
                        }
                    });
                }

                if (projItem.scheduled) summaryContent.createEl("span", { text: ` 📅 ${projItem.scheduled}`, attr: { style: "font-size:0.8em;color:var(--text-muted);margin-left:8px;" } });
                if (projItem.deadline) {
                    const dColor = (projItem.deadline < moment().format("YYYY-MM-DD")) ? "#c0392b" : "#e67e22";
                    summaryContent.createEl("span", { text: ` 🏁 ${projItem.deadline}`, attr: { style: `font-size:0.8em;color:${dColor};margin-left:4px;font-weight:bold;` } });
                }

                const subActionsRaw = gtdList.map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.type === 'next_action' && item.project === projName && item.status === 'active');

                summaryContent.createEl("span", { text: ` (${subActionsRaw.length})`, attr: { style: "font-size:0.8em;color:var(--text-muted);" } });

                const subList = details.createEl("div", { attr: { style: "margin-left:24px;padding-left:10px;border-left:2px solid var(--background-modifier-border);" } });
                if (subActionsRaw.length === 0) subList.createEl("div", { text: "👉 暂无下一步行动", attr: { style: "color:var(--text-muted);font-size:0.9em;padding:4px 0;" } });
                else {
                    // [核心修复] 项目标签向下继承：如果项目匹配标签筛选，则其所有子任务都显示
                    const projectMatchesTag = tagMatchesFilter(projItem.tags, ui.gtdTagFilters);
                    renderTaskTree(subList, subActionsRaw, null, 0, projectMatchesTag);
                }
            });
        }
        
        const doneDiv = createRootEl("details", "", { attr: { id: "gtd-section-archive", style: containerStyle } });
        doneDiv.open = !!ui.gtdRelationRevealState?.archiveItemId;
        doneDiv.createEl("summary", {
            text: "✅ 归档博物馆 (Archive)",
            attr: { style: `${headerStyle} cursor:pointer; list-style:none;` }
        });
        const doneBody = doneDiv.createEl("div", { attr: { style: "margin-top:10px;" } });
        renderCompletedTree(doneBody);

        // 最终挂载顺序：工作篮 -> 导航 -> 日程 -> 项目 -> 归档
        // 注意：createRootEl 是直接 append 到 container 的，所以上面的代码顺序就是渲染顺序
    };


    renderViewFn = () => tracking.run(() => {
        if (engineIsDisposed()) return false;
        if(context.canLeaveInput && !context.canLeaveInput())return false;
        renderGeneration += 1;
        navigationReceipt=null;
        if (historySession) revalidateHistory();
        container.querySelectorAll(".gtd-comment-mask, .gtd-comment-drawer").forEach((el) => {
            try { el.remove(); } catch (e) {}
        });
        if (!historySession) {
            takeNavigationHandoff();
        }
        disposeCommentPreviewComponent();
        if (!historySession && ui.gtdTagManagerMode) {
            if (renderTagManagerView(container) === false) return false;
        } else if (!historySession && ui.gtdKaioKenMode) {
            if (renderKaioKenView(container) === false) return false;
        } else {
            if (renderNormalView() === false) return false;
        }
        container.classList?.toggle("is-gtd-history-readonly", !!historySession);
        if (historySession) renderHistoryBanner();
        void registerGtdRelationAdapter();
        if (!historySession && !navigationInProgress) restorePendingGtdRelationFocus();
        return true;
    });
    assertHostCurrent();
    let engineDisposed = false;
    const trackingVisibilityChanged = event => {
      if (!engineDisposed && container?.isConnected && event?.detail?.provider === window.__projectExecutionOverviewPluginApi) renderViewFn?.();
    };

    tracking=GtdTrackingModule.createAdapter({root:container,window,document,getProvider:getProjectOverviewApi,
        getScope:()=>JSON.stringify([sourceContext.path,sourceContext.folder,sourceContext.exists]),
        isLive:()=>!engineIsDisposed(),canLeave:()=>!context.canLeaveInput||context.canLeaveInput()===true,
        render:()=>pendingHistoryBoot?retryHistoryBoot():renderViewFn()});
    const retryHistoryBoot=()=>{
        if(!pendingHistoryBoot)return false;
        const boot=pendingHistoryBoot;
        if(enterHistory({itemId:boot.itemId})===true){pendingHistoryBoot=null;return true;}
        return false;
    };
    const isEngineLeaseLive = () => !engineIsDisposed()
        && container?.isConnected === true
        && typeof renderViewFn === "function"
        && Array.isArray(gtdList);
    // Live input observation only: this is not a receipt for persisted contents.
    const captureCarrierInput = () => {
        if (!isEngineLeaseLive() || !dataRevision || inputRevisionRefreshPending !== 0) return null;
        return { version: carrierInputVersion, sequence: carrierInputSequence,
            list: gtdList, tags: TAG_DEFINITIONS, keywords: TAG_KEYWORD_STORE,
            metadata: REVISION_PATHS.map(path => dataRevision[path]) };
    };
    const carrierInputIsCurrent = (input) => !!input && isEngineLeaseLive()
        && inputRevisionRefreshPending === 0 && !!dataRevision
        && input.version === carrierInputVersion
        && input.list === gtdList && input.tags === TAG_DEFINITIONS && input.keywords === TAG_KEYWORD_STORE
        && REVISION_PATHS.every((path, index) => input.metadata[index] === dataRevision[path]);
    const freezeCarrierResult = value => {
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            Object.values(value).forEach(freezeCarrierResult);
            Object.freeze(value);
        }
        return value;
    };
    // BEGIN GTD_SAVED_OBSERVATION_V1
    // One bounded observation of saved bytes. Not an atomic snapshot or a write receipt.
    const savedCarrierObject = value => !!value && typeof value === "object" && !Array.isArray(value);
    const savedCarrierOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const savedCarrierFailureCodes = new WeakMap();
    const savedCarrierError = code => {
        const error = Error(code);
        savedCarrierFailureCodes.set(error, code);
        throw error;
    };
    const savedCarrierId = value => {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isSafeInteger(value) && value !== 0) return String(value);
        return savedCarrierError("saved-identity-invalid");
    };
    const parseSavedCarrierRequest = options => {
        if (!savedCarrierObject(options)) return savedCarrierError("invalid-context-request");
        const keys = options.contextKeys === undefined ? [] : options.contextKeys;
        if (!Array.isArray(keys)) return savedCarrierError("invalid-context-request");
        if (keys.length > TOP_LEVEL_PROJECT_CARRIER_BATCH_MAX_CONTEXTS) return savedCarrierError("context-request-limit-exceeded");
        const normalized = new Set();
        const contextKeys = keys.map(key => {
            if (typeof key !== "string" || !key.trim() || key.length > 8192) return savedCarrierError("invalid-context-request");
            key = key.trim();
            const label = normalizeTagKeywordKey(parseContextCapsuleLabel(key).displayLabel || key);
            if (!label || normalized.has(label)) return savedCarrierError("duplicate-normalized-context-request");
            normalized.add(label);
            return key;
        });
        return Object.freeze({ contextKeys: Object.freeze(contextKeys), readPurpose: "operation-check" });
    };
    const parseSavedCarrierInputs = raws => {
        const [list, tagsRoot, keywordsRoot] = raws.map(raw => JSON.parse(raw));
        if (!Array.isArray(list) || list.length > 50000) return savedCarrierError("saved-database-schema");
        if (!savedCarrierObject(tagsRoot) || !savedCarrierOwn(tagsRoot, "tags") || !savedCarrierObject(tagsRoot.tags)) return savedCarrierError("saved-tags-schema");
        if (!savedCarrierObject(keywordsRoot) || !savedCarrierOwn(keywordsRoot, "keywords") || !savedCarrierObject(keywordsRoot.keywords)) return savedCarrierError("saved-keywords-schema");
        if (savedCarrierOwn(keywordsRoot, "centerNamingProjectionV1") && !savedCarrierObject(keywordsRoot.centerNamingProjectionV1)) return savedCarrierError("saved-keywords-schema");
        const tagEntries = Object.entries(tagsRoot.tags), keywordEntries = Object.entries(keywordsRoot.keywords);
        if (tagEntries.length > 50000 || keywordEntries.length > 50000) return savedCarrierError("saved-entry-limit");
        const tags = Object.create(null), keywords = Object.create(null), ids = new Set();
        for (const [key, value] of tagEntries) {
            if (!key.trim() || !savedCarrierObject(value)) return savedCarrierError("saved-tag-definition-invalid");
            Object.defineProperty(tags, key, { value: {}, enumerable: true });
        }
        const items = list.map(item => {
            if (!savedCarrierObject(item)) return savedCarrierError("saved-item-invalid");
            const id = savedCarrierId(item.id);
            if (ids.has(id)) return savedCarrierError("saved-identity-conflict");
            ids.add(id);
            for (const field of ["status", "type"]) {
                if (savedCarrierOwn(item, field) && typeof item[field] !== "string") return savedCarrierError("saved-item-kind-invalid");
            }
            let parentId = "";
            if (item.parentId !== undefined && item.parentId !== null && item.parentId !== "") parentId = savedCarrierId(item.parentId);
            const itemTags = item.tags == null ? [] : item.tags;
            if (!Array.isArray(itemTags) || itemTags.some(tag => typeof tag !== "string")) return savedCarrierError("saved-item-tags-invalid");
            if (item.status === "active" && item.type === "project" && !parentId
                && (typeof item.project !== "string" || !item.project.trim())) return savedCarrierError("saved-project-name-invalid");
            return { id, status: item.status, type: item.type, parentId,
                project: typeof item.project === "string" ? item.project : "", tags: itemTags.slice() };
        });
        for (const [key, entry] of keywordEntries) {
            if (!savedCarrierObject(entry)) return savedCarrierError("saved-keyword-entry-invalid");
            const tagId = savedCarrierId(entry.tagId);
            if (savedCarrierOwn(entry, "keyword") && typeof entry.keyword !== "string") return savedCarrierError("saved-keyword-label-invalid");
            const keyword = (entry.keyword || key).trim();
            const normalized = normalizeTagKeywordKey(parseContextCapsuleLabel(keyword).displayLabel || keyword);
            if (!normalized || savedCarrierOwn(keywords, normalized)) return savedCarrierError("saved-keyword-conflict");
            // Removed definitions leave legal orphan keywords; the original batch excludes them by own membership.
            Object.defineProperty(keywords, normalized, { value: { tagId, keyword }, enumerable: true });
        }
        return { list: items, tags, keywords: { keywords }, providerGeneration: savedCarrierProviderGeneration };
    };
    const captureSavedCarrierInput = () => {
        const adapter = app?.vault?.adapter;
        if (!isEngineLeaseLive() || carrierSavedWritePending !== 0
            || !adapter || typeof adapter.read !== "function" || typeof adapter.stat !== "function") return null;
        return { saved: true, version: carrierInputVersion, adapter, read: adapter.read, stat: adapter.stat };
    };
    const savedCarrierInputIsCurrent = input => !!input && input.saved === true && isEngineLeaseLive()
        && carrierSavedWritePending === 0 && input.version === carrierInputVersion
        && app?.vault?.adapter === input.adapter
        && input.adapter.read === input.read && input.adapter.stat === input.stat;
    const readSavedCarrierBatch = async options => {
        const fail = code => ({ ok: false, complete: false, decisionComplete: false,
            providerId: "gtd-task-manager", sourceNotePath: currentNotePath,
            reason: "engine-saved-observation-failed", count: 0, returnedCount: 0,
            results: [], diagnostics: [{ code }] });
        try {
            const request = parseSavedCarrierRequest(options);
            const input = captureSavedCarrierInput();
            const guard = () => { if (!savedCarrierInputIsCurrent(input)) savedCarrierError("saved-input-not-current"); };
            guard();
            const sources = [["database", DB_PATH, 32 * 1024 * 1024], ["tags", TAGS_PATH, 8 * 1024 * 1024], ["keywords", TAG_KEYWORDS_PATH, 8 * 1024 * 1024]];
            const raws = [], files = [];
            for (const [role, path, limit] of sources) {
                const stat = await input.stat.call(input.adapter, path); guard();
                if (!stat || stat.type !== "file" || !Number.isFinite(stat.size) || stat.size < 0 || stat.size > limit) savedCarrierError("saved-source-size-invalid");
                const raw = await input.read.call(input.adapter, path); guard();
                if (typeof raw !== "string" || Buffer.byteLength(raw, "utf8") > limit) savedCarrierError("saved-source-raw-invalid");
                raws.push(raw);
                files.push({ role, path, sha256: createHash("sha256").update(raw, "utf8").digest("hex") });
            }
            const data = parseSavedCarrierInputs(raws);
            const rawRevision = createHash("sha256").update(JSON.stringify([currentNotePath, files.map(file => [file.role, file.path, file.sha256])]), "utf8").digest("hex");
            const result = getContextCapsuleTopLevelProjectCarrierBatchSnapshot(request, data);
            if (result?.ok !== true) return result;
            guard();
            result.revision = createHash("sha256").update(JSON.stringify([result.revision, rawRevision]), "utf8").digest("hex");
            result.readPurpose = "operation-check";
            result.writeAuthorization = false;
            result.inputObservation = { contractVersion: 1, purpose: "saved-owner-files", persisted: true,
                consistency: "single-pass-non-atomic", atomic: false, sourceNotePath: currentNotePath,
                rawRevision, files, readCount: 3 };
            freezeCarrierResult(result);
            carrierBatchInputs.set(result, input);
            return result;
        } catch (error) {
            return fail(savedCarrierFailureCodes.get(error) || "saved-source-read-failed");
        }
    };
    // END GTD_SAVED_OBSERVATION_V1


    const readBoundCarrierBatch = (options) => {
        const requestedPurpose = options && typeof options === "object" && !Array.isArray(options) ? options.readPurpose : null;
        const readPurpose = requestedPurpose === undefined ? "display" : requestedPurpose;
        const input = readPurpose === "display" ? captureCarrierInput() : null;
        const fail = () => ({ ok: false, complete: false, decisionComplete: false,
            providerId: "gtd-task-manager", sourceNotePath: currentNotePath,
            reason: "engine-input-observation-not-current", count: 0, returnedCount: 0,
            results: [], diagnostics: [{ code: "engine-input-observation-not-current" }] });
        if (readPurpose !== "display" && readPurpose !== "operation-check") return { ...fail(), reason: "read-purpose-invalid", diagnostics: [{ code: "read-purpose-invalid" }] };
        if (readPurpose === "operation-check") return readSavedCarrierBatch(options);
        if (!input) return fail();
        const result = getContextCapsuleTopLevelProjectCarrierBatchSnapshot(options);
        if (result?.ok !== true) return result;
        if (!carrierInputIsCurrent(input)) return fail();
        result.readPurpose = readPurpose;
        result.writeAuthorization = false;
        result.inputObservation = Object.freeze({ contractVersion: 1, purpose: "live-owner-input",
            inputSequence: input.sequence, persisted: false });
        result.providerGeneration += "|input:" + input.sequence;
        // Freeze only the newly constructed bounded result, never the owner input tables.
        freezeCarrierResult(result);
        carrierBatchInputs.set(result, input);
        return result;
    };
    const isContextCarrierBatchCurrentV1 = result => {
        if (!result || result.ok !== true) return false;
        const input = carrierBatchInputs.get(result);
        return input?.saved === true ? savedCarrierInputIsCurrent(input) : carrierInputIsCurrent(input);
    };
    const gtdTaskManagerEngineApi = {
        pluginId: pluginDiag.pluginId || "gtd-task-manager",
        sourceNotePath: currentNotePath,
        openHistoryNodeV1: async (nodeKey, isLive = null) => {
          const parsed = parseGtdNodeKey(nodeKey);
          if (!isEngineLeaseLive() || !parsed || parsed.isLegacy || parsed.notePath !== currentNotePath || parsed.scopeType !== "note" || parsed.scopeId !== currentNotePath || getGtdNodeKey(parsed.itemId) !== nodeKey) return false;
          return enterHistory({ itemId: parsed.itemId, isLive });
        },
        historyTargetV1: () => historySession?.itemId || "",
        isHistoryOpenV1: () => !!historySession,
        exitHistoryV1: () => exitHistory(),
        isDataFreshV1: async () => {
            if (!isEngineLeaseLive() || !dataRevision) return false;
            const current = await statDataRevision();
            return isEngineLeaseLive() && !!current && REVISION_PATHS.every((path) => current[path] === dataRevision[path]);
        },
        applyPendingNavigationV1: (nodeKey = '') => {
            if(!isEngineLeaseLive())return false;
            return tracking.run(()=>{
                if(nodeKey&&(!acceptsNavigationKey(nodeKey)||!getGtdItemById(parseGtdNodeKey(nodeKey).itemId)))return false;
                if(historySession)exitHistory({render:false});
                if(nodeKey){
                    if(!acceptsNavigationKey(nodeKey))return false;
                    localPendingNodeKey=nodeKey;
                    if(window.gtdPendingRelationFocusNodeKey===nodeKey)window.gtdPendingRelationFocusNodeKey='';
                    return revealGtdNodeKey(nodeKey);
                }
                return renderViewFn()===true;
            });
        },
        getNavigationResultV1: (nodeKey = '') => {
            if(!isEngineLeaseLive()||!tracking.current())return false;
            if(!nodeKey)return !historySession;
            const r=navigationReceipt;
            return !!r&&r.key===nodeKey&&r.source===currentNotePath&&r.generation===renderGeneration&&tracking.consumer.isCurrent(r.pass);
        },

        dbPath: DB_PATH,
        isReady: () => isEngineLeaseLive(),
        creationContractVersion: 1,
        prepareManagedContextCreationV1: input => getManagedGtdCreationOwner().prepare(input),
        inspectCreationStep: request => withExternalWrite(() => getManagedGtdCreationOwner().inspect(request)),
        commitCreationStep: request => withExternalWrite(() => getManagedGtdCreationOwner().commit(request)),
        ensureProjectContextTag: async (options = {}) => withExternalWrite(() => ensureProjectContextTag(options)),
        getContextCapsuleCarrierSnapshot: async (options = {}) => getContextCapsuleCarrierSnapshot(options),
        getContextCapsuleTopLevelProjectCarrierBatchSnapshot: async (options = {}) => readBoundCarrierBatch(options),
        isContextCarrierBatchCurrentV1,
        refreshContextKeywordMemory: async (data) => withExternalWrite(async () => {
            if (!isEngineLeaseLive()) throw new Error("gtd-engine-not-live");
            TAG_KEYWORD_STORE = normalizeTagKeywordStore(data);
            invalidateCarrierInput();
            TAG_KEYWORDS_LOAD_FAILED = false;
            refreshDataRevision(TAG_KEYWORDS_PATH);
            if (renderViewFn) renderViewFn();
        }),
        renameContextCapsuleKey: async (options = {}) => withExternalWrite(() => renameContextCapsuleKey(options)),
        syncContextCapsuleKey: async (options = {}) => withExternalWrite(() => syncContextCapsuleKey(options)),
        dispose: () => {
            if (engineDisposed) return;
            exitHistory({ dispose: true });
            engineDisposed = true;
            releaseGtdRelationRegistration();
            tracking?.close();
            commentEditorLease?.close();
            disposeCommentPreviewComponent();
            ownedRelationCleanup?.();
            ownedRelationCleanup = null;
            window.removeEventListener("context-key-tracking-visibility:changed", trackingVisibilityChanged);
            const registry = window.__gtdTaskManagerEngineApisBySourceNotePath;
            if (registry instanceof Map && registry.get(currentNotePath) === gtdTaskManagerEngineApi) {
                registry.delete(currentNotePath);
            }
            if (window.__gtdTaskManagerEngineApi === gtdTaskManagerEngineApi) {
                delete window.__gtdTaskManagerEngineApi;
            }
            if (container?.__gtdTaskManagerEngineApi === gtdTaskManagerEngineApi) {
                delete container.__gtdTaskManagerEngineApi;
            }
        }
    };
    assertHostCurrent();
    try {
    container.__gtdTaskManagerEngineApi = gtdTaskManagerEngineApi;
    window.__gtdTaskManagerEngineApi = gtdTaskManagerEngineApi;
    if (!(window.__gtdTaskManagerEngineApisBySourceNotePath instanceof Map)) {
        window.__gtdTaskManagerEngineApisBySourceNotePath = new Map();
    }
    window.__gtdTaskManagerEngineApisBySourceNotePath.set(currentNotePath, gtdTaskManagerEngineApi);

    // Tracking lifecycle subscribes to the published projection event, outside query/render.
    assertHostCurrent();
    bindGtdRelationChangeListener();
    if(historyBoot?.itemId){pendingHistoryBoot=historyBoot;retryHistoryBoot();}
    else {renderViewFn();if(deferredRepairWrite)void flushDeferredRepair().catch(e=>console.error('[GTD][repair-persist-deferred]',e?.message||e));}
    tracking.start();assertHostCurrent();
    } catch (error) {
        gtdTaskManagerEngineApi.dispose();
        throw error;
    }
})();
};

module.exports.gtdHostLifecycleVersion = 1;
