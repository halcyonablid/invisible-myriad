"use strict";
const {hash,model}=require('./store.cjs');
const names=['__mandalaTimeBlocksPluginApi','__workspaceMountPluginApi','__gtdTaskManagerPluginApi','__collectionCardViewPluginApi'];
const owners=['workspace-mount','gtd-task-manager','collection-card-view'];
const fail=x=>{throw Error(x);};
class Provider {
 constructor(getGlobals,validate,options={}){this.globals=getGlobals;this.validate=validate;this.timeout=options.timeout||10000;}
 refs(){const g=this.globals();return names.map(n=>g[n]);}
 async observe(row,isCurrent=()=>true){const refs=this.refs();if(refs.some(x=>!x))fail('provider-missing');const api=refs[0],method=row.domain==='project'?'listEffectiveOperationalContextKeys':'listEffectiveGoalOperationalContextKeys';if(!['project','goal'].includes(row.domain)||typeof api[method]!=='function'||typeof api.getContextTrackingScopeV1!=='function')fail('provider-contract-missing');
  const scope=api.getContextTrackingScopeV1();if(!scope?.ok||scope.sourceScope!==row.providerScope)fail('provider-source-changed');let expired=false,timer;
  const guard=()=>{if(expired||!isCurrent()||this.refs().some((x,i)=>x!==refs[i])||hash(api.getContextTrackingScopeV1())!==hash(scope))fail('provider-stale');};
  const work=async()=>{guard();const snapshot=await api[method]({source:'context-key-manager'});guard();const rows=this.validate(snapshot,row.domain),matches=rows.filter(x=>x.nodeKey===row.nodeKey&&x.providerScope===row.providerScope);if(matches.length!==1||matches[0].ownerSourceScope!==row.ownerSourceScope||matches[0].label!==row.label||row.label==='名称不可用')fail('subject-not-current');if(rows.filter(x=>x.label.toLocaleLowerCase()===row.label.toLocaleLowerCase()).length!==1)fail('label-candidates-ambiguous');// Tracking service and effective-list generations are separate domains.
   const effectiveGeneration=snapshot.providerGeneration;
   // Compatibility prepare is strictly read-only. Never call verify/commit (they publish).
   const plans=await Promise.all(refs.slice(1).map(async(owner,i)=>{if(typeof owner.contextCapsuleRenameV2!=='function')fail('owner-contract-missing');const result=await owner.contextCapsuleRenameV2({source:'project-execution-overview',phase:'prepare',oldDisplayLabel:row.label,newDisplayLabel:row.label});guard();const p=result?.plan;if(!result?.ok||result.version!==2||p?.version!==2||p.pluginId!==owners[i]||!p.scope?.sourceNotePath||!Array.isArray(p.targets)||p.targets.length>1||result.matchedCount!==p.targets.length)fail('owner-proof-invalid:'+owners[i]);for(const t of p.targets)if(!t.recordHash||!Array.isArray(t.oldLabels)||!t.oldLabels.includes(row.label))fail('owner-reference-invalid');return p;}));guard();const subject={domain:row.domain,ownerId:row.domain==='project'?'workspace-mount':'mandala-time-blocks',sourceScope:row.ownerSourceScope,primaryNodeKey:row.nodeKey};model.subjectKey(subject);const bindings=plans.flatMap(p=>p.targets.map(t=>({ownerId:p.pluginId,sourceScope:p.scope.sourceNotePath,carrierId:t.carrierId})));bindings.forEach(model.bindingKey);if(row.domain==='project'){if(plans[0].scope.sourceNotePath!==subject.sourceScope)fail('primary-source-mismatch');}
   const current=await api[method]({source:'context-key-manager'});guard();
   const currentRows=this.validate(current,row.domain),currentMatches=currentRows.filter(x=>x.nodeKey===row.nodeKey&&x.providerScope===row.providerScope);
   if(currentMatches.length!==1||hash(currentMatches[0])!==hash(matches[0]))fail('subject-not-current');
   if(currentRows.filter(x=>x.label.toLocaleLowerCase()===row.label.toLocaleLowerCase()).length!==1)fail('label-candidates-ambiguous');
   if(current.providerGeneration!==effectiveGeneration)fail('provider-generation-changed');
   if(current.revision!==snapshot.revision)fail('provider-revision-changed');
   const evidence={version:1,scope,effectiveGeneration,revision:snapshot.revision,row:matches[0],plans};return {row:matches[0],subject,bindings,digest:hash(evidence),guard,observation:{kind:'committed-owner-observation',row:matches[0],digest:hash({row:matches[0],plans}),providerGeneration:scope.providerGeneration,providerRevision:snapshot.revision,observedAt:new Date().toISOString()}};};
  try{return await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('provider-timeout'));},this.timeout);})]);}finally{clearTimeout(timer);}
 }
}
module.exports={Provider,names};
