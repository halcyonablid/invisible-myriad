var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// state/verification_inputs/next-action-collection-return-20261002/stage/next-action-workbench/src/main.mjs
var main_exports = {};
__export(main_exports, {
  default: () => NextActionWorkbenchPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// state/verification_inputs/next-action-collection-return-20261002/stage/next-action-workbench/src/refresh-support.mjs
var Diagnostics = class {
  constructor() {
    this.events = [];
    this.bytes = 0;
    this.dropped = 0;
    this.until = 0;
    this.seq = 0;
  }
  start() {
    this.events = [];
    this.bytes = 0;
    this.dropped = 0;
    this.seq = 0;
    this.session = `s${Date.now().toString(36)}`;
    this.until = performance.now() + 6e4;
  }
  stop() {
    this.until = 0;
  }
  emit(phase, fields = {}) {
    if (!this.until || performance.now() > this.until) return;
    const event = { schemaVersion: 1, session: this.session, clockScope: "workbench-window", phase, mono: performance.now() };
    for (const key of ["trace", "work", "domain", "outcome", "count", "durationMs", "epoch", "complete", "shared", "stage"]) {
      const value = fields[key];
      if (typeof value === "number" || typeof value === "boolean") event[key] = value;
      else if (typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value)) event[key] = value;
    }
    const bytes = JSON.stringify(event).length * 2;
    while (this.events.length && (this.events.length >= 500 || this.bytes + bytes > 262144)) {
      this.bytes -= this.events.shift().bytes;
      this.dropped++;
    }
    if (bytes > 262144) {
      this.dropped++;
      return;
    }
    this.events.push({ event, bytes });
    this.bytes += bytes;
  }
  snapshot() {
    return { schemaVersion: 1, buildId: "naw-read-recovery-20261002", active: this.until > performance.now(), bytes: this.bytes, droppedEvents: this.dropped, events: this.events.map((x) => ({ ...x.event })) };
  }
};
var ReadCoordinator = class {
  constructor(diag = new Diagnostics()) {
    this.diag = diag;
    this.work = /* @__PURE__ */ new Map();
    this.providers = /* @__PURE__ */ new WeakMap();
    this.seq = 0;
    this.epoch = 0;
    this.closed = false;
    this.waiters = /* @__PURE__ */ new Set();
  }
  invalidate() {
    this.epoch++;
  }
  close() {
    this.closed = true;
    this.invalidate();
    for (const cancel of [...this.waiters]) cancel();
    this.diag.stop();
  }
  async read(provider, key, task, { timeout = 8e3, stage = "source", trace = "none" } = {}) {
    if (this.closed) throw Object.assign(new Error("\u63D2\u4EF6\u5DF2\u5173\u95ED"), { code: "READ_CLOSED" });
    if (!this.providers.has(provider)) this.providers.set(provider, ++this.seq);
    const identity = `${this.providers.get(provider)}:${key}`;
    let entry = this.work.get(identity);
    const shared = !!entry;
    if (!entry) {
      if (this.work.size >= 512) throw Object.assign(new Error("\u8BFB\u53D6\u961F\u5217\u5DF2\u6EE1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"), { code: "READ_CAPACITY" });
      entry = { epoch: this.epoch, id: `w${++this.seq}`, start: performance.now() };
      this.work.set(identity, entry);
      this.diag.emit("work-start", { work: entry.id, stage, trace, epoch: entry.epoch });
      entry.promise = Promise.resolve().then(task).then((value) => {
        this.diag.emit("work-end", { work: entry.id, stage, outcome: "resolved", durationMs: performance.now() - entry.start });
        return value;
      }, (error) => {
        this.diag.emit("work-end", { work: entry.id, stage, outcome: "rejected", durationMs: performance.now() - entry.start });
        throw error;
      }).finally(() => {
        if (this.work.get(identity) === entry) this.work.delete(identity);
      });
      entry.promise.catch(() => {
      });
    }
    this.diag.emit("wait-start", { work: entry.id, trace, stage, shared });
    let timer, cancel;
    try {
      const result = await Promise.race([entry.promise, new Promise((_, reject) => {
        cancel = () => reject(Object.assign(new Error("\u63D2\u4EF6\u5DF2\u5173\u95ED"), { code: "READ_CLOSED" }));
        this.waiters.add(cancel);
        timer = setTimeout(() => reject(Object.assign(new Error("\u8BFB\u53D6\u8D85\u65F6\uFF0C\u5E95\u5C42\u4EFB\u52A1\u53EF\u80FD\u4ECD\u5728\u8FD0\u884C"), { code: "READ_TIMEOUT" })), timeout);
      })]);
      if (this.closed || entry.epoch !== this.epoch) throw Object.assign(new Error("\u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u8BD5\u5237\u65B0"), { code: "READ_STALE" });
      this.diag.emit("wait-end", { work: entry.id, trace, stage, outcome: "resolved" });
      return result;
    } catch (error) {
      this.diag.emit("wait-end", { work: entry.id, trace, stage, outcome: error.code || "failed" });
      throw error;
    } finally {
      clearTimeout(timer);
      this.waiters.delete(cancel);
    }
  }
};
function snapshotFailure(snapshot, validation) {
  if (validation?.ok) return null;
  const gtdNotReady = (Array.isArray(snapshot?.diagnostics) ? snapshot.diagnostics.slice(0, 20) : []).some((d) => d?.code === "gtd-owner-not-ready" && d?.providerId === "gtd-task-manager" && ["engine-source-mismatch-or-not-ready", "engine-source-mismatch", "engine-api-not-ready"].includes(d?.reason));
  if (gtdNotReady) return { code: "gtd-owner-not-ready", stage: "qualification", reason: "GTD \u672A\u5C31\u7EEA\u6216\u6765\u6E90\u4E0D\u5339\u914D\uFF0C\u8BF7\u6253\u5F00\u5BF9\u5E94 GTD \u9875\u9762\u540E\u91CD\u65B0\u68C0\u67E5\uFF1B\u5F53\u524D\u672A\u6388\u6743\u5199\u5165" };
  const raw = snapshot?.reason || snapshot?.diagnostics?.[0]?.code || validation?.reason || "snapshot-malformed";
  const code = typeof raw === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(raw) ? raw : "snapshot-malformed";
  let category = "\u5FEB\u7167\u7ED3\u6784\u6216\u8EAB\u4EFD\u4E0D\u5339\u914D";
  if (/timeout/i.test(code)) category = "\u8D44\u683C\u8BFB\u53D6\u8D85\u65F6";
  else if (/torn|unstable/i.test(code)) category = "\u6765\u6E90\u6B63\u5728\u53D8\u5316\uFF0C\u672A\u53D6\u5F97\u7A33\u5B9A\u5FEB\u7167";
  else if (/unavailable|missing|not-ready/i.test(code)) category = "\u8D44\u683C\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA";
  else if (snapshot?.truncated || snapshot?.hasMore) category = "\u8D44\u683C\u5FEB\u7167\u88AB\u622A\u65AD";
  return { code, stage: "qualification", reason: `\u6709\u6548\u4E3B\u952E\u5FEB\u7167\u4E0D\u5B8C\u6574\uFF1A${category}\uFF08${code}\uFF09\uFF0C\u53EF\u91CD\u8BD5` };
}

// state/verification_inputs/next-action-collection-return-20261002/stage/next-action-workbench/src/name-editor-registry.mjs
var NameEditorRegistry = class {
  constructor() {
    this.activeByKey = /* @__PURE__ */ new Map();
    this.pendingFlushes = /* @__PURE__ */ new Set();
    this.closing = false;
  }
  admit(editor) {
    if (this.closing) return { status: "closing", editor: null };
    const existing = this.activeByKey.get(editor.editorKey);
    if (existing) return { status: existing.closing ? "saving" : "existing", editor: existing };
    this.activeByKey.set(editor.editorKey, editor);
    return { status: "admitted", editor };
  }
  trackClose(editor, flushPromise, onError) {
    editor.freezeEditor?.();
    const tracked = Promise.resolve(flushPromise).catch((error) => onError?.(error)).finally(() => {
      if (this.activeByKey.get(editor.editorKey) === editor) this.activeByKey.delete(editor.editorKey);
      this.pendingFlushes.delete(tracked);
    });
    this.pendingFlushes.add(tracked);
    return tracked;
  }
  async freezeAndDrain(onError) {
    this.closing = true;
    const active = Array.from(this.activeByKey.values());
    active.forEach((editor) => editor.freezeEditor?.());
    await Promise.all(active.filter((editor) => !editor.closing).map((editor) => Promise.resolve(editor.flushPending()).catch((error) => onError?.(editor, error))));
    while (this.pendingFlushes.size) {
      await Promise.all(Array.from(this.pendingFlushes));
    }
  }
};

// state/verification_inputs/next-action-collection-return-20261002/stage/next-action-workbench/src/store.mjs
var STORE_SCHEMA_VERSION = "next-action-workbench-store-v1";
var OBSERVATION_STATES = Object.freeze([
  "fresh-complete",
  "fresh-truncated",
  "provider-unavailable",
  "timeout",
  "malformed",
  "source-missing",
  "membership-inactive"
]);
var text = (value, fallback = "") => {
  const normalized = value == null ? "" : String(value).trim();
  return normalized || fallback;
};
var clone = (value) => {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};
var object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var encode = (value) => encodeURIComponent(text(value));
var unique = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean)));
var keywordCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
function normalizeKeywordLabel(value) {
  return text(value).replace(/\s+/g, " ");
}
function compareAlphabetical(left, right) {
  const a = normalizeKeywordLabel(left?.label ?? left);
  const b = normalizeKeywordLabel(right?.label ?? right);
  return keywordCollator.compare(a, b) || a.localeCompare(b, "zh-CN");
}
function keywordLabelKey(value) {
  return normalizeKeywordLabel(value).toLocaleLowerCase();
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function createEmptyStore() {
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    revision: 0,
    memberships: {},
    sourceCards: {},
    membershipSourceLinks: {},
    sourceAliases: {},
    sourceTags: {},
    keywords: {},
    membershipKeywords: {},
    ontologies: {},
    recoveryDrafts: {},
    recoveryAuthorities: {},
    reservedIds: {
      memberships: [],
      sourceCards: [],
      links: [],
      keywords: [],
      ontologies: []
    },
    uiState: {
      selectedMembershipId: "all",
      selectedDomain: "goal",
      selectedMembershipIdByDomain: {
        goal: "all",
        project: "all"
      },
      selectedKeywordIdByDomain: {
        goal: "all",
        project: "all"
      },
      search: "",
      statusFilter: "all",
      collapsedMemberships: []
    },
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}
function normalizePrimaryRef(value = {}) {
  const providerId = text(value.providerId || value.sourcePlugin, "mandala-time-blocks");
  const domain = text(value.domain || value.sourceType);
  const sourceScope = text(value.sourceScope || value.sourceNotePath);
  const sourceKey = text(value.sourceKey || value.sourceId || value.nodeId);
  const identityVersion = Math.max(1, Number(value.identityVersion) || 1);
  if (!providerId || !["goal", "project"].includes(domain) || !sourceScope || !sourceKey) {
    throw new Error("\u4E3B\u952E\u8EAB\u4EFD\u7F3A\u5C11 provider/domain/sourceScope/sourceKey");
  }
  return { providerId, domain, sourceScope, sourceKey, identityVersion };
}
function buildMembershipId(primaryRef) {
  const ref = normalizePrimaryRef(primaryRef);
  return `membership::${[ref.providerId, ref.domain, ref.sourceScope, ref.sourceKey, `v${ref.identityVersion}`].map(encode).join("::")}`;
}
function buildSourceCardId(nodeKey) {
  const key = text(nodeKey);
  if (!key) throw new Error("Collection Card \u7F3A\u5C11 nodeKey");
  return `source-card::collection-card-view::${encode(key)}`;
}
function buildLinkId(membershipId, sourceCardId) {
  return `link::${encode(membershipId)}::${encode(sourceCardId)}`;
}
function reserve(store, bucket, id) {
  const values = new Set(store.reservedIds[bucket] || []);
  values.add(id);
  store.reservedIds[bucket] = Array.from(values);
}
function normalizeStore(value = {}) {
  const base = createEmptyStore();
  const source = object(value);
  const sourceUiState = object(source.uiState);
  const sourceDomainSelections = object(sourceUiState.selectedMembershipIdByDomain);
  const sourceKeywordSelections = object(sourceUiState.selectedKeywordIdByDomain);
  const store = Object.assign({}, base, source, {
    schemaVersion: STORE_SCHEMA_VERSION,
    revision: Math.max(0, Number(source.revision) || 0),
    memberships: clone(object(source.memberships)),
    sourceCards: clone(object(source.sourceCards)),
    membershipSourceLinks: clone(object(source.membershipSourceLinks)),
    sourceAliases: clone(object(source.sourceAliases)),
    sourceTags: clone(object(source.sourceTags)),
    keywords: clone(object(source.keywords)),
    membershipKeywords: clone(object(source.membershipKeywords)),
    ontologies: clone(object(source.ontologies)),
    recoveryDrafts: clone(object(source.recoveryDrafts)),
    recoveryAuthorities: clone(object(source.recoveryAuthorities)),
    reservedIds: Object.assign({}, base.reservedIds, clone(object(source.reservedIds))),
    uiState: Object.assign({}, base.uiState, clone(sourceUiState), {
      selectedMembershipIdByDomain: Object.assign({}, base.uiState.selectedMembershipIdByDomain, clone(sourceDomainSelections)),
      selectedKeywordIdByDomain: Object.assign({}, base.uiState.selectedKeywordIdByDomain, clone(sourceKeywordSelections))
    })
  });
  const legacySelection = text(store.uiState.selectedMembershipId, "all");
  const legacyDomain = text(store.memberships?.[legacySelection]?.primaryRef?.domain);
  const explicitDomain = text(sourceUiState.selectedDomain);
  store.uiState.selectedDomain = ["goal", "project"].includes(explicitDomain) ? explicitDomain : ["goal", "project"].includes(legacyDomain) ? legacyDomain : "goal";
  if (["goal", "project"].includes(legacyDomain) && !Object.prototype.hasOwnProperty.call(sourceDomainSelections, legacyDomain)) {
    store.uiState.selectedMembershipIdByDomain[legacyDomain] = legacySelection;
  }
  ["goal", "project"].forEach((domain) => {
    store.uiState.selectedMembershipIdByDomain[domain] = text(store.uiState.selectedMembershipIdByDomain[domain], "all");
    store.uiState.selectedKeywordIdByDomain[domain] = text(store.uiState.selectedKeywordIdByDomain[domain], "all");
  });
  const historicalKeywordIds = Object.keys(store.keywords);
  historicalKeywordIds.forEach((id) => {
    const keyword = object(store.keywords[id]);
    const label = normalizeKeywordLabel(keyword.label);
    store.keywords[id] = Object.assign({}, keyword, { id, label, createdAt: text(keyword.createdAt, store.createdAt), updatedAt: text(keyword.updatedAt, store.updatedAt) });
  });
  Object.keys(store.membershipKeywords).forEach((membershipId) => {
    const firstValidId = unique(store.membershipKeywords[membershipId]).find((id) => Boolean(normalizeKeywordLabel(store.keywords[id]?.label)));
    store.membershipKeywords[membershipId] = firstValidId ? [firstValidId] : [];
  });
  Object.keys(store.membershipSourceLinks).forEach((linkId) => {
    const link = object(store.membershipSourceLinks[linkId]);
    store.membershipSourceLinks[linkId] = Object.assign({}, link, { completedAt: text(link.completedAt) });
  });
  Object.keys(store.sourceAliases).forEach((linkId) => {
    const raw = store.sourceAliases[linkId];
    const alias = typeof raw === "string" ? { label: raw } : object(raw);
    store.sourceAliases[linkId] = {
      linkId,
      label: normalizeKeywordLabel(alias.label),
      updatedAt: text(alias.updatedAt, store.updatedAt)
    };
  });
  Object.keys(store.sourceTags).forEach((linkId) => {
    const labels = normalizeActionTags(object(store.sourceTags[linkId]).labels);
    if (labels.length) store.sourceTags[linkId] = { linkId, labels, updatedAt: text(store.sourceTags[linkId].updatedAt, store.updatedAt) };
    else delete store.sourceTags[linkId];
  });
  Object.keys(store.reservedIds).forEach((key) => {
    store.reservedIds[key] = unique(store.reservedIds[key]);
  });
  store.reservedIds.keywords = unique([...store.reservedIds.keywords, ...historicalKeywordIds]);
  return store;
}
function migrateStore(raw) {
  if (raw == null || object(raw).schemaVersion == null && Object.keys(object(raw)).length === 0) {
    return { ok: true, readOnly: false, store: createEmptyStore(), migratedFrom: "empty" };
  }
  const version = text(raw?.schemaVersion);
  if (!version || version === "0" || version === "next-action-workbench-store-v0") {
    return { ok: true, readOnly: false, store: normalizeStore(raw), migratedFrom: version || "v0" };
  }
  if (version !== STORE_SCHEMA_VERSION) {
    return {
      ok: false,
      readOnly: true,
      reason: `\u4E0D\u652F\u6301\u7684\u6570\u636E\u7248\u672C\uFF1A${version}`,
      raw: clone(raw),
      store: normalizeStore(createEmptyStore())
    };
  }
  return { ok: true, readOnly: false, store: normalizeStore(raw), migratedFrom: "current" };
}
function targetAliasSet(target = {}) {
  return new Set(unique([
    target.sourceKey,
    target.sourceId,
    target.nodeId,
    target.externalKey,
    ...Array.isArray(target.aliases) ? target.aliases : []
  ]));
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
function resolveActiveTargets(mandalaSnapshot, options = {}) {
  const domain = text(options.domain, "project");
  const expectedType = domain === "goal" ? "mandala-effective-goal-operational-context-keys-v1" : "mandala-effective-operational-context-keys-v1";
  const snapshotTargets = Array.isArray(mandalaSnapshot?.targets) ? mandalaSnapshot.targets : null;
  const count = Number(mandalaSnapshot?.count);
  const returnedCount = Number(mandalaSnapshot?.returnedCount);
  const totalCount = Number(mandalaSnapshot?.totalCount);
  const limit = Number(mandalaSnapshot?.limit);
  const generatedAt = text(mandalaSnapshot?.generatedAt);
  const sourceScope = text(mandalaSnapshot?.sourceScope);
  const sourceNotePath = text(mandalaSnapshot?.sourceNotePath);
  if (mandalaSnapshot?.ok !== true || mandalaSnapshot?.complete !== true || Number(mandalaSnapshot?.contractVersion) !== 1 || text(mandalaSnapshot?.snapshotType) !== expectedType || mandalaSnapshot?.truncated === true || mandalaSnapshot?.hasMore === true || !snapshotTargets || count !== snapshotTargets.length || returnedCount !== snapshotTargets.length || !Number.isInteger(totalCount) || totalCount < count || !Number.isInteger(limit) || limit < totalCount || limit > 500 || !text(mandalaSnapshot?.revision) || !text(mandalaSnapshot?.providerGeneration || mandalaSnapshot?.instanceId) || !generatedAt || !Number.isFinite(Date.parse(generatedAt)) || !sourceScope || sourceScope !== sourceNotePath || !Array.isArray(mandalaSnapshot?.diagnostics)) {
    return { ok: false, reason: "mandala-snapshot-malformed", targets: [] };
  }
  const seen = /* @__PURE__ */ new Set();
  const targets = [];
  try {
    snapshotTargets.forEach((target) => {
      const sourceKey = text(target?.sourceKey);
      const aliases = Array.isArray(target?.aliases) ? target.aliases.map((value) => text(value)) : [];
      const contextKey = target?.contextKey;
      if (text(target?.sourcePlugin) !== "mandala-time-blocks" || text(target?.domain) !== domain || text(target?.sourceType) !== domain || text(target?.sourceScope) !== sourceScope || text(target?.sourceNotePath) !== sourceNotePath || Number(target?.identityVersion) !== 1 || !(domain === "goal" ? isMandalaGoalJumpNodeKey(sourceKey) : isWorkspaceJumpNodeKey(sourceKey)) || text(target?.sourceId) !== sourceKey || text(target?.nodeId) !== sourceKey || text(target?.status) !== "active" || target?.active !== true || text(target?.lifecycleState) !== "active" || !text(target?.label) || !text(target?.pathLabel) || !Number.isFinite(Number(target?.order)) || aliases.length === 0 || aliases.some((alias) => !alias) || new Set(aliases).size !== aliases.length || !aliases.includes(sourceKey) || !contextKey || !text(contextKey?.contextKeyId) || !text(contextKey?.address) || !text(contextKey?.canonicalLabel) || !text(contextKey?.displayLabel) || text(target?.evidenceRevision) !== text(mandalaSnapshot?.revision)) throw new Error("effective-operational-context-target-malformed");
      const ref = normalizePrimaryRef(target);
      const membershipId = buildMembershipId(ref);
      if (seen.has(sourceKey) || seen.has(membershipId)) throw new Error("effective-operational-context-owner-duplicate");
      seen.add(sourceKey);
      seen.add(membershipId);
      targets.push({
        membershipId,
        primaryRef: ref,
        contextKey: clone(contextKey),
        providerGeneration: text(mandalaSnapshot.providerGeneration || mandalaSnapshot.instanceId),
        primaryAliases: Array.from(targetAliasSet(target)),
        label: text(target?.label, ref.sourceKey),
        pathLabel: text(target?.pathLabel, ref.sourceKey),
        order: Number(target?.order),
        eligibilityRevision: text(mandalaSnapshot.revision),
        eligibilityObservedAt: generatedAt,
        ineligibilityReasons: []
      });
    });
  } catch (_) {
    return { ok: false, reason: "mandala-snapshot-malformed", targets: [] };
  }
  targets.sort((left, right) => left.primaryRef.domain.localeCompare(right.primaryRef.domain) || left.order - right.order || left.label.localeCompare(right.label, "zh-CN"));
  return { ok: true, revision: text(mandalaSnapshot.revision), targets };
}
function importTargets(storeValue, targets = [], timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  targets.forEach((target) => {
    const primaryRef = normalizePrimaryRef(target.primaryRef || target);
    const id = target.membershipId || buildMembershipId(primaryRef);
    const previous = store.memberships[id];
    store.memberships[id] = Object.assign({}, previous || {}, {
      id,
      primaryRef,
      primaryAliases: unique(target.primaryAliases || [primaryRef.sourceKey]),
      lastKnownLabel: text(target.label || target.lastKnownLabel, primaryRef.sourceKey),
      pathLabel: text(target.pathLabel || target.label, primaryRef.sourceKey),
      contextKeys: unique(previous?.contextKeys),
      active: true,
      lifecycleState: "active",
      ineligibilityReasons: [],
      eligibilityRevision: text(target.eligibilityRevision, text(previous?.eligibilityRevision)),
      eligibilityObservedAt: text(target.eligibilityObservedAt, timestamp),
      importedAt: text(previous?.importedAt, timestamp),
      revokedAt: "",
      lastObservedAt: timestamp,
      order: Number.isFinite(Number(target.order)) ? Number(target.order) : Number(previous?.order) || 0
    });
    reserve(store, "memberships", id);
  });
  return store;
}
function allocateKeywordId(store, membershipId, label, timestamp) {
  const base = `keyword::${encode(membershipId)}::${encode(label)}::${encode(timestamp)}`;
  const reserved = new Set(store.reservedIds.keywords || []);
  let id = base;
  let suffix = 2;
  while (reserved.has(id) || store.keywords[id]) id = `${base}::${suffix++}`;
  return id;
}
function createLocalName(store, membershipId, label, timestamp) {
  const normalized = normalizeKeywordLabel(label);
  if (!normalized) return "";
  const id = allocateKeywordId(store, membershipId, normalized, timestamp);
  store.keywords[id] = { id, label: normalized, createdAt: timestamp, updatedAt: timestamp };
  reserve(store, "keywords", id);
  return id;
}
function setMembershipLocalName(storeValue, membershipId, label, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  if (!store.memberships[membershipId]) throw new Error("\u672A\u77E5\u4E3B\u952E\uFF0C\u65E0\u6CD5\u8BBE\u7F6E\u884C\u52A8\u53F0\u540D\u79F0\u3002");
  const normalized = normalizeKeywordLabel(label);
  if (!normalized) return clearMembershipLocalName(store, membershipId);
  const currentId = getMembershipKeywordIds(store, membershipId)[0] || "";
  if (currentId && keywordLabelKey(store.keywords[currentId]?.label) === keywordLabelKey(normalized)) return store;
  const keywordId = createLocalName(store, membershipId, normalized, timestamp);
  store.membershipKeywords[membershipId] = [keywordId];
  return store;
}
function clearMembershipLocalName(storeValue, membershipId) {
  const store = normalizeStore(storeValue);
  store.membershipKeywords[membershipId] = [];
  return store;
}
function getMembershipKeywordIds(storeValue, membershipId) {
  const store = normalizeStore(storeValue);
  return unique(store.membershipKeywords[membershipId]).filter((id) => Boolean(normalizeKeywordLabel(store.keywords[id]?.label)));
}
function getMembershipKeywordLabels(storeValue, membershipId) {
  const store = normalizeStore(storeValue);
  return getMembershipKeywordIds(store, membershipId).map((id) => store.keywords[id]).sort(compareAlphabetical).map((keyword) => keyword.label);
}
function getMembershipLocalName(storeValue, membershipId) {
  return getMembershipKeywordLabels(storeValue, membershipId)[0] || "";
}
function getMembershipDisplayName(storeValue, membership) {
  return getMembershipLocalName(storeValue, membership?.id) || text(membership?.lastKnownLabel, membership?.id);
}
function sortMembershipsByLocalName(storeValue, memberships = []) {
  const store = normalizeStore(storeValue);
  return memberships.slice().sort((left, right) => {
    const displayOrder = compareAlphabetical(getMembershipDisplayName(store, left), getMembershipDisplayName(store, right));
    if (displayOrder) return displayOrder;
    return compareAlphabetical(left.lastKnownLabel, right.lastKnownLabel) || String(left.id).localeCompare(String(right.id));
  });
}
function updateMembershipLifecycle(storeValue, activeTargets = [], observationOk = true, timestamp = nowIso(), options = {}) {
  const store = normalizeStore(storeValue);
  if (!observationOk) return store;
  const activeById = new Map((Array.isArray(activeTargets) ? activeTargets : []).map((entry) => typeof entry === "string" ? [entry, null] : [text(entry?.membershipId || entry?.id), entry]).filter(([id]) => id));
  const eligibilityRevision = text(options?.eligibilityRevision);
  const selectedIds = Array.isArray(options.membershipIds) ? new Set(options.membershipIds) : null;
  Object.values(store.memberships).forEach((membership) => {
    if (membership.revokedAt || options.domain && membership.primaryRef.domain !== options.domain || selectedIds && !selectedIds.has(membership.id)) return;
    const activeTarget = activeById.get(membership.id);
    membership.active = activeById.has(membership.id);
    membership.lifecycleState = membership.active ? "active" : "membership-inactive";
    membership.lastObservedAt = timestamp;
    membership.eligibilityObservedAt = timestamp;
    membership.eligibilityRevision = text(activeTarget?.eligibilityRevision, eligibilityRevision || text(membership.eligibilityRevision));
    membership.ineligibilityReasons = membership.active ? [] : ["not-in-effective-operational-context-snapshot"];
    if (!membership.active) {
      Object.values(store.membershipSourceLinks).filter((link) => link.membershipId === membership.id).forEach((link) => {
        link.observationState = "membership-inactive";
        link.lastObservedAt = timestamp;
      });
    }
  });
  return store;
}
function projectSourceCard(item = {}, timestamp = nowIso()) {
  const nodeKey = text(item.nodeKey);
  const id = buildSourceCardId(nodeKey);
  return {
    id,
    providerId: "collection-card-view",
    nodeKey,
    label: text(item.label, nodeKey),
    pathLabel: text(item.pathLabel || item.label, nodeKey),
    notePath: text(item.notePath),
    viewType: text(item.viewType, "collection-card-view"),
    carrierId: text(item.carrierId),
    carrierLabel: text(item.carrierLabel),
    depth: Math.max(0, Number(item.depth) || 0),
    order: Math.max(0, Number(item.order) || 0),
    orderPath: Array.isArray(item.orderPath) ? item.orderPath.map((value) => Number(value) || 0) : [],
    providerRevision: text(item.providerRevision),
    firstSeenAt: timestamp,
    lastSeenAt: timestamp
  };
}
function applySourceBucket(storeValue, membershipId, bucket, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const membership = store.memberships[membershipId];
  if (!membership) throw new Error(`\u672A\u77E5\u4E3B\u952E\u5F52\u5C5E\uFF1A${membershipId}`);
  if (bucket?.ok !== true || !Array.isArray(bucket?.items)) {
    return markMembershipObservation(store, membershipId, text(bucket?.observationState, "malformed"), timestamp);
  }
  const truncated = bucket.truncated === true || bucket.hasMore === true || Number(bucket.returnedCount || bucket.items.length) < Number(bucket.totalCount || bucket.items.length);
  const state = truncated ? "fresh-truncated" : "fresh-complete";
  const seenSourceIds = /* @__PURE__ */ new Set();
  bucket.items.forEach((item) => {
    if (!text(item?.nodeKey)) return;
    const projected = projectSourceCard(Object.assign({}, item, { providerRevision: bucket.revision }), timestamp);
    const previous = store.sourceCards[projected.id];
    store.sourceCards[projected.id] = Object.assign({}, previous || {}, projected, {
      firstSeenAt: text(previous?.firstSeenAt, timestamp),
      lastSeenAt: timestamp
    });
    const linkId = buildLinkId(membershipId, projected.id);
    const previousLink = store.membershipSourceLinks[linkId];
    store.membershipSourceLinks[linkId] = {
      id: linkId,
      membershipId,
      sourceCardId: projected.id,
      contextKey: text(item.contextKey || item.carrierLabel || item.carrierId),
      observationState: state,
      firstSeenAt: text(previousLink?.firstSeenAt, timestamp),
      lastObservedAt: timestamp,
      sourceMissingAt: "",
      completedAt: text(previousLink?.completedAt)
    };
    if (!store.ontologies[projected.id]) {
      store.ontologies[projected.id] = {
        id: `ontology::${encode(projected.id)}`,
        sourceCardId: projected.id,
        revision: 0,
        formalOntology: null,
        hash: "",
        createdAt: timestamp,
        updatedAt: timestamp
      };
      reserve(store, "ontologies", store.ontologies[projected.id].id);
    }
    reserve(store, "sourceCards", projected.id);
    reserve(store, "links", linkId);
    seenSourceIds.add(projected.id);
  });
  if (!truncated) {
    Object.values(store.membershipSourceLinks).filter((link) => link.membershipId === membershipId && !seenSourceIds.has(link.sourceCardId)).forEach((link) => {
      link.observationState = "source-missing";
      link.lastObservedAt = timestamp;
      link.sourceMissingAt = text(link.sourceMissingAt, timestamp);
    });
  }
  membership.lastSourceObservation = state;
  membership.lastSourceCount = Number(bucket.returnedCount ?? bucket.items.length) || 0;
  membership.lastSourceTotal = Number(bucket.totalCount ?? bucket.items.length) || 0;
  membership.lastObservedAt = timestamp;
  return store;
}
function markMembershipObservation(storeValue, membershipId, state, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const normalized = OBSERVATION_STATES.includes(state) ? state : "malformed";
  const membership = store.memberships[membershipId];
  if (!membership) return store;
  membership.lastSourceObservation = normalized;
  membership.lastObservedAt = timestamp;
  Object.values(store.membershipSourceLinks).filter((link) => link.membershipId === membershipId).forEach((link) => {
    link.observationState = normalized;
    link.lastObservedAt = timestamp;
  });
  return store;
}
function setMembershipSourceCompletion(storeValue, membershipId, sourceCardId, completed, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const link = Object.values(store.membershipSourceLinks).find((item) => item.membershipId === membershipId && item.sourceCardId === sourceCardId);
  if (!link) throw new Error("\u672A\u627E\u5230\u8BE5\u4E3B\u952E\u4E0B\u7684\u4E0B\u4E00\u6B65\u5F85\u529E\u6761\u76EE\u3002");
  link.completedAt = completed ? timestamp : "";
  return store;
}
function getSourceAliasRecord(store, membershipId, sourceCardId) {
  return store.sourceAliases[buildLinkId(membershipId, sourceCardId)] || null;
}
function getMembershipSourceAlias(storeValue, membershipId, sourceCardId) {
  const store = normalizeStore(storeValue);
  return normalizeKeywordLabel(getSourceAliasRecord(store, membershipId, sourceCardId)?.label);
}
function setMembershipSourceAlias(storeValue, membershipId, sourceCardId, label, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const linkId = buildLinkId(membershipId, sourceCardId);
  if (!store.membershipSourceLinks[linkId]) throw new Error("\u672A\u627E\u5230\u8BE5\u4E3B\u952E\u4E0B\u7684\u4E0B\u4E00\u6B65\u5F85\u529E\u6761\u76EE\u3002");
  store.sourceAliases[linkId] = {
    linkId,
    label: normalizeKeywordLabel(label),
    updatedAt: timestamp
  };
  return store;
}
var ACTION_TAG_LIMIT = 12;
var ACTION_TAG_LENGTH = 32;
function normalizeActionTag(value) {
  return normalizeKeywordLabel(value).replace(/^#+/, "").trim().slice(0, ACTION_TAG_LENGTH).trim();
}
function normalizeActionTags(values) {
  const seen = /* @__PURE__ */ new Set(), labels = [];
  for (const value of Array.isArray(values) ? values : []) {
    const label = normalizeActionTag(value), key = label.toLocaleLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels.slice(0, ACTION_TAG_LIMIT);
}
function setMembershipSourceTags(storeValue, membershipId, sourceCardId, values, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const linkId = buildLinkId(membershipId, sourceCardId);
  if (!store.membershipSourceLinks[linkId]) throw new Error("未找到该主键下的下一步待办条目。");
  const labels = normalizeActionTags(values);
  if (labels.length) store.sourceTags[linkId] = { linkId, labels, updatedAt: timestamp };
  else delete store.sourceTags[linkId];
  return store;
}
function getSourceDisplayName(store, link) {
  const card = store.sourceCards[link.sourceCardId] || {};
  return normalizeKeywordLabel(store.sourceAliases[link.id]?.label) || text(card.label || card.nodeKey, link.sourceCardId);
}
function getMembershipSourceDisplayName(storeValue, link) {
  return getSourceDisplayName(normalizeStore(storeValue), link);
}
function compareNumberPaths(left = [], right = []) {
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  const sharedLength = Math.min(a.length, b.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const difference = (Number(a[index]) || 0) - (Number(b[index]) || 0);
    if (difference) return difference;
  }
  return a.length - b.length;
}
function compareSourceLinks(store, left, right) {
  const a = store.sourceCards[left.sourceCardId] || {};
  const b = store.sourceCards[right.sourceCardId] || {};
  return compareAlphabetical(getSourceDisplayName(store, left), getSourceDisplayName(store, right)) || compareAlphabetical(a.label || a.nodeKey, b.label || b.nodeKey) || compareNumberPaths(a.orderPath, b.orderPath) || (Number(a.order) || 0) - (Number(b.order) || 0) || String(left.sourceCardId).localeCompare(String(right.sourceCardId)) || String(left.id).localeCompare(String(right.id));
}
function getMembershipLinks(storeValue, membershipId) {
  const store = normalizeStore(storeValue);
  return Object.values(store.membershipSourceLinks).filter((link) => link.membershipId === membershipId).sort((left, right) => compareSourceLinks(store, left, right));
}
function aggregateSourceObservation(storeValue, sourceCardId) {
  const states = Object.values(normalizeStore(storeValue).membershipSourceLinks).filter((link) => link.sourceCardId === sourceCardId).map((link) => link.observationState);
  if (states.includes("fresh-complete")) return "fresh-complete";
  if (states.includes("fresh-truncated")) return "fresh-truncated";
  if (states.includes("membership-inactive")) return "membership-inactive";
  if (states.includes("provider-unavailable")) return "provider-unavailable";
  if (states.includes("timeout")) return "timeout";
  if (states.includes("malformed")) return "malformed";
  return states.includes("source-missing") ? "source-missing" : "malformed";
}
function assertRecoveryAuthority(authority = {}, session = {}, revision = 0, action = "write") {
  const incomingGeneration = Number(session.generation) || 0;
  const incomingSessionId = text(session.sessionId);
  const incomingRevision = Math.max(0, Number(revision) || 0);
  const currentGeneration = Number(authority.generation) || 0;
  const currentSessionId = text(authority.sessionId);
  const currentRevision = Math.max(0, Number(authority.lastDraftRevision) || 0);
  const stale = incomingGeneration < currentGeneration || incomingGeneration === currentGeneration && currentSessionId && incomingSessionId !== currentSessionId || incomingGeneration === currentGeneration && incomingSessionId === currentSessionId && incomingRevision <= currentRevision;
  if (!incomingSessionId || !incomingGeneration || stale) {
    const error = new Error(`\u65E7 Ontology \u4F1A\u8BDD\u4E0D\u80FD${action === "clear" ? "\u6E05\u9664" : "\u8986\u76D6"}\u5F53\u524D\u6062\u590D\u8349\u7A3F\u3002`);
    error.code = "ONTOLOGY_RECOVERY_STALE";
    throw error;
  }
  return { incomingGeneration, incomingSessionId, incomingRevision };
}
function persistRecoveryDraft(storeValue, ownerKey, record, draftRevision, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const key = text(ownerKey);
  if (!key || !object(record).draft) throw new Error("Ontology \u6062\u590D\u8349\u7A3F\u65E0\u6548\u3002");
  const authority = store.recoveryAuthorities[key] || {};
  const admitted = assertRecoveryAuthority(authority, record, draftRevision, "write");
  store.recoveryAuthorities[key] = {
    generation: admitted.incomingGeneration,
    sessionId: admitted.incomingSessionId,
    lastDraftRevision: admitted.incomingRevision,
    cleared: false,
    updatedAt: timestamp
  };
  store.recoveryDrafts[key] = {
    version: 1,
    ownerKey: key,
    draftRevision: admitted.incomingRevision,
    record: clone(record),
    updatedAt: timestamp
  };
  return store;
}
function clearRecoveryDraft(storeValue, ownerKey, session, draftRevision, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  const key = text(ownerKey);
  const authority = store.recoveryAuthorities[key] || {};
  const admitted = assertRecoveryAuthority(authority, session, draftRevision, "clear");
  delete store.recoveryDrafts[key];
  store.recoveryAuthorities[key] = {
    generation: admitted.incomingGeneration,
    sessionId: admitted.incomingSessionId,
    lastDraftRevision: admitted.incomingRevision,
    cleared: true,
    updatedAt: timestamp
  };
  return store;
}
function finalizeStore(storeValue, timestamp = nowIso()) {
  const store = normalizeStore(storeValue);
  store.revision = Math.max(0, Number(store.revision) || 0) + 1;
  store.updatedAt = timestamp;
  return store;
}

// state/verification_inputs/next-action-collection-return-20261002/stage/next-action-workbench/src/main.mjs
var PLUGIN_ID = "next-action-workbench";
var VIEW_TYPE = "next-action-workbench-view";
var ONTOLOGY_OWNER_NAMESPACE = "next-action-workbench.source-card";
var statusLabels = {
  "fresh-complete": "\u6765\u6E90\u6B63\u5E38",
  "fresh-truncated": "\u6765\u6E90\u8F83\u591A\uFF0C\u5F53\u524D\u4E3A\u524D 200 \u6761",
  "provider-unavailable": "\u6765\u6E90\u63D2\u4EF6\u672A\u5C31\u7EEA",
  timeout: "\u6765\u6E90\u8BFB\u53D6\u8D85\u65F6",
  malformed: "\u6765\u6E90\u54CD\u5E94\u5F02\u5E38",
  "source-missing": "\u6765\u6E90\u5DF2\u5931\u8054",
  "membership-inactive": "\u4E3B\u952E\u5DF2\u975E\u6709\u6548\u4E3B\u952E"
};
function iconButton(parent, icon, label, handler, className = "") {
  const button = parent.createEl("button", {
    cls: `naw-icon-button ${className}`.trim(),
    attr: { type: "button", title: label, "aria-label": label }
  });
  (0, import_obsidian.setIcon)(button, icon);
  button.onclick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await handler(event);
  };
  return button;
}
function commandButton(parent, icon, label, handler, className = "") {
  const button = parent.createEl("button", {
    cls: `naw-command-button ${className}`.trim(),
    attr: { type: "button", title: label }
  });
  (0, import_obsidian.setIcon)(button, icon);
  button.createSpan({ text: label });
  button.onclick = async (event) => {
    event.preventDefault();
    await handler(event);
  };
  return button;
}
var ConfirmModal = class extends import_obsidian.Modal {
  constructor(app, { title, message, confirmLabel = "\u786E\u8BA4", onConfirm }) {
    super(app);
    this.config = { title, message, confirmLabel, onConfirm };
  }
  onOpen() {
    this.contentEl.addClass("naw-confirm-modal");
    this.contentEl.createEl("h3", { text: this.config.title });
    this.contentEl.createDiv({ cls: "naw-confirm-message", text: this.config.message });
    const actions = this.contentEl.createDiv({ cls: "naw-modal-actions" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88" });
    cancel.onclick = () => this.close();
    const confirm = actions.createEl("button", { text: this.config.confirmLabel, cls: "mod-warning" });
    confirm.onclick = async () => {
      confirm.disabled = true;
      try {
        await this.config.onConfirm?.();
        this.close();
      } finally {
        confirm.disabled = false;
      }
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
var CreateActionModal = class extends import_obsidian.Modal {
  constructor(app, plugin, membership) {
    super(app);
    this.plugin = plugin;
    this.membership = membership;
    this.draft = clone(plugin.store.newActionDrafts?.[membership.id]) || { requestId: crypto.randomUUID(), title: "", destination: null, attempted: false };
    this.pending = Promise.resolve();
  }
  async saveDraft() {
    const value = clone(this.draft);
    this.pending = this.plugin.mutateStore("new-action-draft", (latest) => {
      latest.newActionDrafts ||= {};
      latest.newActionDrafts[this.membership.id] = value;
      return latest;
    }, { render: false });
    await this.pending;
  }
  onOpen() {
    this.closed = false;
    this.contentEl.createEl("h3", { text: "\u65B0\u589E\u4E0B\u4E00\u6B65\u5F85\u529E" });
    this.contentEl.createDiv({ text: `\u5F53\u524D\u4E3B\u952E\uFF1A${this.membership.lastKnownLabel}` });
    this.status = this.contentEl.createDiv({ text: "\u6B63\u5728\u786E\u8BA4\u5199\u5165\u4F4D\u7F6E\u2026" });
    this.input = this.contentEl.createEl("textarea", { attr: { rows: "3", placeholder: "\u4E0B\u4E00\u6B65\u8981\u505A\u4EC0\u4E48\uFF1F", style: "width:100%" } });
    this.input.value = this.draft.title;
    this.input.disabled = this.draft.attempted;
    this.input.oninput = () => {
      this.draft.title = this.input.value;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        void this.saveDraft().catch(() => new import_obsidian.Notice("\u8349\u7A3F\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u4FDD\u7559\u7F16\u8F91\u7A97\u53E3"));
      }, 300);
    };
    const actions = this.contentEl.createDiv({ cls: "naw-modal-actions" });
    const close = actions.createEl("button", { text: "\u4FDD\u7559\u8349\u7A3F\u5E76\u5173\u95ED" });
    close.onclick = () => this.close();
    this.retry = actions.createEl("button", { text: "\u91CD\u65B0\u68C0\u67E5\u5199\u5165\u4F4D\u7F6E" });
    this.retry.onclick = () => {
      void this.prepare();
    };
    this.submit = actions.createEl("button", { text: this.draft.attempted ? "\u786E\u8BA4\u4E0A\u6B21\u4FDD\u5B58 / \u91CD\u8BD5" : "\u521B\u5EFA\u5E76\u7559\u5728\u884C\u52A8\u53F0", cls: "mod-cta" });
    this.submit.disabled = true;
    this.submit.onclick = () => {
      this.commitPromise = this.commit();
    };
    void this.prepare();
    this.input.focus();
  }
  async prepare(confirmedNotWritten = false) {
    if (this.committed || this.busy && !confirmedNotWritten || this.preparing || this.closed || this.plugin.closing) return;
    this.preparing = true;
    const generation = this.prepareGeneration = (this.prepareGeneration || 0) + 1;
    this.submit.disabled = true;
    this.retry.disabled = true;
    if (!this.draft.attempted) this.draft.destination = null;
    this.status.setText("\u6B63\u5728\u786E\u8BA4\u5199\u5165\u4F4D\u7F6E\u2026");
    try {
      const api = this.plugin.collectionApi();
      if (!api?.prepareOperationalRootItem || !api?.createOperationalRootItem) throw new Error("\u8BF7\u5148\u66F4\u65B0 Collection Card \u63D2\u4EF6\u4EE5\u652F\u6301\u65B0\u589E\u5F85\u529E");
      if (!this.draft.attempted) {
        const result = await api.prepareOperationalRootItem({ domain: this.membership.primaryRef.domain, primaryNodeKey: this.membership.primaryRef.sourceKey, sourceScope: this.membership.primaryRef.sourceScope });
        if (generation !== this.prepareGeneration || this.closed || this.plugin.closing) return;
        if (!result?.ok) throw new Error(result?.reason || "\u65E0\u6CD5\u786E\u8BA4\u76EE\u6807 Tab");
        this.draft.destination = result;
      }
      if (!this.draft.destination) throw new Error("\u4E0A\u6B21\u8BF7\u6C42\u7F3A\u5C11\u5199\u5165\u4F4D\u7F6E\uFF0C\u8BF7\u4FDD\u7559\u8349\u7A3F\u5E76\u91CD\u65B0\u6253\u5F00");
      this.status.setText(`\u5199\u5165 Collection Card\uFF1A${this.draft.destination.tabName}\uFF08${this.draft.destination.contextLabel}\uFF09`);
      this.submit.disabled = false;
    } catch (error) {
      if (!this.closed && !this.plugin.closing) this.status.setText(error.message);
    } finally {
      this.preparing = false;
      this.retry.disabled = false;
    }
  }
  async commit() {
    if (this.committed || this.preparing || this.busy || !this.draft.title.trim() || !this.draft.destination || this.plugin.closing) return;
    const current = this.plugin.store.memberships[this.membership.id];
    if (!current || current.revokedAt) {
      this.status.setText("\u8BE5\u4E3B\u952E\u5DF2\u79FB\u51FA\u884C\u52A8\u53F0");
      return;
    }
    this.busy = true;
    clearTimeout(this.timer);
    this.submit.disabled = true;
    this.input.disabled = true;
    this.draft.attempted = true;
    try {
      await this.saveDraft();
      const result = await this.plugin.collectionApi().createOperationalRootItem({ destination: this.draft.destination, title: this.draft.title, requestId: this.draft.requestId });
      if (result?.notWritten) {
        this.draft.attempted = false;
        this.input.disabled = false;
        await this.prepare(true);
        await this.saveDraft();
      }
      if (!result?.ok) throw new Error(result?.reason || "\u4FDD\u5B58\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u91CD\u8BD5");
      this.committed = true;
      this.plugin.diagnostics?.emit("commit-confirmed", { outcome: "confirmed" });
      await this.plugin.mutateStore("clear-created-action-draft", (latest) => {
        if (latest.newActionDrafts?.[this.membership.id]?.requestId === this.draft.requestId) delete latest.newActionDrafts[this.membership.id];
        return latest;
      }, { render: false });
      this.status.setText(result.deleted ? "\u4E0A\u6B21\u521B\u5EFA\u5DF2\u6210\u529F\uFF1B\u8BE5\u6761\u76EE\u540E\u6765\u5DF2\u88AB\u5220\u9664\u3002" : "\u5DF2\u5199\u5165 Collection Card\uFF0C\u6B63\u5728\u5237\u65B0\u884C\u52A8\u53F0\u2026");
      new import_obsidian.Notice(result.deleted ? "\u4E0A\u6B21\u521B\u5EFA\u5DF2\u786E\u8BA4\uFF0C\u8BE5\u6761\u76EE\u540E\u6765\u5DF2\u5220\u9664" : "\u4E0B\u4E00\u6B65\u5F85\u529E\u5DF2\u521B\u5EFA\uFF0C\u6765\u6E90\u6B63\u5728\u540E\u53F0\u5237\u65B0");
      if (!result.deleted) this.plugin.refreshAfterCommit(this.membership.id, result.nodeKey);
      this.busy = false;
      this.close();
    } catch (error) {
      this.status.setText(this.committed ? "\u5DF2\u521B\u5EFA\uFF1B\u8349\u7A3F\u6E05\u7406\u5931\u8D25\u3002\u8BF7\u5173\u95ED\u540E\u91CD\u65B0\u6253\u5F00\uFF0C\u6838\u5BF9\u5DF2\u6709\u6761\u76EE\u5E76\u6E05\u7406\u8349\u7A3F\u3002" : error.message);
      this.submit.setText("\u786E\u8BA4\u4FDD\u5B58\u7ED3\u679C / \u91CD\u8BD5");
      this.submit.disabled = this.committed || !this.draft.destination;
    } finally {
      this.busy = false;
    }
  }
  close() {
    if (this.busy) {
      new import_obsidian.Notice("\u6B63\u5728\u786E\u8BA4\u4FDD\u5B58\u7ED3\u679C\uFF0C\u8BF7\u7A0D\u5019");
      return;
    }
    super.close();
  }
  onClose() {
    this.closed = true;
    this.prepareGeneration = (this.prepareGeneration || 0) + 1;
    clearTimeout(this.timer);
    const flush = !this.committed && this.draft.title ? this.saveDraft() : Promise.resolve();
    this.plugin.pendingCreateDrafts.add(flush);
    void flush.then(() => {
      this.plugin.createActionModals.delete(this.membership.id);
    }).catch((error) => {
      new import_obsidian.Notice(`\u8349\u7A3F\u4FDD\u5B58\u5931\u8D25\uFF0C\u8F93\u5165\u5DF2\u4FDD\u7559\uFF1A${error.message}`);
      if (!this.plugin.closing) this.open();
    }).finally(() => {
      this.plugin.pendingCreateDrafts.delete(flush);
    });
  }
};
var ImportPrimaryModal = class extends import_obsidian.Modal {
  constructor(app, plugin, candidates, initialDomain = "goal") {
    super(app);
    this.plugin = plugin;
    this.candidates = candidates;
    this.selected = /* @__PURE__ */ new Set();
    this.selectedDomain = initialDomain === "project" ? "project" : "goal";
  }
  onOpen() {
    this.modalEl.addClass("naw-import-modal-shell");
    this.contentEl.addClass("naw-import-modal");
    const header = this.contentEl.createDiv({ cls: "naw-modal-header" });
    header.createEl("h2", { text: "\u5BFC\u5165\u4E3B\u952E" });
    header.createDiv({ cls: "naw-modal-subtitle", text: "\u76EE\u6807\u4E0E\u9879\u76EE\u4ECD\u7531\u539F\u63D2\u4EF6\u7EF4\u62A4\uFF1B\u8FD9\u91CC\u53EA\u5EFA\u7ACB\u884C\u52A8\u53F0\u5F52\u5C5E\u3002" });
    const domains = [{ id: "project", label: "\u9879\u76EE" }, { id: "goal", label: "\u76EE\u6807" }];
    const domainTabs = this.contentEl.createDiv({ cls: "naw-import-domains", attr: { role: "group", "aria-label": "\u4E3B\u952E\u7C7B\u578B" } });
    const buttons = /* @__PURE__ */ new Map();
    const search = this.contentEl.createEl("input", {
      cls: "naw-import-search",
      attr: { type: "search", placeholder: "\u641C\u7D22\u76EE\u6807\u6216\u9879\u76EE" }
    });
    const list = this.contentEl.createDiv({ cls: "naw-import-list" });
    const summary = this.contentEl.createDiv({ cls: "naw-import-selection", attr: { "aria-live": "polite" } });
    const updateSummary = () => {
      const count = (domain) => this.candidates.filter((candidate) => candidate.primaryRef.domain === domain && this.selected.has(candidate.membershipId)).length;
      summary.setText(`\u5DF2\u9009\u9879\u76EE ${count("project")}\u3001\u76EE\u6807 ${count("goal")}`);
    };
    const render = () => {
      list.empty();
      const label = this.selectedDomain === "project" ? "\u9879\u76EE" : "\u76EE\u6807";
      search.setAttribute("placeholder", `\u641C\u7D22${label}\u4E3B\u952E`);
      search.setAttribute("aria-label", `\u641C\u7D22${label}\u4E3B\u952E`);
      for (const [domain, button] of buttons) {
        button.classList.toggle("is-active", domain === this.selectedDomain);
        button.setAttribute("aria-pressed", String(domain === this.selectedDomain));
      }
      updateSummary();
      const query = text(search.value).toLocaleLowerCase();
      const domainCandidates = this.candidates.filter((candidate) => candidate.primaryRef.domain === this.selectedDomain);
      const visible = domainCandidates.filter((candidate) => !query || `${candidate.label} ${candidate.pathLabel}`.toLocaleLowerCase().includes(query));
      if (!visible.length) {
        list.createDiv({ cls: "naw-empty", text: domainCandidates.length ? `\u6CA1\u6709\u5339\u914D\u7684${label}\u4E3B\u952E\u3002` : `\u6682\u65E0\u53EF\u5BFC\u5165\u7684\u6709\u6548${label}\u4E3B\u952E\u3002` });
        return;
      }
      visible.forEach((candidate) => {
        const row = list.createEl("label", { cls: "naw-import-row" });
        const checkbox = row.createEl("input", { attr: { type: "checkbox" } });
        checkbox.checked = this.selected.has(candidate.membershipId);
        checkbox.onchange = () => {
          if (checkbox.checked) this.selected.add(candidate.membershipId);
          else this.selected.delete(candidate.membershipId);
          updateSummary();
        };
        const copy = row.createDiv({ cls: "naw-import-copy" });
        const title = copy.createDiv({ cls: "naw-import-title" });
        title.createSpan({ cls: `naw-domain-dot is-${candidate.primaryRef.domain}` });
        title.createSpan({ text: candidate.label });
        copy.createDiv({ cls: "naw-import-path", text: candidate.pathLabel });
      });
    };
    for (const domain of domains) {
      const count = this.candidates.filter((candidate) => candidate.primaryRef.domain === domain.id).length;
      const button = domainTabs.createEl("button", { cls: "naw-import-domain", text: `${domain.label} (${count})`, attr: { type: "button" } });
      button.onclick = () => {
        this.selectedDomain = domain.id;
        render();
      };
      buttons.set(domain.id, button);
    }
    search.oninput = render;
    render();
    const actions = this.contentEl.createDiv({ cls: "naw-modal-actions" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88" });
    cancel.onclick = () => this.close();
    const submit = actions.createEl("button", { text: "\u5BFC\u5165\u6240\u9009", cls: "mod-cta" });
    submit.onclick = async () => {
      const selected = this.candidates.filter((candidate) => this.selected.has(candidate.membershipId));
      if (!selected.length) {
        new import_obsidian.Notice("\u8BF7\u5148\u9009\u62E9\u81F3\u5C11\u4E00\u4E2A\u4E3B\u952E");
        return;
      }
      submit.disabled = true;
      try {
        await this.plugin.importCandidates(selected);
        this.close();
      } finally {
        submit.disabled = false;
      }
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AutoSaveNameModal = class extends import_obsidian.Modal {
  constructor(app, plugin, config) {
    super(app);
    this.plugin = plugin;
    this.config = config;
    this.editorKey = config.editorKey;
    this.closing = false;
  }
  onOpen() {
    this.modalEl.addClass("naw-keyword-modal-shell");
    this.saveTimer = null;
    this.saving = Promise.resolve();
    this.initialValue = this.config.getValue();
    this.currentValue = this.initialValue;
    this.renderContent();
  }
  renderContent() {
    this.contentEl.empty();
    this.contentEl.addClass("naw-keyword-modal");
    const header = this.contentEl.createDiv({ cls: "naw-modal-header" });
    header.createEl("h2", { text: this.config.title });
    header.createDiv({ cls: "naw-modal-subtitle", text: this.config.subtitle });
    this.contentEl.createDiv({ cls: "naw-local-name-help", text: this.config.help });
    const entry = this.contentEl.createDiv({ cls: "naw-keyword-entry" });
    const input = entry.createEl("input", { attr: { type: "text", placeholder: this.config.placeholder } });
    this.inputEl = input;
    input.value = this.currentValue;
    const save = entry.createEl("button", { cls: "mod-cta", attr: { type: "button" }, text: "\u4FDD\u5B58" });
    const clear = entry.createEl("button", { attr: { type: "button" }, text: this.config.clearLabel || "\u6E05\u9664\u540D\u79F0" });
    this.saveButton = save;
    this.clearButton = clear;
    const status = this.contentEl.createDiv({ cls: "naw-local-name-status", text: "\u4FEE\u6539\u4F1A\u81EA\u52A8\u4FDD\u5B58" });
    const submit = () => this.flushSave(input.value, status, save);
    save.onclick = () => void submit();
    clear.onclick = () => {
      input.value = "";
      this.currentValue = "";
      void this.flushSave("", status, save);
    };
    input.oninput = () => {
      this.currentValue = input.value;
      status.setText("\u7B49\u5F85\u4FDD\u5B58...");
      if (this.saveTimer) window.clearTimeout(this.saveTimer);
      this.saveTimer = window.setTimeout(() => {
        this.saveTimer = null;
        void this.flushSave(input.value, status, save);
      }, 320);
    };
    input.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void submit();
      }
    };
    const actions = this.contentEl.createDiv({ cls: "naw-modal-actions" });
    const close = actions.createEl("button", { text: "\u5B8C\u6210" });
    close.onclick = async () => {
      await submit();
      this.close();
    };
    input.focus();
  }
  async flushSave(value, status, button) {
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const nextValue = text(value);
    if (nextValue === this.initialValue) {
      status?.setText("\u5DF2\u4FDD\u5B58");
      return;
    }
    button && (button.disabled = true);
    status?.setText("\u6B63\u5728\u4FDD\u5B58...");
    this.saving = this.saving.catch(() => void 0).then(() => this.config.save(nextValue));
    try {
      await this.saving;
      this.initialValue = nextValue;
      status?.setText(this.currentValue === nextValue ? "\u5DF2\u4FDD\u5B58" : "\u4ECD\u6709\u4FEE\u6539\u7B49\u5F85\u4FDD\u5B58...");
    } catch (error) {
      status?.setText(`\u4FDD\u5B58\u5931\u8D25\uFF1A${error?.message || String(error)}`);
      throw error;
    } finally {
      button && (button.disabled = false);
    }
  }
  async flushPending() {
    while (text(this.currentValue) !== this.initialValue) {
      await this.flushSave(this.currentValue);
    }
  }
  focusInput() {
    if (this.closing || !this.inputEl?.isConnected) return false;
    this.inputEl.focus();
    this.inputEl.select();
    return true;
  }
  freezeEditor() {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (this.inputEl) this.inputEl.disabled = true;
    if (this.saveButton) this.saveButton.disabled = true;
    if (this.clearButton) this.clearButton.disabled = true;
  }
  onClose() {
    this.closing = true;
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.plugin.trackNameModalClose(this, this.flushPending());
    this.contentEl.empty();
  }
};
var NextActionWorkbenchView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderToken = 0;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0";
  }
  getIcon() {
    return "list-checks";
  }
  async onOpen() {
    this.contentEl.addClass("next-action-workbench-view");
    this.render();
  }
  render() {
    const token = ++this.renderToken;
    const store = this.plugin.store;
    const root = this.contentEl;
    root.empty();
    const shell = root.createDiv({ cls: "naw-shell" });
    const toolbar = shell.createDiv({ cls: "naw-toolbar" });
    const identity = toolbar.createDiv({ cls: "naw-identity" });
    identity.createEl("h2", { text: "\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0" });
    identity.createSpan({ text: "Collection Card -> \u53EF\u6267\u884C\u7ED3\u6784" });
    const controls = toolbar.createDiv({ cls: "naw-controls" });
    commandButton(controls, "plus", "\u5BFC\u5165\u4E3B\u952E", () => this.plugin.openImportModal(), "mod-cta");
    iconButton(controls, "refresh-cw", "\u5237\u65B0\u6765\u6E90", () => this.plugin.refreshImportedMemberships(), "naw-refresh");
    const searchWrap = controls.createDiv({ cls: "naw-search" });
    (0, import_obsidian.setIcon)(searchWrap, "search");
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "\u641C\u7D22\u884C\u52A8\u53F0\u540D\u79F0\u3001\u6765\u6E90\u4E3B\u952E\u6216\u4E0B\u4E00\u6B65\u5F85\u529E" } });
    search.value = text(store.uiState.search);
    search.oninput = () => {
      this.plugin.setUiState({ search: search.value });
      this.renderBody(shell, token);
    };
    if (this.plugin.readOnlyReason) {
      toolbar.createDiv({ cls: "naw-readonly-banner", text: this.plugin.readOnlyReason });
    }
    this.renderBody(shell, token);
  }
  renderBody(shell, token) {
    if (token !== this.renderToken) return;
    shell.querySelectorAll(":scope > .naw-domain-tabs, :scope > .naw-content-layout").forEach((element) => element.remove());
    const store = this.plugin.store;
    const allMemberships = Object.values(store.memberships).filter((item) => !item.revokedAt).sort((left, right) => Number(left.order) - Number(right.order) || compareAlphabetical(left.lastKnownLabel, right.lastKnownLabel));
    const selectedDomain = ["goal", "project"].includes(text(store.uiState.selectedDomain)) ? store.uiState.selectedDomain : "goal";
    const domainTabs = shell.createDiv({ cls: "naw-domain-tabs", attr: { role: "tablist", "aria-label": "\u4E3B\u952E\u7C7B\u578B" } });
    [
      { id: "goal", label: "\u76EE\u6807\u4E3B\u952E" },
      { id: "project", label: "\u9879\u76EE\u4E3B\u952E" }
    ].forEach((domain) => {
      const count = allMemberships.filter((membership) => membership.primaryRef.domain === domain.id).length;
      const button = domainTabs.createEl("button", {
        cls: `naw-domain-tab${selectedDomain === domain.id ? " is-active" : ""}`,
        attr: { type: "button", role: "tab", "aria-selected": String(selectedDomain === domain.id) }
      });
      button.createSpan({ text: domain.label });
      button.createSpan({ cls: "naw-domain-tab-count", text: String(count) });
      button.onclick = () => {
        const selectedByDomain2 = Object.assign({ goal: "all", project: "all" }, store.uiState.selectedMembershipIdByDomain || {});
        this.plugin.setUiState({
          selectedDomain: domain.id,
          selectedMembershipId: selectedByDomain2[domain.id] || "all"
        });
        this.render();
      };
    });
    const memberships = allMemberships.filter((item) => item.primaryRef.domain === selectedDomain);
    const selectedByDomain = Object.assign({ goal: "all", project: "all" }, store.uiState.selectedMembershipIdByDomain || {});
    const requestedSelection = text(selectedByDomain[selectedDomain], "all");
    const selectedId = memberships.some((item) => item.id === requestedSelection) ? requestedSelection : "all";
    const contentLayout = shell.createDiv({ cls: "naw-content-layout" });
    const primaryNavigation = contentLayout.createDiv({ cls: "naw-primary-navigation" });
    const primaryHeading = primaryNavigation.createDiv({ cls: "naw-navigation-heading" });
    primaryHeading.createSpan({ cls: "naw-navigation-title", text: selectedDomain === "goal" ? "\u76EE\u6807\u6E05\u5355" : "\u9879\u76EE\u6E05\u5355" });
    primaryHeading.createSpan({ cls: "naw-navigation-hint", text: "\u6309\u884C\u52A8\u53F0\u540D\u79F0\u6392\u5217" });
    const capsules = primaryNavigation.createDiv({ cls: "naw-capsules", attr: { role: "tablist" } });
    this.renderCapsule(capsules, "all", "\u5168\u90E8", memberships.reduce((sum, item) => sum + getMembershipLinks(store, item.id).length, 0), selectedId === "all", selectedDomain);
    sortMembershipsByLocalName(store, memberships).forEach((membership) => {
      this.renderCapsule(capsules, membership.id, getMembershipDisplayName(store, membership), getMembershipLinks(store, membership.id).length, selectedId === membership.id, membership.primaryRef.domain);
    });
    const workspace = contentLayout.createDiv({ cls: "naw-workspace" });
    if (!allMemberships.length) {
      const empty = workspace.createDiv({ cls: "naw-zero-state" });
      (0, import_obsidian.setIcon)(empty.createDiv({ cls: "naw-zero-icon" }), "list-plus");
      empty.createEl("h3", { text: "\u8FD8\u6CA1\u6709\u7EB3\u5165\u4E3B\u952E" });
      empty.createDiv({ text: "\u4ECE\u4ECD\u5728\u8FFD\u8E2A\u7684\u76EE\u6807\u6216\u9879\u76EE\u4E2D\u9009\u62E9\uFF0C\u5EFA\u7ACB\u4F60\u7684\u4E0B\u4E00\u6B65\u884C\u52A8\u5DE5\u4F5C\u9762\u3002" });
      commandButton(empty, "plus", "\u5BFC\u5165\u4E3B\u952E", () => this.plugin.openImportModal(), "mod-cta");
      return;
    }
    if (!memberships.length) {
      workspace.createDiv({ cls: "naw-empty", text: selectedDomain === "goal" ? "\u5C1A\u672A\u7EB3\u5165\u76EE\u6807\u4E3B\u952E\u3002" : "\u5C1A\u672A\u7EB3\u5165\u9879\u76EE\u4E3B\u952E\u3002" });
      return;
    }
    const query = text(store.uiState.search).toLocaleLowerCase();
    const visibleMemberships = sortMembershipsByLocalName(store, memberships).filter((item) => {
      if (selectedId !== "all" && item.id !== selectedId) return false;
      const localName = getMembershipLocalName(store, item.id);
      return !query || `${item.lastKnownLabel} ${item.pathLabel} ${localName}`.toLocaleLowerCase().includes(query) || getMembershipLinks(store, item.id).some((link) => {
        const card = store.sourceCards[link.sourceCardId] || {};
        const alias = getMembershipSourceAlias(store, item.id, link.sourceCardId);
        return `${alias} ${card.label} ${card.pathLabel} ${card.carrierLabel}`.toLocaleLowerCase().includes(query);
      });
    });
    let renderedCards = 0;
    visibleMemberships.forEach((membership) => {
      const allLinks = getMembershipLinks(store, membership.id);
      const localName = getMembershipLocalName(store, membership.id);
      const membershipMatch = !query || `${membership.lastKnownLabel} ${membership.pathLabel} ${localName}`.toLocaleLowerCase().includes(query);
      const links = allLinks.filter((link) => {
        const card = store.sourceCards[link.sourceCardId] || {};
        const alias = getMembershipSourceAlias(store, membership.id, link.sourceCardId);
        return !query || `${alias} ${card.label} ${card.pathLabel} ${card.carrierLabel}`.toLocaleLowerCase().includes(query);
      });
      const visibleLinks = membershipMatch ? allLinks : links;
      if (query && !visibleLinks.length) return;
      renderedCards += visibleLinks.length;
      this.renderMembershipSection(workspace, membership, visibleLinks);
    });
    if (!renderedCards && query) workspace.createDiv({ cls: "naw-empty", text: "\u6CA1\u6709\u5339\u914D\u7684\u4E0B\u4E00\u6B65\u5F85\u529E\u3002" });
  }
  renderCapsule(parent, id, label, count, active, domain = "goal") {
    const button = parent.createEl("button", {
      cls: `naw-capsule is-${domain}${active ? " is-active" : ""}`,
      attr: { type: "button", role: "tab", "aria-selected": active ? "true" : "false", title: label }
    });
    button.createSpan({ cls: "naw-capsule-label", text: label });
    button.createSpan({ cls: "naw-capsule-count", text: String(count) });
    button.onclick = () => {
      const selectedDomain = ["goal", "project"].includes(domain) ? domain : text(this.plugin.store.uiState.selectedDomain, "goal");
      const selectedMembershipIdByDomain = Object.assign(
        { goal: "all", project: "all" },
        this.plugin.store.uiState.selectedMembershipIdByDomain || {},
        { [selectedDomain]: id }
      );
      this.plugin.setUiState({ selectedDomain, selectedMembershipId: id, selectedMembershipIdByDomain });
      this.render();
    };
  }
  renderMembershipSection(parent, membership, links) {
    const section = parent.createDiv({ cls: `naw-membership is-${membership.primaryRef.domain}` });
    const header = section.createDiv({ cls: "naw-membership-header" });
    const title = header.createDiv({ cls: "naw-membership-title" });
    title.createSpan({ cls: `naw-domain-badge is-${membership.primaryRef.domain}`, text: membership.primaryRef.domain === "goal" ? "\u76EE\u6807" : "\u9879\u76EE" });
    const localName = getMembershipLocalName(this.plugin.store, membership.id);
    title.createEl("h3", { text: localName || membership.lastKnownLabel });
    if (localName && localName !== membership.lastKnownLabel) title.createSpan({ cls: "naw-source-primary-label", text: `\u6765\u6E90\u4E3B\u952E\uFF1A${membership.lastKnownLabel}` });
    title.createSpan({ cls: "naw-membership-count", text: `${links.length} \u6761` });
    const completedCount = links.filter((link) => Boolean(link.completedAt)).length;
    if (completedCount) title.createSpan({ cls: "naw-completion-summary", text: `${completedCount} \u5DF2\u5B8C\u6210` });
    if (!membership.active) title.createSpan({ cls: "naw-status is-membership-inactive", text: "\u5DF2\u975E\u6709\u6548\u4E3B\u952E" });
    const detail = this.plugin.refreshDetails?.get(membership.id);
    if (detail?.message) section.createDiv({ cls: "naw-empty", text: detail.message });
    if (detail?.lastSuccess) section.createDiv({ cls: "naw-source-primary-label", text: `\u6700\u8FD1\u4E00\u6B21\u6765\u6E90\u5B8C\u6574\u8BFB\u53D6\uFF1A${detail.lastSuccess}` });
    const actions = header.createDiv({ cls: "naw-membership-actions" });
    const add = commandButton(actions, "plus", "\u65B0\u589E\u4E0B\u4E00\u6B65\u5F85\u529E", () => this.plugin.openCreateActionModal(membership));
    add.disabled = membership.active === false || Boolean(this.plugin.readOnlyReason);
    commandButton(actions, "pencil", localName ? "\u4FEE\u6539\u884C\u52A8\u53F0\u540D\u79F0" : "\u8BBE\u7F6E\u884C\u52A8\u53F0\u540D\u79F0", () => this.plugin.openLocalNameModal(membership));
    iconButton(actions, "refresh-cw", "\u5237\u65B0\u8BE5\u4E3B\u952E", () => this.plugin.refreshImportedMemberships([membership.id]));
    iconButton(actions, "archive", "\u79FB\u51FA\u884C\u52A8\u53F0", () => this.plugin.confirmRevokeMembership(membership));
    if (!links.length) {
      section.createDiv({ cls: "naw-empty", text: statusLabels[membership.lastSourceObservation] || "\u5F53\u524D\u4E3B\u952E\u6CA1\u6709\u5339\u914D\u7684 Collection Card \u6761\u76EE\u3002" });
      return;
    }
    const pendingLinks = links.filter((link) => !link.completedAt);
    const completedLinks = links.filter((link) => Boolean(link.completedAt));
    if (pendingLinks.length) {
      const rows = section.createDiv({ cls: "naw-source-rows" });
      pendingLinks.forEach((link) => this.renderSourceRow(rows, membership, link));
    }
    if (completedLinks.length) {
      const completedSection = section.createDiv({ cls: "naw-completed-section" });
      const completedHeading = completedSection.createDiv({ cls: "naw-completed-heading" });
      (0, import_obsidian.setIcon)(completedHeading.createSpan({ cls: "naw-completed-heading-icon" }), "check-check");
      completedHeading.createSpan({ text: "\u5DF2\u5B8C\u6210" });
      completedHeading.createSpan({ cls: "naw-membership-count", text: `${completedLinks.length} \u6761` });
      const rows = completedSection.createDiv({ cls: "naw-source-rows" });
      completedLinks.forEach((link) => this.renderSourceRow(rows, membership, link));
    }
  }
  renderSourceRow(parent, membership, link) {
    const store = this.plugin.store;
    const card = store.sourceCards[link.sourceCardId] || {};
    const ontology = store.ontologies[link.sourceCardId] || {};
    const state = link.observationState || aggregateSourceObservation(store, link.sourceCardId);
    const populated = this.plugin.hasOntologyContent(ontology.formalOntology);
    const completed = Boolean(link.completedAt);
    const row = parent.createDiv({ cls: `naw-source-row is-${state}${populated ? " has-ontology" : ""}${completed ? " is-completed" : ""}` });
    row.dataset.sourceCardId = link.sourceCardId;
    const marker = row.createDiv({ cls: "naw-source-marker" });
    (0, import_obsidian.setIcon)(marker, completed ? "check-check" : populated ? "table-properties" : "square-dashed");
    const copy = row.createDiv({ cls: "naw-source-copy" });
    const alias = getMembershipSourceAlias(store, membership.id, link.sourceCardId);
    copy.createDiv({ cls: "naw-source-title", text: getMembershipSourceDisplayName(store, link) || "\u5931\u8054\u6761\u76EE" });
    const meta = copy.createDiv({ cls: "naw-source-meta" });
    if (alias && alias !== card.label) meta.createSpan({ cls: "naw-source-original-label", text: `\u6765\u6E90\u5F85\u529E\uFF1A${card.label || card.nodeKey || "\u5931\u8054\u6761\u76EE"}` });
    if (card.carrierLabel) meta.createSpan({ cls: "naw-carrier-label", text: `\u80F6\u56CA\uFF1A${card.carrierLabel}` });
    if (card.pathLabel && card.pathLabel !== card.label) meta.createSpan({ text: card.pathLabel });
    meta.createSpan({ cls: `naw-status is-${state}`, text: statusLabels[state] || state });
    meta.createSpan({ cls: `naw-ontology-state${populated ? " is-populated" : ""}`, text: populated ? "\u884C\u52A8\u7ED3\u6784\u5DF2\u6709\u5185\u5BB9" : "\u884C\u52A8\u7ED3\u6784\u4E3A\u7A7A" });
    const actions = row.createDiv({ cls: "naw-source-actions" });
    iconButton(actions, completed ? "rotate-ccw" : "check", completed ? "\u64A4\u9500\u5B8C\u6210" : "\u6807\u8BB0\u5B8C\u6210", () => this.plugin.toggleSourceCompletion(membership.id, link.sourceCardId, !completed), "naw-completion-button");
    iconButton(actions, "pencil", alias ? "\u4FEE\u6539\u4E49\u540D" : "\u8BBE\u7F6E\u4E49\u540D", () => this.plugin.openSourceAliasModal(membership, link, card), "naw-alias-button");
    commandButton(actions, "table-properties", populated ? "\u7EE7\u7EED\u5206\u89E3" : "\u6253\u5F00\u884C\u52A8\u7ED3\u6784", () => this.plugin.openSourceOntology(card), populated ? "is-populated" : "");
    commandButton(actions, "locate-fixed", "\u8FD4\u56DE\u6765\u6E90", () => this.plugin.revealSource(membership, card));
  }
};
var NextActionWorkbenchPlugin = class extends import_obsidian.Plugin {
  async onload() {
    this.mutationQueue = Promise.resolve();
    this.diagnostics = new Diagnostics();
    this.readCoordinator = new ReadCoordinator(this.diagnostics);
    this.refreshRuns = /* @__PURE__ */ new Map();
    this.refreshGeneration = 0;
    this.domainGenerations = /* @__PURE__ */ new Map();
    this.memberGenerations = /* @__PURE__ */ new Map();
    this.refreshDetails = /* @__PURE__ */ new Map();
    this.backgroundReads = /* @__PURE__ */ new Set();
    this.ownerUnavailable = false;
    this.closing = false;
    this.uiSaveTimer = null;
    this.activeOntologyHandles = /* @__PURE__ */ new Set();
    this.nameEditorRegistry = new NameEditorRegistry();
    this.createActionModals = /* @__PURE__ */ new Map();
    this.pendingCreateDrafts = /* @__PURE__ */ new Set();
    const migration = migrateStore(await this.loadData());
    this.store = migration.store;
    this.readOnlyReason = migration.readOnly ? migration.reason : "";
    this.registerView(VIEW_TYPE, (leaf) => new NextActionWorkbenchView(leaf, this));
    this.addRibbonIcon("list-checks", "\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0", async () => await this.activateView());
    this.addCommand({ id: "open-next-action-workbench", name: "\u6253\u5F00\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0", callback: async () => await this.activateView() });
    this.addCommand({ id: "refresh-next-action-workbench", name: "\u5237\u65B0\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0\u6765\u6E90", callback: async () => await this.refreshImportedMemberships() });
    this.addCommand({ id: "start-read-diagnostics", name: "\u5F00\u59CB\u884C\u52A8\u53F0\u8BFB\u53D6\u8BCA\u65AD\uFF0860\u79D2\uFF09", callback: () => {
      this.diagnostics.start();
      new import_obsidian.Notice("\u8BCA\u65AD\u5DF2\u5F00\u59CB\uFF0C\u8BF7\u5237\u65B0\u4E00\u6B21\u6765\u6E90\u6216\u91CD\u8BD5\u65B0\u589E");
    } });
    this.addCommand({ id: "copy-read-diagnostics", name: "\u505C\u6B62\u5E76\u590D\u5236\u884C\u52A8\u53F0\u8BFB\u53D6\u8BCA\u65AD", callback: async () => {
      this.diagnostics.stop();
      await navigator.clipboard.writeText(JSON.stringify(this.diagnostics.snapshot(), null, 2));
      new import_obsidian.Notice("\u8BCA\u65AD\u6458\u8981\u5DF2\u590D\u5236\uFF0C\u4E0D\u542B\u5361\u7247\u6B63\u6587\u6216\u8DEF\u5F84");
    } });
    this.registerDomEvent(window, "context-capsule-carrier:changed", () => {
      this.readCoordinator.invalidate();
      this.refreshDetails.forEach((detail) => {
        detail.message = "\u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u8BE5\u4E3B\u952E";
      });
      this.renderViews();
    });
    this.registerDomEvent(window, "mandala-time-blocks:tracking-lifecycle-changed", event => this.queueMandalaTrackingRefresh(event.detail));
    this.registerDomEvent(window, "project-execution-overview:context-key-renamed-v1", event => this.queueManagedContextRenameRefresh(event.detail));
    this.registerDomEvent(window, "project-execution-overview:primary-key-lifecycle-changed", () => {
      this.readCoordinator.invalidate();
      void this.refreshImportedMemberships().catch((error) => {
        console.warn("[NextActionWorkbench][lifecycle][tx:owner-change][refresh-failed]", { message: error?.message || String(error) });
      });
    });
    console.info("[NextActionWorkbench][lifecycle][tx:load][ready]", { schemaVersion: this.store.schemaVersion, readOnly: Boolean(this.readOnlyReason) });
  }
  async onunload() {
    this.closing = true;
    this.mandalaTrackingPending?.clear();
    this.readCoordinator?.close();
    for (const modal of this.createActionModals.values()) {
      if (modal.commitPromise) await modal.commitPromise;
      clearTimeout(modal.timer);
      if (!modal.committed && modal.draft.title) await modal.saveDraft().catch((error) => console.error("[NextAction][draft-unload]", error));
      modal.close();
    }
    await Promise.allSettled([...this.pendingCreateDrafts]);
    if (this.uiSaveTimer) window.clearTimeout(this.uiSaveTimer);
    await this.nameEditorRegistry.freezeAndDrain((modal, error) => {
      console.error("[NextActionWorkbench][name-editor][plugin-unload-save-failed]", { editorKey: modal.editorKey, message: error?.message || String(error) });
    });
    const editor = this.getOntologyEditor(false);
    if (editor?.closeOwnerEditors) {
      try {
        await editor.closeOwnerEditors({ ownerNamespace: ONTOLOGY_OWNER_NAMESPACE });
      } catch (error) {
        console.error("[NextActionWorkbench][ontology][tx:unload][recovery-flush-failed]", { message: error?.message || String(error) });
      }
    }
    this.ownerUnavailable = true;
    this.activeOntologyHandles.clear();
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    return leaf;
  }
  renderViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).map((leaf) => leaf.view).forEach((view) => {
      const scroll = view?.contentEl?.scrollTop;
      view?.render?.();
      if (view?.contentEl && Number.isFinite(scroll)) view.contentEl.scrollTop = scroll;
    });
  }
  collectionApi() {
    return window.__collectionCardViewPluginApi || null;
  }
  openCreateActionModal(membership) {
    if (this.closing || this.readOnlyReason || this.createActionModals.has(membership.id)) return;
    const modal = new CreateActionModal(this.app, this, membership);
    this.createActionModals.set(membership.id, modal);
    modal.open();
  }
  setUiState(patch) {
    this.store.uiState = Object.assign({}, this.store.uiState, patch);
    if (this.uiSaveTimer) window.clearTimeout(this.uiSaveTimer);
    this.uiSaveTimer = window.setTimeout(() => {
      this.uiSaveTimer = null;
      void this.mutateStore("ui-state", (latest) => {
        latest.uiState = Object.assign({}, latest.uiState, this.store.uiState);
        return latest;
      }, { render: false }).catch((error) => console.warn("[NextActionWorkbench][ui][tx:ui-state][save-failed]", { message: error?.message || String(error) }));
    }, 240);
  }
  async mutateStore(label, reducer, options = {}) {
    if (this.readOnlyReason) throw new Error(this.readOnlyReason);
    const txId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const queuedAt=performance.now();
    const run = this.mutationQueue.then(async () => {
      this.recordCollectionInteraction("mutation.queue",queuedAt);
      const migration = await this.measureCollectionInteraction("mutation.read",async()=>migrateStore(await this.loadData()));
      if (migration.readOnly) throw new Error(migration.reason);
      const reduced = await this.measureCollectionInteraction("mutation.reduce",()=>reducer(clone(migration.store)));
      if (options.skipNull && (reduced == null || this.closing || options.shouldApply && !options.shouldApply())) return this.store;
      const finalizeAt=performance.now();
      const next = finalizeStore(reduced || migration.store);
      this.recordCollectionInteraction("mutation.finalize",finalizeAt);
      await this.measureCollectionInteraction("mutation.save",()=>this.saveData(next));
      const reread = await this.measureCollectionInteraction("mutation.verify",async()=>migrateStore(await this.loadData()));
      if (reread.readOnly || Number(reread.store.revision) !== Number(next.revision)) throw new Error("\u884C\u52A8\u53F0 Store \u56DE\u8BFB\u6821\u9A8C\u5931\u8D25\u3002");
      this.store = reread.store;
      if (["set-primary-key-local-name","set-source-card-local-alias","set-source-card-tags","rename-action-tag","toggle-source-card-completion","ontology-commit","collection-action-identity"].includes(label)) window.dispatchEvent(new CustomEvent("collection-action-metadata:changed", {detail:{revision:this.store.revision,...options.metadataDetail}}));
      console.info(`[NextActionWorkbench][store][tx:${txId}][committed]`, { label, revision: this.store.revision });
      if (options.render !== false) {const renderAt=performance.now();this.renderViews();this.recordCollectionInteraction("legacy.render",renderAt);}
      return this.store;
    });
    this.mutationQueue = run.catch((error) => {
      console.error(`[NextActionWorkbench][store][tx:${txId}][failed]`, { label, message: error?.message || String(error) });
    });
    return await run;
  }
  mandalaApi() {
    return window.__mandalaTimeBlocksPluginApi || this.app.plugins?.plugins?.["mandala-time-blocks"]?.api || null;
  }
  overviewApi() {
    return window.__projectExecutionOverviewPluginApi || this.app.plugins?.plugins?.["project-execution-overview"]?.api || null;
  }
  workspaceApi() {
    return window.__workspaceMountPluginApi || this.app.plugins?.plugins?.["workspace-mount"]?.globalApi || null;
  }
  startCollectionInteractionMeasurement() {
    this.collectionInteractionMetrics=[];this.collectionInteractionUntil=performance.now()+180000;
    return {seconds:180,limit:300};
  }
  getCollectionInteractionMeasurement() {
    return {build:'collection-clicks-20261012',active:performance.now()<(this.collectionInteractionUntil||0),events:(this.collectionInteractionMetrics||[]).slice()};
  }
  recordCollectionInteraction(phase,start,outcome='returned') {
    if(!this.collectionInteractionUntil||performance.now()>this.collectionInteractionUntil)return;
    const events=this.collectionInteractionMetrics;
    if(events.length>=300)events.shift();
    events.push({phase,durationMs:Math.round(performance.now()-start),outcome});
  }
  async measureCollectionInteraction(phase,fn) {
    const start=performance.now();try{const result=await fn();this.recordCollectionInteraction(phase,start);return result;}
    catch(e){this.recordCollectionInteraction(phase,start,'failed');throw e;}
  }
  findCollectionActionIdentity(options={}) {
    if(this.closing||this.ownerUnavailable||this.readOnlyReason)throw new Error('行动信息服务未就绪');
    const {contextId,sourceNotePath,itemId}=options,member=this.store.memberships[contextId];
    if(!member)return null;
    if(member.id!==contextId)throw new Error('主键身份不一致');
    const sourceLabel=text(options.sourceLabel,member.lastKnownLabel);
    if(!itemId)return {membershipId:contextId,sourceLabel};
    const matches=Object.values(this.store.sourceCards).filter(card=>{
      try {if(!card.nodeKey?.startsWith('jump:v1:'))return false;const a=card.nodeKey.slice(8).split('|').map(decodeURIComponent);
        return a.length===5&&a[0]==='collection-card-view'&&a[1]===sourceNotePath&&a[2]==='tab'&&!!a[3]&&a[4]===itemId;
      }catch(_){return false;}
    });
    if(matches.length>1)throw new Error('条目存在多个历史身份，请先核对');
    const card=matches[0];if(!card)return null;
    if(this.store.sourceCards[card.id]!==card||card.notePath!==sourceNotePath)throw new Error('来源身份或作用域不一致');
    const lid=buildLinkId(contextId,card.id),link=this.store.membershipSourceLinks[lid];
    if(!link)return null;
    if(link.id!==lid||link.membershipId!==contextId||link.sourceCardId!==card.id)throw new Error('行动关联身份不一致');
    return {membershipId:contextId,sourceLabel,sourceCardId:card.id,card:{...card,label:text(options.itemTitle,card.label),notePath:sourceNotePath}};
  }

  async getCollectionActionTargets({fresh=false}={}) {
    if(fresh) this.readCoordinator.invalidate();
    const result=await this.fetchActiveCandidates();
    return {...result, targets:result.targets.map(t=>({...t,actionName:this.getCollectionActionName(t.membershipId)||t.label}))};
  }
  getCollectionActionMetadata({ sourceNotePath, offset = 0, limit = 200 } = {}) {
    if (this.closing || this.readOnlyReason) throw new Error("行动信息服务未就绪");
    const decode = card => { try { const a = card.nodeKey.slice(8).split("|").map(decodeURIComponent); return a.length === 5 && a[0] === "collection-card-view" && a[1] === sourceNotePath ? { tabId:a[3], itemId:a[4] } : null; } catch (_) { return null; } };
    const contexts = Object.values(this.store.memberships).map(m => {
      const links = Object.values(this.store.membershipSourceLinks).filter(l => l.membershipId === m.id).flatMap(l => {
        const identity = decode(this.store.sourceCards[l.sourceCardId] || {});
        return identity ? [{...identity, sourceCardId:l.sourceCardId, completed:!!l.completedAt, alias:this.store.sourceAliases[l.id]?.label || "", tags:[...(this.store.sourceTags[l.id]?.labels || [])], hasOntology:this.hasOntologyContent(this.store.ontologies[l.sourceCardId]?.formalOntology)}] : [];
      });
      return { id:m.id, domain:m.primaryRef?.domain || "project", label:this.getCollectionActionName(m.id)||m.lastKnownLabel, sourceLabel:m.lastKnownLabel || "", tabIds:[...new Set(links.map(l=>l.tabId))], links };
    }).filter(m => m.tabIds.length);
    const start = Math.max(0,Number(offset)||0), size = Math.max(1,Math.min(200,Number(limit)||200));
    return { revision:this.store.revision, contexts:contexts.slice(start,start+size), nextOffset:start+size<contexts.length ? start+size : null };
  }
  async ensureCollectionActionIdentity({sourceNotePath,tabId,itemId,contextId,domain} = {}) {
    const api = this.collectionApi();
    if (typeof api?.getActionIdentity !== "function") throw new Error("Collection 操作接口未就绪");
    let result;
    await this.mutateStore("collection-action-identity", async latest => {
      if (this.closing) throw new Error("行动信息服务正在关闭");
      this.readCoordinator.invalidate();
      const active=await this.measureCollectionInteraction("identity.qualification",()=>this.fetchActiveCandidates(["goal","project"].includes(domain)?[domain]:["project","goal"]));
      const target=active.targets.find(t=>t.membershipId===contextId);
      if(!target) throw new Error("主键已不在有效操作上下文中，或资格服务不可用");
      const live=await this.measureCollectionInteraction("identity.collection",()=>api.getActionIdentity({sourceNotePath,tabId,itemId,target}));
      const decode = card => { try {const a=card.nodeKey.slice(8).split("|").map(decodeURIComponent);return a[0]==="collection-card-view"&&a[1]===sourceNotePath&&a[4]===itemId;}catch(_){return false;} };
      const matches = itemId ? Object.values(latest.sourceCards).filter(decode) : [];
      if(matches.length>1) throw new Error("条目存在多个历史身份，请先核对");
      const mid=contextId;
      const missingMembership=!latest.memberships[mid];
      if(missingMembership) latest=importTargets(latest,[target]);
      let changed=missingMembership;
      if(itemId) {
        const nodeKey=`jump:v1:${["collection-card-view",sourceNotePath,"tab",tabId,itemId].map(encodeURIComponent).join("|")}`;
        const sid=matches[0]?.id || buildSourceCardId(nodeKey);
        if(!latest.sourceCards[sid]) {latest.sourceCards[sid]={id:sid,nodeKey,notePath:sourceNotePath};changed=true;}
        const lid=buildLinkId(mid,sid);
        if(!latest.membershipSourceLinks[lid]) {latest.membershipSourceLinks[lid]={id:lid,membershipId:mid,sourceCardId:sid,completedAt:"",observationState:"fresh-complete"};changed=true;}
        reserve(latest,"sourceCards",sid); reserve(latest,"links",lid);
        result={membershipId:mid,sourceLabel:target.label,sourceCardId:sid,card:{...latest.sourceCards[sid],label:live.title,notePath:sourceNotePath}};
      } else result={membershipId:mid,sourceLabel:target.label};
      return changed?latest:null;
    },{render:false,skipNull:true});
    return result;
  }
  getActionTagEditSnapshot() { return JSON.stringify(this.store.sourceTags); }
  getActionTagRenamePreview(label) {
    const oldLabel=normalizeActionTag(label);if(!oldLabel)throw new Error("标签不能为空");
    const key=oldLabel.toLocaleLowerCase(),snapshot=JSON.stringify(this.store.sourceTags);
    const count=Object.values(this.store.sourceTags).filter(r=>r.labels.some(t=>t.toLocaleLowerCase()===key)).length;
    if(!count)throw new Error("标签已不存在，请刷新");return {oldLabel,snapshot,count};
  }
  async renameActionTag(preview, value) {
    const newLabel=String(value||"").replace(/\s+/g," ").trim().replace(/^#+/,"").trim();
    if(!newLabel||newLabel.length>32)throw new Error("标签须为 1–32 个字符");
    const oldKey=preview?.oldLabel?.toLocaleLowerCase(),newKey=newLabel.toLocaleLowerCase();
    if(!oldKey||typeof preview.snapshot!=="string")throw new Error("请重新预览标签");
    await this.mutateStore("rename-action-tag",latest=>{
      if(this.closing)throw new Error("插件正在关闭");
      if(JSON.stringify(latest.sourceTags)!==preview.snapshot)throw new Error("标签数据已变化，请关闭后重新预览");
      const records=Object.values(latest.sourceTags),matches=records.filter(r=>r.labels.some(t=>t.toLocaleLowerCase()===oldKey));
      if(!matches.length)throw new Error("标签已不存在");
      if(oldKey!==newKey&&records.some(r=>r.labels.some(t=>t.toLocaleLowerCase()===newKey)))throw new Error("新标签名已存在，请使用其他名称");
      for(const r of matches){r.labels=normalizeActionTags(r.labels.map(t=>t.toLocaleLowerCase()===oldKey?newLabel:t));r.updatedAt=new Date().toISOString();}
      return latest;
    },{metadataDetail:{tagRename:{oldLabel:preview.oldLabel,newLabel}}});
  }
  async editCollectionAction(options, operation) {
    if(!["name","alias","ontology","complete","tags"].includes(operation))throw new Error("未知行动操作");
    if(operation==="tags"&&!(Array.isArray(options?.tags)&&options.tags.every(t=>typeof t==="string")))throw new Error("标签格式不正确");
    if(!options||!["contextId","sourceNotePath",...(operation==="name"?[]:["tabId","itemId"])].every(k=>typeof options[k]==="string"&&options[k].trim()))throw new Error("行动身份信息不完整");
    const fastStart=performance.now();
    let identity=this.findCollectionActionIdentity(options);
    this.recordCollectionInteraction(identity?"identity.fast":"identity.missing",fastStart);
    if(!identity)identity=await this.measureCollectionInteraction("identity.register",()=>this.ensureCollectionActionIdentity(options));
    const membership={...this.store.memberships[identity.membershipId],lastKnownLabel:identity.sourceLabel};
    if(operation==="name") return this.openLocalNameModal(membership);
    if(operation==="alias") {const link=this.store.membershipSourceLinks[buildLinkId(identity.membershipId,identity.sourceCardId)];return this.openSourceAliasModal(membership,link,identity.card);}
    if(operation==="ontology") return this.measureCollectionInteraction("editor.open",()=>this.openSourceOntology(identity.card));
    if(operation==="tags") return this.setSourceTags(identity.membershipId,identity.sourceCardId,options.tags,options.expectedTags,options.expectedTagSnapshot);
    if(operation==="complete") return this.toggleSourceCompletion(identity.membershipId,identity.sourceCardId,options.completed===true);
    throw new Error("未知行动操作");
  }
  getCollectionActionName(membershipId) {
    return (this.store.membershipKeywords[membershipId]||[]).map(id=>this.store.keywords[id]).filter(k=>k?.label).sort(compareAlphabetical)[0]?.label||"";
  }

  async fetchActiveCandidates(domains = ["project", "goal"], trace = "none") {
    const mandala = this.mandalaApi();
    const byDomain = {};
    await Promise.all(domains.map(async (domain) => {
      const method = domain === "goal" ? "listEffectiveGoalOperationalContextKeys" : "listEffectiveOperationalContextKeys";
      if (typeof mandala?.[method] !== "function") {
        byDomain[domain] = { ok: false, reason: "qualification-provider-unavailable", targets: [] };
        return;
      }
      try {
        const snapshot = await this.readCoordinator.read(mandala, `qualification:${domain}`, () => mandala[method]({ consumer: "next-action-workbench" }), { stage: "qualification", trace });
        if (this.mandalaApi() !== mandala) throw Object.assign(new Error("\u8D44\u683C\u670D\u52A1\u5DF2\u66F4\u6362"), { code: "READ_STALE" });
        const result = resolveActiveTargets(snapshot, { domain });
        byDomain[domain] = result.ok ? result : { ...result, ...snapshotFailure(snapshot, result) };
      } catch (error) {
        byDomain[domain] = { ok: false, reason: error.code || "qualification-failed", targets: [] };
      }
      this.diagnostics.emit("qualification-result", { trace, domain, outcome: byDomain[domain].ok ? "complete" : "failed" });
    }));
    return { ok: domains.every((domain) => byDomain[domain]?.ok), byDomain, targets: domains.flatMap((domain) => byDomain[domain]?.ok ? byDomain[domain].targets : []) };
  }
  async openImportModal() {
    const initialDomain = this.store.uiState.selectedDomain === "project" ? "project" : "goal";
    if (this.readOnlyReason) {
      new import_obsidian.Notice(this.readOnlyReason);
      return;
    }
    const result = await this.fetchActiveCandidates();
    if (!result.ok) {
      new import_obsidian.Notice("\u65E0\u6CD5\u6838\u9A8C\u6709\u6548\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E3B\u952E\uFF1B\u672C\u6B21\u672A\u5F00\u653E\u5BFC\u5165\u3002\u8BF7\u786E\u8BA4 Workspace Mount\u3001\u9879\u76EE\u6267\u884C\u7EB5\u89C8\u4E0E Mandala \u5DF2\u542F\u7528\u3002");
      return;
    }
    const imported = new Set(Object.values(this.store.memberships).filter((item) => !item.revokedAt).map((item) => item.id));
    new ImportPrimaryModal(this.app, this, result.targets.filter((target) => !imported.has(target.membershipId)), initialDomain).open();
  }
  async importCandidates(candidates) {
    await this.mutateStore("import-primary-keys", (latest) => importTargets(latest, candidates));
    await this.refreshImportedMemberships(candidates.map((candidate) => candidate.membershipId));
    new import_obsidian.Notice(`\u5DF2\u5BFC\u5165 ${candidates.length} \u4E2A\u4E3B\u952E`);
  }
  openLocalNameModal(membership) {
    if (this.readOnlyReason) {
      new import_obsidian.Notice(this.readOnlyReason);
      return;
    }
    this.openNameModal({
      editorKey: `primary:${membership.id}`,
      title: "\u884C\u52A8\u53F0\u540D\u79F0",
      subtitle: `\u6765\u6E90\u4E3B\u952E\uFF1A${membership.lastKnownLabel}`,
      help: "\u8FD9\u4E2A\u540D\u79F0\u53EA\u7528\u4E8E\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0\u7684\u9879\u76EE\u6216\u76EE\u6807\u6E05\u5355\uFF0C\u4E0D\u4F1A\u6539\u5199\u6765\u6E90\u4E3B\u952E\u3002",
      placeholder: "\u4F8B\u5982\uFF1A009Z- \u70B9\u710A\u673A\u7684\u5408\u540C\u7F16\u53F7",
      getValue: () => this.getCollectionActionName(membership.id) || text(membership.lastKnownLabel,membership.id),
      save: (value) => this.setLocalName(membership.id, value)
    });
  }
  openSourceAliasModal(membership, link, sourceCard) {
    if (this.readOnlyReason) {
      new import_obsidian.Notice(this.readOnlyReason);
      return;
    }
    this.openNameModal({
      editorKey: `source:${link.id}`,
      title: "\u4E0B\u4E00\u6B65\u5F85\u529E\u4E49\u540D",
      subtitle: `\u6765\u6E90\u5F85\u529E\uFF1A${sourceCard.label || sourceCard.nodeKey || "\u5931\u8054\u6761\u76EE"}`,
      help: "\u4E49\u540D\u53EA\u7528\u4E8E\u8FD9\u4E2A\u4E3B\u952E\u4E0B\u7684\u4E0B\u4E00\u6B65\u5F85\u529E\u663E\u793A\u3001\u641C\u7D22\u4E0E\u6392\u5E8F\uFF0C\u4E0D\u4F1A\u6539\u5199\u6765\u6E90\u6761\u76EE\u3002",
      placeholder: "\u4F8B\u5982\uFF1AA- \u5148\u786E\u8BA4\u5408\u540C\u7F16\u53F7\u89C4\u5219",
      clearLabel: "\u6E05\u9664\u4E49\u540D",
      getValue: () => normalizeKeywordLabel(this.store.sourceAliases[link.id]?.label) || text(sourceCard.label || sourceCard.nodeKey,link.sourceCardId),
      save: (value) => this.setSourceAlias(membership.id, link.sourceCardId, value)
    });
  }
  openNameModal(config) {
    if (this.closing || this.nameEditorRegistry.closing) {
      new import_obsidian.Notice("\u63D2\u4EF6\u6B63\u5728\u5173\u95ED\uFF0C\u6682\u65F6\u4E0D\u80FD\u6253\u5F00\u540D\u79F0\u7F16\u8F91\u5668\u3002");
      return null;
    }
    const modal = new AutoSaveNameModal(this.app, this, config);
    const admitted = this.nameEditorRegistry.admit(modal);
    if (admitted.status === "existing") {
      admitted.editor.focusInput();
      return admitted.editor;
    }
    if (admitted.status === "saving") {
      new import_obsidian.Notice("\u8BE5\u540D\u79F0\u6B63\u5728\u4FDD\u5B58\uFF0C\u8BF7\u7A0D\u540E\u518D\u6253\u5F00\u3002");
      return admitted.editor;
    }
    if (admitted.status !== "admitted") return null;
    modal.open();
    return modal;
  }
  trackNameModalClose(modal, flushPromise) {
    return this.nameEditorRegistry.trackClose(modal, flushPromise, (error) => {
      console.error("[NextActionWorkbench][name-editor][implicit-close-save-failed]", { editorKey: modal.editorKey, message: error?.message || String(error) });
      new import_obsidian.Notice("\u540D\u79F0\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u786E\u8BA4\u3002");
    });
  }
  async setLocalName(membershipId, label) {
    await this.mutateStore("set-primary-key-local-name", (latest) => setMembershipLocalName(latest, membershipId, label));
  }
  async setSourceAlias(membershipId, sourceCardId, label) {
    await this.mutateStore("set-source-card-local-alias", (latest) => setMembershipSourceAlias(latest, membershipId, sourceCardId, label));
  }
  async setSourceTags(membershipId, sourceCardId, tags, expectedTags, expectedTagSnapshot) {
    await this.mutateStore("set-source-card-tags", latest => {
      if(expectedTagSnapshot!==undefined&&JSON.stringify(latest.sourceTags)!==expectedTagSnapshot)throw new Error("标签目录已变化，请重新打开编辑器");
      if(expectedTags!==undefined){const current=latest.sourceTags[buildLinkId(membershipId,sourceCardId)]?.labels||[];
        if(JSON.stringify(normalizeActionTags(current))!==JSON.stringify(normalizeActionTags(expectedTags)))throw new Error("标签已在其他窗口修改，请重新打开编辑器");}
      return setMembershipSourceTags(latest,membershipId,sourceCardId,tags);
    });
  }
  async toggleSourceCompletion(membershipId, sourceCardId, completed) {
    await this.mutateStore("toggle-source-card-completion", (latest) => setMembershipSourceCompletion(latest, membershipId, sourceCardId, completed));
  }
  queueManagedContextRenameRefresh(detail) {
    if (detail?.version !== 1 || typeof detail.nodeKey !== "string") return;
    const parts = detail.nodeKey.split("|");
    if (parts.length !== 5 || parts[0] !== "jump:v1:workspace-mount-view" || parts[2] !== "tab") return;
    try { if (decodeURIComponent(parts[1]) !== detail.sourceScope) return; } catch { return; }
    // sourceScope in this event belongs to Workspace; membership scope belongs to Mandala.
    const scopes = new Set(Object.values(this.store.memberships).filter(m => !m.revokedAt
      && m.primaryRef.domain === "project" && m.primaryRef.sourceKey === detail.nodeKey).map(m => m.primaryRef.sourceScope));
    if (!scopes.size || this.closing || this.readOnlyReason) return;
    for (const sourceNotePath of scopes) this.queueMandalaTrackingRefresh({ sourceType: "workspace", entityId: detail.nodeKey, sourceNotePath });
    // Stopped projects are absent from active targets. Read declarations independently.
    this.managedRenameSequences ||= new Map();
    const sequence = (this.managedRenameSequenceCounter = (this.managedRenameSequenceCounter || 0) + 1);
    this.managedRenameSequences.set(detail.nodeKey, sequence);
    const run = Promise.resolve().then(async () => {
      await this.mandalaTrackingRun;
      const overview = this.overviewApi(), epoch = this.readCoordinator.epoch;
      if (typeof overview?.getWorkspaceOperationalContextKeySnapshot !== "function" || overview.operationalLifecyclePolicyV1 !== "tracking-only-v2") return;
      const current = () => !this.closing && !this.readOnlyReason && this.overviewApi() === overview && overview.operationalLifecyclePolicyV1 === "tracking-only-v2"
        && this.readCoordinator.epoch === epoch && this.managedRenameSequences.get(detail.nodeKey) === sequence;
      if (!current()) return;
      const snapshot = await overview.getWorkspaceOperationalContextKeySnapshot({ operationalLifecyclePolicyV1: "tracking-only-v2", sourceNotePath: detail.sourceScope, primaryNodeKeys: [detail.nodeKey] });
      if (!current() || !snapshot?.ok || snapshot.operationalLifecyclePolicyV1 !== "tracking-only-v2" || !snapshot.complete || snapshot.contractVersion !== 1 || snapshot.hasMore || snapshot.truncated
        || snapshot.sourceNotePath !== detail.sourceScope || snapshot.items?.length !== 1) return;
      const item = snapshot.items[0];
      if (item.primaryNodeKey !== detail.nodeKey || item.sourceNotePath !== detail.sourceScope || !item.currentDeclaration?.displayLabel) return;
      await this.mutateStore("context-key-source-name", store => {
        const next = JSON.parse(JSON.stringify(store)); let changed = false;
        for (const m of Object.values(next.memberships)) if (!m.revokedAt && m.primaryRef.domain === "project"
          && m.primaryRef.sourceKey === detail.nodeKey && scopes.has(m.primaryRef.sourceScope)
          && m.lastKnownLabel !== item.currentDeclaration.displayLabel) {
          m.lastKnownLabel = item.currentDeclaration.displayLabel; changed = true;
        }
        return changed ? next : null;
      }, { shouldApply: current, skipNull: true });
      if (current()) this.renderViews();
    }).catch(() => {
      if (!this.closing) { for (const m of Object.values(this.store.memberships)) if (m.primaryRef.sourceKey === detail.nodeKey)
        this.refreshDetails.set(m.id, { ...this.refreshDetails.get(m.id), message: "名称同步尚未核验，请重新打开名称管理并恢复同步。" }); this.renderViews(); }
    }).finally(() => { this.backgroundReads.delete(run); if (this.managedRenameSequences.get(detail.nodeKey) === sequence) this.managedRenameSequences.delete(detail.nodeKey); });
    this.backgroundReads.add(run);
  }
  queueMandalaTrackingRefresh(detail) {
    if (this.closing || this.readOnlyReason || detail?.sourceType !== "workspace"
      || typeof detail.entityId !== "string" || !detail.entityId.startsWith("jump:v1:")
      || typeof detail.sourceNotePath !== "string" || !detail.sourceNotePath) return;
    const ids = Object.values(this.store.memberships).filter(m => !m.revokedAt
      && m.primaryRef.domain === "project" && m.primaryRef.sourceKey === detail.entityId
      && m.primaryRef.sourceScope === detail.sourceNotePath).map(m => m.id);
    if (!ids.length) return;
    this.mandalaTrackingPending ||= new Set();
    ids.forEach(id => this.mandalaTrackingPending.add(id));
    // Invalidate immediately so an older eligibility read cannot commit after this event.
    this.readCoordinator.invalidate();
    if (this.mandalaTrackingRun) return;
    const run = Promise.resolve().then(async () => {
      for (let round = 0; round < 3 && !this.closing && this.mandalaTrackingPending.size; round++) {
        const batch = [...this.mandalaTrackingPending];
        this.mandalaTrackingPending.clear();
        const completed = await this.refreshImportedMemberships(batch, { restrictLifecycle: true, quiet: true });
        if (!completed && !this.closing) batch.forEach(id => this.mandalaTrackingPending.add(id));
      }
      if (this.mandalaTrackingPending.size && !this.closing) {
        for (const id of this.mandalaTrackingPending) this.refreshDetails.set(id, { ...this.refreshDetails.get(id), message: "追踪状态已变化；自动核验未完成，请手动刷新。" });
        this.renderViews();
      }
    }).catch(error => {
      console.warn("[NextActionWorkbench][tracking][tx:event][refresh-failed]", { code: error?.code || "REFRESH_FAILED" });
    }).finally(() => {
      this.mandalaTrackingRun = null;
      this.backgroundReads.delete(run);
    });
    this.mandalaTrackingRun = run;
    this.backgroundReads.add(run);
  }

  async refreshImportedMemberships(requestedIds = [], options = {}) {
    if (this.closing || this.readOnlyReason) return Promise.resolve(false);
    const ids = [...new Set(requestedIds)].sort();
    if (options.restrictLifecycle && !ids.length) return false;
    const key = JSON.stringify([this.readCoordinator.epoch, ids, !!options.restrictLifecycle, !!options.quiet]);
    if (this.refreshRuns.has(key)) return this.refreshRuns.get(key);
    const run = this.runMembershipRefresh(ids, options).finally(() => {
      if (this.refreshRuns.get(key) === run) this.refreshRuns.delete(key);
    });
    this.refreshRuns.set(key, run);
    return run;
  }
  async runMembershipRefresh(ids, options = {}) {
    if (options.restrictLifecycle && !ids.length) return false;
    const generation = ++this.refreshGeneration, trace = `r${generation}`, epoch = this.readCoordinator.epoch;
    const requested = new Set(ids);
    const selected = Object.values(this.store.memberships).filter((m) => !m.revokedAt && (!requested.size || requested.has(m.id)));
    if (options.restrictLifecycle && !selected.length) return false;
    const domains = requested.size ? [...new Set(selected.map((m) => m.primaryRef.domain))] : ["project", "goal"];
    domains.forEach((domain) => this.domainGenerations.set(domain, generation));
    selected.forEach((m) => this.memberGenerations.set(m.id, generation));
    this.diagnostics.emit("refresh-start", { trace, count: selected.length, epoch });
    const mandalaProvider = this.mandalaApi();
    const activeResult = await this.fetchActiveCandidates(domains, trace);
    const activeTargets = new Map(activeResult.targets.map((t) => [t.membershipId, t]));
    const overview = this.overviewApi();
    const observations = /* @__PURE__ */ new Map();
    await Promise.all(selected.map(async (membership) => {
      const domain = membership.primaryRef.domain;
      if (options.restrictLifecycle && !activeResult.byDomain[domain]?.ok) return;
      if (activeResult.byDomain[domain]?.ok && !activeTargets.has(membership.id)) return;
      const fresh = activeTargets.get(membership.id);
      const aliases = fresh?.primaryAliases || membership.primaryAliases;
      try {
        if (typeof overview?.getPrimaryCollectionCardSnapshot !== "function") throw Object.assign(new Error("\u6765\u6E90\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA"), { code: "SOURCE_UNAVAILABLE" });
        const options = { domain, primaryNodeKey: membership.primaryRef.sourceKey, primaryAliases: aliases, limit: 200 };
        const key = JSON.stringify(["source", membership.primaryRef.sourceScope, options]);
        const snapshot = await this.readCoordinator.read(overview, key, () => overview.getPrimaryCollectionCardSnapshot(options), { trace, stage: "source" });
        if (snapshot?.ok !== true || !Array.isArray(snapshot.items)) throw Object.assign(new Error(snapshot?.reason || "\u6765\u6E90\u5FEB\u7167\u4E0D\u5B8C\u6574"), { code: "SOURCE_INVALID" });
        observations.set(membership.id, { ok: true, snapshot, complete: snapshot.complete === true && !snapshot.hasMore && !snapshot.truncated });
      } catch (error) {
        observations.set(membership.id, { ok: false, state: error.code === "READ_TIMEOUT" ? "timeout" : "provider-unavailable", reason: error.code || "SOURCE_FAILED" });
      }
    }));
    const current = () => !this.closing && this.readCoordinator.epoch === epoch && this.overviewApi() === overview && (!options.restrictLifecycle || this.mandalaApi() === mandalaProvider);
    if (!current()) {
      this.diagnostics.emit("refresh-end", { trace, outcome: "stale" });
      return false;
    }
    let applied = false;
    await this.mutateStore("refresh-imported-memberships", (latest) => {
      if (!current()) return null;
      let next = latest;
      for (const domain of domains) {
        const result = activeResult.byDomain[domain];
        if (result?.ok && this.domainGenerations.get(domain) === generation) {
          next = updateMembershipLifecycle(next, result.targets, true, void 0, { domain, eligibilityRevision: result.revision, ...(options.restrictLifecycle ? { membershipIds: ids } : {}) });
          next = importTargets(next, result.targets.filter((t) => (!options.restrictLifecycle || requested.has(t.membershipId)) && next.memberships[t.membershipId] && !next.memberships[t.membershipId].revokedAt));
        }
      }
      for (const membership of selected) {
        if (this.memberGenerations.get(membership.id) !== generation || this.domainGenerations.get(membership.primaryRef.domain) !== generation) continue;
        if (!next.memberships[membership.id] || next.memberships[membership.id].revokedAt || next.memberships[membership.id].active === false) continue;
        const o = observations.get(membership.id);
        if (!o) continue;
        applied = true;
        next = o.ok ? applySourceBucket(next, membership.id, o.complete ? o.snapshot : { ...o.snapshot, truncated: true }) : markMembershipObservation(next, membership.id, o.state);
        const qualification = activeResult.byDomain[membership.primaryRef.domain];
        const prior = this.refreshDetails.get(membership.id);
        this.refreshDetails.set(membership.id, {
          eligibility: !!qualification?.ok,
          source: o.ok && o.complete,
          lastSuccess: o.ok && o.complete ? (/* @__PURE__ */ new Date()).toLocaleString() : prior?.lastSuccess,
          message: !qualification?.ok ? `\u8D44\u683C\u6838\u9A8C\u5931\u8D25\uFF1A${qualification?.reason || "\u672A\u77E5\u539F\u56E0"}\uFF1B\u53EF\u4FDD\u7559\u8349\u7A3F\u5E76\u91CD\u8BD5` : !o.ok ? `\u6765\u6E90\u8BFB\u53D6\u5931\u8D25\uFF1A${o.reason}\uFF1B\u8BF7\u91CD\u8BD5\u5237\u65B0` : !o.complete ? "\u6765\u6E90\u4E3A\u90E8\u5206\u7ED3\u679C\uFF0C\u65E7\u94FE\u63A5\u5DF2\u4FDD\u7559" : ""
        });
      }
      if (options.restrictLifecycle && !domains.some(d => activeResult.byDomain[d]?.ok)) return null;
      return next;
    }, { skipNull: true, shouldApply: () => current() && domains.every((d) => this.domainGenerations.get(d) === generation) });
    const complete = current() && domains.every((d) => this.domainGenerations.get(d) === generation) && activeResult.ok && [...observations.values()].every((o) => o.ok && o.complete);
    this.diagnostics.emit("refresh-end", { trace, outcome: complete ? "complete" : "partial", count: observations.size });
    if (!this.closing && !options.quiet) new import_obsidian.Notice(complete ? "\u4E0B\u4E00\u6B65\u5F85\u529E\u6765\u6E90\u5DF2\u5237\u65B0" : "\u5237\u65B0\u672A\u5B8C\u6574\u5B8C\u6210\uFF0C\u65E7\u94FE\u63A5\u5DF2\u4FDD\u7559\uFF1B\u53EF\u67E5\u770B\u4E3B\u952E\u4E0B\u65B9\u539F\u56E0\u5E76\u91CD\u8BD5");
    return complete;
  }
  refreshAfterCommit(membershipId, nodeKey) {
    const run = (async () => {
      for (let attempt = 0; attempt < 3 && !this.closing; attempt++) {
        try {
          const complete = await this.refreshImportedMemberships([membershipId]);
          if (this.closing) return;
          const visible = Object.values(this.store.membershipSourceLinks || {}).some((link) => link.membershipId === membershipId && this.store.sourceCards?.[link.sourceCardId]?.nodeKey === nodeKey && link.observationState === "fresh-complete");
          if (complete && visible) {
            new import_obsidian.Notice("\u5DF2\u521B\u5EFA\u7684\u5F85\u529E\u5DF2\u51FA\u73B0\u5728\u884C\u52A8\u53F0");
            return;
          }
        } catch (_) {
        }
      }
      if (!this.closing) new import_obsidian.Notice("\u5DF2\u5199\u5165 Collection Card\uFF1B\u884C\u52A8\u53F0\u6682\u672A\u5237\u65B0\uFF0C\u8BF7\u7A0D\u540E\u5237\u65B0\u6765\u6E90");
    })();
    this.backgroundReads.add(run);
    void run.finally(() => this.backgroundReads.delete(run)).catch(() => {
    });
    return run;
  }
  confirmRevokeMembership(membership) {
    new ConfirmModal(this.app, {
      title: "\u79FB\u51FA\u884C\u52A8\u53F0",
      message: `\u79FB\u51FA\u201C${membership.lastKnownLabel}\u201D\uFF1F\u5DF2\u5F62\u6210\u7684\u884C\u52A8\u7ED3\u6784\u4E0D\u4F1A\u5220\u9664\uFF0C\u91CD\u65B0\u5BFC\u5165\u53EF\u7EE7\u7EED\u4F7F\u7528\u3002`,
      confirmLabel: "\u79FB\u51FA",
      onConfirm: async () => {
        await this.mutateStore("revoke-membership", (latest) => {
          const current = latest.memberships[membership.id];
          if (current) {
            current.revokedAt = (/* @__PURE__ */ new Date()).toISOString();
            current.active = false;
            current.lifecycleState = "membership-inactive";
          }
          return latest;
        });
      }
    }).open();
  }
  getOntologyEditor(notify = true) {
    const editor = this.workspaceApi()?.ontologyEditor || null;
    const capabilities = new Set(Array.isArray(editor?.capabilities) ? editor.capabilities : []);
    const compatible = text(editor?.providerGeneration) && typeof editor?.hashOntology === "function" && typeof editor?.validateOntology === "function" && typeof editor?.hasContent === "function" && typeof editor?.openExternalEditor === "function" && typeof editor?.closeOwnerEditors === "function" && ["external-owner-callbacks", "one-cell-root", "recursive-child-schema", "cas-conflict-current-formal", "durable-owner-recovery", "provider-generation-lease"].every((value) => capabilities.has(value));
    if (!compatible && notify) new import_obsidian.Notice("Workspace Mount Ontology \u7F16\u8F91\u5668\u672A\u5C31\u7EEA\u6216\u7248\u672C\u4E0D\u517C\u5BB9");
    return compatible ? editor : null;
  }
  hasOntologyContent(ontology) {
    if (ontology == null) return false;
    const editor = this.getOntologyEditor(false);
    if (!editor) return true;
    try {
      return editor.hasContent(clone(ontology)) === true;
    } catch (_) {
      return true;
    }
  }
  async openSourceOntology(sourceCard) {
    const editor = this.getOntologyEditor(true);
    if (!editor || this.ownerUnavailable || !sourceCard?.id || !sourceCard?.notePath) return false;
    const current = this.store.ontologies[sourceCard.id];
    const formalOntology = current?.formalOntology ?? null;
    let issuedDraftRevision = Number(this.store.recoveryAuthorities[sourceCard.id]?.lastDraftRevision) || 0;
    try {
      const handle = await editor.openExternalEditor({
        ownerNamespace: ONTOLOGY_OWNER_NAMESPACE,
        ownerPluginId: PLUGIN_ID,
        ownerKey: sourceCard.id,
        sourceNotePath: sourceCard.notePath,
        canonicalSide: "source-card",
        itemTitle: sourceCard.label,
        modalTitle: "\u4E0B\u4E00\u6B65\u884C\u52A8\u7ED3\u6784",
        modalSubtitle: `${sourceCard.label} \xB7 \u72EC\u7ACB\u7ED3\u6784\uFF0C\u4E0D\u5171\u4EAB Schema`,
        formalOntology: clone(formalOntology),
        isOwnerAlive: () => !this.ownerUnavailable && Boolean(this.store.sourceCards[sourceCard.id]),
        loadRecovery: async () => clone(this.store.recoveryDrafts[sourceCard.id]?.record || null),
        persistRecovery: async (payload) => {
          const draftRevision = ++issuedDraftRevision;
          await this.mutateStore("ontology-recovery-persist", (latest) => persistRecoveryDraft(latest, sourceCard.id, payload.record, draftRevision), { render: false });
          return true;
        },
        clearRecovery: async (payload) => {
          const draftRevision = ++issuedDraftRevision;
          await this.mutateStore("ontology-recovery-clear", (latest) => clearRecoveryDraft(latest, sourceCard.id, payload.session || {}, draftRevision), { render: false });
          return true;
        },
        commitOntology: async (payload) => await this.commitOntology(sourceCard.id, payload),
        onClosed: ({ handleId }) => {
          const matching = Array.from(this.activeOntologyHandles).find((entry) => text(entry?.handleId) === text(handleId));
          if (matching) this.activeOntologyHandles.delete(matching);
          this.renderViews();
        }
      });
      if (handle?.ok !== true) throw new Error("Ontology editor \u672A\u8FD4\u56DE\u6709\u6548\u53E5\u67C4");
      this.activeOntologyHandles.add(handle);
      return true;
    } catch (error) {
      console.error("[NextActionWorkbench][ontology][tx:open][failed]", { sourceCardId: sourceCard.id, message: error?.message || String(error), code: error?.code || "" });
      new import_obsidian.Notice(`\u884C\u52A8\u7ED3\u6784\u6253\u5F00\u5931\u8D25\uFF1A${error?.message || String(error)}`);
      return false;
    }
  }
  async commitOntology(sourceCardId, payload) {
    const editor = this.getOntologyEditor(false);
    if (!editor || text(editor.providerGeneration) !== text(payload.providerGeneration) || this.ownerUnavailable) {
      const error = new Error("Ontology provider \u6216 owner \u5DF2\u53D8\u5316\uFF0C\u6B63\u5F0F\u6570\u636E\u672A\u5199\u5165");
      error.code = "ONTOLOGY_PROVIDER_STALE";
      throw error;
    }
    const validation = editor.validateOntology(clone(payload.ontology));
    if (validation?.ok !== true) throw new Error(validation?.errors?.[0] || "Ontology \u6570\u636E\u65E0\u6548");
    const committedHash = editor.hashOntology(payload.ontology);
    await this.mutateStore("ontology-commit", (latest) => {
      if (!latest.sourceCards[sourceCardId]) {
        const error = new Error("Collection Card owner \u5DF2\u4E0D\u5B58\u5728");
        error.code = "ONTOLOGY_OWNER_UNAVAILABLE";
        throw error;
      }
      const current = latest.ontologies[sourceCardId] || { revision: 0, formalOntology: null };
      const currentHash = editor.hashOntology(current.formalOntology ?? null);
      if (currentHash !== text(payload.baseOntologyHash)) {
        const error = new Error("\u884C\u52A8\u7ED3\u6784\u6B63\u5F0F\u6570\u636E\u5DF2\u53D8\u5316\uFF0C\u5F53\u524D\u8349\u7A3F\u672A\u8986\u76D6");
        error.code = "ONTOLOGY_CONFLICT";
        error.currentFormalOntology = clone(current.formalOntology ?? null);
        error.currentFormalHash = currentHash;
        throw error;
      }
      latest.ontologies[sourceCardId] = Object.assign({}, current, {
        sourceCardId,
        revision: (Number(current.revision) || 0) + 1,
        formalOntology: clone(payload.ontology),
        hash: committedHash,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return latest;
    });
    const reread = this.store.ontologies[sourceCardId];
    if (editor.hashOntology(reread?.formalOntology ?? null) !== committedHash) throw new Error("\u884C\u52A8\u7ED3\u6784\u56DE\u8BFB hash \u6821\u9A8C\u5931\u8D25");
    return { hash: committedHash };
  }
  async revealSource(membership, sourceCard) {
    const api = this.collectionApi();
    if (typeof api?.openNode !== "function") {
      new import_obsidian.Notice("Collection Card \u5C1A\u672A\u52A0\u8F7D\u6765\u6E90\u5B9A\u4F4D\u80FD\u529B\uFF0C\u8BF7\u52A0\u8F7D\u540E\u91CD\u8BD5");
      return false;
    }
    const nodeKey = text(sourceCard?.nodeKey);
    if (!nodeKey) {
      new import_obsidian.Notice("\u6765\u6E90\u6761\u76EE\u5730\u5740\u7F3A\u5931\uFF0C\u8BF7\u5237\u65B0\u8BE5\u4E3B\u952E\u540E\u91CD\u8BD5");
      return false;
    }
    const traceId = `naw-return-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const revealed = await api.openNode(nodeKey, { evaTraceId: traceId });
      const ok = revealed === true;
      console.info(`[NextActionWorkbench][navigation][tx:${traceId}][result]`, {
        nodeKey,
        providerId: "collection-card-view",
        status: ok ? "revealed" : "not-found"
      });
      if (!ok) new import_obsidian.Notice("\u672A\u627E\u5230 Collection Card \u5BF9\u5E94\u7684 Tab \u6216\u6761\u76EE\uFF0C\u8BF7\u5237\u65B0\u6765\u6E90\u540E\u91CD\u8BD5");
      return ok;
    } catch (error) {
      console.warn(`[NextActionWorkbench][navigation][tx:${traceId}][failed]`, {
        providerId: "collection-card-view",
        status: "failed"
      });
      new import_obsidian.Notice("Collection Card \u6765\u6E90\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u63D2\u4EF6\u52A0\u8F7D\u5B8C\u6210\u540E\u91CD\u8BD5");
      return false;
    }
  }
};
