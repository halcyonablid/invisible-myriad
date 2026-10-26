const obsidian = require("obsidian");
const { ItemView, Notice, Plugin, PluginSettingTab, Setting, TFile } = obsidian;

const VIEW_TYPE_DAILY_NOTE_REVIEW = "daily-note-review-view";
const KEYWORD_EVA_VIEW_TYPE = "keyword-index-plugin";
const REVIEW_META_EVENT = "daily-note-review:review-meta-changed";
const REVIEW_META_BODY_CLASS = "dnr-review-meta-active";

const DEFAULT_SETTINGS = {
  keywordIndexPath: "data/keyword_index.json",
  filePrefix: "ATOM@",
  keywordKeys: ["关键词管理", "关键词", "keywords", "keyword"],
  includeModifiedFallback: false,
  showUntaggedGroup: true,
  keywordWindowDays: 30,
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function normalizeSettings(raw = {}) {
  raw = raw && typeof raw === "object" ? raw : {};
  const keys = Array.isArray(raw.keywordKeys)
    ? raw.keywordKeys.map((item) => text(item)).filter(Boolean)
    : DEFAULT_SETTINGS.keywordKeys.slice();
  const keywordWindowDays = Math.max(1, Math.min(365, Number(raw.keywordWindowDays) || DEFAULT_SETTINGS.keywordWindowDays));
  return {
    keywordIndexPath: text(raw.keywordIndexPath, DEFAULT_SETTINGS.keywordIndexPath),
    filePrefix: text(raw.filePrefix, DEFAULT_SETTINGS.filePrefix),
    keywordKeys: keys.length ? keys : DEFAULT_SETTINGS.keywordKeys.slice(),
    includeModifiedFallback: raw.includeModifiedFallback === true,
    showUntaggedGroup: raw.showUntaggedGroup !== false,
    keywordWindowDays,
  };
}

function cleanKeyword(value) {
  return String(value == null ? "" : value).trim().replace(/^["']+|["']+$/g, "").trim();
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const value = cleanKeyword(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function splitInlineKeywordValue(value) {
  const raw = cleanKeyword(value);
  if (!raw) return [];
  const body = raw.startsWith("[") && raw.endsWith("]") ? raw.slice(1, -1) : raw;
  return [cleanKeyword(body)].filter(Boolean);
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

function parseInlineFilenameKeywords(fileName) {
  const stem = String(fileName || "").replace(/\.md$/i, "");
  const out = [];
  const dotRe = /··([^·]+)··/g;
  const plusRe = /\+\+([^+]+(?:\+[^+]+)*)\+\+/g;
  let match = null;
  while ((match = dotRe.exec(stem))) out.push(cleanKeyword(match[1]));
  while ((match = plusRe.exec(stem))) out.push(cleanKeyword(match[1]));
  return out;
}

function stripBusDrawerSegments(value) {
  const parts = cleanKeyword(value).split("+").map((part) => part.trim()).filter(Boolean);
  const kept = parts.filter((part, index) => index === 0 || !part.toUpperCase().startsWith("BUS"));
  return kept.join("+") || cleanKeyword(value);
}

function normalizeKeywordPart(value, aliasByRaw = new Map()) {
  const raw = cleanKeyword(value);
  if (!raw) return "";
  const aliased = aliasByRaw.get(raw);
  if (aliased) return aliased;
  return raw;
}

function isCodedKeywordPrefix(value) {
  return /^[A-Z]\d/.test(cleanKeyword(value));
}

function canonicalKeywordDisplay(keyword) {
  const base = text(keyword?.baseKeyword);
  const display = text(keyword?.displayText, base);
  return isCodedKeywordPrefix(base) ? base : display;
}

function normalizeGroupLabel(value, aliasByRaw = new Map()) {
  return stripBusDrawerSegments(value)
    .split("+")
    .map((part) => normalizeKeywordPart(part, aliasByRaw))
    .filter(Boolean)
    .join("+");
}

function hasBusDrawerSegment(value) {
  return cleanKeyword(value)
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part, index) => index > 0 && part.toUpperCase().startsWith("BUS"));
}

function parseAtomFile(file, filePrefix) {
  if (!(file instanceof TFile) || file.extension !== "md") return null;
  if (!file.name.startsWith(filePrefix)) return null;
  const escapedPrefix = filePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escapedPrefix}(.+?)-\\s*(.*)\\.md$`, "i");
  const match = file.name.match(re);
  if (!match) return null;
  const code = text(match[1]);
  if (!code) return null;
  return {
    code,
    title: text(match[2], file.basename),
    file,
    path: file.path,
  };
}

function parentCodeOf(code) {
  const parts = String(code || "").split(".").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join(".");
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

function dateKeyFromMs(ms) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey() {
  return dateKeyFromMs(Date.now());
}

function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKeyFromMs(date.getTime());
}

function formatTime(ms) {
  const date = new Date(ms);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function encodeEvaSegment(value) {
  return encodeURIComponent(text(value));
}

function encodeKeywordDrawerItemId(type, scope, pathParts = []) {
  return [text(type, "mixed"), text(scope, "branch"), ...(pathParts || []).map((part) => text(part)).filter(Boolean)].map(encodeEvaSegment).join("/");
}

function buildKeywordEvaNodeKey(indexPath, scopeType, scopeId, itemId) {
  const segments = [KEYWORD_EVA_VIEW_TYPE, indexPath, scopeType, scopeId, itemId].map((value) => text(value));
  if (segments.some((segment) => !segment)) return "";
  return `jump:v1:${segments.map(encodeEvaSegment).join("|")}`;
}

function splitKeywordSuffixParts(value) {
  return cleanKeyword(value).split("+").map((part) => cleanKeyword(part)).filter(Boolean);
}

function buildKeywordNodeKeyForGroup(group, indexPath) {
  const keywordId = text(group?.keywordId);
  if (!keywordId) return "";
  const suffixParts = splitKeywordSuffixParts(group?.suffix);
  if (!suffixParts.length) return buildKeywordCapsuleNodeKeyForGroup(group, indexPath);
  const sourceType = text(group?.sourceType, "yaml");
  const type = sourceType === "metadata" ? "yaml" : sourceType;
  const api = window.__keywordIndexPluginApi;
  // Never reconstruct identity from today's path; absent provider means unavailable.
  return typeof api?.resolveDrawerNodeKey === "function" ? api.resolveDrawerNodeKey({ keywordId, indexPath, type, scope: "branch", pathParts: suffixParts }) : "";
}

function buildKeywordCapsuleNodeKeyForGroup(group, indexPath) {
  const keywordId = text(group?.keywordId);
  if (!keywordId) return "";
  const api = window.__keywordIndexPluginApi;
  return typeof api?.resolveKeywordNodeKey === "function" ? api.resolveKeywordNodeKey({ keywordId, indexPath }) : "";
}

function buildKeywordLabel(keyword, suffix = "", aliasByRaw = new Map()) {
  const base = text(canonicalKeywordDisplay(keyword), "未命名关键词");
  const cleanSuffix = text(suffix);
  return normalizeGroupLabel(cleanSuffix ? `${base}${cleanSuffix}` : base, aliasByRaw);
}

function keywordSortCode(keyword, fallbackCode = "") {
  return text(keyword?.sortKey, fallbackCode);
}

class DailyNoteReviewSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Daily Note Review" });

    new Setting(containerEl)
      .setName("关键词索引路径")
      .setDesc("默认读取 data/keyword_index.json；只读，不写回。")
      .addText((input) => input
        .setValue(this.plugin.settings.keywordIndexPath)
        .onChange(async (value) => {
          this.plugin.settings.keywordIndexPath = text(value, DEFAULT_SETTINGS.keywordIndexPath);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("ATOM 文件名前缀")
      .addText((input) => input
        .setValue(this.plugin.settings.filePrefix)
        .onChange(async (value) => {
          this.plugin.settings.filePrefix = text(value, DEFAULT_SETTINGS.filePrefix);
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("关键词字段")
      .setDesc("逗号分隔。用于索引未命中时从 frontmatter 兜底读取。")
      .addText((input) => input
        .setValue(this.plugin.settings.keywordKeys.join(", "))
        .onChange(async (value) => {
          const keys = String(value || "").split(",").map((item) => text(item)).filter(Boolean);
          this.plugin.settings.keywordKeys = keys.length ? keys : DEFAULT_SETTINGS.keywordKeys.slice();
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("关键词回看天数")
      .setDesc("用于关键词回看 tab，例如 30、20、15、10。")
      .addText((input) => input
        .setPlaceholder("30")
        .setValue(String(this.plugin.settings.keywordWindowDays || DEFAULT_SETTINGS.keywordWindowDays))
        .onChange(async (value) => {
          const days = Math.max(1, Math.min(365, Number(value) || DEFAULT_SETTINGS.keywordWindowDays));
          this.plugin.settings.keywordWindowDays = days;
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("关键词窗口包含最近修改的旧 note")
      .setDesc("仅影响 N 天关键词和 Review Meta：按当前最后修改时间补入。独立的‘当天修改’栏目始终保留每日修改记录。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.includeModifiedFallback)
        .onChange(async (value) => {
          this.plugin.settings.includeModifiedFallback = value === true;
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));

    new Setting(containerEl)
      .setName("显示未归入关键词的分组")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showUntaggedGroup)
        .onChange(async (value) => {
          this.plugin.settings.showUntaggedGroup = value === true;
          await this.plugin.saveSettings();
          await this.plugin.reloadOpenViews();
        }));
  }
}

// Private observation journal. Views only query memory; notes and other owners' data are never written.
class DailyActivityHistory {
  constructor(vault, journalPath, onChange = () => {}) {
    this.vault = vault;
    this.path = journalPath;
    this.onChange = onChange;
    this.notes = new Map();
    this.activePaths = new Map();
    this.days = new Map();
    this.pending = [];
    this.buffer = [];
    this.ready = false;
    this.error = "";
    this.closed = false;
    this.timer = null;
    this.loading = null;
    this.writing = null;
    this.startedAt = 0;
    // Establish the inventory boundary before event capture, not at the later asynchronous read.
    this.seedSnapshots = vault.getMarkdownFiles().map(f => DailyActivityHistory.snapshot(f));
  }

  static uid() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  static snapshot(file, kind = "modify", oldPath = "", at = Date.now()) {
    return Object.freeze({ kind, path: String(file.path), name: String(file.basename || file.name || ""),
      markdown: file.extension === "md", folder: !file.stat, ctime: Number(file.stat?.ctime || 0),
      mtime: Number(file.stat?.mtime || 0), oldPath: String(oldPath || ""), at });
  }

  static parse(raw) {
    const events = [], ids = new Map();
    for (const [index, line] of raw.split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      let e;
      try { e = JSON.parse(line); } catch (_) { throw new Error(`历史记录第 ${index + 1} 行损坏，已停止写入`); }
      const validTime = Number.isFinite(e?.at) && e.at > 0;
      const validPath = p => typeof p === "string" && p.length > 0 && !p.startsWith("/") && !p.split("/").includes("..");
      let valid = e?.v === 1 && typeof e.id === "string" && e.id.length > 0 && validTime;
      if (e?.type === "edit") valid = valid && typeof e.noteId === "string" && !!e.noteId && validPath(e.path) &&
        typeof e.name === "string" && Number.isFinite(e.ctime) && e.ctime >= 0 && Number.isFinite(e.mtime) &&
        ["observed", "last-mtime"].includes(e.source) && typeof e.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.day);
      else if (e?.type === "rename") valid = valid && validPath(e.oldPath) && validPath(e.path);
      else if (e?.type === "delete") valid = valid && validPath(e.path);
      else if (e?.type !== "start") valid = false;
      if (!valid) throw new Error(`历史记录第 ${index + 1} 行格式不支持，已停止写入`);
      const serialized = JSON.stringify(e);
      if (ids.has(e.id) && ids.get(e.id) !== serialized) throw new Error("历史记录标识冲突，已停止写入");
      if (!ids.has(e.id)) events.push(e);
      ids.set(e.id, serialized);
    }
    return { events, ids };
  }

  emit() { if (!this.closed) this.onChange(); }
  within(path, parent) { return path === parent || path.startsWith(parent + "/"); }

  apply(e) {
    if (e.type === "start") { this.startedAt ||= e.at; return; }
    if (e.type === "edit") {
      let note = this.notes.get(e.noteId);
      if (!note) {
        const replaced = this.notes.get(this.activePaths.get(e.path));
        if (replaced) replaced.active = false;
        note = { id: e.noteId, path: e.path, name: e.name, ctime: e.ctime, active: true, edits: new Map() };
        this.notes.set(e.noteId, note);
        this.activePaths.set(e.path, note.id);
      }
      const previous = note.edits.get(e.day);
      if (!previous || (previous.source === "last-mtime" && e.source === "observed")) note.edits.set(e.day, e);
      if (!this.days.has(e.day)) this.days.set(e.day, new Set());
      this.days.get(e.day).add(note.id);
      return;
    }
    for (const note of this.notes.values()) {
      if (!note.active || !this.within(note.path, e.type === "rename" ? e.oldPath : e.path)) continue;
      this.activePaths.delete(note.path);
      if (e.type === "delete") note.active = false;
      else {
        note.path = e.path + note.path.slice(e.oldPath.length);
        note.name = note.path.split("/").pop().replace(/\.md$/i, "");
        const replaced = this.notes.get(this.activePaths.get(note.path));
        if (replaced && replaced !== note) replaced.active = false;
        this.activePaths.set(note.path, note.id);
      }
    }
  }

  queue(fields) {
    const event = { v: 1, id: DailyActivityHistory.uid(), ...fields };
    this.apply(event);
    this.pending.push(event);
    this.schedule();
  }

  capture(snapshot) {
    if (this.closed) return;
    if (!this.ready) { this.buffer.push(snapshot); return; }
    this.accept(snapshot);
  }

  accept(s, source = "observed") {
    if (s.kind === "rename" || s.kind === "delete") {
      const path = s.kind === "rename" ? s.oldPath : s.path;
      if (Array.from(this.activePaths.keys()).some(p => this.within(p, path))) {
        this.queue({ type: s.kind, path: s.path, oldPath: s.oldPath, at: s.at });
        this.emit();
      }
      return;
    }
    if (!s.markdown) return;
    let note = this.notes.get(this.activePaths.get(s.path));
    if (note && (note.ctime !== s.ctime || s.kind === "create")) {
      this.queue({ type: "delete", path: s.path, at: s.at });
      note = null;
    }
    if (s.kind === "create") return;
    const at = source === "last-mtime" ? s.mtime : s.at;
    if (!(at > 0)) return;
    const day = dateKeyFromMs(at);
    if (dateKeyFromMs(s.ctime) === day) return;
    const previous = note?.edits.get(day);
    if (previous && (previous.source === "observed" || source === "last-mtime")) return;
    this.queue({ type: "edit", noteId: note?.id || DailyActivityHistory.uid(), path: s.path, name: s.name,
      ctime: s.ctime, mtime: s.mtime, at, day, source });
    this.emit();
  }

  async start() {
    if (this.ready) return this.flush();
    if (this.loading) return this.loading;
    // Snapshot before the read: rename/delete events occurring during IO replay after these seeds.
    const seeds = this.seedSnapshots ||= this.vault.getMarkdownFiles().map(f => DailyActivityHistory.snapshot(f));
    this.loading = (async () => {
      try {
        const adapter = this.vault.adapter;
        const raw = await adapter.exists(this.path) ? await adapter.read(this.path) : "";
        const parsed = DailyActivityHistory.parse(raw);
        this.notes.clear(); this.activePaths.clear(); this.days.clear(); this.startedAt = 0;
        for (const e of parsed.events) this.apply(e);
        this.ready = true;
        this.error = "";
        if (!this.startedAt) this.queue({ type: "start", at: Date.now() });
        for (const s of seeds) this.accept(s, "last-mtime");
        for (const s of this.buffer.splice(0)) this.accept(s);
        this.seedSnapshots = null;
        this.emit();
      } catch (error) {
        this.error = String(error.message || error);
        this.emit();
      } finally { this.loading = null; }
    })();
    return this.loading;
  }

  schedule() {
    if (this.closed || this.timer || this.error) return;
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, 500);
  }

  async flush() {
    if (this.writing) return this.writing;
    if (!this.ready || !this.pending.length) return;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.writing = (async () => {
      try {
        const adapter = this.vault.adapter;
        while (this.pending.length) {
          const batch = this.pending.slice();
          if (!await adapter.exists(this.path)) await adapter.append(this.path, "");
          await adapter.process(this.path, raw => {
            const { ids } = DailyActivityHistory.parse(raw);
            const missing = batch.filter(e => {
              if (ids.has(e.id) && ids.get(e.id) !== JSON.stringify(e)) throw new Error("历史记录标识冲突");
              return !ids.has(e.id);
            });
            return raw + (missing.length ? (raw && !raw.endsWith("\n") ? "\n" : "") + missing.map(e => JSON.stringify(e)).join("\n") + "\n" : "");
          });
          const verified = DailyActivityHistory.parse(await adapter.read(this.path));
          if (batch.some(e => verified.ids.get(e.id) !== JSON.stringify(e))) throw new Error("历史记录保存校验失败，可重试");
          this.pending.splice(0, batch.length);
        }
        this.error = "";
      } catch (error) { this.error = String(error.message || error); }
      finally { this.writing = null; this.emit(); }
    })();
    return this.writing;
  }

  async retry() {
    if (!this.ready) await this.start();
    await this.flush();
  }

  resolve(noteId) {
    const note = this.notes.get(noteId);
    if (!note?.active || this.activePaths.get(note.path) !== note.id) return null;
    const file = this.vault.getAbstractFileByPath(note.path);
    return file instanceof TFile && file.extension === "md" && file.stat.ctime === note.ctime ? file : null;
  }

  query(day) {
    return Array.from(this.days.get(day) || [], id => {
      const note = this.notes.get(id), edit = note.edits.get(day);
      return { noteId: id, path: note.path, name: note.name, ctime: note.ctime, at: edit.at,
        source: edit.source, file: this.resolve(id) };
    }).sort((a, b) => a.at - b.at || a.path.localeCompare(b.path));
  }

  async close() {
    this.closed = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.loading) await this.loading;
    await this.flush();
  }
}


class DailyNoteReviewView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.dateKey = todayKey();
    this.renderSeq = 0;
    this.activeTab = "day";
    this.closed = false;
    this.dirty = false;
  }

  getViewType() {
    return VIEW_TYPE_DAILY_NOTE_REVIEW;
  }

  getDisplayText() {
    return "Daily Note Review";
  }

  getIcon() {
    return "calendar-search";
  }

  async onOpen() {
    this.closed = false;
    this.contentEl.addClass("daily-note-review-host");
    await this.render();
  }

  async onClose() {
    this.closed = true;
    this.renderSeq += 1;
    this.contentEl.empty();
  }

  async setDateKey(dateKey) {
    this.dateKey = text(dateKey, todayKey());
    await this.render();
  }

  async render(options = {}) {
    if (this.closed) return;
    const seq = ++this.renderSeq;
    const anchor = options.preserveScroll ? this.captureScroll() : null;
    this.dirty = false;
    // Keep the old tree visible until a complete replacement is ready.
    const previousRoot = this.contentEl.querySelector(".dnr-root");
    
    const root = this.contentEl.createDiv({ cls: "dnr-root" });
    this.renderToolbar(root);
    this.renderTabs(root);
    if (this.activeTab === "modified") this.renderHistoryStatus(root);
    if (previousRoot) root.style.display = "none";

    const windowDays = this.plugin.getKeywordWindowDays();
    const status = root.createDiv({ cls: "dnr-status", text: this.activeTab === "keywords" ? `正在整理近 ${windowDays} 天关键词...` : "正在整理当天清单..." });
    try {
      const model = this.activeTab === "keywords"
        ? await this.plugin.buildKeywordWindowReview(this.dateKey, windowDays)
        : await this.plugin.buildDayReview(this.dateKey, this.activeTab === "modified" ? "modified" : "created");
      if (this.closed || seq !== this.renderSeq) { root.remove(); return; }
      status.remove();
      if (this.activeTab === "keywords") {
        this.renderKeywordWindowSummary(root, model);
        this.renderKeywordWindow(root, model);
      } else {
        this.renderSummary(root, model);
        this.renderGroups(root, model);
      }
    } catch (error) {
      if (this.closed || seq !== this.renderSeq) { root.remove(); return; }
      console.error("[DailyNoteReview][render-failed]", error);
      status.setText(`整理失败：${error.message || error}`);
      status.addClass("dnr-error");
    }
    for (const old of this.contentEl.querySelectorAll(".dnr-root")) if (old !== root) old.remove();
    root.style.display = "";
    if (anchor) this.restoreScroll(anchor);
    else this.contentEl.scrollTop = 0;
  }

  captureScroll() {
    const top = this.contentEl.getBoundingClientRect().top;
    const row = Array.from(this.contentEl.querySelectorAll("[data-dnr-anchor]")).find(el => el.getBoundingClientRect().bottom > top);
    return { top: this.contentEl.scrollTop, key: row?.dataset.dnrAnchor, offset: row ? row.getBoundingClientRect().top - top : 0 };
  }

  restoreScroll(anchor) {
    this.contentEl.scrollTop = anchor.top;
    if (!anchor.key) return;
    const row = Array.from(this.contentEl.querySelectorAll("[data-dnr-anchor]")).find(el => el.dataset.dnrAnchor === anchor.key);
    if (row) this.contentEl.scrollTop += row.getBoundingClientRect().top - this.contentEl.getBoundingClientRect().top - anchor.offset;
  }

  renderHistoryStatus(root) {
    const history = this.plugin.activityHistory;
    const box = root.createDiv({ cls: "dnr-history-status" });
    box.createDiv({ text: "每天每篇只列一次；当天新建的笔记在‘当天创建’。启用前只能按现有最后修改时间补入；分组使用当前关键词。" });
    if (!history?.ready) box.createDiv({ text: "正在读取每日修改记录…" });
    if (history?.pending.length) box.createDiv({ text: "待保存 " + history.pending.length + " 条记录" });
    if (history?.error) {
      box.createDiv({ cls: "dnr-error", text: "历史记录：" + history.error + "。原记录保留，未保存内容仍在内存中。" });
      box.createEl("button", { text: "重试历史记录" }).onclick = async () => { await history.retry(); if (!this.closed) await this.render({ preserveScroll: true }); };
    }
  }


  renderToolbar(root) {
    const toolbar = root.createDiv({ cls: "dnr-toolbar" });
    toolbar.createEl("button", { text: "<", attr: { "aria-label": "前一天" } }).onclick = async () => {
      await this.setDateKey(shiftDateKey(this.dateKey, -1));
    };
    const input = toolbar.createEl("input", { type: "date", value: this.dateKey, cls: "dnr-date-input" });
    input.onchange = async () => {
      await this.setDateKey(text(input.value, todayKey()));
    };
    toolbar.createEl("button", { text: ">", attr: { "aria-label": "后一天" } }).onclick = async () => {
      await this.setDateKey(shiftDateKey(this.dateKey, 1));
    };
    toolbar.createEl("button", { text: "今天" }).onclick = async () => {
      await this.setDateKey(todayKey());
    };
    toolbar.createEl("button", { text: "刷新" }).onclick = async () => {
      this.plugin.clearCaches();
      await this.render();
    };
    const daysInput = toolbar.createEl("input", {
      type: "number",
      value: String(this.plugin.getKeywordWindowDays()),
      cls: "dnr-review-meta-days",
      attr: { min: "1", max: "365", "aria-label": "Review Meta 回看天数" },
    });
    daysInput.title = "Review Meta 与关键词回看 tab 共用的回看天数";
    daysInput.onchange = async () => {
      const days = Math.max(1, Math.min(365, Number(daysInput.value) || DEFAULT_SETTINGS.keywordWindowDays));
      daysInput.value = String(days);
      this.plugin.settings.keywordWindowDays = days;
      await this.plugin.saveSettings();
      if (this.plugin.isReviewMetaActive()) await this.plugin.startReviewMeta({ endDateKey: this.dateKey, days });
      await this.render();
    };
    const reviewMetaActive = this.plugin.isReviewMetaActive();
    const metaBtn = toolbar.createEl("button", {
      text: reviewMetaActive ? "退出 Review Meta" : "Review Meta",
      cls: `dnr-review-meta-toggle${reviewMetaActive ? " is-active" : ""}`,
    });
    metaBtn.title = reviewMetaActive
      ? "关闭关键词索引中的近期回看悬浮标记"
      : `开启 Review Meta：用当前日期向前回看 ${this.plugin.getKeywordWindowDays()} 天，并在关键词索引中悬浮标记近期关键词`;
    metaBtn.onclick = async () => {
      if (this.plugin.isReviewMetaActive()) {
        this.plugin.stopReviewMeta();
      } else {
        await this.plugin.startReviewMeta({ endDateKey: this.dateKey, days: this.plugin.getKeywordWindowDays() });
      }
      await this.render();
    };
  }

  renderTabs(root) {
    const tabs = root.createDiv({ cls: "dnr-tabs" });
    [
      { id: "day", label: "当天创建" },
      { id: "modified", label: "当天修改" },
      { id: "keywords", label: `${this.plugin.getKeywordWindowDays()}天关键词` },
    ].forEach((tab) => {
      const btn = tabs.createEl("button", { cls: `dnr-tab${this.activeTab === tab.id ? " is-active" : ""}`, text: tab.label });
      btn.onclick = async () => {
        if (this.activeTab === tab.id) return;
        this.activeTab = tab.id;
        await this.render();
      };
    });
  }

  renderSummary(root, model) {
    const summary = root.createDiv({ cls: "dnr-summary" });
    summary.createEl("div", { cls: "dnr-summary-title", text: `${model.dateKey} ${model.mode === "modified" ? "当天修改" : "当天创建"}` });
    const meta = summary.createDiv({ cls: "dnr-summary-meta" });
    meta.createSpan({ text: `${model.totalNotes} 条 note` });
    meta.createSpan({ text: `${model.groups.length} 个关键词位置` });
    if (model.modifiedOnlyCount) meta.createSpan({ text: `${model.modifiedOnlyCount} 条为当天修改` });
  }

  renderGroups(root, model) {
    const list = root.createDiv({ cls: "dnr-group-list" });
    if (!model.groups.length) {
      list.createDiv({ cls: "dnr-empty", text: "这一天没有匹配到 Markdown note。" });
      return;
    }

    for (const group of model.groups) {
      const groupEl = list.createDiv({ cls: `dnr-group dnr-group-${group.kind}` });
      const header = groupEl.createDiv({ cls: "dnr-group-header" });
      const titleWrap = header.createDiv({ cls: "dnr-group-title-wrap" });
      titleWrap.createEl("div", { cls: "dnr-group-title", text: group.label });
      const sub = titleWrap.createEl("div", { cls: "dnr-group-subtitle" });
      sub.setText(group.sortCode ? `${group.sortCode} · ${group.sourceLabel}` : group.sourceLabel);
      header.createDiv({ cls: "dnr-count", text: String(group.notes.length) });

      const notes = groupEl.createDiv({ cls: "dnr-note-list" });
      for (const item of group.notes) {
        this.renderNote(notes, item);
      }
    }
  }

  renderNote(parent, item) {
    const row = parent.createDiv({ cls: "dnr-note-row" });
    row.dataset.dnrAnchor = item.noteId || item.path;
    const main = row.createDiv({ cls: "dnr-note-main" });
    const title = main.createEl("button", { cls: "dnr-note-title", text: item.title });
    title.onclick = async () => {
      await this.plugin.openReviewItem(item, false, this.leaf);
    };
    const meta = main.createDiv({ cls: "dnr-note-meta" });
    meta.createSpan({ text: item.code || "非 ATOM" });
    meta.createSpan({ text: `创建 ${formatTime(item.ctime)}` });
    if (item.noteId) {
      meta.createSpan({ text: (item.source === "observed" ? "首次记录 " : "按最后修改时间补入 ") + formatTime(item.activityAt) });
      if (item.unavailable) meta.createSpan({ cls: "dnr-error", text: "原笔记不可用（已删除、移动或被替换）" });
    } else if (item.modifiedOnly) meta.createSpan({ text: "修改 " + formatTime(item.mtime) });
    if (item.inheritedFrom) meta.createSpan({ text: `继承自 ${item.inheritedFrom}` });
    meta.createSpan({ text: item.path });
    const actions = row.createDiv({ cls: "dnr-note-actions" });
    actions.createEl("button", { text: "打开" }).onclick = async () => {
      await this.plugin.openReviewItem(item, false, this.leaf);
    };
    actions.createEl("button", { text: "树" }).onclick = async () => {
      await this.plugin.openReviewItem(item, true, this.leaf);
    };
  }

  renderKeywordWindowSummary(root, model) {
    const summary = root.createDiv({ cls: "dnr-summary" });
    summary.createEl("div", { cls: "dnr-summary-title", text: `${model.startDateKey} ~ ${model.endDateKey} 关键词回看` });
    const meta = summary.createDiv({ cls: "dnr-summary-meta" });
    meta.createSpan({ text: `${model.keywords.length} 个关键词` });
    meta.createSpan({ text: `${model.totalNotes} 条 note` });
    meta.createSpan({ text: `${model.days} 天窗口` });
  }

  renderKeywordWindow(root, model) {
    const list = root.createDiv({ cls: "dnr-keyword-window" });
    if (!model.keywords.length) {
      list.createDiv({ cls: "dnr-empty", text: `近 ${model.days} 天没有匹配到可定位的关键词。` });
      return;
    }
    for (const item of model.keywords) {
      const row = list.createDiv({ cls: "dnr-keyword-row" });
      row.dataset.dnrAnchor = item.nodeKey || item.label;
      const main = row.createDiv({ cls: "dnr-keyword-main" });
      const title = main.createEl("button", { cls: "dnr-keyword-title", text: item.label });
      title.onclick = async () => {
        await this.plugin.revealInKeywordIndex(item.nodeKey, item.label);
      };
      const meta = main.createDiv({ cls: "dnr-keyword-meta" });
      if (item.sortCode) meta.createSpan({ text: item.sortCode });
      meta.createSpan({ text: `${item.noteCount} 条 note` });
      meta.createSpan({ text: `${item.dayCount} 天` });
      meta.createSpan({ text: `最近 ${item.latestDateKey}` });
      if (item.sourceLabel) meta.createSpan({ text: item.sourceLabel });
      const actions = row.createDiv({ cls: "dnr-keyword-actions" });
      actions.createEl("button", { text: "定位" }).onclick = async () => {
        await this.plugin.revealInKeywordIndex(item.nodeKey, item.label);
      };
    }
  }
}

class DailyNoteReviewPlugin extends Plugin {
  async onload() {
    this.settings = normalizeSettings(await this.loadData());
    this.keywordIndexCache = null;
    this.reviewMetaState = {
      active: false,
      days: this.getKeywordWindowDays(),
      endDateKey: todayKey(),
      snapshot: null,
      startedAt: 0,
    };
    this.reviewMetaRefreshTimer = null;
    this.activityRefreshTimer = null;
    this.activityClosed = false;
    this.activityHistory = null;
    this.registerView(VIEW_TYPE_DAILY_NOTE_REVIEW, (leaf) => new DailyNoteReviewView(leaf, this));
    window.__dailyNoteReviewPluginApi = this.buildPublicApi();
    this.addRibbonIcon("calendar-search", "每日 Note 回看", async () => {
      await this.activateView();
    });
    this.addCommand({
      id: "open-daily-note-review",
      name: "Open Daily Note Review",
      callback: async () => await this.activateView(),
    });
    this.addCommand({
      id: "open-today-note-review",
      name: "Open Today Note Review",
      callback: async () => {
        const leaf = await this.activateView();
        if (leaf.view instanceof DailyNoteReviewView) await leaf.view.setDateKey(todayKey());
      },
    });
    this.addSettingTab(new DailyNoteReviewSettingTab(this.app, this));
    for (const kind of ["create", "modify", "rename", "delete"]) {
      this.registerEvent(this.app.vault.on(kind, (file, oldPath) => {
        this.activityHistory?.capture(DailyActivityHistory.snapshot(file, kind, oldPath));
        this.clearCaches();
        this.scheduleActivityRefresh();
      }));
    }
    this.registerEvent(this.app.workspace.on("active-leaf-change", leaf => {
      if (leaf?.view instanceof DailyNoteReviewView && leaf.view.dirty) void leaf.view.render({ preserveScroll: true });
    }));
    this.app.workspace.onLayoutReady(() => {
      if (this.activityClosed) return;
      // Initial vault discovery is not a newly created note. Observe only after layout readiness.
      this.activityHistory = new DailyActivityHistory(this.app.vault, this.manifest.dir + "/activity-history.jsonl", () => this.scheduleActivityRefresh());
      void this.activityHistory.start();
    });
  }

  onunload() {
    this.activityClosed = true;
    if (this.activityRefreshTimer) window.clearTimeout(this.activityRefreshTimer);
    void this.activityHistory?.close();
    this.stopReviewMeta({ silent: true });
    if (window.__dailyNoteReviewPluginApi === this.api) delete window.__dailyNoteReviewPluginApi;
    if (this.reviewMetaRefreshTimer) {
      window.clearTimeout(this.reviewMetaRefreshTimer);
      this.reviewMetaRefreshTimer = null;
    }
    this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTE_REVIEW).forEach((leaf) => leaf.detach());
  }

  scheduleActivityRefresh() {
    if (this.activityClosed || this.activityRefreshTimer) return;
    this.activityRefreshTimer = window.setTimeout(() => {
      this.activityRefreshTimer = null;
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTE_REVIEW)) {
        const view = leaf.view;
        if (!(view instanceof DailyNoteReviewView) || view.closed) continue;
        view.dirty = true;
        const visible = leaf === this.app.workspace.activeLeaf || Boolean(view.contentEl.getClientRects().length && view.contentEl.offsetHeight);
        if (visible) void view.render({ preserveScroll: true });
      }
    }, 350);
  }

  async openReviewItem(item, inTree = false, sourceLeaf) {
    const file = item.noteId ? this.activityHistory.resolve(item.noteId) : this.app.vault.getAbstractFileByPath(item.path);
    if (!(file instanceof TFile)) { new Notice("原笔记不可用，历史记录仍保留。"); return false; }
    return inTree ? this.revealInEvaTree(file.path, sourceLeaf) : this.openNote(file.path, sourceLeaf);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  clearCaches() {
    this.keywordIndexCache = null;
    this.scheduleReviewMetaRefresh("vault-change");
  }

  buildPublicApi() {
    this.api = {
      version: "0.1.0",
      startReviewMeta: async (options = {}) => await this.startReviewMeta(options),
      stopReviewMeta: (options = {}) => this.stopReviewMeta(options),
      getReviewMetaState: () => this.getReviewMetaState(),
      getReviewMetaSnapshot: () => this.getReviewMetaSnapshot(),
      isReviewMetaActive: () => this.isReviewMetaActive(),
    };
    return this.api;
  }

  isReviewMetaActive() {
    return this.reviewMetaState?.active === true;
  }

  getReviewMetaState() {
    const snapshot = this.reviewMetaState?.snapshot || null;
    return {
      active: this.isReviewMetaActive(),
      days: this.reviewMetaState?.days || this.getKeywordWindowDays(),
      startDateKey: snapshot?.startDateKey || "",
      endDateKey: this.reviewMetaState?.endDateKey || snapshot?.endDateKey || "",
      keywordCount: snapshot?.keywords?.length || 0,
      totalNotes: snapshot?.totalNotes || 0,
      builtAt: snapshot?.builtAt || 0,
      startedAt: this.reviewMetaState?.startedAt || 0,
      snapshot,
    };
  }

  getReviewMetaSnapshot() {
    return this.reviewMetaState?.snapshot || null;
  }

  emitReviewMetaChanged(reason = "changed") {
    document.body?.classList?.toggle(REVIEW_META_BODY_CLASS, this.isReviewMetaActive());
    window.dispatchEvent(new CustomEvent(REVIEW_META_EVENT, {
      detail: {
        reason,
        state: this.getReviewMetaState(),
      },
    }));
  }

  async startReviewMeta(options = {}) {
    const days = Math.max(1, Math.min(365, Number(options.days) || this.getKeywordWindowDays()));
    const endDateKey = text(options.endDateKey, todayKey());
    const snapshot = await this.buildReviewMetaSnapshot(endDateKey, days);
    this.reviewMetaState = {
      active: true,
      days,
      endDateKey,
      snapshot,
      startedAt: Date.now(),
    };
    this.emitReviewMetaChanged("start");
    new Notice(`Review Meta 已开启：${snapshot.startDateKey} ~ ${snapshot.endDateKey}，${snapshot.keywords.length} 个关键词`);
    console.info("[DailyNoteReview][review-meta.start]", {
      days,
      startDateKey: snapshot.startDateKey,
      endDateKey: snapshot.endDateKey,
      keywordCount: snapshot.keywords.length,
      totalNotes: snapshot.totalNotes,
    });
    return this.getReviewMetaState();
  }

  stopReviewMeta(options = {}) {
    this.reviewMetaState = {
      active: false,
      days: this.reviewMetaState?.days || this.getKeywordWindowDays(),
      endDateKey: this.reviewMetaState?.endDateKey || todayKey(),
      snapshot: null,
      startedAt: 0,
    };
    if (this.reviewMetaRefreshTimer) {
      window.clearTimeout(this.reviewMetaRefreshTimer);
      this.reviewMetaRefreshTimer = null;
    }
    this.emitReviewMetaChanged("stop");
    if (!options.silent) new Notice("Review Meta 已关闭");
    console.info("[DailyNoteReview][review-meta.stop]");
    return this.getReviewMetaState();
  }

  scheduleReviewMetaRefresh(reason = "refresh") {
    if (!this.isReviewMetaActive()) return;
    if (this.reviewMetaRefreshTimer) window.clearTimeout(this.reviewMetaRefreshTimer);
    this.reviewMetaRefreshTimer = window.setTimeout(async () => {
      this.reviewMetaRefreshTimer = null;
      if (!this.isReviewMetaActive()) return;
      try {
        const days = this.reviewMetaState?.days || this.getKeywordWindowDays();
        const endDateKey = this.reviewMetaState?.endDateKey || todayKey();
        this.reviewMetaState.snapshot = await this.buildReviewMetaSnapshot(endDateKey, days);
        this.emitReviewMetaChanged(reason);
        console.info("[DailyNoteReview][review-meta.refreshed]", {
          reason,
          days,
          endDateKey,
          keywordCount: this.reviewMetaState.snapshot?.keywords?.length || 0,
        });
      } catch (error) {
        console.warn("[DailyNoteReview][review-meta.refresh-failed]", { reason, error });
      }
    }, 900);
  }

  getKeywordWindowDays() {
    return Math.max(1, Math.min(365, Number(this.settings?.keywordWindowDays) || DEFAULT_SETTINGS.keywordWindowDays));
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTE_REVIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_DAILY_NOTE_REVIEW, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof DailyNoteReviewView) await leaf.view.render();
    return leaf;
  }

  async reloadOpenViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTE_REVIEW)) {
      if (leaf.view instanceof DailyNoteReviewView) await leaf.view.render();
    }
  }

  async loadKeywordIndex() {
    const path = this.settings.keywordIndexPath;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      return { keywords: {}, pathToEntries: new Map(), codeToGroups: new Map(), aliasByRaw: new Map(), keywordIdByLabel: new Map() };
    }
    const signature = `${file.path}:${file.stat.mtime}:${file.stat.size}`;
    if (this.keywordIndexCache?.signature === signature) return this.keywordIndexCache.index;

    const raw = JSON.parse(await this.app.vault.cachedRead(file));
    const keywords = raw?.keywords && typeof raw.keywords === "object" ? raw.keywords : {};
    const aliasByRaw = new Map();
    const keywordIdByLabel = new Map();
    for (const keyword of Object.values(keywords)) {
      const display = canonicalKeywordDisplay(keyword);
      const base = text(keyword?.baseKeyword);
      const sortCode = keywordSortCode(keyword, "");
      if (display) aliasByRaw.set(display, display);
      if (base && display) aliasByRaw.set(base, display);
      const keywordId = text(keyword?.id);
      [display, base, text(keyword?.displayText)].forEach((label) => {
        const normalized = normalizeGroupLabel(label, aliasByRaw);
        if (keywordId && normalized && !keywordIdByLabel.has(normalized)) keywordIdByLabel.set(normalized, { keywordId, sortCode });
      });
    }
    const pathToEntries = new Map();
    const codeToGroups = new Map();
    for (const keyword of Object.values(keywords)) {
      for (const note of keyword.notes || []) {
        const notePath = text(note.path);
        if (!notePath) continue;
        const fileForNote = this.app.vault.getAbstractFileByPath(notePath);
        const atom = fileForNote instanceof TFile ? parseAtomFile(fileForNote, this.settings.filePrefix) : null;
        const entry = {
          keywordId: text(keyword.id),
          label: buildKeywordLabel(keyword, note.suffix, aliasByRaw),
          baseLabel: canonicalKeywordDisplay(keyword),
          suffix: text(note.suffix),
          hasBusDrawer: hasBusDrawerSegment(`${text(keyword.displayText, keyword.baseKeyword)}${text(note.suffix)}`),
          sortCode: keywordSortCode(keyword, atom?.code || ""),
          sourcePath: notePath,
          sourceType: text(note.sourceType, keyword.type),
        };
        if (!pathToEntries.has(notePath)) pathToEntries.set(notePath, []);
        pathToEntries.get(notePath).push(entry);
        if (atom?.code) {
          if (!codeToGroups.has(atom.code)) codeToGroups.set(atom.code, []);
          codeToGroups.get(atom.code).push(entry);
        }
      }
    }
    const index = { keywords, pathToEntries, codeToGroups, aliasByRaw, keywordIdByLabel };
    this.keywordIndexCache = { signature, index };
    return index;
  }

  buildAtomIndex() {
    const records = [];
    const codeToRecord = new Map();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const record = parseAtomFile(file, this.settings.filePrefix);
      if (!record) continue;
      records.push(record);
      codeToRecord.set(record.code, record);
    }
    records.sort((left, right) => compareCodes(left.code, right.code));
    return { records, codeToRecord };
  }

  getFrontmatterGroups(file, atom, keywordIndex) {
    const cache = this.app.metadataCache.getFileCache(file);
    const values = [
      ...parseFrontmatterKeywordValues(cache?.frontmatter, this.settings),
      ...parseInlineFilenameKeywords(file.name),
    ];
    return unique(values).map((keyword) => {
      const label = normalizeGroupLabel(keyword, keywordIndex?.aliasByRaw);
      const baseLabel = label.split("+")[0] || label;
      const labelMatch = keywordIndex?.keywordIdByLabel?.get(label) || keywordIndex?.keywordIdByLabel?.get(baseLabel) || null;
      return {
      keywordId: text(labelMatch?.keywordId, typeof labelMatch === "string" ? labelMatch : ""),
      label,
      baseLabel,
      suffix: label.includes("+") ? label.slice(label.indexOf("+")) : "",
      hasBusDrawer: hasBusDrawerSegment(keyword),
      sortCode: text(labelMatch?.sortCode, atom?.code || ""),
      sourcePath: file.path,
      sourceType: "metadata",
    };
    });
  }

  getGroupsForFile(file, atom, keywordIndex) {
    const indexed = keywordIndex.pathToEntries.get(file.path) || [];
    const frontmatter = this.getFrontmatterGroups(file, atom, keywordIndex);
    const byLabel = new Map();
    for (const item of indexed) {
      const key = text(item.label);
      if (key && !byLabel.has(key)) byLabel.set(key, item);
    }
    for (const item of frontmatter) {
      const key = text(item.label);
      if (key && !byLabel.has(key)) byLabel.set(key, item);
    }
    return Array.from(byLabel.values());
  }

  findNearestAncestorGroups(atom, keywordIndex, atomIndex) {
    let code = parentCodeOf(atom?.code);
    while (code) {
      const record = atomIndex.codeToRecord.get(code);
      if (record) {
        const groups = this.getGroupsForFile(record.file, record, keywordIndex).filter((group) => !group.hasBusDrawer);
        if (groups.length) return { groups, inheritedFrom: code };
      }
      const indexed = (keywordIndex.codeToGroups.get(code) || []).filter((group) => !group.hasBusDrawer);
      if (indexed?.length) return { groups: indexed, inheritedFrom: code };
      code = parentCodeOf(code);
    }
    return { groups: [], inheritedFrom: "" };
  }

  async buildDayReview(dateKey, mode = "legacy") {
    const keywordIndex = await this.loadKeywordIndex();
    const atomIndex = this.buildAtomIndex();
    const groupsByKey = new Map();
    let totalNotes = 0;
    let modifiedOnlyCount = 0;

    const normalizeBundleGroups = (groups, atom, sourceLabel) => {
      const byKey = new Map();
      for (const group of groups) {
        const normalized = {
          ...group,
          label: text(group.label),
          sortCode: text(group.sortCode, atom?.code || ""),
          sourceLabel,
        };
        if (!normalized.label) continue;
        const key = `${normalized.label}|${normalized.sortCode}`;
        if (!byKey.has(key)) byKey.set(key, normalized);
      }
      return Array.from(byKey.values())
        .sort((left, right) => compareCodes(left.sortCode, right.sortCode) || left.label.localeCompare(right.label, "zh-CN"));
    };

    const addToGroup = (bundleGroups, item) => {
      const primary = bundleGroups[0];
      const labels = bundleGroups.map((group) => group.label);
      const key = bundleGroups.map((group) => `${group.label}|${group.sortCode}`).join("||");
      if (!groupsByKey.has(key)) {
        groupsByKey.set(key, {
          key,
          label: labels.join(" / "),
          kind: primary?.kind || "keyword",
          sortCode: text(primary?.sortCode),
          sourceLabel: bundleGroups.length > 1
            ? `多关键词 ${bundleGroups.length} 个 · ${primary?.sourceLabel || "关键词位置"}`
            : (primary?.sourceLabel || "关键词位置"),
          notes: [],
        });
      }
      const target = groupsByKey.get(key);
      if (!target.notes.some((note) => (note.noteId || note.path) === (item.noteId || item.path))) {
        target.notes.push(item);
      }
    };

    const candidates = mode === "modified"
      ? (this.activityHistory?.query(dateKey) || [])
      : this.app.vault.getMarkdownFiles().map(file => ({ file }));
    for (const activity of candidates) {
      const file = activity.file;
      if (!file) {
        totalNotes += 1; modifiedOnlyCount += 1;
        addToGroup([{ label: "保留的历史（原笔记不可用）", sortCode: "~~~~~", kind: "history", sourceLabel: "仅保留记录，不跳转到同路径的新笔记" }],
          { path: activity.path, title: activity.name, code: "", ctime: activity.ctime, mtime: activity.at,
            noteId: activity.noteId, source: activity.source, activityAt: activity.at, modifiedOnly: true, unavailable: true });
        continue;
      }
      const createdToday = dateKeyFromMs(file.stat.ctime) === dateKey;
      const modifiedToday = mode === "modified" || (mode === "legacy" && !createdToday && this.settings.includeModifiedFallback && dateKeyFromMs(file.stat.mtime) === dateKey);
      if (!createdToday && !modifiedToday) continue;

      const atom = parseAtomFile(file, this.settings.filePrefix);
      const allDirectGroups = this.getGroupsForFile(file, atom, keywordIndex);
      const directGroups = allDirectGroups.filter((group) => !group.hasBusDrawer);
      const hasBusOnlyPosition = allDirectGroups.some((group) => group.hasBusDrawer);
      const inherited = atom && (hasBusOnlyPosition || !directGroups.length)
        ? this.findNearestAncestorGroups(atom, keywordIndex, atomIndex)
        : { groups: [], inheritedFrom: "" };
      const groups = [...directGroups, ...inherited.groups];
      if (!groups.length && !this.settings.showUntaggedGroup) continue;

      totalNotes += 1;
      if (modifiedToday) modifiedOnlyCount += 1;
      const item = {
        path: file.path,
        title: atom?.title || file.basename,
        code: atom?.code || "",
        ctime: file.stat.ctime,
        mtime: file.stat.mtime,
        modifiedOnly: modifiedToday,
        inheritedFrom: inherited.inheritedFrom,
        noteId: activity.noteId, source: activity.source, activityAt: activity.at,
      };

      if (groups.length) {
        const bundleGroups = normalizeBundleGroups(
          groups,
          atom,
          inherited.inheritedFrom ? `继承自上级关键词 ${inherited.inheritedFrom}` : "直接关键词"
        );
        if (bundleGroups.length) addToGroup(bundleGroups, item);
      } else {
        addToGroup([{
          label: "未归入关键词",
          sortCode: atom?.code || "~~~~",
          sourcePath: "",
          kind: "untagged",
          sourceLabel: atom ? "未找到自身或上级关键词" : "非 ATOM note",
        }], item);
      }
    }

    const groups = Array.from(groupsByKey.values())
      .map((group) => {
        group.notes.sort((left, right) => (left.activityAt || left.ctime) - (right.activityAt || right.ctime) || compareCodes(left.code, right.code) || left.path.localeCompare(right.path, "zh-CN"));
        return group;
      })
      .sort((left, right) => compareCodes(left.sortCode, right.sortCode) || left.label.localeCompare(right.label, "zh-CN"));

    return { dateKey, mode, totalNotes, modifiedOnlyCount, groups };
  }

  async buildKeywordWindowReview(endDateKey, days = 30) {
    const safeDays = Math.max(1, Number(days) || 30);
    const startDateKey = shiftDateKey(endDateKey, -(safeDays - 1));
    const keywordIndex = await this.loadKeywordIndex();
    const atomIndex = this.buildAtomIndex();
    const keywordMap = new Map();
    const notePaths = new Set();

    const normalizeGroups = (groups, atom, sourceLabel) => {
      const byKey = new Map();
      for (const group of groups) {
        const normalized = {
          ...group,
          label: text(group.label),
          sortCode: text(group.sortCode, atom?.code || ""),
          sourceLabel,
        };
        if (!normalized.label) continue;
        const key = `${normalized.keywordId || ""}|${normalized.label}|${normalized.sortCode}|${normalized.suffix || ""}|${normalized.sourceType || ""}`;
        if (!byKey.has(key)) byKey.set(key, normalized);
      }
      return Array.from(byKey.values())
        .sort((left, right) => compareCodes(left.sortCode, right.sortCode) || left.label.localeCompare(right.label, "zh-CN"));
    };

    const addKeyword = (group, file, dateKey) => {
      const nodeKey = buildKeywordNodeKeyForGroup(group, this.settings.keywordIndexPath);
      if (!nodeKey) return;
      const key = nodeKey;
      if (!keywordMap.has(key)) {
        keywordMap.set(key, {
          nodeKey,
          label: text(group.label, "未命名关键词"),
          sortCode: text(group.sortCode),
          sourceLabel: text(group.sourceLabel),
          sourceLabels: new Set(),
          sourceKindCounts: { direct: 0, inherited: 0 },
          notePaths: new Set(),
          dateKeys: new Set(),
        latestDateKey: dateKey,
          aggregateNodeKey: buildKeywordCapsuleNodeKeyForGroup(group, this.settings.keywordIndexPath),
        });
      }
      const item = keywordMap.get(key);
      item.notePaths.add(file.path);
      item.dateKeys.add(dateKey);
      if (dateKey > item.latestDateKey) item.latestDateKey = dateKey;
      const sourceLabel = text(group.sourceLabel);
      if (sourceLabel) item.sourceLabels.add(sourceLabel);
      const sourceKind = sourceLabel.startsWith("继承自") ? "inherited" : "direct";
      item.sourceKindCounts[sourceKind] = (item.sourceKindCounts[sourceKind] || 0) + 1;
    };

    for (const file of this.app.vault.getMarkdownFiles()) {
      const createdDateKey = dateKeyFromMs(file.stat.ctime);
      const modifiedDateKey = dateKeyFromMs(file.stat.mtime);
      const createdInWindow = createdDateKey >= startDateKey && createdDateKey <= endDateKey;
      const modifiedInWindow = this.settings.includeModifiedFallback && !createdInWindow && modifiedDateKey >= startDateKey && modifiedDateKey <= endDateKey;
      if (!createdInWindow && !modifiedInWindow) continue;

      const eventDateKey = createdInWindow ? createdDateKey : modifiedDateKey;
      const atom = parseAtomFile(file, this.settings.filePrefix);
      const allDirectGroups = this.getGroupsForFile(file, atom, keywordIndex);
      const directGroups = allDirectGroups.filter((group) => !group.hasBusDrawer);
      const hasBusOnlyPosition = allDirectGroups.some((group) => group.hasBusDrawer);
      const inherited = atom && (hasBusOnlyPosition || !directGroups.length)
        ? this.findNearestAncestorGroups(atom, keywordIndex, atomIndex)
        : { groups: [], inheritedFrom: "" };
      const groups = [...directGroups, ...inherited.groups];
      if (!groups.length) continue;

      notePaths.add(file.path);
      const sourceLabel = inherited.inheritedFrom ? `继承自上级关键词 ${inherited.inheritedFrom}` : "直接关键词";
      normalizeGroups(groups, atom, sourceLabel).forEach((group) => addKeyword(group, file, eventDateKey));
    }

    const keywords = Array.from(keywordMap.values())
      .map((item) => ({
        nodeKey: item.nodeKey,
        label: item.label,
        sortCode: item.sortCode,
        sourceLabel: item.sourceLabel,
        sourceLabels: Array.from(item.sourceLabels),
        sourceKinds: { ...item.sourceKindCounts },
        notePaths: Array.from(item.notePaths),
        dateKeys: Array.from(item.dateKeys),
        aggregateNodeKey: item.aggregateNodeKey,
        noteCount: item.notePaths.size,
        dayCount: item.dateKeys.size,
        latestDateKey: item.latestDateKey,
      }))
      .sort((left, right) => compareCodes(left.sortCode, right.sortCode) || left.label.localeCompare(right.label, "zh-CN", { numeric: true, sensitivity: "base" }));

    return { startDateKey, endDateKey, days: safeDays, totalNotes: notePaths.size, keywords };
  }

  async buildReviewMetaSnapshot(endDateKey, days = 30) {
    const review = await this.buildKeywordWindowReview(endDateKey, days);
    const nodeAcc = new Map();
    const addToNode = (nodeKey, item, mode) => {
      if (!nodeKey) return;
      if (!nodeAcc.has(nodeKey)) {
        nodeAcc.set(nodeKey, {
          nodeKey,
          label: item.label,
          sortCode: item.sortCode,
          notePaths: new Set(),
          dateKeys: new Set(),
          latestDateKey: item.latestDateKey,
          sourceLabels: new Set(),
          sourceKinds: {},
          modes: new Set(),
        });
      }
      const target = nodeAcc.get(nodeKey);
      for (const notePath of item.notePaths || []) target.notePaths.add(notePath);
      for (const dateKey of item.dateKeys || []) target.dateKeys.add(dateKey);
      if (item.latestDateKey > target.latestDateKey) target.latestDateKey = item.latestDateKey;
      for (const sourceLabel of item.sourceLabels || (item.sourceLabel ? [item.sourceLabel] : [])) {
        if (sourceLabel) target.sourceLabels.add(sourceLabel);
      }
      for (const [kind, count] of Object.entries(item.sourceKinds || {})) {
        target.sourceKinds[kind] = (target.sourceKinds[kind] || 0) + count;
      }
      target.modes.add(mode);
    };
    for (const item of review.keywords) {
      if (!item.nodeKey) continue;
      addToNode(item.nodeKey, item, "exact");
      const aggregateNodeKey = text(item.aggregateNodeKey);
      if (aggregateNodeKey && aggregateNodeKey !== item.nodeKey) addToNode(aggregateNodeKey, item, "aggregate");
    }
    const nodeMap = {};
    for (const [nodeKey, item] of nodeAcc.entries()) {
      nodeMap[nodeKey] = {
        nodeKey,
        label: item.label,
        sortCode: item.sortCode,
        noteCount: item.notePaths.size,
        dayCount: item.dateKeys.size,
        latestDateKey: item.latestDateKey,
        sourceLabels: Array.from(item.sourceLabels),
        sourceKinds: { ...item.sourceKinds },
        aggregate: item.modes.has("aggregate"),
        exact: item.modes.has("exact"),
      };
    }
    return {
      ...review,
      active: true,
      builtAt: Date.now(),
      nodeMap,
    };
  }

  async openNote(path, sourceLeaf) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      new Notice(`找不到 note：${path}`);
      return false;
    }
    if (sourceLeaf !== undefined) {
      const workspace = this.app.workspace;
      const parent = sourceLeaf?.parent;
      let registered = false;
      let siblingCount = 0;
      if (parent && typeof workspace.iterateAllLeaves === "function" && typeof workspace.createLeafInParent === "function") {
        workspace.iterateAllLeaves((leaf) => {
          if (leaf === sourceLeaf) registered = true;
          if (leaf.parent === parent) siblingCount += 1;
        });
      }
      if (!registered) {
        new Notice("无法在标签末尾打开 Note：来源视图已关闭或标签接口不可用。");
        return false;
      }
      const leaf = workspace.createLeafInParent(parent, siblingCount);
      await leaf.openFile(file, { active: true });
      return true;
    }
    await this.app.workspace.getLeaf("tab").openFile(file);
    return true;
  }

  async revealInEvaTree(path, sourceLeaf) {
    const api = window.__evaTreeViewPluginApi;
    if (api && typeof api.revealNotePath === "function") {
      const result = await api.revealNotePath(path);
      if (result?.ok !== false) return true;
    }
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      if (await this.openNote(file.path, sourceLeaf)) {
        new Notice("EVA Tree View API 不可用，已改为打开 note。");
      }
      return false;
    }
    return false;
  }

  getEva() {
    return this.app?.plugins?.plugins?.["eva-cross-view-relations"]?.api
      || window.evaCrossViewRelations
      || null;
  }

  getKeywordIndexApi() {
    return window.__keywordIndexPluginApi
      || this.app?.plugins?.plugins?.["keyword-index-plugin"]?.api
      || null;
  }

  async revealInKeywordIndex(nodeKey, label = "") {
    const eva = this.getEva();
    if (eva && typeof eva.openNode === "function") {
      const ok = await eva.openNode(nodeKey);
      console.info("[DailyNoteReview][keyword.open-node]", { nodeKey, label: text(label), via: "eva", ok });
      if (ok !== false) return true;
    }
    const api = this.getKeywordIndexApi();
    if (api && typeof api.openNode === "function") {
      const result = await api.openNode(nodeKey);
      console.info("[DailyNoteReview][keyword.open-node]", { nodeKey, label: text(label), via: "keyword-index-api", ok: result !== false });
      if (result !== false) return true;
    }
    if (api && typeof api.openView === "function") {
      await api.openView();
      new Notice(`关键词索引已打开，但未能定位：${label || nodeKey}`);
      return false;
    }
    const commandId = "keyword-index-plugin:open-keyword-index";
    if (this.app.commands?.commands?.[commandId]) {
      this.app.commands.executeCommandById(commandId);
      new Notice(`关键词索引插件 API 不可用，已打开索引：${label || nodeKey}`);
      return false;
    }
    new Notice("关键词索引插件 API 不可用，无法定位关键词。");
    return false;
  }
}

module.exports = DailyNoteReviewPlugin;
