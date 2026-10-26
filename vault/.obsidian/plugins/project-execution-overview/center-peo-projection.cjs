"use strict";
// Owner-local fixed-plan executor. No registration, journal, timer or authority activation.
const crypto=require('node:crypto');
const L=require('./legacy-goal-receipts.cjs');
const P=require('./primary-plan.cjs');
const S=require('./participant-snapshot.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const copy=x=>JSON.parse(JSON.stringify(x));
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const same=(a,b)=>stable(a)===stable(b),fail=x=>{throw Error(x);};
const FIELD='centerNamingProjectionV1',HEX=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const permits=new WeakMap();
function fields(v,names){if(!v||Array.isArray(v)||Object.keys(v).sort().join('|')!==[...names].sort().join('|'))fail('CENTER_PEO_SCHEMA');}
// Shared strict rule (primary-plan.cjs), same as the center claim command.
function subject(s){return P.strictSubject(s,'CENTER_PEO_SUBJECT')}
const receiptKey=P.peoReceiptKey;
class Projection {
 constructor(owner,writer,legacy,resolveAuthority){this.owner=owner;this.writer=writer;this.legacy=legacy;this.resolveAuthority=resolveAuthority;this.generation=crypto.randomUUID();}
 sync(f){const v=f();if(v&&typeof v.then==='function'){Promise.resolve(v).catch(()=>{});fail('CENTER_PEO_ASYNC_AUTHORITY')}if(v===false)fail('CENTER_PEO_AUTHORITY_DENIED');return v;}
 capture(){
  const api=this.resolveAuthority();if(!api||typeof api.snapshot!=='function'||typeof api.assertCurrent!=='function')fail('CENTER_PEO_AUTHORITY_UNAVAILABLE');
  // Same proof as the shared consumer fence: a proven never-initialized center keeps legacy PEO saves working.
  if(typeof api.availability==='function'&&typeof api.assertAvailability==='function'){
   const proof=this.sync(()=>api.availability());this.sync(()=>api.assertAvailability(proof));
   if(proof?.version===1&&proof.state==='unconfigured')return {api,unconfigured:true,proof,owner:this.writer.capture()};
   if(proof?.state!=='configured')fail('CENTER_PEO_AUTHORITY_UNAVAILABLE');
  }
  const s=this.sync(()=>api.snapshot());S.validate(s);if(!s||![1,3].includes(s.version)||typeof s.namespace!=='string'||!s.namespace||typeof s.generation!=='string'||!s.generation||!Array.isArray(s.contexts)||s.contexts.length>5000)fail('CENTER_PEO_SNAPSHOT');
  const ids=new Set(),refs=new Set();for(const c of s.contexts){if(!c||!/^ctx_[a-f0-9-]{36}$/.test(c.contextId)||ids.has(c.contextId)||!Array.isArray(c.subjects)||c.subjects.length!==1||!['legacy','center'].includes(c.naming?.authority)||typeof c.subjects[0]?.primaryNodeKey!=='string')fail('CENTER_PEO_SNAPSHOT');
   // Only center-managed subjects are protected here; a legacy registration this module cannot parse must not block every save.
   if(c.naming.authority==='center')subject(c.subjects[0]);const k=c.subjects[0].primaryNodeKey;if(refs.has(k))fail('CENTER_PEO_DUPLICATE_SUBJECT');ids.add(c.contextId);refs.add(k);}
  this.sync(()=>api.assertCurrent(s));return {api,s:copy(s),owner:this.writer.capture()};
 }
 fresh(c){this.writer.assert(c.owner);if(this.resolveAuthority()!==c.api)fail('CENTER_PEO_PROVIDER_CHANGED');if(c.unconfigured)this.sync(()=>c.api.assertAvailability(c.proof));const n=this.capture();if(!!n.unconfigured!==!!c.unconfigured||!c.unconfigured&&(n.s.namespace!==c.s.namespace||n.s.generation!==c.s.generation))fail('CENTER_PEO_GENERATION_CHANGED');return n;}
 // Rename confirmation, inspection and execution exist only for a configured center.
 configured(c){if(c.unconfigured)fail('CENTER_PEO_CONFIRMATION_REQUIRED');return c;}
 parse(raw){return S.rejectForeign(this.legacy.parse(raw));}
 map(d){
  const m=Object.hasOwn(d,FIELD)?d[FIELD]:{};if(!m||Array.isArray(m)||typeof m!=='object'||Object.keys(m).length>5000)fail('CENTER_PEO_RECEIPTS');
  const ids=new Set();for(const [k,r] of Object.entries(m)){
   fields(r,['version','namespace','contextId','txId','planHash','subject','oldLabel','newLabel','preconditionHash','receiptKey',...(r.version===2?['legacy']:[])]);subject(r.subject);
   if(![1,2].includes(r.version)||r.subject.primaryNodeKey!==k||typeof r.namespace!=='string'||!r.namespace||!/^ctx_[a-f0-9-]{36}$/.test(r.contextId)||ids.has(r.contextId)||!UUID.test(r.txId)||![r.planHash,r.preconditionHash,r.receiptKey].every(x=>HEX.test(x))||this.legacy.declaration(d.commentsByNodeKey?.[k]).label!==r.newLabel)fail('CENTER_PEO_RECEIPTS');
   L.match(L.entry(d,this.legacy.FIELD,k),r.subject,'peo',r.legacy);
   if(r.version===2){const p={version:2,ownerId:'project-execution-overview',subject:r.subject,oldLabel:r.oldLabel,newLabel:r.newLabel,preconditionHash:r.preconditionHash,legacy:r.legacy,receiptKey:r.receiptKey};P.validatePeoLegacy(p);if(hash(p)!==r.planHash)fail('CENTER_PEO_RECEIPT_PLAN');}ids.add(r.contextId);
  }return m;
 }
 validate(p){
  if(p?.version===2)return copy(P.validatePeoLegacy(p));
  fields(p,['version','ownerId','subject','oldLabel','newLabel','preconditionHash','receiptKey']);subject(p.subject);
  // Reuse the real PEO parser for both domains, including strict numbered labels.
  const old=this.legacy.declaration('---\n'+p.oldLabel+'\n---'),next=this.legacy.declaration('---\n'+p.newLabel+'\n---');
  if(p.version!==1||p.ownerId!=='project-execution-overview'||!HEX.test(p.preconditionHash)||p.receiptKey!==receiptKey(p)||old.label!==p.oldLabel||next.label!==p.newLabel||p.oldLabel.toLowerCase()===p.newLabel.toLowerCase()||p.oldLabel.match(/^([0-9A-Za-z]+)/)[1].toUpperCase()!==p.newLabel.match(/^([0-9A-Za-z]+)/)[1].toUpperCase())fail('CENTER_PEO_PLAN');return copy(p);
 }
 trusted(p,txId,c){
  p=this.validate(p);if(!UUID.test(txId))fail('CENTER_PEO_TX');const n=this.configured(this.fresh(c)),matches=n.s.contexts.filter(x=>same(x.subjects[0],p.subject));
  if(matches.length!==1)fail('CENTER_PEO_CONTEXT');const context=matches[0],pending=context.naming?.pending;
  const row=pending?.plans?.find(x=>x.id==='peo-declaration');
  if(context.naming.authority!=='center'||context.canonicalLabel!==p.newLabel||pending?.txId!==txId||pending.oldLabel!==p.oldLabel||pending.newLabel!==p.newLabel||!row||row.ownerId!==p.ownerId||!same(row.subject,p.subject)||!same(row.bindings,[])||!same(row.plan,p))fail('CENTER_PEO_CONFIRMATION_REQUIRED');
  return {n,context,row};
 }
 receipt(p,txId,t){return {version:p.version,namespace:t.n.s.namespace,contextId:t.context.contextId,txId,planHash:hash(p),subject:p.subject,oldLabel:p.oldLabel,newLabel:p.newLabel,preconditionHash:p.preconditionHash,receiptKey:p.receiptKey,...(p.version===2?{legacy:copy(p.legacy)}:{})};}
 read(c){this.fresh(c);const l=this.writer.location(c.owner);return l.fs.readFileSync(l.file,'utf8');}
 beforeOrAfter(raw,p,txId,t){
  const d=this.parse(raw),m=this.map(d),k=p.subject.primaryNodeKey,comment=d.commentsByNodeKey?.[k];this.legacy.unique(d,k,[p.oldLabel,p.newLabel]);
  L.match(L.entry(d,this.legacy.FIELD,k),p.subject,'peo',p.legacy);
  const label=this.legacy.declaration(comment).label;
  if(label===p.oldLabel&&hash(comment)===p.preconditionHash){if(m[k]?.txId===txId)fail('CENTER_PEO_RECEIPT_CONFLICT');return {state:'before',d};}
  if(label===p.newLabel&&hash(this.legacy.declaration(comment,p.oldLabel).comment)===p.preconditionHash&&same(m[k],this.receipt(p,txId,t)))return {state:'after',d};
  fail('CENTER_PEO_CONTENT_CONFLICT');
 }
 reconcile(d,p,t){
  // Confirmed recovery may rehydrate memory, never publish a file. Only the exact
  // old or exact new comment is safe; a user's divergent draft stays untouched.
  const k=p.subject.primaryNodeKey,after=d.commentsByNodeKey[k],before=this.legacy.declaration(after,p.oldLabel).comment;
  const memory=this.owner.settings,comment=memory.commentsByNodeKey?.[k],m=this.map(memory),r=m[k];
  L.match(L.entry(memory,this.legacy.FIELD,k),p.subject,'peo',p.legacy);
  if(comment!==before&&comment!==after)fail('CENTER_PEO_UNSAVED_COMMENT');
  if(r&&(r.namespace!==t.n.s.namespace||r.contextId!==t.context.contextId||!same(r.subject,p.subject)||r.txId===d[FIELD][k].txId&&!same(r,d[FIELD][k])))fail('CENTER_PEO_UNSAVED_RECEIPT');
  this.fresh(t.n);memory.commentsByNodeKey={...memory.commentsByNodeKey,[k]:after};memory[FIELD]={...(memory[FIELD]||{}),[k]:copy(d[FIELD][k])};
 }
 guardOrdinary(before,after,exempt=null,captured=null){return this.ordinaryCheck(captured?this.fresh(captured):this.capture(),before,after,exempt)}
 // Final predicate shared by guardOrdinary and the claim dry-run (C1 A1).
 ordinaryCheck(c,before,after,exempt=null){
  const a=this.parse(before??'{}'),b=this.parse(after),ar=this.map(a),br=this.map(b);
  if(c.unconfigured){if(Object.keys(ar).length||Object.keys(br).length)fail('CENTER_PEO_RECEIPT_WITHOUT_AUTHORITY');return c;}
  const ac=copy(ar),bc=copy(br);if(exempt){delete ac[exempt];delete bc[exempt];}
  if(!same(ac,bc)||!exempt&&Object.hasOwn(a,FIELD)!==Object.hasOwn(b,FIELD))fail('CENTER_PEO_RECEIPT_CHANGED');
  for(const [k,r] of Object.entries(ar))if(r.namespace!==c.s.namespace||!c.s.contexts.some(x=>x.contextId===r.contextId&&x.naming.authority==='center'&&same(x.subjects[0],r.subject)))fail('CENTER_PEO_RECEIPT_ORPHAN');
  for(const x of c.s.contexts.filter(x=>x.naming.authority==='center')){
   const k=x.subjects[0].primaryNodeKey;if(k===exempt)continue;
   const old=this.legacy.declaration(a.commentsByNodeKey?.[k]).label,next=this.legacy.declaration(b.commentsByNodeKey?.[k]).label;
   if(![x.canonicalLabel,x.naming.pending?.oldLabel].includes(old)||old!==next)fail('CENTER_PEO_MANAGED_DECLARATION_CHANGED');
   this.legacy.unique(b,k,[old,x.canonicalLabel]);
  }
  return c;
 }
 // C1 claim dry-run (read only, settings queue): local snapshot copy marks the context center; the final predicate and
 // every name-independent prepare refusal must pass, and the memory comment must equal the saved one (C1 A1/A2/R3).
 async dryRunClaim(contextId){
  return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   const real=this.configured(this.capture()),s=copy(real.s),context=s.contexts.find(x=>x.contextId===contextId);if(!context)fail('CENTER_PEO_CLAIM_CONTEXT');
   context.naming={...context.naming,authority:'center',pending:null};const sub=subject(context.subjects[0]),k=sub.primaryNodeKey;
   const raw=this.read(real),d=this.parse(raw),m=this.map(d),list=L.entry(d,this.legacy.FIELD,k),legacy=L.evidence(list,sub,'peo');this.legacy.receipts(d);
   this.ordinaryCheck({...real,s},raw,raw,null);L.match(L.entry(this.owner.settings,this.legacy.FIELD,k),sub,'peo',legacy);
   if(legacy&&!m[k]&&list.at(-1).newLabel!==context.canonicalLabel)fail('CENTER_PEO_LEGACY_HEAD_CHANGED');
   const comment=d.commentsByNodeKey?.[k];if(this.legacy.declaration(comment).label!==context.canonicalLabel||this.owner.settings.commentsByNodeKey?.[k]!==comment)fail('CENTER_PEO_UNSAVED_COMMENT');
   this.legacy.unique(d,k,[context.canonicalLabel]);this.fresh(real);
   return {generation:this.generation,digest:this.claimDigestOf(d,k),lineageHash:legacy?.lineageHash||null};
  }));
 }
 claimDigestOf(d,k){return hash(stable({comment:d.commentsByNodeKey?.[k]??null,legacy:L.entry(d,this.legacy.FIELD,k)??null,receipt:this.map(d)[k]??null}))}
 // Lease re-read: synchronous, disk and memory must still match the evidence digest.
 // Reads only the owner's own file: it runs inside the center's exclusive write, where the center snapshot is unreadable.
 claimDigestNow(k){const l=this.writer.location(this.writer.capture()),d=this.parse(l.fs.readFileSync(l.file,'utf8'));if(this.owner.settings.commentsByNodeKey?.[k]!==d.commentsByNodeKey?.[k])fail('CENTER_PEO_UNSAVED_COMMENT');return this.claimDigestOf(d,k)}
 // The writer names center-transition backups by txId without seeing the private permit table.
 permitTx(permit){const s=permit&&permits.get(permit);return s&&s.executor===this?s.txId:null;}
 guardPublish(before,after,permit){
  const saved=permit&&permits.get(permit);
  if(!saved)return this.guardOrdinary(before,after);
  if(saved.executor!==this||saved.before!==before||saved.after!==after)fail('CENTER_PEO_PERMIT');
  const t=this.trusted(saved.p,saved.txId,saved.c);this.guardOrdinary(before,after,saved.p.subject.primaryNodeKey,saved.c);
  if(this.beforeOrAfter(before,saved.p,saved.txId,t).state!=='before'||this.beforeOrAfter(after,saved.p,saved.txId,t).state!=='after')fail('CENTER_PEO_PERMIT_STATE');
  if(this.owner.settings.commentsByNodeKey?.[saved.p.subject.primaryNodeKey]!==this.parse(before).commentsByNodeKey[saved.p.subject.primaryNodeKey])fail('CENTER_PEO_UNSAVED_COMMENT');
  L.match(L.entry(this.owner.settings,this.legacy.FIELD,saved.p.subject.primaryNodeKey),saved.p.subject,'peo',saved.p.legacy);
  this.legacy.guardOrdinaryWrite(before,after);return t;
 }
 async prepare(contextId,newLabel){
  return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   const c=this.configured(this.capture()),context=c.s.contexts.find(x=>x.contextId===contextId);if(!context||context.naming.authority!=='center'||context.naming.pending)fail('CENTER_PEO_NOT_READY');
   const raw=this.read(c),d=this.parse(raw),s=context.subjects[0],k=s.primaryNodeKey;const m=this.map(d),list=L.entry(d,this.legacy.FIELD,k),legacy=L.evidence(list,s,'peo');this.legacy.receipts(d);
   this.guardOrdinary(raw,raw,null,c);L.match(L.entry(this.owner.settings,this.legacy.FIELD,k),s,'peo',legacy);
   if(legacy&&!m[k]&&list.at(-1).newLabel!==context.canonicalLabel)fail('CENTER_PEO_LEGACY_HEAD_CHANGED');
   const comment=d.commentsByNodeKey?.[k],old=this.legacy.declaration(comment).label;if(old!==context.canonicalLabel||this.owner.settings.commentsByNodeKey?.[k]!==comment)fail('CENTER_PEO_UNSAVED_COMMENT');this.legacy.unique(d,k,[old,newLabel]);
   const next=this.legacy.declaration(comment,newLabel).comment;if(this.legacy.declaration(next,old).comment!==comment)fail('CENTER_PEO_NONREVERSIBLE');
   const p={version:legacy?2:1,ownerId:'project-execution-overview',subject:copy(s),oldLabel:old,newLabel,preconditionHash:hash(comment),...(legacy?{legacy}:{})};p.receiptKey=receiptKey(p);this.validate(p);this.fresh(c);return p;
  }));
 }
 async inspect(plan,txId){
  const p=this.validate(plan),c=this.configured(this.capture());return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   const t=this.trusted(p,txId,c),r=this.beforeOrAfter(this.read(c),p,txId,t);this.trusted(p,txId,c);if(r.state==='after')this.reconcile(r.d,p,t);
   return {state:r.state,txId,planHash:hash(t.row),receiptHash:hash(this.receipt(p,txId,t))};
  }));
 }
 async apply(plan,txId,externalLease){
  const p=this.validate(plan),c=this.configured(this.capture());if(typeof externalLease!=='function')fail('CENTER_PEO_LEASE_REQUIRED');
  const lease=()=>{this.writer.sync(externalLease);this.trusted(p,txId,c);};
  return this.owner.enqueueSettingsWrite(()=>this.writer.serial(async()=>{
   lease();const t=this.trusted(p,txId,c),before=this.read(c),r=this.beforeOrAfter(before,p,txId,t),k=p.subject.primaryNodeKey;
   L.match(L.entry(this.owner.settings,this.legacy.FIELD,k),p.subject,'peo',p.legacy);
   if(r.state==='after'){this.reconcile(r.d,p,t);return {state:'after',alreadyApplied:true};}
   if(this.owner.settings.commentsByNodeKey?.[k]!==r.d.commentsByNodeKey[k])fail('CENTER_PEO_UNSAVED_COMMENT');
   const previous=r.d.commentsByNodeKey[k];r.d.commentsByNodeKey[k]=this.legacy.declaration(previous,p.newLabel).comment;r.d[FIELD]={...(r.d[FIELD]||{}),[k]:this.receipt(p,txId,t)};
   const after=JSON.stringify(r.d);this.parse(after);this.map(r.d);const permit={};permits.set(permit,{executor:this,p,txId,c,before,after});
   try{await this.writer.publish(c.owner,before,after,lease,permit);}finally{permits.delete(permit);}
   lease();if(this.read(c)!==after)fail('CENTER_PEO_READBACK_UNKNOWN');
   // Preserve unrelated in-memory edits. Never replace the entire settings object.
   this.reconcile(r.d,p,t);return {state:'after',alreadyApplied:false};
  }));
 }
}
function preservedSettings(value,legacy){if(!value||!Object.hasOwn(value,FIELD))return {};const d=legacy.parse(JSON.stringify(value));Projection.prototype.map.call({legacy},d);return {[FIELD]:d[FIELD]};}
function legacyView(data,legacy){
 // Only validation sees this projection; callers retain and persist the original.
 const d=copy(data),map=Projection.prototype.map.call({legacy},d);
 for(const [key,r] of Object.entries(map))if(r.version===2){const list=L.entry(d,legacy.FIELD,key);d.commentsByNodeKey[key]=legacy.declaration(d.commentsByNodeKey[key],list.at(-1).newLabel).comment;}
 return d;
}
// C1 participant for the center naming adapter. Pending sources (fail-closed, C1 R5/A7): the legacy rename journal
// (pending/paused/review, empty plans matched by address), goal-full-rename-v1 and context-creation-v1.
const CAPABILITIES=['comment-save','comment-clear','rename','legacy-retry','creation','saveData'];
const address=x=>String(x||'').match(/^([0-9][0-9A-Za-z]*)\s*[-－—]/)?.[1]?.toLocaleLowerCase()||null;

