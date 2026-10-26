const __EvaIndexHealth=(()=>{const module={exports:{}};
'use strict';
// Session-only evidence about observed refreshes; never an identity or write grant.
function createIndexHealth(notify=()=>{}) {
 const generation=require('crypto').randomUUID(), rows=new Map(), types=new Map(),protectedTypes=new Set(['workspace-mount-view','mandala-time-blocks','gtd']);let closed=false;
 // Diagnostic aggregation only; not owner freshness or final qualification.
 const scopes=new Map();
 const scopeKey=(viewType,notePath)=>JSON.stringify([viewType,notePath]);
 function addScope(row,delta){
  if(!row||!protectedTypes.has(row.viewType))return;
  const key=scopeKey(row.viewType,row.notePath);
  let s=scopes.get(key);
  if(!s){s={epoch:0n,observedCount:0,activeCount:0,inactiveCount:0,pendingCount:0,issueCount:0,dirtyCount:0,unsettledCount:0};scopes.set(key,s);}
  s.epoch++;
  s.observedCount+=delta;
  s[row.inactive?'inactiveCount':'activeCount']+=delta;
  if(row.pending)s.pendingCount+=delta;
  if(row.issue)s.issueCount+=delta;
  if(row.dirty)s.dirtyCount+=delta;
  if(!row.settled)s.unsettledCount+=delta;
 }
 function ownValue(object,key){
  if(!object||typeof object!=='object')throw Error('source-coverage-scope');
  const d=Object.getOwnPropertyDescriptor(object,key);
  if(!d||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('source-coverage-scope');
  return d.value;
 }
 function readSources(request){
  if(ownValue(request,'contractVersion')!==1)throw Error('source-coverage-version');
  const requested=ownValue(request,'scopes');
  if(!Array.isArray(requested)||requested.length<1||requested.length>128)throw Error('source-coverage-scope');
  const seen=new Set(),result=[];
  for(let i=0;i<requested.length;i++){
   const q=ownValue(requested,String(i)),viewType=ownValue(q,'viewType'),notePath=ownValue(q,'notePath');
   if(!protectedTypes.has(viewType)||typeof notePath!=='string'||!notePath||notePath.length>4096||notePath!==notePath.trim()||/[\\:\x00-\x1f\x7f]/.test(notePath)||notePath.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('source-coverage-scope');
   const key=scopeKey(viewType,notePath);
   if(seen.has(key))throw Error('source-coverage-duplicate');
   seen.add(key);
   const s=scopes.get(key);
   const counts={observedCount:s?.observedCount||0,activeCount:s?.activeCount||0,inactiveCount:s?.inactiveCount||0,pendingCount:s?.pendingCount||0,issueCount:s?.issueCount||0,dirtyCount:s?.dirtyCount||0,unsettledCount:s?.unsettledCount||0};
   const status=closed?'unavailable':counts.pendingCount?'pending':counts.issueCount||counts.dirtyCount||counts.unsettledCount?'unknown':counts.activeCount&&counts.inactiveCount?'partial':counts.activeCount?'active-ready':counts.observedCount?'inactive':'unobserved';
   result.push(Object.freeze({viewType,notePath,revision:JSON.stringify([closed,String(s?.epoch||0n)]),...counts,status}));
  }
  return Object.freeze({contractVersion:1,coverage:'requested-observed-adapter-scopes',complete:true,providerGeneration:generation,scopes:Object.freeze(result)});
 }

 const stats=type=>{let s=types.get(type);if(!s)types.set(type,s={revision:0,pending:0,issues:0,observed:0});return s;};
 const add=(r,d)=>{if(!r)return;addScope(r,d);const s=stats(r.viewType);s.observed+=d;if(r.pending)s.pending+=d;if(r.issue)s.issues+=d;};
 const bump=type=>{stats(type).revision++;try{notify();}catch{}};
 function begin(adapter){
  if(closed)return null;
  let old=rows.get(adapter.adapterId);
  if(old&&(old.viewType!==adapter.viewType||old.notePath!==adapter.notePath)){
   if(protectedTypes.has(old.viewType)||protectedTypes.has(adapter.viewType)){
    unregister(adapter.adapterId,'identity-scope-mismatch');return null;
   }
   // Collection keeps its host id when switching source notes.
   add(old,-1);rows.delete(adapter.adapterId);bump(old.viewType);old=null;
  }
  const row={adapterId:adapter.adapterId,viewType:adapter.viewType,notePath:adapter.notePath,pending:true,issue:old?.issue||'',settled:old?.settled||false,dirty:old?.dirty||false,token:{}};
  add(old,-1);rows.set(row.adapterId,row);add(row,1);return row.token;
 }
 function current(id,token){return !closed&&!!token&&rows.get(id)?.token===token;}
 // A superseding refresh inherits changes awaiting persistence/publication.
 function markDirty(id,token){if(current(id,token)){const row=rows.get(id);addScope(row,-1);row.dirty=true;addScope(row,1);}}
 function finish(id,token,issue='',changed=false){
  if(!current(id,token))return false;
  const old=rows.get(id),semantic=(!issue&&(changed||old.dirty))||!old.settled||old.issue!==issue;
  const row={...old,pending:false,issue,settled:true,dirty:issue?old.dirty:false};add(old,-1);rows.set(id,row);add(row,1);
  if(semantic)bump(row.viewType);return true;
 }
 function unregister(id,reason='unregistered'){
  const old=rows.get(id);if(closed||!old)return;
  const row={...old,inactive:true,pending:false,issue:reason,settled:true,token:{}};
  add(old,-1);rows.set(id,row);add(row,1);if(old.issue!==reason||old.pending)bump(row.viewType);
 }
 function detach(id,persisted){
  const old=rows.get(id);if(closed||!old)return false;
  if(!persisted||!old.settled||old.pending||old.issue||old.dirty){unregister(id,old.issue||'detached-unsettled');return false;}
  const row={...old,inactive:true,token:{}};add(old,-1);rows.set(id,row);add(row,1);
  if(!old.inactive)bump(row.viewType);return true;
 }
 function read(request){
  const raw=request?.viewTypes;
  if(!Array.isArray(raw)||!raw.length||raw.length>16||raw.some(t=>typeof t!=='string'||!t||t.length>128))throw Error('index-health-scope');
  const selected=[...new Set(raw)].sort();let pending=0,issues=0,observed=0;
  const revisions=selected.map(t=>{const s=types.get(t);pending+=s?.pending||0;issues+=s?.issues||0;observed+=s?.observed||0;return [t,s?.revision||0];});
  return Object.freeze({contractVersion:1,coverage:'observed-adapter-refreshes',providerGeneration:generation,
   status:closed?'unavailable':pending?'pending':issues?'unknown':'ready',revision:JSON.stringify([closed,revisions]),observedCount:observed,pendingCount:pending,issueCount:issues,unobservedSources:'not-verified'});
 }
 return Object.freeze({begin,current,markDirty,finish,unregister,detach,read,readSources,close(){if(!closed){closed=true;try{notify();}catch{}}}});
}
module.exports={createIndexHealth};

return module.exports;})();
const { Plugin, Notice, Modal, Setting, TFile } = require("obsidian");
const { createHash } = require("crypto");

const PLUGIN_VERSION = "0.1.0";
const STATE_SCHEMA_VERSION = "1.0";
const DEFAULT_RELATION_TYPE = "引用";
const RELATION_TYPES = ["引用", "关联", "依赖", "阻塞", "支持", "来源"];
const JUMP_NODE_PREFIX = "jump:v1:";
const JUMP_NODE_SEGMENT_COUNT = 5;
const JUMP_OPENER_REGISTRY_GLOBAL = "__evaCrossViewJumpOpeners";
const ATOM_NOTE_VIEW_TYPE = "eva-note";
const ATOM_NOTE_ADAPTER_ID = "eva-note::atom-notes";
const ATOM_NOTE_SCOPE_PATH = "__vault_atom_notes__";
const ATOM_NOTE_ITEM_ID = "file";
const OUTGOING_RELATION_BATCH_CONTRACT_VERSION = 1;
const OUTGOING_RELATION_BATCH_MAX_SOURCES = 500;

const cloneJson = (value, fallback) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return fallback;
  }
};

const nowString = () => new Date().toISOString();

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const normalizeNodeKey = (value) => normalizeText(value);

const normalizeOptionalText = (value) => {
  const text = String(value || "").trim();
  return text || "";
};

const parseAtomIdFromText = (value) => {
  const match = String(value || "").match(/ATOM@[\d\.A-Z\+]+/i);
  return match ? match[0] : "";
};

const getRecordMetaValue = (record = {}, key = "") => {
  const target = normalizeOptionalText(key).toLowerCase();
  if (!target) return "";
  const field = (Array.isArray(record?.metaFields) ? record.metaFields : [])
    .find((item) => normalizeOptionalText(item?.key || item?.label).toLowerCase() === target);
  return normalizeOptionalText(field?.value);
};

