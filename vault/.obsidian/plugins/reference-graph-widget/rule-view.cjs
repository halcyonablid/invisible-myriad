'use strict';
function mount({document:doc,window:win,layout,mermaid,mermaidService,settings={},onOpen,onClose,onRefresh,onEva}) {
  const el=(tag,cls,text,parent)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;parent?.append(e);return e;};
  const shell=el('section','rg-rule-widget');shell.id='reference-graph-widget';shell.setAttribute('aria-label','关系图与集合卡');
  const top=el('header','rg-toolbar',null,shell),title=el('strong','rg-title','关系图与集合卡',top);
  const relation=el('button','','关系图',top),collection=el('button','','集合卡',top);
  const refresh=el('button','','刷新',top),eva=el('button','','+ EVA 关联',top),close=el('button','','关闭 ×',top);
  const rendererBadge=el('small','rg-renderer-name','',top);top.insertBefore(rendererBadge,refresh);
  refresh.onclick=()=>{graphBuilt=false;onRefresh();};eva.onclick=onEva;close.onclick=onClose;
  const status=el('div','rg-status','正在读取当前邻域…',shell),hint=el('div','rg-hint','滚轮上下浏览 · Shift + 滚轮左右浏览 · Ctrl + 滚轮缩放 · 点击卡片打开笔记',shell);
  const renderError=el('div','rg-render-error',null,shell),errorText=el('span','',null,renderError),fallback=el('button','','本次使用规则布局',renderError);renderError.hidden=true;
  const graphPane=el('div','rg-graph-pane',null,shell),collectionPane=el('div','rg-collection-pane',null,shell);collectionPane.hidden=true;
  const zoom=el('div','rg-zoom',null,graphPane),minus=el('button','','−',zoom),fit=el('button','','定位当前',zoom),plus=el('button','','+',zoom);
  doc.body.append(shell);
  let scene=null,current=null,active='relations',destroyed=false,frame=0,revision=0,graphBuilt=false,collectionBuilt=false,valid=()=>true,first=true,rendering=-1,collectionRendering=-1;
  let camera={x:24,y:24,k:0.8},moved=false,drag=null,suppressClick=false,fontTimer=null,fontReflows=0;
  let renderer=settings.graphRenderer==='mermaid'?'mermaid':'rules',direction=settings.layout||'LR',groupByLevel=settings.groupByLevel!==false,lastGraphKey='',styleRevision=0;
  const scenes=new Map(),originElements=new WeakMap();
  const updateBadge=()=>{rendererBadge.textContent=renderer==='mermaid'?'Mermaid 布局':'规则布局';};updateBadge();
  const counters={transforms:0,wheelEvents:0,layouts:0,tabSwitches:0,measurements:0};
  function paint(){frame=0;if(scene){scene.style.transform=`translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.k})`;counters.transforms++;}}
  function schedule(){if(!frame)frame=win.requestAnimationFrame(paint);}
  function zoomAt(factor,x,y){const old=camera.k,next=Math.min(2.5,Math.max(.15,old*factor));camera.x=x-(x-camera.x)*next/old;camera.y=y-(y-camera.y)*next/old;camera.k=next;schedule();}
  function wheel(e){if(e.target.closest('button'))return;e.preventDefault();counters.wheelEvents++;const rect=graphPane.getBoundingClientRect(),unit=e.deltaMode===1?18:e.deltaMode===2?rect.height:1;
    if(e.ctrlKey)zoomAt(Math.exp(-e.deltaY*unit*.002),e.clientX-rect.left,e.clientY-rect.top);
    else if(e.shiftKey){camera.x-=(e.deltaY||e.deltaX)*unit;schedule();}else{camera.x-=e.deltaX*unit;camera.y-=e.deltaY*unit;schedule();}}
  graphPane.addEventListener('wheel',wheel,{passive:false});
  graphPane.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a')||e.ctrlKey||e.shiftKey)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y};moved=false;});
  const move=e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)moved=true;if(moved){e.preventDefault();camera.x=drag.cx+dx;camera.y=drag.cy+dy;schedule();}};
  const up=e=>{if(drag?.id!==e.pointerId)return;suppressClick=moved;drag=null;};
  win.addEventListener('pointermove',move);win.addEventListener('pointerup',up);win.addEventListener('pointercancel',up);
  graphPane.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
  const centerZoom=f=>zoomAt(f,graphPane.clientWidth/2,graphPane.clientHeight/2);minus.onclick=()=>centerZoom(1/1.15);plus.onclick=()=>centerZoom(1.15);
  function centerOrigin(){
    const origin=scene&&originElements.get(scene);if(!origin||!origin.isConnected||destroyed)return false;
    const viewport=graphPane.getBoundingClientRect(),box=origin.getBoundingClientRect();
    if(![viewport.width,viewport.height,box.width,box.height].every(n=>Number.isFinite(n)&&n>0)||![viewport.left,viewport.top,box.left,box.top].every(Number.isFinite))return false;
    camera.x+=viewport.left+viewport.width/2-(box.left+box.width/2);
    camera.y+=viewport.top+viewport.height/2-(box.top+box.height/2);paint();return true;
  }
  fit.onclick=()=>{if(!centerOrigin()){camera={x:24,y:24,k:.8};schedule();}};
  function nodeCard(node,parent,cls='rg-node') {
    const card=el('article',cls,null,parent);card.dataset.nodeId=node.id;
    card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','打开 '+node.name);
    if(node.filePath===current?.queryPath)card.classList.add('rg-origin');if(node.missing)card.classList.add('rg-missing');
    const code=node.atomCode||node.name?.match(/^ATOM@([A-Za-z0-9.+]+)\s*-/i)?.[1];
    if(code)el('small','rg-address',code,card);
    el('div','rg-node-title',code?node.name.replace(/^ATOM@[A-Za-z0-9.+]+\s*-\s*/i,''):node.name,card);
    if(node.comments?.length){const self=el('div','rg-self',null,card);el('small','rg-self-label','自指',self);for(const comment of node.comments)el('p','rg-self-text',comment.text,self);}
    card.onclick=e=>{if(!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&!win.getSelection?.()?.toString())onOpen(node);};
    card.onkeydown=e=>{if(e.key==='Enter'&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey){e.preventDefault();onOpen(node);}};
    return card;
  }
  async function renderRulesGraph(graph,token,alive,commit) {
    const staging=el('div','rg-scene rg-measuring',null,graphPane),nodeEls=new Map(),edgeEls=[];
    try {
    const fragment=doc.createDocumentFragment();
    for(let i=0;i<graph.nodes.length;i++){const n=graph.nodes[i];nodeEls.set(n.id,nodeCard(n,fragment));if(i&&i%80===0)await new Promise(r=>win.setTimeout(r,0));if(!alive()){staging.remove();return;}}
    graph.edges.forEach((e,i)=>{const label=el('div','rg-edge-label',null,fragment);if(!e.labels?.length)label.hidden=true;el('small','',String(i+1).padStart(2,'0')+' →',label);el('span','',e.labels?.join('\n')||'',label);
      label.onclick=()=>{const wire=staging.querySelector('[data-edge="'+(i+1)+'"]');wire?.classList.toggle('rg-highlight');label.classList.toggle('rg-highlight');};
      const source=e.evidence?.[0];if(source){const jump=el('button','','↗',label);jump.title='打开来源第 '+source.line+' 行';jump.onclick=event=>{event.stopPropagation();onOpen({filePath:source.filePath,line:source.line,name:'关系来源'});};}
      edgeEls.push(label);});
    staging.append(fragment);
    const sizes={nodes:{},edges:[]};
    for(const [id,e]of nodeEls)sizes.nodes[id]=e.offsetHeight;
    sizes.edges=edgeEls.map(e=>e.offsetHeight);counters.measurements++;
    const positions=layout.layout(graph,sizes,{groupByLevel:graph.groupByLevel});counters.layouts++;
    if(positions.diagnostics?.addressWarnings?.length)status.textContent+=' · '+positions.diagnostics.addressWarnings.join(' · ');
    const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',positions.width);svg.setAttribute('height',positions.height);svg.classList.add('rg-wires');
    const markerId='rg-arrow-'+token;
    const defs=doc.createElementNS(svg.namespaceURI,'defs'),marker=doc.createElementNS(svg.namespaceURI,'marker'),arrow=doc.createElementNS(svg.namespaceURI,'path');
    marker.id=markerId;for(const[k,v]of Object.entries({viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto'}))marker.setAttribute(k,v);arrow.setAttribute('d','M0 0L10 5L0 10Z');arrow.setAttribute('fill','currentColor');marker.append(arrow);defs.append(marker);svg.append(defs);
    for(const g of positions.groups){const box=el('div','rg-group',null,staging),heading=el('small','',g.label,box);heading.title=g.label;heading.style.width=Math.min(264,g.w-16)+'px';Object.assign(box.style,{left:g.x+'px',top:g.y+'px',width:g.w+'px',height:g.h+'px'});}
    for(const n of positions.nodes)Object.assign(nodeEls.get(n.id).style,{left:n.x+'px',top:n.y+'px',width:n.w+'px'});
    for(const l of positions.labels)Object.assign(edgeEls[l.edgeIndex-1].style,{left:l.x+'px',top:l.y+'px',width:l.w+'px'});
    const adjacency=new Map();
    for(const e of positions.edges){const path=doc.createElementNS(svg.namespaceURI,'polyline');path.setAttribute('points',e.points.map(p=>p.join(',')).join(' '));path.setAttribute('marker-end',`url(#${markerId})`);path.setAttribute('data-edge',String(e.index));svg.append(path);const stem=doc.createElementNS(svg.namespaceURI,'polyline');stem.setAttribute('points',e.stem.map(p=>p.join(',')).join(' '));svg.append(stem);
      const targets=[path,stem,edgeEls[e.index-1]];const highlight=on=>targets.forEach(el=>el.classList.toggle('rg-highlight',on));edgeEls[e.index-1].onclick=()=>highlight(!path.classList.contains('rg-highlight'));
      for(const id of [e.from,e.to]){if(!adjacency.has(id))adjacency.set(id,[]);adjacency.get(id).push(highlight);}
    }
    for(const [id,fns] of adjacency){const node=nodeEls.get(id);const light=on=>fns.forEach(fn=>fn(on));node.onmouseenter=()=>light(true);node.onmouseleave=()=>light(false);node.onfocus=()=>light(true);node.onblur=()=>light(false);}
    staging.prepend(svg);staging.style.width=positions.width+'px';staging.style.height=positions.height+'px';staging.dataset.width=positions.width;
    if(!graph.nodes.length)el('div','rg-empty',graph.complete?'当前笔记没有符合关系图规则的内容。集合卡内容请切换到“集合卡”。':'关系证据尚不完整，请查看上方提示。',staging);
    if(!alive()){staging.remove();return;}
    originElements.set(staging,nodeEls.get(graph.nodes.find(n=>n.filePath===graph.queryPath)?.id));
    commit(staging,positions.width,positions.height);
    } finally {if(staging!==scene)staging.remove();}
  }
  async function renderGraph(graph,token) {
    if(rendering===token)return;rendering=token;
    const mode=renderer,alive=()=>!destroyed&&token===revision&&valid()&&active==='relations'&&mode===renderer;
    const theme=mermaid.themeOf(doc),key=JSON.stringify([graph.queryPath,graph.nodes,graph.edges,groupByLevel,direction,theme,styleRevision]);
    const commit=(staging,width,height)=>{
      if(!alive())return;
      const previous=scene,cached=scenes.get(mode);
      camera={x:24,y:24,k:Math.min(.9,Math.max(.72,(graphPane.clientWidth-48)/width))};
      staging.dataset.renderer=mode;staging.dataset.width=width;staging.style.width=width+'px';staging.style.height=height+'px';
      scene=staging;graphPane.append(staging);staging.classList.remove('rg-measuring');paint();if(previous!==staging)previous?.remove();centerOrigin();
      if(cached&&cached.scene!==staging)cached.scene.remove();
      scenes.set(mode,{key,scene:staging,width,height});graphBuilt=true;renderError.hidden=true;
    };
    try {
      const cached=scenes.get(mode);if(cached?.key===key){commit(cached.scene,cached.width,cached.height);return;}
      const projection={...graph,groupByLevel};
      if(mode==='rules'||!graph.nodes.length){await renderRulesGraph(projection,token,alive,commit);return;}
      const staging=el('div','rg-scene rg-mermaid-scene rg-measuring',null,graphPane);
      try{
        const result=await mermaidService.render(projection,{doc,container:staging,isCurrent:alive,theme,groupByLevel,direction});
        if(!result||!alive())return;
        staging.replaceChildren(result.svg);counters.layouts++;
        for(const node of graph.nodes){const element=result.nodeEls.get(node.id);element.tabIndex=0;element.setAttribute('role','button');element.setAttribute('aria-label','打开 '+node.name);
          element.onclick=e=>{if(!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&!win.getSelection?.()?.toString())onOpen(node);};
          element.onkeydown=e=>{if(e.key==='Enter'&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey){e.preventDefault();onOpen(node);}};
        }
        if(result.warnings.length)status.textContent+=' · '+result.warnings.join(' · ');
        originElements.set(staging,result.nodeEls.get(graph.nodes.find(n=>n.filePath===graph.queryPath)?.id));
        commit(staging,result.width,result.height);
      }finally{if(staging!==scene)staging.remove();}
    }catch(error){if(alive()){errorText.textContent=(mode==='mermaid'?'Mermaid':'规则布局')+' 绘制未完成：'+error.message+(scene?'。原图已保留。':'。请重试或选择其他绘制方式。');renderError.hidden=false;fallback.hidden=mode==='rules';}}
    finally{if(rendering===token)rendering=-1;}
  }
  function chooseRenderer(value){renderer=value==='mermaid'?'mermaid':'rules';updateBadge();graphBuilt=false;renderError.hidden=true;const token=++revision;if(current&&active==='relations')void renderGraph(current,token);else if(current&&!collectionBuilt)void renderCollection(current,token);}
  fallback.onclick=()=>chooseRenderer('rules');
  async function renderCollection(graph,token=revision) {
    if(collectionRendering===token)return;collectionRendering=token;
    try {
    const frag=doc.createDocumentFragment();
    let count=0;
    for(const block of graph.collections) {
      const section=el('section','rg-collection-block',null,frag),heading=el('h3','',null,section);
      const source=el('button','rg-collection-source',block.sourceName,heading);source.type='button';
      source.title='打开集合卡原文 · 第 '+block.line+' 行';source.setAttribute('aria-label','打开集合卡原文：'+block.sourceName);
      source.onclick=e=>{if(!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&!win.getSelection?.()?.toString())onOpen({filePath:block.sourcePath,name:block.sourceName,line:block.line});};
      el('small','rg-address','集合卡 · '+block.members.length+' 张 · 原文第 '+block.line+' 行',section);
      const grid=el('div','rg-cards',null,section);
      for(const member of block.members){const card=nodeCard(member,grid,'rg-collection-card');
        if(member.heuristic){const intro=el('div','rg-collection-heuristic',member.heuristic.text);intro.title='启发语 · 原文第 '+member.heuristic.line+' 行';card.prepend(intro);count++;}
        const assessment=member.descriptions.length?el('div','rg-assessments',null,card):null;
        for(const d of member.descriptions){const paragraph=el('p','rg-description',d.text,assessment);paragraph.style.marginInlineStart=Math.min(8,d.depth||0)*16+'px';paragraph.dataset.depth=d.depth||0;paragraph.title='原文第 '+d.line+' 行';if(++count%40===0)await new Promise(r=>win.setTimeout(r,0));if(destroyed||token!==revision||!valid())return;}if(++count%40===0)await new Promise(r=>win.setTimeout(r,0));if(destroyed||token!==revision||!valid())return;}
      if(block.notes?.length){const notes=el('div','rg-collection-notes',null,section);el('strong','','未分配到单张卡片的说明',notes);for(const note of block.notes){el('p','rg-description','第 '+note.line+' 行 · '+note.text,notes);if(++count%40===0)await new Promise(r=>win.setTimeout(r,0));if(destroyed||token!==revision||!valid())return;}}
    }
    if(!graph.collections.length)el('div','rg-empty',graph.complete?'当前笔记没有集合卡内容。':'尚未找到集合卡，当前查询仍有未核验来源。',frag);
    if(destroyed||token!==revision||!valid())return;const scroll=collectionPane.scrollTop;collectionPane.replaceChildren(frag);collectionPane.scrollTop=scroll;collectionBuilt=true;
    } finally {if(collectionRendering===token)collectionRendering=-1;}
  }
  function select(tab) {
    if(destroyed)return;if(active!==tab&&!graphBuilt)revision++;active=tab;counters.tabSwitches++;
    relation.classList.toggle('is-active',tab==='relations');collection.classList.toggle('is-active',tab==='collection');
    graphPane.hidden=tab!=='relations';collectionPane.hidden=tab!=='collection';hint.hidden=tab!=='relations';
    if(current && tab==='collection'&&!collectionBuilt)renderCollection(current);
    if(current && tab==='relations'&&!graphBuilt)void renderGraph(current,revision);
  }
  relation.onclick=()=>select('relations');collection.onclick=()=>select('collection');select('relations');
  const invalidateStyle=()=>{styleRevision++;graphBuilt=false;mermaidService.clear();if(current&&valid()&&active==='relations')void renderGraph(current,++revision);};
  const fontsChanged=()=>{if(destroyed||fontReflows>=2)return;clearTimeout(fontTimer);fontTimer=win.setTimeout(()=>{if(!current||!valid()||destroyed)return;fontReflows++;invalidateStyle();},100);};
  let themeKey=JSON.stringify(mermaid.themeOf(doc));
  const themeObserver=new win.MutationObserver(()=>{const next=JSON.stringify(mermaid.themeOf(doc));if(next!==themeKey){themeKey=next;invalidateStyle();}});
  themeObserver.observe(doc.body,{attributes:true,attributeFilter:['class','style']});themeObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['class','style']});
  doc.fonts?.addEventListener?.('loadingdone',fontsChanged);
  return {shell,counters,
    async update(graph,options={}){valid=options.valid||(()=>true);if(!valid())return;current=graph;const graphKey=JSON.stringify([graph.queryPath,graph.nodes,graph.edges,graph.collections]);const changed=graphKey!==lastGraphKey;lastGraphKey=graphKey;const token=changed?++revision:revision;if(changed){graphBuilt=false;collectionBuilt=false;}title.textContent=graph.queryName;
      relation.textContent='关系图 '+graph.nodes.length;collection.textContent='集合卡 '+graph.collections.reduce((n,c)=>n+c.members.length,0);
      status.textContent=[options.preview?'缓存预览，正在核验':graph.complete?'正文邻域已读取':'部分证据未核验',graph.nodes.length+' 节点 · '+graph.edges.length+' 关系',graph.evaState==='ready'?'跨插件关系已读取':'跨插件关系尚未就绪',...graph.warnings].join(' · ');
      if(first){first=false;if(!graph.nodes.length&&graph.collections.length){active='collection';graphPane.hidden=true;collectionPane.hidden=false;hint.hidden=true;relation.classList.remove('is-active');collection.classList.add('is-active');}}
      if(active==='collection'){if(!collectionBuilt)await renderCollection(graph,token);}else if(!graphBuilt)await renderGraph(graph,token);
    },
    applySettings(next){const changed=renderer!==next.graphRenderer||groupByLevel!==next.groupByLevel||direction!==next.layout;groupByLevel=next.groupByLevel!==false;direction=next.layout||'LR';if(changed)chooseRenderer(next.graphRenderer);},
    status(text){status.textContent=text;},inspect(){return {active,renderer,visibleRenderer:scene?.dataset.renderer,camera:{...camera},...counters};},
    destroy(){destroyed=true;revision++;if(frame)win.cancelAnimationFrame(frame);clearTimeout(fontTimer);themeObserver.disconnect();doc.fonts?.removeEventListener?.('loadingdone',fontsChanged);win.removeEventListener('pointermove',move);win.removeEventListener('pointerup',up);win.removeEventListener('pointercancel',up);scenes.clear();shell.remove();}
  };
}
module.exports={mount};
