/*
 * SuperMemo Concept Display engine.
 * Whole-moved from the original DataviewJS source note.
 * Business/UI logic is intentionally preserved; only the Dataview host is adapted.
 */

const { Notice } = require("obsidian");
const moment = window.moment || (() => ({
  format: () => new Date().toISOString().slice(0, 19).replace("T", " ")
}));

module.exports = async function runSuperMemoConceptDisplayEngine(context = {}) {
  const rootContainer = context.container;
  if (!rootContainer) throw new Error("SuperMemo Concept Display requires a container");
  const treeModel = context.conceptTreeModel;
  if (!treeModel) throw new Error("SuperMemo Concept Display requires conceptTreeModel");
  const antinetTreeModel = context.antinetTreeModel;
  if (!antinetTreeModel) throw new Error("SuperMemo Concept Display requires antinetTreeModel");
  const setIcon = typeof context.setIcon === "function" ? context.setIcon : null;
  const cleanupCallbacks = [];
  let activeTreeDialog = null;
  let activeNodeCommentDialog = null;
  const originalWindowRefs = {
    closeEditModal: window.closeEditModal,
    closeCreateModal: window.closeCreateModal,
    saveCreate: window.saveCreate,
    saveEdit: window.saveEdit,
    _smParentSelector: window._smParentSelector,
  };
  cleanupCallbacks.push(() => {
    activeNodeCommentDialog?.close(true);
    activeTreeDialog?.settle(null);
    activeTreeDialog = null;
    const styleEl = document.getElementById("sm-concept-final-v3-styles");
    if (styleEl) styleEl.remove();
    document.querySelectorAll(".sm-modal-overlay").forEach((el) => el.remove());
    for (const [key, value] of Object.entries(originalWindowRefs)) {
      if (value === undefined) delete window[key];
      else window[key] = value;
    }
  });
//=============================================================================
// SuperMemo Concept 索引管理系统 (Obsidian DataviewJS版)
// 核心特性：
// - 展示视图：套圈式展示，不同层级不同颜色，仅显示名称，无计数。
// - 管理视图：GTD风格，支持拖拽调整层级、添加、编辑、删除。仅显示名称。
// - 数据存储：使用 localStorage。
//=============================================================================


// ============ 配置 ============
const STORAGE_KEY = 'supermemo_concepts_final_v3';
const TREE_STORAGE_KEY = 'supermemo_concept_structure_tree_v1';
const TREE_UI_STORAGE_KEY = 'supermemo_concept_structure_tree_ui_v1';
const TREE_TX_STORAGE_KEY = 'supermemo_concept_structure_tree_tx_v1';
const ANTINET_STORAGE_KEY = 'supermemo_antinet_structure_tree_v1';
const ANTINET_UI_STORAGE_KEY = 'supermemo_antinet_structure_tree_ui_v1';
const MEANING_PROJECT_STORAGE_KEY = 'supermemo_antinet_meaning_projects_v1';
const CONCEPT_PAGES_STORAGE_KEY = 'supermemo_concept_pages_v1';
const NODE_COMMENT_DRAFT_PREFIX = 'supermemo_tree_node_comment_draft_v1:';
const conceptPageViewId = treeModel.createId('concept_page_view');
let conceptPageDraft = null;
let conceptPageEditingId = null;
const meaningProjectViewId = antinetTreeModel.createId('meaning_view');
let pendingMeaningMeta = null;
let meaningProjectDraftBuffer = null;
const ANTINET_VIEW_TYPE = 'supermemo-concept-display-antinet';
const ANTINET_NOTE_PATH = 'antinet-framework';
const ANTINET_ADAPTER_ID = 'supermemo-concept-display-antinet-adapter';
const ANTINET_RELATION_VIEW_TYPE = 'keyword-index-plugin';
const ANTINET_META_RELATION_TYPE = 'antinet-keyword-mount';
const ANTINET_LEGACY_RELATION_TYPES = new Set(['引用']);
const ANTINET_MEANING_ALIAS_PATTERN = /^[A-Z][\p{Script=Han}A-Za-z0-9]+$/u;
let antinetViewCache = null;

function getAntinetView(force = false) {
    const api = window.__keywordIndexPluginApi;
    if (!force && antinetViewCache?.store === state.antinetStore && antinetViewCache.api === api
        && antinetViewCache.revision === state.antinetMountRevision) return antinetViewCache.view;
    const view = antinetTreeModel.composeDrawerTree(state.antinetStore, getAntinetMountRelations,
        (mount, budget) => api?.getDrawerProjection?.({ nodeKey: mount.targetNodeKey, ...budget }));
    antinetViewCache = { store: state.antinetStore, api, revision: state.antinetMountRevision, view };
    return view;
}

function antinetBranchCollapsed(node) {
    if (state.antinetUi.collapsedNodeIds.includes(node.id)) return true;
    return node.kind === 'drawer' && !state.antinetUi.expandAllDrawers
        && !state.antinetUi.expandedDrawerIds.includes(node.id);
}

// ============ 颜色配置 ============
const COLORS = {
    yaml: { bg: 'rgba(0, 122, 255, 0.12)', border: 'rgba(0, 122, 255, 0.3)', text: '#007AFF', icon: '◆' },
    plus: { bg: 'rgba(255, 149, 0, 0.12)', border: 'rgba(255, 149, 0, 0.3)', text: '#D47300', icon: '▲' },
    dot:  { bg: 'rgba(142, 68, 173, 0.1)', border: 'rgba(142, 68, 173, 0.25)', text: '#8E44AD', icon: '●' }
};

// ============ 层级颜色配置（用于展示视图）============
const LEVEL_COLORS = {
    1: { bg: 'rgba(100, 149, 237, 0.1)', border: 'rgba(100, 149, 237, 0.35)', shadow: 'rgba(100, 149, 237, 0.15)' },
    2: { bg: 'rgba(46, 204, 113, 0.12)', border: 'rgba(46, 204, 113, 0.4)', shadow: 'rgba(46, 204, 113, 0.15)' },
    3: { bg: 'rgba(155, 89, 182, 0.14)', border: 'rgba(155, 89, 182, 0.45)', shadow: 'rgba(155, 89, 182, 0.15)' },
    4: { bg: 'rgba(230, 126, 34, 0.14)', border: 'rgba(230, 126, 34, 0.45)', shadow: 'rgba(230, 126, 34, 0.15)' },
    5: { bg: 'rgba(233, 30, 99, 0.14)', border: 'rgba(233, 30, 99, 0.45)', shadow: 'rgba(233, 30, 99, 0.15)' },
    6: { bg: 'rgba(0, 188, 212, 0.14)', border: 'rgba(0, 188, 212, 0.45)', shadow: 'rgba(0, 188, 212, 0.15)' },
    7: { bg: 'rgba(255, 193, 7, 0.14)', border: 'rgba(255, 193, 7, 0.45)', shadow: 'rgba(255, 193, 7, 0.15)' },
    8: { bg: 'rgba(63, 81, 181, 0.14)', border: 'rgba(63, 81, 181, 0.45)', shadow: 'rgba(63, 81, 181, 0.15)' },
    9: { bg: 'rgba(121, 85, 72, 0.14)', border: 'rgba(121, 85, 72, 0.45)', shadow: 'rgba(121, 85, 72, 0.15)' },
    10: { bg: 'rgba(255, 64, 129, 0.14)', border: 'rgba(255, 64, 129, 0.45)', shadow: 'rgba(255, 64, 129, 0.15)' },
    11: { bg: 'rgba(0, 150, 136, 0.14)', border: 'rgba(0, 150, 136, 0.45)', shadow: 'rgba(0, 150, 136, 0.15)' },
    12: { bg: 'rgba(103, 58, 183, 0.14)', border: 'rgba(103, 58, 183, 0.45)', shadow: 'rgba(103, 58, 183, 0.15)' }
};

// ============ 样式注入 ============
const styleId = 'sm-concept-final-v3-styles';
const oldStyle = document.getElementById(styleId);
if (oldStyle) oldStyle.remove();

const style = document.createElement('style');
style.id = styleId;
style.textContent = `
    .sm-container {
        font-family: var(--font-text);
        padding: 10px;
        width: 100%;
        box-sizing: border-box;
    }

    /* 图例 */
    .sm-legend { display: flex; flex-wrap: wrap; gap: 12px; padding: 10px; background: var(--background-secondary); border-radius: 8px; margin-bottom: 12px; font-size: 12px; }
    .sm-legend-item { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; }
    .sm-legend-yaml { background: ${COLORS.yaml.bg}; color: ${COLORS.yaml.text}; border-left: 3px solid ${COLORS.yaml.text}; }
    .sm-legend-plus { background: ${COLORS.plus.bg}; color: ${COLORS.plus.text}; border-left: 3px solid ${COLORS.plus.text}; }
    .sm-legend-dot { background: ${COLORS.dot.bg}; color: ${COLORS.dot.text}; border-left: 3px solid ${COLORS.dot.text}; }

    /* 工具栏 */
    .sm-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; padding: 8px; background: var(--background-secondary); border-radius: 6px; }
    .sm-toolbar button { padding: 6px 14px; border: none; border-radius: 4px; background: var(--interactive-accent); color: var(--text-on-accent); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
    .sm-toolbar button:hover { opacity: 0.85; transform: translateY(-1px); }
    .sm-toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .sm-toolbar button.secondary { background: var(--background-modifier-border); color: var(--text-normal); }

    /* 字母导航 */
    .sm-alphabet-nav { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px; }
    .sm-letter-link { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: var(--background-secondary); border-radius: 50%; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.15s; }
    .sm-letter-link:hover { background: var(--interactive-accent); color: var(--text-on-accent); transform: scale(1.1); }

    /* 分组标题 */
    .sm-group-header { margin-top: 16px; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted); font-size: 14px; padding-bottom: 4px; font-weight: 600; }

    /* ============ 展示视图样式（套圈式）============ */
    .sm-nest-container { margin-top: 12px; min-height: 50px; }
    .sm-group-content { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; min-height: 30px; padding: 8px 0; align-items: flex-start; }

    /* 胶囊 - 参考 workspace 的 frame + pill 结构 */
    .sm-capsule {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 10px 10px;
        border: 2px solid var(--sm-frame-border, rgba(52, 152, 219, 0.24));
        border-radius: 16px;
        background: linear-gradient(135deg, var(--sm-frame-bg-strong, rgba(52, 152, 219, 0.10)) 0%, var(--sm-frame-bg-soft, rgba(52, 152, 219, 0.04)) 100%);
        box-shadow: 0 4px 14px var(--sm-frame-shadow, rgba(52, 152, 219, 0.10));
        transition: box-shadow .15s, border-color .15s, transform .15s, background .15s;
        margin: 4px;
        vertical-align: top;
        width: fit-content;
        max-width: 100%;
        min-width: 0;
        flex: 0 1 auto;
        align-self: flex-start;
        position: relative;
    }
    .sm-capsule:hover {
        border-color: var(--sm-frame-border-hover, rgba(52, 152, 219, 0.44));
        box-shadow: 0 8px 18px var(--sm-frame-shadow-hover, rgba(52, 152, 219, 0.14));
        transform: translateY(-1px);
    }
    .sm-capsule.is-leaf {
        padding: 0;
        gap: 0;
        border: none;
        background: transparent;
        box-shadow: none;
    }
    .sm-capsule.is-leaf:hover {
        border: none;
        background: transparent;
        box-shadow: none;
        transform: none;
    }

    .sm-capsule-node {
        display: inline-flex;
        border-radius: 12px;
        position: relative;
        transition: box-shadow 0.15s, transform 0.15s, opacity 0.15s, background 0.15s;
    }
    .sm-capsule-node.drag-over-before::after,
    .sm-capsule-node.drag-over-after::after,
    .sm-capsule-node.drag-over-child::after,
    .sm-mgr-item.drag-over-before::after,
    .sm-mgr-item.drag-over-after::after,
    .sm-mgr-item.drag-over-child::after {
        content: attr(data-drop-label);
        position: absolute;
        left: 50%;
        top: -28px;
        transform: translateX(-50%);
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-radius: 999px;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.14);
        pointer-events: none;
        z-index: 30;
    }
    .sm-capsule-node.drag-over-before::before,
    .sm-capsule-node.drag-over-after::before,
    .sm-capsule-node.drag-over-child::before,
    .sm-mgr-item.drag-over-before::before,
    .sm-mgr-item.drag-over-after::before,
    .sm-mgr-item.drag-over-child::before {
        content: '';
        position: absolute;
        pointer-events: none;
        z-index: 20;
    }
    .sm-capsule-node.drag-over-before {
        box-shadow: inset 4px 0 0 var(--interactive-accent);
    }
    .sm-capsule-node.drag-over-before::before {
        left: -8px;
        top: 5px;
        bottom: 5px;
        width: 5px;
        border-radius: 999px;
        background: var(--interactive-accent);
    }
    .sm-capsule-node.drag-over-after {
        box-shadow: inset -4px 0 0 var(--interactive-accent);
    }
    .sm-capsule-node.drag-over-after::before {
        right: -8px;
        top: 5px;
        bottom: 5px;
        width: 5px;
        border-radius: 999px;
        background: var(--interactive-accent);
    }
    .sm-capsule-node.drag-over-child {
        box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.16);
        background: rgba(var(--interactive-accent-rgb), 0.08);
    }
    .sm-capsule-node.drag-over-child::before {
        inset: -6px;
        border-radius: 16px;
        border: 2px dashed var(--interactive-accent);
        background: rgba(var(--interactive-accent-rgb), 0.06);
    }
    .sm-capsule-node.dragging {
        opacity: 0.48;
        transform: scale(0.98);
    }
    .sm-capsule-row {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        max-width: 100%;
    }
    .sm-capsule-header {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
        border: 1px solid var(--sm-chip-border, var(--background-modifier-border));
        background: var(--sm-chip-bg, var(--background-primary));
        color: var(--sm-chip-fg, var(--text-normal));
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);
        cursor: pointer;
        transition: filter .15s, border-color .15s, transform .15s, background .15s, color .15s;
        max-width: 100%;
    }
    .sm-capsule-header:hover {
        filter: brightness(1.04);
        transform: translateY(-1px);
        border-color: var(--sm-chip-border-hover, var(--sm-chip-border, var(--background-modifier-border)));
        box-shadow: 0 4px 12px var(--sm-frame-shadow, rgba(0,0,0,0.08));
    }
    .sm-capsule.is-collapsed {
        position: relative;
        border-style: dashed;
        border-width: 2px;
        box-shadow: 0 0 0 2px var(--sm-frame-ring, rgba(var(--interactive-accent-rgb), 0.10)), 0 8px 18px var(--sm-frame-shadow-hover, rgba(0, 0, 0, 0.08));
        background: linear-gradient(135deg, var(--sm-frame-bg-strong, rgba(var(--interactive-accent-rgb), 0.08)) 0%, var(--sm-frame-bg-soft, rgba(var(--interactive-accent-rgb), 0.03)) 100%);
    }
    .sm-capsule.is-collapsed::after,
    .sm-mgr-item.is-collapsed::after {
        content: attr(data-collapsed-label);
        position: absolute;
        top: -11px;
        right: 10px;
        background: var(--sm-accent, var(--interactive-accent));
        color: var(--sm-accent-contrast, var(--text-on-accent));
        border-radius: 999px;
        padding: 3px 9px;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        pointer-events: none;
        z-index: 25;
    }
    .sm-capsule.is-collapsed .sm-capsule-header {
        background: var(--sm-chip-bg-strong, var(--sm-chip-bg, rgba(var(--interactive-accent-rgb), 0.10)));
        box-shadow: inset 0 0 0 1px var(--sm-chip-border-hover, rgba(var(--interactive-accent-rgb), 0.18));
    }
    .sm-capsule-icon {
        font-size: 11px;
        flex: 0 0 auto;
    }
    .sm-capsule-label {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .sm-capsule-expand {
        font-size: 10px;
        opacity: 0.76;
        margin-left: 2px;
        cursor: pointer;
        user-select: none;
        padding: 1px 5px;
        border-radius: 999px;
    }
    .sm-capsule-expand:hover {
        background: var(--sm-chip-bg-strong, rgba(255, 255, 255, 0.22));
        opacity: 1;
    }
    .sm-capsule.is-collapsed .sm-capsule-expand {
        opacity: 1;
        background: var(--sm-chip-bg-strong, rgba(var(--interactive-accent-rgb), 0.16));
        color: var(--sm-chip-fg, var(--interactive-accent));
    }
    .sm-capsule-collapsed-badge {
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        padding: 1px 6px;
        border-radius: 999px;
        background: var(--sm-chip-bg-strong, rgba(var(--interactive-accent-rgb), 0.14));
        color: var(--sm-chip-fg, var(--interactive-accent));
        font-size: 10px;
        font-weight: 700;
        line-height: 1.2;
    }
    .sm-capsule-actions {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin-left: 2px;
    }
    .sm-capsule-action {
        font-size: 10px;
        opacity: 0.68;
        cursor: pointer;
        user-select: none;
        padding: 1px 5px;
        border-radius: 999px;
    }
    .sm-capsule-action:hover {
        background: var(--sm-chip-bg-strong, rgba(255, 255, 255, 0.22));
        opacity: 1;
    }
    .sm-capsule-tree-action.is-assigned {
        background: color-mix(in srgb, var(--color-green) 18%, var(--background-primary));
        color: var(--color-green);
        opacity: 1;
    }
    .sm-capsule-tree-badge {
        display: inline-flex;
        align-items: center;
        max-width: 148px;
        overflow: hidden;
        padding: 2px 7px;
        border: 1px solid color-mix(in srgb, var(--color-green) 38%, transparent);
        border-radius: 999px;
        background: color-mix(in srgb, var(--color-green) 14%, var(--background-primary));
        color: var(--text-normal);
        font-size: 9px;
        font-weight: 700;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .sm-capsule-tree-badge.is-archived {
        border-color: color-mix(in srgb, var(--color-orange) 42%, transparent);
        background: color-mix(in srgb, var(--color-orange) 14%, var(--background-primary));
    }
    .sm-capsule-tree-badge.is-missing {
        border-color: color-mix(in srgb, var(--text-error) 46%, transparent);
        background: color-mix(in srgb, var(--text-error) 10%, var(--background-primary));
        color: var(--text-error);
    }
    .sm-capsule-meta {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--text-muted);
        font-size: 11px;
        flex-shrink: 0;
    }
    .sm-capsule-note {
        font-size: 11px;
        opacity: 0.75;
    }

    /* 子胶囊容器 */
    .sm-capsule-children {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
        max-width: 100%;
        margin-top: 8px;
        padding: 8px 6px 2px;
        background: var(--sm-children-bg, rgba(255, 255, 255, 0.28));
        border-radius: 12px;
        align-items: flex-start;
        align-content: flex-start;
    }
    .sm-form-help {
        margin-top: 6px;
        font-size: 11px;
        color: var(--text-muted);
    }
    .sm-display-drop-zone {
        margin: 8px 0 14px;
        padding: 8px 12px;
        border: 1px dashed var(--background-modifier-border);
        border-radius: 12px;
        color: var(--text-muted);
        font-size: 12px;
        text-align: center;
        transition: all 0.2s;
        background: transparent;
    }
    .sm-display-drop-zone.active {
        border-color: var(--interactive-accent);
        background: rgba(var(--interactive-accent-rgb), 0.08);
        color: var(--text-normal);
    }

    /* 统计栏 */
    .sm-stats { font-size: 12px; color: var(--text-muted); padding: 10px; border-top: 1px solid var(--background-modifier-border); margin-top: 16px; }

    /* 空状态 */
    .sm-empty { text-align: center; padding: 40px; color: var(--text-muted); }

    /* ============ 管理视图样式（GTD风格）============ */
    .sm-mgr-container {
        background: var(--background-secondary);
        border-radius: 12px;
        padding: 20px;
        min-height: 500px;
        width: 100%;
        box-sizing: border-box;
    }
    .sm-mgr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--interactive-accent); }
    .sm-mgr-title { font-size: 1.5em; font-weight: 800; color: var(--text-normal); }
    .sm-mgr-stats { display: none; } /* 隐藏统计信息 */
    .sm-mgr-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        margin: 4px 0;
        width: 100%;
        box-sizing: border-box;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        cursor: grab;
        transition: all 0.2s;
        user-select: none;
        position: relative;
    }
    .sm-mgr-item:hover { border-color: var(--interactive-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .sm-mgr-item.drag-over-before { box-shadow: inset 0 3px 0 var(--interactive-accent); }
    .sm-mgr-item.drag-over-before::before {
        left: 10px;
        right: 10px;
        top: -4px;
        height: 4px;
        border-radius: 999px;
        background: var(--interactive-accent);
    }
    .sm-mgr-item.drag-over-after { box-shadow: inset 0 -3px 0 var(--interactive-accent); }
    .sm-mgr-item.drag-over-after::before {
        left: 10px;
        right: 10px;
        bottom: -4px;
        height: 4px;
        border-radius: 999px;
        background: var(--interactive-accent);
    }
    .sm-mgr-item.drag-over-child { border-color: var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.1); }
    .sm-mgr-item.drag-over-child::before {
        inset: -4px;
        border-radius: 10px;
        border: 2px dashed var(--interactive-accent);
        background: rgba(var(--interactive-accent-rgb), 0.04);
    }
    .sm-mgr-item.dragging { opacity: 0.5; transform: scale(0.98); }
    .sm-mgr-item.is-collapsed {
        border-style: dashed;
        border-width: 2px;
        background: linear-gradient(135deg, var(--background-primary) 0%, rgba(var(--interactive-accent-rgb), 0.08) 100%);
        box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.08), 0 8px 18px rgba(0, 0, 0, 0.06);
    }
    .sm-mgr-item-toggle {
        width: 26px;
        height: 26px;
        margin-right: 8px;
        border: none;
        border-radius: 7px;
        background: var(--background-secondary);
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        flex: 0 0 26px;
        transition: background 0.15s, color 0.15s, transform 0.15s;
    }
    .sm-mgr-item-toggle:hover {
        background: var(--background-modifier-hover);
        color: var(--text-normal);
    }
    .sm-mgr-item-toggle.is-placeholder {
        cursor: default;
        opacity: 0.35;
    }
    .sm-mgr-item-toggle.is-placeholder:hover {
        background: var(--background-secondary);
        color: var(--text-muted);
    }
    .sm-mgr-item-icon { font-size: 1.2em; margin-right: 10px; width: 28px; text-align: center; }
    .sm-mgr-item-info { flex: 1; }
    .sm-mgr-item-label { font-weight: 600; color: var(--text-normal); }
    .sm-mgr-item-state {
        margin-top: 4px;
        font-size: 11px;
        font-weight: 700;
        color: var(--interactive-accent);
    }
    /* 管理视图：移除 meta/统计信息 */
    .sm-mgr-item-meta { display: none; }
    .sm-mgr-item-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; }
    .sm-mgr-item:hover .sm-mgr-item-actions { opacity: 1; }
    .sm-mgr-item-btn { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); cursor: pointer; font-size: 12px; transition: all 0.2s; }
    .sm-mgr-item-btn:hover { background: var(--interactive-accent); color: white; border-color: transparent; }
    .sm-mgr-item-btn.delete:hover { background: #e74c3c; }
    .sm-mgr-children {
        margin-left: 30px;
        border-left: 2px solid var(--background-modifier-border);
        padding-left: 10px;
        width: calc(100% - 30px);
        box-sizing: border-box;
    }

    /* 拖放区 */
    .sm-mgr-drop-zone {
        height: 30px;
        width: 100%;
        box-sizing: border-box;
        border: 2px dashed transparent;
        border-radius: 6px;
        margin: 4px 0;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 0.85em;
    }
    .sm-mgr-drop-zone.active { border-color: var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.05); }
    .sm-mgr-drop-zone.active::before { content: "拖放到此处设为顶层"; }

    /* 编辑表单和模态框样式保持不变，以便编辑操作 */
    .sm-form { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 15px; margin-bottom: 15px; display: none; }
    .sm-form.visible { display: block; }
    .sm-form-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
    .sm-form-label { width: 60px; font-weight: 500; color: var(--text-muted); font-size: 0.9em; }
    .sm-form-input { flex: 1; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-secondary); color: var(--text-normal); font-size: 14px; }
    input[type="color"].sm-form-input { flex: 0 0 72px; width: 72px; min-width: 72px; padding: 4px; cursor: pointer; }
    .sm-form-input:focus { outline: none; border-color: var(--interactive-accent); }
    .sm-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .sm-modal { width: min(860px, 92vw); max-height: 85vh; background: var(--background-primary); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column; }
    .sm-modal-header { padding: 14px 16px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
    .sm-modal-footer { padding: 12px; text-align: center; border-top: 1px solid var(--background-modifier-border); }
    .sm-modal-footer button { border: none; background: none; color: var(--interactive-accent); font-size: 14px; cursor: pointer; font-weight: 500; }
    .sm-modal-body { padding: 16px; }
    .sm-note-textarea { width: 100%; min-height: 380px; padding: 10px 12px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-secondary); color: var(--text-normal); font-size: 14px; resize: vertical; }
    .sm-note-textarea:focus { outline: none; border-color: var(--interactive-accent); }
    .sm-note-count { margin-top: 6px; font-size: 11px; color: var(--text-muted); text-align: right; }
    .sm-capsule-note { font-size: 11px; opacity: 0.75; }
    .sm-parent-selector { position: relative; flex: 1; }
    .sm-parent-input-wrapper { display: flex; align-items: center; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-secondary); overflow: hidden; }
    .sm-parent-input-wrapper:focus-within { border-color: var(--interactive-accent); }
    .sm-parent-input { flex: 1; padding: 8px 12px; border: none; background: transparent; color: var(--text-normal); font-size: 14px; outline: none; }
    .sm-parent-clear { padding: 0 8px; cursor: pointer; color: var(--text-muted); }
    .sm-parent-clear:hover { color: var(--text-normal); }
    .sm-parent-dropdown { position: absolute; top: 100%; left: 0; right: 0; max-height: 250px; overflow-y: auto; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-top: none; border-radius: 0 0 6px 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100; display: none; }
    .sm-parent-dropdown.visible { display: block; }
    .sm-parent-option { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; transition: background 0.1s; }
    .sm-parent-option:hover, .sm-parent-option.highlighted { background: var(--background-modifier-hover); }
    .sm-parent-option.selected { background: rgba(var(--interactive-accent-rgb), 0.1); color: var(--interactive-accent); }
    .sm-parent-empty { padding: 8px 12px; color: var(--text-faint); font-size: 12px; }
    .sm-parent-stats { padding: 6px 12px; font-size: 11px; color: var(--text-faint); border-top: 1px solid var(--background-modifier-border); background: var(--background-secondary); }

    .sm-keyword-panel { margin: 0 0 12px; padding: 10px; border: 1px solid rgba(var(--interactive-accent-rgb), 0.22); border-radius: 10px; background: rgba(var(--interactive-accent-rgb), 0.05); }
    .sm-keyword-panel-title { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    .sm-keyword-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .sm-keyword-chip { border: 1px solid rgba(var(--interactive-accent-rgb), 0.28); border-radius: 999px; padding: 4px 10px; background: var(--background-primary); color: var(--text-normal); cursor: pointer; font-size: 12px; }
    .sm-keyword-chip:hover { background: rgba(var(--interactive-accent-rgb), 0.12); transform: translateY(-1px); }
    .sm-keyword-empty { color: var(--text-faint); font-size: 12px; }
    .sm-keyword-textarea { min-height: 96px; resize: vertical; font-family: var(--font-text); line-height: 1.5; }
    .sm-capsule.sm-keyword-reveal { box-shadow: 0 0 0 4px rgba(var(--interactive-accent-rgb), 0.20), 0 10px 28px rgba(0,0,0,0.18); animation: sm-keyword-reveal-pulse 900ms ease-in-out 0s 3; }
    @keyframes sm-keyword-reveal-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.025); } 100% { transform: scale(1); } }
`;
document.head.appendChild(style);

// ============ 全局状态 ============
if (!window._smConceptIndex) {
    window._smConceptIndex = {
        concepts: {},      // { id: { id, keyword, parentId, order, colorType, createdAt } }
        conceptKeywordIndex: {},
        managerMode: false,
        dragId: null,
        collapsedIds: {},
        activeSurface: 'capsules',
        treeStore: treeModel.createEmptyTreeStore(),
        treeReadOnly: false,
        treeErrors: [],
        treeUi: {},
        pendingTreeTx: null,
        conceptLoadError: null,
        conceptSourceRaw: null,
        pendingTreeReveal: null,
        pendingConceptCapsuleReveal: null,
        antinetStore: antinetTreeModel.createEmptyAntinetStore(),
        antinetReadOnly: false,
        antinetErrors: [],
        antinetUi: {},
        antinetMetaState: null,
        antinetMountRevision: 0,
        antinetMeaningSearch: '',
        pendingAntinetMeaningReveal: null,
        pendingAntinetMountReveal: null
    };
}
const state = window._smConceptIndex;
if (!state.collapsedIds) state.collapsedIds = {};
if (!state.conceptKeywordIndex || typeof state.conceptKeywordIndex !== 'object') state.conceptKeywordIndex = {};
if (!state.treeStore || typeof state.treeStore !== 'object') state.treeStore = treeModel.createEmptyTreeStore();
if (!state.treeUi || typeof state.treeUi !== 'object') state.treeUi = {};
if (!state.antinetStore || typeof state.antinetStore !== 'object') state.antinetStore = antinetTreeModel.createEmptyAntinetStore();
if (!state.antinetUi || typeof state.antinetUi !== 'object') state.antinetUi = {};
if (typeof state.antinetMeaningSearch !== 'string') state.antinetMeaningSearch = '';
state.pendingConceptCapsuleReveal = null;

// ============ 数据管理 ============

function normalizeConceptAccentColor(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(prefixed)) return prefixed.toLowerCase();
    return '';
}

function expandHexColor(hexColor) {
    const normalized = normalizeConceptAccentColor(hexColor);
    if (!normalized) return '';
    return normalized.length === 4
        ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
        : normalized;
}

function withHexAlpha(hexColor, alphaHex) {
    const expanded = expandHexColor(hexColor);
    if (!expanded) return '';
    return `${expanded}${String(alphaHex || '').trim()}`;
}

function getReadableTextColor(hexColor) {
    const full = expandHexColor(hexColor);
    if (!full) return 'var(--text-on-accent)';
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
    return luminance >= 150 ? '#1f2328' : '#ffffff';
}

function getConceptVisual(concept, level = 1) {
    const colorType = concept.colorType || (concept.parentId ? 'plus' : 'yaml');
    const semanticColor = COLORS[colorType] || COLORS.yaml;
    const displayLevel = Math.min(level, 12);
    const levelColor = LEVEL_COLORS[displayLevel] || LEVEL_COLORS[12];
    const accent = normalizeConceptAccentColor(concept.accentColor || '') || semanticColor.text;

    return {
        colorType,
        semanticColor,
        accent,
        accentContrast: getReadableTextColor(accent),
        displayLevel,
        levelColor
    };
}

function loadData() {
    state.conceptLoadError = null;
    state.conceptSourceRaw = null;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            state.concepts = {};
            state.conceptKeywordIndex = {};
            return;
        }
        const loadedData = JSON.parse(saved);
        if (!loadedData || typeof loadedData !== 'object' || Array.isArray(loadedData)
            || !loadedData.concepts || typeof loadedData.concepts !== 'object' || Array.isArray(loadedData.concepts)) {
            throw Object.assign(new Error('共享 Concept 数据根结构无效。'), { code: 'CONCEPT_ROOT_INVALID' });
        }
        state.conceptSourceRaw = saved;
        state.concepts = loadedData.concepts || {};
        state.conceptKeywordIndex = sanitizeConceptKeywordIndex(loadedData.conceptKeywordIndex || {});
        Object.values(state.concepts).forEach(c => {
            const numericOrder = Number(c.order);
            c.order = Number.isFinite(numericOrder) ? numericOrder : 0;
            if (!c.colorType) c.colorType = c.parentId ? 'plus' : 'yaml';
            c.accentColor = normalizeConceptAccentColor(c.accentColor || '');
            if (!c.sortLetter) c.sortLetter = getSortLetter(c.keyword || '');
            if (typeof c.note !== 'string') c.note = '';
        });
        const ids = new Set(Object.keys(state.concepts));
        Object.values(state.concepts).forEach(c => {
            if (c.parentId && !ids.has(c.parentId)) c.parentId = null;
        });
        normalizeAllConceptOrders();
    } catch (e) {
        console.error('[SuperMemo Concept Display][concept-load-rejected]', {
            code: e?.code || 'CONCEPT_PARSE_FAILED',
            message: e?.message || String(e)
        });
        state.concepts = {};
        state.conceptKeywordIndex = {};
        state.conceptLoadError = {
            code: e?.code || 'CONCEPT_PARSE_FAILED',
            message: e?.message || String(e)
        };
    }
}

