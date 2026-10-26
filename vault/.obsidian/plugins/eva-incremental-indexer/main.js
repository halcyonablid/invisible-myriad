const { Plugin, Notice, PluginSettingTab, Setting, TFile, TFolder, normalizePath } = require("obsidian");
const { createHash } = require("crypto");

const PLUGIN_VERSION = "0.1.0";
const STATE_SCHEMA_VERSION = "2.0";
const EXPORT_SCHEMA_VERSION = "2.0";

const DEFAULT_SETTINGS = {
  outputFolder: "",
  atomRegex: "^ATOM@",
  debounceMs: 800,
  fullScanOnStartup: true,
  autoExportOnFlush: true,
  useCachedRead: true,
  notesFileName: "EVA_Notes.json",
  linksFileName: "EVA_Links.json",
  indexesFileName: "EVA_Indexes.json",
  stateFileName: "EVA_Indexer_State.json",
  compatibilityMode: true,
  maxConcurrency: 4,
  showNotices: true
};

function truncateText(value, maxLength = 160) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function createEmptyIndexes() {
  return {
    by_keyword: {},
    by_tree_structure: [],
    by_tree_visible: [],
    by_mermaid_start: [],
    by_parent: {},
    by_antinet_type: {}
  };
}

function createEmptyState() {
  return {
    schema_version: STATE_SCHEMA_VERSION,
    updated: null,
    byPath: {},
    byNoteId: {},
    indexes: createEmptyIndexes(),
    stats: {
      total_notes: 0,
      total_links: 0,
      last_reason: "init"
    }
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueSortedStrings(values) {
  return Array.from(new Set(normalizeArray(values).map((item) => String(item || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function pushUnique(list, value) {
  if (!Array.isArray(list)) return;
  if (!list.includes(value)) list.push(value);
}

function removeFromList(list, value) {
  if (!Array.isArray(list)) return;
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
}

function sortObjectOfArrays(source) {
  const output = {};
  Object.keys(source || {}).sort((a, b) => a.localeCompare(b, "zh-Hans-CN")).forEach((key) => {
    output[key] = uniqueSortedStrings(source[key]);
  });
  return output;
}

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return fallback;
  }
}

function safeISOString(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value?.toISO === "function") return value.toISO();
  if (typeof value?.toISOString === "function") return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? String(value) : asDate.toISOString();
}

function parseAtomId(text) {
  const match = String(text || "").match(/ATOM@([\d\.A-Z\+]+)/i);
  return match ? `ATOM@${match[1]}` : null;
}

function extractHierarchyCodeFromAtomId(atomId) {
  const match = String(atomId || "").match(/^ATOM@([\d\.A-Z\+]+)$/i);
  return match ? match[1] : null;
}

function isDescendantCode(code, ancestorCode) {
  if (!code || !ancestorCode || code === ancestorCode) return false;
  return code.startsWith(`${ancestorCode}.`);
}

function normalizeParentAtom(value) {
  if (value === null || value === undefined) return null;
  const base = Array.isArray(value) ? value[0] : value;
  const asString = String(base || "").trim();
  if (!asString) return null;
  const parsed = parseAtomId(asString);
  return parsed || (asString.startsWith("ATOM@") ? asString : null);
}

function parseTitle(fileName) {
  const normalized = String(fileName || "").replace(/\.md$/i, "");
  const match = normalized.match(/ATOM@[\d\.A-Z\+]+[\s\-]+(.+)$/i);
  return match ? match[1].trim() : normalized;
}

function computeContentHash(content) {
  return createHash("sha256").update(String(content || ""), "utf8").digest("hex");
}

function computeWordCount(content) {
  const trimmed = String(content || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function buildPath(folder, fileName) {
  return folder ? normalizePath(`${folder}/${fileName}`) : normalizePath(fileName);
}

function computeTreePosition(noteId, parentAtom, childrenByParent, noteIdSet) {
  const depth = (String(noteId || "").match(/\./g) || []).length + 1;
  const parentId = parentAtom || null;
  const siblings = [];
  const children = [];

  if (parentId && noteIdSet.has(parentId)) {
    const sameParentChildren = childrenByParent[parentId] || [];
    for (const id of sameParentChildren) {
      if (id !== noteId) siblings.push(id);
    }
    const directChildren = childrenByParent[noteId] || [];
    children.push(...directChildren);
  }

  return {
    depth,
    parent_id: parentId,
    siblings: uniqueSortedStrings(siblings),
    children: uniqueSortedStrings(children)
  };
}

function extractLinks(content, sourceId) {
  if (!content) return [];

  const body = String(content)
    .replace(/^---\n[\s\S]*?\n---\n?/m, "")
    .trim();

  const links = [];
  const wikiLinkTargets = new Set();

  const wikiRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = wikiRegex.exec(body)) !== null) {
    let target = match[1].trim();
    const pipeIndex = target.indexOf("|");
    if (pipeIndex > -1) target = target.slice(0, pipeIndex).trim();
    const hashIndex = target.indexOf("#");
    if (hashIndex > -1) target = target.slice(0, hashIndex).trim();

    const targetId = parseAtomId(target);
    if (!targetId || targetId === sourceId) continue;

    wikiLinkTargets.add(targetId);
    const start = Math.max(0, match.index - 50);
    const end = Math.min(body.length, match.index + match[0].length + 50);
    const context = body.slice(start, end).replace(/\n/g, " ").trim();

    links.push({
      source: sourceId,
      target: targetId,
      type: "wikilink",
      context,
      created: new Date().toISOString(),
      _ext: {}
    });
  }

  const atomRegex = /ATOM@[\d\.A-Z\+]+/gi;
  while ((match = atomRegex.exec(body)) !== null) {
    const targetId = match[0];
    if (targetId === sourceId || wikiLinkTargets.has(targetId)) continue;

    const start = Math.max(0, match.index - 50);
    const end = Math.min(body.length, match.index + match[0].length + 50);
    const context = body.slice(start, end).replace(/\n/g, " ").trim();

    links.push({
      source: sourceId,
      target: targetId,
      type: "atom_ref",
      context,
      created: new Date().toISOString(),
      _ext: {}
    });
  }

  return links;
}

function deriveIndexRefs(note) {
  const yaml = note?.yaml || {};
  const rawKeywords = yaml["关键词管理"] || [];
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords.map((item) => String(item || "").replace(/^[KL]/, "").trim()).filter(Boolean)
    : rawKeywords
      ? [String(rawKeywords).replace(/^[KL]/, "").trim()].filter(Boolean)
      : [];

  return {
    keywords: uniqueSortedStrings(keywords),
    parent: normalizeParentAtom(yaml.parent_atom || yaml["上级条目"]),
    antinetType: String(yaml.antinet || "unknown"),
    treeStructure: Boolean(yaml["树的结构"]),
    mermaidStart: yaml["mermaid图之起始"] === true
  };
}

class EVAIncrementalIndexerPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.state = createEmptyState();
    this.dirtyQueue = [];
    this.flushTimer = null;
    this.isFlushing = false;
    this.flushRequested = false;
    this.listenersStarted = false;
    this.statusBar = this.addStatusBarItem();
    this.runtimeStats = {
      lastEvent: null,
      lastFlush: null,
      lastError: null,
      lastExport: null
    };

    this.addCommand({
      id: "eva-indexer-full-rebuild",
      name: "EVA Incremental Indexer: full rebuild",
      callback: async () => {
        await this.fullRebuild("manual-command");
      }
    });

    this.addCommand({
      id: "eva-indexer-flush-dirty-queue",
      name: "EVA Incremental Indexer: flush dirty queue",
      callback: async () => {
        await this.flushDirtyQueue("manual-command");
      }
    });

    this.addCommand({
      id: "eva-indexer-export-current-state",
      name: "EVA Incremental Indexer: export current state",
      callback: async () => {
        await this.exportState("manual-export");
        this.notice("EVA 索引已导出");
      }
    });

    this.addCommand({
      id: "eva-indexer-show-diagnostics",
      name: "EVA Incremental Indexer: show diagnostics",
      callback: async () => {
        const snapshot = this.getDiagnosticsSnapshot();
        console.log("[EVA Incremental Indexer] diagnostics", snapshot);
        const exportPath = snapshot.exportPaths.length > 0 ? snapshot.exportPaths[0] : "(尚未导出)";
        this.notice(
          `EVA Diagnostics\n` +
          `lastEvent: ${snapshot.lastEvent || "(none)"}\n` +
          `lastFlush: ${snapshot.lastFlush || "(none)"}\n` +
          `lastError: ${snapshot.lastError || "(none)"}\n` +
          `export: ${truncateText(exportPath, 80)}`,
          10000
        );
      }
    });

    this.addSettingTab(new EVAIndexerSettingTab(this.app, this));

    this.updateStatusBar("初始化中");
    this.app.workspace.onLayoutReady(() => {
      void this.initializeAfterLayout();
    });
  }

  onunload() {
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.updateStatusBar("已停止");
  }

  async initializeAfterLayout() {
    this.state = await this.loadStateFile();
    this.startVaultListeners();
    this.updateStatusBar("已就绪");
    if (this.settings.fullScanOnStartup) {
      void this.fullRebuild("startup");
    }
  }

  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    this.settings.outputFolder = String(this.settings.outputFolder || "").trim().replace(/^\/+|\/+$/g, "");
    this.settings.atomRegex = String(this.settings.atomRegex || DEFAULT_SETTINGS.atomRegex);
    this.settings.debounceMs = Math.max(100, Number(this.settings.debounceMs) || DEFAULT_SETTINGS.debounceMs);
    this.settings.maxConcurrency = Math.max(1, Math.min(16, Number(this.settings.maxConcurrency) || DEFAULT_SETTINGS.maxConcurrency));
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.state = await this.loadStateFile();
    this.updateStatusBar("设置已保存");
  }

  getAtomRegex() {
    try {
      return new RegExp(this.settings.atomRegex, "i");
    } catch (error) {
      return new RegExp(DEFAULT_SETTINGS.atomRegex, "i");
    }
  }

  getOutputPath(fileName) {
    return buildPath(this.settings.outputFolder, fileName);
  }

  getNotesPath() {
    return this.getOutputPath(this.settings.notesFileName);
  }

  getLinksPath() {
    return this.getOutputPath(this.settings.linksFileName);
  }

  getIndexesPath() {
    return this.getOutputPath(this.settings.indexesFileName);
  }

  getStatePath() {
    return this.getOutputPath(this.settings.stateFileName);
  }

  updateStatusBar(message) {
    if (!this.statusBar) return;
    const totalNotes = Object.keys(this.state?.byNoteId || {}).length;
    const dirty = this.dirtyQueue?.length || 0;
    const lastEvent = this.runtimeStats?.lastEvent?.type || "-";
    this.statusBar.setText(`EVA IDX ${PLUGIN_VERSION} | ${message} | notes ${totalNotes} | dirty ${dirty} | event ${lastEvent}`);
  }

  notice(message, timeout = 5000) {
    if (this.settings.showNotices) new Notice(message, timeout);
  }

  startVaultListeners() {
    if (this.listenersStarted) return;
    this.listenersStarted = true;

    this.registerEvent(this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.shouldHandleFile(file)) return;
      this.enqueueDirtyOp({ type: "upsert", path: file.path, reason: "create" });
    }));

    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.shouldHandleFile(file) && !this.state.byPath[file.path]) return;
      this.enqueueDirtyOp({ type: "upsert", path: file.path, reason: "modify" });
    }));

    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (!(file instanceof TFile)) return;
      const wasTracked = Boolean(this.state.byPath[oldPath]);
      const shouldTrackNow = this.shouldHandleFile(file);
      if (!wasTracked && !shouldTrackNow) return;
      this.enqueueDirtyOp({ type: "rename", path: file.path, oldPath, reason: "rename" });
    }));

    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (!(file instanceof TFile)) return;
      const wasTracked = Boolean(this.state.byPath[file.path]);
      if (!wasTracked && !this.shouldHandleFile(file)) return;
      this.enqueueDirtyOp({ type: "delete", path: file.path, reason: "delete" });
    }));
  }

  shouldHandleFile(file) {
    return file instanceof TFile && file.extension === "md" && this.getAtomRegex().test(file.name);
  }

  enqueueDirtyOp(op) {
    this.runtimeStats.lastEvent = {
      type: op.reason || op.type,
      path: op.path || "",
      oldPath: op.oldPath || "",
      at: new Date().toISOString()
    };
    this.dirtyQueue.push(op);
    this.updateStatusBar(`排队 ${op.reason || op.type}`);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
    }
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      void this.flushDirtyQueue("debounced");
    }, this.settings.debounceMs);
  }

  async flushDirtyQueue(reason) {
    if (this.isFlushing) {
      this.flushRequested = true;
      return;
    }

    if (!this.dirtyQueue.length) {
      this.updateStatusBar("空闲");
      return;
    }

    this.isFlushing = true;
    const queue = this.dirtyQueue.splice(0, this.dirtyQueue.length);
    let changed = false;
    const processed = [];
    const errors = [];

    try {
      this.updateStatusBar(`处理中 ${queue.length}`);

      for (const op of queue) {
        try {
          let opChanged = false;
          if (op.type === "rename") {
            opChanged = await this.processRename(op);
          } else if (op.type === "delete") {
            opChanged = this.processDelete(op.path);
          } else if (op.type === "upsert") {
            opChanged = await this.processUpsertByPath(op.path);
          }
          changed = opChanged || changed;
          processed.push({
            type: op.type,
            path: op.path || "",
            oldPath: op.oldPath || "",
            changed: Boolean(opChanged)
          });
        } catch (error) {
          const message = error?.message || String(error);
          errors.push({
            type: op.type,
            path: op.path || "",
            oldPath: op.oldPath || "",
            message
          });
          console.error("[EVA Incremental Indexer] op failed", op, error);
        }
      }

      if (changed) {
        await this.saveStateFile(reason);
        if (this.settings.autoExportOnFlush) {
          await this.exportState(reason);
        }
      }
      this.runtimeStats.lastFlush = {
        at: new Date().toISOString(),
        reason,
        queueSize: queue.length,
        changed,
        processed,
        errors
      };
      this.runtimeStats.lastError = errors.length > 0 ? errors[errors.length - 1] : null;
      this.updateStatusBar(changed ? "已刷新" : "无变更");
      if (errors.length > 0) {
        this.notice(`EVA flush 有 ${errors.length} 条处理失败，可运行 show diagnostics 查看`, 8000);
      }
    } catch (error) {
      console.error("[EVA Incremental Indexer] flush failed", error);
      this.notice(`EVA 刷新失败: ${error?.message || error}`, 8000);
      this.runtimeStats.lastError = {
        type: "flush",
        message: error?.message || String(error),
        at: new Date().toISOString()
      };
      this.updateStatusBar("刷新失败");
    } finally {
      this.isFlushing = false;
      if (this.flushRequested || this.dirtyQueue.length > 0) {
        this.flushRequested = false;
        void this.flushDirtyQueue("follow-up");
      }
    }
  }

  async fullRebuild(reason) {
    this.updateStatusBar("全量扫描中");
    const previousState = this.state || createEmptyState();
    const nextState = createEmptyState();

    try {
      const files = this.app.vault.getMarkdownFiles().filter((file) => this.shouldHandleFile(file));
      const tasks = [];

      for (const file of files) {
        const noteId = parseAtomId(file.name);
        if (!noteId) continue;

        const previousNoteId = previousState.byPath[file.path];
        const previousEntry = previousNoteId ? previousState.byNoteId[previousNoteId] : null;
        const mtime = Number(file.stat?.mtime || 0);
        const size = Number(file.stat?.size || 0);

        if (previousEntry && previousEntry.noteId === noteId && Number(previousEntry.mtime) === mtime && Number(previousEntry.size) === size) {
          this.addEntryToState(nextState, this.cloneEntry(previousEntry));
          continue;
        }

        tasks.push({ file, noteId, previousEntry });
      }

      if (tasks.length > 0) {
        const results = await this.runWithConcurrency(tasks, this.settings.maxConcurrency, async (task) => {
          return await this.buildEntryFromFile(task.file, task.noteId, task.previousEntry);
        });

        results.forEach((entry) => {
          if (entry) this.addEntryToState(nextState, entry);
        });
      }

      this.state = nextState;
      await this.saveStateFile(reason);
      await this.exportState(reason);
      this.runtimeStats.lastFlush = {
        at: new Date().toISOString(),
        reason,
        queueSize: 0,
        changed: true,
        processed: [{ type: "fullRebuild", path: "", oldPath: "", changed: true }],
        errors: []
      };
      this.updateStatusBar("全量完成");
      this.notice(`EVA 全量重建完成: ${Object.keys(this.state.byNoteId).length} 条笔记`);
    } catch (error) {
      console.error("[EVA Incremental Indexer] full rebuild failed", error);
      this.notice(`EVA 全量重建失败: ${error?.message || error}`, 8000);
      this.runtimeStats.lastError = {
        type: "fullRebuild",
        message: error?.message || String(error),
        at: new Date().toISOString()
      };
      this.updateStatusBar("全量失败");
    }
  }

  async runWithConcurrency(items, concurrency, workerFn) {
    const results = new Array(items.length);
    const limit = Math.max(1, Math.min(concurrency, items.length || 1));
    let cursor = 0;

    const workers = Array.from({ length: limit }, async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= items.length) return;
        results[index] = await workerFn(items[index], index);
      }
    });

    await Promise.all(workers);
    return results;
  }

  async processRename(op) {
    const oldNoteId = this.state.byPath[op.oldPath];
    const file = this.app.vault.getAbstractFileByPath(op.path);

    if (!oldNoteId) {
      if (file instanceof TFile && this.shouldHandleFile(file)) {
        return await this.processUpsertByPath(file.path);
      }
      return false;
    }

    const oldEntry = this.state.byNoteId[oldNoteId];
    if (!oldEntry) {
      delete this.state.byPath[op.oldPath];
      return false;
    }

    delete this.state.byPath[op.oldPath];

    if (!(file instanceof TFile) || !this.shouldHandleFile(file)) {
      this.removeEntryFromState(this.state, oldEntry.noteId);
      return true;
    }

    const newNoteId = parseAtomId(file.name);
    if (!newNoteId) {
      this.removeEntryFromState(this.state, oldEntry.noteId);
      return true;
    }

    if (newNoteId !== oldEntry.noteId) {
      this.removeEntryFromState(this.state, oldEntry.noteId);
      return await this.processUpsertByPath(file.path);
    }

    oldEntry.path = file.path;
    oldEntry.file_path = file.path;
    oldEntry.fileName = file.name;
    oldEntry.file_name = file.name;
    oldEntry.mtime = Number(file.stat?.mtime || 0);
    oldEntry.size = Number(file.stat?.size || 0);
    oldEntry.note.file_path = file.path;
    oldEntry.note.file_name = file.name;
    oldEntry.note.title = parseTitle(file.name);
    oldEntry.note.modified = safeISOString(file.stat?.mtime);
    this.state.byPath[file.path] = oldEntry.noteId;
    return true;
  }

  processDelete(path) {
    const noteId = this.state.byPath[path];
    if (!noteId) return false;
    this.removeEntryFromState(this.state, noteId);
    return true;
  }

  async processUpsertByPath(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      return this.processDelete(path);
    }

    if (!this.shouldHandleFile(file)) {
      return this.processDelete(path);
    }

    const noteId = parseAtomId(file.name);
    if (!noteId) return false;

    const existingNoteIdByPath = this.state.byPath[file.path];
    const existingByPath = existingNoteIdByPath ? this.state.byNoteId[existingNoteIdByPath] : null;
    const existingByNoteId = this.state.byNoteId[noteId] || null;
    const previousEntry = existingByNoteId && existingByNoteId.path === file.path ? existingByNoteId : existingByPath;
    const nextEntry = await this.buildEntryFromFile(file, noteId, previousEntry);
    if (!nextEntry) return false;

    if (previousEntry && previousEntry.path === nextEntry.path && previousEntry.hash === nextEntry.hash && previousEntry.mtime === nextEntry.mtime && previousEntry.size === nextEntry.size) {
      return false;
    }

    if (existingByPath && existingByPath.noteId !== nextEntry.noteId) {
      this.removeEntryFromState(this.state, existingByPath.noteId);
    }
    if (existingByNoteId && existingByNoteId.path !== nextEntry.path) {
      this.removeEntryFromState(this.state, existingByNoteId.noteId);
    }
    if (previousEntry && this.state.byNoteId[previousEntry.noteId]) {
      this.removeEntryFromState(this.state, previousEntry.noteId);
    }

    this.addEntryToState(this.state, nextEntry);
    return true;
  }

  async buildEntryFromFile(file, noteId, previousEntry) {
    const content = await this.readFile(file);
    const hash = computeContentHash(content);
    const mtime = Number(file.stat?.mtime || 0);
    const size = Number(file.stat?.size || 0);

    if (previousEntry && previousEntry.noteId === noteId && previousEntry.hash === hash) {
      const reused = this.cloneEntry(previousEntry);
      reused.path = file.path;
      reused.file_path = file.path;
      reused.fileName = file.name;
      reused.file_name = file.name;
      reused.mtime = mtime;
      reused.size = size;
      reused.note.file_path = file.path;
      reused.note.file_name = file.name;
      reused.note.title = parseTitle(file.name);
      reused.note.modified = safeISOString(file.stat?.mtime);
      return reused;
    }

    const frontmatter = cloneJson(this.app.metadataCache.getFileCache(file)?.frontmatter || {}, {});
    const links = extractLinks(content, noteId);
    const note = {
      id: noteId,
      title: parseTitle(file.name),
      file_path: file.path,
      file_name: file.name,
      created: safeISOString(file.stat?.ctime),
      modified: safeISOString(file.stat?.mtime),
      yaml: frontmatter,
      computed: {
        index_keywords: [],
        tree_position: {},
        word_count: computeWordCount(content),
        has_content: String(content || "").length > 100
      },
      _ext: {}
    };

    const refs = deriveIndexRefs(note);
    note.computed.index_keywords = refs.keywords.slice();

    return {
      noteId,
      path: file.path,
      file_path: file.path,
      fileName: file.name,
      file_name: file.name,
      mtime,
      size,
      hash,
      note,
      links,
      refs
    };
  }

  async readFile(file) {
    if (this.settings.useCachedRead) {
      return await this.app.vault.cachedRead(file);
    }
    return await this.app.vault.read(file);
  }

  cloneEntry(entry) {
    return cloneJson(entry, entry);
  }

  addEntryToState(state, entry) {
    state.byPath[entry.path] = entry.noteId;
    state.byNoteId[entry.noteId] = entry;
    this.addEntryToIndexes(state.indexes, entry);
    this.recomputeStateStats(state, "add");
  }

  removeEntryFromState(state, noteId) {
    const entry = state.byNoteId[noteId];
    if (!entry) return;
    delete state.byNoteId[noteId];
    if (entry.path) delete state.byPath[entry.path];
    this.removeEntryFromIndexes(state.indexes, entry);
    this.recomputeStateStats(state, "remove");
  }

  addEntryToIndexes(indexes, entry) {
    const refs = entry.refs || deriveIndexRefs(entry.note);

    refs.keywords.forEach((keyword) => {
      if (!indexes.by_keyword[keyword]) indexes.by_keyword[keyword] = [];
      pushUnique(indexes.by_keyword[keyword], entry.noteId);
    });

    if (refs.parent) {
      if (!indexes.by_parent[refs.parent]) indexes.by_parent[refs.parent] = [];
      pushUnique(indexes.by_parent[refs.parent], entry.noteId);
    }

    if (!indexes.by_antinet_type[refs.antinetType]) indexes.by_antinet_type[refs.antinetType] = [];
    pushUnique(indexes.by_antinet_type[refs.antinetType], entry.noteId);

    if (refs.treeStructure) pushUnique(indexes.by_tree_structure, entry.noteId);
    if (refs.mermaidStart) pushUnique(indexes.by_mermaid_start, entry.noteId);
  }

  removeEntryFromIndexes(indexes, entry) {
    const refs = entry.refs || deriveIndexRefs(entry.note);

    refs.keywords.forEach((keyword) => {
      removeFromList(indexes.by_keyword[keyword], entry.noteId);
      if (!indexes.by_keyword[keyword] || indexes.by_keyword[keyword].length === 0) {
        delete indexes.by_keyword[keyword];
      }
    });

    if (refs.parent) {
      removeFromList(indexes.by_parent[refs.parent], entry.noteId);
      if (!indexes.by_parent[refs.parent] || indexes.by_parent[refs.parent].length === 0) {
        delete indexes.by_parent[refs.parent];
      }
    }

    removeFromList(indexes.by_antinet_type[refs.antinetType], entry.noteId);
    if (!indexes.by_antinet_type[refs.antinetType] || indexes.by_antinet_type[refs.antinetType].length === 0) {
      delete indexes.by_antinet_type[refs.antinetType];
    }

    removeFromList(indexes.by_tree_structure, entry.noteId);
    removeFromList(indexes.by_mermaid_start, entry.noteId);
  }

  recomputeStateStats(state, reason) {
    const entries = Object.values(state.byNoteId || {});
    state.updated = new Date().toISOString();
    state.stats = {
      total_notes: entries.length,
      total_links: entries.reduce((sum, entry) => sum + normalizeArray(entry.links).length, 0),
      last_reason: reason
    };
  }

  buildDerivedExportData() {
    const entries = Object.values(this.state.byNoteId || {}).sort((a, b) => a.noteId.localeCompare(b.noteId, "zh-Hans-CN"));
    const notes = {};
    const noteIdSet = new Set(entries.map((entry) => entry.noteId));
    const childrenByParent = {};
    const indexes = cloneJson(this.state.indexes || createEmptyIndexes(), createEmptyIndexes());

    entries.forEach((entry) => {
      const clonedNote = cloneJson(entry.note, entry.note);
      if (!clonedNote.computed || typeof clonedNote.computed !== "object") clonedNote.computed = {};
      notes[entry.noteId] = clonedNote;

      const parent = entry.refs?.parent || normalizeParentAtom(clonedNote.yaml?.parent_atom || clonedNote.yaml?.["上级条目"]);
      if (parent) {
        if (!childrenByParent[parent]) childrenByParent[parent] = [];
        childrenByParent[parent].push(entry.noteId);
      }
    });

    Object.keys(notes).forEach((noteId) => {
      const note = notes[noteId];
      const parent = normalizeParentAtom(note.yaml?.parent_atom || note.yaml?.["上级条目"]);
      note.computed.tree_position = computeTreePosition(noteId, parent, childrenByParent, noteIdSet);
    });

    const mermaidStartSet = new Set(indexes.by_mermaid_start || []);
    const mermaidStartCodes = Array.from(new Set((indexes.by_mermaid_start || []).map(extractHierarchyCodeFromAtomId).filter(Boolean)));
    const treeVisible = [];
    let mermaidHiddenCount = 0;

    Object.keys(notes).forEach((noteId) => {
      const note = notes[noteId];
      const code = extractHierarchyCodeFromAtomId(noteId);
      const isMermaidStart = mermaidStartSet.has(noteId);
      const hiddenByMermaid = !isMermaidStart && mermaidStartCodes.some((startCode) => isDescendantCode(code, startCode));

      note.computed.mermaid = {
        is_start: isMermaidStart,
        hide_in_tree: hiddenByMermaid
      };

      if (hiddenByMermaid) mermaidHiddenCount += 1;
      if (note.yaml?.["树的结构"] && !hiddenByMermaid) treeVisible.push(noteId);
    });

    indexes.by_tree_structure = uniqueSortedStrings(indexes.by_tree_structure);
    indexes.by_mermaid_start = uniqueSortedStrings(indexes.by_mermaid_start);
    indexes.by_tree_visible = uniqueSortedStrings(treeVisible);
    indexes.by_keyword = sortObjectOfArrays(indexes.by_keyword);
    indexes.by_parent = sortObjectOfArrays(indexes.by_parent);
    indexes.by_antinet_type = sortObjectOfArrays(indexes.by_antinet_type);

    return {
      notes,
      indexes,
      mermaidHiddenCount
    };
  }

  buildLinksJson(notes) {
    const uniqueLinks = [];
    const seen = new Set();
    const entries = Object.values(this.state.byNoteId || {});

    entries.forEach((entry) => {
      normalizeArray(entry.links).forEach((link) => {
        const key = `${link.source}|${link.target}|${link.type}`;
        if (seen.has(key)) return;
        seen.add(key);
        uniqueLinks.push(link);
      });
    });

    const adjacency = {};
    const validNotes = new Set(Object.keys(notes));

    uniqueLinks.forEach((link) => {
      if (!validNotes.has(link.source)) return;

      if (!adjacency[link.source]) {
        adjacency[link.source] = {
          outgoing: [],
          incoming: [],
          outgoing_count: 0,
          incoming_count: 0
        };
      }

      adjacency[link.source].outgoing.push(link.target);
      adjacency[link.source].outgoing_count += 1;

      if (validNotes.has(link.target)) {
        if (!adjacency[link.target]) {
          adjacency[link.target] = {
            outgoing: [],
            incoming: [],
            outgoing_count: 0,
            incoming_count: 0
          };
        }
        adjacency[link.target].incoming.push(link.source);
        adjacency[link.target].incoming_count += 1;
      }
    });

    Object.keys(adjacency).forEach((noteId) => {
      adjacency[noteId].outgoing = uniqueSortedStrings(adjacency[noteId].outgoing);
      adjacency[noteId].incoming = uniqueSortedStrings(adjacency[noteId].incoming);
      adjacency[noteId].outgoing_count = adjacency[noteId].outgoing.length;
      adjacency[noteId].incoming_count = adjacency[noteId].incoming.length;
    });

    const orphanNotes = [];
    validNotes.forEach((noteId) => {
      const item = adjacency[noteId];
      if (!item || (item.outgoing_count === 0 && item.incoming_count === 0)) orphanNotes.push(noteId);
    });

    const hubNotes = Object.entries(adjacency)
      .map(([id, item]) => ({ id, degree: item.outgoing_count + item.incoming_count }))
      .sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id, "zh-Hans-CN"))
      .slice(0, 20);

    const byType = {};
    uniqueLinks.forEach((link) => {
      byType[link.type] = (byType[link.type] || 0) + 1;
    });

    return {
      schema_version: EXPORT_SCHEMA_VERSION,
      updated: new Date().toISOString(),
      vault_name: this.app.vault.getName(),
      link_types: ["wikilink", "mention", "atom_ref", "backlink"],
      links: uniqueLinks.filter((link) => validNotes.has(link.source)),
      adjacency,
      stats: {
        total_links: uniqueLinks.length,
        orphan_notes: uniqueSortedStrings(orphanNotes),
        hub_notes: hubNotes,
        by_type: byType
      }
    };
  }

  async exportState(reason) {
    const { notes, indexes, mermaidHiddenCount } = this.buildDerivedExportData();
    const linksJson = this.buildLinksJson(notes);
    const nowIso = new Date().toISOString();

    const notesJson = {
      schema_version: EXPORT_SCHEMA_VERSION,
      updated: nowIso,
      vault_name: this.app.vault.getName(),
      notes,
      stats: {
        total_notes: Object.keys(notes).length,
        atom_notes: Object.keys(notes).length,
        scan_duration_ms: 0,
        last_reason: reason
      }
    };

    if (this.settings.compatibilityMode) {
      notesJson.schema_extensions = {
        custom_fields: [
          "computed.mermaid.is_start",
          "computed.mermaid.hide_in_tree",
          "indexes.by_mermaid_start",
          "indexes.by_tree_visible"
        ],
        added_at: nowIso
      };
      notesJson.indexes = indexes;
      notesJson.stats.indexed_keywords_count = Object.keys(indexes.by_keyword || {}).length;
      notesJson.stats.tree_structure_count = normalizeArray(indexes.by_tree_structure).length;
      notesJson.stats.tree_visible_count = normalizeArray(indexes.by_tree_visible).length;
      notesJson.stats.mermaid_start_count = normalizeArray(indexes.by_mermaid_start).length;
      notesJson.stats.mermaid_hidden_count = mermaidHiddenCount;
    }

    const indexesJson = {
      schema_version: EXPORT_SCHEMA_VERSION,
      updated: nowIso,
      vault_name: this.app.vault.getName(),
      indexes,
      stats: {
        indexed_keywords_count: Object.keys(indexes.by_keyword || {}).length,
        tree_structure_count: normalizeArray(indexes.by_tree_structure).length,
        tree_visible_count: normalizeArray(indexes.by_tree_visible).length,
        mermaid_start_count: normalizeArray(indexes.by_mermaid_start).length,
        mermaid_hidden_count: mermaidHiddenCount,
        last_reason: reason
      }
    };

    await this.ensureOutputFolder();
    const notesPath = this.getNotesPath();
    const linksPath = this.getLinksPath();
    const indexesPath = this.getIndexesPath();
    await this.writeJsonIfChanged(notesPath, notesJson);
    await this.writeJsonIfChanged(linksPath, linksJson);
    await this.writeJsonIfChanged(indexesPath, indexesJson);
    this.runtimeStats.lastExport = {
      at: new Date().toISOString(),
      reason,
      paths: [notesPath, linksPath, indexesPath]
    };
  }

  async ensureOutputFolder() {
    const folder = String(this.settings.outputFolder || "").trim();
    if (!folder) return;
    const parts = folder.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      const normalized = normalizePath(current);
      if (this.app.vault.getAbstractFileByPath(normalized)) continue;
      await this.app.vault.createFolder(normalized);
    }
  }

  async writeJsonIfChanged(path, data) {
    const normalizedPath = normalizePath(path);
    const content = JSON.stringify(data, null, 2);
    const existing = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (existing instanceof TFile) {
      const previous = await this.app.vault.cachedRead(existing);
      if (previous === content) return false;
      await this.app.vault.modify(existing, content);
      return true;
    }

    await this.app.vault.create(normalizedPath, content);
    return true;
  }

  async loadStateFile() {
    try {
      const path = this.getStatePath();
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (!(existing instanceof TFile)) return createEmptyState();
      const raw = await this.app.vault.cachedRead(existing);
      const parsed = JSON.parse(raw);
      if (parsed?.schema_version !== STATE_SCHEMA_VERSION) return createEmptyState();
      const state = createEmptyState();
      state.updated = parsed.updated || null;
      state.byPath = cloneJson(parsed.byPath || {}, {});
      state.byNoteId = cloneJson(parsed.byNoteId || {}, {});
      state.indexes = cloneJson(parsed.indexes || createEmptyIndexes(), createEmptyIndexes());
      state.stats = cloneJson(parsed.stats || state.stats, state.stats);
      return state;
    } catch (error) {
      console.error("[EVA Incremental Indexer] failed to load state", error);
      return createEmptyState();
    }
  }

  async saveStateFile(reason) {
    this.recomputeStateStats(this.state, reason);
    await this.ensureOutputFolder();
    const statePath = this.getStatePath();
    await this.writeJsonIfChanged(statePath, this.state);
    if (this.runtimeStats.lastExport) {
      this.runtimeStats.lastExport.statePath = statePath;
    }
  }

  getResolvedOutputPath() {
    const relative = String(this.settings.outputFolder || "").trim();
    const adapterBasePath = this.app.vault?.adapter?.basePath;
    if (adapterBasePath) {
      return relative ? `${adapterBasePath}/${relative}` : adapterBasePath;
    }
    return relative || "/";
  }

  getDiagnosticsSnapshot() {
    const lastEvent = this.runtimeStats?.lastEvent
      ? `${this.runtimeStats.lastEvent.type} | ${this.runtimeStats.lastEvent.path} | ${this.runtimeStats.lastEvent.at}`
      : "";
    const lastFlush = this.runtimeStats?.lastFlush
      ? `${this.runtimeStats.lastFlush.reason} | processed ${this.runtimeStats.lastFlush.processed.length} | changed ${this.runtimeStats.lastFlush.changed} | errors ${this.runtimeStats.lastFlush.errors.length} | ${this.runtimeStats.lastFlush.at}`
      : "";
    const lastError = this.runtimeStats?.lastError
      ? `${this.runtimeStats.lastError.type || "error"} | ${this.runtimeStats.lastError.path || ""} | ${this.runtimeStats.lastError.message || ""}`
      : "";
    const exportPaths = this.runtimeStats?.lastExport?.paths || [];
    return {
      resolvedOutputPath: this.getResolvedOutputPath(),
      statePath: this.getStatePath(),
      notesPath: this.getNotesPath(),
      linksPath: this.getLinksPath(),
      indexesPath: this.getIndexesPath(),
      trackedNotes: Object.keys(this.state?.byNoteId || {}).length,
      dirtyQueueLength: this.dirtyQueue?.length || 0,
      lastEvent,
      lastFlush,
      lastError,
      exportPaths
    };
  }
}

class EVAIndexerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "EVA Incremental Indexer" });
    containerEl.createEl("p", {
      cls: "eva-indexer-setting-hint",
      text: "建议先在测试库验证。这个插件会监听 create / modify / rename / delete 事件，并增量更新 EVA 索引。"
    });

    new Setting(containerEl)
      .setName("输出目录")
      .setDesc("相对 vault 根目录。留空表示写到 vault 根目录。")
      .addText((text) => text
        .setPlaceholder("例如: data/raw/26- supermemoconcept的改进")
        .setValue(this.plugin.settings.outputFolder)
        .onChange(async (value) => {
          this.plugin.settings.outputFolder = String(value || "").trim().replace(/^\/+|\/+$/g, "");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("ATOM 文件匹配正则")
      .setDesc("默认只索引文件名以 ATOM@ 开头的 Markdown。")
      .addText((text) => text
        .setPlaceholder("^ATOM@")
        .setValue(this.plugin.settings.atomRegex)
        .onChange(async (value) => {
          this.plugin.settings.atomRegex = String(value || "").trim() || DEFAULT_SETTINGS.atomRegex;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Dirty queue 防抖毫秒数")
      .setDesc("文件事件先进入队列，等待一小段时间后批量 flush。")
      .addText((text) => text
        .setPlaceholder("800")
        .setValue(String(this.plugin.settings.debounceMs))
        .onChange(async (value) => {
          this.plugin.settings.debounceMs = Math.max(100, Number(value) || DEFAULT_SETTINGS.debounceMs);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("全量扫描并发数")
      .setDesc("只影响全量重建，不影响日常事件增量。")
      .addText((text) => text
        .setPlaceholder("4")
        .setValue(String(this.plugin.settings.maxConcurrency))
        .onChange(async (value) => {
          this.plugin.settings.maxConcurrency = Math.max(1, Math.min(16, Number(value) || DEFAULT_SETTINGS.maxConcurrency));
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("启动后全量扫描")
      .setDesc("插件加载完成后自动做一次全库对账。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.fullScanOnStartup)
        .onChange(async (value) => {
          this.plugin.settings.fullScanOnStartup = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Flush 后自动导出 JSON")
      .setDesc("关闭后只更新内部状态文件，需要手动执行导出命令。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoExportOnFlush)
        .onChange(async (value) => {
          this.plugin.settings.autoExportOnFlush = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("使用 cachedRead")
      .setDesc("读取索引源文件时优先使用 Vault.cachedRead()。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.useCachedRead)
        .onChange(async (value) => {
          this.plugin.settings.useCachedRead = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("兼容模式")
      .setDesc("开启后 EVA_Notes.json 会保留旧结构里的 indexes 字段，方便现有页面继续读取。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.compatibilityMode)
        .onChange(async (value) => {
          this.plugin.settings.compatibilityMode = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("显示通知")
      .setDesc("控制全量重建和异常时是否弹 Notice。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showNotices)
        .onChange(async (value) => {
          this.plugin.settings.showNotices = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("EVA_Notes 文件名")
      .setDesc("默认 EVA_Notes.json。")
      .addText((text) => text
        .setPlaceholder("EVA_Notes.json")
        .setValue(this.plugin.settings.notesFileName)
        .onChange(async (value) => {
          this.plugin.settings.notesFileName = String(value || "").trim() || DEFAULT_SETTINGS.notesFileName;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("EVA_Links 文件名")
      .setDesc("默认 EVA_Links.json。")
      .addText((text) => text
        .setPlaceholder("EVA_Links.json")
        .setValue(this.plugin.settings.linksFileName)
        .onChange(async (value) => {
          this.plugin.settings.linksFileName = String(value || "").trim() || DEFAULT_SETTINGS.linksFileName;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("EVA_Indexes 文件名")
      .setDesc("默认 EVA_Indexes.json。")
      .addText((text) => text
        .setPlaceholder("EVA_Indexes.json")
        .setValue(this.plugin.settings.indexesFileName)
        .onChange(async (value) => {
          this.plugin.settings.indexesFileName = String(value || "").trim() || DEFAULT_SETTINGS.indexesFileName;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("状态缓存文件名")
      .setDesc("插件内部状态文件，包含 byPath / byNoteId / indexes。")
      .addText((text) => text
        .setPlaceholder("EVA_Indexer_State.json")
        .setValue(this.plugin.settings.stateFileName)
        .onChange(async (value) => {
          this.plugin.settings.stateFileName = String(value || "").trim() || DEFAULT_SETTINGS.stateFileName;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl("h3", { text: "诊断信息" });
    const diagnostics = this.plugin.getDiagnosticsSnapshot();
    const diagList = containerEl.createEl("div", { cls: "eva-indexer-setting-hint" });
    diagList.createEl("div", { text: `实际输出目录: ${diagnostics.resolvedOutputPath}` });
    diagList.createEl("div", { text: `Notes 输出: ${diagnostics.notesPath}` });
    diagList.createEl("div", { text: `Links 输出: ${diagnostics.linksPath}` });
    diagList.createEl("div", { text: `Indexes 输出: ${diagnostics.indexesPath}` });
    diagList.createEl("div", { text: `State 输出: ${diagnostics.statePath}` });
    diagList.createEl("div", { text: `已跟踪笔记数: ${diagnostics.trackedNotes}` });
    diagList.createEl("div", { text: `Dirty Queue: ${diagnostics.dirtyQueueLength}` });
    diagList.createEl("div", { text: `最近事件: ${diagnostics.lastEvent || "(none)"}` });
    diagList.createEl("div", { text: `最近 flush: ${diagnostics.lastFlush || "(none)"}` });
    diagList.createEl("div", { text: `最近错误: ${diagnostics.lastError || "(none)"}` });

    new Setting(containerEl)
      .setName("立即全量重建")
      .setDesc("手动执行一次全库扫描并导出。")
      .addButton((button) => button
        .setButtonText("执行")
        .onClick(async () => {
          button.setDisabled(true);
          try {
            await this.plugin.fullRebuild("settings-button");
          } finally {
            button.setDisabled(false);
          }
        }));

    new Setting(containerEl)
      .setName("立即 flush dirty queue")
      .setDesc("手动把等待中的事件队列落盘并导出。")
      .addButton((button) => button
        .setButtonText("执行")
        .onClick(async () => {
          button.setDisabled(true);
          try {
            await this.plugin.flushDirtyQueue("settings-button");
          } finally {
            button.setDisabled(false);
          }
        }));

    new Setting(containerEl)
      .setName("显示诊断信息")
      .setDesc("会把当前诊断信息输出到控制台，并弹出一条简短 Notice。")
      .addButton((button) => button
        .setButtonText("显示")
        .onClick(async () => {
          const snapshot = this.plugin.getDiagnosticsSnapshot();
          console.log("[EVA Incremental Indexer] diagnostics", snapshot);
          new Notice(
            `EVA Diagnostics\n` +
            `tracked: ${snapshot.trackedNotes}\n` +
            `dirty: ${snapshot.dirtyQueueLength}\n` +
            `lastEvent: ${truncateText(snapshot.lastEvent || "(none)", 80)}\n` +
            `lastError: ${truncateText(snapshot.lastError || "(none)", 80)}`,
            10000
          );
        }));
  }
}

module.exports = EVAIncrementalIndexerPlugin;
