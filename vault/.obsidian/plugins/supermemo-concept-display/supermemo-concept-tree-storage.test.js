"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const treeModel = require("./supermemo-concept-tree-model");

const CONCEPT_KEY = "supermemo_concepts_final_v3";
const TREE_KEY = "supermemo_concept_structure_tree_v1";
const UI_KEY = "supermemo_concept_structure_tree_ui_v1";
const TX_KEY = "supermemo_concept_structure_tree_tx_v1";

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
    this.operations = [];
    this.beforeGet = null;
    this.beforeSet = null;
    this.beforeRemove = null;
  }

  getItem(key) {
    if (this.beforeGet) this.beforeGet(key, this);
    this.operations.push({ op: "get", key });
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.beforeSet) this.beforeSet(key, String(value), this);
    this.operations.push({ op: "set", key, value: String(value) });
    this.values.set(key, String(value));
  }

  removeItem(key) {
    if (this.beforeRemove) this.beforeRemove(key, this);
    this.operations.push({ op: "remove", key });
    this.values.delete(key);
  }

  directSet(key, value) {
    this.values.set(key, String(value));
  }

  writes(key = null) {
    return this.operations.filter((operation) => (
      (operation.op === "set" || operation.op === "remove")
      && (key == null || operation.key === key)
    ));
  }
}

function createDocumentStub() {
  const styles = new Map();
  const listeners = new Map();
  return {
    head: {
      appendChild(element) {
        if (element.id) styles.set(element.id, element);
      },
    },
    createElement(tag) {
      return {
        tag,
        id: "",
        textContent: "",
        remove() {
          if (this.id) styles.delete(this.id);
        },
      };
    },
    getElementById(id) {
      return styles.get(id) || null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatchEvent(event) {
      for (const handler of Array.from(listeners.get(event.type) || [])) handler(event);
    },
  };
}

class FakeElement {
  constructor(tag = "div", options = {}) {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.className = options.cls || "";
    this.textContent = options.text || "";
    this.attributes = { ...(options.attr || {}) };
    this.dataset = {};
    this.value = options.attr?.value == null ? "" : String(options.attr.value);
    this._innerHTML = "";
    this.style = {
      cssText: "",
      values: {},
      setProperty: (name, value) => {
        this.style.values[name] = String(value);
      },
    };
    this.classList = {
      add: (...names) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.add(name));
        this.className = Array.from(classes).join(" ");
      },
      remove: (...names) => {
        const removed = new Set(names);
        this.className = this.className.split(/\s+/).filter((name) => name && !removed.has(name)).join(" ");
      },
      contains: (name) => this.className.split(/\s+/).includes(name),
    };
    this.listeners = new Map();
  }

  set innerHTML(value) {
    this._innerHTML = String(value || "");
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  createEl(tag, options = {}) {
    const child = new FakeElement(tag, options);
    child.parent = this;
    this.children.push(child);
    return child;
  }

  createDiv(options = {}) {
    return this.createEl("div", options);
  }

  createSpan(options = {}) {
    return this.createEl("span", options);
  }

  empty() {
    this.children = [];
    this._innerHTML = "";
  }

  addClass(...names) {
    this.classList.add(...names);
  }

  removeClass(...names) {
    this.classList.remove(...names);
  }

  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatchEvent(event) {
    for (const handler of Array.from(this.listeners.get(event.type) || [])) handler(event);
  }

  focus() {
    this.focused = true;
  }

  select() {
    this.selected = true;
  }

  querySelector(selector) {
    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      return this.find((element) => element.classList.contains(className));
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    if (!selector.startsWith(".")) return results;
    const className = selector.slice(1);
    this.walk((element) => {
      if (element.classList.contains(className)) results.push(element);
    });
    return results;
  }

  find(predicate) {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) return found;
    }
    return null;
  }

  walk(visitor) {
    visitor(this);
    this.children.forEach((child) => child.walk(visitor));
  }

  scrollIntoView() {}
}

function compileEngineForTests() {
  const enginePath = path.join(__dirname, "supermemo-concept-display-engine.js");
  const source = fs.readFileSync(enginePath, "utf8");
  const marker = "// ============ 主入口 ============";
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, "engine test seam marker must exist");
  const instrumented = `${source.slice(0, markerIndex)}
  return {
    state,
    loadData,
    loadTreeStores,
    saveData,
    normalizeTreeUi,
    readCurrentTreeStore,
    commitTreeCandidate,
    commitTreeMutation,
    persistPendingTransaction,
    clearPendingTransaction,
    clearInvalidTransactionLock,
    addStableIdToSharedConcept,
    ensureConceptStableId,
    recoverPendingTreeTransaction,
    revealConceptInTree,
    flushPendingTreeReveal,
    importData,
    fingerprintImportText,
    normalizeImportedConceptPayload,
    validateImportedCrossStore,
    setRenderView(fn) { renderViewFn = fn; },
  };
};`;
  const moduleRecord = { exports: {} };
  const localRequire = (request) => {
    if (request === "obsidian") return { Notice: class Notice {} };
    return require(request);
  };
  const factory = new Function("module", "exports", "require", `${instrumented}\n;return module.exports;`);
  return factory(moduleRecord, moduleRecord.exports, localRequire);
}

function compileFullEngine() {
  const enginePath = path.join(__dirname, "supermemo-concept-display-engine.js");
  const source = fs.readFileSync(enginePath, "utf8");
  const moduleRecord = { exports: {} };
  const localRequire = (request) => {
    if (request === "obsidian") return { Notice: class Notice {} };
    return require(request);
  };
  const factory = new Function("module", "exports", "require", `${source}\n;return module.exports;`);
  return factory(moduleRecord, moduleRecord.exports, localRequire);
}