const createJumpTraceId = () => `jump_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const logJumpTrace = (traceId, stage, payload = {}) => {
  const prefix = traceId ? `[EVA Relations][${traceId}]` : "[EVA Relations]";
  let serialized = "";
  try {
    serialized = JSON.stringify(payload);
  } catch (error) {
    serialized = String(payload);
  }
  console.log(`${prefix}[${stage}] ${serialized}`);
};

const normalizeMetaFields = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = normalizeOptionalText(item.label || item.name || item.key);
      const fieldValue = normalizeOptionalText(item.value);
      if (!label || !fieldValue) return null;
      return {
        label,
        value: fieldValue
      };
    })
    .filter(Boolean);
};

const createEmptyState = () => ({
  schema_version: STATE_SCHEMA_VERSION,
  updated: "",
  relationsById: {},
  nodeIndexByKey: {},
  pinnedNodeKeys: [],
  autoPinnedSourceNodeKey: "",
  lastRelationEditorSourceNodeKey: ""
});

const encodeJumpSegment = (value) => encodeURIComponent(normalizeOptionalText(value));

const decodeJumpSegment = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return normalizeOptionalText(value);
  }
};

const buildJumpNodeKey = ({ viewType = "", notePath = "", scopeType = "", scopeId = "", itemId = "" } = {}) => {
  const segments = [viewType, notePath, scopeType, scopeId, itemId].map((value) => normalizeOptionalText(value));
  if (segments.some((segment) => !segment)) return "";
  return `${JUMP_NODE_PREFIX}${segments.map((segment) => encodeJumpSegment(segment)).join("|")}`;
};

const parseJumpNodeKey = (nodeKey) => {
  const normalized = normalizeNodeKey(nodeKey);
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
class EvaConfirmModal extends Modal {
  constructor(app, options = {}) {
    super(app);
    this.title = normalizeOptionalText(options.title) || "确认操作";
    this.message = normalizeOptionalText(options.message) || "是否继续？";
    this.detail = normalizeOptionalText(options.detail);
    this.confirmText = normalizeOptionalText(options.confirmText) || "确认";
    this.cancelText = normalizeOptionalText(options.cancelText) || "取消";
    this.danger = options.danger !== false;
    this.onConfirm = typeof options.onConfirm === "function" ? options.onConfirm : async () => {};
    this.resolved = false;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("eva-rel-confirm-modal");
    contentEl.empty();
    const shell = contentEl.createEl("div", { cls: "eva-rel-confirm-shell" });
    shell.createEl("div", { cls: "eva-rel-confirm-icon", text: this.danger ? "!" : "?" });
    shell.createEl("h3", { cls: "eva-rel-confirm-title", text: this.title });
    shell.createEl("div", { cls: "eva-rel-confirm-message", text: this.message });
    if (this.detail) shell.createEl("div", { cls: "eva-rel-confirm-detail", text: this.detail });
    const actions = shell.createEl("div", { cls: "eva-rel-confirm-actions" });
    const cancelBtn = actions.createEl("button", { cls: "eva-rel-confirm-cancel", text: this.cancelText });
    const confirmBtn = actions.createEl("button", {
      cls: this.danger ? "eva-rel-confirm-delete" : "eva-rel-confirm-primary",
      text: this.confirmText
    });
    cancelBtn.onclick = () => this.close();
    confirmBtn.onclick = async () => {
      if (this.resolved) return;
      this.resolved = true;
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      try {
        await this.onConfirm();
      } finally {
        this.close();
      }
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}

const resolveRemappedNodeKey = (nodeKey, remapMap) => {
  let current = normalizeNodeKey(nodeKey);
  const seen = new Set();
  while (current && remapMap.has(current) && !seen.has(current)) {
    seen.add(current);
    current = normalizeNodeKey(remapMap.get(current));
  }
  return current;
};

const ensureJumpOpenerRegistry = () => {
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
      const openerId = normalizeOptionalText(descriptor.openerId);
      const viewType = normalizeOptionalText(descriptor.viewType);
      if (!openerId || !viewType || typeof descriptor.openNode !== "function") return null;
      openersByViewType.set(viewType, {
        openerId,
        viewType,
        openNode: descriptor.openNode
      });
      return true;
    },
    unregister(openerId) {
      const targetId = normalizeOptionalText(openerId);
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
      return openersByViewType.get(normalizeOptionalText(viewType)) || null;
    },
    list() {
      return Array.from(openersByViewType.values()).map((entry) => ({
        openerId: entry.openerId,
        viewType: entry.viewType
      }));
    }
  };
  window[JUMP_OPENER_REGISTRY_GLOBAL] = registry;
  return registry;
};

const sortByLocale = (list, getter) => {
  return [...list].sort((a, b) => {
    const aa = String(getter(a) || "");
    const bb = String(getter(b) || "");
    return aa.localeCompare(bb, "zh-Hans-CN");
  });
};

class RelationEditorModal extends Modal {
  constructor(app, plugin, sourceNodeKey) {
    super(app);
    this.plugin = plugin;
    this.sourceNodeKey = normalizeNodeKey(sourceNodeKey);
    this.editingRelationId = "";
    this.targetNodeKey = "";
    this.relationType = DEFAULT_RELATION_TYPE;
    this.description = "";
    this.searchQuery = "";
    this.closed = false;
    this.baseline = this.draftSignature();
    this.handleRelationsChanged = (event) => {
      if (this.closed || !this.contentEl?.isConnected) return;
      const reasons=String(event?.detail?.reason||'').split(',');
      if(reasons.every(r=>r==='relation-upsert'||r==='relation-delete'))this.renderRelations();
      else if(reasons.every(r=>['pin-add','pin-remove','pin-clear','relation-editor-source-remember'].includes(r)))this.renderPins();
      else this.render();
    };
  }

  draftStorageKey(){return JSON.stringify(['eva-cross-view-relations','relation-editor-draft-v1',this.app.vault?.adapter?.basePath||this.app.vault?.getName?.()||'vault',this.sourceNodeKey]);}
  preserveDraft(){
    if(this.discardDraft||(this.draftSignature()===this.baseline&&!this.saveFailed&&!this.saving)){window.localStorage.removeItem(this.draftStorageKey());return;}
    window.localStorage.setItem(this.draftStorageKey(),JSON.stringify({owner:'eva-cross-view-relations',version:1,sourceNodeKey:this.sourceNodeKey,editingRelationId:this.editingRelationId,targetNodeKey:this.targetNodeKey,relationType:this.relationType,description:this.description,baseline:this.baseline,savedAt:new Date().toISOString(),status:this.saveFailed?'save-failed':'draft'}));
  }
  forceClose(){try{this.preserveDraft();super.close();}catch(error){new Notice('草稿保存失败，编辑窗口已保留');console.error('[EVA Relations][draft.failed]',error);}}
  draftSignature(){return JSON.stringify([this.targetNodeKey,this.relationType,this.description]);}
  close(){this.requestClose();}
  requestClose(afterClose){
    if(this.closed)return;
    if(this.saving||this.saveFailed){new Notice(this.saving?'正在保存，请稍候':'保存尚未成功，请重试保存后再关闭');return;}
    const finish=()=>{super.close();afterClose?.();};
    if(this.draftSignature()===this.baseline){finish();return;}
    if(this.closeConfirm?.modalEl?.isConnected)return;
    this.closeConfirm=new EvaConfirmModal(this.app,{title:'尚有未保存的关系',message:'继续编辑可保留当前输入；放弃后关闭。',confirmText:'放弃并关闭',cancelText:'继续编辑',onConfirm:()=>{this.discardDraft=true;finish();}});
    this.closeConfirm.open();
  }

  async onOpen() {
    this.plugin.relationEditors ||= new Set();this.plugin.relationEditors.add(this);
    try{const draft=JSON.parse(window.localStorage.getItem(this.draftStorageKey())||'null');if(draft?.version===1&&draft.sourceNodeKey===this.sourceNodeKey){for(const key of ['editingRelationId','targetNodeKey','relationType','description','baseline'])if(typeof draft[key]==='string')this[key]=draft[key];new Notice('已恢复上次未保存的关系草稿，请核对后保存');}}catch(error){console.warn('[EVA Relations][draft.restore-failed]',error);}
    this.modalEl.style.maxWidth = "1280px";
    this.modalEl.style.width = "94vw";
    this.modalEl.style.height = "82vh";
    this.modalEl.addClass("eva-rel-modal-root");
    this.contentEl.style.display = "flex";
    this.contentEl.style.flexDirection = "column";
    this.contentEl.style.height = "100%";
    this.contentEl.style.gap = "16px";
    this.contentEl.style.overflow = "auto";
    window.addEventListener("eva-cross-view-relations:changed", this.handleRelationsChanged);
    this.render();
    this.refreshStatus.textContent='已显示已有索引 · 后台核对中';
    this.refreshTimer=window.setTimeout(async()=>{
      this.refreshTimer=null;
      try{await this.plugin.refreshAllAdapters();if(!this.closed&&this.contentEl.isConnected){this.render();this.refreshStatus.textContent=this.plugin.refreshIssues?.size?'部分索引暂未更新，保留已有条目':'索引已核对';}}
      catch(error){if(!this.closed)this.refreshStatus.textContent='索引刷新失败，保留已有条目';console.warn('[EVA Relations][editor.refresh-failed]',error);}
    },40);
  }

  onClose() {
    this.preserveDraft();this.plugin.relationEditors?.delete(this);
    this.closed=true;
    if(this.searchTimer)window.clearTimeout(this.searchTimer);
    if(this.refreshTimer)window.clearTimeout(this.refreshTimer);
    window.removeEventListener("eva-cross-view-relations:changed", this.handleRelationsChanged);
    this.modalEl.style.maxWidth = "";
    this.modalEl.style.width = "";
    this.modalEl.style.height = "";
    this.contentEl.style.display = "";
    this.contentEl.style.flexDirection = "";
    this.contentEl.style.height = "";
    this.contentEl.style.gap = "";
    this.contentEl.style.overflow = "";
    this.contentEl.empty();
  }

  beginEdit(relation) {
    if (!relation || this.saving || this.saveFailed) return;
    this.editingRelationId = relation.id;
    this.targetNodeKey = relation.targetNodeKey;
    this.relationType = relation.relationType || DEFAULT_RELATION_TYPE;
    this.description = relation.description || "";
    this.baseline=this.draftSignature();
    this.render();
  }

  resetComposer(afterSave=false) {
    if(this.saving&&!afterSave)return;
    if(this.saveFailed){new Notice('保存尚未成功，请先重试保存');return;}
    this.editingRelationId = "";
    this.targetNodeKey = "";
    this.relationType = DEFAULT_RELATION_TYPE;
    this.description = "";
    this.searchQuery = "";
    this.baseline=this.draftSignature();
    this.render();
  }

  selectTargetNode(nodeKey) {
    const targetKey = normalizeNodeKey(nodeKey);
    if (!targetKey) return;
    this.targetNodeKey = targetKey;
    this.render();
  }

  async pinTargetNode(nodeKey) {
    const pinned = this.plugin.addPinnedNodeKey(nodeKey);
    if (pinned) {
      new Notice("已 PIN 到跨视图引用候选框");
      this.render();
    }
  }

  async unpinTargetNode(nodeKey) {
    const removed = this.plugin.removePinnedNodeKey(nodeKey);
    if (removed) {
      new Notice("已从 PIN 候选框移除");
      this.render();
    }
  }

  jumpToNodeAndClose(nodeKey) {
    const targetKey = normalizeNodeKey(nodeKey);
    if (!targetKey) return;
    this.requestClose(()=>window.setTimeout(() => {void this.plugin.openNode(targetKey);},40));
  }

  async submit() {
    if (!this.sourceNodeKey) {
      new Notice("❌ 缺少源条目");
      return;
    }
    if (!this.targetNodeKey) {
      new Notice("⚠️ 请先选择目标条目");
      return;
    }
    if (this.sourceNodeKey === this.targetNodeKey) {
      new Notice("⚠️ 不能引用自己");
      return;
    }
    if(this.saving)return;
    const submitted=this.draftSignature();
    this.saving=true;this.saveBtn.disabled=true;
    try{
      const saved=await this.plugin.upsertRelation({id:this.editingRelationId||'',sourceNodeKey:this.sourceNodeKey,targetNodeKey:this.targetNodeKey,relationType:this.relationType||DEFAULT_RELATION_TYPE,description:this.description||''});
      if(!saved)throw Error('关系未能保存');
      this.editingRelationId=saved.id;
      await this.plugin.flushSavedState();
      this.saveFailed=false;this.baseline=submitted;
      if(this.draftSignature()===submitted)this.resetComposer(true);
      else this.render();
    }catch(error){this.saveFailed=true;new Notice('保存失败，输入已保留，请重试');console.error('[EVA Relations][editor.save-failed]',error);}
    finally{this.saving=false;if(!this.closed)this.saveBtn.disabled=false;}
  }

  renderNodeCard(container, label, record) {
    const card = container.createEl("div", {
      cls: `eva-rel-target-preview ${record ? "is-selected" : ""}`.trim()
    });
    card.createEl("div", { text: label, cls: "eva-rel-section-title" });
    if (!record) {
      card.createEl("div", { text: "未找到条目索引", cls: "eva-rel-empty" });
      return;
    }
    card.createEl("div", { text: record.label || record.nodeKey, cls: "eva-rel-target-title" });
    const chipRow = card.createEl("div", { cls: "eva-rel-chip-row" });
    chipRow.createEl("span", {
      text: `视图: ${record.viewLabel || record.viewType || "未知"}`,
      cls: "eva-rel-chip is-view"
    });
    card.createEl("div", {
      text: record.pathLabel || record.notePath || record.nodeKey,
      cls: "eva-rel-target-path"
    });
    this.renderRecordMetaFields(card, record);
  }

  renderRecordMetaFields(container, record) {
    const metaFields = Array.isArray(record?.metaFields) ? record.metaFields : [];
    if (metaFields.length === 0) return;
    const detailList = container.createEl("div", { cls: "eva-rel-detail-list" });
    metaFields.forEach((field) => {
      const row = detailList.createEl("div", { cls: "eva-rel-detail-row" });
      row.createEl("span", { text: `${field.label}：`, cls: "eva-rel-detail-label" });
      row.createEl("span", { text: field.value, cls: "eva-rel-detail-value" });
    });
  }

  renderRelationList(container, title, relations, mode) {
    const panel = container.createEl("div", { cls: "eva-rel-panel" });
    panel.createEl("div", { text: title, cls: "eva-rel-section-title" });
    if (!relations || relations.length === 0) {
      panel.createEl("div", { text: "暂无", cls: "eva-rel-empty" });
      return;
    }
    const list = panel.createEl("div", { cls: "eva-rel-existing-list" });
    relations.forEach((relation) => {
      const record = mode === "outgoing" ? relation.target : relation.source;
      const item = list.createEl("div", { cls: "eva-rel-existing-item" });
      const chipRow = item.createEl("div", { cls: "eva-rel-chip-row" });
      chipRow.createEl("span", {
        text: relation.relationType || DEFAULT_RELATION_TYPE,
        cls: `eva-rel-chip ${mode === "outgoing" ? "is-outgoing" : "is-incoming"}`
      });
      chipRow.createEl("span", {
        text: `${mode === "outgoing" ? "目标视图" : "来源视图"}: ${record?.viewLabel || record?.viewType || "未知"}`,
        cls: "eva-rel-chip is-view"
      });
      item.createEl("div", { text: record?.label || relation.targetNodeKey || relation.sourceNodeKey, cls: "eva-rel-item-title" });
      item.createEl("div", {
        text: record?.pathLabel || record?.notePath || relation.targetNodeKey || relation.sourceNodeKey,
        cls: "eva-rel-item-path"
      });
      this.renderRecordMetaFields(item, record);
      if (relation.description) {
        item.createEl("div", {
          text: relation.description,
          cls: "eva-rel-item-description"
        });
      }
      const actions = item.createEl("div", { cls: "eva-rel-existing-actions" });
      const openBtn = actions.createEl("button", { text: mode === "outgoing" ? "打开目标" : "打开来源" });
      openBtn.onclick = () => {
        this.jumpToNodeAndClose(mode === "outgoing" ? relation.targetNodeKey : relation.sourceNodeKey);
      };
      if (mode === "outgoing") {
        const editBtn = actions.createEl("button", { text: "编辑" });
        editBtn.onclick = () => this.beginEdit(relation);
        const deleteBtn = actions.createEl("button", { text: "删除" });
        deleteBtn.onclick = () => {
          if(this.saving||this.saveFailed)return;
          this.plugin.openDeleteRelationConfirm(relation, async () => {
            if(this.saving||this.saveFailed||this.closed)return;
            await this.plugin.deleteRelation(relation.id);
            if (this.editingRelationId === relation.id) this.resetComposer();
            else this.render();
          });
        };
      }
    });
  }

  renderPinnedTargets(container) {
    const panel = container.createEl("div", { cls: "eva-rel-pin-panel" });
    const header = panel.createEl("div", { cls: "eva-rel-pin-header" });
    header.createEl("div", { cls: "eva-rel-section-title", text: "PIN 候选条目" });
    const clearBtn = header.createEl("button", { text: "清空 PIN" });
    clearBtn.disabled = this.plugin.getPinnedNodeKeys().length === 0;
    clearBtn.onclick = () => {
      this.plugin.clearPinnedNodeKeys();
      this.render();
    };

    const pinned = this.plugin.getPinnedNodeRecords({
      excludeNodeKey: this.sourceNodeKey
    });
    if (pinned.length === 0) {
      panel.createEl("div", {
        text: "还没有 PIN 条目。可在下面搜索结果里点击 PIN，之后从这里直接选择建立联系。",
        cls: "eva-rel-empty"
      });
      return;
    }

    const list = panel.createEl("div", { cls: "eva-rel-pin-list" });
    pinned.forEach((item) => {
      const record = item.record;
      const row = list.createEl("div", {
        cls: `eva-rel-pin-item ${item.nodeKey === this.targetNodeKey ? "is-active" : ""} ${record ? "" : "is-missing"}`.trim()
      });
      if (record) {
        const chipRow = row.createEl("div", { cls: "eva-rel-chip-row" });
        if (item.isAutoPinnedSource) {
          chipRow.createEl("span", {
            text: "自动：上一个当前条目",
            cls: "eva-rel-chip is-auto-pin"
          });
        }
        chipRow.createEl("span", {
          text: `视图: ${record.viewLabel || record.viewType || "未知"}`,
          cls: "eva-rel-chip is-view"
        });
        row.createEl("div", { text: record.label || record.nodeKey, cls: "eva-rel-item-title" });
        row.createEl("div", {
          text: record.pathLabel || record.notePath || record.nodeKey,
          cls: "eva-rel-item-path"
        });
        this.renderRecordMetaFields(row, record);
      } else {
        row.createEl("div", { text: item.nodeKey, cls: "eva-rel-item-title" });
        row.createEl("div", { text: "索引中暂时找不到该 PIN 条目，可移除或等待原视图刷新索引。", cls: "eva-rel-item-path" });
      }
      const actions = row.createEl("div", { cls: "eva-rel-pin-actions" });
      const selectBtn = actions.createEl("button", {
        text: item.nodeKey === this.targetNodeKey ? "已选中" : "选择做联系"
      });
      selectBtn.disabled = !record;
      selectBtn.onclick = () => this.selectTargetNode(item.nodeKey);
      const openBtn = actions.createEl("button", { text: "预览跳转" });
      openBtn.disabled = !record;
      openBtn.onclick = () => this.jumpToNodeAndClose(item.nodeKey);
      if (item.isAutoPinnedSource) {
        actions.createEl("button", {
          text: "自动保留",
          attr: { disabled: "true", title: "由上一次打开关系窗口的当前条目自动生成，不占用手动 PIN 数量" }
        });
        return;
      }
      const removeBtn = actions.createEl("button", { text: "取消 PIN" });
      removeBtn.onclick = async () => {
        await this.unpinTargetNode(item.nodeKey);
      };
    });
  }

  renderSearchResults(container) {
    const query = normalizeText(this.searchQuery);
    const list = container.createEl("div", { cls: "eva-rel-search-results" });
    const results = this.plugin.searchNodes(query, {
      excludeNodeKey: this.sourceNodeKey,
      limit: 60
    });
    if (results.length === 0) {
      list.createEl("div", { text: "没有匹配条目", cls: "eva-rel-empty" });
      return;
    }
    results.forEach((record) => {
      const row = list.createEl("div", {
        cls: `eva-rel-search-item ${record.nodeKey === this.targetNodeKey ? "is-active" : ""}`.trim()
      });
      const chipRow = row.createEl("div", { cls: "eva-rel-chip-row" });
      chipRow.createEl("span", {
        text: `视图: ${record.viewLabel || record.viewType || "未知"}`,
        cls: "eva-rel-chip is-view"
      });
      row.createEl("div", { text: record.label || record.nodeKey, cls: "eva-rel-item-title" });
      row.createEl("div", {
        text: record.pathLabel || record.notePath || record.nodeKey,
        cls: "eva-rel-item-path"
      });
      this.renderRecordMetaFields(row, record);
      const actions = row.createEl("div", { cls: "eva-rel-search-actions" });
      const selectBtn = actions.createEl("button", {
        text: record.nodeKey === this.targetNodeKey ? "已选中" : "选择"
      });
      selectBtn.onclick = () => {
        this.selectTargetNode(record.nodeKey);
      };
      const pinBtn = actions.createEl("button", {
        text: this.plugin.isNodePinned(record.nodeKey) ? "PINNED" : "PIN"
      });
      pinBtn.onclick = async () => {
        await this.pinTargetNode(record.nodeKey);
      };
      const openBtn = actions.createEl("button", { text: "预览跳转" });
      openBtn.onclick = () => {
        this.jumpToNodeAndClose(record.nodeKey);
      };
    });
  }

  renderRelations(){
    if(this.closed||!this.listColumn)return;
    const snapshot=this.plugin.getNodeRelationSnapshot(this.sourceNodeKey),signature=JSON.stringify(snapshot);
    if(signature===this.relationsSignature)return;
    this.relationsSignature=signature;const scroll=this.contentEl.scrollTop;
    this.listColumn.empty();this.renderRelationList(this.listColumn,'我指向的条目',snapshot.outgoing,'outgoing');this.renderRelationList(this.listColumn,'指向我的条目',snapshot.incoming,'incoming');this.contentEl.scrollTop=scroll;
  }
  renderPins(){
    if(this.closed||!this.pinsHost)return;
    const signature=JSON.stringify([this.plugin.getPinnedNodeRecords({excludeNodeKey:this.sourceNodeKey}),this.targetNodeKey]);
    if(signature!==this.pinsSignature){this.pinsSignature=signature;this.pinsHost.empty();this.renderPinnedTargets(this.pinsHost);}
    this.renderResults();
  }
  renderResults(){
    if(this.closed||this.composing||!this.resultsHost)return;
    const signature=JSON.stringify([this.searchQuery,this.targetNodeKey,this.plugin.getPinnedNodeKeys(),this.plugin.searchRevision||0]);
    if(signature===this.searchSignature)return;
    this.searchSignature=signature;const scroll=this.contentEl.scrollTop;
    this.resultsHost.empty();this.renderSearchResults(this.resultsHost);this.contentEl.scrollTop=scroll;
  }
  scheduleSearch(){if(this.searchTimer)window.clearTimeout(this.searchTimer);this.searchTimer=window.setTimeout(()=>{this.searchTimer=null;this.renderResults();},100);}
  render(){
    if(this.closed)return;
    if(!this.searchInput)this.buildLayout();
    const scroll=this.contentEl.scrollTop;
    const source=this.plugin.getNodeRecord(this.sourceNodeKey),target=this.plugin.getNodeRecord(this.targetNodeKey);
    const signature=JSON.stringify([source,target]);
    if(signature!==this.cardsSignature){this.cardsSignature=signature;this.sourceHost.empty();this.targetHost.empty();this.renderNodeCard(this.sourceHost,'当前条目',source);this.renderNodeCard(this.targetHost,'目标条目',target);}
    this.formTitle.textContent=this.editingRelationId?'编辑引用关系':'新建引用关系';
    this.saveBtn.textContent=this.editingRelationId?'保存修改':'保存关系';
    for(const [element,value]of [[this.searchInput,this.searchQuery],[this.typeSelect,this.relationType],[this.textarea,this.description]])if(element.value!==value)element.value=value;
    this.renderRelations();this.renderPins();this.contentEl.scrollTop=scroll;
  }
  buildLayout(){
    const {contentEl}=this;contentEl.empty();contentEl.addClass('eva-rel-modal');
    contentEl.createEl('h3',{text:'跨视图引用关系'});this.refreshStatus=contentEl.createEl('small',{cls:'eva-rel-refresh-status'});
    this.sourceHost=contentEl.createEl('div');
    const layout=contentEl.createEl('div',{cls:'eva-rel-layout'}),column=layout.createEl('div',{cls:'eva-rel-column'});
    this.listColumn=layout.createEl('div',{cls:'eva-rel-column'});
    const composer=column.createEl('div',{cls:'eva-rel-panel'});this.formTitle=composer.createEl('div',{cls:'eva-rel-section-title'});
    this.targetHost=composer.createEl('div');this.pinsHost=composer.createEl('div');
    const searchSetting=new Setting(composer).setName('搜索目标条目').setDesc('可按条目名、路径、视图类型筛选');
    this.searchInput=searchSetting.controlEl.createEl('input',{cls:'eva-rel-search-input',attr:{type:'text',placeholder:'输入关键词筛选条目...'}});
    this.searchInput.addEventListener('input',()=>{this.searchQuery=this.searchInput.value;if(!this.composing)this.scheduleSearch();});
    this.searchInput.addEventListener('compositionstart',()=>{this.composing=true;if(this.searchTimer)window.clearTimeout(this.searchTimer);});
    this.searchInput.addEventListener('compositionend',()=>{this.composing=false;this.searchQuery=this.searchInput.value;this.scheduleSearch();});
    this.resultsHost=composer.createEl('div');
    const typeSetting=new Setting(composer).setName('关系类型');this.typeSelect=typeSetting.controlEl.createEl('select',{cls:'eva-rel-type-select'});
    RELATION_TYPES.forEach(type=>this.typeSelect.createEl('option',{text:type,value:type}));this.typeSelect.onchange=()=>{this.relationType=this.typeSelect.value||DEFAULT_RELATION_TYPE;};
    const descSetting=new Setting(composer).setName('关系说明').setDesc('例如：这个 workspace 条目依赖 GTD 中这项推进');
    this.textarea=descSetting.controlEl.createEl('textarea',{cls:'eva-rel-description',attr:{rows:'4',placeholder:'补充说明这条关系为什么存在'}});this.textarea.addEventListener('input',()=>{this.description=this.textarea.value;});
    const actions=composer.createEl('div',{cls:'eva-rel-form-actions'});this.saveBtn=actions.createEl('button',{cls:'mod-cta'});this.saveBtn.onclick=()=>this.submit();
    const resetBtn=actions.createEl('button',{text:'清空表单'});resetBtn.onclick=()=>{if(!this.saving)this.resetComposer();};
  }

}

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


const EvaCreationModule=(()=>{const module={exports:{}};
'use strict';
const {randomUUID}=require('crypto'),fs=require('fs'),path=require('path');
const FIELD='managedContextCreationsV1',eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x)),plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x),fail=c=>{throw Object.assign(Error(c),{code:c})};
function parse(raw){if(typeof raw!=='string'||Buffer.byteLength(raw)>256*1024*1024)fail('EVA_CREATE_RAW');const d=JSON.parse(raw);let count=0;function walk(x,n){if(++count>5000000||n>64)fail('EVA_CREATE_LIMIT');if(x&&typeof x==='object')for(const k of Object.keys(x)){if(['__proto__','constructor','prototype'].includes(k))fail('EVA_CREATE_UNSAFE');walk(x[k],n+1)}}walk(d,0);if(!plain(d)||!plain(d.relationsById)||d[FIELD]!==undefined&&!plain(d[FIELD]))fail('EVA_CREATE_SCHEMA');return d}
function node(key,view){if(typeof key!=='string'||key.length>4096||!key.startsWith('jump:v1:'))fail('EVA_CREATE_NODE');let p;try{p=key.slice(8).split('|').map(decodeURIComponent)}catch{fail('EVA_CREATE_NODE')}if(p.length!==5||p.some(s=>!s||/[\x00-\x1f]/.test(s))||p.map(encodeURIComponent).join('|')!==key.slice(8)||p[0]!==view)fail('EVA_CREATE_NODE');return p}
function derive(input){if(!/^create-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.txId))fail('EVA_CREATE_ID');const a=node(input.sourceNodeKey,'mandala-time-blocks'),b=node(input.targetNodeKey,'gtd');if(a[2]!=='node'||a[3]!=='mandala'||b[2]!=='note'||b[1]!==b[3])fail('EVA_CREATE_SCOPE');return {version:1,txId:input.txId,sourceNotePath:a[1],relation:{id:'rel-create-'+input.txId.slice(7),sourceNodeKey:input.sourceNodeKey,targetNodeKey:input.targetNodeKey,relationType:'承载',description:'',createdAt:'',updatedAt:''}}}
function receipt(p){return {version:1,txId:p.txId,relationId:p.relation.id,sourceNodeKey:p.relation.sourceNodeKey,targetNodeKey:p.relation.targetNodeKey,deleted:false}}
function guard(before,after){const a=parse(before),b=parse(after),ar=a[FIELD]||{},br=b[FIELD]||{};if(Object.keys(ar).length!==Object.keys(br).length)fail('EVA_CREATE_RECEIPT_LOST');for(const [tx,r] of Object.entries(ar)){const next=br[tx];if(!next||!eq({...r,deleted:next.deleted},next)||r.deleted&&!next.deleted||typeof next.deleted!=='boolean')fail('EVA_CREATE_RECEIPT_CHANGED');if(!next.deleted&&!b.relationsById[r.relationId])fail('EVA_CREATE_RELATION_LOST')}return after}
class EvaCreationOwner{
 constructor(owner){this.owner=owner;this.api=owner.api;this.base=owner.app.vault.adapter.getBasePath?.();this.dir=owner.manifest?.dir}
 live(lease){const o=this.owner;if(o.unloaded||o.api!==this.api||o.app.vault.adapter.getBasePath?.()!==this.base||o.manifest?.dir!==this.dir||lease&&lease()!==true)fail('EVA_CREATE_LEASE')}
 location(){this.live();if(!path.isAbsolute(this.base||'')||this.dir!=='.obsidian/plugins/eva-cross-view-relations')fail('EVA_CREATE_NAMESPACE');const dir=path.join(this.base,this.dir),file=path.join(dir,'data.json');for(let at=dir;;at=path.dirname(at)){const s=fs.lstatSync(at);if(!s.isDirectory()||s.isSymbolicLink())fail('EVA_CREATE_LINK');if(path.dirname(at)===at)break}const st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink())fail('EVA_CREATE_FILE');return {dir,file}}
 read(){return fs.readFileSync(this.location().file,'utf8')}
 serial(fn){const job=(this.owner._saveQueue||Promise.resolve()).catch(()=>{}).then(fn);this.owner._saveQueue=job;return job}
 publish(before,after,lease){const end=__OwnerSavedObservationV1.begin(this.owner);try{const l=this.location(),root=fs.statSync(l.dir),temp=path.join(l.dir,'.create-'+randomUUID()+'.tmp');const check=()=>{this.live(lease);const next=this.location(),s=fs.statSync(next.dir);if(s.dev!==root.dev||s.ino!==root.ino||fs.readFileSync(next.file,'utf8')!==before)fail('EVA_CREATE_CAS')};check();const fd=fs.openSync(temp,'wx');try{fs.writeFileSync(fd,after);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}try{check();fs.renameSync(temp,l.file);this.live(lease);if(this.read()!==after)fail('EVA_CREATE_READBACK')}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}}finally{end()}}
 state(raw,p){const d=parse(raw),r=d.relationsById[p.relation.id],token=d[FIELD]?.[p.txId];if(Object.entries(d.relationsById).some(([k,v])=>!plain(v)||v.id!==k))fail('EVA_CREATE_RELATION_SCHEMA');const other=Object.values(d.relationsById).some(x=>x?.id!==p.relation.id&&x?.sourceNodeKey===p.relation.sourceNodeKey&&x?.relationType==='承载');if(other)return {state:'conflict'};if(r||token)return eq(r,p.relation)&&eq(token,receipt(p))?{state:'verified'}:{state:'conflict'};return {state:'absent'}}
 prepare(input){this.live(input.isCurrent);const p=derive(input),s=this.state(this.read(),p);this.live(input.isCurrent);if(s.state!=='absent')fail('EVA_CREATE_COLLISION');return {id:'eva-carrier',owner:'eva-cross-view-relations',contract:1,source:p.sourceNotePath,plan:p,depends:[]}}
 async trusted(r){const p=r?.step?.plan;if(!p||r.step.id!=='eva-carrier'||r.step.owner!=='eva-cross-view-relations'||r.step.contract!==1||r.intent?.id!==p.txId||typeof r.isCurrent!=='function'||typeof r.readConfirmedPlan!=='function'||!eq(derive({txId:p.txId,...p.relation}),p))fail('EVA_CREATE_REQUEST');this.live(r.isCurrent);const confirmed=await r.readConfirmedPlan(p.txId);this.live(r.isCurrent);if(!confirmed?.steps?.some(s=>eq(s,r.step)))fail('EVA_CREATE_NOT_CONFIRMED');return p}
 reconcile(p,result){const m=this.state(JSON.stringify(this.owner.state),p);if(m.state==='absent'){this.owner.state.relationsById[p.relation.id]=copy(p.relation);this.owner.state[FIELD]={...(this.owner.state[FIELD]||{}),[p.txId]:receipt(p)}}else if(m.state!=='verified')result.uiWarning='EVA_CREATE_UNSAVED_CONFLICT';return result}
 async inspect(r){return this.serial(async()=>{const p=await this.trusted(r),s=this.state(this.read(),p);this.live(r.isCurrent);return s.state==='verified'?this.reconcile(p,s):s})}
 async commit(r){const end=__OwnerSavedObservationV1.begin(this.owner);try{return await this.serial(async()=>{const p=await this.trusted(r),before=this.read(),state=this.state(before,p);if(state.state==='verified')return this.reconcile(p,state);if(state.state!=='absent')fail('EVA_CREATE_CONFLICT');const o=this.owner;
  const memoryState=this.state(JSON.stringify(o.state),p);if(memoryState.state!=='absent')fail('EVA_CREATE_UNSAVED_CONFLICT');
  const d=parse(before);d.relationsById[p.relation.id]=copy(p.relation);d[FIELD]={...(d[FIELD]||{}),[p.txId]:receipt(p)};
  this.publish(before,JSON.stringify(d),r.isCurrent);o.state.relationsById[p.relation.id]=copy(p.relation);o.state[FIELD]={...(o.state[FIELD]||{}),[p.txId]:receipt(p)};
  const result=this.state(this.read(),p);this.live(r.isCurrent);try{o.dispatchChanged('managed-context-created')}catch{result.uiWarning='EVA_CREATE_NOTIFICATION_FAILED'}return result;
 })}finally{end()}}
 save(snapshot,original){this.live();const after=JSON.stringify(snapshot);let before;try{before=this.read()}catch(e){if(e.code==='ENOENT'&&!Object.hasOwn(snapshot,FIELD))return original(snapshot);throw e}const managed=Object.hasOwn(snapshot,FIELD)||before.includes(JSON.stringify(FIELD))&&Object.hasOwn(parse(before),FIELD);if(!managed)return original(snapshot);guard(before,after);this.publish(before,after);return Promise.resolve()}
}
module.exports={EvaCreationOwner,FIELD,parse,guard,derive};

return module.exports;})();
module.exports = class EVACrossViewRelationsPlugin extends Plugin {
  getManagedCreationOwner() {if(!this.managedCreationOwner)this.managedCreationOwner=new EvaCreationModule.EvaCreationOwner(this);return this.managedCreationOwner}
  async saveData(value) {const end=__OwnerSavedObservationV1.begin(this);try{return await this.getManagedCreationOwner().save(value,data=>super.saveData(data))}finally{end()}}

  async onload() {
    this.unloaded=false;this.refreshIssues=new Set();
    this.adapters = new Map();
    this.pendingFocusByContext = {};
    this.deferredOpenRetryTimers = new Map();
    this.saveTimer = null;
    this.atomNoteRefreshTimer = null;
    this.metaCapture = this.createEmptyMetaCaptureState();
    this.metaCaptureOverlayEl = null;
    this.state = createEmptyState();
    await this.loadState();
    this.api = this.buildApi();
    this.app.plugins.plugins[this.manifest.id].api = this.api;
    window.evaCrossViewRelations = this.api;

    this.addCommand({
      id: "eva-cross-view-relations-open-modal",
      name: "Open Cross View Relation Editor For Last Focused Item",
      callback: () => {
        const nodeKey = window.evaCrossViewRelationsLastNodeKey || "";
        if (!nodeKey) {
          new Notice("⚠️ 还没有最近聚焦的跨视图条目");
          return;
        }
        this.openRelationEditor(nodeKey);
      }
    });

    this.addCommand({
      id: "eva-cross-view-relations-toggle-meta-capture",
      name: "Toggle EVA Meta Capture Mode",
      callback: () => {
        if (this.metaCapture?.active) this.stopMetaCapture("command");
        else this.startMetaCapture("command");
      }
    });

    this.addRibbonIcon("waypoints", "EVA Meta Capture", () => {
      if (this.metaCapture?.active) this.stopMetaCapture("ribbon");
      else this.startMetaCapture("ribbon");
    });

    this.app.workspace.onLayoutReady(() => {
      void this.registerBuiltinAtomNoteAdapter();
      this.registerBuiltinAtomNoteRefreshEvents();
    });
  }

  onunload() {
    this.unloaded=true;this.indexHealth?.close();this.searchCatalog=null;
    for(const editor of [...(this.relationEditors||[])])editor.forceClose();
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.atomNoteRefreshTimer) {
      window.clearTimeout(this.atomNoteRefreshTimer);
      this.atomNoteRefreshTimer = null;
    }
    Array.from(this.deferredOpenRetryTimers.values()).forEach((timerIds) => {
      (Array.isArray(timerIds) ? timerIds : []).forEach((timerId) => {
        try {
          window.clearTimeout(timerId);
        } catch (error) {}
      });
    });
    this.deferredOpenRetryTimers.clear();
    if (this.app?.plugins?.plugins?.[this.manifest.id]) {
      delete this.app.plugins.plugins[this.manifest.id].api;
    }
    this.stopMetaCapture("unload", { silent: true });
    if (window.evaCrossViewRelations === this.api) delete window.evaCrossViewRelations;
  }

  buildApi() {
    this.indexHealth ||= __EvaIndexHealth.createIndexHealth(() => {
      window.dispatchEvent(new CustomEvent("eva-cross-view-relations:index-health-changed-v1"));
    });
    return {
      version: PLUGIN_VERSION,
      getAdapterIndexHealthV1: request => this.indexHealth.read(request),
      getAdapterSourceCoverageV1: request => this.indexHealth.readSources(request),
      buildJumpNodeKey: (parts) => buildJumpNodeKey(parts),
      parseJumpNodeKey: (nodeKey) => parseJumpNodeKey(nodeKey),
      registerAdapter: async (descriptor) => await this.registerAdapter(descriptor),
      unregisterAdapter: (adapterId) => this.unregisterAdapter(adapterId),
      releaseAdapterRegistration: (adapterId, owner) => this.releaseAdapterRegistration(adapterId, owner),
      refreshAdapter: async (adapterId) => await this.refreshAdapterIndex(adapterId),
      remapNodeKeys: async (remappings, options = {}) => await this.remapNodeKeys(remappings, options),
      openRelationEditor: async (sourceNodeKey) => await this.openRelationEditor(sourceNodeKey),
      getNodeRelationSnapshot: (nodeKey) => this.getNodeRelationSnapshot(nodeKey),
      getIdentityInventory: (viewType) => this.getIdentityInventory(viewType),
      getOutgoingRelationBatchSnapshot: (options = {}) => this.getOutgoingRelationBatchSnapshot(options),
      getNodeRecord: (nodeKey) => this.getNodeRecord(nodeKey),
      creationContractVersion: 1,
      prepareManagedContextCreationV1: input => this.getManagedCreationOwner().prepare(input),
      inspectManagedContextCreationV1: input => this.getManagedCreationOwner().inspect(input),
      commitManagedContextCreationV1: input => this.getManagedCreationOwner().commit(input),
      ensureRelation: async (input = {}) => await this.ensureRelation(input),
      openNode: async (nodeKey) => await this.openNode(nodeKey),
      consumePendingFocus: (viewType, notePath) => this.consumePendingFocus(viewType, notePath),
      getMetaCaptureState: () => this.getMetaCaptureState(),
      isMetaCaptureActive: () => !!this.metaCapture?.active,
      startMetaCapture: (reasonOrOptions = "api") => this.startMetaCapture(reasonOrOptions),
      stopMetaCapture: (reason = "api") => this.stopMetaCapture(reason),
      cancelMetaCapture: (reason = "api") => this.stopMetaCapture(reason),
      captureMetaNode: async (input = {}) => await this.captureMetaNode(input),
      deleteRelation: async (relationId) => await this.deleteRelation(relationId),
      markLastFocusedNode: (nodeKey) => {
        window.evaCrossViewRelationsLastNodeKey = normalizeNodeKey(nodeKey);
      }
    };
  }

  createEmptyMetaCaptureState() {
    return {
      active: false,
      sessionId: "",
      sourceNodeKey: "",
      sourceLabel: "",
      sourcePlugin: "",
      relationType: DEFAULT_RELATION_TYPE,
      updatedAt: ""
    };
  }

  getMetaCaptureState() {
    const state = this.metaCapture || this.createEmptyMetaCaptureState();
    return {
      active: !!state.active,
      sessionId: state.sessionId || "",
      phase: state.active && state.sourceNodeKey ? "target" : state.active ? "source" : "idle",
      sourceNodeKey: state.sourceNodeKey || "",
      sourceLabel: state.sourceLabel || "",
      sourcePlugin: state.sourcePlugin || "",
      relationType: state.relationType || DEFAULT_RELATION_TYPE,
      updatedAt: state.updatedAt || ""
    };
  }

  startMetaCapture(reasonOrOptions = "api") {
    const options = reasonOrOptions && typeof reasonOrOptions === "object" ? reasonOrOptions : {};
    const reason = typeof reasonOrOptions === "string" ? reasonOrOptions : normalizeOptionalText(options.reason) || "api";
    const relationType = normalizeOptionalText(options.relationType) || DEFAULT_RELATION_TYPE;
    if (!this.metaCapture) this.metaCapture = this.createEmptyMetaCaptureState();
    this.metaCapture.active = true;
    this.metaCapture.sessionId = this.metaCapture.sessionId || `meta_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    this.metaCapture.sourceNodeKey = "";
    this.metaCapture.sourceLabel = "";
    this.metaCapture.sourcePlugin = "";
    this.metaCapture.relationType = relationType;
    this.metaCapture.updatedAt = nowString();
    document.body?.classList?.add("eva-meta-capture-active");
    this.renderMetaCaptureOverlay();
    this.dispatchMetaCaptureChanged(reason);
    console.info("[EVA Relations][meta.start]", { reason, relationType, sessionId: this.metaCapture.sessionId });
    new Notice("EVA Meta：选择来源 A");
    return this.getMetaCaptureState();
  }

  stopMetaCapture(reason = "api", options = {}) {
    if (!this.metaCapture) this.metaCapture = this.createEmptyMetaCaptureState();
    const wasActive = !!this.metaCapture.active;
    this.metaCapture = this.createEmptyMetaCaptureState();
    document.body?.classList?.remove("eva-meta-capture-active");
    this.removeMetaCaptureOverlay();
    if (options.silent !== true && wasActive) {
      this.dispatchMetaCaptureChanged(reason);
      console.info("[EVA Relations][meta.stop]", { reason });
    }
    if (wasActive && options.silent !== true) new Notice("EVA Meta 已退出");
    return this.getMetaCaptureState();
  }

  dispatchMetaCaptureChanged(reason = "update") {
    const detail = { reason, state: this.getMetaCaptureState() };
    window.dispatchEvent(new CustomEvent("eva-cross-view-relations:meta-capture-changed", { detail }));
    window.dispatchEvent(new CustomEvent("eva-cross-view-relations:meta-state-changed", { detail }));
  }

  removeMetaCaptureOverlay() {
    if (this.metaCaptureOverlayEl?.parentElement) this.metaCaptureOverlayEl.remove();
    this.metaCaptureOverlayEl = null;
  }

  renderMetaCaptureOverlay() {
    if (!this.metaCapture?.active) {
      this.removeMetaCaptureOverlay();
      return;
    }
    if (!this.metaCaptureOverlayEl) {
      const overlay = document.createElement("div");
      overlay.className = "eva-meta-capture-overlay";
      const status = document.createElement("div");
      status.className = "eva-meta-capture-status";
      overlay.appendChild(status);
      const resetBtn = document.createElement("button");
      resetBtn.className = "eva-meta-capture-reset";
      resetBtn.type = "button";
      resetBtn.textContent = "重选A";
      resetBtn.onclick = () => {
        this.metaCapture.sourceNodeKey = "";
        this.metaCapture.sourceLabel = "";
        this.metaCapture.sourcePlugin = "";
        this.metaCapture.updatedAt = nowString();
        this.renderMetaCaptureOverlay();
        this.dispatchMetaCaptureChanged("reset-source");
        new Notice("EVA Meta：重新选择来源 A");
      };
      overlay.appendChild(resetBtn);
      const stopBtn = document.createElement("button");
      stopBtn.className = "eva-meta-capture-stop";
      stopBtn.type = "button";
      stopBtn.textContent = "退出";
      stopBtn.onclick = () => this.stopMetaCapture("overlay");
      overlay.appendChild(stopBtn);
      document.body.appendChild(overlay);
      this.metaCaptureOverlayEl = overlay;
    }
    const statusEl = this.metaCaptureOverlayEl.querySelector(".eva-meta-capture-status");
    if (statusEl) {
      const source = this.metaCapture.sourceLabel || this.getNodeRecord(this.metaCapture.sourceNodeKey)?.label || this.metaCapture.sourceNodeKey || "";
      statusEl.textContent = source ? `EVA Meta: A=${source} -> 选择B` : "EVA Meta: 选择来源A";
    }
    const resetBtn = this.metaCaptureOverlayEl.querySelector(".eva-meta-capture-reset");
    if (resetBtn) resetBtn.disabled = !this.metaCapture.sourceNodeKey;
  }

  findExistingRelation(sourceNodeKey, targetNodeKey, relationType = DEFAULT_RELATION_TYPE) {
    const source = normalizeNodeKey(sourceNodeKey);
    const target = normalizeNodeKey(targetNodeKey);
    const type = normalizeOptionalText(relationType) || DEFAULT_RELATION_TYPE;
    if (!source || !target) return null;
    return Object.values(this.state.relationsById || {}).find((relation) => {
      if (!relation) return false;
      return relation.sourceNodeKey === source
        && relation.targetNodeKey === target
        && (relation.relationType || DEFAULT_RELATION_TYPE) === type;
    }) || null;
  }

  async captureMetaNode(input = {}) {
    if (!this.metaCapture?.active) {
      new Notice("EVA Meta 未开启");
      return { ok: false, reason: "inactive", state: this.getMetaCaptureState() };
    }
    const nodeKey = normalizeNodeKey(input.nodeKey || input);
    if (!nodeKey) {
      new Notice("EVA Meta：没有可捕获的 nodeKey");
      return { ok: false, reason: "missing-node-key", state: this.getMetaCaptureState() };
    }
    window.evaCrossViewRelationsLastNodeKey = nodeKey;
    const record = this.getNodeRecord(nodeKey) || {};
    const label = normalizeOptionalText(input.label) || record.label || nodeKey;
    const sourcePlugin = normalizeOptionalText(input.sourcePlugin || input.pluginId || record.viewType);
    if (!this.metaCapture.sourceNodeKey) {
      this.metaCapture.sourceNodeKey = nodeKey;
      this.metaCapture.sourceLabel = label;
      this.metaCapture.sourcePlugin = sourcePlugin;
      this.metaCapture.updatedAt = nowString();
      this.renderMetaCaptureOverlay();
      this.dispatchMetaCaptureChanged("capture-source");
      console.info("[EVA Relations][meta.capture-source]", {
        sessionId: this.metaCapture.sessionId,
        nodeKey,
        label,
        sourcePlugin
      });
      new Notice(`EVA Meta A：${label}`);
      return { ok: true, phase: "target", state: this.getMetaCaptureState() };
    }
    const sourceNodeKey = this.metaCapture.sourceNodeKey;
    if (sourceNodeKey === nodeKey) {
      new Notice("EVA Meta：A 和 B 不能是同一个条目");
      return { ok: false, reason: "same-node", state: this.getMetaCaptureState() };
    }
    const relationType = this.metaCapture.relationType || DEFAULT_RELATION_TYPE;
    const existing = this.findExistingRelation(sourceNodeKey, nodeKey, relationType);
    if (existing) {
      new Notice("EVA Meta：这条关系已经存在");
    } else {
      await this.upsertRelation({
        sourceNodeKey,
        targetNodeKey: nodeKey,
        relationType,
        description: ""
      });
      new Notice(`EVA Meta 已建立：${this.metaCapture.sourceLabel || sourceNodeKey} -> ${label}`);
    }
    console.info("[EVA Relations][meta.capture-target]", {
      sessionId: this.metaCapture.sessionId,
      sourceNodeKey,
      targetNodeKey: nodeKey,
      relationType,
      duplicate: !!existing,
      targetLabel: label,
      targetPlugin: sourcePlugin
    });
    this.metaCapture.sourceNodeKey = "";
    this.metaCapture.sourceLabel = "";
    this.metaCapture.sourcePlugin = "";
    this.metaCapture.updatedAt = nowString();
    this.renderMetaCaptureOverlay();
    this.dispatchMetaCaptureChanged(existing ? "capture-duplicate" : "capture-target");
    return { ok: true, phase: "source", duplicate: !!existing, state: this.getMetaCaptureState() };
  }

  async ensureRelation(input = {}) {
    const relation = this.normalizeRelation(input);
    if (!relation) {
      new Notice("❌ 关系数据无效");
      return { ok: false, reason: "invalid-relation" };
    }
    const existing = this.findExistingRelation(relation.sourceNodeKey, relation.targetNodeKey, relation.relationType);
    if (existing) {
      return {
        ok: true,
        duplicate: true,
        relation: existing,
        relationId: existing.id,
        sourceNodeKey: existing.sourceNodeKey,
        targetNodeKey: existing.targetNodeKey,
        relationType: existing.relationType || DEFAULT_RELATION_TYPE
      };
    }
    const saved = await this.upsertRelation(relation);
    return {
      ok: !!saved,
      duplicate: false,
      relation: saved,
      relationId: saved?.id || "",
      sourceNodeKey: saved?.sourceNodeKey || relation.sourceNodeKey,
      targetNodeKey: saved?.targetNodeKey || relation.targetNodeKey,
      relationType: saved?.relationType || relation.relationType || DEFAULT_RELATION_TYPE
    };
  }

  async registerBuiltinAtomNoteAdapter() {
    await this.registerAdapter({
      adapterId: ATOM_NOTE_ADAPTER_ID,
      viewType: ATOM_NOTE_VIEW_TYPE,
      notePath: ATOM_NOTE_SCOPE_PATH,
      viewLabel: "EVA Note",
      listItems: () => this.listAtomNoteRelationItems(),
      openNode: async (nodeKey, context = {}) => await this.openAtomNoteNode(nodeKey, context)
    });
  }

  registerBuiltinAtomNoteRefreshEvents() {
    if (this.atomNoteRefreshEventsRegistered) return;
    this.atomNoteRefreshEventsRegistered = true;
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file instanceof TFile && parseAtomIdFromText(file.name)) this.scheduleAtomNoteAdapterRefresh("create");
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (!(file instanceof TFile)) return;
      if (parseAtomIdFromText(file.name) || parseAtomIdFromText(oldPath)) this.scheduleAtomNoteAdapterRefresh("rename");
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file instanceof TFile && parseAtomIdFromText(file.name || file.path)) this.scheduleAtomNoteAdapterRefresh("delete");
    }));
  }

  scheduleAtomNoteAdapterRefresh(reason = "vault-event") {
    if (this.atomNoteRefreshTimer) window.clearTimeout(this.atomNoteRefreshTimer);
    this.atomNoteRefreshTimer = window.setTimeout(async () => {
      this.atomNoteRefreshTimer = null;
      console.info("[EVA Relations][atom-note.refresh]", { reason });
      await this.refreshAdapterIndex(ATOM_NOTE_ADAPTER_ID);
    }, 240);
  }

  listAtomNoteRelationItems() {
    return this.app.vault.getMarkdownFiles()
      .filter((file) => parseAtomIdFromText(file.name))
      .map((file) => {
        const atomId = parseAtomIdFromText(file.name);
        const ctime = Number(file.stat?.ctime) || 0;
        const mtime = Number(file.stat?.mtime) || 0;
        const scopeId = ctime ? `ctime:${ctime}` : `atom:${atomId}`;
        const nodeKey = buildJumpNodeKey({
          viewType: ATOM_NOTE_VIEW_TYPE,
          notePath: ATOM_NOTE_SCOPE_PATH,
          scopeType: "note",
          scopeId,
          itemId: ATOM_NOTE_ITEM_ID
        });
        return {
          nodeKey,
          label: file.basename,
          pathLabel: file.path,
          searchText: `${file.basename} ${file.path} ${atomId} ${ctime}`,
          metaFields: [
            { key: "atomId", label: "atomId", value: atomId },
            { key: "path", label: "path", value: file.path },
            { key: "ctime", label: "ctime", value: String(ctime || "") },
            { key: "mtime", label: "mtime", value: String(mtime || "") }
          ]
        };
      });
  }

  resolveAtomNoteFile(record = {}, parsed = null) {
    const path = getRecordMetaValue(record, "path") || normalizeOptionalText(record.pathLabel);
    if (path) {
      const byPath = this.app.vault.getAbstractFileByPath(path);
      if (byPath instanceof TFile) return byPath;
    }
    const parsedScopeId = normalizeOptionalText(parsed?.scopeId);
    const ctimeText = getRecordMetaValue(record, "ctime") || (parsedScopeId.startsWith("ctime:") ? parsedScopeId.slice("ctime:".length) : "");
    const ctime = Number(ctimeText);
    const files = this.app.vault.getMarkdownFiles();
    if (Number.isFinite(ctime) && ctime > 0) {
      const ctimeMatches = files.filter((file) => Number(file.stat?.ctime) === ctime);
      if (ctimeMatches.length === 1) return ctimeMatches[0];
    }
    const atomId = getRecordMetaValue(record, "atomId")
      || (parsedScopeId.startsWith("atom:") ? parsedScopeId.slice("atom:".length) : "")
      || parseAtomIdFromText(record.label)
      || parseAtomIdFromText(path);
    if (atomId) {
      const atomMatches = files.filter((file) => parseAtomIdFromText(file.name).toLowerCase() === atomId.toLowerCase());
      if (atomMatches.length === 1) return atomMatches[0];
    }
    return null;
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
        console.warn("[EVA Relations][leaf.activate-failed]", { error: innerError || error });
      }
    }
    return false;
  }

  getRightmostRootLeaf() {
    if (typeof this.app.workspace.iterateRootLeaves !== "function") return null;
    let rightmost = null;
    this.app.workspace.iterateRootLeaves((leaf) => {
      rightmost = leaf || rightmost;
    });
    return rightmost;
  }

  getLeafDiagnostic(leaf) {
    return {
      viewType: normalizeOptionalText(leaf?.view?.getViewType?.() || leaf?.view?.getState?.()?.type || leaf?.view?.constructor?.name),
      filePath: normalizeOptionalText(leaf?.view?.file?.path)
    };
  }

  createRightmostTabLeaf() {
    const rightmostLeaf = this.getRightmostRootLeaf();
    if (rightmostLeaf && this.activateLeaf(rightmostLeaf, true) && typeof this.app.workspace.getLeaf === "function") {
      try {
        return {
          leaf: this.app.workspace.getLeaf("tab"),
          strategy: "activate-rightmost:getLeaf:tab",
          rightmostLeaf
        };
      } catch (error) {
        console.warn("[EVA Relations][leaf.get-tab-failed]", { error });
      }
    }
    if (typeof this.app.workspace.getLeaf === "function") {
      try {
        return {
          leaf: this.app.workspace.getLeaf("split", "vertical"),
          strategy: "getLeaf:split:vertical",
          rightmostLeaf
        };
      } catch (error) {
        console.warn("[EVA Relations][leaf.get-split-failed]", { error });
      }
      return {
        leaf: this.app.workspace.getLeaf(true),
        strategy: "getLeaf:true:fallback",
        rightmostLeaf
      };
    }
    return { leaf: null, strategy: "unavailable", rightmostLeaf };
  }

  async openFilePreferExistingLeaf(file, options = {}) {
    if (!(file instanceof TFile)) return false;
    const existingLeaf = this.findOpenRootLeafForFile(file);
    const activeLeaf = this.app.workspace.activeLeaf || null;
    const source = normalizeOptionalText(options.source) || "unknown";
    if (existingLeaf) {
      this.activateLeaf(existingLeaf, true);
      console.info("[EVA Relations][atom-note.open.leaf-strategy]", {
        source,
        targetPath: file.path,
        chosenLeafWasExisting: true,
        strategy: "activate-existing",
        activeLeaf: this.getLeafDiagnostic(activeLeaf),
        chosenLeaf: this.getLeafDiagnostic(existingLeaf)
      });
      return true;
    }
    const created = this.createRightmostTabLeaf();
    const leaf = created.leaf;
    if (!leaf) return false;
    await leaf.openFile(file, { active: true });
    console.info("[EVA Relations][atom-note.open.leaf-strategy]", {
      source,
      targetPath: file.path,
      chosenLeafWasExisting: false,
      strategy: created.strategy,
      activeLeaf: this.getLeafDiagnostic(activeLeaf),
      rightmostLeaf: this.getLeafDiagnostic(created.rightmostLeaf),
      chosenLeaf: this.getLeafDiagnostic(leaf)
    });
    return true;
  }

  async openAtomNoteNode(nodeKey, context = {}) {
    const parsed = parseJumpNodeKey(nodeKey);
    const record = context.record || this.getNodeRecord(nodeKey) || {};
    const file = this.resolveAtomNoteFile(record, parsed);
    if (!(file instanceof TFile)) {
      console.warn("[EVA Relations][atom-note.open-missing]", {
        nodeKey,
        path: getRecordMetaValue(record, "path") || record.pathLabel || "",
        ctime: getRecordMetaValue(record, "ctime") || "",
        atomId: getRecordMetaValue(record, "atomId") || ""
      });
      return false;
    }
    await this.openFilePreferExistingLeaf(file, { source: "eva-note-adapter" });
    return true;
  }

  async loadState() {
    const saved = await this.loadData();
    const next = createEmptyState();
    next.relationsById = cloneJson(saved?.relationsById || {}, {});
    if(saved && Object.hasOwn(saved,EvaCreationModule.FIELD))next[EvaCreationModule.FIELD]=cloneJson(saved[EvaCreationModule.FIELD],{});
    next.nodeIndexByKey = cloneJson(saved?.nodeIndexByKey || {}, {});
    next.pinnedNodeKeys = this.normalizePinnedNodeKeys(saved?.pinnedNodeKeys || []);
    next.autoPinnedSourceNodeKey = normalizeNodeKey(saved?.autoPinnedSourceNodeKey);
    next.lastRelationEditorSourceNodeKey = normalizeNodeKey(saved?.lastRelationEditorSourceNodeKey);
    next.updated = normalizeOptionalText(saved?.updated);
    this.state = next;
    this.invalidateSearchCatalog();
  }

  scheduleSave(reason = "update", options = {}) {
    this._pendingSaveReasons = this._pendingSaveReasons || new Set();
    if (options.dispatch !== false) this._pendingSaveReasons.add(reason);
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.flushSavedState().catch((error) => console.error("[EVA Relations][persist.failed]", { reason, error }));
    }, 180);
  }

  flushSavedState(reason = "") {
    if (reason) {
      this._pendingSaveReasons = this._pendingSaveReasons || new Set();
      this._pendingSaveReasons.add(reason);
    }
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this._indexPersistencePending = (this._indexPersistencePending || 0) + 1;
    const run = (this._saveQueue || Promise.resolve()).catch(() => {}).then(async () => {
      const reasons = [...(this._pendingSaveReasons || [])];
      this._pendingSaveReasons = new Set();
      this.state.updated = nowString();
      const snapshot = cloneJson(this.state, null);
      try { await this.saveData(snapshot); this._indexPersistenceFailed = false; }
      catch (error) {
        this._indexPersistenceFailed = true;
        reasons.forEach((item) => this._pendingSaveReasons.add(item));
        throw error;
      }
      if (reasons.length) this.dispatchChanged(reasons.join(","));
    }).finally(() => { this._indexPersistencePending -= 1; });
    this._saveQueue = run;
    // Track actual state persistence separately from creation request validation.
    this._indexPersistenceFence = run;
    return run;
  }

  getIdentityInventory(viewType) {
    // Bounded to one requested owner, complete, and detached from mutable state.
    if (viewType !== "keyword-index-plugin") throw new Error("Unsupported identity inventory owner");
    const keys = new Set();
    const add = (key) => { if (parseJumpNodeKey(key)?.viewType === viewType) keys.add(key); };
    Object.keys(this.state.nodeIndexByKey || {}).forEach(add);
    Object.values(this.state.relationsById || {}).forEach((relation) => { add(relation.sourceNodeKey); add(relation.targetNodeKey); });
    (this.state.pinnedNodeKeys || []).forEach(add);
    add(this.state.autoPinnedSourceNodeKey); add(this.state.lastRelationEditorSourceNodeKey);
    add(window.evaCrossViewRelationsLastNodeKey);
    return { contractVersion: 1, viewType, complete: true, nodeKeys: [...keys].sort() };
  }

  dispatchChanged(reason = "update") {
    window.dispatchEvent(new CustomEvent("eva-cross-view-relations:changed", {
      detail: { reason, updated: this.state.updated || nowString() }
    }));
  }

  normalizeAdapterDescriptor(descriptor = {}) {
    const adapterId = normalizeText(descriptor.adapterId);
    const viewType = normalizeText(descriptor.viewType);
    const notePath = normalizeText(descriptor.notePath);
    if (!adapterId || !viewType || !notePath) return null;
    if (typeof descriptor.listItems !== "function") return null;
    return {
      adapterId,
      viewType,
      notePath,
      viewLabel: normalizeOptionalText(descriptor.viewLabel) || viewType,
      registrationOwner: descriptor.registrationOwner && typeof descriptor.registrationOwner === "object" ? descriptor.registrationOwner : null,
      listItems: descriptor.listItems,
      verifyIndexReplacementV1: typeof descriptor.verifyIndexReplacementV1 === "function" ? descriptor.verifyIndexReplacementV1 : null,
      openNode: typeof descriptor.openNode === "function" ? descriptor.openNode : null
    };
  }

  async registerAdapter(descriptor) {
    const normalized = this.normalizeAdapterDescriptor(descriptor);
    if (!normalized) return null;
    this.adapters.set(normalized.adapterId, normalized);
    await this.refreshAdapterIndex(normalized.adapterId);
    return true;
  }

  pruneScopedAdapterIndex(adapter) {
    if (!adapter?.adapterId || !adapter?.viewType || !adapter?.notePath) return { changed: false, removed: [] };
    const removed = [];
    Object.keys(this.state.nodeIndexByKey || {}).forEach((nodeKey) => {
      const record = this.state.nodeIndexByKey?.[nodeKey];
      if (!record) return;
      if (record.adapterId === adapter.adapterId) return;
      if (normalizeText(record.viewType) !== adapter.viewType) return;
      if (normalizeText(record.notePath) !== adapter.notePath) return;
      removed.push({
        nodeKey,
        label: record.label || "",
        adapterId: record.adapterId || ""
      });
      this.invalidateSearchCatalog();
      delete this.state.nodeIndexByKey[nodeKey];
    });
    if (removed.length > 0) {
      console.info("[EVA Relations][index.scoped-prune]", {
        viewType: adapter.viewType,
        notePath: adapter.notePath,
        adapterId: adapter.adapterId,
        removedCount: removed.length,
        removed: removed.slice(0, 20)
      });
    }
    return { changed: removed.length > 0, removed };
  }

  unregisterAdapter(adapterId) {
    const key = normalizeText(adapterId);
    if (!key || this.adapters.get(key)?.registrationOwner) return;
    this.indexHealth?.unregister(key);
    this.adapters.delete(key);
  }

  releaseAdapterRegistration(adapterId, owner) {
    const key = normalizeText(adapterId), adapter = this.adapters.get(key);
    if (!owner || !adapter || adapter.registrationOwner !== owner) return false;
    // Remove ownership before notifying: listeners cannot refresh the released callback.
    this.adapters.delete(key);
    const persisted = !this._indexPersistencePending && !this._indexPersistenceFailed && !this._pendingSaveReasons?.size;
    this.indexHealth?.detach(key, persisted);
    return true;
  }

  normalizeNodeRecord(adapter, item) {
    const nodeKey = normalizeNodeKey(item?.nodeKey);
    if (!nodeKey) return null;
    const label = normalizeOptionalText(item?.label) || nodeKey;
    const pathLabel = normalizeOptionalText(item?.pathLabel) || adapter.notePath;
    const metaFields = normalizeMetaFields(item?.metaFields);
    const metaSearchText = metaFields.map((field) => `${field.label} ${field.value}`).join(" ");
    const searchText = normalizeOptionalText([item?.searchText || `${label} ${pathLabel} ${adapter.viewType}`, metaSearchText].filter(Boolean).join(" "));
    return {
      nodeKey,
      label,
      pathLabel,
      searchText,
      metaFields,
      notePath: adapter.notePath,
      viewType: adapter.viewType,
      viewLabel: adapter.viewLabel,
      adapterId: adapter.adapterId
    };
  }

  async refreshAdapterIndex(adapterId) {
    const adapter = this.adapters.get(normalizeText(adapterId));
    if (!adapter) return [];
    const health = this.indexHealth;
    const token = health.begin(adapter);
    if (!token) return [];
    const current = () => !this.unloaded && this.adapters.get(adapter.adapterId) === adapter && health.current(adapter.adapterId, token);
    let outcome = 'refresh-failed', changed = false;
    try {
    this.refreshIssues ||= new Set();this.refreshIssues.delete(adapter.adapterId);
    let rawItems = [];
    try {
      rawItems = await Promise.resolve(adapter.listItems());
    } catch (error) {
      if (!current()) return [];
      this.refreshIssues.add(adapter.adapterId);
      console.error("[EVA Relations] 刷新适配器索引失败:", error);
      return [];
    }
    if (!current()) return [];
    if (!Array.isArray(rawItems)) {
      outcome = 'invalid-list';
      this.refreshIssues.add(adapter.adapterId);
      console.warn("[EVA Relations][index.refresh-skip] adapter returned non-array items", {
        adapterId: adapter.adapterId,
        viewType: adapter.viewType,
        notePath: adapter.notePath
      });
      return [];
    }
    const nextItems = rawItems;
    const previousRecords = Object.values(this.state.nodeIndexByKey || {})
      .filter((record) => record?.adapterId === adapter.adapterId)
      .map((record) => ({
        nodeKey: record.nodeKey,
        label: record.label,
        pathLabel: record.pathLabel,
        searchText: record.searchText,
        metaFields: record.metaFields,
        notePath: record.notePath,
        viewType: record.viewType,
        viewLabel: record.viewLabel,
        adapterId: record.adapterId
      }))
      .sort((a, b) => a.nodeKey.localeCompare(b.nodeKey, "zh-Hans-CN"));
    if (nextItems.length === 0 && previousRecords.length > 0 && !['workspace-mount-view', 'mandala-time-blocks', 'gtd'].includes(adapter.viewType)) {
      outcome = 'empty-retained';
      this.refreshIssues.add(adapter.adapterId);
      console.warn("[EVA Relations][index.refresh-skip-empty] adapter returned empty items; keeping previous index", {
        adapterId: adapter.adapterId,
        viewType: adapter.viewType,
        notePath: adapter.notePath,
        previousCount: previousRecords.length
      });
      return previousRecords;
    }
    // Validate the whole snapshot before either scoped pruning or replacement.
    // A list from an observed source is not proof that omitted historical IDs were deleted.
    const protectedTypes = new Set(['workspace-mount-view', 'mandala-time-blocks', 'gtd']);
    const protectedScope = protectedTypes.has(adapter.viewType);
    const priorScope = Object.values(this.state.nodeIndexByKey || {}).filter((record) =>
      record?.adapterId === adapter.adapterId ||
      (normalizeText(record?.viewType) === adapter.viewType && normalizeText(record?.notePath) === adapter.notePath));
    const normalizedItems = [];
    const seenKeys = new Set();
    let batchIssue = '';
    for (const item of nextItems) {
      const record = this.normalizeNodeRecord(adapter, item);
      if (!record) {
        if (protectedScope) { batchIssue = 'invalid-record'; break; }
        continue;
      }
      const address = parseJumpNodeKey(record.nodeKey);
      if (protectedScope && (!address || address.nodeKey !== record.nodeKey ||
          address.viewType !== adapter.viewType || address.notePath !== adapter.notePath)) {
        batchIssue = 'invalid-address'; break;
      }
      // An unprotected adapter cannot impersonate a protected source either.
      if (address && protectedTypes.has(address.viewType) &&
          (address.viewType !== adapter.viewType || address.notePath !== adapter.notePath ||
           address.nodeKey !== record.nodeKey)) {
        batchIssue = 'foreign-address'; break;
      }
      const existing = this.state.nodeIndexByKey?.[record.nodeKey];
      if (existing && (existing.viewType !== adapter.viewType || existing.notePath !== adapter.notePath)) {
        batchIssue = 'foreign-record'; break;
      }
      if (protectedScope && seenKeys.has(record.nodeKey)) {
        batchIssue = 'duplicate-record'; break;
      }
      seenKeys.add(record.nodeKey);
      normalizedItems.push(record);
    }
    if (!batchIssue && protectedScope && priorScope.some((record) => !seenKeys.has(record.nodeKey))) {
      batchIssue = 'partial-retained';
      if (adapter.verifyIndexReplacementV1) {
        const scopedFingerprint = () => JSON.stringify(Object.values(this.state.nodeIndexByKey || {}).filter(record =>
          record?.adapterId === adapter.adapterId ||
          (normalizeText(record?.viewType) === adapter.viewType && normalizeText(record?.notePath) === adapter.notePath))
          .sort((a,b) => String(a.nodeKey).localeCompare(String(b.nodeKey))));
        const beforeProof = scopedFingerprint();
        const requestToken = {};
        const nodeKeys = Object.freeze([...seenKeys].sort());
        const request = Object.freeze({version:1, adapterId:adapter.adapterId, viewType:adapter.viewType, notePath:adapter.notePath, requestToken, nodeKeys});
        try {
          const proof = await adapter.verifyIndexReplacementV1(request);
          if (!current()) return [];
          const collision = normalizedItems.some(record => {
            const existing = this.state.nodeIndexByKey?.[record.nodeKey];
            return existing && (existing.viewType !== adapter.viewType || existing.notePath !== adapter.notePath);
          });
          if (beforeProof !== scopedFingerprint() || collision) {
            batchIssue = 'replacement-precondition-changed';
          } else if (proof?.version === 1 && proof.kind === 'persisted-owner-membership' &&
              proof.requestToken === requestToken && proof.adapterId === adapter.adapterId &&
              proof.viewType === adapter.viewType && proof.notePath === adapter.notePath &&
              typeof proof.sourcePath === 'string' && proof.sourcePath.trim() &&
              typeof proof.revision === 'string' && /^[a-f0-9]{64}$/.test(proof.revision) &&
              Array.isArray(proof.nodeKeys) && JSON.stringify(proof.nodeKeys) === JSON.stringify(nodeKeys)) {
            batchIssue = '';
          } else batchIssue = 'replacement-proof-invalid';
        } catch (error) {
          if (!current()) return [];
          batchIssue = 'replacement-proof-unavailable';
        }
      }
    }
    if (batchIssue) {
      outcome = batchIssue;
      this.refreshIssues.add(adapter.adapterId);
      return priorScope;
    }
    this.invalidateSearchCatalog();
    const scopedPruned = this.pruneScopedAdapterIndex(adapter);
    Object.keys(this.state.nodeIndexByKey || {}).forEach((nodeKey) => {
      if (this.state.nodeIndexByKey[nodeKey]?.adapterId === adapter.adapterId) {
        delete this.state.nodeIndexByKey[nodeKey];
      }
    });
    normalizedItems.forEach((record) => {
      this.state.nodeIndexByKey[record.nodeKey] = record;
    });
    const nextRecords = Object.values(this.state.nodeIndexByKey || {})
      .filter((record) => record?.adapterId === adapter.adapterId)
      .map((record) => ({
        nodeKey: record.nodeKey,
        label: record.label,
        pathLabel: record.pathLabel,
        searchText: record.searchText,
        metaFields: record.metaFields,
        notePath: record.notePath,
        viewType: record.viewType,
        viewLabel: record.viewLabel,
        adapterId: record.adapterId
      }))
      .sort((a, b) => a.nodeKey.localeCompare(b.nodeKey, "zh-Hans-CN"));
    // Index refresh is not an explicit request to delete ordinary historical relations.
    changed = JSON.stringify(previousRecords) !== JSON.stringify(nextRecords) || scopedPruned.changed;
    if (changed) {
      health.markDirty(adapter.adapterId, token);
      await this.flushSavedState("index");
    } else if (this._pendingSaveReasons?.size || this._indexPersistenceFailed) {
      // A prior failed persistence must be retryable even if the in-memory index matches.
      await this.flushSavedState();
    }
    // An earlier refresh may already have consumed pending reasons while saving
    // this same in-memory index. Do not declare it ready before that save settles.
    // Await actual persistence only, not rejected creation validation jobs.
    // Unchanged render tails must not start a save.
    if (this._indexPersistenceFence) await this._indexPersistenceFence;
    outcome = '';
    return nextItems;
    } catch (error) {
      if (current()) this.refreshIssues.add(adapter.adapterId);
      throw error;
    } finally {
      if (current()) health.finish(adapter.adapterId, token, outcome, changed);
    }
  }

  async refreshAllAdapters() {
    if(this.allRefreshPromise)return this.allRefreshPromise;
    const run=(async()=>{for(const id of [...this.adapters.keys()]){if(this.unloaded)break;await this.refreshAdapterIndex(id);}})();
    this.allRefreshPromise=run;
    try{return await run;}finally{if(this.allRefreshPromise===run)this.allRefreshPromise=null;}
  }

  normalizePinnedNodeKeys(value) {
    const seen = new Set();
    const result = [];
    (Array.isArray(value) ? value : []).forEach((item) => {
      const nodeKey = normalizeNodeKey(item);
      if (!nodeKey || seen.has(nodeKey)) return;
      seen.add(nodeKey);
      result.push(nodeKey);
    });
    return result;
  }

  getPinnedNodeKeys() {
    this.state.pinnedNodeKeys = this.normalizePinnedNodeKeys(this.state.pinnedNodeKeys || []);
    return [...this.state.pinnedNodeKeys];
  }

  rememberRelationEditorSource(sourceNodeKey) {
    const key = normalizeNodeKey(sourceNodeKey);
    if (!key) return false;
    const previous = normalizeNodeKey(this.state.lastRelationEditorSourceNodeKey);
    let changed = false;
    if (previous && previous !== key && this.getNodeRecord(previous)) {
      this.state.autoPinnedSourceNodeKey = previous;
      changed = true;
    }
    if (this.state.lastRelationEditorSourceNodeKey !== key) {
      this.state.lastRelationEditorSourceNodeKey = key;
      changed = true;
    }
    if (changed) this.scheduleSave("relation-editor-source-remember");
    return changed;
  }

  getAutoPinnedNodeRecord(options = {}) {
    const excludeNodeKey = normalizeNodeKey(options.excludeNodeKey);
    const nodeKey = normalizeNodeKey(this.state.autoPinnedSourceNodeKey);
    if (!nodeKey || nodeKey === excludeNodeKey) return null;
    return {
      nodeKey,
      record: this.getNodeRecord(nodeKey),
      isAutoPinnedSource: true
    };
  }

  isNodePinned(nodeKey) {
    const key = normalizeNodeKey(nodeKey);
    return !!key && this.getPinnedNodeKeys().includes(key);
  }

  addPinnedNodeKey(nodeKey) {
    const key = normalizeNodeKey(nodeKey);
    if (!key) return false;
    const current = this.getPinnedNodeKeys();
    if (current.includes(key)) return false;
    this.state.pinnedNodeKeys = [key, ...current].slice(0, 80);
    this.scheduleSave("pin-add");
    return true;
  }

  removePinnedNodeKey(nodeKey) {
    const key = normalizeNodeKey(nodeKey);
    if (!key) return false;
    const current = this.getPinnedNodeKeys();
    const next = current.filter((item) => item !== key);
    if (next.length === current.length) return false;
    this.state.pinnedNodeKeys = next;
    this.scheduleSave("pin-remove");
    return true;
  }

  clearPinnedNodeKeys() {
    if (this.getPinnedNodeKeys().length === 0) return false;
    this.state.pinnedNodeKeys = [];
    this.scheduleSave("pin-clear");
    return true;
  }

  getPinnedNodeRecords(options = {}) {
    const excludeNodeKey = normalizeNodeKey(options.excludeNodeKey);
    const autoPinned = this.getAutoPinnedNodeRecord({ excludeNodeKey });
    const autoPinnedKey = normalizeNodeKey(autoPinned?.nodeKey);
    const records = [];
    if (autoPinned) records.push(autoPinned);
    this.getPinnedNodeKeys()
      .filter((nodeKey) => nodeKey !== excludeNodeKey && nodeKey !== autoPinnedKey)
      .forEach((nodeKey) => records.push({
        nodeKey,
        record: this.getNodeRecord(nodeKey),
        isAutoPinnedSource: false
      }));
    return records;
  }

  getManualPinnedNodeRecords(options = {}) {
    const excludeNodeKey = normalizeNodeKey(options.excludeNodeKey);
    return this.getPinnedNodeKeys()
      .filter((nodeKey) => nodeKey !== excludeNodeKey)
      .map((nodeKey) => ({
        nodeKey,
        record: this.getNodeRecord(nodeKey),
        isAutoPinnedSource: false
      }));
  }

  getNodeRecord(nodeKey) {
    const key = normalizeNodeKey(nodeKey);
    if (!key) return null;
    return cloneJson(this.state.nodeIndexByKey?.[key] || null, null);
  }

  getEnrichedRelation(relation) {
    return {
      ...relation,
      source: this.getNodeRecord(relation.sourceNodeKey),
      target: this.getNodeRecord(relation.targetNodeKey)
    };
  }

  getNodeRelationSnapshot(nodeKey) {
    const key = normalizeNodeKey(nodeKey);
    const outgoing = [];
    const incoming = [];
    Object.values(this.state.relationsById || {}).forEach((relation) => {
      if (!relation) return;
      if (relation.sourceNodeKey === key) outgoing.push(this.getEnrichedRelation(relation));
      if (relation.targetNodeKey === key) incoming.push(this.getEnrichedRelation(relation));
    });
    return {
      outgoing: sortByLocale(outgoing, (item) => item.target?.label || item.targetNodeKey),
      incoming: sortByLocale(incoming, (item) => item.source?.label || item.sourceNodeKey)
    };
  }

  getOutgoingRelationBatchSnapshot(options = {}) {
    const requestedPurpose = options && typeof options === "object" && !Array.isArray(options) ? options.readPurpose : null;
    const readPurpose = requestedPurpose === undefined ? "display" : requestedPurpose;
    const reject = code => ({ ok: false, complete: false, decisionComplete: false, providerId: "eva-cross-view-relations",
      count: 0, returnedCount: 0, results: [], reason: code, diagnostics: [{ code }] });
    if (readPurpose !== "display" && readPurpose !== "operation-check") return reject("read-purpose-invalid");
    if (readPurpose === "operation-check") {
      const keys = options.sourceNodeKeys === undefined ? [] : options.sourceNodeKeys;
      if (!Array.isArray(keys) || keys.length > OUTGOING_RELATION_BATCH_MAX_SOURCES
          || keys.some(key => typeof key !== "string" || !normalizeNodeKey(key) || key.length > 8192)
          || typeof options.relationType !== "string" || !normalizeOptionalText(options.relationType)
          || new Set(keys.map(normalizeNodeKey)).size !== keys.length) return reject("invalid-saved-relation-request");
      options = Object.freeze({ sourceNodeKeys: Object.freeze(keys.map(normalizeNodeKey)), relationType: normalizeOptionalText(options.relationType) });
    }
    const project = (relations, generation, saved) => {
    const generatedAt = nowString();
    const requested = Array.isArray(options?.sourceNodeKeys)
      ? options.sourceNodeKeys.map((value) => normalizeNodeKey(value)).filter(Boolean)
      : [];
    const relationType = normalizeOptionalText(options?.relationType);
    const fail = (reason, diagnostics = []) => ({
      ok: false,
      complete: false,
      decisionComplete: false,
      contractVersion: OUTGOING_RELATION_BATCH_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
      snapshotType: "eva-outgoing-relation-batch-v1",
      providerId: "eva-cross-view-relations",
      providerGeneration: generation,
      generatedAt,
      revision: "",
      requestCount: requested.length,
      count: 0,
      returnedCount: 0,
      limit: OUTGOING_RELATION_BATCH_MAX_SOURCES,
      hasMore: false,
      truncated: false,
      results: [],
      diagnostics: [{ code: reason }].concat(Array.isArray(diagnostics) ? diagnostics : []),
      reason
    });
    if (requested.length > OUTGOING_RELATION_BATCH_MAX_SOURCES) {
      return fail("source-request-limit-exceeded", [{
        code: "source-request-limit-exceeded",
        requestCount: requested.length,
        limit: OUTGOING_RELATION_BATCH_MAX_SOURCES
      }]);
    }
    if (new Set(requested).size !== requested.length) return fail("duplicate-source-request");
    if (!relationType) return fail("missing-relation-type");
    const requestedSet = new Set(requested);
    const bySource = new Map(requested.map((sourceNodeKey) => [sourceNodeKey, []]));
    let relationVisitCount = 0;
    const seenIds = new Set();
    for (const [storedId, raw] of Object.entries(relations || {})) {
      relationVisitCount += 1;
      if (saved && (!raw || typeof raw !== "object" || Array.isArray(raw) || typeof raw.sourceNodeKey !== "string" || !normalizeNodeKey(raw.sourceNodeKey))) return fail("malformed-relation-source");
      if (!raw || !requestedSet.has(normalizeNodeKey(raw.sourceNodeKey))) continue;
      if (saved && (typeof raw.targetNodeKey !== "string" || typeof raw.relationType !== "string"
          || (raw.id !== undefined && typeof raw.id !== "string"))) return fail("malformed-matching-relation");
      const id = normalizeOptionalText(raw.id || storedId);
      const sourceNodeKey = normalizeNodeKey(raw.sourceNodeKey);
      const targetNodeKey = normalizeNodeKey(raw.targetNodeKey);
      const storedType = normalizeOptionalText(raw.relationType);
      if (!id || !sourceNodeKey || !targetNodeKey || !storedType) {
        return fail("malformed-matching-relation", [{ code: "malformed-matching-relation", storedId, sourceNodeKey }]);
      }
      if (saved && seenIds.has(id)) return fail("matching-relation-identity-conflict");
      if (saved) seenIds.add(id);
      if (storedType !== relationType) continue;
      bySource.get(sourceNodeKey).push({
        id,
        sourceNodeKey,
        targetNodeKey,
        relationType: storedType
      });
    }
    const revisionEvidence = [];
    const results = requested.map((sourceNodeKey, requestIndex) => {
      const matches = (bySource.get(sourceNodeKey) || []).sort((left, right) => (
        `${left.id}\u0000${left.targetNodeKey}`.localeCompare(`${right.id}\u0000${right.targetNodeKey}`, "en")
      ));
      matches.forEach((item) => revisionEvidence.push(item));
      return {
        ok: true,
        complete: true,
        decisionComplete: true,
        requestIndex,
        sourceNodeKey,
        relationType,
        totalCount: matches.length,
        uniqueItem: matches.length === 1 ? cloneJson(matches[0], null) : null,
        diagnosticSample: cloneJson(matches.slice(0, 2), []),
        diagnosticSampleTruncated: matches.length > 2
      };
    });
    const revision = createHash("sha256").update(JSON.stringify({
      relationType,
      sourceNodeKeys: requested,
      evidence: revisionEvidence.sort((left, right) => (
        `${left.sourceNodeKey}\u0000${left.id}\u0000${left.targetNodeKey}`.localeCompare(`${right.sourceNodeKey}\u0000${right.id}\u0000${right.targetNodeKey}`, "en")
      ))
    }), "utf8").digest("hex");
    return {
      ok: true,
      complete: true,
      decisionComplete: true,
      contractVersion: OUTGOING_RELATION_BATCH_CONTRACT_VERSION,
      readPurpose, writeAuthorization: false,
      snapshotType: "eva-outgoing-relation-batch-v1",
      providerId: "eva-cross-view-relations",
      providerGeneration: generation,
      generatedAt,
      revision,
      requestCount: requested.length,
      count: results.length,
      returnedCount: results.length,
      limit: OUTGOING_RELATION_BATCH_MAX_SOURCES,
      hasMore: false,
      truncated: false,
      relationVisitCount,
      results,
      diagnostics: []
    };
    };
    if (readPurpose === "display") return project(this.state?.relationsById, PLUGIN_VERSION + "|" + normalizeOptionalText(this.state?.updated), false);
    return (async () => {
      try {
        const saved = await __OwnerSavedObservationV1.read(this, { providerId: "eva-cross-view-relations",
          apiKey: "api", unloadKey: "unloaded", max: 256 * 1024 * 1024, parse: EvaCreationModule.parse });
        const result = project(saved.data.relationsById, saved.session, true);
        if (result?.ok !== true) return result;
        result.revision = __OwnerSavedObservationV1.hash(JSON.stringify(["operation-check", saved.ownerPath, result.revision]));
        result.inputObservation = saved.evidence(result.revision);
        saved.guard();
        return __OwnerSavedObservationV1.freeze(result);
      } catch (_) { return reject("eva-saved-observation-unavailable"); }
    })();
  }

  invalidateSearchCatalog(){this.searchCatalog=null;this.searchRevision=(this.searchRevision||0)+1;}
  searchNodes(query, options = {}) {
    const text=normalizeText(query).toLowerCase(),excludeNodeKey=normalizeNodeKey(options.excludeNodeKey),limit=Math.floor(Math.max(1,Number(options.limit)||50));
    const index=this.state.nodeIndexByKey||{};
    if(!this.searchCatalog||this.searchCatalog.index!==index){
      const records=sortByLocale(Object.values(index).filter(Boolean),item=>`${item.label} ${item.pathLabel}`);
      this.searchCatalog={index,entries:records.map(record=>({record,haystack:`${record.label} ${record.pathLabel} ${record.searchText} ${record.viewType}`.toLowerCase()}))};
    }
    const result=[];
    for(const {record,haystack}of this.searchCatalog.entries){if(record.nodeKey===excludeNodeKey||(text&&!haystack.includes(text)))continue;result.push(cloneJson(record,{}));if(result.length>=limit)break;}
    return result;
  }

  normalizeRelation(input = {}) {
    const sourceNodeKey = normalizeNodeKey(input.sourceNodeKey);
    const targetNodeKey = normalizeNodeKey(input.targetNodeKey);
    if (!sourceNodeKey || !targetNodeKey) return null;
    return {
      id: normalizeOptionalText(input.id) || `rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      sourceNodeKey,
      targetNodeKey,
      relationType: normalizeOptionalText(input.relationType) || DEFAULT_RELATION_TYPE,
      description: normalizeOptionalText(input.description),
      createdAt: normalizeOptionalText(input.createdAt) || nowString(),
      updatedAt: nowString()
    };
  }

  async upsertRelation(input) {
    const relation = this.normalizeRelation(input);
    if (!relation) {
      new Notice("❌ 关系数据无效");
      return null;
    }
    this.state.relationsById[relation.id] = relation;
    this.scheduleSave("relation-upsert");
    return relation;
  }

  async deleteRelation(relationId) {
    const key = normalizeText(relationId);
    if (!key || !this.state.relationsById[key]) return;
    for(const r of Object.values(this.state[EvaCreationModule.FIELD]||{}))if(r.relationId===key)r.deleted=true;
    delete this.state.relationsById[key];
    this.scheduleSave("relation-delete");
  }

  openDeleteRelationConfirm(relation, onConfirm) {
    const targetRecord = this.getNodeRecord(relation?.targetNodeKey);
    const sourceRecord = this.getNodeRecord(relation?.sourceNodeKey);
    const targetLabel = targetRecord?.label || relation?.targetNodeKey || "目标条目";
    const sourceLabel = sourceRecord?.label || relation?.sourceNodeKey || "来源条目";
    new EvaConfirmModal(this.app, {
      title: "删除这条 EVA 关系？",
      message: "这只会删除跨视图关系，不会删除任何插件里的原始条目。",
      detail: `${sourceLabel}  →  ${targetLabel}`,
      confirmText: "删除关系",
      cancelText: "取消",
      danger: true,
      onConfirm
    }).open();
  }

  pruneMissingEndpointRelations(reason = "prune-missing-endpoint") {
    const relations = this.state.relationsById || {};
    const removed = [];
    Object.entries(relations).forEach(([relationId, relation]) => {
      if (!relation) return;
      if(Object.values(this.state[EvaCreationModule.FIELD]||{}).some(r=>r.relationId===relationId&&!r.deleted))return;
      if ((relation.relationType || DEFAULT_RELATION_TYPE) === "antinet-keyword-mount") return;
      const sourceKey = normalizeNodeKey(relation.sourceNodeKey);
      const targetKey = normalizeNodeKey(relation.targetNodeKey);
      // Missing owner content is not authorization to delete a user's relation.
      if ([sourceKey, targetKey].some((key) => parseJumpNodeKey(key)?.viewType === "keyword-index-plugin")) return;
      const missingSource = !sourceKey || !this.state.nodeIndexByKey?.[sourceKey];
      const missingTarget = !targetKey || !this.state.nodeIndexByKey?.[targetKey];
      if (!missingSource && !missingTarget) return;
      removed.push({
        relationId,
        sourceNodeKey: sourceKey,
        targetNodeKey: targetKey,
        missingSource,
        missingTarget
      });
      delete relations[relationId];
    });
    if (removed.length > 0) {
      console.log("[EVA Relations][relation.prune-missing-endpoints]", {
        reason,
        removedCount: removed.length,
        removed: removed.slice(0, 20)
      });
    }
    return { changed: removed.length > 0, removedCount: removed.length, removed };
  }

  async openRelationEditor(sourceNodeKey) {
    const key = normalizeNodeKey(sourceNodeKey);
    if (!key) {
      new Notice("⚠️ 当前条目还没有可用节点标识");
      return;
    }
    const existing=[...(this.relationEditors||[])].find(editor=>!editor.closed&&editor.sourceNodeKey===key);
    if(existing){existing.searchInput?.focus();new Notice('此条目的关系编辑窗口已经打开');return;}
    this.rememberRelationEditorSource(key);
    new RelationEditorModal(this.app, this, key).open();
  }

  getPendingFocusContextKey(viewType, notePath) {
    return `${normalizeText(viewType)}::${normalizeText(notePath)}`;
  }

  consumePendingFocus(viewType, notePath) {
    const contextKey = this.getPendingFocusContextKey(viewType, notePath);
    const payload = this.pendingFocusByContext[contextKey] || null;
    if (payload) delete this.pendingFocusByContext[contextKey];
    return payload ? cloneJson(payload, null) : null;
  }

  resolveNoteFile(notePath) {
    const target = normalizeText(notePath);
    if (!target) return null;
    const exact = this.app.vault.getAbstractFileByPath(target);
    if (exact instanceof TFile) return exact;
    const normalized = target.replace(/\\/g, "/").replace(/^\/+/, "");
    const normalizedExact = this.app.vault.getAbstractFileByPath(normalized);
    if (normalizedExact instanceof TFile) return normalizedExact;
    const targetBase = normalized.replace(/^.*\//, "").replace(/\.md$/i, "").toLowerCase();
    const files = this.app.vault.getMarkdownFiles();
    const exactBase = files.find((file) => file.basename.toLowerCase() === targetBase);
    if (exactBase) return exactBase;
    return files.find((file) => file.path.toLowerCase().endsWith(normalized.toLowerCase())) || null;
  }

  async openNotePath(notePath) {
    const path = normalizeText(notePath);
    if (!path) return false;
    const file = this.resolveNoteFile(path);
    if (!(file instanceof TFile)) return false;
    return await this.openFilePreferExistingLeaf(file, { source: "note-fallback" });
  }

  async openKnownTargetView(nodeKey, record = null, parsed = null, diagnostic = {}) {
    const parsedTarget = parsed || parseJumpNodeKey(nodeKey);
    const target = parsedTarget || record || null;
    const viewType = normalizeOptionalText(parsedTarget?.viewType || record?.viewType || target?.viewType);
    const notePath = normalizeOptionalText(parsedTarget?.notePath || record?.notePath || target?.notePath);
    const traceId = normalizeOptionalText(diagnostic?.traceId);
    const context = {
      notePath,
      viewType,
      record: record ? cloneJson(record, null) : null,
      parsed: parsedTarget ? cloneJson(parsedTarget, null) : null,
      fromPlugin: true,
      evaTraceId: traceId
    };
    const invokeApi = async (api) => {
      if (!api || typeof api !== "object") return false;
      if (typeof api.openNode === "function") {
        const handled = await Promise.resolve(api.openNode(nodeKey, context));
        if (handled === true) return true;
      }
      if (notePath && typeof api.openView === "function") {
        await Promise.resolve(api.openView(notePath));
        return true;
      }
      return false;
    };
    try {
      if (viewType === "workspace-mount-view" || viewType === "workspace") {
        logJumpTrace(traceId, "known-view.workspace", { nodeKey, notePath, viewType, hasApi: !!window.__workspaceMountPluginApi });
        return await invokeApi(window.__workspaceMountPluginApi);
      }
      if (viewType === "collection-card-view") {
        logJumpTrace(traceId, "known-view.collection", { nodeKey, notePath, viewType, hasApi: !!window.__collectionCardViewPluginApi });
        return await invokeApi(window.__collectionCardViewPluginApi);
      }
      if (viewType === "mandala-time-blocks") {
        logJumpTrace(traceId, "known-view.mandala", { nodeKey, notePath, viewType, hasApi: !!window.__mandalaTimeBlocksPluginApi });
        return await invokeApi(window.__mandalaTimeBlocksPluginApi);
      }
      if (viewType === "keyword-index-plugin") {
        const api = window.__keywordIndexPluginApi;
        logJumpTrace(traceId, "known-view.keyword-index", { nodeKey, notePath, viewType, hasApi: !!api });
        const handled = typeof api?.openNode === "function"
          ? await Promise.resolve(api.openNode(nodeKey, context)) === true
          : false;
        if (!handled) {
          new Notice("⚠️ Keyword Index 尚未加载，暂时无法跳转到关键词胶囊。");
        }
        return handled;
      }
    } catch (error) {
      console.error("[EVA Relations] known target view open failed:", error);
      if (viewType === "keyword-index-plugin") {
        new Notice("⚠️ Keyword Index 跳转失败，未打开原始索引文件。");
        return false;
      }
    }
    return false;
  }

  async openNodeViaRegisteredOpener(nodeKey, record = null, parsed = null, diagnostic = {}) {
    const parsedTarget = parsed || parseJumpNodeKey(nodeKey);
    const target = parsedTarget || record || null;
    const viewType = normalizeOptionalText(parsedTarget?.viewType || record?.viewType || target?.viewType);
    const traceId = normalizeOptionalText(diagnostic?.traceId);
    if (!viewType) return false;
    const opener = ensureJumpOpenerRegistry().get(viewType);
    logJumpTrace(traceId, "registered-opener.lookup", {
      nodeKey,
      viewType,
      notePath: normalizeOptionalText(parsedTarget?.notePath || record?.notePath || target?.notePath),
      openerId: opener?.openerId || "",
      hasOpener: !!opener
    });
    if (!opener || typeof opener.openNode !== "function") return false;
    try {
      const handled = await Promise.resolve(opener.openNode(nodeKey, {
        notePath: normalizeOptionalText(parsedTarget?.notePath || record?.notePath || target?.notePath),
        viewType,
        record: record ? cloneJson(record, null) : null,
        parsed: parsedTarget ? cloneJson(parsedTarget, null) : null,
        fromPlugin: true,
        evaTraceId: traceId
      }));
      logJumpTrace(traceId, "registered-opener.result", { nodeKey, viewType, handled: handled === true });
      return handled === true;
    } catch (error) {
      console.error("[EVA Relations] opener openNode 失败:", error);
      return false;
    }
  }

  async tryOpenNodeHandlers(nodeKey, record = null, parsed = null, diagnostic = {}) {
    const key = normalizeNodeKey(nodeKey);
    const currentRecord = record || this.getNodeRecord(key);
    const currentParsed = parsed || parseJumpNodeKey(key);
    const targetViewType = normalizeOptionalText(currentParsed?.viewType || currentRecord?.viewType);
    const targetNotePath = normalizeOptionalText(currentParsed?.notePath || currentRecord?.notePath);
    const traceId = normalizeOptionalText(diagnostic?.traceId);
    const adapter = currentRecord?.adapterId ? this.adapters.get(currentRecord.adapterId) : null;
    logJumpTrace(traceId, "handler.lookup", {
      nodeKey: key,
      targetViewType,
      targetNotePath,
      adapterId: currentRecord?.adapterId || "",
      hasAdapter: !!adapter
    });
    if (adapter?.openNode) {
      try {
        const handled = await Promise.resolve(adapter.openNode(key, {
          notePath: targetNotePath,
          viewType: targetViewType,
          record: currentRecord ? cloneJson(currentRecord, null) : null,
          parsed: currentParsed ? cloneJson(currentParsed, null) : null,
          fromPlugin: true,
          evaTraceId: traceId
        }));
        logJumpTrace(traceId, "adapter.result", { nodeKey: key, adapterId: currentRecord?.adapterId || "", handled: handled === true });
        if (handled === true) return true;
      } catch (error) {
        console.error("[EVA Relations] adapter openNode 失败:", error);
      }
    }
    return await this.openNodeViaRegisteredOpener(key, currentRecord, currentParsed, diagnostic);
  }

  scheduleDeferredOpenRetry(nodeKey, record = null, parsed = null, diagnostic = {}) {
    const key = normalizeNodeKey(nodeKey);
    if (!key) return;
    const retryKey = key;
    const traceId = normalizeOptionalText(diagnostic?.traceId);
    const previous = this.deferredOpenRetryTimers.get(retryKey);
    if (Array.isArray(previous)) {
      previous.forEach((timerId) => {
        try {
          window.clearTimeout(timerId);
        } catch (error) {}
      });
    }
    const timerIds = [];
    [80, 220, 520, 1000, 1800, 3200].forEach((delay) => {
      const timerId = window.setTimeout(async () => {
        const latestRecord = this.getNodeRecord(key) || record;
        const latestParsed = parseJumpNodeKey(key) || parsed;
        logJumpTrace(traceId, "retry.attempt", { nodeKey: key, delay });
        const handled = await this.tryOpenNodeHandlers(key, latestRecord, latestParsed, diagnostic);
        if (handled) {
          logJumpTrace(traceId, "retry.success", { nodeKey: key, delay });
          const active = this.deferredOpenRetryTimers.get(retryKey);
          if (Array.isArray(active)) {
            active.forEach((pendingTimerId) => {
              if (pendingTimerId === timerId) return;
              try {
                window.clearTimeout(pendingTimerId);
              } catch (error) {}
            });
          }
          this.deferredOpenRetryTimers.delete(retryKey);
        }
      }, delay);
      timerIds.push(timerId);
    });
    this.deferredOpenRetryTimers.set(retryKey, timerIds);
  }

  async remapNodeKeys(remappings, options = {}) {
    const mapping = new Map();
    (Array.isArray(remappings) ? remappings : []).forEach((entry) => {
      const from = normalizeNodeKey(entry?.from || entry?.oldKey || entry?.sourceNodeKey);
      const to = normalizeNodeKey(entry?.to || entry?.newKey || entry?.targetNodeKey);
      if (!from || !to || from === to) return;
      mapping.set(from, to);
    });
    if (mapping.size === 0) {
      return { ok: true, changed: false, relationCount: 0, indexCount: 0 };
    }

    let changed = false;
    let relationCount = 0;
    let indexCount = 0;
    Object.values(this.state.relationsById || {}).forEach((relation) => {
      if (!relation) return;
      const nextSourceNodeKey = resolveRemappedNodeKey(relation.sourceNodeKey, mapping);
      const nextTargetNodeKey = resolveRemappedNodeKey(relation.targetNodeKey, mapping);
      if (nextSourceNodeKey === relation.sourceNodeKey && nextTargetNodeKey === relation.targetNodeKey) return;
      relation.sourceNodeKey = nextSourceNodeKey;
      relation.targetNodeKey = nextTargetNodeKey;
      relation.updatedAt = nowString();
      changed = true;
      relationCount += 1;
    });

    const nextNodeIndexByKey = cloneJson(this.state.nodeIndexByKey || {}, {});
    Object.keys(this.state.nodeIndexByKey || {}).forEach((nodeKey) => {
      const nextNodeKey = resolveRemappedNodeKey(nodeKey, mapping);
      if (!nextNodeKey || nextNodeKey === nodeKey) return;
      const record = this.state.nodeIndexByKey[nodeKey];
      if (!nextNodeIndexByKey[nextNodeKey]) {
        nextNodeIndexByKey[nextNodeKey] = {
          ...record,
          nodeKey: nextNodeKey
        };
      }
      delete nextNodeIndexByKey[nodeKey];
      changed = true;
      indexCount += 1;
    });

    const lastFocusedNodeKey = resolveRemappedNodeKey(window.evaCrossViewRelationsLastNodeKey || "", mapping);
    if (lastFocusedNodeKey && lastFocusedNodeKey !== window.evaCrossViewRelationsLastNodeKey) {
      window.evaCrossViewRelationsLastNodeKey = lastFocusedNodeKey;
      changed = true;
    }

    if (!changed) {
      return { ok: true, changed: false, relationCount: 0, indexCount: 0 };
    }

    this.state.nodeIndexByKey = nextNodeIndexByKey;
    this.invalidateSearchCatalog();
    this.scheduleSave(normalizeOptionalText(options.reason) || "node-key-remap", {
      dispatch: options.dispatch !== false
    });
    return { ok: true, changed: true, relationCount, indexCount };
  }

  async openNode(nodeKey) {
    const key = normalizeNodeKey(nodeKey);
    const record = this.getNodeRecord(key);
    const parsed = parseJumpNodeKey(key);
    const targetViewType = normalizeOptionalText(parsed?.viewType || record?.viewType);
    const targetNotePath = normalizeOptionalText(parsed?.notePath || record?.notePath);
    const traceId = createJumpTraceId();
    logJumpTrace(traceId, "open.start", {
      nodeKey: key,
      targetViewType,
      targetNotePath,
      hasRecord: !!record,
      recordViewType: normalizeOptionalText(record?.viewType),
      recordNotePath: normalizeOptionalText(record?.notePath),
      parsedViewType: normalizeOptionalText(parsed?.viewType),
      parsedNotePath: normalizeOptionalText(parsed?.notePath)
    });
    if (!record && !parsed) {
      logJumpTrace(traceId, "open.abort.no-target", { nodeKey: key });
      new Notice("⚠️ 还没有这个条目的索引，请先打开对应视图一次");
      return false;
    }
    if (targetViewType && targetNotePath) {
      const contextKey = this.getPendingFocusContextKey(targetViewType, targetNotePath);
      this.pendingFocusByContext[contextKey] = {
        nodeKey: record?.nodeKey || parsed?.nodeKey || key,
        requestedAt: nowString(),
        scopeType: normalizeOptionalText(parsed?.scopeType),
        scopeId: normalizeOptionalText(parsed?.scopeId),
        itemId: normalizeOptionalText(parsed?.itemId)
      };
      logJumpTrace(traceId, "pending-focus.set", { contextKey, nodeKey: key });
    }
    const handledDirectly = await this.tryOpenNodeHandlers(key, record, parsed, { traceId });
    logJumpTrace(traceId, "open.direct-result", { nodeKey: key, handledDirectly });
    if (handledDirectly) return true;
    const openedKnownView = await this.openKnownTargetView(key, record, parsed, { traceId });
    logJumpTrace(traceId, "open.known-view-result", { nodeKey: key, openedKnownView });
    if (openedKnownView) {
      this.scheduleDeferredOpenRetry(key, record, parsed, { traceId });
      return true;
    }
    if (targetViewType === "keyword-index-plugin") {
      if (targetViewType && targetNotePath) {
        const contextKey = this.getPendingFocusContextKey(targetViewType, targetNotePath);
        delete this.pendingFocusByContext[contextKey];
        logJumpTrace(traceId, "pending-focus.clear-on-known-view-fail", { contextKey, nodeKey: key });
      }
      logJumpTrace(traceId, "open.keyword-index-fail-closed", {
        nodeKey: key,
        targetNotePath,
        reason: "keyword-index-api-unavailable-or-failed"
      });
      return false;
    }
    const opened = await this.openNotePath(targetNotePath);
    logJumpTrace(traceId, "open.note-fallback-result", { nodeKey: key, targetNotePath, opened });
    if (!opened) {
      if (targetViewType && targetNotePath) {
        const contextKey = this.getPendingFocusContextKey(targetViewType, targetNotePath);
        delete this.pendingFocusByContext[contextKey];
        logJumpTrace(traceId, "pending-focus.clear-on-fail", { contextKey, nodeKey: key });
      }
      new Notice("❌ 打开目标视图失败");
      return false;
    }
    this.scheduleDeferredOpenRetry(key, record, parsed, { traceId });
    return true;
  }
};
