'use strict';
const path=require('node:path'),cp=require('node:child_process');
const math=require('./math.cjs'),{conflicts}=require('./repair.cjs');
const EPS=1e-5,MAX_SEGMENTS=1200,MAX_TRIALS=12,BUDGET_MS=17000;
const strength=s=>{if(!Number.isInteger(s)||s<0||s>99)throw Error('方向分数必须是0–99整数。');return 1+3*Math.sqrt(s/99);};
function validateFixture(f){
 if(!f||!Array.isArray(f.nodes)||!f.nodes.length||f.nodes.length>60||!Array.isArray(f.edges)||f.edges.length>180||!Array.isArray(f.groups)||f.groups.length>30)throw Error('加权网格支持1–60节点、180条路径及30个非空组。');
 const ids=new Set();for(const n of f.nodes){if(!n||typeof n.id!=='string'||ids.has(n.id)||![n.width,n.height].every(v=>Number.isFinite(v)&&v>0&&v<=5000))throw Error('节点身份或尺寸无效。');ids.add(n.id);}
 const edgeIds=new Set(),pairs=new Set();for(const e of f.edges){const pair=[e.from,e.to].sort((a,b)=>a-b).join(',');if(!e||typeof e.id!=='string'||edgeIds.has(e.id)||pairs.has(pair)||![e.from,e.to].every(v=>Number.isSafeInteger(v)&&v>=0&&v<f.nodes.length))throw Error('视觉路径身份无效。');edgeIds.add(e.id);pairs.add(pair);const scores=e.scores===undefined?[50]:e.scores;if(!Array.isArray(scores)||!scores.length||scores.length>2)throw Error('方向分数不完整。');scores.forEach(strength);}
 for(const g of f.groups)if(!g||!Array.isArray(g.members)||!g.members.length||new Set(g.members).size!==g.members.length||g.members.some(i=>!Number.isSafeInteger(i)||i<0||i>=f.nodes.length))throw Error('组成员无效。');
 if(!f.viewport||![f.viewport.width,f.viewport.height].every(v=>Number.isFinite(v)&&v>60&&v<=20000))throw Error('画布尺寸无效。');
}
function weights(f){const raw=f.edges.map(e=>Math.max(...(e.scores===undefined?[50]:e.scores).map(strength))),mean=raw.length?raw.reduce((a,b)=>a+b,0)/raw.length:1;return new Map(f.edges.map((e,i)=>[e.id,raw[i]/mean]));}
function inferGrid(f,positions){
 if(!Array.isArray(positions)||positions.length!==f.nodes.length||positions.some((p,i)=>!p||p.id!==f.nodes[i].id||p.width!==f.nodes[i].width||p.height!==f.nodes[i].height||![p.x,p.y].every(v=>Number.isFinite(v)&&v>=0&&v<=20000)))return null;
 const baseX=Math.ceil(Math.max(...f.nodes.map(n=>n.width)))+100,baseY=Math.ceil(Math.max(...f.nodes.map(n=>n.height)))+120;
 const axis=k=>[...new Set(positions.map(p=>p[k]))].sort((a,b)=>a-b),xs=axis('x'),ys=axis('y');
 const gap=a=>a.length>1?Math.min(...a.slice(1).map((v,i)=>v-a[i])):Infinity;
 const inferred=Math.min(gap(xs)/baseX,gap(ys)/baseY),scale=Number.isFinite(inferred)?inferred:1;
 if(scale<1-EPS)return null;
 const stepX=baseX*scale,stepY=baseY*scale,originX=xs[0],originY=ys[0],slots=new Set(),cells=[];
 for(const p of positions){const cx=(p.x-originX)/stepX,cy=(p.y-originY)/stepY,column=Math.round(cx),row=Math.round(cy),key=column+','+row;if(Math.abs(cx-column)>EPS||Math.abs(cy-row)>EPS||slots.has(key))return null;slots.add(key);cells.push({id:p.id,column,row});}
 const columns=Math.max(...cells.map(c=>c.column))+1,rows=Math.max(...cells.map(c=>c.row))+1;
 if(columns>f.nodes.length||rows>f.nodes.length||Math.abs(columns-rows)>3)return null;
 return{version:1,columns,rows,stepX,stepY,originX,originY,cells};
}
// Full geometry scoring, fixed physical scale across all request candidates.
function quality(f,r,w=weights(f)){
 const L=Math.max(100,...f.nodes.map(n=>n.width)),segments=[],routeCosts=new Map(),nodeHeat=Array(f.nodes.length).fill(0);
 let weightedBends=0,weightedDetour=0,weightedDistance=0,weightedCrossings=0,weightedTouches=0,near=0;
 const routeMap=new Map(r.routes.map(e=>[e.id,e]));
 for(const e of f.edges){const points=routeMap.get(e.id)?.points;if(!points||points.length<2)throw Error('路径不完整，不能评分。');let length=0;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(![a.x,a.y,b.x,b.y].every(Number.isFinite))throw Error('路径数值无效。');length+=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);segments.push({id:e.id,a,b,h:Math.abs(a.y-b.y)<EPS});if(segments.length>MAX_SEGMENTS)throw Error('路径评分超过1200线段上限；保留原图。');}
  const direct=Math.abs(points[0].x-points.at(-1).x)+Math.abs(points[0].y-points.at(-1).y),detour=Math.max(0,length-direct),weight=w.get(e.id),bends=points.length-2;
  const a=r.positions[e.from],b=r.positions[e.to],distance=Math.abs(a.x+a.width/2-b.x-b.width/2)+Math.abs(a.y+a.height/2-b.y-b.height/2);
  weightedBends+=weight*bends;weightedDetour+=weight*detour/L;weightedDistance+=weight*distance/L;
  routeCosts.set(e.id,{weight,crossings:0,touches:0,detour:detour/L,bends,distance:distance/L});
 }
 const contacts=new Map(),within=(v,a,b)=>v>=Math.min(a,b)-EPS&&v<=Math.max(a,b)+EPS;
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  let a=segments[i],b=segments[j];if(a.id===b.id)continue;const pairWeight=(w.get(a.id)+w.get(b.id))/2;
  if(a.h===b.h){const k=a.h?'x':'y',t=a.h?'y':'x',gap=Math.abs(a.a[t]-b.a[t]),lo=Math.max(Math.min(a.a[k],a.b[k]),Math.min(b.a[k],b.b[k])),hi=Math.min(Math.max(a.a[k],a.b[k]),Math.max(b.a[k],b.b[k]));
   if(gap>EPS&&gap<16&&hi>lo)near+=pairWeight*(hi-lo)*(1-gap/16)/L;
   if(gap<EPS&&Math.abs(hi-lo)<EPS){const x=a.h?lo:a.a.x,y=a.h?a.a.y:lo,key=[a.id,b.id].sort().join('|')+'@'+x.toFixed(4)+','+y.toFixed(4);if(!contacts.has(key))contacts.set(key,{a:a.id,b:b.id,proper:false});}
  }else{
   if(!a.h)[a,b]=[b,a];const x=b.a.x,y=a.a.y;if(!within(x,a.a.x,a.b.x)||!within(y,b.a.y,b.b.y))continue;
   const proper=x>Math.min(a.a.x,a.b.x)+EPS&&x<Math.max(a.a.x,a.b.x)-EPS&&y>Math.min(b.a.y,b.b.y)+EPS&&y<Math.max(b.a.y,b.b.y)-EPS,key=[a.id,b.id].sort().join('|')+'@'+x.toFixed(4)+','+y.toFixed(4);
   if(!contacts.has(key)||proper)contacts.set(key,{a:a.id,b:b.id,proper});
  }
 }
 let touches=0,crossings=0;for(const c of contacts.values()){const value=(w.get(c.a)+w.get(c.b))/2;if(c.proper){weightedCrossings+=value;crossings++;}else{weightedTouches+=value;touches++;}for(const id of[c.a,c.b])routeCosts.get(id)[c.proper?'crossings':'touches']++;}
 for(const e of f.edges){const c=routeCosts.get(e.id),heat=c.weight*(6*(c.crossings+c.touches)+2*c.detour+.15*c.bends);nodeHeat[e.from]+=heat;nodeHeat[e.to]+=heat;}
 const objective=(6*(weightedCrossings+weightedTouches)+2*weightedDetour+.4*near+.15*weightedBends+.05*weightedDistance)/Math.max(1,f.edges.length);
 return{objective,crossings,touches,weightedCrossings,weightedTouches,weightedDetour,weightedBends,weightedDistance,weightedNearParallel:near,scale:L,nodeHeat,perPath:Object.fromEntries(routeCosts)};
}
function evaluate(f,r,w){
 if(!r||!Array.isArray(r.routes)||r.routes.some(v=>!Array.isArray(v.points))||r.routes.reduce((s,v)=>s+v.points.length,0)>MAX_SEGMENTS+f.edges.length)return null;
 const grid=inferGrid(f,r.positions);if(!grid)return null;
 const metrics=math.metrics(f,r);if(!metrics.valid)return null;
 try{return{positions:r.positions,routes:r.routes,metrics,weightedGrid:grid,quality:quality(f,r,w)};}catch(_){return null;}
}
function killTree(child){
 if(!child?.pid||child.exitCode!==null)return;
 if(process.platform==='win32'){const killer=cp.spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'});killer.on('error',()=>child.kill());killer.unref();}else child.kill('SIGKILL');
}
function runJob(job,timeoutMs){
 return new Promise((resolve,reject)=>{let done=false,timer;const child=cp.execFile(process.execPath,[path.join(__dirname,'weighted-job.cjs')],{windowsHide:true,shell:false,encoding:'utf8',maxBuffer:4000000},(error,stdout)=>{if(done)return;done=true;clearTimeout(timer);if(error)return reject(Error('几何子任务失败或输出超限。'));try{const value=JSON.parse(stdout);if(value.error)throw Error(value.error);resolve(value.result);}catch(e){reject(e);}});
  timer=setTimeout(()=>{if(done)return;done=true;killTree(child);reject(Error('几何子任务到时，保留已完成候选。'));},Math.max(1,timeoutMs));child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(job));
 });
}
const positionKey=p=>p.map(n=>n.x.toFixed(4)+','+n.y.toFixed(4)).join(';');
function candidates(f,base,w,seen,deadline){
 const grid=base.weightedGrid,out=[],order=f.nodes.map((_,i)=>i).sort((a,b)=>base.quality.nodeHeat[b]-base.quality.nodeHeat[a]||f.nodes[a].id.localeCompare(f.nodes[b].id));let checked=0;
 const proxy=p=>f.edges.reduce((s,e)=>s+w.get(e.id)*(Math.abs(p[e.from].x-p[e.to].x)+Math.abs(p[e.from].y-p[e.to].y)),0);
 const add=(p,heat)=>{if(++checked>2048||performance.now()>deadline)return false;const key=positionKey(p);if(seen.has(key))return true;const g=inferGrid(f,p);if(!g||g.columns!==grid.columns||g.rows!==grid.rows||conflicts(f,p).length)return true;out.push({positions:p,key,heat,proxy:proxy(p)});return true;};
 outer:for(let a=0;a<order.length;a++)for(let b=a+1;b<order.length;b++){const i=order[a],j=order[b],p=base.positions.map(n=>({...n}));[p[i].x,p[j].x]=[p[j].x,p[i].x];[p[i].y,p[j].y]=[p[j].y,p[i].y];if(!add(p,base.quality.nodeHeat[i]+base.quality.nodeHeat[j]))break outer;}
 const occupied=new Set(grid.cells.map(c=>c.column+','+c.row));
 outer:for(const i of order)for(let row=0;row<grid.rows;row++)for(let col=0;col<grid.columns;col++){
  if(occupied.has(col+','+row))continue;const p=base.positions.map(n=>({...n}));p[i].x=grid.originX+col*grid.stepX;p[i].y=grid.originY+row*grid.stepY;if(!add(p,base.quality.nodeHeat[i]))break outer;
 }
 const hot=[...out].sort((a,b)=>b.heat-a.heat||a.proxy-b.proxy||a.key.localeCompare(b.key)),near=[...out].sort((a,b)=>a.proxy-b.proxy||b.heat-a.heat||a.key.localeCompare(b.key));
 const mixed=[],keys=new Set();for(let i=0;i<Math.max(hot.length,near.length)&&mixed.length<8;i++)for(const entry of[hot[i],near[i]])if(entry&&!keys.has(entry.key)){keys.add(entry.key);mixed.push(entry);}
 return{entries:mixed.slice(0,8),checked,legal:out.length};
}
function better(a,b){return !b||a.quality.objective<b.quality.objective-1e-8||Math.abs(a.quality.objective-b.quality.objective)<1e-8&&(a.metrics.crossings<b.metrics.crossings||a.metrics.crossings===b.metrics.crossings&&a.metrics.length<b.metrics.length);}
async function compute(f){
 const started=performance.now(),deadline=started+BUDGET_MS;validateFixture(f);const w=weights(f),complete=[],notices=[];
 const fixture={nodes:f.nodes.map(n=>({id:n.id,width:n.width,height:n.height})),edges:f.edges.map(e=>({...e})),groups:f.groups.map(g=>({members:[...g.members]})),viewport:{...f.viewport}};
 const saved=evaluate(f,{positions:f.initial,routes:f.initialRoutes},w);if(saved){saved.source='saved';complete.push(saved);}
 let standard;try{standard=evaluate(f,await runJob({kind:'baseline',fixture},Math.min(9000,deadline-performance.now())),w);if(standard){standard.source='standard-grid';complete.push(standard);}}catch(error){notices.push(error.message);}
 if(!complete.length)throw Error('加权网格未获得完整合法基准；原图保留。'+notices.join(' '));
 const reference=standard||saved,minimumFit=reference.metrics.zoom*.95;
 let best=complete.filter(r=>r.metrics.zoom+1e-6>=minimumFit).sort((a,b)=>a.quality.objective-b.quality.objective||a.metrics.crossings-b.metrics.crossings)[0]||reference;
 const baseline=best,seen=new Set(complete.map(r=>positionKey(r.positions))),trials=[];let generationChecks=0;
 // All search branches consume the same deadline, including the baseline.
 const routingFixture={...fixture,edges:[...fixture.edges].sort((a,b)=>w.get(b.id)-w.get(a.id)||a.id.localeCompare(b.id))};
 // A changed score can favor another routing even without moving a node.
 // Insertion order is a proposal only; full weighted quality decides acceptance.
 for(const variant of[0,-1]){
  if(trials.length>=MAX_TRIALS||performance.now()+400>=deadline)break;
  const entry={kind:'seed-reroute',variant,valid:false};trials.push(entry);
  try{
   const raw=await runJob({kind:'route',fixture:routingFixture,positions:baseline.positions,variant},Math.min(2000,deadline-performance.now()-200)),candidate=evaluate(f,raw,w);
   if(!candidate)continue;Object.assign(entry,{valid:true,objective:candidate.quality.objective,crossings:candidate.metrics.crossings,fit:candidate.metrics.zoom});
   if(candidate.metrics.zoom+1e-6>=minimumFit&&better(candidate,best)){candidate.source='seed-reroute';best=candidate;}
   break;
  }catch(error){entry.reason=error.message;}
 }
 for(let round=0;round<2&&trials.length<MAX_TRIALS&&performance.now()+500<deadline;round++){
  const from=best,queue=candidates(f,from,w,seen,Math.min(deadline-300,performance.now()+600));generationChecks+=queue.checked;
  if(!queue.entries.length)break;
  for(const c of queue.entries){if(trials.length>=MAX_TRIALS||performance.now()+500>=deadline)break;seen.add(c.key);
   for(const variant of[0,-1]){
    if(trials.length>=MAX_TRIALS||performance.now()+400>=deadline)break;
    const entry={round,variant,valid:false};trials.push(entry);
    try{
     const raw=await runJob({kind:'route',fixture:routingFixture,positions:c.positions,variant},Math.min(2000,deadline-performance.now()-200)),candidate=evaluate(f,raw,w);
     if(!candidate)continue;Object.assign(entry,{valid:true,objective:candidate.quality.objective,crossings:candidate.metrics.crossings,fit:candidate.metrics.zoom});
     if(candidate.metrics.zoom+1e-6>=minimumFit&&better(candidate,best)){candidate.source='local-search';best=candidate;}
     break;
    }catch(error){entry.reason=error.message;}
   }
  }
  if(best===from)break;
 }
 const summary=r=>({objective:r.quality.objective,weightedCrossings:r.quality.weightedCrossings,weightedTouches:r.quality.weightedTouches,weightedDetour:r.quality.weightedDetour,crossings:r.metrics.crossings,touches:r.quality.touches,bends:r.metrics.bends,length:r.metrics.length,fit:r.metrics.zoom,source:r.source});
 const diagnostics={version:1,normalization:'(1+3*sqrt(score/99)); reciprocal max; visual-path mean=1',defaultScore:50,pairAggregation:'max',objectiveVersion:'clarity-v1',baseline:summary(baseline),standard:standard?summary(standard):null,result:summary(best),trials,generationChecks,elapsedMs:Math.round(performance.now()-started),budgetMs:BUDGET_MS,trialLimit:MAX_TRIALS,heuristic:true,notices,perPath:best.quality.perPath};
 return{positions:best.positions,routes:best.routes,metrics:best.metrics,weightedGrid:best.weightedGrid,weightedDiagnostics:diagnostics,pipeline:`加权约束网格 · ${best.weightedGrid.columns}列×${best.weightedGrid.rows}行 · ${trials.filter(t=>t.valid).length}个完整搜索候选 · 交叉${best.metrics.crossings} · 加权代价${baseline.quality.objective.toFixed(2)}→${best.quality.objective.toFixed(2)}（启发式）`};
}
module.exports={compute,validateFixture,strength,weights,inferGrid,quality,evaluate,candidates,better,runJob};
