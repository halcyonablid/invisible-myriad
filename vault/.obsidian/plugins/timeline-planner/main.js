const obsidian = require("obsidian");
const { ItemView, Notice, Plugin, PluginSettingTab, Setting, TFile } = obsidian;

const VIEW_TYPE_TIMELINE_PLANNER = "timeline-planner-view";
const TIMELINE_RELATION_VIEW_TYPE = "timeline";
const JUMP_NODE_PREFIX = "jump:v1:";
const JUMP_NODE_SEGMENT_COUNT = 5;
const JUMP_OPENER_REGISTRY_GLOBAL = "__evaCrossViewJumpOpeners";
const TIMELINE_NOTE_BASENAME = "时间线的安排";
const TIMELINE_DATA_FILENAME = "Timeline_Data.json";
const TIMELINE_SOURCE_PLUGIN_MANDALA = "mandala-time-blocks";
const MANDALA_TRACKING_LIFECYCLE_EVENT = "mandala-time-blocks:tracking-lifecycle-changed";
const EFFECTIVE_OPERATIONAL_CONTEXT_CONTRACT_VERSION = 1;
const EFFECTIVE_OPERATIONAL_CONTEXT_SNAPSHOT_TYPE = "mandala-effective-operational-context-keys-v1";
const EFFECTIVE_GOAL_OPERATIONAL_CONTEXT_SNAPSHOT_TYPE = "mandala-effective-goal-operational-context-keys-v1";
const EFFECTIVE_OPERATIONAL_CONTEXT_MAX_ENTRIES = 500;
const MANDALA_LIFECYCLE_REFRESH_DELAY_MS = 120;
const TIMELINE_MILESTONE_SNAPSHOT_DEFAULT_LIMIT = 2000;
const TIMELINE_MILESTONE_SNAPSHOT_MAX_LIMIT = 5000;
const TIMELINE_PRIMARY_WAVE_MAX_ITEMS = 5000;
const TIMELINE_PRIMARY_WAVE_MAX_DAYS = 400;
const TIMELINE_PRIMARY_WAVE_MAX_OPERATIONS = 2000000;
const TIMELINE_TIME_BLOCKS = [
  { id: "morning", label: "早晨", range: "06:00-08:00" },
  { id: "am1", label: "上午1", range: "08:00-10:00" },
  { id: "am2", label: "上午2", range: "10:00-12:00" },
  { id: "pm1", label: "下午1", range: "13:00-15:00" },
  { id: "pm2", label: "下午2", range: "15:00-17:00" },
  { id: "eve1", label: "晚上1", range: "18:00-20:00" },
  { id: "eve2", label: "晚上2", range: "20:00-23:00" },
];
const TIMELINE_WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const DEFAULT_SETTINGS = {
  sourceNotePath: "",
  dataFolder: "",
  autoOpenOnLoad: false,
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function decodeJumpSegment(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_) {
    return text(value);
  }
}

function parseJumpNodeKey(nodeKey) {
  const normalized = text(nodeKey);
  if (!normalized.startsWith(JUMP_NODE_PREFIX)) return null;
  const encodedSegments = normalized.slice(JUMP_NODE_PREFIX.length).split("|");
  if (encodedSegments.length !== JUMP_NODE_SEGMENT_COUNT) return null;
  const [viewType, notePath, scopeType, scopeId, itemId] = encodedSegments.map((segment) => decodeJumpSegment(segment));
  if (!viewType || !notePath || !scopeType || !scopeId || !itemId) return null;
  return { viewType, notePath, scopeType, scopeId, itemId };
}

function parentFolder(path) {
  const normalized = text(path).replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index > 0 ? normalized.slice(0, index) : "";
}

function fileNameWithoutExt(path) {
  const name = text(path).replace(/\\/g, "/").split("/").pop() || "";
  return name.replace(/\.md$/i, "");
}

function normalizeSettings(raw = {}) {
  return {
    sourceNotePath: text(raw.sourceNotePath),
    dataFolder: text(raw.dataFolder).replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""),
    autoOpenOnLoad: raw.autoOpenOnLoad === true,
  };
}

function stableHash(value = "") {
  const input = String(value == null ? "" : value);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeDateText(value, fallback = "") {
  const normalized = text(value, fallback);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : fallback;
}

function normalizeStrictDateKey(value) {
  const normalized = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return "";
  const [year, month, day] = normalized.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return "";
  return normalized;
}

function getWeekdayLabel(dateKey) {
  const normalized = normalizeStrictDateKey(dateKey);
  if (!normalized) return "";
  const [year, month, day] = normalized.split("-").map(Number);
  return TIMELINE_WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] || "";
}

