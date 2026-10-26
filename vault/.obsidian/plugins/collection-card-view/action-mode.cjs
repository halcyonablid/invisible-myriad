const TYPE = 'collection-action-view';
const norm = x => String(x || '').trim().replace(/\s+/g,' ').toLocaleLowerCase();
const collator = new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base'});
// Next-action tags are stored by the next-action-workbench store (sourceTags); this view only edits and filters them.
const TAG_LIMIT = 12;
const tagLabel = x => String(x || '').replace(/\s+/g,' ').trim().replace(/^#+/,'').trim().slice(0,32).trim();
function tagCatalog(groups) {
  const tags=new Map();
  for(const g of groups)for(const r of g.rows)for(const t of r.tags||[]){const k=norm(t),c=tags.get(k)||{key:k,label:t,count:0,open:0};c.count++;if(!r.completed)c.open++;tags.set(k,c);}
  return [...tags.values()].sort((a,b)=>collator.compare(a.label,b.label));
}
// Empty: every tagged row. Single: first selected tag. Any: union. All: intersection.
function matchTags(row, keys, mode) {
  const own=new Set((row.tags||[]).map(norm));
  if(!keys.size)return own.size>0;
  return mode==='all'?[...keys].every(k=>own.has(k)):mode==='any'?[...keys].some(k=>own.has(k)):own.has([...keys][0]);
}
// Navigation and header counts show unfinished next actions only; completed ones are listed but not counted.
const openCount=rows=>rows.reduce((n,r)=>n+(r.completed?0:1),0);
const rowMatches=(r,query)=>norm(r.alias||r.title).includes(query)||(r.tags||[]).some(t=>norm(t).includes(query));
function boundTabs(target, bindings, data, keys, sourceNotePath) {
  if(!Array.isArray(keys)) throw new Error('上下文定义未就绪');
  const context=target.contextKey, descriptors=keys.filter(k=>(k.contextKeyId||k.id)===context?.contextKeyId);
  if(descriptors.length!==1||norm(descriptors[0].displayLabel)!==norm(context.displayLabel)) throw new Error('上下文定义已变化，请刷新');
  const tabs=new Set();
  for(const entry of Object.values(bindings.assignmentsByKeywordKey||{})) {
    if(!entry||typeof entry!=='object') throw new Error('Tab 绑定数据异常');
    const matching=keys.filter(k=>norm(k.displayLabel)===norm(entry.keyword)||!/^\d+[a-z0-9]*\s*[-－—–]/i.test(entry.keyword||'')&&norm(k.canonicalLabel)===norm(entry.keyword));
    if(!matching.some(k=>(k.contextKeyId||k.id)===context.contextKeyId))continue;
    if(matching.length!==1||entry.sourceNotePath&&entry.sourceNotePath!==sourceNotePath)throw new Error('主键绑定不唯一，请核对 Collection');
    if(!data.tabsById[entry.tabId])throw new Error('绑定的 Collection 标签不存在');
    tabs.add(entry.tabId);
  }
  return [...tabs];
}
function project(data, bindings, targets, metadata, keys, sourceNotePath) {
  const old=new Map(metadata.map(x=>[x.id,x]));
  return targets.map(t=>{
    const previous=old.get(t.membershipId),seen=new Set();let tabs=[],bindingError='';
    try{tabs=boundTabs(t,bindings,data,keys,sourceNotePath);}catch(e){bindingError=e.message;}
    const rows=[];
    for(const tabId of tabs) {
      const visit=id=>{if(seen.has(id)) return;seen.add(id);const item=data.itemsById[id];if(!item||item.tabId!==tabId) return;
        const matches=previous?.links.filter(l=>l.itemId===id)||[],meta=matches.length===1?matches[0]:null;
        rows.push({...item,alias:meta?.alias||'',tags:Array.isArray(meta?.tags)?meta.tags:[],completed:meta?.completed||false,hasOntology:meta?.hasOntology||false,identityConflict:matches.length>1});
        for(const child of data.childrenByParentByTab[`${tabId}::${id}`]||[]) visit(child);
      };
      for(const id of data.childrenByParentByTab[`${tabId}::__root__`]||[]) visit(id);
    }
    // Next actions are listed by display name (alias or title), not by insertion order (newest items are stored first).
    rows.sort((x,y)=>collator.compare(x.alias||x.title||'',y.alias||y.title||'')||String(x.id).localeCompare(String(y.id)));
    return {target:t,id:t.membershipId,name:t.actionName||t.label,domain:t.primaryRef?.domain||t.domain,tabs,rows,bindingError};
  }).sort((a,b)=>collator.compare(a.name,b.name)||a.id.localeCompare(b.id));
}
function install(plugin, obsidian, actionEntry) {
  const {ItemView,Modal,Notice}=obsidian;
  const actionButton=(parent,icon,label,callback,iconOnly=false)=>{
    const button=parent.createEl('button',{cls:iconOnly?'naw-icon-button':'naw-command-button',attr:{title:label,'aria-label':label}});
    obsidian.setIcon(button.createEl('span'),icon);
    if(!iconOnly)button.createEl('span',{text:label});
    button.onclick=async()=>{
      if(button.disabled)return;
      button.disabled=true;button.setAttribute('aria-busy','true');
      const feedback=parent.createEl('span',{cls:'naw-status',text:'正在处理…',attr:{role:'status','aria-live':'polite'}});
      try{
        await measure('click.feedback',()=>new Promise(resolve=>{
          const win=button.ownerDocument?.defaultView||window;
          const fallback=setTimeout(resolve,100);
          const done=()=>{clearTimeout(fallback);resolve();};
          if(typeof win.requestAnimationFrame==='function')win.requestAnimationFrame(()=>setTimeout(done,0));else setTimeout(done,0);
        }));
        await callback();
      }catch(e){new Notice(e.message||'操作失败，请重试');}
      finally{button.disabled=false;button.removeAttribute('aria-busy');feedback.remove();}
    };return button;
  };
  const metrics=[];let measuringUntil=0;
  const measure=async(phase,fn)=>{const start=performance.now();try{return await fn();}finally{if(Date.now()<measuringUntil){if(metrics.length>=200)metrics.shift();metrics.push({phase,durationMs:Math.round(performance.now()-start)});}}};
  plugin.globalApi.startActionViewMeasurement=()=>{metrics.length=0;measuringUntil=Date.now()+180000;service().startCollectionInteractionMeasurement?.();return {seconds:180};};
  plugin.globalApi.getActionViewMeasurement=()=>({build:'collection-clicks-20261012',active:Date.now()<measuringUntil,events:metrics.slice(),interactions:service().getCollectionInteractionMeasurement?.()});
  // Reload without changing the enabled-plugins setting; Obsidian re-reads main.js/styles.css from disk.
  const reloadWorkbench=async()=>{
    const plugins=plugin.app.plugins,id='next-action-workbench';
    if(!plugins?.enabledPlugins?.has(id))throw new Error('下一步行动台插件未启用');
    // Obsidian does not await the old instance's onunload, so only reload an idle instance after its write queue drains.
    const old=plugins.plugins?.[id];
    if(old?.createActionModals?.size||old?.pendingCreateDrafts?.size||old?.nameEditorRegistry?.activeByKey?.size||old?.nameEditorRegistry?.pendingFlushes?.size||old?.activeOntologyHandles?.size)
      throw new Error('下一步行动台仍有打开的编辑窗口或未保存内容，请先关闭/保存后再重载');
    await old?.mutationQueue?.catch?.(()=>{});
    await plugins.disablePlugin(id);
    // enablePlugin returns false on a failed load but may still leave a half-loaded instance behind.
    const loaded=await plugins.enablePlugin(id),fresh=plugins.plugins?.[id];
    if(loaded!==true||!fresh?.store||typeof fresh.editCollectionAction!=='function')throw new Error('下一步行动台重载失败，请重启 Obsidian');
  };
  const service=()=>{const p=plugin.app.plugins?.plugins?.['next-action-workbench'];if(typeof p?.getCollectionActionTargets!=='function') throw new Error('行动信息服务未就绪，请启用已更新的下一步行动台插件');return p;};
  const scope=path=>{const file=plugin.app.vault.getAbstractFileByPath(path);if(!file||file.path!==path||!file.extension) throw new Error('Collection 来源笔记不存在');return {path,dataPath:plugin.resolveDataPathForFile(file),keywordPath:plugin.resolveTabCapsuleKeywordsPathForFile(file)};};
  const read=async path=>{
    const s=scope(path),[raw,keys]=await Promise.all([plugin.app.vault.adapter.read(s.dataPath),plugin.app.vault.adapter.read(s.keywordPath)]);
    const data=JSON.parse(raw),bindings=JSON.parse(keys);
    if(data.schemaVersion!=='1.0'||!data.tabsById||!data.itemsById||!data.childrenByParentByTab||!bindings.assignmentsByKeywordKey) throw new Error('Collection 数据格式不支持，未写入');
    return {...s,data,bindings,raw,keys};
  };
  plugin.globalApi.getActionIdentity=async ({sourceNotePath,tabId,itemId,target})=>{
    const [{data,bindings},keys]=await Promise.all([read(sourceNotePath),plugin.getProjectOverviewApi()?.getContextCapsuleKeys()]);
    if(tabId&&!boundTabs(target,bindings,data,keys,sourceNotePath).includes(tabId))throw new Error('条目已不属于此主键，请刷新');
    if(tabId&&!data.tabsById[tabId]) throw new Error('目标标签已不存在');
    const item=itemId&&data.itemsById[itemId];
    if(itemId&&(!item||item.tabId!==tabId)) throw new Error('条目位置已变化，请刷新');
    return {tabTitle:data.tabsById[tabId]?.name||'',title:item?.title||''};
  };
  const destination=(view,group)=>({sourceNotePath:view.sourceNotePath,tabId:group.tabs[0],contextKeyId:group.target.contextKey.contextKeyId,
    primaryNodeKey:group.target.primaryRef.sourceKey,sourceScope:group.target.primaryRef.sourceScope,domain:group.domain,
    bindingRevision:require('node:crypto').createHash('sha256').update(view.snapshot.keys).digest('hex')});
  const create=async(view,request)=>{
    if(plugin.actionEntryClosed||view.closed)throw new Error('视图已关闭');
    view.committing=true;let result;
    try{result=await measure('create.commit',()=>actionEntry.create(plugin,request));}finally{view.committing=false;clearTimeout(view.timer);if(!result?.ok&&view.needsQualification)view.schedule();}
    if(!result.ok)throw new Error(result.reason||'保存结果待确认，请用同一请求重试');
    if(result.deleted)throw new Error('该请求曾保存的条目已删除，不会重复创建；请关闭后核对');
    // Persistence is complete. Display refresh failure must not turn it into a second submission.
    try{if(view.needsQualification){view.needsQualification=false;await view.refresh(true);}else await view.refreshContent();}catch(e){new Notice('待办已保存，列表刷新失败，请点击刷新');}
    return result;
  };
  class CreateModal extends Modal {
    constructor(view,group){super(plugin.app);this.view=view;this.group=group;this.requestId=require('node:crypto').randomUUID();}
    onOpen(){this.contentEl.createEl('h2',{text:'新增下一步待办'});const select=this.contentEl.createEl('select');
      for(const id of this.group.tabs)select.createEl('option',{value:id,text:this.view.snapshot.data.tabsById[id].name});
      const input=this.contentEl.createEl('textarea',{attr:{rows:'4',placeholder:'下一步要做什么？'}});input.style.width='100%';
      const status=this.contentEl.createDiv();const submit=this.contentEl.createEl('button',{text:'创建并留在行动台',cls:'mod-cta'});
      submit.onclick=async()=>{if(this.pending||!input.value.trim())return;this.pending=true;submit.disabled=true;input.disabled=true;select.disabled=true;status.textContent='正在保存…';
        this.request ||= {requestId:this.requestId,title:input.value.trim(),destination:destination(this.view,this.group)};
        try{await create(this.view,this.request);this.committed=true;this.pending=false;new Notice('待办已保存');this.close();}
        catch(e){status.textContent=e.message;submit.textContent='用同一请求重试';}
        finally{this.pending=false;submit.disabled=false;}};
      this.contentEl.createEl('p',{text:'点击创建才保存；取消会放弃本次输入。'});input.focus();
    }
    close(){if(this.pending){new Notice('正在保存，请等待结果');return;}super.close();}
  }
  class RenameTagModal extends Modal {
    constructor(view,label){super(plugin.app);this.view=view;this.label=label;this.owner=service();this.preview=this.owner.getActionTagRenamePreview?.(label);if(!this.preview)throw new Error('请先重载下一步行动台插件');}
    onOpen(){
      this.contentEl.createEl('h2',{text:'统一修改待办标签'});
      this.contentEl.createEl('p',{text:`将更新本库 ${this.preview.count} 条待办标签记录，包括已完成和当前未显示的条目。`});
      this.input=this.contentEl.createEl('input',{attr:{type:'text','aria-label':'标签新名称',maxlength:'32'}});this.input.value=this.label;
      this.status=this.contentEl.createEl('p',{attr:{role:'status'}});
      const save=this.contentEl.createEl('button',{text:'确认改名',cls:'mod-cta'}),cancel=this.contentEl.createEl('button',{text:'放弃修改'});
      cancel.onclick=()=>{if(!this.pending){this.discard=true;this.close();}};
      save.onclick=async()=>{if(this.pending)return;this.pending=true;save.disabled=true;this.input.disabled=true;this.status.textContent='正在统一更新…';
        try{if(service()!==this.owner)throw new Error('服务已重载，请重新打开改名窗口');const label=this.input.value;await this.owner.renameActionTag(this.preview,label);this.saved=true;
          this.view.tagSelection=this.view.tagSelection.map(t=>norm(t)===norm(this.label)?tagLabel(label):t);this.view.refreshMetadata();new Notice('标签及关联待办已更新');
        }catch(e){this.status.textContent=e.message;}finally{this.pending=false;save.disabled=false;this.input.disabled=false;if(this.saved)this.close();}
      };this.input.focus();this.input.select();
    }
    close(){if(this.pending){this.status.textContent='正在保存，请等待结果';return;}if(!this.saved&&!this.discard&&this.input&&this.input.value!==this.label){this.status.textContent='修改尚未保存，请确认改名或点击“放弃修改”。';return;}super.close();}
  }
  class TagModal extends Modal {
    constructor(view,group,row,catalog){super(plugin.app);this.view=view;this.group=group;this.row=row;this.catalog=catalog;this.tags=[...row.tags];this.tagSnapshot=service().getActionTagEditSnapshot?.();}
    onOpen(){
      this.modalEl.addClass('naw-keyword-modal-shell');
      const el=this.contentEl;el.addClass('next-action-workbench-view');el.addClass('naw-keyword-modal');
      const header=el.createDiv({cls:'naw-modal-header'});header.createEl('h2',{text:'下一步待办标签'});
      header.createDiv({cls:'naw-modal-subtitle',text:`待办：${this.row.alias||this.row.title}`});
      el.createDiv({cls:'naw-local-name-help',text:`一个待办可以有多个标签（最多 ${TAG_LIMIT} 个）。标签只用于行动台筛选，不会改写来源条目。`});
      const current=el.createDiv({cls:'naw-tag-editor-section'});current.createEl('span',{text:'当前标签'});this.currentEl=current.createDiv({cls:'naw-tag-editor-current'});
      const entry=el.createDiv({cls:'naw-keyword-entry'});
      const input=this.input=entry.createEl('input',{attr:{type:'text',placeholder:'输入标签后回车；可用逗号分隔多个','aria-label':'新标签'}});
      const add=entry.createEl('button',{text:'添加',attr:{type:'button'}});
      const suggestions=el.createDiv({cls:'naw-tag-editor-section'});suggestions.createEl('span',{text:'已有标签（点击添加）'});this.suggestEl=suggestions.createDiv({cls:'naw-tag-editor-suggestions'});
      this.status=el.createDiv({cls:'naw-local-name-status'});
      const actions=el.createDiv({cls:'naw-modal-actions'});
      const cancel=actions.createEl('button',{text:'取消',attr:{type:'button'}}),save=actions.createEl('button',{cls:'mod-cta',text:'保存',attr:{type:'button'}});
      const commit=()=>{for(const t of input.value.split(/[,，、;；\n]/))this.add(t);input.value='';this.renderChips();};
      add.onclick=commit;
      input.onkeydown=e=>{
        if(e.key==='Enter'&&!e.isComposing){e.preventDefault();if(input.value.trim())commit();else save.click();}
        else if(e.key==='Backspace'&&!input.value&&this.tags.length){this.tags.pop();this.renderChips();}
      };
      cancel.onclick=()=>{this.discard=true;this.close();};
      save.onclick=async()=>{
        if(this.pending)return;if(input.value.trim())commit();
        this.pending=true;for(const control of this.contentEl.querySelectorAll('button,input'))control.disabled=true;this.status.setText('正在保存…');
        try{await this.view.saveTags(this.group,this.row,this.tags,this.tagSnapshot);this.pending=false;this.saved=true;new Notice('标签已保存');this.close();}
        catch(e){this.status.setText(`保存失败：${e.message||e}`);if(e?.staleWorkbench)this.offerReload(save);}
        finally{this.pending=false;for(const control of this.contentEl.querySelectorAll('button,input'))control.disabled=false;}
      };
      this.renderChips();input.focus();
    }
    offerReload(save){
      if(this.reloadEl)return;
      this.reloadEl=this.status.parentElement.createDiv({cls:'naw-modal-actions'});
      const button=this.reloadEl.createEl('button',{cls:'mod-warning',text:'一键重载下一步行动台',attr:{type:'button'}});
      button.onclick=async()=>{
        if(this.pending)return;this.pending=true;button.disabled=true;save.disabled=true;this.status.setText('正在重载下一步行动台…');
        try{await reloadWorkbench();}
        catch(e){this.pending=false;button.disabled=false;save.disabled=false;this.status.setText(`重载失败：${e.message||e}`);return;}
        this.reloadEl.remove();this.reloadEl=null;this.pending=false;this.status.setText('已重载，正在重新保存…');
        await save.onclick();
      };
    }
    add(value){
      const t=tagLabel(value);if(!t||this.tags.some(x=>norm(x)===norm(t)))return;
      if(this.tags.length>=TAG_LIMIT){this.status.setText(`最多 ${TAG_LIMIT} 个标签`);return;}
      this.tags.push(t);
    }
    renderChips(){
      this.currentEl.empty();this.suggestEl.empty();
      if(!this.tags.length)this.currentEl.createEl('span',{cls:'naw-local-name-status',text:'暂无标签'});
      this.tags.forEach((t,i)=>{
        const chip=this.currentEl.createEl('button',{cls:'naw-tag-chip',attr:{type:'button',title:`移除标签“${t}”`,'aria-label':`移除标签 ${t}`}});
        chip.createEl('span',{text:`#${t}`});chip.createEl('span',{cls:'naw-tag-chip-remove',text:'×'});
        chip.onclick=()=>{this.tags.splice(i,1);this.renderChips();};
      });
      const own=new Set(this.tags.map(norm)),rest=this.catalog.filter(c=>!own.has(c.key));
      if(!rest.length)this.suggestEl.createEl('span',{cls:'naw-local-name-status',text:'没有其他已用标签'});
      for(const c of rest){const chip=this.suggestEl.createEl('button',{cls:'naw-tag-chip',text:`#${c.label}`,attr:{type:'button',title:`${c.count} 条待办使用`}});chip.onclick=()=>{this.add(c.label);this.renderChips();};}
    }
    close(){if(this.pending){new Notice('正在保存，请等待结果');return;}if(!this.saved&&!this.discard&&(this.input?.value.trim()||JSON.stringify(this.tags)!==JSON.stringify(this.row.tags))){this.status.setText('修改尚未保存，请保存或点击取消放弃。');return;}super.close();}
  }
  class ActionView extends ItemView {
    constructor(leaf){super(leaf);this.sourceNotePath='';this.domain='project';this.selected='all';this.query='';this.tagSelection=[];this.tagMode='single';this.tagGroup='all';this.generation=0;this.closed=false;}
    getViewType(){return TYPE;} getDisplayText(){return '下一步行动台';} getIcon(){return 'list-checks';}
    getState(){return {sourceNotePath:this.sourceNotePath,domain:this.domain,selected:this.selected,tagSelection:this.tagSelection,tagMode:this.tagMode,tagGroup:this.tagGroup};}
    async setState(s={}){this.sourceNotePath=s.sourceNotePath||plugin.getDefaultSourceNotePath();this.domain=s.domain||this.domain;this.selected=s.selected||this.selected;
      if(Array.isArray(s.tagSelection))this.tagSelection=s.tagSelection.filter(t=>typeof t==='string');this.tagMode=['any','all'].includes(s.tagMode)?s.tagMode:'single';if(this.tagMode==='single')this.tagSelection=this.tagSelection.slice(0,1);if(typeof s.tagGroup==='string')this.tagGroup=s.tagGroup;
      if(this.opened)await this.refresh();}
    async onOpen(){this.opened=true;this.closed=false;this.sourceNotePath ||= plugin.getDefaultSourceNotePath();
      this.contentEl.addClass('collection-action-mode');
      this.contentEl.addClass('next-action-workbench-view');
      this.registerDomEvent(window,'context-capsule-carrier:changed',e=>{if(!e.detail?.sourceNotePath||e.detail.sourceNotePath===this.sourceNotePath)this.schedule(true);});
      this.registerDomEvent(window,'collection-action-metadata:changed',e=>{const rename=e.detail?.tagRename;if(rename)this.tagSelection=this.tagSelection.map(t=>norm(t)===norm(rename.oldLabel)?rename.newLabel:t);if(!this.editPending)this.refreshMetadata();});
      this.registerDomEvent(window,'project-execution-overview:primary-key-lifecycle-changed',()=>this.schedule());
      if(typeof ResizeObserver==='function'){this.resizeObserver=new ResizeObserver(()=>this.syncLayout());this.resizeObserver.observe(this.contentEl);}
      await this.refresh();}
    schedule(contentOnly=false){this.needsQualification ||= !contentOnly;if(this.committing)return;clearTimeout(this.timer);this.timer=setTimeout(()=>{if(!this.closed){const full=this.needsQualification;this.needsQualification=false;(full?this.refresh(true):this.refreshContent()).catch(e=>new Notice(e.message));}},180);}
    async onClose(){this.closed=true;this.generation++;clearTimeout(this.timer);this.resizeObserver?.disconnect();}
    metadataSnapshot(){
      const metadata=[];let offset=0;do{const page=service().getCollectionActionMetadata({sourceNotePath:this.sourceNotePath,offset});metadata.push(...page.contexts);offset=page.nextOffset;}while(offset!==null);
      return metadata;
    }
    refreshMetadata(){if(this.closed||!this.targets)return;try{this.metadata=this.metadataSnapshot();for(const t of this.targets)t.actionName=service().getCollectionActionName(t.membershipId)||t.label;this.paint();}catch(e){new Notice(e.message);}}
    async refreshContent(){if(!this.targets)return this.refresh();const generation=++this.generation;
      const snapshot=await measure('collection.read',()=>read(this.sourceNotePath));
      if(this.closed||generation!==this.generation)return;this.snapshot=snapshot;this.metadata=this.metadataSnapshot();
      // Names use live qualified labels, never stale membership snapshots.
      for(const t of this.targets)t.actionName=service().getCollectionActionName(t.membershipId)||t.label;
      this.paint();
    }
    async refresh(fresh=false){const generation=++this.generation;try{
      const [snapshot,result,keys]=await Promise.all([measure('collection.read',()=>read(this.sourceNotePath)),measure('targets.read',()=>service().getCollectionActionTargets({fresh})),plugin.getProjectOverviewApi()?.getContextCapsuleKeys()]);
      if(this.closed||generation!==this.generation)return;this.snapshot=snapshot;this.targets=result.targets;this.domainStatus=result.byDomain;this.contextKeys=keys;this.metadata=this.metadataSnapshot();this.paint();
    }catch(e){if(generation===this.generation&&!this.closed){new Notice(e.message);if(!this.snapshot){this.contentEl.empty();this.contentEl.createEl('p',{text:e.message});const b=this.contentEl.createEl('button',{text:'重试'});b.onclick=()=>this.refresh();}}}}
    paint(){
      if(this.closed||!this.snapshot)return;
      if(this.searchComposing){this.pendingPaint=true;return;}
      const groups=project(this.snapshot.data,this.snapshot.bindings,this.targets,this.metadata,this.contextKeys,this.sourceNotePath);
      this.tagCatalog=tagCatalog(groups);
      const root=this.contentEl,active=root.ownerDocument?.activeElement;
      const searchFocused=active&&active===this.searchEl,selection=searchFocused?[active.selectionStart,active.selectionEnd]:null;
      const anchor=[...root.querySelectorAll('[data-action-row]')].find(el=>el.getBoundingClientRect().bottom>root.getBoundingClientRect().top);
      const anchorKey=anchor?.getAttribute('data-action-row'),anchorTop=anchor?.getBoundingClientRect().top;
      if(this.navEl?.isConnected)this.navScrollTop=this.navEl.scrollTop;
      root.empty();
      const shell=root.createDiv({cls:'naw-shell'}),toolbar=shell.createDiv({cls:'naw-toolbar'});this.toolbarEl=toolbar;
      const identity=toolbar.createDiv({cls:'naw-identity'});
      identity.createEl('h2',{text:'下一步行动台'});
      identity.createEl('span',{text:'Collection Card → 可执行结构'});
      const controls=toolbar.createDiv({cls:'naw-controls'});
      actionButton(controls,'refresh-cw','刷新',()=>this.refresh(true),true);
      const searchWrap=controls.createDiv({cls:'naw-search'});
      obsidian.setIcon(searchWrap.createEl('span'),'search');
      const search=searchWrap.createEl('input',{attr:{type:'search',placeholder:'搜索行动台名称、来源主键、下一步待办或标签','aria-label':'搜索行动台名称、来源主键、下一步待办或标签'}});
      this.searchEl=search;search.value=this.query;
      search.oninput=()=>{this.query=search.value;this.renderBody(groups);};
      search.oncompositionstart=()=>{this.searchComposing=true;};
      search.oncompositionend=()=>{this.searchComposing=false;this.query=search.value;if(this.pendingPaint){this.pendingPaint=false;this.paint();}};
      const tabs=shell.createDiv({cls:'naw-domain-tabs has-tag-tab',attr:{role:'tablist','aria-label':'主键类型与标签筛选'}});
      for(const domain of ['goal','project','tags']){
        const b=tabs.createEl('button',{cls:`naw-domain-tab${this.domain===domain?' is-active':''}`,attr:{role:'tab','aria-selected':String(this.domain===domain)}});
        b.createEl('span',{text:domain==='tags'?'标签筛选':`${domain==='goal'?'目标':'项目'}主键`});
        b.createEl('span',{cls:'naw-domain-tab-count',text:String(domain==='tags'?this.tagCatalog.length:groups.filter(g=>g.domain===domain).length)});
        b.onclick=()=>{this.domain=domain;this.selected='all';this.navScrollTop=0;if(this.navEl)this.navEl=null;this.paint();};
      }
      for(const domain of ['goal','project'])if(!this.domainStatus?.[domain]?.ok)shell.createDiv({cls:'naw-readonly-banner',text:`${domain==='goal'?'目标':'项目'}主键加载失败，请刷新重试（并非没有主键）。`});
      this.body=shell.createDiv({cls:'naw-content-layout'});this.renderBody(groups);this.syncLayout();
      if(anchorKey){const next=[...root.querySelectorAll('[data-action-row]')].find(el=>el.getAttribute('data-action-row')===anchorKey);if(next)root.scrollTop+=next.getBoundingClientRect().top-anchorTop;}
      if(searchFocused){search.focus({preventScroll:true});if(selection.every(x=>typeof x==='number'))search.setSelectionRange(...selection);}
    }
    syncLayout(){
      const root=this.contentEl;if(!root?.style?.setProperty||!this.toolbarEl)return;
      root.style.setProperty('--naw-toolbar-height',`${this.toolbarEl.offsetHeight||0}px`);
      root.style.setProperty('--naw-viewport-height',`${root.clientHeight||0}px`);
    }
    // After choosing a key, bring the top of the item list into view if it is above or below the visible area.
    revealWorkspace(){
      const root=this.contentEl,main=this.mainEl;if(!main?.getBoundingClientRect||!root?.getBoundingClientRect)return;
      const delta=main.getBoundingClientRect().top-root.getBoundingClientRect().top-(this.toolbarEl?.offsetHeight||0)-8;
      if(delta<0||main.getBoundingClientRect().top>root.getBoundingClientRect().bottom-80)root.scrollTop+=delta;
    }
    dockNavigation(nav,main){this.navEl=nav;this.mainEl=main;nav.scrollTop=this.navScrollTop||0;}
    renderBody(groups){
      if(this.navEl?.isConnected)this.navScrollTop=this.navEl.scrollTop;
      this.body.empty();
      if(this.domain==='tags')return this.renderTagBody(groups);
      const nav=this.body.createDiv({cls:'naw-primary-navigation'}),main=this.body.createDiv({cls:'naw-workspace'});
      const current=groups.filter(g=>g.domain===this.domain),heading=nav.createDiv({cls:'naw-navigation-heading'});
      heading.createEl('span',{cls:'naw-navigation-title',text:this.domain==='goal'?'目标清单':'项目清单'});
      heading.createEl('span',{cls:'naw-navigation-hint',text:'按行动台名称排列'});
      const capsules=nav.createDiv({cls:'naw-capsules'});
      const capsule=(id,label,rows)=>{
        const open=openCount(rows),b=capsules.createEl('button',{cls:`naw-capsule is-${this.domain}${this.selected===id?' is-active':''}`,attr:{'aria-pressed':String(this.selected===id),title:`${label}（${open} 未完成，共 ${rows.length} 条）`}});
        b.createEl('span',{cls:'naw-capsule-label',text:label});b.createEl('span',{cls:'naw-capsule-count',text:String(open)});
        b.onclick=()=>{this.selected=id;this.renderBody(groups);this.revealWorkspace();};
      };
      capsule('all','全部',current.flatMap(g=>g.rows));
      for(const g of current)capsule(g.id,g.name,g.rows);
      const query=norm(this.query);let visible=0;
      for(const g of current){
        if(this.selected!=='all'&&this.selected!==g.id)continue;
        const match=norm(g.name).includes(query)||norm(g.target.label).includes(query);
        const rows=g.rows.filter(r=>match||rowMatches(r,query));
        if(query&&!match&&!rows.length)continue;visible++;
        this.renderSection(main,g,rows);
      }
      if(!visible)main.createDiv({cls:'naw-empty',text:query?'没有匹配的主键或下一步待办。':this.domainStatus?.[this.domain]?.ok?'当前没有有效主键。':'主键暂不可用，请刷新重试。'});
      this.dockNavigation(nav,main);
    }
    renderTagBody(groups){
      const nav=this.body.createDiv({cls:'naw-primary-navigation'}),main=this.body.createDiv({cls:'naw-workspace'});
      const catalog=tagCatalog(groups);
      const keys=new Set(this.tagSelection.map(norm)),query=norm(this.query);
      let heading=nav.createDiv({cls:'naw-navigation-heading'});
      heading.createEl('span',{cls:'naw-navigation-title',text:'标签'});
      heading.createEl('span',{cls:'naw-navigation-hint',text:this.tagMode==='all'?'可多选，取交集':this.tagMode==='any'?'可多选，取并集':'单选'});
      const mode=nav.createDiv({cls:'naw-tag-mode',attr:{role:'group','aria-label':'多个标签的匹配方式'}});
      mode.style.cssText='grid-template-columns:repeat(3,minmax(0,1fr));width:100%;box-sizing:border-box';
      for(const [m,label] of [['single','单个标签'],['any','任一包含'],['all','全部包含']]){
        const b=mode.createEl('button',{cls:this.tagMode===m?'is-active':'',text:label,attr:{type:'button','aria-pressed':String(this.tagMode===m)}});
        b.style.cssText='min-width:0;padding:3px 4px;white-space:nowrap';
        b.onclick=()=>{this.tagMode=m;if(m==='single')this.tagSelection=this.tagSelection.slice(0,1);this.renderBody(groups);};
      }
      const tagCapsules=nav.createDiv({cls:'naw-capsules'});
      if(!catalog.length)tagCapsules.createDiv({cls:'naw-empty',text:'还没有标签。点待办右侧的标签按钮添加。'});
      for(const c of catalog){
        const tagRow=tagCapsules.createDiv();tagRow.style.cssText='display:flex;gap:4px;align-items:center;width:100%';const on=keys.has(c.key),b=tagRow.createEl('button',{cls:`naw-capsule is-tag${on?' is-active':''}`,attr:{'aria-pressed':String(on),title:`${c.label}（${c.open} 未完成，共 ${c.count} 条）`}});
        b.createEl('span',{cls:'naw-capsule-label',text:`#${c.label}`});b.createEl('span',{cls:'naw-capsule-count',text:String(c.open)});
        b.onclick=()=>{this.tagSelection=this.tagMode==='single'?[c.label]:(on?this.tagSelection.filter(t=>norm(t)!==c.key):[...this.tagSelection,c.label]);this.renderBody(groups);this.revealWorkspace();};
        b.style.flex='1';actionButton(tagRow,'pencil',`改名标签 ${c.label}`,()=>new RenameTagModal(this,c.label).open(),true);
      }
      const matched=groups.map(g=>{const match=!!query&&(norm(g.name).includes(query)||norm(g.target.label).includes(query));
        return {g,rows:g.rows.filter(r=>matchTags(r,keys,this.tagMode)&&(!query||match||rowMatches(r,query)))};}).filter(x=>x.rows.length);
      if(this.tagGroup!=='all'&&!matched.some(x=>x.g.id===this.tagGroup))this.tagGroup='all';
      heading=nav.createDiv({cls:'naw-navigation-heading'});
      heading.createEl('span',{cls:'naw-navigation-title',text:'所在主键'});
      heading.createEl('span',{cls:'naw-navigation-hint',text:'目标与项目'});
      const groupCapsules=nav.createDiv({cls:'naw-capsules'});
      const capsule=(id,label,rows,domain)=>{
        const open=openCount(rows),b=groupCapsules.createEl('button',{cls:`naw-capsule${domain?` is-${domain}`:''}${this.tagGroup===id?' is-active':''}`,attr:{'aria-pressed':String(this.tagGroup===id),title:`${label}（${open} 未完成，共 ${rows.length} 条）`}});
        b.createEl('span',{cls:'naw-capsule-label',text:label});b.createEl('span',{cls:'naw-capsule-count',text:String(open)});
        b.onclick=()=>{this.tagGroup=id;this.renderBody(groups);this.revealWorkspace();};
      };
      capsule('all','全部',matched.flatMap(x=>x.rows));
      for(const x of matched)capsule(x.g.id,`${x.g.domain==='goal'?'目标':'项目'} · ${x.g.name}`,x.rows,x.g.domain);
      const shown=matched.filter(x=>this.tagGroup==='all'||x.g.id===this.tagGroup);
      const summary=main.createDiv({cls:'naw-tag-filter-summary'});
      if(this.tagSelection.length){
        summary.createEl('span',{text:this.tagMode==='all'?'全部包含':this.tagMode==='single'?'单个标签':'任一包含'});
        const list=summary.createEl('span',{cls:'naw-tag-list'});
        for(const t of this.tagSelection){const chip=list.createEl('button',{cls:'naw-tag-chip is-active',attr:{type:'button',title:`取消标签“${t}”`}});chip.createEl('span',{text:`#${t}`});chip.createEl('span',{cls:'naw-tag-chip-remove',text:'×'});
          chip.onclick=()=>{this.tagSelection=this.tagSelection.filter(x=>norm(x)!==norm(t));this.renderBody(groups);};}
        const clear=summary.createEl('button',{cls:'naw-tag-chip',text:'清除',attr:{type:'button'}});clear.onclick=()=>{this.tagSelection=[];this.renderBody(groups);};
      }else summary.createEl('span',{text:'未选标签：显示所有带标签的待办'});
      summary.createEl('span',{cls:'naw-membership-count',text:`${openCount(shown.flatMap(x=>x.rows))} 未完成`});
      for(const x of shown)this.renderSection(main,x.g,x.rows);
      if(!shown.length)main.createDiv({cls:'naw-empty',text:!catalog.length?'还没有带标签的下一步待办。':query?'没有匹配搜索与标签的下一步待办。':'没有满足所选标签的下一步待办。'});
      this.dockNavigation(nav,main);
    }
    renderSection(main,g,rows){
      const section=main.createDiv({cls:`naw-membership is-${g.domain}`}),header=section.createDiv({cls:'naw-membership-header'});
      const title=header.createDiv({cls:'naw-membership-title'});
      title.createEl('span',{cls:`naw-domain-badge is-${g.domain}`,text:g.domain==='goal'?'目标':'项目'});
      title.createEl('h3',{text:g.name});
      if(g.name!==g.target.label)title.createEl('span',{cls:'naw-source-primary-label',text:`来源主键：${g.target.label}`});
      title.createEl('span',{cls:'naw-membership-count',text:`${openCount(g.rows)} 未完成`});
      const done=g.rows.filter(r=>r.completed).length;
      if(done)title.createEl('span',{cls:'naw-completion-summary',text:`${done} 已完成`});
      const buttons=header.createDiv({cls:'naw-membership-actions'});
      const add=actionButton(buttons,'plus','新增下一步待办',()=>new CreateModal(this,g).open());
      add.disabled=g.tabs.length!==1||!!g.bindingError;
      actionButton(buttons,'pencil','修改行动台名称',()=>this.edit(g,null,'name'));
      if(g.bindingError)section.createDiv({cls:'naw-empty',text:g.bindingError});
      else if(!g.tabs.length)section.createDiv({cls:'naw-empty',text:'尚未绑定 Collection Card 标签；主键仍显示在清单中。'});
      else if(g.tabs.length>1)section.createDiv({cls:'naw-empty',text:'此主键对应多个标签，已显示全部条目；新增前请在 Collection 明确唯一绑定。'});
      else if(!g.rows.length)section.createDiv({cls:'naw-empty',text:'当前主键暂无下一步待办。'});
      const pending=rows.filter(r=>!r.completed),completed=rows.filter(r=>r.completed);
      if(pending.length){const list=section.createDiv({cls:'naw-source-rows'});for(const row of pending)this.renderActionRow(list,g,row);}
      if(completed.length){
        const complete=section.createDiv({cls:'naw-completed-section'}),head=complete.createDiv({cls:'naw-completed-heading'});
        obsidian.setIcon(head.createEl('span',{cls:'naw-completed-heading-icon'}),'check-check');
        head.createEl('span',{text:'已完成'});head.createEl('span',{cls:'naw-membership-count',text:`${completed.length} 条`});
        const list=complete.createDiv({cls:'naw-source-rows'});for(const row of completed)this.renderActionRow(list,g,row);
      }
    }
    renderActionRow(parent,group,row){
      const box=parent.createDiv({cls:`naw-source-row${row.hasOntology?' has-ontology':''}${row.completed?' is-completed':''}${row.identityConflict?' is-malformed':''}`});
      box.setAttribute('data-action-row',JSON.stringify([group.id,row.tabId,row.id]));
      obsidian.setIcon(box.createDiv({cls:'naw-source-marker'}),row.completed?'check':row.hasOntology?'table-properties':'square-dashed');
      const copy=box.createDiv({cls:'naw-source-copy'});copy.createDiv({cls:'naw-source-title',text:row.alias||row.title});
      const meta=copy.createDiv({cls:'naw-source-meta'});
      if(row.alias)meta.createEl('span',{cls:'naw-source-original-label',text:`来源待办：${row.title}`});
      if(row.tags.length){const list=meta.createEl('span',{cls:'naw-tag-list'});
        for(const t of row.tags){const chip=list.createEl('button',{cls:'naw-tag-chip',text:`#${t}`,attr:{type:'button',title:`只看标签“${t}”`}});chip.onclick=()=>{this.domain='tags';this.tagSelection=[t];this.tagGroup='all';this.navScrollTop=0;this.navEl=null;this.paint();};}}
      meta.createEl('span',{cls:'naw-carrier-label',text:`胶囊：${this.snapshot.data.tabsById[row.tabId]?.name||group.target.label}`});
      if(row.identityConflict)meta.createEl('span',{cls:'naw-status is-malformed',text:'历史行动身份冲突，暂不可编辑'});
      else meta.createEl('span',{cls:'naw-status',text:'来自 Collection'});
      meta.createEl('span',{cls:`naw-ontology-state${row.hasOntology?' is-populated':''}`,text:row.hasOntology?'行动结构已有内容':'行动结构为空'});
      const actions=box.createDiv({cls:'naw-source-actions'});
      for(const [op,icon,label,iconOnly] of [['complete',row.completed?'rotate-ccw':'check',row.completed?'撤销完成':'完成',true],['alias','pencil','修改显示名',true],['tags','tag','编辑标签',true],['ontology','table-properties','打开行动结构',false]]){
        const b=actionButton(actions,icon,label,op==='tags'?()=>new TagModal(this,group,row,this.tagCatalog||[]).open():()=>this.edit(group,row,op),iconOnly);b.disabled=row.identityConflict;
      }
      actionButton(actions,'locate-fixed','返回来源',()=>measure('source.open',()=>this.domain==='tags'?this.locateAction(group,row):plugin.openItem(this.sourceNotePath,row.tabId,row.id)).catch(e=>new Notice(e.message)));
    }
    locateAction(group,row){
      this.domain=group.domain;this.selected=group.id;this.query='';this.searchComposing=false;this.navScrollTop=0;this.navEl=null;this.paint();
      const key=JSON.stringify([group.id,row.tabId,row.id]);
      const found=[...this.contentEl.querySelectorAll('[data-action-row]')].find(el=>el.getAttribute('data-action-row')===key);
      if(!found)throw new Error('该条目已变化，请刷新后重试');
      found.setAttribute('tabindex','-1');found.focus({preventScroll:true});found.scrollIntoView({block:'center',behavior:'auto'});
      found.style.outline='2px solid var(--interactive-accent)';
      found.onblur=()=>{found.style.outline='';};
    }
    async saveTags(group,row,tags,expectedTagSnapshot){
      if(this.editPending)throw new Error('上一项操作正在处理，请稍候');this.editPending=true;
      try{await measure('edit.total',()=>service().editCollectionAction({domain:group.domain,sourceLabel:group.target.label,itemTitle:row.title,sourceNotePath:this.sourceNotePath,tabId:row.tabId,itemId:row.id,contextId:group.id,tags,expectedTags:row.tags,expectedTagSnapshot},'tags'));}
      // A workbench loaded before the tag release rejects the operation; nothing was written.
      catch(e){if(e?.message==='未知行动操作')throw Object.assign(new Error('下一步行动台插件仍是旧版本，未保存。可点下方按钮一键重载后自动重新保存'),{staleWorkbench:true});throw e;}
      finally{this.editPending=false;this.refreshMetadata();}
    }
    async edit(group,row,operation){if(this.editPending){new Notice("上一项操作正在处理，请稍候");return;}this.editPending=true;try{await measure("edit.total",()=>service().editCollectionAction({domain:group.domain,sourceLabel:group.target.label,itemTitle:row?.title,sourceNotePath:this.sourceNotePath,tabId:row?.tabId||group.tabs[0],itemId:row?.id,contextId:group.id,completed:!row?.completed},operation));}catch(e){new Notice(e.message);}finally{this.editPending=false;this.refreshMetadata();}}
  }
  plugin.registerView(TYPE,leaf=>new ActionView(leaf));
  plugin.globalApi.openActionView=async path=>{const sourceNotePath=path||plugin.getDefaultSourceNotePath();let leaf=plugin.app.workspace.getLeavesOfType(TYPE).find(l=>l.view.sourceNotePath===sourceNotePath);if(!leaf){leaf=plugin.app.workspace.getLeaf('tab');await leaf.setViewState({type:TYPE,state:{sourceNotePath},active:true});}await plugin.app.workspace.revealLeaf(leaf);};
  plugin.addCommand({id:'open-collection-action-view',name:'打开下一步行动台（Collection）',callback:()=>plugin.globalApi.openActionView()});
  plugin.register(()=>plugin.app.workspace.getLeavesOfType(TYPE).forEach(l=>l.detach()));
}
module.exports={install,project,boundTabs,tagCatalog,matchTags,TYPE};