function assertConceptSaveAllowed(deleteTx = null) {
    if (localStorage.getItem(STORAGE_KEY) !== state.conceptSourceRaw) {
        throw Object.assign(new Error('其他视图已更新胶囊，请保留输入并重新打开视图后操作。'), { code: 'CONCEPT_SAVE_CAS_CONFLICT' });
    }
    const txRaw = localStorage.getItem(TREE_TX_STORAGE_KEY);
    if (deleteTx) {
        const live = txRaw ? treeModel.normalizeTreeTransaction(JSON.parse(txRaw)) : null;
        if (!live || live.readOnly || live.transaction?.type !== 'concept-delete'
            || JSON.stringify(live.transaction) !== JSON.stringify(deleteTx)
            || JSON.stringify(state.pendingTreeTx) !== JSON.stringify(deleteTx)
            || getConceptStableId(freshConceptPageRoot().concepts[deleteTx.conceptId]) !== deleteTx.stableId) {
            throw new Error('删除事务或胶囊身份已变化，保存已阻止。');
        }
    } else if (txRaw != null || state.pendingTreeTx) {
        throw new Error('存在未完成事务，请先恢复；输入已保留。');
    }
}

async function saveData(deleteTx = null) {
    try { assertConceptSaveAllowed(deleteTx); }
    catch (error) { new Notice(error.message); throw error; }
    if (state.conceptLoadError) {
        throw Object.assign(new Error('共享 Concept 数据处于只读保护，未执行写入。'), { code: 'CONCEPT_STORE_READ_ONLY' });
    }
    normalizeAllConceptOrders();
    state.conceptKeywordIndex = sanitizeConceptKeywordIndex(state.conceptKeywordIndex || {});

    const json = {
        concepts: state.concepts,
        conceptKeywordIndex: state.conceptKeywordIndex,
        version: "1.0",
        lastModified: moment().format("YYYY-MM-DD HH:mm:ss"),
        metadata: {
            total: Object.keys(state.concepts).length,
            topLevel: Object.values(state.concepts).filter(c => !c.parentId).length,
            keywords: Object.keys(state.conceptKeywordIndex || {}).length
        }
    };
    const serialized = JSON.stringify(json);
    localStorage.setItem(STORAGE_KEY, serialized);
    const readback = localStorage.getItem(STORAGE_KEY);
    if (readback !== serialized) {
        throw Object.assign(new Error('共享 Concept 数据写入后回读不一致。'), { code: 'CONCEPT_READBACK_MISMATCH' });
    }
    JSON.parse(readback);
    state.conceptSourceRaw = readback;
}

function normalizeTreeUi(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const zoom = Number(source.zoom);
    const viewportLeft = Number(source.viewportLeft);
    const viewportTop = Number(source.viewportTop);
    return {
        activeSurface: ['tree', 'antinet', 'meanings'].includes(source.activeSurface) ? source.activeSurface : 'capsules',
        selectedNodeId: source.selectedNodeId ? String(source.selectedNodeId) : null,
        selectedConceptId: source.selectedConceptId ? String(source.selectedConceptId) : null,
        conceptPageId: typeof source.conceptPageId === 'string' ? source.conceptPageId : 'default',
        conceptTreeAssignedOnly: source.conceptTreeAssignedOnly === true,
        collapsedNodeIds: Array.from(new Set(Array.isArray(source.collapsedNodeIds)
            ? source.collapsedNodeIds.map(value => String(value || '')).filter(Boolean)
            : [])),
        zoom: Number.isFinite(zoom) ? Math.min(1.6, Math.max(0.55, zoom)) : 1,
        viewportLeft: Number.isFinite(viewportLeft) ? Math.max(0, Math.min(10000000, viewportLeft)) : 0,
        viewportTop: Number.isFinite(viewportTop) ? Math.max(0, Math.min(10000000, viewportTop)) : 0,
        search: typeof source.search === 'string' ? source.search.slice(0, 200) : '',
        showArchive: source.showArchive === true
    };
}

function normalizeAntinetUi(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const zoom = Number(source.zoom);
    const viewportLeft = Number(source.viewportLeft);
    const viewportTop = Number(source.viewportTop);
    return {
        selectedNodeId: source.selectedNodeId ? String(source.selectedNodeId) : null,
        selectedRelationId: source.selectedRelationId ? String(source.selectedRelationId) : null,
        expandedDrawerIds: Array.isArray(source.expandedDrawerIds) ? source.expandedDrawerIds.filter(v => typeof v === 'string') : [],
        expandAllDrawers: source.expandAllDrawers === true,
        meaningProjectId: typeof source.meaningProjectId === 'string' ? source.meaningProjectId : 'default',
        collapsedNodeIds: Array.from(new Set(Array.isArray(source.collapsedNodeIds)
            ? source.collapsedNodeIds.map(value => String(value || '')).filter(Boolean)
            : [])),
        zoom: Number.isFinite(zoom) ? Math.min(1.6, Math.max(0.55, zoom)) : 1,
        viewportLeft: Number.isFinite(viewportLeft) ? Math.max(0, Math.min(10000000, viewportLeft)) : 0,
        viewportTop: Number.isFinite(viewportTop) ? Math.max(0, Math.min(10000000, viewportTop)) : 0,
        search: typeof source.search === 'string' ? source.search.slice(0, 200) : '',
    };
}

function loadTreeStores() {
    state.treeReadOnly = false;
    state.treeErrors = [];
    try {
        const raw = localStorage.getItem(TREE_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const normalized = treeModel.normalizeTreeStore(parsed);
        state.treeStore = normalized.store;
        state.treeReadOnly = normalized.readOnly;
        state.treeErrors = normalized.errors || [];
    } catch (error) {
        state.treeStore = treeModel.createEmptyTreeStore();
        state.treeReadOnly = true;
        state.treeErrors = ['TREE_PARSE_FAILED'];
        console.error('[SuperMemo Concept Display][tree-load-rejected]', {
            code: 'TREE_PARSE_FAILED',
            message: error?.message || String(error)
        });
    }
    try {
        const rawUi = localStorage.getItem(TREE_UI_STORAGE_KEY);
        state.treeUi = normalizeTreeUi(rawUi ? JSON.parse(rawUi) : null);
    } catch (error) {
        state.treeUi = normalizeTreeUi(null);
        console.warn('[SuperMemo Concept Display][tree-ui-load-rejected]', {
            code: 'TREE_UI_PARSE_FAILED',
            message: error?.message || String(error)
        });
    }
    state.activeSurface = state.treeUi.activeSurface;
    try {
        const rawTx = localStorage.getItem(TREE_TX_STORAGE_KEY);
        const parsedTx = rawTx ? JSON.parse(rawTx) : null;
        const normalizedTx = treeModel.normalizeTreeTransaction(parsedTx);
        state.pendingTreeTx = normalizedTx.readOnly
            ? {
                schemaVersion: 1,
                type: 'invalid',
                stage: 'validation-failed',
                errors: normalizedTx.errors,
                rawPresent: rawTx != null
            }
            : normalizedTx.transaction;
    } catch (error) {
        state.pendingTreeTx = {
            schemaVersion: 1,
            type: 'invalid',
            stage: 'parse-failed',
            lastError: error?.message || String(error),
            errors: ['TREE_TX_PARSE_FAILED'],
            rawPresent: true
        };
        console.error('[SuperMemo Concept Display][tree-tx-load-rejected]', {
            code: 'TREE_TX_PARSE_FAILED',
            message: error?.message || String(error)
        });
    }
    loadAntinetStores();
}

function loadAntinetStores() {
    state.antinetReadOnly = false;
    state.antinetErrors = [];
    try {
        const raw = localStorage.getItem(ANTINET_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const normalized = antinetTreeModel.normalizeAntinetStore(parsed);
        state.antinetStore = normalized.store;
        state.antinetReadOnly = normalized.readOnly;
        state.antinetErrors = normalized.errors || [];
    } catch (error) {
        state.antinetStore = antinetTreeModel.createEmptyAntinetStore();
        state.antinetReadOnly = true;
        state.antinetErrors = ['ANTINET_PARSE_FAILED'];
        console.error('[SuperMemo Concept Display][antinet-load-rejected]', {
            code: 'ANTINET_PARSE_FAILED',
            message: error?.message || String(error)
        });
    }
    try {
        const rawUi = localStorage.getItem(ANTINET_UI_STORAGE_KEY);
        state.antinetUi = normalizeAntinetUi(rawUi ? JSON.parse(rawUi) : null);
    } catch (error) {
        state.antinetUi = normalizeAntinetUi(null);
        console.warn('[SuperMemo Concept Display][antinet-ui-load-rejected]', {
            code: 'ANTINET_UI_PARSE_FAILED',
            message: error?.message || String(error)
        });
    }
}

function persistTreeUi(patch = {}) {
    state.treeUi = normalizeTreeUi({ ...state.treeUi, ...patch });
    state.activeSurface = state.treeUi.activeSurface;
    try {
        const serialized = JSON.stringify(state.treeUi);
        localStorage.setItem(TREE_UI_STORAGE_KEY, serialized);
        if (localStorage.getItem(TREE_UI_STORAGE_KEY) !== serialized) {
            throw new Error('UI state readback mismatch');
        }
    } catch (error) {
        console.warn('[SuperMemo Concept Display][tree-ui-save-failed]', {
            code: 'TREE_UI_SAVE_FAILED',
            message: error?.message || String(error)
        });
    }
}

function persistAntinetUi(patch = {}) {
    state.antinetUi = normalizeAntinetUi({ ...state.antinetUi, ...patch });
    try {
        const serialized = JSON.stringify(state.antinetUi);
        localStorage.setItem(ANTINET_UI_STORAGE_KEY, serialized);
        if (localStorage.getItem(ANTINET_UI_STORAGE_KEY) !== serialized) throw new Error('Antinet UI state readback mismatch');
    } catch (error) {
        console.warn('[SuperMemo Concept Display][antinet-ui-save-failed]', {
            code: 'ANTINET_UI_SAVE_FAILED',
            message: error?.message || String(error)
        });
    }
}

function readCurrentAntinetStore() {
    const raw = localStorage.getItem(ANTINET_STORAGE_KEY);
    const normalized = antinetTreeModel.normalizeAntinetStore(raw ? JSON.parse(raw) : null);
    if (normalized.readOnly) {
        throw Object.assign(new Error(normalized.errors.join(', ') || 'Antinet store is read-only'), {
            code: 'ANTINET_STORE_READ_ONLY',
            details: normalized.errors
        });
    }
    return normalized.store;
}

function assertAntinetMutationAllowed() {
    if (state.antinetReadOnly) {
        throw Object.assign(new Error('Antinet 框架处于只读保护。'), {
            code: 'ANTINET_STORE_READ_ONLY',
            details: state.antinetErrors
        });
    }
}

function commitAntinetCandidate(candidate, expectedRevision, source) {
    const current = readCurrentAntinetStore();
    if (Number(current.revision) !== Number(expectedRevision)) {
        state.antinetStore = current;
        throw Object.assign(new Error('Antinet 框架已被另一视图更新，请重试。'), {
            code: 'ANTINET_REVISION_CONFLICT',
            expectedRevision,
            actualRevision: current.revision
        });
    }
    if (Number(candidate.revision) !== Number(expectedRevision) + 1) {
        throw Object.assign(new Error('Antinet 候选 revision 无效。'), { code: 'ANTINET_CANDIDATE_REVISION_INVALID' });
    }
    const errors = antinetTreeModel.validateAntinetStore(candidate);
    if (errors.length) throw Object.assign(new Error(errors.join(', ')), { code: 'ANTINET_CANDIDATE_INVALID', details: errors });
    const serialized = JSON.stringify(candidate);
    localStorage.setItem(ANTINET_STORAGE_KEY, serialized);
    if (localStorage.getItem(ANTINET_STORAGE_KEY) !== serialized) throw new Error('Antinet store readback mismatch');
    const verified = antinetTreeModel.normalizeAntinetStore(JSON.parse(serialized));
    if (verified.readOnly || Number(verified.store.revision) !== Number(candidate.revision)) {
        throw Object.assign(new Error('Antinet 框架回读验证失败。'), { code: 'ANTINET_READBACK_INVALID', details: verified.errors });
    }
    state.antinetStore = verified.store;
    console.info('[SuperMemo Concept Display][antinet-commit]', {
        source,
        revision: verified.store.revision,
        nodeCount: Object.keys(verified.store.nodesById || {}).length,
        presentationCount: Object.keys(verified.store.mountPresentationByRelationId || {}).length
    });
    return verified.store;
}

function commitAntinetMutation(mutator, source) {
    assertAntinetMutationAllowed();
    const current = readCurrentAntinetStore();
    const candidate = mutator(antinetTreeModel.deepClone(current));
    return commitAntinetCandidate(candidate, current.revision, source);
}

function readCurrentTreeStore() {
    const raw = localStorage.getItem(TREE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const normalized = treeModel.normalizeTreeStore(parsed);
    if (normalized.readOnly) {
        throw Object.assign(new Error(normalized.errors.join(', ') || 'Tree store is read-only'), {
            code: 'TREE_STORE_READ_ONLY',
            details: normalized.errors
        });
    }
    return normalized.store;
}

function assertTreeMutationAllowed(source) {
    if (state.conceptLoadError) {
        throw Object.assign(new Error('共享 Concept 数据异常，树结构写入已锁定。'), { code: 'CONCEPT_STORE_READ_ONLY' });
    }
    if (state.treeReadOnly) {
        throw Object.assign(new Error('主体结构树处于只读保护。'), { code: 'TREE_STORE_READ_ONLY', details: state.treeErrors });
    }
    if (state.pendingTreeTx) {
        throw Object.assign(new Error('存在未完成事务，请先在顶部完成恢复。'), {
            code: 'TREE_TRANSACTION_PENDING',
            txId: state.pendingTreeTx.txId,
            source
        });
    }
}

function commitTreeCandidate(candidate, expectedRevision, source) {
    const current = readCurrentTreeStore();
    if (Number(current.revision) !== Number(expectedRevision)) {
        state.treeStore = current;
        throw Object.assign(new Error('主体结构树已被另一视图更新，请重试。'), {
            code: 'TREE_REVISION_CONFLICT',
            expectedRevision,
            actualRevision: current.revision
        });
    }
    if (Number(candidate.revision) !== Number(expectedRevision) + 1) {
        throw Object.assign(new Error('主体结构树候选 revision 无效。'), { code: 'TREE_CANDIDATE_REVISION_INVALID' });
    }
    const errors = treeModel.validateTreeStore(candidate);
    if (errors.length) {
        throw Object.assign(new Error(errors.join(', ')), { code: 'TREE_CANDIDATE_INVALID', details: errors });
    }
    const serialized = JSON.stringify(candidate);
    localStorage.setItem(TREE_STORAGE_KEY, serialized);
    const readback = localStorage.getItem(TREE_STORAGE_KEY);
    if (readback !== serialized) {
        throw Object.assign(new Error('主体结构树写入后回读不一致。'), { code: 'TREE_READBACK_MISMATCH' });
    }
    const verified = treeModel.normalizeTreeStore(JSON.parse(readback));
    if (verified.readOnly || Number(verified.store.revision) !== Number(candidate.revision)) {
        throw Object.assign(new Error('主体结构树回读验证失败。'), {
            code: 'TREE_READBACK_INVALID',
            details: verified.errors
        });
    }
    state.treeStore = verified.store;
    console.info('[SuperMemo Concept Display][tree-commit]', {
        source,
        revision: verified.store.revision,
        nodeCount: Object.keys(verified.store.nodesById || {}).length,
        assignmentCount: Object.keys(verified.store.conceptAssignments || {}).length
    });
    return verified.store;
}

function commitTreeMutation(mutator, source, options = {}) {
    if (!options.allowPendingTx) assertTreeMutationAllowed(source);
    const expectedRevision = Number(state.treeStore.revision || 0);
    const candidate = mutator(treeModel.deepClone(state.treeStore));
    return commitTreeCandidate(candidate, expectedRevision, source);
}

function persistPendingTransaction(transaction) {
    const normalized = treeModel.normalizeTreeTransaction(transaction);
    if (normalized.readOnly || !normalized.transaction) {
        throw Object.assign(new Error(normalized.errors.join(', ') || '事务候选无效。'), {
            code: 'TREE_TX_CANDIDATE_INVALID',
            details: normalized.errors
        });
    }
    const serialized = JSON.stringify(normalized.transaction);
    localStorage.setItem(TREE_TX_STORAGE_KEY, serialized);
    if (localStorage.getItem(TREE_TX_STORAGE_KEY) !== serialized) {
        throw Object.assign(new Error('事务记录回读不一致。'), { code: 'TREE_TX_READBACK_MISMATCH' });
    }
    state.pendingTreeTx = normalized.transaction;
}

function clearPendingTransaction() {
    localStorage.removeItem(TREE_TX_STORAGE_KEY);
    if (localStorage.getItem(TREE_TX_STORAGE_KEY) != null) {
        throw Object.assign(new Error('事务记录未能清除。'), { code: 'TREE_TX_CLEAR_FAILED' });
    }
    state.pendingTreeTx = null;
}

function validateConceptTreeConsistency(concepts, treeStore) {
    const errors = [];
    const conceptMap = concepts && typeof concepts === 'object' && !Array.isArray(concepts) ? concepts : {};
    const conceptIds = new Set(Object.keys(conceptMap));
    const stableToConcept = new Map();
    Object.entries(conceptMap).forEach(([conceptId, concept]) => {
        const parentId = concept?.parentId ? String(concept.parentId) : null;
        if (parentId && !conceptIds.has(parentId)) errors.push(`CONCEPT_PARENT_MISSING:${conceptId}:${parentId}`);
        if (parentId === conceptId) errors.push(`CONCEPT_SELF_PARENT:${conceptId}`);
        const stableId = getConceptStableId(concept);
        if (!stableId) return;
        if (stableToConcept.has(stableId)) errors.push(`CONCEPT_STABLE_ID_DUPLICATE:${stableId}`);
        else stableToConcept.set(stableId, conceptId);
    });
    conceptIds.forEach(startId => {
        const visited = new Set();
        let cursor = startId;
        while (cursor) {
            if (visited.has(cursor)) {
                errors.push(`CONCEPT_CYCLE:${startId}`);
                break;
            }
            visited.add(cursor);
            cursor = conceptMap[cursor]?.parentId ? String(conceptMap[cursor].parentId) : null;
        }
    });
    Object.keys(treeStore?.conceptAssignments || {}).forEach(stableId => {
        if (!stableToConcept.has(stableId)) errors.push(`ASSIGNMENT_CONCEPT_MISSING:${stableId}`);
    });
    return Array.from(new Set(errors));
}

function clearInvalidTransactionLock() {
    if (state.pendingTreeTx?.type !== 'invalid') return false;
    if (state.conceptLoadError || state.treeReadOnly) {
        new Notice('业务数据仍处于只读保护，不能解除事务锁。');
        return false;
    }
    try {
        const rawConcept = localStorage.getItem(STORAGE_KEY);
        const rawTree = localStorage.getItem(TREE_STORAGE_KEY);
        const rawTx = localStorage.getItem(TREE_TX_STORAGE_KEY);
        const authoritativeConcepts = rawConcept ? parseSharedConceptRoot(rawConcept).concepts : {};
        const currentTree = treeModel.normalizeTreeStore(rawTree ? JSON.parse(rawTree) : null);
        if (currentTree.readOnly) throw Object.assign(new Error(currentTree.errors.join(', ')), { code: 'TREE_STORE_READ_ONLY' });
        const consistencyErrors = validateConceptTreeConsistency(authoritativeConcepts, currentTree.store);
        if (consistencyErrors.length) {
            console.error('[SuperMemo Concept Display][invalid-tx-clear-rejected]', {
                code: 'CROSS_STORE_INCONSISTENT',
                errors: consistencyErrors
            });
            new Notice('Concept 与主体结构树仍不一致，未解除事务锁。请先保留数据并查看 console。');
            return false;
        }
        if (!confirm('事务控制记录已损坏，但 Concept 与主体结构树当前一致。仅清除损坏的事务锁，不修改任何业务内容，是否继续？')) return false;
        if (localStorage.getItem(STORAGE_KEY) !== rawConcept
            || localStorage.getItem(TREE_STORAGE_KEY) !== rawTree
            || localStorage.getItem(TREE_TX_STORAGE_KEY) !== rawTx) {
            throw Object.assign(new Error('验证后数据已变化，请重试。'), { code: 'INVALID_TX_CLEAR_CAS_CONFLICT' });
        }
        clearPendingTransaction();
        renderViewFn();
        new Notice('✅ 已清除损坏的事务锁，业务内容未修改');
        return true;
    } catch (error) {
        console.error('[SuperMemo Concept Display][invalid-tx-clear-failed]', {
            code: error?.code || 'INVALID_TX_CLEAR_FAILED',
            message: error?.message || String(error)
        });
        new Notice(`无法解除事务锁：${error?.message || error}`);
        return false;
    }
}

function getConceptStableId(concept) {
    return concept && typeof concept.stableId === 'string' ? concept.stableId.trim() : '';
}

function findConceptByStableId(stableId) {
    const target = String(stableId || '').trim();
    return Object.values(state.concepts).find(concept => getConceptStableId(concept) === target) || null;
}

function parseSharedConceptRoot(raw) {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
        || !parsed.concepts || typeof parsed.concepts !== 'object' || Array.isArray(parsed.concepts)) {
        throw Object.assign(new Error('共享 Concept 数据根结构无效。'), { code: 'CONCEPT_ROOT_INVALID' });
    }
    return parsed;
}

function addStableIdToSharedConcept(conceptId, stableId) {
    const rawBefore = localStorage.getItem(STORAGE_KEY);
    if (!rawBefore) throw Object.assign(new Error('共享 Concept 数据不存在。'), { code: 'CONCEPT_STORE_MISSING' });
    const root = parseSharedConceptRoot(rawBefore);
    const candidate = treeModel.addStableIdToRawConceptRoot(root, conceptId, stableId);
    if (localStorage.getItem(STORAGE_KEY) !== rawBefore) {
        throw Object.assign(new Error('共享 Concept 数据已变化，请重试。'), { code: 'CONCEPT_CAS_CONFLICT' });
    }
    const serialized = JSON.stringify(candidate);
    localStorage.setItem(STORAGE_KEY, serialized);
    const readback = localStorage.getItem(STORAGE_KEY);
    if (readback !== serialized) {
        throw Object.assign(new Error('Concept 稳定身份写入后回读不一致。'), { code: 'CONCEPT_STABLE_ID_READBACK_MISMATCH' });
    }
    const verified = parseSharedConceptRoot(readback);
    if (verified.concepts[conceptId]?.stableId !== stableId) {
        throw Object.assign(new Error('Concept 稳定身份回读验证失败。'), { code: 'CONCEPT_STABLE_ID_VERIFY_FAILED' });
    }
    state.concepts[conceptId].stableId = stableId;
    state.conceptSourceRaw = readback;
}

function ensureConceptStableId(conceptId) {
    const concept = state.concepts[conceptId];
    if (!concept) throw Object.assign(new Error('Concept 不存在。'), { code: 'CONCEPT_MISSING' });
    const existing = getConceptStableId(concept);
    if (existing) {
        if (!state.treeStore.reservedConceptStableIds.includes(existing)) {
            commitTreeMutation(store => treeModel.reserveConceptStableId(store, existing), 'reserve-existing-concept-id');
        }
        return existing;
    }
    assertTreeMutationAllowed('allocate-concept-stable-id');
    let stableId = treeModel.createId('smcs');
    while (state.treeStore.reservedConceptStableIds.includes(stableId)) stableId = treeModel.createId('smcs');
    commitTreeMutation(store => treeModel.reserveConceptStableId(store, stableId), 'reserve-concept-id');
    addStableIdToSharedConcept(conceptId, stableId);
    return stableId;
}

function assignConceptToTree(conceptId, nodeId) {
    const stableId = ensureConceptStableId(conceptId);
    const currentNodeId = state.treeStore.conceptAssignments[stableId] || null;
    if (currentNodeId && currentNodeId !== nodeId) {
        const currentLabel = state.treeStore.nodesById[currentNodeId]?.label || '原结构节点';
        const nextLabel = state.treeStore.nodesById[nodeId]?.label || '新结构节点';
        if (!confirm(`该 Concept 当前属于“${currentLabel}”。确定移动到“${nextLabel}”吗？`)) return false;
    }
    commitTreeMutation(store => treeModel.assignConcept(store, stableId, nodeId), 'assign-concept');
    return true;
}

function unassignConceptFromTree(stableId, options = {}) {
    commitTreeMutation(store => treeModel.unassignConcept(store, stableId), 'unassign-concept', options);
}

function applyConceptDeletionInMemory(id) {
    delete state.concepts[id];
    removeConceptKeywords(id);
    Object.values(state.concepts).forEach(c => {
        if (c.parentId === id) {
            c.parentId = null;
            c.colorType = 'dot';
        }
    });
}

function conceptExistsInSharedStore(conceptId) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return !!parseSharedConceptRoot(raw).concepts[conceptId];
}

async function recoverPendingTreeTransaction() {
    const original = state.pendingTreeTx;
    if (!original || original.type !== 'concept-delete') {
        new Notice('当前事务记录无法自动识别，请先保留数据并查看 console 诊断。');
        return false;
    }
    let tx = treeModel.deepClone(original);
    try {
        let conceptExists = conceptExistsInSharedStore(tx.conceptId);
        if (tx.stage === 'prepared') {
            if (conceptExists) {
                const fresh = freshConceptPageRoot().concepts[tx.conceptId];
                if (getConceptStableId(fresh) !== tx.stableId) throw new Error('待删除 Concept 身份已变化，拒绝删除其他对象。');
                loadData();
                const conceptsBefore = treeModel.deepClone(state.concepts);
                const keywordsBefore = treeModel.deepClone(state.conceptKeywordIndex);
                try {
                    applyConceptDeletionInMemory(tx.conceptId);
                    await saveData(state.pendingTreeTx);
                } catch (error) {
                    state.concepts = conceptsBefore;
                    state.conceptKeywordIndex = keywordsBefore;
                    throw error;
                }
            }
            conceptExists = conceptExistsInSharedStore(tx.conceptId);
            if (conceptExists) throw Object.assign(new Error('Concept 删除尚未完成。'), { code: 'TX_CONCEPT_DELETE_INCOMPLETE' });
            tx = treeModel.advanceDeleteTransaction(tx, 'concept-deleted');
            persistPendingTransaction(tx);
        }
        if (tx.stage === 'concept-deleted') {
            if (state.treeStore.conceptAssignments[tx.stableId]) {
                commitTreeMutation(store => treeModel.unassignConcept(store, tx.stableId), 'delete-concept-unassign', { allowPendingTx: true });
            }
            tx = treeModel.advanceDeleteTransaction(tx, 'tree-unassigned', {
                expectedTreeRevision: state.treeStore.revision
            });
            persistPendingTransaction(tx);
        }
        if (tx.stage === 'tree-unassigned') {
            removeDeletedConceptPageMembership(tx.stableId);
            if (conceptExistsInSharedStore(tx.conceptId) || state.treeStore.conceptAssignments[tx.stableId]) {
                throw Object.assign(new Error('事务完成条件尚未满足。'), { code: 'TX_COMPLETION_EVIDENCE_MISMATCH' });
            }
            tx = treeModel.advanceDeleteTransaction(tx, 'cleanup-pending');
            persistPendingTransaction(tx);
        }
        if (tx.stage === 'cleanup-pending') {
            removeDeletedConceptPageMembership(tx.stableId);
            if (conceptExistsInSharedStore(tx.conceptId) || state.treeStore.conceptAssignments[tx.stableId]) {
                throw Object.assign(new Error('事务清理前验证失败。'), { code: 'TX_CLEANUP_EVIDENCE_MISMATCH' });
            }
            clearPendingTransaction();
        }
        loadData();
        new Notice('✅ Concept 删除事务已完成');
        renderViewFn();
        return true;
    } catch (error) {
        console.error('[SuperMemo Concept Display][tree-tx-recovery-failed]', {
            txId: tx?.txId,
            stage: tx?.stage,
            code: error?.code || 'TREE_TX_RECOVERY_FAILED',
            message: error?.message || String(error)
        });
        if (tx && tx.type === 'concept-delete') {
            tx.lastError = error?.code || error?.message || String(error);
            tx.updatedAt = new Date().toISOString();
            try { persistPendingTransaction(tx); } catch (persistError) {
                console.error('[SuperMemo Concept Display][tree-tx-diagnostic-save-failed]', {
                    txId: tx.txId,
                    message: persistError?.message || String(persistError)
                });
            }
        }
        new Notice(`事务尚未完成：${error?.message || error}`);
        renderViewFn();
        return false;
    }
}

function generateId(keyword) {
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
        hash = ((hash << 5) - hash) + keyword.charCodeAt(i);
        hash = hash & hash;
    }
    return 'sm-' + Math.abs(hash).toString(36);
}

function getSortLetter(keyword) {
    const firstChar = keyword.charAt(0);
    return (firstChar && /[A-Za-z]/.test(firstChar)) ? firstChar.toUpperCase() : '#';
}

function compareConceptName(a, b) {
    const aName = (a.keyword || '').trim();
    const bName = (b.keyword || '').trim();
    return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
}

function compareConceptOrder(a, b) {
    const orderDiff = (a.order || 0) - (b.order || 0);
    if (orderDiff !== 0) return orderDiff;
    return compareConceptName(a, b);
}

// ============ 层级工具函数 ============

function getSiblingConcepts(parentId, excludeId = null) {
    const normalizedParentId = parentId || null;
    return Object.values(state.concepts)
        .filter(c => (c.parentId || null) === normalizedParentId && c.id !== excludeId)
        .sort(compareConceptOrder);
}

function getChildConcepts(parentId) {
    return getSiblingConcepts(parentId);
}

function getTopLevelConcepts() {
    return getSiblingConcepts(null);
}

function getDescendantIds(conceptId) {
    const descendants = [];
    const findChildren = (parentId) => {
        Object.values(state.concepts).forEach(c => {
            if (c.parentId === parentId) {
                descendants.push(c.id);
                findChildren(c.id);
            }
        });
    };
    findChildren(conceptId);
    return descendants;
}

function normalizeSiblingOrders(parentId) {
    getSiblingConcepts(parentId).forEach((concept, index) => {
        concept.order = index;
    });
}

function normalizeAllConceptOrders() {
    const parentIds = new Set([null]);
    Object.values(state.concepts).forEach(c => {
        parentIds.add(c.parentId || null);
    });
    parentIds.forEach(parentId => normalizeSiblingOrders(parentId));
}

