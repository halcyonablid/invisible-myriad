'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const math=require('./math.cjs'),{repair,conflicts}=require('./repair.cjs');
// Translation and uniform grid expansion preserve the solved cell assignment.
function preservesGrid(positions,grid){
 if(!grid||!Array.isArray(grid.cells)||positions.length!==grid.cells.length||Math.abs(grid.columns-grid.rows)>3)return false;
 const xs=grid.cells.map(c=>c.x),ys=grid.cells.map(c=>c.y);
 if(Math.min(...xs)!==0||Math.min(...ys)!==0||Math.max(...xs)+1!==grid.columns||Math.max(...ys)+1!==grid.rows)return false;
 let scale=null;
 for(let i=1;i<positions.length;i++)for(const [axis,step]of [['x',grid.stepX],['y',grid.stepY]]){
  const cells=grid.cells[i][axis]-grid.cells[0][axis],delta=positions[i][axis]-positions[0][axis];
  if(!cells){if(Math.abs(delta)>1e-4)return false;continue;}
  const ratio=delta/(cells*step);if(!Number.isFinite(ratio)||ratio<=0)return false;
  if(scale===null)scale=ratio;else if(Math.abs(ratio-scale)>1e-6)return false;
 }
 return true;
}
async function compute(f,algorithm){
 if(algorithm==='cpsat-weighted')return require('./weighted.cjs').compute(f);
 if(algorithm==='cpsat-concave'){
  if(!f?.nodes?.length||f.nodes.length>60||f.edges.length>180||f.groups.length>30||f.nodes.some(n=>![n.width,n.height].every(v=>Number.isFinite(v)&&v>0&&v<=5000)))throw Error('图大小或尺寸超出范围。');
  return require('./concave.cjs').compute(f);
 }
 if(!['elk-native','elk-avoid','cola-avoid','cpsat-avoid'].includes(algorithm))throw Error('未知布局方案。');
 if(!f?.nodes?.length||f.nodes.length>60||f.edges.length>180||f.groups.length>30||f.nodes.some(n=>!Number.isFinite(n.width)||!Number.isFinite(n.height)||n.width<=0||n.height<=0||n.width>5000||n.height>5000))throw Error('图大小或节点尺寸超出方案范围。');
 let raw;
 if(algorithm.startsWith('elk'))raw=await math.elk(f);
 else if(algorithm==='cola-avoid')raw=math.webcola(f);
 else {const o=spawnSync('py',['-3.12',path.join(__dirname,'placement.py')],{input:JSON.stringify(f),encoding:'utf8',windowsHide:true,shell:false,timeout:15000,maxBuffer:2000000});if(o.status!==0)throw Error(o.error?.code==='ETIMEDOUT'?'Python 启动与求解超过15秒，请重试或换用其他方案。':'CP-SAT 需要 Python 3.12 和完整离线 python-deps；请检查组件安装。');raw=JSON.parse(o.stdout);if(!raw.positions)throw Error(`CP-SAT：${raw.solverStatus}（本次网格模型未得到解，非全局无解证明）。`);}
 // CP-SAT chooses both spans itself; do not transpose or repair away its grid.
 const placements=[raw.positions];
 if(algorithm==='cpsat-avoid'&&(!preservesGrid(raw.positions,raw.grid)||conflicts(f,raw.positions).length))throw Error('约束网格未通过行列跨度或分组检查；原布局保留。');
 const repaired=placements.map(positions=>algorithm==='cpsat-avoid'?{status:'UNCHANGED',candidates:[positions]}:repair(f,positions));
 const candidates=repaired.flatMap((fixed,i)=>fixed.status==='UNCHANGED'?[placements[i]]:fixed.candidates)
  .filter((positions,i,all)=>all.findIndex(other=>JSON.stringify(other.map(n=>[n.id,n.x,n.y])))===i);
 if(!candidates.length)throw Error('本次分组修正未找到无误框结果；请换一种方案。');
 const results=[];
 for(const positions of candidates){let r=algorithm==='elk-native'&&positions===placements[0]&&repaired[0].status==='UNCHANGED'?raw:await math.avoid(f,{positions});
  // Preserve all geometry while moving full projection inside positive canvas bounds.
  const pts=[...r.positions,...math.frames(f,r.positions)].map(p=>({x:p.x,y:p.y})).concat(r.routes.flatMap(e=>e.points)),dx=Math.max(0,50-Math.min(...pts.map(p=>p.x))),dy=Math.max(0,50-Math.min(...pts.map(p=>p.y)));
  r={...r,positions:r.positions.map(p=>({...p,x:p.x+dx,y:p.y+dy})),routes:r.routes.map(e=>({...e,points:e.points.map(p=>({x:p.x+dx,y:p.y+dy}))}))};
  results.push({...r,metrics:math.metrics(f,r)});
 }
 let rescued=false;
 if(!results.some(r=>r.metrics.valid)){
  const {route}=require('./protected-router.cjs'),deadline=performance.now()+5000;let attempts=0;
  // Try unchanged placement first, then open routing space without resizing nodes.
  const scales=[1,1.2,1.45];
  outer:for(const scale of scales)for(const positions of candidates.slice(0,2)){
   const p=positions.map(n=>({...n,x:n.x*scale,y:n.y*scale}));
   for(let variant=0;variant<3;variant++){
    if(attempts++>=18||performance.now()>deadline)break outer;
    const r=await route(f,p,variant);if(!r)continue;
    const pts=[...r.positions,...math.frames(f,r.positions),...r.routes.flatMap(e=>e.points)];
    const dx=Math.max(0,50-Math.min(...pts.map(p=>p.x))),dy=Math.max(0,50-Math.min(...pts.map(p=>p.y)));
    r.positions=r.positions.map(n=>({...n,x:n.x+dx,y:n.y+dy}));r.routes=r.routes.map(e=>({...e,points:e.points.map(p=>({x:p.x+dx,y:p.y+dy}))}));
    r.metrics=math.metrics(f,r);r.rescue={scale,variant,attempts};results.push(r);
    if(r.metrics.valid){rescued=true;break outer;}
   }
  }
 }
 const compare=algorithm==='cpsat-avoid'
  ?(a,b)=>b.metrics.zoom-a.metrics.zoom||b.metrics.aspectMatch-a.metrics.aspectMatch||b.metrics.nodeEnvelopeCoverage-a.metrics.nodeEnvelopeCoverage||a.metrics.crossings-b.metrics.crossings
  :(a,b)=>b.metrics.zoom-a.metrics.zoom||a.metrics.crossings-b.metrics.crossings;
 const valid=results.filter(r=>r.metrics.valid&&(algorithm!=='cpsat-avoid'||preservesGrid(r.positions,raw.grid))).sort(compare);
 if(!valid.length){const m=results[0].metrics;throw Error(`此方案未通过：误框${m.groupIntrusions}，穿节点${m.nodeHits}，共享长度${m.sharedLength}，出口冲突${m.portConflicts}；${m.errors.slice(0,4).join('；')||'请改用其他方案'}。`);}
 const repairedPlacement=repaired.some(v=>v.status!=='UNCHANGED');
 let pipeline=algorithm==='elk-native'&&repairedPlacement?'ELK + 分组修正 + libavoid':algorithm;
 if(algorithm==='cpsat-avoid')pipeline+=` + ${raw.grid.columns}列×${raw.grid.rows}行 · ${raw.solverStatus==='OPTIMAL'?'网格目标已证最优':'限时可行解'}`;
 if(rescued)pipeline+=' + 端点保护布线'+(valid[0].rescue.scale!==1?' + 间距扩展':'');
 return {...valid[0],pipeline,...algorithm==='cpsat-avoid'?{solverStatus:raw.solverStatus,grid:raw.grid,objective:raw.objective,bestBound:raw.bestBound,model:raw.model,placementMs:raw.placementMs}: {}};
}
if(require.main===module){console.log=()=>{};let data='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{data+=s;if(data.length>2000000)process.exit(2);});process.stdin.on('end',async()=>{try{const {fixture,algorithm}=JSON.parse(data);process.stdout.write(JSON.stringify(await compute(fixture,algorithm)));}catch(e){process.stdout.write(JSON.stringify({error:String(e.message).slice(0,500)}));}});}
module.exports={compute,preservesGrid};
