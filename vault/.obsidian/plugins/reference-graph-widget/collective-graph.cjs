'use strict';
// Read-only Markdown projection. The cache owns geometry only, never note content.
const VERSION = 1;
function clean(value) { return String(value || '').replace(/\*\*|__|==/g, '').trim(); }
function parseBody(raw) {
  const lines = String(raw || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const links = [], annotations = [], warnings = [], stack = [];
  let yaml = lines[0]?.trim() === '---', fence = null, comment = false;
  for (let i = yaml ? 1 : 0; i < lines.length; i++) {
    let text = lines[i];
    if (yaml) { if (/^(---|\.\.\.)\s*$/.test(text)) yaml = false; continue; }
    const fm = text.match(/^\s*(`{3,}|~{3,})/);
    if (fm) { if (!fence) fence = fm[1]; else if (fm[1][0] === fence[0] && fm[1].length >= fence.length) fence = null; stack.length = 0; continue; }
    if (fence) continue;
    // Remove multiline comments without letting their list structure bind a field.
    let visible = '';
    while (text.length) {
      if (comment) { const end = text.indexOf('-->'); if (end < 0) { text = ''; break; } text = text.slice(end + 3); comment = false; }
      else { const begin = text.indexOf('<!--'); if (begin < 0) { visible += text; break; } visible += text.slice(0, begin); text = text.slice(begin + 4); comment = true; }
    }
    text = visible.replace(/(`+)[\s\S]*?\1/g, '');
    if (!text.trim()) continue;
    const indent = (text.match(/^\s*/)[0] || '').replace(/\t/g, '    ').length;
    const list = text.match(/^\s*(?:[-+*]|\d+[.)])\s+(.*)$/);
    if (indent >= 4 && !list && !stack.length) continue;
    for (const m of text.matchAll(/!?\[\[([^\]]+)\]\]/g)) { const target=m[1].split('|')[0].split('#')[0].trim(); if(target) links.push({target,line:i+1}); }
    if (!list) { if (indent === 0 || /^\s*#/.test(text)) stack.length = 0; continue; }
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();
    const body = list[1];
    const found = [...body.matchAll(/!?\[\[([^\]]+)\]\]/g)].map(m => m[1].split('|')[0].split('#')[0].trim()).filter(Boolean);
    const field = clean(body).match(/^(关系|自指)\s*[:：]\s*(.*)$/);
    if (field) {
      const entry = stack.at(-1);
      if (entry && entry.targets.length === 1) annotations.push({ target: entry.targets[0], kind: field[1], text: clean(field[2]), line: i + 1, referenceLine: entry.line });
      else if (entry?.targets.length > 1) warnings.push({ line: i + 1, reason: '同一条目含多个引用，说明未自动归属' });
      // Links in annotation values remain ordinary references, without making them a new owner.
    } else stack.push({ indent, targets: found, line: i + 1 });
  }
  // Ordinary paragraph links still belong to the graph; comments/fences were excluded above.
  // Parse non-list lines in the same lexer by a second projection of marked list-free text.
  return { links, annotations, warnings };
}
function atom(node) { return String(node.atomCode || String(node.id).match(/^ATOM@(.+?)-/)?.[1] || '').trim(); }
function ancestor(a, b) { return !!a && b.startsWith(a + '.') && !b.slice(a.length + 1).includes('+'); }
function enrich(graph, sources) {
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const refs = new Map(), edges = [];
  for (const edge of graph.edges) {
    if (!byId.has(edge.from) || !byId.has(edge.to)) continue;
    if (edge.type === 'address-tree') continue;
    if (edge.type === 'eva-relation') { edges.push({ ...edge, labels: [edge.relationType || 'EVA'] }); continue; }
    const key = JSON.stringify([edge.from, edge.to]);
    if (!refs.has(key)) { const e = { from: edge.from, to: edge.to, type: 'reference', labels: [], evidence: [] }; refs.set(key, e); edges.push(e); }
  }
  for (const node of graph.nodes) {
    node.comments = []; node.annotationWarnings = [];
    const source = sources.get(node.filePath);
    if (!source) continue;
    node.annotationWarnings.push(...source.warnings);
    for (const a of source.annotations) {
      if (!a.targetId || !a.text) continue;
      if (a.kind === '自指') node.comments.push({ text: a.text, targetId: a.targetId, line: a.line });
      else { const edge = refs.get(JSON.stringify([node.id, a.targetId])); if (edge) { if (!edge.labels.includes(a.text)) edge.labels.push(a.text); edge.evidence.push({ text: a.text, line: a.line, filePath: node.filePath }); } }
    }
  }
  graph.edges = edges.sort((a,b) => JSON.stringify([a.from,a.to,a.type,a.relationId || '']).localeCompare(JSON.stringify([b.from,b.to,b.type,b.relationId || '']))).map((e,i) => ({ ...e, semanticId: 'e' + i }));
  graph.stats.totalEdges = graph.edges.length;
  return graph;
}
function projection(graph, groupByLevel = true) {
  const compare = (a,b) => a < b ? -1 : a > b ? 1 : 0;
  const nodes = [...graph.nodes].sort((a,b)=>compare(JSON.stringify([a.id,a.filePath||'',a.nodeKey||'']),JSON.stringify([b.id,b.filePath||'',b.nodeKey||'']))).map((n,i) => ({ id: 'n' + i, sourceId: n.id, name: n.name, filePath: n.filePath || '', nodeKey: n.nodeKey || '', atomCode: atom(n), comments: n.comments || [], warnings: n.annotationWarnings || [] }));
  const index = new Map(nodes.map((n,i) => [n.sourceId,i]));
  const groups = [];
  if (groupByLevel) for (const n of nodes) {
    if (!n.atomCode || nodes.filter(m => m.atomCode === n.atomCode).length !== 1) continue;
    const members = nodes.map((m,i) => m.id === n.id || ancestor(n.atomCode,m.atomCode) ? i : -1).filter(i => i >= 0);
    if (members.length > 1) groups.push({ id: 'g' + n.id, label: 'ATOM ' + n.atomCode, members });
  }
  const paths = new Map();
  const orderedEdges = graph.edges.map(({semanticId, ...e})=>e).sort((a,b)=>compare(JSON.stringify(a),JSON.stringify(b)));
  for (const e of orderedEdges) {
    const from = index.get(e.from), to = index.get(e.to);
    if (from === undefined || to === undefined) continue;
    const pair = [from,to].sort((a,b)=>a-b), key = pair.join(':');
    if (!paths.has(key)) paths.set(key,{ id:'p' + paths.size, from:pair[0], to:pair[1], scores:[50], semantics:[] });
    paths.get(key).semantics.push({ ...e, from, to });
  }
  const edges = [...paths.values()].sort((a,b)=>a.from-b.from||a.to-b.to).map((e,i)=>({...e,id:'p'+i}));
  return { version:VERSION, nodes, groups, edges, viewport:{width:1200,height:800} };
}
const wrap = (s,n) => { const chars=Array.from(String(s || '')); const out=[]; while(chars.length) out.push(chars.splice(0,n).join('')); return out.length ? out : ['']; };
function fixture(p) {
  return { nodes:p.nodes.map(n => ({ id:n.id, width:320, height:Math.max(90, 32 + wrap(n.name,22).length*20 + Math.min(3, n.comments.length)*24) })), groups:p.groups.map(({id,members})=>({id,members})), edges:p.edges.map(({id,from,to,scores})=>({id,from,to,scores})), viewport:p.viewport };
}
function boxes(f,r) { return f.groups.map(g => { const ns=g.members.map(i=>r.positions[i]); const x=Math.min(...ns.map(n=>n.x))-14,y=Math.min(...ns.map(n=>n.y))-42; return {...g,x,y,width:Math.max(...ns.map(n=>n.x+n.width))+14-x,height:Math.max(...ns.map(n=>n.y+n.height))+14-y}; }); }
function overlap(a,b) { return a.x < b.x+b.width-1e-5 && a.x+a.width > b.x+1e-5 && a.y < b.y+b.height-1e-5 && a.y+a.height > b.y+1e-5; }
function validate(f,r) {
  const fail = message => { throw Error('布局校验：' + message); };
  if (!r || !Array.isArray(r.positions) || r.positions.length !== f.nodes.length) fail('节点数量');
  const p=r.positions;
  p.forEach((n,i)=>{const expected=f.nodes[i]; if(n.id!==expected.id || n.width!==expected.width || n.height!==expected.height || ![n.x,n.y,n.width,n.height].every(v=>Number.isFinite(v)&&v>=0&&v<200000)) fail('节点身份/尺寸');});
  const grid=r.weightedGrid;
  if (!grid || grid.version!==1 || !Array.isArray(grid.cells) || grid.cells.length!==p.length || ![grid.columns,grid.rows].every(v=>Number.isSafeInteger(v)&&v>0&&v<=p.length) || Math.abs(grid.columns-grid.rows)>3) fail('网格证书');
  if (![grid.originX,grid.originY,grid.stepX,grid.stepY].every(Number.isFinite) || grid.stepX < Math.max(...p.map(n=>n.width))+100 || grid.stepY < Math.max(...p.map(n=>n.height))+120) fail('网格间距');
  if(grid.originX<0||grid.originY<0||Math.abs(grid.stepX/(Math.ceil(Math.max(...p.map(n=>n.width)))+100)-grid.stepY/(Math.ceil(Math.max(...p.map(n=>n.height)))+120))>1e-6)fail('网格缩放');
  const slots=new Set(), ids=new Set();
  for(const c of grid.cells) { const n=p.find(n=>n.id===c.id); const k=c.column+','+c.row; if(!n||ids.has(c.id)||slots.has(k)||![c.column,c.row].every(Number.isSafeInteger)||c.column<0||c.row<0||c.column>=grid.columns||c.row>=grid.rows||Math.abs(n.x-grid.originX-c.column*grid.stepX)>1e-4||Math.abs(n.y-grid.originY-c.row*grid.stepY)>1e-4)fail('格位'); slots.add(k);ids.add(c.id); }
  if(Math.min(...grid.cells.map(c=>c.column))!==0||Math.min(...grid.cells.map(c=>c.row))!==0||Math.max(...grid.cells.map(c=>c.column))+1!==grid.columns||Math.max(...grid.cells.map(c=>c.row))+1!==grid.rows)fail('网格跨度');
  for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)if(overlap(p[i],p[j]))fail('节点重叠');
  for(const g of boxes(f,r))for(let i=0;i<p.length;i++)if(!g.members.includes(i)&&overlap(g,p[i]))fail('分组误框');
  if(!Array.isArray(r.routes)||r.routes.length!==f.edges.length||new Set(r.routes.map(e=>e.id)).size!==f.edges.length)fail('路径身份');
  const segments=[],approaches=[];
  const boundary=(q,n)=>q.x>=n.x-1e-4&&q.x<=n.x+n.width+1e-4&&q.y>=n.y-1e-4&&q.y<=n.y+n.height+1e-4&&Math.min(Math.abs(q.x-n.x),Math.abs(q.x-n.x-n.width),Math.abs(q.y-n.y),Math.abs(q.y-n.y-n.height))<1e-4;
  let total=0;
  for(const route of r.routes){const e=f.edges.find(e=>e.id===route.id),ps=route.points; if(!e||!Array.isArray(ps)||ps.length<2||(total+=ps.length)>20000||ps.some(q=>![q.x,q.y].every(v=>Number.isFinite(v)&&Math.abs(v)<200000)))fail('路径点');
    if(!boundary(ps[0],p[e.from])||!boundary(ps.at(-1),p[e.to]))fail('端点');
    for(let j=1;j<ps.length;j++){const a=ps[j-1],b=ps[j],h=Math.abs(a.y-b.y)<1e-5; if(!h&&Math.abs(a.x-b.x)>1e-5)fail('非直角路径');
      for(const n of p)if(h?a.y>n.y+1e-5&&a.y<n.y+n.height-1e-5&&Math.max(a.x,b.x)>n.x+1e-5&&Math.min(a.x,b.x)<n.x+n.width-1e-5:a.x>n.x+1e-5&&a.x<n.x+n.width-1e-5&&Math.max(a.y,b.y)>n.y+1e-5&&Math.min(a.y,b.y)<n.y+n.height-1e-5)fail('穿过卡片');
      segments.push({a,b,h,id:e.id});
    }
    for(const [a,b] of [[ps[0],ps[1]],[ps.at(-1),ps.at(-2)]]){const len=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(len<24-1e-4)fail('端口净距');approaches.push({a,b:{x:a.x+(b.x-a.x)*24/len,y:a.y+(b.y-a.y)*24/len},h:Math.abs(a.y-b.y)<1e-5,id:e.id});}
  }
  const touches=(a,b)=>{if(a.h===b.h){const k=a.h?'x':'y',t=a.h?'y':'x';return Math.abs(a.a[t]-b.a[t])<1e-5&&Math.min(Math.max(a.a[k],a.b[k]),Math.max(b.a[k],b.b[k]))>=Math.max(Math.min(a.a[k],a.b[k]),Math.min(b.a[k],b.b[k]))-1e-5;}const h=a.h?a:b,v=a.h?b:a;return v.a.x>=Math.min(h.a.x,h.b.x)-1e-5&&v.a.x<=Math.max(h.a.x,h.b.x)+1e-5&&h.a.y>=Math.min(v.a.y,v.b.y)-1e-5&&h.a.y<=Math.max(v.a.y,v.b.y)+1e-5;};
  for(const a of approaches)for(const b of segments)if(a.id!==b.id&&touches(a,b))fail('端口冲突');
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){const a=segments[i],b=segments[j];if(a.id===b.id||a.h!==b.h)continue;const k=a.h?'x':'y',t=a.h?'y':'x';if(Math.abs(a.a[t]-b.a[t])<1e-5&&Math.min(Math.max(a.a[k],a.b[k]),Math.max(b.a[k],b.b[k]))>Math.max(Math.min(a.a[k],a.b[k]),Math.min(b.a[k],b.b[k]))+1e-5)fail('共享线段');}
  return true;
}
function services(plugin, current) {
  const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), cp=require('node:child_process');
  const base=plugin.app.vault.adapter.getBasePath?.();
  if(!base)throw Error('约束网格及缓存需要桌面本地库');
  const dir=path.resolve(base,plugin.manifest.dir), root=path.join(dir,'reference-graph-layout-cache');
  if(path.relative(base,dir).startsWith('..')||path.basename(dir)!=='reference-graph-widget')throw Error('插件缓存路径无效');
  const hub=plugin.app.plugins?.getPlugin?.('ontology-meta-hub');
  const helperDir=path.resolve(base,hub?.manifest?.dir || '.obsidian/plugins/ontology-meta-hub','layout-engines');
  if(path.relative(base,helperDir).startsWith('..'))throw Error('布局组件路径无效');
  const files=['engine.cjs','weighted.cjs','weighted-job.cjs','math.cjs','repair.cjs','placement.py','protected-router.cjs'];
  const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
  let provider='unavailable';
  try { provider=hash(Buffer.concat(files.map(n=>fs.readFileSync(path.join(helperDir,n))))); }catch(_){}
  let cancel=()=>{};
  const MAX=4*1024*1024;
  async function readFile(file) { const stat=await fs.promises.stat(file); if(stat.size>MAX)throw Error('缓存超限'); const raw=await fs.promises.readFile(file);if(raw.length>MAX)throw Error('缓存超限');return JSON.parse(raw.toString('utf8')); }
  return {
    provider,
    key(p) { return hash(JSON.stringify({version:VERSION,provider,projection:p,fixture:fixture(p)})); },
    async get(key,f) { try { const value=await readFile(path.join(root,key+'.json'));if(value.version!==VERSION||value.key!==key) return null;validate(f,value.result);return value.result; }catch(_){return null;} },
    async put(key,f,result,options={}) {
      validate(f,result); if(!current())return false;
      const raw=JSON.stringify({version:VERSION,key,result:{positions:result.positions,routes:result.routes,weightedGrid:result.weightedGrid,pipeline:result.pipeline}});
      if(Buffer.byteLength(raw)>MAX)throw Error('布局缓存超过4MB，本次仅显示');
      await fs.promises.mkdir(root,{recursive:true}); if(!current())return false;
      const temp=path.join(root,'.'+key+'.'+crypto.randomUUID()+'.tmp'), dest=path.join(root,key+'.json'),lockPath=path.join(root,key+'.lock');
      let lock=null,winner=result;
      try { await fs.promises.writeFile(temp,raw,{flag:'wx'});if(!current())return false;
        if(options.replace){
          try{lock=await fs.promises.open(lockPath,'wx');}catch(e){if(e.code==='EEXIST')throw Error('另一窗口正在保存，本次布局暂未保存');throw e;}
          try{const old=await readFile(dest);if(old.version!==VERSION||old.key!==key)throw Error('已有缓存版本或身份不同，保留原文件');}catch(e){if(e.code!=='ENOENT')throw e;}
          if(!current())return false;
          await fs.promises.rename(temp,dest);
        }else{
          try { await fs.promises.link(temp,dest); }catch(e){if(e.code!=='EEXIST')throw e; const old=await readFile(dest);if(old.version!==VERSION||old.key!==key)throw Error('已有缓存无效，保留原文件');validate(f,old.result);winner=old.result;}
        }
      }finally { await fs.promises.unlink(temp).catch(()=>{});if(lock){await lock.close();await fs.promises.unlink(lockPath).catch(()=>{});} }
      // Content addressed files never share an index. Eviction races are benign cache misses.
      const entries=[];for(const n of await fs.promises.readdir(root)){if(!/^[a-f0-9]{64}\.json$/.test(n))continue;try{const st=await fs.promises.stat(path.join(root,n));entries.push({n,size:st.size,time:st.mtimeMs});}catch(_){}}
      entries.sort((a,b)=>b.time-a.time);let size=0;
      for(let i=0;i<entries.length;i++){size+=entries[i].size;if((i>=12||size>16*1024*1024)&&entries[i].n!==key+'.json')await fs.promises.unlink(path.join(root,entries[i].n)).catch(()=>{});}
      return winner;
    },
    solve(f) {
      if(provider==='unavailable')return Promise.reject(Error('未找到 Ontology 离线布局组件；可使用原引用图'));
      if(f.edges.some(e=>e.from===e.to))return Promise.reject(Error('当前包含自引用环，请使用原引用图查看完整关系'));
      return new Promise((resolve,reject)=>{
        let child,timer,done=false;
        const stop=()=>{if(child?.pid&&child.exitCode===null){if(process.platform==='win32'){const killer=cp.spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'});killer.on('error',()=>child.kill());}else child.kill();}};
        const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);cancel=()=>{};error?reject(error):resolve(value);};
        cancel=()=>{stop();finish(Error('布局已取消'));};
        try {child=cp.execFile('node',[path.join(helperDir,'engine.cjs')],{cwd:helperDir,windowsHide:true,shell:false,maxBuffer:MAX,encoding:'utf8'},(error,stdout)=>{if(done)return;if(error){stop();return finish(Error('离线布局失败：'+error.message));}try{const r=JSON.parse(stdout);if(r.error)throw Error(r.error);validate(f,r);finish(null,r);}catch(e){finish(e);}});
          child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({fixture:f,algorithm:'cpsat-weighted'}));timer=setTimeout(()=>{stop();finish(Error('布局超过20秒，原图保留'));},20000);
        }catch(e){stop();finish(e);}
      });
    },
    cancel(){cancel();}
  };
}

