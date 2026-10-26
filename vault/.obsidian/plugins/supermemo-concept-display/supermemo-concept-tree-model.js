"use strict";

const TREE_SCHEMA_VERSION = 1;
const TX_SCHEMA_VERSION = 1;

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)));
}

function nowIso(now) {
  return typeof now === "string" && now ? now : new Date().toISOString();
}

function createId(prefix = "smt") {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

function createEmptyTreeStore() {
  return {
    schemaVersion: TREE_SCHEMA_VERSION,
    revision: 0,
    nodesById: {},
    reservedTreeNodeIds: [],
    reservedConceptStableIds: [],
    conceptAssignments: {},
    updatedAt: null,
  };
}

function normalizeNode(raw, fallbackId) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || fallbackId || "").trim();
  const label = String(raw.label || "").trim();
  if (!id || !label) return null;
  return {
    id,
    label,
    ...(Object.prototype.hasOwnProperty.call(raw, "comment") ? { comment: raw.comment } : {}),
    parentId: raw.parentId ? String(raw.parentId) : null,
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    lifecycle: raw.lifecycle === "archived" ? "archived" : "active",
    archiveBatchId: raw.archiveBatchId ? String(raw.archiveBatchId) : null,
    createdAt: raw.createdAt ? String(raw.createdAt) : null,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
    archivedAt: raw.archivedAt ? String(raw.archivedAt) : null,
  };
}

function normalizeTreeStore(raw) {
  if (raw == null || raw === "") {
    return { store: createEmptyTreeStore(), readOnly: false, errors: [] };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { store: createEmptyTreeStore(), readOnly: true, errors: ["TREE_ROOT_INVALID"] };
  }
  const schemaVersion = Number(raw.schemaVersion || TREE_SCHEMA_VERSION);
  if (schemaVersion !== TREE_SCHEMA_VERSION) {
    return {
      store: createEmptyTreeStore(),
      readOnly: true,
      errors: [schemaVersion > TREE_SCHEMA_VERSION ? "TREE_SCHEMA_FUTURE" : "TREE_SCHEMA_UNSUPPORTED"],
    };
  }
  const normalizationErrors = [];
  const nodesById = {};
  const rawNodes = raw.nodesById && typeof raw.nodesById === "object" && !Array.isArray(raw.nodesById)
    ? raw.nodesById
    : null;
  if (!rawNodes) normalizationErrors.push("TREE_NODES_INVALID");
  Object.entries(rawNodes || {})
    .forEach(([id, value]) => {
      const node = normalizeNode(value, id);
      if (!node) {
        normalizationErrors.push(`TREE_NODE_INVALID:${id}`);
        return;
      }
      if (node.id !== id) {
        normalizationErrors.push(`TREE_NODE_ID_MISMATCH:${id}:${node.id}`);
        return;
      }
      if (nodesById[node.id]) {
        normalizationErrors.push(`TREE_NODE_ID_DUPLICATE:${node.id}`);
        return;
      }
      nodesById[node.id] = node;
    });
  const conceptAssignments = {};
  const rawAssignments = raw.conceptAssignments && typeof raw.conceptAssignments === "object" && !Array.isArray(raw.conceptAssignments)
    ? raw.conceptAssignments
    : null;
  if (!rawAssignments) normalizationErrors.push("TREE_ASSIGNMENTS_INVALID");
  Object.entries(rawAssignments || {})
    .forEach(([stableId, nodeId]) => {
      const normalizedStableId = String(stableId || "").trim();
      const normalizedNodeId = String(nodeId || "").trim();
      if (!normalizedStableId || !normalizedNodeId) {
        normalizationErrors.push(`TREE_ASSIGNMENT_INVALID:${stableId || "empty"}`);
        return;
      }
      conceptAssignments[normalizedStableId] = normalizedNodeId;
    });
  if (!Array.isArray(raw.reservedTreeNodeIds)) normalizationErrors.push("TREE_NODE_RESERVATIONS_INVALID");
  if (!Array.isArray(raw.reservedConceptStableIds)) normalizationErrors.push("TREE_CONCEPT_RESERVATIONS_INVALID");
  if (!Number.isFinite(Number(raw.revision)) || Number(raw.revision) < 0) normalizationErrors.push("TREE_REVISION_INVALID");
  const store = {
    schemaVersion: TREE_SCHEMA_VERSION,
    revision: Number.isFinite(Number(raw.revision)) ? Math.max(0, Number(raw.revision)) : 0,
    nodesById,
    reservedTreeNodeIds: uniqueStrings([...(raw.reservedTreeNodeIds || []), ...Object.keys(nodesById)]),
    reservedConceptStableIds: uniqueStrings([
      ...(raw.reservedConceptStableIds || []),
      ...Object.keys(conceptAssignments),
    ]),
    conceptAssignments,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
  };
  const errors = uniqueStrings([...normalizationErrors, ...validateTreeStore(store)]);
  return { store, readOnly: errors.length > 0, errors };
}