function normalizeKeyword(value) {
    return String(value || '')
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeKeywordKey(value) {
    return normalizeKeyword(value).toLowerCase();
}

function parseKeywordLines(value) {
    const seen = new Set();
    const result = [];
    String(value || '').split(/\r?\n/).forEach(line => {
        const keyword = normalizeKeyword(line);
        const key = normalizeKeywordKey(keyword);
        if (!keyword || seen.has(key)) return;
        seen.add(key);
        result.push(keyword);
    });
    return result;
}

function sanitizeConceptKeywordIndexForConcepts(index, concepts) {
    const next = {};
    Object.entries(index && typeof index === 'object' ? index : {}).forEach(([keyword, conceptId]) => {
        const normalizedKeyword = normalizeKeyword(keyword);
        const key = normalizeKeywordKey(normalizedKeyword);
        const targetId = String(conceptId || '').trim();
        if (!key || !targetId || !concepts?.[targetId] || next[key]) return;
        next[key] = targetId;
    });
    return next;
}

function sanitizeConceptKeywordIndex(index) {
    return sanitizeConceptKeywordIndexForConcepts(index, state.concepts);
}

function getConceptKeywords(conceptId) {
    const targetId = String(conceptId || '').trim();
    return Object.entries(state.conceptKeywordIndex || {})
        .filter(([, ownerId]) => ownerId === targetId)
        .map(([keyword]) => keyword)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function validateKeywordOwnership(conceptId, keywords) {
    const targetId = String(conceptId || '').trim();
    for (const keyword of keywords) {
        const key = normalizeKeywordKey(keyword);
        const ownerId = state.conceptKeywordIndex?.[key];
        if (ownerId && ownerId !== targetId && state.concepts[ownerId]) {
            return { ok: false, keyword, owner: state.concepts[ownerId] };
        }
    }
    return { ok: true };
}

function setConceptKeywords(conceptId, keywords) {
    const targetId = String(conceptId || '').trim();
    const next = sanitizeConceptKeywordIndex(state.conceptKeywordIndex || {});
    Object.keys(next).forEach(keyword => {
        if (next[keyword] === targetId) delete next[keyword];
    });
    parseKeywordLines(keywords.join('\n')).forEach(keyword => {
        next[normalizeKeywordKey(keyword)] = targetId;
    });
    state.conceptKeywordIndex = next;
}

function migrateKeywordOwner(oldId, newId) {
    const sourceId = String(oldId || '').trim();
    const targetId = String(newId || '').trim();
    if (!sourceId || !targetId || sourceId === targetId) return;
    Object.entries(state.conceptKeywordIndex || {}).forEach(([keyword, ownerId]) => {
        if (ownerId === sourceId) state.conceptKeywordIndex[keyword] = targetId;
    });
}

function removeConceptKeywords(conceptId) {
    const targetId = String(conceptId || '').trim();
    Object.keys(state.conceptKeywordIndex || {}).forEach(keyword => {
        if (state.conceptKeywordIndex[keyword] === targetId) delete state.conceptKeywordIndex[keyword];
    });
}

function expandConceptAncestors(conceptId) {
    let cursor = state.concepts[conceptId]?.parentId || null;
    const guard = new Set();
    while (cursor && !guard.has(cursor)) {
        guard.add(cursor);
        delete state.collapsedIds[cursor];
        cursor = state.concepts[cursor]?.parentId || null;
    }
}

function escapeCssValue(value) {
    const raw = String(value || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(raw);
    return raw.replace(/["\\]/g, '\\$&');
}

function revealConceptCapsule(conceptId, uiContext = {}) {
    if (!conceptId || !state.concepts[conceptId]) return false;
    if (!isConceptAssignedToExistingTreeNode(state.concepts[conceptId])) state.treeUi.conceptTreeAssignedOnly = false;
    try {
        const pages = readConceptPages();
        const ids = conceptPageIds(pages, state.concepts[conceptId]);
        if (state.treeUi.conceptPageId !== 'all' && !ids.includes(state.treeUi.conceptPageId || 'default')) {
            state.treeUi.conceptPageId = ids[0] || 'all';
        }
    } catch (_) { state.treeUi.conceptPageId = 'all'; }
    expandConceptAncestors(conceptId);
    if (conceptCapsuleRevealCleanupTimer != null) window.clearTimeout(conceptCapsuleRevealCleanupTimer);
    conceptCapsuleRevealTarget?.classList?.remove('sm-keyword-reveal');
    conceptCapsuleRevealCleanupTimer = null;
    conceptCapsuleRevealTarget = null;
    state.managerMode = false;
    state.pendingConceptCapsuleReveal = {
        sequence: ++treeRevealSequence,
        conceptId
    };
    const patch = { activeSurface: 'capsules', selectedConceptId: conceptId };
    if (Object.prototype.hasOwnProperty.call(uiContext, 'selectedNodeId')) {
        patch.selectedNodeId = uiContext.selectedNodeId || null;
    }
    persistTreeUi(patch);
    renderViewFn?.();
    return true;
}

function flushPendingConceptCapsuleReveal(container) {
    const pending = state.pendingConceptCapsuleReveal;
    if (!pending) return;
    const sequence = pending.sequence;
    requestAnimationFrame(() => {
        if (!state.pendingConceptCapsuleReveal || state.pendingConceptCapsuleReveal.sequence !== sequence) return;
        const target = container.querySelector(`[data-concept-id="${escapeCssValue(pending.conceptId)}"]`);
        state.pendingConceptCapsuleReveal = null;
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        conceptCapsuleRevealTarget = target;
        target.classList.add('sm-keyword-reveal');
        conceptCapsuleRevealCleanupTimer = window.setTimeout(() => {
            target.classList.remove('sm-keyword-reveal');
            if (conceptCapsuleRevealTarget === target) conceptCapsuleRevealTarget = null;
            conceptCapsuleRevealCleanupTimer = null;
        }, 2600);
    });
}

function revealConceptFromKeyword(conceptId) {
    return revealConceptCapsule(conceptId);
}

function renderKeywordPanel(container) {
    const entries = Object.entries(sanitizeConceptKeywordIndex(state.conceptKeywordIndex || {}))
        .map(([keyword, conceptId]) => ({ keyword, concept: state.concepts[conceptId], conceptId }))
        .filter(item => item.concept)
        .sort((a, b) => a.keyword.localeCompare(b.keyword, undefined, { numeric: true, sensitivity: 'base' }));
    state.conceptKeywordIndex = Object.fromEntries(entries.map(item => [item.keyword, item.conceptId]));

    const panel = container.createEl('div', { cls: 'sm-keyword-panel' });
    panel.createEl('div', { cls: 'sm-keyword-panel-title', text: 'Concept keywords' });
    if (!entries.length) {
        panel.createEl('div', { cls: 'sm-keyword-empty', text: '暂无关键词。点击 concept 的编辑按钮后，每行添加一个关键词。' });
        return;
    }
    const list = panel.createEl('div', { cls: 'sm-keyword-list' });
    entries.forEach(item => {
        const chip = list.createEl('button', { cls: 'sm-keyword-chip', text: item.keyword });
        chip.setAttribute('title', item.concept.keyword || item.conceptId);
        chip.onclick = () => revealConceptFromKeyword(item.conceptId);
    });
}

function canMoveConceptToParent(conceptId, targetParentId, { silent = false } = {}) {
    if (!conceptId || !state.concepts[conceptId]) return false;
    const normalizedTargetParentId = targetParentId || null;
    if (conceptId === normalizedTargetParentId) return false;
    if (normalizedTargetParentId) {
        const descendants = getDescendantIds(conceptId);
        if (descendants.includes(normalizedTargetParentId)) {
            if (!silent) new Notice('⚠️ 不能将父级拖入其子级');
            return false;
        }
    }
    return true;
}

function getConceptDropPosition(event, element) {
    const rect = element.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / Math.max(rect.width, 1);
    if (ratio < 0.25) return 'before';
    if (ratio > 0.75) return 'after';
    return 'child';
}

function applyConceptDropIndicator(element, position) {
    const normalizedPosition = position === 'before' || position === 'after' || position === 'child'
        ? position
        : 'child';
    const labels = {
        before: '插到前面',
        after: '插到后面',
        child: '成为子级'
    };
    element.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-child');
    element.classList.add(`drag-over-${normalizedPosition}`);
    element.dataset.dropLabel = labels[normalizedPosition];
}

function clearConceptDropIndicator(element) {
    element.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-child');
    delete element.dataset.dropLabel;
}

async function moveConceptToParent(draggedId, targetParentId, successMessage) {
    if (!draggedId || !state.concepts[draggedId]) return false;
    const normalizedTargetParentId = targetParentId || null;
    if (!canMoveConceptToParent(draggedId, normalizedTargetParentId)) return false;
    const concept = state.concepts[draggedId];
    const previousParentId = concept.parentId || null;
    const siblings = getSiblingConcepts(normalizedTargetParentId, draggedId);
    concept.parentId = normalizedTargetParentId;
    concept.colorType = concept.parentId ? 'plus' : 'yaml';
    siblings.push(concept);
    siblings.forEach((item, index) => {
        item.order = index;
    });
    if (previousParentId !== normalizedTargetParentId) {
        normalizeSiblingOrders(previousParentId);
    }
    if (normalizedTargetParentId) {
        delete state.collapsedIds[normalizedTargetParentId];
    }
    await saveData();
    if (successMessage) new Notice(successMessage);
    renderViewFn();
    return true;
}

async function moveConceptRelative(draggedId, targetId, position = 'after', successMessage) {
    if (!draggedId || !targetId || draggedId === targetId) return false;
    const dragged = state.concepts[draggedId];
    const target = state.concepts[targetId];
    if (!dragged || !target) return false;

    const normalizedPosition = position === 'before' || position === 'after' || position === 'child'
        ? position
        : 'after';
    const nextParentId = normalizedPosition === 'child' ? target.id : (target.parentId || null);
    if (!canMoveConceptToParent(dragged.id, nextParentId)) return false;

    const previousParentId = dragged.parentId || null;
    const siblings = getSiblingConcepts(nextParentId, dragged.id);

    if (normalizedPosition === 'child') {
        siblings.unshift(dragged);
    } else {
        const targetIndex = siblings.findIndex(item => item.id === target.id);
        if (targetIndex < 0) siblings.push(dragged);
        else siblings.splice(normalizedPosition === 'before' ? targetIndex : targetIndex + 1, 0, dragged);
    }

    dragged.parentId = nextParentId;
    dragged.colorType = dragged.parentId ? 'plus' : 'yaml';
    siblings.forEach((item, index) => {
        item.order = index;
    });
    if (previousParentId !== nextParentId) {
        normalizeSiblingOrders(previousParentId);
    }
    if (nextParentId) {
        delete state.collapsedIds[nextParentId];
    }
    await saveData();
    if (successMessage) new Notice(successMessage);
    renderViewFn();
    return true;
}

async function createConceptRecord(keyword, parentId = null, accentColor = '') {
    assertTreeMutationAllowed('create-concept');
    if (localStorage.getItem(STORAGE_KEY) !== state.conceptSourceRaw) throw new Error('Concept 已变化，请重新打开视图后创建。');
    if (localStorage.getItem(TREE_TX_STORAGE_KEY) != null) throw new Error('请先恢复未完成事务。');
    validateConceptPagesAgainstConcepts(readConceptPages(), freshConceptPageRoot().concepts);
    const normalizedKeyword = (keyword || '').trim();
    const normalizedParentId = parentId || null;
    const normalizedAccentColor = normalizeConceptAccentColor(accentColor || '');

    if (!normalizedKeyword) {
        new Notice('⚠️ 请输入名称');
        return null;
    }

    const id = generateId(normalizedKeyword);
    if (state.concepts[id]) {
        new Notice('⚠️ 该名称已存在');
        return null;
    }

    const sameLevelKids = Object.values(state.concepts).filter(c => c.parentId === normalizedParentId);
    state.concepts[id] = {
        id,
        keyword: normalizedKeyword,
        colorType: normalizedParentId ? 'plus' : 'yaml',
        accentColor: normalizedAccentColor,
        parentId: normalizedParentId,
        order: sameLevelKids.length,
        sortLetter: getSortLetter(normalizedKeyword),
        note: '',
        createdAt: new Date().toISOString()
    };

    if (normalizedParentId) {
        delete state.collapsedIds[normalizedParentId];
    }

    await saveData();
    persistTreeUi({ conceptPageId: 'all', conceptTreeAssignedOnly: false });
    try {
        if (localStorage.getItem(STORAGE_KEY) !== state.conceptSourceRaw) throw new Error('Concept 已在其他视图变化，请重新打开后设置页面归属。');
        const stableId = ensureConceptStableId(id);
        mutateConceptPages(pages => {
            if (Object.hasOwn(pages.memberships, stableId)) return false;
            pages.memberships[stableId] = [];
        }, 'new-concept-unassigned');
        conceptPageEditingId = id;
        persistTreeUi({ conceptPageId: 'all' });
    } catch (error) {
        new Notice(`胶囊已创建，页面归属初始化未完成：${error.message}。请在“页面归属”重试，不要重复创建。`);
    }
    return state.concepts[id];
}

// ============ 渲染函数引用 ============
let renderViewFn = null;
let treeRevealSequence = 0;
let treeRevealCleanupTimer = null;
let conceptCapsuleRevealCleanupTimer = null;
let conceptCapsuleRevealTarget = null;
let treeViewportPersistTimer = null;
cleanupCallbacks.push(() => {
    if (treeRevealCleanupTimer != null) window.clearTimeout(treeRevealCleanupTimer);
    if (conceptCapsuleRevealCleanupTimer != null) window.clearTimeout(conceptCapsuleRevealCleanupTimer);
    if (treeViewportPersistTimer != null) window.clearTimeout(treeViewportPersistTimer);
    conceptCapsuleRevealTarget?.classList?.remove('sm-keyword-reveal');
    treeRevealCleanupTimer = null;
    conceptCapsuleRevealCleanupTimer = null;
    conceptCapsuleRevealTarget = null;
    treeViewportPersistTimer = null;
});

const handleAntinetEvaChanged = () => {
    state.antinetMountRevision = Number(state.antinetMountRevision || 0) + 1;
    window.setTimeout(() => {
        rememberAntinetMountLabels();
        void registerAntinetEvaIntegration('eva-changed');
        if (state.activeSurface === 'antinet' || state.activeSurface === 'meanings') renderViewFn?.();
    }, 220);
};
const handleAntinetMetaChanged = (event) => {
    state.antinetMetaState = event?.detail?.state || getAntinetEvaApi()?.getMetaCaptureState?.() || null;
    consumeMeaningMeta(event?.detail?.reason, state.antinetMetaState);
    if (state.activeSurface === 'antinet') renderViewFn?.();
};
window.addEventListener?.('eva-cross-view-relations:changed', handleAntinetEvaChanged);
window.addEventListener?.('eva-cross-view-relations:meta-capture-changed', handleAntinetMetaChanged);
const handleDrawerProjectionChanged = () => {
    antinetViewCache = null;
    if (state.activeSurface === 'antinet') renderViewFn?.();
};
window.addEventListener?.('keyword-index:drawer-projection-changed', handleDrawerProjectionChanged);
window.addEventListener?.('ontology-keyword-index:changed', () => {
    void registerAntinetEvaIntegration('keyword-changed');
    if (state.activeSurface === 'antinet' || state.activeSurface === 'meanings') renderViewFn?.();
});
cleanupCallbacks.push(() => {
    window.removeEventListener?.('eva-cross-view-relations:changed', handleAntinetEvaChanged);
    window.removeEventListener?.('eva-cross-view-relations:meta-capture-changed', handleAntinetMetaChanged);
    window.removeEventListener?.('keyword-index:drawer-projection-changed', handleDrawerProjectionChanged);
    unregisterAntinetEvaIntegration();
});

function setButtonIcon(button, iconName) {
    if (!setIcon || !button) return;
    const icon = button.createSpan({ cls: 'sm-icon' });
    setIcon(icon, iconName);
}

function createIconButton(container, iconName, title, onClick, options = {}) {
    const button = container.createEl('button', {
        cls: `sm-icon-button${options.className ? ` ${options.className}` : ''}`,
        attr: { type: 'button', title, 'aria-label': title }
    });
    setButtonIcon(button, iconName);
    if (options.text) button.createSpan({ cls: 'sm-icon-button-label', text: options.text });
    button.onclick = onClick;
    return button;
}

function renderSurfaceTabs(container) {
    const tabs = container.createEl('div', { cls: 'sm-surface-tabs', attr: { role: 'tablist' } });
    [
        { id: 'capsules', label: '胶囊', icon: 'layout-grid' },
        { id: 'tree', label: '主体结构树', icon: 'git-branch' },
        { id: 'antinet', label: 'Antinet 框架', icon: 'share-2' },
        { id: 'meanings', label: '义胶囊', icon: 'tags' }
    ].forEach(tab => {
        const button = tabs.createEl('button', {
            cls: `sm-surface-tab${state.activeSurface === tab.id ? ' is-active' : ''}`,
            attr: { type: 'button', role: 'tab', 'aria-selected': state.activeSurface === tab.id ? 'true' : 'false' }
        });
        setButtonIcon(button, tab.icon);
        button.createSpan({ text: tab.label });
        button.onclick = () => {
            state.activeSurface = tab.id;
            persistTreeUi({ activeSurface: tab.id });
            renderViewFn();
        };
    });
}

function getConceptTreeNodeId(concept) {
    const stableId = getConceptStableId(concept);
    return stableId ? state.treeStore.conceptAssignments[stableId] || null : null;
}

function isConceptAssignedToExistingTreeNode(concept) {
    const nodeId = getConceptTreeNodeId(concept);
    return !!nodeId && Object.hasOwn(state.treeStore.nodesById, nodeId);
}

function getConceptTreeAssignmentPresentation(concept) {
    const nodeId = getConceptTreeNodeId(concept);
    if (!nodeId) return { kind: 'none', nodeId: null, label: '', path: '' };
    const node = state.treeStore.nodesById[nodeId];
    if (!node) return { kind: 'missing', nodeId, label: '结构失联', path: '' };
    const path = getTreeBreadcrumb(nodeId).map(item => item.label).join(' / ');
    if (node.lifecycle === 'archived') {
        return { kind: 'archived', nodeId, label: '已挂树·已归档', path };
    }
    return { kind: 'active', nodeId, label: '已挂树', path };
}

function getTreeBreadcrumb(nodeId) {
    const result = [];
    const visited = new Set();
    let cursor = nodeId ? state.treeStore.nodesById[nodeId] : null;
    while (cursor && !visited.has(cursor.id) && result.length < 64) {
        visited.add(cursor.id);
        result.unshift(cursor);
        cursor = cursor.parentId ? state.treeStore.nodesById[cursor.parentId] : null;
    }
    return result;
}

function getAssignedConcepts(nodeId) {
    return Object.entries(state.treeStore.conceptAssignments || {})
        .filter(([, assignedNodeId]) => assignedNodeId === nodeId)
        .map(([stableId]) => ({ stableId, concept: findConceptByStableId(stableId) }))
        .sort((left, right) => (left.concept?.keyword || left.stableId)
            .localeCompare(right.concept?.keyword || right.stableId, undefined, { numeric: true, sensitivity: 'base' }));
}

function expandTreeAncestors(nodeId) {
    const collapsed = new Set(state.treeUi.collapsedNodeIds || []);
    getTreeBreadcrumb(nodeId).forEach(node => collapsed.delete(node.id));
    state.treeUi.collapsedNodeIds = Array.from(collapsed);
}

function revealConceptInTree(conceptId) {
    const concept = state.concepts[conceptId];
    if (!concept) return false;
    const stableId = getConceptStableId(concept);
    const nodeId = stableId ? state.treeStore.conceptAssignments[stableId] || null : null;
    if (nodeId && !state.treeStore.nodesById[nodeId]) {
        new Notice('该 Concept 的主体结构归属已失联，请先修复或重新归属。');
        return false;
    }
    if (nodeId) expandTreeAncestors(nodeId);
    state.activeSurface = 'tree';
    state.treeUi.activeSurface = 'tree';
    state.treeUi.selectedNodeId = nodeId;
    state.treeUi.selectedConceptId = conceptId;
    if (nodeId && state.treeStore.nodesById[nodeId]?.lifecycle === 'archived') state.treeUi.showArchive = true;
    state.pendingTreeReveal = {
        sequence: ++treeRevealSequence,
        conceptId,
        stableId,
        nodeId
    };
    persistTreeUi(state.treeUi);
    renderViewFn();
    return true;
}

function flushPendingTreeReveal(container) {
    const pending = state.pendingTreeReveal;
    if (!pending) return;
    const sequence = pending.sequence;
    requestAnimationFrame(() => {
        if (!state.pendingTreeReveal || state.pendingTreeReveal.sequence !== sequence) return;
        const selector = pending.stableId
            ? `[data-tree-concept-stable-id="${escapeCssValue(pending.stableId)}"]`
            : `[data-tree-concept-id="${escapeCssValue(pending.conceptId)}"]`;
        const target = container.querySelector(selector)
            || container.querySelector(`[data-tree-node-id="${escapeCssValue(pending.nodeId || '')}"]`)
            || container.querySelector('.sm-tree-unassigned-focus');
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        if (treeRevealCleanupTimer != null) window.clearTimeout(treeRevealCleanupTimer);
        target.classList.add('sm-tree-reveal');
        treeRevealCleanupTimer = window.setTimeout(() => {
            target.classList.remove('sm-tree-reveal');
            treeRevealCleanupTimer = null;
        }, 2600);
        state.pendingTreeReveal = null;
    });
}

// Node comments are owner content; drafts never enter UI/capsule or EVA storage.
function readCommentOwner(kind) {
    if (!['subject', 'antinet'].includes(kind)) throw new Error('未知树类型。');
    const key = kind === 'subject' ? TREE_STORAGE_KEY : ANTINET_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    const value = raw == null ? null : JSON.parse(raw);
    const model = kind === 'subject' ? treeModel : antinetTreeModel;
    const checked = kind === 'subject' ? model.normalizeTreeStore(value) : model.normalizeAntinetStore(value);
    if (checked.readOnly) throw new Error('树数据处于只读保护，说明未写入。');
    return { key, raw, value, store: checked.store };
}

function parseCommentDraft(raw, key) {
    const draft = JSON.parse(raw);
    if (!draft || draft.schemaVersion !== 1 || draft.owner !== 'supermemo-concept-display'
        || draft.field !== 'comment' || !['subject', 'antinet'].includes(draft.kind)
        || typeof draft.draftId !== 'string' || key !== NODE_COMMENT_DRAFT_PREFIX + draft.draftId
        || typeof draft.nodeId !== 'string' || typeof draft.label !== 'string'
        || typeof draft.baseComment !== 'string' || typeof draft.text !== 'string'
        || (draft.nodeCreatedAt !== null && typeof draft.nodeCreatedAt !== 'string')) {
        throw new Error('说明草稿格式不可识别，原始内容已保留。');
    }
    return draft;
}

function getCommentDrafts(kind = null, nodeId = null) {
    const result = [];
    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(NODE_COMMENT_DRAFT_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (raw == null) continue;
        try {
            const draft = parseCommentDraft(raw, key);
            if ((!kind || draft.kind === kind) && (!nodeId || draft.nodeId === nodeId)) result.push({ key, raw, draft });
        } catch (error) {
            if (!nodeId) result.push({ key, raw, error: error.message });
        }
    }
    return result;
}

function removeCommentDraftIfUnchanged(key, raw) {
    if (raw != null && localStorage.getItem(key) === raw) localStorage.removeItem(key);
}

async function saveNodeComment(draft, text) {
    if (typeof text !== 'string') throw new Error('说明必须是文本。');
    const locks = window.navigator?.locks;
    if (!locks?.request) throw new Error('当前环境不能安全协调多窗口保存；请保留草稿并更新 Obsidian。');
    const ownerKey = draft.kind === 'subject' ? TREE_STORAGE_KEY : ANTINET_STORAGE_KEY;
    return locks.request(`supermemo-node-comment:${ownerKey}`, () => {
        // Synchronous critical section: cooperate with other comment windows and
        // optimistically detect legacy/non-comment writers without normalizing raw data.
        const current = readCommentOwner(draft.kind);
        if (draft.kind === 'subject') {
            if (localStorage.getItem(TREE_TX_STORAGE_KEY)) throw new Error('存在未完成的主体树事务，请先恢复事务。');
            assertTreeMutationAllowed('node-comment');
        } else assertAntinetMutationAllowed();
        const node = current.value?.nodesById?.[draft.nodeId];
        const effectiveNode = current.store.nodesById[draft.nodeId];
        if (!node || effectiveNode?.lifecycle !== 'active' || (effectiveNode.createdAt || null) !== draft.nodeCreatedAt) {
            throw new Error('原节点已不可编辑；草稿仍可查看和复制。');
        }
        if ((node.comment ?? '') !== draft.baseComment) throw new Error('说明已在其他窗口改变，请保留草稿，核对当前说明后再编辑。');
        const nextText = text.trim() ? text : '';
        if ((node.comment ?? '') === nextText) return false;
        const candidate = JSON.parse(current.raw);
        const now = new Date().toISOString();
        candidate.nodesById[draft.nodeId].comment = nextText;
        candidate.nodesById[draft.nodeId].updatedAt = now;
        candidate.revision = Number(current.store.revision) + 1;
        candidate.updatedAt = now;
        const checked = draft.kind === 'subject'
            ? treeModel.normalizeTreeStore(candidate) : antinetTreeModel.normalizeAntinetStore(candidate);
        if (checked.readOnly) throw new Error('说明候选校验失败，未写入。');
        if (localStorage.getItem(current.key) !== current.raw) throw new Error('树已被更新，请重试；草稿已保留。');
        const serialized = JSON.stringify(candidate);
        localStorage.setItem(current.key, serialized);
        if (localStorage.getItem(current.key) !== serialized) throw new Error('说明保存回读不一致，请核对当前说明；草稿已保留。');
        if (draft.kind === 'subject') state.treeStore = checked.store;
        else state.antinetStore = checked.store;
        console.info('[SuperMemo Concept Display][node-comment-saved]', {
            txId: draft.draftId, kind: draft.kind, nodeId: draft.nodeId, length: nextText.length, revision: candidate.revision
        });
        return true;
    });
}

function createCommentDialog(title) {
    if (activeNodeCommentDialog && !activeNodeCommentDialog.close()) return null;
    activeTreeDialog?.settle(null);
    const overlay = rootContainer.createDiv({ cls: 'sm-modal-overlay sm-tree-dialog-overlay sm-node-comment-overlay' });
    const modal = overlay.createDiv({ cls: 'sm-modal sm-node-comment-dialog' });
    const header = modal.createDiv({ cls: 'sm-modal-header' });
    header.createSpan({ text: title });
    const x = header.createEl('button', { text: '×', attr: { type: 'button', 'aria-label': '关闭并保留草稿' } });
    const body = modal.createDiv({ cls: 'sm-modal-body sm-node-comment-body' });
    const footer = modal.createDiv({ cls: 'sm-modal-footer' });
    let beforeClose = () => true;
    let closed = false;
    const close = (forced = false) => {
        if (closed) return true;
        if (!beforeClose() && !forced) return false;
        closed = true;
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        if (activeNodeCommentDialog?.overlay === overlay) activeNodeCommentDialog = null;
        return true;
    };
    const onKey = event => {
        if (event.key === 'Escape' && !event.isComposing) {
            event.preventDefault?.();
            event.stopImmediatePropagation?.();
            close();
        }
    };
    x.onclick = () => close();
    overlay.onclick = event => { if (event.target === overlay) close(); };
    modal.onclick = event => event.stopPropagation?.();
    document.addEventListener('keydown', onKey, true);
    activeNodeCommentDialog = { overlay, close };
    return { body, footer, close, setBeforeClose(callback) { beforeClose = callback; } };
}

function openNodeCommentEditor(kind, nodeId, source = null) {
    try {
        const current = readCommentOwner(kind);
        const node = current.store.nodesById[nodeId];
        const draft = source ? { ...parseCommentDraft(source.raw, source.key) } : {
            schemaVersion: 1, owner: 'supermemo-concept-display', field: 'comment', kind, nodeId,
            nodeCreatedAt: node?.createdAt || null, label: node?.label || '', baseComment: node?.comment ?? '', text: node?.comment ?? ''
        };
        if (!source && (!node || node.lifecycle !== 'active')) throw new Error('请先选择可编辑节点。');
        draft.draftId = treeModel.createId('node_comment');
        const key = NODE_COMMENT_DRAFT_PREFIX + draft.draftId;
        let persisted = null;
        let completed = false;
        let saving = false;
        const dialog = createCommentDialog(`节点说明 · ${draft.label}`);
        if (!dialog) return;
        dialog.body.createDiv({ cls: 'sm-node-comment-hint', text: '可以写：回答什么问题、通常收什么、不收什么。关闭时保留草稿，点击保存才更新节点。' });
        const textarea = dialog.body.createEl('textarea', {
            cls: 'sm-form-input sm-node-comment-input',
            attr: { rows: '10', 'aria-label': '节点说明', placeholder: '回答什么问题：\n\n通常收什么：\n\n不收什么：' }
        });
        textarea.value = draft.text;
        const status = dialog.body.createDiv({ cls: 'sm-tree-dialog-validation', attr: { role: 'status', 'aria-live': 'polite' } });
        const persist = () => {
            if (completed) return true;
            if (saving) return false;
            const text = String(textarea.value);
            const dirty = text !== draft.baseComment && (!!text.trim() || !!draft.baseComment);
            try {
                if (!dirty) {
                    removeCommentDraftIfUnchanged(key, persisted);
                    persisted = null;
                    return true;
                }
                draft.text = text;
                const previous = localStorage.getItem(key);
                if (previous != null && previous !== persisted) throw new Error('草稿身份冲突，当前输入保留在窗口中。');
                if (previous != null && parseCommentDraft(previous, key).text === text) return true;
                draft.updatedAt = new Date().toISOString();
                const serialized = JSON.stringify(draft);
                localStorage.setItem(key, serialized);
                if (localStorage.getItem(key) !== serialized) throw new Error('草稿回读失败。');
                persisted = serialized;
                status.textContent = '草稿已保留';
                return true;
            } catch (_) {
                status.textContent = '草稿保存失败，请复制输入后再关闭；当前窗口将保留。';
                console.warn('[SuperMemo Concept Display][node-comment-draft-failed]', {
                    txId: draft.draftId, kind, nodeId, length: text.length, reason: 'storage-unavailable-or-conflict'
                });
                new Notice('节点说明草稿未能保存，请复制输入。');
                return false;
            }
        };
        dialog.setBeforeClose(persist);
        textarea.oninput = persist;
        createIconButton(dialog.footer, 'copy', '复制当前说明', () => void copyTextToClipboard(textarea.value, '节点说明'), { text: '复制' });
        const discard = dialog.footer.createEl('button', { text: '放弃草稿', attr: { type: 'button' } });
        discard.onclick = () => {
            if (saving || !confirm('放弃这份未保存的说明？此操作不会修改节点当前说明。')) return;
            try {
                removeCommentDraftIfUnchanged(key, persisted);
                if (source) removeCommentDraftIfUnchanged(source.key, source.raw);
                completed = true;
                dialog.close();
                renderViewFn?.();
            } catch (_) { status.textContent = '草稿清理失败，输入仍保留。'; }
        };
        const closeButton = dialog.footer.createEl('button', { text: '关闭并保留草稿', attr: { type: 'button' } });
        closeButton.onclick = () => { if (dialog.close()) renderViewFn?.(); };
        const save = dialog.footer.createEl('button', { cls: 'mod-cta', text: '保存说明', attr: { type: 'button' } });
        save.onclick = async () => {
            if (saving || !persist()) return;
            if (draft.baseComment && !textarea.value.trim() && !confirm('确认清空此节点的已有说明？')) return;
            saving = true;
            textarea.disabled = true;
            save.disabled = true;
            try {
                await saveNodeComment(draft, textarea.value);
                completed = true;
                try {
                    removeCommentDraftIfUnchanged(key, persisted);
                    if (source) removeCommentDraftIfUnchanged(source.key, source.raw);
                } catch (_) { new Notice('说明已保存；草稿清理失败，恢复列表可能仍显示旧草稿。'); }
                dialog.close();
                renderViewFn?.();
                new Notice('节点说明已保存');
            } catch (error) {
                status.textContent = error?.message || '说明保存失败，草稿已保留。';
            } finally {
                saving = false;
                textarea.disabled = false;
                save.disabled = false;
            }
        };
        textarea.focus?.();
    } catch (error) { new Notice(error?.message || '无法打开节点说明'); }
}

function openCommentDraftList(kind, nodeId = null) {
    const dialog = createCommentDialog('节点说明草稿');
    if (!dialog) return;
    try {
        const entries = getCommentDrafts(kind, nodeId);
        if (!entries.length) dialog.body.createDiv({ text: '暂无保留的说明草稿。' });
        entries.forEach(entry => {
            const row = dialog.body.createDiv({ cls: 'sm-node-comment-draft-row' });
            row.createDiv({ text: entry.draft ? `${entry.draft.label} · ${entry.draft.kind === 'subject' ? '主体结构树' : 'Antinet 框架'}` : entry.error });
            const preview = row.createEl('textarea', { cls: 'sm-form-input sm-node-comment-draft-preview', attr: { readonly: '', rows: '4' } });
            preview.value = entry.draft ? entry.draft.text : entry.raw;
            createIconButton(row, 'copy', '复制此草稿', () => void copyTextToClipboard(preview.value, '说明草稿'), { text: '复制' });
            if (entry.draft) {
                createIconButton(row, 'pencil', '恢复说明草稿', () => {
                    dialog.close();
                    openNodeCommentEditor(entry.draft.kind, entry.draft.nodeId, entry);
                }, { text: '恢复编辑' });
            }
        });
    } catch (_) { dialog.body.createDiv({ text: '草稿暂时无法读取；存储内容未改变。' }); }
    dialog.footer.createEl('button', { text: '关闭' }).onclick = () => dialog.close();
}

function renderNodeComment(container, kind, node) {
    const section = container.createDiv({ cls: 'sm-node-comment-section' });
    const heading = section.createDiv({ cls: 'sm-node-comment-heading' });
    heading.createSpan({ text: '节点说明' });
    if (node.lifecycle === 'active') createIconButton(heading, 'message-square', '编辑节点说明', () => openNodeCommentEditor(kind, node.id), { text: node.comment ? '编辑说明' : '添加说明' });
    section.createDiv({ cls: node.comment ? 'sm-node-comment-text' : 'sm-node-comment-empty', text: node.comment || '回答什么问题？通常收什么？不收什么？' });
    try {
        const count = getCommentDrafts(kind, node.id).length;
        if (count) createIconButton(section, 'history', '查看保留的说明草稿', () => openCommentDraftList(kind, node.id), { text: `说明草稿 ${count}` });
    } catch (_) { section.createDiv({ text: '说明草稿暂时无法读取。' }); }
}

function openTreeDialog({ title, currentValue = '', submitLabel = '确定', options = null, searchable = false, validateValue = null }) {
    if (activeNodeCommentDialog && !activeNodeCommentDialog.close()) return Promise.resolve(null);
    activeTreeDialog?.settle(null);
    return new Promise(resolve => {
        let settled = false;
        const overlay = rootContainer.createDiv({ cls: 'sm-modal-overlay sm-tree-dialog-overlay' });
        const modal = overlay.createDiv({ cls: 'sm-modal sm-tree-dialog' });
        const header = modal.createDiv({ cls: 'sm-modal-header' });
        header.createSpan({ text: title });
        const closeButton = header.createEl('button', {
            cls: 'sm-tree-dialog-close',
            text: '×',
            attr: { type: 'button', 'aria-label': '取消并关闭' }
        });
        const body = modal.createDiv({ cls: 'sm-modal-body sm-tree-dialog-body' });
        const optionSearch = Array.isArray(options) && searchable
            ? body.createEl('input', {
                cls: 'sm-form-input sm-tree-dialog-search',
                attr: { type: 'search', placeholder: '搜索目标节点…', autocomplete: 'off' }
            })
            : null;
        const control = Array.isArray(options)
            ? body.createEl('select', { cls: 'sm-form-input sm-tree-dialog-control' })
            : body.createEl('input', {
                cls: 'sm-form-input sm-tree-dialog-control',
                attr: { type: 'text', maxlength: '160', autocomplete: 'off' }
            });
        const renderOptions = (query = '') => {
            if (!Array.isArray(options)) return;
            const normalizedQuery = String(query || '').trim().toLowerCase();
            const current = String(control.value ?? currentValue ?? '');
            control.empty();
            options
                .filter(option => {
                    const value = String(option.value ?? '');
                    return value === ''
                        || value === current
                        || !normalizedQuery
                        || String(option.label || '').toLowerCase().includes(normalizedQuery);
                })
                .forEach(option => control.createEl('option', {
                    text: option.label,
                    attr: { value: option.value }
                }));
            if (Array.from(control.options || []).some(option => String(option.value) === current)) control.value = current;
            else if (Array.from(control.children || []).some(option => String(option.attributes?.value ?? option.value ?? '') === current)) control.value = current;
        };
        if (Array.isArray(options)) renderOptions();
        control.value = String(currentValue ?? '');
        const validation = body.createDiv({ cls: 'sm-tree-dialog-validation' });
        const footer = modal.createDiv({ cls: 'sm-modal-footer' });
        const cancelButton = footer.createEl('button', { text: '取消', attr: { type: 'button' } });
        const submitButton = footer.createEl('button', {
            cls: 'mod-cta',
            text: submitLabel,
            attr: { type: 'button' }
        });

        const onDocumentKeydown = event => {
            if (event.key === 'Escape') {
                event.preventDefault?.();
                settle(null);
            }
        };
        const settle = value => {
            if (settled) return;
            settled = true;
            document.removeEventListener('keydown', onDocumentKeydown, true);
            overlay.remove();
            if (activeTreeDialog?.overlay === overlay) activeTreeDialog = null;
            resolve(value);
        };
        const submit = () => {
            if (settled) return;
            const value = String(control.value ?? '');
            if (!Array.isArray(options) && !value.trim()) {
                validation.textContent = '请输入结构名称。';
                control.classList.add('is-invalid');
                control.focus?.();
                return;
            }
            const validationMessage = typeof validateValue === 'function'
                ? validateValue(Array.isArray(options) ? value : value.trim())
                : '';
            if (validationMessage) {
                validation.textContent = validationMessage;
                control.classList.add('is-invalid');
                control.focus?.();
                return;
            }
            settle(Array.isArray(options) ? value : value.trim());
        };
        const onControlKeydown = event => {
            if (event.key === 'Enter' && event.isComposing !== true) {
                event.preventDefault?.();
                submit();
            } else if (event.key === 'Escape') {
                event.preventDefault?.();
                settle(null);
            }
        };

        activeTreeDialog = { overlay, settle };
        overlay.onclick = event => {
            event.preventDefault?.();
            event.stopPropagation?.();
        };
        modal.onclick = event => event.stopPropagation?.();
        closeButton.onclick = () => settle(null);
        cancelButton.onclick = () => settle(null);
        submitButton.onclick = submit;
        if (optionSearch) {
            optionSearch.oninput = () => renderOptions(optionSearch.value);
            optionSearch.onkeydown = event => {
                if (event.key === 'Escape') settle(null);
                if (event.key === 'Enter') {
                    event.preventDefault?.();
                    control.focus?.();
                }
            };
        }
        control.oninput = () => {
            validation.textContent = '';
            control.classList.remove('is-invalid');
        };
        control.onkeydown = onControlKeydown;
        document.addEventListener('keydown', onDocumentKeydown, true);
        (optionSearch || control).focus?.();
        if (!Array.isArray(options) && typeof control.select === 'function') control.select();
    });
}

function promptTreeLabel(title, currentValue = '') {
    return openTreeDialog({ title, currentValue, submitLabel: currentValue ? '保存' : '添加' });
}

async function addTreeNode(parentId = null) {
    try {
        const label = await promptTreeLabel(parentId ? '新子节点名称' : '新顶层结构名称');
        if (label == null) return;
        commitTreeMutation(store => treeModel.createTreeNode(store, { label, parentId }), 'create-tree-node');
        renderViewFn();
    } catch (error) {
        console.error('[SuperMemo Concept Display][tree-create-rejected]', { code: error?.code, message: error?.message });
        new Notice(`无法创建结构节点：${error?.message || error}`);
    }
}

async function renameTreeNode(nodeId) {
    const node = state.treeStore.nodesById[nodeId];
    if (!node) return;
    try {
        const label = await promptTreeLabel('修改结构节点名称', node.label);
        if (label == null || label === node.label) return;
        commitTreeMutation(store => treeModel.renameTreeNode(store, nodeId, label), 'rename-tree-node');
        renderViewFn();
    } catch (error) {
        new Notice(`无法改名：${error?.message || error}`);
    }
}

function archiveTreeNode(nodeId) {
    const node = state.treeStore.nodesById[nodeId];
    if (!node) return;
    const affected = treeModel.collectDescendantIds(state.treeStore, nodeId, true)
        .filter(id => state.treeStore.nodesById[id]?.lifecycle === 'active').length;
    if (!confirm(`归档“${node.label}”及其当前活动分支（${affected} 个结构节点）？Concept 归属会保留，可在归档区恢复或移出。`)) return;
    try {
        commitTreeMutation(store => treeModel.archiveTreeSubtree(store, nodeId), 'archive-tree-subtree');
        state.treeUi.selectedNodeId = null;
        persistTreeUi({ selectedNodeId: null });
        renderViewFn();
    } catch (error) {
        new Notice(`无法归档：${error?.message || error}`);
    }
}

function restoreTreeNode(nodeId) {
    try {
        commitTreeMutation(store => treeModel.restoreTreeArchiveBatch(store, nodeId), 'restore-tree-subtree');
        state.treeUi.selectedNodeId = nodeId;
        persistTreeUi({ selectedNodeId: nodeId });
        renderViewFn();
    } catch (error) {
        new Notice(`无法恢复：${error?.message || error}`);
    }
}

async function moveTreeNodeWithPicker(nodeId) {
    const node = state.treeStore.nodesById[nodeId];
    if (!node || node.lifecycle !== 'active') return;
    const options = Object.values(state.treeStore.nodesById)
        .filter(candidate => candidate.lifecycle === 'active' && candidate.id !== nodeId)
        .filter(candidate => !treeModel.collectDescendantIds(state.treeStore, nodeId, false).includes(candidate.id))
        .sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: 'base' }));
    try {
        const selected = await openTreeDialog({
            title: `移动“${node.label}”到新的父结构`,
            currentValue: node.parentId || '',
            submitLabel: '移动',
            searchable: true,
            options: [
                { value: '', label: '顶层结构' },
                ...options.map(item => ({
                    value: item.id,
                    label: getTreeBreadcrumb(item.id).map(part => part.label).join(' / ')
                }))
            ]
        });
        if (selected == null) return;
        const parentId = selected || null;
        if (parentId === (node.parentId || null)) return;
        commitTreeMutation(store => treeModel.moveTreeNode(store, nodeId, parentId), 'move-tree-node');
        renderViewFn();
    } catch (error) {
        new Notice(`无法移动：${error?.message || error}`);
    }
}

function renderTreeConceptRows(container, nodeId, limit = 5) {
    const assigned = getAssignedConcepts(nodeId);
    if (!assigned.length) return;
    const list = container.createDiv({ cls: 'sm-tree-node-concepts' });
    assigned.slice(0, limit).forEach(({ stableId, concept }) => {
        const row = list.createEl('button', {
            cls: `sm-tree-node-concept${state.treeUi.selectedConceptId === concept?.id ? ' is-selected' : ''}${concept ? '' : ' is-stale'}`,
            text: concept?.keyword || '已删除 Concept',
            attr: {
                type: 'button',
                'data-tree-concept-stable-id': stableId,
                'data-tree-concept-id': concept?.id || '',
                title: concept ? '在 Concept 胶囊中定位' : 'Concept 已删除，无法定位',
                ...(concept ? {} : { disabled: 'true' })
            }
        });
        if (!concept) return;
        row.onclick = event => {
            event.stopPropagation();
            revealConceptCapsule(concept.id, { selectedNodeId: nodeId });
        };
    });
    if (assigned.length > limit) list.createDiv({ cls: 'sm-tree-node-concept-more', text: `+${assigned.length - limit}` });
}

function renderTreeBranch(container, node) {
    const children = treeModel.getChildren(state.treeStore, node.id, 'active');
    const collapsed = new Set(state.treeUi.collapsedNodeIds || []).has(node.id);
    const branch = container.createDiv({ cls: 'sm-structure-branch' });
    const nodeWrap = branch.createDiv({ cls: 'sm-structure-node-wrap' });
    const card = nodeWrap.createEl('button', {
        cls: `sm-structure-node${state.treeUi.selectedNodeId === node.id ? ' is-selected' : ''}`,
        attr: { type: 'button', 'data-tree-node-id': node.id }
    });
    card.createSpan({ cls: 'sm-structure-node-label', text: node.label });
    const assignmentCount = getAssignedConcepts(node.id).length;
    card.createSpan({ cls: 'sm-structure-node-count', text: `${assignmentCount}` });
    card.onclick = () => {
        state.treeUi.selectedNodeId = node.id;
        persistTreeUi({ selectedNodeId: node.id });
        renderViewFn();
    };
    renderTreeConceptRows(nodeWrap, node.id);
    if (children.length) {
        const toggle = createIconButton(nodeWrap, collapsed ? 'plus' : 'minus', collapsed ? '展开分支' : '折叠分支', event => {
            event.stopPropagation();
            const next = new Set(state.treeUi.collapsedNodeIds || []);
            if (collapsed) next.delete(node.id); else next.add(node.id);
            state.treeUi.collapsedNodeIds = Array.from(next);
            persistTreeUi({ collapsedNodeIds: state.treeUi.collapsedNodeIds });
            renderViewFn();
        }, { className: 'sm-tree-branch-toggle' });
        toggle.dataset.collapsedCount = collapsed ? String(treeModel.collectDescendantIds(state.treeStore, node.id).filter(id => state.treeStore.nodesById[id]?.lifecycle === 'active').length) : '';
    }
    if (children.length && !collapsed) {
        const childRail = branch.createDiv({ cls: 'sm-structure-children' });
        children.forEach(child => renderTreeBranch(childRail, child));
    }
}

function renderTreeSearchResults(container, query) {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return;
    const results = [];
    Object.values(state.treeStore.nodesById).forEach(node => {
        if (node.label.toLowerCase().includes(normalized)) results.push({ type: 'node', node, label: node.label });
    });
    Object.values(state.concepts).forEach(concept => {
        if ((concept.keyword || '').toLowerCase().includes(normalized)) {
            results.push({ type: 'concept', concept, nodeId: getConceptTreeNodeId(concept), label: concept.keyword });
        }
    });
    const rail = container.createDiv({ cls: 'sm-tree-search-results' });
    if (!results.length) {
        rail.createDiv({ cls: 'sm-tree-search-empty', text: '没有匹配的结构节点或 Concept' });
        return;
    }
    results.slice(0, 24).forEach(result => {
        const button = rail.createEl('button', { cls: 'sm-tree-search-result', attr: { type: 'button' } });
        button.createSpan({ cls: 'sm-tree-search-kind', text: result.type === 'node' ? '结构' : 'Concept' });
        button.createSpan({ text: result.label });
        button.onclick = () => {
            if (result.type === 'concept') revealConceptInTree(result.concept.id);
            else {
                expandTreeAncestors(result.node.id);
                state.treeUi.selectedNodeId = result.node.id;
                persistTreeUi({ selectedNodeId: result.node.id, collapsedNodeIds: state.treeUi.collapsedNodeIds });
                state.pendingTreeReveal = { sequence: ++treeRevealSequence, nodeId: result.node.id, conceptId: '', stableId: '' };
                renderViewFn();
            }
        };
    });
}

function markdownSafeLabel(value) {
    return String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim() || '未命名';
}

function buildSubjectStructureMarkdown() {
    const lines = ['# SuperMemo 主体结构', ''];
    const visit = (node, depth) => {
        lines.push(`${'  '.repeat(depth)}- ${markdownSafeLabel(node.label)}`);
        getAssignedConcepts(node.id).forEach(({ concept, stableId }) => {
            lines.push(`${'  '.repeat(depth + 1)}- Concept: ${markdownSafeLabel(concept?.keyword || '已删除 Concept')} (stableId: ${markdownSafeLabel(stableId)})`);
        });
        treeModel.getChildren(state.treeStore, node.id, 'active').forEach(child => visit(child, depth + 1));
    };
    treeModel.getChildren(state.treeStore, null, 'active').forEach(node => visit(node, 0));
    if (lines.length === 2) lines.push('- （空）');
    return lines.join('\n');
}

function buildAntinetMarkdown() {
    const view = getAntinetView(true);
    const lines = ['# Antinet 框架', ''];
    const visit = (node, depth) => {
        const marker = node.kind === 'drawer' ? '〔自动抽屉〕' : node.kind === 'mount' ? '〔关键词来源〕' : node.kind === 'unresolved' ? '〔待恢复〕' : '';
        const source = node.targetNodeKey ? `（来源：${markdownSafeLabel(node.targetNodeKey)}）` : '';
        const status = node.status === 'cycle' ? '〔重复来源，停止展开〕' : '';
        lines.push(`${'  '.repeat(depth)}- ${markdownSafeLabel(node.label)}${marker}${source}${status}`);
        getAntinetMountRelations(node.id).forEach(mount => {
            const suffix = mount.alias ? `（原名：${markdownSafeLabel(mount.originalLabel)}）` : '';
            const stale = mount.stale ? ' [失联]' : '';
            lines.push(`${'  '.repeat(depth + 1)}- 关键词${stale}: ${markdownSafeLabel(mount.label)}${suffix}`);
        });
        (view.children[node.id] || []).forEach(id => visit(view.nodes[id], depth + 1));
    };
    view.roots.forEach(id => visit(view.nodes[id], 0));
    view.warnings.forEach(warning => lines.push(`\n> ${warning}（本目录不是完整来源导出）`));
    if (lines.length === 2) lines.push('- （空）');
    return lines.join('\n');
}

async function copyTextToClipboard(value, source) {
    const text = String(value || '');
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', 'true');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body?.appendChild(textarea);
            textarea.select();
            if (!document.execCommand?.('copy')) throw new Error('clipboard fallback rejected');
            textarea.remove();
        }
        console.info('[SuperMemo Concept Display][structure-markdown-copied]', { source, chars: text.length });
        new Notice(`已复制 ${source} Markdown 目录`);
        return true;
    } catch (error) {
        console.warn('[SuperMemo Concept Display][structure-markdown-copy-failed]', { source, message: error?.message || String(error) });
        new Notice(`复制 ${source} 目录失败，请检查剪贴板权限。`);
        return false;
    }
}

