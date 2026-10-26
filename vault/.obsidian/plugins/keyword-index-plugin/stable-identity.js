"use strict";

// Content identity, not a path cache. All functions are pure except UUID allocation.
const { randomUUID } = require("crypto");
const VIEW = "keyword-index-plugin";
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const copy = (value) => JSON.parse(JSON.stringify(value));
const fail = (message) => { throw new Error(`KEYWORD_IDENTITY: ${message}`); };
const safe = (value) => typeof value === "string" && value.length > 0 && !["__proto__", "constructor", "prototype"].includes(value);
const lookupCache = new WeakMap();

function nodeKey(indexPath, scopeType, keywordId, itemId) {
  return `jump:v1:${[VIEW, indexPath, scopeType, keywordId, itemId].map(encodeURIComponent).join("|")}`;
}

function parseKey(key) {
  try {
    if (typeof key !== "string" || !key.startsWith("jump:v1:")) return null;
    const parts = key.slice(8).split("|").map(decodeURIComponent);
    if (parts.length !== 5 || parts[0] !== VIEW || parts.some((part) => !part)) return null;
    const [, indexPath, scopeType, keywordId, itemId] = parts;
    if (scopeType === "keyword" && itemId === "capsule") return { kind: "keyword", keywordId, indexPath, type: "", scope: "", pathParts: [] };
    if (scopeType !== "keyword-drawer") return null;
    const [type, scope, ...pathParts] = itemId.split("/").map(decodeURIComponent);
    const descriptor = { kind: "drawer", keywordId, indexPath, type, scope, pathParts };
    validateDescriptor(descriptor);
    return descriptor;
  } catch (_) { return null; }
}

function validateDescriptor(d) {
  if (!d || !safe(d.keywordId) || !["keyword", "drawer"].includes(d.kind)) fail("invalid descriptor");
  if (!Array.isArray(d.pathParts) || d.pathParts.some((part) => typeof part !== "string" || !part.trim())) fail("invalid path");
  if (d.kind === "keyword") {
    if (d.type || d.scope || d.pathParts.length) fail("capsule descriptor has drawer fields");
  } else if (!["yaml", "plus", "dot"].includes(d.type) || !["branch", "root-notes"].includes(d.scope) || (d.scope === "branch" && !d.pathParts.length)) fail("invalid drawer role");
}

function descriptorKey(d) {
  validateDescriptor(d);
  return JSON.stringify([d.kind, d.keywordId, d.type, d.scope, d.pathParts]);
}

function allocate(prefix, reserved, uuid = randomUUID) {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const value = uuid();
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) fail("UUID provider invalid");
    const id = `${prefix}${value}`;
    if (!reserved.has(id)) { reserved.add(id); return id; }
  }
  fail("UUID collision retry limit");
}

function validate(registry) {
  if (!registry || registry.schema !== 1 || !Number.isSafeInteger(registry.revision) || registry.revision < 1 || !Array.isArray(registry.nodes)) fail("unsupported/corrupt registry (read-only)");
  const ids = new Set(), keys = new Set(), activeDescriptors = new Set();
  for (const record of registry.nodes) {
    const descriptor = descriptorKey(record);
    if (!safe(record.id) || ids.has(record.id) || typeof record.nodeKey !== "string" || !record.nodeKey.startsWith("jump:v1:") || keys.has(record.nodeKey)) fail("duplicate/invalid identity");
    if (!["active", "unavailable"].includes(record.status)) fail("invalid status");
    // Opaque key: never require its embedded path or keyword to equal today's descriptor.
    const segments = record.nodeKey.slice(8).split("|").map(decodeURIComponent);
    if (segments.length !== 5 || segments[0] !== VIEW || segments.some((part) => !part)) fail("invalid endpoint");
    if (record.status === "active" && activeDescriptors.has(descriptor)) fail("descriptor collision");
    ids.add(record.id); keys.add(record.nodeKey);
    if (record.status === "active") activeDescriptors.add(descriptor);
  }
  return registry;
}

function find(registry, descriptor) {
  return lookups(registry).byDescriptor.get(descriptorKey(descriptor)) || null;
}

function resolve(registry, key) {
  return lookups(registry).byKey.get(key) || null;
}

function lookups(registry) {
  // Registry snapshots are replaced on load/mutation. Revision changes invalidate
  // the cache; explicit write validation always performs a full independent check.
  const cached = lookupCache.get(registry);
  if (cached && cached.revision === registry.revision) return cached;
  validate(registry);
  const byKey = new Map(), byDescriptor = new Map();
  for (const record of registry.nodes) if (record.status === "active") {
    byKey.set(record.nodeKey, record);
    byDescriptor.set(descriptorKey(record), record);
  }
  const result = { revision: registry.revision, byKey, byDescriptor };
  lookupCache.set(registry, result);
  return result;
}

function legacyKey(indexPath, d) {
  return nodeKey(indexPath, d.kind === "keyword" ? "keyword" : "keyword-drawer", d.keywordId,
    d.kind === "keyword" ? "capsule" : [d.type, d.scope, ...d.pathParts].map(encodeURIComponent).join("/"));
}

