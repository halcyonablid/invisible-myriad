"use strict";
const {Plugin,ItemView,Notice}=require("obsidian");
const directoryModule=(()=>{const module={exports:{}};
"use strict";
// Read-only consumer. No vault adapter, registry writer, or business state persistence.
const DOMAINS = ["project", "goal", "tracking", "goalTracking"];
const METHODS = {project:"listEffectiveOperationalContextKeys",goal:"listEffectiveGoalOperationalContextKeys",tracking:"listProjectTrackingDirectoryV1",goalTracking:"listGoalTrackingDirectoryV1"};
const TYPES = {project:"mandala-effective-operational-context-keys-v1",goal:"mandala-effective-goal-operational-context-keys-v1"};
function required(x) { return typeof x === "string" && x.trim().length > 0 && x.length <= 8192; }
function reject() { throw Error("invalid-snapshot"); }
function ownerScope(key, domain) {
  if (!required(key) || !key.startsWith("jump:v1:")) reject();
  const encoded = key.slice(8).split("|");
  if (encoded.length !== 5) reject();
  const p = encoded.map(decodeURIComponent);
  if (p.some(x => !required(x)) || encoded.some((s,i)=>encodeURIComponent(p[i])!==s)) reject();
  if (domain === "project" ? p[0] !== "workspace-mount-view" || p[2] !== "tab" :
      p[0] !== "mandala-time-blocks" || p[2] !== "node" || p[3] !== "mandala") reject();
  return p[1];
}
function validateTracking(s, domain="project") {
  const partial = s?.partial === true;
  if (partial) {
    if (s.complete !== false || s.partialContract !== "tracking-directory-isolation-v1" ||
        !Number.isSafeInteger(s.excludedCount) || s.excludedCount < 1 || s.excludedCount > 15000 ||
        !Array.isArray(s.diagnostics) || s.diagnostics.length !== s.excludedCount) reject();
    const buckets = domain === "goal" ? ["nodeStatesByKey","goalPlanRowsByKey"] : ["workspaceNodeStatesByKey","projectPlanRowsByKey"];
    for (const d of s.diagnostics) if (!d || !buckets.includes(d.bucket) ||
      !["invalid-source","invalid-identity","wrong-domain","invalid-status","invalid-label","identity-conflict","related-record-conflict"].includes(d.reason)) reject();
  } else if (s?.complete !== true || (s.excludedCount !== undefined && s.excludedCount !== 0) || (s.diagnostics !== undefined && (!Array.isArray(s.diagnostics) || s.diagnostics.length))) reject();
  if (!s || s.contractVersion!==1 || s.snapshotType!==`mandala-${domain}-tracking-directory-v1` ||
      s.coveredScope!==`current-source-${domain}-tracking-states` || s.ok!==true || (!partial && s.complete!==true) ||
      s.truncated!==false || s.hasMore!==false || !required(s.sourceScope) || !required(s.providerGeneration) ||
      !required(s.revision) || !Array.isArray(s.items) || s.limit!==5000 || s.items.length>s.limit ||
      [s.count,s.returnedCount,s.totalCount].some(n=>!Number.isSafeInteger(n)||n!==s.items.length)) reject();
  const seen=new Set();
  return s.items.map(t=>{
    if(!t || t.domain!==domain || t.sourceNotePath!==s.sourceScope || !["active","stopped"].includes(t.tracking?.status))reject();
    const ownerSourceScope=ownerScope(t.nodeKey,domain),identity=JSON.stringify([domain,s.sourceScope,t.nodeKey]);
    if(domain==="goal"&&ownerSourceScope!==s.sourceScope)reject();
    if(seen.has(identity))reject();seen.add(identity);
    const label=required(t.lastKnownLabel)&&t.lastKnownLabel!==t.nodeKey&&!/^(item_|tab_ws_|jump:v1:)/.test(t.lastKnownLabel)?t.lastKnownLabel:"名称不可用";
    return Object.freeze({identity,domain,label,providerScope:s.sourceScope,ownerSourceScope,nodeKey:t.nodeKey,trackingStatus:t.tracking.status});
  });
}
function validate(snapshot, domain) {
  if(domain==="tracking"||domain==="goalTracking")return validateTracking(snapshot,domain==="goalTracking"?"goal":"project");
  if (!snapshot || snapshot.ok !== true || snapshot.complete !== true || snapshot.contractVersion !== 1 ||
      snapshot.snapshotType !== TYPES[domain] || snapshot.hasMore !== false || snapshot.truncated !== false ||
      !required(snapshot.sourceScope) || !required(snapshot.providerGeneration) || !required(snapshot.revision) ||
      !Array.isArray(snapshot.targets) || snapshot.targets.length > 5000 ||
      snapshot.count !== snapshot.targets.length || snapshot.returnedCount !== snapshot.targets.length ||
      !Number.isSafeInteger(snapshot.totalCount) || snapshot.totalCount < snapshot.targets.length) reject();
  const seen = new Set();
  return snapshot.targets.map(t => {
    if (!t || t.domain !== domain || t.sourceType !== domain || t.sourcePlugin !== "mandala-time-blocks" ||
        t.identityVersion !== 1 || t.sourceScope !== snapshot.sourceScope || t.active !== true || t.lifecycleState !== "active") reject();
    const ownerSourceScope = ownerScope(t.sourceKey,domain), identity = JSON.stringify([domain,t.sourceScope,t.sourceKey]);
    if (seen.has(identity)) reject(); seen.add(identity);
    const label = required(t.label) && t.label !== t.sourceKey && !/^(item_|tab_ws_|jump:v1:)/.test(t.label) ? t.label : "名称不可用";
    return Object.freeze({identity,domain,label,providerScope:t.sourceScope,ownerSourceScope,nodeKey:t.sourceKey});
  });
}
class Directory {
  constructor(getApi,{timeoutMs=10000}={}) {
    this.getApi=getApi;this.timeoutMs=timeoutMs;this.busy=false;this.closed=false;this.listeners=new Set();this.timers=new Set();
    this.state=Object.fromEntries(DOMAINS.map(d=>[d,{status:"idle",rows:[]}]));this.tracing=false;this.samples=[];this.sequence=0;
  }
  subscribe(fn) { this.listeners.add(fn); return ()=>this.listeners.delete(fn); }
  emit() { if(!this.closed) for(const fn of this.listeners) {try{fn();}catch{ /* one view must not strand shared work */ }} }
  diagnostics(enabled) { this.tracing=enabled===true;this.samples=[]; }
  refresh() {
    if(this.closed) return Promise.resolve();
    if(this.busy) return this.flight;
    this.busy=true;const api=this.getApi(),sequence=++this.sequence,started=Date.now(),sample=this.tracing;
    for(const d of DOMAINS)this.state[d]={status:"loading",rows:[]};
    // Defer provider work to install the shared flight before notifying views.
    this.flight=Promise.resolve().then(()=>Promise.all(DOMAINS.map(async domain=>{
      if(this.closed)return;
      if(typeof api?.[METHODS[domain]]!=="function") {this.state[domain]={status:"missing",rows:[]};this.emit();return;}
      let timedOut=false;
      const timer=setTimeout(()=>{this.timers.delete(timer);timedOut=true;if(!this.closed){this.state[domain]={status:"timeout",rows:[]};this.emit();}},this.timeoutMs);
      this.timers.add(timer);
      try {
        const snapshot=await api[METHODS[domain]]({source:"context-key-manager"});
        if(this.closed||timedOut)return;
        if(this.getApi()!==api) {this.state[domain]={status:"changed",rows:[]};return;}
        const rows=validate(snapshot,domain);
        this.state[domain]={status:"ready",rows,api,revision:snapshot.revision,generation:snapshot.providerGeneration,partial:snapshot.partial===true,excludedCount:snapshot.excludedCount||0,diagnostics:snapshot.diagnostics||[]};
      } catch (error) {if(!this.closed&&!timedOut)this.state[domain]={status:"unavailable",rows:[],error:String(error?.code||error?.message||"query-failed").slice(0,160)};}
      finally {clearTimeout(timer);this.timers.delete(timer);this.emit();}
    }))).finally(()=>{
      this.busy=false;
      if(sample&&this.tracing&&!this.closed){this.samples.push({sequence,ms:Date.now()-started,domains:DOMAINS.map(d=>({domain:d,status:this.state[d].status,count:this.state[d].rows.length}))});if(this.samples.length>20)this.samples.shift();}
      this.emit();
    });
    this.emit();return this.flight;
  }
  dispose(){this.closed=true;for(const t of this.timers)clearTimeout(t);this.timers.clear();this.listeners.clear();this.samples=[];}
}
module.exports={Directory,validate,ownerScope};

return module.exports;})();
const {Directory}=directoryModule;
const {Management}=(()=>{const module={exports:{}};
"use strict";
const {ownerScope}=directoryModule;
const MANAGEMENT_CAPABILITIES=Object.freeze({
  project:Object.freeze({inspect:"getProjectContextManagementSnapshotV1",open:"openProjectContextManagerV1",label:"项目"}),
  goal:Object.freeze({inspect:"getGoalContextManagementSnapshotV1",open:"openGoalContextManagerV1",label:"目标"})
});
function managementCapabilities(domain){return Object.hasOwn(MANAGEMENT_CAPABILITIES,domain)?MANAGEMENT_CAPABILITIES[domain]:null;}
function managementRef(row){
  if(!row||!managementCapabilities(row.domain)||typeof row.providerScope!=="string"||!row.providerScope.trim()||row.providerScope.length>8192)throw Error("invalid-management-ref");
  const source=ownerScope(row.nodeKey,row.domain);
  if(source!==row.ownerSourceScope||(row.domain==="goal"&&source!==row.providerScope))throw Error("management-source-mismatch");
  return Object.freeze({identity:JSON.stringify([row.domain,row.providerScope,row.nodeKey]),domain:row.domain,nodeKey:row.nodeKey,providerScope:row.providerScope,ownerSourceScope:source,label:typeof row.label==="string"?row.label:"名称不可用"});
}
// Delegates UI only. The original owner modal owns all confirmations and writes.
class Management {
  constructor(directory,{timeoutMs=10000}={}){this.directory=directory;this.timeoutMs=timeoutMs;this.closed=false;this.job=null;this.recent=[];this.listeners=new Set();this.refreshQueued=false;}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  emit(){if(!this.closed)for(const fn of this.listeners){try{fn();}catch{}}}
  message(value){this.status=value;this.emit();}
  available(row,api){
    try{const saved=managementRef(row),cap=managementCapabilities(saved.domain);return !this.closed&&api===this.directory.getApi()&&typeof api?.[cap.inspect]==="function"&&typeof api?.[cap.open]==="function";}catch{return false;}
  }
  async open(row,api,live=()=>true){
    if(this.closed||this.job)return false;
    let saved,cap;
    try{saved=managementRef(row);cap=managementCapabilities(saved.domain);}catch{this.message("管理来源或对象身份无效，请刷新目录。");return false;}
    if(api!==this.directory.getApi()||!this.available(saved,api)){this.message(`${cap.label}管理服务尚未就绪，请刷新目录或重载对应插件。`);return false;}
    const ref=Object.freeze({nodeKey:saved.nodeKey,sourceNotePath:saved.providerScope});
    saved=Object.freeze({...saved,api});
    const inspect=api[cap.inspect],open=api[cap.open];
    const job={api,phase:"inspect",expired:false};this.job=job;this.message(`正在核验${cap.label}管理来源…`);
    job.timer=setTimeout(()=>{job.expired=true;if(this.job===job)this.message("管理核验超时；原请求结束前不重复发送。");},this.timeoutMs);
    const finish=()=>{clearTimeout(job.timer);if(this.job===job){this.job=null;this.emit();}};
    let notified=false,openedOkay=false;
    const onClosed=changed=>{
      if(notified)return;notified=true;
      if(this.closed||this.job!==job)return;
      finish();this.message("管理面板已关闭。");
      if(changed===true&&this.directory.getApi()===api)this.requestRefresh(api);
    };
    try{
      const s=await inspect.call(api,{...ref});
      clearTimeout(job.timer);
      if(this.closed||job.expired||!live()||this.job!==job||this.directory.getApi()!==api||api[cap.inspect]!==inspect||api[cap.open]!==open){if(!this.closed&&!job.expired)this.message("来源或页面已变化，请重新打开。");return false;}
      if(s?.contractVersion!==1||s.nodeKey!==ref.nodeKey||s.sourceNotePath!==ref.sourceNotePath||typeof s.providerGeneration!=="string"||!s.providerGeneration||typeof s.revision!=="string"||!s.revision||!["active","stopped"].includes(s.tracking?.status)||!["eligible","ineligible","unavailable"].includes(s.eligibility?.status)||!Array.isArray(s.eligibility.reasons)||!s.eligibility.reasons.every(reason=>typeof reason==="string"))throw Error("invalid-management-snapshot");
      job.phase="open";
      const opened=open.call(api,{...ref},{onClosed});
      if(opened!==true)throw Error("owner-open-not-confirmed");
      openedOkay=true;
      if(!this.closed){this.recent=[saved,...this.recent.filter(r=>r.identity!==saved.identity)].slice(0,50);if(!notified)this.message("请在原管理面板中操作；这里不会直接修改业务数据。");else this.emit();}
      return true;
    }catch(error){if(!this.closed)this.message("无法打开管理面板（"+String(error?.code||error?.message||"未知原因").slice(0,120)+"），请核对来源或重新刷新。");return false;}
    finally{if(!openedOkay||notified)finish();}
  }
  requestRefresh(api){
    if(this.refreshQueued||this.closed)return;this.refreshQueued=true;
    const pending=this.directory.busy?this.directory.flight:Promise.resolve();
    Promise.resolve(pending).catch(()=>{}).then(()=>{
      this.refreshQueued=false;
      if(this.closed||this.directory.closed||this.directory.getApi()!==api)return;
      if(this.directory.busy){this.requestRefresh(api);return;}
      void this.directory.refresh();
    });
  }
  dispose(){this.closed=true;if(this.job)clearTimeout(this.job.timer);this.job=null;this.listeners.clear();this.recent=[];}
}
module.exports={Management,managementCapabilities,managementRef};

return module.exports;})();
const TYPE="context-key-manager-view";
const labels={project:"项目",goal:"目标",tracking:"项目追踪记录",goalTracking:"目标追踪记录"};
const statuses={idle:"尚未查询",loading:"正在查询",ready:"当前有效项",missing:"服务未加载或版本不支持",unavailable:"数据不完整或核验失败",changed:"服务已更换，请刷新",timeout:"查询超时"};
function el(parent,tag,text,cls){const e=parent.ownerDocument.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent.appendChild(e);return e;}
class ContextView extends ItemView {
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.page=0;this.filter='';this.mode='effective';this.domain='all';}
 getViewType(){return TYPE;}getDisplayText(){return '主键管理中心';}getIcon(){return 'key-round';}
 button(parent,text,fn,cls){const b=el(parent,'button',text,cls);b.type='button';b.onclick=fn;return b;}
 async onOpen(){
  this.live=true;this.epoch=(this.epoch||0)+1;const c=this.contentEl;c.replaceChildren();c.classList.add('ckm-host');
  const heading=el(c,'header',undefined,'ckm-heading');const intro=el(heading,'div');el(intro,'div','项目与目标','ckm-eyebrow');el(intro,'h2','主键管理中心');el(intro,'p','管理当前追踪的主键，保留原有内容与历史。','ckm-note');
  const primary=el(heading,'div',undefined,'ckm-inline-actions');this.plugin.identityHost.button(primary);
  const create=el(c,'div',undefined,'ckm-createbar');el(create,'span','创建','ckm-section-label');
  for(const [label,options] of [['新增项目',{domain:'project'}],['新增九宫格目标',{domain:'goal'}],['未完成的创建',{pending:true}]])this.button(create,label,()=>{const api=window.__projectExecutionOverviewPluginApi;if(typeof api?.openManagedContextCreationV1!=='function'){new Notice('主键创建服务未加载，请重载项目执行总览插件');return;}api.openManagedContextCreationV1(options);});
  const filters=el(c,'div',undefined,'ckm-filterbar');const tabs=el(filters,'div',undefined,'ckm-domain-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','主键类型');this.domainButtons=[];
  for(const [domain,text] of [['all','全部'],['project','项目'],['goal','目标']]){const b=this.button(tabs,text,()=>{this.domain=domain;if(this.mode!=='effective'){this.mode=domain==='goal'?'goalTracking':'tracking';this.modeSelect.value=this.mode;}this.page=0;this.render();});b.dataset.domain=domain;this.domainButtons.push(b);}
  this.modeSelect=el(filters,'select');this.modeSelect.setAttribute('aria-label','目录范围');for(const [value,text] of [['effective','当前有效项'],['tracking','项目追踪记录（含已停止）'],['goalTracking','目标追踪记录（含已停止）']]){const o=el(this.modeSelect,'option',text);o.value=value;}this.modeSelect.value=this.mode;this.modeSelect.onchange=()=>{this.mode=this.modeSelect.value;this.domain=this.mode==='tracking'?'project':this.mode==='goalTracking'?'goal':'all';this.page=0;this.render();};
  this.search=el(filters,'input');this.search.type='search';this.search.placeholder='搜索主键名称或来源';this.search.setAttribute('aria-label','搜索主键名称或来源');this.search.oninput=()=>{this.filter=this.search.value;this.page=0;this.render();};
  this.refreshButton=this.button(filters,'刷新',()=>{void this.plugin.directory.refresh();});
  this.status=el(c,'div','', 'ckm-directory-status');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
  this.warnings=el(c,'div',undefined,'ckm-warnings');this.managementStatus=el(c,'div','', 'ckm-feedback');this.managementStatus.setAttribute('role','status');
  this.list=el(c,'div',undefined,'ckm-directory-list');
  const pages=el(c,'nav',undefined,'ckm-pagination');pages.setAttribute('aria-label','主键列表分页');this.pageLabel=el(pages,'span');const pagination=el(pages,'div',undefined,'ckm-inline-actions');this.prev=this.button(pagination,'上一页',()=>{this.page--;this.render();});this.next=this.button(pagination,'下一页',()=>{this.page++;this.render();});
  const recent=el(c,'details',undefined,'ckm-recent-panel');el(recent,'summary','本次会话管理过的主键');el(recent,'p','用于重开刚管理过的对象；插件重载后清空。完整历史请查看追踪记录和周追踪。','ckm-note');this.recentList=el(recent,'div');
  const diagnostic=el(c,'details',undefined,'ckm-diagnostic-panel');el(diagnostic,'summary','诊断与目录说明');el(diagnostic,'p','追踪记录仅覆盖当前来源的持久索引，名称为上次记录；管理时会重新核验资格。','ckm-note');const tools=el(diagnostic,'div',undefined,'ckm-inline-actions');this.diagnostic=this.button(tools,'开启诊断',()=>{const d=this.plugin.directory;d.diagnostics(!d.tracing);this.summary.textContent='';this.diagnostic.textContent=d.tracing?'关闭诊断':'开启诊断';});this.button(tools,'查看诊断摘要',()=>{this.summary.textContent=JSON.stringify(this.plugin.directory.samples,null,2);});this.summary=el(diagnostic,'pre','', 'ckm-diagnostics');
  this.unsubscribe=this.plugin.directory.subscribe(()=>this.render());this.unsubscribeManagement=this.plugin.management.subscribe(()=>this.render());this.render();if(!this.plugin.directory.busy)void this.plugin.directory.refresh();
 }
 render(){
  if(!this.live)return;const d=this.plugin.directory,scroll=this.contentEl.scrollTop,active=this.contentEl.ownerDocument.activeElement,activeRow=active?.closest('.ckm-row'),focused=activeRow?{identity:activeRow.dataset.identity,text:active.textContent}:null;
  const expanded=new Set([...this.list.querySelectorAll('.ckm-row')].filter(r=>r.querySelector('details')?.open).map(r=>r.dataset.identity));
  this.refreshButton.disabled=d.busy;this.refreshButton.textContent=d.busy?'刷新中…':'刷新';
  for(const b of this.domainButtons){const active=b.dataset.domain===this.domain;b.setAttribute('aria-pressed',String(active));b.classList.toggle('is-active',active);}
  const ranges=['tracking','goalTracking'].includes(this.mode)?(this.domain==='all'?['tracking','goalTracking']:[this.mode]):['project','goal'];
  this.status.replaceChildren();for(const key of ranges){const s=d.state[key],badge=el(this.status,'span',undefined,'ckm-status-item');el(badge,'span',labels[key]);el(badge,'strong',s.status==='ready'?String(s.rows.length):'—');el(badge,'span',s.status==='ready'?(s.partial?'部分可核验':'已更新'):statuses[s.status],'ckm-note');}
  const rows=ranges.flatMap(key=>d.state[key].rows).filter(r=>(this.domain==='all'||r.domain===this.domain)&&[r.label,r.providerScope,r.ownerSourceScope].some(v=>v.toLocaleLowerCase().includes(this.filter.toLocaleLowerCase())));
  this.warnings.replaceChildren();for(const key of ranges){const s=d.state[key];if(s.partial)el(this.warnings,'p',`${labels[key]}中 ${s.excludedCount} 条异常记录已隔离，原数据保留；当前展示可核验部分。`,'ckm-callout');else if(s.error)el(this.warnings,'p',`${labels[key]}查询未完成，请刷新或查看诊断。`,'ckm-callout');}
  const pages=Math.max(1,Math.ceil(rows.length/100));this.page=Math.max(0,Math.min(this.page,pages-1));this.list.replaceChildren();
  if(!rows.length){const empty=el(this.list,'div',undefined,'ckm-empty');el(empty,'h3',ranges.every(k=>d.state[k].status==='ready')?'没有符合条件的主键':'目录尚未就绪');el(empty,'p',ranges.every(k=>d.state[k].status==='ready')?'换一个筛选条件，或创建新的项目与目标。':'请查看上方状态，待相关插件加载后刷新。');}
  for(const row of rows.slice(this.page*100,(this.page+1)*100)){
   const card=el(this.list,'article',undefined,'ckm-row');card.dataset.identity=row.identity;const main=el(card,'div',undefined,'ckm-row-main');const title=el(main,'div',undefined,'ckm-row-title');el(title,'span',labels[row.domain],'ckm-domain');el(title,'strong',row.label);
   el(main,'span',row.trackingStatus==='stopped'?'已停止追踪':row.trackingStatus?'追踪中 · 资格待核验':'当前有效','ckm-badge');
   const details=el(main,'details',undefined,'ckm-sources');details.open=expanded.has(row.identity);el(details,'summary','来源与定位');el(details,'p',`对象来源：${row.ownerSourceScope}`);el(details,'p',`追踪来源：${row.providerScope}`);el(details,'code',row.nodeKey);
   const actions=el(card,'div',undefined,'ckm-row-actions');this.managementButton(actions,row,['tracking','goalTracking'].includes(this.mode)?d.state[row.domain==='goal'?'goalTracking':'tracking'].api:d.state[row.domain].api);this.plugin.identityHost.button(actions,row);
  }
  this.prev.disabled=this.page===0;this.next.disabled=this.page>=pages-1;this.pageLabel.textContent=`${rows.length} 项 · 第 ${this.page+1} / ${pages} 页`;this.managementStatus.textContent=this.plugin.management.status||'';
  this.recentList.replaceChildren();for(const row of this.plugin.management.recent){const r=el(this.recentList,'div',undefined,'ckm-registry-row');el(r,'span',`${labels[row.domain]} · ${row.label}`);this.managementButton(r,row,row.api);}
  this.contentEl.scrollTop=scroll;
  if(focused){const row=[...this.list.querySelectorAll('.ckm-row')].find(r=>r.dataset.identity===focused.identity),button=[...(row?.querySelectorAll('button,summary')||[])].find(e=>e.textContent===focused.text);button?.focus({preventScroll:true});}
 }
 managementButton(parent,row,api){const available=this.plugin.management.available(row,api),b=this.button(parent,'管理追踪',()=>{const epoch=this.epoch;void this.plugin.management.open(row,api,()=>this.live&&this.epoch===epoch&&!this.plugin.closed);});b.disabled=!!this.plugin.management.job||!available;if(!available)b.title='管理服务未就绪，请刷新或重载相关插件';}
 async onClose(){this.epoch++;this.live=false;this.unsubscribe?.();this.unsubscribeManagement?.();this.contentEl.replaceChildren();}
}