function validateTreeStore(store) {
  const errors = [];
  if (!store || typeof store !== "object" || Number(store.schemaVersion) !== TREE_SCHEMA_VERSION) {
    return ["TREE_SCHEMA_INVALID"];
  }
  const nodes = store.nodesById && typeof store.nodesById === "object" ? store.nodesById : {};
  const nodeIds = new Set(Object.keys(nodes));
  const reservedTree = new Set(uniqueStrings(store.reservedTreeNodeIds));
  const reservedConcept = new Set(uniqueStrings(store.reservedConceptStableIds));
  Object.entries(nodes).forEach(([id, node]) => {
    if (node && Object.prototype.hasOwnProperty.call(node, "comment") && typeof node.comment !== "string") errors.push(`TREE_COMMENT_INVALID:${id}`);
    if (!node || node.id !== id || !String(node.label || "").trim()) errors.push(`TREE_NODE_INVALID:${id}`);
    if (!reservedTree.has(id)) errors.push(`TREE_NODE_NOT_RESERVED:${id}`);
    if (node.parentId && !nodeIds.has(node.parentId)) errors.push(`TREE_PARENT_MISSING:${id}:${node.parentId}`);
    if (node.parentId === id) errors.push(`TREE_SELF_PARENT:${id}`);
    if (!['active', 'archived'].includes(node.lifecycle)) errors.push(`TREE_LIFECYCLE_INVALID:${id}`);
  });
  Object.keys(nodes).forEach((startId) => {
    const visited = new Set();
    let cursor = startId;
    while (cursor) {
      if (visited.has(cursor)) {
        errors.push(`TREE_CYCLE:${startId}`);
        break;
      }
      visited.add(cursor);
      cursor = nodes[cursor]?.parentId || null;
    }
  });
  Object.entries(store.conceptAssignments || {}).forEach(([stableId, nodeId]) => {
    if (!reservedConcept.has(stableId)) errors.push(`CONCEPT_ID_NOT_RESERVED:${stableId}`);
    if (!nodeIds.has(nodeId)) errors.push(`ASSIGNMENT_NODE_MISSING:${stableId}:${nodeId}`);
  });
  return uniqueStrings(errors);
}

function finalizeTreeMutation(candidate, baseRevision, now) {
  candidate.schemaVersion = TREE_SCHEMA_VERSION;
  candidate.revision = Number(baseRevision || 0) + 1;
  candidate.updatedAt = nowIso(now);
  candidate.reservedTreeNodeIds = uniqueStrings(candidate.reservedTreeNodeIds);
  candidate.reservedConceptStableIds = uniqueStrings(candidate.reservedConceptStableIds);
  const errors = validateTreeStore(candidate);
  if (errors.length) {
    const error = new Error(errors.join(", "));
    error.code = "TREE_VALIDATION_FAILED";
    error.details = errors;
    throw error;
  }
  return candidate;
}

function requireWritableStore(store) {
  const normalized = normalizeTreeStore(store);
  if (normalized.readOnly) {
    const error = new Error(normalized.errors.join(", ") || "Tree store is read-only");
    error.code = "TREE_READ_ONLY";
    error.details = normalized.errors;
    throw error;
  }
  return normalized.store;
}

function getChildren(store, parentId, lifecycle = null) {
  const normalizedParentId = parentId || null;
  return Object.values(store.nodesById || {})
    .filter((node) => (node.parentId || null) === normalizedParentId)
    .filter((node) => !lifecycle || node.lifecycle === lifecycle)
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: "base" })
      || (left.order - right.order)
      || left.id.localeCompare(right.id));
}

function collectDescendantIds(store, nodeId, includeSelf = false) {
  const result = includeSelf ? [nodeId] : [];
  const queue = [nodeId];
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    getChildren(store, current).forEach((child) => {
      result.push(child.id);
      queue.push(child.id);
    });
  }
  return result;
}

