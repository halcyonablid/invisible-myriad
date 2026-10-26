module.exports = async function runEvaTreeEngine(context) {
  const { app, container, settings = {}, onStatus, onFoldStateChange } = context;

  const INDEXES_FILENAME = String(settings.indexesFileName || "EVA_Indexes.json").trim() || "EVA_Indexes.json";
  const FILE_PREFIX_FILTER = String(settings.filePrefixFilter || "ATOM@").trim() || "ATOM@";
  const START_LEVEL = Number.parseInt(settings.startLevel, 10) > 0 ? Number.parseInt(settings.startLevel, 10) : 5;
  const FRAME_SIZE = Number.parseInt(settings.frameSize, 10) > 0 ? Number.parseInt(settings.frameSize, 10) : 2000;
  const FRAME_RADIUS = Math.max(0, Math.floor((FRAME_SIZE - 1) / 2));
  const ATOM_NOTE_VIEW_TYPE = "eva-note";
  const ATOM_NOTE_SCOPE_PATH = "__vault_atom_notes__";
  const ATOM_NOTE_ITEM_ID = "file";

  let pages = [];
  let pageByPath = new Map();
  let pageByName = new Map();
  let pageByCode = new Map();
  let parentHierarchyCodes = new Set();
  let maxExistingLevel = 0;
  let disposed = false;
  let keydownHandler = null;
  let vaultRefs = [];
  let refreshTimer = null;
  let foldSaveTimer = null;
  let searchIndexLoadPromise = null;
  let searchIndexMtime = 0;
  let searchKeywordByNoteId = new Map();

  const initialFoldedCodes = Array.isArray(settings.foldedHierarchyCodes) ? settings.foldedHierarchyCodes : [];
  const legacyFoldedNodes = window.myTreeViewFoldState_EVA instanceof Set ? window.myTreeViewFoldState_EVA : new Set();
  const foldedNodes = new Set([...legacyFoldedNodes, ...initialFoldedCodes].map((item) => String(item || "").trim()).filter(Boolean));
  window.myTreeViewFoldState_EVA = foldedNodes;

  if (!window.myTreeViewDisplayState_EVA) {
    window.myTreeViewDisplayState_EVA = {
      maxLevel: 20,
      highlightLevel: 0,
      highlightSubLevels: false,
      currentHighlightedFile: null,
      currentHighlightedPath: null,
      frameStart: 0,
      scrollTop: 0,
    };
  }
  const viewState = window.myTreeViewDisplayState_EVA;
  if (typeof viewState.frameStart !== "number") viewState.frameStart = 0;
  if (typeof viewState.currentHighlightedPath !== "string") viewState.currentHighlightedPath = null;

  function report(eventName, payload = {}) {
    if (typeof onStatus === "function") onStatus(eventName, payload);
  }

  function getHierarchyCode(fileName) {
    const atIndex = fileName.indexOf("@");
    if (atIndex === -1) return null;
    const dashIndex = fileName.indexOf("-", atIndex);
    if (dashIndex === -1) return null;
    return fileName.substring(atIndex + 1, dashIndex).trim();
  }

  function getFileName(file) {
    return String(file?.name || file?.basename || "").replace(/\.md$/i, "");
  }

  function normalizePath(value) {
    return String(value || "").trim().replace(/\\/g, "/");
  }

  function getNoteId(page) {
    return String(page?.noteId || page?.fileName || "").replace(/\.md$/i, "");
  }

  function normalizeKeywordListValue(raw) {
    if (Array.isArray(raw)) return raw.map((item) => String(item == null ? "" : item).trim()).filter(Boolean);
    const value = String(raw == null ? "" : raw).trim();
    if (!value) return [];
    if (value.startsWith("[") && value.endsWith("]")) {
      return value.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value.split(/[，,]/).map((item) => item.trim()).filter(Boolean);
  }

  function getBaseKeyword(rawValue) {
    const value = String(rawValue == null ? "" : rawValue).trim();
    if (!value) return "";
    return value.split("+")[0].trim();
  }

  function getFrontmatterKeywords(frontmatter = {}) {
    const values = [
      ...normalizeKeywordListValue(frontmatter["关键词管理"]),
      ...normalizeKeywordListValue(frontmatter["关键词"]),
      ...normalizeKeywordListValue(frontmatter.keywords),
      ...normalizeKeywordListValue(frontmatter.keyword),
    ];
    const seen = new Set();
    const result = [];
    values.forEach((item) => {
      const keyword = getBaseKeyword(item);
      if (!keyword || seen.has(keyword)) return;
      seen.add(keyword);
      result.push(keyword);
    });
    return result;
  }

  function isTreePage(file) {
    if (!file || file.extension !== "md") return false;
    const fileName = getFileName(file);
    if (FILE_PREFIX_FILTER && !fileName.startsWith(FILE_PREFIX_FILTER)) return false;
    return !!getHierarchyCode(fileName);
  }

  function getEffectiveLevel(hierarchyCode) {
    if (!hierarchyCode) return 0;
    return Math.max(0, hierarchyCode.split(".").length - (START_LEVEL - 1));
  }

  function buildPagesFromMetadata() {
    const markdownFiles = app.vault.getMarkdownFiles();
    const nextPages = markdownFiles
      .filter(isTreePage)
      .map((file) => {
        const cache = app.metadataCache.getFileCache(file);
        const hierarchyCode = getHierarchyCode(getFileName(file));
        return {
          file,
          fileName: getFileName(file),
          filePath: file.path,
          noteId: getFileName(file),
          hierarchyCode,
          levelDepth: getEffectiveLevel(hierarchyCode),
          title: String(cache?.frontmatter?.title || file.basename || ""),
          yaml: cache?.frontmatter || {},
          frontmatterKeywords: getFrontmatterKeywords(cache?.frontmatter || {}),
        };
      })
      .sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, {
        numeric: true,
        sensitivity: "base",
      }));

    nextPages.forEach((page, index) => {
      page.index = index;
    });

    const nextPageByPath = new Map();
    const nextPageByName = new Map();
    const nextPageByCode = new Map();
    nextPages.forEach((page) => {
      nextPageByPath.set(normalizePath(page.filePath), page);
      nextPageByName.set(page.fileName, page);
      if (page.hierarchyCode && !nextPageByCode.has(page.hierarchyCode)) nextPageByCode.set(page.hierarchyCode, page);
    });

    const allCodes = new Set(nextPages.map((page) => page.hierarchyCode).filter(Boolean));
    const nextParentCodes = new Set();
    allCodes.forEach((code) => {
      const parts = code.split(".");
      for (let index = 1; index < parts.length; index++) {
        const ancestorCode = parts.slice(0, index).join(".");
        if (allCodes.has(ancestorCode)) nextParentCodes.add(ancestorCode);
      }
    });

    let nextMaxExistingLevel = 0;
    nextPages.forEach((page) => {
      nextMaxExistingLevel = Math.max(nextMaxExistingLevel, page.levelDepth || 0);
    });

    pages = nextPages;
    pageByPath = nextPageByPath;
    pageByName = nextPageByName;
    pageByCode = nextPageByCode;
    parentHierarchyCodes = nextParentCodes;
    maxExistingLevel = nextMaxExistingLevel;
    viewState.frameStart = clampFrameStart(viewState.frameStart || 0, getVisibleEntries().length);
    viewState.maxLevel = Math.max(1, Math.min(viewState.maxLevel, Math.max(maxExistingLevel, 1)));
    if (viewState.highlightLevel > viewState.maxLevel) viewState.highlightLevel = viewState.maxLevel;

    report("tree-data-built", {
      source: "metadata-cache",
      pages: pages.length,
      maxExistingLevel,
      filterTreeStructure: false,
      startLevel: START_LEVEL,
      frameSize: FRAME_SIZE,
    });
  }

  function rebuildTree(reason = "manual") {
    if (disposed) return false;
    buildPagesFromMetadata();
    renderTree();
    statusEl.setText(`树状图已更新：${pages.length} 条（${reason}）。`);
    return true;
  }

  function queueTreeRefresh(reason = "metadata-changed", delayMs = 250) {
    if (disposed) return;
    if (refreshTimer) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      rebuildTree(reason);
    }, delayMs);
  }

  function findIndexesFile() {
    return app.vault.getFiles().find((file) => file.name === INDEXES_FILENAME) || null;
  }

  async function loadSearchIndex() {
    const indexesFile = findIndexesFile();
    if (!indexesFile) {
      searchKeywordByNoteId = new Map();
      return false;
    }
    const latestMtime = indexesFile.stat?.mtime || 0;
    if (searchKeywordByNoteId.size > 0 && searchIndexMtime === latestMtime) return true;
    if (searchIndexLoadPromise) return searchIndexLoadPromise;

    searchIndexLoadPromise = (async () => {
      try {
        const raw = await app.vault.read(indexesFile);
        const json = JSON.parse(raw);
        const byKeyword = json?.indexes?.by_keyword || {};
        const nextMap = new Map();
        Object.entries(byKeyword).forEach(([keyword, noteIds]) => {
          if (!Array.isArray(noteIds)) return;
          noteIds.forEach((noteId) => {
            const normalizedId = String(noteId || "").trim();
            if (!normalizedId) return;
            if (!nextMap.has(normalizedId)) nextMap.set(normalizedId, []);
            nextMap.get(normalizedId).push(String(keyword || ""));
          });
        });
        searchKeywordByNoteId = nextMap;
        searchIndexMtime = latestMtime;
        report("search-index.loaded", {
          path: indexesFile.path,
          keywords: Object.keys(byKeyword).length,
          noteIds: searchKeywordByNoteId.size,
        });
        return true;
      } catch (error) {
        console.warn("[EVA Tree View][search-index.load.fail]", error);
        searchKeywordByNoteId = new Map();
        return false;
      } finally {
        searchIndexLoadPromise = null;
      }
    })();
    return searchIndexLoadPromise;
  }

  function toggleFold(hierarchyCode) {
    if (foldedNodes.has(hierarchyCode)) foldedNodes.delete(hierarchyCode);
    else foldedNodes.add(hierarchyCode);
    viewState.currentHighlightedFile = null;
    viewState.currentHighlightedPath = null;
    viewState.scrollTop = 0;
    scheduleFoldStateSave();
    renderTree();
  }

  function scheduleFoldStateSave() {
    if (foldSaveTimer) window.clearTimeout(foldSaveTimer);
    foldSaveTimer = window.setTimeout(() => {
      foldSaveTimer = null;
      saveFoldStateNow();
    }, 300);
  }

  function saveFoldStateNow() {
    if (typeof onFoldStateChange !== "function") return;
    const values = Array.from(foldedNodes).sort((a, b) => a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    }));
    void Promise.resolve(onFoldStateChange(values)).catch((error) => {
      console.warn("[EVA Tree View][fold-state.save.fail]", error);
    });
  }

  function unfoldAncestors(hierarchyCode) {
    if (!hierarchyCode) return;
    const parts = hierarchyCode.split(".");
    for (let i = 1; i < parts.length; i++) {
      const ancestorCode = parts.slice(0, i).join(".");
      if (foldedNodes.has(ancestorCode)) foldedNodes.delete(ancestorCode);
    }
  }

  function isAncestorFolded(hierarchyCode) {
    if (!hierarchyCode) return false;
    const parts = hierarchyCode.split(".");
    for (let i = 1; i < parts.length; i++) {
      const ancestorCode = parts.slice(0, i).join(".");
      if (foldedNodes.has(ancestorCode)) return true;
    }
    return false;
  }

  function processKeywords(value) {
    const sourceText = String(value || "");
    if (!sourceText.includes("··") && !sourceText.includes("++")) {
      return document.createTextNode(sourceText);
    }
    const fragment = document.createDocumentFragment();
    const combinedRegex = /(··([^·]+)··)|(\+\+([^+]+(?:\+[^+]+)*)\+\+)/g;
    let lastIndex = 0;
    let match;
    while ((match = combinedRegex.exec(sourceText)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(sourceText.substring(lastIndex, match.index)));
      }
      if (match[1]) {
        let keyword = match[2] || "";
        if (/[A-Z]/.test(keyword.charAt(0))) keyword = keyword.substring(1);
        const span = document.createElement("span");
        span.textContent = keyword;
        span.className = "keyword-highlight";
        fragment.appendChild(span);
      } else if (match[3]) {
        let tag = match[4] || "";
        if (/[A-Z]/.test(tag.charAt(0))) tag = tag.substring(1);
        const span = document.createElement("span");
        span.textContent = tag;
        span.className = "tag-highlight";
        fragment.appendChild(span);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < sourceText.length) {
      fragment.appendChild(document.createTextNode(sourceText.substring(lastIndex)));
    }
    return fragment;
  }

  function getCurrentMaxVisibleLevel() {
    return Math.min(viewState.maxLevel, maxExistingLevel);
  }

  function isPageVisibleInCurrentTree(page) {
    if (!page) return false;
    const levelDepth = page.levelDepth || 0;
    return levelDepth <= viewState.maxLevel && !isAncestorFolded(page.hierarchyCode);
  }

  function getVisibleEntries() {
    return pages
      .filter(isPageVisibleInCurrentTree)
      .map((page, visiblePosition) => ({ page, visiblePosition }));
  }

  function clampFrameStart(value, visibleCount) {
    const parsed = Number.parseInt(value, 10);
    const safeVisibleCount = Number.isFinite(visibleCount) ? visibleCount : 0;
    const maxStart = Math.max(0, safeVisibleCount - FRAME_SIZE);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, maxStart);
  }

  function setFrameStart(nextStart, options = {}) {
    viewState.frameStart = clampFrameStart(nextStart, getVisibleEntries().length);
    if (options.clearHighlight) {
      viewState.currentHighlightedFile = null;
      viewState.currentHighlightedPath = null;
    }
    renderTree();
  }

  function shiftFrame(direction) {
    const delta = direction < 0 ? -FRAME_SIZE : FRAME_SIZE;
    setFrameStart((viewState.frameStart || 0) + delta, { clearHighlight: true });
  }

  function ensureFrameForPage(page) {
    if (!page) return false;
    if ((page.levelDepth || 0) > viewState.maxLevel) {
      viewState.maxLevel = Math.min(Math.max(page.levelDepth || 1, 1), Math.max(maxExistingLevel, 1));
      if (viewState.highlightLevel > viewState.maxLevel) viewState.highlightLevel = viewState.maxLevel;
    }
    const visibleEntries = getVisibleEntries();
    const visibleEntry = visibleEntries.find((entry) => entry.page === page);
    if (!visibleEntry) return false;
    const frameStart = clampFrameStart(visibleEntry.visiblePosition - FRAME_RADIUS, visibleEntries.length);
    viewState.frameStart = frameStart;
    return true;
  }

  container.empty();
  container.createEl("h3", { text: "层级结构视图（大纲模式 - newera）" });
  container.createDiv({
    cls: "tree-control-info",
    text: "交互: [单击]打开笔记, [关系]编辑 EVA 关联, [右键]高亮同级, [▶/▼]折叠/展开；快捷键: [J/K]增减层级, [N/M]高亮层级",
  });
  const statusEl = container.createDiv({ cls: "eva-tree-view-message" });
  const levelInfo = container.createDiv({ cls: "tree-level-info" });
  const treeContainer = container.createDiv({ cls: "hierarchical-tree-structure" });
  treeContainer.addEventListener("scroll", (event) => {
    viewState.scrollTop = event.target.scrollTop;
  });

  function renderTree() {
    if (disposed) return;
    treeContainer.innerHTML = "";
    const currentMaxVisibleLevel = getCurrentMaxVisibleLevel();
    const visibleEntries = getVisibleEntries();
    const visibleCount = visibleEntries.length;
    const frameStart = clampFrameStart(viewState.frameStart || 0, visibleCount);
    const frameEnd = Math.min(visibleCount, frameStart + FRAME_SIZE);
    viewState.frameStart = frameStart;
    levelInfo.textContent = `当前显示层级: ${currentMaxVisibleLevel}/${maxExistingLevel}`
      + ` | 可见帧: ${visibleCount ? frameStart + 1 : 0}-${frameEnd}/${visibleCount}`
      + ` | 总节点: ${pages.length}`
      + (viewState.highlightLevel > 0 ? ` | 高亮层级: ${viewState.highlightLevel}${viewState.highlightSubLevels ? " (含下级)" : ""}` : "")
      + (viewState.currentHighlightedFile ? ` | 定位高亮: ${viewState.currentHighlightedFile}` : "");

    let renderedCount = 0;
    const frameIndexes = new Set();
    visibleEntries.slice(frameStart, frameEnd).forEach((entry) => {
      if (Number.isFinite(entry.page.index)) frameIndexes.add(entry.page.index);
    });
    const contextIndexes = new Set();
    Array.from(frameIndexes).forEach((index) => {
      const page = pages[index];
      if (!page?.hierarchyCode) return;
      getAncestorPages(page.hierarchyCode).forEach((ancestorPage) => {
        if (
          Number.isFinite(ancestorPage.index)
          && !frameIndexes.has(ancestorPage.index)
          && isPageVisibleInCurrentTree(ancestorPage)
        ) {
          contextIndexes.add(ancestorPage.index);
        }
      });
    });
    const renderIndexes = Array.from(new Set([...contextIndexes, ...frameIndexes]))
      .sort((a, b) => a - b);

    addFrameBoundary("top", frameStart, frameEnd, visibleCount);
    renderIndexes.forEach((index) => {
      const page = pages[index];
      if (!page) return;
      const fileName = page.fileName;
      const hierarchyCode = page.hierarchyCode;
      const levelDepth = page.levelDepth || 0;
      if (levelDepth > viewState.maxLevel || isAncestorFolded(hierarchyCode)) return;

      const fileItemDiv = document.createElement("div");
      fileItemDiv.className = "tree-item tree-item-link";
      fileItemDiv.dataset.filename = fileName;
      fileItemDiv.dataset.filepath = page.filePath;
      fileItemDiv.dataset.level = String(levelDepth);
      if (contextIndexes.has(index)) fileItemDiv.classList.add("tree-item-frame-context");

      const displayLevel = levelDepth > 0 ? levelDepth : 1;
      if (viewState.highlightLevel > 0) {
        if (viewState.highlightLevel === displayLevel) fileItemDiv.classList.add("tree-item-highlighted");
        else if (viewState.highlightSubLevels && displayLevel > viewState.highlightLevel) fileItemDiv.classList.add("tree-item-subhighlighted");
      }
      if (page.filePath === viewState.currentHighlightedPath || fileName === viewState.currentHighlightedFile) {
        fileItemDiv.classList.add("tree-item-h-highlighted");
      }
      const relationNodeKey = buildAtomNoteNodeKey(page);
      const relationSnapshot = getRelationSnapshot(relationNodeKey);
      if ((relationSnapshot.outgoing || 0) + (relationSnapshot.incoming || 0) > 0) {
        fileItemDiv.classList.add("tree-item-has-relations");
      }

      const foldControl = document.createElement("span");
      if (parentHierarchyCodes.has(hierarchyCode)) {
        foldControl.className = "fold-button";
        foldControl.textContent = foldedNodes.has(hierarchyCode) ? "▶" : "▼";
        foldControl.onclick = (event) => {
          event.stopPropagation();
          toggleFold(hierarchyCode);
        };
      } else {
        foldControl.className = "fold-placeholder";
        foldControl.innerHTML = "&nbsp;";
      }
      fileItemDiv.appendChild(foldControl);

      let prefix = "";
      for (let index = 1; index < levelDepth; index++) prefix += "│ ";
      if (levelDepth > 1) prefix = `${prefix.substring(0, prefix.length - 2)}├─ `;
      else prefix = "● ";
      const prefixSpan = document.createElement("span");
      prefixSpan.className = "tree-prefix";
      prefixSpan.textContent = prefix;
      fileItemDiv.appendChild(prefixSpan);
      fileItemDiv.appendChild(processKeywords(fileName));
      renderKeywordBadges(fileItemDiv, page);
      renderRelationButton(fileItemDiv, relationNodeKey, relationSnapshot, page);

      fileItemDiv.addEventListener("click", (event) => {
        event.preventDefault();
        app.workspace.openLinkText(page.filePath, "", false);
      });
      fileItemDiv.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        viewState.highlightLevel = displayLevel;
        viewState.highlightSubLevels = true;
        viewState.currentHighlightedFile = null;
        viewState.currentHighlightedPath = null;
        renderTree();
      });

      treeContainer.appendChild(fileItemDiv);
      renderedCount++;
    });
    addFrameBoundary("bottom", frameStart, frameEnd, visibleCount);

    statusEl.setText(`已渲染 ${renderedCount} 条（可见帧 ${visibleCount ? frameStart + 1 : 0}-${frameEnd} / 可见 ${visibleCount} 条，总 ${pages.length} 条，单帧 ${FRAME_SIZE} 条）。`);
    if (typeof viewState.scrollTop === "number" && viewState.scrollTop > 0) {
      setTimeout(() => {
        if (!disposed) treeContainer.scrollTop = viewState.scrollTop;
      }, 0);
    }
    if (viewState.currentHighlightedFile) {
      setTimeout(() => {
        if (disposed) return;
        const highlightedItem = treeContainer.querySelector(".tree-item-h-highlighted");
        if (highlightedItem) {
          highlightedItem.scrollIntoView({ behavior: "smooth", block: "center" });
          highlightedItem.classList.add("pulse-animation");
          setTimeout(() => highlightedItem.classList.remove("pulse-animation"), 2000);
        }
      }, 100);
    }
  }

  function addFrameBoundary(position, frameStart, frameEnd, visibleCount) {
    const boundary = document.createElement("div");
    boundary.className = `eva-tree-frame-boundary eva-tree-frame-boundary-${position}`;
    const hasPrev = frameStart > 0;
    const hasNext = frameEnd < visibleCount;
    const label = document.createElement("span");
    label.className = "eva-tree-frame-label";
    label.textContent = `可见帧 ${visibleCount ? frameStart + 1 : 0}-${frameEnd} / ${visibleCount}（总 ${pages.length}）`;
    if (hasPrev) {
      const prevButton = document.createElement("button");
      prevButton.type = "button";
      prevButton.textContent = "上一帧";
      prevButton.addEventListener("click", () => shiftFrame(-1));
      boundary.appendChild(prevButton);
    }
    boundary.appendChild(label);
    if (hasNext) {
      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.textContent = "下一帧";
      nextButton.addEventListener("click", () => shiftFrame(1));
      boundary.appendChild(nextButton);
    }
    if (hasPrev || hasNext) treeContainer.appendChild(boundary);
  }

  function getAncestorPages(hierarchyCode) {
    if (!hierarchyCode) return [];
    const parts = hierarchyCode.split(".");
    const ancestors = [];
    for (let index = 1; index < parts.length; index++) {
      const ancestorCode = parts.slice(0, index).join(".");
      const page = pageByCode.get(ancestorCode);
      if (page) ancestors.push(page);
    }
    return ancestors;
  }

  function getKeywordsForPage(page) {
    if (!page) return [];
    const merged = [
      ...(Array.isArray(page.frontmatterKeywords) ? page.frontmatterKeywords : []),
      ...(searchKeywordByNoteId.get(page.noteId)
      || searchKeywordByNoteId.get(page.fileName)
      || searchKeywordByNoteId.get(page.filePath)
      || []),
    ];
    const seen = new Set();
    return merged.map(getBaseKeyword).filter((keyword) => {
      if (!keyword || seen.has(keyword)) return false;
      seen.add(keyword);
      return true;
    });
  }

  function renderKeywordBadges(parent, page) {
    const keywords = getKeywordsForPage(page).filter(Boolean).slice(0, 4);
    if (keywords.length === 0) return;
    parent.classList.add("tree-item-has-keywords");
    const wrap = document.createElement("span");
    wrap.className = "eva-tree-keyword-badges";
    keywords.forEach((keyword) => {
      const badge = document.createElement("span");
      badge.className = "eva-tree-keyword-badge";
      badge.textContent = keyword;
      wrap.appendChild(badge);
    });
    parent.appendChild(wrap);
  }

  function encodeJumpSegment(value) {
    return encodeURIComponent(String(value || ""));
  }

  function buildAtomNoteNodeKey(page) {
    const ctime = Number(page?.file?.stat?.ctime) || 0;
    const scopeId = ctime ? `ctime:${ctime}` : `atom:${getHierarchyCode(page?.fileName || "") || page?.fileName || ""}`;
    return `jump:v1:${[
      ATOM_NOTE_VIEW_TYPE,
      ATOM_NOTE_SCOPE_PATH,
      "note",
      scopeId,
      ATOM_NOTE_ITEM_ID,
    ].map(encodeJumpSegment).join("|")}`;
  }

  function getRelationSnapshot(nodeKey) {
    const api = window.evaCrossViewRelations;
    if (!api || typeof api.getNodeRelationSnapshot !== "function") return { outgoing: 0, incoming: 0 };
    try {
      const snapshot = api.getNodeRelationSnapshot(nodeKey) || {};
      return {
        outgoing: Array.isArray(snapshot.outgoing) ? snapshot.outgoing.length : 0,
        incoming: Array.isArray(snapshot.incoming) ? snapshot.incoming.length : 0,
      };
    } catch (error) {
      console.warn("[EVA Tree View][relations.snapshot.fail]", error);
      return { outgoing: 0, incoming: 0 };
    }
  }

  function renderRelationButton(parent, nodeKey, snapshot, page = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "eva-tree-relation-button";
    button.textContent = "关系";
    const total = (snapshot.outgoing || 0) + (snapshot.incoming || 0);
    button.title = total > 0
      ? `EVA 关联：${snapshot.outgoing || 0} 出 / ${snapshot.incoming || 0} 入`
      : "编辑 EVA 关联";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const api = window.evaCrossViewRelations;
      if (!api || typeof api.openRelationEditor !== "function") {
        statusEl.setText("EVA Cross View Relations 未就绪，无法打开关系编辑器。");
        return;
      }
      if (typeof api.markLastFocusedNode === "function") api.markLastFocusedNode(nodeKey);
      void api.openRelationEditor(nodeKey);
    });
    parent.appendChild(button);

    const metaButton = document.createElement("button");
    metaButton.type = "button";
    metaButton.className = "eva-tree-meta-capture-button eva-meta-capture-btn";
    metaButton.textContent = "M";
    metaButton.title = "EVA Meta：捕获这个树节点";
    metaButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const api = window.evaCrossViewRelations;
      if (!api || typeof api.captureMetaNode !== "function") {
        statusEl.setText("EVA Meta 未就绪，请先启用 EVA Cross View Relations 并进入 Meta 模式。");
        return;
      }
      if (typeof api.markLastFocusedNode === "function") api.markLastFocusedNode(nodeKey);
      const result = await api.captureMetaNode({
        nodeKey,
        label: page.title || page.fileName || page.filePath || nodeKey,
        sourcePlugin: "eva-tree-view",
        viewType: ATOM_NOTE_VIEW_TYPE
      });
      console.info("[EVA Tree View][eva-meta][capture.click]", {
        nodeKey,
        filePath: page.filePath || "",
        status: result?.ok ? "PASS" : "FAIL",
        phase: result?.state?.phase || "",
        reasonCodes: result?.reason ? [result.reason] : []
      });
    });
    parent.appendChild(metaButton);
  }

  keydownHandler = (event) => {
    if (disposed) return;
    let updated = false;
    const key = String(event.key || "").toLowerCase();
    if (key === "k") {
      viewState.maxLevel = Math.min(viewState.maxLevel + 1, maxExistingLevel);
      updated = true;
    }
    if (key === "j") {
      viewState.maxLevel = Math.max(1, viewState.maxLevel - 1);
      if (viewState.highlightLevel > viewState.maxLevel) viewState.highlightLevel = viewState.maxLevel;
      updated = true;
    }
    if (key === "n") {
      viewState.highlightLevel = Math.max(0, viewState.highlightLevel - 1);
      viewState.highlightSubLevels = false;
      updated = true;
    }
    if (key === "m") {
      if (viewState.highlightLevel < getCurrentMaxVisibleLevel()) viewState.highlightLevel++;
      viewState.highlightSubLevels = false;
      updated = true;
    }
    if (updated) {
      viewState.currentHighlightedFile = null;
      viewState.currentHighlightedPath = null;
      renderTree();
    }
  };

  if (window.myTreeViewKeydownHandler_EVA) {
    document.removeEventListener("keydown", window.myTreeViewKeydownHandler_EVA);
  }
  window.myTreeViewKeydownHandler_EVA = keydownHandler;
  document.addEventListener("keydown", keydownHandler);

  function getCssEscaped(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function resolvePageByName(fileName) {
    const cleanFileName = String(fileName || "").replace(/\.md$/i, "");
    if (!cleanFileName) return null;
    return pageByName.get(cleanFileName)
      || pages.find((page) =>
        page.fileName === cleanFileName
        || page.fileName === fileName
        || page.fileName.includes(cleanFileName)
        || cleanFileName.includes(page.fileName)
      )
      || null;
  }

  function revealPage(page, reason = "reveal") {
    if (!page) return { ok: false, reason: "not-found" };
    if (page.hierarchyCode) unfoldAncestors(page.hierarchyCode);
    ensureFrameForPage(page);
    viewState.currentHighlightedFile = page.fileName;
    viewState.currentHighlightedPath = page.filePath;
    renderTree();

    const maxRetries = 15;
    let retryCount = 0;
    function tryScroll() {
      const allItems = treeContainer.querySelectorAll("[data-filepath]");
      let targetItem = treeContainer.querySelector(`[data-filepath="${getCssEscaped(page.filePath)}"]`);
      if (!targetItem) {
        for (const item of allItems) {
          const filepath = item.dataset.filepath;
          const filename = item.dataset.filename;
          if (filepath === page.filePath || filename === page.fileName) {
            targetItem = item;
            break;
          }
        }
      }
      if (targetItem) {
        targetItem.scrollIntoView({ behavior: "smooth", block: "center" });
        targetItem.classList.add("pulse-animation");
        setTimeout(() => targetItem.classList.remove("pulse-animation"), 2000);
        return true;
      }
      retryCount++;
      if (retryCount < maxRetries) setTimeout(tryScroll, 50);
      return false;
    }
    setTimeout(tryScroll, 200);
    return { ok: true, reason, notePath: page.filePath, fileName: page.fileName, frameStart: viewState.frameStart || 0 };
  }

  function revealNotePath(notePath) {
    const normalized = normalizePath(notePath);
    if (!normalized) return { ok: false, reason: "empty-path", notePath: "" };
    const withExt = /\.md$/i.test(normalized) ? normalized : `${normalized}.md`;
    const targetPage = pageByPath.get(normalized) || pageByPath.get(withExt);
    if (!targetPage) return { ok: false, reason: "not-found", notePath: normalized };
    return revealPage(targetPage, "path");
  }

  function scrollToFile(fileName) {
    const pathResult = revealNotePath(fileName);
    if (pathResult.ok) return pathResult;
    const targetPage = resolvePageByName(fileName);
    if (!targetPage) return { ok: false, reason: "not-found", fileName: String(fileName || "") };
    return revealPage(targetPage, "file-name");
  }

  window.evaTreeScrollToFile = scrollToFile;
  window.evaTreeScrollToFile.viewType = "EVA_FULL";
  window.evaTreeRevealNotePath = revealNotePath;
  window.evaTreeRevealNotePath.viewType = "EVA_FULL";

  function setupLightRefresh() {
    vaultRefs = [];
    vaultRefs.push({ target: app.metadataCache, ref: app.metadataCache.on("changed", (file) => {
      if (file?.extension === "md") queueTreeRefresh("metadata-changed", 300);
    }) });
    vaultRefs.push({ target: app.vault, ref: app.vault.on("rename", (file, oldPath) => {
      if (file?.extension === "md" || /\.md$/i.test(String(oldPath || ""))) queueTreeRefresh("markdown-rename", 200);
    }) });
    vaultRefs.push({ target: app.vault, ref: app.vault.on("delete", (file) => {
      if (file?.extension === "md") queueTreeRefresh("markdown-delete", 200);
    }) });
    vaultRefs.push({ target: app.vault, ref: app.vault.on("create", (file) => {
      if (file?.extension === "md") queueTreeRefresh("markdown-create", 400);
    }) });
  }

  function cleanup() {
    disposed = true;
    if (refreshTimer) window.clearTimeout(refreshTimer);
    if (foldSaveTimer) window.clearTimeout(foldSaveTimer);
    saveFoldStateNow();
    vaultRefs.forEach(({ target, ref }) => {
      if (target && typeof target.offref === "function") target.offref(ref);
    });
    vaultRefs = [];
    if (keydownHandler && window.myTreeViewKeydownHandler_EVA === keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      window.myTreeViewKeydownHandler_EVA = null;
    }
    if (window.evaTreeScrollToFile === scrollToFile) {
      delete window.evaTreeScrollToFile;
    }
    if (window.evaTreeRevealNotePath === revealNotePath) {
      delete window.evaTreeRevealNotePath;
    }
  }

  rebuildTree("initial");
  void loadSearchIndex().then(() => {
    if (!disposed) renderTree();
  });
  setupLightRefresh();

  return {
    cleanup,
    scrollToFile,
    revealNotePath,
    refresh: () => rebuildTree("view-refresh"),
    rebuildTree,
  };
};
