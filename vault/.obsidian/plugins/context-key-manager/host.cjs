"use strict";
const path=require('node:path'),fs=require('node:fs');
const {createAuthority}=require('./authority.cjs'),{Provider}=require('./provider.cjs'),{Controller}=require('./controller.cjs');
const crypto=require('node:crypto');
const HARNESS=Symbol.for('ckm.naming.test-harness'),internals=new WeakMap();
// R1: the explicit v4->v6 upgrade entry ships disabled. It is enabled only together with the BindingService (same
// review, same deployment) or by test code that set both harness symbols before install.
const BINDING_SERVICE_INSTALLED=true,UPGRADE_TEST=Symbol.for('ckm.binding.upgrade-test-enable');
// C1 A9: the center's own participant is ready only while the v4 retirement code is installed (legacy registration
// refused in Controller and in the UI); checked once against the loaded module functions.
const RETIRED=String(Controller.prototype.previewRegistration).includes('legacy-registration-retired-use-center-management')&&String(require('./ui.cjs').createUI).includes('存储已升级');
function install(plugin,obsidian){
 const base=plugin.app.vault.adapter.getBasePath?.(),relative=plugin.manifest.dir;
 if(!base||!path.isAbsolute(base)||typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).some(x=>['','..','.'].includes(x)))throw Error('identity-host-path-unresolved');
 const root=path.resolve(base,relative,'identity-v3');if(!root.startsWith(path.resolve(base)+path.sep))throw Error('identity-host-path-outside-vault');
 // Reads v4 and v6 frames; startup, refresh, negotiation and UI opening never upgrade.
 const authority=createAuthority(root,{enableBinding:true});
 const service=new Controller(authority.store,new Provider(()=>globalThis,require('./directory.cjs').validate),authority);
 const projectionApi=()=>authority.api;plugin.getNamingProjectionAuthorityV1=projectionApi;
 // OS watchers only invalidate session snapshots; they never read or write business data.
 let watcher,storeWatcher;const watch=()=>{try{watcher=fs.watch(path.dirname(root),(_event,name)=>{if(String(name)==='identity-v3'){service.invalidate();watchStore();}});}catch{}};
 const watchStore=()=>{if(storeWatcher||!fs.existsSync(root))return;try{storeWatcher=fs.watch(root,()=>service.invalidate());}catch{}};watch();watchStore();
 for(const event of ['modify','rename','delete','create'])if(plugin.app.vault.on&&plugin.registerEvent)plugin.registerEvent(plugin.app.vault.on(event,()=>service.invalidate()));
 const call=fn=>async(...args)=>{try{return fn(...args);}catch(e){return {ok:false,reason:e.message};}};
 const api=Object.freeze({contractVersion:1,authority:'registered-identity-only',listIdentitiesV1:call(o=>service.read(o)),getIdentityV1:call(id=>service.get(id)),resolveIdentityReferenceV1:call(r=>service.exact(r)),resolveLegacyIdentityV1:call(q=>service.resolve(q)),refreshIdentitiesV1:call(()=>{service.invalidate();return service.read();}),subscribeInvalidationV1:fn=>{service.listeners.add(fn);return()=>service.listeners.delete(fn);}});
 plugin.contextIdentityApi=api;const UI=require('./ui.cjs').createUI(obsidian,plugin,service);
 // C1: naming service with the production adapter. It lives only in this closure (C1 A5); the public host object
 // exposes button/open/close, so no other plugin can reach the store, the controller or the naming service.
 let closed=false;const generation=crypto.randomUUID();
 const center=Object.freeze({ownerId:'context-key-manager',status:()=>{const ok=RETIRED&&!closed&&!authority.closed;return {ownerId:'context-key-manager',mode:ok?'ready':'unavailable',generation,capabilities:ok?['registration-bind','creation']:[]}}});
 const {NamingService}=require('./naming-service.cjs'),adapter=require('./naming-adapter.cjs').createAdapter({app:plugin.app,center});
 // C1 R14/A8: measured resume at NEWERA scale is ~5-7 s (Node, temp disk); 3x that with margin for slower disks.
 // B8: one gate value, computed once per install: the BindingService and the upgrade entry exist together or not at all.
 const gate=BINDING_SERVICE_INSTALLED||(globalThis[HARNESS]===true&&globalThis[UPGRADE_TEST]===true);let binding=null;
 const settledEvent=()=>{try{globalThis.window?.dispatchEvent?.(new CustomEvent('context-key-manager:naming-settled-v1'));}catch{}};
 const naming=new NamingService(authority.store,adapter,{allowInternalHarness:false,timeoutMs:30000,onSettled:()=>{binding?.clearPreviews?.();settledEvent();}});
 const participantStatus=()=>Object.keys(require('./naming-service.cjs').FENCES).map(ownerId=>{try{const p=ownerId==='context-key-manager'?center:plugin.app.plugins?.plugins?.[ownerId]?.getCenterNamingParticipantV1?.();return {ownerId,mode:p?.status()?.mode==='ready'?'ready':'unavailable'};}catch{return {ownerId,mode:'unavailable'};}});
 const negotiation=require('./binding-negotiation.cjs').createNegotiator({app:plugin.app,authority,adapter,installed:()=>gate,isLive:()=>!closed&&!plugin.closed&&plugin.app.plugins?.plugins?.['context-key-manager']===plugin});
 const registration=new (require('./registration.cjs').RegistrationService)(naming,service.provider);
 // P2-E: created-context adoption (register + claim through the services above); host-private like the projection API,
 // removed on close, live-checked on every call; PEO must not cache it.
 const adoption=require('./creation-adoption.cjs').createAdoptionService({app:plugin.app,authority,naming,registration,validate:require('./directory.cjs').validate,isLive:()=>!closed&&!plugin.closed&&!authority.closed&&plugin.app.plugins?.plugins?.['context-key-manager']===plugin}),adoptionApi=()=>adoption;plugin.getCreatedContextAdoptionV1=adoptionApi;
 const upgrade=require('./binding-upgrade.cjs').createUpgradeService({enabled:gate,authority,negotiation,naming,service,isLive:()=>!closed&&!plugin.closed&&plugin.app.plugins?.plugins?.['context-key-manager']===plugin});
 // Y1: explicit binding-format migration (1 -> 2), same gate and guards as the storage upgrade.
 const formatUpgrade=require('./binding-format-upgrade.cjs').createFormatUpgradeService({enabled:gate,authority,negotiation,naming,service,isLive:()=>!closed&&!plugin.closed&&plugin.app.plugins?.plugins?.['context-key-manager']===plugin});
 // B7/B13: binding operations settle like naming ones (views refresh, previews expire); 30 s like naming (measured in tests).
 if(gate){const BS=require('./binding-service.cjs');binding=BS.createBindingService({authority,adapter:BS.createBindingAdapter({app:plugin.app,namingAdapter:adapter,negotiation}),timeoutMs:30000,onSettled:()=>{naming.invalidate();service.invalidate();settledEvent();}});}
 const namingUI=require('./naming-ui.cjs').createNamingUI(obsidian,plugin,{service,naming,registration,legacy:UI,isLive:()=>!closed&&!plugin.closed&&!authority.closed&&plugin.app.plugins?.plugins?.['context-key-manager']===plugin,participantStatus,bindingCompatibility:()=>negotiation.status(),bindingUpgrade:upgrade,bindingFormatUpgrade:formatUpgrade,binding});
 const host={bindingCompatibility:()=>negotiation.status(),open:row=>namingUI.open(row),button(parent,row){const b=parent.createEl('button',{text:row?'名称与同步':'名称与同步 / 存储维护'});b.onclick=()=>namingUI.open(row);return b;},close(){namingUI.close();closed=true;upgrade.close();formatUpgrade.close();binding?.close();negotiation.close();naming.close();watcher?.close();storeWatcher?.close();authority.close();service.close();UI.close();if(plugin.getNamingProjectionAuthorityV1===projectionApi)delete plugin.getNamingProjectionAuthorityV1;if(plugin.getCreatedContextAdoptionV1===adoptionApi)delete plugin.getCreatedContextAdoptionV1;if(plugin.contextIdentityApi===api)delete plugin.contextIdentityApi;}};
 if(globalThis[HARNESS]===true)internals.set(host,{service,authority,naming,adapter,center,negotiation,upgrade,formatUpgrade,binding,registration,adoption});
 return host;
}
// Test hook only: internals are recorded when test code set the harness symbol before install.
module.exports={install,internals};
