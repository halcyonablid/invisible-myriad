const assert = require("assert");
const fs = require("fs");
const path = require("path");

const pluginDir = __dirname;
const mainSource = fs.readFileSync(path.join(pluginDir, "main.js"), "utf8");
const modelSource = fs.readFileSync(path.join(pluginDir, "supermemo-concept-tree-model.js"), "utf8");
const STORAGE_KEYS = [
  "supermemo_concepts_final_v3",
  "supermemo_concept_structure_tree_v1",
  "supermemo_concept_structure_tree_ui_v1",
  "supermemo_concept_structure_tree_tx_v1",
];

function loadPluginClass() {
  class Plugin {
    constructor(app, manifest) {
      this.app = app;
      this.manifest = manifest;
    }
  }
  class ItemView {}
  class PluginSettingTab {}
  class Setting {}
  const obsidian = { Plugin, ItemView, PluginSettingTab, Setting, setIcon() {} };
  const restrictedRequire = (request) => {
    if (request === "obsidian") return obsidian;
    throw new Error(`Obsidian loader cannot resolve plugin-local module: ${request}`);
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", mainSource)(restrictedRequire, module, module.exports);
  return module.exports;
}

function createHarness(options = {}) {
  const calls = { exists: [], read: [], saveData: 0, storageWrites: [], engineStarts: 0 };
  const files = new Map(Object.entries(options.files || {}));
  const existsErrors = new Map(Object.entries(options.existsErrors || {}));
  const readErrors = new Map(Object.entries(options.readErrors || {}));
  const adapter = {
    async exists(candidatePath) {
      calls.exists.push(candidatePath);
      if (existsErrors.has(candidatePath)) throw existsErrors.get(candidatePath);
      return files.has(candidatePath) || readErrors.has(candidatePath);
    },
    async read(candidatePath) {
      calls.read.push(candidatePath);
      if (readErrors.has(candidatePath)) throw readErrors.get(candidatePath);
      return files.get(candidatePath);
    },
  };
  const PluginClass = loadPluginClass();
  const plugin = new PluginClass({ vault: { adapter } }, {
    id: "supermemo-concept-display",
    dir: options.manifestDir || ".obsidian/plugins/supermemo-concept-display",
  });
  plugin.saveData = async () => { calls.saveData += 1; };
  plugin.loadEngineRunner = async () => {
    calls.engineStarts += 1;
    return async () => ({ cleanup() {} });
  };
  return { plugin, calls };
}

async function assertRejectedWithoutWrites(harness, expectedCode) {
  const originalLocalStorage = global.localStorage;
  global.localStorage = {
    getItem() { return null; },
    setItem(key) { harness.calls.storageWrites.push(key); },
    removeItem(key) { harness.calls.storageWrites.push(key); },
  };
  try {
    await assert.rejects(
      () => harness.plugin.loadRuntimeModules(),
      (error) => error?.code === expectedCode,
    );
  } finally {
    global.localStorage = originalLocalStorage;
  }
  assert.strictEqual(harness.calls.engineStarts, 0, "engine must not start after model failure");
  assert.strictEqual(harness.calls.saveData, 0, "model loading must not call saveData");
  assert.deepStrictEqual(harness.calls.storageWrites, [], "model loading must not write localStorage");
  assert.strictEqual(STORAGE_KEYS.some((key) => harness.calls.storageWrites.includes(key)), false);
}

async function run() {
  assert.strictEqual(mainSource.includes('require("./supermemo-concept-tree-model")'), false);

  const manifestPath = ".custom/plugins/supermemo-concept-display/supermemo-concept-tree-model.js";
  const fallbackPath = ".obsidian/plugins/supermemo-concept-display/supermemo-concept-tree-model.js";

  const manifestHarness = createHarness({ manifestDir: ".custom/plugins/supermemo-concept-display", files: { [manifestPath]: modelSource } });
  const manifestModules = await manifestHarness.plugin.loadRuntimeModules();
  assert.strictEqual(typeof manifestModules.conceptTreeModel.validateTreeStore, "function");
  assert.strictEqual(typeof manifestModules.runEngine, "function");
  assert.deepStrictEqual(manifestHarness.calls.read, [manifestPath]);
  assert.strictEqual(manifestHarness.calls.engineStarts, 1);

  const fallbackHarness = createHarness({ manifestDir: ".custom/plugins/supermemo-concept-display", files: { [fallbackPath]: modelSource } });
  const fallbackModel = await fallbackHarness.plugin.loadConceptTreeModel();
  assert.strictEqual(typeof fallbackModel.createEmptyTreeStore, "function");
  assert.deepStrictEqual(fallbackHarness.calls.read, [fallbackPath]);

  const readFallbackHarness = createHarness({
    manifestDir: ".custom/plugins/supermemo-concept-display",
    files: { [fallbackPath]: modelSource },
    readErrors: { [manifestPath]: new Error("manifest read failed") },
  });
  const readFallbackModel = await readFallbackHarness.plugin.loadConceptTreeModel();
  assert.strictEqual(typeof readFallbackModel.assignConcept, "function");
  assert.deepStrictEqual(readFallbackHarness.calls.read, [manifestPath, fallbackPath]);

  await assertRejectedWithoutWrites(createHarness({ manifestDir: ".custom/plugins/supermemo-concept-display" }), "MODEL_FILE_NOT_FOUND");
  await assertRejectedWithoutWrites(createHarness({
    manifestDir: ".custom/plugins/supermemo-concept-display",
    readErrors: {
      [manifestPath]: new Error("manifest read failed"),
      [fallbackPath]: new Error("fallback read failed"),
    },
  }), "MODEL_FILE_UNREADABLE");
  await assertRejectedWithoutWrites(createHarness({ files: { [fallbackPath]: "module.exports = ;" } }), "MODEL_EVAL_FAILED");
  await assertRejectedWithoutWrites(createHarness({ files: { [fallbackPath]: "module.exports = {};" } }), "MODEL_EXPORT_INVALID");
  await assertRejectedWithoutWrites(createHarness({ files: { [fallbackPath]: "require('fs'); module.exports = {};" } }), "MODEL_REQUIRE_BLOCKED");

  const failClosedEvalHarness = createHarness({
    manifestDir: ".custom/plugins/supermemo-concept-display",
    files: {
      [manifestPath]: "module.exports = ;",
      [fallbackPath]: modelSource,
    },
  });
  await assertRejectedWithoutWrites(failClosedEvalHarness, "MODEL_EVAL_FAILED");
  assert.deepStrictEqual(failClosedEvalHarness.calls.read, [manifestPath]);

  const failClosedExportHarness = createHarness({
    manifestDir: ".custom/plugins/supermemo-concept-display",
    files: {
      [manifestPath]: "module.exports = {};",
      [fallbackPath]: modelSource,
    },
  });
  await assertRejectedWithoutWrites(failClosedExportHarness, "MODEL_EXPORT_INVALID");
  assert.deepStrictEqual(failClosedExportHarness.calls.read, [manifestPath]);

  console.log("supermemo-concept-loader tests: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