async function createHarness(initial = {}) {
  const storage = new MemoryStorage(initial);
  const animationFrames = [];
  const timeouts = [];
  global.localStorage = storage;
  global.document = createDocumentStub();
  global.requestAnimationFrame = (callback) => {
    animationFrames.push(callback);
    return animationFrames.length;
  };
  global.confirm = () => true;
  global.window = {
    moment: () => ({ format: () => "2026-08-22 18:00:00" }),
    CSS: { escape: (value) => String(value).replace(/(["\\])/g, "\\$1") },
    setTimeout(callback) {
      timeouts.push(callback);
      return timeouts.length;
    },
    clearTimeout() {},
  };
  const runner = compileEngineForTests();
  const hooks = await runner({ container: {}, conceptTreeModel: treeModel, setIcon: null });
  hooks.setRenderView(() => {});
  return { storage, hooks, animationFrames, timeouts };
}

function conceptRoot(concepts) {
  return JSON.stringify({
    concepts,
    conceptKeywordIndex: {},
    version: "1.0",
    customRoot: { preserved: true },
  });
}

function assignedTreeFixture() {
  let store = treeModel.createEmptyTreeStore();
  store = treeModel.createTreeNode(store, {
    label: "主体结构",
    idFactory: () => "node_root",
    now: "2026-08-22T09:00:00Z",
  });
  store = treeModel.reserveConceptStableId(store, "stable_one", "2026-08-22T09:01:00Z");
  store = treeModel.assignConcept(store, "stable_one", "node_root", "2026-08-22T09:02:00Z");
  return store;
}

function runImportText(hooks, text, name = "bundle.json") {
  const input = {
    type: "",
    accept: "",
    onchange: null,
    click() {
      this.onchange({ target: { files: [{ name }] } });
    },
  };
  global.document.createElement = (tag) => {
    assert.equal(tag, "input");
    return input;
  };
  global.FileReader = class FileReader {
    readAsText() {
      this.onload({ target: { result: text } });
    }
  };
  hooks.importData();
}

async function testLoadNeverWrites() {
  const empty = await createHarness();
  empty.hooks.loadData();
  empty.hooks.loadTreeStores();
  assert.equal(empty.storage.writes().length, 0);
  assert.deepEqual(empty.hooks.state.concepts, {});

  const malformed = await createHarness({
    [CONCEPT_KEY]: "{broken",
    [TREE_KEY]: "{broken",
    [UI_KEY]: "{broken",
    [TX_KEY]: "{broken",
  });
  malformed.hooks.loadData();
  malformed.hooks.loadTreeStores();
  assert.equal(malformed.storage.writes().length, 0);
  assert.equal(malformed.hooks.state.conceptLoadError.code, "CONCEPT_PARSE_FAILED");
  assert.equal(malformed.hooks.state.treeReadOnly, true);
  assert.equal(malformed.hooks.state.pendingTreeTx.stage, "parse-failed");
}

async function testInvalidTransactionSafeClear() {
  const conceptRaw = conceptRoot({ c1: { id: "c1", keyword: "Concept A", parentId: null } });
  const treeRaw = JSON.stringify(treeModel.createEmptyTreeStore());
  const safe = await createHarness({
    [CONCEPT_KEY]: conceptRaw,
    [TREE_KEY]: treeRaw,
    [TX_KEY]: "{broken",
  });
  safe.hooks.loadData();
  safe.hooks.loadTreeStores();
  safe.hooks.setRenderView(() => {});
  assert.equal(safe.hooks.clearInvalidTransactionLock(), true);
  assert.equal(safe.storage.values.has(TX_KEY), false);
  assert.equal(safe.storage.values.get(CONCEPT_KEY), conceptRaw);
  assert.equal(safe.storage.values.get(TREE_KEY), treeRaw);

  let orphanTree = treeModel.createEmptyTreeStore();
  orphanTree = treeModel.createTreeNode(orphanTree, { label: "A", idFactory: () => "node_a" });
  orphanTree = treeModel.reserveConceptStableId(orphanTree, "orphan");
  orphanTree = treeModel.assignConcept(orphanTree, "orphan", "node_a");
  const unsafe = await createHarness({
    [CONCEPT_KEY]: conceptRaw,
    [TREE_KEY]: JSON.stringify(orphanTree),
    [TX_KEY]: "{broken",
  });
  unsafe.hooks.loadData();
  unsafe.hooks.loadTreeStores();
  assert.equal(unsafe.hooks.clearInvalidTransactionLock(), false);
  assert.equal(unsafe.storage.values.get(TX_KEY), "{broken");
  assert.equal(unsafe.storage.writes(TX_KEY).length, 0);
}

async function testTreeRevisionConflict() {
  let base = treeModel.createEmptyTreeStore();
  base = treeModel.createTreeNode(base, { label: "A", idFactory: () => "node_a" });
  const harness = await createHarness({ [TREE_KEY]: JSON.stringify(base) });
  harness.hooks.loadData();
  harness.hooks.loadTreeStores();
  const candidate = treeModel.renameTreeNode(harness.hooks.state.treeStore, "node_a", "A-local");
  const external = treeModel.createTreeNode(base, { label: "B", idFactory: () => "node_b" });
  harness.storage.directSet(TREE_KEY, JSON.stringify(external));
  assert.throws(
    () => harness.hooks.commitTreeCandidate(candidate, base.revision, "fault-injection"),
    (error) => error?.code === "TREE_REVISION_CONFLICT",
  );
  assert.equal(harness.storage.writes(TREE_KEY).length, 0);
  assert.equal(harness.hooks.state.treeStore.revision, external.revision);
}

async function testStableIdCasAndFieldPreservation() {
  const raw = conceptRoot({
    c1: { id: "c1", keyword: "Concept A", parentId: null, customRecord: { preserved: true } },
    c2: { id: "c2", keyword: "Concept B", parentId: null },
  });
  const conflict = await createHarness({ [CONCEPT_KEY]: raw });
  conflict.hooks.loadData();
  let conceptReads = 0;
  conflict.storage.beforeGet = (key, storage) => {
    if (key !== CONCEPT_KEY) return;
    conceptReads += 1;
    if (conceptReads === 2) {
      const changed = JSON.parse(storage.values.get(CONCEPT_KEY));
      changed.concurrent = true;
      storage.directSet(CONCEPT_KEY, JSON.stringify(changed));
    }
  };
  assert.throws(
    () => conflict.hooks.addStableIdToSharedConcept("c1", "stable_one"),
    (error) => error?.code === "CONCEPT_CAS_CONFLICT",
  );
  assert.equal(conflict.storage.writes(CONCEPT_KEY).length, 0);

  const success = await createHarness({ [CONCEPT_KEY]: raw });
  success.hooks.loadData();
  success.hooks.addStableIdToSharedConcept("c1", "stable_one");
  const after = JSON.parse(success.storage.values.get(CONCEPT_KEY));
  assert.equal(after.concepts.c1.stableId, "stable_one");
  assert.deepEqual(after.concepts.c1.customRecord, { preserved: true });
  assert.deepEqual(after.customRoot, { preserved: true });
  assert.equal(after.concepts.c2.stableId, undefined);
}

async function prepareDeleteHarness() {
  const tree = assignedTreeFixture();
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({
      c1: { id: "c1", keyword: "Concept A", parentId: null, stableId: "stable_one" },
    }),
    [TREE_KEY]: JSON.stringify(tree),
  });
  harness.hooks.loadData();
  harness.hooks.loadTreeStores();
  const tx = treeModel.createDeleteTransaction({
    conceptId: "c1",
    stableId: "stable_one",
    txId: "tx_delete",
    expectedTreeRevision: tree.revision,
  });
  harness.hooks.persistPendingTransaction(tx);
  return harness;
}

async function testDeleteTransactionFaults() {
  const conceptWriteFailure = await prepareDeleteHarness();
  conceptWriteFailure.storage.beforeSet = (key) => {
    if (key === CONCEPT_KEY) throw Object.assign(new Error("injected concept failure"), { code: "INJECTED_CONCEPT_WRITE" });
  };
  assert.equal(await conceptWriteFailure.hooks.recoverPendingTreeTransaction(), false);
  assert.ok(JSON.parse(conceptWriteFailure.storage.values.get(CONCEPT_KEY)).concepts.c1);
  assert.equal(JSON.parse(conceptWriteFailure.storage.values.get(TX_KEY)).stage, "prepared");
  assert.equal(JSON.parse(conceptWriteFailure.storage.values.get(TREE_KEY)).conceptAssignments.stable_one, "node_root");

  const treeWriteFailure = await prepareDeleteHarness();
  treeWriteFailure.storage.beforeSet = (key) => {
    if (key === TREE_KEY) throw Object.assign(new Error("injected tree failure"), { code: "INJECTED_TREE_WRITE" });
  };
  assert.equal(await treeWriteFailure.hooks.recoverPendingTreeTransaction(), false);
  assert.equal(JSON.parse(treeWriteFailure.storage.values.get(CONCEPT_KEY)).concepts.c1, undefined);
  assert.equal(JSON.parse(treeWriteFailure.storage.values.get(TX_KEY)).stage, "concept-deleted");
  assert.equal(JSON.parse(treeWriteFailure.storage.values.get(TREE_KEY)).conceptAssignments.stable_one, "node_root");
  treeWriteFailure.storage.beforeSet = null;
  assert.equal(await treeWriteFailure.hooks.recoverPendingTreeTransaction(), true);
  assert.equal(treeWriteFailure.storage.values.has(TX_KEY), false);
  assert.equal(JSON.parse(treeWriteFailure.storage.values.get(TREE_KEY)).conceptAssignments.stable_one, undefined);

  const txStageFailure = await prepareDeleteHarness();
  let txSetCount = 0;
  txStageFailure.storage.beforeSet = (key) => {
    if (key === TX_KEY && ++txSetCount === 1) throw new Error("injected tx stage failure");
  };
  assert.equal(await txStageFailure.hooks.recoverPendingTreeTransaction(), false);
  assert.equal(JSON.parse(txStageFailure.storage.values.get(CONCEPT_KEY)).concepts.c1, undefined);
  assert.equal(JSON.parse(txStageFailure.storage.values.get(TX_KEY)).stage, "concept-deleted");
  txStageFailure.storage.beforeSet = null;
  assert.equal(await txStageFailure.hooks.recoverPendingTreeTransaction(), true);

  const cleanupFailure = await prepareDeleteHarness();
  cleanupFailure.storage.beforeRemove = (key) => {
    if (key === TX_KEY) throw new Error("injected cleanup failure");
  };
  assert.equal(await cleanupFailure.hooks.recoverPendingTreeTransaction(), false);
  assert.equal(JSON.parse(cleanupFailure.storage.values.get(TX_KEY)).stage, "cleanup-pending");
  assert.equal(JSON.parse(cleanupFailure.storage.values.get(CONCEPT_KEY)).concepts.c1, undefined);
  assert.equal(JSON.parse(cleanupFailure.storage.values.get(TREE_KEY)).conceptAssignments.stable_one, undefined);
  cleanupFailure.storage.beforeRemove = null;
  assert.equal(await cleanupFailure.hooks.recoverPendingTreeTransaction(), true);
}

async function testReservationUnionAndSmaCompatibility() {
  const existing = treeModel.createEmptyTreeStore();
  existing.reservedConceptStableIds = ["historical"];
  const imported = treeModel.createEmptyTreeStore();
  imported.reservedConceptStableIds = ["imported"];
  imported.conceptAssignments.assigned = "missing";
  assert.throws(() => treeModel.mergeReservationAuthority(existing, imported, ["active"]), /ASSIGNMENT_NODE_MISSING/);
  delete imported.conceptAssignments.assigned;
  const merged = treeModel.mergeReservationAuthority(existing, imported, ["active"]);
  assert.deepEqual(new Set(merged.reservedConceptStableIds), new Set(["historical", "imported", "active"]));

  const before = JSON.parse(conceptRoot({ c1: { id: "c1", keyword: "Concept A", parentId: null, note: "N" } }));
  const after = treeModel.addStableIdToRawConceptRoot(before, "c1", "stable_one");
  const smaProjection = (root) => Object.fromEntries(Object.entries(root.concepts).map(([id, concept]) => [id, {
    ...concept,
    id: concept.id || id,
    parentId: concept.parentId || null,
  }]));
  const projectedBefore = smaProjection(before);
  const projectedAfter = smaProjection(after);
  delete projectedAfter.c1.stableId;
  assert.deepEqual(projectedAfter, projectedBefore);
}

async function testImportCandidateValidation() {
  const harness = await createHarness();
  assert.throws(
    () => harness.hooks.normalizeImportedConceptPayload({}),
    (error) => error?.code === "IMPORT_CONCEPT_ROOT_INVALID",
  );
  assert.throws(
    () => harness.hooks.normalizeImportedConceptPayload({ concepts: {
      a: { id: "same", keyword: "A" },
      b: { id: "same", keyword: "B" },
    } }),
    (error) => error?.code === "IMPORT_CONCEPT_ID_DUPLICATE",
  );
  assert.throws(
    () => harness.hooks.normalizeImportedConceptPayload({ concepts: {
      a: { id: "a", keyword: "A", stableId: "stable" },
      b: { id: "b", keyword: "B", stableId: "stable" },
    } }),
    (error) => error?.code === "IMPORT_CONCEPT_STABLE_ID_DUPLICATE",
  );
  assert.throws(
    () => harness.hooks.normalizeImportedConceptPayload({ concepts: {
      a: { id: "a", keyword: "A", parentId: "b" },
      b: { id: "b", keyword: "B", parentId: "a" },
    } }),
    (error) => error?.code === "IMPORT_CONCEPT_CYCLE",
  );
  const normalized = harness.hooks.normalizeImportedConceptPayload({
    concepts: { a: { id: "a", keyword: "A", stableId: "stable_a" } },
    conceptKeywordIndex: { Alpha: "a", Ghost: "missing" },
  });
  assert.deepEqual(normalized.conceptKeywordIndex, { alpha: "a" });
  let tree = treeModel.createEmptyTreeStore();
  tree = treeModel.createTreeNode(tree, { label: "A", idFactory: () => "node_a" });
  tree = treeModel.reserveConceptStableId(tree, "missing_stable");
  tree = treeModel.assignConcept(tree, "missing_stable", "node_a");
  assert.throws(
    () => harness.hooks.validateImportedCrossStore(normalized.concepts, tree),
    (error) => error?.code === "IMPORT_CROSS_STORE_INVALID",
  );
}

async function testStaleRevealSupersession() {
  let tree = treeModel.createEmptyTreeStore();
  tree = treeModel.createTreeNode(tree, { label: "A", idFactory: () => "node_a" });
  tree = treeModel.createTreeNode(tree, { label: "B", idFactory: () => "node_b" });
  tree = treeModel.reserveConceptStableId(tree, "stable_a");
  tree = treeModel.reserveConceptStableId(tree, "stable_b");
  tree = treeModel.assignConcept(tree, "stable_a", "node_a");
  tree = treeModel.assignConcept(tree, "stable_b", "node_b");
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({
      c1: { id: "c1", keyword: "Concept A", stableId: "stable_a" },
      c2: { id: "c2", keyword: "Concept B", stableId: "stable_b" },
    }),
    [TREE_KEY]: JSON.stringify(tree),
  });
  harness.hooks.loadData();
  harness.hooks.loadTreeStores();
  const events = [];
  const targetA = {
    scrollIntoView: () => events.push("scroll-a"),
    classList: { add: () => events.push("add-a"), remove: () => events.push("remove-a") },
  };
  const targetB = {
    scrollIntoView: () => events.push("scroll-b"),
    classList: { add: () => events.push("add-b"), remove: () => events.push("remove-b") },
  };
  const container = {
    querySelector(selector) {
      if (selector.includes("stable_a")) return targetA;
      if (selector.includes("stable_b")) return targetB;
      return null;
    },
  };
  harness.hooks.revealConceptInTree("c1");
  harness.hooks.flushPendingTreeReveal(container);
  harness.hooks.revealConceptInTree("c2");
  harness.hooks.flushPendingTreeReveal(container);
  harness.animationFrames.splice(0).forEach((callback) => callback());
  harness.timeouts.splice(0).forEach((callback) => callback());
  assert.deepEqual(events, ["scroll-b", "add-b", "remove-b"]);
}

