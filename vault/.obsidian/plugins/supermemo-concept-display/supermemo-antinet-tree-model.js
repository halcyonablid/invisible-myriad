"use strict";

const SCHEMA_VERSION = 2;

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value == null ? "" : value).trim();
}

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map(text)
    .filter(Boolean)));
}

function createId(prefix = "sma") {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function createEmptyAntinetStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    nodesById: {},
    reservedNodeIds: [],
    mountPresentationByRelationId: {},
    updatedAt: null,
  };
}

function normalizeNode(raw, fallbackId) {
  if (!raw || typeof raw !== "object") return null;
  const id = text(raw.id || fallbackId);
  const label = text(raw.label);
  if (!id || !label) return null;
  return {
    id,
    label,
    ...(Object.prototype.hasOwnProperty.call(raw, "comment") ? { comment: raw.comment } : {}),
    parentId: text(raw.parentId) || null,
    ...(Object.prototype.hasOwnProperty.call(raw, "drawerAnchor") ? { drawerAnchor: deepClone(raw.drawerAnchor) } : {}),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    lifecycle: raw.lifecycle === "archived" ? "archived" : "active",
    createdAt: text(raw.createdAt) || null,
    updatedAt: text(raw.updatedAt) || null,
    archivedAt: text(raw.archivedAt) || null,
  };
}

function normalizePresentation(raw, fallbackRelationId) {
  if (!raw || typeof raw !== "object") return null;
  const relationId = text(raw.relationId || fallbackRelationId);
  if (!relationId) return null;
  return {
    relationId,
    alias: text(raw.alias),
    lastKnownLabel: text(raw.lastKnownLabel),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    updatedAt: text(raw.updatedAt) || null,
  };
}

function validateAntinetStore(store) {
  const errors = [];
  if (!store || typeof store !== "object" || Number(store.schemaVersion) !== SCHEMA_VERSION) {
    return ["ANTINET_SCHEMA_INVALID"];
  }
  const nodes = store.nodesById && typeof store.nodesById === "object" ? store.nodesById : {};
  const nodeIds = new Set(Object.keys(nodes));
  const reservations = new Set(uniqueStrings(store.reservedNodeIds));
  Object.entries(nodes).forEach(([id, node]) => {
    if (node && Object.prototype.hasOwnProperty.call(node, "comment") && typeof node.comment !== "string") errors.push(`ANTINET_COMMENT_INVALID:${id}`);
    if (!node || node.id !== id || !text(node.label)) errors.push(`ANTINET_NODE_INVALID:${id}`);
    if (!reservations.has(id)) errors.push(`ANTINET_NODE_NOT_RESERVED:${id}`);
    if (node.parentId && !nodeIds.has(node.parentId)) errors.push(`ANTINET_PARENT_MISSING:${id}:${node.parentId}`);
    if (node.parentId === id) errors.push(`ANTINET_SELF_PARENT:${id}`);
    if (Object.prototype.hasOwnProperty.call(node, "drawerAnchor")) {
      const a = node.drawerAnchor;
      if (!a || typeof a !== "object" || Array.isArray(a) || !node.parentId
          || ![a.relationId, a.sourceNodeKey, a.lastKnownLabel].every(v => typeof v === "string" && v.trim())) {
        errors.push(`ANTINET_ANCHOR_INVALID:${id}`);
      }
    }
    if (!['active', 'archived'].includes(node.lifecycle)) errors.push(`ANTINET_LIFECYCLE_INVALID:${id}`);
  });
  Object.keys(nodes).forEach((startId) => {
    const seen = new Set();
    let cursor = startId;
    while (cursor) {
      if (seen.has(cursor)) {
        errors.push(`ANTINET_CYCLE:${startId}`);
        break;
      }
      seen.add(cursor);
      cursor = nodes[cursor]?.parentId || null;
    }
  });
  Object.entries(store.mountPresentationByRelationId || {}).forEach(([relationId, presentation]) => {
    if (!normalizePresentation(presentation, relationId)) errors.push(`ANTINET_PRESENTATION_INVALID:${relationId}`);
  });
  return Array.from(new Set(errors));
}