function renderAssignmentPicker(container, nodeId) {
    const title = container.createDiv({ cls: 'sm-tree-inspector-section-title', text: '归属 Concept' });
    const input = container.createEl('input', {
        cls: 'sm-tree-assignment-search',
        attr: { type: 'search', placeholder: '搜索 Concept…' }
    });
    const results = container.createDiv({ cls: 'sm-tree-assignment-results' });
    const renderMatches = () => {
        results.empty();
        const query = input.value.trim().toLowerCase();
        const concepts = Object.values(state.concepts)
            .filter(concept => !query || (concept.keyword || '').toLowerCase().includes(query))
            .sort(compareConceptName)
            .slice(0, 40);
        concepts.forEach(concept => {
            const stableId = getConceptStableId(concept);
            const assignedNodeId = stableId ? state.treeStore.conceptAssignments[stableId] || null : null;
            const row = results.createDiv({
                cls: `sm-tree-assignment-row${state.treeUi.selectedConceptId === concept.id ? ' sm-tree-unassigned-focus' : ''}`,
                attr: { 'data-tree-concept-id': concept.id, 'data-tree-concept-stable-id': stableId }
            });
            const text = row.createEl('button', {
                cls: 'sm-tree-assignment-text sm-tree-assignment-open',
                attr: { type: 'button', title: '在 Concept 胶囊中定位' }
            });
            text.createSpan({ cls: 'sm-tree-assignment-name', text: concept.keyword });
            text.createSpan({
                cls: 'sm-tree-assignment-current',
                text: assignedNodeId
                    ? `当前：${state.treeStore.nodesById[assignedNodeId]?.label || '失联结构'}`
                    : '当前：未归属'
            });
            text.onclick = () => revealConceptCapsule(concept.id, { selectedNodeId: nodeId });
            if (assignedNodeId === nodeId) {
                createIconButton(row, 'x', '取消归属', () => {
                    try {
                        unassignConceptFromTree(stableId);
                        renderViewFn();
                    } catch (error) {
                        new Notice(`无法取消归属：${error?.message || error}`);
                    }
                });
            } else {
                createIconButton(row, assignedNodeId ? 'move-right' : 'plus', assignedNodeId ? '移动到此节点' : '归属到此节点', () => {
                    try {
                        if (assignConceptToTree(concept.id, nodeId)) renderViewFn();
                    } catch (error) {
                        console.error('[SuperMemo Concept Display][concept-assignment-rejected]', { code: error?.code, message: error?.message });
                        new Notice(`无法归属：${error?.message || error}`);
                    }
                });
            }
        });
    };
    input.oninput = renderMatches;
    renderMatches();
}

function renderTreeInspector(container) {
    const inspector = container.createDiv({ cls: 'sm-tree-inspector' });
    const nodeId = state.treeUi.selectedNodeId;
    const node = nodeId ? state.treeStore.nodesById[nodeId] : null;
    if (!node) {
        inspector.createDiv({ cls: 'sm-tree-inspector-title', text: '结构检查器' });
        inspector.createDiv({ cls: 'sm-tree-inspector-empty', text: '选择一个结构节点，在这里管理节点与 Concept 归属。' });
        const unassigned = Object.values(state.concepts).filter(concept => !getConceptTreeNodeId(concept));
        inspector.createDiv({ cls: 'sm-tree-unassigned-count', text: `未归属 Concept：${unassigned.length}` });
        return;
    }
    const breadcrumb = getTreeBreadcrumb(node.id);
    inspector.createDiv({ cls: 'sm-tree-inspector-breadcrumb', text: breadcrumb.map(item => item.label).join(' / ') });
    inspector.createDiv({ cls: 'sm-tree-inspector-title', text: node.label });
    renderNodeComment(inspector, 'subject', node);
    const actions = inspector.createDiv({ cls: 'sm-tree-inspector-actions' });
    if (node.lifecycle === 'active') {
        createIconButton(actions, 'plus', '添加子结构', () => addTreeNode(node.id));
        createIconButton(actions, 'pencil', '改名', () => renameTreeNode(node.id));
        createIconButton(actions, 'move', '移动结构', () => moveTreeNodeWithPicker(node.id));
        createIconButton(actions, 'archive', '归档分支', () => archiveTreeNode(node.id));
        renderAssignmentPicker(inspector, node.id);
    } else {
        inspector.createDiv({ cls: 'sm-tree-archived-state', text: '此结构分支已归档，Concept 归属仍保留。' });
        const parent = node.parentId ? state.treeStore.nodesById[node.parentId] : null;
        if (!parent || parent.lifecycle === 'active') {
            createIconButton(actions, 'archive-restore', '恢复归档批次', () => restoreTreeNode(node.id), { text: '恢复' });
        } else {
            inspector.createDiv({ cls: 'sm-tree-archive-parent-hint', text: '此节点随上级分支归档，请从归档批次根恢复。' });
        }
        const assigned = getAssignedConcepts(node.id);
        if (assigned.length) {
            inspector.createDiv({ cls: 'sm-tree-inspector-section-title', text: '保留的 Concept 归属' });
            assigned.forEach(({ stableId, concept }) => {
                const row = inspector.createDiv({ cls: 'sm-tree-assignment-row', attr: { 'data-tree-concept-stable-id': stableId } });
                if (concept) {
                    const open = row.createEl('button', {
                        cls: 'sm-tree-assignment-text sm-tree-assignment-open',
                        attr: { type: 'button', title: '在 Concept 胶囊中定位' }
                    });
                    open.createSpan({ cls: 'sm-tree-assignment-name', text: concept.keyword });
                    open.createSpan({ cls: 'sm-tree-assignment-current', text: '当前：归档结构' });
                    open.onclick = () => revealConceptCapsule(concept.id, { selectedNodeId: node.id });
                } else {
                    row.createSpan({ cls: 'sm-tree-assignment-stale', text: '已删除 Concept' });
                }
                createIconButton(row, 'unlink', '取消归属', () => {
                    try {
                        unassignConceptFromTree(stableId);
                        renderViewFn();
                    } catch (error) {
                        new Notice(`无法取消归属：${error?.message || error}`);
                    }
                });
            });
        }
    }
}

function renderArchivedTreeDrawer(container) {
    const archived = Object.values(state.treeStore.nodesById).filter(node => node.lifecycle === 'archived');
    if (!archived.length) return;
    const drawer = container.createDiv({ cls: 'sm-tree-archive-drawer' });
    const toggle = drawer.createEl('button', { cls: 'sm-tree-archive-toggle', attr: { type: 'button' } });
    setButtonIcon(toggle, 'archive');
    toggle.createSpan({ text: `归档结构 ${archived.length}` });
    toggle.onclick = () => {
        state.treeUi.showArchive = !state.treeUi.showArchive;
        persistTreeUi({ showArchive: state.treeUi.showArchive });
        renderViewFn();
    };
    if (!state.treeUi.showArchive) return;
    const list = drawer.createDiv({ cls: 'sm-tree-archive-list' });
    archived
        .sort((left, right) => {
            const leftPath = getTreeBreadcrumb(left.id).map(item => item.label).join(' / ');
            const rightPath = getTreeBreadcrumb(right.id).map(item => item.label).join(' / ');
            return (left.archivedAt || '').localeCompare(right.archivedAt || '')
                || leftPath.localeCompare(rightPath, undefined, { numeric: true, sensitivity: 'base' });
        })
        .forEach(node => {
            const path = getTreeBreadcrumb(node.id).map(item => item.label).join(' / ');
            const button = list.createEl('button', {
                cls: `sm-tree-archive-item${state.treeUi.selectedNodeId === node.id ? ' is-selected' : ''}`,
                attr: { type: 'button', 'data-tree-node-id': node.id }
            });
            button.createSpan({ cls: 'sm-tree-archive-path', text: path });
            button.createSpan({
                cls: 'sm-tree-archive-count',
                text: `${getAssignedConcepts(node.id).length} Concept`
            });
            button.onclick = () => {
                state.treeUi.selectedNodeId = node.id;
                persistTreeUi({ selectedNodeId: node.id });
                renderViewFn();
            };
        });
}

let activeMeaningNavigation = null;
cleanupCallbacks.push(() => activeMeaningNavigation?.close());

// Ephemeral, view-owned navigation. Hover never loads the Keyword repository.
function createMeaningNavigationButton(container, mount, menuLabel = '义胶囊跳转') {
    const trigger = createIconButton(container, 'external-link', '选择跳转：Keyword Index / Note', () => openMenu(true));
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.onmouseenter = () => openMenu(false);
    trigger.onfocus = () => openMenu(false);
    trigger.onkeydown = event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); openMenu(true); }
    };
    function openMenu(focus) {
        if (activeMeaningNavigation?.trigger === trigger) {
            activeMeaningNavigation.keep();
            if (focus) activeMeaningNavigation.focus();
            return;
        }
        activeMeaningNavigation?.close();
        const doc = trigger.ownerDocument;
        const win = doc.defaultView;
        const menu = doc.body.createDiv({ cls: 'sm-meaning-navigation-menu', attr: { role: 'menu', 'aria-label': menuLabel } });
        let closed = false, busy = false, timer = null, suppressFocus = false;
        const buttons = [];
        const current = () => !closed && trigger.isConnected && window.__keywordIndexPluginApi === api;
        let api = null;
        const close = (restoreFocus = false) => {
            if (closed) return;
            closed = true;
            win.clearTimeout(timer);
            doc.removeEventListener('pointerdown', outside, true);
            doc.removeEventListener('keydown', keydown, true);
            doc.removeEventListener('focusin', focusout, true);
            doc.removeEventListener('scroll', scroll, true);
            win.removeEventListener('resize', scroll);
            trigger.onmouseleave = null;
            trigger.setAttribute('aria-expanded', 'false');
            menu.remove();
            if (activeMeaningNavigation?.trigger === trigger) activeMeaningNavigation = null;
            if (restoreFocus && trigger.isConnected) {
                suppressFocus = true;
                const handler = trigger.onfocus;
                trigger.onfocus = null;
                trigger.focus({ preventScroll: true });
                trigger.onfocus = handler;
                suppressFocus = false;
            }
        };
        const inside = target => trigger.contains(target) || menu.contains(target);
        const outside = event => { if (!inside(event.target)) close(); };
        const focusout = event => { if (!suppressFocus && !inside(event.target)) close(); };
        const scroll = event => { if (event.type === 'resize' || !menu.contains(event.target)) close(); };
        const keydown = event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
            if (!inside(event.target) || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            const enabled = buttons.filter(button => !button.disabled);
            if (!enabled.length) return;
            let index = enabled.indexOf(doc.activeElement);
            index = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1
                : (index + (event.key === 'ArrowUp' ? -1 : 1) + enabled.length) % enabled.length;
            enabled[index].focus({ preventScroll: true });
        };
        const keep = () => win.clearTimeout(timer);
        const leave = () => { keep(); timer = win.setTimeout(() => {
            if (!inside(doc.activeElement)) close();
        }, 220); };
        trigger.onmouseleave = leave;
        menu.onmouseenter = keep;
        menu.onmouseleave = leave;
        const position = () => {
            const rect = trigger.getBoundingClientRect();
            menu.style.maxHeight = '';
            menu.style.left = `${Math.max(8, Math.min(rect.left, win.innerWidth - menu.offsetWidth - 8))}px`;
            const below = win.innerHeight - rect.bottom - 12;
            const above = rect.top - 12;
            const useAbove = menu.offsetHeight > below && above > below;
            menu.style.maxHeight = `${Math.max(40, Math.min(420, useAbove ? above : below))}px`;
            const top = useAbove ? rect.top - menu.offsetHeight - 4 : rect.bottom + 4;
            menu.style.top = `${Math.max(8, Math.min(top, win.innerHeight - menu.offsetHeight - 8))}px`;
        };
        const message = text => { new Notice(text); close(true); };
        const failure = error => {
            if (closed) return;
            console.warn('[SuperMemo Concept Display][meaning-navigation-failed]', { relationId: mount.relationId, message: error?.message || String(error) });
            message('跳转失败，请确认 Keyword Index 已加载且目标仍存在。');
        };
        const add = (label, action, detail = '') => {
            const button = menu.createEl('button', { cls: 'sm-meaning-navigation-item', attr: { type: 'button', role: 'menuitem' } });
            button.createSpan({ text: label });
            if (detail) button.createEl('small', { text: detail });
            button.onclick = async event => {
                event?.stopPropagation();
                if (busy || closed) return;
                busy = true;
                menu.setAttribute('aria-busy', 'true');
                try { await action(); } catch (error) { failure(error); }
                finally { busy = false; menu.setAttribute('aria-busy', 'false'); }
            };
            buttons.push(button);
            return button;
        };
        const openNote = async note => {
            if (!current()) { close(); return; }
            const opened = await api.openKeywordNoteAtTabEnd(note.path, context.sourceLeaf);
            if (!current()) { close(); return; }
            if (opened !== true) message('未能打开 Note：笔记可能已移动或删除。');
            else close();
        };
        add('打开 Keyword Index', async () => {
            const eva = getAntinetEvaApi();
            if (typeof eva?.openNode !== 'function' || !mount.targetNodeKey) { message('EVA 跳转接口尚未就绪。'); return; }
            const opened = await eva.openNode(mount.targetNodeKey);
            if (closed) return;
            if (opened === false) message('未能定位 Keyword Index 来源。');
            else close();
        });
        add('直接打开 Note', async () => {
            api = window.__keywordIndexPluginApi;
            if (!mount.targetNodeKey || typeof api?.getKeywordNotesForNode !== 'function' || typeof api?.openKeywordNoteAtTabEnd !== 'function') {
                message('Keyword Index 的 Note 接口尚未就绪。'); return;
            }
            const result = await api.getKeywordNotesForNode(mount.targetNodeKey);
            if (!current()) { close(); return; }
            if (!Array.isArray(result)) throw new Error('INVALID_NOTE_LIST');
            const notes = [...new Map(result.filter(note => typeof note?.path === 'string' && note.path.trim())
                .map(note => [note.path, note])).values()];
            if (!notes.length) { message('这个关键词位置暂无可打开的 Note。'); return; }
            if (notes.length === 1) { await openNote(notes[0]); return; }
            menu.empty(); buttons.length = 0;
            menu.createDiv({ cls: 'sm-meaning-navigation-heading', text: `选择 Note（${notes.length}）` });
            notes.forEach(note => add(note.name || note.basename || note.path.split('/').pop(), () => openNote(note), note.path));
            position(); buttons[0]?.focus({ preventScroll: true });
        });
        activeMeaningNavigation = { trigger, close, keep, focus: () => buttons[0]?.focus({ preventScroll: true }) };
        trigger.setAttribute('aria-expanded', 'true');
        doc.addEventListener('pointerdown', outside, true);
        doc.addEventListener('keydown', keydown, true);
        doc.addEventListener('focusin', focusout, true);
        doc.addEventListener('scroll', scroll, true);
        win.addEventListener('resize', scroll);
        position();
        if (focus) activeMeaningNavigation.focus();
    }
    return trigger;
}

function getAntinetEvaApi() {
    const api = window.evaCrossViewRelations;
    if (!api || typeof api.registerAdapter !== 'function' || typeof api.getNodeRelationSnapshot !== 'function') return null;
    return api;
}

function getAntinetBreadcrumb(nodeId) {
    const view = getAntinetView();
    const result = [];
    const seen = new Set();
    let cursor = nodeId ? view.nodes[nodeId] : null;
    while (cursor && !seen.has(cursor.id) && result.length < 64) {
        seen.add(cursor.id);
        result.unshift(cursor);
        cursor = cursor.viewParentId ? view.nodes[cursor.viewParentId] : null;
    }
    return result;
}

