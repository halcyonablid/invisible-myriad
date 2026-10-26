'use strict';
const {ConsumerFence,issueProcess,createConsumerParticipant}=require('./consumer-fence.cjs');
const {createLocalIO}=require('./consumer-local-io.cjs');
const fail=s=>{throw Error(s)},DB='GTD_Database.json';
// GTD has one configured source. Tags/TagKeywords are the binding files; the
// Database is an array and is published separately, never through guardFile.
function installGtdConsumer(plugin){
 const app=plugin.app,id=plugin.manifest.id,owner=plugin.getContextRenameOwner();
 const live=()=>{owner.assertLive();if(plugin.contextRenameClosed===true||app.plugins?.plugins?.[id]!==plugin)fail('gtd-consumer-replaced')};
 const scopeOf=()=>{live();const s=plugin.resolveContextRenameScope();if(!s?.sourceNotePath||!s.dataPath||!s.keywordPath)fail('gtd-source-unresolved');return s};
 const resolve=source=>{const s=scopeOf();if(s.sourceNotePath!==source)fail('gtd-source-unresolved');return {sourceNotePath:s.sourceNotePath,dataPath:s.dataPath,keywordPath:s.keywordPath}};
 const dbPath=s=>{const i=s.dataPath.lastIndexOf('/');return (i<0?'':s.dataPath.slice(0,i+1))+DB};
 const io=createLocalIO(app,plugin.manifest.dir||`.obsidian/plugins/${id}`,resolve,live);
 const authority=()=>{live();return app.plugins?.plugins?.['context-key-manager']?.getNamingProjectionAuthorityV1?.()};
 const fence=new ConsumerFence(owner,authority,io);
 // The engine passes its own folder-relative path; it must name a file of the current source.
 function leaseFor(file,source,allowed){
  const scope=resolve(source),paths={tags:scope.dataPath,keywords:scope.keywordPath,database:dbPath(scope)};
  const kind=Object.keys(paths).find(k=>fence.equivalent(file,paths[k]));if(!kind||!allowed.includes(kind))fail('gtd-publish-source-path');
  return {kind,lease:()=>{live();if(JSON.stringify(resolve(source))!==JSON.stringify(scope))fail('gtd-source-changed')},scope};
 }
 async function publishUnchecked(file,payload,source,guard=()=>true){
  const {lease}=leaseFor(file,source,['tags','keywords']),capture=fence.capture();
  const result=await io.process(file,raw=>{lease();fence.fresh(capture);fence.sync(()=>guard(raw));const next=typeof payload==='function'?payload(raw):payload;fence.guardFile(file,raw,next);lease();return next});
  if(io.read(file)!==result)fail('gtd-publish-readback');return result;
 }
 async function publishDatabaseUnchecked(file,payload,source,guard=()=>true){
  const {lease,scope}=leaseFor(file,source,['database']),capture=fence.capture();
  const check=c=>{
   if(fence.equivalent(file,scope.dataPath)||fence.equivalent(file,scope.keywordPath))fail('gtd-database-aliases-binding-file');
   if(!c.unconfigured)for(const r of fence.rows(c.s))if(fence.equivalent(file,r.scope.dataPath)||fence.equivalent(file,r.scope.keywordPath))fail('gtd-database-aliases-binding-file');
  };
  const result=await io.process(file,raw=>{
   lease();const c=fence.fresh(capture);check(c);fence.sync(()=>guard(raw));const next=typeof payload==='function'?payload(raw):payload;
   if(typeof next!=='string'||Buffer.byteLength(next)>8*1024*1024||!Array.isArray(JSON.parse(next)))fail('gtd-database-schema');lease();return next;
  });
  if(io.read(file)!==result)fail('gtd-publish-readback');return result;
 }
 async function publish(...args){try{return await publishUnchecked(...args)}catch(e){plugin.c2InputRecovery?.report(e);throw e;}}
 async function publishDatabase(...args){try{return await publishDatabaseUnchecked(...args)}catch(e){plugin.c2InputRecovery?.report(e);throw e;}}
 const pendingHydration=new Map();let hydrationTimer=null;
 const flushHydration=()=>{hydrationTimer=null;const scopes=[...pendingHydration.values()];pendingHydration.clear();
  for(const scope of scopes)(async()=>{try{live();await owner.enqueue(scope,async()=>{live();const data=JSON.parse(io.read(scope.keywordPath));await owner.c.publish?.(scope,owner.stamp(data,scope));});}catch(e){console.warn('[gtd-task-manager][center-apply] engine keyword refresh skipped',String(e?.message||e).slice(0,200));}})();
 };
 const onNamingSettled=()=>{if(pendingHydration.size&&!hydrationTimer)hydrationTimer=setTimeout(flushHydration,0);};
 globalThis.window?.addEventListener?.('context-key-manager:naming-settled-v1',onNamingSettled);
 const stopHydration=()=>{globalThis.window?.removeEventListener?.('context-key-manager:naming-settled-v1',onNamingSettled);if(hydrationTimer)clearTimeout(hydrationTimer);hydrationTimer=null;pendingHydration.clear();};
 const api=Object.freeze({publish,publishDatabase,readFile:io.read,
  inspect:(plan,txId)=>fence.inspect(plan,txId),
  async apply(plan,txId,lease){const scope=scopeOf();pendingHydration.set(plan.scope.keywordPath,{sourceNotePath:plan.scope.sourceNotePath,dataPath:plan.scope.dataPath,keywordPath:plan.scope.keywordPath});const result=await fence.apply(plan,txId,()=>{live();if(JSON.stringify(scopeOf())!==JSON.stringify(scope))fail('gtd-source-changed');return lease()});owner.generations.set(plan.scope.keywordPath,(owner.generations.get(plan.scope.keywordPath)||0)+1);return result},
  // Engine memory is hydrated from the committed file only after the center's naming operation has settled
  // (outside its exclusive writer), with the owner's current generation stamp: GTD keyword edits save at once, so
  // the engine holds no unsaved keyword state to lose. Workspace/Collection keep their reopen-only rule.
  close:()=>{stopHydration();fence.close()}
 });
 // C1: the owner's final writer is this module-issued publisher (same call as main.js), so a participant can prove it.
 owner.c.process=issueProcess((scope,callback)=>api.publish(scope.keywordPath,callback,scope.sourceNotePath));
 const participant=createConsumerParticipant({fence,ownerId:id,owner,api,defaultScope:()=>{return resolve(scopeOf().sourceNotePath)},ready:()=>typeof plugin.createEngineCenterPublisherV1==='function'});
 return Object.freeze({...api,participant});
}
module.exports={installGtdConsumer};

// C2 refusal remains a rejection; the caller must not treat it as saved.

// C2 refusal remains a rejection; the caller must not treat it as saved.
