var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.mjs
var main_exports = {};
__export(main_exports, {
  default: () => TemporalFrameworkPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_node_path3 = __toESM(require("node:path"), 1);

// src/draft-store.mjs
var import_node_crypto = require("node:crypto");
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
function hashText(value) {
  return (0, import_node_crypto.createHash)("sha256").update(value, "utf8").digest("hex").toUpperCase();
}
function emptyFile() {
  return { schemaVersion: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), draftsBySessionId: {} };
}
function atomicWriteSync(target, value) {
  const temp = `${target}.tmp`;
  const body = JSON.stringify(value, null, 2) + "\n";
  const handle = import_node_fs.default.openSync(temp, "w");
  try {
    import_node_fs.default.writeFileSync(handle, body, "utf8");
    import_node_fs.default.fsyncSync(handle);
  } finally {
    import_node_fs.default.closeSync(handle);
  }
  import_node_fs.default.renameSync(temp, target);
  if (hashText(import_node_fs.default.readFileSync(target, "utf8")) !== hashText(body)) throw new Error("\u8349\u7A3F\u5199\u5165\u56DE\u8BFB\u6821\u9A8C\u5931\u8D25");
}
var DraftStore = class {
  constructor(directory, options = {}) {
    this.file = import_node_path.default.join(directory, "Temporal_Framework_Drafts.json");
    this.sessions = /* @__PURE__ */ new Map();
    this.pluginGeneration = 1;
    this.admissionOpen = true;
    this.debounceMs = options.debounceMs ?? 350;
    import_node_fs.default.mkdirSync(directory, { recursive: true });
  }
  readFile() {
    if (!import_node_fs.default.existsSync(this.file)) return emptyFile();
    const value = JSON.parse(import_node_fs.default.readFileSync(this.file, "utf8"));
    if (value.schemaVersion !== 1 || !value.draftsBySessionId || typeof value.draftsBySessionId !== "object") {
      throw new Error("\u65F6\u95F4\u6846\u67B6\u8349\u7A3F\u6587\u4EF6\u7ED3\u6784\u4E0D\u517C\u5BB9");
    }
    return value;
  }
  findRecoverable(identity) {
    return Object.values(this.readFile().draftsBySessionId).find(
      (draft) => draft.recordType === identity.recordType && draft.recordId === (identity.recordId ?? null) && draft.baseRevision === (identity.baseRevision ?? null) && draft.baseHash === (identity.baseHash ?? null)
    ) ?? null;
  }
  openSession(identity, initialValue = {}) {
    if (!this.admissionOpen) throw new Error("\u8349\u7A3F\u5165\u53E3\u5DF2\u7ECF\u5173\u95ED");
    const recovered = this.findRecoverable(identity);
    const sessionId = recovered?.sessionId ?? `temporal_editor_${(0, import_node_crypto.randomUUID)().replaceAll("-", "")}`;
    const session = {
      sessionId,
      pluginGeneration: this.pluginGeneration,
      generation: 1,
      state: "clean",
      dirty: false,
      timer: null,
      identity: {
        recordType: identity.recordType,
        recordId: identity.recordId ?? null,
        baseRevision: identity.baseRevision ?? null,
        baseHash: identity.baseHash ?? null
      },
      value: structuredClone(recovered?.value ?? initialValue)
    };
    this.sessions.set(sessionId, session);
    return session;
  }
  assertWritable(session) {
    if (!this.admissionOpen || session.pluginGeneration !== this.pluginGeneration) throw new Error("\u8349\u7A3F\u5C5E\u4E8E\u5DF2\u5173\u95ED\u7684\u63D2\u4EF6\u5B9E\u4F8B");
    if (!["clean", "dirty"].includes(session.state)) throw new Error(`\u8349\u7A3F\u5F53\u524D\u72B6\u6001\u4E3A ${session.state}`);
  }
  update(session, value) {
    this.assertWritable(session);
    session.value = structuredClone(value);
    session.dirty = true;
    session.state = "dirty";
    session.generation += 1;
    const generation = session.generation;
    if (session.timer) clearTimeout(session.timer);
    session.timer = setTimeout(() => {
      session.timer = null;
      if (this.admissionOpen && session.generation === generation && session.state === "dirty") this.writeSession(session);
    }, this.debounceMs);
  }
  writeSession(session) {
    const file = this.readFile();
    file.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    file.draftsBySessionId[session.sessionId] = {
      sessionId: session.sessionId,
      ...session.identity,
      generation: session.generation,
      value: structuredClone(session.value),
      savedAt: file.updatedAt
    };
    atomicWriteSync(this.file, file);
    session.dirty = false;
    session.state = "clean";
  }
  flushSync(session) {
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    if (!session.dirty) return false;
    session.generation += 1;
    this.writeSession(session);
    return true;
  }
  beginCommit(session) {
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    if (session.dirty) this.writeSession(session);
    session.state = "committing";
  }
  deferCommit(session) {
    if (session.state !== "committing") throw new Error("\u8349\u7A3F\u672A\u8FDB\u5165\u63D0\u4EA4\u72B6\u6001");
    session.state = "clean";
    session.dirty = false;
  }
  deleteDraft(session) {
    const file = this.readFile();
    delete file.draftsBySessionId[session.sessionId];
    file.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    atomicWriteSync(this.file, file);
  }
  completeCommit(session) {
    if (session.state !== "committing") throw new Error("\u8349\u7A3F\u672A\u8FDB\u5165\u63D0\u4EA4\u72B6\u6001");
    this.deleteDraft(session);
    session.state = "committed";
    session.dirty = false;
  }
  failCommit(session) {
    session.state = "dirty";
    session.dirty = true;
    this.writeSession(session);
  }
  discard(session) {
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    this.deleteDraft(session);
    session.state = "discarded";
    session.dirty = false;
  }
  closeSession(session) {
    if (session.dirty) this.flushSync(session);
    session.state = "closed";
    this.sessions.delete(session.sessionId);
  }
  unloadSync() {
    this.admissionOpen = false;
    this.pluginGeneration += 1;
    const errors = [];
    for (const session of this.sessions.values()) {
      if (session.timer) clearTimeout(session.timer);
      session.timer = null;
      if (!session.dirty) continue;
      try {
        const file = this.readFile();
        file.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        file.draftsBySessionId[session.sessionId] = {
          sessionId: session.sessionId,
          ...session.identity,
          generation: session.generation + 1,
          value: structuredClone(session.value),
          savedAt: file.updatedAt
        };
        atomicWriteSync(this.file, file);
      } catch (error) {
        errors.push(error);
      }
    }
    this.sessions.clear();
    if (errors.length) throw new AggregateError(errors, "\u65F6\u95F4\u6846\u67B6\u8349\u7A3F\u672A\u5168\u90E8\u5199\u76D8");
  }
};

// src/mandala-bridge.mjs
var text = (value, fallback = "") => String(value ?? fallback).trim();
function isUsablePlanningTarget(target = {}) {
  if (text(target.status, "active") === "stopped") return false;
  const label = text(target.label || target.itemName || target.name);
  if (!label || label === "\u5DF2\u5220\u9664") return false;
  if (/^item_[a-z0-9]+$/i.test(label)) return false;
  if (/^[a-z0-9]{10,}$/i.test(label)) return false;
  return true;
}
function isWorkspaceJumpNodeKey(value) {
  const raw = text(value);
  if (!raw.startsWith("jump:v1:")) return false;
  const segments = raw.slice("jump:v1:".length).split("|");
  if (segments.length !== 5) return false;
  try {
    const decoded = segments.map((segment) => decodeURIComponent(segment).trim());
    return decoded.every(Boolean) && decoded[0] === "workspace-mount-view";
  } catch (_) {
    return false;
  }
}
function isMandalaGoalJumpNodeKey(value) {
  const raw = text(value);
  if (!raw.startsWith("jump:v1:")) return false;
  const segments = raw.slice("jump:v1:".length).split("|");
  if (segments.length !== 5) return false;
  try {
    const decoded = segments.map((segment) => decodeURIComponent(segment).trim());
    return decoded.every(Boolean) && decoded[0] === "mandala-time-blocks" && decoded[2] === "node" && decoded[3] === "mandala";
  } catch (_) {
    return false;
  }
}
function malformedEffectiveSnapshot(reason) {
  const error = new Error(`Mandala \u8FD4\u56DE\u4E86\u7578\u5F62\u7684\u6709\u6548\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E3B\u952E\u5FEB\u7167\uFF1A${reason}`);
  error.code = "EFFECTIVE_OPERATIONAL_CONTEXT_SNAPSHOT_MALFORMED";
  return error;
}
function validateEffectiveOperationalContextSnapshot(snapshot = {}, options = {}) {
  const domain = text(options.domain, "project");
  const expectedType = domain === "goal" ? "mandala-effective-goal-operational-context-keys-v1" : "mandala-effective-operational-context-keys-v1";
  const targets = Array.isArray(snapshot?.targets) ? snapshot.targets : null;
  const count = Number(snapshot?.count);
  const returnedCount = Number(snapshot?.returnedCount);
  const totalCount = Number(snapshot?.totalCount);
  const limit = Number(snapshot?.limit);
  const generatedAt = text(snapshot?.generatedAt);
  const sourceScope = text(snapshot?.sourceScope);
  const sourceNotePath = text(snapshot?.sourceNotePath);
  if (snapshot?.ok !== true || snapshot?.complete !== true || Number(snapshot?.contractVersion) !== 1 || text(snapshot?.snapshotType) !== expectedType || snapshot?.truncated === true || snapshot?.hasMore === true || !targets || !text(snapshot?.revision) || !text(snapshot?.providerGeneration || snapshot?.instanceId) || !generatedAt || !Number.isFinite(Date.parse(generatedAt)) || !sourceScope || sourceScope !== sourceNotePath || !Array.isArray(snapshot?.diagnostics) || count !== targets.length || returnedCount !== targets.length || !Number.isInteger(totalCount) || totalCount < count || !Number.isInteger(limit) || limit < totalCount || limit > 500) throw malformedEffectiveSnapshot("envelope");
  const seen = /* @__PURE__ */ new Set();
  targets.forEach((target) => {
    const sourceKey = text(target?.sourceKey);
    const aliases = Array.isArray(target?.aliases) ? target.aliases.map((value) => text(value)) : [];
    const contextKey = target?.contextKey;
    if (text(target?.sourcePlugin) !== "mandala-time-blocks" || text(target?.domain) !== domain || text(target?.sourceType) !== domain || text(target?.sourceScope) !== sourceScope || text(target?.sourceNotePath) !== sourceNotePath || Number(target?.identityVersion) !== 1 || !(domain === "goal" ? isMandalaGoalJumpNodeKey(sourceKey) : isWorkspaceJumpNodeKey(sourceKey)) || text(target?.sourceId) !== sourceKey || text(target?.nodeId) !== sourceKey || text(target?.status) !== "active" || target?.active !== true || text(target?.lifecycleState) !== "active" || !isUsablePlanningTarget(target) || !text(target?.label) || !text(target?.pathLabel) || !Number.isFinite(Number(target?.order)) || aliases.length === 0 || aliases.some((alias) => !alias) || new Set(aliases).size !== aliases.length || !aliases.includes(sourceKey) || !contextKey || !text(contextKey?.contextKeyId) || !text(contextKey?.address) || !text(contextKey?.canonicalLabel) || !text(contextKey?.displayLabel) || text(target?.evidenceRevision) !== text(snapshot?.revision)) throw malformedEffectiveSnapshot("target");
    if (seen.has(sourceKey)) throw malformedEffectiveSnapshot("duplicate-owner");
    seen.add(sourceKey);
  });
  return targets;
}
function validateEffectiveOperationalContextSnapshots(projectSnapshot = {}, goalSnapshot = {}) {
  const projectTargets = validateEffectiveOperationalContextSnapshot(projectSnapshot, { domain: "project" });
  const goalTargets = validateEffectiveOperationalContextSnapshot(goalSnapshot, { domain: "goal" });
  const seen = /* @__PURE__ */ new Set();
  return [...projectTargets, ...goalTargets].map((target) => {
    const identity = `${text(target.domain)}\0${text(target.sourceScope)}\0${text(target.sourceKey)}`;
    if (seen.has(identity)) throw malformedEffectiveSnapshot("cross-domain-duplicate-owner");
    seen.add(identity);
    return target;
  });
}
function providerFailure(action, result) {
  const reason = text(result?.reason, "UNKNOWN_PROVIDER_FAILURE");
  return new Error(`${action}\u5931\u8D25\uFF1A${reason}`);
}
async function openPlanningTargetOntology(api, primaryRef, options = {}) {
  const provider = api?.ontologyIndexProvider;
  if (typeof provider?.resolvePlanningTargetOntologyOwner !== "function") {
    throw new Error("Mandala \u4E3B\u952E Ontology \u89E3\u6790\u80FD\u529B\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u5148\u66F4\u65B0\u6216\u91CD\u542F Mandala");
  }
  if (typeof provider.openOntology !== "function") {
    throw new Error("Mandala \u4E3B\u952E Ontology \u6253\u5F00\u80FD\u529B\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u5148\u91CD\u542F Mandala");
  }
  const resolved = await provider.resolvePlanningTargetOntologyOwner(primaryRef, { signal: options.signal });
  if (resolved?.ok !== true) throw providerFailure("\u5B9A\u4F4D\u6240\u5C5E\u4E3B\u952E Ontology", resolved);
  if (!resolved.stableRef || typeof resolved.stableRef !== "object") {
    throw new Error("Mandala \u672A\u8FD4\u56DE\u6B63\u5F0F Ontology \u5730\u5740");
  }
  const stableRef = structuredClone(resolved.stableRef);
  const opened = await provider.openOntology(stableRef, {
    signal: options.signal,
    familyId: resolved.familyId
  });
  if (opened?.ok !== true) throw providerFailure("\u6253\u5F00\u6240\u5C5E\u4E3B\u952E Ontology", opened);
  return { ok: true, familyId: resolved.familyId, stableRef, opened };
}

// src/outcome-search.mjs
var MAX_OUTCOME_SEARCH_PATH_DEPTH = 32;
var DEFAULT_OUTCOME_SEARCH_LIMIT = 20;
function compareText(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const parsed = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function validMembership(projection, membershipId, frameworkId) {
  const membership = projection.membershipsById?.[membershipId];
  return membership && membership.id === membershipId && membership.status === "active" && membership.frameworkId === frameworkId && ["goal", "project"].includes(membership.primaryRef?.domain) ? membership : null;
}
function normalizeOutcomeSearchText(value) {
  return String(value || "").normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/gu, " ").trim();
}
function activePlacementIndex(projection, frameworkId) {
  const byOutcomeId = /* @__PURE__ */ new Map();
  for (const [placementKey, placement] of Object.entries(projection.placementsById || {})) {
    if (!placement || placementKey !== placement.id || placement.status !== "active" || placement.frameworkId !== frameworkId) continue;
    if (!placement.outcomeId || !isValidIsoDate(placement.startDate) || !isValidIsoDate(placement.endDateExclusive)) continue;
    if (placement.startDate >= placement.endDateExclusive) continue;
    const outcome = projection.outcomesById?.[placement.outcomeId];
    if (!outcome || outcome.id !== placement.outcomeId || outcome.status !== "active" || outcome.frameworkId !== frameworkId) continue;
    const bucket = byOutcomeId.get(placement.outcomeId) || [];
    bucket.push(placement);
    byOutcomeId.set(placement.outcomeId, bucket);
  }
  for (const bucket of byOutcomeId.values()) {
    bucket.sort((left, right) => compareText(left.startDate, right.startDate) || compareText(left.endDateExclusive, right.endDateExclusive) || compareText(left.id, right.id));
  }
  return byOutcomeId;
}
function outcomePath(projection, outcome, frameworkId) {
  const path4 = [];
  const visited = /* @__PURE__ */ new Set();
  let cursor = outcome;
  let pathStatus = "complete";
  while (cursor) {
    if (visited.has(cursor.id)) {
      pathStatus = "cycle";
      break;
    }
    if (path4.length >= MAX_OUTCOME_SEARCH_PATH_DEPTH) {
      pathStatus = "truncated";
      break;
    }
    if (projection.outcomesById?.[cursor.id] !== cursor || cursor.status !== "active" || cursor.frameworkId !== frameworkId) return null;
    if (!validMembership(projection, cursor.membershipId, frameworkId)) return null;
    visited.add(cursor.id);
    path4.push(cursor);
    if (!cursor.outlineParentId) break;
    const parent = projection.outcomesById?.[cursor.outlineParentId];
    if (!parent || parent.id !== cursor.outlineParentId || parent.status !== "active" || parent.frameworkId !== frameworkId) return null;
    cursor = parent;
  }
  path4.reverse();
  return {
    pathOutcomeIds: path4.map((item) => item.id),
    pathTitles: path4.map((item) => item.title),
    pathStatus
  };
}
function buildOutcomeSearchEntries(projection, frameworkId) {
  const entries = [];
  const placements = activePlacementIndex(projection, frameworkId);
  for (const [outcomeKey, outcome] of Object.entries(projection.outcomesById || {})) {
    if (!outcome || outcomeKey !== outcome.id || outcome.status !== "active" || outcome.frameworkId !== frameworkId) continue;
    if (!normalizeOutcomeSearchText(outcome.title)) continue;
    const membership = validMembership(projection, outcome.membershipId, frameworkId);
    if (!membership) continue;
    let frameworkItem = null;
    if (membership.frameworkItemId) {
      frameworkItem = projection.frameworkItemsById?.[membership.frameworkItemId];
      if (!frameworkItem || frameworkItem.id !== membership.frameworkItemId || frameworkItem.status !== "active" || frameworkItem.frameworkId !== frameworkId) continue;
    }
    const path4 = outcomePath(projection, outcome, frameworkId);
    if (!path4) continue;
    const placement = placements.get(outcome.id)?.[0] || null;
    const frameworkItemTitle = frameworkItem?.title || "\u672A\u5F52\u5C5E\u6846\u67B6\u6761\u76EE";
    const membershipLabel = membership.lastKnownLabel || membership.labelAtCreation || membership.id;
    const pathLabel = path4.pathTitles.join(" / ");
    entries.push({
      outcomeId: outcome.id,
      title: outcome.title,
      outcomeKind: outcome.outcomeKind === "stage_gate" ? "stage_gate" : "outcome",
      membershipId: membership.id,
      membershipDomain: membership.primaryRef.domain,
      membershipLabel,
      frameworkItemId: frameworkItem?.id || null,
      frameworkItemTitle,
      pathOutcomeIds: path4.pathOutcomeIds,
      pathTitles: path4.pathTitles,
      pathLabel,
      pathStatus: path4.pathStatus,
      placement: placement ? {
        id: placement.id,
        startDate: placement.startDate,
        endDateExclusive: placement.endDateExclusive
      } : null,
      normalizedTitle: normalizeOutcomeSearchText(outcome.title),
      normalizedMembership: normalizeOutcomeSearchText(membershipLabel),
      normalizedFrameworkItem: normalizeOutcomeSearchText(frameworkItemTitle),
      normalizedPath: normalizeOutcomeSearchText(pathLabel)
    });
  }
  return entries.sort((left, right) => compareText(left.normalizedTitle, right.normalizedTitle) || compareText(left.normalizedPath, right.normalizedPath) || compareText(left.normalizedMembership, right.normalizedMembership) || compareText(left.normalizedFrameworkItem, right.normalizedFrameworkItem) || compareText(left.outcomeId, right.outcomeId));
}
function matchRank(entry, query, tokens) {
  if (entry.normalizedTitle === query) return 0;
  if (entry.normalizedTitle.startsWith(query)) return 1;
  if (entry.normalizedTitle.includes(query)) return 2;
  if (entry.normalizedPath.includes(query)) return 3;
  if (entry.normalizedMembership.includes(query)) return 4;
  if (entry.normalizedFrameworkItem.includes(query)) return 5;
  const combined = `${entry.normalizedTitle} ${entry.normalizedPath} ${entry.normalizedMembership} ${entry.normalizedFrameworkItem}`;
  return tokens.every((token) => combined.includes(token)) ? 6 : null;
}
function searchOutcomeEntries(entries, queryValue, limitValue = DEFAULT_OUTCOME_SEARCH_LIMIT) {
  const query = normalizeOutcomeSearchText(queryValue);
  if (!query) return [];
  const tokens = query.split(" ").filter(Boolean);
  const limit = Math.max(1, Math.min(DEFAULT_OUTCOME_SEARCH_LIMIT, Number.isFinite(Number(limitValue)) ? Math.floor(Number(limitValue)) : DEFAULT_OUTCOME_SEARCH_LIMIT));
  return entries.map((entry) => ({ entry, rank: matchRank(entry, query, tokens) })).filter((candidate) => candidate.rank !== null).sort((left, right) => left.rank - right.rank || compareText(left.entry.normalizedTitle, right.entry.normalizedTitle) || compareText(left.entry.normalizedPath, right.entry.normalizedPath) || compareText(left.entry.normalizedMembership, right.entry.normalizedMembership) || compareText(left.entry.normalizedFrameworkItem, right.entry.normalizedFrameworkItem) || compareText(left.entry.outcomeId, right.entry.outcomeId)).slice(0, limit).map((candidate) => candidate.entry);
}

// src/outcome-overview-navigation.mjs
var OutcomeOverviewReturnQueue = class {
  constructor() {
    this.sequence = 0;
    this.pending = null;
  }
  queue(projection, frameworkId, outcomeId) {
    const token = ++this.sequence;
    this.pending = null;
    const outcome = projection?.outcomesById?.[outcomeId];
    const membership = outcome ? projection?.membershipsById?.[outcome.membershipId] : null;
    if (outcome?.status !== "active" || membership?.status !== "active") return null;
    if (outcome.id !== outcomeId || membership.id !== outcome.membershipId) return null;
    if (outcome.frameworkId !== frameworkId || membership.frameworkId !== frameworkId) return null;
    this.pending = { token, frameworkId, membershipId: membership.id, outcomeId: outcome.id };
    return this.pending;
  }
  current() {
    return this.pending;
  }
  consume(token, frameworkId) {
    const intent = this.pending;
    if (!intent || intent.token !== token) return null;
    this.pending = null;
    return intent.frameworkId === frameworkId ? intent : null;
  }
  clear() {
    this.sequence += 1;
    this.pending = null;
  }
};

// src/temporal-engine.mjs
var import_node_crypto2 = require("node:crypto");
var STORE_SCHEMA_VERSION = 2;
var LEGACY_STORE_SCHEMA_VERSION = 1;
var EVENT_BUCKETS = [
  "frameworkEventsById",
  "membershipEventsById",
  "outcomeEventsById",
  "placementEventsById",
  "relationEventsById",
  "gatePolicyEventsById",
  "completionEventsById",
  "coverageEventsById"
];
var TIME_SCALES = ["year", "quarter", "month", "week"];
var RELATION_TYPES = ["precedes", "requires", "contributes_to"];
var EVENT_PREFIX = {
  frameworkEventsById: "fw_evt",
  membershipEventsById: "member_evt",
  outcomeEventsById: "outcome_evt",
  placementEventsById: "place_evt",
  relationEventsById: "relation_evt",
  gatePolicyEventsById: "gate_evt",
  completionEventsById: "complete_evt",
  coverageEventsById: "coverage_evt"
};
function stableId(prefix) {
  return `${prefix}_${(0, import_node_crypto2.randomUUID)().replaceAll("-", "")}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function hashValue(value) {
  return (0, import_node_crypto2.createHash)("sha256").update(JSON.stringify(value)).digest("hex").toUpperCase();
}
function localDate(date = /* @__PURE__ */ new Date()) {
  const offset = date.getTimezoneOffset() * 6e4;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
function createEmptyStore(createdAt = nowIso()) {
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    storeId: stableId("temporal_store"),
    revision: 0,
    nextEventOrdinal: 1,
    createdAt,
    updatedAt: createdAt,
    timezone: "Asia/Shanghai",
    calendar: "iso8601",
    policyVersion: 1,
    frameworkEventsById: {},
    membershipEventsById: {},
    outcomeEventsById: {},
    placementEventsById: {},
    relationEventsById: {},
    gatePolicyEventsById: {},
    completionEventsById: {},
    coverageEventsById: {}
  };
}
function ensureFrameworkItemSchema(store) {
  if (store.schemaVersion === LEGACY_STORE_SCHEMA_VERSION) store.schemaVersion = STORE_SCHEMA_VERSION;
  if (store.schemaVersion !== STORE_SCHEMA_VERSION) throw new Error("\u65F6\u95F4\u6846\u67B6 Store \u7248\u672C\u4E0D\u652F\u6301\u6846\u67B6\u6761\u76EE\u80FD\u529B");
}
function text2(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}
function assertIsoDate(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error(`${field} \u5FC5\u987B\u662F YYYY-MM-DD`);
  const parsed = /* @__PURE__ */ new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${field} \u4E0D\u662F\u6709\u6548\u65E5\u671F`);
  return value;
}
function utcDate(value) {
  return /* @__PURE__ */ new Date(`${assertIsoDate(value, "date")}T00:00:00Z`);
}
function isoFromUtc(value) {
  return value.toISOString().slice(0, 10);
}
function addDays(value, days) {
  const date = utcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromUtc(date);
}
function compareDate(left, right) {
  return String(left).localeCompare(String(right));
}
function daysBetween(startDate, endDateExclusive) {
  return Math.round((utcDate(endDateExclusive) - utcDate(startDate)) / 864e5);
}
function dateInTimezone(value, timezone) {
  const instant = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error("invalid instant");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(instant);
  const read = (type) => parts.find((part) => part.type === type)?.value;
  return assertIsoDate(`${read("year")}-${read("month")}-${read("day")}`, "zoned date");
}
function milestoneProgress(milestone, options = {}) {
  try {
    const timezone = text2(options.timezone, "Asia/Shanghai");
    const startDate = dateInTimezone(milestone?.createdAt, timezone);
    const targetDate = assertIsoDate(milestone?.targetDate, "targetDate");
    const today = typeof options.today === "string" ? assertIsoDate(options.today, "today") : dateInTimezone(options.today || /* @__PURE__ */ new Date(), timezone);
    if (compareDate(targetDate, startDate) < 0) return {
      available: true,
      state: "invalid-range",
      label: "\u786E\u7ACB\u65F6\u5DF2\u903E\u671F",
      startDate,
      targetDate,
      today,
      ratio: null,
      percent: null
    };
    const totalDays = daysBetween(startDate, targetDate);
    if (compareDate(today, startDate) < 0) return { available: true, state: "upcoming", label: "\u5C1A\u672A\u5F00\u59CB", startDate, targetDate, today, totalDays, elapsedDays: 0, ratio: 0, percent: 0 };
    if (compareDate(today, targetDate) > 0) return { available: true, state: "overdue", label: "\u5DF2\u5230\u671F\uFF0C\u5C1A\u672A\u81EA\u52A8\u5B8C\u6210", startDate, targetDate, today, totalDays, elapsedDays: totalDays, ratio: 1, percent: 100 };
    if (compareDate(today, targetDate) === 0) return { available: true, state: "due", label: "\u4ECA\u65E5\u5230\u671F", startDate, targetDate, today, totalDays, elapsedDays: totalDays, ratio: 1, percent: 100 };
    const elapsedDays = Math.max(0, Math.min(totalDays, daysBetween(startDate, today)));
    const ratio = totalDays > 0 ? elapsedDays / totalDays : 1;
    return { available: true, state: "active", label: "\u63A8\u8FDB\u4E2D", startDate, targetDate, today, totalDays, elapsedDays, ratio, percent: Math.round(ratio * 100) };
  } catch {
    return { available: false, state: "unavailable", label: "\u8FDB\u5EA6\u4E0D\u53EF\u7528", ratio: null, percent: null };
  }
}
function effectiveDueOn(placement) {
  return placement?.dueOn || (placement?.endDateExclusive ? addDays(placement.endDateExclusive, -1) : null);
}
function startOfScale(value, scale) {
  const date = utcDate(value);
  if (scale === "year") return `${date.getUTCFullYear()}-01-01`;
  if (scale === "quarter") {
    const month = Math.floor(date.getUTCMonth() / 3) * 3;
    return `${date.getUTCFullYear()}-${String(month + 1).padStart(2, "0")}-01`;
  }
  if (scale === "month") return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
  if (scale === "week") {
    const weekday = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - weekday + 1);
    return isoFromUtc(date);
  }
  throw new Error(`\u4E0D\u652F\u6301\u7684\u65F6\u95F4\u5C3A\u5EA6\uFF1A${scale}`);
}
function advanceScale(value, scale) {
  const date = utcDate(value);
  if (scale === "year") date.setUTCFullYear(date.getUTCFullYear() + 1, 0, 1);
  else if (scale === "quarter") date.setUTCMonth(date.getUTCMonth() + 3, 1);
  else if (scale === "month") date.setUTCMonth(date.getUTCMonth() + 1, 1);
  else if (scale === "week") date.setUTCDate(date.getUTCDate() + 7);
  else throw new Error(`\u4E0D\u652F\u6301\u7684\u65F6\u95F4\u5C3A\u5EA6\uFF1A${scale}`);
  return isoFromUtc(date);
}
function isoWeekParts(value) {
  const date = utcDate(value);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 864e5 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}
function timeBoxLabel(scale, startDate) {
  const date = utcDate(startDate);
  if (scale === "year") return `${date.getUTCFullYear()}\u5E74`;
  if (scale === "quarter") return `${date.getUTCFullYear()} Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  if (scale === "month") return `${date.getUTCFullYear()}\u5E74${date.getUTCMonth() + 1}\u6708`;
  const week = isoWeekParts(startDate);
  return `${week.year} W${String(week.week).padStart(2, "0")}`;
}
function canonicalTimeBox(scale, date, options = {}) {
  if (!TIME_SCALES.includes(scale)) throw new Error(`\u4E0D\u652F\u6301\u7684\u65F6\u95F4\u5C3A\u5EA6\uFF1A${scale}`);
  const startDate = startOfScale(date, scale);
  const endDateExclusive = advanceScale(startDate, scale);
  const timezone = text2(options.timezone, "Asia/Shanghai");
  const calendar = text2(options.calendar, "iso8601");
  const policyVersion = Number(options.policyVersion || 1);
  return {
    id: `${timezone}|${calendar}|v${policyVersion}|${scale}|${startDate}|${endDateExclusive}`,
    scale,
    startDate,
    endDateExclusive,
    timezone,
    calendar,
    policyVersion,
    label: timeBoxLabel(scale, startDate)
  };
}
function buildTimeBoxes(startDate, endDateExclusive, scale, options = {}) {
  assertIsoDate(startDate, "startDate");
  assertIsoDate(endDateExclusive, "endDateExclusive");
  if (compareDate(startDate, endDateExclusive) >= 0) throw new Error("\u65F6\u95F4\u8303\u56F4\u5FC5\u987B\u5411\u672A\u6765\u5C55\u5F00");
  const boxes = [];
  let cursor = startOfScale(startDate, scale);
  let guard = 0;
  while (compareDate(cursor, endDateExclusive) < 0) {
    const box = canonicalTimeBox(scale, cursor, options);
    if (compareDate(box.endDateExclusive, startDate) > 0) {
      boxes.push({
        ...box,
        visibleStartDate: compareDate(box.startDate, startDate) < 0 ? startDate : box.startDate,
        visibleEndDateExclusive: compareDate(box.endDateExclusive, endDateExclusive) > 0 ? endDateExclusive : box.endDateExclusive
      });
    }
    cursor = box.endDateExclusive;
    guard += 1;
    if (guard > 600) throw new Error("\u65F6\u95F4\u76D2\u6570\u91CF\u8D85\u8FC7\u5B89\u5168\u4E0A\u9650");
  }
  return boxes;
}
function nextFinerScale(scale) {
  const index = TIME_SCALES.indexOf(scale);
  return index < 0 || index === TIME_SCALES.length - 1 ? scale : TIME_SCALES[index + 1];
}
function intervalsOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return compareDate(leftStart, rightEnd) < 0 && compareDate(rightStart, leftEnd) < 0;
}
function intervalContains(parent, child) {
  return Boolean(parent && child) && compareDate(parent.startDate, child.startDate) <= 0 && compareDate(child.endDateExclusive, parent.endDateExclusive) <= 0;
}
function projectPlacementOnRail(parentPlacement, childPlacement) {
  const totalDays = Math.max(1, daysBetween(parentPlacement.startDate, parentPlacement.endDateExclusive));
  const rawStart = daysBetween(parentPlacement.startDate, childPlacement.startDate);
  const rawEnd = daysBetween(parentPlacement.startDate, childPlacement.endDateExclusive);
  const rawDue = daysBetween(parentPlacement.startDate, effectiveDueOn(childPlacement));
  const clampedStart = Math.max(0, Math.min(totalDays, rawStart));
  const clampedEnd = Math.max(0, Math.min(totalDays, rawEnd));
  const fullyLeft = rawEnd <= 0;
  const fullyRight = rawStart >= totalDays;
  let visibleStart = clampedStart;
  let visibleEnd = clampedEnd;
  if (fullyLeft) visibleEnd = Math.min(totalDays, 1);
  if (fullyRight) visibleStart = Math.max(0, totalDays - 1);
  if (visibleEnd <= visibleStart) visibleEnd = Math.min(totalDays, visibleStart + 1);
  return {
    totalDays,
    startRatio: visibleStart / totalDays,
    endRatio: visibleEnd / totalDays,
    dueRatio: Math.max(0, Math.min(totalDays, rawDue)) / totalDays,
    overflowLeft: rawStart < 0,
    overflowRight: rawEnd > totalDays,
    fullyOutside: fullyLeft || fullyRight,
    contained: rawStart >= 0 && rawEnd <= totalDays
  };
}
function fitPlacementWithinParent(parentPlacement, childPlacement) {
  const parentDays = daysBetween(parentPlacement.startDate, parentPlacement.endDateExclusive);
  const childDays = daysBetween(childPlacement.startDate, childPlacement.endDateExclusive);
  const duration = Math.max(1, Math.min(parentDays, childDays));
  let startDate = childPlacement.startDate;
  if (childDays >= parentDays) startDate = parentPlacement.startDate;
  else if (compareDate(startDate, parentPlacement.startDate) < 0) startDate = parentPlacement.startDate;
  else if (compareDate(addDays(startDate, duration), parentPlacement.endDateExclusive) > 0) startDate = addDays(parentPlacement.endDateExclusive, -duration);
  const endDateExclusive = addDays(startDate, duration);
  let dueOn = effectiveDueOn(childPlacement) || addDays(endDateExclusive, -1);
  if (compareDate(dueOn, startDate) < 0) dueOn = startDate;
  if (compareDate(dueOn, endDateExclusive) >= 0) dueOn = addDays(endDateExclusive, -1);
  return { ...childPlacement, startDate, endDateExclusive, dueOn };
}
function appendDomainEvent(store, bucket, type, payload = {}, options = {}) {
  if (!EVENT_BUCKETS.includes(bucket)) throw new Error(`\u672A\u77E5\u4E8B\u4EF6\u6876\uFF1A${bucket}`);
  if (!store[bucket] || typeof store[bucket] !== "object") throw new Error(`${bucket} \u4E0D\u5B58\u5728`);
  const createId = options.createId || stableId;
  const eventId = options.eventId || createId(EVENT_PREFIX[bucket]);
  if (store[bucket][eventId]) throw new Error(`\u4E8B\u4EF6 ID \u5DF2\u5B58\u5728\uFF1A${eventId}`);
  const clonedPayload = structuredClone(payload);
  if (options.omitReason === true) delete clonedPayload.reason;
  const event = {
    id: eventId,
    type,
    commitRevision: Number(options.commitRevision || store.revision + 1),
    ordinal: Number(store.nextEventOrdinal || 1),
    createdAt: options.createdAt || nowIso(),
    ...options.omitReason === true ? {} : { reason: text2(payload.reason) },
    ...clonedPayload
  };
  store.nextEventOrdinal = event.ordinal + 1;
  store[bucket][eventId] = event;
  return event;
}
function orderedEvents(store, bucket) {
  return Object.values(store[bucket] || {}).sort(
    (left, right) => Number(left.commitRevision) - Number(right.commitRevision) || Number(left.ordinal) - Number(right.ordinal) || String(left.id).localeCompare(String(right.id))
  );
}
function applyPatch(target, patch, allowed) {
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(patch || {}, key)) target[key] = structuredClone(patch[key]);
}
function reduceTemporalStore(store) {
  const projection = {
    frameworksById: {},
    frameworkItemsById: {},
    frameworkMilestonesById: {},
    frameworkMilestoneBindingsById: {},
    membershipsById: {},
    outcomesById: {},
    placementsById: {},
    relationsById: {},
    gatePoliciesByOutcomeId: {},
    completionByOutcomeId: {},
    outcomeEffectivenessByOutcomeId: {},
    coverageById: {},
    diagnostics: []
  };
  for (const event of orderedEvents(store, "frameworkEventsById")) {
    if (event.type === "create") {
      projection.frameworksById[event.frameworkId] = {
        id: event.frameworkId,
        title: event.title,
        startDate: event.startDate,
        endDateExclusive: event.endDateExclusive,
        timezone: event.timezone,
        calendar: event.calendar,
        policyVersion: event.policyVersion,
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
    } else if (["revise", "archive", "restore"].includes(event.type)) {
      const current = projection.frameworksById[event.frameworkId];
      if (!current) continue;
      if (event.type === "revise") applyPatch(current, event.patch, ["title", "startDate", "endDateExclusive", "policyVersion"]);
      if (event.type === "archive") current.status = "archived";
      if (event.type === "restore") current.status = "active";
      current.updatedAt = event.createdAt;
    } else if (event.type === "item-create") {
      projection.frameworkItemsById[event.frameworkItemId] = {
        id: event.frameworkItemId,
        frameworkId: event.frameworkId,
        title: event.title,
        description: event.description || "",
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
    } else if (["item-revise", "item-archive", "item-restore"].includes(event.type)) {
      const current = projection.frameworkItemsById[event.frameworkItemId];
      if (!current) continue;
      if (event.type === "item-revise") applyPatch(current, event.patch, ["title", "description"]);
      if (event.type === "item-archive") current.status = "archived";
      if (event.type === "item-restore") current.status = "active";
      current.updatedAt = event.createdAt;
    } else if (event.type === "milestone-create") {
      projection.frameworkMilestonesById[event.milestoneId] = {
        id: event.milestoneId,
        frameworkId: event.frameworkId,
        frameworkItemId: event.frameworkItemId,
        targetDate: event.targetDate,
        achievement: event.achievement,
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
    } else if (["milestone-revise", "milestone-archive", "milestone-restore"].includes(event.type)) {
      const current = projection.frameworkMilestonesById[event.milestoneId];
      if (!current) continue;
      if (event.type === "milestone-revise") applyPatch(current, event.patch, ["targetDate", "achievement"]);
      if (event.type === "milestone-archive") current.status = "archived";
      if (event.type === "milestone-restore") current.status = "active";
      current.updatedAt = event.createdAt;
    } else if (event.type === "milestone-bind") {
      projection.frameworkMilestoneBindingsById[event.bindingId] = {
        id: event.bindingId,
        frameworkId: event.frameworkId,
        milestoneId: event.milestoneId,
        targetType: event.targetType,
        targetId: event.targetId,
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
    } else if (event.type === "milestone-unbind") {
      const current = projection.frameworkMilestoneBindingsById[event.bindingId];
      if (!current) continue;
      current.status = "unbound";
      current.updatedAt = event.createdAt;
    }
  }
  for (const event of orderedEvents(store, "membershipEventsById")) {
    if (event.type === "admit") {
      projection.membershipsById[event.membershipId] = {
        id: event.membershipId,
        frameworkId: event.frameworkId,
        primaryRef: structuredClone(event.primaryRef),
        labelAtCreation: event.labelAtCreation,
        lastKnownLabel: event.lastKnownLabel || event.labelAtCreation,
        planningStart: event.planningStart,
        planningEndDateExclusive: event.planningEndDateExclusive,
        status: "active",
        sourceState: "fresh",
        frameworkItemId: event.frameworkItemId || null,
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
      continue;
    }
    const current = projection.membershipsById[event.membershipId];
    if (!current) continue;
    if (event.type === "revise-window") applyPatch(current, event.patch, ["planningStart", "planningEndDateExclusive"]);
    if (event.type === "refresh-label") applyPatch(current, event.patch, ["lastKnownLabel", "sourceState"]);
    if (event.type === "mark-source-unknown") current.sourceState = "unknown";
    if (event.type === "assign-framework-item") current.frameworkItemId = event.frameworkItemId || null;
    if (event.type === "exit") {
      current.status = "exited";
      current.exitReason = event.reason;
      current.exitedAt = event.createdAt;
    }
    if (event.type === "reinstate") {
      current.status = "active";
      current.exitReason = "";
      current.exitedAt = null;
      applyPatch(current, event.patch, ["lastKnownLabel", "sourceState", "planningStart", "planningEndDateExclusive"]);
    }
    current.updatedAt = event.createdAt;
  }
  for (const event of orderedEvents(store, "outcomeEventsById")) {
    if (event.type === "create") {
      projection.outcomesById[event.outcomeId] = {
        id: event.outcomeId,
        frameworkId: event.frameworkId,
        membershipId: event.membershipId,
        title: event.title,
        acceptance: event.acceptance || "",
        outcomeKind: event.outcomeKind || "outcome",
        outlineParentId: event.outlineParentId || null,
        supersedesOutcomeId: event.supersedesOutcomeId || null,
        status: "active",
        labelAtCreation: event.labelAtCreation || event.title,
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
      continue;
    }
    if (event.type === "effect-set") {
      const current2 = projection.outcomesById[event.outcomeId];
      if (!current2) {
        projection.diagnostics.push(`${event.id}: outcome effectiveness target missing`);
        continue;
      }
      if (typeof event.effective !== "boolean") {
        projection.diagnostics.push(`${event.id}: outcome effectiveness must be boolean`);
        continue;
      }
      projection.outcomeEffectivenessByOutcomeId[event.outcomeId] = {
        effective: event.effective,
        eventId: event.id,
        updatedAt: event.createdAt
      };
      continue;
    }
    const current = projection.outcomesById[event.outcomeId];
    if (!current) continue;
    let recognized = true;
    if (event.type === "revise") applyPatch(current, event.patch, ["title", "acceptance"]);
    else if (event.type === "link-parent") current.outlineParentId = event.outlineParentId || null;
    else if (event.type === "archive") current.status = "archived";
    else if (event.type === "restore") current.status = "active";
    else recognized = false;
    if (recognized) current.updatedAt = event.createdAt;
  }
  for (const event of orderedEvents(store, "placementEventsById")) {
    if (event.type === "place") {
      projection.placementsById[event.placementId] = {
        id: event.placementId,
        frameworkId: event.frameworkId,
        outcomeId: event.outcomeId,
        mode: event.mode || "interval",
        startDate: event.startDate,
        endDateExclusive: event.endDateExclusive,
        dueOn: event.dueOn || null,
        declaredScale: event.declaredScale,
        homeTimeBoxRef: structuredClone(event.homeTimeBoxRef),
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
      continue;
    }
    const current = projection.placementsById[event.placementId];
    if (!current) continue;
    if (event.type === "move" || event.type === "resize") applyPatch(current, event.patch, ["mode", "startDate", "endDateExclusive", "dueOn", "declaredScale", "homeTimeBoxRef"]);
    if (event.type === "unassign") current.status = "unassigned";
    if (event.type === "restore") current.status = "active";
    current.updatedAt = event.createdAt;
  }
  for (const event of orderedEvents(store, "relationEventsById")) {
    if (event.type === "add") {
      if (event.supersedesRelationId && projection.relationsById[event.supersedesRelationId]) {
        projection.relationsById[event.supersedesRelationId].status = "superseded";
      }
      projection.relationsById[event.relationId] = {
        id: event.relationId,
        frameworkId: event.frameworkId,
        sourceOutcomeId: event.sourceOutcomeId,
        targetOutcomeId: event.targetOutcomeId,
        relationType: event.relationType,
        supersedesRelationId: event.supersedesRelationId || null,
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
      continue;
    }
    const current = projection.relationsById[event.relationId];
    if (!current) continue;
    if (event.type === "revoke") current.status = "revoked";
    current.updatedAt = event.createdAt;
  }
  for (const event of orderedEvents(store, "gatePolicyEventsById")) {
    if (event.type !== "set") continue;
    projection.gatePoliciesByOutcomeId[event.outcomeId] = {
      outcomeId: event.outcomeId,
      mode: event.mode,
      threshold: event.mode === "threshold_count" ? Number(event.threshold) : null,
      eventId: event.id,
      updatedAt: event.createdAt
    };
  }
  for (const event of orderedEvents(store, "completionEventsById")) {
    if (event.type === "paint") {
      projection.completionByOutcomeId[event.outcomeId] = {
        painted: true,
        completedOn: event.completedOn,
        evidence: event.evidence || "",
        note: event.note || "",
        eventId: event.id,
        updatedAt: event.createdAt
      };
    }
    if (event.type === "unpaint") {
      projection.completionByOutcomeId[event.outcomeId] = {
        painted: false,
        reason: event.reason,
        eventId: event.id,
        updatedAt: event.createdAt
      };
    }
  }
  for (const event of orderedEvents(store, "coverageEventsById")) {
    if (event.type === "decide") {
      if (event.supersedesCoverageId && projection.coverageById[event.supersedesCoverageId]) {
        projection.coverageById[event.supersedesCoverageId].status = "superseded";
      }
      projection.coverageById[event.coverageId] = {
        id: event.coverageId,
        frameworkId: event.frameworkId,
        membershipId: event.membershipId,
        timeBoxRef: structuredClone(event.timeBoxRef),
        policyVersion: event.policyVersion,
        decision: event.decision,
        reason: event.reason,
        status: "active",
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      };
      continue;
    }
    const current = projection.coverageById[event.coverageId];
    if (!current) continue;
    if (event.type === "revoke") current.status = "revoked";
    current.updatedAt = event.createdAt;
  }
  projection.diagnostics = [...projection.diagnostics, ...validateProjection(projection)];
  return projection;
}
function activeValues(map) {
  return Object.values(map || {}).filter((item) => item.status === "active");
}
function hasCycle(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node, []]));
  for (const [source, target] of edges) {
    if (!adjacency.has(source)) adjacency.set(source, []);
    adjacency.get(source).push(target);
  }
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (node) => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const target of adjacency.get(node) || []) if (visit(target)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...adjacency.keys()].some((node) => visit(node));
}
function validateProjection(projection) {
  const errors = [];
  const outcomes = projection.outcomesById || {};
  const activeOutcomes = activeValues(outcomes);
  const frameworkIds = new Set(Object.keys(projection.frameworksById || {}));
  const membershipIds = new Set(Object.keys(projection.membershipsById || {}));
  const itemIds = new Set(Object.keys(projection.frameworkItemsById || {}));
  const membershipIdentityOwners = /* @__PURE__ */ new Map();
  for (const membership of Object.values(projection.membershipsById || {})) {
    let identityKey = null;
    try {
      identityKey = `${membership.frameworkId}|${primaryRefKey(membership.primaryRef)}`;
    } catch {
      errors.push(`${membership.id}: invalid primary reference`);
    }
    const existing = identityKey ? membershipIdentityOwners.get(identityKey) : null;
    if (existing) errors.push(`${membership.id}: duplicate lifetime membership identity (${existing})`);
    else if (identityKey) membershipIdentityOwners.set(identityKey, membership.id);
    const ownedOutcomes = Object.values(outcomes).filter((outcome) => outcome.membershipId === membership.id);
    const activeCoverage = activeValues(projection.coverageById).filter((coverage) => coverage.membershipId === membership.id);
    if (membership.status === "exited" && ownedOutcomes.length) errors.push(`${membership.id}: exited membership has outcomes`);
    if (membership.status === "exited" && activeCoverage.length) errors.push(`${membership.id}: exited membership has active coverage`);
    if (membership.status === "active" && membership.frameworkItemId) {
      const item = projection.frameworkItemsById[membership.frameworkItemId];
      if (!item || item.status !== "active" || item.frameworkId !== membership.frameworkId) errors.push(`${membership.id}: invalid framework item assignment`);
    }
  }
  for (const item of Object.values(projection.frameworkItemsById || {})) {
    if (!frameworkIds.has(item.frameworkId)) errors.push(`${item.id}: framework item framework missing`);
  }
  for (const milestone of Object.values(projection.frameworkMilestonesById || {})) {
    const item = projection.frameworkItemsById[milestone.frameworkItemId];
    const framework = projection.frameworksById[milestone.frameworkId];
    if (!item || item.frameworkId !== milestone.frameworkId) errors.push(`${milestone.id}: milestone framework item mismatch`);
    if (!framework) errors.push(`${milestone.id}: milestone framework missing`);
    if (milestone.status === "active" && framework && (compareDate(milestone.targetDate, framework.startDate) < 0 || compareDate(milestone.targetDate, framework.endDateExclusive) >= 0)) {
      errors.push(`${milestone.id}: active milestone outside framework boundary`);
    }
  }
  for (const binding of Object.values(projection.frameworkMilestoneBindingsById || {})) {
    const milestone = projection.frameworkMilestonesById[binding.milestoneId];
    const target = binding.targetType === "membership" ? projection.membershipsById[binding.targetId] : projection.outcomesById[binding.targetId];
    if (!["membership", "outcome"].includes(binding.targetType)) errors.push(`${binding.id}: milestone binding target type invalid`);
    if (!milestone || milestone.frameworkId !== binding.frameworkId) errors.push(`${binding.id}: milestone binding history milestone invalid`);
    if (!target || target.frameworkId !== binding.frameworkId) errors.push(`${binding.id}: milestone binding history target invalid`);
  }
  const bindingTuples = /* @__PURE__ */ new Set();
  const bindingTargets = /* @__PURE__ */ new Map();
  for (const binding of activeValues(projection.frameworkMilestoneBindingsById)) {
    const milestone = projection.frameworkMilestonesById[binding.milestoneId];
    if (!milestone || milestone.status !== "active" || milestone.frameworkId !== binding.frameworkId) errors.push(`${binding.id}: invalid active milestone binding`);
    const target = binding.targetType === "membership" ? projection.membershipsById[binding.targetId] : projection.outcomesById[binding.targetId];
    if (!target || target.status !== "active" || target.frameworkId !== binding.frameworkId) errors.push(`${binding.id}: active binding target invalid`);
    const membership = binding.targetType === "membership" ? target : projection.membershipsById[target?.membershipId];
    if (membership && milestone && membership.frameworkItemId !== milestone.frameworkItemId) errors.push(`${binding.id}: binding target belongs to another framework item`);
    const tuple = `${binding.milestoneId}|${binding.targetType}|${binding.targetId}`;
    if (bindingTuples.has(tuple)) errors.push(`${binding.id}: duplicate active milestone binding`);
    bindingTuples.add(tuple);
    const targetKey = `${binding.targetType}|${binding.targetId}`;
    const existingTargetBinding = bindingTargets.get(targetKey);
    if (existingTargetBinding) errors.push(`${binding.id}: target has multiple active milestone bindings (${existingTargetBinding})`);
    else bindingTargets.set(targetKey, binding.id);
  }
  for (const outcome of Object.values(outcomes)) {
    if (!frameworkIds.has(outcome.frameworkId)) errors.push(`${outcome.id}: framework missing`);
    if (!membershipIds.has(outcome.membershipId)) errors.push(`${outcome.id}: membership missing`);
    if (!["outcome", "stage_gate"].includes(outcome.outcomeKind)) errors.push(`${outcome.id}: invalid outcomeKind`);
    if (outcome.outlineParentId) {
      const parent = outcomes[outcome.outlineParentId];
      if (!parent) errors.push(`${outcome.id}: outline parent missing`);
      else if (parent.frameworkId !== outcome.frameworkId) errors.push(`${outcome.id}: outline parent belongs to another framework`);
      else if (parent.id === outcome.id) errors.push(`${outcome.id}: self parent`);
    }
  }
  const parentEdges = activeOutcomes.filter((outcome) => outcome.outlineParentId).map((outcome) => [outcome.outlineParentId, outcome.id]);
  if (hasCycle(activeOutcomes.map((outcome) => outcome.id), parentEdges)) errors.push("outcome outline contains a cycle");
  const activePlacements = activeValues(projection.placementsById);
  const placementOwner = /* @__PURE__ */ new Map();
  for (const placement of activePlacements) {
    const outcome = outcomes[placement.outcomeId];
    if (!outcome) errors.push(`${placement.id}: outcome missing`);
    else if (outcome.frameworkId !== placement.frameworkId) errors.push(`${placement.id}: framework mismatch`);
    if (!TIME_SCALES.includes(placement.declaredScale)) errors.push(`${placement.id}: invalid declaredScale`);
    if (!placement.homeTimeBoxRef?.id || placement.homeTimeBoxRef.scale !== placement.declaredScale) errors.push(`${placement.id}: invalid homeTimeBoxRef`);
    if (compareDate(placement.startDate, placement.endDateExclusive) >= 0) errors.push(`${placement.id}: invalid date range`);
    const existing = placementOwner.get(placement.outcomeId);
    if (existing) errors.push(`${placement.outcomeId}: multiple active placements (${existing}, ${placement.id})`);
    placementOwner.set(placement.outcomeId, placement.id);
  }
  const relationEdgesByType = new Map(RELATION_TYPES.map((type) => [type, []]));
  for (const relation of activeValues(projection.relationsById)) {
    const source = outcomes[relation.sourceOutcomeId];
    const target = outcomes[relation.targetOutcomeId];
    if (!RELATION_TYPES.includes(relation.relationType)) errors.push(`${relation.id}: invalid relation type`);
    if (!source || !target) errors.push(`${relation.id}: relation endpoint missing`);
    else {
      if (source.id === target.id) errors.push(`${relation.id}: self relation`);
      if (source.frameworkId !== relation.frameworkId || target.frameworkId !== relation.frameworkId) errors.push(`${relation.id}: cross-framework relation`);
      if (relation.relationType === "contributes_to" && target.outcomeKind !== "stage_gate") errors.push(`${relation.id}: contributes_to target must be a stage gate`);
    }
    if (relationEdgesByType.has(relation.relationType)) relationEdgesByType.get(relation.relationType).push([relation.sourceOutcomeId, relation.targetOutcomeId]);
  }
  for (const [relationType, edges] of relationEdgesByType) {
    if (hasCycle(activeOutcomes.map((outcome) => outcome.id), edges)) errors.push(`${relationType} relations contain a cycle`);
  }
  for (const [outcomeId, policy] of Object.entries(projection.gatePoliciesByOutcomeId || {})) {
    const outcome = outcomes[outcomeId];
    if (!outcome || outcome.outcomeKind !== "stage_gate") errors.push(`${outcomeId}: gate policy target is not a stage gate`);
    if (!["all", "threshold_count"].includes(policy.mode)) errors.push(`${outcomeId}: invalid gate policy`);
    const contributorCount = activeValues(projection.relationsById).filter((relation) => relation.relationType === "contributes_to" && relation.targetOutcomeId === outcomeId).length;
    if (contributorCount === 0) errors.push(`${outcomeId}: stage gate has no contributors`);
    if (policy.mode === "threshold_count" && (!Number.isInteger(policy.threshold) || policy.threshold < 1 || policy.threshold > contributorCount)) {
      errors.push(`${outcomeId}: invalid threshold`);
    }
  }
  const coverageKeys = /* @__PURE__ */ new Set();
  for (const coverage of activeValues(projection.coverageById)) {
    const membership = projection.membershipsById[coverage.membershipId];
    if (!membership || membership.frameworkId !== coverage.frameworkId) errors.push(`${coverage.id}: coverage membership mismatch`);
    const box = coverage.timeBoxRef;
    if (!box?.id || !box.startDate || !box.endDateExclusive || !TIME_SCALES.includes(box.scale)) errors.push(`${coverage.id}: invalid coverage TimeBox`);
    const key = `${coverage.frameworkId}|${coverage.membershipId}|${box?.id}`;
    if (coverageKeys.has(key)) errors.push(`${coverage.id}: duplicate active coverage decision`);
    coverageKeys.add(key);
    const conflict = activePlacements.some((placement) => {
      const outcome = outcomes[placement.outcomeId];
      return outcome?.membershipId === coverage.membershipId && placement.frameworkId === coverage.frameworkId && box?.startDate && intervalsOverlap(placement.startDate, placement.endDateExclusive, box.startDate, box.endDateExclusive);
    });
    if (conflict) errors.push(`${coverage.id}: no-deployment conflicts with an active placement`);
  }
  return errors;
}
function assertValidStore(store) {
  if (!store || ![LEGACY_STORE_SCHEMA_VERSION, STORE_SCHEMA_VERSION].includes(store.schemaVersion)) throw new Error("Temporal Framework store schema \u4E0D\u517C\u5BB9");
  if (store.schemaVersion === LEGACY_STORE_SCHEMA_VERSION) {
    const v2FrameworkEvents = Object.values(store.frameworkEventsById || {}).some((event) => String(event.type).startsWith("item-") || String(event.type).startsWith("milestone-"));
    const v2MembershipEvents = Object.values(store.membershipEventsById || {}).some((event) => event.type === "assign-framework-item" || event.frameworkItemId);
    const v2OutcomeEvents = Object.values(store.outcomeEventsById || {}).some((event) => event.type === "effect-set");
    if (v2FrameworkEvents || v2MembershipEvents || v2OutcomeEvents) throw new Error("v1 Store \u4E0D\u5141\u8BB8\u5305\u542B\u6846\u67B6\u6761\u76EE\u6216\u6B63\u5728\u751F\u6548\u4E8B\u4EF6");
  }
  if (!Number.isInteger(store.revision) || store.revision < 0) throw new Error("store revision \u65E0\u6548");
  if (!Number.isInteger(store.nextEventOrdinal) || store.nextEventOrdinal < 1) throw new Error("event ordinal \u65E0\u6548");
  for (const bucket of EVENT_BUCKETS) if (!store[bucket] || typeof store[bucket] !== "object" || Array.isArray(store[bucket])) throw new Error(`${bucket} \u65E0\u6548`);
  const projection = reduceTemporalStore(store);
  if (projection.diagnostics.length) throw new Error(projection.diagnostics.slice(0, 8).join("; "));
  return store;
}
function normalizePrimaryRef(value = {}) {
  const providerId = text2(value.providerId || value.sourcePlugin);
  const domain = text2(value.domain || value.sourceType);
  const sourceScope = text2(value.sourceScope || value.sourceNotePath);
  const sourceKey = text2(value.sourceKey || value.sourceId || value.nodeId);
  const identityVersion = Number(value.identityVersion || 1);
  if (!providerId || !domain || !sourceScope || !sourceKey || !Number.isInteger(identityVersion) || identityVersion < 1) {
    throw new Error("\u4E3B\u952E\u8EAB\u4EFD\u7F3A\u5C11 provider/domain/sourceScope/sourceKey/identityVersion");
  }
  return { providerId, domain, sourceScope, sourceKey, identityVersion };
}
function primaryRefKey(primaryRef) {
  const normalized = normalizePrimaryRef(primaryRef);
  return `${normalized.providerId}|${normalized.domain}|${normalized.sourceScope}|${normalized.sourceKey}|v${normalized.identityVersion}`;
}
function activeTemporalRelations(projection) {
  return activeValues(projection.relationsById).filter((relation) => {
    const source = projection.outcomesById[relation.sourceOutcomeId];
    const target = projection.outcomesById[relation.targetOutcomeId];
    return source?.status === "active" && target?.status === "active";
  });
}
function buildOutcomeRelationProjection(projection, frameworkId) {
  const relationsByOutcomeId = {};
  const endpointGroups = /* @__PURE__ */ new Map();
  const addEndpoint = (outcomeId, endpoint) => {
    const key = `${outcomeId}|${endpoint.direction}|${endpoint.relationType}|${endpoint.peerOutcomeId}`;
    const current = endpointGroups.get(key);
    if (current) {
      current.relationIds.push(endpoint.relationId);
      current.duplicateCount = current.relationIds.length;
      if (endpoint.violation && !current.violation) current.violation = endpoint.violation;
      return;
    }
    const grouped = { ...endpoint, relationIds: [endpoint.relationId], duplicateCount: 1 };
    endpointGroups.set(key, grouped);
    if (!relationsByOutcomeId[outcomeId]) relationsByOutcomeId[outcomeId] = [];
    relationsByOutcomeId[outcomeId].push(grouped);
  };
  for (const relation of activeTemporalRelations(projection)) {
    const source = projection.outcomesById[relation.sourceOutcomeId];
    const target = projection.outcomesById[relation.targetOutcomeId];
    if (relation.frameworkId !== frameworkId || source.frameworkId !== frameworkId || target.frameworkId !== frameworkId) continue;
    const violation = temporalRelationViolation(projection, relation);
    addEndpoint(source.id, {
      relationId: relation.id,
      relationType: relation.relationType,
      direction: "outgoing",
      peerOutcomeId: target.id,
      peerTitle: target.title,
      violation
    });
    addEndpoint(target.id, {
      relationId: relation.id,
      relationType: relation.relationType,
      direction: "incoming",
      peerOutcomeId: source.id,
      peerTitle: source.title,
      violation
    });
  }
  for (const endpoints of Object.values(relationsByOutcomeId)) {
    endpoints.sort((left, right) => left.direction.localeCompare(right.direction) || RELATION_TYPES.indexOf(left.relationType) - RELATION_TYPES.indexOf(right.relationType) || left.peerTitle.localeCompare(right.peerTitle, "zh-CN") || left.relationId.localeCompare(right.relationId));
  }
  return relationsByOutcomeId;
}
function compareVisiblePlacements(projection, left, right) {
  const leftOutcome = projection.outcomesById[left.outcomeId];
  const rightOutcome = projection.outcomesById[right.outcomeId];
  return compareDate(left.startDate, right.startDate) || compareDate(left.endDateExclusive, right.endDateExclusive) || (leftOutcome?.title || "").localeCompare(rightOutcome?.title || "", "zh-CN") || left.outcomeId.localeCompare(right.outcomeId);
}
function compareMilestoneEntries(left, right) {
  return compareDate(left.targetDate, right.targetDate) || left.achievement.localeCompare(right.achievement, "zh-CN") || left.milestoneId.localeCompare(right.milestoneId);
}
function buildMembershipMilestoneOrderIndex(projection) {
  const memberships = projection.membershipsById || {};
  const outcomes = projection.outcomesById || {};
  const milestones = projection.frameworkMilestonesById || {};
  const milestonesByMembershipId = /* @__PURE__ */ new Map();
  for (const binding of activeValues(projection.frameworkMilestoneBindingsById)) {
    const milestone = milestones[binding.milestoneId];
    if (!milestone || milestone.id !== binding.milestoneId || milestone.status !== "active" || milestone.frameworkId !== binding.frameworkId) continue;
    let membership = null;
    if (binding.targetType === "membership") {
      membership = memberships[binding.targetId];
      if (!membership || membership.id !== binding.targetId) continue;
    } else if (binding.targetType === "outcome") {
      const outcome = outcomes[binding.targetId];
      if (!outcome || outcome.status !== "active" || outcome.id !== binding.targetId) continue;
      membership = memberships[outcome.membershipId];
      if (!membership || membership.id !== outcome.membershipId || outcome.frameworkId !== membership.frameworkId) continue;
    } else {
      continue;
    }
    const frameworkItem = projection.frameworkItemsById?.[membership.frameworkItemId];
    if (membership.status !== "active" || membership.frameworkId !== binding.frameworkId || !membership.frameworkItemId || !frameworkItem || frameworkItem.id !== membership.frameworkItemId || frameworkItem.status !== "active" || frameworkItem.frameworkId !== membership.frameworkId || membership.frameworkItemId !== milestone.frameworkItemId) continue;
    if (!milestonesByMembershipId.has(membership.id)) milestonesByMembershipId.set(membership.id, /* @__PURE__ */ new Map());
    milestonesByMembershipId.get(membership.id).set(milestone.id, {
      milestoneId: milestone.id,
      targetDate: milestone.targetDate,
      achievement: milestone.achievement || ""
    });
  }
  const index = {};
  for (const membership of activeValues(memberships)) {
    index[membership.id] = [...milestonesByMembershipId.get(membership.id)?.values() || []].sort(compareMilestoneEntries);
  }
  return index;
}
function compareMembershipsByMilestoneOrder(milestoneOrderIndex, leftMembershipId, rightMembershipId, fallback = () => 0) {
  const leftSequence = milestoneOrderIndex?.[leftMembershipId] || [];
  const rightSequence = milestoneOrderIndex?.[rightMembershipId] || [];
  const sharedLength = Math.min(leftSequence.length, rightSequence.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const comparison = compareDate(leftSequence[index].targetDate, rightSequence[index].targetDate);
    if (comparison) return comparison;
  }
  if (leftSequence.length !== rightSequence.length) {
    if (!leftSequence.length) return 1;
    if (!rightSequence.length) return -1;
    return leftSequence.length - rightSequence.length;
  }
  return typeof fallback === "function" ? fallback() : 0;
}
function buildFrameworkItemMilestoneOrderIndex(projection) {
  const index = {};
  const items = projection.frameworkItemsById || {};
  for (const item of activeValues(items)) index[item.id] = [];
  for (const milestone of activeValues(projection.frameworkMilestonesById)) {
    const item = items[milestone.frameworkItemId];
    if (!item || item.status !== "active" || item.frameworkId !== milestone.frameworkId) continue;
    index[item.id].push({
      milestoneId: milestone.id,
      targetDate: milestone.targetDate,
      achievement: milestone.achievement || ""
    });
  }
  for (const sequence of Object.values(index)) sequence.sort(compareMilestoneEntries);
  return index;
}
function buildTimeOutcomeStructureGroups(projection, placements, milestoneOrderIndex = null) {
  const grouped = /* @__PURE__ */ new Map();
  for (const placement of placements || []) {
    const outcome = projection.outcomesById[placement.outcomeId];
    if (!outcome || outcome.id !== placement.outcomeId || outcome.status !== "active") continue;
    const membership = projection.membershipsById[outcome.membershipId];
    if (!membership || membership.id !== outcome.membershipId || membership.status !== "active" || membership.frameworkId !== outcome.frameworkId) continue;
    if (membership.frameworkItemId) {
      const item = projection.frameworkItemsById?.[membership.frameworkItemId];
      if (!item || item.id !== membership.frameworkItemId || item.status !== "active" || item.frameworkId !== membership.frameworkId) continue;
    }
    if (!grouped.has(outcome.membershipId)) grouped.set(outcome.membershipId, []);
    grouped.get(outcome.membershipId).push(placement);
  }
  const groups = [...grouped.entries()].map(([membershipId, groupPlacements]) => {
    const membership = projection.membershipsById[membershipId];
    groupPlacements.sort((left, right) => compareVisiblePlacements(projection, left, right));
    return {
      membershipId,
      domain: membership?.primaryRef?.domain || "unknown",
      label: membership?.lastKnownLabel || membership?.labelAtCreation || "\u5931\u8054\u4E3B\u952E",
      firstStartDate: groupPlacements[0]?.startDate || "9999-12-31",
      placements: groupPlacements
    };
  });
  const orderIndex = milestoneOrderIndex || buildMembershipMilestoneOrderIndex(projection);
  groups.sort((left, right) => compareMembershipsByMilestoneOrder(orderIndex, left.membershipId, right.membershipId, () => compareDate(left.firstStartDate, right.firstStartDate) || left.label.localeCompare(right.label, "zh-CN") || left.membershipId.localeCompare(right.membershipId)));
  return groups;
}
function buildTimeFrameworkItemGroups(projection, placements) {
  const itemGroups = /* @__PURE__ */ new Map();
  const membershipOrderIndex = buildMembershipMilestoneOrderIndex(projection);
  const itemOrderIndex = buildFrameworkItemMilestoneOrderIndex(projection);
  for (const placement of placements || []) {
    const outcome = projection.outcomesById?.[placement.outcomeId];
    if (!outcome || outcome.id !== placement.outcomeId || outcome.status !== "active") continue;
    const membership = projection.membershipsById?.[outcome.membershipId];
    if (!membership || membership.id !== outcome.membershipId || membership.status !== "active" || membership.frameworkId !== outcome.frameworkId) continue;
    if (membership.frameworkItemId) {
      const item = projection.frameworkItemsById?.[membership.frameworkItemId];
      if (!item || item.id !== membership.frameworkItemId || item.status !== "active" || item.frameworkId !== membership.frameworkId) continue;
    }
    const key = membership.frameworkItemId || "__unassigned__";
    if (!itemGroups.has(key)) itemGroups.set(key, {
      key,
      frameworkItemId: membership.frameworkItemId || null,
      item: membership.frameworkItemId ? projection.frameworkItemsById?.[membership.frameworkItemId] || null : null,
      placements: []
    });
    itemGroups.get(key).placements.push(placement);
  }
  const groups = [...itemGroups.values()].map((group) => {
    const firstStartDate = group.placements.reduce((earliest, placement) => compareDate(placement.startDate, earliest) < 0 ? placement.startDate : earliest, "9999-12-31");
    return {
      ...group,
      firstStartDate,
      firstMilestoneDate: group.item?.status === "active" ? itemOrderIndex[group.item.id]?.[0]?.targetDate || null : null,
      memberships: buildTimeOutcomeStructureGroups(projection, group.placements, membershipOrderIndex)
    };
  });
  groups.sort((left, right) => {
    if (!left.frameworkItemId && !right.frameworkItemId) return 0;
    if (!left.frameworkItemId) return 1;
    if (!right.frameworkItemId) return -1;
    if (left.firstMilestoneDate && !right.firstMilestoneDate) return -1;
    if (!left.firstMilestoneDate && right.firstMilestoneDate) return 1;
    return (left.firstMilestoneDate && right.firstMilestoneDate ? compareDate(left.firstMilestoneDate, right.firstMilestoneDate) : 0) || compareDate(left.firstStartDate, right.firstStartDate) || (left.item?.title || "").localeCompare(right.item?.title || "", "zh-CN") || left.key.localeCompare(right.key);
  });
  return groups;
}
function buildLocalOutcomeForest(projection, placements, membershipId = null) {
  const placementByOutcomeId = {};
  for (const placement of placements || []) {
    if (projection.outcomesById[placement.outcomeId]?.status === "active") placementByOutcomeId[placement.outcomeId] = placement;
  }
  const visibleIds = new Set(Object.keys(placementByOutcomeId));
  const childrenByParentId = {};
  for (const outcomeId of visibleIds) {
    const outcome = projection.outcomesById[outcomeId];
    const parent = projection.outcomesById[outcome.outlineParentId];
    const parentId = visibleIds.has(outcome.outlineParentId) && (!membershipId || parent?.membershipId === membershipId) ? outcome.outlineParentId : null;
    const key = parentId || "__root__";
    if (!childrenByParentId[key]) childrenByParentId[key] = [];
    childrenByParentId[key].push(outcomeId);
  }
  const compareOutcomeIds = (leftId, rightId) => compareVisiblePlacements(projection, placementByOutcomeId[leftId], placementByOutcomeId[rightId]);
  for (const childIds of Object.values(childrenByParentId)) childIds.sort(compareOutcomeIds);
  return { placementByOutcomeId, childrenByParentId, visibleOutcomeIds: [...visibleIds] };
}
function buildMembershipOutcomeTree(projection, membershipId, options = {}) {
  const diagnostics = [];
  const diagnosticKeys = /* @__PURE__ */ new Set();
  const addDiagnostic = (diagnostic) => {
    const key = `${diagnostic.code}:${diagnostic.outcomeId || ""}:${diagnostic.parentId || ""}:${(diagnostic.outcomeIds || []).join(",")}`;
    if (diagnosticKeys.has(key)) return;
    diagnosticKeys.add(key);
    if (diagnostics.length < 100) diagnostics.push(diagnostic);
    else if (!diagnosticKeys.has("OUTCOME_TREE_DIAGNOSTICS_TRUNCATED")) {
      diagnosticKeys.add("OUTCOME_TREE_DIAGNOSTICS_TRUNCATED");
      diagnostics.push({ code: "OUTCOME_TREE_DIAGNOSTICS_TRUNCATED", message: "\u6210\u679C\u6811\u8BCA\u65AD\u8D85\u8FC7 100 \u6761\uFF0C\u5DF2\u622A\u65AD\u663E\u793A\u3002" });
    }
  };
  const empty = () => ({
    membershipId,
    nodesById: {},
    childrenByParentId: { __root__: [] },
    visibleOutcomeIds: [],
    selectedOutcomeIds: [],
    contextOutcomeIds: [],
    externalParentsByOutcomeId: {},
    diagnostics
  });
  const membership = projection?.membershipsById?.[membershipId];
  if (!membership || membership.id !== membershipId || membership.status !== "active" || !membership.frameworkId) {
    addDiagnostic({ code: "OUTCOME_TREE_MEMBERSHIP_INVALID", outcomeId: null, membershipId, message: "\u4E3B\u952E\u8EAB\u4EFD\u65E0\u6548\uFF0C\u6210\u679C\u6811\u5DF2\u505C\u6B62\u6295\u5F71\u3002" });
    return empty();
  }
  const framework = projection?.frameworksById?.[membership.frameworkId];
  if (!framework || framework.id !== membership.frameworkId || framework.status !== "active") {
    addDiagnostic({ code: "OUTCOME_TREE_FRAMEWORK_INVALID", outcomeId: null, membershipId, frameworkId: membership.frameworkId, message: "\u65F6\u95F4\u6846\u67B6\u8EAB\u4EFD\u65E0\u6548\uFF0C\u6210\u679C\u6811\u5DF2\u505C\u6B62\u6295\u5F71\u3002" });
    return empty();
  }
  const nodesById = {};
  for (const [dictionaryId, outcome] of Object.entries(projection?.outcomesById || {})) {
    if (!outcome || outcome.membershipId !== membershipId || outcome.status !== "active") continue;
    if (!outcome.id || dictionaryId !== outcome.id) {
      addDiagnostic({ code: "OUTCOME_TREE_IDENTITY_INVALID", outcomeId: outcome.id || dictionaryId, membershipId, message: "\u6210\u679C\u5B57\u5178\u8EAB\u4EFD\u4E0D\u4E00\u81F4\uFF0C\u5DF2\u4ECE\u6811\u6295\u5F71\u6392\u9664\u3002" });
      continue;
    }
    if (outcome.frameworkId !== membership.frameworkId) {
      addDiagnostic({ code: "OUTCOME_TREE_FRAMEWORK_MISMATCH", outcomeId: outcome.id, membershipId, message: "\u6210\u679C\u4E0E\u4E3B\u952E\u4E0D\u5C5E\u4E8E\u540C\u4E00\u65F6\u95F4\u6846\u67B6\uFF0C\u5DF2\u4ECE\u6811\u6295\u5F71\u6392\u9664\u3002" });
      continue;
    }
    nodesById[outcome.id] = outcome;
  }
  const compareOutcomeIds = (leftId, rightId) => {
    const leftTitle = String(nodesById[leftId]?.title || "").normalize("NFKC").trim();
    const rightTitle = String(nodesById[rightId]?.title || "").normalize("NFKC").trim();
    return leftTitle.localeCompare(rightTitle, "zh-CN", { numeric: true, sensitivity: "base" }) || leftId.localeCompare(rightId, "en");
  };
  const requestedSelection = Array.isArray(options.selectedOutcomeIds) ? [...new Set(options.selectedOutcomeIds.filter((id) => typeof id === "string"))] : null;
  const selectedIds = (requestedSelection || Object.keys(nodesById)).filter((id) => Boolean(nodesById[id])).sort(compareOutcomeIds);
  const selectedSet = new Set(selectedIds);
  const visibleSet = new Set(selectedIds);
  const closureResolved = /* @__PURE__ */ new Set();
  if (requestedSelection) {
    for (const selectedId of selectedIds) {
      let cursor = nodesById[selectedId];
      const localPath = [];
      const localSeen = /* @__PURE__ */ new Set();
      while (cursor && !closureResolved.has(cursor.id)) {
        if (localSeen.has(cursor.id)) break;
        localSeen.add(cursor.id);
        localPath.push(cursor.id);
        const parentId = cursor.outlineParentId;
        if (!parentId) break;
        const parent = nodesById[parentId];
        if (!parent) break;
        visibleSet.add(parentId);
        cursor = parent;
      }
      for (const id of localPath) closureResolved.add(id);
    }
  }
  const externalParentsByOutcomeId = {};
  const parentById = /* @__PURE__ */ new Map();
  const sortedVisibleIds = [...visibleSet].sort(compareOutcomeIds);
  for (const outcomeId of sortedVisibleIds) {
    const outcome = nodesById[outcomeId];
    const parentId = outcome?.outlineParentId || null;
    if (!parentId) {
      parentById.set(outcomeId, null);
      continue;
    }
    if (visibleSet.has(parentId) && nodesById[parentId]) {
      parentById.set(outcomeId, parentId);
      continue;
    }
    parentById.set(outcomeId, null);
    const rawParent = projection?.outcomesById?.[parentId] || null;
    let reason = "missing";
    if (!rawParent) reason = "missing";
    else if (rawParent.status !== "active") reason = "archived";
    else if (rawParent?.membershipId !== membershipId) reason = "cross-membership";
    else if (rawParent?.frameworkId !== membership.frameworkId) reason = "cross-framework";
    else if (rawParent?.id !== parentId) reason = "identity-invalid";
    externalParentsByOutcomeId[outcomeId] = { reason, parentId, parent: rawParent };
    addDiagnostic({
      code: `OUTCOME_TREE_PARENT_${reason.toUpperCase().replace(/-/g, "_")}`,
      outcomeId,
      parentId,
      message: reason === "cross-membership" ? "\u7236\u6210\u679C\u4F4D\u4E8E\u5176\u4ED6\u4E3B\u952E\uFF0C\u5F53\u524D\u6210\u679C\u4F5C\u4E3A\u672C\u5730\u4E3B\u6839\u663E\u793A\u3002" : "\u7236\u6210\u679C\u4E0D\u53EF\u7528\u4E8E\u5F53\u524D\u6811\uFF0C\u5F53\u524D\u6210\u679C\u4F5C\u4E3A\u672C\u5730\u4E3B\u6839\u663E\u793A\u3002"
    });
  }
  const findCycle = () => {
    const resolved = /* @__PURE__ */ new Set();
    for (const startId of [...sortedVisibleIds].sort((left, right) => left.localeCompare(right, "en"))) {
      if (resolved.has(startId)) continue;
      const path4 = [];
      const position = /* @__PURE__ */ new Map();
      let cursorId = startId;
      while (cursorId && !resolved.has(cursorId)) {
        if (position.has(cursorId)) return path4.slice(position.get(cursorId));
        position.set(cursorId, path4.length);
        path4.push(cursorId);
        cursorId = parentById.get(cursorId) || null;
      }
      for (const id of path4) resolved.add(id);
    }
    return null;
  };
  let cycle = findCycle();
  while (cycle?.length) {
    const cutId = [...cycle].sort((left, right) => left.localeCompare(right, "en"))[0];
    const parentId = parentById.get(cutId) || null;
    parentById.set(cutId, null);
    externalParentsByOutcomeId[cutId] = { reason: "cycle-cut", parentId, parent: projection?.outcomesById?.[parentId] || null };
    addDiagnostic({ code: "OUTCOME_TREE_CYCLE", outcomeId: cutId, parentId, outcomeIds: [...cycle].sort((left, right) => left.localeCompare(right, "en")), message: "\u68C0\u6D4B\u5230\u6210\u679C\u7236\u5B50\u5FAA\u73AF\uFF0C\u5DF2\u5728\u53EA\u8BFB\u6295\u5F71\u4E2D\u786E\u5B9A\u6027\u5207\u65AD\u3002" });
    cycle = findCycle();
  }
  const childrenByParentId = { __root__: [] };
  for (const outcomeId of sortedVisibleIds) {
    const parentId = parentById.get(outcomeId) || null;
    const key = parentId || "__root__";
    if (!childrenByParentId[key]) childrenByParentId[key] = [];
    childrenByParentId[key].push(outcomeId);
  }
  for (const childIds of Object.values(childrenByParentId)) childIds.sort(compareOutcomeIds);
  const contextOutcomeIds = sortedVisibleIds.filter((id) => !selectedSet.has(id));
  return {
    membershipId,
    nodesById: Object.fromEntries(sortedVisibleIds.map((id) => [id, nodesById[id]])),
    childrenByParentId,
    visibleOutcomeIds: sortedVisibleIds,
    selectedOutcomeIds: selectedIds,
    contextOutcomeIds,
    externalParentsByOutcomeId,
    diagnostics
  };
}
function membershipOutcomeIdsOverlappingTimeBox(projection, membershipId, timeBox) {
  const membership = projection?.membershipsById?.[membershipId];
  if (!membership || membership.id !== membershipId || membership.status !== "active" || !membership.frameworkId || !timeBox?.id) return [];
  const framework = projection?.frameworksById?.[membership.frameworkId];
  if (!framework || framework.id !== membership.frameworkId || framework.status !== "active") return [];
  try {
    assertIsoDate(timeBox.startDate, "timeBox.startDate");
    assertIsoDate(timeBox.endDateExclusive, "timeBox.endDateExclusive");
    if (compareDate(timeBox.startDate, timeBox.endDateExclusive) >= 0) return [];
  } catch {
    return [];
  }
  const eligibleOutcomeIds = new Set(Object.entries(projection?.outcomesById || {}).flatMap(([dictionaryId, outcome]) => {
    if (!outcome || dictionaryId !== outcome.id || outcome.status !== "active") return [];
    if (outcome.membershipId !== membershipId || outcome.frameworkId !== membership.frameworkId) return [];
    return [outcome.id];
  }));
  const placementsByOutcomeId = /* @__PURE__ */ new Map();
  const invalidOutcomeIds = /* @__PURE__ */ new Set();
  for (const [dictionaryId, placement] of Object.entries(projection?.placementsById || {})) {
    if (!placement || dictionaryId !== placement.id || placement.status !== "active" || !eligibleOutcomeIds.has(placement.outcomeId)) continue;
    if (placement.frameworkId !== membership.frameworkId) continue;
    try {
      assertIsoDate(placement.startDate, "placement.startDate");
      assertIsoDate(placement.endDateExclusive, "placement.endDateExclusive");
      if (compareDate(placement.startDate, placement.endDateExclusive) >= 0) continue;
    } catch {
      continue;
    }
    if (placementsByOutcomeId.has(placement.outcomeId)) {
      invalidOutcomeIds.add(placement.outcomeId);
      continue;
    }
    placementsByOutcomeId.set(placement.outcomeId, placement);
  }
  return [...eligibleOutcomeIds].filter((outcomeId) => !invalidOutcomeIds.has(outcomeId) && placementOverlapsBox(placementsByOutcomeId.get(outcomeId), timeBox)).sort((left, right) => left.localeCompare(right, "en"));
}
function buildTimeBoxPlacementSelection(projection, frameworkId, timeBox, options = {}) {
  const empty = () => ({
    frameworkId,
    timeBoxId: timeBox?.id || null,
    placements: [],
    placementByOutcomeId: {},
    selectedOutcomeIds: [],
    invalidOutcomeIds: []
  });
  const framework = projection?.frameworksById?.[frameworkId];
  if (!framework || framework.id !== frameworkId || framework.status !== "active" || !timeBox?.id) return empty();
  try {
    assertIsoDate(timeBox.startDate, "timeBox.startDate");
    assertIsoDate(timeBox.endDateExclusive, "timeBox.endDateExclusive");
    if (compareDate(timeBox.startDate, timeBox.endDateExclusive) >= 0) return empty();
  } catch {
    return empty();
  }
  const allowedOutcomeIds = options.allowedOutcomeIds == null ? null : new Set(options.allowedOutcomeIds);
  const eligibleOutcomesById = /* @__PURE__ */ new Map();
  for (const [dictionaryId, outcome] of Object.entries(projection?.outcomesById || {})) {
    if (!outcome || dictionaryId !== outcome.id || outcome.status !== "active" || outcome.frameworkId !== frameworkId) continue;
    const membership = projection?.membershipsById?.[outcome.membershipId];
    if (!membership || membership.id !== outcome.membershipId || membership.status !== "active" || membership.frameworkId !== frameworkId) continue;
    eligibleOutcomesById.set(outcome.id, outcome);
  }
  const placementByOutcomeId = /* @__PURE__ */ new Map();
  const seenActiveOutcomeIds = /* @__PURE__ */ new Set();
  const invalidOutcomeIds = /* @__PURE__ */ new Set();
  for (const [dictionaryId, placement] of Object.entries(projection?.placementsById || {})) {
    if (!placement || placement.status !== "active" || !eligibleOutcomesById.has(placement.outcomeId)) continue;
    if (seenActiveOutcomeIds.has(placement.outcomeId)) invalidOutcomeIds.add(placement.outcomeId);
    seenActiveOutcomeIds.add(placement.outcomeId);
    if (dictionaryId !== placement.id || placement.frameworkId !== frameworkId) {
      invalidOutcomeIds.add(placement.outcomeId);
      continue;
    }
    try {
      assertIsoDate(placement.startDate, "placement.startDate");
      assertIsoDate(placement.endDateExclusive, "placement.endDateExclusive");
      if (compareDate(placement.startDate, placement.endDateExclusive) >= 0) {
        invalidOutcomeIds.add(placement.outcomeId);
        continue;
      }
    } catch {
      invalidOutcomeIds.add(placement.outcomeId);
      continue;
    }
    placementByOutcomeId.set(placement.outcomeId, placement);
  }
  const placements = [...eligibleOutcomesById.keys()].filter((outcomeId) => !invalidOutcomeIds.has(outcomeId)).filter((outcomeId) => allowedOutcomeIds == null || allowedOutcomeIds.has(outcomeId)).map((outcomeId) => placementByOutcomeId.get(outcomeId)).filter((placement) => placementOverlapsBox(placement, timeBox)).sort((left, right) => compareDate(left.startDate, right.startDate) || compareDate(left.endDateExclusive, right.endDateExclusive) || left.outcomeId.localeCompare(right.outcomeId, "en") || left.id.localeCompare(right.id, "en"));
  const selectedPlacementByOutcomeId = Object.fromEntries(placements.map((placement) => [placement.outcomeId, placement]));
  return {
    frameworkId,
    timeBoxId: timeBox.id,
    placements,
    placementByOutcomeId: selectedPlacementByOutcomeId,
    selectedOutcomeIds: placements.map((placement) => placement.outcomeId),
    invalidOutcomeIds: [...invalidOutcomeIds].sort((left, right) => left.localeCompare(right, "en"))
  };
}
function collectOutcomeTreeDescendantIds(childrenByParentId, outcomeId) {
  const ordered = [];
  const visited = /* @__PURE__ */ new Set([outcomeId]);
  const pending = [...childrenByParentId?.[outcomeId] || []].reverse();
  while (pending.length) {
    const childId = pending.pop();
    if (!childId || visited.has(childId)) continue;
    visited.add(childId);
    ordered.push(childId);
    const children = childrenByParentId?.[childId] || [];
    for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
  }
  return ordered;
}
function placementForCandidate(projection, outcomeId, candidate) {
  return candidate?.outcomeId === outcomeId ? candidate : outcomePlacement(projection, outcomeId);
}
function diagnosticKey(diagnostic) {
  return diagnostic.constraintId || [diagnostic.code, ...(diagnostic.outcomeIds || []).slice().sort(), diagnostic.relationId || ""].join("|");
}
function uniqueConstraintDiagnostics(diagnostics) {
  const unique = /* @__PURE__ */ new Map();
  for (const diagnostic of diagnostics) {
    const key = diagnosticKey(diagnostic);
    const current = unique.get(key);
    if (!current) {
      unique.set(key, {
        ...diagnostic,
        outcomeIds: [...new Set(diagnostic.outcomeIds || [])],
        adjustableOutcomeIds: [...new Set(diagnostic.adjustableOutcomeIds || [])]
      });
      continue;
    }
    current.outcomeIds = [.../* @__PURE__ */ new Set([...current.outcomeIds, ...diagnostic.outcomeIds || []])];
    current.adjustableOutcomeIds = [.../* @__PURE__ */ new Set([...current.adjustableOutcomeIds, ...diagnostic.adjustableOutcomeIds || []])];
    current.blocker = current.blocker || diagnostic.blocker;
  }
  return [...unique.values()];
}
function projectionWithPlacementCandidates(projection, candidates) {
  const jointProjection = structuredClone(projection);
  for (const candidate of candidates) {
    const current = outcomePlacement(jointProjection, candidate.outcomeId);
    const placementId = current?.id || candidate.id || `candidate_placement_${candidate.outcomeId}`;
    if (current && current.id !== placementId) delete jointProjection.placementsById[current.id];
    jointProjection.placementsById[placementId] = {
      ...structuredClone(current || {}),
      ...structuredClone(candidate),
      id: placementId,
      placementId,
      outcomeId: candidate.outcomeId,
      status: "active"
    };
  }
  return jointProjection;
}
function placementConstraintDiagnostics(projection, outcomeIds, options = {}) {
  const selected = new Set(outcomeIds || []);
  const includeUnavailableConstraints = options.includeUnavailableConstraints !== false;
  const diagnostics = [];
  for (const outcomeId of selected) {
    const outcome = projection.outcomesById[outcomeId];
    const candidate = outcomePlacement(projection, outcomeId);
    if (!outcome || outcome.status !== "active" || !candidate) {
      diagnostics.push({
        code: "OUTCOME_OR_PLACEMENT_UNAVAILABLE",
        constraintType: "identity",
        constraintId: `identity:${outcomeId}`,
        outcomeIds: [outcomeId],
        adjustableOutcomeIds: [],
        blocker: true,
        message: "\u627E\u4E0D\u5230\u53EF\u8054\u5408\u8C03\u6574\u7684\u9636\u6BB5\u6210\u679C\u6216\u6709\u6548\u65F6\u95F4\u5B89\u6392"
      });
      continue;
    }
    if (outcome.outlineParentId) {
      const parent = projection.outcomesById[outcome.outlineParentId];
      const parentPlacement = outcomePlacement(projection, outcome.outlineParentId);
      if (!parent || parent.status !== "active") {
        diagnostics.push({
          code: "PARENT_UNAVAILABLE",
          constraintType: "containment",
          constraintId: `parent-unavailable:${outcome.id}:${outcome.outlineParentId}`,
          outcomeIds: [outcome.id, outcome.outlineParentId],
          adjustableOutcomeIds: [],
          blocker: true,
          message: "\u4E0A\u7EA7\u6210\u679C\u5DF2\u505C\u7528\u6216\u5931\u8054\uFF0C\u8BF7\u5148\u8C03\u6574\u6210\u679C\u5C42\u7EA7"
        });
      } else if (!parentPlacement) {
        diagnostics.push({
          code: "PARENT_PLACEMENT_MISSING",
          constraintType: "containment",
          constraintId: `parent-placement-missing:${parent.id}:${outcome.id}`,
          outcomeIds: [parent.id, outcome.id],
          adjustableOutcomeIds: [outcome.id],
          blocker: true,
          message: `\u4E0A\u7EA7\u6210\u679C\u201C${parent.title}\u201D\u5C1A\u672A\u5B89\u6392\u65F6\u95F4\uFF0C\u65E0\u6CD5\u52A0\u5165\u6ED1\u8F68`
        });
      } else if (!intervalContains(parentPlacement, candidate)) {
        diagnostics.push({
          code: "OUTCOME_CONTAINMENT",
          constraintType: "containment",
          constraintId: `containment:${parent.id}:${outcome.id}`,
          outcomeIds: [parent.id, outcome.id],
          adjustableOutcomeIds: [parent.id, outcome.id],
          blocker: false,
          message: `\u4E0A\u7EA7\u6210\u679C\u201C${parent.title}\u201D\u5FC5\u987B\u5B8C\u6574\u5305\u542B\u5B50\u6210\u679C\u201C${outcome.title}\u201D\u7684\u65F6\u95F4\u533A\u95F4`
        });
      }
    }
    const children = activeValues(projection.outcomesById).filter((item) => item.outlineParentId === outcome.id);
    for (const child of children) {
      const childPlacement = outcomePlacement(projection, child.id);
      if (!childPlacement) {
        if (includeUnavailableConstraints) {
          diagnostics.push({
            code: "CHILD_PLACEMENT_MISSING",
            constraintType: "containment",
            constraintId: `child-placement-missing:${outcome.id}:${child.id}`,
            outcomeIds: [outcome.id, child.id],
            adjustableOutcomeIds: [outcome.id],
            blocker: true,
            message: `\u5B50\u6210\u679C\u201C${child.title}\u201D\u5C1A\u672A\u5B89\u6392\u65F6\u95F4\uFF0C\u65E0\u6CD5\u52A0\u5165\u6ED1\u8F68`
          });
        }
        continue;
      }
      if (!intervalContains(candidate, childPlacement)) {
        diagnostics.push({
          code: "OUTCOME_CONTAINMENT",
          constraintType: "containment",
          constraintId: `containment:${outcome.id}:${child.id}`,
          outcomeIds: [outcome.id, child.id],
          adjustableOutcomeIds: [outcome.id, child.id],
          blocker: false,
          message: `\u4E0A\u7EA7\u6210\u679C\u201C${outcome.title}\u201D\u5FC5\u987B\u5B8C\u6574\u5305\u542B\u5B50\u6210\u679C\u201C${child.title}\u201D\u7684\u65F6\u95F4\u533A\u95F4`
        });
      }
    }
  }
  for (const relation of activeValues(projection.relationsById)) {
    if (!selected.has(relation.sourceOutcomeId) && !selected.has(relation.targetOutcomeId)) continue;
    const source = projection.outcomesById[relation.sourceOutcomeId];
    const target = projection.outcomesById[relation.targetOutcomeId];
    const unavailable = [source, target].filter((outcome) => !outcome || outcome.status !== "active");
    if (unavailable.length && includeUnavailableConstraints) {
      diagnostics.push({
        code: "RELATION_ENDPOINT_UNAVAILABLE",
        constraintType: "relation",
        constraintId: `relation-endpoint-unavailable:${relation.id}`,
        relationId: relation.id,
        outcomeIds: [relation.sourceOutcomeId, relation.targetOutcomeId],
        adjustableOutcomeIds: [],
        blocker: true,
        message: `\u5173\u7CFB\u201C${relation.id}\u201D\u8FDE\u63A5\u7684\u9636\u6BB5\u6210\u679C\u5DF2\u505C\u7528\u6216\u5931\u8054\uFF0C\u8BF7\u5148\u4FEE\u590D\u6216\u89E3\u9664\u8BE5\u5173\u7CFB`
      });
      continue;
    }
    const sourcePlacement = outcomePlacement(projection, relation.sourceOutcomeId);
    const targetPlacement = outcomePlacement(projection, relation.targetOutcomeId);
    if ((!sourcePlacement || !targetPlacement) && includeUnavailableConstraints) {
      const missingTitles = [sourcePlacement ? null : source.title, targetPlacement ? null : target.title].filter(Boolean);
      diagnostics.push({
        code: "RELATION_PLACEMENT_MISSING",
        constraintType: "relation",
        constraintId: `relation-placement-missing:${relation.id}`,
        relationId: relation.id,
        outcomeIds: [relation.sourceOutcomeId, relation.targetOutcomeId],
        adjustableOutcomeIds: [sourcePlacement ? relation.sourceOutcomeId : null, targetPlacement ? relation.targetOutcomeId : null].filter(Boolean),
        blocker: true,
        message: `\u5173\u7CFB\u7AEF\u70B9\u201C${missingTitles.join("\u3001")}\u201D\u5C1A\u672A\u5B89\u6392\u65F6\u95F4\uFF0C\u65E0\u6CD5\u52A0\u5165\u6ED1\u8F68`
      });
      continue;
    }
    if (!sourcePlacement || !targetPlacement) continue;
    const violation = temporalRelationViolationForPlacements(projection, relation, sourcePlacement, targetPlacement);
    if (!violation) continue;
    diagnostics.push({
      code: "TEMPORAL_RELATION",
      constraintType: "relation",
      constraintId: `relation:${relation.id}`,
      relationId: relation.id,
      outcomeIds: [relation.sourceOutcomeId, relation.targetOutcomeId],
      adjustableOutcomeIds: [sourcePlacement ? relation.sourceOutcomeId : null, targetPlacement ? relation.targetOutcomeId : null].filter(Boolean),
      blocker: false,
      message: violation
    });
  }
  return uniqueConstraintDiagnostics(diagnostics);
}
function temporalRelationViolation(projection, relation, candidate = null) {
  const source = projection.outcomesById[relation.sourceOutcomeId];
  const target = projection.outcomesById[relation.targetOutcomeId];
  if (source?.status !== "active" || target?.status !== "active") return null;
  const sourcePlacement = placementForCandidate(projection, relation.sourceOutcomeId, candidate);
  const targetPlacement = placementForCandidate(projection, relation.targetOutcomeId, candidate);
  return temporalRelationViolationForPlacements(projection, relation, sourcePlacement, targetPlacement);
}
function temporalRelationViolationForPlacements(projection, relation, sourcePlacement, targetPlacement) {
  const source = projection.outcomesById[relation.sourceOutcomeId];
  const target = projection.outcomesById[relation.targetOutcomeId];
  if (source?.status !== "active" || target?.status !== "active") return null;
  if (!sourcePlacement || !targetPlacement) return null;
  if (relation.relationType === "precedes" && compareDate(sourcePlacement.endDateExclusive, targetPlacement.startDate) > 0) {
    return `\u201C${source.title}\u201D\u5FC5\u987B\u5728\u201C${target.title}\u201D\u5F00\u59CB\u524D\u7ED3\u675F`;
  }
  if (relation.relationType === "requires" && compareDate(effectiveDueOn(sourcePlacement), targetPlacement.startDate) >= 0) {
    return `\u524D\u7F6E\u6210\u679C\u201C${source.title}\u201D\u7684\u76EE\u6807\u5B8C\u6210\u65E5\u5FC5\u987B\u65E9\u4E8E\u201C${target.title}\u201D\u5F00\u59CB\u65E5`;
  }
  if (relation.relationType === "contributes_to" && compareDate(effectiveDueOn(sourcePlacement), effectiveDueOn(targetPlacement)) > 0) {
    return `\u6C47\u805A\u6210\u679C\u201C${source.title}\u201D\u7684\u76EE\u6807\u5B8C\u6210\u65E5\u4E0D\u80FD\u665A\u4E8E\u5173\u53E3\u201C${target.title}\u201D`;
  }
  return null;
}
function assertPlacementShape(input) {
  assertIsoDate(input.startDate, "startDate");
  assertIsoDate(input.endDateExclusive, "endDateExclusive");
  if (compareDate(input.startDate, input.endDateExclusive) >= 0) throw new Error("\u7ED3\u675F\u8FB9\u754C\u5FC5\u987B\u665A\u4E8E\u5F00\u59CB\u65E5\u671F");
  if (input.dueOn) {
    assertIsoDate(input.dueOn, "dueOn");
    if (compareDate(input.dueOn, input.startDate) < 0 || compareDate(input.dueOn, input.endDateExclusive) >= 0) {
      throw new Error("\u76EE\u6807\u5B8C\u6210\u65E5\u5FC5\u987B\u4F4D\u4E8E\u6210\u679C\u65F6\u95F4\u533A\u95F4\u5185");
    }
  }
  if (!TIME_SCALES.includes(input.declaredScale)) throw new Error("\u5B9A\u951A\u5C3A\u5EA6\u65E0\u6548");
}
function placementAdmissionViolations(projection, input) {
  const outcome = projection.outcomesById[input.outcomeId];
  if (!outcome || outcome.status !== "active") return ["\u627E\u4E0D\u5230\u53EF\u5B89\u6392\u7684\u9636\u6BB5\u6210\u679C"];
  const candidate = {
    ...outcomePlacement(projection, input.outcomeId),
    ...input,
    status: "active"
  };
  return placementConstraintDiagnostics(projectionWithPlacementCandidates(projection, [candidate]), [outcome.id], {
    includeUnavailableConstraints: false
  }).map((item) => item.message);
}
function placementConstraintSummary(projection, outcomeId) {
  const outcome = projection.outcomesById[outcomeId];
  if (!outcome) return [];
  const constraints = [];
  const parentPlacement = outcome.outlineParentId ? outcomePlacement(projection, outcome.outlineParentId) : null;
  if (parentPlacement) constraints.push(`\u4E0A\u7EA7\u8FB9\u754C ${parentPlacement.startDate} - ${addDays(parentPlacement.endDateExclusive, -1)}`);
  for (const relation of activeTemporalRelations(projection)) {
    const sourcePlacement = outcomePlacement(projection, relation.sourceOutcomeId);
    const targetPlacement = outcomePlacement(projection, relation.targetOutcomeId);
    if (relation.targetOutcomeId === outcomeId && sourcePlacement) {
      if (relation.relationType === "precedes") constraints.push(`\u4E0D\u5F97\u65E9\u4E8E ${sourcePlacement.endDateExclusive} \u5F00\u59CB\uFF08\u5148\u540E\uFF09`);
      if (relation.relationType === "requires") constraints.push(`\u4E0D\u5F97\u65E9\u4E8E ${addDays(effectiveDueOn(sourcePlacement), 1)} \u5F00\u59CB\uFF08\u524D\u7F6E\uFF09`);
      if (relation.relationType === "contributes_to") constraints.push(`\u76EE\u6807\u5B8C\u6210\u65E5\u4E0D\u5F97\u65E9\u4E8E ${effectiveDueOn(sourcePlacement)}\uFF08\u6C47\u805A\uFF09`);
    }
    if (relation.sourceOutcomeId === outcomeId && targetPlacement) {
      if (relation.relationType === "precedes") constraints.push(`\u4E0D\u5F97\u665A\u4E8E ${targetPlacement.startDate} \u7ED3\u675F\uFF08\u5148\u540E\uFF09`);
      if (relation.relationType === "requires") constraints.push(`\u76EE\u6807\u5B8C\u6210\u65E5\u987B\u65E9\u4E8E ${targetPlacement.startDate}\uFF08\u524D\u7F6E\uFF09`);
      if (relation.relationType === "contributes_to") constraints.push(`\u76EE\u6807\u5B8C\u6210\u65E5\u4E0D\u5F97\u665A\u4E8E ${effectiveDueOn(targetPlacement)}\uFF08\u6C47\u805A\uFF09`);
    }
  }
  return constraints;
}
function createFramework(store, input, options = {}) {
  const frameworkId = options.frameworkId || stableId("framework");
  const title = text2(input.title);
  if (!title) throw new Error("\u6846\u67B6\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
  assertIsoDate(input.startDate, "startDate");
  assertIsoDate(input.endDateExclusive, "endDateExclusive");
  if (compareDate(input.startDate, input.endDateExclusive) >= 0) throw new Error("\u6846\u67B6\u7ED3\u675F\u65E5\u671F\u5FC5\u987B\u665A\u4E8E\u5F00\u59CB\u65E5\u671F");
  appendDomainEvent(store, "frameworkEventsById", "create", {
    frameworkId,
    title,
    startDate: input.startDate,
    endDateExclusive: input.endDateExclusive,
    timezone: text2(input.timezone, store.timezone || "Asia/Shanghai"),
    calendar: text2(input.calendar, store.calendar || "iso8601"),
    policyVersion: Number(input.policyVersion || store.policyVersion || 1)
  }, options);
  return frameworkId;
}
function sameCanonicalTimeBox(left, right) {
  return ["id", "scale", "startDate", "endDateExclusive", "timezone", "calendar", "policyVersion"].every((key) => left?.[key] === right?.[key]);
}
function frameworkBoundaryConflicts(projection, frameworkId, input = {}) {
  const framework = projection.frameworksById?.[frameworkId];
  if (!framework || framework.status !== "active") throw new Error("\u627E\u4E0D\u5230\u53EF\u8C03\u6574\u7684\u65F6\u95F4\u6846\u67B6");
  assertIsoDate(input.startDate, "startDate");
  assertIsoDate(input.endDateExclusive, "endDateExclusive");
  if (compareDate(input.startDate, input.endDateExclusive) >= 0) throw new Error("\u6846\u67B6\u7ED3\u675F\u8FB9\u754C\u5FC5\u987B\u665A\u4E8E\u5F00\u59CB\u65E5\u671F");
  const conflicts = [];
  for (const milestone of activeValues(projection.frameworkMilestonesById).filter((item) => item.frameworkId === frameworkId)) {
    if (compareDate(milestone.targetDate, input.startDate) < 0 || compareDate(milestone.targetDate, input.endDateExclusive) >= 0) {
      conflicts.push({ type: "milestone_outside", milestoneId: milestone.id, label: milestone.achievement, targetDate: milestone.targetDate });
    }
  }
  for (const placement of activeValues(projection.placementsById).filter((item) => item.frameworkId === frameworkId)) {
    const left = compareDate(placement.startDate, input.startDate) < 0;
    const right = compareDate(placement.endDateExclusive, input.endDateExclusive) > 0;
    if (!left && !right) continue;
    const outcome = projection.outcomesById?.[placement.outcomeId];
    conflicts.push({
      type: "placement_outside",
      placementId: placement.id,
      outcomeId: placement.outcomeId,
      label: outcome?.title || placement.outcomeId,
      startDate: placement.startDate,
      endDateExclusive: placement.endDateExclusive,
      direction: left && right ? "both" : left ? "left" : "right"
    });
  }
  for (const coverage of activeValues(projection.coverageById).filter((item) => item.frameworkId === frameworkId)) {
    const box = coverage.timeBoxRef;
    let canonical = null;
    try {
      canonical = canonicalTimeBox(box?.scale, box?.startDate, framework);
    } catch {
      canonical = null;
    }
    if (!canonical || !sameCanonicalTimeBox(box, canonical) || Number(coverage.policyVersion) !== Number(framework.policyVersion)) {
      const membership2 = projection.membershipsById?.[coverage.membershipId];
      conflicts.push({
        type: "coverage_address_anomaly",
        coverageId: coverage.id,
        membershipId: coverage.membershipId,
        label: membership2?.lastKnownLabel || membership2?.labelAtCreation || coverage.membershipId,
        startDate: box?.startDate || "",
        endDateExclusive: box?.endDateExclusive || ""
      });
      continue;
    }
    if (intervalsOverlap(box.startDate, box.endDateExclusive, input.startDate, input.endDateExclusive)) continue;
    const membership = projection.membershipsById?.[coverage.membershipId];
    conflicts.push({
      type: "coverage_excluded",
      coverageId: coverage.id,
      membershipId: coverage.membershipId,
      label: membership?.lastKnownLabel || membership?.labelAtCreation || coverage.membershipId,
      startDate: box.startDate,
      endDateExclusive: box.endDateExclusive,
      direction: compareDate(box.endDateExclusive, input.startDate) <= 0 ? "left" : "right"
    });
  }
  return conflicts;
}
function reviseFrameworkBoundary(store, input = {}, options = {}) {
  const allowed = /* @__PURE__ */ new Set(["frameworkId", "startDate", "endDateExclusive", "reason"]);
  const unexpected = Object.keys(input).filter((key) => !allowed.has(key));
  if (unexpected.length) throw new Error(`\u65F6\u95F4\u6846\u67B6\u8FB9\u754C\u63A5\u53E3\u4E0D\u63A5\u53D7\u5B57\u6BB5\uFF1A${unexpected.join("\u3001")}`);
  const reason = text2(input.reason);
  if (!reason) throw new Error("\u8BF7\u586B\u5199\u8C03\u6574\u65F6\u95F4\u6846\u67B6\u8FB9\u754C\u7684\u539F\u56E0");
  const projection = reduceTemporalStore(store);
  const framework = projection.frameworksById?.[input.frameworkId];
  if (!framework || framework.status !== "active") throw new Error("\u627E\u4E0D\u5230\u53EF\u8C03\u6574\u7684\u65F6\u95F4\u6846\u67B6");
  if (framework.startDate === input.startDate && framework.endDateExclusive === input.endDateExclusive) {
    throw new Error("\u65F6\u95F4\u6846\u67B6\u8FB9\u754C\u6CA1\u6709\u53D8\u5316");
  }
  const conflicts = frameworkBoundaryConflicts(projection, input.frameworkId, input);
  if (conflicts.length) {
    const error = new Error(`${conflicts.length} \u9879\u5DF2\u6709\u65F6\u95F4\u5185\u5BB9\u4E0E\u65B0\u8FB9\u754C\u51B2\u7A81`);
    error.code = "FRAMEWORK_BOUNDARY_CONFLICT";
    error.conflicts = conflicts;
    throw error;
  }
  appendDomainEvent(store, "frameworkEventsById", "revise", {
    frameworkId: input.frameworkId,
    patch: { startDate: input.startDate, endDateExclusive: input.endDateExclusive },
    reason
  }, options);
  return input.frameworkId;
}
function admitMembership(store, input, options = {}) {
  const membershipId = options.membershipId || stableId("membership");
  const primaryRef = normalizePrimaryRef(input.primaryRef);
  const label = text2(input.labelAtCreation || input.lastKnownLabel);
  if (!label) throw new Error("\u4E3B\u952E\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
  const projection = reduceTemporalStore(store);
  const identityKey = primaryRefKey(primaryRef);
  const duplicate = Object.values(projection.membershipsById).find((membership) => membership.frameworkId === input.frameworkId && primaryRefKey(membership.primaryRef) === identityKey);
  if (duplicate) throw new Error("\u8BE5\u4E3B\u952E\u66FE\u7ECF\u7EB3\u5165\u5F53\u524D\u65F6\u95F4\u6846\u67B6\uFF0C\u8BF7\u6062\u590D\u539F\u6709\u4E3B\u952E\u8BB0\u5F55");
  appendDomainEvent(store, "membershipEventsById", "admit", {
    membershipId,
    frameworkId: input.frameworkId,
    primaryRef,
    labelAtCreation: label,
    lastKnownLabel: text2(input.lastKnownLabel, label),
    planningStart: input.planningStart,
    planningEndDateExclusive: input.planningEndDateExclusive
  }, options);
  return membershipId;
}
function membershipExitBlockers(projection, membershipId) {
  const membership = projection.membershipsById?.[membershipId];
  if (!membership) return [{ code: "membership_not_found", message: "\u627E\u4E0D\u5230\u8981\u79FB\u51FA\u7684\u76EE\u6807\u6216\u9879\u76EE\u4E3B\u952E" }];
  if (membership.status !== "active") return [{ code: "membership_not_active", message: "\u8BE5\u76EE\u6807\u6216\u9879\u76EE\u5DF2\u4E0D\u5728\u65F6\u95F4\u6846\u67B6\u4E2D" }];
  const blockers = [];
  const outcomes = Object.values(projection.outcomesById || {}).filter((outcome) => outcome.membershipId === membershipId);
  if (outcomes.length) blockers.push({ code: "membership_has_outcomes", message: `\u8BE5\u4E3B\u952E\u5DF2\u7ECF\u5F62\u6210\u8FC7 ${outcomes.length} \u4E2A\u9636\u6BB5\u6210\u679C\uFF0C\u4E0D\u80FD\u79FB\u51FA\u65F6\u95F4\u6846\u67B6` });
  const coverage = activeValues(projection.coverageById).filter((item) => item.membershipId === membershipId);
  if (coverage.length) blockers.push({ code: "membership_has_active_coverage", message: `\u8BE5\u4E3B\u952E\u4ECD\u6709 ${coverage.length} \u9879\u201C\u672C\u9636\u6BB5\u65E0\u90E8\u7F72\u201D\u8BB0\u5F55\uFF0C\u8BF7\u5148\u64A4\u9500` });
  const boundTargetIds = /* @__PURE__ */ new Set([membershipId, ...Object.values(projection.outcomesById || {}).filter((outcome) => outcome.membershipId === membershipId).map((outcome) => outcome.id)]);
  const bindings = activeValues(projection.frameworkMilestoneBindingsById).filter((binding) => boundTargetIds.has(binding.targetId));
  if (bindings.length) blockers.push({ code: "membership_has_milestone_bindings", message: `\u8BE5\u4E3B\u952E\u4ECD\u6709 ${bindings.length} \u9879\u6846\u67B6\u91CC\u7A0B\u7891\u5173\u8054\uFF0C\u8BF7\u5148\u89E3\u9664` });
  return blockers;
}
function exitMembership(store, input, options = {}) {
  const reason = text2(input.reason);
  if (!reason) throw new Error("\u79FB\u51FA\u65F6\u95F4\u6846\u67B6\u9700\u8981\u586B\u5199\u539F\u56E0");
  const projection = reduceTemporalStore(store);
  const blockers = membershipExitBlockers(projection, input.membershipId);
  if (blockers.length) {
    const error = new Error(blockers.map((blocker) => blocker.message).join("\uFF1B"));
    error.code = "MEMBERSHIP_EXIT_BLOCKED";
    error.blockers = blockers;
    throw error;
  }
  appendDomainEvent(store, "membershipEventsById", "exit", {
    membershipId: input.membershipId,
    reason
  }, options);
  return input.membershipId;
}
function reinstateMembership(store, input, options = {}) {
  const projection = reduceTemporalStore(store);
  const membership = projection.membershipsById?.[input.membershipId];
  if (!membership) throw new Error("\u627E\u4E0D\u5230\u8981\u6062\u590D\u7684\u76EE\u6807\u6216\u9879\u76EE\u4E3B\u952E");
  if (membership.status !== "exited") throw new Error("\u8BE5\u76EE\u6807\u6216\u9879\u76EE\u5DF2\u7ECF\u5728\u65F6\u95F4\u6846\u67B6\u4E2D");
  const lastKnownLabel = text2(input.lastKnownLabel, membership.lastKnownLabel);
  if (!lastKnownLabel) throw new Error("\u4E3B\u952E\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
  appendDomainEvent(store, "membershipEventsById", "reinstate", {
    membershipId: membership.id,
    patch: {
      lastKnownLabel,
      sourceState: text2(input.sourceState, "fresh"),
      planningStart: input.planningStart ?? membership.planningStart,
      planningEndDateExclusive: input.planningEndDateExclusive ?? membership.planningEndDateExclusive
    }
  }, options);
  return membership.id;
}
function frameworkItemBindingBlockers(projection, membershipId) {
  const targetIds = /* @__PURE__ */ new Set([membershipId, ...Object.values(projection.outcomesById || {}).filter((outcome) => outcome.membershipId === membershipId).map((outcome) => outcome.id)]);
  return activeValues(projection.frameworkMilestoneBindingsById).filter((binding) => targetIds.has(binding.targetId));
}
function createFrameworkItem(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const framework = projection.frameworksById[input.frameworkId];
  const title = text2(input.title);
  if (!framework || framework.status !== "active") throw new Error("\u627E\u4E0D\u5230\u5F53\u524D\u65F6\u95F4\u6846\u67B6");
  if (!title) throw new Error("\u6846\u67B6\u6761\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
  const frameworkItemId = options.frameworkItemId || stableId("framework_item");
  appendDomainEvent(store, "frameworkEventsById", "item-create", {
    frameworkItemId,
    frameworkId: input.frameworkId,
    title,
    description: text2(input.description)
  }, options);
  return frameworkItemId;
}
function reviseFrameworkItem(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const item = reduceTemporalStore(store).frameworkItemsById[input.frameworkItemId];
  const title = text2(input.title);
  if (!item || item.status !== "active") throw new Error("\u6846\u67B6\u6761\u76EE\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
  if (!title) throw new Error("\u6846\u67B6\u6761\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
  appendDomainEvent(store, "frameworkEventsById", "item-revise", { frameworkItemId: item.id, patch: { title, description: text2(input.description) } }, options);
  return item.id;
}
function archiveFrameworkItem(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const item = projection.frameworkItemsById[input.frameworkItemId];
  if (!item || item.status !== "active") throw new Error("\u6846\u67B6\u6761\u76EE\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
  if (activeValues(projection.membershipsById).some((membership) => membership.frameworkItemId === item.id)) throw new Error("\u6846\u67B6\u6761\u76EE\u4ECD\u5305\u542B\u76EE\u6807\u6216\u9879\u76EE\uFF0C\u4E0D\u80FD\u505C\u7528");
  if (activeValues(projection.frameworkMilestonesById).some((milestone) => milestone.frameworkItemId === item.id)) throw new Error("\u6846\u67B6\u6761\u76EE\u4ECD\u6709\u6709\u6548\u91CC\u7A0B\u7891\uFF0C\u4E0D\u80FD\u505C\u7528");
  appendDomainEvent(store, "frameworkEventsById", "item-archive", { frameworkItemId: item.id, reason: text2(input.reason, "\u6846\u67B6\u6761\u76EE\u505C\u7528") }, options);
}
function assignMembershipFrameworkItem(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const membership = projection.membershipsById[input.membershipId];
  if (!membership || membership.status !== "active") throw new Error("\u76EE\u6807\u6216\u9879\u76EE\u4E0D\u5728\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u4E2D");
  const frameworkItemId = input.frameworkItemId || null;
  const item = frameworkItemId ? projection.frameworkItemsById[frameworkItemId] : null;
  if (frameworkItemId && (!item || item.status !== "active" || item.frameworkId !== membership.frameworkId)) throw new Error("\u76EE\u6807\u6846\u67B6\u6761\u76EE\u65E0\u6548");
  if (membership.frameworkItemId === frameworkItemId) throw new Error("\u5F52\u5C5E\u6CA1\u6709\u53D8\u5316");
  const blockers = frameworkItemBindingBlockers(projection, membership.id);
  if (blockers.length) throw new Error(`\u8BE5\u4E3B\u952E\u53CA\u5176\u6210\u679C\u4ECD\u6709 ${blockers.length} \u9879\u6846\u67B6\u91CC\u7A0B\u7891\u5173\u8054\uFF0C\u8BF7\u5148\u89E3\u9664`);
  appendDomainEvent(store, "membershipEventsById", "assign-framework-item", { membershipId: membership.id, frameworkItemId }, options);
  return membership.id;
}
function createFrameworkMilestone(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const item = projection.frameworkItemsById[input.frameworkItemId];
  const achievement = text2(input.achievement);
  assertIsoDate(input.targetDate, "targetDate");
  if (!item || item.status !== "active") throw new Error("\u6846\u67B6\u6761\u76EE\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
  const framework = projection.frameworksById[item.frameworkId];
  if (compareDate(input.targetDate, framework.startDate) < 0 || compareDate(input.targetDate, framework.endDateExclusive) >= 0) throw new Error("\u91CC\u7A0B\u7891\u65E5\u671F\u5FC5\u987B\u4F4D\u4E8E\u65F6\u95F4\u6846\u67B6\u8FB9\u754C\u5185");
  if (!achievement) throw new Error("\u91CC\u7A0B\u7891\u8FBE\u6210\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
  const milestoneId = options.milestoneId || stableId("framework_milestone");
  appendDomainEvent(store, "frameworkEventsById", "milestone-create", { milestoneId, frameworkId: item.frameworkId, frameworkItemId: item.id, targetDate: input.targetDate, achievement }, options);
  return milestoneId;
}
function reviseFrameworkMilestone(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const milestone = projection.frameworkMilestonesById[input.milestoneId];
  if (!milestone || milestone.status !== "active") throw new Error("\u6846\u67B6\u91CC\u7A0B\u7891\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
  assertIsoDate(input.targetDate, "targetDate");
  const framework = projection.frameworksById[milestone.frameworkId];
  if (compareDate(input.targetDate, framework.startDate) < 0 || compareDate(input.targetDate, framework.endDateExclusive) >= 0) throw new Error("\u91CC\u7A0B\u7891\u65E5\u671F\u5FC5\u987B\u4F4D\u4E8E\u65F6\u95F4\u6846\u67B6\u8FB9\u754C\u5185");
  const achievement = text2(input.achievement);
  if (!achievement) throw new Error("\u91CC\u7A0B\u7891\u8FBE\u6210\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
  appendDomainEvent(store, "frameworkEventsById", "milestone-revise", { milestoneId: milestone.id, patch: { targetDate: input.targetDate, achievement } }, options);
  return milestone.id;
}
function archiveFrameworkMilestone(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const milestone = projection.frameworkMilestonesById[input.milestoneId];
  if (!milestone || milestone.status !== "active") throw new Error("\u6846\u67B6\u91CC\u7A0B\u7891\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
  if (activeValues(projection.frameworkMilestoneBindingsById).some((binding) => binding.milestoneId === milestone.id)) throw new Error("\u6846\u67B6\u91CC\u7A0B\u7891\u4ECD\u6709\u5173\u8054\u8282\u70B9\uFF0C\u8BF7\u5148\u89E3\u9664");
  appendDomainEvent(store, "frameworkEventsById", "milestone-archive", { milestoneId: milestone.id, reason: text2(input.reason, "\u6846\u67B6\u91CC\u7A0B\u7891\u505C\u7528") }, options);
}
function bindFrameworkMilestone(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const projection = reduceTemporalStore(store);
  const milestone = projection.frameworkMilestonesById[input.milestoneId];
  if (!milestone || milestone.status !== "active") throw new Error("\u6846\u67B6\u91CC\u7A0B\u7891\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
  if (!["membership", "outcome"].includes(input.targetType)) throw new Error("\u91CC\u7A0B\u7891\u5173\u8054\u76EE\u6807\u7C7B\u578B\u65E0\u6548");
  const target = input.targetType === "membership" ? projection.membershipsById[input.targetId] : projection.outcomesById[input.targetId];
  if (!target || target.status !== "active" || target.frameworkId !== milestone.frameworkId) throw new Error("\u91CC\u7A0B\u7891\u5173\u8054\u76EE\u6807\u65E0\u6548");
  const membership = input.targetType === "membership" ? target : projection.membershipsById[target.membershipId];
  if (membership?.frameworkItemId !== milestone.frameworkItemId) throw new Error("\u5173\u8054\u8282\u70B9\u4E0D\u5C5E\u4E8E\u8BE5\u6846\u67B6\u6761\u76EE");
  if (activeValues(projection.frameworkMilestoneBindingsById).some((binding) => binding.targetType === input.targetType && binding.targetId === input.targetId)) {
    throw new Error("\u8BE5\u8282\u70B9\u5DF2\u6709\u6709\u6548\u6846\u67B6\u91CC\u7A0B\u7891\u4F4D\u7F6E\uFF0C\u8BF7\u5148\u89E3\u9664\u539F\u5173\u8054");
  }
  const bindingId = options.bindingId || stableId("milestone_binding");
  appendDomainEvent(store, "frameworkEventsById", "milestone-bind", { bindingId, frameworkId: milestone.frameworkId, milestoneId: milestone.id, targetType: input.targetType, targetId: input.targetId }, options);
  return bindingId;
}
function unbindFrameworkMilestone(store, input, options = {}) {
  ensureFrameworkItemSchema(store);
  const binding = reduceTemporalStore(store).frameworkMilestoneBindingsById[input.bindingId];
  if (!binding || binding.status !== "active") throw new Error("\u6846\u67B6\u91CC\u7A0B\u7891\u5173\u8054\u4E0D\u5B58\u5728\u6216\u5DF2\u89E3\u9664");
  appendDomainEvent(store, "frameworkEventsById", "milestone-unbind", { bindingId: binding.id, reason: text2(input.reason, "\u89E3\u9664\u6846\u67B6\u91CC\u7A0B\u7891\u5173\u8054") }, options);
}
function frameworkMilestoneSentence(milestone) {
  return `${milestone.targetDate}\uFF0C\u6211\u5E94\u8BE5\u80FD\u591F\u8FBE\u6210 ${milestone.achievement}`;
}
function activeMilestoneBindingFor(projection, targetType, targetId) {
  return activeValues(projection.frameworkMilestoneBindingsById).find((binding) => binding.targetType === targetType && binding.targetId === targetId) || null;
}
function effectiveMembershipFrameworkLocation(projection, membershipId) {
  const membership = projection.membershipsById?.[membershipId];
  if (!membership || membership.status !== "active") return null;
  const binding = activeMilestoneBindingFor(projection, "membership", membership.id);
  if (binding) {
    const milestone = projection.frameworkMilestonesById?.[binding.milestoneId];
    if (milestone?.status === "active") return {
      frameworkItemId: milestone.frameworkItemId,
      milestoneId: milestone.id,
      source: "membership-milestone",
      binding
    };
  }
  if (membership.frameworkItemId) return {
    frameworkItemId: membership.frameworkItemId,
    milestoneId: null,
    source: "membership-item",
    binding: null
  };
  return { frameworkItemId: null, milestoneId: null, source: "unassigned", binding: null };
}
function effectiveOutcomeFrameworkLocation(projection, outcomeId) {
  const outcome = projection.outcomesById?.[outcomeId];
  if (!outcome || outcome.status !== "active") return null;
  const directBinding = activeMilestoneBindingFor(projection, "outcome", outcome.id);
  if (directBinding) {
    const milestone = projection.frameworkMilestonesById?.[directBinding.milestoneId];
    if (milestone?.status === "active") return {
      frameworkItemId: milestone.frameworkItemId,
      milestoneId: milestone.id,
      source: "outcome-milestone",
      binding: directBinding
    };
  }
  const membership = projection.membershipsById?.[outcome.membershipId];
  if (membership?.status === "active" && membership.frameworkItemId) return {
    frameworkItemId: membership.frameworkItemId,
    milestoneId: null,
    source: "membership-item",
    binding: null
  };
  return { frameworkItemId: null, milestoneId: null, source: "unassigned", binding: null };
}
function compareEffectGroups(left, right) {
  if (!left.frameworkItemId && right.frameworkItemId) return 1;
  if (left.frameworkItemId && !right.frameworkItemId) return -1;
  return (left.firstMilestoneDate && right.firstMilestoneDate ? compareDate(left.firstMilestoneDate, right.firstMilestoneDate) : left.firstMilestoneDate ? -1 : right.firstMilestoneDate ? 1 : 0) || left.label.localeCompare(right.label, "zh-CN") || left.key.localeCompare(right.key);
}
function directOutcomeMilestoneContext(projection, outcome, frameworkId) {
  const binding = activeMilestoneBindingFor(projection, "outcome", outcome.id);
  const milestone = binding ? projection.frameworkMilestonesById?.[binding.milestoneId] : null;
  if (!milestone || milestone.status !== "active" || milestone.frameworkId !== frameworkId) {
    return { binding: null, milestone: null };
  }
  return { binding, milestone };
}
function outcomeAncestorBranch(projection, outcome, maximumDepth, boundary) {
  const reversed = [];
  const diagnostics = [];
  const visited = /* @__PURE__ */ new Set();
  let cursor = outcome;
  while (cursor) {
    if (visited.has(cursor.id)) {
      diagnostics.push({ code: "OUTCOME_ANCESTOR_CYCLE", outcomeId: outcome.id, atOutcomeId: cursor.id, message: `\u6210\u679C\u201C${outcome.title}\u201D\u7684\u7956\u5148\u94FE\u5B58\u5728\u5FAA\u73AF` });
      break;
    }
    if (reversed.length >= maximumDepth) {
      diagnostics.push({ code: "OUTCOME_ANCESTOR_DEPTH_LIMIT", outcomeId: outcome.id, atOutcomeId: cursor.id, message: `\u6210\u679C\u201C${outcome.title}\u201D\u7684\u7956\u5148\u94FE\u8D85\u8FC7 ${maximumDepth} \u5C42` });
      break;
    }
    visited.add(cursor.id);
    const membership = projection.membershipsById?.[cursor.membershipId] || null;
    const location = effectiveOutcomeFrameworkLocation(projection, cursor.id);
    const frameworkItemId = location?.frameworkItemId || membership?.frameworkItemId || null;
    if (cursor.id !== outcome.id && (cursor.membershipId !== boundary.membershipId || frameworkItemId !== boundary.frameworkItemId)) {
      return {
        nodes: reversed.reverse(),
        diagnostics,
        externalParent: {
          outcome: cursor,
          membership,
          frameworkItemId,
          item: frameworkItemId ? projection.frameworkItemsById?.[frameworkItemId] || null : null,
          crossMembershipBoundary: cursor.membershipId !== boundary.membershipId,
          crossFrameworkItemBoundary: frameworkItemId !== boundary.frameworkItemId
        }
      };
    }
    const directMilestone = directOutcomeMilestoneContext(projection, cursor, cursor.frameworkId);
    reversed.push({
      outcome: cursor,
      membership,
      frameworkItemId,
      directMilestoneId: directMilestone.milestone?.id || null,
      directMilestone: directMilestone.milestone,
      directMilestoneBinding: directMilestone.binding,
      archivedContext: cursor.status !== "active"
    });
    if (!cursor.outlineParentId) break;
    const missingParentId = cursor.outlineParentId;
    cursor = projection.outcomesById?.[cursor.outlineParentId] || null;
    if (!cursor) diagnostics.push({ code: "OUTCOME_ANCESTOR_MISSING", outcomeId: outcome.id, atOutcomeId: missingParentId, message: `\u6210\u679C\u201C${outcome.title}\u201D\u7684\u4E0A\u7EA7\u6210\u679C\u5DF2\u5931\u8054` });
  }
  return { nodes: reversed.reverse(), diagnostics, externalParent: null };
}
function buildEffectiveOutcomeGroups(projection, frameworkId, options = {}) {
  const maximumDepth = Number.isInteger(options.maximumDepth) && options.maximumDepth > 0 ? options.maximumDepth : 64;
  const framework = projection.frameworksById?.[frameworkId];
  if (!framework || framework.status !== "active") return {
    groups: [],
    effectiveOutcomeIds: [],
    diagnostics: [{ code: "EFFECT_FRAMEWORK_INACTIVE", frameworkId, message: "\u6B63\u5728\u751F\u6548\u89C6\u56FE\u8981\u6C42\u6709\u6548\u65F6\u95F4\u6846\u67B6" }]
  };
  const groupsByKey = /* @__PURE__ */ new Map();
  const diagnostics = [];
  const effectiveOutcomes = activeValues(projection.outcomesById).filter((outcome) => outcome.frameworkId === frameworkId && projection.outcomeEffectivenessByOutcomeId?.[outcome.id]?.effective === true).sort((left, right) => left.id.localeCompare(right.id));
  for (const outcome of effectiveOutcomes) {
    const membership = projection.membershipsById?.[outcome.membershipId] || null;
    const { milestone } = directOutcomeMilestoneContext(projection, outcome, frameworkId);
    const frameworkItemId = milestone?.frameworkItemId || membership?.frameworkItemId || null;
    const item = frameworkItemId ? projection.frameworkItemsById?.[frameworkItemId] || null : null;
    const groupKey = frameworkItemId || "__unassigned__";
    if (!groupsByKey.has(groupKey)) groupsByKey.set(groupKey, {
      key: groupKey,
      frameworkItemId,
      item,
      label: item?.title || "\u672A\u5F52\u5C5E\u6846\u67B6\u6761\u76EE",
      firstMilestoneDate: milestone?.targetDate || null,
      membershipsById: /* @__PURE__ */ new Map(),
      selectedOutcomeIds: [],
      diagnostics: []
    });
    const group = groupsByKey.get(groupKey);
    if (milestone?.targetDate && (!group.firstMilestoneDate || compareDate(milestone.targetDate, group.firstMilestoneDate) < 0)) {
      group.firstMilestoneDate = milestone.targetDate;
    }
    const membershipKey = membership?.id || `__missing__:${outcome.membershipId}`;
    if (!group.membershipsById.has(membershipKey)) group.membershipsById.set(membershipKey, {
      membershipId: membership?.id || outcome.membershipId,
      membership,
      nodesById: /* @__PURE__ */ new Map(),
      externalParentsByOutcomeId: /* @__PURE__ */ new Map()
    });
    const membershipGroup = group.membershipsById.get(membershipKey);
    const branch = outcomeAncestorBranch(projection, outcome, maximumDepth, {
      membershipId: membership?.id || outcome.membershipId,
      frameworkItemId
    });
    group.selectedOutcomeIds.push(outcome.id);
    group.diagnostics.push(...branch.diagnostics);
    diagnostics.push(...branch.diagnostics);
    for (let index = 0; index < branch.nodes.length; index += 1) {
      const context = branch.nodes[index];
      const parentId = index ? branch.nodes[index - 1].outcome.id : null;
      const current = membershipGroup.nodesById.get(context.outcome.id);
      if (current) {
        if (context.outcome.id === outcome.id) current.effectiveTarget = true;
        continue;
      }
      membershipGroup.nodesById.set(context.outcome.id, {
        ...context,
        parentId,
        effectiveTarget: context.outcome.id === outcome.id
      });
    }
    const branchRootId = branch.nodes[0]?.outcome?.id || null;
    if (branchRootId && branch.externalParent) membershipGroup.externalParentsByOutcomeId.set(branchRootId, branch.externalParent);
  }
  const groups = [...groupsByKey.values()].map((group) => ({
    ...group,
    selectedOutcomeIds: [...new Set(group.selectedOutcomeIds)],
    memberships: [...group.membershipsById.values()].map((membershipGroup) => {
      const childrenByParentId = {};
      for (const node of membershipGroup.nodesById.values()) {
        const key = node.parentId && membershipGroup.nodesById.has(node.parentId) ? node.parentId : "__root__";
        if (!childrenByParentId[key]) childrenByParentId[key] = [];
        childrenByParentId[key].push(node.outcome.id);
      }
      for (const ids of Object.values(childrenByParentId)) ids.sort((leftId, rightId) => {
        const left = membershipGroup.nodesById.get(leftId)?.outcome;
        const right = membershipGroup.nodesById.get(rightId)?.outcome;
        return (left?.title || "").localeCompare(right?.title || "", "zh-CN") || leftId.localeCompare(rightId);
      });
      return {
        ...membershipGroup,
        nodesById: Object.fromEntries(membershipGroup.nodesById),
        childrenByParentId,
        externalParentsByOutcomeId: Object.fromEntries(membershipGroup.externalParentsByOutcomeId)
      };
    }).sort((left, right) => (left.membership?.lastKnownLabel || "").localeCompare(right.membership?.lastKnownLabel || "", "zh-CN") || left.membershipId.localeCompare(right.membershipId)),
    membershipsById: void 0
  })).sort(compareEffectGroups);
  return { groups, effectiveOutcomeIds: effectiveOutcomes.map((outcome) => outcome.id), diagnostics };
}
function buildMilestoneBindingContextGroups(projection, milestoneId) {
  const groupsByMembership = /* @__PURE__ */ new Map();
  const ensureGroup = (membershipId) => {
    if (!groupsByMembership.has(membershipId)) {
      const membership = projection.membershipsById?.[membershipId] || null;
      groupsByMembership.set(membershipId, {
        membershipId,
        membership,
        membershipBinding: null,
        nodesById: /* @__PURE__ */ new Map(),
        externalParentsByOutcomeId: /* @__PURE__ */ new Map()
      });
    }
    return groupsByMembership.get(membershipId);
  };
  const bindings = activeValues(projection.frameworkMilestoneBindingsById).filter((binding) => binding.milestoneId === milestoneId);
  for (const binding of bindings) {
    if (binding.targetType === "membership") {
      const membership = projection.membershipsById?.[binding.targetId];
      if (membership) ensureGroup(membership.id).membershipBinding = binding;
      continue;
    }
    const outcome = projection.outcomesById?.[binding.targetId];
    if (!outcome) continue;
    const group = ensureGroup(outcome.membershipId);
    const chain = [];
    const visited = /* @__PURE__ */ new Set();
    let cursor = outcome;
    while (cursor && !visited.has(cursor.id)) {
      visited.add(cursor.id);
      if (cursor.membershipId !== outcome.membershipId) {
        group.externalParentsByOutcomeId.set(chain[0]?.id || outcome.id, cursor);
        break;
      }
      chain.unshift(cursor);
      cursor = cursor.outlineParentId ? projection.outcomesById?.[cursor.outlineParentId] : null;
    }
    for (let index = 0; index < chain.length; index += 1) {
      const nodeOutcome = chain[index];
      if (!group.nodesById.has(nodeOutcome.id)) group.nodesById.set(nodeOutcome.id, {
        outcome: nodeOutcome,
        parentId: index ? chain[index - 1].id : null,
        directlyBound: false,
        binding: null
      });
    }
    const targetNode = group.nodesById.get(outcome.id);
    targetNode.directlyBound = true;
    targetNode.binding = binding;
  }
  return [...groupsByMembership.values()].map((group) => {
    const childrenByParentId = {};
    for (const node of group.nodesById.values()) {
      const parentKey = node.parentId || "__root__";
      if (!childrenByParentId[parentKey]) childrenByParentId[parentKey] = [];
      childrenByParentId[parentKey].push(node.outcome.id);
    }
    for (const childIds of Object.values(childrenByParentId)) {
      childIds.sort((leftId, rightId) => {
        const left = group.nodesById.get(leftId)?.outcome;
        const right = group.nodesById.get(rightId)?.outcome;
        return (left?.title || "").localeCompare(right?.title || "", "zh-CN") || leftId.localeCompare(rightId);
      });
    }
    return {
      membershipId: group.membershipId,
      membership: group.membership,
      membershipBinding: group.membershipBinding,
      nodesById: Object.fromEntries(group.nodesById),
      childrenByParentId,
      externalParentsByOutcomeId: Object.fromEntries(group.externalParentsByOutcomeId)
    };
  }).sort((left, right) => {
    const leftDomain = left.membership?.primaryRef?.domain || "unknown";
    const rightDomain = right.membership?.primaryRef?.domain || "unknown";
    return leftDomain.localeCompare(rightDomain) || (left.membership?.lastKnownLabel || "").localeCompare(right.membership?.lastKnownLabel || "", "zh-CN") || left.membershipId.localeCompare(right.membershipId);
  });
}
function createOutcome(store, input, options = {}) {
  const outcomeId = options.outcomeId || stableId("outcome");
  const title = text2(input.title);
  if (!title) throw new Error("\u9636\u6BB5\u6210\u679C\u4E0D\u80FD\u4E3A\u7A7A");
  const membership = reduceTemporalStore(store).membershipsById[input.membershipId];
  if (!membership || membership.status !== "active" || membership.frameworkId !== input.frameworkId) throw new Error("\u6240\u5C5E\u76EE\u6807\u6216\u9879\u76EE\u4E0D\u5728\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u4E2D");
  appendDomainEvent(store, "outcomeEventsById", "create", {
    outcomeId,
    frameworkId: input.frameworkId,
    membershipId: input.membershipId,
    title,
    acceptance: text2(input.acceptance),
    outcomeKind: input.outcomeKind === "stage_gate" ? "stage_gate" : "outcome",
    outlineParentId: input.outlineParentId || null,
    supersedesOutcomeId: input.supersedesOutcomeId || null,
    labelAtCreation: title
  }, options);
  return outcomeId;
}
function placeOutcome(store, input, options = {}) {
  assertPlacementShape(input);
  const projection = reduceTemporalStore(store);
  if (outcomePlacement(projection, input.outcomeId)) throw new Error("\u8BE5\u6210\u679C\u5DF2\u6709\u6709\u6548\u65F6\u95F4\u5B89\u6392");
  const violations = placementAdmissionViolations(projection, input);
  if (violations.length) throw new Error(violations.join("\uFF1B"));
  const placementId = options.placementId || stableId("placement");
  const homeTimeBoxRef = structuredClone(input.homeTimeBoxRef);
  appendDomainEvent(store, "placementEventsById", "place", {
    placementId,
    frameworkId: input.frameworkId,
    outcomeId: input.outcomeId,
    mode: input.mode === "point" ? "point" : "interval",
    startDate: input.startDate,
    endDateExclusive: input.endDateExclusive,
    dueOn: input.dueOn || null,
    declaredScale: input.declaredScale,
    homeTimeBoxRef
  }, options);
  return placementId;
}
function outcomeRelationCandidateContext(store, input, options = {}) {
  if (!RELATION_TYPES.includes(input.relationType)) throw new Error("\u5173\u7CFB\u7C7B\u578B\u65E0\u6548");
  const projection = reduceTemporalStore(store);
  const duplicate = activeValues(projection.relationsById).find((relation2) => relation2.frameworkId === input.frameworkId && relation2.sourceOutcomeId === input.sourceOutcomeId && relation2.targetOutcomeId === input.targetOutcomeId && relation2.relationType === input.relationType);
  if (duplicate) throw new Error("\u8BE5\u6210\u679C\u5173\u7CFB\u5DF2\u7ECF\u5B58\u5728");
  const relationId = options.relationId || stableId("relation");
  if (projection.relationsById[relationId]) throw new Error(`\u6210\u679C\u5173\u7CFB ID \u5DF2\u5B58\u5728\uFF1A${relationId}`);
  const relation = {
    id: relationId,
    relationId,
    frameworkId: input.frameworkId,
    sourceOutcomeId: input.sourceOutcomeId,
    targetOutcomeId: input.targetOutcomeId,
    relationType: input.relationType,
    supersedesRelationId: input.supersedesRelationId || null,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  const candidateProjection = structuredClone(projection);
  if (relation.supersedesRelationId && candidateProjection.relationsById[relation.supersedesRelationId]) {
    candidateProjection.relationsById[relation.supersedesRelationId].status = "superseded";
  }
  candidateProjection.relationsById[relationId] = structuredClone(relation);
  const structuralViolations = validateProjection(candidateProjection);
  return {
    projection,
    candidateProjection,
    relation,
    structuralViolations,
    temporalViolation: structuralViolations.length ? null : temporalRelationViolation(candidateProjection, relation),
    sourcePlacement: outcomePlacement(projection, relation.sourceOutcomeId),
    targetPlacement: outcomePlacement(projection, relation.targetOutcomeId)
  };
}
function outcomeRelationCandidateDiagnostics(store, input, options = {}) {
  const context = outcomeRelationCandidateContext(store, input, options);
  return {
    relation: structuredClone(context.relation),
    structuralViolations: [...context.structuralViolations],
    temporalViolation: context.temporalViolation,
    sourcePlacement: context.sourcePlacement ? structuredClone(context.sourcePlacement) : null,
    targetPlacement: context.targetPlacement ? structuredClone(context.targetPlacement) : null
  };
}
function addOutcomeRelation(store, input, options = {}) {
  const context = outcomeRelationCandidateContext(store, input, options);
  if (context.structuralViolations.length || context.temporalViolation) {
    throw new Error(context.structuralViolations[0] || context.temporalViolation);
  }
  appendDomainEvent(store, "relationEventsById", "add", {
    relationId: context.relation.id,
    frameworkId: context.relation.frameworkId,
    sourceOutcomeId: context.relation.sourceOutcomeId,
    targetOutcomeId: context.relation.targetOutcomeId,
    relationType: context.relation.relationType,
    supersedesRelationId: context.relation.supersedesRelationId
  }, options);
  const relationId = context.relation.id;
  return relationId;
}
function reviseOutcome(store, input, options = {}) {
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    patch.title = text2(input.title);
    if (!patch.title) throw new Error("\u9636\u6BB5\u6210\u679C\u4E0D\u80FD\u4E3A\u7A7A");
  }
  if (Object.prototype.hasOwnProperty.call(input, "acceptance")) patch.acceptance = text2(input.acceptance);
  if (!Object.keys(patch).length) throw new Error("\u6CA1\u6709\u9700\u8981\u4FEE\u6539\u7684\u6210\u679C\u5B57\u6BB5");
  appendDomainEvent(store, "outcomeEventsById", "revise", { outcomeId: input.outcomeId, patch, reason: text2(input.reason) }, options);
}
function setOutcomeEffective(store, input, options = {}) {
  if (typeof input.effective !== "boolean") throw new Error("\u6B63\u5728\u751F\u6548\u72B6\u6001\u5FC5\u987B\u662F\u5E03\u5C14\u503C");
  const projection = reduceTemporalStore(store);
  const outcome = projection.outcomesById[input.outcomeId];
  if (!outcome || input.effective && outcome.status !== "active") throw new Error("\u8BE5\u9636\u6BB5\u6210\u679C\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728");
  const current = projection.outcomeEffectivenessByOutcomeId[input.outcomeId]?.effective === true;
  if (current === input.effective) throw new Error(input.effective ? "\u8BE5\u6210\u679C\u5DF2\u7ECF\u5904\u4E8E\u6B63\u5728\u751F\u6548\u72B6\u6001" : "\u8BE5\u6210\u679C\u5DF2\u7ECF\u4E0D\u5728\u6B63\u5728\u751F\u6548\u4E2D");
  ensureFrameworkItemSchema(store);
  return appendDomainEvent(store, "outcomeEventsById", "effect-set", {
    outcomeId: input.outcomeId,
    effective: input.effective
  }, { ...options, omitReason: true });
}
function moveOutcomePlacement(store, input, options = {}) {
  const projection = reduceTemporalStore(store);
  const current = outcomePlacement(projection, input.outcomeId);
  if (!current) throw new Error("\u8BE5\u6210\u679C\u5C1A\u672A\u5B89\u6392\u65F6\u95F4");
  assertPlacementShape(input);
  const violations = placementAdmissionViolations(projection, input);
  if (violations.length) throw new Error(violations.join("\uFF1B"));
  appendDomainEvent(store, "placementEventsById", "move", {
    placementId: current.id,
    patch: {
      mode: input.mode === "point" ? "point" : "interval",
      startDate: input.startDate,
      endDateExclusive: input.endDateExclusive,
      dueOn: input.dueOn || null,
      declaredScale: input.declaredScale,
      homeTimeBoxRef: structuredClone(input.homeTimeBoxRef)
    },
    reason: text2(input.reason)
  }, options);
}
function jointPlacementCandidate(current, input) {
  return {
    ...current,
    ...input,
    id: current.id,
    frameworkId: current.frameworkId,
    outcomeId: current.outcomeId,
    mode: input.mode === "point" ? "point" : "interval",
    dueOn: input.dueOn || null,
    homeTimeBoxRef: structuredClone(input.homeTimeBoxRef),
    status: "active"
  };
}
function placementSemantics(placement) {
  return {
    mode: placement.mode === "point" ? "point" : "interval",
    startDate: placement.startDate,
    endDateExclusive: placement.endDateExclusive,
    dueOn: placement.dueOn || null,
    declaredScale: placement.declaredScale,
    homeTimeBoxRef: placement.homeTimeBoxRef
  };
}
function jointPlacementSetContext(projection, framework, relation, placementInputs) {
  if (!Array.isArray(placementInputs) || placementInputs.length < 2) throw new Error("\u8054\u5408\u8C03\u6574\u81F3\u5C11\u9700\u8981\u5173\u7CFB\u4E24\u7AEF\u7684\u65F6\u95F4\u5B89\u6392");
  const seen = /* @__PURE__ */ new Set();
  const entries = [];
  for (const input of placementInputs) {
    if (!input?.outcomeId || seen.has(input.outcomeId)) throw new Error("\u8054\u5408\u8C03\u6574\u6210\u679C\u91CD\u590D\u6216\u7F3A\u5C11\u7A33\u5B9A ID");
    seen.add(input.outcomeId);
    const outcome = projection.outcomesById[input.outcomeId];
    if (!outcome || outcome.status !== "active") throw new Error(`\u8054\u5408\u8C03\u6574\u6210\u679C\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728\uFF1A${input.outcomeId}`);
    if (outcome.frameworkId !== relation.frameworkId || input.frameworkId !== relation.frameworkId) throw new Error("\u8054\u5408\u8C03\u6574\u6210\u679C\u7684\u65F6\u95F4\u6846\u67B6\u4E0D\u5339\u914D");
    const current = outcomePlacement(projection, input.outcomeId);
    if (!current || current.frameworkId !== relation.frameworkId) throw new Error(`\u6210\u679C\u201C${outcome.title}\u201D\u6CA1\u6709\u53EF\u8054\u5408\u8C03\u6574\u7684\u6709\u6548\u65F6\u95F4\u5B89\u6392`);
    assertPlacementShape(input);
    const expectedTimeBox = canonicalTimeBox(input.declaredScale, input.startDate, framework);
    if (hashValue(input.homeTimeBoxRef) !== hashValue(expectedTimeBox)) throw new Error("\u8054\u5408\u8C03\u6574\u7684\u5F52\u5C5E TimeBox \u4E0D\u662F\u5F53\u524D\u65E5\u671F\u7684\u89C4\u8303\u5730\u5740");
    entries.push({ input, outcome, current, candidate: jointPlacementCandidate(current, input) });
  }
  if (!seen.has(relation.sourceOutcomeId) || !seen.has(relation.targetOutcomeId)) throw new Error("\u8054\u5408\u8C03\u6574\u5FC5\u987B\u5305\u542B\u6210\u679C\u5173\u7CFB\u7684\u4E24\u4E2A\u7AEF\u70B9");
  const jointProjection = projectionWithPlacementCandidates(projection, entries.map((entry) => entry.candidate));
  const diagnostics = [];
  for (const entry of entries) {
    const candidate = outcomePlacement(jointProjection, entry.outcome.id);
    if (compareDate(candidate.startDate, framework.startDate) < 0 || compareDate(candidate.endDateExclusive, framework.endDateExclusive) > 0) {
      diagnostics.push({
        code: "FRAMEWORK_BOUNDARY",
        constraintType: "framework",
        constraintId: `framework-boundary:${entry.outcome.id}`,
        outcomeIds: [entry.outcome.id],
        adjustableOutcomeIds: [entry.outcome.id],
        blocker: false,
        message: `\u201C${entry.outcome.title}\u201D\u5FC5\u987B\u4F4D\u4E8E\u65F6\u95F4\u6846\u67B6\u8FB9\u754C\u5185`
      });
    }
  }
  diagnostics.push(...placementConstraintDiagnostics(jointProjection, seen));
  return {
    projection,
    jointProjection,
    framework,
    relation,
    entries,
    diagnostics: uniqueConstraintDiagnostics(diagnostics)
  };
}
function candidateRelationPlacementSetContext(store, relationInput, placementInputs, options = {}) {
  const relationContext = outcomeRelationCandidateContext(store, relationInput, options);
  if (relationContext.structuralViolations.length) throw new Error(relationContext.structuralViolations.join("\uFF1B"));
  const projection = relationContext.candidateProjection;
  const framework = projection.frameworksById[relationContext.relation.frameworkId];
  if (!framework || framework.status !== "active") throw new Error("\u65F6\u95F4\u6846\u67B6\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728");
  return jointPlacementSetContext(projection, framework, relationContext.relation, placementInputs);
}
function relatedPlacementSetContext(store, relationId, placementInputs) {
  if (!relationId) throw new Error("\u7F3A\u5C11\u9700\u8981\u8054\u5408\u8C03\u6574\u7684\u6210\u679C\u5173\u7CFB");
  const projection = reduceTemporalStore(store);
  const relation = projection.relationsById[relationId];
  if (!relation || relation.status !== "active") throw new Error("\u6210\u679C\u5173\u7CFB\u5DF2\u7ECF\u64A4\u9500\u6216\u4E0D\u5B58\u5728");
  const framework = projection.frameworksById[relation.frameworkId];
  if (!framework || framework.status !== "active") throw new Error("\u65F6\u95F4\u6846\u67B6\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728");
  if (relation.sourceOutcomeId === relation.targetOutcomeId) throw new Error("\u8054\u5408\u8C03\u6574\u9700\u8981\u4E24\u4E2A\u4E0D\u540C\u7684\u6210\u679C");
  return jointPlacementSetContext(projection, framework, relation, placementInputs);
}
function candidateOutcomeRelationPlacementSetDiagnostics(store, relationInput, placementInputs, options = {}) {
  return structuredClone(candidateRelationPlacementSetContext(store, relationInput, placementInputs, options).diagnostics);
}
function relatedOutcomePlacementSetDiagnostics(store, relationId, placementInputs) {
  return structuredClone(relatedPlacementSetContext(store, relationId, placementInputs).diagnostics);
}
function changedJointEntries(context, forceOutcomeIds = []) {
  const forced = new Set(forceOutcomeIds);
  return context.entries.filter((entry) => forced.has(entry.outcome.id) || hashValue(placementSemantics(entry.current)) !== hashValue(placementSemantics(entry.candidate)));
}
function preflightJointEventIds(store, eventIds) {
  const proposed = eventIds.filter(Boolean);
  if (new Set(proposed).size !== proposed.length) throw new Error(`\u8054\u5408\u8C03\u6574\u4E8B\u4EF6 ID \u4E0D\u80FD\u91CD\u590D\uFF1A${proposed.join("\u3001")}`);
  for (const eventId of proposed) {
    for (const bucket of EVENT_BUCKETS) if (store[bucket]?.[eventId]) throw new Error(`\u4E8B\u4EF6 ID \u5DF2\u5B58\u5728\uFF1A${eventId}`);
  }
}
function appendJointPlacementMoves(store, context, changedEntries, eventIdsByOutcomeId, options, fallbackReason) {
  const eventOptions = { ...options };
  for (const key of ["relationId", "relationEventId", "sourceEventId", "targetEventId", "placementEventIdsByOutcomeId", "forceOutcomeIds"]) delete eventOptions[key];
  const eventsByOutcomeId = {};
  for (const entry of changedEntries) {
    eventsByOutcomeId[entry.outcome.id] = appendDomainEvent(store, "placementEventsById", "move", {
      placementId: entry.current.id,
      patch: structuredClone(placementSemantics(entry.candidate)),
      reason: text2(entry.input.reason, fallbackReason)
    }, { ...eventOptions, eventId: eventIdsByOutcomeId[entry.outcome.id] });
  }
  return eventsByOutcomeId;
}
function moveRelatedOutcomePlacementSet(store, relationId, placementInputs, options = {}) {
  const context = relatedPlacementSetContext(store, relationId, placementInputs);
  if (context.diagnostics.length) throw new Error(context.diagnostics.map((item) => item.message).join("\uFF1B"));
  const changedEntries = changedJointEntries(context, options.forceOutcomeIds);
  if (!changedEntries.length) throw new Error("\u6CA1\u6709\u9700\u8981\u4FDD\u5B58\u7684\u65F6\u95F4\u8C03\u6574");
  const createId = options.createId || stableId;
  const eventIdsByOutcomeId = { ...options.placementEventIdsByOutcomeId || {} };
  for (const entry of changedEntries) if (!eventIdsByOutcomeId[entry.outcome.id]) eventIdsByOutcomeId[entry.outcome.id] = createId("place_evt");
  preflightJointEventIds(store, changedEntries.map((entry) => eventIdsByOutcomeId[entry.outcome.id]));
  const placementEventsByOutcomeId = appendJointPlacementMoves(store, context, changedEntries, eventIdsByOutcomeId, options, "\u5173\u7CFB\u65F6\u95F4\u51B2\u7A81\u8054\u5408\u8C03\u6574");
  return { placementEventsByOutcomeId, changedOutcomeIds: changedEntries.map((entry) => entry.outcome.id) };
}
function addOutcomeRelationWithJointPlacementSet(store, relationInput, placementInputs, options = {}) {
  const relationId = options.relationId || stableId("relation");
  const context = candidateRelationPlacementSetContext(store, relationInput, placementInputs, { relationId });
  if (context.diagnostics.length) throw new Error(context.diagnostics.map((item) => item.message).join("\uFF1B"));
  const changedEntries = changedJointEntries(context, options.forceOutcomeIds);
  const createId = options.createId || stableId;
  const relationEventId = options.relationEventId || createId("relation_evt");
  const eventIdsByOutcomeId = { ...options.placementEventIdsByOutcomeId || {} };
  for (const entry of changedEntries) if (!eventIdsByOutcomeId[entry.outcome.id]) eventIdsByOutcomeId[entry.outcome.id] = createId("place_evt");
  preflightJointEventIds(store, [relationEventId, ...changedEntries.map((entry) => eventIdsByOutcomeId[entry.outcome.id])]);
  const relationOptions = { ...options, eventId: relationEventId };
  for (const key of ["relationId", "relationEventId", "sourceEventId", "targetEventId", "placementEventIdsByOutcomeId", "forceOutcomeIds"]) delete relationOptions[key];
  const relationEvent = appendDomainEvent(store, "relationEventsById", "add", {
    relationId,
    frameworkId: relationInput.frameworkId,
    sourceOutcomeId: relationInput.sourceOutcomeId,
    targetOutcomeId: relationInput.targetOutcomeId,
    relationType: relationInput.relationType,
    supersedesRelationId: relationInput.supersedesRelationId || null
  }, relationOptions);
  const placementEventsByOutcomeId = appendJointPlacementMoves(store, context, changedEntries, eventIdsByOutcomeId, options, "\u5EFA\u7ACB\u5173\u7CFB\u5E76\u8054\u5408\u8C03\u6574\u65F6\u95F4");
  return { relationId, relationEvent, placementEventsByOutcomeId, changedOutcomeIds: changedEntries.map((entry) => entry.outcome.id) };
}
function archiveOutcome(store, input, options = {}) {
  const projection = reduceTemporalStore(store);
  const outcome = projection.outcomesById[input.outcomeId];
  if (!outcome || outcome.status !== "active") throw new Error("\u8BE5\u9636\u6BB5\u6210\u679C\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728");
  const placement = outcomePlacement(projection, input.outcomeId);
  if (placement) appendDomainEvent(store, "placementEventsById", "unassign", {
    placementId: placement.id,
    reason: text2(input.reason, "\u9636\u6BB5\u6210\u679C\u505C\u7528")
  }, options);
  appendDomainEvent(store, "outcomeEventsById", "archive", {
    outcomeId: input.outcomeId,
    reason: text2(input.reason, "\u9636\u6BB5\u6210\u679C\u505C\u7528")
  }, options);
}
function revokeOutcomeRelation(store, input, options = {}) {
  const reason = text2(input.reason);
  if (!reason) throw new Error("\u64A4\u9500\u5173\u7CFB\u9700\u8981\u539F\u56E0");
  appendDomainEvent(store, "relationEventsById", "revoke", { relationId: input.relationId, reason }, options);
}
function setGatePolicy(store, input, options = {}) {
  appendDomainEvent(store, "gatePolicyEventsById", "set", {
    outcomeId: input.outcomeId,
    mode: input.mode === "threshold_count" ? "threshold_count" : "all",
    threshold: input.mode === "threshold_count" ? Number(input.threshold) : null
  }, options);
}
function paintOutcome(store, input, options = {}) {
  assertIsoDate(input.completedOn, "completedOn");
  appendDomainEvent(store, "completionEventsById", "paint", {
    outcomeId: input.outcomeId,
    completedOn: input.completedOn,
    evidence: text2(input.evidence),
    note: text2(input.note),
    reason: text2(input.reason)
  }, options);
}
function unpaintOutcome(store, input, options = {}) {
  const reason = text2(input.reason);
  if (!reason) throw new Error("\u53D6\u6D88\u5B8C\u6210\u9700\u8981\u539F\u56E0");
  appendDomainEvent(store, "completionEventsById", "unpaint", { outcomeId: input.outcomeId, reason }, options);
}
function decideNoDeployment(store, input, options = {}) {
  const coverageId = options.coverageId || stableId("coverage");
  const reason = text2(input.reason);
  if (!reason) throw new Error("\u8BF7\u8BF4\u660E\u672C\u9636\u6BB5\u65E0\u90E8\u7F72\u7684\u539F\u56E0");
  const membership = reduceTemporalStore(store).membershipsById[input.membershipId];
  if (!membership || membership.status !== "active" || membership.frameworkId !== input.frameworkId) throw new Error("\u6240\u5C5E\u76EE\u6807\u6216\u9879\u76EE\u4E0D\u5728\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u4E2D");
  appendDomainEvent(store, "coverageEventsById", "decide", {
    coverageId,
    frameworkId: input.frameworkId,
    membershipId: input.membershipId,
    timeBoxRef: structuredClone(input.timeBoxRef),
    policyVersion: Number(input.policyVersion),
    decision: "no_deployment",
    reason,
    supersedesCoverageId: input.supersedesCoverageId || null
  }, options);
  return coverageId;
}
function revokeCoverageDecision(store, input, options = {}) {
  const reason = text2(input.reason);
  if (!reason) throw new Error("\u64A4\u9500\u65E0\u90E8\u7F72\u51B3\u5B9A\u9700\u8981\u539F\u56E0");
  appendDomainEvent(store, "coverageEventsById", "revoke", { coverageId: input.coverageId, reason }, options);
}
function outcomePlacement(projection, outcomeId) {
  return activeValues(projection.placementsById).find((placement) => placement.outcomeId === outcomeId) || null;
}
function outcomeRelationSummary(projection, outcomeId) {
  const relations = activeTemporalRelations(projection);
  const incomingPrecedes = relations.filter((relation) => relation.relationType === "precedes" && relation.targetOutcomeId === outcomeId);
  const incomingRequires = relations.filter((relation) => relation.relationType === "requires" && relation.targetOutcomeId === outcomeId);
  const contributors = relations.filter((relation) => relation.relationType === "contributes_to" && relation.targetOutcomeId === outcomeId);
  const children = activeValues(projection.outcomesById).filter((outcome) => outcome.outlineParentId === outcomeId);
  return { incomingPrecedes, incomingRequires, contributors, children };
}
function outcomeReadiness(projection, outcomeId) {
  const outcome = projection.outcomesById[outcomeId];
  if (!outcome || outcome.status !== "active") return { ready: false, reason: "outcome-unavailable", completed: 0, total: 0 };
  const summary = outcomeRelationSummary(projection, outcomeId);
  const painted = (id) => projection.completionByOutcomeId[id]?.painted === true;
  const requiredReady = summary.incomingRequires.every((relation) => painted(relation.sourceOutcomeId));
  if (outcome.outcomeKind !== "stage_gate") {
    return { ready: requiredReady, reason: requiredReady ? "ready" : "requirements-incomplete", completed: summary.incomingRequires.filter((relation) => painted(relation.sourceOutcomeId)).length, total: summary.incomingRequires.length };
  }
  const policy = projection.gatePoliciesByOutcomeId[outcomeId] || { mode: "all", threshold: null };
  const completed = summary.contributors.filter((relation) => painted(relation.sourceOutcomeId)).length;
  const total = summary.contributors.length;
  const gateReady = total > 0 && (policy.mode === "threshold_count" ? completed >= policy.threshold : completed === total);
  return { ready: requiredReady && gateReady, reason: gateReady ? requiredReady ? "ready" : "requirements-incomplete" : "contributors-incomplete", completed, total, policy };
}
function placementMatchesBoxDirectly(placement, timeBox) {
  return placement?.status === "active" && placement.declaredScale === timeBox.scale && placement.homeTimeBoxRef?.id === timeBox.id;
}
function placementOverlapsBox(placement, timeBox) {
  return placement?.status === "active" && intervalsOverlap(placement.startDate, placement.endDateExclusive, timeBox.startDate, timeBox.endDateExclusive);
}
function coverageDecisionFor(projection, frameworkId, membershipId, timeBox) {
  return activeValues(projection.coverageById).find(
    (coverage) => coverage.frameworkId === frameworkId && coverage.membershipId === membershipId && coverage.policyVersion === timeBox.policyVersion && coverage.timeBoxRef?.id === timeBox.id
  ) || null;
}
function buildFrameworkDiagnostics(projection, frameworkId, today = localDate()) {
  const diagnostics = [];
  const activeMemberships = activeValues(projection.membershipsById).filter((membership) => membership.frameworkId === frameworkId);
  const activeOutcomes = activeValues(projection.outcomesById).filter((outcome) => outcome.frameworkId === frameworkId);
  for (const membership of activeMemberships) {
    if (membership.sourceState === "unknown") diagnostics.push({ type: "provider_degraded", membershipId: membership.id, label: membership.lastKnownLabel });
    if (!activeOutcomes.some((outcome) => outcome.membershipId === membership.id)) diagnostics.push({ type: "membership_without_outcome", membershipId: membership.id, label: membership.lastKnownLabel });
  }
  for (const outcome of activeOutcomes) {
    const placement = outcomePlacement(projection, outcome.id);
    if (!placement) diagnostics.push({ type: "outcome_unscheduled", outcomeId: outcome.id, title: outcome.title });
    else if (compareDate(placement.endDateExclusive, addDays(today, 1)) <= 0 && projection.completionByOutcomeId[outcome.id]?.painted !== true) {
      diagnostics.push({ type: "past_unpainted", outcomeId: outcome.id, title: outcome.title, dueOn: placement.dueOn || addDays(placement.endDateExclusive, -1) });
    }
    if (outcome.outcomeKind === "stage_gate") {
      const readiness = outcomeReadiness(projection, outcome.id);
      if (!readiness.ready) diagnostics.push({ type: "gate_not_ready", outcomeId: outcome.id, title: outcome.title, ...readiness });
    }
  }
  for (const relation of activeTemporalRelations(projection).filter((item) => item.frameworkId === frameworkId)) {
    const message = temporalRelationViolation(projection, relation);
    if (message) diagnostics.push({
      type: "temporal_relation_conflict",
      relationId: relation.id,
      sourceOutcomeId: relation.sourceOutcomeId,
      targetOutcomeId: relation.targetOutcomeId,
      relationType: relation.relationType,
      message
    });
  }
  return diagnostics;
}

// src/temporal-store.mjs
var import_node_crypto3 = require("node:crypto");
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
function hashText2(value) {
  return (0, import_node_crypto3.createHash)("sha256").update(value, "utf8").digest("hex").toUpperCase();
}
function serialize(value) {
  return JSON.stringify(value, null, 2) + "\n";
}
async function exists(target) {
  try {
    await import_promises.default.access(target);
    return true;
  } catch {
    return false;
  }
}
async function writeFileSynced(target, value) {
  const handle = await import_promises.default.open(target, "w");
  try {
    await handle.writeFile(value, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function validatedFile(target, context) {
  const text3 = await import_promises.default.readFile(target, "utf8");
  let value;
  try {
    value = JSON.parse(text3);
  } catch (error) {
    throw new Error(`${context} JSON \u89E3\u6790\u5931\u8D25\uFF1A${error.message}`);
  }
  assertValidStore(value);
  return { value, text: text3, hash: hashText2(text3) };
}
function assertAppendOnlyHistory(current, draft) {
  if (draft.nextEventOrdinal < current.nextEventOrdinal) throw new Error("event ordinal \u4E0D\u5141\u8BB8\u56DE\u9000");
  const newOrdinals = /* @__PURE__ */ new Set();
  for (const bucket of EVENT_BUCKETS) {
    for (const [eventId, event] of Object.entries(current[bucket] || {})) {
      if (!Object.prototype.hasOwnProperty.call(draft[bucket] || {}, eventId)) throw new Error(`${bucket}/${eventId} \u5386\u53F2\u4E8B\u4EF6\u4E0D\u5141\u8BB8\u5220\u9664`);
      if (JSON.stringify(draft[bucket][eventId]) !== JSON.stringify(event)) throw new Error(`${bucket}/${eventId} \u5386\u53F2\u4E8B\u4EF6\u4E0D\u5141\u8BB8\u8986\u76D6`);
    }
    for (const [eventId, event] of Object.entries(draft[bucket] || {})) {
      if (Object.prototype.hasOwnProperty.call(current[bucket] || {}, eventId)) continue;
      if (Number(event.commitRevision) !== current.revision + 1) throw new Error(`${bucket}/${eventId} commitRevision \u65E0\u6548`);
      if (!Number.isInteger(event.ordinal) || event.ordinal < current.nextEventOrdinal || event.ordinal >= draft.nextEventOrdinal) throw new Error(`${bucket}/${eventId} ordinal \u65E0\u6548`);
      if (newOrdinals.has(event.ordinal)) throw new Error(`\u65B0\u4E8B\u4EF6 ordinal \u91CD\u590D\uFF1A${event.ordinal}`);
      newOrdinals.add(event.ordinal);
    }
  }
}
var TemporalStore = class {
  constructor(directory, options = {}) {
    this.directory = directory;
    this.paths = {
      current: import_node_path2.default.join(directory, "Temporal_Framework.json"),
      candidate: import_node_path2.default.join(directory, "Temporal_Framework.json.candidate"),
      previous: import_node_path2.default.join(directory, "Temporal_Framework.json.previous"),
      journal: import_node_path2.default.join(directory, "Temporal_Framework.json.journal.json"),
      journalTemp: import_node_path2.default.join(directory, "Temporal_Framework.json.journal.tmp"),
      lock: import_node_path2.default.join(directory, "temporal-framework.writer.lock"),
      recovery: import_node_path2.default.join(directory, "temporal-framework-recovery")
    };
    this.profile = "read-only";
    this.readOnlyReason = "\u5C1A\u672A\u521D\u59CB\u5316";
    this.ownerToken = `owner_${(0, import_node_crypto3.randomUUID)().replaceAll("-", "")}`;
    this.queue = Promise.resolve();
    this.listeners = /* @__PURE__ */ new Set();
    this.hook = options.hook || (() => {
    });
  }
  onDirty(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emitDirty(payload) {
    for (const listener of this.listeners) listener(payload);
  }
  async init() {
    await import_promises.default.mkdir(this.directory, { recursive: true });
    const capability = await this.probeCapabilities();
    this.profile = capability.profile;
    this.readOnlyReason = capability.reason;
    if (this.profile === "read-only") return capability;
    try {
      await this.withLock(async () => await this.recover());
    } catch (error) {
      this.profile = "read-only";
      this.readOnlyReason = error.message;
      if (await exists(this.paths.current)) await validatedFile(this.paths.current, "\u53EA\u8BFB\u6062\u590D\u6587\u4EF6");
    }
    return { profile: this.profile, reason: this.readOnlyReason };
  }
  async probeCapabilities() {
    const probe = import_node_path2.default.join(this.directory, `.temporal-probe-${(0, import_node_crypto3.randomUUID)()}`);
    try {
      await import_promises.default.mkdir(probe);
      const first = import_node_path2.default.join(probe, "first");
      const second = import_node_path2.default.join(probe, "second");
      await writeFileSynced(first, "probe");
      await import_promises.default.rename(first, second);
      return { profile: "verified-recoverable", reason: "\u6587\u4EF6\u540C\u6B65\u3001\u9501\u548C rename \u80FD\u529B\u53EF\u7528" };
    } catch (error) {
      return { profile: "read-only", reason: `\u80FD\u529B\u63A2\u6D4B\u5931\u8D25\uFF1A${error.message}` };
    } finally {
      await import_promises.default.rm(probe, { recursive: true, force: true }).catch(() => {
      });
    }
  }
  async withLock(action) {
    try {
      await import_promises.default.mkdir(this.paths.lock);
    } catch (error) {
      if (error.code === "EEXIST") {
        const reclaimed = await this.reclaimStaleLock();
        if (!reclaimed) throw new Error("\u53E6\u4E00\u4E2A\u65F6\u95F4\u6846\u67B6\u5199\u5165\u5668\u6B63\u5728\u5DE5\u4F5C");
        await import_promises.default.mkdir(this.paths.lock);
      } else {
        throw error;
      }
    }
    try {
      await writeFileSynced(import_node_path2.default.join(this.paths.lock, "owner.json"), serialize({ ownerToken: this.ownerToken, acquiredAt: nowIso(), pid: process.pid }));
      return await action();
    } finally {
      await import_promises.default.rm(this.paths.lock, { recursive: true, force: true });
    }
  }
  async reclaimStaleLock() {
    const ownerPath = import_node_path2.default.join(this.paths.lock, "owner.json");
    let owner;
    try {
      owner = JSON.parse(await import_promises.default.readFile(ownerPath, "utf8"));
    } catch {
      return false;
    }
    const pid = Number(owner.pid);
    let processAlive = false;
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        processAlive = true;
      } catch (error) {
        if (error.code === "EPERM") processAlive = true;
        else if (error.code !== "ESRCH") return false;
      }
    }
    const ageMs = Date.now() - new Date(owner.acquiredAt || 0).getTime();
    const stale = !processAlive || owner.ownerToken !== this.ownerToken && Number.isFinite(ageMs) && ageMs > 12e4;
    if (!stale) return false;
    const quarantine = import_node_path2.default.join(this.paths.recovery, `${Date.now()}-stale-writer-lock`);
    await import_promises.default.mkdir(this.paths.recovery, { recursive: true });
    await import_promises.default.rename(this.paths.lock, quarantine);
    return true;
  }
  async persistJournal(value) {
    await import_promises.default.rm(this.paths.journalTemp, { force: true });
    await writeFileSynced(this.paths.journalTemp, serialize(value));
    await import_promises.default.rename(this.paths.journalTemp, this.paths.journal);
  }
  async recover() {
    if (!await exists(this.paths.journal)) {
      if (await exists(this.paths.candidate)) await this.quarantine(this.paths.candidate, "orphan-candidate");
      return;
    }
    const journal = JSON.parse(await import_promises.default.readFile(this.paths.journal, "utf8"));
    const current = await exists(this.paths.current) ? await validatedFile(this.paths.current, "\u6062\u590D current") : null;
    if (current && current.hash === journal.afterHash) {
      await import_promises.default.rm(this.paths.candidate, { force: true });
      await import_promises.default.rm(this.paths.journal, { force: true });
      return;
    }
    if (await exists(this.paths.candidate)) {
      const candidate = await validatedFile(this.paths.candidate, "\u6062\u590D candidate");
      if (candidate.hash === journal.afterHash) {
        if (await exists(this.paths.current)) await this.quarantine(this.paths.current, "replaced-current");
        await import_promises.default.rename(this.paths.candidate, this.paths.current);
        await import_promises.default.rm(this.paths.journal, { force: true });
        return;
      }
    }
    if (!current && await exists(this.paths.previous)) {
      const previous = await validatedFile(this.paths.previous, "\u6062\u590D previous");
      if (!journal.beforeHash || previous.hash !== journal.beforeHash) throw new Error("previous \u4E0E journal.beforeHash \u4E0D\u4E00\u81F4\uFF0C\u62D2\u7EDD\u6062\u590D");
      await import_promises.default.rename(this.paths.previous, this.paths.current);
      await import_promises.default.rm(this.paths.journal, { force: true });
      return;
    }
    if (current && current.hash === journal.beforeHash) {
      await import_promises.default.rm(this.paths.candidate, { force: true });
      await import_promises.default.rm(this.paths.journal, { force: true });
      return;
    }
    throw new Error("\u5B58\u5728\u65E0\u6CD5\u81EA\u52A8\u88C1\u51B3\u7684\u65F6\u95F4\u6846\u67B6\u6062\u590D\u8BC1\u636E\uFF0C\u5DF2\u8FDB\u5165\u53EA\u8BFB\u6A21\u5F0F");
  }
  async quarantine(source, label) {
    const bucket = import_node_path2.default.join(this.paths.recovery, `${Date.now()}-${label}`);
    await import_promises.default.mkdir(bucket, { recursive: true });
    await import_promises.default.rename(source, import_node_path2.default.join(bucket, import_node_path2.default.basename(source)));
  }
  async read() {
    if (!await exists(this.paths.current)) return createEmptyStore();
    return structuredClone((await validatedFile(this.paths.current, "\u8BFB\u53D6\u65F6\u95F4\u6846\u67B6")).value);
  }
  save(mutator, reason = "owner-mutation", options = {}) {
    const run = async () => {
      if (this.profile === "read-only") throw new Error(`\u65F6\u95F4\u6846\u67B6\u5904\u4E8E\u53EA\u8BFB\u6A21\u5F0F\uFF1A${this.readOnlyReason}`);
      return await this.withLock(async () => {
        await this.recover();
        const hasCurrent = await exists(this.paths.current);
        const currentFile = hasCurrent ? await validatedFile(this.paths.current, "\u5199\u5165\u524D current") : null;
        const current = currentFile?.value || createEmptyStore();
        if (Number.isInteger(options.expectedRevision) && current.revision !== options.expectedRevision) {
          throw new Error(`\u6570\u636E\u5DF2\u53D8\u5316\uFF1A\u671F\u671B revision ${options.expectedRevision}\uFF0C\u5F53\u524D\u4E3A ${current.revision}`);
        }
        const draft = structuredClone(current);
        this.hook("before-mutator", { reason, revision: current.revision });
        await mutator(draft, structuredClone(current));
        assertAppendOnlyHistory(current, draft);
        draft.revision = current.revision + 1;
        draft.updatedAt = nowIso();
        assertValidStore(draft);
        const body = serialize(draft);
        const afterHash = hashText2(body);
        await import_promises.default.rm(this.paths.candidate, { force: true });
        await writeFileSynced(this.paths.candidate, body);
        const candidate = await validatedFile(this.paths.candidate, "candidate readback");
        if (candidate.hash !== afterHash) throw new Error("candidate hash readback mismatch");
        const journal = {
          schemaVersion: 1,
          transactionId: `tx_${(0, import_node_crypto3.randomUUID)().replaceAll("-", "")}`,
          reason,
          beforeHash: currentFile?.hash || null,
          afterHash,
          startedAt: nowIso(),
          phase: "candidate-ready"
        };
        await this.persistJournal(journal);
        await import_promises.default.rm(this.paths.previous, { force: true });
        if (hasCurrent) await import_promises.default.rename(this.paths.current, this.paths.previous);
        journal.phase = "current-moved";
        await this.persistJournal(journal);
        try {
          await import_promises.default.rename(this.paths.candidate, this.paths.current);
          const installed = await validatedFile(this.paths.current, "installed current");
          if (installed.hash !== afterHash) throw new Error("installed hash mismatch");
        } catch (error) {
          if (!await exists(this.paths.current) && await exists(this.paths.previous)) await import_promises.default.rename(this.paths.previous, this.paths.current);
          throw error;
        }
        journal.phase = "committed";
        await this.persistJournal(journal);
        await import_promises.default.rm(this.paths.journal, { force: true });
        this.hook("after-commit", { reason, revision: draft.revision, hash: afterHash });
        this.emitDirty({ reason, revision: draft.revision, hash: afterHash });
        return structuredClone(draft);
      });
    };
    const pending = this.queue.then(run, run);
    this.queue = pending.catch(() => {
    });
    return pending;
  }
};

// src/time-toc.mjs
function boundedTimeTocWindow(total, currentIndex, radius = 3) {
  const count = Math.max(0, Number.isInteger(total) ? total : 0);
  if (!count) return [];
  const boundedRadius = Math.max(0, Number.isInteger(radius) ? radius : 3);
  const windowSize = Math.min(count, boundedRadius * 2 + 1);
  const current = Math.max(0, Math.min(count - 1, Number.isInteger(currentIndex) ? currentIndex : 0));
  let start = Math.max(0, current - boundedRadius);
  let end = Math.min(count, start + windowSize);
  start = Math.max(0, end - windowSize);
  return Array.from({ length: end - start }, (_, offset) => start + offset);
}
function timeTocCurrentIndex(metrics, readingY) {
  if (!Array.isArray(metrics) || !metrics.length) return -1;
  const point = Number(readingY);
  if (!Number.isFinite(point)) return 0;
  for (let index = 0; index < metrics.length; index += 1) {
    const item = metrics[index];
    if (point >= item.top && point < item.bottom) return index;
    if (point < item.top) return index;
  }
  return metrics.length - 1;
}
function resolveCurrentTimeFocus(options = {}) {
  if (options.armed !== true) return { consumed: false, index: -1, reason: "not-armed" };
  if (options.hasManualPath === true) return { consumed: true, index: -1, reason: "manual-path" };
  if (options.hasExplicitAnchor === true) return { consumed: true, index: -1, reason: "explicit-anchor" };
  const boxes = Array.isArray(options.boxes) ? options.boxes : [];
  const targetBoxId = typeof options.targetBoxId === "string" ? options.targetBoxId : "";
  const index = boxes.findIndex((box) => box?.id === targetBoxId);
  return { consumed: true, index, reason: index >= 0 ? "current-period" : "out-of-range" };
}
function timeTreeInstanceIdentity(frameworkId, timeBoxId, membershipId) {
  return `time:${JSON.stringify([String(frameworkId), String(timeBoxId), String(membershipId)])}`;
}
function timeTreeBranchIdentity(treeInstanceKey, outcomeId) {
  return `branch:${JSON.stringify([String(treeInstanceKey), String(outcomeId)])}`;
}

// src/main.mjs
var VIEW_TYPE = "temporal-framework-view";
var API_KEY = "__temporalFrameworkPluginApi";
var SCALE_LABELS = { year: "\u5E74", quarter: "\u5B63\u5EA6", month: "\u6708", week: "\u5468" };
var RELATION_LABELS = { precedes: "\u5148\u4E8E", requires: "\u4E3A\u5176\u524D\u7F6E\u6761\u4EF6", contributes_to: "\u5171\u540C\u6C47\u805A\u5230" };
var RELATION_ENDPOINT_LABELS = {
  precedes: { outgoing: "\u5148\u4E8E", incoming: "\u540E\u4E8E" },
  requires: { outgoing: "\u4F5C\u4E3A\u524D\u7F6E", incoming: "\u4F9D\u8D56\u4E8E" },
  contributes_to: { outgoing: "\u6C47\u805A\u5230", incoming: "\u6C47\u805A\u81EA" }
};
var MAX_OUTCOME_EXPANSION_DEPTH = 32;
var nextTemporalViewInstanceId = 0;
function el(tag, className = "", textValue) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textValue !== void 0) node.textContent = String(textValue);
  return node;
}
function button(label, icon, handler, className = "") {
  const node = el("button", `tf-button ${className}`.trim());
  node.type = "button";
  node.title = label;
  if (icon) {
    const iconNode = el("span", "tf-button__icon");
    (0, import_obsidian.setIcon)(iconNode, icon);
    node.append(iconNode);
  }
  if (label) node.append(el("span", "tf-button__label", label));
  node.addEventListener("click", handler);
  return node;
}
function iconButton(label, icon, handler, className = "") {
  const node = button("", icon, handler, `tf-icon-button ${className}`.trim());
  node.setAttribute("aria-label", label);
  node.title = label;
  return node;
}
function dateRange(startDate, endDateExclusive) {
  return `${startDate} - ${addDays(endDateExclusive, -1)}`;
}
function placementDatesEqual(left, right) {
  return left?.startDate === right?.startDate && left?.endDateExclusive === right?.endDateExclusive && effectiveDueOn(left) === effectiveDueOn(right);
}
function activeValues2(map) {
  return Object.values(map || {}).filter((item) => item.status === "active");
}
function defaultFrameworkDates() {
  const today = localDate();
  return { startDate: `${today.slice(0, 4)}-01-01`, endDateExclusive: `${Number(today.slice(0, 4)) + 3}-01-01` };
}
function appendFieldControl(field, value, onChange) {
  let control;
  if (field.type === "textarea") {
    control = el("textarea", "tf-textarea");
    control.rows = field.rows || 4;
  } else if (field.type === "select") {
    control = el("select", "tf-input");
    const appendOptions = (parent, options) => {
      for (const optionValue of options || []) {
        const [key, label] = Array.isArray(optionValue) ? optionValue : [optionValue.value, optionValue.label];
        const option = el("option", "", label);
        option.value = key;
        parent.append(option);
      }
    };
    if (field.groups?.length) {
      for (const groupValue of field.groups) {
        const group = el("optgroup");
        group.label = groupValue.label;
        appendOptions(group, groupValue.options);
        control.append(group);
      }
    } else {
      appendOptions(control, field.options);
    }
  } else {
    control = el("input", "tf-input");
    control.type = field.type || "text";
    if (field.min !== void 0) control.min = String(field.min);
    if (field.max !== void 0) control.max = String(field.max);
  }
  control.value = value ?? "";
  control.addEventListener("input", () => onChange(control.value));
  return control;
}
var TemporalFormModal = class extends import_obsidian.Modal {
  constructor(plugin, options) {
    super(plugin.app);
    this.plugin = plugin;
    this.options = options;
    this.allowClose = false;
    this.submitting = false;
    this.session = plugin.drafts.openSession({
      recordType: options.recordType,
      recordId: options.recordId || null,
      baseRevision: options.baseRevision ?? null,
      baseHash: options.baseHash ?? null
    }, options.initial || {});
    this.value = structuredClone(this.session.value);
  }
  onOpen() {
    this.modalEl.addClass("tf-modal");
    for (const className of String(this.options.modalClass || "").split(/\s+/).filter(Boolean)) this.modalEl.addClass(className);
    this.titleEl.setText(this.options.title);
    if (this.options.message) this.contentEl.append(el("p", "tf-modal__message", this.options.message));
    const form = el("form", "tf-form");
    let refreshValidation = () => {
    };
    for (const field of this.options.fields || []) {
      const wrap = el("label", `tf-field ${field.wide ? "is-wide" : ""}`);
      wrap.append(el("span", "tf-field__label", field.label));
      const control = appendFieldControl(field, this.value[field.key], (value) => {
        this.value[field.key] = value;
        this.plugin.drafts.update(this.session, this.value);
        refreshValidation();
      });
      if (field.placeholder) control.placeholder = field.placeholder;
      wrap.append(control);
      form.append(wrap);
    }
    const validation = this.options.validate ? el("div", "tf-form-validation") : null;
    if (validation) {
      validation.setAttribute("aria-live", "polite");
      validation.setAttribute("role", "status");
      form.append(validation);
    }
    const actions = el("div", "tf-form__actions");
    for (const action of this.options.leadingActions || []) {
      actions.append(button(action.label, action.icon, () => action.onClick(this), action.className || "is-quiet"));
    }
    actions.append(button("\u653E\u5F03\u672C\u6B21\u4FEE\u6539", "trash-2", () => {
      if (!window.confirm("\u53EA\u653E\u5F03\u672C\u7A97\u53E3\u5C1A\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF0C\u4E0D\u5F71\u54CD\u5DF2\u7ECF\u4FDD\u5B58\u7684\u9636\u6BB5\u6210\u679C\u3002\u786E\u8BA4\u7EE7\u7EED\uFF1F")) return;
      this.plugin.drafts.discard(this.session);
      this.allowClose = true;
      super.close();
    }, "is-quiet"));
    actions.append(button("\u53D6\u6D88", "x", () => this.close(), "is-quiet"));
    const save = button(this.options.submitLabel || "\u4FDD\u5B58", this.options.submitIcon || "check", () => form.requestSubmit(), "is-primary");
    save.type = "submit";
    actions.append(save);
    form.append(actions);
    let validationResult = { valid: true, message: "" };
    refreshValidation = () => {
      validationResult = this.options.validate ? this.options.validate(structuredClone(this.value)) : { valid: true, message: "" };
      if (validation) {
        validation.className = `tf-form-validation ${validationResult.valid ? "is-valid" : "is-invalid"}`;
        validation.empty();
        if (this.options.renderValidation) this.options.renderValidation(validation, validationResult);
        else validation.append(el("span", "", validationResult.message || (validationResult.valid ? "\u53EF\u4EE5\u4FDD\u5B58" : "\u8BF7\u68C0\u67E5\u8F93\u5165")));
      }
      save.disabled = this.submitting || validationResult.valid === false;
    };
    refreshValidation();
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (this.submitting) return;
      refreshValidation();
      if (validationResult.valid === false) return;
      this.submitting = true;
      save.disabled = true;
      try {
        this.plugin.drafts.beginCommit(this.session);
        const result = await this.options.onSubmit(structuredClone(this.value), this.session, this);
        if (result?.keepOpen) {
          this.plugin.drafts.deferCommit(this.session);
          return;
        }
        this.plugin.drafts.completeCommit(this.session);
        this.allowClose = true;
        super.close();
      } catch (error) {
        try {
          this.plugin.drafts.failCommit(this.session);
        } catch (draftError) {
          console.error("[TemporalFramework][draft.recovery-failed]", draftError);
        }
        new import_obsidian.Notice(error.message, 9e3);
      } finally {
        this.submitting = false;
        refreshValidation();
      }
    });
    this.contentEl.append(form);
  }
  completeExternalCommit() {
    if (this.allowClose) {
      this.plugin.drafts.discard(this.session);
      return;
    }
    this.plugin.drafts.beginCommit(this.session);
    this.plugin.drafts.completeCommit(this.session);
    this.allowClose = true;
    super.close();
  }
  close() {
    if (this.allowClose) return super.close();
    try {
      this.plugin.drafts.flushSync(this.session);
      this.allowClose = true;
      super.close();
    } catch (error) {
      new import_obsidian.Notice(`\u8349\u7A3F\u672A\u80FD\u5199\u76D8\uFF0C\u7A97\u53E3\u4FDD\u6301\u6253\u5F00\uFF1A${error.message}`, 1e4);
    }
  }
  onClose() {
    try {
      this.plugin.drafts.closeSession(this.session);
    } catch (error) {
      console.error("[TemporalFramework][draft.close-failed]", error);
    }
    this.contentEl.empty();
  }
};
var RelationConflictModal = class extends import_obsidian.Modal {
  constructor(plugin, framework, projection, diagnostics) {
    super(plugin.app);
    this.plugin = plugin;
    this.framework = framework;
    this.projection = projection;
    this.diagnostics = diagnostics;
  }
  onOpen() {
    this.modalEl.addClass("tf-modal", "is-relation-conflict-modal");
    this.titleEl.setText("\u5173\u7CFB\u65F6\u95F4\u51B2\u7A81");
    this.contentEl.append(el("p", "tf-modal__message", "\u9009\u62E9\u4E00\u7EC4\u51B2\u7A81\u6210\u679C\uFF0C\u5728\u540C\u4E00\u65F6\u95F4\u523B\u5EA6\u4E0A\u8054\u5408\u8C03\u6574\u3002"));
    const list = el("div", "tf-conflict-list");
    for (const diagnostic of this.diagnostics) {
      const relation = this.projection.relationsById[diagnostic.relationId];
      const source = this.projection.outcomesById[diagnostic.sourceOutcomeId];
      const target = this.projection.outcomesById[diagnostic.targetOutcomeId];
      if (!relation || !source || !target) continue;
      const row = el("article", "tf-conflict-row");
      const copy = el("div", "tf-conflict-row__copy");
      copy.append(
        el("strong", "tf-conflict-row__title", `${source.title} ${RELATION_LABELS[relation.relationType]} ${target.title}`),
        el("span", "tf-conflict-row__message", diagnostic.message)
      );
      row.append(copy, button("\u8054\u5408\u8C03\u6574", "git-compare-arrows", () => {
        this.close();
        this.plugin.openJointRelationAdjustment(this.framework.id, relation.id);
      }, "is-primary"));
      list.append(row);
    }
    this.contentEl.append(list);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var JointRelationAdjustmentModal = class extends import_obsidian.Modal {
  constructor(plugin, framework, projection, relation, storeSnapshot, baseRevision, options = {}) {
    super(plugin.app);
    this.plugin = plugin;
    this.framework = framework;
    this.projection = projection;
    this.relation = relation;
    this.storeSnapshot = structuredClone(storeSnapshot);
    this.baseRevision = baseRevision;
    this.mode = options.mode === "create" ? "create" : "existing";
    this.onCommitted = options.onCommitted || null;
    this.allowClose = false;
    this.submitting = false;
    const source = outcomePlacement(projection, relation.sourceOutcomeId);
    const target = outcomePlacement(projection, relation.targetOutcomeId);
    this.endpointIds = [relation.sourceOutcomeId, relation.targetOutcomeId];
    this.session = plugin.drafts.openSession({
      recordType: this.mode === "create" ? "relation-create-joint-placement" : "relation-joint-placement",
      recordId: this.mode === "create" ? `${relation.sourceOutcomeId}|${relation.targetOutcomeId}|${relation.relationType}|${relation.id}` : relation.id,
      baseRevision,
      baseHash: hashValue({ relation, source, target })
    }, { valueVersion: 2, placementsByOutcomeId: { [source.outcomeId]: structuredClone(source), [target.outcomeId]: structuredClone(target) }, displayedOutcomeIds: [...this.endpointIds], discoveryReasonsByOutcomeId: {} });
    this.value = this.normalizeDraftValue(this.session.value, source, target);
    this.originalPlacementsByOutcomeId = {};
    for (const outcomeId of this.value.displayedOutcomeIds) {
      const current = outcomePlacement(projection, outcomeId);
      if (current) this.originalPlacementsByOutcomeId[outcomeId] = structuredClone(current);
    }
    this.currentDiagnostics = [];
    this.expandConflictClosure();
    this.axis = this.buildAxis(this.displayedPlacements());
    this.activeInteraction = null;
    this.editor = null;
  }
  normalizeDraftValue(raw, source, target) {
    const legacy = raw?.valueVersion !== 2;
    const placementsByOutcomeId = legacy ? {
      [source.outcomeId]: structuredClone(raw?.source || source),
      [target.outcomeId]: structuredClone(raw?.target || target)
    } : structuredClone(raw.placementsByOutcomeId || {});
    placementsByOutcomeId[source.outcomeId] ||= structuredClone(source);
    placementsByOutcomeId[target.outcomeId] ||= structuredClone(target);
    const requestedOrder = legacy ? this.endpointIds : raw.displayedOutcomeIds || this.endpointIds;
    const displayedOutcomeIds = [];
    for (const outcomeId of [...this.endpointIds, ...requestedOrder]) {
      if (displayedOutcomeIds.includes(outcomeId)) continue;
      const outcome = this.projection.outcomesById[outcomeId];
      const current = outcomePlacement(this.projection, outcomeId);
      if (!outcome || outcome.status !== "active" || !current) continue;
      const candidate = placementsByOutcomeId[outcomeId] || current;
      placementsByOutcomeId[outcomeId] = { ...structuredClone(current), ...structuredClone(candidate), id: current.id, outcomeId, frameworkId: this.framework.id };
      displayedOutcomeIds.push(outcomeId);
    }
    return {
      valueVersion: 2,
      placementsByOutcomeId,
      displayedOutcomeIds,
      discoveryReasonsByOutcomeId: structuredClone(legacy ? {} : raw.discoveryReasonsByOutcomeId || {})
    };
  }
  displayedPlacements() {
    return this.value.displayedOutcomeIds.map((outcomeId) => this.value.placementsByOutcomeId[outcomeId]).filter(Boolean);
  }
  buildAxis(placements) {
    const unionStart = placements.reduce((value, placement) => compareDate(placement.startDate, value) < 0 ? placement.startDate : value, placements[0]?.startDate || this.framework.startDate);
    const unionEnd = placements.reduce((value, placement) => compareDate(placement.endDateExclusive, value) > 0 ? placement.endDateExclusive : value, placements[0]?.endDateExclusive || this.framework.endDateExclusive);
    const padding = Math.max(7, ...placements.map((placement) => daysBetween(placement.startDate, placement.endDateExclusive)));
    const startDate = compareDate(addDays(unionStart, -padding), this.framework.startDate) < 0 ? this.framework.startDate : addDays(unionStart, -padding);
    const endDateExclusive = compareDate(addDays(unionEnd, padding), this.framework.endDateExclusive) > 0 ? this.framework.endDateExclusive : addDays(unionEnd, padding);
    return { startDate, endDateExclusive };
  }
  expandAxis() {
    const desired = this.buildAxis(this.displayedPlacements());
    const next = {
      startDate: compareDate(desired.startDate, this.axis.startDate) < 0 ? desired.startDate : this.axis.startDate,
      endDateExclusive: compareDate(desired.endDateExclusive, this.axis.endDateExclusive) > 0 ? desired.endDateExclusive : this.axis.endDateExclusive
    };
    const changed = next.startDate !== this.axis.startDate || next.endDateExclusive !== this.axis.endDateExclusive;
    this.axis = next;
    return changed;
  }
  relationRule() {
    if (this.relation.relationType === "precedes") return "\u5148\u4E8E\uFF1AA \u7684\u7ED3\u675F\u8FB9\u754C\u4E0D\u5F97\u665A\u4E8E B \u7684\u5F00\u59CB\u65E5\u3002";
    if (this.relation.relationType === "requires") return "\u524D\u7F6E\u6761\u4EF6\uFF1AA \u7684\u76EE\u6807\u5B8C\u6210\u65E5\u5FC5\u987B\u65E9\u4E8E B \u7684\u5F00\u59CB\u65E5\u3002";
    return "\u6C47\u805A\uFF1AA \u7684\u76EE\u6807\u5B8C\u6210\u65E5\u4E0D\u5F97\u665A\u4E8E B \u7684\u5173\u53E3\u65E5\u671F\u3002";
  }
  inputFor(placement) {
    return {
      frameworkId: this.framework.id,
      outcomeId: placement.outcomeId,
      mode: "interval",
      startDate: placement.startDate,
      endDateExclusive: placement.endDateExclusive,
      dueOn: effectiveDueOn(placement),
      declaredScale: placement.declaredScale,
      homeTimeBoxRef: canonicalTimeBox(placement.declaredScale, placement.startDate, this.framework)
    };
  }
  placementInputs() {
    return this.displayedPlacements().map((placement) => this.inputFor(placement));
  }
  localDiagnostics() {
    try {
      return this.mode === "create" ? candidateOutcomeRelationPlacementSetDiagnostics(this.storeSnapshot, this.relation, this.placementInputs(), { relationId: this.relation.id }) : relatedOutcomePlacementSetDiagnostics(this.storeSnapshot, this.relation.id, this.placementInputs());
    } catch (error) {
      return [{ code: "JOINT_CONTEXT_INVALID", constraintType: "identity", outcomeIds: [], adjustableOutcomeIds: [], blocker: true, message: error.message }];
    }
  }
  localViolation() {
    return this.localDiagnostics()[0]?.message || null;
  }
  recordDiscovery(outcomeId, message) {
    const reasons = this.value.discoveryReasonsByOutcomeId[outcomeId] || [];
    if (!reasons.includes(message)) reasons.push(message);
    this.value.discoveryReasonsByOutcomeId[outcomeId] = reasons;
  }
  expandConflictClosure() {
    let addedAny = false;
    const maximum = Object.keys(this.projection.outcomesById).length + 2;
    for (let pass = 0; pass < maximum; pass += 1) {
      const diagnostics = this.localDiagnostics();
      let addedThisPass = false;
      for (const diagnostic of diagnostics) {
        for (const outcomeId of diagnostic.adjustableOutcomeIds || []) {
          if (this.value.displayedOutcomeIds.includes(outcomeId)) {
            if (!this.endpointIds.includes(outcomeId)) this.recordDiscovery(outcomeId, diagnostic.message);
            continue;
          }
          const outcome = this.projection.outcomesById[outcomeId];
          const placement = outcomePlacement(this.projection, outcomeId);
          if (!outcome || outcome.status !== "active" || outcome.frameworkId !== this.framework.id || !placement) continue;
          this.value.displayedOutcomeIds.push(outcomeId);
          this.value.placementsByOutcomeId[outcomeId] = structuredClone(placement);
          this.originalPlacementsByOutcomeId ||= {};
          this.originalPlacementsByOutcomeId[outcomeId] = structuredClone(placement);
          this.recordDiscovery(outcomeId, diagnostic.message);
          addedThisPass = true;
          addedAny = true;
        }
      }
      if (!addedThisPass) {
        this.currentDiagnostics = diagnostics;
        break;
      }
    }
    this.currentDiagnostics = this.localDiagnostics();
    return addedAny;
  }
  changedOutcomeIds() {
    return this.value.displayedOutcomeIds.filter((outcomeId) => !placementDatesEqual(
      this.originalPlacementsByOutcomeId[outcomeId],
      this.value.placementsByOutcomeId[outcomeId]
    ));
  }
  updateDraft() {
    this.plugin.drafts.update(this.session, this.value);
    this.updateStatus();
  }
  updateStatus() {
    const diagnostics = this.localDiagnostics();
    this.currentDiagnostics = diagnostics;
    const changedCount = this.changedOutcomeIds().length;
    this.status.classList.toggle("is-valid", diagnostics.length === 0);
    this.status.classList.toggle("is-conflict", diagnostics.length > 0);
    this.status.replaceChildren();
    if (diagnostics.length) {
      this.status.append(el("strong", "tf-joint-status__summary", `\u4ECD\u6709 ${diagnostics.length} \u9879\u7EA6\u675F\u672A\u6EE1\u8DB3`));
      const list = el("ul", "tf-joint-status__list");
      for (const diagnostic of diagnostics.slice(0, 6)) list.append(el("li", diagnostic.blocker ? "is-blocker" : "", diagnostic.message));
      if (diagnostics.length > 6) list.append(el("li", "", `\u53E6\u6709 ${diagnostics.length - 6} \u9879\uFF0C\u8BF7\u7EE7\u7EED\u8C03\u6574\u4E0B\u65B9\u8F68\u9053`));
      this.status.append(list);
    } else {
      this.status.append(el("strong", "tf-joint-status__summary", this.mode === "create" ? `\u5173\u7CFB\u4E0E\u5168\u90E8\u7EA6\u675F\u5DF2\u6EE1\u8DB3\uFF0C\u5C06\u5EFA\u7ACB\u5173\u7CFB\u5E76\u4FDD\u5B58 ${changedCount} \u9879\u65F6\u95F4\u8C03\u6574` : `\u5168\u90E8\u7EA6\u675F\u5DF2\u6EE1\u8DB3\uFF0C\u53EF\u4EE5\u540C\u65F6\u4FDD\u5B58 ${changedCount} \u9879\u65F6\u95F4\u8C03\u6574`));
    }
    if (this.saveButton) {
      const label = this.mode === "create" ? `\u5EFA\u7ACB\u5173\u7CFB\u5E76\u4FDD\u5B58 ${changedCount} \u9879\u8C03\u6574` : `\u540C\u65F6\u4FDD\u5B58 ${changedCount} \u9879\u8C03\u6574`;
      const labelEl = this.saveButton.querySelector(".tf-button__label");
      if (labelEl) labelEl.textContent = label;
      this.saveButton.title = label;
      this.saveButton.disabled = diagnostics.length > 0 || this.submitting || this.mode === "existing" && changedCount === 0;
    }
  }
  renderAxis() {
    const axis = el("div", "tf-joint-axis");
    const totalDays = daysBetween(this.axis.startDate, this.axis.endDateExclusive);
    const tickCount = Math.min(7, Math.max(2, Math.ceil(totalDays / 7) + 1));
    for (let index = 0; index < tickCount; index += 1) {
      const offset = Math.round((totalDays - 1) * index / Math.max(1, tickCount - 1));
      const tick = el("div", "tf-joint-axis__tick");
      tick.style.left = `${offset / Math.max(1, totalDays - 1) * 100}%`;
      tick.append(el("span", "tf-joint-axis__line"), el("span", "tf-joint-axis__label", addDays(this.axis.startDate, offset)));
      axis.append(tick);
    }
    return axis;
  }
  deriveCandidate(outcomeId, mode, dayOffset, origin, pointerStartDay = null) {
    const totalDays = daysBetween(this.axis.startDate, this.axis.endDateExclusive);
    const next = { ...origin };
    if (mode === "move") {
      const duration = daysBetween(origin.startDate, origin.endDateExclusive);
      const originStart = daysBetween(this.axis.startDate, origin.startDate);
      const delta = dayOffset - pointerStartDay;
      const nextStart = Math.max(0, Math.min(totalDays - duration, originStart + delta));
      next.startDate = addDays(this.axis.startDate, nextStart);
      next.endDateExclusive = addDays(next.startDate, duration);
      next.dueOn = addDays(effectiveDueOn(origin), nextStart - originStart);
    } else if (mode === "start") {
      next.startDate = addDays(this.axis.startDate, Math.min(dayOffset, daysBetween(this.axis.startDate, origin.endDateExclusive) - 1));
      if (compareDate(effectiveDueOn(next), next.startDate) < 0) next.dueOn = next.startDate;
    } else if (mode === "end") {
      const minimumEnd = daysBetween(this.axis.startDate, origin.startDate) + 1;
      next.endDateExclusive = addDays(this.axis.startDate, Math.max(minimumEnd, Math.min(totalDays, dayOffset + 1)));
      if (compareDate(effectiveDueOn(next), next.endDateExclusive) >= 0) next.dueOn = addDays(next.endDateExclusive, -1);
    } else {
      const minimum = daysBetween(this.axis.startDate, origin.startDate);
      const maximum = daysBetween(this.axis.startDate, origin.endDateExclusive) - 1;
      next.dueOn = addDays(this.axis.startDate, Math.max(minimum, Math.min(maximum, dayOffset)));
    }
    this.value.placementsByOutcomeId[outcomeId] = next;
    return next;
  }
  renderTrack(outcomeId, marker, index) {
    const outcome = this.projection.outcomesById[outcomeId];
    const diagnosticActive = this.currentDiagnostics.some((item) => item.outcomeIds?.includes(outcomeId));
    const endpointClass = outcomeId === this.relation.sourceOutcomeId ? "is-source" : outcomeId === this.relation.targetOutcomeId ? "is-target" : "is-constraint";
    const row = el("section", `tf-joint-track-row ${endpointClass}${!diagnosticActive && index >= 2 ? " is-resolved" : ""}`);
    const heading = el("div", "tf-joint-track-row__heading");
    const dates = el("span", "tf-joint-track-row__dates");
    heading.append(el("strong", "tf-joint-track-row__title", `${marker}\uFF1A${outcome.title}`), dates);
    row.append(heading);
    if (index >= 2) {
      const reasons = this.value.discoveryReasonsByOutcomeId[outcomeId] || [];
      row.append(el("div", "tf-joint-track-row__reason", diagnosticActive ? reasons.join("\uFF1B") : `\u7EA6\u675F\u5DF2\u89E3\u51B3 \xB7 ${reasons.join("\uFF1B")}`));
    }
    const track = el("div", "tf-joint-track");
    const segment = el("div", "tf-joint-segment");
    const leftHandle = el("button", "tf-joint-handle is-left");
    const rightHandle = el("button", "tf-joint-handle is-right");
    const due = el("button", "tf-joint-due");
    for (const [control, label] of [[segment, `\u79FB\u52A8 ${marker} \u6574\u4E2A\u533A\u95F4`], [leftHandle, `\u8C03\u6574 ${marker} \u5F00\u59CB\u65E5\u671F`], [rightHandle, `\u8C03\u6574 ${marker} \u7ED3\u675F\u8FB9\u754C`], [due, `\u8C03\u6574 ${marker} \u76EE\u6807\u5B8C\u6210\u65E5`]]) {
      control.type = "button";
      control.title = label;
      control.setAttribute("role", "slider");
      control.setAttribute("aria-label", label);
      control.tabIndex = 0;
      control.dataset.outcomeId = outcomeId;
    }
    segment.dataset.controlMode = "move";
    leftHandle.dataset.controlMode = "start";
    rightHandle.dataset.controlMode = "end";
    due.dataset.controlMode = "due";
    track.append(segment, leftHandle, rightHandle, due);
    row.append(track);
    const applyLayout = () => {
      const candidate = this.value.placementsByOutcomeId[outcomeId];
      const totalDays = daysBetween(this.axis.startDate, this.axis.endDateExclusive);
      const startOffset = daysBetween(this.axis.startDate, candidate.startDate);
      const endOffset = daysBetween(this.axis.startDate, candidate.endDateExclusive);
      const dueOffset = daysBetween(this.axis.startDate, effectiveDueOn(candidate));
      const denominator = Math.max(1, totalDays);
      segment.style.left = `${startOffset / denominator * 100}%`;
      segment.style.width = `${Math.max(1, (endOffset - startOffset) / denominator * 100)}%`;
      leftHandle.style.left = `${startOffset / denominator * 100}%`;
      rightHandle.style.left = `${endOffset / denominator * 100}%`;
      due.style.left = `${dueOffset / denominator * 100}%`;
      dates.textContent = `${dateRange(candidate.startDate, candidate.endDateExclusive)} \xB7 \u76EE\u6807 ${effectiveDueOn(candidate)}`;
      for (const [control, value, maximum, textValue] of [
        [segment, startOffset, totalDays - 1, `${marker} ${dateRange(candidate.startDate, candidate.endDateExclusive)}`],
        [leftHandle, startOffset, totalDays - 1, `${marker} \u5F00\u59CB\u65E5\u671F ${candidate.startDate}`],
        [rightHandle, endOffset, totalDays, `${marker} \u7ED3\u675F\u8FB9\u754C ${candidate.endDateExclusive}`],
        [due, dueOffset, totalDays - 1, `${marker} \u76EE\u6807\u5B8C\u6210\u65E5 ${effectiveDueOn(candidate)}`]
      ]) {
        control.setAttribute("aria-valuemin", "0");
        control.setAttribute("aria-valuemax", String(Math.max(0, maximum)));
        control.setAttribute("aria-valuenow", String(Math.max(0, Math.min(maximum, value))));
        control.setAttribute("aria-valuetext", textValue);
      }
      return candidate;
    };
    const bind = (control, mode) => {
      control.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        this.activeInteraction?.cancel();
        const rect = track.getBoundingClientRect();
        const totalDays = daysBetween(this.axis.startDate, this.axis.endDateExclusive);
        const dayAt = (clientX) => Math.max(0, Math.min(totalDays - 1, Math.floor((clientX - rect.left) / Math.max(1, rect.width) * totalDays)));
        const origin = structuredClone(this.value.placementsByOutcomeId[outcomeId]);
        const pointerStartDay = dayAt(event.clientX);
        let settled = false;
        const cleanup = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("keydown", escape);
        };
        const finish = (commit) => {
          if (settled) return;
          settled = true;
          cleanup();
          this.activeInteraction = null;
          if (!commit) this.value.placementsByOutcomeId[outcomeId] = origin;
          applyLayout();
          if (commit) this.afterInteraction({ outcomeId, mode });
          else this.updateStatus();
        };
        const move = (moveEvent) => {
          this.deriveCandidate(outcomeId, mode, dayAt(moveEvent.clientX), origin, pointerStartDay);
          applyLayout();
          this.updateDraft();
        };
        const up = () => finish(true);
        const escape = (keyEvent) => {
          if (keyEvent.key === "Escape") finish(false);
        };
        this.activeInteraction = { cancel: () => finish(false) };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up, { once: true });
        window.addEventListener("keydown", escape);
        control.addEventListener("pointercancel", () => finish(false), { once: true });
        control.addEventListener("lostpointercapture", () => finish(false), { once: true });
        try {
          control.setPointerCapture(event.pointerId);
        } catch {
        }
      });
      control.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        const current = structuredClone(this.value.placementsByOutcomeId[outcomeId]);
        const originOffset = mode === "end" ? daysBetween(this.axis.startDate, current.endDateExclusive) - 1 : mode === "due" ? daysBetween(this.axis.startDate, effectiveDueOn(current)) : daysBetween(this.axis.startDate, current.startDate);
        this.deriveCandidate(outcomeId, mode, originOffset + delta, current, originOffset);
        applyLayout();
        this.updateDraft();
        this.afterInteraction({ outcomeId, mode });
      });
    };
    bind(segment, "move");
    bind(leftHandle, "start");
    bind(rightHandle, "end");
    bind(due, "due");
    applyLayout();
    return row;
  }
  afterInteraction(focusToken) {
    this.expandConflictClosure();
    this.expandAxis();
    this.plugin.drafts.update(this.session, this.value);
    this.renderEditor(focusToken);
    this.updateStatus();
  }
  renderEditor(focusToken = null) {
    this.editor.replaceChildren();
    this.editor.append(this.renderAxis());
    this.value.displayedOutcomeIds.forEach((outcomeId, index) => {
      const marker = index === 0 ? "A" : index === 1 ? "B" : `\u7EA6\u675F ${index - 1}`;
      this.editor.append(this.renderTrack(outcomeId, marker, index));
    });
    if (focusToken) requestAnimationFrame(() => {
      this.editor.querySelector(`[data-outcome-id="${CSS.escape(focusToken.outcomeId)}"][data-control-mode="${focusToken.mode}"]`)?.focus();
    });
  }
  onOpen() {
    this.modalEl.addClass("tf-modal", "is-joint-relation-modal");
    this.titleEl.setText(this.mode === "create" ? "\u5EFA\u7ACB\u5173\u7CFB\u5E76\u8054\u5408\u8C03\u6574\u65F6\u95F4\u8F68" : "\u8054\u5408\u8C03\u6574\u65F6\u95F4\u8F68");
    const source = this.projection.outcomesById[this.relation.sourceOutcomeId];
    const target = this.projection.outcomesById[this.relation.targetOutcomeId];
    this.contentEl.append(el("p", "tf-modal__message", `${source.title} ${RELATION_LABELS[this.relation.relationType]} ${target.title}`));
    const rule = el("div", "tf-joint-rule", this.relationRule());
    this.status = el("div", "tf-joint-status");
    this.status.setAttribute("role", "status");
    this.status.setAttribute("aria-live", "polite");
    this.editor = el("div", "tf-joint-editor");
    this.renderEditor();
    const actions = el("div", "tf-form__actions tf-joint-actions");
    actions.append(button("\u653E\u5F03\u672C\u6B21\u4FEE\u6539", "trash-2", () => {
      if (!window.confirm("\u53EA\u653E\u5F03\u672C\u7A97\u53E3\u5C1A\u672A\u4FDD\u5B58\u7684\u8054\u5408\u8C03\u6574\uFF0C\u4E0D\u5F71\u54CD\u5DF2\u7ECF\u4FDD\u5B58\u7684\u65F6\u95F4\u5B89\u6392\u3002\u786E\u8BA4\u7EE7\u7EED\uFF1F")) return;
      this.plugin.drafts.discard(this.session);
      this.allowClose = true;
      super.close();
    }, "is-quiet"));
    actions.append(button("\u53D6\u6D88", "x", () => this.close(), "is-quiet"));
    this.saveButton = button(this.mode === "create" ? "\u5EFA\u7ACB\u5173\u7CFB\u5E76\u4FDD\u5B58\u8C03\u6574" : "\u540C\u65F6\u4FDD\u5B58\u8C03\u6574", "check", () => this.submit(), "is-primary");
    actions.append(this.saveButton);
    this.contentEl.append(rule, this.status, this.editor, actions);
    this.plugin.drafts.update(this.session, this.value);
    this.updateStatus();
  }
  async submit() {
    if (this.submitting || this.localViolation()) return;
    this.submitting = true;
    this.updateStatus();
    try {
      this.plugin.drafts.beginCommit(this.session);
      if (this.mode === "create") await this.plugin.commitNewRelationJointAdjustment(this.framework, this.relation, this.placementInputs(), this.baseRevision);
      else await this.plugin.commitJointRelationAdjustment(this.framework, this.relation, this.placementInputs(), this.baseRevision);
      this.plugin.drafts.completeCommit(this.session);
      this.allowClose = true;
      super.close();
      if (this.onCommitted) {
        try {
          this.onCommitted();
        } catch (error) {
          console.error("[TemporalFramework][relation-create.parent-close-failed]", error);
          new import_obsidian.Notice("\u5173\u7CFB\u4E0E\u65F6\u95F4\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u539F\u5173\u7CFB\u7A97\u53E3\u672A\u80FD\u81EA\u52A8\u5173\u95ED", 9e3);
        }
      }
    } catch (error) {
      try {
        this.plugin.drafts.failCommit(this.session);
      } catch (draftError) {
        console.error("[TemporalFramework][draft.recovery-failed]", draftError);
      }
      new import_obsidian.Notice(error.message, 9e3);
    } finally {
      this.submitting = false;
      if (this.status?.isConnected) this.updateStatus();
    }
  }
  close() {
    if (this.allowClose) return super.close();
    this.activeInteraction?.cancel();
    try {
      this.plugin.drafts.flushSync(this.session);
      this.allowClose = true;
      super.close();
    } catch (error) {
      new import_obsidian.Notice(`\u8349\u7A3F\u672A\u80FD\u5199\u76D8\uFF0C\u7A97\u53E3\u4FDD\u6301\u6253\u5F00\uFF1A${error.message}`, 1e4);
    }
  }
  onClose() {
    this.activeInteraction?.cancel();
    try {
      this.plugin.drafts.closeSession(this.session);
    } catch (error) {
      console.error("[TemporalFramework][draft.close-failed]", error);
    }
    this.contentEl.empty();
  }
};
var ImportTargetsModal = class extends import_obsidian.Modal {
  constructor(plugin, framework, targets, existingKeys, onImport) {
    super(plugin.app);
    this.plugin = plugin;
    this.framework = framework;
    this.targets = targets;
    this.existingKeys = existingKeys;
    this.onImport = onImport;
  }
  onOpen() {
    this.modalEl.addClass("tf-modal", "tf-import-modal");
    this.titleEl.setText("\u7EB3\u5165\u76EE\u6807\u4E0E\u9879\u76EE\u4E3B\u952E");
    this.contentEl.append(el("p", "tf-modal__message", "\u9009\u62E9\u8981\u8FDB\u5165\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u7684\u4E3B\u952E\u3002\u5DF2\u7EB3\u5165\u9879\u4FDD\u6301\u52FE\u9009\u5E76\u9501\u5B9A\u3002"));
    const list = el("div", "tf-import-list");
    for (const target of this.targets) {
      const ref = this.plugin.primaryRefFromTarget(target);
      const key = primaryRefKey(ref);
      const row = el("label", "tf-import-row");
      const checkbox = el("input");
      checkbox.type = "checkbox";
      checkbox.value = key;
      checkbox.checked = this.existingKeys.has(key);
      checkbox.disabled = checkbox.checked;
      row.append(checkbox, el("span", `tf-source-dot is-${target.domain}`), el("span", "tf-import-row__label", target.label));
      row.dataset.targetKey = key;
      list.append(row);
    }
    this.contentEl.append(list);
    const actions = el("div", "tf-form__actions");
    actions.append(button("\u53D6\u6D88", "x", () => this.close(), "is-quiet"));
    actions.append(button("\u7EB3\u5165\u6240\u9009", "plus", async () => {
      const selected = [...list.querySelectorAll("input:checked:not(:disabled)")].map((input) => input.value);
      if (!selected.length) return new import_obsidian.Notice("\u6CA1\u6709\u65B0\u7684\u4E3B\u952E\u9700\u8981\u7EB3\u5165");
      try {
        await this.onImport(this.targets.filter((target) => selected.includes(primaryRefKey(this.plugin.primaryRefFromTarget(target)))));
        this.close();
      } catch (error) {
        new import_obsidian.Notice(error.message, 9e3);
      }
    }, "is-primary"));
    this.contentEl.append(actions);
  }
};
var TemporalFrameworkView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.environment = {
      version: 1,
      mode: "time",
      frameworkId: null,
      scale: "year",
      timePath: [],
      outcomePath: [],
      timeProjection: "structure",
      relationLens: "none"
    };
    this.renderGeneration = 0;
    this.renderRevision = 0;
    this.activeRailInteraction = null;
    this.timeToc = null;
    this.outcomeToc = null;
    this.pendingExplicitTimeAnchor = null;
    this.explicitTimeAnchorTimer = null;
    this.outcomeSearchQuery = "";
    this.pendingOutcomeHighlight = null;
    this.outcomeHighlightTimer = null;
    this.outcomeOverviewReturnQueue = new OutcomeOverviewReturnQueue();
    this.outcomeOverviewHighlightTimer = null;
    this.outcomeOverviewCollapsedIds = /* @__PURE__ */ new Set();
    this.timeTreeCollapsedKeys = /* @__PURE__ */ new Set();
    this.pendingCurrentTimeFocus = true;
    this.outcomeOverviewTreeInstanceId = ++nextTemporalViewInstanceId;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "\u65F6\u95F4\u6846\u67B6";
  }
  getIcon() {
    return "calendar-range";
  }
  async onOpen() {
    this.contentEl.addClass("tf-view");
    this.unsubscribe = this.plugin.store.onDirty(() => this.renderPreservingView());
    await this.render();
  }
  async onClose() {
    this.cancelRailInteraction();
    this.disposeTimeToc({ clearExplicit: true });
    this.disposeOutcomeToc();
    this.clearPendingOutcomeHighlight();
    this.outcomeOverviewReturnQueue.clear();
    this.clearOutcomeOverviewReturnHighlight();
    this.outcomeOverviewCollapsedIds.clear();
    this.timeTreeCollapsedKeys.clear();
    this.pendingCurrentTimeFocus = false;
    this.unsubscribe?.();
  }
  getEnvironmentState() {
    return structuredClone(this.environment);
  }
  async applyEnvironmentState(value = {}) {
    this.outcomeOverviewReturnQueue.clear();
    this.clearOutcomeOverviewReturnHighlight();
    this.environment = {
      version: 1,
      mode: ["time", "outcome", "effect"].includes(value.mode) ? value.mode : "time",
      frameworkId: value.frameworkId || null,
      scale: TIME_SCALES.includes(value.scale) ? value.scale : "year",
      timePath: Array.isArray(value.timePath) ? value.timePath.filter((item) => item?.id && TIME_SCALES.includes(item.scale)) : [],
      outcomePath: Array.isArray(value.outcomePath) ? value.outcomePath.filter(Boolean) : [],
      timeProjection: value.timeProjection === "list" ? "list" : "structure",
      relationLens: ["none", ...RELATION_TYPES].includes(value.relationLens) ? value.relationLens : "none"
    };
    this.pendingCurrentTimeFocus = this.environment.mode === "time" && this.environment.timePath.length === 0 && !this.pendingExplicitTimeAnchor;
    await this.render();
  }
  async renderPreservingView() {
    const outcomeOverviewReturn = this.outcomeOverviewReturnQueue.current();
    if (outcomeOverviewReturn) {
      await this.render();
      const intent = this.outcomeOverviewReturnQueue.consume(outcomeOverviewReturn.token, this.environment.frameworkId);
      if (!intent || this.environment.mode !== "outcome" || this.environment.outcomePath.length) return false;
      const target = this.contentEl.querySelector(`.tf-membership-card[data-membership-id="${CSS.escape(intent.membershipId)}"]`);
      if (!target) return false;
      this.scrollToOutcomeMembershipCard(target, "auto");
      this.applyOutcomeOverviewReturnHighlight(target);
      return true;
    }
    const explicitAnchor = this.pendingExplicitTimeAnchor;
    if (explicitAnchor) {
      const highlightRequired = Boolean(this.pendingOutcomeHighlight);
      await this.render();
      const target = this.contentEl.querySelector(`.tf-timebox[data-anchor-key="${CSS.escape(explicitAnchor)}"]`);
      let highlighted = false;
      if (target) {
        this.scrollToTimeBox(target, "auto");
        highlighted = this.applyPendingOutcomeHighlight(target);
      }
      this.clearPendingExplicitTimeAnchor(explicitAnchor);
      return Boolean(target && (!highlightRequired || highlighted));
    }
    const scroll = this.contentEl.scrollTop;
    const anchor = [...this.contentEl.querySelectorAll("[data-anchor-key]")].find((node) => node.getBoundingClientRect().bottom > this.contentEl.getBoundingClientRect().top);
    const anchorKey = anchor?.dataset.anchorKey;
    const relativeTop = anchor ? anchor.getBoundingClientRect().top - this.contentEl.getBoundingClientRect().top : 0;
    await this.render();
    const nextAnchor = anchorKey ? this.contentEl.querySelector(`[data-anchor-key="${CSS.escape(anchorKey)}"]`) : null;
    if (nextAnchor) this.contentEl.scrollTop += nextAnchor.getBoundingClientRect().top - this.contentEl.getBoundingClientRect().top - relativeTop;
    else this.contentEl.scrollTop = scroll;
  }
  async render() {
    this.cancelRailInteraction();
    this.disposeTimeToc();
    this.disposeOutcomeToc();
    const generation = ++this.renderGeneration;
    const store = await this.plugin.store.read();
    if (generation !== this.renderGeneration) return;
    this.renderRevision = store.revision;
    this.renderTimezone = store.timezone || "Asia/Shanghai";
    const projection = reduceTemporalStore(store);
    this.environment.outcomePath = this.environment.outcomePath.filter((id) => projection.outcomesById[id]?.status === "active");
    const frameworks = activeValues2(projection.frameworksById);
    if (!frameworks.some((item) => item.id === this.environment.frameworkId)) this.environment.frameworkId = frameworks[0]?.id || null;
    this.contentEl.empty();
    const shell = el("div", "tf-shell");
    shell.append(this.renderTopbar(frameworks));
    if (!frameworks.length) shell.append(this.renderWelcome());
    else {
      const framework = projection.frameworksById[this.environment.frameworkId];
      shell.append(this.renderContextbar(framework, projection));
      shell.append(this.environment.mode === "time" ? this.renderTimeView(framework, projection) : this.environment.mode === "effect" ? this.renderEffectView(framework, projection) : this.renderOutcomeView(framework, projection));
    }
    this.contentEl.append(shell);
    if (this.environment.mode === "time") {
      this.setupTimeToc();
      this.focusCurrentTimePeriod(frameworks.find((item) => item.id === this.environment.frameworkId) || null);
    } else if (this.environment.mode === "outcome" && !this.environment.outcomePath.length) this.setupOutcomeToc();
  }
  renderTopbar(frameworks) {
    const bar = el("header", "tf-topbar");
    const identity = el("div", "tf-identity");
    identity.append(el("h2", "tf-title", "\u65F6\u95F4\u6846\u67B6"), el("span", "tf-subtitle", "\u672A\u6765\u9636\u6BB5\u6210\u679C\u90E8\u7F72"));
    bar.append(identity);
    if (frameworks.length) {
      const selector = el("select", "tf-framework-select");
      for (const framework of frameworks) {
        const option = el("option", "", framework.title);
        option.value = framework.id;
        option.selected = framework.id === this.environment.frameworkId;
        selector.append(option);
      }
      selector.addEventListener("change", () => {
        this.outcomeOverviewReturnQueue.clear();
        this.clearOutcomeOverviewReturnHighlight();
        this.environment.frameworkId = selector.value;
        this.environment.timePath = [];
        this.environment.outcomePath = [];
        if (this.environment.mode === "time") this.pendingCurrentTimeFocus = true;
        this.render();
      });
      bar.append(selector);
    }
    const modes = el("div", "tf-segmented");
    for (const [mode, label, icon] of [["time", "\u65F6\u95F4", "calendar-range"], ["outcome", "\u6210\u679C", "network"], ["effect", "\u6B63\u5728\u751F\u6548", "activity"]]) {
      modes.append(button(label, icon, () => {
        this.outcomeOverviewReturnQueue.clear();
        this.clearOutcomeOverviewReturnHighlight();
        const previousMode = this.environment.mode;
        this.environment.mode = mode;
        if (mode === "time" && previousMode !== "time" && this.environment.timePath.length === 0) this.pendingCurrentTimeFocus = true;
        this.render();
      }, this.environment.mode === mode ? "is-active" : ""));
    }
    bar.append(modes);
    const actions = el("div", "tf-topbar__actions");
    actions.append(iconButton("\u65B0\u5EFA\u65F6\u95F4\u6846\u67B6", "plus", () => this.plugin.openFrameworkModal()));
    if (frameworks.length) {
      actions.append(iconButton("\u8C03\u6574\u65F6\u95F4\u6846\u67B6\u8FB9\u754C", "calendar-range", () => this.plugin.openFrameworkBoundaryModal(this.environment.frameworkId)));
      actions.append(iconButton("\u7EB3\u5165\u76EE\u6807\u4E0E\u9879\u76EE", "import", () => this.plugin.openImportModal(this.environment.frameworkId)));
    }
    actions.append(iconButton("\u5237\u65B0", "refresh-cw", () => this.renderPreservingView()));
    bar.append(actions);
    return bar;
  }
  renderWelcome() {
    const empty = el("section", "tf-welcome");
    empty.append(el("h3", "", "\u5148\u5EFA\u7ACB\u4E00\u4E2A\u672A\u6765\u65F6\u95F4\u6846\u67B6"));
    empty.append(el("p", "", "\u786E\u5B9A\u6574\u4F53\u65F6\u95F4\u8FB9\u754C\uFF0C\u518D\u628A\u76EE\u6807\u4E0E\u9879\u76EE\u4E3B\u952E\u7EB3\u5165\uFF0C\u968F\u540E\u9010\u5C42\u5E03\u7F6E\u9636\u6BB5\u6210\u679C\u3002"));
    empty.append(button("\u5EFA\u7ACB\u65F6\u95F4\u6846\u67B6", "plus", () => this.plugin.openFrameworkModal(), "is-primary"));
    return empty;
  }
  renderContextbar(framework, projection) {
    const bar = el("section", "tf-contextbar");
    const timeCrumbs = el("div", "tf-breadcrumbs");
    timeCrumbs.append(el("span", "tf-breadcrumbs__label", "\u65F6\u95F4"));
    const root = button(framework.title, "calendar", () => {
      this.environment.timePath = [];
      this.environment.scale = "year";
      this.render();
    }, "is-crumb");
    timeCrumbs.append(root);
    this.environment.timePath.forEach((box, index) => {
      timeCrumbs.append(el("span", "tf-crumb-separator", "/"));
      timeCrumbs.append(button(box.label, "", () => {
        this.environment.timePath = this.environment.timePath.slice(0, index + 1);
        this.environment.scale = nextFinerScale(box.scale);
        this.render();
      }, "is-crumb"));
    });
    const outcomeCrumbs = el("div", "tf-breadcrumbs");
    outcomeCrumbs.append(el("span", "tf-breadcrumbs__label", "\u6210\u679C"));
    outcomeCrumbs.append(button("\u5168\u90E8\u4E3B\u952E", "layers-3", () => this.returnToOutcomeOverview(framework, projection), "is-crumb"));
    this.environment.outcomePath.forEach((outcomeId, index) => {
      const outcome = projection.outcomesById[outcomeId];
      if (!outcome) return;
      outcomeCrumbs.append(el("span", "tf-crumb-separator", "/"));
      outcomeCrumbs.append(button(outcome.title, "", () => {
        this.environment.outcomePath = this.environment.outcomePath.slice(0, index + 1);
        this.render();
      }, "is-crumb"));
    });
    bar.append(timeCrumbs, outcomeCrumbs);
    return bar;
  }
  currentTimeRange(framework) {
    const current = this.environment.timePath.at(-1);
    return current ? { startDate: current.startDate, endDateExclusive: current.endDateExclusive } : framework;
  }
  renderTimeView(framework, projection) {
    const section = el("main", "tf-main tf-time-view");
    const range = this.currentTimeRange(framework);
    const toolbar = el("div", "tf-view-toolbar");
    toolbar.append(el("div", "tf-range-title", `${SCALE_LABELS[this.environment.scale]}\u5C3A\u5EA6 \xB7 ${dateRange(range.startDate, range.endDateExclusive)}`));
    const scales = el("div", "tf-scale-control");
    for (const scale of TIME_SCALES) {
      scales.append(button(SCALE_LABELS[scale], "", () => {
        this.environment.scale = scale;
        this.environment.timePath = [];
        this.pendingCurrentTimeFocus = true;
        this.render();
      }, this.environment.scale === scale ? "is-active" : ""));
    }
    toolbar.append(scales);
    const allowedOutcomeIds = this.focusedOutcomeIds(projection);
    const tools = el("div", "tf-view-toolbar__tools");
    tools.append(this.renderOutcomeSearch(framework, projection));
    if (allowedOutcomeIds) {
      const focused = projection.outcomesById[this.environment.outcomePath.at(-1)];
      tools.append(el("span", "tf-focus-chip", `\u6210\u679C\u7126\u70B9 \xB7 ${focused?.title || "\u5DF2\u5931\u8054"}`));
    } else {
      const projectionControl = el("div", "tf-segmented tf-time-projection-control");
      for (const [mode, label, icon] of [["structure", "\u6811\u7ED3\u6784", "network"], ["list", "\u65F6\u95F4\u6E05\u5355", "list"]]) {
        projectionControl.append(button(label, icon, () => {
          this.environment.timeProjection = mode;
          this.render();
        }, this.environment.timeProjection === mode ? "is-active" : ""));
      }
      tools.append(projectionControl);
    }
    toolbar.append(tools);
    section.append(toolbar);
    const diagnostics = buildFrameworkDiagnostics(projection, framework.id);
    if (diagnostics.length) section.append(this.renderDiagnostics(framework, projection, diagnostics));
    const structured = Boolean(allowedOutcomeIds) || this.environment.timeProjection === "structure";
    const layout = el("div", "tf-time-layout");
    const grid = el("div", `tf-time-grid is-${this.environment.scale}${structured ? " is-structured" : ""}${allowedOutcomeIds ? " has-outcome-focus" : ""}`);
    const relationsByOutcomeId = buildOutcomeRelationProjection(projection, framework.id);
    const timeContext = { ...framework, timezone: this.renderTimezone || framework.timezone || "Asia/Shanghai" };
    const boxes = buildTimeBoxes(range.startDate, range.endDateExclusive, this.environment.scale, timeContext);
    boxes.forEach((box, index) => {
      const card = this.renderTimeBox(framework, projection, box, allowedOutcomeIds, relationsByOutcomeId);
      card.dataset.timeboxIndex = String(index);
      grid.append(card);
    });
    const toc = el("nav", "tf-time-toc");
    toc.setAttribute("aria-label", `${SCALE_LABELS[this.environment.scale]}\u5C3A\u5EA6\u5C40\u90E8\u65F6\u95F4\u5BFC\u822A`);
    toc.append(el("div", "tf-time-toc__eyebrow", `${SCALE_LABELS[this.environment.scale]}\u5BFC\u822A`), el("div", "tf-time-toc__items"));
    layout.append(grid, toc);
    section.append(layout);
    this.timeToc = { boxes, toc, grid, currentIndex: -1, windowKey: "", metrics: null, scrollHandler: null, resizeObserver: null, rafId: null };
    return section;
  }
  renderOutcomeSearch(framework, projection) {
    const entries = buildOutcomeSearchEntries(projection, framework.id);
    const wrap = el("div", "tf-outcome-search");
    const field = el("div", "tf-outcome-search__field");
    const searchIcon = el("span", "tf-outcome-search__icon");
    (0, import_obsidian.setIcon)(searchIcon, "search");
    const input = el("input", "tf-outcome-search__input");
    input.type = "search";
    input.placeholder = "\u641C\u7D22\u6210\u679C";
    input.value = this.outcomeSearchQuery;
    input.autocomplete = "off";
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-label", "\u641C\u7D22\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u7684\u6210\u679C");
    const clear = iconButton("\u6E05\u7A7A\u6210\u679C\u641C\u7D22", "x", () => {
      input.value = "";
      this.outcomeSearchQuery = "";
      input.focus();
      updateResults(true);
    }, "tf-outcome-search__clear");
    field.append(searchIcon, input, clear);
    const panel = el("div", "tf-outcome-search__panel");
    const listbox = el("div", "tf-outcome-search__listbox");
    const listboxId = `tf-outcome-search-list-${this.renderGeneration}`;
    listbox.id = listboxId;
    listbox.setAttribute("role", "listbox");
    listbox.setAttribute("aria-label", "\u6210\u679C\u641C\u7D22\u7ED3\u679C");
    input.setAttribute("aria-controls", listboxId);
    const actions = el("div", "tf-outcome-search__actions");
    const live = el("div", "tf-visually-hidden");
    live.setAttribute("aria-live", "polite");
    panel.append(listbox, actions, live);
    wrap.append(field, panel);
    let results = [];
    let activeIndex = -1;
    let open = false;
    let composing = false;
    const selectedEntry = () => results[activeIndex] || results[0] || null;
    const setOpen = (value) => {
      open = Boolean(value && this.outcomeSearchQuery.trim());
      panel.hidden = !open;
      input.setAttribute("aria-expanded", String(open));
      if (!open) input.removeAttribute("aria-activedescendant");
    };
    const syncActiveOption = () => {
      const options = [...listbox.querySelectorAll('[role="option"]')];
      options.forEach((option, index) => {
        const active2 = index === activeIndex;
        option.classList.toggle("is-active", active2);
        option.setAttribute("aria-selected", String(active2));
      });
      const active = options[activeIndex];
      if (active) {
        input.setAttribute("aria-activedescendant", active.id);
        active.scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    };
    const activate = async (entry) => {
      setOpen(false);
      await this.locateOutcomeSearchEntry(entry, projection, framework);
    };
    const renderResults = () => {
      listbox.empty();
      actions.empty();
      if (!results.length) {
        listbox.append(el("div", "tf-outcome-search__empty", "\u6CA1\u6709\u627E\u5230\u5339\u914D\u6210\u679C"));
        live.textContent = "\u6CA1\u6709\u627E\u5230\u5339\u914D\u6210\u679C";
        input.removeAttribute("aria-activedescendant");
        return;
      }
      results.forEach((entry, index) => {
        const option = el("div", "tf-outcome-search__option");
        option.id = `${listboxId}-option-${index}`;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(index === activeIndex));
        const title = el("div", "tf-outcome-search__title");
        title.append(el("strong", "", entry.title));
        if (entry.outcomeKind === "stage_gate") title.append(el("span", "tf-kind-badge", "\u5173\u53E3"));
        const ownerKind = entry.membershipDomain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE";
        option.append(title);
        option.append(el("div", "tf-outcome-search__context", `${entry.frameworkItemTitle} \xB7 ${ownerKind}\uFF1A${entry.membershipLabel}`));
        const pathLabel = entry.pathStatus === "complete" ? `\u5C42\u7EA7\uFF1A${entry.pathLabel}` : entry.pathStatus === "cycle" ? `\u5C42\u7EA7\u5F02\u5E38\uFF1A${entry.pathLabel}` : `\u8DEF\u5F84\u622A\u65AD\uFF1A${entry.pathLabel}`;
        option.append(el("div", `tf-outcome-search__path ${entry.pathStatus === "complete" ? "" : "is-warning"}`.trim(), pathLabel));
        option.append(el("div", "tf-outcome-search__date", entry.placement ? `\u65F6\u95F4\uFF1A${dateRange(entry.placement.startDate, entry.placement.endDateExclusive)}` : "\u65F6\u95F4\uFF1A\u5C1A\u672A\u5B89\u6392\uFF0C\u5C06\u6253\u5F00\u6210\u679C\u8BE6\u60C5"));
        option.addEventListener("pointerdown", (event) => event.preventDefault());
        option.addEventListener("mouseenter", () => {
          activeIndex = index;
          syncActiveOption();
        });
        option.addEventListener("click", () => activate(entry));
        listbox.append(option);
      });
      const detail = button("\u6253\u5F00\u5F53\u524D\u6210\u679C\u8BE6\u60C5", "arrow-right", () => {
        const entry = selectedEntry();
        if (entry) this.openOutcome(entry.outcomeId, projection);
      }, "is-quiet tf-outcome-search__detail");
      actions.append(detail);
      live.textContent = `\u627E\u5230 ${results.length} \u4E2A\u6210\u679C`;
      syncActiveOption();
    };
    const updateResults = (shouldOpen) => {
      this.outcomeSearchQuery = input.value;
      results = searchOutcomeEntries(entries, input.value);
      activeIndex = results.length ? 0 : -1;
      clear.hidden = !input.value;
      renderResults();
      setOpen(shouldOpen);
    };
    input.addEventListener("compositionstart", () => {
      composing = true;
    });
    input.addEventListener("compositionend", () => {
      composing = false;
      updateResults(true);
    });
    input.addEventListener("input", (event) => {
      if (composing || event.isComposing) return;
      updateResults(true);
    });
    input.addEventListener("focus", () => updateResults(true));
    input.addEventListener("keydown", (event) => {
      if (composing || event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
      if (!results.length) return;
      event.preventDefault();
      setOpen(true);
      if (event.key === "ArrowDown") activeIndex = (activeIndex + 1) % results.length;
      if (event.key === "ArrowUp") activeIndex = (activeIndex - 1 + results.length) % results.length;
      if (event.key === "Enter") return void activate(selectedEntry());
      syncActiveOption();
    });
    wrap.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!wrap.contains(document.activeElement)) setOpen(false);
      }, 0);
    });
    updateResults(false);
    return wrap;
  }
  async locateOutcomeSearchEntry(entry, projection, framework) {
    if (!entry?.placement) return this.openOutcome(entry?.outcomeId, projection);
    this.clearPendingOutcomeHighlight();
    this.pendingCurrentTimeFocus = false;
    this.environment.mode = "time";
    this.environment.timePath = [];
    this.environment.outcomePath = [...entry.pathOutcomeIds];
    this.outcomeSearchQuery = entry.title;
    const timeBox = canonicalTimeBox(this.environment.scale, entry.placement.startDate, framework);
    this.pendingOutcomeHighlight = { outcomeId: entry.outcomeId, timeBoxId: timeBox.id };
    this.pendingExplicitTimeAnchor = timeBox.id;
    const located = await this.renderPreservingView();
    if (!located) {
      this.clearPendingOutcomeHighlight();
      this.openOutcome(entry.outcomeId, projection);
    }
  }
  applyPendingOutcomeHighlight(timeBox) {
    const pending = this.pendingOutcomeHighlight;
    if (!pending || pending.timeBoxId !== timeBox.dataset.anchorKey) return false;
    const card = timeBox.querySelector(`.tf-outcome-card[data-outcome-id="${CSS.escape(pending.outcomeId)}"]`);
    if (!card) return false;
    card.classList.add("is-search-target");
    const titleLine = card.querySelector(".tf-outcome-card__title-line");
    if (titleLine && !titleLine.querySelector(".tf-search-target-badge")) titleLine.append(el("span", "tf-search-target-badge", "\u641C\u7D22\u5B9A\u4F4D"));
    card.querySelector(".tf-outcome-card__main")?.focus({ preventScroll: true });
    if (this.outcomeHighlightTimer) clearTimeout(this.outcomeHighlightTimer);
    this.outcomeHighlightTimer = setTimeout(() => this.clearPendingOutcomeHighlight(), 2800);
    return true;
  }
  clearPendingOutcomeHighlight() {
    if (this.outcomeHighlightTimer) clearTimeout(this.outcomeHighlightTimer);
    this.outcomeHighlightTimer = null;
    this.contentEl.querySelectorAll(".tf-outcome-card.is-search-target").forEach((card) => {
      card.classList.remove("is-search-target");
      card.querySelector(".tf-search-target-badge")?.remove();
    });
    this.pendingOutcomeHighlight = null;
  }
  async returnToOutcomeOverview(framework, projection) {
    const currentOutcomeId = this.environment.outcomePath.at(-1);
    this.clearPendingOutcomeHighlight();
    this.clearPendingExplicitTimeAnchor(this.pendingExplicitTimeAnchor);
    this.clearOutcomeOverviewReturnHighlight();
    const intent = this.outcomeOverviewReturnQueue.queue(projection, framework.id, currentOutcomeId);
    this.environment.mode = "outcome";
    this.environment.outcomePath = [];
    if (intent) await this.renderPreservingView();
    else await this.render();
  }
  scrollToOutcomeMembershipCard(card, behavior = "smooth") {
    const root = this.contentEl.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    const top = rect.top - root.top + this.contentEl.scrollTop - this.timeTocOcclusionHeight() - 12;
    this.contentEl.scrollTo({ top: Math.max(0, top), behavior });
  }
  applyOutcomeOverviewReturnHighlight(card) {
    this.clearOutcomeOverviewReturnHighlight();
    card.classList.add("is-navigation-target");
    this.outcomeOverviewHighlightTimer = setTimeout(() => this.clearOutcomeOverviewReturnHighlight(), 2400);
  }
  clearOutcomeOverviewReturnHighlight() {
    if (this.outcomeOverviewHighlightTimer) clearTimeout(this.outcomeOverviewHighlightTimer);
    this.outcomeOverviewHighlightTimer = null;
    this.contentEl.querySelectorAll(".tf-membership-card.is-navigation-target").forEach((card) => card.classList.remove("is-navigation-target"));
  }
  disposeTimeToc(options = {}) {
    const state = this.timeToc;
    if (state?.scrollHandler) this.contentEl.removeEventListener("scroll", state.scrollHandler);
    if (state?.resizeObserver) state.resizeObserver.disconnect();
    if (state?.rafId) cancelAnimationFrame(state.rafId);
    this.timeToc = null;
    if (options.clearExplicit) {
      if (this.explicitTimeAnchorTimer) clearTimeout(this.explicitTimeAnchorTimer);
      this.explicitTimeAnchorTimer = null;
      this.pendingExplicitTimeAnchor = null;
    }
  }
  timeTocOcclusionHeight() {
    const topbar = this.contentEl.querySelector(".tf-topbar")?.getBoundingClientRect().height || 0;
    const contextbar = this.contentEl.querySelector(".tf-contextbar")?.getBoundingClientRect().height || 0;
    return Math.ceil(topbar + contextbar + 12);
  }
  setupTimeToc() {
    const state = this.timeToc;
    if (!state?.toc?.isConnected) return;
    const cards = [...state.grid.querySelectorAll(":scope > .tf-timebox[data-timebox-index]")];
    if (!cards.length) {
      state.toc.hidden = true;
      return;
    }
    const invalidate = () => {
      state.metrics = null;
      this.scheduleTimeTocUpdate();
    };
    state.scrollHandler = () => this.scheduleTimeTocUpdate();
    this.contentEl.addEventListener("scroll", state.scrollHandler, { passive: true });
    if (typeof ResizeObserver === "function") {
      state.resizeObserver = new ResizeObserver(invalidate);
      state.resizeObserver.observe(this.contentEl);
      state.resizeObserver.observe(state.grid);
    }
    const occlusion = this.timeTocOcclusionHeight();
    state.toc.style.setProperty("--tf-time-toc-top", `${occlusion}px`);
    for (const card of cards) card.style.scrollMarginTop = `${occlusion + 12}px`;
    this.updateTimeToc(true);
  }
  scheduleTimeTocUpdate() {
    const state = this.timeToc;
    if (!state || state.rafId) return;
    state.rafId = requestAnimationFrame(() => {
      if (!this.timeToc || this.timeToc !== state) return;
      state.rafId = null;
      this.updateTimeToc();
    });
  }
  timeTocMetrics() {
    const state = this.timeToc;
    if (!state) return [];
    if (state.metrics) return state.metrics;
    const root = this.contentEl.getBoundingClientRect();
    state.metrics = [...state.grid.querySelectorAll(":scope > .tf-timebox[data-timebox-index]")].map((card) => {
      const rect = card.getBoundingClientRect();
      return { card, top: rect.top - root.top + this.contentEl.scrollTop, bottom: rect.bottom - root.top + this.contentEl.scrollTop };
    });
    return state.metrics;
  }
  updateTimeToc(force = false) {
    const state = this.timeToc;
    if (!state) return;
    const metrics = this.timeTocMetrics();
    const readingY = this.contentEl.scrollTop + this.timeTocOcclusionHeight() + 24;
    const currentIndex = timeTocCurrentIndex(metrics, readingY);
    const indices = boundedTimeTocWindow(state.boxes.length, currentIndex, 3);
    const windowKey = `${currentIndex}:${indices.join(",")}`;
    if (!force && windowKey === state.windowKey) return;
    state.currentIndex = currentIndex;
    state.windowKey = windowKey;
    const list = state.toc.querySelector(".tf-time-toc__items");
    list.empty();
    for (const index of indices) {
      const box = state.boxes[index];
      const active = index === currentIndex;
      const item = el("button", `tf-time-toc__item ${active ? "is-current" : ""}`);
      item.type = "button";
      item.dataset.timeboxIndex = String(index);
      item.setAttribute("aria-label", `\u8F6C\u5230 ${box.label}\uFF0C${dateRange(box.visibleStartDate, box.visibleEndDateExclusive)}`);
      if (active) item.setAttribute("aria-current", "location");
      item.append(el("span", "tf-time-toc__marker", active ? "\u25CF" : "\u25CB"), el("span", "tf-time-toc__label", box.label));
      if (active) item.append(el("span", "tf-time-toc__current", "\u5F53\u524D"));
      item.addEventListener("click", () => this.focusTimeBoxFromToc(box.id, metrics[index]?.card));
      list.append(item);
    }
  }
  focusTimeBoxFromToc(boxId, card) {
    if (!card) return;
    this.pendingCurrentTimeFocus = false;
    this.pendingExplicitTimeAnchor = boxId;
    if (this.explicitTimeAnchorTimer) clearTimeout(this.explicitTimeAnchorTimer);
    this.scrollToTimeBox(card, "smooth");
    this.explicitTimeAnchorTimer = setTimeout(() => this.clearPendingExplicitTimeAnchor(boxId), 900);
  }
  clearPendingExplicitTimeAnchor(boxId) {
    if (this.pendingExplicitTimeAnchor === boxId) this.pendingExplicitTimeAnchor = null;
    if (this.explicitTimeAnchorTimer) clearTimeout(this.explicitTimeAnchorTimer);
    this.explicitTimeAnchorTimer = null;
  }
  scrollToTimeBox(card, behavior = "smooth") {
    const root = this.contentEl.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    const top = rect.top - root.top + this.contentEl.scrollTop - this.timeTocOcclusionHeight() - 12;
    this.contentEl.scrollTo({ top: Math.max(0, top), behavior });
  }
  focusCurrentTimePeriod(framework) {
    if (!framework || this.environment.mode !== "time") return false;
    const timeContext = { ...framework, timezone: this.renderTimezone || framework.timezone || "Asia/Shanghai" };
    const targetBox = canonicalTimeBox(this.environment.scale, dateInTimezone(/* @__PURE__ */ new Date(), timeContext.timezone), timeContext);
    const resolution = resolveCurrentTimeFocus({
      armed: this.pendingCurrentTimeFocus,
      boxes: this.timeToc?.boxes,
      targetBoxId: targetBox.id,
      hasManualPath: this.environment.timePath.length > 0,
      hasExplicitAnchor: Boolean(this.pendingExplicitTimeAnchor)
    });
    if (!resolution.consumed) return false;
    this.pendingCurrentTimeFocus = false;
    if (resolution.index < 0) return false;
    const target = this.timeToc?.grid?.querySelector(`:scope > .tf-timebox[data-timebox-index="${resolution.index}"]`);
    if (!target) return false;
    this.scrollToTimeBox(target, "auto");
    this.updateTimeToc(true);
    return true;
  }
  focusedOutcomeIds(projection) {
    const rootId = this.environment.outcomePath.at(-1);
    if (!rootId || !projection.outcomesById[rootId]) return null;
    const ids = /* @__PURE__ */ new Set([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const outcome of activeValues2(projection.outcomesById)) {
        if (outcome.outlineParentId && ids.has(outcome.outlineParentId) && !ids.has(outcome.id)) {
          ids.add(outcome.id);
          changed = true;
        }
      }
    }
    return ids;
  }
  outcomeIntersectsTimeBox(projection, outcomeId, box) {
    const ids = /* @__PURE__ */ new Set([outcomeId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const outcome of activeValues2(projection.outcomesById)) {
        if (outcome.outlineParentId && ids.has(outcome.outlineParentId) && !ids.has(outcome.id)) {
          ids.add(outcome.id);
          changed = true;
        }
      }
    }
    return activeValues2(projection.placementsById).some((placement) => ids.has(placement.outcomeId) && placementOverlapsBox(placement, box));
  }
  renderDiagnostics(framework, projection, diagnostics) {
    const bar = el("div", "tf-diagnostics");
    const overdue = diagnostics.filter((item) => item.type === "past_unpainted").length;
    const unscheduled = diagnostics.filter((item) => item.type === "outcome_unscheduled").length;
    const missing = diagnostics.filter((item) => item.type === "membership_without_outcome").length;
    const relationConflicts = diagnostics.filter((item) => item.type === "temporal_relation_conflict").length;
    bar.append(el("span", "tf-diagnostics__title", "\u5F85\u8C03\u6574"));
    if (overdue) bar.append(el("span", "tf-diagnostic-chip is-overdue", `\u8FC7\u53BB\u672A\u5B8C\u6210 ${overdue}`));
    if (unscheduled) bar.append(el("span", "tf-diagnostic-chip", `\u672A\u5B89\u6392 ${unscheduled}`));
    if (missing) bar.append(el("span", "tf-diagnostic-chip", `\u5C1A\u65E0\u6210\u679C ${missing}`));
    if (relationConflicts) bar.append(button(`\u5173\u7CFB\u65F6\u95F4\u51B2\u7A81 ${relationConflicts}`, "git-compare-arrows", () => {
      this.plugin.openRelationConflictList(framework, projection, diagnostics.filter((item) => item.type === "temporal_relation_conflict"));
    }, "tf-diagnostic-chip is-overdue is-action"));
    return bar;
  }
  renderTimeBox(framework, projection, box, allowedOutcomeIds = null, relationsByOutcomeId = {}) {
    const card = el("article", "tf-timebox");
    card.dataset.anchorKey = box.id;
    const header = el("header", "tf-timebox__header");
    const zoomable = box.scale !== "week";
    const heading = button(box.label, zoomable ? "maximize-2" : "calendar-days", () => {
      if (!zoomable) return;
      this.pendingCurrentTimeFocus = false;
      this.environment.timePath.push(box);
      this.environment.scale = nextFinerScale(box.scale);
      this.render();
    }, "tf-timebox__zoom");
    header.append(heading, el("span", "tf-timebox__dates", dateRange(box.visibleStartDate, box.visibleEndDateExclusive)));
    const actions = el("div", "tf-timebox__actions");
    actions.append(iconButton("\u5728\u672C\u9636\u6BB5\u65B0\u5EFA\u6210\u679C", "plus", () => this.plugin.openOutcomeModal(framework.id, { box })));
    actions.append(iconButton("\u628A\u5DF2\u6709\u6210\u679C\u5B89\u6392\u5230\u672C\u9636\u6BB5", "calendar-plus", () => this.plugin.openPlacementModal(framework.id, { box })));
    actions.append(iconButton("\u58F0\u660E\u672C\u9636\u6BB5\u65E0\u90E8\u7F72", "circle-slash-2", () => this.plugin.openCoverageModal(framework.id, box)));
    header.append(actions);
    card.append(header);
    const selection = buildTimeBoxPlacementSelection(projection, framework.id, box, { allowedOutcomeIds });
    const placements = selection.placements;
    const body = el("div", "tf-timebox__body");
    if (!placements.length) body.append(el("div", "tf-timebox__empty", "\u5C1A\u672A\u90E8\u7F72\u9636\u6BB5\u6210\u679C"));
    if (allowedOutcomeIds || this.environment.timeProjection === "structure") body.append(this.renderGlobalTimeStructure(projection, placements, box, relationsByOutcomeId));
    else for (const placement of placements) {
      const outcome = projection.outcomesById[placement.outcomeId];
      if (outcome?.status !== "active") continue;
      const entry = el("div", "tf-time-outcome-entry");
      entry.append(this.renderOutcomeCard(projection, outcome, placement, placementMatchesBoxDirectly(placement, box) ? "direct" : "spanning"));
      const relationRow = this.renderTimeOutcomeRelations(projection, outcome.id, relationsByOutcomeId);
      if (relationRow) entry.append(relationRow);
      body.append(entry);
    }
    const coverages = activeValues2(projection.coverageById).filter((coverage) => coverage.frameworkId === framework.id && coverage.timeBoxRef?.id === box.id);
    for (const coverage of coverages) {
      const membership = projection.membershipsById[coverage.membershipId];
      const row = el("div", "tf-coverage");
      row.append(el("span", "", `${membership?.lastKnownLabel || "\u672A\u77E5\u4E3B\u952E"} \xB7 \u672C\u9636\u6BB5\u65E0\u90E8\u7F72 \xB7 ${coverage.reason}`));
      row.append(iconButton("\u64A4\u9500\u65E0\u90E8\u7F72\u51B3\u5B9A", "rotate-ccw", () => this.plugin.openRevokeCoverageModal(coverage)));
      body.append(row);
    }
    card.append(body);
    return card;
  }
  outcomePathLabel(projection, outcomeId) {
    const labels = [];
    const guard = /* @__PURE__ */ new Set();
    let cursor = projection.outcomesById[outcomeId];
    while (cursor && !guard.has(cursor.id) && labels.length < 32) {
      guard.add(cursor.id);
      labels.unshift(cursor.title);
      cursor = cursor.outlineParentId ? projection.outcomesById[cursor.outlineParentId] : null;
    }
    if (cursor) labels.unshift("\u5C42\u7EA7\u5F02\u5E38");
    return labels.join(" \u203A ");
  }
  renderTimeOutcomeRelations(projection, outcomeId, relationsByOutcomeId) {
    const row = el("div", "tf-time-outcome-relations");
    for (const endpoint of relationsByOutcomeId[outcomeId] || []) {
      const peer = projection.outcomesById[endpoint.peerOutcomeId];
      if (peer?.status !== "active") continue;
      const relationLabel = RELATION_ENDPOINT_LABELS[endpoint.relationType]?.[endpoint.direction] || RELATION_LABELS[endpoint.relationType];
      const arrow = endpoint.direction === "outgoing" ? "\u2192" : "\u2190";
      const duplicateLabel = endpoint.duplicateCount > 1 ? ` \xB7 \u91CD\u590D ${endpoint.duplicateCount}` : "";
      const label = `${arrow} ${relationLabel} \xB7 ${peer.title}${duplicateLabel}`;
      const relationButton = button(label, "", () => this.openOutcome(peer.id, projection), `tf-relation-chip ${endpoint.violation ? "is-conflict" : ""}`);
      relationButton.setAttribute("aria-label", `${label}\uFF1B\u70B9\u51FB\u6253\u5F00\u5173\u8054\u6210\u679C`);
      relationButton.dataset.relationIds = (endpoint.relationIds || [endpoint.relationId]).join(",");
      row.append(relationButton);
    }
    return row.childElementCount ? row : null;
  }
  renderGlobalTimeStructure(projection, placements, box, relationsByOutcomeId) {
    const structure = el("div", "tf-time-framework-structure");
    const outerGroups = buildTimeFrameworkItemGroups(projection, placements);
    for (const outer of outerGroups) {
      const itemSection = el("section", `tf-time-framework-item-group ${outer.item ? "" : "is-unassigned"}`.trim());
      itemSection.dataset.frameworkItemId = outer.item?.id || "unassigned";
      const itemHeader = el("header", "tf-time-framework-item-group__header");
      itemHeader.append(el("span", "tf-framework-item-badge", outer.item ? "\u6846\u67B6\u6761\u76EE" : "\u672A\u5F52\u5C5E"));
      itemHeader.append(el("h3", "tf-time-framework-item-group__title", outer.item?.title || "\u672A\u5F52\u5C5E\u76EE\u6807\u4E0E\u9879\u76EE"));
      const membershipIds = new Set(outer.memberships.map((group) => group.membershipId));
      const outcomeCount = outer.placements.length;
      itemHeader.append(el("span", "tf-time-framework-item-group__count", `${membershipIds.size} \u4E2A\u4E3B\u952E \xB7 ${outcomeCount} \u4E2A\u6210\u679C`));
      itemSection.append(itemHeader);
      const membershipBody = el("div", "tf-time-framework-item-group__memberships");
      for (const group of outer.memberships) membershipBody.append(this.renderTimeMembershipGroup(projection, group, box, relationsByOutcomeId));
      itemSection.append(membershipBody);
      structure.append(itemSection);
    }
    return structure;
  }
  renderTimeMembershipGroup(projection, group, box, relationsByOutcomeId) {
    const section = el("section", "tf-time-membership-group");
    section.dataset.membershipId = group.membershipId;
    section.dataset.membershipDomain = group.domain;
    section.setAttribute("aria-label", `${group.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"}\u4E3B\u952E\uFF1A${group.label}`);
    const header = el("header", "tf-time-membership-group__header");
    header.append(el("span", `tf-source-badge is-${group.domain === "goal" ? "goal" : "project"}`, group.domain === "goal" ? "\u76EE\u6807\u4E3B\u952E" : "\u9879\u76EE\u4E3B\u952E"));
    header.append(el("h3", "tf-time-membership-group__title", group.label));
    header.append(el("span", "tf-time-membership-group__count", `${group.placements.length} \u4E2A\u6210\u679C`));
    const body = el("div", "tf-time-membership-group__outcomes");
    const membership = projection.membershipsById[group.membershipId];
    const treeInstanceKey = timeTreeInstanceIdentity(membership?.frameworkId || "missing", box.id, group.membershipId);
    const tree = membership?.id === group.membershipId ? this.renderMembershipOutcomeTree(projection, membership, null, {
      selectedOutcomeIds: group.placements.map((placement) => placement.outcomeId),
      placementByOutcomeId: Object.fromEntries(group.placements.map((placement) => [placement.outcomeId, placement])),
      collapsedKeys: this.timeTreeCollapsedKeys,
      collapseKeyForOutcome: (outcomeId) => timeTreeBranchIdentity(treeInstanceKey, outcomeId),
      treeInstanceKey,
      rootLabel: "\u672C\u9636\u6BB5\u6210\u679C",
      ariaLabel: `${group.label}\u5728${box.label}\u7684\u6210\u679C\u6811`,
      viewportClass: "is-time-tree",
      relationsByOutcomeId
    }) : null;
    if (tree) body.append(tree);
    else body.append(el("div", "tf-inline-empty", "\u672C\u9636\u6BB5\u6CA1\u6709\u53EF\u9A8C\u8BC1\u7684\u6210\u679C\u6811"));
    section.append(header, body);
    return section;
  }
  renderTimeOutcomeForest(projection, placements, box, relationsByOutcomeId, membershipId = null) {
    const forest = el("div", "tf-time-outcome-forest");
    const localForest = buildLocalOutcomeForest(projection, placements, membershipId);
    const placementByOutcome = new Map(Object.entries(localForest.placementByOutcomeId));
    const visibleIds = new Set(localForest.visibleOutcomeIds);
    const childrenByParent = new Map(Object.entries(localForest.childrenByParentId).map(([parentId, childIds]) => [parentId === "__root__" ? null : parentId, childIds.map((id) => projection.outcomesById[id])]));
    const visited = /* @__PURE__ */ new Set();
    const markDescendantsVisited = (outcomeId) => {
      const pending = [...childrenByParent.get(outcomeId) || []];
      const guard = /* @__PURE__ */ new Set();
      while (pending.length) {
        const child = pending.pop();
        if (!child || guard.has(child.id)) continue;
        guard.add(child.id);
        visited.add(child.id);
        pending.push(...childrenByParent.get(child.id) || []);
      }
    };
    const descendantCount = (outcomeId) => {
      const pending = [...childrenByParent.get(outcomeId) || []];
      const guard = /* @__PURE__ */ new Set();
      while (pending.length) {
        const child = pending.pop();
        if (!child || guard.has(child.id)) continue;
        guard.add(child.id);
        pending.push(...childrenByParent.get(child.id) || []);
      }
      return guard.size;
    };
    const renderNode = (outcome, depth, inheritedBudget = null) => {
      if (!outcome || visited.has(outcome.id)) return null;
      visited.add(outcome.id);
      const placement = placementByOutcome.get(outcome.id);
      const children = childrenByParent.get(outcome.id) || [];
      const explicitDepth = this.plugin.outcomeExpansionDepth(outcome.frameworkId, outcome.id);
      const expansionDepth = explicitDepth ?? inheritedBudget ?? 1;
      const collapsed = children.length > 0 && expansionDepth === 0;
      const node = el("section", `tf-time-outcome-node ${depth === 0 ? "is-root" : "is-descendant"} ${children.length ? "has-children" : "is-leaf"} ${collapsed ? "is-collapsed" : ""}`);
      node.dataset.depth = String(depth);
      if (outcome.outlineParentId && (!visibleIds.has(outcome.outlineParentId) || membershipId && projection.outcomesById[outcome.outlineParentId]?.membershipId !== membershipId)) {
        const path4 = el("div", "tf-time-outcome-path");
        path4.append(el("span", "", this.outcomePathLabel(projection, outcome.id)));
        if (membershipId && projection.outcomesById[outcome.outlineParentId]?.membershipId !== membershipId) {
          path4.append(button("\u7236\u6210\u679C\u4F4D\u4E8E\u5176\u4ED6\u4E3B\u952E", "external-link", () => this.openOutcome(outcome.outlineParentId, projection), "is-link tf-cross-membership-parent"));
        }
        node.append(path4);
      }
      node.append(this.renderOutcomeCard(projection, outcome, placement, placementMatchesBoxDirectly(placement, box) ? "direct" : "spanning", children.length ? {
        anchorKey: `${box.id}|${membershipId || outcome.membershipId}|${outcome.id}`,
        expansionDepth,
        onDecrease: () => this.setOutcomeExpansionDepth(outcome, Math.max(0, expansionDepth - 1)),
        onIncrease: () => this.setOutcomeExpansionDepth(outcome, Math.min(MAX_OUTCOME_EXPANSION_DEPTH, expansionDepth + 1))
      } : { anchorKey: `${box.id}|${membershipId || outcome.membershipId}|${outcome.id}` }));
      const relationRow = this.renderTimeOutcomeRelations(projection, outcome.id, relationsByOutcomeId);
      if (relationRow) node.append(relationRow);
      if (children.length) {
        if (expansionDepth <= 0) {
          const hiddenCount = descendantCount(outcome.id);
          const collapsedNotice = el("button", "tf-outcome-collapsed-notice");
          collapsedNotice.type = "button";
          collapsedNotice.setAttribute("aria-label", `\u201C${outcome.title}\u201D\u5DF2\u6536\u62E2\uFF0C\u9690\u85CF ${hiddenCount} \u4E2A\u540E\u4EE3\uFF0C\u70B9\u51FB\u5C55\u5F00\u4E00\u5C42`);
          (0, import_obsidian.setIcon)(collapsedNotice, "plus");
          collapsedNotice.append(el("span", "", `\u5DF2\u6536\u62E2 \xB7 \u9690\u85CF ${hiddenCount} \u4E2A\u540E\u4EE3`));
          collapsedNotice.addEventListener("click", () => this.setOutcomeExpansionDepth(outcome, 1));
          node.append(collapsedNotice);
          markDescendantsVisited(outcome.id);
        } else {
          const childWrap = el("div", "tf-time-outcome-children");
          if (depth >= 32) {
            const limit = el("div", "tf-time-outcome-depth-limit");
            limit.append(el("strong", "", "\u5C42\u7EA7\u8D85\u8FC7 32 \u5C42\uFF0C\u5DF2\u505C\u6B62\u5C55\u5F00"));
            limit.append(el("span", "", "\u4EE5\u4E0B\u5B50\u6210\u679C\u4ECD\u5B8C\u6574\u4FDD\u7559\uFF0C\u8BF7\u70B9\u51FB\u7EE7\u7EED\u67E5\u770B\uFF1A"));
            for (const child of children) {
              limit.append(button(child.title, "arrow-right", () => this.openOutcome(child.id, projection), "is-link"));
              visited.add(child.id);
              markDescendantsVisited(child.id);
            }
            childWrap.append(limit);
          } else {
            for (const child of children) {
              const childNode = renderNode(child, depth + 1, expansionDepth - 1);
              if (childNode) childWrap.append(childNode);
            }
          }
          node.append(childWrap);
        }
      }
      return node;
    };
    for (const root of childrenByParent.get(null) || []) {
      const node = renderNode(root, 0);
      if (node) forest.append(node);
    }
    for (const outcomeId of visibleIds) {
      if (visited.has(outcomeId)) continue;
      const node = renderNode(projection.outcomesById[outcomeId], 0);
      if (node) forest.append(node);
    }
    return forest;
  }
  async setOutcomeExpansionDepth(outcome, depth) {
    await this.plugin.setOutcomeExpansionDepth(outcome.frameworkId, outcome.id, depth);
    await this.renderPreservingView();
  }
  renderOutcomeCard(projection, outcome, placement = null, placementMode = "", options = {}) {
    const completion = projection.completionByOutcomeId[outcome.id];
    const effective = projection.outcomeEffectivenessByOutcomeId?.[outcome.id]?.effective === true;
    const painted = completion?.painted === true;
    const overdue = placement && compareDate(placement.endDateExclusive, addDays(localDate(), 1)) <= 0 && !painted;
    const membership = projection.membershipsById[outcome.membershipId];
    const card = el("article", `tf-outcome-card ${painted ? "is-painted" : ""} ${effective ? "is-effective" : ""} ${overdue ? "is-overdue" : ""} ${placementMode === "spanning" ? "is-spanning" : ""}`.trim());
    card.dataset.anchorKey = options.anchorKey || outcome.id;
    card.dataset.outcomeId = outcome.id;
    const main = el("button", "tf-outcome-card__main");
    main.type = "button";
    main.addEventListener("click", () => this.openOutcome(outcome.id, projection));
    const titleLine = el("div", "tf-outcome-card__title-line");
    titleLine.append(el("span", `tf-completion-mark ${painted ? "is-painted" : ""}`, painted ? "\u2713" : "\u25CB"));
    titleLine.append(el("strong", "tf-outcome-card__title", outcome.title));
    if (outcome.outcomeKind === "stage_gate") titleLine.append(el("span", "tf-kind-badge", "\u5173\u53E3"));
    if (effective) titleLine.append(el("span", "tf-effect-badge", "\u6B63\u5728\u751F\u6548"));
    if (outcome.outlineParentId && projection.outcomesById[outcome.outlineParentId]?.status !== "active") titleLine.append(el("span", "tf-kind-badge is-warning", "\u4E0A\u7EA7\u5DF2\u505C\u7528"));
    main.append(titleLine);
    main.append(el("div", "tf-outcome-card__source", `${membership?.primaryRef?.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"} \xB7 ${membership?.lastKnownLabel || outcome.membershipId}`));
    const meanings = this.renderFrameworkMeaning(projection, "outcome", outcome.id, { compact: true, includeMembership: true });
    if (meanings) main.append(meanings);
    if (placement) main.append(el("div", "tf-outcome-card__date", dateRange(placement.startDate, placement.endDateExclusive)));
    if (overdue) main.append(el("div", "tf-overdue-label", "\u5DF2\u8FC7\u671F\uFF0C\u5C1A\u672A\u624B\u5DE5\u6D82\u8272"));
    card.append(main);
    const actions = el("div", "tf-outcome-card__actions");
    if (Number.isInteger(options.expansionDepth)) {
      const decrease = iconButton(`\u5C06\u201C${outcome.title}\u201D\u5C55\u5F00\u6DF1\u5EA6\u51CF\u81F3 ${Math.max(0, options.expansionDepth - 1)} \u5C42`, "minus", options.onDecrease);
      decrease.disabled = options.expansionDepth <= 0;
      const depth = el("span", "tf-expansion-depth", `${options.expansionDepth}/${MAX_OUTCOME_EXPANSION_DEPTH}`);
      depth.setAttribute("aria-label", `\u5F53\u524D\u5C55\u5F00 ${options.expansionDepth} \u5C42\uFF0C\u6700\u591A ${MAX_OUTCOME_EXPANSION_DEPTH} \u5C42`);
      const increase = iconButton(`\u5C06\u201C${outcome.title}\u201D\u5C55\u5F00\u6DF1\u5EA6\u589E\u81F3 ${Math.min(MAX_OUTCOME_EXPANSION_DEPTH, options.expansionDepth + 1)} \u5C42`, "plus", options.onIncrease);
      increase.disabled = options.expansionDepth >= MAX_OUTCOME_EXPANSION_DEPTH;
      actions.append(decrease, depth, increase);
    }
    actions.append(iconButton(effective ? "\u9000\u51FA\u6B63\u5728\u751F\u6548" : "\u6807\u8BB0\u4E3A\u6B63\u5728\u751F\u6548", effective ? "circle-check-big" : "activity", () => this.plugin.toggleOutcomeEffectiveness(outcome, !effective, this.renderRevision)));
    actions.append(iconButton(painted ? "\u53D6\u6D88\u5B8C\u6210\u6D82\u8272" : "\u624B\u5DE5\u6807\u8BB0\u5B8C\u6210", painted ? "eraser" : "paintbrush", () => painted ? this.plugin.openUnpaintModal(outcome) : this.plugin.openPaintModal(outcome)));
    actions.append(iconButton("\u8C03\u6574\u65F6\u95F4\u5B89\u6392", "calendar-clock", () => this.plugin.openPlacementModal(outcome.frameworkId, { outcomeId: outcome.id })));
    card.append(actions);
    return card;
  }
  openOutcome(outcomeId, projection) {
    this.outcomeOverviewReturnQueue.clear();
    this.clearOutcomeOverviewReturnHighlight();
    this.clearPendingOutcomeHighlight();
    const path4 = [];
    let cursor = projection.outcomesById[outcomeId];
    const guard = /* @__PURE__ */ new Set();
    while (cursor && !guard.has(cursor.id)) {
      guard.add(cursor.id);
      path4.unshift(cursor.id);
      cursor = cursor.outlineParentId ? projection.outcomesById[cursor.outlineParentId] : null;
    }
    this.environment.outcomePath = path4;
    this.environment.mode = "outcome";
    this.render();
  }
  renderOutcomeView(framework, projection) {
    const section = el("main", "tf-main tf-outcome-view");
    const timeFocus = this.environment.timePath.at(-1) || null;
    if (timeFocus) section.append(el("div", "tf-time-focus", `\u65F6\u95F4\u7126\u70B9 \xB7 ${timeFocus.label} \xB7 ${dateRange(timeFocus.startDate, timeFocus.endDateExclusive)}`));
    const currentId = this.environment.outcomePath.at(-1);
    if (!currentId || !projection.outcomesById[currentId]) {
      const memberships = activeValues2(projection.membershipsById).filter((item) => item.frameworkId === framework.id);
      const membershipProjectionIndex = new Map(memberships.map((membership, index) => [membership.id, index]));
      const milestoneOrderIndex = buildMembershipMilestoneOrderIndex(projection);
      const compareMemberships = (left, right) => compareMembershipsByMilestoneOrder(milestoneOrderIndex, left.id, right.id, () => (membershipProjectionIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (membershipProjectionIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER) || left.lastKnownLabel.localeCompare(right.lastKnownLabel, "zh-CN") || left.id.localeCompare(right.id));
      const itemToolbar = el("div", "tf-framework-item-toolbar");
      itemToolbar.append(el("div", "tf-range-title", "\u6846\u67B6\u6761\u76EE\u4E0E\u4E0B\u5C42\u4E3B\u952E"), button("\u65B0\u5EFA\u6846\u67B6\u6761\u76EE", "plus", () => this.plugin.openFrameworkItemModal(framework.id), "is-primary"));
      section.append(itemToolbar);
      const layout = el("div", "tf-outcome-layout");
      const content = el("div", "tf-outcome-framework-list");
      const tocEntries = [];
      const addTocGroup = (target, id, label, groupMemberships) => {
        target.setAttribute("data-outcome-toc-index", String(tocEntries.length));
        tocEntries.push({ id, label, membershipCount: groupMemberships.length, target, kind: "framework" });
        const cards = new Map([...target.querySelectorAll(".tf-membership-card[data-membership-id]")].map((card) => [card.dataset.membershipId, card]));
        for (const membership of groupMemberships) {
          const card = cards.get(membership.id);
          if (!card) continue;
          card.dataset.outcomeTocIndex = String(tocEntries.length);
          tocEntries.push({
            id: membership.id,
            label: membership.lastKnownLabel || membership.id,
            target: card,
            kind: "membership",
            domain: membership.primaryRef?.domain
          });
        }
      };
      const items = activeValues2(projection.frameworkItemsById).filter((item) => item.frameworkId === framework.id);
      for (const item of items) {
        const itemMemberships = memberships.filter((membership) => membership.frameworkItemId === item.id).sort(compareMemberships);
        const itemSection = this.renderFrameworkItemSection(framework, projection, item, itemMemberships, timeFocus);
        itemSection.dataset.outcomeTocIndex = String(tocEntries.length);
        itemSection.dataset.anchorKey = `framework-item:${item.id}`;
        content.append(itemSection);
        addTocGroup(itemSection, item.id, item.title, itemMemberships);
      }
      const unassigned = memberships.filter((membership) => !membership.frameworkItemId).sort(compareMemberships);
      if (unassigned.length || !items.length) {
        const unassignedSection = this.renderFrameworkItemSection(framework, projection, null, unassigned, timeFocus);
        unassignedSection.dataset.outcomeTocIndex = String(tocEntries.length);
        unassignedSection.dataset.anchorKey = "framework-item:unassigned";
        content.append(unassignedSection);
        addTocGroup(unassignedSection, "unassigned", "\u672A\u5F52\u5C5E\u76EE\u6807\u4E0E\u9879\u76EE", unassigned);
      }
      if (!memberships.length) {
        const empty = el("section", "tf-inline-empty");
        empty.append(el("p", "", "\u5F53\u524D\u6846\u67B6\u5C1A\u672A\u7EB3\u5165\u76EE\u6807\u6216\u9879\u76EE\u4E3B\u952E\u3002"));
        empty.append(button("\u7EB3\u5165\u4E3B\u952E", "import", () => this.plugin.openImportModal(framework.id), "is-primary"));
        content.append(empty);
      }
      const toc = el("nav", "tf-outcome-toc");
      toc.setAttribute("aria-label", "\u6210\u679C\u603B\u89C8\u6846\u67B6\u6761\u76EE\u5BFC\u822A");
      toc.append(el("div", "tf-outcome-toc__eyebrow", "\u6846\u67B6\u6761\u76EE \xB7 \u4E3B\u952E"), el("div", "tf-outcome-toc__items"));
      layout.append(content, toc);
      section.append(layout);
      this.outcomeToc = { entries: tocEntries, toc, content, currentIndex: -1, metrics: null, scrollHandler: null, resizeObserver: null, rafId: null };
      return section;
    }
    const outcome = projection.outcomesById[currentId];
    section.append(this.renderOutcomeDetail(framework, projection, outcome));
    return section;
  }
  renderEffectView(framework, projection) {
    const section = el("main", "tf-main tf-effect-view");
    const model = buildEffectiveOutcomeGroups(projection, framework.id);
    const toolbar = el("div", "tf-view-toolbar tf-effect-toolbar");
    const identity = el("div");
    identity.append(el("div", "tf-range-title", "\u6B63\u5728\u751F\u6548\u7684\u6210\u679C"));
    identity.append(el("div", "tf-effect-toolbar__summary", `${model.effectiveOutcomeIds.length} \u4E2A\u7531\u4F60\u624B\u52A8\u786E\u8BA4\u7684\u7A81\u7834\u70B9`));
    toolbar.append(identity);
    section.append(toolbar);
    if (!model.groups.length) {
      const empty = el("section", "tf-effect-empty");
      empty.append(el("h3", "", "\u8FD8\u6CA1\u6709\u6B63\u5728\u751F\u6548\u7684\u6210\u679C"));
      empty.append(el("p", "", "\u5728\u6210\u679C\u5361\u6216\u6210\u679C\u8BE6\u60C5\u4E2D\u70B9\u9009\u201C\u8FDB\u5165\u6B63\u5728\u751F\u6548\u201D\uFF0C\u8FD9\u91CC\u5C31\u4F1A\u6309\u5B83\u5F53\u524D\u6240\u5C5E\u7684\u6846\u67B6\u4E0E\u6210\u679C\u5206\u652F\u6C47\u96C6\u3002"));
      section.append(empty);
      return section;
    }
    const list = el("div", "tf-effect-framework-list");
    for (const group of model.groups) list.append(this.renderEffectFrameworkGroup(projection, group));
    section.append(list);
    if (model.diagnostics.length) console.warn("[TemporalFramework][effect-view.ancestor-diagnostics]", model.diagnostics);
    return section;
  }
  renderEffectFrameworkGroup(projection, group) {
    const panel = el("section", `tf-effect-framework ${group.item ? "" : "is-unassigned"}`.trim());
    const header = el("header", "tf-effect-framework__header");
    header.append(el("span", "tf-framework-item-badge", group.item ? "\u6846\u67B6\u6761\u76EE" : "\u672A\u5F52\u5C5E"));
    header.append(el("h2", "tf-effect-framework__title", group.label));
    panel.append(header);
    const memberships = el("div", "tf-effect-memberships");
    for (const membershipGroup of group.memberships) memberships.append(this.renderEffectMembershipBranch(projection, membershipGroup));
    panel.append(memberships);
    return panel;
  }
  renderEffectMembershipBranch(projection, group) {
    const section = el("section", "tf-effect-membership");
    const membership = group.membership;
    const header = el("header", "tf-effect-membership__header");
    header.append(el("span", `tf-source-badge is-${membership?.primaryRef?.domain || "unknown"}`, membership?.primaryRef?.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"));
    header.append(el("strong", "", membership?.lastKnownLabel || "\u5931\u8054\u4E3B\u952E"));
    section.append(header);
    const forest = el("div", "tf-effect-forest");
    const renderNode = (outcomeId, depth = 0) => {
      const node = group.nodesById[outcomeId];
      if (!node) return null;
      const wrap = el("div", `tf-effect-node ${node.effectiveTarget ? "is-effective-target" : "is-context"} ${node.archivedContext ? "is-archived-context" : ""}`.trim());
      wrap.style.setProperty("--tf-effect-depth", String(Math.min(depth, 16)));
      const externalParent = group.externalParentsByOutcomeId?.[outcomeId] || null;
      if (externalParent) {
        const reference = el("div", "tf-effect-external-parent");
        if (externalParent.crossMembershipBoundary) {
          reference.append(el("span", "tf-effect-boundary", `\u4E0A\u7EA7\u4F4D\u4E8E\u5176\u4ED6\u4E3B\u952E \xB7 ${externalParent.membership?.lastKnownLabel || externalParent.outcome.membershipId}`));
        }
        if (externalParent.crossFrameworkItemBoundary) {
          reference.append(el("span", "tf-effect-boundary", `\u4E0A\u7EA7\u4F4D\u4E8E\u5176\u4ED6\u6846\u67B6\u6761\u76EE \xB7 ${externalParent.item?.title || "\u672A\u5F52\u5C5E"}`));
        }
        const parentButton = button(externalParent.outcome.title, "git-branch", () => {
          if (externalParent.outcome.status === "active") this.openOutcome(externalParent.outcome.id, projection);
        }, "tf-effect-external-parent__target");
        if (externalParent.outcome.status !== "active") parentButton.disabled = true;
        reference.append(parentButton);
        wrap.append(reference);
      }
      const line = el("div", "tf-effect-node__line");
      const target = button(node.outcome.title, node.effectiveTarget ? "activity" : "git-branch", () => {
        if (node.outcome.status === "active") this.openOutcome(node.outcome.id, projection);
      }, "tf-effect-node__target");
      if (node.outcome.status !== "active") target.disabled = true;
      line.append(target);
      if (node.effectiveTarget) line.append(el("span", "tf-effect-badge", "\u6B63\u5728\u751F\u6548"));
      if (node.archivedContext) line.append(el("span", "tf-kind-badge is-warning", "\u5386\u53F2\u4E0A\u7EA7"));
      const milestone = el("span", `tf-effect-node__milestone ${node.directMilestone ? "" : "is-unbound"}`.trim());
      if (node.directMilestone) {
        milestone.append(el("span", "tf-effect-node__milestone-badge", "\u76F4\u63A5\u91CC\u7A0B\u7891"));
        milestone.append(el("span", "tf-effect-node__milestone-sentence", frameworkMilestoneSentence(node.directMilestone)));
      } else if (node.effectiveTarget) {
        milestone.append(el("span", "tf-effect-node__milestone-badge is-unbound", "\u672A\u5173\u8054\u76F4\u63A5\u91CC\u7A0B\u7891"));
      }
      if (milestone.childElementCount) line.append(milestone);
      wrap.append(line);
      const children = el("div", "tf-effect-node__children");
      for (const childId of group.childrenByParentId[outcomeId] || []) {
        const child = renderNode(childId, depth + 1);
        if (child) children.append(child);
      }
      if (children.childElementCount) wrap.append(children);
      return wrap;
    };
    for (const rootId of group.childrenByParentId.__root__ || []) {
      const root = renderNode(rootId);
      if (root) forest.append(root);
    }
    section.append(forest);
    return section;
  }
  renderMembershipCard(framework, projection, membership, timeFocus = null) {
    const card = el("article", "tf-membership-card");
    card.draggable = true;
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("application/x-temporal-membership", membership.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("is-dragging"));
    card.dataset.anchorKey = membership.id;
    card.dataset.membershipId = membership.id;
    const header = el("header", "tf-membership-card__header");
    header.append(el("span", `tf-source-badge is-${membership.primaryRef.domain}`, membership.primaryRef.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"));
    header.append(el("h3", "tf-membership-card__title", membership.lastKnownLabel));
    const headerActions = el("div", "tf-membership-card__actions");
    headerActions.append(iconButton("\u8C03\u6574\u6846\u67B6\u6761\u76EE\u5F52\u5C5E", "folder-input", () => this.plugin.openMembershipAssignmentModal(framework.id, membership.id)));
    if (membership.frameworkItemId) headerActions.append(iconButton("\u5173\u8054\u6846\u67B6\u91CC\u7A0B\u7891", "flag", () => this.plugin.openMilestoneBindingModal(framework.id, "membership", membership.id)));
    const exitBlockers = membershipExitBlockers(projection, membership.id);
    const historicalOutcomes = Object.values(projection.outcomesById || {}).filter((item) => item.membershipId === membership.id);
    if (!historicalOutcomes.length) {
      const remove = iconButton("\u79FB\u51FA\u65F6\u95F4\u6846\u67B6", "trash-2", () => this.plugin.openMembershipExitModal(framework.id, membership.id));
      if (exitBlockers.length) {
        remove.disabled = true;
        remove.title = exitBlockers.map((blocker) => blocker.message).join("\uFF1B");
      }
      headerActions.append(remove);
    }
    headerActions.append(iconButton("\u65B0\u589E\u9996\u5C42\u9636\u6BB5\u6210\u679C", "plus", () => this.plugin.openOutcomeModal(framework.id, { membershipId: membership.id })));
    header.append(headerActions);
    card.append(header);
    const meanings = this.renderFrameworkMeaning(projection, "membership", membership.id, { compact: true });
    if (meanings) card.append(meanings);
    const tree = this.renderMembershipOutcomeTree(projection, membership, timeFocus);
    if (tree) card.append(tree);
    else card.append(el("div", "tf-membership-card__empty", timeFocus ? "\u5F53\u524D\u65F6\u95F4\u7126\u70B9\u4E0B\u6CA1\u6709\u90E8\u7F72\u6210\u679C" : "\u5C1A\u672A\u5F62\u6210\u9636\u6BB5\u6210\u679C\u7ED3\u6784"));
    return card;
  }
  renderMembershipOutcomeTree(projection, membership, timeFocus = null, options = {}) {
    const selectedOutcomeIds = options.selectedOutcomeIds == null ? timeFocus ? membershipOutcomeIdsOverlappingTimeBox(projection, membership.id, timeFocus) : null : [...new Set(options.selectedOutcomeIds)];
    const model = buildMembershipOutcomeTree(projection, membership.id, { selectedOutcomeIds });
    if (!model.visibleOutcomeIds.length) return null;
    const collapsedKeys = options.collapsedKeys || this.outcomeOverviewCollapsedIds;
    const collapseKeyForOutcome = options.collapseKeyForOutcome || ((outcomeId) => outcomeId);
    const treeInstanceKey = options.treeInstanceKey || `outcome:${membership.frameworkId}:${membership.id}`;
    const viewport = el("div", `tf-overview-tree-viewport ${options.viewportClass || ""}`.trim());
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-label", options.ariaLabel || `${membership.lastKnownLabel}\u7684\u5B8C\u6574\u6210\u679C\u6811`);
    const canvas = el("div", "tf-overview-tree-canvas");
    const virtualRoot = el("div", "tf-overview-tree-virtual-root");
    const rootLabel = el("div", "tf-overview-tree-root-label");
    rootLabel.append(el("strong", "", options.rootLabel || "\u6210\u679C\u7ED3\u6784"), el("span", "", `${model.selectedOutcomeIds.length}/${model.visibleOutcomeIds.length}`));
    const roots = el("div", "tf-overview-tree-roots");
    virtualRoot.append(rootLabel, roots);
    canvas.append(virtualRoot);
    viewport.append(canvas);
    const selectedSet = new Set(model.selectedOutcomeIds);
    const contextSet = new Set(model.contextOutcomeIds);
    const visibleSet = new Set(model.visibleOutcomeIds);
    const placementByOutcomeId = new Map(Object.entries(options.placementByOutcomeId || {}));
    if (!options.placementByOutcomeId) {
      for (const placement of activeValues2(projection.placementsById)) {
        if (visibleSet.has(placement.outcomeId) && !placementByOutcomeId.has(placement.outcomeId)) placementByOutcomeId.set(placement.outcomeId, placement);
      }
    }
    const descendantCounts = /* @__PURE__ */ new Map();
    const countStack = [...model.childrenByParentId.__root__ || []].reverse().map((id) => [id, false]);
    while (countStack.length) {
      const [outcomeId, resolved] = countStack.pop();
      const childIds = model.childrenByParentId[outcomeId] || [];
      if (!resolved) {
        countStack.push([outcomeId, true]);
        for (let index = childIds.length - 1; index >= 0; index -= 1) countStack.push([childIds[index], false]);
      } else {
        descendantCounts.set(outcomeId, childIds.reduce((sum, childId) => sum + 1 + (descendantCounts.get(childId) || 0), 0));
      }
    }
    const visited = /* @__PURE__ */ new Set();
    const renderedCardIds = /* @__PURE__ */ new Set();
    const continuationEvidence = /* @__PURE__ */ new Set();
    const renderNode = (outcomeId, depth = 0) => {
      const outcome = model.nodesById[outcomeId];
      if (!outcome || visited.has(outcomeId)) return null;
      visited.add(outcomeId);
      renderedCardIds.add(outcomeId);
      const childIds = model.childrenByParentId[outcomeId] || [];
      const collapseKey = collapseKeyForOutcome(outcomeId);
      const collapsed = childIds.length > 0 && collapsedKeys.has(collapseKey);
      const branch = el("section", `tf-overview-tree-branch ${childIds.length ? "has-children" : "is-leaf"} ${collapsed ? "is-collapsed" : ""} ${contextSet.has(outcomeId) ? "is-time-context" : ""}`.trim());
      branch.dataset.outcomeId = outcomeId;
      const nodeWrap = el("div", "tf-overview-tree-node-wrap");
      const boundary = model.externalParentsByOutcomeId[outcomeId];
      if (boundary) {
        const evidence = el("div", `tf-overview-tree-boundary is-${boundary.reason}`);
        const labels = {
          "cross-membership": "\u4E0A\u7EA7\u4F4D\u4E8E\u5176\u4ED6\u4E3B\u952E",
          "cross-framework": "\u4E0A\u7EA7\u4F4D\u4E8E\u5176\u4ED6\u6846\u67B6",
          archived: "\u4E0A\u7EA7\u5DF2\u505C\u7528",
          missing: "\u4E0A\u7EA7\u7F3A\u5931",
          "identity-invalid": "\u4E0A\u7EA7\u8EAB\u4EFD\u5F02\u5E38",
          "cycle-cut": "\u5386\u53F2\u5FAA\u73AF\u5728\u6B64\u5904\u65AD\u5F00\u663E\u793A"
        };
        evidence.append(el("span", "", labels[boundary.reason] || "\u4E0A\u7EA7\u4E0D\u53EF\u7528\u4E8E\u5F53\u524D\u6811"));
        if (boundary.parent?.status === "active" && boundary.parent.id === boundary.parentId) {
          evidence.append(button(boundary.parent.title || "\u6253\u5F00\u4E0A\u7EA7\u6210\u679C", "external-link", () => this.openOutcome(boundary.parentId, projection), "is-link"));
        }
        nodeWrap.append(evidence);
      }
      const outcomeCard = this.renderOutcomeCard(projection, outcome, placementByOutcomeId.get(outcomeId) || null, "", {
        anchorKey: `${treeInstanceKey}:${outcomeId}`
      });
      nodeWrap.append(outcomeCard);
      if (options.relationsByOutcomeId) {
        const relationRow = this.renderTimeOutcomeRelations(projection, outcomeId, options.relationsByOutcomeId);
        if (relationRow) nodeWrap.append(relationRow);
      }
      branch.append(nodeWrap);
      if (childIds.length) {
        const children = el("div", "tf-overview-tree-children");
        const controlsId = `tf-overview-children-${this.outcomeOverviewTreeInstanceId}-${hashValue({ treeInstanceKey, outcomeId }).slice(0, 16)}`;
        children.id = controlsId;
        if (depth >= MAX_OUTCOME_EXPANSION_DEPTH) {
          const continuation = el("div", "tf-overview-tree-continuation");
          const descendantIds = collectOutcomeTreeDescendantIds(model.childrenByParentId, outcomeId).filter((id) => !visited.has(id));
          continuation.append(el("strong", "", `\u5C42\u7EA7\u8D85\u8FC7 ${MAX_OUTCOME_EXPANSION_DEPTH} \u5C42`));
          continuation.append(el("span", "", `\u4EE5\u4E0B ${descendantIds.length} \u4E2A\u6210\u679C\u4FDD\u7559\u4E3A\u53EF\u7EE7\u7EED\u63ED\u793A\u7684\u5B8C\u6574\u8BC1\u636E\uFF1A`));
          const continuationList = el("div", "tf-overview-tree-continuation__list");
          for (const descendantId of descendantIds) {
            const descendant = model.nodesById[descendantId];
            if (!descendant) continue;
            visited.add(descendantId);
            continuationEvidence.add(descendantId);
            continuationList.append(button(this.outcomePathLabel(projection, descendantId), "arrow-right", () => this.openOutcome(descendantId, projection), "is-link"));
          }
          continuation.append(continuationList);
          children.append(continuation);
        } else {
          for (const childId of childIds) {
            const child = renderNode(childId, depth + 1);
            if (child) children.append(child);
          }
        }
        children.hidden = collapsed;
        branch.append(children);
        const hiddenCount = descendantCounts.get(outcomeId) || childIds.length;
        const toggle = iconButton("", collapsed ? "plus" : "minus", () => {
          this.toggleOutcomeOverviewBranch({ outcome, branch, outcomeCard, children, toggle, viewport, hiddenCount, collapsedKeys, collapseKey });
        }, "tf-overview-tree-toggle");
        toggle.setAttribute("aria-controls", controlsId);
        this.updateOutcomeOverviewToggle(toggle, outcome, collapsed, hiddenCount);
        nodeWrap.append(toggle);
      }
      return branch;
    };
    for (const rootId of model.childrenByParentId.__root__ || []) {
      const root = renderNode(rootId);
      if (root) roots.append(root);
    }
    const unaccounted = model.visibleOutcomeIds.filter((id) => !visited.has(id) && !continuationEvidence.has(id));
    if (unaccounted.length || model.diagnostics.length) {
      console.warn("[TemporalFramework][outcome-overview-tree.diagnostics]", {
        membershipId: membership.id,
        selectedCount: selectedSet.size,
        visibleCount: model.visibleOutcomeIds.length,
        renderedCount: renderedCardIds.size,
        continuationCount: continuationEvidence.size,
        unaccountedOutcomeIds: unaccounted,
        diagnostics: model.diagnostics
      });
    }
    return viewport;
  }
  updateOutcomeOverviewToggle(toggle, outcome, collapsed, hiddenCount) {
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? `\u5C55\u5F00\u201C${outcome.title}\u201D\u7684\u5206\u652F\uFF0C\u5F53\u524D\u9690\u85CF ${hiddenCount} \u4E2A\u540E\u4EE3` : `\u6298\u53E0\u201C${outcome.title}\u201D\u7684\u5206\u652F\uFF0C\u5171 ${hiddenCount} \u4E2A\u540E\u4EE3`);
    toggle.dataset.collapsedCount = collapsed ? String(hiddenCount) : "";
    toggle.title = toggle.getAttribute("aria-label") || "";
    (0, import_obsidian.setIcon)(toggle, collapsed ? "plus" : "minus");
  }
  toggleOutcomeOverviewBranch({ outcome, branch, outcomeCard, children, toggle, viewport, hiddenCount, collapsedKeys = this.outcomeOverviewCollapsedIds, collapseKey = outcome.id }) {
    const rootRect = this.contentEl.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const cardRect = outcomeCard.getBoundingClientRect();
    const pageRelativeTop = cardRect.top - rootRect.top;
    const localRelativeTop = cardRect.top - viewportRect.top;
    const collapsed = !collapsedKeys.has(collapseKey);
    if (collapsed) collapsedKeys.add(collapseKey);
    else collapsedKeys.delete(collapseKey);
    children.hidden = collapsed;
    branch.classList.toggle("is-collapsed", collapsed);
    this.updateOutcomeOverviewToggle(toggle, outcome, collapsed, hiddenCount);
    const localDelta = outcomeCard.getBoundingClientRect().top - viewport.getBoundingClientRect().top - localRelativeTop;
    if (Math.abs(localDelta) > 0.5 && viewport.scrollHeight > viewport.clientHeight) viewport.scrollTop += localDelta;
    const pageDelta = outcomeCard.getBoundingClientRect().top - this.contentEl.getBoundingClientRect().top - pageRelativeTop;
    if (Math.abs(pageDelta) > 0.5) this.contentEl.scrollTop += pageDelta;
  }
  renderFrameworkItemSection(framework, projection, item, memberships, timeFocus) {
    const section = el("section", `tf-framework-item-section ${item ? "" : "is-unassigned"}`.trim());
    section.dataset.frameworkItemId = item?.id || "unassigned";
    section.setAttribute("aria-label", item ? `\u6846\u67B6\u6761\u76EE\uFF1A${item.title}` : "\u672A\u5F52\u5C5E\u76EE\u6807\u4E0E\u9879\u76EE");
    const header = el("header", "tf-framework-item-section__header");
    const identity = el("div", "tf-framework-item-section__identity");
    identity.append(el("span", "tf-framework-item-badge", item ? "\u6846\u67B6\u6761\u76EE" : "\u672A\u5F52\u5C5E"), el("h2", "tf-framework-item-section__title", item?.title || "\u672A\u5F52\u5C5E\u76EE\u6807\u4E0E\u9879\u76EE"));
    if (item?.description) identity.append(el("p", "tf-framework-item-section__description", item.description));
    header.append(identity);
    if (item) {
      const actions = el("div", "tf-framework-item-section__actions");
      actions.append(button("\u65B0\u589E\u91CC\u7A0B\u7891", "flag", () => this.plugin.openFrameworkMilestoneModal(item.id), "is-primary"));
      actions.append(iconButton("\u7F16\u8F91\u6846\u67B6\u6761\u76EE", "pencil", () => this.plugin.openFrameworkItemModal(framework.id, item)));
      actions.append(iconButton("\u505C\u7528\u6846\u67B6\u6761\u76EE", "archive", () => this.plugin.openArchiveFrameworkItemModal(item)));
      header.append(actions);
    }
    section.append(header);
    if (item) {
      const milestones = activeValues2(projection.frameworkMilestonesById).filter((milestone) => milestone.frameworkItemId === item.id).sort((a, b) => compareDate(a.targetDate, b.targetDate));
      const milestoneList = el("div", "tf-framework-milestone-list");
      if (!milestones.length) milestoneList.append(el("div", "tf-inline-empty", "\u8FD8\u6CA1\u6709\u6846\u67B6\u91CC\u7A0B\u7891"));
      for (const milestone of milestones) milestoneList.append(this.renderFrameworkMilestoneLine(projection, milestone));
      section.append(milestoneList);
    }
    const dropzone = el("div", "tf-framework-item-dropzone");
    dropzone.tabIndex = 0;
    dropzone.setAttribute("aria-label", `\u628A\u76EE\u6807\u6216\u9879\u76EE\u5F52\u5C5E\u5230${item?.title || "\u672A\u5F52\u5C5E\u533A"}`);
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("is-drag-over");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-drag-over"));
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-drag-over");
      const membershipId = event.dataTransfer?.getData("application/x-temporal-membership");
      if (membershipId) this.plugin.commitMembershipAssignment(framework.id, membershipId, item?.id || null, this.renderRevision).catch(() => {
      });
    });
    const grid = el("div", "tf-membership-grid");
    for (const membership of memberships) grid.append(this.renderMembershipCard(framework, projection, membership, timeFocus));
    if (!memberships.length) grid.append(el("div", "tf-framework-item-drop-hint", item ? "\u62D6\u5165\u76EE\u6807\u6216\u9879\u76EE\uFF0C\u6216\u4F7F\u7528\u4E3B\u952E\u4E0A\u7684\u201C\u8C03\u6574\u5F52\u5C5E\u201D" : "\u5C1A\u65E0\u672A\u5F52\u5C5E\u76EE\u6807\u6216\u9879\u76EE"));
    dropzone.append(grid);
    section.append(dropzone);
    return section;
  }
  disposeOutcomeToc() {
    const state = this.outcomeToc;
    if (state?.scrollHandler) this.contentEl.removeEventListener("scroll", state.scrollHandler);
    if (state?.resizeObserver) state.resizeObserver.disconnect();
    if (state?.rafId) cancelAnimationFrame(state.rafId);
    this.outcomeToc = null;
  }
  setupOutcomeToc() {
    const state = this.outcomeToc;
    if (!state?.toc?.isConnected) return;
    const sections = state.entries.map((entry) => entry.target);
    if (!sections.length) {
      state.toc.hidden = true;
      return;
    }
    const invalidate = () => {
      state.metrics = null;
      this.scheduleOutcomeTocUpdate();
    };
    state.scrollHandler = () => this.scheduleOutcomeTocUpdate();
    this.contentEl.addEventListener("scroll", state.scrollHandler, { passive: true });
    if (typeof ResizeObserver === "function") {
      state.resizeObserver = new ResizeObserver(invalidate);
      state.resizeObserver.observe(this.contentEl);
      state.resizeObserver.observe(state.content);
    }
    const occlusion = this.timeTocOcclusionHeight();
    state.toc.style.setProperty("--tf-outcome-toc-top", `${occlusion}px`);
    for (const itemSection of sections) itemSection.style.scrollMarginTop = `${occlusion + 12}px`;
    this.updateOutcomeToc(true);
  }
  scheduleOutcomeTocUpdate() {
    const state = this.outcomeToc;
    if (!state || state.rafId) return;
    state.rafId = requestAnimationFrame(() => {
      if (!this.outcomeToc || this.outcomeToc !== state) return;
      state.rafId = null;
      this.updateOutcomeToc();
    });
  }
  outcomeTocMetrics() {
    const state = this.outcomeToc;
    if (!state) return [];
    if (state.metrics) return state.metrics;
    const root = this.contentEl.getBoundingClientRect();
    state.metrics = state.entries.map((entry) => {
      const rect = entry.target.getBoundingClientRect();
      return { itemSection: entry.target, top: rect.top - root.top + this.contentEl.scrollTop, bottom: rect.bottom - root.top + this.contentEl.scrollTop };
    });
    state.metrics.forEach((metric, index) => {
      if (state.metrics[index + 1]) metric.bottom = Math.min(metric.bottom, state.metrics[index + 1].top);
    });
    return state.metrics;
  }
  updateOutcomeToc(force = false) {
    const state = this.outcomeToc;
    if (!state) return;
    const occlusion = this.timeTocOcclusionHeight();
    state.toc.style.setProperty("--tf-outcome-toc-top", `${occlusion}px`);
    state.toc.style.setProperty("--tf-outcome-toc-height", `${Math.max(120, this.contentEl.clientHeight - occlusion - 28)}px`);
    const metrics = this.outcomeTocMetrics();
    const currentIndex = timeTocCurrentIndex(metrics, this.contentEl.scrollTop + occlusion + 24);
    if (!force && currentIndex === state.currentIndex) return;
    state.currentIndex = currentIndex;
    const list = state.toc.querySelector(".tf-outcome-toc__items");
    if (force || !state.buttons) {
      list.empty();
      state.buttons = state.entries.map((entry) => {
        const child = entry.kind === "membership";
        const item = el("button", `tf-outcome-toc__item ${child ? "is-membership" : "is-framework"}`);
        item.type = "button";
        item.title = entry.label;
        item.setAttribute("aria-label", child ? `\u8F6C\u5230${entry.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"}\u4E3B\u952E\u201C${entry.label}\u201D` : `\u8F6C\u5230\u6846\u67B6\u6761\u76EE\u201C${entry.label}\u201D\uFF0C${entry.membershipCount} \u4E2A\u4E3B\u952E`);
        item.append(el("span", "tf-outcome-toc__marker", "\u25CB"), el("span", "tf-outcome-toc__label", entry.label));
        item.append(el("span", "tf-outcome-toc__count", child ? entry.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE" : String(entry.membershipCount)));
        item.addEventListener("click", () => {
          if (!entry.target.isConnected) return;
          const root = this.contentEl.getBoundingClientRect();
          const rect = entry.target.getBoundingClientRect();
          const top = rect.top - root.top + this.contentEl.scrollTop - this.timeTocOcclusionHeight() - 12;
          this.contentEl.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        });
        list.append(item);
        return item;
      });
    }
    state.buttons.forEach((item, index) => {
      const active = index === currentIndex;
      item.classList.toggle("is-current", active);
      if (active) item.setAttribute("aria-current", "location");
      else item.removeAttribute("aria-current");
      item.querySelector(".tf-outcome-toc__marker").textContent = active ? "\u25CF" : "\u25CB";
    });
  }
  renderMilestoneProgress(milestone) {
    const progress = milestoneProgress(milestone, { timezone: this.renderTimezone });
    const wrap = el("div", `tf-milestone-progress is-${progress.state}`);
    const meta = el("div", "tf-milestone-progress__meta");
    meta.append(el("span", "tf-milestone-progress__dates", progress.available ? `\u786E\u7ACB ${progress.startDate} \u2192 \u9884\u8BA1 ${progress.targetDate}` : "\u786E\u7ACB\u65E5\u671F\u6216\u65F6\u533A\u65E0\u6CD5\u89E3\u6790"));
    meta.append(el("strong", "tf-milestone-progress__state", progress.percent === null ? progress.label : `${progress.label} \xB7 ${progress.percent}%`));
    wrap.append(meta);
    const track = el("div", "tf-milestone-progress__track");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `\u6846\u67B6\u91CC\u7A0B\u7891\u65F6\u95F4\u8FDB\u5EA6\uFF1A${progress.label}`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    if (progress.percent !== null) track.setAttribute("aria-valuenow", String(progress.percent));
    const fill = el("span", "tf-milestone-progress__fill");
    fill.style.width = `${progress.percent ?? 0}%`;
    track.append(fill);
    wrap.append(track);
    return wrap;
  }
  renderFrameworkMilestoneLine(projection, milestone, options = {}) {
    const row = el("article", `tf-framework-milestone ${options.compact ? "is-compact" : ""}`.trim());
    row.dataset.milestoneId = milestone.id;
    row.append(el("div", "tf-framework-milestone__sentence", frameworkMilestoneSentence(milestone)));
    row.append(this.renderMilestoneProgress(milestone));
    const contextGroups = buildMilestoneBindingContextGroups(projection, milestone.id);
    if (contextGroups.length) {
      const linked = el("div", "tf-framework-milestone__bindings");
      for (const group of contextGroups) {
        const membership = group.membership;
        const membershipGroup = el("section", "tf-milestone-context-group");
        const membershipHeader = el("div", "tf-milestone-context-group__header");
        membershipHeader.append(el("span", `tf-source-badge is-${membership?.primaryRef?.domain || "unknown"}`, membership?.primaryRef?.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"));
        membershipHeader.append(el("strong", "", membership?.lastKnownLabel || "\u5931\u8054\u4E3B\u952E"));
        if (group.membershipBinding) membershipHeader.append(el("span", "tf-kind-badge", "\u4E3B\u952E\u76F4\u63A5\u5B9A\u4F4D"));
        if (!options.compact && group.membershipBinding) membershipHeader.append(iconButton("\u89E3\u9664\u4E3B\u952E\u91CC\u7A0B\u7891\u5173\u8054", "unlink", () => this.plugin.openUnbindMilestoneModal(group.membershipBinding)));
        membershipGroup.append(membershipHeader);
        const forest = el("div", "tf-milestone-context-forest");
        const renderContextNode = (outcomeId, depth = 0) => {
          const node = group.nodesById[outcomeId];
          if (!node) return null;
          const wrap = el("div", `tf-milestone-context-node ${node.directlyBound ? "is-bound" : "is-context"}`);
          wrap.style.setProperty("--tf-context-depth", String(Math.min(depth, 12)));
          const target = button(node.outcome.title, node.directlyBound ? "arrow-right" : "git-branch", () => this.openOutcome(node.outcome.id, projection), "tf-milestone-context-node__target");
          target.setAttribute("aria-label", `${node.directlyBound ? "\u76F4\u63A5\u5173\u8054\u6210\u679C" : "\u4E0A\u4E0B\u6587\u6210\u679C"}\uFF1A${node.outcome.title}\uFF1B\u70B9\u51FB\u5728\u6210\u679C\u6811\u4E2D\u6253\u5F00`);
          wrap.append(target);
          const externalParent = group.externalParentsByOutcomeId[outcomeId];
          if (externalParent) wrap.append(button("\u7236\u6210\u679C\u4F4D\u4E8E\u5176\u4ED6\u4E3B\u952E", "external-link", () => this.openOutcome(externalParent.id, projection), "is-link tf-milestone-external-parent"));
          if (node.directlyBound) {
            wrap.append(el("span", "tf-milestone-context-node__badge", "\u76F4\u63A5\u5173\u8054"));
            if (!options.compact && node.binding) wrap.append(iconButton(`\u89E3\u9664\u6210\u679C\u201C${node.outcome.title}\u201D\u7684\u91CC\u7A0B\u7891\u5173\u8054`, "unlink", () => this.plugin.openUnbindMilestoneModal(node.binding)));
          }
          const children = el("div", "tf-milestone-context-node__children");
          for (const childId of group.childrenByParentId[outcomeId] || []) {
            const child = renderContextNode(childId, depth + 1);
            if (child) children.append(child);
          }
          if (children.childElementCount) wrap.append(children);
          return wrap;
        };
        for (const rootId of group.childrenByParentId.__root__ || []) {
          const root = renderContextNode(rootId);
          if (root) forest.append(root);
        }
        if (forest.childElementCount) membershipGroup.append(forest);
        linked.append(membershipGroup);
      }
      row.append(linked);
    }
    if (!options.compact) {
      const actions = el("div", "tf-framework-milestone__actions");
      actions.append(iconButton("\u5173\u8054\u76EE\u6807\u3001\u9879\u76EE\u6216\u6210\u679C", "link-2", () => this.plugin.openMilestoneBindingModal(milestone.frameworkId, null, null, milestone.id)));
      actions.append(iconButton("\u7F16\u8F91\u6846\u67B6\u91CC\u7A0B\u7891", "pencil", () => this.plugin.openFrameworkMilestoneModal(milestone.frameworkItemId, milestone)));
      actions.append(iconButton("\u505C\u7528\u6846\u67B6\u91CC\u7A0B\u7891", "archive", () => this.plugin.openArchiveFrameworkMilestoneModal(milestone)));
      row.append(actions);
    }
    return row;
  }
  renderFrameworkMeaning(projection, targetType, targetId, options = {}) {
    const location = targetType === "outcome" ? effectiveOutcomeFrameworkLocation(projection, targetId) : effectiveMembershipFrameworkLocation(projection, targetId);
    if (!location?.frameworkItemId) return null;
    const item = projection.frameworkItemsById[location.frameworkItemId];
    if (!item) return null;
    const isDirectOutcomeMilestone = targetType === "outcome" && location.source === "outcome-milestone";
    const wrap = el("div", `tf-framework-meaning ${options.compact ? "is-compact" : ""} ${isDirectOutcomeMilestone ? "is-direct-milestone" : ""}`.trim());
    if (!options.compact) wrap.append(el("h3", "tf-section-title", "\u5728\u6574\u4F53\u6846\u67B6\u4E2D\u7684\u610F\u4E49"));
    const milestone = location.milestoneId ? projection.frameworkMilestonesById[location.milestoneId] : null;
    if (isDirectOutcomeMilestone && milestone) {
      const line = el("div", "tf-framework-meaning__line is-direct-milestone");
      line.append(el("span", "tf-framework-meaning__badge", "\u91CC\u7A0B\u7891"));
      line.append(el("span", "tf-framework-meaning__item", item.title));
      line.append(el("strong", "tf-framework-meaning__milestone", frameworkMilestoneSentence(milestone)));
      wrap.setAttribute("aria-label", `\u6210\u679C\u76F4\u63A5\u5173\u8054\u91CC\u7A0B\u7891\uFF1A${item.title}\uFF1B${frameworkMilestoneSentence(milestone)}`);
      wrap.append(line);
      return wrap;
    }
    const sourceLabel = location.source === "outcome-milestone" ? "\u6210\u679C\u76F4\u63A5\u5B9A\u4F4D" : location.source === "membership-milestone" ? "\u4E3B\u952E\u76F4\u63A5\u5B9A\u4F4D" : "\u6846\u67B6\u6761\u76EE\u5F52\u5C5E";
    wrap.append(el("div", "tf-framework-meaning__line", milestone ? `${sourceLabel} \xB7 ${item.title} \u2192 ${frameworkMilestoneSentence(milestone)}` : `${sourceLabel} \xB7 ${item.title}`));
    return wrap;
  }
  cancelRailInteraction() {
    const current = this.activeRailInteraction;
    this.activeRailInteraction = null;
    current?.cancel?.();
  }
  railTicks(placement) {
    const totalDays = Math.max(1, daysBetween(placement.startDate, placement.endDateExclusive));
    const count = Math.min(7, Math.max(2, Math.ceil(totalDays / 14) + 1));
    return [...new Set(Array.from({ length: count }, (_, index) => {
      const offset = Math.round((totalDays - 1) * index / Math.max(1, count - 1));
      return addDays(placement.startDate, offset);
    }))];
  }
  renderChildRail(framework, projection, parent, parentPlacement, children) {
    const rail = el("div", "tf-placement-rail");
    const header = el("div", "tf-placement-rail__header");
    header.append(el("strong", "", "\u7236\u6210\u679C\u65F6\u95F4\u8F68\u9053"), el("span", "", dateRange(parentPlacement.startDate, parentPlacement.endDateExclusive)));
    rail.append(header);
    const axis = el("div", "tf-rail-axis");
    for (const tickDate of this.railTicks(parentPlacement)) {
      const ratio = daysBetween(parentPlacement.startDate, tickDate) / Math.max(1, daysBetween(parentPlacement.startDate, parentPlacement.endDateExclusive));
      const tick = el("span", "tf-rail-tick");
      tick.style.left = `${ratio * 100}%`;
      tick.append(el("span", "tf-rail-tick__line"), el("span", "tf-rail-tick__label", tickDate.slice(5)));
      axis.append(tick);
    }
    rail.append(axis);
    if (!children.length) rail.append(el("div", "tf-inline-empty", "\u8FD8\u6CA1\u6709\u66F4\u7EC6\u4E00\u5C42\u7684\u9636\u6BB5\u6210\u679C"));
    for (const child of children) rail.append(this.renderChildRailRow(framework, projection, parentPlacement, child));
    return rail;
  }
  renderChildRailRow(framework, projection, parentPlacement, child) {
    const row = el("div", "tf-child-rail-row");
    row.dataset.anchorKey = child.id;
    const heading = el("div", "tf-child-rail-row__heading");
    heading.append(button(child.title, "", () => this.openOutcome(child.id, projection), "is-link"));
    const placement = outcomePlacement(projection, child.id);
    if (!placement) {
      heading.append(button("\u5B89\u6392", "calendar-plus", () => this.plugin.openPlacementModal(framework.id, { outcomeId: child.id }), "is-quiet"));
      row.append(heading, el("div", "tf-child-rail-row__empty", "\u5C1A\u672A\u5B89\u6392\u65F6\u95F4"));
      return row;
    }
    const dates = el("span", "tf-child-rail-row__dates");
    heading.append(dates, iconButton("\u7CBE\u786E\u8BBE\u7F6E\u65E5\u671F", "calendar-clock", () => this.plugin.openPlacementModal(framework.id, { outcomeId: child.id })));
    row.append(heading);
    const track = el("div", "tf-child-rail-track");
    const segment = el("div", "tf-child-rail-segment");
    const leftHandle = el("button", "tf-child-rail-handle is-left");
    const rightHandle = el("button", "tf-child-rail-handle is-right");
    const due = el("button", "tf-child-rail-due");
    for (const [control, label] of [[segment, "\u79FB\u52A8\u6574\u4E2A\u533A\u95F4"], [leftHandle, "\u8C03\u6574\u5F00\u59CB\u65E5\u671F"], [rightHandle, "\u8C03\u6574\u7ED3\u675F\u8FB9\u754C"], [due, "\u8C03\u6574\u76EE\u6807\u5B8C\u6210\u65E5"]]) {
      control.type = "button";
      control.title = label;
      control.setAttribute("role", "slider");
      control.tabIndex = 0;
    }
    track.append(segment, leftHandle, rightHandle, due);
    row.append(track);
    const meta = el("div", "tf-child-rail-row__meta");
    const constraints = placementConstraintSummary(projection, child.id);
    if (constraints.length) meta.append(el("span", "tf-rail-constraints", constraints.join(" \xB7 ")));
    row.append(meta);
    const applyLayout = (candidate) => {
      const projected = projectPlacementOnRail(parentPlacement, candidate);
      segment.style.left = `${projected.startRatio * 100}%`;
      segment.style.width = `${Math.min(100 - projected.startRatio * 100, Math.max(1, (projected.endRatio - projected.startRatio) * 100))}%`;
      leftHandle.style.left = `${projected.startRatio * 100}%`;
      rightHandle.style.left = `${projected.endRatio * 100}%`;
      due.style.left = `${projected.dueRatio * 100}%`;
      row.classList.toggle("has-overflow-left", projected.overflowLeft);
      row.classList.toggle("has-overflow-right", projected.overflowRight);
      row.classList.toggle("is-contained", projected.contained);
      dates.textContent = `${dateRange(candidate.startDate, candidate.endDateExclusive)} \xB7 \u76EE\u6807 ${effectiveDueOn(candidate)}`;
      const startOffset = daysBetween(parentPlacement.startDate, candidate.startDate);
      const endOffset = daysBetween(parentPlacement.startDate, candidate.endDateExclusive);
      const dueOffset = daysBetween(parentPlacement.startDate, effectiveDueOn(candidate));
      const aria = [
        [segment, startOffset, projected.totalDays, `${dateRange(candidate.startDate, candidate.endDateExclusive)}\uFF0C\u79FB\u52A8\u6574\u4E2A\u533A\u95F4`],
        [leftHandle, startOffset, projected.totalDays - 1, `\u5F00\u59CB\u65E5\u671F ${candidate.startDate}`],
        [rightHandle, endOffset, projected.totalDays, `\u7ED3\u675F\u8FB9\u754C ${candidate.endDateExclusive}`],
        [due, dueOffset, projected.totalDays - 1, `\u76EE\u6807\u5B8C\u6210\u65E5 ${effectiveDueOn(candidate)}`]
      ];
      for (const [control, value, maximum, textValue] of aria) {
        const boundedMaximum = Math.max(0, maximum);
        control.setAttribute("aria-valuemin", "0");
        control.setAttribute("aria-valuemax", String(boundedMaximum));
        control.setAttribute("aria-valuenow", String(Math.max(0, Math.min(boundedMaximum, value))));
        control.setAttribute("aria-valuetext", textValue);
      }
      const existingFit = meta.querySelector(".tf-rail-fit");
      if (existingFit) existingFit.remove();
      if (!projected.contained) {
        const fit = button("\u6536\u7EB3\u5230\u7236\u533A\u95F4", "shrink", () => {
          const candidate2 = fitPlacementWithinParent(parentPlacement, placement);
          this.plugin.commitRailPlacement(framework, child.id, candidate2, this.renderRevision);
        }, "tf-rail-fit is-quiet");
        meta.prepend(fit);
      }
    };
    applyLayout(placement);
    const deriveCandidate = (mode, dayOffset, origin, pointerStartDay = null) => {
      const totalDays = daysBetween(parentPlacement.startDate, parentPlacement.endDateExclusive);
      const next = { ...origin };
      if (mode === "move") {
        const duration = daysBetween(origin.startDate, origin.endDateExclusive);
        const originStart = daysBetween(parentPlacement.startDate, origin.startDate);
        const delta = dayOffset - pointerStartDay;
        const nextStart = Math.max(0, Math.min(totalDays - duration, originStart + delta));
        next.startDate = addDays(parentPlacement.startDate, nextStart);
        next.endDateExclusive = addDays(next.startDate, duration);
        next.dueOn = addDays(effectiveDueOn(origin), nextStart - originStart);
      } else if (mode === "start") {
        next.startDate = addDays(parentPlacement.startDate, Math.min(dayOffset, daysBetween(parentPlacement.startDate, origin.endDateExclusive) - 1));
        if (compareDate(effectiveDueOn(next), next.startDate) < 0) next.dueOn = next.startDate;
      } else if (mode === "end") {
        const minimumEnd = daysBetween(parentPlacement.startDate, origin.startDate) + 1;
        next.endDateExclusive = addDays(parentPlacement.startDate, Math.max(minimumEnd, Math.min(totalDays, dayOffset + 1)));
        if (compareDate(effectiveDueOn(next), next.endDateExclusive) >= 0) next.dueOn = addDays(next.endDateExclusive, -1);
      } else {
        const minimum = daysBetween(parentPlacement.startDate, origin.startDate);
        const maximum = daysBetween(parentPlacement.startDate, origin.endDateExclusive) - 1;
        next.dueOn = addDays(parentPlacement.startDate, Math.max(minimum, Math.min(maximum, dayOffset)));
      }
      return next;
    };
    const bindControl = (control, mode) => {
      control.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        this.cancelRailInteraction();
        const rect = track.getBoundingClientRect();
        const totalDays = daysBetween(parentPlacement.startDate, parentPlacement.endDateExclusive);
        const dayAt = (clientX) => Math.max(0, Math.min(totalDays - 1, Math.floor((clientX - rect.left) / Math.max(1, rect.width) * totalDays)));
        const origin = structuredClone(placement);
        const pointerStartDay = dayAt(event.clientX);
        const baseRevision = this.renderRevision;
        let candidate = origin;
        let settled = false;
        const cleanup = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("keydown", keydown);
        };
        const finish = (commit) => {
          if (settled) return;
          settled = true;
          cleanup();
          this.activeRailInteraction = null;
          if (commit && !placementDatesEqual(candidate, origin)) this.plugin.commitRailPlacement(framework, child.id, candidate, baseRevision);
          else applyLayout(origin);
        };
        const move = (moveEvent) => {
          candidate = deriveCandidate(mode, dayAt(moveEvent.clientX), origin, pointerStartDay);
          applyLayout(candidate);
        };
        const up = () => finish(true);
        const keydown = (keyEvent) => {
          if (keyEvent.key === "Escape") finish(false);
        };
        this.activeRailInteraction = { cancel: () => finish(false) };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up, { once: true });
        window.addEventListener("keydown", keydown);
        control.addEventListener("pointercancel", () => finish(false), { once: true });
        control.addEventListener("lostpointercapture", () => finish(false), { once: true });
        try {
          control.setPointerCapture(event.pointerId);
        } catch {
        }
      });
      control.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        const originOffset = mode === "end" ? daysBetween(parentPlacement.startDate, placement.endDateExclusive) - 1 : mode === "due" ? daysBetween(parentPlacement.startDate, effectiveDueOn(placement)) : daysBetween(parentPlacement.startDate, placement.startDate);
        const candidate = mode === "move" ? fitPlacementWithinParent(parentPlacement, { ...placement, startDate: addDays(placement.startDate, delta), endDateExclusive: addDays(placement.endDateExclusive, delta), dueOn: addDays(effectiveDueOn(placement), delta) }) : deriveCandidate(mode, originOffset + delta, placement, originOffset);
        if (!placementDatesEqual(candidate, placement)) this.plugin.commitRailPlacement(framework, child.id, candidate, this.renderRevision);
      });
    };
    bindControl(segment, "move");
    bindControl(leftHandle, "start");
    bindControl(rightHandle, "end");
    bindControl(due, "due");
    return row;
  }
  renderOutcomeDetail(framework, projection, outcome) {
    const wrap = el("div", "tf-outcome-detail");
    const placement = outcomePlacement(projection, outcome.id);
    const completion = projection.completionByOutcomeId[outcome.id];
    const effective = projection.outcomeEffectivenessByOutcomeId?.[outcome.id]?.effective === true;
    const membership = projection.membershipsById[outcome.membershipId];
    const heading = el("header", "tf-outcome-detail__header");
    const title = el("div", "tf-outcome-detail__identity");
    title.append(el("span", "tf-eyebrow", outcome.outcomeKind === "stage_gate" ? "\u9636\u6BB5\u5173\u53E3" : "\u9636\u6BB5\u6210\u679C"));
    title.append(el("h2", "", outcome.title));
    if (outcome.acceptance) title.append(el("p", "", outcome.acceptance));
    heading.append(title);
    const actions = el("div", "tf-outcome-detail__actions");
    actions.append(button("\u6240\u5C5E\u4E3B\u952E Ontology", "table-properties", () => this.plugin.openMembershipOntology(membership)));
    actions.append(button("\u5B50\u6210\u679C", "git-branch-plus", () => this.plugin.openOutcomeModal(framework.id, { membershipId: outcome.membershipId, parentId: outcome.id }), "is-primary"));
    actions.append(button("\u5173\u7CFB", "waypoints", () => this.plugin.openRelationModal(outcome, projection)));
    if (outcome.outcomeKind === "stage_gate") actions.append(button("\u5173\u53E3\u7B56\u7565", "list-checks", () => this.plugin.openGatePolicyModal(outcome, projection)));
    actions.append(button(placement ? "\u8C03\u6574\u5B89\u6392" : "\u5B89\u6392\u65F6\u95F4", "calendar-clock", () => this.plugin.openPlacementModal(framework.id, { outcomeId: outcome.id })));
    actions.append(button(effective ? "\u9000\u51FA\u6B63\u5728\u751F\u6548" : "\u8FDB\u5165\u6B63\u5728\u751F\u6548", effective ? "circle-check-big" : "activity", () => this.plugin.toggleOutcomeEffectiveness(outcome, !effective, this.renderRevision), effective ? "is-effective" : ""));
    actions.append(button(completion?.painted ? "\u53D6\u6D88\u6D82\u8272" : "\u5B8C\u6210\u6D82\u8272", completion?.painted ? "eraser" : "paintbrush", () => completion?.painted ? this.plugin.openUnpaintModal(outcome) : this.plugin.openPaintModal(outcome)));
    actions.append(iconButton("\u7F16\u8F91\u6210\u679C", "pencil", () => this.plugin.openReviseOutcomeModal(outcome)));
    heading.append(actions);
    wrap.append(heading);
    const facts = el("div", "tf-fact-strip");
    facts.append(el("span", "tf-fact", placement ? dateRange(placement.startDate, placement.endDateExclusive) : "\u5C1A\u672A\u5B89\u6392\u65F6\u95F4"));
    facts.append(el("span", `tf-fact ${completion?.painted ? "is-complete" : ""}`, completion?.painted ? `\u5DF2\u4E8E ${completion.completedOn} \u5B8C\u6210` : "\u5C1A\u672A\u624B\u5DE5\u786E\u8BA4\u5B8C\u6210"));
    facts.append(el("span", `tf-fact ${effective ? "is-effective" : ""}`, effective ? "\u4EBA\u5DE5\u786E\u8BA4\uFF1A\u6B63\u5728\u751F\u6548" : "\u672A\u8FDB\u5165\u6B63\u5728\u751F\u6548"));
    if (outcome.outcomeKind === "stage_gate") {
      const readiness = outcomeReadiness(projection, outcome.id);
      facts.append(el("span", `tf-fact ${readiness.ready ? "is-ready" : ""}`, readiness.ready ? "\u5173\u53E3\u6761\u4EF6\u5DF2\u5C31\u7EEA" : `\u5173\u53E3\u6761\u4EF6 ${readiness.completed}/${readiness.total}`));
    }
    const timeFocus = this.environment.timePath.at(-1);
    if (timeFocus) {
      const inScope = placement ? placementOverlapsBox(placement, timeFocus) : false;
      facts.append(el("span", `tf-fact ${inScope ? "is-in-scope" : "is-out-of-scope"}`, inScope ? `\u4F4D\u4E8E ${timeFocus.label}` : `\u4E0D\u5728 ${timeFocus.label} \u5185`));
    }
    wrap.append(facts);
    const frameworkMeaning = this.renderFrameworkMeaning(projection, "outcome", outcome.id, { includeMembership: true });
    if (frameworkMeaning) wrap.append(frameworkMeaning);
    if (membership?.frameworkItemId) wrap.append(button("\u5173\u8054\u6846\u67B6\u91CC\u7A0B\u7891", "flag", () => this.plugin.openMilestoneBindingModal(framework.id, "outcome", outcome.id)));
    const lens = el("div", "tf-relation-lens");
    lens.append(el("span", "tf-relation-lens__label", "\u5173\u7CFB\u900F\u955C"));
    for (const [key, label] of [["none", "\u5173\u95ED"], ["precedes", "\u5148\u540E"], ["requires", "\u524D\u7F6E"], ["contributes_to", "\u6C47\u805A"]]) {
      lens.append(button(label, "", () => {
        this.environment.relationLens = key;
        this.render();
      }, this.environment.relationLens === key ? "is-active" : ""));
    }
    wrap.append(lens);
    if (this.environment.relationLens !== "none") wrap.append(this.renderRelationPanel(projection, outcome));
    const allChildren = outcomeRelationSummary(projection, outcome.id).children;
    const children = timeFocus ? allChildren.filter((child) => this.outcomeIntersectsTimeBox(projection, child.id, timeFocus)) : allChildren;
    const childSection = el("section", "tf-child-section");
    childSection.append(el("h3", "tf-section-title", "\u5411\u4E0B\u5206\u89E3"));
    if (placement) childSection.append(this.renderChildRail(framework, projection, outcome, placement, allChildren));
    else {
      if (!children.length) childSection.append(el("div", "tf-inline-empty", timeFocus ? "\u5F53\u524D\u65F6\u95F4\u7126\u70B9\u4E0B\u6CA1\u6709\u66F4\u7EC6\u4E00\u5C42\u6210\u679C" : "\u8FD8\u6CA1\u6709\u66F4\u7EC6\u4E00\u5C42\u7684\u9636\u6BB5\u6210\u679C"));
      const childGrid = el("div", "tf-child-grid");
      for (const child of children) childGrid.append(this.renderOutcomeCard(projection, child, outcomePlacement(projection, child.id)));
      childSection.append(childGrid);
    }
    wrap.append(childSection);
    return wrap;
  }
  renderRelationPanel(projection, outcome) {
    const panel = el("section", "tf-relation-panel");
    const relations = activeValues2(projection.relationsById).filter((relation) => relation.relationType === this.environment.relationLens && (relation.sourceOutcomeId === outcome.id || relation.targetOutcomeId === outcome.id));
    if (!relations.length) return el("div", "tf-inline-empty", "\u5F53\u524D\u900F\u955C\u4E0B\u6CA1\u6709\u5173\u7CFB");
    for (const relation of relations) {
      const outgoing = relation.sourceOutcomeId === outcome.id;
      const peer = projection.outcomesById[outgoing ? relation.targetOutcomeId : relation.sourceOutcomeId];
      const row = el("div", "tf-relation-row");
      row.append(el("span", "tf-relation-row__direction", outgoing ? "\u2192" : "\u2190"));
      row.append(button(peer?.title || "\u5931\u8054\u6210\u679C", "", () => peer && this.openOutcome(peer.id, projection), "is-link"));
      row.append(el("span", "tf-relation-row__type", RELATION_LABELS[relation.relationType]));
      row.append(iconButton("\u64A4\u9500\u5173\u7CFB", "unlink", () => this.plugin.openRevokeRelationModal(relation)));
      panel.append(row);
    }
    return panel;
  }
};
var TemporalFrameworkPlugin = class extends import_obsidian.Plugin {
  async onload() {
    const adapter = this.app.vault.adapter;
    if (typeof adapter.getBasePath !== "function") throw new Error("\u65F6\u95F4\u6846\u67B6\u9700\u8981\u684C\u9762\u6587\u4EF6\u7CFB\u7EDF\u9002\u914D\u5668");
    this.directory = import_node_path3.default.join(adapter.getBasePath(), this.app.vault.configDir, "plugins", this.manifest.id);
    this.store = new TemporalStore(this.directory, { hook: (name, payload) => console.debug(`[TemporalFramework][store.${name}]`, payload) });
    const status = await this.store.init();
    await this.loadUiState();
    this.drafts = new DraftStore(this.directory);
    this.registerView(VIEW_TYPE, (leaf) => new TemporalFrameworkView(leaf, this));
    this.addRibbonIcon("calendar-range", "\u6253\u5F00\u65F6\u95F4\u6846\u67B6", () => this.activateView());
    this.addCommand({ id: "open-temporal-framework", name: "\u6253\u5F00\u65F6\u95F4\u6846\u67B6", callback: () => this.activateView() });
    this.installPublicApi();
    if (status.profile === "read-only") new import_obsidian.Notice(`\u65F6\u95F4\u6846\u67B6\u4EE5\u53EA\u8BFB\u6062\u590D\u6A21\u5F0F\u542F\u52A8\uFF1A${status.reason}`, 1e4);
  }
  async onunload() {
    try {
      this.drafts?.unloadSync();
    } catch (error) {
      console.error("[TemporalFramework][draft.unload-failed]", error);
    }
    if (typeof window !== "undefined" && window[API_KEY]?.generation === this.apiGeneration) delete window[API_KEY];
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
  outcomeExpansionKey(frameworkId, outcomeId) {
    return `${frameworkId}::${outcomeId}`;
  }
  async loadUiState() {
    const data = await this.loadData() || {};
    const projection = reduceTemporalStore(await this.store.read());
    const valid = {};
    for (const [key, value] of Object.entries(data.uiState?.outcomeExpansionDepthById || {})) {
      if (!Number.isInteger(value) || value < 0 || value > MAX_OUTCOME_EXPANSION_DEPTH) continue;
      const separator = key.indexOf("::");
      if (separator < 1) continue;
      const frameworkId = key.slice(0, separator);
      const outcomeId = key.slice(separator + 2);
      if (projection.outcomesById[outcomeId]?.frameworkId !== frameworkId) continue;
      valid[key] = value;
    }
    this.uiState = { outcomeExpansionDepthById: valid };
    this.uiStateSaveQueue = Promise.resolve();
  }
  outcomeExpansionDepth(frameworkId, outcomeId) {
    const value = this.uiState?.outcomeExpansionDepthById?.[this.outcomeExpansionKey(frameworkId, outcomeId)];
    return Number.isInteger(value) ? value : null;
  }
  setOutcomeExpansionDepth(frameworkId, outcomeId, depth) {
    const nextDepth = Math.max(0, Math.min(MAX_OUTCOME_EXPANSION_DEPTH, Number(depth)));
    if (!Number.isInteger(nextDepth)) return Promise.reject(new Error("\u5C55\u5F00\u5C42\u6570\u65E0\u6548"));
    this.uiState.outcomeExpansionDepthById[this.outcomeExpansionKey(frameworkId, outcomeId)] = nextDepth;
    const persist = async () => {
      const current = await this.loadData() || {};
      await this.saveData({
        ...current,
        uiState: {
          ...current.uiState || {},
          outcomeExpansionDepthById: { ...this.uiState.outcomeExpansionDepthById }
        }
      });
    };
    const pending = this.uiStateSaveQueue.then(persist, persist);
    this.uiStateSaveQueue = pending.catch((error) => console.error("[TemporalFramework][ui-state.save-failed]", error));
    return pending;
  }
  installPublicApi() {
    this.apiGeneration = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const api = {
      apiVersion: 2,
      pluginId: this.manifest.id,
      generation: this.apiGeneration,
      open: async (options = {}) => {
        const view = await this.activateView();
        if (options.environmentState) await view.applyEnvironmentState(options.environmentState);
        return { ok: true };
      },
      captureEnvironmentState: () => this.getActiveView()?.getEnvironmentState() || null,
      restoreEnvironmentState: async (state) => {
        const view = await this.activateView();
        await view.applyEnvironmentState(state || {});
        return { ok: true, contentWrite: false };
      },
      getFrameworkSnapshot: async (options = {}) => {
        const store = await this.store.read();
        const projection = reduceTemporalStore(store);
        const frameworkId = options.frameworkId || Object.keys(projection.frameworksById)[0] || null;
        return { ok: true, schemaVersion: 2, revision: store.revision, frameworkId, projection: structuredClone(projection) };
      }
    };
    if (typeof window !== "undefined") window[API_KEY] = api;
    this.api = api;
  }
  getActiveView() {
    return this.app.workspace.getLeavesOfType(VIEW_TYPE).map((leaf) => leaf.view).find((view) => view instanceof TemporalFrameworkView) || null;
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    return leaf.view;
  }
  mandalaApi() {
    return typeof window !== "undefined" ? window.__mandalaTimeBlocksPluginApi : null;
  }
  primaryRefFromTarget(target) {
    return {
      providerId: target.sourcePlugin || "mandala-time-blocks",
      domain: target.domain || target.sourceType,
      sourceScope: target.sourceScope || target.sourceNotePath,
      sourceKey: target.sourceKey || target.sourceId || target.nodeId,
      identityVersion: Number(target.identityVersion || 1)
    };
  }
  async openMembershipOntology(membership) {
    if (!membership?.primaryRef) return new import_obsidian.Notice("\u627E\u4E0D\u5230\u9636\u6BB5\u6210\u679C\u6240\u5C5E\u7684\u76EE\u6807\u6216\u9879\u76EE\u4E3B\u952E", 9e3);
    try {
      await openPlanningTargetOntology(this.mandalaApi(), membership.primaryRef);
    } catch (error) {
      console.warn("[TemporalFramework][membership.ontology-open-failed]", {
        membershipId: membership.id,
        primaryRef: membership.primaryRef,
        message: error.message
      });
      new import_obsidian.Notice(error.message, 9e3);
    }
  }
  async toggleOutcomeEffectiveness(outcome, effective, expectedRevision) {
    const verb = effective ? "\u8FDB\u5165" : "\u9000\u51FA";
    if (!window.confirm(`\u786E\u8BA4\u8BA9\u201C${outcome.title}\u201D${verb}\u6B63\u5728\u751F\u6548\uFF1F

\u8FD9\u662F\u4E00\u4E2A\u4EBA\u5DE5\u72B6\u6001\u5224\u5B9A\uFF0C\u4E0D\u4F1A\u4FEE\u6539\u6210\u679C\u65E5\u671F\u3001\u91CC\u7A0B\u7891\u6216\u5C42\u7EA7\u5173\u7CFB\u3002`)) return;
    try {
      await this.mutate("outcome-effect-set", (draft) => setOutcomeEffective(draft, {
        outcomeId: outcome.id,
        effective
      }), { expectedRevision });
    } catch (error) {
      new import_obsidian.Notice(error.message, 9e3);
    }
  }
  async mutate(reason, mutator, options = {}) {
    try {
      return await this.store.save(mutator, reason, options);
    } catch (error) {
      console.error("[TemporalFramework][mutation.rejected]", { reason, message: error.message, stack: error.stack });
      throw error;
    }
  }
  async commitRailPlacement(framework, outcomeId, candidate, expectedRevision) {
    try {
      await this.mutate("placement-rail-adjust", (draft) => moveOutcomePlacement(draft, {
        frameworkId: framework.id,
        outcomeId,
        mode: "interval",
        startDate: candidate.startDate,
        endDateExclusive: candidate.endDateExclusive,
        dueOn: effectiveDueOn(candidate),
        declaredScale: candidate.declaredScale,
        homeTimeBoxRef: canonicalTimeBox(candidate.declaredScale, candidate.startDate, framework)
      }), { expectedRevision });
    } catch (error) {
      new import_obsidian.Notice(error.message === "\u6570\u636E\u5DF2\u53D8\u5316" ? "\u6570\u636E\u5DF2\u53D8\u5316\uFF0C\u5DF2\u53D6\u6D88\u672C\u6B21\u62D6\u52A8" : error.message, 9e3);
      await this.getActiveView()?.renderPreservingView();
    }
  }
  openRelationConflictList(framework, projection, diagnostics) {
    if (!diagnostics.length) return new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u5173\u7CFB\u65F6\u95F4\u51B2\u7A81");
    new RelationConflictModal(this, framework, projection, diagnostics).open();
  }
  async openJointRelationAdjustment(frameworkId, relationId) {
    const { store, projection, framework } = await this.projectionFor(frameworkId);
    const relation = projection.relationsById[relationId];
    if (!framework || framework.status !== "active") return new import_obsidian.Notice("\u65F6\u95F4\u6846\u67B6\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728");
    if (!relation || relation.status !== "active") return new import_obsidian.Notice("\u6210\u679C\u5173\u7CFB\u5DF2\u7ECF\u64A4\u9500\u6216\u4E0D\u5B58\u5728");
    if (!outcomePlacement(projection, relation.sourceOutcomeId) || !outcomePlacement(projection, relation.targetOutcomeId)) {
      return new import_obsidian.Notice("\u5173\u7CFB\u4E24\u7AEF\u90FD\u5FC5\u987B\u5148\u6709\u6709\u6548\u65F6\u95F4\u5B89\u6392");
    }
    new JointRelationAdjustmentModal(this, framework, projection, relation, store, store.revision).open();
  }
  openNewRelationJointAdjustment(store, relation, onCommitted) {
    const projection = reduceTemporalStore(store);
    const framework = projection.frameworksById[relation.frameworkId];
    if (!framework || framework.status !== "active") throw new Error("\u65F6\u95F4\u6846\u67B6\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728");
    const source = projection.outcomesById[relation.sourceOutcomeId];
    const target = projection.outcomesById[relation.targetOutcomeId];
    const missing = [];
    if (!outcomePlacement(projection, relation.sourceOutcomeId)) missing.push(`\u8D77\u70B9\u6210\u679C\u201C${source?.title || relation.sourceOutcomeId}\u201D`);
    if (!outcomePlacement(projection, relation.targetOutcomeId)) missing.push(`\u6307\u5411\u6210\u679C\u201C${target?.title || relation.targetOutcomeId}\u201D`);
    if (missing.length) throw new Error(`${missing.join("\u3001")}\u5C1A\u672A\u5B89\u6392\u65F6\u95F4\uFF0C\u4E0D\u80FD\u8FDB\u5165\u8054\u5408\u8C03\u6574\u65F6\u95F4\u8F68`);
    new JointRelationAdjustmentModal(this, framework, projection, relation, store, store.revision, {
      mode: "create",
      onCommitted
    }).open();
  }
  async commitJointRelationAdjustment(framework, relation, placementInputs, expectedRevision) {
    const inputFor = (placement) => ({
      frameworkId: framework.id,
      outcomeId: placement.outcomeId,
      mode: "interval",
      startDate: placement.startDate,
      endDateExclusive: placement.endDateExclusive,
      dueOn: effectiveDueOn(placement),
      declaredScale: placement.declaredScale,
      homeTimeBoxRef: canonicalTimeBox(placement.declaredScale, placement.startDate, framework),
      reason: "\u5173\u7CFB\u65F6\u95F4\u51B2\u7A81\u8054\u5408\u8C03\u6574"
    });
    await this.mutate("relation-joint-placement-adjust", (draft) => {
      moveRelatedOutcomePlacementSet(draft, relation.id, placementInputs.map(inputFor));
    }, { expectedRevision });
  }
  async commitNewRelationJointAdjustment(framework, relation, placementInputs, expectedRevision) {
    const inputFor = (placement) => ({
      frameworkId: framework.id,
      outcomeId: placement.outcomeId,
      mode: "interval",
      startDate: placement.startDate,
      endDateExclusive: placement.endDateExclusive,
      dueOn: effectiveDueOn(placement),
      declaredScale: placement.declaredScale,
      homeTimeBoxRef: canonicalTimeBox(placement.declaredScale, placement.startDate, framework),
      reason: "\u5EFA\u7ACB\u5173\u7CFB\u5E76\u8054\u5408\u8C03\u6574\u65F6\u95F4"
    });
    await this.mutate("relation-create-joint-placement-adjust", (draft) => {
      addOutcomeRelationWithJointPlacementSet(draft, {
        frameworkId: relation.frameworkId,
        sourceOutcomeId: relation.sourceOutcomeId,
        targetOutcomeId: relation.targetOutcomeId,
        relationType: relation.relationType,
        supersedesRelationId: relation.supersedesRelationId || null
      }, placementInputs.map(inputFor), { relationId: relation.id });
    }, { expectedRevision });
  }
  async openFrameworkModal() {
    const dates = defaultFrameworkDates();
    const current = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u5EFA\u7ACB\u672A\u6765\u65F6\u95F4\u6846\u67B6",
      recordType: "framework-create",
      baseRevision: current.revision,
      initial: { title: `${dates.startDate.slice(0, 4)}-${Number(dates.endDateExclusive.slice(0, 4)) - 1} \u6574\u4F53\u65F6\u95F4\u6846\u67B6`, ...dates },
      fields: [
        { key: "title", label: "\u6846\u67B6\u540D\u79F0", wide: true },
        { key: "startDate", label: "\u5F00\u59CB\u65E5\u671F", type: "date" },
        { key: "endDateExclusive", label: "\u7ED3\u675F\u8FB9\u754C\uFF08\u4E0D\u542B\u5F53\u5929\uFF09", type: "date" }
      ],
      onSubmit: async (value, session) => {
        let frameworkId;
        await this.mutate("framework-create", (draft) => {
          frameworkId = createFramework(draft, value);
        }, { expectedRevision: session.identity.baseRevision });
        const view = await this.activateView();
        view.environment.frameworkId = frameworkId;
        await view.render();
      }
    }).open();
  }
  boundaryValidation(projection, framework, value) {
    if (!value.reason?.trim()) return { valid: false, message: "\u8BF7\u586B\u5199\u8C03\u6574\u539F\u56E0\u3002", conflicts: [] };
    if (framework.startDate === value.startDate && framework.endDateExclusive === value.endDateExclusive) {
      return { valid: false, message: "\u5F00\u59CB\u548C\u7ED3\u675F\u8FB9\u754C\u5747\u672A\u53D8\u5316\u3002", conflicts: [] };
    }
    try {
      const conflicts = frameworkBoundaryConflicts(projection, framework.id, value);
      if (!conflicts.length) return { valid: true, message: "\u672A\u53D1\u73B0\u4E0E\u5DF2\u6709\u65F6\u95F4\u5185\u5BB9\u7684\u51B2\u7A81\u3002", conflicts: [] };
      return { valid: false, message: `${conflicts.length} \u9879\u5DF2\u6709\u65F6\u95F4\u5185\u5BB9\u8D85\u51FA\u5019\u9009\u8FB9\u754C\u3002`, conflicts };
    } catch (error) {
      return { valid: false, message: error.message, conflicts: [] };
    }
  }
  renderBoundaryValidation(container, result) {
    container.append(el("strong", "tf-form-validation__summary", result.message));
    const groups = [
      ["milestone_outside", "\u6846\u67B6\u91CC\u7A0B\u7891\u8D8A\u754C"],
      ["placement_outside", "\u9636\u6BB5\u6210\u679C\u8D8A\u754C"],
      ["coverage_excluded", "\u65E0\u90E8\u7F72\u8986\u76D6\u88AB\u5B8C\u5168\u6392\u9664"],
      ["coverage_address_anomaly", "\u8986\u76D6\u5730\u5740\u5F02\u5E38"]
    ];
    for (const [type, title] of groups) {
      const items = (result.conflicts || []).filter((item) => item.type === type);
      if (!items.length) continue;
      const group = el("section", "tf-boundary-conflict-group");
      group.append(el("h4", "tf-boundary-conflict-group__title", `${title} \xB7 ${items.length}`));
      for (const item of items) {
        const row = el("div", "tf-boundary-conflict-item");
        const direction = item.type === "milestone_outside" ? `\u91CC\u7A0B\u7891\u65E5\u671F ${item.targetDate} \u4E0D\u5728\u65B0\u8FB9\u754C\u5185` : item.direction === "left" ? "\u65E9\u4E8E\u65B0\u8D77\u70B9" : item.direction === "right" ? "\u665A\u4E8E\u65B0\u7EC8\u70B9" : item.direction === "both" ? "\u8DE8\u8D8A\u4E24\u4FA7\u8FB9\u754C" : "\u5730\u5740\u65E0\u6CD5\u89C4\u8303\u89E3\u6790";
        row.append(
          el("strong", "tf-boundary-conflict-item__label", item.label),
          el("span", "tf-boundary-conflict-item__range", item.startDate && item.endDateExclusive ? `${dateRange(item.startDate, item.endDateExclusive)} \xB7 ${direction}` : direction)
        );
        group.append(row);
      }
      container.append(group);
    }
  }
  async openFrameworkBoundaryModal(frameworkId) {
    const store = await this.store.read();
    const projection = reduceTemporalStore(store);
    const framework = projection.frameworksById[frameworkId];
    if (!framework || framework.status !== "active") return new import_obsidian.Notice("\u627E\u4E0D\u5230\u53EF\u8C03\u6574\u7684\u65F6\u95F4\u6846\u67B6", 9e3);
    new TemporalFormModal(this, {
      title: "\u8C03\u6574\u65F6\u95F4\u6846\u67B6\u8FB9\u754C",
      message: "\u975E\u7834\u574F\u6027\u8C03\u6574\uFF1A\u53EA\u6539\u53D8\u6846\u67B6\u9996\u672B\u8FB9\u754C\uFF0C\u4E0D\u79FB\u52A8\u3001\u4E0D\u88C1\u526A\u3001\u4E0D\u5220\u9664\u5DF2\u6709\u6210\u679C\u6216\u5386\u53F2\u8BB0\u5F55\u3002\u5DF2\u6709\u65F6\u95F4\u5185\u5BB9\u4E00\u65E6\u843D\u5230\u65B0\u8FB9\u754C\u4E4B\u5916\uFF0C\u672C\u6B21\u4FDD\u5B58\u4F1A\u88AB\u963B\u6B62\u3002",
      recordType: "framework-boundary-revise",
      recordId: framework.id,
      baseRevision: store.revision,
      initial: { startDate: framework.startDate, endDateExclusive: framework.endDateExclusive, reason: "" },
      fields: [
        { key: "startDate", label: "\u5F00\u59CB\u65E5\u671F", type: "date" },
        { key: "endDateExclusive", label: "\u7ED3\u675F\u8FB9\u754C\uFF08\u4E0D\u542B\u5F53\u5929\uFF09", type: "date" },
        { key: "reason", label: "\u8C03\u6574\u539F\u56E0", type: "textarea", rows: 3, wide: true, placeholder: "\u8BF4\u660E\u4E3A\u4EC0\u4E48\u8981\u6269\u5927\u6216\u6536\u7F29\u6574\u4F53\u65F6\u95F4\u6846\u67B6" }
      ],
      validate: (value) => this.boundaryValidation(projection, framework, value),
      renderValidation: (container, result) => this.renderBoundaryValidation(container, result),
      submitLabel: "\u4FDD\u5B58\u65B0\u8FB9\u754C",
      onSubmit: async (value, session) => {
        await this.mutate("framework-boundary-revise", (draft) => reviseFrameworkBoundary(draft, { frameworkId, ...value }), { expectedRevision: session.identity.baseRevision });
        const view = this.getActiveView();
        if (view?.environment.frameworkId === frameworkId) view.environment.timePath = [];
        await view?.renderPreservingView();
      }
    }).open();
  }
  async openImportModal(frameworkId) {
    try {
      const api = this.mandalaApi();
      if (typeof api?.listEffectiveOperationalContextKeys !== "function") throw new Error("Mandala \u6709\u6548\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E3B\u952E API \u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u5148\u542F\u7528\u6216\u91CD\u542F\u76F8\u5173\u63D2\u4EF6");
      if (typeof api?.listEffectiveGoalOperationalContextKeys !== "function") throw new Error("Mandala \u6709\u6548\u76EE\u6807\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E3B\u952E API \u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u5148\u542F\u7528\u6216\u91CD\u542F\u76F8\u5173\u63D2\u4EF6");
      const [projectSnapshot, goalSnapshot] = await Promise.all([
        api.listEffectiveOperationalContextKeys({ consumer: "temporal-framework" }),
        api.listEffectiveGoalOperationalContextKeys({ consumer: "temporal-framework" })
      ]);
      const usableTargets = validateEffectiveOperationalContextSnapshots(projectSnapshot, goalSnapshot);
      const store = await this.store.read();
      const projection = reduceTemporalStore(store);
      const framework = projection.frameworksById[frameworkId];
      const existingKeys = new Set(activeValues2(projection.membershipsById).filter((item) => item.frameworkId === frameworkId).map((item) => primaryRefKey(item.primaryRef)));
      new ImportTargetsModal(this, framework, usableTargets, existingKeys, async (targets) => {
        await this.mutate("membership-import", (draft) => {
          for (const target of targets) {
            const targetRef = this.primaryRefFromTarget(target);
            const currentProjection = reduceTemporalStore(draft);
            const lifetimeMatch = Object.values(currentProjection.membershipsById).find((item) => item.frameworkId === frameworkId && primaryRefKey(item.primaryRef) === primaryRefKey(targetRef));
            if (lifetimeMatch?.status === "exited") reinstateMembership(draft, {
              membershipId: lifetimeMatch.id,
              lastKnownLabel: target.label,
              sourceState: "fresh",
              planningStart: framework.startDate,
              planningEndDateExclusive: framework.endDateExclusive
            });
            else admitMembership(draft, {
              frameworkId,
              primaryRef: targetRef,
              labelAtCreation: target.label,
              lastKnownLabel: target.label,
              planningStart: framework.startDate,
              planningEndDateExclusive: framework.endDateExclusive
            });
          }
        }, { expectedRevision: store.revision });
      }).open();
    } catch (error) {
      console.warn("[TemporalFramework][mandala.targets-unavailable]", error);
      new import_obsidian.Notice(error.message, 9e3);
    }
  }
  async openMembershipExitModal(frameworkId, membershipId) {
    const { store, projection } = await this.projectionFor(frameworkId);
    const membership = projection.membershipsById[membershipId];
    const blockers = membershipExitBlockers(projection, membershipId);
    if (blockers.length) return new import_obsidian.Notice(blockers.map((blocker) => blocker.message).join("\uFF1B"), 9e3);
    new TemporalFormModal(this, {
      title: "\u79FB\u51FA\u65F6\u95F4\u6846\u67B6",
      message: `\u201C${membership.lastKnownLabel}\u201D\u5C06\u53EA\u4ECE\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u79FB\u51FA\u3002Mandala \u4E2D\u7684\u76EE\u6807\u6216\u9879\u76EE\u4E0D\u4F1A\u5220\u9664\uFF0C\u5386\u53F2\u4E8B\u4EF6\u4ECD\u4F1A\u4FDD\u7559\u3002`,
      recordType: "membership-exit",
      recordId: membershipId,
      baseRevision: store.revision,
      baseHash: hashValue(membership),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u79FB\u51FA\u539F\u56E0", type: "textarea", wide: true, placeholder: "\u8BF4\u660E\u4E3A\u4EC0\u4E48\u5F53\u524D\u4E0D\u518D\u7EB3\u5165\u65F6\u95F4\u6846\u67B6" }],
      submitLabel: "\u79FB\u51FA\u65F6\u95F4\u6846\u67B6",
      submitIcon: "trash-2",
      validate: (value) => ({ valid: Boolean(String(value.reason || "").trim()), message: String(value.reason || "").trim() ? "\u53EF\u4EE5\u79FB\u51FA" : "\u8BF7\u586B\u5199\u79FB\u51FA\u539F\u56E0" }),
      onSubmit: async (value, session) => {
        if (!window.confirm("\u786E\u8BA4\u53EA\u628A\u8BE5\u76EE\u6807\u6216\u9879\u76EE\u79FB\u51FA\u5F53\u524D\u65F6\u95F4\u6846\u67B6\uFF1FMandala \u4E3B\u952E\u4E0D\u4F1A\u5220\u9664\uFF0C\u5386\u53F2\u8BB0\u5F55\u4F1A\u4FDD\u7559\u3002")) throw new Error("\u5DF2\u53D6\u6D88\u79FB\u51FA\u65F6\u95F4\u6846\u67B6");
        await this.mutate("membership-exit", (draft) => exitMembership(draft, { membershipId, reason: value.reason }), { expectedRevision: session.identity.baseRevision });
      }
    }).open();
  }
  async openFrameworkItemModal(frameworkId, item = null) {
    const { store, projection, framework } = await this.projectionFor(frameworkId);
    if (!framework || framework.status !== "active") return new import_obsidian.Notice("\u627E\u4E0D\u5230\u5F53\u524D\u65F6\u95F4\u6846\u67B6", 9e3);
    if (item && projection.frameworkItemsById[item.id]?.status !== "active") return new import_obsidian.Notice("\u6846\u67B6\u6761\u76EE\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728", 9e3);
    new TemporalFormModal(this, {
      title: item ? "\u7F16\u8F91\u6846\u67B6\u6761\u76EE" : "\u65B0\u5EFA\u6846\u67B6\u6761\u76EE",
      message: "\u6846\u67B6\u6761\u76EE\u4E0D\u8BBE\u7C7B\u578B\uFF0C\u7528\u540D\u79F0\u548C\u8BF4\u660E\u8868\u8FBE\u4F60\u7684\u4E0A\u5C42\u610F\u56FE\u3002",
      recordType: item ? "framework-item-revise" : "framework-item-create",
      recordId: item?.id || frameworkId,
      baseRevision: store.revision,
      baseHash: hashValue(item || { frameworkId }),
      initial: { title: item?.title || "", description: item?.description || "" },
      fields: [
        { key: "title", label: "\u6846\u67B6\u6761\u76EE", wide: true, placeholder: "\u4F8B\u5982\uFF1A\u5EFA\u7ACB\u67D0\u9879\u957F\u671F\u80FD\u529B" },
        { key: "description", label: "\u6574\u4F53\u610F\u4E49", type: "textarea", rows: 4, wide: true, placeholder: "\u8BF4\u660E\u5B83\u4E3A\u4EC0\u4E48\u5B58\u5728\uFF0C\u4EE5\u53CA\u5E0C\u671B\u5F62\u6210\u4EC0\u4E48\u6574\u4F53\u5C40\u9762" }
      ],
      validate: (value) => ({ valid: Boolean(String(value.title || "").trim()), message: String(value.title || "").trim() ? "\u53EF\u4EE5\u4FDD\u5B58" : "\u8BF7\u586B\u5199\u6846\u67B6\u6761\u76EE\u540D\u79F0" }),
      onSubmit: async (value, session) => {
        await this.mutate(item ? "framework-item-revise" : "framework-item-create", (draft) => {
          if (item) reviseFrameworkItem(draft, { frameworkItemId: item.id, ...value });
          else createFrameworkItem(draft, { frameworkId, ...value });
        }, { expectedRevision: session.identity.baseRevision });
        await this.getActiveView()?.renderPreservingView();
      }
    }).open();
  }
  async openArchiveFrameworkItemModal(item) {
    const store = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u505C\u7528\u6846\u67B6\u6761\u76EE",
      message: `\u53EA\u6709\u4E0D\u518D\u5305\u542B\u6709\u6548\u76EE\u6807\u3001\u9879\u76EE\u6216\u91CC\u7A0B\u7891\u7684\u201C${item.title}\u201D\u624D\u80FD\u505C\u7528\u3002\u5386\u53F2\u4E0D\u4F1A\u5220\u9664\u3002`,
      recordType: "framework-item-archive",
      recordId: item.id,
      baseRevision: store.revision,
      baseHash: hashValue(item),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u505C\u7528\u539F\u56E0", type: "textarea", rows: 3, wide: true }],
      submitLabel: "\u505C\u7528\u6846\u67B6\u6761\u76EE",
      submitIcon: "archive",
      validate: (value) => ({ valid: Boolean(String(value.reason || "").trim()), message: String(value.reason || "").trim() ? "\u53EF\u4EE5\u505C\u7528" : "\u8BF7\u586B\u5199\u505C\u7528\u539F\u56E0" }),
      onSubmit: async (value, session) => {
        await this.mutate("framework-item-archive", (draft) => archiveFrameworkItem(draft, { frameworkItemId: item.id, reason: value.reason }), { expectedRevision: session.identity.baseRevision });
        await this.getActiveView()?.renderPreservingView();
      }
    }).open();
  }
  async openFrameworkMilestoneModal(frameworkItemId, milestone = null) {
    const store = await this.store.read();
    const projection = reduceTemporalStore(store);
    const item = projection.frameworkItemsById[frameworkItemId];
    if (!item || item.status !== "active") return new import_obsidian.Notice("\u6846\u67B6\u6761\u76EE\u5DF2\u7ECF\u505C\u7528\u6216\u4E0D\u5B58\u5728", 9e3);
    const framework = projection.frameworksById[item.frameworkId];
    new TemporalFormModal(this, {
      title: milestone ? "\u7F16\u8F91\u6846\u67B6\u91CC\u7A0B\u7891" : "\u65B0\u589E\u6846\u67B6\u91CC\u7A0B\u7891",
      message: `\u53E5\u5F0F\u56FA\u5B9A\u4E3A\u201C\u65E5\u671F\uFF0C\u6211\u5E94\u8BE5\u80FD\u591F\u8FBE\u6210\u2026\u2026\u201D\u3002\u65E5\u671F\u5FC5\u987B\u5728 ${framework.startDate} \u81F3 ${addDays(framework.endDateExclusive, -1)} \u5185\u3002`,
      recordType: milestone ? "framework-milestone-revise" : "framework-milestone-create",
      recordId: milestone?.id || item.id,
      baseRevision: store.revision,
      baseHash: hashValue(milestone || item),
      initial: { targetDate: milestone?.targetDate || localDate(), achievement: milestone?.achievement || "" },
      fields: [
        { key: "targetDate", label: "\u76EE\u6807\u65E5\u671F", type: "date" },
        { key: "achievement", label: "\u6211\u5E94\u8BE5\u80FD\u591F\u8FBE\u6210", type: "textarea", rows: 4, wide: true, placeholder: "\u586B\u5199\u53EF\u5224\u65AD\u7684\u9636\u6BB5\u6027\u5C40\u9762\u6216\u80FD\u529B" }
      ],
      validate: (value) => {
        const achievement = String(value.achievement || "").trim();
        const inside = compareDate(value.targetDate, framework.startDate) >= 0 && compareDate(value.targetDate, framework.endDateExclusive) < 0;
        return { valid: Boolean(achievement && inside), message: !achievement ? "\u8BF7\u586B\u5199\u8FBE\u6210\u5185\u5BB9" : inside ? "\u53EF\u4EE5\u4FDD\u5B58" : "\u65E5\u671F\u8D85\u51FA\u65F6\u95F4\u6846\u67B6\u8FB9\u754C" };
      },
      onSubmit: async (value, session) => {
        await this.mutate(milestone ? "framework-milestone-revise" : "framework-milestone-create", (draft) => {
          if (milestone) reviseFrameworkMilestone(draft, { milestoneId: milestone.id, ...value });
          else createFrameworkMilestone(draft, { frameworkItemId: item.id, ...value });
        }, { expectedRevision: session.identity.baseRevision });
        await this.getActiveView()?.renderPreservingView();
      }
    }).open();
  }
  async openArchiveFrameworkMilestoneModal(milestone) {
    const store = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u505C\u7528\u6846\u67B6\u91CC\u7A0B\u7891",
      message: `\u201C${frameworkMilestoneSentence(milestone)}\u201D\u4ECD\u6709\u5173\u8054\u8282\u70B9\u65F6\u4E0D\u80FD\u505C\u7528\uFF0C\u8BF7\u5148\u9010\u9879\u89E3\u9664\u3002\u5386\u53F2\u4E0D\u4F1A\u5220\u9664\u3002`,
      recordType: "framework-milestone-archive",
      recordId: milestone.id,
      baseRevision: store.revision,
      baseHash: hashValue(milestone),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u505C\u7528\u539F\u56E0", type: "textarea", rows: 3, wide: true }],
      submitLabel: "\u505C\u7528\u91CC\u7A0B\u7891",
      submitIcon: "archive",
      validate: (value) => ({ valid: Boolean(String(value.reason || "").trim()), message: String(value.reason || "").trim() ? "\u53EF\u4EE5\u505C\u7528" : "\u8BF7\u586B\u5199\u505C\u7528\u539F\u56E0" }),
      onSubmit: async (value, session) => {
        await this.mutate("framework-milestone-archive", (draft) => archiveFrameworkMilestone(draft, { milestoneId: milestone.id, reason: value.reason }), { expectedRevision: session.identity.baseRevision });
        await this.getActiveView()?.renderPreservingView();
      }
    }).open();
  }
  async openMembershipAssignmentModal(frameworkId, membershipId) {
    const { store, projection } = await this.projectionFor(frameworkId);
    const membership = projection.membershipsById[membershipId];
    if (!membership || membership.status !== "active") return new import_obsidian.Notice("\u76EE\u6807\u6216\u9879\u76EE\u4E0D\u5728\u5F53\u524D\u65F6\u95F4\u6846\u67B6\u4E2D", 9e3);
    const items = activeValues2(projection.frameworkItemsById).filter((item) => item.frameworkId === frameworkId);
    new TemporalFormModal(this, {
      title: "\u8C03\u6574\u6846\u67B6\u6761\u76EE\u5F52\u5C5E",
      message: "\u5F52\u5C5E\u6539\u53D8\u4E0D\u4F1A\u79FB\u52A8\u6216\u590D\u5236\u6210\u679C\u3002\u82E5\u4E3B\u952E\u6216\u5176\u6210\u679C\u4ECD\u6709\u5173\u8054\u7684\u6846\u67B6\u91CC\u7A0B\u7891\uFF0C\u5FC5\u987B\u5148\u89E3\u9664\uFF0C\u907F\u514D\u4EA7\u751F\u8DE8\u6846\u67B6\u542B\u4E49\u3002",
      recordType: "membership-framework-item-assign",
      recordId: membership.id,
      baseRevision: store.revision,
      baseHash: hashValue(membership),
      initial: { frameworkItemId: membership.frameworkItemId || "" },
      fields: [{ key: "frameworkItemId", label: "\u6846\u67B6\u6761\u76EE", type: "select", wide: true, options: [["", "\u672A\u5F52\u5C5E\u76EE\u6807\u4E0E\u9879\u76EE"], ...items.map((item) => [item.id, item.title])] }],
      validate: (value) => ({ valid: (value.frameworkItemId || null) !== (membership.frameworkItemId || null), message: (value.frameworkItemId || null) !== (membership.frameworkItemId || null) ? "\u53EF\u4EE5\u8C03\u6574" : "\u5F52\u5C5E\u6CA1\u6709\u53D8\u5316" }),
      onSubmit: async (value, session) => this.commitMembershipAssignment(frameworkId, membership.id, value.frameworkItemId || null, session.identity.baseRevision)
    }).open();
  }
  async commitMembershipAssignment(frameworkId, membershipId, frameworkItemId, expectedRevision) {
    try {
      await this.mutate("membership-framework-item-assign", (draft) => assignMembershipFrameworkItem(draft, { membershipId, frameworkItemId }), { expectedRevision });
      await this.getActiveView()?.renderPreservingView();
    } catch (error) {
      new import_obsidian.Notice(error.message, 9e3);
      await this.getActiveView()?.renderPreservingView();
      throw error;
    }
  }
  bindingTargetLabel(projection, targetType, targetId) {
    if (targetType === "outcome") return `\u6210\u679C \xB7 ${projection.outcomesById[targetId]?.title || "\u5931\u8054\u6210\u679C"}`;
    const membership = projection.membershipsById[targetId];
    return `${membership?.primaryRef?.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"} \xB7 ${membership?.lastKnownLabel || "\u5931\u8054\u4E3B\u952E"}`;
  }
  async openMilestoneBindingModal(frameworkId, fixedTargetType = null, fixedTargetId = null, fixedMilestoneId = null) {
    const { store, projection } = await this.projectionFor(frameworkId);
    const fixedMilestone = fixedMilestoneId ? projection.frameworkMilestonesById[fixedMilestoneId] : null;
    const fixedTarget = fixedTargetType === "outcome" ? projection.outcomesById[fixedTargetId] : fixedTargetType === "membership" ? projection.membershipsById[fixedTargetId] : null;
    const membership = fixedTargetType === "outcome" ? projection.membershipsById[fixedTarget?.membershipId] : fixedTargetType === "membership" ? fixedTarget : null;
    const frameworkItemId = fixedMilestone?.frameworkItemId || membership?.frameworkItemId || null;
    if (!frameworkItemId) return new import_obsidian.Notice("\u8BF7\u5148\u628A\u6240\u5C5E\u76EE\u6807\u6216\u9879\u76EE\u5F52\u5230\u4E00\u4E2A\u6846\u67B6\u6761\u76EE\uFF0C\u518D\u5173\u8054\u91CC\u7A0B\u7891", 9e3);
    const milestones = activeValues2(projection.frameworkMilestonesById).filter((item) => item.frameworkItemId === frameworkItemId);
    if (!milestones.length) return new import_obsidian.Notice("\u8BE5\u6846\u67B6\u6761\u76EE\u8FD8\u6CA1\u6709\u53EF\u5173\u8054\u7684\u91CC\u7A0B\u7891", 9e3);
    const assignedMemberships = activeValues2(projection.membershipsById).filter((item) => item.frameworkId === frameworkId && item.frameworkItemId === frameworkItemId);
    const targetOptions = [];
    for (const item of assignedMemberships) {
      targetOptions.push([`membership:${item.id}`, `${item.primaryRef?.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"} \xB7 ${item.lastKnownLabel}`]);
      for (const outcome of activeValues2(projection.outcomesById).filter((candidate) => candidate.membershipId === item.id)) targetOptions.push([`outcome:${outcome.id}`, `  \u6210\u679C \xB7 ${outcome.title}`]);
    }
    const initialTargetKey = fixedTargetType && fixedTargetId ? `${fixedTargetType}:${fixedTargetId}` : targetOptions[0]?.[0] || "";
    new TemporalFormModal(this, {
      title: "\u5173\u8054\u6846\u67B6\u91CC\u7A0B\u7891",
      message: "\u6BCF\u4E2A\u76EE\u6807\u3001\u9879\u76EE\u6216\u6210\u679C\u6700\u591A\u53EA\u6709\u4E00\u5219\u6709\u6548\u91CC\u7A0B\u7891\u4F4D\u7F6E\u3002\u6210\u679C\u4E0D\u590D\u5236\uFF0C\u6267\u884C\u7236\u5B50\u6811\u4E5F\u4E0D\u4F1A\u6539\u53D8\u3002",
      recordType: "framework-milestone-bind",
      recordId: fixedTargetId || fixedMilestoneId || frameworkItemId,
      baseRevision: store.revision,
      baseHash: hashValue({ frameworkItemId, fixedTargetType, fixedTargetId, fixedMilestoneId }),
      initial: { milestoneId: fixedMilestoneId || milestones[0].id, targetKey: initialTargetKey },
      fields: [
        ...fixedMilestoneId ? [] : [{ key: "milestoneId", label: "\u6846\u67B6\u91CC\u7A0B\u7891", type: "select", wide: true, options: milestones.map((item) => [item.id, frameworkMilestoneSentence(item)]) }],
        ...fixedTargetType ? [] : [{ key: "targetKey", label: "\u5173\u8054\u8282\u70B9", type: "select", wide: true, options: targetOptions }]
      ],
      validate: (value) => ({ valid: Boolean(value.milestoneId && value.targetKey), message: value.milestoneId && value.targetKey ? "\u53EF\u4EE5\u5173\u8054" : "\u8BF7\u9009\u62E9\u91CC\u7A0B\u7891\u548C\u5173\u8054\u8282\u70B9" }),
      submitLabel: "\u5EFA\u7ACB\u5173\u8054",
      submitIcon: "link-2",
      onSubmit: async (value, session) => {
        const [targetType, targetId] = String(value.targetKey).split(":", 2);
        await this.mutate("framework-milestone-bind", (draft) => bindFrameworkMilestone(draft, { milestoneId: value.milestoneId, targetType, targetId }), { expectedRevision: session.identity.baseRevision });
        await this.getActiveView()?.renderPreservingView();
      }
    }).open();
  }
  async openUnbindMilestoneModal(binding) {
    const store = await this.store.read();
    const projection = reduceTemporalStore(store);
    const milestone = projection.frameworkMilestonesById[binding.milestoneId];
    new TemporalFormModal(this, {
      title: "\u89E3\u9664\u6846\u67B6\u91CC\u7A0B\u7891\u5173\u8054",
      message: `${this.bindingTargetLabel(projection, binding.targetType, binding.targetId)} \u5C06\u4E0D\u518D\u5B9A\u4F4D\u5230\u201C${milestone ? frameworkMilestoneSentence(milestone) : "\u5931\u8054\u91CC\u7A0B\u7891"}\u201D\u3002\u6210\u679C\u548C\u5386\u53F2\u8BB0\u5F55\u4E0D\u4F1A\u5220\u9664\u3002`,
      recordType: "framework-milestone-unbind",
      recordId: binding.id,
      baseRevision: store.revision,
      baseHash: hashValue(binding),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u89E3\u9664\u539F\u56E0", type: "textarea", rows: 3, wide: true }],
      submitLabel: "\u89E3\u9664\u5173\u8054",
      submitIcon: "unlink",
      validate: (value) => ({ valid: Boolean(String(value.reason || "").trim()), message: String(value.reason || "").trim() ? "\u53EF\u4EE5\u89E3\u9664" : "\u8BF7\u586B\u5199\u89E3\u9664\u539F\u56E0" }),
      onSubmit: async (value, session) => {
        await this.mutate("framework-milestone-unbind", (draft) => unbindFrameworkMilestone(draft, { bindingId: binding.id, reason: value.reason }), { expectedRevision: session.identity.baseRevision });
        await this.getActiveView()?.renderPreservingView();
      }
    }).open();
  }
  async projectionFor(frameworkId) {
    const store = await this.store.read();
    const projection = reduceTemporalStore(store);
    return { store, projection, framework: projection.frameworksById[frameworkId] };
  }
  async openOutcomeModal(frameworkId, context = {}) {
    const { store, projection, framework } = await this.projectionFor(frameworkId);
    const memberships = activeValues2(projection.membershipsById).filter((item) => item.frameworkId === frameworkId);
    if (!memberships.length) return new import_obsidian.Notice("\u8BF7\u5148\u628A\u76EE\u6807\u6216\u9879\u76EE\u4E3B\u952E\u7EB3\u5165\u5F53\u524D\u6846\u67B6");
    const membershipId = context.membershipId || memberships[0].id;
    const box = context.box || null;
    const parent = context.parentId ? projection.outcomesById[context.parentId] : null;
    const parentPlacement = parent ? outcomePlacement(projection, parent.id) : null;
    if (context.parentId && !parentPlacement) return new import_obsidian.Notice("\u8BF7\u5148\u7ED9\u4E0A\u7EA7\u6210\u679C\u5B89\u6392\u65F6\u95F4\uFF0C\u518D\u5411\u4E0B\u5206\u89E3");
    const initial = {
      membershipId,
      title: "",
      acceptance: "",
      outcomeKind: "outcome",
      declaredScale: parentPlacement ? nextFinerScale(parentPlacement.declaredScale) : box?.scale || "quarter",
      startDate: parentPlacement?.startDate || box?.startDate || framework.startDate,
      endDateExclusive: parentPlacement?.endDateExclusive || box?.endDateExclusive || framework.endDateExclusive,
      dueOn: parentPlacement ? addDays(parentPlacement.endDateExclusive, -1) : box ? addDays(box.endDateExclusive, -1) : ""
    };
    new TemporalFormModal(this, {
      title: context.parentId ? "\u65B0\u589E\u4E0B\u4E00\u5C42\u9636\u6BB5\u6210\u679C" : "\u65B0\u589E\u9636\u6BB5\u6210\u679C",
      modalClass: "is-outcome-modal",
      message: context.parentId ? `\u65B0\u6210\u679C\u5148\u7EE7\u627F\u4E0A\u7EA7\u201C${parent.title}\u201D\u7684\u5B8C\u6574\u65F6\u95F4\u533A\u95F4\uFF0C\u4FDD\u5B58\u540E\u53EF\u76F4\u63A5\u5728\u7236\u8F68\u9053\u4E0A\u62D6\u52A8\u7EC6\u5206\u3002` : "",
      recordType: "outcome-create",
      recordId: context.parentId || box?.id || frameworkId,
      baseRevision: store.revision,
      baseHash: hashValue({ frameworkId, membershipId, parentId: context.parentId || null, boxId: box?.id || null }),
      initial,
      leadingActions: [{
        label: "\u6240\u5C5E\u4E3B\u952E Ontology",
        icon: "table-properties",
        onClick: (modal) => {
          const selectedMembershipId = context.membershipId || modal.value.membershipId;
          return this.openMembershipOntology(projection.membershipsById[selectedMembershipId]);
        }
      }],
      fields: [
        ...context.membershipId ? [] : [{ key: "membershipId", label: "\u6240\u5C5E\u4E3B\u952E", type: "select", wide: true, options: memberships.map((item) => [item.id, `${item.primaryRef.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"} \xB7 ${item.lastKnownLabel}`]) }],
        { key: "title", label: "\u9636\u6BB5\u6210\u679C", wide: true, placeholder: "\u7528\u53EF\u9A8C\u6536\u7684\u7ED3\u679C\u63CF\u8FF0" },
        { key: "acceptance", label: "\u9A8C\u6536\u6761\u4EF6", type: "textarea", rows: 3, wide: true },
        { key: "outcomeKind", label: "\u6210\u679C\u7C7B\u578B", type: "select", options: [["outcome", "\u666E\u901A\u6210\u679C"], ["stage_gate", "\u9636\u6BB5\u5173\u53E3"]] },
        ...context.parentId ? [] : [
          { key: "declaredScale", label: "\u5B9A\u951A\u5C3A\u5EA6", type: "select", options: TIME_SCALES.map((scale) => [scale, SCALE_LABELS[scale]]) },
          { key: "startDate", label: "\u5F00\u59CB\u65E5\u671F", type: "date" },
          { key: "endDateExclusive", label: "\u7ED3\u675F\u8FB9\u754C\uFF08\u4E0D\u542B\u5F53\u5929\uFF09", type: "date" },
          { key: "dueOn", label: "\u76EE\u6807\u5B8C\u6210\u65E5", type: "date" }
        ]
      ],
      onSubmit: async (value, session) => {
        await this.mutate("outcome-create-and-place", (draft) => {
          const outcomeId = createOutcome(draft, {
            frameworkId,
            membershipId: context.membershipId || value.membershipId,
            title: value.title,
            acceptance: value.acceptance,
            outcomeKind: value.outcomeKind,
            outlineParentId: context.parentId || null
          });
          placeOutcome(draft, {
            frameworkId,
            outcomeId,
            mode: "interval",
            startDate: value.startDate,
            endDateExclusive: value.endDateExclusive,
            dueOn: value.dueOn || null,
            declaredScale: value.declaredScale,
            homeTimeBoxRef: canonicalTimeBox(value.declaredScale, value.startDate, framework)
          });
        }, { expectedRevision: session.identity.baseRevision });
      }
    }).open();
  }
  async openPlacementModal(frameworkId, context = {}) {
    const { store, projection, framework } = await this.projectionFor(frameworkId);
    const outcomes = activeValues2(projection.outcomesById).filter((item) => item.frameworkId === frameworkId);
    const eligible = context.outcomeId ? outcomes.filter((item) => item.id === context.outcomeId) : outcomes.filter((item) => !outcomePlacement(projection, item.id));
    if (!eligible.length) return new import_obsidian.Notice(context.outcomeId ? "\u627E\u4E0D\u5230\u8FD9\u4E2A\u6210\u679C" : "\u6CA1\u6709\u5C1A\u672A\u5B89\u6392\u7684\u6210\u679C");
    const existing = context.outcomeId ? outcomePlacement(projection, context.outcomeId) : null;
    const box = context.box;
    const initial = {
      outcomeId: context.outcomeId || eligible[0].id,
      declaredScale: box?.scale || existing?.declaredScale || "quarter",
      startDate: box?.startDate || existing?.startDate || framework.startDate,
      endDateExclusive: box?.endDateExclusive || existing?.endDateExclusive || framework.endDateExclusive,
      dueOn: existing?.dueOn || (box ? addDays(box.endDateExclusive, -1) : "")
    };
    new TemporalFormModal(this, {
      title: existing ? "\u8C03\u6574\u9636\u6BB5\u6210\u679C\u5B89\u6392" : "\u5B89\u6392\u5DF2\u6709\u9636\u6BB5\u6210\u679C",
      recordType: existing ? "placement-move" : "placement-create",
      recordId: context.outcomeId || box?.id || frameworkId,
      baseRevision: store.revision,
      baseHash: hashValue(existing || { frameworkId, outcomeId: context.outcomeId || null, boxId: box?.id || null }),
      initial,
      fields: [
        ...context.outcomeId ? [] : [{ key: "outcomeId", label: "\u9636\u6BB5\u6210\u679C", type: "select", wide: true, options: eligible.map((item) => [item.id, item.title]) }],
        { key: "declaredScale", label: "\u5B9A\u951A\u5C3A\u5EA6", type: "select", options: TIME_SCALES.map((scale) => [scale, SCALE_LABELS[scale]]) },
        { key: "startDate", label: "\u5F00\u59CB\u65E5\u671F", type: "date" },
        { key: "endDateExclusive", label: "\u7ED3\u675F\u8FB9\u754C\uFF08\u4E0D\u542B\u5F53\u5929\uFF09", type: "date" },
        { key: "dueOn", label: "\u76EE\u6807\u5B8C\u6210\u65E5", type: "date" }
      ],
      onSubmit: async (value, session) => {
        await this.mutate(existing ? "placement-move" : "placement-create", (draft) => {
          const input = {
            frameworkId,
            outcomeId: context.outcomeId || value.outcomeId,
            mode: "interval",
            startDate: value.startDate,
            endDateExclusive: value.endDateExclusive,
            dueOn: value.dueOn || null,
            declaredScale: value.declaredScale,
            homeTimeBoxRef: canonicalTimeBox(value.declaredScale, value.startDate, framework)
          };
          if (existing) moveOutcomePlacement(draft, input);
          else placeOutcome(draft, input);
        }, { expectedRevision: session.identity.baseRevision });
      }
    }).open();
  }
  async openCoverageModal(frameworkId, box) {
    const { store, projection } = await this.projectionFor(frameworkId);
    const memberships = activeValues2(projection.membershipsById).filter((item) => {
      if (item.frameworkId !== frameworkId || coverageDecisionFor(projection, frameworkId, item.id, box)) return false;
      return !activeValues2(projection.placementsById).some((placement) => projection.outcomesById[placement.outcomeId]?.membershipId === item.id && placementOverlapsBox(placement, box));
    });
    if (!memberships.length) return new import_obsidian.Notice("\u6240\u6709\u4E3B\u952E\u90FD\u5DF2\u6709\u672C\u9636\u6BB5\u8986\u76D6\u51B3\u5B9A");
    new TemporalFormModal(this, {
      title: "\u58F0\u660E\u672C\u9636\u6BB5\u65E0\u90E8\u7F72",
      message: `${box.label} \xB7 \u8FD9\u662F\u663E\u5F0F\u8986\u76D6\u51B3\u5B9A\uFF0C\u4E0D\u4F1A\u5220\u9664\u4EFB\u4F55\u6210\u679C\u3002`,
      recordType: "coverage-decision",
      recordId: box.id,
      baseRevision: store.revision,
      baseHash: hashValue({ frameworkId, boxId: box.id, membershipIds: memberships.map((item) => item.id) }),
      initial: { membershipId: memberships[0].id, reason: "" },
      fields: [
        { key: "membershipId", label: "\u4E3B\u952E", type: "select", wide: true, options: memberships.map((item) => [item.id, item.lastKnownLabel]) },
        { key: "reason", label: "\u65E0\u90E8\u7F72\u539F\u56E0", type: "textarea", rows: 3, wide: true }
      ],
      onSubmit: async (value, session) => this.mutate("coverage-no-deployment", (draft) => decideNoDeployment(draft, {
        frameworkId,
        membershipId: value.membershipId,
        timeBoxRef: box,
        policyVersion: box.policyVersion,
        reason: value.reason
      }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
  async openRevokeCoverageModal(coverage) {
    const store = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u64A4\u9500\u672C\u9636\u6BB5\u65E0\u90E8\u7F72\u51B3\u5B9A",
      message: "\u539F\u51B3\u5B9A\u4F1A\u4FDD\u7559\uFF0C\u672C\u64CD\u4F5C\u8FFD\u52A0\u4E00\u6761\u64A4\u9500\u4E8B\u4EF6\u3002\u64A4\u9500\u540E\u624D\u53EF\u5728\u8BE5\u9636\u6BB5\u5B89\u6392\u6210\u679C\u3002",
      recordType: "coverage-revoke",
      recordId: coverage.id,
      baseRevision: store.revision,
      baseHash: hashValue(coverage),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u64A4\u9500\u539F\u56E0", type: "textarea", wide: true }],
      onSubmit: async (value, session) => this.mutate("coverage-revoke", (draft) => revokeCoverageDecision(draft, {
        coverageId: coverage.id,
        reason: value.reason
      }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
  outcomeHierarchyGroups(projection, frameworkId, excludedOutcomeId) {
    const memberships = activeValues2(projection.membershipsById).filter((item) => item.frameworkId === frameworkId).sort((left, right) => left.lastKnownLabel.localeCompare(right.lastKnownLabel, "zh-CN"));
    const groups = [];
    for (const membership of memberships) {
      const outcomes = activeValues2(projection.outcomesById).filter((item) => item.membershipId === membership.id);
      const byParent = /* @__PURE__ */ new Map();
      for (const item of outcomes) {
        const parentId = outcomes.some((candidate) => candidate.id === item.outlineParentId) ? item.outlineParentId : null;
        if (!byParent.has(parentId)) byParent.set(parentId, []);
        byParent.get(parentId).push(item);
      }
      for (const items of byParent.values()) items.sort((left, right) => left.title.localeCompare(right.title, "zh-CN"));
      const options = [];
      const visited = /* @__PURE__ */ new Set();
      const visit = (item, path4, depth) => {
        if (!item || visited.has(item.id)) return;
        visited.add(item.id);
        const nextPath = [...path4, item.title];
        if (item.id !== excludedOutcomeId) {
          const marker = item.outcomeKind === "stage_gate" ? " [\u5173\u53E3]" : "";
          options.push([item.id, `${"\u3000".repeat(depth)}${depth ? "\u21B3 " : ""}${nextPath.join(" \u203A ")}${marker}`]);
        }
        for (const child of byParent.get(item.id) || []) visit(child, nextPath, depth + 1);
      };
      for (const root of byParent.get(null) || []) visit(root, [], 0);
      for (const orphan of outcomes) if (!visited.has(orphan.id)) visit(orphan, ["\u4E0A\u7EA7\u5931\u8054"], 0);
      if (options.length) groups.push({
        label: `${membership.primaryRef.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE"} \xB7 ${membership.lastKnownLabel}`,
        options
      });
    }
    return groups;
  }
  async openRelationModal(outcome, projection) {
    const store = await this.store.read();
    projection = reduceTemporalStore(store);
    outcome = projection.outcomesById[outcome.id] || outcome;
    const groups = this.outcomeHierarchyGroups(projection, outcome.frameworkId, outcome.id);
    const firstTargetId = groups[0]?.options[0]?.[0];
    if (!firstTargetId) return new import_obsidian.Notice("\u5F53\u524D\u6846\u67B6\u6CA1\u6709\u53EF\u8FDE\u63A5\u7684\u5176\u4ED6\u6210\u679C");
    const modal = new TemporalFormModal(this, {
      title: "\u5EFA\u7ACB\u6210\u679C\u5173\u7CFB",
      message: `\u4EE5\u201C${outcome.title}\u201D\u4E3A\u5173\u7CFB\u8D77\u70B9\u3002\u5173\u7CFB\u53EA\u5728\u5F00\u542F\u5BF9\u5E94\u900F\u955C\u65F6\u663E\u793A\u3002`,
      recordType: "relation-create",
      recordId: outcome.id,
      baseRevision: store.revision,
      baseHash: hashValue(outcome),
      initial: { relationType: "precedes", targetOutcomeId: firstTargetId },
      fields: [
        { key: "relationType", label: "\u5173\u7CFB", type: "select", options: RELATION_TYPES.map((type) => [type, RELATION_LABELS[type]]) },
        { key: "targetOutcomeId", label: "\u6307\u5411\u6210\u679C\uFF08\u6309\u4E3B\u952E\u4E0E\u5C42\u7EA7\uFF09", type: "select", wide: true, groups }
      ],
      onSubmit: async (value, session, formModal) => {
        const current = await this.store.read();
        if (current.revision !== session.identity.baseRevision) {
          throw new Error(`\u6570\u636E\u5DF2\u53D8\u5316\uFF1A\u671F\u671B revision ${session.identity.baseRevision}\uFF0C\u5F53\u524D\u4E3A ${current.revision}`);
        }
        const input = {
          frameworkId: outcome.frameworkId,
          sourceOutcomeId: outcome.id,
          targetOutcomeId: value.targetOutcomeId,
          relationType: value.relationType
        };
        const diagnostics = outcomeRelationCandidateDiagnostics(current, input);
        if (diagnostics.structuralViolations.length) throw new Error(diagnostics.structuralViolations.join("\uFF1B"));
        if (diagnostics.temporalViolation) {
          this.openNewRelationJointAdjustment(current, diagnostics.relation, () => formModal.completeExternalCommit());
          return { keepOpen: true };
        }
        return this.mutate("relation-create", (draft) => addOutcomeRelation(draft, input, { relationId: diagnostics.relation.id }), {
          expectedRevision: session.identity.baseRevision
        });
      }
    });
    modal.open();
  }
  async openGatePolicyModal(outcome, projection) {
    const store = await this.store.read();
    projection = reduceTemporalStore(store);
    outcome = projection.outcomesById[outcome.id] || outcome;
    const contributorCount = activeValues2(projection.relationsById).filter((relation) => relation.relationType === "contributes_to" && relation.targetOutcomeId === outcome.id).length;
    if (!contributorCount) return new import_obsidian.Notice("\u8BF7\u5148\u5EFA\u7ACB\u81F3\u5C11\u4E00\u6761\u6C47\u805A\u5230\u8BE5\u5173\u53E3\u7684\u5173\u7CFB");
    const current = projection.gatePoliciesByOutcomeId[outcome.id] || { mode: "all", threshold: contributorCount };
    new TemporalFormModal(this, {
      title: "\u8BBE\u7F6E\u9636\u6BB5\u5173\u53E3\u7B56\u7565",
      message: `\u5F53\u524D\u5171\u6709 ${contributorCount} \u4E2A\u6C47\u805A\u6210\u679C\u3002\u7B56\u7565\u53EA\u5224\u65AD\u5C31\u7EEA\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u6D82\u8272\u3002`,
      recordType: "gate-policy",
      recordId: outcome.id,
      baseRevision: store.revision,
      baseHash: hashValue({ outcome, policy: current, contributorCount }),
      initial: { mode: current.mode, threshold: String(current.threshold || contributorCount) },
      fields: [
        { key: "mode", label: "\u5C31\u7EEA\u89C4\u5219", type: "select", options: [["all", "\u5168\u90E8\u6C47\u805A\u6210\u679C\u5B8C\u6210"], ["threshold_count", "\u5B8C\u6210\u6307\u5B9A\u6570\u91CF"]] },
        { key: "threshold", label: "\u6307\u5B9A\u6570\u91CF", type: "number", min: 1, max: contributorCount }
      ],
      onSubmit: async (value, session) => this.mutate("gate-policy", (draft) => setGatePolicy(draft, {
        outcomeId: outcome.id,
        mode: value.mode,
        threshold: Number(value.threshold)
      }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
  async openRevokeRelationModal(relation) {
    const store = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u64A4\u9500\u6210\u679C\u5173\u7CFB",
      recordType: "relation-revoke",
      recordId: relation.id,
      baseRevision: store.revision,
      baseHash: hashValue(relation),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u64A4\u9500\u539F\u56E0", type: "textarea", wide: true }],
      onSubmit: async (value, session) => this.mutate("relation-revoke", (draft) => revokeOutcomeRelation(draft, { relationId: relation.id, reason: value.reason }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
  async openPaintModal(outcome) {
    const store = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u624B\u5DE5\u786E\u8BA4\u9636\u6BB5\u6210\u679C\u5B8C\u6210",
      message: "\u53EA\u6709\u8FD9\u4E00\u6B65\u4F1A\u7ED9\u6210\u679C\u6D82\u8272\u3002\u4F9D\u8D56\u5C31\u7EEA\u548C\u65E5\u671F\u7ECF\u8FC7\u90FD\u4E0D\u4F1A\u81EA\u52A8\u5B8C\u6210\u3002",
      recordType: "completion-paint",
      recordId: outcome.id,
      baseRevision: store.revision,
      baseHash: hashValue(outcome),
      initial: { completedOn: localDate(), evidence: "", note: "" },
      fields: [
        { key: "completedOn", label: "\u5B8C\u6210\u65E5\u671F", type: "date" },
        { key: "evidence", label: "\u5B8C\u6210\u8BC1\u636E", wide: true },
        { key: "note", label: "\u8BF4\u660E", type: "textarea", rows: 3, wide: true }
      ],
      onSubmit: async (value, session) => this.mutate("completion-paint", (draft) => paintOutcome(draft, { outcomeId: outcome.id, ...value }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
  async openUnpaintModal(outcome) {
    const store = await this.store.read();
    new TemporalFormModal(this, {
      title: "\u53D6\u6D88\u5B8C\u6210\u6D82\u8272",
      message: "\u539F\u5B8C\u6210\u4E8B\u4EF6\u4F1A\u4FDD\u7559\uFF0C\u672C\u64CD\u4F5C\u8FFD\u52A0\u4E00\u6761\u53D6\u6D88\u4E8B\u4EF6\u3002",
      recordType: "completion-unpaint",
      recordId: outcome.id,
      baseRevision: store.revision,
      baseHash: hashValue({ outcome, completion: reduceTemporalStore(store).completionByOutcomeId[outcome.id] || null }),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u53D6\u6D88\u539F\u56E0", type: "textarea", wide: true }],
      onSubmit: async (value, session) => this.mutate("completion-unpaint", (draft) => unpaintOutcome(draft, { outcomeId: outcome.id, reason: value.reason }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
  async openArchiveOutcomeModal(outcome, onArchived = null) {
    const store = await this.store.read();
    const projection = reduceTemporalStore(store);
    outcome = projection.outcomesById[outcome.id] || outcome;
    if (outcome.status !== "active") return new import_obsidian.Notice("\u8FD9\u4E2A\u9636\u6BB5\u6210\u679C\u5DF2\u7ECF\u505C\u7528");
    const children = activeValues2(projection.outcomesById).filter((item) => item.outlineParentId === outcome.id);
    const relations = activeValues2(projection.relationsById).filter((item) => item.sourceOutcomeId === outcome.id || item.targetOutcomeId === outcome.id);
    const impact = [];
    if (children.length) impact.push(`\u5B50\u6210\u679C\u4F1A\u4FDD\u7559\u5E76\u7EE7\u7EED\u53EF\u89C1\uFF1A${children.map((item) => item.title).join("\u3001")}`);
    if (relations.length) impact.push(`\u5173\u7CFB\u4F1A\u4FDD\u7559\u4E3A\u5386\u53F2\u7ED3\u6784\uFF1A${relations.map((item) => {
      const outgoing = item.sourceOutcomeId === outcome.id;
      const peer = projection.outcomesById[outgoing ? item.targetOutcomeId : item.sourceOutcomeId];
      return `${outgoing ? "\u2192" : "\u2190"}${RELATION_LABELS[item.relationType]} ${peer?.title || "\u5931\u8054\u6210\u679C"}`;
    }).join("\u3001")}`);
    if (outcomePlacement(projection, outcome.id)) impact.push("\u5F53\u524D\u65F6\u95F4\u5B89\u6392\u4F1A\u4EE5\u8FFD\u52A0\u4E8B\u4EF6\u89E3\u9664");
    new TemporalFormModal(this, {
      title: "\u505C\u7528\u9636\u6BB5\u6210\u679C",
      modalClass: "is-outcome-modal",
      message: `\u4E0D\u4F1A\u7269\u7406\u5220\u9664\u201C${outcome.title}\u201D\u53CA\u5386\u53F2\u4E8B\u4EF6\u3002${impact.length ? `\u5F71\u54CD\uFF1A${impact.join("\uFF1B")}\u3002` : "\u8BE5\u6210\u679C\u6CA1\u6709\u6D3B\u52A8\u5B50\u6210\u679C\u6216\u5173\u7CFB\u3002"}`,
      recordType: "outcome-archive",
      recordId: outcome.id,
      baseRevision: store.revision,
      baseHash: hashValue({ outcome, children: children.map((item) => item.id), relations: relations.map((item) => item.id) }),
      initial: { reason: "" },
      fields: [{ key: "reason", label: "\u505C\u7528\u539F\u56E0", type: "textarea", rows: 3, wide: true }],
      submitLabel: "\u786E\u8BA4\u505C\u7528",
      submitIcon: "archive",
      onSubmit: async (value, session) => {
        if (!value.reason.trim()) throw new Error("\u8BF7\u586B\u5199\u505C\u7528\u539F\u56E0");
        const detail = impact.length ? `

${impact.join("\uFF1B")}\u3002` : "";
        if (!window.confirm(`\u786E\u8BA4\u505C\u7528\u201C${outcome.title}\u201D\uFF1F${detail}

\u5386\u53F2\u6570\u636E\u4E0D\u4F1A\u88AB\u5220\u9664\u3002`)) throw new Error("\u5DF2\u53D6\u6D88\u505C\u7528");
        await this.mutate("outcome-archive", (draft) => archiveOutcome(draft, { outcomeId: outcome.id, reason: value.reason }), { expectedRevision: session.identity.baseRevision });
        onArchived?.();
      }
    }).open();
  }
  async openReviseOutcomeModal(outcome) {
    const store = await this.store.read();
    const projection = reduceTemporalStore(store);
    outcome = projection.outcomesById[outcome.id] || outcome;
    const membership = projection.membershipsById[outcome.membershipId];
    new TemporalFormModal(this, {
      title: "\u4FEE\u8BA2\u9636\u6BB5\u6210\u679C",
      modalClass: "is-outcome-modal",
      recordType: "outcome-revise",
      recordId: outcome.id,
      baseRevision: store.revision,
      baseHash: hashValue(outcome),
      initial: { title: outcome.title, acceptance: outcome.acceptance || "", reason: "" },
      leadingActions: [
        {
          label: "\u6240\u5C5E\u4E3B\u952E Ontology",
          icon: "table-properties",
          onClick: () => this.openMembershipOntology(membership)
        },
        {
          label: "\u505C\u7528\u9636\u6BB5\u6210\u679C",
          icon: "archive",
          className: "is-danger",
          onClick: (modal) => this.openArchiveOutcomeModal(outcome, () => {
            this.drafts.discard(modal.session);
            modal.allowClose = true;
            modal.close();
          })
        }
      ],
      fields: [
        { key: "title", label: "\u9636\u6BB5\u6210\u679C", wide: true },
        { key: "acceptance", label: "\u9A8C\u6536\u6761\u4EF6", type: "textarea", wide: true },
        { key: "reason", label: "\u4FEE\u8BA2\u8BF4\u660E", wide: true }
      ],
      onSubmit: async (value, session) => this.mutate("outcome-revise", (draft) => reviseOutcome(draft, { outcomeId: outcome.id, ...value }), { expectedRevision: session.identity.baseRevision })
    }).open();
  }
};