function mount(options) {
  const {document:d,container,graph,plugin,openNode,controls}=options;
  const p=projection(graph,options.groupByLevel), f=fixture(p);
  let disposed=false,job=0,service,resizeObserver,captureCamera=()=>null,applyCamera=()=>{};
  const alive=()=>!disposed&&container.isConnected;
  const el=(tag,parent,text,cls)=>{const n=d.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.appendChild(n);return n;};
  const root=el('div',container,undefined,'rg-collective'), toolbar=el('div',root,undefined,'rg-toolbar');
  const run=el('button',toolbar,'绘制／重新布局'), status=el('span',toolbar,'读取关系与自指说明');
  const relationIndex=el('button',toolbar,'全部关系 '+p.edges.reduce((n,e)=>n+e.semantics.length,0)),captionStatus=el('span',toolbar,'');
  const body=el('div',root,undefined,'rg-body'), canvas=el('div',body,undefined,'rg-canvas'), detail=el('aside',body,undefined,'rg-detail');
  const detailToggle=el('button',toolbar,'展开详情');detail.hidden=true;
  const showDetail=()=>{detail.hidden=false;detailToggle.textContent='收起详情';};
  detailToggle.onclick=()=>{detail.hidden=!detail.hidden;detailToggle.textContent=detail.hidden?'展开详情':'收起详情';};
  const style=el('style',root);style.textContent=`.rg-collective{height:100%;display:flex;flex-direction:column;color:var(--text-normal,#263238)}.rg-toolbar{display:flex;gap:12px;align-items:center;padding:8px;flex-wrap:wrap}.rg-body{display:flex;flex:1;min-height:0}.rg-canvas{flex:1;min-width:0;overflow:hidden;touch-action:none;background:var(--background-primary,#f7f5ef)}.rg-canvas svg{width:100%;height:100%;display:block}.rg-detail{width:280px;max-width:32%;padding:12px;overflow:auto;border-left:1px solid #b8b4aa;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}.rg-detail[hidden]{display:none}.rg-detail h3{font-size:15px}.rg-detail p{font-size:13px;line-height:1.6}.rg-detail button{margin:5px 0}.rg-card{cursor:pointer}.rg-label{cursor:pointer}.rg-toolbar span{font-size:12px}.rg-detail hr{border:0;border-top:1px solid #bbb}`;
  const nodeDetails=(n,reveal=true)=>{if(reveal)showDetail();detail.replaceChildren();el('h3',detail,n.name);el('p',detail,n.filePath||n.nodeKey);const button=el('button',detail,'打开笔记／条目');button.onclick=()=>openNode(n);el('h4',detail,'自指 · 本节点说明');if(!n.comments.length)el('p',detail,'尚无自指说明');for(const c of n.comments){el('p',detail,c.text);el('small',detail,'第'+c.line+'行 · 引用 '+c.targetId);}for(const w of n.warnings)el('p',detail,'第'+w.line+'行：'+w.reason);};
  const edgeDetails=e=>{showDetail();detail.replaceChildren();el('h3',detail,'关系方向');for(const s of e.semantics){el('p',detail,p.nodes[s.from].name+'\n → '+p.nodes[s.to].name);el('p',detail,(s.labels?.join('\n')||'普通引用')+(s.type==='eva-relation'?'（EVA）':''));for(const v of s.evidence||[])el('small',detail,'正文第'+v.line+'行');const b=el('button',detail,'打开来源');b.onclick=()=>openNode(p.nodes[s.from]);el('hr',detail);}};
  relationIndex.onclick=()=>{showDetail();detail.replaceChildren();el('h3',detail,'全部关系 · 按方向列出');for(const e of p.edges)for(const s of e.semantics){el('p',detail,p.nodes[s.from].name+'\n → '+p.nodes[s.to].name);el('p',detail,(s.labels?.join('\n')||'普通引用')+(s.type==='eva-relation'?'（EVA）':''));const b=el('button',detail,'查看关系详情');b.onclick=()=>edgeDetails({semantics:[s]});el('hr',detail);}};
  function draw(r){
    validate(f,r);canvas.replaceChildren();
    const ns='http://www.w3.org/2000/svg',svg=d.createElementNS(ns,'svg');canvas.appendChild(svg);
    const add=(tag,parent,attrs={},text)=>{const n=d.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;parent.appendChild(n);return n;};
    const defs=add('defs',svg),markerId='rg-arrow-'+Math.random().toString(36).slice(2);
    const mark=add('marker',defs,{id:markerId,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8,markerHeight:8,orient:'auto-start-reverse'});add('path',mark,{d:'M 0 0 L 10 5 L 0 10 z',fill:'#62635d'});
    const g=add('g',svg),frames=boxes(f,r).sort((a,b)=>b.members.length-a.members.length);
    for(const box of frames){add('rect',g,{x:box.x,y:box.y,width:box.width,height:box.height,rx:8,fill:'#dddfcc','fill-opacity':.12,stroke:'#8e9c72','stroke-dasharray':'6 4'});add('text',g,{x:box.x+8,y:box.y+17,'font-size':12,fill:'#68754c'},p.groups.find(q=>q.id===box.id).label);}
    const labelBoxes=[],labelGroups=[];
    const routeSegments=r.routes.flatMap(route=>route.points.slice(1).map((b,i)=>({a:route.points[i],b})));
    const crossesRoute=box=>routeSegments.some(({a,b})=>overlap(box,{x:Math.min(a.x,b.x)-3,y:Math.min(a.y,b.y)-3,width:Math.abs(a.x-b.x)+6,height:Math.abs(a.y-b.y)+6}));
    const right=Math.max(...r.positions.map(n=>n.x+n.width),...frames.map(n=>n.x+n.width),...r.routes.flatMap(v=>v.points.map(q=>q.x)))+60;
    let calloutY=Math.min(...r.positions.map(n=>n.y)),callouts=0;
    for(const route of r.routes){const edge=p.edges.find(e=>e.id===route.id),forward=edge.semantics.some(s=>s.from===edge.from),backward=edge.semantics.some(s=>s.from===edge.to);
      const points=route.points.map(q=>q.x+','+q.y).join(' '),line=add('polyline',g,{points,fill:'none',stroke:'#62635d','stroke-width':1.8,'stroke-dasharray':'5 3',...(forward?{'marker-end':`url(#${markerId})`}:{}),...(backward?{'marker-start':`url(#${markerId})`}:{})});
      const hit=add('polyline',g,{points,fill:'none',stroke:'transparent','stroke-width':14,cursor:'pointer'});hit.onclick=()=>edgeDetails(edge);add('title',line,{},edge.semantics.map(s=>(s.labels||[]).join(' / ')).join('\n'));
      const label=edge.semantics.flatMap(s=>s.labels||[]).filter(Boolean).join(' / ')||'引用';
      const fullLabel=label;
      let box=null,labelLines=[];const segments=route.points.slice(1).map((b,i)=>({a:route.points[i],b})).sort((u,v)=>(Math.abs(v.a.x-v.b.x)+Math.abs(v.a.y-v.b.y))-(Math.abs(u.a.x-u.b.x)+Math.abs(u.a.y-u.b.y)));
      placement: for(const {a,b}of segments){
        const horizontal=Math.abs(a.y-b.y)<1e-5;
        for(const width of [...new Set([Math.min(260,Math.max(80,Array.from(fullLabel).length*12+14)),200,140])]){
          const lines=wrap(fullLabel,Math.max(3,Math.floor((width-14)/12))),height=lines.length*16+10;
          for(const gap of [10,40,80])for(const fraction of [.5,.35,.65])for(const side of [-1,1]){
            const cx=a.x+(b.x-a.x)*fraction,cy=a.y+(b.y-a.y)*fraction;
            const candidate={x:cx-width/2+(horizontal?0:side*(width/2+gap)),y:cy-height/2+(horizontal?side*(height/2+gap):0),width,height};
            if(!crossesRoute(candidate)&&![...r.positions,...labelBoxes,...frames.map(b=>({...b,height:24}))].some(n=>overlap(candidate,n))){box=candidate;labelLines=lines;break placement;}
          }
        }
      }
      let leader=null;
      if(!box){labelLines=wrap(fullLabel,28);box={x:right,y:calloutY,width:350,height:labelLines.length*16+10};while(labelBoxes.some(other=>overlap(box,other)))box.y=Math.max(...labelBoxes.filter(other=>overlap(box,other)).map(other=>other.y+other.height))+18;calloutY=box.y+box.height+18;callouts++;
        const segment=segments[0];leader={x:(segment.a.x+segment.b.x)/2,y:(segment.a.y+segment.b.y)/2};}
      labelBoxes.push(box);labelGroups.push({box,labelLines,edge,leader});
    }
    for(let i=0;i<r.positions.length;i++){const pos=r.positions[i],n=p.nodes[i],card=add('g',g,{class:'rg-card','data-node-id':n.sourceId,tabindex:0,role:'button'});add('rect',card,{...pos,rx:8,fill:n.sourceId===options.activeId?'#fff1b8':'#f5f1e9',stroke:n.sourceId===options.activeId?'#a87d18':'#a5b2ac','stroke-width':1.5});const lines=wrap(n.name,22);lines.forEach((line,j)=>add('text',card,{x:pos.x+12,y:pos.y+24+j*20,'font-size':13,fill:'#233a66'},line));n.comments.slice(0,3).forEach((c,j)=>add('text',card,{x:pos.x+12,y:pos.y+28+lines.length*20+j*24,'font-size':12,fill:'#5a6254'},Array.from(c.text).slice(0,23).join('')+(c.text.length>23?'…':'')));add('title',card,{},n.comments.map(c=>c.text).join('\n'));card.onclick=()=>nodeDetails(n);card.ondblclick=()=>openNode(n);card.onkeydown=e=>{if(e.key==='Enter')nodeDetails(n);};}
    for(const {box,labelLines,edge,leader}of labelGroups){if(leader)add('line',g,{x1:leader.x,y1:leader.y,x2:box.x,y2:box.y+box.height/2,stroke:'#9b978e','stroke-dasharray':'3 5','pointer-events':'none'});const group=add('g',g,{class:'rg-label',tabindex:0,role:'button'});add('rect',group,{...box,rx:4,fill:'#fffdf7',stroke:'#c9c5b9'});labelLines.forEach((text,j)=>add('text',group,{x:box.x+7,y:box.y+17+j*16,'font-size':12,fill:'#374b67'},text));group.onclick=()=>edgeDetails(edge);group.onkeydown=e=>{if(e.key==='Enter')edgeDetails(edge);};}
    captionStatus.textContent=callouts?`${callouts} 条关系已完整显示于图内侧边，以引线对应`:'';
    const all=[...r.positions,...frames,...labelBoxes,...r.routes.flatMap(v=>v.points.map(q=>({...q,width:0,height:0})))];
    const minX=Math.min(...all.map(n=>n.x))-35,minY=Math.min(...all.map(n=>n.y))-35,maxX=Math.max(...all.map(n=>n.x+n.width))+35,maxY=Math.max(...all.map(n=>n.y+n.height))+35;
    // Camera uses SVG units; resize preserves its center and reading scale.
    resizeObserver?.disconnect();
    const selected=r.positions[p.nodes.findIndex(n=>n.sourceId===options.activeId)]||r.positions[0];
    let cx=selected.x+selected.width/2,cy=selected.y+selected.height/2,scale=1.15,fitMode=false;
    const prior=options.camera;
    if(prior&&[prior.cx,prior.cy,prior.scale].every(Number.isFinite)&&prior.scale>0){cx=prior.cx;cy=prior.cy;scale=prior.scale;fitMode=!!prior.fitMode;detail.hidden=!!prior.detailHidden;detailToggle.textContent=detail.hidden?'展开详情':'收起详情';}
    captureCamera=()=>({cx,cy,scale,fitMode,detailHidden:detail.hidden});
    const camera=()=>{
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
      if(fitMode){scale=Math.min(w/(maxX-minX),h/(maxY-minY));cx=(minX+maxX)/2;cy=(minY+maxY)/2;}
      svg.setAttribute('viewBox',`${cx-w/scale/2} ${cy-h/scale/2} ${w/scale} ${h/scale}`);
    };
    applyCamera=state=>{if(state&&[state.cx,state.cy,state.scale].every(Number.isFinite)&&state.scale>0){cx=state.cx;cy=state.cy;scale=state.scale;fitMode=!!state.fitMode;detail.hidden=!!state.detailHidden;detailToggle.textContent=detail.hidden?'展开详情':'收起详情';camera();}};
    const zoomBy=factor=>{fitMode=false;scale=Math.max(.1,Math.min(8,scale*factor));camera();};
    controls.in.onclick=()=>zoomBy(1.2);controls.out.onclick=()=>zoomBy(1/1.2);
    controls.reset.title='适应全图';controls.reset.onclick=()=>{fitMode=true;camera();};
    svg.onwheel=e=>{e.preventDefault();zoomBy(e.deltaY>0?.9:1.1);};
    let start=null;svg.onpointerdown=e=>{if(e.button!==0||e.target.closest('.rg-card,.rg-label'))return;fitMode=false;start={x:e.clientX,y:e.clientY,cx,cy,k:svg.viewBox.baseVal.width/Math.max(1,svg.clientWidth)};svg.setPointerCapture(e.pointerId);};
    svg.onpointermove=e=>{if(!start)return;cx=start.cx-(e.clientX-start.x)*start.k;cy=start.cy-(e.clientY-start.y)*start.k;camera();};
    svg.onpointerup=svg.onpointercancel=()=>{start=null;};
    nodeDetails(p.nodes.find(n=>n.sourceId===options.activeId)||p.nodes[0],false);
    camera();const Observer=d.defaultView?.ResizeObserver;if(Observer){resizeObserver=new Observer(camera);resizeObserver.observe(canvas);}

  }
  async function generate(force=false){const started=Date.now();const generation=++job;run.disabled=true;status.textContent='核对图形缓存…';
    try{service ||= options.services || services(plugin,alive);const key=service.key(p);let r=force?null:await service.get(key,f);if(!alive()||generation!==job)return;
      const hit=!!r;if(!r){status.textContent='约束网格计算中（最多20秒）…';r=await service.solve(f);}if(!alive()||generation!==job)return;draw(r);options.onReady?.({cacheHit:hit,layoutMs:Date.now()-started});status.textContent=hit?'已恢复保存的图 · 未重新求解':'绘制完成';
      if(!hit){try{const saved=await service.put(key,f,r,{replace:force});if(!alive()||generation!==job)return;if(saved){if(saved!==true)draw(saved);status.textContent='绘制完成 · 已保存，下次直接恢复';}}catch(e){if(alive())status.textContent='绘制完成 · 缓存未保存：'+e.message;}}
    }catch(e){if(alive()){status.textContent=e.message+'；可切换“原引用图”。';options.onReady?.({error:true,layoutMs:Date.now()-started});}}finally{if(alive()&&generation===job)run.disabled=false;}}
  run.onclick=()=>generate(true);void generate();
  return {getCamera:()=>captureCamera(),setCamera:state=>applyCamera(state),dispose(){disposed=true;job++;resizeObserver?.disconnect();service?.cancel();root.remove();},projection:p};
}
module.exports={VERSION,parseBody,ancestor,enrich,projection,fixture,boxes,validate,wrap,overlap,services,mount};
