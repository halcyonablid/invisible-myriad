const { Notice, Plugin, PluginSettingTab, Setting, TFile, MarkdownRenderer } = require('obsidian');

// Bundled core script to avoid local module resolution in Obsidian plugin runtime.
const runMermaidFloatingWidget = async function runMermaidFloatingWidget(app, tp = {}, pluginApi = {}) {
  if (!tp.obsidian) tp.obsidian = { Notice };
  const __pluginApi = pluginApi || {};
  const PREWARM_ONLY = __pluginApi.prewarmOnly === true;
  const PREWARM_TARGET_PREFIX = String(__pluginApi.prewarmTargetPrefix || '').trim();
  const PLUGIN_SETTINGS = __pluginApi.owner?.settings || __pluginApi.settings || {};

  const { Notice } = tp.obsidian || { Notice: require('obsidian').Notice };
  const WIDGET_ID = "mermaid-floating-widget";
  const RIBBON_BUTTON_ID = "mermaid-floating-widget-ribbon-btn";
  const RIBBON_BUTTON_TITLE = "切换 Mermaid 悬浮窗";
  const PLUGIN_MODE = window.__mermaidFloatingWidgetPluginMode === true;
  const FALLBACK_INITIAL_ZOOM = 2.0;
  const graphStateHost = PREWARM_ONLY ? {} : window;
  let graphStatePersistTimer = null;
  let graphStatePersistEpoch = 0;
  let graphStatePersistenceActive = !PREWARM_ONLY;

  const cancelPendingGraphStatePersist = () => {
    graphStatePersistEpoch += 1;
    if (graphStatePersistTimer) {
      window.clearTimeout(graphStatePersistTimer);
      graphStatePersistTimer = null;
    }
  };

  const writeGraphStateToStorage = (source = "deferred") => {
    if (PREWARM_ONLY || !graphStatePersistenceActive) return false;
    try {
      localStorage.setItem("mermaidGraphState", JSON.stringify(graphStateHost.mermaidGraphState || {}));
      return true;
    } catch (error) {
      console.warn("[MermaidFloatingWidget][state.save.fail]", { source, error });
      return false;
    }
  };

  const scheduleGraphStatePersist = (source = "interaction") => {
    if (PREWARM_ONLY || !graphStatePersistenceActive) return false;
    cancelPendingGraphStatePersist();
    const expectedEpoch = graphStatePersistEpoch;
    graphStatePersistTimer = window.setTimeout(() => {
      graphStatePersistTimer = null;
      if (!graphStatePersistenceActive || expectedEpoch !== graphStatePersistEpoch) return;
      writeGraphStateToStorage(source);
    }, 160);
    return true;
  };

  const deactivateGraphStatePersistence = () => {
    cancelPendingGraphStatePersist();
    graphStatePersistenceActive = false;
  };

  const getRibbonContainer = () =>
    document.querySelector(".workspace-ribbon.side-dock-ribbon.mod-left")
    || document.querySelector(".side-dock-ribbon.mod-left")
    || document.querySelector(".workspace-ribbon.mod-left");

  const setRibbonButtonActive = (active) => {
    const button = document.getElementById(RIBBON_BUTTON_ID);
    if (!button) return;
    button.classList.toggle("is-active", !!active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.style.color = active ? "var(--interactive-accent)" : "";
  };

  const saveCurrentMermaidGraphState = (source = "manual", root = document) => {
    if (PREWARM_ONLY) return null;
    cancelPendingGraphStatePersist();
    const state = graphStateHost.mermaidGraphState || {};
    const diagramContainer = root?.querySelector?.(".diagram-container") || document.querySelector(`#${WIDGET_ID} .diagram-container`);
    const outerContainer = diagramContainer?.closest?.(".mermaid-content") || null;
    const nextState = {
      zoom: Math.max(0.1, Number(state.zoom) || FALLBACK_INITIAL_ZOOM),
      scrollLeft: diagramContainer ? diagramContainer.scrollLeft || 0 : state.scrollLeft || 0,
      scrollTop: diagramContainer ? diagramContainer.scrollTop || 0 : state.scrollTop || 0,
      panX: Number(state.panX) || 0,
      panY: Number(state.panY) || 0,
      outerScrollLeft: outerContainer ? outerContainer.scrollLeft || 0 : state.outerScrollLeft || 0,
      outerScrollTop: outerContainer ? outerContainer.scrollTop || 0 : state.outerScrollTop || 0
    };
    graphStateHost.mermaidGraphState = { ...state, ...nextState };
    const stored = writeGraphStateToStorage(source);
    if (stored) {
      console.info("[MermaidFloatingWidget][state.save]", {
        source,
        zoom: graphStateHost.mermaidGraphState.zoom,
        scrollLeft: Math.round(graphStateHost.mermaidGraphState.scrollLeft || 0),
        scrollTop: Math.round(graphStateHost.mermaidGraphState.scrollTop || 0),
        outerScrollTop: Math.round(graphStateHost.mermaidGraphState.outerScrollTop || 0)
      });
    }
    return graphStateHost.mermaidGraphState;
  };
  if (!PREWARM_ONLY) window.__mermaidFloatingWidgetSaveState = saveCurrentMermaidGraphState;

  const ensureRibbonButton = () => {
    const ribbon = getRibbonContainer();
    if (!ribbon) return null;

    let button = document.getElementById(RIBBON_BUTTON_ID);
    if (!button) {
      button = document.createElement("button");
      button.id = RIBBON_BUTTON_ID;
      button.type = "button";
      button.className = "side-dock-ribbon-action mod-clickable";
      button.setAttribute("aria-label", RIBBON_BUTTON_TITLE);
      button.setAttribute("title", RIBBON_BUTTON_TITLE);
      button.innerHTML = "🧭";
      button.style.fontSize = "16px";
      button.style.lineHeight = "1";
      ribbon.appendChild(button);
    }

    button.onclick = async () => {
      if (typeof window.__toggleMermaidFloatingWidget === "function") {
        await window.__toggleMermaidFloatingWidget();
      } else {
        new Notice("请先执行一次 Mermaid 悬浮窗脚本以注册按钮逻辑。");
      }
    };
    return button;
  };

  if (!PLUGIN_MODE) {
    ensureRibbonButton();
  }

  const toggleMermaidFloatingWidget = async () => {
    const existing = document.getElementById(WIDGET_ID);
    if (existing && !PREWARM_ONLY) {
      saveCurrentMermaidGraphState("toggle-close", existing);
      if (existing.cleanup) existing.cleanup();
      existing.remove();
      setRibbonButtonActive(false);
      return;
    }

    const dv = app.plugins?.plugins?.dataview?.api;
    if (!dv) {
      new Notice("未检测到 Dataview 插件，无法生成 Mermaid 弹窗。");
      return;
    }

    if (graphStateHost.mermaidGraphDismissedFoldedPrefixes instanceof Set) {
      graphStateHost.mermaidGraphDismissedFoldedPrefixes.clear();
    }

    const widget = document.createElement("div");
    widget.id = PREWARM_ONLY ? `${WIDGET_ID}-prewarm` : WIDGET_ID;
    widget.style.cssText = `
    position: fixed;
    top: 8px;
    left: 8px;
    width: calc(100vw - 16px);
    height: calc(100vh - 16px);
    box-sizing: border-box;
    max-width: none;
    max-height: none;
    min-width: 0;
    min-height: 0;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    box-shadow: 0 10px 36px rgba(0,0,0,0.45);
    border-radius: 10px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: var(--font-text);
    animation: mermaidPopupFade 0.2s ease;
  `;

    const styleTag = document.createElement("style");
    styleTag.textContent = `
    @keyframes mermaidPopupFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    #${WIDGET_ID} .mermaid-header { padding: 8px 12px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border); cursor: move; display: flex; justify-content: space-between; align-items: center; user-select: none; flex-shrink: 0; }
    #${WIDGET_ID} .mermaid-close:hover { color: var(--text-error) !important; }
    #${WIDGET_ID} .mermaid-content { flex: 1; min-height: 0; overflow: auto; padding: 4px 6px 8px; }
    #${WIDGET_ID} .folded-node-hint { cursor: zoom-in; }
  `;
    widget.appendChild(styleTag);

    const header = document.createElement("div");
    header.className = "mermaid-header";
    const headerTitle = document.createElement("span");
    headerTitle.style.cssText = "font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
    headerTitle.textContent = "🧭 Mermaid 状态转移图";
    header.appendChild(headerTitle);
    const headerActions = document.createElement("div");
    headerActions.style.cssText = "display:flex; align-items:center; gap:6px; flex-shrink:0;";
    const closeBtn = document.createElement("div");
    closeBtn.className = "mermaid-close";
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = "cursor:pointer; padding:0 6px; color:var(--text-muted); font-size:14px;";
    headerActions.appendChild(closeBtn);
    header.appendChild(headerActions);
    widget.appendChild(header);

    const content = document.createElement("div");
    content.className = "mermaid-content";
    widget.appendChild(content);
    document.body.appendChild(widget);
    if (PREWARM_ONLY) {
      widget.style.left = "-100000px";
      widget.style.top = "-100000px";
      widget.style.width = "1200px";
      widget.style.height = "900px";
      widget.style.visibility = "hidden";
      widget.style.pointerEvents = "none";
    } else {
      setRibbonButtonActive(true);
    }

    const cleanupFns = [];
    let widgetClosed = false;
    const cleanup = () => {
    widgetClosed = true;
    deactivateGraphStatePersistence();
    cleanupFns.forEach(fn => {
      try { fn(); } catch (e) { console.error("cleanup error", e); }
    });
    };
    widget.cleanup = cleanup;
    const closeWidget = () => {
      saveCurrentMermaidGraphState("close-widget", widget);
      cleanup();
      if (widget.isConnected) widget.remove();
      if (!PREWARM_ONLY) setRibbonButtonActive(false);
    };
    closeBtn.onclick = closeWidget;

    const ensureElementHelpers = (el) => {
    if (!el.empty) {
      el.empty = () => { el.innerHTML = ""; };
    }
    if (!el.createEl) {
      el.createEl = (tag, opts = {}) => {
        const child = document.createElement(tag);
        if (opts.cls) child.className = opts.cls;
        if (opts.text !== undefined) child.textContent = opts.text;
        if (opts.attr) {
          Object.entries(opts.attr).forEach(([k, v]) => child.setAttribute(k, v));
        }
        Object.keys(opts).forEach(key => {
          if (key == "cls" || key == "text" || key == "attr") return;
          try { child[key] = opts[key]; } catch (e) { child.setAttribute(key, opts[key]); }
        });
        el.appendChild(child);
        ensureElementHelpers(child);
        return child;
      };
    }
    return el;
    };
    ensureElementHelpers(content);

  const setupDrag = () => {
    let isDragging = false;
    let dragX = 0;
    let dragY = 0;
    const onMouseMove = (e) => {
      if (!isDragging) return;
      widget.style.left = `${e.clientX - dragX}px`;
      widget.style.top = `${e.clientY - dragY}px`;
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    };
    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    header.onmousedown = (e) => {
      if (e.target === closeBtn) return;
      isDragging = true;
      const rect = widget.getBoundingClientRect();
      dragX = e.clientX - rect.left;
      dragY = e.clientY - rect.top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
    cleanupFns.push(() => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    });
  };

  setupDrag();

  const resolveTargetNodeFromFrontmatter = () => {
    if (PREWARM_TARGET_PREFIX) {
      return { nodeId: PREWARM_TARGET_PREFIX, fileName: PREWARM_TARGET_PREFIX, activeFile: null, activeNodeId: PREWARM_TARGET_PREFIX };
    }
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return { error: "未找到当前笔记" };
    const cache = app.metadataCache.getFileCache(activeFile);
    const activeNodeId = activeFile?.name ? activeFile.name.split("-")[0].trim() : "";
    const rawField = cache?.frontmatter?.["所属块"];
    const rawValue = Array.isArray(rawField) ? rawField[0] : rawField;
    if (!rawValue) return { error: "当前笔记缺少所属块字段" };
    const rawText = String(rawValue).trim();
    const linkMatch = rawText.match(/\[\[([^\]]+)\]\]/);
    const linkText = linkMatch ? linkMatch[1] : rawText;
    const linkPath = linkText.split("|")[0].trim();
    if (!linkPath) return { error: "所属块字段未包含有效链接" };
    const targetFile = app.metadataCache.getFirstLinkpathDest(linkPath, activeFile.path);
    const fileName = targetFile ? targetFile.name : linkPath;
    const nodeId = fileName.split("-")[0].trim();
    if (!nodeId) return { error: "无法从所属块链接提取节点编号" };
    return { nodeId, fileName, activeFile, activeNodeId };
  };

  const resolved = resolveTargetNodeFromFrontmatter();
  if (resolved?.nodeId) {
    headerTitle.textContent = `🧭 Mermaid 状态转移图 (${resolved.nodeId})`;
  } else if (resolved?.error) {
    new Notice(`所属块解析失败: ${resolved.error}`);
  }

const ACTIVE_NODE_ID = resolved?.activeNodeId || "";
const CONFIG = {
  targetNode: resolved?.nodeId || "", // 目标节点
  maxDepth: 19,               // 最大显示深度
  layout: "LR",               // 图表布局: TB(上到下), LR(左到右)
  debug: false,               // 调试模式
  addInvisibleNodes: true,    // 添加不可见节点控制层级
  showAllDescendants: true,   // 显示所有子孙节点
  showFullIds: true,          // 显示完整的节点ID
  enableZoom: true,           // 启用缩放功能
  initialZoom: 2.0,           // 初始缩放级别
  zoomStep: 0.5,              // 缩放步长
  subgraphReadableLabelShowZoom: 1.1,
  subgraphReadableLabelHideZoom: 1.25,
  subgraphReadableLabelShowFontPx: 9,
  subgraphReadableLabelHideFontPx: 11,
  subgraphReadableLabelMaxCount: 100,
  enableSubgraphReadableLabels: PLUGIN_SETTINGS.enableSubgraphReadableLabels !== false,
  enableFoldHoverPreview: true,
  foldPreviewHoverDelay: 140,
  foldPreviewCloseDelay: 220
};

// ===== 工具函数 =====
// 调试日志 - 改为空函数以提高性能
function debugLog(...args) {
  // 功能已移除以提高性能
}
// Scoped to one synchronous bulk pass; never retained across SVG replacement.
function buildRenderedNodeLookup(container) {
    const svgRoot = container?.querySelector?.('svg');
    const bySimpleId = new Map();
    if (svgRoot) for (const element of svgRoot.querySelectorAll('g.node')) {
        const id = element.getAttribute('id') || '';
        for (const token of id.split('-')) {
            if (!/^[BML]\d+$/.test(token) || bySimpleId.has(token)) continue;
            if (id === token || id.endsWith(`-${token}`) || id.includes(`-${token}-`)) bySimpleId.set(token, element);
        }
    }
    return { svgRoot, bySimpleId };
}

function measureMermaidInteraction(phase, action, metrics = {}) {
    const diagnostics = __pluginApi.owner?.performanceDiagnostics;
    const span = diagnostics?.begin('interaction');
    let outcome = 'ok';
    try { return action(); }
    catch (error) { outcome = 'error'; throw error; }
    finally {
        diagnostics?.phase(span, phase, metrics);
        diagnostics?.end(span, outcome);
    }
}

function findRenderedNodeElement(nodeObject, container, lookup = null) {
    if (!nodeObject || !container) return null;
    const simpleId = nodeObject.simpleId;
    const longId = nodeObject.id;
    const svgRoot = container.querySelector('svg');
    if (!svgRoot) {
        console.warn('[MermaidFloatingWidget][center.find-node.fail]', {
            reason: 'missing-svg',
            simpleId,
            longId
        });
        return null;
    }

    const escapedSimpleId = window.CSS && typeof window.CSS.escape === "function"
        ? window.CSS.escape(simpleId)
        : String(simpleId || "").replace(/["\\]/g, "\\$&");
    let matchedBy = '';
    let nodeElement = lookup?.svgRoot === svgRoot ? lookup.bySimpleId.get(simpleId) : null;
    if (!nodeElement) nodeElement = svgRoot.querySelector(`g.node[id="${escapedSimpleId}"], g.node[id$="-${escapedSimpleId}"], g.node[id*="-${escapedSimpleId}-"]`);
    if (nodeElement) matchedBy = 'exact-css-selector';
    if (!nodeElement) {
        const candidates = svgRoot.querySelectorAll('g.node');
        for (const candidate of candidates) {
            const candidateId = candidate.getAttribute("id") || "";
            if (candidateId === simpleId || candidateId.endsWith(`-${simpleId}`) || candidateId.includes(`-${simpleId}-`)) {
                nodeElement = candidate;
                matchedBy = 'exact-id-scan';
                break;
            }
        }
    }
    if (!nodeElement) {
        nodeElement = svgRoot.querySelector(`g.node[id*="${escapedSimpleId}"]`);
        if (nodeElement) matchedBy = 'legacy-id-contains';
    }
    if (!nodeElement) {
        const candidates = svgRoot.querySelectorAll('g.node');
        for (const candidate of candidates) {
            if ((candidate.textContent || "").includes(longId)) {
                nodeElement = candidate;
                matchedBy = 'text-long-id';
                break;
            }
        }
    }
    if (!nodeElement) {
        console.warn('[MermaidFloatingWidget][center.find-node.fail]', {
            reason: 'not-found',
            simpleId,
            longId,
            nodeCount: svgRoot.querySelectorAll('g.node').length,
            sampleIds: Array.from(svgRoot.querySelectorAll('g.node')).slice(0, 12).map(el => el.getAttribute('id'))
        });
    } else {
        console.info('[MermaidFloatingWidget][center.find-node.ok]', {
            simpleId,
            longId,
            matchedBy,
            elementId: nodeElement.getAttribute('id'),
            textPreview: (nodeElement.textContent || '').slice(0, 120)
        });
    }
    return nodeElement;
}

function findRenderedSubgraphClusters(nodeObject, container) {
    if (!nodeObject || !container) return [];
    const svgRoot = container.querySelector('svg');
    if (!svgRoot) return [];

    const expectedPrefix = getPureId(nodeObject.id);
    const clusters = svgRoot.querySelectorAll('g.cluster');
    const matches = [];
    for (const cluster of clusters) {
        const labelText = [
            cluster.getAttribute('id') || "",
            cluster.textContent || "",
            ...Array.from(cluster.querySelectorAll('text')).map(el => el.textContent || "")
        ].join(" ");
        if (labelText.includes(expectedPrefix)) {
            matches.push(cluster);
        }
    }
    return matches;
}

function normalizeSubgraphLabelText(text) {
    return String(text || "")
        .replace(/\s+/g, " ")
        .replace(/\s*·\s*已折叠\s*$/u, "")
        .trim();
}

function getClusterOwnLabelText(cluster) {
    if (!cluster) return "";
    const directLabel = Array.from(cluster.children || []).find(child => {
        const cls = child.getAttribute?.("class") || "";
        return /\bcluster-label\b/.test(cls);
    });
    const labelElement = directLabel || cluster.querySelector(":scope > .cluster-label");
    if (labelElement) return normalizeSubgraphLabelText(labelElement.textContent || "");

    const directText = Array.from(cluster.children || []).find(child => child.tagName?.toLowerCase() === "text");
    if (directText) return normalizeSubgraphLabelText(directText.textContent || "");
    return "";
}

function getClusterOwnLabelElement(cluster) {
    if (!cluster) return null;
    const directLabel = Array.from(cluster.children || []).find(child => {
        const cls = child.getAttribute?.("class") || "";
        return /\bcluster-label\b/.test(cls);
    });
    return directLabel || cluster.querySelector(":scope > .cluster-label");
}

function findRenderedNodeBySimpleId(svgRoot, simpleId) {
    if (!svgRoot || !simpleId) return null;
    const escaped = window.CSS && typeof window.CSS.escape === "function"
        ? window.CSS.escape(simpleId)
        : String(simpleId || "").replace(/["\\]/g, "\\$&");
    return svgRoot.querySelector(`g.node[id="${escaped}"], g.node[id$="-${escaped}"], g.node[id*="-${escaped}-"]`);
}

function createSubgraphClusterMap(container, subgraphs = [], nodes = []) {
    const svgRoot = container?.querySelector?.("svg");
    if (!svgRoot || !Array.isArray(subgraphs)) return new Map();
    const clusters = Array.from(svgRoot.querySelectorAll("g.cluster"));
    const nodeById = new Map((Array.isArray(nodes) ? nodes : []).map(node => [node.id, node]));
    const clustersByLabel = new Map();
    for (const cluster of clusters) {
        const label = getClusterOwnLabelText(cluster);
        if (!label) continue;
        if (!clustersByLabel.has(label)) clustersByLabel.set(label, []);
        clustersByLabel.get(label).push(cluster);
    }

    const clusterRects = clusters.map(cluster => {
        const rect = cluster.getBoundingClientRect();
        return { cluster, rect, area: Math.max(0, rect.width) * Math.max(0, rect.height) };
    });
    const usedClusters = new Set();
    const result = new Map();
    for (const sg of subgraphs) {
        const node = nodeById.get(sg?.baseNode);
        const nodeElement = findRenderedNodeBySimpleId(svgRoot, node?.simpleId);
        if (!nodeElement) continue;
        const nodeRect = nodeElement.getBoundingClientRect();
        const nodeCenter = {
            x: nodeRect.left + nodeRect.width / 2,
            y: nodeRect.top + nodeRect.height / 2
        };
        const containingClusters = clusterRects
            .filter(item => !usedClusters.has(item.cluster))
            .filter(item => {
                return nodeCenter.x >= item.rect.left
                    && nodeCenter.x <= item.rect.right
                    && nodeCenter.y >= item.rect.top
                    && nodeCenter.y <= item.rect.bottom;
            })
            .sort((a, b) => a.area - b.area);
        const match = containingClusters[0]?.cluster || null;
        if (match) {
            usedClusters.add(match);
            result.set(sg.id, match);
        }
    }

    for (const sg of subgraphs) {
        if (result.has(sg.id)) continue;
        const label = normalizeSubgraphLabelText(sg?.label || "");
        const candidates = clustersByLabel.get(label) || [];
        if (candidates.length > 1) {
            console.info("[MermaidFloatingWidget][subgraph-label-overlay.duplicate-label]", {
                label,
                candidateCount: candidates.length,
                subgraphId: sg?.id || "",
                baseNode: sg?.baseNode || ""
            });
        }
        const cluster = candidates.find(candidate => !usedClusters.has(candidate));
        if (cluster) {
            usedClusters.add(cluster);
            result.set(sg.id, cluster);
        }
    }

    const declarationOrder = getRenderedSubgraphDeclarationOrder(subgraphs);
    for (const cluster of clusters) {
        if (usedClusters.has(cluster)) continue;
        const clusterId = cluster.getAttribute("id") || "";
        const match = clusterId.match(/^subGraph(\d+)$/);
        if (!match) continue;
        const index = Number(match[1]);
        const sg = declarationOrder[index];
        if (!sg || result.has(sg.id)) continue;
        usedClusters.add(cluster);
        result.set(sg.id, cluster);
    }
    return result;
}

function getRenderedSubgraphDeclarationOrder(subgraphs = []) {
    if (!Array.isArray(subgraphs) || !subgraphs.length) return [];
    const childrenByParent = new Map([[null, []]]);
    for (const sg of subgraphs) {
        const parentId = sg?.parent || null;
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(sg);
    }

    const order = [];
    const visit = (sg) => {
        if (!sg) return;
        order.push(sg);
        for (const child of childrenByParent.get(sg.id) || []) visit(child);
    };
    for (const root of childrenByParent.get(null) || []) visit(root);
    return order;
}

function getSubgraphReadableLabelText(sg, nodeMap) {
    const baseNode = nodeMap.get(sg?.baseNode);
    const name = String(baseNode?.name || "").trim();
    if (name) return name;
    return normalizeSubgraphLabelText(sg?.label || "").replace(/\s*状态\s*$/u, "");
}

function getSubgraphDepthFactory(subgraphs = []) {
    const parentById = new Map((Array.isArray(subgraphs) ? subgraphs : []).map(sg => [sg.id, sg.parent || null]));
    const depthById = new Map();
    const getSubgraphDepth = (sg) => {
        if (!sg?.id) return 0;
        if (depthById.has(sg.id)) return depthById.get(sg.id);
        let depth = 0;
        let currentParentId = parentById.get(sg.id);
        const seen = new Set([sg.id]);
        while (currentParentId && !seen.has(currentParentId)) {
            seen.add(currentParentId);
            depth += 1;
            currentParentId = parentById.get(currentParentId);
        }
        depthById.set(sg.id, depth);
        return depth;
    };
    getSubgraphDepth.parentById = parentById;
    return getSubgraphDepth;
}

function ensureSubgraphReadableLabelLayer(container) {
    if (!container || PREWARM_ONLY) return null;
    let layer = container.querySelector(":scope > .mermaid-subgraph-readable-label-layer");
    if (!layer) {
        layer = document.createElement("div");
        layer.className = "mermaid-subgraph-readable-label-layer";
        layer.style.cssText = [
            "position:absolute",
            "left:0",
            "top:0",
            "width:0",
            "height:0",
            "pointer-events:none",
            "z-index:6"
        ].join(";");
        container.appendChild(layer);
    }
    return layer;
}

function getCurrentMermaidZoom() {
    const zoom = Number(graphStateHost.mermaidGraphState?.zoom);
    return Number.isFinite(zoom) && zoom > 0 ? zoom : CONFIG.initialZoom;
}

function getMermaidNodeBaseFontPx(container) {
    const svgRoot = container?.querySelector?.("svg");
    if (!svgRoot) return 16;
    const candidates = [
        svgRoot.querySelector("g.node .nodeLabel"),
        svgRoot.querySelector("g.node foreignObject div"),
        svgRoot.querySelector("g.node"),
        svgRoot
    ].filter(Boolean);
    for (const candidate of candidates) {
        const fontSize = parseFloat(window.getComputedStyle(candidate).fontSize || "");
        if (Number.isFinite(fontSize) && fontSize > 0) return fontSize;
    }
    return 16;
}

function getSvgAnchorMetrics(container) {
    const svgRoot = container?.querySelector?.("svg");
    if (!svgRoot) return null;
    const rect = svgRoot.getBoundingClientRect();
    const viewBox = svgRoot.viewBox?.baseVal;
    const baseWidth = Number(svgRoot.dataset?.mermaidBaseWidth || svgRoot.getAttribute("width") || viewBox?.width || 0) || Number(rect.width || 0);
    const baseHeight = Number(svgRoot.dataset?.mermaidBaseHeight || svgRoot.getAttribute("height") || viewBox?.height || 0) || Number(rect.height || 0);
    if (!(baseWidth > 0 && baseHeight > 0 && rect.width > 0 && rect.height > 0)) return null;
    return {
        svgRoot,
        rect,
        baseWidth,
        baseHeight,
        scaleX: rect.width / baseWidth,
        scaleY: rect.height / baseHeight,
        viewBox: viewBox ? {
            x: Number(viewBox.x || 0),
            y: Number(viewBox.y || 0),
            width: Number(viewBox.width || 0),
            height: Number(viewBox.height || 0)
        } : null
    };
}

function collectSubgraphReadableLabelAnchors(container, graph, source = "collect") {
    const empty = { version: SUBGRAPH_READABLE_LABEL_ANCHOR_VERSION, source, anchors: [] };
    if (!container || CONFIG.enableSubgraphReadableLabels === false) return empty;
    const subgraphs = Array.isArray(graph?.subgraphs) ? graph.subgraphs : [];
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const metrics = getSvgAnchorMetrics(container);
    if (!metrics || !subgraphs.length) return empty;
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const clusterMap = createSubgraphClusterMap(container, subgraphs, nodes);
    const lookup = buildRenderedNodeLookup(container);
    const getDepth = getSubgraphDepthFactory(subgraphs);
    const anchors = [];
    for (const sg of subgraphs) {
        const simpleId = nodeMap.get(sg.baseNode)?.simpleId;
        // Geometry must not use legacy substring/text fallback (M1 must not match M10).
        const head = simpleId ? lookup.bySimpleId.get(simpleId)
            || findRenderedNodeBySimpleId(metrics.svgRoot, simpleId) : null;
        const headRect = head?.getBoundingClientRect();
        const hasHead = !!headRect && headRect.width > 0 && headRect.height > 0;
        const cluster = clusterMap.get(sg.id);
        const clusterRect = cluster?.getBoundingClientRect();
        if (!hasHead && !clusterRect) continue;
        const rect = clusterRect || headRect;
        const labelElement = !hasHead && cluster ? getClusterOwnLabelElement(cluster) : null;
        const labelRect = labelElement?.getBoundingClientRect();
        const anchorRect = hasHead ? headRect : labelRect?.width > 0 ? labelRect : rect;
        const x = (anchorRect.left + anchorRect.width / 2 - metrics.rect.left) / metrics.scaleX;
        const y = ((hasHead ? anchorRect.top : anchorRect.top + anchorRect.height / 2) - metrics.rect.top) / metrics.scaleY;
        const width = Math.max(0, rect.width / metrics.scaleX);
        const height = Math.max(0, rect.height / metrics.scaleY);
        if (![x, y, width, height].every(Number.isFinite)) continue;
        anchors.push({ subgraphId: sg.id, baseNode: sg.baseNode || "",
            labelText: getSubgraphReadableLabelText(sg, nodeMap),
            mode: hasHead ? 'leader-top' : 'cluster-fallback',
            depth: getDepth(sg), isTopLevel: !getDepth.parentById.get(sg.id),
            x: Number(x.toFixed(2)), y: Number(y.toFixed(2)),
            width: Number(width.toFixed(2)), height: Number(height.toFixed(2)),
            area: Number((width * height).toFixed(2)) });
    }
    anchors.sort((a, b) => a.depth !== b.depth ? a.depth - b.depth : b.area - a.area);
    return { ...empty, anchorCoordinate: 'svg-base-px', viewBox: metrics.viewBox,
        baseWidth: metrics.baseWidth, baseHeight: metrics.baseHeight, anchors };
}

function getValidSubgraphReadableLabelAnchors(value) {
    if (!value || typeof value !== 'object' || value.version !== SUBGRAPH_READABLE_LABEL_ANCHOR_VERSION
        || !Array.isArray(value.anchors)) return null;
    if (!value.anchors.every(anchor => anchor && ['leader-top', 'cluster-fallback'].includes(anchor.mode)
        && typeof anchor.subgraphId === 'string'
        && ['x', 'y', 'width', 'height', 'area', 'depth'].every(key => typeof anchor[key] === 'number' && Number.isFinite(anchor[key]))
        && anchor.width >= 0 && anchor.height >= 0 && anchor.area >= 0 && anchor.depth >= 0)) return null;
    return value;
}

function shouldShowSubgraphReadableLabels(container, zoom, baseFontPx = getMermaidNodeBaseFontPx(container)) {
    if (CONFIG.enableSubgraphReadableLabels === false) return false;
    const state = container?.__mermaidSubgraphReadableLabelOverlay;
    const visible = !!state?.visible;
    const effectiveFontPx = baseFontPx * zoom;
    const showFontPx = Number(CONFIG.subgraphReadableLabelShowFontPx) || 14;
    const hideFontPx = Number(CONFIG.subgraphReadableLabelHideFontPx) || 16;
    return visible ? effectiveFontPx < hideFontPx : effectiveFontPx < showFontPx;
}

function renderSubgraphReadableLabelOverlay(container, source = "render") {
    if (!container || PREWARM_ONLY || widgetClosed) return;
    const diagnostics = __pluginApi.owner?.performanceDiagnostics;
    const span = diagnostics?.begin('label-overlay');
    const counts = { labelsCreated: 0, labelsReused: 0, labelsRemoved: 0, labelCount: 0,
        placementMs: 0, domApplyMs: 0, labelLogMs: 0, labelLogWrites: 0 };
    let outcome = 'ok';
    try {
        if (CONFIG.enableSubgraphReadableLabels === false) {
            const layer = ensureSubgraphReadableLabelLayer(container);
            if (layer) { layer.style.display = 'none'; layer.replaceChildren(); }
            container.__mermaidSubgraphReadableLabelOverlay?.labelNodes?.clear();
            return;
        }
        const state = container.__mermaidSubgraphReadableLabelOverlay;
        const layer = ensureSubgraphReadableLabelLayer(container);
        if (!state || !layer || state.disposed) return;
        const zoom = getCurrentMermaidZoom();
        const baseFontPx = getMermaidNodeBaseFontPx(container);
        state.visible = shouldShowSubgraphReadableLabels(container, zoom, baseFontPx);
        if (!state.visible) {
            if (layer.style.display !== 'none') layer.style.display = 'none';
            return;
        }
        const svg = container.querySelector('svg');
        if (state.anchorSvgRoot && state.anchorSvgRoot !== svg) {
            state.anchorsState = null; state.prepared = null;
        }
        state.anchorSvgRoot = svg;
        state.anchorsState = getValidSubgraphReadableLabelAnchors(state.anchorsState);
        let anchors = state.anchorsState?.anchors || [];
        if (!anchors.length) {
            state.anchorsState = collectSubgraphReadableLabelAnchors(container, { subgraphs: state.subgraphs, nodes: state.nodes }, source);
            anchors = state.anchorsState.anchors;
        }
        const metrics = getSvgAnchorMetrics(container);
        if (!metrics || !anchors.length) {
            layer.style.display = 'none'; layer.replaceChildren(); state.labelNodes?.clear(); return;
        }
        const subgraphs = Array.isArray(state.subgraphs) ? state.subgraphs : [];
        if (!state.prepared || state.prepared.anchors !== anchors || state.prepared.svgRoot !== metrics.svgRoot
            || state.prepared.subgraphs !== state.subgraphs || state.prepared.nodes !== state.nodes) {
            const subgraphById = new Map();
            for (const sg of subgraphs) if (!subgraphById.has(sg.id)) subgraphById.set(sg.id, sg);
            const nodeMap = new Map((state.nodes || []).map(node => [node.id, node]));
            const entries = [];
            anchors.forEach((anchor, index) => {
                const sg = subgraphById.get(anchor.subgraphId);
                if (!sg) return;
                const labelText = getSubgraphReadableLabelText(sg, nodeMap);
                entries.push({ sg, anchor, index, labelText, labelChars: Array.from(labelText || '').length,
                    isTopLevel: !!anchor.isTopLevel, depth: anchor.depth, area: anchor.area });
            });
            entries.sort((a, b) => a.depth !== b.depth ? a.depth - b.depth : b.area - a.area);
            state.prepared = { anchors, svgRoot: metrics.svgRoot, subgraphs: state.subgraphs, nodes: state.nodes, entries };
        }
        // Complete geometry reads before touching any existing label styles.
        // scrollLeft/Top can flush layout: reading them inside the write loop is expensive.
        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft || 0, scrollTop = container.scrollTop || 0;
        const originX = metrics.rect.left - rect.left + scrollLeft;
        const originY = metrics.rect.top - rect.top + scrollTop;
        const entries = state.prepared.entries.filter(entry => !(zoom < 0.45 && !entry.isTopLevel
            && (entry.anchor.width * metrics.scaleX < 180 || entry.anchor.height * metrics.scaleY < 100)));
        diagnostics?.phase(span, 'label.layout', { anchorCount: anchors.length, subgraphCount: subgraphs.length,
            zoom, queuedRequests: state.lastBatchRequests || 1 });
        let at = span ? performance.now() : 0;
        const maxCount = Math.max(1, Number(CONFIG.subgraphReadableLabelMaxCount) || 36);
        const accepted = [], placements = [];
        const fontSize = zoom < 0.35 ? 18 : zoom < 0.55 ? 16 : 14;
        for (const entry of entries) {
            if (placements.length >= maxCount) break;
            const left = originX + entry.anchor.x * metrics.scaleX;
            const anchorTop = originY + entry.anchor.y * metrics.scaleY;
            const width = Math.min(1100, Math.max(360, Math.ceil(entry.labelChars * fontSize * 1.08 / 2) + 72));
            // Conservative multiline bound; actual CSS bottom alignment independently keeps
            // the entire rendered label above its head, including very long titles.
            const lines = Math.max(1, Math.ceil(entry.labelChars * fontSize * 1.2 / Math.max(1, width - 18)));
            const height = Math.max(fontSize * 2.7, lines * fontSize * 1.25 + 10);
            const step = Math.max(26, Math.ceil(fontSize * 1.75));
            const leader = entry.anchor.mode === 'leader-top';
            const depthOffset = Math.min(96, entry.depth * Math.max(12, Math.ceil(fontSize * 0.85)));
            for (let attempt = 0; attempt <= 14; attempt++) {
                const top = leader ? anchorTop - 8 - attempt * step : anchorTop + depthOffset + attempt * step;
                const box = { left: left - width / 2, right: left + width / 2,
                    top: leader ? top - height : top - height / 2, bottom: leader ? top : top + height / 2 };
                if (accepted.some(old => !(box.right < old.left || box.left > old.right || box.bottom < old.top || box.top > old.bottom))) continue;
                accepted.push(box); placements.push({ entry, left, top, width, leader }); break;
            }
        }
        if (span) { const next = performance.now(); counts.placementMs = next - at; at = next; }
        // DOM commit pass: no layout/scroll geometry reads below this point.
        const previous = state.labelNodes || new Map(), nextLabels = new Map(), labels = [];
        for (const placement of placements) {
            const { entry, left, top, width, leader } = placement;
            const reused = previous.has(entry.index);
            const label = previous.get(entry.index) || document.createElement('div');
            if (reused) counts.labelsReused++; else counts.labelsCreated++;
            nextLabels.set(entry.index, label);
            if (!reused) label.className = 'mermaid-subgraph-readable-label';
            if (label.textContent !== entry.labelText) label.textContent = entry.labelText;
            const title = `${entry.sg.baseNode || ''}${entry.labelText ? `\n${entry.labelText}` : ''}`.trim();
            if (label.title !== title) label.title = title;
            if (!reused) label.style.cssText = [
                'position:absolute', 'box-sizing:border-box', 'line-height:1.25', 'font-weight:700',
                'white-space:normal', 'word-break:normal', 'overflow-wrap:break-word', 'text-align:center',
                'display:block', 'overflow:visible', 'padding:4px 8px', 'border:1px solid rgba(13, 71, 161, 0.35)',
                'border-radius:10px', 'background:rgba(255, 255, 255, 0.88)', 'color:#0d47a1',
                'box-shadow:0 2px 8px rgba(0,0,0,0.14)', 'backdrop-filter:blur(2px)'
            ].join(';');
            for (const [key, value] of Object.entries({ left: `${Math.round(left)}px`, top: `${Math.round(top)}px`,
                width: `${width}px`, fontSize: `${fontSize}px`, transform: leader ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)' })) {
                if (label.style[key] !== value) label.style[key] = value;
            }
            labels.push(label);
        }
        counts.labelsRemoved = Array.from(previous.keys()).filter(key => !nextLabels.has(key)).length;
        counts.labelCount = labels.length;
        if (!(layer.children.length === labels.length && labels.every((label, i) => layer.children[i] === label))) layer.replaceChildren(...labels);
        state.labelNodes = nextLabels;
        const display = labels.length ? 'block' : 'none';
        if (layer.style.display !== display) layer.style.display = display;
        state.anchorsState = { ...state.anchorsState, lastRenderedAt: new Date().toISOString(), visibleCount: labels.length };
        if (span) { const next = performance.now(); counts.domApplyMs = next - at; at = next; }
        const logNow = performance.now();
        if (state.lastLabelSummaryAt == null || logNow - state.lastLabelSummaryAt >= 1000) {
            state.lastLabelSummaryAt = logNow;
            console.info('[MermaidFloatingWidget][subgraph-label-overlay]', { source, zoom: Number(zoom.toFixed(3)),
                baseFontPx: Number(baseFontPx.toFixed(2)), effectiveFontPx: Number((baseFontPx * zoom).toFixed(2)),
                subgraphCount: subgraphs.length, anchorCount: anchors.length, labelCount: labels.length });
            counts.labelLogWrites = 1;
        }
        if (span) counts.labelLogMs = performance.now() - at;
    } catch (error) { outcome = 'error'; throw error; }
    finally { diagnostics?.phase(span, 'label.dom', counts); diagnostics?.end(span, outcome); }
}

function disposeSubgraphReadableLabelOverlay(container) {
    const state = container?.__mermaidSubgraphReadableLabelOverlay;
    if (state) {
        state.disposed = true;
        if (state.rafId) cancelAnimationFrame(state.rafId);
        state.resizeObserver?.disconnect();
        if (state.onWindowResize) window.removeEventListener('resize', state.onWindowResize);
        state.labelNodes?.clear();
        state.prepared = null;
        state.anchorsState = null;
        state.subgraphs = [];
        state.nodes = [];
        state.rafId = 0;
    }
    if (container) {
        container.__mermaidSubgraphReadableLabelOverlay = null;
        container.querySelector(':scope > .mermaid-subgraph-readable-label-layer')?.remove();
    }
}

function scheduleSubgraphReadableLabelOverlayRefresh(container, source = 'schedule') {
    if (!container || PREWARM_ONLY || widgetClosed || CONFIG.enableSubgraphReadableLabels === false) return;
    const state = container.__mermaidSubgraphReadableLabelOverlay;
    if (!state || state.disposed) return;
    state.pendingSource = source;
    state.pendingRequests = (state.pendingRequests || 0) + 1;
    if (state.rafId) return;
    state.rafId = requestAnimationFrame(() => {
        state.rafId = 0;
        if (widgetClosed || state.disposed || container.__mermaidSubgraphReadableLabelOverlay !== state
            || state.generation !== container.__mermaidLabelGeneration || !container.isConnected) return;
        state.lastBatchRequests = state.pendingRequests;
        state.pendingRequests = 0;
        renderSubgraphReadableLabelOverlay(container, state.pendingSource);
    });
}

function installSubgraphReadableLabelOverlay(container, graph, source = 'install', generation = container?.__mermaidLabelGeneration || 0) {
    if (!container || PREWARM_ONLY || widgetClosed || !container.isConnected
        || CONFIG.enableSubgraphReadableLabels === false
        || generation !== (container.__mermaidLabelGeneration || 0)) return;
    disposeSubgraphReadableLabelOverlay(container);
    container.__mermaidLabelGeneration = generation;
    let state;
    const refresh = (reason) => {
        if (!widgetClosed && !state.disposed && container.__mermaidSubgraphReadableLabelOverlay === state
            && generation === container.__mermaidLabelGeneration) scheduleSubgraphReadableLabelOverlayRefresh(container, reason);
    };
    const onWindowResize = () => refresh('window-resize');
    const resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => refresh('container-resize')) : null;
    state = {
        subgraphs: Array.isArray(graph?.subgraphs) ? graph.subgraphs : [],
        nodes: Array.isArray(graph?.nodes) ? graph.nodes : [],
        anchorsState: getValidSubgraphReadableLabelAnchors(graph?.subgraphReadableLabelAnchors),
        visible: false, rafId: 0, generation, disposed: false,
        resizeObserver, onWindowResize, labelNodes: new Map(), prepared: null,
        pendingRequests: 0, lastBatchRequests: 1
    };
    container.__mermaidSubgraphReadableLabelOverlay = state;
    if (resizeObserver) resizeObserver.observe(container);
    window.addEventListener('resize', onWindowResize);
    ensureSubgraphReadableLabelLayer(container);
    scheduleSubgraphReadableLabelOverlayRefresh(container, source);
}

function collectExpandedAreaRects(expandedPrefix, graphNodes, container) {
    if (!expandedPrefix || !container) return [];

    const matchingNodes = (graphNodes || []).filter(node => {
        const pureId = getPureId(node.id);
        return pureId === expandedPrefix || pureId.startsWith(expandedPrefix + ".") || pureId.startsWith(expandedPrefix + "+");
    });

    const rawTargets = [
        ...matchingNodes.map(node => findRenderedNodeElement(node, container)),
        ...matchingNodes.flatMap(node => findRenderedSubgraphClusters(node, container))
    ].filter(Boolean);

    const uniqueTargets = Array.from(new Set(rawTargets));
    const rects = uniqueTargets
        .map(target => target.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);

    if (rects.length === 0) return [];

    const paddingX = 36;
    const paddingY = 28;
    const unionRect = rects.reduce((acc, rect) => {
        return {
            left: Math.min(acc.left, rect.left),
            top: Math.min(acc.top, rect.top),
            right: Math.max(acc.right, rect.right),
            bottom: Math.max(acc.bottom, rect.bottom)
        };
    }, {
        left: rects[0].left,
        top: rects[0].top,
        right: rects[0].right,
        bottom: rects[0].bottom
    });

    return [{
        left: unionRect.left - paddingX,
        top: unionRect.top - paddingY,
        right: unionRect.right + paddingX,
        bottom: unionRect.bottom + paddingY
    }];
}

// 折叠 subgraph 的交互策略:
// 1. 默认渲染时隐藏被标记为“图折叠”的后代节点，只保留根节点
// 2. 悬停根节点时，重新渲染主图并临时移除该前缀的折叠状态，实现“原位展开”
// 3. 收起判定不依赖单个节点命中，而是使用展开区域内所有节点/cluster 的联合外接矩形
//    并附加缓冲边距，避免鼠标离开某个节点边缘就立即收起
function setupFoldedNodeHoverPreview(diagramContainer, graphNodes, foldedPrefixes, activeExpandedPrefix, rerenderGraph) {
    if (!CONFIG.enableFoldHoverPreview || !diagramContainer || typeof rerenderGraph !== "function") return null;

    const listeners = [];
    let openTimer = null;
    let closeTimer = null;

    function clearTimers() {
        if (openTimer) {
            clearTimeout(openTimer);
            openTimer = null;
        }
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
    }

    function scheduleExpand(prefix) {
        if (!prefix || prefix === activeExpandedPrefix) return;
        clearTimers();
        openTimer = setTimeout(() => {
            rerenderGraph(prefix);
        }, CONFIG.foldPreviewHoverDelay);
    }

    function scheduleCollapse() {
        if (!activeExpandedPrefix) return;
        clearTimers();
        closeTimer = setTimeout(() => {
            rerenderGraph(null);
        }, CONFIG.foldPreviewCloseDelay);
    }

    const foldedRoots = (graphNodes || []).filter(node => foldedPrefixes.includes(getPureId(node.id)));
    foldedRoots.forEach(nodeObject => {
        const nodeElement = findRenderedNodeElement(nodeObject, diagramContainer);
        if (!nodeElement) return;
        nodeElement.classList.add("folded-node-hint");

        const handleEnter = () => scheduleExpand(getPureId(nodeObject.id));
        nodeElement.addEventListener("mouseenter", handleEnter);
        listeners.push(() => nodeElement.removeEventListener("mouseenter", handleEnter));
    });

    if (activeExpandedPrefix) {
        const isPointInsideExpandedArea = (clientX, clientY) => {
            const activeRects = collectExpandedAreaRects(activeExpandedPrefix, graphNodes, diagramContainer);
            return activeRects.some(rect => {
                return (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                );
            });
        };

        const handleDiagramMouseMove = (event) => {
            if (isPointInsideExpandedArea(event.clientX, event.clientY)) {
                clearTimers();
            } else {
                scheduleCollapse();
            }
        };

        const handleDiagramMouseLeave = () => {
            scheduleCollapse();
        };

        const handleDocumentMouseMove = (event) => {
            if (!isPointInsideExpandedArea(event.clientX, event.clientY)) {
                scheduleCollapse();
            }
        };

        diagramContainer.addEventListener("mousemove", handleDiagramMouseMove);
        diagramContainer.addEventListener("mouseleave", handleDiagramMouseLeave);
        document.addEventListener("mousemove", handleDocumentMouseMove);

        listeners.push(() => {
            diagramContainer.removeEventListener("mousemove", handleDiagramMouseMove);
            diagramContainer.removeEventListener("mouseleave", handleDiagramMouseLeave);
            document.removeEventListener("mousemove", handleDocumentMouseMove);
        });
    }

    return () => {
        clearTimers();
        listeners.forEach(dispose => dispose());
    };
}

function getFoldDismissedPrefixes() {
    if (!(graphStateHost.mermaidGraphDismissedFoldedPrefixes instanceof Set)) {
        graphStateHost.mermaidGraphDismissedFoldedPrefixes = new Set();
    }
    return graphStateHost.mermaidGraphDismissedFoldedPrefixes;
}

function pruneFoldDismissedPrefixes(validFoldedPrefixes) {
    const validSet = new Set(validFoldedPrefixes || []);
    const dismissed = getFoldDismissedPrefixes();
    Array.from(dismissed).forEach(prefix => {
        if (!validSet.has(prefix)) dismissed.delete(prefix);
    });
}

function renderFoldedSubgraphCapsules(container, diagramContainer, foldedNodes, onDismissFold) {
    if (!container || !diagramContainer) return;

    let capsuleBar = container.querySelector('.folded-subgraph-capsule-bar');
    if (!capsuleBar) {
        capsuleBar = document.createElement('div');
        capsuleBar.className = 'folded-subgraph-capsule-bar';
        diagramContainer.parentNode.insertBefore(capsuleBar, diagramContainer);
    }

    capsuleBar.innerHTML = '';
    capsuleBar.style.display = foldedNodes && foldedNodes.length ? 'flex' : 'none';
    capsuleBar.style.flexWrap = 'wrap';
    capsuleBar.style.alignItems = 'center';
    capsuleBar.style.gap = '6px';
    capsuleBar.style.margin = '0 0 8px 0';
    capsuleBar.style.padding = '6px 8px';
    capsuleBar.style.border = '1px solid #f59f00';
    capsuleBar.style.borderRadius = '10px';
    capsuleBar.style.background = '#fff9db';

    if (!foldedNodes || foldedNodes.length === 0) return;

    const title = document.createElement('span');
    title.textContent = '已折叠子图：';
    title.style.fontSize = '12px';
    title.style.color = '#8a5a00';
    title.style.fontWeight = '600';
    capsuleBar.appendChild(title);

    foldedNodes.forEach(node => {
        const prefix = getPureId(node.id);
        const capsule = document.createElement('button');
        capsule.type = 'button';
        capsule.title = '点击 × 解开这个折叠子图（不修改 YAML）';
        capsule.style.display = 'inline-flex';
        capsule.style.alignItems = 'center';
        capsule.style.gap = '6px';
        capsule.style.border = '1px solid #f08c00';
        capsule.style.borderRadius = '999px';
        capsule.style.background = '#ffd43b';
        capsule.style.color = '#5c3d00';
        capsule.style.padding = '3px 8px';
        capsule.style.fontSize = '12px';
        capsule.style.lineHeight = '1.4';
        capsule.style.cursor = 'default';

        const text = document.createElement('span');
        text.textContent = node.name ? `${prefix} · ${node.name}` : prefix;
        text.style.flex = '1 1 auto';
        text.style.maxWidth = 'none';
        text.style.overflow = 'visible';
        text.style.whiteSpace = 'normal';
        text.style.wordBreak = 'break-word';
        capsule.appendChild(text);

        const close = document.createElement('span');
        close.textContent = '×';
        close.style.fontWeight = '700';
        close.style.fontSize = '14px';
        close.style.cursor = 'pointer';
        close.style.padding = '0 2px';
        close.setAttribute('aria-label', '解开折叠');
        close.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (typeof onDismissFold === 'function') onDismissFold(prefix);
        });
        capsule.appendChild(close);

        capsuleBar.appendChild(capsule);
    });
}

/**
 * 精确判断一个节点是否为“头领节点”.
 * 头领节点的ID必须以“+XXX”段结尾.
 * @param {string} id - 节点ID.
 * @returns {boolean}
 */
function isLeaderNode(id) {
  if (!id || !id.includes('+')) {
    return false;
  }
  const pureId = id.split('-')[0];
  const lastPlusIndex = pureId.lastIndexOf('+');
  const lastDotIndex = pureId.lastIndexOf('.');
  // 关键：最后一个'+'必须出现在最后一个'.'之后
  return lastDotIndex < lastPlusIndex;
}


// 子图生成调试日志 - 改为空函数以提高性能
function subgraphDebugLog(message) {
  // 功能已移除以提高性能
}
function getPureId(id) {
  const dashIndex = id.indexOf("-");
  return dashIndex > 0 ? id.substring(0, dashIndex) : id;
}

function buildHeadChildrenMap(heads, nodeById) {
  const map = new Map();
  // 每个头领初始化 children 数组
  heads.forEach(h => map.set(h.id, []));
  // 预置 parent 占位（真实的 parent subgraph id 在装配阶段再填）
  heads.forEach(h => map.set("parent:" + h.id, null));

  heads.forEach(h => {
    const pid = getStateTransitionParentId(h.id);
    // 只有当 pid 存在且对应节点也是“头领”时，才建立父子关系
    if (pid && nodeById.has(pid)) {
      const pNode = nodeById.get(pid);
      if (pNode && pNode.hasStateTransition && map.has(pid)) {
        map.get(pid).push(h.id);
        // 具体的 parent 子图ID稍后在 buildStateTransitionGraph 中写入
        map.set("parent:" + h.id, null);
      } else {
        // 父节点不是头领，则该 head 作为顶层子图
        map.set("parent:" + h.id, null);
      }
    } else {
      // 无父（或父不在相关集合）也作为顶层子图
      map.set("parent:" + h.id, null);
    }
  });

  return map;
}

function computeSubgraphNodes(headId, allNodes, childHeadIds) {
  const res = new Set();
  const headPure = getPureId(headId);
  const headPlus = getPlusLevel(headPure);

  // 子头领前缀集合（纯ID）
  const childPrefixes = childHeadIds.map(cid => getPureId(cid));

  // 把 head 本人放入
  res.add(headId);

  allNodes.forEach(n => {
    const pure = getPureId(n.id);
    if (pure.startsWith(headPure + ".")) {
      // 同 plus 层级
      if (getPlusLevel(pure) === headPlus) {
        // 不落入任一子头领前缀
        const underAnyChild = childPrefixes.some(cp => pure === cp || pure.startsWith(cp + "."));
        if (!underAnyChild) {
          res.add(n.id);
        }
      }
    }
  });

  return res;
}
// 新增：判断是否为直接子节点关系（仅通过添加 "." 形成，且为直接一层）
function isChildRelation(parentId, childId) {
  if (!parentId || !childId) return false;
  if (parentId === childId) return false;

  // 仅当 child 以 parent + "." 开头才可能是子节点
  if (!childId.startsWith(parentId + ".")) return false;

  // 取 parent 后面的剩余部分，不能再包含额外的 "."
  const remaining = childId.substring(parentId.length + 1);
  return !remaining.includes(".");
}
/**
 * 查找一个头领节点的“结构性父头领”
 * @param {string} headId - 当前头领节点的ID
 * @param {Map} subgraphMap - 所有头领子图的映射
 * @returns {string | null} - 父头领的子图ID，或null
 */
function findStructuralParentHead(headId, subgraphMap) {
    let currentId = getStateTransitionParentId(headId);
    while (currentId) {
        if (isLeaderNode(currentId) && subgraphMap.has(currentId)) {
            return subgraphMap.get(currentId).id;
        }
        currentId = getParentId(currentId); // 向上追溯
    }
    return null;
}


function getStateTransitionLevel(id) {
  if (!id) return 0;
  const pureId = id.split('-')[0]; // 去除描述部分
  let level = 0;
  let lastCharType = null; // 'dot' 或 'plus'
  let i = 0;
  while (i < pureId.length) {
    if (pureId[i] === '+') {
      // 连续+段
      if (lastCharType !== 'plus') {
        if (lastCharType === 'dot') level++;
        lastCharType = 'plus';
      }
      while (pureId[i] === '+') i++;
    } else if (pureId[i] === '.') {
      // 连续.段
      if (lastCharType !== 'dot') {
        lastCharType = 'dot';
      }
      while (pureId[i] === '.') i++;
    } else {
      i++;
    }
  }
  return level;
}

// 获取节点点号层级
function getDotLevel(id) { 
  if (!id) return 0; 
  return (id.match(/\./g) || []).length; 
}

// 获取节点加号层级
function getPlusLevel(id) { 
  if (!id) return 0; 
  return (id.match(/\+/g) || []).length; 
}

// 安全的节点ID转换
function safeNodeId(id) {
  return "node_" + id.replace(/[@\.+]/g, function(match) {
    if (match === '+') return "_plus_";
    if (match === '.') return "_";
    if (match === '@') return "_";
    return "_";
  });
}

// 从文件名解析节点信息
function stripMarkdownExtensionForDisplay(value) {
  return String(value || "").replace(/\.md$/i, "");
}

function parseFileInfo(fileName) {
  const displayFileName = stripMarkdownExtensionForDisplay(fileName);
  const match = fileName.match(/ATOM@(.*?)- (.+)/);
  
  if (!match) {
    return { id: displayFileName, name: displayFileName, hasStateTransition: false };
  }
  
  const id = "ATOM@" + match[1].trim();
  const name = stripMarkdownExtensionForDisplay(match[2].trim());
  
  // 检查是否包含状态转移符号"+"
  const hasStateTransition = id.includes("+");
  
  // 解析状态转移
  let baseState = null;
  if (hasStateTransition) {
    const plusIndex = id.indexOf("+");
    baseState = id.substring(0, plusIndex);
  }
  
  return { id, name, hasStateTransition, baseState };
}

// 修正后的状态转移关系判断函数
function isStateTransitionRelation(sourceId, targetId) {
  // 如果两个ID相同，则不是状态转移关系
  if (sourceId === targetId) return false;
  
  // 获取纯ID（移除可能的描述部分）
  const dashSourceIndex = sourceId.indexOf('-');
  const pureSourceId = dashSourceIndex > 0 ? sourceId.substring(0, dashSourceIndex) : sourceId;
  
  const dashTargetIndex = targetId.indexOf('-');
  const pureTargetId = dashTargetIndex > 0 ? targetId.substring(0, dashTargetIndex) : targetId;
  
  // 情况1: 直接状态转移关系 (如 ATOM@027F.001.002 -> ATOM@027F.001.002+001)
  if (pureTargetId.startsWith(pureSourceId + "+")) {
    const remainingPart = pureTargetId.substring(pureSourceId.length + 1);
    // 确保"+"后面的部分不包含"+"或"." - 关键修改点
    return !remainingPart.includes("+") && !remainingPart.includes(".");
  }
  
  // 情况2: 多级状态转移关系 (如 ATOM@027F.001.002+001 -> ATOM@027F.001.002+001+001)
  if (pureSourceId.includes("+") && pureTargetId.includes("+")) {
    // 源ID中的加号数量
    const sourcePlusCount = (pureSourceId.match(/\+/g) || []).length;
    // 目标ID中的加号数量
    const targetPlusCount = (pureTargetId.match(/\+/g) || []).length;
    
    // 如果目标比源多一个加号，且目标ID是以源ID+"+"开头的
    if (targetPlusCount === sourcePlusCount + 1 && pureTargetId.startsWith(pureSourceId + "+")) {
      const remainingPart = pureTargetId.substring(pureSourceId.length + 1);
      // 确保"+"后面的部分不包含"." - 关键修改点
      return !remainingPart.includes(".");
    }
  }
  
  return false;
}

/**
 * Gets the source parent ID for a state transition node. (Corrected Version: Added robustness check)
 * This finds the ID of the node from which the state transition originated.
 * @param {string | null | undefined} id - The node ID.
 * @returns {string | null} The source parent ID, or null if not a state transition.
 */
function getStateTransitionParentId(id) {
    // CRITICAL FIX: Immediately return null if the id is invalid.
    if (!id || typeof id !== 'string') {
        return null;
    }
    
    const dashIndex = id.indexOf('-');
    const pureId = dashIndex > 0 ? id.substring(0, dashIndex) : id;

    if (!pureId.includes("+")) {
        return null;
    }
    
    // This logic correctly finds the part of the ID *before* the last "+XXX" segment.
    const segments = [];
    let i = 0;
    while (i < pureId.length) {
        if (pureId[i] === '+') {
            let start = i;
            while (i < pureId.length && pureId[i] === '+') i++;
            segments.push(pureId.substring(start, i));
        } else if (pureId[i] === '.') {
            let start = i;
            while (i < pureId.length && pureId[i] === '.') i++;
            segments.push(pureId.substring(start, i));
        } else {
            let start = i;
            while (i < pureId.length && pureId[i] !== '+' && pureId[i] !== '.') i++;
            segments.push(pureId.substring(start, i));
        }
    }
    
    let lastPlusIndex = -1;
    for (let j = segments.length - 1; j >= 0; j--) {
        if (segments[j].startsWith('+')) {
            lastPlusIndex = j;
            break;
        }
    }

    if (lastPlusIndex <= 0) {
        return null;
    }

    let parentId = "";
    for (let k = 0; k < lastPlusIndex; k++) {
        parentId += segments[k];
    }

    if (parentId.endsWith('.') || parentId.endsWith('+')) {
        parentId = parentId.slice(0, -1);
    }
    
    return parentId;
}


// 获取节点的父节点ID
/**
 * Gets the parent ID of a node. (Corrected Version: Added robustness check)
 * This function handles all types of parent-child relationships defined in your ID system.
 * @param {string | null | undefined} id - The node ID.
 * @returns {string | null} The parent ID, or null if it has no parent.
 */
function getParentId(id) {
    // CRITICAL FIX: Immediately return null if the id is invalid.
    if (!id || typeof id !== 'string') {
        return null;
    }

    // Remove the description part ("- ...") to get the pure ID for structural analysis.
    const dashIndex = id.indexOf('-');
    const pureId = dashIndex > 0 ? id.substring(0, dashIndex) : id;

    // Handle multi-level dot paths after a state transition (e.g., ...+001.002.001)
    if (pureId.includes("+") && pureId.substring(pureId.indexOf("+")).includes(".")) {
        const afterPlusPart = pureId.substring(pureId.indexOf("+"));
        const lastDotIndex = afterPlusPart.lastIndexOf(".");
        if (lastDotIndex > 0) {
            return pureId.substring(0, pureId.indexOf("+") + lastDotIndex);
        } else {
            return pureId.substring(0, pureId.indexOf("+") + afterPlusPart.indexOf("."));
        }
    }

    // Handle multiple plus signs (e.g., ...+002+001)
    if (pureId.split("+").length > 2) {
        const lastPlusIndex = pureId.lastIndexOf("+");
        return pureId.substring(0, lastPlusIndex);
    }

    // Handle a single plus sign (e.g., ...001+001)
    if (pureId.includes("+")) {
        return pureId.substring(0, pureId.indexOf("+"));
    }

    // Handle standard hierarchical relationships (dot-separated)
    if (pureId.includes(".")) {
        const lastDotIndex = pureId.lastIndexOf(".");
        const lastPart = pureId.substring(lastDotIndex + 1);
        
        // This handles your rule for peer relationships (e.g., ...001A) vs. child relationships.
        if (/[A-Za-z]/.test(lastPart) && !lastPart.match(/^[0-9]+[A-Za-z]$/)) {
            return pureId.substring(0, lastDotIndex);
        }
        
        return pureId.substring(0, lastDotIndex);
    }

    // If none of the above conditions are met, the node has no parent.
    return null;
}


// 获取节点层级
function getNodeLevel(id) {
  if (!id) return 0;
  
  // 分别计算点号和加号的数量
  const dotCount = (id.match(/\./g) || []).length;
  const plusCount = (id.match(/\+/g) || []).length;
  
  // 总层级是两者之和
  return dotCount + plusCount;
}

// 获取状态转移的编号部分（最后一个+或.后面的部分）
function getNodeNumber(id) {
  if (!id) return "";
  
  // 对于包含+的ID
  if (id.includes("+")) {
    const lastPlusParts = id.split("+");
    const lastPart = lastPlusParts[lastPlusParts.length - 1];
    
    // 如果最后部分还包含点号，取点号后面的部分
    if (lastPart.includes(".")) {
      const lastDotParts = lastPart.split(".");
      return lastDotParts[lastDotParts.length - 1];
    } else {
      // 否则返回最后一个+后面的部分
      return lastPart;
    }
  }
  
  // 对于只包含.的ID
  if (id.includes(".")) {
    const parts = id.split(".");
    return parts[parts.length - 1];
  }
  
  // 无法确定编号
  return id;
}


// ===== 节点点击滚动功能 =====
// 查找并滚动到右侧视图中的指定文件
function findAndScrollToFileInAOTM(fileName) {
  setTimeout(() => {
    try {
      const potentialTables = document.querySelectorAll(
        '.workspace-leaf:not(.mod-active) .view-content table tbody, .workspace-leaf:not(.mod-active) .view-content .custom-table tbody'
      );
      if (!potentialTables || potentialTables.length === 0) {
        throw new Error('未找到可能包含文件列表的表格');
      }

      let targetRow = null;
      let containingTable = null;

      for (const tableBody of potentialTables) {
        const allRows = Array.from(tableBody.querySelectorAll('tr'));
        const foundRow = allRows.find(row => row.textContent.includes(fileName));
        if (foundRow) {
          targetRow = foundRow;
          containingTable = tableBody;
          break;
        }
      }

      if (!targetRow) {
        const allElements = document.querySelectorAll(
          '.workspace-leaf:not(.mod-active) .view-content *'
        );
        for (const element of allElements) {
          if (element.textContent.includes(fileName)) {
            targetRow = element.closest('tr') || element;
            break;
          }
        }
      }

      if (!targetRow) {
        if (window.Notice) {
          new Notice(`在右侧视图中未找到笔记: ${fileName}`);
        } else {
          console.log(`在右侧视图中未找到笔记: ${fileName}`);
        }
        return;
      }

      const scrollContainer =
        targetRow.closest('.workspace-leaf-content') ||
        targetRow.closest('.view-content') ||
        document.querySelector('.workspace-split.mod-vertical.mod-root');

      if (!scrollContainer) {
        throw new Error('未找到可滚动容器');
      }

      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const originalBackground = targetRow.style.backgroundColor;
      const originalTransition = targetRow.style.transition;
      targetRow.style.transition = 'background-color 0.8s';
      targetRow.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';

      setTimeout(() => {
        targetRow.style.backgroundColor = originalBackground;
        targetRow.style.transition = originalTransition;
      }, 3000);

      let noticeMessage;
      if (containingTable) {
        const allRows = Array.from(containingTable.querySelectorAll('tr'));
        const rowIndex = allRows.indexOf(targetRow) + 1;
        noticeMessage = `已找到并滚动到笔记：${fileName}（第 ${rowIndex} 行 / 共 ${allRows.length} 行）`;
      } else {
        noticeMessage = `已找到并滚动到笔记：${fileName}`;
      }

      if (window.Notice) {
        new Notice(noticeMessage);
      } else {
        console.log(noticeMessage);
      }
    } catch (error) {
      console.error('滚动定位错误:', error);
      const errorMessage = `查找或滚动过程中发生错误：${error.message}`;
      if (window.Notice) {
        new Notice(errorMessage);
      } else {
        console.error(errorMessage);
      }
    }
  }, 300);
}

// ===== 节点点击滚动功能 =====
// 查找并滚动到右侧视图中的指定文件
/**
 * [已修正] 查找并滚动到右侧视图中的指定文件
 * - 修正了窗格选择逻辑，不再使用 :not(.mod-active)
 * - 增强了对不同列表类型的兼容性（表格或Div列表）
 */
/**
 * [最终健壮版] 查找并滚动到右侧视图中的指定文件
 * - 统一使用最可靠的窗格和行项目定位逻辑。
 */
/**
 * [最终修正版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 增加了对目标窗格的“可见性”检查，确保只在活动的分屏中查找。
 */
/**
 * [终极混合版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 结合了两种策略：优先使用 [data-path]，失败则回退到查找表格行 <tr>。
 * - 增强了ID提取逻辑，确保能从链接或文本中获取ID。
 */





// ===== 数据收集与处理 =====
// 获取所有文件
function getFiles() {
  try {
    if (!CONFIG.targetNode || !String(CONFIG.targetNode).trim()) return [];
    const cachedFiles = (__pluginApi && typeof __pluginApi.getNodeEntriesByPrefix === "function")
      ? __pluginApi.getNodeEntriesByPrefix(CONFIG.targetNode)
      : null;
    if (Array.isArray(cachedFiles) && cachedFiles.length > 0) {
      return cachedFiles;
    }
    if (!dv) return [];
    // 使用真实数据 - 查询指定前缀的节点
    return dv.pages()
      .where(p => p.file.name.startsWith(CONFIG.targetNode))
      .sort(p => p.file.name, 'asc')
      .map(p => {
        return {
          file: p.file,
          mermaidViewComplete: p["mermaid应用的范式"] === true, // 这是我们上次加的
          mermaidViewBayes: p["mermaid贝叶斯"] === true, // 新增贝叶斯节点
          mermaidViewStandard: p["mermaid批判式标准"] === true, // 新增批判式标准节点
          mermaidViewPending: p["mermaid未闭环"] === true, // 新增未闭环节点
          mermaidViewAI: p["mermaid关键词"] === true, // 新增关键词解释节点
          mermaidViewHighlight: p["mermaid视图重点"] === true, // <<< 增加这一行，用于重点标记
          // --- 新增代码 ---
          isFolded: p['图折叠'] === true // 读取"图折叠"属性，用于控制折叠
          // --- 新增代码结束 ---
        };
      })
      .array();
  } catch (error) {
    return [];
  }
}

function extractBodyForReferenceScan(content) {
  return String(content || "")
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/m, "")
    .trim();
}

function extractAtomIdFromText(text) {
  const match = String(text || "").match(/ATOM@[\d\.A-Z\+]+/i);
  return match ? match[0].toUpperCase() : null;
}

function extractBodyReferenceTargets(content, sourceNodeId, validNodeIds) {
  const body = extractBodyForReferenceScan(content);
  const targets = new Set();
  const wikiTargets = new Set();

  const wikiRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = wikiRegex.exec(body)) !== null) {
    let rawTarget = match[1].trim();
    const pipeIndex = rawTarget.indexOf("|");
    if (pipeIndex > -1) rawTarget = rawTarget.slice(0, pipeIndex).trim();
    const hashIndex = rawTarget.indexOf("#");
    if (hashIndex > -1) rawTarget = rawTarget.slice(0, hashIndex).trim();

    const targetId = extractAtomIdFromText(rawTarget);
    if (!targetId || targetId === sourceNodeId || !validNodeIds.has(targetId)) continue;
    targets.add(targetId);
    wikiTargets.add(targetId);
  }

  const atomRegex = /ATOM@[\d\.A-Z\+]+/gi;
  while ((match = atomRegex.exec(body)) !== null) {
    const targetId = String(match[0] || "").toUpperCase();
    if (!targetId || targetId === sourceNodeId || wikiTargets.has(targetId) || !validNodeIds.has(targetId)) continue;
    targets.add(targetId);
  }

  return Array.from(targets);
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - chroma / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) {
    r1 = chroma; g1 = x; b1 = 0;
  } else if (hue < 120) {
    r1 = x; g1 = chroma; b1 = 0;
  } else if (hue < 180) {
    r1 = 0; g1 = chroma; b1 = x;
  } else if (hue < 240) {
    r1 = 0; g1 = x; b1 = chroma;
  } else if (hue < 300) {
    r1 = x; g1 = 0; b1 = chroma;
  } else {
    r1 = chroma; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function rgbToHex(rgb) {
  const toHex = (value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function hexToRgb(hex) {
  const raw = String(hex || "").replace("#", "").trim();
  if (raw.length === 3) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16)
    };
  }
  if (raw.length === 6) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16)
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function rgbDistance(a, b) {
  const dr = (a.r || 0) - (b.r || 0);
  const dg = (a.g || 0) - (b.g || 0);
  const db = (a.b || 0) - (b.b || 0);
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbaFromHex(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function buildReferenceColorCandidates() {
  // 包豪斯倾向: 控制纯度, 保留明确色相差异, 避免荧光感
  const palette = [
    "#B84A3A", // muted vermilion
    "#C58B2B", // ochre
    "#2F5D8A", // cobalt
    "#4B6B50", // olive green
    "#7A3F48", // oxblood
    "#3F6B6A", // teal
    "#A9683A", // burnt orange
    "#6A5E8E", // dusty violet
    "#8B6F47", // umber
    "#4C5866", // slate blue gray
    "#A14E5D", // rose brick
    "#587D91", // muted cyan blue
    "#6E7446", // moss
    "#8C5B34", // sienna
    "#51627A", // steel blue
    "#9A7A3C", // brass
    "#6C4B57", // wine
    "#3F5252", // deep gray teal
    "#A35A45", // clay red
    "#7B6A55"  // warm stone
  ];

  return palette.map((hex) => ({
    hex,
    rgb: hexToRgb(hex)
  }));
}

function pickMaxContrastColors(count) {
  if (!count || count <= 0) return [];

  const candidates = buildReferenceColorCandidates();
  const existingNodeColors = [
    "#ddffdd",
    "#ffeb99",
    "#ddddff",
    "#F37021",
    "#008000",
    "#8B5CF6",
    "#5383AA",
    "#002FA7",
    "#E34234",
    "#e9ecef"
  ].map(hexToRgb);

  const selected = [];
  const usedHex = new Set();

  while (selected.length < count && selected.length < candidates.length) {
    let bestCandidate = null;
    let bestScore = -Infinity;

    candidates.forEach((candidate) => {
      if (usedHex.has(candidate.hex)) return;

      const distanceToSelected = selected.length > 0
        ? Math.min(...selected.map(item => rgbDistance(candidate.rgb, item.rgb)))
        : 0;
      const distanceToExisting = Math.min(...existingNodeColors.map(color => rgbDistance(candidate.rgb, color)));
      const score = selected.length > 0
        ? distanceToSelected * 0.72 + distanceToExisting * 0.28
        : distanceToExisting;

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    });

    if (!bestCandidate) break;
    selected.push(bestCandidate);
    usedHex.add(bestCandidate.hex);
  }

  return selected.map(item => item.hex);
}

async function buildBodyReferenceGroups(nodes) {
  const nodeList = Array.isArray(nodes) ? nodes.filter(Boolean) : [];
  const nodeIdByUpper = new Map();
  const validNodeIds = new Set();
  const adjacency = new Map();
  const edgeKeys = new Set();

  nodeList.forEach((node) => {
    const nodeId = String(node.id || "");
    const upperNodeId = nodeId.toUpperCase();
    if (!nodeId || !upperNodeId) return;
    validNodeIds.add(upperNodeId);
    nodeIdByUpper.set(upperNodeId, nodeId);
    adjacency.set(nodeId, new Set());
  });

  await Promise.all(nodeList.map(async (node) => {
    if (!node?.path) return;
    const file = app.vault.getAbstractFileByPath(node.path);
    if (!file || typeof app.vault.cachedRead !== "function") return;

    try {
      const sourceNodeId = String(node.id || "");
      const sourceNodeIdUpper = sourceNodeId.toUpperCase();
      const cachedTargets = (__pluginApi && typeof __pluginApi.getReferenceTargets === "function")
        ? __pluginApi.getReferenceTargets(node.path)
        : null;
      const targets = Array.isArray(cachedTargets)
        ? new Set(cachedTargets.map(target => String(target || "").toUpperCase()).filter(target => validNodeIds.has(target) && target !== sourceNodeIdUpper))
        : extractBodyReferenceTargets(await app.vault.cachedRead(file), sourceNodeIdUpper, validNodeIds);
      targets.forEach((targetId) => {
        const normalizedTargetId = String(targetId || "").toUpperCase();
        const actualTargetId = nodeIdByUpper.get(normalizedTargetId);
        if (!adjacency.has(sourceNodeId) || !actualTargetId || !adjacency.has(actualTargetId)) return;
        const edgeKey = [sourceNodeId, actualTargetId].sort().join("::");
        adjacency.get(sourceNodeId).add(actualTargetId);
        adjacency.get(actualTargetId).add(sourceNodeId);
        edgeKeys.add(edgeKey);
      });
    } catch (error) {
      console.warn("[Mermaid 引用着色] 读取文件失败:", node.path, error);
    }
  }));

  const components = [];
  const visited = new Set();

  adjacency.forEach((neighbors, nodeId) => {
    if (visited.has(nodeId) || !neighbors || neighbors.size === 0) return;

    const queue = [nodeId];
    const componentNodes = [];
    visited.add(nodeId);

    while (queue.length > 0) {
      const current = queue.shift();
      componentNodes.push(current);

      (adjacency.get(current) || []).forEach((neighbor) => {
        if (visited.has(neighbor)) return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }

    componentNodes.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
    const componentNodeSet = new Set(componentNodes);
    const componentEdgeCount = componentNodes.reduce((sum, current) => {
      const currentNeighbors = adjacency.get(current) || new Set();
      let localCount = 0;
      currentNeighbors.forEach((neighbor) => {
        if (componentNodeSet.has(neighbor) && current < neighbor) localCount += 1;
      });
      return sum + localCount;
    }, 0);

    components.push({
      nodes: componentNodes,
      edgeCount: componentEdgeCount
    });
  });

  components.sort((a, b) => {
    if (b.nodes.length !== a.nodes.length) return b.nodes.length - a.nodes.length;
    return a.nodes[0].localeCompare(b.nodes[0], "zh-Hans-CN");
  });

  const colors = pickMaxContrastColors(components.length);
  const nodeToGroup = new Map();
  components.forEach((component, index) => {
    component.color = colors[index] || "#00bcd4";
    component.groupId = index;
    component.nodes.forEach((nodeId) => {
      nodeToGroup.set(nodeId, {
        groupId: index,
        color: component.color
      });
    });
  });

  return {
    components,
    nodeToGroup,
    edgeCount: edgeKeys.size
  };
}

function applyBodyReferenceGroupStyling(diagramContainer, graphNodes, referenceGroups) {
  if (!diagramContainer || !referenceGroups?.components?.length) {
    return { styledNodeCount: 0, componentCount: 0, edgeCount: 0 };
  }

  diagramContainer.querySelectorAll(".mermaid-reference-halo").forEach((halo) => halo.remove());
  const nodeIndex = new Map((graphNodes || []).map(node => [node.id, node]));
  const lookup = buildRenderedNodeLookup(diagramContainer);
  let styledNodeCount = 0;

  referenceGroups.components.forEach((component) => {
    component.nodes.forEach((nodeId) => {
      const nodeObject = nodeIndex.get(nodeId);
      if (!nodeObject) return;

      const nodeElement = findRenderedNodeElement(nodeObject, diagramContainer, lookup);
      if (!nodeElement) return;

      const shapes = nodeElement.querySelectorAll("rect:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), circle:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), polygon:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), ellipse:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), path:not(.mermaid-reference-halo):not(.mermaid-active-node-halo)");
      if (!shapes || shapes.length === 0) return;

      const primaryShape = shapes[0];
      const halo = primaryShape.cloneNode(false);
      halo.removeAttribute("id");
      halo.classList.add("mermaid-reference-halo");
      halo.setAttribute("aria-hidden", "true");
      halo.style.setProperty("fill", "none", "important");
      halo.style.setProperty("stroke", component.color, "important");
      halo.style.setProperty("stroke-width", isLeaderNode(nodeObject.id) ? "9px" : "7px", "important");
      halo.style.setProperty("stroke-opacity", "0.95", "important");
      halo.style.setProperty("stroke-linejoin", "round", "important");
      halo.style.setProperty("stroke-dasharray", "none", "important");
      halo.style.setProperty("vector-effect", "non-scaling-stroke", "important");
      halo.style.setProperty("pointer-events", "none", "important");
      primaryShape.parentNode.insertBefore(halo, primaryShape);

      shapes.forEach((shape) => {
        shape.style.setProperty("stroke", component.color, "important");
        shape.style.setProperty("stroke-width", isLeaderNode(nodeObject.id) ? "4.5px" : "3.75px", "important");
        shape.style.setProperty("stroke-opacity", "0.95", "important");
        shape.style.setProperty("stroke-linejoin", "round", "important");
        shape.style.setProperty("stroke-dasharray", "none", "important");
        shape.style.setProperty("vector-effect", "non-scaling-stroke", "important");
        shape.style.setProperty("filter", "none", "important");
      });

      nodeElement.dataset.referenceGroupColor = component.color;
      styledNodeCount += 1;
    });
  });

  return {
    styledNodeCount,
    componentCount: referenceGroups.components.length,
    edgeCount: referenceGroups.edgeCount || 0
  };
}



// 获取直接状态转移节点
function getDirectStateTransitions(node, allNodes) {
  return allNodes.filter(n => {
    // 跳过自身
    if (n.id === node.id) return false;
    
    // 使用改进后的函数判断状态转移关系
    return isStateTransitionRelation(node.id, n.id);
  });
}

// 获取所有直接子节点 - 通过"."连接的
function getDirectChildren(node, allNodes) {
  return allNodes.filter(potentialChild => {
    // 跳过自身
    if (potentialChild.id === node.id) return false;
    
    // 只检查通过"."连接的子节点
    if (potentialChild.id.startsWith(node.id + ".")) {
      const remainingPart = potentialChild.id.substring(node.id.length + 1);
      // 确保这是直接子节点
      return !remainingPart.includes(".");
    }
    
    return false;
  });
}

// 获取所有直接点号子节点
function getDirectDotChildren(node, allNodes) {
  return allNodes.filter(n => {
    // 跳过自身
    if (n.id === node.id) return false;
    
    // 确保是通过添加"."形成的直接子节点
    if (n.id.startsWith(node.id + ".")) {
      const remainingPart = n.id.substring(node.id.length + 1);
      // 确保这是直接子节点
      return !remainingPart.includes(".");
    }
    
    return false;
  });
}

// 获取所有点号子孙节点
function getAllDotDescendants(node, allNodes) {
  const descendants = [];
  const queue = [node];
  const processed = new Set([node.id]);
  
  while (queue.length > 0) {
    const currentNode = queue.shift();
    
    // 查找当前节点的所有直接点号子节点
    const dotChildren = getDirectDotChildren(currentNode, allNodes);
    
    // 将找到的子节点添加到结果集中
    dotChildren.forEach(child => {
      if (!processed.has(child.id)) {
        descendants.push(child);
        processed.add(child.id);
        queue.push(child); // 将子节点加入队列，继续处理其子节点
      }
    });
  }
  
  return descendants;
}

// 收集相关节点
function collectRelevantNodes(targetNode, allNodes, maxDepth) {
  const result = new Set([targetNode]);
  const firstById = new Map(), dotChildren = new Map(), transitions = new Map();
  for (const node of allNodes) {
    if (!firstById.has(node.id)) firstById.set(node.id, node);
    const at = node.id.lastIndexOf('.');
    if (at >= 0) {
      const parent = node.id.slice(0, at);
      if (!dotChildren.has(parent)) dotChildren.set(parent, []);
      dotChildren.get(parent).push(node);
    }
    if (node.hasStateTransition) {
      const source = getStateTransitionParentId(node.id);
      if (source) {
        if (!transitions.has(source)) transitions.set(source, []);
        transitions.get(source).push(node);
      }
    }
  }
  function collectParents(node, depth) {
    if (depth >= maxDepth || !node.parentId) return;
    const parent = firstById.get(node.parentId);
    if (parent) { result.add(parent); collectParents(parent, depth + 1); }
  }
  function collectChildren(nodeId, depth) {
    if (depth >= maxDepth || !nodeId) return;
    for (const child of dotChildren.get(nodeId) || []) {
      result.add(child);
      if (CONFIG.showAllDescendants) collectChildren(child.id, depth + 1);
    }
  }
  collectParents(targetNode, 0);
  collectChildren(targetNode.id, 0);

  // The old closure expanded snapshots in insertion order. Preserve that order
  // (and Set<object> identity), while avoiding repeats of already expanded work.
  const expanded = new Set(), expandedDotRoots = new Set();
  function addDotDescendants(root) {
    if (expandedDotRoots.has(root.id)) return;
    expandedDotRoots.add(root.id);
    const queue = [root], visited = new Set([root.id]);
    for (let i = 0; i < queue.length; i++) {
      for (const child of dotChildren.get(queue[i].id) || []) {
        if (visited.has(child.id)) continue;
        visited.add(child.id); result.add(child); queue.push(child);
      }
    }
  }
  for (;;) {
    const size = result.size;
    for (const node of Array.from(result)) {
      if (expanded.has(node)) continue;
      expanded.add(node);
      for (const stateNode of transitions.get(node.id) || []) {
        result.add(stateNode); addDotDescendants(stateNode);
      }
      if (node.hasStateTransition) {
        const sourceId = getStateTransitionParentId(node.id);
        const source = sourceId ? firstById.get(sourceId) : null;
        if (source) { result.add(source); addDotDescendants(source); }
      }
    }
    if (size === result.size) break;
  }
  return Array.from(result);
}

// 创建子图 - 修改后正确处理子孙节点
function createSubgraph(nodeId, relevantNodes, graph, graphData) {
  console.log(`createSubgraph called with nodeId: ${nodeId}`);

  const dashIndex = nodeId.indexOf('-');
  const pureNodeId = dashIndex > 0 ? nodeId.substring(0, dashIndex) : nodeId;
  const subgraphId = `state_${pureNodeId.replace(/[@\.+]/g, "_")}`;

  if (graph.processedSubgraphs.has(subgraphId)) {
    console.log(`Subgraph ${subgraphId} already processed`);
    return false;
  }

  const currentNode = relevantNodes.find(node => node.id === nodeId);
  if (!currentNode) {
    console.warn(`Cannot find currentNode for nodeId: ${nodeId}`);
    return false;
  }

  const subgraphNodeIds = [currentNode.id];
  relevantNodes.forEach(node => {
    const childDashIndex = node.id.indexOf('-');
    const pureChildId = childDashIndex > 0 ? node.id.substring(0, childDashIndex) : node.id;

    if (node.id !== currentNode.id && pureChildId.startsWith(pureNodeId + ".")) {
      const childPlusLevel = getPlusLevel(pureChildId);
      const nodePlusLevel = getPlusLevel(pureNodeId);
      if (childPlusLevel === nodePlusLevel) {
        subgraphNodeIds.push(node.id);
      }
    }
  });

  console.log(`Subgraph ${subgraphId} will have ${subgraphNodeIds.length} nodes`);

  const nodeLevelMap = new Map();
  subgraphNodeIds.forEach(id => {
    const idDashIndex = id.indexOf('-');
    const pureId = idDashIndex > 0 ? id.substring(0, idDashIndex) : id;
    const dotLevel = getDotLevel(pureId) - getDotLevel(pureNodeId);
    nodeLevelMap.set(id, dotLevel + 1);
  });

  const internalEdges = [];
  const sortedNodes = [...subgraphNodeIds].sort((a, b) => nodeLevelMap.get(a) - nodeLevelMap.get(b));

  for (const id of sortedNodes) {
    if (id === nodeId) continue;
    const parentId = getParentId(id);
    if (parentId && subgraphNodeIds.includes(parentId)) {
      const sourceSafeId = safeNodeId(parentId);
      const targetSafeId = safeNodeId(id);
      const globalEdgeKey = `${sourceSafeId}->${targetSafeId}`;

      if (!graph.processedEdges) graph.processedEdges = new Set();

      if (!graph.processedEdges.has(globalEdgeKey)) {
        internalEdges.push({ source: parentId, target: id });
        graph.processedEdges.add(globalEdgeKey);
      }
    }
  }

  graphData.subgraphs.push({
    id: subgraphId,
    label: `${nodeId} 状态`,
    nodes: subgraphNodeIds,
    edges: internalEdges,
    baseNode: nodeId,
    nodeLevels: nodeLevelMap
  });

  graph.processedSubgraphs.add(subgraphId);
  console.log(`Subgraph ${subgraphId} created with ${internalEdges.length} internal edges`);
  return true;
}

/**
 * 构建状态转移关系图 (最终修正版)
 * 增加层级比较，以正确处理并列的头领节点。
 * @param {object} targetNode - 起始节点
 * @param {Array} allNodes - 所有相关节点
 * @param {number} maxDepth - 最大深度
 * @returns {object} - 包含节点、子图和边的图数据
 */
/**
 * 构建状态转移关系图 (最终修正版)
 * 通过精确的父子关系判断和层级比较，正确处理并列头领和深度嵌套。
 */
/**
 * 构建状态转移关系图 (最终修正版)
 * 通过精确的父子关系判断和层级比较，正确处理并列头领和深度嵌套。
 */
/**
 * 构建状态转移关系图 (最终修正版)
 * 通过精确的父子关系判断和层级比较，正确处理并列头领和深度嵌套。
 * @param {object} targetNode - 起始节点
 * @param {Array} allNodes - 所有相关节点
 * @param {number} maxDepth - 最大深度
 * @returns {object} - 包含节点、子图和边的图数据
 */
/**
 * 构建状态转移关系图 (最终完美版)
 * 使用“结构性父头领”查找，实现完美的层级嵌套。
 */
/**
 * Builds the state transition graph structure. (Final, Complete Version)
 * This version correctly handles peer leaders, nested subgraphs, and calculates the nesting level for each subgraph.
 * @param {object} targetNode - The starting node for the graph.
 * @param {Array} allNodes - An array of all node objects.
 * @param {number} [maxDepth=10] - The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * 构建状态转移关系图 (最终完美版)
 * 集成了“结构性父头领”查找和“隐形节点布局”逻辑。
 */
/**
 * 构建状态转移关系图 (最终完美版)
 * 集成了“结构性父头领”查找和“隐形节点布局”逻辑。
 * @param {object} targetNode - 起始节点
 * @param {Array} allNodes - 所有相关节点
 * @param {number} maxDepth - 最大深度
 * @returns {object} - 包含节点、子图和边的图数据
 */
/**
 * 构建状态转移关系图 (最终完美版)
 * 集成了对“状态转移树父子关系”的隐形节点布局。
 */
/**
 * 构建状态转移关系图 (最终完美版)
 * 集成了最精确的“隐形节点”布局逻辑，从“跳板节点”发起连接。
 */
/**
 * 构建状态转移关系图 (最终完美版)
 * 集成了对“状态转移树父子关系”的隐形节点布局。
 */
/**
 * buildStateTransitionGraph (Final Version with Dual-Connection Logic)
 * Implements the definitive "State Transition Tree" layout, creating both
 * invisible layout links and a direct solid indicator link.
 */
/**
 * buildStateTransitionGraph (Final, Corrected Version)
 * Implements the definitive logic for ST-Tree and nested relationships,
 * including the dual-connection strategy for ST-Tree layout.
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * buildStateTransitionGraph (最终完美版)
 * 采用最严格的层级比较，彻底解决所有错误的嵌套问题。
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * buildStateTransitionGraph (最终完美版)
 * 采用最严格的层级比较和父级继承，彻底解决所有错误的嵌套和分离问题。
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * buildStateTransitionGraph (Final Version with ID Simplification)
 * Generates simplified, human-readable IDs for Mermaid code while
 * maintaining a full map for interactivity.
 */
/**
 * buildStateTransitionGraph (Final, Definitive Version)
 * Implements the "deepest node" logic for perfect layout link origination.
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * buildStateTransitionGraph (Final, Definitive Version)
 * Implements the recursive "deepest node" logic for perfect layout link origination,
 * ensuring the most robust and visually stable ST-Tree layout.
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * buildStateTransitionGraph (Final, Definitive Version)
 * Implements the "deepest node" logic for perfect layout link origination by
 * recursively searching through nested subgraphs and ST-Children.
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
/**
 * buildStateTransitionGraph (Final, Definitive Version)
 * Implements the ultimate "deepest node" logic by recursively searching
 * through all nested ST-Children to find the true visual bottom of a subgraph,
 * ensuring perfect layout link origination.
 *
 * @param {object} targetNode - The starting node for the graph.
 * @param {Array} allNodes - An array of all node objects.
 * @param {number} [maxDepth=10] - The maximum depth for node collection.
 * @returns {object} The complete graph data structure for rendering.
 */
/**
 * buildStateTransitionGraph (The Absolute Final Version)
 * Derives layout helpers from address-based whole-subgraph exit frontiers.
 * Nested expansion and state continuation have separate semantics.
 * @param {object} targetNode The starting node for the graph.
 * @param {Array} allNodes An array of all node objects.
 * @param {number} [maxDepth=10] The maximum depth for node collection.
 * @returns {object} The complete graph data structure.
 */
// Layout-only address parent: suffix letters are opaque; only . and + delimit.
function getLayoutAddressParent(id) {
    const pure = getPureId(id);
    const at = Math.max(pure.lastIndexOf('.'), pure.lastIndexOf('+'));
    return at > 0 ? pure.slice(0, at) : null;
}

// Find a containing head, not a preceding state head. A+001 and A share a scope.
function getLayoutContainerHead(id, headsByPureId) {
    const pure = getPureId(id);
    let prefix = pure.slice(0, Math.max(0, pure.lastIndexOf('.')));
    while (prefix) {
        if (headsByPureId.has(prefix) && pure.startsWith(prefix + '.')) {
            return headsByPureId.get(prefix);
        }
        if (isLeaderNode(prefix)) return undefined; // Missing containing head.
        prefix = getLayoutAddressParent(prefix);
    }
    return null;
}

// Recompute from visible address units; never reuse old helper edges as semantics.
// Each child unit expands to its whole exit frontier before a successor unit starts.
function rebuildLayoutExitHelpers(graph) {
    const nodes = graph.nodes || [], subgraphs = graph.subgraphs || [];
    const visible = new Set(nodes.map(n => n.id));
    const edges = (graph.edges || []).filter(e => e.type !== 'invisible'
        && visible.has(e.source) && visible.has(e.target));
    const byId = new Map(), byHead = new Map(), children = new Map(), remaining = new Map();
    const summaries = new Map(), invalid = new Set();
    const counts = { layoutExitCount: 0, layoutHelperCount: 0,
        layoutUnresolvedCount: 0, layoutMissingParentCount: 0, layoutPartialCount: 0 };
    const identities = new Set();
    let ambiguous = (graph.layoutDuplicateCount || 0) > 0;
    for (const node of nodes) {
        const pure = getPureId(node.id);
        if (identities.has(pure)) ambiguous = true;
        identities.add(pure);
    }
    for (const sg of subgraphs) {
        if (byId.has(sg.id) || byHead.has(sg.baseNode)) ambiguous = true;
        byId.set(sg.id, sg); byHead.set(sg.baseNode, sg);
        remaining.set(sg.id, 0);
    }
    for (const sg of subgraphs) {
        if (!sg.parent) continue;
        if (!byId.has(sg.parent)) { invalid.add(sg.id); continue; }
        if (!children.has(sg.parent)) children.set(sg.parent, []);
        children.get(sg.parent).push(sg);
        remaining.set(sg.parent, remaining.get(sg.parent) + 1);
    }
    const queue = subgraphs.filter(sg => remaining.get(sg.id) === 0);
    for (let index = 0; index < queue.length; index++) {
        const sg = queue[index], units = new Map(), localByPure = new Map();
        const spans = new Map(), representatives = new Map(), distances = new Map();
        let unresolved = ambiguous || invalid.has(sg.id) || sg.layoutUnresolved === true;
        let partial = false;
        const addUnit = (id, exits) => {
            if (!visible.has(id) || units.has(id) || localByPure.has(getPureId(id))) unresolved = true;
            units.set(id, exits); localByPure.set(getPureId(id), id);
        };
        for (const id of sg.nodes || []) {
            addUnit(id, [id]); spans.set(id, 0); representatives.set(id, id);
        }
        for (const child of children.get(sg.id) || []) {
            const summary = summaries.get(child.id);
            if (!summary || summary.unresolved) unresolved = true;
            if (summary?.partial) partial = true;
            addUnit(child.baseNode, summary?.exits || []);
            spans.set(child.baseNode, summary?.span || 0);
            representatives.set(child.baseNode, summary?.representative || null);
        }
        const outgoing = new Map(), indegree = new Map();
        for (const id of units.keys()) { outgoing.set(id, []); indegree.set(id, 0); distances.set(id, 0); }
        for (const id of units.keys()) {
            if (id === sg.baseNode) continue;
            const parent = localByPure.get(getLayoutAddressParent(id));
            if (parent) {
                outgoing.get(parent).push(id); indegree.set(id, indegree.get(id) + 1);
            } else {
                // A collected scope can omit an intermediate member. Keep that
                // branch as an independent exit, but do not call it complete.
                partial = true; counts.layoutMissingParentCount++;
            }
        }
        const ready = Array.from(units.keys()).filter(id => indegree.get(id) === 0);
        for (let i = 0; i < ready.length; i++) {
            for (const next of outgoing.get(ready[i])) {
                const source = ready[i];
                // Two layout edges only for head-origin PLUS continuation.
                // Dot members retain one step even when their parent is a head.
                const step = isLeaderNode(source) && isLeaderNode(next) ? 2 : 1;
                distances.set(next, Math.max(distances.get(next),
                    distances.get(source) + spans.get(source) + step));
                indegree.set(next, indegree.get(next) - 1);
                if (indegree.get(next) === 0) ready.push(next);
            }
        }
        if (ready.length !== units.size || !units.has(sg.baseNode)) unresolved = true;
        const exits = new Set();
        let representative = null, span = -1;
        if (!unresolved) {
            for (const [id, expanded] of units) {
                if (outgoing.get(id).length) continue;
                for (const exit of expanded) exits.add(exit);
                const candidate = representatives.get(id);
                const candidateSpan = distances.get(id) + spans.get(id);
                // Tie-breaking is a stable layout choice, not a serial relation.
                if (candidate && (candidateSpan > span || (candidateSpan === span
                    && (representative === null || getPureId(candidate) < getPureId(representative))))) {
                    representative = candidate; span = candidateSpan;
                }
            }
        }
        summaries.set(sg.id, { exits: Array.from(exits), representative, span: Math.max(0, span), unresolved, partial });
        if (partial) counts.layoutPartialCount++;
        if (sg.parent && remaining.has(sg.parent)) {
            remaining.set(sg.parent, remaining.get(sg.parent) - 1);
            if (remaining.get(sg.parent) === 0) queue.push(byId.get(sg.parent));
        }
    }
    // Cyclic containment cannot complete postorder; never choose an arbitrary head.
    for (const sg of subgraphs) {
        if (!summaries.has(sg.id)) summaries.set(sg.id, { exits: [], unresolved: true });
    }
    for (const summary of summaries.values()) {
        if (summary.unresolved) counts.layoutUnresolvedCount++;
        counts.layoutExitCount += summary.exits.length;
    }
    const invisibleNodes = [], helpers = [], successors = new Map();
    for (const edge of edges) {
        if (edge.type !== 'st-indicator') continue;
        if (!successors.has(edge.source)) successors.set(edge.source, new Set());
        successors.get(edge.source).add(edge.target);
    }
    for (const [source, targets] of successors) {
        const sg = byHead.get(source), summary = sg && summaries.get(sg.id);
        if (!summary || summary.unresolved || !summary.representative) continue;
        const safeTargets = Array.from(targets).filter(target => !summary.exits.includes(target));
        if (!safeTargets.length) continue;
        const helper = `invisible${invisibleNodes.length + 1}`;
        invisibleNodes.push(helper);
        // Exactly one incoming constraint: other parallel exits remain free.
        helpers.push({ source: summary.representative, target: helper, type: 'invisible' });
        for (const target of safeTargets) helpers.push({ source: helper, target, type: 'invisible' });
    }
    counts.layoutHelperCount = invisibleNodes.length;
    return { ...graph, edges: [...edges, ...helpers], invisibleNodes, layoutExitDiagnostics: counts };
}

function acceptLayoutExitCache(entry) {
    return entry?.config?.layoutExitVersion === 2 ? entry : null;
}


function buildStateTransitionGraph(targetNode, allNodes, maxDepth = 10) {
    const relevantNodes = collectRelevantNodes(targetNode, allNodes, maxDepth);
    const nodeById = new Map(relevantNodes.map(n => [n.id, n]));
    const heads = relevantNodes.filter(n => isLeaderNode(n.id));

    // --- ID Simplification Logic (no changes needed) ---
    const idMap = new Map();
    const simpleIdCounter = { L: 0, M: 0, B: 0 };
    function getSimpleId(node) {
        if (idMap.has(node.id)) return idMap.get(node.id);
        let prefix = isLeaderNode(node.id) ? 'L' : (node.parentId || getStateTransitionParentId(node.id) ? 'M' : 'B');
        const simpleId = prefix + simpleIdCounter[prefix]++;
        idMap.set(node.id, simpleId);
        node.simpleId = simpleId;
        return simpleId;
    }
    relevantNodes.forEach(n => getSimpleId(n));
    // --- End of ID Simplification ---

    const subgraphs = [];
    const subgraphMap = new Map();
    heads.forEach(head => {
        const sg = {
            id: `sg_${head.simpleId}`,
            label: `${head.id} 状态`,
            baseNode: head.id,
            nodes: [], 
            edges: [], 
            parent: null
        };
        subgraphMap.set(head.id, sg);
        subgraphs.push(sg);
    });

    // Containment comes from dot boundaries, independently of input order.
    const headsByPureId = new Map(subgraphs.map(sg => [getPureId(sg.baseNode), sg]));
    subgraphs.forEach(sg => {
        const owner = getLayoutContainerHead(sg.baseNode, headsByPureId);
        sg.parent = owner ? owner.id : null;
        if (owner === undefined) sg.layoutUnresolved = true;
    });

    // Populate subgraphs with members (no changes needed)
    heads.forEach(head => {
        const sg = subgraphMap.get(head.id);
        const childHeadIds = subgraphs.filter(csg => csg.parent === sg.id).map(csg => csg.baseNode);
        const sgNodes = computeSubgraphNodes(head.id, relevantNodes, childHeadIds);
        sg.nodes = Array.from(sgNodes);
        sgNodes.forEach(id => {
            const parentId = getParentId(id);
            if (parentId && sgNodes.has(parentId)) {
                sg.edges.push({ source: parentId, target: id });
            }
        });
    });

    // Keep business state indicators separate from derived layout helpers.
    const edges = [];
    heads.forEach(head => {
        const sourceId = getStateTransitionParentId(head.id);
        if (sourceId && nodeById.has(sourceId)) {
            edges.push({ source: sourceId, target: head.id,
                type: isLeaderNode(sourceId) ? 'st-indicator' : 'stateTransition' });
        }
    });
    // Count relevant duplicate identities before maps/collection can hide them.
    const relevantPureIds = new Set(relevantNodes.map(n => getPureId(n.id)));
    const seen = new Set();
    let layoutDuplicateCount = 0;
    for (const node of allNodes) {
        const pure = getPureId(node.id);
        if (!relevantPureIds.has(pure)) continue;
        if (seen.has(pure)) layoutDuplicateCount++;
        seen.add(pure);
    }
    return rebuildLayoutExitHelpers({ nodes: relevantNodes, subgraphs, edges,
        invisibleNodes: [], layoutDuplicateCount });
}





















// ===== Mermaid代码生成 =====
// 生成Mermaid图表代码
/**
 * 生成最终的Mermaid图表代码
 * @param {object} graph - 由buildStateTransitionGraph生成的图表数据结构
 * @param {function} clickCallback - 节点点击时的回调函数
 * @returns {string} - 完整的Mermaid代码
 */
/**
 * Generates the final Mermaid code for the diagram.
 * This function recursively renders nested subgraphs and ensures correct node and edge definitions.
 * @param {object} graph - The graph data structure from buildStateTransitionGraph.
 * @param {function} clickCallback - The callback function for node clicks.
 * @returns {string} - The complete Mermaid code.
 */
/**
 * 生成最终的Mermaid图表代码 (最终版)
 * @param {object} graph - 由buildStateTransitionGraph生成的图表数据结构
 * @param {function} clickCallback - 节点点击时的回调函数
 * @returns {string} - 完整的Mermaid代码
 */
/**
 * 生成最终的Mermaid图表代码 (最终完整版)
 * 能够处理并列头领、深度嵌套和所有类型的连接。
 * @param {object} graph - 由buildStateTransitionGraph生成的图表数据结构
 * @param {function} clickCallback - 节点点击时的回调函数
 * @returns {string} - 完整的Mermaid代码
 */
/**
 * 生成最终的Mermaid图表代码 (最终重构版)
 * 能够处理并列头领、深度嵌套和所有类型的连接。
 */
/**
 * 生成最终的Mermaid图表代码 (最终重构版)
 * 能够处理并列头领、深度嵌套和所有类型的连接。
 */
/**
 * 生成最终的Mermaid图表代码 (最终完美版)
 * 能够渲染隐形节点以实现精确的层级对齐。
 * @param {object} graph - 图表数据结构
 * @param {function} clickCallback - 节点点击回调
 * @returns {string} - 完整的Mermaid代码
 */
/**
 * 生成最终的Mermaid图表代码 (最终完整版)
 * 能够渲染隐形节点以实现精确的层级对齐。
 * @param {object} graph - 图表数据结构
 * @param {function} clickCallback - 节点点击回调
 * @returns {string} - 完整的Mermaid代码
 */
/**
 * generateMermaidCode (Final Version for Simple IDs)
 * Uses simplified IDs for a clean diagram and correctly maps them for interactivity.
 */

function createPrunedGraphForFold(graph, foldedPrefixes = []) {
    const prefixSet = new Set((foldedPrefixes || []).filter(Boolean));
    if (!prefixSet.size) return graph;

    const subgraphs = Array.isArray(graph.subgraphs) ? graph.subgraphs : [];
    const subgraphMap = new Map(subgraphs.map(sg => [sg.id, sg]));
    const foldedSubgraphs = subgraphs.filter(sg => prefixSet.has(getPureId(sg.baseNode)));
    if (!foldedSubgraphs.length) return graph;

    function isDescendantSubgraphOf(candidateSubgraph, ancestorSubgraphId) {
        let currentParentId = candidateSubgraph ? candidateSubgraph.parent : null;
        const visited = new Set();
        while (currentParentId && !visited.has(currentParentId)) {
            visited.add(currentParentId);
            if (currentParentId === ancestorSubgraphId) return true;
            const parentSubgraph = subgraphMap.get(currentParentId);
            currentParentId = parentSubgraph ? parentSubgraph.parent : null;
        }
        return false;
    }

    function getCollapsedOwnerSubgraph(nodeId) {
        return foldedSubgraphs.find(foldedSg => {
            if (nodeId === foldedSg.baseNode) return false;
            if ((foldedSg.nodes || []).includes(nodeId)) return true;
            return subgraphs.some(sg => {
                return sg.id !== foldedSg.id && isDescendantSubgraphOf(sg, foldedSg.id) && (sg.nodes || []).includes(nodeId);
            });
        }) || null;
    }

    const visibleNodeIds = new Set();
    const visibleNodes = (graph.nodes || []).filter(node => {
        const visible = !getCollapsedOwnerSubgraph(node.id);
        if (visible) visibleNodeIds.add(node.id);
        return visible;
    });

    const keptSubgraphs = subgraphs
        .filter(sg => !foldedSubgraphs.some(foldedSg => foldedSg.id !== sg.id && isDescendantSubgraphOf(sg, foldedSg.id)))
        .map(sg => {
            const isFoldedRoot = prefixSet.has(getPureId(sg.baseNode));
            const nodes = isFoldedRoot
                ? (visibleNodeIds.has(sg.baseNode) ? [sg.baseNode] : [])
                : (sg.nodes || []).filter(nodeId => visibleNodeIds.has(nodeId));
            const edges = isFoldedRoot
                ? []
                : (sg.edges || []).filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
            return { ...sg, nodes, edges };
        })
        .filter(sg => sg.nodes.length > 0);

    const keptSubgraphIds = new Set(keptSubgraphs.map(sg => sg.id));
    keptSubgraphs.forEach(sg => {
        if (sg.parent && !keptSubgraphIds.has(sg.parent)) sg.parent = null;
    });

    // Folding changes the exit frontier; discard all previous helper halves.
    return rebuildLayoutExitHelpers({
        ...graph,
        nodes: visibleNodes,
        subgraphs: keptSubgraphs,
        edges: (graph.edges || []).filter(edge => edge.type !== 'invisible'
            && visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)),
        invisibleNodes: []
    });
}


function generateMermaidCode(graph, clickCallback, foldedPrefixes = []) {
    let code = `flowchart ${CONFIG.layout}\n`;
    
    // Style definitions
    code += "  %% 样式定义\n";
    code += "  classDef base fill:#dfd,stroke:#393\n";
    code += "  classDef leader fill:#ffeb99,stroke:#933,stroke-width:1.5px\n";
    code += "  classDef member fill:#ddf,stroke:#333\n";
    code += "  classDef highlighted fill:#F37021,stroke:#C05000,stroke-width:1.5px,color:white\n";
    code += "  classDef bayes fill:#008000,stroke:#C05000,stroke-width:1.5px,color:white\n";
    code += "  classDef Standard fill:#8B5CF6,stroke:#C05000,stroke-width:1.5px,color:white\n";
    code += "  classDef completed fill:#5383AA,stroke:#C05000,stroke-width:1.5px,color:white\n";
    code += "  classDef pending fill:#002FA7,stroke:#C05000,stroke-width:1.5px,color:white\n";
    code += "  classDef AI fill:#E34234,stroke:#C05000,stroke-width:1.5px,color:white\n";
    code += "  classDef invisible fill:none,stroke:none\n";
    // --- 新增: 折叠节点的样式 ---
    code += "  classDef foldedNode fill:#fff3bf,stroke:#d9480f,stroke-width:3px,stroke-dasharray: 6 3\n";

    // Build indexes
    const nodeIndex = new Map(graph.nodes.map(n => [n.id, n]));
    const subgraphMap = new Map(graph.subgraphs.map(sg => [sg.id, sg]));
    const childrenByParent = new Map([[null, []]]);
    graph.subgraphs.forEach(sg => {
        const parentId = sg.parent || null;
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(sg.id);
    });

    const definedNodes = new Set();
    const renderedEdges = new Set();
    
    // --- 新增: 辅助函数 ---
    function getPureId(id) {
        const dashIndex = id.indexOf('-');
        return dashIndex >= 0 ? id.substring(0, dashIndex) : id;
    }

    const foldedPrefixSet = new Set(foldedPrefixes || []);
    const foldedSubgraphs = (graph.subgraphs || []).filter(sg => foldedPrefixSet.has(getPureId(sg.baseNode)));
    const foldedSubgraphIds = new Set(foldedSubgraphs.map(sg => sg.id));

    function isDescendantSubgraphOf(candidateSubgraph, ancestorSubgraphId) {
        let currentParentId = candidateSubgraph ? candidateSubgraph.parent : null;
        while (currentParentId) {
            if (currentParentId === ancestorSubgraphId) return true;
            const parentSubgraph = subgraphMap.get(currentParentId);
            currentParentId = parentSubgraph ? parentSubgraph.parent : null;
        }
        return false;
    }

    function isSubgraphCollapsedByAncestor(subgraphId) {
        const sg = subgraphMap.get(subgraphId);
        if (!sg) return false;
        return foldedSubgraphs.some(foldedSg => foldedSg.id !== subgraphId && isDescendantSubgraphOf(sg, foldedSg.id));
    }

    function getCollapsedOwnerSubgraph(nodeId) {
        if (!foldedSubgraphs.length) return null;
        return foldedSubgraphs.find(foldedSg => {
            if (nodeId === foldedSg.baseNode) return false;
            if ((foldedSg.nodes || []).includes(nodeId)) return true;
            return (graph.subgraphs || []).some(sg => {
                return sg.id !== foldedSg.id && isDescendantSubgraphOf(sg, foldedSg.id) && (sg.nodes || []).includes(nodeId);
            });
        }) || null;
    }

    function isHidden(nodeId) {
        if (!foldedPrefixes || foldedPrefixes.length === 0) return false;
        return !!getCollapsedOwnerSubgraph(nodeId);
    }
    // --- 辅助函数结束 ---

    function escapeMermaidHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function getLabelCharWidth(char) {
        if (!char) return 0;
        if (/\s/.test(char)) return 0.45;
        if (/[\x00-\x7F]/.test(char)) return 0.55;
        return 1;
    }

    function wrapNodeTitle(title, options = {}) {
        const text = String(title || "").trim();
        if (!text) return [];

        const targetWidth = Number(options.targetWidth || 18);
        const minBreakWidth = Number(options.minBreakWidth || 11);
        const hardWidth = Number(options.hardWidth || 22);
        const breakAfterChars = new Set("，。；：！？、,. ;:!?/|-—");
        const lines = [];
        let start = 0;

        while (start < text.length) {
            while (start < text.length && /\s/.test(text[start])) start += 1;
            if (start >= text.length) break;

            const lineStart = start;
            let width = 0;
            let end = text.length;
            let nextStart = text.length;
            let preferredBreak = -1;
            let preferredNextStart = -1;

            for (let i = lineStart; i < text.length; i += 1) {
                const char = text[i];
                width += getLabelCharWidth(char);

                if (/\s/.test(char) && width >= minBreakWidth) {
                    preferredBreak = i;
                    preferredNextStart = i + 1;
                } else if (breakAfterChars.has(char) && width >= minBreakWidth) {
                    preferredBreak = i + 1;
                    preferredNextStart = i + 1;
                }

                if (width >= targetWidth && preferredBreak > lineStart) {
                    end = preferredBreak;
                    nextStart = preferredNextStart;
                    break;
                }
                if (width >= hardWidth) {
                    if (preferredBreak > lineStart) {
                        end = preferredBreak;
                        nextStart = preferredNextStart;
                    } else {
                        end = i + 1;
                        nextStart = i + 1;
                    }
                    break;
                }
            }

            const line = text.slice(lineStart, end).trim();
            if (line) lines.push(line);
            start = Math.max(nextStart, end);
        }

        return lines.length ? lines : [text];
    }

    function getLabel(nodeId) {
        const node = nodeIndex.get(nodeId);
        if (!node) return nodeId;
        let text = `${node.id}<br>${node.name || ""}`;
        const pureId = getPureId(node.id);
        if (text.length > 20) {
            text = text.replace(/(.{15,20})([\s,\.，。;；:：!！？?])/g, '$1$2<br>');
            if (!text.includes('<br>') && text.length > 20) {
                const chunks = [];
                for (let i = 0; i < text.length; i += 20) {
                    chunks.push(text.substring(i, Math.min(i + 20, text.length)));
                }
                text = chunks.join('<br>');
            }
        }
        if (foldedPrefixSet.has(pureId)) {
            text += `<br><span style="font-size:11px;color:#d9480f;">▣ 已折叠子图 · 悬停展开</span>`;
        }
        return text;
    }

    function renderSubgraphRecursive(subgraphId) {
        const sg = subgraphMap.get(subgraphId);
        if (!sg || isSubgraphCollapsedByAncestor(subgraphId)) return ""; // 父级子图折叠时，不渲染其嵌套子图
        const isCollapsedSubgraph = foldedSubgraphIds.has(subgraphId);
        const labelSuffix = isCollapsedSubgraph ? " · 已折叠" : "";
        let subCode = `  subgraph "${sg.label}${labelSuffix}"\n`;
        
        (sg.nodes || []).forEach(nodeId => {
            if (isHidden(nodeId)) return; // 修改: 跳过被隐藏的节点
            const node = nodeIndex.get(nodeId);
            if (node && !definedNodes.has(node.simpleId)) {
                subCode += `    ${node.simpleId}["${getLabel(nodeId)}"]\n`;
                definedNodes.add(node.simpleId);
            }
        });

        if (!isCollapsedSubgraph) {
            (sg.edges || []).forEach(edge => {
                if (isHidden(edge.source) || isHidden(edge.target)) return; // 修改: 跳过与隐藏节点相关的边
                const sourceNode = nodeIndex.get(edge.source);
                const targetNode = nodeIndex.get(edge.target);
                if (sourceNode && targetNode) {
                    const edgeKey = `${sourceNode.simpleId}-->${targetNode.simpleId}`;
                    if (!renderedEdges.has(edgeKey)) {
                        subCode += `    ${sourceNode.simpleId} --> ${targetNode.simpleId}\n`;
                        renderedEdges.add(edgeKey);
                    }
                }
            });

            (childrenByParent.get(subgraphId) || []).forEach(childId => {
                subCode += renderSubgraphRecursive(childId);
            });
        }
        subCode += `  end\n`;
        return subCode;
    }

    // --- Begin Rendering ---
    
    code += "\n  %% 节点定义\n";
    (graph.invisibleNodes || []).forEach(id => {
        if (isHidden(id)) return; // 修改: 跳过被隐藏的节点
        code += `  ${id}[" "]\n`;
        definedNodes.add(id);
    });
    
    const allSubgraphNodes = new Set(graph.subgraphs.flatMap(sg => sg.nodes));

    graph.nodes.forEach(node => {
        if (!allSubgraphNodes.has(node.id) && !definedNodes.has(node.simpleId)) {
            if (isHidden(node.id)) return; // 修改: 跳过被隐藏的节点
            code += `  ${node.simpleId}["${getLabel(node.id)}"]\n`;
            definedNodes.add(node.simpleId);
        }
    });
    
    (childrenByParent.get(null) || []).forEach(sgId => {
        code += renderSubgraphRecursive(sgId);
    });

    // Render Connections
    code += "\n  %% 连接线定义\n";
    graph.nodes.forEach(node => {
        const parentId = getParentId(node.id);
        if (parentId && nodeIndex.has(parentId) && !allSubgraphNodes.has(node.id) && !allSubgraphNodes.has(parentId)) {
            if (isHidden(node.id) || isHidden(parentId)) return; // 修改: 跳过与隐藏节点相关的边
            const parentNode = nodeIndex.get(parentId);
            const edgeKey = `${parentNode.simpleId}-->${node.simpleId}`;
            if (!renderedEdges.has(edgeKey)) {
                code += `  ${parentNode.simpleId} --> ${node.simpleId}\n`;
                renderedEdges.add(edgeKey);
            }
        }
    });

    (graph.edges || []).forEach(edge => {
        if (isHidden(edge.source) || isHidden(edge.target)) return; // 修改: 跳过与隐藏节点相关的边
        const sourceNode = nodeIndex.get(edge.source) || { simpleId: edge.source };
        const targetNode = nodeIndex.get(edge.target) || { simpleId: edge.target };
        const edgeKey = `${sourceNode.simpleId}-->${targetNode.simpleId}`;
        if (renderedEdges.has(edgeKey) && edge.type !== 'invisible') return;
        
        if (edge.type === 'invisible') {
            code += `  ${sourceNode.simpleId} -.-> ${targetNode.simpleId}\n`;
        } else {
            code += `  ${sourceNode.simpleId} --> ${targetNode.simpleId}\n`;
        }
        renderedEdges.add(edgeKey);
    });

    // ===== Corrected Style Application Logic =====

    code += "\n  %% 样式应用\n";
    graph.nodes.forEach(n => {
        if (isHidden(n.id)) return; // 修改: 不为隐藏节点应用样式
        const sId = n.simpleId;
        const pureId = getPureId(n.id); // 获取纯ID用于判断折叠

        // 优先级：高亮 > 折叠 > 其他
        if (n.mermaidViewHighlight) {
            code += `  class ${sId} highlighted\n`;
        } else if (foldedPrefixes.includes(pureId)) { // 修改: 应用折叠样式
            code += `  class ${sId} foldedNode\n`;
        } else if (n.mermaidViewBayes) {
            code += `  class ${sId} bayes\n`;
        } else if (n.mermaidViewPending) {
            code += `  class ${sId} pending\n`;
        } else if (n.mermaidViewAI) {
            code += `  class ${sId} AI\n`;
        } else if (n.mermaidViewStandard) {
            code += `  class ${sId} Standard\n`;
        } else if (n.mermaidViewComplete) {
            code += `  class ${sId} completed\n`;
        } else if (isLeaderNode(n.id)) {
            code += `  class ${sId} leader\n`;
        } else if (allSubgraphNodes.has(n.id)) {
            code += `  class ${sId} member\n`;
        } else {
            code += `  class ${sId} base\n`;
        }
    });

    (graph.invisibleNodes || []).forEach(id => {
        if (isHidden(id)) return;
        code += `  class ${id} invisible\n`;
    });

    // Bind Click Events
    if (!PREWARM_ONLY && typeof clickCallback === 'function') {
        code += "\n  %% 绑定点击事件\n";
        graphStateHost.stateTransitionNodeIdMap = {};
        graph.nodes.forEach(n => {
            graphStateHost.stateTransitionNodeIdMap[n.simpleId] = n;
        });
        
        // 修改: 只为未被隐藏的节点绑定点击事件
        const clickableNodes = graph.nodes
            .filter(n => n.fileName && !isHidden(n.id)) 
            .map(n => n.simpleId);

        if (clickableNodes.length > 0) {
            graphStateHost.stateTransitionNodeClickCallback = clickCallback;
            code += `  click ${clickableNodes.join(',')} stateTransitionNodeClickCallback\n`;
            code += "  classDef clickable cursor:pointer\n";
            code += `  class ${clickableNodes.join(',')} clickable\n`;
        }
    }

    return code;
}












// ===== UI 和主程序 =====
// 创建用户界面
function createUI(container) {
  // 清除现有内容
  container.empty();
  
  // 标题
  container.createEl("h3", { text: "状态转移节点关系图" });
  
  // 设置面板
  const settingsDiv = container.createEl("div", { cls: "settings-panel" });
  settingsDiv.style.marginBottom = "15px";
  settingsDiv.style.padding = "10px";
  settingsDiv.style.backgroundColor = "#f5f5f5";
  settingsDiv.style.borderRadius = "5px";
  
  // 目标节点输入
  const nodeInput = settingsDiv.createEl("input", { 
    type: "text",
    value: CONFIG.targetNode,
    placeholder: "输入目标节点ID"
  });
  nodeInput.style.width = "200px";
  nodeInput.style.marginRight = "15px";
  
  // 深度设置
  const depthInput = settingsDiv.createEl("input", {
    type: "number",
    value: CONFIG.maxDepth,
    attr: { min: 1, max: 30 }
  });
  depthInput.style.width = "50px";
  depthInput.style.marginRight = "15px";
  
  // 布局选择
  const layoutSelect = settingsDiv.createEl("select");
  ["TB", "LR", "RL", "BT"].forEach(dir => {
    const option = layoutSelect.createEl("option", { text: dir });
    if (dir === CONFIG.layout) option.selected = true;
  });
  layoutSelect.style.marginRight = "15px";
  
  // 添加标签
  settingsDiv.insertBefore(document.createTextNode("目标节点: "), nodeInput);
  settingsDiv.insertBefore(document.createTextNode(" 最大深度: "), depthInput);
  settingsDiv.insertBefore(document.createTextNode(" 布局: "), layoutSelect);
  
  // 创建新行
  settingsDiv.createEl("br");
  
  // 添加不可见节点选项
  const invisibleCheck = settingsDiv.createEl("input", { 
    type: "checkbox",
    checked: CONFIG.addInvisibleNodes
  });
  invisibleCheck.style.marginRight = "5px";
  
  // 显示所有子孙节点选项
  const showAllCheck = settingsDiv.createEl("input", { 
    type: "checkbox",
    checked: CONFIG.showAllDescendants
  });
  showAllCheck.style.marginRight = "5px";
  
  // 显示完整ID选项
  const showFullIdsCheck = settingsDiv.createEl("input", { 
    type: "checkbox",
    checked: CONFIG.showFullIds
  });
  showFullIdsCheck.style.marginRight = "5px";
  
  // 启用缩放选项
  const zoomCheck = settingsDiv.createEl("input", { 
    type: "checkbox",
    checked: CONFIG.enableZoom
  });
  zoomCheck.style.marginRight = "5px";
  
  // 调试模式选项
  const debugCheck = settingsDiv.createEl("input", { 
    type: "checkbox",
    checked: CONFIG.debug
  });
  debugCheck.style.marginRight = "5px";
  
  // 添加标签
  settingsDiv.insertBefore(document.createTextNode("添加不可见节点: "), invisibleCheck);
  settingsDiv.insertBefore(document.createTextNode(" 显示所有子孙节点: "), showAllCheck);
  settingsDiv.insertBefore(document.createTextNode(" 显示完整ID: "), showFullIdsCheck);
  settingsDiv.insertBefore(document.createTextNode(" 启用缩放: "), zoomCheck);
  settingsDiv.insertBefore(document.createTextNode(" 调试模式: "), debugCheck);
  
  // 创建新行
  settingsDiv.createEl("br");
  
  // 更新按钮
  const updateButton = settingsDiv.createEl("button", { text: "更新图表" });
  updateButton.style.marginTop = "10px";
  
  // 说明信息
  const infoDiv = container.createEl("div", { cls: "info-panel" });
  infoDiv.style.marginBottom = "10px";
  infoDiv.style.fontSize = "0.9em";
  infoDiv.style.color = "#666";
  infoDiv.innerHTML = `
    <details>
      <summary style="cursor:pointer;color:#0074d9;">查看使用说明</summary>
      <p><b>节点交互功能:</b></p>
      <ul>
        <li><b>点击节点</b>: 点击图表中的任何节点，会自动滚动右侧边栏到对应的笔记位置</li>
        <li><b>高亮显示</b>: 找到的笔记行会暂时高亮显示，方便识别</li>
        <li><b>状态提示</b>: 点击后会显示操作结果的提示信息</li>
        <li><b>折叠子图展开</b>: 给某个节点所在笔记加上 YAML <code>图折叠: true</code> 后，主图默认收起该 subgraph，鼠标悬停根节点时会在原位置展开，移出后自动收起</li>
      </ul>
      <p>本图表使用循环迭代方式绘制状态转移关系，绘制逻辑为：</p>
      <ol>
        <li>首先绘制所有不包含"+"的普通节点</li>
        <li>然后按照循环迭代处理带"+"的状态转移节点:
          <ul>
            <li>a. 找到层级最小的尚未绘制的带"+"的节点</li>
            <li>b. 找到它的直接来源节点（最后一个"+"前的部分）</li>
            <li>c. 将来源节点及其所有子孙节点（使用"."连接的）放入一个subgraph中</li>
            <li>d. 用虚线箭头连接来源节点到状态转移节点</li>
            <li>e. 为状态转移节点创建子图，包含其点号子节点</li>
            <li>f. 重复以上步骤，直到所有带"+"的节点都被处理</li>
          </ul>
        </li>
      </ol>
      <p>节点关系说明:</p>
      <ul>
        <li>只有在编号末尾添加<b>新的"."</b>才产生子级节点</li>
        <li>在编号末尾添加<b>字母A</b>或<b>递增数字</b>都是创建<b>并列节点</b>，不是子节点</li>
        <li>添加<b>"+"</b>表示<b>状态转移关系</b></li>
      </ul>
      <p>图例说明:</p>
      <ul>
        <li><b>蓝色背景节点</b>: 普通节点</li>
        <li><b>绿色背景节点</b>: 基础状态节点</li>
        <li><b>黄色背景节点</b>: 状态转移节点(显示为"编号→名称"格式)</li>
        <li><b>实线箭头</b>: 普通层级关系</li>
        <li><b>虚线箭头</b>: 状态转移关系</li>
        <li><b>绿色方框</b>: 包含基础状态及其点号子节点的子图</li>
        <li><b>可点击节点</b>: 鼠标悬停时显示为手型光标，点击可导航到对应笔记</li>
      </ul>
      <p>缩放操作说明:</p>
      <ul>
        <li><b>放大/缩小按钮</b>: 点击按钮放大或缩小图表</li>
        <li><b>重置按钮</b>: 恢复原始大小</li>
        <li><b>键盘+鼠标</b>: Ctrl+滚轮进行图表缩放</li>
        <li><b>拖拽</b>: Alt+左键拖拽或中键拖拽进行平移</li>
      </ul>
    </details>
  `;
  
  // 状态信息
  const statusDiv = container.createEl("div", { cls: "status-info" });
  statusDiv.style.marginBottom = "10px";
  statusDiv.style.fontSize = "0.9em";
  
  // 图表容器
  const diagramContainer = container.createEl("div", { cls: "diagram-container" });
  diagramContainer.style.border = "1px solid #ccc";
  diagramContainer.style.padding = "10px";
  diagramContainer.style.minHeight = "500px";
  diagramContainer.style.position = "relative";
  diagramContainer.style.overflowX = "auto";
  diagramContainer.style.overflowY = "hidden";
  diagramContainer.style.maxHeight = "none";

  const outerContainer = container.closest('.mermaid-content') || container;
  if (outerContainer) {
    outerContainer.addEventListener('scroll', () => {
        measureMermaidInteraction('view.scroll', () => {
      const state = ensureMermaidGraphState();
      state.outerScrollLeft = outerContainer.scrollLeft;
      state.outerScrollTop = outerContainer.scrollTop;
      persistMermaidGraphState("outer-scroll");
        });
    });
  }
  
  // 代码切换按钮
  const toggleButton = container.createEl("button", { text: "显示/隐藏Mermaid代码" });
  toggleButton.style.marginTop = "10px";
  
  // 代码容器
  const codeContainer = container.createEl("div", { cls: "code-container" });
  codeContainer.style.display = "none";
  codeContainer.style.border = "1px solid #ccc";
  codeContainer.style.padding = "10px";
  codeContainer.style.marginTop = "10px";
  codeContainer.style.backgroundColor = "#f8f8f8";
  codeContainer.style.fontFamily = "monospace";
  codeContainer.style.fontSize = "0.9em";
  codeContainer.style.overflow = "auto";
  codeContainer.style.maxHeight = "300px";
  codeContainer.style.whiteSpace = "pre";
  
  // 代码复制按钮
  const copyButton = container.createEl("button", { text: "复制代码" });
  copyButton.style.marginTop = "5px";
  copyButton.style.display = "none";
  
  // 添加缩放控制
  const zoomControls = CONFIG.enableZoom ? setupZoomControls(container, diagramContainer) : null;
  
  // 更新按钮事件
  updateButton.addEventListener("click", () => {
    CONFIG.targetNode = nodeInput.value;
    CONFIG.maxDepth = parseInt(depthInput.value);
    CONFIG.layout = layoutSelect.value;
    CONFIG.addInvisibleNodes = invisibleCheck.checked;
    CONFIG.showAllDescendants = showAllCheck.checked;
    CONFIG.showFullIds = showFullIdsCheck.checked;
    CONFIG.enableZoom = zoomCheck.checked;
    CONFIG.debug = debugCheck.checked;
    getFoldDismissedPrefixes().clear();
    
    renderDiagram(container, statusDiv, diagramContainer, codeContainer, zoomControls);
  });
  
  // 切换代码显示
  toggleButton.addEventListener("click", () => {
    if (codeContainer.style.display === "none") {
      codeContainer.style.display = "block";
      copyButton.style.display = "inline-block";
    } else {
      codeContainer.style.display = "none";
      copyButton.style.display = "none";
    }
  });
  
  // 复制代码
  copyButton.addEventListener("click", () => {
    const code = codeContainer.textContent;
    try {
      // 使用clipboard API复制
      navigator.clipboard.writeText(code).then(() => {
        statusDiv.textContent = "代码已复制到剪贴板";
        setTimeout(() => {
          if (statusDiv.textContent === "代码已复制到剪贴板") {
            statusDiv.textContent = "";
          }
        }, 2000);
      });
    } catch (err) {
      statusDiv.textContent = "复制失败: " + err.message;
    }
  });
  
  return { statusDiv, diagramContainer, codeContainer, zoomControls };
}

// 添加缩放功能
// ===== UI 和主程序 =====
// ... (Your other functions remain the same)

/**
 * setupZoomControls (Final Version with State Saving)
 * Sets up zoom and pan controls, and now saves the view state
 * to a global object on every interaction.
 * @param {HTMLElement} container The main container element.
 * @param {HTMLElement} diagramContainer The container for the Mermaid SVG.
 * @returns {object} An object with control functions.
 */
/**
 * setupZoomControls (Final Version)
 * Sets up zoom/pan and saves the view state to a global object.
 * This version is enhanced to correctly initialize from the global state.
 */
/**
 * setupZoomControls (Final, Perfected Version)
 * Implements a smooth, center-focused zoom by dynamically adjusting
 * scroll positions to keep the viewport's center stationary.
 */
function setupZoomControls(container, diagramContainer) {
    // 确保全局状态对象存在,并使用持久化存储
    const defaultGraphState = {
        zoom: CONFIG.initialZoom,
        scrollLeft: 0,
        scrollTop: 0,
        panX: 0,
        panY: 0,
        outerScrollLeft: 0,
        outerScrollTop: 0
    };
    const readStoredGraphState = () => {
        if (PREWARM_ONLY) return null;
        const storedState = localStorage.getItem('mermaidGraphState');
        if (!storedState) return null;
        try {
            const parsed = JSON.parse(storedState);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (e) {
            console.warn('[状态恢复] localStorage 解析失败,使用默认值');
            return null;
        }
    };
    const storedGraphState = readStoredGraphState();
    if (!graphStateHost.mermaidGraphState) {
        graphStateHost.mermaidGraphState = storedGraphState || { ...defaultGraphState };
        if (storedGraphState) console.log('[状态恢复] 从 localStorage 恢复状态:', graphStateHost.mermaidGraphState);
    } else if (storedGraphState && Number.isFinite(Number(storedGraphState.zoom))) {
        graphStateHost.mermaidGraphState = { ...graphStateHost.mermaidGraphState, ...storedGraphState };
        console.log('[状态恢复] 合并 localStorage 缩放状态:', graphStateHost.mermaidGraphState);
    }
    if (graphStateHost.mermaidGraphState.panX == null) graphStateHost.mermaidGraphState.panX = 0;
    if (graphStateHost.mermaidGraphState.panY == null) graphStateHost.mermaidGraphState.panY = 0;
    if (graphStateHost.mermaidGraphState.outerScrollLeft == null) graphStateHost.mermaidGraphState.outerScrollLeft = 0;
    if (graphStateHost.mermaidGraphState.outerScrollTop == null) graphStateHost.mermaidGraphState.outerScrollTop = 0;
    if (graphStateHost.mermaidGraphState.scrollLeft == null) graphStateHost.mermaidGraphState.scrollLeft = 0;
    if (graphStateHost.mermaidGraphState.scrollTop == null) graphStateHost.mermaidGraphState.scrollTop = 0;
    if (graphStateHost.mermaidGraphState.zoom == null) graphStateHost.mermaidGraphState.zoom = CONFIG.initialZoom;

    // 从保存的状态开始
    let currentZoom = graphStateHost.mermaidGraphState.zoom || CONFIG.initialZoom;

    // --- UI Element Creation (no changes here) ---
    const zoomControls = container.createEl("div", { cls: "zoom-controls" });
    zoomControls.style.marginTop = "10px";
    zoomControls.style.marginBottom = "10px";
    zoomControls.style.display = "flex";
    zoomControls.style.alignItems = "center";
    const zoomOutBtn = zoomControls.createEl("button", { text: "➖" });
    const zoomResetBtn = zoomControls.createEl("button", { text: "重置" });
    const zoomInBtn = zoomControls.createEl("button", { text: "➕" });
    const zoomDisplay = zoomControls.createEl("span");
    zoomOutBtn.style.margin = "0 5px";
    zoomResetBtn.style.margin = "0 5px";
    zoomInBtn.style.margin = "0 5px";
    zoomDisplay.style.minWidth = "60px";
    zoomDisplay.style.textAlign = "center";

    // This function now *only* handles the visual update of the scale and text
    function updateZoomVisuals() {
        zoomDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
        const svgElement = diagramContainer.querySelector("svg");
        if (svgElement) {
            const panX = graphStateHost.mermaidGraphState?.panX || 0;
            const panY = graphStateHost.mermaidGraphState?.panY || 0;
            // The transform-origin is now handled by scroll adjustments,
            // but setting it to top-left ensures consistency.
            svgElement.style.transformOrigin = "top left";
            svgElement.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
            
            updateTransformedDiagramBounds(diagramContainer, "zoom-visuals");
            scheduleSubgraphReadableLabelOverlayRefresh(diagramContainer, "zoom-visuals");
        }
    }

    /**
     * **THE CORE LOGIC FOR CENTERED ZOOM**
     * This function applies the new zoom level and calculates the
     * required scroll offset to keep the view centered.
     */
    function applyZoom(newZoom) {
        // 1. Get viewport center and current scroll position (before zooming)
        const viewportCenterX = diagramContainer.clientWidth / 2;
        const viewportCenterY = diagramContainer.clientHeight / 2;
        const scrollLeftBefore = diagramContainer.scrollLeft;
        const scrollTopBefore = diagramContainer.scrollTop;

        // 2. Calculate which point on the un-scaled SVG is currently at the viewport center
        const pointX = (scrollLeftBefore + viewportCenterX) / currentZoom;
        const pointY = (scrollTopBefore + viewportCenterY) / currentZoom;

        // 3. Update to the new zoom level
        currentZoom = Math.max(0.1, newZoom);
        graphStateHost.mermaidGraphState.zoom = currentZoom; // Save state
        // 保存到 localStorage
        saveStateToLocalStorage();

        // 4. Apply the visual scale change
        updateZoomVisuals();

        // 5. Calculate the new scroll positions needed to bring the target point back to the center
        const newScrollLeft = (pointX * currentZoom) - viewportCenterX;
        const newScrollTop = (pointY * currentZoom) - viewportCenterY;

        // 6. Apply the new scroll positions
        diagramContainer.scrollLeft = newScrollLeft;
        diagramContainer.scrollTop = newScrollTop;

        // 保存滚动状态
        graphStateHost.mermaidGraphState.scrollLeft = newScrollLeft;
        graphStateHost.mermaidGraphState.scrollTop = newScrollTop;
        saveStateToLocalStorage();
    }

    function clampNumber(value, min, max) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return min;
        return Math.max(min, Math.min(max, numeric));
    }

    function getPopupCenterAnchor() {
        const outerContainer = diagramContainer.closest('.mermaid-content');
        const xViewportRect = diagramContainer.getBoundingClientRect();
        const yViewportRect = outerContainer ? outerContainer.getBoundingClientRect() : xViewportRect;
        return {
            x: xViewportRect.left + xViewportRect.width / 2,
            y: yViewportRect.top + yViewportRect.height / 2
        };
    }

    function getAdaptiveWheelZoom(currentValue, deltaY) {
        const direction = deltaY < 0 ? 1 : -1;
        const baseStep = currentValue < 0.8 ? 0.12 : currentValue > 3 ? 0.12 : 0.06;
        const intensity = Math.min(Math.max(Math.abs(Number(deltaY) || 0) / 100, 0.35), 2);
        const factor = Math.pow(1 + baseStep, intensity);
        const nextZoom = direction > 0 ? currentValue * factor : currentValue / factor;
        return {
            nextZoom: Math.max(0.1, nextZoom),
            direction,
            baseStep,
            intensity,
            factor
        };
    }

    function applyZoomAtClientPoint(newZoom, anchorClientX, anchorClientY, source = "popup-center", extra = {}) {
        return measureMermaidInteraction('view.zoom', () => {
        const svgElement = diagramContainer.querySelector("svg");
        const outerContainer = diagramContainer.closest('.mermaid-content');
        const oldZoom = currentZoom;
        const nextZoom = Math.max(0.1, newZoom);
        if (!svgElement || nextZoom === oldZoom) return;

        const xViewportRect = diagramContainer.getBoundingClientRect();
        const yViewportRect = outerContainer ? outerContainer.getBoundingClientRect() : xViewportRect;
        const requestedAnchorX = Number.isFinite(Number(anchorClientX)) ? Number(anchorClientX) : xViewportRect.left + xViewportRect.width / 2;
        const requestedAnchorY = Number.isFinite(Number(anchorClientY)) ? Number(anchorClientY) : yViewportRect.top + yViewportRect.height / 2;
        const clampedAnchorX = clampNumber(requestedAnchorX, xViewportRect.left, xViewportRect.right);
        const clampedAnchorY = clampNumber(requestedAnchorY, yViewportRect.top, yViewportRect.bottom);
        const beforeSvgRect = svgElement.getBoundingClientRect();
        const ratioX = beforeSvgRect.width ? clampNumber((clampedAnchorX - beforeSvgRect.left) / beforeSvgRect.width, 0, 1) : 0.5;
        const ratioY = beforeSvgRect.height ? clampNumber((clampedAnchorY - beforeSvgRect.top) / beforeSvgRect.height, 0, 1) : 0.5;
        const beforeScroll = {
            diagramLeft: diagramContainer.scrollLeft || 0,
            diagramTop: diagramContainer.scrollTop || 0,
            outerLeft: outerContainer ? outerContainer.scrollLeft || 0 : 0,
            outerTop: outerContainer ? outerContainer.scrollTop || 0 : 0
        };

        currentZoom = nextZoom;
        graphStateHost.mermaidGraphState.zoom = currentZoom;
        updateZoomVisuals();

        const afterSvgRect = svgElement.getBoundingClientRect();
        const afterAnchorX = afterSvgRect.left + ratioX * afterSvgRect.width;
        const afterAnchorY = afterSvgRect.top + ratioY * afterSvgRect.height;
        const deltaX = afterAnchorX - clampedAnchorX;
        const deltaY = afterAnchorY - clampedAnchorY;

        diagramContainer.scrollLeft = beforeScroll.diagramLeft + deltaX;
        if (outerContainer) {
            outerContainer.scrollTop = beforeScroll.outerTop + deltaY;
        } else {
            diagramContainer.scrollTop = beforeScroll.diagramTop + deltaY;
        }

        graphStateHost.mermaidGraphState.scrollLeft = diagramContainer.scrollLeft || 0;
        graphStateHost.mermaidGraphState.scrollTop = diagramContainer.scrollTop || 0;
        graphStateHost.mermaidGraphState.outerScrollLeft = outerContainer ? outerContainer.scrollLeft || 0 : 0;
        graphStateHost.mermaidGraphState.outerScrollTop = outerContainer ? outerContainer.scrollTop || 0 : 0;
        saveStateToLocalStorage();

        console.info('[MermaidFloatingWidget][zoom.center]', {
            source,
            oldZoom,
            newZoom: currentZoom,
            anchor: { x: Math.round(clampedAnchorX), y: Math.round(clampedAnchorY) },
            requestedAnchor: { x: Math.round(requestedAnchorX), y: Math.round(requestedAnchorY) },
            ratio: { x: Number(ratioX.toFixed(4)), y: Number(ratioY.toFixed(4)) },
            delta: { x: Math.round(deltaX), y: Math.round(deltaY) },
            wheel: extra?.wheel || null,
            scroll: {
                diagramLeft: Math.round(graphStateHost.mermaidGraphState.scrollLeft || 0),
                diagramTop: Math.round(graphStateHost.mermaidGraphState.scrollTop || 0),
                outerLeft: Math.round(graphStateHost.mermaidGraphState.outerScrollLeft || 0),
                outerTop: Math.round(graphStateHost.mermaidGraphState.outerScrollTop || 0)
            },
            viewport: {
                xWidth: Math.round(xViewportRect.width),
                yHeight: Math.round(yViewportRect.height)
            }
        });
        }, { zoom: newZoom });
    }

    function applyZoomFromPopupCenter(newZoom, source = "button-center") {
        const anchor = getPopupCenterAnchor();
        applyZoomAtClientPoint(newZoom, anchor.x, anchor.y, source);
    }

    function zoomIn() { applyZoomFromPopupCenter(currentZoom + CONFIG.zoomStep, "button-zoom-in"); }
    function zoomOut() { applyZoomFromPopupCenter(currentZoom - CONFIG.zoomStep, "button-zoom-out"); }
    function resetZoom() { applyZoomFromPopupCenter(CONFIG.initialZoom, "reset-center"); }

    zoomInBtn.addEventListener("click", zoomIn);
    zoomOutBtn.addEventListener("click", zoomOut);
    zoomResetBtn.addEventListener("click", resetZoom);

    // --- Event Listeners (Mouse Wheel, Drag, and Scroll Saving) ---
    // The mouse wheel now uses the same advanced applyZoom logic
    diagramContainer.addEventListener("wheel", (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
            const adaptiveZoom = getAdaptiveWheelZoom(currentZoom, event.deltaY);
            applyZoomAtClientPoint(adaptiveZoom.nextZoom, event.clientX, event.clientY, "wheel-mouse", {
                wheel: {
                    deltaY: Math.round(event.deltaY),
                    direction: adaptiveZoom.direction,
                    baseStep: adaptiveZoom.baseStep,
                    intensity: Number(adaptiveZoom.intensity.toFixed(3)),
                    factor: Number(adaptiveZoom.factor.toFixed(4))
                }
            });
        }
    }, { passive: false });

    // 保存滚动状态并持久化到 localStorage
    diagramContainer.addEventListener('scroll', () => {
        measureMermaidInteraction('view.scroll', () => {
        graphStateHost.mermaidGraphState.scrollLeft = diagramContainer.scrollLeft;
        graphStateHost.mermaidGraphState.scrollTop = diagramContainer.scrollTop;
        // 保存到 localStorage
        saveStateToLocalStorage("diagram-scroll");
        });
    });

    // 辅助函数: 保存状态到 localStorage
    function saveStateToLocalStorage(source = "zoom-or-scroll") {
        scheduleGraphStatePersist(source);
    }

    // Panning logic remains unchanged
    let isDragging = false, lastX, lastY;
    diagramContainer.addEventListener("mousedown", (event) => { /* ... */ });
    container.addEventListener("mousemove", (event) => { /* ... */ });
    const stopDragging = () => { /* ... */ };
    container.addEventListener("mouseup", stopDragging);
    container.addEventListener("mouseleave", stopDragging);

    // Final UI setup
    const helpText = zoomControls.createEl("span", { text: "(提示: Ctrl+滚轮缩放, Alt+拖拽移动)" });
    helpText.style.cssText = "font-size: 0.8em; color: #666; margin-left: 15px;";

    function setZoomLevel(nextZoom, options = {}) {
        const normalized = Math.max(0.1, Number(nextZoom) || CONFIG.initialZoom);
        currentZoom = normalized;
        graphStateHost.mermaidGraphState.zoom = normalized;
        updateZoomVisuals();
        if (options.persist !== false) saveStateToLocalStorage();
    }

    // Expose the visual update function for the main renderDiagram call
    return { updateZoomDisplay: updateZoomVisuals, setZoomLevel };
}




function showToast(message, type = "info") {
  // 移除可能存在的旧提示
  const existingToast = document.getElementById('mermaid-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 创建提示元素
  const toast = document.createElement('div');
  toast.id = 'mermaid-toast';
  toast.textContent = message;
  
  // 样式设置
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background-color: ${type === 'error' ? '#ff3366' : '#333'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  // 添加到DOM
  document.body.appendChild(toast);
  
  // 显示提示
  setTimeout(() => {
    toast.style.opacity = '1';
    
    // 3秒后淡出
    setTimeout(() => {
      toast.style.opacity = '0';
      
      // 完全淡出后移除
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }, 10);
}











/**
 * [最终修正版] 在图表中查找并聚焦指定节点，包含完整的定位和高亮逻辑。
 * @param {string} nodeId - 要聚焦的节点的简化后 DOM ID (例如 'L2', 'M67')。
 * @param {HTMLElement} container - Mermaid 图所在的 .diagram-container 元素。
 */
/**
 * [最终修复版] 在图表中查找并聚焦指定节点
 * - 使用更健壮的多策略属性选择器来查找节点，以应对Mermaid库可能修改ID的情况。
 */
/**
 * [最终修复版] 在图表中查找并聚焦指定节点
 * - 核心修复：使用灵活的属性选择器 [id*="..."] 来查找被Mermaid修改过的节点ID。
 * - 实现了稳定、居中的滚动逻辑。
 * - 包含一个简洁但有效的高亮效果。
 */
/**
 * [终极内容查找版] 在图表中查找并聚焦指定节点
 * - 接收完整的节点对象。
 * - 优先尝试ID查找，如果失败，则遍历所有节点，通过匹配其显示的文本内容（长ID）来查找。
 * - 实现了稳定、居中的滚动和高亮。
 */
/**
 * [最终内容查找版] 在图表中查找并聚焦指定节点
 * - 接收完整的节点对象。
 * - 优先尝试ID查找，如果失败，则遍历所有节点，通过匹配其显示的文本内容（长ID）来查找。
 * - 实现了稳定、居中的滚动和高亮。
 */
/**
 * [容器内居中版] 在图表中查找并聚焦指定节点
 * - 仅在图表容器内计算滚动，避免触发主窗格滚动导致眩晕。
 * - 直接定位到屏幕中心（不使用 scrollIntoView 平滑滚动）。
 */
function ensureMermaidGraphState() {
    if (!graphStateHost.mermaidGraphState) {
        graphStateHost.mermaidGraphState = {
            zoom: CONFIG.initialZoom,
            scrollLeft: 0,
            scrollTop: 0,
            panX: 0,
            panY: 0,
            outerScrollLeft: 0,
            outerScrollTop: 0
        };
    }
    if (graphStateHost.mermaidGraphState.zoom == null) graphStateHost.mermaidGraphState.zoom = CONFIG.initialZoom;
    if (graphStateHost.mermaidGraphState.scrollLeft == null) graphStateHost.mermaidGraphState.scrollLeft = 0;
    if (graphStateHost.mermaidGraphState.scrollTop == null) graphStateHost.mermaidGraphState.scrollTop = 0;
    if (graphStateHost.mermaidGraphState.panX == null) graphStateHost.mermaidGraphState.panX = 0;
    if (graphStateHost.mermaidGraphState.panY == null) graphStateHost.mermaidGraphState.panY = 0;
    if (graphStateHost.mermaidGraphState.outerScrollLeft == null) graphStateHost.mermaidGraphState.outerScrollLeft = 0;
    if (graphStateHost.mermaidGraphState.outerScrollTop == null) graphStateHost.mermaidGraphState.outerScrollTop = 0;
    return graphStateHost.mermaidGraphState;
}

function persistMermaidGraphState(source = "graph-state") {
    scheduleGraphStatePersist(source);
}

function updateTransformedDiagramBounds(container, source = "layout") {
    return measureMermaidInteraction('view.bounds', () => {
    if (!container) return null;
    const svgElement = container.querySelector("svg");
    if (!svgElement) return null;
    const contentElement = svgElement.closest(".mermaid") || svgElement.parentElement;
    if (!contentElement) return null;

    const margin = 160;
    const initialContainerRect = container.getBoundingClientRect();
    const initialSvgRect = svgElement.getBoundingClientRect();
    const initialVisualLeft = initialSvgRect.left - initialContainerRect.left + (container.scrollLeft || 0);
    const initialVisualTop = initialSvgRect.top - initialContainerRect.top + (container.scrollTop || 0);
    const currentPaddingLeft = parseFloat(contentElement.style.paddingLeft || "0") || 0;
    const currentPaddingTop = parseFloat(contentElement.style.paddingTop || "0") || 0;
    let paddingChanged = false;
    if (initialVisualLeft < margin) {
        contentElement.style.paddingLeft = `${Math.ceil(currentPaddingLeft + margin - initialVisualLeft)}px`;
        paddingChanged = true;
    }
    if (initialVisualTop < margin) {
        contentElement.style.paddingTop = `${Math.ceil(currentPaddingTop + margin - initialVisualTop)}px`;
        paddingChanged = true;
    }

    const containerRect = container.getBoundingClientRect();
    const svgRect = svgElement.getBoundingClientRect();
    const visualLeft = svgRect.left - containerRect.left + (container.scrollLeft || 0);
    const visualTop = svgRect.top - containerRect.top + (container.scrollTop || 0);
    const visualRight = svgRect.right - containerRect.left + (container.scrollLeft || 0);
    const visualBottom = svgRect.bottom - containerRect.top + (container.scrollTop || 0);
    const nextWidth = Math.ceil(Math.max(container.clientWidth || 0, container.scrollWidth || 0, visualRight + margin));
    const nextHeight = Math.ceil(Math.max(500, container.clientHeight || 0, container.scrollHeight || 0, visualBottom + margin));
    const previousWidth = parseFloat(contentElement.style.minWidth || "0") || 0;
    const previousHeight = parseFloat(container.style.height || "0") || 0;

    contentElement.style.display = "inline-block";
    contentElement.style.minWidth = `${nextWidth}px`;
    container.style.height = `${nextHeight}px`;

    if (paddingChanged || Math.abs(nextWidth - previousWidth) > 1 || Math.abs(nextHeight - previousHeight) > 1) {
        console.info('[MermaidFloatingWidget][bounds.update]', {
            source,
            minWidth: nextWidth,
            height: nextHeight,
            visualLeft: Math.round(visualLeft),
            visualTop: Math.round(visualTop),
            visualRight: Math.round(visualRight),
            visualBottom: Math.round(visualBottom),
            paddingLeft: Math.round(parseFloat(contentElement.style.paddingLeft || "0") || 0),
            paddingTop: Math.round(parseFloat(contentElement.style.paddingTop || "0") || 0),
            scrollWidth: Math.round(container.scrollWidth || 0),
            clientWidth: Math.round(container.clientWidth || 0),
            panX: Math.round(graphStateHost.mermaidGraphState?.panX || 0),
            panY: Math.round(graphStateHost.mermaidGraphState?.panY || 0),
            zoom: graphStateHost.mermaidGraphState?.zoom || CONFIG.initialZoom
        });
    }

    scheduleSubgraphReadableLabelOverlayRefresh(container, `bounds:${source}`);
    return { minWidth: nextWidth, height: nextHeight, visualLeft, visualTop, visualRight, visualBottom };
    });
}

function centerElementInDiagram(nodeElement, container, options = {}) {
    if (!nodeElement || !container) return { centered: false, reason: "missing-target" };
    const behavior = options.behavior || "auto";
    const outerContainer = container.closest('.mermaid-content');
    const tolerance = Number(options.tolerance || 2);
    const state = ensureMermaidGraphState();
    const shouldPersist = options.persist !== false && options.noPersist !== true;
    const diagnosticLabel = options.label || 'center';
    const lockedZoom = Number(options.lockZoom);
    if (Number.isFinite(lockedZoom) && lockedZoom > 0) {
        state.zoom = lockedZoom;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const getAxisDelta = () => {
        const nodeRect = nodeElement.getBoundingClientRect();
        const xViewportRect = container.getBoundingClientRect();
        const yViewportRect = outerContainer ? outerContainer.getBoundingClientRect() : xViewportRect;
        return {
            x: (nodeRect.left + nodeRect.width / 2) - (xViewportRect.left + xViewportRect.width / 2),
            y: (nodeRect.top + nodeRect.height / 2) - (yViewportRect.top + yViewportRect.height / 2),
            nodeRect,
            xViewportRect,
            yViewportRect
        };
    };
    const scrollByDelta = (scrollEl, delta, axes = { x: true, y: true }) => {
        if (!scrollEl) return { movedX: 0, movedY: 0 };
        const maxLeft = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
        const maxTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
        const oldLeft = scrollEl.scrollLeft;
        const oldTop = scrollEl.scrollTop;
        const nextLeft = axes.x && maxLeft > 1 ? clamp(oldLeft + delta.x, 0, maxLeft) : oldLeft;
        const nextTop = axes.y && maxTop > 1 ? clamp(oldTop + delta.y, 0, maxTop) : oldTop;
        if (typeof scrollEl.scrollTo === "function") {
            scrollEl.scrollTo({ left: nextLeft, top: nextTop, behavior });
        } else {
            scrollEl.scrollLeft = nextLeft;
            scrollEl.scrollTop = nextTop;
        }
        return { movedX: nextLeft - oldLeft, movedY: nextTop - oldTop };
    };

    const firstDelta = getAxisDelta();
    const containerMove = scrollByDelta(container, firstDelta, { x: true, y: !outerContainer });

    let secondDelta = getAxisDelta();
    let outerMove = { movedX: 0, movedY: 0 };
    if (outerContainer && (Math.abs(secondDelta.x) > tolerance || Math.abs(secondDelta.y) > tolerance)) {
        outerMove = scrollByDelta(outerContainer, secondDelta, { x: true, y: true });
        secondDelta = getAxisDelta();
    }

    if (Math.abs(secondDelta.x) > tolerance || Math.abs(secondDelta.y) > tolerance) {
        const svgElement = container.querySelector("svg");
        if (svgElement) {
            state.panX = (state.panX || 0) - secondDelta.x;
            state.panY = (state.panY || 0) - secondDelta.y;
            const zoom = Number.isFinite(lockedZoom) && lockedZoom > 0 ? lockedZoom : (state.zoom || CONFIG.initialZoom);
            state.zoom = zoom;
            svgElement.style.transformOrigin = "top left";
            svgElement.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${zoom})`;
            updateTransformedDiagramBounds(container, "center-pan");
        }
    }
    if (Number.isFinite(lockedZoom) && lockedZoom > 0) {
        state.zoom = lockedZoom;
    }

    state.scrollLeft = container.scrollLeft || 0;
    state.scrollTop = container.scrollTop || 0;
    state.outerScrollLeft = outerContainer ? outerContainer.scrollLeft || 0 : 0;
    state.outerScrollTop = outerContainer ? outerContainer.scrollTop || 0 : 0;
    if (shouldPersist) persistMermaidGraphState();

    const finalDelta = getAxisDelta();
    const diagnostic = {
        centered: Math.abs(finalDelta.x) <= tolerance && Math.abs(finalDelta.y) <= tolerance,
        deltaX: Math.round(finalDelta.x),
        deltaY: Math.round(finalDelta.y),
        containerMove,
        outerMove,
        panX: Math.round(state.panX || 0),
        panY: Math.round(state.panY || 0),
        zoom: state.zoom || CONFIG.initialZoom,
        persisted: shouldPersist,
        lockedZoom: Number.isFinite(lockedZoom) && lockedZoom > 0 ? lockedZoom : null,
        containerScroll: {
            left: Math.round(container.scrollLeft || 0),
            top: Math.round(container.scrollTop || 0),
            width: Math.round(container.scrollWidth || 0),
            height: Math.round(container.scrollHeight || 0),
            clientWidth: Math.round(container.clientWidth || 0),
            clientHeight: Math.round(container.clientHeight || 0)
        },
        outerScroll: outerContainer ? {
            left: Math.round(outerContainer.scrollLeft || 0),
            top: Math.round(outerContainer.scrollTop || 0),
            width: Math.round(outerContainer.scrollWidth || 0),
            height: Math.round(outerContainer.scrollHeight || 0),
            clientWidth: Math.round(outerContainer.clientWidth || 0),
            clientHeight: Math.round(outerContainer.clientHeight || 0)
        } : null,
        firstDelta: { x: Math.round(firstDelta.x), y: Math.round(firstDelta.y) },
        secondDelta: { x: Math.round(secondDelta.x), y: Math.round(secondDelta.y) },
        finalNodeRect: {
            left: Math.round(finalDelta.nodeRect.left),
            top: Math.round(finalDelta.nodeRect.top),
            width: Math.round(finalDelta.nodeRect.width),
            height: Math.round(finalDelta.nodeRect.height)
        },
        finalViewportRect: {
            left: Math.round(finalDelta.xViewportRect.left),
            top: Math.round(finalDelta.yViewportRect.top),
            width: Math.round(finalDelta.xViewportRect.width),
            height: Math.round(finalDelta.yViewportRect.height)
        },
        axisViewportRect: {
            x: {
                left: Math.round(finalDelta.xViewportRect.left),
                top: Math.round(finalDelta.xViewportRect.top),
                width: Math.round(finalDelta.xViewportRect.width),
                height: Math.round(finalDelta.xViewportRect.height)
            },
            y: {
                left: Math.round(finalDelta.yViewportRect.left),
                top: Math.round(finalDelta.yViewportRect.top),
                width: Math.round(finalDelta.yViewportRect.width),
                height: Math.round(finalDelta.yViewportRect.height)
            }
        }
    };
    console.info('[MermaidFloatingWidget][center.position]', { label: diagnosticLabel, ...diagnostic });
    return diagnostic;
}

function forceCenterElementInDiagram(nodeElement, container, options = {}) {
    if (!nodeElement || !container) return { centered: false, reason: "missing-target" };
    const outerContainer = container.closest('.mermaid-content');
    const tolerance = Number(options.tolerance || 2);
    const state = ensureMermaidGraphState();
    const shouldPersist = options.persist !== false && options.noPersist !== true;
    const diagnosticLabel = options.label || 'force-center';
    const lockedZoom = Number(options.lockZoom);
    if (Number.isFinite(lockedZoom) && lockedZoom > 0) {
        state.zoom = lockedZoom;
    }

    const svgElement = container.querySelector("svg");
    const contentElement = svgElement ? (svgElement.closest(".mermaid") || svgElement.parentElement) : null;
    const margin = 160;
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const readNumericStyle = (element, property) => parseFloat(element?.style?.[property] || "0") || 0;
    const setScrollPosition = (scrollEl, left, top) => {
        if (!scrollEl) return;
        if (typeof scrollEl.scrollTo === "function") {
            scrollEl.scrollTo({ left, top, behavior: "auto" });
        } else {
            scrollEl.scrollLeft = left;
            scrollEl.scrollTop = top;
        }
    };
    const getAxisDelta = () => {
        const nodeRect = nodeElement.getBoundingClientRect();
        const xViewportRect = container.getBoundingClientRect();
        const yViewportRect = outerContainer ? outerContainer.getBoundingClientRect() : xViewportRect;
        return {
            x: (nodeRect.left + nodeRect.width / 2) - (xViewportRect.left + xViewportRect.width / 2),
            y: (nodeRect.top + nodeRect.height / 2) - (yViewportRect.top + yViewportRect.height / 2),
            nodeRect,
            xViewportRect,
            yViewportRect
        };
    };
    const ensureRoomForDelta = (delta, pass) => {
        if (!contentElement) return { changed: false, pass };
        let changed = false;
        const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const desiredLeft = (container.scrollLeft || 0) + delta.x;
        if (desiredLeft < 0) {
            const currentPaddingLeft = readNumericStyle(contentElement, "paddingLeft");
            contentElement.style.paddingLeft = `${Math.ceil(currentPaddingLeft - desiredLeft + margin)}px`;
            changed = true;
        } else if (desiredLeft > maxLeft) {
            const currentMinWidth = readNumericStyle(contentElement, "minWidth") || container.scrollWidth || container.clientWidth || 0;
            contentElement.style.minWidth = `${Math.ceil(currentMinWidth + desiredLeft - maxLeft + margin)}px`;
            changed = true;
        }

        const yScrollEl = outerContainer || container;
        const maxTop = Math.max(0, yScrollEl.scrollHeight - yScrollEl.clientHeight);
        const desiredTop = (yScrollEl.scrollTop || 0) + delta.y;
        if (desiredTop < 0) {
            const currentPaddingTop = readNumericStyle(contentElement, "paddingTop");
            contentElement.style.paddingTop = `${Math.ceil(currentPaddingTop - desiredTop + margin)}px`;
            changed = true;
        } else if (desiredTop > maxTop) {
            const currentHeight = Math.max(
                readNumericStyle(container, "height"),
                container.scrollHeight || 0,
                container.clientHeight || 0
            );
            container.style.height = `${Math.ceil(currentHeight + desiredTop - maxTop + margin)}px`;
            changed = true;
        }

        if (changed) {
            updateTransformedDiagramBounds(container, `center-force-room-${pass}`);
        }
        return { changed, pass };
    };
    const scrollByDelta = (delta) => {
        const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const nextLeft = clamp((container.scrollLeft || 0) + delta.x, 0, maxLeft);
        setScrollPosition(container, nextLeft, container.scrollTop || 0);

        const yScrollEl = outerContainer || container;
        const maxTop = Math.max(0, yScrollEl.scrollHeight - yScrollEl.clientHeight);
        const nextTop = clamp((yScrollEl.scrollTop || 0) + delta.y, 0, maxTop);
        setScrollPosition(yScrollEl, yScrollEl.scrollLeft || 0, nextTop);
        return { left: nextLeft, top: nextTop };
    };

    updateTransformedDiagramBounds(container, "center-force-before");
    const before = getAxisDelta();
    const roomPasses = [];
    for (let pass = 1; pass <= 3; pass += 1) {
        const delta = getAxisDelta();
        roomPasses.push(ensureRoomForDelta(delta, pass));
        scrollByDelta(getAxisDelta());
        const remaining = getAxisDelta();
        if (Math.abs(remaining.x) <= tolerance && Math.abs(remaining.y) <= tolerance) break;
    }
    if (Number.isFinite(lockedZoom) && lockedZoom > 0) {
        state.zoom = lockedZoom;
    }
    state.scrollLeft = container.scrollLeft || 0;
    state.scrollTop = container.scrollTop || 0;
    state.outerScrollLeft = outerContainer ? outerContainer.scrollLeft || 0 : 0;
    state.outerScrollTop = outerContainer ? outerContainer.scrollTop || 0 : 0;
    if (shouldPersist) persistMermaidGraphState();

    const finalDelta = getAxisDelta();
    const diagnostic = {
        centered: Math.abs(finalDelta.x) <= tolerance && Math.abs(finalDelta.y) <= tolerance,
        deltaX: Math.round(finalDelta.x),
        deltaY: Math.round(finalDelta.y),
        beforeDelta: { x: Math.round(before.x), y: Math.round(before.y) },
        roomPasses,
        panX: Math.round(state.panX || 0),
        panY: Math.round(state.panY || 0),
        zoom: state.zoom || CONFIG.initialZoom,
        persisted: shouldPersist,
        lockedZoom: Number.isFinite(lockedZoom) && lockedZoom > 0 ? lockedZoom : null,
        containerScroll: {
            left: Math.round(container.scrollLeft || 0),
            top: Math.round(container.scrollTop || 0),
            width: Math.round(container.scrollWidth || 0),
            height: Math.round(container.scrollHeight || 0),
            clientWidth: Math.round(container.clientWidth || 0),
            clientHeight: Math.round(container.clientHeight || 0)
        },
        outerScroll: outerContainer ? {
            left: Math.round(outerContainer.scrollLeft || 0),
            top: Math.round(outerContainer.scrollTop || 0),
            width: Math.round(outerContainer.scrollWidth || 0),
            height: Math.round(outerContainer.scrollHeight || 0),
            clientWidth: Math.round(outerContainer.clientWidth || 0),
            clientHeight: Math.round(outerContainer.clientHeight || 0)
        } : null,
        finalNodeRect: {
            left: Math.round(finalDelta.nodeRect.left),
            top: Math.round(finalDelta.nodeRect.top),
            width: Math.round(finalDelta.nodeRect.width),
            height: Math.round(finalDelta.nodeRect.height)
        },
        finalViewportRect: {
            left: Math.round(finalDelta.xViewportRect.left),
            top: Math.round(finalDelta.yViewportRect.top),
            width: Math.round(finalDelta.xViewportRect.width),
            height: Math.round(finalDelta.yViewportRect.height)
        }
    };
    console.info('[MermaidFloatingWidget][center.force]', { label: diagnosticLabel, ...diagnostic });
    return diagnostic;
}

function focusNodeInChart(nodeObject, container) {
    try {
        const nodeElement = findRenderedNodeElement(nodeObject, container);
        if (!nodeElement) return;
        centerElementInDiagram(nodeElement, container, { behavior: "auto", label: nodeObject.id });
        highlightNodeOnce(nodeObject, container, 3000);
    } catch (error) {
        console.error('???????:', error);
    }
}

function highlightNodeOnce(nodeObject, container, durationMs = 5000) {
    if (!nodeObject || !container) return;
    try {
        const nodeElement = findRenderedNodeElement(nodeObject, container);
        if (!nodeElement) return;

        const shape = nodeElement.querySelector('rect:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), circle:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), polygon:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), ellipse:not(.mermaid-reference-halo):not(.mermaid-active-node-halo), path:not(.mermaid-reference-halo):not(.mermaid-active-node-halo)');
        if (!shape) return;

        const original = {
            fill: shape.style.fill,
            filter: shape.style.filter,
            transition: shape.style.transition
        };

        shape.style.transition = 'all 0.2s ease-in-out';
        shape.style.fill = '#FFF4B8';

        setTimeout(() => {
            shape.style.fill = original.fill;
            shape.style.filter = original.filter;
            shape.style.transition = original.transition;
        }, durationMs);
    } catch (error) {
        console.error('高亮节点时出错:', error);
    }
}

function centerNodeInChart(nodeObject, container, options = {}) {
    if (!nodeObject || !container) return null;
    try {
        const nodeElement = findRenderedNodeElement(nodeObject, container);
        if (!nodeElement) return null;

        return centerElementInDiagram(nodeElement, container, { behavior: "auto", label: nodeObject.id, ...options });
    } catch (error) {
        console.error('居中节点时出错:', error);
        return null;
    }
}

function centerNodeInChartPrecisely(nodeObject, container, afterCenter, options = {}) {
    if (!nodeObject || !container) {
        if (typeof afterCenter === "function") afterCenter(null);
        return;
    }
    console.info('[MermaidFloatingWidget][center.precise.start]', {
        nodeId: nodeObject.id,
        simpleId: nodeObject.simpleId,
        containerScroll: {
            left: container.scrollLeft || 0,
            top: container.scrollTop || 0,
            width: container.scrollWidth || 0,
            height: container.scrollHeight || 0,
            clientWidth: container.clientWidth || 0,
            clientHeight: container.clientHeight || 0
        },
        state: graphStateHost.mermaidGraphState || null
    });
    const first = centerNodeInChart(nodeObject, container, options);
    requestAnimationFrame(() => {
        const second = centerNodeInChart(nodeObject, container, options);
        requestAnimationFrame(() => {
            const third = centerNodeInChart(nodeObject, container, options);
            requestAnimationFrame(() => {
                const nodeElement = findRenderedNodeElement(nodeObject, container);
                const fourth = nodeElement ? forceCenterElementInDiagram(nodeElement, container, { label: nodeObject.id, ...options }) : null;
                console.info('[MermaidFloatingWidget][center.precise]', {
                    nodeId: nodeObject.id,
                    first,
                    second,
                    third,
                    fourth
                });
                if (typeof afterCenter === "function") afterCenter(fourth || third || second || first);
            });
        });
    });
}

function cloneMermaidGraphStateSnapshot(state = graphStateHost.mermaidGraphState) {
    return JSON.parse(JSON.stringify(state || {}));
}

function applyMermaidGraphStateSnapshot(container, snapshot = {}, source = "state-restore") {
    if (!container) return null;
    const state = ensureMermaidGraphState();
    const restored = {
        ...state,
        ...snapshot,
        zoom: Math.max(0.1, Number(snapshot.zoom) || Number(state.zoom) || CONFIG.initialZoom),
        panX: Number(snapshot.panX) || 0,
        panY: Number(snapshot.panY) || 0,
        scrollLeft: Number(snapshot.scrollLeft) || 0,
        scrollTop: Number(snapshot.scrollTop) || 0,
        outerScrollLeft: Number(snapshot.outerScrollLeft) || 0,
        outerScrollTop: Number(snapshot.outerScrollTop) || 0
    };
    graphStateHost.mermaidGraphState = restored;
    const svgElement = container.querySelector("svg");
    if (svgElement) {
        svgElement.style.transformOrigin = "top left";
        svgElement.style.transform = `translate(${restored.panX}px, ${restored.panY}px) scale(${restored.zoom})`;
    }
    updateTransformedDiagramBounds(container, source);
    container.scrollLeft = restored.scrollLeft;
    container.scrollTop = restored.scrollTop;
    const outerContainer = container.closest('.mermaid-content');
    if (outerContainer) {
        outerContainer.scrollLeft = restored.outerScrollLeft;
        outerContainer.scrollTop = restored.outerScrollTop;
    }
    return restored;
}

function measureNodeCenterDelta(nodeElement, container) {
    if (!nodeElement || !container) return null;
    const outerContainer = container.closest('.mermaid-content');
    const nodeRect = nodeElement.getBoundingClientRect();
    const xViewportRect = container.getBoundingClientRect();
    const yViewportRect = outerContainer ? outerContainer.getBoundingClientRect() : xViewportRect;
    return {
        x: (nodeRect.left + nodeRect.width / 2) - (xViewportRect.left + xViewportRect.width / 2),
        y: (nodeRect.top + nodeRect.height / 2) - (yViewportRect.top + yViewportRect.height / 2),
        nodeRect,
        xViewportRect,
        yViewportRect
    };
}

function centerNodeInChartTwoPhase(nodeObject, container, afterCenter, options = {}) {
    if (!nodeObject || !container) {
        if (typeof afterCenter === "function") afterCenter(null);
        return;
    }
    const restoredState = cloneMermaidGraphStateSnapshot(options.restoredState || graphStateHost.mermaidGraphState || {});
    restoredState.zoom = Math.max(0.1, Number(options.restoredZoom || restoredState.zoom) || CONFIG.initialZoom);
    const transientStartState = cloneMermaidGraphStateSnapshot(graphStateHost.mermaidGraphState || restoredState);
    const transientOptions = { ...options, lockZoom: undefined, persist: false, noPersist: true };
    const first = centerNodeInChart(nodeObject, container, transientOptions);
    requestAnimationFrame(() => {
        const second = centerNodeInChart(nodeObject, container, transientOptions);
        requestAnimationFrame(() => {
            const third = centerNodeInChart(nodeObject, container, transientOptions);
            const phaseANodeElement = findRenderedNodeElement(nodeObject, container);
            const phaseADelta = phaseANodeElement ? measureNodeCenterDelta(phaseANodeElement, container) : null;
            applyMermaidGraphStateSnapshot(container, restoredState, "center-two-phase-restore");
            requestAnimationFrame(() => {
                const nodeElement = findRenderedNodeElement(nodeObject, container);
                const beforeFinal = nodeElement ? measureNodeCenterDelta(nodeElement, container) : null;
                const finalPass = nodeElement ? forceCenterElementInDiagram(nodeElement, container, {
                    label: nodeObject.id,
                    lockZoom: restoredState.zoom,
                    persist: false,
                    noPersist: true
                }) : null;
                const afterFinal = nodeElement ? measureNodeCenterDelta(nodeElement, container) : null;
                console.info('[MermaidFloatingWidget][center.two-phase]', {
                    nodeId: nodeObject.id,
                    phaseAFound: !!phaseANodeElement,
                    phaseA: { first, second, third },
                    phaseADelta: phaseADelta ? { x: Math.round(phaseADelta.x), y: Math.round(phaseADelta.y) } : null,
                    restoredZoom: restoredState.zoom,
                    transientZoom: transientStartState.zoom || null,
                    phaseBDeltaBefore: beforeFinal ? { x: Math.round(beforeFinal.x), y: Math.round(beforeFinal.y) } : null,
                    phaseBDeltaAfter: afterFinal ? { x: Math.round(afterFinal.x), y: Math.round(afterFinal.y) } : null,
                    fallbackUsed: !!finalPass && finalPass.centered !== true,
                    finalPass
                });
                if (typeof afterCenter === "function") afterCenter(finalPass || third || second || first);
            });
        });
    });
}







/**
 * 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 */
/**
 * [已修正] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 */
/**
 * [最终修正版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 */
/**
 * [最终修正版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 修正了ID提取逻辑，改用更可靠的 data-path 属性。
 * - 增强了日志输出，方便追踪。
 */
/**
 * [最终决定版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 *  - 修正了ID提取逻辑，确保从 data-path 中获取完整的长ID。
 *  - 实现了正确的“翻译”步骤，使用全局译码本将长ID转换为简化ID。
 *  - 增加了详细的日志，便于追踪每一步的执行情况。
 */
/**
 * [最终修正版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 修正了容器和行项目的选择器逻辑，使其更加健壮。
 * - 增强了日志输出，方便追踪。
 * - 确保从 data-path 属性中可靠地提取ID。
 */
/**
 * [最终调试版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 增加了极其详细的日志，用于追踪ID提取和翻译的全过程。
 */
/**
 * [已修正] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 */
/**
 * [已修正] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 */
/**
 * [最终修正版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 修正了ID提取逻辑，改用更可靠的 data-path 属性。
 * - 增强了日志输出，方便追踪。
 */
/**
 * [最终优化版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 基于您的可用版本进行修改。
 * - 引入了更可靠的“窗格”和“行项目”定位逻辑。
 * - 保留并增强了您版本中已有的日志和高亮功能。
 */
/**
 * [终极调试版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 在每一个关键步骤都添加了详细的日志输出。
 */
/**
 * [终极表格版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 核心逻辑已修改为专门查找表格行 <tr>，不再使用 data-path。
 * - ID 提取逻辑同步修改为从行内的链接 <a> 文本中获取。
 * - 保留了所有详细的调试日志。
 */
/**
 * [最终智能版] 查找右侧列表的中心节点，并在 Mermaid 视图中居中显示。
 * - 无需修改笔记，无需添加 cssclasses。
 * - 智能地查找另一个“可见的”窗格作为列表目标，避免选中隐藏的标签页。
 */
/**
 * [最终精确制导版] 查找指定笔记视图的中心节点，并在 Mermaid 视图中居中。
 * - 通过硬编码的文件路径直接定位列表窗格，不再进行任何自动检测。
 * - 这是最稳定、最可靠的实现方式。
 */
/**
 * [最终精确制导版] 查找指定笔记视图的中心节点，并在 Mermaid 视图中居中。
 * - 通过硬编码的文件路径直接定位列表窗格。
 * - 查找逻辑基于 <tr>，并从 <a> 标签中提取ID。
 * - 调用聚焦函数时传递完整的节点对象，以支持内容查找。
 */
/**
 * [最终智能关联版] 查找并聚焦节点
 * - 核心修正：在通过文件路径找到列表窗格后，再去寻找一个“可见的、非列表的”图表窗格，确保两者正确配对。
 */
function findCenterNoteAndFocus() {
    console.log('[调试] findCenterNoteAndFocus 函数被调用');
    try {
        // ==================== 配置区 ====================
        // 请确保这个路径与您的列表笔记在保险库中的完整路径完全一致！
        const TARGET_LIST_FILE_PATH = '项目/18-战略视图迭代/18E-GTD夹子/18E1-下一步代办事项清单文件夹/下一步代办的liner chain/ATOM视图啦.md';
        // ==============================================

        // --- 精准定位列表窗格 ---
        let listLeaf = null;
        app.workspace.getLeavesOfType('markdown').forEach(leaf => {
            if (leaf.view.file && leaf.view.file.path === TARGET_LIST_FILE_PATH) {
                listLeaf = leaf;
            }
        });

        if (!listLeaf) {
            showToast("错误: 目标列表笔记未打开或路径不匹配", "error");
            console.error(`[调试失败] 未能找到正在显示 "${TARGET_LIST_FILE_PATH}" 的窗格。`);
            return;
        }
        console.log('[调试成功] 1. 精准定位了列表窗格。');

        // --- 核心修正：智能查找与列表配对的“可见”图表窗格 ---
        let diagramContainer = null;
        const allLeaves = Array.from(document.querySelectorAll('.workspace-leaf'));
        for (const leaf of allLeaves) {
            const container = leaf.querySelector('.diagram-container');
            const isVisible = leaf.offsetParent !== null;
            // 关键：检查 leaf.containerEl 是否与我们找到的列表窗格的容器元素相同
            const isNotListLeaf = leaf !== listLeaf.containerEl;

            if (container && isVisible && isNotListLeaf) {
                diagramContainer = container;
                break; 
            }
        }

        if (!diagramContainer) {
            showToast("错误: 未能找到一个可见的图表窗格与列表配对", "error");
            console.error('[调试失败] A. 请确保图表和列表在不同的、且都可见的窗格中。');
            return;
        }
        console.log('[调试成功] A. 智能关联到了可见的图表容器。');
        
        // --- 后续所有逻辑现在都在100%正确的容器内执行 ---
        const listContainer = listLeaf.containerEl.querySelector('.view-content') || listLeaf.containerEl;
        const allRows = Array.from(listContainer.querySelectorAll('tr'));
        
        if (allRows.length === 0) {
            showToast("错误: 在列表窗格中未找到任何表格行(tr)", "error");
            return;
        }
        console.log(`[调试成功] 2. 在目标窗格中找到了 ${allRows.length} 个 <tr> 元素。`);
        
        const containerRect = listContainer.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;
        let closestRow = null; 
        let minDistance = Infinity;
        for (const row of allRows) {
            const rowRect = row.getBoundingClientRect();
            if (rowRect.height === 0) continue;
            const rowCenter = rowRect.top + rowRect.height / 2;
            const distance = Math.abs(rowCenter - containerCenter);
            if (distance < minDistance) { 
                minDistance = distance; 
                closestRow = row; 
            }
        }

        if (!closestRow) {
            showToast("错误: 无法确定列表中的中心行", "error");
            return;
        }
        console.log('[调试成功] 3. 找到了中心行。');

        let fullNodeId = null;
        const linkElement = closestRow.querySelector('a');
        if (linkElement) {
            const idMatch = (linkElement.textContent || "").match(/ATOM@[A-Z0-9\.\+]+/);
            if (idMatch) {
                fullNodeId = idMatch[0];
            }
        }

        if (!fullNodeId) {
            showToast("错误: 无法从中心行的链接中提取ID", "error");
            return;
        }
        console.log("[调试成功] 4. 提取的长ID是:", fullNodeId);

        let nodeToFocus = null;
        for (const nodeObject of Object.values(graphStateHost.stateTransitionNodeIdMap)) {
            if (nodeObject.id === fullNodeId) { 
                nodeToFocus = nodeObject; 
                break; 
            }
        }

        if (!nodeToFocus) {
            showToast(`错误: 在映射表中找不到节点对象: ${fullNodeId}`, "error");
            return;
        }
        console.log("[调试成功] 5. 找到了完整的节点对象。");

        showToast(`正在聚焦: ${nodeToFocus.simpleId}`);
        focusNodeInChart(nodeToFocus, diagramContainer);

    } catch (error) {
        console.error("[findCenterNoteAndFocus] 捕获到未知错误:", error);
        showToast(`发生致命错误，请检查控制台。`);
    }
}















/**
 * 设置全局键盘快捷键。
 */
/**
 * 设置全局键盘快捷键（快捷键已改为 'V'）
 */
function setupGlobalKeyboardShortcuts() {
  // 防止重复添加监听器
  if (window.globalMermaidKeyListenerAdded && window.globalMermaidKeyHandler) {
    return () => {
      document.removeEventListener('keydown', window.globalMermaidKeyHandler);
      window.globalMermaidKeyListenerAdded = false;
      window.globalMermaidKeyHandler = null;
    };
  }
  if (window.globalMermaidKeyListenerAdded && !window.globalMermaidKeyHandler) {
    window.globalMermaidKeyListenerAdded = false;
  }

  const handleKeyDown = (event) => {
    // 当按下 'v' 或 'V' 键时触发
    if (event.key.toLowerCase() === 'v') {
      // 确保事件不是在输入框、文本域或可编辑元素中触发的
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        return;
      }
      
      // 阻止默认行为（例如在页面上输入'v'）
      event.preventDefault();
      
      // 调用核心的聚焦函数
      findCenterNoteAndFocus();
    }
  };

  // 将监听器绑定到 document 上
  document.addEventListener('keydown', handleKeyDown);
  
  // 设置一个全局标志，表示快捷键已成功设置
  window.globalMermaidKeyListenerAdded = true;
  window.globalMermaidKeyHandler = handleKeyDown;
  
  console.log("全局快捷键 'V' 已成功激活。");

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    window.globalMermaidKeyListenerAdded = false;
    window.globalMermaidKeyHandler = null;
  };
}











function stableJsonStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(item => stableJsonStringify(item)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`).join(",")}}`;
}

function simpleHash(text) {
  let hash = 2166136261;
  const input = String(text || "");
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const BODY_REFERENCE_STYLE_CACHE_VERSION = 2;
const SUBGRAPH_READABLE_LABEL_ANCHOR_VERSION = 2;

function serializeReferenceGroupsForCache(referenceGroups) {
  return {
    styleVersion: BODY_REFERENCE_STYLE_CACHE_VERSION,
    edgeCount: referenceGroups?.edgeCount || 0,
    components: (referenceGroups?.components || []).map(component => ({
      groupId: component.groupId,
      color: component.color,
      edgeCount: component.edgeCount || 0,
      nodes: Array.isArray(component.nodes) ? component.nodes.slice().sort() : []
    }))
  };
}

function getMermaidRenderConfigForCache() {
  return {
    schemaVersion: 1,
    layoutExitVersion: 2,
    layout: CONFIG.layout,
    maxDepth: CONFIG.maxDepth,
    showAllDescendants: CONFIG.showAllDescendants,
    addInvisibleNodes: CONFIG.addInvisibleNodes,
    showFullIds: CONFIG.showFullIds,
    theme: "default",
    securityLevel: "loose",
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis"
    },
    svgGeometry: "fixed-viewbox-v1",
    labelWrapVersion: "complete-smart-wrap-v1",
    mermaidVersion: window.mermaid?.version || window.mermaid?.mermaidAPI?.version || "unknown"
  };
}

function buildMermaidRenderCacheKey(targetPrefix, mermaidCode, effectiveFoldedPrefixes, referenceGroups) {
  const payload = {
    targetPrefix,
    mermaidCode,
    mermaidCodeHash: simpleHash(mermaidCode),
    effectiveFoldedPrefixes: (effectiveFoldedPrefixes || []).slice().sort(),
    referenceGroups: serializeReferenceGroupsForCache(referenceGroups),
    renderConfig: getMermaidRenderConfigForCache()
  };
  const hash = simpleHash(stableJsonStringify(payload));
  return {
    key: `${targetPrefix || "unknown"}::${hash}`,
    hash,
    mermaidCodeHash: payload.mermaidCodeHash,
    payload
  };
}

const pendingRenderRefreshTimers = new Map();

function scheduleStaleRenderRefresh(options = {}) {
  const {
    targetPrefix,
    mermaidCode,
    renderCacheInfo,
    renderGraph,
    bodyReferenceGroups,
    effectiveFoldedPrefixes,
    generation
  } = options;
  if (!targetPrefix || !mermaidCode || !renderCacheInfo?.key || !__pluginApi) return;
  if (typeof __pluginApi.getRenderCache === "function") {
    const exact = __pluginApi.getRenderCache({ key: renderCacheInfo.key, targetPrefix, allowStaleStable: false });
    if (exact?.svgOuterHTML) {
      console.info('[MermaidFloatingWidget][render-cache.stale-refresh.skip]', {
        targetPrefix,
        keyHash: renderCacheInfo.hash,
        reason: 'exact-cache-already-fresh'
      });
      return;
    }
  }
  if (pendingRenderRefreshTimers.has(renderCacheInfo.key)) {
    console.info('[MermaidFloatingWidget][render-cache.stale-refresh.skip]', {
      targetPrefix,
      keyHash: renderCacheInfo.hash,
      reason: 'already-queued'
    });
    return;
  }

  const delayMs = 5000;
  const runRefresh = async () => {
    pendingRenderRefreshTimers.delete(renderCacheInfo.key);
    if (!window.mermaid || !__pluginApi || typeof __pluginApi.putRenderCache !== "function") return;
    if (typeof __pluginApi.markRenderCachePending === "function") {
      const accepted = __pluginApi.markRenderCachePending(targetPrefix, {
        key: renderCacheInfo.key,
        hash: renderCacheInfo.hash,
        mermaidCodeHash: renderCacheInfo.mermaidCodeHash,
        generation
      });
      if (!accepted) {
        console.info('[MermaidFloatingWidget][render-cache.stale-refresh.skip]', {
          targetPrefix,
          keyHash: renderCacheInfo.hash,
          generation,
          reason: 'pending-generation-rejected'
        });
        return;
      }
    }
    console.info('[MermaidFloatingWidget][render-cache.stale-refresh.start]', {
      targetPrefix,
      keyHash: renderCacheInfo.hash,
      generation,
      nodeCount: renderGraph?.nodes?.length || 0,
      codeChars: mermaidCode.length
    });

    const hiddenRoot = document.createElement("div");
    hiddenRoot.style.cssText = "position:absolute;left:-100000px;top:-100000px;width:1200px;height:800px;overflow:hidden;visibility:hidden;pointer-events:none;";
    hiddenRoot.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
    document.body.appendChild(hiddenRoot);
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis"
        }
      });
      await window.mermaid.init(undefined, hiddenRoot.querySelector(".mermaid"));
      const referenceStyleSummary = applyBodyReferenceGroupStyling(hiddenRoot, renderGraph.nodes, bodyReferenceGroups);
      const svgElement = hiddenRoot.querySelector("svg");
      if (!svgElement) return;
      normalizeRenderedSvgGeometry(hiddenRoot, "stale-refresh", { targetPrefix, keyHash: renderCacheInfo.hash });
      const subgraphReadableLabelAnchors = CONFIG.enableSubgraphReadableLabels !== false
        ? collectSubgraphReadableLabelAnchors(hiddenRoot, renderGraph, "stale-refresh")
        : null;
      __pluginApi.putRenderCache(renderCacheInfo.key, {
        targetPrefix,
        hash: renderCacheInfo.hash,
        mermaidCodeHash: renderCacheInfo.mermaidCodeHash,
        mermaidCode,
        svgOuterHTML: svgElement.outerHTML,
        normalizeVersion: 1,
        referenceStyleSummary,
        nodeCount: renderGraph.nodes.length,
        subgraphCount: renderGraph.subgraphs.length,
        codeChars: mermaidCode.length,
        config: renderCacheInfo.payload.renderConfig,
        effectiveFoldedPrefixes: (effectiveFoldedPrefixes || []).slice().sort(),
        nodeIds: renderGraph.nodes.map(node => node.id),
        subgraphReadableLabelAnchors: subgraphReadableLabelAnchors || undefined
      }, { expectedGeneration: generation, source: "stale-refresh" });
      console.info('[MermaidFloatingWidget][render-cache.stale-refresh.put]', {
        targetPrefix,
        keyHash: renderCacheInfo.hash,
        generation,
        nodeCount: renderGraph.nodes.length
      });
    } catch (error) {
      console.warn('[MermaidFloatingWidget][render-cache.stale-refresh.fail]', {
        targetPrefix,
        keyHash: renderCacheInfo.hash,
        generation,
        error
      });
    } finally {
      hiddenRoot.remove();
    }
  };

  const timer = window.setTimeout(() => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(runRefresh, { timeout: 3000 });
    } else {
      runRefresh();
    }
  }, delayMs);
  pendingRenderRefreshTimers.set(renderCacheInfo.key, timer);
  console.info('[MermaidFloatingWidget][render-cache.stale-refresh.queue]', {
    targetPrefix,
    keyHash: renderCacheInfo.hash,
    generation,
    delayMs
  });
}

function bindRenderedNodeClickHandlers(diagramContainer, graphNodes, clickCallback) {
  if (!diagramContainer || typeof clickCallback !== "function") return 0;
  const lookup = buildRenderedNodeLookup(diagramContainer);
  let boundCount = 0;
  (graphNodes || []).forEach(nodeObject => {
    if (!nodeObject?.fileName) return;
    const nodeElement = findRenderedNodeElement(nodeObject, diagramContainer, lookup);
    if (!nodeElement) return;
    nodeElement.style.cursor = "pointer";
    nodeElement.classList.add("clickable");
    nodeElement.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      clickCallback(nodeObject.simpleId);
    });
    boundCount += 1;
  });
  return boundCount;
}

// 渲染图表
async function renderMermaidIntoContainer(diagramContainer, mermaidCode, sourcePath = "") {
  if (!diagramContainer) throw new Error("missing-diagram-container");
  if (window.mermaid) {
    diagramContainer.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
    window.mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis"
      }
    });
    await window.mermaid.init(undefined, diagramContainer.querySelector(".mermaid"));
    return {
      source: "window.mermaid",
      svgCount: diagramContainer.querySelectorAll("svg").length
    };
  }

  if (!MarkdownRenderer || typeof MarkdownRenderer.render !== "function") {
    throw new Error("mermaid-renderer-unavailable");
  }

  const renderHost = document.createElement("div");
  renderHost.className = "mermaid-renderer-fallback-host";
  diagramContainer.empty ? diagramContainer.empty() : (diagramContainer.innerHTML = "");
  diagramContainer.appendChild(renderHost);
  await MarkdownRenderer.render(
    app,
    `\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
    renderHost,
    sourcePath || "",
    __pluginApi?.owner || null
  );

  const svgElement = renderHost.querySelector("svg");
  if (!svgElement) {
    throw new Error("markdown-renderer-svg-missing");
  }
  const shell = document.createElement("div");
  shell.className = "mermaid";
  shell.appendChild(svgElement);
  diagramContainer.empty ? diagramContainer.empty() : (diagramContainer.innerHTML = "");
  diagramContainer.appendChild(shell);
  return {
    source: "obsidian-markdown-renderer",
    svgCount: diagramContainer.querySelectorAll("svg").length
  };
}

function normalizeRenderedSvgGeometry(diagramContainer, source = "unknown", extra = {}) {
  const svgElement = diagramContainer?.querySelector?.("svg");
  if (!svgElement) return null;
  const viewBox = svgElement.viewBox?.baseVal;
  let baseWidth = Number(viewBox?.width || 0);
  let baseHeight = Number(viewBox?.height || 0);
  if (!(baseWidth > 0 && baseHeight > 0)) {
    try {
      const bbox = typeof svgElement.getBBox === "function" ? svgElement.getBBox() : null;
      baseWidth = Number(bbox?.width || 0);
      baseHeight = Number(bbox?.height || 0);
    } catch (_) {}
  }
  if (!(baseWidth > 0 && baseHeight > 0)) {
    const rect = svgElement.getBoundingClientRect();
    baseWidth = Number(rect.width || svgElement.clientWidth || 0);
    baseHeight = Number(rect.height || svgElement.clientHeight || 0);
  }
  if (!(baseWidth > 0 && baseHeight > 0)) return null;

  const fixedWidth = Math.ceil(baseWidth);
  const fixedHeight = Math.ceil(baseHeight);
  const beforeRect = svgElement.getBoundingClientRect();
  svgElement.setAttribute("width", String(fixedWidth));
  svgElement.setAttribute("height", String(fixedHeight));
  svgElement.style.width = `${fixedWidth}px`;
  svgElement.style.height = `${fixedHeight}px`;
  svgElement.style.maxWidth = "none";
  svgElement.style.minWidth = "0";
  svgElement.style.display = "block";

  const shell = svgElement.closest(".mermaid") || svgElement.parentElement;
  if (shell) {
    shell.style.width = `${fixedWidth}px`;
    shell.style.minWidth = `${fixedWidth}px`;
    shell.style.maxWidth = "none";
    shell.style.display = "inline-block";
  }

  const afterRect = svgElement.getBoundingClientRect();
  const result = {
    source,
    viewBox: viewBox ? {
      x: Math.round(viewBox.x || 0),
      y: Math.round(viewBox.y || 0),
      width: Math.round(viewBox.width || 0),
      height: Math.round(viewBox.height || 0)
    } : null,
    baseWidth: fixedWidth,
    baseHeight: fixedHeight,
    renderedWidthBefore: Math.round(beforeRect.width || 0),
    renderedHeightBefore: Math.round(beforeRect.height || 0),
    renderedWidthAfter: Math.round(afterRect.width || 0),
    renderedHeightAfter: Math.round(afterRect.height || 0),
    ...extra
  };
  svgElement.dataset.mermaidNormalized = "true";
  svgElement.dataset.mermaidBaseWidth = String(fixedWidth);
  svgElement.dataset.mermaidBaseHeight = String(fixedHeight);
  console.info("[MermaidFloatingWidget][svg.normalize]", result);
  return result;
}

async function renderDiagram(container, statusDiv, diagramContainer, codeContainer, zoomControls, interactionOverrides = {}) {
  if (widgetClosed) return;
  const overlayGeneration = (diagramContainer.__mermaidLabelGeneration || 0) + 1;
  diagramContainer.__mermaidLabelGeneration = overlayGeneration;
  disposeSubgraphReadableLabelOverlay(diagramContainer);
  if (!diagramContainer.__mermaidLabelCleanupRegistered) {
    diagramContainer.__mermaidLabelCleanupRegistered = true;
    cleanupFns.push(() => {
      diagramContainer.__mermaidLabelGeneration = (diagramContainer.__mermaidLabelGeneration || 0) + 1;
      disposeSubgraphReadableLabelOverlay(diagramContainer);
    });
  }
  const diagnostics = __pluginApi.owner?.performanceDiagnostics;
  // A rerender or widget cleanup terminates an unfinished sample; late callbacks
  // retain their original token and cannot finish a newer render/session.
  diagramContainer._mermaidPerformanceEnd?.('unfinished');
  const diagnosticSpan = diagnostics?.begin('render', { prewarm: PREWARM_ONLY });
  const endDiagnostic = (status) => diagnostics?.end(diagnosticSpan, status);
  diagramContainer._mermaidPerformanceEnd = endDiagnostic;
  if (!diagramContainer._mermaidPerformanceCleanup) {
    diagramContainer._mermaidPerformanceCleanup = true;
    cleanupFns.push(() => {
      diagramContainer._mermaidPerformanceEnd?.('unfinished');
      diagramContainer._mermaidPerformanceEnd = null;
    });
  }
  const renderTimingStart = performance.now();
  let renderTimingLast = renderTimingStart;
  const renderTimingPhases = [];
  const markRenderTiming = (phase, extra = {}) => {
    const now = performance.now();
    const item = {
      phase,
      ms: Math.round(now - renderTimingLast),
      totalMs: Math.round(now - renderTimingStart),
      ...extra
    };
    renderTimingLast = now;
    renderTimingPhases.push(item);
    diagnostics?.phase(diagnosticSpan, phase, extra);
    console.info('[MermaidFloatingWidget][render.timing.phase]', item);
    return item;
  };
  const finishRenderTiming = (status, extra = {}) => {
    endDiagnostic(status);
    console.info('[MermaidFloatingWidget][render.timing.summary]', {
      status,
      totalMs: Math.round(performance.now() - renderTimingStart),
      phases: renderTimingPhases,
      ...extra
    });
  };

  statusDiv.textContent = "正在加载文件...";

  if (typeof diagramContainer._foldPreviewCleanup === "function") {
    diagramContainer._foldPreviewCleanup();
    diagramContainer._foldPreviewCleanup = null;
  }

  if (!CONFIG.targetNode || !String(CONFIG.targetNode).trim()) {
    statusDiv.textContent = "未检测到所属块，无法确定目标节点";
    diagramContainer.innerHTML = "<div style=\"color:#d33;padding:10px;\">请在当前笔记 YAML 中设置所属块，例如：<br>所属块: \"[[ATOM@xxx- 标题]]\"</div>";
    finishRenderTiming('missing-target-node');
    return;
  }

  // --- 新增: 在渲染前保存当前状态 ---
  const outerContainer = diagramContainer.closest('.mermaid-content');
  const savedState = {
    zoom: graphStateHost.mermaidGraphState?.zoom || CONFIG.initialZoom,
    scrollLeft: diagramContainer.scrollLeft || 0,
    scrollTop: diagramContainer.scrollTop || 0,
    panX: graphStateHost.mermaidGraphState?.panX || 0,
    panY: graphStateHost.mermaidGraphState?.panY || 0,
    outerScrollLeft: outerContainer ? outerContainer.scrollLeft : 0,
    outerScrollTop: outerContainer ? outerContainer.scrollTop : 0
  };

  try {
    // 假设 getFiles() 已经被修改，会返回包含 isFolded 属性的对象
    const files = getFiles();
    markRenderTiming('files.query', { fileCount: files.length, targetPrefix: CONFIG.targetNode });
    if (files.length === 0) {
      statusDiv.textContent = "未找到符合条件的文件";
      finishRenderTiming('empty-files', { targetPrefix: CONFIG.targetNode });
      return;
    }
    // 注意：已将中文逗号修正为英文逗号
    statusDiv.textContent = `找到 ${files.length} 个文件, 正在分析...`;
    
    // --- Graph Building (已修改以包含 isFolded 属性) ---
    const nodes = files.map(file => {
      const fileInfo = parseFileInfo(file.file.name);
      return {
        id: fileInfo.id,
        name: fileInfo.name,
        hasStateTransition: fileInfo.hasStateTransition,
        baseState: fileInfo.baseState,
        fileName: file.file.name,
        path: file.file.path,
        mermaidViewComplete: file.mermaidViewComplete,
        mermaidViewBayes: file.mermaidViewBayes,
        mermaidViewStandard: file.mermaidViewStandard,
        mermaidViewPending: file.mermaidViewPending,
        mermaidViewAI: file.mermaidViewAI,
        mermaidViewHighlight: file.mermaidViewHighlight,
        // --- 新增属性 ---
        isFolded: file.isFolded 
      };
    });

    nodes.forEach(node => {
      node.parentId = getParentId(node.id);
    });
    markRenderTiming('nodes.prepare', { nodeCount: nodes.length });

    const targetNode = nodes.find(node => node.id === CONFIG.targetNode);
    if (!targetNode) {
      statusDiv.textContent = `错误: 找不到节点 "${CONFIG.targetNode}"`;
      diagramContainer.innerHTML = `<div style="color:red;padding:10px;">目标节点未找到，请检查节点ID是否正确</div>`;
      finishRenderTiming('target-node-not-found', { targetPrefix: CONFIG.targetNode, nodeCount: nodes.length });
      return;
    }
    const activeNode = ACTIVE_NODE_ID ? nodes.find(node => node.id === ACTIVE_NODE_ID) : null;

    statusDiv.textContent = "正在构建状态转移关系图...";
    const graph = buildStateTransitionGraph(targetNode, nodes, CONFIG.maxDepth);
    markRenderTiming('graph.build', {
      ...graph.layoutExitDiagnostics,
      graphNodeCount: graph.nodes.length,
      subgraphCount: graph.subgraphs.length,
      edgeCount: Array.isArray(graph.edges) ? graph.edges.length : 0
    });

    // --- 新增: 创建折叠前缀列表 ---
    const foldedPrefixes = nodes
        .filter(n => n.isFolded)
        .map(n => getPureId(n.id)); // 假设 getPureId() 在此作用域可用
    pruneFoldDismissedPrefixes(foldedPrefixes);
    const dismissedFoldPrefixes = getFoldDismissedPrefixes();
    const manuallyExpandedPrefixes = foldedPrefixes.filter(prefix => dismissedFoldPrefixes.has(prefix));
    const capsuleFoldedNodes = nodes.filter(n => n.isFolded && !dismissedFoldPrefixes.has(getPureId(n.id)));
    const activeExpandedPrefix = interactionOverrides.temporaryExpandedPrefix || null;
    const effectiveFoldedPrefixes = foldedPrefixes.filter(prefix => prefix !== activeExpandedPrefix && !dismissedFoldPrefixes.has(prefix));
    const renderGraph = createPrunedGraphForFold(graph, effectiveFoldedPrefixes);
    markRenderTiming('fold.compute', {
      ...renderGraph.layoutExitDiagnostics,
      foldedCount: foldedPrefixes.length,
      effectiveFoldedCount: effectiveFoldedPrefixes.length,
      capsuleCount: capsuleFoldedNodes.length,
      fullNodeCount: graph.nodes.length,
      renderNodeCount: renderGraph.nodes.length,
      prunedNodeCount: graph.nodes.length - renderGraph.nodes.length,
      fullSubgraphCount: graph.subgraphs.length,
      renderSubgraphCount: renderGraph.subgraphs.length
    });

    statusDiv.textContent = "正在分析正文引用关系...";
    const bodyReferenceGroups = await buildBodyReferenceGroups(graph.nodes);
    const visibleNodeIds = new Set(renderGraph.nodes.map(node => node.id));
    const visibleReferenceNodeCount = (bodyReferenceGroups.components || []).reduce((sum, component) => {
      return sum + (component.nodes || []).filter(nodeId => visibleNodeIds.has(nodeId)).length;
    }, 0);
    markRenderTiming('body-reference.analyze', {
      groupCount: bodyReferenceGroups.components?.length || 0,
      edgeCount: bodyReferenceGroups.edgeCount || 0,
      analyzedNodeCount: graph.nodes.length,
      visibleNodeCount: renderGraph.nodes.length,
      visibleReferenceNodeCount,
      sampleComponents: (bodyReferenceGroups.components || []).slice(0, 5).map(component => ({
        groupId: component.groupId,
        color: component.color,
        nodeCount: component.nodes?.length || 0,
        visibleNodeCount: (component.nodes || []).filter(nodeId => visibleNodeIds.has(nodeId)).length
      }))
    });

    renderFoldedSubgraphCapsules(container, diagramContainer, capsuleFoldedNodes, (prefix) => {
        const dismissed = getFoldDismissedPrefixes();
        dismissed.add(prefix);
        renderDiagram(container, statusDiv, diagramContainer, codeContainer, zoomControls, { focusPrefix: prefix });
    });

    const findOpenRootLeafForFile = (file) => {
      if (!file?.path || typeof app.workspace.iterateRootLeaves !== "function") return null;
      let found = null;
      app.workspace.iterateRootLeaves((leaf) => {
        if (found) return;
        if (leaf?.view?.file?.path === file.path) found = leaf;
      });
      return found;
    };

    const activateLeaf = (leaf, focus = false) => {
      if (!leaf || typeof app.workspace.setActiveLeaf !== "function") return false;
      try {
        app.workspace.setActiveLeaf(leaf, { focus });
        return true;
      } catch (error) {
        try {
          app.workspace.setActiveLeaf(leaf, focus);
          return true;
        } catch (innerError) {
          console.warn("[MermaidFloatingWidget][leaf.activate-failed]", { error: innerError || error });
        }
      }
      return false;
    };

    const resolveMermaidNodeFile = (targetText) => {
      const raw = String(targetText || "").trim();
      if (!raw) return null;
      const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
      const exact = app.vault.getAbstractFileByPath(normalized);
      if (exact instanceof TFile && exact.extension === "md") return exact;
      const withExt = normalized.endsWith(".md") ? normalized : `${normalized}.md`;
      const exactWithExt = app.vault.getAbstractFileByPath(withExt);
      if (exactWithExt instanceof TFile && exactWithExt.extension === "md") return exactWithExt;
      const activeFile = app.workspace.getActiveFile?.() || null;
      const noExt = normalized.replace(/\.md$/i, "");
      const linked = app.metadataCache.getFirstLinkpathDest(normalized, activeFile?.path || "")
        || app.metadataCache.getFirstLinkpathDest(noExt, activeFile?.path || "")
        || app.metadataCache.getFirstLinkpathDest(noExt.split("/").pop() || noExt, activeFile?.path || "");
      if (linked instanceof TFile && linked.extension === "md") return linked;
      const basename = withExt.split("/").pop()?.toLowerCase() || "";
      return app.vault.getMarkdownFiles().find((file) => file.name.toLowerCase() === basename) || null;
    };

    const openMermaidNodeFile = async (file) => {
      if (!(file instanceof TFile)) return false;
      const existingLeaf = findOpenRootLeafForFile(file);
      const activeLeaf = app.workspace.activeLeaf || null;
      if (existingLeaf) {
        activateLeaf(existingLeaf, true);
        console.info("[MermaidFloatingWidget][node-open.leaf-strategy]", {
          targetPath: file.path,
          strategy: "activate-existing",
          chosenLeafWasExisting: true,
          activeViewType: activeLeaf?.view?.getViewType?.() || ""
        });
        return true;
      }
      let leaf = null;
      let strategy = "unavailable";
      if (typeof app.workspace.getLeaf === "function") {
        try {
          leaf = app.workspace.getLeaf("tab") || app.workspace.getLeaf(true);
          strategy = leaf ? "getLeaf:tab" : "getLeaf:tab-miss";
        } catch (error) {
          console.warn("[MermaidFloatingWidget][leaf.get-failed]", { error });
        }
      }
      if (!leaf) {
        leaf = app.workspace.getLeaf(true);
        strategy = "getLeaf:true:fallback";
      }
      await leaf.openFile(file, { active: true });
      console.info("[MermaidFloatingWidget][node-open.leaf-strategy]", {
        targetPath: file.path,
        strategy,
        chosenLeafWasExisting: false,
        activeViewType: activeLeaf?.view?.getViewType?.() || ""
      });
      return true;
    };

    // --- Click Handler (直接打开笔记，优先复用已打开 leaf) ---
    const handleNodeClick = async function(nodeId) {
      if (graphStateHost.stateTransitionNodeIdMap && graphStateHost.stateTransitionNodeIdMap[nodeId]) {
        const node = graphStateHost.stateTransitionNodeIdMap[nodeId];
        const targetText = node.path || node.fileName || "";
        if (targetText) {
          console.log(`点击了节点: ${nodeId} -> 打开文件: ${targetText}`);
          const file = resolveMermaidNodeFile(targetText);
          if (!file) {
            showToast(`未找到节点笔记: ${node.name || node.fileName || targetText}`, "error");
            return;
          }
          saveCurrentMermaidGraphState("node-open", widget);
          await openMermaidNodeFile(file);
          showToast(`正在打开: ${node.fileName}`, "info");
          closeWidget();
        } else {
          showToast(`节点 ${node.name || nodeId} 没有关联的文件`, "info");
        }
      } else {
        showToast(`未找到节点 ${nodeId} 的相关信息`, "error");
        console.warn(`未找到节点 ${nodeId} 的映射信息`);
      }
    };

    // --- Mermaid Code Generation and Rendering (已修改以传入 foldedPrefixes) ---
    statusDiv.textContent = "正在生成图表...";
    // 将 foldedPrefixes 传递给 generateMermaidCode
    const mermaidCode = generateMermaidCode(renderGraph, handleNodeClick, effectiveFoldedPrefixes); 
    codeContainer.textContent = mermaidCode;
    diagramContainer.style.visibility = "hidden";
    diagramContainer.style.opacity = "0";
    markRenderTiming('mermaid-code.generate', {
      codeChars: mermaidCode.length,
      effectiveFoldedCount: effectiveFoldedPrefixes.length
    });

    const renderCacheInfo = buildMermaidRenderCacheKey(CONFIG.targetNode, mermaidCode, effectiveFoldedPrefixes, bodyReferenceGroups);
    const cachedRender = (__pluginApi && typeof __pluginApi.getRenderCache === "function")
      ? acceptLayoutExitCache(__pluginApi.getRenderCache({
          key: renderCacheInfo.key,
          targetPrefix: CONFIG.targetNode,
          allowStaleStable: !PREWARM_ONLY,
          requiredNodeId: ACTIVE_NODE_ID || CONFIG.targetNode
        }))
      : null;
    const emergencyStaleRender = (!cachedRender && !PREWARM_ONLY && __pluginApi && typeof __pluginApi.getRenderCache === "function")
      ? acceptLayoutExitCache(__pluginApi.getRenderCache({
          key: renderCacheInfo.key,
          targetPrefix: CONFIG.targetNode,
          allowStaleStable: true,
          requiredNodeId: ""
        }))
      : null;
    let referenceStyleSummary = cachedRender?.referenceStyleSummary || { styledNodeCount: 0, componentCount: 0, edgeCount: 0 };

    if (cachedRender?.svgOuterHTML) {
      diagramContainer.innerHTML = `<div class="mermaid">${cachedRender.svgOuterHTML}</div>`;
      normalizeRenderedSvgGeometry(diagramContainer, "cache-hit", {
        cacheState: cachedRender.cacheState || "fresh",
        keyHash: renderCacheInfo.hash
      });
      if (CONFIG.enableSubgraphReadableLabels !== false) {
        renderGraph.subgraphReadableLabelAnchors = getValidSubgraphReadableLabelAnchors(cachedRender.subgraphReadableLabelAnchors);
      }
      const reboundClickCount = bindRenderedNodeClickHandlers(diagramContainer, renderGraph.nodes, handleNodeClick);
      referenceStyleSummary = applyBodyReferenceGroupStyling(diagramContainer, renderGraph.nodes, bodyReferenceGroups);
      markRenderTiming('reference-style.apply-cache', {
        ...referenceStyleSummary,
        cacheState: cachedRender.cacheState || "fresh"
      });
      markRenderTiming('mermaid.render-cache.hit', {
        keyHash: renderCacheInfo.hash,
        cacheState: cachedRender.cacheState || "fresh",
        generation: cachedRender.generation ?? null,
        svgChars: cachedRender.svgOuterHTML.length,
        reboundClickCount
      });
      if (cachedRender.cacheState === "stale") {
        scheduleStaleRenderRefresh({
          targetPrefix: CONFIG.targetNode,
          mermaidCode,
          renderCacheInfo,
          renderGraph,
          bodyReferenceGroups,
          effectiveFoldedPrefixes,
          generation: cachedRender.generation
        });
      }
    } else if (window.mermaid) {
      diagramContainer.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
      // 您的原始 Mermaid 初始化代码, 非常完美
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis"
        }
      });
      
      // 渲染调用保持不变
      await window.mermaid.init(undefined, diagramContainer.querySelector(".mermaid"));
      normalizeRenderedSvgGeometry(diagramContainer, "fresh-mermaid", { keyHash: renderCacheInfo.hash });
      if (CONFIG.enableSubgraphReadableLabels !== false) {
        renderGraph.subgraphReadableLabelAnchors = collectSubgraphReadableLabelAnchors(diagramContainer, renderGraph, "fresh-mermaid");
      }
      markRenderTiming('mermaid.render', {
        svgCount: diagramContainer.querySelectorAll("svg").length
      });
      referenceStyleSummary = applyBodyReferenceGroupStyling(diagramContainer, renderGraph.nodes, bodyReferenceGroups);
      markRenderTiming('reference-style.apply', referenceStyleSummary);
      const svgElement = diagramContainer.querySelector("svg");
      if (svgElement && __pluginApi && typeof __pluginApi.putRenderCache === "function") {
        __pluginApi.putRenderCache(renderCacheInfo.key, {
          targetPrefix: CONFIG.targetNode,
          hash: renderCacheInfo.hash,
          mermaidCodeHash: renderCacheInfo.mermaidCodeHash,
          mermaidCode,
          svgOuterHTML: svgElement.outerHTML,
          normalizeVersion: 1,
          referenceStyleSummary,
          nodeCount: renderGraph.nodes.length,
          subgraphCount: renderGraph.subgraphs.length,
          codeChars: mermaidCode.length,
          config: renderCacheInfo.payload.renderConfig,
          effectiveFoldedPrefixes: effectiveFoldedPrefixes.slice().sort(),
          nodeIds: renderGraph.nodes.map(node => node.id),
          subgraphReadableLabelAnchors: renderGraph.subgraphReadableLabelAnchors || undefined
        }, PREWARM_ONLY ? { expectedGeneration: __pluginApi.prewarmGeneration, source: "dirty-prewarm" } : undefined);
      }
    } else {
      try {
        const fallbackRender = await renderMermaidIntoContainer(diagramContainer, mermaidCode, resolved?.activeFile?.path || "");
        normalizeRenderedSvgGeometry(diagramContainer, `fallback-${fallbackRender.source}`, { keyHash: renderCacheInfo.hash });
        if (CONFIG.enableSubgraphReadableLabels !== false) {
          renderGraph.subgraphReadableLabelAnchors = collectSubgraphReadableLabelAnchors(diagramContainer, renderGraph, `fallback-${fallbackRender.source}`);
        }
        markRenderTiming('mermaid.render', {
          svgCount: fallbackRender.svgCount,
          source: fallbackRender.source
        });
        referenceStyleSummary = applyBodyReferenceGroupStyling(diagramContainer, renderGraph.nodes, bodyReferenceGroups);
        markRenderTiming('reference-style.apply', referenceStyleSummary);
        const svgElement = diagramContainer.querySelector("svg");
        if (svgElement && __pluginApi && typeof __pluginApi.putRenderCache === "function") {
          __pluginApi.putRenderCache(renderCacheInfo.key, {
            targetPrefix: CONFIG.targetNode,
            hash: renderCacheInfo.hash,
            mermaidCodeHash: renderCacheInfo.mermaidCodeHash,
            mermaidCode,
            svgOuterHTML: svgElement.outerHTML,
            normalizeVersion: 1,
            referenceStyleSummary,
            nodeCount: renderGraph.nodes.length,
            subgraphCount: renderGraph.subgraphs.length,
            codeChars: mermaidCode.length,
          config: renderCacheInfo.payload.renderConfig,
          effectiveFoldedPrefixes: effectiveFoldedPrefixes.slice().sort(),
          nodeIds: renderGraph.nodes.map(node => node.id),
          subgraphReadableLabelAnchors: renderGraph.subgraphReadableLabelAnchors || undefined
        }, PREWARM_ONLY ? { expectedGeneration: __pluginApi.prewarmGeneration, source: "dirty-prewarm" } : undefined);
        }
      } catch (renderError) {
        if (emergencyStaleRender?.svgOuterHTML) {
          diagramContainer.innerHTML = `<div class="mermaid">${emergencyStaleRender.svgOuterHTML}</div>`;
          normalizeRenderedSvgGeometry(diagramContainer, "emergency-stale", { keyHash: renderCacheInfo.hash });
          if (CONFIG.enableSubgraphReadableLabels !== false) {
            renderGraph.subgraphReadableLabelAnchors = getValidSubgraphReadableLabelAnchors(emergencyStaleRender.subgraphReadableLabelAnchors);
          }
          const reboundClickCount = bindRenderedNodeClickHandlers(diagramContainer, renderGraph.nodes, handleNodeClick);
          referenceStyleSummary = applyBodyReferenceGroupStyling(diagramContainer, renderGraph.nodes, bodyReferenceGroups);
          markRenderTiming('reference-style.apply-emergency-stale', referenceStyleSummary);
          markRenderTiming('mermaid.render-cache.emergency-stale', {
            reason: renderError.message,
            reboundClickCount,
            svgChars: emergencyStaleRender.svgOuterHTML.length
          });
          statusDiv.textContent = "Mermaid渲染器暂不可用，已临时显示旧缓存图；新节点可能暂未出现在图中。";
        } else {
          statusDiv.textContent = `错误: Mermaid渲染器未加载 (${renderError.message})`;
          diagramContainer.style.visibility = "visible";
          diagramContainer.style.opacity = "1";
          finishRenderTiming('mermaid-missing', { message: renderError.message });
          return;
        }
      }
    }
       
      installSubgraphReadableLabelOverlay(diagramContainer, renderGraph, "render-complete", overlayGeneration);

      // 渲染后更新状态文本
      const foldedRootCount = effectiveFoldedPrefixes.length;
      const hoverHint = foldedRootCount > 0 ? `，${foldedRootCount} 个折叠子图可从上方胶囊点 × 展开` : "";
      const manualExpandHint = manuallyExpandedPrefixes.length > 0 ? `，${manuallyExpandedPrefixes.length} 个折叠子图已由胶囊展开` : "";
      const referenceHint = referenceStyleSummary.componentCount > 0
        ? `，正文引用分组 ${referenceStyleSummary.componentCount} 组 / ${referenceStyleSummary.edgeCount} 条`
        : "";
      const expandedHint = activeExpandedPrefix ? `，当前已展开 ${activeExpandedPrefix}` : "";
      const prunedHint = graph.nodes.length > renderGraph.nodes.length ? `，已裁剪 ${graph.nodes.length - renderGraph.nodes.length} 个折叠节点` : "";
      statusDiv.textContent = `图表已生成，显示 ${renderGraph.nodes.length}/${graph.nodes.length} 个节点, ${renderGraph.subgraphs.length}/${graph.subgraphs.length} 个子图（可点击节点导航到对应笔记${hoverHint}${manualExpandHint}${referenceHint}${prunedHint}）`;

      // **增强版: 恢复视图状态 + 无跳动呈现**
      const finalizeView = () => {
          // 1. 确保全局状态对象存在
          if (!graphStateHost.mermaidGraphState) {
              graphStateHost.mermaidGraphState = savedState;
          }

          const restoredZoom = Math.max(0.1, Number(savedState.zoom) || CONFIG.initialZoom);
          graphStateHost.mermaidGraphState.zoom = restoredZoom;
          graphStateHost.mermaidGraphState.scrollLeft = savedState.scrollLeft;
          graphStateHost.mermaidGraphState.scrollTop = savedState.scrollTop;
          graphStateHost.mermaidGraphState.panX = savedState.panX || 0;
          graphStateHost.mermaidGraphState.panY = savedState.panY || 0;
          graphStateHost.mermaidGraphState.outerScrollLeft = savedState.outerScrollLeft || 0;
          graphStateHost.mermaidGraphState.outerScrollTop = savedState.outerScrollTop || 0;

          // 2. 恢复缩放: 使用保存的缩放级别
          if (CONFIG.enableZoom && zoomControls) {
              if (typeof zoomControls.setZoomLevel === "function") {
                  zoomControls.setZoomLevel(restoredZoom, { persist: !PREWARM_ONLY });
              } else {
                  const svgElement = diagramContainer.querySelector("svg");
                  if (svgElement) {
                      svgElement.style.transformOrigin = "top left";
                      svgElement.style.transform = `translate(${savedState.panX || 0}px, ${savedState.panY || 0}px) scale(${restoredZoom})`;
                  }
                  zoomControls.updateZoomDisplay();
              }
          }
          updateTransformedDiagramBounds(diagramContainer, "finalize-before-scroll");

          // 3. 恢复滚动位置: 应用保存的值
          diagramContainer.scrollLeft = savedState.scrollLeft;
          diagramContainer.scrollTop = savedState.scrollTop;
          if (outerContainer) {
              outerContainer.scrollLeft = savedState.outerScrollLeft || 0;
              outerContainer.scrollTop = savedState.outerScrollTop || 0;
          }

          const focusPrefix = interactionOverrides.focusPrefix || null;
          const focusNode = focusPrefix ? renderGraph.nodes.find(node => getPureId(node.id) === focusPrefix) : null;
          const activeRenderNode = activeNode ? renderGraph.nodes.find(node => node.id === activeNode.id) : null;
          const nodeToCenter = focusNode || activeRenderNode;
          console.info('[MermaidFloatingWidget][center.restore-context]', {
              activeNodeId: ACTIVE_NODE_ID || null,
              activeNodeFoundInAllNodes: !!activeNode,
              activeNodeFoundInRenderGraph: !!activeRenderNode,
              focusPrefix,
              focusNodeId: focusNode?.id || null,
              nodeToCenterId: nodeToCenter?.id || null,
              savedState,
              renderNodeCount: renderGraph.nodes.length,
              fullNodeCount: graph.nodes.length,
              prunedNodeCount: graph.nodes.length - renderGraph.nodes.length,
              cachedSvgHit: !!cachedRender?.svgOuterHTML
          });

          const revealStableDiagram = (reason = "stable") => {
              diagramContainer._foldPreviewCleanup = null;
              diagramContainer.style.visibility = "visible";
              diagramContainer.style.opacity = "1";
              console.info('[MermaidFloatingWidget][view.reveal]', {
                  reason,
                  focusedNode: nodeToCenter?.id || null,
                  zoom: graphStateHost.mermaidGraphState?.zoom || restoredZoom
              });
          };
          const finishStableRender = () => {
              if (expandedHint) {
                  statusDiv.textContent = `图表已生成，显示 ${renderGraph.nodes.length}/${graph.nodes.length} 个节点, ${renderGraph.subgraphs.length}/${graph.subgraphs.length} 个子图（可点击节点导航到对应笔记${hoverHint}${manualExpandHint}${referenceHint}${prunedHint}${expandedHint}）`;
              }

              console.log('[状态恢复] 已恢复视图状态:', savedState);
              markRenderTiming('view.finalize', {
                  focusedNode: nodeToCenter?.id || null,
                  zoom: savedState.zoom
              });
              finishRenderTiming('ok', {
                  targetPrefix: CONFIG.targetNode,
                  fileCount: files.length,
                  fullGraphNodeCount: graph.nodes.length,
                  graphNodeCount: renderGraph.nodes.length,
                  prunedNodeCount: graph.nodes.length - renderGraph.nodes.length,
                  fullSubgraphCount: graph.subgraphs.length,
                  subgraphCount: renderGraph.subgraphs.length,
                  codeChars: mermaidCode.length
              });
          };

          if (nodeToCenter) {
              centerNodeInChartTwoPhase(nodeToCenter, diagramContainer, () => {
                  if (CONFIG.enableZoom && zoomControls && typeof zoomControls.setZoomLevel === "function") {
                      zoomControls.setZoomLevel(restoredZoom, { persist: false });
                  }
                  revealStableDiagram("centered");
                  highlightNodeOnce(nodeToCenter, diagramContainer, 5000);
                  finishStableRender();
              }, { restoredZoom, restoredState: savedState });
          } else {
              console.warn('[MermaidFloatingWidget][center.skip]', {
                  reason: 'node-to-center-missing',
                  activeNodeId: ACTIVE_NODE_ID || null,
                  focusPrefix,
                  renderNodeCount: renderGraph.nodes.length,
                  sampleRenderNodeIds: renderGraph.nodes.slice(0, 16).map(node => node.id)
              });
              revealStableDiagram("no-target");
              finishStableRender();
          }
      };

      requestAnimationFrame(() => requestAnimationFrame(finalizeView));
  } catch (error) {
    statusDiv.textContent = `错误: ${error.message}`;
    if (CONFIG.debug) {
      diagramContainer.innerHTML += `<pre style="color:red;padding:10px;overflow:auto">${error.stack}</pre>`;
    }
    if (typeof diagramContainer._foldPreviewCleanup === "function") {
      diagramContainer._foldPreviewCleanup();
      diagramContainer._foldPreviewCleanup = null;
    }
    diagramContainer.style.visibility = "visible";
    diagramContainer.style.opacity = "1";
    finishRenderTiming('error', { message: error.message });
  }
}




// ===== 主程序入口 =====
// 创建UI并渲染初始图表
const ui = createUI(content);
await renderDiagram(content, ui.statusDiv, ui.diagramContainer, ui.codeContainer, ui.zoomControls);
if (PREWARM_ONLY) {
    closeWidget();
    return;
}
cleanupFns.push(() => {
    if (typeof ui.diagramContainer?._foldPreviewCleanup === "function") {
        ui.diagramContainer._foldPreviewCleanup();
        ui.diagramContainer._foldPreviewCleanup = null;
    }
});
const keyboardCleanup = setupGlobalKeyboardShortcuts();
if (keyboardCleanup) cleanupFns.push(keyboardCleanup);

// --- 新增: 监听标签页切换，恢复视图状态 ---
// 当当前笔记被激活时，恢复 Mermaid 图的视图状态
const refreshOnLeafActive = () => {
    // 检查当前激活的 leaf 是否包含我们的图表容器
    const activeLeaf = app.workspace.activeLeaf;
    if (activeLeaf && ui.diagramContainer) {
        // 延迟执行以确保 DOM 已更新
        setTimeout(() => {
            const storedState = localStorage.getItem('mermaidGraphState');
            if (storedState && ui.diagramContainer) {
                try {
                    const state = JSON.parse(storedState);
                    console.log('[标签页切换] 检测到切换，恢复状态:', state);

                    // 恢复滚动位置
                    ui.diagramContainer.scrollLeft = state.scrollLeft || 0;
                    ui.diagramContainer.scrollTop = state.scrollTop || 0;
                    const outerContainer = ui.diagramContainer.closest('.mermaid-content');
                    if (outerContainer) {
                        outerContainer.scrollLeft = state.outerScrollLeft || 0;
                        outerContainer.scrollTop = state.outerScrollTop || 0;
                    }

                    // 恢复缩放
                    const svgElement = ui.diagramContainer.querySelector("svg");
                    if (svgElement && ui.zoomControls) {
                        if (typeof ui.zoomControls.setZoomLevel === "function") {
                            graphStateHost.mermaidGraphState = { ...(graphStateHost.mermaidGraphState || {}), ...state };
                            ui.zoomControls.setZoomLevel(state.zoom || CONFIG.initialZoom, { persist: false });
                        } else {
                            svgElement.style.transformOrigin = "top left";
                            svgElement.style.transform = `translate(${state.panX || 0}px, ${state.panY || 0}px) scale(${state.zoom || CONFIG.initialZoom})`;
                            ui.zoomControls.updateZoomDisplay();
                        }
                        updateTransformedDiagramBounds(ui.diagramContainer, "leaf-restore");
                    }

                    // 更新全局状态
                    if (graphStateHost.mermaidGraphState) {
                        graphStateHost.mermaidGraphState.zoom = state.zoom;
                        graphStateHost.mermaidGraphState.scrollLeft = state.scrollLeft;
                        graphStateHost.mermaidGraphState.scrollTop = state.scrollTop;
                        graphStateHost.mermaidGraphState.panX = state.panX || 0;
                        graphStateHost.mermaidGraphState.panY = state.panY || 0;
                        graphStateHost.mermaidGraphState.outerScrollLeft = state.outerScrollLeft || 0;
                        graphStateHost.mermaidGraphState.outerScrollTop = state.outerScrollTop || 0;
                    }
                } catch (e) {
                    console.warn('[标签页切换] 恢复状态失败:', e);
                }
            }
        }, 200);
    }
};

// 注册工作区事件监听器
if (app.workspace) {
    const activeLeafChangeRef = app.workspace.on('active-leaf-change', refreshOnLeafActive);
    cleanupFns.push(() => {
        if (activeLeafChangeRef && app.workspace.offref) {
            app.workspace.offref(activeLeafChangeRef);
        } else if (app.workspace.off) {
            app.workspace.off('active-leaf-change', refreshOnLeafActive);
        }
    });
    console.log('[状态恢复] 已注册 active-leaf-change 事件监听器');
}
  };

  if (!PREWARM_ONLY) window.__toggleMermaidFloatingWidget = toggleMermaidFloatingWidget;
  await toggleMermaidFloatingWidget();

};


