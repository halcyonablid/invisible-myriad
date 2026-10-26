const TIMELINE_MANDALA_PLUGIN_ID = "mandala-time-blocks";
const TIMELINE_JUMP_NODE_PREFIX = "jump:v1:";
const TIMELINE_JUMP_NODE_SEGMENT_COUNT = 5;
const TIMELINE_WORKSPACE_VIEW_TYPE = "workspace-mount-view";

function timelineNavigationText(value) {
  return String(value == null ? "" : value).trim();
}

function decodeTimelineJumpSegment(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_) {
    return timelineNavigationText(value);
  }
}

function parseTimelineWorkspaceJumpKey(nodeKey) {
  const normalized = timelineNavigationText(nodeKey);
  if (!normalized.startsWith(TIMELINE_JUMP_NODE_PREFIX)) return null;
  const encodedSegments = normalized.slice(TIMELINE_JUMP_NODE_PREFIX.length).split("|");
  if (encodedSegments.length !== TIMELINE_JUMP_NODE_SEGMENT_COUNT) return null;
  const [viewType, notePath, scopeType, scopeId, itemId] = encodedSegments.map(decodeTimelineJumpSegment);
  if (!viewType || !notePath || !scopeType || !scopeId || !itemId) return null;
  if (viewType !== TIMELINE_WORKSPACE_VIEW_TYPE || scopeType !== "tab") return null;
  return { nodeKey: normalized, viewType, notePath, scopeType, scopeId, itemId };
}

function resolveMandalaWeeklyTrackingTarget(item = {}) {
  const source = item?.externalSource && typeof item.externalSource === "object" ? item.externalSource : null;
  if (timelineNavigationText(source?.sourcePlugin) !== TIMELINE_MANDALA_PLUGIN_ID) return null;
  const sourceType = timelineNavigationText(source?.sourceType);
  if (sourceType !== "goal" && sourceType !== "project") return null;
  const sourceRef = timelineNavigationText(source?.sourceKey || source?.sourceId);
  if (!sourceRef) return null;
  if (sourceType === "project" && !parseTimelineWorkspaceJumpKey(sourceRef)) return null;
  if (sourceType === "goal" && sourceRef.startsWith(TIMELINE_JUMP_NODE_PREFIX)) return null;
  return {
    sourceType,
    sourceRef,
    options: sourceType === "project"
      ? {
          initialTab: "workspaceNode",
          workspaceNodeId: sourceRef,
          primaryNodeKey: sourceRef,
          source: "timeline-planner",
          readOnlyNavigation: true,
        }
      : {
          initialTab: "node",
          goalNodeId: sourceRef,
          mandalaNodeId: sourceRef,
          source: "timeline-planner",
          readOnlyNavigation: true,
        },
  };
}

function resolveTimelineMandalaApi(app) {
  const windowApi = typeof window !== "undefined" ? window.__mandalaTimeBlocksPluginApi : null;
  const plugin = app?.plugins?.plugins?.[TIMELINE_MANDALA_PLUGIN_ID];
  return windowApi || plugin?.globalApi || plugin?.api || null;
}

async function openMandalaWeeklyTrackingFromTimeline(item, context = {}) {
  const target = resolveMandalaWeeklyTrackingTarget(item);
  const Notice = context.Notice;
  const notify = (message) => {
    try {
      if (typeof Notice === "function") new Notice(message);
    } catch (_) {}
  };
  if (!target) {
    console.warn("[Timeline Planner][mandala-weekly-tracking.open-skipped]", { reason: "invalid-external-identity" });
    notify("该事项没有可用的九宫格周追踪主键");
    return { ok: false, reason: "invalid-external-identity" };
  }
  const api = resolveTimelineMandalaApi(context.app);
  if (typeof api?.openWeeklyTrackingDashboard !== "function") {
    console.warn("[Timeline Planner][mandala-weekly-tracking.open-skipped]", {
      reason: "missing-mandala-api",
      sourceType: target.sourceType,
    });
    notify("九宫格周追踪接口不可用，请重载九宫格插件");
    return { ok: false, reason: "missing-mandala-api", target };
  }
  try {
    const result = await api.openWeeklyTrackingDashboard(target.sourceRef, target.options);
    if (result !== true && result?.ok !== true) {
      console.warn("[Timeline Planner][mandala-weekly-tracking.open-failed]", {
        reason: "non-success-result",
        sourceType: target.sourceType,
      });
      notify("未能打开对应的九宫格周追踪");
      return { ok: false, reason: "non-success-result", target };
    }
    console.info("[Timeline Planner][mandala-weekly-tracking.open]", {
      status: "OK",
      sourceType: target.sourceType,
    });
    return { ok: true, target };
  } catch (error) {
    console.warn("[Timeline Planner][mandala-weekly-tracking.open-failed]", {
      reason: "api-error",
      sourceType: target.sourceType,
      message: error?.message || String(error),
    });
    notify("打开九宫格周追踪失败，请稍后重试");
    return { ok: false, reason: "api-error", target };
  }
}

function buildTimelineUiDailyOrderMap(canonicalHelper, dates = [], items = [], timeBlocks = []) {
  const result = canonicalHelper(dates, items, { timeBlocks });
  return result?.ok === true && result?.complete === true && result?.truncated !== true
    ? (result.orders || {})
    : {};
}