function normalizeAntinetStore(raw) {
  if (raw == null || raw === "") return { store: createEmptyAntinetStore(), readOnly: false, errors: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { store: createEmptyAntinetStore(), readOnly: true, errors: ["ANTINET_ROOT_INVALID"] };
  }
  const version = Number(raw.schemaVersion || SCHEMA_VERSION);
  if (version !== 1 && version !== SCHEMA_VERSION) {
    return {
      store: createEmptyAntinetStore(),
      readOnly: true,
      errors: [version > SCHEMA_VERSION ? "ANTINET_SCHEMA_FUTURE" : "ANTINET_SCHEMA_UNSUPPORTED"],
    };
  }
  const errors = [];
  if (version === 1 && Object.values(raw.nodesById || {}).some(n => n && Object.hasOwn(n, "drawerAnchor"))) errors.push("ANTINET_ANCHOR_VERSION_INVALID");
  const nodesById = {};
  if (!raw.nodesById || typeof raw.nodesById !== "object" || Array.isArray(raw.nodesById)) errors.push("ANTINET_NODES_INVALID");
  Object.entries(raw.nodesById || {}).forEach(([id, value]) => {
    const node = normalizeNode(value, id);
    if (!node) errors.push(`ANTINET_NODE_INVALID:${id}`);
    else if (node.id !== id) errors.push(`ANTINET_NODE_ID_MISMATCH:${id}:${node.id}`);
    else nodesById[id] = node;
  });
  const mountPresentationByRelationId = {};
  if (raw.mountPresentationByRelationId != null
      && (typeof raw.mountPresentationByRelationId !== "object" || Array.isArray(raw.mountPresentationByRelationId))) {
    errors.push("ANTINET_PRESENTATIONS_INVALID");
  }
  Object.entries(raw.mountPresentationByRelationId || {}).forEach(([relationId, value]) => {
    const presentation = normalizePresentation(value, relationId);
    if (!presentation) errors.push(`ANTINET_PRESENTATION_INVALID:${relationId}`);
    else mountPresentationByRelationId[relationId] = presentation;
  });
  const store = {
    schemaVersion: SCHEMA_VERSION,
    revision: Number.isFinite(Number(raw.revision)) && Number(raw.revision) >= 0 ? Number(raw.revision) : 0,
    nodesById,
    reservedNodeIds: uniqueStrings([...(raw.reservedNodeIds || []), ...Object.keys(nodesById)]),
    mountPresentationByRelationId,
    updatedAt: text(raw.updatedAt) || null,
  };
  const validationErrors = Array.from(new Set([...errors, ...validateAntinetStore(store)]));
  return { store, readOnly: validationErrors.length > 0, errors: validationErrors };
}

function requireWritable(store) {
  const normalized = normalizeAntinetStore(store);
  if (normalized.readOnly) {
    const error = new Error(normalized.errors.join(", ") || "Antinet store is read-only");
    error.code = "ANTINET_STORE_READ_ONLY";
    error.details = normalized.errors;
    throw error;
  }
  return normalized.store;
}

function finalize(candidate, baseRevision) {
  candidate.schemaVersion = SCHEMA_VERSION;
  candidate.revision = Number(baseRevision || 0) + 1;
  candidate.updatedAt = new Date().toISOString();
  candidate.reservedNodeIds = uniqueStrings(candidate.reservedNodeIds);
  const errors = validateAntinetStore(candidate);
  if (errors.length) {
    const error = new Error(errors.join(", "));
    error.code = "ANTINET_VALIDATION_FAILED";
    error.details = errors;
    throw error;
  }
  return candidate;
}

function getChildren(store, parentId, lifecycle = null) {
  const parent = parentId || null;
  return Object.values(store.nodesById || {})
    .filter((node) => (node.parentId || null) === parent)
    .filter((node) => !lifecycle || node.lifecycle === lifecycle)
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: "base" })
      || left.order - right.order
      || left.id.localeCompare(right.id));
}