// Excluding a pending job requires a complete, internally consistent production identity graph.
// Unknown historical shapes remain pending; display numbers are never identity evidence.
function creationTouches(c,plan){
 try{
  const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const text=x=>typeof x==='string'&&!!x&&x===x.trim()&&!/[\x00-\x1f]/.test(x);
  const path=x=>{P.path(x);return x;};
  const jump=(...parts)=>'jump:v1:'+parts.map(encodeURIComponent).join('|');
  const equal=(a,b)=>same(a,b);
  if(!object(plan)||plan.version!==1||!/^create-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(plan.id)||!['project','goal'].includes(plan.domain)||!object(plan.input)||!text(plan.input.contextKey)||!text(plan.input.projectName)||!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(plan.weekId))return true;
  path(plan.source);
  const goal=plan.domain==='goal',suffix=plan.id.slice(7);
  const order=[...(goal?['mandala-db','mandala-keywords']:['workspace-primary']),'gtd-tag','gtd-keyword','gtd-project','gtd-note','workspace-carrier','workspace-keyword','collection-carrier','collection-keyword',...(goal?['eva-carrier']:[]),'peo-declaration','mandala-weekly'];
  if(!Array.isArray(plan.steps)||plan.steps.length!==order.length)return true;
  const owners={'workspace':'workspace-mount','collection':'collection-card-view','gtd':'gtd-task-manager','mandala':'mandala-time-blocks','eva':'eva-cross-view-relations','peo':'project-execution-overview'};
  const rows={};
  for(let i=0;i<order.length;i++){
   const s=plan.steps[i],p=s?.plan;
   if(!object(s)||s.id!==order[i]||s.owner!==owners[s.id.split('-')[0]]||s.contract!==1||!object(p)||p.txId!==plan.id||s.source!==p.sourceNotePath||!equal(s.depends,i?[order[i-1]]:[]))return true;
   path(s.source);
   if(Object.hasOwn(p,'version')&&p.version!==1)return true;
   if(Object.hasOwn(p,'domain')&&p.domain!==plan.domain)return true;
   if(s.id!=='eva-carrier'&&(p.contextKey!==plan.input.contextKey||p.projectName!==plan.input.projectName))return true;
   rows[s.id]=p;
  }
  const d=rows['peo-declaration'],w=rows['mandala-weekly'],g=rows['gtd-tag'],wm=rows['workspace-carrier'],cc=rows['collection-carrier'];
  if(d.domain!==plan.domain||w.domain!==plan.domain||w.sourceNotePath!==plan.source||w.weekId!==plan.weekId||!text(w.nodeId))return true;
  P.strictSubject({domain:plan.domain,ownerId:goal?'mandala-time-blocks':'workspace-mount',sourceScope:d.sourceNotePath,primaryNodeKey:d.nodeKey});
  for(const group of [['gtd-tag','gtd-keyword','gtd-project','gtd-note'],['workspace-carrier','workspace-keyword'],['collection-carrier','collection-keyword']])if(group.some(id=>!equal(rows[id],rows[group[0]])))return true;
  if(g.tagId!=='context-'+suffix||g.projectId!=='project-'+suffix||wm.tabId!=='tab_ck_'+suffix||cc.tabId!=='tab_ck_'+suffix||wm.domain!==plan.domain||cc.domain!==plan.domain)return true;
  for(const p of [wm,cc]){path(p.dataPath);path(p.keywordPath);if(p.keywordKey!==p.contextKey.trim().toLocaleLowerCase()||!['present','absent'].includes(p.keywordFileState))return true;}
  for(const k of ['db','keywords','weeklyGoals'])path(w[k]);
  for(const k of ['folder','tagsPath','keywordsPath','dbPath','notePath'])path(g[k]);
  if(g.notePath!==g.folder+'/'+plan.input.projectName+'.md')return true;
  if(goal){
   const db=rows['mandala-db'],kw=rows['mandala-keywords'],expected={...w};delete expected.weeklyTargets;
   if(!equal(db,kw)||!equal(db,expected)||w.nodeId!=='node-'+suffix||db.parentNodeId!==plan.input.parentNodeId||!text(db.parentNodeId)||![0,1,2,3,5,6,7,8].includes(db.slot)||d.sourceNotePath!==plan.source||d.nodeKey!==jump('mandala-time-blocks',plan.source,'node','mandala',w.nodeId))return true;
   const e=rows['eva-carrier'],r=e.relation;
   if(e.sourceNotePath!==plan.source||!object(r)||r.id!=='rel-create-'+suffix||r.relationType!=='承载'||r.sourceNodeKey!==d.nodeKey||r.targetNodeKey!==jump('gtd',g.sourceNotePath,'note',g.sourceNotePath,g.projectId))return true;
  }else{
   const p=rows['workspace-primary'];path(p.dataPath);
   if(!text(p.tabId)||p.itemId!=='item_ck_'+suffix||p.sourceNotePath!==d.sourceNotePath||p.sourceNotePath!==wm.sourceNotePath||p.dataPath!==wm.dataPath||d.nodeKey!==jump('workspace-mount-view',p.sourceNotePath,'tab',p.tabId,p.itemId)||w.nodeId!==d.nodeKey)return true;
  }
  const buckets=goal?['rowsByKey','nodeStatesByKey','goalPlanRowsByKey']:['workspaceRowsByKey','workspaceNodeStatesByKey','projectPlanRowsByKey'];
  const key=plan.source+'::'+w.nodeId;
  if(!Array.isArray(w.weeklyTargets)||w.weeklyTargets.length!==3)return true;
  for(let i=0;i<3;i++){
   const t=w.weeklyTargets[i];
   if(!object(t)||t.bucket!==buckets[i]||t.key!==key+(i===0?'::'+plan.weekId:'')||!object(t.value)||t.value.sourceNotePath!==plan.source||t.value.nodeId!==w.nodeId||i===0&&t.value.weekId!==plan.weekId)return true;
  }
  if(!Array.isArray(c?.subjects)||!Array.isArray(c?.bindings))return true;
  if(c.subjects.some(s=>s.domain===plan.domain&&s.sourceScope===d.sourceNotePath&&s.primaryNodeKey===d.nodeKey))return true;
  return [['workspace-mount',wm,'tabId'],['gtd-task-manager',g,'tagId'],['collection-card-view',cc,'tabId']].some(([ownerId,p,field])=>c.bindings.some(b=>b.ownerId===ownerId&&b.sourceScope===p.sourceNotePath&&b.carrierId===p[field]));
 }catch{return true;}
}

