'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
const math=require('./math.cjs'),regions=require('./concave-regions.cjs');
async function compute(f){
 if(!Array.isArray(f.nodes)||!Array.isArray(f.edges)||!Array.isArray(f.groups)||!f.viewport||![f.viewport.width,f.viewport.height].every(v=>Number.isFinite(v)&&v>0&&v<=20000)||new Set(f.nodes.map(n=>n.id)).size!==f.nodes.length||f.edges.some(e=>![e.from,e.to].every(i=>Number.isInteger(i)&&i>=0&&i<f.nodes.length))||f.groups.some(g=>!Array.isArray(g.members)||!g.members.length||new Set(g.members).size!==g.members.length||g.members.some(i=>!Number.isInteger(i)||i<0||i>=f.nodes.length)))throw Error('凹形网格输入身份、成员或视野参数无效。');
 const started=performance.now(),deadline=started+17000,banned=[],diagnostics=[];
 const groups=f.groups.map((g,i)=>({id:g.id||'g'+i,members:g.members.map(i=>f.nodes[i].id)}));
 for(let attempt=0;attempt<3&&performance.now()<deadline-1000;attempt++){
  const o=spawnSync('py',['-3.12',path.join(__dirname,'concave-placement.py')],{input:JSON.stringify({...f,banned,solveSeconds:Math.min(5,(deadline-performance.now())/1000-1)}),encoding:'utf8',windowsHide:true,shell:false,timeout:Math.floor(Math.max(500,deadline-performance.now())),maxBuffer:2000000});
  if(o.status!==0)throw Error('凹形网格需要 Python 3.12 及离线组件，或本次求解超时。');
  const raw=JSON.parse(o.stdout);if(!raw.slots){diagnostics.push(raw.solverStatus);break;}banned.push(raw.slots);
  const sx=Math.max(...f.nodes.map(n=>n.width))+100,sy=Math.max(...f.nodes.map(n=>n.height))+120;
  for(const scale of [1,1.2]){
   const stepX=sx*scale,stepY=sy*scale;
   const positions=f.nodes.map((n,i)=>({...n,x:60+(raw.slots[i]%raw.cols)*stepX+32,y:60+Math.floor(raw.slots[i]/raw.cols)*stepY+48}));
   const meta={version:1,cols:raw.cols,rows:raw.rows,stepX,stepY,originX:60,originY:60,regions:raw.regions.map((cells,i)=>({id:groups[i].id,cells})),signature:regions.signature(positions,groups)};
   let contours;try{contours=regions.validate(meta,positions,groups);}catch(e){diagnostics.push(e.message);break;}
   for(let variant=-1;variant<3&&performance.now()<deadline;variant++){
    const r=variant<0?await math.avoid(f,{positions}):await require('./protected-router.cjs').route(f,positions,variant);
    if(!r)continue;
    // All original route/node safety gates remain; only the obsolete rectangle
    // membership gate is replaced by exact independently validated tile unions.
    const metrics=math.metrics({...f,groups:[]},r);
    if(metrics.valid){
     const pts=[...contours.flatMap(c=>c.points),...r.positions.flatMap(n=>[{x:n.x,y:n.y},{x:n.x+n.width,y:n.y+n.height}]),...r.routes.flatMap(e=>e.points)];
     const dx=Math.max(0,50-Math.min(...pts.map(p=>p.x))),dy=Math.max(0,50-Math.min(...pts.map(p=>p.y)));
     if(dx||dy){r.positions=r.positions.map(n=>({...n,x:n.x+dx,y:n.y+dy}));r.routes=r.routes.map(e=>({...e,points:e.points.map(p=>({x:p.x+dx,y:p.y+dy}))}));meta.originX+=dx;meta.originY+=dy;meta.signature=regions.signature(r.positions,groups);regions.validate(meta,r.positions,groups);}
     const width=Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),height=Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y));
     const zoom=Math.min(1,(f.viewport.width-60)/(width+60),(f.viewport.height-60)/(height+60));
     return {...r,groupRegions:meta,metrics:{...metrics,zoom,displayFontPx:16*zoom},pipeline:'凹形约束网格 + 避障布线',adjustments:{attempt:attempt+1,scale,variant}};
    }
    diagnostics.push(metrics.errors?.[0]||'布线检查未通过');
   }
  }
 }
 throw Error('凹形网格本次未找到合格方案（不代表全局无解）：'+diagnostics.slice(-3).join('；'));
}
module.exports={compute};