function collectDescendantIds(store, nodeId, includeSelf = false) {
  const result = includeSelf ? [nodeId] : [];
  const queue = [nodeId];
  const seen = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    getChildren(store, current).forEach((child) => {
      result.push(child.id);
      queue.push(child.id);
    });
  }
  return result;
}

function createNode(store, options = {}) {
  const current = requireWritable(store);
  const label = text(options.label);
  if (!label) throw Object.assign(new Error("Antinet 节点名称不能为空"), { code: "ANTINET_LABEL_REQUIRED" });
  const parentId = text(options.parentId) || null;
  if (parentId && (!current.nodesById[parentId] || current.nodesById[parentId].lifecycle !== "active")) {
    throw Object.assign(new Error("Antinet 父节点不可用"), { code: "ANTINET_PARENT_UNAVAILABLE" });
  }
  const id = text(options.id) || createId("sman");
  if (current.nodesById[id] || current.reservedNodeIds.includes(id)) {
    throw Object.assign(new Error("Antinet 节点 ID 已存在"), { code: "ANTINET_NODE_ID_CONFLICT" });
  }
  current.nodesById[id] = {
    id,
    label,
    parentId,
    ...(options.drawerAnchor ? { drawerAnchor: deepClone(options.drawerAnchor) } : {}),
    order: getChildren(current, parentId).length,
    lifecycle: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null,
  };
  current.reservedNodeIds.push(id);
  return finalize(current, store.revision);
}

function renameNode(store, nodeId, label) {
  const current = requireWritable(store);
  const node = current.nodesById[text(nodeId)];
  const nextLabel = text(label);
  if (!node) throw Object.assign(new Error("Antinet 节点不存在"), { code: "ANTINET_NODE_NOT_FOUND" });
  if (!nextLabel) throw Object.assign(new Error("Antinet 节点名称不能为空"), { code: "ANTINET_LABEL_REQUIRED" });
  node.label = nextLabel;
  node.updatedAt = new Date().toISOString();
  return finalize(current, store.revision);
}

function moveNode(store, nodeId, parentId) {
  const current = requireWritable(store);
  const node = current.nodesById[text(nodeId)];
  const nextParentId = text(parentId) || null;
  if (!node) throw Object.assign(new Error("Antinet 节点不存在"), { code: "ANTINET_NODE_NOT_FOUND" });
  if (node.lifecycle !== "active") throw Object.assign(new Error("归档节点不能移动"), { code: "ANTINET_NODE_INACTIVE" });
  if (nextParentId && (!current.nodesById[nextParentId] || current.nodesById[nextParentId].lifecycle !== "active")) {
    throw Object.assign(new Error("Antinet 父节点不可用"), { code: "ANTINET_PARENT_UNAVAILABLE" });
  }
  if (nextParentId && collectDescendantIds(current, node.id, true).includes(nextParentId)) {
    throw Object.assign(new Error("不能把节点移动到自己的子树中"), { code: "ANTINET_MOVE_CYCLE" });
  }
  node.parentId = nextParentId;
  delete node.drawerAnchor;
  node.order = getChildren(current, nextParentId).length;
  node.updatedAt = new Date().toISOString();
  return finalize(current, store.revision);
}

function archiveSubtree(store, nodeId) {
  const current = requireWritable(store);
  const ids = collectDescendantIds(current, text(nodeId), true);
  if (!ids.length || !current.nodesById[text(nodeId)]) throw Object.assign(new Error("Antinet 节点不存在"), { code: "ANTINET_NODE_NOT_FOUND" });
  const archivedAt = new Date().toISOString();
  ids.forEach((id) => {
    current.nodesById[id].lifecycle = "archived";
    current.nodesById[id].archivedAt = archivedAt;
    current.nodesById[id].updatedAt = archivedAt;
  });
  return finalize(current, store.revision);
}

