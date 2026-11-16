'use strict';
module.exports=async function run(context) {
  const {app,activeFile,settings,model,view,layout,navigation,session,window,Notice}=context;
  let closed=false,building=false,pending=false,timer=null,ui=null,unsubscribe=null,navigating=false;
  const current=()=>!closed&&context.isCurrent();
  const config=()=>JSON.stringify([{schema:2,classificationVersion:model.VERSION,maxDepth:settings.maxDepth},{query:'exact-path'}]);
  const close=()=>{if(closed)return;closed=true;clearTimeout(timer);unsubscribe?.();ui?.destroy();if(window.__referenceGraphWidgetRuntime===api)delete window.__referenceGraphWidgetRuntime;};
  const api={close,refresh:()=>rebuild(true),applySettings:next=>{
    const depthChanged=next.maxDepth!==settings.maxDepth;
    Object.assign(settings,next);ui?.applySettings(next);
    if(depthChanged){session.invalidate('settings');void rebuild();}
  },inspect:()=>({view:ui?.inspect(),mermaid:context.mermaidService.inspect(),session:session.inspect(),counters:{...session.counters}})};
  window.__referenceGraphWidgetRuntime?.close?.();window.__referenceGraphWidgetRuntime=api;
  ui=view.mount({...context,layout,onClose:close,onRefresh:()=>rebuild(true),
    onOpen:async node=>{if(navigating||!current())return false;navigating=true;try{return await navigation.openNode({...context,node,isCurrent:current,close});}finally{navigating=false;}},
    onEva:()=>{const active=model.activeEva(window.evaCrossViewRelations,activeFile);if(active)window.evaCrossViewRelations.openRelationEditor?.(active.nodeKey);else new Notice('EVA 尚未登记当前笔记，请先在来源插件核验。',4000);}});
  async function rebuild(force=false) {
    if(!current())return;if(building){pending=true;return;}
    if(force)session.invalidate('refresh');
    building=true;pending=false;
    const epoch=session.epoch;
    try {
      const queryConfig=config();
      const cached=!force&&session.find(activeFile.path,queryConfig);
      const valid=()=>current()&&epoch===session.epoch;
      if(cached){await ui.update({...cached.graph,groupByLevel:settings.groupByLevel},{valid,preview:!cached.fresh});if(cached.fresh)return;ui.status('正在核验已有图谱…');}
      const graph=await model.build({app,activeFile,session,settings,eva:window.evaCrossViewRelations,isCurrent:current});
      graph.groupByLevel=settings.groupByLevel;
      if(!current()||epoch!==session.epoch)return;
      const signature=JSON.stringify([graph.queryPath,graph.nodes,graph.edges,graph.collections,graph.complete,graph.evaState,graph.warnings]);
      session.put(activeFile.path,queryConfig,graph,signature,epoch);
      await ui.update(graph,{valid});
    }catch(error){if(current()){if(error.message==='reference-source-changed'){pending=true;ui.status('来源正在变化，稍后自动核验；当前图已保留。');}else ui.status('图谱查询未完成：'+error.message);}}
    finally{building=false;if(pending&&current()){clearTimeout(timer);timer=setTimeout(()=>rebuild(),400);}}
  }
  unsubscribe=session.subscribe(()=>{if(!current())return;clearTimeout(timer);ui.status('来源已更新，正在等待变更稳定…');timer=setTimeout(()=>rebuild(),400);});
  await rebuild(!!context.forceRefresh);
};
