'use strict';
const {createDrafts}=require('./drafts.cjs');
const NAMES={'context-key-manager':'管理中心','project-execution-overview':'项目执行总览','mandala-time-blocks':'九宫格','workspace-mount':'Workspace','gtd-task-manager':'GTD','collection-card-view':'Collection'};
function element(parent,tag,text,cls){const e=parent.ownerDocument.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent.append(e);return e;}
function exactContext(state,row){
 if(!row)return null;const owners={project:'workspace-mount',goal:'mandala-time-blocks'};if(!owners[row.domain])throw Error('subject-invalid');
 const matches=state.contexts.filter(c=>c.subjects.some(s=>s.domain===row.domain&&s.ownerId===owners[row.domain]&&s.sourceScope===row.ownerSourceScope&&s.primaryNodeKey===row.nodeKey));
 if(matches.length>1)throw Error('subject-ambiguous');return matches[0]||null;
}
function message(error){const code=String(error?.message||error);{const b={'binding-upgrade-required':'绑定管理需要先升级存储（名称与同步 / 存储维护）。','binding-store-unavailable':'中心存储暂不可用，请先在存储维护中核验。','repeat-binding-not-supported':'该对象已完成过一次替换；再次替换尚未支持。','binding-preview-stale':'预览后数据已变化，请重新预览。','binding-preview-expired':'预览已过期，请重新预览。','binding-operation-timeout-refresh-before-retry':'绑定操作超时：后台仍会按原锁收束，请稍后刷新状态再重试，不要重复点击。','binding-service-busy-or-closed':'另一个绑定操作正在进行，或窗口已关闭，请稍后刷新。','binding-writer-unavailable':'Collection 绑定写入服务未就绪，请确认 Collection 插件已加载。','binding-pending':'存在未完成的绑定同步，请先继续或取消。','binding-no-pending':'没有待继续的绑定同步，请刷新状态。','binding-cannot-cancel-written':'绑定已开始写入，不能取消；请点“核验并继续绑定”。','binding-context-not-ready':'该对象当前不能管理绑定：需由中心维护名称，且没有未完成的名称同步。','binding-format-upgrade-required':'绑定管理需先在“名称与同步 / 存储维护”总入口迁移绑定格式（1 → 2）。','binding-format-upgrade-already-done':'绑定格式已是 2，无需迁移。','binding-format-upgrade-not-ready':'有未完成的同步，暂不能迁移绑定格式；请先完成或取消。','binding-before-carrier-missing':'当前绑定的 Tab 不存在（多为外部编辑或同步造成）；请从 Collection 备份或同步历史恢复该 Tab 后再操作。','binding-target-creation-pending':'目标 Tab 属于尚未完成的新建项目，不能作为绑定目标；请先完成或处理该创建。','binding-add-already-bound':'该对象已有 Collection 绑定，请使用“替换”或“解除”。','binding-not-bound':'该对象没有 Collection 绑定，请使用“新增绑定”。','add-label-mapped':'该来源已有同名主键映射，不能新增；请先核对 Collection 中的同名映射。','add-existing-binding':'该对象在其他来源已有 Collection 绑定；多来源暂不支持。','consumer-claim-unbound-same-name':'默认来源中已有同名主键映射，但它不属于本对象，已停止；请先在对应插件中核对该同名映射。','consumer-default-source-missing':'无法确定默认来源（来源笔记未设置或不存在），已停止；请先在对应插件中设置默认来源。','consumer-default-source-ambiguous':'默认来源无法唯一确定（同名笔记不止一个，或已移入回收站），已停止；请先核对来源笔记。','binding-released-capacity':'已解除绑定的记录已达上限，本次替换或解除未执行、未写入任何数据；请联系维护。','anchor-receipt-mismatch':'当前绑定的回执与中心记录不一致，已停止；请勿手改 Collection 关键词文件，并在存储维护中核验。','predecessor-unanchored':'Tab 上有中心无法证明的绑定回执，已停止；请勿手改 Collection 关键词文件。','binding-anchor-mismatch':'中心记录的当前绑定与计划不一致，请刷新后重试。','binding-default-scope-required':'Collection 默认来源未就绪，请确认 Collection 已打开默认来源。','binding-operation-unknown':'未知的绑定操作。','consumer-carrier-deleted':'主键绑定的 Tab 或载体已不存在（多为外部编辑或同步造成）；请从备份或同步历史恢复该 Tab 后再操作。','participant-binding-pending':'存在未完成的绑定同步：所有对象的保存与改名暂停，请先到该对象的“名称与同步”中继续或取消。','binding-writer-changed':'Collection 插件已重载或替换，绑定操作未执行；请刷新后重试。','binding-host-changed':'主键管理中心已重载或关闭，绑定操作未执行；请重新打开后重试。','new-mapping-or-receipt':'目标 Tab 已有其他主键映射或回执，不能绑定；请选择其他 Tab 或刷新。','binding-session-changed':'中心存储或来源笔记在操作期间发生变化，绑定操作未执行；请刷新后重新预览。','binding-source-changed':'来源笔记已移动或改变，绑定操作未执行；请刷新后重新预览。','binding-operation-expired':'绑定操作已中断（超时、关闭或被新操作取代）；请刷新查看状态，如有未完成的同步请继续或取消。','unsupported-binding-format':'中心存储的绑定数据格式比本插件更新，请把主键管理中心和参与插件更新到匹配的版本；不要恢复备份或手动修改存储。'};const key=code.split(':')[0];if(b[key])return b[key];if(/^binding-(factory-changed|format-unsupported|participant-old|module-old|module-path|owner-app):/.test(code))return '参与插件已重载、版本不匹配或不可用，绑定操作未执行；请确认各插件为同一版本并刷新后重试。';}if(code==='upgrade-state-unknown')return '升级结果未能确认，请打开“存储维护”核验；不会自动重试。';if(/^upgrade-/.test(code)||code==='binding-upgrade-disabled')return ({'upgrade-unconfigured':'尚未初始化中心存储，不需要升级。','upgrade-storage-missing':'中心存储缺失，请先在存储维护中核对。','upgrade-store-needs-maintenance':'中心存储需要维护，请先完成存储维护再预览升级。','upgrade-needs-center-naming':'请先启用中心命名，再考虑升级存储。','upgrade-already-done':'存储已经升级。','upgrade-unsupported-version':'存储版本未知，不能升级。','upgrade-naming-pending':'还有未完成的名称同步，请先完成后再升级。','upgrade-recovery-capacity':'恢复备份已达 4 份，请先归档旧备份。','upgrade-stale-lock-files':'存储目录中有遗留的锁文件，请先在存储维护中处理。','upgrade-preview-required':'请重新预览后再确认。','upgrade-preview-expired':'预览已过期，请重新预览。','upgrade-preview-other-window':'该预览来自其他窗口，请在本窗口重新预览。','upgrade-base-changed':'预览后存储已变化，请重新预览。','binding-upgrade-host-closed':'管理中心已关闭或重载，请重新打开后预览。','binding-upgrade-disabled':'存储升级入口尚未启用。'})[code]||'升级未执行，请查看详情后重新预览。';if(/^owner-(?:evidence-timeout|read-pending):/.test(code)){const owner=NAMES[code.split(':')[1]]||'相关插件';return owner+'的核验尚未返回，本次未开始保存。可以关闭窗口；若重试仍未返回，请重载相关插件后再预览。';}if(/preview-|store-changed|service-stale|service-invalidated/.test(code))return '来源或预览已经变化，请重新预览。';if(/writer-fence/.test(code))return '相关插件尚未就绪，请查看下方插件状态，再刷新重试。';if(/recovery|presence|storage-missing/.test(code))return '中心存储需要核验，请打开“存储维护”。原有输入已保留。';if(/legacy-writers/.test(code))return '存在尚未完成的旧同步任务，请先在原管理入口处理。';if(/source-not-current|source-mismatch/.test(code))return '当前来源与已登记来源不一致，请恢复原来源后重试。';if(/multiple-bindings|ambiguous|unregistered/.test(code))return '绑定范围需要人工核对，当前无法接管；后续在绑定管理中处理。';if(/rename-label-invalid/.test(code))return '新名称需要与当前名称不同，并保留原编号。请修改后再预览。';return '操作未完成，输入已保留。请查看详情后重试。';}
function createNamingUI({Modal,Notice},plugin,{service,naming,registration,legacy,isLive,participantStatus,storage,binding=null,bindingCompatibility=null,bindingUpgrade=null,bindingFormatUpgrade=null}){
 const opened=new Set();
 class NamingModal extends Modal{
  constructor(row){super(plugin.app);this.row=row;this.alive=true;this.serial=0;this.session=globalThis.crypto.randomUUID();opened.add(this);}
  onOpen(){this.modalEl.classList.add('ckm-modal-shell');this.contentEl.classList.add('ckm-console');this.render();}
  button(parent,text,fn,primary=false){const b=element(parent,'button',text,primary?'mod-cta':'');b.type='button';b.onclick=()=>this.run(fn);return b;}
  async run(fn){if(this.busy||!this.alive||!isLive())return;this.busy=true;const serial=++this.serial;this.freeze(true);this.status.textContent='正在核验，请稍候…';try{await fn(()=>this.alive&&isLive()&&serial===this.serial);}
   catch(e){if(this.alive){this.status.textContent=message(e);this.status.dataset.tone='warning';this.detailsError.textContent=String(e.message||e);this.preview=null;this.previewEl?.replaceChildren();this.showOldJobs(e);}}
   finally{this.busy=false;if(this.alive)this.freeze(false);}}
  showOldJobs(error){
   this.jobsEl?.remove();if(!Array.isArray(error.pendingJobs)||!error.pendingJobs.length)return;
   const box=this.jobsEl=element(this.contentEl,'section',undefined,'ckm-callout');element(box,'h3','原入口还有未完成的同步');
   for(const job of error.pendingJobs){element(box,'p',String(job.source)+' · '+String(job.status));element(box,'code',String(job.id));}
   element(box,'p','先到原入口核对这次任务；这里不会自动重试、删除或接管旧任务。');
   if(error.pendingJobs.some(j=>j.source==='context-key-renames.json'))this.button(box,'打开 PEO 改名同步进度',()=>{const p=plugin.app.plugins?.plugins?.['project-execution-overview'];if(typeof p?.openContextRenameRecovery!=='function')throw Error('legacy-entry-unavailable');p.openContextRenameRecovery();});
   if(error.sourceScope)this.button(box,'打开已登记来源',async()=>{const f=plugin.app.vault.getAbstractFileByPath(error.sourceScope);if(!f||f.extension!=='md')throw Error('source-unavailable');await plugin.app.workspace.getLeaf(false).openFile(f);});
  }
  freeze(value){for(const e of this.contentEl.querySelectorAll('button,input,select'))e.disabled=value;this.contentEl.setAttribute('aria-busy',String(value));}
  persist(){if(!this.input)return true;if(!this.drafts){if(this.input.value===this.baseLabel)return true;this.status.textContent='草稿不可用，请保留窗口并复制名称。';return false;}try{if(this.input.value!==this.baseLabel)this.drafts.save(this.input.value,this.baseLabel,this.baseRevision);else if(this.inputModified)this.drafts.remove();this.draftError=false;return true;}catch(e){this.draftError=true;if(this.status)this.status.textContent='草稿未能保存，请保留此窗口并复制名称；可重试保存草稿。';return false;}}
  close(){if(this.busy){if(this.status)this.status.textContent='正在核验或保存，请等待本次操作结束。';return;}if(!this.persist())return;super.close();}
  onClose(){this.persist();this.alive=false;this.serial++;opened.delete(this);if(this.upgradeId){bindingUpgrade?.revoke?.(this.upgradeId);bindingFormatUpgrade?.revoke?.(this.upgradeId);}for(const t of this.bindingTokens||[])binding?.revoke?.(t);}
  forceClose(){if(this.upgradeId){bindingUpgrade?.revoke?.(this.upgradeId);bindingFormatUpgrade?.revoke?.(this.upgradeId);}for(const t of this.bindingTokens||[])binding?.revoke?.(t);if(!this.persist())new Notice('主键名称草稿保存失败；宿主正在卸载，未能保证恢复。');this.alive=false;this.serial++;opened.delete(this);super.close();}
  setError(e){this.status.textContent=message(e);this.detailsError.textContent=String(e.message||e);if(/presence/.test(this.detailsError.textContent))element(this.contentEl,'p','请先退出 Obsidian，保留并备份 identity-v3 目录及旁边的 identity-v3-presence.json，再核对同一存储标识的有效备份。不要删除标记或重新初始化。','ckm-callout');}
  render(){
   this.contentEl.replaceChildren();const root=this.contentEl,head=element(root,'div',undefined,'ckm-modal-heading');element(head,'div','名称与同步','ckm-eyebrow');element(head,'h2',this.row?.label||'主键名称管理');
   this.status=element(root,'div','', 'ckm-feedback');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');
   const diagnostic=element(root,'details',undefined,'ckm-technical');element(diagnostic,'summary','操作详情');this.detailsError=element(diagnostic,'code','');
   const foot=element(root,'div',undefined,'ckm-modal-footer');this.button(foot,'存储维护',()=>{legacy.open();});this.button(foot,'刷新状态',()=>{if(this.persist()){this.input=null;this.render();}});const closeButton=element(foot,'button','关闭');closeButton.type='button';closeButton.onclick=()=>this.close();
   // Footer is appended after body sections at the end of this synchronous render.
   let status;try{status=service.store.status();}catch(e){this.setError(e);this.renderParticipants(root);root.append(foot);return;}
   if(status.status!=='ready'){this.status.textContent=status.status==='unconfigured'?'尚未初始化身份存储。请先在存储维护中预览并确认初始化。':'中心存储暂不可用。请在存储维护中核验，随后回到这里刷新。';this.detailsError.textContent=status.status;this.renderParticipants(root);root.append(foot);return;}
   const state=status.frame.state;
   if(state.binding?.pending)element(root,'div','存在未完成的绑定同步：在继续或取消之前，所有对象的保存与改名都会暂停。','ckm-callout');
   let context;try{context=exactContext(state,this.row);}catch(e){this.setError(e);root.append(foot);return;}
   if(!this.row){
    element(root,'p','已登记对象的名称与跨插件同步在这里管理。停止／恢复追踪请使用列表中的“管理追踪”。','ckm-note');
    if(status.frame.version===3){element(root,'div','启用中心命名后，旧版中心插件将无法读取新存储。请先完成身份登记，并保留已验证备份。','ckm-callout');this.button(root,'预览启用中心命名',async alive=>{const p=await naming.previewUpgrade();if(!alive())return;this.showPreview(root,'启用中心命名','只升级身份存储，不自动接管任何项目或目标。',()=>naming.confirmUpgrade(p.token));},true);}
    if(status.frame.version===6)element(root,'p',binding?(status.frame.state.binding?.format===2?'存储已升级，绑定管理已安装（Collection 单来源：替换、新增、解除）。':'存储已升级，绑定管理已安装；绑定格式仍为 1，需先迁移到格式 2 才能管理绑定。'):'存储已升级，绑定管理尚未安装。','ckm-note');
    if(bindingFormatUpgrade?.enabled&&status.frame.version===6&&status.frame.state.binding?.format===1){element(root,'div','迁移绑定格式（1 → 2）后，旧版插件读取时会拒绝新格式而暂停相关保存；所有库与设备上的插件须已全部更新。回退只适用于迁移后尚无任何中心写入的情况，否则只能向前修复。请先备份 identity-v3 目录及 identity-v3-presence.json。','ckm-callout');this.button(root,'预览迁移绑定格式（启用替换／新增／解除）',async alive=>{const id=this.upgradeId||(this.upgradeId=globalThis.crypto?.randomUUID?.()||(Date.now().toString(36)+Math.random().toString(36).slice(2)));const p=await bindingFormatUpgrade.preview(id);if(!alive())return;this.showPreview(root,'迁移绑定格式','命名空间 '+p.namespace+'，修订 '+p.revision+'；保留已有 '+p.results+' 条绑定结果和 '+p.anchors+' 条当前绑定证据。只改中心存储中的绑定格式，不改任何名称、绑定或插件数据；确认后只能在中心尚无任何写入时恢复备份，否则只能向前修复。',()=>bindingFormatUpgrade.confirm(p.token,id));},true);}
    if(bindingUpgrade?.enabled&&status.frame.version===4){element(root,'div','升级存储后，旧版主键管理中心读取时会报 unsupported-frame-version 而无法使用，参与插件的保存保护也随之失效；其他设备或同步副本上的旧版中心同样受影响。回退只适用于升级后尚无任何中心写入的情况，否则只能向前修复。请先备份 identity-v3 目录及 identity-v3-presence.json。','ckm-callout');this.button(root,'预览升级存储（启用绑定管理）',async alive=>{const id=this.upgradeId||(this.upgradeId=globalThis.crypto?.randomUUID?.()||(Date.now().toString(36)+Math.random().toString(36).slice(2)));const p=await bindingUpgrade.preview(id);if(!alive())return;this.showPreview(root,'升级存储','命名空间 '+p.namespace+'，修订 '+p.revision+'，已登记 '+p.contexts+' 个对象（其中中心维护 '+p.centerManaged+' 个）。只升级中心身份存储格式，不改任何名称、绑定或插件数据；确认后不可回退。',()=>bindingUpgrade.confirm(p.token,id));},true);}
    if(bindingCompatibility){this.button(root,'检查绑定管理兼容性',async alive=>{const result=await bindingCompatibility();if(!alive())return;this.status.textContent=result.mode==='compatible'?(binding?(status.frame.version===6?'参与插件兼容核验通过；绑定管理可用（Collection 单来源：替换、新增、解除）。':'参与插件兼容核验通过；需先升级存储才能使用绑定管理。'):'参与插件兼容核验通过；绑定管理尚未启用。'):(binding?'绑定管理已安装，但参与插件不兼容，暂不可用；原名称管理仍可继续。':'绑定管理暂不可用，原名称管理仍可继续。');this.detailsError.textContent=result.reason||'';});}
    const list=element(root,'div',undefined,'ckm-registry-list');for(const c of state.contexts){const row=element(list,'div',undefined,'ckm-registry-row');element(row,'strong',c.canonicalLabel);element(row,'span',c.naming?.pending?'同步待完成':c.naming?.authority==='center'?'中心管理':'原入口管理','ckm-badge');const s=c.subjects[0];this.button(row,'打开',()=>open({domain:s.domain,ownerSourceScope:s.sourceScope,nodeKey:s.primaryNodeKey,label:c.canonicalLabel}));}
    if(!state.contexts.length)element(list,'p','尚未登记项目或目标。请从主键列表选择对象登记身份。','ckm-empty');
   }else if(!context){
    this.status.textContent=status.frame.version===3?'这个对象尚未登记稳定身份。请先核对来源和载体。':'这个对象尚未登记稳定身份。请预览来源和载体，登记后再单独确认是否由中心管理名称。';
    if(status.frame.version===3)this.button(root,'核对并登记身份',()=>legacy.open(this.row),true);
    else if(registration)this.button(root,'预览身份登记',async alive=>{
      const p=await registration.preview(this.row);if(!alive())return;
      if(p.kind==='existing'){this.render();this.status.textContent='该来源身份已经登记，请查看当前名称与状态。';return;}
      this.showPreview(root,'登记这个对象的稳定身份','只登记身份和以下既有载体，不创建业务内容、不自动接管名称。',()=>registration.confirm(p.token));
      for(const subject of p.payload.subjects)element(this.previewEl,'p','对象来源：'+subject.sourceScope);
      for(const binding of p.payload.bindings)element(this.previewEl,'p',(NAMES[binding.ownerId]||binding.ownerId)+' · '+binding.sourceScope+' · '+binding.carrierId);
    },true);
   }else{
    const n=context.naming,domain=context.subjects[0].domain;const strip=element(root,'div',undefined,'ckm-state-strip');element(strip,'span',domain==='goal'?'九宫格目标':'项目','ckm-badge');element(strip,'span',n?.pending?'名称已保存 · 同步待完成':n?.authority==='center'?'由管理中心维护名称':'由原入口维护名称','ckm-badge');
    const source=element(root,'details',undefined,'ckm-sources');element(source,'summary',`来源与载体 · ${context.bindings.length} 个`);for(const s of context.subjects)element(source,'p',s.sourceScope);for(const b of context.bindings)element(source,'p',`${NAMES[b.ownerId]||b.ownerId} · ${b.sourceScope} · ${b.carrierId}`);element(source,'code',context.contextId);if(context.bindings.some(b=>b.ownerId==='gtd-task-manager'))element(root,'p','GTD 标签标题和 Tab 标题由 GTD 自身维护；这里同步的是主键关键词映射。显示标题不同不代表主键同步失败。','ckm-note');if(domain==='goal')element(root,'p','此目标按已登记的九宫格来源核验。切换来源后请重新打开并预览；原来源不匹配时不能接管或继续同步。','ckm-note');
    if(status.frame.version===3){element(root,'p','身份已登记。请先从“名称与同步”总入口预览启用中心命名，再接管这个对象。','ckm-note');}
    else if(n?.authority==='legacy'){
     element(root,'p','接管前会重新核对当前名称、来源、绑定和所有参与插件。追踪状态与历史内容继续保留。','ckm-note');this.button(root,'预览接管名称',async alive=>{const p=await naming.previewClaim(context.contextId);if(!alive())return;this.showPreview(root,'接管这个主键名称',context.canonicalLabel,()=>naming.confirmClaim(p.token));},true);
    }else if(n?.pending){this.renderPending(root,context);}
    else if(binding&&state.binding?.pending){this.renderBinding(root,context,state.binding.pending);}
    else{this.renderEditor(root,context,status);if(binding)this.renderBindingScope(root,context,status,domain);}
   }
   this.renderParticipants(root);root.append(foot);
  }
  showPreview(parent,title,description,confirm){this.previewEl?.remove();const box=this.previewEl=element(parent,'section',undefined,'ckm-preview');element(box,'h3',title);element(box,'p',description);this.status.textContent='请核对范围，确认后才会保存。';this.button(box,'确认',async alive=>{await confirm();if(!alive())return;this.preview=null;service.invalidate();this.render();this.status.textContent='已保存，请查看当前状态。';},true);}
  bindingReset(){if(this.composing)throw Error('composition-in-progress');if(!this.persist())throw Error('draft-save-required');this.preview=null;this.previewEl?.remove();this.previewEl=null;naming.invalidate?.();binding.invalidate();}
  bindingRefresh(){const text=this.input?.value;if(!this.persist())throw Error('draft-save-required');this.input=null;service.invalidate();this.render();if(text!==undefined&&this.input){this.input.value=text;this.persist();}}
  renderBindingScope(root,c,status,domain){
   if(status.frame.version!==6){element(root,'p','绑定管理需先在“名称与同步 / 存储维护”总入口升级存储。','ckm-note');return;}
   if(status.frame.state.binding?.format!==2){element(root,'p','绑定管理需先在“名称与同步 / 存储维护”总入口迁移绑定格式（1 → 2）。','ckm-note');return;}
   if(domain!=='project'){element(root,'p','目标的绑定管理尚未支持。','ckm-note');return;}
   if(c.naming?.authority!=='center'){element(root,'p','请先由管理中心接管名称，再管理绑定。','ckm-note');return;}
   if(c.bindings.filter(b=>b.ownerId==='collection-card-view').length>1){element(root,'p','该对象有多个 Collection 来源，多来源绑定暂不支持。','ckm-note');return;}
   this.renderBinding(root,c,null,status);
  }
  renderBinding(root,c,pending,status){
   const box=element(root,'section',undefined,'ckm-sources');element(box,'h3','Collection 载体绑定');
   const label=p=>p.operation==='add'?'新增 '+p.carriers[0].name:p.operation==='remove'?'解除 '+p.carriers[0].name:p.carriers[0].name+' → '+p.carriers[1].name;
   if(pending){
    if(pending.contextId!==c.contextId){element(box,'p','另一个对象的绑定同步待完成，请先返回该对象处理。');return;}
    element(box,'p',label(pending),'ckm-name-change');
    this.button(box,'核验并继续绑定',async alive=>{this.bindingReset();await binding.resume(c.contextId,alive);if(!alive())return;this.bindingRefresh();this.status.textContent='绑定已保存并核验。';},true);
    this.button(box,'取消尚未写入的绑定',async alive=>{this.bindingReset();await binding.cancel(c.contextId,alive);if(!alive())return;this.bindingRefresh();this.status.textContent='未写入的绑定已取消。';});return;
   }
   const mine=c.bindings.find(b=>b.ownerId==='collection-card-view')||null,state=status?.frame?.state?.binding||{};
   element(box,'p',mine?'当前绑定：'+mine.sourceScope+' · '+mine.carrierId:'当前没有 Collection 绑定。','ckm-note');
   const recent=(state.results||[]).filter(r=>r.contextId===c.contextId).slice(-3).reverse();
   if(recent.length){const list=element(box,'details');element(list,'summary','最近绑定结果');for(const r of recent)element(list,'p',({replace:'替换',add:'新增',remove:'解除'}[r.operation]||r.operation)+' · '+(r.status==='completed'?'已完成':'已取消'));}
   // Tabs this context used before (format-2 tombstones) are offered as "switch back" targets.
   const former=new Set((state.released||[]).filter(r=>r.contextId===c.contextId&&r.ref.sourceScope===(mine?.sourceScope)).map(r=>r.ref.carrierId));
   const NOTE={replace:'换到同一来源中的另一个空 Tab：只切换主键关联，原 Tab 和其中的条目保留、不会迁移。',add:'在 Collection 默认来源中选择一个空 Tab 挂上本主键；只能选没有其他主键的 Tab。',remove:'只取消主键与该 Tab 的关联：Tab 与条目全部保留；之后改名不再同步到该 Tab，它可以在 Collection 中改名或删除。'};
   const choose=(op,title)=>this.button(box,title,async alive=>{
    this.bindingReset();this.bindingChoice?.remove();const panel=this.bindingChoice=element(box,'div');element(panel,'p',NOTE[op],'ckm-note');
    const previewWith=target=>this.button(panel,op==='remove'?'预览解除':'预览绑定范围',async alive2=>{
     this.bindingReset();const p=await binding.preview(c.contextId,op,target(),alive2);(this.bindingTokens||(this.bindingTokens=new Set())).add(p.token);if(!alive2())return;
     const preview=this.previewEl=element(box,'section',undefined,'ckm-preview');element(preview,'h3',{replace:'确认替换绑定',add:'确认新增绑定',remove:'确认解除绑定'}[op]);element(preview,'p',label(p.plan));element(preview,'p',p.plan.scope.sourceNotePath);if(op==='remove')element(preview,'p',NOTE.remove,'ckm-callout');
     this.button(preview,{replace:'确认替换并同步',add:'确认新增并同步',remove:'确认解除'}[op],async alive3=>{if(!this.persist())throw Error('draft-save-required');naming.invalidate?.();await binding.confirm(p.token,alive3);if(!alive3())return;this.bindingRefresh();this.status.textContent={replace:'替换已保存并核验。',add:'新增绑定已保存并核验。',remove:'已解除绑定；原 Tab 与条目保留。'}[op];},true);
    });
    if(op==='remove'){previewWith(()=>null);return;}
    const rows=await binding.candidates(c.contextId,op,alive);if(!alive())return;
    if(!rows.length){element(panel,'p','此来源没有可绑定的空闲 Tab（已挂其他主键、创建中或带未证明回执的 Tab 不会列出）。');return;}
    rows.sort((a,b)=>(former.has(b.id)?1:0)-(former.has(a.id)?1:0));
    const select=element(panel,'select');select.setAttribute('aria-label','Collection 目标 Tab');for(const row of rows){const opt=element(select,'option',row.name+' · '+row.id+(former.has(row.id)?'（曾经绑定，可切回）':''));opt.value=row.id;}
    select.onchange=()=>{binding.invalidate();this.previewEl?.remove();this.previewEl=null;};
    previewWith(()=>select.value);
   });
   if(mine){choose('replace','替换为其他 Tab');choose('remove','解除绑定');}else choose('add','新增绑定');
  }
  renderPending(root,c){const p=c.naming.pending;this.status.textContent='主键名称已保存。下面各插件的同步尚未全部完成，可继续同一次同步。';
   element(root,'p',`${p.oldLabel} → ${p.newLabel}`,'ckm-name-change');const steps=element(root,'ol',undefined,'ckm-steps');p.plans.forEach((plan,i)=>{const row=element(steps,'li',undefined,'ckm-step');const done=p.progress[i]?.verified;element(row,'span',done?'已核验':'待同步',`ckm-badge${done?' is-success':''}`);element(row,'strong',NAMES[plan.ownerId]||NAMES[plan.id]||plan.id);});
   const info=element(root,'details');element(info,'summary','本次同步编号');element(info,'code',p.txId);
   this.button(root,'继续同步',async alive=>{const result=await naming.resume(c.contextId);if(!alive())return;if(result.projection!=='verified')throw Error('projection-not-verified');service.invalidate();this.render();this.status.textContent='同步已完成，所有载体均已核验。';},true);
  }
  renderEditor(root,c,status){
   this.inputModified=false;this.baseLabel=c.canonicalLabel;this.baseRevision=status.frame.state.revision;this.drafts=null;
   try{const storageRef=storage||root.ownerDocument.defaultView.localStorage;this.drafts=createDrafts(storageRef,plugin.app.vault.adapter.getBasePath(),status.frame.state.namespace,c.contextId,this.session);}catch(e){this.draftError=true;this.status.textContent='草稿存储不可用；编辑后请保留窗口并复制名称。';}
   const field=element(root,'div',undefined,'ckm-name-field'),label=element(field,'label','主键新名称');this.input=element(field,'input');this.input.type='text';this.input.maxLength=4096;this.input.value=this.baseLabel;this.input.id='ckm-name-'+this.session;label.htmlFor=this.input.id;
   element(field,'p','保留原编号，只修改名称。关联内容和对象身份保持不变。','ckm-note');
   const draftBar=element(root,'div',undefined,'ckm-draft-status');
   try{for(const d of this.drafts.list()){const r=element(draftBar,'div',undefined,'ckm-draft-row');element(r,'span',`有未提交的名称草稿 · ${new Date(d.updatedAt).toLocaleString()}`);this.button(r,'恢复草稿',()=>{this.input.value=d.text;this.preview=null;this.previewEl?.replaceChildren();this.persist();this.status.textContent=d.baseLabel!==this.baseLabel||d.baseRevision!==this.baseRevision?'原名称或版本已变化，已恢复文本；请核对后重新预览。':'草稿已恢复，请重新预览。';});}}
   catch(e){this.status.textContent='无法读取草稿，请保留已有内容并查看操作详情。';this.detailsError.textContent=String(e.message||e);}
   const invalidate=()=>{this.inputModified=true;binding?.invalidate();this.preview=null;this.previewEl?.remove();this.previewEl=null;this.persist();};this.input.oninput=invalidate;this.input.oncompositionstart=()=>{this.composing=true;invalidate();};this.input.oncompositionend=()=>{this.composing=false;invalidate();};
   const actions=element(root,'div',undefined,'ckm-inline-actions');this.button(actions,'预览改名范围',async alive=>{if(this.composing)throw Error('composition-in-progress');const value=this.input.value;const p=await naming.previewRename(c.contextId,value);if(!alive())return;this.preview={p,value};this.previewEl?.remove();const box=this.previewEl=element(root,'section',undefined,'ckm-preview');element(box,'h3','确认改名范围');element(box,'p',`${c.canonicalLabel} → ${p.newLabel}`,'ckm-name-change');for(const plan of p.plans)element(box,'p',NAMES[plan.ownerId]||NAMES[plan.id]||plan.id);element(box,'p','确认后先保存名称，再点击“继续同步”完成各插件更新。','ckm-note');this.button(box,'确认保存名称',async alive2=>{if(!this.preview||this.preview.value!==this.input.value||this.composing)throw Error('preview-expired');await naming.confirmRename(this.preview.p.token);if(!alive2())return;this.drafts.remove();this.input=null;service.invalidate();this.render();},true);},true);
   this.button(actions,'重试保存草稿',()=>{if(this.persist())this.status.textContent='草稿已保留。';});
   this.button(actions,'放弃当前输入（会丢弃修改）',()=>{this.drafts?.remove();this.input.value=this.baseLabel;this.preview=null;this.previewEl?.remove();this.previewEl=null;this.status.textContent='已放弃本窗口的输入，其他窗口草稿保留。';});
  }
  renderParticipants(root){const panel=element(root,'details',undefined,'ckm-participants');panel.open=true;element(panel,'summary','参与插件状态 · 操作时会重新核验');const rows=participantStatus();for(const row of rows){const r=element(panel,'div',undefined,'ckm-participant');element(r,'span',NAMES[row.ownerId]||row.ownerId);element(r,'span',row.mode==='ready'?'已就绪':'未就绪',`ckm-badge${row.mode==='ready'?' is-success':' is-warning'}`);} }
 }
 function open(row){if(!isLive())return;const m=new NamingModal(row);m.open();return m;}
 return {open,close(){for(const m of [...opened])m.forceClose();}};
}
module.exports={createNamingUI,exactContext,message,NAMES};
