const __CollectionTrackingKeys=(()=>{const module={exports:{}};
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
const __CollectionTrackingConsumer=(()=>{const module={exports:{}};
'use strict';
const {copyKeys,FIELDS}=__CollectionTrackingKeys;
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
   const pass=Object.freeze({status:'ready',keys,classify:label=>stopped.has(labelKey(label))?'stopped':'unproven'});
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

return module.exports;})();
const __CollectionTrackingLifecycle=(()=>{const module={exports:{}};
'use strict';
const {createConsumer}=__CollectionTrackingConsumer;
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

return module.exports;})();
const __CollectionTrackingAdapter=(()=>{const module={exports:{}};
'use strict';
const {createConsumer}=__CollectionTrackingConsumer;
const {createLifecycle}=__CollectionTrackingLifecycle;
const EVENT='project-execution-overview:tracking-snapshot-changed-v1';
const TYPES=['click','dblclick','auxclick','contextmenu','dragstart','dragover','drop','keydown','beforeinput','input','change','paste','cut','compositionstart','compositionupdate','compositionend'];
function createAdapter(view,{window,document,notice=()=>{},clock=Date.now,schedule=setTimeout,cancel=clearTimeout,enqueue=queueMicrotask}){
 let closed=false,started=false,pending=true,banner=null,deferredLoad=null,blockedLoad=false,cleanup=[];
 const tokens=new WeakMap(),leases=new WeakSet(),controls=new Set();
 const scope=()=>view.sourceNotePath?JSON.stringify([view.sourceNotePath,view.sourceFile?.path||'',view.provisioningLoadGeneration||0]):'';
 const consumer=createConsumer({getProvider:()=>view.getProjectOverviewApi(),getScope:scope,clock});
 const visible=()=>!closed&&!view.contextHistoryViewClosed&&view.contentEl?.isConnected&&document.visibilityState!=='hidden'&&view.app.workspace.activeLeaf===view.leaf;
 const lifecycle=createLifecycle({getProvider:()=>view.getProjectOverviewApi(),getScope:scope,isVisible:visible,isPending:()=>pending,clock,schedule,cancel,enqueue,onError:()=>showPending('状态核验暂不可用，原内容与输入已保留。'),onState:()=>{Promise.resolve(view.render({trackingAutomatic:true})).catch(()=>{});}});
 const hasInput=()=>!!view.promptLock||!!view.contentEl?.querySelector?.('.collection-card-note-editor')&&Object.values(view.noteEditorState||{}).some(x=>x?.isEditing);
 const isLoading=()=>blockedLoad||(view.provisioningLoadCount||0)>0;
 function showPending(message='追踪状态待核验，原内容与输入已保留。'){
  if(closed)return;pending=true;
  const host=view.contentEl;host?.setAttribute?.('aria-busy','true');host?.classList?.add('is-collection-tracking-pending');
  if(!banner?.isConnected){
   banner=host.createDiv({cls:'collection-tracking-pending-banner',attr:{role:'status','aria-live':'polite'}});
   host.insertBefore(banner,host.firstChild);
   banner.style.cssText='position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:10px;border:1px solid var(--background-modifier-border);border-left:3px solid var(--interactive-accent);border-radius:8px;background:var(--background-primary);color:var(--text-muted);font-size:var(--font-ui-small)';
   banner.createSpan({cls:'collection-tracking-message'});
   const retry=banner.createEl('button',{text:'重新核验',attr:{type:'button'}});
   retry.onclick=()=>{if(blockedLoad&&!(view.provisioningLoadCount>0)&&!hasInput())Promise.resolve(view.reload()).catch(()=>showPending('页面加载未完成，请重新核验。'));else lifecycle.poke('manual');};
  }
  const label=banner.querySelector('.collection-tracking-message');if(label)label.textContent=message;
 }
 function finish(){if(closed)return;pending=false;banner?.remove();banner=null;view.contentEl?.removeAttribute?.('aria-busy');view.contentEl?.classList?.remove('is-collection-tracking-pending');}
 function prepare(pass){
  if(closed)return false;
  for(const el of controls){
   if(!el.isConnected){controls.delete(el);continue;}
   const binding=tokens.get(el),state=view.noteEditorState?.[binding.token.itemId];
   el.disabled=state?.editorToken===binding.token&&state.saving===true;
  }
  if(isLoading()){showPending('页面来源尚未加载完成，原画面已保留。');return false;}
  if(pass.status!=='ready'){showPending();return false;}
  if(hasInput()){showPending('输入已保留。请保存或取消编辑后更新视图。');return false;}
  return true;
 }
 function makeEditorToken(item){const token=Object.freeze({scope:scope(),itemId:item?.id||'',tabId:item?.tabId||'',notePath:item?.noteBinding?.path||''});leases.add(token);return token;}
 function validEditorToken(token){const item=view.data.itemsById?.[token?.itemId];return !closed&&!!token&&leases.has(token)&&token.scope===scope()&&!!item&&item.tabId===token.tabId&&item.noteBinding?.path===token.notePath;}
 function canSaveEditor(token){if(isLoading()||view.historySession||!validEditorToken(token))return false;const p=consumer.capture();return p.status==='ready'&&!view.isStoppedContextTabRaw(token.tabId,p);}
 function stamp(element,token,role){tokens.set(element,{token,role});controls.add(element);}
 function eventToken(target){for(let e=target;e&&e!==view.contentEl;e=e.parentElement){const found=tokens.get(e);if(found)return found;}return null;}
 function allowEvent(event){
  if(closed)return false;
  const target=event.target;
  if(target?.closest?.('.collection-tracking-pending-banner'))return true;
  // History's pre-existing fence remains authoritative; no editor exception in history.
  const edit=eventToken(target),key=String(event.key||'').toLowerCase(),saveShortcut=event.type==='keydown'&&(event.ctrlKey||event.metaKey)&&key==='s';
  if(edit&&!view.historySession){
   if(edit.role==='cancel'&&event.type==='click')return validEditorToken(edit.token);
   if(edit.role==='save'&&event.type==='click'||edit.role==='text'&&saveShortcut)return canSaveEditor(edit.token);
   if(edit.role==='text'){
    if(event.type==='keydown'&&(event.ctrlKey||event.metaKey)&&['c','a'].includes(key))return true;
    if(view.noteEditorState?.[edit.token.itemId]?.saving)return false;
    return validEditorToken(edit.token)&&!['contextmenu','drop','dragstart','dragover','dblclick','auxclick'].includes(event.type);
   }
  }
  if(!pending)return true;
  if(event.type==='keydown'&&(['arrowup','arrowdown','arrowleft','arrowright','pageup','pagedown','home','end','tab','shift','control','alt','meta'].includes(key)||(event.ctrlKey||event.metaKey)&&['c','a'].includes(key)))return true;
  if(event.type==='click'&&target?.closest?.('.collection-context-history-banner'))return true;
  return false;
 }
 function fence(event){if(allowEvent(event))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();if(['click','keydown','drop'].includes(event.type))notice('追踪状态或编辑目标已变化，请先重新核验；输入仍保留。');}
 TYPES.forEach(type=>view.contentEl.addEventListener(type,fence,true));cleanup.push(()=>TYPES.forEach(type=>view.contentEl.removeEventListener(type,fence,true)));
 function listen(target,name,fn){target.addEventListener(name,fn);cleanup.push(()=>target.removeEventListener(name,fn));}
 return Object.freeze({consumer,lifecycle,scope,hasInput,isLoading,prepare,finish,showPending,makeEditorToken,validEditorToken,canSaveEditor,stamp,
  deferLoad(load){if(view.promptLock){showPending('请先完成当前弹窗操作，再重新打开目标页面。');return true;}if(!hasInput())return false;deferredLoad=load;showPending('输入已保留。保存或取消编辑后再加载请求的页面。');return true;},
  afterInput(){if(closed||hasInput())return;if(deferredLoad){const load=deferredLoad;deferredLoad=null;Promise.resolve().then(()=>{if(!closed)return load();}).catch(()=>showPending('页面加载未完成，请重新核验。'));}else lifecycle.poke('local');},
  start(){if(closed||started)return;started=true;listen(window,EVENT,()=>lifecycle.poke());listen(window,'focus',()=>lifecycle.poke('focus'));listen(window,'blur',()=>lifecycle.blur());listen(document,'visibilitychange',()=>lifecycle.poke());const ref=view.app.workspace.on('active-leaf-change',()=>lifecycle.poke());cleanup.push(()=>view.app.workspace.offref(ref));lifecycle.poke('local');},
  sourceChanging(){blockedLoad=true;showPending();},
  loaded(){blockedLoad=false;},
  currentKeys(){return consumer.current().keys||[];},
  stopped(label,pass=consumer.current()){return pass.classify(label)==='stopped';},
  close(){if(closed)return;closed=true;deferredLoad=null;controls.clear();lifecycle.close();consumer.close();for(const fn of cleanup.splice(0))fn();},
 });
}
module.exports={createAdapter,EVENT};

return module.exports;})();
"use strict";
// Session-only owner UI. No owner data, selection, or collapse state is mutated.
class ContextHistoryPanel {
  constructor({ host, source, read, openNote, onReturn }) {
    this.host = host; this.source = source; this.read = read; this.openNote = openNote; this.onReturn = onReturn;
    this.serial = 0; this.pane = null; this.hidden = []; this.closed = false;
  }
  isOpen() { return !!this.pane?.isConnected; }
  close() {
    ++this.serial;
    this.pane?.remove(); this.pane = null;
    for (const [el, hidden] of this.hidden) if (el.isConnected) el.hidden = hidden;
    this.hidden = []; this.request = null;
  }
  dispose() { this.closed = true; this.close(); }
  async open(request) {
    this.close();
    if (this.closed || !this.host.isConnected || !request?.source || this.source() !== request.source || (request.isLive && !request.isLive())) return false;
    const serial = this.serial;
    let snapshot;
    try { snapshot = this.read(request); } catch (_) { return false; }
    if (!snapshot || !Array.isArray(snapshot.items) || snapshot.items.length > 10000) return false;
    const ids = new Set();
    for (const item of snapshot.items) { if (!item?.id || ids.has(item.id)) return false; ids.add(item.id); }
    if (request.itemId && !ids.has(request.itemId)) return false;
    this.request = { ...request };
    this.hidden = Array.from(this.host.children).map(el => [el, el.hidden]);
    this.hidden.forEach(([el]) => { el.hidden = true; });
    const pane = this.host.createDiv({ cls: "context-history-panel" }); this.pane = pane;
    pane.style.cssText = "padding:18px;overflow:auto;height:100%;box-sizing:border-box;";
    pane.createEl("h3", { text: `历史回看 · ${snapshot.title || "已停止追踪"}` });
    pane.createEl("p", { text: "只读回看，追踪状态保持不变。" });
    pane.createEl("button", { text: "返回当前" }).onclick = () => { this.close(); this.onReturn?.(); };
    const list = pane.createDiv({ cls: "context-history-items" });
    const byId = new Map(snapshot.items.map(x => [x.id, x])); let target;
    for (const item of snapshot.items) {
      let depth = 0, parent = item.parentId; const seen = new Set([item.id]);
      while (parent && byId.has(parent) && !seen.has(parent) && depth < 20) { seen.add(parent); depth++; parent = byId.get(parent).parentId; }
      const row = list.createDiv({ cls: "context-history-item" }); row.dataset.historyItemId = item.id;
      row.style.cssText = `margin:10px 0 10px ${depth * 18}px;padding:12px;border:1px solid var(--background-modifier-border);border-radius:10px;`;
      row.createEl("strong", { text: String(item.title || "未命名条目") });
      if (item.body) { const body = row.createDiv({ text: String(item.body) }); body.style.whiteSpace = "pre-wrap"; }
      if (item.notePath && this.openNote) row.createEl("button", { text: "打开已有笔记" }).onclick = () => this.openNote(item.notePath);
      if (item.id === request.itemId) target = row;
    }
    if (!snapshot.items.length) list.createEl("p", { text: "此胶囊没有保留条目。" });
    // A bounded wait confirms the actual owner DOM, never just a queued request.
    await new Promise(resolve => setTimeout(resolve, 0));
    if (this.closed || serial !== this.serial || this.source() !== request.source || (request.isLive && !request.isLive()) || !pane.isConnected || !this.host.contains(pane)) {
      if (serial === this.serial) this.close();
      return false;
    }
    if (request.itemId && (!target?.isConnected || !pane.contains(target))) { this.close(); return false; }
    if (target) { target.style.outline = "2px solid var(--interactive-accent)"; target.scrollIntoView({ block: "center", behavior: "auto" }); }
    return true;
  }
}
function allStopped(entries, classify) {
  return Array.isArray(entries) && entries.length > 0 && entries.every(x => typeof x?.keyword === "string" && x.keyword.trim() && classify(x.keyword) === true);
}


function isStoppedContextKeyword(keyword) {
  try { return window.__projectExecutionOverviewPluginApi?.isContextKeywordStoppedV1?.(keyword) === true; }
  catch (_) { return false; }
}
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// action-entry.cjs
var require_action_entry = __commonJS({
  "action-entry.cjs"(exports2, module2) {
    const module = module2; const exports = exports2;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/collection-card-view/action-entry.mjs
var action_entry_exports = {};
__export(action_entry_exports, {
  create: () => create,
  enqueue: () => enqueue,
  prepare: () => prepare,
  syncHosts: () => syncHosts
});
module.exports = __toCommonJS(action_entry_exports);
var import_node_crypto = require("node:crypto");

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/next-action-workbench/src/refresh-support.mjs
function snapshotFailure(snapshot, validation) {
  if (validation?.ok) return null;
  const gtdNotReady = (Array.isArray(snapshot?.diagnostics) ? snapshot.diagnostics.slice(0, 20) : []).some((d) => d?.code === "gtd-owner-not-ready" && d?.providerId === "gtd-task-manager" && ["engine-source-mismatch-or-not-ready", "engine-source-mismatch", "engine-api-not-ready"].includes(d?.reason));
  if (gtdNotReady) return { code: "gtd-owner-not-ready", stage: "qualification", reason: "GTD \u672A\u5C31\u7EEA\u6216\u6765\u6E90\u4E0D\u5339\u914D\uFF0C\u8BF7\u6253\u5F00\u5BF9\u5E94 GTD \u9875\u9762\u540E\u91CD\u65B0\u68C0\u67E5\uFF1B\u5F53\u524D\u672A\u6388\u6743\u5199\u5165" };
  const raw = snapshot?.reason || snapshot?.diagnostics?.[0]?.code || validation?.reason || "snapshot-malformed";
  const code = typeof raw === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(raw) ? raw : "snapshot-malformed";
  let category = "\u5FEB\u7167\u7ED3\u6784\u6216\u8EAB\u4EFD\u4E0D\u5339\u914D";
  if (/timeout/i.test(code)) category = "\u8D44\u683C\u8BFB\u53D6\u8D85\u65F6";
  else if (/torn|unstable/i.test(code)) category = "\u6765\u6E90\u6B63\u5728\u53D8\u5316\uFF0C\u672A\u53D6\u5F97\u7A33\u5B9A\u5FEB\u7167";
  else if (/unavailable|missing|not-ready/i.test(code)) category = "\u8D44\u683C\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA";
  else if (snapshot?.truncated || snapshot?.hasMore) category = "\u8D44\u683C\u5FEB\u7167\u88AB\u622A\u65AD";
  return { code, stage: "qualification", reason: `\u6709\u6548\u4E3B\u952E\u5FEB\u7167\u4E0D\u5B8C\u6574\uFF1A${category}\uFF08${code}\uFF09\uFF0C\u53EF\u91CD\u8BD5` };
}

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/next-action-workbench/src/store.mjs
var OBSERVATION_STATES = Object.freeze([
  "fresh-complete",
  "fresh-truncated",
  "provider-unavailable",
  "timeout",
  "malformed",
  "source-missing",
  "membership-inactive"
]);
var text = (value, fallback = "") => {
  const normalized = value == null ? "" : String(value).trim();
  return normalized || fallback;
};
var encode = (value) => encodeURIComponent(text(value));
var unique = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean)));
var keywordCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
function normalizePrimaryRef(value = {}) {
  const providerId = text(value.providerId || value.sourcePlugin, "mandala-time-blocks");
  const domain = text(value.domain || value.sourceType);
  const sourceScope = text(value.sourceScope || value.sourceNotePath);
  const sourceKey = text(value.sourceKey || value.sourceId || value.nodeId);
  const identityVersion = Math.max(1, Number(value.identityVersion) || 1);
  if (!providerId || !["goal", "project"].includes(domain) || !sourceScope || !sourceKey) {
    throw new Error("\u4E3B\u952E\u8EAB\u4EFD\u7F3A\u5C11 provider/domain/sourceScope/sourceKey");
  }
  return { providerId, domain, sourceScope, sourceKey, identityVersion };
}
function buildMembershipId(primaryRef) {
  const ref = normalizePrimaryRef(primaryRef);
  return `membership::${[ref.providerId, ref.domain, ref.sourceScope, ref.sourceKey, `v${ref.identityVersion}`].map(encode).join("::")}`;
}
function targetAliasSet(target = {}) {
  return new Set(unique([
    target.sourceKey,
    target.sourceId,
    target.nodeId,
    target.externalKey,
    ...Array.isArray(target.aliases) ? target.aliases : []
  ]));
}
function isWorkspaceJumpNodeKey(value) {
  const raw = text(value);
  if (!raw.startsWith("jump:v1:")) return false;
  const segments = raw.slice("jump:v1:".length).split("|");
  if (segments.length !== 5) return false;
  try {
    const decoded = segments.map((segment) => decodeURIComponent(segment).trim());
    return decoded.every(Boolean) && decoded[0] === "workspace-mount-view";
  } catch (_) {
    return false;
  }
}
function isMandalaGoalJumpNodeKey(value) {
  const raw = text(value);
  if (!raw.startsWith("jump:v1:")) return false;
  const segments = raw.slice("jump:v1:".length).split("|");
  if (segments.length !== 5) return false;
  try {
    const decoded = segments.map((segment) => decodeURIComponent(segment).trim());
    return decoded.every(Boolean) && decoded[0] === "mandala-time-blocks" && decoded[2] === "node" && decoded[3] === "mandala";
  } catch (_) {
    return false;
  }
}
function resolveActiveTargets(mandalaSnapshot, options = {}) {
  const domain = text(options.domain, "project");
  const expectedType = domain === "goal" ? "mandala-effective-goal-operational-context-keys-v1" : "mandala-effective-operational-context-keys-v1";
  const snapshotTargets = Array.isArray(mandalaSnapshot?.targets) ? mandalaSnapshot.targets : null;
  const count = Number(mandalaSnapshot?.count);
  const returnedCount = Number(mandalaSnapshot?.returnedCount);
  const totalCount = Number(mandalaSnapshot?.totalCount);
  const limit = Number(mandalaSnapshot?.limit);
  const generatedAt = text(mandalaSnapshot?.generatedAt);
  const sourceScope = text(mandalaSnapshot?.sourceScope);
  const sourceNotePath = text(mandalaSnapshot?.sourceNotePath);
  if (mandalaSnapshot?.ok !== true || mandalaSnapshot?.complete !== true || Number(mandalaSnapshot?.contractVersion) !== 1 || text(mandalaSnapshot?.snapshotType) !== expectedType || mandalaSnapshot?.truncated === true || mandalaSnapshot?.hasMore === true || !snapshotTargets || count !== snapshotTargets.length || returnedCount !== snapshotTargets.length || !Number.isInteger(totalCount) || totalCount < count || !Number.isInteger(limit) || limit < totalCount || limit > 500 || !text(mandalaSnapshot?.revision) || !text(mandalaSnapshot?.providerGeneration || mandalaSnapshot?.instanceId) || !generatedAt || !Number.isFinite(Date.parse(generatedAt)) || !sourceScope || sourceScope !== sourceNotePath || !Array.isArray(mandalaSnapshot?.diagnostics)) {
    return { ok: false, reason: "mandala-snapshot-malformed", targets: [] };
  }
  const seen = /* @__PURE__ */ new Set();
  const targets = [];
  try {
    snapshotTargets.forEach((target) => {
      const sourceKey = text(target?.sourceKey);
      const aliases = Array.isArray(target?.aliases) ? target.aliases.map((value) => text(value)) : [];
      const contextKey = target?.contextKey;
      if (text(target?.sourcePlugin) !== "mandala-time-blocks" || text(target?.domain) !== domain || text(target?.sourceType) !== domain || text(target?.sourceScope) !== sourceScope || text(target?.sourceNotePath) !== sourceNotePath || Number(target?.identityVersion) !== 1 || !(domain === "goal" ? isMandalaGoalJumpNodeKey(sourceKey) : isWorkspaceJumpNodeKey(sourceKey)) || text(target?.sourceId) !== sourceKey || text(target?.nodeId) !== sourceKey || text(target?.status) !== "active" || target?.active !== true || text(target?.lifecycleState) !== "active" || !text(target?.label) || !text(target?.pathLabel) || !Number.isFinite(Number(target?.order)) || aliases.length === 0 || aliases.some((alias) => !alias) || new Set(aliases).size !== aliases.length || !aliases.includes(sourceKey) || !contextKey || !text(contextKey?.contextKeyId) || !text(contextKey?.address) || !text(contextKey?.canonicalLabel) || !text(contextKey?.displayLabel) || text(target?.evidenceRevision) !== text(mandalaSnapshot?.revision)) throw new Error("effective-operational-context-target-malformed");
      const ref = normalizePrimaryRef(target);
      const membershipId = buildMembershipId(ref);
      if (seen.has(sourceKey) || seen.has(membershipId)) throw new Error("effective-operational-context-owner-duplicate");
      seen.add(sourceKey);
      seen.add(membershipId);
      targets.push({
        membershipId,
        primaryRef: ref,
        primaryAliases: Array.from(targetAliasSet(target)),
        label: text(target?.label, ref.sourceKey),
        pathLabel: text(target?.pathLabel, ref.sourceKey),
        order: Number(target?.order),
        eligibilityRevision: text(mandalaSnapshot.revision),
        eligibilityObservedAt: generatedAt,
        ineligibilityReasons: []
      });
    });
  } catch (_) {
    return { ok: false, reason: "mandala-snapshot-malformed", targets: [] };
  }
  targets.sort((left, right) => left.primaryRef.domain.localeCompare(right.primaryRef.domain) || left.order - right.order || left.label.localeCompare(right.label, "zh-CN"));
  return { ok: true, revision: text(mandalaSnapshot.revision), targets };
}

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/collection-card-view/action-entry.mjs
var hash = (value) => (0, import_node_crypto.createHash)("sha256").update(value).digest("hex");
var plain = (value) => value && typeof value === "object" && !Array.isArray(value);
var fail = (reason) => {
  throw new Error(reason);
};
var bounded = async (task, stage = "qualification") => {
  let timer;
  try {
    return await Promise.race([task(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`${stage === "qualification" ? "\u6709\u6548\u4E3B\u952E" : "\u4E0A\u4E0B\u6587\u5B9A\u4E49"}\u8BFB\u53D6\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5`), { code: "READ_TIMEOUT", stage })), 8e3);
    })]);
  } finally {
    clearTimeout(timer);
  }
};
function enqueue(plugin, path, task) {
  plugin.actionWriteQueues ||= /* @__PURE__ */ new Map();
  const run = (plugin.actionWriteQueues.get(path) || Promise.resolve()).catch(() => {
  }).then(task);
  plugin.actionWriteQueues.set(path, run);
  void run.finally(() => {
    if (plugin.actionWriteQueues.get(path) === run) plugin.actionWriteQueues.delete(path);
  }).catch(() => {
  });
  return run;
}
function syncHosts(plugin, path, data) {
  for (const leaf of plugin.app.workspace.getLeavesOfType("collection-card-view")) {
    const view = leaf.view;
    if (view?.dataPath !== path) continue;
    const activeTabId = view.data?.activeTabId;
    const collapsed = view.data?.tabTreeCollapsedById;
    view.data = JSON.parse(JSON.stringify(data));
    if (view.data.tabsById[activeTabId]) view.data.activeTabId = activeTabId;
    view.data.tabTreeCollapsedById = collapsed || {};
  }
}
function assertAlive(plugin) {
  if (plugin.actionEntryClosed) fail("Collection Card \u6B63\u5728\u5378\u8F7D\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u540E\u91CD\u8BD5");
}
async function readTarget(plugin, options) {
  assertAlive(plugin);
  const domain = options.domain;
  if (!["project", "goal"].includes(domain)) fail("\u4E3B\u952E\u7C7B\u578B\u65E0\u6548");
  const api = globalThis.window?.__mandalaTimeBlocksPluginApi || plugin.app.plugins?.plugins?.["mandala-time-blocks"]?.api;
  const method = domain === "goal" ? "listEffectiveGoalOperationalContextKeys" : "listEffectiveOperationalContextKeys";
  if (typeof api?.[method] !== "function") fail("\u6709\u6548\u4E3B\u952E\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA");
  const snapshot = await bounded(() => api[method]({ consumer: "collection-card-view.action-entry" }));
  const failure = snapshotFailure(snapshot, resolveActiveTargets(snapshot, { domain }));
  if (failure) throw Object.assign(new Error(failure.reason), failure);
  const target = snapshot.targets.find((t) => t.sourceKey === options.primaryNodeKey && t.sourceScope === options.sourceScope);
  if (!target) fail("\u8BE5\u4E3B\u952E\u5F53\u524D\u5DF2\u4E0D\u5728\u6709\u6548\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E2D");
  const requested = options.sourceNotePath || plugin.getDefaultSourceNotePath();
  const file = plugin.app.vault.getAbstractFileByPath(requested);
  if (!file || file.path !== requested || !file.extension) fail("Collection Card \u6765\u6E90\u7B14\u8BB0\u4E0D\u5B58\u5728");
  const dataPath = plugin.resolveDataPathForFile(file);
  const keywordPath = plugin.resolveTabCapsuleKeywordsPathForFile(file);
  for (const leaf of plugin.app.workspace.getLeavesOfType("collection-card-view")) {
    const view = leaf.view;
    if (view?.dataPath === dataPath && (view.provisioningLoadCount || !view.isReady())) fail("Collection Card \u6B63\u5728\u52A0\u8F7D\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  }
  const [raw, keywordRaw] = await Promise.all([plugin.app.vault.adapter.read(dataPath), plugin.app.vault.adapter.read(keywordPath)]);
  const data = JSON.parse(raw), keywords = JSON.parse(keywordRaw);
  if (data.schemaVersion !== "1.0" || !plain(data.tabsById) || !plain(data.itemsById) || !plain(data.childrenByParentByTab) || !plain(keywords.assignmentsByKeywordKey)) fail("Collection Card \u6570\u636E\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF0C\u672A\u5199\u5165");
  const context = target.contextKey;
  const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const keys = await bounded(() => plugin.getProjectOverviewApi()?.getContextCapsuleKeys(), "context-binding");
  if (!Array.isArray(keys)) fail("\u64CD\u4F5C\u4E0A\u4E0B\u6587\u5B9A\u4E49\u5C1A\u672A\u5C31\u7EEA");
  const descriptors = keys.filter((k) => (k.contextKeyId || k.id) === context.contextKeyId);
  if (descriptors.length !== 1 || normalize(descriptors[0].displayLabel) !== normalize(context.displayLabel)) fail("\u64CD\u4F5C\u4E0A\u4E0B\u6587\u5B9A\u4E49\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00");
  const tabIds = /* @__PURE__ */ new Set();
  for (const entry of Object.values(keywords.assignmentsByKeywordKey)) {
    if (!plain(entry)) fail("Tab \u7ED1\u5B9A\u6570\u636E\u5F02\u5E38");
    const matchingKeys = keys.filter((k) => normalize(k.displayLabel) === normalize(entry.keyword) || !/^\d+[a-z0-9]*\s*[-－—–]/i.test(entry.keyword || "") && normalize(k.canonicalLabel) === normalize(entry.keyword));
    if (!matchingKeys.some((k) => (k.contextKeyId || k.id) === context.contextKeyId)) continue;
    if (matchingKeys.length !== 1 || entry.sourceNotePath && entry.sourceNotePath !== requested) fail("\u64CD\u4F5C\u4E0A\u4E0B\u6587\u7ED1\u5B9A\u4E0D\u552F\u4E00");
    if (!data.tabsById[entry.tabId]) fail("\u7ED1\u5B9A\u7684 Collection Card Tab \u5DF2\u4E0D\u5B58\u5728");
    tabIds.add(entry.tabId);
  }
  if (tabIds.size !== 1) fail(tabIds.size ? "\u8BE5\u4E3B\u952E\u5BF9\u5E94\u591A\u4E2A Tab\uFF0C\u8BF7\u5148\u5728 Collection Card \u4E2D\u660E\u786E\u7ED1\u5B9A" : "\u8BE5\u4E3B\u952E\u5C1A\u672A\u7ED1\u5B9A Collection Card Tab\uFF0C\u8BF7\u5148\u5B8C\u6210\u7ED1\u5B9A");
  const tabId = [...tabIds][0];
  const descriptor = {
    sourceNotePath: requested,
    tabId,
    tabName: data.tabsById[tabId].name,
    contextKeyId: context.contextKeyId,
    contextLabel: context.displayLabel,
    primaryNodeKey: target.sourceKey,
    sourceScope: target.sourceScope,
    domain,
    revision: hash(raw),
    bindingRevision: hash(keywordRaw)
  };
  return { descriptor, data, raw, keywordRaw, dataPath, keywordPath };
}
async function prepare(plugin, options) {
  try {
    return { ok: true, ...(await readTarget(plugin, options)).descriptor };
  } catch (error) {
    return { ok: false, reason: error.message, code: error.code || "PREPARE_FAILED", stage: error.stage || "prepare" };
  }
}
async function create(plugin, options) {
  const expected = options.destination;
  if (!expected || !/^[a-f0-9-]{36}$/i.test(options.requestId || "") || !String(options.title || "").trim()) return { ok: false, notWritten: true, reason: "\u65B0\u589E\u8BF7\u6C42\u4E0D\u5B8C\u6574" };
  const file = plugin.app.vault.getAbstractFileByPath(expected.sourceNotePath);
  if (!file) return { ok: false, notWritten: true, reason: "\u6765\u6E90\u7B14\u8BB0\u4E0D\u5B58\u5728" };
  const dataPath = plugin.resolveDataPathForFile(file);
  return enqueue(plugin, dataPath, async () => {
    let persisted = false, result, auditHandle, saveAttempted = false, confirmedAbsent = false;
    const audit = plugin.app.plugins?.plugins?.["operation-audit-trail"]?.api || globalThis.window?.__operationAuditTrailApi;
    try {
      assertAlive(plugin);
      const title = String(options.title).trim();
      const fingerprint = hash(JSON.stringify([expected.sourceNotePath, expected.tabId, expected.contextKeyId, expected.primaryNodeKey, expected.domain, title]));
      const requestId = options.requestId;
      const prior = JSON.parse(await plugin.app.vault.adapter.read(dataPath));
      const receipt = prior.actionEntryReceipts?.[requestId];
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) fail("\u540C\u4E00\u8BF7\u6C42\u7684\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u7F16\u8F91\u5668");
        return { ...receipt.result, replayed: true, deleted: !prior.itemsById?.[receipt.result.itemId] };
      }
      if (prior.schemaVersion !== "1.0" || !plain(prior.itemsById) || prior.actionEntryReceipts && !plain(prior.actionEntryReceipts)) fail("\u96C6\u5408\u5361\u6570\u636E\u5F02\u5E38\uFF0C\u65E0\u6CD5\u786E\u8BA4\u4E0A\u6B21\u4FDD\u5B58\u7ED3\u679C");
      confirmedAbsent = true;
      const current = await readTarget(plugin, expected);
      for (const key of ["sourceNotePath", "tabId", "contextKeyId", "primaryNodeKey", "domain", "sourceScope", "bindingRevision"]) {
        if (current.descriptor[key] !== expected[key]) fail("\u76EE\u6807 Tab \u6216\u4E0A\u4E0B\u6587\u7ED1\u5B9A\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u7F16\u8F91\u5668");
      }
      try {
        auditHandle = await audit?.beginOperation?.({
          "\u6765\u6E90\u63D2\u4EF6": "collection card view",
          "\u64CD\u4F5C\u7C7B\u578B": "\u65B0\u589E",
          "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
          "\u5BF9\u8C61\u540D\u79F0": title,
          "\u6570\u636E\u4F4D\u7F6E": dataPath,
          "\u4FEE\u6539\u6458\u8981": "\u4ECE\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0\u65B0\u589E\u6839\u6761\u76EE",
          "\u6269\u5C55_collection_tab": expected.tabId,
          "\u6269\u5C55_request_id": requestId
        });
      } catch (_) {
      }
      const keywordRaw = await plugin.app.vault.adapter.read(current.keywordPath);
      if (keywordRaw !== current.keywordRaw) fail("\u4E0A\u4E0B\u6587\u7ED1\u5B9A\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u8BD5");
      assertAlive(plugin);
      const itemId = `item_naw_${requestId}`;
      const nodeKey = `jump:v1:${["collection-card-view", expected.sourceNotePath, "tab", expected.tabId, itemId].map(encodeURIComponent).join("|")}`;
      result = { ok: true, persisted: true, nodeKey, itemId, tabId: expected.tabId, sourceNotePath: expected.sourceNotePath };
      const dataFile = plugin.app.vault.getAbstractFileByPath(dataPath);
      if (!dataFile) fail("Collection Card \u539F\u5B50\u4FDD\u5B58\u80FD\u529B\u4E0D\u53EF\u7528");
      // Before saveAttempted: an unavailable center provider leaves the request notWritten.
      const centerConsumer = plugin.getCenterNamingConsumerV1();
      centerConsumer.preflight();
      // Fixed outside the publication callback, which the final publisher may run twice.
      const now = new Date().toISOString();
      let saved;
      saveAttempted = true;
      await centerConsumer.publish(dataPath, (raw) => {
        assertAlive(plugin);
        if (raw !== current.raw) fail("\u96C6\u5408\u5361\u5185\u5BB9\u521A\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u8BD5");
        const data = JSON.parse(raw);
        const rootKey = `${expected.tabId}::__root__`;
        if (!data.tabsById[expected.tabId] || data.itemsById[itemId] || data.childrenByParentByTab[rootKey] && !Array.isArray(data.childrenByParentByTab[rootKey])) fail("\u76EE\u6807\u6570\u636E\u5DF2\u53D8\u5316");
        data.itemsById[itemId] = { id: itemId, title, comment: "", tabId: expected.tabId, parentId: null, isCollapsed: false, noteExpanded: false, noteBinding: null, createdAt: now, updatedAt: now };
        data.childrenByParentByTab[rootKey] = [itemId, ...data.childrenByParentByTab[rootKey] || []];
        data.actionEntryReceipts ||= {};
        data.actionEntryReceipts[requestId] = { fingerprint, result, createdAt: now };
        data.lastModified = now;
        saved = data;
        return JSON.stringify(data, null, 2);
      }, expected.sourceNotePath);
      persisted = true;
      syncHosts(plugin, dataPath, saved);
      const confirmed = JSON.parse(await plugin.app.vault.adapter.read(dataPath));
      if (confirmed.actionEntryReceipts?.[requestId]?.fingerprint !== fingerprint || confirmed.itemsById?.[itemId]?.title !== title) fail("\u4FDD\u5B58\u7ED3\u679C\u5F85\u786E\u8BA4\uFF0C\u8BF7\u7528\u540C\u4E00\u8BF7\u6C42\u91CD\u8BD5");
      plugin.dispatchContextCarrierChanged("next-action-root-created", { sourceNotePath: expected.sourceNotePath, immediate: true });
      for (const leaf of plugin.app.workspace.getLeavesOfType("collection-card-view")) {
        if (leaf.view?.dataPath === dataPath) void Promise.resolve(leaf.view.render()).catch(() => {
        });
      }
      return result;
    } catch (error) {
      console.warn("[CollectionCard][action-entry]", { requestId: options.requestId, persisted, reason: error.message });
      return { ok: false, persisted, notWritten: confirmedAbsent && !saveAttempted, reason: error.message, code: error.code || "CREATE_FAILED", stage: error.stage || "create", ...persisted ? { nodeKey: result?.nodeKey } : {} };
    } finally {
      try {
        if (auditHandle?.operationId) await audit.finishOperation(auditHandle.operationId, { "\u7ED3\u679C": persisted ? "success" : "failed" });
      } catch (_) {
      }
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  create,
  enqueue,
  prepare,
  syncHosts
});

  }
});

