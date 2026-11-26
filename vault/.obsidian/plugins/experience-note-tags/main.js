var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.js
var main_exports = {};
__export(main_exports, {
  EditModal: () => EditModal,
  ExperienceView: () => ExperienceView,
  ReportModal: () => ReportModal,
  TagPicker: () => TagPicker,
  default: () => ExperiencePlugin
});
module.exports = __toCommonJS(main_exports);

// src/atom-address-colors.js
var COLORS = ["0,71,171", "80,200,120", "255,253,208", "245,245,220", "139,133,137", "165,42,42", "255,0,0", "255,255,0", "0,0,255", "75,0,130", "255,165,0", "0,128,0", "255,192,203", "255,215,0", "192,192,192", "184,115,51", "255,127,80", "51,161,201", "230,230,250", "183,110,121", "205,127,50", "34,139,34", "128,0,32", "10,186,181", "251,206,177", "196,30,58", "224,255,255", "255,219,88", "97,64,81", "128,128,0", "160,82,45", "75,0,130"];
function format(address, n = 0) {
  const value = address.slice(0, n).replace(/\./g, "") + address.slice(n);
  const at = value.lastIndexOf("@") + 1;
  const legacy = (part) => part.replace(/[A-Z]/g, "L").replace(/\d+/g, "N");
  return legacy(value.slice(0, at)) + value.slice(at).replace(
    /[A-Z\d]+/g,
    (part) => /^\d/.test(part) ? "N" : legacy(part)
  );
}
function colorHash(address) {
  let h = 0;
  for (let i = 0; i < address.length; i++) h = (h << 5) - h + address.charCodeAt(i) | 0;
  return Math.abs(h) % COLORS.length;
}
function compareAddresses(a, b) {
  const aa = a.split("."), bb = b.split(".");
  for (let i = 0; i < Math.min(aa.length, bb.length); i++) {
    if (aa[i] !== bb[i]) return /^\d+$/.test(aa[i]) && /^\d+$/.test(bb[i]) ? parseInt(aa[i]) - parseInt(bb[i]) : aa[i].localeCompare(bb[i]);
  }
  return aa.length - bb.length;
}
function* sorted(input2, compare) {
  let a = [...input2], b = new Array(a.length);
  for (let width = 1; width < a.length; width *= 2) {
    for (let lo = 0; lo < a.length; lo += 2 * width) {
      const mid = Math.min(lo + width, a.length), end = Math.min(lo + width * 2, a.length);
      let i = lo, j = mid;
      for (let k = lo; k < end; k++) {
        b[k] = j >= end || i < mid && compare(a[i], a[j]) <= 0 ? a[i++] : a[j++];
        if ((k & 127) === 0) yield;
      }
    }
    [a, b] = [b, a];
  }
  return a;
}
function* projection(entries, compare) {
  const rows = yield* sorted(entries, (a, b) => compare(a.name, b.name) || a.path.localeCompare(b.path));
  const addressColors2 = /* @__PURE__ */ new Map(), formats = /* @__PURE__ */ new Map();
  let color = 0;
  const dotted = [];
  for (const row of rows) {
    if (row.fullAddress.includes(".")) dotted.push(row);
    else {
      const key = format(row.fullAddress);
      if (!formats.has(key)) {
        formats.set(key, color);
        color = (color + 1) % COLORS.length;
      }
      addressColors2.set(row.fullAddress, formats.get(key));
    }
    yield;
  }
  const byAddress = yield* sorted(dotted, (a, b) => compareAddresses(a.fullAddress, b.fullAddress));
  const assigned = /* @__PURE__ */ new Set();
  const bucketCache = /* @__PURE__ */ new Map();
  for (let index = 0; index < byAddress.length; index++) {
    if (assigned.has(index)) continue;
    const first = byAddress[index], n = first.fullAddress.indexOf(".");
    let buckets = bucketCache.get(n);
    if (!buckets) {
      buckets = /* @__PURE__ */ new Map();
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
      if (!assigned.has(j)) {
        assigned.add(j);
        addressColors2.set(byAddress[j].fullAddress, hash);
      }
      yield;
    }
    buckets.delete(format(first.fullAddress, n));
  }
  const positions = /* @__PURE__ */ new Map();
  for (let i = 0; i < rows.length; i++) {
    rows[i] = { ...rows[i], color: rows[i].indexed ? "rgba(0,47,167,0.5)" : `rgba(${COLORS[addressColors2.get(rows[i].fullAddress) || 0]},0.12)` };
    positions.set(rows[i].path, i);
    yield;
  }
  return { rows, positions };
}
function addressColors(addresses) {
  const entries = [...new Set(addresses)].map((fullAddress) => ({ path: fullAddress, name: fullAddress, fullAddress, indexed: false }));
  const task = projection(entries, (a, b) => a.localeCompare(b));
  let step;
  do {
    step = task.next();
  } while (!step.done);
  return new Map(step.value.rows.map((r) => [r.fullAddress, r.color]));
}

// src/tag-address-presentation.js
function createTagAddressPresentation(A2) {
  const natural = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "variant" });
  function describe(label) {
    const clean = String(label).replace(/^#/, ""), dash = clean.indexOf("-"), prefix = clean.slice(0, dash);
    const addressed = dash > 0 && /^[A-Za-z0-9]+(?:[./@+][A-Za-z0-9]+)*$/.test(prefix);
    const normalized = prefix.replace(/\//g, ".");
    return {
      label: String(label),
      address: addressed ? prefix : "",
      key: addressed ? normalized : "",
      title: addressed ? clean.slice(dash + 1) : clean,
      parts: addressed ? normalized.split(".") : [],
      depth: addressed ? normalized.split(".").length - 1 : 0
    };
  }
  function compare(data, scope, a, b) {
    const x = describe(A2.label(data, scope, a)), y = describe(A2.label(data, scope, b));
    if (x.address && y.address) {
      for (let i = 0; i < Math.min(x.parts.length, y.parts.length); i++) {
        const order = natural.compare(x.parts[i], y.parts[i]);
        if (order) return order;
      }
      if (x.parts.length !== y.parts.length) return x.parts.length - y.parts.length;
    } else if (!!x.address !== !!y.address) return x.address ? -1 : 1;
    return natural.compare(x.label.replace(/^#/, ""), y.label.replace(/^#/, "")) || String(a).localeCompare(String(b), "zh-CN");
  }
  function paint(target, data, scope, tag, { indent = false } = {}) {
    const info = describe(A2.label(data, scope, tag));
    target.replaceChildren();
    target.classList.add("ent-address-label");
    target.classList.toggle("ent-address-indented", indent);
    target.dataset.aliasRaw = tag;
    target.dataset.addressDepth = String(info.depth);
    target.style.setProperty("--ent-tag-depth", String(Math.min(info.depth, 5)));
    const span = (cls, text2) => {
      const e = target.ownerDocument.createElement("span");
      e.className = cls;
      e.textContent = text2;
      target.appendChild(e);
    };
    if (info.address) {
      span("ent-tag-address", (info.label.startsWith("#") ? "#" : "") + info.address);
      span("ent-tag-separator", "-");
      span("ent-tag-caption", info.title);
    } else span("ent-tag-caption", info.label);
    target.title = info.label;
    return target;
  }
  const caches = /* @__PURE__ */ new WeakMap();
  function colors(plugin) {
    const tree = plugin.index.catalogTree(), aliases = plugin.owner.data.tagDisplayAliases;
    const previous = caches.get(plugin);
    if (previous?.tree === tree && previous.aliases === aliases) return previous.colors;
    const addresses = [...tree.nodes.values()].filter((n) => n.path).map((n) => describe(A2.label(plugin.owner.data, "experience", n.tag || "#" + n.path)).key).filter(Boolean);
    const result = addressColors(addresses);
    caches.set(plugin, { tree, aliases, colors: result });
    return result;
  }
  function inheritedAddress(data, tag) {
    let path = tag;
    while (path) {
      const address = describe(A2.label(data, "experience", path)).key;
      if (address) return address;
      const slash = path.lastIndexOf("/");
      path = slash < 0 ? "" : path.slice(0, slash);
    }
    return "";
  }
  function tint(target, plugin, tag) {
    const address = inheritedAddress(plugin.owner.data, tag);
    const color = address ? colors(plugin).get(address) : null;
    target.classList.toggle("ent-address-tinted", !!color);
    if (color) target.style.setProperty("--ent-address-color", color);
    else target.style.removeProperty("--ent-address-color");
    return target;
  }
  return { describe, compare, paint, tint, colors };
}

// src/tag-display-aliases.js
function createTagDisplayAliases({ Modal: Modal2, Notice: Notice2 }) {
  const owners = /* @__PURE__ */ new WeakMap();
  const canonical = (tag) => "#" + String(tag).replace(/^#/, "");
  const keyOf = (scope, tag) => JSON.stringify([scope, canonical(tag)]);
  const own = (obj, key) => obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : void 0;
  const get = (data, scope, tag) => {
    const v = own(data?.tagDisplayAliases, keyOf(scope, tag));
    return typeof v === "string" ? v : "";
  };
  const label = (data, scope, tag) => get(data, scope, tag) || canonical(tag);
  const matches2 = (data, scope, tag, q) => [canonical(tag), get(data, scope, tag)].some((t) => t.toLocaleLowerCase().includes(String(q).replace(/^#/, "").trim().toLocaleLowerCase()));
  const sortText = (value) => String(value).replace(/^#/, "");
  const compare = (data, scope, a, b) => sortText(label(data, scope, a)).localeCompare(sortText(label(data, scope, b)), "zh-CN", { numeric: true }) || canonical(a).localeCompare(canonical(b), "zh-CN");
  function node(parent, tag, cls, text2) {
    const n = parent.ownerDocument.createElement(tag);
    if (cls) n.className = cls;
    if (text2 !== void 0) n.textContent = text2;
    parent.appendChild(n);
    return n;
  }
  function paint(target, data, scope, tag, { raw = false } = {}) {
    const alias = get(data, scope, tag);
    target.replaceChildren();
    target.classList.add("tag-alias-label");
    target.dataset.aliasRaw = tag;
    node(target, "span", "tag-alias-text", alias || canonical(tag));
    if (alias) node(target, "small", "tag-alias-badge", "\u4E49\u540D");
    if (raw && alias) node(target, "small", "tag-alias-original", canonical(tag));
    target.title = alias ? "\u4E49\u540D\uFF1A" + alias + "\n\u539F\u6587\u6807\u7B7E\uFF1A" + canonical(tag) : canonical(tag);
    return target;
  }
  function state(cfg) {
    let s = owners.get(cfg.owner);
    if (!s) {
      s = { active: /* @__PURE__ */ new Map(), drafts: /* @__PURE__ */ new Map() };
      owners.set(cfg.owner, s);
      cfg.owner.register?.(() => {
        for (const m of s.active.values()) m.close();
      });
    }
    return s;
  }
  class AliasModal extends Modal2 {
    constructor(cfg, s, key) {
      super(cfg.owner.app);
      Object.assign(this, { cfg, s, key, closed: false, done: false, busy: false, queue: Promise.resolve() });
      this.expected = get(cfg.data(), cfg.scope, cfg.tag);
    }
    valid() {
      if (this.closed || !this.cfg.valid()) throw Error("\u6765\u6E90\u5DF2\u5207\u6362\u6216\u9875\u9762\u5DF2\u5173\u95ED\u3002\u4E49\u540D\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u3002");
    }
    onOpen() {
      const c = this.contentEl;
      this.modalEl.classList.add("tag-alias-modal");
      this.titleEl.textContent = "\u4FEE\u6539\u6807\u7B7E\u4E49\u540D";
      node(c, "p", "tag-alias-note", "\u4E49\u540D\u53EA\u6539\u53D8\u672C\u754C\u9762\u7684\u663E\u793A\uFF1B\u6807\u7B7E\u7B5B\u9009\u3001\u8BA1\u6570\u548C\u63D2\u5165\u4ECD\u4F7F\u7528\u539F\u6587\u6807\u7B7E\u3002");
      node(c, "div", "tag-alias-caption", "\u539F\u6587\u6807\u7B7E");
      node(c, "div", "tag-alias-raw", canonical(this.cfg.tag));
      const field = node(c, "label", "tag-alias-field");
      node(field, "span", "", "\u754C\u9762\u4E49\u540D \xB7 \u4EC5\u754C\u9762");
      this.input = node(field, "input");
      this.input.type = "text";
      this.input.maxLength = 100;
      this.input.placeholder = "\u4F8B\u5982\uFF1A042-\u60CA\u5929\u5927\u53D1\u73B0";
      const saved = this.s.drafts.get(this.key) || own(this.cfg.data().tagDisplayAliasDrafts, this.key);
      this.input.value = typeof saved?.text === "string" ? saved.text : this.expected;
      this.status = node(c, "p", "tag-alias-note", saved ? "\u5DF2\u6062\u590D\u672A\u4FDD\u5B58\u7684\u4E49\u540D\u8349\u7A3F\u3002" : "\u53D6\u6D88\u4E49\u540D\u8BF7\u70B9\u51FB\u201C\u6062\u590D\u539F\u540D\u663E\u793A\u201D\u3002");
      this.status.setAttribute("role", "status");
      this.input.oninput = () => {
        this.remember();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush().catch((e) => this.error(e)), 250);
      };
      this.input.oncompositionstart = () => {
        this.composing = true;
      };
      this.input.oncompositionend = () => {
        this.composing = false;
        this.input.oninput();
      };
      const foot = node(c, "div", "tag-alias-actions");
      this.reset = this.button(foot, "\u6062\u590D\u539F\u540D\u663E\u793A", () => this.apply("", true));
      this.button(foot, "\u53D6\u6D88", () => this.close());
      this.save = this.button(foot, "\u4FDD\u5B58\u4E49\u540D", () => this.apply(this.input.value), "mod-cta");
      const source = node(c, "section", "tag-alias-source");
      node(source, "strong", "", "\u4FEE\u6539\u539F\u6587\u6807\u7B7E \xB7 \u5199\u5165\u539F\u6587");
      node(source, "p", "tag-alias-note", this.cfg.sourceScope + "\u3002\u5C06\u5148\u9884\u89C8\u4FEE\u6539\u8303\u56F4\uFF0C\u518D\u786E\u8BA4\u5199\u5165\u3002");
      this.sourceButton = this.button(source, "\u4FEE\u6539\u539F\u6587\u6807\u7B7E\u2026", async () => {
        if (this.busy || this.composing) return;
        this.valid();
        this.busy = true;
        this.lock();
        try {
          await this.flush();
          this.valid();
          this.close();
          await this.queue.catch(() => {
          });
          if (this.cfg.valid()) await this.cfg.sourceEdit();
        } finally {
          this.busy = false;
          this.lock();
        }
      });
      this.input.onkeydown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.isComposing && !this.composing) {
          e.preventDefault();
          this.apply(this.input.value).catch((error2) => this.error(error2));
        }
      };
      this.input.focus();
    }
    button(parent, text2, fn, cls = "") {
      const b = node(parent, "button", cls, text2);
      b.type = "button";
      b.onclick = () => Promise.resolve().then(fn).catch((e) => this.error(e));
      return b;
    }
    error(e) {
      if (this.status) this.status.textContent = e.message;
      new Notice2(e.message);
    }
    lock() {
      if (!this.input) return;
      this.input.disabled = this.reset.disabled = this.save.disabled = this.sourceButton.disabled = this.busy;
    }
    remember() {
      const draft = { text: this.input?.value ?? this.expected };
      this.s.drafts.set(this.key, draft);
      return draft;
    }
    flush() {
      clearTimeout(this.timer);
      if (this.done) return this.queue;
      const draft = this.remember();
      const task = this.queue.catch(() => {
      }).then(() => this.cfg.mutate("tag-alias-draft", (d) => {
        d.tagDisplayAliasDrafts = { ...d.tagDisplayAliasDrafts || {}, [this.key]: draft };
        return d;
      }));
      this.queue = task;
      return task;
    }
    apply(value, clear = false) {
      if (this.applying) return this.applying;
      this.applying = this.applyNow(value, clear).finally(() => {
        this.applying = null;
      });
      return this.applying;
    }
    async applyNow(value, clear) {
      if (this.busy || this.composing) return;
      this.valid();
      const next = value.trim();
      if (!next && !clear) throw Error("\u8BF7\u586B\u5199\u4E49\u540D\uFF1B\u53D6\u6D88\u4E49\u540D\u8BF7\u70B9\u51FB\u201C\u6062\u590D\u539F\u540D\u663E\u793A\u201D\u3002");
      if (next.length > 100) throw Error("\u4E49\u540D\u8BF7\u63A7\u5236\u5728 100 \u5B57\u4EE5\u5185\u3002");
      this.busy = true;
      this.lock();
      clearTimeout(this.timer);
      this.remember();
      try {
        await this.queue.catch(() => {
        });
        this.valid();
        await this.cfg.mutate("tag-alias-save", (d) => {
          this.valid();
          if (get(d, this.cfg.scope, this.cfg.tag) !== this.expected) throw Error("\u4E49\u540D\u5DF2\u88AB\u53E6\u4E00\u5904\u4FEE\u6539\u3002\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5173\u95ED\u540E\u91CD\u65B0\u6838\u5BF9\u3002");
          d.tagDisplayAliases = { ...d.tagDisplayAliases || {} };
          if (next) d.tagDisplayAliases[this.key] = next;
          else delete d.tagDisplayAliases[this.key];
          d.tagDisplayAliasDrafts = { ...d.tagDisplayAliasDrafts || {} };
          delete d.tagDisplayAliasDrafts[this.key];
          return d;
        });
        this.done = true;
        this.s.drafts.delete(this.key);
        this.cfg.changed();
        this.close();
        new Notice2(next ? "\u4E49\u540D\u5DF2\u4FDD\u5B58 \xB7 \u4EC5\u754C\u9762" : "\u5DF2\u6062\u590D\u539F\u540D\u663E\u793A");
      } catch (e) {
        if (!this.closed) await this.flush().catch(() => {
        });
        throw e;
      } finally {
        this.busy = false;
        this.lock();
      }
    }
    onClose() {
      if (this.closed) return;
      this.closed = true;
      clearTimeout(this.timer);
      const pending = Promise.resolve(this.applying).catch(() => {
      }).then(() => this.done ? this.queue : this.flush());
      pending.catch((e) => new Notice2("\u4E49\u540D\u8349\u7A3F\u6682\u672A\u5199\u5165\u78C1\u76D8\uFF0C\u672C\u6B21\u4F1A\u8BDD\u4ECD\u4FDD\u7559\uFF1A" + e.message)).finally(() => {
        if (this.s.active.get(this.key) === this) this.s.active.delete(this.key);
      });
    }
  }
  function open(cfg) {
    if (!cfg.valid()) throw Error("\u6765\u6E90\u5DF2\u5207\u6362\u6216\u9875\u9762\u5DF2\u5173\u95ED\u3002");
    const s = state(cfg), key = keyOf(cfg.scope, cfg.tag), current = s.active.get(key);
    if (current) {
      if (current.closed) new Notice2("\u6B63\u5728\u4FDD\u5B58\u4E49\u540D\u8349\u7A3F\uFF0C\u8BF7\u7A0D\u540E\u518D\u6253\u5F00\u3002");
      else current.input?.focus();
      return current;
    }
    const modal = new AliasModal(cfg, s, key);
    s.active.set(key, modal);
    modal.open();
    return modal;
  }
  return { canonical, keyOf, get, label, matches: matches2, sortText, compare, paint, open };
}

// src/body-view.js
var bodyId = 0;
function attachBody(view, row, article, generation) {
  const index = view.plugin.index, win = article.ownerDocument.defaultView;
  const revision = () => index.revision(row.file, view.app.metadataCache.getFileCache(row.file));
  const stamp = revision(), previous = view.fullFragments.get(row.key);
  const cached = previous?.file === row.file && previous.revision === stamp ? previous : null;
  if (!cached) view.fullFragments.delete(row.key);
  let full = cached?.text, expanded = !!cached?.expanded, pending = false, token = 0, disposed = false, frame = 0;
  let preview = "\u8BFB\u53D6\u6458\u8981\u2026", previewReady = false, failed = false;
  const text2 = article.ownerDocument.createElement("div");
  text2.className = "ent-body";
  text2.id = `ent-fragment-${++bodyId}`;
  article.appendChild(text2);
  const toggle = article.ownerDocument.createElement("button");
  toggle.className = "ent-expand";
  toggle.type = "button";
  toggle.setAttribute("aria-controls", text2.id);
  article.appendChild(toggle);
  const context = () => !disposed && view.opened && generation === view.generation && article.isConnected;
  const current = () => context() && index.alive && view.app.workspace.activeLeaf === view.leaf && index.rows.get(row.key) === row && view.app.vault.getAbstractFileByPath(row.path) === row.file && revision() === stamp;
  const needsFull = row.end - row.start > 1400 || row.file.stat.size > 1024 * 1024;
  function measure() {
    if (!context()) return;
    toggle.hidden = !expanded && !pending && !failed && !needsFull && text2.scrollHeight <= text2.clientHeight + 1;
  }
  function scheduleMeasure() {
    if (frame) win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  }
  function remember() {
    if (full !== void 0) view.fullFragments.set(row.key, { file: row.file, revision: stamp, text: full, expanded });
  }
  function paint() {
    if (!context()) return;
    text2.textContent = (expanded ? full : preview) || "\u6807\u7B7E\u89C1\u4E0B\u65B9";
    text2.classList.toggle("is-expanded", expanded);
    toggle.textContent = pending ? "\u53D6\u6D88\u5C55\u5F00" : expanded ? "\u6536\u8D77" : failed ? "\u91CD\u8BD5\u5C55\u5F00" : "\u5C55\u5F00\u5168\u6587";
    toggle.setAttribute("aria-expanded", String(expanded));
    text2.setAttribute("aria-busy", String(pending));
    toggle.title = failed ? "\u5168\u6587\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5" : "";
    const first = text2.textContent.split(/\r?\n/).find((s) => s.trim() && !s.trim().startsWith("#"));
    if (first && (expanded || previewReady)) article.querySelector(".ent-title").textContent = first.slice(0, 100);
    measure();
    scheduleMeasure();
  }
  toggle.onclick = async () => {
    if (!context()) return;
    if (pending) {
      token++;
      pending = false;
      paint();
      return;
    }
    if (expanded) {
      expanded = false;
      remember();
      paint();
      return;
    }
    if (!current()) {
      failed = true;
      paint();
      return;
    }
    if (full !== void 0) {
      expanded = true;
      remember();
      paint();
      return;
    }
    const request = ++token;
    pending = true;
    failed = false;
    paint();
    await index.acquire();
    try {
      if (request !== token || !current()) return;
      const value = await index.copyText(row);
      if (request !== token || !current()) return;
      full = value;
      expanded = true;
      remember();
    } catch {
      if (request === token && context()) failed = true;
    } finally {
      index.release();
      if (request === token && context()) {
        pending = false;
        paint();
      }
    }
  };
  const observer = win.ResizeObserver ? new win.ResizeObserver(measure) : null;
  observer?.observe(text2);
  if (!observer) win.addEventListener("resize", measure);
  const controller = { key: row.key, article, dispose() {
    disposed = true;
    token++;
    observer?.disconnect();
    if (frame) win.cancelAnimationFrame(frame);
    if (!observer) win.removeEventListener("resize", measure);
  } };
  view.bodyControllers.add(controller);
  if (view.app.workspace.activeLeaf !== view.leaf) preview = "\u5207\u6362\u5230\u7ECF\u9A8C\u56DE\u770B\u540E\u663E\u793A\u7247\u6BB5";
  else if (row.file.stat.size > 1024 * 1024) preview = "\u6765\u6E90\u7B14\u8BB0\u8F83\u5927\uFF0C\u70B9\u51FB\u201C\u5C55\u5F00\u5168\u6587\u201D\u67E5\u770B\u5B8C\u6574\u7247\u6BB5\u3002";
  else index.excerpt(row, current).then((value) => {
    if (current()) {
      preview = value.trim() ? value : "\u6807\u7B7E\u89C1\u4E0B\u65B9";
      previewReady = true;
      paint();
    }
  }).catch(() => {
    if (context()) {
      preview = "\u6458\u8981\u8BFB\u53D6\u5931\u8D25\uFF0C\u53EF\u70B9\u51FB\u201C\u5C55\u5F00\u5168\u6587\u201D\u91CD\u8BD5\u3002";
      failed = true;
      paint();
    }
  });
  paint();
  return controller;
}

// src/main.js
var import_obsidian = require("obsidian");

// src/core.js
var MAX_WRITE_BYTES = 2 * 1024 * 1024;
function day(value) {
  if (typeof value !== "string") return "";
  const m = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(value.trim());
  if (!m) return "";
  const [y, mo, d] = m.slice(1).map(Number);
  const date = /* @__PURE__ */ new Date(0);
  date.setFullYear(y, mo - 1, d);
  date.setHours(12, 0, 0, 0);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? `${m[1]}-${m[2]}-${m[3]}` : "";
}
function localDay(ms = Date.now()) {
  const d = new Date(ms);
  return Number.isFinite(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";
}
function noteDate(file, cache, field) {
  const date = day(cache?.frontmatter?.[field]);
  return date ? { date, source: "\u7B14\u8BB0\u5EFA\u7ACB\u65E5\u671F" } : { date: localDay(file.stat.ctime), source: "\u6587\u4EF6\u521B\u5EFA\u65E5\u671F" };
}
function normalizeTag(input2) {
  const t = String(input2).trim().replace(/^#/, "");
  if (!/^[\p{L}\p{M}\p{N}_/-]+(?:[,，、][\p{L}\p{M}\p{N}_/-]+)*$/u.test(t) || t.split("/").some((s) => !s) || !/[\p{L}\p{M}_-]/u.test(t)) throw Error("\u6807\u7B7E\u987B\u5305\u542B\u6587\u5B57\u3001\u4E0B\u5212\u7EBF\u6216\u77ED\u6A2A\u7EBF\uFF1B\u4E0D\u80FD\u6709\u7A7A\u683C\u3001\u7A7A\u5C42\u7EA7\u6216\u53EA\u6709\u6570\u5B57\uFF1B\u9017\u53F7\u987B\u5728\u540D\u79F0\u5185\u90E8");
  if (/[,，、]/.test(t) && !/[\p{L}\p{M}_-]/u.test(t.split(/[,，、]/)[0])) throw Error("\u9017\u53F7\u524D\u7684\u6807\u7B7E\u540D\u79F0\u987B\u5305\u542B\u6587\u5B57\u3001\u4E0B\u5212\u7EBF\u6216\u77ED\u6A2A\u7EBF");
  return "#" + t;
}
function tagList(text2) {
  return [...new Set(String(text2).split(/\s+/).filter(Boolean).map(normalizeTag))];
}
function bodyStart(s) {
  const bom = s.charCodeAt(0) === 65279 ? 1 : 0;
  if (!/^---\r?\n/.test(s.slice(bom))) return bom;
  const end = /^(?:---|\.\.\.)[ \t]*\r?$/gm;
  end.lastIndex = bom + s.slice(bom).indexOf("\n") + 1;
  const m = end.exec(s);
  if (!m) throw Error("\u5C5E\u6027\u533A\u5C1A\u672A\u95ED\u5408\uFF0C\u8BF7\u5148\u5B8C\u6210\u6B63\u6587");
  return m.index + m[0].length + (s[m.index + m[0].length] === "\n" ? 1 : 0);
}
function scan(s) {
  if (s.length * 2 > MAX_WRITE_BYTES) throw Error("\u8FD9\u7BC7\u7B14\u8BB0\u8FC7\u5927\uFF0C\u8BF7\u5728\u7F16\u8F91\u5668\u4E2D\u624B\u52A8\u4FEE\u6539\u6807\u7B7E\uFF08\u5176\u4ED6\u7B14\u8BB0\u4ECD\u53EF\u5904\u7406\uFF09");
  const start = bodyStart(s), mask = new Uint8Array(s.length + 1), spans = [];
  const cover = (a, b) => mask.fill(1, a, b);
  cover(0, start);
  let fence2 = null, pos = start;
  for (const line of s.slice(start).split(/(?<=\n)/)) {
    const clean = line.replace(/\r?\n$/, "");
    const f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(clean);
    if (fence2) {
      cover(pos, pos + line.length);
      if (f && f[1][0] === fence2[0] && f[1].length >= fence2.length && !f[2].trim()) fence2 = null;
    } else if (f) {
      fence2 = f[1];
      cover(pos, pos + line.length);
    } else if (/^(?: {4}|\t| {0,3}>)/.test(clean)) cover(pos, pos + line.length);
    pos += line.length;
  }
  if (fence2) throw Error("\u4EE3\u7801\u56F4\u680F\u5C1A\u672A\u95ED\u5408\uFF0C\u6682\u4E0D\u4FEE\u6539\u6B64\u7B14\u8BB0");
  const close = (a, token, from) => {
    const e = s.indexOf(token, from);
    if (e < 0) throw Error("\u5B58\u5728\u672A\u95ED\u5408\u7684\u4EE3\u7801\u3001\u6CE8\u91CA\u6216\u94FE\u63A5\uFF0C\u6682\u4E0D\u4FEE\u6539");
    cover(a, e + token.length);
    return e + token.length;
  };
  for (let i = start; i < s.length; ) {
    if (mask[i]) {
      i++;
      continue;
    }
    const url = /^(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|www\.)[^\s<>]+/i.exec(s.slice(i));
    if (url) {
      cover(i, i + url[0].length);
      i += url[0].length;
      continue;
    }
    if (s[i] === "\\") {
      cover(i, Math.min(i + 2, s.length));
      i += 2;
      continue;
    }
    if (s.startsWith("<!--", i)) {
      i = close(i, "-->", i + 4);
      continue;
    }
    if (s.startsWith("%%", i)) {
      i = close(i, "%%", i + 2);
      continue;
    }
    if (s.startsWith("[[", i)) {
      i = close(i, "]]", i + 2);
      continue;
    }
    if (s[i] === "`") {
      let n = 1;
      while (s[i + n] === "`") n++;
      const token = "`".repeat(n);
      let end = i + n;
      for (; ; ) {
        end = s.indexOf(token, end);
        if (end < 0) throw Error("\u884C\u5185\u4EE3\u7801\u672A\u95ED\u5408");
        if (s[end - 1] !== "`" && s[end + n] !== "`") break;
        end += n;
      }
      cover(i, end + n);
      i = end + n;
      continue;
    }
    if (s[i] === "$") {
      const token = s[i + 1] === "$" ? "$$" : "$";
      i = close(i, token, i + token.length);
      continue;
    }
    if (s[i] === "<") {
      if (/^<(?:https?:\/\/|mailto:)[^>]*>/.test(s.slice(i))) {
        i = close(i, ">", i + 1);
        continue;
      }
      if (/^<\/?[a-zA-Z!]/.test(s.slice(i))) throw Error("\u5305\u542B HTML\uFF0C\u8BF7\u5728\u539F\u6587\u4E2D\u4FEE\u6539\u6807\u7B7E\uFF1B\u672A\u8FDB\u884C\u90E8\u5206\u66FF\u6362");
    }
    if (s[i] === "[") {
      let depth = 1, j = i + 1;
      for (; j < s.length && depth; j++) {
        if (s[j] === "\\") {
          j++;
          continue;
        }
        if (s[j] === "[") depth++;
        if (s[j] === "]") depth--;
      }
      if (depth) throw Error("\u65B9\u62EC\u53F7\u672A\u95ED\u5408\uFF0C\u6682\u4E0D\u4FEE\u6539");
      if (s[j] === "(") {
        let level = 1;
        j++;
        for (; j < s.length && level; j++) {
          if (s[j] === "\\") {
            j++;
            continue;
          }
          if (s[j] === "(") level++;
          if (s[j] === ")") level--;
        }
        if (level) throw Error("\u94FE\u63A5\u672A\u95ED\u5408");
      } else if (s[j] === ":") {
        const end = s.indexOf("\n", j);
        j = end < 0 ? s.length : end;
      }
      cover(i, j);
      i = j;
      continue;
    }
    if (s[i] === "#" && (i === start || /[\s([{,，。；：！？、]/u.test(s[i - 1]))) {
      const m = /^#[\p{L}\p{M}\p{N}_/-]+(?:[,，、][\p{L}\p{M}\p{N}_/-]+)*/u.exec(s.slice(i));
      if (m) {
        try {
          const tag = normalizeTag(m[0]);
          spans.push({ tag, start: i, end: i + m[0].length });
        } catch {
        }
        i += m[0].length;
        continue;
      }
    }
    i++;
  }
  return { start, mask, spans };
}
function patchTags(s, op, expected = []) {
  const parsed = scan(s), found = new Set(parsed.spans.map((x) => x.tag));
  const add = [...new Set((op.add || []).map(normalizeTag))];
  const remove = new Set((op.remove || []).map(normalizeTag));
  if (op.rename) {
    remove.add(normalizeTag(op.rename[0]));
    add.push(normalizeTag(op.rename[1]));
  }
  for (const tag of remove) if (expected.includes(tag) && !found.has(tag)) throw Error(`\u65E0\u6CD5\u5B89\u5168\u5B9A\u4F4D ${tag}\uFF08\u53EF\u80FD\u4F4D\u4E8E\u94FE\u63A5\u7B49\u4FDD\u62A4\u533A\u57DF\uFF09\uFF0C\u672A\u4FEE\u6539`);
  for (const m of s.slice(parsed.start).matchAll(/#[\p{L}\p{M}\p{N}_/-]+(?:[,，、][\p{L}\p{M}\p{N}_/-]+)*/gu)) {
    const at = parsed.start + m.index;
    if (remove.has(m[0]) && parsed.mask[at]) throw Error(`${m[0]} \u4E5F\u51FA\u73B0\u5728\u4FDD\u62A4\u8BED\u6CD5\u4E2D\uFF0C\u8BF7\u5728\u539F\u6587\u6838\u5BF9\u4FEE\u6539\uFF1B\u672C\u7BC7\u672A\u6539`);
  }
  const edits = parsed.spans.filter((x) => remove.has(x.tag));
  let out = s;
  for (const span of edits.reverse()) out = out.slice(0, span.start) + out.slice(span.end);
  const insert = [...new Set(add)].filter((t) => !found.has(t) || remove.has(t));
  if (insert.length) {
    const nl = s.includes("\r\n") ? "\r\n" : "\n";
    out += (out.endsWith("\n") ? "" : nl) + insert.join(" ") + nl;
  }
  return out;
}
function matches(row, filter) {
  if (filter.search && !row.path.toLocaleLowerCase().includes(filter.search.toLocaleLowerCase())) return false;
  if (filter.from && (!row.date || row.date < filter.from)) return false;
  if (filter.to && (!row.date || row.date > filter.to)) return false;
  const tags = filter.tags || [];
  return !tags.length || (filter.mode === "all" ? tags.every((t) => row.tags.includes(t)) : tags.some((t) => row.tags.includes(t)));
}

// src/fragment-date.js
function validUpdatedAt(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value;
}
function updatedLine(at) {
  if (!validUpdatedAt(at)) throw Error("\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4\u683C\u5F0F\u65E0\u6548\uFF0C\u672A\u4FEE\u6539\u539F\u6587");
  return `<!-- experience:tags-updated at=${at} -->`;
}
function fragmentDate(fragment, file, cache, field) {
  if (validUpdatedAt(fragment.updatedAt)) return {
    date: localDay(Date.parse(fragment.updatedAt)),
    source: "\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4",
    sortTime: Date.parse(fragment.updatedAt),
    dateHint: "\u6807\u7B7E\u6700\u8FD1\u66F4\u65B0\uFF1A" + new Date(fragment.updatedAt).toLocaleString()
  };
  const fallback = noteDate(file, cache, field);
  return {
    ...fallback,
    source: fallback.source + " \xB7 \u6682\u65E0\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4",
    sortTime: 0,
    dateHint: "\u65E7\u7247\u6BB5\u5C1A\u65E0\u66F4\u65B0\u65F6\u95F4\uFF0C\u6682\u6309" + fallback.source + "\u7B5B\u9009\u548C\u6392\u5E8F\uFF1B\u4E0B\u6B21\u901A\u8FC7\u63D2\u4EF6\u5B9E\u9645\u4FEE\u6539\u6807\u7B7E\u65F6\u8BB0\u5F55\u3002"
  };
}

// ../../experience-picker-20261113/node_modules/mdurl/index.mjs
var mdurl_exports = {};
__export(mdurl_exports, {
  decode: () => decode_default,
  encode: () => encode_default,
  format: () => format2,
  parse: () => parse_default
});

// ../../experience-picker-20261113/node_modules/mdurl/lib/decode.mjs
var decodeCache = {};
function getDecodeCache(exclude) {
  let cache = decodeCache[exclude];
  if (cache) {
    return cache;
  }
  cache = decodeCache[exclude] = [];
  for (let i = 0; i < 128; i++) {
    const ch = String.fromCharCode(i);
    cache.push(ch);
  }
  for (let i = 0; i < exclude.length; i++) {
    const ch = exclude.charCodeAt(i);
    cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
  }
  return cache;
}
function decode(string, exclude) {
  if (typeof exclude !== "string") {
    exclude = decode.defaultChars;
  }
  const cache = getDecodeCache(exclude);
  return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
    let result = "";
    for (let i = 0, l = seq.length; i < l; i += 3) {
      const b1 = parseInt(seq.slice(i + 1, i + 3), 16);
      if (b1 < 128) {
        result += cache[b1];
        continue;
      }
      if ((b1 & 224) === 192 && i + 3 < l) {
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        if ((b2 & 192) === 128) {
          const chr = b1 << 6 & 1984 | b2 & 63;
          if (chr < 128) {
            result += "\uFFFD\uFFFD";
          } else {
            result += String.fromCharCode(chr);
          }
          i += 3;
          continue;
        }
      }
      if ((b1 & 240) === 224 && i + 6 < l) {
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        if ((b2 & 192) === 128 && (b3 & 192) === 128) {
          const chr = b1 << 12 & 61440 | b2 << 6 & 4032 | b3 & 63;
          if (chr < 2048 || chr >= 55296 && chr <= 57343) {
            result += "\uFFFD\uFFFD\uFFFD";
          } else {
            result += String.fromCharCode(chr);
          }
          i += 6;
          continue;
        }
      }
      if ((b1 & 248) === 240 && i + 9 < l) {
        const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        const b4 = parseInt(seq.slice(i + 10, i + 12), 16);
        if ((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128) {
          let chr = b1 << 18 & 1835008 | b2 << 12 & 258048 | b3 << 6 & 4032 | b4 & 63;
          if (chr < 65536 || chr > 1114111) {
            result += "\uFFFD\uFFFD\uFFFD\uFFFD";
          } else {
            chr -= 65536;
            result += String.fromCharCode(55296 + (chr >> 10), 56320 + (chr & 1023));
          }
          i += 9;
          continue;
        }
      }
      result += "\uFFFD";
    }
    return result;
  });
}
decode.defaultChars = ";/?:@&=+$,#";
decode.componentChars = "";
var decode_default = decode;

// ../../experience-picker-20261113/node_modules/mdurl/lib/encode.mjs
var encodeCache = {};
function getEncodeCache(exclude) {
  let cache = encodeCache[exclude];
  if (cache) {
    return cache;
  }
  cache = encodeCache[exclude] = [];
  for (let i = 0; i < 128; i++) {
    const ch = String.fromCharCode(i);
    if (/^[0-9a-z]$/i.test(ch)) {
      cache.push(ch);
    } else {
      cache.push("%" + ("0" + i.toString(16).toUpperCase()).slice(-2));
    }
  }
  for (let i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }
  return cache;
}
function encode(string, exclude, keepEscaped) {
  if (typeof exclude !== "string") {
    keepEscaped = exclude;
    exclude = encode.defaultChars;
  }
  if (typeof keepEscaped === "undefined") {
    keepEscaped = true;
  }
  const cache = getEncodeCache(exclude);
  let result = "";
  for (let i = 0, l = string.length; i < l; i++) {
    const code2 = string.charCodeAt(i);
    if (keepEscaped && code2 === 37 && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }
    if (code2 < 128) {
      result += cache[code2];
      continue;
    }
    if (code2 >= 55296 && code2 <= 57343) {
      if (code2 >= 55296 && code2 <= 56319 && i + 1 < l) {
        const nextCode = string.charCodeAt(i + 1);
        if (nextCode >= 56320 && nextCode <= 57343) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }
      result += "%EF%BF%BD";
      continue;
    }
    result += encodeURIComponent(string[i]);
  }
  return result;
}
encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";
var encode_default = encode;

// ../../experience-picker-20261113/node_modules/mdurl/lib/format.mjs
function format2(url) {
  let result = "";
  result += url.protocol || "";
  result += url.slashes ? "//" : "";
  result += url.auth ? url.auth + "@" : "";
  if (url.hostname && url.hostname.indexOf(":") !== -1) {
    result += "[" + url.hostname + "]";
  } else {
    result += url.hostname || "";
  }
  result += url.port ? ":" + url.port : "";
  result += url.pathname || "";
  result += url.search || "";
  result += url.hash || "";
  return result;
}

// ../../experience-picker-20261113/node_modules/mdurl/lib/parse.mjs
function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.pathname = null;
}
var protocolPattern = /^([a-z0-9.+-]+:)/i;
var portPattern = /:[0-9]*$/;
var simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
var delims = ["<", ">", '"', "`", " ", "\r", "\n", "	"];
var unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims);
var autoEscape = ["'"].concat(unwise);
var nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape);
var hostEndingChars = ["/", "?", "#"];
var hostnameMaxLen = 255;
var hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
var hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
var hostlessProtocol = {
  javascript: true,
  "javascript:": true
};
var slashedProtocol = {
  http: true,
  https: true,
  ftp: true,
  gopher: true,
  file: true,
  "http:": true,
  "https:": true,
  "ftp:": true,
  "gopher:": true,
  "file:": true
};
function urlParse(url, slashesDenoteHost) {
  if (url && url instanceof Url) return url;
  const u = new Url();
  u.parse(url, slashesDenoteHost);
  return u;
}
Url.prototype.parse = function(url, slashesDenoteHost) {
  let lowerProto, hec, slashes;
  let rest = url;
  rest = rest.trim();
  if (!slashesDenoteHost && url.split("#").length === 1) {
    const simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
      }
      return this;
    }
  }
  let proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = proto;
    rest = rest.substr(proto.length);
  }
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    slashes = rest.substr(0, 2) === "//";
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }
  if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
    let hostEnd = -1;
    for (let i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    let auth, atSign;
    if (hostEnd === -1) {
      atSign = rest.lastIndexOf("@");
    } else {
      atSign = rest.lastIndexOf("@", hostEnd);
    }
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = auth;
    }
    hostEnd = -1;
    for (let i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    if (hostEnd === -1) {
      hostEnd = rest.length;
    }
    if (rest[hostEnd - 1] === ":") {
      hostEnd--;
    }
    const host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);
    this.parseHost(host);
    this.hostname = this.hostname || "";
    const ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!ipv6Hostname) {
      const hostparts = this.hostname.split(/\./);
      for (let i = 0, l = hostparts.length; i < l; i++) {
        const part = hostparts[i];
        if (!part) {
          continue;
        }
        if (!part.match(hostnamePartPattern)) {
          let newpart = "";
          for (let j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              newpart += "x";
            } else {
              newpart += part[j];
            }
          }
          if (!newpart.match(hostnamePartPattern)) {
            const validParts = hostparts.slice(0, i);
            const notHost = hostparts.slice(i + 1);
            const bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = notHost.join(".") + rest;
            }
            this.hostname = validParts.join(".");
            break;
          }
        }
      }
    }
    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = "";
    }
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
    }
  }
  const hash = rest.indexOf("#");
  if (hash !== -1) {
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  const qm = rest.indexOf("?");
  if (qm !== -1) {
    this.search = rest.substr(qm);
    rest = rest.slice(0, qm);
  }
  if (rest) {
    this.pathname = rest;
  }
  if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
    this.pathname = "";
  }
  return this;
};
Url.prototype.parseHost = function(host) {
  let port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ":") {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) {
    this.hostname = host;
  }
};
var parse_default = urlParse;

