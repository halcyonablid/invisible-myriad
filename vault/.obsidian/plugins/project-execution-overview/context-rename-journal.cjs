"use strict";
const { randomUUID } = require("crypto");
const copy = value => JSON.parse(JSON.stringify(value));
const key = value => String(value || "").trim().toLocaleLowerCase();
const terminal = s => ["verified", "no-match", "excluded"].includes(s);
const needsReview = reason => /deleted|edited|conflict|mismatch|invalid|changed|multiple|ambiguous/.test(reason || "");
class RenameJournal {
  constructor(config) {
    this.c = config; this.path = `${config.pluginDir}/context-key-renames.json`;
    this.data = { version: 1, jobs: [] }; this.raw = null; this.queue = Promise.resolve();
    this.closed = false; this.error = ""; this.timers = new Set();
  }
  serial(fn) { const next = this.queue.then(fn, fn); this.queue = next.catch(() => {}); return next; }
  async load() {
    try {
      const a = this.c.adapter;
      if (await a.exists(this.path)) {
        const raw = await a.read(this.path), data = JSON.parse(raw);
        if (data.version !== 1 || !Array.isArray(data.jobs) || data.jobs.some(j => !j.id || !j.primaryNodeKey || !j.newDisplayLabel || !Array.isArray(j.providers))) throw Error("invalid-journal-schema");
        this.raw = raw; this.data = data;
      } else if (await a.exists(`${this.path}.prev`)) throw Error("journal-missing-previous-good-retained");
    } catch (error) { this.error = error.message || "journal-read-failed"; }
    this.changed();
  }
  changed() { this.c.changed?.(this.snapshot()); }
  snapshot() { return { error: this.error, jobs: copy(this.data.jobs) }; }
  async persist() {
    if (this.closed || this.error) throw Error(this.error || "journal-closed");
    const a = this.c.adapter, payload = JSON.stringify(this.data, null, 2);
    try {
      const actual = await a.exists(this.path) ? await a.read(this.path) : null;
      if (actual !== this.raw) throw Error("journal-foreign-change");
      await a.write(`${this.path}.tmp`, payload);
      if (await a.read(`${this.path}.tmp`) !== payload) throw Error("journal-stage-readback-failed");
      if (this.raw !== null) {
        await a.write(`${this.path}.prev`, this.raw);
        if (await a.read(`${this.path}.prev`) !== this.raw) throw Error("journal-backup-readback-failed");
      }
      const again = await a.exists(this.path) ? await a.read(this.path) : null;
      if (again !== this.raw) throw Error("journal-foreign-change");
      // Obsidian adapter.rename rejects an existing destination. Preserve staged
      // and previous bytes; this guarded write/readback is not an atomic replace.
      await a.write(this.path, payload);
      if (await a.read(this.path) !== payload) throw Error("journal-readback-failed");
      this.raw = payload;
    } catch (error) { this.error = error.message || "journal-save-failed"; this.changed(); throw error; }
    this.changed();
  }
  async call(id, request) {
    const api = this.c.api(id);
    if (typeof api?.contextCapsuleRenameV2 !== "function") return { ok: false, reason: "provider-not-ready-or-upgrade-required" };
    try {
      const result = await api.contextCapsuleRenameV2({ ...request, source: "project-execution-overview" });
      if (!result || result.version !== 2) return { ok: false, reason: "provider-contract-version-mismatch" };
      if (result.ok && request.phase === "prepare" && (!result.plan || result.plan.version !== 2 || result.plan.pluginId !== id || !Array.isArray(result.plan.targets) || result.matchedCount !== result.plan.targets.length)) return { ok: false, reason: "provider-plan-invalid" };
      return result;
    }
    catch (error) { return { ok: false, reason: error.message || "provider-failed" }; }
  }
  prior(primaryNodeKey) { return [...this.data.jobs].reverse().find(j => j.primaryNodeKey === primaryNodeKey); }
  async preview(request) {
    if (this.error || this.closed) throw Error(this.error || "journal-closed");
    const prior = this.prior(request.primaryNodeKey);
    const oldLabels = [...new Set([request.oldDisplayLabel, ...(prior?.status !== "complete" ? prior?.oldLabels || [] : []), ...(prior?.status !== "complete" ? [prior?.newDisplayLabel] : [])].filter(Boolean))];
    const providers = [];
    for (const participant of this.c.participants()) {
      if (participant.excluded) { providers.push({ ...participant, state: "excluded", reason: "disabled-at-confirmation" }); continue; }
      const priorProvider = prior?.providers.find(p => p.id === participant.id);
      const previousPlan = prior?.status !== "complete" && priorProvider?.plan?.targets?.length ? priorProvider.plan : null;
      const result = await this.call(participant.id, { phase: "prepare", oldLabels, newDisplayLabel: request.newDisplayLabel, repair: !!request.repair, previousPlan });
      providers.push({ ...participant, state: result.ok ? "prepared" : "pending", reason: result.reason || "", plan: result.ok ? result.plan : null, matchedCount: result.ok ? result.matchedCount : null, attempts: 0, previousPlan });
    }
    return { primaryNodeKey: request.primaryNodeKey, domain: request.domain, oldLabels, oldDisplayLabel: request.oldDisplayLabel || "同编号旧主键", newDisplayLabel: request.newDisplayLabel, repair: !!request.repair, providers, priorId: prior?.id || null };
  }
  current(job) {
    return (!job.managedRename || this.c.managedCurrent?.(job) === true) && !this.closed && !this.error && job.status !== "superseded" && this.prior(job.primaryNodeKey)?.id === job.id && key(this.c.currentLabel(job.primaryNodeKey)) === key(job.newDisplayLabel);
  }
  async authoritative(job) { return (!job.managedRename || await this.c.managedGuard?.(job) === true) && this.current(job) && key(await this.c.savedLabel(job.primaryNodeKey)) === key(job.newDisplayLabel); }
  async confirm(preview) {
    return this.serial(async () => {
      if (this.prior(preview.primaryNodeKey)?.id !== (preview.priorId || undefined)) throw Error("preview-superseded-reopen");
      if (key(this.c.currentLabel(preview.primaryNodeKey)) !== key(preview.newDisplayLabel) || key(await this.c.savedLabel(preview.primaryNodeKey)) !== key(preview.newDisplayLabel)) throw Error("declaration-changed-reopen");
      const job = { ...copy(preview), id: `rename-${randomUUID()}`, confirmedAt: new Date().toISOString(), status: "pending" };
      for (const old of this.data.jobs) if (old.primaryNodeKey === job.primaryNodeKey && old.status !== "superseded") old.status = "superseded";
      this.data.jobs.push(job);
      await this.persist(); // No provider write may precede this durable readback.
      await this.runJob(job);
      return copy(job);
    });
  }
  async runJob(job) {
    if (this.closed || this.error || ["superseded", "complete"].includes(job.status)) return;
    if (!await this.authoritative(job)) { job.status = "paused"; job.reason = "declaration-changed"; await this.persist(); return; }
    job.status = "pending"; job.reason = "";
    for (const provider of job.providers) {
      if (this.closed || this.error) return;
      if (provider.state === "excluded") continue;
      if (provider.state === "review") continue;
      if (!await this.authoritative(job)) { job.status = "paused"; job.reason = "declaration-changed"; await this.persist(); return; }
      try {
        if (!provider.plan) {
          if (job.managedRename) { provider.state = "review"; provider.reason = "managed-frozen-plan-required"; await this.persist(); continue; }
          if (job.repair && !provider.previousPlan) { provider.state = "review"; provider.reason = "repair-preview-required"; await this.persist(); continue; }
          const result = await this.call(provider.id, { phase: "prepare", oldLabels: job.oldLabels, newDisplayLabel: job.newDisplayLabel, previousPlan: provider.previousPlan });
          if (!result.ok) { provider.state = needsReview(result.reason) ? "review" : "pending"; provider.reason = result.reason; provider.attempts++; await this.persist(); continue; }
          provider.plan = result.plan;
          provider.state = "prepared";
          await this.persist(); // Freeze exact carrier before first or resumed mutation.
        }
        const verified = await this.call(provider.id, { phase: "verify", plan: provider.plan });
        if (verified.ok && verified.verified) {
          provider.state = provider.plan.targets.length ? "verified" : "no-match"; provider.reason = verified.uiWarning || "";
        } else if (verified.ok && !terminal(provider.state)) {
          provider.state = "committing"; provider.attempts++; await this.persist();
          if (!await this.authoritative(job)) { job.status = "paused"; job.reason = "declaration-changed"; await this.persist(); return; }
          const receipt = await this.call(provider.id, { phase: "commit", txId: job.id, plan: provider.plan, isCurrent: () => this.current(job) });
          // Always reread, even after a thrown/lost receipt.
          const check = await this.call(provider.id, { phase: "verify", plan: provider.plan });
          provider.state = check.ok && check.verified ? "verified" : needsReview(check.reason) ? "review" : "pending";
          provider.reason = provider.state === "verified" ? (receipt.uiWarning || "") : check.reason || receipt.reason || "awaiting-verification";
        } else {
          provider.state = terminal(provider.state) || needsReview(verified.reason) ? "review" : "pending";
          provider.reason = verified.reason || "post-commit-drift"; provider.attempts++;
        }
      } catch (error) { if (this.error) throw error; provider.state = "pending"; provider.reason = error.message || "retry-required"; }
      await this.persist();
    }
    // Final verification sweep closes races during other provider commits.
    if (job.providers.every(p => terminal(p.state))) {
      for (const p of job.providers.filter(p => p.state !== "excluded")) {
        const check = await this.call(p.id, { phase: "verify", plan: p.plan });
        if (!check.ok || !check.verified) { p.state = "review"; p.reason = check.reason || "final-verification-failed"; }
      }
    }
    job.status = job.providers.every(p => terminal(p.state)) && await this.authoritative(job) ? "complete" : "pending";
    await this.persist();
    if (job.status === "pending" && job.providers.some(p => p.state === "pending" && p.attempts < 3)) this.schedule(10000);
  }
  async retry(id = null) {
    return this.serial(async () => {
      for (const job of this.data.jobs) if ((!id || job.id === id) && !["superseded", "complete"].includes(job.status)) await this.runJob(job);
    });
  }
  schedule(delay = 1500) {
    if (this.closed || this.error || this.timers.size) return;
    const timer = setTimeout(() => { this.timers.delete(timer); this.retry().catch(error => { this.error = error.message; this.changed(); }); }, delay);
    this.timers.add(timer);
  }
  close() { this.closed = true; for (const t of this.timers) clearTimeout(t); this.timers.clear(); }
}
module.exports = { RenameJournal };
