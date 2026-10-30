const { ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");

const HUB_VIEW_TYPE = "view-group-hub-view";
const SETTINGS_VERSION = 1;
const READY_TIMEOUT_MS = 5000;
const IDLE_TIMEOUT_MS = 700;
const MENU_CLOSE_DELAY_MS = 140;
const LAYOUT_RECONCILE_DELAY_MS = 80;
const BOOTSTRAP_TOTAL_TIMEOUT_MS = 12000;

// Preserve the owner/bootstrap catalog order independently of menu presentation.
const MEMBERS = Object.freeze([
Object.freeze({ key: "overview", label: "项目执行总览", icon: "network", pluginId: "project-execution-overview", viewType: "project-execution-overview-view", sourceBound: false }),
Object.freeze({ key: "workspace", label: "Workspace Mount", icon: "layout-grid", pluginId: "workspace-mount", viewType: "workspace-mount-view", sourceBound: true, sourceSetting: "workspaceSourceNotePath" }),
Object.freeze({ key: "gtd", label: "GTD 待办事项", icon: "list-todo", pluginId: "gtd-task-manager", viewType: "gtd-task-manager-view", sourceBound: false }),
Object.freeze({ key: "collection", label: "Collection Card", icon: "files", pluginId: "collection-card-view", viewType: "collection-card-view", sourceBound: true, sourceSetting: "collectionSourceNotePath" }),
Object.freeze({ key: "temporal", label: "时间框架", icon: "calendar-range", pluginId: "temporal-framework", viewType: "temporal-framework-view", sourceBound: false }),
Object.freeze({ key: "timeline", label: "Timeline 时间线", icon: "calendar-clock", pluginId: "timeline-planner", viewType: "timeline-planner-view", sourceBound: false }),
Object.freeze({ key: "nextAction", label: "下一步行动台", icon: "list-checks", pluginId: "collection-card-view", viewType: "collection-action-view", sourceBound: true, sourceSetting: "collectionSourceNotePath" }),
Object.freeze({ key: "ontology", label: "Ontology 元表格", icon: "table-properties", pluginId: "ontology-meta-hub", viewType: "ontology-meta-hub-view", sourceBound: false }),
Object.freeze({ key: "dailyReview", label: "每日 Note 回看", icon: "calendar-search", pluginId: "daily-note-review", viewType: "daily-note-review-view", sourceBound: false }),
Object.freeze({ key: "timeBlocks", label: "时间块记录", icon: "timer", pluginId: "mandala-time-blocks", viewType: "mandala-time-blocks-capture-view", sourceBound: true, sourceSetting: "mandalaSourceNotePath" }),
Object.freeze({ key: "dailyLessons", label: "日课", icon: "calendar-check", pluginId: "mandala-time-blocks", viewType: "mandala-daily-lessons-view", sourceBound: true, sourceSetting: "mandalaSourceNotePath" }),
Object.freeze({ key: "weeklyTracking", label: "周追踪", icon: "calendar-range", pluginId: "mandala-time-blocks", viewType: "mandala-weekly-tracking-view", sourceBound: true, sourceSetting: "mandalaSourceNotePath" }),
Object.freeze({ key: "mandalaGrid", label: "九宫格", icon: "grid-3x3", pluginId: "mandala-time-blocks", viewType: "mandala-nine-grid-view", sourceBound: true, sourceSetting: "mandalaSourceNotePath" }),
]);

const GROUPS = Object.freeze([
  Object.freeze({ key: "execution", label: "执行与收集", members: Object.freeze(["overview","workspace","gtd","collection"].map(key => MEMBERS.find(member => member.key === key))) }),
  Object.freeze({ key: "working", label: "执行过程", members: Object.freeze(["nextAction","ontology","timeBlocks","dailyLessons"].map(key => MEMBERS.find(member => member.key === key))) }),
  Object.freeze({ key: "review-planning", label: "回顾与长期规划", members: Object.freeze(["temporal","mandalaGrid","timeline","dailyReview","weeklyTracking"].map(key => MEMBERS.find(member => member.key === key))) }),
]);

const DEFAULT_SETTINGS = Object.freeze({
  schemaVersion: SETTINGS_VERSION,
  defaultMemberKey: "overview",
  workspaceSourceNotePath: "",
  collectionSourceNotePath: "",
  managedIdentities: {},
});

const text = (value, fallback = "") => String(value == null ? "" : value).trim() || fallback;
const normalizePath = (value) => text(value).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
const now = () => (typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now());
const percentile = (values, ratio) => {
  const list = (Array.isArray(values) ? values : []).filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!list.length) return null;
  const index = Math.min(list.length - 1, Math.max(0, Math.ceil(list.length * ratio) - 1));
  return Number(list[index].toFixed(3));
};
const nextFrame = () => new Promise((resolve) => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
  else setTimeout(resolve, 16);
});

function normalizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const identities = source.managedIdentities && typeof source.managedIdentities === "object"
    ? source.managedIdentities
    : {};
  return {
    schemaVersion: SETTINGS_VERSION,
    defaultMemberKey: MEMBERS.some((member) => member.key === source.defaultMemberKey)
      ? source.defaultMemberKey
      : DEFAULT_SETTINGS.defaultMemberKey,
    workspaceSourceNotePath: normalizePath(source.workspaceSourceNotePath),
    collectionSourceNotePath: normalizePath(source.collectionSourceNotePath),
    managedIdentities: Object.fromEntries(Object.entries(identities).map(([key, value]) => [key, normalizePath(value)])),
  };
}

function evaluatePerformanceGate(grouped, baseline) {
  const groupedHandler = Number(grouped?.handlerP95);
  const groupedActive = Number(grouped?.activeP95);
  const groupedPaint = Number(grouped?.paintP95);
  const baselinePaint = Number(baseline?.paintP95);
  const observedLongTasks = Number(grouped?.observedLongTaskCount || 0);
  const checks = {
    handlerP95: Number.isFinite(groupedHandler) && groupedHandler <= 8,
    activeP95: Number.isFinite(groupedActive) && groupedActive <= 16,
    paintRegression: Number.isFinite(groupedPaint) && Number.isFinite(baselinePaint) && groupedPaint - baselinePaint <= 16,
    observedLongTasks: observedLongTasks === 0,
  };
  return { pass: Object.values(checks).every(Boolean), checks };
}