function createTreeNode(store, options = {}) {
  const current = requireWritableStore(store);
  const label = String(options.label || "").trim();
  if (!label) throw Object.assign(new Error("Tree node label is required"), { code: "TREE_LABEL_REQUIRED" });
  const parentId = options.parentId ? String(options.parentId) : null;
  if (parentId && (!current.nodesById[parentId] || current.nodesById[parentId].lifecycle !== "active")) {
    throw Object.assign(new Error("Active parent node was not found"), { code: "TREE_PARENT_UNAVAILABLE" });
  }
  const id = String(options.id || (options.idFactory || createId)("smtn")).trim();
  if (!id || current.nodesById[id] || current.reservedTreeNodeIds.includes(id)) {
    throw Object.assign(new Error("Tree node id is already reserved"), { code: "TREE_ID_RESERVED" });
  }
  const candidate = deepClone(current);
  const timestamp = nowIso(options.now);
  candidate.nodesById[id] = {
    id,
    label,
    parentId,
    order: getChildren(candidate, parentId, "active").length,
    lifecycle: "active",
    archiveBatchId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
  };
  candidate.reservedTreeNodeIds.push(id);
  return finalizeTreeMutation(candidate, current.revision, timestamp);
}

function renameTreeNode(store, nodeId, label, now) {
  const current = requireWritableStore(store);
  const node = current.nodesById[nodeId];
  const nextLabel = String(label || "").trim();
  if (!node) throw Object.assign(new Error("Tree node was not found"), { code: "TREE_NODE_MISSING" });
  if (!nextLabel) throw Object.assign(new Error("Tree node label is required"), { code: "TREE_LABEL_REQUIRED" });
  const candidate = deepClone(current);
  candidate.nodesById[nodeId].label = nextLabel;
  candidate.nodesById[nodeId].updatedAt = nowIso(now);
  return finalizeTreeMutation(candidate, current.revision, now);
}

function moveTreeNode(store, nodeId, nextParentId, now) {
  const current = requireWritableStore(store);
  const node = current.nodesById[nodeId];
  const parentId = nextParentId ? String(nextParentId) : null;
  if (!node || node.lifecycle !== "active") throw Object.assign(new Error("Active tree node was not found"), { code: "TREE_NODE_UNAVAILABLE" });
  if (parentId && (!current.nodesById[parentId] || current.nodesById[parentId].lifecycle !== "active")) {
    throw Object.assign(new Error("Active parent node was not found"), { code: "TREE_PARENT_UNAVAILABLE" });
  }
  if (parentId === nodeId || collectDescendantIds(current, nodeId, false).includes(parentId)) {
    throw Object.assign(new Error("Tree node cannot move into its own branch"), { code: "TREE_MOVE_CYCLE" });
  }
  const candidate = deepClone(current);
  candidate.nodesById[nodeId].parentId = parentId;
  candidate.nodesById[nodeId].order = getChildren(candidate, parentId, "active").filter((item) => item.id !== nodeId).length;
  candidate.nodesById[nodeId].updatedAt = nowIso(now);
  return finalizeTreeMutation(candidate, current.revision, now);
}

function archiveTreeSubtree(store, nodeId, options = {}) {
  const current = requireWritableStore(store);
  const node = current.nodesById[nodeId];
  if (!node || node.lifecycle !== "active") throw Object.assign(new Error("Active tree node was not found"), { code: "TREE_NODE_UNAVAILABLE" });
  const batchId = String(options.batchId || (options.idFactory || createId)("smta")).trim();
  const candidate = deepClone(current);
  const timestamp = nowIso(options.now);
  collectDescendantIds(current, nodeId, true).forEach((id) => {
    if (candidate.nodesById[id]?.lifecycle !== "active") return;
    candidate.nodesById[id].lifecycle = "archived";
    candidate.nodesById[id].archiveBatchId = batchId;
    candidate.nodesById[id].archivedAt = timestamp;
    candidate.nodesById[id].updatedAt = timestamp;
  });
  return finalizeTreeMutation(candidate, current.revision, timestamp);
}

function restoreTreeArchiveBatch(store, nodeId, now) {
  const current = requireWritableStore(store);
  const node = current.nodesById[nodeId];
  if (!node || node.lifecycle !== "archived" || !node.archiveBatchId) {
    throw Object.assign(new Error("Archived tree node was not found"), { code: "TREE_ARCHIVE_MISSING" });
  }
  const parent = node.parentId ? current.nodesById[node.parentId] : null;
  if (parent && parent.lifecycle !== "active") {
    throw Object.assign(new Error("Restore the archived parent branch first"), { code: "TREE_PARENT_ARCHIVED" });
  }
  const batchId = node.archiveBatchId;
  const candidate = deepClone(current);
  const timestamp = nowIso(now);
  collectDescendantIds(current, nodeId, true).forEach((id) => {
    const target = candidate.nodesById[id];
    if (!target || target.lifecycle !== "archived" || target.archiveBatchId !== batchId) return;
    target.lifecycle = "active";
    target.archiveBatchId = null;
    target.archivedAt = null;
    target.updatedAt = timestamp;
  });
  return finalizeTreeMutation(candidate, current.revision, timestamp);
}

