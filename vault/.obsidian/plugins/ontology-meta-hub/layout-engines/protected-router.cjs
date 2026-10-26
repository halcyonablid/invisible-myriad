'use strict';
// Reserve each end's approach as an obstacle for all OTHER connectors.
// Does not move nodes or relax the caller's full-path validator.
const intersects=(a,b)=>a.x<b.x+b.width-1e-5&&a.x+a.width>b.x+1e-5&&a.y<b.y+b.height-1e-5&&a.y+a.height>b.y+1e-5;
function compact(points){const out=[];for(const p of points){if(out.length&&Math.hypot(p.x-out.at(-1).x,p.y-out.at(-1).y)<1e-6)continue;while(out.length>1){const a=out.at(-2),b=out.at(-1);if(Math.abs((b.x-a.x)*(p.y-b.y)-(b.y-a.y)*(p.x-b.x))>1e-6||(b.x-a.x)*(p.x-b.x)+(b.y-a.y)*(p.y-b.y)<0)break;out.pop();}out.push(p);}return out;}
async function route(f,positions,variant=0){
 const {AvoidLib}=await import('libavoid-js');await AvoidLib.load();const A=AvoidLib.getInstance();
 const sides=['right','bottom','left','top'],dirs={top:1,bottom:2,left:4,right:8},lead=36,half=4;
 const lists=positions.map(()=>({left:[],right:[],top:[],bottom:[]})),ends=[];
 for(const e of f.edges)for(const [i,j,key]of [[e.from,e.to,'source'],[e.to,e.from,'target']]){
  const n=positions[i],other=positions[j],dx=other.x+other.width/2-n.x-n.width/2,dy=other.y+other.height/2-n.y-n.height/2;
  const horizontal=variant%2===0?Math.abs(dx)>=Math.abs(dy):Math.abs(dx)/n.width>=Math.abs(dy)/n.height;
  let side=horizontal?(dx>=0?'right':'left'):(dy>=0?'bottom':'top');
  if(i===j)side=key==='source'?'right':'top';
  if(variant>=2)side=sides[(sides.indexOf(side)+1)%4];
  const end={id:e.id,i,key,side};lists[i][side].push(end);ends.push(end);
 }
 for(let i=0;i<lists.length;i++)for(const [side,list]of Object.entries(lists[i])){
  const n=positions[i],vertical=side==='left'||side==='right';
  // Match endpoints to remote centres to reduce avoidable local crossings.
  list.sort((a,b)=>{const ea=f.edges.find(e=>e.id===a.id),eb=f.edges.find(e=>e.id===b.id);const na=positions[ea.from===i?ea.to:ea.from],nb=positions[eb.from===i?eb.to:eb.from];return (vertical?na.y-nb.y:na.x-nb.x)||a.id.localeCompare(b.id);});
  if(list.length&&(vertical?n.height:n.width)/(list.length+1)<14)return null;
  list.forEach((end,k)=>{
   const u=(k+1)/(list.length+1),point={x:side==='left'?n.x:side==='right'?n.x+n.width:n.x+n.width*u,y:side==='top'?n.y:side==='bottom'?n.y+n.height:n.y+n.height*u};
   const out={x:point.x+(side==='right'?lead:side==='left'?-lead:0),y:point.y+(side==='bottom'?lead:side==='top'?-lead:0)};
   const box=vertical?{x:Math.min(point.x,out.x),y:point.y-half,width:lead,height:half*2}:{x:point.x-half,y:Math.min(point.y,out.y),width:half*2,height:lead};
   Object.assign(end,{point,out,box});
  });
 }
 // Reject an impossible corridor assignment before constructing the router.
 for(let i=0;i<ends.length;i++){
  for(let j=0;j<positions.length;j++)if(j!==ends[i].i&&intersects(ends[i].box,positions[j]))return null;
  for(let j=0;j<i;j++)if(intersects(ends[i].box,ends[j].box))return null;
 }
 const router=new A.Router(2);
 try{
  router.setRoutingParameter(A.RoutingParameter.shapeBufferDistance,4);
  router.setRoutingParameter(A.RoutingParameter.idealNudgingDistance,16);
  router.setRoutingParameter(A.RoutingParameter.crossingPenalty,100);
  router.setRoutingParameter(A.RoutingParameter.fixedSharedPathPenalty,10000);
  for(const opt of ['nudgeOrthogonalSegmentsConnectedToShapes','penaliseOrthogonalSharedPathsAtConnEnds','nudgeOrthogonalTouchingColinearSegments','nudgeSharedPathsWithCommonEndPoint'])router.setRoutingOption(A.RoutingOption[opt],true);
  const shape=n=>new A.ShapeRef(router,new A.Rectangle(new A.Point(n.x,n.y),new A.Point(n.x+n.width,n.y+n.height)));
  positions.forEach(shape);
  ends.forEach((end,i)=>{const sh=shape(end.box),x=end.side==='left'?0:end.side==='right'?1:.5,y=end.side==='top'?0:end.side==='bottom'?1:.5;new A.ShapeConnectionPin(sh,i+1,x,y,true,0,dirs[end.side]);end.conn=new A.ConnEnd(sh,i+1);});
  const conns=f.edges.map(e=>{const a=ends.find(x=>x.id===e.id&&x.key==='source'),b=ends.find(x=>x.id===e.id&&x.key==='target');return {e,a,b,c:new A.ConnRef(router,a.conn,b.conn)};});
  router.processTransaction();
  const routes=conns.map(({e,a,b,c})=>{const line=c.displayRoute(),points=[a.point,a.out];for(let i=0;i<line.size();i++){const p=line.at(i);points.push({x:p.x,y:p.y});}points.push(b.out,b.point);return {id:e.id,points:compact(points)};});
  return {positions:positions.map(p=>({...p})),routes};
 }finally{router.delete();}
}
module.exports={route,compact};