function getAntinetNodeKey(nodeId) {
    const node = state.antinetStore.nodesById[nodeId];
    if (!node) return '';
    const eva = getAntinetEvaApi();
    if (typeof eva?.buildJumpNodeKey === 'function') {
        return eva.buildJumpNodeKey({
            viewType: ANTINET_VIEW_TYPE,
            notePath: ANTINET_NOTE_PATH,
            scopeType: 'antinet-node',
            scopeId: node.id,
            itemId: 'node'
        });
    }
    return `jump:v1:${[ANTINET_VIEW_TYPE, ANTINET_NOTE_PATH, 'antinet-node', node.id, 'node'].map(value => encodeURIComponent(value)).join('|')}`;
}

function getAntinetOutgoingRelations(nodeId) {
    const eva = getAntinetEvaApi();
    const sourceNodeKey = getAntinetNodeKey(nodeId);
    if (!eva || !sourceNodeKey) return [];
    const snapshot = eva.getNodeRelationSnapshot(sourceNodeKey) || {};
    return (snapshot.outgoing || []).filter(relation => {
        const target = relation.target || eva.getNodeRecord?.(relation.targetNodeKey);
        const relationType = String(relation.relationType || '');
        const isKeywordTarget = target?.viewType === ANTINET_RELATION_VIEW_TYPE
            || String(relation.targetNodeKey || '').includes('keyword-index-plugin');
        return isKeywordTarget
            && (relationType === ANTINET_META_RELATION_TYPE || ANTINET_LEGACY_RELATION_TYPES.has(relationType));
    });
}

function getAntinetMountRelations(nodeId) {
    return getAntinetOutgoingRelations(nodeId).map(relation => {
        const presentation = state.antinetStore.mountPresentationByRelationId?.[relation.id] || {};
        const target = relation.target || {};
        const originalLabel = target.label || presentation.lastKnownLabel || '关键词节点已失联';
        return {
            relation,
            relationId: relation.id,
            targetNodeKey: relation.targetNodeKey,
            originalLabel,
            label: presentation.alias || originalLabel,
            alias: presentation.alias || '',
            stale: !relation.target,
            presentation,
        };
    }).sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: 'base' })
        || left.originalLabel.localeCompare(right.originalLabel, undefined, { numeric: true, sensitivity: 'base' })
        || left.relationId.localeCompare(right.relationId));
}

function isValidAntinetMeaningAlias(value) {
    return ANTINET_MEANING_ALIAS_PATTERN.test(String(value || '').trim());
}

function getAllAntinetMeaningEntries() {
    return Object.values(state.antinetStore.nodesById || {})
        .filter(node => node.lifecycle === 'active')
        .flatMap(node => getAntinetMountRelations(node.id).map(mount => {
            const alias = String(mount.alias || '').trim();
            const aliasValid = isValidAntinetMeaningAlias(alias);
            const breadcrumb = getAntinetBreadcrumb(node.id).map(item => item.label).join(' / ');
            return {
                ...mount,
                node,
                nodeId: node.id,
                breadcrumb,
                alias,
                aliasValid,
                sortLetter: aliasValid ? alias.charAt(0) : '#',
                displayLabel: alias || '待定义义名',
            };
        }))
        .sort((left, right) => {
            const leftLetter = left.sortLetter === '#' ? '' : left.sortLetter;
            const rightLetter = right.sortLetter === '#' ? '' : right.sortLetter;
            return leftLetter.localeCompare(rightLetter)
                || left.displayLabel.localeCompare(right.displayLabel, undefined, { numeric: true, sensitivity: 'base' })
                || left.breadcrumb.localeCompare(right.breadcrumb, undefined, { numeric: true, sensitivity: 'base' })
                || left.relationId.localeCompare(right.relationId);
        });
}

function rememberAntinetMountLabels() {
    if (state.antinetReadOnly) return;
    const patches = [];
    Object.values(state.antinetStore.nodesById || {}).forEach(node => {
        getAntinetOutgoingRelations(node.id).forEach(relation => {
            const label = relation.target?.label || '';
            if (!label) return;
            const previous = state.antinetStore.mountPresentationByRelationId?.[relation.id]?.lastKnownLabel || '';
            if (previous !== label) patches.push({ relationId: relation.id, label });
        });
    });
    if (!patches.length) return;
    try {
        commitAntinetMutation(store => {
            return antinetTreeModel.setMountPresentations(store, patches.map(patch => ({
                relationId: patch.relationId,
                lastKnownLabel: patch.label
            })));
        }, 'antinet-remember-last-known-label');
    } catch (error) {
        console.warn('[SuperMemo Concept Display][antinet-last-known-label-failed]', { message: error?.message || String(error) });
    }
}

async function registerAntinetEvaIntegration(reason = 'register') {
    const eva = getAntinetEvaApi();
    if (!eva) return false;
    try {
        await eva.registerAdapter({
            adapterId: ANTINET_ADAPTER_ID,
            viewType: ANTINET_VIEW_TYPE,
            notePath: ANTINET_NOTE_PATH,
            viewLabel: 'Antinet 框架',
            listItems: () => Object.values(state.antinetStore.nodesById || {})
                .filter(node => node.lifecycle === 'active')
                .map(node => ({
                    nodeKey: getAntinetNodeKey(node.id),
                    label: node.label,
                    pathLabel: getAntinetBreadcrumb(node.id).map(item => item.label).join(' / '),
                    searchText: `${node.label} Antinet 框架`,
                    metaFields: [{ label: '类型', value: 'Antinet 框架节点' }]
                })),
            openNode: async (nodeKey) => {
                const node = Object.values(state.antinetStore.nodesById || {}).find(item => getAntinetNodeKey(item.id) === nodeKey);
                if (!node) return false;
                state.activeSurface = 'antinet';
                state.treeUi.activeSurface = 'antinet';
                state.antinetUi.selectedNodeId = node.id;
                persistTreeUi({ activeSurface: 'antinet' });
                persistAntinetUi({ selectedNodeId: node.id });
                state.pendingTreeReveal = { sequence: ++treeRevealSequence, nodeId: node.id, conceptId: '', stableId: '' };
                renderViewFn?.();
                return true;
            }
        });
        console.info('[SuperMemo Concept Display][antinet-eva-register]', { reason, adapterId: ANTINET_ADAPTER_ID });
        return true;
    } catch (error) {
        console.warn('[SuperMemo Concept Display][antinet-eva-register-failed]', { reason, message: error?.message || String(error) });
        return false;
    }
}

function unregisterAntinetEvaIntegration() {
    const eva = window.evaCrossViewRelations;
    if (eva && typeof eva.unregisterAdapter === 'function') eva.unregisterAdapter(ANTINET_ADAPTER_ID);
}

async function startAntinetMetaMount(nodeId) {
    pendingMeaningMeta = null;
    const node = state.antinetStore.nodesById[nodeId];
    const eva = getAntinetEvaApi();
    if (!node || !eva || typeof eva.startMetaCapture !== 'function' || typeof eva.captureMetaNode !== 'function') {
        new Notice('EVA Cross Relations 尚未加载，暂时不能开启关键词挂载。');
        return;
    }
    try {
        await eva.startMetaCapture({ reason: 'antinet-mount', relationType: ANTINET_META_RELATION_TYPE });
        await eva.captureMetaNode({ nodeKey: getAntinetNodeKey(node.id), label: node.label, sourcePlugin: ANTINET_VIEW_TYPE });
        armMeaningMeta(node.id);
        state.antinetUi.selectedNodeId = node.id;
        persistAntinetUi({ selectedNodeId: node.id });
        renderViewFn?.();
    } catch (error) {
        console.error('[SuperMemo Concept Display][antinet-meta-start-failed]', { code: error?.code, message: error?.message || String(error) });
        new Notice(`开启关键词挂载失败：${error?.message || error}`);
    }
}

async function captureAntinetMetaSource(nodeId) {
    pendingMeaningMeta = null;
    const node = state.antinetStore.nodesById[nodeId];
    const eva = getAntinetEvaApi();
    if (!node || !eva || typeof eva.captureMetaNode !== 'function') return;
    try {
        await eva.captureMetaNode({ nodeKey: getAntinetNodeKey(node.id), label: node.label, sourcePlugin: ANTINET_VIEW_TYPE });
        armMeaningMeta(node.id);
        state.antinetUi.selectedNodeId = node.id;
        persistAntinetUi({ selectedNodeId: node.id });
        renderViewFn?.();
    } catch (error) {
        console.error('[SuperMemo Concept Display][antinet-meta-source-failed]', { code: error?.code, message: error?.message || String(error) });
        new Notice(`选择 Antinet 节点失败：${error?.message || error}`);
    }
}

async function openAntinetMountedKeyword(mount, { captureInMeta = false } = {}) {
    const eva = getAntinetEvaApi();
    if (!eva || !mount?.targetNodeKey) {
        new Notice('EVA Cross Relations 尚未加载，暂时无法打开关键词来源。');
        return;
    }
    const meta = typeof eva.getMetaCaptureState === 'function' ? eva.getMetaCaptureState() : null;
    if (captureInMeta && meta?.active) {
        if (meta.phase !== 'target' || meta.sourcePlugin !== ANTINET_VIEW_TYPE) {
            new Notice('请先以 Antinet 节点作为 A，再选择关键词作为 B。');
            return;
        }
        await eva.captureMetaNode({ nodeKey: mount.targetNodeKey, label: mount.originalLabel, sourcePlugin: ANTINET_RELATION_VIEW_TYPE });
        return;
    }
    if (typeof eva.openNode === 'function') await eva.openNode(mount.targetNodeKey);
}

async function editAntinetMountAlias(mount) {
    if (!mount?.relationId) return;
    const alias = await openTreeDialog({
        title: '编辑义名（大写字母 + 汉字/字母/数字）',
        currentValue: mount.alias,
        submitLabel: mount.alias ? '保存义名' : '添加义名',
        validateValue: value => isValidAntinetMeaningAlias(value) ? '' : '义名格式应为大写字母 + 汉字、字母或数字，例如 J记录2、FFlight11。'
    });
    if (alias == null) return;
    try {
        commitAntinetMutation(store => antinetTreeModel.setMountPresentation(store, mount.relationId, {
            alias,
            lastKnownLabel: mount.originalLabel,
        }), 'antinet-mount-alias');
        renderViewFn?.();
    } catch (error) {
        new Notice(`义名保存失败：${error?.message || error}`);
    }
}

function expandAntinetAncestors(nodeId) {
    const collapsed = new Set(state.antinetUi.collapsedNodeIds || []);
    const expanded = new Set(state.antinetUi.expandedDrawerIds || []);
    getAntinetBreadcrumb(nodeId).forEach(node => { collapsed.delete(node.id); if (node.kind === 'drawer') expanded.add(node.id); });
    state.antinetUi.collapsedNodeIds = Array.from(collapsed);
    persistAntinetUi({ collapsedNodeIds: Array.from(collapsed), expandedDrawerIds: Array.from(expanded) });
}

function revealAntinetMeaningCapsule(nodeId, relationId) {
    if (!nodeId || !relationId) return;
    state.antinetMeaningSearch = '';
    state.antinetUi.selectedNodeId = nodeId;
    state.antinetUi.selectedRelationId = relationId;
    try {
        const projects = readMeaningProjects();
        const ids = meaningProjectIds(projects, relationId);
        if (state.antinetUi.meaningProjectId !== 'all' && !ids.includes(state.antinetUi.meaningProjectId)) {
            persistAntinetUi({ meaningProjectId: ids[0] || 'all' });
        }
    } catch (_) { persistAntinetUi({ meaningProjectId: 'all' }); }
    state.pendingAntinetMeaningReveal = {
        sequence: ++treeRevealSequence,
        nodeId,
        relationId,
    };
    persistAntinetUi({ selectedNodeId: nodeId, selectedRelationId: relationId });
    persistTreeUi({ activeSurface: 'meanings' });
    renderViewFn?.();
}

function flushPendingAntinetMeaningReveal(container) {
    const pending = state.pendingAntinetMeaningReveal;
    if (!pending) return;
    requestAnimationFrame(() => {
        if (state.pendingAntinetMeaningReveal !== pending) return;
        const target = container.querySelector(`[data-antinet-meaning-relation-id="${escapeCssValue(pending.relationId)}"]`);
        state.pendingAntinetMeaningReveal = null;
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        target.classList.add('sm-antinet-meaning-reveal');
        window.setTimeout(() => target.classList.remove('sm-antinet-meaning-reveal'), 2600);
    });
}

function revealAntinetMountInTree(nodeId, relationId) {
    const node = state.antinetStore.nodesById[nodeId];
    if (!node || node.lifecycle !== 'active') {
        new Notice('对应的 Antinet 框架节点当前不可定位。');
        return;
    }
    state.antinetUi.search = '';
    expandAntinetAncestors(nodeId);
    state.antinetUi.selectedNodeId = nodeId;
    state.antinetUi.selectedRelationId = relationId;
    state.pendingAntinetMountReveal = {
        sequence: ++treeRevealSequence,
        nodeId,
        relationId,
    };
    persistAntinetUi({
        selectedNodeId: nodeId,
        selectedRelationId: relationId,
        collapsedNodeIds: state.antinetUi.collapsedNodeIds,
        search: '',
    });
    persistTreeUi({ activeSurface: 'antinet' });
    renderViewFn?.();
}

function flushPendingAntinetMountReveal(container) {
    const pending = state.pendingAntinetMountReveal;
    if (!pending) return;
    requestAnimationFrame(() => {
        if (state.pendingAntinetMountReveal !== pending) return;
        const mount = container.querySelector(`[data-antinet-relation-id="${escapeCssValue(pending.relationId)}"]`);
        const node = container.querySelector(`[data-tree-node-id="${escapeCssValue(pending.nodeId)}"]`);
        state.pendingAntinetMountReveal = null;
        const target = mount || node;
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        [node, mount].filter(Boolean).forEach(element => element.classList.add('sm-antinet-mount-reveal'));
        window.setTimeout(() => {
            [node, mount].filter(Boolean).forEach(element => element.classList.remove('sm-antinet-mount-reveal'));
        }, 2600);
    });
}

async function unmountAntinetKeyword(mount) {
    if (!mount?.relationId) return;
    if (!confirm(`解除“${mount.label}”在当前 Antinet 节点下的挂载？关键词原对象不会被删除。`)) return;
    const eva = getAntinetEvaApi();
    try {
        if (typeof eva?.deleteRelation !== 'function') throw new Error('当前 EVA 版本不支持解除挂载');
        await eva.deleteRelation(mount.relationId);
        commitAntinetMutation(store => antinetTreeModel.removeMountPresentation(store, mount.relationId), 'antinet-unmount-keyword');
        renderViewFn?.();
    } catch (error) {
        new Notice(`解除挂载失败：${error?.message || error}`);
    }
}

async function addAntinetNode(parentId = null) {
    try {
        const projection = getAntinetView(true).nodes[parentId];
        if (projection && projection.kind !== 'manual' && (projection.kind !== 'drawer' || !projection.stableIdentity || projection.status !== 'ready')) {
            throw new Error('请先在 Keyword Index 启用永久身份并恢复抽屉来源');
        }
        const label = await promptTreeLabel(parentId ? '新 Antinet 子节点名称' : '新 Antinet 框架节点名称');
        if (label == null) return;
        const fresh = getAntinetView(true).nodes[parentId];
        if (projection?.kind === 'drawer' && (!fresh?.stableIdentity || fresh.status !== 'ready')) throw new Error('抽屉来源已变化，请重试');
        const id = antinetTreeModel.createId('sman');
        commitAntinetMutation(store => {
            return antinetTreeModel.createNode(store, { id, label,
                parentId: fresh?.kind === 'drawer' ? fresh.ownerNodeId : parentId,
                ...(fresh?.kind === 'drawer' ? { drawerAnchor: { relationId: fresh.relationId,
                    sourceNodeKey: fresh.targetNodeKey, lastKnownLabel: fresh.label } } : {}),
            });
        }, 'antinet-create-node');
        expandAntinetAncestors(id);
        persistAntinetUi({ selectedNodeId: id });
        await registerAntinetEvaIntegration('create-node');
        renderViewFn?.();
    } catch (error) {
        new Notice(`无法创建 Antinet 节点：${error?.message || error}`);
    }
}

async function renameAntinetNode(nodeId) {
    const node = state.antinetStore.nodesById[nodeId];
    if (!node) return;
    const label = await promptTreeLabel('修改 Antinet 节点名称', node.label);
    if (label == null || label === node.label) return;
    try {
        commitAntinetMutation(store => antinetTreeModel.renameNode(store, nodeId, label), 'antinet-rename-node');
        await registerAntinetEvaIntegration('rename-node');
        renderViewFn?.();
    } catch (error) {
        new Notice(`无法改名：${error?.message || error}`);
    }
}

async function moveAntinetNode(nodeId) {
    const node = state.antinetStore.nodesById[nodeId];
    if (!node || node.lifecycle !== 'active') return;
    const excluded = new Set(antinetTreeModel.collectDescendantIds(state.antinetStore, nodeId, true));
    const options = Object.values(getAntinetView(true).nodes)
        .filter(candidate => candidate.kind === 'manual' || (candidate.kind === 'drawer' && candidate.stableIdentity && candidate.status === 'ready'))
        .filter(candidate => !excluded.has(candidate.id) && !excluded.has(candidate.ownerNodeId))
        .sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: 'base' }));
    const selected = await openTreeDialog({
        title: `移动“${node.label}”到新的父节点`,
        currentValue: node.parentId || '',
        submitLabel: '移动',
        searchable: true,
        options: [{ value: '', label: '顶层框架节点' }, ...options.map(item => ({ value: item.id, label: getAntinetBreadcrumb(item.id).map(part => part.label).join(' / ') }))]
    });
    if (selected == null || (!node.drawerAnchor && selected === (node.parentId || ''))) return;
    try {
        const target = getAntinetView(true).nodes[selected];
        if (selected && !target) throw new Error('目标已变化，请重新选择');
        commitAntinetMutation(store => target?.kind === 'drawer'
            ? antinetTreeModel.attachNodeToDrawer(store, nodeId, target)
            : antinetTreeModel.moveNode(store, nodeId, selected || null), 'antinet-move-node');
        await registerAntinetEvaIntegration('move-node');
        renderViewFn?.();
    } catch (error) {
        new Notice(`无法移动 Antinet 节点：${error?.message || error}`);
    }
}

async function archiveAntinetNode(nodeId) {
    const node = state.antinetStore.nodesById[nodeId];
    if (!node) return;
    const mounts = getAntinetMountRelations(nodeId);
    if (!confirm(`归档“${node.label}”及其子树？${mounts.length ? `当前节点有 ${mounts.length} 个关键词挂载，关系会保留。` : ''}`)) return;
    try {
        commitAntinetMutation(store => antinetTreeModel.archiveSubtree(store, nodeId), 'antinet-archive-subtree');
        state.antinetUi.selectedNodeId = null;
        persistAntinetUi({ selectedNodeId: null });
        await registerAntinetEvaIntegration('archive-node');
        renderViewFn?.();
    } catch (error) {
        new Notice(`无法归档 Antinet 节点：${error?.message || error}`);
    }
}

function renderAntinetMountRows(container, nodeId) {
    const mounts = getAntinetMountRelations(nodeId);
    if (!mounts.length) return;
    const list = container.createDiv({ cls: 'sm-antinet-node-mounts' });
    mounts.forEach(mount => {
        const row = list.createEl('button', {
            cls: `sm-antinet-mount-row${mount.stale ? ' is-stale' : ''}${state.antinetUi.selectedRelationId === mount.relationId ? ' is-selected' : ''}`,
            attr: {
                type: 'button',
                title: mount.stale ? '关键词节点已失联' : '在义胶囊中查看',
                'data-antinet-relation-id': mount.relationId,
            }
        });
        setButtonIcon(row, mount.stale ? 'unlink' : 'link-2');
        const text = row.createSpan({ cls: 'sm-antinet-mount-text' });
        text.createSpan({ cls: 'sm-antinet-mount-label', text: mount.label });
        if (mount.alias) text.createSpan({ cls: 'sm-antinet-mount-original', text: mount.originalLabel });
        row.onclick = event => {
            event.stopPropagation();
            state.antinetUi.selectedNodeId = nodeId;
            state.antinetUi.selectedRelationId = mount.relationId;
            persistAntinetUi({ selectedNodeId: nodeId, selectedRelationId: mount.relationId });
            const eva = getAntinetEvaApi();
            const meta = typeof eva?.getMetaCaptureState === 'function' ? eva.getMetaCaptureState() : null;
            if (meta?.active) {
                void openAntinetMountedKeyword(mount, { captureInMeta: true });
                return;
            }
            revealAntinetMeaningCapsule(nodeId, mount.relationId);
        };
    });
}

function renderAntinetBranch(container, node) {
    const view = getAntinetView();
    const children = (view.children[node.id] || []).map(id => view.nodes[id]);
    const collapsed = antinetBranchCollapsed(node);
    const branch = container.createDiv({ cls: 'sm-structure-branch sm-antinet-branch' });
    const nodeWrap = branch.createDiv({ cls: 'sm-structure-node-wrap sm-antinet-node-wrap' });
    const card = nodeWrap.createEl('button', {
        cls: `sm-structure-node sm-antinet-node${state.antinetUi.selectedNodeId === node.id ? ' is-selected' : ''}`,
        attr: { type: 'button', 'data-tree-node-id': node.id }
    });
    setButtonIcon(card, node.kind === 'drawer' ? 'archive' : node.kind === 'manual' ? 'circle-dot' : 'link-2');
    if (node.kind !== 'manual') card.classList.add('sm-antinet-projection');
    card.createSpan({ cls: 'sm-structure-node-label', text: node.label });
    const mountCount = node.kind === 'manual' ? getAntinetMountRelations(node.id).length : children.length;
    card.createSpan({ cls: 'sm-structure-node-count', text: node.kind === 'drawer' ? '自动' : `${mountCount}` });
    card.onclick = () => {
        const eva = getAntinetEvaApi();
        const meta = typeof eva?.getMetaCaptureState === 'function' ? eva.getMetaCaptureState() : null;
        if (meta?.active && node.kind === 'manual') {
            if (meta.phase === 'source') {
                void captureAntinetMetaSource(node.id);
                return;
            }
            if (meta.sourcePlugin !== ANTINET_VIEW_TYPE) {
                new Notice('Antinet 挂载要求先选择 Antinet 节点作为 A。');
                return;
            }
        }
        state.antinetUi.selectedNodeId = node.id;
        persistAntinetUi({ selectedNodeId: node.id });
        renderViewFn?.();
    };
    if (node.kind === 'manual') renderAntinetMountRows(nodeWrap, node.id);
    if (children.length) {
        const toggle = createIconButton(nodeWrap, collapsed ? 'plus' : 'minus', collapsed ? '展开 Antinet 分支' : '折叠 Antinet 分支', event => {
            event.stopPropagation();
            const next = new Set(state.antinetUi.collapsedNodeIds || []);
            const expanded = new Set(state.antinetUi.expandedDrawerIds || []);
            if (collapsed) next.delete(node.id); else next.add(node.id);
            if (collapsed) expanded.add(node.id);
            persistAntinetUi({ collapsedNodeIds: Array.from(next), expandedDrawerIds: Array.from(expanded) });
            renderViewFn?.();
        }, { className: 'sm-tree-branch-toggle' });
        toggle.dataset.collapsedCount = collapsed ? String(children.length) : '';
    }
    if (children.length && !collapsed) {
        const childRail = branch.createDiv({ cls: 'sm-structure-children' });
        children.forEach(child => renderAntinetBranch(childRail, child));
    }
}

function renderAntinetSearchResults(container, query) {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return;
    const results = Object.values(getAntinetView().nodes)
        .filter(node => node.label.toLowerCase().includes(normalized))
        .sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: 'base' }));
    const rail = container.createDiv({ cls: 'sm-tree-search-results sm-antinet-search-results' });
    if (!results.length) {
        rail.createDiv({ cls: 'sm-tree-search-empty', text: '没有匹配的 Antinet 框架节点' });
        return;
    }
    results.slice(0, 40).forEach(node => {
        const button = rail.createEl('button', { cls: 'sm-tree-search-result', attr: { type: 'button' } });
        button.createSpan({ cls: 'sm-tree-search-kind', text: node.kind === 'drawer' ? '抽屉' : '框架' });
        button.createSpan({ text: getAntinetBreadcrumb(node.id).map(item => item.label).join(' / ') });
        button.onclick = () => {
            expandAntinetAncestors(node.id);
            const collapsed = new Set(state.antinetUi.collapsedNodeIds || []);
            getAntinetBreadcrumb(node.id).forEach(item => collapsed.delete(item.id));
            persistAntinetUi({ selectedNodeId: node.id, collapsedNodeIds: Array.from(collapsed), search: state.antinetUi.search });
            state.pendingTreeReveal = { sequence: ++treeRevealSequence, nodeId: node.id, conceptId: '', stableId: '' };
            renderViewFn?.();
        };
    });
}

// Meaning projects own only presentation membership, never EVA or tree data.
function readMeaningProjects() {
    const raw = localStorage.getItem(MEANING_PROJECT_STORAGE_KEY);
    const value = raw == null ? { schemaVersion: 1, revision: 0, projectsById: {}, relationProjects: {}, draftsByView: {} } : JSON.parse(raw);
    const record = item => item && typeof item === 'object' && !Array.isArray(item);
    if (!record(value) || value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0
        || !record(value.projectsById) || !record(value.relationProjects) || !record(value.draftsByView)) {
        throw new Error('项目义胶囊配置无法解析或版本不支持，原数据保持不变。');
    }
    for (const [id, project] of Object.entries(value.projectsById)) {
        if (!record(project) || !project.label?.trim?.() || ['all', '__proto__', 'constructor', 'prototype'].includes(id)) throw new Error('项目记录无效，已保护原数据。');
    }
    value.projectsById.default ||= { label: '一般构型义胶囊' };
    for (const ids of Object.values(value.relationProjects)) {
        if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !Object.hasOwn(value.projectsById, id))) throw new Error('项目归属记录无效，已保护原数据。');
    }
    for (const draft of Object.values(value.draftsByView)) if (typeof draft !== 'string') throw new Error('项目名称草稿无效，已保护原数据。');
    return value;
}

function mutateMeaningProjects(mutator, reason) {
    assertAntinetMutationAllowed();
    const before = localStorage.getItem(MEANING_PROJECT_STORAGE_KEY);
    const current = readMeaningProjects();
    if (mutator(current) === false) return current;
    current.revision += 1;
    if (localStorage.getItem(MEANING_PROJECT_STORAGE_KEY) !== before) throw new Error('另一视图已更新项目，请重试。');
    const serialized = JSON.stringify(current);
    localStorage.setItem(MEANING_PROJECT_STORAGE_KEY, serialized);
    if (localStorage.getItem(MEANING_PROJECT_STORAGE_KEY) !== serialized) throw new Error('项目保存回读失败，请保留输入并重试。');
    console.info('[SuperMemo Concept Display][meaning-project-commit]', { reason, revision: current.revision, status: 'PASS' });
    return current;
}

function meaningProjectIds(projects, relationId) {
    if (!Object.hasOwn(projects.relationProjects, relationId)) return ['default'];
    return [...new Set(projects.relationProjects[relationId])];
}

function initializeMeaningProjectMembership(relationId) {
    return mutateMeaningProjects(projects => {
        if (Object.hasOwn(projects.relationProjects, relationId)) return false;
        projects.relationProjects[relationId] = [];
    }, 'meta-unassigned');
}

function setMeaningProjectMembership(relationId, projectId, checked) {
    if (!getAllAntinetMeaningEntries().some(entry => entry.relationId === relationId)) throw new Error('挂载已失效，未修改项目归属。');
    return mutateMeaningProjects(projects => {
        if (!Object.hasOwn(projects.projectsById, projectId)) throw new Error('项目不存在。');
        const ids = new Set(meaningProjectIds(projects, relationId));
        checked ? ids.add(projectId) : ids.delete(projectId);
        projects.relationProjects[relationId] = [...ids];
    }, 'membership');
}

function createMeaningProject(label) {
    const name = String(label || '').trim();
    if (!name || name.length > 160) throw new Error('请输入 1–160 字的项目名称。');
    const id = antinetTreeModel.createId('meaning_project');
    mutateMeaningProjects(projects => {
        if (Object.values(projects.projectsById).some(project => project.label === name)) throw new Error('已有同名项目，请直接选择。');
        projects.projectsById[id] = { label: name };
        delete projects.draftsByView[meaningProjectViewId];
    }, 'create');
    meaningProjectDraftBuffer = null;
    persistAntinetUi({ meaningProjectId: id });
    return id;
}

function renameMeaningProject(projectId, label) {
    const id = String(projectId || '');
    const name = String(label || '').trim();
    if (id === 'all') throw new Error('“全部义胶囊”是聚合视图，不能改名。');
    if (!name || name.length > 160) throw new Error('请输入 1–160 字的页面名称。');
    return mutateMeaningProjects(projects => {
        const project = projects.projectsById[id];
        if (!project) throw new Error('页面不存在，可能已在另一视图中移除。');
        if (Object.entries(projects.projectsById).some(([key, item]) => key !== id && item.label === name)) {
            throw new Error('已有同名页面，请使用其他名称。');
        }
        if (project.label === name) return false;
        project.label = name;
    }, 'rename');
}

function armMeaningMeta(nodeId) {
    const meta = getAntinetEvaApi()?.getMetaCaptureState?.();
    pendingMeaningMeta = meta?.active && meta.sessionId && meta.sourceNodeKey === getAntinetNodeKey(nodeId)
        ? { sessionId: meta.sessionId, nodeId, sourceNodeKey: meta.sourceNodeKey, seen: new Set(getAntinetMountRelations(nodeId).map(m => m.relationId)) }
        : null;
}

function consumeMeaningMeta(reason, meta) {
    const pending = pendingMeaningMeta;
    if (!pending) return;
    if (meta?.sessionId !== pending.sessionId || !meta?.active) { pendingMeaningMeta = null; return; }
    if (reason === 'capture-target') {
        pendingMeaningMeta = null;
        const added = getAntinetMountRelations(pending.nodeId).filter(m => !pending.seen.has(m.relationId));
        if (added.length === 1) {
            state.meaningProjectEditingRelation = added[0].relationId;
            try {
                initializeMeaningProjectMembership(added[0].relationId);
                new Notice('挂载完成：当前未分配页面，请回到 SuperMemo Concept 按需勾选（可多选）。');
            } catch (error) {
                new Notice(`关系挂载成功，但项目归属未保存：${error.message}。请回到 SuperMemo Concept 重试。`);
            }
        } else new Notice('挂载已完成，请在该义胶囊的“项目归属”中选择项目。');
    } else if (reason === 'capture-duplicate' || meta.sourceNodeKey !== pending.sourceNodeKey) pendingMeaningMeta = null;
}

function renderMeaningProjectPicker(container) {
    const id = state.meaningProjectEditingRelation;
    if (!id) return;
    const panel = container.createDiv({ cls: 'sm-meaning-project-picker' });
    const entry = getAllAntinetMeaningEntries().find(item => item.relationId === id);
    const header = panel.createDiv({ cls: 'sm-meaning-project-picker-header' });
    header.createEl('strong', { text: `项目归属 · ${entry?.displayLabel || '挂载已失效'}` });
    const close = header.createEl('button', { text: '完成', attr: { type: 'button' } });
    close.onclick = () => { state.meaningProjectEditingRelation = null; renderViewFn?.(); };
    if (!entry) return;
    panel.createDiv({ cls: 'sm-meaning-project-help', text: '可多选，勾选即保存；未勾选时仅在“全部义胶囊”中可见。一般构型义胶囊与项目页彼此平行，共享同一义名和 Antinet 挂载，不复制内容。' });
    try {
        const projects = readMeaningProjects();
        const selected = meaningProjectIds(projects, id);
        const list = panel.createDiv({ cls: 'sm-meaning-project-checks' });
        const status = panel.createDiv({ cls: 'sm-meaning-project-help' });
        const inputs = [];
        Object.entries(projects.projectsById).forEach(([projectId, project]) => {
            const row = list.createEl('label', { cls: 'sm-meaning-project-choice' });
            const input = row.createEl('input', { attr: { type: 'checkbox' } });
            input.checked = selected.includes(projectId);
            row.createSpan({ text: project.label });
            inputs.push([input, projectId]);
            input.onchange = () => {
                try {
                    const latest = setMeaningProjectMembership(id, projectId, input.checked);
                    const ids = meaningProjectIds(latest, id);
                    inputs.forEach(([box, key]) => { box.checked = ids.includes(key); });
                    status.textContent = '已保存';
                } catch (error) { status.textContent = `未保存：${error.message}，请重新勾选重试。`; }
            };
        });
    } catch (error) { panel.createDiv({ text: error.message }); }
}

