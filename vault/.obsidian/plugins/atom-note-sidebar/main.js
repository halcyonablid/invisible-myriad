"use strict";
const { Plugin, ItemView, Notice, TFile } = require("obsidian");
const M = (() => { const module = {exports:{}};
"use strict";
const ROW_HEIGHT = 72;
const OVERSCAN = 8;
const COLORS = ["0,71,171", "80,200,120", "255,253,208", "245,245,220", "139,133,137", "165,42,42", "255,0,0", "255,255,0", "0,0,255", "75,0,130", "255,165,0", "0,128,0", "255,192,203", "255,215,0", "192,192,192", "184,115,51", "255,127,80", "51,161,201", "230,230,250", "183,110,121", "205,127,50", "34,139,34", "128,0,32", "10,186,181", "251,206,177", "196,30,58", "224,255,255", "255,219,88", "97,64,81", "128,128,0", "160,82,45", "75,0,130"];
function parseName(name) {
  const m = name.match(/ATOM@(.*?)- (.+)/);
  if (!m) return null;
  const at = m[1].lastIndexOf("@");
  return { addressType: at < 0 ? "" : m[1].slice(0, at), address: m[1].slice(at + 1), title: m[2] };
}
function entry(page, path) {
  if (!page?.file || page.file.path !== path || !page.file.name.startsWith("ATOM@") || page.antinet !== "atom") return null;
  const parsed = parseName(page.file.name);
  if (!parsed) return null;
  return { path, name: page.file.name, fullAddress: (parsed.addressType ? parsed.addressType + "@" : "") + parsed.address, indexed: page["索引关键词已录入"] === true };
}
function equal(a, b) { return a === b || (!!a && !!b && a.path === b.path && a.name === b.name && a.fullAddress === b.fullAddress && a.indexed === b.indexed); }
function format(address, n = 0) {
  const value = address.slice(0, n).replace(/\./g, "") + address.slice(n);
  const at = value.lastIndexOf("@") + 1;
  const legacy = part => part.replace(/[A-Z]/g, "L").replace(/\d+/g, "N");
  // Numeric suffix extensions stay at the same level; preserve type prefixes.
  return legacy(value.slice(0, at)) + value.slice(at).replace(/[A-Z\d]+/g,
    part => /^\d/.test(part) ? "N" : legacy(part));
}
function colorHash(address) { let h = 0; for (let i = 0; i < address.length; i++) h = ((h << 5) - h + address.charCodeAt(i)) | 0; return Math.abs(h) % COLORS.length; }
function compareAddresses(a, b) {
  const aa = a.split("."), bb = b.split(".");
  for (let i = 0; i < Math.min(aa.length, bb.length); i++) {
    if (aa[i] !== bb[i]) return /^\d+$/.test(aa[i]) && /^\d+$/.test(bb[i]) ? parseInt(aa[i]) - parseInt(bb[i]) : aa[i].localeCompare(bb[i]);
  }
  return aa.length - bb.length;
}
// Cooperative stable merge sort: no large synchronous native sort on the UI thread.
function* sorted(input, compare) {
  let a = [...input], b = new Array(a.length);
  for (let width = 1; width < a.length; width *= 2) {
    for (let lo = 0; lo < a.length; lo += 2 * width) {
      const mid = Math.min(lo + width, a.length), end = Math.min(lo + width * 2, a.length);
      let i = lo, j = mid;
      for (let k = lo; k < end; k++) {
        b[k] = j >= end || (i < mid && compare(a[i], a[j]) <= 0) ? a[i++] : a[j++];
        if ((k & 127) === 0) yield;
      }
    }
    [a, b] = [b, a];
  }
  return a;
}
function* projection(entries, compare) {
  const rows = yield* sorted(entries, (a, b) => compare(a.name, b.name) || a.path.localeCompare(b.path));
  const addressColors = new Map(), formats = new Map();
  let color = 0;
  const dotted = [];
  for (const row of rows) {
    if (row.fullAddress.includes(".")) dotted.push(row);
    else {
      const key = format(row.fullAddress);
      if (!formats.has(key)) { formats.set(key, color); color = (color + 1) % COLORS.length; }
      addressColors.set(row.fullAddress, formats.get(key));
    }
    yield;
  }
  const byAddress = yield* sorted(dotted, (a, b) => compareAddresses(a.fullAddress, b.fullAddress));
  const assigned = new Set();
  // Bounded cache: variable prefix lengths cannot create unbounded N*K memory.
  const bucketCache = new Map();
  for (let index = 0; index < byAddress.length; index++) {
    if (assigned.has(index)) continue;
    const first = byAddress[index], n = first.fullAddress.indexOf(".");
    let buckets = bucketCache.get(n);
    if (!buckets) {
      buckets = new Map();
      for (let j = 0; j < byAddress.length; j++) {
        const key = format(byAddress[j].fullAddress, n);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(j);
        yield;
      }
      if (bucketCache.size >= 2) bucketCache.delete(bucketCache.keys().next().value);
      bucketCache.set(n, buckets);
    }
    const selected = buckets.get(format(first.fullAddress, n)) || [];
    const hash = colorHash(first.fullAddress);
    for (const j of selected) {
      if (!assigned.has(j)) { assigned.add(j); addressColors.set(byAddress[j].fullAddress, hash); }
      yield;
    }
    // Each bucket is consumed once for this prefix length.
    buckets.delete(format(first.fullAddress, n));
  }
  const positions = new Map();
  for (let i = 0; i < rows.length; i++) {
    rows[i] = { ...rows[i], color: rows[i].indexed ? "rgba(0,47,167,0.5)" : `rgba(${COLORS[addressColors.get(rows[i].fullAddress) || 0]},0.12)` };
    positions.set(rows[i].path, i);
    yield;
  }
  return { rows, positions };
}
async function run(generator, alive = () => true, onSlice = () => {}) {
  let started = performance.now();
  while (alive()) {
    const next = generator.next();
    if (next.done) { onSlice(performance.now() - started); return next.value; }
    if (performance.now() - started >= 7) {
      onSlice(performance.now() - started);
      await new Promise(resolve => setTimeout(resolve, 0));
      started = performance.now();
    }
  }
  return null;
}
function windowRange(top, height, count) {
  return { start: Math.max(0, Math.floor(top / ROW_HEIGHT) - OVERSCAN), end: Math.min(count, Math.ceil((top + height) / ROW_HEIGHT) + OVERSCAN) };
}
module.exports = { ROW_HEIGHT, OVERSCAN, COLORS, parseName, entry, equal, format, colorHash, compareAddresses, projection, run, windowRange };

return module.exports; })();
const VIEW = "atom-note-sidebar-view";
const COMMAND = "open-and-reveal-current";
function el(parent, tag, cls, text) {
  const node = parent.ownerDocument.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
}
class AtomView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf); this.plugin = plugin; this.rows = []; this.positions = new Map(); this.highlight = null; this.sizes = new Map(); this.offsets = [0];
  }
  getViewType() { return VIEW; }
  getDisplayText() { return "ATOM 侧栏导航"; }
  getIcon() { return "list-tree"; }
  async onOpen() {
    this.contentEl.replaceChildren(); this.contentEl.classList.add("atom-sidebar");
    const toolbar = el(this.contentEl, "div", "atom-sidebar-toolbar");
    this.counter = el(toolbar, "span", "atom-sidebar-counter");
    const locate = el(toolbar, "button", "atom-sidebar-locate", "定位");
    locate.title = "定位当前笔记"; locate.setAttribute("aria-label", locate.title);
    const refresh = el(toolbar, "button", "atom-sidebar-refresh", "↻");
    refresh.title = "重新索引"; refresh.setAttribute("aria-label", refresh.title);
    this.registerDomEvent(locate, "click", () => this.plugin.invoke());
    this.registerDomEvent(refresh, "click", () => this.plugin.refresh());
    this.status = el(toolbar, "span", "atom-sidebar-status", "等待 Dataview 索引…");
    this.status.setAttribute("role", "status");
    this.status.setAttribute("aria-live", "polite");
    this.diagnostic = el(toolbar, "button", "atom-sidebar-diagnostic", "!");
    this.diagnostic.hidden = true;
    this.registerDomEvent(this.diagnostic, "click", () => new Notice(this.status.textContent, 8000));
    this.scroller = el(this.contentEl, "div", "atom-sidebar-scroll");
    this.scroller.setAttribute("role", "list"); this.scroller.setAttribute("aria-label", "ATOM 笔记");
    this.spacer = el(this.scroller, "div", "atom-sidebar-spacer");
    this.registerDomEvent(this.scroller, "scroll", () => this.paint());
    this.observer = new ResizeObserver(entries => {
      if (entries.some(entry => (entry.target === this.scroller ? (this.width !== this.scroller.clientWidth || this.viewportHeight !== this.scroller.clientHeight) :
          Math.abs(entry.target.getBoundingClientRect().height - (this.sizes.get(entry.target.dataset.path)?.height || 0)) > 0.5))) this.schedulePaint();
    });
    this.observer.observe(this.scroller);
    this.plugin.views.add(this); this.setProjection(this.plugin.snapshot);
    void this.plugin.ensureIndex();
  }
  async onClose() {
    this.observer?.disconnect(); this.contentEl.ownerDocument.defaultView.cancelAnimationFrame(this.frame); this.plugin.views.delete(this); this.closed = true;
  }
  setProjection(snapshot) {
    if (!this.scroller || this.closed) return;
    const anchor = this.anchor();
    this.rows = snapshot.rows; this.positions = snapshot.positions;
    for (const [path, size] of this.sizes) {
      const index = this.positions.get(path);
      if (index === undefined || this.rows[index].name !== size.name) this.sizes.delete(path);
    }
    this.reflow(); this.restoreAnchor(anchor);
    this.paint(); this.showStatus();
  }
  showStatus(message) {
    if (!this.status) return;
    const index = this.positions.get(this.highlight);
    const current = index === undefined ? "—" : (index + 1).toLocaleString();
    const total = this.rows.length.toLocaleString();
    this.counter.textContent = `${current} / ${total}`;
    this.counter.title = index === undefined ? `当前笔记不在索引中 / 共 ${total} 条` : `当前笔记第 ${current} 条 / 共 ${total} 条`;
    this.counter.setAttribute("aria-label", this.counter.title);
    const detail = message || this.plugin.status || "";
    this.status.textContent = detail || this.counter.title;
    this.diagnostic.hidden = !detail || detail.startsWith("已定位第");
    this.diagnostic.textContent = /正在|等待更新/.test(detail) ? "…" : "!";
    this.diagnostic.title = detail;
    this.diagnostic.setAttribute("aria-label", `查看状态：${detail}`);
  }
  indexAt(top) {
    let lo = 0, hi = this.rows.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (this.offsets[mid + 1] <= top) lo = mid + 1; else hi = mid; }
    return Math.min(lo, Math.max(0, this.rows.length - 1));
  }
  anchor() {
    const index = this.indexAt(this.scroller?.scrollTop || 0);
    return { path: this.rows[index]?.path, delta: (this.scroller?.scrollTop || 0) - (this.offsets[index] || 0) };
  }
  restoreAnchor(anchor) {
    const index = this.positions.get(anchor.path);
    if (index !== undefined) this.scroller.scrollTop = this.offsets[index] + Math.min(anchor.delta, this.offsets[index + 1] - this.offsets[index] - 1);
  }
  reflow() {
    this.offsets = new Float64Array(this.rows.length + 1);
    for (let i = 0; i < this.rows.length; i++) this.offsets[i + 1] = this.offsets[i] + (this.sizes.get(this.rows[i].path)?.height || M.ROW_HEIGHT);
    this.spacer.style.height = `${this.offsets[this.rows.length]}px`;
  }
  schedulePaint() {
    if (this.frame || this.closed) return;
    this.frame = this.contentEl.ownerDocument.defaultView.requestAnimationFrame(() => { this.frame = 0; this.paint(); });
  }
  paint() {
    if (!this.spacer || this.closed || !this.scroller.clientWidth || !this.scroller.clientHeight) return;
    this.viewportHeight = this.scroller.clientHeight;
    const anchor = this.anchor();
    const sample = this.spacer.querySelector('.atom-sidebar-link');
    const style = sample && this.contentEl.ownerDocument.defaultView.getComputedStyle(sample);
    const signature = style && [style.font, style.lineHeight, style.letterSpacing, style.wordBreak].join('|');
    if (this.width !== this.scroller.clientWidth || (signature && this.signature && signature !== this.signature)) {
      this.width = this.scroller.clientWidth; this.sizes.clear(); this.reflow(); this.restoreAnchor(anchor);
    }
    if (signature) this.signature = signature;
    // Each pass measures only viewport rows. Corrections preserve the reading anchor.
    for (let pass = 0; pass < 3; pass++) {
      const start = Math.max(0, this.indexAt(this.scroller.scrollTop) - M.OVERSCAN);
      const end = Math.min(this.rows.length, this.indexAt(this.scroller.scrollTop + this.scroller.clientHeight) + 1 + M.OVERSCAN);
      const fragment = this.contentEl.ownerDocument.createDocumentFragment();
      this.observer.disconnect(); this.observer.observe(this.scroller);
      for (let i = start; i < end; i++) {
        const row = this.rows[i], item = el(fragment, "div", "atom-sidebar-row");
        item.dataset.path = row.path; item.style.top = `${this.offsets[i]}px`; item.style.backgroundColor = row.color;
        item.setAttribute("role", "listitem"); item.setAttribute("aria-posinset", String(i + 1)); item.setAttribute("aria-setsize", String(this.rows.length));
        if (row.path === this.highlight) item.classList.add("is-current");
        el(item, "span", "atom-sidebar-number", String(i + 1));
        const link = el(item, "a", "atom-sidebar-link internal-link", row.name);
        link.href = row.path; link.title = `${row.name}\n${row.path}`;
        if (row.path === this.highlight) link.setAttribute("aria-current", "true");
        item.addEventListener("click", event => { event.preventDefault(); void this.plugin.openNote(row.path, event.ctrlKey || event.metaKey); });
        link.addEventListener("keydown", event => { if (event.key === " ") { event.preventDefault(); void this.plugin.openNote(row.path, false); } });
      }
      this.spacer.replaceChildren(fragment);
      let changed = false;
      for (const item of this.spacer.children) {
        const row = this.rows[this.positions.get(item.dataset.path)];
        const height = Math.max(1, item.getBoundingClientRect().height);
        if (Math.abs((this.sizes.get(row.path)?.height || M.ROW_HEIGHT) - height) > 0.5) changed = true;
        this.sizes.set(row.path, {name: row.name, height}); this.observer.observe(item);
      }
      if (!changed) return;
      this.reflow(); this.restoreAnchor(anchor);
      for (const item of this.spacer.children) item.style.top = `${this.offsets[this.positions.get(item.dataset.path)]}px`;
    }
    this.schedulePaint();
  }
  mark(path) { this.highlight = path; this.paint(); this.showStatus(); }
  reveal(path) {
    this.highlight = path;
    const index = this.positions.get(path);
    if (index === undefined) { this.paint(); this.showStatus(`当前笔记未在索引中：请检查 ATOM@ 名称格式和 antinet: atom。共 ${this.rows.length} 条`); return false; }
    // First bring the estimated row into the DOM, then center its measured height.
    this.scroller.scrollTop = this.offsets[index]; this.paint();
    const height = this.offsets[index + 1] - this.offsets[index];
    this.scroller.scrollTop = Math.max(0, this.offsets[index] - Math.max(0, (this.scroller.clientHeight - height) / 2));
    this.paint(); this.showStatus(`已定位第 ${(index + 1).toLocaleString()} 条 / 共 ${this.rows.length.toLocaleString()} 条`);
    return true;
  }
}
class AtomSidebarPlugin extends Plugin {
  async onload() {
    this.views = new Set(); this.entries = new Map(); this.pending = new Set(); this.snapshot = { rows: [], positions: new Map() };
    this.alive = true; this.epoch = 0; this.request = 0; this.ready = false; this.busy = false; this.status = "";
    this.registerView(VIEW, leaf => new AtomView(leaf, this));
    this.addCommand({ id: COMMAND, name: "打开右侧 ATOM 导航并定位当前笔记", callback: () => this.invoke() });
    this.addRibbonIcon("list-tree", "ATOM 侧栏导航", () => this.invoke());
    // Subscribe before the initial snapshot so mutations during scanning are replayed.
    this.registerEvent(this.app.metadataCache.on("dataview:metadata-change", (type, file, oldPath) => {
      if (oldPath) this.pending.add(oldPath);
      if (file?.path) this.pending.add(file.path);
      this.schedule();
    }));
    this.registerEvent(this.app.metadataCache.on("dataview:index-ready", () => { if (this.views.size) this.refresh(); }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", leaf => {
      if (this.isMain(leaf)) { this.mainLeaf = leaf; for (const view of this.views) view.mark(leaf.view.file?.path || null); }
    }));
    this.registerEvent(this.app.workspace.on("file-open", () => {
      const leaf = this.resolveMain(); if (leaf) for (const view of this.views) view.mark(leaf.view.file?.path || null);
    }));
    this.register(() => { this.alive = false; this.epoch++; this.request++; clearTimeout(this.timer); clearTimeout(this.revealTimer); });
  }
  onunload() {
    this.alive = false; this.epoch++; this.request++; clearTimeout(this.timer); clearTimeout(this.revealTimer); this.pendingReveal = null;
    this.app.workspace.detachLeavesOfType(VIEW);
  }
  api() { const api = this.app.plugins.plugins.dataview?.api; return api?.pagePaths && api?.page && api?.compare ? api : null; }
  isMain(leaf) {
    return !!leaf && leaf.getRoot() === this.app.workspace.rootSplit && leaf.view.getViewType() === "markdown" && leaf.view.file instanceof TFile && this.app.workspace.getLeavesOfType("markdown").includes(leaf);
  }
  resolveMain() {
    const ws = this.app.workspace;
    // Scope to rootSplit: sidebar notes must never become the source note.
    const recent = ws.getMostRecentLeaf(ws.rootSplit);
    const active = ws.activeLeaf;
    const leaf = this.isMain(active) ? active : recent ? (this.isMain(recent) ? recent : null) : this.isMain(this.mainLeaf) ? this.mainLeaf : null;
    if (leaf) this.mainLeaf = leaf;
    return leaf;
  }
  log(tx, status, reason, path, leaf) {
    console.info(`[AtomSidebar][reveal][tx:${tx}][summary]`, { txId: tx, status, reasonCodes: [reason], warnings: [], scopeType: "note", scopeKey: path || "", notePath: path || "", hostId: leaf?.id || "", mismatchFields: status === "PASS" ? [] : [reason] });
  }
  invoke() { void this.revealCurrent().catch(error => { console.error("[AtomSidebar][command.failed]", error); new Notice("ATOM 导航打开失败，请查看控制台。"); }); }
  async rightView() {
    if (this.opening) return this.opening;
    this.opening = (async () => {
      const ws = this.app.workspace;
      let leaf = ws.getLeavesOfType(VIEW).find(candidate => candidate.getRoot() === ws.rightSplit);
      if (!leaf) {
        leaf = ws.getRightLeaf(false);
        if (!leaf) throw new Error("Right sidebar unavailable");
        await leaf.setViewState({ type: VIEW, active: true });
      }
      await ws.revealLeaf(leaf);
      return leaf.view;
    })();
    try { return await this.opening; } finally { this.opening = null; }
  }
  async revealCurrent() {
    const host = this.resolveMain(), path = host?.view.file?.path, tx = ++this.request;
    clearTimeout(this.revealTimer); this.pendingReveal = null;
    const view = await this.rightView();
    if (!this.alive || tx !== this.request) return;
    if (!path) { view.mark(null); view.showStatus("主页面没有打开 Markdown 笔记。"); this.log(tx, "WARN", "no-main-note", null, host); return; }
    view.showStatus("正在准备完整索引，完成后定位…");
    await this.ensureIndex();
    // A newer command supersedes this one; a refresh must finish before reveal.
    while (this.alive && tx === this.request && this.building) await this.building;
    if (this.updating) await this.updating;
    if (this.pending.size && !this.busy && this.ready) await this.update();
    if (!this.alive || tx !== this.request || view.closed) return;
    if (!this.ready) { view.showStatus(); this.log(tx, "WARN", "index-unavailable", path, host); return; }
    const found = view.reveal(path);
    if (!found && !this.api()?.page(path) && this.app.vault.getAbstractFileByPath(path) instanceof TFile) {
      // Dataview may still be importing this note at startup. Keep one bounded request.
      this.pendingReveal = { tx, path, host, view };
      view.showStatus("当前笔记尚未进入 Dataview 索引，等待更新后定位…");
      this.revealTimer = setTimeout(() => {
        if (this.pendingReveal?.tx !== tx) return;
        this.pendingReveal = null; view.showStatus("等待索引超时；请稍后再次定位当前笔记。");
        this.log(tx, "WARN", "queue-verify-timeout", path, host);
      }, 15000);
      this.log(tx, "WARN", "queued-index", path, host);
    } else this.log(tx, found ? "PASS" : "WARN", found ? "located" : "not-in-index", path, host);
  }
  setStatus(status) { this.status = status; for (const v of this.views) v.showStatus(); }
  refresh() {
    this.ready = false; this.epoch++; clearTimeout(this.timer);
    if (this.building) { this.rebuildRequested = true; return; }
    void this.ensureIndex();
  }
  async ensureIndex() {
    if (this.building) return this.building;
    if (this.ready) { if (this.pending.size) return this.flushUpdates(); return; }
    const api = this.api();
    if (!api) { this.setStatus("需要启用 Dataview；启用完成后点击“重新索引”。"); return; }
    const epoch = ++this.epoch;
    this.building = this.scan(api, epoch).catch(error => {
      if (this.alive && epoch === this.epoch) { this.ready = false; this.setStatus("索引失败，保留现有列表；点击“重新索引”重试。"); console.error("[AtomSidebar][index.failed]", error); }
    }).finally(() => {
      this.building = null;
      if (this.alive && this.rebuildRequested) { this.rebuildRequested = false; void this.ensureIndex(); }
      else if (this.alive && this.pending.size) this.schedule();
    });
    return this.building;
  }
  readEntry(api, path) {
    const name = path.slice(path.lastIndexOf("/") + 1);
    if (!name.startsWith("ATOM@")) return null;
    // Avoid resolving a deleted path to a similarly named note elsewhere.
    if (!(this.app.vault.getAbstractFileByPath(path) instanceof TFile)) return null;
    return M.entry(api.page(path), path);
  }
  async scan(api, epoch) {
    const alive = () => this.alive && epoch === this.epoch;
    this.setStatus("正在分批建立完整索引…");
    const fresh = new Map(), paths = api.pagePaths('""');
    const self = this;
    function* hydrate() {
      for (const path of paths) { const row = self.readEntry(api, path); if (row) fresh.set(path, row); yield; }
    }
    await M.run(hydrate(), alive);
    if (!alive()) return;
    // Project from the local snapshot; replay late mutations before publishing.
    let snapshot;
    do {
      const changed = [...this.pending]; this.pending.clear();
      function* replay() { for (const path of changed) { const row = self.readEntry(api, path); if (row) fresh.set(path, row); else fresh.delete(path); yield; } }
      await M.run(replay(), alive);
      snapshot = await M.run(M.projection(fresh.values(), api.compare.bind(api)), alive);
      if (!alive()) return;
    } while (this.pending.size);
    this.entries = fresh; this.ready = true; this.publish(snapshot);
  }
  publish(snapshot) {
    this.snapshot = snapshot; this.status = ""; for (const view of this.views) view.setProjection(snapshot);
    const pending = this.pendingReveal;
    if (pending && pending.tx === this.request && !pending.view.closed && snapshot.positions.has(pending.path)) {
      this.pendingReveal = null; clearTimeout(this.revealTimer); pending.view.reveal(pending.path);
      this.log(pending.tx, "PASS", "applied-after-queue-verified", pending.path, pending.host);
    }
  }
  flushUpdates() {
    if (this.updating) return this.updating;
    this.updating = this.update().finally(() => { this.updating = null; });
    return this.updating;
  }
  schedule() {
    if (!this.alive || !this.views.size || this.building || this.busy) return;
    clearTimeout(this.timer); this.timer = setTimeout(() => {
      void this.flushUpdates();
    }, 250);
  }
  async update() {
    if (!this.alive || this.building || this.busy) return;
    if (!this.ready) { await this.ensureIndex(); return; }
    const api = this.api();
    if (!api) { this.ready = false; this.setStatus("Dataview 已停用；现有列表可能过时。"); return; }
    this.busy = true; const epoch = this.epoch, alive = () => this.alive && this.epoch === epoch;
    try {
      const paths = [...this.pending]; this.pending.clear(); let changed = false; const self = this;
      function* patch() {
        for (const path of paths) {
          const row = self.readEntry(api, path), prior = self.entries.get(path);
          if (!M.equal(prior || null, row)) { changed = true; if (row) self.entries.set(path, row); else self.entries.delete(path); }
          yield;
        }
      }
      await M.run(patch(), alive);
      if (changed && alive()) { const snapshot = await M.run(M.projection(this.entries.values(), api.compare.bind(api)), alive); if (alive()) this.publish(snapshot); }
    } catch (error) { this.ready = false; this.setStatus("更新失败；点击“重新索引”重试。"); console.error("[AtomSidebar][update.failed]", error); }
    finally { this.busy = false; if (this.pending.size) this.schedule(); }
  }
  async openNote(path, newTab) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) { new Notice("笔记已不存在，请刷新索引。"); return; }
    const ws = this.app.workspace;
    let leaf = this.resolveMain();
    if (!leaf || newTab || leaf.getViewState().pinned) leaf = ws.getLeaf("tab");
    if (leaf.getRoot() !== ws.rootSplit) { new Notice("未找到主页面目标，已取消打开。"); return; }
    try { await leaf.openFile(file, { active: true }); this.mainLeaf = leaf; for (const view of this.views) view.mark(path); }
    catch (error) { console.error("[AtomSidebar][open.failed]", error); new Notice("无法打开笔记。"); }
  }
}
module.exports = AtomSidebarPlugin;
