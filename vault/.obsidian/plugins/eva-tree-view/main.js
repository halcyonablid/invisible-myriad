const obsidian = require("obsidian");
const { ItemView, Plugin, PluginSettingTab, Setting, TFile } = obsidian;

const VIEW_TYPE_EVA_TREE_VIEW = "eva-tree-view";

const DEFAULT_SETTINGS = {
  indexesFileName: "EVA_Indexes.json",
  filePrefixFilter: "ATOM@",
  startLevel: 5,
  frameSize: 2000,
  autoOpenOnLoad: false,
  foldedHierarchyCodes: [],
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSettings(raw = {}) {
  return {
    indexesFileName: text(raw.indexesFileName, DEFAULT_SETTINGS.indexesFileName),
    filePrefixFilter: text(raw.filePrefixFilter, DEFAULT_SETTINGS.filePrefixFilter),
    startLevel: positiveInteger(raw.startLevel, DEFAULT_SETTINGS.startLevel),
    frameSize: positiveInteger(raw.frameSize, DEFAULT_SETTINGS.frameSize),
    autoOpenOnLoad: raw.autoOpenOnLoad === true,
    foldedHierarchyCodes: Array.isArray(raw.foldedHierarchyCodes)
      ? raw.foldedHierarchyCodes.map((item) => text(item)).filter(Boolean)
      : [],
  };
}

class EvaTreeViewSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "EVA Tree View" });
    containerEl.createEl("p", {
      text: "树状图从 Obsidian 元数据缓存读取 ATOM Markdown，按编号层级轻量渲染；EVA_Indexes.json 仅用于关键词视觉提示。",
    });

    new Setting(containerEl)
      .setName("索引文件名")
      .setDesc("默认读取 EVA_Indexes.json，仅用于关键词视觉提示。")
      .addText((textInput) => textInput
        .setPlaceholder("EVA_Indexes.json")
        .setValue(this.plugin.settings.indexesFileName)
        .onChange(async (value) => {
          this.plugin.settings.indexesFileName = text(value, DEFAULT_SETTINGS.indexesFileName);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("文件名前缀筛选")
      .setDesc("默认 ATOM@；不再要求 frontmatter 中“树的结构”为 true。")
      .addText((textInput) => textInput
        .setPlaceholder("ATOM@")
        .setValue(this.plugin.settings.filePrefixFilter)
        .onChange(async (value) => {
          this.plugin.settings.filePrefixFilter = text(value, DEFAULT_SETTINGS.filePrefixFilter);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("起始层级")
      .setDesc("默认 5，与旧“哇咔咔”树状图脚本一致。")
      .addText((textInput) => textInput
        .setPlaceholder("5")
        .setValue(String(this.plugin.settings.startLevel))
        .onChange(async (value) => {
          this.plugin.settings.startLevel = positiveInteger(value, DEFAULT_SETTINGS.startLevel);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("单帧总条数")
      .setDesc("默认 2000；围绕当前定位条目渲染约 N 条，避免一次性绘制全库。")
      .addText((textInput) => textInput
        .setPlaceholder("2000")
        .setValue(String(this.plugin.settings.frameSize))
        .onChange(async (value) => {
          this.plugin.settings.frameSize = positiveInteger(value, DEFAULT_SETTINGS.frameSize);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("启动时自动打开")
      .setDesc("默认关闭，避免启动时抢焦点。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoOpenOnLoad)
        .onChange(async (value) => {
          this.plugin.settings.autoOpenOnLoad = value === true;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("打开 EVA 树状图")
      .addButton((button) => button
        .setButtonText("打开")
        .setCta()
        .onClick(async () => {
          await this.plugin.activateView();
        }));
  }
}

class EvaTreeView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderSeq = 0;
    this.engineSession = null;
  }

  getViewType() {
    return VIEW_TYPE_EVA_TREE_VIEW;
  }

  getDisplayText() {
    return "EVA Tree View";
  }

  getIcon() {
    return "git-branch";
  }

  async onOpen() {
    this.contentEl.addClass("eva-tree-view-host");
    await this.render();
  }

  async onClose() {
    this.cleanupEngine();
    this.contentEl.empty();
  }

  cleanupEngine() {
    if (this.engineSession && typeof this.engineSession.cleanup === "function") {
      try {
        this.engineSession.cleanup();
      } catch (error) {
        console.warn("[EVA Tree View][cleanup-fail]", error);
      }
    }
    this.engineSession = null;
  }

  async render() {
    const seq = ++this.renderSeq;
    this.cleanupEngine();
    this.contentEl.empty();
    const root = this.contentEl.createDiv({ cls: "eva-tree-view-root" });
    root.dataset.evaTreePluginHost = "1";
    try {
      const runEvaTreeEngine = await this.plugin.loadEngineRunner();
      const session = await runEvaTreeEngine({
        app: this.app,
        container: root,
        settings: this.plugin.settings,
        TFile,
        onFoldStateChange: async (foldedHierarchyCodes) => {
          await this.plugin.updateFoldedHierarchyCodes(foldedHierarchyCodes);
        },
        onStatus: (eventName, payload = {}) => {
          console.info(`[EVA Tree View][${eventName}]`, payload);
        },
      });
      if (seq !== this.renderSeq) {
        if (session && typeof session.cleanup === "function") session.cleanup();
        return;
      }
      this.engineSession = session || null;
    } catch (error) {
      console.error("[EVA Tree View][render-fail]", error);
      root.empty();
      root.createDiv({
        cls: "eva-tree-view-error",
        text: `EVA Tree View 渲染失败：\n${error?.stack || error?.message || String(error)}`,
      });
    }
  }

  async scrollToFile(fileName) {
    if (this.engineSession && typeof this.engineSession.scrollToFile === "function") {
      return this.engineSession.scrollToFile(fileName);
    }
    return false;
  }

  async revealNotePath(notePath) {
    if (this.engineSession && typeof this.engineSession.revealNotePath === "function") {
      return this.engineSession.revealNotePath(notePath);
    }
    return { ok: false, reason: "engine-not-ready", notePath: text(notePath) };
  }

  async rebuildTree(reason = "manual-command") {
    if (this.engineSession && typeof this.engineSession.rebuildTree === "function") {
      return this.engineSession.rebuildTree(reason);
    }
    await this.render();
    if (this.engineSession && typeof this.engineSession.rebuildTree === "function") {
      return this.engineSession.rebuildTree(reason);
    }
    return false;
  }
}

module.exports = class EvaTreeViewPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_EVA_TREE_VIEW, (leaf) => new EvaTreeView(leaf, this));
    this.addRibbonIcon("git-branch", "打开 EVA 树状图", async () => this.activateView());
    this.addCommand({
      id: "open-eva-tree-view",
      name: "打开 EVA 树状图",
      callback: async () => this.activateView(),
    });
    this.addCommand({
      id: "reload-eva-tree-view",
      name: "重载 EVA 树状图",
      callback: async () => this.reloadOpenViews(),
    });
    this.addCommand({
      id: "rebuild-eva-tree",
      name: "重建 EVA 树状图",
      callback: async () => this.rebuildTree(),
    });
    this.addCommand({
      id: "reveal-current-note-in-eva-tree-view",
      name: "在 EVA 树状图中定位当前笔记",
      callback: async () => this.revealActiveFile(),
    });
    this.addSettingTab(new EvaTreeViewSettingTab(this.app, this));
    this.registerGlobalApi();
    if (this.settings.autoOpenOnLoad) {
      this.app.workspace.onLayoutReady(() => {
        void this.activateView();
      });
    }
    console.info("[EVA Tree View][load]", { status: "OK", version: this.manifest.version });
  }

  onunload() {
    if (window.__evaTreeViewPluginApi?.pluginId === this.manifest.id) {
      delete window.__evaTreeViewPluginApi;
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_EVA_TREE_VIEW);
  }

  async loadSettings() {
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }

  async updateFoldedHierarchyCodes(foldedHierarchyCodes) {
    const next = Array.isArray(foldedHierarchyCodes)
      ? foldedHierarchyCodes.map((item) => text(item)).filter(Boolean)
      : [];
    this.settings.foldedHierarchyCodes = next;
    await this.saveSettings();
  }

  getPluginDataDir() {
    return this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
  }

  async loadEngineRunner() {
    const candidatePaths = [
      `${this.getPluginDataDir()}/eva-tree-engine.js`,
      `.obsidian/plugins/${this.manifest.id}/eva-tree-engine.js`,
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
        console.warn("[EVA Tree View][engine-load-candidate-fail]", {
          path: candidatePath,
          message: error?.message || String(error),
        });
      }
    }
    if (!code) {
      throw new Error(`Cannot load eva-tree-engine.js from plugin directory: ${candidatePaths.join(", ")}`);
    }
    const module = { exports: {} };
    const factory = new Function("module", "exports", "require", `${code}\n;return module.exports;`);
    const runner = factory(module, module.exports, require);
    if (typeof runner !== "function") {
      throw new Error(`eva-tree-engine.js did not export a runner function: ${loadedPath}`);
    }
    console.info("[EVA Tree View][engine-load]", { status: "OK", path: loadedPath, chars: code.length });
    return runner;
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_EVA_TREE_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_EVA_TREE_VIEW, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof EvaTreeView) await leaf.view.render();
    return leaf;
  }

  async reloadOpenViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_EVA_TREE_VIEW);
    await Promise.all(leaves.map(async (leaf) => {
      if (leaf.view instanceof EvaTreeView) await leaf.view.render();
    }));
  }

  async scrollToFile(fileName) {
    const leaf = await this.activateView();
    if (leaf.view instanceof EvaTreeView) {
      return leaf.view.scrollToFile(fileName);
    }
    return false;
  }

  async revealNotePath(notePath) {
    const leaf = await this.activateView();
    if (leaf.view instanceof EvaTreeView) {
      return leaf.view.revealNotePath(notePath);
    }
    return { ok: false, reason: "view-not-ready", notePath: text(notePath) };
  }

  async revealActiveFile() {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) {
      return { ok: false, reason: "no-active-markdown-file" };
    }
    return this.revealNotePath(file.path);
  }

  async rebuildTree() {
    const leaf = await this.activateView();
    if (leaf.view instanceof EvaTreeView) {
      return leaf.view.rebuildTree();
    }
    return false;
  }

  registerGlobalApi() {
    window.__evaTreeViewPluginApi = {
      pluginId: this.manifest.id,
      pluginVersion: this.manifest.version,
      viewType: VIEW_TYPE_EVA_TREE_VIEW,
      openView: async () => {
        await this.activateView();
        return true;
      },
      reload: async () => this.reloadOpenViews(),
      rebuildTree: async () => this.rebuildTree(),
      revealNotePath: async (notePath) => this.revealNotePath(notePath),
      revealActiveFile: async () => this.revealActiveFile(),
      scrollToFile: async (fileName) => this.scrollToFile(fileName),
      getSettings: () => Object.assign({}, this.settings),
    };
  }
};
