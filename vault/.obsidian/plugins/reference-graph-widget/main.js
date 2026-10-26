const obsidian = require("obsidian");
const { Notice, Plugin, PluginSettingTab, Setting, TFile } = obsidian;

const DEFAULT_SETTINGS = {
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
      text: "原“关系图谱绘制.md”的插件化版本。只读 EVA_Notes.json / EVA_Links.json，不写业务 JSON。",
    });

    new Setting(containerEl)
      .setName("最大展开深度")
      .addText((input) => input
        .setValue(String(this.plugin.settings.maxDepth))
        .onChange(async (value) => {
          this.plugin.settings.maxDepth = toPositiveInt(value, DEFAULT_SETTINGS.maxDepth);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Mermaid 布局方向")
      .setDesc("可选：LR / TB / RL / BT")
      .addText((input) => input
        .setValue(this.plugin.settings.layout)
        .onChange(async (value) => {
          this.plugin.settings.layout = normalizeSettings({ layout: value }).layout;
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

    new Setting(containerEl)
      .setName("节点文字最大长度")
      .addText((input) => input
        .setValue(String(this.plugin.settings.nodeMaxLength))
        .onChange(async (value) => {
          this.plugin.settings.nodeMaxLength = toPositiveInt(value, DEFAULT_SETTINGS.nodeMaxLength);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("EVA Notes JSON 文件名")
      .addText((input) => input
        .setValue(this.plugin.settings.notesJsonName)
        .onChange(async (value) => {
          this.plugin.settings.notesJsonName = text(value, DEFAULT_SETTINGS.notesJsonName);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("EVA Links JSON 文件名")
      .addText((input) => input
        .setValue(this.plugin.settings.linksJsonName)
        .onChange(async (value) => {
          this.plugin.settings.linksJsonName = text(value, DEFAULT_SETTINGS.linksJsonName);
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
  }

  async loadEngineRunner() {
    const candidatePaths = [
      `${this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`}/core-script.js`,
      `.obsidian/plugins/${this.manifest.id}/core-script.js`,
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
        console.warn("[ReferenceGraphWidget][engine-load-candidate-fail]", {
          path: candidatePath,
          message: error?.message || String(error),
        });
      }
    }
    if (!code) {
      throw new Error(`Cannot load core-script.js from plugin directory: ${candidatePaths.join(", ")}`);
    }
    const module = { exports: {} };
    const factory = new Function("module", "exports", "require", `${code}\n;return module.exports;`);
    const runner = factory(module, module.exports, require);
    if (typeof runner !== "function") {
      throw new Error(`core-script.js did not export a runner function: ${loadedPath}`);
    }
    console.info("[ReferenceGraphWidget][engine-load]", {
      status: "OK",
      path: loadedPath,
      mode: "fresh-read",
      engineChars: code.length,
    });
    const helperPath = loadedPath.replace(/core-script\.js$/, "collective-graph.cjs");
    const helperCode = await this.app.vault.adapter.read(helperPath);
    const helperModule = { exports: {} };
    new Function("module", "exports", "require", helperCode)(helperModule, helperModule.exports, require);
    this.session?.setEngine(code + "\n" + helperCode + "\n" + this.sessionSourceCode + "\n" + this.persistenceSourceCode);
    await this.session?.restore();
    return context => runner({ ...context, collective: helperModule.exports, session: this.session });
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
    const activeFile = this.getActiveTargetFile();
    if (!activeFile) {
      new Notice("请先打开一个 Markdown 或 Excalidraw 笔记。", 3000);
      return false;
    }
    try {
      const runner = await this.loadEngineRunner();
      if (this.unloaded || generation !== this.openGeneration) return false;
      await runner({
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