class ContextKeyManager extends Plugin {
  async onload(){
    this.closed=false;this.directory=new Directory(()=>globalThis.__mandalaTimeBlocksPluginApi);
    this.identityHost=require("module").createRequire(require("path").join(this.app.vault.adapter.getBasePath(),this.manifest.dir,"main.js"))("./host.cjs").install(this,require("obsidian"));
    this.management=new Management(this.directory);
    this.registerView(TYPE,leaf=>new ContextView(leaf,this));
    this.addCommand({id:"open-context-key-manager",name:"打开主键管理中心",callback:()=>{void this.open();}});
    this.addRibbonIcon("key-round","主键管理中心",()=>{void this.open();});
  }
  open(){
    if(this.closed)return Promise.resolve();if(this.opening)return this.opening;
    this.opening=(async()=>{try{
      let leaf=this.app.workspace.getLeavesOfType(TYPE)[0];
      if(!leaf){leaf=this.app.workspace.getLeaf("tab");await leaf.setViewState({type:TYPE,active:true});}
      if(this.closed){leaf.detach();return;}
      await this.app.workspace.revealLeaf(leaf);
    }catch{if(!this.closed)new Notice("主键管理中心暂时无法打开，请重试。");}finally{this.opening=null;}})();return this.opening;
  }
  onunload(){this.closed=true;this.identityHost?.close();this.management.dispose();this.directory.dispose();this.app.workspace.detachLeavesOfType(TYPE);}
}
module.exports=ContextKeyManager;
