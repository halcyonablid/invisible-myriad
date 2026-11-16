const obsidian = require("obsidian");
const { Notice, Plugin, PluginSettingTab, Setting, TFile } = obsidian;

const DEFAULT_SETTINGS = {
  graphRenderer: "rules",
  maxDepth: 7,
  layout: "LR",
  groupByLevel: true,
  showStats: true,
  nodeMaxLength: 1000,
  notesJsonName: "EVA_Notes.json",
  linksJsonName: "EVA_Links.json",
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function toPositiveInt(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeSettings(raw = {}) {
  const layout = text(raw.layout, DEFAULT_SETTINGS.layout).toUpperCase();
  return {
    graphRenderer: raw.graphRenderer === "mermaid" ? "mermaid" : "rules",
    maxDepth: toPositiveInt(raw.maxDepth, DEFAULT_SETTINGS.maxDepth),
    layout: ["LR", "TB", "RL", "BT"].includes(layout) ? layout : DEFAULT_SETTINGS.layout,
    groupByLevel: raw.groupByLevel !== false,
    showStats: raw.showStats !== false,
    nodeMaxLength: toPositiveInt(raw.nodeMaxLength, DEFAULT_SETTINGS.nodeMaxLength),
    notesJsonName: text(raw.notesJsonName, DEFAULT_SETTINGS.notesJsonName),
    linksJsonName: text(raw.linksJsonName, DEFAULT_SETTINGS.linksJsonName),
  };
}

class ReferenceGraphWidgetSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Reference Graph Widget" });
    containerEl.createEl("p", {
      text: "两种关系图绘制方式共用笔记内容；集合卡独立显示。只读当前邻域，不触发全库 EVA 刷新。",
    });

    new Setting(containerEl)
      .setName("关系图绘制方式")
      .setDesc("规则布局按编号与引用安排位置；Mermaid 自动排版。切换立即应用于已打开的图，不重新读取笔记。")
      .addDropdown((dropdown) => dropdown
        .addOption("rules", "规则布局")
        .addOption("mermaid", "Mermaid 布局")
        .setValue(this.plugin.settings.graphRenderer)
        .onChange(async (value) => {
          this.plugin.settings.graphRenderer = value === "mermaid" ? "mermaid" : "rules";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("最大展开深度")
      .addText((input) => input
        .setValue(String(this.plugin.settings.maxDepth))
        .onChange(async (value) => {
          this.plugin.settings.maxDepth = toPositiveInt(value, DEFAULT_SETTINGS.maxDepth);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("按编号脉络子图分组")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.groupByLevel)
        .onChange(async (value) => {
          this.plugin.settings.groupByLevel = value === true;
          await this.plugin.saveSettings();
        }));


  }
}

module.exports = class ReferenceGraphWidgetPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.openGeneration = 0;
    this.unloaded = false;
    const cachePath = `${this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`}/session-cache.cjs`;
    const cacheModule = { exports: {} };
    const sessionSource = await this.app.vault.adapter.read(cachePath);
    new Function("module", "exports", sessionSource)(cacheModule, cacheModule.exports);
    this.sessionSourceCode = sessionSource;
    let persistence = null; this.persistenceSourceCode = '';
    try {
      const diskPath = cachePath.replace(/session-cache\.cjs$/, 'persistent-cache.cjs');
      this.persistenceSourceCode = await this.app.vault.adapter.read(diskPath);
      const diskModule = { exports: {} };
      new Function('module', 'exports', this.persistenceSourceCode)(diskModule, diskModule.exports);
      persistence = diskModule.exports.createStore(this.app, this.manifest, require);
    } catch (error) { console.warn('[ReferenceGraphWidget][persistent-cache.disabled]', { reason: error.code || 'unavailable' }); }
    this.session = cacheModule.exports.createSession(this.app, { persistence });
    for (const kind of ["create", "modify", "delete", "rename"]) {
      this.registerEvent(this.app.vault.on(kind, file => this.session.invalidate(kind, file?.path)));
    }
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.session.invalidate("metadata")));
    this.registerDomEvent(window, "eva-cross-view-relations:changed", () => this.session.invalidate("eva"));
    this.addRibbonIcon("git-fork", "打开关系图谱悬浮窗", async () => this.toggleWidget());
    this.addCommand({
      id: "toggle-reference-graph-widget",
      name: "Toggle Reference Graph Widget",
      callback: async () => this.toggleWidget(),
    });
    this.addCommand({
      id: "refresh-reference-graph-widget",
      name: "Refresh Reference Graph Widget",
      callback: async () => this.refreshWidget(),
    });
    this.addSettingTab(new ReferenceGraphWidgetSettingTab(this.app, this));
    window.__referenceGraphWidgetPluginApi = {
      pluginId: this.manifest.id,
      pluginVersion: this.manifest.version,
      toggle: async () => this.toggleWidget(),
      refresh: async () => this.refreshWidget(),
      close: () => this.closeWidget(),
    };
    console.info("[ReferenceGraphWidget][load]", { status: "OK", version: this.manifest.version });
  }

  onunload() {
    this.unloaded = true;
    this.closeWidget();
    this.mermaidService?.dispose();
    this.session?.dispose();
    if (window.__referenceGraphWidgetPluginApi?.pluginId === this.manifest.id) {
      delete window.__referenceGraphWidgetPluginApi;
    }
  }

  async loadSettings() {
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
    if (!this.unloaded) window.__referenceGraphWidgetRuntime?.applySettings?.({...this.settings});
  }

  async loadEngineRunner() {
    if (this.engineRunner) return this.engineRunner;
    if (this.engineLoading) return this.engineLoading;
    this.engineLoading = (async () => {
      const dir = this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
      const names = ['core-script.js','rule-model.cjs','rule-layout.cjs','rule-view.cjs','note-navigation.cjs','mermaid-renderer.cjs'];
      const sources = await Promise.all(names.map(name => this.app.vault.adapter.read(`${dir}/${name}`)));
      const modules = sources.map(source => {
        const m = {exports:{}}; new Function('module','exports','require',source)(m,m.exports,require); return m.exports;
      });
      if (this.unloaded) throw Error('plugin-unloaded');
      this.session.setEngine(sources.join('\n')+'\n'+this.sessionSourceCode+'\n'+this.persistenceSourceCode);
      await this.session.restore();
      if (this.unloaded) throw Error('plugin-unloaded');
      const [run,model,layout,view,navigation,mermaid] = modules;
      this.mermaidService = mermaid.createService({loadEngine: async () => {
        const source = await this.app.vault.adapter.read(`${dir}/mermaid-engine.cjs`);
        if (this.unloaded) throw Error('plugin-unloaded');
        const m = {exports:{}};
        new Function('module','exports',source)(m,m.exports);
        return m.exports();
      }});
      return this.engineRunner = context => run({...context,model,layout,view,navigation,mermaid,mermaidService:this.mermaidService,session:this.session});
    })();
    try { return await this.engineLoading; } finally { this.engineLoading = null; }
  }

  getActiveTargetFile() {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile instanceof TFile ? activeFile : null;
  }

  closeWidget() {
    this.openGeneration = (this.openGeneration || 0) + 1;
    const api = window.__referenceGraphWidgetRuntime;
    if (api && typeof api.close === "function") {
      api.close();
      return true;
    }
    const existing = document.getElementById("reference-graph-widget");
    if (existing) {
      existing.remove();
      return true;
    }
    return false;
  }

  async toggleWidget() {
    const api = window.__referenceGraphWidgetRuntime;
    if (api && typeof api.close === "function") {
      this.closeWidget();
      return true;
    }
    return this.openWidget();
  }

  async refreshWidget() {
    this.closeWidget();
    return this.openWidget(true);
  }

  async openWidget(forceRefresh = false) {
    const generation = ++this.openGeneration;
    if (forceRefresh) this.session?.invalidate("refresh");
    const originLeaf = this.app.workspace.activeLeaf;
    const originGroup = originLeaf?.parent;
    const activeFile = this.getActiveTargetFile();
    if (!activeFile) {
      new Notice("请先打开一个 Markdown 或 Excalidraw 笔记。", 3000);
      return false;
    }
    try {
      const runner = await this.loadEngineRunner();
      if (this.unloaded || generation !== this.openGeneration) return false;
      await runner({
        originLeaf,
        originGroup,
        forceRefresh,
        isCurrent: () => !this.unloaded && generation === this.openGeneration,
        app: this.app,
        obsidian,
        Notice,
        TFile,
        activeFile,
        settings: Object.assign({}, this.settings),
        plugin: this,
        pluginDiag: {
          pluginId: this.manifest.id,
          pluginVersion: this.manifest.version,
          pluginDir: this.manifest.dir || "",
        },
        document,
        window,
      });
      return true;
    } catch (error) {
      console.error("[ReferenceGraphWidget][open-fail]", error);
      new Notice(`关系图谱打开失败：${error?.message || String(error)}`, 5000);
      return false;
    }
  }
};