function renderMeaningProjectToolbar(selectionHost, creationHost = selectionHost) {
    let projects;
    try { projects = readMeaningProjects(); } catch (error) {
        selectionHost.createDiv({ cls: 'sm-tree-protection', text: error.message });
        return 'all';
    }
    const selected = state.antinetUi.meaningProjectId || 'default';
    const id = selected === 'all' || projects.projectsById[selected] ? selected : 'default';
    const select = selectionHost.createEl('select', { cls: 'sm-meaning-project-select', attr: { 'aria-label': '项目义胶囊' } });
    select.createEl('option', { text: '全部义胶囊', attr: { value: 'all' } });
    Object.entries(projects.projectsById).forEach(([key, project]) => select.createEl('option', { text: project.label, attr: { value: key } }));
    select.value = id;
    select.onchange = () => { persistAntinetUi({ meaningProjectId: select.value }); state.antinetMeaningSearch = ''; renderViewFn?.(); };
    const rename = selectionHost.createEl('button', {
        cls: 'sm-meaning-project-rename',
        text: '改名',
        attr: {
            type: 'button',
            'aria-label': '修改当前页面名称',
            title: id === 'all' ? '“全部义胶囊”是聚合视图，不能改名' : '修改当前页面名称'
        }
    });
    rename.disabled = id === 'all';
    rename.onclick = async () => {
        const projectId = select.value;
        if (projectId === 'all') return;
        let current;
        try {
            const latest = readMeaningProjects();
            current = latest.projectsById[projectId]?.label;
            if (!current) throw new Error('页面不存在，可能已在另一视图中移除。');
        } catch (error) {
            new Notice(`无法改名：${error.message}`);
            return;
        }
        const next = await openTreeDialog({
            title: '修改义胶囊页面名称',
            currentValue: current,
            submitLabel: '保存',
            validateValue: value => {
                const name = String(value || '').trim();
                if (!name || name.length > 160) return '请输入 1–160 字的页面名称。';
                try {
                    const latest = readMeaningProjects();
                    if (!latest.projectsById[projectId]) return '页面不存在，可能已在另一视图中移除。';
                    if (Object.entries(latest.projectsById).some(([key, item]) => key !== projectId && item.label === name)) return '已有同名页面，请使用其他名称。';
                } catch (error) { return error.message; }
                return '';
            }
        });
        if (next == null) return;
        try {
            renameMeaningProject(projectId, next);
            persistAntinetUi({ meaningProjectId: projectId });
            renderViewFn?.();
        } catch (error) { new Notice(`无法改名：${error.message}`); }
    };
    const name = creationHost.createEl('input', { cls: 'sm-meaning-project-name', attr: { type: 'text', maxlength: '160', placeholder: '新项目名称', 'aria-label': '新项目名称' } });
    name.value = meaningProjectDraftBuffer ?? projects.draftsByView[meaningProjectViewId] ?? '';
    const status = creationHost.createSpan({ cls: 'sm-meaning-project-help', attr: { 'aria-live': 'polite' } });
    name.oninput = () => {
        meaningProjectDraftBuffer = name.value;
        try { mutateMeaningProjects(p => { p.draftsByView[meaningProjectViewId] = name.value; }, 'name-draft'); status.textContent = ''; }
        catch (error) { status.textContent = `草稿未保存：${error.message}`; }
    };
    const add = creationHost.createEl('button', { text: '＋新增项目', attr: { type: 'button' } });
    add.onclick = () => {
        try { createMeaningProject(name.value); renderViewFn?.(); }
        catch (error) { status.textContent = error.message; name.focus?.(); }
    };
    name.onkeydown = event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault?.(); add.onclick(); } };
    const recoverable = Object.entries(projects.draftsByView).filter(([key, value]) => key !== meaningProjectViewId && value.trim());
    if (recoverable.length) {
        const recover = creationHost.createEl('select', { attr: { 'aria-label': '恢复未保存的项目名称' } });
        recover.createEl('option', { text: '恢复项目名草稿…', attr: { value: '' } });
        recoverable.forEach(([key, value]) => recover.createEl('option', { text: value, attr: { value: key } }));
        recover.onchange = () => {
            if (!recover.value) return;
            try {
                const recovered = readMeaningProjects().draftsByView[recover.value] || '';
                if (name.value.trim() && name.value !== recovered) {
                    status.textContent = '当前已有项目名输入，请先创建项目或明确清空后，再恢复其他草稿。';
                    recover.value = '';
                    return;
                }
                // Copy, do not steal a draft that another open view may still own.
                const latest = mutateMeaningProjects(p => { p.draftsByView[meaningProjectViewId] = p.draftsByView[recover.value] || ''; }, 'recover-draft');
                name.value = latest.draftsByView[meaningProjectViewId];
                meaningProjectDraftBuffer = name.value;
            } catch (error) { status.textContent = error.message; }
        };
    }
    return id;
}

// Per-view session state only: keep each rendered page's identity before callers switch it.
const meaningScrollPositions = new Map();
let activeMeaningViewport = null;
cleanupCallbacks.push(() => { activeMeaningViewport = null; meaningScrollPositions.clear(); });

function captureMeaningViewport() {
    const previous = activeMeaningViewport;
    activeMeaningViewport = null;
    if (!previous || previous.container.isConnected === false) return;
    const safeTop = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(10000000, Number(value))) : 0;
    meaningScrollPositions.delete(previous.key);
    meaningScrollPositions.set(previous.key, {
        panelTop: safeTop(previous.container.scrollTop),
        hostTop: safeTop(previous.host?.scrollTop)
    });
    if (meaningScrollPositions.size > 80) meaningScrollPositions.delete(meaningScrollPositions.keys().next().value);
}

function restoreMeaningViewport(container, key) {
    const host = container.closest?.('.supermemo-concept-display-host') || null;
    activeMeaningViewport = { container, host, key };
    if (state.pendingAntinetMeaningReveal) return;
    const saved = meaningScrollPositions.get(key);
    container.scrollTop = saved?.panelTop || 0;
    if (host) host.scrollTop = saved?.hostTop || 0;
}

function renderAntinetMeaningView(container) {
    activeMeaningNavigation?.close();
    if (treeViewportPersistTimer != null) {
        window.clearTimeout(treeViewportPersistTimer);
        treeViewportPersistTimer = null;
    }
    container.innerHTML = '';
    container.className = 'sm-surface-panel sm-antinet-meaning-surface';
    if (state.antinetReadOnly) {
        const error = container.createDiv({ cls: 'sm-tree-protection' });
        error.createDiv({ cls: 'sm-tree-protection-title', text: 'Antinet 框架无法解析，当前只读保护' });
        error.createDiv({ text: state.antinetErrors.join(' · ') });
        return;
    }

    const toolbar = container.createDiv({ cls: 'sm-tree-toolbar sm-antinet-meaning-toolbar' });
    const projectSelection = toolbar.createDiv({ cls: 'sm-meaning-project-selection' });
    const search = toolbar.createEl('input', {
        cls: 'sm-tree-search sm-antinet-meaning-search',
        attr: { type: 'search', placeholder: '搜索义名、原关键词或 Antinet 路径…' }
    });
    search.value = state.antinetMeaningSearch || '';
    const projectCreation = toolbar.createDiv({ cls: 'sm-meaning-project-toolbar' });
    const projectId = renderMeaningProjectToolbar(projectSelection, projectCreation);
    const summary = toolbar.createDiv({ cls: 'sm-antinet-meaning-summary' });
    const nav = container.createDiv({ cls: 'sm-alphabet-nav sm-antinet-meaning-nav' });
    const content = container.createDiv({ cls: 'sm-antinet-meaning-content' });

    const renderResults = () => {
        captureMeaningViewport();
        activeMeaningNavigation?.close();
        let allEntries = getAllAntinetMeaningEntries();
        if (projectId !== 'all') {
            try { const projects = readMeaningProjects(); allEntries = allEntries.filter(entry => meaningProjectIds(projects, entry.relationId).includes(projectId)); }
            catch (_) { /* Show all without writing or hiding data on malformed project config. */ }
        }
        const query = String(state.antinetMeaningSearch || '').trim().toLowerCase();
        const scrollKey = JSON.stringify([projectId, query]);
        const entries = allEntries.filter(entry => !query || [
            entry.displayLabel,
            entry.originalLabel,
            entry.breadcrumb,
        ].some(value => String(value || '').toLowerCase().includes(query)));
        const definedCount = allEntries.filter(entry => entry.aliasValid).length;
        const staleCount = allEntries.filter(entry => entry.stale).length;
        summary.textContent = `义胶囊 ${entries.length}/${allEntries.length} · 已定义 ${definedCount}${staleCount ? ` · 失联 ${staleCount}` : ''}`;
        nav.empty();
        content.empty();

        if (!entries.length) {
            const empty = content.createDiv({ cls: 'sm-tree-empty sm-antinet-meaning-empty' });
            empty.createDiv({ cls: 'sm-tree-empty-title', text: allEntries.length ? '没有匹配的义胶囊' : '还没有义胶囊' });
            empty.createDiv({ text: allEntries.length ? '请调整搜索词。' : '先在 Antinet 框架中挂载 Keyword Index 关键词。' });
            restoreMeaningViewport(container, scrollKey);
            return;
        }

        const groups = new Map();
        entries.forEach(entry => {
            if (!groups.has(entry.sortLetter)) groups.set(entry.sortLetter, []);
            groups.get(entry.sortLetter).push(entry);
        });
        const letters = Array.from(groups.keys()).sort((left, right) => {
            if (left === '#') return -1;
            if (right === '#') return 1;
            return left.localeCompare(right);
        });
        letters.forEach(letter => {
            const link = nav.createEl('button', { cls: 'sm-letter-link', text: letter, attr: { type: 'button' } });
            link.onclick = () => {
                const target = content.querySelector(`[data-antinet-meaning-group="${escapeCssValue(letter)}"]`);
                target?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            };
        });

        letters.forEach(letter => {
            const section = content.createEl('section', {
                cls: 'sm-antinet-meaning-group',
                attr: { 'data-antinet-meaning-group': letter }
            });
            section.createEl('h4', { cls: 'sm-group-header sm-antinet-meaning-group-title', text: letter });
            const grid = section.createDiv({ cls: 'sm-antinet-meaning-grid' });
            groups.get(letter).forEach(entry => {
                const formatState = !entry.alias ? '待定义义名' : entry.aliasValid ? '义名' : '格式待调整';
                const capsule = grid.createDiv({
                    cls: `sm-antinet-meaning-capsule${entry.aliasValid ? '' : ' is-unresolved'}${entry.stale ? ' is-stale' : ''}`,
                    attr: {
                        'data-antinet-meaning-relation-id': entry.relationId
                    }
                });
                const main = capsule.createEl('button', {
                    cls: 'sm-antinet-meaning-main',
                    attr: { type: 'button', title: '定位到 Antinet 框架位置' }
                });
                const header = main.createDiv({ cls: 'sm-antinet-meaning-capsule-header' });
                header.createDiv({ cls: 'sm-antinet-meaning-title', text: entry.displayLabel });
                header.createSpan({ cls: `sm-antinet-meaning-status${entry.aliasValid ? ' is-defined' : ''}`, text: entry.stale ? `${formatState} · 失联` : formatState });
                const actions = capsule.createDiv({ cls: 'sm-antinet-meaning-actions' });
                createIconButton(actions, 'folders', '项目归属（可多选）', () => { state.meaningProjectEditingRelation = entry.relationId; renderViewFn?.(); });
                createIconButton(actions, 'pencil', '编辑本地义名', event => {
                    event?.stopPropagation?.();
                    void editAntinetMountAlias(entry);
                });
                createMeaningNavigationButton(actions, entry);
                main.onclick = () => revealAntinetMountInTree(entry.nodeId, entry.relationId);
            });
        });
        restoreMeaningViewport(container, scrollKey);
        flushPendingAntinetMeaningReveal(container);
    };

    search.oninput = () => {
        state.antinetMeaningSearch = search.value.slice(0, 200);
        renderResults();
    };
    renderResults();
}

function renderAntinetMountInspector(container, nodeId) {
    const mounts = getAntinetMountRelations(nodeId);
    container.createDiv({ cls: 'sm-tree-inspector-section-title', text: `已挂载关键词 ${mounts.length}` });
    if (!mounts.length) {
        container.createDiv({ cls: 'sm-antinet-inspector-empty', text: '还没有关键词。先建立 Antinet 框架节点，再用 EVA Meta 挂载 Keyword Index 的关键词或抽屉。' });
        return;
    }
    const list = container.createDiv({ cls: 'sm-antinet-inspector-mounts' });
    mounts.forEach(mount => {
        const row = list.createDiv({ cls: `sm-antinet-inspector-mount${mount.stale ? ' is-stale' : ''}` });
        const body = row.createDiv({ cls: 'sm-antinet-inspector-mount-body' });
        body.createDiv({ cls: 'sm-antinet-mount-label', text: mount.label });
        body.createDiv({ cls: 'sm-antinet-mount-original', text: `${mount.originalLabel}${mount.stale ? ' · 失联' : ' · Keyword Index'}` });
        const actions = row.createDiv({ cls: 'sm-antinet-mount-actions' });
        createIconButton(actions, 'folders', '项目归属（可多选）', () => { state.meaningProjectEditingRelation = mount.relationId; renderViewFn?.(); });
        createIconButton(actions, 'pencil', '编辑本地义名', () => void editAntinetMountAlias(mount));
        createMeaningNavigationButton(actions, mount, 'Antinet 关键词跳转');
        createIconButton(actions, 'unlink', '解除挂载', () => void unmountAntinetKeyword(mount));
    });
}

function renderAntinetInspector(container) {
    const inspector = container.createDiv({ cls: 'sm-tree-inspector sm-antinet-inspector' });
    const node = getAntinetView().nodes[state.antinetUi.selectedNodeId];
    if (!node) {
        inspector.createDiv({ cls: 'sm-tree-inspector-title', text: 'Antinet 框架检查器' });
        inspector.createDiv({ cls: 'sm-tree-inspector-empty', text: '先添加一个框架节点，再把关键词挂到具体节点下面。' });
        const count = Object.values(state.antinetStore.nodesById || {}).filter(item => item.lifecycle === 'active').length;
        inspector.createDiv({ cls: 'sm-tree-unassigned-count', text: `当前活动框架节点：${count}` });
        return;
    }
    inspector.createDiv({ cls: 'sm-tree-inspector-breadcrumb', text: getAntinetBreadcrumb(node.id).map(item => item.label).join(' / ') });
    inspector.createDiv({ cls: 'sm-tree-inspector-title', text: node.label });
    if (node.kind !== 'manual') {
        inspector.createDiv({ text: node.kind === 'unresolved'
            ? '来源未能定位或尚未完整加载。下面的手动分支已保留，可选中分支后移动到普通节点或重新附着到抽屉。'
            : node.status === 'cycle' ? '此来源已在上层出现，已停止重复展开。'
            : '由 Keyword Index 自动显示，名称与层级跟随来源。' });
        const actions = inspector.createDiv({ cls: 'sm-tree-inspector-actions' });
        if (node.kind === 'drawer' && node.status === 'ready' && !state.antinetReadOnly) {
            createIconButton(actions, 'plus', '在此抽屉下添加框架节点', () => void addAntinetNode(node.id), { text: '添加子框架节点' });
            if (!node.stableIdentity) inspector.createDiv({ text: '添加前需在 Keyword Index 启用永久身份。' });
        }
        if (node.targetNodeKey) createIconButton(actions, 'external-link', '打开抽屉来源', () => void openAntinetMountedKeyword(node), { text: '打开来源' });
        return;
    }
    if (node.drawerAnchor) inspector.createDiv({ cls: 'sm-antinet-anchor-note', text: `接在抽屉：${node.drawerAnchor.lastKnownLabel}。可通过“移动”重新附着或移回普通节点。` });
    renderNodeComment(inspector, 'antinet', node);
    const actions = inspector.createDiv({ cls: 'sm-tree-inspector-actions' });
    if (node.lifecycle === 'active') {
        createIconButton(actions, 'plus', '添加子框架节点', () => void addAntinetNode(node.id));
        createIconButton(actions, 'pencil', '修改框架节点名称', () => void renameAntinetNode(node.id));
        createIconButton(actions, 'move', '移动框架节点', () => void moveAntinetNode(node.id));
        createIconButton(actions, 'archive', '归档框架分支', () => void archiveAntinetNode(node.id));
        createIconButton(actions, 'link-2', '以此节点作为 A，挂载 Keyword Index 条目', () => void startAntinetMetaMount(node.id), { text: '挂载关键词' });
    } else {
        inspector.createDiv({ cls: 'sm-tree-archived-state', text: '此框架分支已归档，不能移动或编辑。' });
    }
    renderAntinetMountInspector(inspector, node.id);
}

function renderAntinetView(container) {
    const view = getAntinetView(true);
    const previousViewport = container.querySelector?.('.sm-antinet-viewport');
    if (previousViewport) {
        state.antinetUi.viewportLeft = Number(previousViewport.scrollLeft || 0);
        state.antinetUi.viewportTop = Number(previousViewport.scrollTop || 0);
    }
    if (treeViewportPersistTimer != null) {
        window.clearTimeout(treeViewportPersistTimer);
        treeViewportPersistTimer = null;
    }
    container.innerHTML = '';
    container.className = 'sm-surface-panel sm-tree-surface sm-antinet-surface';
    const eva = getAntinetEvaApi();
    const meta = typeof eva?.getMetaCaptureState === 'function' ? eva.getMetaCaptureState() : null;
    const toolbar = container.createDiv({ cls: 'sm-tree-toolbar sm-antinet-toolbar' });
    createIconButton(toolbar, 'plus', '添加顶层 Antinet 节点', () => void addAntinetNode(null), { text: '添加框架节点' });
    createIconButton(toolbar, 'clipboard', '复制 Antinet Markdown 目录', () => void copyTextToClipboard(buildAntinetMarkdown(), 'Antinet 框架'), { text: '复制目录' });
    createIconButton(toolbar, 'history', '查看 Antinet 节点说明草稿', () => openCommentDraftList('antinet'), { text: '说明草稿' });
    createIconButton(toolbar, 'refresh-cw', '重新读取抽屉来源', () => { antinetViewCache = null; renderViewFn?.(); }, { text: '刷新抽屉' });
    const selectedNode = state.antinetStore.nodesById[state.antinetUi.selectedNodeId];
    createIconButton(toolbar, meta?.active ? 'square' : 'link-2', meta?.active ? '退出 EVA Meta' : '开启 EVA Meta 挂载', () => {
        if (meta?.active) {
            eva?.stopMetaCapture?.('antinet-toolbar');
            renderViewFn?.();
        } else if (selectedNode) {
            void startAntinetMetaMount(selectedNode.id);
        } else {
            new Notice('请先选择一个 Antinet 框架节点。');
        }
    }, { text: meta?.active ? '退出 Meta' : '开启 Meta' });
    const status = toolbar.createSpan({ cls: `sm-antinet-meta-status${meta?.active ? ' is-active' : ''}`, text: !meta?.active ? 'EVA Meta 未开启' : meta.phase === 'target' ? `A：${meta.sourceLabel || 'Antinet 节点'} · 请选择关键词 B` : '请选择 Antinet 节点 A' });
    const search = toolbar.createEl('input', { cls: 'sm-tree-search', attr: { type: 'search', placeholder: '搜索 Antinet 框架节点…' } });
    search.value = state.antinetUi.search || '';
    const searchHost = container.createDiv({ cls: 'sm-tree-search-host' });
    search.oninput = () => {
        state.antinetUi.search = search.value.slice(0, 200);
        persistAntinetUi({ search: state.antinetUi.search });
        searchHost.empty();
        renderAntinetSearchResults(searchHost, state.antinetUi.search);
    };
    createIconButton(toolbar, 'unfold-vertical', '展开全部 Antinet 节点', () => { persistAntinetUi({ collapsedNodeIds: [], expandAllDrawers: true }); renderViewFn?.(); });
    createIconButton(toolbar, 'fold-vertical', '折叠全部 Antinet 分支', () => {
        const collapsedNodeIds = Object.values(view.nodes)
            .filter(node => view.children[node.id]?.length)
            .map(node => node.id);
        persistAntinetUi({ collapsedNodeIds, expandAllDrawers: false, expandedDrawerIds: [] });
        renderViewFn?.();
    });
    const zoomGroup = toolbar.createDiv({ cls: 'sm-tree-zoom-group' });
    createIconButton(zoomGroup, 'zoom-out', '缩小 Antinet', () => { persistAntinetUi({ zoom: Math.max(0.55, Math.round((state.antinetUi.zoom - 0.1) * 100) / 100) }); renderViewFn?.(); });
    const zoomReset = zoomGroup.createEl('button', { cls: 'sm-tree-zoom-value', text: `${Math.round(state.antinetUi.zoom * 100)}%`, attr: { type: 'button', title: '恢复 100%' } });
    zoomReset.onclick = () => { persistAntinetUi({ zoom: 1 }); renderViewFn?.(); };
    createIconButton(zoomGroup, 'zoom-in', '放大 Antinet', () => { persistAntinetUi({ zoom: Math.min(1.6, Math.round((state.antinetUi.zoom + 0.1) * 100) / 100) }); renderViewFn?.(); });
    if (state.antinetUi.search) renderAntinetSearchResults(searchHost, state.antinetUi.search);
    if (meta?.active) {
        const banner = container.createDiv({ cls: 'sm-antinet-meta-banner' });
        banner.createSpan({ cls: 'sm-antinet-meta-banner-title', text: 'EVA Meta 挂载模式' });
        banner.createSpan({ text: meta.phase === 'target' ? '已锁定 Antinet 节点 A，现在请到 Keyword Index 选择关键词或抽屉 B。' : '请点击一个 Antinet 框架节点作为 A。' });
    }
    if (state.antinetReadOnly) {
        const error = container.createDiv({ cls: 'sm-tree-protection' });
        error.createDiv({ cls: 'sm-tree-protection-title', text: 'Antinet 框架无法解析，当前只读保护' });
        error.createDiv({ text: state.antinetErrors.join(' · ') });
        return;
    }
    view.warnings.forEach(message => container.createDiv({ cls: 'sm-antinet-projection-warning', text: message }));
    const workspace = container.createDiv({ cls: 'sm-tree-workspace' });
    const viewport = workspace.createDiv({ cls: 'sm-tree-viewport sm-antinet-viewport' });
    requestAnimationFrame(() => {
        viewport.scrollLeft = Number(state.antinetUi.viewportLeft || 0);
        viewport.scrollTop = Number(state.antinetUi.viewportTop || 0);
    });
    viewport.onscroll = () => {
        if (treeViewportPersistTimer != null) window.clearTimeout(treeViewportPersistTimer);
        treeViewportPersistTimer = window.setTimeout(() => {
            persistAntinetUi({ viewportLeft: viewport.scrollLeft, viewportTop: viewport.scrollTop });
            treeViewportPersistTimer = null;
        }, 160);
    };
    const canvas = viewport.createDiv({ cls: 'sm-tree-canvas sm-antinet-canvas' });
    canvas.style.setProperty('--sm-tree-zoom', String(state.antinetUi.zoom || 1));
    const roots = view.roots.map(id => view.nodes[id]);
    if (!roots.length) {
        const empty = canvas.createDiv({ cls: 'sm-tree-empty sm-antinet-empty' });
        empty.createDiv({ cls: 'sm-tree-empty-title', text: '先建立 Antinet 框架' });
        empty.createDiv({ text: '先在这里搭建树节点，再通过 EVA Meta 把 Keyword Index 的关键词或抽屉挂到具体节点下面。' });
        createIconButton(empty, 'plus', '添加第一个 Antinet 节点', () => void addAntinetNode(null), { text: '添加第一个框架节点' });
    } else {
        const virtualRoot = canvas.createDiv({ cls: 'sm-tree-virtual-root' });
        virtualRoot.createDiv({ cls: 'sm-tree-virtual-root-label sm-antinet-root-label', text: 'Antinet 框架' });
        const rootRail = virtualRoot.createDiv({ cls: 'sm-structure-roots' });
        roots.forEach(root => renderAntinetBranch(rootRail, root));
    }
    renderAntinetInspector(workspace);
    flushPendingTreeReveal(container);
    flushPendingAntinetMountReveal(container);
}

function renderPendingTransactionBanner(container) {
    if (!state.pendingTreeTx) return;
    const banner = container.createDiv({ cls: 'sm-tree-tx-banner' });
    const text = banner.createDiv({ cls: 'sm-tree-tx-text' });
    const isDelete = state.pendingTreeTx.type === 'concept-delete';
    const isInvalid = state.pendingTreeTx.type === 'invalid';
    text.createDiv({
        cls: 'sm-tree-tx-title',
        text: isDelete
            ? '存在未完成的 Concept 删除事务'
            : isInvalid ? '事务控制记录无法解析' : '存在未完成的数据导入事务'
    });
    text.createDiv({ cls: 'sm-tree-tx-stage', text: `阶段：${state.pendingTreeTx.stage || '未知'}。完成恢复前，结构写入已暂停。` });
    if (isDelete) {
        createIconButton(banner, 'refresh-cw', '继续完成事务', () => void recoverPendingTreeTransaction(), { text: '继续' });
    } else if (isInvalid) {
        createIconButton(banner, 'shield-check', '验证一致性后解除损坏事务锁', () => clearInvalidTransactionLock(), { text: '验证并解除' });
    } else {
        createIconButton(banner, 'file-input', '选择原导入文件继续', () => importData(), { text: '选择文件继续' });
    }
}

function renderTreeView(container) {
    if (treeViewportPersistTimer != null) {
        window.clearTimeout(treeViewportPersistTimer);
        treeViewportPersistTimer = null;
    }
    container.innerHTML = '';
    container.className = 'sm-surface-panel sm-tree-surface';
    renderPendingTransactionBanner(container);
    if (state.conceptLoadError) {
        const error = container.createDiv({ cls: 'sm-tree-protection' });
        error.createDiv({ cls: 'sm-tree-protection-title', text: '共享 Concept 数据无法解析，当前只读保护' });
        error.createDiv({ text: state.conceptLoadError.message });
        return;
    }
    if (state.treeReadOnly) {
        const error = container.createDiv({ cls: 'sm-tree-protection' });
        error.createDiv({ cls: 'sm-tree-protection-title', text: '主体结构树无法解析，当前只读保护' });
        error.createDiv({ text: state.treeErrors.join(' · ') });
        return;
    }
    const toolbar = container.createDiv({ cls: 'sm-tree-toolbar' });
    createIconButton(toolbar, 'plus', '添加顶层结构', () => addTreeNode(null), { text: '顶层结构' });
    createIconButton(toolbar, 'clipboard', '复制主体结构 Markdown 目录', () => void copyTextToClipboard(buildSubjectStructureMarkdown(), '主体结构树'), { text: '复制目录' });
    createIconButton(toolbar, 'history', '查看主体结构节点说明草稿', () => openCommentDraftList('subject'), { text: '说明草稿' });
    const search = toolbar.createEl('input', {
        cls: 'sm-tree-search',
        attr: { type: 'search', placeholder: '搜索结构或 Concept…' }
    });
    search.value = state.treeUi.search || '';
    const searchHost = container.createDiv({ cls: 'sm-tree-search-host' });
    search.oninput = () => {
        state.treeUi.search = search.value.slice(0, 200);
        persistTreeUi({ search: state.treeUi.search });
        searchHost.empty();
        renderTreeSearchResults(searchHost, state.treeUi.search);
    };
    const zoomGroup = toolbar.createDiv({ cls: 'sm-tree-zoom-group' });
    createIconButton(toolbar, 'unfold-vertical', '展开全部结构', () => {
        state.treeUi.collapsedNodeIds = [];
        persistTreeUi({ collapsedNodeIds: [] });
        renderViewFn();
    });
    createIconButton(toolbar, 'fold-vertical', '折叠全部分支', () => {
        state.treeUi.collapsedNodeIds = Object.values(state.treeStore.nodesById)
            .filter(node => node.lifecycle === 'active' && treeModel.getChildren(state.treeStore, node.id, 'active').length)
            .map(node => node.id);
        persistTreeUi({ collapsedNodeIds: state.treeUi.collapsedNodeIds });
        renderViewFn();
    });
    createIconButton(zoomGroup, 'zoom-out', '缩小', () => {
        state.treeUi.zoom = Math.max(0.55, Math.round((state.treeUi.zoom - 0.1) * 100) / 100);
        persistTreeUi({ zoom: state.treeUi.zoom });
        renderViewFn();
    });
    const zoomReset = zoomGroup.createEl('button', { cls: 'sm-tree-zoom-value', text: `${Math.round(state.treeUi.zoom * 100)}%`, attr: { type: 'button', title: '恢复 100%' } });
    zoomReset.onclick = () => { state.treeUi.zoom = 1; persistTreeUi({ zoom: 1 }); renderViewFn(); };
    createIconButton(zoomGroup, 'zoom-in', '放大', () => {
        state.treeUi.zoom = Math.min(1.6, Math.round((state.treeUi.zoom + 0.1) * 100) / 100);
        persistTreeUi({ zoom: state.treeUi.zoom });
        renderViewFn();
    });
    if (state.treeUi.search) renderTreeSearchResults(searchHost, state.treeUi.search);

    const workspace = container.createDiv({ cls: 'sm-tree-workspace' });
    const viewport = workspace.createDiv({ cls: 'sm-tree-viewport' });
    requestAnimationFrame(() => {
        viewport.scrollLeft = Number(state.treeUi.viewportLeft || 0);
        viewport.scrollTop = Number(state.treeUi.viewportTop || 0);
    });
    viewport.onscroll = () => {
        if (treeViewportPersistTimer != null) window.clearTimeout(treeViewportPersistTimer);
        treeViewportPersistTimer = window.setTimeout(() => {
            persistTreeUi({ viewportLeft: viewport.scrollLeft, viewportTop: viewport.scrollTop });
            treeViewportPersistTimer = null;
        }, 160);
    };
    const canvas = viewport.createDiv({ cls: 'sm-tree-canvas' });
    canvas.style.setProperty('--sm-tree-zoom', String(state.treeUi.zoom || 1));
    const roots = treeModel.getChildren(state.treeStore, null, 'active');
    if (!roots.length) {
        const empty = canvas.createDiv({ cls: 'sm-tree-empty' });
        empty.createDiv({ cls: 'sm-tree-empty-title', text: '开始搭建 SuperMemo 主体结构' });
        empty.createDiv({ text: '结构节点独立于 Concept。先建立框架，再把已有 Concept 归属到合适的位置。' });
        createIconButton(empty, 'plus', '添加第一个结构', () => addTreeNode(null), { text: '添加第一个结构' });
    } else {
        const virtualRoot = canvas.createDiv({ cls: 'sm-tree-virtual-root' });
        virtualRoot.createDiv({ cls: 'sm-tree-virtual-root-label', text: 'SuperMemo 主体结构' });
        const rootRail = virtualRoot.createDiv({ cls: 'sm-structure-roots' });
        roots.forEach(root => renderTreeBranch(rootRail, root));
    }
    renderTreeInspector(workspace);
    renderArchivedTreeDrawer(container);
    flushPendingTreeReveal(container);
}

// Concept pages own membership only; shared Concepts and the subject tree remain global.
function parseConceptPages(raw) {
    const pages = raw == null ? { schemaVersion: 1, revision: 0, pagesById: {}, memberships: {}, draftsByView: {} } : JSON.parse(raw);
    const record = value => value && typeof value === 'object' && !Array.isArray(value);
    const safe = id => typeof id === 'string' && id.trim() && !['all', '__proto__', 'constructor', 'prototype'].includes(id);
    if (!record(pages) || pages.schemaVersion !== 1 || !Number.isSafeInteger(pages.revision) || pages.revision < 0
        || !record(pages.pagesById) || !record(pages.memberships) || !record(pages.draftsByView)) throw new Error('胶囊页面配置无效或版本不支持，原数据已保护。');
    const names = new Set();
    for (const [id, page] of Object.entries(pages.pagesById)) {
        if (!safe(id) || !record(page) || typeof page.label !== 'string' || !page.label.trim() || page.label.length > 160 || names.has(page.label)) throw new Error('胶囊页面名称或身份无效。');
        names.add(page.label);
    }
    if (!Object.hasOwn(pages.pagesById, 'default')) pages.pagesById.default = { label: '一般构型胶囊' };
    for (const [stableId, ids] of Object.entries(pages.memberships)) {
        if (!safe(stableId) || !Array.isArray(ids) || new Set(ids).size !== ids.length
            || ids.some(id => !safe(id) || !Object.hasOwn(pages.pagesById, id))) throw new Error('胶囊页面归属记录无效。');
    }
    for (const [id, value] of Object.entries(pages.draftsByView)) if (!safe(id) || typeof value !== 'string') throw new Error('胶囊页面草稿无效。');
    return pages;
}