function createParticipant(plugin){
 const ownerId='project-execution-overview',proj=()=>plugin.goalPeoWriter?.centerNaming,first=proj();
 const live=()=>!!first&&proj()===first&&!plugin.contextCarrierUnloading&&plugin.app?.plugins?.plugins?.[plugin.manifest?.id]===plugin;
 const need=()=>{if(!live())fail('CENTER_PEO_PARTICIPANT_UNAVAILABLE');return first};
 const C=require('./binding-compatibility-checks.cjs'),installedWriter=first?.writer,writerMethods=C.pinMethods(installedWriter,["serial", "capture", "assert", "sync", "location", "publishFirst", "publish", "save", "declarationOwner"]),installedEntries=["saveData"].map(k=>[k,plugin[k]]);
 const installed=()=>{if(first?.writer!==installedWriter||plugin.goalPeoWriter!==installedWriter)fail('binding-writer-changed');writerMethods();for(const [k,fn] of installedEntries)if(typeof fn!=='function'||plugin[k]!==fn)fail('binding-entry-changed:'+k);return true};
 async function pending(c){
  const s=c.subjects[0],k=s.primaryNodeKey,addr=address(c.canonicalLabel),out=[];
  const j=plugin.contextRenameJournal;if(!j||typeof j.snapshot!=='function')fail('CENTER_PEO_LEGACY_JOURNAL_UNREADABLE');const snap=j.snapshot();if(snap.error)fail('CENTER_PEO_LEGACY_JOURNAL_ERROR');
  for(const job of snap.jobs||[]){if(['complete','superseded'].includes(job.status))continue;
   const touches=job.primaryNodeKey===k||(job.providers||[]).some(pr=>pr.plan?(pr.plan.targets||[]).some(t=>c.bindings.some(b=>b.ownerId===pr.id&&b.sourceScope===pr.plan.scope?.sourceNotePath&&b.carrierId===t.carrierId)):[...(job.oldLabels||[]),job.newDisplayLabel].some(l=>addr&&address(l)===addr));
   if(touches)out.push({source:'context-key-renames.json',id:job.id,status:job.status})}
  const full=plugin.getGoalProductionCoordinator().journal(false);for(const x of full?await full.list():[])if(x.plan.nodeKey===k&&x.progress.status!=='complete')out.push({source:'goal-full-rename-v1',id:x.plan.txId,status:x.progress.status});
  const cre=plugin.getCreationProductionCoordinator().journal(false);for(const x of cre?await cre.list():[]){if(x.progress.status==='complete')continue;if(creationTouches(c,x.plan))out.push({source:'context-creation-v1',id:x.plan.id,status:x.progress.status})}
  return out;
 }
 const participant=Object.freeze({ownerId,
  bindingCompatibility(){installed();const x=need();C.validator(S);const method=C.pinPrototype(x,Projection.prototype),writer=x.writer,w=C.pinMethods(writer),generation=x.generation,auth=C.pinAuthority(()=>x.resolveAuthority(),()=>plugin.app.vault.adapter.getBasePath());const guard=()=>{installed();if(need()!==x||x.generation!==generation)fail('binding-writer-changed');method();w();auth();return true};guard();const proof=Object.freeze({version:1,ownerId,generation,bindingFormat:S.BINDING_FORMAT});compatibilityProofs.set(proof,{part:participant,guard});return proof;},
  status(){const ok=live();return {ownerId,mode:ok?'ready':'unavailable',generation:first?.generation||'',capabilities:ok?CAPABILITIES.slice():[]}},
  async bindingPending(c){need();const jobs=await pending(c);need();return jobs},
  async evidence(c){const x=need(),r=await x.dryRunClaim(c.contextId),pend=await pending(c);need();return {ownerId,generation:x.generation,digest:r.digest,lineageHash:r.lineageHash,pending:pend}},
  digestNow(c){return need().claimDigestNow(c.subjects[0].primaryNodeKey)},
  async prepare(c,newLabel){const plan=await need().prepare(c.contextId,newLabel);need();return {id:'peo-declaration',ownerId,subject:copy(c.subjects[0]),bindings:[],plan}},
  inspect(row,txId){return need().inspect(row.plan,txId)},
  apply(row,txId,lease){return need().apply(row.plan,txId,lease)}
 });
 return participant;
}
module.exports={Projection,FIELD,hash,receiptKey,preservedSettings,legacyView,createParticipant,CAPABILITIES,creationTouches};

const compatibilityProofs=new WeakMap();
function verifyBindingCompatibility(part,proof){const r=compatibilityProofs.get(proof);if(!r||r.part!==part)throw Error('binding-proof-unissued');r.guard();return r.guard;}
module.exports.verifyBindingCompatibility=verifyBindingCompatibility;