async function testPendingImportCanRetry() {
  const originalTree = treeModel.createEmptyTreeStore();
  let importedTree = treeModel.createEmptyTreeStore();
  importedTree = treeModel.createTreeNode(importedTree, { label: "Imported", idFactory: () => "node_imported" });
  const payload = JSON.stringify({
    bundleVersion: "supermemo-concept-display-bundle-v2",
    sharedConceptStore: JSON.parse(conceptRoot({ next: { id: "next", keyword: "Next", parentId: null } })),
    structureTree: importedTree,
    treeUi: { activeSurface: "tree", selectedNodeId: "node_imported", zoom: 1.1 },
  });
  const pending = {
    schemaVersion: 1,
    txId: "tx_import",
    type: "import",
    stage: "retry-required",
    createdAt: "2026-08-22T10:00:00Z",
    expectedTreeRevision: originalTree.revision,
    retryCount: 0,
    sourceFingerprint: `fnv1a32:${(() => {
      let hash = 2166136261;
      for (let index = 0; index < payload.length; index += 1) hash = Math.imul(hash ^ payload.charCodeAt(index), 16777619);
      return (hash >>> 0).toString(16).padStart(8, "0");
    })()}:${payload.length}`,
  };
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({ old: { id: "old", keyword: "Old", parentId: null } }),
    [TREE_KEY]: JSON.stringify(originalTree),
    [TX_KEY]: JSON.stringify(pending),
  });
  harness.hooks.loadData();
  harness.hooks.loadTreeStores();
  runImportText(harness.hooks, payload);
  assert.equal(harness.storage.values.has(TX_KEY), false);
  assert.ok(JSON.parse(harness.storage.values.get(CONCEPT_KEY)).concepts.next);
  assert.ok(JSON.parse(harness.storage.values.get(TREE_KEY)).nodesById.node_imported);
  assert.equal(JSON.parse(harness.storage.values.get(UI_KEY)).selectedNodeId, "node_imported");
}

