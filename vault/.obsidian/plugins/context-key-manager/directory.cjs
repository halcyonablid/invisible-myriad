"use strict";
// Read-only consumer. No vault adapter, registry writer, or business state persistence.
const DOMAINS = ["project", "goal", "tracking", "goalTracking"];
const METHODS = {project:"listEffectiveOperationalContextKeys",goal:"listEffectiveGoalOperationalContextKeys",tracking:"listProjectTrackingDirectoryV1",goalTracking:"listGoalTrackingDirectoryV1"};
const TYPES = {project:"mandala-effective-operational-context-keys-v1",goal:"mandala-effective-goal-operational-context-keys-v1"};
function required(x) { return typeof x === "string" && x.trim().length > 0 && x.length <= 8192; }
function reject() { throw Error("invalid-snapshot"); }
function ownerScope(key, domain) {
  if (!required(key) || !key.startsWith("jump:v1:")) reject();
  const encoded = key.slice(8).split("|");
  if (encoded.length !== 5) reject();
  const p = encoded.map(decodeURIComponent);
  if (p.some(x => !required(x)) || encoded.some((s,i)=>encodeURIComponent(p[i])!==s)) reject();
  if (domain === "project" ? p[0] !== "workspace-mount-view" || p[2] !== "tab" :
      p[0] !== "mandala-time-blocks" || p[2] !== "node" || p[3] !== "mandala") reject();
  return p[1];
}
function validateTracking(s, domain="project") {
  const partial = s?.partial === true;
  if (partial) {
    if (s.complete !== false || s.partialContract !== "tracking-directory-isolation-v1" ||
        !Number.isSafeInteger(s.excludedCount) || s.excludedCount < 1 || s.excludedCount > 15000 ||
        !Array.isArray(s.diagnostics) || s.diagnostics.length !== s.excludedCount) reject();
    const buckets = domain === "goal" ? ["nodeStatesByKey","goalPlanRowsByKey"] : ["workspaceNodeStatesByKey","projectPlanRowsByKey"];
    for (const d of s.diagnostics) if (!d || !buckets.includes(d.bucket) ||
      !["invalid-source","invalid-identity","wrong-domain","invalid-status","invalid-label","identity-conflict","related-record-conflict"].includes(d.reason)) reject();
  } else if (s?.complete !== true || (s.excludedCount !== undefined && s.excludedCount !== 0) || (s.diagnostics !== undefined && (!Array.isArray(s.diagnostics) || s.diagnostics.length))) reject();
  if (!s || s.contractVersion!==1 || s.snapshotType!==`mandala-${domain}-tracking-directory-v1` ||
      s.coveredScope!==`current-source-${domain}-tracking-states` || s.ok!==true || (!partial && s.complete!==true) ||
      s.truncated!==false || s.hasMore!==false || !required(s.sourceScope) || !required(s.providerGeneration) ||
      !required(s.revision) || !Array.isArray(s.items) || s.limit!==5000 || s.items.length>s.limit ||
      [s.count,s.returnedCount,s.totalCount].some(n=>!Number.isSafeInteger(n)||n!==s.items.length)) reject();
  const seen=new Set();
  return s.items.map(t=>{
    if(!t || t.domain!==domain || t.sourceNotePath!==s.sourceScope || !["active","stopped"].includes(t.tracking?.status))reject();
    const ownerSourceScope=ownerScope(t.nodeKey,domain),identity=JSON.stringify([domain,s.sourceScope,t.nodeKey]);
    if(domain==="goal"&&ownerSourceScope!==s.sourceScope)reject();
    if(seen.has(identity))reject();seen.add(identity);
    const label=required(t.lastKnownLabel)&&t.lastKnownLabel!==t.nodeKey&&!/^(item_|tab_ws_|jump:v1:)/.test(t.lastKnownLabel)?t.lastKnownLabel:"名称不可用";
    return Object.freeze({identity,domain,label,providerScope:s.sourceScope,ownerSourceScope,nodeKey:t.nodeKey,trackingStatus:t.tracking.status});
  });
}
function validate(snapshot, domain) {
  if(domain==="tracking"||domain==="goalTracking")return validateTracking(snapshot,domain==="goalTracking"?"goal":"project");
  if (!snapshot || snapshot.ok !== true || snapshot.complete !== true || snapshot.contractVersion !== 1 ||
      snapshot.snapshotType !== TYPES[domain] || snapshot.hasMore !== false || snapshot.truncated !== false ||
      !required(snapshot.sourceScope) || !required(snapshot.providerGeneration) || !required(snapshot.revision) ||
      !Array.isArray(snapshot.targets) || snapshot.targets.length > 5000 ||
      snapshot.count !== snapshot.targets.length || snapshot.returnedCount !== snapshot.targets.length ||
      !Number.isSafeInteger(snapshot.totalCount) || snapshot.totalCount < snapshot.targets.length) reject();
  const seen = new Set();
  return snapshot.targets.map(t => {
    if (!t || t.domain !== domain || t.sourceType !== domain || t.sourcePlugin !== "mandala-time-blocks" ||
        t.identityVersion !== 1 || t.sourceScope !== snapshot.sourceScope || t.active !== true || t.lifecycleState !== "active") reject();
    const ownerSourceScope = ownerScope(t.sourceKey,domain), identity = JSON.stringify([domain,t.sourceScope,t.sourceKey]);
    if (seen.has(identity)) reject(); seen.add(identity);
    const label = required(t.label) && t.label !== t.sourceKey && !/^(item_|tab_ws_|jump:v1:)/.test(t.label) ? t.label : "名称不可用";
    return Object.freeze({identity,domain,label,providerScope:t.sourceScope,ownerSourceScope,nodeKey:t.sourceKey});
  });
}
class Directory {
  constructor(getApi,{timeoutMs=10000}={}) {
    this.getApi=getApi;this.timeoutMs=timeoutMs;this.busy=false;this.closed=false;this.listeners=new Set();this.timers=new Set();
    this.state=Object.fromEntries(DOMAINS.map(d=>[d,{status:"idle",rows:[]}]));this.tracing=false;this.samples=[];this.sequence=0;
  }
  subscribe(fn) { this.listeners.add(fn); return ()=>this.listeners.delete(fn); }
  emit() { if(!this.closed) for(const fn of this.listeners) {try{fn();}catch{ /* one view must not strand shared work */ }} }
  diagnostics(enabled) { this.tracing=enabled===true;this.samples=[]; }
  refresh() {
    if(this.closed) return Promise.resolve();
    if(this.busy) return this.flight;
    this.busy=true;const api=this.getApi(),sequence=++this.sequence,started=Date.now(),sample=this.tracing;
    for(const d of DOMAINS)this.state[d]={status:"loading",rows:[]};
    // Defer provider work to install the shared flight before notifying views.
    this.flight=Promise.resolve().then(()=>Promise.all(DOMAINS.map(async domain=>{
      if(this.closed)return;
      if(typeof api?.[METHODS[domain]]!=="function") {this.state[domain]={status:"missing",rows:[]};this.emit();return;}
      let timedOut=false;
      const timer=setTimeout(()=>{this.timers.delete(timer);timedOut=true;if(!this.closed){this.state[domain]={status:"timeout",rows:[]};this.emit();}},this.timeoutMs);
      this.timers.add(timer);
      try {
        const snapshot=await api[METHODS[domain]]({source:"context-key-manager"});
        if(this.closed||timedOut)return;
        if(this.getApi()!==api) {this.state[domain]={status:"changed",rows:[]};return;}
        const rows=validate(snapshot,domain);
        this.state[domain]={status:"ready",rows,api,revision:snapshot.revision,generation:snapshot.providerGeneration,partial:snapshot.partial===true,excludedCount:snapshot.excludedCount||0,diagnostics:snapshot.diagnostics||[]};
      } catch (error) {if(!this.closed&&!timedOut)this.state[domain]={status:"unavailable",rows:[],error:String(error?.code||error?.message||"query-failed").slice(0,160)};}
      finally {clearTimeout(timer);this.timers.delete(timer);this.emit();}
    }))).finally(()=>{
      this.busy=false;
      if(sample&&this.tracing&&!this.closed){this.samples.push({sequence,ms:Date.now()-started,domains:DOMAINS.map(d=>({domain:d,status:this.state[d].status,count:this.state[d].rows.length}))});if(this.samples.length>20)this.samples.shift();}
      this.emit();
    });
    this.emit();return this.flight;
  }
  dispose(){this.closed=true;for(const t of this.timers)clearTimeout(t);this.timers.clear();this.listeners.clear();this.samples=[];}
}
module.exports={Directory,validate,ownerScope};