// main.source.js
const C2InputRecovery=(()=>{const module={exports:{}};
'use strict';
// Text-only recovery, never a business snapshot or an automatic replay command.
const installed=new WeakMap();
const SEARCH_HINTS=new Set(['输入范式名称、ID 或定义源筛选','输入 Tab 名称、ID 或 emoji 筛选','输入标签名称或 ID 筛选','输入关键词片段、完整路径或 ID 筛选','搜索关键词或节点名','按旧事项名或评论关键词筛选 staging 块']);
function createBox(storage,vault,owner){
 const prefix='ckm-input-v1:'+encodeURIComponent(vault)+':'+owner+':';
 function list(){const rows=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix)){const raw=storage.getItem(key);let row;try{row=JSON.parse(raw);}catch{throw Error('input-backup-invalid');}if(!row||typeof row.text!=='string')throw Error('input-backup-invalid');rows.push({...row,key,raw});}}return rows;}
 function save(id,data){const key=prefix+id,raw=JSON.stringify({...data,updatedAt:Date.now()}),rows=list(),others=rows.filter(r=>r.key!==key);if(others.length>=128||others.reduce((n,r)=>n+r.raw.length*2,raw.length*2)>2*1024*1024)throw Error('input-backup-capacity');storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('input-backup-readback');return {key,raw};}
 function remove(key,raw){if(!key.startsWith(prefix)||storage.getItem(key)!==raw)throw Error('input-backup-changed');storage.removeItem(key);}
 return {list,save,remove};
}
function install(plugin,{Modal,Notice},storage){
 if(installed.has(plugin))return installed.get(plugin);
 const app=plugin.app,owner=plugin.manifest.id;
 const live=()=>!controller.closed&&app.plugins?.plugins?.[owner]===plugin;
 let box;const pendingText=new Map();const getBox=()=>box||(box=createBox(storage||globalThis.localStorage,app.vault.adapter.getBasePath(),owner));
 const notice=text=>new Notice(text,10000);
 function source(host){try{return String(host?.sourceFile?.path||host?.sourceNotePath||host?.sourcePath||(['mandala-time-blocks','gtd-task-manager'].includes(owner)?plugin.getPaths?.()?.sourceNotePath||plugin.resolveContextRenameScope?.()?.sourceNotePath||plugin.settings?.sourceNotePath:'')||'');}catch{return '';}}
 class RecoveryModal extends Modal{
  onOpen(){const root=this.contentEl;root.empty();root.createEl('h2',{text:'输入恢复箱'});root.createEl('p',{text:'这里保留编辑过的文本。是否保存成功以原编辑入口为准；可复制后回原入口重新核对，不会自动覆盖业务内容。'});
   let rows=[];try{rows=getBox().list();}catch(e){root.createEl('p',{text:'持久备份读取失败：'+e.message});}
   try{for(const r of [...pendingText.values()].map(r=>({...r,memoryOnly:true})).concat(rows)){const row=root.createDiv();row.createEl('h3',{text:r.title||'文本输入'});row.createEl('p',{text:r.source||'来源未能确定，请核对后手动复制'});row.createEl('p',{text:r.memoryOnly?'仅在本次会话保留，尚未写入备份。请立即复制，勿重载插件。':new Date(r.updatedAt).toLocaleString()});const input=row.createEl('textarea');input.value=r.text;input.readOnly=true;input.style.width='100%';input.rows=5;
    row.createEl('button',{text:'选中文本'}).onclick=()=>{input.focus();input.select();};
    if(r.source)row.createEl('button',{text:'打开原来源'}).onclick=async()=>{try{if(!live())throw Error('plugin-unavailable');const f=app.vault.getAbstractFileByPath(r.source);if(!f||f.extension!=='md')throw Error('source-unavailable');await app.workspace.getLeaf(false).openFile(f);}catch(e){notice('无法打开来源：'+e.message);}};
    if(!r.memoryOnly)row.createEl('button',{text:'已核对，清除此份输入备份'}).onclick=()=>{try{if(!live())throw Error('plugin-unavailable');getBox().remove(r.key,r.raw);row.remove();}catch(e){notice('未清除：'+e.message);}};
   }}catch(e){root.createEl('p',{text:'恢复箱暂不可用：'+e.message+'。请保留原编辑窗口并复制输入。'});}
  }
 }
 const controller={closed:false,open(){if(live())new RecoveryModal(app).open();},canLeave(){try{for(const entry of [...pendingText.values()])entry.retry();return true;}catch(e){notice('还有尚未备份的输入，请先复制或清理恢复箱后重试。'+e.message);return false;}},bind(root,host){
  if(!root)return null;const fields=new WeakMap(),pending=new Map(),session=globalThis.crypto.randomUUID();let failure=null;
  const text=e=>e.isContentEditable?e.textContent:e.value;
  const eligible=e=>e?.nodeType===1&&(e.tagName==='TEXTAREA'||e.isContentEditable||e.tagName==='INPUT'&&['text','url','email','number',''].includes(e.type))&&!e.readOnly&&!e.disabled&&!e.hasAttribute('data-input-recovery-ignore')&&!SEARCH_HINTS.has(e.placeholder||'')&&!e.matches('[role="searchbox"],.search-input,.gtd-search-input');
  const save=entry=>{getBox().save(entry.id,{source:entry.source,title:entry.title,field:entry.field,text:entry.text});pending.delete(entry.id);pendingText.delete(entry.id);};
  const flush=()=>{try{for(const entry of [...pending.values()])save(entry);failure=null;return true;}catch(e){failure=e;notice('输入备份未保存，请保留编辑窗口并复制文本；可清理恢复箱后重试。'+e.message);return false;}};
  const handler=e=>{if(!eligible(e.target))return;let entry=fields.get(e.target);const current=source(host);if(!entry||entry.source!==current){entry={id:session+':'+globalThis.crypto.randomUUID(),source:current,field:e.target.getAttribute('name')||e.target.id||'text'};fields.set(e.target,entry);}entry.text=String(text(e.target)||'');entry.title=(host?.titleStr||host?.options?.title||root.querySelector('h1,h2,h3')?.textContent||e.target.getAttribute('aria-label')||e.target.placeholder||'文本输入').slice(0,512);entry.retry=()=>save(entry);pending.set(entry.id,entry);pendingText.set(entry.id,entry);try{if(!live())throw Error('plugin-unavailable');save(entry);failure=pending.size?failure:null;}catch(error){failure=error;e.stopImmediatePropagation();notice('输入尚未备份，请保留窗口并复制文本。'+error.message);}};
  const gate=e=>{if(pending.size&&!eligible(e.target)&&!flush()){e.preventDefault();e.stopImmediatePropagation();}};
  const keyGate=e=>{if(e.key==='Enter'&&!e.isComposing&&pending.size&&!flush()){e.preventDefault();e.stopImmediatePropagation();}};
  root.addEventListener('input',handler,true);
  root.addEventListener('click',gate,true);
  root.addEventListener('keydown',keyGate,true);root.addEventListener('keypress',keyGate,true);
  return {flush,canLeave(){return flush();},dispose(){root.removeEventListener('input',handler,true);root.removeEventListener('click',gate,true);root.removeEventListener('keydown',keyGate,true);root.removeEventListener('keypress',keyGate,true);if(!flush())notice('插件关闭时未能备份全部输入，请保留仍可见的文本。');}};
 },report(error){notice((/unsupported-binding-format|binding-format-unsupported/.test(String(error?.message||error))?'本次保存未完成：主键管理中心的绑定数据格式比本插件更新，请把本插件更新到与管理中心匹配的版本；':'本次保存未完成。请保留编辑内容，待管理中心和相关插件就绪后重试；')+'已编辑文本可在本插件“输入恢复箱”查看。详情：'+String(error?.message||error));}};
 installed.set(plugin,controller);
 plugin.addCommand({id:'open-input-recovery',name:'输入恢复箱（查看与复制）',callback:()=>controller.open()});
 // Bind every registered owner view, including inline editors and custom GTD dialogs.
 const register=plugin.registerView.bind(plugin);plugin.registerView=(type,factory)=>register(type,leaf=>{const view=factory(leaf),binding=controller.bind(view.contentEl||view.containerEl,view);for(const method of ['render','setState']){const original=view[method];if(typeof original==='function')view[method]=function(...args){if(binding&&!binding.canLeave())throw Error('input-backup-required');return original.apply(this,args);};}const close=view.onClose;view.onClose=function(...args){binding?.dispose();return close?.apply(this,args);};return view;});
 plugin.register?.(()=>{controller.closed=true;});
 return controller;
}
function protectModal(Base,owner){return class extends Base{
 open(){const plugin=this.app.plugins?.plugins?.[owner],controller=plugin&&installed.get(plugin);if(controller)this.__inputRecovery=controller.bind(this.contentEl,this);return super.open();}
 close(){if(this.__inputRecovery&&!this.__inputRecovery.canLeave())return;return super.close();}
};}
module.exports={createBox,install,protectModal};

