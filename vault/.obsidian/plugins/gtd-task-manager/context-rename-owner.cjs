"use strict";
// Installed with each consumer. Only the owning plugin supplies paths and schema.
const { createHash, randomUUID } = require("crypto");
const STAMP = Symbol.for("contextKeyRenameGeneration");
const key = value => String(value || "").trim().toLocaleLowerCase();
const plain = value => !!value && typeof value === "object" && !Array.isArray(value);
const hash = value => createHash("sha256").update(value).digest("hex");
const clone = value => JSON.parse(JSON.stringify(value));
const address = value => key(String(value || "").match(/^([0-9]{1,4}[A-Za-z0-9]*)\s*[-－—–]\s*/)?.[1]);
function fail(reason) { throw new Error(reason); }
function fingerprint(record) {
  const copy = { ...record };
  delete copy.keyword; delete copy.keywordKey; delete copy.updatedAt;
  return hash(JSON.stringify(copy));
}
class RenameOwner {
  constructor(config) { this.c = config; this.queues = new Map(); this.guards = new Map(); this.generations = new Map(); this.epoch = randomUUID(); }
  token(scope) { return `${this.epoch}:${scope.keywordPath}:${this.generations.get(scope.keywordPath) || 0}`; }
  stamp(data, scope, capturedToken = this.token(scope)) { Object.defineProperty(data, STAMP, { value: capturedToken, configurable: true }); return data; }
  enqueue(scope, task) {
    if (this.c.enqueue) return this.c.enqueue(scope, task);
    const next = (this.queues.get(scope.dataPath) || Promise.resolve()).then(task, task);
    this.queues.set(scope.dataPath, next.catch(() => {}));
    return next;
  }
  assertLive() { if (this.c.closed?.()) fail("owner-unloaded"); }
  async read(scope) {
    this.assertLive();
    this.c.assertCurrentScope?.(scope);
    const { adapter } = this.c.app.vault;
    if (!scope?.sourceNotePath || !scope.keywordPath || !scope.dataPath) fail("source-unresolved");
    if (!await adapter.exists(scope.sourceNotePath) && this.c.allowMissingSource?.(scope) !== true) fail("source-note-missing");
    const carriers = JSON.parse(await adapter.read(scope.dataPath));
    if (!plain(carriers[this.c.carriers])) fail("carrier-schema-invalid");
    const raw = await adapter.exists(scope.keywordPath) ? await adapter.read(scope.keywordPath) : null;
    const data = raw === null ? { [this.c.map]: {} } : JSON.parse(raw);
    if (!plain(data) || !plain(data[this.c.map])) fail("keyword-schema-invalid");
    for (const [k, entry] of Object.entries(data[this.c.map])) {
      if (!plain(entry) || !key(entry.keyword) || !key(entry[this.c.id]) || key(k) !== key(entry.keyword)) fail("keyword-entry-invalid");
      if (entry.sourceNotePath && entry.sourceNotePath !== scope.sourceNotePath) fail("entry-source-mismatch");
    }
    this.assertLive();
    this.c.assertCurrentScope?.(scope);
    return { raw, data, carriers: carriers[this.c.carriers] };
  }
  async scope(request) {
    const scope = await this.c.resolve();
    if (request.plan && JSON.stringify(request.plan.scope) !== JSON.stringify(scope)) fail("source-scope-changed");
    return scope;
  }
  async prepare(request, scope) {
    const state = await this.read(scope);
    const labels = (request.oldLabels || [request.oldDisplayLabel]).filter(Boolean);
    const oldKeys = new Set(labels.map(key));
    const newLabel = String(request.newDisplayLabel || "").trim();
    if (!newLabel) fail("missing-new-label");
    const targetAddress = address(newLabel);
    if (request.repair && !targetAddress) fail("missing-repair-address");
    let targets;
    if (request.previousPlan) {
      const prior = request.previousPlan;
      if (prior.pluginId !== this.c.pluginId || JSON.stringify(prior.scope) !== JSON.stringify(scope)) fail("prior-source-mismatch");
      targets = prior.targets.map(t => ({ ...t, oldLabels: [...new Set([...t.oldLabels, prior.newDisplayLabel])] }));
    } else {
      targets = Object.entries(state.data[this.c.map]).filter(([, e]) => request.repair
        ? address(e.keyword) === targetAddress && key(e.keyword) !== key(newLabel)
        : oldKeys.has(key(e.keyword))).map(([storageKey, entry]) => ({
          carrierId: String(entry[this.c.id]), oldLabels: [entry.keyword], recordHash: fingerprint(entry), storageKey,
        }));
    }
    if (targets.length > 1) fail("multiple-carriers-review-required");
    const plan = { version: 2, pluginId: this.c.pluginId, scope: clone(scope), newDisplayLabel: newLabel, targets: clone(targets), search: { oldLabels: labels, repair: !!request.repair } };
    this.inspect(plan, state);
    return { ok: true, version: 2, plan, matchedCount: targets.length, reason: targets.length ? "prepared" : "no-match" };
  }
  inspect(plan, state) {
    if (plan.version !== 2 || plan.pluginId !== this.c.pluginId || !Array.isArray(plan.targets) || plan.targets.length > 1) fail("invalid-plan");
    const entries = state.data[this.c.map];
    if (!plan.targets.length) {
      if (!plan.search || !Array.isArray(plan.search.oldLabels)) fail("invalid-empty-plan");
      const old = new Set(plan.search.oldLabels.map(key));
      if (Object.values(entries).some(e => plan.search.repair ? address(e.keyword) === address(plan.newDisplayLabel) && key(e.keyword) !== key(plan.newDisplayLabel) : old.has(key(e.keyword)))) fail("no-match-changed-review-required");
    }
    const changes = [];
    for (const target of plan.targets) {
      if (!state.carriers[target.carrierId]) fail("carrier-deleted");
      const allowed = new Set([...target.oldLabels, plan.newDisplayLabel].map(key));
      const found = Object.entries(entries).filter(([, e]) => String(e[this.c.id]) === target.carrierId && allowed.has(key(e.keyword)));
      if (found.length !== 1) fail(found.length ? "ambiguous-carrier-bindings" : "binding-deleted-or-edited");
      const [oldKey, entry] = found[0];
      if (fingerprint(entry) !== target.recordHash) fail("carrier-binding-changed");
      const collision = entries[key(plan.newDisplayLabel)];
      if (collision && String(collision[this.c.id]) !== target.carrierId) fail("target-label-conflict");
      if (key(entry.keyword) !== key(plan.newDisplayLabel)) changes.push({ oldKey, entry, target });
    }
    return changes;
  }
  async assertFreshSave(scope, candidate) {
    const guards = this.guards.get(scope.keywordPath) || [];
    if (!guards.length) return;
    const state = await this.read(scope);
    for (const guard of guards) {
      const current = state.data[this.c.map][key(guard.newLabel)];
      if (!current || String(current[this.c.id]) !== guard.carrierId) continue;
      const values = Object.values(candidate[this.c.map] || {});
      const stale = values.some(e => String(e[this.c.id]) === guard.carrierId && guard.oldLabels.map(key).includes(key(e.keyword)));
      const kept = values.some(e => String(e[this.c.id]) === guard.carrierId && key(e.keyword) === key(guard.newLabel));
      if (stale || (!kept && candidate[STAMP] !== this.token(scope))) fail("stale-keyword-save-reopen-editor");
    }
  }
  protect(plan) {
    const guards = this.guards.get(plan.scope.keywordPath) || [];
    let changed = false;
    for (const t of plan.targets) {
      const old = guards.find(g => g.carrierId === t.carrierId);
      if (old) { changed ||= old.newLabel !== plan.newDisplayLabel; old.oldLabels = [...new Set([...old.oldLabels, old.newLabel, ...t.oldLabels])].filter(label => key(label) !== key(plan.newDisplayLabel)); old.newLabel = plan.newDisplayLabel; }
      else { changed = true; guards.push({ carrierId: t.carrierId, oldLabels: t.oldLabels.filter(label => key(label) !== key(plan.newDisplayLabel)), newLabel: plan.newDisplayLabel }); }
    }
    if (changed) this.generations.set(plan.scope.keywordPath, (this.generations.get(plan.scope.keywordPath) || 0) + 1);
    this.guards.set(plan.scope.keywordPath, guards);
  }
  async run(request = {}) {
    if (request.source !== "project-execution-overview") return { ok: false, reason: "unsupported-source" };
    try {
      const scope = await this.scope(request);
      return await this.enqueue(scope, async () => {
        this.assertLive();
        if (request.phase === "prepare") return this.prepare(request, scope);
        const plan = request.plan;
        if (!plan) fail("missing-plan");
        const state = await this.read(scope);
        const changes = this.inspect(plan, state);
        if (request.phase === "verify") {
          let uiWarning = "";
          if (!changes.length && plan.targets.length) {
            this.protect(plan);
            try { await this.c.publish?.(scope, this.stamp(state.data, scope)); } catch (error) { uiWarning = error.message || "view-refresh-failed"; }
          }
          return { ok: true, version: 2, verified: changes.length === 0, count: plan.targets.length, reason: changes.length ? "old-label-remains" : "verified", uiWarning };
        }
        if (request.phase !== "commit" || typeof request.isCurrent !== "function") fail("invalid-commit");
        if (!request.isCurrent()) fail("superseded-or-declaration-changed");
        if (changes.length) {
          if (!/^[a-zA-Z0-9_-]+$/.test(request.txId || "")) fail("invalid-transaction-id");
          if (typeof this.c.process !== "function") fail("center-final-writer-unavailable");
          const next = clone(state.data);
          for (const change of changes) {
            delete next[this.c.map][change.oldKey];
            const updated = { ...change.entry, keyword: plan.newDisplayLabel };
            if (Object.hasOwn(updated, "keywordKey")) updated.keywordKey = key(plan.newDisplayLabel);
            if (Object.hasOwn(updated, "updatedAt")) updated.updatedAt = new Date().toISOString();
            next[this.c.map][key(plan.newDisplayLabel)] = updated;
          }
          if (Object.hasOwn(next, "updatedAt")) next.updatedAt = new Date().toISOString();
          const backupRoot = `${this.c.pluginDir}/rename-backups`;
          const adapter = this.c.app.vault.adapter;
          if (!await adapter.exists(backupRoot)) await adapter.mkdir(backupRoot);
          const backup = `${backupRoot}/${request.txId}-${hash(scope.keywordPath).slice(0, 12)}-${hash(state.raw).slice(0, 12)}.json`;
          if (!await adapter.exists(backup)) await adapter.write(backup, state.raw);
          if (await adapter.read(backup) !== state.raw) fail("backup-verification-failed");
          const file = this.c.app.vault.getAbstractFileByPath(scope.keywordPath);
          if (!file) fail("keyword-file-disappeared");
          const carrierRaw = await adapter.read(scope.dataPath);
          if (!plain(JSON.parse(carrierRaw)[this.c.carriers])) fail("carrier-schema-invalid");
          for (const t of plan.targets) if (!JSON.parse(carrierRaw)[this.c.carriers][t.carrierId]) fail("carrier-deleted");
          this.protect(plan); // Also protects ambiguous acknowledgement/readback failures.
          try {
            await this.c.process(scope, current => {
              this.assertLive();
              this.c.assertCurrentScope?.(scope);
              if (this.c.currentSource && this.c.currentSource() !== scope.sourceNotePath) fail("source-scope-changed");
              if (!request.isCurrent()) fail("superseded-or-declaration-changed");
              if (current !== state.raw) fail("keyword-revision-conflict");
              return JSON.stringify(next, null, 2);
            });
          } finally {
            // Any read overlapping the mutation (including a lost write acknowledgement)
            // must not certify a fresh editable snapshot.
            this.generations.set(scope.keywordPath, (this.generations.get(scope.keywordPath) || 0) + 1);
          }
        }
        const confirmed = await this.read(scope);
        if (this.inspect(plan, confirmed).length) fail("readback-mismatch");
        this.protect(plan);
        let uiWarning = "";
        try { await this.c.publish?.(scope, this.stamp(confirmed.data, scope)); } catch (error) { uiWarning = error.message || "view-refresh-failed"; }
        return { ok: true, version: 2, verified: true, count: plan.targets.length, uiWarning };
      });
    } catch (error) { return { ok: false, version: 2, verified: false, reason: error.message || "owner-failed" }; }
  }
}
module.exports = { RenameOwner, key, hash };
