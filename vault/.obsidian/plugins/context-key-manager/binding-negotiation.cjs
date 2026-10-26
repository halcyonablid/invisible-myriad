'use strict';
// Read-only negotiation. No storage upgrade, business access, polling or write permit.
const fs=require('node:fs'),path=require('node:path');
const N=require('./naming-adapter.cjs'),{isAuthority}=require('./authority.cjs'),K=require('./binding-transition.cjs');
const negotiators=new WeakSet(),HARNESS=Symbol.for('ckm.naming.test-harness');
const fail=s=>{throw Error(s)},FILES={'project-execution-overview':'center-peo-projection.cjs','mandala-time-blocks':'center-mandala-projection.cjs','workspace-mount':'consumer-fence.cjs','gtd-task-manager':'consumer-fence.cjs','collection-card-view':'consumer-fence.cjs'};
function moduleAt(app,id,name){
 const plugin=app.plugins?.plugins?.[id],base=app.vault.adapter.getBasePath(),relative=plugin?.manifest?.dir;
 if(!plugin||plugin.manifest.id!==id||!path.isAbsolute(base)||typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).some(x=>!x||x==='.'||x==='..'))fail('binding-module-path:'+id);
 const root=path.resolve(base),dir=path.resolve(root,relative),file=path.join(dir,name);
 if(!dir.startsWith(root+path.sep)||fs.realpathSync(file)!==file)fail('binding-module-path:'+id);
 // The installed owner must belong to this exact vault/app, not a second window's owner.
 if(plugin.app!==app)fail('binding-owner-app:'+id);
 const mod=require(file);if(typeof mod.verifyBindingCompatibility!=='function')fail('binding-module-old:'+id);
 return {plugin,file,mod};
}
function createNegotiator({app,authority,adapter,isLive,installed=()=>false}){
 if(!isAuthority(authority)||!N.isAdapter(adapter))fail('binding-negotiation-config');
 const base=app.vault.adapter.getBasePath(),authorityApi=authority.api;let closed=false;
 const live=()=>{if(closed||authority.closed||!isLive()||app.vault.adapter.getBasePath()!==base||app.plugins?.plugins?.['context-key-manager']?.getNamingProjectionAuthorityV1?.()!==authorityApi)fail('binding-host-changed');return true};
 async function attest(){
  live();const att=await adapter.attest();N.verify(adapter,'attest',att);live();att.guard();
  const checks=[];
  for(const [id,file] of Object.entries(FILES)){
   const loaded=moduleAt(app,id,file),part=loaded.plugin.getCenterNamingParticipantV1?.();
   if(typeof part?.bindingCompatibility!=='function')fail('binding-participant-old:'+id);
   const proof=part.bindingCompatibility(),guard=loaded.mod.verifyBindingCompatibility(part,proof);if(proof.bindingFormat!==K.BINDING_FORMAT)fail('binding-format-unsupported:'+id);
   checks.push(()=>{const now=moduleAt(app,id,file);if(now.plugin!==loaded.plugin||now.file!==loaded.file||now.mod!==loaded.mod||now.plugin.getCenterNamingParticipantV1()!==part)fail('binding-factory-changed:'+id);guard();});
   if(id==='collection-card-view'){
    const writer=moduleAt(app,id,'collection-binding.cjs'),b=loaded.plugin.getCenterBindingParticipantV1?.();
    if(typeof b?.bindingCompatibility!=='function'||typeof b.exclusive!=='function')fail('binding-writer-unavailable');const p=b.bindingCompatibility(),g=writer.mod.verifyBindingCompatibility(b,p);if(p.bindingFormat!==K.BINDING_FORMAT)fail('binding-format-unsupported:collection-binding');
    checks.push(()=>{const now=moduleAt(app,id,'collection-binding.cjs');if(now.mod!==writer.mod||now.plugin.getCenterBindingParticipantV1()!==b)fail('binding-writer-changed');g();});
   }
  }
  const guard=()=>{live();att.guard();for(const check of checks)check();return true};guard();
  return Object.freeze({mode:'compatible',scope:'same-source-project-collection-v2',guard});
 }
 const n=Object.freeze({attest,async status(){const enabled=installed()===true;try{const p=await attest();p.guard();return {mode:'compatible',enabled,scope:p.scope};}catch(e){return {mode:'unavailable',enabled,reason:String(e.message||e)}}},close(){closed=true}});negotiators.add(n);return n;
}
// Test code only: a harness-set process may supply its own attestation (never reachable in production).
function createTestNegotiator(attest){if(globalThis[HARNESS]!==true)fail('binding-negotiation-test-only');const n=Object.freeze({attest,async status(){return {mode:'compatible',enabled:true,scope:'test'}},close(){}});negotiators.add(n);return n;}
module.exports={createNegotiator,createTestNegotiator,isNegotiator:n=>negotiators.has(n)};
