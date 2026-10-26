"use strict";

const assert = require("node:assert/strict");
const model = require("./supermemo-concept-tree-model");

function fixedIds(...ids) {
  const queue = [...ids];
  return () => queue.shift();
}

function node(store, id) {
  return store.nodesById[id];
}

let store = model.createEmptyTreeStore();
store = model.createTreeNode(store, { label: "知识系统", idFactory: fixedIds("root"), now: "2026-08-22T00:00:00Z" });
store = model.createTreeNode(store, { label: "维修", parentId: "root", idFactory: fixedIds("repair"), now: "2026-08-22T00:01:00Z" });
store = model.createTreeNode(store, { label: "工艺", parentId: "repair", idFactory: fixedIds("process"), now: "2026-08-22T00:02:00Z" });
assert.equal(store.revision, 3);
assert.deepEqual(model.collectDescendantIds(store, "root", true), ["root", "repair", "process"]);

let sortedStore = model.createEmptyTreeStore();
sortedStore = model.createTreeNode(sortedStore, { label: "002 - Work", idFactory: fixedIds("root_002") });
sortedStore = model.createTreeNode(sortedStore, { label: "001 - Repair", idFactory: fixedIds("root_001") });
sortedStore = model.createTreeNode(sortedStore, { label: "000 - Service", idFactory: fixedIds("root_000") });
sortedStore = model.createTreeNode(sortedStore, { label: "002 - Survey", parentId: "root_001", idFactory: fixedIds("child_002") });
sortedStore = model.createTreeNode(sortedStore, { label: "000 - Notice", parentId: "root_001", idFactory: fixedIds("child_000") });
sortedStore = model.createTreeNode(sortedStore, { label: "001 - Order", parentId: "root_001", idFactory: fixedIds("child_001") });
assert.deepEqual(model.getChildren(sortedStore, null, "active").map((item) => item.id), ["root_000", "root_001", "root_002"]);
assert.deepEqual(model.getChildren(sortedStore, "root_001", "active").map((item) => item.id), ["child_000", "child_001", "child_002"]);

let duplicateStore = model.createEmptyTreeStore();
duplicateStore = model.createTreeNode(duplicateStore, { label: "Same", idFactory: fixedIds("same_b") });
duplicateStore = model.createTreeNode(duplicateStore, { label: "Same", idFactory: fixedIds("same_a") });
assert.deepEqual(model.getChildren(duplicateStore, null, "active").map((item) => item.id), ["same_b", "same_a"]);
duplicateStore.nodesById.same_b.order = 0;
duplicateStore.nodesById.same_a.order = 0;
assert.deepEqual(model.getChildren(duplicateStore, null, "active").map((item) => item.id), ["same_a", "same_b"]);

const renamed = model.renameTreeNode(store, "repair", "维修能力", "2026-08-22T00:03:00Z");
assert.equal(node(renamed, "repair").id, "repair");
assert.equal(node(renamed, "repair").label, "维修能力");
assert.throws(() => model.moveTreeNode(renamed, "root", "process"), /own branch/);

let assigned = model.reserveConceptStableId(renamed, "smcs_alpha", "2026-08-22T00:04:00Z");
assigned = model.assignConcept(assigned, "smcs_alpha", "process", "2026-08-22T00:05:00Z");
assigned = model.assignConcept(assigned, "smcs_alpha", "repair", "2026-08-22T00:06:00Z");
assert.equal(assigned.conceptAssignments.smcs_alpha, "repair");

const archived = model.archiveTreeSubtree(assigned, "repair", {
  batchId: "batch_1",
  now: "2026-08-22T00:07:00Z",
});
assert.equal(node(archived, "repair").lifecycle, "archived");
assert.equal(node(archived, "process").archiveBatchId, "batch_1");
assert.equal(archived.conceptAssignments.smcs_alpha, "repair");
assert.throws(() => model.assignConcept(archived, "smcs_alpha", "repair"), /active tree node/);

const restored = model.restoreTreeArchiveBatch(archived, "repair", "2026-08-22T00:08:00Z");
assert.equal(node(restored, "repair").lifecycle, "active");
assert.equal(node(restored, "process").lifecycle, "active");
assert.equal(restored.conceptAssignments.smcs_alpha, "repair");