// In-memory query accelerator. Persistent node index remains authoritative.
class MermaidPrefixIndex {
  constructor(entries) {
    this.source = entries;
    this.rows = [];
    this.byPath = new Map();
    this.sequence = 0;
    for (const path of Object.keys(entries)) {
      const row = { path, name: this.name(entries[path]), order: this.sequence++ };
      this.rows.push(row); this.byPath.set(path, row);
    }
    this.rows.sort((a, b) => this.compare(a, b));
  }
  name(entry) { return String(entry?.name || entry?.basename || ''); }
  compare(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : a.order - b.order; }
  lowerName(name) {
    let lo = 0, hi = this.rows.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (this.rows[mid].name < name) lo = mid + 1; else hi = mid; }
    return lo;
  }
  lowerRow(row) {
    let lo = 0, hi = this.rows.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (this.compare(this.rows[mid], row) < 0) lo = mid + 1; else hi = mid; }
    return lo;
  }
  update(path, entry) {
    const old = this.byPath.get(path), name = this.name(entry);
    if (old && entry && old.name === name) return;
    if (old) { this.rows.splice(this.lowerRow(old), 1); this.byPath.delete(path); }
    if (entry) {
      const row = { path, name, order: old ? old.order : this.sequence++ };
      this.rows.splice(this.lowerRow(row), 0, row); this.byPath.set(path, row);
    }
  }
  query(prefix) {
    const selected = [];
    let inspected = 0;
    for (let i = this.lowerName(prefix); i < this.rows.length; i++) {
      const row = this.rows[i]; inspected++;
      if (!row.name.startsWith(prefix)) break;
      selected.push(row);
    }
    selected.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') || a.order - b.order);
    return { entries: selected.map(row => this.source[row.path]), inspected };
  }
}