class ViewGroupHubView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return HUB_VIEW_TYPE; }
  getDisplayText() { return "视图组"; }
  getIcon() { return "panels-top-left"; }

  async onOpen() {
    await this.plugin.attachController(this);
  }

  async onClose() {
    await this.plugin.detachController(this, "controller-close");
  }

  render(message = "") {
    const container = this.contentEl;
    container.empty();
    container.addClass("view-group-hub-controller-view");
    const header = container.createDiv({ cls: "view-group-hub-panel-header" });
    header.createEl("h2", { text: "视图组" });
    header.createEl("p", {
      text: `${GROUPS.length} 组 ${MEMBERS.length} 个成员保持为真实、已预热的 Obsidian leaf；这里仅管理分组与切换。`,
    });
    if (message) container.createDiv({ cls: "view-group-hub-message", text: message });

    const list = container.createDiv({ cls: "view-group-hub-member-list" });
    for (const group of GROUPS) {
      const section = list.createEl("section", { cls: "view-group-hub-controller-group" });
      section.createEl("h3", { text: group.label });
      const rows = section.createDiv({ cls: "view-group-hub-controller-group-rows" });
      for (const member of group.members) {
        const state = this.plugin.getMemberState(member.key);
        const row = rows.createDiv({ cls: `view-group-hub-member-row is-${state.status}` });
        const main = row.createEl("button", {
          cls: "view-group-hub-member-open",
          text: member.label,
          attr: { type: "button" },
        });
        main.disabled = state.status !== "ready";
        main.addEventListener("click", () => this.plugin.selectMember(member.key, "controller-panel"));
        row.createSpan({ cls: "view-group-hub-member-status", text: state.label });
        if (state.sourceNotePath) row.createEl("code", { text: state.sourceNotePath });
        if (state.reason) row.createSpan({ cls: "view-group-hub-member-reason", text: state.reason });
        if (state.status !== "ready") {
          const repair = row.createEl("button", {
            cls: "view-group-hub-repair-one",
            text: "修复",
            attr: { type: "button" },
          });
          repair.addEventListener("click", () => this.plugin.repairMember(member.key));
        }
      }
    }

    const footer = container.createDiv({ cls: "view-group-hub-panel-footer" });
    const repairAll = footer.createEl("button", { text: "修复视图组", attr: { type: "button" } });
    repairAll.addEventListener("click", () => this.plugin.repairAll());
  }
}

class PerformanceWarningModal extends Modal {
  constructor(app, onConfirm) {
    super(app);
    this.onConfirm = onConfirm;
  }

  onOpen() {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "运行高频切换 A/B？" });
    this.contentEl.createEl("p", {
      text: "该诊断会高速切换已打开页面约 200 次，可能触发成员插件的大量可见性刷新和长任务。它不是普通使用体验测试。",
    });
    const actions = this.contentEl.createDiv({ cls: "view-group-hub-confirm-actions" });
    const cancel = actions.createEl("button", { text: "取消", attr: { type: "button" } });
    cancel.addEventListener("click", () => this.close());
    const confirm = actions.createEl("button", { cls: "mod-warning", text: "仍然运行", attr: { type: "button" } });
    confirm.addEventListener("click", () => {
      const callback = this.onConfirm;
      this.onConfirm = null;
      this.close();
      callback?.();
    });
  }

  onClose() {
    this.onConfirm = null;
    this.contentEl.empty();
  }
}

class ViewGroupHubSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "View Group Hub" });
    new Setting(containerEl)
      .setName("默认成员")
      .setDesc("首次完成预热后激活的成员。")
      .addDropdown((dropdown) => {
        for (const member of MEMBERS) dropdown.addOption(member.key, member.label);
        dropdown.setValue(this.plugin.settings.defaultMemberKey);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultMemberKey = value;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("Workspace sourceNotePath")
      .setDesc("仅在没有可收编 Workspace leaf 时用于显式修复；留空即 fail closed。")
      .addText((input) => input
        .setPlaceholder("例如：④workspace挂载.md")
        .setValue(this.plugin.settings.workspaceSourceNotePath)
        .onChange(async (value) => {
          this.plugin.settings.workspaceSourceNotePath = normalizePath(value);
          await this.plugin.saveSettings();
        }))
      .addButton((button) => button
        .setButtonText("清除已记忆来源")
        .onClick(async () => {
          await this.plugin.clearManagedIdentity("workspace");
          this.display();
        }));
    new Setting(containerEl)
      .setName("Collection sourceNotePath")
      .setDesc("仅在没有可收编 Collection leaf 时用于显式修复；留空即 fail closed。")
      .addText((input) => input
        .setPlaceholder("例如：⑤集合卡视图.md")
        .setValue(this.plugin.settings.collectionSourceNotePath)
        .onChange(async (value) => {
          this.plugin.settings.collectionSourceNotePath = normalizePath(value);
          await this.plugin.saveSettings();
        }))
      .addButton((button) => button
        .setButtonText("清除已记忆来源")
        .onClick(async () => {
          await this.plugin.clearManagedIdentity("collection");
          this.display();
        }));
  }
}

