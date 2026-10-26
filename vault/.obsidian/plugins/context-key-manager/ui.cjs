"use strict";
function createUI({Modal},plugin,service){
 const opened=new Set();let closed=false;
 const archive=require('./recovery-archive.cjs').createArchive(service.store,()=>!closed&&!plugin.closed&&plugin.app.plugins?.plugins?.['context-key-manager']===plugin);
 class IdentityModal extends Modal {
  constructor(row){super(plugin.app);this.row=row;this.alive=true;this.serial=0;opened.add(this);}
  onOpen(){this.modalEl.classList.add('ckm-modal-shell');this.contentEl.classList.add('ckm-console');this.render();}
  onClose(){this.alive=false;this.serial++;opened.delete(this);this.contentEl.empty();}
  add(tag,text){return this.contentEl.createEl(tag,{text});}
  button(text,fn){const b=this.add('button',text);b.onclick=()=>this.run(fn,b);return b;}
  async run(fn,b){if(this.working||!this.alive||closed||plugin.closed||plugin.app.plugins?.plugins?.['context-key-manager']!==plugin)return;this.working=true;b.disabled=true;const serial=++this.serial;try{await fn(()=>this.alive&&this.serial===serial);}catch(e){if(this.alive)this.add('p','未完成：'+e.message+'。可关闭后在“存储维护”中查看并继续已确认的操作。');}finally{this.working=false;if(this.alive)b.disabled=!!b.finalDisabled;}}
  archives(){
   const box=this.contentEl.createEl('details');box.createEl('summary',{text:'恢复备份与容量'});
   try{const rows=archive.list();box.createEl('p',{text:'恢复备份 '+rows.length+' / 4。归档保留原文件，只释放恢复区份额；归档后仍需单独确认存储修复。'});
    for(const r of rows){const row=box.createEl('div');row.createEl('p',{text:r.id+(r.ok?' · '+Math.ceil(r.bytes/1024)+' KiB':' · 无法归档：'+r.reason)});
     if(r.ok){const b=row.createEl('button',{text:'预览归档'});b.onclick=()=>this.run(async()=>{const p=archive.preview(r.id);row.createEl('p',{text:'将完整移动到 '+p.destination+'，保留原内容。'});const confirm=row.createEl('button',{text:'确认归档这份备份'});confirm.onclick=()=>this.run(async alive=>{const result=archive.confirm(p.token);if(alive()){this.render();this.add('p',result.recoveryRequired?'备份已归档。存储尚未修复，请继续预览修复。':'备份已归档，当前身份数据保持不变。');}},confirm);},b);}
    }
   }catch(e){box.createEl('p',{text:'备份区需要人工核对：'+e.message+'。原文件保留。'});}
  }
  render(){this.contentEl.empty();this.add('h2',this.row?'登记稳定身份':'已登记身份 / 存储维护');this.add('p','登记后保留固定身份 ID。名称和追踪状态仍由原管理功能负责；这里记录核验时已保存的来源与载体。');let status;try{status=service.store.status();}catch(e){this.add('p',/unsupported-(binding-format|frame-version|state-version)/.test(e.message)?'存储格式比当前主键管理中心更新（'+e.message+'）：请把主键管理中心更新到与存储匹配的版本；不要恢复备份，也不要手动修改存储。':'存储已阻断：'+e.message+'。请保留原文件，使用已验证的备份进行外部恢复；不会自动初始化或覆盖。');return;}if(status.status==='storage-missing'){this.add('p','已有身份存储缺少快照，不能重新初始化。请保留原目录并使用已验证备份恢复。');return;}
   if(status.status==='ready'||status.status==='recovery-required')this.archives();
   if(status.status==='unconfigured'){this.add('p','本库尚未初始化身份存储。此操作创建空存储，不导入项目或目标。');this.button('预览初始化',async()=>{const p=service.previewInitialize();this.add('p','新存储标识：'+p.namespace);this.button('确认初始化',async alive=>{await service.confirmInitialize(p.token);if(alive())this.render();});});return;}
   if(status.status!=='ready'){this.add('p','存储需要核验。正常读取不会自动修复或回退。');this.button('预览继续 / 修复',async()=>{const p=service.previewRecovery();this.add('p',p.plan.kind==='pending'?'继续已确认的操作，保留原身份 ID。':'修复同一版本的镜像或释放已结束的写入锁；原文件先备份。');const cmd=p.plan.pending?.command;if(cmd){this.add('p',cmd.canonicalLabel+' · '+cmd.contextId);for(const b of cmd.bindings||[])this.add('p',`${b.ownerId} · ${b.sourceScope} · ${b.carrierId}`);}this.button('确认继续 / 修复',async alive=>{await service.confirmRecovery(p.token);if(alive())this.render();});});return;}
   if(this.row&&status.frame.version!==3){this.add('p','存储已升级。旧登记入口已停用，请使用中心管理入口处理名称与绑定。');return;}
   if(this.row){this.add('p',this.row.label);this.button('预览身份和载体',async alive=>{const p=await service.previewRegistration(this.row);if(!alive())return;if(p.kind==='existing'){this.add('p','已登记：'+p.item.contextId);return;}this.add('p','请核对：以下同名匹配到的既有载体属于这同一个对象。确认只登记身份，不创建、改名或移动这些载体。');this.add('p','身份：'+p.command.contextId);this.add('p','来源：'+p.row.ownerSourceScope);for(const b of p.command.bindings)this.add('p',`${b.ownerId} · ${b.sourceScope} · ${b.carrierId}`);this.button('确认登记这些载体',async alive2=>{const result=await service.confirmRegistration(p.token);if(alive2()){this.contentEl.empty();this.add('h2','登记完成');this.add('p',result.item.contextId);this.add('p','关闭后可从“已登记身份 / 存储维护”再次查看。');}});});return;}
   this.add('p',`身份存储版本 ${status.frame.state.revision} · ${status.frame.state.contexts.length} / ${service.store.maxContexts} 项；容量上限 ${Math.round(service.store.maxBytes/1024/1024)} MiB。`);let cursor;const page=()=>{const r=service.read({cursor});if(!r.ok)throw Error(r.reason);for(const c of r.items){this.add('h3',c.registeredLabel);this.add('p',c.contextId);this.add('p','核验时间：'+c.observation.observedAt);for(const b of c.bindings)this.add('p',`${b.ownerId} · ${b.sourceScope} · ${b.carrierId}`);}cursor=r.cursor;};page();if(cursor){let next;next=this.button('下一页',async()=>{if(!cursor)return;page();if(!cursor){next.finalDisabled=true;next.disabled=true;}});}
  }
 }
 return {open(row){const m=new IdentityModal(row);m.open();return m;},close(){closed=true;for(const m of [...opened])m.close();}};
}
module.exports={createUI};
