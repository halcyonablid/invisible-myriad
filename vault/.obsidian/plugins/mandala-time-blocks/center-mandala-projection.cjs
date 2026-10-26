'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('./primary-plan.cjs');
const S=require('./participant-snapshot.cjs');
const L=require('./legacy-goal-receipts.cjs');
const FIELD='centerNamingProjectionV1',OLD='managedGoalRenameReceiptsV1',LIMIT=8*1024*1024;
const copy=x=>JSON.parse(JSON.stringify(x)),stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const hash=P.hash,same=(a,b)=>stable(a)===stable(b),semantic=x=>hash(stable(x)),fail=x=>{throw Error(x)};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const permits=new WeakMap();
const legacyList=(kind,d,id)=>kind==='db'?(Object.hasOwn(d[id]||{},OLD)?d[id][OLD]:undefined):L.entry(d,OLD,id);
class Projection {
 constructor(owner,bridge,legacy,creation,resolveAuthority){Object.assign(this,{owner,bridge,legacy,creation,resolveAuthority});this.tail=Promise.resolve();this.generation=crypto.randomUUID();}
 serial(fn){const p=this.tail.then(fn,fn);this.tail=p.catch(()=>{});return p;}
 sync(f){const v=f();if(v&&typeof v.then==='function'){Promise.resolve(v).catch(()=>{});fail('CENTER_GOAL_ASYNC_LEASE')}if(v===false)fail('CENTER_GOAL_DENIED');return v;}
 capture(){
  const paths=this.owner.getPaths(),source={sourceNotePath:paths.sourceNotePath,db:paths.db,keywords:paths.keywords,weeklyGoals:paths.weeklyGoals};Object.values(source).forEach(P.path);if(new Set(Object.values(source)).size!==4)fail('CENTER_GOAL_PATH_ALIAS');
  const b=this.bridge.capture();this.bridge.assert(b);const base=this.owner.app.vault.adapter.getBasePath?.();if(!base||!path.isAbsolute(base))fail('CENTER_GOAL_LOCAL_VAULT_REQUIRED');
  const api=this.resolveAuthority();if(!api||typeof api.snapshot!=='function'||typeof api.assertCurrent!=='function')fail('CENTER_GOAL_AUTHORITY_UNAVAILABLE');
  // Same proof as the shared consumer fence: a proven never-initialized center keeps legacy Mandala saves working.
  if(typeof api.availability==='function'&&typeof api.assertAvailability==='function'){
   const proof=this.sync(()=>api.availability());this.sync(()=>api.assertAvailability(proof));
   if(proof?.version===1&&proof.state==='unconfigured')return {api,unconfigured:true,proof,b,source,base,service:this.owner.goalContextKeyManagement,generation:this.owner.goalContextKeyManagement?.generation};
   if(proof?.state!=='configured')fail('CENTER_GOAL_AUTHORITY_UNAVAILABLE');
  }
  const s=this.sync(()=>api.snapshot());S.validate(s);if(!s||![1,3].includes(s.version)||typeof s.namespace!=='string'||!s.namespace||typeof s.generation!=='string'||!s.generation||!Array.isArray(s.contexts)||s.contexts.length>5000)fail('CENTER_GOAL_SNAPSHOT');
  const ids=new Set(),refs=new Set();for(const c of s.contexts){const sub=c?.subjects?.[0];if(!/^ctx_[a-f0-9-]{36}$/.test(c?.contextId)||ids.has(c.contextId)||c.subjects.length!==1||typeof sub?.primaryNodeKey!=='string'||refs.has(sub.primaryNodeKey)||!['legacy','center'].includes(c.naming?.authority))fail('CENTER_GOAL_SNAPSHOT');
   // Only center-managed goals are protected here; a legacy registration this module cannot parse must not block every save.
   if(sub.domain==='goal'&&c.naming.authority==='center')P.subject(sub);ids.add(c.contextId);refs.add(sub.primaryNodeKey);}
  this.sync(()=>api.assertCurrent(s));return {api,s:copy(s),b,source,base,service:this.owner.goalContextKeyManagement,generation:this.owner.goalContextKeyManagement?.generation};
 }
 // Rename confirmation, inspection and execution exist only for a configured center.
 configured(c){if(c.unconfigured)fail('CENTER_GOAL_CONFIRMATION_REQUIRED');return c;}
 fresh(c){this.bridge.assert(c.b);if(c.unconfigured)this.sync(()=>c.api.assertAvailability(c.proof));const n=this.capture();if(n.api!==c.api||!!n.unconfigured!==!!c.unconfigured||!c.unconfigured&&(n.s.namespace!==c.s.namespace||n.s.generation!==c.s.generation)||n.base!==c.base||!same(n.source,c.source)||n.service!==c.service||n.generation!==c.generation||n.service?.closed)fail('CENTER_GOAL_SCOPE_CHANGED');return n;}
 location(c,relative){P.path(relative);const file=path.resolve(c.base,relative);if(path.relative(c.base,file).startsWith('..')||path.isAbsolute(path.relative(c.base,file)))fail('CENTER_GOAL_OUTSIDE');
  const check=p=>{for(let q=p;;q=path.dirname(q)){const s=fs.lstatSync(q);if(s.isSymbolicLink())fail('CENTER_GOAL_SYMLINK');if(q===path.dirname(q))break;}};check(file);this.recoverFirstLink(file);if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).nlink!==1)fail('CENTER_GOAL_FILE_REQUIRED');return {file,dir:path.dirname(file),check:()=>check(file)};
 }
 // A crash between link and unlink in publishFirst leaves the temp name as a second link to the
 // same inode; removing exactly that link restores nlink=1 without touching content.
 recoverFirstLink(file){const st=fs.lstatSync(file);if(!st.isFile()||st.nlink!==2)return;const dir=path.dirname(file);
  for(const name of fs.readdirSync(dir).filter(n=>/^\.center-goal-first-[a-f0-9-]{36}\.tmp$/.test(n))){const t=fs.lstatSync(path.join(dir,name));if(t.isFile()&&t.ino===st.ino&&t.dev===st.dev)fs.unlinkSync(path.join(dir,name));}}
 // First file of a kind: validate the new content on its own, then create exclusively (never overwrite).
 async publishFirst(c,kind,after,options={}){
  if(Object.hasOwn(options,'expectedTargetExists')&&options.expectedTargetExists!==false||Object.hasOwn(options,'expectedTargetHash'))fail('CENTER_GOAL_CALLER_CAS');
  if(Buffer.byteLength(after)>LIMIT)fail('CENTER_GOAL_SIZE');P.path(c.source[kind]);
  const file=path.resolve(c.base,c.source[kind]),dir=path.dirname(file);if(path.relative(c.base,file).startsWith('..')||path.isAbsolute(path.relative(c.base,file)))fail('CENTER_GOAL_OUTSIDE');
  const check=()=>{this.fresh(c);for(let q=dir;;q=path.dirname(q)){const s=fs.lstatSync(q);if(s.isSymbolicLink()||!s.isDirectory())fail('CENTER_GOAL_SYMLINK');if(q===path.dirname(q))break;}if(fs.existsSync(file))fail('CENTER_GOAL_FIRST_FILE_EXISTS');if(options.assertSynchronousLease)this.sync(options.assertSynchronousLease);this.guard(kind,after,after,c);};
  check();const temp=path.join(dir,'.center-goal-first-'+crypto.randomUUID()+'.tmp'),fd=fs.openSync(temp,'wx');try{fs.writeFileSync(fd,after);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
  try{check();fs.linkSync(temp,file)}finally{fs.unlinkSync(temp)}
  if(fs.readFileSync(file,'utf8')!==after)fail('CENTER_GOAL_READBACK_UNKNOWN');return true;
 }
 // Optional read of a sibling Mandala file: null when it does not exist yet.
 optional(c,kind){P.path(c.source[kind]);const file=path.resolve(c.base,c.source[kind]);if(!fs.existsSync(file))return null;return this.read(c,kind);}
 read(c,kind){this.fresh(c);const l=this.location(c,c.source[kind]);if(fs.statSync(l.file).size>LIMIT)fail('CENTER_GOAL_SIZE');return fs.readFileSync(l.file,'utf8');}
 parse(raw){const d=S.rejectForeign(this.legacy.json(raw));if(!d||Array.isArray(d)||typeof d!=='object')fail('CENTER_GOAL_JSON');return d;}
 node(s){if(s.sourceScope!==this.owner.getPaths().sourceNotePath)fail('CENTER_GOAL_SOURCE');return P.subject(s);}
 maps(kind,d){
  if(kind==='keywords')this.legacy.keywordIndex(d);
  const entries=kind==='db'?Object.entries(d).filter(([,n])=>n&&Object.hasOwn(n,FIELD)).map(([id,n])=>[id,n[FIELD]]):Object.entries(Object.hasOwn(d,FIELD)?d[FIELD]:{});
  if(kind==='keywords'&&Object.hasOwn(d,FIELD)&&(!d[FIELD]||typeof d[FIELD]!=='object'||Array.isArray(d[FIELD])))fail('CENTER_GOAL_RECEIPT_SCHEMA');if(entries.length>5000)fail('CENTER_GOAL_CAPACITY');
  const m={},ids=new Set();for(const [id,r] of entries){P.fields(r,['version','namespace','contextId','txId','planHash','plan']);P.validate(r.plan);if(r.version!==1||P.subject(r.plan.subject)!==id||!UUID.test(r.txId)||typeof r.namespace!=='string'||!r.namespace||!/^ctx_[a-f0-9-]{36}$/.test(r.contextId)||ids.has(r.contextId)||r.planHash!==hash(r.plan))fail('CENTER_GOAL_RECEIPT_SCHEMA');ids.add(r.contextId);
   if(this.current(kind,d,id,r.plan.newLabel)!==r.plan.newLabel)fail('CENTER_GOAL_RECEIPT_BINDING');L.match(legacyList(kind,d,id),r.plan.subject,'mandala',r.plan.legacy);m[id]=r;}return m;
 }
 current(kind,d,id,label){if(kind==='db'){if(d[id]?.id!==id)fail('CENTER_GOAL_NODE');return this.legacy.declaration(d[id].comment).label;}
  const list=d.nodeKeywords?.[id],entry=d.keywordToNode?.[label.toLocaleLowerCase()];if(!Array.isArray(list)||list.filter(x=>x===label).length!==1||entry?.nodeId!==id||entry.keyword!==label)fail('CENTER_GOAL_KEYWORD_BINDING');return label;
 }
 strip(kind,d,id){const n=copy(d);if(kind==='db')delete n[id][FIELD];else if(Object.hasOwn(n,FIELD)){delete n[FIELD][id];if(!Object.keys(n[FIELD]).length)delete n[FIELD];}return n;}
 mutate(kind,d,id,from,to){const n=copy(d);if(kind==='db'){if(this.current(kind,n,id,from)!==from)fail('CENTER_GOAL_DECLARATION_CHANGED');n[id].comment=this.legacy.declaration(n[id].comment,to).comment;return n;}
  this.legacy.keywordIndex(n);this.current(kind,n,id,from);const a=from.toLocaleLowerCase(),b=to.toLocaleLowerCase();if(Object.hasOwn(n.keywordToNode,b)||Object.hasOwn(n.keywordMeta,b))fail('CENTER_GOAL_NAME_COLLISION');
  n.nodeKeywords[id]=n.nodeKeywords[id].map(v=>v===from?to:v);n.keywordToNode[b]={...n.keywordToNode[a],keyword:to};delete n.keywordToNode[a];if(Object.hasOwn(n.keywordMeta,a)){n.keywordMeta[b]=n.keywordMeta[a];delete n.keywordMeta[a];}for(const m of Object.values(n.keywordMeta))if(m.parentKey===a)m.parentKey=b;this.legacy.keywordIndex(n);return n;
 }
 topology(db,kw,id,labels){const incoming=new Map();for(const [k,n] of Object.entries(db)){if(!n||n.id!==k||!n.children||Array.isArray(n.children)||typeof n.children!=='object')fail('CENTER_GOAL_TOPOLOGY');for(const [slot,child] of Object.entries(n.children)){if(child===null||child==='')continue;if(!/^[01235678]$/.test(slot)||typeof child!=='string'||!Object.hasOwn(db,child))fail('CENTER_GOAL_TOPOLOGY');const a=incoming.get(child)||[];a.push(k);incoming.set(child,a);}
   if(k!==id&&typeof n.comment==='string'&&labels.some(l=>n.comment.includes(l))){let decl;try{decl=this.legacy.declaration(n.comment).label}catch{fail('CENTER_GOAL_AMBIGUOUS_DECLARATION')}if(labels.includes(decl))fail('CENTER_GOAL_DUPLICATE_DECLARATION');}}
  if(!db.root||incoming.has('root'))fail('CENTER_GOAL_TOPOLOGY');const seen=new Set();for(let k=id;k!=='root';){if(seen.has(k)||incoming.get(k)?.length!==1)fail('CENTER_GOAL_TOPOLOGY');seen.add(k);k=incoming.get(k)[0];}this.legacy.keywordIndex(kw);const lower=new Set(labels.map(l=>String(l).toLocaleLowerCase()));for(const [k,list] of Object.entries(kw.nodeKeywords))if(!Object.hasOwn(db,k)&&(Array.isArray(list)?list:[]).some(v=>lower.has(String(v).toLocaleLowerCase())))fail('CENTER_GOAL_KEYWORD_NODE');for(const [key,e] of Object.entries(kw.keywordToNode||{}))if(lower.has(key)&&!Object.hasOwn(db,e?.nodeId))fail('CENTER_GOAL_KEYWORD_NODE');
 }
 receipt(p,tx,t){return {version:1,namespace:t.n.s.namespace,contextId:t.context.contextId,txId:tx,planHash:hash(p),plan:copy(p)};}
 trusted(p,tx,c){P.validate(p);if(!UUID.test(tx))fail('CENTER_GOAL_TX');const n=this.configured(this.fresh(c)),matches=n.s.contexts.filter(x=>same(x.subjects[0],p.subject));if(matches.length!==1)fail('CENTER_GOAL_CONTEXT');const context=matches[0],pending=context.naming.pending,row=pending?.plans?.find(x=>x.id==='mandala-primary');
  if(!same(p.sourcePaths,{db:n.source.db,keywords:n.source.keywords,weeklyGoals:n.source.weeklyGoals})||context.naming.authority!=='center'||context.canonicalLabel!==p.newLabel||pending?.txId!==tx||pending.oldLabel!==p.oldLabel||pending.newLabel!==p.newLabel||row?.ownerId!==p.ownerId||!same(row.subject,p.subject)||!same(row.bindings,[])||!same(row.plan,p))fail('CENTER_GOAL_CONFIRMATION_REQUIRED');return {n,context,row};
 }
 pair(p,tx,t){const id=this.node(p.subject),raw={db:this.read(t.n,'db'),keywords:this.read(t.n,'keywords')},d={db:this.parse(raw.db),keywords:this.parse(raw.keywords)},states={};this.topology(d.db,d.keywords,id,[p.oldLabel,p.newLabel]);
  for(const kind of ['db','keywords'])L.match(legacyList(kind,d[kind],id),p.subject,'mandala',p.legacy);
  for(const kind of ['db','keywords']){const m=this.maps(kind,d[kind]),r=m[id]??null,clean=this.strip(kind,d[kind],id);if(semantic(clean)===p.before[kind]&&semantic(r)===p.before.receiptHash){this.current(kind,d[kind],id,p.oldLabel);states[kind]='before';}
   else if(same(r,this.receipt(p,tx,t))&&semantic(this.mutate(kind,clean,id,p.newLabel,p.oldLabel))===p.before[kind])states[kind]='after';else fail('CENTER_GOAL_CONTENT_CONFLICT');}
  if(states.db==='before'&&states.keywords==='after')fail('CENTER_GOAL_REVERSED_PARTIAL');return {raw,d,states,state:states.db==='after'&&states.keywords==='after'?'after':'before'};
 }
 guard(kind,before,after,c,exempt=null,transaction=null){return this.check(kind,before,after,this.fresh(c),exempt,transaction)}
 // Final predicate shared by guard and the claim dry-run (C1 A1); `n` is a fresh capture or its local copy.
 check(kind,before,after,n,exempt=null,transaction=null){const a=this.parse(before),b=this.parse(after),ar=this.maps(kind,a),br=this.maps(kind,b),aa=copy(ar),bb=copy(br);
  // Unconfigured: no center receipt may exist in either Mandala file; legacy and creation guards still run.
  if(n.unconfigured){const other=kind==='db'?'keywords':'db',ol=this.optional(n,other),om=ol===null?{}:this.maps(other,this.parse(ol));if(Object.keys(ar).length||Object.keys(br).length||Object.keys(om).length)fail('CENTER_GOAL_RECEIPT_WITHOUT_AUTHORITY');this.ordinaryOrTransaction(kind,before,after,n,transaction);return n;}if(exempt){delete aa[exempt];delete bb[exempt];}if(!same(aa,bb))fail('CENTER_GOAL_RECEIPT_CHANGED');
  for(const r of Object.values(ar))if(r.namespace!==n.s.namespace||!n.s.contexts.some(x=>x.contextId===r.contextId&&x.naming.authority==='center'&&same(x.subjects[0],r.plan.subject)))fail('CENTER_GOAL_ORPHAN_RECEIPT');
  for(const x of n.s.contexts.filter(x=>x.naming.authority==='center'&&x.subjects[0].domain==='goal'&&x.subjects[0].sourceScope===n.source.sourceNotePath)){const id=this.node(x.subjects[0]);if(id===exempt)continue;const labels=[x.canonicalLabel,x.naming.pending?.oldLabel].filter(Boolean);let old;if(kind==='db'){old=this.current(kind,a,id);if(!labels.includes(old)||this.current(kind,b,id)!==old)fail('CENTER_GOAL_MANAGED_DECLARATION_CHANGED');this.topology(b,this.parse(this.read(n,'keywords')),id,labels);}
   else{old=labels.find(l=>a.keywordToNode?.[l.toLocaleLowerCase()]?.nodeId===id&&a.keywordToNode[l.toLocaleLowerCase()].keyword===l);if(!old)fail('CENTER_GOAL_KEYWORD_BINDING');this.current(kind,b,id,old);for(const l of labels.filter(l=>l!==old))if(b.keywordToNode[l.toLocaleLowerCase()]||Object.values(b.nodeKeywords).flat().includes(l))fail('CENTER_GOAL_MANAGED_KEYWORD_CHANGED');}}
  this.ordinaryOrTransaction(kind,before,after,n,transaction);return n;
 }
 // Ordinary writes keep creation / legacy goal-rename receipts unchanged. Confirmed transactions (P3 creation cas,
 // legacy rename runner) may only append: existing receipts are never lost or changed.
 ordinaryOrTransaction(kind,before,after,n,transaction){if(!transaction){this.legacy.guardOrdinaryWrite(kind,before,after,n.source.sourceNotePath);this.creation.guard(before,after,kind);return}
  if(!['creation','legacy-rename'].includes(transaction))fail('CENTER_GOAL_TRANSACTION');
  // Per structure: tables keep every key; creation receipts stay exactly equal; legacy rename lists keep their prefix.
  const a=this.parse(before),b=this.parse(after),eq=(x,y)=>JSON.stringify(x)===JSON.stringify(y),prefix=(x,y)=>x==null||Array.isArray(x)&&Array.isArray(y)&&y.length>=x.length&&x.every((v,i)=>eq(v,y[i])),exact=(x,y)=>x==null||eq(x,y);
  const table=(x,y,each)=>x==null||!!y&&typeof y==='object'&&!Array.isArray(y)&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>Object.hasOwn(y,k)&&each(x[k],y[k]));
  const ok=kind==='db'?Object.entries(a).every(([k,x])=>!x||typeof x!=='object'||(!Object.hasOwn(x,OLD)&&!Object.hasOwn(x,this.creation.FIELD))||!!b[k]&&typeof b[k]==='object'&&prefix(x[OLD],b[k][OLD])&&exact(x[this.creation.FIELD],b[k][this.creation.FIELD])):table(a[OLD],b[OLD],prefix)&&table(a[this.creation.ROOT],b[this.creation.ROOT],exact);
  if(!ok)fail('CENTER_GOAL_TRANSACTION_RECEIPT_LOST');}
 capacity(dir,group,count,bytes){const re=group==='tx'?/^\.center-goal-tx-.*\.before\.json$/:/^\.center-goal-(?!tx-|first-).*\.before\.json$/,list=fs.readdirSync(dir).filter(n=>re.test(n));
  if(list.length+count>64||list.reduce((n,f)=>n+fs.lstatSync(path.join(dir,f)).size,0)+bytes>64*1024*1024)fail('CENTER_GOAL_BACKUP_CAPACITY');}
 transactionChange(kind,before,after){const pick=raw=>{const d=this.parse(raw);return kind==='db'?Object.entries(d).filter(([,n])=>n&&typeof n==='object'&&(Object.hasOwn(n,OLD)||Object.hasOwn(n,this.creation.FIELD))).map(([k,n])=>[k,n[OLD]??null,n[this.creation.FIELD]??null]):[d[OLD]??null,d[this.creation.ROOT]??null]};return JSON.stringify(pick(before))!==JSON.stringify(pick(after));}
 async publish(c,kind,before,after,options={},permit){
  // An exported method or caller-supplied callback cannot authorize a projection.
  // Only this module can issue a single-use permit bound to these exact bytes.
  const authorized=permit&&permits.get(permit);
  if(authorized){permits.delete(permit);if(authorized.executor!==this||authorized.c!==c||authorized.kind!==kind||authorized.before!==before||authorized.after!==after)fail('CENTER_GOAL_PERMIT');}
  const guard=authorized?authorized.guard:()=>this.guard(kind,before,after,c,null,options.managedTransaction||null);
  if(Buffer.byteLength(after)>Math.min(Number(options.maxBytes)>0?Number(options.maxBytes):LIMIT,LIMIT))fail('CENTER_GOAL_SIZE');const loc=this.location(c,c.source[kind]);if(Object.hasOwn(options,'expectedTargetExists')&&options.expectedTargetExists!==true||Object.hasOwn(options,'expectedTargetHash')&&options.expectedTargetHash!==hash(before))fail('CENTER_GOAL_CALLER_CAS');
  const check=()=>{this.fresh(c);loc.check();if(this.read(c,kind)!==before)fail('CENTER_GOAL_CAS');if(options.assertSynchronousLease)this.sync(options.assertSynchronousLease);guard();};
  check();if(options.assertCanPublish)await options.assertCanPublish({stage:'staged',target:c.source[kind],expectedHash:hash(after)});check();
  // Only confirmed transactions keep an exact prior image: a center rename permit (own txId group) or a change of
  // creation / legacy goal-rename receipts. Ordinary saves rely on temp+fsync+CAS+rename. Backups are never deleted.
  const group=authorized?'tx':(options.managedTransaction||this.transactionChange(kind,before,after))?'other':null;if(group)this.capacity(loc.dir,group,1,Buffer.byteLength(before));
  const token=crypto.randomUUID(),backup=path.join(loc.dir,(group==='tx'?'.center-goal-tx-'+authorized.tx+'-'+kind+'-':'.center-goal-')+token+'.before.json'),temp=path.join(loc.dir,'.center-goal-'+token+'.tmp');const write=(p,s)=>{const fd=fs.openSync(p,'wx');try{fs.writeFileSync(fd,s);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
  try{if(group)write(backup,before);write(temp,after);if(options.assertCanPublish)await options.assertCanPublish({stage:'target-backed-up',target:c.source[kind],expectedHash:hash(after)});check();fs.renameSync(temp,loc.file);if(fs.readFileSync(loc.file,'utf8')!==after)fail('CENTER_GOAL_READBACK_UNKNOWN');if(options.assertCanPublish)await options.assertCanPublish({stage:'published',target:c.source[kind],expectedHash:hash(after)});this.fresh(c);return {ok:true,hash:hash(after),bytes:Buffer.byteLength(after)};
  }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
 }
 async write(target,data,options={}){const raw=JSON.stringify(data,null,2),opts={...options},c=this.capture(),kind=target===c.source.db?'db':target===c.source.keywords?'keywords':null;if(!kind)fail('CENTER_GOAL_TARGET');return this.serial(async()=>{if(this.optional(c,kind)===null)return this.publishFirst(c,kind,raw,opts);const before=this.read(c,kind);return this.publish(c,kind,before,raw,opts);});}
 async prepare(contextId,newLabel){const c=this.configured(this.capture());return this.serial(async()=>{const n=this.fresh(c),context=n.s.contexts.find(x=>x.contextId===contextId);if(!context||context.naming.authority!=='center'||context.naming.pending)fail('CENTER_GOAL_NOT_READY');const s=context.subjects[0],id=this.node(s),db=this.parse(this.read(c,'db')),kw=this.parse(this.read(c,'keywords'));this.topology(db,kw,id,[context.canonicalLabel,newLabel]);
  const list=legacyList('db',db,id),legacy=L.evidence(list,s,'mandala');L.match(legacyList('keywords',kw,id),s,'mandala',legacy);const dr=this.maps('db',db)[id]??null,kr=this.maps('keywords',kw)[id]??null;if(!same(dr,kr))fail('CENTER_GOAL_PREVIOUS_PARTIAL');if(legacy&&!dr&&list.at(-1).newLabel!==context.canonicalLabel)fail('CENTER_GOAL_LEGACY_HEAD_CHANGED');
  this.guard('db',JSON.stringify(db),JSON.stringify(db),c);this.guard('keywords',JSON.stringify(kw),JSON.stringify(kw),c);for(const [k,d] of [['db',db],['keywords',kw]])if(!same(this.mutate(k,this.mutate(k,d,id,context.canonicalLabel,newLabel),id,newLabel,context.canonicalLabel),d))fail('CENTER_GOAL_NONREVERSIBLE');
  const p={version:legacy?3:2,ownerId:'mandala-time-blocks',subject:copy(s),oldLabel:context.canonicalLabel,newLabel,sourcePaths:{db:c.source.db,keywords:c.source.keywords,weeklyGoals:c.source.weeklyGoals},before:{db:semantic(this.strip('db',db,id)),keywords:semantic(this.strip('keywords',kw,id)),receiptHash:semantic(dr)},...(legacy?{legacy}:{})};p.preconditionHash=hash([p.sourcePaths,p.before,...(legacy?[legacy]:[])]);p.receiptKey=P.receiptKey(p);P.validate(p);this.fresh(c);return p;
 });}
 // C1 claim dry-run (read only): local snapshot copy marks the goal center; the final predicate on both files and every
 // name-independent prepare refusal must pass. The goal must belong to Mandala's current source (C1 A2).
 async dryRunClaim(contextId){const c=this.configured(this.capture());return this.serial(async()=>{const real=this.fresh(c),s=copy(real.s),context=s.contexts.find(x=>x.contextId===contextId);if(!context)fail('CENTER_GOAL_CLAIM_CONTEXT');
  const sub=context.subjects[0];if(sub.domain!=='goal')return {generation:this.generation,applicable:false,digest:null,lineageHash:null};
  if(sub.sourceScope!==real.source.sourceNotePath)fail('CENTER_GOAL_SOURCE_NOT_CURRENT');context.naming={...context.naming,authority:'center',pending:null};
  const h={...real,s},id=this.node(sub),raw={db:this.read(real,'db'),keywords:this.read(real,'keywords')},db=this.parse(raw.db),kw=this.parse(raw.keywords);
  this.topology(db,kw,id,[context.canonicalLabel]);if(this.current('db',db,id)!==context.canonicalLabel)fail('CENTER_GOAL_DECLARATION_CHANGED');this.current('keywords',kw,id,context.canonicalLabel);
  const list=legacyList('db',db,id),legacy=L.evidence(list,sub,'mandala');L.match(legacyList('keywords',kw,id),sub,'mandala',legacy);const dr=this.maps('db',db)[id]??null,kr=this.maps('keywords',kw)[id]??null;if(!same(dr,kr))fail('CENTER_GOAL_PREVIOUS_PARTIAL');if(legacy&&!dr&&list.at(-1).newLabel!==context.canonicalLabel)fail('CENTER_GOAL_LEGACY_HEAD_CHANGED');
  for(const kind of ['db','keywords'])this.check(kind,raw[kind],raw[kind],h,null,null);this.fresh(c);
  return {generation:this.generation,applicable:true,digest:this.claimDigestOf(db,kw,id),lineageHash:legacy?.lineageHash||null};
 });}
 claimDigestOf(db,kw,id){return hash(stable({node:db[id]?{comment:db[id].comment??null,receipt:db[id][FIELD]??null}:null,keywords:kw.nodeKeywords?.[id]??null,index:Object.entries(kw.keywordToNode||{}).filter(([,v])=>v?.nodeId===id).sort()}))}
 // Reads only the owner's own files: it runs inside the center's exclusive write, where the center snapshot is unreadable.
 claimDigestNow(id){const base=this.owner.app.vault.adapter.getBasePath?.(),p=this.owner.getPaths(),rd=k=>{const l=this.location({base},p[k]);if(fs.statSync(l.file).size>LIMIT)fail('CENTER_GOAL_SIZE');return fs.readFileSync(l.file,'utf8')};return this.claimDigestOf(this.parse(rd('db')),this.parse(rd('keywords')),id)}
 async inspect(plan,tx){const p=copy(P.validate(plan)),c=this.configured(this.capture());return this.serial(async()=>{const t=this.trusted(p,tx,c),r=this.pair(p,tx,t);this.trusted(p,tx,c);return {state:r.state,partial:r.states,txId:tx,planHash:hash(t.row),receiptHash:hash(this.receipt(p,tx,t))};});}
 async apply(plan,tx,externalLease){const p=copy(P.validate(plan)),c=this.configured(this.capture());if(typeof externalLease!=='function')fail('CENTER_GOAL_LEASE_REQUIRED');const lease=()=>{this.sync(externalLease);this.trusted(p,tx,c)};return this.serial(async()=>{let wrote=false;
    // A rename writes db then keywords: reserve backup capacity for every file still to be written before the first write.
    {lease();const r0=this.pair(p,tx,this.trusted(p,tx,c)),need={};for(const kind of ['db','keywords'].filter(k=>r0.states[k]!=='after')){const dir=path.dirname(path.resolve(c.base,c.source[kind])),x=need[dir]||(need[dir]={count:0,bytes:0});x.count++;x.bytes+=Buffer.byteLength(r0.raw[kind]);}for(const [dir,x] of Object.entries(need))this.capacity(dir,'tx',x.count,x.bytes);}
    for(const kind of ['db','keywords']){lease();const t=this.trusted(p,tx,c),r=this.pair(p,tx,t);if(r.states[kind]==='after')continue;const id=this.node(p.subject),d=this.mutate(kind,r.d[kind],id,p.oldLabel,p.newLabel),receipt=this.receipt(p,tx,t);if(kind==='db')d[id][FIELD]=receipt;else d[FIELD]={...(d[FIELD]||{}),[id]:receipt};const after=JSON.stringify(d,null,2),before=r.raw[kind];
    const permit={};permits.set(permit,{executor:this,c,kind,before,after,tx,guard:()=>{lease();const current=this.pair(p,tx,this.trusted(p,tx,c));if(current.states[kind]!=='before'||current.raw.db!==r.raw.db||current.raw.keywords!==r.raw.keywords)fail('CENTER_GOAL_PEER_CHANGED');this.guard(kind,before,after,c,id);}});
    try{await this.publish(c,kind,before,after,{assertSynchronousLease:lease},permit);}finally{permits.delete(permit);}wrote=true;
   }lease();const end=this.pair(p,tx,this.trusted(p,tx,c));if(end.state!=='after')fail('CENTER_GOAL_INCOMPLETE');return {state:'after',alreadyApplied:!wrote};});}
}
function preserve(value,legacy){if(!value||!Object.hasOwn(value,FIELD))return null;const d=legacy.json(JSON.stringify(value));Projection.prototype.maps.call({legacy,current:Projection.prototype.current},'keywords',d);return d;}
function legacyView(kind,value,source,legacy){
 let d=copy(value);const helper={legacy,current:Projection.prototype.current},map=Projection.prototype.maps.call(helper,kind,d);
 for(const [id,r] of Object.entries(map))if(r.plan.version===3){if(r.plan.subject.sourceScope!==source)fail('CENTER_GOAL_LEGACY_SOURCE');const last=legacyList(kind,d,id).at(-1).newLabel;if(r.plan.newLabel!==last)d=Projection.prototype.mutate.call(helper,kind,d,id,r.plan.newLabel,last);}
 return d;
}
// C1 participant for the center naming adapter. Pending source (fail-closed): Mandala's goal-primary-rename-v1 journal.
const CAPABILITIES=['primary-title','primary-keywords','primary-recovery','creation','persist'];
function createParticipant(plugin){
 const ownerId='mandala-time-blocks',bridge=()=>plugin.goalRenameWriteBridge,firstBridge=bridge(),first=firstBridge?.centerNaming;
 const live=()=>!!first&&bridge()===firstBridge&&firstBridge.centerNaming===first&&!firstBridge.closed&&!plugin.isUnloading&&plugin.app?.plugins?.plugins?.[plugin.manifest?.id]===plugin;
 const need=()=>{if(!live())fail('CENTER_GOAL_PARTICIPANT_UNAVAILABLE');return first};
 const C=require('./binding-compatibility-checks.cjs'),installedWriter=first?.bridge,writerMethods=C.pinMethods(installedWriter,["capture", "assert", "serial", "sync", "write", "writeUnchecked", "journal", "list", "prepare", "confirm", "inspect", "resume"]),installedEntries=["writeJsonSafelyBeforeGoalBridge", "writeJsonBeforeGoalBridge", "writeJsonSafely", "writeJson", "getPaths"].map(k=>[k,plugin[k]]);
 const installed=()=>{if(first?.bridge!==installedWriter)fail('binding-writer-changed');writerMethods();for(const [k,fn] of installedEntries)if(typeof fn!=='function'||plugin[k]!==fn)fail('binding-entry-changed:'+k);return true};
 async function pending(c){const k=c.subjects[0].primaryNodeKey,out=[];for(const job of await firstBridge.list())if(job?.plan?.evidence?.nodeKey===k&&job.progress?.status!=='primary-complete')out.push({source:'goal-primary-rename-v1',id:job.plan.txId,status:job.progress?.status});return out}
 const participant=Object.freeze({ownerId,
  bindingCompatibility(){installed();const x=need();C.validator(S);const method=C.pinPrototype(x,Projection.prototype),writer=x.bridge,w=C.pinMethods(writer),generation=x.generation,auth=C.pinAuthority(()=>x.resolveAuthority(),()=>plugin.app.vault.adapter.getBasePath());const guard=()=>{installed();if(need()!==x||x.generation!==generation)fail('binding-writer-changed');method();w();auth();return true};guard();const proof=Object.freeze({version:1,ownerId,generation,bindingFormat:S.BINDING_FORMAT});compatibilityProofs.set(proof,{part:participant,guard});return proof;},
  status(){const ok=live();return {ownerId,mode:ok?'ready':'unavailable',generation:first?.generation||'',capabilities:ok?CAPABILITIES.slice():[]}},
  async evidence(c){const x=need(),r=await x.dryRunClaim(c.contextId),pend=c.subjects[0].domain==='goal'?await pending(c):[];need();return {ownerId,generation:x.generation,applicable:r.applicable,digest:r.digest,lineageHash:r.lineageHash,pending:pend}},
  digestNow(c){const x=need();return c.subjects[0].domain==='goal'?x.claimDigestNow(x.node(c.subjects[0])):null},
  async prepare(c,newLabel){const plan=await need().prepare(c.contextId,newLabel);need();return {id:'mandala-primary',ownerId,subject:copy(c.subjects[0]),bindings:[],plan}},
  inspect(row,txId){return need().inspect(row.plan,txId)},
  apply(row,txId,lease){return need().apply(row.plan,txId,lease)}
 });
 return participant;
}
module.exports={Projection,FIELD,preserve,hash,semantic,legacyView,createParticipant,CAPABILITIES};

const compatibilityProofs=new WeakMap();
function verifyBindingCompatibility(part,proof){const r=compatibilityProofs.get(proof);if(!r||r.part!==part)throw Error('binding-proof-unissued');r.guard();return r.guard;}
module.exports.verifyBindingCompatibility=verifyBindingCompatibility;