async function testPendingImportRejectsDifferentSource() {
  const expectedText = JSON.stringify({ concepts: { expected: { id: "expected", keyword: "Expected" } } });
  const pending = {
    schemaVersion: 1,
    txId: "tx_import_source",
    type: "import",
    stage: "retry-required",
    createdAt: "2026-08-22T10:00:00Z",
    expectedTreeRevision: 0,
    retryCount: 1,
    sourceFingerprint: "placeholder",
  };
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({ old: { id: "old", keyword: "Old" } }),
    [TREE_KEY]: JSON.stringify(treeModel.createEmptyTreeStore()),
    [TX_KEY]: JSON.stringify(pending),
  });
  harness.hooks.loadData();
  harness.hooks.loadTreeStores();
  pending.sourceFingerprint = harness.hooks.fingerprintImportText(expectedText);
  harness.storage.directSet(TX_KEY, JSON.stringify(pending));
  harness.hooks.loadTreeStores();
  const differentText = JSON.stringify({ concepts: { different: { id: "different", keyword: "Different" } } });
  const conceptBefore = harness.storage.values.get(CONCEPT_KEY);
  const treeBefore = harness.storage.values.get(TREE_KEY);
  runImportText(harness.hooks, differentText, "different.json");
  assert.equal(harness.storage.values.get(CONCEPT_KEY), conceptBefore);
  assert.equal(harness.storage.values.get(TREE_KEY), treeBefore);
  assert.equal(JSON.parse(harness.storage.values.get(TX_KEY)).txId, "tx_import_source");
}

