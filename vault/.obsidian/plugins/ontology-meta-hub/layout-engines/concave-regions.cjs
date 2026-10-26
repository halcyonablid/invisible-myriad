'use strict';
// Grid unions, not Bubble Sets: broad tiles, exact boundaries, no smoothing shortcuts.
const bad=s=>{throw Error('凹形组框：'+s);};
const key=(x,y)=>x+','+y;
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
function signature(nodes,groups){return JSON.stringify({nodes:nodes.map(n=>[n.id,n.x,n.y,n.width,n.height]).sort(),groups:groups.map(g=>[g.id,[...g.members].sort()]).sort()});}
function polygon(cells,cols){
 const selected=new Set(cells),edges=new Map();
 const add=(a,b)=>{const k=key(...a);if(edges.has(k))bad('边界角接触');edges.set(k,b);};
 for(const c of cells){const x=c%cols,y=Math.floor(c/cols);
  if(!selected.has(c-cols))add([x,y],[x+1,y]);
  if(x===cols-1||!selected.has(c+1))add([x+1,y],[x+1,y+1]);
  if(!selected.has(c+cols))add([x+1,y+1],[x,y+1]);
  if(x===0||!selected.has(c-1))add([x,y+1],[x,y]);
 }
 const first=edges.keys().next().value,points=[];let k=first;
 do{if(!edges.has(k)||points.length>cells.length*4)bad('边界断开');points.push(k.split(',').map(Number));const p=edges.get(k);edges.delete(k);k=key(...p);}while(k!==first);
 if(edges.size)bad('存在孔洞或不连通区域');
 const corners=points.filter((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);});
 if(corners.length>20)bad('凹口过多');return corners;
}
function validate(meta,nodes,groups){
 if(!meta||meta.version!==1||meta.signature!==signature(nodes,groups))bad('布局或成员已改变，请重新排布');
 const {cols,rows,stepX,stepY,originX,originY}=meta;
 if(![cols,rows].every(v=>Number.isInteger(v)&&v>=1&&v<=62)||cols*rows>240||![stepX,stepY,originX,originY].every(Number.isFinite)||Math.min(originX,originY)<0||Math.max(originX+cols*stepX,originY+rows*stepY)>20000)bad('网格参数无效');
 const minimum=Math.max(96,...nodes.map(n=>n.height+28));
 if(Math.min(stepX,stepY)<minimum)bad('连接宽度不足');
 if(!Array.isArray(meta.regions)||meta.regions.length!==groups.length||new Set(meta.regions.map(r=>r.id)).size!==groups.length)bad('组数据不完整');
 const tile=c=>({x:originX+(c%cols)*stepX,y:originY+Math.floor(c/cols)*stepY,width:stepX,height:stepY});
 return groups.map(group=>{
  const r=meta.regions.find(r=>r.id===group.id);
  if(!r||!Array.isArray(r.cells)||!r.cells.length||r.cells.length>240||new Set(r.cells).size!==r.cells.length||r.cells.some(c=>!Number.isInteger(c)||c<0||c>=cols*rows))bad('区域单元无效');
  const tiles=r.cells.map(tile),members=new Set(group.members),occupied=[];
  for(const n of nodes){
   if(members.has(n.id)){
    const c=r.cells.find(c=>{const t=tile(c);return n.x>=t.x+14&&n.y>=t.y+42&&n.x+n.width<=t.x+t.width-14&&n.y+n.height<=t.y+t.height-14;});
    if(c===undefined)bad('成员没有完整包含或缺少留白');occupied.push(c);
   }else if(tiles.some(t=>overlaps(t,n)))bad('包含非成员');
  }
  if(!occupied.length||r.cells.length>occupied.length*2+2||r.cells.some(c=>!occupied.some(d=>Math.abs(c%cols-d%cols)+Math.abs(Math.floor(c/cols)-Math.floor(d/cols))<=1)))bad('存在过长连接部');
  const points=polygon(r.cells,cols).map(([x,y])=>({x:originX+x*stepX,y:originY+y*stepY}));
  const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));
  const box={x,y,width:Math.max(...points.map(p=>p.x))-x,height:Math.max(...points.map(p=>p.y))-y};
  const top=tile([...occupied].sort((a,b)=>a-b)[0]);
  return {group,box,conflicts:[],points,titleBox:{x:top.x+8,y:top.y+4,width:top.width-16,height:32}};
 });
}
module.exports={signature,validate,polygon};
