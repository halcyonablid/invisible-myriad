"use strict";
// P2-B candidate model. No production authority or migration.
const plain = x => x !== null && typeof x === "object" && !Array.isArray(x);
const copy = x => JSON.parse(JSON.stringify(x));
const norm = x => x.toLocaleLowerCase();
const fail = reason => { throw Error(reason); };
function string(x) { return typeof x === "string" && x.length > 0 && x.length <= 4096 && x === x.trim(); }
function fields(x, names) { if (!plain(x) || Object.keys(x).length !== names.length || names.some(n => !Object.hasOwn(x, n))) fail("schema-fields-invalid"); }
function strings(values) { if (!Array.isArray(values) || values.some(x => !string(x))) fail("string-array-invalid"); }
function unique(values, reason) { if (new Set(values).size !== values.length) fail(reason); }
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function id(value) { return typeof value === "string" && /^ctx_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value); }
function scope(value) { return string(value) && !/^(?:[a-z]:|\/)/i.test(value) && !value.includes("\\") && !value.split("/").some(p => ["", ".", ".."].includes(p)); }
function subjectKey(s) {
  fields(s, ["domain", "ownerId", "sourceScope", "primaryNodeKey"]);
  if (!scope(s.sourceScope) || !string(s.primaryNodeKey) || !s.primaryNodeKey.startsWith("jump:v1:")) fail("subject-invalid");
  let parts;
  try { parts = s.primaryNodeKey.slice(8).split("|").map(decodeURIComponent); } catch (_) { fail("subject-escape-invalid"); }
  if (parts.length !== 5 || parts.some(p => !string(p)) || parts[1] !== s.sourceScope) fail("subject-source-invalid");
  if (parts.map(encodeURIComponent).join("|") !== s.primaryNodeKey.slice(8)) fail("subject-noncanonical-encoding");
  if (!(s.domain === "project" && s.ownerId === "workspace-mount" && parts[0] === "workspace-mount-view" && parts[2] === "tab") &&
      !(s.domain === "goal" && s.ownerId === "mandala-time-blocks" && parts[0] === "mandala-time-blocks" && parts[2] === "node" && parts[3] === "mandala")) fail("subject-domain-invalid");
  return JSON.stringify([s.domain, s.ownerId, s.sourceScope, s.primaryNodeKey]);
}
function bindingKey(b) {
  fields(b, ["ownerId", "sourceScope", "carrierId"]);
  if (!["workspace-mount", "collection-card-view", "gtd-task-manager"].includes(b.ownerId) || !scope(b.sourceScope) || !string(b.carrierId)) fail("binding-invalid");
  return JSON.stringify([b.ownerId, b.sourceScope, b.carrierId]);
}
function validate(state) {
  fields(state, ["schemaVersion", "namespace", "revision", "contexts", "reservedIds"]);
  if (state.schemaVersion !== 1 || !string(state.namespace) || !Number.isSafeInteger(state.revision) || state.revision < 0 || !Array.isArray(state.contexts) || !Array.isArray(state.reservedIds)) fail("registry-schema-invalid");
  if (state.reservedIds.some(x => !id(x))) fail("reserved-id-invalid");
  unique(state.reservedIds, "reserved-id-duplicate");
  const subjects = [], bindings = [], ids = [];
  for (const c of state.contexts) {
    fields(c, ["contextId", "canonicalLabel", "aliases", "subjects", "bindings"]);
    if (!id(c.contextId) || !state.reservedIds.includes(c.contextId) || !string(c.canonicalLabel) || !Array.isArray(c.subjects) || c.subjects.length !== 1 || !Array.isArray(c.bindings)) fail("context-schema-invalid");
    strings(c.aliases); unique([c.canonicalLabel, ...c.aliases].map(norm), "alias-duplicate");
    ids.push(c.contextId); subjects.push(...c.subjects.map(subjectKey)); bindings.push(...c.bindings.map(bindingKey));
  }
  unique(ids, "context-id-duplicate"); unique(subjects, "subject-already-bound"); unique(bindings, "consumer-already-bound");
  return state;
}
function empty(namespace) { return freeze(validate({ schemaVersion: 1, namespace, revision: 0, contexts: [], reservedIds: [] })); }
function reopen(serialized, namespace) {
  const state = validate(JSON.parse(serialized));
  if (state.namespace !== namespace) fail("namespace-mismatch");
  return freeze(state);
}
function apply(state, input) {
  validate(state);
  if (!plain(input) || input.namespace !== state.namespace) fail("namespace-mismatch");
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision !== state.revision) fail("revision-conflict");
  const next = copy(state), command = copy(input);
  if (command.kind === "register") {
    if (!id(command.contextId) || next.reservedIds.includes(command.contextId)) fail("context-id-reserved-or-invalid");
    next.contexts.push({ contextId: command.contextId, canonicalLabel: command.canonicalLabel, aliases: [], subjects: command.subjects, bindings: command.bindings });
    next.reservedIds.push(command.contextId);
  } else {
    const c = next.contexts.find(x => x.contextId === command.contextId);
    if (!c) fail("context-not-found");
    if (command.kind === "bind") {
      if (!Array.isArray(command.subjects) || !Array.isArray(command.bindings) || !(command.subjects.length + command.bindings.length)) fail("empty-binding-command");
      if (command.subjects.length) fail("subject-merge-not-supported");
      c.bindings.push(...command.bindings);
    } else fail("command-unsupported");
  }
  next.revision++;
  return freeze(validate(next));
}
function resolveLegacy(state, query) {
  validate(state);
  if (!plain(query) || query.namespace !== state.namespace) fail("namespace-mismatch");
  if (!string(query.label) || !scope(query.sourceScope) || !["project", "goal"].includes(query.domain) ||
      query.ownerId !== (query.domain === "project" ? "workspace-mount" : "mandala-time-blocks")) fail("resolve-scope-invalid");
  if (query.primaryNodeKey !== undefined) subjectKey({ domain: query.domain, ownerId: query.ownerId, sourceScope: query.sourceScope, primaryNodeKey: query.primaryNodeKey });
  const matches = state.contexts.filter(c => [c.canonicalLabel, ...c.aliases].some(l => norm(l) === norm(query.label)) && c.subjects.some(s =>
    s.domain === query.domain && s.ownerId === query.ownerId && s.sourceScope === query.sourceScope &&
    (query.primaryNodeKey === undefined || s.primaryNodeKey === query.primaryNodeKey))).map(c => c.contextId);
  return freeze({ status: matches.length === 1 ? "resolved" : matches.length ? "ambiguous" : "not-found", contextIds: matches, revision: state.revision });
}
module.exports = { empty, reopen, validate, apply, resolveLegacy, subjectKey, bindingKey };