async function testInvalidImportAndRetryFailure() {
  for (const invalidText of [
    JSON.stringify({}),
    JSON.stringify({ bundleVersion: "future-v99", sharedConceptStore: { concepts: {} } }),
    JSON.stringify({ bundleVersion: "supermemo-concept-display-bundle-v2", sharedConceptStore: { concepts: {} } }),
    JSON.stringify({
      bundleVersion: "supermemo-concept-display-bundle-v2",
      sharedConceptStore: { concepts: {} },
      structureTree: {
        schemaVersion: 1,
        revision: 0,
        nodesById: { bad: {} },
        reservedTreeNodeIds: [],
        reservedConceptStableIds: [],
        conceptAssignments: {},
      },
    }),
    JSON.stringify({ concepts: {
      a: { id: "a", keyword: "A", stableId: "same" },
      b: { id: "b", keyword: "B", stableId: "same" },
    } }),
  ]) {
    const invalid = await createHarness({
      [CONCEPT_KEY]: conceptRoot({ old: { id: "old", keyword: "Old" } }),
      [TREE_KEY]: JSON.stringify(treeModel.createEmptyTreeStore()),
    });
    invalid.hooks.loadData();
    invalid.hooks.loadTreeStores();
    invalid.storage.operations = [];
    runImportText(invalid.hooks, invalidText, "invalid.json");
    assert.equal(invalid.storage.writes().length, 0);
    assert.ok(JSON.parse(invalid.storage.values.get(CONCEPT_KEY)).concepts.old);
  }

  const payload = JSON.stringify({
    bundleVersion: "supermemo-concept-display-bundle-v2",
    sharedConceptStore: { concepts: { next: { id: "next", keyword: "Next" } } },
    structureTree: treeModel.createEmptyTreeStore(),
    treeUi: { activeSurface: "tree" },
  });
  const pending = {
    schemaVersion: 1,
    txId: "tx_import_retry_failure",
    type: "import",
    stage: "retry-required",
    createdAt: "2026-08-22T10:00:00Z",
    expectedTreeRevision: 0,
    retryCount: 1,
    sourceFingerprint: `fnv1a32:${(() => {
      let hash = 2166136261;
      for (let index = 0; index < payload.length; index += 1) hash = Math.imul(hash ^ payload.charCodeAt(index), 16777619);
      return (hash >>> 0).toString(16).padStart(8, "0");
    })()}:${payload.length}`,
  };
  const retry = await createHarness({
    [CONCEPT_KEY]: conceptRoot({ old: { id: "old", keyword: "Old" } }),
    [TREE_KEY]: JSON.stringify(treeModel.createEmptyTreeStore()),
    [TX_KEY]: JSON.stringify(pending),
  });
  retry.hooks.loadData();
  retry.hooks.loadTreeStores();
  const conceptBefore = retry.storage.values.get(CONCEPT_KEY);
  const treeBefore = retry.storage.values.get(TREE_KEY);
  retry.storage.beforeSet = (key) => {
    if (key === TREE_KEY) throw Object.assign(new Error("injected import tree failure"), { code: "INJECTED_IMPORT_TREE_WRITE" });
  };
  runImportText(retry.hooks, payload);
  assert.equal(retry.storage.values.get(CONCEPT_KEY), conceptBefore);
  assert.equal(retry.storage.values.get(TREE_KEY), treeBefore);
  assert.equal(JSON.parse(retry.storage.values.get(TX_KEY)).stage, "retry-required");
  assert.equal(JSON.parse(retry.storage.values.get(TX_KEY)).txId, "tx_import_retry_failure");
}

