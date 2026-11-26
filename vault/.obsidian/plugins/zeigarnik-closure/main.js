const {Plugin,ItemView,Modal,Notice}=require('obsidian');
const TYPE='zeigarnik-closure-view';
const SOURCES=['mandala-time-blocks','experience-note-tags'];
const QUESTIONS=[
 ['日课标签','最近，你关心哪些日课标签？'],
 ['经验回顾标签','哪些经验回顾标签值得带走？'],
 ['项目与执行','最近推进了什么项目，停手时做到哪一步？'],
 ['还放不下的事','现在还有哪些事我放不下，觉得还需要自己去处理？','也可以写以前没处理好的事。我还惦记……，因为……。'],
 ['接下来的计划','下次开始时，你愿意先做哪件事？'],
 ['兴趣线索','最近遇到哪些作品、观点或推荐，我想留到以后再了解？','我想记住……，它让我好奇的是……。'],
 ['本次取舍','这次我决定不做什么？我是怎么作出这个判断的？','我决定这次不……，因为……。'],
 ['给下次工作的寄语','下次接手时，你希望自己先看到什么？']
];
const LEGACY_QUESTIONS=QUESTIONS.slice();
LEGACY_QUESTIONS[3]=['系统运行体验','这次运行，哪里顺手，哪里让你费力？'];
LEGACY_QUESTIONS[5]=['最近的作品','最近的书、影音、游戏或文章，哪些让你有感触？'];
LEGACY_QUESTIONS[6]=['这次决定放下','哪些推荐让你心动，但这次决定先放下？'];
const questionsFor=record=>record.questionVersion===2?QUESTIONS:LEGACY_QUESTIONS;
const dayKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const blankHandoff=()=>({tags:[],plan:'',focus:''});
const blank=()=>({questionVersion:2,step:0,tags:[[],[]],text:Array(5).fill(''),handoff:blankHandoff()});
const identity=t=>JSON.stringify([t.scope||'',t.name]);
function node(parent,tag,text='',cls=''){
 const e=parent.ownerDocument.createElement(tag);if(cls)e.className=cls;e.textContent=text;parent.appendChild(e);return e;
}
function button(parent,text,handler,cls=''){
 const b=node(parent,'button',text,cls);b.type='button';b.onclick=()=>Promise.resolve().then(handler).catch(err=>new Notice(err.message));return b;
}
function empty(e){e.replaceChildren()}
function download(doc,data,name){
 const a=doc.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 a.href=url;a.download=name+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function tagGroup(group){
 return Array.isArray(group)&&group.every(t=>t&&typeof t.name==='string'&&typeof t.note==='string'&&
  [t.label,t.scope].every(value=>value===undefined||typeof value==='string'));
}
function answers(p){
 if(!p||!Array.isArray(p.text)||p.text.length!==5||!p.text.every(x=>typeof x==='string')||
    !Array.isArray(p.tags)||p.tags.length!==2||!p.tags.every(tagGroup))return false;
 const h=p.handoff;
 return h===undefined||!!h&&tagGroup(h.tags)&&typeof h.plan==='string'&&typeof h.focus==='string';
}
function validPack(p){return answers(p)&&typeof p.id==='string'&&p.id.length>0&&typeof p.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.day)&&dayKey(new Date(p.day+'T12:00:00'))===p.day&&typeof p.time==='string'}
function display(tag){return tag.label||tag.name}
function tagLink(parent,tag,source,open){
 if(!tag.scope||tag.scope==='manual'){
  const chip=node(parent,'span',display(tag),'zc-chip');
  chip.title='此标签没有可定位的来源记录';return;
 }
 const chip=button(parent,display(tag),()=>open(tag,source),'zc-chip zc-jump');
 chip.title=(source===0?'打开日课标签汇总':'打开经验回看')+' · '+tag.name;
}
function tagNotes(parent,tags,source,open){
 for(const tag of tags){
  const entry=node(parent,'div','','zc-tag-note');
  tagLink(entry,tag,source,open);
  if(tag.note)node(entry,'p',tag.note);
 }
}
function hasHandoff(p){
 const h=p?.handoff;
 return !!h&&(!!h.focus.trim()||!!h.plan.trim()||h.tags.length>0);
}
function renderAnswers(parent,p,open){
 const h=p.handoff;
 if(hasHandoff(p)){
  const box=node(parent,'section','','zc-section zc-handoff');node(box,'h3','给下次工作的寄语');
  if(h.focus.trim()){node(box,'h4','优先关注');node(box,'p',h.focus)}
  if(h.tags.length){node(box,'h4','接手时可用的经验');tagNotes(box,h.tags,1,open)}
  if(h.plan.trim()){node(box,'h4','下一步行动台的待办建议');node(box,'p',h.plan)}
 }
 questionsFor(p).slice(0,7).forEach(([label],i)=>{
  const s=node(parent,'section','','zc-section');node(s,'h4',label);
  if(i<2&&p.tags[i].length)tagNotes(s,p.tags[i],i,open);
  else node(s,'p',i>=2&&p.text[i-2].trim()?p.text[i-2]:'本次略过',i>=2&&p.text[i-2].trim()?'':'zc-muted');
 });
}
const collator = new Intl.Collator('zh-CN', {numeric:true});
function addressOf(tag) {
 const label = display(tag), match = /^([#]?)([a-z0-9]+(?:[./@+][a-z0-9]+)*)\s*-\s*(.*)$/i.exec(label);
 return match ? {prefix:match[1]+match[2],parts:match[2].split(/[./]/),caption:match[3]} : {prefix:'',parts:[],caption:label};
}
function compareTags(a,b) {
 const x=a.address.parts,y=b.address.parts;
 if (!!x.length!==!!y.length) return x.length ? -1 : 1;
 for(let i=0;i<Math.min(x.length,y.length);i++){const order=collator.compare(x[i],y[i]);if(order)return order}
 return x.length-y.length || collator.compare(a.address.caption,b.address.caption) || collator.compare(a.tag.name,b.tag.name);
}
class TagPicker extends Modal {
 constructor(editor) {
  super(editor.app);
  this.editor=editor;
  this.i=editor.d.step===0?0:1;
  this.group=editor.d.step===7?editor.d.handoff.tags:editor.d.tags[this.i];
  this.selected=new Map(this.group.map(t=>[identity(t),{...t}]));
  this.options=new Map(this.selected);
  this.ticket=0;
 }
 onOpen() {
  const e=this.contentEl, kind=this.i===0?'daily':'experience';
  this.modalEl?.classList.add('zc-picker-modal','zc-modal-'+kind);
  e.classList.add('zc-root','zc-picker','zc-picker-'+kind);
  this.setTitle('选择'+QUESTIONS[this.i][0]);
  this.search=node(e,'input');
  this.search.type='search';
  this.search.placeholder='搜索原名或义名';
  this.search.setAttribute('aria-label',this.search.placeholder);
  this.search.oninput=()=>this.draw();
  this.summary=node(e,'div','','zc-picker-summary');
  this.status=node(e,'div','','zc-muted');
  this.status.setAttribute('role','status');
  this.viewport=node(e,'div','','zc-picker-scroll');
  this.list=node(this.viewport,'div','','zc-picker-list');
  this.tray=node(e,'div','','zc-picker-tray');
  const foot=node(e,'footer','','zc-picker-footer');
  button(foot,'刷新标签',()=>this.load());
  button(foot,'手动加入搜索词',()=>{
   const name=this.search.value.trim();if(!name)return;
   const t={scope:'manual',name,label:name,note:''};
   this.options.set(identity(t),t);
   this.selected.set(identity(t),this.selected.get(identity(t))||t);
   this.draw();
  });
  button(foot,'取消',()=>this.close(),'zc-cancel');
  button(foot,'确认选择',()=>this.confirm(),'mod-cta');
  this.draw();this.search.focus();this.load();
 }
 confirm() {
  if(this.sourceOwner && (this.app.plugins.getPlugin(SOURCES[this.i])!==this.sourceOwner ||
     this.i===0 && this.sourceOwner.getTimeCaptureSourceNotePath()!==this.sourceScope))
   throw Error('标签来源已切换，请取消并重新选择。');
  this.group.splice(0,this.group.length,...this.selected.values());
  this.editor.changed();this.close();this.editor.draw();
 }
 async load() {
  this.controller?.abort();
  const controller=this.controller=new AbortController(), ticket=++this.ticket;
  this.status.textContent='正在读取标签…';
  const get=()=>this.app.plugins.getPlugin(SOURCES[this.i]),owner=get();
  const accept=result=>{
   if(ticket!==this.ticket || controller.signal.aborted)return;
   if(get()!==owner || result.version!==1 || !Array.isArray(result.tags)) {
    this.status.textContent='来源已变化，请刷新。';return;
   }
   this.sourceOwner=owner;this.sourceScope=result.scope;
   this.options=new Map(this.selected);
   for(const {raw,label,color,count} of result.tags) {
    const tag={scope:result.scope,name:raw,label:label||raw,note:''},key=identity(tag);
    this.options.set(key,{...tag,color,count});
    if(this.selected.has(key))this.selected.set(key,{...tag,note:this.selected.get(key).note});
   }
   this.status.textContent=result.partial?'正在更新经验片段索引…':'';
   this.draw();
  };
  try {
   if(typeof owner?.getClosureTagsV1!=='function')throw Error('标签来源未启用或尚未更新，可手动添加。');
   accept(await owner.getClosureTagsV1({signal:controller.signal,onUpdate:accept}));
  }catch(err){if(ticket===this.ticket)this.status.textContent=err.message}
 }
 draw() {
  const query=this.search.value.trim().replace(/^#/,'').toLocaleLowerCase();
  const matches=[...this.options.entries()].filter(([,t])=>[t.name,display(t)].some(s=>s.toLocaleLowerCase().includes(query)))
   .map(([key,tag])=>({key,tag,address:addressOf(tag)})).sort(compareTags);
  const focusKey=this.contentEl.ownerDocument.activeElement?.dataset.zcKey;
  const top=this.viewport.scrollTop;
  empty(this.list);
  this.list.style.setProperty('--zc-rows-3',Math.max(1,Math.ceil(matches.length/3)));
  this.list.style.setProperty('--zc-rows-2',Math.max(1,Math.ceil(matches.length/2)));
  this.summary.textContent='匹配 '+matches.length+' / '+this.options.size+' 个标签';
  if(!matches.length)node(this.list,'p',query?'没有匹配的标签':'暂无可选标签','zc-muted');
  for(const {key,tag,address} of matches) {
   const row=node(this.list,'label','','zc-picker-row'),box=node(row,'input');
   row.title=tag.name;box.type='checkbox';box.dataset.zcKey=key;box.checked=this.selected.has(key);
   const label=node(row,'span','','zc-tag-title');
   if(address.prefix){node(label,'b',address.prefix);node(label,'span',' - '+address.caption)}else label.textContent=address.caption;
   if(tag.color)row.style.setProperty('--zc-tag-color',tag.color);
   if(this.i===1 && Number.isInteger(tag.count))node(row,'small',String(tag.count),'zc-tag-uses').title='使用此标签的片段数';
   if(key===focusKey)box.focus({preventScroll:true});
   box.onchange=()=>{
    if(box.checked){
     const note=this.group.find(t=>identity(t)===key)?.note||'';
     this.selected.set(key,{name:tag.name,scope:tag.scope,label:display(tag),note});
    }else this.selected.delete(key);
    this.drawTray();
   };
  }
  this.viewport.scrollTop=top;
  this.drawTray();
 }
 drawTray() {
  empty(this.tray);node(this.tray,'small','已选 '+this.selected.size);
  for(const [key,t] of this.selected){
   const chip=button(this.tray,display(t)+' ×',()=>{this.selected.delete(key);this.draw()});
   chip.setAttribute('aria-label','移除 '+display(t));
  }
 }
 onClose(){this.ticket++;this.controller?.abort();this.editor.picker=null;empty(this.contentEl)}
}
class Editor extends Modal{
 constructor(plugin){super(plugin.app);this.plugin=plugin;this.d=plugin.db.draft}
 onOpen(){
  this.modalEl.classList.add('zc-editor-modal');
  this.contentEl.classList.add('zc-root','zc-editor');
  this.draw();
 }
 changed(){this.plugin.schedule()}
 draw(){
  const d=this.d,i=d.step;empty(this.contentEl);this.setTitle('运行收尾');
  const e=node(this.contentEl,'div','','zc-editor-fields');
  const [label,prompt,hint]=questionsFor(d)[i];
  node(e,'small',(i+1)+' / '+QUESTIONS.length+'　·　'+label,'zc-muted');node(e,'h3',prompt);
  if(i<2||i===7){
   const handoff=i===7;
   if(handoff)d.handoff??=blankHandoff();
   const source=i===0?0:1;
   button(e,'选择'+QUESTIONS[source][0],()=>{this.picker=new TagPicker(this);this.picker.open()});
   for(const t of (handoff?d.handoff.tags:d.tags[source])){
    const group=node(e,'div','','zc-annotation');
    tagLink(group,t,source,async(tag,kind)=>{
     if(this.busy)return;
     this.busy=true;this.contentEl.inert=true;
     try{await this.plugin.flush();await this.plugin.openTag(tag,kind);this.close()}
     finally{this.busy=false;this.contentEl.inert=false}
    });
    const a=node(group,'textarea');a.value=t.note;a.setAttribute('aria-label',display(t)+' 的批语');
    a.placeholder=handoff?'给下次的评价与说明，例如这条经验适合用在哪里':'此刻的想法……';
    a.oninput=()=>{t.note=a.value;this.changed()};
   }
   if(handoff){
    for(const [key,title,hint] of [['plan','下一步行动台的待办建议','哪些待办值得重新整理？下次先推进哪一项？'],['focus','优先关注','给下次接手的自己留一句重点。']]){
     const group=node(e,'label','','zc-annotation');node(group,'b',title);
     const a=node(group,'textarea');a.value=d.handoff[key];a.placeholder=hint;a.oninput=()=>{d.handoff[key]=a.value;this.changed()};
    }
   }
  }else{
   const a=node(e,'textarea');
   a.value=d.text[i-2];
   a.setAttribute('aria-label',label);
   a.placeholder=hint??'写下想法，或略过这一问。';
   a.oninput=()=>{d.text[i-2]=a.value;this.changed()}
  }
  const bar=node(this.contentEl,'div','','zc-tools zc-editor-actions');button(bar,'暂存退出',async()=>{await this.plugin.flush();this.close()});
  if(i)button(bar,'上一步',()=>{d.step--;this.changed();this.draw()});
  button(bar,i===QUESTIONS.length-1?'提交并封存':'提交此问，继续',async()=>{if(i<QUESTIONS.length-1){d.step++;this.changed();this.draw();return}
   if(this.busy)return;this.busy=true;this.contentEl.inert=true;
   try{const p=await this.plugin.seal(d);this.plugin.select(p);this.close();new Notice('本次收尾已封存。')}finally{this.busy=false;this.contentEl.inert=false}
  },'mod-cta');
 }
 onClose(){this.picker?.close();if(this.plugin.editor===this)this.plugin.editor=null;this.plugin.flush().catch(()=>{});this.plugin.redraw();empty(this.contentEl)}
}
class ClosureView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.day=dayKey(new Date());this.month=this.day.slice(0,7);this.selected=''}
 getViewType(){return TYPE}getDisplayText(){return '蔡加尼克效应结束者'}getIcon(){return 'book-check'}
 async onOpen(){this.plugin.views.add(this);this.contentEl.classList.add('zc-root');this.draw()}
 async onClose(){this.plugin.views.delete(this)}
 pick(day,id=''){this.day=day;this.month=day.slice(0,7);this.selected=id;this.draw()}
 draw(){
  const e=this.contentEl;empty(e);const head=node(e,'header','','zc-cover');const copy=node(head,'div');node(copy,'h2',this.getDisplayText());node(copy,'p','把这次运行收好，给下次开始留一条线索。');
  button(head,this.plugin.db.draft?'继续上次收尾':'开始一次收尾',()=>this.plugin.begin(),'mod-cta');
  const layout=node(e,'div','','zc-layout');const nav=node(layout,'aside'),r=node(layout,'article','','zc-paper');const controls=node(nav,'div','','zc-tools');
  const [y,m]=this.month.split('-').map(Number);node(controls,'strong',y+' 年 '+m+' 月');
  const move=n=>{this.month=dayKey(new Date(y,m-1+n,1)).slice(0,7);this.draw()};
  button(controls,'‹',()=>move(-1)).setAttribute('aria-label','上个月');button(controls,'今天',()=>this.pick(dayKey(new Date())));button(controls,'›',()=>move(1)).setAttribute('aria-label','下个月');
  const grid=node(nav,'div','','zc-grid');for(const s of '一二三四五六日')node(grid,'small',s);for(let n=0;n<(new Date(y,m-1,1).getDay()+6)%7;n++)node(grid,'span');
  const packs=this.plugin.db.packs,days=new Set(packs.map(p=>p.day));
  for(let i=1;i<=new Date(y,m,0).getDate();i++){const key=dayKey(new Date(y,m-1,i));const b=button(grid,String(i),()=>this.pick(key),days.has(key)?'zc-mark':'');b.setAttribute('aria-pressed',String(key===this.day));b.title=key+(days.has(key)?' · 有收尾包':'')}
  node(nav,'h4','最近的收尾');for(const p of packs.slice(0,5))button(nav,p.day+'　'+p.time,()=>this.pick(p.day,p.id),'zc-recent');
  const list=packs.filter(p=>p.day===this.day);const current=list.find(p=>p.id===this.selected)||list[0];
  node(r,'small',this.day,'zc-muted');node(r,'h2',current?'运行收尾记录':'这一天还没有收尾记录');
  if(current){const tabs=node(r,'div','','zc-tools');for(const p of list)button(tabs,p.time,()=>this.pick(p.day,p.id)).setAttribute('aria-pressed',String(p===current));renderAnswers(r,current,(tag,source)=>this.plugin.openTag(tag,source));button(r,'导出这一份',()=>download(e.ownerDocument,current,'收尾包-'+current.day))}
  if(!hasHandoff(current)){
   const last=packs.find(hasHandoff);
   if(last)button(r,'查看最近的工作寄语 · '+last.day+' '+last.time,()=>this.pick(last.day,last.id));
  }
  const foot=node(nav,'div','','zc-tools');button(foot,'导出全部',()=>download(e.ownerDocument,{version:1,packs:this.plugin.db.packs},'全部收尾包'));
  const file=node(foot,'input');file.type='file';file.accept='.json';file.hidden=true;button(foot,'调取文件',()=>file.click());file.onchange=async()=>{try{const f=file.files[0];if(!f)return;const j=JSON.parse(await f.text());await this.plugin.importPacks(j)}catch(err){new Notice(err.message)}finally{file.value=''}};
 }
}
module.exports=class ClosurePlugin extends Plugin{
 async onload(){
  this.views=new Set();this.tail=Promise.resolve();this.revision=0;this.saved=0;
  const db=await this.loadData();
  if(db!=null&&!(db.version===1&&Array.isArray(db.packs)&&db.packs.every(validPack)&&(db.draft===null||answers(db.draft)&&Number.isInteger(db.draft.step)&&db.draft.step>=0&&db.draft.step<QUESTIONS.length)))throw Error('收尾数据格式无法识别，请保留原文件。');
  this.db=db||{version:1,draft:null,packs:[]};
  this.registerView(TYPE,l=>new ClosureView(l,this));this.addCommand({id:'open',name:'打开收尾月历',callback:()=>this.openView()});
  this.addCommand({id:'begin',name:'开始或继续运行收尾',callback:()=>this.begin()});
 }
 async openTag(tag,source){
  const owner=this.app.plugins.getPlugin(SOURCES[source]);
  if(typeof owner?.openClosureTagV1!=='function')throw Error('请启用并加载新版'+(source===0?'日课':'经验回看')+'插件，然后再打开这个标签。');
  await owner.openClosureTagV1({scope:tag.scope,raw:tag.name});
 }
 async openView(){const w=this.app.workspace;let l=w.getLeavesOfType(TYPE)[0];if(!l){l=w.getLeaf('tab');await l.setViewState({type:TYPE,active:true})}await w.revealLeaf(l)}
 begin(){if(this.editor||this.sealing)return;if(!this.db.draft){this.db.draft=blank();this.schedule()}this.editor=new Editor(this);this.editor.open()}
 redraw(){for(const v of this.views)v.draw()}
 select(p){for(const v of this.views)v.pick(p.day,p.id)}
 schedule(){this.revision++;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(()=>{}),220)}
 flush(){clearTimeout(this.timer);const save=async()=>{if(this.saved===this.revision)return;const rev=this.revision,snapshot=JSON.parse(JSON.stringify(this.db));try{await this.saveData(snapshot);this.saved=rev}catch(err){new Notice('收尾保存失败，当前内容保留在内存中，请重试。');throw err}};
  this.tail=this.tail.catch(()=>{}).then(save);return this.tail;
 }
 async seal(d){
  if(this.sealing||this.db.draft!==d)throw Error('草稿状态已变化');this.sealing=true;
  try{await this.flush();const now=new Date(),p={tags:d.tags,text:d.text,handoff:d.handoff||blankHandoff(),id:crypto.randomUUID(),day:dayKey(now),time:now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})};
   if(d.questionVersion!==undefined)p.questionVersion=d.questionVersion;
   this.db.packs.unshift(p);this.db.draft=null;this.revision++;
   try{await this.flush()}catch(err){this.db.packs=this.db.packs.filter(v=>v!==p);this.db.draft=d;this.schedule();throw err}return p;
  }finally{this.sealing=false}
 }
 async importPacks(input){const items=Array.isArray(input?.packs)?input.packs:[input];if(!items.length||!items.every(validPack))throw Error('请选择有效的收尾包文件。');
  const ids=new Set(this.db.packs.map(p=>p.id));for(const p of items)if(!ids.has(p.id)){ids.add(p.id);this.db.packs.push(p)}
  this.db.packs.sort((a,b)=>b.day.localeCompare(a.day)||b.time.localeCompare(a.time));this.revision++;await this.flush();this.select(this.db.packs.find(p=>p.id===items[0].id));
 }
 onunload(){this.editor?.close();this.flush().catch(()=>{})}
};