function dateKeyToUtcMs(dateKey) {
  const normalized = normalizeStrictDateKey(dateKey);
  if (!normalized) return NaN;
  const [year, month, day] = normalized.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function getIsoWeekStartDateKey(dateKey) {
  const timestamp = dateKeyToUtcMs(dateKey);
  if (!Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

function buildInclusiveDateKeys(startDate, endDate, maxDays = TIMELINE_PRIMARY_WAVE_MAX_DAYS) {
  const startMs = dateKeyToUtcMs(startDate);
  const endMs = dateKeyToUtcMs(endDate);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > endMs) {
    return { ok: false, complete: false, truncated: false, reason: "invalid-replay-range", dates: [] };
  }
  const dateCount = Math.floor((endMs - startMs) / 86400000) + 1;
  if (dateCount > maxDays) {
    return { ok: false, complete: false, truncated: true, reason: "date-limit-exceeded", dateCount, dates: [] };
  }
  const dates = [];
  for (let timestamp = startMs; timestamp <= endMs; timestamp += 86400000) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return { ok: true, complete: true, truncated: false, reason: "", dateCount, dates };
}

function buildTimelineDailyWaveOrder(dates = [], items = [], options = {}) {
  const safeDates = Array.isArray(dates) ? dates.map(normalizeStrictDateKey).filter(Boolean) : [];
  const safeItems = Array.isArray(items) ? items.filter((item) => item && text(item.id)) : [];
  const timeBlocks = Array.isArray(options.timeBlocks) && options.timeBlocks.length ? options.timeBlocks : TIMELINE_TIME_BLOCKS;
  const maxItems = Math.max(1, Number(options.maxItems) || TIMELINE_PRIMARY_WAVE_MAX_ITEMS);
  const maxDays = Math.max(1, Number(options.maxDays) || TIMELINE_PRIMARY_WAVE_MAX_DAYS);
  const maxOperations = Math.max(1, Number(options.maxOperations) || TIMELINE_PRIMARY_WAVE_MAX_OPERATIONS);
  const estimatedOperations = safeDates.length * safeItems.length;
  if (safeDates.length > maxDays || safeItems.length > maxItems || estimatedOperations > maxOperations) {
    return {
      ok: false,
      complete: false,
      truncated: true,
      reason: safeDates.length > maxDays
        ? "date-limit-exceeded"
        : (safeItems.length > maxItems ? "item-limit-exceeded" : "operation-limit-exceeded"),
      dateCount: safeDates.length,
      itemCount: safeItems.length,
      operationCount: estimatedOperations,
      orders: {},
    };
  }
  const blockRank = new Map(timeBlocks.map((block, index) => [text(block?.id), index]));
  const itemById = new Map(safeItems.map((item) => [text(item.id), item]));
  const createdTimestamp = (item = {}) => {
    const parsed = Date.parse(text(item.created, text(item.startDate)));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const isActive = (item, dateKey) => {
    const start = normalizeStrictDateKey(item?.startDate);
    const end = normalizeStrictDateKey(item?.endDate);
    return !!start && !!end && start <= dateKey && end >= dateKey;
  };
  const blockIndex = (item, dateKey) => {
    const rank = blockRank.get(text(item?.daySlots?.[dateKey]));
    return rank == null ? timeBlocks.length + 1 : rank;
  };
  const orders = {};
  let previousOrder = [];
  safeDates.forEach((dateKey) => {
    const dayItems = safeItems.filter((item) => isActive(item, dateKey));
    const dayIds = new Set(dayItems.map((item) => text(item.id)));
    const inherited = previousOrder.filter((id) => dayIds.has(id));
    const inheritedSet = new Set(inherited);
    const newIds = dayItems
      .filter((item) => !inheritedSet.has(text(item.id)))
      .sort((left, right) => createdTimestamp(left) - createdTimestamp(right)
        || text(left.name).localeCompare(text(right.name))
        || text(left.id).localeCompare(text(right.id)))
      .map((item) => text(item.id));
    const base = [...inherited, ...newIds];
    const baseRank = new Map(base.map((id, index) => [id, index]));
    const scheduled = [];
    const unscheduled = [];
    base.forEach((id) => {
      const item = itemById.get(id);
      if (text(item?.daySlots?.[dateKey])) scheduled.push(id);
      else unscheduled.push(id);
    });
    scheduled.sort((leftId, rightId) => blockIndex(itemById.get(leftId), dateKey) - blockIndex(itemById.get(rightId), dateKey)
      || (baseRank.get(leftId) ?? 0) - (baseRank.get(rightId) ?? 0));
    previousOrder = [...scheduled, ...unscheduled];
    orders[dateKey] = previousOrder.slice();
  });
  return {
    ok: true,
    complete: true,
    truncated: false,
    reason: "",
    dateCount: safeDates.length,
    itemCount: safeItems.length,
    operationCount: estimatedOperations,
    orders,
  };
}

function resolveTimelinePrimaryIdentity(item = {}) {
  const source = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : null;
  if (!source || text(source.sourcePlugin) !== TIMELINE_SOURCE_PLUGIN_MANDALA) return null;
  const sourceType = text(source.sourceType);
  if (sourceType !== "goal" && sourceType !== "project") return null;
  const sourceId = text(source.sourceId);
  const sourceKey = text(source.sourceKey);
  if (sourceId && sourceKey && sourceId !== sourceKey) return null;
  const identity = sourceKey || sourceId;
  if (!identity || text(source.externalKey) !== `${TIMELINE_SOURCE_PLUGIN_MANDALA}::${sourceType}::${identity}`) return null;
  if (sourceType === "goal") {
    if (identity.startsWith(JUMP_NODE_PREFIX)) return null;
  } else {
    const parsed = parseJumpNodeKey(identity);
    if (!parsed || parsed.viewType !== "workspace-mount-view" || parsed.scopeType !== "tab") return null;
  }
  return {
    sourcePlugin: TIMELINE_SOURCE_PLUGIN_MANDALA,
    sourceType,
    identity,
    sourceId: identity,
    sourceKey: identity,
    externalKey: text(source.externalKey),
  };
}

function timelineProjectExternalKey(sourceKey = "") {
  return `${TIMELINE_SOURCE_PLUGIN_MANDALA}::project::${text(sourceKey)}`;
}

function isWorkspaceProjectJumpKey(value = "") {
  const parsed = parseJumpNodeKey(value);
  return !!parsed
    && parsed.viewType === "workspace-mount-view"
    && parsed.scopeType === "tab";
}

function isMandalaGoalJumpKey(value = "") {
  const parsed = parseJumpNodeKey(value);
  return !!parsed
    && parsed.viewType === "mandala-time-blocks"
    && parsed.scopeType === "node"
    && parsed.scopeId === "mandala"
    && !!text(parsed.itemId);
}

function validateEffectiveOperationalContextSnapshot(snapshot = {}, options = {}) {
  const domain = text(options.domain, "project");
  const expectedType = domain === "goal" ? EFFECTIVE_GOAL_OPERATIONAL_CONTEXT_SNAPSHOT_TYPE : EFFECTIVE_OPERATIONAL_CONTEXT_SNAPSHOT_TYPE;
  const unavailable = (reason) => ({ ok: false, reason, targets: [], timelineExternalKeys: [] });
  const count = Number(snapshot?.count);
  const returnedCount = Number(snapshot?.returnedCount);
  const totalCount = Number(snapshot?.totalCount);
  const limit = Number(snapshot?.limit);
  const generatedAt = text(snapshot?.generatedAt);
  const sourceScope = text(snapshot?.sourceScope);
  const sourceNotePath = text(snapshot?.sourceNotePath);
  if (snapshot?.ok !== true || snapshot?.complete !== true || snapshot?.truncated === true || snapshot?.hasMore === true || !Array.isArray(snapshot?.targets)) {
    return unavailable("effective-snapshot-unavailable");
  }
  if (Number(snapshot.contractVersion) !== EFFECTIVE_OPERATIONAL_CONTEXT_CONTRACT_VERSION
    || text(snapshot.snapshotType) !== expectedType
    || count !== snapshot.targets.length
    || returnedCount !== snapshot.targets.length
    || !Number.isInteger(totalCount)
    || totalCount < count
    || !Number.isInteger(limit)
    || limit < totalCount
    || limit > EFFECTIVE_OPERATIONAL_CONTEXT_MAX_ENTRIES
    || !text(snapshot.providerGeneration)
    || !text(snapshot.revision)
    || !generatedAt
    || !Number.isFinite(Date.parse(generatedAt))
    || !sourceScope
    || sourceScope !== sourceNotePath
    || !Array.isArray(snapshot?.diagnostics)
    || snapshot.targets.length > EFFECTIVE_OPERATIONAL_CONTEXT_MAX_ENTRIES) {
    return unavailable("effective-snapshot-contract-invalid");
  }
  const sourceKeys = new Set();
  const targets = [];
  for (const target of snapshot.targets) {
    const sourceKey = text(target?.sourceKey || target?.sourceId || target?.nodeId);
    const contextKey = target?.contextKey && typeof target.contextKey === "object" ? target.contextKey : null;
    const aliases = Array.isArray(target?.aliases) ? target.aliases.map((value) => text(value)) : [];
    if (text(target?.sourcePlugin) !== TIMELINE_SOURCE_PLUGIN_MANDALA
      || text(target?.sourceType) !== domain
      || text(target?.domain) !== domain
      || text(target?.sourceScope) !== sourceScope
      || text(target?.sourceNotePath) !== sourceNotePath
      || Number(target?.identityVersion) !== 1
      || target?.active !== true
      || text(target?.status) !== "active"
      || text(target?.lifecycleState) !== "active"
      || !sourceKey
      || text(target?.sourceId) !== sourceKey
      || text(target?.sourceKey) !== sourceKey
      || text(target?.nodeId) !== sourceKey
      || !text(target?.label)
      || !text(target?.pathLabel)
      || !Number.isFinite(Number(target?.order))
      || aliases.length === 0
      || aliases.some((alias) => !alias)
      || new Set(aliases).size !== aliases.length
      || !aliases.includes(sourceKey)
      || (domain === "project"
        ? text(target?.externalKey) !== `${TIMELINE_SOURCE_PLUGIN_MANDALA}::effective-project::${sourceKey}` || !isWorkspaceProjectJumpKey(sourceKey)
        : text(target?.externalKey) !== `${TIMELINE_SOURCE_PLUGIN_MANDALA}::goal::${text(target?.ownerNodeId)}` || !isMandalaGoalJumpKey(sourceKey))
      || !contextKey
      || !text(contextKey.contextKeyId || contextKey.id)
      || !text(contextKey.address)
      || !text(contextKey.canonicalLabel)
      || !text(contextKey.displayLabel)
      || text(target?.evidenceRevision) !== text(snapshot?.revision)
      || sourceKeys.has(sourceKey)) {
      return unavailable("effective-snapshot-target-invalid");
    }
    sourceKeys.add(sourceKey);
    const timelineIdentity = domain === "goal" ? text(target.ownerNodeId) : sourceKey;
    targets.push(Object.assign({}, target, {
      // Timeline keeps its legacy owner key so existing retained items are updated, not duplicated.
      externalKey: domain === "project" ? timelineProjectExternalKey(sourceKey) : text(target.externalKey),
      sourceId: timelineIdentity,
      sourceKey: timelineIdentity,
      nodeId: timelineIdentity,
      eligibilitySourceKey: sourceKey,
      status: "active",
      lifecycleState: "active",
      active: true,
      lifecycle: { status: "active", stoppedAt: "", resumedAt: "" },
      tags: Array.from(new Set([...(Array.isArray(target.tags) ? target.tags : []), "effective-operational-context-key", domain])),
    }));
  }
  return {
    ok: true,
    reason: "",
    targets,
    timelineExternalKeys: targets.map((target) => text(target.externalKey)),
    revision: text(snapshot.revision),
    providerGeneration: text(snapshot.providerGeneration),
    generatedAt: text(snapshot.generatedAt),
  };
}

function normalizeMilestoneSnapshotLimit(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return TIMELINE_MILESTONE_SNAPSHOT_DEFAULT_LIMIT;
  return Math.min(TIMELINE_MILESTONE_SNAPSHOT_MAX_LIMIT, parsed);
}

function comparePlanningMilestoneRows(left = {}, right = {}) {
  const leftTimeBlockOrder = Number.isFinite(Number(left.timeBlockOrder)) ? Number(left.timeBlockOrder) : TIMELINE_TIME_BLOCKS.length;
  const rightTimeBlockOrder = Number.isFinite(Number(right.timeBlockOrder)) ? Number(right.timeBlockOrder) : TIMELINE_TIME_BLOCKS.length;
  return text(left.date).localeCompare(text(right.date))
    || leftTimeBlockOrder - rightTimeBlockOrder
    || text(left.milestoneName).localeCompare(text(right.milestoneName), "zh-CN", { numeric: true, sensitivity: "base" })
    || text(left.milestoneId).localeCompare(text(right.milestoneId), "zh-CN", { numeric: true, sensitivity: "base" });
}

function getTodayKey() {
  return window.moment ? window.moment().format("YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
}

function getNextWeekKey() {
  if (window.moment) return window.moment().add(7, "days").format("YYYY-MM-DD");
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function getNextMonthKey() {
  if (window.moment) return window.moment().add(1, "month").format("YYYY-MM-DD");
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function normalizeTimelineData(raw = {}) {
  if (Array.isArray(raw)) return { items: raw, settings: {}, milestones: {} };
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    settings: raw?.settings && typeof raw.settings === "object" && !Array.isArray(raw.settings) ? raw.settings : {},
    milestones: raw?.milestones && typeof raw.milestones === "object" && !Array.isArray(raw.milestones) ? raw.milestones : {},
  };
}

function cloneJson(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function parseLifecycleDateKey(value) {
  const raw = text(value);
  if (!raw) return { ok: false, dateKey: "", reason: "missing" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    const valid = parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
    return valid ? { ok: true, dateKey: raw, format: "date" } : { ok: false, dateKey: "", reason: "invalid-date" };
  }
  const momentApi = window.moment;
  if (momentApi) {
    const parsed = momentApi(raw);
    if (parsed.isValid()) return { ok: true, dateKey: parsed.format("YYYY-MM-DD"), format: "datetime" };
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return { ok: false, dateKey: "", reason: "invalid-datetime" };
  const dateKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  return { ok: true, dateKey, format: "datetime" };
}

function getMandalaExternalKey(item = {}) {
  const source = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : {};
  return text(source.externalKey, source.sourceType && (source.sourceKey || source.sourceId)
    ? `${TIMELINE_SOURCE_PLUGIN_MANDALA}::${text(source.sourceType)}::${text(source.sourceKey || source.sourceId)}`
    : "");
}

const TIMELINE_EDITABLE_ITEM_FIELDS = ["name", "startDate", "endDate", "startTime", "endTime", "comment", "tags"];

function mergeTimelineEditableItemPatch(rawItem = {}, patch = {}) {
  const next = Object.assign({}, rawItem);
  TIMELINE_EDITABLE_ITEM_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(patch || {}, field)) return;
    next[field] = field === "tags"
      ? (Array.isArray(patch.tags) ? [...patch.tags] : [])
      : patch[field];
  });
  return next;
}

function applyTimelineEditablePatchToData(rawData = {}, itemId = "", patch = {}) {
  const items = Array.isArray(rawData?.items) ? rawData.items : [];
  const index = items.findIndex((item) => text(item?.id) === text(itemId));
  if (index < 0) return false;
  items[index] = mergeTimelineEditableItemPatch(items[index], patch);
  return true;
}

function normalizeSourceTypes(value) {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function normalizeMandalaLifecycleEvidence(value = {}) {
  const status = text(value.status, "active");
  const stoppedAt = text(value.stoppedAt);
  const parsedStop = parseLifecycleDateKey(value.stopDate || stoppedAt);
  return {
    status,
    stoppedAt,
    stopDate: status === "stopped" && parsedStop.ok ? parsedStop.dateKey : "",
    resumedAt: text(value.resumedAt),
  };
}

function mergeMandalaLifecycleEvidence(item = {}, incoming = {}) {
  if (!isMandalaPlanningItem(item)) return { item, changed: false };
  const source = item.externalSource && typeof item.externalSource === "object" ? item.externalSource : {};
  const previous = normalizeMandalaLifecycleEvidence(source.lifecycle || {});
  const next = normalizeMandalaLifecycleEvidence(incoming);
  if (next.status === "stopped" && !next.stopDate && previous.status === "stopped" && previous.stopDate) {
    next.stoppedAt = previous.stoppedAt;
    next.stopDate = previous.stopDate;
  }
  const previousJson = JSON.stringify(previous);
  const nextJson = JSON.stringify(next);
  if (previousJson === nextJson) return { item, changed: false };
  return {
    item: Object.assign({}, item, {
      externalSource: Object.assign({}, source, { lifecycle: next }),
    }),
    changed: true,
  };
}

function resolveMandalaLifecycleForProjection(item = {}, lifecycleMap = {}) {
  const externalKey = getMandalaExternalKey(item);
  const ownerLifecycle = lifecycleMap && typeof lifecycleMap === "object" ? lifecycleMap[externalKey] : null;
  const persistedLifecycle = normalizeMandalaLifecycleEvidence(item?.externalSource?.lifecycle || {});
  if (ownerLifecycle) {
    const normalizedOwner = normalizeMandalaLifecycleEvidence(ownerLifecycle);
    if (normalizedOwner.status !== "stopped" || normalizedOwner.stopDate) return normalizedOwner;
    if (persistedLifecycle.status === "stopped" && persistedLifecycle.stopDate) return persistedLifecycle;
    return normalizedOwner;
  }
  return persistedLifecycle;
}

function buildExternalSource(candidate = {}) {
  const sourcePlugin = text(candidate.sourcePlugin, TIMELINE_SOURCE_PLUGIN_MANDALA);
  const sourceType = text(candidate.sourceType || candidate.kind, "external");
  const sourceId = text(candidate.sourceId || candidate.nodeId || candidate.id || candidate.nodeKey);
  const sourceKey = text(candidate.sourceKey || candidate.key || sourceId);
  const externalKey = text(candidate.externalKey, `${sourcePlugin}::${sourceType}::${sourceKey || sourceId}`);
  const source = { sourcePlugin, sourceType, sourceId, sourceKey, externalKey };
  const hasLifecycleEvidence = candidate.lifecycle && typeof candidate.lifecycle === "object"
    || Object.prototype.hasOwnProperty.call(candidate, "status")
    || Object.prototype.hasOwnProperty.call(candidate, "stoppedAt")
    || Object.prototype.hasOwnProperty.call(candidate, "resumedAt");
  if (sourcePlugin === TIMELINE_SOURCE_PLUGIN_MANDALA && hasLifecycleEvidence) {
    source.lifecycle = normalizeMandalaLifecycleEvidence(candidate.lifecycle || candidate);
  }
  return source;
}

function normalizeExternalCandidate(candidate = {}, options = {}) {
  const externalSource = buildExternalSource(candidate);
  if (!externalSource.sourceId && !externalSource.sourceKey) return null;
  const label = text(candidate.label || candidate.itemName || candidate.title || candidate.displayTitle || candidate.name || externalSource.sourceId);
  if (!label) return null;
  const defaultStart = normalizeDateText(options.startDate, getTodayKey());
  const defaultEnd = normalizeDateText(options.endDate, getNextWeekKey());
  const startDate = normalizeDateText(candidate.startDate, defaultStart) || defaultStart;
  const endDate = normalizeDateText(candidate.endDate, defaultEnd) || startDate;
  const id = text(candidate.timelineItemId, `ext_${stableHash(externalSource.externalKey)}`);
  const tags = Array.from(new Set([...(Array.isArray(candidate.tags) ? candidate.tags : []), externalSource.sourceType].map((tag) => text(tag)).filter(Boolean)));
  return {
    id,
    name: label,
    startDate,
    endDate,
    startTime: text(candidate.startTime, "09:00"),
    endTime: text(candidate.endTime, "18:00"),
    kind: "task",
    comment: text(candidate.comment || candidate.description || candidate.pathLabel),
    color: text(candidate.color),
    tags,
    daySlots: candidate.daySlots && typeof candidate.daySlots === "object" && !Array.isArray(candidate.daySlots) ? candidate.daySlots : {},
    created: text(candidate.created),
    externalSource,
  };
}

function isExternalMatch(item = {}, externalSource = {}) {
  const current = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : {};
  const externalKey = text(externalSource.externalKey);
  return !!externalKey && text(current.externalKey) === externalKey;
}

function isMandalaPlanningItem(item = {}) {
  const source = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : null;
  return text(source?.sourcePlugin) === TIMELINE_SOURCE_PLUGIN_MANDALA;
}

function mergeMandalaDuplicateProjectItemsIntoGoals(data = {}) {
  const items = Array.isArray(data.items) ? data.items : [];
  const goalsByName = new Map();
  items.forEach((item) => {
    if (!isMandalaPlanningItem(item)) return;
    if (text(item.externalSource?.sourceType) !== "goal") return;
    const name = text(item.name);
    if (!name || !goalsByName.has(name)) goalsByName.set(name, item);
  });
  const duplicateIds = new Map();
  const keptItems = [];
  items.forEach((item) => {
    if (!isMandalaPlanningItem(item) || text(item.externalSource?.sourceType) !== "project") {
      keptItems.push(item);
      return;
    }
    const name = text(item.name);
    const goal = goalsByName.get(name);
    const projectSourceId = text(item.externalSource?.sourceId || item.externalSource?.sourceKey);
    if (!goal || !projectSourceId.startsWith(JUMP_NODE_PREFIX)) {
      keptItems.push(item);
      return;
    }
    const goalSlots = goal.daySlots && typeof goal.daySlots === "object" && !Array.isArray(goal.daySlots) ? goal.daySlots : {};
    const projectSlots = item.daySlots && typeof item.daySlots === "object" && !Array.isArray(item.daySlots) ? item.daySlots : {};
    Object.entries(projectSlots).forEach(([date, slot]) => {
      if (!goalSlots[date] && slot) goalSlots[date] = slot;
    });
    goal.daySlots = goalSlots;
    if (!text(goal.comment) && text(item.comment) && text(item.comment) !== name) goal.comment = text(item.comment);
    goal.updated = new Date().toISOString();
    duplicateIds.set(text(item.id), text(goal.id));
  });
  if (!duplicateIds.size) return { changed: false, mergedCount: 0, retargetedMilestoneCount: 0 };
  let retargetedMilestoneCount = 0;
  const milestones = data.milestones && typeof data.milestones === "object" && !Array.isArray(data.milestones) ? data.milestones : {};
  Object.values(milestones).forEach((milestone) => {
    const nextItemId = duplicateIds.get(text(milestone?.itemId));
    if (!nextItemId) return;
    milestone.itemId = nextItemId;
    retargetedMilestoneCount += 1;
  });
  data.items = keptItems;
  data.milestones = milestones;
  return { changed: true, mergedCount: duplicateIds.size, retargetedMilestoneCount };
}

function normalizeMilestoneSnapshotDateRange(options = {}) {
  const start = normalizeDateText(options.start || options.startDate, "");
  const end = normalizeDateText(options.end || options.endDate, start);
  return { start, end: end || start };
}

function ensureJumpOpenerRegistry() {
  const existing = window[JUMP_OPENER_REGISTRY_GLOBAL];
  if (
    existing
    && typeof existing.register === "function"
    && typeof existing.unregister === "function"
    && typeof existing.get === "function"
  ) {
    return existing;
  }

  const openersByViewType = new Map();
  const registry = {
    version: 1,
    register(descriptor = {}) {
      const openerId = text(descriptor.openerId);
      const viewType = text(descriptor.viewType);
      if (!openerId || !viewType || typeof descriptor.openNode !== "function") return null;
      openersByViewType.set(viewType, {
        openerId,
        viewType,
        openNode: descriptor.openNode,
      });
      return true;
    },
    unregister(openerId) {
      const targetId = text(openerId);
      if (!targetId) return false;
      let removed = false;
      Array.from(openersByViewType.entries()).forEach(([viewType, descriptor]) => {
        if (descriptor?.openerId !== targetId) return;
        openersByViewType.delete(viewType);
        removed = true;
      });
      return removed;
    },
    get(viewType) {
      return openersByViewType.get(text(viewType)) || null;
    },
  };
  window[JUMP_OPENER_REGISTRY_GLOBAL] = registry;
  return registry;
}

class TimelinePlannerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Timeline Planner" });
    containerEl.createEl("p", {
      text: "插件版沿用原 Timeline JSON 文件与 EVA nodeKey；原 md 只作为逻辑身份和数据目录锚点，不再作为运行代码来源。",
    });

    new Setting(containerEl)
      .setName("原 Timeline note 路径")
      .setDesc("用于定位原 JSON 文件夹，并保持 EVA 关系兼容。留空时自动搜索“时间线的安排.md”。")
      .addText((textInput) => textInput
        .setPlaceholder("例如：项目/.../时间线的安排.md")
        .setValue(this.plugin.settings.sourceNotePath)
        .onChange(async (value) => {
          this.plugin.settings.sourceNotePath = text(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("数据文件夹兜底路径")
      .setDesc("当原 note 不存在时使用；仍读取该文件夹下的 Timeline_Data.json、Timeline_Tags.json。")
      .addText((textInput) => textInput
        .setPlaceholder("例如：项目/18-.../liner chain")
        .setValue(this.plugin.settings.dataFolder)
        .onChange(async (value) => {
          this.plugin.settings.dataFolder = text(value).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("启动 Obsidian 时自动打开")
      .setDesc("默认关闭，避免启动时主动抢焦点。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoOpenOnLoad)
        .onChange(async (value) => {
          this.plugin.settings.autoOpenOnLoad = value === true;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("打开 Timeline 插件视图")
      .addButton((button) => button
        .setButtonText("打开")
        .setCta()
        .onClick(async () => {
          await this.plugin.activateView();
        }));
  }
}

// Same-turn requests collapse; requests during work get a trailing latest-state pass.
function drainTimelineRefresh(owner, key, work, alive = () => true) {
  if (owner[key]) { owner[key].pending = true; owner[key].work = work; return owner[key].promise; }
  const entry = { pending: true, work };
  owner[key] = entry;
  entry.promise = Promise.resolve().then(async () => {
    let result;
    while (entry.pending && alive()) {
      entry.pending = false;
      result = await entry.work();
    }
    return result;
  }).finally(() => { if (owner[key] === entry) owner[key] = null; });
  return entry.promise;
}
class TimelinePlannerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.renderSeq = 0;
    this.closed = false;
  }

  getViewType() {
    return VIEW_TYPE_TIMELINE_PLANNER;
  }

  getDisplayText() {
    return "Timeline 时间线";
  }

  getIcon() {
    return "calendar-clock";
  }

  async onOpen() {
    this.closed = false;
    this.contentEl.addClass("timeline-planner-view");
    await this.render();
  }

  async onClose() {
    this.closed = true; this.renderSeq++;
    this.contentEl.empty();
  }

  render() {
    return drainTimelineRefresh(this, "renderDrain", () => this.renderOnce(), () => !this.closed && !this.plugin.isUnloading);
  }
  async renderOnce() {
    const seq = ++this.renderSeq;
    this.contentEl.empty();
    const root = this.contentEl.createDiv({ cls: "timeline-planner-root" });
    root.dataset.timelinePluginHost = "1";
    const sourceContext = this.plugin.resolveSourceContext();
    const isActive = () => !this.closed && !this.plugin.isUnloading && seq === this.renderSeq && this.plugin.resolveSourceContext().path === sourceContext.path && root.parentElement === this.contentEl;
    root.dataset.timelineSourcePath = sourceContext.path;
    root.dataset.timelineDataFolder = sourceContext.folder;

    const momentApi = window.moment;
    if (!momentApi) {
      root.createDiv({ cls: "timeline-planner-error", text: "未找到 Obsidian moment API，Timeline 插件视图无法启动。" });
      return;
    }

    try {
      const runTimelinePlannerEngine = await this.plugin.loadEngineRunner();
      if (!isActive()) return;
      const visibilitySnapshot = await this.plugin.getMandalaTimelineVisibilitySnapshot();
      if (!isActive()) return;
      const lifecycleSnapshot = visibilitySnapshot.lifecycleSnapshot;
      await runTimelinePlannerEngine({
        isActive,
        readOnlyInitialization: true,
        app: this.app,
        obsidian,
        moment: momentApi,
        container: root,
        sourceContext,
        Notice,
        TFile,
        mandalaEffectiveGoalExternalKeys: visibilitySnapshot.effectiveGoalExternalKeys,
        mandalaEffectiveGoalStatus: {
          ok: visibilitySnapshot.effectiveGoalSnapshot.ok,
          reason: visibilitySnapshot.effectiveGoalSnapshot.reason || "",
          revision: visibilitySnapshot.effectiveGoalSnapshot.revision || "",
        },
        mandalaEffectiveProjectExternalKeys: visibilitySnapshot.effectiveProjectExternalKeys,
        mandalaEffectiveProjectStatus: {
          ok: visibilitySnapshot.effectiveProjectSnapshot.ok,
          reason: visibilitySnapshot.effectiveProjectSnapshot.reason || "",
          revision: visibilitySnapshot.effectiveProjectSnapshot.revision || "",
        },
        projectTimelineData: (data) => this.plugin.projectTimelineData(data, lifecycleSnapshot.lifecycleByExternalKey),
        buildTimelineDailyWaveOrder,
        mergeTimelineEditableItemPatch: (rawItem, patch) => this.plugin.mergeTimelineEditableItemPatch(rawItem, patch),
        applyTimelineEditablePatchToData: (rawData, itemId, patch) => this.plugin.applyTimelineEditablePatchToData(rawData, itemId, patch),
      });
      if (!isActive()) return;
      console.info("[Timeline Planner][render]", {
        status: "OK",
        sourceNotePath: sourceContext.path,
        dataFolder: sourceContext.folder,
      });
    } catch (error) {
      if (!isActive()) return;
      console.error("[Timeline Planner][render-fail]", error);
      root.empty();
      root.createDiv({
        cls: "timeline-planner-error",
        text: `Timeline 插件视图渲染失败：\n${error?.stack || error?.message || String(error)}`,
      });
    }
  }
}

module.exports = class TimelinePlannerPlugin extends Plugin {
  async onload() {
    this.isUnloading = false;
    this.embeddedTimelineSessions = new Map();
    this.mandalaLifecycleRefreshTimer = null;
    this.mandalaLifecycleSnapshotCache = null;
    this.mandalaLifecycleSnapshotDirty = true;
    this.mandalaEffectiveProjectSnapshotInFlight = null;
    this.mandalaEffectiveGoalSnapshotInFlight = null;
    await this.loadSettings();
    const registry = this.app?.viewRegistry;
    if (registry?.viewByType?.[VIEW_TYPE_TIMELINE_PLANNER] && typeof registry.unregisterView === "function") {
      registry.unregisterView(VIEW_TYPE_TIMELINE_PLANNER);
      console.warn("[Timeline Planner][view.unregister-stale]", { viewType: VIEW_TYPE_TIMELINE_PLANNER });
    }
    this.registerView(VIEW_TYPE_TIMELINE_PLANNER, (leaf) => new TimelinePlannerView(leaf, this));
    this.addRibbonIcon("calendar-clock", "打开 Timeline 时间线", async () => this.activateView());
    this.addCommand({
      id: "open-timeline-planner",
      name: "打开 Timeline 时间线",
      callback: async () => this.activateView(),
    });
    this.addCommand({
      id: "reload-timeline-planner",
      name: "重载 Timeline 时间线视图",
      callback: async () => this.reloadOpenViews(),
    });
    this.addSettingTab(new TimelinePlannerSettingTab(this.app, this));
    this.registerGlobalApi();
    this.registerJumpOpener();
    this.boundStateCapsuleChangedHandler = () => {
      if (typeof this.reloadOpenViews === "function") {
        void this.reloadOpenViews();
      }
    };
    window.addEventListener?.("state-capsules:active-capsule-changed", this.boundStateCapsuleChangedHandler);
    this.boundMandalaLifecycleChangedHandler = () => {
      this.mandalaLifecycleSnapshotDirty = true;
      this.scheduleMandalaLifecycleRefresh();
    };
    window.addEventListener?.(MANDALA_TRACKING_LIFECYCLE_EVENT, this.boundMandalaLifecycleChangedHandler);

    if (this.settings.autoOpenOnLoad) {
      this.app.workspace.onLayoutReady(() => {
        void this.activateView();
      });
    }

    console.info("[Timeline Planner][load]", { status: "OK", version: this.manifest.version });
  }

  onunload() {
    this.isUnloading = true;
    if (this.mandalaLifecycleRefreshTimer) window.clearTimeout?.(this.mandalaLifecycleRefreshTimer);
    this.mandalaLifecycleRefreshTimer = null;
    this.unregisterJumpOpener();
    if (this.boundStateCapsuleChangedHandler) window.removeEventListener?.("state-capsules:active-capsule-changed", this.boundStateCapsuleChangedHandler);
    if (this.boundMandalaLifecycleChangedHandler) window.removeEventListener?.(MANDALA_TRACKING_LIFECYCLE_EVENT, this.boundMandalaLifecycleChangedHandler);
    this.embeddedTimelineSessions?.clear?.();
    if (window.__timelinePlannerPluginApi?.pluginId === this.manifest.id) {
      delete window.__timelinePlannerPluginApi;
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE_PLANNER);
  }

  async loadSettings() {
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }

  getTimelineDataPath() {
    const source = this.resolveSourceContext();
    const folder = text(source.folder, text(this.settings.dataFolder));
    return folder ? `${folder}/${TIMELINE_DATA_FILENAME}` : TIMELINE_DATA_FILENAME;
  }

  async loadTimelineDataFile(createIfMissing = false) {
    const dataPath = this.getTimelineDataPath();
    try {
      if (await this.app.vault.adapter.exists(dataPath)) {
        const content = await this.app.vault.adapter.read(dataPath);
        return normalizeTimelineData(JSON.parse(content));
      }
    } catch (error) {
      console.warn("[Timeline Planner][data-load-failed]", { dataPath, message: error?.message || String(error) });
    }
    const emptyData = normalizeTimelineData({});
    if (createIfMissing) await this.saveTimelineDataFile(emptyData);
    return emptyData;
  }

  async saveTimelineDataFile(data) {
    const dataPath = this.getTimelineDataPath();
    const normalized = normalizeTimelineData(data);
    const json = JSON.stringify(normalized, null, 2);
    const file = this.app.vault.getAbstractFileByPath(dataPath);
    if (file instanceof TFile) await this.app.vault.modify(file, json);
    else await this.app.vault.create(dataPath, json);
    return normalized;
  }

  getMandalaApi() {
    return window.__mandalaTimeBlocksPluginApi
      || this.app?.plugins?.plugins?.["mandala-time-blocks"]?.globalApi
      || this.app?.plugins?.plugins?.["mandala-time-blocks"]?.api
      || null;
  }

  getMandalaPlanningSourceTypes(options = {}) {
    const requested = Array.isArray(options.sourceTypes)
      ? Array.from(new Set(options.sourceTypes.map((value) => text(value)).filter((value) => value === "goal" || value === "project")))
      : [];
    if (requested.length) return requested;
    const filter = text(options.sourceFilter || options.mandalaSourceFilter || options.domain || options.sourceType);
    if (filter === "goal") return ["goal"];
    if (filter === "project") return ["project"];
    return ["goal", "project"];
  }

  async getMandalaPlanningLifecycleSnapshot(options = {}) {
    const mandalaApi = this.getMandalaApi();
    if (typeof mandalaApi?.listTimelinePlanningTargets !== "function") {
      return { ok: false, reason: "missing-mandala-api", targets: [], externalKeys: null, lifecycleByExternalKey: {} };
    }
    try {
      let baseSnapshot = !this.mandalaLifecycleSnapshotDirty ? this.mandalaLifecycleSnapshotCache : null;
      if (!baseSnapshot) {
      const snapshot = await mandalaApi.listTimelinePlanningTargets({
        sourceTypes: ["goal", "project"],
        includeStopped: true,
        includeInactive: true,
      });
      if (snapshot?.ok === false) throw new Error(snapshot.reason || "mandala-snapshot-failed");
      const targets = Array.isArray(snapshot?.targets) ? snapshot.targets : [];
      const lifecycleByExternalKey = {};
      targets.forEach((target) => {
        const externalKey = text(target.externalKey, target.sourceType && (target.sourceId || target.sourceKey)
          ? `${TIMELINE_SOURCE_PLUGIN_MANDALA}::${text(target.sourceType)}::${text(target.sourceId || target.sourceKey)}`
          : "");
        if (!externalKey) return;
        const stop = parseLifecycleDateKey(target.stoppedAt);
        if (text(target.status) === "stopped" && !stop.ok) {
          console.warn("[Timeline Planner][mandala-lifecycle-invalid-stop-date]", {
            externalKey,
            stoppedAt: text(target.stoppedAt),
            reason: stop.reason,
            behavior: "fail-open",
          });
        }
        lifecycleByExternalKey[externalKey] = {
          externalKey,
          sourceType: text(target.sourceType),
          sourceId: text(target.sourceId || target.sourceKey),
          status: text(target.status, "active"),
          stoppedAt: text(target.stoppedAt),
          stopDate: stop.ok ? stop.dateKey : "",
          resumedAt: text(target.resumedAt),
        };
      });
        baseSnapshot = { targets, lifecycleByExternalKey };
        this.mandalaLifecycleSnapshotCache = baseSnapshot;
        this.mandalaLifecycleSnapshotDirty = false;
      }
      const sourceTypes = new Set(this.getMandalaPlanningSourceTypes(options));
      const targets = baseSnapshot.targets.filter((target) => sourceTypes.has(text(target.sourceType)));
      const lifecycleByExternalKey = {};
      Object.entries(baseSnapshot.lifecycleByExternalKey).forEach(([key, lifecycle]) => {
        if (sourceTypes.has(text(lifecycle.sourceType))) lifecycleByExternalKey[key] = lifecycle;
      });
      return {
        ok: true,
        targets,
        externalKeys: Object.keys(lifecycleByExternalKey),
        lifecycleByExternalKey,
      };
    } catch (error) {
      console.warn("[Timeline Planner][mandala-lifecycle-snapshot-failed]", { message: error?.message || String(error) });
      return { ok: false, reason: error?.message || String(error), targets: [], externalKeys: null, lifecycleByExternalKey: {} };
    }
  }

  async getMandalaEffectiveProjectSnapshot() {
    const mandalaApi = this.getMandalaApi();
    if (typeof mandalaApi?.listEffectiveOperationalContextKeys !== "function") {
      return { ok: false, reason: "missing-effective-operational-context-api", targets: [], timelineExternalKeys: [] };
    }
    if (this.mandalaEffectiveProjectSnapshotInFlight) return await this.mandalaEffectiveProjectSnapshotInFlight;
    const promise = (async () => {
      try {
        const rawSnapshot = await mandalaApi.listEffectiveOperationalContextKeys({ source: "timeline-planner" });
        const snapshot = validateEffectiveOperationalContextSnapshot(rawSnapshot);
        if (!snapshot.ok) {
          console.warn("[Timeline Planner][effective-operational-context.snapshot-rejected]", {
            reason: snapshot.reason,
            providerGeneration: text(rawSnapshot?.providerGeneration),
            revision: text(rawSnapshot?.revision),
          });
          return snapshot;
        }
        return snapshot;
      } catch (error) {
        const reason = text(error?.message, "effective-operational-context-snapshot-failed");
        console.warn("[Timeline Planner][effective-operational-context.snapshot-failed]", { reason });
        return { ok: false, reason, targets: [], timelineExternalKeys: [] };
      }
    })();
    this.mandalaEffectiveProjectSnapshotInFlight = promise;
    try {
      return await promise;
    } finally {
      if (this.mandalaEffectiveProjectSnapshotInFlight === promise) this.mandalaEffectiveProjectSnapshotInFlight = null;
    }
  }

  async getMandalaEffectiveGoalSnapshot() {
    const mandalaApi = this.getMandalaApi();
    if (typeof mandalaApi?.listEffectiveGoalOperationalContextKeys !== "function") {
      return { ok: false, reason: "missing-effective-goal-operational-context-api", targets: [], timelineExternalKeys: [] };
    }
    if (this.mandalaEffectiveGoalSnapshotInFlight) return await this.mandalaEffectiveGoalSnapshotInFlight;
    const promise = (async () => {
      try {
        const rawSnapshot = await mandalaApi.listEffectiveGoalOperationalContextKeys({ source: "timeline-planner" });
        const snapshot = validateEffectiveOperationalContextSnapshot(rawSnapshot, { domain: "goal" });
        if (!snapshot.ok) {
          console.warn("[Timeline Planner][effective-goal-operational-context.snapshot-rejected]", {
            reason: snapshot.reason,
            providerGeneration: text(rawSnapshot?.providerGeneration),
            revision: text(rawSnapshot?.revision),
          });
        }
        return snapshot;
      } catch (error) {
        const reason = text(error?.message, "effective-goal-operational-context-snapshot-failed");
        console.warn("[Timeline Planner][effective-goal-operational-context.snapshot-failed]", { reason });
        return { ok: false, reason, targets: [], timelineExternalKeys: [] };
      }
    })();
    this.mandalaEffectiveGoalSnapshotInFlight = promise;
    try {
      return await promise;
    } finally {
      if (this.mandalaEffectiveGoalSnapshotInFlight === promise) this.mandalaEffectiveGoalSnapshotInFlight = null;
    }
  }

  async getMandalaTimelineAdmissionSnapshot(options = {}) {
    const sourceTypes = new Set(this.getMandalaPlanningSourceTypes(options));
    const needsGoal = sourceTypes.has("goal");
    const needsProject = sourceTypes.has("project");
    const [effectiveGoalSnapshot, effectiveProjectSnapshot] = await Promise.all([
      needsGoal ? this.getMandalaEffectiveGoalSnapshot() : Promise.resolve(null),
      needsProject ? this.getMandalaEffectiveProjectSnapshot() : Promise.resolve(null),
    ]);
    if (needsGoal && !effectiveGoalSnapshot?.ok) {
      return { ok: false, reason: effectiveGoalSnapshot?.reason || "effective-goal-snapshot-unavailable", targets: [] };
    }
    if (needsProject && !effectiveProjectSnapshot?.ok) {
      return { ok: false, reason: effectiveProjectSnapshot?.reason || "effective-project-snapshot-unavailable", targets: [] };
    }
    const goalTargets = needsGoal
      ? effectiveGoalSnapshot.targets
      : [];
    const projectTargets = needsProject ? effectiveProjectSnapshot.targets : [];
    return {
      ok: true,
      reason: "",
      targets: [...goalTargets, ...projectTargets],
      goalCount: goalTargets.length,
      effectiveGoalCount: goalTargets.length,
      effectiveProjectCount: projectTargets.length,
      effectiveGoalSnapshot: effectiveGoalSnapshot || { ok: true, targets: [], timelineExternalKeys: [] },
      effectiveProjectSnapshot: effectiveProjectSnapshot || { ok: true, targets: [], timelineExternalKeys: [] },
    };
  }

  async getMandalaTimelineVisibilitySnapshot(options = {}) {
    const [lifecycleSnapshot, effectiveProjectSnapshot, effectiveGoalSnapshot] = await Promise.all([
      this.getMandalaPlanningLifecycleSnapshot(options),
      this.getMandalaEffectiveProjectSnapshot(),
      this.getMandalaEffectiveGoalSnapshot(),
    ]);
    return {
      ok: lifecycleSnapshot.ok && effectiveProjectSnapshot.ok && effectiveGoalSnapshot.ok,
      lifecycleSnapshot,
      effectiveProjectSnapshot,
      effectiveGoalSnapshot,
      effectiveProjectExternalKeys: effectiveProjectSnapshot.ok ? effectiveProjectSnapshot.timelineExternalKeys : null,
      effectiveGoalExternalKeys: effectiveGoalSnapshot.ok ? effectiveGoalSnapshot.timelineExternalKeys : null,
    };
  }

  projectTimelineData(rawData, lifecycleByExternalKey = {}) {
    const data = normalizeTimelineData(cloneJson(rawData, {}));
    const lifecycleMap = lifecycleByExternalKey && typeof lifecycleByExternalKey === "object" ? lifecycleByExternalKey : {};
    const stopDateByItemId = new Map();
    data.items = (Array.isArray(data.items) ? data.items : []).map((rawItem) => {
      const item = cloneJson(rawItem, Object.assign({}, rawItem));
      if (!isMandalaPlanningItem(item)) return item;
      const lifecycle = resolveMandalaLifecycleForProjection(item, lifecycleMap);
      if (text(lifecycle.status) !== "stopped" || !normalizeDateText(lifecycle.stopDate, "")) return item;
      const stopDate = lifecycle.stopDate;
      stopDateByItemId.set(text(item.id), stopDate);
      const rawEndDate = normalizeDateText(item.endDate, stopDate);
      item.endDate = rawEndDate && rawEndDate < stopDate ? rawEndDate : stopDate;
      if (item.daySlots && typeof item.daySlots === "object" && !Array.isArray(item.daySlots)) {
        item.daySlots = Object.fromEntries(Object.entries(item.daySlots).filter(([date]) => !normalizeDateText(date, "") || date <= stopDate));
      }
      return item;
    });
    data.milestones = Object.fromEntries(Object.entries(data.milestones || {}).filter(([, milestone]) => {
      const stopDate = stopDateByItemId.get(text(milestone?.itemId));
      const date = normalizeDateText(milestone?.date, "");
      return !stopDate || !date || date <= stopDate;
    }));
    return data;
  }

  mergeTimelineEditableItemPatch(rawItem = {}, patch = {}) {
    return mergeTimelineEditableItemPatch(rawItem, patch);
  }

  applyTimelineEditablePatchToData(rawData = {}, itemId = "", patch = {}) {
    return applyTimelineEditablePatchToData(rawData, itemId, patch);
  }

  scheduleMandalaLifecycleRefresh() {
    if (this.isUnloading || this.mandalaLifecycleRefreshTimer) return false;
    this.mandalaLifecycleRefreshTimer = window.setTimeout(() => {
      this.mandalaLifecycleRefreshTimer = null;
      void this.refreshConnectedTimelineSurfaces("mandala-lifecycle-event").catch(error => console.error("[Timeline Planner][lifecycle-refresh-fail]", error));
    }, MANDALA_LIFECYCLE_REFRESH_DELAY_MS);
    return true;
  }

  reloadConnectedTimelineSurfaces(reason = "owner-action") {
    return drainTimelineRefresh(this, "connectedReloadDrain", () => this.reloadConnectedTimelineSurfacesOnce(reason), () => !this.isUnloading);
  }
  async reloadConnectedTimelineSurfacesOnce(reason) {
    if (this.isUnloading) return { ok: false, reason: "plugin-unloading", embeddedCount: 0, prunedCount: 0 };
    await this.reloadOpenViews();
    if (this.isUnloading) return { ok: false, embeddedCount: 0, prunedCount: 0 };
    const sessions = Array.from(this.embeddedTimelineSessions?.entries?.() || []);
    let embeddedCount = 0;
    let prunedCount = 0;
    for (const [container, options] of sessions) {
      if (this.isUnloading) break;
      if (!container?.isConnected) {
        this.embeddedTimelineSessions.delete(container);
        prunedCount += 1;
        continue;
      }
      await this.renderEmbeddedTimeline(container, Object.assign({}, options, { skipMaintenance: true }));
      embeddedCount += 1;
    }
    console.info("[Timeline Planner][connected-surfaces.reload]", { reason, embeddedCount, prunedCount });
    return { ok: true, embeddedCount, prunedCount };
  }

  refreshConnectedTimelineSurfaces(reason = "owner-event") {
    return drainTimelineRefresh(this, "lifecycleRefreshDrain", () => this.refreshConnectedTimelineSurfacesOnce(reason), () => !this.isUnloading);
  }
  async refreshConnectedTimelineSurfacesOnce(reason) {
    if (this.isUnloading) return { ok: false, reason: "plugin-unloading", embeddedCount: 0, prunedCount: 0 };
    await this.refreshMandalaPlanningItemDates({ reload: false });
    const result = await this.reloadConnectedTimelineSurfaces(reason);
    console.info("[Timeline Planner][mandala-lifecycle-refresh]", { reason, embeddedCount: result.embeddedCount, prunedCount: result.prunedCount });
    return result;
  }

  async getMandalaActivePlanningExternalKeys(options = {}) {
    const snapshot = await this.getMandalaTimelineVisibilitySnapshot(options);
    if (!snapshot.ok) return null;
    return Array.from(new Set([...(snapshot.effectiveGoalExternalKeys || []), ...(snapshot.effectiveProjectExternalKeys || [])]));
  }

  resolveMandalaImportDateRange(options = {}) {
    let startDate = normalizeDateText(options.startDate, "");
    const endDate = normalizeDateText(options.endDate, getNextMonthKey());
    if (!startDate && window.moment) {
      const useCustomRange = text(window.timelineRangeMode) === "custom"
        && normalizeDateText(window.timelineCustomStart, "")
        && normalizeDateText(window.timelineCustomEnd, "");
      const start = useCustomRange
        ? window.moment(window.timelineCustomStart)
        : window.moment().startOf("isoWeek");
      if (typeof start?.isValid !== "function" || start.isValid()) {
        startDate = normalizeDateText(start?.format?.("YYYY-MM-DD"), "");
      }
    }
    return {
      startDate: startDate || getTodayKey(),
      endDate: endDate || getNextMonthKey(),
    };
  }

  async importMandalaPlanningTargets(options = {}) {
    const effectiveOptions = Object.assign({}, options, this.resolveMandalaImportDateRange(options));
    const admissionSnapshot = await this.getMandalaTimelineAdmissionSnapshot(effectiveOptions);
    if (!admissionSnapshot.ok) {
      console.warn("[Timeline Planner][mandala-import.admission-rejected]", { reason: admissionSnapshot.reason });
      return { ok: false, reason: admissionSnapshot.reason, importedCount: 0, updatedCount: 0, items: [] };
    }
    const lifecycleSnapshot = await this.getMandalaPlanningLifecycleSnapshot({ sourceFilter: "all" });
    const lifecycleResult = lifecycleSnapshot.ok
      ? await this.reconcileMandalaPlanningLifecycleTargets(lifecycleSnapshot.targets, { reload: false })
      : { ok: false, updatedCount: 0, reason: lifecycleSnapshot.reason || "lifecycle-snapshot-unavailable" };
    this.mandalaLifecycleSnapshotDirty = true;
    const result = admissionSnapshot.targets.length
      ? await this.ensureExternalItems(admissionSnapshot.targets, Object.assign({}, effectiveOptions, {
          sourcePlugin: TIMELINE_SOURCE_PLUGIN_MANDALA,
          reload: false,
        }))
      : { ok: true, importedCount: 0, updatedCount: 0, count: 0, items: [] };
    await this.reloadConnectedTimelineSurfaces("mandala-import");
    return Object.assign({}, result, {
      receivedCount: admissionSnapshot.targets.length,
      eligibleCount: admissionSnapshot.targets.length,
      goalCount: admissionSnapshot.goalCount,
      effectiveProjectCount: admissionSnapshot.effectiveProjectCount,
      skippedHistoricalProjectCount: 0,
      lifecycleReconciledCount: lifecycleResult.updatedCount,
      lifecycleWarning: lifecycleResult.ok ? "" : lifecycleResult.reason,
    });
  }

  async reconcileMandalaPlanningLifecycleTargets(targets = [], options = {}) {
    const lifecycleByExternalKey = new Map();
    (Array.isArray(targets) ? targets : []).forEach((target) => {
      const source = buildExternalSource(target);
      if (!source.externalKey || source.sourcePlugin !== TIMELINE_SOURCE_PLUGIN_MANDALA || !source.lifecycle) return;
      lifecycleByExternalKey.set(source.externalKey, source.lifecycle);
    });
    if (!lifecycleByExternalKey.size) return { ok: true, updatedCount: 0 };
    const data = await this.loadTimelineDataFile(false);
    let updatedCount = 0;
    data.items = (Array.isArray(data.items) ? data.items : []).map((item) => {
      if (!isMandalaPlanningItem(item)) return item;
      const lifecycle = lifecycleByExternalKey.get(getMandalaExternalKey(item));
      if (!lifecycle) return item;
      const merged = mergeMandalaLifecycleEvidence(item, lifecycle);
      if (merged.changed) updatedCount += 1;
      return merged.item;
    });
    if (updatedCount > 0) {
      await this.saveTimelineDataFile(data);
      if (options.reload !== false) await this.reloadOpenViews();
      console.info("[Timeline Planner][mandala-lifecycle.reconcile]", { updatedCount });
    }
    return { ok: true, updatedCount };
  }

  async refreshMandalaPlanningItemDates(options = {}) {
    const endDate = normalizeDateText(options.endDate, getNextMonthKey());
    if (!endDate) return { ok: true, updatedCount: 0, endDate: "" };
    const lifecycleSnapshot = await this.getMandalaPlanningLifecycleSnapshot(options);
    if (!lifecycleSnapshot.ok) {
      return { ok: false, reason: lifecycleSnapshot.reason || "lifecycle-snapshot-unavailable", updatedCount: 0, endDate };
    }
    const data = await this.loadTimelineDataFile(false);
    let updatedCount = 0;
    let lifecycleReconciledCount = 0;
    data.items = (Array.isArray(data.items) ? data.items : []).map((item) => {
      if (!isMandalaPlanningItem(item)) return item;
      const lifecycle = lifecycleSnapshot.lifecycleByExternalKey[getMandalaExternalKey(item)];
      let nextItem = item;
      if (lifecycle) {
        const merged = mergeMandalaLifecycleEvidence(nextItem, lifecycle);
        nextItem = merged.item;
        if (merged.changed) lifecycleReconciledCount += 1;
      }
      if (!lifecycle || text(lifecycle.status) === "stopped") return nextItem;
      if (text(nextItem.endDate) === endDate) return nextItem;
      updatedCount += 1;
      return Object.assign({}, nextItem, { endDate, updated: new Date().toISOString() });
    });
    if (updatedCount > 0 || lifecycleReconciledCount > 0) {
      await this.saveTimelineDataFile(data);
      if (options.reload !== false) await this.reloadOpenViews();
      console.info("[Timeline Planner][mandala-items.maintenance]", {
        updatedCount,
        lifecycleReconciledCount,
        endDate,
        stoppedSkippedCount: Object.values(lifecycleSnapshot.lifecycleByExternalKey).filter((entry) => text(entry.status) === "stopped").length,
      });
    }
    return { ok: true, updatedCount, lifecycleReconciledCount, endDate, stoppedSkippedCount: Object.values(lifecycleSnapshot.lifecycleByExternalKey).filter((entry) => text(entry.status) === "stopped").length };
  }

  async ensureExternalItems(candidates = [], options = {}) {
    const data = await this.loadTimelineDataFile(true);
    const items = Array.isArray(data.items) ? data.items.slice() : [];
    const existingColors = items.map((item) => item.color).filter(Boolean);
    const savedItems = [];
    let importedCount = 0;
    let updatedCount = 0;
    candidates.forEach((candidate) => {
      const item = normalizeExternalCandidate(candidate, options);
      if (!item) return;
      if (!item.color) item.color = `hsl(${parseInt(stableHash(item.externalSource.externalKey).slice(0, 4), 36) % 360}, 65%, 55%)`;
      const existingIndex = items.findIndex((entry) => isExternalMatch(entry, item.externalSource) || text(entry.id) === item.id);
      if (existingIndex >= 0) {
        const prev = items[existingIndex] || {};
        items[existingIndex] = Object.assign({}, prev, {
          name: item.name,
          startDate: item.startDate || prev.startDate,
          endDate: item.endDate || prev.endDate,
          startTime: item.startTime || prev.startTime || "09:00",
          endTime: item.endTime || prev.endTime || "18:00",
          kind: prev.kind || item.kind || "task",
          comment: item.comment || prev.comment || "",
          color: prev.color || item.color,
          tags: Array.from(new Set([...(Array.isArray(prev.tags) ? prev.tags : []), ...(Array.isArray(item.tags) ? item.tags : [])].map((tag) => text(tag)).filter(Boolean))),
          daySlots: prev.daySlots && typeof prev.daySlots === "object" && !Array.isArray(prev.daySlots) ? prev.daySlots : {},
          externalSource: Object.assign({}, prev.externalSource || {}, item.externalSource, {
            lifecycle: item.externalSource?.lifecycle || prev.externalSource?.lifecycle,
          }),
          updated: new Date().toISOString(),
        });
        savedItems.push(items[existingIndex]);
        updatedCount += 1;
      } else {
        const next = Object.assign({}, item, {
          created: item.created || new Date().toISOString().slice(0, 19).replace("T", " "),
          color: item.color || existingColors[items.length % Math.max(existingColors.length, 1)] || "hsl(210, 65%, 55%)",
        });
        items.push(next);
        savedItems.push(next);
        importedCount += 1;
      }
    });
    data.items = items;
    if (importedCount > 0 || updatedCount > 0) await this.saveTimelineDataFile(data);
    if (options.reload !== false) await this.reloadOpenViews();
    console.info("[Timeline Planner][external-items.ensure]", {
      sourcePlugin: text(options.sourcePlugin, TIMELINE_SOURCE_PLUGIN_MANDALA),
      candidateCount: Array.isArray(candidates) ? candidates.length : 0,
      importedCount,
      updatedCount,
    });
    return { ok: true, importedCount, updatedCount, count: savedItems.length, items: savedItems.map((item) => this.normalizeTimelineItemSnapshot(item)) };
  }

  normalizeTimelineItemSnapshot(item = {}) {
    const source = item.externalSource && typeof item.externalSource === "object" ? item.externalSource : {};
    return {
      id: text(item.id),
      timelineItemId: text(item.id),
      nodeKey: this.getTimelineNodeKeyForItem(text(item.id)),
      name: text(item.name),
      label: text(item.name),
      startDate: text(item.startDate),
      endDate: text(item.endDate),
      kind: text(item.kind || item.type),
      tags: Array.isArray(item.tags) ? item.tags.map((tag) => text(tag)).filter(Boolean) : [],
      externalSource: Object.assign({}, source),
      sourcePlugin: text(source.sourcePlugin),
      sourceType: text(source.sourceType),
      sourceId: text(source.sourceId),
      sourceKey: text(source.sourceKey),
      externalKey: text(source.externalKey),
    };
  }

  getTimelineNodeKeyForItem(itemId = "") {
    const source = this.resolveSourceContext();
    const encode = (value) => encodeURIComponent(String(value || ""));
    return `jump:v1:${TIMELINE_RELATION_VIEW_TYPE}|${encode(source.path)}|timeline|root|${encode(itemId)}`;
  }

  async getPlanningMilestoneSnapshot(options = {}) {
    const rawData = await this.loadTimelineDataFile(false);
    const lifecycleSnapshot = await this.getMandalaPlanningLifecycleSnapshot(options);
    const data = this.projectTimelineData(rawData, lifecycleSnapshot.ok ? lifecycleSnapshot.lifecycleByExternalKey : {});
    const range = normalizeMilestoneSnapshotDateRange(options);
    const sourceTypes = normalizeSourceTypes(options.sourceTypes || options.sourceType || options.domain);
    const sourceIds = new Set((Array.isArray(options.sourceIds) ? options.sourceIds : []).map((id) => text(id)).filter(Boolean));
    const sourceKeys = new Set((Array.isArray(options.sourceKeys) ? options.sourceKeys : []).map((key) => text(key)).filter(Boolean));
    const requestedExternalKeys = new Set((Array.isArray(options.externalKeys) ? options.externalKeys : []).map((key) => text(key)).filter(Boolean));
    const itemsById = new Map();
    (Array.isArray(data.items) ? data.items : []).forEach((item) => {
      const source = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : null;
      if (!source || text(source.sourcePlugin) !== TIMELINE_SOURCE_PLUGIN_MANDALA) return;
      if (sourceTypes.length && !sourceTypes.includes(text(source.sourceType))) return;
      if (sourceIds.size && !sourceIds.has(text(source.sourceId))) return;
      if (sourceKeys.size && !sourceKeys.has(text(source.sourceKey))) return;
      if (requestedExternalKeys.size && !requestedExternalKeys.has(text(source.externalKey))) return;
      itemsById.set(text(item.id), item);
    });
    const rows = [];
    let invalidDateCount = 0;
    let unknownTimeBlockCount = 0;
    Object.values(data.milestones || {}).forEach((milestone) => {
      const item = itemsById.get(text(milestone?.itemId));
      if (!item) return;
      const date = normalizeStrictDateKey(milestone.date);
      if (!date) {
        invalidDateCount += 1;
        return;
      }
      if (range.start && date < range.start) return;
      if (range.end && date > range.end) return;
      const source = item.externalSource || {};
      const timeBlockId = text(item?.daySlots?.[date]);
      const timeBlockOrder = TIMELINE_TIME_BLOCKS.findIndex((block) => block.id === timeBlockId);
      const timeBlock = timeBlockOrder >= 0 ? TIMELINE_TIME_BLOCKS[timeBlockOrder] : null;
      if (timeBlockId && !timeBlock) unknownTimeBlockCount += 1;
      rows.push({
        id: text(milestone.id),
        milestoneId: text(milestone.id),
        milestoneName: text(milestone.name),
        name: text(milestone.name),
        comment: text(milestone.comment),
        completed: milestone.completed === true,
        date,
        weekdayLabel: getWeekdayLabel(date),
        timeBlockId: timeBlock?.id || "",
        timeBlockLabel: timeBlock?.label || "未安排时段",
        timeBlockRange: timeBlock?.range || "",
        timeBlockOrder: timeBlockOrder >= 0 ? timeBlockOrder : TIMELINE_TIME_BLOCKS.length,
        itemId: text(item.id),
        timelineItemId: text(item.id),
        itemName: text(item.name),
        timelineNodeKey: this.getTimelineNodeKeyForItem(text(item.id)),
        sourcePlugin: text(source.sourcePlugin),
        sourceType: text(source.sourceType),
        domain: text(source.sourceType),
        sourceId: text(source.sourceId),
        sourceKey: text(source.sourceKey),
        externalKey: text(source.externalKey),
      });
    });
    rows.sort(comparePlanningMilestoneRows);
    const limit = normalizeMilestoneSnapshotLimit(options.limit);
    const totalCount = rows.length;
    const projectedRows = rows.slice(0, limit);
    return {
      ok: true,
      pluginId: this.manifest.id,
      snapshotType: "timeline-planning-milestones",
      startDate: range.start,
      endDate: range.end,
      count: projectedRows.length,
      totalCount,
      limit,
      truncated: totalCount > projectedRows.length,
      invalidDateCount,
      unknownTimeBlockCount,
      timeBlocks: TIMELINE_TIME_BLOCKS.map((block, order) => Object.assign({ order }, block)),
      items: projectedRows,
    };
  }

  async getPrimaryWaveOrderSnapshot(options = {}) {
    const targetDate = normalizeStrictDateKey(options.date || options.targetDate || getTodayKey());
    if (!targetDate) return { ok: false, complete: false, truncated: false, reason: "invalid-target-date", items: [] };
    const rawData = await this.loadTimelineDataFile(false);
    const lifecycleSnapshot = await this.getMandalaPlanningLifecycleSnapshot(options);
    const data = this.projectTimelineData(rawData, lifecycleSnapshot.ok ? lifecycleSnapshot.lifecycleByExternalKey : {});
    const persistedRange = data?.settings?.viewRange && typeof data.settings.viewRange === "object"
      ? data.settings.viewRange
      : {};
    const rangeMode = text(persistedRange.mode, "week");
    const replayStart = rangeMode === "custom"
      ? normalizeStrictDateKey(persistedRange.customStart)
      : getIsoWeekStartDateKey(targetDate);
    if (!replayStart || replayStart > targetDate) {
      return {
        ok: false,
        complete: false,
        truncated: false,
        reason: !replayStart ? "invalid-persisted-range-start" : "persisted-range-start-after-target",
        targetDate,
        rangeMode,
        replayStart,
        persistedRangeEnd: normalizeStrictDateKey(persistedRange.customEnd),
        items: [],
      };
    }
    const dateRange = buildInclusiveDateKeys(replayStart, targetDate, TIMELINE_PRIMARY_WAVE_MAX_DAYS);
    if (!dateRange.ok) {
      return Object.assign({}, dateRange, {
        targetDate,
        rangeMode,
        replayStart,
        persistedRangeEnd: normalizeStrictDateKey(persistedRange.customEnd),
        items: [],
      });
    }
    const waveItems = (Array.isArray(data.items) ? data.items : []).filter((item) => {
      if (text(item.kind || item.type).toLowerCase() === "schedule") return false;
      const source = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : null;
      if (text(source?.sourcePlugin) !== TIMELINE_SOURCE_PLUGIN_MANDALA) return true;
      const name = text(item.name || item.label);
      return !!name && name !== "已删除" && !/^item_[a-z0-9]+$/i.test(name) && !/^[a-z0-9]{10,}$/i.test(name);
    });
    const wave = buildTimelineDailyWaveOrder(dateRange.dates, waveItems);
    if (!wave.ok || wave.complete !== true || wave.truncated === true) {
      return Object.assign({}, wave, {
        ok: false,
        complete: false,
        targetDate,
        rangeMode,
        replayStart,
        persistedRangeEnd: normalizeStrictDateKey(persistedRange.customEnd),
        items: [],
      });
    }
    const itemById = new Map(waveItems.map((item) => [text(item.id), item]));
    const rows = [];
    const identityCounts = new Map();
    (wave.orders[targetDate] || []).forEach((itemId, waveRank) => {
      const item = itemById.get(text(itemId));
      const identity = resolveTimelinePrimaryIdentity(item);
      if (!identity) return;
      const identityKey = `${identity.sourceType}::${identity.identity}`;
      identityCounts.set(identityKey, (identityCounts.get(identityKey) || 0) + 1);
      const timeBlockId = text(item?.daySlots?.[targetDate]);
      const timeBlockOrder = TIMELINE_TIME_BLOCKS.findIndex((block) => block.id === timeBlockId);
      rows.push(Object.assign({}, identity, {
        timelineItemId: text(item.id),
        itemName: text(item.name),
        waveRank,
        timeBlockId,
        timeBlockOrder: timeBlockOrder >= 0 ? timeBlockOrder : TIMELINE_TIME_BLOCKS.length,
        timeBlockLabel: timeBlockOrder >= 0 ? TIMELINE_TIME_BLOCKS[timeBlockOrder].label : "未安排时段",
      }));
    });
    const duplicateIdentityCount = Array.from(identityCounts.values())
      .reduce((count, value) => count + Math.max(0, value - 1), 0);
    return {
      ok: true,
      complete: true,
      truncated: false,
      reason: "",
      pluginId: this.manifest.id,
      snapshotType: "timeline-primary-wave-order",
      targetDate,
      rangeMode,
      replayStart,
      persistedRangeEnd: normalizeStrictDateKey(persistedRange.customEnd),
      dateCount: wave.dateCount,
      itemCount: wave.itemCount,
      operationCount: wave.operationCount,
      totalColumnCount: (wave.orders[targetDate] || []).length,
      count: rows.length,
      duplicateIdentityCount,
      transientFiltersApplied: false,
      items: rows,
    };
  }

  async loadEngineRunner() {
    if (typeof this.engineRunner === "function") return this.engineRunner;
    const candidatePaths = [
      `${this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`}/timeline-engine.js`,
      `.obsidian/plugins/${this.manifest.id}/timeline-engine.js`,
    ].filter(Boolean);

    let code = "";
    let loadedPath = "";
    for (const candidatePath of candidatePaths) {
      try {
        if (!(await this.app.vault.adapter.exists(candidatePath))) continue;
        code = await this.app.vault.adapter.read(candidatePath);
        loadedPath = candidatePath;
        break;
      } catch (error) {
        console.warn("[Timeline Planner][engine-load-candidate-fail]", {
          path: candidatePath,
          message: error?.message || String(error),
        });
      }
    }

    if (!code) {
      throw new Error(`Cannot load timeline-engine.js from plugin directory: ${candidatePaths.join(", ")}`);
    }

    const module = { exports: {} };
    const factory = new Function("module", "exports", "require", `${code}\n;return module.exports;`);
    const runner = factory(module, module.exports, require);
    if (typeof runner !== "function") {
      throw new Error(`timeline-engine.js did not export a runner function: ${loadedPath}`);
    }
    this.engineRunner = runner;
    console.info("[Timeline Planner][engine-load]", { status: "OK", path: loadedPath });
    return runner;
  }

  findSourceNotePath() {
    const configured = text(this.runtimeSourceNotePath, text(this.settings.sourceNotePath));
    if (configured) {
      const file = this.app.vault.getAbstractFileByPath(configured);
      if (file instanceof TFile) return file.path;
      return configured;
    }
    const matched = this.app.vault.getMarkdownFiles()
      .find((file) => file.basename === TIMELINE_NOTE_BASENAME);
    if (matched) return matched.path;
    if (this.settings.dataFolder) return `${this.settings.dataFolder}/${TIMELINE_NOTE_BASENAME}.md`;
    return `${TIMELINE_NOTE_BASENAME}.md`;
  }

  resolveSourceContext() {
    const path = this.findSourceNotePath();
    const file = this.app.vault.getAbstractFileByPath(path);
    const folder = file instanceof TFile
      ? text(file.parent?.path)
      : text(this.settings.dataFolder, parentFolder(path));
    const name = file instanceof TFile ? file.basename : fileNameWithoutExt(path);
    return {
      path,
      folder,
      name,
      exists: file instanceof TFile,
    };
  }

  async activateView() {
    await this.refreshMandalaPlanningItemDates({ reload: false });
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE_PLANNER)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_TIMELINE_PLANNER, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    if (view instanceof TimelinePlannerView) await view.render();
    return leaf;
  }

  async reloadOpenViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE_PLANNER);
    await Promise.all(leaves.map(async (leaf) => {
      if (leaf.view instanceof TimelinePlannerView) await leaf.view.render();
    }));
  }

  async renderEmbeddedTimeline(container, options = {}) {
    if (!container || typeof container.createDiv !== "function") {
      return { ok: false, reason: "missing-container" };
    }
    if (options.skipMaintenance !== true) await this.refreshMandalaPlanningItemDates({ reload: false });
    container.empty();
    const root = container.createDiv({ cls: "timeline-planner-root timeline-planner-embedded-root" });
    root.dataset.timelinePluginHost = "1";
    root.dataset.timelineEmbeddedHost = text(options.hostPlugin || options.source || "embedded");
    const sourceContext = this.resolveSourceContext();
    root.dataset.timelineSourcePath = sourceContext.path;
    root.dataset.timelineDataFolder = sourceContext.folder;

    const momentApi = window.moment;
    if (!momentApi) {
      root.createDiv({ cls: "timeline-planner-error", text: "未找到 Obsidian moment API，Timeline 嵌入视图无法启动。" });
      return { ok: false, reason: "missing-moment-api" };
    }

    try {
      const runTimelinePlannerEngine = await this.loadEngineRunner();
      const visibilitySnapshot = await this.getMandalaTimelineVisibilitySnapshot(options);
      const lifecycleSnapshot = visibilitySnapshot.lifecycleSnapshot;
      const mandalaActiveExternalKeys = visibilitySnapshot.ok
        ? await this.getMandalaActivePlanningExternalKeys(options)
        : null;
      await runTimelinePlannerEngine({
        app: this.app,
        obsidian,
        moment: momentApi,
        container: root,
        sourceContext,
        Notice,
        TFile,
        embeddedMode: true,
        embeddedViewMode: options.viewMode || options.mode || "dayblock",
        mandalaSourceFilter: options.sourceFilter || options.mandalaSourceFilter || "all",
        mandalaActiveExternalKeys,
        mandalaEffectiveGoalExternalKeys: visibilitySnapshot.effectiveGoalExternalKeys,
        mandalaEffectiveGoalStatus: {
          ok: visibilitySnapshot.effectiveGoalSnapshot.ok,
          reason: visibilitySnapshot.effectiveGoalSnapshot.reason || "",
          revision: visibilitySnapshot.effectiveGoalSnapshot.revision || "",
        },
        mandalaEffectiveProjectExternalKeys: visibilitySnapshot.effectiveProjectExternalKeys,
        mandalaEffectiveProjectStatus: {
          ok: visibilitySnapshot.effectiveProjectSnapshot.ok,
          reason: visibilitySnapshot.effectiveProjectSnapshot.reason || "",
          revision: visibilitySnapshot.effectiveProjectSnapshot.revision || "",
        },
        projectTimelineData: (data) => this.projectTimelineData(data, lifecycleSnapshot.lifecycleByExternalKey),
        buildTimelineDailyWaveOrder,
        mergeTimelineEditableItemPatch: (rawItem, patch) => this.mergeTimelineEditableItemPatch(rawItem, patch),
        applyTimelineEditablePatchToData: (rawData, itemId, patch) => this.applyTimelineEditablePatchToData(rawData, itemId, patch),
      });
      this.embeddedTimelineSessions.set(container, Object.assign({}, options));
      console.info("[Timeline Planner][embedded-render]", {
        status: "OK",
        viewMode: options.viewMode || options.mode || "dayblock",
        sourceFilter: options.sourceFilter || options.mandalaSourceFilter || "all",
        mandalaActiveExternalKeyCount: Array.isArray(mandalaActiveExternalKeys) ? mandalaActiveExternalKeys.length : null,
        sourceNotePath: sourceContext.path,
        dataFolder: sourceContext.folder,
      });
      return { ok: true, viewMode: options.viewMode || options.mode || "dayblock", sourceFilter: options.sourceFilter || options.mandalaSourceFilter || "all" };
    } catch (error) {
      console.error("[Timeline Planner][embedded-render-fail]", error);
      root.empty();
      root.createDiv({
        cls: "timeline-planner-error",
        text: `Timeline 嵌入视图渲染失败：\n${error?.stack || error?.message || String(error)}`,
      });
      return { ok: false, reason: error?.message || String(error) };
    }
  }

  async openNode(nodeKey, context = {}) {
    const parsed = parseJumpNodeKey(nodeKey);
    if (parsed?.viewType && parsed.viewType !== TIMELINE_RELATION_VIEW_TYPE) return false;
    this.runtimeSourceNotePath = text(parsed?.notePath, text(context?.notePath, this.runtimeSourceNotePath || this.settings.sourceNotePath));
    if (nodeKey) window.timelinePendingRelationFocusNodeKey = text(nodeKey);
    await this.activateView();
    console.info("[Timeline Planner][open-node]", {
      nodeKey,
      notePath: this.runtimeSourceNotePath || this.resolveSourceContext().path,
      via: "plugin-opener",
    });
    return true;
  }

  registerGlobalApi() {
    window.__timelinePlannerPluginApi = {
      pluginId: this.manifest.id,
      pluginVersion: this.manifest.version,
      openView: async (options = {}) => {
        if (typeof options === "string") this.runtimeSourceNotePath = options;
        else if (options?.notePath) this.runtimeSourceNotePath = text(options.notePath);
        if (options?.nodeKey) window.timelinePendingRelationFocusNodeKey = text(options.nodeKey);
        await this.activateView();
        return true;
      },
      openNode: async (nodeKey, context = {}) => this.openNode(nodeKey, context),
      reload: async () => this.reloadOpenViews(),
      getSourceContext: () => this.resolveSourceContext(),
      importMandalaPlanningTargets: async (options = {}) => await this.importMandalaPlanningTargets(options),
      ensureExternalItems: async (items = [], options = {}) => await this.ensureExternalItems(items, options),
      refreshMandalaPlanningItemDates: async (options = {}) => await this.refreshMandalaPlanningItemDates(options),
      getPlanningMilestoneSnapshot: async (options = {}) => await this.getPlanningMilestoneSnapshot(options),
      getPrimaryWaveOrderSnapshot: async (options = {}) => await this.getPrimaryWaveOrderSnapshot(options),
      renderEmbeddedTimeline: async (container, options = {}) => await this.renderEmbeddedTimeline(container, options),
    };
  }

  registerJumpOpener() {
    this.jumpOpenerId = `timeline-planner::${this.manifest.id}`;
    ensureJumpOpenerRegistry().register({
      openerId: this.jumpOpenerId,
      viewType: TIMELINE_RELATION_VIEW_TYPE,
      openNode: async (nodeKey, context = {}) => this.openNode(nodeKey, context),
    });
  }

  unregisterJumpOpener() {
    if (!this.jumpOpenerId) return;
    ensureJumpOpenerRegistry().unregister(this.jumpOpenerId);
  }
};

module.exports.__test = Object.freeze({
  buildInclusiveDateKeys,
  buildTimelineDailyWaveOrder,
  getIsoWeekStartDateKey,
  resolveTimelinePrimaryIdentity,
  timelineProjectExternalKey,
  validateEffectiveOperationalContextSnapshot,
});