function createMermaidPerformanceDiagnostics(owner) {
  const MAX_EVENTS = 500, MAX_BYTES = 131072, MAX_PENDING = 100;
  const phases = new Set(['files.query', 'nodes.prepare', 'graph.build', 'fold.compute',
    'body-reference.analyze', 'mermaid-code.generate', 'mermaid.render',
    'reference-style.apply-cache', 'reference-style.apply', 'reference-style.apply-emergency-stale',
    'mermaid.render-cache.hit', 'mermaid.render-cache.emergency-stale', 'view.finalize', 'prefix.query', 'label.layout', 'label.dom', 'view.zoom', 'view.bounds', 'view.scroll']);
  const metrics = new Set(['layoutExitCount','layoutHelperCount','layoutUnresolvedCount','layoutMissingParentCount','layoutPartialCount','fileCount','nodeCount','graphNodeCount','subgraphCount','edgeCount',
    'foldedCount','effectiveFoldedCount','capsuleCount','fullNodeCount','renderNodeCount',
    'prunedNodeCount','fullSubgraphCount','renderSubgraphCount','groupCount','analyzedNodeCount',
    'visibleNodeCount','visibleReferenceNodeCount','codeChars','svgCount','svgChars',
    'styledNodeCount','componentCount','reboundClickCount','inspected','indexSize','builtRows','zoom','labelsCreated','labelsReused','labelsRemoved','labelCount','anchorCount','queuedRequests','placementMs','domApplyMs','labelLogMs','labelLogWrites']);
  const outcomes = new Set(['ok','error','missing-target-node','empty-files','target-node-not-found',
    'mermaid-missing','unfinished','stopped','timeout','replaced','unloaded','not-refreshed']);
  let session = null, serial = 0, disposed = false;
  const instanceId = Math.random().toString(36).slice(2);
  const now = () => performance.now();
  const snapshot = () => {
    const d = owner.indexDiagnostics || {}, out = {};
    for (const key of ['queuedRefreshes','coalescedRefreshes','refreshCommits','staleRefreshes','referenceReads'])
      out[key] = Number(d[key]) || 0;
    for (const key of ['stringifies','stringifyBytes','writes','writeBytes','writeFailures','retries'])
      out[key] = Object.values(d[key] || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
    out.pendingRefreshes = 0;
    owner.pathRefreshStates?.forEach(state => {
      if (!state.tombstone && (state.timer || state.retryTimer || state.inFlight)) out.pendingRefreshes++;
    });
    out.pendingPrewarm = owner.renderPrewarmTimers?.size || 0;
    out.inFlightWrites = 0; out.runningRebuilds = 0;
    owner.assetStates?.forEach(state => { out.inFlightWrites += state.writeInFlight ? 1 : 0; out.runningRebuilds += state.rebuild?.running ? 1 : 0; });
    return out;
  };
  const safeFields = data => {
    const out = {};
    for (const [key, value] of Object.entries(data || {})) {
      if (metrics.has(key) && typeof value === 'number' && Number.isFinite(value)) out[key] = value;
      if (key === 'cacheState' && ['fresh','stale-stable','stale','emergency-stale','miss'].includes(value)) out[key] = value;
    }
    return out;
  };
  const totalMetricKeys = new Set(['labelsCreated','labelsReused','labelsRemoved','labelCount',
    'queuedRequests','placementMs','domApplyMs','labelLogMs','labelLogWrites']);
  // Only whitelisted kinds/phases reach push; no identifiers or raw samples are keys.
  const MAX_PHASE_TOTALS = (phases.size + 1) * 5 * 2;
  const aggregate = (s, event) => {
    const key = `${event.kind}|${event.prewarm ? 1 : 0}|${event.phase}`;
    let row = s.phaseTotals.get(key);
    if (!row) {
      if (s.phaseTotals.size >= MAX_PHASE_TOTALS) return;
      row = { kind: event.kind, prewarm: event.prewarm, phase: event.phase, count: 0,
        totalDurationMs: 0, maxDurationMs: 0, totalElapsedMs: 0, maxElapsedMs: 0, metricTotals: {} };
      s.phaseTotals.set(key, row);
    }
    row.count++;
    if (typeof event.durationMs === 'number') {
      row.totalDurationMs += event.durationMs;
      row.maxDurationMs = Math.max(row.maxDurationMs, event.durationMs);
    }
    if (event.phase === 'end') {
      row.totalElapsedMs += event.elapsedMs;
      row.maxElapsedMs = Math.max(row.maxElapsedMs, event.elapsedMs);
    }
    for (const key of totalMetricKeys) {
      if (typeof event[key] === 'number') row.metricTotals[key] = (row.metricTotals[key] || 0) + event[key];
    }
  };
  const push = (s, event) => {
    aggregate(s, event);
    const bytes = JSON.stringify(event).length * 2;
    if (bytes > MAX_BYTES) { s.dropped++; return; }
    while (s.events.length >= MAX_EVENTS || s.bytes + bytes > MAX_BYTES) {
      s.bytes -= s.events.shift().bytes; s.dropped++;
    }
    s.events.push({ event, bytes }); s.bytes += bytes;
  };
  const valid = token => !!session?.active && token?.session === session && session.pending.has(token.id);
  const finish = (token, outcome, data) => {
    if (!valid(token)) return;
    const s = session, span = s.pending.get(token.id);
    push(s, { spanId: token.id, kind: span.kind, prewarm: span.prewarm, phase: 'end',
      outcome: outcomes.has(outcome) ? outcome : 'other', elapsedMs: now() - span.started, ...safeFields(data) });
    s.pending.delete(token.id);
  };
  // Window-wide indicators, not attribution to this plugin; no per-frame event buffer.
  const consumeLongTasks = (s, entries) => {
    if (session !== s || !s.active) return;
    for (const entry of entries || []) {
      const duration = Number(entry.duration);
      if (!Number.isFinite(duration) || duration < 0 || Number(entry.startTime) < s.started) continue;
      s.observations.longTaskCount++;
      s.observations.longTaskTotalMs += duration;
      s.observations.longTaskMaxMs = Math.max(s.observations.longTaskMaxMs, duration);
    }
  };
  const startWindowObservers = s => {
    s.observations = { scope: 'whole-window; other plugins and page work contribute',
      longTasksSupported: false, framesSupported: false, longTaskCount: 0, longTaskTotalMs: 0,
      longTaskMaxMs: 0, frameSamples: 0, frameGapMaxMs: 0, frameGapsOver50ms: 0 };
    s.observer = null; s.frameHandle = null; s.lastFrame = null; s.visibilityListener = null;
    try {
      if (typeof window.PerformanceObserver === 'function') {
        s.observer = new window.PerformanceObserver(list => consumeLongTasks(s, list.getEntries()));
        s.observer.observe({ type: 'longtask', buffered: false });
        s.observations.longTasksSupported = true;
      }
    } catch (_) { try { s.observer?.disconnect(); } catch (_) {} s.observer = null; }
    try {
      if (typeof window.requestAnimationFrame === 'function' && typeof window.cancelAnimationFrame === 'function') {
        // Hidden documents often stop RAF entirely, so reset at the visibility
        // transition instead of depending on a hidden frame ever running.
        s.visibilityListener = () => { if (session === s && s.active) s.lastFrame = null; };
        window.document?.addEventListener?.('visibilitychange', s.visibilityListener);
        const frame = at => {
          s.frameHandle = null;
          if (session !== s || !s.active) return;
          if (window.document?.visibilityState === 'hidden') s.lastFrame = null;
          else {
            if (s.lastFrame != null) {
              const gap = Math.max(0, at - s.lastFrame);
              s.observations.frameSamples++;
              s.observations.frameGapMaxMs = Math.max(s.observations.frameGapMaxMs, gap);
              if (gap > 50) s.observations.frameGapsOver50ms++;
            }
            s.lastFrame = at;
          }
          s.frameHandle = window.requestAnimationFrame(frame);
        };
        s.frameHandle = window.requestAnimationFrame(frame);
        s.observations.framesSupported = true;
      }
    } catch (_) { s.frameHandle = null; }
  };
  const stopWindowObservers = s => {
    try { if (s.observer?.takeRecords) consumeLongTasks(s, s.observer.takeRecords()); } catch (_) {}
    try { s.observer?.disconnect(); } catch (_) {}
    try { if (s.frameHandle != null) window.cancelAnimationFrame(s.frameHandle); } catch (_) {}
    try { if (s.visibilityListener) window.document?.removeEventListener?.('visibilitychange', s.visibilityListener); } catch (_) {}
    s.observer = null; s.frameHandle = null; s.lastFrame = null; s.visibilityListener = null;
  };
  const report = () => {
    if (!session) return { schemaVersion: 1, active: false, status: 'not-started', loadedVersion: owner.manifest?.version || 'unknown' };
    const s = session, current = s.finalCounters || snapshot(), delta = {};
    for (const key of Object.keys(s.baseline)) if (!['pendingRefreshes','pendingPrewarm','inFlightWrites','runningRebuilds'].includes(key)) delta[key] = current[key] - s.baseline[key];
    return { schemaVersion: 1, loadedVersion: owner.manifest?.version || 'unknown', clockScope: s.id,
      active: s.active, status: s.reason, elapsedMs: (s.ended ?? now()) - s.started,
      limits: { seconds: s.seconds, maxEvents: MAX_EVENTS, eventBytes: MAX_BYTES, maxPending: MAX_PENDING, maxPhaseTotals: MAX_PHASE_TOTALS },
      windowObservations: { ...s.observations },
      phaseTotalsScope: 'accepted phase observations across this session, including evicted details; pending-cap rejected spans and unobserved work are excluded; nested times may overlap',
      rejectedSpans: s.rejectedSpans,
      phaseTotals: Array.from(s.phaseTotals.values(), row => ({ ...row, metricTotals: { ...row.metricTotals } })),
      droppedEvents: s.dropped, bufferBytes: s.bytes, countersDelta: delta,
      counterUnits: { stringifyBytes: 'UTF-16 code units', writeBytes: 'UTF-16 code units' },
      background: { pendingRefreshes: current.pendingRefreshes, pendingPrewarm: current.pendingPrewarm,
        inFlightWrites: current.inFlightWrites, runningRebuilds: current.runningRebuilds },
      pending: Array.from(s.pending.values(), span => ({ spanId: span.id, kind: span.kind, prewarm: span.prewarm, elapsedMs: now() - span.started })),
      events: s.events.map(item => ({ ...item.event })),
      endpoint: 'view.finalize is a phase, not proof of fresh interactive user_ready; check the visible graph and one interaction' };
  };
  const stop = reason => {
    if (session?.active) {
      const s = session;
      if (s.timer != null) window.clearTimeout(s.timer);
      s.timer = null;
      stopWindowObservers(s);
      for (const id of Array.from(s.pending.keys())) finish({ session: s, id }, 'unfinished');
      s.finalCounters = snapshot(); s.ended = now(); s.active = false; s.reason = reason;
    }
    return report();
  };
  // Diagnostic errors must never affect plugin operations. No business fields,
  // file paths, titles, source text or arbitrary exception messages are exported.
  const guard = (fn, fallback = null) => (...args) => { try { return fn(...args); } catch (_) { return fallback; } };
  const api = {
    start: guard((options = {}) => {
      if (disposed) return { active: false, status: 'unloaded' };
      const requested = Number(options?.seconds);
      const seconds = Number.isFinite(requested) ? Math.max(1, Math.min(300, requested)) : 60;
      stop('replaced');
      session = { id: `mfw-${instanceId}-${++serial}`, active: true, started: now(), ended: null, reason: 'recording', seconds,
        events: [], phaseTotals: new Map(), rejectedSpans: 0, bytes: 0, dropped: 0, pending: new Map(), next: 0, baseline: snapshot(), finalCounters: null, timer: null };
      const current = session;
      startWindowObservers(current);
      current.timer = window.setTimeout(() => { if (session === current) api.stop('timeout'); }, seconds * 1000);
      return report();
    }),
    report: guard(report),
    stop: guard(reason => stop(['timeout','unloaded'].includes(reason) ? reason : 'stopped')),
    begin: guard((kind, data = {}) => {
      if (!session?.active || !['render','prefix-query','prewarm-job','interaction','label-overlay'].includes(kind)) return null;
      if (session.pending.size >= MAX_PENDING) { session.dropped++; session.rejectedSpans++; return null; }
      const id = ++session.next, started = now();
      const span = { id, kind, prewarm: data.prewarm === true, started, last: started };
      session.pending.set(id, span);
      return { session, id };
    }),
    phase: guard((token, phase, data) => {
      if (!valid(token) || !phases.has(phase)) return;
      const span = session.pending.get(token.id), at = now();
      push(session, { spanId: token.id, kind: span.kind, prewarm: span.prewarm, phase,
        elapsedMs: at - span.started, durationMs: at - span.last, ...safeFields(data) });
      span.last = at;
    }),
    end: guard(finish),
    dispose: guard(() => { const result = stop('unloaded'); disposed = true; return result; })
  };
  return api;
}

const DEFAULT_SETTINGS = {
  sourceNotePath: '做mermaid图的悬浮窗.md',
  enableTiming: true,
  enableFoldIndex: true,
  enableReferenceIndex: true,
  enableNodeIndex: true,
  enableRenderCache: true,
  enableSubgraphReadableLabels: true,
};

const WIDGET_ID = 'mermaid-floating-widget';
const API_VERSION = 1;
const FOLD_INDEX_FILE = 'mermaid-fold-index.json';
const REFERENCE_INDEX_FILE = 'mermaid-reference-index.json';
const NODE_INDEX_FILE = 'mermaid-node-index.json';
const RENDER_CACHE_FILE = 'mermaid-render-cache.json';
const RENDER_CACHE_SCHEMA_VERSION = 3;
const RENDER_CACHE_MAX_ENTRIES = 20;
const INDEX_ASSET_NAMES = ['fold', 'reference', 'node', 'render'];
const INDEX_FLUSH_DELAY_MS = 500;
const INDEX_REFRESH_DELAY_MS = 250;
const REFERENCE_SNAPSHOT_DEADLINE_MS = 5000;
const REFERENCE_REFRESH_RETRY_DELAYS_MS = [100, 300];
const INDEX_WRITE_RETRY_DELAYS_MS = [250, 1000];
const INDEX_REBUILD_RETRY_DELAYS_MS = [500, 1500];
const INDEX_UNLOAD_WRITE_WAIT_MS = 2000;
const INDEX_WRITE_COORDINATOR_KEY = '__mermaidFloatingWidgetIndexWriteCoordinatorV1';

function sanitizeText(value, fallback = '') {
  const text = String(value == null ? '' : value).trim();
  return text || fallback;
}

function normalizeSettings(saved = {}) {
  return Object.assign({}, DEFAULT_SETTINGS, saved || {});
}

function extractAtomIdFromText(text) {
  const match = String(text || '').match(/ATOM@[\d\.A-Z\+]+/i);
  return match ? match[0].toUpperCase() : '';
}

function getFrontmatterFoldValue(cache) {
  return cache?.frontmatter?.['图折叠'] === true;
}

function getFileMtime(file) {
  return Number(file?.stat?.mtime || 0);
}

function createEmptyRenderCache() {
  return { schemaVersion: RENDER_CACHE_SCHEMA_VERSION, updatedAt: '', entries: {}, byTargetPrefix: {} };
}

function sameScalarFields(left, right, fields) {
  return fields.every((field) => (left?.[field] ?? null) === (right?.[field] ?? null));
}

function areFoldEntriesSemanticallyEqual(left, right) {
  return sameScalarFields(left, right, ['path', 'atomId', 'basename', 'fold']);
}

function areNodeEntriesSemanticallyEqual(left, right) {
  return sameScalarFields(left, right, [
    'path', 'basename', 'name', 'mermaidViewComplete', 'mermaidViewBayes',
    'mermaidViewStandard', 'mermaidViewPending', 'mermaidViewAI',
    'mermaidViewHighlight', 'isFolded'
  ]);
}

function areReferenceEntriesSemanticallyEqual(left, right) {
  if (!sameScalarFields(left, right, ['path', 'atomId', 'basename', 'mtime'])) return false;
  const leftRefs = Array.isArray(left?.refs) ? left.refs : [];
  const rightRefs = Array.isArray(right?.refs) ? right.refs : [];
  return leftRefs.length === rightRefs.length && leftRefs.every((value, index) => value === rightRefs[index]);
}

function createDeadlineError(label) {
  const error = new Error(`${label || 'operation'} timed out`);
  error.code = 'MERMAID_INDEX_DEADLINE';
  return error;
}

function getIndexWriteCoordinator() {
  const existing = window[INDEX_WRITE_COORDINATOR_KEY];
  if (existing?.version === 1 && typeof existing.assets?.get === 'function' && typeof existing.assets?.set === 'function') return existing;
  const coordinator = { version: 1, assets: new Map() };
  window[INDEX_WRITE_COORDINATOR_KEY] = coordinator;
  return coordinator;
}

function normalizeRenderCacheCache(raw) {
  const cache = raw && typeof raw === 'object' ? raw : {};
  const hasEntries = !!cache.entries && typeof cache.entries === 'object';
  const hasByTargetPrefix = !!cache.byTargetPrefix && typeof cache.byTargetPrefix === 'object';
  const entries = hasEntries ? cache.entries : {};
  const byTargetPrefix = hasByTargetPrefix ? { ...cache.byTargetPrefix } : {};
  let changed = Number(cache.schemaVersion || 0) !== RENDER_CACHE_SCHEMA_VERSION || !hasEntries || !hasByTargetPrefix;
  Object.values(entries).forEach((entry) => {
    const prefix = String(entry?.targetPrefix || '').trim();
    if (!prefix || !entry?.svgOuterHTML) return;
    if (!byTargetPrefix[prefix]?.stable) {
      byTargetPrefix[prefix] = {
        targetPrefix: prefix,
        stable: entry,
        pending: null,
        dirty: false,
        generation: Number(byTargetPrefix[prefix]?.generation || 0),
        updatedAt: entry.createdAt || entry.lastUsedAt || cache.updatedAt || ''
      };
      changed = true;
    }
  });
  return {
    cache: {
      schemaVersion: RENDER_CACHE_SCHEMA_VERSION,
      updatedAt: cache.updatedAt || '',
      entries,
      byTargetPrefix
    },
    changed
  };
}

class MermaidFloatingWidgetSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Mermaid Floating Widget' });
    containerEl.createEl('p', { text: '设置 Mermaid 悬浮窗插件的源笔记、索引与调试选项。插件不再运行 Templater 脚本；Source note 仅用于兼容与索引。' });

    new Setting(containerEl)
      .setName('Source note path')
      .setDesc('用于兼容原始 Templater 脚本所在的源笔记路径，以及后续索引重建的默认入口。')
      .addText((text) => {
        text.setPlaceholder(DEFAULT_SETTINGS.sourceNotePath);
        text.setValue(this.plugin.settings.sourceNotePath);
        text.onChange(async (value) => {
          this.plugin.settings.sourceNotePath = sanitizeText(value, DEFAULT_SETTINGS.sourceNotePath);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable timing logs')
      .setDesc('在 console 输出 toggle 与 rebuild 的关键诊断信息，便于排查插件加载和索引更新。')
      .addToggle((toggle) => {
        toggle.setValue(!!this.plugin.settings.enableTiming);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableTiming = !!value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable fold index')
      .setDesc('生成 mermaid-fold-index.json，缓存“图折叠” frontmatter。')
      .addToggle((toggle) => {
        toggle.setValue(!!this.plugin.settings.enableFoldIndex);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableFoldIndex = !!value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable reference index')
      .setDesc('生成 mermaid-reference-index.json，缓存 ATOM/wiki 引用和反向引用。')
      .addToggle((toggle) => {
        toggle.setValue(!!this.plugin.settings.enableReferenceIndex);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableReferenceIndex = !!value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable node index')
      .setDesc('生成 mermaid-node-index.json，缓存节点路径、标题和 Mermaid frontmatter 标记，用于绕开弹窗时的 Dataview 全量查询。')
      .addToggle((toggle) => {
        toggle.setValue(!!this.plugin.settings.enableNodeIndex);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableNodeIndex = !!value;
          await this.plugin.saveSettings();
          if (value) await this.plugin.rebuildNodeIndex({ notice: true });
        });
      });

    new Setting(containerEl)
      .setName('Enable render cache')
      .setDesc('生成 mermaid-render-cache.json，缓存已渲染 SVG；图结构和折叠状态未变化时跳过 Mermaid render。')
      .addToggle((toggle) => {
        toggle.setValue(!!this.plugin.settings.enableRenderCache);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableRenderCache = !!value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable subgraph readable labels')
      .setDesc('为缩放后的 subgraph 叠加可读标签；关闭后仅保留 Mermaid 原生 subgraph 标签，以减少渲染和布局开销。')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.enableSubgraphReadableLabels !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.enableSubgraphReadableLabels = !!value;
          await this.plugin.saveSettings();
        });
      });
  }
}

module.exports = class MermaidFloatingWidgetPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.foldIndex = { schemaVersion: 1, updatedAt: '', entries: {} };
    this.referenceIndex = { schemaVersion: 1, updatedAt: '', entries: {} };
    this.nodeIndex = { schemaVersion: 1, updatedAt: '', entries: {} };
    this.renderCache = createEmptyRenderCache();
    this.initializeIndexMaintenanceState();

    await this.loadIndexes();
    this.publishApi();

    this.addRibbonIcon('waypoints', 'Toggle Mermaid floating widget', async () => this.toggleWidget());
    this.addCommand({ id: 'toggle-mermaid-floating-widget', name: 'Toggle Mermaid floating widget', callback: async () => this.toggleWidget() });
    this.addCommand({ id: 'rebuild-mermaid-fold-index', name: 'Rebuild Mermaid fold index', callback: async () => this.rebuildFoldIndex({ notice: true }) });
    this.addCommand({ id: 'rebuild-mermaid-reference-index', name: 'Rebuild Mermaid reference index', callback: async () => this.rebuildReferenceIndex({ notice: true }) });
    this.addCommand({ id: 'rebuild-mermaid-node-index', name: 'Rebuild Mermaid node index', callback: async () => this.rebuildNodeIndex({ notice: true }) });

    this.registerEvent(this.app.metadataCache.on('changed', (file) => this.queueFileIndexRefresh(file, { source: 'metadata-changed' })));
    this.registerEvent(this.app.vault.on('create', (file) => this.handleCreate(file)));
    this.registerEvent(this.app.vault.on('modify', (file) => this.queueFileIndexRefresh(file, { source: 'vault-modify' })));
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.handleRename(file, oldPath)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.handleDelete(file)));

    this.addSettingTab(new MermaidFloatingWidgetSettingTab(this.app, this));
    this.queueFullIndexWarmup();
  }

  async onunload() {
    if (this.indexLifecycleState !== 'active') return;
    this.performanceDiagnostics?.dispose();
    this.nodePrefixIndex = null;
    this.indexLifecycleState = 'quiescing';
    this.indexEpoch += 1;
    this.cancelIndexMaintenanceDeferredWork();
    this.closeWidgetIfOpen();
    const drainedAssets = await this.drainAssetWriteChains(INDEX_UNLOAD_WRITE_WAIT_MS);
    this.normalizeOrphanRenderPendingForFinalFlush();
    await this.flushDirtyAssets({ final: true, allowedAssets: drainedAssets, awaitWrites: false });
    await this.waitForAssetWriteChains(drainedAssets, INDEX_UNLOAD_WRITE_WAIT_MS, 'final');
    if (window.mermaidFloatingWidgetApi?.owner === this) delete window.mermaidFloatingWidgetApi;
    this.indexLifecycleState = 'unloaded';
  }

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  initializeIndexMaintenanceState() {
    this.nodePrefixIndex = null;
    this.performanceDiagnostics = createMermaidPerformanceDiagnostics(this);
    this.indexLifecycleState = 'active';
    this.indexEpoch = 1;
    this.nextIndexTokenId = 1;
    this.referenceSourceRevision = 0;
    this.indexWriteCoordinator = getIndexWriteCoordinator();
    this.pathRefreshStates = new Map();
    this.flushTimer = null;
    this.flushRequested = false;
    this.persistenceBarrierDepth = 0;
    this.startupBarrierOpen = false;
    this.startupSuppressedAssets = new Set();
    this.rebuildTimer = null;
    this.renderPrewarmTimers = new Map();
    this.renderPrewarmIdleHandles = new Map();
    this.referenceDeadlineAttempts = new Set();
    this.indexDiagnostics = {
      events: {},
      queuedRefreshes: 0,
      coalescedRefreshes: 0,
      refreshCommits: 0,
      staleRefreshes: 0,
      referenceReads: 0,
      stringifies: {},
      stringifyBytes: {},
      writes: {},
      writeBytes: {},
      writeFailures: {},
      retries: {},
    };
    this.assetStates = new Map(INDEX_ASSET_NAMES.map((name) => [name, {
      name,
      generation: 0,
      persistedGeneration: 0,
      enqueuedThroughGeneration: 0,
      writeChain: Promise.resolve(),
      writeInFlight: false,
      writeRetryTimer: null,
      writeRetryGeneration: 0,
      writeRetryAttempt: 0,
      writeRetryExhaustedGeneration: 0,
      rebuild: {
        latestToken: null,
        chain: Promise.resolve(),
        queuedCount: 0,
        running: false,
        retryTimer: null,
        retryResolve: null,
        attempt: 0,
      },
    }]));
  }

  isIndexWorkActive() {
    return this.indexLifecycleState === 'active';
  }

  allocateIndexToken(path, kind = 'refresh') {
    return Object.freeze({ id: this.nextIndexTokenId++, path: String(path || ''), kind });
  }

  getAssetFileName(name) {
    return {
      fold: FOLD_INDEX_FILE,
      reference: REFERENCE_INDEX_FILE,
      node: NODE_INDEX_FILE,
      render: RENDER_CACHE_FILE,
    }[name] || '';
  }

  getAssetValue(name) {
    return { fold: this.foldIndex, reference: this.referenceIndex, node: this.nodeIndex, render: this.renderCache }[name];
  }

  setAssetValue(name, value) {
    if (name === 'fold') this.foldIndex = value;
    else if (name === 'reference') this.referenceIndex = value;
    else if (name === 'node') { this.nodeIndex = value; this.nodePrefixIndex = null; }
    else if (name === 'render') this.renderCache = value;
  }

  isAssetEnabled(name) {
    return {
      fold: this.settings.enableFoldIndex,
      reference: this.settings.enableReferenceIndex,
      node: this.settings.enableNodeIndex,
      render: this.settings.enableRenderCache,
    }[name] !== false;
  }

  incrementDiagnostic(bucket, key, amount = 1) {
    if (!this.indexDiagnostics?.[bucket]) this.indexDiagnostics[bucket] = {};
    this.indexDiagnostics[bucket][key] = Number(this.indexDiagnostics[bucket][key] || 0) + amount;
  }

  markAssetMutated(name, reason = 'mutation', options = {}) {
    const state = this.assetStates.get(name);
    if (!state) return false;
    if (!this.isIndexWorkActive() && options.allowQuiescing !== true) return false;
    state.generation += 1;
    state.writeRetryExhaustedGeneration = 0;
    state.lastMutationReason = reason;
    if (state.writeRetryTimer) {
      window.clearTimeout(state.writeRetryTimer);
      state.writeRetryTimer = null;
      state.writeRetryAttempt = 0;
      state.writeRetryGeneration = 0;
    }
    if (options.schedule !== false) this.scheduleFlushIndexes();
    return true;
  }

  getPluginDataPath(fileName) {
    return `${this.manifest.dir}/${fileName}`;
  }

  async readJson(fileName, fallback) {
    try {
      const raw = await this.app.vault.adapter.read(this.getPluginDataPath(fileName));
      return Object.assign({}, fallback, JSON.parse(raw));
    } catch (_) {
      return fallback;
    }
  }

  async writeJson(fileName, value) {
    await this.app.vault.adapter.write(this.getPluginDataPath(fileName), JSON.stringify(value, null, 2));
  }

  async loadIndexes() {
    this.foldIndex = await this.readJson(FOLD_INDEX_FILE, this.foldIndex);
    this.referenceIndex = await this.readJson(REFERENCE_INDEX_FILE, this.referenceIndex);
    this.nodeIndex = await this.readJson(NODE_INDEX_FILE, this.nodeIndex);
    const rawRenderCache = await this.readJson(RENDER_CACHE_FILE, this.renderCache);
    const normalizedRenderCache = normalizeRenderCacheCache(rawRenderCache);
    this.renderCache = normalizedRenderCache.cache;
    if (normalizedRenderCache.changed) {
      this.markAssetMutated('render', 'load-normalization', { schedule: false });
    }
  }

  scheduleFlushIndexes() {
    if (!this.isIndexWorkActive()) return false;
    this.flushRequested = true;
    if (this.persistenceBarrierDepth > 0) return true;
    if (this.flushTimer) window.clearTimeout(this.flushTimer);
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      this.flushRequested = false;
      this.flushDirtyAssets().catch((error) => console.warn('[MermaidFloatingWidget][index.flush.fail]', error));
    }, INDEX_FLUSH_DELAY_MS);
    return true;
  }

  queueFullIndexWarmup() {
    if (!this.isIndexWorkActive()) return;
    if (this.rebuildTimer) window.clearTimeout(this.rebuildTimer);
    if (!this.startupBarrierOpen) {
      this.startupBarrierOpen = true;
      this.persistenceBarrierDepth += 1;
    }
    this.startupSuppressedAssets = new Set();
    this.rebuildTimer = window.setTimeout(async () => {
      this.rebuildTimer = null;
      const names = ['fold', 'node', 'reference'].filter((name) => this.isAssetEnabled(name) && !this.startupSuppressedAssets.has(name));
      names.forEach((name) => this.requestAssetRebuild(name, { source: 'startup', notice: false }));
      await this.waitForRebuildAssetsIdle(['fold', 'node', 'reference']);
      this.closeStartupPersistenceBarrier();
    }, 1500);
  }

  closeStartupPersistenceBarrier() {
    if (!this.startupBarrierOpen) return;
    this.startupBarrierOpen = false;
    this.persistenceBarrierDepth = Math.max(0, this.persistenceBarrierDepth - 1);
    if (this.persistenceBarrierDepth === 0 && (this.flushRequested || this.hasDirtyAssets())) this.scheduleFlushIndexes();
  }

  hasDirtyAssets() {
    return INDEX_ASSET_NAMES.some((name) => {
      const state = this.assetStates.get(name);
      return this.isAssetEnabled(name) && state && state.generation > state.persistedGeneration;
    });
  }

  async flushDirtyAssets(options = {}) {
    const allowed = options.allowedAssets instanceof Set ? options.allowedAssets : new Set(INDEX_ASSET_NAMES);
    const writes = [];
    for (const name of INDEX_ASSET_NAMES) {
      const state = this.assetStates.get(name);
      if (!state || !allowed.has(name) || !this.isAssetEnabled(name)) continue;
      if (state.generation <= state.persistedGeneration) continue;
      writes.push(this.enqueueAssetWrite(name, { final: options.final === true }));
    }
    if (options.awaitWrites === false) return writes;
    await Promise.allSettled(writes);
  }

  runCoordinatedAssetWrite(name, writeOperation) {
    const coordinator = this.indexWriteCoordinator || getIndexWriteCoordinator();
    let slot = coordinator.assets.get(name);
    if (!slot) {
      slot = { tail: Promise.resolve(), sequence: 0 };
      coordinator.assets.set(name, slot);
    }
    slot.sequence += 1;
    const operation = slot.tail.catch(() => undefined).then(() => writeOperation());
    slot.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }

  enqueueAssetWrite(name, options = {}) {
    const state = this.assetStates.get(name);
    if (!state) return Promise.resolve(false);
    if (!this.isIndexWorkActive() && !(options.final === true && this.indexLifecycleState === 'quiescing')) return state.writeChain;
    const requestedGeneration = state.generation;
    if (options.final !== true && options.forceRetry !== true
      && state.writeRetryExhaustedGeneration === requestedGeneration) return state.writeChain;
    if (state.enqueuedThroughGeneration >= requestedGeneration) return state.writeChain;
    state.enqueuedThroughGeneration = requestedGeneration;
    state.writeChain = state.writeChain.catch(() => undefined).then(async () => {
      if (!this.isIndexWorkActive() && !(options.final === true && this.indexLifecycleState === 'quiescing')) return false;
      const generation = state.generation;
      if (generation <= state.persistedGeneration) return true;
      const value = this.getAssetValue(name);
      let serialized;
      try {
        serialized = JSON.stringify(value, null, 2);
      } catch (error) {
        this.handleAssetWriteFailure(name, generation, error, options);
        return false;
      }
      this.incrementDiagnostic('stringifies', name);
      this.incrementDiagnostic('stringifyBytes', name, serialized.length);
      state.writeInFlight = true;
      try {
        await this.runCoordinatedAssetWrite(name, () => this.app.vault.adapter.write(
          this.getPluginDataPath(this.getAssetFileName(name)), serialized
        ));
        state.persistedGeneration = Math.max(state.persistedGeneration, generation);
        state.writeRetryAttempt = 0;
        state.writeRetryGeneration = 0;
        state.writeRetryExhaustedGeneration = 0;
        this.incrementDiagnostic('writes', name);
        this.incrementDiagnostic('writeBytes', name, serialized.length);
        return true;
      } catch (error) {
        this.handleAssetWriteFailure(name, generation, error, options);
        return false;
      } finally {
        state.writeInFlight = false;
        if (state.generation > state.persistedGeneration && this.isIndexWorkActive() && !state.writeRetryTimer
          && state.writeRetryExhaustedGeneration !== state.generation) this.scheduleFlushIndexes();
      }
    });
    return state.writeChain;
  }

  handleAssetWriteFailure(name, generation, error, options = {}) {
    const state = this.assetStates.get(name);
    if (!state) return;
    state.enqueuedThroughGeneration = state.persistedGeneration;
    this.incrementDiagnostic('writeFailures', name);
    console.warn('[MermaidFloatingWidget][asset.write.fail]', { asset: name, generation, error });
    if (options.final === true || !this.isIndexWorkActive() || state.generation !== generation) return;
    if (state.writeRetryGeneration !== generation) {
      state.writeRetryGeneration = generation;
      state.writeRetryAttempt = 0;
      state.writeRetryExhaustedGeneration = 0;
    }
    if (state.writeRetryAttempt >= INDEX_WRITE_RETRY_DELAYS_MS.length) {
      state.writeRetryExhaustedGeneration = generation;
      return;
    }
    const delay = INDEX_WRITE_RETRY_DELAYS_MS[state.writeRetryAttempt++];
    if (state.writeRetryTimer) window.clearTimeout(state.writeRetryTimer);
    state.writeRetryTimer = window.setTimeout(() => {
      state.writeRetryTimer = null;
      if (!this.isIndexWorkActive() || state.generation !== generation) return;
      this.incrementDiagnostic('retries', `${name}:write`);
      this.enqueueAssetWrite(name);
    }, delay);
  }

  async settleWithin(promise, timeoutMs, label) {
    let timer = null;
    try {
      return await Promise.race([
        Promise.resolve(promise).then((value) => ({ ok: true, value })),
        new Promise((resolve) => {
          timer = window.setTimeout(() => resolve({ ok: false, timeout: true, label }), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  }

  async drainAssetWriteChains(timeoutMs) {
    const drained = new Set();
    const pending = INDEX_ASSET_NAMES.map((name) => {
      const state = this.assetStates.get(name);
      return state.writeChain.catch(() => undefined).then(() => drained.add(name));
    });
    await this.settleWithin(Promise.all(pending), timeoutMs, 'all-assets:prior-write');
    INDEX_ASSET_NAMES.filter((name) => !drained.has(name)).forEach((name) => {
      console.warn('[MermaidFloatingWidget][final-flush-skipped-prior-write-hung]', { asset: name, timeoutMs });
    });
    return drained;
  }

  async waitForAssetWriteChains(names, timeoutMs, phase) {
    const settled = new Set();
    const selected = Array.from(names || []).filter((name) => this.assetStates.has(name));
    const pending = selected.map((name) => {
      const state = this.assetStates.get(name);
      return state.writeChain.catch(() => undefined).then(() => settled.add(name));
    });
    await this.settleWithin(Promise.all(pending), timeoutMs, `all-assets:${phase}`);
    selected.filter((name) => !settled.has(name)).forEach((name) => {
      console.warn('[MermaidFloatingWidget][asset.write.wait-timeout]', { asset: name, phase, timeoutMs });
    });
  }

  normalizeOrphanRenderPendingForFinalFlush() {
    let changed = false;
    Object.values(this.renderCache?.byTargetPrefix || {}).forEach((slot) => {
      if (!slot?.pending) return;
      slot.pending = null;
      slot.dirty = true;
      slot.generation = Number(slot.generation || 0) + 1;
      slot.dirtyReason = 'unload-orphan-pending';
      slot.updatedAt = new Date().toISOString();
      changed = true;
    });
    if (changed) {
      this.renderCache.updatedAt = new Date().toISOString();
      this.markAssetMutated('render', 'unload-orphan-pending', { schedule: false, allowQuiescing: true });
    }
  }

  cancelIndexMaintenanceDeferredWork() {
    if (this.flushTimer) window.clearTimeout(this.flushTimer);
    this.flushTimer = null;
    if (this.rebuildTimer) window.clearTimeout(this.rebuildTimer);
    this.rebuildTimer = null;
    this.persistenceBarrierDepth = 0;
    this.startupBarrierOpen = false;
    this.pathRefreshStates.forEach((state) => {
      if (state.timer) window.clearTimeout(state.timer);
      if (state.retryTimer) window.clearTimeout(state.retryTimer);
    });
    this.pathRefreshStates.clear();
    this.assetStates.forEach((state) => {
      if (state.writeRetryTimer) window.clearTimeout(state.writeRetryTimer);
      state.writeRetryTimer = null;
      if (state.rebuild.retryTimer) window.clearTimeout(state.rebuild.retryTimer);
      state.rebuild.retryTimer = null;
      if (state.rebuild.retryResolve) state.rebuild.retryResolve(false);
      state.rebuild.retryResolve = null;
    });
    const cancellation = createDeadlineError('reference snapshot cancelled by unload');
    cancellation.code = 'MERMAID_INDEX_CANCELLED';
    Array.from(this.referenceDeadlineAttempts || []).forEach((attempt) => attempt.cancel(cancellation));
    this.referenceDeadlineAttempts?.clear();
    this.renderPrewarmTimers.forEach((handle) => {
      if (handle?.timer) window.clearTimeout(handle.timer);
      if (handle?.idle != null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle.idle);
    });
    this.renderPrewarmTimers.clear();
    this.renderPrewarmIdleHandles.clear();
  }

  isMarkdownFile(file) {
    return file instanceof TFile && file.extension === 'md';
  }

  isCandidateMermaidFile(file) {
    if (!this.isMarkdownFile(file)) return false;
    const basename = String(file.basename || '');
    return basename.includes('ATOM@') || basename.includes('+') || basename.includes('.');
  }

  makeFoldEntry(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    return {
      path: file.path,
      atomId: extractAtomIdFromText(file.basename || file.path),
      basename: file.basename,
      fold: getFrontmatterFoldValue(cache),
      mtime: getFileMtime(file),
      updatedAt: new Date().toISOString(),
    };
  }

  makeNodeEntry(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter || {};
    return {
      path: file.path,
      basename: file.basename,
      name: file.name,
      mtime: getFileMtime(file),
      mermaidViewComplete: frontmatter['mermaid应用的范式'] === true,
      mermaidViewBayes: frontmatter['mermaid贝叶斯'] === true,
      mermaidViewStandard: frontmatter['mermaid批判式标准'] === true,
      mermaidViewPending: frontmatter['mermaid未闭环'] === true,
      mermaidViewAI: frontmatter['mermaid关键词'] === true,
      mermaidViewHighlight: frontmatter['mermaid视图重点'] === true,
      isFolded: getFrontmatterFoldValue(cache),
      updatedAt: new Date().toISOString(),
    };
  }

  makeReferenceEntryFromContent(file, content, validatedStat = null) {
    const refs = this.extractBodyReferenceTargets(content);
    return {
      path: file.path,
      atomId: extractAtomIdFromText(file.basename || file.path),
      basename: file.basename,
      refs,
      mtime: Number(validatedStat?.mtime || getFileMtime(file)),
      updatedAt: new Date().toISOString(),
    };
  }

  async runWithReferenceDeadline(operation, label) {
    let cancelReject = null;
    const attempt = {
      timer: null,
      settled: false,
      cancel: (error) => {
        if (attempt.settled) return false;
        attempt.settled = true;
        if (attempt.timer) window.clearTimeout(attempt.timer);
        this.referenceDeadlineAttempts.delete(attempt);
        cancelReject(error);
        return true;
      },
    };
    const cancellation = new Promise((_, reject) => { cancelReject = reject; });
    this.referenceDeadlineAttempts.add(attempt);
    attempt.timer = window.setTimeout(
      () => attempt.cancel(createDeadlineError(label)),
      REFERENCE_SNAPSHOT_DEADLINE_MS
    );
    try {
      return await Promise.race([
        Promise.resolve().then(operation),
        cancellation,
      ]);
    } finally {
      if (!attempt.settled) {
        attempt.settled = true;
        if (attempt.timer) window.clearTimeout(attempt.timer);
        this.referenceDeadlineAttempts.delete(attempt);
      }
    }
  }

  async readReferenceSnapshot(file) {
    const path = String(file?.path || '');
    if (!path) throw new Error('Reference snapshot requires a path');
    return this.runWithReferenceDeadline(async () => {
      const before = await this.app.vault.adapter.stat(path);
      if (!before) throw new Error(`Reference stat missing before read: ${path}`);
      const content = await this.app.vault.read(file);
      this.indexDiagnostics.referenceReads += 1;
      const resolved = this.app.vault.getAbstractFileByPath(path);
      const after = await this.app.vault.adapter.stat(path);
      if (!(resolved instanceof TFile) || resolved.path !== path || !after
        || Number(before.mtime || 0) !== Number(after.mtime || 0)
        || Number(before.size || 0) !== Number(after.size || 0)) {
        const error = new Error(`Reference snapshot changed during read: ${path}`);
        error.code = 'MERMAID_REFERENCE_UNSTABLE';
        throw error;
      }
      return {
        entry: this.makeReferenceEntryFromContent(resolved, content, after),
        stat: { mtime: Number(after.mtime || 0), size: Number(after.size || 0) },
      };
    }, `reference:${path}`);
  }

  extractBodyReferenceTargets(content) {
    const body = String(content || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/m, '').trim();
    const refs = new Set();
    let match;
    const wikiRegex = /\[\[([^\]]+)\]\]/g;
    while ((match = wikiRegex.exec(body)) !== null) {
      let rawTarget = String(match[1] || '').trim();
      const pipeIndex = rawTarget.indexOf('|');
      if (pipeIndex > -1) rawTarget = rawTarget.slice(0, pipeIndex).trim();
      const hashIndex = rawTarget.indexOf('#');
      if (hashIndex > -1) rawTarget = rawTarget.slice(0, hashIndex).trim();
      const atomId = extractAtomIdFromText(rawTarget);
      if (atomId) refs.add(atomId);
    }
    const atomRegex = /ATOM@[\d\.A-Z\+]+/gi;
    while ((match = atomRegex.exec(body)) !== null) refs.add(String(match[0] || '').toUpperCase());
    return Array.from(refs).sort();
  }

  async buildAssetSnapshot(name) {
    const files = this.app.vault.getMarkdownFiles().filter((file) => this.isCandidateMermaidFile(file));
    const entries = {};
    if (name === 'fold') files.forEach((file) => { entries[file.path] = this.makeFoldEntry(file); });
    else if (name === 'node') files.forEach((file) => { entries[file.path] = this.makeNodeEntry(file); });
    else if (name === 'reference') {
      const validations = [];
      for (const file of files) {
        const snapshot = await this.readReferenceSnapshot(file);
        entries[file.path] = snapshot.entry;
        validations.push({ path: file.path, stat: snapshot.stat });
      }
      await this.runWithReferenceDeadline(async () => {
        for (const validation of validations) {
          const current = await this.app.vault.adapter.stat(validation.path);
          if (!current || Number(current.mtime || 0) !== validation.stat.mtime || Number(current.size || 0) !== validation.stat.size) {
            const error = new Error(`Reference rebuild snapshot changed before commit: ${validation.path}`);
            error.code = 'MERMAID_REFERENCE_UNSTABLE';
            throw error;
          }
        }
      }, 'reference-rebuild-final-validation');
    }
    return { schemaVersion: 1, updatedAt: new Date().toISOString(), entries };
  }

  requestAssetRebuild(name, options = {}) {
    if (!this.isIndexWorkActive() || !['fold', 'reference', 'node'].includes(name)) return Promise.resolve({ status: 'cancelled', asset: name });
    if (options.source === 'manual') this.startupSuppressedAssets.add(name);
    const assetState = this.assetStates.get(name);
    const rebuild = assetState.rebuild;
    const token = this.allocateIndexToken(name, `rebuild:${options.source || 'manual'}`);
    rebuild.latestToken = token;
    rebuild.queuedCount += 1;
    rebuild.attempt = 0;
    if (rebuild.retryTimer) {
      window.clearTimeout(rebuild.retryTimer);
      rebuild.retryTimer = null;
      if (rebuild.retryResolve) rebuild.retryResolve(false);
      rebuild.retryResolve = null;
    }
    const requestPromise = rebuild.chain.catch(() => undefined).then(async () => {
      rebuild.queuedCount = Math.max(0, rebuild.queuedCount - 1);
      return this.executeAssetRebuild(name, token, options);
    });
    rebuild.chain = requestPromise.then(() => undefined, () => undefined);
    return requestPromise.then((result) => {
      if (options.notice && result.status === 'committed') new Notice(`Mermaid ${name} index rebuilt: ${result.count} files, ${result.ms}ms`);
      return result;
    });
  }

  async executeAssetRebuild(name, token, options = {}) {
    const assetState = this.assetStates.get(name);
    const rebuild = assetState.rebuild;
    for (let attempt = 0; attempt <= INDEX_REBUILD_RETRY_DELAYS_MS.length; attempt += 1) {
      if (!this.isIndexWorkActive()) return { status: 'cancelled', asset: name };
      if (rebuild.latestToken !== token) return { status: 'superseded', asset: name };
      const epoch = this.indexEpoch;
      const generation = assetState.generation;
      const referenceRevision = name === 'reference' ? this.referenceSourceRevision : null;
      const startedAt = performance.now();
      rebuild.running = true;
      rebuild.attempt = attempt;
      try {
        const snapshot = await this.buildAssetSnapshot(name);
        if (!this.isIndexWorkActive() || epoch !== this.indexEpoch) return { status: 'cancelled', asset: name };
        if (rebuild.latestToken !== token) return { status: 'superseded', asset: name };
        if (assetState.generation !== generation) throw Object.assign(new Error('asset changed during rebuild'), { code: 'MERMAID_REBUILD_STALE' });
        if (name === 'reference' && this.referenceSourceRevision !== referenceRevision) {
          throw Object.assign(new Error('reference source changed during rebuild'), { code: 'MERMAID_REBUILD_STALE' });
        }
        this.setAssetValue(name, snapshot);
        this.markAssetMutated(name, `rebuild:${options.source || 'manual'}`);
        const ms = Math.round(performance.now() - startedAt);
        console.info(`[MermaidFloatingWidget][${name}-index.rebuild]`, { count: Object.keys(snapshot.entries).length, ms, source: options.source || 'manual' });
        return { status: 'committed', asset: name, count: Object.keys(snapshot.entries).length, ms };
      } catch (error) {
        if (rebuild.latestToken !== token) return { status: 'superseded', asset: name };
        if (!this.isIndexWorkActive()) return { status: 'cancelled', asset: name };
        if (attempt >= INDEX_REBUILD_RETRY_DELAYS_MS.length) {
          console.warn('[MermaidFloatingWidget][index.rebuild.exhausted]', { asset: name, error });
          return { status: 'exhausted', asset: name, error };
        }
        const delay = INDEX_REBUILD_RETRY_DELAYS_MS[attempt];
        const continued = await this.waitForRebuildRetry(rebuild, token, delay);
        if (!continued) return { status: this.isIndexWorkActive() ? 'superseded' : 'cancelled', asset: name };
      } finally {
        rebuild.running = false;
      }
    }
    return { status: 'exhausted', asset: name };
  }

  waitForRebuildRetry(rebuild, token, delay) {
    return new Promise((resolve) => {
      rebuild.retryResolve = resolve;
      rebuild.retryTimer = window.setTimeout(() => {
        rebuild.retryTimer = null;
        rebuild.retryResolve = null;
        resolve(this.isIndexWorkActive() && rebuild.latestToken === token);
      }, delay);
    });
  }

  async waitForRebuildAssetsIdle(names) {
    const selected = (names || []).map((name) => this.assetStates.get(name)).filter(Boolean);
    while (this.isIndexWorkActive()) {
      const tokens = selected.map((state) => state.rebuild.latestToken);
      await Promise.all(selected.map((state) => state.rebuild.chain));
      await Promise.resolve();
      const idle = selected.every((state, index) => state.rebuild.latestToken === tokens[index]
        && state.rebuild.queuedCount === 0 && !state.rebuild.running && !state.rebuild.retryTimer);
      if (idle) return true;
    }
    return false;
  }

  rebuildFoldIndex(options = {}) { return this.requestAssetRebuild('fold', { ...options, source: options.source || 'manual' }); }
  rebuildReferenceIndex(options = {}) { return this.requestAssetRebuild('reference', { ...options, source: options.source || 'manual' }); }
  rebuildNodeIndex(options = {}) { return this.requestAssetRebuild('node', { ...options, source: options.source || 'manual' }); }

  isCurrentPathToken(token) {
    return !!token && this.pathRefreshStates.get(token.path)?.token === token;
  }

  bumpReferenceSourceRevision(reason = 'source-event') {
    this.referenceSourceRevision += 1;
    this.lastReferenceSourceRevisionReason = reason;
    return this.referenceSourceRevision;
  }

  invalidatePathWork(path, reason = 'invalidate') {
    const normalized = String(path || '');
    if (!normalized) return null;
    const previous = this.pathRefreshStates.get(normalized);
    if (previous?.timer) window.clearTimeout(previous.timer);
    if (previous?.retryTimer) window.clearTimeout(previous.retryTimer);
    const token = this.allocateIndexToken(normalized, `tombstone:${reason}`);
    this.pathRefreshStates.set(normalized, { token, timer: null, retryTimer: null, inFlight: false, tombstone: true, attempt: 0 });
    return token;
  }

  queueFileIndexRefresh(file, options = {}) {
    if (!this.isIndexWorkActive() || !this.isMarkdownFile(file)) return false;
    const path = file.path;
    this.bumpReferenceSourceRevision(options.source || 'refresh');
    const previous = this.pathRefreshStates.get(path);
    if (previous?.timer) window.clearTimeout(previous.timer);
    if (previous?.retryTimer) window.clearTimeout(previous.retryTimer);
    if (previous?.timer || previous?.inFlight) this.indexDiagnostics.coalescedRefreshes += 1;
    const token = this.allocateIndexToken(path, 'refresh');
    const state = { token, timer: null, retryTimer: null, inFlight: false, tombstone: false, attempt: 0 };
    state.timer = window.setTimeout(() => {
      state.timer = null;
      this.runPathRefresh(token).catch((error) => console.warn('[MermaidFloatingWidget][index.refresh.fail]', { path, error }));
    }, INDEX_REFRESH_DELAY_MS);
    this.pathRefreshStates.set(path, state);
    this.indexDiagnostics.queuedRefreshes += 1;
    this.incrementDiagnostic('events', options.source || 'unknown');
    return true;
  }

  schedulePathRefreshRetry(token, error) {
    const state = this.pathRefreshStates.get(token.path);
    if (!state || state.token !== token || !this.isIndexWorkActive()) return false;
    if (state.attempt >= REFERENCE_REFRESH_RETRY_DELAYS_MS.length) {
      console.warn('[MermaidFloatingWidget][reference-index.refresh.exhausted]', { path: token.path, error });
      return false;
    }
    const delay = REFERENCE_REFRESH_RETRY_DELAYS_MS[state.attempt++];
    state.retryTimer = window.setTimeout(() => {
      state.retryTimer = null;
      if (!this.isCurrentPathToken(token)) return;
      this.runPathRefresh(token).catch((retryError) => console.warn('[MermaidFloatingWidget][index.refresh.retry-fail]', { path: token.path, retryError }));
    }, delay);
    return true;
  }

  applyEntryMutation(name, path, candidate, equals) {
    const asset = this.getAssetValue(name);
    const existing = asset?.entries?.[path];
    if (existing && equals(existing, candidate)) return false;
    if (!asset.entries) asset.entries = {};
    asset.entries[path] = candidate;
    if (name === 'node') this.updateNodePrefixIndex(path, candidate);
    asset.updatedAt = new Date().toISOString();
    this.markAssetMutated(name, `refresh:${path}`);
    return true;
  }

  async runPathRefresh(token) {
    if (!this.isIndexWorkActive() || !this.isCurrentPathToken(token)) return false;
    const state = this.pathRefreshStates.get(token.path);
    state.inFlight = true;
    const epoch = this.indexEpoch;
    try {
      const file = this.app.vault.getAbstractFileByPath(token.path);
      if (!this.isMarkdownFile(file)) return false;
      const candidate = this.isCandidateMermaidFile(file);
      const foldEntry = this.settings.enableFoldIndex ? this.makeFoldEntry(file) : null;
      const nodeEntry = this.settings.enableNodeIndex && candidate ? this.makeNodeEntry(file) : null;
      let referenceEntry = null;
      if (this.settings.enableReferenceIndex && candidate) {
        try { referenceEntry = (await this.readReferenceSnapshot(file)).entry; }
        catch (error) { return this.schedulePathRefreshRetry(token, error); }
      }
      if (!this.isIndexWorkActive() || epoch !== this.indexEpoch || !this.isCurrentPathToken(token)) {
        this.indexDiagnostics.staleRefreshes += 1;
        return false;
      }
      if (foldEntry) this.applyEntryMutation('fold', token.path, foldEntry, areFoldEntriesSemanticallyEqual);
      if (nodeEntry) this.applyEntryMutation('node', token.path, nodeEntry, areNodeEntriesSemanticallyEqual);
      if (referenceEntry) this.applyEntryMutation('reference', token.path, referenceEntry, areReferenceEntriesSemanticallyEqual);
      this.markRenderCacheDirtyForFile(file, 'changed');
      this.indexDiagnostics.refreshCommits += 1;
      return true;
    } finally {
      const current = this.pathRefreshStates.get(token.path);
      if (current?.token === token) {
        current.inFlight = false;
        if (!current.timer && !current.retryTimer) this.pathRefreshStates.delete(token.path);
      }
    }
  }

  deleteAssetEntry(name, path, reason) {
    const asset = this.getAssetValue(name);
    if (!asset?.entries || !Object.prototype.hasOwnProperty.call(asset.entries, path)) return false;
    delete asset.entries[path];
    if (name === 'node') this.updateNodePrefixIndex(path, null);
    asset.updatedAt = new Date().toISOString();
    this.markAssetMutated(name, reason);
    return true;
  }

  handleCreate(file) {
    this.queueFileIndexRefresh(file, { source: 'vault-create' });
  }

  handleRename(file, oldPath) {
    if (!this.isIndexWorkActive()) return;
    this.bumpReferenceSourceRevision('vault-rename');
    this.invalidatePathWork(oldPath, 'rename-old');
    if (file?.path) this.invalidatePathWork(file.path, 'rename-new');
    this.markRenderCacheDirtyForPath(oldPath, 'rename-old');
    ['fold', 'reference', 'node'].forEach((name) => this.deleteAssetEntry(name, oldPath, `rename-old:${oldPath}`));
    this.markRenderCacheDirtyForFile(file, 'rename-new');
    this.queueFileIndexRefresh(file, { source: 'vault-rename' });
  }

  handleDelete(file) {
    if (!this.isIndexWorkActive() || !file?.path) return;
    this.bumpReferenceSourceRevision('vault-delete');
    this.invalidatePathWork(file.path, 'delete');
    this.markRenderCacheDirtyForFile(file, 'delete');
    ['fold', 'reference', 'node'].forEach((name) => this.deleteAssetEntry(name, file.path, `delete:${file.path}`));
  }

  markRenderCacheDirtyForFile(file, reason) {
    if (!this.isMarkdownFile(file)) return;
    this.markRenderCacheDirtyForPath(file.path || file.basename || '', reason);
  }

  markRenderCacheDirtyForPath(path, reason) {
    const basename = String(path || '').split(/[\\/]/).pop()?.replace(/\.md$/i, '') || '';
    const nodeId = extractAtomIdFromText(basename) || basename;
    this.markRenderCacheDirtyForNodeId(nodeId, reason);
  }

  getKnownRenderTargetPrefixes() {
    const prefixes = new Set(Object.keys(this.renderCache?.byTargetPrefix || {}));
    Object.values(this.renderCache?.entries || {}).forEach((entry) => {
      if (entry?.targetPrefix) prefixes.add(String(entry.targetPrefix));
    });
    return Array.from(prefixes).filter(Boolean);
  }

  markRenderCacheDirtyForNodeId(nodeId, reason = 'changed') {
    if (!this.isIndexWorkActive() || !this.settings.enableRenderCache) return [];
    const changed = String(nodeId || '').trim();
    if (!changed) return [];
    if (!this.renderCache.byTargetPrefix) this.renderCache.byTargetPrefix = {};
    const changedUpper = changed.toUpperCase();
    const affected = this.getKnownRenderTargetPrefixes().filter((prefix) => {
      const upper = String(prefix || '').toUpperCase();
      return changedUpper === upper || changedUpper.startsWith(`${upper}.`) || changedUpper.startsWith(`${upper}+`) || upper.startsWith(`${changedUpper}.`) || upper.startsWith(`${changedUpper}+`);
    });
    affected.forEach((prefix) => {
      const existing = this.renderCache.byTargetPrefix[prefix] || { targetPrefix: prefix, stable: null, pending: null, dirty: false, generation: 0 };
      existing.dirty = true;
      existing.pending = null;
      existing.generation = Number(existing.generation || 0) + 1;
      existing.dirtyReason = reason;
      existing.dirtyNodeId = changed;
      existing.updatedAt = new Date().toISOString();
      this.renderCache.byTargetPrefix[prefix] = existing;
      this.queueRenderCachePrewarm(prefix, existing.generation, reason, changed);
    });
    if (affected.length > 0) {
      this.renderCache.updatedAt = new Date().toISOString();
      this.markAssetMutated('render', `dirty:${reason}`);
      console.info('[MermaidFloatingWidget][render-cache.dirty]', { nodeId: changed, reason, affected });
    }
    return affected;
  }

  queueRenderCachePrewarm(targetPrefix, generation, reason = 'dirty', nodeId = '') {
    if (!this.isIndexWorkActive() || !this.settings.enableRenderCache) return false;
    const prefix = String(targetPrefix || '').trim();
    if (!prefix) return false;
    if (!this.renderPrewarmTimers) this.renderPrewarmTimers = new Map();
    const existingHandle = this.renderPrewarmTimers.get(prefix);
    if (existingHandle?.timer) window.clearTimeout(existingHandle.timer);
    if (existingHandle?.idle != null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(existingHandle.idle);
    const delayMs = 6000;
    const epoch = this.indexEpoch;
    const handle = { timer: null, idle: null };
    const timer = window.setTimeout(() => {
      handle.timer = null;
      const run = () => {
        handle.idle = null;
        this.renderPrewarmTimers.delete(prefix);
        if (!this.isIndexWorkActive() || this.indexEpoch !== epoch) return;
        return this.prewarmRenderCacheForPrefix(prefix, generation, { reason, nodeId, epoch })
        .catch((error) => console.warn('[MermaidFloatingWidget][render-cache.prewarm.fail]', {
          targetPrefix: prefix,
          generation,
          reason,
          nodeId,
          error
        }));
      };
      if (typeof window.requestIdleCallback === 'function') {
        handle.idle = window.requestIdleCallback(run, { timeout: 4000 });
      } else {
        run();
      }
    }, delayMs);
    handle.timer = timer;
    this.renderPrewarmTimers.set(prefix, handle);
    console.info('[MermaidFloatingWidget][render-cache.prewarm.queue]', {
      targetPrefix: prefix,
      generation,
      reason,
      nodeId,
      delayMs
    });
    return true;
  }

  buildRenderPayloadForPrefix(targetPrefix) {
    const prefix = String(targetPrefix || '').trim();
    console.info('[MermaidFloatingWidget][render-cache.prewarm.skip]', {
      targetPrefix: prefix,
      reason: 'class-payload-builder-retired-use-hidden-core-render'
    });
    return { error: 'class-payload-builder-retired', targetPrefix: prefix };
  }

  async prewarmRenderCacheForPrefix(targetPrefix, generation, context = {}) {
    const prefix = String(targetPrefix || '').trim();
    if (!prefix || !this.isIndexWorkActive() || (context.epoch != null && context.epoch !== this.indexEpoch)) {
      console.info('[MermaidFloatingWidget][render-cache.prewarm.skip]', {
        targetPrefix: prefix,
        generation,
        reason: 'missing-prefix'
      });
      return false;
    }
    const slot = this.renderCache?.byTargetPrefix?.[prefix];
    if (!slot || Number(slot.generation || 0) !== Number(generation)) {
      console.info('[MermaidFloatingWidget][render-cache.prewarm.skip]', {
        targetPrefix: prefix,
        generation,
        currentGeneration: slot?.generation ?? null,
        reason: 'generation-changed-before-build'
      });
      return false;
    }

    const diagnosticSpan = this.performanceDiagnostics?.begin('prewarm-job', { prewarm: true });
    let diagnosticOutcome = 'error';
    try {
      const startedAt = performance.now();
      console.info('[MermaidFloatingWidget][render-cache.prewarm.start]', {
        targetPrefix: prefix,
        generation,
        reason: context.reason || 'dirty',
        nodeId: context.nodeId || null,
        mode: 'hidden-core-render'
      });
      await runMermaidFloatingWidget(this.app, { obsidian: { Notice } }, {
        ...window.mermaidFloatingWidgetApi,
        prewarmOnly: true,
        prewarmTargetPrefix: prefix,
        prewarmGeneration: generation
      });
      if (!this.isIndexWorkActive() || (context.epoch != null && context.epoch !== this.indexEpoch)) { diagnosticOutcome = 'unfinished'; return false; }
      console.info('[MermaidFloatingWidget][render-cache.prewarm.state-isolated]', {
        targetPrefix: prefix,
        generation
      });
      const refreshedSlot = this.renderCache?.byTargetPrefix?.[prefix];
      const ok = refreshedSlot && Number(refreshedSlot.generation || 0) === Number(generation) && refreshedSlot.dirty === false;
      console.info('[MermaidFloatingWidget][render-cache.prewarm.done]', {
        targetPrefix: prefix,
        generation,
        ok,
        ms: Math.round(performance.now() - startedAt),
        hasStable: !!refreshedSlot?.stable,
        dirty: refreshedSlot?.dirty === true
      });
      diagnosticOutcome = ok ? 'ok' : 'not-refreshed';
      return ok;
    } finally { this.performanceDiagnostics?.end(diagnosticSpan, diagnosticOutcome); }
  }

  publishApi() {
    const plugin = this;
    window.mermaidFloatingWidgetApi = {
      owner: this,
      version: API_VERSION,
      performance: {
        start(options) { return plugin.performanceDiagnostics.start(options); },
        report() { return plugin.performanceDiagnostics.report(); },
        stop() { return plugin.performanceDiagnostics.stop(); },
      },
      getFoldState(key) { return plugin.getFoldState(key); },
      getReferenceTargets(path) { return plugin.getReferenceTargets(path); },
      getNodeEntriesByPrefix(prefix) { return plugin.getNodeEntriesByPrefix(prefix); },
      getRenderCache(request) { return plugin.getRenderCache(request); },
      putRenderCache(key, value, options) { return plugin.putRenderCache(key, value, options); },
      markRenderCachePending(targetPrefix, pending) { return plugin.markRenderCachePending(targetPrefix, pending); },
      getIndexesSummary() {
        return {
          foldCount: Object.keys(plugin.foldIndex?.entries || {}).length,
          referenceCount: Object.keys(plugin.referenceIndex?.entries || {}).length,
          nodeCount: Object.keys(plugin.nodeIndex?.entries || {}).length,
          renderCacheCount: Object.keys(plugin.renderCache?.entries || {}).length,
          staleRenderTargetCount: Object.values(plugin.renderCache?.byTargetPrefix || {}).filter(slot => slot?.dirty).length,
        };
      },
    };
  }

  getRenderCache(request) {
    if (!this.settings.enableRenderCache) return null;
    const requestObject = typeof request === 'object' && request !== null ? request : { key: request };
    const normalized = String(requestObject.key || '').trim();
    if (!normalized) return null;
    const entry = this.renderCache?.entries?.[normalized] || null;
    if (entry) {
      if (this.isIndexWorkActive()) entry.lastUsedAt = new Date().toISOString();
      if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.hit]', {
        key: normalized,
        cacheState: 'fresh',
        codeChars: entry.codeChars,
        nodeCount: entry.nodeCount,
        createdAt: entry.createdAt,
      });
      return { ...entry, cacheState: 'fresh' };
    }

    if (!requestObject.allowStaleStable) {
      if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.miss]', {
        key: normalized,
        targetPrefix: requestObject.targetPrefix || null,
        reason: 'exact-miss-stale-disabled'
      });
      return null;
    }
    const targetPrefix = String(requestObject.targetPrefix || '').trim();
    const slot = targetPrefix ? this.renderCache?.byTargetPrefix?.[targetPrefix] : null;
    const stable = slot?.stable;
    if (!stable?.svgOuterHTML) {
      if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.miss]', {
        key: normalized,
        targetPrefix,
        reason: 'no-stable-slot',
        hasSlot: !!slot,
        dirty: slot?.dirty === true,
        generation: slot?.generation ?? null
      });
      return null;
    }
    const requiredNodeId = String(requestObject.requiredNodeId || '').trim();
    const stableContainsRequiredNode = !requiredNodeId
      || (Array.isArray(stable.nodeIds) && stable.nodeIds.includes(requiredNodeId))
      || (!Array.isArray(stable.nodeIds) && typeof stable.mermaidCode === 'string' && stable.mermaidCode.includes(requiredNodeId));
    if (!stableContainsRequiredNode) {
      if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.stale-skip]', {
        targetPrefix,
        requiredNodeId,
        reason: 'required-node-missing'
      });
      return null;
    }
    if (this.isIndexWorkActive()) stable.lastUsedAt = new Date().toISOString();
    if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.stale-hit]', {
      targetPrefix,
      exactKey: normalized,
      stableKey: stable.key,
      generation: slot.generation || 0,
      dirty: slot.dirty === true,
      codeChars: stable.codeChars,
      nodeCount: stable.nodeCount,
    });
    return { ...stable, cacheState: 'stale', exactMissKey: normalized, generation: Number(slot.generation || 0) };
  }

  putRenderCache(key, value, options = {}) {
    if (!this.isIndexWorkActive() || !this.settings.enableRenderCache) return false;
    const normalized = String(key || '').trim();
    if (!normalized || !value?.svgOuterHTML) return false;
    if (!this.renderCache.entries) this.renderCache.entries = {};
    if (!this.renderCache.byTargetPrefix) this.renderCache.byTargetPrefix = {};
    const targetPrefix = String(value.targetPrefix || '').trim();
    const slot = targetPrefix ? (this.renderCache.byTargetPrefix[targetPrefix] || { targetPrefix, stable: null, pending: null, dirty: false, generation: 0 }) : null;
    if (slot && options.expectedGeneration != null && Number(slot.generation || 0) !== Number(options.expectedGeneration)) {
      console.info('[MermaidFloatingWidget][render-cache.put.skip-generation]', {
        targetPrefix,
        key: normalized,
        expectedGeneration: options.expectedGeneration,
        currentGeneration: slot.generation || 0,
        dirty: slot.dirty === true,
        hasStable: !!slot.stable,
        source: options.source || 'foreground'
      });
      return false;
    }
    const entries = this.renderCache.entries || {};
    entries[normalized] = {
      ...value,
      key: normalized,
      schemaVersion: RENDER_CACHE_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    const sorted = Object.values(entries)
      .sort((a, b) => String(b.lastUsedAt || b.createdAt || '').localeCompare(String(a.lastUsedAt || a.createdAt || '')));
    this.renderCache.entries = {};
    sorted.slice(0, RENDER_CACHE_MAX_ENTRIES).forEach((entry) => {
      if (entry?.key) this.renderCache.entries[entry.key] = entry;
    });
    const stableEntry = this.renderCache.entries[normalized] || entries[normalized];
    if (slot && stableEntry) {
      slot.stable = stableEntry;
      slot.pending = null;
      slot.dirty = false;
      slot.updatedAt = new Date().toISOString();
      this.renderCache.byTargetPrefix[targetPrefix] = slot;
    }
    this.renderCache.schemaVersion = RENDER_CACHE_SCHEMA_VERSION;
    this.renderCache.updatedAt = new Date().toISOString();
    this.markAssetMutated('render', `put:${options.source || 'foreground'}`);
    if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.put]', {
      key: normalized,
      targetPrefix,
      generation: slot ? slot.generation || 0 : null,
      source: options.source || 'foreground',
      count: Object.keys(this.renderCache.entries).length,
      codeChars: value.codeChars,
      nodeCount: value.nodeCount,
    });
    return true;
  }

  markRenderCachePending(targetPrefix, pending = {}) {
    if (!this.isIndexWorkActive() || !this.settings.enableRenderCache) return false;
    const prefix = String(targetPrefix || '').trim();
    if (!prefix) return false;
    if (!this.renderCache.byTargetPrefix) this.renderCache.byTargetPrefix = {};
    const slot = this.renderCache.byTargetPrefix[prefix] || { targetPrefix: prefix, stable: null, pending: null, dirty: false, generation: 0 };
    if (pending.generation != null && Number(slot.generation || 0) !== Number(pending.generation)) {
      console.info('[MermaidFloatingWidget][render-cache.pending.skip-generation]', {
        targetPrefix: prefix,
        key: pending.key,
        expectedGeneration: pending.generation,
        currentGeneration: slot.generation || 0,
        dirty: slot.dirty === true,
        hasStable: !!slot.stable
      });
      return false;
    }
    slot.pending = {
      ...pending,
      targetPrefix: prefix,
      startedAt: new Date().toISOString()
    };
    slot.updatedAt = new Date().toISOString();
    this.renderCache.byTargetPrefix[prefix] = slot;
    this.markAssetMutated('render', 'pending');
    if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][render-cache.pending]', {
      targetPrefix: prefix,
      key: pending.key,
      generation: slot.generation || 0
    });
    return true;
  }

  updateNodePrefixIndex(path, entry) {
    if (!this.nodePrefixIndex) return;
    // Integer property keys have special Object.keys ordering. Rebuild their
    // exceptional case rather than changing legacy locale-sort tie behavior.
    const n = Number(path);
    const integerKey = Number.isInteger(n) && n >= 0 && n < 4294967295 && String(n) === path;
    if (integerKey || this.nodePrefixIndex.source !== this.nodeIndex?.entries) {
      this.nodePrefixIndex = null;
      return;
    }
    this.nodePrefixIndex.update(path, entry);
  }

  getNodeEntriesByPrefix(prefix) {
    if (!this.settings.enableNodeIndex) return null;
    const normalized = String(prefix || '').trim();
    if (!normalized) return null;
    const span = this.performanceDiagnostics?.begin('prefix-query');
    let outcome = 'error';
    try {
      const source = this.nodeIndex?.entries || {};
      let builtRows = 0;
      if (!this.nodePrefixIndex || this.nodePrefixIndex.source !== source) {
        this.nodePrefixIndex = new MermaidPrefixIndex(source);
        builtRows = this.nodePrefixIndex.rows.length;
      }
      const query = this.nodePrefixIndex.query(normalized);
      const entries = query.entries
        .map((entry) => ({
          file: {
            name: entry.name || `${entry.basename}.md`,
            path: entry.path,
          },
          mermaidViewComplete: entry.mermaidViewComplete === true,
          mermaidViewBayes: entry.mermaidViewBayes === true,
          mermaidViewStandard: entry.mermaidViewStandard === true,
          mermaidViewPending: entry.mermaidViewPending === true,
          mermaidViewAI: entry.mermaidViewAI === true,
          mermaidViewHighlight: entry.mermaidViewHighlight === true,
          isFolded: entry.isFolded === true,
        }));
      if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][node-index.query]', { prefix: normalized, count: entries.length });
      this.performanceDiagnostics?.phase(span, 'prefix.query', {
        nodeCount: entries.length, indexSize: this.nodePrefixIndex.rows.length,
        inspected: query.inspected, builtRows
      });
      outcome = 'ok';
      return entries;
    } finally { this.performanceDiagnostics?.end(span, outcome); }
  }

  getFoldState(key) {
    const normalized = String(key || '').trim();
    if (!normalized) return null;
    const entries = Object.values(this.foldIndex?.entries || {});
    const match = this.foldIndex.entries?.[normalized]
      || entries.find((entry) => entry.atomId === normalized.toUpperCase())
      || entries.find((entry) => entry.basename === normalized);
    return match ? !!match.fold : null;
  }

  getReferenceTargets(path) {
    const normalizedPath = String(path || '').trim();
    const entry = this.referenceIndex?.entries?.[normalizedPath];
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (file && entry && Number(entry.mtime || 0) !== Number(getFileMtime(file) || 0)) return null;
    return Array.isArray(entry?.refs) ? entry.refs.slice() : null;
  }

  closeWidgetIfOpen() {
    const existing = document.getElementById(WIDGET_ID);
    if (!existing) return false;
    try { if (typeof window.__mermaidFloatingWidgetSaveState === 'function') window.__mermaidFloatingWidgetSaveState('plugin-close', existing); }
    catch (error) { console.warn('[MermaidFloatingWidget][state.save.fail]', { source: 'plugin-close', error }); }
    try { if (typeof existing.cleanup === 'function') existing.cleanup(); }
    catch (error) { console.warn('[MermaidFloatingWidget][cleanup.fail]', error); }
    existing.remove();
    return true;
  }

  async toggleWidget() {
    const start = performance.now();
    try {
      window.__mermaidFloatingWidgetPluginMode = true;
      this.publishApi();
      if (this.closeWidgetIfOpen()) return;
      await runMermaidFloatingWidget(this.app, { obsidian: { Notice } }, window.mermaidFloatingWidgetApi);
    } catch (error) {
      console.error('[MermaidFloatingWidget][toggle.fail]', error);
      new Notice(`Mermaid widget failed: ${error.message}`);
    } finally {
      if (this.settings.enableTiming) console.info('[MermaidFloatingWidget][toggle.timing]', { ms: Math.round(performance.now() - start) });
    }
  }
};