return module.exports;})();
var { Component, ItemView, MarkdownRenderer, Modal: C2BaseModal, Notice, Plugin, TFile } = require("obsidian");
const Modal=C2InputRecovery.protectModal(C2BaseModal,'collection-card-view');
var actionEntry = require_action_entry();
var VIEW_TYPE = "collection-card-view";
var TAB_CAPSULE_KEYWORDS_FILENAME = "Collection_TabCapsuleKeywords.json";
var TAB_CAPSULE_KEYWORDS_SCHEMA_VERSION = 1;
var ROOT_KEY = "__root__";
var DEFAULT_TAB_ID = "tab_default";
var BRIDGE_NAME = "collectionCardCapsuleBridge";
var BRIDGE_VERSION = 1;
var SCRIPT_VERSION = "plugin-vertical-slice.1";
var DEFAULT_SETTINGS = { defaultSourceNotePath: "\u2464\u96C6\u5408\u5361\u89C6\u56FE.md" };
var BRIDGE_CAPABILITIES = ["bridge.getState", "bridge.applyState"];
var RELATIONS_PLUGIN_ID = "eva-cross-view-relations";
var OPERATION_AUDIT_PLUGIN_ID = "operation-audit-trail";
var OPERATION_AUDIT_GLOBAL = "__operationAuditTrailApi";
var PROJECT_OVERVIEW_PLUGIN_ID = "project-execution-overview";
var JUMP_NODE_PREFIX = "jump:v1:";
var JUMP_NODE_SEGMENT_COUNT = 5;
var JUMP_OPENER_REGISTRY_GLOBAL = "__evaCrossViewJumpOpeners";
var nowString = () => (/* @__PURE__ */ new Date()).toISOString();
var text = (value, fallback = "") => String(value == null ? "" : value).trim() || fallback;
var logCollectionJump = (traceId, stage, payload = {}) => {
  const prefix = traceId ? `[Collection Card View][${traceId}]` : "[Collection Card View]";
  let serialized = "";
  try {
    serialized = JSON.stringify(payload);
  } catch (error) {
    serialized = String(payload);
  }
  console.log(`${prefix}[${stage}] ${serialized}`);
};
var clone = (value, fallback = null) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
};
var isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var normalizeKeywordKey = (value) => text(value).toLocaleLowerCase();
var parseContextCapsuleLabel = (value) => {
  const raw = text(value);
  const match = raw.match(/^([0-9]{1,4}[A-Za-z0-9]*)\s*[-－—–]\s*(.*)$/);
  if (!match) return { address: "", canonicalLabel: raw, displayLabel: raw };
  const address = text(match[1]).toUpperCase();
  const canonicalLabel = text(match[2]);
  return {
    address,
    canonicalLabel,
    displayLabel: canonicalLabel ? `${address}- ${canonicalLabel}` : address
  };
};
var normalizeContextCapsuleDisplayLabel = (value) => parseContextCapsuleLabel(value).displayLabel || text(value);
var parentKey = (parentId) => text(parentId) || ROOT_KEY;
var tabParentKey = (tabId, parentId) => `${text(tabId, DEFAULT_TAB_ID)}::${parentKey(parentId)}`;
var uniq = (list) => [...new Set((Array.isArray(list) ? list : []).map((value) => text(value)).filter(Boolean))];
var createId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
var encodeJumpSegment = (value) => encodeURIComponent(text(value, ""));
var decodeJumpSegment = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_) {
    return text(value, "");
  }
};
var buildJumpNodeKey = ({ viewType = "", notePath = "", scopeType = "", scopeId = "", itemId = "" } = {}) => {
  const segments = [viewType, notePath, scopeType, scopeId, itemId].map((value) => text(value, ""));
  if (segments.some((segment) => !segment)) return "";
  return `${JUMP_NODE_PREFIX}${segments.map((segment) => encodeJumpSegment(segment)).join("|")}`;
};
var parseJumpNodeKey = (nodeKey) => {
  const normalized = text(nodeKey, "");
  if (!normalized.startsWith(JUMP_NODE_PREFIX)) return null;
  const encodedSegments = normalized.slice(JUMP_NODE_PREFIX.length).split("|");
  if (encodedSegments.length !== JUMP_NODE_SEGMENT_COUNT) return null;
  const [viewType, notePath, scopeType, scopeId, itemId] = encodedSegments.map((segment) => decodeJumpSegment(segment));
  if (!viewType || !notePath || !scopeType || !scopeId || !itemId) return null;
  return { nodeKey: buildJumpNodeKey({ viewType, notePath, scopeType, scopeId, itemId }), viewType, notePath, scopeType, scopeId, itemId };
};
var buildCollectionJumpNodeKey = (notePath, tabId, itemId) => buildJumpNodeKey({
  viewType: VIEW_TYPE,
  notePath,
  scopeType: "tab",
  scopeId: tabId,
  itemId
});
var parseCollectionJumpNodeKey = (nodeKey) => {
  const parsed = parseJumpNodeKey(nodeKey);
  if (!parsed || parsed.viewType !== VIEW_TYPE || parsed.scopeType !== "tab") return null;
  return parsed;
};
function ensureJumpOpenerRegistry() {
  const existing = window[JUMP_OPENER_REGISTRY_GLOBAL];
  if (existing && typeof existing.register === "function" && typeof existing.unregister === "function" && typeof existing.get === "function") {
    return existing;
  }
  const openersByViewType = /* @__PURE__ */ new Map();
  const registry = {
    version: 1,
    register(descriptor = {}) {
      const openerId = text(descriptor.openerId, "");
      const viewType = text(descriptor.viewType, "");
      if (!openerId || !viewType || typeof descriptor.openNode !== "function") return null;
      openersByViewType.set(viewType, { openerId, viewType, openNode: descriptor.openNode });
      return true;
    },
    unregister(openerId) {
      const targetId = text(openerId, "");
      if (!targetId) return false;
      let removed = false;
      Array.from(openersByViewType.entries()).forEach(([viewType, descriptor]) => {
        if (descriptor?.openerId !== targetId) return;
        openersByViewType.delete(viewType);
        removed = true;
      });
      return removed;
    },
    get(viewType) {
      return openersByViewType.get(text(viewType, "")) || null;
    }
  };
  window[JUMP_OPENER_REGISTRY_GLOBAL] = registry;
  return registry;
}
function defaultData() {
  return {
    schemaVersion: "1.0",
    lastModified: nowString(),
    activeTabId: DEFAULT_TAB_ID,
    tabsById: {
      [DEFAULT_TAB_ID]: { id: DEFAULT_TAB_ID, name: "Default Collection", parentTabId: null, createdAt: nowString(), updatedAt: nowString() }
    },
    tabOrder: [DEFAULT_TAB_ID],
    tabChildrenByParent: { [ROOT_KEY]: [DEFAULT_TAB_ID] },
    tabTreeCollapsedById: {},
    itemsById: {},
    childrenByParentByTab: { [tabParentKey(DEFAULT_TAB_ID, null)]: [] }
  };
}
function defaultTabCapsuleKeywordData() {
  return {
    schemaVersion: TAB_CAPSULE_KEYWORDS_SCHEMA_VERSION,
    assignmentsByKeywordKey: {}
  };
}
function normalizeTabCapsuleKeywordData(raw = {}, options = {}) {
  const sourceNotePath = text(options.sourceNotePath, "");
  const now = nowString();
  const out = defaultTabCapsuleKeywordData();
  if (Object.prototype.hasOwnProperty.call(raw, 'centerBindingReceiptsV1')) {
    if (!isObject(raw.centerBindingReceiptsV1)) throw new Error('Invalid binding receipts');
    out.centerBindingReceiptsV1 = clone(raw.centerBindingReceiptsV1, {});
  }
  if (raw.centerNamingProjectionV1 !== undefined) {
    if (!isObject(raw.centerNamingProjectionV1)) throw new Error("collection-center-receipts-invalid");
    out.centerNamingProjectionV1 = clone(raw.centerNamingProjectionV1, {});
  }
  if (raw.contextCreationReceipts !== undefined) {
    if (!isObject(raw.contextCreationReceipts)) throw new Error("collection-creation-receipts-invalid");
    out.contextCreationReceipts = clone(raw.contextCreationReceipts, {});
  }
  const assignments = isObject(raw?.assignmentsByKeywordKey) ? raw.assignmentsByKeywordKey : {};
  Object.keys(assignments).forEach((rawKey) => {
    const entry = isObject(assignments[rawKey]) ? assignments[rawKey] : {};
    const keyword = text(entry.keyword, text(rawKey, ""));
    const keywordKey = normalizeKeywordKey(entry.keywordKey || rawKey || keyword);
    const tabId = text(entry.tabId, "");
    if (!keyword || !keywordKey || !tabId) return;
    out.assignmentsByKeywordKey[keywordKey] = {
      keyword,
      keywordKey,
      sourceNotePath: text(entry.sourceNotePath, sourceNotePath),
      tabId,
      tabNameSnapshot: text(entry.tabNameSnapshot, ""),
      createdAt: text(entry.createdAt, now),
      updatedAt: text(entry.updatedAt, text(entry.createdAt, now))
    };
  });
  if (raw[Symbol.for("contextKeyRenameGeneration")]) Object.defineProperty(out, Symbol.for("contextKeyRenameGeneration"), { value: raw[Symbol.for("contextKeyRenameGeneration")], configurable: true });
  return out;
}
function normalizeContextCapsuleKeyEntry(entry = {}) {
  if (!isObject(entry)) return null;
  const contextKeyId = text(entry.contextKeyId || entry.id, "");
  const address = text(entry.address, "").toUpperCase();
  const canonicalLabel = text(entry.canonicalLabel || entry.label || entry.displayLabel, "");
  const displayLabel = text(entry.displayLabel, address && canonicalLabel ? `${address}- ${canonicalLabel}` : canonicalLabel || address);
  if (!contextKeyId || !displayLabel) return null;
  return {
    contextKeyId,
    address,
    canonicalLabel,
    displayLabel,
    color: text(entry.color, ""),
    icon: text(entry.icon, ""),
    source: text(entry.source, PROJECT_OVERVIEW_PLUGIN_ID)
  };
}
function normalizeContextCapsuleKeyList(entries = []) {
  const byId = /* @__PURE__ */ new Map();
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
}
function buildContextCapsuleKeySignature(keys = []) {
  return normalizeContextCapsuleKeyList(keys).map((key) => [key.contextKeyId, key.address, key.canonicalLabel, key.displayLabel, key.color, key.icon].join("")).join("");
}
function flattenTabTree(tabChildrenByParent, parentId = null, out = [], seen = /* @__PURE__ */ new Set()) {
  for (const rawId of tabChildrenByParent?.[parentKey(parentId)] || []) {
    const id = text(rawId);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    flattenTabTree(tabChildrenByParent, id, out, seen);
  }
  return out;
}
function removeIdFromList(list, id) {
  const normalized = text(id);
  return (Array.isArray(list) ? list : []).filter((entry) => text(entry) !== normalized);
}
function removeIdFromSimpleChildrenMap(childrenMap, id) {
  Object.keys(childrenMap || {}).forEach((key) => {
    childrenMap[key] = removeIdFromList(childrenMap[key], id);
  });
}
function removeIdFromChildrenMap(childrenMap, id, tabIdRaw) {
  const tabId = text(tabIdRaw, DEFAULT_TAB_ID);
  const prefix = `${tabId}::`;
  Object.keys(childrenMap || {}).forEach((key) => {
    if (!String(key || "").startsWith(prefix)) return;
    childrenMap[key] = removeIdFromList(childrenMap[key], id);
  });
}
function wouldCreateTabCycle(data, draggedIdRaw, nextParentIdRaw) {
  const draggedId = text(draggedIdRaw);
  let cursor = text(nextParentIdRaw) || null;
  while (cursor) {
    if (cursor === draggedId) return true;
    cursor = text(data?.tabsById?.[cursor]?.parentTabId) || null;
  }
  return false;
}
function wouldCreateItemCycle(data, draggedIdRaw, nextParentIdRaw, tabIdRaw) {
  const draggedId = text(draggedIdRaw);
  const tabId = text(tabIdRaw, DEFAULT_TAB_ID);
  let cursor = text(nextParentIdRaw) || null;
  while (cursor) {
    if (cursor === draggedId) return true;
    const item = data?.itemsById?.[cursor];
    if (!item || text(item.tabId, DEFAULT_TAB_ID) !== tabId) return false;
    cursor = text(item.parentId) || null;
  }
  return false;
}
function collectItemDescendantIds(data, itemIdRaw, tabIdRaw, out = [], seen = /* @__PURE__ */ new Set()) {
  const itemId = text(itemIdRaw);
  const tabId = text(tabIdRaw, DEFAULT_TAB_ID);
  if (!itemId || seen.has(itemId)) return out;
  seen.add(itemId);
  const childIds = data?.childrenByParentByTab?.[tabParentKey(tabId, itemId)] || [];
  for (const rawChildId of childIds) {
    const childId = text(rawChildId);
    if (!childId) continue;
    out.push(childId);
    collectItemDescendantIds(data, childId, tabId, out, seen);
  }
  return out;
}
function summarizeComment(value, maxLength = 100) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}
function sanitizeData(raw) {
  const src = isObject(raw) ? clone(raw, {}) : {};
  const base = defaultData();
  const tabsById = {};
  Object.keys(src.tabsById || {}).forEach((rawId) => {
    const id = text(rawId);
    const tab = src.tabsById?.[rawId];
    if (!id || !isObject(tab)) return;
    tabsById[id] = {
      id,
      name: text(tab.name, id),
      emoji: text(tab.emoji, ""),
      parentTabId: text(tab.parentTabId) || null,
      createdAt: text(tab.createdAt, nowString()),
      updatedAt: text(tab.updatedAt, text(tab.createdAt, nowString()))
    };
  });
  if (!tabsById[DEFAULT_TAB_ID]) tabsById[DEFAULT_TAB_ID] = clone(base.tabsById[DEFAULT_TAB_ID], {});
  Object.keys(tabsById).forEach((id) => {
    if (tabsById[id].parentTabId === id || !tabsById[tabsById[id].parentTabId]) tabsById[id].parentTabId = null;
  });
  const tabChildrenByParent = { [ROOT_KEY]: [] };
  const tabPlacement = /* @__PURE__ */ new Set();
  if (isObject(src.tabChildrenByParent)) {
    Object.keys(src.tabChildrenByParent).forEach((rawParentKey) => {
      const scopedParentId = rawParentKey === ROOT_KEY ? null : text(rawParentKey) || null;
      const key = parentKey(scopedParentId);
      const orderedIds = uniq((src.tabChildrenByParent?.[rawParentKey] || []).filter((rawId) => {
        const id = text(rawId);
        if (!id || tabPlacement.has(id) || !tabsById[id]) return false;
        return (tabsById[id].parentTabId || null) === scopedParentId;
      }));
      if (!Array.isArray(tabChildrenByParent[key])) tabChildrenByParent[key] = [];
      tabChildrenByParent[key] = tabChildrenByParent[key].concat(orderedIds);
      orderedIds.forEach((id) => tabPlacement.add(id));
    });
  }
  Object.keys(tabsById).forEach((id) => {
    if (tabPlacement.has(id)) return;
    const key = parentKey(tabsById[id].parentTabId);
    if (!Array.isArray(tabChildrenByParent[key])) tabChildrenByParent[key] = [];
    tabChildrenByParent[key].push(id);
    tabPlacement.add(id);
  });
  Object.keys(tabChildrenByParent).forEach((key) => {
    tabChildrenByParent[key] = uniq(tabChildrenByParent[key]);
  });
  const tabOrder = flattenTabTree(tabChildrenByParent, null);
  const itemsById = {};
  Object.keys(src.itemsById || {}).forEach((rawId) => {
    const id = text(rawId);
    const item = src.itemsById?.[rawId];
    const tabId = text(item?.tabId);
    if (!id || !isObject(item) || !tabsById[tabId]) return;
    itemsById[id] = {
      id,
      title: text(item.title, id),
      comment: text(item.comment, ""),
      tabId,
      parentId: text(item.parentId) || null,
      isCollapsed: item.isCollapsed === true,
      noteExpanded: item.noteExpanded === true,
      noteBinding: text(item.noteBinding?.path) ? { path: text(item.noteBinding.path), ctime: Number(item.noteBinding.ctime) || null } : null,
      createdAt: text(item.createdAt, nowString()),
      updatedAt: text(item.updatedAt, text(item.createdAt, nowString()))
    };
  });
  Object.keys(itemsById).forEach((id) => {
    const item = itemsById[id];
    const parent = itemsById[item.parentId];
    if (item.parentId && (!parent || parent.tabId !== item.tabId || parent.id === id)) item.parentId = null;
  });
  const childrenByParentByTab = {};
  const itemPlacement = /* @__PURE__ */ new Set();
  if (isObject(src.childrenByParentByTab)) {
    Object.keys(src.childrenByParentByTab).forEach((scopedKey) => {
      const separatorIndex = String(scopedKey || "").indexOf("::");
      if (separatorIndex < 0) return;
      const ownerTabId = text(String(scopedKey).slice(0, separatorIndex));
      const rawParentScope = String(scopedKey).slice(separatorIndex + 2);
      const scopedParentId = rawParentScope === ROOT_KEY ? null : text(rawParentScope) || null;
      if (!tabsById[ownerTabId]) return;
      const normalizedKey = tabParentKey(ownerTabId, scopedParentId);
      const orderedIds = uniq((src.childrenByParentByTab?.[scopedKey] || []).filter((rawId) => {
        const id = text(rawId);
        if (!id || itemPlacement.has(id) || !itemsById[id]) return false;
        const item = itemsById[id];
        return item.tabId === ownerTabId && (item.parentId || null) === scopedParentId;
      }));
      if (!Array.isArray(childrenByParentByTab[normalizedKey])) childrenByParentByTab[normalizedKey] = [];
      childrenByParentByTab[normalizedKey] = childrenByParentByTab[normalizedKey].concat(orderedIds);
      orderedIds.forEach((id) => itemPlacement.add(id));
    });
  }
  Object.values(itemsById).forEach((item) => {
    if (itemPlacement.has(item.id)) return;
    const key = tabParentKey(item.tabId, item.parentId);
    if (!Array.isArray(childrenByParentByTab[key])) childrenByParentByTab[key] = [];
    childrenByParentByTab[key].push(item.id);
    itemPlacement.add(item.id);
  });
  Object.keys(tabsById).forEach((tabId) => {
    const key = tabParentKey(tabId, null);
    if (!Array.isArray(childrenByParentByTab[key])) childrenByParentByTab[key] = [];
  });
  return {
    schemaVersion: "1.0",
    lastModified: text(src.lastModified, nowString()),
    activeTabId: tabsById[text(src.activeTabId)] ? text(src.activeTabId) : tabOrder[0] || DEFAULT_TAB_ID,
    tabsById,
    tabOrder,
    tabChildrenByParent,
    tabTreeCollapsedById: isObject(src.tabTreeCollapsedById) ? clone(src.tabTreeCollapsedById, {}) : {},
    itemsById,
    childrenByParentByTab,
    ...isObject(src.actionEntryReceipts) ? { actionEntryReceipts: clone(src.actionEntryReceipts, {}) } : {},
    ...isObject(src.contextCreationReceipts) ? { contextCreationReceipts: clone(src.contextCreationReceipts, {}) } : {}
  };
}
var QuickPromptModal = class extends Modal {
  constructor(app, title, placeholder, onResolve, defaultValue = "") {
    super(app);
    this.titleStr = title;
    this.placeholder = placeholder;
    this.onResolve = onResolve;
    this.defaultValue = defaultValue || "";
    this.resolved = false;
  }
  resolve(result) {
    if (this.resolved) return;
    this.resolved = true;
    this.onResolve(result);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleStr });
    const input = contentEl.createEl("input", {
      type: "text",
      attr: {
        placeholder: this.placeholder || "",
        style: "width:100%;padding:8px 10px;border:1px solid var(--background-modifier-border);border-radius:8px;"
      }
    });
    input.value = this.defaultValue;
    const actions = contentEl.createDiv({
      attr: {
        style: "display:flex;justify-content:flex-end;gap:8px;margin-top:14px;"
      }
    });
    actions.createEl("button", { text: "\u53D6\u6D88" }).onclick = () => {
      this.resolve(null);
      this.close();
    };
    const okBtn = actions.createEl("button", { text: "\u786E\u8BA4", cls: "mod-cta" });
    const submit = () => {
      this.resolve(text(input.value, ""));
      this.close();
    };
    okBtn.onclick = submit;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });
    input.focus();
    input.select();
  }
  onClose() {
    if (!this.resolved) this.resolve(null);
    this.contentEl.empty();
  }
};
var CollectionCardConfirmModal = class extends Modal {
  constructor(app, options = {}) {
    super(app);
    this.options = options || {};
    this.result = false;
    this.waiter = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }
  onOpen() {
    const { contentEl } = this;
    const {
      title = "\u786E\u8BA4",
      message = "",
      confirmText = "\u786E\u8BA4",
      cancelText = "\u53D6\u6D88",
      danger = false
    } = this.options;
    this.result = false;
    contentEl.empty();
    contentEl.removeClass("collection-card-confirm-modal");
    contentEl.removeClass("is-danger");
    contentEl.addClass("collection-card-confirm-modal");
    if (danger) contentEl.addClass("is-danger");
    contentEl.createEl("h3", { text: title, cls: "collection-card-confirm-title" });
    const messageWrap = contentEl.createDiv({ cls: "collection-card-modal-desc" });
    String(message || "").split("\n").map((line) => String(line || "").trim()).filter(Boolean).forEach((line) => messageWrap.createDiv({ text: line }));
    const actions = contentEl.createDiv({ cls: "collection-card-modal-actions" });
    const cancelBtn = actions.createEl("button", { text: cancelText });
    cancelBtn.onclick = () => {
      this.result = false;
      this.close();
    };
    const okBtn = actions.createEl("button", {
      text: confirmText,
      cls: danger ? "collection-card-confirm-danger-btn" : "mod-cta"
    });
    okBtn.onclick = () => {
      this.result = true;
      this.close();
    };
    window.setTimeout(() => okBtn.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
    this._resolve(this.result === true);
  }
  waitForResult() {
    this.open();
    return this.waiter;
  }
};
var TabCapsuleKeywordModal = class extends Modal {
  constructor(app, options = {}, onResolve) {
    super(app);
    this.options = options || {};
    this.onResolve = onResolve;
    this.resolved = false;
  }
  resolve(result) {
    if (this.resolved) return;
    this.resolved = true;
    this.onResolve(result);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Tab keywords" });
    contentEl.createDiv({
      cls: "collection-card-modal-desc",
      text: `One keyword can bind to one tab only. Tab: ${text(this.options.tabName, "-")}`
    });
    const emojiInput = contentEl.createEl("input", {
      type: "text",
      cls: "collection-card-modal-input",
      attr: { placeholder: "Emoji, e.g. \u{1F4CC}" }
    });
    emojiInput.value = text(this.options.emoji, "");
    const textarea = contentEl.createEl("textarea", {
      cls: "collection-card-tab-keyword-textarea",
      attr: { placeholder: "One keyword per line" }
    });
    textarea.value = (Array.isArray(this.options.keywords) ? this.options.keywords : []).join("\n");
    const actions = contentEl.createDiv({ cls: "collection-card-modal-actions" });
    actions.createEl("button", { text: "Cancel" }).onclick = () => {
      this.resolve(null);
      this.close();
    };
    actions.createEl("button", { text: "Clear keywords" }).onclick = () => {
      textarea.value = "";
      textarea.focus();
    };
    actions.createEl("button", { text: "Save", cls: "mod-cta" }).onclick = () => {
      this.resolve({
        emoji: text(emojiInput.value, ""),
        keywords: String(textarea.value || "").split(/\r?\n/).map((value) => text(value, "")).filter(Boolean)
      });
      this.close();
    };
    window.setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }, 0);
  }
  onClose() {
    if (!this.resolved) this.resolve(null);
    this.contentEl.empty();
  }
};
function openTabCapsuleKeywordModal(app, options = {}) {
  return new Promise((resolve) => new TabCapsuleKeywordModal(app, options, resolve).open());
}
var VaultNotePickerModal = class extends Modal {
  constructor(app, noteIndex, currentNotePath, onChoose) {
    super(app);
    this.noteIndex = Array.isArray(noteIndex) ? noteIndex : [];
    this.currentNotePath = currentNotePath || null;
    this.onChoose = onChoose;
    this.filtered = [];
    this.activeIndex = 0;
    this.maxRows = 240;
    this.resolved = false;
  }
  resolve(result) {
    if (this.resolved) return;
    this.resolved = true;
    this.onChoose(result);
  }
  normalizeQuery(query) {
    return String(query || "").trim().toLowerCase();
  }
  filterIndex(query) {
    const normalized = this.normalizeQuery(query);
    if (!normalized) return this.noteIndex.slice(0, this.maxRows);
    const terms = normalized.split(/\s+/).filter(Boolean);
    const matched = [];
    for (const item of this.noteIndex) {
      const haystack = `${item.search || ""} ${item.basenameLower || ""} ${item.pathLower || ""}`;
      const ok = terms.every((term) => haystack.includes(term));
      if (!ok) continue;
      matched.push(item);
      if (matched.length >= this.maxRows * 2) break;
    }
    return matched.slice(0, this.maxRows);
  }
  renderList(listEl, statEl, query) {
    listEl.empty();
    this.filtered = this.filterIndex(query);
    if (this.activeIndex >= this.filtered.length) this.activeIndex = Math.max(0, this.filtered.length - 1);
    statEl.setText(`\u5171 ${this.filtered.length} \u6761\u7ED3\u679C`);
    if (this.filtered.length === 0) {
      listEl.createEl("div", {
        text: "\u65E0\u5339\u914D\u7B14\u8BB0",
        attr: { style: "padding:12px;color:var(--text-muted);text-align:center;" }
      });
      return;
    }
    this.filtered.forEach((item, idx) => {
      const active = idx === this.activeIndex;
      const row = listEl.createEl("div", {
        attr: {
          style: `display:flex;flex-direction:column;gap:2px;padding:8px 10px;margin-bottom:4px;border-radius:6px;cursor:pointer;border:1px solid ${active ? "var(--interactive-accent)" : "var(--background-modifier-border)"};background:${active ? "var(--background-modifier-hover)" : "var(--background-secondary)"};`
        }
      });
      row.createEl("div", { text: `\u7B14\u8BB0 ${item.basename}`, attr: { style: "font-weight:600;" } });
      row.createEl("small", { text: item.path, attr: { style: "color:var(--text-muted);" } });
      row.onclick = () => {
        this.resolve(item);
        this.close();
      };
      row.onmouseenter = () => {
        this.activeIndex = idx;
      };
    });
  }
  onOpen() {
    this.modalEl.style.maxWidth = "1100px";
    this.modalEl.style.width = "92vw";
    this.modalEl.style.height = "80vh";
    const { contentEl } = this;
    contentEl.empty();
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.height = "100%";
    contentEl.style.gap = "8px";
    contentEl.createEl("h3", { text: "\u7ED1\u5B9A\u7B14\u8BB0" });
    if (this.currentNotePath) {
      const current = contentEl.createEl("div", {
        attr: { style: "padding:8px;border:1px solid var(--background-modifier-border);border-radius:8px;background:var(--background-secondary);" }
      });
      current.createEl("div", { text: `\u5F53\u524D\u7ED1\u5B9A\uFF1A${this.currentNotePath}`, attr: { style: "font-weight:600;" } });
      const currentActions = current.createEl("div", {
        attr: { style: "display:flex;justify-content:flex-end;gap:8px;margin-top:8px;" }
      });
      currentActions.createEl("button", { text: "\u6253\u5F00\u5F53\u524D\u7ED1\u5B9A" }).onclick = () => {
        this.resolve({ kind: "current", path: this.currentNotePath });
        this.close();
      };
      currentActions.createEl("button", { text: "\u6E05\u9664\u7ED1\u5B9A" }).onclick = () => {
        this.resolve({ kind: "clear", path: this.currentNotePath });
        this.close();
      };
    }
    const input = contentEl.createEl("input", {
      type: "text",
      attr: {
        placeholder: "\u8F93\u5165\u5173\u952E\u5B57\u7B5B\u9009\uFF0C\u6216\u76F4\u63A5\u8F93\u5165\u6587\u4EF6\u540D/\u8DEF\u5F84\u540E\u624B\u52A8\u7ED1\u5B9A",
        style: "width:100%;padding:8px 10px;border:1px solid var(--background-modifier-border);border-radius:8px;"
      }
    });
    contentEl.createEl("div", {
      text: "\u53EF\u76F4\u63A5\u8F93\u5165\u5B8C\u6574\u6587\u4EF6\u540D\u6216\u8DEF\u5F84\uFF0C\u4E0D\u5E26 .md \u4E5F\u53EF\u4EE5\u3002",
      attr: { style: "color:var(--text-muted);font-size:12px;" }
    });
    const stat = contentEl.createEl("div", { attr: { style: "color:var(--text-muted);font-size:12px;" } });
    const listEl = contentEl.createEl("div", {
      attr: { style: "flex:1;overflow:auto;border:1px solid var(--background-modifier-border);border-radius:8px;padding:8px;background:var(--background-primary);" }
    });
    const render = () => this.renderList(listEl, stat, input.value || "");
    const submitManual = () => {
      const raw = String(input.value || "").trim();
      if (!raw) return;
      this.resolve({ kind: "manual", raw });
      this.close();
    };
    input.addEventListener("input", () => {
      this.activeIndex = 0;
      render();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (this.activeIndex < this.filtered.length - 1) this.activeIndex++;
        render();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (this.activeIndex > 0) this.activeIndex--;
        render();
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selected = this.filtered[this.activeIndex];
        if (selected) {
          this.resolve(selected);
          this.close();
        } else {
          submitManual();
        }
      }
    });
    const actions = contentEl.createEl("div", {
      attr: { style: "display:flex;justify-content:flex-end;gap:8px;" }
    });
    actions.createEl("button", { text: "\u7ED1\u5B9A\u8F93\u5165\u5185\u5BB9" }).onclick = () => submitManual();
    actions.createEl("button", { text: "\u53D6\u6D88" }).onclick = () => {
      this.resolve(null);
      this.close();
    };
    render();
    input.focus();
  }
  onClose() {
    if (!this.resolved) this.resolve(null);
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.width = "";
    this.modalEl.style.height = "";
    this.contentEl.style.display = "";
    this.contentEl.style.flexDirection = "";
    this.contentEl.style.height = "";
    this.contentEl.style.gap = "";
    this.contentEl.empty();
  }
};
var TaskCommentModal = class extends Modal {
  constructor(app, title, defaultValue, onResolve) {
    super(app);
    this.titleStr = title;
    this.defaultValue = String(defaultValue || "");
    this.onResolve = onResolve;
    this.resolved = false;
    this.textareaEl = null;
  }
  resolve(result) {
    if (this.resolved) return;
    this.resolved = true;
    this.onResolve(result);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleStr });
    contentEl.createEl("div", {
      text: "\u652F\u6301\u591A\u884C\u8BC4\u8BBA\uFF0C\u4F1A\u4EE5\u6458\u8981\u5F62\u5F0F\u663E\u793A\u5728\u6761\u76EE\u4E0B\u65B9\u3002",
      attr: { style: "color:var(--text-muted);font-size:12px;line-height:1.6;margin-bottom:8px;" }
    });
    const textarea = contentEl.createEl("textarea", {
      attr: {
        style: "width:100%;min-height:220px;padding:12px 14px;border:1px solid var(--background-modifier-border);border-radius:12px;background:var(--background-primary);color:var(--text-normal);line-height:1.7;resize:vertical;box-sizing:border-box;"
      }
    });
    textarea.value = this.defaultValue;
    this.textareaEl = textarea;
    const actions = contentEl.createDiv({
      attr: { style: "display:flex;justify-content:space-between;gap:8px;margin-top:14px;" }
    });
    const left = actions.createDiv({ attr: { style: "display:flex;gap:8px;" } });
    left.createEl("button", { text: "\u6E05\u7A7A\u8BC4\u8BBA" }).onclick = () => {
      this.resolve("");
      this.close();
    };
    const right = actions.createDiv({ attr: { style: "display:flex;gap:8px;" } });
    right.createEl("button", { text: "\u53D6\u6D88" }).onclick = () => {
      this.resolve(null);
      this.close();
    };
    right.createEl("button", { text: "\u4FDD\u5B58", cls: "mod-cta" }).onclick = () => {
      this.resolve(String(textarea.value || "").trim());
      this.close();
    };
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
  onClose() {
    if (!this.resolved) {
      const currentValue = String(this.textareaEl?.value || "").trim();
      const initialValue = String(this.defaultValue || "").trim();
      this.resolve(currentValue === initialValue ? null : currentValue);
    }
    this.textareaEl = null;
    this.contentEl.empty();
  }
};
var openQuickPrompt = (app, title, placeholder = "", defaultValue = "") => new Promise((resolve) => {
  new QuickPromptModal(app, title, placeholder, resolve, defaultValue).open();
});
var openConfirmModal = (app, options = {}) => new CollectionCardConfirmModal(app, options).waitForResult();
var openVaultNotePicker = (app, noteIndex, currentNotePath = null) => new Promise((resolve) => {
  new VaultNotePickerModal(app, noteIndex, currentNotePath, resolve).open();
});
var openTaskCommentEditor = (app, title, defaultValue = "") => new Promise((resolve) => {
  new TaskCommentModal(app, title, defaultValue, resolve).open();
});
function buildVaultIndex(app) {
  return app.vault.getMarkdownFiles().map((file) => {
    const path = text(file.path, "");
    const basename = text(file.basename, path);
    return {
      path,
      basename,
      basenameLower: basename.toLowerCase(),
      pathLower: path.toLowerCase(),
      search: `${basename.toLowerCase()} ${path.toLowerCase()}`
    };
  });
}
var CollectionCardView = class extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.sourceNotePath = "";
    this.sourceFile = null;
    this.dataPath = "";
    this.tabCapsuleKeywordsPath = "";
    this.data = defaultData();
    this.tabCapsuleKeywordData = defaultTabCapsuleKeywordData();
    this.tabCapsuleKeywordLoadError = "";
    this.tabCapsuleKeywordArchiveExpanded = false;
    this.contextCapsuleKeysCache = { items: [], builtAt: 0 };
    this.contextCapsuleKeysRefreshPromise = null;
    this.ui = { floatingTocCollapsed: false, pageScrollTop: null, tocScrollTop: null };
    this.hostId = createId("ccHost");
    this.relationAdapterId = `collection-card::${this.hostId}`;
    this.mainScrollEl = null;
    this.tocScrollEl = null;
    this.scrollStateCleanup = null;
    this.pendingRelationFocus = null;
    this.pendingTabCapsuleFocus = null;
    this.noteEditorState = {};
    this.previewComponents = [];
    this.tabDragState = { draggedId: "" };
    this.itemDragState = { draggedId: "" };
    this.bridge = {
      bridgeName: BRIDGE_NAME,
      bridgeVersion: BRIDGE_VERSION,
      scriptVersion: SCRIPT_VERSION,
      isReady: () => this.isReady(),
      getState: () => this.getBridgeState(),
      getHostIdentity: () => this.getHostIdentity(),
      applyState: async (state, options = {}) => this.applyBridgeState(state, options)
    };
    this.bridge.hostId = this.hostId;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Collection Card View";
  }
  getIcon() {
    return "files";
  }
  getState() {
    return { sourceNotePath: this.sourceNotePath };
  }
  getTrackingAdapter() {
    if (!this.trackingAdapter) this.trackingAdapter = __CollectionTrackingAdapter.createAdapter(this, { window, document, notice: message => new Notice(message) });
    return this.trackingAdapter;
  }
  isStoppedContextKeyword(keyword) {
    return this.getTrackingAdapter().stopped(keyword);
  }
  isStoppedContextTab(tabId) {
    if (this.historySession?.tabs?.has(tabId)) return false;
    return this.isStoppedContextTabRaw(tabId);
  }
  isStoppedContextTabRaw(tabId, pass = this.getTrackingAdapter().consumer.current()) {
    const entries = Object.values(this.getTabCapsuleKeywordAssignments()).filter(x => x?.tabId === tabId);
    return entries.every(x => x.sourceNotePath === this.sourceNotePath) && allStopped(entries, keyword => this.getTrackingAdapter().stopped(keyword, pass));
  }
  getViewActiveTabId() {
    const session = this.historySession;
    return session?.tabs?.has(session.tabId) ? session.tabId : this.data.activeTabId;
  }
  getStoppedHistorySubtree(rootTabId, pass = this.getTrackingAdapter().consumer.current()) {
    const out = new Set();
    const seen = new Set();
    const stack = [rootTabId];
    while (stack.length && seen.size < 5000) {
      const id = text(stack.pop(), "");
      if (!id || seen.has(id) || !this.data.tabsById?.[id]) continue;
      seen.add(id);
      if (id === rootTabId || this.isStoppedContextTabRaw(id, pass)) out.add(id);
      this.getTabIdsByParent(id).forEach((childId) => stack.push(childId));
    }
    return out;
  }
  isHistorySessionLive(session = this.historySession) {
    return !!session && session === this.historySession && !this.contextHistoryViewClosed
      && !!this.contentEl?.isConnected && this.sourceNotePath === session.source
      && (typeof session.isLive !== "function" || session.isLive() === true);
  }
  isItemCollapsedForView(item) {
    const map = this.historySession?.itemCollapsed;
    if (item?.id && map?.has(item.id)) return map.get(item.id) === true;
    return !!item?.isCollapsed;
  }
  isItemNoteExpandedForView(item) {
    const map = this.historySession?.noteExpanded;
    if (item?.id && map?.has(item.id)) return map.get(item.id) === true;
    return !!item?.noteExpanded;
  }
  isTabTreeCollapsedForView(tabId) {
    const map = this.historySession?.tabCollapsed;
    if (map?.has(tabId)) return map.get(tabId) === true;
    return this.data.tabTreeCollapsedById?.[tabId] === true;
  }
  rejectHistoryWrite(op) {
    console.info("[Collection Card View][context-history.write-blocked]", { op, tabId: this.historySession?.tabId || "" });
    const now = Date.now();
    if (!this.historyNoticeAt || now - this.historyNoticeAt > 2500) {
      this.historyNoticeAt = now;
      new Notice("历史回看为只读；点「返回当前」后再编辑。");
    }
    return false;
  }
  installContextHistoryFence() {
    this.historyFenceCleanup?.();
    const host = this.contentEl;
    const allowClick = ".collection-tracking-pending-banner button, .collection-context-history-banner button, .collection-card-item-toggle, .collection-card-tab-collapse-toggle, .collection-card-tab-btn, .collection-card-title-link, .collection-card-floating-toc-btn, .collection-card-floating-toc-toggle, .collection-card-floating-toc-item-toggle, a.internal-link";
    const navigationKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", "Tab", "Shift", "Control", "Alt", "Meta"]);
    const block = (event) => {
      if (!this.historySession) return;
      const target = event.target instanceof Element ? event.target : null;
      if (event.type === "keydown") {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); this.plugin.historyOpenSerial = (this.plugin.historyOpenSerial || 0) + 1; this.exitContextHistory(); return; }
        if (navigationKeys.has(event.key)) return;
        if ((event.ctrlKey || event.metaKey) && !event.altKey && ["c", "a"].includes(String(event.key).toLowerCase())) return;
      } else if (event.type === "click" && target?.closest(allowClick)) {
        return;
      }
      if (target?.closest(".collection-context-history-banner")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (event.type === "click" || event.type === "dblclick" || event.type === "contextmenu" || event.type === "drop") this.rejectHistoryWrite("interaction:" + event.type);
    };
    const types = ["click", "dblclick", "auxclick", "contextmenu", "dragstart", "dragover", "drop", "keydown", "beforeinput", "input", "change", "paste", "cut"];
    types.forEach((type) => host.addEventListener(type, block, true));
    this.historyFenceCleanup = () => types.forEach((type) => host.removeEventListener(type, block, true));
  }
  exitContextHistory(options = {}) {
    const session = this.historySession;
    if (!session) return false;
    this.getTrackingAdapter().showPending();
    this.historySession = null;
    this.historySessionSerial = (this.historySessionSerial || 0) + 1;
    this.historyFenceCleanup?.();
    this.historyFenceCleanup = null;
    this.contentEl?.removeClass?.("is-collection-history-readonly");
    if (session.savedUi) {
      this.ui.pageScrollTop = session.savedUi.pageScrollTop;
      this.ui.tocScrollTop = session.savedUi.tocScrollTop;
      this.skipScrollCaptureOnce = true; // the next render restores, not re-captures, the pre-history scroll
    }
    if (options.render !== false && this.contentEl?.isConnected && !this.contextHistoryViewClosed) void this.render();
    return true;
  }
  leaveContextHistoryForExternal(op) {
    if (!this.historySession) return false;
    console.info("[Collection Card View][context-history.exit-for-external]", { op, tabId: this.historySession.tabId });
    this.plugin.historyOpenSerial = (this.plugin.historyOpenSerial || 0) + 1;
    this.exitContextHistory({ render: false });
    const renderSerial = this.renderSerial || 0;
    window.setTimeout(() => {
      if (!this.historySession && (this.renderSerial || 0) === renderSerial && this.contentEl?.isConnected && !this.contextHistoryViewClosed) void this.render();
    }, 0);
    return true;
  }
  revalidateContextHistory() {
    const pass = this.getTrackingAdapter().consumer.current();
    if (pass.status !== "ready") { this.getTrackingAdapter().showPending(); return !!this.historySession; }
    const session = this.historySession;
    if (!session) return false;
    if (this.sourceNotePath !== session.source || !this.data.tabsById?.[session.rootTabId]) {
      this.plugin.historyOpenSerial = (this.plugin.historyOpenSerial || 0) + 1;
      this.exitContextHistory({ render: false });
      new Notice("历史回看的 Tab 已不可用，已返回当前。");
      return false;
    }
    session.tabs = this.getStoppedHistorySubtree(session.rootTabId, pass);
    if (!session.tabs.has(session.tabId)) { session.tabId = session.rootTabId; session.itemId = ""; }
    return true;
  }
  renderContextHistoryBanner(wrap) {
    const session = this.historySession;
    const banner = wrap.createDiv({ cls: "collection-context-history-banner" });
    banner.createEl("style", { text: `.is-collection-history-readonly .collection-card-actions,.is-collection-history-readonly .collection-card-main-actions button,.is-collection-history-readonly .collection-card-tab-mini-actions,.is-collection-history-readonly .collection-card-context-actions,.is-collection-history-readonly .collection-card-line-actions,.is-collection-history-readonly .collection-card-tab-root-drop-zone,.is-collection-history-readonly .collection-card-root-drop-zone{display:none!important}.collection-context-history-banner{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;padding:8px 12px;margin-bottom:8px;border-radius:8px;background:var(--background-secondary-alt);border:1px solid var(--interactive-accent)}.collection-context-history-banner strong{color:var(--interactive-accent)}.is-context-history-target{outline:2px solid var(--interactive-accent);outline-offset:2px;border-radius:6px}` });
    banner.createEl("strong", { text: "历史回看 · 只读" });
    banner.createEl("span", { text: `${this.data.tabsById?.[session.rootTabId]?.name || session.rootTabId} · 追踪已停止，内容与绑定原样保留` });
    const back = banner.createEl("button", { text: "返回当前", attr: { type: "button" } });
    back.onclick = () => { this.plugin.historyOpenSerial = (this.plugin.historyOpenSerial || 0) + 1; this.exitContextHistory(); };
  }
  async openContextHistory(tabId, itemId = "", isLive = null) {
    if (this.contextHistoryViewClosed || !this.contentEl?.isConnected) return false;
    const tracking = this.getTrackingAdapter();
    if (tracking.hasInput() || tracking.isLoading()) { tracking.showPending("请先完成页面加载或编辑，再打开历史回看。"); return false; }
    const pass = tracking.consumer.capture();
    if (pass.status !== "ready") { tracking.showPending(); tracking.lifecycle.poke("local"); return false; }
    const requestedTabId = text(tabId, "");
    const requestedItemId = text(itemId, "");
    const tab = this.data.tabsById?.[requestedTabId];
    const target = requestedItemId ? this.data.itemsById?.[requestedItemId] : null;
    if (!tab || (requestedItemId && (!target || text(target.tabId) !== requestedTabId))) return false;
    if (typeof isLive === "function" && isLive() !== true) return false;
    // Validate before touching an existing session, so a refused request never strands an unfenced history screen.
    if (!this.isStoppedContextTabRaw(requestedTabId, pass)) return false;
    let rootTabId = requestedTabId;
    for (let parentId = text(tab.parentTabId, ""), guard = 0; parentId && guard < 200 && this.isStoppedContextTabRaw(parentId, pass); guard += 1) {
      rootTabId = parentId;
      parentId = text(this.data.tabsById?.[parentId]?.parentTabId, "");
    }
    if (this.historySession) this.exitContextHistory({ render: false });
    else this.captureScrollState();
    const session = {
      serial: (this.historySessionSerial = (this.historySessionSerial || 0) + 1),
      source: this.sourceNotePath,
      rootTabId,
      tabId: requestedTabId,
      itemId: requestedItemId,
      isLive,
      tabs: this.getStoppedHistorySubtree(rootTabId, pass),
      itemCollapsed: new Map(),
      noteExpanded: new Map(),
      tabCollapsed: new Map(),
      savedUi: { pageScrollTop: this.ui.pageScrollTop, tocScrollTop: this.ui.tocScrollTop },
    };
    for (let parentId = text(target?.parentId, ""), guard = 0; parentId && guard < 1000; guard += 1) {
      session.itemCollapsed.set(parentId, false);
      parentId = text(this.data.itemsById?.[parentId]?.parentId, "");
    }
    for (let tabCursor = text(tab.parentTabId, ""), guard = 0; tabCursor && guard < 200; guard += 1) {
      session.tabCollapsed.set(tabCursor, false);
      if (tabCursor === rootTabId) break;
      tabCursor = text(this.data.tabsById?.[tabCursor]?.parentTabId, "");
    }
    this.historySession = session;
    this.installContextHistoryFence();
    await this.render();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    if (!tracking.consumer.isCurrent(pass)) { tracking.showPending(); return false; }
    if (!this.isHistorySessionLive(session)) {
      if (session === this.historySession) this.exitContextHistory();
      return false;
    }
    if (!requestedItemId) {
      if (this.contentEl) this.contentEl.scrollTop = 0;
      return true;
    }
    const row = Array.from(this.contentEl.querySelectorAll("[data-collection-card-item-id]"))
      .find((el) => el.getAttribute("data-collection-card-item-id") === requestedItemId);
    if (!row?.isConnected) {
      this.exitContextHistory();
      return false;
    }
    row.classList.add("is-context-history-target");
    row.scrollIntoView({ block: "center", behavior: "auto" });
    return this.isHistorySessionLive(session);
  }
  renderStoppedContextTabs(container) {
    if (this.historySession) return;
    const tabs = Object.values(this.data?.tabsById || {}).filter(t => this.isStoppedContextTabRaw(t.id));
    if (!tabs.length) return;
    const tray = container.createEl("details"); tray.createEl("summary", { text: `查看已停止追踪 (${tabs.length})` });
    tabs.forEach(tab => { tray.createEl("button", { text: tab.name }).onclick = () => this.openContextHistory(tab.id); });
  }
  async setState(state) {
    if (this.getTrackingAdapter().deferLoad(() => this.setState(state))) return false;
    this.getTrackingAdapter().sourceChanging();
    const fallbackPath = this.plugin.getDefaultSourceNotePath();
    const requestedPath = text(state?.sourceNotePath, "");
    const nextSourceNotePath = this.plugin.resolveSourceFile(requestedPath)?.path || fallbackPath;
    if (this.historySession && nextSourceNotePath !== this.sourceNotePath) this.exitContextHistory({ render: false });
    this.sourceNotePath = nextSourceNotePath;
    await this.reload();
  }
  async onOpen() {
    this.contextHistoryViewClosed = false;
    this.getTrackingAdapter().start();
    this.contentEl.addClass("collection-card-view");
    await this.setState(this.leaf.getViewState()?.state || {});
  }
  async onClose() {
    this.trackingAdapter?.close();
    this.contextHistoryViewClosed = true; this.plugin.historyOpenSerial = (this.plugin.historyOpenSerial || 0) + 1;
    this.exitContextHistory({ render: false });
    if (typeof this.scrollStateCleanup === "function") {
      try {
        this.scrollStateCleanup();
      } catch (_) {
      }
      this.scrollStateCleanup = null;
    }
    this.disposePreviewComponents();
    this.unregisterRelationAdapter();
  }
  getRelationsPluginApi() {
    return this.app?.plugins?.plugins?.[RELATIONS_PLUGIN_ID]?.api || window.evaCrossViewRelations || null;
  }
  getRelationNotePath() {
    return text(this.sourceFile?.path || this.sourceNotePath);
  }
  getOperationAuditApi() {
    return this.app?.plugins?.plugins?.[OPERATION_AUDIT_PLUGIN_ID]?.api || window[OPERATION_AUDIT_GLOBAL] || null;
  }
  getAuditCollectionLabel() {
    return text(this.sourceFile?.basename || this.sourceNotePath, "collection");
  }
  buildAuditTabLocation(tabOrId) {
    const tab = typeof tabOrId === "string" ? this.data.tabsById?.[text(tabOrId)] : tabOrId;
    if (!tab) return `collection\u300A${this.getAuditCollectionLabel()}\u300B`;
    const trail = [];
    let cursor = tab;
    const seen = /* @__PURE__ */ new Set();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      trail.unshift(`Tab\u300A${text(cursor.name, cursor.id)}\u300B`);
      cursor = text(cursor.parentTabId) ? this.data.tabsById?.[text(cursor.parentTabId)] : null;
    }
    return [`collection\u300A${this.getAuditCollectionLabel()}\u300B`].concat(trail).join(" / ");
  }
  buildAuditItemLocation(itemOrId) {
    const item = typeof itemOrId === "string" ? this.data.itemsById?.[text(itemOrId)] : itemOrId;
    if (!item) return this.buildAuditTabLocation(this.data.activeTabId);
    const parts = [this.buildAuditTabLocation(item.tabId)];
    const trail = [];
    let cursor = text(item.parentId) || null;
    const seen = /* @__PURE__ */ new Set();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const parent = this.data.itemsById?.[cursor];
      if (!parent) break;
      trail.unshift(`\u6761\u76EE\u300A${text(parent.title, parent.id)}\u300B`);
      cursor = text(parent.parentId) || null;
    }
    trail.push(`\u6761\u76EE\u300A${text(item.title, item.id)}\u300B`);
    return parts.concat(trail).join(" / ");
  }
  describeItemNoteBinding(itemOrId) {
    const item = typeof itemOrId === "string" ? this.data.itemsById?.[text(itemOrId)] : itemOrId;
    const path = text(item?.noteBinding?.path, "") || "\u65E0";
    const expanded = item?.noteExpanded === true ? "\u662F" : "\u5426";
    return `\u7ED1\u5B9A\u7B14\u8BB0\uFF1A${path}\uFF1B\u5C55\u5F00\uFF1A${expanded}`;
  }
  describeItemParentLabel(itemOrId) {
    const item = typeof itemOrId === "string" ? this.data.itemsById?.[text(itemOrId)] : itemOrId;
    if (!item) return "\u672A\u77E5";
    if (!text(item.parentId)) return "\u6839\u5C42";
    const parent = this.data.itemsById?.[text(item.parentId)];
    return parent ? `\u6761\u76EE\u300A${text(parent.title, parent.id)}\u300B` : `\u6761\u76EE\u300A${text(item.parentId)}\u300B`;
  }
  async beginAuditRecord(draft = {}) {
    const api = this.getOperationAuditApi();
    if (!api?.beginOperation) return null;
    try {
      return await api.beginOperation(Object.assign({
        "\u6765\u6E90\u63D2\u4EF6": "collection card view",
        "\u6765\u6E90\u5B9E\u4F8B": text(this.sourceFile?.path || this.sourceNotePath, ""),
        "\u4F1A\u8BDD\u7F16\u53F7": text(this.sourceFile?.path || this.sourceNotePath, "collection-card-view"),
        "\u6570\u636E\u4F4D\u7F6E": text(this.dataPath, ""),
        "\u6269\u5C55_collection_notePath": text(this.sourceFile?.path || this.sourceNotePath, "")
      }, draft));
    } catch (error) {
      console.error("[Collection Card View] audit begin failed:", error);
      return null;
    }
  }
  async finishAuditRecord(handle, patch = {}) {
    const operationId = text(handle?.operationId, "");
    const api = this.getOperationAuditApi();
    if (!operationId || !api?.finishOperation) return null;
    try {
      return await api.finishOperation(operationId, patch);
    } catch (error) {
      console.error("[Collection Card View] audit finish failed:", error);
      return null;
    }
  }
  async runAuditedOperation(draft, executor, options = {}) {
    const handle = await this.beginAuditRecord(draft);
    try {
      const result = await executor();
      const succeeded = typeof options?.isSuccess === "function" ? options.isSuccess(result) : result !== false;
      await this.finishAuditRecord(handle, Object.assign({
        "\u7ED3\u679C": succeeded ? "success" : "failed",
        "\u5931\u8D25\u539F\u56E0": succeeded ? "" : text(options?.failureReason, "operation returned false")
      }, typeof options?.buildPatch === "function" ? options.buildPatch(result) : {}));
      return result;
    } catch (error) {
      await this.finishAuditRecord(handle, {
        "\u7ED3\u679C": "failed",
        "\u5931\u8D25\u539F\u56E0": text(error?.message, String(error || "unknown error"))
      });
      throw error;
    }
  }
  getItemRelationNodeKey(itemId) {
    const notePath = this.getRelationNotePath();
    const item = this.data.itemsById?.[text(itemId)];
    if (!notePath || !item) return "";
    return buildCollectionJumpNodeKey(notePath, item.tabId, item.id);
  }
  getItemRelationSnapshot(itemId) {
    const api = this.getRelationsPluginApi();
    const nodeKey = this.getItemRelationNodeKey(itemId);
    if (!api?.getNodeRelationSnapshot || !nodeKey) return { outgoing: [], incoming: [] };
    return api.getNodeRelationSnapshot(nodeKey) || { outgoing: [], incoming: [] };
  }
  async openRelationEditorForItem(itemId) {
    if (this.historySession) return this.rejectHistoryWrite("openRelationEditorForItem");
    const api = this.getRelationsPluginApi();
    const nodeKey = this.getItemRelationNodeKey(itemId);
    if (!api?.openRelationEditor || !nodeKey) {
      new Notice("\u26A0\uFE0F \u8BF7\u5148\u542F\u7528 EVA Cross View Relations \u63D2\u4EF6");
      return false;
    }
    await this.syncRelationAdapter({ force: true });
    api.markLastFocusedNode?.(nodeKey);
    await api.openRelationEditor(nodeKey);
    return true;
  }
  async captureEvaMetaForItem(itemId, context = {}) {
    if (this.historySession) return this.rejectHistoryWrite("captureEvaMetaForItem");
    const api = this.getRelationsPluginApi();
    const nodeKey = this.getItemRelationNodeKey(itemId);
    const item = this.data.itemsById?.[text(itemId)];
    if (!api?.captureMetaNode || !nodeKey) {
      new Notice("\u26A0\uFE0F \u8BF7\u5148\u542F\u7528 EVA Cross View Relations \u63D2\u4EF6\u5E76\u8FDB\u5165 Meta \u6A21\u5F0F");
      return false;
    }
    await this.syncRelationAdapter({ force: true });
    api.markLastFocusedNode?.(nodeKey);
    const result = await api.captureMetaNode({
      nodeKey,
      label: text(context.label, item?.title || itemId),
      sourcePlugin: "collection-card-view",
      viewType: VIEW_TYPE
    });
    console.info("[Collection Card View][eva-meta][capture.click]", {
      nodeKey,
      itemId,
      status: result?.ok ? "PASS" : "FAIL",
      phase: result?.state?.phase || "",
      reasonCodes: result?.reason ? [result.reason] : []
    });
    return !!result?.ok;
  }
  buildRelationPathLabel(itemId) {
    const item = this.data.itemsById?.[text(itemId)];
    if (!item) return "";
    const tab = this.data.tabsById?.[text(item.tabId)];
    const parts = [
      text(this.sourceFile?.basename || this.sourceNotePath),
      text(tab?.name, item.tabId)
    ].filter(Boolean);
    const trail = [];
    let cursor = text(item.parentId) || null;
    const seen = /* @__PURE__ */ new Set();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const parent = this.data.itemsById?.[cursor];
      if (!parent) break;
      trail.unshift(text(parent.title, parent.id));
      cursor = text(parent.parentId) || null;
    }
    trail.push(text(item.title, item.id));
    return parts.concat(trail).join(" / ");
  }
  getContextCapsuleCarrierSnapshot(options = {}) {
    const requestedTargets = Array.isArray(options?.contextKeys) ? options.contextKeys.map((entry) => text(entry, "")).filter(Boolean) : [];
    if (requestedTargets.length > 0) {
      const limit2 = Math.max(1, Math.min(200, Number(options?.limit || 80) || 80));
      const startedAt = Date.now();
      const targets = {};
      let totalCount = 0;
      let returnedCount = 0;
      let hasMore = false;
      let matchedCarrierCount = 0;
      requestedTargets.forEach((target) => {
        const snapshot = this.getContextCapsuleCarrierSnapshot(Object.assign({}, options, {
          contextKeys: void 0,
          contextKey: target,
          displayLabel: target
        }));
        const key = normalizeKeywordKey(normalizeContextCapsuleDisplayLabel(target));
        targets[key] = Object.assign({}, snapshot, {
          indexVersion: "context-carrier-index-v1",
          fromIndex: true
        });
        totalCount += Number(snapshot.totalCount ?? snapshot.items?.length ?? 0);
        returnedCount += Number(snapshot.returnedCount ?? snapshot.items?.length ?? 0);
        matchedCarrierCount += Number(snapshot.matchedCarrierCount || 0);
        if (snapshot.hasMore || snapshot.truncated) hasMore = true;
      });
      return {
        ok: true,
        pluginId: "collection-card-view",
        source: "collection-card-view",
        contextKey: "",
        matchedCarrierCount,
        totalCount,
        returnedCount,
        count: returnedCount,
        limit: limit2,
        hasMore,
        cursor: "",
        revision: text(this.data?.lastModified || this.data?.updatedAt || this.data?.version || this.dataPath || ""),
        timingMs: Date.now() - startedAt,
        items: [],
        truncated: hasMore,
        targets,
        indexVersion: "context-carrier-index-v1",
        fromIndex: true
      };
    }
    const requested = text(options?.contextKey || options?.displayLabel || "");
    const requestedKey = normalizeKeywordKey(normalizeContextCapsuleDisplayLabel(requested));
    const limit = Math.max(1, Math.min(200, Number(options?.limit || 80) || 80));
    const matchedTabs = Object.values(this.data.tabsById || {}).filter((tab) => this.getTabCapsuleKeywords(tab?.id).some((entry) => {
      const matched = this.getContextCapsuleKeyForTabKeyword(entry.keyword);
      return normalizeKeywordKey(normalizeContextCapsuleDisplayLabel(matched?.displayLabel || entry.keyword)) === requestedKey;
    }));
    const items = [];
    const seen = /* @__PURE__ */ new Set();
    const pushItem = (itemId, tab, depth = 0) => {
      const item = this.data.itemsById?.[text(itemId)];
      if (!item || seen.has(item.id) || text(item.tabId) !== text(tab.id)) return;
      seen.add(item.id);
      const nodeKey = this.getItemRelationNodeKey(item.id);
      const pathLabel = this.buildRelationPathLabel(item.id);
      if (nodeKey) {
        items.push({
          nodeKey,
          label: text(item.title, item.id),
          pathLabel,
          notePath: this.getRelationNotePath(),
          viewType: VIEW_TYPE,
          viewLabel: this.sourceFile?.basename || "Collection Card View",
          searchText: [
            text(item.title, item.id),
            text(item.comment, ""),
            text(item.noteBinding?.path, ""),
            text(tab?.name, tab.id),
            pathLabel
          ].filter(Boolean).join(" "),
          metaFields: [
            { label: "Tab", value: text(tab?.name, tab.id) },
            { label: "Note", value: this.getRelationNotePath() }
          ],
          depth,
          sourcePlugin: "collection-card-view",
          carrierId: tab.id,
          carrierLabel: text(tab?.name, tab.id),
          contextKey: requested,
          order: items.length,
          orderPath: [items.length]
        });
      }
      if (items.length >= limit) return;
      (this.data.childrenByParentByTab?.[tabParentKey(tab.id, item.id)] || []).forEach((childId) => {
        if (items.length < limit) pushItem(childId, tab, depth + 1);
      });
    };
    matchedTabs.forEach((tab) => {
      if (items.length >= limit) return;
      (this.data.childrenByParentByTab?.[tabParentKey(tab.id, null)] || []).forEach((itemId) => {
        if (items.length < limit) pushItem(itemId, tab, 0);
      });
    });
    return {
      ok: true,
      pluginId: "collection-card-view",
      source: "collection-card-view",
      contextKey: requested,
      matchedCarrierCount: matchedTabs.length,
      totalCount: seen.size,
      returnedCount: items.length,
      count: items.length,
      limit,
      hasMore: seen.size > items.length || items.length >= limit,
      cursor: seen.size > items.length || items.length >= limit ? String(items.length) : "",
      revision: text(this.data?.lastModified || this.data?.updatedAt || this.data?.version || this.dataPath || ""),
      timingMs: 0,
      items,
      truncated: seen.size > items.length || items.length >= limit
    };
  }
  listRelationItems() {
    const notePath = this.getRelationNotePath();
    if (!notePath) return [];
    return Object.values(this.data.itemsById || {}).filter(Boolean).map((item) => {
      const tab = this.data.tabsById?.[text(item.tabId)];
      const pathLabel = this.buildRelationPathLabel(item.id);
      return {
        nodeKey: buildCollectionJumpNodeKey(notePath, item.tabId, item.id),
        label: text(item.title, item.id),
        pathLabel,
        searchText: [
          text(item.title, item.id),
          text(item.comment, ""),
          text(item.noteBinding?.path, ""),
          text(tab?.name, item.tabId),
          pathLabel
        ].filter(Boolean).join(" "),
        metaFields: [
          { label: "Tab", value: text(tab?.name, item.tabId) },
          { label: "Note", value: notePath }
        ]
      };
    });
  }
  // EVA-P1 (2026-10-21): every registerAdapter makes EVA rebuild this adapter's whole index and may persist EVA's whole
  // state. Re-register only when the indexed content (signature), this view instance or the EVA api object changed, or
  // when a relation operation forces it. Ownership hand-over on close: unregisterRelationAdapter().
  async syncRelationAdapter(options = {}) {
    const api = this.getRelationsPluginApi();
    const notePath = this.getRelationNotePath();
    if (!api?.registerAdapter || !notePath || !this.isReady()) return false;
    let signature = null;
    try { signature = JSON.stringify([this.relationAdapterId, notePath, this.sourceFile?.basename || "Collection Card View", this.listRelationItems()]); } catch (_) { signature = null; }
    const last = this.relationAdapterSyncState;
    if (!options.force && signature !== null && last && last.api === api && last.signature === signature) return true;
    const record = signature !== null ? { api, signature } : null;
    this.relationAdapterSyncState = record;
    let registered;
    try {
    registered = await api.registerAdapter({
      adapterId: this.relationAdapterId,
      viewType: VIEW_TYPE,
      notePath,
      viewLabel: this.sourceFile?.basename || "Collection Card View",
      listItems: () => this.listRelationItems(),
      openNode: async (nodeKey, context = {}) => {
        const traceId = text(context?.evaTraceId, "");
        const parsed = parseCollectionJumpNodeKey(nodeKey);
        if (!parsed || parsed.notePath !== this.getRelationNotePath()) return false;
        await this.app.workspace.revealLeaf(this.leaf);
        logCollectionJump(traceId, "adapter.activate-leaf", { nodeKey, notePath: parsed.notePath, tabId: parsed.scopeId, itemId: parsed.itemId });
        return await this.revealItemInTab(parsed.scopeId, parsed.itemId, { source: "relation-adapter" });
      }
    });
    } catch (error) {
      if (record && this.relationAdapterSyncState === record) this.relationAdapterSyncState = null;
      throw error;
    }
    // registerAdapter returns null only for an invalid descriptor; then retry on the next render.
    if (!registered && record && this.relationAdapterSyncState === record) this.relationAdapterSyncState = null;
    return true;
  }
  unregisterRelationAdapter() {
    this.relationAdapterSyncState = null;
    const api = this.getRelationsPluginApi();
    if (!api?.unregisterAdapter) return false;
    const notePath = this.getRelationNotePath();
    api.unregisterAdapter(this.relationAdapterId);
    // EVA-P1 F1: EVA keeps the closed adapter's node records (same nodeKeys) under its adapterId; hand them over to
    // another open Collection view of the same note, so relation jumps keep a live adapter.
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const other = leaf.view;
      if (!notePath || !other || other === this || typeof other.syncRelationAdapter !== "function" || other.getRelationNotePath?.() !== notePath) continue;
      other.relationAdapterSyncState = null;
      void Promise.resolve(other.syncRelationAdapter({ force: true })).catch(() => {});
    }
    return true;
  }
  prepareRelationRevealState(data, tabId, itemId) {
    const normalizedTabId = text(tabId);
    const normalizedItemId = text(itemId);
    const item = data?.itemsById?.[normalizedItemId];
    if (!normalizedTabId || !normalizedItemId || !item || text(item.tabId) !== normalizedTabId) {
      return { ok: false, changed: false };
    }
    let changed = false;
    if (text(data.activeTabId) !== normalizedTabId) {
      data.activeTabId = normalizedTabId;
      changed = true;
    }
    let cursor = normalizedItemId;
    const seen = /* @__PURE__ */ new Set();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const current = data.itemsById?.[cursor];
      if (!current) break;
      if (current.isCollapsed) changed = true;
      current.isCollapsed = false;
      cursor = text(current.parentId) || null;
    }
    return { ok: true, changed };
  }
  async revealItemInTab(tabId, itemId, options = {}) {
    const tracking = this.getTrackingAdapter();
    if (tracking.hasInput() || tracking.isLoading()) return false;
    const pass = tracking.consumer.capture();
    if (pass.status !== "ready") { tracking.showPending(); return false; }
    if (this.historySession) this.leaveContextHistoryForExternal("revealItemInTab");
    const normalizedTabId = text(tabId);
    const normalizedItemId = text(itemId);
    const item = this.data.itemsById?.[normalizedItemId];
    if (!normalizedTabId || !normalizedItemId || !item || text(item.tabId) !== normalizedTabId) return false;
    this.pendingRelationFocus = { tabId: normalizedTabId, itemId: normalizedItemId, source: text(options?.source, "relation") };
    const previewData = sanitizeData(this.data);
    const preview = this.prepareRelationRevealState(previewData, normalizedTabId, normalizedItemId);
    if (!preview.ok) return false;
    if (preview.changed) {
      await this.persist((data) => {
        this.prepareRelationRevealState(data, normalizedTabId, normalizedItemId);
      });
      return !tracking.hasInput() && tracking.consumer.isCurrent(pass);
    }
    await this.render();
    return !tracking.hasInput() && tracking.consumer.isCurrent(pass);
  }
  flushPendingRelationFocus() {
    if (this.historySession) return false;
    const pending = this.pendingRelationFocus;
    if (!pending || text(this.data.activeTabId) !== text(pending.tabId)) return false;
    this.pendingRelationFocus = null;
    this.revealItemInView(pending.itemId);
    return true;
  }
  restorePendingRelationFocus() {
    if (this.historySession) return false;
    const api = this.getRelationsPluginApi();
    const notePath = this.getRelationNotePath();
    if (!api?.consumePendingFocus || !notePath) return false;
    const pending = api.consumePendingFocus(VIEW_TYPE, notePath);
    const parsed = parseCollectionJumpNodeKey(pending?.nodeKey || "");
    if (!parsed || parsed.notePath !== notePath) return false;
    void this.revealItemInTab(parsed.scopeId, parsed.itemId, { source: "relation-pending" });
    return true;
  }
  isReady() {
    return this.contentEl?.isConnected && this.sourceFile instanceof TFile && !!text(this.dataPath);
  }
  isProvisioningReady() {
    const loaded = this.provisioningLoadedSource;
    return this.isReady() && !this.provisioningLoadCount && !!loaded && loaded.generation === this.provisioningLoadGeneration && loaded.sourceNotePath === text(this.sourceFile?.path || this.sourceNotePath) && loaded.dataPath === this.dataPath && loaded.keywordPath === this.tabCapsuleKeywordsPath;
  }
  async reload() {
    const tracking = this.getTrackingAdapter();
    if (tracking.deferLoad(() => this.reload())) return false;
    tracking.sourceChanging();
    const generation = (this.provisioningLoadGeneration || 0) + 1;
    this.provisioningLoadGeneration = generation;
    this.provisioningLoadCount = (this.provisioningLoadCount || 0) + 1;
    this.provisioningLoadedSource = null;
    try {
      this.sourceFile = this.plugin.resolveSourceFile(this.sourceNotePath);
      if (!(this.sourceFile instanceof TFile)) {
        this.sourceNotePath = this.plugin.getDefaultSourceNotePath();
        this.sourceFile = this.plugin.resolveSourceFile(this.sourceNotePath);
      }
      this.dataPath = this.sourceFile ? this.plugin.resolveDataPathForFile(this.sourceFile) : "";
      this.tabCapsuleKeywordsPath = this.sourceFile ? this.plugin.resolveTabCapsuleKeywordsPathForFile(this.sourceFile) : "";
      const requestedPath = this.sourceNotePath;
      const sourceNotePath = this.sourceFile?.path || "";
      const dataPath = this.dataPath;
      const keywordPath = this.tabCapsuleKeywordsPath;
      const isCurrentLoad = () => !this.contextHistoryViewClosed && generation === this.provisioningLoadGeneration && this.sourceNotePath === requestedPath && (this.sourceFile?.path || "") === sourceNotePath && this.dataPath === dataPath && this.tabCapsuleKeywordsPath === keywordPath;
      const keywordLoad = keywordPath ? await this.plugin.loadTabCapsuleKeywords(keywordPath, sourceNotePath) : { data: defaultTabCapsuleKeywordData(), error: "" };
      if (!isCurrentLoad()) return;
      const loadedData = dataPath ? await this.plugin.loadCollectionData(dataPath) : defaultData();
      if (!isCurrentLoad()) return;
      this.data = loadedData;
      this.tabCapsuleKeywordData = keywordLoad.data;
      this.tabCapsuleKeywordLoadError = keywordLoad.error;
      tracking.loaded();
      await this.render();
      if (isCurrentLoad() && this.provisioningLoadCount === 1) {
        this.provisioningLoadedSource = { generation, sourceNotePath: text(sourceNotePath), dataPath, keywordPath };
      }
    } finally {
      this.provisioningLoadCount -= 1;
      if (!this.contextHistoryViewClosed && this.provisioningLoadCount === 0) tracking.lifecycle.poke("local");
    }
  }
  getBridgeState() {
    const pageScrollEl = this.contentEl;
    return {
      notePath: this.sourceFile?.path || this.sourceNotePath,
      activeTabId: this.data.activeTabId,
      tabTreeCollapsedById: clone(this.data.tabTreeCollapsedById, {}),
      floatingTocCollapsed: this.ui.floatingTocCollapsed === true,
      pageScrollTop: this.historySession ? this.historySession.savedUi.pageScrollTop : (pageScrollEl ? pageScrollEl.scrollTop : this.ui.pageScrollTop),
      tocScrollTop: this.historySession ? this.historySession.savedUi.tocScrollTop : (this.tocScrollEl ? this.tocScrollEl.scrollTop : this.ui.tocScrollTop),
      bridgeVersion: BRIDGE_VERSION,
      scriptVersion: SCRIPT_VERSION
    };
  }
  getHostIdentity() {
    return {
      scopeType: "note",
      notePath: this.sourceFile?.path || this.sourceNotePath,
      viewType: VIEW_TYPE,
      instanceId: this.hostId,
      hostId: this.hostId,
      leaseId: "",
      registrationEpoch: 0,
      heartbeatTtlMs: 0,
      expiresAt: null,
      capabilities: clone(BRIDGE_CAPABILITIES, []),
      transport: "owner-api"
    };
  }
  applyBridgeStateToMemory(rawState, data) {
    const next = sanitizeData(data);
    if (next.tabsById[text(rawState?.activeTabId)]) next.activeTabId = text(rawState.activeTabId);
    next.tabTreeCollapsedById = isObject(rawState?.tabTreeCollapsedById) ? clone(rawState.tabTreeCollapsedById, {}) : {};
    this.data = next;
    this.ui = {
      floatingTocCollapsed: rawState?.floatingTocCollapsed === true,
      pageScrollTop: Number.isFinite(rawState?.pageScrollTop) ? Number(rawState.pageScrollTop) : null,
      tocScrollTop: Number.isFinite(rawState?.tocScrollTop) ? Number(rawState.tocScrollTop) : null
    };
  }
  captureScrollState() {
    if (this.contentEl) {
      const nextPageTop = Number(this.contentEl.scrollTop);
      if (Number.isFinite(nextPageTop)) this.ui.pageScrollTop = nextPageTop;
    }
    if (this.tocScrollEl) {
      const nextTocTop = Number(this.tocScrollEl.scrollTop);
      if (Number.isFinite(nextTocTop)) this.ui.tocScrollTop = nextTocTop;
    }
    return {
      pageScrollTop: this.ui.pageScrollTop,
      tocScrollTop: this.ui.tocScrollTop
    };
  }
  bindScrollStateTracking() {
    if (typeof this.scrollStateCleanup === "function") {
      try {
        this.scrollStateCleanup();
      } catch (_) {
      }
      this.scrollStateCleanup = null;
    }
    const cleanups = [];
    const bind = (target) => {
      if (!target || typeof target.addEventListener !== "function") return;
      const onScroll = () => {
        this.captureScrollState();
      };
      target.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => {
        try {
          target.removeEventListener("scroll", onScroll);
        } catch (_) {
        }
      });
    };
    bind(this.contentEl);
    bind(this.tocScrollEl);
    this.scrollStateCleanup = () => {
      cleanups.splice(0).forEach((cleanup) => {
        try {
          cleanup();
        } catch (_) {
        }
      });
    };
  }
  restoreScrollState() {
    if (this.tocScrollEl && Number.isFinite(this.ui.tocScrollTop)) {
      this.tocScrollEl.scrollTop = Number(this.ui.tocScrollTop);
    }
    if (this.contentEl && Number.isFinite(this.ui.pageScrollTop)) {
      this.contentEl.scrollTop = Number(this.ui.pageScrollTop);
    }
  }
  disposePreviewComponents() {
    for (const component of this.previewComponents.splice(0)) {
      try {
        component?.unload?.();
      } catch (_) {
      }
    }
  }
  getNoteEditorState(itemId) {
    return this.noteEditorState[text(itemId)] || null;
  }
  setNoteEditorState(itemId, nextState) {
    const id = text(itemId);
    if (!id) return null;
    this.noteEditorState[id] = Object.assign({}, this.noteEditorState[id] || {}, nextState || {});
    return this.noteEditorState[id];
  }
  clearNoteEditorState(itemId) {
    const id = text(itemId);
    if (!id) return;
    delete this.noteEditorState[id];
  }
  autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 220)}px`;
  }
  async runWithPromptLock(workFn) {
    if (this.promptLock) return null;
    this.promptLock = true;
    try {
      return await workFn();
    } finally {
      this.promptLock = false;
      this.getTrackingAdapter().afterInput();
    }
  }
  async requestPrompt(title, placeholder = "", defaultValue = "") {
    if (this.historySession) return this.rejectHistoryWrite("requestPrompt");
    return this.runWithPromptLock(() => openQuickPrompt(this.app, title, placeholder, defaultValue));
  }
  async requestNoteBinding(currentNotePath = "") {
    if (this.historySession) return this.rejectHistoryWrite("requestNoteBinding");
    return this.runWithPromptLock(() => openVaultNotePicker(this.app, buildVaultIndex(this.app), currentNotePath || null));
  }
  async requestComment(title, defaultValue = "") {
    if (this.historySession) return this.rejectHistoryWrite("requestComment");
    return this.runWithPromptLock(() => openTaskCommentEditor(this.app, title, defaultValue));
  }
  getTabCapsuleKeywordAssignments() {
    return normalizeTabCapsuleKeywordData(this.tabCapsuleKeywordData || {}, {
      sourceNotePath: this.sourceFile?.path || this.sourceNotePath
    }).assignmentsByKeywordKey;
  }
  getProjectOverviewApi() {
    return window.__projectExecutionOverviewPluginApi || this.app?.plugins?.plugins?.[PROJECT_OVERVIEW_PLUGIN_ID]?.api || null;
  }
  getContextCapsuleKeysSync() {
    return this.getTrackingAdapter().currentKeys();
  }
  getCachedContextCapsuleKeys() {
    return this.getTrackingAdapter().currentKeys();
  }
  buildContextCapsuleKeyLookup(contextKeys = []) {
    const byDisplayLabel = /* @__PURE__ */ new Map();
    const byAlias = /* @__PURE__ */ new Map();
    (Array.isArray(contextKeys) ? contextKeys : []).forEach((key) => {
      const displayKey = normalizeKeywordKey(key?.displayLabel);
      if (displayKey && !byDisplayLabel.has(displayKey)) byDisplayLabel.set(displayKey, key);
      [key?.displayLabel, key?.canonicalLabel].map((candidate) => normalizeKeywordKey(candidate)).filter(Boolean).forEach((candidate) => {
        if (!byAlias.has(candidate)) byAlias.set(candidate, key);
      });
    });
    return { byDisplayLabel, byAlias };
  }
  refreshContextCapsuleKeysSoon() {
    this.getTrackingAdapter().lifecycle.poke("manual");
    return null;
  }
  getContextCapsuleKeyForTabKeyword(keywordLike = "", lookup = null) {
    const normalized = normalizeKeywordKey(keywordLike);
    const parsedKeyword = parseContextCapsuleLabel(keywordLike);
    const address = normalizeKeywordKey(parsedKeyword.address);
    const displayLabel = normalizeKeywordKey(parsedKeyword.displayLabel);
    if (!normalized) return null;
    const keyLookup = lookup || this.buildContextCapsuleKeyLookup(this.getContextCapsuleKeysSync());
    if (address) return displayLabel && keyLookup.byDisplayLabel.get(displayLabel) || null;
    return keyLookup.byAlias.get(normalized) || null;
  }
  getVirtualContextCapsuleKeys(assignments = this.getTabCapsuleKeywordAssignments(), contextKeys = null) {
    const assignedKeys = /* @__PURE__ */ new Set();
    const assignedLabelsWithoutAddress = /* @__PURE__ */ new Set();
    Object.values(assignments || {}).forEach((entry) => {
      const keyword = text(entry?.keyword, "");
      const keywordKey = normalizeKeywordKey(entry?.keywordKey || keyword);
      const parsedKeyword = parseContextCapsuleLabel(keyword);
      if (parsedKeyword.address) {
        if (parsedKeyword.displayLabel) assignedKeys.add(normalizeKeywordKey(parsedKeyword.displayLabel));
        if (keywordKey) assignedKeys.add(keywordKey);
      } else {
        if (keywordKey) {
          assignedKeys.add(keywordKey);
          assignedLabelsWithoutAddress.add(keywordKey);
        }
      }
    });
    const keys = Array.isArray(contextKeys) ? contextKeys : this.getContextCapsuleKeysSync();
    return keys.filter((key) => {
      const displayKey = normalizeKeywordKey(key.displayLabel);
      const labelKey = normalizeKeywordKey(key.canonicalLabel);
      if (displayKey && assignedKeys.has(displayKey)) return false;
      if (labelKey && assignedLabelsWithoutAddress.has(labelKey)) return false;
      return true;
    });
  }
  getTabCapsuleKeywords(tabId) {
    const normalizedTabId = text(tabId, "");
    if (!normalizedTabId) return [];
    return Object.values(this.getTabCapsuleKeywordAssignments()).filter((entry) => entry.tabId === normalizedTabId && !!this.data.tabsById?.[entry.tabId]).sort((left, right) => text(left.keyword, "").localeCompare(text(right.keyword, ""), "zh"));
  }
  normalizeTabCapsuleKeywordList(keywords = []) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    (Array.isArray(keywords) ? keywords : []).forEach((raw) => {
      const keyword = text(raw, "");
      const keywordKey = normalizeKeywordKey(keyword);
      if (!keyword || !keywordKey || seen.has(keywordKey)) return;
      seen.add(keywordKey);
      out.push({ keyword, keywordKey });
    });
    return out;
  }
  validateTabCapsuleKeywordAssignment(tabId, keywords = []) {
    const normalizedTabId = text(tabId, "");
    if (!normalizedTabId || !this.data.tabsById?.[normalizedTabId]) return { ok: false, message: "Target tab is missing." };
    const assignments = this.getTabCapsuleKeywordAssignments();
    const conflicts = this.normalizeTabCapsuleKeywordList(keywords).map((entry) => {
      const existing = assignments?.[entry.keywordKey];
      if (!existing || existing.tabId === normalizedTabId) return null;
      const existingTab = this.data.tabsById?.[existing.tabId];
      if (!existingTab) return null;
      return `${entry.keyword} -> ${existingTab.name || existing.tabNameSnapshot || existing.tabId}`;
    }).filter(Boolean);
    if (conflicts.length > 0) return { ok: false, message: `Keyword already bound to another tab: ${conflicts.join("; ")}` };
    return { ok: true, message: "" };
  }
  async editTabCapsuleKeywords(tabId) {
    if (this.historySession) return this.rejectHistoryWrite("editTabCapsuleKeywords");
    const normalizedTabId = text(tabId, "");
    const tab = this.data.tabsById?.[normalizedTabId];
    if (!tab) return false;
    if (this.tabCapsuleKeywordLoadError) {
      new Notice(this.tabCapsuleKeywordLoadError);
      return false;
    }
    const result = await this.runWithPromptLock(() => openTabCapsuleKeywordModal(this.app, {
      tabName: this.buildAuditTabLocation(tab),
      emoji: tab.emoji || "",
      keywords: this.getTabCapsuleKeywords(normalizedTabId).map((entry) => entry.keyword)
    }));
    if (result === null) return false;
    return await this.setTabCapsuleKeywordsAndEmoji(normalizedTabId, result.keywords || [], result.emoji || "");
  }
  async setTabCapsuleKeywordsAndEmoji(tabId, keywords = [], emoji = "", options = {}) {
    options.assertHost?.();
    const normalizedTabId = text(tabId, "");
    const tab = this.data.tabsById?.[normalizedTabId];
    if (!tab) return false;
    if (this.tabCapsuleKeywordLoadError) {
      new Notice(this.tabCapsuleKeywordLoadError);
      return false;
    }
    const normalizedKeywords = this.normalizeTabCapsuleKeywordList(keywords);
    const validation = this.validateTabCapsuleKeywordAssignment(normalizedTabId, normalizedKeywords.map((entry) => entry.keyword));
    if (!validation.ok) {
      new Notice(validation.message);
      return false;
    }
    const now = nowString();
    const sourceNotePath = text(this.sourceFile?.path || this.sourceNotePath, "");
    const nextKeywords = normalizeTabCapsuleKeywordData(this.tabCapsuleKeywordData || {}, { sourceNotePath });
    const keepKeys = new Set(normalizedKeywords.map((entry) => entry.keywordKey));
    Object.keys(nextKeywords.assignmentsByKeywordKey || {}).forEach((keywordKey) => {
      if (nextKeywords.assignmentsByKeywordKey[keywordKey]?.tabId === normalizedTabId && !keepKeys.has(keywordKey)) {
        delete nextKeywords.assignmentsByKeywordKey[keywordKey];
      }
    });
    normalizedKeywords.forEach((entry) => {
      const existing = nextKeywords.assignmentsByKeywordKey[entry.keywordKey];
      nextKeywords.assignmentsByKeywordKey[entry.keywordKey] = {
        keyword: entry.keyword,
        keywordKey: entry.keywordKey,
        sourceNotePath,
        tabId: normalizedTabId,
        tabNameSnapshot: text(tab.name, normalizedTabId),
        createdAt: text(existing?.createdAt, now),
        updatedAt: now
      };
    });
    options.assertHost?.();
    const savedKeywords = await this.plugin.saveTabCapsuleKeywords(this.tabCapsuleKeywordsPath, nextKeywords, sourceNotePath);
    options.assertHost?.();
    this.tabCapsuleKeywordData = savedKeywords;
    options.onCommitted?.();
    const nextEmoji = text(emoji, "");
    if (nextEmoji !== text(tab.emoji, "")) {
      await this.persist((data) => {
        const target = data.tabsById?.[normalizedTabId];
        if (!target) return;
        target.emoji = nextEmoji;
        target.updatedAt = nowString();
      }, options);
    } else if (options.rerender !== false) {
      await this.render();
    }
    new Notice("Tab keywords saved.");
    return true;
  }
  async renameContextCapsuleKey(options = {}) {
    if (text(options?.source, "") !== "project-execution-overview") {
      return { ok: false, pluginId: "collection-card-view", reason: "unsupported-source", matchedCount: 0, renamedCount: 0 };
    }
    const oldDisplayLabel = text(options?.oldDisplayLabel || options?.oldKey || "", "");
    const newDisplayLabel = text(options?.newDisplayLabel || options?.newKey || "", "");
    const dryRun = options?.dryRun === true;
    const oldKey = normalizeKeywordKey(oldDisplayLabel);
    const newKey = normalizeKeywordKey(newDisplayLabel);
    if (!oldKey || !newKey) return { ok: false, pluginId: "collection-card-view", reason: "missing-label", matchedCount: 0, renamedCount: 0 };
    if (oldKey === newKey) return { ok: true, pluginId: "collection-card-view", dryRun, matchedCount: 0, renamedCount: 0, skippedCount: 0 };
    if (this.tabCapsuleKeywordLoadError) {
      return { ok: false, pluginId: "collection-card-view", dryRun, reason: "keyword-load-error", message: this.tabCapsuleKeywordLoadError, matchedCount: 0, renamedCount: 0 };
    }
    const sourceNotePath = text(this.sourceFile?.path || this.sourceNotePath, "");
    const nextKeywords = normalizeTabCapsuleKeywordData(this.tabCapsuleKeywordData || {}, { sourceNotePath });
    const assignments = nextKeywords.assignmentsByKeywordKey || {};
    const matches = Object.values(assignments).filter((entry) => normalizeKeywordKey(entry?.keyword) === oldKey).map((entry) => ({
      keywordKey: normalizeKeywordKey(entry?.keywordKey || entry?.keyword),
      tabId: text(entry?.tabId, ""),
      tabName: text(this.data.tabsById?.[entry?.tabId]?.name || entry?.tabNameSnapshot || entry?.tabId, "")
    })).filter((entry) => entry.keywordKey && entry.tabId);
    const conflicts = [];
    const existingNew = assignments[newKey];
    if (existingNew && !matches.some((entry) => entry.tabId === existingNew.tabId)) {
      conflicts.push({
        keyword: newDisplayLabel,
        tabId: text(existingNew.tabId, ""),
        tabName: text(this.data.tabsById?.[existingNew.tabId]?.name || existingNew.tabNameSnapshot || existingNew.tabId, "")
      });
    }
    const preview = {
      ok: conflicts.length === 0,
      pluginId: "collection-card-view",
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
    const now = nowString();
    matches.forEach((match) => {
      const existing = assignments[match.keywordKey];
      if (!existing) return;
      delete assignments[match.keywordKey];
      assignments[newKey] = Object.assign({}, existing, {
        keyword: newDisplayLabel,
        keywordKey: newKey,
        updatedAt: now
      });
    });
    this.tabCapsuleKeywordData = await this.plugin.saveTabCapsuleKeywords(this.tabCapsuleKeywordsPath, nextKeywords, sourceNotePath);
    console.info("[Collection Card View][context-capsule.rename]", {
      oldDisplayLabel,
      newDisplayLabel,
      renamedCount: matches.length
    });
    await this.render();
    return Object.assign({}, preview, { ok: true, renamedCount: matches.length });
  }
  async syncContextCapsuleKey(options = {}) {
    if (text(options?.source, "") !== "project-execution-overview") {
      return { ok: false, pluginId: "collection-card-view", reason: "unsupported-source", matchedCount: 0, renamedCount: 0 };
    }
    const target = parseContextCapsuleLabel(options?.displayLabel || options?.newDisplayLabel || options?.newKey || "");
    const displayLabel = target.displayLabel;
    const targetKey = normalizeKeywordKey(displayLabel);
    const targetAddress = normalizeKeywordKey(target.address);
    const dryRun = options?.dryRun === true;
    if (!targetKey || !targetAddress) return { ok: false, pluginId: "collection-card-view", dryRun, reason: "missing-address", matchedCount: 0, renamedCount: 0 };
    if (this.tabCapsuleKeywordLoadError) {
      return { ok: false, pluginId: "collection-card-view", dryRun, reason: "keyword-load-error", message: this.tabCapsuleKeywordLoadError, matchedCount: 0, renamedCount: 0 };
    }
    const sourceNotePath = text(this.sourceFile?.path || this.sourceNotePath, "");
    const nextKeywords = normalizeTabCapsuleKeywordData(this.tabCapsuleKeywordData || {}, { sourceNotePath });
    const assignments = nextKeywords.assignmentsByKeywordKey || {};
    const matches = Object.values(assignments).map((entry) => {
      const parsed = parseContextCapsuleLabel(entry?.keyword);
      return {
        keywordKey: normalizeKeywordKey(entry?.keywordKey || entry?.keyword),
        displayLabel: parsed.displayLabel,
        address: normalizeKeywordKey(parsed.address),
        tabId: text(entry?.tabId, ""),
        tabName: text(this.data.tabsById?.[entry?.tabId]?.name || entry?.tabNameSnapshot || entry?.tabId, "")
      };
    }).filter((entry) => entry.keywordKey && entry.tabId && entry.address === targetAddress && entry.keywordKey !== targetKey);
    const conflicts = [];
    const matchedTabIds = Array.from(new Set(matches.map((entry) => entry.tabId).filter(Boolean)));
    if (matchedTabIds.length > 1) {
      conflicts.push({
        keyword: displayLabel,
        reason: "multiple-same-address-carriers",
        carriers: matches.map((entry) => ({ tabId: entry.tabId, tabName: entry.tabName, displayLabel: entry.displayLabel }))
      });
    }
    const existingTarget = assignments[targetKey];
    if (existingTarget && !matches.some((entry) => entry.tabId === existingTarget.tabId)) {
      conflicts.push({
        keyword: displayLabel,
        tabId: text(existingTarget.tabId, ""),
        tabName: text(this.data.tabsById?.[existingTarget.tabId]?.name || existingTarget.tabNameSnapshot || existingTarget.tabId, "")
      });
    }
    const preview = {
      ok: conflicts.length === 0,
      pluginId: "collection-card-view",
      dryRun,
      displayLabel,
      matchedCount: matches.length,
      renamedCount: dryRun || conflicts.length > 0 ? 0 : matches.length,
      skippedCount: 0,
      conflicts,
      details: matches
    };
    if (dryRun || conflicts.length > 0 || matches.length === 0) return preview;
    const now = nowString();
    matches.forEach((match) => {
      const existing = assignments[match.keywordKey];
      if (!existing) return;
      delete assignments[match.keywordKey];
      assignments[targetKey] = Object.assign({}, existing, {
        keyword: displayLabel,
        keywordKey: targetKey,
        updatedAt: now
      });
    });
    this.tabCapsuleKeywordData = await this.plugin.saveTabCapsuleKeywords(this.tabCapsuleKeywordsPath, nextKeywords, sourceNotePath);
    console.info("[Collection Card View][context-capsule.sync-repair]", {
      displayLabel,
      renamedCount: matches.length
    });
    await this.render();
    return Object.assign({}, preview, { ok: true, renamedCount: matches.length });
  }
  async renderMarkdownPreview(container, markdown, sourcePath) {
    if (!container?.isConnected) return;
    container.empty();
    const previewEl = container.createDiv({ cls: "collection-card-note-preview-body markdown-rendered" });
    const component = new Component();
    component.load();
    this.previewComponents.push(component);
    if (MarkdownRenderer && typeof MarkdownRenderer.render === "function") {
      await MarkdownRenderer.render(this.app, String(markdown || ""), previewEl, sourcePath, component);
      return;
    }
    if (MarkdownRenderer && typeof MarkdownRenderer.renderMarkdown === "function") {
      await MarkdownRenderer.renderMarkdown(String(markdown || ""), previewEl, sourcePath, component);
      return;
    }
    previewEl.setText(String(markdown || ""));
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
        console.warn("[CollectionCard][leaf.activate-failed]", { error: innerError || error });
      }
    }
    return false;
  }
  async openFilePreferExistingLeaf(file, openState = {}, fallbackLeafMode = "tab") {
    if (!(file instanceof TFile)) return null;
    const existingLeaf = this.findOpenRootLeafForFile(file);
    if (existingLeaf) {
      this.activateLeaf(existingLeaf, true);
      if (text(openState?.mode) === "source" && typeof existingLeaf.view?.setMode === "function") {
        try {
          await existingLeaf.view.setMode("source");
        } catch (_) {
        }
      }
      return existingLeaf;
    }
    const leaf = this.app.workspace.getLeaf(fallbackLeafMode) || this.app.workspace.getLeaf("tab") || this.app.workspace.getLeaf(true);
    await leaf.openFile(file, { active: true, state: openState });
    return leaf;
  }
  async openBoundNote(itemId, openState = {}) {
    const item = this.data.itemsById?.[text(itemId)];
    const file = this.plugin.resolveNoteFile(item?.noteBinding?.path || "");
    if (!file) {
      new Notice("\u7ED1\u5B9A\u7684\u7B14\u8BB0\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u7ED1\u5B9A");
      return null;
    }
    const leaf = await this.openFilePreferExistingLeaf(file, openState, "window");
    if (text(openState?.mode) === "source" && typeof leaf.view?.setMode === "function") {
      try {
        await leaf.view.setMode("source");
      } catch (_) {
      }
    }
    return file;
  }
  async openBoundNoteInTab(itemId, openState = {}) {
    const item = this.data.itemsById?.[text(itemId)];
    const file = this.plugin.resolveNoteFile(item?.noteBinding?.path || "");
    if (!file) {
      new Notice("\u7ED1\u5B9A\u7684\u7B14\u8BB0\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u7ED1\u5B9A");
      return null;
    }
    const leaf = await this.openFilePreferExistingLeaf(file, openState, "tab");
    if (text(openState?.mode) === "source" && typeof leaf.view?.setMode === "function") {
      try {
        await leaf.view.setMode("source");
      } catch (_) {
      }
    }
    return file;
  }
  async editBoundNote(itemId) {
    if (this.historySession) return this.rejectHistoryWrite("editBoundNote");
    return this.openBoundNote(itemId, { mode: "source" });
  }
  async bindNoteToItem(itemId) {
    if (this.historySession) return this.rejectHistoryWrite("bindNoteToItem");
    const id = text(itemId);
    const item = this.data.itemsById?.[id];
    if (!item) return;
    const previousBindingText = this.describeItemNoteBinding(item);
    const selected = await this.requestNoteBinding(item.noteBinding?.path || "");
    if (!selected) return;
    if (selected.kind === "current") {
      await this.openBoundNote(id);
      return;
    }
    if (selected.kind === "clear") {
      let changed2 = false;
      await this.runAuditedOperation({
        "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
        "\u5BF9\u8C61\u540D\u79F0": text(item.title, item.id),
        "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(item),
        "\u64CD\u4F5C\u7C7B\u578B": "\u7B14\u8BB0\u7ED1\u5B9A\u4FEE\u6539",
        "\u4FEE\u6539\u6458\u8981": "\u6E05\u9664\u6761\u76EE\u7B14\u8BB0\u7ED1\u5B9A",
        "\u4FEE\u6539\u524D": previousBindingText,
        "\u4FEE\u6539\u540E": "\u7ED1\u5B9A\u7B14\u8BB0\uFF1A\u65E0\uFF1B\u5C55\u5F00\uFF1A\u5426",
        "\u6269\u5C55_collection_tab": text(item.tabId, ""),
        "\u6269\u5C55_collection_item": id
      }, async () => {
        return await this.persist((data) => {
          const target = data.itemsById?.[id];
          if (!target) return;
          target.noteBinding = null;
          target.noteExpanded = false;
          target.updatedAt = nowString();
          changed2 = true;
        });
      }, {
        isSuccess: (result) => result === true && changed2,
        failureReason: "item missing",
        buildPatch: () => ({
          "\u4FEE\u6539\u540E": this.describeItemNoteBinding(id)
        })
      });
      new Notice("\u5DF2\u6E05\u9664\u7B14\u8BB0\u7ED1\u5B9A\u3002");
      return;
    }
    let targetPath = selected.path || selected.file_path || selected.filePath || null;
    if (!targetPath && selected.kind === "manual") targetPath = selected.raw || null;
    const file = this.plugin.resolveNoteFile(targetPath || "");
    if (!file) {
      new Notice("\u672A\u5339\u914D\u5230\u73B0\u6709\u7B14\u8BB0\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u6216\u8DEF\u5F84\u3002");
      return;
    }
    let changed = false;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": text(item.title, item.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(item),
      "\u64CD\u4F5C\u7C7B\u578B": "\u7B14\u8BB0\u7ED1\u5B9A\u4FEE\u6539",
      "\u4FEE\u6539\u6458\u8981": "\u4FEE\u6539\u6761\u76EE\u7B14\u8BB0\u7ED1\u5B9A",
      "\u4FEE\u6539\u524D": previousBindingText,
      "\u4FEE\u6539\u540E": `\u7ED1\u5B9A\u7B14\u8BB0\uFF1A${file.path}\uFF1B\u5C55\u5F00\uFF1A${item.noteExpanded === true ? "\u662F" : "\u5426"}`,
      "\u6269\u5C55_collection_tab": text(item.tabId, ""),
      "\u6269\u5C55_collection_item": id
    }, async () => {
      return await this.persist((data) => {
        const target = data.itemsById?.[id];
        if (!target) return;
        target.noteBinding = { path: file.path, ctime: Number(file.stat?.ctime) || null };
        target.updatedAt = nowString();
        changed = true;
      });
    }, {
      isSuccess: (result) => result === true && changed,
      failureReason: "item missing",
      buildPatch: () => ({
        "\u4FEE\u6539\u540E": this.describeItemNoteBinding(id)
      })
    });
    new Notice(`\u5DF2\u7ED1\u5B9A\u7B14\u8BB0\uFF1A${file.basename}`);
  }
  async editItemComment(itemId) {
    if (this.historySession) return this.rejectHistoryWrite("editItemComment");
    const id = text(itemId);
    const item = this.data.itemsById?.[id];
    if (!item) return;
    const result = await this.requestComment(`\u8BC4\u8BBA\uFF1A${item.title}`, item.comment || "");
    if (result == null) return;
    const nextComment = String(result || "").trim();
    let changed = false;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": text(item.title, item.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(item),
      "\u64CD\u4F5C\u7C7B\u578B": "\u8BC4\u8BBA\u4FEE\u6539",
      "\u4FEE\u6539\u6458\u8981": "\u4FEE\u6539\u6761\u76EE\u8BC4\u8BBA",
      "\u4FEE\u6539\u524D": text(item.comment, ""),
      "\u4FEE\u6539\u540E": nextComment,
      "\u6269\u5C55_collection_tab": text(item.tabId, ""),
      "\u6269\u5C55_collection_item": id
    }, async () => {
      return await this.persist((data) => {
        const target = data.itemsById?.[id];
        if (!target) return;
        target.comment = nextComment;
        target.updatedAt = nowString();
      });
    });
  }
  async renameItem(itemId) {
    if (this.historySession) return this.rejectHistoryWrite("renameItem");
    const id = text(itemId);
    const item = this.data.itemsById?.[id];
    if (!item) return;
    const rawTitle = await this.requestPrompt("\u91CD\u547D\u540D\u6761\u76EE", "\u8F93\u5165\u65B0\u7684\u6761\u76EE\u540D\u79F0", item.title || "");
    if (rawTitle == null) return;
    const nextTitle = text(rawTitle, "");
    if (!nextTitle || nextTitle === item.title) return;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": text(item.title, item.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(item),
      "\u64CD\u4F5C\u7C7B\u578B": "\u91CD\u547D\u540D",
      "\u4FEE\u6539\u6458\u8981": "\u4FEE\u6539\u6761\u76EE\u6807\u9898",
      "\u4FEE\u6539\u524D": text(item.title, item.id),
      "\u4FEE\u6539\u540E": nextTitle,
      "\u6269\u5C55_collection_tab": text(item.tabId, ""),
      "\u6269\u5C55_collection_item": id
    }, async () => {
      return await this.persist((data) => {
        const target = data.itemsById?.[id];
        if (!target) return;
        target.title = nextTitle;
        target.updatedAt = nowString();
      });
    }, {
      buildPatch: () => ({
        "\u5BF9\u8C61\u540D\u79F0": nextTitle,
        "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(id)
      })
    });
  }
  async beginInlineNoteEdit(itemId) {
    if (this.historySession) return this.rejectHistoryWrite("beginInlineNoteEdit");
    const item = this.data.itemsById?.[text(itemId)];
    const file = this.plugin.resolveNoteFile(item?.noteBinding?.path || "");
    if (!file) {
      new Notice("\u7ED1\u5B9A\u7684\u7B14\u8BB0\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u7ED1\u5B9A");
      return;
    }
    const tracking = this.getTrackingAdapter();
    const hasEditor = () => tracking.hasInput() || Object.values(this.noteEditorState || {}).some(state => state?.isEditing);
    if (hasEditor()) { new Notice("请先保存或取消当前编辑。"); return false; }
    const editorToken = tracking.makeEditorToken(item);
    if (!tracking.canSaveEditor(editorToken)) { tracking.showPending(); return; }
    try {
      const markdown = await this.app.vault.cachedRead(file);
      if (hasEditor()) { new Notice("请先保存或取消当前编辑。"); return false; }
      if (!tracking.canSaveEditor(editorToken)) { tracking.showPending(); return; }
      this.setNoteEditorState(itemId, { editorToken, isEditing: true, draft: markdown, saving: false, error: "" });
      await this.render();
    } catch (error) {
      new Notice(`\u8BFB\u53D6\u7B14\u8BB0\u5931\u8D25\uFF1A${error.message || error}`);
    }
  }
  async cancelInlineNoteEdit(itemId, token) {
    const tracking = this.getTrackingAdapter();
    const state = this.getNoteEditorState(itemId);
    if (this.historySession || !tracking.validEditorToken(token) || state?.editorToken !== token || state.saving) return false;
    this.clearNoteEditorState(itemId);
    await this.render();
    tracking.afterInput();
    return true;
  }
  async saveInlineNoteEdit(itemId, token) {
    if (this.historySession) return this.rejectHistoryWrite("saveInlineNoteEdit");
    const tracking = this.getTrackingAdapter();
    if (!tracking.canSaveEditor(token)) { tracking.showPending(); return false; }
    const item = this.data.itemsById?.[text(itemId)];
    const state = this.getNoteEditorState(itemId);
    if (state?.editorToken !== token || state.saving) return false;
    const file = this.plugin.resolveNoteFile(item?.noteBinding?.path || "");
    if (!file || !state?.isEditing) return;
    if (file.extension !== "md") { new Notice("只能在这里编辑 Markdown 笔记，已阻止写入非笔记文件"); return; }
    this.setNoteEditorState(itemId, { saving: true, error: "" });
    await this.render();
    try {
      await this.app.vault.modify(file, String(state.draft || ""));
      if (tracking.validEditorToken(token) && this.getNoteEditorState(itemId)?.editorToken === token) this.clearNoteEditorState(itemId);
      new Notice(`\u5DF2\u4FDD\u5B58\u7B14\u8BB0\uFF1A${file.basename}`);
      await this.render();
      tracking.afterInput();
    } catch (error) {
      if (tracking.validEditorToken(token) && this.getNoteEditorState(itemId)?.editorToken === token) this.setNoteEditorState(itemId, { saving: false, error: error.message || "\u4FDD\u5B58\u5931\u8D25" });
      new Notice(`\u4FDD\u5B58\u7B14\u8BB0\u5931\u8D25\uFF1A${error.message || error}`);
      await this.render();
      tracking.afterInput();
    }
  }
  async renderInlineNote(container, item) {
    if (!container?.isConnected || !item?.noteBinding?.path) return;
    const file = this.plugin.resolveNoteFile(item.noteBinding.path);
    const editorState = this.historySession ? {} : this.getNoteEditorState(item.id);
    const tracking = this.getTrackingAdapter();
    const token = editorState?.editorToken || tracking.makeEditorToken(item);
    if (!tracking.validEditorToken(token)) return;
    container.empty();
    if (!file) {
      container.createDiv({ cls: "collection-card-note-empty", text: "\u7ED1\u5B9A\u7684\u7B14\u8BB0\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u7ED1\u5B9A" });
      return;
    }
    const toolbar = container.createDiv({ cls: "collection-card-note-toolbar" });
    toolbar.createDiv({ cls: "collection-card-status", text: `${file.basename} \xB7 ${editorState?.isEditing ? "\u7F16\u8F91\u6A21\u5F0F" : "\u9884\u89C8\u6A21\u5F0F"}` });
    const toolActions = toolbar.createDiv({ cls: "collection-card-line-actions" });
    toolActions.createEl("button", { cls: "collection-card-sub-btn", text: "\u6253\u5F00\u7B14\u8BB0" }).onclick = async () => {
      await this.openBoundNote(item.id);
    };
    if (editorState?.isEditing) {
      const saveBtn = toolActions.createEl("button", { cls: "collection-card-sub-btn", text: editorState.saving ? "\u4FDD\u5B58\u4E2D..." : "\u4FDD\u5B58\u7B14\u8BB0" });
      tracking.stamp(saveBtn, token, "save");
      saveBtn.disabled = !!editorState.saving;
      saveBtn.onclick = async () => {
        await this.saveInlineNoteEdit(item.id, token);
      };
      const cancelBtn = toolActions.createEl("button", { cls: "collection-card-sub-btn", text: "\u53D6\u6D88\u7F16\u8F91" });
      tracking.stamp(cancelBtn, token, "cancel");
      cancelBtn.disabled = !!editorState.saving;
      cancelBtn.onclick = async () => {
        await this.cancelInlineNoteEdit(item.id, token);
      };
      const liveWrap = container.createDiv({ cls: "collection-card-note-live-wrap" });
      const editorWrap = liveWrap.createDiv({ cls: "collection-card-note-editor-wrap" });
      editorWrap.createDiv({ cls: "collection-card-status", text: "Markdown \u7F16\u8F91" });
      const textarea = editorWrap.createEl("textarea", { cls: "collection-card-note-editor", text: String(editorState.draft || "") });
      tracking.stamp(textarea, token, "text");
      textarea.disabled = !!editorState.saving;
      textarea.placeholder = "\u5728\u8FD9\u91CC\u76F4\u63A5\u7F16\u8F91\u7ED1\u5B9A\u7B14\u8BB0\u7684 Markdown \u5185\u5BB9...";
      this.autoResizeTextarea(textarea);
      const previewWrap = liveWrap.createDiv({ cls: "collection-card-note-preview-wrap" });
      previewWrap.createDiv({ cls: "collection-card-status", text: "\u5B9E\u65F6\u6E32\u67D3\u9884\u89C8" });
      const previewHost = previewWrap.createDiv();
      const refreshPreview = async () => {
        if (!previewHost.isConnected || !tracking.validEditorToken(token)) return;
        previewHost.empty();
        const loading2 = previewHost.createDiv({ cls: "collection-card-note-loading", text: "\u6B63\u5728\u5237\u65B0\u9884\u89C8..." });
        try {
          await this.renderMarkdownPreview(previewHost, textarea.value, file.path);
        } catch (error) {
          if (!previewHost.isConnected || !tracking.validEditorToken(token)) return;
          previewHost.empty();
          previewHost.createDiv({ cls: "collection-card-note-empty", text: `\u9884\u89C8\u5931\u8D25\uFF1A${error.message || error}` });
        } finally {
          if (loading2.isConnected) loading2.remove();
        }
      };
      textarea.addEventListener("input", () => {
        if (!tracking.validEditorToken(token) || this.getNoteEditorState(item.id)?.editorToken !== token || this.getNoteEditorState(item.id).saving) return;
        this.setNoteEditorState(item.id, { draft: textarea.value });
        this.autoResizeTextarea(textarea);
        refreshPreview();
      });
      textarea.addEventListener("keydown", async (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          await this.saveInlineNoteEdit(item.id, token);
        }
      });
      await refreshPreview();
      if (!tracking.validEditorToken(token) || !container.isConnected) return;
      if (editorState.error) {
        editorWrap.createDiv({ cls: "collection-card-note-empty", text: `\u7F16\u8F91\u9519\u8BEF\uFF1A${editorState.error}` });
      }
      return;
    }
    toolActions.createEl("button", { cls: "collection-card-sub-btn", text: "\u7F16\u8F91" }).onclick = async () => {
      await this.editBoundNote(item.id);
    };
    const loading = container.createDiv({ cls: "collection-card-note-loading", text: "\u6B63\u5728\u52A0\u8F7D\u7B14\u8BB0\u5168\u6587..." });
    try {
      const markdown = await this.app.vault.cachedRead(file);
      if (!container.isConnected || !tracking.validEditorToken(token)) return;
      loading.remove();
      const previewHost = container.createDiv();
      await this.renderMarkdownPreview(previewHost, markdown, file.path);
    } catch (error) {
      if (!container.isConnected || !tracking.validEditorToken(token)) return;
      container.empty();
      container.createDiv({ cls: "collection-card-note-empty", text: `\u6E32\u67D3\u5931\u8D25\uFF1A${error.message || error}` });
    }
  }
  async applyBridgeState(rawState, options = {}) {
    const tracking = this.getTrackingAdapter();
    const refused = () => ({ ok: false, applied: [], skipped: ["collectionCard"], warnings: ["Collection 正在编辑、加载或等待追踪状态核验，请稍后重试。"] });
    if (tracking.hasInput() || tracking.isLoading() || this.contextHistoryViewClosed) return refused();
    if (this.historySession) this.leaveContextHistoryForExternal("applyBridgeState");
    const targetNotePath = text(rawState?.notePath, this.sourceNotePath || this.plugin.getDefaultSourceNotePath());
    if (targetNotePath && targetNotePath !== (this.sourceFile?.path || this.sourceNotePath)) await this.setState({ sourceNotePath: targetNotePath });
    if (!this.isReady()) return { ok: false, applied: [], skipped: ["collectionCard"], warnings: ["collection card bridge not ready"] };
    if (targetNotePath !== (this.sourceFile?.path || this.sourceNotePath)) return refused();
    const pass = tracking.consumer.capture();
    if (pass.status !== "ready") { tracking.showPending(); return refused(); }
    const liveData = await this.plugin.loadCollectionData(this.dataPath);
    if (!tracking.consumer.isCurrent(pass) || tracking.hasInput() || tracking.isLoading() || this.contextHistoryViewClosed) return refused();
    this.applyBridgeStateToMemory(rawState, liveData);
    if (options?.rerender !== false && await this.render() === false) return refused();
    return { ok: true, applied: ["activeTabId", "tabTreeCollapsedById", "floatingTocCollapsed"], skipped: [], warnings: [] };
  }
  async persist(mutator, options = {}) {
    const path = this.dataPath;
    // The data file has no source field; the source is fixed when the write is queued.
    const sourceNotePath = this.sourceFile?.path || "";
    const generation = this.provisioningLoadGeneration;
    const assertHost = () => {
      if (path !== this.dataPath || generation !== this.provisioningLoadGeneration || this.plugin.actionEntryClosed) throw new Error("collection-write-host-changed");
      options.assertHost?.();
    };
    return actionEntry.enqueue(this.plugin, path, async () => {
      assertHost();
      return this.persistQueued(mutator, { ...options, assertHost, sourceNotePath });
    });
  }
  async persistQueued(mutator, options = {}) {
    options.assertHost?.();
    const next = clone(this.data, defaultData());
    await Promise.resolve(mutator(next));
    options.assertHost?.();
    next.lastModified = nowString();
    const safe = sanitizeData(next);
    if (!this.dataPath) throw new Error("collection-data-path-unresolved");
    await this.plugin.saveCollectionData(this.dataPath, safe, options.sourceNotePath);
    options.assertHost?.();
    this.data = safe;
    options.onCommitted?.();
    try { actionEntry.syncHosts(this.plugin, this.dataPath, this.data);
    if (options.rerender !== false) await this.render();
    } catch (error) { new Notice('内容已保存，但界面更新未完成。请重新打开视图，不要重复新增。'+String(error.message||error),10000); }
  }
  async setActiveTabId(tabId, options = {}) {
    const normalizedTabId = text(tabId, "");
    if (!normalizedTabId || !this.data.tabsById?.[normalizedTabId]) return false;
    if (this.historySession) {
      if (!this.historySession.tabs.has(normalizedTabId)) this.leaveContextHistoryForExternal("setActiveTabId");
      else {
        if (this.historySession.tabId !== normalizedTabId) {
          this.historySession.tabId = normalizedTabId;
          this.historySession.itemId = "";
          if (options?.rerender !== false) await this.render();
        }
        return true;
      }
    }
    const changed = text(this.data.activeTabId) !== normalizedTabId;
    if (!changed && options?.forceRerender !== true) return true;
    if (changed) this.data.activeTabId = normalizedTabId;
    if (options?.rerender === false) return true;
    await this.render({
      reuseContextCapsuleKeysCache: true,
      refreshContextCapsuleKeys: false
    });
    return true;
  }
  async addTab(parentTabId = null) {
    if (this.historySession) return this.rejectHistoryWrite("addTab");
    const rawName = await this.requestPrompt(parentTabId ? "\u65B0\u5EFA\u5B50 Tab" : "\u65B0\u5EFA Tab", "\u8F93\u5165\u96C6\u5408\u5361\u540D\u79F0");
    if (rawName == null) return;
    const cleanName = text(rawName, "");
    if (!cleanName) {
      new Notice("Tab \u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
      return;
    }
    const nextId = createId("tab");
    const nextParentId = text(parentTabId) || null;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "Tab",
      "\u5BF9\u8C61\u540D\u79F0": cleanName,
      "\u5BF9\u8C61\u5B9A\u4F4D": `${this.buildAuditTabLocation(nextParentId)} / Tab\u300A${cleanName}\u300B`,
      "\u64CD\u4F5C\u7C7B\u578B": "\u65B0\u589E",
      "\u4FEE\u6539\u6458\u8981": nextParentId ? "\u65B0\u589E\u5B50 Tab" : "\u65B0\u589E\u6839 Tab",
      "\u4FEE\u6539\u524D": "",
      "\u4FEE\u6539\u540E": cleanName,
      "\u6269\u5C55_collection_tab": nextId
    }, async () => {
      return await this.persist((data) => {
        data.tabsById[nextId] = { id: nextId, name: cleanName, parentTabId: nextParentId, createdAt: nowString(), updatedAt: nowString() };
        const key = parentKey(nextParentId);
        if (!Array.isArray(data.tabChildrenByParent[key])) data.tabChildrenByParent[key] = [];
        data.tabChildrenByParent[key].push(nextId);
        data.tabOrder = flattenTabTree(data.tabChildrenByParent, null);
        data.activeTabId = nextId;
        data.childrenByParentByTab[tabParentKey(nextId, null)] = data.childrenByParentByTab[tabParentKey(nextId, null)] || [];
      });
    });
  }
  async ensureProjectContextTab(options = {}) {
    const projectName = text(options?.projectName || options?.title || "", "");
    const contextKey = text(options?.contextKey || projectName, "");
    if (!projectName) return { ok: false, reason: "missing-project-name" };
    const sourceNotePath = text(this.sourceFile?.path || this.sourceNotePath);
    const dataPath = this.dataPath;
    const keywordPath = this.tabCapsuleKeywordsPath;
    const loadGeneration = this.provisioningLoadGeneration;
    const sameHost = () => this.isProvisioningReady() && this.provisioningLoadGeneration === loadGeneration && text(this.sourceFile?.path || this.sourceNotePath) === sourceNotePath && this.dataPath === dataPath && this.tabCapsuleKeywordsPath === keywordPath;
    const assertHost = () => {
      if (!sameHost()) throw new Error("collection-provisioning-host-changed");
    };
    if (!sameHost() || options.sourceNotePath && text(options.sourceNotePath) !== sourceNotePath) {
      return { ok: false, reason: "collection-provisioning-host-mismatch", sourceNotePath };
    }
    const existingTabId = (this.data.tabOrder || []).find((tabId2) => text(this.data.tabsById?.[tabId2]?.name, "") === projectName) || Object.values(this.data.tabsById || {}).find((tab) => text(tab?.name, "") === projectName)?.id || "";
    let tabId = text(existingTabId, "");
    let created = false;
    const pendingRenderMatches = () => this.pendingProvisioningRender?.sourceNotePath === sourceNotePath && this.pendingProvisioningRender?.dataPath === dataPath && this.pendingProvisioningRender?.keywordPath === keywordPath;
    let needsRender = pendingRenderMatches();
    let outcome = null;
    let operationError = null;
    const writeOptions = {
      rerender: false,
      commitAfterSave: true,
      assertHost,
      onCommitted: () => {
        needsRender = true;
      }
    };
    try {
      if (!tabId) {
        const nextId = createId("tab");
        await this.runAuditedOperation({
          "\u5BF9\u8C61\u7C7B\u578B": "Tab",
          "\u5BF9\u8C61\u540D\u79F0": projectName,
          "\u5BF9\u8C61\u5B9A\u4F4D": `\u6839 / Tab\u300A${projectName}\u300B`,
          "\u64CD\u4F5C\u7C7B\u578B": "\u65B0\u589E",
          "\u4FEE\u6539\u6458\u8981": "\u65B0\u589E\u9879\u76EE\u64CD\u4F5C\u4E0A\u4E0B\u6587\u627F\u8F7D Tab",
          "\u4FEE\u6539\u524D": "",
          "\u4FEE\u6539\u540E": projectName,
          "\u6269\u5C55_collection_tab": nextId
        }, async () => {
          return await this.persist((data) => {
            data.tabsById[nextId] = { id: nextId, name: projectName, parentTabId: null, createdAt: nowString(), updatedAt: nowString() };
            const key = parentKey(null);
            if (!Array.isArray(data.tabChildrenByParent[key])) data.tabChildrenByParent[key] = [];
            data.tabChildrenByParent[key].push(nextId);
            data.tabOrder = flattenTabTree(data.tabChildrenByParent, null);
            data.activeTabId = nextId;
            data.childrenByParentByTab[tabParentKey(nextId, null)] = data.childrenByParentByTab[tabParentKey(nextId, null)] || [];
          }, writeOptions);
        });
        tabId = nextId;
        created = true;
      }
      assertHost();
      if (contextKey) {
        const existingKeywords = this.getTabCapsuleKeywords(tabId).map((entry) => entry.keyword);
        const keywordKey = normalizeKeywordKey(contextKey);
        const hasKeyword = existingKeywords.some((keyword) => normalizeKeywordKey(keyword) === keywordKey);
        if (!hasKeyword) {
          const tab = this.data.tabsById?.[tabId];
          const saved = await this.setTabCapsuleKeywordsAndEmoji(tabId, [...existingKeywords, contextKey], tab?.emoji || "", writeOptions);
          if (saved !== true) outcome = { ok: false, reason: "collection-keyword-save-failed", tabId, title: projectName, contextKey, created };
        }
      }
      assertHost();
      if (!outcome) outcome = { ok: true, tabId, title: projectName, contextKey, created };
    } catch (error) {
      operationError = error;
    }
    if (needsRender && sameHost()) {
      const renderMarker = { sourceNotePath, dataPath, keywordPath };
      this.pendingProvisioningRender = renderMarker;
      try {
        await this.render();
        if (sameHost()) {
          if (this.pendingProvisioningRender === renderMarker) this.pendingProvisioningRender = null;
        } else if (!operationError && outcome?.ok) {
          outcome = { ...outcome, ok: false, reason: "view-host-changed", persisted: true };
        }
      } catch (error) {
        console.warn("[Collection Card View][provisioning.view-refresh-failed]", { sourceNotePath, tabId, reason: String(error?.message || error) });
        if (!operationError && outcome?.ok) outcome = { ...outcome, ok: false, reason: "view-refresh-failed", persisted: true };
      }
    }
    if (operationError) throw operationError;
    return outcome;
  }
  async addChildTab() {
    if (this.historySession) return this.rejectHistoryWrite("addChildTab");
    const activeTabId = text(this.data.activeTabId);
    return this.addTab(activeTabId || null);
  }
  async toggleTabTreeCollapsed(tabId) {
    const id = text(tabId);
    if (!id) return;
    if (this.historySession) {
      this.historySession.tabCollapsed.set(id, !this.isTabTreeCollapsedForView(id));
      await this.render();
      return;
    }
    await this.persist((data) => {
      if (!isObject(data.tabTreeCollapsedById)) data.tabTreeCollapsedById = {};
      data.tabTreeCollapsedById[id] = !data.tabTreeCollapsedById[id];
    });
  }
  async renameTab(tabId = this.data.activeTabId) {
    if (this.historySession) return this.rejectHistoryWrite("renameTab");
    const id = text(tabId);
    const tab = this.data.tabsById?.[id];
    if (!tab) return;
    const rawName = await this.requestPrompt("\u91CD\u547D\u540D Tab", "\u8F93\u5165\u65B0\u7684\u96C6\u5408\u5361\u540D\u79F0", tab.name || "");
    if (rawName == null) return;
    const nextLabel = text(rawName, "");
    if (!nextLabel || nextLabel === tab.name) return;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "Tab",
      "\u5BF9\u8C61\u540D\u79F0": text(tab.name, tab.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditTabLocation(tab),
      "\u64CD\u4F5C\u7C7B\u578B": "\u91CD\u547D\u540D",
      "\u4FEE\u6539\u6458\u8981": "\u4FEE\u6539 Tab \u540D\u79F0",
      "\u4FEE\u6539\u524D": text(tab.name, tab.id),
      "\u4FEE\u6539\u540E": nextLabel,
      "\u6269\u5C55_collection_tab": id
    }, async () => {
      return await this.persist((data) => {
        const target = data.tabsById?.[id];
        if (!target) return;
        target.name = nextLabel;
        target.updatedAt = nowString();
      });
    }, {
      buildPatch: () => ({
        "\u5BF9\u8C61\u540D\u79F0": nextLabel,
        "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditTabLocation(id)
      })
    });
  }
  async moveTabOrder(draggedIdRaw, targetIdRaw, position = "after") {
    if (this.historySession) return this.rejectHistoryWrite("moveTabOrder");
    const draggedId = text(draggedIdRaw);
    const targetId = text(targetIdRaw);
    if (!draggedId || !targetId || draggedId === targetId) return;
    const dragged = this.data.tabsById?.[draggedId];
    const target = this.data.tabsById?.[targetId];
    if (!dragged || !target) return;
    const nextParentId = position === "child" ? target.id : target.parentTabId || null;
    if (wouldCreateTabCycle(this.data, dragged.id, nextParentId)) {
      new Notice("\u4E0D\u80FD\u628A Tab \u62D6\u5230\u81EA\u5DF1\u7684\u5B50\u7EA7\u4E0B\u9762\u3002");
      return;
    }
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "Tab",
      "\u5BF9\u8C61\u540D\u79F0": text(dragged.name, dragged.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditTabLocation(dragged),
      "\u64CD\u4F5C\u7C7B\u578B": "\u6392\u5E8F\u79FB\u52A8",
      "\u4FEE\u6539\u6458\u8981": `\u8C03\u6574 Tab \u4F4D\u7F6E\u4E3A ${position}`,
      "\u4FEE\u6539\u524D": this.buildAuditTabLocation(dragged),
      "\u4FEE\u6539\u540E": `${position} -> ${this.buildAuditTabLocation(target)}`,
      "\u6269\u5C55_collection_tab": dragged.id,
      "\u6269\u5C55_collection_target_tab": target.id
    }, async () => {
      return await this.persist((data) => {
        const draggedTab = data.tabsById?.[dragged.id];
        const targetTab = data.tabsById?.[target.id];
        if (!draggedTab || !targetTab) return;
        removeIdFromSimpleChildrenMap(data.tabChildrenByParent, dragged.id);
        draggedTab.parentTabId = nextParentId;
        draggedTab.updatedAt = nowString();
        const key = parentKey(nextParentId);
        if (!Array.isArray(data.tabChildrenByParent[key])) data.tabChildrenByParent[key] = [];
        const siblings = data.tabChildrenByParent[key];
        if (position === "child") {
          siblings.unshift(dragged.id);
        } else {
          const targetIndex = siblings.indexOf(target.id);
          if (targetIndex < 0) siblings.push(dragged.id);
          else siblings.splice(position === "before" ? targetIndex : targetIndex + 1, 0, dragged.id);
        }
        data.tabChildrenByParent[key] = uniq(siblings);
        data.tabOrder = flattenTabTree(data.tabChildrenByParent, null);
        data.activeTabId = dragged.id;
      });
    }, {
      buildPatch: () => ({
        "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditTabLocation(draggedId)
      })
    });
  }
  async moveTabToRoot(tabIdRaw) {
    if (this.historySession) return this.rejectHistoryWrite("moveTabToRoot");
    const tabId = text(tabIdRaw);
    const tab = this.data.tabsById?.[tabId];
    if (!tab) return;
    await this.persist((data) => {
      const target = data.tabsById?.[tabId];
      if (!target) return;
      removeIdFromSimpleChildrenMap(data.tabChildrenByParent, tabId);
      target.parentTabId = null;
      target.updatedAt = nowString();
      if (!Array.isArray(data.tabChildrenByParent[ROOT_KEY])) data.tabChildrenByParent[ROOT_KEY] = [];
      data.tabChildrenByParent[ROOT_KEY].unshift(tabId);
      data.tabChildrenByParent[ROOT_KEY] = uniq(data.tabChildrenByParent[ROOT_KEY]);
      data.tabOrder = flattenTabTree(data.tabChildrenByParent, null);
      data.activeTabId = tabId;
    });
  }
  async moveTabSibling(tabId, offset = 0) {
    if (this.historySession) return this.rejectHistoryWrite("moveTabSibling");
    const id = text(tabId);
    const tab = this.data.tabsById?.[id];
    if (!tab || !offset) return;
    const siblings = Array.isArray(this.data.tabChildrenByParent?.[parentKey(tab.parentTabId)]) ? this.data.tabChildrenByParent[parentKey(tab.parentTabId)].slice() : [];
    const fromIndex = siblings.indexOf(id);
    if (fromIndex < 0) return;
    const toIndex = fromIndex + Number(offset);
    if (toIndex < 0 || toIndex >= siblings.length) return;
    await this.persist((data) => {
      const key = parentKey(data.tabsById?.[id]?.parentTabId || null);
      const nextSiblings = Array.isArray(data.tabChildrenByParent?.[key]) ? data.tabChildrenByParent[key].slice() : [];
      const currentIndex = nextSiblings.indexOf(id);
      const nextIndex = currentIndex + Number(offset);
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextSiblings.length) return;
      nextSiblings.splice(currentIndex, 1);
      nextSiblings.splice(nextIndex, 0, id);
      data.tabChildrenByParent[key] = nextSiblings;
      data.tabOrder = flattenTabTree(data.tabChildrenByParent, null);
    });
  }
  async closeTab(tabId = this.data.activeTabId) {
    if (this.historySession) return this.rejectHistoryWrite("closeTab");
    const id = text(tabId);
    const tab = this.data.tabsById?.[id];
    if (!tab) return;
    if ((this.data.tabOrder || []).length <= 1) {
      new Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A Tab\u3002");
      return;
    }
    const ok = window.confirm(`\u786E\u8BA4\u5173\u95ED Tab\u300C${tab.name}\u300D\u5417\uFF1F\u8BE5 Tab \u4E0B\u7684\u6761\u76EE\u4F1A\u88AB\u79FB\u9664\uFF0C\u5B50 Tab \u4F1A\u4E0A\u79FB\u4E00\u7EA7\u3002`);
    if (!ok) return;
    await this.persist((data) => {
      const target = data.tabsById?.[id];
      if (!target) return;
      const parentId = target.parentTabId || null;
      const parentKeyName = parentKey(parentId);
      const currentKey = parentKey(id);
      const childTabIds = Array.isArray(data.tabChildrenByParent?.[currentKey]) ? data.tabChildrenByParent[currentKey].slice() : [];
      const itemIds = Object.values(data.itemsById || {}).filter((item) => item?.tabId === id).map((item) => item.id);
      itemIds.forEach((itemId) => {
        delete data.itemsById[itemId];
        delete data.childrenByParentByTab[tabParentKey(id, itemId)];
      });
      Object.keys(data.childrenByParentByTab || {}).forEach((scopedKey) => {
        if (scopedKey.startsWith(`${id}::`)) delete data.childrenByParentByTab[scopedKey];
      });
      Object.keys(data.tabChildrenByParent || {}).forEach((key) => {
        if (!Array.isArray(data.tabChildrenByParent[key])) return;
        data.tabChildrenByParent[key] = data.tabChildrenByParent[key].filter((tabIdInList) => tabIdInList !== id);
      });
      if (!Array.isArray(data.tabChildrenByParent[parentKeyName])) data.tabChildrenByParent[parentKeyName] = [];
      childTabIds.forEach((childId) => {
        const child = data.tabsById?.[childId];
        if (!child) return;
        child.parentTabId = parentId;
        if (!data.tabChildrenByParent[parentKeyName].includes(childId)) data.tabChildrenByParent[parentKeyName].push(childId);
      });
      delete data.tabChildrenByParent[currentKey];
      delete data.tabTreeCollapsedById?.[id];
      delete data.tabsById[id];
      data.tabOrder = flattenTabTree(data.tabChildrenByParent, null);
      data.activeTabId = data.tabOrder.find((tabIdInOrder) => data.tabsById?.[tabIdInOrder]) || DEFAULT_TAB_ID;
    });
  }
  async addRootItem() {
    if (this.historySession) return this.rejectHistoryWrite("addRootItem");
    const rawTitle = await this.requestPrompt("\u6DFB\u52A0\u6839\u6761\u76EE", "\u8F93\u5165\u6761\u76EE\u540D\u79F0");
    if (rawTitle == null) return;
    const cleanTitle = text(rawTitle, "");
    if (!cleanTitle) {
      new Notice("\u6761\u76EE\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A\u3002");
      return;
    }
    const nextId = createId("item");
    const currentTabId = this.data.activeTabId;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": cleanTitle,
      "\u5BF9\u8C61\u5B9A\u4F4D": `${this.buildAuditTabLocation(currentTabId)} / \u6761\u76EE\u300A${cleanTitle}\u300B`,
      "\u64CD\u4F5C\u7C7B\u578B": "\u65B0\u589E",
      "\u4FEE\u6539\u6458\u8981": "\u65B0\u589E\u6839\u6761\u76EE",
      "\u4FEE\u6539\u524D": "",
      "\u4FEE\u6539\u540E": cleanTitle,
      "\u6269\u5C55_collection_tab": currentTabId,
      "\u6269\u5C55_collection_item": nextId
    }, async () => {
      return await this.persist((data) => {
        data.itemsById[nextId] = { id: nextId, title: cleanTitle, comment: "", tabId: currentTabId, parentId: null, isCollapsed: false, noteExpanded: false, noteBinding: null, createdAt: nowString(), updatedAt: nowString() };
        const key = tabParentKey(currentTabId, null);
        data.childrenByParentByTab[key] = [nextId].concat(data.childrenByParentByTab[key] || []);
      });
    });
  }
  async moveItem(draggedIdRaw, targetIdRaw, position = "after") {
    if (this.historySession) return this.rejectHistoryWrite("moveItem");
    const draggedId = text(draggedIdRaw);
    const targetId = text(targetIdRaw);
    if (!draggedId || !targetId || draggedId === targetId) return;
    const dragged = this.data.itemsById?.[draggedId];
    const target = this.data.itemsById?.[targetId];
    if (!dragged || !target || dragged.tabId !== target.tabId) return;
    const nextParentId = position === "child" ? target.id : target.parentId || null;
    if (wouldCreateItemCycle(this.data, dragged.id, nextParentId, dragged.tabId)) {
      new Notice("\u4E0D\u80FD\u628A\u6761\u76EE\u79FB\u52A8\u5230\u81EA\u5DF1\u7684\u5B50\u7EA7\u4E0B\u9762\u3002");
      return;
    }
    let changed = false;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": text(dragged.title, dragged.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(dragged),
      "\u64CD\u4F5C\u7C7B\u578B": "\u6392\u5E8F\u79FB\u52A8",
      "\u4FEE\u6539\u6458\u8981": `\u8C03\u6574\u6761\u76EE\u5C42\u7EA7\u4E3A ${position}`,
      "\u4FEE\u6539\u524D": `\u7236\u7EA7\uFF1A${this.describeItemParentLabel(dragged)}`,
      "\u4FEE\u6539\u540E": `\u7236\u7EA7\uFF1A${position === "child" ? `\u6761\u76EE\u300A${text(target.title, target.id)}\u300B` : this.describeItemParentLabel(target)}\uFF1B\u76EE\u6807\uFF1A${position} -> \u6761\u76EE\u300A${text(target.title, target.id)}\u300B`,
      "\u6269\u5C55_collection_tab": text(dragged.tabId, ""),
      "\u6269\u5C55_collection_item": dragged.id,
      "\u6269\u5C55_collection_target_item": target.id,
      "\u6269\u5C55_collection_position": position
    }, async () => {
      return await this.persist((data) => {
        const draggedItem = data.itemsById?.[dragged.id];
        const targetItem = data.itemsById?.[target.id];
        if (!draggedItem || !targetItem || draggedItem.tabId !== targetItem.tabId) return;
        removeIdFromChildrenMap(data.childrenByParentByTab, dragged.id, dragged.tabId);
        draggedItem.parentId = nextParentId;
        draggedItem.updatedAt = nowString();
        const key = tabParentKey(dragged.tabId, nextParentId);
        if (!Array.isArray(data.childrenByParentByTab[key])) data.childrenByParentByTab[key] = [];
        const siblings = data.childrenByParentByTab[key];
        if (position === "child") {
          siblings.unshift(dragged.id);
          targetItem.isCollapsed = false;
        } else {
          const targetIndex = siblings.indexOf(target.id);
          if (targetIndex < 0) siblings.push(dragged.id);
          else siblings.splice(position === "before" ? targetIndex : targetIndex + 1, 0, dragged.id);
        }
        data.childrenByParentByTab[key] = uniq(siblings);
        changed = true;
      });
    }, {
      isSuccess: () => changed,
      failureReason: "no effective change",
      buildPatch: () => ({
        "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(dragged.id),
        "\u4FEE\u6539\u540E": `\u7236\u7EA7\uFF1A${this.describeItemParentLabel(dragged.id)}\uFF1B\u76EE\u6807\uFF1A${position} -> \u6761\u76EE\u300A${text(this.data.itemsById?.[target.id]?.title, target.id)}\u300B`
      })
    });
  }
  async moveItemToRoot(draggedIdRaw, tabIdRaw = this.data.activeTabId) {
    if (this.historySession) return this.rejectHistoryWrite("moveItemToRoot");
    const draggedId = text(draggedIdRaw);
    const tabId = text(tabIdRaw, this.data.activeTabId);
    if (!draggedId || !tabId) return;
    const dragged = this.data.itemsById?.[draggedId];
    if (!dragged || dragged.tabId !== tabId || dragged.parentId === null) return;
    let changed = false;
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": text(dragged.title, dragged.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(dragged),
      "\u64CD\u4F5C\u7C7B\u578B": "\u6392\u5E8F\u79FB\u52A8",
      "\u4FEE\u6539\u6458\u8981": "\u5C06\u6761\u76EE\u79FB\u52A8\u5230\u6839\u5C42",
      "\u4FEE\u6539\u524D": `\u7236\u7EA7\uFF1A${this.describeItemParentLabel(dragged)}`,
      "\u4FEE\u6539\u540E": "\u7236\u7EA7\uFF1A\u6839\u5C42",
      "\u6269\u5C55_collection_tab": tabId,
      "\u6269\u5C55_collection_item": dragged.id,
      "\u6269\u5C55_collection_position": "root"
    }, async () => {
      return await this.persist((data) => {
        const target = data.itemsById?.[dragged.id];
        if (!target || target.tabId !== tabId) return;
        removeIdFromChildrenMap(data.childrenByParentByTab, dragged.id, tabId);
        target.parentId = null;
        target.updatedAt = nowString();
        const rootKey = tabParentKey(tabId, null);
        if (!Array.isArray(data.childrenByParentByTab[rootKey])) data.childrenByParentByTab[rootKey] = [];
        data.childrenByParentByTab[rootKey].push(dragged.id);
        data.childrenByParentByTab[rootKey] = uniq(data.childrenByParentByTab[rootKey]);
        changed = true;
      });
    }, {
      isSuccess: (result) => result === true && changed,
      failureReason: "no effective change",
      buildPatch: () => ({
        "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(dragged.id)
      })
    });
  }
  async deleteItem(itemIdRaw) {
    if (this.historySession) return this.rejectHistoryWrite("deleteItem");
    const itemId = text(itemIdRaw);
    const item = this.data.itemsById?.[itemId];
    if (!item) return;
    const descendantIds = collectItemDescendantIds(this.data, itemId, item.tabId);
    const deleteIds = [itemId].concat(descendantIds);
    const itemTitle = text(item.title, item.id);
    const summary = descendantIds.length ? `\u786E\u5B9A\u5220\u9664\u6761\u76EE\u300C${itemTitle}\u300D\u5417\uFF1F
