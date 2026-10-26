"use strict";
// Internal P2-C state machine. No runtime installation or authority activation API.
const legacy = require('./identity-model.cjs');
const {hash} = require('./v3-store.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const fail = x => { throw Error(x); };
const same = (a,b) => hash(a) === hash(b);
const digest = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const uuid = x => typeof x === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const fields = (x, keys) => { if (!x || Array.isArray(x) || Object.keys(x).sort().join('|') !== [...keys].sort().join('|')) fail('naming-schema-invalid'); };
function bare(s) { return {...copy(s),schemaVersion:1,contexts:s.contexts.map(({naming,...c})=>copy(c))}; }
function label(x) { return typeof x === 'string' && x.length>0 && x.length<=4096 && x===x.trim() && !/[\r\n]/.test(x) && x!=='---'; }
function address(x) { return x.match(/^([0-9][0-9A-Za-z]*)\s*[-－—]/)?.[1] || null; }
function scope(x){return typeof x==='string'&&x.length>0&&x.length<=4096&&x===x.trim()&&!/^(?:[a-z]:|\/)/i.test(x)&&!x.includes('\\')&&!x.split('/').some(p=>['','.','..'].includes(p));}
function validatePlans(c, plans, newLabel=null, oldLabel=null) {
  if (!Array.isArray(plans) || plans.length<1 || plans.length>6 || Buffer.byteLength(JSON.stringify(plans))>128*1024) fail('projection-plans-invalid');
  const subject=c.subjects[0], required=['peo-declaration','workspace-mount','gtd-task-manager','collection-card-view'];
  if(subject.domain==='goal')required.unshift('mandala-primary');
  if(plans.map(p=>p.id).join('|')!==required.join('|'))fail('projection-steps-incomplete');
  const covered=[];
  for(const p of plans) {
    fields(p,['id','ownerId','subject','bindings','plan']);
    const owner=p.id==='peo-declaration'?'project-execution-overview':p.id==='mandala-primary'?'mandala-time-blocks':p.id;
    if(p.ownerId!==owner || !Array.isArray(p.bindings) || !p.plan || typeof p.plan!=='object' || Array.isArray(p.plan))fail('projection-plan-invalid');
    if(newLabel!==null && (p.plan.newDisplayLabel??p.plan.newLabel)!==newLabel)fail('projection-label-mismatch');
    if(oldLabel!==null && !(p.plan.oldLabel===oldLabel||p.plan.search?.oldLabels?.includes(oldLabel)))fail('projection-old-label-mismatch');
    if(['peo-declaration','mandala-primary'].includes(p.id)) {
      if(!same(p.subject,subject)||p.bindings.length)fail('projection-subject-mismatch');
      if(p.id==='mandala-primary'&&[2,3].includes(p.plan.version)){
        require('./primary-plan.cjs').validate(p.plan);
        if(!same(p.plan.subject,subject))fail('projection-primary-plan-invalid');
      }else if(p.id==='peo-declaration'&&p.plan.version===2){
        require('./primary-plan.cjs').validatePeoLegacy(p.plan);
        if(!same(p.plan.subject,subject))fail('projection-primary-plan-invalid');
      }else{
        fields(p.plan,['version','ownerId','subject','oldLabel','newLabel','preconditionHash','receiptKey']);
        if(p.plan.version!==1||p.plan.ownerId!==owner||!same(p.plan.subject,subject)||!digest(p.plan.preconditionHash)||!digest(p.plan.receiptKey))fail('projection-primary-plan-invalid');
      }
    } else {
      if(p.subject!==null || p.bindings.some(b=>b.ownerId!==owner))fail('projection-binding-mismatch');covered.push(...p.bindings.map(legacy.bindingKey));
      const v=p.plan;fields(v,['version','pluginId','scope','newDisplayLabel','targets','search']);
      fields(v.scope,['sourceNotePath','dataPath','keywordPath']);fields(v.search,['oldLabels','repair']);
      if(v.version!==2||v.pluginId!==owner||!Object.values(v.scope).every(scope)||v.scope.dataPath===v.scope.keywordPath||!Array.isArray(v.targets)||v.targets.length>1||!Array.isArray(v.search.oldLabels)||v.search.repair!==false||v.search.oldLabels.length!==1||v.search.oldLabels[0]!==oldLabel)fail('projection-owner-plan-invalid');
      const refs=[];
      for(const t of v.targets){fields(t,['carrierId','oldLabels','recordHash','storageKey']);if(!digest(t.recordHash)||!Array.isArray(t.oldLabels)||t.oldLabels.length!==1||t.oldLabels[0]!==oldLabel||typeof t.storageKey!=='string'||t.storageKey!==oldLabel.toLocaleLowerCase())fail('projection-target-invalid');refs.push({ownerId:owner,sourceScope:v.scope.sourceNotePath,carrierId:t.carrierId});}
      if(!same(refs.map(legacy.bindingKey).sort(),p.bindings.map(legacy.bindingKey).sort()))fail('projection-owner-binding-mismatch');
    }
    // Owner plans contain only frozen write semantics, hashes and receipt keys.
    // Business bodies/comments/weekly records belong to their original owners.
    const scan=x=>{for(const [k,v] of Object.entries(x)){if(/^(comment|body|content|weeklyRecords|commentsByNodeKey)$/i.test(k))fail('projection-content-forbidden');if(v&&typeof v==='object')scan(v);}};scan(p.plan);
  }
  if(subject.domain==='goal'){
    const a=plans.find(p=>p.id==='mandala-primary').plan.legacy,b=plans.find(p=>p.id==='peo-declaration').plan.legacy;
    if(Boolean(a)!==Boolean(b)||a&&a.lineageHash!==b.lineageHash)fail('projection-legacy-lineage-mismatch');
  }
  if(!same(covered.sort(),c.bindings.map(legacy.bindingKey).sort()))fail('projection-bindings-incomplete');
}
function validate(s) {
  if(s.schemaVersion===1)return legacy.validate(s);
  if(s.schemaVersion!==2)fail('naming-version-invalid');
  legacy.validate(bare(s));
  for(const c of s.contexts) {
    fields(c,['contextId','canonicalLabel','aliases','subjects','bindings','naming']);
    fields(c.naming,['authority','proofHash','pending']);
    const n=c.naming;
    if(!['legacy','center'].includes(n.authority) || (n.authority==='legacy' ? n.proofHash!==null || n.pending!==null : !digest(n.proofHash)))fail('naming-authority-invalid');
    if(n.pending) {
      const p=n.pending; fields(p,['txId','oldLabel','newLabel','plans','progress']);
      if(!uuid(p.txId)||!label(p.oldLabel)||p.newLabel!==c.canonicalLabel||!label(p.newLabel)||!Array.isArray(p.progress))fail('naming-pending-invalid');
      validatePlans(c,p.plans,p.newLabel,p.oldLabel);
      if(p.progress.length!==p.plans.length)fail('projection-progress-invalid');
      for(const r of p.progress){fields(r,['attempts','verified','receiptHash']);if(!Number.isSafeInteger(r.attempts)||r.attempts<0||r.attempts>128||typeof r.verified!=='boolean'||(r.verified?!digest(r.receiptHash):r.receiptHash!==null))fail('projection-progress-invalid');}
    }
  }
  return s;
}
function apply(state, input) {
  validate(state);const q=copy(input),s=copy(state);
  if(q.namespace!==s.namespace)fail('namespace-mismatch');
  if(q.expectedRevision!==s.revision)fail('revision-conflict');
  if(q.kind==='register-identity') {
    if(s.schemaVersion!==2)fail('registration-v4-required');
    if(!Array.isArray(q.subjects)||q.subjects.length!==1)fail('registration-subject-invalid');
    require('./primary-plan.cjs').strictSubject(q.subjects[0],'registration-subject-invalid');
    const next=legacy.apply(bare(s),{...q,kind:'register'});
    return validate({...copy(next),schemaVersion:2,contexts:next.contexts.map(c=>({...copy(c),naming:copy(s.contexts.find(old=>old.contextId===c.contextId)?.naming||{authority:'legacy',proofHash:null,pending:null})}))});
  }
  if(q.kind==='upgrade-naming') {
    if(s.schemaVersion!==1)fail('already-upgraded');
    s.schemaVersion=2;s.contexts=s.contexts.map(c=>({...c,naming:{authority:'legacy',proofHash:null,pending:null}}));
  } else {
    if(s.schemaVersion!==2)fail('naming-upgrade-required');
    const c=s.contexts.find(c=>c.contextId===q.contextId);if(!c)fail('context-not-found');
    const n=c.naming;
    if(q.kind==='claim-naming') {
      if(n.authority!=='legacy'||n.pending)fail('authority-already-transferred');
      if(q.label!==c.canonicalLabel||!same(q.subject,c.subjects[0])||!same(q.bindings,c.bindings)||!digest(q.proofHash))fail('claim-evidence-mismatch');
      // Enforced here so WAL replay and every caller apply the same strict rule (C1 R10/R2).
      require('./primary-plan.cjs').strictSubject(c.subjects[0],'claim-subject-invalid');
      if(new Set(c.bindings.map(b=>b.ownerId)).size!==c.bindings.length)fail('claim-multiple-bindings');
      n.authority='center';n.proofHash=q.proofHash;
    } else if(q.kind==='rename') {
      if(n.authority!=='center')fail('center-authority-required');
      if(n.pending)fail('projection-pending');
      if(!label(q.newLabel)||q.newLabel.toLocaleLowerCase()===c.canonicalLabel.toLocaleLowerCase()||address(q.newLabel)!==address(c.canonicalLabel))fail('rename-label-invalid');
      if(!uuid(q.txId))fail('rename-tx-invalid');validatePlans(c,q.plans,q.newLabel,c.canonicalLabel);
      const oldLabel=c.canonicalLabel;
      c.aliases=[...c.aliases,oldLabel].filter(x=>x.toLocaleLowerCase()!==q.newLabel.toLocaleLowerCase());
      if(c.aliases.length>128)fail('alias-capacity');
      c.canonicalLabel=q.newLabel;
      n.pending={txId:q.txId,oldLabel,newLabel:q.newLabel,plans:q.plans,progress:q.plans.map(()=>({attempts:0,verified:false,receiptHash:null}))};
    } else if(['attempt','verified','finish'].includes(q.kind)) {
      const p=n.pending;if(!p||p.txId!==q.txId)fail('projection-tx-mismatch');
      if(q.kind==='finish'){if(p.progress.some(r=>!r.verified))fail('projection-incomplete');n.pending=null;}
      else {
        if(!Number.isSafeInteger(q.step)||q.step<0||q.step>=p.progress.length)fail('projection-step-invalid');
        if(p.progress.slice(0,q.step).some(r=>!r.verified))fail('projection-step-order');
        const r=p.progress[q.step];if(r.verified)fail('projection-already-verified');
        if(q.kind==='attempt'){if(r.attempts>=128)fail('projection-attempt-capacity');r.attempts++;}
        else {if(!digest(q.receiptHash))fail('projection-receipt-invalid');r.verified=true;r.receiptHash=q.receiptHash;}
      }
    } else fail('naming-command-unsupported');
  }
  s.revision++;return validate(s);
}
module.exports={validate,apply,validatePlans,bare,label,address};
