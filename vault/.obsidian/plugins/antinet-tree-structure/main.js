const obsidian = require("obsidian");
const { Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, normalizePath } = obsidian;

const DEFAULT_SETTINGS = {
  filePrefix: "ATOM@",
  keywordKeys: ["关键词管理", "关键词", "keywords", "keyword"],
  excludeTerminalBus: false,
};

const LEGACY_RENDER_CACHE_FILE = "antinet-tree-render-cache.json";
const RENDER_CACHE_DIR = "render-cache";
const RENDER_CACHE_INDEX_FILE = "index.json";
const RENDER_CACHE_VERSION = 1;
const RENDER_CACHE_MAX_ENTRIES = 50;
const RENDER_CACHE_MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const RENDER_CACHE_MAX_SINGLE_SVG_BYTES = 2 * 1024 * 1024;
const RENDER_CACHE_INDEX_SAVE_DEBOUNCE_MS = 5000;
const UI_STATE_FILE = "antinet-tree-ui-state.json";
const UI_STATE_VERSION = 1;
const KEYWORD_GRAPH_START_KEY = "关键词图之起始";
const PREWARM_DEBOUNCE_MS = 900;
const PARENT_PREWARM_DEBOUNCE_MS = 1600;
const LIBRARY_SCAN_BATCH_DELAY_MS = 250;
const LIBRARY_SCAN_PROGRESS_INTERVAL = 1;
const LIBRARY_SCAN_MAX_GROUP_RECORDS = 320;
const LIBRARY_SCAN_MAX_RENDER_NODES = 260;
const LIBRARY_SCAN_MAX_RENDER_EDGES = 320;
const INTERACTIVE_GRAPH_BUDGET = Object.freeze({
  maxRecords: 700,
  maxNodes: 420,
  maxEdges: 520,
  maxSourceChars: 90000,
  batchSize: 50,
  yieldMs: 0,
});
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;
const MERMAID_MAX_EDGES = 1000;

function normalizeText(value, fallback = "") {
  const text = String(value == null ? "" : value).trim();
  return text || fallback;
}

function normalizeSettings(raw = {}) {
  raw = raw && typeof raw === "object" ? raw : {};
  const keys = Array.isArray(raw.keywordKeys)
    ? raw.keywordKeys.map((item) => normalizeText(item)).filter(Boolean)
    : DEFAULT_SETTINGS.keywordKeys.slice();
  return {
    filePrefix: normalizeText(raw.filePrefix, DEFAULT_SETTINGS.filePrefix),
    keywordKeys: keys.length ? keys : DEFAULT_SETTINGS.keywordKeys.slice(),
    excludeTerminalBus: raw.excludeTerminalBus === true,
  };
}

function keywordSettingsSignature(settings) {
  return JSON.stringify({
    keywordKeys: Array.isArray(settings?.keywordKeys) ? settings.keywordKeys : [],
  });
}

function fileCacheSignature(file, settings) {
  return JSON.stringify({
    path: file?.path || "",
    name: file?.name || "",
    mtime: file?.stat?.mtime || 0,
    size: file?.stat?.size || 0,
    settings: keywordSettingsSignature(settings),
  });
}