async function testFullRenderSmoke() {
  let tree = treeModel.createEmptyTreeStore();
  tree = treeModel.createTreeNode(tree, { label: "知识体系", idFactory: () => "node_root" });
  tree = treeModel.createTreeNode(tree, { label: "维修能力", parentId: "node_root", idFactory: () => "node_child" });
  tree = treeModel.reserveConceptStableId(tree, "stable_one");
  tree = treeModel.assignConcept(tree, "stable_one", "node_child");
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({
      c1: { id: "c1", keyword: "Concept A", parentId: null, stableId: "stable_one", note: "" },
      c2: { id: "c2", keyword: "Concept B", parentId: "c1", note: "" },
    }),
    [TREE_KEY]: JSON.stringify(tree),
    [UI_KEY]: JSON.stringify({ activeSurface: "tree", selectedNodeId: "node_child", zoom: 1 }),
  });
  harness.storage.operations = [];
  global.window._smConceptIndex = undefined;
  const root = new FakeElement("div");
  const runEngine = compileFullEngine();
  const session = await runEngine({ container: root, conceptTreeModel: treeModel, setIcon: null });
  assert.ok(root.find((element) => element.classList.contains("sm-surface-tabs")));
  assert.ok(root.find((element) => element.classList.contains("sm-tree-workspace")));
  assert.ok(root.find((element) => element.classList.contains("sm-structure-node")));
  assert.ok(root.find((element) => element.classList.contains("sm-tree-inspector")));
  const treePanel = root.find((element) => element.classList.contains("sm-tree-surface"));
  assert.ok(treePanel.classList.contains("sm-surface-panel"), "tree render must retain the shared panel class");
  assert.equal(harness.storage.writes().length, 0, "full render must not write any store");
  session.cleanup();

  const future = await createHarness({
    [CONCEPT_KEY]: conceptRoot({ c1: { id: "c1", keyword: "Concept A" } }),
    [TREE_KEY]: JSON.stringify({ schemaVersion: 99, opaque: true }),
    [UI_KEY]: JSON.stringify({ activeSurface: "tree" }),
  });
  future.storage.operations = [];
  global.window._smConceptIndex = undefined;
  const futureRoot = new FakeElement("div");
  const futureSession = await compileFullEngine()({ container: futureRoot, conceptTreeModel: treeModel, setIcon: null });
  assert.ok(futureRoot.find((element) => element.classList.contains("sm-tree-protection")));
  assert.equal(futureRoot.find((element) => element.classList.contains("sm-tree-workspace")), null);
  assert.equal(future.storage.writes().length, 0);
  futureSession.cleanup();
}

async function testCapsulePanelClass() {
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({ c1: { id: "c1", keyword: "Concept A", parentId: null, note: "" } }),
    [TREE_KEY]: JSON.stringify(treeModel.createEmptyTreeStore()),
    [UI_KEY]: JSON.stringify({ activeSurface: "capsules", zoom: 1 }),
  });
  harness.storage.operations = [];
  const root = new FakeElement("div");
  const session = await compileFullEngine()({ container: root, conceptTreeModel: treeModel, setIcon: null });
  const capsulePanel = root.find((element) => element.classList.contains("sm-container"));
  assert.ok(capsulePanel.classList.contains("sm-surface-panel"), "capsule render must retain the shared panel class");
  assertNoOwnerWrites(harness, "capsule render must not write owners");
  session.cleanup();
}

function findButtonByLabel(root, label) {
  const element = root.find((candidate) => candidate.textContent === label);
  if (!element) return null;
  return element.tag === "button" ? element : element.parent;
}

function assertNoOwnerWrites(harness, message) {
  for (const key of [CONCEPT_KEY, TREE_KEY, UI_KEY, TX_KEY]) {
    assert.equal(harness.storage.writes(key).length, 0, `${message}: ${key}`);
  }
}