let independentlyArchived = model.archiveTreeSubtree(restored, "process", {
  batchId: "batch_old",
  now: "2026-08-22T00:09:00Z",
});
independentlyArchived = model.archiveTreeSubtree(independentlyArchived, "repair", {
  batchId: "batch_new",
  now: "2026-08-22T00:10:00Z",
});
const parentRestored = model.restoreTreeArchiveBatch(independentlyArchived, "repair", "2026-08-22T00:11:00Z");
assert.equal(node(parentRestored, "repair").lifecycle, "active");
assert.equal(node(parentRestored, "process").lifecycle, "archived");
assert.equal(node(parentRestored, "process").archiveBatchId, "batch_old");

const imported = model.createEmptyTreeStore();
imported.reservedConceptStableIds = ["smcs_imported"];
const merged = model.mergeReservationAuthority(parentRestored, imported, ["smcs_active"]);
assert.deepEqual(new Set(merged.reservedConceptStableIds), new Set(["smcs_alpha", "smcs_imported", "smcs_active"]));

const rawConcept = {
  version: "1.0",
  customRoot: { keep: true },
  concepts: {
    "sm-old": { id: "sm-old", keyword: "原名称", parentId: null, custom: "keep" },
  },
};
const withStable = model.addStableIdToRawConceptRoot(rawConcept, "sm-old", "smcs_alpha");
assert.equal(withStable.concepts["sm-old"].stableId, "smcs_alpha");
assert.equal(withStable.concepts["sm-old"].custom, "keep");
assert.deepEqual(withStable.customRoot, { keep: true });
assert.equal(rawConcept.concepts["sm-old"].stableId, undefined);

let tx = model.createDeleteTransaction({
  conceptId: "sm-old",
  stableId: "smcs_alpha",
  txId: "tx_1",
  expectedTreeRevision: merged.revision,
  now: "2026-08-22T00:12:00Z",
});
tx = model.advanceDeleteTransaction(tx, "concept-deleted", { now: "2026-08-22T00:13:00Z" });
tx = model.advanceDeleteTransaction(tx, "tree-unassigned", { expectedTreeRevision: merged.revision + 1, now: "2026-08-22T00:14:00Z" });
tx = model.advanceDeleteTransaction(tx, "cleanup-pending", { now: "2026-08-22T00:15:00Z" });
assert.equal(tx.stage, "cleanup-pending");
assert.throws(() => model.advanceDeleteTransaction(tx, "prepared"), /cannot advance/);

const invalid = model.deepClone(store);
invalid.nodesById.root.parentId = "process";
const invalidResult = model.normalizeTreeStore(invalid);
assert.equal(invalidResult.readOnly, true);
assert.ok(invalidResult.errors.some((error) => error.startsWith("TREE_CYCLE")));

const futureResult = model.normalizeTreeStore({ schemaVersion: 99, futureNodes: ["opaque"] });
assert.equal(futureResult.readOnly, true);
assert.deepEqual(futureResult.errors, ["TREE_SCHEMA_FUTURE"]);
assert.deepEqual(futureResult.store, model.createEmptyTreeStore());

const malformedNodeResult = model.normalizeTreeStore({
  schemaVersion: 1,
  revision: 0,
  nodesById: { broken: {} },
  reservedTreeNodeIds: [],
  reservedConceptStableIds: [],
  conceptAssignments: {},
});
assert.equal(malformedNodeResult.readOnly, true);
assert.ok(malformedNodeResult.errors.includes("TREE_NODE_INVALID:broken"));

const validDeleteTx = model.normalizeTreeTransaction(model.createDeleteTransaction({
  conceptId: "sm-old",
  stableId: "smcs_alpha",
  txId: "tx_valid",
  expectedTreeRevision: 3,
}));
assert.equal(validDeleteTx.readOnly, false);
assert.equal(validDeleteTx.transaction.type, "concept-delete");
assert.equal(model.normalizeTreeTransaction({ schemaVersion: 1, txId: "bad", type: "import", stage: "unknown", expectedTreeRevision: 0 }).readOnly, true);
assert.ok(model.normalizeTreeTransaction({ schemaVersion: 1, txId: "missing-fingerprint", type: "import", stage: "prepared", expectedTreeRevision: 0 }).errors.includes("TX_IMPORT_SOURCE_FINGERPRINT_MISSING"));
assert.equal(model.normalizeTreeTransaction({ schemaVersion: 99, txId: "future", type: "import", stage: "prepared", expectedTreeRevision: 0 }).readOnly, true);

console.log("supermemo-concept-tree-model tests: PASS");
