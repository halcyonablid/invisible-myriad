"use strict";
function allStopped(entries, classify) {
  return Array.isArray(entries) && entries.length > 0 && entries.every(x => typeof x?.keyword === "string" && x.keyword.trim() && classify(x.keyword) === true);
}


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
const obsidian = {...require("obsidian"),Modal:C2InputRecovery.protectModal(require("obsidian").Modal,'gtd-task-manager')};
const { ItemView, Notice, Plugin, PluginSettingTab, Setting, TFile } = obsidian;

const VIEW_TYPE_GTD_TASK_MANAGER = "gtd-task-manager-view";
const VIEW_TYPE_GTD_HISTORY = "gtd-task-manager-history-view";
const GTD_RELATION_VIEW_TYPE = "gtd";
const JUMP_NODE_PREFIX = "jump:v1:";
const JUMP_NODE_SEGMENT_COUNT = 5;
const JUMP_OPENER_REGISTRY_GLOBAL = "__evaCrossViewJumpOpeners";
const GTD_NOTE_BASENAME = "GTD待办事项管理系统";
const GTD_PLUGIN_MAIN_DIAG_MARKER = "main diag 20260511-fresh-engine";

const DEFAULT_SETTINGS = {
  sourceNotePath: "",
  dataFolder: "",
  autoOpenOnLoad: false,
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function decodeJumpSegment(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_) {
    return text(value);
  }
}

function parseJumpNodeKey(nodeKey) {
  const normalized = text(nodeKey);
  if (!normalized.startsWith(JUMP_NODE_PREFIX)) return null;
  const encodedSegments = normalized.slice(JUMP_NODE_PREFIX.length).split("|");
  if (encodedSegments.length !== JUMP_NODE_SEGMENT_COUNT) return null;
  const [viewType, notePath, scopeType, scopeId, itemId] = encodedSegments.map((segment) => decodeJumpSegment(segment));
  if (!viewType || !notePath || !scopeType || !scopeId || !itemId) return null;
  return { viewType, notePath, scopeType, scopeId, itemId };
}

function parentFolder(path) {
  const normalized = text(path).replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index > 0 ? normalized.slice(0, index) : "";
}

function fileNameWithoutExt(path) {
  const name = text(path).replace(/\\/g, "/").split("/").pop() || "";
  return name.replace(/\.md$/i, "");
}

function normalizeSettings(raw = {}) {
  return {
    sourceNotePath: text(raw.sourceNotePath),
    dataFolder: text(raw.dataFolder).replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""),
    autoOpenOnLoad: raw.autoOpenOnLoad === true,
  };
}

function cleanupRetiredGtdPinButtons() {
  if (typeof window.gtdFloatingPinCleanup === "function") {
    try {
      window.gtdFloatingPinCleanup();
    } catch (error) {
      console.warn("[GTD Task Manager][retired-pin-cleanup-fail]", error);
    }
  }
  delete window.gtdFloatingPinCleanup;
  document.querySelectorAll?.(".gtd-floating-pin-btn").forEach((element) => element.remove());
}

function ensureJumpOpenerRegistry() {
  const existing = window[JUMP_OPENER_REGISTRY_GLOBAL];
  if (
    existing
    && typeof existing.register === "function"
    && typeof existing.unregister === "function"
    && typeof existing.get === "function"
  ) {
    return existing;
  }
  const openersByViewType = new Map();
  const registry = {
    version: 1,
    register(descriptor = {}) {
      const openerId = text(descriptor.openerId);
      const viewType = text(descriptor.viewType);
      if (!openerId || !viewType || typeof descriptor.openNode !== "function") return null;
      openersByViewType.set(viewType, {
        openerId,
        viewType,
        openNode: descriptor.openNode,
      });
      return true;
    },
    unregister(openerId) {
      const targetId = text(openerId);
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
      return openersByViewType.get(text(viewType)) || null;
    },
  };
  window[JUMP_OPENER_REGISTRY_GLOBAL] = registry;
  return registry;
}

class GtdTaskManagerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "GTD Task Manager" });
    containerEl.createEl("p", {
      text: "插件版沿用原 GTD JSON 文件和 EVA nodeKey。sourceNotePath 只作为逻辑身份与数据目录锚点。",
    });

    new Setting(containerEl)
      .setName("原 GTD note 路径")
      .setDesc("留空时自动搜索 GTD待办事项管理系统.md。该路径用于定位原 JSON 文件夹和保持 EVA 关系兼容。")
      .addText((textInput) => textInput
        .setPlaceholder("例如：项目/.../GTD待办事项管理系统.md")
        .setValue(this.plugin.settings.sourceNotePath)
        .onChange(async (value) => {
          this.plugin.settings.sourceNotePath = text(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("数据文件夹兜底路径")
      .setDesc("当原 note 不存在时使用；仍会读取该文件夹下的 GTD_Database.json 等旧文件。")
      .addText((textInput) => textInput
        .setPlaceholder("例如：项目/18-.../liner chain")
        .setValue(this.plugin.settings.dataFolder)
        .onChange(async (value) => {
          this.plugin.settings.dataFolder = text(value).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("启动 Obsidian 时自动打开")
      .setDesc("默认关闭，避免启动时主动抢焦点。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoOpenOnLoad)
        .onChange(async (value) => {
          this.plugin.settings.autoOpenOnLoad = value === true;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("打开 GTD 插件视图")
      .addButton((button) => button
        .setButtonText("打开")
        .setCta()
        .onClick(async () => {
          await this.plugin.activateView();
        }));
  }
}

class GtdTaskManagerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderSeq = 0;
    this.mountGeneration = 0;
    this.engineApi = null;
    this.hostClosed = false;
    this.dirtyHostInputs = new WeakSet();
    this.hostInputListener = event => {
      const el = event.target;
      if (el && this.contentEl.contains(el) && this.hostTextInput(el)) this.dirtyHostInputs.add(el);
    };
  }
  getViewType() { return VIEW_TYPE_GTD_TASK_MANAGER; }
  getDisplayText() { return "GTD 待办事项管理"; }
  getIcon() { return "list-todo"; }
  hostAlive() {
    return !this.hostClosed && this.contentEl?.isConnected === true
      && this.plugin.contextRenameClosed !== true
      && this.app.plugins?.plugins?.[this.plugin.manifest.id] === this.plugin;
  }
  sourceFingerprint(source = this.plugin.resolveSourceContext()) {
    return JSON.stringify([source.path, source.folder, source.exists === true]);
  }
  hostTextInput(el) {
    return !!el?.matches?.('textarea,[contenteditable]') || (el?.tagName === 'INPUT' && !['checkbox','radio','button','submit','reset','range','color','hidden'].includes(el.type || 'text'));
  }
  hostInputOpen() {
    // C2 recovery is additional protection, never permission to discard a connected editor.
    if (this.plugin.c2InputRecovery?.canLeave?.() === false) return true;
    const doc = this.contentEl.ownerDocument || document;
    if (doc.querySelector(".modal-container")) return true;
    const visible = el => {
      for (let p = el; p && p !== this.contentEl; p = p.parentElement) {
        if (p.hidden || p.style?.display === "none") return false;
      }
      return el.isConnected === true;
    };
    if ([...this.contentEl.querySelectorAll(".gtd-comment-drawer, .tag-modal-overlay")].some(visible)) return true;
    return [...this.contentEl.querySelectorAll("input, textarea, [contenteditable]")].some(el =>
      visible(el) && this.hostTextInput(el) && (doc.activeElement === el || this.dirtyHostInputs.has(el)));
  }
  hostMessage(message) {
    if (!this.hostAlive()) return;
    let banner = this.contentEl.querySelector(".gtd-host-status");
    if (!banner) banner = this.contentEl.createDiv({ cls: "gtd-host-status", attr: { role: "status" } });
    banner.setText(message);
  }
  async onOpen() {
    this.hostClosed = false;
    this.contentEl.addClass("gtd-task-manager-view");
    this.contentEl.removeEventListener("input", this.hostInputListener, true);
    this.contentEl.addEventListener("input", this.hostInputListener, true);
    return await this.render();
  }
  async onClose() {
    // Native teardown cannot be vetoed here; existing C2 recovery owns durable draft recovery.
    this.hostClosed = true;
    this.renderSeq += 1;
    this.mountGeneration += 1;
    this.contentEl.removeEventListener("input", this.hostInputListener, true);
    this.disposeEngineApi();
    cleanupRetiredGtdPinButtons();
    this.contentEl.empty();
  }
  disposeEngineApi(candidate = this.engineApi) {
    if (!candidate) return;
    try { candidate.dispose?.(); }
    catch (error) { console.warn("[GTD Task Manager][engine-api-dispose-fail]", error); }
    if (this.engineApi === candidate) this.engineApi = null;
  }
  async render() {
    if (!this.hostAlive()) return false;
    if (this.hostInputOpen()) {
      this.hostMessage("正在编辑，已保留当前界面。请完成或取消编辑，再执行重载。");
      return false;
    }
    const seq = ++this.renderSeq;
    const sourceContext = Object.freeze({ ...this.plugin.resolveSourceContext() });
    const fingerprint = this.sourceFingerprint(sourceContext);
    const requestCurrent = () => this.hostAlive() && seq === this.renderSeq
      && this.sourceFingerprint() === fingerprint;
    let root = null;
    let generation = null;
    try {
      const momentApi = window.moment;
      if (!momentApi) throw new Error("未找到 Obsidian moment API。");
      const runner = await this.plugin.loadEngineRunner();
      if (!requestCurrent()) return false;
      if (this.hostInputOpen()) {
        this.hostMessage("加载期间开始了编辑，已保留当前界面。请完成编辑后重新执行重载。");
        return false;
      }
      if (runner?.gtdHostLifecycleVersion !== 1) throw new Error("GTD 主视图与引擎版本不匹配，请成对更新后重载。");
      // Only this accepted request replaces the engine. Compilation never invalidates the old mount.
      generation = ++this.mountGeneration;
      this.disposeEngineApi();
      this.contentEl.empty();
      root = this.contentEl.createDiv({ cls: "gtd-task-manager-root" });
      root.dataset.gtdPluginHost = "1";
      root.dataset.gtdMainDiagMarker = GTD_PLUGIN_MAIN_DIAG_MARKER;
      root.dataset.gtdSourcePath = sourceContext.path;
      root.dataset.gtdDataFolder = sourceContext.folder;
      this.engineRoot = root;
      const isHostCurrent = () => this.hostAlive() && generation === this.mountGeneration
        && this.engineRoot === root && root.isConnected === true
        && this.sourceFingerprint() === fingerprint;
      await runner({
        app: this.app, obsidian, moment: momentApi, container: root, sourceContext,
        hostLifecycleVersion: 1, isHostCurrent,
        centerPublisher: this.plugin.createEngineCenterPublisherV1(),
        canLeaveInput: () => this.plugin.c2InputRecovery.canLeave(), Notice, TFile,
        pluginDiag: {
          mainMarker: GTD_PLUGIN_MAIN_DIAG_MARKER, pluginId: this.plugin.manifest.id,
          pluginVersion: this.plugin.manifest.version, pluginDir: this.plugin.manifest.dir || "",
          historyBoot: this.plugin.takeHistoryBoot(),
        },
      });
      const api = root.__gtdTaskManagerEngineApi || null;
      if (!isHostCurrent()) { this.disposeEngineApi(api); return false; }
      if (!api || api.isReady?.() !== true) throw new Error("GTD 引擎尚未就绪，请重试重载。");
      this.engineApi = api;
      return true;
    } catch (error) {
      if (root) this.disposeEngineApi(root.__gtdTaskManagerEngineApi || null);
      if (!requestCurrent() || (generation !== null && generation !== this.mountGeneration)) return false;
      console.error("[GTD Task Manager][render-fail]", error);
      this.hostMessage(`GTD 加载未完成：${error?.message || String(error)} 可再次执行重载。`);
      return false;
    }
  }
}


class GtdContextHistoryView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.closed = false; }
  getViewType() { return VIEW_TYPE_GTD_HISTORY; }
  getDisplayText() { return "GTD 历史回看"; }
  async onOpen() { this.contentEl.createEl("p", { text: "GTD 历史回看已改为在 GTD 视图中进行，可关闭此页。" }); }
  async onClose() { this.closed = true; }
}
module.exports = class GtdTaskManagerPlugin extends Plugin {
  resolveContextRenameScope() {
    const source = this.resolveSourceContext();
    if (!source.exists) {
      const folder = text(this.settings.dataFolder);
      if (!folder || folder.includes("\\") || folder.includes(":") || folder.split("/").some(p => !p || p === "." || p === "..")
          || source.folder !== folder || source.path !== `${folder}/${GTD_NOTE_BASENAME}.md`) throw new Error("gtd-source-unresolved");
    }
    const prefix = source.folder && source.folder !== "/" ? source.folder + "/" : "";
    return { sourceNotePath: source.path, dataPath: prefix + "GTD_Tags.json", keywordPath: prefix + "GTD_TagKeywords.json" };
  }

  getCenterNamingParticipantV1() { return this.getCenterNamingConsumerV1().participant; }
  getCenterNamingConsumerV1() {
    if (!this.centerNamingConsumerV1) {
      const path = require("node:path"), { createRequire } = require("node:module");
      const base = this.app.vault.adapter.getBasePath?.();
      if (!base) throw new Error("gtd-local-vault-required");
      const entry = path.join(base, this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`, "gtd-consumer.cjs");
      this.centerNamingConsumerV1 = createRequire(entry)(entry).installGtdConsumer(this);
    }
    return this.centerNamingConsumerV1;
  }
  // Bound to this plugin instance: an engine rendered by a replaced/unloaded instance cannot publish.
  createEngineCenterPublisherV1() {
    const plugin = this;
    const bound = () => {
      if (plugin.contextRenameClosed === true || plugin.app.plugins?.plugins?.[plugin.manifest.id] !== plugin) throw new Error("GTD_ENGINE_PLUGIN_REPLACED");
      return plugin.getCenterNamingConsumerV1();
    };
    return Object.freeze({
      publish: (...args) => bound().publish(...args),
      publishDatabase: (...args) => bound().publishDatabase(...args),
    });
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
      map: "keywords", id: "tagId", carriers: "tags",
      process: (scope, callback) => this.getCenterNamingConsumerV1().publish(scope.keywordPath, callback, scope.sourceNotePath),
      currentSource: () => this.resolveSourceContext()?.path,
      resolve: async () => this.resolveContextRenameScope(),
      allowMissingSource: scope => !this.resolveSourceContext().exists && JSON.stringify(this.resolveContextRenameScope()) === JSON.stringify(scope),
      assertCurrentScope: scope => {
        if (JSON.stringify(this.resolveContextRenameScope()) !== JSON.stringify(scope)) throw new Error("source-scope-changed");
      },
      publish: async (scope, data) => {
        const registry = window.__gtdTaskManagerEngineApisBySourceNotePath;
        const apis = new Set([registry?.get?.(scope.sourceNotePath), window.__gtdTaskManagerEngineApi,
          ...this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD_TASK_MANAGER).map(l => l.view?.engineApi)]);
        const results = await Promise.allSettled([...apis].filter(api => api?.sourceNotePath === scope.sourceNotePath && api.isReady?.()).map(async api => {
          if (typeof api.refreshContextKeywordMemory !== "function") throw new Error("gtd-engine-upgrade-required");
          await api.refreshContextKeywordMemory(data);
        }));
        window.dispatchEvent(new CustomEvent("context-capsule-carrier:changed", { detail: { providerId: "gtd-task-manager", sourceNotePath: scope.sourceNotePath, revision: String(data.updatedAt || Date.now()), timestamp: Date.now(), reason: "context-key-rename-verified" } }));
        if (results.some(r => r.status === "rejected")) throw new Error("gtd-view-refresh-failed");
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
    cleanupRetiredGtdPinButtons();
    await this.loadSettings();
    this.registerView(VIEW_TYPE_GTD_HISTORY, leaf => new GtdContextHistoryView(leaf, this));
    this.registerView(VIEW_TYPE_GTD_TASK_MANAGER, (leaf) => new GtdTaskManagerView(leaf, this));
    this.addRibbonIcon("list-todo", "打开 GTD 待办事项管理", async () => this.activateView());
    this.addCommand({
      id: "open-gtd-task-manager",
      name: "打开 GTD 待办事项管理",
      callback: async () => this.activateView(),
    });
    this.addCommand({
      id: "reload-gtd-task-manager",
      name: "重载 GTD 待办事项管理视图",
      callback: async () => this.reloadOpenViews(),
    });
    this.addSettingTab(new GtdTaskManagerSettingTab(this.app, this));
    this.registerGlobalApi();
    this.registerJumpOpener();
    // Leaves of the retired standalone history view (restored from an older layout) are closed.
    this.app.workspace.onLayoutReady(() => this.app.workspace.detachLeavesOfType(VIEW_TYPE_GTD_HISTORY));
    if (this.settings.autoOpenOnLoad) {
      this.app.workspace.onLayoutReady(() => {
        void this.activateView();
      });
    }
    console.info("[GTD Task Manager][load]", { status: "OK", version: this.manifest.version });
  }

  onunload() {
    this.historyOpenSerial = (this.historyOpenSerial || 0) + 1;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GTD_HISTORY);
    this.contextRenameClosed = true;
    this.centerNamingConsumerV1?.close?.();
    cleanupRetiredGtdPinButtons();
    this.unregisterJumpOpener();
    if (window.__gtdTaskManagerPluginApi?.pluginId === this.manifest.id) {
      delete window.__gtdTaskManagerPluginApi;
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GTD_TASK_MANAGER);
  }

  async loadSettings() {
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }

  loadEngineRunner() {
    if (!this.engineRunnerPromise) {
      this.engineRunnerPromise = this.compileEngineRunner().catch((error) => { this.engineRunnerPromise = null; throw error; });
    }
    return this.engineRunnerPromise;
  }

  takeHistoryBoot() {
    const boot = this.historyBoot || null;
    this.historyBoot = null;
    return boot;
  }

  findEngineLeaf(sourceNotePath = "") {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD_TASK_MANAGER);
    return leaves.find((leaf) => leaf.view instanceof GtdTaskManagerView && text(leaf.view.engineApi?.sourceNotePath) === text(sourceNotePath)) || leaves[0] || null;
  }

  async compileEngineRunner() {
    const candidatePaths = [
      `${this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`}/gtd-engine.js`,
      `.obsidian/plugins/${this.manifest.id}/gtd-engine.js`,
    ].filter(Boolean);
    let code = "";
    let loadedPath = "";
    for (const candidatePath of candidatePaths) {
      try {
        if (!(await this.app.vault.adapter.exists(candidatePath))) continue;
        code = await this.app.vault.adapter.read(candidatePath);
        loadedPath = candidatePath;
        break;
      } catch (error) {
        console.warn("[GTD Task Manager][engine-load-candidate-fail]", {
          path: candidatePath,
          message: error?.message || String(error),
        });
      }
    }
    if (!code) {
      throw new Error(`Cannot load gtd-engine.js from plugin directory: ${candidatePaths.join(", ")}`);
    }
    const module = { exports: {} };
    const factory = new Function("module", "exports", "require", `${code}\n;return module.exports;`);
    const runner = factory(module, module.exports, require);
    if (typeof runner !== "function") {
      throw new Error(`gtd-engine.js did not export a runner function: ${loadedPath}`);
    }
    console.info("[GTD Task Manager][engine-load]", {
      status: "OK",
      path: loadedPath,
      mode: "compiled-once",
      mainMarker: GTD_PLUGIN_MAIN_DIAG_MARKER,
      engineHasUsageDiagMarker: code.includes("plugin diag 20260511-usage-projects"),
      engineChars: code.length
    });
    return runner;
  }

  findSourceNotePath() {
    const configured = text(this.runtimeSourceNotePath, text(this.settings.sourceNotePath));
    if (configured) {
      const file = this.app.vault.getAbstractFileByPath(configured);
      if (file instanceof TFile) return file.path;
      return configured;
    }
    const matched = this.app.vault.getMarkdownFiles()
      .find((file) => file.basename === GTD_NOTE_BASENAME);
    if (matched) return matched.path;
    if (this.settings.dataFolder) return `${this.settings.dataFolder}/${GTD_NOTE_BASENAME}.md`;
    return `${GTD_NOTE_BASENAME}.md`;
  }

  resolveSourceContext() {
    const path = this.findSourceNotePath();
    const file = this.app.vault.getAbstractFileByPath(path);
    const folder = file instanceof TFile
      ? text(file.parent?.path)
      : text(this.settings.dataFolder, parentFolder(path));
    return {
      path,
      folder,
      exists: file instanceof TFile,
    };
  }

  pluginLiveV1() {
    return this.contextRenameClosed !== true && this.app.plugins?.plugins?.[this.manifest.id] === this;
  }

  sourceLeaseV1() {
    const source = Object.freeze({ ...this.resolveSourceContext() });
    const signature = JSON.stringify([source.path, source.folder, source.exists === true]);
    const publishedApi = window.__gtdTaskManagerPluginApi;
    return { source, live: () => this.pluginLiveV1() && window.__gtdTaskManagerPluginApi === publishedApi
      && ((s) => JSON.stringify([s.path, s.folder, s.exists === true]))(this.resolveSourceContext()) === signature };
  }

  navigationInputsClearV1() {
    if (!this.pluginLiveV1()) return false;
    try {
      if (this.c2InputRecovery?.canLeave?.() === false || document.querySelector('.modal-container')) return false;
      const blocked = this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD_TASK_MANAGER)
        .map(leaf => leaf.view).filter(view => view instanceof GtdTaskManagerView && view.hostAlive() && view.hostInputOpen());
      for (const view of blocked) view.hostMessage('正在编辑，已保留当前来源和界面。请完成或取消编辑后重新跳转。');
      return blocked.length === 0;
    } catch (_) { return false; }
  }

  setRequestSourceV1(path, token = null) {
    if (!this.pluginLiveV1() || (this.navigationRequestV1 && this.navigationRequestV1 !== token)) return false;
    const requested = text(path);
    if (!requested || requested === this.resolveSourceContext().path) return true;
    if (!this.navigationInputsClearV1()) return false;
    this.runtimeSourceNotePath = requested;
    return true;
  }

  async withNavigationRequestV1(fn) {
    if (this.navigationRequestV1 || !this.navigationInputsClearV1()) return false;
    const token = {};
    this.navigationRequestV1 = token;
    try { return await fn(token); }
    catch (_) { return false; }
    finally { if (this.navigationRequestV1 === token) this.navigationRequestV1 = null; }
  }

  validNavigationKeyV1(nodeKey, notePath = '') {
    const parsed = parseJumpNodeKey(nodeKey);
    return !!parsed && 'jump:v1:' + [parsed.viewType, parsed.notePath, parsed.scopeType, parsed.scopeId, parsed.itemId].map(encodeURIComponent).join('|') === nodeKey
      && parsed.viewType === GTD_RELATION_VIEW_TYPE && parsed.scopeType === 'note'
      && !!parsed.itemId && !!parsed.notePath && parsed.scopeId === parsed.notePath
      && (!notePath || parsed.notePath === notePath);
  }

  async acquireOwnerEngineV1(options, method, refresh = false, activate = true) {
    if (!this.setRequestSourceV1(options?.sourceNotePath || options?.notePath)) return null;
    const lease = this.sourceLeaseV1();
    const usable = api => lease.live() && this.currentEngineV1(api, lease.source.path)
      && typeof api[method] === 'function';
    let api = await this.waitForEngineApi({ sourceNotePath: lease.source.path, requiredMethod: method, delays: [0] });
    if (!lease.live()) return null;
    if (activate && (refresh || !usable(api))) {
      if (!(await this.activateView({ intent: 'engine' })) || !lease.live()) return null;
      api = await this.waitForEngineApi({ sourceNotePath: lease.source.path, requiredMethod: method });
    }
    return usable(api) ? { api, lease, current: () => usable(api) } : null;
  }

  currentEngineV1(api, path) {
    if (!api || api.sourceNotePath !== path || api.isReady?.() !== true) return false;
    const registry = window.__gtdTaskManagerEngineApisBySourceNotePath;
    return registry instanceof Map && registry.has(path) ? registry.get(path) === api : window.__gtdTaskManagerEngineApi === api;
  }

  async openViewV1(options = {}) {
    const notePath = typeof options === 'string' ? text(options) : text(options?.notePath);
    if (options?.nodeKey) return await this.openNode(options.nodeKey, { notePath });
    return await this.withNavigationRequestV1(async token => {
      if (!this.setRequestSourceV1(notePath, token)) return false;
      return !!(await this.activateView({ navigationToken: token }));
    });
  }

  async activateView(options = {}) {
    const intent = options?.intent === 'engine' ? 'engine' : 'navigate';
    const token = options.navigationToken || null;
    if (!this.pluginLiveV1() || (this.navigationRequestV1 && this.navigationRequestV1 !== token)) return false;
    if (intent === 'navigate' && !this.navigationInputsClearV1()) return false;
    const lease = this.sourceLeaseV1();
    const pendingNodeKey = text(window.gtdPendingRelationFocusNodeKey);
    const requestedNodeKey = this.validNavigationKeyV1(pendingNodeKey,lease.source.path) ? pendingNodeKey : '';
    const serial = this.activationSerialV1 = (this.activationSerialV1 || 0) + 1;
    const live = () => lease.live() && serial === this.activationSerialV1
      && (!token || this.navigationRequestV1 === token);
    let leaf = this.findEngineLeaf(lease.source.path);
    try {
      let view, api, reusableNavigation = false;
      if (!leaf) {
        leaf = this.app.workspace.getLeaf(false);
        await leaf.setViewState({ type: VIEW_TYPE_GTD_TASK_MANAGER, active: true });
        if (!live()) return false;
        view = leaf.view;
      } else {
        view = leaf.view;
        if (!(view instanceof GtdTaskManagerView) || !view.hostAlive()) return false;
        api = view.engineApi;
        const generation = view.mountGeneration;
        const reusable = options.force !== true && api?.isReady?.() === true
          && text(api.sourceNotePath) === lease.source.path && typeof api.isDataFreshV1 === 'function'
          && (await api.isDataFreshV1()) === true;
        reusableNavigation = reusable;
        if (!live() || leaf.view !== view || !view.hostAlive() || view.engineApi !== api || generation !== view.mountGeneration) return false;
        if (intent === 'navigate' && !this.navigationInputsClearV1()) return false;
        if (!reusable && (await view.render()) !== true) return false;
      }
      if (!live() || leaf.view !== view || !(view instanceof GtdTaskManagerView) || !view.hostAlive()) return false;
      api = view.engineApi;
      if (api?.isReady?.() !== true || text(api.sourceNotePath) !== lease.source.path) return false;
      if (intent === 'navigate' && requestedNodeKey) {
        // r40: focus needs layout, and a background-tab leaf has none. Run the navigation hidden first (structure,
        // render, receipt when already visible); reveal only when the target exists, so an unreachable target keeps
        // the old contract (no reveal, false) and EVA retries never steal focus. Then wait for layout and apply again.
        if (!this.navigationInputsClearV1()) return false;
        if (typeof api.applyPendingNavigationV1 !== 'function') return false;
        const generation = view.mountGeneration;
        const same = () => live() && leaf.view === view && view.engineApi === api && view.mountGeneration === generation && view.hostAlive();
        if (reusableNavigation) {
          await api.applyPendingNavigationV1(requestedNodeKey);
          if (!same()) return false;
        }
        if (api.getNavigationResultV1?.(requestedNodeKey) !== true) {
          const itemId = parseJumpNodeKey(requestedNodeKey).itemId;
          const esc = s => (window.CSS && typeof CSS.escape === 'function') ? CSS.escape(s) : JSON.stringify(String(s)).slice(1, -1);
          const root = view.contentEl;
          const target = root?.querySelector?.(`[data-gtd-node-key="${esc(requestedNodeKey)}"]`) || root?.querySelector?.(`[data-gtd-anchor-id="${esc(itemId)}"]`);
          if (!target) return false;
          await this.app.workspace.revealLeaf(leaf);
          await this.waitLayoutV1(view);
          if (!same() || !this.navigationInputsClearV1()) return false;
          if ((await api.applyPendingNavigationV1(requestedNodeKey)) !== true || !same()) return false;
          if (api.getNavigationResultV1?.(requestedNodeKey) !== true) return false;
          return leaf;
        }
      } else if (intent === 'navigate') {
        if (!this.navigationInputsClearV1()) return false;
        // A new engine already paints/consumes pending focus during startup. Do not repaint it again.
        if (reusableNavigation) {
          if (typeof api.applyPendingNavigationV1 !== 'function') return false;
          const generation = view.mountGeneration;
          if ((await api.applyPendingNavigationV1(requestedNodeKey)) !== true) return false;
          if (!live() || leaf.view !== view || view.engineApi !== api || view.mountGeneration !== generation || !view.hostAlive()) return false;
        }
      }
      if(intent==='navigate' && api.getNavigationResultV1?.(requestedNodeKey)!==true)return false;
      this.app.workspace.revealLeaf(leaf);
      return leaf;
    } catch (_) { return false; }
  }

  // r40: one frame of the leaf's window for the reveal to take layout, bounded by a main-window timer (background or
  // pop-out windows may pause rAF and throttle their own timers); the loser is cancelled.
  async waitLayoutV1(view) {
    const win = view?.contentEl?.win || view?.contentEl?.ownerDocument?.defaultView || window;
    const raf = typeof win?.requestAnimationFrame === 'function' ? win : null;
    const timers = typeof window.setTimeout === 'function' ? window : null;
    if (!raf && !timers) { await Promise.resolve(); return; }
    await new Promise(resolve => {
      let frame = null, timer = null, done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (frame !== null) { try { raf.cancelAnimationFrame?.(frame); } catch (_) {} }
        if (timer !== null) { try { timers.clearTimeout?.(timer); } catch (_) {} }
        resolve();
      };
      if (timers) timer = timers.setTimeout(finish, 100);
      if (raf) frame = raf.requestAnimationFrame(() => finish());
    });
  }

  async reloadOpenViews() {
    this.engineRunnerPromise = null;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GTD_TASK_MANAGER);
    await Promise.all(leaves.map(async (leaf) => {
      if (leaf.view instanceof GtdTaskManagerView) await leaf.view.render();
    }));
  }

  async waitForEngineApi(options = {}) {
    const delays = Array.isArray(options?.delays) ? options.delays : [0, 40, 120, 260, 520, 900, 1500, 2600];
    const requiredMethod = text(options?.requiredMethod, "ensureProjectContextTag");
    const expectedSourceNotePath = text(options?.sourceNotePath);
    for (const delay of delays) {
      if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
      const registry = window.__gtdTaskManagerEngineApisBySourceNotePath;
      const candidates = [
        expectedSourceNotePath && registry instanceof Map ? registry.get(expectedSourceNotePath) : null,
        window.__gtdTaskManagerEngineApi,
      ].filter(Boolean);
      const api = candidates.find((candidate) => (
        typeof candidate?.[requiredMethod] === "function"
        && (!expectedSourceNotePath || text(candidate?.sourceNotePath) === expectedSourceNotePath)
        && (typeof candidate?.isReady !== "function" || candidate.isReady() === true)
      ));
      if (api) return api;
    }
    return null;
  }

  async managedCreationCallV1(method,input) {
    const lease=this.sourceLeaseV1(), source=lease.source, api=window.__gtdTaskManagerPluginApi;
    const engine=await this.waitForEngineApi({sourceNotePath:source.path,requiredMethod:method,delays:[0]});
    if(!lease.live()||!engine||engine.creationContractVersion!==1||!engine.isReady?.()||engine.sourceNotePath!==source.path||this.contextRenameClosed||window.__gtdTaskManagerPluginApi!==api||this.resolveSourceContext().path!==source.path)throw Error('GTD_CREATE_ENGINE_NOT_READY');
    if (!this.currentEngineV1(engine, source.path)) throw Error('GTD_CREATE_ENGINE_NOT_READY');
    const original=input?.isCurrent;
    const isCurrent=()=>lease.live()&&this.currentEngineV1(engine, source.path)&&window.__gtdTaskManagerPluginApi===api&&!this.contextRenameClosed&&this.resolveSourceContext().path===source.path&&engine.isReady?.()===true&&(!original||original()===true);
    const result=await engine[method]({...input,...(original?{isCurrent}:{})});
    if(method !== 'commitCreationStep' && !isCurrent())throw Error('GTD_CREATE_ENGINE_CHANGED');return result;
  }

  async ensureProjectContextTag(options = {}) {
    const acquired = await this.acquireOwnerEngineV1(options, 'ensureProjectContextTag');
    if (!acquired || !acquired.current()) return { ok: false, reason: 'engine-source-mismatch-or-not-ready', sourceNotePath: this.resolveSourceContext().path };
    return await acquired.api.ensureProjectContextTag({ ...options, sourceNotePath: acquired.lease.source.path });
  }

  async renameContextCapsuleKey(options = {}) {
    const acquired = await this.acquireOwnerEngineV1(options, 'renameContextCapsuleKey', true);
    if (!acquired || !acquired.current()) return { ok: false, pluginId: this.manifest.id, reason: 'engine-api-not-ready', matchedCount: 0, renamedCount: 0 };
    return await acquired.api.renameContextCapsuleKey(options);
  }

  async syncContextCapsuleKey(options = {}) {
    const acquired = await this.acquireOwnerEngineV1(options, 'syncContextCapsuleKey', true);
    if (!acquired || !acquired.current()) return { ok: false, pluginId: this.manifest.id, reason: 'engine-api-not-ready', matchedCount: 0, renamedCount: 0 };
    return await acquired.api.syncContextCapsuleKey(options);
  }

  async getContextCapsuleCarrierSnapshot(options = {}) {
    const acquired = await this.acquireOwnerEngineV1(options, 'getContextCapsuleCarrierSnapshot', false, false);
    if (!acquired || !acquired.current()) return { ok: false, pluginId: this.manifest.id, reason: 'engine-api-not-ready', items: [] };
    return await acquired.api.getContextCapsuleCarrierSnapshot(options);
  }

  async getContextCapsuleTopLevelProjectCarrierBatchSnapshot(options = {}) {
    // Purpose is request intent, never evidence that data has been saved.
    const requestedPurpose = options && typeof options === "object" && !Array.isArray(options) ? options.readPurpose : null;
    const readPurpose = requestedPurpose === undefined ? "display" : requestedPurpose;
    const saved = readPurpose === "operation-check";
    const lease = this.sourceLeaseV1();
    const expectedSourceNotePath = lease.source.path;
    const fail = (code) => ({
      ok: false, complete: false, decisionComplete: false,
      pluginId: this.manifest.id, providerId: this.manifest.id,
      sourceNotePath: expectedSourceNotePath,
      reason: "engine-source-mismatch-or-not-ready",
      count: 0, returnedCount: 0, results: [], diagnostics: [{ code }],
    });
    try {
      if (readPurpose !== "display" && readPurpose !== "operation-check") return fail("read-purpose-invalid");
      const request = { readPurpose };
      for (const key of Object.keys(options)) if (key !== "readPurpose") Object.defineProperty(request, key, { value: options[key], enumerable: true });
      Object.freeze(request);
      const engineApi = await this.waitForEngineApi({
        requiredMethod: "getContextCapsuleTopLevelProjectCarrierBatchSnapshot",
        sourceNotePath: expectedSourceNotePath,
        delays: [0],
      });
      const read = engineApi?.getContextCapsuleTopLevelProjectCarrierBatchSnapshot;
      const fresh = engineApi?.isDataFreshV1;
      const validate = engineApi?.isContextCarrierBatchCurrentV1;
      const current = () => lease.live() && this.currentEngineV1(engineApi, expectedSourceNotePath)
        && typeof read === "function" && (saved || typeof fresh === "function") && typeof validate === "function"
        && engineApi.getContextCapsuleTopLevelProjectCarrierBatchSnapshot === read
        && (saved || engineApi.isDataFreshV1 === fresh)
        && engineApi.isContextCarrierBatchCurrentV1 === validate;
      if (!current()) return fail("engine-observation-not-current");
      if (!saved && (await fresh.call(engineApi)) !== true) return fail("engine-data-not-current");
      if (!current()) return fail("engine-observation-not-current");
      const result = await read.call(engineApi, request);
      if (!current()) return fail("engine-observation-not-current");
      if (result?.ok === true && (result.readPurpose !== readPurpose || result.writeAuthorization !== false)) return fail("engine-read-purpose-mismatch");
      if (result?.ok === true && validate.call(engineApi, result) !== true) return fail("engine-result-input-changed");
      if (!saved && (await fresh.call(engineApi)) !== true) return fail("engine-data-not-current");
      if (!current()) return fail("engine-observation-not-current");
      if (result?.ok === true && validate.call(engineApi, result) !== true) return fail("engine-result-input-changed");
      return result;
    } catch (_) { return fail("engine-observation-read-failed"); }
  }

  async openHistoryNodeV1(nodeKey) {
    return await this.withNavigationRequestV1(token => this.openHistoryRequestV1(nodeKey, token));
  }
  async openHistoryRequestV1(nodeKey, token) {
    const parsed = parseJumpNodeKey(nodeKey);
    if (!parsed || "jump:v1:" + [parsed.viewType, parsed.notePath, parsed.scopeType, parsed.scopeId, parsed.itemId].map(encodeURIComponent).join("|") !== nodeKey || parsed.viewType !== GTD_RELATION_VIEW_TYPE || parsed.scopeType !== "note" || parsed.scopeId !== parsed.notePath) return false;
    const source = this.resolveSourceContext();
    if (source.path !== parsed.notePath || !source.folder || source.folder.split(/[\\/]/).some(x => x === ".." || x === ".")) return false;
    const serial = this.historyOpenSerial = (this.historyOpenSerial || 0) + 1;
    const lease = this.sourceLeaseV1();
    const live = () => lease.live() && serial === this.historyOpenSerial && this.navigationRequestV1 === token && this.navigationInputsClearV1();
    try {
      const leaf = this.findEngineLeaf(source.path);
      const api = leaf?.view instanceof GtdTaskManagerView ? leaf.view.engineApi : null;
      const fresh = api?.isReady?.() === true && text(api.sourceNotePath) === source.path
        && typeof api.isDataFreshV1 === "function" && (await api.isDataFreshV1()) === true;
      if (!live() || (api && (leaf.view.engineApi !== api || !leaf.view.hostAlive()))) return false;
      if (fresh) {
        if (!this.currentEngineV1(api, source.path)) return false;
        this.app.workspace.revealLeaf(leaf);
        return (await api.openHistoryNodeV1(nodeKey, live)) === true && live() && this.currentEngineV1(api, source.path) && leaf.view.engineApi === api;
      }
      // Data changed or no engine: validate the target against the raw DB before any re-render.
      const path = source.folder + "/GTD_Database.json";
      const raw = await this.app.vault.adapter.read(path);
      if (!live() || typeof raw !== "string" || raw.length > 8 * 1024 * 1024) return false;
      const records = JSON.parse(raw), ids = new Set();
      if (!Array.isArray(records) || records.length > 10000 || records.some(x => !x || typeof x.id !== "string" || !x.id || ids.has(x.id) || !ids.add(x.id)) || !ids.has(parsed.itemId)) return false;
      if (await this.app.vault.adapter.read(path) !== raw || !live()) return false;
      this.historyBoot = { itemId: parsed.itemId, serial };
      if (!(await this.activateView({ force: true, intent: "engine", navigationToken: token })) || !live()) return false;
      if (this.historyBoot?.serial === serial) this.historyBoot = null;
      const next = await this.waitForEngineApi({ sourceNotePath: source.path, requiredMethod: "openHistoryNodeV1" });
      if (!live() || !this.currentEngineV1(next, source.path)) return false;
      return (await next.openHistoryNodeV1(nodeKey, live)) === true && live() && this.currentEngineV1(next, source.path);
    } catch (_) { return false; }
    finally { if (this.historyBoot?.serial === serial) this.historyBoot = null; }
  }
  async openNode(nodeKey, context = {}) {
    if (!this.validNavigationKeyV1(nodeKey, text(context?.notePath))) return false;
    return await this.withNavigationRequestV1(async token => {
      const parsed = parseJumpNodeKey(nodeKey);
      if (!this.setRequestSourceV1(parsed.notePath, token)) return false;
      window.gtdPendingRelationFocusNodeKey = nodeKey;
      return !!(await this.activateView({ navigationToken: token }));
    });
  }

  registerGlobalApi() {
    window.__gtdTaskManagerPluginApi = {
      pluginId: this.manifest.id,
      pluginVersion: this.manifest.version,
      openHistoryNodeV1: nodeKey => this.openHistoryNodeV1(nodeKey),
      cancelHistoryNavigationV1: () => { this.historyOpenSerial = (this.historyOpenSerial || 0) + 1; },
      openView: async (options = {}) => this.openViewV1(options),
      openNode: async (nodeKey, context = {}) => this.openNode(nodeKey, context),
      reload: async () => this.reloadOpenViews(),
      getSourceContext: () => this.resolveSourceContext(),
      creationContractVersion: 1,
      prepareManagedContextCreationV1: input => this.managedCreationCallV1('prepareManagedContextCreationV1',input),
      inspectCreationStep: input => this.managedCreationCallV1('inspectCreationStep',input),
      commitCreationStep: input => this.managedCreationCallV1('commitCreationStep',input),
      ensureProjectContextTag: async (options = {}) => this.ensureProjectContextTag(options),
      contextCapsuleRenameV2: async (options = {}) => this.contextCapsuleRenameV2(options),
      renameContextCapsuleKey: async (options = {}) => this.renameContextCapsuleKey(options),
      syncContextCapsuleKey: async (options = {}) => this.syncContextCapsuleKey(options),
      getContextCapsuleCarrierSnapshot: async (options = {}) => this.getContextCapsuleCarrierSnapshot(options),
      getContextCapsuleTopLevelProjectCarrierBatchSnapshot: async (options = {}) => this.getContextCapsuleTopLevelProjectCarrierBatchSnapshot(options),
    };
  }

  registerJumpOpener() {
    this.jumpOpenerId = `gtd-task-manager::${this.manifest.id}`;
    ensureJumpOpenerRegistry().register({
      openerId: this.jumpOpenerId,
      viewType: GTD_RELATION_VIEW_TYPE,
      openNode: async (nodeKey, context = {}) => this.openNode(nodeKey, context),
    });
  }

  unregisterJumpOpener() {
    if (!this.jumpOpenerId) return;
    ensureJumpOpenerRegistry().unregister(this.jumpOpenerId);
  }
};