function setMountPresentation(store, relationId, patch = {}) {
  const current = requireWritable(store);
  const id = text(relationId);
  if (!id) throw Object.assign(new Error("挂载关系 ID 不能为空"), { code: "ANTINET_RELATION_ID_REQUIRED" });
  const previous = current.mountPresentationByRelationId[id] || { relationId: id, alias: "", order: 0, updatedAt: null };
  current.mountPresentationByRelationId[id] = {
    relationId: id,
    alias: text(patch.alias == null ? previous.alias : patch.alias),
    lastKnownLabel: text(patch.lastKnownLabel == null ? previous.lastKnownLabel : patch.lastKnownLabel),
    order: Number.isFinite(Number(patch.order == null ? previous.order : patch.order)) ? Number(patch.order == null ? previous.order : patch.order) : 0,
    updatedAt: new Date().toISOString(),
  };
  return finalize(current, store.revision);
}

function setMountPresentations(store, patches = []) {
  const current = requireWritable(store);
  (Array.isArray(patches) ? patches : []).forEach(item => {
    const id = text(item?.relationId);
    if (!id) return;
    const previous = current.mountPresentationByRelationId[id] || { relationId: id, alias: "", lastKnownLabel: "", order: 0, updatedAt: null };
    current.mountPresentationByRelationId[id] = {
      relationId: id,
      alias: text(item?.alias == null ? previous.alias : item.alias),
      lastKnownLabel: text(item?.lastKnownLabel == null ? previous.lastKnownLabel : item.lastKnownLabel),
      order: Number.isFinite(Number(item?.order == null ? previous.order : item.order)) ? Number(item?.order == null ? previous.order : item.order) : 0,
      updatedAt: new Date().toISOString(),
    };
  });
  return finalize(current, store.revision);
}

function removeMountPresentation(store, relationId) {
  const current = requireWritable(store);
  delete current.mountPresentationByRelationId[text(relationId)];
  return finalize(current, store.revision);
}