function upgrade(raw, descriptors, historicalKeys, indexPath) {
  if (own(raw, "identityRegistry")) { validate(raw.identityRegistry); return copy(raw.identityRegistry); }
  if (String(raw.version) !== "4.1") fail("only explicit v4.1 upgrade is supported");
  const registry = { schema: 1, revision: 1, nodes: [] };
  const byKey = new Map();
  const add = (d, key, status, provenance) => {
    if (byKey.has(key)) return;
    // Deterministic old drawer ids make repeated dry-runs byte-identical.
    const id = d.kind === "keyword" ? `legacy-capsule:${key}` : `legacy-drawer:${key}`;
    const record = { ...copy(d), id, nodeKey: key, status, provenance };
    registry.nodes.push(record); byKey.set(key, record);
  };
  for (const descriptor of descriptors) add(descriptor, legacyKey(indexPath, descriptor), "active", "legacy-current");
  for (const key of [...new Set(historicalKeys)].sort()) {
    if (byKey.has(key)) continue;
    const descriptor = parseKey(key);
    if (!descriptor) fail("historical endpoint cannot be inventoried safely");
    add(descriptor, key, "unavailable", "legacy-history");
  }
  return validate(registry);
}

function preview(registry, descriptors) {
  validate(registry);
  const desired = new Map();
  for (const d of descriptors) {
    const key = descriptorKey(d);
    if (desired.has(key)) fail("duplicate desired descriptor");
    desired.set(key, d);
  }
  const active = new Map(registry.nodes.filter((n) => n.status === "active").map((n) => [descriptorKey(n), n]));
  return {
    missing: registry.nodes.filter((n) => n.status === "active" && !desired.has(descriptorKey(n))),
    additions: descriptors.filter((d) => !active.has(descriptorKey(d))),
  };
}

// Mapping keys are persistent old node keys. Values are unpublished descriptor keys.
// A missing identity is never revived by matching only its old text.
function reconcile(registry, descriptors, mappings = {}, indexPath, uuid) {
  const draft = copy(validate(registry));
  const delta = preview(draft, descriptors);
  const desired = new Map(descriptors.map((d) => [descriptorKey(d), d]));
  const additions = new Map(delta.additions.map((d) => [descriptorKey(d), d]));
  const reserved = new Set(draft.nodes.map((n) => n.id));
  const used = new Set();
  for (const [oldKey, nextDescriptorKey] of Object.entries(mappings)) {
    const old = draft.nodes.find((n) => n.nodeKey === oldKey);
    const next = additions.get(nextDescriptorKey);
    if (!old || !next || used.has(nextDescriptorKey)) fail("invalid/non-unique reconciliation");
    if (old.status === "active" && desired.has(descriptorKey(old))) fail("cannot merge a live identity");
    if (old.kind !== next.kind || old.type !== next.type || old.scope !== next.scope || old.keywordId !== next.keywordId) fail("cross-keyword/source/role mapping refused");
    used.add(nextDescriptorKey);
    Object.assign(old, copy(next), { status: "active" });
  }
  for (const record of draft.nodes) {
    if (record.status === "active" && !desired.has(descriptorKey(record))) record.status = "unavailable";
  }
  for (const d of delta.additions) {
    if (used.has(descriptorKey(d))) continue;
    const id = allocate(d.kind === "keyword" ? "capsule-" : "drawer-", reserved, uuid);
    draft.nodes.push({ ...copy(d), id, nodeKey: nodeKey(indexPath, d.kind === "keyword" ? "keyword" : "keyword-drawer", d.keywordId, d.kind === "keyword" ? "capsule" : id), status: "active", provenance: "created" });
  }
  draft.revision += 1;
  return validate(draft);
}

function moveSubtree(registry, keywordId, type, oldPath, newPath) {
  const draft = copy(validate(registry));
  if (!oldPath.length || !newPath.length || newPath.some((p) => typeof p !== "string" || !p.trim())) fail("invalid subtree path");
  const starts = (a, b) => b.every((v, i) => a[i] === v);
  if (newPath.length > oldPath.length && starts(newPath, oldPath)) fail("cannot move into own descendant");
  const affected = draft.nodes.filter((n) => n.status === "active" && n.kind === "drawer" && n.keywordId === keywordId && n.type === type && starts(n.pathParts, oldPath));
  if (!affected.length) fail("subtree not found");
  const moved = new Set(affected);
  if (draft.nodes.some((n) => n.status === "active" && !moved.has(n) && n.keywordId === keywordId && n.type === type && starts(n.pathParts, newPath))) fail("destination already occupied");
  for (const record of affected) record.pathParts = [...newPath, ...record.pathParts.slice(oldPath.length)];
  draft.revision += 1;
  return validate(draft);
}

function keywordIdsByLabel(keywords) {
  const map = new Map();
  for (const [id, keyword] of Object.entries(keywords)) {
    if (!safe(id) || keyword.id !== id) fail("invalid keyword id");
    if (keyword.identityStatus === "unavailable") continue;
    const label = keyword.baseKeyword || keyword.displayText;
    if (map.has(label)) fail("duplicate keyword label");
    map.set(label, id);
  }
  return map;
}

module.exports = { allocate, copy, descriptorKey, find, keywordIdsByLabel, legacyKey, moveSubtree, nodeKey, parseKey, preview, reconcile, resolve, upgrade, validate };