function reserveConceptStableId(store, stableId, now) {
  const current = requireWritableStore(store);
  const id = String(stableId || "").trim();
  if (!id) throw Object.assign(new Error("Concept stable id is required"), { code: "CONCEPT_STABLE_ID_REQUIRED" });
  if (current.reservedConceptStableIds.includes(id)) return current;
  const candidate = deepClone(current);
  candidate.reservedConceptStableIds.push(id);
  return finalizeTreeMutation(candidate, current.revision, now);
}

function assignConcept(store, stableId, nodeId, now) {
  const current = requireWritableStore(store);
  const conceptId = String(stableId || "").trim();
  const targetNode = current.nodesById[nodeId];
  if (!conceptId || !current.reservedConceptStableIds.includes(conceptId)) {
    throw Object.assign(new Error("Concept stable id is not reserved"), { code: "CONCEPT_STABLE_ID_UNRESERVED" });
  }
  if (!targetNode || targetNode.lifecycle !== "active") {
    throw Object.assign(new Error("Concept assignment requires an active tree node"), { code: "ASSIGNMENT_NODE_UNAVAILABLE" });
  }
  const candidate = deepClone(current);
  candidate.conceptAssignments[conceptId] = nodeId;
  return finalizeTreeMutation(candidate, current.revision, now);
}

function unassignConcept(store, stableId, now) {
  const current = requireWritableStore(store);
  const conceptId = String(stableId || "").trim();
  if (!Object.prototype.hasOwnProperty.call(current.conceptAssignments, conceptId)) return current;
  const candidate = deepClone(current);
  delete candidate.conceptAssignments[conceptId];
  return finalizeTreeMutation(candidate, current.revision, now);
}

function mergeReservationAuthority(existingStore, importedStore, activeStableIds = []) {
  const existing = requireWritableStore(existingStore);
  const importedNormalized = normalizeTreeStore(importedStore);
  if (importedNormalized.readOnly) {
    throw Object.assign(new Error(importedNormalized.errors.join(", ")), { code: "TREE_IMPORT_INVALID" });
  }
  const candidate = deepClone(importedNormalized.store);
  candidate.reservedTreeNodeIds = uniqueStrings([
    ...existing.reservedTreeNodeIds,
    ...candidate.reservedTreeNodeIds,
    ...Object.keys(candidate.nodesById),
  ]);
  candidate.reservedConceptStableIds = uniqueStrings([
    ...existing.reservedConceptStableIds,
    ...candidate.reservedConceptStableIds,
    ...Object.keys(candidate.conceptAssignments),
    ...activeStableIds,
  ]);
  return finalizeTreeMutation(candidate, existing.revision, candidate.updatedAt || nowIso());
}

function addStableIdToRawConceptRoot(rawRoot, conceptId, stableId) {
  if (!rawRoot || typeof rawRoot !== "object" || Array.isArray(rawRoot)) {
    throw Object.assign(new Error("Shared Concept root is invalid"), { code: "CONCEPT_ROOT_INVALID" });
  }
  if (!rawRoot.concepts || typeof rawRoot.concepts !== "object" || Array.isArray(rawRoot.concepts)) {
    throw Object.assign(new Error("Shared Concept map is invalid"), { code: "CONCEPT_MAP_INVALID" });
  }
  const target = rawRoot.concepts[conceptId];
  if (!target || typeof target !== "object") {
    throw Object.assign(new Error("Concept was not found"), { code: "CONCEPT_MISSING" });
  }
  const id = String(stableId || "").trim();
  if (!id) throw Object.assign(new Error("Concept stable id is required"), { code: "CONCEPT_STABLE_ID_REQUIRED" });
  const duplicate = Object.entries(rawRoot.concepts).find(([otherId, concept]) => otherId !== conceptId && concept?.stableId === id);
  if (duplicate) throw Object.assign(new Error("Concept stable id is already used"), { code: "CONCEPT_STABLE_ID_DUPLICATE" });
  const candidate = deepClone(rawRoot);
  candidate.concepts[conceptId].stableId = id;
  return candidate;
}