// ../../experience-picker-20261113/node_modules/uc.micro/build/index.mjs
var build_exports = {};
__export(build_exports, {
  Any: () => Any,
  Cc: () => Cc,
  Cf: () => Cf,
  P: () => P,
  S: () => S,
  Z: () => Z
});
var Any = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var Cc = /[\0-\x1F\x7F-\x9F]/;
var Cf = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
var P = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/;
var S = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/;
var Z = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

// ../../experience-picker-20261113/node_modules/entities/dist/decode-codepoint.js
var c1 = [
  8364,
  0,
  8218,
  402,
  8222,
  8230,
  8224,
  8225,
  710,
  8240,
  352,
  8249,
  338,
  0,
  381,
  0,
  0,
  8216,
  8217,
  8220,
  8221,
  8226,
  8211,
  8212,
  732,
  8482,
  353,
  8250,
  339,
  0,
  382,
  376
];
function isInvalidCodePoint(codePoint) {
  return codePoint === 0 || codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111;
}
function replaceCodePoint(codePoint) {
  if (isInvalidCodePoint(codePoint)) {
    return 65533;
  }
  if (codePoint >= 128 && codePoint <= 159) {
    return c1[codePoint - 128] || codePoint;
  }
  return codePoint;
}
function codePointToString(codePoint) {
  return codePoint - 1 >>> 0 < 127 || codePoint - 160 >>> 0 < 55136 ? String.fromCharCode(codePoint) : String.fromCodePoint(replaceCodePoint(codePoint));
}

// ../../experience-picker-20261113/node_modules/entities/dist/internal/decode-shared.js
var BASE91_INVERSE = /* @__PURE__ */ (() => {
  const table2 = new Uint8Array(127);
  let code2 = 0;
  for (let char = 33; char <= 126; char++) {
    if (char !== 34 && char !== 36 && char !== 92) {
      table2[char] = code2++;
    }
  }
  return table2;
})();
function decodeTrieDict(input2, resultLength, atomCount, dict1AtomCount, ngramCount, dictSize) {
  const base2 = 91;
  const inputLength = input2.length;
  const twoCharBias = dictSize * (base2 - 1);
  let pos = 0;
  const readSlotCode = () => {
    const c12 = BASE91_INVERSE[input2.charCodeAt(pos++)];
    return c12 < dictSize ? c12 : c12 * base2 - twoCharBias + BASE91_INVERSE[input2.charCodeAt(pos++)];
  };
  const dict2AtomCount = atomCount - dict1AtomCount;
  const slotCount = atomCount + ngramCount;
  const single = new Int32Array(slotCount);
  single.fill(-1, dict1AtomCount, dictSize);
  single.fill(-1, dictSize + dict2AtomCount, slotCount);
  const start = new Int32Array(slotCount);
  const length = new Int32Array(slotCount);
  function decodeDelta(count, off) {
    let previous = 0;
    let slot = off;
    const end = off + count;
    while (slot < end) {
      const code2 = BASE91_INVERSE[input2.charCodeAt(pos++)];
      if (code2 < 89) {
        previous += code2;
        single[slot++] = previous;
      } else if (code2 === 89) {
        let runLength = BASE91_INVERSE[input2.charCodeAt(pos++)] + 2;
        while (runLength--)
          single[slot++] = ++previous;
      } else {
        const next = BASE91_INVERSE[input2.charCodeAt(pos++)];
        previous += 89 + // eslint-disable-next-line unicorn/prefer-minimal-ternary -- branches read a different number of side-effecting input bytes
        (next < 90 ? next * base2 + BASE91_INVERSE[input2.charCodeAt(pos++)] : BASE91_INVERSE[input2.charCodeAt(pos++)] * 8281 + BASE91_INVERSE[input2.charCodeAt(pos++)] * base2 + BASE91_INVERSE[input2.charCodeAt(pos++)]);
        single[slot++] = previous;
      }
    }
  }
  decodeDelta(dict1AtomCount, 0);
  decodeDelta(dict2AtomCount, dictSize);
  const references = new Int32Array(ngramCount * 2);
  let poolSize = 0;
  let ngramIndex = 0;
  function readNgramReferences(count, startSlot) {
    for (let index = 0; index < count; index++) {
      const slot = startSlot + index;
      const a = readSlotCode();
      const b = readSlotCode();
      references[ngramIndex * 2] = a;
      references[ngramIndex * 2 + 1] = b;
      ngramIndex += 1;
      start[slot] = poolSize;
      const entryLength = (single[a] < 0 ? length[a] : 1) + (single[b] < 0 ? length[b] : 1);
      length[slot] = entryLength;
      poolSize += entryLength;
    }
  }
  readNgramReferences(ngramCount - dictSize + dict1AtomCount, dictSize + dict2AtomCount);
  readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);
  const pool = new Uint16Array(poolSize);
  let write = 0;
  for (let index = 0; index < ngramIndex; index++) {
    for (let half = 0; half < 2; half++) {
      const source = references[index * 2 + half];
      const value = single[source];
      if (value < 0) {
        let read = start[source];
        const readEnd = read + length[source];
        while (read < readEnd)
          pool[write++] = pool[read++];
      } else {
        pool[write++] = value;
      }
    }
  }
  const out = new Uint16Array(resultLength);
  let outIndex = 0;
  while (pos < inputLength) {
    let slot = BASE91_INVERSE[input2.charCodeAt(pos++)];
    if (slot >= dictSize) {
      slot = slot * base2 - twoCharBias + BASE91_INVERSE[input2.charCodeAt(pos++)];
    }
    const value = single[slot];
    if (value < 0) {
      let read = start[slot];
      const readEnd = read + length[slot];
      while (read < readEnd)
        out[outIndex++] = pool[read++];
    } else {
      out[outIndex++] = value;
    }
  }
  return out;
}

