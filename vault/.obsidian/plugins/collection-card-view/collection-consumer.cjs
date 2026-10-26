'use strict';
const {ConsumerFence,issueProcess,createConsumerParticipant}=require('./consumer-fence.cjs');
const {createLocalIO}=require('./consumer-local-io.cjs');
const fail=s=>{throw Error(s)};
// C1 A3: an unbound owner's default source must resolve to exactly one Markdown file outside .trash/.
function uniqueSource(app,want,resolved){if(typeof want!=='string'||!want.trim())fail('consumer-default-source-missing');const w=want.trim().replace(/\\/g,'/').replace(/^\/+/,''),base=w.split('/').pop().replace(/\.md$/i,'');
 const hits=app.vault.getMarkdownFiles().filter(f=>!f.path.startsWith('.trash/')&&(f.path===w||f.path===w+'.md'||f.path.endsWith('/'+w)||f.path.endsWith('/'+w+'.md')||f.basename===base));
 if(typeof resolved!=='string'||resolved.startsWith('.trash/')||hits.length!==1||hits[0].path!==resolved)fail('consumer-default-source-ambiguous');return resolved}

// Collection may have several source notes (one per view). Each publication names its
// source explicitly; the source must still resolve exactly to the same data/keyword files.
function installCollectionConsumer(plugin){
 const app=plugin.app,id=plugin.manifest.id,owner=plugin.getContextRenameOwner();
 const live=()=>{owner.assertLive();if(plugin.contextRenameClosed===true||app.plugins?.plugins?.[id]!==plugin)fail('collection-consumer-replaced')};
 const resolve=source=>{live();const f=typeof source==='string'&&source?plugin.resolveSourceFile(source):null;if(f?.path!==source)fail('collection-source-unresolved');
  const dataPath=plugin.resolveDataPathForFile(f),keywordPath=plugin.resolveTabCapsuleKeywordsPathForFile(f);if(!dataPath||!keywordPath)fail('collection-source-unresolved');return {sourceNotePath:source,dataPath,keywordPath}};
 const io=createLocalIO(app,plugin.manifest.dir||`.obsidian/plugins/${id}`,resolve,live);
 const authority=()=>{live();return app.plugins?.plugins?.['context-key-manager']?.getNamingProjectionAuthorityV1?.()};
 const fence=new ConsumerFence(owner,authority,io);
 function leaseFor(file,source){
  const scope=resolve(source);if(!fence.equivalent(file,scope.dataPath)&&!fence.equivalent(file,scope.keywordPath))fail('collection-publish-source-path');
  return ()=>{live();if(JSON.stringify(resolve(source))!==JSON.stringify(scope))fail('collection-source-changed')};
 }
 async function publishUnchecked(file,payload,source,guard=()=>true){
  const lease=leaseFor(file,source),capture=fence.capture();
  const result=await io.process(file,raw=>{lease();fence.fresh(capture);fence.sync(()=>guard(raw));const next=typeof payload==='function'?payload(raw):payload;fence.guardFile(file,raw,next);lease();return next});
  lease();fence.fresh(capture);const readback=io.read(file);if(readback!==result)fail('collection-publish-readback');fence.guardFile(file,readback,readback);lease();fence.fresh(capture);return result;
 }
 async function publish(...args){try{return await publishUnchecked(...args)}catch(e){plugin.c2InputRecovery?.report(e);throw e;}}
 const api=Object.freeze({publish,readFile:io.read,
  // Throws when the center authority is unavailable, so callers can refuse before any write attempt.
  preflight:()=>{fence.capture();return true},
  inspect:(plan,txId)=>fence.inspect(plan,txId),
  async apply(plan,txId,lease){const scope=resolve(plan.scope.sourceNotePath);const result=await fence.apply(plan,txId,()=>{live();if(JSON.stringify(resolve(plan.scope.sourceNotePath))!==JSON.stringify(scope))fail('collection-source-changed');return lease()});owner.generations.set(plan.scope.keywordPath,(owner.generations.get(plan.scope.keywordPath)||0)+1);return result},
  // No view hydration: views holding pre-apply keyword data must reopen; their saves are refused.
  close:()=>fence.close()
 });
 // C1: the owner's final writer is this module-issued publisher (same call as main.js), so a participant can prove it.
 owner.c.process=issueProcess((scope,callback)=>api.publish(scope.keywordPath,callback,scope.sourceNotePath));
 const participant=createConsumerParticipant({fence,ownerId:id,owner,api,defaultScope:()=>{const f=plugin.resolveSourceFile(plugin.getDefaultSourceNotePath());return resolve(uniqueSource(app,plugin.getDefaultSourceNotePath(),f?.path))},ready:()=>true});
 const bindingParticipant=require('./collection-binding.cjs').createBindingParticipant({owner,io,fence,authority,live,defaultScope:()=>{const f=plugin.resolveSourceFile(plugin.getDefaultSourceNotePath());return resolve(uniqueSource(app,plugin.getDefaultSourceNotePath(),f?.path))},root:()=>app.vault.adapter.getBasePath(),report:e=>plugin.c2InputRecovery?.report(e)});
 return Object.freeze({...api,participant,bindingParticipant});
}
module.exports={installCollectionConsumer};

// C2 refusal remains a rejection; the caller must not treat it as saved.
