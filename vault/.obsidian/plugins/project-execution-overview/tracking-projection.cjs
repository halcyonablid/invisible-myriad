"use strict";
// UI projection only. Never changes the canonical model or persisted tracking.
function projectGroups(model,states,history=false){
 const groups=model.groups||[],items=model.itemsByKey||{},edges=Object.values(model.edgesById||{}),adj=new Map();
 for(const e of edges){for(const [a,b] of [[e.sourceNodeKey,e.targetNodeKey],[e.targetNodeKey,e.sourceNodeKey]]){if(!adj.has(a))adj.set(a,new Set());adj.get(a).add(b);}}
 const result=[];
 for(const g of groups){
  const roots=Array.isArray(g.primaryNodeKeys)&&g.primaryNodeKeys.length?g.primaryNodeKeys:[g.primaryNodeKey];
  const keep=roots.filter(k=>(states.get(k)==='stopped')===history);
  if(!keep.length)continue;
  if(!history&&keep.length===roots.length){result.push(g);continue;}
  const keys=new Set(keep),column=g.primaryColumnId;
  for(const root of keep)for(const n of adj.get(root)||[]){if(items[n]?.columnId===column)continue;keys.add(n);for(const q of adj.get(n)||[]){if(items[q]?.columnId!==column)keys.add(q);}}
  const itemKeys=(g.itemKeys||[]).filter(k=>keys.has(k)),visible=new Set(itemKeys);
  const columns=Object.fromEntries(Object.entries(g.columns||{}).map(([c,list])=>[c,list.filter(x=>visible.has(x.nodeKey))]));
  const primaryNodeKey=keep.includes(g.primaryNodeKey)?g.primaryNodeKey:keep[0];
  const edgeCount=edges.filter(e=>visible.has(e.sourceNodeKey)&&visible.has(e.targetNodeKey)).length;
  result.push({...g,primaryNodeKey,primaryNodeKeys:keep,primarySiblingCount:keep.length,title:items[primaryNodeKey]?.label||g.title,itemKeys,columns,itemCount:itemKeys.length,edgeCount,hasRelations:edgeCount>0,trackingProjection:history?'stopped-history':'current',stoppedMemberCount:roots.length-keep.length});
 }
 return result;
}
async function collectTracking(model,api,isCurrent){
 const states=new Map();
 try{
  if(typeof api?.getContextTrackingScopeV1!=='function'||typeof api?.listContextTrackingStatesV1!=='function')throw Error('追踪服务未就绪，请重载九宫格插件');
  const scope=api.getContextTrackingScopeV1();
  if(!scope?.ok||scope.contractVersion!==1||!scope.sourceScope||!scope.providerGeneration)throw Error('追踪来源不可核验');
  const subjects=[],seen=new Set();
  for(const g of model.groups||[])for(const k of g.primaryNodeKeys?.length?g.primaryNodeKeys:[g.primaryNodeKey]){
   const domain=g.mode==='workspace'?'project':g.mode==='mandala'?'goal':null;if(!domain||!k||seen.has(k))continue;seen.add(k);subjects.push({domain,nodeKey:k});
  }
  if(subjects.length>5000)throw Error('追踪对象超过本次读取上限，请缩小范围');
  let revision=null;
  for(let i=0;i<subjects.length;i+=500){
   const batch=subjects.slice(i,i+500),r=await api.listContextTrackingStatesV1({contractVersion:1,sourceNotePath:scope.sourceScope,subjects:batch});
   if(!isCurrent())throw Error('追踪来源已变化');
   const fresh=api.getContextTrackingScopeV1();
   if(!fresh?.ok||fresh.sourceScope!==scope.sourceScope||fresh.providerGeneration!==scope.providerGeneration||!r?.ok||r.contractVersion!==1||r.snapshotType!=='mandala-context-tracking-states-v1'||r.coveredScope!=='requested-exact-subjects'||r.complete!==true||r.truncated!==false||r.hasMore!==false||r.sourceScope!==scope.sourceScope||r.providerGeneration!==scope.providerGeneration||!r.revision||r.count!==batch.length||r.returnedCount!==batch.length||r.totalCount!==batch.length||!Array.isArray(r.items)||r.items.length!==batch.length)throw Error('追踪证据不完整');
   if(revision&&revision!==r.revision)throw Error('追踪版本已变化，请刷新');revision=r.revision;
   const expected=new Map(batch.map(s=>[s.nodeKey,s.domain])),returned=new Set();
   for(const x of r.items){if(!expected.has(x.nodeKey)||expected.get(x.nodeKey)!==x.domain||returned.has(x.nodeKey)||x.trackingSource!==scope.sourceScope||!['active','stopped','unrecorded'].includes(x.status)||x.explicit!==(x.status!=='unrecorded'))throw Error('追踪身份不完整');returned.add(x.nodeKey);states.set(x.nodeKey,x.status);}
  }
  if(!isCurrent())throw Error('追踪来源已变化');
  return {ok:true,states,sourceScope:scope.sourceScope,providerGeneration:scope.providerGeneration,revision};
 }catch(e){return {ok:false,states:new Map(),error:e.message||'追踪状态暂不可用'};}
}
module.exports={projectGroups,collectTracking};