// ../../experience-picker-20261113/node_modules/entities/dist/generated/decode-data-html.js
var htmlDecodeTree = /* @__PURE__ */ decodeTrieDict("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);

// ../../experience-picker-20261113/node_modules/entities/dist/internal/bin-trie-flags.js
var BinTrieFlags;
(function(BinTrieFlags2) {
  BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags2[BinTrieFlags2["FLAG13"] = 8192] = "FLAG13";
  BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
  BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
  BinTrieFlags2[BinTrieFlags2["VALUE_MASK"] = 8191] = "VALUE_MASK";
})(BinTrieFlags || (BinTrieFlags = {}));

// ../../experience-picker-20261113/node_modules/entities/dist/decode.js
var CharCodes;
(function(CharCodes2) {
  CharCodes2[CharCodes2["AMP"] = 38] = "AMP";
  CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
  CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
  CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
  CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
  CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
  CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
  CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
var CONSUMED_SHIFT = 21;
var CODE_POINT_MASK = 2097151;
var CONSUMED_OVERFLOW = 2047;
var longNumericConsumed = 0;
function unpackConsumed(packed) {
  const consumed = packed >>> CONSUMED_SHIFT;
  return consumed === CONSUMED_OVERFLOW ? longNumericConsumed : consumed;
}
function isNumber(code2) {
  return code2 - CharCodes.ZERO >>> 0 <= 9;
}
function isHexadecimalCharacter(code2) {
  return (code2 | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 5;
}
function isAlpha(code2) {
  return (code2 | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 25;
}
function isEntityInAttributeInvalidEnd(code2) {
  return code2 === CharCodes.EQUALS || isAlpha(code2) || isNumber(code2);
}
var EntityDecoderState;
(function(EntityDecoderState2) {
  EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode2) {
  DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
  DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
  DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
function determineBranch(decodeTree, current, nodeIndex, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (jumpOffset) {
    if (branchCount === 0) {
      return char === jumpOffset ? nodeIndex : -1;
    }
    const slot = char - jumpOffset;
    if (slot >>> 0 >= branchCount)
      return -1;
    const stored = decodeTree[nodeIndex + slot];
    return stored === 0 ? -1 : nodeIndex + branchCount + stored - 1 & 65535;
  }
  if (branchCount === 0)
    return -1;
  const packedKeySlots = branchCount + 1 >> 1;
  const branchEnd = nodeIndex + packedKeySlots + branchCount;
  for (let index = 0; index < branchCount; index++) {
    const packed = decodeTree[nodeIndex + (index >> 1)];
    const key = packed >> ((index & 1) << 3) & 255;
    if (key === char) {
      const pointerIndex = nodeIndex + packedKeySlots + index;
      return branchEnd + decodeTree[pointerIndex] & 65535;
    }
    if (key > char)
      return -1;
  }
  return -1;
}
function readTrieValue(decodeTree, nodeIndex, valueLength) {
  if (valueLength === 1) {
    return String.fromCharCode(decodeTree[nodeIndex] & BinTrieFlags.VALUE_MASK);
  }
  if (valueLength === 2) {
    return String.fromCharCode(decodeTree[nodeIndex + 1]);
  }
  return String.fromCharCode(decodeTree[nodeIndex + 1], decodeTree[nodeIndex + 2]);
}
function parseNumericEntity(input2, numberStart, inputLength) {
  let offset = numberStart + 1;
  let cp = 0;
  let digitStart = offset;
  if (offset < inputLength && (input2.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
    offset += 1;
    digitStart = offset;
    while (offset < inputLength) {
      const char = input2.charCodeAt(offset);
      if (isNumber(char)) {
        cp = cp * 16 + (char - CharCodes.ZERO);
      } else if (isHexadecimalCharacter(char)) {
        cp = cp * 16 + ((char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10);
      } else {
        break;
      }
      offset += 1;
    }
  } else {
    while (offset < inputLength) {
      const digit = input2.charCodeAt(offset) - CharCodes.ZERO;
      if (digit >>> 0 > 9)
        break;
      cp = cp * 10 + digit;
      offset += 1;
    }
  }
  if (offset === digitStart)
    return 0;
  if (offset < inputLength && input2.charCodeAt(offset) === CharCodes.SEMI) {
    offset += 1;
  }
  if (cp > 1114111)
    cp = 1114112;
  let consumed = offset - numberStart;
  if (consumed >= CONSUMED_OVERFLOW) {
    longNumericConsumed = consumed;
    consumed = CONSUMED_OVERFLOW;
  }
  return consumed << CONSUMED_SHIFT | cp;
}
function decodeWithTrie(input2, isStrict, isAttribute) {
  const decodeTree = htmlDecodeTree;
  let offset = input2.indexOf("&");
  if (offset < 0)
    return input2;
  const inputLength = input2.length;
  let chunkStart = 0;
  let result = "";
  const root = decodeTree[0];
  const rootJumpOffset = root & BinTrieFlags.JUMP_TABLE;
  const rootBranchCount = (root & BinTrieFlags.BRANCH_LENGTH) >> 7;
  do {
    const entityStart = offset + 1;
    const firstChar = input2.charCodeAt(entityStart);
    let consumed;
    let value;
    if (firstChar === CharCodes.NUM) {
      const packed = parseNumericEntity(input2, entityStart, inputLength);
      consumed = unpackConsumed(packed);
      if (isStrict && consumed > 0 && input2.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI) {
        consumed = 0;
      }
      value = consumed === 0 ? "" : codePointToString(packed & CODE_POINT_MASK);
    } else if (isAlpha(firstChar)) {
      consumed = 0;
      value = "";
      const rootSlotIndex = firstChar - rootJumpOffset;
      let nodeIndex;
      if (rootSlotIndex >>> 0 < rootBranchCount) {
        const stored = decodeTree[1 + rootSlotIndex];
        nodeIndex = stored === 0 ? -1 : rootBranchCount + stored & 65535;
      } else {
        nodeIndex = -1;
      }
      let bestNodeIndex = 0;
      let bestValueLength = 0;
      let current = nodeIndex < 0 ? 0 : decodeTree[nodeIndex];
      let index = entityStart + 1;
      trie: while (index < inputLength) {
        while (
          // Value-less, non-run node with a nonzero jump offset.
          (current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === 0 && (current & BinTrieFlags.JUMP_TABLE) !== 0
        ) {
          const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
          const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
          if (branchCount === 0) {
            if (input2.charCodeAt(index) !== jumpOffset)
              break trie;
            nodeIndex += 1;
          } else {
            const slot = input2.charCodeAt(index) - jumpOffset;
            if (slot >>> 0 >= branchCount)
              break trie;
            const stored = decodeTree[nodeIndex + 1 + slot];
            if (stored === 0)
              break trie;
            nodeIndex = nodeIndex + branchCount + stored & 65535;
          }
          current = decodeTree[nodeIndex];
          index += 1;
          if (index >= inputLength)
            break trie;
        }
        if ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === BinTrieFlags.FLAG13) {
          const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
          if (input2.charCodeAt(index) !== (current & BinTrieFlags.JUMP_TABLE)) {
            break;
          }
          index += 1;
          const remaining = runLength - 1;
          let wordIndex = nodeIndex + 1;
          let charIndexInPacked = 0;
          for (; charIndexInPacked + 1 < remaining; charIndexInPacked += 2) {
            const packed = decodeTree[wordIndex];
            if (input2.charCodeAt(index) !== (packed & 255))
              break trie;
            index += 1;
            if (input2.charCodeAt(index) !== (packed >> 8 & 255))
              break trie;
            index += 1;
            wordIndex += 1;
          }
          if (charIndexInPacked < remaining) {
            if (input2.charCodeAt(index) !== (decodeTree[wordIndex] & 255))
              break;
            index += 1;
          }
          nodeIndex += 1 + (runLength >> 1);
          current = decodeTree[nodeIndex];
          continue;
        }
        const valueLength = current >>> 14;
        const char = input2.charCodeAt(index);
        if (valueLength !== 0) {
          if (char === CharCodes.SEMI) {
            consumed = index - entityStart + 1;
            value = valueLength === 1 ? String.fromCharCode(current & BinTrieFlags.VALUE_MASK) : readTrieValue(decodeTree, nodeIndex, valueLength);
            break;
          }
          if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
            consumed = index - entityStart;
            bestNodeIndex = nodeIndex;
            bestValueLength = valueLength;
          }
          if (valueLength === 1)
            break;
        }
        const next = determineBranch(decodeTree, current, nodeIndex + (valueLength || 1), char);
        if (next < 0)
          break;
        nodeIndex = next;
        current = decodeTree[nodeIndex];
        index += 1;
      }
      if (value === "") {
        const finalVL = current >>> 14;
        if (finalVL !== 0 && !isStrict && (current & BinTrieFlags.FLAG13) === 0) {
          consumed = index - entityStart;
          bestNodeIndex = nodeIndex;
          bestValueLength = finalVL;
        }
        if (consumed > 0) {
          value = readTrieValue(decodeTree, bestNodeIndex, bestValueLength);
        }
      }
    } else {
      consumed = 0;
      value = "";
    }
    if (consumed === 0 || isAttribute && firstChar !== CharCodes.NUM && input2.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI && entityStart + consumed < inputLength && isEntityInAttributeInvalidEnd(input2.charCodeAt(entityStart + consumed))) {
      offset = entityStart;
    } else {
      if (chunkStart < offset) {
        result += input2.slice(chunkStart, offset);
      }
      result += value;
      offset = chunkStart = entityStart + consumed;
    }
    if (input2.charCodeAt(offset) !== CharCodes.AMP) {
      offset = input2.indexOf("&", offset);
    }
  } while (offset >= 0);
  return result + input2.slice(chunkStart);
}
function decodeHTMLStrict(htmlString) {
  return decodeWithTrie(htmlString, true, false);
}

// ../../experience-picker-20261113/node_modules/entities/dist/index.js
var EntityLevel;
(function(EntityLevel2) {
  EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
  EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode2) {
  EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
  EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
  EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
  EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
  EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));

// ../../experience-picker-20261113/node_modules/linkify-it/build/index.mjs
var REBuilder = class {
  constructor(opts = {}) {
    __publicField(this, "src_Any", Any.source);
    __publicField(this, "src_Cc", Cc.source);
    __publicField(this, "src_Z", Z.source);
    __publicField(this, "src_P", P.source);
    __publicField(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|"));
    __publicField(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|"));
    __publicField(this, "cache", {});
    __publicField(this, "opts", {
      maxLength: 1e4,
      urlAuth: false,
      schema_names: []
    });
    this.opts = {
      ...this.opts,
      ...opts
    };
  }
  set(opts = {}) {
    this.opts = {
      ...this.opts,
      ...opts
    };
    this.cache = {};
    return this;
  }
  escapeRE(str) {
    return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
  }
  nestedPairRE(open, close, depth = 4) {
    const openRE = this.escapeRE(open);
    const closeRE = this.escapeRE(close);
    const atom = `(?:(?!${this.src_ZCc}|${openRE}|${closeRE}).)`;
    let pair = `${openRE}${atom}{0,1000}${closeRE}`;
    for (let level = 2; level <= depth; level++) pair = `${openRE}(?:${atom}|${pair}){0,1000}${closeRE}`;
    return pair;
  }
  get_text_separators() {
    var _a;
    return (_a = this.cache).text_separators ?? (_a.text_separators = /[><\uff5c]/);
  }
  get_pseudo_letter() {
    var _a;
    return (_a = this.cache).src_pseudo_letter ?? (_a.src_pseudo_letter = new RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`));
  }
  get_ipv4_addr() {
    var _a;
    return (_a = this.cache).src_ip4 ?? (_a.src_ip4 = /* @__PURE__ */ new RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])"));
  }
  get_ipv6_addr() {
    var _a;
    const h16 = "[0-9A-Fa-f]{1,4}";
    const ls32 = `(?:(?:${h16}:${h16})|${this.get_ipv4_addr().source})`;
    return (_a = this.cache).src_ip6_addr ?? (_a.src_ip6_addr = new RegExp(`(?:(?:${h16}:){6}${ls32}|::(?:${h16}:){5}${ls32}|(?:${h16})?::(?:${h16}:){4}${ls32}|(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}|(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}|(?:(?:${h16}:){0,3}${h16})?::${h16}:${ls32}|(?:(?:${h16}:){0,4}${h16})?::${ls32}|(?:(?:${h16}:){0,5}${h16})?::${h16}|(?:(?:${h16}:){0,6}${h16})?::)`));
  }
  get_ipv6_url_host() {
    var _a;
    return (_a = this.cache).src_ip6_host ?? (_a.src_ip6_host = new RegExp(`\\[${this.get_ipv6_addr().source}\\]`));
  }
  get_ipv6_mail_host() {
    var _a;
    return (_a = this.cache).src_ipv6_mail_host ?? (_a.src_ipv6_mail_host = new RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`));
  }
  get_auth() {
    var _a;
    return (_a = this.cache).src_auth ?? (_a.src_auth = new RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`));
  }
  get_port() {
    var _a;
    return (_a = this.cache).src_port ?? (_a.src_port = /* @__PURE__ */ new RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?"));
  }
  get_host_terminator() {
    var _a;
    return (_a = this.cache).src_host_terminator ?? (_a.src_host_terminator = new RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`));
  }
  get_path_terminator() {
    var _a;
    return (_a = this.cache).src_path_terminator ?? (_a.src_path_terminator = new RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`));
  }
  get_path() {
    var _a;
    return (_a = this.cache).src_path ?? (_a.src_path = new RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`));
  }
  get_mail_name() {
    var _a;
    return (_a = this.cache).src_mail_name ?? (_a.src_mail_name = /* @__PURE__ */ new RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}"));
  }
  get_xn() {
    var _a;
    return (_a = this.cache).src_xn ?? (_a.src_xn = /* @__PURE__ */ new RegExp("xn--[a-z0-9\\-]{1,59}"));
  }
  get_tld() {
    if (this.cache.tld) return this.cache.tld;
    const tlds_src = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
    this.cache.tld = new RegExp(`${tlds_src || "$#none#$"}|${this.get_xn().source}`);
    return this.cache.tld;
  }
  get_domain_root() {
    var _a;
    return (_a = this.cache).src_domain_root ?? (_a.src_domain_root = new RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`));
  }
  get_domain() {
    var _a;
    return (_a = this.cache).src_domain ?? (_a.src_domain = new RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`));
  }
  get_url_host_port() {
    var _a;
    return (_a = this.cache).url_host_port ?? (_a.url_host_port = new RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source));
  }
  get_fuzzy_url_host_port() {
    var _a;
    return (_a = this.cache).fuzzy_url_host_port ?? (_a.fuzzy_url_host_port = new RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source));
  }
  get_mail_host() {
    var _a;
    return (_a = this.cache).src_mail_host ?? (_a.src_mail_host = new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source));
  }
  get_fuzzy_mail_host() {
    var _a;
    return (_a = this.cache).src_fuzzy_mail_host ?? (_a.src_fuzzy_mail_host = new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source));
  }
  get_path_extra() {
    var _a;
    return (_a = this.cache).src_path_extra ?? (_a.src_path_extra = /* @__PURE__ */ new RegExp(""));
  }
  get_fuzzy_mail_host_search() {
    var _a;
    return (_a = this.cache).mail_fuzzy_host_search ?? (_a.mail_fuzzy_host_search = new RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig"));
  }
  get_fuzzy_link_search() {
    var _a;
    return (_a = this.cache).link_fuzzy_search ?? (_a.link_fuzzy_search = new RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${this.src_ZPCc}))(?:(?![$+<=>^\`|\uFF5C])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig"));
  }
  get_http_validator() {
    var _a;
    return (_a = this.cache).http_validator ?? (_a.http_validator = new RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy"));
  }
  get_relative_proto_validator() {
    var _a;
    return (_a = this.cache).relative_proto_validator ?? (_a.relative_proto_validator = new RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy"));
  }
  get_mail_name_validator() {
    var _a;
    return (_a = this.cache).mail_name_validator ?? (_a.mail_name_validator = new RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`));
  }
  get_mailto_validator() {
    var _a;
    return (_a = this.cache).mailto_validator ?? (_a.mailto_validator = new RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy"));
  }
  get_schema_names() {
    var _a;
    return (_a = this.cache).schema_names ?? (_a.schema_names = new RegExp((this.opts.schema_names || []).map((name) => this.escapeRE(name)).join("|")));
  }
  get_schema_search() {
    var _a;
    return (_a = this.cache).schema_search ?? (_a.schema_search = new RegExp(`(^|(?!_)(?:[><\uFF5C]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig"));
  }
  get_schema_at_start() {
    var _a;
    return (_a = this.cache).schema_at_start ?? (_a.schema_at_start = new RegExp(`^${this.get_schema_search().source}`, "i"));
  }
};
var web_schema = {
  validate: (text2, pos, self) => {
    const re = self.re.get_http_validator();
    re.lastIndex = pos;
    const m = re.exec(text2);
    return m ? m[0].length : 0;
  },
  normalize: (match, self) => self.normalize(match)
};
var defaultSchemas = {
  "http:": web_schema,
  "https:": web_schema,
  "ftp:": web_schema,
  "//": {
    validate: function(text2, pos, self) {
      const re = self.re.get_relative_proto_validator();
      re.lastIndex = pos;
      const m = re.exec(text2);
      if (m) {
        if (pos >= 3 && text2[pos - 3] === ":") return 0;
        if (pos >= 3 && text2[pos - 3] === "/") return 0;
        return m[0].length;
      }
      return 0;
    },
    normalize: (match, self) => self.normalize(match)
  },
  "mailto:": {
    validate: function(text2, pos, self) {
      const re = self.re.get_mailto_validator();
      re.lastIndex = pos;
      const m = re.exec(text2);
      return m ? m[0].length : 0;
    },
    normalize: (match, self) => self.normalize(match)
  }
};
var tlds_2ch = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw";
var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444";
function unpackTlds() {
  const result = tlds_default.split("|");
  tlds_2ch.split("|").forEach((item) => {
    const sep = item.indexOf(":");
    const prefix = item.slice(0, sep);
    for (const suffix of item.slice(sep + 1)) result.push(prefix + suffix);
  });
  return result;
}
var defaultOptions = {
  fuzzyLink: false,
  fuzzyEmail: true,
  fuzzyIP: false,
  "---": false,
  tlds: unpackTlds(),
  urlAuth: false,
  maxLength: 1e4
};
var Match = class {
  constructor(text2, schema, index, lastIndex) {
    /** Prefix (protocol) for matched string. Empty for fuzzy links. */
    __publicField(this, "schema");
    /** First position of matched string. */
    __publicField(this, "index");
    /** Next position after matched string. */
    __publicField(this, "lastIndex");
    /** Matched string. */
    __publicField(this, "raw");
    /** Normalized text of matched string. */
    __publicField(this, "text");
    /** Normalized URL of matched string. */
    __publicField(this, "url");
    const raw = text2.slice(index, lastIndex);
    this.schema = schema.toLowerCase();
    this.index = index;
    this.lastIndex = lastIndex;
    this.raw = raw;
    this.text = raw;
    this.url = raw;
  }
};
var LinkifyIt = class {
  /**
  * Creates new linkifier instance.
  *
  * By default understands:
  *
  * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
  * - "fuzzy" emails (foo@bar.com).
  *
  * See {@link LinkifyConstructorOptions} for available options.
  *
  * @param options Recognition options.
  *
  * @example
  * ```javascript
  * import { LinkifyIt } from 'linkify-it'
  *
  * const linkify = new LinkifyIt({ fuzzyLink: true })
  *
  * linkify
  *   .tlds(require('tlds'))       // Reload with full TLD list
  *   .tlds('onion', true)         // Add unofficial `.onion` domain
  *   .add('ftp:', null)           // Disable `ftp:` protocol
  *   .set({ fuzzyIP: true })      // Enable IPs in fuzzy links
  *
  * console.log(linkify.test('Site github.com!')) // true
  * console.log(linkify.match('Site github.com!'))
  * ```
  */
  constructor(options = {}) {
    __publicField(this, "__opts__");
    __publicField(this, "__schemas__");
    __publicField(this, "re");
    const { rebuilder, ...linkifyOptions } = options;
    this.__opts__ = {
      ...defaultOptions,
      ...linkifyOptions
    };
    this.__schemas__ = { ...defaultSchemas };
    this.re = rebuilder || new REBuilder();
    this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
  }
  /**
  * Add new rule definition.
  *
  * `schema` is a link prefix (usually, protocol name with `:` at the end,
  * `skype:` for example). `linkify-it` makes sure that prefix is not
  * preceded with alphanumeric char and symbols. Only whitespaces and
  * punctuation allowed.
  *
  * `definition` is a rule to check tail after link prefix. To disable an
  * existing rule, pass `null`.
  *
  * @param schema Rule name (fixed pattern prefix).
  * @param definition Schema definition, or `null` to disable the rule.
  *
  * See [twitter mentions example](https://github.com/markdown-it/linkify-it/blob/master/examples/twitter.mjs).
  */
  add(schema, definition = null) {
    if (!definition) delete this.__schemas__[schema];
    else {
      const def = {
        normalize: (match, self) => self.normalize(match),
        ...definition
      };
      this.__schemas__[schema] = def;
    }
    this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
    return this;
  }
  /**
  * Set recognition options for links without schema.
  *
  * @param options Recognition options.
  */
  set(options = {}) {
    this.__opts__ = {
      ...this.__opts__,
      ...options
    };
    this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
    return this;
  }
  /**
  * Searches linkifiable pattern and returns `true` on success or `false` on fail.
  *
  * @param text Text to scan.
  */
  test(text2) {
    if (!text2.length) return false;
    let m, re;
    re = this.re.get_schema_search();
    re.lastIndex = 0;
    while ((m = re.exec(text2)) !== null) if (this.testSchemaAt(text2, m[2], re.lastIndex)) return true;
    if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
      re = this.re.get_fuzzy_link_search();
      re.lastIndex = 0;
      if (re.exec(text2) !== null) return true;
    }
    if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
      if (text2.indexOf("@") >= 0) {
        const mailHostRe = this.re.get_fuzzy_mail_host_search();
        const mailNameRe = this.re.get_mail_name_validator();
        mailHostRe.lastIndex = 0;
        while ((m = mailHostRe.exec(text2)) !== null) {
          const name = text2.slice(Math.max(0, m.index - 65), m.index);
          if (mailNameRe.test(name)) return true;
        }
      }
    }
    return false;
  }
  /**
  * Similar to {@link LinkifyIt.test} but checks only specific protocol tail exactly
  * at given position. Returns length of found pattern (0 on fail).
  *
  * @param text Text to scan.
  * @param schema Rule (schema) name.
  * @param pos Text offset to check from.
  */
  testSchemaAt(text2, schema, pos) {
    if (!this.__schemas__[schema.toLowerCase()]) return 0;
    return this.__schemas__[schema.toLowerCase()].validate(text2.slice(0, pos + this.__opts__.maxLength), pos, this);
  }
  /**
  * Returns array of found link descriptions or `null` on fail. We strongly
  * recommend to use {@link LinkifyIt.test} first, for best speed.
  *
  * @param text Text to scan.
  */
  match(text2) {
    const result = [];
    const schemaRe = this.re.get_schema_search();
    let fuzzyLinkRe;
    let mailHostRe;
    let mailNameRe;
    let fuzzyLinkCandidate;
    let fuzzyEmailCandidate;
    let schemaPrefix;
    let schemaDone = false;
    let fuzzyLinkDone = false;
    let fuzzyEmailDone = false;
    let pos = 0;
    if (!text2.length) return null;
    schemaRe.lastIndex = 0;
    if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
      fuzzyLinkRe = this.re.get_fuzzy_link_search();
      fuzzyLinkRe.lastIndex = 0;
    }
    if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
      mailHostRe = this.re.get_fuzzy_mail_host_search();
      mailHostRe.lastIndex = 0;
      mailNameRe = this.re.get_mail_name_validator();
    }
    for (; ; ) {
      const scanFrom = Math.max(pos - 1, 0);
      if (mailHostRe && mailNameRe && !fuzzyEmailDone && (!fuzzyEmailCandidate || fuzzyEmailCandidate.index < pos)) {
        if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
        for (; ; ) {
          const m = mailHostRe.exec(text2);
          if (!m) {
            fuzzyEmailDone = true;
            fuzzyEmailCandidate = void 0;
            break;
          }
          const name = mailNameRe.exec(text2.slice(Math.max(0, m.index - 65), m.index));
          if (!name) continue;
          fuzzyEmailCandidate = {
            schema: "mailto:",
            index: m.index - name[1].length,
            lastIndex: m.index + m[0].length
          };
          if (fuzzyEmailCandidate.index >= pos) break;
          if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
        }
      }
      if (fuzzyLinkRe && !fuzzyLinkDone && (!fuzzyLinkCandidate || fuzzyLinkCandidate.index < pos)) {
        if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
        for (; ; ) {
          const m = fuzzyLinkRe.exec(text2);
          if (!m) {
            fuzzyLinkDone = true;
            fuzzyLinkCandidate = void 0;
            break;
          }
          fuzzyLinkCandidate = {
            schema: "",
            index: m.index + m[1].length,
            lastIndex: m.index + m[0].length
          };
          if (fuzzyLinkCandidate.index >= pos) break;
          if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
        }
      }
      let fuzzyCandidate = fuzzyEmailCandidate;
      if (!fuzzyCandidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < fuzzyCandidate.index || fuzzyLinkCandidate.index === fuzzyCandidate.index && fuzzyLinkCandidate.lastIndex > fuzzyCandidate.lastIndex)) fuzzyCandidate = fuzzyLinkCandidate;
      let schemaCandidate;
      if (!schemaDone) for (; ; ) {
        if (!schemaPrefix) {
          if (schemaRe.lastIndex < scanFrom) schemaRe.lastIndex = scanFrom;
          const m = schemaRe.exec(text2);
          if (!m) {
            schemaDone = true;
            break;
          }
          schemaPrefix = {
            schema: m[2],
            index: m.index + m[1].length,
            lastIndex: m.index + m[0].length
          };
        }
        if (schemaPrefix.index < pos) {
          schemaPrefix = void 0;
          continue;
        }
        if (fuzzyCandidate && schemaPrefix.index > fuzzyCandidate.index) break;
        const prefix = schemaPrefix;
        schemaPrefix = void 0;
        const len = this.testSchemaAt(text2, prefix.schema, prefix.lastIndex);
        if (len) {
          schemaCandidate = {
            schema: prefix.schema,
            index: prefix.index,
            lastIndex: prefix.lastIndex + len
          };
          break;
        }
      }
      let candidate = schemaCandidate;
      if (!candidate || fuzzyEmailCandidate && (fuzzyEmailCandidate.index < candidate.index || fuzzyEmailCandidate.index === candidate.index && fuzzyEmailCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyEmailCandidate;
      if (!candidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < candidate.index || fuzzyLinkCandidate.index === candidate.index && fuzzyLinkCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyLinkCandidate;
      if (!candidate) break;
      if (candidate === fuzzyEmailCandidate) fuzzyEmailCandidate = void 0;
      else if (candidate === fuzzyLinkCandidate) fuzzyLinkCandidate = void 0;
      const match = new Match(text2, candidate.schema, candidate.index, candidate.lastIndex);
      if (match.schema) this.__schemas__[match.schema].normalize(match, this);
      else this.normalize(match);
      result.push(match);
      pos = candidate.lastIndex;
    }
    if (result.length) return result;
    return null;
  }
  /**
  * Returns fully-formed (not fuzzy) link if it starts at the beginning
  * of the string, and null otherwise.
  *
  * @param text Text to scan.
  */
  matchAtStart(text2) {
    if (!text2.length) return null;
    const m = this.re.get_schema_at_start().exec(text2);
    if (!m) return null;
    const len = this.testSchemaAt(text2, m[2], m[0].length);
    if (!len) return null;
    const match = new Match(text2, m[2], m.index + m[1].length, m.index + m[0].length + len);
    this.__schemas__[match.schema].normalize(match, this);
    return match;
  }
  /**
  * Load (or merge) new TLDs list. Those are used for fuzzy links (without
  * prefix) to avoid false positives. By default this algorithm is used:
  *
  * - hostname with any 2-letter root zones are ok.
  * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
  *   are ok.
  * - encoded (`xn--...`) root zones are ok.
  *
  * If list is replaced, then exact match for 2-chars root zones will be checked.
  *
  * @param list List of TLDs.
  * @param keepOld Merge with current list if `true` (`false` by default).
  */
  tlds(list2, keepOld = false) {
    list2 = Array.isArray(list2) ? list2 : [list2];
    if (!keepOld) this.__opts__.tlds = list2;
    else this.__opts__.tlds = this.__opts__.tlds.concat(list2);
    this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
    return this;
  }
  /**
  * Default normalizer (if schema does not define its own).
  *
  * @param match Match to normalize.
  */
  normalize(match) {
    if (!match.schema) match.url = `http://${match.url}`;
    if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) match.url = `mailto:${match.url}`;
  }
};

// ../../experience-picker-20261113/node_modules/punycode.js/punycode.es6.js
var maxInt = 2147483647;
var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128;
var delimiter = "-";
var regexPunycode = /^xn--/;
var regexNonASCII = /[^\0-\x7F]/;
var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
var errors = {
  "overflow": "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
};
var baseMinusTMin = base - tMin;
var floor = Math.floor;
var stringFromCharCode = String.fromCharCode;
function error(type) {
  throw new RangeError(errors[type]);
}
function map(array, callback) {
  const result = [];
  let length = array.length;
  while (length--) {
    result[length] = callback(array[length]);
  }
  return result;
}
function mapDomain(domain, callback) {
  const parts = domain.split("@");
  let result = "";
  if (parts.length > 1) {
    result = parts[0] + "@";
    domain = parts[1];
  }
  domain = domain.replace(regexSeparators, ".");
  const labels = domain.split(".");
  const encoded = map(labels, callback).join(".");
  return result + encoded;
}
function ucs2decode(string) {
  const output = [];
  let counter = 0;
  const length = string.length;
  while (counter < length) {
    const value = string.charCodeAt(counter++);
    if (value >= 55296 && value <= 56319 && counter < length) {
      const extra = string.charCodeAt(counter++);
      if ((extra & 64512) == 56320) {
        output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
      } else {
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}
var ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
var basicToDigit = function(codePoint) {
  if (codePoint >= 48 && codePoint < 58) {
    return 26 + (codePoint - 48);
  }
  if (codePoint >= 65 && codePoint < 91) {
    return codePoint - 65;
  }
  if (codePoint >= 97 && codePoint < 123) {
    return codePoint - 97;
  }
  return base;
};
var digitToBasic = function(digit, flag) {
  return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
};
var adapt = function(delta, numPoints, firstTime) {
  let k = 0;
  delta = firstTime ? floor(delta / damp) : delta >> 1;
  delta += floor(delta / numPoints);
  for (; delta > baseMinusTMin * tMax >> 1; k += base) {
    delta = floor(delta / baseMinusTMin);
  }
  return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
};
var decode2 = function(input2) {
  const output = [];
  const inputLength = input2.length;
  let i = 0;
  let n = initialN;
  let bias = initialBias;
  let basic = input2.lastIndexOf(delimiter);
  if (basic < 0) {
    basic = 0;
  }
  for (let j = 0; j < basic; ++j) {
    if (input2.charCodeAt(j) >= 128) {
      error("not-basic");
    }
    output.push(input2.charCodeAt(j));
  }
  for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (index >= inputLength) {
        error("invalid-input");
      }
      const digit = basicToDigit(input2.charCodeAt(index++));
      if (digit >= base) {
        error("invalid-input");
      }
      if (digit > floor((maxInt - i) / w)) {
        error("overflow");
      }
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) {
        break;
      }
      const baseMinusT = base - t;
      if (w > floor(maxInt / baseMinusT)) {
        error("overflow");
      }
      w *= baseMinusT;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi == 0);
    if (floor(i / out) > maxInt - n) {
      error("overflow");
    }
    n += floor(i / out);
    i %= out;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
};
var encode2 = function(input2) {
  const output = [];
  input2 = ucs2decode(input2);
  const inputLength = input2.length;
  let n = initialN;
  let delta = 0;
  let bias = initialBias;
  for (const currentValue of input2) {
    if (currentValue < 128) {
      output.push(stringFromCharCode(currentValue));
    }
  }
  const basicLength = output.length;
  let handledCPCount = basicLength;
  if (basicLength) {
    output.push(delimiter);
  }
  while (handledCPCount < inputLength) {
    let m = maxInt;
    for (const currentValue of input2) {
      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    }
    const handledCPCountPlusOne = handledCPCount + 1;
    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
      error("overflow");
    }
    delta += (m - n) * handledCPCountPlusOne;
    n = m;
    for (const currentValue of input2) {
      if (currentValue < n && ++delta > maxInt) {
        error("overflow");
      }
      if (currentValue === n) {
        let q = delta;
        for (let k = base; ; k += base) {
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (q < t) {
            break;
          }
          const qMinusT = q - t;
          const baseMinusT = base - t;
          output.push(
            stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
          );
          q = floor(qMinusT / baseMinusT);
        }
        output.push(stringFromCharCode(digitToBasic(q, 0)));
        bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
        delta = 0;
        ++handledCPCount;
      }
    }
    ++delta;
    ++n;
  }
  return output.join("");
};
var toUnicode = function(input2) {
  return mapDomain(input2, function(string) {
    return regexPunycode.test(string) ? decode2(string.slice(4).toLowerCase()) : string;
  });
};
var toASCII = function(input2) {
  return mapDomain(input2, function(string) {
    return regexNonASCII.test(string) ? "xn--" + encode2(string) : string;
  });
};
var punycode = {
  /**
   * A string representing the current Punycode.js version number.
   * @memberOf punycode
   * @type String
   */
  "version": "2.3.1",
  /**
   * An object of methods to convert from JavaScript's internal character
   * representation (UCS-2) to Unicode code points, and back.
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode
   * @type Object
   */
  "ucs2": {
    "decode": ucs2decode,
    "encode": ucs2encode
  },
  "decode": decode2,
  "encode": encode2,
  "toASCII": toASCII,
  "toUnicode": toUnicode
};
var punycode_es6_default = punycode;

// ../../experience-picker-20261113/node_modules/markdown-it/dist/markdown-it.mjs
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var __defProp2 = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all) __defProp2(target, name, {
    get: all[name],
    enumerable: true
  });
  if (!no_symbols) __defProp2(target, Symbol.toStringTag, { value: "Module" });
  return target;
};
var utils_exports = /* @__PURE__ */ __exportAll({
  arrayReplaceAt: () => arrayReplaceAt,
  asciiTrim: () => asciiTrim,
  callable: () => callable,
  escapeHtml: () => escapeHtml,
  escapeRE: () => escapeRE,
  fromCodePoint: () => fromCodePoint,
  isMdAsciiPunct: () => isMdAsciiPunct,
  isPunctChar: () => isPunctChar,
  isPunctCharCode: () => isPunctCharCode,
  isSpace: () => isSpace,
  isValidEntityCode: () => isValidEntityCode,
  isWhiteSpace: () => isWhiteSpace,
  lib: () => lib,
  normalizeReference: () => normalizeReference,
  unescapeAll: () => unescapeAll,
  unescapeMd: () => unescapeMd
});
function callable(cls) {
  const wrapper = function(...args) {
    return Reflect.construct(cls, args, new.target && new.target !== wrapper ? new.target : cls);
  };
  Object.defineProperty(wrapper, "name", { value: cls.name });
  Object.setPrototypeOf(wrapper, cls);
  wrapper.prototype = cls.prototype;
  return wrapper;
}
function arrayReplaceAt(src, pos, newElements) {
  return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
}
function isValidEntityCode(c) {
  if (c >= 55296 && c <= 57343) return false;
  if (c >= 64976 && c <= 65007) return false;
  if ((c & 65535) === 65535 || (c & 65535) === 65534) return false;
  if (c >= 0 && c <= 8) return false;
  if (c === 11) return false;
  if (c >= 14 && c <= 31) return false;
  if (c >= 127 && c <= 159) return false;
  if (c > 1114111) return false;
  return true;
}
function fromCodePoint(c) {
  if (c > 65535) {
    c -= 65536;
    const surrogate1 = 55296 + (c >> 10);
    const surrogate2 = 56320 + (c & 1023);
    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}
var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
var UNESCAPE_ALL_RE = new RegExp(`${UNESCAPE_MD_RE.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi");
var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function replaceEntityPattern(match, name) {
  if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
    const code2 = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    if (isValidEntityCode(code2)) return fromCodePoint(code2);
    return match;
  }
  const decoded = decodeHTMLStrict(match);
  if (decoded !== match) return decoded;
  return match;
}
function unescapeMd(str) {
  if (str.indexOf("\\") < 0) return str;
  return str.replace(UNESCAPE_MD_RE, "$1");
}
function unescapeAll(str) {
  if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) return str;
  return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity2) {
    if (escaped) return escaped;
    return replaceEntityPattern(match, entity2);
  });
}
var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}
function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  return str;
}
var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
function escapeRE(str) {
  return str.replace(REGEXP_ESCAPE_RE, "\\$&");
}
function isSpace(code2) {
  switch (code2) {
    case 9:
    case 32:
      return true;
  }
  return false;
}
function isWhiteSpace(code2) {
  if (code2 >= 8192 && code2 <= 8202) return true;
  switch (code2) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return true;
  }
  return false;
}
function isPunctChar(ch) {
  return P.test(ch) || S.test(ch);
}
function isPunctCharCode(code2) {
  return isPunctChar(fromCodePoint(code2));
}
function isMdAsciiPunct(ch) {
  switch (ch) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return true;
    default:
      return false;
  }
}
function normalizeReference(str) {
  str = str.trim().replace(/\s+/g, " ");
  return str.toLowerCase().toUpperCase();
}
function isAsciiTrimmable(c) {
  return c === 32 || c === 9 || c === 10 || c === 13;
}
function asciiTrim(str) {
  let start = 0;
  for (; start < str.length; start++) if (!isAsciiTrimmable(str.charCodeAt(start))) break;
  let end = str.length - 1;
  for (; end >= start; end--) if (!isAsciiTrimmable(str.charCodeAt(end))) break;
  return str.slice(start, end + 1);
}
var lib = {
  mdurl: mdurl_exports,
  ucmicro: build_exports
};
function parseLinkLabel(state, start, disableNested) {
  let level, found, marker, prevPos;
  const max = state.posMax;
  const oldPos = state.pos;
  state.pos = start + 1;
  level = 1;
  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);
    if (marker === 93) {
      level--;
      if (level === 0) {
        found = true;
        break;
      }
    }
    prevPos = state.pos;
    state.md.inline.skipToken(state);
    if (marker === 91) {
      if (prevPos === state.pos - 1) level++;
      else if (disableNested) {
        state.pos = oldPos;
        return -1;
      }
    }
  }
  let labelEnd = -1;
  if (found) labelEnd = state.pos;
  state.pos = oldPos;
  return labelEnd;
}
function parseLinkDestination(str, start, max) {
  let code2;
  let pos = start;
  const result = {
    ok: false,
    pos: 0,
    str: ""
  };
  if (str.charCodeAt(pos) === 60) {
    pos++;
    while (pos < max) {
      code2 = str.charCodeAt(pos);
      if (code2 === 10) return result;
      if (code2 === 60) return result;
      if (code2 === 62) {
        result.pos = pos + 1;
        result.str = unescapeAll(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      }
      if (code2 === 92 && pos + 1 < max) {
        pos += 2;
        continue;
      }
      pos++;
    }
    return result;
  }
  let level = 0;
  while (pos < max) {
    code2 = str.charCodeAt(pos);
    if (code2 === 32) break;
    if (code2 < 32 || code2 === 127) break;
    if (code2 === 92 && pos + 1 < max) {
      if (str.charCodeAt(pos + 1) === 32) {
        pos++;
        continue;
      }
      pos += 2;
      continue;
    }
    if (code2 === 40) {
      level++;
      if (level > 32) return result;
    }
    if (code2 === 41) {
      if (level === 0) break;
      level--;
    }
    pos++;
  }
  if (start === pos) return result;
  if (level !== 0) return result;
  result.str = unescapeAll(str.slice(start, pos));
  result.pos = pos;
  result.ok = true;
  return result;
}
function parseLinkTitle(str, start, max, prev_state) {
  let code2;
  let pos = start;
  const state = {
    ok: false,
    can_continue: false,
    pos: 0,
    str: "",
    marker: 0
  };
  if (prev_state) {
    state.str = prev_state.str;
    state.marker = prev_state.marker;
  } else {
    if (pos >= max) return state;
    let marker = str.charCodeAt(pos);
    if (marker !== 34 && marker !== 39 && marker !== 40) return state;
    start++;
    pos++;
    if (marker === 40) marker = 41;
    state.marker = marker;
  }
  while (pos < max) {
    code2 = str.charCodeAt(pos);
    if (code2 === state.marker) {
      state.pos = pos + 1;
      state.str += unescapeAll(str.slice(start, pos));
      state.ok = true;
      return state;
    } else if (code2 === 40 && state.marker === 41) return state;
    else if (code2 === 92 && pos + 1 < max) pos++;
    pos++;
  }
  state.can_continue = true;
  state.str += unescapeAll(str.slice(start, pos));
  return state;
}
var helpers_exports = /* @__PURE__ */ __exportAll({
  parseLinkDestination: () => parseLinkDestination,
  parseLinkLabel: () => parseLinkLabel,
  parseLinkTitle: () => parseLinkTitle
});
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
var Token = class {
  constructor(type, tag, nesting) {
    _defineProperty(
      this,
      /**
      * Source map info. Format: `[ line_begin, line_end ]`
      */
      "map",
      null
    );
    _defineProperty(
      this,
      /**
      * nesting level, the same as `state.level`
      */
      "level",
      0
    );
    _defineProperty(
      this,
      /**
      * An array of child nodes (inline and img tokens)
      */
      "children",
      null
    );
    _defineProperty(
      this,
      /**
      * In a case of self-closing tag (code, html, fence, etc.),
      * it has contents of this tag.
      */
      "content",
      ""
    );
    _defineProperty(
      this,
      /**
      * '*' or '_' for emphasis, fence string for fence, etc.
      */
      "markup",
      ""
    );
    _defineProperty(
      this,
      /**
      * Additional information:
      *
      * - Info string for "fence" tokens
      * - The value "auto" for autolink "link_open" and "link_close" tokens
      * - The string value of the item marker for ordered-list "list_item_open" tokens
      */
      "info",
      ""
    );
    _defineProperty(
      this,
      /**
      * True for block-level tokens, false for inline tokens.
      * Used in renderer to calculate line breaks
      */
      "block",
      false
    );
    _defineProperty(
      this,
      /**
      * If it's true, ignore this element when rendering. Used for tight lists
      * to hide paragraphs.
      */
      "hidden",
      false
    );
    this.type = type;
    this.tag = tag;
    this.attrs = null;
    this.nesting = nesting;
    this.meta = null;
  }
  /**
  * Search attribute index by name.
  */
  attrIndex(name) {
    if (!this.attrs) return -1;
    const attrs = this.attrs;
    for (let i = 0, len = attrs.length; i < len; i++) if (attrs[i][0] === name) return i;
    return -1;
  }
  /**
  * Add `[ name, value ]` attribute to list. Init attrs if necessary
  */
  attrPush(attrData) {
    if (this.attrs) this.attrs.push(attrData);
    else this.attrs = [attrData];
  }
  /**
  * Set `name` attribute to `value`. Override old value if exists.
  */
  attrSet(name, value) {
    const idx = this.attrIndex(name);
    const attrData = [name, value];
    if (idx < 0) this.attrPush(attrData);
    else this.attrs[idx] = attrData;
  }
  /**
  * Get the value of attribute `name`, or null if it does not exist.
  */
  attrGet(name) {
    const idx = this.attrIndex(name);
    let value = null;
    if (idx >= 0) value = this.attrs[idx][1];
    return value;
  }
  /**
  * Join value to existing attribute via space. Or create new attribute if not
  * exists. Useful to operate with token classes.
  */
  attrJoin(name, value) {
    const idx = this.attrIndex(name);
    if (idx < 0) this.attrPush([name, value]);
    else this.attrs[idx][1] = `${this.attrs[idx][1]} ${value}`;
  }
};
var Ruler = class {
  constructor() {
    _defineProperty(
      this,
      /** @internal */
      "__rules__",
      []
    );
    _defineProperty(
      this,
      /** @internal */
      "__cache__",
      null
    );
  }
  /** @internal */
  __find__(name) {
    for (let i = 0; i < this.__rules__.length; i++) if (this.__rules__[i].name === name) return i;
    return -1;
  }
  /** @internal */
  __compile__() {
    const chains = /* @__PURE__ */ new Set();
    this.__rules__.forEach((rule) => {
      if (!rule.enabled) return;
      rule.alt.forEach((altName) => {
        if (altName) chains.add(altName);
      });
    });
    this.__cache__ = /* @__PURE__ */ Object.create(null);
    this.__cache__[""] = [];
    this.__rules__.forEach((rule) => {
      if (rule.enabled) this.__cache__[""].push(rule.fn);
    });
    chains.forEach((chain) => {
      this.__cache__[chain] = [];
      this.__rules__.forEach((rule) => {
        if (rule.enabled && rule.alt.indexOf(chain) >= 0) this.__cache__[chain].push(rule.fn);
      });
    });
  }
  /**
  * Replace rule by name with new function & options. Throws error if name not
  * found.
  *
  * @example Replace existing typographer replacement rule with new one
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.core.ruler.at('replacements', function replace(state) {
  *   //...
  * });
  * ```
  */
  at(name, fn, options = {}) {
    const index = this.__find__(name);
    if (index === -1) throw new Error(`Parser rule not found: ${name}`);
    this.__rules__[index].fn = fn;
    this.__rules__[index].alt = options.alt || [];
    this.__cache__ = null;
  }
  /**
  * Add new rule to chain before one with given name. See also
  * {@link Ruler.after}, {@link Ruler.push}.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
  *   //...
  * });
  * ```
  */
  before(beforeName, ruleName, fn, options = {}) {
    const index = this.__find__(beforeName);
    if (index === -1) throw new Error(`Parser rule not found: ${beforeName}`);
    this.__rules__.splice(index, 0, {
      name: ruleName,
      enabled: true,
      fn,
      alt: options.alt || []
    });
    this.__cache__ = null;
  }
  /**
  * Add new rule to chain after one with given name. See also
  * {@link Ruler.before}, {@link Ruler.push}.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.inline.ruler.after('text', 'my_rule', function replace(state) {
  *   //...
  * });
  * ```
  */
  after(afterName, ruleName, fn, options = {}) {
    const index = this.__find__(afterName);
    if (index === -1) throw new Error(`Parser rule not found: ${afterName}`);
    this.__rules__.splice(index + 1, 0, {
      name: ruleName,
      enabled: true,
      fn,
      alt: options.alt || []
    });
    this.__cache__ = null;
  }
  /**
  * Push new rule to the end of chain. See also
  * {@link Ruler.before}, {@link Ruler.after}.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.core.ruler.push('my_rule', function replace(state) {
  *   //...
  * });
  * ```
  */
  push(ruleName, fn, options = {}) {
    this.__rules__.push({
      name: ruleName,
      enabled: true,
      fn,
      alt: options.alt || []
    });
    this.__cache__ = null;
  }
  /**
  * Enable rules with given names. If any rule name not found - throw Error.
  * Errors can be disabled by second param.
  *
  * See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
  *
  * Returns list of found rule names (if no exception happened).
  */
  enable(list2, ignoreInvalid = false) {
    if (!Array.isArray(list2)) list2 = [list2];
    const result = [];
    list2.forEach((name) => {
      const idx = this.__find__(name);
      if (idx < 0) {
        if (ignoreInvalid) return;
        throw new Error(`Rules manager: invalid rule name ${name}`);
      }
      this.__rules__[idx].enabled = true;
      result.push(name);
    });
    this.__cache__ = null;
    return result;
  }
  /**
  * Enable rules with given names, and disable everything else. If any rule name
  * not found - throw Error. Errors can be disabled by second param.
  *
  * See also {@link Ruler.disable}, {@link Ruler.enable}.
  */
  enableOnly(list2, ignoreInvalid = false) {
    if (!Array.isArray(list2)) list2 = [list2];
    this.__rules__.forEach((rule) => {
      rule.enabled = false;
    });
    this.enable(list2, ignoreInvalid);
  }
  /**
  * Disable rules with given names. If any rule name not found - throw Error.
  * Errors can be disabled by second param.
  *
  * See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
  *
  * Returns list of found rule names (if no exception happened).
  */
  disable(list2, ignoreInvalid = false) {
    if (!Array.isArray(list2)) list2 = [list2];
    const result = [];
    list2.forEach((name) => {
      const idx = this.__find__(name);
      if (idx < 0) {
        if (ignoreInvalid) return;
        throw new Error(`Rules manager: invalid rule name ${name}`);
      }
      this.__rules__[idx].enabled = false;
      result.push(name);
    });
    this.__cache__ = null;
    return result;
  }
  /**
  * Return array of active functions (rules) for given chain name. It analyzes
  * rules configuration, compiles caches if not exists and returns result.
  *
  * Default chain name is `''` (empty string). It can't be skipped. That's
  * done intentionally, to keep signature monomorphic for high speed.
  */
  getRules(chainName) {
    if (!this.__cache__) this.__compile__();
    return this.__cache__[chainName] || [];
  }
};
var default_rules = {};
default_rules.code_inline = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  return `<code${slf.renderAttrs(token)}>${escapeHtml(token.content)}</code>`;
};
default_rules.code_block = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  return `<pre${slf.renderAttrs(token)}><code>${escapeHtml(tokens[idx].content)}</code></pre>
`;
};
default_rules.fence = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  const info = token.info ? unescapeAll(token.info).trim() : "";
  let langName = "";
  let langAttrs = "";
  if (info) {
    const arr = info.split(/(\s+)/g);
    langName = arr[0];
    langAttrs = arr.slice(2).join("");
  }
  let highlighted;
  if (options.highlight) highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
  else highlighted = escapeHtml(token.content);
  if (highlighted.indexOf("<pre") === 0) return highlighted + "\n";
  if (info) {
    const i = token.attrIndex("class");
    const tmpAttrs = token.attrs ? token.attrs.slice() : [];
    if (i < 0) tmpAttrs.push(["class", `${options.langPrefix}${langName}`]);
    else {
      tmpAttrs[i] = [tmpAttrs[i][0], tmpAttrs[i][1]];
      tmpAttrs[i][1] += ` ${options.langPrefix}${langName}`;
    }
    const tmpToken = { attrs: tmpAttrs };
    return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>
`;
  }
  return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>
`;
};
default_rules.image = function(tokens, idx, options, env, slf) {
  const token = tokens[idx];
  token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
  return slf.renderToken(tokens, idx, options);
};
default_rules.hardbreak = function(tokens, idx, options) {
  return options.xhtmlOut ? "<br />\n" : "<br>\n";
};
default_rules.softbreak = function(tokens, idx, options) {
  return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
};
default_rules.text = function(tokens, idx) {
  return escapeHtml(tokens[idx].content);
};
default_rules.html_block = function(tokens, idx) {
  return tokens[idx].content;
};
default_rules.html_inline = function(tokens, idx) {
  return tokens[idx].content;
};
var Renderer = class {
  constructor() {
    _defineProperty(
      this,
      /**
      * Contains render rules for tokens. Can be updated and extended.
      *
      * See [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts)
      * for more details and examples.
      *
      * @example Custom render rules
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * md.renderer.rules.strong_open  = function () { return '<b>'; };
      * md.renderer.rules.strong_close = function () { return '</b>'; };
      *
      * const result = md.renderInline(...);
      * ```
      *
      * @example Each rule is called as independent static function with fixed signature
      * ```javascript
      * function my_token_render(tokens, idx, options, env, renderer) {
      *   // ...
      *   return renderedHTML;
      * }
      * ```
      */
      "rules",
      Object.assign({}, default_rules)
    );
  }
  /**
  * Render token attributes to string.
  */
  renderAttrs(token) {
    let i, l, result;
    if (!token.attrs) return "";
    result = "";
    for (i = 0, l = token.attrs.length; i < l; i++) result += ` ${escapeHtml(token.attrs[i][0])}="${escapeHtml(String(token.attrs[i][1]))}"`;
    return result;
  }
  /**
  * Default token renderer. Can be overriden by custom function
  * in {@link Renderer.rules}.
  */
  renderToken(tokens, idx, options) {
    const token = tokens[idx];
    let result = "";
    if (token.hidden) return "";
    let prev = idx - 1;
    while (prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === 0) prev--;
    if (token.block && token.nesting !== -1 && prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === -1) result += "\n";
    result += (token.nesting === -1 ? "</" : "<") + token.tag;
    result += this.renderAttrs(token);
    if (token.nesting === 0 && options.xhtmlOut) result += " /";
    let needLf = false;
    if (token.block) {
      needLf = true;
      if (token.nesting === 1) {
        let next = idx + 1;
        while (next < tokens.length && tokens[next].hidden && tokens[next].nesting === 0) next++;
        if (next < tokens.length) {
          const nextToken = tokens[next];
          if (nextToken.type === "inline" || nextToken.hidden) needLf = false;
          else if (nextToken.nesting === -1 && nextToken.tag === token.tag) needLf = false;
        }
      }
    }
    result += needLf ? ">\n" : ">";
    return result;
  }
  /**
  * The same as {@link Renderer.render}, but for single token of `inline` type.
  */
  renderInline(tokens, options, env) {
    let result = "";
    const rules = this.rules;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const type = tokens[i].type;
      if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
      else result += this.renderToken(tokens, i, options);
    }
    return result;
  }
  /**
  * Special kludge for image `alt` attributes to conform CommonMark spec.
  * Don't try to use it! Spec requires to show `alt` content with stripped markup,
  * instead of simple escaping.
  */
  renderInlineAsText(tokens, options, env) {
    let result = "";
    for (let i = 0, len = tokens.length; i < len; i++) switch (tokens[i].type) {
      case "text":
      case "code_inline":
        result += tokens[i].content;
        break;
      case "image":
        result += this.renderInlineAsText(tokens[i].children, options, env);
        break;
      case "html_inline":
      case "html_block":
        result += tokens[i].content;
        break;
      case "softbreak":
      case "hardbreak":
        result += "\n";
    }
    return result;
  }
  /**
  * Takes token stream and generates HTML. Probably, you will never need to call
  * this method directly.
  */
  render(tokens, options, env) {
    let result = "";
    const rules = this.rules;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const type = tokens[i].type;
      if (type === "inline") result += this.renderInline(tokens[i].children, options, env);
      else if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
      else result += this.renderToken(tokens, i, options);
    }
    return result;
  }
};
var StateCore = class {
  constructor(src, md2, env) {
    _defineProperty(this, "tokens", []);
    _defineProperty(this, "inlineMode", false);
    _defineProperty(this, "Token", Token);
    this.src = src;
    this.env = env;
    this.md = md2;
  }
};
var UNNORMALIZED_NEWLINE_RE = /\r\n?/g;
var NULL_RE = /\0/g;
function normalize(state) {
  let str;
  str = state.src.replace(UNNORMALIZED_NEWLINE_RE, "\n");
  str = str.replace(NULL_RE, "\uFFFD");
  state.src = str;
}
function block(state) {
  let token;
  if (state.inlineMode) {
    token = new state.Token("inline", "", 0);
    token.content = state.src;
    token.map = [0, 1];
    token.children = [];
    state.tokens.push(token);
  } else state.md.block.parse(state.src, state.md, state.env, state.tokens);
}
function strip_references(state) {
  const tokens = state.tokens;
  let last = 0;
  for (let curr = 0; curr < tokens.length; curr++) {
    if (tokens[curr].type === "reference_definition") continue;
    if (curr !== last) tokens[last] = tokens[curr];
    last++;
  }
  if (tokens.length !== last) tokens.length = last;
}
function inline(state) {
  const tokens = state.tokens;
  for (let i = 0, l = tokens.length; i < l; i++) {
    const tok = tokens[i];
    if (tok.type === "inline") state.md.inline.parse(tok.content, state.md, state.env, tok.children);
  }
}
function isLinkOpen$1(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose$1(str) {
  return /^<\/a\s*>/i.test(str);
}
function linkify$1(state) {
  const blockTokens = state.tokens;
  if (!state.md.options.linkify) return;
  for (let j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== "inline" || !state.md.linkify.test(blockTokens[j].content)) continue;
    const tokens = blockTokens[j].children;
    const replacements = [];
    let htmlLinkLevel = 0;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const currentToken = tokens[i];
      if (currentToken.type === "link_close") {
        i--;
        while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") i--;
        continue;
      }
      if (currentToken.type === "html_inline") {
        if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) htmlLinkLevel--;
        if (isLinkClose$1(currentToken.content)) htmlLinkLevel++;
      }
      if (htmlLinkLevel > 0) continue;
      if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
        const text2 = currentToken.content;
        let links = state.md.linkify.match(text2);
        const nodes = [];
        let level = currentToken.level;
        let lastPos = 0;
        if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") links = links.slice(1);
        for (let ln = 0; ln < links.length; ln++) {
          const url = links[ln].url;
          const fullUrl = state.md.normalizeLink(url);
          if (!state.md.validateLink(fullUrl)) continue;
          let urlText = links[ln].text;
          if (!links[ln].schema) urlText = state.md.normalizeLinkText(`http://${urlText}`).replace(/^http:\/\//, "");
          else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) urlText = state.md.normalizeLinkText(`mailto:${urlText}`).replace(/^mailto:/, "");
          else urlText = state.md.normalizeLinkText(urlText);
          const pos = links[ln].index;
          if (pos > lastPos) {
            const token = new state.Token("text", "", 0);
            token.content = text2.slice(lastPos, pos);
            token.level = level;
            nodes.push(token);
          }
          const token_o = new state.Token("link_open", "a", 1);
          token_o.attrs = [["href", fullUrl]];
          token_o.level = level++;
          token_o.markup = "linkify";
          token_o.info = "auto";
          nodes.push(token_o);
          const token_t = new state.Token("text", "", 0);
          token_t.content = urlText;
          token_t.level = level;
          nodes.push(token_t);
          const token_c = new state.Token("link_close", "a", -1);
          token_c.level = --level;
          token_c.markup = "linkify";
          token_c.info = "auto";
          nodes.push(token_c);
          lastPos = links[ln].lastIndex;
        }
        if (lastPos < text2.length) {
          const token = new state.Token("text", "", 0);
          token.content = text2.slice(lastPos);
          token.level = level;
          nodes.push(token);
        }
        replacements.push({
          index: i,
          nodes
        });
      }
    }
    if (replacements.length > 0) {
      let newTokensLength = tokens.length;
      for (const replacement of replacements) newTokensLength += replacement.nodes.length - 1;
      const newTokens = new Array(newTokensLength);
      let replacementIndex = 0;
      let newTokenIndex = 0;
      replacements.reverse();
      for (let i = 0; i < tokens.length; i++) {
        const replacement = replacements[replacementIndex];
        if ((replacement === null || replacement === void 0 ? void 0 : replacement.index) === i) {
          for (const node of replacement.nodes) newTokens[newTokenIndex++] = node;
          replacementIndex++;
        } else newTokens[newTokenIndex++] = tokens[i];
      }
      blockTokens[j].children = newTokens;
    }
  }
}
var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
var SCOPED_ABBR_RE = /\((c|tm|r)\)/gi;
var SCOPED_ABBR = {
  c: "\xA9",
  r: "\xAE",
  tm: "\u2122"
};
function replaceFn(match, name) {
  return SCOPED_ABBR[name.toLowerCase()];
}
function replace_scoped(inlineTokens) {
  let inside_autolink = 0;
  for (let i = inlineTokens.length - 1; i >= 0; i--) {
    const token = inlineTokens[i];
    if (token.type === "text" && !inside_autolink) token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
    if (token.type === "link_open" && token.info === "auto") inside_autolink--;
    if (token.type === "link_close" && token.info === "auto") inside_autolink++;
  }
}
function replace_rare(inlineTokens) {
  let inside_autolink = 0;
  for (let i = inlineTokens.length - 1; i >= 0; i--) {
    const token = inlineTokens[i];
    if (token.type === "text" && !inside_autolink) {
      if (RARE_RE.test(token.content)) token.content = token.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1\u2014").replace(/(^|\s)--(?=\s|$)/gm, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1\u2013");
    }
    if (token.type === "link_open" && token.info === "auto") inside_autolink--;
    if (token.type === "link_close" && token.info === "auto") inside_autolink++;
  }
}
function replace(state) {
  let blkIdx;
  if (!state.md.options.typographer) return;
  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== "inline") continue;
    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) replace_scoped(state.tokens[blkIdx].children);
    if (RARE_RE.test(state.tokens[blkIdx].content)) replace_rare(state.tokens[blkIdx].children);
  }
}
var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = "\u2019";
var MAX_OPENERS = 1e3;
function truncateStack(stack, heads, length) {
  while (stack.length > length) {
    const item = stack.pop();
    if (item.isSingleQuote) heads.single = item.prevSameQuoteIdx;
    else heads.double = item.prevSameQuoteIdx;
  }
}
function addReplacement(replacements, tokenIdx, pos, ch) {
  if (!replacements[tokenIdx]) replacements[tokenIdx] = [];
  replacements[tokenIdx].push({
    pos,
    ch
  });
}
function applyReplacements(str, replacements) {
  let result = "";
  let lastPos = 0;
  replacements.sort((a, b) => a.pos - b.pos);
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i];
    result += str.slice(lastPos, replacement.pos) + replacement.ch;
    lastPos = replacement.pos + 1;
  }
  return result + str.slice(lastPos);
}
function process_inlines(tokens, state) {
  let j;
  const stack = [];
  const heads = {
    single: -1,
    double: -1
  };
  const replacements = {};
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const thisLevel = tokens[i].level;
    for (j = stack.length - 1; j >= 0; j--) if (stack[j].level <= thisLevel) break;
    truncateStack(stack, heads, j + 1);
    if (token.type !== "text") continue;
    const text2 = token.content;
    let pos = 0;
    const max = text2.length;
    OUTER: while (pos < max) {
      QUOTE_RE.lastIndex = pos;
      const t = QUOTE_RE.exec(text2);
      if (!t) break;
      let canOpen = true;
      let canClose = true;
      pos = t.index + 1;
      const isSingle = t[0] === "'";
      let lastChar = 32;
      if (t.index - 1 >= 0) lastChar = text2.charCodeAt(t.index - 1);
      else for (j = i - 1; j >= 0; j--) {
        if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
        if (!tokens[j].content) continue;
        lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
        break;
      }
      let nextChar = 32;
      if (pos < max) nextChar = text2.charCodeAt(pos);
      else for (j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
        if (!tokens[j].content) continue;
        nextChar = tokens[j].content.charCodeAt(0);
        break;
      }
      const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
      const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
      const isLastWhiteSpace = isWhiteSpace(lastChar);
      const isNextWhiteSpace = isWhiteSpace(nextChar);
      if (isNextWhiteSpace) canOpen = false;
      else if (isNextPunctChar) {
        if (!(isLastWhiteSpace || isLastPunctChar)) canOpen = false;
      }
      if (isLastWhiteSpace) canClose = false;
      else if (isLastPunctChar) {
        if (!(isNextWhiteSpace || isNextPunctChar)) canClose = false;
      }
      if (nextChar === 34 && t[0] === '"') {
        if (lastChar >= 48 && lastChar <= 57) canClose = canOpen = false;
      }
      if (canOpen && canClose) {
        canOpen = isLastPunctChar;
        canClose = isNextPunctChar;
      }
      if (!canOpen && !canClose) {
        if (isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
        continue;
      }
      if (canClose) {
        j = isSingle ? heads.single : heads.double;
        if (j >= 0 && stack[j].level === thisLevel) {
          const item = stack[j];
          let openQuote;
          let closeQuote;
          if (isSingle) {
            openQuote = state.md.options.quotes[2];
            closeQuote = state.md.options.quotes[3];
          } else {
            openQuote = state.md.options.quotes[0];
            closeQuote = state.md.options.quotes[1];
          }
          addReplacement(replacements, i, t.index, closeQuote);
          addReplacement(replacements, item.tokenIdx, item.contentPos, openQuote);
          truncateStack(stack, heads, j);
          continue OUTER;
        }
      }
      if (canOpen) {
        if (stack.length >= MAX_OPENERS) return;
        stack.push({
          tokenIdx: i,
          contentPos: t.index,
          isSingleQuote: isSingle,
          level: thisLevel,
          prevSameQuoteIdx: isSingle ? heads.single : heads.double
        });
        if (isSingle) heads.single = stack.length - 1;
        else heads.double = stack.length - 1;
      } else if (canClose && isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
    }
  }
  Object.keys(replacements).forEach(function(tokenIdx) {
    const idx = Number(tokenIdx);
    tokens[idx].content = applyReplacements(tokens[idx].content, replacements[tokenIdx]);
  });
}
function smartquotes(state) {
  if (!state.md.options.typographer) return;
  for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) continue;
    process_inlines(state.tokens[blkIdx].children, state);
  }
}
function join_alt(tokens) {
  let curr, last;
  const max = tokens.length;
  for (curr = 0; curr < max; curr++) if (tokens[curr].type === "text_special") tokens[curr].type = "text";
  for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
  else {
    if (curr !== last) tokens[last] = tokens[curr];
    last++;
  }
  if (curr !== last) tokens.length = last;
}
function text_join(state) {
  let curr, last;
  const blockTokens = state.tokens;
  const l = blockTokens.length;
  for (let j = 0; j < l; j++) {
    if (blockTokens[j].type !== "inline") continue;
    const tokens = blockTokens[j].children;
    const max = tokens.length;
    for (curr = 0; curr < max; curr++) {
      if (tokens[curr].type === "text_special") tokens[curr].type = "text";
      if (tokens[curr].children) join_alt(tokens[curr].children);
    }
    for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    else {
      if (curr !== last) tokens[last] = tokens[curr];
      last++;
    }
    if (curr !== last) tokens.length = last;
  }
}
var _rules$2 = [
  ["normalize", normalize],
  ["block", block],
  ["strip_references", strip_references],
  ["inline", inline],
  ["linkify", linkify$1],
  ["replacements", replace],
  ["smartquotes", smartquotes],
  ["text_join", text_join]
];
var ParserCore = class {
  constructor() {
    _defineProperty(
      this,
      /**
      * {@link Ruler} instance. Keep configuration of core rules.
      */
      "ruler",
      new Ruler()
    );
    _defineProperty(this, "State", StateCore);
    for (let i = 0; i < _rules$2.length; i++) this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
  }
  /**
  * Executes core chain rules.
  */
  process(state) {
    const rules = this.ruler.getRules("");
    for (let i = 0, l = rules.length; i < l; i++) rules[i](state);
  }
};
var StateBlock = class {
  constructor(src, md2, env, tokens) {
    _defineProperty(this, "bMarks", []);
    _defineProperty(this, "eMarks", []);
    _defineProperty(this, "tShift", []);
    _defineProperty(this, "sCount", []);
    _defineProperty(this, "bsCount", []);
    _defineProperty(this, "blkIndent", 0);
    _defineProperty(this, "line", 0);
    _defineProperty(this, "lineMax", 0);
    _defineProperty(this, "tight", false);
    _defineProperty(this, "listIndent", -1);
    _defineProperty(this, "parentType", "root");
    _defineProperty(this, "level", 0);
    _defineProperty(this, "Token", Token);
    this.src = src;
    this.md = md2;
    this.env = env;
    this.tokens = tokens;
    const s = this.src;
    for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
      const ch = s.charCodeAt(pos);
      if (!indent_found) {
        if (isSpace(ch)) {
          indent++;
          if (ch === 9) offset += 4 - offset % 4;
          else offset++;
          continue;
        } else indent_found = true;
      }
      if (ch === 10 || pos === len - 1) {
        if (ch !== 10) pos++;
        this.bMarks.push(start);
        this.eMarks.push(pos);
        this.tShift.push(indent);
        this.sCount.push(offset);
        this.bsCount.push(0);
        indent_found = false;
        indent = 0;
        offset = 0;
        start = pos + 1;
      }
    }
    this.bMarks.push(s.length);
    this.eMarks.push(s.length);
    this.tShift.push(0);
    this.sCount.push(0);
    this.bsCount.push(0);
    this.lineMax = this.bMarks.length - 1;
  }
  push(type, tag, nesting) {
    const token = new Token(type, tag, nesting);
    token.block = true;
    if (nesting < 0) this.level--;
    token.level = this.level;
    if (nesting > 0) this.level++;
    this.tokens.push(token);
    return token;
  }
  isEmpty(line) {
    return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
  }
  skipEmptyLines(from) {
    for (let max = this.lineMax; from < max; from++) if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) break;
    return from;
  }
  skipSpaces(pos) {
    for (let max = this.src.length; pos < max; pos++) if (!isSpace(this.src.charCodeAt(pos))) break;
    return pos;
  }
  skipSpacesBack(pos, min) {
    if (pos <= min) return pos;
    while (pos > min) if (!isSpace(this.src.charCodeAt(--pos))) return pos + 1;
    return pos;
  }
  skipChars(pos, code2) {
    for (let max = this.src.length; pos < max; pos++) if (this.src.charCodeAt(pos) !== code2) break;
    return pos;
  }
  skipCharsBack(pos, code2, min) {
    if (pos <= min) return pos;
    while (pos > min) if (code2 !== this.src.charCodeAt(--pos)) return pos + 1;
    return pos;
  }
  getLines(begin, end, indent, keepLastLF) {
    if (begin >= end) return "";
    const queue = new Array(end - begin);
    for (let i = 0, line = begin; line < end; line++, i++) {
      let lineIndent = 0;
      const lineStart = this.bMarks[line];
      let first = lineStart;
      let last;
      if (line + 1 < end || keepLastLF) last = this.eMarks[line] + 1;
      else last = this.eMarks[line];
      while (first < last && lineIndent < indent) {
        const ch = this.src.charCodeAt(first);
        if (isSpace(ch)) {
          if (ch === 9) lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
          else lineIndent++;
        } else if (first - lineStart < this.tShift[line]) lineIndent++;
        else break;
        first++;
      }
      if (lineIndent > indent) queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
      else queue[i] = this.src.slice(first, last);
    }
    return queue.join("");
  }
};
var MAX_AUTOCOMPLETED_CELLS = 65536;
function getLine(state, line) {
  const pos = state.bMarks[line] + state.tShift[line];
  const max = state.eMarks[line];
  return state.src.slice(pos, max);
}
function escapedSplit(str) {
  const result = [];
  const max = str.length;
  let pos = 0;
  let ch = str.charCodeAt(pos);
  let isEscaped = false;
  let lastPos = 0;
  let current = "";
  while (pos < max) {
    if (ch === 124) {
      if (!isEscaped) {
        result.push(current + str.substring(lastPos, pos));
        current = "";
        lastPos = pos + 1;
      } else {
        current += str.substring(lastPos, pos - 1);
        lastPos = pos;
      }
    }
    isEscaped = ch === 92;
    pos++;
    ch = str.charCodeAt(pos);
  }
  result.push(current + str.substring(lastPos));
  return result;
}
function table(state, startLine, endLine, silent) {
  if (startLine + 2 > endLine) return false;
  let nextLine = startLine + 1;
  if (state.sCount[nextLine] < state.blkIndent) return false;
  if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
  let pos = state.bMarks[nextLine] + state.tShift[nextLine];
  if (pos >= state.eMarks[nextLine]) return false;
  const firstCh = state.src.charCodeAt(pos++);
  if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) return false;
  if (pos >= state.eMarks[nextLine]) return false;
  const secondCh = state.src.charCodeAt(pos++);
  if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) return false;
  if (firstCh === 45 && isSpace(secondCh)) return false;
  while (pos < state.eMarks[nextLine]) {
    const ch = state.src.charCodeAt(pos);
    if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) return false;
    pos++;
  }
  let lineText = getLine(state, startLine + 1);
  let columns = lineText.split("|");
  const aligns = [];
  for (let i = 0; i < columns.length; i++) {
    const t = columns[i].trim();
    if (!t) {
      if (i === 0 || i === columns.length - 1) continue;
      else return false;
    }
    if (!/^:?-+:?$/.test(t)) return false;
    if (t.charCodeAt(t.length - 1) === 58) aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
    else if (t.charCodeAt(0) === 58) aligns.push("left");
    else aligns.push("");
  }
  lineText = getLine(state, startLine).trim();
  if (lineText.indexOf("|") === -1) return false;
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  columns = escapedSplit(lineText);
  if (columns.length && columns[0] === "") columns.shift();
  if (columns.length && columns[columns.length - 1] === "") columns.pop();
  const columnCount = columns.length;
  if (columnCount === 0 || columnCount !== aligns.length) return false;
  if (silent) return true;
  const oldParentType = state.parentType;
  state.parentType = "table";
  const terminatorRules = state.md.block.ruler.getRules("blockquote");
  const token_to = state.push("table_open", "table", 1);
  const tableLines = [startLine, 0];
  token_to.map = tableLines;
  const token_tho = state.push("thead_open", "thead", 1);
  token_tho.map = [startLine, startLine + 1];
  const token_htro = state.push("tr_open", "tr", 1);
  token_htro.map = [startLine, startLine + 1];
  for (let i = 0; i < columns.length; i++) {
    const token_ho = state.push("th_open", "th", 1);
    if (aligns[i]) token_ho.attrs = [["style", `text-align:${aligns[i]}`]];
    const token_il = state.push("inline", "", 0);
    token_il.content = columns[i].trim();
    token_il.children = [];
    state.push("th_close", "th", -1);
  }
  state.push("tr_close", "tr", -1);
  state.push("thead_close", "thead", -1);
  let tbodyLines;
  let autocompletedCells = 0;
  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) break;
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
      terminate = true;
      break;
    }
    if (terminate) break;
    lineText = getLine(state, nextLine).trim();
    if (!lineText) break;
    if (state.sCount[nextLine] - state.blkIndent >= 4) break;
    columns = escapedSplit(lineText);
    if (columns.length && columns[0] === "") columns.shift();
    if (columns.length && columns[columns.length - 1] === "") columns.pop();
    autocompletedCells += columnCount - columns.length;
    if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) break;
    if (nextLine === startLine + 2) {
      const token_tbo = state.push("tbody_open", "tbody", 1);
      token_tbo.map = tbodyLines = [startLine + 2, 0];
    }
    const token_tro = state.push("tr_open", "tr", 1);
    token_tro.map = [nextLine, nextLine + 1];
    for (let i = 0; i < columnCount; i++) {
      const token_tdo = state.push("td_open", "td", 1);
      if (aligns[i]) token_tdo.attrs = [["style", `text-align:${aligns[i]}`]];
      const token_il = state.push("inline", "", 0);
      token_il.content = columns[i] ? columns[i].trim() : "";
      token_il.children = [];
      state.push("td_close", "td", -1);
    }
    state.push("tr_close", "tr", -1);
  }
  if (tbodyLines) {
    state.push("tbody_close", "tbody", -1);
    tbodyLines[1] = nextLine;
  }
  state.push("table_close", "table", -1);
  tableLines[1] = nextLine;
  state.parentType = oldParentType;
  state.line = nextLine;
  return true;
}
function code(state, startLine, endLine) {
  if (state.sCount[startLine] - state.blkIndent < 4) return false;
  let nextLine = startLine + 1;
  let last = nextLine;
  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }
    break;
  }
  state.line = last;
  const token = state.push("code_block", "code", 0);
  token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
  token.map = [startLine, state.line];
  return true;
}
function fence(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (pos + 3 > max) return false;
  const marker = state.src.charCodeAt(pos);
  if (marker !== 126 && marker !== 96) return false;
  let mem = pos;
  pos = state.skipChars(pos, marker);
  let len = pos - mem;
  if (len < 3) return false;
  const markup = state.src.slice(mem, pos);
  const params = state.src.slice(pos, max);
  if (marker === 96) {
    if (params.indexOf(String.fromCharCode(marker)) >= 0) return false;
  }
  if (silent) return true;
  let nextLine = startLine;
  let haveEndMarker = false;
  for (; ; ) {
    nextLine++;
    if (nextLine >= endLine) break;
    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    if (pos < max && state.sCount[nextLine] < state.blkIndent) break;
    if (state.src.charCodeAt(pos) !== marker) continue;
    if (state.sCount[nextLine] - state.blkIndent >= 4) continue;
    pos = state.skipChars(pos, marker);
    if (pos - mem < len) continue;
    pos = state.skipSpaces(pos);
    if (pos < max) continue;
    haveEndMarker = true;
    break;
  }
  len = state.sCount[startLine];
  state.line = nextLine + (haveEndMarker ? 1 : 0);
  const token = state.push("fence", "code", 0);
  token.info = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup = markup;
  token.map = [startLine, state.line];
  return true;
}
function blockquote(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  const oldLineMax = state.lineMax;
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (state.src.charCodeAt(pos) !== 62) return false;
  if (silent) return true;
  const oldBMarks = [];
  const oldBSCount = [];
  const oldSCount = [];
  const oldTShift = [];
  const terminatorRules = state.md.block.ruler.getRules("blockquote");
  const oldParentType = state.parentType;
  state.parentType = "blockquote";
  let lastLineEmpty = false;
  let nextLine;
  for (nextLine = startLine; nextLine < endLine; nextLine++) {
    const isOutdented = state.sCount[nextLine] < state.blkIndent;
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    if (pos >= max) break;
    if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
      let initial = state.sCount[nextLine] + 1;
      let spaceAfterMarker;
      let adjustTab;
      if (state.src.charCodeAt(pos) === 32) {
        pos++;
        initial++;
        adjustTab = false;
        spaceAfterMarker = true;
      } else if (state.src.charCodeAt(pos) === 9) {
        spaceAfterMarker = true;
        if ((state.bsCount[nextLine] + initial) % 4 === 3) {
          pos++;
          initial++;
          adjustTab = false;
        } else adjustTab = true;
      } else spaceAfterMarker = false;
      let offset = initial;
      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;
      while (pos < max) {
        const ch = state.src.charCodeAt(pos);
        if (isSpace(ch)) {
          if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
          else offset++;
        } else break;
        pos++;
      }
      lastLineEmpty = pos >= max;
      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;
      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    }
    if (lastLineEmpty) break;
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
      terminate = true;
      break;
    }
    if (terminate) {
      state.lineMax = nextLine;
      if (state.blkIndent !== 0) {
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }
      break;
    }
    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]);
    state.sCount[nextLine] = -1;
  }
  const oldIndent = state.blkIndent;
  state.blkIndent = 0;
  const token_o = state.push("blockquote_open", "blockquote", 1);
  token_o.markup = ">";
  const lines = [startLine, 0];
  token_o.map = lines;
  state.md.block.tokenize(state, startLine, nextLine);
  const token_c = state.push("blockquote_close", "blockquote", -1);
  token_c.markup = ">";
  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line;
  for (let i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }
  state.blkIndent = oldIndent;
  return true;
}
function hr(state, startLine, endLine, silent) {
  const max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const marker = state.src.charCodeAt(pos++);
  if (marker !== 42 && marker !== 45 && marker !== 95) return false;
  let cnt = 1;
  while (pos < max) {
    const ch = state.src.charCodeAt(pos++);
    if (ch !== marker && !isSpace(ch)) return false;
    if (ch === marker) cnt++;
  }
  if (cnt < 3) return false;
  if (silent) return true;
  state.line = startLine + 1;
  const token = state.push("hr", "hr", 0);
  token.map = [startLine, state.line];
  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
  return true;
}
function skipBulletListMarker(state, startLine) {
  const max = state.eMarks[startLine];
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const marker = state.src.charCodeAt(pos++);
  if (marker !== 42 && marker !== 45 && marker !== 43) return -1;
  if (pos < max) {
    if (!isSpace(state.src.charCodeAt(pos))) return -1;
  }
  return pos;
}
function skipOrderedListMarker(state, startLine) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  let pos = start;
  if (pos + 1 >= max) return -1;
  let ch = state.src.charCodeAt(pos++);
  if (ch < 48 || ch > 57) return -1;
  for (; ; ) {
    if (pos >= max) return -1;
    ch = state.src.charCodeAt(pos++);
    if (ch >= 48 && ch <= 57) {
      if (pos - start >= 10) return -1;
      continue;
    }
    if (ch === 41 || ch === 46) break;
    return -1;
  }
  if (pos < max) {
    ch = state.src.charCodeAt(pos);
    if (!isSpace(ch)) return -1;
  }
  return pos;
}
function markTightParagraphs(state, idx) {
  const level = state.level + 2;
  for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
    state.tokens[i + 2].hidden = true;
    state.tokens[i].hidden = true;
    i += 2;
  }
}
function list(state, startLine, endLine, silent) {
  let max, pos, start, token;
  let nextLine = startLine;
  let tight = true;
  if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
  if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) return false;
  let isTerminatingParagraph = false;
  if (silent && state.parentType === "paragraph") {
    if (state.sCount[nextLine] >= state.blkIndent) isTerminatingParagraph = true;
  }
  let isOrdered;
  let markerValue;
  let posAfterMarker;
  if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
    isOrdered = true;
    start = state.bMarks[nextLine] + state.tShift[nextLine];
    markerValue = Number(state.src.slice(start, posAfterMarker - 1));
    if (isTerminatingParagraph && markerValue !== 1) return false;
  } else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) isOrdered = false;
  else return false;
  if (isTerminatingParagraph) {
    if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
  }
  if (silent) return true;
  const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
  const listTokIdx = state.tokens.length;
  if (isOrdered) {
    token = state.push("ordered_list_open", "ol", 1);
    if (markerValue !== 1) token.attrs = [["start", markerValue]];
  } else token = state.push("bullet_list_open", "ul", 1);
  const listLines = [nextLine, 0];
  token.map = listLines;
  token.markup = String.fromCharCode(markerCharCode);
  let prevEmptyEnd = false;
  const terminatorRules = state.md.block.ruler.getRules("list");
  const oldParentType = state.parentType;
  state.parentType = "list";
  while (nextLine < endLine) {
    pos = posAfterMarker;
    max = state.eMarks[nextLine];
    const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
    let offset = initial;
    while (pos < max) {
      const ch = state.src.charCodeAt(pos);
      if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine]) % 4;
      else if (ch === 32) offset++;
      else break;
      pos++;
    }
    const contentStart = pos;
    let indentAfterMarker;
    if (contentStart >= max) indentAfterMarker = 1;
    else indentAfterMarker = offset - initial;
    if (indentAfterMarker > 4) indentAfterMarker = 1;
    const indent = initial + indentAfterMarker;
    token = state.push("list_item_open", "li", 1);
    token.markup = String.fromCharCode(markerCharCode);
    const itemLines = [nextLine, 0];
    token.map = itemLines;
    if (isOrdered) token.info = state.src.slice(start, posAfterMarker - 1);
    const oldTight = state.tight;
    const oldTShift = state.tShift[nextLine];
    const oldSCount = state.sCount[nextLine];
    const oldListIndent = state.listIndent;
    state.listIndent = state.blkIndent;
    state.blkIndent = indent;
    state.tight = true;
    state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
    state.sCount[nextLine] = offset;
    if (contentStart >= max && state.isEmpty(nextLine + 1)) state.line = Math.min(state.line + 2, endLine);
    else state.md.block.tokenize(state, nextLine, endLine);
    if (!state.tight || prevEmptyEnd) tight = false;
    prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
    state.blkIndent = state.listIndent;
    state.listIndent = oldListIndent;
    state.tShift[nextLine] = oldTShift;
    state.sCount[nextLine] = oldSCount;
    state.tight = oldTight;
    token = state.push("list_item_close", "li", -1);
    token.markup = String.fromCharCode(markerCharCode);
    nextLine = state.line;
    itemLines[1] = nextLine;
    if (nextLine >= endLine) break;
    if (state.sCount[nextLine] < state.blkIndent) break;
    if (state.sCount[nextLine] - state.blkIndent >= 4) break;
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
      terminate = true;
      break;
    }
    if (terminate) break;
    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);
      if (posAfterMarker < 0) break;
      start = state.bMarks[nextLine] + state.tShift[nextLine];
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);
      if (posAfterMarker < 0) break;
    }
    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) break;
  }
  if (isOrdered) token = state.push("ordered_list_close", "ol", -1);
  else token = state.push("bullet_list_close", "ul", -1);
  token.markup = String.fromCharCode(markerCharCode);
  listLines[1] = nextLine;
  state.line = nextLine;
  state.parentType = oldParentType;
  if (tight) markTightParagraphs(state, listTokIdx);
  return true;
}
var MAX_LABEL_LENGTH = 999;
function countCodePoints(str) {
  let length = str.length;
  for (let i = 0; i < str.length - 1; i++) {
    const high = str.charCodeAt(i);
    if (high < 55296 || high > 56319) continue;
    const low = str.charCodeAt(i + 1);
    if (low >= 56320 && low <= 57343) {
      length--;
      i++;
    }
  }
  return length;
}
function lineEnd(state, line) {
  return Math.min(state.eMarks[line] + 1, state.src.length);
}
function getNextLinePos(state, nextLine) {
  const endLine = state.lineMax;
  if (nextLine >= endLine || state.isEmpty(nextLine)) return -1;
  let isContinuation = false;
  if (state.sCount[nextLine] - state.blkIndent > 3) isContinuation = true;
  if (state.sCount[nextLine] < 0) isContinuation = true;
  if (!isContinuation) {
    const terminatorRules = state.md.block.ruler.getRules("reference");
    const oldParentType = state.parentType;
    state.parentType = "reference";
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
      terminate = true;
      break;
    }
    state.parentType = oldParentType;
    if (terminate) return -1;
  }
  return state.bMarks[nextLine] + state.tShift[nextLine];
}
function reference(state, startLine, _endLine, silent) {
  const src = state.src;
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let nextLine = startLine + 1;
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (src.charCodeAt(pos) !== 91) return false;
  let max = lineEnd(state, startLine);
  let rawLabel = "";
  let labelEnd = -1;
  let segmentStart = ++pos;
  while (pos < max) {
    if (rawLabel.length + pos - segmentStart > MAX_LABEL_LENGTH * 2) return false;
    let ch = src.charCodeAt(pos);
    if (ch === 91) return false;
    if (ch === 93) {
      labelEnd = pos;
      break;
    }
    if (ch === 92) ch = src.charCodeAt(++pos);
    if (ch === 10 && pos < max) {
      const nextPos = getNextLinePos(state, nextLine);
      if (nextPos < 0) return false;
      rawLabel += src.slice(segmentStart, max);
      pos = segmentStart = nextPos;
      max = lineEnd(state, nextLine++);
      continue;
    }
    pos++;
  }
  if (labelEnd < 0 || src.charCodeAt(labelEnd + 1) !== 58) return false;
  rawLabel += src.slice(segmentStart, labelEnd);
  if (rawLabel.length > MAX_LABEL_LENGTH && countCodePoints(rawLabel) > MAX_LABEL_LENGTH) return false;
  pos = labelEnd + 2;
  while (pos < max) {
    const ch = src.charCodeAt(pos);
    if (ch === 10) {
      const nextPos = getNextLinePos(state, nextLine);
      if (nextPos < 0) break;
      pos = nextPos;
      max = lineEnd(state, nextLine++);
    } else if (isSpace(ch)) pos++;
    else break;
  }
  const destRes = state.md.helpers.parseLinkDestination(src, pos, max);
  if (!destRes.ok) return false;
  const href = state.md.normalizeLink(destRes.str);
  if (!state.md.validateLink(href)) return false;
  pos = destRes.pos;
  const destEndPos = pos;
  const destEndMax = max;
  const destEndLineNo = nextLine;
  while (pos < max) {
    const ch = src.charCodeAt(pos);
    if (ch === 10) {
      const nextPos = getNextLinePos(state, nextLine);
      if (nextPos < 0) break;
      pos = nextPos;
      max = lineEnd(state, nextLine++);
    } else if (isSpace(ch)) pos++;
    else break;
  }
  const titleStart = pos;
  let titleRes = state.md.helpers.parseLinkTitle(src, pos, max);
  while (titleRes.can_continue) {
    const nextPos = getNextLinePos(state, nextLine);
    if (nextPos < 0) break;
    pos = nextPos;
    max = lineEnd(state, nextLine++);
    titleRes = state.md.helpers.parseLinkTitle(src, pos, max, titleRes);
  }
  let title;
  if (titleStart !== destEndPos && titleRes.ok) {
    title = titleRes.str;
    pos = titleRes.pos;
  } else {
    title = "";
    pos = destEndPos;
    max = destEndMax;
    nextLine = destEndLineNo;
  }
  while (pos < max) {
    if (!isSpace(src.charCodeAt(pos))) break;
    pos++;
  }
  if (pos < max && src.charCodeAt(pos) !== 10) {
    if (title) {
      title = "";
      pos = destEndPos;
      max = destEndMax;
      nextLine = destEndLineNo;
      while (pos < max) {
        if (!isSpace(src.charCodeAt(pos))) break;
        pos++;
      }
    }
  }
  if (pos < max && src.charCodeAt(pos) !== 10) return false;
  const label = normalizeReference(rawLabel);
  if (!label) return false;
  if (silent) return true;
  if (typeof state.env.references === "undefined") state.env.references = {};
  if (typeof state.env.references[label] === "undefined") state.env.references[label] = {
    title,
    href
  };
  const token = state.push("reference_definition", "", 0);
  token.map = [startLine, nextLine];
  token.hidden = true;
  const meta = /* @__PURE__ */ Object.create(null);
  meta.label = label;
  token.meta = meta;
  state.line = nextLine;
  return true;
}
var html_blocks_default = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
];
var open_tag = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`;
var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
new RegExp(`^(?:${open_tag}|${close_tag}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
var HTML_OPEN_CLOSE_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag})`);
var HTML_SEQUENCES = [
  [
    /^<(script|pre|style|textarea)(?=(\s|>|$))/i,
    /<\/(script|pre|style|textarea)>/i,
    true
  ],
  [
    /^<!--/,
    /-->/,
    true
  ],
  [
    /^<\?/,
    /\?>/,
    true
  ],
  [
    /^<![A-Za-z]/,
    />/,
    true
  ],
  [
    /^<!\[CDATA\[/,
    /\]\]>/,
    true
  ],
  [
    new RegExp(`^</?(${html_blocks_default.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    true
  ],
  [
    new RegExp(`${HTML_OPEN_CLOSE_TAG_RE.source}\\s*$`),
    /^$/,
    false
  ]
];
function html_block(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (!state.md.options.html) return false;
  if (state.src.charCodeAt(pos) !== 60) return false;
  let lineText = state.src.slice(pos, max);
  let i = 0;
  for (; i < HTML_SEQUENCES.length; i++) if (HTML_SEQUENCES[i][0].test(lineText)) break;
  if (i === HTML_SEQUENCES.length) return false;
  if (silent) return HTML_SEQUENCES[i][2];
  let nextLine = startLine + 1;
  const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
  if (!HTML_SEQUENCES[i][1].test(lineText)) for (; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) {
      if (endsOnBlankLine || !state.isEmpty(nextLine)) break;
    }
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    lineText = state.src.slice(pos, max);
    if (HTML_SEQUENCES[i][1].test(lineText)) {
      if (lineText.length !== 0) nextLine++;
      break;
    }
  }
  state.line = nextLine;
  const token = state.push("html_block", "", 0);
  token.map = [startLine, nextLine];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
  return true;
}
function heading(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  let ch = state.src.charCodeAt(pos);
  if (ch !== 35 || pos >= max) return false;
  let level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 35 && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }
  if (level > 6 || pos < max && !isSpace(ch)) return false;
  if (silent) return true;
  max = state.skipSpacesBack(max, pos);
  const tmp = state.skipCharsBack(max, 35, pos);
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) max = tmp;
  state.line = startLine + 1;
  const token_o = state.push("heading_open", `h${level}`, 1);
  token_o.markup = "########".slice(0, level);
  token_o.map = [startLine, state.line];
  const token_i = state.push("inline", "", 0);
  token_i.content = asciiTrim(state.src.slice(pos, max));
  token_i.map = [startLine, state.line];
  token_i.children = [];
  const token_c = state.push("heading_close", `h${level}`, -1);
  token_c.markup = "########".slice(0, level);
  return true;
}
function lheading(state, startLine, endLine) {
  const terminatorRules = state.md.block.ruler.getRules("paragraph");
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const oldParentType = state.parentType;
  state.parentType = "paragraph";
  let level = 0;
  let marker;
  let nextLine = startLine + 1;
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) continue;
    if (state.sCount[nextLine] >= state.blkIndent) {
      let pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const max = state.eMarks[nextLine];
      if (pos < max) {
        marker = state.src.charCodeAt(pos);
        if (marker === 45 || marker === 61) {
          pos = state.skipChars(pos, marker);
          pos = state.skipSpaces(pos);
          if (pos >= max) {
            level = marker === 61 ? 1 : 2;
            break;
          }
        }
      }
    }
    if (state.sCount[nextLine] < 0) continue;
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
      terminate = true;
      break;
    }
    if (terminate) break;
  }
  if (!level) {
    state.parentType = oldParentType;
    return false;
  }
  const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
  state.line = nextLine + 1;
  const token_o = state.push("heading_open", `h${level}`, 1);
  token_o.markup = String.fromCharCode(marker);
  token_o.map = [startLine, state.line];
  const token_i = state.push("inline", "", 0);
  token_i.content = content;
  token_i.map = [startLine, state.line - 1];
  token_i.children = [];
  const token_c = state.push("heading_close", `h${level}`, -1);
  token_c.markup = String.fromCharCode(marker);
  state.parentType = oldParentType;
  return true;
}
function paragraph(state, startLine, endLine) {
  const terminatorRules = state.md.block.ruler.getRules("paragraph");
  const oldParentType = state.parentType;
  let nextLine = startLine + 1;
  state.parentType = "paragraph";
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    if (state.sCount[nextLine] - state.blkIndent > 3) continue;
    if (state.sCount[nextLine] < 0) continue;
    let terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
      terminate = true;
      break;
    }
    if (terminate) break;
  }
  const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
  state.line = nextLine;
  const token_o = state.push("paragraph_open", "p", 1);
  token_o.map = [startLine, state.line];
  const token_i = state.push("inline", "", 0);
  token_i.content = content;
  token_i.map = [startLine, state.line];
  token_i.children = [];
  state.push("paragraph_close", "p", -1);
  state.parentType = oldParentType;
  return true;
}
var _rules$1 = [
  [
    "table",
    table,
    ["paragraph", "reference"]
  ],
  ["code", code],
  [
    "fence",
    fence,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    blockquote,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    hr,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    list,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", reference],
  [
    "html_block",
    html_block,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    heading,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", lheading],
  ["paragraph", paragraph]
];
var ParserBlock = class {
  constructor() {
    _defineProperty(
      this,
      /**
      * {@link Ruler} instance. Keep configuration of block rules.
      */
      "ruler",
      new Ruler()
    );
    _defineProperty(this, "State", StateBlock);
    for (let i = 0; i < _rules$1.length; i++) this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
  }
  tokenize(state, startLine, endLine) {
    const rules = this.ruler.getRules("");
    const len = rules.length;
    const maxNesting = state.md.options.maxNesting;
    let line = startLine;
    let hasEmptyLines = false;
    while (line < endLine) {
      state.line = line = state.skipEmptyLines(line);
      if (line >= endLine) break;
      if (state.sCount[line] < state.blkIndent) break;
      if (state.level >= maxNesting) {
        state.line = endLine;
        break;
      }
      const prevLine = state.line;
      let ok = false;
      for (let i = 0; i < len; i++) {
        ok = rules[i](state, line, endLine, false);
        if (ok) {
          if (prevLine >= state.line) throw new Error("block rule didn't increment state.line");
          break;
        }
      }
      if (!ok) throw new Error("none of the block rules matched");
      state.tight = !hasEmptyLines;
      if (state.isEmpty(state.line - 1)) hasEmptyLines = true;
      line = state.line;
      if (line < endLine && state.isEmpty(line)) {
        hasEmptyLines = true;
        line++;
        state.line = line;
      }
    }
  }
  /**
  * Process input string and push block tokens into `outTokens`
  */
  parse(src, md2, env, outTokens) {
    if (!src) return;
    const state = new this.State(src, md2, env, outTokens);
    this.tokenize(state, state.line, state.lineMax);
  }
};
var StateInline = class {
  constructor(src, md2, env, outTokens) {
    _defineProperty(this, "pos", 0);
    _defineProperty(this, "level", 0);
    _defineProperty(this, "pending", "");
    _defineProperty(this, "pendingLevel", 0);
    _defineProperty(this, "cache", {});
    _defineProperty(this, "backticks", {});
    _defineProperty(this, "backticksScanned", false);
    _defineProperty(this, "skipHtmlSpecial", false);
    _defineProperty(this, "linkLevel", 0);
    _defineProperty(this, "delimiters", []);
    _defineProperty(this, "_prev_delimiters", []);
    _defineProperty(this, "Token", Token);
    this.src = src;
    this.env = env;
    this.md = md2;
    this.tokens = outTokens;
    this.tokens_meta = Array(outTokens.length);
    this.posMax = this.src.length;
  }
  pushPending() {
    const token = new Token("text", "", 0);
    token.content = this.pending;
    token.level = this.pendingLevel;
    this.tokens.push(token);
    this.pending = "";
    return token;
  }
  push(type, tag, nesting) {
    if (this.pending) this.pushPending();
    const token = new Token(type, tag, nesting);
    let token_meta = void 0;
    if (nesting < 0) {
      this.level--;
      this.delimiters = this._prev_delimiters.pop();
    }
    token.level = this.level;
    if (nesting > 0) {
      this.level++;
      this._prev_delimiters.push(this.delimiters);
      this.delimiters = [];
      token_meta = { delimiters: this.delimiters };
    }
    this.pendingLevel = this.level;
    this.tokens.push(token);
    this.tokens_meta.push(token_meta);
    return token;
  }
  scanDelims(start, canSplitWord) {
    const max = this.posMax;
    const marker = this.src.charCodeAt(start);
    let lastChar;
    if (start === 0) lastChar = 32;
    else if (start === 1) {
      lastChar = this.src.charCodeAt(0);
      if ((lastChar & 63488) === 55296) lastChar = 65533;
    } else {
      lastChar = this.src.charCodeAt(start - 1);
      if ((lastChar & 64512) === 56320) {
        const highSurr = this.src.charCodeAt(start - 2);
        lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
      } else if ((lastChar & 64512) === 55296) lastChar = 65533;
    }
    let pos = start;
    while (pos < max && this.src.charCodeAt(pos) === marker) pos++;
    const count = pos - start;
    let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
    if ((nextChar & 64512) === 55296) {
      const lowSurr = this.src.charCodeAt(pos + 1);
      nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
    } else if ((nextChar & 64512) === 56320) nextChar = 65533;
    const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
    const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
    const isLastWhiteSpace = isWhiteSpace(lastChar);
    const isNextWhiteSpace = isWhiteSpace(nextChar);
    const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
    const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
    return {
      can_open: left_flanking && (canSplitWord || !right_flanking || isLastPunctChar),
      can_close: right_flanking && (canSplitWord || !left_flanking || isNextPunctChar),
      length: count
    };
  }
};
function isTerminatorChar(ch) {
  switch (ch) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return true;
    default:
      return false;
  }
}
function text(state, silent) {
  let pos = state.pos;
  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) pos++;
  if (pos === state.pos) return false;
  if (!silent) state.pending += state.src.slice(state.pos, pos);
  state.pos = pos;
  return true;
}
function isAsciiAlpha(code2) {
  return code2 >= 65 && code2 <= 90 || code2 >= 97 && code2 <= 122;
}
function isSchemeChar(code2) {
  return code2 >= 65 && code2 <= 90 || code2 >= 97 && code2 <= 122 || code2 >= 48 && code2 <= 57 || code2 === 43 || code2 === 45 || code2 === 46;
}
function linkify(state, silent) {
  if (!state.md.options.linkify) return false;
  if (state.linkLevel > 0) return false;
  const pos = state.pos;
  const max = state.posMax;
  if (pos + 3 > max) return false;
  if (state.src.charCodeAt(pos) !== 58) return false;
  if (state.src.charCodeAt(pos + 1) !== 47) return false;
  if (state.src.charCodeAt(pos + 2) !== 47) return false;
  const protoMin = pos - Math.min(10, state.pending.length, pos);
  let protoStart = pos;
  while (protoStart > protoMin && isSchemeChar(state.src.charCodeAt(protoStart - 1))) protoStart--;
  if (protoStart === pos || !isAsciiAlpha(state.src.charCodeAt(protoStart))) return false;
  const protoLength = pos - protoStart;
  const link2 = state.md.linkify.matchAtStart(state.src.slice(protoStart));
  if (!link2) return false;
  let url = link2.url;
  if (url.length <= protoLength) return false;
  let urlEnd = url.length;
  while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) urlEnd--;
  if (urlEnd !== url.length) url = url.slice(0, urlEnd);
  const fullUrl = state.md.normalizeLink(url);
  if (!state.md.validateLink(fullUrl)) return false;
  if (!silent) {
    state.pending = state.pending.slice(0, -protoLength);
    const token_o = state.push("link_open", "a", 1);
    token_o.attrs = [["href", fullUrl]];
    token_o.markup = "linkify";
    token_o.info = "auto";
    const token_t = state.push("text", "", 0);
    token_t.content = state.md.normalizeLinkText(url);
    const token_c = state.push("link_close", "a", -1);
    token_c.markup = "linkify";
    token_c.info = "auto";
  }
  state.pos += url.length - protoLength;
  return true;
}
function newline(state, silent) {
  let pos = state.pos;
  if (state.src.charCodeAt(pos) !== 10) return false;
  const pmax = state.pending.length - 1;
  const max = state.posMax;
  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
        let ws = pmax - 1;
        while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
        state.pending = state.pending.slice(0, ws);
        state.push("hardbreak", "br", 0);
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push("softbreak", "br", 0);
      }
    } else state.push("softbreak", "br", 0);
  }
  pos++;
  while (pos < max && isSpace(state.src.charCodeAt(pos))) pos++;
  state.pos = pos;
  return true;
}
var ESCAPED = [];
for (let i = 0; i < 256; i++) ESCAPED.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
  ESCAPED[ch.charCodeAt(0)] = 1;
});
function escape(state, silent) {
  let pos = state.pos;
  const max = state.posMax;
  if (state.src.charCodeAt(pos) !== 92) return false;
  pos++;
  if (pos >= max) return false;
  let ch1 = state.src.charCodeAt(pos);
  if (ch1 === 10) {
    if (!silent) state.push("hardbreak", "br", 0);
    pos++;
    while (pos < max) {
      ch1 = state.src.charCodeAt(pos);
      if (!isSpace(ch1)) break;
      pos++;
    }
    state.pos = pos;
    return true;
  }
  if (ch1 === 32) {
    if (!silent) {
      const token = state.push("text_special", "", 0);
      token.content = "\\";
      token.markup = "\\";
      token.info = "escape";
    }
    state.pos = pos;
    return true;
  }
  let escapedStr = state.src[pos];
  if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
    const ch2 = state.src.charCodeAt(pos + 1);
    if (ch2 >= 56320 && ch2 <= 57343) {
      escapedStr += state.src[pos + 1];
      pos++;
    }
  }
  const origStr = "\\" + escapedStr;
  if (!silent) {
    const token = state.push("text_special", "", 0);
    if (ch1 < 256 && ESCAPED[ch1] !== 0) token.content = escapedStr;
    else token.content = origStr;
    token.markup = origStr;
    token.info = "escape";
  }
  state.pos = pos + 1;
  return true;
}
function buildLastRuns(src) {
  const lastRuns = {};
  let pos = 0;
  while ((pos = src.indexOf("`", pos)) !== -1) {
    const start = pos;
    while (src.charCodeAt(++pos) === 96) ;
    lastRuns[pos - start] = start;
  }
  return lastRuns;
}
function backtick(state, silent) {
  var _state$backticks$open;
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 96) return false;
  const max = state.posMax;
  let pos = start + 1;
  while (pos < max && state.src.charCodeAt(pos) === 96) pos++;
  const marker = state.src.slice(start, pos);
  const openerLength = marker.length;
  if (!state.backticksScanned) {
    state.backticks = buildLastRuns(state.src);
    state.backticksScanned = true;
  }
  if (((_state$backticks$open = state.backticks[openerLength]) !== null && _state$backticks$open !== void 0 ? _state$backticks$open : -1) >= pos) {
    let matchEnd = pos;
    let matchStart;
    while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1 && matchStart < max) {
      matchEnd = matchStart + 1;
      while (state.src.charCodeAt(matchEnd) === 96) matchEnd++;
      if (matchEnd > max) break;
      if (matchEnd - matchStart === openerLength) {
        if (!silent) {
          const token = state.push("code_inline", "code", 0);
          token.markup = marker;
          let content = state.src.slice(pos, matchStart).replace(/\n/g, " ");
          if (content.startsWith(" ") && content.endsWith(" ") && /[^ ]/.test(content)) content = content.slice(1, -1);
          token.content = content;
        }
        state.pos = matchEnd;
        return true;
      }
    }
  }
  if (!silent) state.pending += marker;
  state.pos = pos;
  return true;
}
function strikethrough_tokenize(state, silent) {
  const start = state.pos;
  const marker = state.src.charCodeAt(start);
  if (silent) return false;
  if (marker !== 126) return false;
  const scanned = state.scanDelims(state.pos, true);
  let len = scanned.length;
  const ch = String.fromCharCode(marker);
  if (len < 2) return false;
  let token;
  if (len % 2) {
    token = state.push("text", "", 0);
    token.content = ch;
    len--;
  }
  for (let i = 0; i < len; i += 2) {
    token = state.push("text", "", 0);
    token.content = ch + ch;
    state.delimiters.push({
      marker,
      length: 0,
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close
    });
  }
  state.pos += scanned.length;
  return true;
}
function postProcess$1(state, delimiters) {
  let token;
  const loneMarkers = [];
  const max = delimiters.length;
  for (let i = 0; i < max; i++) {
    const startDelim = delimiters[i];
    if (startDelim.marker !== 126) continue;
    if (startDelim.end === -1) continue;
    const endDelim = delimiters[startDelim.end];
    token = state.tokens[startDelim.token];
    token.type = "s_open";
    token.tag = "s";
    token.nesting = 1;
    token.markup = "~~";
    token.content = "";
    token = state.tokens[endDelim.token];
    token.type = "s_close";
    token.tag = "s";
    token.nesting = -1;
    token.markup = "~~";
    token.content = "";
    if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") loneMarkers.push(endDelim.token - 1);
  }
  while (loneMarkers.length) {
    const i = loneMarkers.pop();
    let j = i + 1;
    while (j < state.tokens.length && state.tokens[j].type === "s_close") j++;
    j--;
    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
}
function strikethrough_postProcess(state) {
  const tokens_meta = state.tokens_meta;
  const max = state.tokens_meta.length;
  postProcess$1(state, state.delimiters);
  for (let curr = 0; curr < max; curr++) {
    var _tokens_meta$curr;
    const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
    if (delimiters) postProcess$1(state, delimiters);
  }
}
var strikethrough_default = {
  tokenize: strikethrough_tokenize,
  postProcess: strikethrough_postProcess
};
function emphasis_tokenize(state, silent) {
  const start = state.pos;
  const marker = state.src.charCodeAt(start);
  if (silent) return false;
  if (marker !== 95 && marker !== 42) return false;
  const scanned = state.scanDelims(state.pos, marker === 42);
  for (let i = 0; i < scanned.length; i++) {
    const token = state.push("text", "", 0);
    token.content = String.fromCharCode(marker);
    state.delimiters.push({
      marker,
      length: scanned.length,
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close
    });
  }
  state.pos += scanned.length;
  return true;
}
function postProcess(state, delimiters) {
  const max = delimiters.length;
  for (let i = max - 1; i >= 0; i--) {
    const startDelim = delimiters[i];
    if (startDelim.marker !== 95 && startDelim.marker !== 42) continue;
    if (startDelim.end === -1) continue;
    const endDelim = delimiters[startDelim.end];
    const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1;
    const ch = String.fromCharCode(startDelim.marker);
    const token_o = state.tokens[startDelim.token];
    token_o.type = isStrong ? "strong_open" : "em_open";
    token_o.tag = isStrong ? "strong" : "em";
    token_o.nesting = 1;
    token_o.markup = isStrong ? ch + ch : ch;
    token_o.content = "";
    const token_c = state.tokens[endDelim.token];
    token_c.type = isStrong ? "strong_close" : "em_close";
    token_c.tag = isStrong ? "strong" : "em";
    token_c.nesting = -1;
    token_c.markup = isStrong ? ch + ch : ch;
    token_c.content = "";
    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = "";
      state.tokens[delimiters[startDelim.end + 1].token].content = "";
      i--;
    }
  }
}
function emphasis_post_process(state) {
  const tokens_meta = state.tokens_meta;
  const max = state.tokens_meta.length;
  postProcess(state, state.delimiters);
  for (let curr = 0; curr < max; curr++) {
    var _tokens_meta$curr;
    const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
    if (delimiters) postProcess(state, delimiters);
  }
}
var emphasis_default = {
  tokenize: emphasis_tokenize,
  postProcess: emphasis_post_process
};
function link(state, silent) {
  let code2, label, res, ref;
  let href = "";
  let title = "";
  let start = state.pos;
  let parseReference = true;
  if (state.src.charCodeAt(state.pos) !== 91) return false;
  const oldPos = state.pos;
  const max = state.posMax;
  const labelStart = state.pos + 1;
  const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
  if (labelEnd < 0) return false;
  let pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 40) {
    parseReference = false;
    pos++;
    for (; pos < max; pos++) {
      code2 = state.src.charCodeAt(pos);
      if (!isSpace(code2) && code2 !== 10) break;
    }
    if (pos >= max) return false;
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) pos = res.pos;
      else href = "";
      start = pos;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) break;
      }
      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) break;
        }
      }
    }
    if (pos >= max || state.src.charCodeAt(pos) !== 41) parseReference = true;
    pos++;
  }
  if (parseReference) {
    if (typeof state.env.references === "undefined") return false;
    if (pos < max && state.src.charCodeAt(pos) === 91) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) label = state.src.slice(start, pos++);
      else pos = labelEnd + 1;
    } else pos = labelEnd + 1;
    if (!label) label = state.src.slice(labelStart, labelEnd);
    label = normalizeReference(label);
    ref = state.env.references[label];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }
  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;
    const token_o = state.push("link_open", "a", 1);
    const attrs = [["href", href]];
    token_o.attrs = attrs;
    if (title) attrs.push(["title", title]);
    if (label) {
      const meta = /* @__PURE__ */ Object.create(null);
      meta.label = label;
      token_o.meta = meta;
    }
    state.linkLevel++;
    state.md.inline.tokenize(state);
    state.linkLevel--;
    state.push("link_close", "a", -1);
  }
  state.pos = pos;
  state.posMax = max;
  return true;
}
function image(state, silent) {
  let code2, content, label, pos, ref, res, title, start;
  let href = "";
  const oldPos = state.pos;
  const max = state.posMax;
  if (state.src.charCodeAt(state.pos) !== 33) return false;
  if (state.src.charCodeAt(state.pos + 1) !== 91) return false;
  const labelStart = state.pos + 2;
  const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
  if (labelEnd < 0) return false;
  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 40) {
    pos++;
    for (; pos < max; pos++) {
      code2 = state.src.charCodeAt(pos);
      if (!isSpace(code2) && code2 !== 10) break;
    }
    if (pos >= max) return false;
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) pos = res.pos;
      else href = "";
    }
    start = pos;
    for (; pos < max; pos++) {
      code2 = state.src.charCodeAt(pos);
      if (!isSpace(code2) && code2 !== 10) break;
    }
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) break;
      }
    } else title = "";
    if (pos >= max || state.src.charCodeAt(pos) !== 41) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    if (typeof state.env.references === "undefined") return false;
    if (pos < max && state.src.charCodeAt(pos) === 91) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) label = state.src.slice(start, pos++);
      else pos = labelEnd + 1;
    } else pos = labelEnd + 1;
    if (!label) label = state.src.slice(labelStart, labelEnd);
    label = normalizeReference(label);
    ref = state.env.references[label];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);
    const tokens = [];
    state.md.inline.parse(content, state.md, state.env, tokens);
    const token = state.push("image", "img", 0);
    const attrs = [["src", href], ["alt", ""]];
    token.attrs = attrs;
    token.children = tokens;
    token.content = content;
    if (title) attrs.push(["title", title]);
    if (label) {
      const meta = /* @__PURE__ */ Object.create(null);
      meta.label = label;
      token.meta = meta;
    }
  }
  state.pos = pos;
  state.posMax = max;
  return true;
}
var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function autolink(state, silent) {
  let pos = state.pos;
  if (state.src.charCodeAt(pos) !== 60) return false;
  const start = state.pos;
  const max = state.posMax;
  for (; ; ) {
    if (++pos >= max) return false;
    const ch = state.src.charCodeAt(pos);
    if (ch === 60) return false;
    if (ch === 62) break;
  }
  const url = state.src.slice(start + 1, pos);
  if (AUTOLINK_RE.test(url)) {
    const fullUrl = state.md.normalizeLink(url);
    if (!state.md.validateLink(fullUrl)) return false;
    if (!silent) {
      const token_o = state.push("link_open", "a", 1);
      token_o.attrs = [["href", fullUrl]];
      token_o.markup = "autolink";
      token_o.info = "auto";
      const token_t = state.push("text", "", 0);
      token_t.content = state.md.normalizeLinkText(url);
      const token_c = state.push("link_close", "a", -1);
      token_c.markup = "autolink";
      token_c.info = "auto";
    }
    state.pos += url.length + 2;
    return true;
  }
  if (EMAIL_RE.test(url)) {
    const fullUrl = state.md.normalizeLink(`mailto:${url}`);
    if (!state.md.validateLink(fullUrl)) return false;
    if (!silent) {
      const token_o = state.push("link_open", "a", 1);
      token_o.attrs = [["href", fullUrl]];
      token_o.markup = "autolink";
      token_o.info = "auto";
      const token_t = state.push("text", "", 0);
      token_t.content = state.md.normalizeLinkText(url);
      const token_c = state.push("link_close", "a", -1);
      token_c.markup = "autolink";
      token_c.info = "auto";
    }
    state.pos += url.length + 2;
    return true;
  }
  return false;
}
function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}
function isLetter(ch) {
  const lc = ch | 32;
  return lc >= 97 && lc <= 122;
}
function scanSpecial(state, pos) {
  const src = state.src;
  let start;
  let terminator;
  if (src.startsWith("<!--", pos)) {
    if (src.startsWith(">", pos + 4)) return pos + 5;
    if (src.startsWith("->", pos + 4)) return pos + 6;
    start = pos + 4;
    terminator = "-->";
  } else if (src.startsWith("<![CDATA[", pos)) {
    start = pos + 9;
    terminator = "]]>";
  } else if (src.charCodeAt(pos + 1) === 63) {
    start = pos + 2;
    terminator = "?>";
  } else if (isLetter(src.charCodeAt(pos + 2))) {
    start = pos + 3;
    terminator = ">";
  } else return -1;
  if (state.skipHtmlSpecial) return -1;
  const end = src.indexOf(terminator, start);
  if (end < 0) {
    state.skipHtmlSpecial = true;
    return -1;
  }
  return end + terminator.length;
}
function html_inline(state, silent) {
  if (!state.md.options.html) return false;
  const max = state.posMax;
  const pos = state.pos;
  if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) return false;
  let end;
  const ch = state.src.charCodeAt(pos + 1);
  if (ch === 33 || ch === 63) end = scanSpecial(state, pos);
  else if (ch === 47 || isLetter(ch)) {
    const match = state.src.slice(pos).match(HTML_OPEN_CLOSE_TAG_RE);
    end = match ? pos + match[0].length : -1;
  } else return false;
  if (end < 0) return false;
  if (!silent) {
    const token = state.push("html_inline", "", 0);
    token.content = state.src.slice(pos, end);
    if (isLinkOpen(token.content)) state.linkLevel++;
    if (isLinkClose(token.content)) state.linkLevel--;
  }
  state.pos = end;
  return true;
}
var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
function entity(state, silent) {
  const pos = state.pos;
  const max = state.posMax;
  if (state.src.charCodeAt(pos) !== 38) return false;
  if (pos + 1 >= max) return false;
  if (state.src.charCodeAt(pos + 1) === 35) {
    const match = state.src.slice(pos).match(DIGITAL_RE);
    if (match) {
      if (!silent) {
        const code2 = match[1][0].toLowerCase() === "x" ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
        const token = state.push("text_special", "", 0);
        token.content = isValidEntityCode(code2) ? fromCodePoint(code2) : fromCodePoint(65533);
        token.markup = match[0];
        token.info = "entity";
      }
      state.pos += match[0].length;
      return true;
    }
  } else {
    const match = state.src.slice(pos).match(NAMED_RE);
    if (match) {
      const decoded = decodeHTMLStrict(match[0]);
      if (decoded !== match[0]) {
        if (!silent) {
          const token = state.push("text_special", "", 0);
          token.content = decoded;
          token.markup = match[0];
          token.info = "entity";
        }
        state.pos += match[0].length;
        return true;
      }
    }
  }
  return false;
}
function processDelimiters(delimiters) {
  const openersBottom = {};
  const max = delimiters.length;
  if (!max) return;
  let headerIdx = 0;
  let lastTokenIdx = -2;
  const jumps = [];
  for (let closerIdx = 0; closerIdx < max; closerIdx++) {
    const closer = delimiters[closerIdx];
    jumps.push(0);
    if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) headerIdx = closerIdx;
    lastTokenIdx = closer.token;
    closer.length = closer.length || 0;
    if (!closer.close) continue;
    if (!openersBottom.hasOwnProperty(closer.marker)) openersBottom[closer.marker] = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1
    ];
    const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
    let openerIdx = headerIdx - jumps[headerIdx] - 1;
    let newMinOpenerIdx = openerIdx;
    for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
      const opener = delimiters[openerIdx];
      if (opener.marker !== closer.marker) continue;
      if (opener.open && opener.end < 0) {
        let isOddMatch = false;
        if (opener.close || closer.open) {
          if ((opener.length + closer.length) % 3 === 0) {
            if (opener.length % 3 !== 0 || closer.length % 3 !== 0) isOddMatch = true;
          }
        }
        if (!isOddMatch) {
          const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
          jumps[closerIdx] = closerIdx - openerIdx + lastJump;
          jumps[openerIdx] = lastJump;
          closer.open = false;
          opener.end = closerIdx;
          opener.close = false;
          newMinOpenerIdx = -1;
          lastTokenIdx = -2;
          break;
        }
      }
    }
    if (newMinOpenerIdx !== -1) openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
  }
}
function link_pairs(state) {
  const tokens_meta = state.tokens_meta;
  const max = state.tokens_meta.length;
  processDelimiters(state.delimiters);
  for (let curr = 0; curr < max; curr++) {
    var _tokens_meta$curr;
    const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
    if (delimiters) processDelimiters(delimiters);
  }
}
function fragments_join(state) {
  let curr, last;
  let level = 0;
  const tokens = state.tokens;
  const max = state.tokens.length;
  for (curr = last = 0; curr < max; curr++) {
    if (tokens[curr].nesting < 0) level--;
    tokens[curr].level = level;
    if (tokens[curr].nesting > 0) level++;
    if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    else {
      if (curr !== last) tokens[last] = tokens[curr];
      last++;
    }
  }
  if (curr !== last) tokens.length = last;
}
var _rules = [
  ["text", text],
  ["linkify", linkify],
  ["newline", newline],
  ["escape", escape],
  ["backticks", backtick],
  ["strikethrough", strikethrough_default.tokenize],
  ["emphasis", emphasis_default.tokenize],
  ["link", link],
  ["image", image],
  ["autolink", autolink],
  ["html_inline", html_inline],
  ["entity", entity]
];
var _rules2 = [
  ["balance_pairs", link_pairs],
  ["strikethrough", strikethrough_default.postProcess],
  ["emphasis", emphasis_default.postProcess],
  ["fragments_join", fragments_join]
];
var ParserInline = class {
  constructor() {
    _defineProperty(
      this,
      /**
      * {@link Ruler} instance. Keep configuration of inline rules.
      */
      "ruler",
      new Ruler()
    );
    _defineProperty(
      this,
      /**
      * {@link Ruler} instance. Second ruler used for post-processing
      * (e.g. in emphasis-like rules).
      */
      "ruler2",
      new Ruler()
    );
    _defineProperty(this, "State", StateInline);
    for (let i = 0; i < _rules.length; i++) this.ruler.push(_rules[i][0], _rules[i][1]);
    for (let i = 0; i < _rules2.length; i++) this.ruler2.push(_rules2[i][0], _rules2[i][1]);
  }
  skipToken(state) {
    const pos = state.pos;
    const rules = this.ruler.getRules("");
    const len = rules.length;
    const maxNesting = state.md.options.maxNesting;
    const cache = state.cache;
    if (typeof cache[pos] !== "undefined") {
      state.pos = cache[pos];
      return;
    }
    let ok = false;
    if (state.level < maxNesting) for (let i = 0; i < len; i++) {
      state.level++;
      ok = rules[i](state, true);
      state.level--;
      if (ok) {
        if (pos >= state.pos) throw new Error("inline rule didn't increment state.pos");
        break;
      }
    }
    else state.pos = state.posMax;
    if (!ok) state.pos++;
    cache[pos] = state.pos;
  }
  tokenize(state) {
    const rules = this.ruler.getRules("");
    const len = rules.length;
    const end = state.posMax;
    const maxNesting = state.md.options.maxNesting;
    while (state.pos < end) {
      const prevPos = state.pos;
      let ok = false;
      if (state.level < maxNesting) for (let i = 0; i < len; i++) {
        ok = rules[i](state, false);
        if (ok) {
          if (prevPos >= state.pos) throw new Error("inline rule didn't increment state.pos");
          break;
        }
      }
      if (ok) {
        if (state.pos >= end) break;
        continue;
      }
      state.pending += state.src[state.pos++];
    }
    if (state.pending) state.pushPending();
  }
  /**
  * Process input string and push inline tokens into `outTokens`
  */
  parse(str, md2, env, outTokens) {
    const state = new this.State(str, md2, env, outTokens);
    this.tokenize(state);
    const rules = this.ruler2.getRules("");
    const len = rules.length;
    for (let i = 0; i < len; i++) rules[i](state);
  }
};
var config = {
  default: {
    options: {
      html: false,
      xhtmlOut: false,
      breaks: false,
      langPrefix: "language-",
      linkify: false,
      typographer: false,
      quotes: "\u201C\u201D\u2018\u2019",
      highlight: null,
      maxNesting: 100
    },
    components: {
      core: {},
      block: {},
      inline: {}
    }
  },
  zero: {
    options: {
      html: false,
      xhtmlOut: false,
      breaks: false,
      langPrefix: "language-",
      linkify: false,
      typographer: false,
      quotes: "\u201C\u201D\u2018\u2019",
      highlight: null,
      maxNesting: 20
    },
    components: {
      core: { rules: [
        "normalize",
        "block",
        "strip_references",
        "inline",
        "text_join"
      ] },
      block: { rules: ["paragraph"] },
      inline: {
        rules: ["text"],
        rules2: ["balance_pairs", "fragments_join"]
      }
    }
  },
  commonmark: {
    options: {
      html: true,
      xhtmlOut: true,
      breaks: false,
      langPrefix: "language-",
      linkify: false,
      typographer: false,
      quotes: "\u201C\u201D\u2018\u2019",
      highlight: null,
      maxNesting: 20
    },
    components: {
      core: { rules: [
        "normalize",
        "block",
        "strip_references",
        "inline",
        "text_join"
      ] },
      block: { rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ] },
      inline: {
        rules: [
          "autolink",
          "backticks",
          "emphasis",
          "entity",
          "escape",
          "html_inline",
          "image",
          "link",
          "newline",
          "text"
        ],
        rules2: [
          "balance_pairs",
          "emphasis",
          "fragments_join"
        ]
      }
    }
  }
};
var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
var RECODE_HOSTNAME_FOR = [
  "http:",
  "https:",
  "mailto:"
];
var MarkdownIt = class {
  /**
  * Link validation function. CommonMark allows too much in links. By default
  * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
  * except some embedded image types.
  *
  * You can change this behaviour:
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * // enable everything
  * md.validateLink = function () { return true; }
  * ```
  */
  validateLink(url) {
    const str = url.trim().toLowerCase();
    return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
  }
  /**
  * Function used to encode link url to a machine-readable format,
  * which includes url-encoding, punycode, etc.
  */
  normalizeLink(url) {
    const parsed = parse_default(url, true);
    if (parsed.hostname) {
      if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
        parsed.hostname = punycode_es6_default.toASCII(parsed.hostname);
      } catch (er) {
      }
    }
    if (parsed.auth) parsed.auth = encode_default(parsed.auth);
    if (parsed.hostname) parsed.hostname = encode_default(parsed.hostname);
    if (parsed.pathname) parsed.pathname = encode_default(parsed.pathname);
    if (parsed.search) parsed.search = encode_default(parsed.search);
    if (parsed.hash) parsed.hash = encode_default(parsed.hash);
    return format2(parsed);
  }
  /**
  * Function used to decode link url to a human-readable format`
  */
  normalizeLinkText(url) {
    const parsed = parse_default(url, true);
    if (parsed.hostname) {
      if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
        parsed.hostname = punycode_es6_default.toUnicode(parsed.hostname);
      } catch (er) {
      }
    }
    return decode_default(format2(parsed), decode_default.defaultChars + "%");
  }
  constructor(...args) {
    _defineProperty(
      this,
      /**
      * Instance of {@link ParserInline}. You may need it to add new rules when
      * writing plugins. For simple rules control use {@link MarkdownIt.disable}
      * and {@link MarkdownIt.enable}.
      */
      "inline",
      new ParserInline()
    );
    _defineProperty(
      this,
      /**
      * Instance of {@link ParserBlock}. You may need it to add new rules when
      * writing plugins. For simple rules control use {@link MarkdownIt.disable}
      * and {@link MarkdownIt.enable}.
      */
      "block",
      new ParserBlock()
    );
    _defineProperty(
      this,
      /**
      * Instance of {@link ParserCore} chain executor. You may need it to add new
      * rules when writing plugins. For simple rules control use
      * {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
      */
      "core",
      new ParserCore()
    );
    _defineProperty(
      this,
      /**
      * Instance of {@link Renderer}. Use it to modify output look. Or to add rendering
      * rules for new token types, generated by plugins.
      *
      * See {@link Renderer} docs and
      * [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * function myToken(tokens, idx, options, env, self) {
      *   //...
      *   return result;
      * };
      *
      * md.renderer.rules['my_token'] = myToken
      * ```
      */
      "renderer",
      new Renderer()
    );
    _defineProperty(
      this,
      /**
      * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
      * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
      * rule.
      */
      "linkify",
      new LinkifyIt()
    );
    _defineProperty(
      this,
      /**
      * Assorted utility functions, useful to write plugins. See details
      * [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
      */
      "utils",
      utils_exports
    );
    _defineProperty(
      this,
      /**
      * Link components parser functions, useful to write plugins. See details
      * [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
      */
      "helpers",
      Object.assign({}, helpers_exports)
    );
    const [presetNameOrOptions, options] = args;
    if (typeof presetNameOrOptions === "string") {
      this.configure(presetNameOrOptions);
      if (options) this.set(options);
    } else {
      this.configure("default");
      this.set(presetNameOrOptions || {});
    }
  }
  /**
  * Set parser options (in the same format as in constructor). Probably, you
  * will never need it, but you can change options after constructor call.
  *
  * __Note:__ To achieve the best possible performance, don't modify a
  * `markdown-it` instance options on the fly. If you need multiple configurations
  * it's best to create multiple instances and initialize each with separate
  * config.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  *
  * const md = new MarkdownIt()
  *   .set({ html: true, breaks: true })
  *   .set({ typographer: true })
  * ```
  */
  set(options) {
    Object.assign(this.options, options);
    return this;
  }
  /**
  * Batch load of all options and compenent settings. This is internal method,
  * and you probably will not need it. But if you will - see available presets
  * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
  *
  * We strongly recommend to use presets instead of direct config loads. That
  * will give better compatibility with next versions.
  */
  configure(presets) {
    let p;
    if (typeof presets === "string") {
      const presetName = presets;
      p = config[presetName];
      if (!p) throw new Error(`Wrong 'markdown-it' preset "${presetName}", check name`);
    } else p = presets;
    if (!p) throw new Error("Wrong `markdown-it` preset, can't be empty");
    if (p.options) this.options = { ...p.options };
    const components = p.components;
    if (components) {
      var _components$inline;
      [
        "core",
        "block",
        "inline"
      ].forEach((name) => {
        var _components$name;
        const rules = (_components$name = components[name]) === null || _components$name === void 0 ? void 0 : _components$name.rules;
        if (rules) this[name].ruler.enableOnly(rules);
      });
      const rules2 = (_components$inline = components.inline) === null || _components$inline === void 0 ? void 0 : _components$inline.rules2;
      if (rules2) this.inline.ruler2.enableOnly(rules2);
    }
    return this;
  }
  /**
  * Enable list or rules. It will automatically find appropriate components,
  * containing rules with given names. If rule not found, and `ignoreInvalid`
  * not set - throws exception.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  *
  * const md = new MarkdownIt()
  *   .enable(['sub', 'sup'])
  *   .disable('smartquotes')
  * ```
  */
  enable(list2, ignoreInvalid = false) {
    let result = [];
    if (!Array.isArray(list2)) list2 = [list2];
    [
      "core",
      "block",
      "inline"
    ].forEach((chain) => {
      result = result.concat(this[chain].ruler.enable(list2, true));
    });
    result = result.concat(this.inline.ruler2.enable(list2, true));
    const missed = list2.filter((name) => result.indexOf(name) < 0);
    if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${missed}`);
    return this;
  }
  /**
  * The same as {@link MarkdownIt.enable}, but turn specified rules off.
  */
  disable(list2, ignoreInvalid = false) {
    let result = [];
    if (!Array.isArray(list2)) list2 = [list2];
    [
      "core",
      "block",
      "inline"
    ].forEach((chain) => {
      result = result.concat(this[chain].ruler.disable(list2, true));
    });
    result = result.concat(this.inline.ruler2.disable(list2, true));
    const missed = list2.filter((name) => result.indexOf(name) < 0);
    if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${missed}`);
    return this;
  }
  /**
  * Load specified plugin with given params into current parser instance.
  * It's just a sugar to call `plugin(md, params)` with curring.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * import iterator from 'markdown-it-for-inline'
  *
  * const md = new MarkdownIt()
  *   .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
  *     tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar')
  *   })
  * ```
  */
  use(plugin, ...params) {
    plugin.apply(plugin, [this, ...params]);
    return this;
  }
  /**
  * Parse input string and return list of block tokens (special token type
  * "inline" will contain list of inline tokens). You should not call this
  * method directly, until you write custom renderer (for example, to produce
  * AST).
  *
  * `env` is used to pass data between "distributed" rules and return additional
  * metadata like reference info, needed for the renderer. It also can be used to
  * inject data in specific cases. Usually, you will be ok to pass `{}`,
  * and then pass updated object to renderer.
  */
  parse(src, env) {
    if (typeof src !== "string") throw new Error("Input data should be a String");
    const state = new this.core.State(src, this, env);
    this.core.process(state);
    return state.tokens;
  }
  /**
  * Render markdown string into html. It does all magic for you :).
  *
  * `env` can be used to inject additional metadata (`{}` by default).
  * But you will not need it with high probability. See also comment
  * in {@link MarkdownIt.parse}.
  */
  render(src, env = {}) {
    return this.renderer.render(this.parse(src, env), this.options, env);
  }
  /**
  * The same as {@link MarkdownIt.parse} but skip all block rules. It returns
  * the block tokens list with the single `inline` element, containing parsed
  * inline tokens in `children` property. Also updates `env` object.
  */
  parseInline(src, env) {
    const state = new this.core.State(src, this, env);
    state.inlineMode = true;
    this.core.process(state);
    return state.tokens;
  }
  /**
  * Similar to {@link MarkdownIt.render} but for single paragraph content.
  * Result will NOT be wrapped into `<p>` tags.
  */
  renderInline(src, env = {}) {
    return this.renderer.render(this.parseInline(src, env), this.options, env);
  }
};
_defineProperty(MarkdownIt, "Token", Token);
_defineProperty(MarkdownIt, "Ruler", Ruler);
_defineProperty(MarkdownIt, "Renderer", Renderer);
_defineProperty(MarkdownIt, "ParserCore", ParserCore);
_defineProperty(MarkdownIt, "StateCore", StateCore);
_defineProperty(MarkdownIt, "ParserBlock", ParserBlock);
_defineProperty(MarkdownIt, "StateBlock", StateBlock);
_defineProperty(MarkdownIt, "ParserInline", ParserInline);
_defineProperty(MarkdownIt, "StateInline", StateInline);
var MarkdownItCallable = callable(MarkdownIt);