function cleanKeyword(value) {
  return String(value == null ? "" : value).trim().replace(/^["']+|["']+$/g, "").trim();
}

function unique(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const value = cleanKeyword(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function splitInlineKeywordValue(value) {
  const raw = cleanKeyword(value);
  if (!raw) return [];
  const body = raw.startsWith("[") && raw.endsWith("]") ? raw.slice(1, -1) : raw;
  return [cleanKeyword(body)].filter(Boolean);
}

function normalizeKeywordValue(value, settings) {
  const keyword = cleanKeyword(value);
  if (!keyword || keyword === "-" || keyword === "--" || keyword === "---") return "";
  return keyword;
}

function describeKeywordCandidate(value, settings, source) {
  const keyword = cleanKeyword(value);
  const result = {
    source,
    raw: value,
    keyword,
    drawable: "",
    kept: false,
    reason: "",
  };
  if (!keyword) {
    result.reason = "empty";
    return result;
  }
  if (keyword === "-" || keyword === "--" || keyword === "---") {
    result.reason = "frontmatter-marker";
    return result;
  }
  result.drawable = keyword;
  result.kept = true;
  result.reason = "kept";
  return result;
}

function shouldKeepKeyword(value, settings) {
  return Boolean(normalizeKeywordValue(value, settings));
}

function displayKeyword(value, settings) {
  return cleanKeyword(value);
}

function hasBusDrawerSegment(value) {
  return cleanKeyword(value)
    .split("+")
    .map((part) => part.trim())
    .some((part) => part.toUpperCase().startsWith("BUS"));
}

function hasTerminalBusDrawerSegment(value) {
  const parts = cleanKeyword(value).split("+").map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1] || "";
  return last.toUpperCase().startsWith("BUS");
}

function parseFrontmatterKeywordValues(frontmatter, settings) {
  const out = [];
  if (!frontmatter || typeof frontmatter !== "object") return out;
  const keySet = new Set(settings.keywordKeys);
  for (const key of Object.keys(frontmatter)) {
    if (!keySet.has(key)) continue;
    const value = frontmatter[key];
    if (Array.isArray(value)) {
      for (const item of value) out.push(...splitInlineKeywordValue(item));
    } else {
      out.push(...splitInlineKeywordValue(value));
    }
  }
  return out;
}

function isTruthyFrontmatterValue(value) {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  return ["true", "yes", "y", "1", "on", "是", "真"].includes(value.trim().toLowerCase());
}

async function parseRawFrontmatterKeywordValues(file, app, settings) {
  const out = [];
  let content = "";
  try {
    content = await app.vault.cachedRead(file);
  } catch (error) {
    console.warn("[AntinetTreeStructure][frontmatter.read-fail]", { path: file.path, error });
    return out;
  }
  const lines = content.split(/\r?\n/).slice(0, 240);
  if (!lines.length || lines[0].trim() !== "---") return out;
  const keySet = new Set(settings.keywordKeys);
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "---") break;
    const match = line.match(/^\s*([^:#]+)\s*:\s*(.*)$/);
    if (!match || !keySet.has(match[1].trim())) continue;
    const inline = match[2].trim();
    if (inline && inline !== "[]") out.push(...splitInlineKeywordValue(inline));
    let cursor = index + 1;
    while (cursor < lines.length) {
      if (lines[cursor].trim() === "---") break;
      const item = lines[cursor].match(/^\s*-\s*(.+?)\s*$/);
      if (!item) break;
      out.push(cleanKeyword(item[1]));
      cursor += 1;
    }
    index = cursor - 1;
  }
  return out;
}

function parseInlineFilenameKeywords(fileName) {
  const stem = fileName.replace(/\.md$/i, "");
  const out = [];
  const dotRe = /··([^·]+)··/g;
  const plusRe = /\+\+([^+]+(?:\+[^+]+)*)\+\+/g;
  let match = null;
  while ((match = dotRe.exec(stem))) out.push(cleanKeyword(match[1]));
  while ((match = plusRe.exec(stem))) out.push(cleanKeyword(match[1]));
  return out;
}

function parseAtomFile(file, filePrefix) {
  if (!(file instanceof TFile) || file.extension !== "md") return null;
  if (!file.name.startsWith(filePrefix)) return null;
  const escapedPrefix = filePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escapedPrefix}(.+?)-\\s*(.*)\\.md$`, "i");
  const match = file.name.match(re);
  if (!match) return null;
  const code = normalizeText(match[1]);
  if (!code) return null;
  return {
    code,
    title: normalizeText(match[2], file.basename),
    file,
    path: file.path,
  };
}

function parentCodeOf(code) {
  const parts = String(code || "").split(".").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join(".");
}

function isDescendantCode(baseCode, code) {
  return Boolean(baseCode) && code !== baseCode && String(code).startsWith(`${baseCode}.`);
}

function sortCodeKey(code) {
  return String(code || "").split(/(\d+)/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function compareCodes(a, b) {
  const left = sortCodeKey(a);
  const right = sortCodeKey(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] == null) return -1;
    if (right[index] == null) return 1;
    if (left[index] === right[index]) continue;
    return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

function nearestKeywordParentCode(code, keywordCodeSet) {
  const parts = String(code || "").split(".").filter(Boolean);
  for (let index = parts.length - 1; index > 0; index -= 1) {
    const candidate = parts.slice(0, index).join(".");
    if (keywordCodeSet.has(candidate)) return candidate;
  }
  return "";
}

function ancestorCodesIncludingSelf(code) {
  const parts = String(code || "").split(".").filter(Boolean);
  const codes = [];
  for (let length = 1; length <= parts.length; length += 1) {
    codes.push(parts.slice(0, length).join("."));
  }
  return codes;
}

function prioritizeRecordsForAnchor(records, anchorCode) {
  const priorityIndexByCode = new Map(
    ancestorCodesIncludingSelf(anchorCode).map((code, index) => [code, index])
  );
  return records
    .map((record, index) => ({ record, index, priority: priorityIndexByCode.get(record.code) }))
    .sort((left, right) => {
      const leftPriority = left.priority == null ? Number.POSITIVE_INFINITY : left.priority;
      const rightPriority = right.priority == null ? Number.POSITIVE_INFINITY : right.priority;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left.index - right.index;
    })
    .map((item) => item.record);
}

function escapeMermaidLabel(value) {
  return String(value == null ? "" : value)
    .replace(/\\/g, "/")
    .replace(/"/g, "'")
    .replace(/\[/g, "［")
    .replace(/\]/g, "］")
    .replace(/\{/g, "｛")
    .replace(/\}/g, "｝")
    .replace(/;/g, "；")
    .replace(/\r?\n/g, " ");
}

function simpleHash(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function byteLength(text) {
  const value = String(text == null ? "" : text);
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return value.length * 2;
}

function safeCacheFileName(key) {
  const safe = String(key || "cache").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 120);
  return `${safe || "cache"}.svg`;
}

function normalizePluginPath(path) {
  const text = String(path || "").replace(/\\/g, "/").replace(/\/+/g, "/");
  return typeof normalizePath === "function" ? normalizePath(text) : text;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createRenderToken() {
  return { cancelled: false, startedAt: Date.now() };
}

function assertNotCancelled(token) {
  if (token?.cancelled) throw new Error("render-cancelled");
}

function normalizeGraphBudget(value) {
  if (!value || typeof value !== "object") return null;
  return {
    maxRecords: Math.max(1, Number(value.maxRecords) || INTERACTIVE_GRAPH_BUDGET.maxRecords),
    maxNodes: Math.max(1, Number(value.maxNodes) || INTERACTIVE_GRAPH_BUDGET.maxNodes),
    maxEdges: Math.max(1, Number(value.maxEdges) || INTERACTIVE_GRAPH_BUDGET.maxEdges),
    maxSourceChars: Math.max(1, Number(value.maxSourceChars) || INTERACTIVE_GRAPH_BUDGET.maxSourceChars),
    batchSize: Math.max(1, Number(value.batchSize) || INTERACTIVE_GRAPH_BUDGET.batchSize),
    yieldMs: Math.max(0, Number(value.yieldMs) || 0),
  };
}

function cssEscape(value) {
  const text = String(value == null ? "" : value);
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(text);
  return text.replace(/["\\]/g, "\\$&");
}

function svgFromMermaidRenderResult(rendered) {
  return typeof rendered === "string" ? rendered : rendered?.svg || "";
}

function findRenderedNodeElement(container, nodeId) {
  if (!container || !nodeId) return null;
  const escaped = cssEscape(nodeId);
  return container.querySelector(`g.node[id="${escaped}"], g.node[id$="-${escaped}"], g.node[id*="-${escaped}-"], g.node[id*="${escaped}"], .node[id*="${escaped}"]`);
}

class AntinetTreeStructureSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Antinet 树的结构" });
    containerEl.createEl("p", {
      text: "从当前 ATOM 笔记出发，绘制同级关键词与其下级关键词 Mermaid 树。插件只读 vault，不写业务数据。",
    });

    new Setting(containerEl)
      .setName("ATOM 文件名前缀")
      .setDesc("默认 ATOM@。")
      .addText((input) => input
        .setValue(this.plugin.settings.filePrefix)
        .onChange(async (value) => {
          this.plugin.settings.filePrefix = normalizeText(value, DEFAULT_SETTINGS.filePrefix);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("关键词字段")
      .setDesc("逗号分隔。默认：关键词管理, 关键词, keywords, keyword。")
      .addText((input) => input
        .setValue(this.plugin.settings.keywordKeys.join(", "))
        .onChange(async (value) => {
          const keys = value.split(/[,，]/).map(normalizeText).filter(Boolean);
          this.plugin.settings.keywordKeys = keys.length ? keys : DEFAULT_SETTINGS.keywordKeys.slice();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("BUS 关键词绘制策略")
      .setDesc("当前固定绘制 BUS 关键词；折叠状态用于收起较长的 BUS 子树。旧设置字段仅保留兼容。");
  }
}

class AntinetTreeModal extends Modal {
  constructor(app, plugin, anchorFile, options = {}) {
    super(app);
    this.plugin = plugin;
    this.anchorFile = anchorFile;
    this.graphMode = options.graphMode === "bus" ? "bus" : "keyword";
    this.modalId = `antinet_tree_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.nodeById = new Map();
    this.globalCallbackName = `antinetTreeNodeClick_${this.modalId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    this.diagramHost = null;
    this.zoomLabel = null;
    this.cacheKey = "";
    this.zoomLevel = 1;
    this.lastGraph = null;
    this.renderToken = null;
    this.scopeMode = options.scopeMode === "parent-group" ? "parent-group" : "anchor-subtree";
  }

  onOpen() {
    this.modalEl.addClass("antinet-tree-modal");
    this.titleEl.setText("Antinet 树的结构");
    this.render().catch((error) => {
      if (error?.message === "render-cancelled") return;
      console.error("[AntinetTreeStructure][modal.render-fail]", error);
      new Notice(`Antinet 树绘制失败：${error?.message || error}`);
    });
  }

  onClose() {
    if (this.renderToken) this.renderToken.cancelled = true;
    this.saveViewState();
    delete window[this.globalCallbackName];
    this.contentEl.empty();
  }

  async render() {
    if (this.renderToken) this.renderToken.cancelled = true;
    const renderToken = createRenderToken();
    this.renderToken = renderToken;
    const { contentEl } = this;
    contentEl.empty();
    const root = contentEl.createDiv({ cls: "antinet-tree-root" });
    const toolbar = root.createDiv({ cls: "antinet-tree-toolbar" });
    const status = toolbar.createDiv({ cls: "antinet-tree-status", text: this.scopeMode === "parent-group" ? "正在扫描父级同级组..." : "正在扫描当前 note 子树..." });
    const actions = toolbar.createDiv({ cls: "antinet-tree-actions" });
    const refreshBtn = actions.createEl("button", { text: "刷新" });
    const codeBtn = actions.createEl("button", { text: "Mermaid 源码" });
    const upLayerBtn = actions.createEl("button", { text: "上一层" });
    const scopeBtn = actions.createEl("button", { text: this.scopeMode === "parent-group" ? "当前子树" : "父级组" });
    const busModeBtn = actions.createEl("button", { text: this.graphMode === "bus" ? "关键词模式" : "BUS模式" });
    const busToggleBtn = actions.createEl("button", { text: this.plugin.areBusNodesVisible() ? "隐藏BUS" : "显示BUS" });
    const zoomOutBtn = actions.createEl("button", { text: "−" });
    const zoomLabel = actions.createSpan({ cls: "antinet-tree-zoom-label", text: "100%" });
    const zoomInBtn = actions.createEl("button", { text: "+" });
    const resetZoomBtn = actions.createEl("button", { text: "重置" });
    const centerBtn = actions.createEl("button", { text: "居中" });
    const closeBtn = actions.createEl("button", { text: "关闭" });
    const diagramHost = root.createDiv({ cls: "antinet-tree-diagram-host" });
    const codeHost = root.createEl("pre", { cls: "antinet-tree-code" });
    codeHost.style.display = "none";
    this.diagramHost = diagramHost;
    this.zoomLabel = zoomLabel;

    refreshBtn.addEventListener("click", () => this.render());
    closeBtn.addEventListener("click", () => this.close());
    codeBtn.addEventListener("click", () => {
      codeHost.style.display = codeHost.style.display === "none" ? "block" : "none";
    });
    upLayerBtn.title = "切换到当前 ATOM 的上一级同级树";
    upLayerBtn.addEventListener("click", () => {
      this.goToParentLayer().catch((error) => {
        console.error("[AntinetTreeStructure][layer-up.fail]", error);
        new Notice(`上一层切换失败：${error?.message || error}`);
      });
    });
    scopeBtn.title = this.scopeMode === "parent-group"
      ? "切回当前 note 子树，避免大范围同级组卡顿"
      : "显式放大到父级同级组，较大目录会触发保护";
    scopeBtn.addEventListener("click", async () => {
      this.saveViewState();
      this.scopeMode = this.scopeMode === "parent-group" ? "anchor-subtree" : "parent-group";
      await this.render();
    });
    busModeBtn.title = this.graphMode === "bus"
      ? "返回关键词 canonical 复用模式"
      : "切换到末尾 BUS 抽屉的同级与下级重算模式";
    busModeBtn.addEventListener("click", async () => {
      if (this.graphMode === "bus") {
        this.graphMode = "keyword";
        await this.render();
        return;
      }
      if (!(await this.plugin.fileHasTerminalBusKeyword(this.anchorFile))) {
        new Notice("当前 note 没有末尾 BUS 抽屉关键词，不能进入 BUS 模式。");
        return;
      }
      this.saveViewState();
      this.graphMode = "bus";
      await this.render();
    });
    busToggleBtn.disabled = this.graphMode === "bus";
    busToggleBtn.title = this.graphMode === "bus"
      ? "BUS 模式固定显示 BUS 节点"
      : (this.plugin.areBusNodesVisible() ? "隐藏红色 BUS 节点" : "显示红色 BUS 节点");
    busToggleBtn.addEventListener("click", async () => {
      if (this.graphMode === "bus") return;
      await this.plugin.setBusNodesVisible(!this.plugin.areBusNodesVisible());
      await this.render();
    });
    zoomOutBtn.title = "缩小";
    zoomInBtn.title = "放大";
    resetZoomBtn.title = "重置缩放";
    centerBtn.title = "居中当前 note 节点";
    zoomOutBtn.addEventListener("click", () => this.setZoomLevel(this.zoomLevel - ZOOM_STEP, { persist: true }));
    zoomInBtn.addEventListener("click", () => this.setZoomLevel(this.zoomLevel + ZOOM_STEP, { persist: true }));
    resetZoomBtn.addEventListener("click", () => this.setZoomLevel(1, { persist: true, centerAfter: true }));
    centerBtn.addEventListener("click", () => this.centerAnchorNode(diagramHost, this.lastGraph, "manual"));
    diagramHost.addEventListener("wheel", (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      this.setZoomLevel(this.zoomLevel + direction * ZOOM_STEP, {
        persist: true,
        anchorClientX: event.clientX,
        anchorClientY: event.clientY,
      });
    }, { passive: false });

    const fullGraph = await this.plugin.buildGraphForFile(this.anchorFile, {
      graphMode: this.graphMode,
      scopeMode: this.scopeMode,
      budget: INTERACTIVE_GRAPH_BUDGET,
      renderToken,
      onStatus: (message) => {
        if (this.renderToken !== renderToken || renderToken.cancelled) return;
        status.textContent = message;
      },
    });
    assertNotCancelled(renderToken);
    await this.plugin.revealFoldedAncestorsForAnchor(fullGraph);
    assertNotCancelled(renderToken);
    const graph = this.plugin.applyFoldedState(fullGraph);
    assertNotCancelled(renderToken);
    this.lastGraph = graph;
    this.nodeById = new Map(graph.nodes.map((node) => [node.nodeId, node]));
    const graphScopeText = graph.graphStartCode
      ? `图起点 ${graph.graphStartKeyword || graph.graphStartCode}`
      : graph.graphMode === "bus"
        ? `BUS同级根 ${graph.parentCode || "ROOT"}`
        : graph.scopeMode === "anchor-subtree"
          ? `当前子树 ${graph.anchorCode}`
        : `同级根 ${graph.parentCode || "ROOT"}`;
    const truncationText = graph.truncated
      ? ` | 部分图：${graph.scannedRecordCount}/${graph.candidateRecordCount} notes, ${graph.totalNodeCount}/${graph.totalCandidateNodeCount || graph.totalNodeCount} nodes`
      : "";
    status.textContent = `${graph.anchorKeyword} | ${graphScopeText} | note ${graph.recordCount} | 关键词节点 ${graph.nodes.length}/${graph.totalNodeCount || graph.nodes.length}${truncationText}${graph.hiddenNodeCount ? ` | 折叠隐藏 ${graph.hiddenNodeCount}` : ""}${graph.busHiddenNodeCount ? ` | BUS隐藏 ${graph.busHiddenNodeCount}` : ""}`;

    const mermaidCode = this.plugin.generateMermaidCode(graph);
    if (this.plugin.shouldSkipInteractiveMermaid(graph, mermaidCode)) {
      this.lastGraph = null;
      this.nodeById = new Map();
      this.cacheKey = "";
      this.renderOversizeFallback(diagramHost, codeHost, mermaidCode, graph);
      return;
    }
    this.cacheKey = this.plugin.buildRenderCacheKey(mermaidCode);
    this.restoreViewState();
    codeHost.textContent = mermaidCode;
    window[this.globalCallbackName] = async (nodeId) => {
      await this.openNode(nodeId);
    };

    assertNotCancelled(renderToken);
    await this.renderMermaid(diagramHost, mermaidCode, graph, renderToken);
  }

  renderOversizeFallback(diagramHost, codeHost, mermaidCode, graph) {
    diagramHost.empty();
    const reason = graph.partialReason || "graph-too-large";
    const message = `已保护跳过 Mermaid 渲染：${reason}。候选 notes ${graph.candidateRecordCount || graph.recordCount}，已扫描 ${graph.scannedRecordCount || graph.recordCount}，节点 ${graph.totalNodeCount || graph.nodes.length}，边 ${graph.edges.length}。`;
    diagramHost.createDiv({ cls: "antinet-tree-error", text: message });
    const hint = diagramHost.createDiv({
      cls: "antinet-tree-error",
      text: "可以先用“当前子树”查看，或折叠/隐藏 BUS 后再放大到父级组。",
    });
    hint.style.marginTop = "8px";
    codeHost.textContent = mermaidCode;
    console.warn("[AntinetTreeStructure][interactive-render.skip-large]", {
      reason,
      candidateRecordCount: graph.candidateRecordCount,
      scannedRecordCount: graph.scannedRecordCount,
      nodeCount: graph.nodes.length,
      totalNodeCount: graph.totalNodeCount,
      edgeCount: graph.edges.length,
      sourceChars: mermaidCode.length,
    });
  }

  async renderMermaid(diagramHost, mermaidCode, graph, renderToken = null) {
    diagramHost.empty();

    try {
      assertNotCancelled(renderToken);
      const requiredNodeIds = graph.nodes.map((node) => node.nodeId);
      const bypassRenderCache = graph.graphMode === "bus";
      const cached = bypassRenderCache ? null : await this.plugin.getRenderCache(this.cacheKey, { requiredNodeIds });
      assertNotCancelled(renderToken);
      let renderSource = bypassRenderCache ? "fresh-bus" : "cache-hit";
      if (cached?.svgOuterHTML) {
        diagramHost.innerHTML = cached.svgOuterHTML;
      } else {
        const mermaid = window.mermaid;
        if (!mermaid || typeof mermaid.render !== "function") {
          diagramHost.createDiv({
            cls: "antinet-tree-error",
            text: "当前页面未检测到 window.mermaid，已显示 Mermaid 源码，可复制到 Mermaid 插件中查看。",
          });
          const fallback = diagramHost.createEl("pre", { cls: "antinet-tree-code antinet-tree-code-inline" });
          fallback.textContent = mermaidCode;
          return;
        }
        renderSource = bypassRenderCache ? "fresh-bus" : "fresh";
        const svgOuterHTML = await this.plugin.renderMermaidSvg(mermaidCode, "modal");
        assertNotCancelled(renderToken);
        diagramHost.innerHTML = svgOuterHTML;
        if (!bypassRenderCache) {
          await this.plugin.putRenderCache(this.cacheKey, {
            svgOuterHTML,
            mermaidCodeHash: simpleHash(mermaidCode),
            nodeIds: requiredNodeIds,
            anchorNodeIds: graph.nodes.filter((node) => node.isAnchor).map((node) => node.nodeId),
            nodeCount: graph.nodes.length,
            edgeCount: graph.edges.length,
            codeChars: mermaidCode.length,
            source: "modal",
          });
        }
      }
      assertNotCancelled(renderToken);
      this.bindRenderedClicks(diagramHost, graph);
      this.bindFoldToggles(diagramHost, graph);
      this.applyCurrentNodeHighlight(diagramHost, graph);
      this.finalizeRenderedView(diagramHost, graph, renderSource);
    } catch (error) {
      if (error?.message === "render-cancelled") return;
      console.error("[AntinetTreeStructure][mermaid.render-fail]", error);
      diagramHost.createDiv({
        cls: "antinet-tree-error",
        text: `Mermaid 渲染失败：${error?.message || error}`,
      });
      const fallback = diagramHost.createEl("pre", { cls: "antinet-tree-code antinet-tree-code-inline" });
      fallback.textContent = mermaidCode;
    }
  }

  finalizeRenderedView(diagramHost, graph, renderSource) {
    this.applyZoomToRenderedSvg();
    this.updateZoomDisplay();
    console.info("[AntinetTreeStructure][view.finalize]", {
      renderSource,
      cacheKey: this.cacheKey,
      zoom: this.zoomLevel,
      truncated: graph.truncated === true,
      anchorNodeIds: graph.nodes.filter((node) => node.isAnchor).map((node) => node.nodeId),
    });
    requestAnimationFrame(() => {
      this.centerAnchorNode(diagramHost, graph, renderSource);
    });
  }

  getViewStateKey() {
    return this.cacheKey ? `antinet-tree-structure:view:${this.cacheKey}` : "";
  }

  restoreViewState() {
    const key = this.getViewStateKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      this.zoomLevel = clampNumber(parsed?.zoom, MIN_ZOOM, MAX_ZOOM, 1);
    } catch (error) {
      console.warn("[AntinetTreeStructure][view-state.restore-fail]", error);
      this.zoomLevel = 1;
    }
  }

  saveViewState() {
    const key = this.getViewStateKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        zoom: this.zoomLevel,
        updatedAt: Date.now(),
      }));
    } catch (error) {
      console.warn("[AntinetTreeStructure][view-state.save-fail]", error);
    }
  }

  updateZoomDisplay() {
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }

  getRenderedSvg() {
    return this.diagramHost?.querySelector("svg") || null;
  }

  applyZoomToRenderedSvg() {
    const svg = this.getRenderedSvg();
    if (!svg) return;
    const viewBox = svg.viewBox?.baseVal;
    const rect = svg.getBoundingClientRect();
    const baseWidth = Number(svg.dataset.antinetBaseWidth)
      || (viewBox && viewBox.width)
      || Number.parseFloat(svg.getAttribute("width"))
      || rect.width
      || 1000;
    const baseHeight = Number(svg.dataset.antinetBaseHeight)
      || (viewBox && viewBox.height)
      || Number.parseFloat(svg.getAttribute("height"))
      || rect.height
      || 700;
    svg.dataset.antinetBaseWidth = String(baseWidth);
    svg.dataset.antinetBaseHeight = String(baseHeight);
    svg.style.maxWidth = "none";
    svg.style.width = `${Math.max(1, baseWidth * this.zoomLevel)}px`;
    svg.style.height = `${Math.max(1, baseHeight * this.zoomLevel)}px`;
  }

  setZoomLevel(nextZoom, options = {}) {
    const host = this.diagramHost;
    const oldZoom = this.zoomLevel;
    const zoom = clampNumber(nextZoom, MIN_ZOOM, MAX_ZOOM, oldZoom || 1);
    if (!host || Math.abs(zoom - oldZoom) < 0.001) return;

    const rect = host.getBoundingClientRect();
    const anchorX = Number.isFinite(options.anchorClientX)
      ? options.anchorClientX - rect.left
      : host.clientWidth / 2;
    const anchorY = Number.isFinite(options.anchorClientY)
      ? options.anchorClientY - rect.top
      : host.clientHeight / 2;
    const contentX = (host.scrollLeft + anchorX) / Math.max(oldZoom, 0.001);
    const contentY = (host.scrollTop + anchorY) / Math.max(oldZoom, 0.001);

    this.zoomLevel = zoom;
    this.applyZoomToRenderedSvg();
    this.updateZoomDisplay();
    requestAnimationFrame(() => {
      host.scrollLeft = Math.max(0, contentX * zoom - anchorX);
      host.scrollTop = Math.max(0, contentY * zoom - anchorY);
      if (options.centerAfter) this.centerAnchorNode(host, this.lastGraph, "zoom-reset");
      if (options.persist !== false) this.saveViewState();
    });
  }

  centerAnchorNode(diagramHost, graph, reason = "center") {
    if (!diagramHost || !graph) return;
    const anchorNode = graph.nodes.find((node) => node.nodeId === graph.centerNodeId)
      || graph.nodes.find((node) => node.isAnchor)
      || graph.nodes[0];
    if (!anchorNode) return;
    const centerOnce = (phase) => {
      const element = findRenderedNodeElement(diagramHost, anchorNode.nodeId);
      if (!element) {
        console.warn("[AntinetTreeStructure][center.skip]", { reason: "node-not-found", nodeId: anchorNode.nodeId });
        return;
      }
      const hostRect = diagramHost.getBoundingClientRect();
      const nodeRect = element.getBoundingClientRect();
      const deltaX = (nodeRect.left + nodeRect.width / 2) - (hostRect.left + hostRect.width / 2);
      const deltaY = (nodeRect.top + nodeRect.height / 2) - (hostRect.top + hostRect.height / 2);
      diagramHost.scrollLeft += deltaX;
      diagramHost.scrollTop += deltaY;
      console.info("[AntinetTreeStructure][center]", {
        reason,
        phase,
        nodeId: anchorNode.nodeId,
        deltaX: Math.round(deltaX),
        deltaY: Math.round(deltaY),
        zoom: this.zoomLevel,
      });
    };
    requestAnimationFrame(() => {
      centerOnce("first");
      requestAnimationFrame(() => {
        centerOnce("second");
        this.saveViewState();
      });
    });
  }

  bindRenderedClicks(diagramHost, graph) {
    for (const node of graph.nodes) {
      const selector = `g.node[id*="${node.nodeId}"], .node[id*="${node.nodeId}"]`;
      const elements = diagramHost.querySelectorAll(selector);
      for (const element of elements) {
        element.classList.add("antinet-tree-clickable-node");
        element.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await this.openNode(node.nodeId);
        });
      }
    }
  }

  applyCurrentNodeHighlight(diagramHost, graph) {
    if (!diagramHost || !graph) return;
    for (const element of diagramHost.querySelectorAll(".antinet-tree-current-node")) {
      element.classList.remove("antinet-tree-current-node");
      element.removeAttribute("data-antinet-current");
    }
    const currentNode = graph.nodes.find((node) => node.nodeId === graph.centerNodeId)
      || graph.nodes.find((node) => node.isAnchor);
    if (!currentNode) return;
    const element = findRenderedNodeElement(diagramHost, currentNode.nodeId);
    if (!element) {
      console.warn("[AntinetTreeStructure][current-highlight.skip]", {
        reason: "node-not-found",
        nodeId: currentNode.nodeId,
      });
      return;
    }
    element.classList.add("antinet-tree-current-node");
    element.setAttribute("data-antinet-current", "true");
  }

  bindFoldToggles(diagramHost, graph) {
    const namespace = "http://www.w3.org/2000/svg";
    for (const node of graph.nodes) {
      if (!node.hasChildren) continue;
      const element = findRenderedNodeElement(diagramHost, node.nodeId);
      if (!element || typeof element.getBBox !== "function") continue;
      let box = null;
      try {
        box = element.getBBox();
      } catch (error) {
        console.warn("[AntinetTreeStructure][fold-toggle.bbox-fail]", { nodeId: node.nodeId, error });
        continue;
      }
      const toggle = document.createElementNS(namespace, "g");
      toggle.classList.add("antinet-tree-fold-toggle");
      toggle.setAttribute("transform", `translate(${Math.round(box.x + box.width + 12)}, ${Math.round(box.y + 12)})`);
      toggle.setAttribute("role", "button");
      toggle.setAttribute("aria-label", node.isFolded ? "展开节点" : "折叠节点");

      const circle = document.createElementNS(namespace, "circle");
      circle.setAttribute("r", "10");
      const label = document.createElementNS(namespace, "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.textContent = node.isFolded ? "+" : "−";
      toggle.appendChild(circle);
      toggle.appendChild(label);
      toggle.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await this.plugin.setNodeFolded(graph, node, !node.isFolded);
        await this.render();
      });
      element.appendChild(toggle);
    }
  }

  async openNode(nodeId) {
    const node = this.nodeById.get(nodeId);
    if (!node) {
      new Notice(`未找到 Antinet 节点：${nodeId}`);
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(node.path);
    if (!(file instanceof TFile)) {
      new Notice(`未找到 note：${node.path}`);
      return;
    }
    await this.plugin.openNoteFile(file);
    this.close();
  }

  async goToParentLayer() {
    const parentFile = this.graphMode === "bus"
      ? await this.plugin.findNearestAncestorBusAtomFile(this.anchorFile)
      : await this.plugin.findNearestAncestorAtomFile(this.anchorFile);
    if (!(parentFile instanceof TFile)) {
      new Notice("当前 ATOM 没有可绘制的上一级 note。");
      return;
    }
    const fromInfo = parseAtomFile(this.anchorFile, this.plugin.settings.filePrefix);
    const toInfo = parseAtomFile(parentFile, this.plugin.settings.filePrefix);
    const fromPath = this.anchorFile?.path || "";
    this.saveViewState();
    this.anchorFile = parentFile;
    console.info("[AntinetTreeStructure][layer-up]", {
      fromCode: fromInfo?.code || "",
      fromPath,
      toCode: toInfo?.code || "",
      toPath: parentFile.path,
      graphMode: this.graphMode,
    });
    await this.render();
  }
}

class AntinetTreeStructurePlugin extends Plugin {
  async onload() {
    this.settings = normalizeSettings(await this.loadData());
    this.renderCache = { version: RENDER_CACHE_VERSION, entries: [] };
    this.uiState = { version: UI_STATE_VERSION, folded: {}, showBusNodes: true };
    this.prewarmTimers = new Map();
    this.renderCacheIndexSaveTimer = null;
    this.keywordCache = new Map();
    this.atomIndex = null;
    this.libraryScanAbort = false;
    this.libraryScanRunning = false;
    await this.loadRenderCache();
    await this.loadUiState();

    this.addRibbonIcon("git-branch", "Antinet 树的结构", async () => {
      await this.openFromActiveNote();
    });

    this.addCommand({
      id: "open-antinet-tree-from-active-note",
      name: "从当前笔记打开 Antinet 树的结构",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile)) return false;
        if (!checking) this.openFromActiveNote();
        return true;
      },
    });
    this.addCommand({
      id: "prewarm-antinet-tree-library-svg-cache",
      name: "扫描并预热 Antinet 树 SVG 缓存",
      callback: () => {
        this.scanLibrarySvgCache("manual-command").catch((error) => {
          console.error("[AntinetTreeStructure][library-scan.fail]", error);
          new Notice(`Antinet 树库扫描失败：${error?.message || error}`);
        });
      },
    });
    this.addCommand({
      id: "stop-antinet-tree-library-svg-scan",
      name: "停止 Antinet 树 SVG 缓存扫描",
      callback: () => {
        this.libraryScanAbort = true;
        new Notice("已请求停止 Antinet 树 SVG 缓存扫描。");
      },
    });

    this.addSettingTab(new AntinetTreeStructureSettingTab(this.app, this));

    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      this.invalidateKeywordCacheForFile(file);
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      this.invalidateKeywordCacheForFile(file);
    }));
    this.registerEvent(this.app.vault.on("create", (file) => {
      this.invalidateAtomIndex();
      this.invalidateKeywordCacheForFile(file);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.invalidateAtomIndex();
      this.invalidateKeywordCacheForPath(oldPath);
      this.invalidateKeywordCacheForFile(file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      this.invalidateAtomIndex();
      this.invalidateKeywordCacheForFile(file);
    }));
  }

  onunload() {
    for (const timer of this.prewarmTimers?.values?.() || []) window.clearTimeout(timer);
    this.prewarmTimers?.clear?.();
    if (this.renderCacheIndexSaveTimer) {
      window.clearTimeout(this.renderCacheIndexSaveTimer);
      this.renderCacheIndexSaveTimer = null;
      void this.saveRenderCacheIndex("unload");
    }
    this.keywordCache?.clear?.();
    this.atomIndex = null;
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.keywordCache?.clear?.();
    this.invalidateAtomIndex();
  }

  async openFromActiveNote() {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== "md") {
      new Notice("请先打开一个 ATOM Markdown note。");
      return;
    }
    const info = parseAtomFile(file, this.settings.filePrefix);
    if (!info) {
      new Notice(`当前笔记不是 ${this.settings.filePrefix} 编码 note。`);
      return;
    }
    const keywords = await this.getKeywordsForFile(file, { debugReason: "open-active-note", forceDebug: true });
    if (!keywords.length) {
      new Notice("当前 note 没有可用于绘图的关键词。");
      return;
    }
    new AntinetTreeModal(this.app, this, file).open();
  }

  invalidateKeywordCacheForPath(path) {
    if (!path || !this.keywordCache) return;
    this.keywordCache.delete(path);
  }

  invalidateKeywordCacheForFile(file) {
    if (!(file instanceof TFile)) return;
    this.invalidateKeywordCacheForPath(file.path);
  }

  async getKeywordsForFile(file, options = {}) {
    const signature = fileCacheSignature(file, this.settings);
    const cached = this.keywordCache?.get(file.path);
    if (!options.forceDebug && cached?.signature === signature && Array.isArray(cached.keywords)) {
      cached.lastUsedAt = Date.now();
      return cached.keywords.slice();
    }
    const cache = this.app.metadataCache.getFileCache(file);
    const metadataValues = parseFrontmatterKeywordValues(cache?.frontmatter, this.settings);
    const rawFrontmatterValues = await parseRawFrontmatterKeywordValues(file, this.app, this.settings);
    const filenameValues = parseInlineFilenameKeywords(file.name);
    const candidates = [
      ...metadataValues.map((value) => describeKeywordCandidate(value, this.settings, "metadataCache")),
      ...rawFrontmatterValues.map((value) => describeKeywordCandidate(value, this.settings, "raw-frontmatter")),
      ...filenameValues.map((value) => describeKeywordCandidate(value, this.settings, "filename-inline")),
    ];
    const keywords = unique(candidates.map((candidate) => candidate.drawable))
      .filter((keyword) => shouldKeepKeyword(keyword, this.settings));
    const hasOnlyRejectedCandidates = candidates.length > 0 && !keywords.length;
    if (options.forceDebug || hasOnlyRejectedCandidates) {
      console.info("[AntinetTreeStructure][keywords.diagnose]", {
        reason: options.debugReason || "keyword-extract",
        path: file.path,
        metadataValues,
        rawFrontmatterValues,
        filenameValues,
        candidates,
        drawableKeywords: keywords,
      });
    }
    if (!options.forceDebug) {
      this.keywordCache?.set(file.path, {
        signature,
        keywords: keywords.slice(),
        updatedAt: Date.now(),
        lastUsedAt: Date.now(),
      });
    }
    return keywords.slice();
  }

  buildAtomIndex() {
    const files = this.app.vault.getMarkdownFiles();
    const records = [];
    const codeToRecord = new Map();
    const parentCodeToRecords = new Map();
    for (const file of files) {
      const info = parseAtomFile(file, this.settings.filePrefix);
      if (!info) continue;
      records.push(info);
    }
    records.sort((left, right) => compareCodes(left.code, right.code));
    for (const record of records) {
      codeToRecord.set(record.code, record);
      const parentCode = parentCodeOf(record.code);
      if (!parentCodeToRecords.has(parentCode)) parentCodeToRecords.set(parentCode, []);
      parentCodeToRecords.get(parentCode).push(record);
    }
    this.atomIndex = {
      settingsSignature: keywordSettingsSignature(this.settings),
      records,
      codeToRecord,
      parentCodeToRecords,
      updatedAt: Date.now(),
    };
    console.info("[AntinetTreeStructure][atom-index.rebuild]", { recordCount: records.length });
    return this.atomIndex;
  }

  getAtomIndex() {
    if (this.atomIndex?.settingsSignature === keywordSettingsSignature(this.settings)) return this.atomIndex;
    return this.buildAtomIndex();
  }

  invalidateAtomIndex() {
    this.atomIndex = null;
  }

  async collectAtomRecords() {
    return this.getAtomIndex().records.slice();
  }

  collectRecordsForParentGroup(parentCode) {
    const atomIndex = this.getAtomIndex();
    if (!parentCode) return atomIndex.records.slice();
    const records = [];
    const parentRecord = atomIndex.codeToRecord.get(parentCode);
    if (parentRecord) records.push(parentRecord);
    const collectChildren = (code) => {
      const children = atomIndex.parentCodeToRecords.get(code) || [];
      for (const child of children) {
        records.push(child);
        collectChildren(child.code);
      }
    };
    collectChildren(parentCode);
    return records;
  }

  collectRecordsForGraphStart(startCode) {
    const atomIndex = this.getAtomIndex();
    if (!startCode) return [];
    const records = [];
    const startRecord = atomIndex.codeToRecord.get(startCode);
    if (startRecord) records.push(startRecord);
    const collectChildren = (code) => {
      const children = atomIndex.parentCodeToRecords.get(code) || [];
      for (const child of children) {
        records.push(child);
        collectChildren(child.code);
      }
    };
    collectChildren(startCode);
    return records;
  }

  isKeywordGraphStartFile(file) {
    if (!(file instanceof TFile)) return false;
    const cache = this.app.metadataCache.getFileCache(file);
    return isTruthyFrontmatterValue(cache?.frontmatter?.[KEYWORD_GRAPH_START_KEY]);
  }

  async findKeywordGraphStartRecord(file) {
    const info = parseAtomFile(file, this.settings.filePrefix);
    if (!info) return null;
    const atomIndex = this.getAtomIndex();
    let code = info.code;
    while (code) {
      const record = atomIndex.codeToRecord.get(code);
      if (record?.file instanceof TFile && this.isKeywordGraphStartFile(record.file)) {
        const keywords = await this.getKeywordsForFile(record.file);
        if (keywords.length) return { ...record, keywords };
      }
      code = parentCodeOf(code);
    }
    return null;
  }

  async findNearestAncestorAtomFile(file) {
    const info = parseAtomFile(file, this.settings.filePrefix);
    if (!info) return null;
    const atomIndex = this.getAtomIndex();
    let code = parentCodeOf(info.code);
    while (code) {
      const record = atomIndex.codeToRecord.get(code);
      if (record?.file instanceof TFile) {
        const keywords = await this.getKeywordsForFile(record.file);
        if (keywords.length) return record.file;
      }
      code = parentCodeOf(code);
    }
    return null;
  }

  async fileHasTerminalBusKeyword(file) {
    if (!(file instanceof TFile)) return false;
    const keywords = await this.getKeywordsForFile(file);
    return keywords.some((keyword) => hasTerminalBusDrawerSegment(keyword));
  }

  async findNearestAncestorBusAtomFile(file) {
    const info = parseAtomFile(file, this.settings.filePrefix);
    if (!info) return null;
    const atomIndex = this.getAtomIndex();
    let code = parentCodeOf(info.code);
    while (code) {
      const record = atomIndex.codeToRecord.get(code);
      if (record?.file instanceof TFile && await this.fileHasTerminalBusKeyword(record.file)) {
        return record.file;
      }
      code = parentCodeOf(code);
    }
    return null;
  }

  async buildGraphForFile(anchorFile, options = {}) {
    const graphMode = options.graphMode === "bus" ? "bus" : "keyword";
    const budget = normalizeGraphBudget(options.budget);
    const renderToken = options.renderToken || null;
    const onStatus = typeof options.onStatus === "function" ? options.onStatus : null;
    const anchorInfo = parseAtomFile(anchorFile, this.settings.filePrefix);
    if (!anchorInfo) throw new Error("active-note-not-atom");
    const anchorKeywords = await this.getKeywordsForFile(anchorFile);
    assertNotCancelled(renderToken);
    if (!anchorKeywords.length) throw new Error("active-note-no-keyword");
    if (graphMode === "bus" && !anchorKeywords.some((keyword) => hasTerminalBusDrawerSegment(keyword))) {
      throw new Error("active-note-not-terminal-bus");
    }

    const graphStartRecord = graphMode === "bus" ? null : await this.findKeywordGraphStartRecord(anchorFile);
    assertNotCancelled(renderToken);
    const requestedScopeMode = options.scopeMode === "parent-group" ? "parent-group" : "anchor-subtree";
    const effectiveScopeMode = graphMode === "bus" ? "parent-group" : requestedScopeMode;
    const parentCode = graphStartRecord?.code
      || (effectiveScopeMode === "anchor-subtree" ? anchorInfo.code : parentCodeOf(anchorInfo.code));
    const rawCandidateRecords = graphStartRecord
      ? this.collectRecordsForGraphStart(graphStartRecord.code)
      : effectiveScopeMode === "anchor-subtree"
        ? this.collectRecordsForGraphStart(anchorInfo.code)
        : this.collectRecordsForParentGroup(parentCode);
    const prioritizedRecords = prioritizeRecordsForAnchor(rawCandidateRecords, anchorInfo.code);
    const candidateRecordCount = prioritizedRecords.length;
    let candidateRecords = prioritizedRecords;
    let truncated = false;
    let partialReason = "";
    if (budget && candidateRecords.length > budget.maxRecords) {
      candidateRecords = candidateRecords.slice(0, budget.maxRecords);
      const anchorRecord = prioritizedRecords.find((record) => record.code === anchorInfo.code);
      if (anchorRecord && !candidateRecords.some((record) => record.code === anchorInfo.code)) {
        candidateRecords[candidateRecords.length - 1] = anchorRecord;
      }
      truncated = true;
      partialReason = "record-budget";
    }

    const keywordRecords = [];
    let scannedRecordCount = 0;
    let totalCandidateNodeCount = 0;
    let acceptedNodeCount = 0;
    for (const record of candidateRecords) {
      assertNotCancelled(renderToken);
      scannedRecordCount += 1;
      if (budget && scannedRecordCount % budget.batchSize === 0) {
        onStatus?.(`正在扫描 ${scannedRecordCount}/${candidateRecordCount} notes，已找到 ${totalCandidateNodeCount} 个关键词节点...`);
        await sleep(budget.yieldMs);
        assertNotCancelled(renderToken);
      }
      const keywords = await this.getKeywordsForFile(record.file);
      if (!keywords.length) continue;
      totalCandidateNodeCount += keywords.length;
      let drawableKeywords = keywords;
      if (budget) {
        const remaining = budget.maxNodes - acceptedNodeCount;
        if (remaining <= 0) {
          truncated = true;
          partialReason = partialReason || "node-budget";
          break;
        }
        if (keywords.length > remaining) {
          drawableKeywords = keywords.slice(0, remaining);
          truncated = true;
          partialReason = partialReason || "node-budget";
        }
      }
      keywordRecords.push({ ...record, keywords: drawableKeywords });
      acceptedNodeCount += drawableKeywords.length;
      if (budget && totalCandidateNodeCount >= budget.maxNodes) {
        truncated = true;
        partialReason = partialReason || "node-budget";
        break;
      }
    }
    keywordRecords.sort((left, right) => compareCodes(left.code, right.code));

    const keywordCodeSet = new Set(keywordRecords.map((record) => record.code));
    const nodes = [];
    for (const record of keywordRecords) {
      for (const keyword of record.keywords) {
        nodes.push({
          nodeId: `K${String(nodes.length + 1).padStart(3, "0")}`,
          keyword,
          label: displayKeyword(keyword, this.settings),
          code: record.code,
          title: record.title,
          path: record.path,
          hasBusDrawer: hasBusDrawerSegment(keyword),
          isAnchor: record.code === anchorInfo.code,
          parentCode: nearestKeywordParentCode(record.code, keywordCodeSet),
        });
      }
    }

    const firstNodeByCode = new Map();
    for (const node of nodes) {
      if (!firstNodeByCode.has(node.code)) firstNodeByCode.set(node.code, node.nodeId);
    }

    const rootNodeId = "ROOT";
    const edges = [];
    const seenEdges = new Set();
    for (const node of nodes) {
      const parentNodeId = firstNodeByCode.get(node.parentCode) || rootNodeId;
      node.parentNodeId = parentNodeId;
      const edgeKey = `${parentNodeId}->${node.nodeId}`;
      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey);
        edges.push([parentNodeId, node.nodeId]);
      }
    }
    if (budget && edges.length > budget.maxEdges) {
      edges.length = budget.maxEdges;
      truncated = true;
      partialReason = partialReason || "edge-budget";
    }

    return {
      anchorCode: anchorInfo.code,
      anchorTitle: anchorInfo.title,
      anchorKeyword: displayKeyword(anchorKeywords[0], this.settings),
      graphMode,
      scopeMode: effectiveScopeMode,
      parentCode,
      graphStartCode: graphStartRecord?.code || "",
      graphStartPath: graphStartRecord?.path || "",
      graphStartKeyword: graphStartRecord ? displayKeyword(graphStartRecord.keywords[0], this.settings) : "",
      rootNodeId,
      rootLabel: graphMode === "bus"
        ? `BUS同级组 ${parentCode || "ROOT"}`
        : graphStartRecord
        ? `关键词图 ${displayKeyword(graphStartRecord.keywords[0], this.settings)}`
        : effectiveScopeMode === "anchor-subtree"
        ? `当前子树 ${anchorInfo.code}`
        : (parentCode ? `同级组 ${parentCode}` : "ROOT 同级组"),
      recordCount: keywordRecords.length,
      nodes,
      edges,
      candidateRecordCount,
      scannedRecordCount,
      totalCandidateNodeCount,
      truncated,
      partialReason,
      maxRecords: budget?.maxRecords || 0,
      maxNodes: budget?.maxNodes || 0,
      maxEdges: budget?.maxEdges || 0,
      maxSourceChars: budget?.maxSourceChars || 0,
    };
  }

  shouldSkipInteractiveMermaid(graph, mermaidCode) {
    if (!graph || !graph.maxNodes) return false;
    if ((graph.nodes?.length || 0) > graph.maxNodes) return true;
    if ((graph.edges?.length || 0) > graph.maxEdges) return true;
    if (String(mermaidCode || "").length > graph.maxSourceChars) return true;
    if (graph.truncated && graph.partialReason === "edge-budget") return true;
    return false;
  }

  generateMermaidCode(graph) {
    const lines = [];
    lines.push("flowchart LR");
    lines.push(`  ${graph.rootNodeId}["${escapeMermaidLabel(graph.rootLabel)}"]`);
    for (const node of graph.nodes) {
      const label = node.label;
      lines.push(`  ${node.nodeId}["${escapeMermaidLabel(label)}"]`);
    }
    for (const [parentNodeId, childNodeId] of graph.edges) {
      lines.push(`  ${parentNodeId} --> ${childNodeId}`);
    }
    const clickableNodeIds = graph.nodes.map((node) => node.nodeId);
    if (clickableNodeIds.length) {
      lines.push("  classDef clickable cursor:pointer,stroke-width:2px;");
      lines.push(`  class ${clickableNodeIds.join(",")} clickable;`);
    }
    const busNodeIds = graph.nodes.filter((node) => node.hasBusDrawer && !node.isFolded).map((node) => node.nodeId);
    if (busNodeIds.length) {
      lines.push("  classDef bus fill:#fef2f2,stroke:#ef4444,stroke-width:3px,color:#7f1d1d;");
      lines.push(`  class ${busNodeIds.join(",")} bus;`);
    }
    const foldedNodeIds = graph.nodes.filter((node) => node.isFolded && !node.hasBusDrawer).map((node) => node.nodeId);
    if (foldedNodeIds.length) {
      lines.push("  classDef folded fill:#fffbeb,stroke:#d97706,stroke-width:4px,color:#78350f;");
      lines.push(`  class ${foldedNodeIds.join(",")} folded;`);
    }
    const foldedBusNodeIds = graph.nodes.filter((node) => node.isFolded && node.hasBusDrawer).map((node) => node.nodeId);
    if (foldedBusNodeIds.length) {
      lines.push("  classDef foldedBus fill:#fef2f2,stroke:#d97706,stroke-width:4px,color:#7f1d1d;");
      lines.push(`  class ${foldedBusNodeIds.join(",")} foldedBus;`);
    }
    lines.push("  classDef root fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;");
    lines.push(`  class ${graph.rootNodeId} root;`);
    return lines.join("\n");
  }

  getFoldScopeKey(graph) {
    return `${this.settings.filePrefix}${graph.parentCode || "ROOT"}`;
  }

  getFoldStateKeyForNode(node) {
    return `keyword::${node?.keyword || node?.label || ""}`;
  }

  areBusNodesVisible() {
    return this.uiState?.showBusNodes !== false;
  }

  async setBusNodesVisible(visible) {
    if (!this.uiState || this.uiState.version !== UI_STATE_VERSION) {
      this.uiState = { version: UI_STATE_VERSION, folded: {}, showBusNodes: true };
    }
    this.uiState.showBusNodes = visible !== false;
    this.uiState.updatedAt = Date.now();
    await this.saveUiState();
    console.info("[AntinetTreeStructure][bus-visibility.set]", {
      showBusNodes: this.uiState.showBusNodes,
    });
  }

  isNodeFolded(node) {
    return this.uiState?.folded?.[this.getFoldStateKeyForNode(node)] === true;
  }

  async setNodeFolded(graph, node, folded) {
    if (!node?.code) return;
    if (!this.uiState || this.uiState.version !== UI_STATE_VERSION) {
      this.uiState = { version: UI_STATE_VERSION, folded: {}, showBusNodes: true };
    }
    this.uiState.folded[this.getFoldStateKeyForNode(node)] = folded === true;
    this.uiState.updatedAt = Date.now();
    await this.saveUiState();
    console.info("[AntinetTreeStructure][fold-state.set]", {
      key: this.getFoldStateKeyForNode(node),
      code: node.code,
      keyword: node.keyword,
      folded: folded === true,
    });
  }

  async revealFoldedAncestorsForAnchor(graph) {
    if (!graph?.anchorCode || !this.uiState?.folded) return;
    let changed = false;
    for (const node of graph.nodes) {
      if (!isDescendantCode(node.code, graph.anchorCode)) continue;
      const key = this.getFoldStateKeyForNode(node);
      if (this.uiState.folded[key] === true) {
        this.uiState.folded[key] = false;
        changed = true;
      }
    }
    if (!changed) return;
    this.uiState.updatedAt = Date.now();
    await this.saveUiState();
    console.info("[AntinetTreeStructure][fold-state.reveal-anchor-path]", {
      scope: this.getFoldScopeKey(graph),
      anchorCode: graph.anchorCode,
    });
  }

  applyFoldedState(graph) {
    const nodes = graph.nodes.map((node) => ({ ...node }));
    const nodeCodeSet = new Set(nodes.map((node) => node.code));
    const codesWithChildren = new Set();
    for (const node of nodes) {
      let cursor = parentCodeOf(node.code);
      while (cursor) {
        if (nodeCodeSet.has(cursor)) codesWithChildren.add(cursor);
        cursor = parentCodeOf(cursor);
      }
    }
    const foldedCodes = new Set(
      nodes
        .filter((node) => codesWithChildren.has(node.code) && this.isNodeFolded(node))
        .map((node) => node.code)
    );
    const isHiddenByFold = (node) => {
      let cursor = parentCodeOf(node.code);
      while (cursor) {
        if (foldedCodes.has(cursor)) return true;
        cursor = parentCodeOf(cursor);
      }
      return false;
    };
    const foldVisibleNodes = nodes.filter((node) => !isHiddenByFold(node));
    const showBusNodes = graph.graphMode === "bus" || this.areBusNodesVisible();
    const visibleNodes = foldVisibleNodes
      .filter((node) => showBusNodes || !node.hasBusDrawer)
      .map((node) => ({
        ...node,
        hasChildren: codesWithChildren.has(node.code),
        isFolded: codesWithChildren.has(node.code) && this.isNodeFolded(node),
      }));

    const firstVisibleNodeByCode = new Map();
    for (const node of visibleNodes) {
      if (!firstVisibleNodeByCode.has(node.code)) firstVisibleNodeByCode.set(node.code, node.nodeId);
    }

    const visibleCodeSet = new Set(visibleNodes.map((node) => node.code));
    const edges = [];
    const seenEdges = new Set();
    for (const node of visibleNodes) {
      const parentCode = nearestKeywordParentCode(node.code, visibleCodeSet);
      const parentNodeId = firstVisibleNodeByCode.get(parentCode) || graph.rootNodeId;
      node.parentNodeId = parentNodeId;
      const edgeKey = `${parentNodeId}->${node.nodeId}`;
      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey);
        edges.push([parentNodeId, node.nodeId]);
      }
    }

    const anchorNode = visibleNodes.find((node) => node.isAnchor);
    const hiddenAnchor = nodes.find((node) => node.isAnchor);
    let centerNodeId = anchorNode?.nodeId || "";
    if (!centerNodeId && hiddenAnchor) {
      const parts = String(hiddenAnchor.code || "").split(".").filter(Boolean);
      for (let index = parts.length - 1; index > 0; index -= 1) {
        const ancestorCode = parts.slice(0, index).join(".");
        const visibleAncestor = visibleNodes.find((node) => node.code === ancestorCode);
        if (visibleAncestor) {
          centerNodeId = visibleAncestor.nodeId;
          break;
        }
      }
    }

    return {
      ...graph,
      nodes: visibleNodes,
      edges,
      foldedCodes: Array.from(foldedCodes),
      hiddenNodeCount: graph.nodes.length - foldVisibleNodes.length,
      busHiddenNodeCount: foldVisibleNodes.length - visibleNodes.length,
      showBusNodes,
      totalNodeCount: graph.nodes.length,
      centerNodeId,
    };
  }

  getPluginBaseDir() {
    const baseDir = this.manifest?.dir || `.obsidian/plugins/${this.manifest?.id || "antinet-tree-structure"}`;
    return normalizePluginPath(baseDir);
  }

  getLegacyRenderCachePath() {
    return normalizePluginPath(`${this.getPluginBaseDir()}/${LEGACY_RENDER_CACHE_FILE}`);
  }

  getRenderCacheDir() {
    return normalizePluginPath(`${this.getPluginBaseDir()}/${RENDER_CACHE_DIR}`);
  }

  getRenderCacheIndexPath() {
    return normalizePluginPath(`${this.getRenderCacheDir()}/${RENDER_CACHE_INDEX_FILE}`);
  }

  getRenderCacheSvgPath(fileName) {
    return normalizePluginPath(`${this.getRenderCacheDir()}/${fileName}`);
  }

  getUiStatePath() {
    const baseDir = this.manifest?.dir || `.obsidian/plugins/${this.manifest?.id || "antinet-tree-structure"}`;
    return `${baseDir}/${UI_STATE_FILE}`;
  }

  async loadRenderCache() {
    this.renderCache = { version: RENDER_CACHE_VERSION, entries: [] };
    try {
      const indexPath = this.getRenderCacheIndexPath();
      if (!await this.pathExists(indexPath)) {
        if (await this.pathExists(this.getLegacyRenderCachePath())) {
          console.info("[AntinetTreeStructure][render-cache.legacy-ignored]", {
            path: this.getLegacyRenderCachePath(),
            reason: "split-svg-cache-enabled"
          });
        }
        return;
      }
      const raw = await this.app.vault.adapter.read(indexPath);
      const parsed = JSON.parse(raw);
      if (parsed?.version === RENDER_CACHE_VERSION && Array.isArray(parsed.entries)) {
        this.renderCache = {
          version: RENDER_CACHE_VERSION,
          entries: parsed.entries
            .filter((entry) => entry?.key && entry?.file)
            .slice(0, RENDER_CACHE_MAX_ENTRIES),
        };
      }
    } catch (error) {
      this.renderCache = { version: RENDER_CACHE_VERSION, entries: [] };
    }
  }

  async pathExists(path) {
    try {
      return await this.app.vault.adapter.exists(normalizePluginPath(path));
    } catch (error) {
      return false;
    }
  }

  async ensureRenderCacheDir() {
    const dir = this.getRenderCacheDir();
    if (await this.pathExists(dir)) return;
    await this.app.vault.adapter.mkdir(dir);
  }

  async saveRenderCacheIndex(reason = "unknown") {
    await this.ensureRenderCacheDir();
    const payload = JSON.stringify({
      version: RENDER_CACHE_VERSION,
      updatedAt: Date.now(),
      reason,
      maxEntries: RENDER_CACHE_MAX_ENTRIES,
      maxTotalBytes: RENDER_CACHE_MAX_TOTAL_BYTES,
      maxSingleSvgBytes: RENDER_CACHE_MAX_SINGLE_SVG_BYTES,
      entries: Array.isArray(this.renderCache?.entries) ? this.renderCache.entries : [],
    }, null, 2);
    await this.app.vault.adapter.write(this.getRenderCacheIndexPath(), payload);
  }

  scheduleRenderCacheIndexSave(reason = "debounced") {
    if (this.renderCacheIndexSaveTimer) window.clearTimeout(this.renderCacheIndexSaveTimer);
    this.renderCacheIndexSaveTimer = window.setTimeout(() => {
      this.renderCacheIndexSaveTimer = null;
      this.saveRenderCacheIndex(reason).catch((error) => {
        console.warn("[AntinetTreeStructure][render-cache.index-save-fail]", error);
      });
    }, RENDER_CACHE_INDEX_SAVE_DEBOUNCE_MS);
  }

  async loadUiState() {
    try {
      const raw = await this.app.vault.adapter.read(this.getUiStatePath());
      const parsed = JSON.parse(raw);
      if (parsed?.version === UI_STATE_VERSION && parsed.folded && typeof parsed.folded === "object") {
        this.uiState = {
          version: UI_STATE_VERSION,
          folded: { ...parsed.folded },
          showBusNodes: parsed.showBusNodes !== false,
          updatedAt: parsed.updatedAt || 0,
        };
      }
    } catch (error) {
      this.uiState = { version: UI_STATE_VERSION, folded: {}, showBusNodes: true };
    }
  }

  async saveUiState() {
    const payload = JSON.stringify(this.uiState, null, 2);
    await this.app.vault.adapter.write(this.getUiStatePath(), payload);
  }

  buildRenderCacheKey(mermaidCode) {
    return `antinet-tree-svg-v${RENDER_CACHE_VERSION}-${simpleHash(JSON.stringify({
      mermaidCode,
      renderConfig: {
        securityLevel: "loose",
        maxEdges: MERMAID_MAX_EDGES,
        flowchart: { useMaxWidth: false, htmlLabels: true, curve: "basis" },
      },
    }))}`;
  }

  async getRenderCache(key, options = {}) {
    const entries = Array.isArray(this.renderCache?.entries) ? this.renderCache.entries : [];
    const entry = entries.find((item) => item.key === key);
    if (!entry) return null;
    const requiredNodeIds = Array.isArray(options.requiredNodeIds) ? options.requiredNodeIds : [];
    if (requiredNodeIds.length) {
      const nodeIds = new Set(Array.isArray(entry.nodeIds) ? entry.nodeIds : []);
      if (!requiredNodeIds.some((nodeId) => nodeIds.has(nodeId))) return null;
    }
    entry.lastUsedAt = Date.now();
    this.scheduleRenderCacheIndexSave("hit");
    try {
      const svgOuterHTML = await this.app.vault.adapter.read(this.getRenderCacheSvgPath(entry.file));
      return { ...entry, svgOuterHTML };
    } catch (error) {
      this.renderCache.entries = entries.filter((item) => item.key !== key);
      this.scheduleRenderCacheIndexSave("missing-svg");
      console.warn("[AntinetTreeStructure][render-cache.svg-missing]", { key, file: entry.file });
      return null;
    }
  }

  async putRenderCache(key, partialEntry) {
    if (!partialEntry?.svgOuterHTML) return;
    const svgOuterHTML = String(partialEntry.svgOuterHTML || "");
    const bytes = byteLength(svgOuterHTML);
    if (bytes > RENDER_CACHE_MAX_SINGLE_SVG_BYTES) {
      console.info("[AntinetTreeStructure][render-cache.skip-large-svg]", {
        key,
        bytes,
        maxBytes: RENDER_CACHE_MAX_SINGLE_SVG_BYTES,
        source: partialEntry.source || "unknown",
      });
      return;
    }
    await this.ensureRenderCacheDir();
    const file = safeCacheFileName(key);
    await this.app.vault.adapter.write(this.getRenderCacheSvgPath(file), svgOuterHTML);
    const entries = Array.isArray(this.renderCache?.entries) ? this.renderCache.entries : [];
    const nextEntry = {
      key,
      file,
      version: RENDER_CACHE_VERSION,
      updatedAt: Date.now(),
      lastUsedAt: Date.now(),
      mermaidCodeHash: partialEntry.mermaidCodeHash,
      nodeIds: partialEntry.nodeIds,
      anchorNodeIds: partialEntry.anchorNodeIds,
      nodeCount: partialEntry.nodeCount,
      edgeCount: partialEntry.edgeCount,
      codeChars: partialEntry.codeChars,
      source: partialEntry.source || "unknown",
      bytes,
    };
    const kept = entries.filter((entry) => entry.key !== key);
    kept.unshift(nextEntry);
    kept.sort((left, right) => (right.lastUsedAt || right.updatedAt || 0) - (left.lastUsedAt || left.updatedAt || 0));
    const retained = [];
    const evicted = [];
    let totalBytes = 0;
    for (const entry of kept) {
      const entryBytes = Math.max(0, Number(entry.bytes || 0));
      if (retained.length >= RENDER_CACHE_MAX_ENTRIES || totalBytes + entryBytes > RENDER_CACHE_MAX_TOTAL_BYTES) {
        evicted.push(entry);
        continue;
      }
      retained.push(entry);
      totalBytes += entryBytes;
    }
    this.renderCache = {
      version: RENDER_CACHE_VERSION,
      entries: retained,
    };
    for (const entry of evicted) {
      if (!entry?.file || entry.file === file) continue;
      try {
        await this.app.vault.adapter.remove(this.getRenderCacheSvgPath(entry.file));
      } catch (error) {
        // Best-effort cleanup only; stale SVG files are harmless derived cache.
      }
    }
    try {
      this.scheduleRenderCacheIndexSave("put");
      console.info("[AntinetTreeStructure][render-cache.put]", {
        key,
        source: partialEntry.source || "unknown",
        nodeCount: partialEntry.nodeCount,
        bytes,
        totalBytes,
        evicted: evicted.length,
      });
    } catch (error) {
      console.warn("[AntinetTreeStructure][render-cache.save-fail]", error);
    }
  }

  initializeMermaid() {
    const mermaid = window.mermaid;
    if (!mermaid || typeof mermaid.render !== "function") return null;
    if (typeof mermaid.initialize === "function") {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        maxEdges: MERMAID_MAX_EDGES,
        flowchart: { useMaxWidth: false, htmlLabels: true, curve: "basis" },
      });
    }
    return mermaid;
  }

  async renderMermaidSvg(mermaidCode, source = "render") {
    const mermaid = this.initializeMermaid();
    if (!mermaid) throw new Error("window.mermaid unavailable");
    const renderId = `antinet-tree-${simpleHash(mermaidCode)}-${source}-${Date.now()}`;
    const rendered = await mermaid.render(renderId, mermaidCode);
    const svgOuterHTML = svgFromMermaidRenderResult(rendered);
    if (!svgOuterHTML) throw new Error("empty mermaid render result");
    return svgOuterHTML;
  }

  async scanLibrarySvgCache(reason = "manual") {
    if (this.libraryScanRunning) {
      new Notice("Antinet 树 SVG 缓存扫描已在运行。");
      return;
    }
    if (!this.initializeMermaid()) {
      new Notice("当前页面未检测到 Mermaid，无法预热 SVG 缓存。");
      return;
    }

    this.libraryScanRunning = true;
    this.libraryScanAbort = false;
    const startedAt = Date.now();
    const stats = {
      reason,
      total: 0,
      checked: 0,
      rendered: 0,
      cacheHit: 0,
      skipped: 0,
      skippedLarge: 0,
      failed: 0,
      aborted: false,
    };

    try {
      const records = await this.collectAtomRecords();
      const scannedParentCodes = new Set();
      stats.total = records.length;
      new Notice(`开始安全扫描 Antinet 树 SVG 缓存：${records.length} 个 ATOM，较大图会跳过。`);
      console.info("[AntinetTreeStructure][library-scan.start]", stats);

      for (const record of records) {
        if (this.libraryScanAbort) {
          stats.aborted = true;
          break;
        }
        stats.checked += 1;
        await sleep(LIBRARY_SCAN_BATCH_DELAY_MS);
        try {
          const parentCode = parentCodeOf(record.code);
          if (scannedParentCodes.has(parentCode)) {
            stats.skipped += 1;
            continue;
          }
          scannedParentCodes.add(parentCode);

          const groupRecords = this.collectRecordsForParentGroup(parentCode);
          if (groupRecords.length > LIBRARY_SCAN_MAX_GROUP_RECORDS) {
            stats.skippedLarge += 1;
            console.info("[AntinetTreeStructure][library-scan.skip-large]", {
              path: record.path,
              parentCode,
              groupRecordCount: groupRecords.length,
              maxGroupRecords: LIBRARY_SCAN_MAX_GROUP_RECORDS,
              reason: "group-too-large-before-keyword-scan",
            });
            continue;
          }

          const keywords = await this.getKeywordsForFile(record.file);
          if (!keywords.length) {
            stats.skipped += 1;
            continue;
          }

          const graph = this.applyFoldedState(await this.buildGraphForFile(record.file));
          if (graph.nodes.length > LIBRARY_SCAN_MAX_RENDER_NODES || graph.edges.length > LIBRARY_SCAN_MAX_RENDER_EDGES) {
            stats.skippedLarge += 1;
            console.info("[AntinetTreeStructure][library-scan.skip-large]", {
              path: record.path,
              nodeCount: graph.nodes.length,
              edgeCount: graph.edges.length,
              maxNodes: LIBRARY_SCAN_MAX_RENDER_NODES,
              maxEdges: LIBRARY_SCAN_MAX_RENDER_EDGES,
            });
            continue;
          }
          const mermaidCode = this.generateMermaidCode(graph);
          const key = this.buildRenderCacheKey(mermaidCode);
          const requiredNodeIds = graph.nodes.map((node) => node.nodeId);
          if (await this.getRenderCache(key, { requiredNodeIds })) {
            stats.cacheHit += 1;
          } else {
            const svgOuterHTML = await this.renderMermaidSvg(mermaidCode, "library-scan");
            await this.putRenderCache(key, {
              svgOuterHTML,
              mermaidCodeHash: simpleHash(mermaidCode),
              nodeIds: requiredNodeIds,
              anchorNodeIds: graph.nodes.filter((node) => node.isAnchor).map((node) => node.nodeId),
              nodeCount: graph.nodes.length,
              edgeCount: graph.edges.length,
              codeChars: mermaidCode.length,
              source: "library-scan",
            });
            stats.rendered += 1;
          }
        } catch (error) {
          stats.failed += 1;
          console.info("[AntinetTreeStructure][library-scan.skip]", {
            path: record.path,
            message: error?.message || error,
          });
        }

        if (stats.checked % LIBRARY_SCAN_PROGRESS_INTERVAL === 0) {
          console.info("[AntinetTreeStructure][library-scan.progress]", { ...stats });
        }
      }
    } finally {
      this.libraryScanRunning = false;
      this.libraryScanAbort = false;
      const elapsedMs = Date.now() - startedAt;
      console.info("[AntinetTreeStructure][library-scan.done]", { ...stats, elapsedMs });
      new Notice(
        `Antinet 树 SVG 安全扫描${stats.aborted ? "已停止" : "完成"}：渲染 ${stats.rendered}，命中 ${stats.cacheHit}，跳过大图 ${stats.skippedLarge}。`
      );
    }
  }

  schedulePrewarmForFile(file, reason = "unknown", options = {}) {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    if (!parseAtomFile(file, this.settings.filePrefix)) return;
    const key = file.path;
    if (this.prewarmTimers.has(key)) window.clearTimeout(this.prewarmTimers.get(key));
    const timer = window.setTimeout(() => {
      this.prewarmTimers.delete(key);
      this.prewarmForFile(file, reason).catch((error) => {
        console.warn("[AntinetTreeStructure][render-cache.prewarm.fail]", { reason, path: file.path, error });
      });
    }, PREWARM_DEBOUNCE_MS);
    this.prewarmTimers.set(key, timer);
    if (options.includeParent === true) {
      this.scheduleParentLayerPrewarmForFile(file, reason);
    }
  }

  scheduleParentLayerPrewarmForFile(file, reason = "unknown") {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    const key = `${file.path}::parent-layer`;
    if (this.prewarmTimers.has(key)) window.clearTimeout(this.prewarmTimers.get(key));
    const timer = window.setTimeout(async () => {
      this.prewarmTimers.delete(key);
      try {
        const parentFile = await this.findNearestAncestorAtomFile(file);
        if (!(parentFile instanceof TFile)) return;
        this.schedulePrewarmForFile(parentFile, `${reason}-parent-layer`, { includeParent: false });
      } catch (error) {
        console.warn("[AntinetTreeStructure][render-cache.prewarm-parent.fail]", {
          reason,
          path: file.path,
          error,
        });
      }
    }, PARENT_PREWARM_DEBOUNCE_MS);
    this.prewarmTimers.set(key, timer);
  }

  async prewarmForFile(file, reason = "unknown") {
    if (!this.initializeMermaid()) return;
    let graph = null;
    try {
      graph = this.applyFoldedState(await this.buildGraphForFile(file));
    } catch (error) {
      console.info("[AntinetTreeStructure][render-cache.prewarm.skip]", { reason, path: file.path, message: error?.message || error });
      return;
    }
    const mermaidCode = this.generateMermaidCode(graph);
    const key = this.buildRenderCacheKey(mermaidCode);
    const requiredNodeIds = graph.nodes.map((node) => node.nodeId);
    if (await this.getRenderCache(key, { requiredNodeIds })) {
      console.info("[AntinetTreeStructure][render-cache.prewarm.hit]", { reason, path: file.path, key });
      return;
    }
    console.info("[AntinetTreeStructure][render-cache.prewarm.start]", { reason, path: file.path, key });
    const svgOuterHTML = await this.renderMermaidSvg(mermaidCode, "prewarm");
    await this.putRenderCache(key, {
      svgOuterHTML,
      mermaidCodeHash: simpleHash(mermaidCode),
      nodeIds: requiredNodeIds,
      anchorNodeIds: graph.nodes.filter((node) => node.isAnchor).map((node) => node.nodeId),
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      codeChars: mermaidCode.length,
      source: "prewarm",
    });
    console.info("[AntinetTreeStructure][render-cache.prewarm.done]", { reason, path: file.path, key });
  }

  findOpenLeafForFile(file) {
    let found = null;
    this.app.workspace.iterateAllLeaves?.((leaf) => {
      if (found) return;
      const viewFile = leaf?.view?.file;
      if (viewFile instanceof TFile && viewFile.path === file.path) found = leaf;
    });
    return found;
  }

  async openNoteFile(file) {
    const existing = this.findOpenLeafForFile(file);
    if (existing) {
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      console.info("[AntinetTreeStructure][note-open]", { strategy: "activate-existing", path: file.path });
      return true;
    }

    let leaf = null;
    let strategy = "getLeaf:tab";
    try {
      leaf = this.app.workspace.getLeaf("tab") || this.app.workspace.getLeaf(true);
    } catch (error) {
      console.warn("[AntinetTreeStructure][leaf.get-tab-fail]", error);
      leaf = this.app.workspace.getLeaf(true);
      strategy = "getLeaf:true:fallback";
    }
    await leaf.openFile(file, { active: true });
    console.info("[AntinetTreeStructure][note-open]", { strategy, path: file.path });
    return true;
  }
}

module.exports = AntinetTreeStructurePlugin;