\u5C06\u4E00\u5E76\u5220\u9664 ${descendantIds.length} \u4E2A\u5B50\u6761\u76EE\u3002
\u8FD9\u53EA\u4F1A\u5220\u9664 Collection Card \u4E2D\u7684\u6761\u76EE\u8BB0\u5F55\uFF0C\u4E0D\u4F1A\u5220\u9664\u5DF2\u7ED1\u5B9A\u7684 Obsidian \u7B14\u8BB0\u3002` : `\u786E\u5B9A\u5220\u9664\u6761\u76EE\u300C${itemTitle}\u300D\u5417\uFF1F
\u8FD9\u53EA\u4F1A\u5220\u9664 Collection Card \u4E2D\u7684\u6761\u76EE\u8BB0\u5F55\uFF0C\u4E0D\u4F1A\u5220\u9664\u5DF2\u7ED1\u5B9A\u7684 Obsidian \u7B14\u8BB0\u3002`;
    const ok = await openConfirmModal(this.app, {
      title: "\u5220\u9664\u6761\u76EE",
      message: summary,
      confirmText: "\u5220\u9664",
      cancelText: "\u53D6\u6D88",
      danger: true
    });
    if (!ok) return;
    deleteIds.forEach((id) => {
      delete this.noteEditorState[id];
    });
    await this.runAuditedOperation({
      "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
      "\u5BF9\u8C61\u540D\u79F0": text(item.title, item.id),
      "\u5BF9\u8C61\u5B9A\u4F4D": this.buildAuditItemLocation(item),
      "\u64CD\u4F5C\u7C7B\u578B": "\u5220\u9664",
      "\u4FEE\u6539\u6458\u8981": descendantIds.length > 0 ? `\u5220\u9664\u6761\u76EE\u53CA\u5176 ${descendantIds.length} \u4E2A\u5B50\u6761\u76EE` : "\u5220\u9664\u6761\u76EE",
      "\u4FEE\u6539\u524D": text(item.title, item.id),
      "\u4FEE\u6539\u540E": "",
      "\u6269\u5C55_collection_tab": text(item.tabId, ""),
      "\u6269\u5C55_collection_item": itemId,
      "\u6269\u5C55_collection_deleted_count": String(deleteIds.length)
    }, async () => {
      return await this.persist((data) => {
        deleteIds.forEach((id) => {
          removeIdFromChildrenMap(data.childrenByParentByTab, id, item.tabId);
          delete data.childrenByParentByTab[tabParentKey(item.tabId, id)];
          delete data.itemsById[id];
        });
      });
    });
  }
  getTabIdsByParent(parentTabId = null) {
    const preferred = this.data.tabChildrenByParent?.[parentKey(parentTabId)] || [];
    const cleaned = preferred.filter((tabId) => !!this.data.tabsById?.[text(tabId)]);
    if (cleaned.length) return cleaned;
    return Object.values(this.data.tabsById || {}).filter((tab) => (text(tab?.parentTabId) || null) === (text(parentTabId) || null)).map((tab) => tab.id);
  }
  renderTabCapsuleKeywordIndex(container, options = {}) {
    const tracking = this.getTrackingAdapter();
    return tracking.consumer.runSync(pass => {
      if (pass.status !== "ready") { tracking.showPending(); return null; }
      return this.renderTabCapsuleKeywordIndexReady(container, options);
    });
  }
  renderTabCapsuleKeywordIndexReady(container, options = {}) {
    const assignments = Object.values(this.getTabCapsuleKeywordAssignments()).filter((entry) => !!this.data.tabsById?.[entry.tabId]).sort((left, right) => text(left.keyword, "").localeCompare(text(right.keyword, ""), "zh"));
    const contextKeys = options?.reuseContextCapsuleKeysCache === true ? this.getCachedContextCapsuleKeys() : this.getContextCapsuleKeysSync();
    const contextKeyLookup = this.buildContextCapsuleKeyLookup(contextKeys);
    const virtualContextKeys = this.getVirtualContextCapsuleKeys(
      assignments,
      contextKeys
    );
    const isArchivedKeyword = (entry) => entry?.sourceNotePath === this.sourceNotePath && this.isStoppedContextKeyword(text(entry?.keyword, entry?.keywordKey));
    const archivedAssignments = assignments.filter((entry) => isArchivedKeyword(entry));
    const visibleAssignments = assignments.filter((entry) => !isArchivedKeyword(entry));
    const shell = container.createDiv({ cls: "collection-card-tab-keyword-index" });
    const head = shell.createDiv({ cls: "collection-card-tab-keyword-index-head" });
    head.createEl("span", { text: "Tab keywords" });
    head.createEl("span", {
      cls: "collection-card-tab-keyword-index-count",
      text: virtualContextKeys.length > 0 ? `${assignments.length}+${virtualContextKeys.length}` : String(assignments.length)
    });
    if (this.tabCapsuleKeywordLoadError) {
      shell.createDiv({ cls: "collection-card-tab-keyword-warning", text: this.tabCapsuleKeywordLoadError });
      return shell;
    }
    if (assignments.length === 0 && virtualContextKeys.length === 0) {
      shell.createDiv({ cls: "collection-card-tab-keyword-empty", text: "No tab keywords yet. Click a tab emoji to add keywords." });
      return shell;
    }
    const chips = shell.createDiv({ cls: "collection-card-tab-keyword-index-chips" });
    const combinedVisibleRows = [
      ...visibleAssignments.map((entry) => ({ kind: "bound", sortLabel: text(entry.keyword, entry.keywordKey), entry })),
      ...virtualContextKeys.filter(key => !this.isStoppedContextKeyword(key.displayLabel)).map((key) => ({ kind: "virtual", sortLabel: text(key.displayLabel, key.contextKeyId), key }))
    ].sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, "zh", { numeric: true }));
    combinedVisibleRows.forEach((rowItem) => {
      if (rowItem.kind === "virtual") {
        const key = rowItem.key;
        const button2 = chips.createEl("button", {
          cls: "collection-card-tab-keyword-index-chip collection-card-context-capsule-virtual-chip",
          attr: {
            type: "button",
            title: `${key.displayLabel} \xB7 \u865A\u4F4D\u4EE5\u5F85\uFF0C\u5C1A\u672A\u7ED1\u5B9A\u96C6\u5408\u5361 Tab`
          }
        });
        if (key.color) button2.style.setProperty("--collection-card-context-capsule-color", key.color);
        button2.dataset.contextKeyId = key.contextKeyId;
        button2.createEl("span", { cls: "collection-card-tab-keyword-index-key", text: key.displayLabel });
        button2.createEl("span", { cls: "collection-card-tab-keyword-index-tab", text: "\u865A\u4F4D" });
        button2.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          new Notice(`\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E3B\u952E\u5C1A\u672A\u7ED1\u5B9A\u96C6\u5408\u5361 Tab\uFF1A${key.displayLabel}`);
        };
        return;
      }
      const entry = rowItem.entry;
      const tab = this.data.tabsById?.[entry.tabId];
      const matchedContextKey = this.getContextCapsuleKeyForTabKeyword(entry.keyword, contextKeyLookup);
      const button = chips.createEl("button", {
        cls: `collection-card-tab-keyword-index-chip${matchedContextKey ? " is-context-capsule-synced" : " is-context-capsule-local-only"}`,
        attr: {
          type: "button",
          title: `${text(tab?.name, entry.tabNameSnapshot || entry.tabId)} \xB7 ${entry.tabId}`
        }
      });
      if (matchedContextKey?.contextKeyId) button.dataset.contextKeyId = matchedContextKey.contextKeyId;
      button.createEl("span", { cls: "collection-card-tab-keyword-index-key", text: text(entry.keyword, entry.keywordKey) });
      if (matchedContextKey) {
        button.createEl("span", { cls: "collection-card-tab-keyword-sync-badge", text: "\u540C\u6B65" });
      } else {
        button.createEl("span", { cls: "collection-card-tab-keyword-local-badge", text: "\u672C\u5730" });
      }
      button.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.revealTabCapsule(entry.tabId);
      };
    });
    const stoppedVirtualKeys = virtualContextKeys.filter(key => this.isStoppedContextKeyword(key.displayLabel));
    if (archivedAssignments.length + stoppedVirtualKeys.length > 0) {
      const toggle = chips.createEl("button", {
        cls: `collection-card-tab-keyword-index-chip collection-card-tab-keyword-archive-toggle${this.tabCapsuleKeywordArchiveExpanded ? " is-expanded" : ""}`,
        text: `已停止追踪 ${archivedAssignments.length + stoppedVirtualKeys.length}`,
        attr: {
          type: "button",
          title: this.tabCapsuleKeywordArchiveExpanded ? "收起已停止追踪的主键" : "展开已停止追踪的主键"
        }
      });
      toggle.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.tabCapsuleKeywordArchiveExpanded = !this.tabCapsuleKeywordArchiveExpanded;
        this.render();
      };
      if (this.tabCapsuleKeywordArchiveExpanded) {
        const archiveWrap = shell.createDiv({ cls: "collection-card-tab-keyword-archive-section" });
        archiveWrap.createDiv({ cls: "collection-card-tab-keyword-archive-title", text: "已停止追踪的主键" });
        const archiveChips = archiveWrap.createDiv({ cls: "collection-card-tab-keyword-index-chips" });
        stoppedVirtualKeys.forEach(key => archiveChips.createEl("span", { text: key.displayLabel + " · 虚位", cls: "context-stopped-placeholder" }));
        archivedAssignments.forEach((entry) => {
          const tab = this.data.tabsById?.[entry.tabId];
          const button = archiveChips.createEl("button", {
            cls: "collection-card-tab-keyword-index-chip collection-card-tab-keyword-archive-chip",
            attr: { type: "button" }
          });
          button.createEl("span", { cls: "collection-card-tab-keyword-index-key", text: text(entry.keyword, entry.keywordKey) });
          button.createEl("span", { cls: "collection-card-tab-keyword-local-badge", text: "\u672C\u5730" });
          button.onclick = async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await this.openContextHistory(entry.tabId);
          };
        });
      }
    }
    return shell;
  }
  prepareTabCapsuleRevealState(data, tabId) {
    const normalizedTabId = text(tabId, "");
    if (!normalizedTabId || !data?.tabsById?.[normalizedTabId]) {
      return { ok: false, changed: false };
    }
    let changed = false;
    if (text(data.activeTabId) !== normalizedTabId) {
      data.activeTabId = normalizedTabId;
      changed = true;
    }
    if (!isObject(data.tabTreeCollapsedById)) {
      data.tabTreeCollapsedById = {};
      changed = true;
    }
    let cursor = text(data.tabsById?.[normalizedTabId]?.parentTabId, "") || null;
    const seen = /* @__PURE__ */ new Set([normalizedTabId]);
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      if (data.tabTreeCollapsedById[cursor] !== false) {
        data.tabTreeCollapsedById[cursor] = false;
        changed = true;
      }
      cursor = text(data.tabsById?.[cursor]?.parentTabId, "") || null;
    }
    return { ok: true, changed };
  }
  async revealTabCapsule(tabId) {
    const tracking = this.getTrackingAdapter();
    if (tracking.hasInput() || tracking.isLoading()) return false;
    const pass = tracking.consumer.capture();
    if (pass.status !== "ready") { tracking.showPending(); return false; }
    if (this.historySession) this.leaveContextHistoryForExternal("revealTabCapsule");
    const normalizedTabId = text(tabId, "");
    if (!normalizedTabId || !this.data.tabsById?.[normalizedTabId]) {
      new Notice("Target tab is missing.");
      return false;
    }
    this.pendingTabCapsuleFocus = { tabId: normalizedTabId };
    const result = this.prepareTabCapsuleRevealState(this.data, normalizedTabId);
    if (!result.ok) {
      this.pendingTabCapsuleFocus = null;
      new Notice("Target tab is missing.");
      return false;
    }
    await this.render({
      reuseContextCapsuleKeysCache: true,
      refreshContextCapsuleKeys: false
    });
    return !tracking.hasInput() && tracking.consumer.isCurrent(pass);
  }
  flushPendingTabCapsuleFocus() {
    if (this.historySession) return false;
    const pending = this.pendingTabCapsuleFocus;
    if (!pending) return false;
    this.pendingTabCapsuleFocus = null;
    const tracking = this.getTrackingAdapter(), pass = tracking.consumer.current();
    window.setTimeout(() => {
      if (this.historySession || !tracking.consumer.isCurrent(pass) || tracking.hasInput()) return;
      const targetEl = Array.from(this.contentEl.querySelectorAll("[data-collection-card-tab-capsule-id]")).find((el) => el.getAttribute("data-collection-card-tab-capsule-id") === pending.tabId) || null;
      if (!targetEl) return;
      targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      targetEl.classList.add("collection-card-tab-highlight");
      window.setTimeout(() => targetEl.classList.remove("collection-card-tab-highlight"), 1400);
    }, 0);
    return true;
  }
  renderTabTree(container, parentTabId = null, level = 0) {
    if (level === 0 && parentTabId == null) this.c3UnboundTabIds = this.historySession ? new Set() : this.plugin.collectUnboundTabIdsV1?.(this.tabCapsuleKeywordData, text(this.sourceFile?.path || "", ""), this.data.tabsById) || new Set();
    const tabIds = this.historySession && parentTabId == null && level === 0 ? [this.historySession.rootTabId] : this.getTabIdsByParent(parentTabId);
    for (const tabId of tabIds) {
      const tab = this.data.tabsById?.[tabId];
      if (!tab) continue;
      if (this.isStoppedContextTab(tabId)) { this.renderTabTree(container, tabId, level); continue; }
      const childTabIds = this.getTabIdsByParent(tab.id);
      const hasChildren = childTabIds.length > 0;
      const isCollapsed = hasChildren && this.isTabTreeCollapsedForView(tab.id);
      const rootItemCount = (this.data.childrenByParentByTab?.[tabParentKey(tab.id, null)] || []).length;
      const node = container.createDiv({
        cls: hasChildren ? `collection-card-tab-node collection-card-tab-capsule ${tab.id === this.getViewActiveTabId() ? "is-current" : ""} ${level > 0 ? "is-nested" : "is-root"}`.trim() : `collection-card-tab-node collection-card-tab-leaf ${level > 0 ? "is-nested" : "is-root"}`.trim(),
        attr: {
          "data-drop-label": "",
          "data-tab-level": String(level),
          "data-collection-card-tab-capsule-id": tab.id
        }
      });
      const capsule = node;
      const siblings = this.getTabIdsByParent(tab.parentTabId);
      const siblingIndex = siblings.indexOf(tab.id);
      const clearDragState = () => {
        node.classList.remove("is-dragging", "drag-over-before", "drag-over-after", "drag-over-child");
        if (node.dataset) node.dataset.dropLabel = "";
      };
      const applyDragState = (position) => {
        clearDragState();
        if (!position) return;
        node.classList.add(`drag-over-${position}`);
        if (!node.dataset) return;
        if (position === "before") node.dataset.dropLabel = "\u653E\u5230\u5B83\u524D\u9762";
        else if (position === "after") node.dataset.dropLabel = "\u653E\u5230\u5B83\u540E\u9762";
        else node.dataset.dropLabel = "\u6302\u5230\u5B83\u4E0B\u9762";
      };
      node.draggable = true;
      node.addEventListener("dragstart", (event) => {
        event.stopPropagation();
        this.tabDragState.draggedId = tab.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", tab.id);
        window.setTimeout(() => node.classList.add("is-dragging"), 0);
      });
      node.addEventListener("dragend", () => {
        this.tabDragState.draggedId = "";
        clearDragState();
      });
      node.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const draggedId = text(this.tabDragState.draggedId);
        if (!draggedId || draggedId === tab.id) return;
        const rect = node.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1);
        if (ratio < 0.25) applyDragState("before");
        else if (ratio > 0.75) applyDragState("after");
        else applyDragState("child");
      });
      node.addEventListener("dragleave", (event) => {
        event.stopPropagation();
        clearDragState();
      });
      node.addEventListener("drop", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const draggedId = text(this.tabDragState.draggedId);
        clearDragState();
        if (!draggedId || draggedId === tab.id) return;
        const rect = node.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1);
        const position = ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "child";
        await this.moveTabOrder(draggedId, tab.id, position);
      });
      const head = node.createDiv({
        cls: hasChildren ? "collection-card-tab-capsule-head" : "collection-card-tab-head"
      });
      if (hasChildren) {
        const toggle = head.createEl("button", {
          cls: `collection-card-tab-collapse-toggle ${isCollapsed ? "is-collapsed" : ""}`.trim(),
          text: isCollapsed ? "+" : "-",
          attr: { title: isCollapsed ? "\u5C55\u5F00\u5B50 Tab" : "\u6298\u53E0\u5B50 Tab" }
        });
        toggle.onclick = async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await this.toggleTabTreeCollapsed(tab.id);
        };
      }
      const emojiBtn = head.createEl("button", {
        cls: "collection-card-tab-emoji-btn",
        text: text(tab.emoji, "") || "\u{1F3F7}\uFE0F",
        attr: {
          type: "button",
          title: `Edit tab keywords: ${text(tab.name, tab.id)}`,
          "aria-label": `Edit tab keywords: ${text(tab.name, tab.id)}`
        }
      });
      emojiBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.editTabCapsuleKeywords(tab.id);
      };
      const btn = head.createEl("button", {
        cls: `collection-card-tab-btn ${tab.id === this.getViewActiveTabId() ? "active" : ""}`.trim(),
        attr: { title: "\u70B9\u51FB\u5207\u6362\uFF1B\u62D6\u62FD\u53EF\u8C03\u6574\u4E3A\u524D/\u540E/\u5B50\u7EA7" }
      });
      btn.createEl("span", { cls: "collection-card-tab-name", text: tab.name });
      btn.createEl("span", { cls: "collection-card-tab-meta", text: `${rootItemCount} \u6761\u76EE \xB7 ${childTabIds.length} \u5B50 Tab` });
      if (typeof btn.lastElementChild?.setText === "function") btn.lastElementChild.setText(`${rootItemCount} \u4E2A\u6839\u6761\u76EE \xB7 ${childTabIds.length} \u4E2A\u5B50 Tab`);
      if (this.c3UnboundTabIds?.has(tab.id)) btn.createEl("span", { cls: "collection-card-tab-unbound", text: "已不再绑定主键", attr: { style: "margin-left:6px;padding:0 6px;border-radius:8px;font-size:0.8em;opacity:0.75;border:1px dashed var(--text-muted);", title: "此 Tab 曾承载主键，现已不再绑定；Tab 与条目保留。可用“重命名当前 Tab”改名，避免与主键混淆。" } });
      btn.onclick = async () => this.setActiveTabId(tab.id);
      const mini = capsule.createDiv({ cls: "collection-card-tab-mini-actions" });
      mini.createEl("button", { cls: "collection-card-sub-btn", text: "+ \u5B50 Tab" }).onclick = async () => {
        if (this.historySession) return this.rejectHistoryWrite("addChildTabFromCapsule");
        await this.persist((data) => {
          data.activeTabId = tab.id;
        });
        await this.addTab(tab.id);
      };
      const upBtn = mini.createEl("button", { cls: "collection-card-sub-btn", text: "\u4E0A\u79FB" });
      upBtn.disabled = siblingIndex <= 0;
      upBtn.onclick = async () => {
        await this.moveTabSibling(tab.id, -1);
      };
      const downBtn = mini.createEl("button", { cls: "collection-card-sub-btn", text: "\u4E0B\u79FB" });
      downBtn.disabled = siblingIndex < 0 || siblingIndex >= siblings.length - 1;
      downBtn.onclick = async () => {
        await this.moveTabSibling(tab.id, 1);
      };
      mini.createEl("button", { cls: "collection-card-sub-btn", text: "\u91CD\u547D\u540D" }).onclick = async () => {
        await this.renameTab(tab.id);
      };
      const closeBtn = mini.createEl("button", { cls: "collection-card-sub-btn", text: "\u5173\u95ED" });
      closeBtn.disabled = (this.data.tabOrder || []).length <= 1;
      closeBtn.onclick = async () => {
        await this.closeTab(tab.id);
      };
      if (hasChildren && !isCollapsed) {
        const childWrap = capsule.createDiv({ cls: `collection-card-tab-children ${level > 0 ? "is-nested" : "is-root"}`.trim() });
        this.renderTabTree(childWrap, tab.id, level + 1);
      }
    }
  }
  revealItemInView(itemId) {
    const id = text(itemId);
    if (!id || !this.mainScrollEl) return;
    const targetEl = this.mainScrollEl.querySelector(`[data-collection-card-item-id="${id.replace(/"/g, '\\"')}"]`);
    if (!targetEl) return;
    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    targetEl.classList.add("collection-card-item-highlight");
    window.setTimeout(() => targetEl.classList.remove("collection-card-item-highlight"), 1400);
  }
  renderFloatingToc(container, tabId = this.getViewActiveTabId()) {
    const activeTab = this.data.tabsById?.[tabId] || null;
    const head = container.createDiv({ cls: "collection-card-floating-toc-head" });
    head.createDiv({ cls: "collection-card-floating-toc-title", text: "\u5F53\u524D Tab TOC" });
    head.createEl("button", {
      cls: "collection-card-floating-toc-toggle",
      text: this.ui.floatingTocCollapsed ? "\u5C55\u5F00" : "\u6536\u8D77"
    }).onclick = async () => {
      this.ui.floatingTocCollapsed = !this.ui.floatingTocCollapsed;
      await this.render();
    };
    if (this.ui.floatingTocCollapsed) return;
    const summary = container.createDiv({ cls: "collection-card-floating-toc-current" });
    summary.createDiv({ text: activeTab?.name || "\u5F53\u524D\u65E0\u6FC0\u6D3B Tab" });
    summary.createDiv({ cls: "collection-card-status", text: `${(this.data.childrenByParentByTab?.[tabParentKey(tabId, null)] || []).length} \u4E2A\u6839\u6761\u76EE` });
    this.tocScrollEl = container.createDiv({ cls: "collection-card-floating-toc-list" });
    const renderNode = (mount, itemId, level = 0) => {
      const item = this.data.itemsById?.[itemId];
      if (!item || item.tabId !== tabId) return;
      const childIds = this.data.childrenByParentByTab?.[tabParentKey(tabId, item.id)] || [];
      const hasChildren = childIds.length > 0;
      const node = mount.createDiv({ cls: "collection-card-floating-toc-item" });
      const itemHead = node.createDiv({ cls: "collection-card-floating-toc-item-head" });
      const toggle = itemHead.createEl("button", {
        cls: `collection-card-floating-toc-item-toggle ${hasChildren ? "" : "is-disabled"}`.trim(),
        text: hasChildren ? this.isItemCollapsedForView(item) ? "+" : "-" : "."
      });
      toggle.disabled = !hasChildren;
      toggle.onclick = async () => {
        if (!hasChildren) return;
        if (this.historySession) {
          this.historySession.itemCollapsed.set(item.id, !this.isItemCollapsedForView(item));
          await this.render();
          return;
        }
        await this.persist((data) => {
          if (data.itemsById?.[item.id]) data.itemsById[item.id].isCollapsed = !data.itemsById[item.id].isCollapsed;
        });
      };
      const btn = itemHead.createEl("button", {
        cls: `collection-card-floating-toc-btn ${item.id}`.trim(),
        text: item.title
      });
      btn.onclick = () => this.revealItemInView(item.id);
      if (hasChildren && !this.isItemCollapsedForView(item)) {
        const childWrap = node.createDiv({ cls: "collection-card-floating-toc-children" });
        childWrap.style.marginLeft = "14px";
        childIds.forEach((childId) => renderNode(childWrap, childId, level + 1));
      }
    };
    const roots = this.data.childrenByParentByTab?.[tabParentKey(tabId, null)] || [];
    roots.forEach((itemId) => renderNode(this.tocScrollEl, itemId, 0));
    if (this.tocScrollEl.childElementCount === 0) {
      this.tocScrollEl.createDiv({ cls: "collection-card-status", text: "\u5F53\u524D Tab \u6682\u65E0\u6761\u76EE\u3002" });
    }
  }
  renderItems(container, parentId = null, tabId = this.getViewActiveTabId(), level = 0) {
    for (const itemId of this.data.childrenByParentByTab?.[tabParentKey(tabId, parentId)] || []) {
      const item = this.data.itemsById?.[itemId];
      if (!item) continue;
      const childIds = this.data.childrenByParentByTab?.[tabParentKey(tabId, item.id)] || [];
      const hasChildren = childIds.length > 0;
      const hasBoundNote = !!item.noteBinding?.path;
      const commentSummary = summarizeComment(item.comment || "", 100);
      const relationSnapshot = this.getItemRelationSnapshot(item.id);
      const branch = container.createDiv({ cls: "collection-card-item-branch" });
      if (level > 0) branch.style.marginLeft = `${level * 20}px`;
      const row = branch.createDiv({
        cls: `collection-card-item-row ${item.noteBinding?.path ? "is-bound" : "is-unbound"} ${hasBoundNote ? "is-clickable" : ""} ${hasChildren && this.isItemCollapsedForView(item) ? "is-collapsed" : ""}`.trim(),
        attr: { "data-collection-card-item-id": item.id }
      });
      if (hasBoundNote) {
        row.addEventListener("click", async (event) => {
          if (event.defaultPrevented) return;
          const target = event.target;
          if (target instanceof HTMLElement && target.closest("button, a, input, textarea, select, option, label")) return;
          await this.openBoundNoteInTab(item.id);
        });
      }
      let contentEl = null;
      const clearDropState = () => {
        row.classList.remove("drag-over-top", "drag-over-bottom", "drag-over-child");
        if (row.dataset) row.dataset.dropLabel = "";
      };
      const getItemDropPosition = (event) => {
        const rect = row.getBoundingClientRect();
        const ratioY = (event.clientY - rect.top) / Math.max(rect.height, 1);
        if (ratioY < 0.28) return "before";
        if (ratioY > 0.72) return "after";
        return "child";
      };
      const applyItemDropState = (position) => {
        clearDropState();
        if (!position) return;
        row.classList.add(position === "before" ? "drag-over-top" : position === "after" ? "drag-over-bottom" : "drag-over-child");
        if (!row.dataset) return;
        if (position === "before") row.dataset.dropLabel = "\u653E\u5230\u5B83\u4E0A\u9762";
        else if (position === "after") row.dataset.dropLabel = "\u653E\u5230\u5B83\u4E0B\u9762";
        else row.dataset.dropLabel = "\u6536\u4E3A\u5B83\u7684\u5B50\u6761\u76EE";
      };
      row.draggable = true;
      row.addEventListener("dragstart", (event) => {
        event.stopPropagation();
        this.itemDragState.draggedId = item.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.id);
        window.setTimeout(() => row.classList.add("is-dragging"), 0);
      });
      row.addEventListener("dragend", () => {
        this.itemDragState.draggedId = "";
        row.classList.remove("is-dragging");
        clearDropState();
      });
      row.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearDropState();
        const draggedId = text(this.itemDragState.draggedId);
        const draggedItem = this.data.itemsById?.[draggedId];
        if (!draggedId || draggedId === item.id || !draggedItem || draggedItem.tabId !== item.tabId) return;
        applyItemDropState(getItemDropPosition(event));
      });
      row.addEventListener("dragleave", (event) => {
        event.stopPropagation();
        clearDropState();
      });
      row.addEventListener("drop", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const draggedId = text(this.itemDragState.draggedId);
        const draggedItem = this.data.itemsById?.[draggedId];
        clearDropState();
        if (!draggedId || draggedId === item.id || !draggedItem || draggedItem.tabId !== item.tabId) return;
        const position = getItemDropPosition(event);
        await this.moveItem(draggedId, item.id, position);
      });
      const left = row.createDiv({ cls: "collection-card-line-left" });
      const toggleGroup = left.createDiv({ cls: "collection-card-item-toggle-group" });
      toggleGroup.createEl("button", { cls: `collection-card-item-toggle ${hasChildren ? "" : "is-disabled"}`.trim(), text: hasChildren ? this.isItemCollapsedForView(item) ? "\u25B8" : "\u25BE" : "\u2022" }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!(this.data.childrenByParentByTab?.[tabParentKey(tabId, item.id)] || []).length) return;
        if (this.historySession) {
          this.historySession.itemCollapsed.set(item.id, !this.isItemCollapsedForView(item));
          await this.render();
          return;
        }
        await this.persist((data) => {
          if (data.itemsById[item.id]) data.itemsById[item.id].isCollapsed = !data.itemsById[item.id].isCollapsed;
        });
      };
      const noteToggle = toggleGroup.createEl("button", {
        cls: `collection-card-item-toggle ${hasBoundNote ? "is-active" : "is-disabled"}`.trim(),
        text: this.isItemNoteExpandedForView(item) ? "\u25A3" : "\u25A4",
        attr: { title: hasBoundNote ? this.isItemNoteExpandedForView(item) ? "\u6536\u8D77\u7B14\u8BB0\u5185\u5BB9" : "\u67E5\u770B\u7B14\u8BB0\u5185\u5BB9" : "\u672A\u7ED1\u5B9A\u7B14\u8BB0" }
      });
      noteToggle.disabled = !hasBoundNote;
      noteToggle.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!hasBoundNote) return;
        if (this.historySession) {
          this.historySession.noteExpanded.set(item.id, !this.isItemNoteExpandedForView(item));
          await this.render();
          return;
        }
        await this.persist((data) => {
          if (data.itemsById?.[item.id]) data.itemsById[item.id].noteExpanded = !data.itemsById[item.id].noteExpanded;
        });
      };
      contentEl = left.createDiv({ cls: "collection-card-item-content" });
      const titleEl = hasBoundNote ? contentEl.createEl("button", { cls: "collection-card-item-title collection-card-title-link", text: item.title }) : contentEl.createDiv({ cls: "collection-card-item-title", text: item.title });
      if (hasBoundNote) {
        titleEl.onclick = async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await this.openBoundNoteInTab(item.id);
        };
      }
      const badges = contentEl.createDiv({ cls: "collection-card-item-badges" });
      badges.addClass(item.noteBinding?.path ? "is-bound-group" : "is-unbound-group");
      badges.createDiv({ cls: "collection-card-badge", text: item.noteBinding?.path ? `\u5DF2\u7ED1\u5B9A\uFF1A${item.noteBinding.path}` : "\u672A\u7ED1\u5B9A\u7B14\u8BB0" });
      if (commentSummary) {
        badges.createDiv({
          cls: "collection-card-badge",
          text: `\u8BC4\u8BBA\uFF1A${commentSummary}`,
          attr: { title: item.comment || "" }
        });
      }
      if (hasChildren && this.isItemCollapsedForView(item)) {
        badges.createDiv({
          cls: "collection-card-badge is-collapsed-badge",
          text: `\u5DF2\u6298\u53E0 \xB7 ${childIds.length} \u4E2A\u5B50\u6761\u76EE`
        });
      }
      if (relationSnapshot.outgoing.length > 0) {
        badges.createDiv({
          cls: "collection-card-badge",
          text: `\u2192 ${relationSnapshot.outgoing.length}`,
          attr: { title: "\u5F53\u524D\u6761\u76EE\u7684\u5916\u51FA\u5173\u7CFB\u6570" }
        });
      }
      if (relationSnapshot.incoming.length > 0) {
        badges.createDiv({
          cls: "collection-card-badge",
          text: `\u2190 ${relationSnapshot.incoming.length}`,
          attr: { title: "\u5F53\u524D\u6761\u76EE\u7684\u8FDB\u5165\u5173\u7CFB\u6570" }
        });
      }
      const actions = row.createDiv({ cls: "collection-card-line-actions" });
      actions.createEl("button", { cls: "collection-card-sub-btn", text: "+ \u5B50\u6761\u76EE" }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rawTitle = await this.requestPrompt("\u6DFB\u52A0\u5B50\u6761\u76EE", "\u8F93\u5165\u6761\u76EE\u540D\u79F0");
        if (rawTitle == null) return;
        const cleanTitle = text(rawTitle, "");
        if (!cleanTitle) {
          new Notice("\u6761\u76EE\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A\u3002");
          return;
        }
        const nextId = createId("item");
        await this.persist((data) => {
          data.itemsById[nextId] = { id: nextId, title: cleanTitle, comment: "", tabId, parentId: item.id, isCollapsed: false, noteExpanded: false, noteBinding: null, createdAt: nowString(), updatedAt: nowString() };
          const key = tabParentKey(tabId, item.id);
          data.childrenByParentByTab[key] = [nextId].concat(data.childrenByParentByTab[key] || []);
          if (data.itemsById?.[item.id]) data.itemsById[item.id].isCollapsed = false;
        });
      };
      actions.createEl("button", { cls: "collection-card-sub-btn", text: item.noteBinding?.path ? "\u4FEE\u6539\u7ED1\u5B9A" : "\u7ED1\u5B9A\u7B14\u8BB0" }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.bindNoteToItem(item.id);
      };
      actions.createEl("button", { cls: "collection-card-sub-btn", text: "\u91CD\u547D\u540D" }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.renameItem(item.id);
      };
      const openBtn = actions.createEl("button", { cls: "collection-card-sub-btn", text: "\u6253\u5F00" });
      openBtn.disabled = !item.noteBinding?.path;
      openBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.openBoundNote(item.id);
      };
      actions.createEl("button", { cls: "collection-card-sub-btn", text: "\u5220\u9664" }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.deleteItem(item.id);
      };
      actions.createEl("button", {
        cls: "collection-card-sub-btn",
        text: item.comment ? "\u7F16\u8F91\u8BC4\u8BBA" : "\u6DFB\u52A0\u8BC4\u8BBA"
      }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.editItemComment(item.id);
      };
      actions.createEl("button", { cls: "collection-card-sub-btn eva-meta-capture-btn", text: "M", attr: { title: "EVA Meta \u6355\u83B7\u8FD9\u4E2A\u6761\u76EE" } }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.captureEvaMetaForItem(item.id, { label: item.title });
      };
      actions.createEl("button", {
        cls: "collection-card-sub-btn",
        text: relationSnapshot.outgoing.length > 0 || relationSnapshot.incoming.length > 0 ? `\u5173\u7CFB ${relationSnapshot.outgoing.length + relationSnapshot.incoming.length}` : "\u5173\u7CFB"
      }).onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.openRelationEditorForItem(item.id);
      };
      if (item.noteBinding?.path && this.isItemNoteExpandedForView(item)) {
        const noteWrap = branch.createDiv({ cls: "collection-card-note-preview" });
        this.renderInlineNote(noteWrap, item);
      }
      if (hasChildren && !this.isItemCollapsedForView(item)) {
        const childWrap = branch.createDiv({ cls: "collection-card-item-children" });
        this.renderItems(childWrap, item.id, tabId, level + 1);
      }
    }
  }
  async render(options = {}) {
    const tracking = this.getTrackingAdapter();
    return tracking.consumer.runSync(pass => {
      if (!tracking.prepare(pass)) return false;
      try {
        this.renderTrackingReady(options);
        tracking.finish();
        return true;
      } catch (error) { tracking.showPending("页面更新未完成，请重新核验。"); throw error; }
    });
  }
  renderTrackingReady(options = {}) {
    this.renderSerial = (this.renderSerial || 0) + 1;
    if (this.historySession) this.revalidateContextHistory();
    const viewTabId = this.getViewActiveTabId();
    const { contentEl } = this;
    if (!this.historySession && !this.skipScrollCaptureOnce) this.captureScrollState();
    this.skipScrollCaptureOnce = false;
    if (typeof this.scrollStateCleanup === "function") {
      try {
        this.scrollStateCleanup();
      } catch (_) {
      }
      this.scrollStateCleanup = null;
    }
    this.disposePreviewComponents();
    contentEl.empty();
    contentEl.toggleClass("is-collection-history-readonly", !!this.historySession);
    const wrap = contentEl.createDiv({ cls: "collection-card-wrap" });
    if (this.historySession) this.renderContextHistoryBanner(wrap);
    const activeTab = this.data.tabsById?.[viewTabId] || null;
    const totalTabs = Object.keys(this.data.tabsById || {}).length;
    const totalItems = Object.keys(this.data.itemsById || {}).length;
    const activeItemCount = Object.values(this.data.itemsById || {}).filter((item) => item?.tabId === viewTabId).length;
    const header = wrap.createDiv({ cls: "collection-card-header" });
    const title = header.createDiv({ cls: "collection-card-header-copy" });
    title.createDiv({ cls: "collection-card-kicker", text: "Owner API Host" });
    title.createDiv({ cls: "collection-card-title", text: "\u96C6\u5408\u5361\u89C6\u56FE" });
    title.createDiv({ cls: "collection-card-subtitle", text: `Source: ${text(this.sourceFile?.path || this.sourceNotePath, "(\u672A\u89E3\u6790\u5230\u6765\u6E90\u7B14\u8BB0)")}
Data: ${text(this.dataPath, "(\u672A\u89E3\u6790\u5230\u6570\u636E\u6587\u4EF6)")}` });
    title.createDiv({ cls: "collection-card-summary", text: "\u5F53\u524D\u89C6\u56FE\u7531 Collection Card View \u81EA\u4E3B\u7BA1\u7406\uFF0C\u5E76\u901A\u8FC7\u88AB\u52A8 API \u63A5\u53D7\u663E\u5F0F\u63A7\u5236\u3002" });
    title.children?.[1]?.setText?.("\u96C6\u5408\u5361\u89C6\u56FE");
    title.children?.[2]?.setText?.(`Source: ${text(this.sourceFile?.path || this.sourceNotePath, "(unresolved)")}
Data: ${text(this.dataPath, "(unresolved)")}`);
    title.children?.[3]?.setText?.("\u5F53\u524D\u89C6\u56FE\u7531 Collection Card View \u81EA\u4E3B\u7BA1\u7406\uFF0C\u5E76\u901A\u8FC7\u88AB\u52A8 API \u63A5\u53D7\u663E\u5F0F\u63A7\u5236\u3002");
    const actions = header.createDiv({ cls: "collection-card-actions" });
    actions.createEl("button", { text: "\u5237\u65B0" }).onclick = async () => this.reload();
    actions.createEl("button", { text: "\u65B0\u5EFA Tab" }).onclick = async () => this.addTab();
    actions.createEl("button", { text: "\u6DFB\u52A0\u6839\u6761\u76EE" }).onclick = async () => this.addRootItem();
    actions.children?.[0]?.setText?.("\u5237\u65B0");
    actions.children?.[1]?.setText?.("\u65B0\u5EFA Tab");
    actions.children?.[2]?.setText?.("\u6DFB\u52A0\u6839\u6761\u76EE");
    const chips = wrap.createDiv({ cls: "collection-card-chip-row" });
    chips.createDiv({ cls: `collection-card-chip ${this.isReady() ? "is-active" : ""}`.trim(), text: this.isReady() ? "API \u5DF2\u5C31\u7EEA" : "API \u5F85\u8FDE\u63A5" });
    chips.createDiv({ cls: "collection-card-chip", text: `${totalTabs} \u4E2A Tab` });
    chips.createDiv({ cls: "collection-card-chip", text: `${totalItems} \u4E2A\u6761\u76EE` });
    if (activeTab) chips.createDiv({ cls: "collection-card-chip", text: `\u5F53\u524D\uFF1A${activeTab.name}` });
    chips.children?.[0]?.setText?.(this.isReady() ? "API \u5DF2\u5C31\u7EEA" : "API \u5F85\u8FDE\u63A5");
    chips.children?.[1]?.setText?.(`${totalTabs} \u4E2A Tab`);
    chips.children?.[2]?.setText?.(`${totalItems} \u4E2A\u6761\u76EE`);
    if (activeTab) chips.children?.[3]?.setText?.(`\u5F53\u524D\uFF1A${activeTab.name}`);
    if (!this.isReady()) {
      wrap.createDiv({ cls: "collection-card-message", text: "\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u6765\u6E90\u7B14\u8BB0\uFF0C\u8BF7\u5148\u6253\u5F00\u6765\u6E90\u7B14\u8BB0\u6216\u4F7F\u7528\u9ED8\u8BA4\u5BBF\u4E3B\u7B14\u8BB0\u3002" });
      return;
    }
    const tabsPanel = wrap.createDiv({ cls: "collection-card-panel collection-card-tab-strip-panel" });
    const tabsHead = tabsPanel.createDiv({ cls: "collection-card-panel-head collection-card-tab-strip-head" });
    const tabsHeadCopy = tabsHead.createDiv({ cls: "collection-card-tab-strip-copy" });
    tabsHeadCopy.createDiv({ cls: "collection-card-panel-title", text: "Tab \u80F6\u56CA\u5E26" });
    tabsHeadCopy.createDiv({ cls: "collection-card-panel-caption", text: "Tabs \u4FDD\u6301\u5728\u9876\u90E8\uFF0C\u5B50 Tab \u4FDD\u6301\u6210\u7EC4\u5C55\u5F00\u3002" });
    tabsHeadCopy.children?.[0]?.setText?.("Tab \u80F6\u56CA\u5E26");
    tabsHeadCopy.children?.[1]?.setText?.("\u53C2\u8003\u539F\u7248\u80F6\u56CA\u5F62\u6001\uFF0C\u652F\u6301\u7236\u5B50\u5C42\u7EA7\u548C\u62D6\u62FD\u6392\u5E8F\u3002");
    const tabsHeadActions = tabsHead.createDiv({ cls: "collection-card-main-actions" });
    tabsHeadActions.createEl("button", { cls: "collection-card-sub-btn", text: "+ \u6839 Tab" }).onclick = async () => this.addTab();
    tabsHeadActions.createEl("button", { cls: "collection-card-sub-btn", text: "+ \u5B50 Tab" }).onclick = async () => this.addChildTab();
    const tabsBody = tabsPanel.createDiv({ cls: "collection-card-panel-body collection-card-tab-strip-body" });
    tabsHeadActions.children?.[0]?.setText?.("\uFF0B \u6839 Tab");
    tabsHeadActions.children?.[1]?.setText?.("\uFF0B \u5B50 Tab");
    const tabRootDropZone = tabsBody.createDiv({
      cls: "collection-card-tab-root-drop-zone",
      text: "\u5C06 Tab \u62D6\u5230\u8FD9\u91CC\u53EF\u8BBE\u4E3A\u9876\u5C42"
    });
    tabRootDropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!text(this.tabDragState.draggedId)) return;
      tabRootDropZone.classList.add("drag-over");
    });
    tabRootDropZone.addEventListener("dragleave", () => tabRootDropZone.classList.remove("drag-over"));
    tabRootDropZone.addEventListener("drop", async (event) => {
      event.preventDefault();
      tabRootDropZone.classList.remove("drag-over");
      const draggedId = text(this.tabDragState.draggedId);
      if (!draggedId) return;
      await this.moveTabToRoot(draggedId);
    });
    if (!this.historySession) {
      this.renderStoppedContextTabs(tabsBody);
      this.renderTabCapsuleKeywordIndex(tabsBody, options);
    }
    this.renderTabTree(tabsBody, null, 0);
    if (!tabsBody.childElementCount) {
      tabsBody.createDiv({ cls: "collection-card-empty", text: "\u5F53\u524D\u6CA1\u6709\u53EF\u6E32\u67D3\u7684 Tab\u3002" });
    }
    if (this.isStoppedContextTab(viewTabId)) {
      wrap.createEl("button", { text: "当前 Tab 已停止追踪 · 回看" }).onclick = () => this.openContextHistory(viewTabId);
      void this.syncRelationAdapter(); return;
    }
    const contextActions = wrap.createDiv({ cls: "collection-card-context-actions" });
    contextActions.createEl("button", { text: "\uFF0B \u6839\u6761\u76EE", cls: "collection-card-main-btn" }).onclick = async () => this.addRootItem();
    contextActions.createEl("button", { text: "\uFF0B \u65B0\u5EFA\u5B50 Tab", cls: "collection-card-sub-btn" }).onclick = async () => this.addChildTab();
    contextActions.createEl("button", { text: "\uFF0B \u65B0\u5EFA Tab", cls: "collection-card-sub-btn" }).onclick = async () => this.addTab();
    contextActions.createEl("button", { text: "\u91CD\u547D\u540D\u5F53\u524D Tab", cls: "collection-card-sub-btn" }).onclick = async () => this.renameTab();
    contextActions.createEl("button", { text: "\u5173\u95ED\u5F53\u524D Tab", cls: "collection-card-sub-btn" }).onclick = async () => this.closeTab();
    const floatingToc = wrap.createDiv({ cls: `collection-card-floating-toc ${this.ui.floatingTocCollapsed ? "is-collapsed" : ""}`.trim() });
    this.renderFloatingToc(floatingToc, viewTabId);
    const layout = wrap.createDiv({ cls: "collection-card-layout collection-card-layout-single" });
    const main = layout.createDiv({ cls: "collection-card-panel collection-card-main-panel" });
    const mainHead = main.createDiv({ cls: "collection-card-panel-head collection-card-main-head" });
    mainHead.createDiv({ cls: "collection-card-main-title", text: this.data.tabsById?.[viewTabId]?.name || "\u5F53\u524D\u96C6\u5408\u5361" });
    const mainMeta = mainHead.createDiv({ cls: "collection-card-main-actions" });
    mainMeta.createDiv({ cls: "collection-card-status-pill", text: `Items: ${activeItemCount}` });
    mainMeta.createDiv({ cls: "collection-card-status-pill", text: `Source: ${text(this.sourceFile?.basename, "N/A")}` });
    mainHead.children?.[0]?.setText?.(this.data.tabsById?.[viewTabId]?.name || "\u5F53\u524D\u96C6\u5408\u5361");
    mainMeta.children?.[0]?.setText?.(`\u6761\u76EE\uFF1A${activeItemCount}`);
    mainMeta.children?.[1]?.setText?.(`\u6765\u6E90\uFF1A${text(this.sourceFile?.basename, "N/A")}`);
    this.mainScrollEl = main.createDiv({ cls: "collection-card-panel-body collection-card-main-body" });
    const rootDropZone = this.mainScrollEl.createDiv({
      cls: "collection-card-root-drop-zone",
      text: "\u21A5 \u628A\u6761\u76EE\u62D6\u5230\u8FD9\u91CC\u53EF\u79FB\u56DE\u5F53\u524D Tab \u6839\u5C42"
    });
    rootDropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      const draggedId = text(this.itemDragState.draggedId);
      const draggedItem = this.data.itemsById?.[draggedId];
      if (!draggedId || !draggedItem || draggedItem.tabId !== this.data.activeTabId) return;
      rootDropZone.classList.add("drag-over");
    });
    rootDropZone.addEventListener("dragleave", () => rootDropZone.classList.remove("drag-over"));
    rootDropZone.addEventListener("drop", async (event) => {
      event.preventDefault();
      rootDropZone.classList.remove("drag-over");
      const draggedId = text(this.itemDragState.draggedId);
      const draggedItem = this.data.itemsById?.[draggedId];
      if (!draggedId || !draggedItem || draggedItem.tabId !== this.data.activeTabId) return;
      await this.moveItemToRoot(draggedId, this.data.activeTabId);
    });
    if (!(this.data.childrenByParentByTab?.[tabParentKey(viewTabId, null)] || []).length) {
      this.mainScrollEl.createDiv({ cls: "collection-card-empty", text: "\u5F53\u524D\u96C6\u5408\u5361\u8FD8\u6CA1\u6709\u6761\u76EE\u3002" });
    } else {
      this.renderItems(this.mainScrollEl, null, viewTabId, 0);
    }
    if (!this.historySession) {
      this.bindScrollStateTracking();
      this.restoreScrollState();
      this.flushPendingRelationFocus();
      this.flushPendingTabCapsuleFocus();
    }
    void this.syncRelationAdapter();
    if (!this.historySession) void this.restorePendingRelationFocus();
  }
};
const { WorkspaceCarrierCreation, digest: managedCreationDigest } = (() => { const module = { exports: {} };
"use strict";
const {createHash}=require("node:crypto");
const plain=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>Array.isArray(x)?x.map(canonical):plain(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>createHash("sha256").update(JSON.stringify(canonical(x))).digest("hex");
const txPattern=/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function fail(code){throw Object.assign(Error(code),{code});}
class WorkspaceCarrierCreation {
  constructor(config){this.c=config;this.ownerId=config.ownerId||"workspace-mount";this.prefix=config.stepPrefix||"workspace";}
  validateData(d){if(!plain(d)||!plain(d.tabsById)||!plain(d.itemsById)||!plain(d.childrenByParentByTab)||!plain(d.tabChildrenByParent)||!Array.isArray(d.tabChildrenByParent[this.c.root])||!Array.isArray(d.tabOrder)||d.contextCreationReceipts!==undefined&&!plain(d.contextCreationReceipts))fail("workspace-carrier-schema-invalid");}
  validateKeywords(d){if(!plain(d)||!plain(d.assignmentsByKeywordKey)||d.contextCreationReceipts!==undefined&&!plain(d.contextCreationReceipts))fail("workspace-keyword-schema-invalid");}
  async scope(){const s=await this.c.scope();if(this.c.closed()||![s?.sourceNotePath,s?.dataPath,s?.keywordPath].every(x=>typeof x==="string"&&x))fail("workspace-source-unavailable");return s;}
  async assertScope(p,live){if(!live()||this.c.closed())fail("creation-lease-ended");const s=await this.scope();if(s.sourceNotePath!==p.sourceNotePath||s.dataPath!==p.dataPath||s.keywordPath!==p.keywordPath||!live())fail("workspace-source-changed");return s;}
  receiptKey(p){return `${p.txId}:carrier`;}
  async readKeywords(p){
    if(p.keywordFileState==="present"&&!await this.c.keywordExists(p))fail("creation-keyword-file-deleted");
    return this.c.readKeywords(p);
  }
  checkTab(d,p){
    this.validateData(d);const receipt=d.contextCreationReceipts?.[this.receiptKey(p)],tab=d.tabsById[p.tabId];
    const refs=Object.values(d.tabChildrenByParent).reduce((n,ids)=>n+(Array.isArray(ids)?ids.filter(id=>id===p.tabId).length:0),0);
    if(receipt){
      if(receipt.planHash!==digest(p)||receipt.tabId!==p.tabId)return {state:"conflict",reason:"workspace-carrier-receipt-conflict"};
      if(!tab)return {state:"conflict",reason:"workspace-carrier-deleted"};
      if(tab.id!==p.tabId||tab.name!==p.projectName||tab.parentTabId!==null||(this.c.requiresKind!==false&&tab.kind!=="project")||refs!==1||d.tabChildrenByParent[this.c.root].filter(id=>id===p.tabId).length!==1||d.tabOrder.filter(id=>id===p.tabId).length!==1)return {state:"conflict",reason:"workspace-carrier-edited"};
      return {state:"verified",receipt:{sourceNotePath:p.sourceNotePath,tabId:p.tabId,planHash:digest(p)}};
    }
    if(tab||refs||d.tabOrder.includes(p.tabId)||Object.hasOwn(d.childrenByParentByTab,this.c.itemRoot(p.tabId))||Object.values(d.itemsById).some(x=>x?.tabId===p.tabId))return {state:"conflict",reason:"workspace-carrier-id-collision"};
    if(Object.values(d.tabsById).some(x=>x?.name===p.projectName))return {state:"conflict",reason:"workspace-carrier-name-conflict"};
    if(Object.keys(d.contextCreationReceipts||{}).length>=2048)return {state:"conflict",reason:"workspace-carrier-receipt-limit"};
    return {state:"absent"};
  }
  checkKeywords(d,p){
    this.validateKeywords(d);const receipt=d.contextCreationReceipts?.[this.receiptKey(p)],entry=d.assignmentsByKeywordKey[p.keywordKey];
    if(receipt){
      if(receipt.planHash!==digest(p)||receipt.tabId!==p.tabId)return {state:"conflict",reason:"workspace-keyword-receipt-conflict"};
      if(!entry||entry.keyword!==p.contextKey||entry.keywordKey!==p.keywordKey||entry.tabId!==p.tabId||entry.sourceNotePath!==p.sourceNotePath)return {state:"conflict",reason:"workspace-created-binding-deleted-or-edited"};
      return {state:"verified",receipt:{sourceNotePath:p.sourceNotePath,tabId:p.tabId,keywordKey:p.keywordKey,planHash:digest(p)}};
    }
    if(entry||Object.values(d.assignmentsByKeywordKey).some(x=>x?.tabId===p.tabId||this.c.key(x?.keyword)===p.keywordKey))return {state:"conflict",reason:"workspace-keyword-already-used"};
    if(Object.keys(d.contextCreationReceipts||{}).length>=2048)return {state:"conflict",reason:"workspace-keyword-receipt-limit"};
    return {state:"absent"};
  }
  async prepare(request){
    const r=clone(request);if(!txPattern.test(r.txId)||!["project","goal"].includes(r.domain)||typeof r.projectName!=="string"||!r.projectName.trim()||typeof r.contextKey!=="string"||!r.contextKey.trim())fail("workspace-carrier-request-invalid");
    const s=await this.scope(),p={txId:r.txId,domain:r.domain,...s,tabId:`tab_ck_${r.txId.slice(7)}`,projectName:r.projectName.trim(),contextKey:r.contextKey.trim(),keywordKey:this.c.key(r.contextKey),keywordFileState:await this.c.keywordExists(s)?"present":"absent"};
    if(this.checkTab(await this.c.readData(s),p).state!=="absent"||this.checkKeywords(await this.readKeywords(p),p).state!=="absent")fail("workspace-carrier-preview-conflict");
    if((await this.c.keywordExists(s)?"present":"absent")!==p.keywordFileState)fail("creation-keyword-file-changed-during-preview");
    await this.assertScope(p,()=>true);
    return [
      {id:`${this.prefix}-carrier`,owner:this.ownerId,source:s.sourceNotePath,contract:1,depends:[],plan:clone(p)},
      {id:`${this.prefix}-keyword`,owner:this.ownerId,source:s.sourceNotePath,contract:1,depends:[`${this.prefix}-carrier`],plan:clone(p)},
    ];
  }
  validateRequest(request){
    const r={intent:clone(request.intent),step:clone(request.step),receipts:clone(request.receipts||[]),isCurrent:request.isCurrent},p=r.step?.plan;
    const fields=["txId","domain","sourceNotePath","dataPath","keywordPath","tabId","projectName","contextKey","keywordKey","keywordFileState"];
    if(!plain(p)||Object.keys(p).length!==fields.length||fields.some(k=>typeof p[k]!=="string"||!p[k])||!txPattern.test(p.txId)||p.txId!==r.intent.id||p.domain!==r.intent.domain||!["project","goal"].includes(p.domain)||r.step.owner!==this.ownerId||r.step.contract!==1||![`${this.prefix}-carrier`,`${this.prefix}-keyword`].includes(r.step.id)||r.step.source!==p.sourceNotePath||p.tabId!==`tab_ck_${p.txId.slice(7)}`||p.projectName!==r.intent.input?.projectName||p.contextKey!==r.intent.input?.contextKey||p.keywordKey!==this.c.key(p.contextKey)||typeof r.isCurrent!=="function")fail("workspace-carrier-plan-mismatch");
    if(!["present","absent"].includes(p.keywordFileState))fail("creation-keyword-file-state-invalid");
    return r;
  }
  async inspect(request){
    const r=this.validateRequest(request),p=r.step.plan,s=await this.assertScope(p,r.isCurrent);
    const tab=this.checkTab(await this.c.readData(s),p);let result=tab;
    if(r.step.id===`${this.prefix}-keyword`){
      if(!["present","absent"].includes(p.keywordFileState))fail("creation-keyword-file-state-invalid");
      if(p.keywordFileState==="absent"&&!await this.c.keywordExists(p)&&r.receipts.some(x=>x.id===r.step.id&&x.attempts>0))return {state:"unknown",reason:"creation-new-keyword-file-missing-after-attempt"};
      result=tab.state==="verified"?this.checkKeywords(await this.readKeywords(p),p):{state:"conflict",reason:"workspace-carrier-prerequisite-unverified"};
    }
    await this.assertScope(p,r.isCurrent);return result;
  }
  async commit(request){
    const r=this.validateRequest(request),p=r.step.plan;await this.assertScope(p,r.isCurrent);
    if(r.step.id===`${this.prefix}-carrier`){
      await this.c.mutateData(p,async d=>{
        await this.assertScope(p,r.isCurrent);const status=this.checkTab(d,p);if(status.state==="verified")return {data:d,skipWrite:true};if(status.state!=="absent")fail(status.reason);
        const next=clone(d),now=this.c.now();
        next.tabsById[p.tabId]={id:p.tabId,name:p.projectName,emoji:"",accentColor:"",kind:"project",parentTabId:null,boundParadigmIds:[],boundParadigmItemKeys:[],boundParadigmId:null,tabKeywordsById:{},tabKeywordOrder:[],createdAt:now,updatedAt:now};
        next.tabChildrenByParent[this.c.root].push(p.tabId);next.tabOrder.push(p.tabId);next.childrenByParentByTab[this.c.itemRoot(p.tabId)]=[];
        next.contextCreationReceipts||={};next.contextCreationReceipts[this.receiptKey(p)]={planHash:digest(p),tabId:p.tabId,createdAt:now};
        return {data:next,prepared:true};
      },r.isCurrent);
    }else{
      await this.c.mutateKeywords(p,async d=>{
        const s=await this.assertScope(p,r.isCurrent);if(this.checkTab(await this.c.readData(s),p).state!=="verified")fail("workspace-carrier-prerequisite-unverified");
        const status=this.checkKeywords(d,p);if(status.state==="verified")return {data:d,skipWrite:true};if(status.state!=="absent")fail(status.reason);
        const next=clone(d),now=this.c.now();next.assignmentsByKeywordKey[p.keywordKey]={keyword:p.contextKey,keywordKey:p.keywordKey,sourceNotePath:p.sourceNotePath,tabId:p.tabId,tabNameSnapshot:p.projectName,createdAt:now,updatedAt:now};
        next.contextCreationReceipts||={};next.contextCreationReceipts[this.receiptKey(p)]={planHash:digest(p),tabId:p.tabId,createdAt:now};return {data:next};
      },r.isCurrent);
    }
    return this.inspect(r);
  }
}
module.exports={WorkspaceCarrierCreation,digest};

return module.exports; })();
module.exports = class CollectionCardViewPlugin extends Plugin {
  getCarrierCreationOwnerV1() {
    if (this.carrierCreationOwnerV1) return this.carrierCreationOwnerV1;
    this.carrierCreationOwnerV1 = new WorkspaceCarrierCreation({
      ownerId: "collection-card-view", stepPrefix: "collection", requiresKind: false,
      closed: () => this.actionEntryClosed === true || this.contextRenameClosed === true,
      root: ROOT_KEY, itemRoot: tabId => tabParentKey(tabId, null), now: () => nowString(), key: value => normalizeKeywordKey(value),
      scope: async () => {
        const sourceFile = this.resolveSourceFile(this.getDefaultSourceNotePath());
        if (!sourceFile) throw new Error("collection-source-unresolved");
        return { sourceNotePath: sourceFile.path, dataPath: this.resolveDataPathForFile(sourceFile), keywordPath: this.resolveTabCapsuleKeywordsPathForFile(sourceFile) };
      },
      readData: async scope => {
        const data = JSON.parse(await this.app.vault.adapter.read(scope.dataPath));
        if (data.schemaVersion !== "1.0") throw new Error("collection-creation-schema-invalid");
        return data;
      },
      readKeywords: async scope => await this.app.vault.adapter.exists(scope.keywordPath) ? JSON.parse(await this.app.vault.adapter.read(scope.keywordPath)) : defaultTabCapsuleKeywordData(),
      keywordExists: scope => this.app.vault.adapter.exists(scope.keywordPath),
      mutateData: (plan, fn, live) => this.mutateCreationDocumentV1(plan, "dataPath", fn, live),
      mutateKeywords: (plan, fn, live) => this.mutateCreationDocumentV1(plan, "keywordPath", fn, live),
    });
    return this.carrierCreationOwnerV1;
  }
  assertManagedCreationReceiptsV1(current, candidate) {
    if (current.contextCreationReceipts !== undefined && !isObject(current.contextCreationReceipts)) throw new Error("collection-creation-receipts-invalid");
    for (const [id, receipt] of Object.entries(current.contextCreationReceipts || {})) {
      if (!candidate.contextCreationReceipts?.[id] || managedCreationDigest(candidate.contextCreationReceipts[id]) !== managedCreationDigest(receipt)) throw new Error("collection-stale-creation-receipt-reload");
    }
  }
  async mutateCreationDocumentV1(plan, field, fn, live) {
    const owner = this.getCarrierCreationOwnerV1();
    return actionEntry.enqueue(this, plan.dataPath, async () => {
      await owner.assertScope(plan, live);
      const path = plan[field], original = await this.app.vault.adapter.exists(path) ? await this.app.vault.adapter.read(path) : null;
      if (field === "dataPath" && original === null) throw new Error("collection-owner-file-missing");
      if (field === "keywordPath" && original === null && plan.keywordFileState === "present") throw new Error("creation-keyword-file-deleted");
      const data = original === null ? defaultTabCapsuleKeywordData() : JSON.parse(original);
      if (field === "dataPath" && data.schemaVersion !== "1.0") throw new Error("collection-creation-schema-invalid");
      const result = await fn(data); if (result.skipWrite) return result.data;
      this.assertManagedCreationReceiptsV1(data, result.data);
      if (field === "dataPath") result.data.lastModified = nowString();
      else {
        owner.validateKeywords(result.data);
        if (owner.checkTab(await owner.c.readData(plan), plan).state !== "verified") throw new Error("collection-carrier-prerequisite-unverified");
      }
      await owner.assertScope(plan, live);
      const payload = JSON.stringify(result.data, null, 2);
      try {
        await this.getCenterNamingConsumerV1().publish(path, raw => {
          const source = this.resolveSourceFile(this.getDefaultSourceNotePath());
          if (!live() || owner.c.closed() || source?.path !== plan.sourceNotePath || this.resolveDataPathForFile(source) !== plan.dataPath || this.resolveTabCapsuleKeywordsPathForFile(source) !== plan.keywordPath) throw new Error("collection-creation-source-changed");
          if (raw !== original) throw new Error("collection-creation-foreign-change");
          if (field === "keywordPath" && owner.checkTab(JSON.parse(this.getCenterNamingConsumerV1().readFile(plan.dataPath)), plan).state !== "verified") throw new Error("collection-carrier-prerequisite-unverified");
          return payload;
        }, plan.sourceNotePath);
      } finally {
        if (field === "keywordPath") {
          const rename = this.getContextRenameOwner();
          rename.generations.set(plan.keywordPath, (rename.generations.get(plan.keywordPath) || 0) + 1);
        }
      }
      await owner.assertScope(plan, live);
      const confirmed = JSON.parse(await this.app.vault.adapter.read(path));
      const check = field === "dataPath" ? owner.checkTab(confirmed, plan) : owner.checkKeywords(confirmed, plan);
      if (check.state !== "verified") throw new Error("collection-creation-readback-failed");
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
        const view = leaf?.view;
        if (!view || view.historySession || view.dataPath !== plan.dataPath || (view.sourceFile?.path || view.sourceNotePath) !== plan.sourceNotePath) continue;
        if (field === "dataPath") {
          const active = view.data?.activeTabId, collapsed = view.data?.tabTreeCollapsedById;
          view.data = JSON.parse(JSON.stringify(confirmed));
          if (view.data.tabsById[active]) view.data.activeTabId = active;
          if (collapsed) view.data.tabTreeCollapsedById = collapsed;
        } else {
          view.tabCapsuleKeywordData = this.getContextRenameOwner().stamp(JSON.parse(JSON.stringify(confirmed)), plan);
          view.tabCapsuleKeywordLoadError = "";
        }
      }
      this.dispatchContextCarrierChanged("managed-context-created", { sourceNotePath: plan.sourceNotePath, tabId: plan.tabId });
      return confirmed;
    });
  }
  async commitManagedCreationStepV1(request) {
    const owner = this.getCarrierCreationOwnerV1(), checked = owner.validateRequest(request), plan = checked.step.plan;
    const api = this.app?.plugins?.plugins?.[OPERATION_AUDIT_PLUGIN_ID]?.api || window[OPERATION_AUDIT_GLOBAL] || null;
    let handle = null, result = null, failure = null;
    try { handle = await api?.beginOperation?.({ "来源插件": "collection card view", "来源实例": plan.sourceNotePath, "会话编号": plan.txId, "数据位置": checked.step.id === "collection-keyword" ? plan.keywordPath : plan.dataPath, "对象类型": "项目载体", "对象名称": plan.projectName, "操作类型": "新增", "修改摘要": "主键管理新增 / 显式继续", "扩展_creation_transaction": plan.txId, "扩展_creation_step": checked.step.id, "扩展_collection_tab": plan.tabId }); }
    catch (error) { console.warn("[Collection Card] managed creation audit begin failed", error); }
    try { result = await owner.commit(checked); } catch (error) { failure = error; }
    let verified = result?.state === "verified";
    if (!verified) { try { verified = (await owner.inspect(checked)).state === "verified"; } catch (_) {} }
    if (handle?.operationId) {
      try { await api.finishOperation(handle.operationId, { "结果": verified ? "success" : "failed", "失败原因": verified ? "" : String(failure?.message || "创建结果尚未核验"), "扩展_creation_verified": verified, "扩展_creation_warning": verified && failure ? failure.message : "" }); }
      catch (error) { console.warn("[Collection Card] managed creation audit finish failed", error); }
    }
    if (failure) throw failure;
    return result;
  }

  getCenterBindingParticipantV1() { return this.getCenterNamingConsumerV1().bindingParticipant; }
  getCenterNamingParticipantV1() { return this.getCenterNamingConsumerV1().participant; }
  getCenterNamingConsumerV1() {
    if (!this.centerNamingConsumerV1) {
      const path = require("node:path"), { createRequire } = require("node:module");
      const base = this.app.vault.adapter.getBasePath?.();
      if (!base) throw new Error("collection-local-vault-required");
      const entry = path.join(base, this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`, "collection-consumer.cjs");
      this.centerNamingConsumerV1 = createRequire(entry)(entry).installCollectionConsumer(this);
    }
    return this.centerNamingConsumerV1;
  }
  // C3 Y1 R11: tabs that no longer carry a key, proven by the center only (read only; any failure -> no badge).
  collectUnboundTabIdsV1(keywordData, sourceNotePath, tabsById) {
    const t0 = Date.now();
    try {
      const api = this.app.plugins?.plugins?.["context-key-manager"]?.getNamingProjectionAuthorityV1?.();
      if (!api?.snapshot) return new Set();
      if (!this.bindingBadgesV1) {
        const path = require("node:path"), { createRequire } = require("node:module");
        const base = this.app.vault.adapter.getBasePath?.();
        if (!base) return new Set();
        const entry = path.join(base, this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`, "binding-badges.cjs");
        this.bindingBadgesV1 = createRequire(entry)(entry);
      }
      return this.bindingBadgesV1.unboundTabIds({ snapshot: api.snapshot(), keywordData, sourceNotePath, tabsById });
    } catch (_) {
      return new Set();
    } finally {
      this.bindingBadgeMs = Date.now() - t0;
    }
  }
  getContextRenameOwner() {
    if (this.contextRenameOwner) return this.contextRenameOwner;
    const pluginDir = this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
    const basePath = this.app.vault.adapter.basePath;
    if (!basePath) throw new Error("context-rename-desktop-adapter-required");
    const source = require("fs").readFileSync(require("path").join(basePath, pluginDir, "context-rename-owner.cjs"), "utf8");
    const localModule = { exports: {} };
    new Function("require", "module", "exports", source)(require, localModule, localModule.exports);
    const { RenameOwner } = localModule.exports;
    this.contextRenameOwner = new RenameOwner({
      app: this.app, pluginDir, pluginId: this.manifest.id,
      closed: () => this.contextRenameClosed === true,
      map: "assignmentsByKeywordKey", id: "tabId", carriers: "tabsById",
      process: (scope, callback) => this.getCenterNamingConsumerV1().publish(scope.keywordPath, callback, scope.sourceNotePath),
      currentSource: () => this.resolveSourceFile(this.getDefaultSourceNotePath())?.path,
      resolve: async () => {
        const sourceFile = this.resolveSourceFile(this.getDefaultSourceNotePath());
        if (!sourceFile) throw new Error("collection-source-unresolved");
        return { sourceNotePath: sourceFile.path, dataPath: this.resolveDataPathForFile(sourceFile), keywordPath: this.resolveTabCapsuleKeywordsPathForFile(sourceFile) };
      },
      enqueue: (scope, task) => actionEntry.enqueue(this, scope.dataPath, task),
      publish: async (scope, data) => {
        const views = this.findLeavesBySourceNotePath(scope.sourceNotePath).map(l => l.view);
        for (const view of views) { view.tabCapsuleKeywordData = this.getContextRenameOwner().stamp(JSON.parse(JSON.stringify(data)), scope); view.tabCapsuleKeywordLoadError = ""; }
        this.dispatchContextCarrierChanged("context-key-rename-verified", { sourceNotePath: scope.sourceNotePath });
        await Promise.allSettled(views.map(v => v.render()));
      },
    });
    return this.contextRenameOwner;
  }
  async contextCapsuleRenameV2(options = {}) {
    try { return await this.getContextRenameOwner().run(options); }
    catch (error) { return { ok: false, version: 2, reason: error.message || "rename-module-unavailable" }; }
  }
  async onload() {
    this.c2InputRecovery=C2InputRecovery.install(this,require("obsidian"));
    this.contextRenameClosed = false;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.registerView(VIEW_TYPE, (leaf) => new CollectionCardView(leaf, this));
    this.globalApi = {
      creationContractVersion: 1,
      prepareContextCarrierCreationV1: request => this.getCarrierCreationOwnerV1().prepare(request),
      inspectCreationStep: request => this.getCarrierCreationOwnerV1().inspect(request),
      commitCreationStep: request => this.commitManagedCreationStepV1(request),
      pluginId: this.manifest.id,
      pluginVersion: this.manifest.version,
      prepareOperationalRootItem: (options = {}) => actionEntry.prepare(this, options),
      createOperationalRootItem: (options = {}) => actionEntry.create(this, options),
      getBridge: (sourceNotePath = "") => this.getBridge(sourceNotePath),
      ensureBridge: async (sourceNotePath = "") => this.ensureBridge(sourceNotePath),
      openView: async (sourceNotePath = "") => this.activateView(sourceNotePath),
      openItem: async (sourceNotePath = "", tabId = "", itemId = "", options = {}) => await this.openItem(sourceNotePath, tabId, itemId, options),
      openHistoryNodeV1: async nodeKey => await this.openHistoryNodeV1(nodeKey),
      openNode: async (nodeKey, context = {}) => await this.openNode(nodeKey, context),
      ensureProjectContextTab: async (options = {}) => {
        const requestedPath = text(options?.sourceNotePath || options?.notePath || "", this.getDefaultSourceNotePath());
        const sourceNotePath = this.resolveSourceFile(requestedPath)?.path || requestedPath;
        let resolved = this.resolveBridgeHost(sourceNotePath);
        if (resolved.status === "ambiguous") return { ok: false, reason: "ambiguous-collection-host", sourceNotePath };
        if (resolved.view?.provisioningLoadCount || resolved.exactHosts?.some((entry) => entry.view?.provisioningLoadCount)) {
          return { ok: false, reason: "collection-host-loading", sourceNotePath };
        }
        if (resolved.status !== "resolved" || !resolved.view?.isProvisioningReady()) {
          await this.activateView(sourceNotePath);
          resolved = this.resolveBridgeHost(sourceNotePath);
        }
        const view = resolved.view;
        if (resolved.status !== "resolved" || !(view instanceof CollectionCardView) || !view.isProvisioningReady() || text(view.sourceFile?.path || view.sourceNotePath) !== sourceNotePath) {
          return { ok: false, reason: resolved.status === "ambiguous" ? "ambiguous-collection-host" : "view-not-ready", sourceNotePath };
        }
        return await view.ensureProjectContextTab({ ...options, sourceNotePath });
      },
      getContextCapsuleCarrierSnapshot: async (options = {}) => this.getContextCapsuleCarrierSnapshot(options),
      contextCapsuleRenameV2: async (options = {}) => this.contextCapsuleRenameV2(options),
      renameContextCapsuleKey: async (options = {}) => {
        const sourceNotePath = text(options?.sourceNotePath || options?.notePath || "", this.getDefaultSourceNotePath());
        await this.activateView(sourceNotePath);
        const view = await this.waitForView(sourceNotePath);
        if (!(view instanceof CollectionCardView)) return { ok: false, pluginId: "collection-card-view", reason: "view-not-ready", matchedCount: 0, renamedCount: 0 };
        if (!view.isReady()) await view.setState({ sourceNotePath });
        return await view.renameContextCapsuleKey(options);
      },
      syncContextCapsuleKey: async (options = {}) => {
        const sourceNotePath = text(options?.sourceNotePath || options?.notePath || "", this.getDefaultSourceNotePath());
        await this.activateView(sourceNotePath);
        const view = await this.waitForView(sourceNotePath);
        if (!(view instanceof CollectionCardView)) return { ok: false, pluginId: "collection-card-view", reason: "view-not-ready", matchedCount: 0, renamedCount: 0 };
        if (!view.isReady()) await view.setState({ sourceNotePath });
        return await view.syncContextCapsuleKey(options);
      }
    };
    // Source-bound Collection action view; metadata remains owned by NAW.
    {
      const actionModule = {exports:{}};
      const actionPath = require("path").join(this.app.vault.adapter.basePath, this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`, "action-mode.cjs");
      new Function("require","module","exports",require("fs").readFileSync(actionPath,"utf8"))(require,actionModule,actionModule.exports);
      actionModule.exports.install(this,{...require("obsidian"),Modal},actionEntry);
    }
    window.__collectionCardViewPluginApi = this.globalApi;
    this.registerJumpOpener();
    this.addCommand({ id: "open-collection-card-view", name: "Open Collection Card View", callback: async () => this.activateView() });
    this.addCommand({ id: "open-collection-card-view-for-current-note", name: "Open Collection Card View for current note", callback: async () => {
      const activeFile = this.app.workspace.getActiveFile();
      await this.activateView(activeFile instanceof TFile ? activeFile.path : this.getDefaultSourceNotePath());
    } });
    this.addRibbonIcon("files", "Open Collection Card View", async () => this.activateView());
  }
  onunload() {
    this.contextRenameClosed = true;
    this.centerNamingConsumerV1?.close?.();
    this.actionEntryClosed = true;
    if (this.contextCarrierChangedTimer) window.clearTimeout?.(this.contextCarrierChangedTimer);
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.detach());
    this.unregisterJumpOpener();
    if (window.__collectionCardViewPluginApi === this.globalApi) delete window.__collectionCardViewPluginApi;
  }
  getDefaultSourceNotePath() {
    const fallbackPath = "\u2464\u96C6\u5408\u5361\u89C6\u56FE.md";
    const configured = text(this.settings?.defaultSourceNotePath, "");
    return this.resolveNoteFile(configured)?.path || fallbackPath;
  }
  dispatchContextCarrierChanged(reason = "collection-card-data-changed", detail = {}) {
    if (this.contextCarrierChangedTimer) window.clearTimeout?.(this.contextCarrierChangedTimer);
    const payload = Object.assign({}, detail, {
      providerId: "collection-card-view",
      revision: text(detail?.revision || detail?.updatedAt || nowString()),
      reason: text(reason, "collection-card-data-changed"),
      timestamp: Date.now()
    });
    if (detail?.immediate === true) {
      this.contextCarrierChangedTimer = null;
      window.dispatchEvent?.(new CustomEvent("context-capsule-carrier:changed", { detail: payload }));
      return;
    }
    this.contextCarrierChangedTimer = window.setTimeout?.(() => {
      this.contextCarrierChangedTimer = null;
      window.dispatchEvent?.(new CustomEvent("context-capsule-carrier:changed", { detail: payload }));
    }, 180);
  }
  resolveNoteFile(notePath) {
    const target = text(notePath);
    if (!target) return null;
    const exact = this.app.vault.getAbstractFileByPath(target);
    if (exact instanceof TFile) return exact;
    const normalized = target.replace(/\\/g, "/").replace(/^\/+/, "");
    return this.app.vault.getMarkdownFiles().find((file) => file.path === normalized || file.path.endsWith(normalized) || file.basename.toLowerCase() === normalized.replace(/^.*\//, "").replace(/\.md$/i, "").toLowerCase()) || null;
  }
  resolveSourceFile(sourceNotePath) {
    return this.resolveNoteFile(text(sourceNotePath, this.getDefaultSourceNotePath()));
  }
  resolveDataPathForFile(sourceFile) {
    const jsonFilename = "\u96C6\u5408\u5361\u6570\u636E.json";
    return sourceFile instanceof TFile ? sourceFile.parent?.path ? `${sourceFile.parent.path}/${jsonFilename}` : jsonFilename : "";
  }
  resolveTabCapsuleKeywordsPathForFile(sourceFile) {
    return sourceFile instanceof TFile ? sourceFile.parent?.path ? `${sourceFile.parent.path}/${TAB_CAPSULE_KEYWORDS_FILENAME}` : TAB_CAPSULE_KEYWORDS_FILENAME : "";
  }
  async loadCollectionData(dataPath) {
    if (!text(dataPath)) return defaultData();
    try {
      if (!await this.app.vault.adapter.exists(dataPath)) return defaultData();
      return sanitizeData(JSON.parse(await this.app.vault.adapter.read(dataPath)));
    } catch (_) {
      return defaultData();
    }
  }
  async loadTabCapsuleKeywords(keywordsPath, sourceNotePath = "") {
    const normalizedPath = text(keywordsPath, "");
    if (!normalizedPath) return { data: defaultTabCapsuleKeywordData(), error: "" };
    try {
      const renameOwner = this.getContextRenameOwner();
      const readToken = renameOwner.token({ keywordPath: normalizedPath });
      if (!await this.app.vault.adapter.exists(normalizedPath)) return { data: defaultTabCapsuleKeywordData(), error: "" };
      const raw = await this.app.vault.adapter.read(normalizedPath);
      return {
        data: renameOwner.stamp(normalizeTabCapsuleKeywordData(JSON.parse(raw), { sourceNotePath: text(sourceNotePath, "") }), { keywordPath: normalizedPath }, readToken),
        error: ""
      };
    } catch (error) {
      console.error("[Collection Card View] Failed to load tab capsule keywords:", error);
      return {
        data: defaultTabCapsuleKeywordData(),
        error: `Tab keyword index load failed: ${error.message || error}`
      };
    }
  }
  getProjectOverviewApi() {
    return window.__projectExecutionOverviewPluginApi || this.app?.plugins?.plugins?.[PROJECT_OVERVIEW_PLUGIN_ID]?.api || null;
  }
  getContextCapsuleKeysSync() {
    const api = this.getProjectOverviewApi();
    if (typeof api?.getContextCapsuleKeysSync !== "function") return [];
    try {
      return normalizeContextCapsuleKeyList(api.getContextCapsuleKeysSync());
    } catch (error) {
      console.warn("[Collection Card View][context-capsule.snapshot-key-read-failed]", error);
      return [];
    }
  }
  getContextCapsuleKeyForKeyword(keywordLike = "", keysOnce = null) {
    const normalized = normalizeKeywordKey(keywordLike);
    const parsedKeyword = parseContextCapsuleLabel(keywordLike);
    const address = normalizeKeywordKey(parsedKeyword.address);
    const displayLabel = normalizeKeywordKey(parsedKeyword.displayLabel);
    if (!normalized) return null;
    return (keysOnce ? keysOnce() : this.getContextCapsuleKeysSync()).find((key) => {
      const displayKey = normalizeKeywordKey(key.displayLabel);
      const candidates = [key.displayLabel, key.canonicalLabel].map((candidate) => normalizeKeywordKey(candidate)).filter(Boolean);
      if (address) return displayLabel && displayKey === displayLabel;
      return candidates.includes(normalized);
    }) || null;
  }
  buildSnapshotRelationPathLabel(data, sourceNotePath, itemId) {
    const item = data.itemsById?.[text(itemId)];
    if (!item) return "";
    const tab = data.tabsById?.[text(item.tabId)];
    const parts = [
      text(sourceNotePath).replace(/^.*\//, "").replace(/\.md$/i, "") || text(sourceNotePath),
      text(tab?.name, item.tabId)
    ].filter(Boolean);
    const trail = [];
    let cursor = text(item.parentId) || null;
    const seen = /* @__PURE__ */ new Set();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const parent = data.itemsById?.[cursor];
      if (!parent) break;
      trail.unshift(text(parent.title, parent.id));
      cursor = text(parent.parentId) || null;
    }
    trail.push(text(item.title, item.id));
    return parts.concat(trail).join(" / ");
  }
  async getContextCapsuleCarrierSnapshot(options = {}) {
    const startedAt = Date.now();
    const requested = text(options?.contextKey || options?.displayLabel || "");
    const sourceFile = this.resolveSourceFile(text(options?.sourceNotePath || options?.notePath || "", this.getDefaultSourceNotePath()));
    if (!(sourceFile instanceof TFile)) {
      return { ok: false, pluginId: "collection-card-view", reason: "source-note-not-found", items: [] };
    }
    const sourceNotePath = sourceFile.path;
    const dataPath = this.resolveDataPathForFile(sourceFile);
    const keywordsPath = this.resolveTabCapsuleKeywordsPathForFile(sourceFile);
    const data = dataPath ? await this.loadCollectionData(dataPath) : defaultData();
    const keywordLoad = keywordsPath ? await this.loadTabCapsuleKeywords(keywordsPath, sourceNotePath) : { data: defaultTabCapsuleKeywordData(), error: "" };
    const assignments = normalizeTabCapsuleKeywordData(keywordLoad.data || {}, { sourceNotePath }).assignmentsByKeywordKey;
    const limit = Math.max(1, Math.min(200, Number(options?.limit || 80) || 80));
    const assignmentsByTabId = {};
    Object.values(assignments || {}).forEach((entry) => {
      const tabId = text(entry?.tabId);
      if (!tabId) return;
      if (!assignmentsByTabId[tabId]) assignmentsByTabId[tabId] = [];
      assignmentsByTabId[tabId].push(entry);
    });
    // r36 C1: one key list per call (read on first use) and one resolution per raw assignment keyword.
    let keysForCall = null;
    const keysOnce = () => keysForCall || (keysForCall = this.getContextCapsuleKeysSync());
    const resolvedByKeyword = new Map();
    const resolvedKeyFor = (keyword) => {
      if (resolvedByKeyword.has(keyword)) return resolvedByKeyword.get(keyword);
      const matched = this.getContextCapsuleKeyForKeyword(keyword, keysOnce);
      const resolved = normalizeKeywordKey(normalizeContextCapsuleDisplayLabel(matched?.displayLabel || keyword));
      resolvedByKeyword.set(keyword, resolved);
      return resolved;
    };
    const buildOneSnapshot = (target = "") => {
      const targetStartedAt = Date.now();
      const requestedKey = normalizeKeywordKey(normalizeContextCapsuleDisplayLabel(target));
      const matchedTabs = Object.values(data.tabsById || {}).filter((tab) => (assignmentsByTabId[text(tab?.id)] || []).some((entry) => resolvedKeyFor(entry.keyword) === requestedKey));
      const allItemIds = [];
      const seen = /* @__PURE__ */ new Set();
      const pushItem = (itemId, tab, depth = 0, orderPath = []) => {
        const item = data.itemsById?.[text(itemId)];
        if (!item || seen.has(item.id) || text(item.tabId) !== text(tab.id)) return;
        seen.add(item.id);
        allItemIds.push({ itemId: item.id, tab, depth, order: allItemIds.length, orderPath });
        (data.childrenByParentByTab?.[tabParentKey(tab.id, item.id)] || []).forEach((childId, childIndex) => {
          pushItem(childId, tab, depth + 1, orderPath.concat(childIndex));
        });
      };
      matchedTabs.forEach((tab, tabIndex) => {
        (data.childrenByParentByTab?.[tabParentKey(tab.id, null)] || []).forEach((itemId, itemIndex) => {
          pushItem(itemId, tab, 0, [tabIndex, itemIndex]);
        });
      });
      const items = [];
      allItemIds.slice(0, limit).forEach((entry) => {
        const item = data.itemsById?.[text(entry.itemId)];
        const tab = entry.tab;
        if (!item || !tab) return;
        const nodeKey = buildCollectionJumpNodeKey(sourceNotePath, item.tabId, item.id);
        const pathLabel = this.buildSnapshotRelationPathLabel(data, sourceNotePath, item.id);
        if (nodeKey) {
          items.push({
            nodeKey,
            label: text(item.title, item.id),
            pathLabel,
            notePath: sourceNotePath,
            viewType: VIEW_TYPE,
            viewLabel: sourceFile.basename || "Collection Card View",
            searchText: [
              text(item.title, item.id),
              text(item.comment, ""),
              text(item.noteBinding?.path, ""),
              text(tab?.name, tab.id),
              pathLabel
            ].filter(Boolean).join(" "),
            metaFields: [
              { label: "Tab", value: text(tab?.name, tab.id) },
              { label: "Note", value: sourceNotePath }
            ],
            depth: entry.depth,
            sourcePlugin: "collection-card-view",
            carrierId: tab.id,
            carrierLabel: text(tab?.name, tab.id),
            contextKey: target,
            order: entry.order,
            orderPath: entry.orderPath
          });
        }
      });
      const totalCount = allItemIds.length;
      const truncated = totalCount > items.length || items.length >= limit;
      return {
        ok: true,
        pluginId: "collection-card-view",
        source: "collection-card-view",
        contextKey: target,
        matchedCarrierCount: matchedTabs.length,
        totalCount,
        returnedCount: items.length,
        count: items.length,
        limit,
        hasMore: truncated,
        cursor: truncated ? String(items.length) : "",
        revision: text(data.lastModified || data.updatedAt || data.version || dataPath || ""),
        timingMs: Date.now() - targetStartedAt,
        items,
        truncated,
        indexVersion: "context-carrier-index-v1",
        fromIndex: true
      };
    };
    const requestedTargets = Array.isArray(options?.contextKeys) ? options.contextKeys.map((entry) => text(entry, "")).filter(Boolean) : [];
    if (requestedTargets.length > 0) {
      const targets = {};
      let totalCount = 0;
      let returnedCount = 0;
      let hasMore = false;
      let matchedCarrierCount = 0;
      requestedTargets.forEach((target) => {
        const snapshot = buildOneSnapshot(target);
        const key = normalizeKeywordKey(normalizeContextCapsuleDisplayLabel(target));
        targets[key] = snapshot;
        totalCount += Number(snapshot.totalCount || 0);
        returnedCount += Number(snapshot.returnedCount || snapshot.items?.length || 0);
        matchedCarrierCount += Number(snapshot.matchedCarrierCount || 0);
        if (snapshot.hasMore || snapshot.truncated) hasMore = true;
      });
      return {
        ok: true,
        pluginId: "collection-card-view",
        source: "collection-card-view",
        contextKey: "",
        sourceNotePath,
        matchedCarrierCount,
        totalCount,
        returnedCount,
        count: returnedCount,
        limit,
        hasMore,
        cursor: "",
        revision: text(data.lastModified || data.updatedAt || data.version || dataPath || ""),
        timingMs: Date.now() - startedAt,
        items: [],
        truncated: hasMore,
        targets,
        indexVersion: "context-carrier-index-v1",
        fromIndex: true
      };
    }
    return buildOneSnapshot(requested);
  }
  async saveTabCapsuleKeywords(keywordsPath, data, sourceNotePath = "") {
    const file = this.app.vault.getAbstractFileByPath(sourceNotePath);
    const dataPath = this.resolveDataPathForFile(file);
    if (!dataPath) throw new Error("collection-keyword-source-unresolved");
    return actionEntry.enqueue(this, dataPath, () => this.saveTabCapsuleKeywordsQueued(keywordsPath, data, sourceNotePath));
  }
  async saveTabCapsuleKeywordsQueued(keywordsPath, data, sourceNotePath = "") {
    const owner = this.getContextRenameOwner(); owner.assertLive();
    await owner.assertFreshSave({ sourceNotePath, dataPath: this.resolveDataPathForFile(this.app.vault.getAbstractFileByPath(sourceNotePath)), keywordPath: keywordsPath }, data);
    const normalizedPath = text(keywordsPath, "");
    if (!normalizedPath) throw new Error("Tab keyword index path is not resolved.");
    const safe = normalizeTabCapsuleKeywordData(data, { sourceNotePath: text(sourceNotePath, "") });
    const payload = JSON.stringify(safe, null, 2);
    await this.getCenterNamingConsumerV1().publish(normalizedPath, raw => {
      if (raw !== null) this.assertManagedCreationReceiptsV1(JSON.parse(raw), safe);
      return payload;
    }, sourceNotePath);
    this.dispatchContextCarrierChanged("collection-tab-capsule-keywords-saved", {
      revision: text(safe.updatedAt || safe.lastModified || nowString()),
      sourceNotePath: text(sourceNotePath, "")
    });
    return safe;
  }
  async saveCollectionData(dataPath, data, sourceNotePath = "") {
    const safe = sanitizeData(data);
    safe.lastModified = text(safe.lastModified || safe.updatedAt || nowString());
    const payload = JSON.stringify(safe, null, 2);
    await this.getCenterNamingConsumerV1().publish(dataPath, raw => {
      if (raw !== null) this.assertManagedCreationReceiptsV1(JSON.parse(raw), safe);
      return payload;
    }, sourceNotePath);
    this.dispatchContextCarrierChanged("collection-data-saved", {
      revision: text(safe.lastModified || safe.updatedAt || dataPath || ""),
      sourceNotePath: text(sourceNotePath || safe.sourceNotePath || "", "")
    });
  }
  findLeavesBySourceNotePath(sourceNotePath) {
    const target = text(sourceNotePath);
    if (!target) return [];
    return this.app.workspace.getLeavesOfType(VIEW_TYPE).filter((leaf) => {
      const viewPath = text(leaf?.view?.sourceFile?.path || leaf?.view?.sourceNotePath);
      const statePath = text(leaf.getViewState?.()?.state?.sourceNotePath);
      return viewPath ? viewPath === target : statePath === target;
    });
  }
  findLeafBySourceNotePath(sourceNotePath) {
    return this.findLeavesBySourceNotePath(sourceNotePath)[0] || null;
  }
  getView(sourceNotePath = "") {
    if (text(sourceNotePath)) return this.findLeafBySourceNotePath(sourceNotePath)?.view || null;
    return this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]?.view || null;
  }
  async waitForView(sourceNotePath = "", options = {}) {
    const target = text(sourceNotePath, "");
    const delays = Array.isArray(options?.delays) ? options.delays : [0, 40, 120, 260, 520, 900, 1500, 2600];
    for (const delay of delays) {
      if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
      const view = this.getView(target);
      if (view instanceof CollectionCardView) return view;
    }
    return null;
  }
  resolveBridgeHost(sourceNotePath = "") {
    const target = text(sourceNotePath, this.getDefaultSourceNotePath());
    const exactHosts = this.findLeavesBySourceNotePath(target).map((leaf) => ({ leaf, view: leaf?.view })).filter((entry) => entry.view instanceof CollectionCardView);
    const candidates = exactHosts.filter((entry) => entry.view.isReady());
    const activeLeaf = this.app.workspace.activeLeaf || null;
    const activeCandidates = activeLeaf ? candidates.filter((entry) => entry.leaf === activeLeaf) : [];
    if (activeCandidates.length === 1) return { status: "resolved", target, ...activeCandidates[0], candidates, exactHosts };
    if (candidates.length === 1) return { status: "resolved", target, ...candidates[0], candidates, exactHosts };
    const status = candidates.length > 1 || exactHosts.length > 1 ? "ambiguous" : exactHosts.length === 1 ? "not-ready" : "missing";
    return { status, target, leaf: null, view: null, candidates, exactHosts };
  }
  getBridge(sourceNotePath = "") {
    const resolved = this.resolveBridgeHost(sourceNotePath);
    return resolved.status === "resolved" ? resolved.view.bridge : null;
  }
  async ensureBridge(sourceNotePath = "") {
    const target = text(sourceNotePath, this.getDefaultSourceNotePath());
    const before = this.resolveBridgeHost(target);
    if (before.status === "resolved") return before.view.bridge;
    if (before.status !== "missing") return null;
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true, state: { sourceNotePath: target } });
    await this.app.workspace.revealLeaf(leaf);
    const view = leaf?.view;
    if (!(view instanceof CollectionCardView) || !view.isReady()) return null;
    const viewPath = text(view.sourceFile?.path || view.sourceNotePath);
    return viewPath === target ? view.bridge : null;
  }
  async activateView(sourceNotePath = "") {
    const sourceFile = this.resolveSourceFile(text(sourceNotePath, this.getDefaultSourceNotePath()));
    const resolvedPath = sourceFile?.path || text(sourceNotePath, this.getDefaultSourceNotePath());
    let leaf = this.findLeafBySourceNotePath(resolvedPath);
    if (!leaf) leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true, state: { sourceNotePath: resolvedPath } });
    await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }
  async openItem(sourceNotePath = "", tabId = "", itemId = "", options = {}) {
    const target = text(sourceNotePath, this.getDefaultSourceNotePath());
    const traceId = text(options?.evaTraceId, "");
    logCollectionJump(traceId, "open-item.start", { target, tabId, itemId });
    await this.activateView(target);
    const attempts = [
      { delays: [0, 40, 120, 260, 520, 900, 1500], forceReload: false },
      { delays: [0, 80, 220, 520, 1e3, 1800, 3200], forceReload: true }
    ];
    for (const attempt of attempts) {
      logCollectionJump(traceId, "open-item.attempt", attempt);
      const view = await this.waitForView(target, { delays: attempt.delays });
      if (!(view instanceof CollectionCardView)) {
        logCollectionJump(traceId, "open-item.no-view", { target, delays: attempt.delays });
        continue;
      }
      if (attempt.forceReload === true || !view.isReady()) {
        await view.setState({ sourceNotePath: target });
        logCollectionJump(traceId, "open-item.reload", { forceReload: attempt.forceReload === true, readyAfterReload: view.isReady() });
      }
      const revealed = await view.revealItemInTab(tabId, itemId, options);
      logCollectionJump(traceId, "open-item.reveal", { revealed, tabId, itemId });
      if (revealed === true) return true;
    }
    logCollectionJump(traceId, "open-item.fail", { target, tabId, itemId });
    return false;
  }
  async openHistoryNodeV1(nodeKey) {
    const parsed = parseCollectionJumpNodeKey(nodeKey);
    if (!parsed || parsed.nodeKey !== nodeKey || !parsed.notePath || !parsed.scopeId || !parsed.itemId) return false;
    const serial = this.historyOpenSerial = (this.historyOpenSerial || 0) + 1;
    if (!this.app.vault.getAbstractFileByPath(parsed.notePath)?.extension) return false;
    const lease = this.globalApi;
    await this.activateView(parsed.notePath);
    const view = await this.waitForView(parsed.notePath);
    if (lease !== window.__collectionCardViewPluginApi || lease !== this.globalApi || serial !== this.historyOpenSerial || !view?.contentEl?.isConnected || view.sourceNotePath !== parsed.notePath || typeof view.openContextHistory !== "function") return false;
    const isLive = () => lease === window.__collectionCardViewPluginApi && lease === this.globalApi && serial === this.historyOpenSerial && view?.contentEl?.isConnected && !view.contextHistoryViewClosed && view.sourceNotePath === parsed.notePath;
    return (await view.openContextHistory(parsed.scopeId, parsed.itemId, isLive)) === true && isLive();
  }
  async openNode(nodeKey, context = {}) {
    const traceId = text(context?.evaTraceId, "");
    const parsed = parseCollectionJumpNodeKey(nodeKey);
    logCollectionJump(traceId, "open-node.start", {
      nodeKey,
      notePath: text(context?.notePath, ""),
      parsed
    });
    if (!parsed) return false;
    return await this.openItem(text(context?.notePath, parsed.notePath), parsed.scopeId, parsed.itemId, { source: "relation-opener", evaTraceId: traceId });
  }
  registerJumpOpener() {
    this.jumpOpenerId = `collection-card::${this.manifest.id}`;
    ensureJumpOpenerRegistry().register({
      openerId: this.jumpOpenerId,
      viewType: VIEW_TYPE,
      openHistoryNodeV1: async nodeKey => await this.openHistoryNodeV1(nodeKey),
      openNode: async (nodeKey, context = {}) => await this.openNode(nodeKey, context)
    });
  }
  unregisterJumpOpener() {
    if (!this.jumpOpenerId) return;
    ensureJumpOpenerRegistry().unregister(this.jumpOpenerId);
  }
};
