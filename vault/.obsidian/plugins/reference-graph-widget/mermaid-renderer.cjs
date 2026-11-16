'use strict';
// Reference owns semantics; this adapter owns only its private Mermaid and derived SVGs.
const VERSION='classic-11.13.0-rg-dual-1',MAX_BYTES=8*1024*1024,MAX_ENTRIES=8;
const collator=new Intl.Collator('en',{numeric:true});
const compare=(a,b)=>collator.compare(a,b)||(a<b?-1:a>b?1:0);
const ancestor=(a,b)=>typeof a==='string'&&!!a&&typeof b==='string'&&b.startsWith(a+'.')&&!b.slice(a.length+1).includes('+');
function escapeText(value){return String(value??'').replace(/&/g,'&amp;').replace(/#/g,'#35;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\|/g,'#124;').replace(/\r?\n/g,'<br/>');}
function themeOf(doc){
 const css=doc.defaultView.getComputedStyle(doc.body),read=(key,fallback)=>css.getPropertyValue(key).trim()||fallback;
 const dark=doc.body.classList.contains('theme-dark');
 return {dark,bg:read('--background-primary',dark?'#24272c':'#faf8f4'),secondary:read('--background-secondary',dark?'#2c3036':'#f1eee7'),text:read('--text-normal',dark?'#d9e1ec':'#25477a'),muted:read('--text-muted',dark?'#a9b6b9':'#637369'),border:read('--background-modifier-border',dark?'#535c61':'#b4c3bd'),accent:read('--text-accent',dark?'#aec6f3':'#25477a'),font:read('--font-interface','Arial, sans-serif')};
}
function generate(graph,options={}){
 const nodes=[...graph.nodes].sort((a,b)=>compare(a.atomCode||a.id,b.atomCode||b.id)||compare(a.id,b.id));
 const ids=new Map(nodes.map((n,i)=>[n.id,'n'+i])),byId=new Map(nodes.map(n=>[n.id,n]));
 const children=new Map(nodes.map(n=>[n.id,[]])),parents=new Map(),warnings=[];
 if(options.groupByLevel!==false)for(const n of nodes){let candidates=[];for(const a of nodes)if(a!==n&&ancestor(a.atomCode,n.atomCode)){if(!candidates.length||a.atomCode.length>candidates[0].atomCode.length)candidates=[a];else if(a.atomCode.length===candidates[0].atomCode.length)candidates.push(a);}if(candidates.length===1){parents.set(n.id,candidates[0].id);children.get(candidates[0].id).push(n.id);}else if(candidates.length>1)warnings.push('编号 '+candidates[0].atomCode+' 重复，未推测子代归属。');}
 const theme=options.theme||{},color=(key,fallback)=>/^#[\da-f]{3,8}$/i.test(theme[key]||'')?theme[key]:fallback;
 const dark=!!theme.dark;
 const config={theme:'base',themeVariables:{darkMode:dark,primaryColor:color('bg',dark?'#24272c':'#faf8f4'),primaryTextColor:color('text',dark?'#d9e1ec':'#25477a'),primaryBorderColor:color('border',dark?'#535c61':'#a8bdbb'),lineColor:dark?'#9cafad':'#7b938d',edgeLabelBackground:color('secondary',dark?'#2c3036':'#f1eee7'),clusterBkg:color('bg',dark?'#24272c':'#faf8f4'),clusterBorder:color('border',dark?'#535c61':'#b4c3bd'),fontFamily:'Arial, sans-serif',fontSize:'14px'},flowchart:{htmlLabels:true,useMaxWidth:false,nodeSpacing:55,rankSpacing:85,curve:'linear',padding:16,wrappingWidth:300}};
 const code=['---','config: '+JSON.stringify(config),'---','flowchart '+(['LR','TB','RL','BT'].includes(options.direction)?options.direction:'LR')];
 for(const n of nodes){const title=n.atomCode?String(n.name).replace(/^ATOM@[A-Za-z0-9.+]+\s*-\s*/i,''):n.name;
 const label=`<div class='rgm-card'>${n.atomCode?`<div class='rgm-address'>${escapeText(n.atomCode)}</div>`:''}<div class='rgm-title'>${escapeText(title)}</div>${n.comments?.length?`<div class='rgm-self'><div class='rgm-self-label'>自指</div>${n.comments.map(c=>`<div class='rgm-self-text'>${escapeText(c.text)}</div>`).join('')}</div>`:''}</div>`;
 code.push(`${ids.get(n.id)}["${label}"]`);}
 const groups=[];
 function group(id){const kids=children.get(id);if(!kids.length){code.push(ids.get(id));return;}const gid='g'+ids.get(id);groups.push({id:gid,node:id});code.push(`subgraph ${gid}["${escapeText('编号层级 · '+byId.get(id).atomCode)}"]`,ids.get(id));for(const child of kids)group(child);code.push('end');}
 for(const n of nodes)if(!parents.has(n.id))group(n.id);
 const edges=[...graph.edges].sort((a,b)=>compare(a.from,b.from)||compare(a.to,b.to)||compare(JSON.stringify(a.labels||[]),JSON.stringify(b.labels||[])));
 for(const e of edges){if(!ids.has(e.from)||!ids.has(e.to))throw Error('关系端点不在当前图中');const label=e.labels?.length?`|"<div class='rgm-relation'>${e.labels.map(escapeText).join('<br/>')}</div>"|`:'';code.push(`${ids.get(e.from)} -->${label} ${ids.get(e.to)}`);}
 for(const n of nodes){if(n.filePath===graph.queryPath)code.push(`style ${ids.get(n.id)} fill:${dark?'#493f20':'#fff1b3'},stroke:#b58a27,stroke-width:2px`);if(n.missing)code.push(`style ${ids.get(n.id)} stroke-dasharray:5 4`);}
 for(const g of groups)code.push(`style ${g.id} stroke-dasharray:5 4`);
 const source=code.join('\n');if(source.length>1000000)throw Error('当前图文字过多，请减小展开深度');
 return {code:source,ids,groups,warnings,edges,nodes};
}
function createService({loadEngine}){
 let enginePromise=null,disposed=false,serial=0,bytes=0,tail=Promise.resolve();const cache=new Map();
 const counters={engineLoads:0,renders:0,hits:0,evictions:0};
 async function engine(){if(!enginePromise){counters.engineLoads++;enginePromise=Promise.resolve().then(loadEngine).then(e=>{if(disposed)throw Error('renderer-disposed');e.initialize({startOnLoad:false,securityLevel:'strict',maxTextSize:1100000,maxEdges:1200,suppressErrorRendering:true});return e;}).catch(e=>{enginePromise=null;throw e;});}return enginePromise;}
 function put(key,item){const size=2*(key.length+item.svg.length);if(size>MAX_BYTES)return;cache.set(key,{...item,size});bytes+=size;while(cache.size>MAX_ENTRIES||bytes>MAX_BYTES){const first=cache.keys().next().value;bytes-=cache.get(first).size;cache.delete(first);counters.evictions++;}}
 async function render(graph,options){
 const {doc,container,isCurrent=()=>true}=options;if(disposed||!isCurrent())return null;
 const data=generate(graph,options),key=VERSION+'\n'+JSON.stringify(options.theme)+'\n'+data.code;
 const work=async()=>{if(disposed||!isCurrent())return null;let item=cache.get(key);
 if(item){cache.delete(key);cache.set(key,item);counters.hits++;}else{
 const renderer=await engine();if(disposed||!isCurrent())return null;
 const renderId='rgm'+Date.now().toString(36)+'_'+(++serial);counters.renders++;
 const result=await renderer.render(renderId,data.code,container);if(disposed||!isCurrent())return null;
 const svg=typeof result==='string'?result:result?.svg;if(!svg||svg.length>8*1024*1024)throw Error('Mermaid 图形无效或过大');
 item={svg,renderId};put(key,item);
 }
 if(disposed||!isCurrent())return null;
 const parsed=new doc.defaultView.DOMParser().parseFromString(item.svg,'image/svg+xml');
 const root=parsed.documentElement;if(root.localName!=='svg'||parsed.querySelector('parsererror'))throw Error('Mermaid SVG 格式无效');
 // Input never supplies executable markup; defense in depth for the derived artifact.
 const forbidden=root.querySelector('script,iframe,object,embed,image,a,animate,set');if(forbidden)throw Error('Mermaid 图形含不支持的外部内容');
 const prefix='rgmi'+(++serial)+'_',rename=new Map();for(const e of [root,...root.querySelectorAll('[id]')]){if(e.id&&!rename.has(e.id))rename.set(e.id,prefix+e.id);}
 for(const e of [root,...root.querySelectorAll('*')]){for(const attr of [...e.attributes]){if(/^on/i.test(attr.name))throw Error('Mermaid 图形含事件属性');if(/href$/i.test(attr.name)&&!attr.value.startsWith('#'))throw Error('Mermaid 图形含外部链接');let value=attr.value;if(attr.name==='id')value=rename.get(value)||value;else{value=value.replace(/url\(#([^)]*)\)/g,(all,id)=>rename.has(id)?'url(#'+rename.get(id)+')':all);if(/href$/i.test(attr.name)&&rename.has(value.slice(1)))value='#'+rename.get(value.slice(1));}if(value!==attr.value)e.setAttribute(attr.name,value);}
 if(e.localName==='style'){e.textContent=e.textContent.replaceAll('#'+item.renderId,'#'+rename.get(item.renderId));if(/@import|url\(\s*['"]?(?:https?:|data:|\/\/)/i.test(e.textContent))throw Error('Mermaid 图形含外部样式');}}
 const svg=doc.importNode(root,true),vb=(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);if(vb.length!==4||!vb.every(Number.isFinite)||vb[2]<=0||vb[3]<=0)throw Error('Mermaid 缺少有效尺寸');
 svg.setAttribute('width',String(vb[2]));svg.setAttribute('height',String(vb[3]));svg.style.maxWidth='none';
 const renderedNodes=new Map([...svg.querySelectorAll('g.node')].map(el=>[el.id.match(/flowchart-(n\d+)-/)?.[1],el]));
 const nodeEls=new Map();for(const n of data.nodes){const el=renderedNodes.get(data.ids.get(n.id));if(!el)throw Error('Mermaid 节点身份未匹配');el.dataset.nodeId=n.id;nodeEls.set(n.id,el);}
 // Classic Dagre expands one self-loop into three visible path segments.
 const expectedPaths=data.edges.reduce((total,e)=>total+(e.from===e.to?3:1),0);
 if(svg.querySelectorAll('.flowchart-link').length!==expectedPaths)throw Error('Mermaid 关系数量未匹配');
 return {svg,width:vb[2],height:vb[3],nodeEls,warnings:data.warnings};
 };
 // At most one layout at a time; superseded callers drop before engine work.
 const result=tail.then(work);tail=result.then(()=>undefined,()=>undefined);return result;
 }
 return {render,clear(){cache.clear();bytes=0;},inspect(){return {...counters,entries:cache.size,bytes};},dispose(){disposed=true;cache.clear();bytes=0;enginePromise=null;tail=Promise.resolve();}};
}
module.exports={VERSION,generate,themeOf,createService,escapeText};