// src/segments.js
var START = /^<!-- experience:start id=([a-zA-Z0-9_-]{8,80}) -->[ \t]*\r?$/;
var END = /^<!-- experience:end -->[ \t]*\r?$/;
function* parse(source) {
  const start = bodyStart(source), out = [], ids = /* @__PURE__ */ new Set();
  let active = null, fence2 = null, comment = null, inline2 = null, math = null, brackets = 0, linkParen = 0, offset = start;
  let count = 0;
  for (let cursor = start; cursor < source.length; ) {
    const next = source.indexOf("\n", cursor), end = next < 0 ? source.length : next + 1, line = source.slice(cursor, end);
    cursor = end;
    if (++count % 200 === 0) yield;
    const value = line.replace(/\n$/, ""), f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(value);
    if (fence2) {
      if (f && f[1][0] === fence2[0] && f[1].length >= fence2.length && !f[2].trim()) fence2 = null;
      offset += line.length;
      continue;
    }
    if (!comment && !inline2 && !math && !brackets && !linkParen && f) {
      fence2 = f[1];
      offset += line.length;
      continue;
    }
    const marker = !comment && !inline2 && !math && !brackets && !linkParen;
    const open = marker && START.exec(value), close = marker && END.test(value);
    if (open) {
      if (active || ids.has(open[1])) throw Error("\u7ECF\u9A8C\u6807\u8BB0\u5D4C\u5957\u6216 ID \u91CD\u590D\uFF0C\u8BF7\u5728\u539F\u6587\u4FEE\u590D");
      ids.add(open[1]);
      active = { id: open[1], start: offset, markerEnd: offset + line.length, contentStart: offset + line.length };
    } else if (marker && active && /^<!-- experience:tags-updated/.test(value)) {
      const meta = /^<!-- experience:tags-updated at=([^ ]+) -->[ \t]*\r?$/.exec(value);
      if (offset !== active.markerEnd || active.updatedAt || !meta || !validUpdatedAt(meta[1])) throw Error("\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4\u8BB0\u5F55\u65E0\u6548\u6216\u4F4D\u7F6E\u91CD\u590D\uFF0C\u8BF7\u5728\u539F\u6587\u6838\u5BF9");
      active.updatedAt = meta[1];
      active.contentStart = offset + line.length;
    } else if (close) {
      if (!active) throw Error("\u7ECF\u9A8C\u7ED3\u675F\u6807\u8BB0\u7F3A\u5C11\u5F00\u59CB\u6807\u8BB0");
      out.push({ ...active, contentEnd: offset, end: offset + line.length });
      active = null;
    } else if (marker && /^<!-- experience:(?:start|end)/.test(value)) throw Error("\u7ECF\u9A8C\u6807\u8BB0\u683C\u5F0F\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u5728\u539F\u6587\u4FEE\u590D");
    else if (!/^(?: {4}|\t| {0,3}>)/.test(value)) {
      for (let i = 0; i < line.length; i++) {
        if (comment) {
          const end2 = line.indexOf(comment, i);
          if (end2 < 0) break;
          i = end2 + comment.length - 1;
          comment = null;
          continue;
        }
        if (line[i] === "\\") {
          i++;
          continue;
        }
        if (math) {
          if (line.startsWith(math, i)) {
            i += math.length - 1;
            math = null;
          }
          continue;
        }
        if (inline2) {
          if (line.startsWith(inline2, i) && line[i + inline2.length] !== "`") {
            i += inline2.length - 1;
            inline2 = null;
          }
          continue;
        }
        if (brackets) {
          if (line[i] === "[") brackets++;
          if (line[i] === "]") {
            brackets--;
            if (!brackets && line[i + 1] === "(") {
              linkParen = 1;
              i++;
            }
          }
          continue;
        }
        if (linkParen) {
          if (line[i] === "(") linkParen++;
          if (line[i] === ")") linkParen--;
          continue;
        }
        if (line[i] === "[") {
          brackets = 1;
          continue;
        }
        if (line.startsWith("<!--", i)) {
          comment = "-->";
          i += 3;
          continue;
        }
        if (line.startsWith("%%", i)) {
          comment = "%%";
          i++;
          continue;
        }
        if (line[i] === "$") {
          math = line[i + 1] === "$" ? "$$" : "$";
          i += math.length - 1;
          continue;
        }
        if (line[i] === "`") {
          let n = 1;
          while (line[i + n] === "`") n++;
          inline2 = "`".repeat(n);
          i += n - 1;
          continue;
        }
        if (line[i] === "<" && /^<\/?[a-z][a-z0-9-]*(?:\s|\/?>|$)/i.test(line.slice(i))) throw Error("\u6B64\u7B14\u8BB0\u5305\u542B\u539F\u59CB HTML\uFF0C\u6682\u4E0D\u81EA\u52A8\u8BC6\u522B\u6216\u4FEE\u6539\u7ECF\u9A8C\u8303\u56F4\uFF1B\u8BF7\u4F7F\u7528\u666E\u901A Markdown \u6B63\u6587\uFF08\u4EE3\u7801\u793A\u4F8B\u4E0D\u53D7\u5F71\u54CD\uFF09");
        if (i % 12e3 === 11999) yield;
      }
    }
    offset += line.length;
  }
  if (active) throw Error("\u7ECF\u9A8C\u7247\u6BB5\u6CA1\u6709\u7ED3\u675F\u6807\u8BB0\uFF0C\u8BF7\u5728\u539F\u6587\u8865\u5168");
  return out;
}
function segments(source) {
  const iterator = parse(source);
  for (; ; ) {
    const step = iterator.next();
    if (step.done) return step.value;
  }
}
async function segmentsAsync(source, valid = () => true) {
  const iterator = parse(source);
  for (; ; ) {
    if (!valid()) return null;
    const step = iterator.next();
    if (step.done) return step.value;
    await new Promise((r) => setTimeout(r, 0));
  }
}
function findSegment(source, id) {
  const found = segments(source).find((s) => s.id === id);
  if (!found) throw Error("\u539F\u7ECF\u9A8C\u7247\u6BB5\u5DF2\u5220\u9664\u6216\u6807\u8BB0\u6539\u53D8\uFF0C\u8BF7\u5237\u65B0");
  return found;
}
function fragmentText(source, id) {
  const s = findSegment(source, id);
  return source.slice(s.contentStart, s.contentEnd);
}
function tagsChanged(before, after) {
  const a = new Set(scan(before).spans.map((x) => x.tag)), b = new Set(scan(after).spans.map((x) => x.tag));
  return a.size !== b.size || [...a].some((x) => !b.has(x));
}
function prefixWithDate(source, part, at) {
  const prefix = source.slice(part.start, part.markerEnd), nl = prefix.endsWith("\r\n") ? "\r\n" : "\n";
  return prefix + updatedLine(at) + nl;
}
function editSegments(source, rows, op, at = (/* @__PURE__ */ new Date()).toISOString()) {
  const all = segments(source), edits = [];
  for (const row of rows) {
    const part = all.find((s) => s.id === row.id);
    if (!part) throw Error("\u9009\u4E2D\u7684\u7ECF\u9A8C\u7247\u6BB5\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0");
    const before = source.slice(part.contentStart, part.contentEnd), inner = patchTags(before, op, row.tags);
    if (tagsChanged(before, inner)) edits.push({ ...part, text: prefixWithDate(source, part, at) + inner });
  }
  let after = source;
  for (const part of edits.sort((a, b) => b.start - a.start)) after = after.slice(0, part.start) + part.text + after.slice(part.contentEnd);
  segments(after);
  return after;
}
function retimeTagChanges(before, after, at = (/* @__PURE__ */ new Date()).toISOString()) {
  const old = new Map(segments(before).map((p) => [p.id, p])), edits = [];
  for (const part of segments(after)) {
    const previous = old.get(part.id);
    if (!previous) throw Error("\u9884\u89C8\u7247\u6BB5\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9884\u89C8");
    const oldBody = before.slice(previous.contentStart, previous.contentEnd), newBody = after.slice(part.contentStart, part.contentEnd);
    if (oldBody === newBody) continue;
    if (tagsChanged(oldBody, newBody))
      edits.push({ ...part, text: prefixWithDate(after, part, at) });
  }
  for (const part of edits.sort((a, b) => b.start - a.start)) after = after.slice(0, part.start) + part.text + after.slice(part.contentStart);
  return after;
}
function captureEdit(source, scope, tags, at = (/* @__PURE__ */ new Date()).toISOString()) {
  const chosen = [...new Set(tags.map(normalizeTag))];
  if (!chosen.length) throw Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u6807\u7B7E");
  const nl = source.includes("\r\n") ? "\r\n" : "\n";
  const inner = patchTags(scope.text, { add: chosen });
  if (scope.existing) {
    if (!tagsChanged(scope.text, inner)) return { from: scope.from, to: scope.to, text: scope.text };
    const part = findSegment(source, scope.id);
    if (part.contentStart !== scope.from || part.contentEnd !== scope.to || source.slice(scope.from, scope.to) !== scope.text) throw Error("\u7247\u6BB5\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00");
    return { from: part.start, to: part.contentEnd, text: prefixWithDate(source, part, at) + inner };
  }
  const prefix = scope.from > 0 && source[scope.from - 1] !== "\n" ? nl : "";
  const suffix = scope.to < source.length && source[scope.to] !== "\n" ? nl : "";
  return { from: scope.from, to: scope.to, text: prefix + `<!-- experience:start id=${scope.id} -->` + nl + updatedLine(at) + nl + inner + (inner.endsWith("\n") ? "" : nl) + "<!-- experience:end -->" + suffix };
}