function createDeleteTransaction(options = {}) {
  const conceptId = String(options.conceptId || "").trim();
  const stableId = String(options.stableId || "").trim();
  if (!conceptId || !stableId) throw Object.assign(new Error("Delete transaction identity is incomplete"), { code: "TX_IDENTITY_INVALID" });
  return {
    schemaVersion: TX_SCHEMA_VERSION,
    txId: String(options.txId || (options.idFactory || createId)("smttx")),
    type: "concept-delete",
    stage: "prepared",
    conceptId,
    stableId,
    expectedTreeRevision: Number(options.expectedTreeRevision || 0),
    createdAt: nowIso(options.now),
    updatedAt: nowIso(options.now),
    lastError: null,
  };
}

function advanceDeleteTransaction(transaction, stage, options = {}) {
  const allowed = {
    prepared: ["concept-deleted"],
    "concept-deleted": ["tree-unassigned"],
    "tree-unassigned": ["cleanup-pending"],
    "cleanup-pending": [],
  };
  if (!transaction || transaction.type !== "concept-delete" || !allowed[transaction.stage]) {
    throw Object.assign(new Error("Delete transaction is invalid"), { code: "TX_INVALID" });
  }
  if (!allowed[transaction.stage].includes(stage)) {
    throw Object.assign(new Error(`Delete transaction cannot advance from ${transaction.stage} to ${stage}`), { code: "TX_STAGE_INVALID" });
  }
  return {
    ...deepClone(transaction),
    stage,
    expectedTreeRevision: options.expectedTreeRevision == null
      ? transaction.expectedTreeRevision
      : Number(options.expectedTreeRevision),
    updatedAt: nowIso(options.now),
    lastError: options.lastError ? String(options.lastError) : null,
  };
}

function normalizeTreeTransaction(raw) {
  if (raw == null || raw === "") return { transaction: null, readOnly: false, errors: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { transaction: null, readOnly: true, errors: ["TX_ROOT_INVALID"] };
  }
  const errors = [];
  if (Number(raw.schemaVersion) !== TX_SCHEMA_VERSION) {
    errors.push(Number(raw.schemaVersion) > TX_SCHEMA_VERSION ? "TX_SCHEMA_FUTURE" : "TX_SCHEMA_UNSUPPORTED");
  }
  const txId = String(raw.txId || "").trim();
  const type = String(raw.type || "").trim();
  const stage = String(raw.stage || "").trim();
  if (!txId) errors.push("TX_ID_MISSING");
  if (!type) errors.push("TX_TYPE_MISSING");
  if (!stage) errors.push("TX_STAGE_MISSING");
  if (type === "concept-delete") {
    if (!["prepared", "concept-deleted", "tree-unassigned", "cleanup-pending"].includes(stage)) {
      errors.push(`TX_DELETE_STAGE_INVALID:${stage || "empty"}`);
    }
    if (!String(raw.conceptId || "").trim()) errors.push("TX_CONCEPT_ID_MISSING");
    if (!String(raw.stableId || "").trim()) errors.push("TX_STABLE_ID_MISSING");
  } else if (type === "import") {
    if (!["prepared", "concept-written", "tree-written", "retry-required"].includes(stage)) {
      errors.push(`TX_IMPORT_STAGE_INVALID:${stage || "empty"}`);
    }
    if (!Number.isFinite(Number(raw.expectedTreeRevision)) || Number(raw.expectedTreeRevision) < 0) {
      errors.push("TX_TREE_REVISION_INVALID");
    }
    if (!String(raw.sourceFingerprint || "").trim()) errors.push("TX_IMPORT_SOURCE_FINGERPRINT_MISSING");
  } else if (type) {
    errors.push(`TX_TYPE_UNSUPPORTED:${type}`);
  }
  return {
    transaction: errors.length ? null : deepClone(raw),
    readOnly: errors.length > 0,
    errors: uniqueStrings(errors),
  };
}

module.exports = {
  TREE_SCHEMA_VERSION,
  TX_SCHEMA_VERSION,
  deepClone,
  createId,
  createEmptyTreeStore,
  normalizeTreeStore,
  validateTreeStore,
  getChildren,
  collectDescendantIds,
  createTreeNode,
  renameTreeNode,
  moveTreeNode,
  archiveTreeSubtree,
  restoreTreeArchiveBatch,
  reserveConceptStableId,
  assignConcept,
  unassignConcept,
  mergeReservationAuthority,
  addStableIdToRawConceptRoot,
  createDeleteTransaction,
  advanceDeleteTransaction,
  normalizeTreeTransaction,
};
