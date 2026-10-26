const obsidian = require("obsidian");
const { ItemView, Plugin, PluginSettingTab, Setting } = obsidian;

const VIEW_TYPE_SUPERMEMO_PLAN = "supermemo-plan-view";
const SUPERMEMO_PLAN_RELATION_VIEW_TYPE = VIEW_TYPE_SUPERMEMO_PLAN;
const SUPERMEMO_PLAN_ADAPTER_ID = "supermemo-plan::activity-index";
const SUPERMEMO_PLAN_DATA_FILE = "superplan_data.json";

const DEFAULT_SETTINGS = {
  sourceNotePath: "项目/18-战略视图迭代/18E-GTD夹子/18E1-下一步代办事项清单文件夹/下一步代办的liner chain/supermemoplan做计划，带自动保存版.md",
  dataFolder: "",
  autoOpenOnLoad: false,
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

let editorSessionCounter = 0;
function createEditorSessionId(prefix = "session") {
  editorSessionCounter += 1;
  return `${prefix}:${Date.now().toString(36)}:${editorSessionCounter.toString(36)}`;
}

function normalizePath(value) {
  return text(value).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function dirname(path) {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
}

function encodeNodePart(value) {
  return encodeURIComponent(text(value));
}

function decodeNodePart(value) {
  try { return decodeURIComponent(text(value)); } catch (_) { return text(value); }
}

function parseJumpNodeKey(nodeKey) {
  const raw = text(nodeKey);
  if (!raw.startsWith("jump:v1:")) return null;
  const parts = raw.slice("jump:v1:".length).split("|").map(decodeNodePart);
  if (parts.length !== 5) return null;
  return { viewType: parts[0], notePath: parts[1], scopeType: parts[2], scopeId: parts[3], itemId: parts[4] };
}

function normalizeSettings(raw = {}) {
  return {
    sourceNotePath: normalizePath(raw.sourceNotePath || DEFAULT_SETTINGS.sourceNotePath),
    dataFolder: normalizePath(raw.dataFolder),
    autoOpenOnLoad: raw.autoOpenOnLoad === true,
  };
}

class SuperMemoPlanSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "SuperMemo Plan" });
    containerEl.createEl("p", { text: "Whole-moved from the original DataviewJS program. JSON files stay beside the configured source note unless dataFolder is set." });

    new Setting(containerEl)
      .setName("Source note path")
      .setDesc("Used to locate the original note folder for superplan_data.json and YAML restore.")
      .addText((input) => input
        .setPlaceholder(DEFAULT_SETTINGS.sourceNotePath)
        .setValue(this.plugin.settings.sourceNotePath)
        .onChange(async (value) => {
          this.plugin.settings.sourceNotePath = normalizePath(value || DEFAULT_SETTINGS.sourceNotePath);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("Data folder override")
      .setDesc("Optional. Leave empty to use the source note folder.")
      .addText((input) => input
        .setPlaceholder("optional/folder")
        .setValue(this.plugin.settings.dataFolder)
        .onChange(async (value) => {
          this.plugin.settings.dataFolder = normalizePath(value);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("Auto open on load")
      .setDesc("Off by default to avoid stealing focus during Obsidian startup.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoOpenOnLoad)
        .onChange(async (value) => {
          this.plugin.settings.autoOpenOnLoad = value === true;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Open view")
      .addButton((button) => button.setButtonText("Open").setCta().onClick(async () => this.plugin.activateView()));
  }
}

class SuperMemoPlanView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderSeq = 0;
    this.engineSession = null;
    this.hostId = createEditorSessionId("standalone");
    this.runtimeState = {};
  }

  getViewType() { return VIEW_TYPE_SUPERMEMO_PLAN; }
  getDisplayText() { return "SuperMemo Plan"; }
  getIcon() { return "calendar-clock"; }

  async onOpen() {
    this.contentEl.addClass("supermemo-plan-view-host");
    await this.render();
  }

  async onClose() {
    this.cleanupEngine();
    this.contentEl.empty();
  }

  cleanupEngine() {
    if (this.engineSession && typeof this.engineSession.cleanup === "function") {
      try { this.engineSession.cleanup(); } catch (error) { console.warn("[SuperMemo Plan][cleanup-fail]", error); }
    }
    this.engineSession = null;
  }

  showSuspended(reason = "taken-over") {
    this.renderSeq += 1;
    this.engineSession = null;
    this.contentEl.empty();
    const box = this.contentEl.createDiv({ cls: "supermemo-plan-suspended" });
    box.createDiv({ text: reason === "taken-over" ? "SuperMemo Plan 当前在九宫格中编辑。" : "SuperMemo Plan 当前由另一个界面编辑。" });
    const resume = box.createEl("button", { text: "在这里继续编辑" });
    resume.onclick = async () => this.render();
  }

  async render() {
    const seq = ++this.renderSeq;
    this.cleanupEngine();
    this.contentEl.empty();
    const root = this.contentEl.createDiv({ cls: "supermemo-plan-root" });
    root.dataset.supermemoPlanPluginHost = "1";
    try {
      const session = await this.plugin.startEditorSession({
        hostId: this.hostId,
        hostType: "standalone",
        container: root,
        runtimeState: this.runtimeState,
        takeover: true,
        onRequestRender: async () => this.render(),
        onSuspended: (reason) => this.showSuspended(reason),
      });
      if (seq !== this.renderSeq) {
        if (session && typeof session.cleanup === "function") session.cleanup();
        return;
      }
      if (session?.ok === false) {
        root.empty();
        root.createDiv({ cls: "supermemo-plan-error", text: session.reasonCode === "editor-busy" ? "SuperMemo Plan 正在另一个界面编辑。" : `SuperMemo Plan 无法启动：${session.reasonCode || "unknown"}` });
        return;
      }
      this.engineSession = session || null;
    } catch (error) {
      console.error("[SuperMemo Plan][render-fail]", error);
      root.empty();
      root.createDiv({ cls: "supermemo-plan-error", text: String(error?.stack || error?.message || error) });
    }
  }
}

module.exports = class SuperMemoPlanPlugin extends Plugin {
  async onload() {
    this.activeEditorSession = null;
    this.embeddedSessions = new Map();
    this.isUnloading = false;
    await this.loadSettings();
    this.registerView(VIEW_TYPE_SUPERMEMO_PLAN, (leaf) => new SuperMemoPlanView(leaf, this));
    this.addRibbonIcon("calendar-clock", "Open SuperMemo Plan", async () => this.activateView());
    this.addCommand({ id: "open-supermemo-plan", name: "Open SuperMemo Plan", callback: async () => this.activateView() });
    this.addCommand({ id: "reload-supermemo-plan", name: "Reload SuperMemo Plan", callback: async () => this.reloadOpenViews() });
    this.addCommand({ id: "refresh-supermemo-plan-eva-index", name: "Refresh SuperMemo Plan EVA index", callback: async () => this.registerEvaAdapter() });
    this.addSettingTab(new SuperMemoPlanSettingTab(this.app, this));
    this.setupPluginApi();
    this.app.workspace.onLayoutReady(() => {
      void this.registerEvaAdapter();
      window.setTimeout(() => void this.registerEvaAdapter(), 1500);
      window.setTimeout(() => void this.registerEvaAdapter(), 5000);
    });
    if (this.settings.autoOpenOnLoad) {
      this.app.workspace.onLayoutReady(() => { void this.activateView(); });
    }
    console.info("[SuperMemo Plan][load]", { status: "OK", version: this.manifest.version });
  }

  onunload() {
    this.isUnloading = true;
    for (const session of Array.from(this.embeddedSessions?.values?.() || [])) {
      try { session.cleanup({ resumeStandalone: false }); } catch (error) { console.warn("[SuperMemo Plan][embedded-cleanup-fail]", error); }
    }
    this.embeddedSessions?.clear?.();
    this.cleanupActiveEditorSession("plugin-unload");
    this.unregisterEvaAdapter();
    if (window.__superMemoPlanPluginApi?.pluginId === this.manifest.id) delete window.__superMemoPlanPluginApi;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SUPERMEMO_PLAN);
  }

  async loadSettings() {
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
    await this.registerEvaAdapter();
  }

  getPluginDataDir() {
    return this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
  }

  getPlanDataPath() {
    const folder = normalizePath(this.settings.dataFolder) || dirname(this.settings.sourceNotePath);
    return folder ? `${folder}/${SUPERMEMO_PLAN_DATA_FILE}` : SUPERMEMO_PLAN_DATA_FILE;
  }

  isDisconnectedContainer(container) {
    return !!container && typeof container.isConnected === "boolean" && !container.isConnected;
  }

  cleanupActiveEditorSession(reason = "cleanup") {
    const record = this.activeEditorSession;
    if (!record) return false;
    record.dispose(reason);
    return true;
  }

  async startEditorSession(options = {}) {
    const hostId = text(options.hostId, createEditorSessionId("host"));
    const hostType = text(options.hostType, "unknown");
    const container = options.container;
    if (!container || typeof container.createEl !== "function") {
      return { ok: false, hostId, reasonCode: "missing-container" };
    }
    const previous = this.activeEditorSession;
    if (previous && previous.hostId !== hostId) {
      if (options.takeover !== true) {
        return { ok: false, hostId, reasonCode: "editor-busy", activeHostId: previous.hostId, activeHostType: previous.hostType };
      }
      previous.dispose("taken-over");
    } else if (previous) {
      previous.dispose("host-rerender");
    }

    const sessionId = createEditorSessionId("editor");
    const record = {
      sessionId,
      hostId,
      hostType,
      container,
      engineSession: null,
      disposed: false,
      dispose: (reason = "cleanup") => {
        if (record.disposed) return false;
        record.disposed = true;
        if (record.engineSession && typeof record.engineSession.cleanup === "function") {
          try { record.engineSession.cleanup(); } catch (error) { console.warn("[SuperMemo Plan][engine-cleanup-fail]", { sessionId, hostId, reason, error }); }
        }
        record.engineSession = null;
        if (this.activeEditorSession === record) this.activeEditorSession = null;
        if (reason === "taken-over" && typeof options.onSuspended === "function") {
          try { options.onSuspended(reason); } catch (error) { console.warn("[SuperMemo Plan][host-suspend-fail]", { sessionId, hostId, error }); }
        }
        console.info("[SuperMemo Plan][editor-session.cleanup]", { status: "OK", sessionId, hostId, hostType, reason });
        return true;
      },
    };
    this.activeEditorSession = record;

    try {
      const runEngine = await this.loadEngineRunner();
      if (record.disposed || this.activeEditorSession !== record || this.isDisconnectedContainer(container)) {
        record.dispose("stale-before-engine-start");
        return { ok: false, sessionId, hostId, reasonCode: "stale-or-disconnected" };
      }
      const engineSession = await runEngine({
        app: this.app,
        container,
        settings: this.settings,
        runtimeState: options.runtimeState && typeof options.runtimeState === "object" ? options.runtimeState : {},
        isSessionActive: () => !record.disposed && this.activeEditorSession === record && !this.isDisconnectedContainer(container),
        onRequestRender: async () => {
          if (record.disposed || this.activeEditorSession !== record) return false;
          if (typeof options.onRequestRender === "function") return await options.onRequestRender();
          return false;
        },
      });
      if (record.disposed || this.activeEditorSession !== record || this.isDisconnectedContainer(container)) {
        if (engineSession && typeof engineSession.cleanup === "function") engineSession.cleanup();
        record.dispose("stale-after-engine-start");
        return { ok: false, sessionId, hostId, reasonCode: "stale-or-disconnected" };
      }
      record.engineSession = engineSession || null;
      console.info("[SuperMemo Plan][editor-session.start]", { status: "OK", sessionId, hostId, hostType, dataPath: this.getPlanDataPath() });
      return {
        ok: true,
        sessionId,
        hostId,
        hostType,
        cleanup: () => record.dispose("consumer-cleanup"),
      };
    } catch (error) {
      record.dispose("start-failed");
      console.error("[SuperMemo Plan][editor-session.start-fail]", { sessionId, hostId, hostType, message: error?.message || String(error) });
      return { ok: false, sessionId, hostId, reasonCode: "engine-start-failed", message: error?.message || String(error) };
    }
  }

  async renderEmbeddedPlan(container, options = {}) {
    if (!container || typeof container.createDiv !== "function") {
      return { ok: false, reasonCode: "missing-container" };
    }
    const hostId = text(options.hostId, `${text(options.hostPlugin, "embedded")}:supermemo-plan`);
    const previous = this.embeddedSessions.get(hostId);
    if (previous) previous.cleanup({ resumeStandalone: false });

    const state = { disposed: false, renderSeq: 0, active: null, runtimeState: {} };
    const publicSession = {
      ok: true,
      sessionId: createEditorSessionId("embedded"),
      hostId,
      cleanup: ({ resumeStandalone = false } = {}) => {
        if (state.disposed) return false;
        state.disposed = true;
        state.renderSeq += 1;
        if (state.active && typeof state.active.cleanup === "function") state.active.cleanup();
        state.active = null;
        if (this.embeddedSessions.get(hostId) === publicSession) this.embeddedSessions.delete(hostId);
        try { container.empty(); } catch (_) {}
        if (resumeStandalone && !this.isUnloading) void this.reloadOpenViews();
        console.info("[SuperMemo Plan][embedded-session.cleanup]", { status: "OK", sessionId: publicSession.sessionId, hostId, resumeStandalone });
        return true;
      },
    };
    this.embeddedSessions.set(hostId, publicSession);

    const render = async () => {
      const seq = ++state.renderSeq;
      if (state.active && typeof state.active.cleanup === "function") state.active.cleanup();
      state.active = null;
      if (state.disposed) return { ok: false, reasonCode: "disposed" };
      container.empty();
      const root = container.createDiv({ cls: "supermemo-plan-root supermemo-plan-embedded-root" });
      root.dataset.supermemoPlanPluginHost = "1";
      root.dataset.supermemoPlanEmbeddedHost = hostId;
      const result = await this.startEditorSession({
        hostId,
        hostType: "embedded",
        container: root,
        runtimeState: state.runtimeState,
        takeover: options.takeover !== false,
        onRequestRender: render,
        onSuspended: () => {
          if (state.disposed) return;
          state.active = null;
          container.empty();
          const busy = container.createDiv({ cls: "supermemo-plan-suspended" });
          busy.createDiv({ text: "SuperMemo Plan 已切换到另一个编辑界面。" });
          const resume = busy.createEl("button", { text: "回到这里编辑" });
          resume.onclick = async () => render();
        },
      });
      if (state.disposed || seq !== state.renderSeq || this.isDisconnectedContainer(container)) {
        if (result && typeof result.cleanup === "function") result.cleanup();
        return { ok: false, reasonCode: "stale-or-disconnected" };
      }
      if (result?.ok === false) {
        root.empty();
        root.createDiv({ cls: "supermemo-plan-error", text: result.reasonCode === "editor-busy" ? "SuperMemo Plan 正在另一个界面编辑。" : `SuperMemo Plan 嵌入失败：${result.reasonCode || "unknown"}` });
        return result;
      }
      state.active = result;
      return result;
    };

    const result = await render();
    if (result?.ok === false) {
      publicSession.ok = false;
      publicSession.reasonCode = result.reasonCode;
    }
    return publicSession;
  }

  buildActivityNodeKey(activityId, phaseId = "") {
    return [
      `jump:v1:${encodeNodePart(SUPERMEMO_PLAN_RELATION_VIEW_TYPE)}`,
      encodeNodePart(this.settings.sourceNotePath),
      encodeNodePart("activity"),
      encodeNodePart(phaseId || SUPERMEMO_PLAN_DATA_FILE),
      encodeNodePart(activityId),
    ].join("|");
  }

  parseActivityNodeKey(nodeKey) {
    const parsed = parseJumpNodeKey(nodeKey);
    if (!parsed || parsed.viewType !== SUPERMEMO_PLAN_RELATION_VIEW_TYPE || parsed.scopeType !== "activity") return null;
    return parsed;
  }

  getEvaApi() {
    return this.app?.plugins?.plugins?.["eva-cross-view-relations"]?.api || window.evaCrossViewRelations || null;
  }

  async readPlanDataForRelations() {
    const path = this.getPlanDataPath();
    try {
      if (!(await this.app.vault.adapter.exists(path))) return null;
      const raw = await this.app.vault.adapter.read(path);
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.activities)) return null;
      return data;
    } catch (error) {
      console.warn("[SuperMemo Plan][relations][index.read-fail]", { path, message: error?.message || String(error) });
      return null;
    }
  }

  async listRelationItems() {
    const data = await this.readPlanDataForRelations();
    if (!data) return [];
    const phaseId = text(data.id, SUPERMEMO_PLAN_DATA_FILE);
    return data.activities
      .filter((activity) => text(activity?.id) && text(activity?.project))
      .map((activity, index) => ({
        nodeKey: this.buildActivityNodeKey(activity.id, phaseId),
        label: text(activity.project, `SuperMemo 活动 ${index + 1}`),
        status: text(activity.status, "pending"),
        superMemoPlanStatus: text(activity.status, "pending"),
        superMemoPlanOrder: index,
        pathLabel: `${this.getPlanDataPath()}#${index + 1}`,
        searchText: [
          activity.project,
          activity.status,
          activity.experience,
          activity.expectedStart,
          activity.expectedEnd,
          "supermemo plan activity",
        ].filter(Boolean).join(" "),
        metaFields: [
          { label: "状态", value: text(activity.status, "pending") },
          { label: "心理预期", value: `${Number(activity.expectedDuration || 0)}m` },
          { label: "分配时长", value: `${Number(activity.allocatedDuration || activity.expectedDuration || 0)}m` },
        ],
      }));
  }

  setupPluginApi() {
    window.__superMemoPlanPluginApi = {
      pluginId: this.manifest.id,
      viewType: SUPERMEMO_PLAN_RELATION_VIEW_TYPE,
      dataPath: () => this.getPlanDataPath(),
      buildActivityNodeKey: ({ activityId, phaseId } = {}) => this.buildActivityNodeKey(activityId, phaseId),
      renderEmbeddedPlan: async (container, options = {}) => await this.renderEmbeddedPlan(container, options),
      refreshRelations: async () => {
        const eva = this.getEvaApi();
        if (eva?.refreshAdapter) await eva.refreshAdapter(SUPERMEMO_PLAN_ADAPTER_ID);
      },
      openRelationEditorForActivity: async ({ activityId, phaseId } = {}) => {
        const nodeKey = this.buildActivityNodeKey(activityId, phaseId);
        await this.registerEvaAdapter();
        const eva = this.getEvaApi();
        if (eva?.markLastFocusedNode) eva.markLastFocusedNode(nodeKey);
        if (eva?.openRelationEditor) {
          await eva.openRelationEditor(nodeKey);
          console.info("[SuperMemo Plan][relations][open-editor]", { status: "OK", nodeKey, activityId });
          return true;
        }
        console.warn("[SuperMemo Plan][relations][open-editor]", { status: "FAIL_NO_EVA_EDITOR", nodeKey, activityId });
        return false;
      },
      openView: async (options = {}) => {
        if (options?.nodeKey) window.superMemoPlanPendingRelationFocusNodeKey = text(options.nodeKey);
        await this.activateView();
        return true;
      },
      openNode: async (nodeKey, context = {}) => this.openNode(nodeKey, context),
    };
  }

  async registerEvaAdapter() {
    const eva = this.getEvaApi();
    if (!eva?.registerAdapter) {
      console.info("[SuperMemo Plan][relations][adapter.defer]", { status: "WAIT_EVA" });
      return false;
    }
    await eva.registerAdapter({
      adapterId: SUPERMEMO_PLAN_ADAPTER_ID,
      viewType: SUPERMEMO_PLAN_RELATION_VIEW_TYPE,
      notePath: this.settings.sourceNotePath,
      viewLabel: "SuperMemo Plan",
      listItems: async () => this.listRelationItems(),
      openNode: async (nodeKey) => this.openNode(nodeKey),
    });
    console.info("[SuperMemo Plan][relations][adapter.register]", {
      status: "OK",
      adapterId: SUPERMEMO_PLAN_ADAPTER_ID,
      viewType: SUPERMEMO_PLAN_RELATION_VIEW_TYPE,
      notePath: this.settings.sourceNotePath,
      dataPath: this.getPlanDataPath(),
    });
    return true;
  }

  unregisterEvaAdapter() {
    const eva = this.getEvaApi();
    if (eva?.unregisterAdapter) eva.unregisterAdapter(SUPERMEMO_PLAN_ADAPTER_ID);
  }

  async loadEngineRunner() {
    const candidatePaths = [
      `${this.getPluginDataDir()}/supermemo-plan-engine.js`,
      `.obsidian/plugins/${this.manifest.id}/supermemo-plan-engine.js`,
    ];
    let code = "";
    let loadedPath = "";
    for (const candidatePath of candidatePaths) {
      try {
        if (!(await this.app.vault.adapter.exists(candidatePath))) continue;
        code = await this.app.vault.adapter.read(candidatePath);
        loadedPath = candidatePath;
        break;
      } catch (error) {
        console.warn("[SuperMemo Plan][engine-load-candidate-fail]", { path: candidatePath, message: error?.message || String(error) });
      }
    }
    if (!code) throw new Error(`Cannot load supermemo-plan-engine.js from: ${candidatePaths.join(", ")}`);
    const module = { exports: {} };
    const factory = new Function("module", "exports", "require", `${code}\n;return module.exports;`);
    const runner = factory(module, module.exports, require);
    if (typeof runner !== "function") throw new Error(`supermemo-plan-engine.js did not export a runner: ${loadedPath}`);
    console.info("[SuperMemo Plan][engine-load]", { status: "OK", path: loadedPath, chars: code.length });
    return runner;
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_SUPERMEMO_PLAN)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_SUPERMEMO_PLAN, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof SuperMemoPlanView) await leaf.view.render();
    return leaf;
  }

  async reloadOpenViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_SUPERMEMO_PLAN);
    await Promise.all(leaves.map(async (leaf) => {
      if (leaf.view instanceof SuperMemoPlanView) await leaf.view.render();
    }));
  }

  async openNode(nodeKey, context = {}) {
    const parsed = this.parseActivityNodeKey(nodeKey);
    if (!parsed) return false;
    window.superMemoPlanPendingRelationFocusNodeKey = text(nodeKey);
    console.info("[SuperMemo Plan][relations][open-node]", {
      status: "PENDING_FOCUS",
      nodeKey,
      itemId: parsed.itemId,
      via: context?.traceId ? "eva-trace" : "eva",
    });
    await this.activateView();
    return true;
  }
};
