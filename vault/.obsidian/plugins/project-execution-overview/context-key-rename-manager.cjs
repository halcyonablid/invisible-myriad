"use strict";
// PEO owns declarations; consumers own their frozen rename plans. No second identity store.
const { createHash, randomUUID } = require("crypto");
const hash = value => createHash("sha256").update(value).digest("hex");
const copy = value => JSON.parse(JSON.stringify(value));
const key = value => String(value || "").trim().toLocaleLowerCase();
const fail = reason => { throw Error(reason); };
const plain = v => v && typeof v === "object" && !Array.isArray(v);
function subject(nodeKey) {
  const p = String(nodeKey || "").split("|");
  if (p.length !== 5 || p[0] !== "jump:v1:workspace-mount-view" || p[2] !== "tab" || !p[3] || !p[4]) fail("完整 Workspace 主键无效");
  let source; try { source = decodeURIComponent(p[1]); } catch { fail("来源编码无效"); }
  if (!source || source.includes("\\") || source.split("/").some(x => !x || x === ".." || x === ".") || /^[A-Za-z]:/.test(source)) fail("来源路径无效");
  return { nodeKey, sourceNotePath: source, tabId: p[3], itemId: p[4] };
}
function mergeMissing(raw, memory) {
  const result = { ...raw, ...memory };
  for (const k of Object.keys(raw)) if (plain(raw[k]) && plain(memory[k])) result[k] = mergeMissing(raw[k], memory[k]);
  return result;
}
class ContextKeyRenameManager {
  constructor(c) { this.c = c; this.owner = c.owner; this.tokens = new Map(); this.modals = new Set(); this.closed = false; }
  live() { if (this.closed || this.owner.contextCarrierUnloading || this.owner.contextRenameJournal?.closed) fail("服务已关闭，请重新加载后打开"); }
  journal() { this.live(); const j = this.owner.contextRenameJournal; if (!j || j.error) fail(j?.error || "同步记录尚未就绪"); return j; }
  config() { return String(this.owner.getGlobalKeywordNavScope()); }
  draftKey(nodeKey, kind) { return `peo-context-draft-v1:${this.c.vaultId}:${kind}:${nodeKey}`; }
  draft(nodeKey, kind, value) {
    const k = this.draftKey(nodeKey, kind), s = this.c.storage;
    if (!s) fail("草稿存储不可用，请保留当前编辑窗口");
    if (value === undefined) {
      const raw = s.getItem(k); if (raw === null) return null;
      const record = JSON.parse(raw);
      if (record.version !== 1 || record.owner !== "project-execution-overview" || record.nodeKey !== nodeKey || record.kind !== kind || typeof record.value !== "string") fail("草稿格式不可核验，请保留当前窗口");
      return record.value;
    }
    if (value === null) { s.removeItem(k); return; }
    const record = JSON.stringify({ version: 1, owner: "project-execution-overview", nodeKey, kind, value: String(value), updatedAt: new Date().toISOString(), status: "retained" });
    s.setItem(k, record); if (s.getItem(k) !== record) fail("草稿保存未确认，请保留当前编辑窗口");
  }
  declarations(comment) { return this.c.declarations(comment).map(d => ({ ...d, label: this.c.normalize(d.keyword) })); }
  single(comment) { const ds = this.declarations(comment); if (ds.length !== 1) fail("需要且只能有一条主键声明，请先检查评论中的 --- 声明区"); return ds[0]; }
  // Names owned by the management center (or with a center naming step pending) are renamed only there.
  // This old entry must refuse them before any preview token or journal record exists.
  centerOwner(nodeKey) {
    // The PEO writer is created lazily (first save or center probe); build it the same way the center does.
    if (!this.owner.goalPeoWriter && typeof this.owner.getCenterNamingParticipantV1 === "function") { try { this.owner.getCenterNamingParticipantV1(); } catch { fail("主键管理服务未就绪，旧改名入口暂停；请在主键管理中心核验后再试"); } }
    const proj = this.owner.goalPeoWriter?.centerNaming;
    if (!proj || typeof proj.capture !== "function") fail("主键管理服务未就绪，旧改名入口暂停；请在主键管理中心核验后再试");
    let c; try { c = proj.capture(); } catch (e) { fail(`主键管理服务暂不可用（${e.message}），旧改名入口暂停；请在主键管理中心核验后再试`); }
    if (c.unconfigured) return null;
    const x = c.s.contexts.find(x => x.subjects[0].primaryNodeKey === nodeKey);
    return x && (x.naming.authority === "center" || x.naming.pending) ? { contextId: x.contextId, label: String(x.canonicalLabel || "") } : null;
  }
  legacyOnly(nodeKey) { if (this.centerOwner(nodeKey)) fail("这个主键的名称由主键管理中心维护，请到管理中心的“名称与同步”中修改；这里不会记录旧同步"); }
  // An old job may be abandoned only if nothing was written: declaration still the confirmed before-state and no
  // provider ever started. Marking it superseded is the status every existing reader already treats as finished.
  abandonable(job, comment) {
    const m = job?.managedRename;
    return !!m && m.version === 1 && !m.legacyAdopted && (job.status === "pending" || job.status === "paused" && job.reason === "declaration-changed")
      && hash(comment) === m.beforeHash && hash(comment) !== m.afterHash
      && Array.isArray(job.providers) && job.providers.every(p => (p.state === "prepared" || p.state === "excluded") && !p.attempts);
  }
  async oldJob(nodeKey) {
    const job = this.journal().prior(nodeKey);
    if (!job || job.status === "complete" || job.status === "superseded") return null;
    const state = await this.read(), comment = state.data.commentsByNodeKey[nodeKey] || "";
    const saved = String(this.owner.settings.commentsByNodeKey?.[nodeKey] || "") === comment;
    return { job: copy(job), abandonable: saved && this.abandonable(job, comment) };
  }
  async abandon(nodeKey, jobId) {
    const j = this.journal();
    return this.transaction("abandon", nodeKey, () => j.serial(async () => {
      this.live(); const job = j.prior(nodeKey);
      if (!job || job.id !== jobId) fail("同步记录已变化，请重新打开后核对");
      const state = await this.read(), comment = state.data.commentsByNodeKey[nodeKey] || "";
      if (String(this.owner.settings.commentsByNodeKey?.[nodeKey] || "") !== comment) fail("评论有未保存变更，请保存后再处理");
      if (!this.abandonable(job, comment)) fail("这条记录已开始写入或状态已变化，不能放弃；请在主键改名同步进度中核对");
      const before = { status: job.status, reason: job.reason, abandonedAt: job.abandonedAt };
      job.status = "superseded"; job.reason = "abandoned-unstarted"; job.abandonedAt = new Date().toISOString();
      try { await j.persist(); } catch (e) { Object.assign(job, before); if (before.abandonedAt === undefined) delete job.abandonedAt; throw e; }
      return copy(job);
    }));
  }
  replace(comment, newLabel) {
    const old = this.single(comment), before = this.c.parse(old.label), after = this.c.parse(newLabel);
    if (!newLabel.trim() || /[\r\n]/.test(newLabel) || newLabel.trim() === "---" || /^(context_key|operation_context_key|project_name|importance_group)\s*:/i.test(newLabel)) fail("请输入单行主键名称");
    if (before.address !== after.address) fail("这里只修改名称，请保留原编号；编号迁移需另行管理");
    const label = this.c.normalize(newLabel);
    if (key(label) === key(old.label)) fail("名称没有变化");
    const parts = comment.split(/(\r?\n)/); let inside = false, index = -1, found = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i].trim() === "---") { if (inside) { if (found.length) index = found[0]; found = []; } inside = !inside; continue; }
      if (!inside || !parts[i].trim() || /^\s*(project_name|importance_group)\s*:/i.test(parts[i])) continue;
      found.push(i);
    }
    if (index < 0) fail("无法定位声明行");
    const line = parts[index], prefix = line.match(/^\s*(?:(?:context_key|operation_context_key)\s*:\s*)?/i)[0];
    parts[index] = prefix + label + (line.match(/\s*$/)?.[0] || "");
    const result = parts.join(""); if (this.single(result).label !== label) fail("新声明校验失败");
    return { comment: result, oldLabel: old.label, newLabel: label };
  }
  async read() {
    this.live(); const a = this.owner.app.vault.adapter;
    const path = `${this.owner.manifest.dir || `.obsidian/plugins/${this.owner.manifest.id}`}/data.json`;
    const raw = await a.read(path), data = JSON.parse(raw);
    if (!plain(data) || !plain(data.commentsByNodeKey) || Object.values(data.commentsByNodeKey).some(v => typeof v !== "string")) fail("评论数据格式不可核验");
    return { path, raw, data };
  }
  async root(ref) {
    const s = subject(ref.nodeKey);
    if (ref.sourceNotePath && ref.sourceNotePath !== s.sourceNotePath) fail("主键与 Workspace 来源不匹配");
    const api = this.c.workspace();
    if (typeof api?.getProjectOverviewWorkspaceEntrySnapshotV2 !== "function") fail("Workspace 主项目服务未就绪");
    const snap = await api.getProjectOverviewWorkspaceEntrySnapshotV2({ sourceNotePath: s.sourceNotePath, tabId: s.tabId, forceReload: true });
    this.live();
    if (api !== this.c.workspace() || !snap?.ok || !snap.complete || snap.hasMore || snap.truncated || snap.sourceNotePath !== s.sourceNotePath || snap.tabId !== s.tabId
      || !Array.isArray(snap.items) || snap.items.filter(x => x.nodeKey === s.nodeKey && x.itemId === s.itemId && x.sourceNotePath === s.sourceNotePath && x.tabId === s.tabId).length !== 1) fail("主项目载体未能完整核验");
    return { ...s, api, generation: snap.providerGeneration };
  }
  unique(data, nodeKey, labels) {
    const names = new Set(labels.map(key));
    for (const [other, comment] of Object.entries(data.commentsByNodeKey)) if (other !== nodeKey && this.declarations(comment).some(d => names.has(key(d.label)))) fail("相同名称属于其他主键，无法安全按名称同步，请先处理歧义");
  }
  async snapshot(ref) {
    const root = await this.root(ref), state = await this.read(), comment = state.data.commentsByNodeKey[root.nodeKey] || "";
    return { nodeKey: root.nodeKey, sourceNotePath: root.sourceNotePath, label: this.single(comment).label, job: copy(this.journal().prior(root.nodeKey) || null) };
  }
  async preview(ref, newLabel) {
    this.legacyOnly(subject(ref.nodeKey).nodeKey);
    const j = this.journal(), root = await this.root(ref), state = await this.read();
    const before = state.data.commentsByNodeKey[root.nodeKey] || "";
    if (String(this.owner.settings.commentsByNodeKey?.[root.nodeKey] || "") !== before) fail("评论有未保存变更，请保存后重新预览");
    const replacement = this.replace(before, newLabel);
    this.unique(state.data, root.nodeKey, [replacement.oldLabel, replacement.newLabel]);
    const config = this.config(), memory = JSON.stringify(this.owner.settings);
    const apis = this.owner.getContextCapsuleRenameConsumers().map(p => [p.id, p.api]);
    const plan = await j.preview({ primaryNodeKey: root.nodeKey, domain: "workspace", oldDisplayLabel: replacement.oldLabel, newDisplayLabel: replacement.newLabel });
    this.live();
    for (const p of plan.providers) {
      if (p.state === "excluded") continue;
      if (!p.plan) fail(`${p.label} 尚未就绪：${p.reason}；请恢复服务后重新预览`);
      if (p.id === "workspace-mount" && p.plan.scope.sourceNotePath !== root.sourceNotePath) fail("Workspace 消费者来源与主键来源不匹配");
    }
    const id = randomUUID(); const token = { id, root, plan, replacement, before, rawHash: hash(state.raw), config, memory, apis, expires: Date.now() + 300000 };
    await this.validateToken(token);
    while (this.tokens.size >= 32) this.tokens.delete(this.tokens.keys().next().value);
    this.tokens.set(id, token);
    return { token: id, ...copy(plan), sourceNotePath: root.sourceNotePath };
  }
  async validateToken(t) {
    this.live(); if (Date.now() > t.expires || t.config !== this.config() || t.memory !== JSON.stringify(this.owner.settings)) fail("预览已过期或设置已变化，请重新预览");
    if (t.apis.some(([id, api]) => this.owner.getContextCapsuleRenameConsumers().find(p => p.id === id)?.api !== api)) fail("消费者已重新加载，请重新预览");
    const root = await this.root(t.root);
    if (root.api !== t.root.api || root.generation !== t.root.generation || hash((await this.read()).raw) !== t.rawHash) fail("来源或评论已变化，请重新预览");
    if (this.journal().prior(t.root.nodeKey)?.id !== (t.plan.priorId || undefined)) fail("已有新的同步记录，请重新预览");
  }
  async guard(job) {
    try {
      this.live(); const m = job.managedRename;
      if (!m || m.version !== 1 || m.config !== this.config() || m.sourceNotePath !== subject(job.primaryNodeKey).sourceNotePath) return false;
      await this.root({ nodeKey: job.primaryNodeKey, sourceNotePath: m.sourceNotePath });
      const current = this.journal().c.participants();
      if (JSON.stringify(current.map(p => [p.id, !!p.excluded])) !== JSON.stringify(m.participants)) return false;
      if (job.providers.some(p => p.state !== "excluded" && (!p.plan || (p.id === "workspace-mount" && p.plan.scope.sourceNotePath !== m.sourceNotePath)))) return false;
      const state = await this.read(), comment = state.data.commentsByNodeKey[job.primaryNodeKey] || "";
      this.unique(state.data, job.primaryNodeKey, [job.newDisplayLabel]);
      return hash(comment) === m.afterHash && String(this.owner.settings.commentsByNodeKey?.[job.primaryNodeKey] || "") === comment;
    } catch { return false; }
  }
  async writeDeclaration(job, token = null) {
    return this.owner.enqueueSettingsWrite(async () => {
      this.live(); const m = job.managedRename, state = await this.read(), nodeKey = job.primaryNodeKey;
      const before = state.data.commentsByNodeKey[nodeKey] || "";
      if (m.config !== this.config() || this.journal().prior(nodeKey)?.id !== job.id) fail("来源配置或同步记录已变化，请重新预览");
      await this.root({ nodeKey, sourceNotePath: m.sourceNotePath });
      if (JSON.stringify(this.journal().c.participants().map(p => [p.id, !!p.excluded])) !== JSON.stringify(m.participants)) fail("消费者启用状态已变化，请重新预览");
      if (token && (token.memory !== JSON.stringify(this.owner.settings) || token.apis.some(([id, api]) => this.owner.getContextCapsuleRenameConsumers().find(p => p.id === id)?.api !== api))) fail("预览之后服务或设置已变化，请重新预览");
      if (String(this.owner.settings.commentsByNodeKey?.[nodeKey] || "") !== before) fail("内存评论与磁盘不一致，请重新加载后恢复");
      if (hash(before) === m.afterHash) return;
      if (hash(before) !== m.beforeHash) fail("评论已变化，不能重放旧改名，请重新预览");
      for (const p of job.providers) if (p.state !== "excluded") {
        if (!p.plan || (p.id === "workspace-mount" && p.plan.scope.sourceNotePath !== m.sourceNotePath)) fail("缺少原始同步范围，请重新预览");
        const check = await this.journal().call(p.id, { phase: "verify", plan: p.plan });
        if (!check.ok) fail(`${p.label}：${check.reason}；原同步范围暂不可核验`);
      }
      const next = this.replace(before, job.newDisplayLabel).comment;
      if (hash(next) !== m.afterHash) fail("声明恢复校验失败");
      this.unique(state.data, nodeKey, [...job.oldLabels, job.newDisplayLabel]);
      const a = this.owner.app.vault.adapter, dir = `${this.journal().c.pluginDir}/rename-backups`;
      if (!await a.exists(dir)) await a.mkdir(dir);
      const backup = `${dir}/${job.id}-declaration.json`;
      if (!await a.exists(backup)) { await a.write(backup, state.raw); if (await a.read(backup) !== state.raw) fail("声明备份未确认"); }
      this.live(); if ((await this.read()).raw !== state.raw || m.config !== this.config() || String(this.owner.settings.commentsByNodeKey?.[nodeKey] || "") !== before) fail("保存前数据发生变化，请重新核验");
      const payload = { ...state.data, commentsByNodeKey: { ...state.data.commentsByNodeKey, [nodeKey]: next } };
      let writeError;
      try { await this.owner.saveData(payload); } catch (error) { writeError = error; }
      const after = await this.read();
      if (JSON.stringify(after.data) !== JSON.stringify(payload)) throw writeError || Error("声明保存结果未确认，请保留同步记录并重试");
      // Only the target comment changes in memory; preserve queued unrelated edits and raw unknown fields.
      this.owner.settings = mergeMissing(state.data, this.owner.settings);
      this.owner.settings.commentsByNodeKey = { ...payload.commentsByNodeKey };
    });
  }
  publish(job) {
    this.owner.invalidateGlobalKeywordNavCache("context-key-managed-rename");
    this.c.publish({ version: 1, nodeKey: job.primaryNodeKey, sourceScope: job.managedRename.sourceNotePath });
    void this.owner.refreshViews({ preserveScroll: true, reason: "context-key-managed-rename" }).catch(() => {});
  }
  async transaction(action, nodeKey, task) {
    const tx = randomUUID(), started = Date.now(), audit = this.c.audit?.(); let operation;
    const log = (phase, extra = {}) => console.info(`[ProjectExecutionOverview][context-key-rename][tx:${tx}][${phase}]`, { action, subjectHash: hash(nodeKey), ...extra });
    log("start");
    try { operation = await audit?.beginOperation?.({ "来源插件": "project-execution-overview", "操作": action === "rename" ? "修改主键名称" : action === "abandon" ? "放弃未开始的旧同步" : "恢复主键同步", "对象类型": "项目主键", "对象名称": hash(nodeKey), "结果": "pending" }); } catch { log("audit-warning", { code: "AUDIT_BEGIN_FAILED" }); }
    let result;
    try { result = await task(); log("summary", { status: result.status, durationMs: Date.now() - started }); return result; }
    catch (error) { log("incomplete", { durationMs: Date.now() - started }); throw error; }
    finally {
      try { if (operation?.operationId) await audit?.finishOperation?.(operation.operationId, { "结果": result?.status === "complete" || action === "abandon" && result?.status === "superseded" ? "success" : "pending", "失败原因": result?.status === "complete" || action === "abandon" && result?.status === "superseded" ? "" : "同步尚未全部核验，请查看原记录" }); }
      catch { log("audit-warning", { code: "AUDIT_FINISH_FAILED" }); }
    }
  }
  async commit(id) {
    const t = this.tokens.get(id); if (!t) fail("预览已失效，请重新预览");
    this.tokens.delete(id);
    const j = this.journal();
    return this.transaction("rename", t.root.nodeKey, () => j.serial(async () => {
      await this.validateToken(t);
      this.legacyOnly(t.root.nodeKey);
      const job = { ...copy(t.plan), id: `rename-${randomUUID()}`, confirmedAt: new Date().toISOString(), status: "pending", managedRename: {
        version: 1, sourceNotePath: t.root.sourceNotePath, beforeHash: hash(t.before), afterHash: hash(t.replacement.comment), config: t.config,
        participants: j.c.participants().map(p => [p.id, !!p.excluded]) } };
      for (const old of j.data.jobs) if (old.primaryNodeKey === job.primaryNodeKey && old.status !== "superseded") old.status = "superseded";
      j.data.jobs.push(job); await j.persist();
      await this.writeDeclaration(job, t); this.publish(job);
      await j.runJob(job); this.publish(job);
      return copy(job);
    }));
  }
  async retry(nodeKey) {
    const j = this.journal();
    return this.transaction("retry", nodeKey, () => j.serial(async () => {
      this.legacyOnly(nodeKey);
      const job = j.prior(nodeKey); if (!job) fail("没有待恢复的同步记录");
      if (!job.managedRename) {
        // Upgrade only a fully frozen legacy recovery record; never discover new scopes on retry.
        const root = await this.root({ nodeKey }), state = await this.read(), comment = state.data.commentsByNodeKey[nodeKey] || "";
        if (key(this.single(comment).label) !== key(job.newDisplayLabel) || String(this.owner.settings.commentsByNodeKey?.[nodeKey] || "") !== comment) fail("旧同步记录与当前声明不一致，请重新预览");
        this.unique(state.data, nodeKey, [...job.oldLabels, job.newDisplayLabel]);
        const participants = j.c.participants().map(p => [p.id, !!p.excluded]);
        if (JSON.stringify(participants) !== JSON.stringify(job.providers.map(p => [p.id, p.state === "excluded"]))) fail("旧记录的消费者范围已变化，请重新预览");
        for (const p of job.providers) if (p.state !== "excluded") {
          if (!p.plan || (p.id === "workspace-mount" && p.plan.scope.sourceNotePath !== root.sourceNotePath)) fail("旧记录缺少原始同步范围，请重新预览");
          const check = await j.call(p.id, { phase: "verify", plan: p.plan });
          if (!check.ok) fail(`${p.label} 原始范围无法核验：${check.reason}`);
        }
        job.managedRename = { version: 1, legacyAdopted: true, sourceNotePath: root.sourceNotePath, beforeHash: hash(comment), afterHash: hash(comment), config: this.config(), participants };
        await j.persist();
      }
      if (job.status === "superseded") fail("已有更新记录");
      await this.writeDeclaration(job); this.publish(job);
      if (job.status === "complete") { if (!await this.guard(job)) fail("声明或来源已变化，请重新预览"); job.status = "pending"; }
      await j.runJob(job); this.publish(job); return copy(job);
    }));
  }
  async saveComment(nodeKey, value, expected) {
    return this.owner.enqueueSettingsWrite(async () => {
      const state = await this.read(), before = state.data.commentsByNodeKey[nodeKey] || "";
      if (before.trim() !== expected || this.owner.getComment(nodeKey) !== expected) fail("评论已被其他操作更新；草稿已保留，请重新打开后核对");
      const next = String(value || "").trim(), payload = mergeMissing(state.data, this.owner.settings);
      payload.commentsByNodeKey = { ...state.data.commentsByNodeKey };
      if (next) payload.commentsByNodeKey[nodeKey] = next; else delete payload.commentsByNodeKey[nodeKey];
      if ((await this.read()).raw !== state.raw || this.owner.getComment(nodeKey) !== expected) fail("评论已更新，草稿已保留");
      let error; try { await this.owner.saveData(payload); } catch (e) { error = e; }
      if (JSON.stringify((await this.read()).data) !== JSON.stringify(payload)) throw error || Error("评论保存未确认，草稿已保留");
      const memory = mergeMissing(state.data, this.owner.settings);
      memory.commentsByNodeKey = { ...payload.commentsByNodeKey };
      this.owner.settings = memory;
    });
  }
  open(ref, options = {}) {
    this.journal(); subject(ref.nodeKey);
    const manager = this, { Modal, Notice } = this.c;
    class RenameModal extends Modal {
      constructor() { super(manager.owner.app); this.busy = false; this.changed = false; this.closed = false; }
      onOpen() {
        this.contentEl.createEl("h2", { text: "修改主键名称" });
        this.contentEl.createEl("p", { text: "修改声明区的主键名称，并同步既有载体绑定。保留编号、评论正文和历史记录。" });
        this.input = this.contentEl.createEl("input", { type: "text" }); this.input.style.width = "100%";
        this.status = this.contentEl.createEl("p", { text: "正在读取…" });
        this.rows = this.contentEl.createDiv();
        const button = (label, fn) => { const b = this.contentEl.createEl("button", { text: label }); b.onclick = () => this.run(fn); return b; };
        this.previewButton = button("预览同步范围", async () => { this.preview = await manager.preview(ref, this.input.value); this.show(this.preview); this.confirm.disabled = false; });
        this.confirm = button("确认改名并同步", async () => { const value = this.input.value; this.confirm.disabled = true; this.changed = true; const job = await manager.commit(this.preview?.token); this.show(job); if (manager.draft(ref.nodeKey, "rename") === value) manager.draft(ref.nodeKey, "rename", null); });
        this.confirm.disabled = true;
        this.retryButton = button("重新核验 / 恢复同步", async () => { this.changed = true; const job = await manager.retry(ref.nodeKey); this.show(job); });
        this.input.addEventListener("input", () => { this.confirm.disabled = true; this.preview = null; try { manager.draft(ref.nodeKey, "rename", this.input.value); this.draftFailed = false; } catch (e) { this.draftFailed = true; this.status.textContent = e.message; } });
        void this.run(async () => { const owner = manager.centerOwner(subject(ref.nodeKey).nodeKey); if (owner) return this.redirect(owner); const s = await manager.snapshot(ref); if (this.closed) return; this.input.value = manager.draft(ref.nodeKey, "rename") ?? s.label; this.status.textContent = `当前名称：${s.label}；来源：${s.sourceNotePath}`; if (s.job) this.show(s.job); });
      }
      async run(fn) {
        if (this.busy || this.closed) return; this.busy = true; this.input.disabled = true;
        try { await fn(); } catch (e) { if (!this.closed) { this.status.textContent = this.centerOwned ? `未完成：${e.message}。` : `未完成：${e.message}。可重新预览，或恢复已确认的同步。`; this.confirm.disabled = true; } }
        finally { this.busy = false; this.input.disabled = false; if (this.closed) this.notify(); }
      }
      async redirect(owner) {
        if (this.closed) return;
        this.centerOwned = true; for (const b of [this.previewButton, this.confirm, this.retryButton]) b.style.display = "none";
        const draft = manager.draft(ref.nodeKey, "rename");
        this.input.value = draft ?? owner.label; this.input.readOnly = true;
        this.status.textContent = `这个主键的名称由主键管理中心维护（当前：${owner.label}）。请到管理中心找到它，点“名称与同步”修改。这里不会再记录旧同步，也不会改动任何内容。${draft !== null && draft !== owner.label ? "上面是你之前填写的新名称，可复制到管理中心使用。" : ""}`;
        this.rows.empty();
        const open = this.rows.createEl("button", { text: "打开主键管理中心", cls: "mod-cta" });
        open.onclick = () => this.run(async () => { const p = manager.owner.app.plugins?.plugins?.["context-key-manager"]; if (typeof p?.open !== "function") fail("主键管理中心未加载"); await p.open(); this.close(); });
        let old; try { old = await manager.oldJob(ref.nodeKey); } catch (e) { if (!this.closed) this.rows.createEl("p", { text: `旧同步记录暂时无法读取：${e.message}。可在“主键改名同步进度”中核对。` }); return; }
        if (this.closed) return;
        if (!old) { this.rows.createEl("p", { text: "如果管理中心仍提示原入口有未完成的同步，请在“主键改名同步进度”中核对。" }); return; }
        const job = old.job, box = this.rows.createDiv();
        if (old.abandonable) {
          box.createEl("p", { text: `原入口还留有一条未开始的旧同步（${job.oldDisplayLabel} → ${job.newDisplayLabel}），它会让管理中心暂时不能改名。各插件都还没有写入，主键声明也还是原样，可以放弃这条记录：只标记为已放弃，不删除记录，也不改动任何内容。` });
          const b = box.createEl("button", { text: "放弃这条未开始的旧同步" });
          b.onclick = () => this.run(async () => {
            if (!this.confirmAbandon) { this.confirmAbandon = true; b.setText("再次点击确认放弃（不会改动任何内容）"); return; }
            try { await manager.abandon(ref.nodeKey, job.id); } catch (e) { this.confirmAbandon = false; b.setText("放弃这条未开始的旧同步"); throw e; }
            this.changed = true; box.empty();
            box.createEl("p", { text: "已放弃这条旧同步。现在可以到主键管理中心改名。" });
          });
        } else {
          box.createEl("p", { text: `原入口还有一条已开始或状态待核对的旧同步（${job.oldDisplayLabel} → ${job.newDisplayLabel}，${job.status}）。请先在“主键改名同步进度”中核对；这里不会自动放弃或重试。` });
          const b = box.createEl("button", { text: "打开主键改名同步进度" });
          b.onclick = () => this.run(async () => { if (typeof manager.owner.openContextRenameRecovery !== "function") fail("同步进度入口不可用"); manager.owner.openContextRenameRecovery(); });
        }
      }
      show(record) {
        if (this.closed) return;
        this.rows.empty();
        this.status.textContent = record.status === "complete" ? "本次同步核验结束，请查看各插件的匹配结果。" : record.status ? "名称与各插件同步进度如下；未完成项可恢复。" : "请核对以下来源与载体；确认后开始保存。";
        for (const p of record.providers) {
          const state = { prepared: "待确认", verified: "已核验", "no-match": "无匹配载体", excluded: "未启用，已排除", pending: "待恢复", review: "需重新预览", committing: "等待核验" }[p.state] || p.state;
          this.rows.createEl("p", { text: `${p.label}：${state}；匹配 ${p.plan?.targets?.length ?? "未知"} 个${p.plan ? `；来源 ${p.plan.scope.sourceNotePath}；载体 ${p.plan.targets.map(t => t.carrierId).join("、") || "无"}` : ""}${p.reason ? `（${p.reason}）` : ""}` });
        }
      }
      close() {
        if (this.input && this.draftFailed) {
          try { manager.draft(ref.nodeKey, "rename", this.input.value); this.draftFailed = false; } catch (e) { new Notice(e.message); return; }
        }
        super.close();
      }
      notify() { if (!this.notified) { this.notified = true; Promise.resolve(options.onClosed?.(this.changed)).catch(() => new Notice("名称管理已关闭；原页面请手动刷新。")); } }
      onClose() { this.closed = true; manager.modals.delete(this); this.contentEl.empty(); if (!this.busy) this.notify(); }
    }
    const modal = new RenameModal(); this.modals.add(modal); modal.open(); return { ok: true };
  }
  close() { this.closed = true; this.tokens.clear(); for (const modal of this.modals) modal.close(); }
}
module.exports = { ContextKeyRenameManager, subject };