class ViewGroupHubPlugin extends Plugin {
  async onload() {
    this.settings = normalizeSettings(await this.loadData());
    this.controller = null;
    this.managed = new Map();
    this.memberStates = new Map(MEMBERS.map((member) => [member.key, { status: "pending", label: "等待组打开", reason: "", sourceNotePath: "" }]));
    this.reconcilePromise = null;
    this.generation = 0;
    this.bootstrapFinished = false;
    this.visualCleanups = [];
    this.decoratedHeaders = new Map();
    this.headerListenerCleanups = new Map();
    this.ownedStackEl = null;
    this.visualContractFailedReason = "";
    this.visualContractSuspended = false;
    this.stackObserver = null;
    this.decorateFrame = 0;
    this.layoutReconcileTimer = 0;
    this.menuEl = null;
    this.menuCloseTimer = 0;
    this.lastSwitchMetrics = [];
    this.prewarmTelemetry = null;

    this.registerView(HUB_VIEW_TYPE, (leaf) => new ViewGroupHubView(leaf, this));
    this.addRibbonIcon("panels-top-left", "打开视图组", () => this.openHub());
    this.addCommand({ id: "open-view-group-hub", name: "Open View Group Hub", callback: () => this.openHub() });
    this.addCommand({ id: "repair-view-group-hub", name: "Repair View Group Hub", callback: () => this.repairAll() });
    this.addCommand({ id: "measure-view-group-hub-switching", name: "Measure View Group Hub switching (high frequency)", callback: () => this.confirmPerformanceAB() });
    this.addCommand({ id: "report-view-group-hub-ordinary-switching", name: "Report recent ordinary View Group Hub switching", callback: () => this.reportOrdinarySwitching() });
    this.addSettingTab(new ViewGroupHubSettingTab(this.app, this));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.onLayoutChange()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.updateActiveProxy()));
  }

  async onunload() {
    this.generation += 1;
    await this.cleanupVisualContract("plugin-unload");
    this.controller = null;
    this.managed.clear();
  }

  async saveSettings() {
    await this.saveData(normalizeSettings(this.settings));
  }

  async openHub() {
    let leaf = this.app.workspace.getLeavesOfType(HUB_VIEW_TYPE)[0] || null;
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: HUB_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  async attachController(view) {
    if (this.controller && this.controller !== view) {
      view.render("已存在另一个活动视图组；此重复组不会接管成员。请关闭它。 ");
      return;
    }
    this.controller = view;
    const activationAuthorityLeaf = this.app.workspace.activeLeaf;
    const bootstrapStartedAt = now();
    this.prewarmTelemetry = { startedAt: Date.now(), startedAtMonotonic: bootstrapStartedAt, finishedAt: null, totalMs: null, deadlineMs: BOOTSTRAP_TOTAL_TIMEOUT_MS, members: {} };
    this.visualContractFailedReason = "";
    this.bootstrapFinished = false;
    this.generation += 1;
    view.render("正在收编或预热成员……");
    await nextFrame();
    await this.reconcile({ allowCreate: true, reason: "controller-bootstrap", generation: this.generation, deadlineAt: bootstrapStartedAt + BOOTSTRAP_TOTAL_TIMEOUT_MS });
    if (this.prewarmTelemetry) {
      this.prewarmTelemetry.finishedAt = Date.now();
      this.prewarmTelemetry.totalMs = Number((now() - bootstrapStartedAt).toFixed(3));
      console.info("[ViewGroupHub][prewarm]", this.prewarmTelemetry);
    }
    if (this.controller !== view) return;
    this.bootstrapFinished = true;
    this.installVisualContract();
    view.render();
    const preferred = this.getMemberState(this.settings.defaultMemberKey);
    if (preferred.status === "ready" && this.app.workspace.activeLeaf === activationAuthorityLeaf) {
      this.selectMember(this.settings.defaultMemberKey, "bootstrap-default");
    }
  }

  async detachController(view, reason) {
    if (this.controller !== view) return;
    this.generation += 1;
    await this.cleanupVisualContract(reason);
    this.controller = null;
    this.bootstrapFinished = false;
    this.managed.clear();
  }

  getMember(key) { return MEMBERS.find((member) => member.key === key) || null; }
  getMemberState(key) {
    return this.memberStates.get(key) || { status: "unavailable", label: "不可用", reason: "unknown-member", sourceNotePath: "" };
  }
  setMemberState(key, patch) {
    const prior = this.getMemberState(key);
    const next = Object.assign({}, prior, patch);
    this.memberStates.set(key, next);
    const prewarm = this.prewarmTelemetry;
    const memberStart = prewarm?.members?.[key]?.startedAtMonotonic;
    if (prewarm && Number.isFinite(memberStart)) {
      const reason = text(next.reason);
      const outcome = next.status === "ready" && ["retained", "adopted", "created"].includes(reason)
        ? reason
        : reason.includes("timeout")
          ? "timeout"
          : reason.includes("focus-authority-left")
            ? "cancelled-focus-left"
            : reason.includes("total-deadline")
              ? "total-deadline"
              : next.status;
      prewarm.members[key] = Object.assign({}, prewarm.members[key], {
        status: next.status,
        reason,
        outcome,
        elapsedMs: Number((now() - memberStart).toFixed(3)),
      });
    }
    this.refreshControllerSoon();
    this.refreshMenuState();
  }

  registerVisualCleanup(cleanup) {
    let active = true;
    const wrapped = () => {
      if (!active) return;
      active = false;
      const index = this.visualCleanups.indexOf(wrapped);
      if (index >= 0) this.visualCleanups.splice(index, 1);
      cleanup();
    };
    this.visualCleanups.push(wrapped);
    return wrapped;
  }

  refreshControllerSoon() {
    if (!this.controller) return;
    if (this.controllerRenderFrame) return;
    this.controllerRenderFrame = requestAnimationFrame(() => {
      this.controllerRenderFrame = 0;
      if (this.controller && this.app.workspace.activeLeaf === this.controller.leaf) this.controller.render();
    });
  }

  getStackElement(leaf = this.controller?.leaf) {
    return leaf?.containerEl?.closest?.(".workspace-tabs") || null;
  }

  isSameStack(leaf, stack) {
    return !!stack && this.getStackElement(leaf) === stack;
  }

  getLeafSourcePath(leaf) {
    return normalizePath(leaf?.getViewState?.()?.state?.sourceNotePath || leaf?.view?.sourceNotePath || leaf?.view?.sourceFile?.path);
  }

  getExpectedSourcePath(member) {
    if (["timeBlocks", "dailyLessons", "weeklyTracking", "mandalaGrid"].includes(member?.key)) return normalizePath(this.app.plugins?.getPlugin?.("mandala-time-blocks")?.getTimeCaptureSourceNotePath?.());
    if (!member?.sourceBound) return "";
    return normalizePath(
      this.settings?.[member.sourceSetting]
      || this.settings.managedIdentities?.[member.key]
      || (member.key === "nextAction" ? this.settings.managedIdentities?.collection || this.app.plugins?.plugins?.["collection-card-view"]?.getDefaultSourceNotePath?.() : "")
    );
  }

  async clearManagedIdentity(key) {
    const member = this.getMember(key);
    if (!member?.sourceBound) return;
    this.settings[member.sourceSetting] = "";
    delete this.settings.managedIdentities[member.key];
    this.releaseManagedMember(member);
    await this.saveSettings();
    this.setMemberState(member.key, { status: "unavailable", label: "需要来源笔记", reason: "source-identity-cleared", sourceNotePath: "" });
  }

  releaseManagedMember(member) {
    const record = this.managed.get(member.key);
    if (record?.leaf) this.restoreHeaderForLeaf(record.leaf);
    this.managed.delete(member.key);
  }

  isPluginEnabled(member) {
    const manager = this.app.plugins;
    if (manager?.enabledPlugins instanceof Set && !manager.enabledPlugins.has(member.pluginId)) return false;
    if (typeof manager?.getPlugin === "function" && !manager.getPlugin(member.pluginId)) return false;
    return true;
  }

  describeLeaf(member, leaf) {
    const type = text(leaf?.view?.getViewType?.() || leaf?.getViewState?.()?.type);
    if (type !== member.viewType) return { ready: false, reason: `unexpected-view:${type || "empty"}`, sourceNotePath: "" };
    const sourceNotePath = this.getLeafSourcePath(leaf);
    if (member.sourceBound && !sourceNotePath) return { ready: false, reason: "source-note-unproven", sourceNotePath: "" };
    return { ready: true, reason: "", sourceNotePath };
  }

  findAdoptable(member, stack) {
    const all = this.app.workspace.getLeavesOfType(member.viewType) || [];
    const same = all.filter((leaf) => this.isSameStack(leaf, stack));
    const expectedSource = this.getExpectedSourcePath(member);
    const eligible = same.filter((leaf) => {
      const detail = this.describeLeaf(member, leaf);
      if (!detail.ready) return false;
      return !member.sourceBound || !expectedSource || detail.sourceNotePath === expectedSource;
    });
    return { all, same, eligible, expectedSource };
  }

  async reconcile(options = {}) {
    if (!this.controller) return false;
    if (this.reconcilePromise) {
      const current = this.reconcilePromise;
      if (options.allowCreate !== true) return current;
      await current;
      if (!this.controller) return false;
      return this.reconcile(options);
    }
    const generation = Number(options.generation || this.generation);
    const allowCreate = options.allowCreate === true;
    const repairKeys = options.repairKeys instanceof Set ? options.repairKeys : new Set();
    this.reconcilePromise = this.runReconcile({ generation, allowCreate, repairKeys, reason: text(options.reason), deadlineAt: Number(options.deadlineAt || 0) })
      .finally(() => { this.reconcilePromise = null; });
    return this.reconcilePromise;
  }

  async runReconcile({ generation, allowCreate, repairKeys, reason, deadlineAt }) {
    const stack = this.getStackElement();
    if (!stack) {
      this.failOpen("controller-stack-unavailable");
      return false;
    }

    for (const member of MEMBERS) {
      if (!this.controller || generation !== this.generation) return false;
      if (reason === "controller-bootstrap" && this.prewarmTelemetry) {
        this.prewarmTelemetry.members[member.key] = { startedAt: Date.now(), startedAtMonotonic: now(), status: "scanning", reason: "" };
      }
      const current = this.managed.get(member.key);
      if (current && (this.app.workspace.getLeavesOfType(member.viewType) || []).includes(current.leaf)) {
        const detail = this.describeLeaf(member, current.leaf);
        const expectedSource = this.getExpectedSourcePath(member);
        if (detail.ready && (!member.sourceBound || !expectedSource || detail.sourceNotePath === expectedSource)) {
          this.setMemberReady(member, current.leaf, detail.sourceNotePath, "retained");
          continue;
        }
      }
      this.releaseManagedMember(member);

      const found = this.findAdoptable(member, stack);
      const explicitRepair = repairKeys.has(member.key);
      if (found.eligible.length === 1) {
        const leaf = found.eligible[0];
        const detail = this.describeLeaf(member, leaf);
        await this.adoptMember(member, leaf, detail.sourceNotePath);
        if (found.same.length > 1 || found.all.length > 1) {
          this.setMemberState(member.key, { reason: `ready-with-unmanaged-extras:${found.all.length}` });
        }
        continue;
      }
      const canCreateConfiguredSource = allowCreate && explicitRepair && member.sourceBound && !!found.expectedSource && found.eligible.length === 0;
      if (found.eligible.length > 1 || (found.same.length > 1 && !canCreateConfiguredSource)) {
        this.setMemberState(member.key, { status: "degraded", label: "存在重复实例", reason: "ambiguous-same-stack-leaves", sourceNotePath: found.expectedSource });
        this.failOpen("ambiguous-member-leaves");
        continue;
      }
      if (found.same.length > 0) {
        if (!canCreateConfiguredSource) {
          this.setMemberState(member.key, { status: "unavailable", label: "来源身份不匹配", reason: "same-stack-source-identity-mismatch", sourceNotePath: found.expectedSource });
          continue;
        }
      }
      if (!allowCreate || (this.bootstrapFinished && !explicitRepair)) {
        this.setMemberState(member.key, { status: "unavailable", label: "成员已关闭", reason: "explicit-repair-required", sourceNotePath: found.expectedSource });
        continue;
      }
      if (!this.isPluginEnabled(member)) {
        this.setMemberState(member.key, { status: "unavailable", label: "插件未启用", reason: "owner-plugin-unavailable", sourceNotePath: found.expectedSource });
        continue;
      }
      if (member.sourceBound && !found.expectedSource) {
        this.setMemberState(member.key, { status: "unavailable", label: "需要来源笔记", reason: "source-note-unproven-configure-settings", sourceNotePath: "" });
        continue;
      }
      if (reason === "controller-bootstrap" && deadlineAt > 0 && now() >= deadlineAt) {
        this.setMemberState(member.key, { status: "unavailable", label: "预热总时限已到", reason: "bootstrap-total-deadline-explicit-repair-required", sourceNotePath: found.expectedSource });
        continue;
      }
      if (reason === "controller-bootstrap" && this.app.workspace.activeLeaf !== this.controller.leaf) {
        this.setMemberState(member.key, { status: "unavailable", label: "预热已暂停", reason: "focus-authority-left-controller-explicit-repair-required", sourceNotePath: found.expectedSource });
        continue;
      }

      this.setMemberState(member.key, { status: "warming", label: "正在预热", reason, sourceNotePath: found.expectedSource });
      await this.waitForIdle(generation);
      if (!this.controller || generation !== this.generation) return false;
      if (reason === "controller-bootstrap" && deadlineAt > 0 && now() >= deadlineAt) {
        this.setMemberState(member.key, { status: "unavailable", label: "预热总时限已到", reason: "bootstrap-total-deadline-explicit-repair-required", sourceNotePath: found.expectedSource });
        continue;
      }
      if (reason === "controller-bootstrap" && this.app.workspace.activeLeaf !== this.controller.leaf) {
        this.setMemberState(member.key, { status: "unavailable", label: "预热已暂停", reason: "focus-authority-left-controller-explicit-repair-required", sourceNotePath: found.expectedSource });
        continue;
      }

      const fresh = this.findAdoptable(member, stack);
      if (fresh.eligible.length === 1) {
        const leaf = fresh.eligible[0];
        const detail = this.describeLeaf(member, leaf);
        await this.adoptMember(member, leaf, detail.sourceNotePath);
        continue;
      }
      if (fresh.same.length > 0) {
        const canCreateConfiguredSource = explicitRepair && member.sourceBound && !!fresh.expectedSource && fresh.eligible.length === 0;
        if (!canCreateConfiguredSource) {
          this.setMemberState(member.key, { status: "unavailable", label: "检测到同栈冲突", reason: "rescan-same-stack-conflict", sourceNotePath: fresh.expectedSource });
          continue;
        }
      }

      const remainingMs = deadlineAt > 0 ? Math.max(0, deadlineAt - now()) : READY_TIMEOUT_MS;
      if (reason === "controller-bootstrap" && remainingMs <= 0) {
        this.setMemberState(member.key, { status: "unavailable", label: "预热总时限已到", reason: "bootstrap-total-deadline-explicit-repair-required", sourceNotePath: fresh.expectedSource });
        continue;
      }
      const created = await this.createMember(member, fresh.expectedSource, generation, Math.min(READY_TIMEOUT_MS, Math.max(1, remainingMs)), deadlineAt);
      if (!created) continue;
      if (fresh.all.length > 0) {
        this.setMemberState(member.key, { reason: `ready-with-independent-extras:${fresh.all.length}` });
      }
    }
    this.installVisualContract();
    return true;
  }

  async waitForIdle(generation) {
    await new Promise((resolve) => {
      let settled = false;
      let dispose = () => {};
      const finish = () => {
        if (settled) return;
        settled = true;
        dispose();
        resolve();
      };
      if (typeof requestIdleCallback === "function") {
        const id = requestIdleCallback(finish, { timeout: IDLE_TIMEOUT_MS });
        dispose = this.registerVisualCleanup(() => { try { cancelIdleCallback(id); } catch (_) {} finish(); });
      } else {
        const id = setTimeout(finish, 32);
        dispose = this.registerVisualCleanup(() => { clearTimeout(id); finish(); });
      }
    });
    return generation === this.generation;
  }

  async awaitMemberReady(operationOrFactory, timeoutMs = READY_TIMEOUT_MS, deadlineAt = 0) {
    return await new Promise((resolve) => {
      let settled = false;
      let dispose = () => {};
      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        dispose();
        resolve(value);
      };
      const timer = window.setTimeout(() => finish("timeout"), Math.max(1, Number(timeoutMs) || READY_TIMEOUT_MS));
      dispose = this.registerVisualCleanup(() => finish("cancelled"));
      let operation;
      try {
        operation = typeof operationOrFactory === "function" ? operationOrFactory() : operationOrFactory;
      } catch (_) {
        finish("failed");
        return;
      }
      Promise.resolve(operation).then(
        () => finish(deadlineAt > 0 && now() >= deadlineAt ? "timeout" : "ready"),
        () => finish("failed"),
      );
    });
  }

  async createMember(member, sourceNotePath, generation, readyTimeoutMs = READY_TIMEOUT_MS, deadlineAt = 0) {
    const prior = this.app.workspace.activeLeaf || null;
    let leaf = null;
    try {
      this.app.workspace.setActiveLeaf(this.controller.leaf, { focus: false });
      leaf = this.app.workspace.getLeaf("tab");
      const viewState = { type: member.viewType, active: false };
      if (member.sourceBound) viewState.state = { sourceNotePath };
      let operation = null;
      const result = await this.awaitMemberReady(() => {
        operation = Promise.resolve(leaf.setViewState(viewState));
        return operation;
      }, readyTimeoutMs, deadlineAt);
      if (result !== "ready") {
        this.setMemberState(member.key, { status: "unavailable", label: result === "timeout" ? "预热超时" : "预热失败", reason: `set-view-state-${result}`, sourceNotePath });
        operation?.then(() => this.onLateCreatedLeaf(member, leaf, generation), () => {});
        return false;
      }
      const detail = this.describeLeaf(member, leaf);
      if (!detail.ready) {
        this.setMemberState(member.key, { status: "unavailable", label: "初始化未就绪", reason: detail.reason, sourceNotePath });
        return false;
      }
      if (generation !== this.generation || !this.controller) {
        console.info("[ViewGroupHub][stale-created-leaf-retained]", { member: member.key, viewType: member.viewType });
        return false;
      }
      await this.adoptMember(member, leaf, detail.sourceNotePath, "created");
      return true;
    } catch (error) {
      console.error("[ViewGroupHub][member-create-failed]", { member: member.key, error });
      this.setMemberState(member.key, { status: "unavailable", label: "创建失败", reason: text(error?.message, "unknown-error"), sourceNotePath });
      return false;
    } finally {
      const activeNow = this.app.workspace.activeLeaf;
      const pluginStillOwnsFocus = activeNow === leaf || activeNow === this.controller?.leaf;
      if (prior && prior !== leaf && pluginStillOwnsFocus) {
        try { this.app.workspace.setActiveLeaf(prior, { focus: false }); } catch (_) {}
      }
    }
  }

  onLateCreatedLeaf(member, leaf, generation) {
    console.info("[ViewGroupHub][late-created-leaf-retained]", {
      member: member.key,
      generation,
      currentGeneration: this.generation,
      viewType: text(leaf?.view?.getViewType?.() || leaf?.getViewState?.()?.type),
    });
    if (this.controller) void this.reconcile({ allowCreate: false, reason: "late-created-leaf" });
  }

  async adoptMember(member, leaf, sourceNotePath, reason = "adopted") {
    this.managed.set(member.key, { leaf, sourceNotePath: normalizePath(sourceNotePath), adoptedAt: Date.now() });
    if (member.sourceBound && sourceNotePath) {
      this.settings.managedIdentities[member.key] = normalizePath(sourceNotePath);
      await this.saveSettings();
    }
    this.setMemberReady(member, leaf, sourceNotePath, reason);
  }

  setMemberReady(member, leaf, sourceNotePath, reason) {
    this.managed.set(member.key, { leaf, sourceNotePath: normalizePath(sourceNotePath), adoptedAt: Date.now() });
    this.setMemberState(member.key, { status: "ready", label: "已预热", reason, sourceNotePath: normalizePath(sourceNotePath) });
  }

  onLayoutChange() {
    this.scheduleDecorate();
    if (!this.controller || !this.bootstrapFinished || this.visualContractSuspended || this.layoutReconcileTimer) return;
    this.layoutReconcileTimer = window.setTimeout(() => {
      this.layoutReconcileTimer = 0;
      if (!this.controller || !this.bootstrapFinished || this.visualContractSuspended) return;
      void this.reconcile({ allowCreate: false, reason: "layout-change-coalesced", generation: this.generation });
    }, LAYOUT_RECONCILE_DELAY_MS);
  }

  async repairMember(key) {
    const member = this.getMember(key);
    if (!member || !this.controller) return;
    if (member.sourceBound && !this.getExpectedSourcePath(member)) {
      new Notice(["timeBlocks", "dailyLessons", "weeklyTracking"].includes(member.key) ? "请先在 Mandala 时间块设置中配置来源笔记。" : `${member.label} 缺少已证明的 sourceNotePath，请先在 View Group Hub 设置中配置。`);
      return;
    }
    this.visualContractFailedReason = "";
    await this.reconcile({ allowCreate: true, repairKeys: new Set([key]), reason: "explicit-repair", generation: this.generation });
    this.controller?.render();
  }

  async repairAll() {
    if (!this.controller) {
      new Notice("请先打开视图组。 ");
      return;
    }
    this.visualContractFailedReason = "";
    await this.reconcile({ allowCreate: true, repairKeys: new Set(MEMBERS.map((member) => member.key)), reason: "explicit-repair-all", generation: this.generation });
    this.controller?.render();
  }

  isManagedLeafAlive(member, record) {
    return !!record?.leaf && (this.app.workspace.getLeavesOfType(member.viewType) || []).includes(record.leaf);
  }

  selectMember(key, source = "menu", options = {}) {
    const started = now();
    const member = this.getMember(key);
    const record = this.managed.get(key);
    if (!member || !this.isManagedLeafAlive(member, record)) {
      this.setMemberState(key, { status: "unavailable", label: "成员已关闭", reason: "explicit-repair-required" });
      new Notice(`${member?.label || key} 当前不可用，请显式修复。`);
      return false;
    }
    if (["timeBlocks", "dailyLessons", "weeklyTracking"].includes(key)) {
      const expectedSource = this.getExpectedSourcePath(member);
      if (!expectedSource || this.getLeafSourcePath(record.leaf) !== expectedSource) {
        this.setMemberState(key, { status: "unavailable", label: expectedSource ? "来源已切换" : "需要来源笔记", reason: "source-identity-mismatch-explicit-repair", sourceNotePath: expectedSource });
        new Notice(expectedSource ? `${member.label}来源已切换，请显式修复以打开当前来源；旧标签页和草稿会保留。` : "请先在 Mandala 时间块设置中配置来源笔记。");
        return false;
      }
    }
    this.hideMenu();
    this.app.workspace.setActiveLeaf(record.leaf, { focus: options.focus !== false });
    const metric = { member: key, source, handlerMs: null, eventToActiveMs: null, firstPaintMs: null, startedAt: Date.now() };
    this.lastSwitchMetrics.push(metric);
    if (this.lastSwitchMetrics.length > 300) this.lastSwitchMetrics.shift();
    Promise.resolve().then(() => {
      metric.eventToActiveMs = now() - started;
      return nextFrame();
    }).then(() => {
      metric.firstPaintMs = now() - started;
      this.updateActiveProxy();
      console.debug("[ViewGroupHub][switch-metric]", metric);
    });
    metric.handlerMs = now() - started;
    return true;
  }

  getHeaderForLeaf(leaf, stack = this.getStackElement(leaf)) {
    if (!leaf || !stack) return null;
    if (leaf.tabHeaderEl?.classList) return leaf.tabHeaderEl;
    const viewType = text(leaf?.view?.getViewType?.() || leaf?.getViewState?.()?.type);
    const candidates = Array.from(stack.querySelectorAll?.(".workspace-tab-header") || []);
    const leafId = text(leaf.id || leaf.containerEl?.dataset?.id);
    if (leafId) {
      const exact = candidates.find((header) => text(header.dataset?.id) === leafId || text(header.getAttribute?.("aria-controls")) === leafId);
      if (exact) return exact;
    }
    const typed = candidates.filter((header) => text(header.dataset?.type) === viewType);
    return typed.length === 1 ? typed[0] : null;
  }

  installVisualContract() {
    if (!this.controller) return false;
    if (this.visualContractFailedReason || this.visualContractSuspended) return false;
    const stack = this.getStackElement();
    const controllerHeader = this.getHeaderForLeaf(this.controller.leaf, stack);
    if (!stack || !controllerHeader) {
      this.failOpen("controller-header-unavailable");
      return false;
    }
    const memberHeaders = [];
    for (const member of MEMBERS) {
      const record = this.managed.get(member.key);
      if (!record || !this.isManagedLeafAlive(member, record)) continue;
      const header = this.getHeaderForLeaf(record.leaf, stack);
      if (!header) {
        this.failOpen(`member-header-unavailable:${member.key}`);
        return false;
      }
      memberHeaders.push({ member, header });
    }

    stack.classList.add("view-group-hub-owned-stack");
    this.ownedStackEl = stack;
    controllerHeader.classList.add("view-group-hub-controller-header");
    if (!this.decoratedHeaders.has(controllerHeader)) {
      this.decoratedHeaders.set(controllerHeader, { ariaHidden: controllerHeader.getAttribute("aria-hidden"), tabIndex: controllerHeader.getAttribute("tabindex") });
    }
    controllerHeader.setAttribute("tabindex", "0");
    for (const [header, cleanup] of Array.from(this.headerListenerCleanups.entries())) {
      if (!header.isConnected) cleanup();
    }
    if (!this.headerListenerCleanups.has(controllerHeader)) {
      const enter = () => this.showMenu(controllerHeader);
      const leave = () => this.scheduleHideMenu();
      const focus = () => this.showMenu(controllerHeader);
      const keydown = (event) => {
        if (!["ArrowDown", "Enter", " "].includes(event.key)) return;
        event.preventDefault();
        this.showMenu(controllerHeader);
        this.focusMenuItem(0);
      };
      controllerHeader.addEventListener("pointerenter", enter);
      controllerHeader.addEventListener("pointerleave", leave);
      controllerHeader.addEventListener("focusin", focus);
      controllerHeader.addEventListener("keydown", keydown);
      const cleanup = this.registerVisualCleanup(() => {
        controllerHeader.removeEventListener("pointerenter", enter);
        controllerHeader.removeEventListener("pointerleave", leave);
        controllerHeader.removeEventListener("focusin", focus);
        controllerHeader.removeEventListener("keydown", keydown);
        this.headerListenerCleanups.delete(controllerHeader);
      });
      this.headerListenerCleanups.set(controllerHeader, cleanup);
    }
    for (const { header } of memberHeaders) {
      if (!this.decoratedHeaders.has(header)) this.decoratedHeaders.set(header, { ariaHidden: header.getAttribute("aria-hidden"), tabIndex: header.getAttribute("tabindex") });
      header.classList.add("view-group-hub-member-header");
      header.setAttribute("aria-hidden", "true");
      header.setAttribute("tabindex", "-1");
    }
    this.ensureMenu();
    this.observeHeaderContainer(controllerHeader);
    this.updateActiveProxy();
    return true;
  }

  observeHeaderContainer(controllerHeader) {
    if (this.stackObserver || typeof MutationObserver !== "function") return;
    const target = controllerHeader?.parentElement
      || controllerHeader?.closest?.(".workspace-tab-header-container")
      || null;
    if (!target) return;
    this.stackObserver = new MutationObserver(() => this.scheduleDecorate());
    this.stackObserver.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-type", "data-id"] });
  }

  scheduleDecorate() {
    if (!this.controller || this.visualContractFailedReason || this.visualContractSuspended || this.decorateFrame) return;
    this.decorateFrame = requestAnimationFrame(() => {
      this.decorateFrame = 0;
      if (this.controller) this.installVisualContract();
    });
  }

  ensureMenu() {
    if (this.menuEl?.isConnected) return this.menuEl;
    const menu = document.createElement("div");
    menu.className = "view-group-hub-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "视图组");
    menu.hidden = true;
    for (const group of GROUPS) {
      const column = document.createElement("div");
      column.className = "view-group-hub-menu-group";
      column.setAttribute("role", "group");
      const heading = document.createElement("div");
      heading.className = "view-group-hub-menu-group-title";
      heading.id = `view-group-hub-menu-group-${group.key}`;
      heading.textContent = group.label;
      column.setAttribute("aria-labelledby", heading.id);
      column.appendChild(heading);
      for (const member of group.members) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.memberKey = member.key;
        button.setAttribute("role", "menuitem");
        button.textContent = member.label;
        button.addEventListener("click", () => this.selectMember(member.key, "hover-menu"));
        column.appendChild(button);
      }
      menu.appendChild(column);
    }
    const repair = document.createElement("button");
    repair.type = "button";
    repair.className = "view-group-hub-menu-repair";
    repair.setAttribute("role", "menuitem");
    repair.textContent = "修复视图组";
    repair.addEventListener("click", () => this.repairAll());
    menu.appendChild(repair);
    menu.addEventListener("pointerenter", () => this.cancelHideMenu());
    menu.addEventListener("pointerleave", () => this.scheduleHideMenu());
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.hideMenu();
        this.getHeaderForLeaf(this.controller?.leaf)?.focus?.();
        return;
      }
      const items = this.getEnabledMenuItems();
      const current = items.indexOf(document.activeElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(current + 1 + items.length) % items.length]?.focus?.();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus?.();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus?.();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus?.();
      }
    });
    document.body.appendChild(menu);
    this.menuEl = menu;
    this.refreshMenuState();
    return menu;
  }

  refreshMenuState() {
    if (!this.menuEl) return;
    for (const member of MEMBERS) {
      const state = this.getMemberState(member.key);
      const button = this.menuEl.querySelector(`[data-member-key="${member.key}"]`);
      if (!button) continue;
      button.disabled = state.status !== "ready";
      button.dataset.status = state.status;
      button.title = state.reason || state.label;
    }
  }

  getEnabledMenuItems() {
    return Array.from(this.menuEl?.querySelectorAll?.('button:not(:disabled)') || []);
  }

  focusMenuItem(index) {
    const items = this.getEnabledMenuItems();
    items[Math.max(0, Math.min(index, items.length - 1))]?.focus?.();
  }

  showMenu(header) {
    const menu = this.ensureMenu();
    if (!menu || !header?.getBoundingClientRect) return;
    this.cancelHideMenu();
    const rect = header.getBoundingClientRect();
    menu.hidden = false;
    menu.classList.add("is-open");
    const width = Math.max(280, Number(menu.offsetWidth) || 560);
    const height = Math.max(120, Number(menu.offsetHeight) || 320);
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - height - 8))}px`;
  }

  scheduleHideMenu() {
    this.cancelHideMenu();
    this.menuCloseTimer = window.setTimeout(() => this.hideMenu(), MENU_CLOSE_DELAY_MS);
  }
  cancelHideMenu() {
    if (this.menuCloseTimer) window.clearTimeout(this.menuCloseTimer);
    this.menuCloseTimer = 0;
  }
  hideMenu() {
    this.cancelHideMenu();
    if (!this.menuEl) return;
    this.menuEl.hidden = true;
    this.menuEl.classList.remove("is-open");
  }

  updateActiveProxy() {
    const header = this.getHeaderForLeaf(this.controller?.leaf);
    if (!header) return;
    if (header.classList.contains("view-group-hub-controller-header")) header.setAttribute("tabindex", "0");
    const active = Array.from(this.managed.values()).some((record) => record.leaf === this.app.workspace.activeLeaf);
    header.classList.toggle("is-active-proxy", active);
  }

  failOpen(reason) {
    console.warn("[ViewGroupHub][fail-open]", { reason });
    this.visualContractFailedReason = reason;
    void this.cleanupVisualContract(`fail-open:${reason}`).then(() => this.setHubDiagnostic(reason));
  }

  setHubDiagnostic(reason) {
    if (this.controller && this.app.workspace.activeLeaf === this.controller.leaf) this.controller.render(`分组 UI 已安全回退：${reason}`);
  }

  restoreNativeHeaders() {
    this.ownedStackEl?.classList?.remove("view-group-hub-owned-stack");
    this.ownedStackEl = null;
    for (const [header, original] of this.decoratedHeaders.entries()) {
      header.classList.remove("view-group-hub-member-header", "view-group-hub-controller-header", "is-active-proxy");
      if (original.ariaHidden == null) header.removeAttribute("aria-hidden");
      else header.setAttribute("aria-hidden", original.ariaHidden);
      if (original.tabIndex == null) header.removeAttribute("tabindex");
      else header.setAttribute("tabindex", original.tabIndex);
    }
    this.decoratedHeaders.clear();
  }

  restoreHeaderForLeaf(leaf) {
    const header = this.getHeaderForLeaf(leaf, this.getStackElement(leaf));
    const original = header ? this.decoratedHeaders.get(header) : null;
    if (!header || !original) return;
    header.classList.remove("view-group-hub-member-header", "view-group-hub-controller-header", "is-active-proxy");
    if (original.ariaHidden == null) header.removeAttribute("aria-hidden");
    else header.setAttribute("aria-hidden", original.ariaHidden);
    if (original.tabIndex == null) header.removeAttribute("tabindex");
    else header.setAttribute("tabindex", original.tabIndex);
    this.decoratedHeaders.delete(header);
  }

  async cleanupVisualContract(reason) {
    this.hideMenu();
    if (this.controllerRenderFrame) cancelAnimationFrame(this.controllerRenderFrame);
    if (this.decorateFrame) cancelAnimationFrame(this.decorateFrame);
    if (this.layoutReconcileTimer) window.clearTimeout(this.layoutReconcileTimer);
    this.controllerRenderFrame = 0;
    this.decorateFrame = 0;
    this.layoutReconcileTimer = 0;
    this.stackObserver?.disconnect?.();
    this.stackObserver = null;
    for (const cleanup of this.visualCleanups.slice()) {
      try { cleanup(); } catch (_) {}
    }
    this.restoreNativeHeaders();
    this.menuEl?.remove?.();
    this.menuEl = null;
    console.info("[ViewGroupHub][visual-cleanup]", { reason });
  }

  confirmPerformanceAB() {
    new PerformanceWarningModal(this.app, () => { void this.runPerformanceAB(); }).open();
  }

  reportOrdinarySwitching() {
    const requiredSamples = MEMBERS.length * 2;
    const ordinary = this.lastSwitchMetrics
      .filter((metric) => metric.source === "hover-menu" || metric.source === "controller-panel")
      .filter((metric) => Number.isFinite(metric.handlerMs) && Number.isFinite(metric.eventToActiveMs))
      .slice(-requiredSamples);
    const uniqueMembers = new Set(ordinary.map((metric) => metric.member));
    const counts = Object.fromEntries(MEMBERS.map((member) => [member.key, ordinary.filter((metric) => metric.member === member.key).length]));
    const dwellMs = ordinary.map((metric, index) => {
      const nextStartedAt = ordinary[index + 1]?.startedAt || Date.now();
      return Math.max(0, nextStartedAt - metric.startedAt);
    });
    const coveragePass = MEMBERS.every((member) => counts[member.key] === 2);
    const dwellPass = ordinary.length === requiredSamples && dwellMs.every((duration) => duration >= 750);
    const handlerP95 = percentile(ordinary.map((metric) => metric.handlerMs), 0.95);
    const activeP95 = percentile(ordinary.map((metric) => metric.eventToActiveMs), 0.95);
    const maxMs = ordinary.length
      ? Number(Math.max(...ordinary.map((metric) => Math.max(metric.handlerMs, metric.eventToActiveMs))).toFixed(3))
      : null;
    const result = {
      samples: ordinary.length,
      uniqueMembers: Array.from(uniqueMembers),
      expectedMembers: MEMBERS.map((member) => member.key),
      counts,
      dwellMs,
      coveragePass,
      dwellPass,
      handlerP95,
      activeP95,
      maxMs,
      pass: ordinary.length === requiredSamples && uniqueMembers.size === MEMBERS.length && coveragePass && dwellPass && handlerP95 <= 250 && activeP95 <= 250 && maxMs < 500,
      gate: `two user-paced rounds across ${MEMBERS.length} members; >=750ms dwell; p95 <=250ms; max <500ms`,
    };
    console.info("[ViewGroupHub][ordinary-switch-report]", result);
    new Notice(result.pass
      ? "普通切换指标通过，详细结果见控制台。"
      : `普通切换样本不足或未通过；请按两轮 ${MEMBERS.length} 成员、每次停留至少 750ms 后重试。`, 8000);
    return result;
  }

  async measureSwitchSequence(sampleCount, grouped) {
    const ready = MEMBERS.filter((member) => this.getMemberState(member.key).status === "ready");
    if (ready.length < 2) throw new Error("At least two ready members are required.");
    const handlers = [];
    const active = [];
    const paint = [];
    const longTasks = [];
    let observer = null;
    if (typeof PerformanceObserver === "function") {
      try {
        observer = new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((entry) => ({ duration: entry.duration, startTime: entry.startTime }))));
        observer.observe({ entryTypes: ["longtask"] });
      } catch (_) { observer = null; }
    }
    const original = this.app.workspace.activeLeaf;
    for (let index = 0; index < sampleCount; index += 1) {
      const member = ready[index % ready.length];
      const record = this.managed.get(member.key);
      const started = now();
      const switched = this.selectMember(member.key, grouped ? "performance-grouped" : "performance-baseline", { focus: false });
      const measuredMetric = this.lastSwitchMetrics[this.lastSwitchMetrics.length - 1];
      if (!switched || measuredMetric?.member !== member.key) throw new Error(`member-switch-failed:${member.key}`);
      handlers.push(measuredMetric.handlerMs);
      await Promise.resolve();
      active.push(this.app.workspace.activeLeaf === record.leaf ? now() - started : Number.POSITIVE_INFINITY);
      await nextFrame();
      await nextFrame();
      paint.push(now() - started);
    }
    if (original) this.app.workspace.setActiveLeaf(original, { focus: false });
    observer?.disconnect?.();
    const result = {
      mode: grouped ? "grouped" : "ungrouped-baseline",
      samples: sampleCount,
      handlerP95: percentile(handlers, 0.95),
      activeP95: percentile(active, 0.95),
      paintP95: percentile(paint, 0.95),
      longTaskCount: longTasks.length,
      observedLongTaskCount: longTasks.filter((entry) => entry.duration >= 50).length,
      longTasks,
    };
    return result;
  }

  async runPerformanceAB(sampleCount = 100) {
    if (!this.controller || this.reconcilePromise) {
      new Notice("视图组尚未就绪。 ");
      return null;
    }
    const count = Math.max(20, Math.min(200, Number(sampleCount) || 100));
    new Notice(`开始 ${count} 次 A/B 切换测量；请暂时不要操作 Obsidian。`);
    try {
      this.visualContractSuspended = true;
      await this.cleanupVisualContract("performance-baseline-suspend");
      const baseline = await this.measureSwitchSequence(count, false);
      this.visualContractSuspended = false;
      this.visualContractFailedReason = "";
      this.installVisualContract();
      const grouped = await this.measureSwitchSequence(count, true);
      const gate = evaluatePerformanceGate(grouped, baseline);
      const result = {
        environment: { userAgent: navigator.userAgent, timestamp: new Date().toISOString(), members: MEMBERS.map((member) => member.viewType) },
        attribution: "Full selectMember handler (menu close, setActiveLeaf, metric scheduling); activeLeaf equality after microtask; retained paint after two animation frames. Any grouped >=50ms long task is conservatively gate-failing because browser Long Task entries cannot attribute Hub versus owner. Owner interaction-ready remains a separate loaded smoke.",
        baseline,
        grouped,
        gate,
      };
      console.info("[ViewGroupHub][performance-ab]", result);
      new Notice(gate.pass ? "View Group Hub A/B 性能门禁通过，详细结果见控制台。" : "View Group Hub A/B 性能门禁失败，停止部署并查看控制台。", 8000);
      return result;
    } catch (error) {
      this.visualContractSuspended = false;
      this.failOpen(`performance-ab-failed:${text(error?.message)}`);
      new Notice(`性能测量失败：${text(error?.message, "unknown error")}`);
      return null;
    }
  }
}

module.exports = ViewGroupHubPlugin;
module.exports.__test = {
  GROUPS,
  MEMBERS,
  BOOTSTRAP_TOTAL_TIMEOUT_MS,
  normalizePath,
  normalizeSettings,
  percentile,
  evaluatePerformanceGate,
};
