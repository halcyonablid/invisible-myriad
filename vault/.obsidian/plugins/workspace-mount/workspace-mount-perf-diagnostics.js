"use strict";

const MAX_COMPLETED_SPANS = 512;
const MAX_ACTIVE_TASKS = 128;
const MAX_ACTIVE_SPANS = 128;
const MAX_COUNTERS = 64;

function clockNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function createDiagnostics() {
  let scenario = null;
  let nextId = 1;
  const completed = [];
  const activeSpans = new Map();
  const activeTasks = new Map();
  const counters = new Map();
  const invalidReasons = [];
  let droppedCompletedSpans = 0;

  const markInvalid = (reason) => {
    if (!invalidReasons.includes(reason)) invalidReasons.push(reason);
  };

  const startSpan = (name, meta = {}) => {
    if (activeSpans.size >= MAX_ACTIVE_SPANS) {
      markInvalid("active-span-overflow");
      return { id: null, end() {} };
    }
    const id = nextId++;
    const requestedParentId = meta.parentId || null;
    const parentId = requestedParentId && activeSpans.has(requestedParentId) ? requestedParentId : null;
    if (requestedParentId && !parentId) markInvalid("orphan-span-parent");
    const record = { id, parentId, name, meta: Object.assign({}, meta), startedAt: clockNow(), childMs: 0 };
    activeSpans.set(id, record);
    return {
      id,
      end(extra = {}) {
        const current = activeSpans.get(id);
        if (!current) return null;
        activeSpans.delete(id);
        const inclusiveMs = Math.max(0, clockNow() - current.startedAt);
        const result = Object.assign({}, current, extra, {
          inclusiveMs,
          exclusiveMs: Math.max(0, inclusiveMs - current.childMs),
        });
        if (parentId && activeSpans.has(parentId)) {
          activeSpans.get(parentId).childMs += inclusiveMs;
        } else if (parentId) {
          markInvalid("span-parent-ended-before-child");
        }
        if (completed.length >= MAX_COMPLETED_SPANS) {
          completed.shift();
          droppedCompletedSpans += 1;
        }
        completed.push(result);
        return result;
      },
    };
  };

  const beginTask = (name, meta = {}) => {
    if (activeTasks.size >= MAX_ACTIVE_TASKS) {
      markInvalid("active-task-overflow");
      return { id: null, end() {} };
    }
    const id = nextId++;
    activeTasks.set(id, { id, name, meta: Object.assign({}, meta), startedAt: clockNow() });
    return { id, end() { activeTasks.delete(id); } };
  };

  const increment = (name, value = 1) => {
    if (!counters.has(name) && counters.size >= MAX_COUNTERS) {
      markInvalid("counter-overflow");
      return;
    }
    counters.set(name, Number(counters.get(name) || 0) + Number(value || 0));
  };

  const reset = (scenarioId = "") => {
    scenario = scenarioId;
    completed.length = 0;
    activeSpans.clear();
    activeTasks.clear();
    counters.clear();
    invalidReasons.length = 0;
    droppedCompletedSpans = 0;
  };

  const snapshot = () => ({
    scenario,
    valid: invalidReasons.length === 0 && activeTasks.size === 0 && activeSpans.size === 0,
    invalidReasons: invalidReasons.slice(),
    pendingTasks: Array.from(activeTasks.values()).map((entry) => Object.assign({}, entry)),
    activeSpanCount: activeSpans.size,
    completedSpans: completed.map((entry) => Object.assign({}, entry, { meta: Object.assign({}, entry.meta) })),
    counters: Object.fromEntries(counters),
    droppedCompletedSpans,
    limits: { completedSpans: MAX_COMPLETED_SPANS, activeSpans: MAX_ACTIVE_SPANS, activeTasks: MAX_ACTIVE_TASKS, counters: MAX_COUNTERS },
  });

  return { startSpan, beginTask, increment, reset, snapshot, markInvalid };
}

let singleton = null;
function getDiagnostics() {
  if (!singleton) singleton = createDiagnostics();
  return singleton;
}

module.exports = { createDiagnostics, getDiagnostics };
