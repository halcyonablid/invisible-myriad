"use strict";
const {Plugin, ItemView, Notice, TFile}=require('obsidian');
const M=(()=>{const module={exports:{}};
"use strict";
const WINDOW = 401;
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
const name = value => String(value || "").replace(/\.md$/i, "").trim();
function code(value) { const n=name(value), a=n.indexOf('@'), b=n.indexOf('-',a); return a<0||b<0?null:n.slice(a+1,b).trim()||null; }
function ancestors(c) { const p=c.split('.'), result=[]; while(p.length>1){p.pop();result.push(p.join('.'));}return result; }
async function project(data, active, alive=()=>true) {
  if (!data || !data.notes || typeof data.notes!=='object' || Array.isArray(data.notes)) throw Error('EVA_Notes 缺少有效 notes 对象');
  const root=code(active?.basename || active?.name)?.split('.')[0], all=[], paths=new Set(), starts=new Set();let n=0, slice=performance.now();
  for(const note of Object.values(data.notes)) {
    const title=name(note?.file_name), address=code(title);
    if(!title.startsWith('ATOM@')||!address||(root&&address!==root&&!address.startsWith(root+'.'))) continue;
    const path=typeof note.file_path==='string'&&note.file_path?note.file_path:`${title}.md`;
    if(paths.has(path)) throw Error('索引中存在重复文件路径，请检查 EVA 索引');paths.add(path);
    const start=note?.yaml?.['mermaid图之起始']===true||note?.computed?.mermaid?.is_start===true;
    if(start) starts.add(address);
    all.push({name:title,path,code:address,depth:address.split('.').length,start,important:note?.yaml?.['树状图划重点']===true,hidden:note?.computed?.mermaid?.hide_in_tree});
    if(++n%500===0){if(!alive())return null;if(performance.now()-slice>7){await new Promise(r=>setTimeout(r,0));slice=performance.now();if(!alive())return null;}}
  }
  all.sort((a,b)=>collator.compare(a.name,b.name)||a.path.localeCompare(b.path));
  const rows=[], parents=new Set();let maxDepth=1;
  for(const row of all) {
    const lineage=ancestors(row.code);
    row.ownerCodes=lineage.filter(a=>starts.has(a));
    row.hidden=!row.start&&(typeof row.hidden==='boolean'?row.hidden:row.ownerCodes.length>0);
    if(!row.hidden){rows.push(row);maxDepth=Math.max(maxDepth,row.depth);for(const a of lineage)parents.add(a);}
    if(++n%500===0){if(!alive())return null;if(performance.now()-slice>7){await new Promise(r=>setTimeout(r,0));slice=performance.now();if(!alive())return null;}}
  }
  return index({all,rows,parents,root,maxDepth,startCount:starts.size,hiddenCount:all.length-rows.length});
}
function index(model){model.byPath=new Map(model.all.map(r=>[r.path,r]));model.byCode=new Map();for(const r of model.rows){if(!model.byCode.has(r.code))model.byCode.set(r.code,[]);model.byCode.get(r.code).push(r);}return model;}
function branches(model){
 const result=new Map();
 for(const r of model.all){const root=r.code.split('.')[0];if(!result.has(root))result.set(root,{root,all:[],rows:[],parents:new Set(),maxDepth:1,startCodes:new Set(),hiddenCount:0});const b=result.get(root);b.all.push(r);if(r.start)b.startCodes.add(r.code);if(r.hidden)b.hiddenCount++;else{b.rows.push(r);b.maxDepth=Math.max(b.maxDepth,r.depth);for(const a of ancestors(r.code))b.parents.add(a);}}
 for(const b of result.values()){b.startCount=b.startCodes.size;delete b.startCodes;index(b);}return result;
}
function target(model, file) {
  if(!file)return {row:null,role:'主页面没有打开 Markdown 笔记'};
  const exact=model.byPath.get(file.path);
  if(exact&&!exact.hidden)return {row:exact,role:exact.start?'当前对应图':'当前笔记'};
  const c=exact?.code||code(file.basename||file.name);if(!c)return {row:null,role:'当前笔记不在树中'};
  // A retained intermediate tree row is not the Mermaid owner. Prefer the
  // closest actual start for a hidden note before generic ancestor fallback.
  if(exact?.hidden)for(const a of exact.ownerCodes){const matches=model.byCode.get(a)||[];if(matches.length>1)return {row:null,role:'祖先地址重复，无法唯一定位'};if(matches.length===1&&matches[0].start)return {row:matches[0],role:'当前笔记所属图'};}
  for(const a of ancestors(c)) {
    const matches=model.byCode.get(a)||[];
    if(matches.length>1)return {row:null,role:'祖先地址重复，无法唯一定位'};
    if(matches.length===1) return {row:matches[0],role:exact?.hidden&&matches[0].start?'当前笔记所属图':exact?.hidden?'索引隐藏；最近可见祖先':'索引未包含当前笔记；最近可见祖先'};
  }
  return {row:null,role:exact?.hidden?'当前笔记被索引隐藏，未找到可见祖先':'当前笔记不在树中'};
}
function visible(model, maxDepth, folded) {return model.rows.filter(r=>r.depth<=maxDepth&&!ancestors(r.code).some(a=>folded.has(a)));}
function segments(text) {
 let result=[{text,type:''}];
 for(const [pattern,type] of [[/··(.+?)··/g,'keyword'],[/\+\+(.+?)\+\+/g,'emphasis']]) {
  result=result.flatMap(segment=>{if(segment.type)return [segment];const out=[];let at=0;for(const match of segment.text.matchAll(pattern)){if(match.index>at)out.push({text:segment.text.slice(at,match.index),type:''});out.push({text:match[1].replace(/^[A-Z]/,''),type});at=match.index+match[0].length;}if(at<segment.text.length)out.push({text:segment.text.slice(at),type:''});return out;});
 }return result;
}
module.exports={WINDOW,name,code,ancestors,project,branches,target,visible,segments};

return module.exports;})();
const VIEW='eva-branch-sidebar-view';
function el(parent,tag,cls,text){const n=parent.ownerDocument.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;parent.appendChild(n);return n;}
class BranchView extends ItemView {
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.folded=new Set();this.maxDepth=200;this.highlightLevel=0;this.start=0;this.epoch=0;this.closed=false;}
 getViewType(){return VIEW;}getDisplayText(){return 'EVA 分支树';}getIcon(){return 'git-branch';}
 async onOpen(){
  this.contentEl.replaceChildren();this.contentEl.classList.add('eva-branch-sidebar');this.contentEl.tabIndex=0;
  const bar=el(this.contentEl,'div','eb-toolbar');this.summary=el(bar,'span','eb-summary');
  const button=(text,title,fn)=>{const b=el(bar,'button','',text);b.title=title;b.setAttribute('aria-label',title);this.registerDomEvent(b,'click',fn);return b;};
  button('定位','定位主页面当前笔记',()=>this.plugin.invoke());button('↻','重新读取 EVA 索引',()=>this.reload(false,true));
  this.prev=button('‹','上一段',()=>this.page(-1));this.next=button('›','下一段',()=>this.page(1));
  button('清亮','取消同级高亮',()=>{this.highlightLevel=0;this.render();});
  button('?','操作说明',()=>new Notice('单行显示，横向滚动查看完整标题。右键只高亮同层，再次右键同层取消；清亮或 Esc 取消同级高亮。三角折叠。面板内 J/K 调整显示深度，N/M 切换唯一高亮层级。‹/› 遍历分支。',10000));
  this.message=el(this.contentEl,'div','eb-message');this.message.setAttribute('role','status');
  this.scroller=el(this.contentEl,'div','eb-scroll');this.scroller.setAttribute('role','list');this.scroller.setAttribute('aria-label','EVA 分支树');
  this.registerDomEvent(this.contentEl,'keydown',e=>this.key(e));
  this.plugin.views.add(this);this.file=this.plugin.main()?.view.file||null;await this.reload(true);
 }
 async onClose(){this.closed=true;this.epoch++;clearTimeout(this.timer);this.plugin.views.delete(this);}
 source(){
  const provider=this.plugin.app.plugins.plugins['eva-incremental-indexer'];
  if(typeof provider?.getDiagnosticsSnapshot==='function'){
   const path=provider.getDiagnosticsSnapshot()?.notesPath;
   if(typeof path!=='string'||!path)throw Error('EVA 索引器未提供有效的 notesPath');
   const file=this.plugin.app.vault.getAbstractFileByPath(path);
   if(!(file instanceof TFile))throw Error('索引器指定的 EVA_Notes 路径不存在');return file;
  }
  const candidates=this.plugin.app.vault.getFiles().filter(f=>f.name==='EVA_Notes.json');
  if(candidates.length!==1)throw Error(candidates.length?'存在多个 EVA_Notes.json，无法唯一确定来源':'未找到 EVA_Notes.json');return candidates[0];
 }
 async reload(reveal=false,force=false){
  if(this.closed)return;const epoch=++this.epoch;const anchor=this.anchor();this.message.textContent='正在读取 EVA 索引…';
  try{
   const source=this.source();this.sourcePath=source.path;
   const snapshot=await this.plugin.loadIndex(source,force);
   if(this.closed||epoch!==this.epoch||!snapshot)return;
   const root=M.code(this.file?.basename||this.file?.name)?.split('.')[0];
   const model=root?(snapshot.branches.get(root)||{all:[],rows:[],parents:new Set(),root,maxDepth:1,startCount:0,hiddenCount:0,byPath:new Map(),byCode:new Map()}):snapshot.model;
   this.model=model;this.stale=false;this.target=M.target(model,this.file);if(reveal)this.expandTarget();this.render(reveal,anchor);
  }catch(error){if(this.closed||epoch!==this.epoch)return;this.stale=true;this.message.textContent=`${this.model?'旧数据，尚未刷新：':''}${error.message}`;}
 }
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.reload(false),250);}
 async locate(file){this.file=file;await this.reload(true);}
 expandTarget(){const row=this.target?.row;if(!row)return;this.maxDepth=Math.max(this.maxDepth,row.depth);for(const a of M.ancestors(row.code))this.folded.delete(a);}
 anchor(){if(!this.scroller)return null;const top=this.scroller.getBoundingClientRect().top;const row=[...this.scroller.children].find(n=>n.getBoundingClientRect().bottom>top);return row?{path:row.dataset.path,offset:row.getBoundingClientRect().top-top}:null;}
 page(direction){if(!this.filtered)return;this.start=Math.max(0,Math.min(Math.max(0,this.filtered.length-1),this.start+direction*M.WINDOW));this.render(false,null);this.scroller.scrollTop=0;}
 render(reveal=false,anchor=this.anchor()){
  if(this.closed||!this.model)return;
  this.filtered=M.visible(this.model,this.maxDepth,this.folded);
  const targetIndex=this.filtered.findIndex(r=>r.path===this.target?.row?.path);
  if(reveal&&targetIndex>=0)this.start=Math.max(0,targetIndex-200);
  else if(anchor){const at=this.filtered.findIndex(r=>r.path===anchor.path);if(at>=0&&(at<this.start||at>=this.start+M.WINDOW))this.start=Math.floor(at/M.WINDOW)*M.WINDOW;}
  this.start=Math.max(0,Math.min(this.start,Math.max(0,this.filtered.length-1)));
  const end=Math.min(this.start+M.WINDOW,this.filtered.length);
  this.summary.textContent=`${this.filtered.length?this.start+1:0}–${end} / ${this.filtered.length}`;
  this.summary.title=`${this.target?.role||''}；主分支 ${this.model.root||'全库'}；可见层级 ${Math.min(this.maxDepth,this.model.maxDepth)}/${this.model.maxDepth}；Mermaid 起点 ${this.model.startCount}，收纳 ${this.model.hiddenCount}`;
  this.prev.disabled=this.start===0;this.next.disabled=end>=this.filtered.length;
  const role=this.target?.role||'';this.message.textContent=this.stale?'旧索引数据，请刷新':['当前对应图','当前笔记','当前笔记所属图'].includes(role)?'':role;
  const frag=this.contentEl.ownerDocument.createDocumentFragment();
  for(const row of this.filtered.slice(this.start,end)){
   const item=el(frag,'div','eb-row');item.dataset.path=row.path;item.setAttribute('role','listitem');item.style.setProperty('--depth',row.depth-1);
   if(row.start)item.classList.add('is-mermaid');if(row.important)item.classList.add('is-important');
   if(row.depth===this.highlightLevel)item.classList.add('is-level');
   if(row.path===this.target?.row?.path){item.classList.add('is-current');item.setAttribute('aria-current','true');}
   const fold=el(item,'button','eb-fold',this.model.parents.has(row.code)?this.folded.has(row.code)?'▶':'▼':' ');
   fold.disabled=!this.model.parents.has(row.code);fold.setAttribute('aria-label',this.folded.has(row.code)?'展开':'折叠');
   fold.addEventListener('click',e=>{e.stopPropagation();if(this.folded.has(row.code))this.folded.delete(row.code);else this.folded.add(row.code);this.render();});
   const prefix=el(item,'span','eb-prefix',row.depth>1?'│ '.repeat(row.depth-1)+'├─ ':(row.start?'◆ ':'● '));prefix.setAttribute('aria-hidden','true');
   const content=el(item,'div','eb-content');
   const link=el(content,'a','eb-link');link.href=row.path;link.title=row.name;
   for(const segment of M.segments(row.name))el(link,'span',segment.type?`eb-${segment.type}`:'',segment.text);
   if(item.classList.contains('is-current'))el(content,'span','eb-current-badge',this.target.role);
   if(row.start)el(content,'span','eb-mermaid-badge','Mermaid 起点');
   link.addEventListener('click',e=>{e.preventDefault();void this.plugin.openNote(row.path,e.ctrlKey||e.metaKey);});
   item.addEventListener('contextmenu',e=>{e.preventDefault();this.highlightLevel=this.highlightLevel===row.depth?0:row.depth;this.render();});
  }
  this.scroller.replaceChildren(frag);
  if(!this.filtered.length)el(this.scroller,'div','eb-empty','此分支在当前层级或折叠条件下没有可见条目。');
  const node=[...this.scroller.children].find(n=>n.dataset.path===(reveal?this.target?.row?.path:anchor?.path));
  if(node){const offset=node.getBoundingClientRect().top-this.scroller.getBoundingClientRect().top+this.scroller.scrollTop;this.scroller.scrollTop=reveal?Math.max(0,offset-Math.max(0,(this.scroller.clientHeight-node.offsetHeight)/2)):Math.max(0,offset-anchor.offset);}
 }
 key(e){
  if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  const k=e.key.toLowerCase();if(!['j','k','n','m','escape'].includes(k)||!this.model)return;e.preventDefault();e.stopPropagation();
  if(k==='j')this.maxDepth=Math.max(1,Math.min(this.maxDepth,this.model.maxDepth)-1);
  if(k==='k')this.maxDepth=Math.min(this.model.maxDepth,this.maxDepth+1);
  if(k==='n')this.highlightLevel=Math.max(0,this.highlightLevel-1);
  if(k==='m')this.highlightLevel=Math.min(Math.min(this.maxDepth,this.model.maxDepth),this.highlightLevel+1);
  if(k==='escape'||this.highlightLevel>this.maxDepth)this.highlightLevel=0;
  this.render();
 }
}
class BranchPlugin extends Plugin {
 async onload(){
  this.views=new Set();this.alive=true;this.request=0;this.generation=0;
  this.registerView(VIEW,leaf=>new BranchView(leaf,this));
  this.addCommand({id:'open-and-locate',name:'打开/收起左侧分支树并定位当前笔记',callback:()=>this.invokeToggle()});
  this.addRibbonIcon('git-branch','EVA 分支树',()=>this.invokeToggle());
  for(const event of ['modify','create','delete','rename'])this.registerEvent(this.app.vault.on(event,(file,oldPath)=>{
   const matches=[...this.views].filter(v=>file?.path===v.sourcePath||oldPath===v.sourcePath||file?.name==='EVA_Notes.json'||oldPath?.endsWith('/EVA_Notes.json'));if(matches.length){this.generation++;this.cache=null;for(const v of matches)v.schedule();}
  }));
 }
 async loadIndex(source,force=false){
  if(force){this.generation++;this.cache=null;}
  const key=`${source.path}|${source.stat?.mtime||0}|${source.stat?.size||0}|${this.generation}`;
  if(this.cache?.key===key)return this.cache.value;
  if(this.loading?.key===key)return this.loading.promise;
  const generation=this.generation;
  const promise=(async()=>{const data=JSON.parse(await this.app.vault.read(source));const model=await M.project(data,null,()=>this.alive&&generation===this.generation);if(!model)return null;const value={model,branches:M.branches(model)};if(this.alive&&generation===this.generation)this.cache={key,value};return value;})();
  this.loading={key,promise};try{return await promise;}finally{if(this.loading?.promise===promise)this.loading=null;}
 }
 isMain(leaf){return !!leaf&&leaf.getRoot()===this.app.workspace.rootSplit&&leaf.view.getViewType()==='markdown'&&leaf.view.file instanceof TFile&&this.app.workspace.getLeavesOfType('markdown').includes(leaf);}
 main(){const ws=this.app.workspace;const leaf=this.isMain(ws.activeLeaf)?ws.activeLeaf:ws.getMostRecentLeaf(ws.rootSplit);return this.isMain(leaf)?leaf:null;}
 invoke(){void this.open().catch(e=>{console.error('[EVA Branch Sidebar][open.failed]',e);new Notice('分支树打开失败：'+e.message);});}
 async invokeToggle(){
  if(this.toggleBusy||!this.alive)return;this.toggleBusy=true;
  try{const ws=this.app.workspace;const exists=ws.getLeavesOfType(VIEW).some(l=>l.getRoot()===ws.leftSplit);
   if(exists&&!ws.leftSplit.collapsed){this.request++;ws.leftSplit.collapse();}
   else await this.open();
  }catch(e){console.error('[EVA Branch Sidebar][toggle.failed]',e);new Notice('分支树切换失败：'+e.message);}
  finally{this.toggleBusy=false;}
 }
 async open(){
  const file=this.main()?.view.file||null,tx=++this.request;
  if(!this.opening)this.opening=(async()=>{const ws=this.app.workspace;let leaf=ws.getLeavesOfType(VIEW).find(l=>l.getRoot()===ws.leftSplit);if(!leaf){leaf=ws.getLeftLeaf(false);if(!leaf)throw Error('无法打开左侧栏');await leaf.setViewState({type:VIEW,active:true});}ws.leftSplit.expand();await ws.revealLeaf(leaf);for(const old of ws.getLeavesOfType(VIEW))if(old!==leaf&&old.getRoot()===ws.rightSplit)old.detach();return leaf.view;})();
  let view;try{view=await this.opening;}finally{this.opening=null;}
  if(!this.alive||tx!==this.request||view.closed)return;
  await view.locate(file);if(!this.alive||tx!==this.request)return;
  console.info('[EVA Branch Sidebar][locate][summary]',{txId:tx,scopeType:'note',scopeKey:file?.path||'',status:view.stale?'WARN':'PASS',reasonCodes:[view.target?.role||'no-target']});
 }
 async openNote(path,newTab){
  const file=this.app.vault.getAbstractFileByPath(path);if(!(file instanceof TFile)){new Notice('索引中的笔记路径不存在，请刷新 EVA 索引。');return;}
  let leaf=this.main();if(!leaf||newTab||leaf.getViewState().pinned)leaf=this.app.workspace.getLeaf('tab');
  if(leaf.getRoot()!==this.app.workspace.rootSplit){new Notice('未找到主编辑区，已取消跳转。');return;}
  await leaf.openFile(file,{active:true});
  for(const v of this.views)if(v.model?.byPath.has(file.path)){v.file=file;v.target=M.target(v.model,file);v.render(false);}
 }
 onunload(){this.alive=false;this.generation++;this.cache=null;this.request++;this.app.workspace.detachLeavesOfType(VIEW);}
}
module.exports=BranchPlugin;