// src/capture-blocks.js
var md = new MarkdownItCallable({ html: true, linkify: false, typographer: false });
md.block.ruler.before("fence", "obsidian-delimiter", (state, start, end, silent) => {
  const line = state.src.slice(state.bMarks[start] + state.tShift[start], state.eMarks[start]);
  if (!/^(\$\$|%%)\s*$/.test(line)) return false;
  const delimiter2 = line.trim();
  let last = start + 1;
  while (last < end && state.src.slice(state.bMarks[last] + state.tShift[last], state.eMarks[last]).trim() !== delimiter2) last++;
  if (last === end) throw Error("\u6570\u5B66\u5757\u6216\u6CE8\u91CA\u5757\u5C1A\u672A\u95ED\u5408\uFF0C\u8BF7\u5148\u8865\u5168");
  if (silent) return true;
  const token = state.push("obsidian_block", "", 0);
  token.map = [start, last + 1];
  token.block = true;
  state.line = last + 1;
  return true;
}, { alt: ["paragraph", "reference", "blockquote", "list"] });
function captureBlocks(source, from, to, id) {
  const parsed = scan(source);
  const parts = segments(source), inside = parts.find((s) => from >= s.contentStart && to <= s.contentEnd);
  if (inside) return { existing: true, id: inside.id, from: inside.contentStart, to: inside.contentEnd, text: source.slice(inside.contentStart, inside.contentEnd) };
  if (from === to) throw Error("\u8BF7\u5148\u9009\u4E2D\u8981\u6536\u5F55\u7684\u7ECF\u9A8C\u7247\u6BB5\uFF0C\u518D\u6253\u5F00\u6807\u7B7E\u5F39\u7A97");
  const start = bodyStart(source);
  if (from < start || from < 0 || to > source.length || from > to) throw Error("\u8BF7\u53EA\u9009\u62E9\u6B63\u6587\uFF0C\u4E0D\u80FD\u5305\u542B\u7B14\u8BB0\u5C5E\u6027");
  if (parts.some((s) => from < s.end && to > s.start)) throw Error("\u9009\u533A\u8DE8\u8D8A\u5DF2\u6709\u7ECF\u9A8C\u6807\u8BB0\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
  if (/^ {0,3}\[\^[^\]\r\n]+\]:/m.test(source.slice(start))) throw Error("\u6B64\u7B14\u8BB0\u542B\u811A\u6CE8\u5B9A\u4E49\uFF0C\u6682\u4E0D\u80FD\u5B89\u5168\u81EA\u52A8\u8865\u9F50\u5757\uFF1B\u8BF7\u5728\u4E0D\u542B\u811A\u6CE8\u5B9A\u4E49\u7684\u7B14\u8BB0\u6536\u5F55\uFF0C\u5DF2\u6709\u7ECF\u9A8C\u7247\u6BB5\u4ECD\u53EF\u52A0\u6807\u7B7E");
  const body = source.slice(start), offsets = [start];
  for (let i = 0; i < body.length; i++) if (body[i] === "\n") offsets.push(start + i + 1);
  const offset = (n) => offsets[n] ?? source.length;
  const tokens = md.parse(body, {}), blocks = [];
  for (const token of tokens) if (token.level === 0 && token.map) {
    const a2 = offset(token.map[0]), b2 = offset(token.map[1]);
    blocks.push({ from: a2, to: b2, type: token.type });
  }
  for (let i = 1; i < blocks.length; i++) if (/^\s*\^[\w-]+\s*$/.test(source.slice(blocks[i].from, blocks[i].to))) {
    blocks[i - 1].to = blocks[i].to;
    blocks.splice(i--, 1);
  }
  const touched = blocks.filter((b2) => b2.from < to && b2.to > from);
  if (!touched.length) throw Error("\u9009\u533A\u6CA1\u6709\u5B8C\u6574\u6B63\u6587\u5757\uFF0C\u8BF7\u9009\u62E9\u8981\u6536\u5F55\u7684\u6587\u5B57");
  const a = touched[0].from, b = touched.at(-1).to;
  if (a > from && source.slice(from, a).trim() || b < to && source.slice(b, to).trim()) throw Error("\u9009\u533A\u5305\u542B\u65E0\u6CD5\u5B89\u5168\u754C\u5B9A\u7684\u5F15\u7528\u5B9A\u4E49\u7B49\u5185\u5BB9\uFF0C\u8BF7\u53EA\u9009\u62E9\u5B8C\u6574\u6B63\u6587\u5757");
  if (a > start && parsed.mask[a] && parsed.mask[a - 1] || b < source.length && parsed.mask[b] && parsed.mask[b - 1]) throw Error("\u5757\u8FB9\u754C\u4F4D\u4E8E\u53D7\u4FDD\u62A4\u7684\u4EE3\u7801\u3001\u6CE8\u91CA\u6216\u516C\u5F0F\u5185\u90E8\uFF0C\u8BF7\u9009\u62E9\u5B8C\u6574\u7ED3\u6784");
  if (parts.some((s) => a < s.end && b > s.start)) throw Error("\u8865\u9F50\u540E\u7684\u5757\u5305\u542B\u5DF2\u6709\u7ECF\u9A8C\u6807\u8BB0\uFF0C\u8BF7\u53EA\u5728\u539F\u7247\u6BB5\u5185\u6DFB\u52A0\u6807\u7B7E");
  const text2 = source.slice(a, b);
  scan(text2);
  const list2 = touched.some((x) => /list_open$/.test(x.type));
  return {
    existing: false,
    id,
    from: a,
    to: b,
    text: text2,
    blockAligned: true,
    expanded: a !== from || b !== to,
    explanation: list2 ? "\u4E3A\u4FDD\u6301\u5217\u8868\u7ED3\u6784\uFF0C\u6536\u5F55\u5B8C\u6574\u5916\u5C42\u5217\u8868\uFF08\u542B\u5B50\u9879\uFF09\u3002" : a !== from || b !== to ? "\u5DF2\u6309\u5757\u8865\u9F50\u9009\u533A\uFF0C\u6807\u7B7E\u653E\u5728\u6700\u540E\u4E00\u4E2A\u5B8C\u6574\u5757\u4E4B\u540E\u3002" : "\u6536\u5F55\u5B8C\u6574\u5757\uFF0C\u6807\u7B7E\u653E\u5728\u5757\u4E4B\u540E\u3002"
  };
}
function captureBlockEdit(source, scope, tags, at = (/* @__PURE__ */ new Date()).toISOString()) {
  if (scope.existing) return captureEdit(source, scope, tags, at);
  const chosen = [...new Set(tags.map(normalizeTag))];
  if (!chosen.length) throw Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u6807\u7B7E");
  const nl = source.includes("\r\n") ? "\r\n" : "\n";
  const end = scope.text.endsWith(nl + nl) ? "" : scope.text.endsWith(nl) ? nl : nl + nl;
  const inner = patchTags(scope.text + end, { add: chosen });
  const before = source.slice(0, scope.from), after = source.slice(scope.to);
  const prefix = !before || before === "\uFEFF" || before.endsWith(nl + nl) ? "" : before.endsWith(nl) ? nl : nl + nl;
  const suffix = !after || after.startsWith(nl) ? nl : nl + nl;
  const text2 = prefix + `<!-- experience:start id=${scope.id} -->` + nl + updatedLine(at) + nl + nl + inner + (inner.endsWith(nl + nl) ? "" : nl) + "<!-- experience:end -->" + suffix;
  const result = before + text2 + after;
  scan(result);
  const found = segments(result).find((s) => s.id === scope.id);
  if (!found || !result.slice(found.contentStart, found.contentEnd).includes(scope.text)) throw Error("\u65E0\u6CD5\u5B89\u5168\u4FDD\u7559\u5B8C\u6574\u5757\uFF0C\u672A\u4FEE\u6539\u539F\u6587");
  return { from: scope.from, to: scope.to, text: text2 };
}

