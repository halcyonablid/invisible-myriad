'use strict';
function inMain(workspace,group) {
  let p=group;while(p){if(p===workspace.rootSplit)return true;const parent=p.parent;if(!parent?.children?.includes(p))return false;p=parent;}return false;
}
async function openNode({app,originLeaf,originGroup,node,isCurrent,close,Notice,window,obsidian}) {
  if(!isCurrent())return false;
  try {
    if(node.nodeKey) {
      let result=false;
      for(const peo of [app.plugins?.plugins?.['project-execution-overview'],window.__projectExecutionOverviewPluginApi]){
        if(!isCurrent())return false;
        if(!result && !String(node.nodeKey).startsWith('jump:v1:eva-note|') && peo?.revealItemNode)result=await peo.revealItemNode(node.nodeKey,{groupingMode:'workspace',source:'reference-graph-widget'});
      }
      if(!result && window.evaCrossViewRelations?.openNode)result=await window.evaCrossViewRelations.openNode(node.nodeKey);
      if(result!==false && result!=null && isCurrent()){close();return true;}
      throw Error('来源插件未确认跳转成功');
    }
    const file=app.vault.getAbstractFileByPath(node.filePath);
    if(!file?.stat||! /\.(md|excalidraw)$/i.test(file.path))throw Error('笔记不存在或已移动；请刷新图谱');
    const ws=app.workspace;
    let group=originGroup||originLeaf?.parent;
    if(!inMain(ws,group))group=ws.activeLeaf?.parent;
    if(!inMain(ws,group)) {
      const find=p=>{if(!p?.children)return null;if(p.children.some(c=>typeof c.openFile==='function'))return p;for(const c of p.children){const found=find(c);if(found)return found;}return null;};
      group=find(ws.rootSplit);
    }
    if(!inMain(ws,group)||!Array.isArray(group.children))throw Error('原编辑标签组已关闭，请在主编辑区重新打开图谱');
    let leaf=group.children.at(-1);
    if(leaf?.view?.file?.path!==file.path) {
      if(typeof ws.createLeafInParent!=='function')throw Error('当前 Obsidian 不支持安全的最右标签跳转');
      leaf=ws.createLeafInParent(group,group.children.length);
    }
    if(!isCurrent())return false;
    const state={active:true};
    if(Number.isInteger(node.line)&&node.line>0)state.eState={line:node.line-1};
    if(node.anchor && typeof obsidian?.resolveSubpath==='function'){
      const match=obsidian.resolveSubpath(app.metadataCache.getFileCache(file),node.anchor);
      if(match?.start)state.eState={line:match.start.line};
    }
    // Obsidian openFile accepts eState; preserve heading/block location without openLinkText creating a file.
    if(node.anchor && !state.eState)state.eState={subpath:node.anchor};
    await leaf.openFile(file,state);
    if(!isCurrent())return false;
    if(leaf.view?.file?.path!==file.path)throw Error('打开结果尚未确认，图谱已保留');
    ws.setActiveLeaf?.(leaf,{focus:true});close();return true;
  }catch(error){if(isCurrent())new Notice(error.message||String(error),5000);return false;}
}
module.exports={openNode,inMain};