async function openEmptyTreeSession() {
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({ c1: { id: "c1", keyword: "Concept A" } }),
    [TREE_KEY]: JSON.stringify(treeModel.createEmptyTreeStore()),
    [UI_KEY]: JSON.stringify({ activeSurface: "tree", zoom: 1 }),
  });
  harness.storage.operations = [];
  global.window._smConceptIndex = undefined;
  const root = new FakeElement("div");
  const session = await compileFullEngine()({ container: root, conceptTreeModel: treeModel, setIcon: null });
  return { harness, root, session };
}

async function testTreeDialogCreateLifecycle() {
  const success = await openEmptyTreeSession();
  const addButton = findButtonByLabel(success.root, "添加第一个结构");
  assert.ok(addButton, "empty tree must expose add button");
  const addPromise = addButton.onclick();
  const input = success.root.find((element) => element.classList.contains("sm-tree-dialog-control"));
  assert.ok(input, "add click must open a plugin-owned input dialog");
  input.value = "主体知识结构";
  const enter = { key: "Enter", isComposing: false, preventDefault() {} };
  input.onkeydown(enter);
  input.onkeydown(enter);
  await addPromise;
  const saved = JSON.parse(success.harness.storage.values.get(TREE_KEY));
  assert.equal(Object.values(saved.nodesById).filter((node) => node.label === "主体知识结构").length, 1);
  assert.equal(success.harness.storage.writes(TREE_KEY).length, 1, "duplicate Enter must commit once");
  assert.ok(success.root.find((element) => element.classList.contains("sm-structure-node")));
  success.session.cleanup();

  const blank = await openEmptyTreeSession();
  const blankPromise = findButtonByLabel(blank.root, "添加第一个结构").onclick();
  const blankInput = blank.root.find((element) => element.classList.contains("sm-tree-dialog-control"));
  blankInput.value = "   ";
  blankInput.onkeydown({ key: "Enter", isComposing: false, preventDefault() {} });
  assert.ok(blank.root.find((element) => element.classList.contains("sm-tree-dialog-overlay")), "blank input must keep dialog open");
  const blankOverlay = blank.root.find((element) => element.classList.contains("sm-tree-dialog-overlay"));
  blankOverlay.onclick({ preventDefault() {}, stopPropagation() {} });
  assert.ok(blank.root.find((element) => element.classList.contains("sm-tree-dialog-overlay")), "overlay click must keep dialog open");
  blankInput.value = "输入法组合中";
  blankInput.onkeydown({ key: "Enter", isComposing: true, preventDefault() {} });
  assertNoOwnerWrites(blank.harness, "blank, overlay and IME paths must not write owners");
  findButtonByLabel(blank.root, "取消").onclick();
  await blankPromise;
  assertNoOwnerWrites(blank.harness, "cancel must not write owners");
  blank.session.cleanup();

  const close = await openEmptyTreeSession();
  const closePromise = findButtonByLabel(close.root, "添加第一个结构").onclick();
  close.root.find((element) => element.classList.contains("sm-tree-dialog-close")).onclick();
  await closePromise;
  assertNoOwnerWrites(close.harness, "close must not write owners");
  close.session.cleanup();

  const escape = await openEmptyTreeSession();
  const escapePromise = findButtonByLabel(escape.root, "添加第一个结构").onclick();
  global.document.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() {} });
  await escapePromise;
  assertNoOwnerWrites(escape.harness, "Escape must not write owners");
  escape.session.cleanup();

  const cleanup = await openEmptyTreeSession();
  const cleanupPromise = findButtonByLabel(cleanup.root, "添加第一个结构").onclick();
  cleanup.session.cleanup();
  await cleanupPromise;
  assertNoOwnerWrites(cleanup.harness, "view cleanup must settle dialog without mutation");

  const singleton = await openEmptyTreeSession();
  const singletonButton = findButtonByLabel(singleton.root, "添加第一个结构");
  const firstPromise = singletonButton.onclick();
  const secondPromise = singletonButton.onclick();
  await firstPromise;
  assert.equal(singleton.root.querySelectorAll(".sm-tree-dialog-overlay").length, 1, "opening a second dialog must settle and remove the first");
  findButtonByLabel(singleton.root, "取消").onclick();
  await secondPromise;
  assertNoOwnerWrites(singleton.harness, "single-dialog replacement must not write owners");
  singleton.session.cleanup();
}

