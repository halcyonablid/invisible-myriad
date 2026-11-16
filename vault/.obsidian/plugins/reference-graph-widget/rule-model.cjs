'use strict';
const VERSION = 'exclusive-block-v3';
const clean = s => String(s || '').replace(/\*\*|__|==/g, '').trim();
const wiki = s => [...s.matchAll(/!?\[\[([^\]]+)\]\]/g)].map(m => {
  const link = m[1].split('|')[0].trim(), at = link.indexOf('#');
  return {target: at < 0 ? link : link.slice(0, at), anchor: at < 0 ? '' : link.slice(at)};
}).filter(x => x.target);

// Classify occurrences before resolving links. A collection owns its entire list subtree.
function parseBody(raw) {
  if(String(raw||'').length>2*1024*1024)return {classificationVersion:VERSION,links:[],annotations:[],collections:[],warnings:[{line:1,reason:'正文超过 2 MiB，本次未解析；请缩小来源。'}]};
  const lines = String(raw || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const links = [], annotations = [], warnings = [], collections = [], stack = [], tokens=[];
  let yaml = lines[0]?.trim() === '---', fence = null, comment = false, block = null, member = null;
  for (let i = yaml ? 1 : 0; i < lines.length; i++) {
    let text = lines[i];
    if (yaml) { if (/^(---|\.\.\.)\s*$/.test(text)) yaml = false; continue; }
    if (fence) {const fm=text.match(/^\s*(`{3,}|~{3,})\s*$/);if(fm&&fm[1][0]===fence[0]&&fm[1].length>=fence.length)fence=null;continue;}
    let visible = '';
    while (text.length) {
      if (comment) { const end = text.indexOf('-->'); if (end < 0) break; text = text.slice(end + 3); comment = false; }
      else { const begin = text.indexOf('<!--'); if (begin < 0) { visible += text; break; } visible += text.slice(0, begin); text = text.slice(begin + 4); comment = true; }
    }
    const fm=visible.match(/^\s*(`{3,}|~{3,})/);if(fm){fence=fm[1];tokens.push({text:'',line:i+1,reset:true});continue;}
    text = visible.replace(/(`+)[\s\S]*?\1/g, '');
    if (!text.trim()) continue;
    tokens.push({text,line:i+1});
  }
  let heuristic=null,nodeIndent=null,memberIndent=null,assessmentIndents=[];
  for(let ti=0;ti<tokens.length;ti++) {
    if(tokens[ti].reset){stack.length=0;continue;}
    const {text,line}=tokens[ti],i=line-1;
    const indent = text.match(/^\s*/)[0].replace(/\t/g, '    ').length;
    const list = text.match(/^\s*(?:[-+*]|\d+[.)])\s+(.*)$/), body = list ? list[1] : text.trim();
    if (block && (indent < block.indent || (block.memberIndent > block.indent && list && indent <= block.indent) || (!list && indent <= block.indent) || /^\s*#/.test(text))) { block = null; member = null; }
    if (list && /^集合卡\s*[:：]?\s*$/.test(clean(body)) && !(block&&block.memberIndent!=null&&indent>block.memberIndent)) {
      block = {line:i+1, indent, memberIndent:null, members:[],notes:[]}; collections.push(block); member = null; heuristic=null;nodeIndent=null;memberIndent=null;assessmentIndents=[];stack.length = 0; continue;
    }
    if (block) {
      const found = wiki(body);
      if (list && block.memberIndent == null) block.memberIndent = indent;
      let nextList=null;
      if(list&&indent===block.memberIndent&&!found.length){let nextIndex=ti+1;
        while(tokens[nextIndex]){const t=tokens[nextIndex];if(t.reset){nextIndex++;continue;}const spaces=t.text.match(/^\s*/)[0].replace(/\t/g,'    ').length;if(spaces<=indent||/^\s*(?:[-+*]|\d+[.)])\s+/.test(t.text))break;nextIndex++;}
        nextList=(tokens[nextIndex]?.text||'').match(/^(\s*)(?:[-+*]|\d+[.)])\s+/);
      }
      if(list&&indent===block.memberIndent&&!found.length&&nextList&&nextList[1].replace(/\t/g,'    ').length>indent){
        heuristic={text:clean(body),line:i+1};nodeIndent=null;member=null;memberIndent=null;assessmentIndents=[];continue;
      }
      if(list&&indent===block.memberIndent&&!found.length){heuristic=null;nodeIndent=null;member=null;memberIndent=null;assessmentIndents=[];}
      if(heuristic&&!list&&!member&&nodeIndent==null&&indent>block.memberIndent){heuristic.text+='\n'+clean(body);continue;}
      if(heuristic&&list&&indent>block.memberIndent){
        if(nodeIndent==null)nodeIndent=indent;
        if(indent===nodeIndent){
          member=null;memberIndent=indent;assessmentIndents=[];
          if(found.length){member={line:i+1,links:found,heuristic:{...heuristic},descriptions:[]};block.members.push(member);if(found.length>1)warnings.push({line:i+1,reason:'集合节点含多个链接，评估保留在集合下方。'});}
          else {block.notes.push({text:clean(body),line:i+1});warnings.push({line:i+1,reason:'集合节点需要 [[双链]]，未将裸文本识别为节点。'});}
          continue;
        }
      }
      if (list && indent === block.memberIndent && found.length) {
        heuristic=null;nodeIndent=null;memberIndent=indent;assessmentIndents=[];
        member = {line:i+1, links:found, heuristic:null, descriptions:[]}; block.members.push(member);
        if(found.length>1)warnings.push({line:i+1,reason:'集合条目含多个链接，说明保留在集合下方，未分配给单张卡片。'});
      } else if (list && indent <= block.indent && indent === block.memberIndent && !found.length) {
        block = null; member = null; // a new peer list section ends the flat collection convention
      } else {
        while(assessmentIndents.length&&assessmentIndents.at(-1)>indent)assessmentIndents.pop();
        if(!assessmentIndents.length||assessmentIndents.at(-1)<indent)assessmentIndents.push(indent);
        const description={text:clean(body),line:i+1,depth:Math.min(1000,Math.max(0,assessmentIndents.length-1))};
        if(member&&indent>memberIndent)(member.links.length===1?member.descriptions:block.notes).push(description);
        else block.notes.push(description);
        continue;
      }
      if (block) continue;
    }
    if (indent >= 4 && !list && !stack.length) continue;
    const found = wiki(text); for (const x of found) links.push({...x,line:i+1});
    if (!list) { if (!indent || /^\s*#/.test(text)) stack.length = 0; continue; }
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();
    const field = clean(body).match(/^(关系|自指)\s*[:：]\s*(.*)$/);
    if (field) {
      const parent = stack.at(-1);
      if (parent?.links.length === 1) annotations.push({target:parent.links[0].target, kind:field[1], text:clean(field[2]), line:i+1, referenceLine:parent.line});
      else if (parent?.links.length > 1) warnings.push({line:i+1,reason:'同一条目有多个引用，说明未自动归属'});
    } else stack.push({indent,links:found,line:i+1});
  }
  return {classificationVersion:VERSION,links,annotations,warnings,collections:collections.map(({line,members,notes})=>({line,members,notes}))};
}

function noteNode(file) {
  const name = file.basename || file.path.split('/').at(-1).replace(/\.(md|excalidraw)$/i,'');
  return {id:file.path,filePath:file.path,name,atomCode:name.match(/^ATOM@([A-Za-z0-9.+]+)\s*-/i)?.[1]||'',comments:[]};
}
function activeEva(api,file) {
  if (!api?.buildJumpNodeKey || !api?.getNodeRecord || !file.stat?.ctime) return null;
  const nodeKey=api.buildJumpNodeKey({viewType:'eva-note',notePath:'__vault_atom_notes__',scopeType:'note',scopeId:'ctime:'+file.stat.ctime,itemId:'file'});
  const record=api.getNodeRecord(nodeKey); if(!record) return null;
  const field=k=>String(record.metaFields?.find(f=>String(f.key||f.label||f.name).toLowerCase()===k)?.value||'');
  return (field('path')||record.pathLabel)===file.path && Number(field('ctime'))===file.stat.ctime ? {nodeKey,record}:null;
}

async function build({app,activeFile,session,settings={},eva,isCurrent=()=>true,limits={}}) {
  const start=Date.now(),epoch=session.epoch,nodes=new Map(),edges=new Map(),parsed=new Map(),warnings=new Set(),collections=[];
  const maxSources=limits.sources||600,maxNodes=limits.nodes||400,maxEdges=limits.edges||1000,maxMs=limits.ms||5000;
  const maxDepth=Math.min(20,Math.max(1,Number(settings.maxDepth)||7)); let reads=0,complete=true,steps=0,memberCount=0,descriptionChars=0,descriptionCount=0;
  const maxMembers=limits.members||300,maxDescriptionChars=limits.descriptionChars||300000;
  const check=()=>{if(!isCurrent()||epoch!==session.epoch) throw Error('reference-source-changed');};
  const warn=s=>{complete=false;warnings.add(s);};
  async function yieldUI(){check();if(++steps%12===0)await new Promise(r=>setTimeout(r,0));check();}
  function budget(){if(reads>=maxSources||nodes.size>=maxNodes||edges.size>=maxEdges||Date.now()-start>maxMs){warn('邻域较大，已到本次查询预算；当前显示部分证据。');return false;}return true;}
  const resolve=(target,path)=>app.metadataCache.getFirstLinkpathDest(target,path);
  async function body(file){
    if(parsed.has(file.path)) return parsed.get(file.path);
    if(!budget()) return null; reads++; await yieldUI();
    try {const data=await session.parsed(file,'body',parseBody);check();parsed.set(file.path,data);for(const w of data.warnings)warn(file.path+':'+w.line+' '+w.reason);return data;}
    catch(e){check();warn('部分笔记读取失败：'+file.path);return null;}
  }
  function targetNode(link,source) {
    const file=resolve(link.target,source);
    if(file?.stat && /\.(md|excalidraw)$/i.test(file.path))return {...noteNode(file),anchor:link.anchor||''};
    warn('存在未解析引用；不读取旧 EVA JSON 补造缺失文件。');
    return {id:'missing:'+source+'::'+link.target,name:link.target,filePath:'',anchor:link.anchor||'',comments:[],missing:true};
  }
  function addEdge(source,link,data) {
    const from=noteNode(source),to=targetNode(link,source.path),key=JSON.stringify([from.id,to.id]);
    if(!edges.has(key) && edges.size>=maxEdges){warn('关系数量达到本次预算。');return;}
    if((!nodes.has(from.id)||!nodes.has(to.id)) && nodes.size>=maxNodes){warn('节点数量达到本次预算。');return;}
    if(!nodes.has(from.id)) nodes.set(from.id,from); if(!nodes.has(to.id))nodes.set(to.id,to);
    if(to.anchor && !nodes.get(to.id).anchor)nodes.get(to.id).anchor=to.anchor;
    if(!edges.has(key))edges.set(key,{from:from.id,to:to.id,type:'reference',labels:[],evidence:[]});
    const edge=edges.get(key);
    for(const a of data.annotations.filter(a=>a.referenceLine===link.line && a.target===link.target)) {
      if(a.kind==='关系') {if(!edge.evidence.some(x=>x.line===a.line)){edge.labels.push(a.text);edge.evidence.push({text:a.text,line:a.line,filePath:source.path});}}
      else {const owner=nodes.get(from.id);if(!owner.comments.some(x=>x.line===a.line))owner.comments.push({text:a.text,line:a.line,targetId:to.id});}
    }
  }
  function backlinks(file) {
    if(typeof app.metadataCache.getBacklinksForFile!=='function'){warn('反链服务尚不可用，关系查询未完整核验。');return [];}
    try {const b=app.metadataCache.getBacklinksForFile(file)?.data;if(!b){warn('反链索引尚未就绪，关系查询未完整核验。');return [];}
      return b instanceof Map ? [...b.keys()] : Object.keys(b);
    } catch(e){warn('反链查询失败，当前证据不完整。');return [];}
  }
  function addCollections(file,data,onlyContaining) {
    const takeDescriptions=items=>{const kept=[];for(const d of items){if(descriptionCount>=1000||kept.length>=200||descriptionChars+d.text.length>maxDescriptionChars){warn('集合说明达到本次预算（单卡 200 段、合计 1000 段 / '+maxDescriptionChars+' 字）；其余仍保留在原笔记。');break;}kept.push(d);descriptionCount++;descriptionChars+=d.text.length;}return kept;};
    for(const block of data?.collections||[]) {
      if(onlyContaining && !block.members.some(m=>m.links.some(l=>resolve(l.target,file.path)?.path===activeFile.path)))continue;
      const members=[];
      memberLoop:for(const m of block.members)for(const l of m.links) {
        if(memberCount>=maxMembers){warn('集合卡达到本次显示预算（最多 '+maxMembers+' 张），部分成员未显示。');break memberLoop;}
        const heuristic=m.heuristic?takeDescriptions([m.heuristic])[0]||null:null;
        members.push({...targetNode(l,file.path),line:m.line,heuristic,descriptions:takeDescriptions(m.descriptions)});memberCount++;
      }
      const notes=takeDescriptions(block.notes||[]);
      if(members.length)collections.push({id:file.path+':'+block.line,sourcePath:file.path,sourceName:noteNode(file).name,line:block.line,members,notes});
      if(memberCount>=maxMembers)break;
    }
  }
  const rootBody=await body(activeFile);addCollections(activeFile,rootBody,false);
  const queue=[{file:activeFile,depth:0}],visited=new Set();
  for(let qi=0;qi<queue.length;qi++) {
    const {file,depth}=queue[qi];if(visited.has(file.path))continue;visited.add(file.path);if(!budget())break;
    const data=await body(file);if(!data)continue;
    for(const w of data.warnings)warn(file.path+':'+w.line+' '+w.reason);
    if(depth<maxDepth)for(const link of data.links){if(!budget())break;addEdge(file,link,data);const dest=resolve(link.target,file.path);if(dest?.stat&&/\.(md|excalidraw)$/i.test(dest.path)&&!visited.has(dest.path))queue.push({file:dest,depth:depth+1});}
    if(depth>=maxDepth)continue;
    for(const path of backlinks(file)) {
      if(!budget())break; const source=app.vault.getAbstractFileByPath(path);if(!source?.stat||! /\.(md|excalidraw)$/i.test(path))continue;
      const other=await body(source);if(!other)continue;
      if(depth===0 && source.path!==activeFile.path)addCollections(source,other,true);
      const matches=other.links.filter(l=>resolve(l.target,path)?.path===file.path);
      for(const l of matches)addEdge(source,l,other);
      if(matches.length&&!visited.has(path))queue.push({file:source,depth:depth+1});
    }
  }
  let evaState='unavailable',activeNodeKey='';
  try {
    const active=activeEva(eva,activeFile);
    if(active && eva?.getNodeRelationSnapshot) {
      const snap=eva.getNodeRelationSnapshot(active.nodeKey);activeNodeKey=active.nodeKey;
      if(snap) {
        evaState='ready';
        const endpoint=(key,record)=>{
          if(key===active.nodeKey){const n=noteNode(activeFile);if(!nodes.has(n.id))nodes.set(n.id,n);return n.id;}
          if(!key)return null;
          record=record||eva.getNodeRecord?.(key)||{};
          if(String(key).startsWith('jump:v1:eva-note|')) {
            const field=k=>String(record.metaFields?.find(f=>String(f.key||f.label||f.name).toLowerCase()===k)?.value||'');
            const file=app.vault.getAbstractFileByPath(field('path')||record.pathLabel||'');
            if(file?.stat && /\.(md|excalidraw)$/i.test(file.path) && Number(field('ctime'))===file.stat.ctime && activeEva(eva,file)?.nodeKey===key) {
              const n=noteNode(file);if(!nodes.has(n.id))nodes.set(n.id,n);return n.id;
            }
          }
          // Business entries retain owner identity even when they contain a path field.
          if(!nodes.has(key))nodes.set(key,{id:key,nodeKey:key,filePath:'',name:record.label||key,comments:[]});return key;
        };
        for(const [direction,items] of [['outgoing',snap.outgoing],['incoming',snap.incoming]])for(const rel of items||[]) {
          if(!budget())break;
          const a=endpoint(active.nodeKey,active.record),b=endpoint(direction==='outgoing'?rel.targetNodeKey:rel.sourceNodeKey,direction==='outgoing'?rel.target:rel.source);if(!b)continue;
          const from=direction==='outgoing'?a:b,to=direction==='outgoing'?b:a;
          edges.set('eva:'+JSON.stringify([from,to,rel.id||'',rel.relationType||rel.type]),{from,to,type:'eva-relation',labels:[rel.relationType||rel.type||'关联'],evidence:[]});
        }
      } else evaState='not-indexed';
    }else if(eva)evaState='not-indexed';
  }catch(e){evaState='failed';warn('EVA 关系快照读取失败。');}
  check();
  return {schema:2,classificationVersion:VERSION,queryPath:activeFile.path,queryName:noteNode(activeFile).name,complete,warnings:[...warnings],evaState,activeNodeKey,
    nodes:[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id)),edges:[...edges.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),collections,
    stats:{totalNodes:nodes.size,totalEdges:edges.size,maxLevel:maxDepth,sources:reads,queryMs:Date.now()-start}};
}
module.exports={VERSION,parseBody,noteNode,activeEva,build};