// src/tag-spans.js
function experienceTagSpans(raw, nativeTags = []) {
  return (nativeTags || []).map((item) => {
    const start = item.position?.start?.offset, tag = item.tag;
    if (!Number.isInteger(start) || start < 0 || typeof tag !== "string" || raw.slice(start, start + tag.length) !== tag || item.position?.end?.offset !== void 0 && item.position.end.offset !== start + tag.length) return item;
    if (!/[,，、]/.test(raw[start + tag.length] || "")) return item;
    const match = /^#[\p{L}\p{M}\p{N}_/-]+(?:[,，、][\p{L}\p{M}\p{N}_/-]+)*/u.exec(raw.slice(start));
    if (!match || match[0].length <= tag.length || !/[,，、]/.test(match[0])) return item;
    try {
      normalizeTag(match[0]);
    } catch {
      return item;
    }
    return { ...item, tag: match[0], position: {
      ...item.position,
      end: { ...item.position?.end, offset: start + match[0].length }
    } };
  });
}

// src/tag-tree.js
function tagTree(rows) {
  const counts = /* @__PURE__ */ new Map();
  for (const row of rows) for (const tag of new Set(row.tags)) counts.set(tag, (counts.get(tag) || 0) + 1);
  const root = { path: "", label: "\u5168\u90E8\u7ECF\u9A8C\u6807\u7B7E", children: /* @__PURE__ */ new Map(), total: 0 }, nodes = /* @__PURE__ */ new Map([["", root]]);
  for (const [tag, count] of [...counts].sort(([a], [b]) => a.localeCompare(b))) {
    let node = root, path = "";
    node.total++;
    for (const label of tag.slice(1).split("/")) {
      path = path ? path + "/" + label : label;
      if (!nodes.has(path)) {
        const child = { path, label, children: /* @__PURE__ */ new Map(), total: 0 };
        nodes.set(path, child);
        node.children.set(path, child);
      }
      node = nodes.get(path);
      node.total++;
    }
    node.tag = tag;
    node.count = count;
  }
  return { root, nodes, tags: [...counts.keys()].sort((a, b) => a.localeCompare(b)) };
}

// src/display.js
function previewText(raw, row, nativeTags, limit = 1400, tagLimit = 20) {
  const stop = Math.min(row.end, row.start + limit);
  const original = raw.slice(row.start, stop);
  const shown = new Set(row.tags.slice(0, tagLimit));
  const spans = [];
  for (const item of nativeTags || []) {
    const start = item.position?.start?.offset, tag = item.tag;
    if (!shown.has(tag) || !Number.isInteger(start) || start < row.start || start >= stop) continue;
    const end = start + tag.length;
    if (end > row.end || raw.slice(start, end) !== tag) continue;
    const nativeEnd = item.position?.end?.offset;
    if (nativeEnd !== void 0 && nativeEnd !== end) continue;
    spans.push({ start: start - row.start, end: Math.min(end, stop) - row.start });
  }
  spans.sort((a, b) => a.start - b.start);
  for (let i = 1; i < spans.length; i++) if (spans[i].start < spans[i - 1].end) return original;
  if (!spans.length) return original;
  let offset = 0, cursor = 0, result = "";
  for (const line of original.split(/(?<=\n)/)) {
    const end = offset + line.length;
    let text2 = "", at = offset, changed = false;
    while (cursor < spans.length && spans[cursor].start < end) {
      const span = spans[cursor++];
      text2 += original.slice(at, span.start);
      at = span.end;
      changed = true;
    }
    text2 += original.slice(at, end);
    if (!changed || text2.trim()) result += text2;
    offset = end;
  }
  return result;
}

// src/index.js
var pause = () => new Promise((r) => setTimeout(r, 0));
var Index = class {
  constructor(app, owner, emit, storage) {
    Object.assign(this, { app, owner, emit, storage });
    this.rows = /* @__PURE__ */ new Map();
    this.files = /* @__PURE__ */ new Map();
    this.nativeTags = /* @__PURE__ */ new Map();
    this.pending = /* @__PURE__ */ new Set();
    this.queue = /* @__PURE__ */ new Map();
    this.errors = /* @__PURE__ */ new Map();
    this.unbounded = /* @__PURE__ */ new Set();
    this.listeners = /* @__PURE__ */ new Set();
    this.cache = /* @__PURE__ */ new Map();
    this.bytes = 0;
    this.running = 0;
    this.waiters = [];
    this.scanning = 0;
    this.active = false;
    this.alive = true;
    this.started = false;
    this.serial = 0;
    this.metrics = [];
    this.bodyReads = 0;
    this.derived = { version: 2, files: {} };
    this.persistQueue = Promise.resolve();
  }
  metric(kind, values) {
    if (this.owner.data.settings.diagnostics) {
      this.metrics.push({ kind, ...values });
      if (this.metrics.length > 100) this.metrics.shift();
    }
  }
  signal() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.alive) {
        this.emit();
        for (const f of this.listeners) f();
      }
    }, 250);
  }
  revision(file, cache) {
    return JSON.stringify(["fragment-date-v1", file.stat.ctime, file.stat.mtime, file.stat.size, this.owner.data.settings.dateField, cache?.frontmatter?.[this.owner.data.settings.dateField], (cache?.tags || []).map((t) => [t.tag, t.position?.start?.offset])]);
  }
  catalogTree() {
    if (!this.tagCatalog) this.tagCatalog = tagTree(this.rows.values());
    return this.tagCatalog;
  }
  catalog() {
    return this.catalogTree().tags;
  }
  evict(key) {
    const v = this.cache.get(key);
    if (v) {
      this.bytes -= v.text.length * 2;
      this.cache.delete(key);
    }
  }
  clearRows(path) {
    this.tagCatalog = null;
    for (const key of this.fileKeys?.get(path) || []) {
      this.rows.delete(key);
      this.evict(key);
    }
    this.fileKeys?.delete(path);
  }
  remove(path) {
    for (const p of [...this.files.keys()]) if (p === path || p.startsWith(path + "/")) {
      this.clearRows(p);
      this.files.delete(p);
      this.nativeTags.delete(p);
      this.pending.delete(p);
      this.queue.delete(p);
      this.errors.delete(p);
      this.unbounded.delete(p);
      delete this.derived.files[p];
    }
    this.tagCatalog = null;
    this.schedulePersist();
    this.signal();
  }
  publish(file, cache, record) {
    this.clearRows(file.path);
    this.errors.delete(file.path);
    this.unbounded.delete(file.path);
    if (!record.fragments.length) this.unbounded.add(file.path);
    this.fileKeys ?? (this.fileKeys = /* @__PURE__ */ new Map());
    const keys = /* @__PURE__ */ new Set();
    this.fileKeys.set(file.path, keys);
    for (const fragment of record.fragments) {
      const key = file.path + "::" + fragment.id;
      keys.add(key);
      this.rows.set(key, { ...fragment, key, path: file.path, file, title: file.basename, noteTitle: file.basename, ...fragmentDate(fragment, file, cache, this.owner.data.settings.dateField) });
    }
  }
  update(file, force = false) {
    if (!this.alive || !file || file.extension !== "md" || this.app.vault.getAbstractFileByPath(file.path) !== file) return;
    this.epochs ?? (this.epochs = /* @__PURE__ */ new Map());
    const epoch = (this.epochs.get(file.path) || 0) + 1;
    this.epochs.set(file.path, epoch);
    this.files.set(file.path, file);
    this.clearRows(file.path);
    const cache = this.app.metadataCache.getFileCache(file);
    this.tagCatalog = null;
    if (!cache) {
      this.pending.add(file.path);
      this.queue.delete(file.path);
      this.nativeTags.delete(file.path);
      return;
    }
    this.pending.delete(file.path);
    const end = cache.frontmatterPosition?.end?.offset ?? -1, tags = (cache.tags || []).filter((t) => t.position?.start?.offset > end);
    this.nativeTags.set(file.path, [...new Set(tags.map((t) => t.tag))]);
    if (!tags.length) {
      this.queue.delete(file.path);
      delete this.derived.files[file.path];
      this.unbounded.delete(file.path);
      this.errors.delete(file.path);
      return;
    }
    const revision = this.revision(file, cache), cached = this.derived.files[file.path];
    if (!force && cached?.revision === revision && Array.isArray(cached.fragments) && cached.fragments.every((f) => typeof f.id === "string" && Array.isArray(f.tags) && f.tags.every((t) => typeof t === "string") && Number.isInteger(f.start) && Number.isInteger(f.end))) {
      this.queue.delete(file.path);
      this.publish(file, cache, cached);
      return;
    }
    delete this.derived.files[file.path];
    this.queue.set(file.path, { file, path: file.path, revision, cache, tags, epoch });
    this.drain();
  }
  start(force = false) {
    if (this.started && !force) return this.buildPromise || Promise.resolve();
    this.started = true;
    this.buildPromise = this.build(force);
    return this.buildPromise;
  }
  async build(force) {
    const generation = ++this.serial, start = Date.now();
    if (!this.restored) {
      this.restored = true;
      try {
        const value = await this.storage?.load();
        if (value?.version === 2 && value.files) this.derived = value;
      } catch {
        this.derived = { version: 2, files: {} };
      }
    }
    const files = this.app.vault.getMarkdownFiles();
    for (let i = 0; i < files.length && this.alive && generation === this.serial; i++) {
      this.update(files[i], force);
      if (i % 200 === 199) await pause();
    }
    for (const path of Object.keys(this.derived.files)) if (!this.app.vault.getAbstractFileByPath(path)) delete this.derived.files[path];
    this.metric("metadata-ready", { visited: files.length, elapsed: Date.now() - start, pending: this.pending.size, queued: this.queue.size });
    this.signal();
  }
  async resolved() {
    let n = 0;
    for (const p of [...this.pending]) {
      if (!this.alive) return;
      this.update(this.app.vault.getAbstractFileByPath(p));
      if (++n % 200 === 0) await pause();
    }
    this.signal();
  }
  activate(active = true) {
    this.active = active;
    if (active) this.drain();
  }
  drain() {
    while (this.alive && this.active && this.scanning < 2 && this.queue.size) {
      const [path, job] = this.queue.entries().next().value;
      this.queue.delete(path);
      this.scanning++;
      this.scanFile(job).catch((e) => {
        if (this.alive && this.epochs.get(path) === job.epoch) {
          this.errors.set(path, e.message);
          this.clearRows(path);
        }
      }).finally(() => {
        this.scanning--;
        this.signal();
        this.schedulePersist();
        if (this.alive) setTimeout(() => this.drain(), 0);
      });
    }
  }
  async scanFile(job) {
    const { file, path, revision, cache, tags } = job;
    if (this.app.vault.getAbstractFileByPath(path) !== file) return;
    await this.acquire();
    let raw, parts;
    try {
      if (!this.alive) return;
      if (!this.active) {
        if (this.epochs.get(path) === job.epoch) this.queue.set(path, job);
        return;
      }
      this.bodyReads++;
      raw = await this.app.vault.cachedRead(file);
      parts = await segmentsAsync(raw, () => this.alive && this.active);
    } finally {
      this.release();
    }
    if (!parts) {
      if (this.alive && this.epochs.get(path) === job.epoch) this.queue.set(path, job);
      return;
    }
    if (!this.alive || this.epochs.get(path) !== job.epoch || file.path !== path || this.app.vault.getAbstractFileByPath(path) !== file || revision !== this.revision(file, this.app.metadataCache.getFileCache(file))) return;
    const fragments = [];
    const ordered = experienceTagSpans(raw, tags).sort((a, b) => a.position.start.offset - b.position.start.offset);
    let cursor = 0;
    for (const part of parts) {
      const labels = /* @__PURE__ */ new Set();
      while (cursor < ordered.length && ordered[cursor].position.start.offset < part.contentStart) cursor++;
      while (cursor < ordered.length && ordered[cursor].position.start.offset < part.contentEnd) labels.add(ordered[cursor++].tag);
      if (labels.size) fragments.push({ id: part.id, updatedAt: part.updatedAt, markerStart: part.start, header: raw.slice(part.start, part.contentStart), start: part.contentStart, end: part.contentEnd, tags: [...labels] });
    }
    const record = { revision, fragments };
    this.derived.files[path] = record;
    this.publish(file, cache, record);
    this.metric("fragment-file", { fragments: fragments.length, bytes: file.stat.size });
  }
  schedulePersist() {
    if (!this.storage || !this.alive) return;
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persist(), 800);
  }
  persist() {
    if (!this.storage) return Promise.resolve();
    const serialized = JSON.stringify(this.derived);
    const next = this.persistQueue.catch(() => {
    }).then(() => this.storage.save(serialized));
    this.persistQueue = next;
    next.catch(() => {
      this.cacheSaveFailed = true;
      this.signal();
    });
    return next;
  }
  query(filter) {
    const t = Date.now(), rows = [...this.rows.values()].filter((r) => matches(r, { ...filter, tags: [] })), counts = /* @__PURE__ */ new Map();
    let unread = 0;
    for (const r of rows) {
      const n = this.owner.isRead(r) ? 0 : 1;
      unread += n;
      for (const tag of r.tags) counts.set(tag, (counts.get(tag) || 0) + n);
    }
    const chosen = rows.filter((r) => matches(r, filter)).sort((a, b) => (filter.asc ? 1 : -1) * (a.date.localeCompare(b.date) || (a.sortTime || 0) - (b.sortTime || 0)) || a.key.localeCompare(b.key));
    this.metric("filter", { visited: this.rows.size, result: chosen.length, elapsed: Date.now() - t });
    return { rows: chosen, counts, unread };
  }
  async readFragment(row) {
    if (this.app.vault.getAbstractFileByPath(row.path) !== row.file) throw Error("\u6765\u6E90\u5DF2\u79FB\u52A8\u6216\u5220\u9664\uFF0C\u8BF7\u5237\u65B0");
    const raw = await this.app.vault.read(row.file), parts = await segmentsAsync(raw, () => this.alive);
    const segment = parts?.find((s) => s.id === row.id);
    if (!segment) throw Error("\u539F\u7247\u6BB5\u5DF2\u53D8\u5316\u6216\u63D2\u4EF6\u5DF2\u5173\u95ED\uFF0C\u8BF7\u5237\u65B0");
    return { raw, text: raw.slice(segment.contentStart, segment.contentEnd), segment };
  }
  async copyText(row) {
    const fail = () => {
      throw Error("\u7247\u6BB5\u6216\u6807\u7B7E\u4F4D\u7F6E\u6B63\u5728\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u540E\u518D\u590D\u5236");
    };
    const current = () => this.alive && this.rows.get(row.key) === row && this.app.vault.getAbstractFileByPath(row.path) === row.file;
    const metadata = this.app.metadataCache.getFileCache(row.file);
    if (!current() || !Array.isArray(metadata?.tags)) return fail();
    const revision = this.revision(row.file, metadata);
    if (this.derived.files[row.path]?.revision !== revision) return fail();
    const result = await this.readFragment(row);
    const fresh = this.app.metadataCache.getFileCache(row.file);
    if (!current() || !Array.isArray(fresh?.tags) || this.revision(row.file, fresh) !== revision || this.derived.files[row.path]?.revision !== revision) return fail();
    const start = result.segment.contentStart, end = result.segment.contentEnd, tags = [];
    for (const item of experienceTagSpans(result.raw, fresh.tags)) {
      const offset = item.position?.start?.offset;
      if (!Number.isInteger(offset) || offset < 0) return fail();
      if (offset < start || offset >= end) continue;
      const tag = item.tag, stop = offset + (typeof tag === "string" ? tag.length : 0);
      if (typeof tag !== "string" || !tag.startsWith("#") || /\s/.test(tag) || stop > end || result.raw.slice(offset, stop) !== tag || item.position?.end?.offset !== void 0 && item.position.end.offset !== stop) return fail();
      tags.push(item);
    }
    const found = new Set(tags.map((t) => t.tag));
    if (found.size !== row.tags.length || row.tags.some((t) => !found.has(t))) return fail();
    tags.sort((a, b) => a.position.start.offset - b.position.start.offset);
    for (let i = 1; i < tags.length; i++) if (tags[i].position.start.offset < tags[i - 1].position.start.offset + tags[i - 1].tag.length) return fail();
    return previewText(result.raw, { start, end, tags: [...found] }, tags, Infinity, Infinity);
  }
  async acquire() {
    if (this.running >= 2) await new Promise((r) => this.waiters.push(r));
    else this.running++;
  }
  release() {
    const next = this.waiters.shift();
    if (next) next();
    else this.running--;
  }
  async excerpt(row, valid = () => true) {
    const revision = `${row.file.stat.mtime}:${row.file.stat.size}`, hit = this.cache.get(row.key);
    if (hit?.revision === revision) return hit.text;
    await this.acquire();
    try {
      if (!this.alive || !valid()) return "";
      this.bodyReads++;
      const raw = await this.app.vault.cachedRead(row.file);
      const markerStart = raw.lastIndexOf("\n", row.start - 2) + 1, closingEnd = raw.indexOf("\n", row.end);
      if ((row.header !== void 0 ? raw.slice(row.markerStart, row.start) !== row.header : raw.slice(markerStart, row.start).trimEnd() !== `<!-- experience:start id=${row.id} -->`) || raw.slice(row.end, closingEnd < 0 ? raw.length : closingEnd).trimEnd() !== "<!-- experience:end -->") {
        this.update(row.file, true);
        this.signal();
        return "\u7247\u6BB5\u4F4D\u7F6E\u6B63\u5728\u66F4\u65B0\u2026";
      }
      const metadata = this.app.metadataCache.getFileCache(row.file);
      const matching = this.derived.files[row.path]?.revision === this.revision(row.file, metadata);
      const text2 = matching ? previewText(raw, row, experienceTagSpans(raw, metadata?.tags)) : raw.slice(row.start, Math.min(row.end, row.start + 1400));
      if (!this.alive || !valid() || this.rows.get(row.key) !== row || revision !== `${row.file.stat.mtime}:${row.file.stat.size}`) return "";
      this.evict(row.key);
      this.cache.set(row.key, { revision, text: text2 });
      this.bytes += text2.length * 2;
      while (this.cache.size > 120 || this.bytes > 1024 * 1024) this.evict(this.cache.keys().next().value);
      return text2;
    } finally {
      this.release();
    }
  }
  stop() {
    this.active = false;
    this.alive = false;
    this.serial++;
    clearTimeout(this.timer);
    clearTimeout(this.persistTimer);
    this.listeners.clear();
    this.cache.clear();
    this.bytes = 0;
  }
};