function readConceptPages() { return parseConceptPages(localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY)); }

function freshConceptPageRoot() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw == null ? { concepts: {} } : parseSharedConceptRoot(raw);
}

function validateConceptPagesAgainstConcepts(pages, concepts, allowedMissing = '') {
    const ids = new Set();
    for (const concept of Object.values(concepts)) {
        const id = getConceptStableId(concept);
        if (!id) continue;
        if (ids.has(id)) throw new Error('Concept 稳定身份重复，页面写入已阻止。');
        ids.add(id);
    }
    for (const id of Object.keys(pages.memberships)) if (!ids.has(id) && id !== allowedMissing) throw new Error('页面归属引用了不存在的 Concept，请先恢复事务或检查导入。');
    return pages;
}

function mutateConceptPages(mutator, reason, recoveryStableId = '') {
    if (!recoveryStableId) assertTreeMutationAllowed('concept-pages:' + reason);
    else if (state.pendingTreeTx?.type !== 'concept-delete' || state.pendingTreeTx.stableId !== recoveryStableId) throw new Error('页面恢复身份不匹配。');
    if (!recoveryStableId && localStorage.getItem(TREE_TX_STORAGE_KEY) != null) throw new Error('存在未完成事务，请先恢复。');
    const before = localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY);
    const conceptBefore = localStorage.getItem(STORAGE_KEY);
    const pages = validateConceptPagesAgainstConcepts(readConceptPages(), freshConceptPageRoot().concepts, recoveryStableId);
    if (mutator(pages) === false) return pages;
    pages.revision += 1;
    const serialized = JSON.stringify(pages);
    parseConceptPages(serialized);
    if (localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY) !== before || localStorage.getItem(STORAGE_KEY) !== conceptBefore) throw new Error('另一视图已更新胶囊或页面，请重新操作。');
    localStorage.setItem(CONCEPT_PAGES_STORAGE_KEY, serialized);
    if (localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY) !== serialized) throw new Error('胶囊页面保存回读失败，请保留输入并重试。');
    console.info('[SuperMemo Concept Display][concept-page-commit]', { reason, revision: pages.revision, status: 'PASS' });
    return pages;
}

function conceptPageIds(pages, concept) {
    const id = getConceptStableId(concept);
    return id && Object.hasOwn(pages.memberships, id) ? [...pages.memberships[id]] : ['default'];
}

function setConceptPageMembership(conceptId, pageId, checked) {
    assertTreeMutationAllowed('concept-page-membership');
    if (localStorage.getItem(TREE_TX_STORAGE_KEY) != null) throw new Error('存在未完成事务，请先恢复。');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== state.conceptSourceRaw) throw new Error('Concept 已变化，请重新打开视图后操作。');
    const pages = validateConceptPagesAgainstConcepts(readConceptPages(), freshConceptPageRoot().concepts);
    if (!Object.hasOwn(pages.pagesById, pageId) || !state.concepts[conceptId]) throw new Error('页面或胶囊不存在。');
    const stableId = ensureConceptStableId(conceptId);
    return mutateConceptPages(latest => {
        const concept = freshConceptPageRoot().concepts[conceptId];
        if (getConceptStableId(concept) !== stableId) throw new Error('Concept 身份已变化。');
        if (!Object.hasOwn(latest.pagesById, pageId)) throw new Error('页面不存在。');
        const ids = new Set(conceptPageIds(latest, concept));
        checked ? ids.add(pageId) : ids.delete(pageId);
        const next = [...ids];
        if (Object.hasOwn(latest.memberships, stableId) && JSON.stringify(latest.memberships[stableId]) === JSON.stringify(next)) return false;
        latest.memberships[stableId] = next;
    }, 'membership');
}

function removeDeletedConceptPageMembership(stableId) {
    const pages = readConceptPages();
    if (Object.hasOwn(pages.memberships, stableId)) mutateConceptPages(next => { delete next.memberships[stableId]; }, 'delete-membership', stableId);
    validateConceptPagesAgainstConcepts(readConceptPages(), freshConceptPageRoot().concepts);
    if (Object.hasOwn(readConceptPages().memberships, stableId)) throw new Error('删除后页面归属仍存在。');
}

function changeConceptPageName(pageId, value) {
    const label = String(value || '').trim();
    if (!label || label.length > 160) throw new Error('请输入 1–160 字的页面名称。');
    if (pageId === 'all') throw new Error('全部胶囊是聚合视图，不能改名。');
    const id = pageId || treeModel.createId('concept_page');
    mutateConceptPages(pages => {
        if (pageId && !Object.hasOwn(pages.pagesById, id)) throw new Error('页面不存在。');
        if (Object.entries(pages.pagesById).some(([key, page]) => key !== id && page.label === label)) throw new Error('已有同名页面。');
        if (pages.pagesById[id]?.label === label) return false;
        pages.pagesById[id] = { ...pages.pagesById[id], label };
        delete pages.draftsByView[conceptPageViewId];
    }, pageId ? 'rename' : 'create');
    conceptPageDraft = null;
    persistTreeUi({ conceptPageId: id });
    return id;
}

function buildConceptPageProjection(pages, pageId, concepts = state.concepts) {
    const direct = new Set(Object.values(concepts).filter(c => pageId === 'all' || conceptPageIds(pages, c).includes(pageId)).map(c => c.id));
    const visible = new Set(direct);
    for (const id of direct) {
        const seen = new Set([id]);
        let parent = concepts[id]?.parentId;
        while (parent && concepts[parent] && !seen.has(parent)) {
            visible.add(parent); seen.add(parent); parent = concepts[parent].parentId;
        }
    }
    return { direct, visible, context: new Set([...visible].filter(id => !direct.has(id))) };
}

function renderConceptPagePicker(container) {
    const id = conceptPageEditingId;
    if (!id) return;
    const panel = container.createDiv({ cls: 'sm-meaning-project-picker sm-concept-page-picker' });
    const concept = state.concepts[id];
    const header = panel.createDiv({ cls: 'sm-meaning-project-picker-header' });
    header.createEl('strong', { text: `页面归属 · ${concept?.keyword || '胶囊已删除'}` });
    header.createEl('button', { text: '完成' }).onclick = () => { conceptPageEditingId = null; renderViewFn?.(); };
    panel.createDiv({ cls: 'sm-meaning-project-help', text: '可多选，勾选即保存；未勾选时仅在“全部胶囊”显示。各页面共享内容和主体结构树挂载。' });
    if (!concept) return;
    try {
        const pages = readConceptPages();
        const selected = conceptPageIds(pages, concept);
        const list = panel.createDiv({ cls: 'sm-meaning-project-checks' });
        const status = panel.createDiv({ cls: 'sm-meaning-project-help', attr: { 'aria-live': 'polite' } });
        const inputs = [];
        Object.entries(pages.pagesById).forEach(([pageId, page]) => {
            const row = list.createEl('label', { cls: 'sm-meaning-project-choice' });
            const input = row.createEl('input', { attr: { type: 'checkbox' } });
            row.createSpan({ text: page.label }); input.checked = selected.includes(pageId); inputs.push([input, pageId]);
            input.onchange = () => {
                try {
                    const latest = setConceptPageMembership(id, pageId, input.checked);
                    const ids = conceptPageIds(latest, state.concepts[id]);
                    inputs.forEach(([box, key]) => { box.checked = ids.includes(key); });
                    status.textContent = '已保存；点击完成更新当前页面';
                } catch (error) { input.checked = !input.checked; status.textContent = `未保存：${error.message}`; }
            };
        });
    } catch (error) { panel.createDiv({ text: error.message }); }
}

function renderConceptPageToolbar(container) {
    const toolbar = container.createDiv({ cls: 'sm-concept-pages-toolbar' });
    let pages;
    try { pages = readConceptPages(); }
    catch (error) { toolbar.createDiv({ cls: 'sm-tree-protection', text: error.message }); return null; }
    const current = state.treeUi.conceptPageId || 'default';
    const id = current === 'all' || Object.hasOwn(pages.pagesById, current) ? current : 'default';
    const select = toolbar.createEl('select', { cls: 'sm-meaning-project-select', attr: { 'aria-label': '胶囊页面' } });
    select.createEl('option', { text: '全部胶囊', attr: { value: 'all' } });
    Object.entries(pages.pagesById).forEach(([key, page]) => select.createEl('option', { text: page.label, attr: { value: key } }));
    select.value = id;
    select.onchange = () => { persistTreeUi({ conceptPageId: select.value }); renderViewFn?.(); };
    const rename = toolbar.createEl('button', { text: '改名', attr: { type: 'button' } });
    rename.disabled = id === 'all';
    rename.onclick = async () => {
        const next = await promptTreeLabel('修改胶囊页面名称', readConceptPages().pagesById[id]?.label || '');
        if (next == null) return;
        try { changeConceptPageName(id, next); renderViewFn?.(); } catch (error) { new Notice(error.message); }
    };
    const name = toolbar.createEl('input', { cls: 'sm-meaning-project-name', attr: { placeholder: '新页面名称', 'aria-label': '新胶囊页面名称', maxlength: '160' } });
    name.value = conceptPageDraft ?? pages.draftsByView[conceptPageViewId] ?? '';
    const status = toolbar.createSpan({ cls: 'sm-meaning-project-help', attr: { 'aria-live': 'polite' } });
    name.oninput = () => {
        conceptPageDraft = name.value;
        try { mutateConceptPages(p => { p.draftsByView[conceptPageViewId] = name.value; }, 'name-draft'); status.textContent = ''; }
        catch (error) { status.textContent = `草稿未保存：${error.message}`; }
    };
    const add = toolbar.createEl('button', { text: '＋新增页面', attr: { type: 'button' } });
    add.onclick = () => { try { changeConceptPageName(null, name.value); renderViewFn?.(); } catch (error) { status.textContent = error.message; } };
    name.onkeydown = event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault?.(); add.onclick(); } };
    const drafts = Object.entries(pages.draftsByView).filter(([key, value]) => key !== conceptPageViewId && value.trim());
    if (drafts.length) {
        const recover = toolbar.createEl('select', { attr: { 'aria-label': '恢复胶囊页面名称草稿' } });
        recover.createEl('option', { text: '恢复页面名草稿…', attr: { value: '' } });
        drafts.forEach(([key, value]) => recover.createEl('option', { text: value, attr: { value: key } }));
        recover.onchange = () => {
            if (!recover.value) return;
            try {
                const draft = readConceptPages().draftsByView[recover.value] || '';
                if (name.value.trim() && name.value !== draft) throw new Error('请先保存当前页面名或明确清空，再恢复其他草稿。');
                mutateConceptPages(p => { p.draftsByView[conceptPageViewId] = draft; }, 'recover-draft');
                name.value = draft; conceptPageDraft = draft;
            } catch (error) { status.textContent = error.message; }
        };
    }
    return { pages, id };
}

// ============ 展示视图 ============

function renderDisplayView(container) {
    container.innerHTML = '';
    container.className = 'sm-surface-panel sm-container';

    const selection = renderConceptPageToolbar(container);
    let projection = selection ? buildConceptPageProjection(selection.pages, selection.id) : null;
    const assignedOnly = state.treeUi.conceptTreeAssignedOnly === true;
    if (assignedOnly) {
        const direct = new Set(Object.values(state.concepts)
            .filter(c => (!projection || projection.direct.has(c.id)) && isConceptAssignedToExistingTreeNode(c))
            .map(c => c.id));
        // A hidden parent does not hide a matching child or change its stored parent.
        projection = { direct, visible: new Set(direct), context: new Set() };
    }

    // 图例
    const legend = container.createEl('div', { cls: 'sm-legend' });
    legend.innerHTML = `
        <span class="sm-legend-item sm-legend-yaml"><span>${COLORS.yaml.icon}</span> 顶层 (蓝色)</span>
        <span class="sm-legend-item sm-legend-plus"><span>${COLORS.plus.icon}</span> 子级 (橙色)</span>
        <span class="sm-legend-item sm-legend-dot"><span>${COLORS.dot.icon}</span> 孙级及更深 (紫色)</span>
    `;

    // 工具栏
    const toolbar = container.createEl('div', { cls: 'sm-toolbar' });

    const manageBtn = toolbar.createEl('button', { text: '⚙️ 管理概念' });
    manageBtn.onclick = () => {
        state.managerMode = true;
        renderViewFn();
    };

    const exportBtn = toolbar.createEl('button', { text: '💾 导出', cls: 'secondary' });
    exportBtn.onclick = exportData;

    const importBtn = toolbar.createEl('button', { text: '📥 导入', cls: 'secondary' });
    importBtn.onclick = importData;

    const filterLabel = toolbar.createEl('label', { cls: 'sm-meaning-project-choice' });
    const filter = filterLabel.createEl('input', { attr: { type: 'checkbox', 'aria-label': '只看已挂主体结构树' } });
    filter.checked = assignedOnly;
    filterLabel.createSpan({ text: '只看已挂主体结构树' });
    filterLabel.title = '与当前页面共同筛选；包含已归档节点的挂接，不含结构失联。未匹配父级隐藏，原有父子关系不变。';
    filter.onchange = () => { persistTreeUi({ conceptTreeAssignedOnly: filter.checked }); renderViewFn?.(); };
    if (assignedOnly && state.treeErrors.length) {
        container.createDiv({ cls: 'sm-tree-protection', text: '主体结构树数据读取或校验异常，筛选结果可能不完整。请取消筛选查看全部，并到主体结构树检查；原始数据未改写。' });
    }

    const concepts = Object.values(state.concepts).filter(c => !projection || projection.visible.has(c.id));
    renderKeywordPanel(container);

    if (concepts.length === 0) {
        container.createEl('div', { cls: 'sm-empty', text: assignedOnly
            ? '当前页面没有符合条件的已挂树胶囊。取消“只看已挂主体结构树”可恢复显示，或切换“全部胶囊”。'
            : '此页面暂无胶囊。可切换“全部胶囊”，通过胶囊的“页面归属”加入；或在“管理概念”中新建。' });
        return;
    }

    const topDropZone = container.createEl('div', {
        cls: 'sm-display-drop-zone',
        text: '拖到这里可直接恢复为顶层'
    });
    topDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        topDropZone.classList.add('active');
    });
    topDropZone.addEventListener('dragleave', () => {
        topDropZone.classList.remove('active');
    });
    topDropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        topDropZone.classList.remove('active');
        const draggedId = state.dragId;
        if (!draggedId || !state.concepts[draggedId] || state.concepts[draggedId].parentId === null) return;
        await moveConceptToParent(draggedId, null, '✅ 已移动到顶层');
    });

    // 按字母分组
    const groups = {};
    const letters = [];
    concepts.forEach(c => {
        if (c.parentId && (!projection || projection.visible.has(c.parentId))) return;
        const letter = c.sortLetter || getSortLetter(c.keyword || '');
        if (!groups[letter]) {
            groups[letter] = [];
            letters.push(letter);
        }
        groups[letter].push(c);
    });
    letters.sort();

    // 字母导航
    const nav = container.createEl('div', { cls: 'sm-alphabet-nav' });
    letters.forEach(l => {
        const link = nav.createEl('a', { cls: 'sm-letter-link', text: l });
        link.onclick = () => {
            document.getElementById(`sm-group-${l}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
    });

    // 内容区
    const content = container.createEl('div', { cls: 'sm-nest-container' });

    letters.forEach(letter => {
        const header = content.createEl('h4', { cls: 'sm-group-header', text: letter });
        header.id = `sm-group-${letter}`;

        const groupContainer = content.createEl('div', { cls: 'sm-group-content' });

        // 获取该字母组的顶层概念
        const topLevelInGroup = groups[letter];
        topLevelInGroup.sort(compareConceptOrder);

        topLevelInGroup.forEach(c => {
            renderCapsule(groupContainer, c, 1, projection);
        });
    });

    // 统计
    const stats = container.createEl('div', { cls: 'sm-stats' });
    stats.textContent = assignedOnly
        ? `本页已挂主体结构树 ${projection.direct.size} 个胶囊（含已归档挂接）；全局共 ${Object.keys(state.concepts).length} 个胶囊`
        : `本页 ${projection?.direct.size ?? concepts.length} 个胶囊，${projection?.context.size || 0} 个父级上下文；全局共 ${Object.keys(state.concepts).length} 个胶囊，共用主体结构树`;
    flushPendingConceptCapsuleReveal(container);
}

// 渲染单个胶囊（展示视图）- 支持多层级不同颜色
function renderCapsule(container, concept, level = 1, projection = null) {
    const children = getChildConcepts(concept.id).filter(child => !projection || projection.visible.has(child.id));
    const hasChildren = children.length > 0;
    const isCollapsed = !projection?.context.has(concept.id) && !!state.collapsedIds[concept.id];
    const visual = getConceptVisual(concept, level);
    const color = visual.semanticColor;
    const treeAssignment = getConceptTreeAssignmentPresentation(concept);
    const treeAssigned = treeAssignment.kind !== 'none';

    const capsule = container.createEl('div', {
        cls: `sm-capsule level-${visual.displayLevel}${hasChildren ? '' : ' is-leaf'}${hasChildren && isCollapsed ? ' is-collapsed' : ''}${treeAssigned ? ' is-tree-assigned' : ''}${treeAssignment.kind === 'archived' ? ' is-tree-archived' : ''}${treeAssignment.kind === 'missing' ? ' is-tree-missing' : ''}`,
        attr: {
            'data-concept-id': concept.id,
            style: `
                --sm-accent: ${visual.accent};
                --sm-accent-contrast: ${visual.accentContrast};
                --sm-frame-border: ${withHexAlpha(visual.accent, '38') || visual.levelColor.border};
                --sm-frame-border-hover: ${withHexAlpha(visual.accent, '72') || visual.levelColor.border};
                --sm-frame-shadow: ${visual.levelColor.shadow};
                --sm-frame-shadow-hover: ${withHexAlpha(visual.accent, '26') || visual.levelColor.shadow};
                --sm-frame-bg-strong: ${visual.levelColor.bg};
                --sm-frame-bg-soft: ${withHexAlpha(visual.accent, '08') || 'rgba(255,255,255,0.04)'};
                --sm-frame-ring: ${withHexAlpha(visual.accent, '1a') || 'rgba(var(--interactive-accent-rgb), 0.10)'};
                --sm-chip-border: ${withHexAlpha(visual.accent, '42') || 'var(--background-modifier-border)'};
                --sm-chip-border-hover: ${withHexAlpha(visual.accent, '72') || 'var(--background-modifier-border)'};
                --sm-chip-bg: ${withHexAlpha(visual.accent, '12') || 'var(--background-primary)'};
                --sm-chip-bg-strong: ${withHexAlpha(visual.accent, '1d') || 'var(--background-secondary)'};
                --sm-chip-fg: ${visual.accent};
                --sm-children-bg: ${withHexAlpha(visual.accent, '0a') || 'rgba(255,255,255,0.28)'};
            `
        }
    });
    if (hasChildren && isCollapsed) {
        capsule.dataset.collapsedLabel = `已折叠 ${children.length}`;
    }

    const row = capsule.createEl('div', { cls: 'sm-capsule-row' });
    const node = row.createEl('div', {
        cls: 'sm-capsule-node',
        attr: { draggable: 'true', title: '左侧插到前面，中间成为子级，右侧插到后面' }
    });
    node.addEventListener('dragstart', (e) => {
        state.dragId = concept.id;
        node.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', concept.id);
    });
    node.addEventListener('dragend', () => {
        state.dragId = null;
        node.classList.remove('dragging');
        clearConceptDropIndicator(node);
    });
    node.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.dragId || state.dragId === concept.id) return;
        const position = getConceptDropPosition(e, node);
        applyConceptDropIndicator(node, position);
    });
    node.addEventListener('dragleave', () => {
        clearConceptDropIndicator(node);
    });
    node.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const position = getConceptDropPosition(e, node);
        clearConceptDropIndicator(node);
        const draggedId = state.dragId;
        if (!draggedId || draggedId === concept.id) return;
        const actionLabel = position === 'child'
            ? `✅ 已移动到 "${concept.keyword}" 下`
            : `✅ 已移动到 "${concept.keyword}" ${position === 'before' ? '前面' : '后面'}`;
        await moveConceptRelative(draggedId, concept.id, position, actionLabel);
    });

    const header = node.createEl('button', {
        cls: 'sm-capsule-header',
        attr: { title: '点击编辑记录/评论' }
    });
    header.onclick = (e) => {
        e.stopPropagation();
        if (e.target?.closest?.('.sm-capsule-action')) {
            return;
        }
        if (e.target?.closest?.('.sm-capsule-expand')) {
            if (hasChildren && !projection?.context.has(concept.id)) {
                state.collapsedIds[concept.id] = !isCollapsed;
                renderViewFn();
            }
            return;
        }
        openNoteModal(concept.id);
    };

    header.createEl('span', { cls: 'sm-capsule-icon', text: color.icon, style: `color: ${color.text};` });
    header.createEl('span', { cls: 'sm-capsule-label', text: concept.keyword });
    if (hasChildren && !projection?.context.has(concept.id)) {
        header.createEl('span', {
            cls: 'sm-capsule-expand',
            text: isCollapsed ? '▶' : '▼',
            attr: { title: isCollapsed ? '展开子概念' : '收起子概念' }
        });
        if (isCollapsed) {
            header.createEl('span', {
                cls: 'sm-capsule-collapsed-badge',
                text: `${children.length} 个子级`
            });
        }
    }

    if (concept.note && concept.note.trim()) {
        const noteMeta = node.createEl('span', { cls: 'sm-capsule-meta' });
        noteMeta.createEl('span', { cls: 'sm-capsule-note', text: '📝', attr: { title: '有记录' } });
    }

    if (treeAssigned) {
        const detail = treeAssignment.path
            ? `主体结构树归属：${treeAssignment.path}`
            : '主体结构树归属记录已失联';
        header.createEl('span', {
            cls: `sm-capsule-tree-badge${treeAssignment.kind === 'archived' ? ' is-archived' : ''}${treeAssignment.kind === 'missing' ? ' is-missing' : ''}`,
            text: treeAssignment.label,
            attr: { title: detail, 'aria-label': detail }
        });
    }

    const actions = header.createEl('span', {
        cls: 'sm-capsule-actions',
        attr: { title: '概念操作' }
    });

    const addSiblingBtn = actions.createEl('span', {
        cls: 'sm-capsule-action',
        text: '+',
        attr: { title: '添加平级概念' }
    });
    addSiblingBtn.onclick = (e) => {
        e.stopPropagation();
        openCreateModal(concept.parentId || null);
    };

    const addChildBtn = actions.createEl('span', {
        cls: 'sm-capsule-action',
        text: '↳',
        attr: { title: '添加子概念' }
    });
    addChildBtn.onclick = (e) => {
        e.stopPropagation();
        openCreateModal(concept.id);
    };

    const editBtn = actions.createEl('span', {
        cls: 'sm-capsule-action',
        text: '✏',
        attr: { title: '编辑当前概念' }
    });
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(concept.id);
    };

    const treeBtn = actions.createEl('span', {
        cls: `sm-capsule-action sm-capsule-tree-action${treeAssigned ? ' is-assigned' : ''}`,
        text: '⌘',
        attr: {
            title: treeAssignment.kind === 'missing'
                ? '主体结构归属已失联'
                : treeAssigned
                    ? `在主体结构树中定位${treeAssignment.path ? `：${treeAssignment.path}` : ''}`
                    : '在主体结构树中归属'
        }
    });
    treeBtn.onclick = (e) => {
        e.stopPropagation();
        revealConceptInTree(concept.id);
    };

    if (projection?.context.has(concept.id)) actions.createSpan({ cls: 'sm-concept-context-badge', text: '父级上下文' });
    const pageBtn = actions.createEl('span', { cls: 'sm-capsule-action sm-concept-page-action', text: '▣', attr: { title: '页面归属（可多选）', 'aria-label': `页面归属 · ${concept.keyword}`, role: 'button', tabindex: '0' } });
    pageBtn.onclick = event => { event.stopPropagation(); conceptPageEditingId = concept.id; renderViewFn?.(); };
    pageBtn.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pageBtn.onclick(event); } };

    // 子概念容器
    if (hasChildren && !isCollapsed) {
        const childrenContainer = capsule.createEl('div', { cls: 'sm-capsule-children' });
        children.forEach(child => {
            renderCapsule(childrenContainer, child, level + 1, projection);
        });
    }
}

function openNoteModal(conceptId) {
    const concept = state.concepts[conceptId];
    if (!concept) return;

    const overlay = rootContainer.createEl('div', { cls: 'sm-modal-overlay' });
    overlay.addEventListener('click', () => overlay.remove());

    const modal = overlay.createEl('div', { cls: 'sm-modal sm-note-modal' });
    modal.addEventListener('click', (e) => e.stopPropagation());

    const header = modal.createEl('div', { cls: 'sm-modal-header' });
    header.createEl('span', { text: `📝 记录 - ${concept.keyword}` });
    const closeBtn = header.createEl('button', { text: '×', attr: { style: 'background: none; border: none; cursor: pointer; font-size: 16px;' } });
    closeBtn.onclick = () => overlay.remove();

    const body = modal.createEl('div', { cls: 'sm-modal-body' });
    const textarea = body.createEl('textarea', {
        cls: 'sm-note-textarea',
        attr: { maxlength: '1000', placeholder: '写下评论或记录（最多1000字）...' }
    });
    textarea.value = concept.note || '';
    const count = body.createEl('div', { cls: 'sm-note-count', text: `${textarea.value.length}/1000` });

    textarea.addEventListener('input', () => {
        count.textContent = `${textarea.value.length}/1000`;
    });

    const footer = modal.createEl('div', { cls: 'sm-modal-footer' });
    const cancelBtn = footer.createEl('button', { text: '取消' });
    cancelBtn.onclick = () => overlay.remove();
    const saveBtn = footer.createEl('button', { text: '保存', attr: { style: 'color: var(--interactive-accent); font-weight: 600;' } });
    saveBtn.onclick = async () => {
        concept.note = textarea.value.trim();
        await saveData();
        overlay.remove();
        renderViewFn();
        new Notice('✅ 已保存记录');
    };

    textarea.focus();
}

// ============ 管理视图 ============

function renderManagerView(container) {
    container.innerHTML = '';
    container.className = 'sm-surface-panel sm-mgr-container';

    // 头部
    const header = container.createEl('div', { cls: 'sm-mgr-header' });
    header.createEl('div', { cls: 'sm-mgr-title', text: '🔑 Concept 管理器' });

    const headerActions = header.createEl('div', { cls: 'sm-mgr-actions' });
    const exitBtn = headerActions.createEl('button', { text: '返回展示视图', cls: 'sm-toolbar button secondary' });
    exitBtn.style.cssText = 'padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; background: var(--background-modifier-border); color: var(--text-normal);';
    exitBtn.onclick = () => {
        state.managerMode = false;
        renderViewFn();
    };

    // 统计 (隐藏)
    const concepts = Object.values(state.concepts);
    const topCount = concepts.filter(c => !c.parentId).length;
    const stats = container.createEl('div', { cls: 'sm-mgr-stats' });
    stats.style.display = 'none'; // 隐藏统计

    // 添加表单
    const formContainer = container.createEl('div', { cls: 'sm-form visible' });
    formContainer.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 12px;">➕ 添加新概念</div>
        <div class="sm-form-row">
            <label class="sm-form-label">名称:</label>
            <input type="text" id="sm-new-keyword" class="sm-form-input" placeholder="输入概念名称...">
        </div>
        <div class="sm-form-row">
            <label class="sm-form-label">父级:</label>
            <div id="sm-new-parent-selector" class="sm-parent-selector"></div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 15px;">
            <button id="sm-add-btn" class="sm-mgr-item-btn" style="background: var(--interactive-accent); color: var(--text-on-accent); border: none;">添加</button>
        </div>
    `;
    document.getElementById('sm-add-btn').onclick = addConcept;
    document.getElementById('sm-new-keyword').onkeydown = (e) => { if (e.key === 'Enter') addConcept(); };

    // 初始化父级选择器
    initParentSelector('sm-new-parent-selector', null, (id) => {});

    // 顶层拖放区
    const treeContainer = container.createEl('div');
    const topDropZone = treeContainer.createEl('div', { cls: 'sm-mgr-drop-zone' });

    topDropZone.addEventListener('dragover', (e) => { e.preventDefault(); topDropZone.classList.add('active'); });
    topDropZone.addEventListener('dragleave', () => { topDropZone.classList.remove('active'); });
    topDropZone.addEventListener('drop', async (e) => {
        e.preventDefault(); e.stopPropagation(); topDropZone.classList.remove('active');
        const draggedId = state.dragId;
        if (!draggedId || !state.concepts[draggedId] || state.concepts[draggedId].parentId === null) return;
        await moveConceptToParent(draggedId, null, '✅ 已移动到顶层');
    });

    // 只获取顶层概念进行分组渲染（子概念由递归函数处理）
    const topLevelConcepts = concepts.filter(c => !c.parentId);
    const groups = {};
    topLevelConcepts.forEach(c => {
        const letter = c.sortLetter || '#';
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(c);
    });

    Object.keys(groups).sort().forEach(letter => {
        const groupHeader = treeContainer.createEl('div', {
            text: letter,
            attr: { style: 'font-weight: 600; color: var(--text-muted); margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--background-modifier-border);' }
        });

        groups[letter].sort(compareConceptOrder).forEach(c => {
            renderManagerItem(treeContainer, c);  // 只渲染顶层概念，子概念递归渲染
        });
    });
}

// 渲染管理项 (移除统计信息)
function renderManagerItem(container, concept) {
    const children = getChildConcepts(concept.id);
    const hasChildren = children.length > 0;
    const isCollapsed = !!state.collapsedIds[concept.id];
    const colorType = concept.colorType || 'yaml';
    const color = COLORS[colorType];

    const item = container.createEl('div', {
        cls: `sm-mgr-item${hasChildren && isCollapsed ? ' is-collapsed' : ''}`,
        attr: { draggable: 'true', 'data-kw-id': concept.id }
    });
    if (hasChildren && isCollapsed) {
        item.dataset.collapsedLabel = `已折叠 ${children.length}`;
    }

    // 拖拽事件
    item.addEventListener('dragstart', (e) => {
        state.dragId = concept.id;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', concept.id);
    });
    item.addEventListener('dragend', () => {
        state.dragId = null;
        item.classList.remove('dragging');
        clearConceptDropIndicator(item);
    });
    item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!state.dragId || state.dragId === concept.id) return;
        const position = getConceptDropPosition(e, item);
        applyConceptDropIndicator(item, position);
    });
    item.addEventListener('dragleave', () => {
        clearConceptDropIndicator(item);
    });
    item.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const position = getConceptDropPosition(e, item);
        clearConceptDropIndicator(item);
        const draggedId = state.dragId;
        if (!draggedId || draggedId === concept.id || !state.concepts[draggedId]) return;
        const actionLabel = position === 'child'
            ? `✅ 已移动到 "${concept.keyword}" 下`
            : `✅ 已移动到 "${concept.keyword}" ${position === 'before' ? '前面' : '后面'}`;
        await moveConceptRelative(draggedId, concept.id, position, actionLabel);
    });

    const toggleBtn = item.createEl('button', {
        cls: `sm-mgr-item-toggle${hasChildren ? '' : ' is-placeholder'}`,
        text: hasChildren ? (isCollapsed ? '▶' : '▼') : '•',
        attr: { title: hasChildren ? (isCollapsed ? '展开子概念' : '收起子概念') : '无子概念' }
    });
    if (hasChildren) {
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            state.collapsedIds[concept.id] = !isCollapsed;
            renderViewFn();
        };
    } else {
        toggleBtn.disabled = true;
    }

    // 图标
    const icon = item.createEl('div', { cls: 'sm-mgr-item-icon', text: color.icon, attr: { style: `color: ${color.text};` } });

    // 信息 (只保留名称)
    const info = item.createEl('div', { cls: 'sm-mgr-item-info' });
    info.createEl('div', { cls: 'sm-mgr-item-label', text: concept.keyword });
    if (hasChildren && isCollapsed) {
        info.createEl('div', {
            cls: 'sm-mgr-item-state',
            text: `已收起 ${children.length} 个直接子概念`
        });
    }
    // INFO: 移除 meta 信息（如子级计数）

    // 操作按钮
    const actions = item.createEl('div', { cls: 'sm-mgr-item-actions' });

    const editBtn = actions.createEl('button', { text: '✏️', cls: 'sm-mgr-item-btn', attr: { title: '编辑' } });
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(concept.id);
    };

    const deleteBtn = actions.createEl('button', { text: '🗑️', cls: 'sm-mgr-item-btn delete', attr: { title: '删除' } });
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteConcept(concept.id);
    };

    // 递归渲染子概念
    if (hasChildren && !isCollapsed) {
        const childContainer = container.createEl('div', { cls: 'sm-mgr-children' });
        children.forEach(child => {
            renderManagerItem(childContainer, child);
        });
    }
}