// Projection is a read model. Its IDs must never enter nodesById or EVA.
function composeDrawerTree(store, mountsForNode, snapshotForMount, options = {}) {
  const nodes = Object.create(null), children = Object.create(null), roots = [], warnings = [];
  const maxNodes = options.maxNodes || 2000;
  let projectedCount = 0;
  let mountedSources = 0;
  const ownedByParent = new Map();
  for (const node of Object.values(store.nodesById || {})) {
    if (node.lifecycle !== 'active') continue;
    const parent = node.parentId || null;
    if (!ownedByParent.has(parent)) ownedByParent.set(parent, []);
    ownedByParent.get(parent).push(node);
  }
  for (const siblings of ownedByParent.values()) siblings.sort((a,b) => a.label.localeCompare(b.label, undefined, {numeric:true,sensitivity:'base'}) || a.order-b.order || a.id.localeCompare(b.id));
  let totalNodes = 0;
  const add = (node, parentId) => {
    totalNodes++;
    nodes[node.id] = { ...node, viewParentId: parentId };
    children[node.id] = [];
    if (parentId) children[parentId].push(node.id); else roots.push(node.id);
    return nodes[node.id];
  };
  const key = (...parts) => `projection:${JSON.stringify(parts)}`;
  const manual = (node, parentId, ancestors, depth) => {
    if (nodes[node.id]) return;
    const view = add({ ...node, kind: "manual" }, parentId);
    const owned = ownedByParent.get(node.id) || [];
    const attached = owned.filter(n => n.drawerAnchor);
    const placed = new Set();
    const mounts = mountsForNode(node.id) || [];
    view.mounts = mounts;
    for (const mount of mounts) {
      let snap;
      if (totalNodes >= maxNodes || ++mountedSources > 64 || depth > 48) {
        snap = { status: "budget", complete: false, nodes: [] };
        warnings.push("本次抽屉加载预算已用完，持久手动节点仍保留");
      } else {
        try { snap = snapshotForMount(mount, { maxNodes: Math.max(1, maxNodes - totalNodes) }); } catch (_) { snap = { status: "unavailable", complete: false, nodes: [] }; }
      }
      snap ||= { status: "unavailable", complete: false, nodes: [] };
      const groupNeeded = mounts.length > 1 || snap.status !== "ready" || !snap.complete || ancestors.has(mount.targetNodeKey);
      let parent = node.id;
      if (groupNeeded) {
        parent = key(node.id, mount.relationId, "mount");
        add({ id: parent, label: mount.label, kind: "mount", targetNodeKey: mount.targetNodeKey,
          status: ancestors.has(mount.targetNodeKey) ? "cycle" : snap.status, complete: snap.complete }, node.id);
      }
      if (ancestors.has(mount.targetNodeKey)) { warnings.push("已停止重复来源展开"); continue; }
      if (snap.status !== "ready" || !snap.complete) warnings.push("部分来源未完整加载，手动分支保留在待恢复入口");
      if (snap.status !== "ready") continue;
      const sourceChildren = new Map();
      for (const source of snap.nodes || []) {
        const list = sourceChildren.get(source.parentNodeKey) || [];
        list.push(source); sourceChildren.set(source.parentNodeKey, list);
      }
      const branchAncestors = new Set(ancestors).add(mount.targetNodeKey);
      const project = (source, parent, chain, level) => {
        if (++projectedCount > maxNodes || totalNodes >= maxNodes || level > 48) { warnings.push("抽屉展示已到本次加载上限"); return; }
        const id = key(node.id, mount.relationId, source.nodeKey);
        if (nodes[id]) return;
        const cycle = chain.has(source.nodeKey);
        const projected = add({ id, kind: "drawer", label: source.label, sourceKind: source.kind,
          ownerNodeId: node.id, relationId: mount.relationId, targetNodeKey: source.nodeKey,
          stableIdentity: snap.stableIdentity === true && source.stableIdentity !== false,
          status: cycle ? "cycle" : "ready", type: source.type }, parent);
        if (cycle) { warnings.push("已停止重复来源展开"); return; }
        const next = new Set(chain).add(source.nodeKey);
        for (const child of sourceChildren.get(source.nodeKey) || []) project(child, id, next, level + 1);
        for (const child of attached) {
          if (projected.stableIdentity && child.drawerAnchor.relationId === mount.relationId && child.drawerAnchor.sourceNodeKey === source.nodeKey) {
            placed.add(child.id); manual(child, projected.id, next, level + 1);
          }
        }
      };
      for (const source of sourceChildren.get(snap.rootNodeKey || mount.targetNodeKey) || []) project(source, parent, branchAncestors, depth + 1);
    }
    const missing = attached.filter(n => !placed.has(n.id));
    if (missing.length) {
      const orphanId = key(node.id, "unresolved");
      add({ id: orphanId, kind: "unresolved", label: "待恢复的抽屉分支", status: "unavailable" }, node.id);
      for (const child of missing) manual(child, orphanId, ancestors, depth + 1);
    }
    for (const child of owned.filter(n => !n.drawerAnchor)) manual(child, node.id, ancestors, depth + 1);
  };
  for (const root of ownedByParent.get(null) || []) manual(root, null, new Set(), 0);
  return { nodes, children, roots, warnings: [...new Set(warnings)] };
}

function attachNodeToDrawer(store, nodeId, projection) {
  if (projection?.kind !== "drawer" || !projection.stableIdentity || projection.status !== "ready") {
    throw new Error("抽屉永久身份尚不可用，请先在 Keyword Index 完成身份绑定");
  }
  const current = moveNode(store, nodeId, projection.ownerNodeId);
  current.nodesById[nodeId].drawerAnchor = {
    relationId: projection.relationId, sourceNodeKey: projection.targetNodeKey, lastKnownLabel: projection.label,
  };
  const errors = validateAntinetStore(current);
  if (errors.length) throw new Error(errors.join(", "));
  return current;
}

module.exports = {
  composeDrawerTree,
  attachNodeToDrawer,
  SCHEMA_VERSION,
  deepClone,
  createId,
  createEmptyAntinetStore,
  normalizeAntinetStore,
  validateAntinetStore,
  getChildren,
  collectDescendantIds,
  createNode,
  renameNode,
  moveNode,
  archiveSubtree,
  setMountPresentation,
  setMountPresentations,
  removeMountPresentation,
};