async function testTreeMovePickerSemantics() {
  let tree = treeModel.createEmptyTreeStore();
  tree = treeModel.createTreeNode(tree, { label: "根", idFactory: () => "node_root" });
  tree = treeModel.createTreeNode(tree, { label: "当前父级", parentId: "node_root", idFactory: () => "node_parent" });
  tree = treeModel.createTreeNode(tree, { label: "待移动", parentId: "node_parent", idFactory: () => "node_move" });
  tree = treeModel.createTreeNode(tree, { label: "后代", parentId: "node_move", idFactory: () => "node_child" });
  tree = treeModel.createTreeNode(tree, { label: "候选父级", parentId: "node_root", idFactory: () => "node_target" });
  tree = treeModel.createTreeNode(tree, { label: "归档候选", parentId: "node_root", idFactory: () => "node_archived" });
  tree = treeModel.archiveTreeSubtree(tree, "node_archived");
  const harness = await createHarness({
    [CONCEPT_KEY]: conceptRoot({}),
    [TREE_KEY]: JSON.stringify(tree),
    [UI_KEY]: JSON.stringify({ activeSurface: "tree", selectedNodeId: "node_move", zoom: 1 }),
  });
  harness.storage.operations = [];
  const root = new FakeElement("div");
  const session = await compileFullEngine()({ container: root, conceptTreeModel: treeModel, setIcon: null });

  const moveButton = root.find((element) => element.attributes.title === "移动结构");
  assert.ok(moveButton);
  const renameButton = root.find((element) => element.attributes.title === "改名");
  const renamePromise = renameButton.onclick();
  const renameInput = root.find((element) => element.classList.contains("sm-tree-dialog-control"));
  assert.equal(renameInput.value, "待移动");
  renameInput.value = "待移动已改名";
  findButtonByLabel(root, "保存").onclick();
  await renamePromise;
  assert.equal(JSON.parse(harness.storage.values.get(TREE_KEY)).nodesById.node_move.label, "待移动已改名");
  assert.equal(harness.storage.writes(TREE_KEY).length, 1, "rename must commit one tree revision");
  harness.storage.operations = [];

  const unchangedPromise = moveButton.onclick();
  const select = root.find((element) => element.classList.contains("sm-tree-dialog-control"));
  assert.equal(select.tag, "select");
  assert.equal(select.value, "node_parent", "move picker must preselect current parent");
  const optionLabels = select.children.map((option) => option.textContent);
  assert.ok(optionLabels.includes("顶层结构"));
  assert.ok(optionLabels.includes("根 / 候选父级"));
  assert.equal(optionLabels.some((label) => label.includes("待移动")), false, "self and descendants must be excluded");
  assert.equal(optionLabels.some((label) => label.includes("归档候选")), false, "archived nodes must be excluded");
  findButtonByLabel(root, "移动").onclick();
  await unchangedPromise;
  assert.equal(harness.storage.writes(TREE_KEY).length, 0, "unchanged parent must not write");

  const cancelPromise = moveButton.onclick();
  findButtonByLabel(root, "取消").onclick();
  await cancelPromise;
  assertNoOwnerWrites(harness, "cancelled move must not write owners");

  const targetPromise = moveButton.onclick();
  const targetSelect = root.find((element) => element.classList.contains("sm-tree-dialog-control"));
  targetSelect.value = "node_target";
  findButtonByLabel(root, "移动").onclick();
  await targetPromise;
  assert.equal(JSON.parse(harness.storage.values.get(TREE_KEY)).nodesById.node_move.parentId, "node_target");
  assert.equal(harness.storage.writes(TREE_KEY).length, 1, "valid parent move must commit one tree revision");
  harness.storage.operations = [];

  const topLevelButton = root.find((element) => element.attributes.title === "移动结构");
  const topLevelPromise = topLevelButton.onclick();
  const topLevelSelect = root.find((element) => element.classList.contains("sm-tree-dialog-control"));
  topLevelSelect.value = "";
  findButtonByLabel(root, "移动").onclick();
  await topLevelPromise;
  assert.equal(JSON.parse(harness.storage.values.get(TREE_KEY)).nodesById.node_move.parentId, null);
  assert.equal(harness.storage.writes(TREE_KEY).length, 1, "top-level move must commit one tree revision");
  session.cleanup();
}

function testTreeUiSourceSentinels() {
  const engineSource = fs.readFileSync(path.join(__dirname, "supermemo-concept-display-engine.js"), "utf8");
  const styleSource = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");
  assert.equal(engineSource.includes("window.prompt"), false);
  assert.match(engineSource, /activeTreeDialog\?\.settle\(null\)/);
  assert.match(engineSource, /container\.className = 'sm-surface-panel sm-tree-surface'/);
  assert.match(engineSource, /container\.className = 'sm-surface-panel sm-container'/);
  assert.match(engineSource, /container\.className = 'sm-surface-panel sm-mgr-container'/);
  assert.match(styleSource, /\.supermemo-concept-display-host\s*\{[^}]*height:\s*100%;[^}]*overflow:\s*hidden;/s);
  assert.match(styleSource, /\.sm-surface-panel\s*\{[^}]*flex:\s*1 1 auto;[^}]*overflow:\s*auto;/s);
  assert.match(styleSource, /\.sm-surface-panel\.sm-tree-surface\s*\{[^}]*height:\s*100%;[^}]*overflow:\s*hidden;/s);
  assert.match(styleSource, /\.sm-tree-workspace\s*\{[^}]*flex:\s*1 1 auto;[^}]*overflow:\s*hidden;/s);
  assert.match(styleSource, /@media \(max-width: 900px\)[\s\S]*\.supermemo-concept-display-host\s*\{[^}]*height:\s*auto;[^}]*overflow:\s*auto;[\s\S]*\.sm-surface-panel\s*\{[^}]*overflow:\s*visible;/);
}

async function main() {
  await testLoadNeverWrites();
  await testInvalidTransactionSafeClear();
  await testTreeRevisionConflict();
  await testStableIdCasAndFieldPreservation();
  await testDeleteTransactionFaults();
  await testReservationUnionAndSmaCompatibility();
  await testImportCandidateValidation();
  await testStaleRevealSupersession();
  await testPendingImportCanRetry();
  await testPendingImportRejectsDifferentSource();
  await testInvalidImportAndRetryFailure();
  await testFullRenderSmoke();
  await testCapsulePanelClass();
  await testTreeDialogCreateLifecycle();
  await testTreeMovePickerSemantics();
  testTreeUiSourceSentinels();
  console.log("supermemo-concept-tree storage fault tests: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