// ============ 管理操作 ============

async function addConcept() {
    const input = document.getElementById('sm-new-keyword');
    const selector = window._smParentSelector;
    const keyword = input.value.trim();
    const parentId = selector ? selector.selectedParentId : null;
    const created = await createConceptRecord(keyword, parentId);
    if (!created) return;

    input.value = '';
    if (selector) selector.setSelected('');
    renderViewFn();
    new Notice('✅ 已添加');
}

async function deleteConcept(id) {
    if (!confirm('确定要删除这个概念吗？其子概念将变为顶层。')) return;
    if (state.pendingTreeTx) {
        new Notice('请先完成顶部显示的未完成事务。');
        return;
    }
    const concept = state.concepts[id];
    if (!concept) return;
    const stableId = getConceptStableId(concept);
    const hasAssignment = stableId && !!state.treeStore.conceptAssignments[stableId];
    let hasPageMembership;
    try {
        assertTreeMutationAllowed('delete-concept');
        if (localStorage.getItem(STORAGE_KEY) !== state.conceptSourceRaw) throw new Error('Concept 已变化，请重新打开视图后删除。');
        if (localStorage.getItem(TREE_TX_STORAGE_KEY) != null) throw new Error('请先恢复未完成事务。');
        const root = freshConceptPageRoot();
        if (!root.concepts[id] || getConceptStableId(root.concepts[id]) !== stableId) throw new Error('Concept 身份已变化，未删除。');
        const pages = validateConceptPagesAgainstConcepts(readConceptPages(), root.concepts);
        hasPageMembership = stableId && Object.hasOwn(pages.memberships, stableId);
    } catch (error) { new Notice(`未删除：${error.message}`); return; }
    const needsTransaction = hasAssignment || hasPageMembership;
    const conceptsBefore = treeModel.deepClone(state.concepts);
    const keywordsBefore = treeModel.deepClone(state.conceptKeywordIndex);
    try {
        if (needsTransaction) {
            const tx = treeModel.createDeleteTransaction({
                conceptId: id,
                stableId,
                expectedTreeRevision: state.treeStore.revision
            });
            persistPendingTransaction(tx);
        }
        applyConceptDeletionInMemory(id);
        await saveData(needsTransaction ? state.pendingTreeTx : null);
        if (needsTransaction) {
            await recoverPendingTreeTransaction();
        } else {
            renderViewFn();
            new Notice('✅ 已删除');
        }
    } catch (error) {
        state.concepts = conceptsBefore;
        state.conceptKeywordIndex = keywordsBefore;
        console.error('[SuperMemo Concept Display][concept-delete-failed]', {
            conceptId: id,
            code: error?.code || 'CONCEPT_DELETE_FAILED',
            message: error?.message || String(error),
            txId: state.pendingTreeTx?.txId || null,
            txStage: state.pendingTreeTx?.stage || null
        });
        new Notice(`删除尚未完成：${error?.message || error}`);
        renderViewFn();
    }
}

function openEditModal(id) {
    const concept = state.concepts[id];
    if (!concept) return;
    const defaultAccent = normalizeConceptAccentColor(concept.accentColor || '') || getConceptVisual(concept).accent;
    const keywordText = getConceptKeywords(id)
        .join('\n')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const modalHtml = `
        <div class="sm-modal-overlay" id="sm-edit-modal">
            <div class="sm-modal" onclick="event.stopPropagation()">
                <div class="sm-modal-header">
                    <span>✏️ 编辑概念</span>
                    <button onclick="closeEditModal()" style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
                </div>
                <div style="padding: 16px;">
                    <div class="sm-form-row">
                        <label class="sm-form-label">名称:</label>
                        <input type="text" id="sm-edit-keyword" class="sm-form-input" value="${concept.keyword.replace(/"/g, '&quot;')}">
                    </div>
                    <div class="sm-form-row">
                        <label class="sm-form-label">父级:</label>
                        <div id="sm-edit-parent-selector" class="sm-parent-selector"></div>
                    </div>
                    <div class="sm-form-row">
                        <label class="sm-form-label">颜色:</label>
                        <input type="color" id="sm-edit-accent-color" class="sm-form-input" value="${defaultAccent}">
                    </div>
                    <div class="sm-form-row">
                        <label class="sm-form-label">关键词:</label>
                        <textarea id="sm-edit-keywords" class="sm-form-input sm-keyword-textarea" placeholder="每行一个关键词">${keywordText}</textarea>
                        <div class="sm-form-help">一个关键词只能对应一个 concept；一个 concept 可以有多个关键词。</div>
                    </div>
                    <div class="sm-form-help">这个颜色会用于 concept 胶囊的特征化显示。</div>
                </div>
                <div class="sm-modal-footer">
                    <button onclick="closeEditModal()">取消</button>
                    <button onclick="saveEdit('${id}')" style="color: var(--interactive-accent); font-weight: 600;">保存</button>
                </div>
            </div>
        </div>
    `;

    const container = rootContainer;
    const wrapper = container.createEl('div');
    wrapper.innerHTML = modalHtml;
    const modalEl = document.getElementById('sm-edit-modal');
    modalEl.dataset.selectedParentId = concept.parentId || '';
    document.getElementById('sm-edit-modal').addEventListener('click', window.closeEditModal);


    // 初始化父级选择器
    initParentSelector('sm-edit-parent-selector', concept.parentId, (newParentId) => {
        modalEl.dataset.selectedParentId = newParentId || '';
    }, concept.id);
}

function openCreateModal(defaultParentId = null) {
    window.closeCreateModal?.();
    const defaultAccent = defaultParentId ? COLORS.plus.text : COLORS.yaml.text;

    const modalHtml = `
        <div class="sm-modal-overlay" id="sm-create-modal">
            <div class="sm-modal" onclick="event.stopPropagation()">
                <div class="sm-modal-header">
                    <span>➕ 新增概念</span>
                    <button onclick="closeCreateModal()" style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
                </div>
                <div style="padding: 16px;">
                    <div class="sm-form-row">
                        <label class="sm-form-label">名称:</label>
                        <input type="text" id="sm-create-keyword" class="sm-form-input" placeholder="输入概念名称...">
                    </div>
                    <div class="sm-form-row">
                        <label class="sm-form-label">父级:</label>
                        <div id="sm-create-parent-selector" class="sm-parent-selector"></div>
                    </div>
                    <div class="sm-form-row">
                        <label class="sm-form-label">颜色:</label>
                        <input type="color" id="sm-create-accent-color" class="sm-form-input" value="${defaultAccent}">
                    </div>
                    <div class="sm-form-help">新增 concept 时可直接指定胶囊主色。</div>
                </div>
                <div class="sm-modal-footer">
                    <button onclick="closeCreateModal()">取消</button>
                    <button onclick="saveCreate()" style="color: var(--interactive-accent); font-weight: 600;">添加</button>
                </div>
            </div>
        </div>
    `;

    const container = rootContainer;
    const wrapper = container.createEl('div');
    wrapper.innerHTML = modalHtml;
    const modalEl = document.getElementById('sm-create-modal');
    modalEl.dataset.selectedParentId = defaultParentId || '';
    modalEl.addEventListener('click', window.closeCreateModal);

    initParentSelector('sm-create-parent-selector', defaultParentId, (newParentId) => {
        modalEl.dataset.selectedParentId = newParentId || '';
    });

    const input = document.getElementById('sm-create-keyword');
    input?.focus();
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.saveCreate();
        }
    });
}

window.closeEditModal = function() {
    const modal = document.getElementById('sm-edit-modal');
    if (modal) modal.remove();
    window._smParentSelector = null;
};

window.closeCreateModal = function() {
    const modal = document.getElementById('sm-create-modal');
    if (modal) modal.remove();
    window._smParentSelector = null;
};

window.saveCreate = async function() {
    const modalEl = document.getElementById('sm-create-modal');
    const keyword = document.getElementById('sm-create-keyword')?.value.trim() || '';
    const selectedParentId = modalEl?.dataset?.selectedParentId || '';
    const accentColor = document.getElementById('sm-create-accent-color')?.value || '';
    const created = await createConceptRecord(keyword, selectedParentId || null, accentColor);

    if (!created) return;

    window.closeCreateModal();
    renderViewFn();
    new Notice('✅ 已添加');
};

window.saveEdit = async function(id) {
    try { assertConceptSaveAllowed(); }
    catch (error) { new Notice(error.message); return; }
    const concept = state.concepts[id];
    const newKeyword = document.getElementById('sm-edit-keyword').value.trim();
    const modalEl = document.getElementById('sm-edit-modal');
    const selectedParentId = modalEl?.dataset?.selectedParentId || '';
    const accentColor = document.getElementById('sm-edit-accent-color')?.value || '';
    const newKeywords = parseKeywordLines(document.getElementById('sm-edit-keywords')?.value || '');

    if (!newKeyword) { new Notice('⚠️ 名称不能为空'); return; }

    const newId = generateId(newKeyword);
    if (newId !== id && state.concepts[newId]) {
        new Notice('⚠️ 该名称已存在');
        return;
    }

    if (!canMoveConceptToParent(id, selectedParentId || null, { silent: true })) {
        new Notice('⚠️ 不能将父级移动到自己的子级');
        return;
    }

    const keywordValidation = validateKeywordOwnership(id, newKeywords);
    if (!keywordValidation.ok) {
        new Notice(`⚠️ 关键词「${keywordValidation.keyword}」已属于「${keywordValidation.owner?.keyword || keywordValidation.owner?.id || '其他 concept'}」`);
        return;
    }

    const previousParentId = concept.parentId || null;
    concept.keyword = newKeyword;
    concept.sortLetter = getSortLetter(newKeyword);
    concept.parentId = selectedParentId || null;
    concept.colorType = concept.parentId ? 'plus' : 'yaml';
    concept.accentColor = normalizeConceptAccentColor(accentColor);
    if (previousParentId !== concept.parentId) {
        concept.order = getSiblingConcepts(concept.parentId, concept.id).length;
    }

    if (newId !== id) {
        // 同步更新子级parentId
        Object.values(state.concepts).forEach(c => {
            if (c.parentId === id) c.parentId = newId;
        });
        delete state.concepts[id];
        concept.id = newId;
        state.concepts[newId] = concept;
        migrateKeywordOwner(id, newId);
    }

    setConceptKeywords(concept.id, newKeywords);

    try { await saveData(); }
    catch (error) { return; }
    window.closeEditModal();
    renderViewFn();
    new Notice('✅ 已保存');
};

// ============ 父级选择器 ============

window._smParentSelector = null;

function initParentSelector(containerId, initialParentId, onSelect, excludeId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const selector = {
        element: container,
        selectedParentId: initialParentId,
        highlightedIndex: -1,
        availableParents: [],
        onSelect: onSelect,

        init: function() {
            this.wrapper = container.createEl('div', { cls: 'sm-parent-input-wrapper' });
            this.input = this.wrapper.createEl('input', { type: 'text', cls: 'sm-parent-input', attr: { placeholder: '输入或选择父级...' } });
            this.clearBtn = this.wrapper.createEl('span', { cls: 'sm-parent-clear', text: '×' });
            this.dropdown = container.createEl('div', { cls: 'sm-parent-dropdown' });

            this.updateDisplay(this.selectedParentId);
            this.input.onfocus = () => this.showDropdown();
            this.input.onblur = () => setTimeout(() => this.dropdown.classList.remove('visible'), 150);
            this.input.oninput = () => {
                this.highlightedIndex = -1;
                this.showDropdown();
            };

            this.clearBtn.onclick = (e) => {
                e.stopPropagation();
                this.setSelected('');
                this.input.focus();
            };

            this.input.onkeydown = (e) => {
                const options = this.dropdown.querySelectorAll('.sm-parent-option');
                if (options.length === 0) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); this.highlightedIndex = Math.min(this.highlightedIndex + 1, options.length - 1); this.updateHighlight(options); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0); this.updateHighlight(options); }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    const index = this.highlightedIndex >= 0 ? this.highlightedIndex : 0;
                    if (options[index]) options[index].click();
                }
                else if (e.key === 'Escape') { this.dropdown.classList.remove('visible'); this.input.blur(); }
            };
        },

        updateHighlight: function(options) {
            options.forEach((opt, i) => opt.classList.toggle('highlighted', i === this.highlightedIndex));
            if (options[this.highlightedIndex]) options[this.highlightedIndex].scrollIntoView({ block: 'nearest' });
        },

        renderOptions: function() {
            this.dropdown.innerHTML = '';

            const filterText = this.input.value.trim().toLowerCase();
            const filteredParents = filterText
                ? this.availableParents.filter(c => (c.keyword || '').toLowerCase().includes(filterText))
                : this.availableParents;

            const topOpt = this.dropdown.createEl('div', {
                cls: `sm-parent-option ${!this.selectedParentId ? 'selected' : ''}`,
                attr: { 'data-value': '' }
            });
            topOpt.innerHTML = `<span class="sm-parent-option-icon">🏠</span><span class="sm-parent-option-text">-- 顶层 --</span>`;
            topOpt.onclick = () => this.setSelected('');

            if (filteredParents.length === 0) {
                this.dropdown.createEl('div', { cls: 'sm-parent-empty', text: '无匹配父级' });
            }

            filteredParents.forEach(c => {
                const opt = this.dropdown.createEl('div', {
                    cls: `sm-parent-option ${this.selectedParentId === c.id ? 'selected' : ''}`,
                    attr: { 'data-value': c.id }
                });
                opt.innerHTML = `<span class="sm-parent-option-icon">${COLORS[c.colorType].icon}</span><span class="sm-parent-option-text">${c.keyword}</span>`;
                opt.onclick = () => this.setSelected(c.id, c.keyword);
            });

            const statsText = filterText
                ? `显示 ${filteredParents.length}/${this.availableParents.length} 个可选父级`
                : `共 ${this.availableParents.length} 个可选父级`;
            this.dropdown.createEl('div', { cls: 'sm-parent-stats', text: statsText });
            this.highlightedIndex = -1;
        },

        setSelected: function(id, text = '') {
            this.selectedParentId = id;
            this.input.value = id ? text : '';
            this.dropdown.classList.remove('visible');
            this.input.blur();
            this.onSelect(id);
        },

        updateDisplay: function(id) {
            const c = state.concepts[id];
            this.input.value = (id && c) ? c.keyword : '';
            this.renderOptions();
        },

        showDropdown: function() {
            const excluded = new Set();
            if (excludeId) {
                excluded.add(excludeId);
                getDescendantIds(excludeId).forEach(id => excluded.add(id));
            }
            this.availableParents = Object.values(state.concepts)
                .filter(c => !excluded.has(c.id))
                .sort(compareConceptName);
            this.renderOptions();
            this.dropdown.classList.add('visible');
        }
    };

    selector.init();
    window._smParentSelector = selector;
    return selector;
}


// ============ 导出/导入/全局交互 ============

function exportData() {
    try {
    assertTreeMutationAllowed('export');
    if (localStorage.getItem(TREE_TX_STORAGE_KEY) != null) throw new Error('请先恢复未完成事务，再导出完整数据。');
    const freshRoot = freshConceptPageRoot();
    const pages = validateConceptPagesAgainstConcepts(readConceptPages(), freshRoot.concepts);
    const freshTree = readCurrentTreeStore();
    validateImportedCrossStore(freshRoot.concepts, freshTree);
    const sharedConceptStore = {
        ...freshRoot,
        concepts: freshRoot.concepts,
        conceptKeywordIndex: sanitizeConceptKeywordIndex(freshRoot.conceptKeywordIndex || {}),
        version: "1.0",
        lastModified: moment().format("YYYY-MM-DD HH:mm:ss"),
        metadata: {
            total: Object.keys(freshRoot.concepts).length,
            topLevel: Object.values(freshRoot.concepts).filter(c => !c.parentId).length,
            keywords: Object.keys(freshRoot.conceptKeywordIndex || {}).length
        }
    };
    const data = {
        bundleVersion: 'supermemo-concept-display-bundle-v3',
        exportedAt: new Date().toISOString(),
        sharedConceptStore,
        structureTree: freshTree,
        conceptPages: pages,
        treeUi: normalizeTreeUi(state.treeUi)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sm_concepts_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    } catch (error) { new Notice(`无法导出：${error.message}`); }
}

function fingerprintImportText(value) {
    const text = String(value || '');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}:${text.length}`;
}

function normalizeImportedConceptPayload(sharedPayload) {
    const isLegacyArray = Array.isArray(sharedPayload);
    if (!isLegacyArray && (!sharedPayload || typeof sharedPayload !== 'object' || Array.isArray(sharedPayload)
        || !sharedPayload.concepts || typeof sharedPayload.concepts !== 'object' || Array.isArray(sharedPayload.concepts))) {
        throw Object.assign(new Error('导入文件缺少有效的 Concept 根结构。'), { code: 'IMPORT_CONCEPT_ROOT_INVALID' });
    }
    const importedArray = isLegacyArray ? sharedPayload : Object.values(sharedPayload.concepts);
    const newConcepts = {};
    const stableOwners = new Map();
    importedArray.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw Object.assign(new Error(`第 ${index + 1} 个 Concept 不是对象。`), { code: 'IMPORT_CONCEPT_RECORD_INVALID' });
        }
        const keyword = String(item.keyword || '').trim();
        if (!keyword) {
            throw Object.assign(new Error(`第 ${index + 1} 个 Concept 缺少名称。`), { code: 'IMPORT_CONCEPT_NAME_MISSING' });
        }
        const id = String(item.id || generateId(keyword)).trim();
        if (!id || newConcepts[id]) {
            throw Object.assign(new Error(`Concept ID 重复：${id || '(empty)'}`), { code: 'IMPORT_CONCEPT_ID_DUPLICATE', conceptId: id });
        }
        const stableId = typeof item.stableId === 'string' ? item.stableId.trim() : '';
        if (stableId && stableOwners.has(stableId)) {
            throw Object.assign(new Error(`Concept stableId 重复：${stableId}`), {
                code: 'IMPORT_CONCEPT_STABLE_ID_DUPLICATE',
                stableId,
                owners: [stableOwners.get(stableId), id]
            });
        }
        if (stableId) stableOwners.set(stableId, id);
        newConcepts[id] = {
            id,
            keyword,
            parentId: item.parentId ? String(item.parentId) : null,
            colorType: item.colorType || 'dot',
            accentColor: normalizeConceptAccentColor(item.accentColor || ''),
            order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0,
            sortLetter: item.sortLetter || getSortLetter(keyword),
            note: typeof item.note === 'string' ? item.note : '',
            stableId: stableId || undefined,
            createdAt: item.createdAt || new Date().toISOString()
        };
    });
    Object.values(newConcepts).forEach(concept => {
        if (concept.parentId && !newConcepts[concept.parentId]) {
            throw Object.assign(new Error(`Concept 父级不存在：${concept.id} -> ${concept.parentId}`), {
                code: 'IMPORT_CONCEPT_PARENT_MISSING',
                conceptId: concept.id,
                parentId: concept.parentId
            });
        }
        const visited = new Set();
        let cursor = concept.id;
        while (cursor) {
            if (visited.has(cursor)) {
                throw Object.assign(new Error(`Concept 层级存在循环：${concept.id}`), {
                    code: 'IMPORT_CONCEPT_CYCLE',
                    conceptId: concept.id
                });
            }
            visited.add(cursor);
            cursor = newConcepts[cursor]?.parentId || null;
        }
    });
    return {
        concepts: newConcepts,
        conceptKeywordIndex: sanitizeConceptKeywordIndexForConcepts(
            isLegacyArray ? {} : sharedPayload.conceptKeywordIndex || {},
            newConcepts
        )
    };
}

function validateImportedCrossStore(concepts, treeStore) {
    const errors = validateConceptTreeConsistency(concepts, treeStore);
    if (errors.length) {
        throw Object.assign(new Error(errors.join(', ')), {
            code: 'IMPORT_CROSS_STORE_INVALID',
            details: errors
        });
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const pendingAtStart = state.pendingTreeTx ? treeModel.deepClone(state.pendingTreeTx) : null;
                const recoveringImport = pendingAtStart?.type === 'import';
                if (pendingAtStart && !recoveringImport) {
                    throw Object.assign(new Error('存在其他未完成事务，请先完成恢复。'), { code: 'TREE_TRANSACTION_PENDING' });
                }
                if (recoveringImport) loadTreeStores();
                const sourceText = String(event.target.result || '');
                const sourceFingerprint = fingerprintImportText(sourceText);
                if (recoveringImport && pendingAtStart.sourceFingerprint !== sourceFingerprint) {
                    throw Object.assign(new Error('所选文件与未完成导入事务的原文件不一致。'), { code: 'IMPORT_SOURCE_MISMATCH' });
                }
                const importedPayload = JSON.parse(sourceText);
                readConceptPages(); // Protect malformed/future current page stores from import overwrite.
                if (importedPayload?.bundleVersion && !['supermemo-concept-display-bundle-v2', 'supermemo-concept-display-bundle-v3'].includes(importedPayload.bundleVersion)) {
                    throw Object.assign(new Error(`不支持的导入 bundleVersion：${importedPayload.bundleVersion}`), { code: 'IMPORT_BUNDLE_VERSION_UNSUPPORTED' });
                }
                const isV3 = importedPayload?.bundleVersion === 'supermemo-concept-display-bundle-v3';
                const isBundle = isV3 || importedPayload?.bundleVersion === 'supermemo-concept-display-bundle-v2';
                if (isV3 && (!importedPayload.conceptPages || typeof importedPayload.conceptPages !== 'object')) throw new Error('v3 导入包缺少有效胶囊页面数据。');
                if (isBundle && !Object.prototype.hasOwnProperty.call(importedPayload, 'structureTree')) {
                    throw Object.assign(new Error('v2 导入包缺少 structureTree。'), { code: 'IMPORT_TREE_MISSING' });
                }
                const sharedPayload = isBundle
                    ? importedPayload.sharedConceptStore
                    : importedPayload;
                const normalizedConceptImport = normalizeImportedConceptPayload(sharedPayload);
                const newConcepts = normalizedConceptImport.concepts;
                const importedKeywords = normalizedConceptImport.conceptKeywordIndex;
                const importedPages = validateConceptPagesAgainstConcepts(parseConceptPages(isV3 ? JSON.stringify(importedPayload.conceptPages) : null), newConcepts);
                const importedTreeRaw = isBundle
                    ? importedPayload.structureTree
                    : treeModel.createEmptyTreeStore();
                const activeStableIds = Object.values(newConcepts).map(getConceptStableId).filter(Boolean);
                const importedTree = treeModel.mergeReservationAuthority(state.treeStore, importedTreeRaw, activeStableIds);
                validateImportedCrossStore(newConcepts, importedTree);
                const importedUi = isBundle
                    ? normalizeTreeUi(importedPayload.treeUi)
                    : normalizeTreeUi({ activeSurface: state.activeSurface });
                const treeNodeCount = Object.keys(importedTree.nodesById || {}).length;
                const assignmentCount = Object.keys(importedTree.conceptAssignments || {}).length;
                if (confirm(`导入将覆盖当前 Concept、主体结构树与胶囊页面。\n${isV3 ? '页面和归属使用导入包中的内容。' : '旧版文件不含页面：现有页面定义、归属及页面名草稿将重置。'}\nConcept：${Object.keys(newConcepts).length}\n结构节点：${treeNodeCount}\n归属：${assignmentCount}\n历史稳定 ID reservation 会保留。确定继续吗？`)) {
                    const conceptRawBefore = localStorage.getItem(STORAGE_KEY);
                    const treeRawBefore = localStorage.getItem(TREE_STORAGE_KEY);
                    const uiRawBefore = localStorage.getItem(TREE_UI_STORAGE_KEY);
                    const pagesRawBefore = localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY);
                    const sharedCandidate = {
                        concepts: newConcepts,
                        conceptKeywordIndex: importedKeywords,
                        version: '1.0',
                        lastModified: moment().format('YYYY-MM-DD HH:mm:ss'),
                        metadata: {
                            total: Object.keys(newConcepts).length,
                            topLevel: Object.values(newConcepts).filter(concept => !concept.parentId).length,
                            keywords: Object.keys(importedKeywords).length
                        }
                    };
                    const conceptSerialized = JSON.stringify(sharedCandidate);
                    const tx = recoveringImport
                        ? {
                            ...pendingAtStart,
                            stage: 'prepared',
                            updatedAt: new Date().toISOString(),
                            expectedTreeRevision: state.treeStore.revision,
                            conceptCount: Object.keys(newConcepts).length,
                            treeNodeCount,
                            assignmentCount,
                            retryCount: Number(pendingAtStart.retryCount || 0) + 1,
                            sourceFingerprint,
                            lastError: null
                        }
                        : {
                            schemaVersion: 1,
                            txId: treeModel.createId('smttx'),
                            type: 'import',
                            stage: 'prepared',
                            createdAt: new Date().toISOString(),
                            expectedTreeRevision: state.treeStore.revision,
                            conceptCount: Object.keys(newConcepts).length,
                            treeNodeCount,
                            assignmentCount,
                            retryCount: 0,
                            sourceFingerprint,
                            lastError: null
                        };
                    persistPendingTransaction(tx);
                    let pagesWriteAttempted = false;
                    try {
                        localStorage.setItem(STORAGE_KEY, conceptSerialized);
                        if (localStorage.getItem(STORAGE_KEY) !== conceptSerialized) throw new Error('Concept import readback mismatch');
                        tx.stage = 'concept-written';
                        tx.updatedAt = new Date().toISOString();
                        persistPendingTransaction(tx);
                        commitTreeCandidate(importedTree, state.treeStore.revision, 'import-tree');
                        tx.stage = 'tree-written';
                        tx.updatedAt = new Date().toISOString();
                        persistPendingTransaction(tx);
                        const uiSerialized = JSON.stringify(importedUi);
                        const pagesSerialized = JSON.stringify(importedPages);
                        if (localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY) !== pagesRawBefore) throw new Error('导入期间页面数据已变化。');
                        pagesWriteAttempted = true;
                        localStorage.setItem(CONCEPT_PAGES_STORAGE_KEY, pagesSerialized);
                        if (localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY) !== pagesSerialized) throw new Error('胶囊页面导入回读失败');
                        localStorage.setItem(TREE_UI_STORAGE_KEY, uiSerialized);
                        if (localStorage.getItem(TREE_UI_STORAGE_KEY) !== uiSerialized) throw new Error('Tree UI import readback mismatch');
                        clearPendingTransaction();
                    } catch (writeError) {
                        try {
                            if (conceptRawBefore == null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, conceptRawBefore);
                            if (treeRawBefore == null) localStorage.removeItem(TREE_STORAGE_KEY); else localStorage.setItem(TREE_STORAGE_KEY, treeRawBefore);
                            if (uiRawBefore == null) localStorage.removeItem(TREE_UI_STORAGE_KEY); else localStorage.setItem(TREE_UI_STORAGE_KEY, uiRawBefore);
                            if (pagesWriteAttempted) {
                                if (pagesRawBefore == null) localStorage.removeItem(CONCEPT_PAGES_STORAGE_KEY); else localStorage.setItem(CONCEPT_PAGES_STORAGE_KEY, pagesRawBefore);
                            }
                            const conceptRestored = localStorage.getItem(STORAGE_KEY) === conceptRawBefore;
                            const treeRestored = localStorage.getItem(TREE_STORAGE_KEY) === treeRawBefore;
                            const uiRestored = localStorage.getItem(TREE_UI_STORAGE_KEY) === uiRawBefore;
                            const pagesRestored = !pagesWriteAttempted || localStorage.getItem(CONCEPT_PAGES_STORAGE_KEY) === pagesRawBefore;
                            if (conceptRestored && treeRestored && uiRestored && pagesRestored && !recoveringImport) {
                                clearPendingTransaction();
                            } else {
                                tx.stage = 'retry-required';
                                tx.updatedAt = new Date().toISOString();
                                tx.lastError = writeError?.code || writeError?.message || String(writeError);
                                persistPendingTransaction(tx);
                            }
                        } catch (rollbackError) {
                            console.error('[SuperMemo Concept Display][import-rollback-failed]', {
                                txId: tx.txId,
                                message: rollbackError?.message || String(rollbackError)
                            });
                            tx.stage = 'retry-required';
                            tx.updatedAt = new Date().toISOString();
                            tx.lastError = rollbackError?.code || rollbackError?.message || String(rollbackError);
                            try { persistPendingTransaction(tx); } catch (persistError) {
                                console.error('[SuperMemo Concept Display][import-recovery-state-save-failed]', {
                                    txId: tx.txId,
                                    message: persistError?.message || String(persistError)
                                });
                            }
                        }
                        loadData();
                        loadTreeStores();
                        throw writeError;
                    }
                    loadData();
                    loadTreeStores();
                    renderViewFn();
                    new Notice('✅ Concept、主体结构树与胶囊页面导入成功');
                }
            } catch (e) {
                console.error('[SuperMemo Concept Display][import-rejected]', {
                    code: e?.code || 'IMPORT_FAILED',
                    message: e?.message || String(e)
                });
                new Notice(`❌ 导入失败：${e?.message || '格式错误'}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function toggleView() {
    state.managerMode = !state.managerMode;
    renderViewFn();
}

// ============ 主渲染函数 ============

function render(container) {
    if (activeNodeCommentDialog && !activeNodeCommentDialog.close()) return;
    captureMeaningViewport();
    activeMeaningNavigation?.close();
    container.innerHTML = '';
    container.className = 'sm-app-shell';
    renderSurfaceTabs(container);
    if (conceptPageEditingId && state.activeSurface === 'capsules') renderConceptPagePicker(container);
    if (state.meaningProjectEditingRelation) renderMeaningProjectPicker(container);
    const panel = container.createDiv({ cls: 'sm-surface-panel' });
    if (state.activeSurface === 'tree') {
        renderTreeView(panel);
        return;
    }
    if (state.activeSurface === 'antinet') {
        renderAntinetView(panel);
        return;
    }
    if (state.activeSurface === 'meanings') {
        renderAntinetMeaningView(panel);
        return;
    }
    if (state.conceptLoadError) {
        const protection = panel.createDiv({ cls: 'sm-tree-protection' });
        protection.createDiv({ cls: 'sm-tree-protection-title', text: '共享 Concept 数据无法解析，当前只读保护' });
        protection.createDiv({ text: state.conceptLoadError.message });
        protection.createDiv({ cls: 'sm-tree-protection-hint', text: '程序没有清空或重写原始 localStorage，也没有加载示例数据。请先导出/修复原始值。' });
        return;
    }
    if (state.managerMode) renderManagerView(panel);
    else renderDisplayView(panel);
}

// ============ 主入口 ============

loadData();
loadTreeStores();
void registerAntinetEvaIntegration('startup');
window.setTimeout(() => { void registerAntinetEvaIntegration('startup-retry'); }, 900);

renderViewFn = () => render(rootContainer);
render(rootContainer);

// 绑定全局事件处理
const handleSmConceptKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { // Ctrl/Cmd + K: 切换视图
        e.preventDefault();
        toggleView();
    }
};
document.addEventListener('keydown', handleSmConceptKeydown);
cleanupCallbacks.push(() => document.removeEventListener('keydown', handleSmConceptKeydown));
  return {
    cleanup() {
      state.pendingTreeReveal = null;
      state.pendingConceptCapsuleReveal = null;
      state.pendingAntinetMeaningReveal = null;
      state.pendingAntinetMountReveal = null;
      treeRevealSequence += 1;
      for (const callback of cleanupCallbacks.splice(0).reverse()) {
        try { callback(); } catch (error) { console.warn("[SuperMemo Concept Display][cleanup-fail]", error); }
      }
    },
  };
};
