'use strict';
const {ConsumerFence,issueProcess,createConsumerParticipant}=require('./consumer-fence.cjs');
const {createLocalIO}=require('./consumer-local-io.cjs');
const fail=s=>{throw Error(s)};
// C1 A3: an unbound owner's default source must resolve to exactly one Markdown file outside .trash/.
function uniqueSource(app,want,resolved){if(typeof want!=='string'||!want.trim())fail('consumer-default-source-missing');const w=want.trim().replace(/\\/g,'/').replace(/^\/+/,''),base=w.split('/').pop().replace(/\.md$/i,'');
 const hits=app.vault.getMarkdownFiles().filter(f=>!f.path.startsWith('.trash/')&&(f.path===w||f.path===w+'.md'||f.path.endsWith('/'+w)||f.path.endsWith('/'+w+'.md')||f.basename===base));
 if(typeof resolved!=='string'||resolved.startsWith('.trash/')||hits.length!==1||hits[0].path!==resolved)fail('consumer-default-source-ambiguous');return resolved}

// Owns no business state. Every public publication is an ordinary guarded write;
// only ConsumerFence can issue the private center-transition permit.
function installWorkspaceConsumer(plugin){
 const app=plugin.app,id=plugin.manifest.id,owner=plugin.getContextRenameOwner();
 const live=()=>{owner.assertLive();if(plugin.isUnloading||app.plugins?.plugins?.[id]!==plugin)fail('workspace-consumer-replaced')};
 const current=()=>{live();const requested=plugin.resolveApiSourceNotePath(),f=plugin.resolveSourceFile(requested);if(!requested||f?.path!==requested)fail('workspace-source-unresolved');return requested};
 const resolve=source=>{live();const f=plugin.resolveSourceFile(source);if(f?.path!==source)fail('workspace-source-unresolved');const p=plugin.resolveWorkspaceDataPathsForSourceFile(f);if(!p?.dataPath||!p.tabCapsuleKeywordsPath)fail('workspace-source-unresolved');return {sourceNotePath:source,dataPath:p.dataPath,keywordPath:p.tabCapsuleKeywordsPath}};
 const io=createLocalIO(app,plugin.manifest.dir||`.obsidian/plugins/${id}`,resolve,live);
 const authority=()=>{live();return app.plugins?.plugins?.['context-key-manager']?.getNamingProjectionAuthorityV1?.()};
 const fence=new ConsumerFence(owner,authority,io);
 function leaseFor(file,source){
  const selected=current(),resolved=source||selected,scope=resolve(resolved),paths=plugin.resolveWorkspaceDataPathsForSourceFile(plugin.resolveSourceFile(resolved));
  if(!Object.values(paths).some(p=>typeof p==='string'&&fence.equivalent(file,p)))fail('workspace-publish-source-path');
  return ()=>{live();if(current()!==selected||JSON.stringify(resolve(resolved))!==JSON.stringify(scope))fail('workspace-source-changed')};
 }
 async function publishUnchecked(file,payload,source='',guard=()=>true){
  const lease=leaseFor(file,source),capture=fence.capture();
  const result=await io.process(file,raw=>{lease();fence.fresh(capture);fence.sync(()=>guard(raw));const next=typeof payload==='function'?payload(raw):payload;fence.guardFile(file,raw,next);lease();return next});
  // Adapter reads work before Obsidian's filesystem watcher creates a TFile.
  if(io.read(file)!==result)fail('workspace-publish-readback');return result;
 }
 async function publish(...args){try{return await publishUnchecked(...args)}catch(e){plugin.c2InputRecovery?.report(e);throw e;}}
 const api=Object.freeze({publish,readFile:io.read,
  inspect:(plan,txId)=>fence.inspect(plan,txId),
  async apply(plan,txId,lease){const selected=current();const result=await fence.apply(plan,txId,()=>{live();if(current()!==selected)fail('workspace-source-changed');return lease()});owner.generations.set(plan.scope.keywordPath,(owner.generations.get(plan.scope.keywordPath)||0)+1);return result},
  // No automatic UI hydration: existing drafts keep their old generation and
  // must reload explicitly; a center apply cannot overwrite unsaved edits.
  close:()=>fence.close()
 });
 // C1: the owner's final writer is this module-issued publisher (same call as main.js), so a participant can prove it.
 owner.c.process=issueProcess((scope,callback)=>api.publish(scope.keywordPath,callback,scope.sourceNotePath));
 const participant=createConsumerParticipant({fence,ownerId:id,owner,api,defaultScope:()=>{const f=plugin.resolveSourceFile(plugin.getDefaultSourceNotePath());return resolve(uniqueSource(app,plugin.getDefaultSourceNotePath(),f?.path))},ready:()=>true});
 return Object.freeze({...api,participant});
}
module.exports={installWorkspaceConsumer};

// C2 refusal remains a rejection; the caller must not treat it as saved.