module.exports = async function runTimelinePlannerEngine(context) {
  const app = context.app;
  const obsidian = context.obsidian;
  const moment = context.moment;
  const Notice = context.Notice;
  const TFile = context.TFile;
  const container = context.container;
  const hostActive = () => typeof context.isActive !== "function" || context.isActive();
  let renderEpoch = 0;
  const engineActive = () => hostActive();
  const sourceContext = context.sourceContext || {};
  const projectTimelineData = typeof context.projectTimelineData === "function" ? context.projectTimelineData : null;
  const applyTimelineProjection = async (data) => projectTimelineData ? (await projectTimelineData(data)) : data;
  const mergeTimelineEditableItemPatch = typeof context.mergeTimelineEditableItemPatch === "function"
    ? context.mergeTimelineEditableItemPatch
    : ((rawItem, patch) => {
        const next = { ...rawItem };
        ["name", "startDate", "endDate", "startTime", "endTime", "comment", "tags"].forEach((field) => {
            if (!Object.prototype.hasOwnProperty.call(patch || {}, field)) return;
            next[field] = field === "tags" ? [...(Array.isArray(patch.tags) ? patch.tags : [])] : patch[field];
        });
        return next;
    });
  const applyTimelineEditablePatchToData = typeof context.applyTimelineEditablePatchToData === "function"
    ? context.applyTimelineEditablePatchToData
    : ((rawData, itemId, patch) => {
        const items = Array.isArray(rawData?.items) ? rawData.items : [];
        const index = items.findIndex((item) => String(item?.id || "") === String(itemId || ""));
        if (index < 0) return false;
        items[index] = mergeTimelineEditableItemPatch(items[index], patch);
        return true;
    });
  const buildCanonicalDailyWaveOrder = context.buildTimelineDailyWaveOrder;
  if (typeof buildCanonicalDailyWaveOrder !== "function") {
    throw new Error("Timeline canonical daily wave-order helper is unavailable");
  }
  const embeddedOptions = context.embedded && typeof context.embedded === "object" ? context.embedded : {};
  const isEmbeddedMode = context.embedded === true || context.embeddedMode === true || embeddedOptions.enabled === true;
  const cleanEmbeddedText = (value) => String(value == null ? "" : value).trim();
  const normalizeEmbeddedViewMode = (value) => {
    const mode = String(value || "").trim();
    return ["dayblock", "wave"].includes(mode) ? mode : "dayblock";
  };
  const requestedEmbeddedViewMode = normalizeEmbeddedViewMode(context.embeddedViewMode || embeddedOptions.viewMode || embeddedOptions.mode);
  const requestedMandalaSourceFilter = String(context.mandalaSourceFilter || embeddedOptions.sourceFilter || embeddedOptions.mandalaSourceFilter || "").trim();
  const mandalaActiveExternalKeys = Array.isArray(context.mandalaActiveExternalKeys || embeddedOptions.activeExternalKeys)
    ? new Set((context.mandalaActiveExternalKeys || embeddedOptions.activeExternalKeys).map(cleanEmbeddedText).filter(Boolean))
    : null;
  const mandalaEffectiveGoalExternalKeys = Array.isArray(context.mandalaEffectiveGoalExternalKeys || embeddedOptions.effectiveGoalExternalKeys)
    ? new Set((context.mandalaEffectiveGoalExternalKeys || embeddedOptions.effectiveGoalExternalKeys).map(cleanEmbeddedText).filter(Boolean))
    : null;
  const mandalaEffectiveGoalStatus = context.mandalaEffectiveGoalStatus && typeof context.mandalaEffectiveGoalStatus === "object"
    ? context.mandalaEffectiveGoalStatus
    : { ok: false, reason: "effective-goal-snapshot-unavailable" };
  const mandalaEffectiveProjectExternalKeys = Array.isArray(context.mandalaEffectiveProjectExternalKeys || embeddedOptions.effectiveProjectExternalKeys)
    ? new Set((context.mandalaEffectiveProjectExternalKeys || embeddedOptions.effectiveProjectExternalKeys).map(cleanEmbeddedText).filter(Boolean))
    : null;
  const mandalaEffectiveProjectStatus = context.mandalaEffectiveProjectStatus && typeof context.mandalaEffectiveProjectStatus === "object"
    ? context.mandalaEffectiveProjectStatus
    : { ok: false, reason: "effective-project-snapshot-unavailable" };
  const getCurrentFile = () => {
    const path = String(sourceContext.path || "时间线的安排.md");
    const fileName = path.replace(/\\/g, "/").split("/").pop() || "时间线的安排.md";
    const basename = String(sourceContext.name || fileName.replace(/\.md$/i, "") || "时间线的安排");
    return {
      path,
      folder: String(sourceContext.folder || path.replace(/\\/g, "/").split("/").slice(0, -1).join("/")),
      name: fileName,
      basename,
    };
  };

// ============================================================
// 🗓️ Timeline 时间线视图系统 (v4.0 Mermaid版)
// 功能：Mermaid Gantt时间轴 + 缩放 + 周标记
// 渲染方式：使用 window.mermaid 渲染，与 ATOM 视图系统一致
// ============================================================

return (async () => {

    // ===== 1. 配置与数据管理 =====
    const JSON_FILENAME = "Timeline_Data.json";
    const TAGS_FILENAME = "Timeline_Tags.json";  // 独立的标签文件
    const currentFolder = getCurrentFile().folder;
    const DATA_PATH = currentFolder + "/" + JSON_FILENAME;
    const TAGS_PATH = currentFolder + "/" + TAGS_FILENAME;
    const TAG_FILTER_STORAGE_KEY = `timeline.tagFilters::${DATA_PATH}`;
    const TAG_FILTER_PRESETS_STORAGE_KEY = `timeline.tagFilterPresets::${DATA_PATH}`;
    const TIMELINE_RELATION_VIEW_TYPE = "timeline";
    const currentNotePath = getCurrentFile().path || "";

    // 视图范围默认配置
    const DEFAULT_VIEW_SETTINGS = {
        viewRange: {
            mode: "week",  // week | custom
            customStart: moment().startOf("isoWeek").format("YYYY-MM-DD"),
            customEnd: moment().endOf("isoWeek").format("YYYY-MM-DD")
        },
        ganttRangeMode: "auto" // auto | view
    };

    // 默认标签定义
    const DEFAULT_TAG_DEFINITIONS = {
        "work-type":     { label: "工作类型", icon: "📋", color: "#7f8c8d", parentId: null, isCategory: true, order: 0 },
        "system":        { label: "架构设计", icon: "🏗️", color: "#9b59b6", parentId: "work-type", isCategory: false, order: 0 },
        "learning":      { label: "学习钻研", icon: "📚", color: "#3498db", parentId: "work-type", isCategory: false, order: 1 },
        "review":        { label: "复盘沉淀", icon: "💡", color: "#f1c40f", parentId: "work-type", isCategory: false, order: 2 },
        "urgent":        { label: "紧急救火", icon: "🔥", color: "#e74c3c", parentId: "work-type", isCategory: false, order: 3 },
        "waiting":       { label: "外部等待", icon: "⏳", color: "#95a5a6", parentId: "work-type", isCategory: false, order: 4 },
        "domain":        { label: "能力域", icon: "🎯", color: "#2c3e50", parentId: null, isCategory: true, order: 1 },
        "tech":          { label: "技术能力", icon: "⚙️", color: "#1abc9c", parentId: "domain", isCategory: false, order: 0 },
        "mgmt":          { label: "管理能力", icon: "👔", color: "#e67e22", parentId: "domain", isCategory: false, order: 1 },
        "personal":      { label: "个人发展", icon: "🌱", color: "#27ae60", parentId: "domain", isCategory: false, order: 2 },
        "priority":      { label: "紧急程度", icon: "⚡", color: "#8e44ad", parentId: null, isCategory: true, order: 2 },
        "p1-critical":   { label: "P1-紧急", icon: "🔴", color: "#c0392b", parentId: "priority", isCategory: false, order: 0 },
        "p2-high":       { label: "P2-重要", icon: "🟠", color: "#d35400", parentId: "priority", isCategory: false, order: 1 },
        "p3-normal":     { label: "P3-正常", icon: "🟡", color: "#f39c12", parentId: "priority", isCategory: false, order: 2 },
        "p4-low":        { label: "P4-低", icon: "🟢", color: "#27ae60", parentId: "priority", isCategory: false, order: 3 }
    };

    // 颜色池（用于事项自动着色，扩展至 64 组，均衡分布 HSL）
    const COLOR_POOL = Array.from({ length: 64 }, (_, i) => {
        const hue = Math.round((i * 360) / 64);
        return `hsl(${hue}, 65%, 55%)`;
    });

    // 七块时间段
    const TIME_BLOCKS = [
        { id: "morning", label: "早晨", range: "06:00-08:00" },
        { id: "am1", label: "上午1", range: "08:00-10:00" },
        { id: "am2", label: "上午2", range: "10:00-12:00" },
        { id: "pm1", label: "下午1", range: "13:00-15:00" },
        { id: "pm2", label: "下午2", range: "15:00-17:00" },
        { id: "eve1", label: "晚上1", range: "18:00-20:00" },
        { id: "eve2", label: "晚上2", range: "20:00-23:00" },
    ];

    // 统一的块索引：未分配返回最大值，方便落底
    const blockIndex = (item, dateStr) => {
        if (!item) return TIME_BLOCKS.length + 1;
        const slot = (item.daySlots || {})[dateStr] || null;
        const idx = TIME_BLOCKS.findIndex(b => b.id === slot);
        return idx >= 0 ? idx : TIME_BLOCKS.length + 1;
    };

    const buildDailyOrderMap = (dates, items) => {
        const orders = buildTimelineUiDailyOrderMap(buildCanonicalDailyWaveOrder, dates, items, TIME_BLOCKS);
        if (Object.keys(orders).length || dates.length === 0) return orders;
        const result = buildCanonicalDailyWaveOrder(dates, items, { timeBlocks: TIME_BLOCKS });
        console.warn("[Timeline Planner][wave-order.incomplete]", {
            reason: result?.reason || "unknown",
            dateCount: result?.dateCount,
            itemCount: result?.itemCount,
            operationCount: result?.operationCount,
        });
        return {};
    };

    // Mermaid Gantt 配置
    const MERMAID_CONFIG = {
        zoom: {
            day: { axisFormat: "%m/%d (%a)", sectionSize: 3, minCellWidth: 50 },
            week: { axisFormat: "%m/%d (第%W周)", sectionSize: 5, minCellWidth: 80 },
            month: { axisFormat: "%Y/%m", sectionSize: 10, minCellWidth: 120 },
            quarter: { axisFormat: "%Y Q%q", sectionSize: 15, minCellWidth: 150 }
        }
    };

    // 全局状态
    if (window.timelineZoom === undefined) window.timelineZoom = "week";
    if (window.timelineViewMode === undefined) window.timelineViewMode = "gantt";  // gantt | calendar | dayblock | wave
    if (window.timelineTagFilter === undefined) window.timelineTagFilter = null;
    if (window.timelineTagFilters === undefined) window.timelineTagFilters = [];
    if (window.timelineTagManagerMode === undefined) window.timelineTagManagerMode = false;
    if (window.timelineTagFilterPresets === undefined) window.timelineTagFilterPresets = [];
    if (window.timelineCurrentMonth === undefined) window.timelineCurrentMonth = moment();
    if (window.timelineMermaidState === undefined) window.timelineMermaidState = { zoom: 1.0, scrollLeft: 0, scrollTop: 0 };
    if (window.timelineRangeMode === undefined) window.timelineRangeMode = "week";
    if (window.timelineCustomStart === undefined) window.timelineCustomStart = moment().startOf("isoWeek").format("YYYY-MM-DD");
    if (window.timelineCustomEnd === undefined) window.timelineCustomEnd = moment().endOf("isoWeek").format("YYYY-MM-DD");
    if (window.timelineGanttRangeMode === undefined) window.timelineGanttRangeMode = "auto";
    if (window.timelineDayblockOnlyScheduled === undefined) window.timelineDayblockOnlyScheduled = false;
    if (window.timelineMandalaSourceFilter === undefined) window.timelineMandalaSourceFilter = "all";
    if (["all", "goal", "project"].includes(requestedMandalaSourceFilter)) window.timelineMandalaSourceFilter = requestedMandalaSourceFilter;
    if (window.timelineViewMode === "projectWorkspaceA") window.timelineViewMode = "gantt";

    // ===== 2. 工具函数 =====

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const encodeTimelineNodePart = (value) => encodeURIComponent(String(value || ""));
    const decodeTimelineNodePart = (value) => {
        try { return decodeURIComponent(String(value || "")); } catch (_) { return String(value || ""); }
    };
    const normalizeTimelineTime = (value, fallback = "") => {
        const raw = String(value || "").trim();
        return /^\d{1,2}:\d{2}$/.test(raw) ? raw.padStart(5, "0") : fallback;
    };
    const getTimelineNodeKey = (itemId) => `jump:v1:${TIMELINE_RELATION_VIEW_TYPE}|${encodeTimelineNodePart(currentNotePath)}|item|${encodeTimelineNodePart(DATA_PATH)}|${encodeTimelineNodePart(itemId)}`;
    const parseTimelineNodeKey = (nodeKey) => {
        const raw = String(nodeKey || "").trim();
        if (!raw.startsWith("jump:v1:")) return null;
        const parts = raw.slice("jump:v1:".length).split("|").map(decodeTimelineNodePart);
        if (parts.length !== 5 || parts[0] !== TIMELINE_RELATION_VIEW_TYPE) return null;
        return { viewType: parts[0], notePath: parts[1], scopeType: parts[2], scopeId: parts[3], itemId: parts[4] };
    };
    const getRelationsPluginApi = () => app?.plugins?.plugins?.["eva-cross-view-relations"]?.api || window.evaCrossViewRelations || null;
    const formatTimelineRange = (item = {}) => `${item.startDate || ""} ${item.startTime || ""} ~ ${item.endDate || ""} ${item.endTime || ""}`.replace(/\s+/g, " ").trim();
    const isScheduleItem = (item = {}) => String(item.kind || item.type || "").toLowerCase() === "schedule";
    const getTimelineItemLabel = (item = {}) => `${isScheduleItem(item) ? "⏱️ " : ""}${item.name || "未命名"}`;
    const getTimelineItemColor = (item = {}) => isScheduleItem(item) ? (item.color || getColorForItem(item.name || item.id || "schedule", []) || "#002FA7") : (item.color || "#999");
    const getTimelineItemBorder = (item = {}) => isScheduleItem(item) ? "2px dashed rgba(255,255,255,.9)" : "none";
    const getTimelineItemById = (itemId) =>
        (Array.isArray(timelineData.items) ? timelineData.items : []).find(item => String(item.id || "") === String(itemId || "")) || null;
    const getTimelineItemByNodeKey = (nodeKey) => {
        const parsed = parseTimelineNodeKey(nodeKey);
        return parsed ? getTimelineItemById(parsed.itemId) : null;
    };
    const getMandalaSourceFilter = () => ["all", "goal", "project"].includes(String(window.timelineMandalaSourceFilter || "")) ? String(window.timelineMandalaSourceFilter) : "all";
    const getMandalaImportSourceTypes = () => {
        const filter = getMandalaSourceFilter();
        if (filter === "goal") return ["goal"];
        if (filter === "project") return ["project"];
        return ["goal", "project"];
    };
    const getMandalaProjectHistoryVisible = () => window.timelineMandalaProjectHistoryVisible === true;
    const getMandalaGoalHistoryVisible = () => window.timelineMandalaGoalHistoryVisible === true;
    const isMandalaExternalItem = (item = {}) => item?.externalSource?.sourcePlugin === "mandala-time-blocks";
    const isMandalaProjectItem = (item = {}) => isMandalaExternalItem(item)
        && String(item.externalSource?.sourceType || "") === "project";
    const isMandalaGoalItem = (item = {}) => isMandalaExternalItem(item)
        && String(item.externalSource?.sourceType || "") === "goal";
    const isCurrentEffectiveMandalaProject = (item = {}) => {
        if (!isMandalaProjectItem(item)) return false;
        if (!mandalaEffectiveProjectExternalKeys) return false;
        return mandalaEffectiveProjectExternalKeys.has(String(item.externalSource?.externalKey || "").trim());
    };
    const isHistoricalMandalaProject = (item = {}) => isMandalaProjectItem(item)
        && !!mandalaEffectiveProjectExternalKeys
        && !isCurrentEffectiveMandalaProject(item);
    const isCurrentEffectiveMandalaGoal = (item = {}) => {
        if (!isMandalaGoalItem(item)) return false;
        if (!mandalaEffectiveGoalExternalKeys) return false;
        return mandalaEffectiveGoalExternalKeys.has(String(item.externalSource?.externalKey || "").trim());
    };
    const isHistoricalMandalaGoal = (item = {}) => isMandalaGoalItem(item)
        && !!mandalaEffectiveGoalExternalKeys
        && !isCurrentEffectiveMandalaGoal(item);
    const isReadOnlyMandalaOperationalContextItem = (item = {}) => (
        (isMandalaProjectItem(item) && !isCurrentEffectiveMandalaProject(item))
        || (isMandalaGoalItem(item) && !isCurrentEffectiveMandalaGoal(item))
    );
    const isUsableMandalaTimelineItem = (item = {}) => {
        if (!isMandalaExternalItem(item)) return true;
        const name = String(item.name || item.label || "").trim();
        if (!name || name === "已删除") return false;
        if (/^item_[a-z0-9]+$/i.test(name)) return false;
        if (/^[a-z0-9]{10,}$/i.test(name)) return false;
        return true;
    };
    const filterItemsByMandalaScope = (items = []) => {
        const filter = getMandalaSourceFilter();
        let base = (Array.isArray(items) ? items : []).filter(isUsableMandalaTimelineItem);
        if (filter !== "all") {
            base = base.filter((item) => (
            isMandalaExternalItem(item) && String(item.externalSource?.sourceType || "") === filter
            ));
        }
        return base.filter((item) => {
            if (isMandalaProjectItem(item)) return getMandalaProjectHistoryVisible()
                ? isHistoricalMandalaProject(item)
                : isCurrentEffectiveMandalaProject(item);
            if (isMandalaGoalItem(item)) return getMandalaGoalHistoryVisible()
                ? isHistoricalMandalaGoal(item)
                : isCurrentEffectiveMandalaGoal(item);
            return true;
        });
    };
    const filterItemsByMandalaEmbeddedScope = (items = []) => {
        const filter = getMandalaSourceFilter();
        const base = (Array.isArray(items) ? items : [])
            .filter(isUsableMandalaTimelineItem)
            .filter(isMandalaExternalItem)
            .filter((item) => {
                if (isMandalaProjectItem(item)) return isCurrentEffectiveMandalaProject(item);
                if (isMandalaGoalItem(item)) return isCurrentEffectiveMandalaGoal(item);
                return !mandalaActiveExternalKeys || mandalaActiveExternalKeys.has(String(item.externalSource?.externalKey || "").trim());
            });
        if (filter === "all") {
            return base.filter((item) => ["goal", "project"].includes(String(item.externalSource?.sourceType || "")));
        }
        return base.filter((item) => String(item.externalSource?.sourceType || "") === filter);
    };

    const getColorForItem = (name, existingColors) => {
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // 先尝试按 hash 取色，若撞色则找与已用色最远的颜色
        let preferred = COLOR_POOL[hash % COLOR_POOL.length];
        if (!existingColors.includes(preferred)) return preferred;

        const hueOf = (c) => {
            // c 形如 hsl(h, s%, l%)
            const m = /hsl\((\d+)/.exec(c);
            return m ? parseInt(m[1], 10) : 0;
        };
        const usedHues = existingColors.map(hueOf);
        let bestColor = preferred;
        let bestScore = -1;
        COLOR_POOL.forEach(c => {
            const h = hueOf(c);
            const minDiff = usedHues.length === 0 ? 360 : Math.min(...usedHues.map(u => {
                let d = Math.abs(h - u);
                return Math.min(d, 360 - d);
            }));
            if (minDiff > bestScore && !existingColors.includes(c)) {
                bestScore = minDiff;
                bestColor = c;
            }
        });
        return bestColor;
    };

    const getWeekNumber = (date) => moment(date).week();
    const getDayName = (date) => ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][moment(date).day()];
    const itemHasScheduledInRange = (item, start, end) => {
        const slots = item?.daySlots || {};
        const dates = Object.keys(slots);
        if (dates.length === 0) return false;
        return dates.some(d => {
            if (!slots[d]) return false;
            if (!start || !end) return true;
            return moment(d).isBetween(start, end, "day", "[]");
        });
    };

    // 当前视图范围
    const getActiveRange = () => {
        if (window.timelineRangeMode === "custom" && window.timelineCustomStart && window.timelineCustomEnd) {
            return {
                start: moment(window.timelineCustomStart),
                end: moment(window.timelineCustomEnd)
            };
        }
        return {
            start: moment().startOf("isoWeek"),
            end: moment().endOf("isoWeek")
        };
    };

    const persistViewRange = async () => {
        await updateData((data) => {
            data.settings = data.settings || { ...DEFAULT_VIEW_SETTINGS };
            data.settings.viewRange = {
                mode: window.timelineRangeMode,
                customStart: window.timelineCustomStart,
                customEnd: window.timelineCustomEnd
            };
            data.settings.ganttRangeMode = window.timelineGanttRangeMode || "auto";
        });
    };

    const getRangeDurationDays = (range = getActiveRange()) => {
        const start = moment(range.start).startOf("day");
        const end = moment(range.end).startOf("day");
        if (!start.isValid() || !end.isValid()) return 7;
        return Math.max(1, Math.abs(end.diff(start, "days")) + 1);
    };

    const setTimelineCustomRange = (startMoment, endMoment, options = {}) => {
        let start = moment(startMoment).startOf("day");
        let end = moment(endMoment).startOf("day");
        if (!start.isValid() || !end.isValid()) return false;
        if (end.isBefore(start, "day")) [start, end] = [end, start];
        window.timelineRangeMode = "custom";
        window.timelineGanttRangeMode = "view";
        window.timelineCustomStart = start.format("YYYY-MM-DD");
        window.timelineCustomEnd = end.format("YYYY-MM-DD");
        if (window.timelineMermaidState) {
            window.timelineMermaidState.scrollLeft = 0;
            window.timelineMermaidState.scrollTop = 0;
        }
        if (options.render) renderViewFn?.();
        if (options.persist) persistViewRange().catch(error => console.error("[Timeline Planner][range.persist]", error));
        return true;
    };

    const schedulePersistViewRange = () => {
        if (window.timelineRangePersistTimer) clearTimeout(window.timelineRangePersistTimer);
        window.timelineRangePersistTimer = setTimeout(() => {
            window.timelineRangePersistTimer = null;
            persistViewRange().catch(error => console.error("[Timeline Planner][range.persist-debounced]", error));
        }, 350);
    };

    const getTimelineItemDateBounds = () => {
        const matchingItems = (Array.isArray(timelineData.items) ? timelineData.items : [])
            .filter(item => tagMatchesFilter(item.tags, window.timelineTagFilters))
            .filter(item => !window.timelineDayblockOnlyScheduled || itemHasScheduledInRange(item));
        let minStart = null;
        let maxEnd = null;
        matchingItems.forEach(item => {
            const start = moment(item.startDate).startOf("day");
            const end = moment(item.endDate || item.startDate).startOf("day");
            if (!start.isValid() || !end.isValid()) return;
            const itemStart = start.isBefore(end, "day") ? start : end;
            const itemEnd = end.isAfter(start, "day") ? end : start;
            if (!minStart || itemStart.isBefore(minStart, "day")) minStart = itemStart;
            if (!maxEnd || itemEnd.isAfter(maxEnd, "day")) maxEnd = itemEnd;
        });
        return minStart && maxEnd ? { start: minStart, end: maxEnd } : null;
    };

    const clampTimelineRangeToItemBounds = (startMoment, endMoment) => {
        const bounds = getTimelineItemDateBounds();
        if (!bounds) return { start: moment(startMoment), end: moment(endMoment) };
        let start = moment(startMoment).startOf("day");
        let end = moment(endMoment).startOf("day");
        const durationDays = Math.max(1, end.diff(start, "days") + 1);
        if (end.isBefore(bounds.start, "day")) {
            start = bounds.start.clone();
            end = start.clone().add(durationDays - 1, "days");
        } else if (start.isAfter(bounds.end, "day")) {
            end = bounds.end.clone();
            start = end.clone().subtract(durationDays - 1, "days");
        } else if (start.isBefore(bounds.start, "day")) {
            start = bounds.start.clone();
            end = start.clone().add(durationDays - 1, "days");
        } else if (end.isAfter(bounds.end, "day")) {
            end = bounds.end.clone();
            start = end.clone().subtract(durationDays - 1, "days");
        }
        return { start, end };
    };

    const panTimelineRange = (direction) => {
        const range = getActiveRange();
        const durationDays = getRangeDurationDays(range);
        const stepDays = Math.max(1, Math.round(durationDays * 0.2));
        const offsetDays = direction >= 0 ? stepDays : -stepDays;
        const clampedRange = clampTimelineRangeToItemBounds(
            range.start.clone().add(offsetDays, "days"),
            range.end.clone().add(offsetDays, "days")
        );
        return setTimelineCustomRange(clampedRange.start, clampedRange.end);
    };

    const zoomTimelineRange = (direction) => {
        const range = getActiveRange();
        const durationDays = getRangeDurationDays(range);
        const nextDurationDays = Math.max(1, Math.min(730, Math.round(durationDays * (direction >= 0 ? 1.25 : 0.8))));
        const centerMs = (range.start.clone().startOf("day").valueOf() + range.end.clone().startOf("day").valueOf()) / 2;
        const start = moment(centerMs).startOf("day").subtract(Math.floor((nextDurationDays - 1) / 2), "days");
        const end = start.clone().add(nextDurationDays - 1, "days");
        return setTimelineCustomRange(start, end);
    };

    const isRangeWheelIgnoredTarget = (target) => {
        const el = target?.closest?.("input, textarea, select, button, [contenteditable='true']");
        return !!el;
    };

    const bindGanttRangeWheel = (diagramContainer) => {
        if (!diagramContainer) return;
        diagramContainer.addEventListener("wheel", (event) => {
            if (isRangeWheelIgnoredTarget(event.target)) return;
            if (event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
                panTimelineRange(delta >= 0 ? 1 : -1);
            } else if (event.ctrlKey && !event.shiftKey) {
                event.preventDefault();
                zoomTimelineRange(event.deltaY >= 0 ? 1 : -1);
            } else {
                return;
            }
            schedulePersistViewRange();
            renderViewFn?.();
        }, { passive: false });
    };

    const ensureDaySlots = (item) => {
        if (!item.daySlots) item.daySlots = {};
        return item.daySlots;
    };

    const getBlockById = (id) => TIME_BLOCKS.find(b => b.id === id);

    const isDeadlineMilestone = (milestone) => {
        const name = String(milestone?.name || "");
        return /deadline/i.test(name) || name.includes("截止日期");
    };

    // 获取所有子标签ID
    const getDescendantTagIds = (tagId) => {
        const descendants = [];
        const findChildren = (parentId) => {
            Object.keys(TAG_DEFINITIONS).forEach(key => {
                if (TAG_DEFINITIONS[key] && TAG_DEFINITIONS[key].parentId === parentId) {
                    descendants.push(key);
                    findChildren(key);
                }
            });
        };
        findChildren(tagId);
        return descendants;
    };

    // 获取直接子标签
    const getChildTags = (parentId) => {
        return Object.keys(TAG_DEFINITIONS).filter(key =>
            TAG_DEFINITIONS[key] && TAG_DEFINITIONS[key].parentId === parentId
        );
    };

    const sortTagIdsByName = (ids) => {
        return ids.sort((a, b) => {
            const nameA = (TAG_DEFINITIONS[a]?.label || "").trim();
            const nameB = (TAG_DEFINITIONS[b]?.label || "").trim();
            const byName = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
            if (byName !== 0) return byName;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });
    };

    const sortTagIdsForTree = (ids) => {
        return ids.sort((a, b) => {
            const orderA = Number.isFinite(TAG_DEFINITIONS[a]?.order) ? TAG_DEFINITIONS[a].order : Number.MAX_SAFE_INTEGER;
            const orderB = Number.isFinite(TAG_DEFINITIONS[b]?.order) ? TAG_DEFINITIONS[b].order : Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) return orderA - orderB;
            const nameA = (TAG_DEFINITIONS[a]?.label || "").trim();
            const nameB = (TAG_DEFINITIONS[b]?.label || "").trim();
            const byName = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
            if (byName !== 0) return byName;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });
    };

    const formatTagOptionValue = (id) => {
        const def = TAG_DEFINITIONS[id];
        if (!def) return id;
        const icon = def.icon ? `${def.icon} ` : "";
        return `${icon}${def.label} (${id})`;
    };

    const normalizeTagFilterList = (filters) => {
        const uniq = [];
        const seen = new Set();
        (Array.isArray(filters) ? filters : []).forEach((id) => {
            const key = String(id || "").trim();
            if (!key || seen.has(key)) return;
            if (!TAG_DEFINITIONS[key]) return;
            seen.add(key);
            uniq.push(key);
        });
        return uniq;
    };

    const loadPersistedTagFilters = () => {
        try {
            const raw = localStorage.getItem(TAG_FILTER_STORAGE_KEY);
            if (!raw) return null;
            return normalizeTagFilterList(JSON.parse(raw));
        } catch (e) {
            return null;
        }
    };

    const savePersistedTagFilters = (filters) => {
        try {
            localStorage.setItem(TAG_FILTER_STORAGE_KEY, JSON.stringify(normalizeTagFilterList(filters)));
        } catch (e) {}
    };

    const setTagFilters = (filters) => {
        window.timelineTagFilters = normalizeTagFilterList(filters);
        window.timelineTagFilter = window.timelineTagFilters[0] || null;
        savePersistedTagFilters(window.timelineTagFilters);
    };

    const normalizeTagPresetName = (name) => String(name || "").trim().slice(0, 50);

    const normalizeTagFilterPresets = (presets) => {
        const result = [];
        const seen = new Set();
        (Array.isArray(presets) ? presets : []).forEach((preset) => {
            const rawName = typeof preset === "string" ? preset : (preset?.name ?? "");
            const name = normalizeTagPresetName(rawName);
            if (!name || seen.has(name)) return;
            seen.add(name);
            const filters = normalizeTagFilterList(typeof preset === "string" ? [] : preset?.filters);
            result.push({
                name,
                filters,
                updatedAt: preset?.updatedAt || moment().format("YYYY-MM-DD HH:mm:ss")
            });
        });
        return result;
    };

    const loadPersistedTagFilterPresets = () => {
        try {
            const raw = localStorage.getItem(TAG_FILTER_PRESETS_STORAGE_KEY);
            if (!raw) return [];
            return normalizeTagFilterPresets(JSON.parse(raw));
        } catch (e) {
            return [];
        }
    };

    const savePersistedTagFilterPresets = (presets) => {
        try {
            localStorage.setItem(TAG_FILTER_PRESETS_STORAGE_KEY, JSON.stringify(normalizeTagFilterPresets(presets)));
        } catch (e) {}
    };

    const setTagFilterPresets = (presets) => {
        window.timelineTagFilterPresets = normalizeTagFilterPresets(presets);
        savePersistedTagFilterPresets(window.timelineTagFilterPresets);
    };

    const isSameFilterSet = (a, b) => {
        const aa = normalizeTagFilterList(a).slice().sort();
        const bb = normalizeTagFilterList(b).slice().sort();
        if (aa.length !== bb.length) return false;
        for (let i = 0; i < aa.length; i++) {
            if (aa[i] !== bb[i]) return false;
        }
        return true;
    };

    const getTagPresetSummaryText = (filters) => {
        const normalized = normalizeTagFilterList(filters);
        if (normalized.length === 0) return "全部标签";
        return normalized.map((id) => {
            const def = TAG_DEFINITIONS[id];
            return def ? `${def.icon} ${def.label}` : id;
        }).join(" · ");
    };

    // 标签是否匹配筛选条件
    const tagMatchesFilter = (itemTags, filterTagIds) => {
        return true;
    };

    // 加载标签定义
    const loadTagDefinitions = async () => {
        try {
            if (await app.vault.adapter.exists(TAGS_PATH)) {
                const content = await app.vault.adapter.read(TAGS_PATH);
                const data = JSON.parse(content);
                return data.tags || DEFAULT_TAG_DEFINITIONS;
            }
        } catch (e) {
            console.error("加载标签定义失败:", e);
            if (context.readOnlyInitialization === true) throw e;
        }
        if (context.readOnlyInitialization !== true) await saveTagDefinitions(DEFAULT_TAG_DEFINITIONS);
        return DEFAULT_TAG_DEFINITIONS;
    };

    const saveTagDefinitions = async (tags) => {
        const data = {
            tags: tags,
            version: "1.0",
            lastModified: moment().format("YYYY-MM-DD HH:mm:ss")
        };
        const jsonString = JSON.stringify(data, null, 2);
        const file = app.vault.getAbstractFileByPath(TAGS_PATH);
        if (file) {
            await app.vault.modify(file, jsonString);
        } else {
            await app.vault.create(TAGS_PATH, jsonString);
        }
    };

    // 加载时间线数据
    const loadRawTimelineData = async () => {
        try {
            if (await app.vault.adapter.exists(DATA_PATH)) {
                const content = await app.vault.adapter.read(DATA_PATH);
                const parsed = JSON.parse(content);
                // 兼容旧版数组结构
                if (Array.isArray(parsed)) {
                    return { items: parsed, settings: { ...DEFAULT_VIEW_SETTINGS }, milestones: {} };
                }
                return {
                    items: parsed.items || [],
                    settings: {
                        ...DEFAULT_VIEW_SETTINGS,
                        ...(parsed.settings || {})
                    },
                    milestones: parsed.milestones || {}  // 里程碑字典
                };
            }
        } catch (e) {
            console.error("加载数据失败:", e);
            if (context.readOnlyInitialization === true) throw e;
        }
        const emptyData = { items: [], settings: { ...DEFAULT_VIEW_SETTINGS }, milestones: {} };
        if (context.readOnlyInitialization !== true) await saveTimelineData(emptyData);
        return emptyData;
    };

    const saveTimelineData = async (data) => {
        const jsonString = JSON.stringify(data, null, 2);
        const file = app.vault.getAbstractFileByPath(DATA_PATH);
        if (file) {
            await app.vault.modify(file, jsonString);
        } else {
            await app.vault.create(DATA_PATH, jsonString);
        }
    };

    let TAG_DEFINITIONS = await loadTagDefinitions();
    let timelineData = await applyTimelineProjection(await loadRawTimelineData());
    if (!engineActive()) return;

    // 初始化全局范围状态自数据
    const initRangeStateFromData = () => {
        const vr = timelineData.settings?.viewRange || DEFAULT_VIEW_SETTINGS.viewRange;
        window.timelineRangeMode = vr.mode || "week";
        window.timelineCustomStart = vr.customStart || moment().startOf("isoWeek").format("YYYY-MM-DD");
        window.timelineCustomEnd = vr.customEnd || moment().endOf("isoWeek").format("YYYY-MM-DD");
        window.timelineGanttRangeMode = timelineData.settings?.ganttRangeMode || "auto";
    };
    initRangeStateFromData();
    if (!Array.isArray(window.timelineTagFilters)) {
        if (window.timelineTagFilter) window.timelineTagFilters = [window.timelineTagFilter];
        else window.timelineTagFilters = [];
    }
    if (!Array.isArray(window.timelineTagFilterPresets)) window.timelineTagFilterPresets = loadPersistedTagFilterPresets();
    else setTagFilterPresets(window.timelineTagFilterPresets);
    const persistedTagFilters = loadPersistedTagFilters();
    if (persistedTagFilters !== null) setTagFilters(persistedTagFilters);
    else setTagFilters(window.timelineTagFilters);

    const updateData = async (operationFn) => {
        let currentData = await loadRawTimelineData();
        operationFn(currentData);
        await saveTimelineData(currentData);
        timelineData = await applyTimelineProjection(currentData);
        initRangeStateFromData();
        if (renderViewFn) renderViewFn();
    };

    // ===== 里程碑数据结构（扁平字典） =====
    // 数据格式: { "milestoneId": { id, itemId, date, name, completed, created, anchorDate } }
    const MILESTONE_TEMPLATE = {
        id: null,           // 里程碑唯一ID
        itemId: null,       // 所属事项ID
        date: null,         // 里程碑日期 YYYY-MM-DD
        name: "",           // 里程碑名称
        comment: "",        // 备注/说明
        completed: false,   // 是否已完成
        created: null,      // 创建时间
        anchorDate: null    // 1/3 等固定节点的起算日
    };

    // 获取某事项在某日期的所有里程碑
    const getMilestonesForItemDate = (itemId, dateStr) => {
        const milestones = timelineData.milestones || {};
        return Object.values(milestones).filter(m =>
            m.itemId === itemId && m.date === dateStr
        );
    };

    // 获取某事项的所有里程碑（按日期排序）
    const getMilestonesForItem = (itemId) => {
        const milestones = timelineData.milestones || {};
        return Object.values(milestones)
            .filter(m => m.itemId === itemId)
            .sort((a, b) => a.date.localeCompare(b.date));
    };

    const getMilestoneAnchorMoment = (milestone) => {
        const explicitAnchor = moment(milestone?.anchorDate, "YYYY-MM-DD", true);
        if (explicitAnchor.isValid()) return explicitAnchor.startOf("day");

        const createdMoment = moment(milestone?.created);
        if (createdMoment.isValid()) return createdMoment.startOf("day");

        return null;
    };

    const getOneThirdMarkerDate = (deadlineMilestone) => {
        const deadlineMoment = moment(deadlineMilestone?.date, "YYYY-MM-DD", true);
        const anchorMoment = getMilestoneAnchorMoment(deadlineMilestone);
        if (!deadlineMoment.isValid() || !anchorMoment) return null;

        const start = anchorMoment.clone().startOf("day");
        const end = deadlineMoment.clone().startOf("day");
        if (end.isBefore(start, "day")) return null;

        const diffDays = end.diff(start, "days");
        const offsetDays = Math.floor(diffDays / 3);
        return start.clone().add(offsetDays, "days").format("YYYY-MM-DD");
    };

    const getOneThirdMarkersForItemDate = (itemId, dateStr) => {
        return getMilestonesForItem(itemId)
            .filter(m => isDeadlineMilestone(m))
            .map(m => {
                const markerDate = getOneThirdMarkerDate(m);
                if (!markerDate || markerDate !== dateStr) return null;
                const anchorDate = getMilestoneAnchorMoment(m)?.format("YYYY-MM-DD") || "未知";
                return {
                    id: `oneThird_${m.id}_${markerDate}`,
                    itemId,
                    date: markerDate,
                    name: "1/3",
                    completed: !!m.completed,
                    comment: `1/3 节点 -> ${m.name || "未命名 deadline"}（起算 ${anchorDate}，截止 ${m.date}）`,
                    isSyntheticOneThird: true,
                    sourceMilestone: m
                };
            })
            .filter(Boolean);
    };

    // 根据ID获取里程碑
    const getMilestoneById = (milestoneId) => {
        const milestones = timelineData.milestones || {};
        return milestones[milestoneId] || null;
    };

    // 添加/更新里程碑
    const saveMilestone = async (milestoneData) => {
        let blockedByHistoricalProject = false;
        await updateData((data) => {
            const item = (data.items || []).find(entry => String(entry?.id || "") === String(milestoneData?.itemId || ""));
            if (isReadOnlyMandalaOperationalContextItem(item)) {
                blockedByHistoricalProject = true;
                return;
            }
            data.milestones = data.milestones || {};
            const id = milestoneData.id || generateId();
            const prev = data.milestones[id] || null;
            const isDeadline = isDeadlineMilestone(milestoneData);
            const prevWasDeadline = isDeadlineMilestone(prev);
            const shouldResetAnchorDate = isDeadline && (
                !prev ||
                !prevWasDeadline ||
                prev.date !== milestoneData.date
            );
            const anchorDate = isDeadline
                ? (shouldResetAnchorDate
                    ? moment().format("YYYY-MM-DD")
                    : (milestoneData.anchorDate || prev?.anchorDate || getMilestoneAnchorMoment(prev)?.format("YYYY-MM-DD") || moment().format("YYYY-MM-DD")))
                : (milestoneData.anchorDate || prev?.anchorDate || null);
            data.milestones[id] = {
                ...MILESTONE_TEMPLATE,
                ...(prev || {}),
                ...milestoneData,
                id: id,
                created: milestoneData.created || prev?.created || moment().format("YYYY-MM-DD HH:mm:ss"),
                anchorDate
            };
        });
        if (blockedByHistoricalProject) new Notice("历史项目时间证据只读保留，不能新增或修改里程碑。");
    };

    // 删除里程碑
    const deleteMilestone = async (milestoneId) => {
        let blockedByHistoricalProject = false;
        await updateData((data) => {
            const milestone = data.milestones?.[milestoneId];
            const item = (data.items || []).find(entry => String(entry?.id || "") === String(milestone?.itemId || ""));
            if (isReadOnlyMandalaOperationalContextItem(item)) {
                blockedByHistoricalProject = true;
                return;
            }
            if (data.milestones && milestone) {
                delete data.milestones[milestoneId];
            }
        });
        if (blockedByHistoricalProject) new Notice("历史项目时间证据只读保留，不能删除里程碑。");
    };

    // 里程碑弹窗
    class MilestoneModal extends obsidian.Modal {
        constructor(app, milestone, item, dateStr, onSave, onDelete) {
            super(app);
            this.milestone = milestone ? { ...milestone } : { ...MILESTONE_TEMPLATE };
            this.item = item;
            this.dateStr = dateStr;
            this.onSave = onSave;
            this.onDelete = onDelete;
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            const isEdit = !!this.milestone.id;
            contentEl.createEl("h3", { text: isEdit ? "📍 编辑里程碑" : "✨ 添加里程碑" });
            this.modalEl.style.width = "720px";
            this.modalEl.style.maxWidth = "92vw";

            const itemInfo = contentEl.createEl("div", {
                text: `事项: ${this.item?.name || '未知'}`,
                attr: { style: "padding:8px; background:var(--background-secondary); border-radius:6px; margin-bottom:12px; font-size:13px;" }
            });

            const form = contentEl.createEl("div", { attr: { style: "display:flex; flex-direction:column; gap:12px;" } });

            const nameInput = form.createEl("input", {
                type: "text",
                value: this.milestone.name || "",
                attr: { placeholder: "里程碑名称（如：完成初稿、评审通过）", style: "width:100%; padding:10px;" }
            });

            const dateRow = form.createEl("div", { attr: { style: "display:flex; gap:10px; align-items:center;" } });
            dateRow.createEl("span", { text: "日期:", attr: { style: "font-weight:600;" } });
            const dateInput = dateRow.createEl("input", {
                type: "date",
                value: this.milestone.date || this.dateStr,
                attr: { style: "padding:8px;" }
            });

            const completedRow = form.createEl("div", { attr: { style: "display:flex; gap:10px; align-items:center;" } });
            const completedCheck = completedRow.createEl("input", { type: "checkbox" });
            completedCheck.checked = !!this.milestone.completed;
            completedRow.createEl("span", { text: "已完成", attr: { style: "cursor:pointer;" } });

            // 使用 change 事件代替 click，确保状态正确切换
            completedCheck.onchange = () => {
                // 状态已经由浏览器自动处理，无需手动切换
            };
            // 点击整行也可以切换
            completedRow.style.cursor = "pointer";
            completedRow.onclick = (e) => {
                if (e.target !== completedCheck) {
                    completedCheck.checked = !completedCheck.checked;
                    // 触发 change 事件
                    completedCheck.dispatchEvent(new Event('change'));
                }
            };

            const commentLabel = form.createEl("div", { text: "备注/Comment", attr: { style: "font-weight:600;" } });
            const commentArea = form.createEl("textarea", {
                text: this.milestone.comment || "",
                attr: {
                    rows: 8,
                    placeholder: "补充说明、验收标准、复盘要点等...",
                    style: "width:100%; min-height:180px; padding:10px; resize:vertical;"
                }
            });

            // 显示同个事项的其他里程碑列表（按日期排序）
            if (this.item) {
                const existingList = contentEl.createEl("div", { attr: { style: "margin-top:15px; padding:10px; border:1px solid var(--background-modifier-border); border-radius:8px;" } });
                existingList.createEl("div", { text: "📋 同事项里程碑（按时间顺序）:", attr: { style: "font-weight:600; margin-bottom:8px; font-size:12px;" } });
                const allMilestones = getMilestonesForItem(this.item.id);
                // 过滤掉当前编辑的里程碑
                const otherMilestones = allMilestones.filter(m => m.id !== this.milestone.id);
                if (otherMilestones.length === 0) {
                    existingList.createEl("span", { text: "无其他里程碑", attr: { style: "color:var(--text-muted); font-size:12px;" } });
                } else {
                    const listDiv = existingList.createEl("div", { attr: { style: "display:flex; flex-direction:column; gap:4px;" } });
                    otherMilestones.forEach(m => {
                        const chip = listDiv.createEl("div", {
                            text: `${m.completed ? "✅" : "🔲"} [${m.date}] ${m.name}`,
                            attr: {
                                style: `
                                    padding:6px 10px;
                                    background:${m.completed ? "var(--background-primary)" : "var(--background-secondary)"};
                                    border-radius:4px;
                                    font-size:12px;
                                    cursor:pointer;
                                `
                            }
                        });
                        chip.onclick = () => {
                            this.milestone = m;
                            this.close();
                            new MilestoneModal(app, m, this.item, m.date, onSave, onDelete).open();
                        };
                    });
                }
            }

            const btnRow = form.createEl("div", { attr: { style: "display:flex; justify-content:flex-end; gap:10px; margin-top:15px;" } });
            const cancelBtn = btnRow.createEl("button", { text: "取消" });
            cancelBtn.onclick = () => this.close();

            if (isEdit) {
                const deleteBtn = btnRow.createEl("button", {
                    text: "删除",
                    attr: { style: "color:#e74c3c; border:1px solid #e74c3c; padding:6px 12px; border-radius:6px;" }
                });
                deleteBtn.onclick = () => {
                    if (confirm("确定删除此里程碑？")) {
                        this.onDelete(this.milestone.id);
                        this.close();
                    }
                };
            }

            const saveBtn = btnRow.createEl("button", { text: "保存", cls: "mod-cta" });
            saveBtn.onclick = () => {
                if (!nameInput.value.trim()) { new Notice("请输入里程碑名称"); return; }
                if (!dateInput.value) { new Notice("请选择日期"); return; }
                this.onSave({
                    ...this.milestone,
                    itemId: this.item?.id || this.milestone.itemId,
                    date: dateInput.value,
                    name: nameInput.value.trim(),
                    comment: commentArea.value || "",
                    completed: completedCheck.checked
                });
                this.close();
            };
        }
        onClose() { this.contentEl.empty(); }
    }

    const openMilestoneModal = (app, milestone, item, dateStr, onSave, onDelete) => {
        new MilestoneModal(app, milestone, item, dateStr, onSave, onDelete).open();
    };

    // ===== 4. UI交互组件 =====

    class QuickSuggester extends obsidian.FuzzySuggestModal {
        constructor(app, items, onChoose) {
            super(app);
            this.items = items;
            this.onChoose = onChoose;
        }
        getItems() { return this.items; }
        getItemText(item) { return item; }
        onChooseItem(item) { this.onChoose(item); }
    }

    class QuickPrompt extends obsidian.Modal {
        constructor(app, title, placeholder, onSubmit, defaultValue = "", allowEmpty = false) {
            super(app);
            this.titleStr = title;
            this.placeholder = placeholder;
            this.defaultValue = defaultValue;
            this.onSubmit = onSubmit;
            this.allowEmpty = allowEmpty;
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.createEl("h3", { text: this.titleStr });
            const input = contentEl.createEl("input", { type: "text", value: this.defaultValue });
            input.placeholder = this.placeholder;
            input.style.width = "100%";
            input.style.padding = "10px";
            input.style.marginTop = "10px";
            input.focus();

            const btnRow = contentEl.createEl("div", { attr: { style: "display:flex; justify-content:flex-end; gap:10px; margin-top:15px;" } });
            const cancelBtn = btnRow.createEl("button", { text: "取消" });
            cancelBtn.onclick = () => this.close();
            const submitBtn = btnRow.createEl("button", { text: "确定", cls: "mod-cta" });
            submitBtn.onclick = () => {
                const rawValue = input.value ?? "";
                if (!this.allowEmpty && !rawValue.trim()) return;
                this.close();
                this.onSubmit(rawValue);
            };
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") submitBtn.click();
            });
        }
        onClose() { this.contentEl.empty(); }
    }

    // 时间块选择器（单选）
    class TimeBlockPickerModal extends obsidian.Modal {
        constructor(app, currentBlockId, onSubmit) {
            super(app);
            this.currentBlockId = currentBlockId;
            this.onSubmit = onSubmit;
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createEl("h3", { text: "选择时间块" });

            const list = contentEl.createEl("div", { attr: { style: "display:flex; flex-direction:column; gap:8px; padding:10px;" } });

            // 添加"清除"选项
            const clearRow = list.createEl("div", {
                attr: {
                    style: `
                        display:flex;
                        align-items:center;
                        gap:8px;
                        padding:8px 12px;
                        border-radius:6px;
                        cursor:pointer;
                        background:${this.currentBlockId === null ? 'var(--interactive-accent)' : 'var(--background-secondary)'};
                        color:${this.currentBlockId === null ? '#fff' : 'var(--text-normal)'};
                        font-weight:600;
                    `
                }
            });
            clearRow.createEl("span", { text: "🗑️ 清除分配" });
            clearRow.onclick = () => {
                this.close();
                this.onSubmit(null);
            };

            // 添加时间块选项
            TIME_BLOCKS.forEach(block => {
                const row = list.createEl("div", {
                    attr: {
                        style: `
                            display:flex;
                            align-items:center;
                            gap:8px;
                            padding:8px 12px;
                            border-radius:6px;
                            cursor:pointer;
                            background:${this.currentBlockId === block.id ? 'var(--interactive-accent)' : 'var(--background-secondary)'};
                            color:${this.currentBlockId === block.id ? '#fff' : 'var(--text-normal)'};
                            font-weight:600;
                        `
                    }
                });
                row.createEl("span", { text: block.label });
                row.createEl("span", { text: block.range, attr: { style: "color:var(--text-muted); font-size:0.9em;" } });
                row.onclick = () => {
                    this.close();
                    this.onSubmit(block.id);
                };
            });
        }
        onClose() { this.contentEl.empty(); }
    }

    const pickTimeBlockOnce = (currentBlockId = null) =>
        new Promise(res => new TimeBlockPickerModal(app, currentBlockId, res).open());

    // 操作选择器（点击选择操作类型）
    class ActionPickerModal extends obsidian.Modal {
        constructor(app, item, onAction, options = {}) {
            super(app);
            this.item = item;
            this.itemName = item?.name || "Timeline 事项";
            this.onAction = onAction;
            this.readOnly = options.readOnly === true;
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createEl("h3", { text: `${this.itemName}` });
            contentEl.createEl("div", {
                text: "─────────────────",
                attr: { style: "color:var(--text-muted); margin:10px 0;" }
            });
            contentEl.createEl("div", { text: "选择操作:", attr: { style: "font-weight:600; margin-bottom:15px;" } });

            const actions = this.readOnly
                ? [{ id: 'history', icon: '📚', label: '查看历史说明', desc: '该项目已退出有效操作上下文主键集合，历史时间证据只读保留' }]
                : [
                    { id: 'timeblock', icon: '📅', label: '设置时间块', desc: '为事项分配具体时间段' },
                    { id: 'milestone', icon: '🎯', label: '添加里程碑', desc: '标记关键节点与进度' },
                    { id: 'detail', icon: '✏️', label: '查看详情', desc: '编辑事项基本信息和备注' }
                ];
            const weeklyTrackingTarget = resolveMandalaWeeklyTrackingTarget(this.item);
            if (weeklyTrackingTarget) {
                actions.push({
                    id: 'weeklyTracking',
                    icon: '↗',
                    label: '打开周追踪',
                    desc: weeklyTrackingTarget.sourceType === 'project'
                        ? '定位到九宫格的项目周追踪'
                        : '定位到九宫格的目标周追踪'
                });
            }

            const list = contentEl.createEl("div", { attr: { style: "display:flex; flex-direction:column; gap:10px; padding:5px;" } });

            actions.forEach(action => {
                const row = list.createEl("div", {
                    attr: {
                        style: `
                            display:flex;
                            align-items:center;
                            gap:12px;
                            padding:12px 15px;
                            border-radius:8px;
                            cursor:pointer;
                            background:var(--background-secondary);
                            transition: all 0.2s;
                        `
                    }
                });
                row.createEl("span", { text: action.icon, attr: { style: "font-size:1.4em;" } });
                const textDiv = row.createEl("div");
                textDiv.createEl("div", { text: action.label, attr: { style: "font-weight:600; font-size:1em;" } });
                textDiv.createEl("div", { text: action.desc, attr: { style: "color:var(--text-muted); font-size:0.85em; margin-top:2px;" } });

                row.onclick = () => {
                    this.close();
                    this.onAction(action.id);
                };
                row.onmouseenter = () => { row.style.background = 'var(--background-modifier-border)'; };
                row.onmouseleave = () => { row.style.background = 'var(--background-secondary)'; };
            });
        }
        onClose() { this.contentEl.empty(); }
    }

    const pickActionOnce = (item, options = {}) =>
        new Promise(res => new ActionPickerModal(app, item, res, options).open());

    // 标签选择器（一次性多选，带"完成"按钮，避免反复弹窗）
    class TagPickerModal extends obsidian.Modal {
        constructor(app, currentTags, onFinish) {
            super(app);
            this.current = new Set(currentTags || []);
            this.onFinish = onFinish;
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createEl("h3", { text: "选择标签（可多选）" });

            const searchInput = contentEl.createEl("input", {
                type: "text",
                attr: {
                    placeholder: "输入关键词筛选标签（名称/ID）",
                    style: "width:100%; padding:6px 8px; border:1px solid var(--background-modifier-border); border-radius:6px; margin:6px 0;"
                }
            });

            const list = contentEl.createEl("div", {
                attr: {
                    style: "max-height:300px; overflow:auto; padding:8px; border:1px solid var(--background-modifier-border); border-radius:6px;"
                }
            });

            const normalize = (s) => (s || "").toString().trim().toLowerCase();
            const matchesQuery = (id, def, query) => {
                if (!query) return true;
                const label = def?.label || "";
                const hay = `${id} ${label}`.toLowerCase();
                return hay.includes(query);
            };
            const subtreeMatches = (id, query) => {
                const def = TAG_DEFINITIONS[id];
                if (matchesQuery(id, def, query)) return true;
                return getChildTags(id).some(childId => subtreeMatches(childId, query));
            };

            const render = () => {
                list.empty();
                const query = normalize(searchInput.value);
                let hasAny = false;

                const renderTree = (parentId, level = 0) => {
                    const children = sortTagIdsByName(getChildTags(parentId));
                    children.forEach(id => {
                        const def = TAG_DEFINITIONS[id];
                        if (!def) return;
                        if (query && !subtreeMatches(id, query)) return;
                        hasAny = true;

                        const row = list.createEl("div", {
                            attr: {
                                style: `
                                    display:flex;
                                    align-items:center;
                                    gap:8px;
                                    padding:4px;
                                    margin-left:${level * 12}px;
                                    border-radius:4px;
                                `
                            }
                        });
                        const checkbox = row.createEl("input", { type: "checkbox" });
                        checkbox.checked = this.current.has(id);
                        checkbox.onclick = () => {
                            if (checkbox.checked) this.current.add(id); else this.current.delete(id);
                        };
                        const label = row.createEl("span", { text: `${def.icon} ${def.label}`, attr: { style: "font-size:13px;" } });
                        label.onclick = () => { checkbox.click(); };
                        renderTree(id, level + 1);
                    });
                };

                renderTree(null, 0);

                if (!hasAny) {
                    list.createEl("div", {
                        text: "无匹配标签",
                        attr: { style: "padding:8px; color:var(--text-muted); text-align:center;" }
                    });
                }
            };

            searchInput.addEventListener("input", render);
            render();

            const actions = contentEl.createEl("div", { attr: { style: "display:flex; justify-content:flex-end; gap:10px; margin-top:12px;" } });
            const cancelBtn = actions.createEl("button", { text: "取消" });
            const okBtn = actions.createEl("button", { text: "完成", cls: "mod-cta" });
            cancelBtn.onclick = () => { this.close(); this.onFinish(null); };
            okBtn.onclick = () => { this.close(); this.onFinish(Array.from(this.current)); };
        }
        onClose() { this.contentEl.empty(); }
    }

    const pickTagsOnce = (currentTags = []) =>
        new Promise(res => new TagPickerModal(app, currentTags, res).open());

    const prompt = (title, placeholder = "", defaultValue = "", allowEmpty = false) =>
        new Promise(r => new QuickPrompt(app, title, placeholder, r, defaultValue, allowEmpty).open());
    const suggester = (items) =>
        new Promise(r => new QuickSuggester(app, items, r).open());

    const openTimelineRelationEditor = async (itemId) => {
        const api = getRelationsPluginApi();
        const nodeKey = getTimelineNodeKey(itemId);
        const item = getTimelineItemById(itemId);
        if (!isScheduleItem(item)) {
            new Notice("普通添加事项不进入 EVA 关系；请在月历里添加时间安排");
            console.info("[Timeline Relations][relation-editor.reject-task]", { itemId, nodeKey, kind: item?.kind || item?.type || "" });
            return false;
        }
        if (!api?.openRelationEditor || !nodeKey) {
            new Notice("⚠️ 请先启用 EVA Cross View Relations 插件");
            return false;
        }
        api.markLastFocusedNode?.(nodeKey);
        await api.openRelationEditor(nodeKey);
        return true;
    };

    const focusTimelineToDayBlockView = () => {
        window.timelineViewMode = "dayblock";
        renderViewFn?.();
        return true;
    };

    const focusTimelineToCalendarView = (item = null) => {
        window.timelineViewMode = "calendar";
        const focusDate = moment(item?.startDate || item?.endDate || undefined);
        if (focusDate.isValid()) window.timelineCurrentMonth = focusDate;
        renderViewFn?.();
        return true;
    };

    const focusTimelineRelationNode = (nodeKey) => {
        const item = getTimelineItemByNodeKey(nodeKey);
        if (isScheduleItem(item)) {
            console.info("[Timeline Relations][focus.switch-calendar]", { nodeKey, itemId: item.id, notePath: currentNotePath });
            return focusTimelineToCalendarView(item);
        }
        console.info("[Timeline Relations][focus.switch-dayblock]", { nodeKey, itemId: item?.id || "", notePath: currentNotePath });
        return focusTimelineToDayBlockView();
    };

    const openTimelineSourceNote = async (nodeKey = "") => {
        const api = window.__timelinePlannerPluginApi;
        if (api?.openView) {
            await api.openView({ notePath: currentNotePath, nodeKey });
            return true;
        }
        focusTimelineToDayBlockView();
        return true;
    };

    const restorePendingTimelineRelationFocus = () => {
        const directPendingKey = String(window.timelinePendingRelationFocusNodeKey || "").trim();
        if (directPendingKey) window.timelinePendingRelationFocusNodeKey = "";
        const api = getRelationsPluginApi();
        const consumed = api?.consumePendingFocus?.(TIMELINE_RELATION_VIEW_TYPE, currentNotePath);
        const pendingKey = String(directPendingKey || consumed?.nodeKey || "").trim();
        if (!pendingKey) return false;
        const parsed = parseTimelineNodeKey(pendingKey);
        const ok = !!parsed;
        console.info("[Timeline Relations][pending-focus.consume]", { nodeKey: pendingKey, notePath: currentNotePath, ok });
        if (!ok) return false;
        return focusTimelineRelationNode(pendingKey);
    };

    const registerTimelineRelationAdapter = async () => {
        const api = getRelationsPluginApi();
        if (!api?.registerAdapter || !currentNotePath) return;
        await api.registerAdapter({
            adapterId: `timeline::${currentNotePath}`,
            viewType: TIMELINE_RELATION_VIEW_TYPE,
            notePath: currentNotePath,
            viewLabel: getCurrentFile().name || "Timeline",
            listItems: () => (Array.isArray(timelineData.items) ? timelineData.items : []).filter(isScheduleItem).map((item) => ({
                nodeKey: getTimelineNodeKey(item.id),
                label: getTimelineItemLabel(item),
                pathLabel: formatTimelineRange(item),
                searchText: [item.name, item.comment, formatTimelineRange(item), isScheduleItem(item) ? "时间安排 schedule" : "事项 task", ...(item.tags || [])].filter(Boolean).join(" ")
            })),
            openNode: async (nodeKey) => {
                const parsed = parseTimelineNodeKey(nodeKey);
                const ok = !!parsed;
                let opened = false;
                if (ok) {
                    opened = await openTimelineSourceNote(nodeKey);
                    focusTimelineRelationNode(nodeKey);
                }
                console.info("[Timeline Relations][open-node.focus]", { nodeKey, notePath: currentNotePath, ok, opened });
                return ok;
            }
        });
    };
    class ItemEditModal extends obsidian.Modal {
        constructor(app, item, onSave) {
            super(app);
            this.item = { ...item };
            this.onSave = onSave;
        }
        renderTagChips(container) {
            container.empty();
            if (!this.item.tags || this.item.tags.length === 0) {
                container.createEl("div", { text: "未选择标签", attr: { style: "color:var(--text-muted);" } });
                return;
            }
            const chips = container.createEl("div", { attr: { style: "display:flex; flex-wrap:wrap; gap:6px;" } });
            this.item.tags.forEach(tagId => {
                const def = TAG_DEFINITIONS[tagId];
                const chip = chips.createEl("span", {
                    text: def ? `${def.icon} ${def.label}` : tagId,
                    attr: {
                        style: `padding:4px 8px; border-radius:12px; background:${def?.color || 'var(--background-secondary)'}; color:#fff; font-size:12px; cursor:default;`
                    }
                });
            });
        }
        async openTagPicker(container) {
            const selected = await pickTagsOnce([...(this.item.tags || [])]);
            if (selected === null) return;
            this.item.tags = selected;
            this.renderTagChips(container);
        }
        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createEl("h3", { text: "✏️ 编辑事项" });

            const form = contentEl.createEl("div", { attr: { style: "display:flex; flex-direction:column; gap:12px; margin-top:10px;" } });

            const nameInput = form.createEl("input", { type: "text", value: this.item.name, attr: { placeholder: "事项名称" } });
            const dateRow = form.createEl("div", { attr: { style: "display:flex; gap:10px;" } });
            const startInput = dateRow.createEl("input", { type: "date", value: this.item.startDate });
            const startTimeInput = dateRow.createEl("input", { type: "time", value: normalizeTimelineTime(this.item.startTime, "09:00") });
            const endInput = dateRow.createEl("input", { type: "date", value: this.item.endDate });
            const endTimeInput = dateRow.createEl("input", { type: "time", value: normalizeTimelineTime(this.item.endTime, "18:00") });

            const commentArea = form.createEl("textarea", {
                text: this.item.comment || "",
                attr: { rows: 3, placeholder: "备注" }
            });

            const btnRow = form.createEl("div", { attr: { style: "display:flex; justify-content:flex-end; gap:10px; margin-top:10px;" } });
            const cancelBtn = btnRow.createEl("button", { text: "取消" });
            const deleteBtn = btnRow.createEl("button", { text: "删除", attr: { style: "color:#e74c3c; border:1px solid #e74c3c; padding:6px 12px; border-radius:6px;" } });
            const saveBtn = btnRow.createEl("button", { text: "保存", cls: "mod-cta" });

            cancelBtn.onclick = () => this.close();
            deleteBtn.onclick = async () => {
                const ok = confirm("确定要删除这个事项吗？此操作不可撤销。");
                if (!ok) return;
                this.onSave({ __delete: true });
                this.close();
            };
            saveBtn.onclick = () => {
                if (!nameInput.value.trim()) { new Notice("请输入名称"); return; }
                if (!startInput.value || !endInput.value) { new Notice("请输入开始/结束日期"); return; }
                if (moment(endInput.value).isBefore(moment(startInput.value))) { new Notice("结束日期不能早于开始"); return; }
                this.onSave({
                    name: nameInput.value.trim(),
                    startDate: startInput.value,
                    endDate: endInput.value,
                    startTime: normalizeTimelineTime(startTimeInput.value, "09:00"),
                    endTime: normalizeTimelineTime(endTimeInput.value, "18:00"),
                    comment: commentArea.value || "",
                    tags: [...(this.item.tags || [])]
                });
                this.close();
            };
        }
    }

    // ===== 4. 标签管理视图 =====

    const renderTagManagerView = (container) => {
        container.empty();

        const style = `<style>
            .tag-mgr-container { background: var(--background-secondary); border-radius: 12px; padding: 20px; font-family: sans-serif; }
            .tag-mgr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--interactive-accent); }
            .tag-mgr-title { font-size: 1.5em; font-weight: 800; color: var(--text-normal); margin: 0; display: flex; align-items: center; gap: 8px; }
            .tag-mgr-actions { display: flex; gap: 8px; }
            .tag-mgr-btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; }
            .tag-mgr-btn-primary { background: var(--interactive-accent); color: white; }
            .tag-mgr-btn-secondary { background: var(--background-modifier-border); color: var(--text-normal); }
            .tag-item { display: flex; align-items: center; padding: 10px 12px; margin: 4px 0; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; transition: all 0.2s; }
            .tag-item:hover { border-color: var(--interactive-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .tag-item.drag-over { border-color: var(--interactive-accent); box-shadow: 0 0 0 2px var(--interactive-accent); }
            .tag-item.is-category { background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%); border-width: 2px; }
            .tag-color-dot { width: 16px; height: 16px; border-radius: 50%; margin-right: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            .tag-icon { font-size: 1.2em; margin-right: 8px; }
            .tag-label { font-weight: 600; color: var(--text-normal); }
            .tag-meta { font-size: 0.8em; color: var(--text-muted); margin-top: 2px; }
            .tag-actions { display: flex; gap: 6px; margin-left: auto; }
            .tag-action-btn { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); cursor: pointer; font-size: 12px; }
            .tag-action-btn:hover { background: var(--interactive-accent); color: white; border-color: transparent; }
            .tag-children { margin-left: 30px; border-left: 2px solid var(--background-modifier-border); padding-left: 15px; margin-top: 5px; }
            .tag-child-drop-zone {
                margin: 0 0 0 30px;
                padding: 0 8px;
                max-height: 0;
                overflow: hidden;
                opacity: 0;
                border: 0 dashed var(--tag-drop-color, var(--interactive-accent));
                border-radius: 6px;
                color: transparent;
                font-size: 11px;
                background: transparent;
                pointer-events: none;
                transition: opacity 0.18s ease, max-height 0.18s ease, margin 0.18s ease, padding 0.18s ease, border-width 0.18s ease, color 0.18s ease, background 0.18s ease;
            }
            .tag-mgr-container.tag-drag-active .tag-child-drop-zone {
                margin: 4px 0 6px 30px;
                padding: 4px 8px;
                max-height: 36px;
                opacity: 0.9;
                border-width: 1px;
                color: var(--text-muted);
                pointer-events: auto;
            }
            .tag-mgr-container.tag-drag-active .tag-child-drop-zone.drag-over {
                background: color-mix(in srgb, var(--tag-drop-color, var(--interactive-accent)) 10%, transparent);
                color: var(--text-normal);
            }
            .tag-form { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 15px; margin-bottom: 15px; }
            .tag-form-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
            .tag-form-label { width: 60px; font-weight: 500; color: var(--text-muted); font-size: 0.9em; }
            .tag-form-input { flex: 1; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-secondary); color: var(--text-normal); }
            .tag-stats { display: flex; gap: 20px; padding: 10px 15px; background: var(--background-primary); border-radius: 8px; margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted); }
            .tag-stat-num { font-weight: 700; color: var(--text-normal); }
        </style>`;

        container.innerHTML = style;
        const wrapper = container.createEl("div", { cls: "tag-mgr-container" });
        const setTagDragActive = (active) => {
            wrapper.classList.toggle("tag-drag-active", !!active);
        };

        // 头部
        const header = wrapper.createEl("div", { cls: "tag-mgr-header" });
        header.createEl("div", { cls: "tag-mgr-title" }).innerHTML = `🏷️ 标签管理器`;
        const headerActions = header.createEl("div", { cls: "tag-mgr-actions" });

        const addTagBtn = headerActions.createEl("button", { text: "➕ 新建标签", cls: "tag-mgr-btn tag-mgr-btn-primary" });
        const addCategoryBtn = headerActions.createEl("button", { text: "📁 新建分类", cls: "tag-mgr-btn tag-mgr-btn-secondary" });
        const exitBtn = headerActions.createEl("button", { text: "返回主界面", cls: "tag-mgr-btn tag-mgr-btn-secondary" });
        exitBtn.onclick = () => { window.timelineTagManagerMode = false; if (renderViewFn) renderViewFn(); };

        // 统计
        const topLevelCount = Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k]?.parentId === null).length;
        const categoryCount = Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k]?.isCategory).length;
        const leafCount = Object.keys(TAG_DEFINITIONS).filter(k => !TAG_DEFINITIONS[k]?.isCategory).length;
        const stats = wrapper.createEl("div", { cls: "tag-stats" });
        stats.innerHTML = `
            <span>📊 总计: <span class="tag-stat-num">${Object.keys(TAG_DEFINITIONS).length}</span> 个</span>
            <span>📁 分类: <span class="tag-stat-num">${categoryCount}</span></span>
            <span>🏷️ 标签: <span class="tag-stat-num">${leafCount}</span></span>
            <span>🌲 顶层: <span class="tag-stat-num">${topLevelCount}</span></span>
        `;

        // 表单
        const formContainer = wrapper.createEl("div", { cls: "tag-form", attr: { style: "display:none;" } });
        let editingTagId = null;

        const showTagForm = (tagId = null) => {
            editingTagId = tagId;
            const tag = tagId ? TAG_DEFINITIONS[tagId] : null;
            formContainer.innerHTML = "";
            formContainer.style.display = "block";

            formContainer.createEl("div", {
                text: tagId ? "✏️ 编辑标签" : "➕ 新建标签",
                attr: { style: "font-weight:700; margin-bottom:12px; font-size:1.1em;" }
            });

            const idRow = formContainer.createEl("div", { cls: "tag-form-row" });
            idRow.createEl("span", { text: "ID:", cls: "tag-form-label" });
            const idInputAttr = tagId ? { disabled: "true" } : {};
            const idInput = idRow.createEl("input", { type: "text", cls: "tag-form-input", value: tagId || "", attr: idInputAttr });
            idInput.placeholder = "唯一标识符 (英文)";

            const labelRow = formContainer.createEl("div", { cls: "tag-form-row" });
            labelRow.createEl("span", { text: "名称:", cls: "tag-form-label" });
            const labelInput = labelRow.createEl("input", { type: "text", cls: "tag-form-input", value: tag?.label || "", attr: { placeholder: "显示名称" } });

            const iconRow = formContainer.createEl("div", { cls: "tag-form-row" });
            iconRow.createEl("span", { text: "图标:", cls: "tag-form-label" });
            const iconInput = iconRow.createEl("input", { type: "text", cls: "tag-form-input", value: tag?.icon || "🏷️", attr: { placeholder: "Emoji" } });

            const colorRow = formContainer.createEl("div", { cls: "tag-form-row" });
            colorRow.createEl("span", { text: "颜色:", cls: "tag-form-label" });
            const colorInput = colorRow.createEl("input", { type: "color", value: tag?.color || "#3498db", attr: { style: "width:50px; height:35px; padding:2px;" } });

            const parentRow = formContainer.createEl("div", { cls: "tag-form-row" });
            parentRow.createEl("span", { text: "父级:", cls: "tag-form-label" });
            const parentInput = parentRow.createEl("input", {
                type: "text",
                cls: "tag-form-input",
                attr: { placeholder: "输入筛选，留空为顶层" }
            });
            const dataListId = `timeline-tag-parent-list-${Date.now()}`;
            parentInput.setAttr("list", dataListId);
            const parentList = formContainer.createEl("datalist", { attr: { id: dataListId } });
            const parentCandidates = sortTagIdsByName(Object.keys(TAG_DEFINITIONS).filter(k => k !== tagId));
            parentCandidates.forEach(k => {
                const opt = parentList.createEl("option");
                opt.value = formatTagOptionValue(k);
            });
            parentInput.value = tag?.parentId ? formatTagOptionValue(tag.parentId) : "";

            const categoryRow = formContainer.createEl("div", { cls: "tag-form-row" });
            categoryRow.createEl("span", { text: "分类:", cls: "tag-form-label" });
            const categoryCheck = categoryRow.createEl("input", { type: "checkbox" });
            categoryCheck.checked = tag?.isCategory || false;
            categoryRow.createEl("span", { text: "设为分类", attr: { style: "margin-left:8px;" } });

            const btnRow = formContainer.createEl("div", { cls: "tag-form-row", attr: { style: "justify-content:flex-end; margin-top:15px;" } });
            const cancelBtn = btnRow.createEl("button", { text: "取消", cls: "tag-mgr-btn tag-mgr-btn-secondary" });
            cancelBtn.onclick = () => { formContainer.style.display = "none"; };
            const saveBtn = btnRow.createEl("button", { text: tagId ? "保存修改" : "创建标签", cls: "tag-mgr-btn tag-mgr-btn-primary" });

            saveBtn.onclick = async () => {
                const newId = idInput.value.trim();
                if (!newId) { new Notice("⚠️ 请输入标签ID"); return; }
                if (!labelInput.value.trim()) { new Notice("⚠️ 请输入标签名称"); return; }
                if (!tagId && TAG_DEFINITIONS[newId]) { new Notice("⚠️ 该ID已存在"); return; }

                const rawParent = parentInput.value.trim();
                let parentId = null;
                if (rawParent) {
                    if (TAG_DEFINITIONS[rawParent]) {
                        parentId = rawParent;
                    } else {
                        const match = rawParent.match(/\(([^)]+)\)\s*$/);
                        if (match && TAG_DEFINITIONS[match[1]]) parentId = match[1];
                    }
                    if (!parentId) {
                        const labelMatches = Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k]?.label?.trim() === rawParent);
                        if (labelMatches.length === 1) parentId = labelMatches[0];
                    }
                    if (!parentId) { new Notice("⚠️ 父级无效，请从列表选择或留空"); return; }
                    if (parentId === newId) { new Notice("⚠️ 父级不能是自己"); return; }
                    if (isCycle(parentId, newId)) { new Notice("❌ 不能选择自己的子层级"); return; }
                }

                TAG_DEFINITIONS[newId] = {
                    label: labelInput.value.trim(),
                    icon: iconInput.value.trim() || "🏷️",
                    color: colorInput.value,
                    parentId: parentId || null,
                    isCategory: categoryCheck.checked,
                    order: tag?.order || Object.keys(TAG_DEFINITIONS).filter(k => TAG_DEFINITIONS[k]?.parentId === (parentId || null)).length
                };

                if (tagId && tagId !== newId) {
                    Object.keys(TAG_DEFINITIONS).forEach(k => {
                        if (TAG_DEFINITIONS[k]?.parentId === tagId) TAG_DEFINITIONS[k].parentId = newId;
                    });
                    delete TAG_DEFINITIONS[tagId];
                }

                await saveTagDefinitions(TAG_DEFINITIONS);
                TAG_DEFINITIONS = await loadTagDefinitions();
                new Notice(tagId ? "✅ 标签已更新" : "✅ 标签已创建");
                formContainer.style.display = "none";
                if (renderViewFn) renderViewFn();
            };
        };

        addTagBtn.onclick = () => showTagForm(null);
        addCategoryBtn.onclick = () => {
            showTagForm(null);
            setTimeout(() => {
                const checkbox = formContainer.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = true;
            }, 50);
        };

        const isCycle = (candidateParentId, nodeId) => {
            if (!candidateParentId) return false;
            if (candidateParentId === nodeId) return true;
            let cursor = TAG_DEFINITIONS[candidateParentId]?.parentId || null;
            while (cursor) {
                if (cursor === nodeId) return true;
                cursor = TAG_DEFINITIONS[cursor]?.parentId || null;
            }
            return false;
        };

        const normalizeOrders = (parentId) => {
            const siblings = sortTagIdsForTree(getChildTags(parentId));
            siblings.forEach((id, idx) => {
                if (TAG_DEFINITIONS[id]) TAG_DEFINITIONS[id].order = idx;
            });
        };

        const persistTagDefinitionsAndRefresh = async (noticeText = "") => {
            await saveTagDefinitions(TAG_DEFINITIONS);
            TAG_DEFINITIONS = await loadTagDefinitions();
            if (noticeText) new Notice(noticeText);
            if (renderViewFn) renderViewFn();
        };

        const moveTagToParent = async (sourceId, targetParentId, noticeText = "✅ 已调整层级") => {
            if (!sourceId || !TAG_DEFINITIONS[sourceId]) return;
            const normalizedTargetParent = targetParentId || null;
            if (isCycle(normalizedTargetParent, sourceId)) {
                new Notice("❌ 不能将标签移动到自己的子层级");
                return;
            }

            const oldParent = TAG_DEFINITIONS[sourceId].parentId || null;
            if (oldParent === normalizedTargetParent) return;

            TAG_DEFINITIONS[sourceId].parentId = normalizedTargetParent;
            const nextSiblings = sortTagIdsForTree(getChildTags(normalizedTargetParent)).filter(id => id !== sourceId);
            nextSiblings.push(sourceId);
            nextSiblings.forEach((id, idx) => {
                if (TAG_DEFINITIONS[id]) TAG_DEFINITIONS[id].order = idx;
            });
            normalizeOrders(oldParent);

            await persistTagDefinitionsAndRefresh(noticeText);
        };

        // 递归渲染标签树
        const treeContainer = wrapper.createEl("div", { attr: { style: "margin-top:15px;" } });

        const renderTagTree = (parentId, container, level = 0) => {
            const children = sortTagIdsForTree(getChildTags(parentId));

            children.forEach(tagId => {
                const def = TAG_DEFINITIONS[tagId];
                if (!def) return;

                const item = container.createEl("div", {
                    cls: `tag-item ${def.isCategory ? 'is-category' : ''}`,
                    attr: { draggable: "true" }
                });

                item.createEl("div", { cls: "tag-color-dot", attr: { style: `background:${def.color};` } });
                item.createEl("span", { cls: "tag-icon", text: def.icon });
                const info = item.createEl("div");
                info.createEl("div", { cls: "tag-label", text: def.label });
                info.createEl("div", { cls: "tag-meta", text: `ID: ${tagId} | ${def.isCategory ? '📁 分类' : '🏷️ 标签'}` });

                const actions = item.createEl("div", { cls: "tag-actions" });
                const editBtn = actions.createEl("button", { text: "✏️", cls: "tag-action-btn" });
                editBtn.onclick = () => showTagForm(tagId);

                const deleteBtn = actions.createEl("button", { text: "🗑️", cls: "tag-action-btn" });
                const childCount = getChildTags(tagId).length;
                const usageCount = (timelineData.items || []).filter(i => i.tags && i.tags.includes(tagId)).length;
                deleteBtn.onclick = async () => {
                    if (childCount > 0) { new Notice("⚠️ 请先删除子标签"); return; }
                    if (usageCount > 0) { new Notice(`⚠️ 该标签正在被 ${usageCount} 个事项使用`); return; }
                    if (confirm(`确定删除 "${def.label}" 吗？`)) {
                        delete TAG_DEFINITIONS[tagId];
                        await persistTagDefinitionsAndRefresh("🗑️ 标签已删除");
                    }
                };

                // 拖拽排序：仅在同一父级内调整 order
                const reorderWithinParent = async (sourceId, targetId) => {
                    const parentId = def.parentId || null;
                    const siblings = sortTagIdsForTree(getChildTags(parentId));
                    const srcIdx = siblings.indexOf(sourceId);
                    const tgtIdx = siblings.indexOf(targetId);
                    if (srcIdx === -1 || tgtIdx === -1) return;
                    siblings.splice(srcIdx, 1);
                    siblings.splice(tgtIdx, 0, sourceId);
                    siblings.forEach((id, idx) => {
                        if (TAG_DEFINITIONS[id]) TAG_DEFINITIONS[id].order = idx;
                    });
                    await persistTagDefinitionsAndRefresh("↕️ 已调整同级顺序");
                };

                item.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("text/tag-id", tagId);
                    e.dataTransfer.setData("text/parent-id", def.parentId || "");
                    item.classList.add("is-dragging");
                    setTagDragActive(true);
                });

                item.addEventListener("dragend", () => {
                    item.classList.remove("is-dragging");
                    setTagDragActive(false);
                });

                item.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    item.classList.add("drag-over");
                });

                item.addEventListener("dragleave", () => item.classList.remove("drag-over"));

                item.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTagDragActive(false);
                    const srcId = e.dataTransfer.getData("text/tag-id");
                    const srcParent = e.dataTransfer.getData("text/parent-id") || null;
                    item.classList.remove("drag-over");
                    if (!srcId || srcId === tagId) return;
                    const targetAsParent = tagId;
                    // 同级排序
                    if (srcParent === (def.parentId || null)) {
                        await reorderWithinParent(srcId, tagId);
                        return;
                    }
                    // 跨层级：改父级
                    await moveTagToParent(srcId, targetAsParent, `✅ 已移动到 "${def.label}" 下`);
                });

                const childDropZone = container.createEl("div", {
                    cls: "tag-child-drop-zone",
                    text: `⇢ 拖到这里，设为「${def.label}」的子标签`,
                    attr: {
                        style: `--tag-drop-color: ${def.color};`
                    }
                });
                childDropZone.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    childDropZone.classList.add("drag-over");
                });
                childDropZone.addEventListener("dragleave", () => {
                    childDropZone.classList.remove("drag-over");
                });
                childDropZone.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTagDragActive(false);
                    childDropZone.classList.remove("drag-over");
                    const srcId = e.dataTransfer.getData("text/tag-id");
                    if (!srcId || srcId === tagId) return;
                    await moveTagToParent(srcId, tagId, `✅ 已移动到 "${def.label}" 下`);
                });

                const hasChildren = getChildTags(tagId).length > 0;
                if (hasChildren) {
                    const childrenContainer = container.createEl("div", { cls: "tag-children" });
                    renderTagTree(tagId, childrenContainer, level + 1);
                }
            });
        };

        // 顶层拖放区：拖到这里设为顶层
        const rootDrop = wrapper.createEl("div", {
            text: "⇧ 拖拽到这里设为顶层",
            attr: { style: "padding:8px 12px; margin-top:8px; border:1px dashed var(--interactive-accent); border-radius:6px; color:var(--text-muted); font-size:12px;" }
        });
        rootDrop.addEventListener("dragover", (e) => { e.preventDefault(); rootDrop.style.background = "var(--background-primary)"; });
        rootDrop.addEventListener("dragleave", () => { rootDrop.style.background = "transparent"; });
        rootDrop.addEventListener("drop", async (e) => {
            e.preventDefault();
            setTagDragActive(false);
            rootDrop.style.background = "transparent";
            const srcId = e.dataTransfer.getData("text/tag-id");
            if (!srcId) return;
            if (TAG_DEFINITIONS[srcId]?.parentId === null) return;
            await moveTagToParent(srcId, null, "✅ 已移到顶层");
        });

        renderTagTree(null, treeContainer);

        if (Object.keys(TAG_DEFINITIONS).length === 0) {
            treeContainer.createEl("div", {
                text: "暂无标签，点击上方按钮创建",
                attr: { style: "text-align:center; padding:40px; color:var(--text-muted);" }
            });
        }
    };

    // ===== 5. Mermaid Gantt 时间线视图 =====

    const filterGanttItems = (data, activeRange, useViewRange) => {
        const scheduledOnly = !!window.timelineDayblockOnlyScheduled;
        return data.filter(item => {
            if (!tagMatchesFilter(item.tags, window.timelineTagFilters)) return false;
            if (scheduledOnly && !itemHasScheduledInRange(item, activeRange.start, activeRange.end)) return false;
            if (!useViewRange) return true;
            const s = moment(item.startDate);
            const e = moment(item.endDate);
            return e.isSameOrAfter(activeRange.start, "day") && s.isSameOrBefore(activeRange.end, "day");
        });
    };

    const parseGanttDateSortValue = (value, fallback = Number.MAX_SAFE_INTEGER) => {
        const parsed = moment(value);
        return parsed.isValid() ? parsed.valueOf() : fallback;
    };

    const parseGanttTimeSortValue = (value) => {
        const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
        if (!match) return 24 * 60 + 1;
        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 24 * 60 + 1;
        return hours * 60 + minutes;
    };

    const compareGanttSortValue = (left, right) => {
        if (left === right) return 0;
        return left < right ? -1 : 1;
    };

    const compareGanttItems = (left, right) => {
        return compareGanttSortValue(parseGanttDateSortValue(left.startDate), parseGanttDateSortValue(right.startDate))
            || compareGanttSortValue(parseGanttTimeSortValue(left.startTime), parseGanttTimeSortValue(right.startTime))
            || compareGanttSortValue(parseGanttDateSortValue(left.endDate), parseGanttDateSortValue(right.endDate))
            || compareGanttSortValue(parseGanttTimeSortValue(left.endTime), parseGanttTimeSortValue(right.endTime))
            || compareGanttSortValue(parseGanttDateSortValue(left.created, 0), parseGanttDateSortValue(right.created, 0))
            || (left.name || "").localeCompare(right.name || "");
    };

    const sortGanttItems = (items) => {
        return items
            .map((item, index) => ({ item, index }))
            .sort((left, right) => compareGanttItems(left.item, right.item) || left.index - right.index)
            .map(entry => entry.item);
    };

    // 生成 Mermaid Gantt 代码
    const generateMermaidGanttCode = (data, config, activeRange, useViewRange) => {
        if (data.length === 0) {
            return `gantt
    title 暂无事项
    section 空
    请添加事项 :crit, 0d`;
        }

        const filteredData = filterGanttItems(data, activeRange, useViewRange);

        if (filteredData.length === 0) {
            const emptyTitle = useViewRange ? "当前范围暂无事项" : "当前筛选暂无事项";
            return `gantt
    title ${emptyTitle}
    dateFormat  YYYY-MM-DD
    axisFormat ${config.axisFormat || "%Y-%m-%d"}
    section 提示
    在选择的条件内没有事项 :crit, ${activeRange.start.format("YYYY-MM-DD")}, 1d`;
        }

        // 计算日期范围
        let minDate = activeRange.start.clone();
        let maxDate = activeRange.end.clone();

        const startDateStr = minDate.format("YYYY-MM-DD");
        const axisFormat = config.axisFormat || "%Y-%m-%d";

        // 分类管理已下线：甘特图不再按标签/未分类分组，统一按时间顺序展示。
        const sortedData = sortGanttItems(filteredData);

        let code = `%%{init: { "theme": "base" }}%%
gantt
    title Timeline 时间线视图
    dateFormat  YYYY-MM-DD
    axisFormat ${axisFormat}
    excludes weekends

`;

        // 单一 section：排序规则见 sortGanttItems。
        code += `    section 时间线\n`;
        sortedData.forEach((item) => {
                const taskId = `task_${item.id}`;
                const safeName = (item.name || "")
                    .replace(/:/g, "：")
                    .replace(/\|/g, "｜")
                    .replace(/\"/g, "＂")
                    .replace(/\n/g, " ");
                const rangeStart = activeRange.start.clone();
                const rangeEnd = activeRange.end.clone();
                const startMoment = moment(item.startDate);
                const endMoment = moment(item.endDate);
                const clippedStart = useViewRange && startMoment.isBefore(rangeStart, "day") ? rangeStart.clone() : startMoment;
                const clippedEnd = useViewRange && endMoment.isAfter(rangeEnd, "day") ? rangeEnd.clone() : endMoment;
                const startDate = clippedStart.format("YYYY-MM-DD");
                // 结束日期：选定范围内不加一天，避免里程碑靠近边界时错位
                const endDate = useViewRange
                    ? clippedEnd.format("YYYY-MM-DD")
                    : clippedEnd.clone().add(1, 'day').format("YYYY-MM-DD");

                // 检查该事项在当前视图范围内是否有里程碑
                const milestones = timelineData.milestones ?
                    Object.values(timelineData.milestones).filter(m => {
                        if (m.itemId !== item.id) return false;
                        if (!useViewRange) return true;
                        return moment(m.date).isBetween(activeRange.start, activeRange.end, "day", "[]");
                    }).sort((a, b) => moment(a.date).diff(moment(b.date))) : [];

                let displayName = isScheduleItem(item)
                    ? `⏱️ ${safeName}${item.startTime || item.endTime ? ` (${item.startTime || ""}-${item.endTime || ""})` : ""}`
                    : safeName;
                if (milestones.length > 0) {
                    const completedCount = milestones.filter(m => m.completed).length;
                    const totalCount = milestones.length;
                    // 在事项名称后添加里程碑信息
                    displayName = `${safeName} [🎯${completedCount}/${totalCount}]`;
                }

                // 使用显式结束日期，避免 duration 差一日
                code += `    ${displayName} :${taskId}, ${startDate}, ${endDate}\n`;

                // 在事项下方添加里程碑（直接跟在事项后面，不使用section，保持视觉上的层级关系）
                milestones.forEach(m => {
                    const mileDate = moment(m.date).isValid() ? moment(m.date).format("YYYY-MM-DD") : m.date;
                    const mileTaskId = `mile_${m.id}`;
                    const status = m.completed ? "✅" : "🔲";
                    const safeMileName = (m.name || "")
                        .replace(/:/g, "：")
                        .replace(/\|/g, "｜")
                        .replace(/\"/g, "＂")
                        .replace(/\n/g, " ");
                    // 使用 milestone 作为 0 持续时间的任务，并添加缩进前缀表示层级
                    code += `        ${status} ${mileDate} ${safeMileName} :${mileTaskId}, ${mileDate}, 0d\n`;
                });
        });

        // 移除独立的"📍 里程碑"section，改为将里程碑直接放在事项下方
        // 下面不再需要单独的里程碑汇总区块
        const allMilestones = [];
        if (timelineData.milestones) {
            Object.values(timelineData.milestones).forEach(m => {
                if (useViewRange && !moment(m.date).isBetween(activeRange.start, activeRange.end, "day", "[]")) return;
                const item = filteredData.find(i => i.id === m.itemId);
                if (item) {
                    allMilestones.push({ ...m, itemName: item.name });
                }
            });
        }

        // 如果有不在任何事项范围内的里程碑，添加一个独立的里程碑section显示它们
        const milestoneItemIds = new Set(filteredData.map(i => i.id));
        const orphanedMilestones = allMilestones.filter(m => !milestoneItemIds.has(m.itemId));

        if (orphanedMilestones.length > 0) {
            code += `\n    section 📍 其他里程碑\n`;
            orphanedMilestones.forEach(m => {
                const mileDate = moment(m.date).isValid() ? moment(m.date).format("YYYY-MM-DD") : m.date;
                const taskId = `mile_${m.id}`;
                const safeMileName = (m.name || "").replace(/:/g, "：").replace(/\|/g, "｜").replace(/\"/g, "＂").replace(/\n/g, " ");
                const safeItemName = (m.itemName || "").replace(/:/g, "：").replace(/\|/g, "｜").replace(/\"/g, "＂").replace(/\n/g, " ");
                // 使用 milestone 作为 0 持续时间的任务
                code += `    🎯 ${safeMileName} (${safeItemName}) :${taskId}, ${mileDate}, 0d\n`;
            });
        }

        return code;
    };

    const getVisibleTaskRange = (item, activeRange, useViewRange) => {
        const rangeStart = activeRange.start.clone();
        const rangeEnd = activeRange.end.clone();
        const startMoment = moment(item.startDate);
        const endMoment = moment(item.endDate);
        return {
            start: useViewRange && startMoment.isBefore(rangeStart, "day") ? rangeStart.clone() : startMoment,
            end: useViewRange && endMoment.isAfter(rangeEnd, "day") ? rangeEnd.clone() : endMoment
        };
    };

    const findTaskBarGraphic = (svgElement, itemId) => {
        const token = `task_${itemId}`;
        const candidates = [
            `#${token}`,
            `[id="${token}"]`,
            `[id*="${token}"]`,
            `[data-task-id="${token}"]`,
            `[data-task-id*="${token}"]`,
            `[data-id="${token}"]`,
            `[data-id*="${token}"]`,
            `[data-task="${token}"]`,
            `[data-task*="${token}"]`
        ];

        for (const selector of candidates) {
            const node = svgElement.querySelector(selector);
            if (!node) continue;
            if (node.tagName?.toLowerCase() === "rect") return node;
            const rect = node.querySelector?.("rect");
            if (rect) return rect;
            return node;
        }
        return null;
    };

    const renderGanttProgressAnnotations = (svgElement, items, activeRange, useViewRange) => {
        if (!svgElement) return;

        const SVG_NS = "http://www.w3.org/2000/svg";
        svgElement.querySelectorAll(".timeline-progress-overlay").forEach(node => node.remove());

        items.forEach(item => {
            const visibleRange = getVisibleTaskRange(item, activeRange, useViewRange);
            const visibleStart = visibleRange.start;
            const visibleEnd = visibleRange.end;
            if (!visibleStart.isValid() || !visibleEnd.isValid() || visibleEnd.isBefore(visibleStart, "day")) return;

            const deadlineMilestones = getMilestonesForItem(item.id).filter(m => isDeadlineMilestone(m));
            if (deadlineMilestones.length === 0) return;

            const barEl = findTaskBarGraphic(svgElement, item.id);
            if (!barEl || typeof barEl.getBBox !== "function") return;

            const bbox = barEl.getBBox();
            if (!bbox || !Number.isFinite(bbox.width) || bbox.width <= 0) return;

            const visibleDays = Math.max(1, visibleEnd.diff(visibleStart, "days") + 1);
            const dayWidth = bbox.width / visibleDays;

            deadlineMilestones.forEach((m) => {
                const oneThirdDate = getOneThirdMarkerDate(m);
                const anchorDate = getMilestoneAnchorMoment(m)?.format("YYYY-MM-DD") || "未知";
                const markers = [
                    {
                        type: "oneThird",
                        date: oneThirdDate,
                        color: "#2f80ed",
                        slot: 0.34,
                        label: "1/3",
                        title: `1/3 节点\n关联 deadline: ${m.name || "未命名里程碑"}\n起算日期: ${anchorDate}\n1/3 日期: ${oneThirdDate}\n截止日期: ${m.date}${m.completed ? "\n状态: 已完成" : ""}`
                    },
                    {
                        type: "deadline",
                        date: m.date,
                        color: "#ff1f1f",
                        slot: 0.68,
                        label: "",
                        title: `Deadline: ${m.name || "未命名里程碑"}\n日期: ${m.date}${m.completed ? "\n状态: 已完成" : ""}`
                    }
                ].filter(marker =>
                    marker.date && moment(marker.date).isBetween(visibleStart, visibleEnd, "day", "[]")
                );

                markers.forEach(marker => {
                    const dateMoment = moment(marker.date);
                    if (!dateMoment.isValid()) return;

                    const dayOffset = dateMoment.diff(visibleStart, "days");
                    if (dayOffset < 0 || dayOffset >= visibleDays) return;

                    const x = bbox.x + dayOffset * dayWidth + dayWidth * marker.slot;
                    const y1 = bbox.y + 2;
                    const y2 = bbox.y + bbox.height - 2;

                    const overlay = document.createElementNS(SVG_NS, "g");
                    overlay.setAttribute("class", "timeline-progress-overlay");
                    overlay.style.cursor = "pointer";

                    const line = document.createElementNS(SVG_NS, "line");
                    line.setAttribute("x1", String(x));
                    line.setAttribute("x2", String(x));
                    line.setAttribute("y1", String(y1));
                    line.setAttribute("y2", String(y2));
                    line.setAttribute("stroke", marker.color);
                    line.setAttribute("stroke-width", marker.type === "deadline" ? "3" : "2.4");
                    line.setAttribute("stroke-linecap", "round");
                    line.setAttribute("opacity", m.completed ? "0.65" : "0.98");
                    if (marker.type === "oneThird") {
                        line.setAttribute("stroke-dasharray", "3 2");
                    }

                    const cap = document.createElementNS(SVG_NS, "circle");
                    cap.setAttribute("cx", String(x));
                    cap.setAttribute("cy", String(y1 + 1));
                    cap.setAttribute("r", marker.type === "deadline" ? "3.6" : "3.1");
                    cap.setAttribute("fill", marker.color);
                    cap.setAttribute("stroke", "#ffffff");
                    cap.setAttribute("stroke-width", "1.2");
                    cap.setAttribute("opacity", m.completed ? "0.7" : "1");

                    let markerText = null;
                    if (marker.label) {
                        const text = document.createElementNS(SVG_NS, "text");
                        text.setAttribute("x", String(x));
                        text.setAttribute("y", String(y1 + 8));
                        text.setAttribute("fill", marker.color);
                        text.setAttribute("font-size", "8");
                        text.setAttribute("font-weight", "700");
                        text.setAttribute("text-anchor", "middle");
                        text.textContent = marker.label;
                        markerText = text;
                    }

                    const title = document.createElementNS(SVG_NS, "title");
                    title.textContent = marker.title;

                    overlay.appendChild(line);
                    overlay.appendChild(cap);
                    if (markerText) overlay.appendChild(markerText);
                    overlay.appendChild(title);
                    overlay.addEventListener("click", (evt) => {
                        evt.stopPropagation();
                        openMilestoneModal(app, m, item, m.date, saveMilestone, deleteMilestone);
                    });

                    svgElement.appendChild(overlay);
                });
            });
        });
    };

    // 渲染 Mermaid Gantt 图表
    const renderMermaidGantt = async (container, data) => {
        const epoch = renderEpoch;
        if (!engineActive()) return;
        container.empty();
        const activeRange = getActiveRange();
        const useViewRange = window.timelineGanttRangeMode === "view";

        // 筛选数据（标签 + 可选时间范围）
        const filteredData = filterGanttItems(data, activeRange, useViewRange);

        // 工具栏
        const toolbar = container.createEl("div", {
            attr: {
                style: `
                    display:flex;
                    gap:10px;
                    padding:10px 15px;
                    background:var(--background-secondary);
                    border-bottom:1px solid var(--background-modifier-border);
                    align-items:center;
                    flex-wrap:wrap;
                `
            }
        });

        toolbar.createEl("span", { text: "🔍 缩放:", attr: { style: "font-weight:600;" } });

        Object.keys(MERMAID_CONFIG.zoom).forEach(zoomKey => {
            const btn = toolbar.createEl("button", {
                text: MERMAID_CONFIG.zoom[zoomKey].label || zoomKey,
                attr: {
                    style: `
                        padding:6px 12px;
                        border-radius:4px;
                        border:1px solid var(--background-modifier-border);
                        cursor:pointer;
                        background:${window.timelineZoom === zoomKey ? 'var(--interactive-accent)' : 'transparent'};
                        color:${window.timelineZoom === zoomKey ? 'white' : 'var(--text-normal)'};
                    `
                }
            });
            btn.addEventListener("click", () => { window.timelineZoom = zoomKey; renderViewFn(); });
        });

        // 范围切换
        const rangeContainer = toolbar.createEl("div", { attr: { style: "display:flex; gap:6px; align-items:center; margin-left:20px; flex-wrap:wrap;" } });
        rangeContainer.createEl("span", { text: "⏱️ 范围:", attr: { style: "font-weight:600;" } });

        const weekBtn = rangeContainer.createEl("button", {
            text: "本周",
            attr: {
                style: `
                    padding:6px 10px;
                    border-radius:6px;
                    border:1px solid var(--background-modifier-border);
                    cursor:pointer;
                    background:${window.timelineRangeMode === 'week' ? 'var(--interactive-accent)' : 'transparent'};
                    color:${window.timelineRangeMode === 'week' ? '#fff' : 'var(--text-normal)'};
                `
            }
        });
        weekBtn.onclick = async () => {
            window.timelineRangeMode = "week";
            window.timelineCustomStart = moment().startOf("isoWeek").format("YYYY-MM-DD");
            window.timelineCustomEnd = moment().endOf("isoWeek").format("YYYY-MM-DD");
            await persistViewRange();
        };

        const customBtn = rangeContainer.createEl("button", {
            text: "自定义",
            attr: {
                style: `
                    padding:6px 10px;
                    border-radius:6px;
                    border:1px solid var(--background-modifier-border);
                    cursor:pointer;
                    background:${window.timelineRangeMode === 'custom' ? 'var(--interactive-accent)' : 'transparent'};
                    color:${window.timelineRangeMode === 'custom' ? '#fff' : 'var(--text-normal)'};
                `
            }
        });
        customBtn.onclick = async () => {
            window.timelineRangeMode = "custom";
            if (!window.timelineCustomStart || !window.timelineCustomEnd) {
                window.timelineCustomStart = moment().startOf("isoWeek").format("YYYY-MM-DD");
                window.timelineCustomEnd = moment().endOf("isoWeek").format("YYYY-MM-DD");
            }
            await persistViewRange();
        };

        const startInput = rangeContainer.createEl("input", { type: "date", value: window.timelineCustomStart, attr: { style: "padding:4px 8px;" } });
        const endInput = rangeContainer.createEl("input", { type: "date", value: window.timelineCustomEnd, attr: { style: "padding:4px 8px;" } });
        const applyBtn = rangeContainer.createEl("button", { text: "保存范围", cls: "mod-cta" });

        const setInputDisabled = () => {
            const disabled = window.timelineRangeMode !== "custom";
            startInput.disabled = disabled;
            endInput.disabled = disabled;
            applyBtn.disabled = disabled;
            applyBtn.style.opacity = disabled ? 0.6 : 1;
        };
        setInputDisabled();

        applyBtn.onclick = async () => {
            if (window.timelineRangeMode !== "custom") return;
            if (!startInput.value || !endInput.value) { new Notice("请输入开始/结束日期"); return; }
            if (moment(endInput.value).isBefore(moment(startInput.value))) { new Notice("结束日期不能早于开始"); return; }
            window.timelineCustomStart = startInput.value;
            window.timelineCustomEnd = endInput.value;
            await persistViewRange();
        };

        // 甘特范围切换（事项范围 / 选定范围）
        const ganttRangeContainer = toolbar.createEl("div", { attr: { style: "display:flex; gap:6px; align-items:center; margin-left:20px; flex-wrap:wrap;" } });
        ganttRangeContainer.createEl("span", { text: "📊 甘特:", attr: { style: "font-weight:600;" } });
        const autoRangeBtn = ganttRangeContainer.createEl("button", {
            text: "事项范围",
            attr: {
                style: `
                    padding:6px 10px;
                    border-radius:6px;
                    border:1px solid var(--background-modifier-border);
                    cursor:pointer;
                    background:${window.timelineGanttRangeMode === 'auto' ? 'var(--interactive-accent)' : 'transparent'};
                    color:${window.timelineGanttRangeMode === 'auto' ? '#fff' : 'var(--text-normal)'};
                `
            }
        });
        autoRangeBtn.onclick = async () => {
            window.timelineGanttRangeMode = "auto";
            await persistViewRange();
        };

        const viewRangeBtn = ganttRangeContainer.createEl("button", {
            text: "选定范围",
            attr: {
                style: `
                    padding:6px 10px;
                    border-radius:6px;
                    border:1px solid var(--background-modifier-border);
                    cursor:pointer;
                    background:${window.timelineGanttRangeMode === 'view' ? 'var(--interactive-accent)' : 'transparent'};
                    color:${window.timelineGanttRangeMode === 'view' ? '#fff' : 'var(--text-normal)'};
                `
            }
        });
        viewRangeBtn.onclick = async () => {
            window.timelineGanttRangeMode = "view";
            await persistViewRange();
        };

        if (filteredData.length === 0) {
            const emptyText = data.length === 0
                ? "📭 暂无事项，点击 [+ 添加事项] 开始记录"
                : (useViewRange ? "📭 当前范围或筛选下无事项" : "📭 当前筛选下无事项");
            container.createEl("div", {
                text: emptyText,
                attr: { style: "text-align:center; padding:40px; color:#999;" }
            });
            return;
        }

        // Mermaid 图表容器
        const diagramContainer = container.createEl("div", { cls: "mermaid-gantt-container" });
        diagramContainer.style.position = "relative";
        diagramContainer.style.padding = "15px";
        diagramContainer.style.overflowX = "auto";
        diagramContainer.style.overflowY = "visible";
        diagramContainer.style.border = "1px solid var(--background-modifier-border)";
        diagramContainer.style.borderRadius = "8px";
        diagramContainer.style.margin = "10px";
        bindGanttRangeWheel(diagramContainer);

        // 生成 Mermaid 代码
        const config = MERMAID_CONFIG.zoom[window.timelineZoom] || MERMAID_CONFIG.zoom.week;
        let mermaidCode = generateMermaidGanttCode(data, config, activeRange, useViewRange);

        // 使用 window.mermaid 渲染
        if (window.mermaid) {
            try {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: "default",
                    securityLevel: "loose",
                    gantt: {
                        axisFormat: config.axisFormat,
                        barHeight: 25,
                        barGap: 5,
                        sectionSize: config.sectionSize || 5
                    }
                });

                diagramContainer.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
                await window.mermaid.init(undefined, diagramContainer.querySelector(".mermaid"));
                if (!engineActive() || epoch !== renderEpoch) return;

                // 恢复缩放状态 & 绑定点击编辑
                setTimeout(() => {
                    if (!engineActive() || epoch !== renderEpoch) return;
                    const svgElement = diagramContainer.querySelector("svg");
                    if (svgElement) {
                        svgElement.style.transformOrigin = "top left";
                        if (window.timelineMermaidState && window.timelineMermaidState.zoom !== 1.0) {
                            svgElement.style.transform = `scale(${window.timelineMermaidState.zoom})`;
                        }
                        renderGanttProgressAnnotations(svgElement, filteredData, activeRange, useViewRange);
                        const findMermaidTaskToken = (targetEl) => {
                            let node = targetEl;
                            while (node && node !== svgElement) {
                                const id = node.id || "";
                                if (id.includes("task_") || id.includes("mile_")) return id;
                                if (node.getAttribute) {
                                    const dataId = node.getAttribute("data-task-id") || node.getAttribute("data-id") || node.getAttribute("data-task");
                                    if (dataId && (dataId.includes("task_") || dataId.includes("mile_"))) return dataId;
                                }
                                node = node.parentElement;
                            }
                            return null;
                        };

                        const normalizeTaskToken = (token, prefix) => {
                            if (!token) return null;
                            const match = token.match(new RegExp(`${prefix}[A-Za-z0-9]+`));
                            return match ? match[0].replace(prefix, "") : null;
                        };

                        svgElement.addEventListener("click", (evt) => {
                            const token = findMermaidTaskToken(evt.target);
                            if (!token) return;

                            const mileId = normalizeTaskToken(token, "mile_");
                            if (mileId) {
                                const milestone = getMilestoneById(mileId);
                                if (milestone) {
                                    const item = (timelineData.items || []).find(i => i.id === milestone.itemId);
                                    if (item) {
                                        openMilestoneModal(app, milestone, item, milestone.date, saveMilestone, deleteMilestone);
                                    } else {
                                        new Notice("⚠️ 未找到里程碑对应的事项");
                                    }
                                } else {
                                    new Notice("⚠️ 未找到里程碑数据");
                                }
                                return;
                            }

                            const taskId = normalizeTaskToken(token, "task_");
                            if (taskId) openEditModalById(taskId);
                        });

                        const clickableEls = svgElement.querySelectorAll('[id*="task_"], [id*="mile_"], .task');
                        clickableEls.forEach(el => { el.style.cursor = "pointer"; });
                    }
                    if (diagramContainer && window.timelineMermaidState) {
                        diagramContainer.scrollLeft = window.timelineMermaidState.scrollLeft || 0;
                        diagramContainer.scrollTop = window.timelineMermaidState.scrollTop || 0;
                    }
                }, 100);

            } catch (error) {
                if (!engineActive() || epoch !== renderEpoch) return;
                diagramContainer.innerHTML = `<div style="color:red;padding:10px;">渲染失败: ${error.message}</div>`;
                // 输出代码用于调试
                diagramContainer.innerHTML += `<pre style="background:#f5f5f5;padding:10px;margin-top:10px;overflow:auto;">${mermaidCode}</pre>`;
            }
        } else {
            diagramContainer.innerHTML = `<div style="color:orange;padding:10px;">⚠️ Mermaid 库未加载，将显示代码</div>`;
            diagramContainer.innerHTML += `<pre style="background:#f5f5f5;padding:10px;margin-top:10px;overflow:auto;white-space:pre-wrap;">${mermaidCode}</pre>`;
        }

        // 保存滚动状态
        if (diagramContainer) {
            diagramContainer.addEventListener('scroll', () => {
                if (window.timelineMermaidState) {
                    window.timelineMermaidState.scrollLeft = diagramContainer.scrollLeft;
                    window.timelineMermaidState.scrollTop = diagramContainer.scrollTop;
                }
            });
        }

        // 信息提示（含 ISO 周数）
        let rangeLabel = "事项范围";
        let weekLabel = "";
        if (useViewRange) {
            const startWeek = activeRange.start.isoWeek();
            const endWeek = activeRange.end.isoWeek();
            const startYear = activeRange.start.isoWeekYear();
            const endYear = activeRange.end.isoWeekYear();
            weekLabel = startWeek === endWeek && startYear === endYear
                ? `W${String(startWeek).padStart(2,"0")} (${startYear})`
                : `W${String(startWeek).padStart(2,"0")} (${startYear}) → W${String(endWeek).padStart(2,"0")} (${endYear})`;
            rangeLabel = `${activeRange.start.format("YYYY-MM-DD")} ~ ${activeRange.end.format("YYYY-MM-DD")} | 周次 ${weekLabel}`;
        }

        const durationLabel = useViewRange ? ` | 跨度 ${getRangeDurationDays(activeRange)} 天` : "";
        container.createEl("div", {
            text: `📊 范围 ${rangeLabel}${durationLabel} | 显示 ${filteredData.length} 个事项 | Shift+滚轮平移范围，Ctrl+滚轮缩放范围 | 点击条形可编辑`,
            attr: { style: "padding:10px 15px; color:var(--text-muted); font-size:0.9em;" }
        });
    };

    // ===== 6. 月历视图 =====

    const renderCalendarView = (container, data) => {
        container.empty();

        const currentMonth = window.timelineCurrentMonth || moment();
        const monthStart = currentMonth.clone().startOf('month');
        const monthEnd = currentMonth.clone().endOf('month');

        // 应用标签筛选
        let filteredData = data.filter(item =>
            tagMatchesFilter(item.tags, window.timelineTagFilters)
        );
        if (window.timelineDayblockOnlyScheduled) {
            filteredData = filteredData.filter(item =>
                itemHasScheduledInRange(item, monthStart, monthEnd)
            );
        }

        const itemMap = new Map(filteredData.map(item => [item.id, item]));
        const milestones = Object.values(timelineData.milestones || {})
            .filter(m => {
                if (!m?.date) return false;
                if (!moment(m.date).isBetween(monthStart, monthEnd, "day", "[]")) return false;
                return itemMap.has(m.itemId);
            });
        const milestonesByDate = {};
        milestones.forEach(m => {
            if (!milestonesByDate[m.date]) milestonesByDate[m.date] = [];
            milestonesByDate[m.date].push(m);
        });
        Object.keys(milestonesByDate).forEach(d => {
            milestonesByDate[d].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        });

        const headerDiv = container.createEl("div", {
            attr: { style: "display:flex; justify-content:center; align-items:center; padding:20px; gap:20px;" }
        });

        headerDiv.createEl("button", { text: "◀ 上月", cls: "mod-cta" }).onclick = () => {
            window.timelineCurrentMonth = currentMonth.clone().subtract(1, 'month');
            renderViewFn();
        };

        headerDiv.createEl("h2", { text: currentMonth.format("YYYY年 MM月") });

        headerDiv.createEl("button", { text: "下月 ▶", cls: "mod-cta" }).onclick = () => {
            window.timelineCurrentMonth = currentMonth.clone().add(1, 'month');
            renderViewFn();
        };

        const calendarDiv = container.createEl("div", {
            attr: { style: "display:grid; grid-template-columns:repeat(7, 1fr); gap:5px; padding:20px;" }
        });

        ["日", "一", "二", "三", "四", "五", "六"].forEach(day => {
            calendarDiv.createEl("div", {
                text: day,
                attr: { style: "text-align:center; font-weight:bold; padding:10px; background:#f0f0f0;" }
            });
        });

        const firstDay = monthStart.clone();
        const lastDay = monthEnd.clone();
        const startWeekday = firstDay.day();

        for (let i = 0; i < startWeekday; i++) {
            calendarDiv.createEl("div", { attr: { style: "background:#fafafa; min-height:100px;" } });
        }

        let currentDate = firstDay.clone();
        while (currentDate.isSameOrBefore(lastDay, 'day')) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            const isToday = dateStr === moment().format('YYYY-MM-DD');

            const dayDiv = calendarDiv.createEl("div", {
                attr: {
                    style: `border:1px solid #ddd; min-height:100px; padding:5px; background:${isToday ? '#e8f4fc' : '#fff'};`
                }
            });

            dayDiv.createEl("div", {
                text: currentDate.format('D'),
                attr: { style: `font-weight:bold; margin-bottom:5px; color:${isToday ? '#3498db' : '#333'};` }
            });

            const addScheduleBtn = dayDiv.createEl("button", {
                text: "+ 时间安排",
                attr: { style: "font-size:10px; padding:2px 5px; margin-bottom:4px; border-radius:4px;" }
            });
            addScheduleBtn.onclick = (event) => {
                event.stopPropagation();
                addItemWithDate(dateStr);
            };

            const dayItems = filteredData
                .filter(item => moment(dateStr).isBetween(item.startDate, item.endDate, "day", "[]"))
                .sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99") || (a.name || "").localeCompare(b.name || ""));
            dayItems.forEach(item => {
                const nodeKey = getTimelineNodeKey(item.id);
                const isSchedule = isScheduleItem(item);
                const itemDiv = dayDiv.createEl("div", {
                    attr: {
                        "data-timeline-item-id": item.id,
                        "data-timeline-node-key": nodeKey,
                        style: `
                            background:${getTimelineItemColor(item)};
                            color:#fff;
                            padding:2px 5px;
                            margin:2px 0;
                            border-radius:3px;
                            border:${getTimelineItemBorder(item)};
                            font-size:11px;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            cursor:pointer;
                        `,
                        title: `${getTimelineItemLabel(item)}\n${formatTimelineRange(item)}${item.comment ? `\n${item.comment}` : ""}`
                    }
                });
                itemDiv.createSpan({ text: `${isSchedule ? "⏱️" : "📌"} ${item.startTime || ""} ${item.name || "未命名"}`.replace(/\s+/g, " ").trim() });
                if (isSchedule) {
                    const relBtn = itemDiv.createSpan({ text: " 🔗", attr: { title: "EVA 关联" } });
                    relBtn.onclick = async (event) => {
                        event.stopPropagation();
                        await openTimelineRelationEditor(item.id);
                    };
                }
                itemDiv.onclick = () => openEditModalById(item.id);
            });

            const dayMilestones = milestonesByDate[dateStr] || [];
            dayMilestones.forEach(m => {
                const item = itemMap.get(m.itemId);
                if (!item) return;
                const isDone = !!m.completed;
                const label = m.name || "里程碑";
                const itemDiv = dayDiv.createEl("div", {
                    text: `🎯 ${label}`,
                    attr: {
                        style: `
                            background:${item.color};
                            color:#fff;
                            padding:2px 5px;
                            margin:2px 0;
                            border-radius:3px;
                            font-size:11px;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            opacity:${isDone ? 0.6 : 1};
                            text-decoration:${isDone ? 'line-through' : 'none'};
                            cursor:pointer;
                        `,
                        title: `${item.name}\n${label}\n${m.date}${isDone ? " (已完成)" : ""}`
                    }
                });
                itemDiv.onclick = () => {
                    openMilestoneModal(app, m, item, m.date, saveMilestone, deleteMilestone);
                };
            });

            currentDate.add(1, 'day');
        }
    };

    // ===== 7.1 日块矩阵视图 =====

    const setBlockForItemOnDate = async (itemId, dateStr, blockId) => {
        await updateData((data) => {
            const idx = (data.items || []).findIndex(i => i.id === itemId);
            if (idx === -1) return;
            const item = data.items[idx];
            if (isReadOnlyMandalaOperationalContextItem(item)) return;
            ensureDaySlots(item);
            if (!blockId) delete item.daySlots[dateStr];
            else item.daySlots[dateStr] = blockId;
        });
    };

    const renderDayBlockMatrix = (container, data) => {
        container.empty();
        const activeRange = getActiveRange();
        const dates = [];
        const cursor = activeRange.start.clone();
        while (cursor.isSameOrBefore(activeRange.end, "day")) {
            dates.push(cursor.format("YYYY-MM-DD"));
            cursor.add(1, "day");
        }

        // 应用标签筛选
        let filteredData = data.filter(item =>
            !isScheduleItem(item) && tagMatchesFilter(item.tags, window.timelineTagFilters)
        );
        const scheduledOnly = !!window.timelineDayblockOnlyScheduled;
        if (scheduledOnly) {
            filteredData = filteredData.filter(item =>
                itemHasScheduledInRange(item, activeRange.start, activeRange.end)
            );
        }

        // 计算“每日顺序”用于未分配继承
        const dailyOrderMap = buildDailyOrderMap(dates, filteredData);

        const table = container.createEl("table", { attr: { style: "width:100%; border-collapse:collapse; font-size:13px; table-layout:fixed;" } });
        const thead = table.createEl("thead");
        const headRow = thead.createEl("tr");
        headRow.createEl("th", { text: "时间块", attr: { style: "position:sticky; left:0; background:var(--background-secondary); z-index:2; padding:8px; border:1px solid var(--background-modifier-border); width:100px;" } });
        dates.forEach(d => {
            const dateObj = moment(d);
            headRow.createEl("th", {
                text: `${dateObj.format("MM/DD")}\n(${getDayName(d)})`,
                attr: { style: "padding:8px; border:1px solid var(--background-modifier-border); white-space:pre; text-align:center; font-size:12px; min-width:70px;" }
            });
        });

        const tbody = table.createEl("tbody");

        const renderCellItems = (cell, dateStr, blockId) => {
            const items = filteredData.filter(item => {
                const s = moment(item.startDate);
                const e = moment(item.endDate);
                if (!e.isSameOrAfter(dateStr, "day") || !s.isSameOrBefore(dateStr, "day")) return false;
                const slotId = (item.daySlots || {})[dateStr] || null;
                if (blockId === "__unassigned") return slotId === null;
                return slotId === blockId;
            });
            // 依据每日继承顺序排序；若无记录则回退到名称
            const dayOrder = dailyOrderMap[dateStr] || [];
            items.sort((a, b) => {
                const ai = dayOrder.indexOf(a.id);
                const bi = dayOrder.indexOf(b.id);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return (a.name || "").localeCompare(b.name || "");
            });

            if (items.length === 0) {
                cell.createEl("div", { text: "—", attr: { style: "color:var(--text-muted);" } });
                return;
            }

            items.forEach(it => {
                const isSchedule = isScheduleItem(it);
                const nodeKey = getTimelineNodeKey(it.id);
                // 获取该事项在该日期的里程碑
                const dailyMilestones = getMilestonesForItemDate(it.id, dateStr);
                const oneThirdMarkers = getOneThirdMarkersForItemDate(it.id, dateStr);
                const displayMilestones = [...oneThirdMarkers, ...dailyMilestones];
                const hasDailyMilestones = displayMilestones.length > 0;

                // 获取该事项的所有里程碑总数（无论日期和是否在当前视图）
                const allMilestones = getMilestonesForItem(it.id);
                const totalMilestones = allMilestones.length;
                const completedTotalMilestones = allMilestones.filter(m => m.completed).length;
                const pendingTotalMilestones = totalMilestones - completedTotalMilestones;

                // 检查里程碑总数
                let milestoneBadge = '';
                if (totalMilestones > 0) {
                    milestoneBadge = `
                        <span style="
                            display:inline-flex;
                            align-items:center;
                            gap:2px;
                            margin-left:4px;
                            padding:1px 4px;
                            background:${allMilestones.every(m => m.completed) ? '#27ae60' : '#e67e22'};
                            border-radius:8px;
                            font-size:9px;
                            color:#fff;
                            font-weight:bold;
                        ">${pendingTotalMilestones}/${totalMilestones} ◉</span>
                    `;
                }

                const pill = cell.createEl("div", {
                    attr: {
                        "data-timeline-item-id": it.id,
                        "data-timeline-node-key": nodeKey,
                        style: `
                            background:${getTimelineItemColor(it)};
                            color:#fff;
                            padding:4px 6px;
                            border-radius:6px;
                            border:${getTimelineItemBorder(it)};
                            margin:2px 0;
                            cursor:pointer;
                            font-weight:600;
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            display:flex;
                            align-items:center;
                        `,
                        title: `${getTimelineItemLabel(it)}\n${formatTimelineRange(it)}${hasDailyMilestones ? `\n${pendingTotalMilestones}/${totalMilestones} 个里程碑` : ''}`
                    }
                });

                // 事项名称
                const nameSpan = pill.createEl("span", { text: `${isSchedule ? "⏱️ " : ""}${it.name}` });
                nameSpan.style.flex = "1";
                nameSpan.style.overflow = "hidden";
                nameSpan.style.textOverflow = "ellipsis";

                if (isSchedule) {
                    const relBtn = pill.createEl("span", { text: " 🔗", attr: { title: "EVA 关联" } });
                    relBtn.onclick = async (event) => {
                        event.stopPropagation();
                        await openTimelineRelationEditor(it.id);
                    };
                }

                // 里程碑徽章（总数）
                if (totalMilestones > 0) {
                    pill.innerHTML += milestoneBadge;
                }

                // 战棋风格里程碑显示行（独立一行，金色外框）
                if (hasDailyMilestones) {
                    displayMilestones.forEach(m => {
                        const isDeadline = isDeadlineMilestone(m);
                        const isOneThird = !!m.isSyntheticOneThird;
                        // 计算里程碑行的样式
                        const rowStyle = `
                            margin-top: 3px;
                            padding: 4px 6px;
                            border: 2px solid ${isOneThird ? '#2f80ed' : (isDeadline ? '#ff1f1f' : '#FFD700')};
                            border-left-width: ${(isDeadline || isOneThird) ? '8px' : '2px'};
                            border-radius: 6px;
                            background: ${isOneThird
                                ? 'linear-gradient(90deg, #0f4aa3 0%, #2f80ed 20%, #5aa6ff 100%)'
                                : (isDeadline ? 'linear-gradient(90deg, #b30000 0%, #ff2d2d 18%, #ff4d4d 100%)' : `${it.color}40`)};
                            cursor: pointer;
                            font-size: 11px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            opacity: ${m.completed ? 0.6 : 1};
                            line-height: 1.4;
                            min-height: 20px;
                            box-shadow: ${isOneThird
                                ? 'inset 0 0 0 1px rgba(255,255,255,0.18), 0 6px 14px rgba(47,128,237,0.28)'
                                : (isDeadline ? 'inset 0 0 0 1px rgba(255,255,255,0.18), 0 6px 14px rgba(255,0,0,0.35)' : 'none')};
                        `;

                        const mileRow = cell.createEl("div", {
                            attr: {
                                style: rowStyle,
                                title: isOneThird
                                    ? `${m.comment || '1/3 节点'}`
                                    : `点击编辑里程碑: ${m.name}`
                            }
                        });
                        mileRow.createEl("span", {
                            text: isOneThird ? "⅓" : (m.completed ? "✅" : "🔲"),
                            attr: { style: "font-size:10px; flex-shrink:0;" }
                        });

                        // 已完成里程碑添加划线效果，移除文字省略限制，显示完整文字
                        const textStyle = `
                            color: ${(isDeadline || isOneThird) ? '#fff' : it.color};
                            font-weight: 600;
                            text-decoration: ${(m.completed && !isOneThird) ? 'line-through' : 'none'};
                            white-space: normal;
                            word-break: break-all;
                            line-height: 1.3;
                        `;

                        const mileText = mileRow.createEl("span", {
                            text: m.name,
                            attr: { style: textStyle }
                        });
                        mileRow.onclick = () => {
                            const targetMilestone = m.sourceMilestone || m;
                            if (targetMilestone?.id) {
                                openMilestoneModal(app, targetMilestone, it, targetMilestone.date, saveMilestone, deleteMilestone);
                            }
                        };
                    });
                }

                pill.onclick = async () => {
                    // 弹出操作选择菜单（点选）
                    const historicalProject = isReadOnlyMandalaOperationalContextItem(it);
                    const action = await pickActionOnce(it, { readOnly: historicalProject });

                    if (action === null) return;

                    if (action === 'weeklyTracking') {
                        await openMandalaWeeklyTrackingFromTimeline(it, { app, Notice });
                    } else if (action === 'history') {
                        new Notice('历史项目时间证据只读保留；它不再是有效操作上下文主键，不能继续分配时间资源。');
                    } else if (action === 'milestone') {
                        // 打开里程碑弹窗
                        openMilestoneModal(app, null, it, dateStr, saveMilestone, deleteMilestone);
                    } else if (action === 'detail') {
                        // 查看详情 - 打开编辑弹窗
                        openEditModalById(it.id);
                    } else if (action === 'timeblock') {
                        // 设置时间块（点选）
                        const currentBlockId = (it.daySlots || {})[dateStr] || null;
                        const blockId = await pickTimeBlockOnce(currentBlockId);
                        if (blockId !== undefined) { // null 表示清除
                            await setBlockForItemOnDate(it.id, dateStr, blockId);
                        }
                    }
                };
            });
        };

        // 渲染时间块行
        TIME_BLOCKS.forEach(block => {
            const row = tbody.createEl("tr");
            row.createEl("td", {
                text: `${block.label}\n${block.range}`,
                attr: {
                    style: "position:sticky; left:0; background:var(--background-secondary); z-index:1; padding:8px; border:1px solid var(--background-modifier-border); white-space:pre;"
                }
            });
            dates.forEach(d => {
                const cell = row.createEl("td", { attr: { style: "vertical-align:top; padding:6px; border:1px solid var(--background-modifier-border);" } });
                renderCellItems(cell, d, block.id);
            });
        });

        // 未分配行
        if (!scheduledOnly) {
            const unRow = tbody.createEl("tr");
            unRow.createEl("td", {
                text: "未分配\n(点击条目设定块)",
                attr: { style: "position:sticky; left:0; background:var(--background-secondary); z-index:1; padding:8px; border:1px solid var(--background-modifier-border); white-space:pre; color:var(--text-muted);" }
            });
            dates.forEach(d => {
                const cell = unRow.createEl("td", { attr: { style: "vertical-align:top; padding:6px; border:1px solid var(--background-modifier-border);" } });
                renderCellItems(cell, d, "__unassigned");
            });
        }
    };

    // ===== 6.5 波形图视图 =====
    const renderWaveView = (container, data) => {
        container.empty();
        const activeRange = getActiveRange();

        // 过滤 + 日期列表
        const filteredItems = data.filter(item => {
            if (isScheduleItem(item)) return false;
            if (!tagMatchesFilter(item.tags, window.timelineTagFilters)) return false;
            if (window.timelineDayblockOnlyScheduled && !itemHasScheduledInRange(item, activeRange.start, activeRange.end)) return false;
            const s = moment(item.startDate);
            const e = moment(item.endDate);
            return e.isSameOrAfter(activeRange.start, "day") && s.isSameOrBefore(activeRange.end, "day");
        });

        if (filteredItems.length === 0) {
            container.createEl("div", {
                text: data.length === 0 ? "📭 暂无事项，点击 [+ 添加事项] 开始记录" : `📭 当前范围或筛选下无事项`,
                attr: { style: "text-align:center; padding:40px; color:#999;" }
            });
            return;
        }

        const dates = [];
        const cursor = activeRange.start.clone();
        while (cursor.isSameOrBefore(activeRange.end, "day")) {
            dates.push(cursor.format("YYYY-MM-DD"));
            cursor.add(1, "day");
        }

        // 计算每日默认顺序：未分配继承昨日，已排块优先
        const dailyOrderMap = buildDailyOrderMap(dates, filteredItems);

        const perDay = {};
        dates.forEach(d => {
            perDay[d] = filteredItems
                .filter(item => moment(d).isBetween(item.startDate, item.endDate, "day", "[]"))
                .sort((a, b) => {
                    const dayOrder = dailyOrderMap[d] || [];
                    const aiOrder = dayOrder.indexOf(a.id);
                    const biOrder = dayOrder.indexOf(b.id);
                    if (aiOrder !== -1 && biOrder !== -1) return aiOrder - biOrder;
                    if (aiOrder !== -1) return -1;
                    if (biOrder !== -1) return 1;
                    const ai = blockIndex(a, d);
                    const bi = blockIndex(b, d);
                    if (ai !== bi) return ai - bi;
                    return (a.name || "").localeCompare(b.name || "");
                });
        });

        const maxRows = Math.max(...dates.map(d => perDay[d].length));
        const rowHeight = 38;
        const leftMargin = 110;
        const topMargin = 10;
        const availableWidth = Math.max(
            0,
            Number(container?.clientWidth) || Number(container?.parentElement?.clientWidth) || 0
        );
        const horizontalPadding = 60;
        const minColWidth = 90;
        const maxColWidth = 220;
        const fitColWidth = dates.length > 0 && availableWidth > leftMargin + horizontalPadding
            ? Math.floor((availableWidth - leftMargin - horizontalPadding) / dates.length)
            : minColWidth;
        const colWidth = Math.max(minColWidth, Math.min(maxColWidth, fitColWidth));
        const widthPx = leftMargin + dates.length * colWidth + 40;
        const heightPx = topMargin + maxRows * rowHeight + 40;

        const waveContainer = container.createEl("div", {
            attr: { style: `overflow:auto; padding:10px; position:relative; width:100%; max-width:100%; box-sizing:border-box;` }
        });

        // Headers
        const headerHeight = 26;
        const headerRow = waveContainer.createEl("div", { attr: { style: `display:flex; margin-left:${leftMargin}px; gap:0; height:${headerHeight}px; width:${dates.length * colWidth}px;` } });
        dates.forEach(d => {
            const isToday = d === moment().format("YYYY-MM-DD");
            headerRow.createEl("div", {
                text: `${moment(d).format("MM/DD")} ${getDayName(d)}`,
                attr: {
                    style: `
                        width:${colWidth}px;
                        text-align:center;
                        font-size:11px;
                        color:${isToday ? 'var(--interactive-accent)' : 'var(--text-muted)'};
                        font-weight:${isToday ? 700 : 500};
                        border-left:1px solid var(--background-modifier-border);
                        padding:4px 0;
                    `
                }
            });
        });

        // 内容包裹层，统一偏移，内部对齐
        const waveWrap = waveContainer.createEl("div", {
            attr: { style: `position:relative; margin-top:${headerHeight + 4}px; width:${widthPx}px; height:${heightPx}px;` }
        });

        // Canvas layer for lines（上层、免遮挡）
        const canvas = waveWrap.createEl("canvas");
        canvas.width = widthPx * 2;  // high DPI
        canvas.height = heightPx * 2;
        canvas.style.width = `${widthPx}px`;
        canvas.style.height = `${heightPx}px`;
        canvas.style.position = "absolute";
        canvas.style.left = "0";
        canvas.style.top = "0";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = 2;
        const ctx = canvas.getContext("2d");
        ctx.scale(2, 2);

        // Bars layer（下层）
        const barsLayer = waveWrap.createEl("div", {
            attr: {
                style: `position:relative; width:${widthPx}px; height:${heightPx}px; z-index:1;`
            }
        });

        // y reference grid
        for (let r = 0; r < maxRows; r++) {
            const line = barsLayer.createEl("div", {
                attr: {
                    style: `
                        position:absolute;
                        left:${leftMargin}px;
                        right:0;
                        top:${topMargin + r * rowHeight}px;
                        height:0;
                        border-top:1px dashed var(--background-modifier-border);
                        pointer-events:none;
                    `
                }
            });
        }

        // store centers per item for polyline
        const centersByItem = {};

        dates.forEach((d, colIdx) => {
            const dayItems = perDay[d];
            dayItems.forEach((item, rowIdx) => {
                const dailyMilestones = getMilestonesForItemDate(item.id, d);
                const deadlineMilestones = dailyMilestones.filter(isDeadlineMilestone);
                const hasDeadlineMilestone = deadlineMilestones.length > 0;
                const top = topMargin + rowIdx * rowHeight;
                const left = leftMargin + colIdx * colWidth;
                const height = rowHeight - 6;
                const width = colWidth - 12;

                const card = barsLayer.createEl("div", {
                    attr: {
                        style: `
                            position:absolute;
                            left:${left}px;
                            top:${top}px;
                            width:${width}px;
                            height:${height}px;
                            background:${hasDeadlineMilestone
                                ? `linear-gradient(135deg, ${item.color} 0%, ${item.color} 58%, #ff3b30 100%)`
                                : item.color};
                            border:${hasDeadlineMilestone ? '2px solid #ff2d2d' : 'none'};
                            border-radius:6px;
                            padding:4px 8px 4px 6px;
                            color:#fff;
                            font-size:11px;
                            font-weight:600;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            cursor:pointer;
                            box-shadow:${hasDeadlineMilestone
                                ? '0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 0 2px rgba(255,45,45,0.18), 0 4px 14px rgba(255,0,0,0.35)'
                                : '0 1px 4px rgba(0,0,0,0.15)'};
                            box-sizing:border-box;
                        `,
                        title: `${item.name}\n${d} • ${getBlockById((item.daySlots||{})[d])?.label || '未分配'}${hasDeadlineMilestone ? `\nDEADLINE: ${deadlineMilestones.map(m => m.name).join(" / ")}` : ''}`
                    }
                });
                if (hasDeadlineMilestone) {
                    card.createEl("div", {
                        attr: {
                            style: `
                                position:absolute;
                                top:4px;
                                right:4px;
                                width:8px;
                                height:8px;
                                border-radius:50%;
                                background:#ff1f1f;
                                box-shadow:0 0 0 2px rgba(255,255,255,0.35), 0 0 10px rgba(255,0,0,0.9);
                                pointer-events:none;
                            `
                        }
                    });
                }
                const nameSpan = card.createEl("span", { text: item.name });
                nameSpan.style.display = "block";
                nameSpan.style.overflow = "hidden";
                nameSpan.style.textOverflow = "ellipsis";
                nameSpan.style.whiteSpace = "nowrap";
                nameSpan.style.paddingRight = hasDeadlineMilestone ? "10px" : "0";
                card.onclick = () => openEditModalById(item.id);

                const center = {
                    x: left + width / 2,
                    y: top + height / 2
                };
                if (!centersByItem[item.id]) centersByItem[item.id] = [];
                centersByItem[item.id].push({ date: d, ...center });
            });
        });

        // draw polylines per item (sorted by date)
        Object.keys(centersByItem).forEach(id => {
            const pts = centersByItem[id].sort((a, b) => a.date.localeCompare(b.date));
            if (pts.length < 2) return;
            ctx.strokeStyle = filteredItems.find(i => i.id === id)?.color || "#999";
            ctx.lineWidth = 2;
            ctx.beginPath();
            pts.forEach((p, idx) => {
                if (idx === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        });

        // legend
        const legend = container.createEl("div", {
            attr: {
                style: "margin-top:12px; padding:10px; background:var(--background-secondary); border-radius:8px; font-size:12px; color:var(--text-muted);"
            }
        });
        legend.innerHTML = `
            <strong>📈 波形图</strong>：按日块顺序自上而下堆叠，每天齐平起始；同事项跨日连线形成波形。点击卡片可编辑。`;
    };

    // ===== 7. 功能函数 =====

    const addItem = async () => {
        const name = await prompt("事项名称", "例如：完成项目报告");
        if (!name) return;

        const startDate = await prompt("开始日期", "YYYY-MM-DD", moment().format("YYYY-MM-DD"));
        if (!startDate) return;

        const endDate = await prompt("结束日期", "YYYY-MM-DD", moment().add(7, 'days').format("YYYY-MM-DD"));
        if (!endDate) return;

        const startTime = normalizeTimelineTime(await prompt("开始时间", "HH:mm", "09:00"), "09:00");
        const endTime = normalizeTimelineTime(await prompt("结束时间", "HH:mm", "18:00"), "18:00");

        const comment = await prompt("备注（可选）", "记录一些说明...", "", true);

        const existingColors = (timelineData.items || []).map(item => item.color);
        const color = getColorForItem(name, existingColors);

        await updateData((data) => {
            data.items = data.items || [];
            data.items.push({
                id: generateId(),
                name: name,
                startDate: startDate,
                endDate: endDate,
                startTime: startTime,
                endTime: endTime,
                kind: "task",
                comment: comment || "",
                color: color,
                tags: [],
                daySlots: {},
                created: moment().format("YYYY-MM-DD HH:mm:ss")
            });
        });

        new Notice("✅ 事项已添加");
    };

    const addItemWithDate = async (defaultDate) => {
        const name = await prompt("事项名称", "例如：完成项目报告");
        if (!name) return;

        const startDate = await prompt("开始日期", "YYYY-MM-DD", defaultDate);
        if (!startDate) return;

        const endDate = await prompt("结束日期", "YYYY-MM-DD", moment(defaultDate).add(1, 'days').format("YYYY-MM-DD"));
        if (!endDate) return;

        const startTime = normalizeTimelineTime(await prompt("开始时间", "HH:mm", "09:00"), "09:00");
        const endTime = normalizeTimelineTime(await prompt("结束时间", "HH:mm", "18:00"), "18:00");

        const comment = await prompt("备注（可选）", "记录一些说明...", "", true);

        const existingColors = (timelineData.items || []).map(item => item.color);
        const color = getColorForItem(name, existingColors);

        await updateData((data) => {
            data.items = data.items || [];
            data.items.push({
                id: generateId(),
                name: name,
                startDate: startDate,
                endDate: endDate,
                startTime: startTime,
                endTime: endTime,
                kind: "schedule",
                comment: comment || "",
                color: color,
                tags: [],
                daySlots: {},
                created: moment().format("YYYY-MM-DD HH:mm:ss")
            });
        });

        new Notice("✅ 事项已添加");
    };

    const importMandalaPlanningTargets = async () => {
        const api = window.__timelinePlannerPluginApi;
        if (typeof api?.importMandalaPlanningTargets !== "function") {
            new Notice("Timeline 导入 API 不可用，请重载插件");
            return;
        }
        const activeRange = getActiveRange();
        const startDate = activeRange.start.format("YYYY-MM-DD");
        const endDate = activeRange.end.format("YYYY-MM-DD");
        const result = await api.importMandalaPlanningTargets({
            sourceTypes: getMandalaImportSourceTypes(),
            startDate,
            endDate: moment().add(1, "month").format("YYYY-MM-DD")
        });
        if (!result?.ok) {
            new Notice(`导入九宫格目标/项目失败：${result?.reason || "unknown"}`);
            console.warn("[Timeline Planner][mandala-import.failed]", result);
            return;
        }
        timelineData = await applyTimelineProjection(await loadRawTimelineData());
        new Notice(`已导入/更新九宫格事项：新增 ${result.importedCount || 0}，更新 ${result.updatedCount || 0}；项目仅来自有效操作上下文主键`);
        renderViewFn?.();
    };

    const switchViewMode = (mode) => {
        window.timelineViewMode = mode;
        renderViewFn();
    };

    const openEditModalById = async (itemId) => {
        const rawData = await loadRawTimelineData();
        const item = (rawData.items || []).find(i => i.id === itemId);
        if (!item) { new Notice("未找到该事项"); return; }
        if (isReadOnlyMandalaOperationalContextItem(item)) {
            new Notice("该目标/项目仅保留历史时间证据，不能再编辑或分配时间资源。");
            return;
        }
        new ItemEditModal(app, item, async (updated) => {
            await updateData((data) => {
                const realIdx = (data.items || []).findIndex(i => i.id === itemId);
                if (realIdx === -1) return;
                if (updated.__delete) {
                    data.items.splice(realIdx, 1);
                    return;
                }
                const editablePatch = {
                    name: updated.name,
                    startDate: updated.startDate,
                    endDate: updated.endDate,
                    startTime: updated.startTime,
                    endTime: updated.endTime,
                    comment: updated.comment,
                    tags: Array.isArray(updated.tags) ? [...updated.tags] : []
                };
                applyTimelineEditablePatchToData(data, itemId, editablePatch);
                ensureDaySlots(data.items[realIdx]);
            });
            new Notice(updated.__delete ? "🗑️ 事项已删除" : "✅ 事项已更新");
        }).open();
    };

    // ===== 8. 主渲染函数 =====

    let renderViewFn = null;

    const renderMainView = async () => {
        if (!engineActive()) return;
        renderEpoch++;
        const mainContainer = container;
        mainContainer.empty();

        const titleDiv = mainContainer.createEl("div", {
            attr: {
                style: "display:flex; justify-content:space-between; align-items:center; padding:20px; border-bottom:2px solid var(--interactive-accent);"
            }
        });

        titleDiv.createEl("h1", { text: "🗓️ Timeline 时间线视图 (Mermaid版)" });

        const controlsDiv = titleDiv.createEl("div", { attr: { style: "display:flex; gap:10px;" } });

        // 视图切换
        const ganttBtn = controlsDiv.createEl("button", {
            text: "📊 Gantt图",
            cls: window.timelineViewMode === "gantt" ? "mod-cta" : ""
        });
        ganttBtn.addEventListener("click", () => switchViewMode("gantt"));

        const calendarBtn = controlsDiv.createEl("button", {
            text: "📅 月历",
            cls: window.timelineViewMode === "calendar" ? "mod-cta" : ""
        });
        calendarBtn.addEventListener("click", () => switchViewMode("calendar"));

        const dayBlockBtn = controlsDiv.createEl("button", {
            text: "🧭 日块矩阵",
            cls: window.timelineViewMode === "dayblock" ? "mod-cta" : ""
        });
        dayBlockBtn.addEventListener("click", () => switchViewMode("dayblock"));

        const waveBtn = controlsDiv.createEl("button", {
            text: "🌊 波形图",
            cls: window.timelineViewMode === "wave" ? "mod-cta" : ""
        });
        waveBtn.addEventListener("click", () => switchViewMode("wave"));

        const scheduledBtn = controlsDiv.createEl("button", {
            text: "仅已排块",
            cls: window.timelineDayblockOnlyScheduled ? "mod-cta" : "",
            attr: { title: "仅显示在当前范围内已安排时间块的事项" }
        });
        scheduledBtn.addEventListener("click", () => {
            window.timelineDayblockOnlyScheduled = !window.timelineDayblockOnlyScheduled;
            renderViewFn();
        });

        const mandalaScope = controlsDiv.createEl("select", {
            attr: { title: "筛选九宫格导入事项；导入按钮也会跟随这个范围" }
        });
        [
            ["all", "九宫格：全部"],
            ["project", "只看项目"],
            ["goal", "只看目标"],
        ].forEach(([value, label]) => {
            const option = mandalaScope.createEl("option", { text: label });
            option.value = value;
            option.selected = getMandalaSourceFilter() === value;
        });
        mandalaScope.addEventListener("change", () => {
            window.timelineMandalaSourceFilter = mandalaScope.value;
            renderViewFn();
        });

        if (!isEmbeddedMode && getMandalaSourceFilter() !== "goal") {
            const historyProjectBtn = controlsDiv.createEl("button", {
                text: getMandalaProjectHistoryVisible() ? "返回有效项目" : "查看历史项目时间安排",
                cls: getMandalaProjectHistoryVisible() ? "mod-warning" : "",
                attr: {
                    title: getMandalaProjectHistoryVisible()
                        ? "回到可继续分配时间资源的有效操作上下文主键"
                        : "只读查看已经退出有效操作上下文主键集合的保留 Timeline 项目"
                }
            });
            historyProjectBtn.addEventListener("click", () => {
                window.timelineMandalaProjectHistoryVisible = !getMandalaProjectHistoryVisible();
                renderViewFn();
            });
        }

        if (!isEmbeddedMode && getMandalaSourceFilter() !== "project") {
            const historyGoalBtn = controlsDiv.createEl("button", {
                text: getMandalaGoalHistoryVisible() ? "返回有效目标" : "查看历史目标时间安排",
                cls: getMandalaGoalHistoryVisible() ? "mod-warning" : "",
                attr: {
                    title: getMandalaGoalHistoryVisible()
                        ? "回到可继续分配时间资源的有效目标操作上下文主键"
                        : "只读查看已经退出有效目标操作上下文主键集合的保留 Timeline 目标"
                }
            });
            historyGoalBtn.addEventListener("click", () => {
                window.timelineMandalaGoalHistoryVisible = !getMandalaGoalHistoryVisible();
                renderViewFn();
            });
        }

        if (getMandalaSourceFilter() !== "goal" && mandalaEffectiveProjectStatus.ok !== true) {
            controlsDiv.createEl("span", {
                text: `项目候选暂不可用，已安全隐藏：${String(mandalaEffectiveProjectStatus.reason || "effective-snapshot-unavailable")}`,
                attr: { style: "color:var(--text-error); font-size:12px; align-self:center;" }
            });
        }
        if (getMandalaSourceFilter() !== "project" && mandalaEffectiveGoalStatus.ok !== true) {
            controlsDiv.createEl("span", {
                text: `目标候选暂不可用，已安全隐藏：${String(mandalaEffectiveGoalStatus.reason || "effective-goal-snapshot-unavailable")}`,
                attr: { style: "color:var(--text-error); font-size:12px; align-self:center;" }
            });
        }

        // 添加事项
        const addBtn = controlsDiv.createEl("button", { text: "+ 添加事项", cls: "mod-cta" });
        addBtn.addEventListener("click", addItem);
        const importMandalaBtn = controlsDiv.createEl("button", {
            text: "导入九宫格目标/项目",
            attr: { title: "目标与项目都只从各自完整的有效操作上下文主键快照读取，并写入 Timeline 自己的事项池" }
        });
        importMandalaBtn.addEventListener("click", importMandalaPlanningTargets);

        // 内容区
        const contentDiv = mainContainer.createEl("div", { attr: { style: "padding:20px;" } });
        const scopedItems = filterItemsByMandalaScope(timelineData.items || []);

        if (window.timelineViewMode === "gantt") {
            await renderMermaidGantt(contentDiv, scopedItems);
            if (!engineActive()) return;
        } else if (window.timelineViewMode === "calendar") {
            renderCalendarView(contentDiv, scopedItems);
        } else if (window.timelineViewMode === "dayblock") {
            renderDayBlockMatrix(contentDiv, scopedItems);

        } else if (window.timelineViewMode === "wave") {
            renderWaveView(contentDiv, scopedItems);
        }
        registerTimelineRelationAdapter();
        restorePendingTimelineRelationFocus();
    };

    const renderEmbeddedView = () => {
        if (!engineActive()) return;
        renderEpoch++;
        const mainContainer = container;
        mainContainer.empty();
        const contentDiv = mainContainer.createEl("div", {
            cls: "timeline-embedded-content",
            attr: { style: "padding:0;" }
        });
        const scopedItems = filterItemsByMandalaEmbeddedScope(timelineData.items || []);
        if (requestedEmbeddedViewMode === "wave") {
            renderWaveView(contentDiv, scopedItems);
        } else {
            renderDayBlockMatrix(contentDiv, scopedItems);
        }
        registerTimelineRelationAdapter();
        restorePendingTimelineRelationFocus();
    };

    const renderWork = isEmbeddedMode ? renderEmbeddedView : renderMainView;
    let rendering = null, pending = false;
    renderViewFn = () => {
        pending = true;
        if (rendering) return rendering;
        rendering = Promise.resolve().then(async () => {
            while (pending && engineActive()) { pending = false; await renderWork(); }
        }).finally(() => { rendering = null; });
        // Event handlers may intentionally ignore the promise; retain rejection for awaiting callers.
        rendering.catch(error => console.error("[Timeline Planner][engine-render-fail]", error));
        return rendering;
    };
    await renderViewFn();

})();
};

module.exports.__test = Object.freeze({
  parseTimelineWorkspaceJumpKey,
  resolveMandalaWeeklyTrackingTarget,
  resolveTimelineMandalaApi,
  openMandalaWeeklyTrackingFromTimeline,
  buildTimelineUiDailyOrderMap,
});
