const obsidian = require("obsidian");
const { ItemView, Plugin, PluginSettingTab, Setting, setIcon } = obsidian;

const VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY = "supermemo-concept-display-view";
const CONCEPT_TREE_MODEL_FILE = "supermemo-concept-tree-model.js";
const ANTINET_TREE_MODEL_FILE = "supermemo-antinet-tree-model.js";
const REQUIRED_CONCEPT_TREE_MODEL_METHODS = [
  "addStableIdToRawConceptRoot",
  "advanceDeleteTransaction",
  "archiveTreeSubtree",
  "assignConcept",
  "collectDescendantIds",
  "createDeleteTransaction",
  "createEmptyTreeStore",
  "createId",
  "createTreeNode",
  "deepClone",
  "getChildren",
  "mergeReservationAuthority",
  "moveTreeNode",
  "normalizeTreeStore",
  "normalizeTreeTransaction",
  "renameTreeNode",
  "reserveConceptStableId",
  "restoreTreeArchiveBatch",
  "unassignConcept",
  "validateTreeStore",
];
const REQUIRED_ANTINET_TREE_MODEL_METHODS = [
  "composeDrawerTree",
  "attachNodeToDrawer",
  "archiveSubtree",
  "collectDescendantIds",
  "createEmptyAntinetStore",
  "createNode",
  "deepClone",
  "getChildren",
  "moveNode",
  "normalizeAntinetStore",
  "removeMountPresentation",
  "renameNode",
  "setMountPresentation",
  "setMountPresentations",
  "validateAntinetStore",
];

const DEFAULT_SETTINGS = {
  autoOpenOnLoad: false,
};

function normalizeSettings(raw = {}) {
  return { autoOpenOnLoad: raw.autoOpenOnLoad === true };
}

class SuperMemoConceptDisplaySettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "SuperMemo Concept Display" });
    containerEl.createEl("p", { text: "Whole-moved plugin version of the original DataviewJS concept display." });
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

class SuperMemoConceptDisplayView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderSeq = 0;
    this.engineSession = null;
  }

  getViewType() { return VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY; }
  getDisplayText() { return "SuperMemo Concept Display"; }
  getIcon() { return "network"; }

  async onOpen() {
    this.contentEl.addClass("supermemo-concept-display-host");
    await this.render();
  }

  async onClose() {
    this.cleanupEngine();
    this.contentEl.empty();
  }

  cleanupEngine() {
    if (this.engineSession && typeof this.engineSession.cleanup === "function") {
      try { this.engineSession.cleanup(); } catch (error) { console.warn("[SuperMemo Concept Display][cleanup-fail]", error); }
    }
    this.engineSession = null;
  }

  async render() {
    const seq = ++this.renderSeq;
    this.cleanupEngine();
    this.contentEl.empty();
    const root = this.contentEl.createDiv({ cls: "supermemo-concept-display-root" });
    root.dataset.supermemoConceptDisplayPluginHost = "1";
    try {
      const { conceptTreeModel, runEngine } = await this.plugin.loadRuntimeModules();
      const session = await runEngine({
        app: this.app,
        container: root,
        sourceLeaf: this.leaf,
        settings: this.plugin.settings,
        conceptTreeModel,
        antinetTreeModel: this.plugin.antinetTreeModel,
        setIcon,
      });
      if (seq !== this.renderSeq) {
        if (session && typeof session.cleanup === "function") session.cleanup();
        return;
      }
      this.engineSession = session || null;
    } catch (error) {
      console.error("[SuperMemo Concept Display][render-fail]", error);
      root.empty();
      root.createDiv({ cls: "supermemo-concept-display-error", text: String(error?.stack || error?.message || error) });
    }
  }
}

module.exports = class SuperMemoConceptDisplayPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY, (leaf) => new SuperMemoConceptDisplayView(leaf, this));
    this.addRibbonIcon("network", "Open SuperMemo Concept Display", async () => this.activateView());
    this.addCommand({ id: "open-supermemo-concept-display", name: "Open SuperMemo Concept Display", callback: async () => this.activateView() });
    this.addCommand({ id: "reload-supermemo-concept-display", name: "Reload SuperMemo Concept Display", callback: async () => this.reloadOpenViews() });
    this.addSettingTab(new SuperMemoConceptDisplaySettingTab(this.app, this));
    if (this.settings.autoOpenOnLoad) {
      this.app.workspace.onLayoutReady(() => { void this.activateView(); });
    }
    console.info("[SuperMemo Concept Display][load]", { status: "OK", version: this.manifest.version });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY);
  }

  async loadSettings() {
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }

  getPluginDataDir() {
    return this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
  }

  async loadConceptTreeModel() {
    const candidatePaths = Array.from(new Set([
      `${this.getPluginDataDir()}/${CONCEPT_TREE_MODEL_FILE}`,
      `.obsidian/plugins/${this.manifest.id}/${CONCEPT_TREE_MODEL_FILE}`,
    ]));
    const candidateErrors = [];
    for (const candidatePath of candidatePaths) {
      let exists = false;
      try {
        exists = await this.app.vault.adapter.exists(candidatePath);
      } catch (error) {
        const message = error?.message || String(error);
        candidateErrors.push({ path: candidatePath, stage: "exists", message });
        console.warn("[SuperMemo Concept Display][model-load-candidate-fail]", { path: candidatePath, stage: "exists", message });
        continue;
      }
      if (!exists) continue;

      let code = "";
      try {
        code = await this.app.vault.adapter.read(candidatePath);
      } catch (error) {
        const message = error?.message || String(error);
        candidateErrors.push({ path: candidatePath, stage: "read", message });
        console.warn("[SuperMemo Concept Display][model-load-candidate-fail]", { path: candidatePath, stage: "read", message });
        continue;
      }

      const module = { exports: {} };
      const blockedRequire = (request) => {
        throw Object.assign(new Error(`Model module require is blocked: ${String(request || "unknown")}`), {
          code: "MODEL_REQUIRE_BLOCKED",
        });
      };
      let model;
      try {
        const factory = new Function("module", "exports", "require", `"use strict";\n${code}\n;return module.exports;`);
        model = factory(module, module.exports, blockedRequire);
      } catch (error) {
        const wrapped = Object.assign(new Error(`Cannot evaluate ${CONCEPT_TREE_MODEL_FILE}: ${error?.message || String(error)}`), {
          code: error?.code || "MODEL_EVAL_FAILED",
          cause: error,
          path: candidatePath,
        });
        console.error("[SuperMemo Concept Display][model-eval-fail]", { path: candidatePath, code: wrapped.code, message: wrapped.message });
        throw wrapped;
      }

      const missingMethods = REQUIRED_CONCEPT_TREE_MODEL_METHODS.filter((method) => typeof model?.[method] !== "function");
      if (missingMethods.length) {
        const error = Object.assign(new Error(`Concept tree model export is invalid; missing methods: ${missingMethods.join(", ")}`), {
          code: "MODEL_EXPORT_INVALID",
          path: candidatePath,
          missingMethods,
        });
        console.error("[SuperMemo Concept Display][model-export-invalid]", { path: candidatePath, missingMethods });
        throw error;
      }
      console.info("[SuperMemo Concept Display][model-load]", { status: "OK", path: candidatePath, chars: code.length });
      return model;
    }

    const error = Object.assign(new Error(`Cannot load ${CONCEPT_TREE_MODEL_FILE} from: ${candidatePaths.join(", ")}`), {
      code: candidateErrors.length ? "MODEL_FILE_UNREADABLE" : "MODEL_FILE_NOT_FOUND",
      candidatePaths,
      candidateErrors,
    });
    console.error("[SuperMemo Concept Display][model-load-fail]", {
      code: error.code,
      candidatePaths,
      candidateErrors,
    });
    throw error;
  }

  async loadRuntimeModules() {
    const conceptTreeModel = await this.loadConceptTreeModel();
    this.antinetTreeModel = await this.loadAntinetTreeModel();
    const runEngine = await this.loadEngineRunner();
    return { conceptTreeModel, antinetTreeModel: this.antinetTreeModel, runEngine };
  }

  async loadAntinetTreeModel() {
    const candidatePaths = Array.from(new Set([
      `${this.getPluginDataDir()}/${ANTINET_TREE_MODEL_FILE}`,
      `.obsidian/plugins/${this.manifest.id}/${ANTINET_TREE_MODEL_FILE}`,
    ]));
    for (const candidatePath of candidatePaths) {
      try {
        if (!(await this.app.vault.adapter.exists(candidatePath))) continue;
        const code = await this.app.vault.adapter.read(candidatePath);
        const module = { exports: {} };
        const blockedRequire = (request) => {
          throw Object.assign(new Error(`Antinet model module require is blocked: ${String(request || "unknown")}`), {
            code: "ANTINET_MODEL_REQUIRE_BLOCKED",
          });
        };
        const factory = new Function("module", "exports", "require", `"use strict";\n${code}\n;return module.exports;`);
        const model = factory(module, module.exports, blockedRequire);
        const missingMethods = REQUIRED_ANTINET_TREE_MODEL_METHODS.filter((method) => typeof model?.[method] !== "function");
        if (missingMethods.length) {
          throw Object.assign(new Error(`Antinet tree model export is invalid; missing methods: ${missingMethods.join(", ")}`), {
            code: "ANTINET_MODEL_EXPORT_INVALID",
            missingMethods,
          });
        }
        console.info("[SuperMemo Concept Display][antinet-model-load]", { status: "OK", path: candidatePath, chars: code.length });
        return model;
      } catch (error) {
        console.error("[SuperMemo Concept Display][antinet-model-load-fail]", {
          path: candidatePath,
          code: error?.code || "ANTINET_MODEL_LOAD_FAILED",
          message: error?.message || String(error),
        });
        throw error;
      }
    }
    throw Object.assign(new Error(`Cannot load ${ANTINET_TREE_MODEL_FILE} from: ${candidatePaths.join(", ")}`), {
      code: "ANTINET_MODEL_FILE_NOT_FOUND",
      candidatePaths,
    });
  }

  async loadEngineRunner() {
    const candidatePaths = [
      `${this.getPluginDataDir()}/supermemo-concept-display-engine.js`,
      `.obsidian/plugins/${this.manifest.id}/supermemo-concept-display-engine.js`,
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
        console.warn("[SuperMemo Concept Display][engine-load-candidate-fail]", { path: candidatePath, message: error?.message || String(error) });
      }
    }
    if (!code) throw new Error(`Cannot load supermemo-concept-display-engine.js from: ${candidatePaths.join(", ")}`);
    const module = { exports: {} };
    const factory = new Function("module", "exports", "require", `${code}\n;return module.exports;`);
    const runner = factory(module, module.exports, require);
    if (typeof runner !== "function") throw new Error(`supermemo-concept-display-engine.js did not export a runner: ${loadedPath}`);
    console.info("[SuperMemo Concept Display][engine-load]", { status: "OK", path: loadedPath, chars: code.length });
    return runner;
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof SuperMemoConceptDisplayView) await leaf.view.render();
    return leaf;
  }

  async reloadOpenViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_SUPERMEMO_CONCEPT_DISPLAY);
    await Promise.all(leaves.map(async (leaf) => {
      if (leaf.view instanceof SuperMemoConceptDisplayView) await leaf.view.render();
    }));
  }
};
