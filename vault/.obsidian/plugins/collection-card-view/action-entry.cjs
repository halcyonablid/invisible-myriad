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

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/collection-card-view/action-entry.mjs
var action_entry_exports = {};
__export(action_entry_exports, {
  create: () => create,
  enqueue: () => enqueue,
  prepare: () => prepare,
  syncHosts: () => syncHosts
});
module.exports = __toCommonJS(action_entry_exports);
var import_node_crypto = require("node:crypto");

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/next-action-workbench/src/refresh-support.mjs
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

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/next-action-workbench/src/store.mjs
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
var encode = (value) => encodeURIComponent(text(value));
var unique = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean)));
var keywordCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
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

// state/verification_inputs/next-action-timeout-implementation-20261002/plugins/collection-card-view/action-entry.mjs
var hash = (value) => (0, import_node_crypto.createHash)("sha256").update(value).digest("hex");
var plain = (value) => value && typeof value === "object" && !Array.isArray(value);
var fail = (reason) => {
  throw new Error(reason);
};
var bounded = async (task, stage = "qualification") => {
  let timer;
  try {
    return await Promise.race([task(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`${stage === "qualification" ? "\u6709\u6548\u4E3B\u952E" : "\u4E0A\u4E0B\u6587\u5B9A\u4E49"}\u8BFB\u53D6\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5`), { code: "READ_TIMEOUT", stage })), 8e3);
    })]);
  } finally {
    clearTimeout(timer);
  }
};
function enqueue(plugin, path, task) {
  plugin.actionWriteQueues ||= /* @__PURE__ */ new Map();
  const run = (plugin.actionWriteQueues.get(path) || Promise.resolve()).catch(() => {
  }).then(task);
  plugin.actionWriteQueues.set(path, run);
  void run.finally(() => {
    if (plugin.actionWriteQueues.get(path) === run) plugin.actionWriteQueues.delete(path);
  }).catch(() => {
  });
  return run;
}
function syncHosts(plugin, path, data) {
  for (const leaf of plugin.app.workspace.getLeavesOfType("collection-card-view")) {
    const view = leaf.view;
    if (view?.dataPath !== path) continue;
    const activeTabId = view.data?.activeTabId;
    const collapsed = view.data?.tabTreeCollapsedById;
    view.data = JSON.parse(JSON.stringify(data));
    if (view.data.tabsById[activeTabId]) view.data.activeTabId = activeTabId;
    view.data.tabTreeCollapsedById = collapsed || {};
  }
}
function assertAlive(plugin) {
  if (plugin.actionEntryClosed) fail("Collection Card \u6B63\u5728\u5378\u8F7D\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u540E\u91CD\u8BD5");
}
async function readTarget(plugin, options) {
  assertAlive(plugin);
  const domain = options.domain;
  if (!["project", "goal"].includes(domain)) fail("\u4E3B\u952E\u7C7B\u578B\u65E0\u6548");
  const api = globalThis.window?.__mandalaTimeBlocksPluginApi || plugin.app.plugins?.plugins?.["mandala-time-blocks"]?.api;
  const method = domain === "goal" ? "listEffectiveGoalOperationalContextKeys" : "listEffectiveOperationalContextKeys";
  if (typeof api?.[method] !== "function") fail("\u6709\u6548\u4E3B\u952E\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA");
  const snapshot = await bounded(() => api[method]({ consumer: "collection-card-view.action-entry" }));
  const failure = snapshotFailure(snapshot, resolveActiveTargets(snapshot, { domain }));
  if (failure) throw Object.assign(new Error(failure.reason), failure);
  const target = snapshot.targets.find((t) => t.sourceKey === options.primaryNodeKey && t.sourceScope === options.sourceScope);
  if (!target) fail("\u8BE5\u4E3B\u952E\u5F53\u524D\u5DF2\u4E0D\u5728\u6709\u6548\u64CD\u4F5C\u4E0A\u4E0B\u6587\u4E2D");
  const requested = options.sourceNotePath || plugin.getDefaultSourceNotePath();
  const file = plugin.app.vault.getAbstractFileByPath(requested);
  if (!file || file.path !== requested || !file.extension) fail("Collection Card \u6765\u6E90\u7B14\u8BB0\u4E0D\u5B58\u5728");
  const dataPath = plugin.resolveDataPathForFile(file);
  const keywordPath = plugin.resolveTabCapsuleKeywordsPathForFile(file);
  for (const leaf of plugin.app.workspace.getLeavesOfType("collection-card-view")) {
    const view = leaf.view;
    if (view?.dataPath === dataPath && (view.provisioningLoadCount || !view.isReady())) fail("Collection Card \u6B63\u5728\u52A0\u8F7D\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  }
  const [raw, keywordRaw] = await Promise.all([plugin.app.vault.adapter.read(dataPath), plugin.app.vault.adapter.read(keywordPath)]);
  const data = JSON.parse(raw), keywords = JSON.parse(keywordRaw);
  if (data.schemaVersion !== "1.0" || !plain(data.tabsById) || !plain(data.itemsById) || !plain(data.childrenByParentByTab) || !plain(keywords.assignmentsByKeywordKey)) fail("Collection Card \u6570\u636E\u7ED3\u6784\u4E0D\u5B8C\u6574\uFF0C\u672A\u5199\u5165");
  const context = target.contextKey;
  const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const keys = await bounded(() => plugin.getProjectOverviewApi()?.getContextCapsuleKeys(), "context-binding");
  if (!Array.isArray(keys)) fail("\u64CD\u4F5C\u4E0A\u4E0B\u6587\u5B9A\u4E49\u5C1A\u672A\u5C31\u7EEA");
  const descriptors = keys.filter((k) => (k.contextKeyId || k.id) === context.contextKeyId);
  if (descriptors.length !== 1 || normalize(descriptors[0].displayLabel) !== normalize(context.displayLabel)) fail("\u64CD\u4F5C\u4E0A\u4E0B\u6587\u5B9A\u4E49\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00");
  const tabIds = /* @__PURE__ */ new Set();
  for (const entry of Object.values(keywords.assignmentsByKeywordKey)) {
    if (!plain(entry)) fail("Tab \u7ED1\u5B9A\u6570\u636E\u5F02\u5E38");
    const matchingKeys = keys.filter((k) => normalize(k.displayLabel) === normalize(entry.keyword) || !/^\d+[a-z0-9]*\s*[-－—–]/i.test(entry.keyword || "") && normalize(k.canonicalLabel) === normalize(entry.keyword));
    if (!matchingKeys.some((k) => (k.contextKeyId || k.id) === context.contextKeyId)) continue;
    if (matchingKeys.length !== 1 || entry.sourceNotePath && entry.sourceNotePath !== requested) fail("\u64CD\u4F5C\u4E0A\u4E0B\u6587\u7ED1\u5B9A\u4E0D\u552F\u4E00");
    if (!data.tabsById[entry.tabId]) fail("\u7ED1\u5B9A\u7684 Collection Card Tab \u5DF2\u4E0D\u5B58\u5728");
    tabIds.add(entry.tabId);
  }
  if (tabIds.size !== 1) fail(tabIds.size ? "\u8BE5\u4E3B\u952E\u5BF9\u5E94\u591A\u4E2A Tab\uFF0C\u8BF7\u5148\u5728 Collection Card \u4E2D\u660E\u786E\u7ED1\u5B9A" : "\u8BE5\u4E3B\u952E\u5C1A\u672A\u7ED1\u5B9A Collection Card Tab\uFF0C\u8BF7\u5148\u5B8C\u6210\u7ED1\u5B9A");
  const tabId = [...tabIds][0];
  const descriptor = {
    sourceNotePath: requested,
    tabId,
    tabName: data.tabsById[tabId].name,
    contextKeyId: context.contextKeyId,
    contextLabel: context.displayLabel,
    primaryNodeKey: target.sourceKey,
    sourceScope: target.sourceScope,
    domain,
    revision: hash(raw),
    bindingRevision: hash(keywordRaw)
  };
  return { descriptor, data, raw, keywordRaw, dataPath, keywordPath };
}
async function prepare(plugin, options) {
  try {
    return { ok: true, ...(await readTarget(plugin, options)).descriptor };
  } catch (error) {
    return { ok: false, reason: error.message, code: error.code || "PREPARE_FAILED", stage: error.stage || "prepare" };
  }
}
async function create(plugin, options) {
  const expected = options.destination;
  if (!expected || !/^[a-f0-9-]{36}$/i.test(options.requestId || "") || !String(options.title || "").trim()) return { ok: false, notWritten: true, reason: "\u65B0\u589E\u8BF7\u6C42\u4E0D\u5B8C\u6574" };
  const file = plugin.app.vault.getAbstractFileByPath(expected.sourceNotePath);
  if (!file) return { ok: false, notWritten: true, reason: "\u6765\u6E90\u7B14\u8BB0\u4E0D\u5B58\u5728" };
  const dataPath = plugin.resolveDataPathForFile(file);
  return enqueue(plugin, dataPath, async () => {
    let persisted = false, result, auditHandle, saveAttempted = false, confirmedAbsent = false;
    const audit = plugin.app.plugins?.plugins?.["operation-audit-trail"]?.api || globalThis.window?.__operationAuditTrailApi;
    try {
      assertAlive(plugin);
      const title = String(options.title).trim();
      const fingerprint = hash(JSON.stringify([expected.sourceNotePath, expected.tabId, expected.contextKeyId, expected.primaryNodeKey, expected.domain, title]));
      const requestId = options.requestId;
      const prior = JSON.parse(await plugin.app.vault.adapter.read(dataPath));
      const receipt = prior.actionEntryReceipts?.[requestId];
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) fail("\u540C\u4E00\u8BF7\u6C42\u7684\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u7F16\u8F91\u5668");
        return { ...receipt.result, replayed: true, deleted: !prior.itemsById?.[receipt.result.itemId] };
      }
      if (prior.schemaVersion !== "1.0" || !plain(prior.itemsById) || prior.actionEntryReceipts && !plain(prior.actionEntryReceipts)) fail("\u96C6\u5408\u5361\u6570\u636E\u5F02\u5E38\uFF0C\u65E0\u6CD5\u786E\u8BA4\u4E0A\u6B21\u4FDD\u5B58\u7ED3\u679C");
      confirmedAbsent = true;
      const current = await readTarget(plugin, expected);
      for (const key of ["sourceNotePath", "tabId", "contextKeyId", "primaryNodeKey", "domain", "sourceScope", "bindingRevision"]) {
        if (current.descriptor[key] !== expected[key]) fail("\u76EE\u6807 Tab \u6216\u4E0A\u4E0B\u6587\u7ED1\u5B9A\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u7F16\u8F91\u5668");
      }
      try {
        auditHandle = await audit?.beginOperation?.({
          "\u6765\u6E90\u63D2\u4EF6": "collection card view",
          "\u64CD\u4F5C\u7C7B\u578B": "\u65B0\u589E",
          "\u5BF9\u8C61\u7C7B\u578B": "tab\u6761\u76EE",
          "\u5BF9\u8C61\u540D\u79F0": title,
          "\u6570\u636E\u4F4D\u7F6E": dataPath,
          "\u4FEE\u6539\u6458\u8981": "\u4ECE\u4E0B\u4E00\u6B65\u884C\u52A8\u53F0\u65B0\u589E\u6839\u6761\u76EE",
          "\u6269\u5C55_collection_tab": expected.tabId,
          "\u6269\u5C55_request_id": requestId
        });
      } catch (_) {
      }
      const keywordRaw = await plugin.app.vault.adapter.read(current.keywordPath);
      if (keywordRaw !== current.keywordRaw) fail("\u4E0A\u4E0B\u6587\u7ED1\u5B9A\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u8BD5");
      assertAlive(plugin);
      const itemId = `item_naw_${requestId}`;
      const nodeKey = `jump:v1:${["collection-card-view", expected.sourceNotePath, "tab", expected.tabId, itemId].map(encodeURIComponent).join("|")}`;
      result = { ok: true, persisted: true, nodeKey, itemId, tabId: expected.tabId, sourceNotePath: expected.sourceNotePath };
      const dataFile = plugin.app.vault.getAbstractFileByPath(dataPath);
      if (!dataFile) fail("Collection Card \u539F\u5B50\u4FDD\u5B58\u80FD\u529B\u4E0D\u53EF\u7528");
      // Before saveAttempted: an unavailable center provider leaves the request notWritten.
      const centerConsumer = plugin.getCenterNamingConsumerV1();
      centerConsumer.preflight();
      // Fixed outside the publication callback, which the final publisher may run twice.
      const now = new Date().toISOString();
      let saved;
      saveAttempted = true;
      await centerConsumer.publish(dataPath, (raw) => {
        assertAlive(plugin);
        if (raw !== current.raw) fail("\u96C6\u5408\u5361\u5185\u5BB9\u521A\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u8BD5");
        const data = JSON.parse(raw);
        const rootKey = `${expected.tabId}::__root__`;
        if (!data.tabsById[expected.tabId] || data.itemsById[itemId] || data.childrenByParentByTab[rootKey] && !Array.isArray(data.childrenByParentByTab[rootKey])) fail("\u76EE\u6807\u6570\u636E\u5DF2\u53D8\u5316");
        data.itemsById[itemId] = { id: itemId, title, comment: "", tabId: expected.tabId, parentId: null, isCollapsed: false, noteExpanded: false, noteBinding: null, createdAt: now, updatedAt: now };
        data.childrenByParentByTab[rootKey] = [itemId, ...data.childrenByParentByTab[rootKey] || []];
        data.actionEntryReceipts ||= {};
        data.actionEntryReceipts[requestId] = { fingerprint, result, createdAt: now };
        data.lastModified = now;
        saved = data;
        return JSON.stringify(data, null, 2);
      }, expected.sourceNotePath);
      persisted = true;
      syncHosts(plugin, dataPath, saved);
      const confirmed = JSON.parse(await plugin.app.vault.adapter.read(dataPath));
      if (confirmed.actionEntryReceipts?.[requestId]?.fingerprint !== fingerprint || confirmed.itemsById?.[itemId]?.title !== title) fail("\u4FDD\u5B58\u7ED3\u679C\u5F85\u786E\u8BA4\uFF0C\u8BF7\u7528\u540C\u4E00\u8BF7\u6C42\u91CD\u8BD5");
      plugin.dispatchContextCarrierChanged("next-action-root-created", { sourceNotePath: expected.sourceNotePath, immediate: true });
      for (const leaf of plugin.app.workspace.getLeavesOfType("collection-card-view")) {
        if (leaf.view?.dataPath === dataPath) void Promise.resolve(leaf.view.render()).catch(() => {
        });
      }
      return result;
    } catch (error) {
      console.warn("[CollectionCard][action-entry]", { requestId: options.requestId, persisted, reason: error.message });
      return { ok: false, persisted, notWritten: confirmedAbsent && !saveAttempted, reason: error.message, code: error.code || "CREATE_FAILED", stage: error.stage || "create", ...persisted ? { nodeKey: result?.nodeKey } : {} };
    } finally {
      try {
        if (auditHandle?.operationId) await audit.finishOperation(auditHandle.operationId, { "\u7ED3\u679C": persisted ? "success" : "failed" });
      } catch (_) {
      }
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  create,
  enqueue,
  prepare,
  syncHosts
});