// src/engine.js
var pause2 = () => new Promise((r) => setTimeout(r, 0));
var Owner = class {
  constructor(plugin, data = {}) {
    this.plugin = plugin;
    this.data = { version: 1, read: {}, drafts: {}, ...data, settings: { dateField: "qishiriqidate", diagnostics: false, ...data.settings } };
    this.queue = Promise.resolve();
  }
  save(update = () => {
  }, retainDrafts = false) {
    const next = this.queue.catch(() => {
    }).then(async () => {
      const value = JSON.parse(JSON.stringify(this.data));
      update(value);
      try {
        await this.plugin.saveData(value);
        this.data = value;
      } catch (error2) {
        if (retainDrafts) this.data.drafts = value.drafts;
        throw error2;
      }
    });
    this.queue = next;
    return next;
  }
  saveDraft(update) {
    return this.save(update, true);
  }
  isRead(row) {
    return this.data.read[row.key] === row.file.stat.ctime;
  }
  mark(row, read) {
    return this.save((d) => {
      if (read) d.read[row.key] = row.file.stat.ctime;
      else delete d.read[row.key];
    });
  }
  rename(oldPath, file) {
    return this.save((d) => {
      if (d.read[oldPath] === file.stat.ctime) d.read[file.path] = d.read[oldPath];
      delete d.read[oldPath];
    });
  }
  move(oldPath, newPath) {
    return this.save((d) => {
      for (const path of Object.keys(d.read)) {
        if (path === oldPath || path.startsWith(oldPath + "/") || path.startsWith(oldPath + "::")) {
          d.read[newPath + path.slice(oldPath.length)] = d.read[path];
          delete d.read[path];
        }
      }
    });
  }
  delete(path) {
    return this.save((d) => {
      for (const p of Object.keys(d.read)) if (p === path || p.startsWith(path + "/") || p.startsWith(path + "::")) delete d.read[p];
    });
  }
};
var Transactions = class {
  constructor(app, owner, folder, isOpen, notify, isAlive = () => true) {
    this.app = app;
    this.owner = owner;
    this.folder = folder;
    this.isOpen = isOpen;
    this.notify = notify;
    this.isAlive = isAlive;
    this.busy = false;
  }
  async preview(rows, op) {
    if (rows.length > 100) throw Error("\u6BCF\u6B21\u6700\u591A\u4FEE\u6539 100 \u7BC7\uFF1B\u8BF7\u5206\u6279\u9009\u62E9\u3002\u5168\u5E93\u6536\u5F55\u6570\u91CF\u4E0D\u53D7\u9650\u5236\u3002");
    const result = [], groups = /* @__PURE__ */ new Map();
    let bytes = 0;
    for (const row of rows) {
      if (!groups.has(row.path)) groups.set(row.path, []);
      groups.get(row.path).push(row);
    }
    for (const selected of groups.values()) {
      const row = selected[0];
      try {
        if (this.isOpen(row.file)) throw Error("\u7B14\u8BB0\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00\uFF0C\u8BF7\u5173\u95ED\u8BE5\u7B14\u8BB0\u540E\u91CD\u8BD5");
        if (row.file.stat.size > 2 * 1024 * 1024) throw Error("\u7B14\u8BB0\u8D85\u8FC7 2 MiB\uFF0C\u672C\u6279\u8DF3\u8FC7\uFF1B\u8BF7\u4F7F\u7528\u7F16\u8F91\u5668\u4FEE\u6539");
        const before = await this.app.vault.read(row.file);
        bytes += before.length * 4;
        if (bytes > 8 * 1024 * 1024) throw Error("\u672C\u6279\u9884\u89C8\u8FBE\u5230 8 MiB\uFF0C\u8BF7\u5206\u6279\u5904\u7406\u5269\u4F59\u7247\u6BB5");
        const after = editSegments(before, selected, op);
        result.push({ file: row.file, path: row.path, ctime: row.file.stat.ctime, before, after, changes: selected.map((r) => ({ id: r.id, before: fragmentText(before, r.id), after: fragmentText(after, r.id) })), status: before === after ? "unchanged" : "ready" });
      } catch (e) {
        result.push({ file: row.file, path: row.path, status: "skipped", error: e.message });
      }
    }
    return result;
  }
  async mkdir(path) {
    if (!await this.app.vault.adapter.exists(path)) await this.app.vault.adapter.mkdir(path);
  }
  async write(path, data) {
    await this.app.vault.adapter.write(path, JSON.stringify(data));
  }
  check(item) {
    if (!this.isAlive()) throw Error("\u63D2\u4EF6\u5DF2\u5173\u95ED\uFF0C\u672A\u7EE7\u7EED\u5199\u5165");
    const file = this.app.vault.getAbstractFileByPath(item.path);
    if (file !== item.file || file.stat.ctime !== item.ctime) throw Error("\u7B14\u8BB0\u5DF2\u79FB\u52A8\u3001\u5220\u9664\u6216\u88AB\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u9884\u89C8");
    if (this.isOpen(file)) throw Error("\u7B14\u8BB0\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00\uFF0C\u5DF2\u8DF3\u8FC7");
    return file;
  }
  async apply(items) {
    if (this.busy) throw Error("\u5F53\u524D\u64CD\u4F5C\u5C1A\u672A\u5B8C\u6210");
    this.busy = true;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, dir = `${this.folder}/transactions/${id}`;
    try {
      await this.mkdir(`${this.folder}/transactions`);
      await this.mkdir(dir);
      let recoveryRegistered = false, writtenAny = false, uncertainAny = false;
      const report = [];
      for (let n = 0; n < items.length; n++) {
        const item = items[n];
        if (item.status !== "ready") {
          report.push({ path: item.path, status: item.status, error: item.error });
          continue;
        }
        let journal, written = false, processAttempted = false, writeRejected = false;
        try {
          this.check(item);
          item.after = retimeTagChanges(item.before, item.after);
          journal = { path: item.path, ctime: item.ctime, before: item.before, after: item.after, status: "intent" };
          await this.write(`${dir}/${n}.json`, journal);
          if (!recoveryRegistered) {
            await this.owner.save((d) => {
              d.recoveryTransaction = id;
            });
            recoveryRegistered = true;
          }
          this.check(item);
          processAttempted = true;
          await this.app.vault.process(item.file, (current) => {
            try {
              this.check(item);
              if (current !== item.before) throw Error("\u539F\u6587\u5728\u9884\u89C8\u540E\u53D1\u751F\u53D8\u5316\uFF0C\u672A\u8986\u76D6");
              return item.after;
            } catch (error2) {
              writeRejected = true;
              throw error2;
            }
          });
          written = true;
          writtenAny = true;
          journal.status = "committed";
          await this.write(`${dir}/${n}.json`, journal);
          await this.owner.save((d) => {
            d.lastTransaction = id;
            if (d.recoveryTransaction === id) delete d.recoveryTransaction;
          });
          report.push({ path: item.path, status: "committed" });
        } catch (e) {
          let uncertain = false;
          if (processAttempted && !written && !writeRejected) {
            try {
              const current = await this.app.vault.read(item.file);
              if (current === item.after) {
                written = true;
                writtenAny = true;
              } else if (current !== item.before) uncertain = true;
            } catch {
              uncertain = true;
            }
          }
          uncertainAny || (uncertainAny = uncertain);
          report.push({ path: item.path, status: written ? "committed-receipt-failed" : uncertain ? "unknown" : "failed", error: (written ? "\u6B63\u6587\u5DF2\u4FEE\u6539\uFF0C\u4F46\u5199\u5165\u786E\u8BA4\u6216\u56DE\u6267\u5F02\u5E38\uFF1B\u4E0D\u8981\u91CD\u590D\u63D0\u4EA4\u3002" : uncertain ? "\u65E0\u6CD5\u786E\u8BA4\u6700\u7EC8\u5185\u5BB9\uFF0C\u8BF7\u6838\u5BF9\u539F\u6587\u6216\u6062\u590D\u8BB0\u5F55\u3002" : "") + e.message + (journal ? "\uFF1B\u5DF2\u4FDD\u7559\u4E8B\u52A1\u8BB0\u5F55\uFF0C\u53EF\u7528\u64A4\u9500\u5165\u53E3\u6838\u5BF9\u6062\u590D" : "") });
        }
        await pause2();
      }
      if (!writtenAny && !uncertainAny && recoveryRegistered) try {
        await this.owner.save((d) => {
          if (d.recoveryTransaction === id) delete d.recoveryTransaction;
        });
      } catch (e) {
        report.push({ path: "\u6062\u590D\u5165\u53E3", status: "recovery-pending", error: "\u672A\u5199\u5165\u6B63\u6587\uFF1B\u6062\u590D\u6807\u8BB0\u672A\u6E05\u9664\uFF0C\u53EF\u7528\u64A4\u9500\u5165\u53E3\u6838\u5BF9\uFF1A" + e.message });
      }
      try {
        await this.write(`${dir}/report.json`, report);
      } catch (e) {
        report.push({ path: "\u672C\u6279\u7ED3\u679C\u62A5\u544A", status: "report-failed", error: "\u9010\u7BC7\u7ED3\u679C\u5982\u4E0B\uFF1B\u62A5\u544A\u6587\u4EF6\u672A\u4FDD\u5B58\uFF1A" + e.message });
      }
      return report;
    } finally {
      this.busy = false;
    }
  }
  async undo() {
    if (this.busy) throw Error("\u5F53\u524D\u64CD\u4F5C\u5C1A\u672A\u5B8C\u6210");
    this.busy = true;
    try {
      const id = this.owner.data.recoveryTransaction || this.owner.data.lastTransaction;
      if (!id) throw Error("\u6CA1\u6709\u53EF\u64A4\u9500\u7684\u6279\u6B21");
      const dir = `${this.folder}/transactions/${id}`, listing = await this.app.vault.adapter.list(dir), report = [];
      for (const path of listing.files.filter((p) => /\/\d+\.json$/.test(p))) {
        const entry = JSON.parse(await this.app.vault.adapter.read(path));
        if (entry.status === "undone") {
          report.push({ path: entry.path, status: "\u5DF2\u64A4\u9500" });
          continue;
        }
        try {
          const file = this.app.vault.getAbstractFileByPath(entry.path);
          if (!this.isAlive() || !file || file.stat.ctime !== entry.ctime || this.isOpen(file)) throw Error("\u6765\u6E90\u5DF2\u53D8\u5316\u3001\u63D2\u4EF6\u5DF2\u5173\u95ED\u6216\u6B63\u5728\u7F16\u8F91\uFF0C\u672A\u6062\u590D");
          await this.app.vault.process(file, (current) => {
            if (!this.isAlive() || this.app.vault.getAbstractFileByPath(entry.path) !== file || this.isOpen(file)) throw Error("\u6765\u6E90\u53D8\u5316");
            if (current === entry.before) return current;
            if (current !== entry.after) throw Error("\u539F\u6587\u6709\u540E\u7EED\u4FEE\u6539\uFF0C\u672A\u8986\u76D6");
            return entry.before;
          });
          entry.status = "undone";
          await this.write(path, entry);
          report.push({ path: entry.path, status: "\u5DF2\u64A4\u9500" });
        } catch (e) {
          report.push({ path: entry.path, status: e.message });
        }
      }
      if (report.every((r) => r.status === "\u5DF2\u64A4\u9500")) await this.owner.save((d) => {
        if (d.recoveryTransaction === id) delete d.recoveryTransaction;
      });
      return report;
    } finally {
      this.busy = false;
    }
  }
};

// src/main.js
var TYPE = "experience-note-tags-view";
var A = createTagDisplayAliases({ Modal: import_obsidian.Modal, Notice: import_obsidian.Notice });
var aliasScope = "experience";
var D = createTagAddressPresentation(A);
var el = (parent, tag, cls, text2) => {
  const node = parent.ownerDocument.createElement(tag);
  if (cls) node.className = cls;
  if (text2 !== void 0) node.textContent = text2;
  parent.appendChild(node);
  return node;
};
function button(parent, text2, fn, cls = "") {
  const b = el(parent, "button", cls, text2);
  b.type = "button";
  b.onclick = () => Promise.resolve().then(fn).catch((e) => new import_obsidian.Notice(e.message));
  return b;
}
function input(parent, placeholder, value = "", type = "text") {
  const n = el(parent, "input");
  n.type = type;
  n.placeholder = placeholder;
  n.value = value;
  n.setAttribute("aria-label", placeholder);
  return n;
}
function debounce(fn, ms = 150) {
  let t;
  const f = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  f.cancel = () => clearTimeout(t);
  return f;
}
var ReportModal = class extends import_obsidian.Modal {
  constructor(app, title, report) {
    super(app);
    this.title = title;
    this.report = report;
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.classList.add("ent-modal");
    for (const item of this.report) el(this.contentEl, "p", "ent-report", `${item.path}\uFF1A${{ committed: "\u5DF2\u4FEE\u6539", unchanged: "\u65E0\u9700\u4FEE\u6539", skipped: "\u5DF2\u8DF3\u8FC7", failed: "\u672A\u4FEE\u6539", unknown: "\u7ED3\u679C\u5F85\u6838\u5BF9", "committed-receipt-failed": "\u6B63\u6587\u5DF2\u4FEE\u6539\uFF0C\u56DE\u6267\u4FDD\u5B58\u5F02\u5E38", "report-failed": "\u7ED3\u679C\u62A5\u544A\u672A\u4FDD\u5B58", "recovery-pending": "\u6062\u590D\u6807\u8BB0\u5F85\u6838\u5BF9" }[item.status] || item.status}${item.error ? " \xB7 " + item.error : ""}`);
    button(this.contentEl, "\u5173\u95ED", () => this.close());
  }
};
var TagPicker = class extends import_obsidian.Modal {
  constructor(plugin, editor, view) {
    super(plugin.app);
    Object.assign(this, { plugin, editor, view, file: view.file, sourcePath: view.file.path, snapshot: editor.getValue() });
    const from = editor.posToOffset(editor.getCursor("from")), to = editor.posToOffset(editor.getCursor("to"));
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    this.scope = captureBlocks(this.snapshot, from, to, id);
    this.key = "editor:" + this.file.path;
    const draft = plugin.owner.data.drafts[this.key] || {};
    this.picked = new Set(draft.tags || []);
    const pending = String(draft.input || "");
    this.restoredInput = draft.path && pending.trim() && !pending.trim().startsWith("#") ? "#" + draft.path + "/" + pending.trim() : pending;
    this.composing = false;
    this.done = false;
    this.busy = false;
    this.closed = false;
    this.indexConsumer = true;
    this.existing = new Set(scan(this.scope.text).spans.map((t) => t.tag));
    for (const t of this.existing) this.picked.delete(t);
    plugin.modals.add(this);
  }
  stash() {
    return this.plugin.owner.saveDraft((d) => {
      if (this.done) delete d.drafts[this.key];
      else d.drafts[this.key] = { tags: [...this.picked], input: this.newTag?.value || "", search: this.search?.value || "" };
    });
  }
  save() {
    this.stash().catch((e) => new import_obsidian.Notice("\u8349\u7A3F\u6682\u672A\u4FDD\u5B58\uFF1A" + e.message));
  }
  newTags() {
    const t = this.newTag.value.trim();
    return t ? [normalizeTag(t)] : [];
  }
  add() {
    if (this.composing || this.busy) return;
    for (const t of this.newTags()) if (!this.existing.has(t)) this.picked.add(t);
    this.newTag.value = "";
    this.paint();
    this.save();
  }
  onOpen() {
    this.modalEl.classList.add("ent-picker-modal");
    this.titleEl.setText(this.scope.existing ? "\u4E3A\u7ECF\u9A8C\u7247\u6BB5\u6DFB\u52A0\u6807\u7B7E" : "\u6536\u5F55\u7ECF\u9A8C\u7247\u6BB5");
    const c = this.contentEl;
    c.classList.add("ent-modal", "ent-picker");
    el(c, "p", "ent-scope-note", this.scope.existing ? "\u4EC5\u4FEE\u6539\u5F53\u524D\u7ECF\u9A8C\u7247\u6BB5\uFF1B\u65B0\u589E\u6807\u7B7E\u653E\u5728\u672B\u5C3E\u72EC\u7ACB\u884C\u3002" : this.scope.explanation);
    const preview = el(c, "details", "ent-capture-preview");
    el(preview, "summary", "", `\u5B9E\u9645\u6536\u5F55\u8303\u56F4 \xB7 ${this.scope.text.length} \u5B57`);
    el(preview, "pre", "", this.scope.text);
    this.search = input(c, "\u641C\u7D22\u7ECF\u9A8C\u6807\u7B7E\uFF08\u5305\u542B\u5B8C\u6574\u8DEF\u5F84\uFF09", this.plugin.owner.data.drafts[this.key]?.search || "");
    const layout = el(c, "div", "ent-picker-layout");
    const panel = el(layout, "section", "ent-picker-panel");
    const controls = el(panel, "div", "ent-toolbar");
    this.newTag = input(controls, "\u65B0\u6807\u7B7E\uFF1A\u8F93\u5165\u5B8C\u6574\u540D\u79F0\u6216\u7F16\u53F7/\u5B50\u7F16\u53F7-\u540D\u79F0\uFF08\u9017\u53F7\u4FDD\u7559\uFF09", this.restoredInput);
    this.newTag.oninput = () => {
      this.submit.disabled = this.busy || !this.picked.size && !this.existing.size && !this.newTag.value.trim();
      this.save();
    };
    button(controls, "\u6DFB\u52A0", () => this.add());
    this.newTag.onkeydown = (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.isComposing && !this.composing) {
        e.preventDefault();
        try {
          this.add();
        } catch (error2) {
          new import_obsidian.Notice(error2.message);
        }
      }
    };
    c.addEventListener("compositionstart", () => {
      this.composing = true;
    });
    c.addEventListener("compositionend", () => {
      this.composing = false;
      this.save();
    });
    this.status = el(panel, "div", "ent-muted ent-picker-status");
    this.list = el(panel, "div", "ent-tag-grid");
    this.chips = el(c, "div", "ent-chips ent-picked");
    const footer = el(c, "div", "ent-modal-footer");
    el(footer, "span", "ent-muted", "\u4EC5\u7ECF\u9A8C\u7247\u6BB5\u7684\u6807\u7B7E\uFF1B\u5DF2\u6709\u6807\u7B7E\u4E0D\u91CD\u590D\u6DFB\u52A0");
    button(footer, "\u53D6\u6D88", () => this.close());
    this.submit = button(footer, this.scope.existing ? "\u63D2\u5165\u539F\u6807\u7B7E" : "\u6536\u5F55\u7247\u6BB5", () => this.apply(), "mod-cta");
    this.searchChanged = debounce(() => {
      this.paint();
      this.save();
    });
    this.search.oninput = this.searchChanged;
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.isComposing && !this.composing) {
        e.preventDefault();
        this.apply().catch((error2) => new import_obsidian.Notice(error2.message));
      }
    });
    this.indexListener = () => {
      if (!this.closed) this.paint();
    };
    this.plugin.index.listeners.add(this.indexListener);
    this.plugin.syncActivity();
    this.paint();
    this.plugin.index.start().then(() => {
      if (!this.closed) this.paint();
    }).catch((e) => new import_obsidian.Notice(e.message));
  }
  paint() {
    if (this.closed) return;
    const tree = this.plugin.index.catalogTree();
    const query = this.search.value.trim().toLocaleLowerCase();
    this.chips.replaceChildren();
    for (const tag of this.picked) {
      const b = button(this.chips, "", () => {
        if (this.busy) return;
        this.picked.delete(tag);
        this.paint();
        this.save();
      }, "ent-chip is-active");
      D.paint(b, this.plugin.owner.data, aliasScope, tag);
      el(b, "span", "", " \xD7");
      b.disabled = this.busy;
    }
    for (const tag of this.existing) {
      const b = D.paint(el(this.chips, "span", "ent-chip"), this.plugin.owner.data, aliasScope, tag);
      el(b, "span", "", " \xB7 \u5DF2\u6709");
    }
    if (!this.picked.size && !this.existing.size) el(this.chips, "span", "ent-muted", "\u52FE\u9009\u6807\u7B7E\uFF0C\u53EF\u591A\u9009");
    const data = this.plugin.owner.data;
    const entries = tree.tags.filter((t) => !query || A.matches(data, aliasScope, t, query)).map((t) => tree.nodes.get(t.slice(1))).sort((a, b) => D.compare(data, aliasScope, a.tag, b.tag));
    this.list.replaceChildren();
    for (const columns of [1, 2, 3]) this.list.style.setProperty("--ent-picker-rows-" + columns, String(Math.max(1, Math.ceil(entries.length / columns))));
    for (const item of entries) {
      const card = el(this.list, "div", "ent-tag-choice");
      D.tint(card, this.plugin, item.tag);
      const label = el(card, "label", "ent-tag-check");
      const check = el(label, "input");
      check.type = "checkbox";
      check.checked = this.picked.has(item.tag) || this.existing.has(item.tag);
      check.disabled = this.busy || this.existing.has(item.tag);
      check.onchange = () => {
        if (this.busy) return;
        check.checked ? this.picked.add(item.tag) : this.picked.delete(item.tag);
        this.paint();
        this.save();
      };
      D.paint(el(label, "span", "ent-tag-name"), data, aliasScope, item.tag, { indent: true });
      el(label, "span", "ent-count", item.count);
      if (this.existing.has(item.tag)) {
        if (this.scope.existing) {
          const jump = button(card, "\u56DE\u770B\u6B64\u5904 \u2197", () => this.jumpToReview(item.tag), "ent-review-jump");
          jump.title = "\u5728\u7ECF\u9A8C\u56DE\u770B\u4E2D\u5B9A\u4F4D\u6B64\u6807\u7B7E\u4E0B\u7684\u5F53\u524D\u7247\u6BB5";
          jump.setAttribute("aria-label", jump.title + " \xB7 " + A.label(data, aliasScope, item.tag));
          jump.disabled = this.busy;
        } else el(card, "span", "ent-muted", "\u5F53\u524D\u7247\u6BB5\u5DF2\u6709");
      }
    }
    const pending = this.plugin.index.queue.size + this.plugin.index.scanning;
    this.status.textContent = `\u663E\u793A ${entries.length} / ${tree.tags.length} \u4E2A\u7ECF\u9A8C\u6807\u7B7E \xB7 \u6570\u5B57\u4E3A\u7247\u6BB5\u4F7F\u7528\u6570` + (pending ? ` \xB7 \u6B63\u5728\u8BC6\u522B ${pending} \u7BC7\u7B14\u8BB0\u2026` : "");
    if (!entries.length) el(this.list, "p", "ent-muted", pending ? "\u6B63\u5728\u8BC6\u522B\u7ECF\u9A8C\u7247\u6BB5\uFF0C\u8BF7\u7A0D\u5019\uFF1B\u4E5F\u53EF\u4EE5\u65B0\u5EFA\u6807\u7B7E\u3002" : query ? "\u6CA1\u6709\u5339\u914D\u7684\u7ECF\u9A8C\u6807\u7B7E" : "\u8FD9\u91CC\u8FD8\u6CA1\u6709\u7ECF\u9A8C\u6807\u7B7E\uFF0C\u53EF\u4EE5\u5728\u4E0A\u65B9\u65B0\u5EFA\u3002");
    this.submit.disabled = !this.picked.size && !this.existing.size && !this.newTag.value.trim() || this.busy;
  }
  async jumpToReview(tag) {
    if (this.busy || this.closed || this.composing || !this.scope.existing || !this.existing.has(tag)) return;
    const workspace = this.app.workspace;
    const current = () => {
      const source = workspace.getLeavesOfType("markdown").find((leaf) => leaf.view === this.view);
      if (this.closed || !this.plugin.alive || !source || this.view.editor !== this.editor || this.view.file !== this.file || this.file.path !== this.sourcePath || this.app.vault.getAbstractFileByPath(this.sourcePath) !== this.file || this.editor.getValue() !== this.snapshot)
        throw Error("\u6765\u6E90\u7B14\u8BB0\u6216\u7247\u6BB5\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u6807\u7B7E\u7A97\u53E3\u3002");
      const key = this.sourcePath + "::" + this.scope.id;
      const row = this.plugin.index.rows.get(key);
      if (row?.file !== this.file || row.id !== this.scope.id || !row.tags.includes(tag))
        throw Error("\u5F53\u524D\u7247\u6BB5\u5C1A\u672A\u8FDB\u5165\u8FD9\u4E2A\u6807\u7B7E\u7684\u7D22\u5F15\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
      return { source, row };
    };
    this.busy = true;
    this.contentEl.inert = true;
    try {
      current();
      await this.stash();
      const { source } = current();
      const leaves = workspace.getLeavesOfType(TYPE);
      const leaf = leaves.find((l) => l.parent === source.parent) || leaves[0] || workspace.getLeaf("tab");
      if (!leaves.includes(leaf)) await leaf.setViewState({ type: TYPE, active: false });
      if (leaf.isDeferred) await leaf.loadIfDeferred();
      current();
      await workspace.revealLeaf(leaf);
      if (workspace.activeLeaf === source) workspace.setActiveLeaf(leaf, { focus: true });
      const { row } = current();
      if (!(leaf.view instanceof ExperienceView) || !leaf.view.opened || workspace.activeLeaf !== leaf)
        throw Error("\u7ECF\u9A8C\u56DE\u770B\u672A\u5C31\u7EEA\uFF0C\u8BF7\u91CD\u8BD5\u3002");
      leaf.view.revealFragment(row, tag);
      this.jumpStashed = true;
      this.close();
      leaf.view.alignReveal();
    } finally {
      this.busy = false;
      this.contentEl.inert = false;
      if (!this.closed) this.paint();
    }
  }
  async apply() {
    if (this.busy || this.composing) return;
    this.busy = true;
    this.submit.disabled = true;
    this.newTag.disabled = this.search.disabled = true;
    try {
      for (const tag of this.newTags()) this.picked.add(tag);
      await this.stash();
      const exists = this.app.workspace.getLeavesOfType("markdown").some((l) => l.view === this.view);
      if (!this.plugin.alive || this.closed || !exists || this.file.path !== this.sourcePath || this.view.file !== this.file || this.view.editor !== this.editor || this.app.vault.getAbstractFileByPath(this.file.path) !== this.file || this.editor.getValue() !== this.snapshot) throw Error("\u539F\u7B14\u8BB0\u6216\u7F16\u8F91\u5185\u5BB9\u5DF2\u53D8\u5316\u3002\u5DF2\u4FDD\u7559\u6240\u9009\u6807\u7B7E\uFF0C\u8BF7\u56DE\u5230\u6B63\u6587\u91CD\u65B0\u6253\u5F00\u5F39\u7A97\u3002");
      const edit = captureBlockEdit(this.snapshot, this.scope, [...this.picked, ...this.existing]);
      if (this.snapshot.slice(edit.from, edit.to) !== edit.text) this.editor.transaction({ changes: [{ from: this.editor.offsetToPos(edit.from), to: this.editor.offsetToPos(edit.to), text: edit.text }] });
      this.done = true;
      await this.stash();
      new import_obsidian.Notice("\u7ECF\u9A8C\u7247\u6BB5\u5DF2\u4FDD\u5B58\u5230\u7F16\u8F91\u5668\uFF1B\u53EF\u64A4\u9500\u672C\u6B21\u64CD\u4F5C");
      this.close();
    } finally {
      this.busy = false;
      this.newTag.disabled = this.search.disabled = false;
      if (!this.closed) this.paint();
    }
  }
  onClose() {
    this.closed = true;
    this.indexConsumer = false;
    this.searchChanged?.cancel();
    this.plugin.modals.delete(this);
    this.plugin.index.listeners.delete(this.indexListener);
    this.plugin.syncActivity();
    if (!this.done && !this.jumpStashed) this.stash().catch((e) => new import_obsidian.Notice("\u8349\u7A3F\u4FDD\u5B58\u5931\u8D25\uFF0C\u91CD\u5F00\u5F39\u7A97\u4ECD\u53EF\u4ECE\u672C\u6B21\u4F1A\u8BDD\u6062\u590D\uFF1A" + e.message));
  }
};
var EditModal = class extends import_obsidian.Modal {
  constructor(plugin, rows, rename = null) {
    super(plugin.app);
    this.plugin = plugin;
    this.rows = rows;
    this.rename = rename;
    this.key = rename ? "rename:" + rename : "batch";
    this.busy = false;
    this.completed = false;
    this.previewItems = null;
    this.closed = false;
    this.plugin.modals.add(this);
  }
  draft() {
    return { keys: this.rows.map((r) => r.key), add: this.addInput?.value || "", remove: this.removeInput?.value || "", rename: this.rename };
  }
  stash() {
    return this.plugin.owner.saveDraft((d) => {
      if (this.completed) delete d.drafts[this.key];
      else d.drafts[this.key] = this.draft();
    });
  }
  onOpen() {
    this.titleEl.setText(this.rename ? "\u4FEE\u6539\u539F\u6587\u6807\u7B7E \xB7 \u5199\u5165\u539F\u6587" : "\u7F16\u8F91\u539F\u6587\u6807\u7B7E \xB7 \u5199\u5165\u539F\u6587");
    const c = this.contentEl;
    c.classList.add("ent-modal");
    el(c, "p", "ent-muted", `${this.rows.length} \u4E2A\u7247\u6BB5\uFF08\u542B\u5DF2\u9605\uFF09\uFF0C\u6765\u81EA ${new Set(this.rows.map((r) => r.path)).size} \u7BC7\u7B14\u8BB0\u3002\u5148\u9884\u89C8\u518D\u4FEE\u6539\uFF1B\u65B0\u589E\u6807\u7B7E\u653E\u5728\u5404\u7247\u6BB5\u672B\u5C3E\u72EC\u7ACB\u884C\u3002\u6B63\u5728\u7F16\u8F91\u7684\u7B14\u8BB0\u4F1A\u8DF3\u8FC7\u3002`);
    if (this.rename) el(c, "p", "", `\u5F53\u524D\u65E5\u671F\u548C\u641C\u7D22\u8303\u56F4\u5185\uFF1A${this.rename} \u2192 \u65B0\u6807\u7B7E\uFF08\u5DF2\u6709\u540D\u79F0\u4F1A\u5408\u5E76\uFF09`);
    const draft = this.plugin.owner.data.drafts[this.key];
    this.addInput = input(c, this.rename ? "\u65B0\u6807\u7B7E\u540D\u79F0" : "\u6DFB\u52A0\u6807\u7B7E\uFF08\u7A7A\u683C\u5206\u9694\uFF0C\u9017\u53F7\u5C5E\u4E8E\u540D\u79F0\uFF09", draft?.add || "");
    this.removeInput = input(c, "\u79FB\u9664\u6807\u7B7E\uFF08\u7A7A\u683C\u5206\u9694\uFF0C\u9017\u53F7\u5C5E\u4E8E\u540D\u79F0\uFF09", draft?.remove || "");
    this.removeInput.hidden = !!this.rename;
    const chips = el(c, "div", "ent-chips");
    for (const tag of [...new Set(this.rows.flatMap((r) => r.tags))].slice(0, 60)) button(chips, tag, () => {
      if (this.busy) return;
      this.removeInput.value += (this.removeInput.value ? " " : "") + tag;
      this.invalidate();
    }, "ent-chip");
    this.addInput.oninput = this.removeInput.oninput = () => this.invalidate();
    this.previewEl = el(c, "div", "ent-preview");
    const foot = el(c, "div", "ent-modal-footer");
    button(foot, "\u53D6\u6D88", () => this.close());
    this.previewButton = button(foot, "\u9884\u89C8\u53D8\u66F4", () => this.preview());
    this.applyButton = button(foot, "\u786E\u8BA4\u5199\u5165\u539F\u6587", () => this.apply(), "mod-cta");
    this.applyButton.disabled = true;
  }
  invalidate() {
    this.previewItems = null;
    this.applyButton.disabled = true;
    this.previewEl.replaceChildren();
  }
  operation() {
    if (this.rename) return { rename: [this.rename, normalizeTag(this.addInput.value)] };
    return { add: tagList(this.addInput.value), remove: tagList(this.removeInput.value) };
  }
  lock(value) {
    this.busy = value;
    this.addInput.disabled = this.removeInput.disabled = this.previewButton.disabled = value;
    this.applyButton.disabled = value || !this.previewItems;
  }
  async preview() {
    if (this.busy) return;
    this.lock(true);
    try {
      const op = this.operation();
      await this.stash();
      this.previewItems = await this.plugin.transactions.preview(this.rows, op);
      this.previewEl.replaceChildren();
      el(this.previewEl, "p", "", `\u6DFB\u52A0\uFF1A${(op.add || [op.rename?.[1]]).filter(Boolean).join(" ") || "\u65E0"}\uFF1B\u79FB\u9664\uFF1A${(op.remove || [op.rename?.[0]]).filter(Boolean).join(" ") || "\u65E0"}`);
      for (const item of this.previewItems) {
        const row = el(this.previewEl, "details");
        el(row, "summary", "", `${item.path} \xB7 ${item.status === "ready" ? "\u5C06\u4FEE\u6539" : item.status === "unchanged" ? "\u65E0\u9700\u4FEE\u6539" : "\u8DF3\u8FC7\uFF1A" + item.error}`);
        if (item.status === "ready") {
          for (const change of item.changes) {
            el(row, "p", "ent-muted", "\u7247\u6BB5 " + change.id + " \xB7 \u4FEE\u6539\u524D / \u540E\uFF08\u5404\u663E\u793A\u672B\u5C3E1200\u5B57\uFF09");
            el(row, "pre", "", change.before.slice(-1200));
            el(row, "pre", "", change.after.slice(-1200));
          }
        }
      }
      el(this.previewEl, "p", "ent-muted", "\u79FB\u9664\u7247\u6BB5\u6700\u540E\u4E00\u4E2A\u6807\u7B7E\u540E\uFF0C\u8BE5\u7247\u6BB5\u4F1A\u79BB\u5F00\u672C\u5217\u8868\uFF1B\u53EF\u64A4\u9500\u672C\u6279\u4FEE\u6539\u3002");
    } finally {
      this.lock(false);
    }
  }
  async apply() {
    if (!this.plugin.alive || this.closed || this.busy || !this.previewItems) return;
    this.lock(true);
    try {
      const report = await this.plugin.transactions.apply(this.previewItems);
      const ok = report.every((r) => ["committed", "unchanged"].includes(r.status));
      this.completed = ok;
      await this.stash();
      this.previewItems = null;
      this.plugin.refresh();
      new ReportModal(this.app, "\u6807\u7B7E\u4FEE\u6539\u7ED3\u679C", report).open();
      if (ok) this.close();
    } finally {
      this.lock(false);
    }
  }
  onClose() {
    this.closed = true;
    this.plugin.modals.delete(this);
    if (!this.completed) this.stash().catch((e) => new import_obsidian.Notice("\u8F93\u5165\u8349\u7A3F\u672A\u80FD\u5199\u5165\u78C1\u76D8\uFF1A" + e.message));
  }
};
var ExperienceView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.filter = { search: "", from: "", to: "", tags: [], mode: "single", asc: false };
    this.pages = { unread: 0, read: 0 };
    this.selected = /* @__PURE__ */ new Set();
    this.tagSearch = "";
    this.tagPage = 0;
    this.generation = 0;
    this.opened = false;
    this.readExpanded = false;
    this.fullFragments = /* @__PURE__ */ new Map();
    this.bodyControllers = /* @__PURE__ */ new Set();
  }
  clearBodies() {
    for (const c of this.bodyControllers) c.dispose();
    this.bodyControllers.clear();
  }
  pruneBodies() {
    for (const c of this.bodyControllers) if (!c.article.isConnected) {
      c.dispose();
      this.bodyControllers.delete(c);
    }
    const keys = new Set([...this.bodyControllers].map((c) => c.key));
    for (const key of this.fullFragments.keys()) if (!keys.has(key)) this.fullFragments.delete(key);
  }
  getViewType() {
    return TYPE;
  }
  getDisplayText() {
    return "\u7ECF\u9A8C\u56DE\u770B";
  }
  getIcon() {
    return "book-open-check";
  }
  getState() {
    return { filter: this.filter, readExpanded: this.readExpanded };
  }
  async setState(state, result) {
    if (state?.filter) this.filter = { ...this.filter, ...state.filter };
    this.readExpanded = !!state?.readExpanded;
    if (this.opened) this.mount();
    await super.setState(state, result);
  }
  async onOpen() {
    this.opened = true;
    this.plugin.views.add(this);
    this.mount();
    await this.plugin.index.start();
    this.plugin.syncActivity();
    this.refresh();
  }
  onClose() {
    this.stopReveal();
    this.opened = false;
    this.generation++;
    this.clearBodies();
    this.fullFragments.clear();
    this.searchChanged?.cancel();
    this.tagChanged?.cancel();
    this.plugin.views.delete(this);
    this.plugin.syncActivity();
  }
  changed() {
    if (this.selected.size) new import_obsidian.Notice("\u7B5B\u9009\u5DF2\u53D8\u5316\uFF0C\u5DF2\u6E05\u9664\u6279\u91CF\u9009\u62E9");
    this.selected.clear();
    this.pages = { unread: 0, read: 0 };
    this.tagPage = 0;
    this.refresh();
    this.app.workspace.requestSaveLayout();
  }
  mount() {
    this.clearBodies();
    const c = this.contentEl;
    c.replaceChildren();
    c.classList.add("ent-view");
    const header = el(c, "div", "ent-header");
    const title = el(header, "div");
    el(title, "h2", "", "\u7ECF\u9A8C\u56DE\u770B");
    el(title, "p", "ent-muted", "\u8BA9\u505A\u8FC7\u7684\u4E8B\uFF0C\u4ECD\u7136\u6210\u4E3A\u4F60\u7684\u80FD\u529B\u3002");
    const actions = el(header, "div", "ent-toolbar");
    button(actions, "\u5237\u65B0", async () => {
      await this.plugin.index.start(true);
      this.refresh();
    });
    button(actions, "\u64A4\u9500\u4E0A\u6B21\u6807\u7B7E\u4FEE\u6539", async () => {
      const report = await this.plugin.transactions.undo();
      this.plugin.refresh();
      new ReportModal(this.app, "\u64A4\u9500\u7ED3\u679C", report).open();
    });
    const bar = el(c, "div", "ent-toolbar ent-filters");
    this.searchInput = input(bar, "\u641C\u7D22\u7B14\u8BB0\u540D\u79F0 / \u8DEF\u5F84", this.filter.search);
    this.searchChanged = debounce(() => {
      this.filter.search = this.searchInput.value;
      this.changed();
    });
    this.searchInput.oninput = this.searchChanged;
    this.fromInput = input(bar, "\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4\u8D77", this.filter.from, "date");
    this.toInput = input(bar, "\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4\u6B62", this.filter.to, "date");
    const dates = () => {
      this.filter.from = this.fromInput.value;
      this.filter.to = this.toInput.value;
      this.changed();
    };
    this.fromInput.onchange = this.toInput.onchange = dates;
    const range = (kind) => {
      const today = localDay();
      this.filter.to = kind ? today : "";
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - 19);
      this.filter.from = kind === 20 ? localDay(date.getTime()) : kind ? today : "";
      this.fromInput.value = this.filter.from;
      this.toInput.value = this.filter.to;
      this.changed();
    };
    button(bar, "\u53EA\u770B\u4ECA\u5929", () => range(1));
    button(bar, "\u8FD120\u5929", () => range(20));
    button(bar, "\u5168\u90E8\u65E5\u671F", () => range(0));
    this.sortButton = button(bar, this.filter.asc ? "\u7531\u65E7\u5230\u65B0" : "\u7531\u65B0\u5230\u65E7", () => {
      this.filter.asc = !this.filter.asc;
      this.sortButton.textContent = this.filter.asc ? "\u7531\u65E7\u5230\u65B0" : "\u7531\u65B0\u5230\u65E7";
      this.changed();
    });
    el(c, "p", "ent-muted ent-date-help", "\u6309\u7247\u6BB5\u66F4\u65B0\u65F6\u95F4\u7B5B\u9009\u548C\u6392\u5E8F\uFF08\u901A\u8FC7\u672C\u63D2\u4EF6\u5B9E\u9645\u4FEE\u6539\u6807\u7B7E\u65F6\u8BB0\u5F55\uFF09\uFF1B\u65E7\u7247\u6BB5\u6682\u7528\u5EFA\u7ACB\u65E5\u671F\u3002");
    const layout = el(c, "div", "ent-layout");
    const side = el(layout, "details", "ent-sidebar");
    side.open = true;
    el(side, "summary", "", "\u6807\u7B7E \xB7 \u672A\u9605\u6570");
    const tagSearch = this.tagSearchInput = input(side, "\u641C\u7D22\u6807\u7B7E", this.tagSearch);
    this.tagChanged = debounce(() => {
      this.tagSearch = tagSearch.value;
      this.tagPage = 0;
      this.renderTags();
    });
    tagSearch.oninput = this.tagChanged;
    this.tagList = el(side, "div", "ent-tag-list");
    const main = el(layout, "section", "ent-main");
    const tools = el(main, "div", "ent-toolbar ent-list-tools");
    this.summary = el(tools, "span", "ent-muted");
    const modes = el(tools, "div", "ent-toolbar");
    for (const [mode, label] of [["single", "\u5355\u4E2A\u6807\u7B7E"], ["any", "\u4EFB\u4E00\u5305\u542B"], ["all", "\u5168\u90E8\u5305\u542B"]]) {
      const b = button(modes, label, () => {
        this.filter.mode = mode;
        if (mode === "single") this.filter.tags = this.filter.tags.slice(0, 1);
        this.changed();
      });
      b.dataset.mode = mode;
    }
    button(modes, "\u6E05\u9664\u6807\u7B7E\u7B5B\u9009", () => {
      this.filter.tags = [];
      this.changed();
    });
    this.modeBar = modes;
    this.aliasSelection = el(main, "div", "tag-alias-selection");
    this.batch = el(main, "div", "ent-toolbar ent-batch");
    this.notes = el(main, "div");
    this.refresh();
  }
  revealFragment(row, tag) {
    this.searchChanged.cancel();
    this.tagChanged.cancel();
    const filter = { ...this.filter, tags: [tag], mode: "single", search: this.searchInput.value };
    for (const field of ["search", "from", "to"]) {
      if (!matches(row, { [field]: filter[field] })) filter[field] = "";
    }
    this.filter = filter;
    this.searchInput.value = filter.search;
    this.fromInput.value = filter.from;
    this.toInput.value = filter.to;
    this.tagSearch = this.tagSearchInput.value;
    if (!A.matches(this.plugin.owner.data, aliasScope, tag, this.tagSearch)) this.tagSearch = this.tagSearchInput.value = "";
    this.tagList.closest("details").open = true;
    this.selected.clear();
    const read = this.plugin.owner.isRead(row);
    if (read) this.readExpanded = true;
    this.stopReveal();
    const doc = this.contentEl.ownerDocument, win = doc.defaultView;
    const controller = new win.AbortController();
    const jump = this.jumpMark = { row, tag, read, key: row.key, until: Date.now() + 2400, controller, frame: 0 };
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"])
      doc.addEventListener(event, () => this.stopReveal(), { capture: true, passive: true, signal: controller.signal });
    jump.timer = win.setTimeout(() => this.stopReveal(), 2400);
    if (win.ResizeObserver) {
      jump.resize = new win.ResizeObserver(() => this.alignReveal());
      jump.resize.observe(this.notes);
    }
    this.refresh();
    if (![...this.bodyControllers].some((c) => c.key === row.key)) {
      this.stopReveal();
      throw Error("\u5F53\u524D\u7247\u6BB5\u672A\u80FD\u5B9A\u4F4D\uFF0C\u8BF7\u91CD\u8BD5\u3002");
    }
    this.app.workspace.requestSaveLayout();
  }
  stopReveal() {
    const jump = this.jumpMark;
    if (!jump) return;
    this.jumpMark = null;
    const win = this.contentEl.ownerDocument.defaultView;
    jump.controller.abort();
    jump.resize?.disconnect();
    win.clearTimeout(jump.timer);
    win.cancelAnimationFrame(jump.frame);
  }
  alignReveal() {
    const jump = this.jumpMark;
    if (!jump || jump.frame) return;
    const win = this.contentEl.ownerDocument.defaultView;
    jump.frame = win.requestAnimationFrame(() => {
      jump.frame = 0;
      if (this.jumpMark !== jump) return;
      if (!this.opened || this.app.workspace.activeLeaf !== this.leaf || Date.now() >= jump.until) {
        this.stopReveal();
        return;
      }
      const card = [...this.bodyControllers].find((c) => c.key === jump.key)?.article;
      if (!card?.isConnected) return;
      const bounds = card.getBoundingClientRect(), view = this.contentEl.getBoundingClientRect();
      const top = Math.max(0, view.top), bottom = Math.min(win.innerHeight, view.bottom);
      if (!jump.aligned || bounds.bottom <= top || bounds.top >= bottom) {
        card.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
        jump.aligned = true;
      }
    });
  }
  refresh() {
    const jump = this.jumpMark;
    if (!this.opened) return;
    this.generation++;
    this.clearBodies();
    this.result = this.plugin.index.query(this.filter);
    this.renderTags(jump?.tag);
    for (const b of this.modeBar.querySelectorAll("[data-mode]")) b.classList.toggle("is-active", b.dataset.mode === this.filter.mode);
    const rows = this.result.rows, unread = rows.filter((r) => !this.plugin.owner.isRead(r)), read = rows.filter((r) => this.plugin.owner.isRead(r));
    this.summary.textContent = `${rows.length} \u4E2A\u7247\u6BB5 \xB7 \u672A\u9605 ${unread.length} \xB7 \u5DF2\u9605 ${read.length}${this.plugin.index.pending.size ? " \xB7 \u5F85\u89E3\u6790 " + this.plugin.index.pending.size : ""}`;
    this.renderBatch();
    this.notes.replaceChildren();
    const index = this.plugin.index;
    const queued = index.queue.size + index.scanning;
    if (queued) el(this.notes, "p", "ent-muted", `\u6B63\u5728\u8BC6\u522B\u7ECF\u9A8C\u8303\u56F4\uFF0C\u5269\u4F59 ${queued} \u7BC7\u7B14\u8BB0\u2026`);
    if (index.unbounded.size) el(this.notes, "p", "ent-muted", `${index.unbounded.size} \u7BC7\u5E26\u6807\u7B7E\u7B14\u8BB0\u5C1A\u65E0\u5DF2\u6807\u5B9A\u4E14\u5E26\u6807\u7B7E\u7684\u7247\u6BB5\uFF1B\u5728\u539F\u6587\u9009\u4E2D\u5185\u5BB9\u540E\u4F7F\u7528\u201C\u6536\u5F55\u7ECF\u9A8C\u7247\u6BB5 / \u6DFB\u52A0\u6807\u7B7E\u201D\u3002`);
    if (index.errors.size) {
      const d = el(this.notes, "details");
      el(d, "summary", "", `${index.errors.size} \u7BC7\u8303\u56F4\u6807\u8BB0\u9700\u68C0\u67E5`);
      for (const [path, error2] of [...index.errors].slice(0, 30)) el(d, "p", "ent-muted", path + "\uFF1A" + error2);
    }
    if (index.cacheSaveFailed) el(this.notes, "p", "ent-muted", "\u6D3E\u751F\u7D22\u5F15\u7F13\u5B58\u672A\u80FD\u4FDD\u5B58\uFF0C\u4E0B\u6B21\u6253\u5F00\u53EF\u80FD\u9700\u8981\u91CD\u65B0\u8BC6\u522B\u3002");
    if (this.filter.from && this.filter.to && this.filter.from > this.filter.to) {
      el(this.notes, "p", "ent-muted", "\u5F00\u59CB\u65E5\u671F\u5E94\u65E9\u4E8E\u6216\u7B49\u4E8E\u7ED3\u675F\u65E5\u671F\u3002");
      this.pruneBodies();
      return;
    }
    if (jump) {
      const group = jump.read ? "read" : "unread";
      const position = (jump.read ? read : unread).findIndex((item) => item.key === jump.row.key);
      if (position >= 0) this.pages[group] = Math.floor(position / 30);
    }
    this.renderGroup(this.notes, "unread", unread);
    const details = el(this.notes, "details", "ent-read");
    details.open = this.readExpanded;
    el(details, "summary", "", `\u5DF2\u9605 ${read.length}`);
    const container = el(details, "div");
    if (this.readExpanded) this.renderGroup(container, "read", read);
    details.ontoggle = () => {
      if (!this.opened || details.open === this.readExpanded) return;
      this.readExpanded = details.open;
      container.replaceChildren();
      if (details.open) this.renderGroup(container, "read", read);
      this.pruneBodies();
      this.app.workspace.requestSaveLayout();
    };
    this.pruneBodies();
    this.alignReveal();
    this.plugin.index.metric("render", { cards: Math.min(30, unread.length) + (this.readExpanded ? Math.min(30, read.length) : 0) });
  }
  manageTag(tag) {
    const p = this.plugin;
    return A.open({
      owner: p,
      data: () => p.owner.data,
      scope: aliasScope,
      tag,
      valid: () => p.alive && this.opened,
      mutate: (label, fn) => p.owner.save(fn),
      sourceScope: "\u5F53\u524D\u65E5\u671F\u548C\u7B14\u8BB0\u641C\u7D22\u8303\u56F4\u5185\u7684\u5168\u90E8\u5339\u914D\u7247\u6BB5\uFF08\u542B\u5DF2\u9605\uFF09\uFF0C\u4EC5\u6B64\u6807\u7B7E",
      changed: () => {
        for (const v of p.views) if (v.opened) v.refreshTagDisplay();
        for (const m of p.modals) if (m instanceof TagPicker && !m.closed) m.paint();
      },
      sourceEdit: () => {
        if (!p.alive || !this.opened) throw Error("\u6765\u6E90\u89C6\u56FE\u5DF2\u5173\u95ED");
        const rows = p.index.query({ ...this.filter, tags: [] }).rows.filter((r) => r.tags.includes(tag));
        if (rows.length > 100) throw Error("\u8BE5\u6807\u7B7E\u8D85\u8FC7 100 \u4E2A\u7247\u6BB5\uFF0C\u8BF7\u7F29\u5C0F\u65E5\u671F\u6216\u7B14\u8BB0\u641C\u7D22\u8303\u56F4\u540E\u7F16\u8F91");
        new EditModal(p, rows, tag).open();
      }
    });
  }
  refreshTagDisplay() {
    const top = this.contentEl.scrollTop, sideTop = this.tagList.scrollTop;
    this.renderTags();
    for (const n of this.notes.querySelectorAll("[data-alias-raw]")) D.paint(n, this.plugin.owner.data, aliasScope, n.dataset.aliasRaw);
    this.contentEl.scrollTop = top;
    this.tagList.scrollTop = sideTop;
  }
  renderTags(revealTag) {
    if (!this.result) return;
    const data = this.plugin.owner.data;
    this.tagList.replaceChildren();
    const all = button(this.tagList, "", () => {
      this.filter.tags = [];
      this.changed();
    }, "ent-tag" + (!this.filter.tags.length ? " is-active" : ""));
    el(all, "span", "", "\u5168\u90E8\u8BB0\u5F55");
    el(all, "span", "ent-count", String(this.result.unread));
    const tags = [...this.result.counts].filter(([t]) => A.matches(data, aliasScope, t, this.tagSearch)).sort(([a], [b]) => D.compare(data, aliasScope, a, b));
    if (revealTag) {
      const i = tags.findIndex(([tag]) => tag === revealTag);
      if (i >= 0) this.tagPage = Math.floor(i / 100);
    }
    this.tagPage = Math.min(this.tagPage, Math.max(0, Math.ceil(tags.length / 100) - 1));
    for (const [tag, count] of tags.slice(this.tagPage * 100, this.tagPage * 100 + 100)) {
      const row = el(this.tagList, "div", "ent-tag-row");
      const b = button(row, "", () => {
        if (this.filter.mode === "single") this.filter.tags = [tag];
        else this.filter.tags = this.filter.tags.includes(tag) ? this.filter.tags.filter((t) => t !== tag) : [...this.filter.tags, tag];
        this.changed();
      }, "ent-tag" + (this.filter.tags.includes(tag) ? " is-active" : ""));
      D.paint(el(b, "span", "ent-tag-name"), data, aliasScope, tag, { indent: true });
      D.tint(b, this.plugin, tag);
      el(b, "span", "ent-count", String(count));
      const edit = button(row, "\u22EF", () => this.manageTag(tag));
      edit.setAttribute("aria-label", "\u7BA1\u7406\u6807\u7B7E " + A.label(data, aliasScope, tag));
      edit.title = "\u7BA1\u7406\u6807\u7B7E\uFF1A\u4E49\u540D / \u539F\u6587\u6807\u7B7E";
    }
    if (tags.length > 100) {
      el(this.tagList, "p", "ent-muted", `${tags.length} \u4E2A\u6807\u7B7E \xB7 \u7B2C ${this.tagPage + 1} \u9875`);
      if (this.tagPage) button(this.tagList, "\u4E0A\u4E00\u9875\u6807\u7B7E", () => {
        this.tagPage--;
        this.renderTags();
      });
      if ((this.tagPage + 1) * 100 < tags.length) button(this.tagList, "\u4E0B\u4E00\u9875\u6807\u7B7E", () => {
        this.tagPage++;
        this.renderTags();
      });
    }
    this.aliasSelection.replaceChildren();
    for (const tag of this.filter.tags) {
      const row = el(this.aliasSelection, "div", "tag-alias-selected");
      D.paint(el(row, "span", ""), data, aliasScope, tag);
      button(row, A.get(data, aliasScope, tag) ? "\u4FEE\u6539\u4E49\u540D" : "\u8BBE\u7F6E\u4E49\u540D", () => this.manageTag(tag));
    }
  }
  renderBatch() {
    this.batch.replaceChildren();
    if (!this.selected.size) return;
    el(this.batch, "span", "", `\u5DF2\u9009 ${this.selected.size} \u4E2A\u7247\u6BB5`);
    button(this.batch, "\u6279\u91CF\u7F16\u8F91\u6807\u7B7E", () => new EditModal(this.plugin, [...this.selected].map((p) => this.plugin.index.rows.get(p)).filter(Boolean)).open());
    button(this.batch, "\u6807\u4E3A\u5DF2\u9605", async () => {
      await this.plugin.owner.save((d) => {
        for (const path of this.selected) {
          const row = this.plugin.index.rows.get(path);
          if (row) d.read[row.key] = row.file.stat.ctime;
        }
      });
      this.selected.clear();
      this.plugin.refresh();
    });
    button(this.batch, "\u6E05\u9664\u9009\u62E9", () => {
      this.selected.clear();
      this.refresh();
    });
  }
  renderGroup(container, key, rows) {
    const max = Math.max(0, Math.ceil(rows.length / 30) - 1);
    this.pages[key] = Math.min(this.pages[key], max);
    const page = this.pages[key], generation = this.generation;
    const header = el(container, "div", "ent-toolbar ent-page");
    el(header, "strong", "", key === "unread" ? "\u672A\u9605" : "\u5DF2\u9605");
    el(header, "span", "ent-muted", `${rows.length} \u4E2A\u7247\u6BB5 \xB7 ${page + 1} / ${max + 1}`);
    if (page) button(header, "\u4E0A\u4E00\u9875", () => {
      this.pages[key]--;
      this.refresh();
    });
    if (page < max) button(header, "\u4E0B\u4E00\u9875", () => {
      this.pages[key]++;
      this.refresh();
    });
    if (!rows.length) el(container, "p", "ent-muted", key === "unread" ? "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u672A\u9605\u7B14\u8BB0\u3002" : "\u6682\u65E0\u5DF2\u9605\u7B14\u8BB0\u3002");
    for (const row of rows.slice(page * 30, page * 30 + 30)) {
      const article = el(container, "article", "ent-card" + (key === "read" ? " is-read" : ""));
      if (this.jumpMark?.key === row.key && this.jumpMark.until > Date.now()) {
        article.classList.add("ent-jump-target");
        article.style.setProperty("--ent-highlight-time", this.jumpMark.until - Date.now() + "ms");
      }
      const head = el(article, "div", "ent-card-head");
      const left = el(head, "div", "ent-toolbar");
      const mark = button(left, key === "read" ? "\u21B6" : "\u2713", async () => {
        await this.plugin.owner.mark(row, key !== "read");
        this.plugin.refresh();
      }, "ent-read-button");
      mark.setAttribute("aria-label", key === "read" ? "\u6062\u590D\u672A\u9605" : "\u6807\u4E3A\u5DF2\u9605");
      const select = input(left, "\u9009\u62E9 " + row.title, "", "checkbox");
      select.checked = this.selected.has(row.key);
      select.onchange = () => {
        select.checked ? this.selected.add(row.key) : this.selected.delete(row.key);
        this.renderBatch();
      };
      const dateLabel = el(left, "span", "ent-meta", `${row.date || "\u65E5\u671F\u672A\u77E5"} \xB7 ${row.source}`);
      dateLabel.title = row.dateHint || "";
      const actions = el(head, "div", "ent-toolbar");
      button(actions, "\u590D\u5236\u7247\u6BB5", async () => {
        const text2 = await this.plugin.index.copyText(row);
        await this.contentEl.ownerDocument.defaultView.navigator.clipboard.writeText(text2);
        new import_obsidian.Notice("\u5DF2\u590D\u5236\u7247\u6BB5\u6B63\u6587\uFF08\u4E0D\u542B\u6807\u7B7E\uFF09");
      });
      button(actions, "\u7F16\u8F91\u539F\u6587\u6807\u7B7E", () => new EditModal(this.plugin, [row]).open());
      button(actions, "\u8FD4\u56DE\u539F\u6587", () => this.plugin.openSource(row, this.leaf));
      el(article, "h3", "ent-title", row.title + " \xB7 \u7ECF\u9A8C\u7247\u6BB5");
      attachBody(this, row, article, generation);
      const tags = el(article, "div", "ent-chips");
      for (const tag of row.tags.slice(0, 20)) D.paint(el(tags, "span", "ent-chip"), this.plugin.owner.data, aliasScope, tag);
      if (row.tags.length > 20) el(tags, "span", "ent-muted", `\u53E6\u6709 ${row.tags.length - 20} \u4E2A\u6807\u7B7E\uFF0C\u53EF\u5728\u539F\u6587\u67E5\u770B`);
    }
  }
};
var Settings = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new import_obsidian.Setting(this.containerEl).setName("\u5EFA\u7ACB\u65E5\u671F\u5C5E\u6027").setDesc("\u6709\u6548 YYYY-MM-DD \u4F18\u5148\uFF0C\u5426\u5219\u4F7F\u7528\u6587\u4EF6\u521B\u5EFA\u65E5\u671F\u3002").addText((t) => t.setValue(this.plugin.owner.data.settings.dateField).onChange(debounce(async (value) => {
      try {
        await this.plugin.owner.save((d) => {
          d.settings.dateField = value.trim() || "qishiriqidate";
        });
        await this.plugin.index.start(true);
      } catch (e) {
        new import_obsidian.Notice(e.message);
      }
    })));
    new import_obsidian.Setting(this.containerEl).setName("\u4F1A\u8BDD\u6027\u80FD\u8BCA\u65AD").setDesc("\u9ED8\u8BA4\u5173\u95ED\u3002\u4EC5\u4FDD\u7559\u6700\u8FD1 100 \u9879\u6570\u91CF/\u8017\u65F6\uFF0C\u4E0D\u8BB0\u5F55\u7B14\u8BB0\u540D\u79F0\u3001\u8DEF\u5F84\u6216\u6B63\u6587\u3002").addToggle((t) => t.setValue(this.plugin.owner.data.settings.diagnostics).onChange(async (value) => {
      await this.plugin.owner.save((d) => {
        d.settings.diagnostics = value;
      });
      if (!value) this.plugin.index.metrics = [];
    }));
    new import_obsidian.Setting(this.containerEl).setName("\u8BCA\u65AD\u7ED3\u679C").addButton((b) => b.setButtonText("\u590D\u5236\u8BCA\u65AD").onClick(async () => {
      await this.containerEl.ownerDocument.defaultView.navigator.clipboard.writeText(JSON.stringify(this.plugin.index.metrics, null, 2));
      new import_obsidian.Notice("\u5DF2\u590D\u5236\u8BCA\u65AD");
    }));
    el(this.containerEl, "p", "ent-muted", "\u5FEB\u6377\u952E\uFF1A\u5728 Obsidian\u300C\u8BBE\u7F6E \u2192 \u5FEB\u6377\u952E\u300D\u4E2D\u641C\u7D22\u201C\u7ECF\u9A8C\u56DE\u770B\uFF1A\u6536\u5F55\u7ECF\u9A8C\u7247\u6BB5 / \u6DFB\u52A0\u6807\u7B7E\u201D\u3002\u672C\u63D2\u4EF6\u4E0D\u5360\u7528\u9ED8\u8BA4\u7EC4\u5408\u952E\u3002");
  }
};
var ExperiencePlugin = class extends import_obsidian.Plugin {
  async openClosureTagV1({scope,raw}) {
    if(scope!=="experience" || typeof raw!=="string" || !raw.startsWith("#")) throw Error("这份收尾记录缺少有效的经验标签来源。");
    const request=this.closureTagRequest=Symbol();
    const ws=this.app.workspace, leaves=ws.getLeavesOfType(TYPE);
    const leaf=leaves.find(l=>l.parent===ws.activeLeaf?.parent)||leaves[0]||ws.getLeaf("tab");
    if(!leaves.includes(leaf))await leaf.setViewState({type:TYPE,active:false});
    if(leaf.isDeferred)await leaf.loadIfDeferred();
    if(request!==this.closureTagRequest)return;
    await ws.revealLeaf(leaf);
    await this.index.start();
    if(request!==this.closureTagRequest)return;
    const view=leaf.view;
    if(!this.alive||!(view instanceof ExperienceView)||!view.opened)throw Error("经验回看尚未就绪，请重试。");
    if(view.selected.size)throw Error("经验回看中有批量勾选，请先完成后再打开收尾标签。");
    const partial=this.index.pending.size||this.index.queue.size||this.index.scanning;
    if(!partial&&!this.index.catalog().includes(raw))throw Error("当前经验回看已找不到这个原标签，收尾记录仍保留当时的名称。");
    view.stopReveal();view.searchChanged.cancel();view.tagChanged.cancel();
    Object.assign(view.filter,{search:"",from:"",to:"",mode:"single",tags:[raw]});
    view.tagSearch=view.tagSearchInput.value=view.searchInput.value=view.fromInput.value=view.toInput.value="";
    view.pages={unread:0,read:0};
    view.readExpanded=true;
    view.tagList.closest("details").open=true;
    view.refresh();
    view.renderTags(raw);
    view.contentEl.scrollTop=0;
    ws.requestSaveLayout();
  }
  async getClosureTagsV1({ signal, onUpdate } = {}) {
    const snapshot = () => {
      const tree = this.index.catalogTree(), palette = D.colors(this);
      return {
        version: 1,
        scope: "experience",
        partial: !!(this.index.pending.size || this.index.queue.size || this.index.scanning),
        tags: tree.tags.map((raw) => {
          const label = A.label(this.owner.data, "experience", raw);
          let path = raw, key;
          while (path && !(key = D.describe(A.label(this.owner.data, "experience", path)).key)) {
            const slash = path.lastIndexOf("/");
            path = slash < 0 ? "" : path.slice(0, slash);
          }
          return { raw, label, count: tree.nodes.get(raw.slice(1))?.count, color: palette.get(key) };
        })
      };
    };
    await this.index.start();
    if (signal && !signal.aborted && this.alive && typeof onUpdate === "function") {
      const notify = () => {
        if (this.alive && !signal.aborted) onUpdate(snapshot());
      };
      this.closureConsumers ?? (this.closureConsumers = /* @__PURE__ */ new Set());
      this.closureConsumers.add(notify);
      this.index.listeners.add(notify);
      signal.addEventListener("abort", () => {
        this.index.listeners.delete(notify);
        this.closureConsumers.delete(notify);
        if (this.alive) this.syncActivity();
      }, { once: true });
      this.syncActivity();
    }
    return snapshot();
  }
  async onload() {
    this.alive = true;
    this.modals = /* @__PURE__ */ new Set();
    this.views = /* @__PURE__ */ new Set();
    this.owner = new Owner(this, await this.loadData() || {});
    const indexPath = this.manifest.dir + "/fragment-index-v2.json";
    this.index = new Index(this.app, this.owner, () => this.refresh(), { load: async () => JSON.parse(await this.app.vault.adapter.read(indexPath)), save: async (text2) => this.app.vault.adapter.write(indexPath, text2) });
    this.transactions = new Transactions(this.app, this.owner, this.manifest.dir, (file) => this.app.workspace.getLeavesOfType("markdown").some((l) => l.view instanceof import_obsidian.MarkdownView && l.view.file === file), (msg) => new import_obsidian.Notice(msg), () => this.alive);
    this.registerView(TYPE, (leaf) => new ExperienceView(leaf, this));
    this.addRibbonIcon("book-open-check", "\u7ECF\u9A8C\u56DE\u770B", () => this.openView());
    this.addCommand({ id: "open", name: "\u6253\u5F00\u7ECF\u9A8C\u56DE\u770B", callback: () => this.openView() });
    this.addCommand({ id: "insert-body-tags", name: "\u6536\u5F55\u7ECF\u9A8C\u7247\u6BB5 / \u6DFB\u52A0\u6807\u7B7E", editorCallback: (editor, view) => this.openPicker(editor, view) });
    this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor, view) => {
      if (view.file) menu.addItem((item) => item.setTitle("\u6536\u5F55\u7ECF\u9A8C\u7247\u6BB5 / \u6DFB\u52A0\u6807\u7B7E").setIcon("tags").onClick(() => this.openPicker(editor, view)));
    }));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      if (this.index.started) {
        this.index.update(file, true);
        this.index.signal();
      }
    }));
    this.registerEvent(this.app.metadataCache.on("resolved", () => {
      if (this.index.started) this.index.resolved();
    }));
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (this.index.started) {
        this.index.update(file, true);
        this.index.signal();
      }
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      this.index.remove(file.path);
      this.owner.delete(file.path).catch((e) => new import_obsidian.Notice(e.message));
    }));
    this.registerEvent(this.app.vault.on("rename", (file, old) => {
      const affected = [...this.index.files].filter(([path]) => path === old || path.startsWith(old + "/")).map(([, f]) => f);
      this.index.remove(old);
      this.owner.move(old, file.path).then(() => this.refresh()).catch((e) => new import_obsidian.Notice(e.message));
      if (this.index.started) {
        for (const f of affected) this.index.update(f, true);
        this.index.update(file, true);
        this.index.signal();
      }
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.syncActivity()));
    this.addSettingTab(new Settings(this.app, this));
  }
  openPicker(editor, view) {
    if (!this.alive || !view.file) return;
    try {
      new TagPicker(this, editor, view).open();
    } catch (e) {
      new import_obsidian.Notice(e.message);
    }
  }
  syncActivity() {
    this.index.activate(this.alive && (this.closureConsumers?.size > 0 || [...this.modals].some((m) => m.indexConsumer && !m.closed) || [...this.views].some((v) => v.opened && this.app.workspace.activeLeaf === v.leaf)));
    for (const v of this.views) if (v.opened && v.leaf === this.app.workspace.activeLeaf) v.refresh();
  }
  async openSource(row, origin) {
    const workspace = this.app.workspace, parent = origin?.parent;
    if (!parent || typeof workspace.iterateAllLeaves !== "function" || typeof workspace.createLeafInParent !== "function" || typeof workspace.setActiveLeaf !== "function") throw Error("\u65E0\u6CD5\u5728\u6807\u7B7E\u672B\u5C3E\u6253\u5F00\uFF1A\u6765\u6E90\u89C6\u56FE\u6216\u6807\u7B7E\u63A5\u53E3\u4E0D\u53EF\u7528\u3002");
    this.sourceRequests ?? (this.sourceRequests = /* @__PURE__ */ new WeakMap());
    const token = (this.sourceRequests.get(origin) || 0) + 1;
    this.sourceRequests.set(origin, token);
    const current = () => this.alive && this.sourceRequests.get(origin) === token && origin.parent === parent && [...this.views].some((v) => v.opened && v.leaf === origin);
    const targetCurrent = () => this.app.vault.getAbstractFileByPath(row.path) === row.file;
    const siblings = () => {
      let registered = false, count2 = 0;
      workspace.iterateAllLeaves((leaf2) => {
        if (leaf2 === origin) registered = true;
        if (leaf2.parent === parent) count2++;
      });
      return registered ? count2 : -1;
    };
    if (!current() || siblings() < 0) throw Error("\u6765\u6E90\u89C6\u56FE\u5DF2\u5173\u95ED\uFF0C\u8BF7\u4ECE\u7ECF\u9A8C\u56DE\u770B\u91CD\u65B0\u6253\u5F00\u539F\u6587\u3002");
    const result = await this.index.readFragment(row);
    if (!current() || !targetCurrent()) return false;
    const count = siblings();
    if (count < 0) return false;
    const line = result.raw.slice(0, result.segment.contentStart).split("\n").length - 1;
    const leaf = workspace.createLeafInParent(parent, count);
    if (!leaf || typeof leaf.openFile !== "function") throw Error("\u65E0\u6CD5\u521B\u5EFA\u539F\u6587\u6807\u7B7E\u9875\u3002");
    await leaf.openFile(row.file, { active: false, eState: { line, focus: false } });
    if (!current() || !targetCurrent() || siblings() < 0 || leaf.parent !== parent || leaf.view?.file !== row.file) return false;
    let attached = false;
    workspace.iterateAllLeaves((item) => {
      if (item === leaf) attached = true;
    });
    if (!attached) return false;
    workspace.setActiveLeaf(leaf, { focus: true });
    return true;
  }
  refresh() {
    for (const view of this.views) view.refresh();
  }
  async openView() {
    const leaf = this.app.workspace.getLeavesOfType(TYPE)[0] || this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  onunload() {
    this.alive = false;
    for (const modal of [...this.modals]) modal.close();
    this.index.stop();
    for (const view of this.views) view.onClose();
  }
};
