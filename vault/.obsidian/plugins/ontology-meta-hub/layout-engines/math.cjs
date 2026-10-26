const ELK=require('elkjs'),cola=require('webcola');
function frames(f,p){return f.groups.map(g=>{const ns=g.members.map(i=>p[i]);let x=Math.min(...ns.map(n=>n.x))-14,y=Math.min(...ns.map(n=>n.y))-42;return {...g,x,y,width:Math.max(...ns.map(n=>n.x+n.width))+14-x,height:Math.max(...ns.map(n=>n.y+n.height))+14-y};});}
const overlap=(a,b)=>a.x<b.x+b.width-1e-5&&a.x+a.width>b.x+1e-5&&a.y<b.y+b.height-1e-5&&a.y+a.height>b.y+1e-5;
function metrics(f,r){
 if(!r.positions)return {valid:false,reason:r.solverStatus||r.error};
 const p=r.positions,routes=r.routes||[],errors=[],segments=[];
 if(!Array.isArray(p)||p.length!==f.nodes.length||p.some((n,i)=>!n||n.id!==f.nodes[i].id||![n.x,n.y,n.width,n.height].every(Number.isFinite)||n.width!==f.nodes[i].width||n.height!==f.nodes[i].height||n.width<=0||n.height<=0))return {valid:false,errors:['invalid nodes/dimensions']};
 if(!Array.isArray(routes)||new Set(routes.map(v=>v.id)).size!==routes.length||routes.some(v=>!f.edges.some(e=>e.id===v.id)||!Array.isArray(v.points)||v.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))))return {valid:false,errors:['invalid route identities/points']};
 const groups=frames(f,p),approaches=[];
 let nodeCollisions=0,intrusions=0,hits=0,shared=0,crossings=0,bends=0,length=0,ports=0;
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)if(overlap(p[i],p[j]))nodeCollisions++;
 for(const g of groups)for(let i=0;i<p.length;i++)if(!g.members.includes(i)&&overlap(g,p[i]))intrusions++;
 const boundary=(a,n)=>a&&a.x>=n.x-1e-4&&a.x<=n.x+n.width+1e-4&&a.y>=n.y-1e-4&&a.y<=n.y+n.height+1e-4&&Math.min(Math.abs(a.x-n.x),Math.abs(a.x-n.x-n.width),Math.abs(a.y-n.y),Math.abs(a.y-n.y-n.height))<1e-4;
 const ends=[];
 for(const e of f.edges){const r=routes.find(r=>r.id===e.id);if(!r||r.points.length<2){errors.push('missing '+e.id);continue;}
 if(!boundary(r.points[0],p[e.from])||!boundary(r.points.at(-1),p[e.to]))errors.push('endpoint '+e.id);
 const inside=(q,n)=>q.x>n.x+1e-5&&q.x<n.x+n.width-1e-5&&q.y>n.y+1e-5&&q.y<n.y+n.height-1e-5;
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 if(inside(midpoint(r.points[0],r.points[1]),p[e.from])||inside(midpoint(r.points.at(-1),r.points.at(-2)),p[e.to]))errors.push('inward approach '+e.id);
 ends.push({id:e.from,p:r.points[0]},{id:e.to,p:r.points.at(-1)});
 for(const [a,b]of [[r.points[0],r.points[1]],[r.points.at(-1),r.points.at(-2)]]){const len=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(len<24-1e-4)errors.push('short approach '+e.id);else approaches.push({id:e.id,a,b:{x:a.x+(b.x-a.x)*24/len,y:a.y+(b.y-a.y)*24/len}});}
 bends+=r.points.length-2;
 for(let j=1;j<r.points.length;j++){const a=r.points[j-1],b=r.points[j],h=Math.abs(a.y-b.y)<1e-5,v=Math.abs(a.x-b.x)<1e-5;if(!h&&!v)errors.push('diagonal '+e.id);length+=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);segments.push({id:e.id,a,b,h});
 for(let i=0;i<p.length;i++){const n=p[i];if(h?a.y>n.y+1e-5&&a.y<n.y+n.height-1e-5&&Math.max(a.x,b.x)>n.x+1e-5&&Math.min(a.x,b.x)<n.x+n.width-1e-5:a.x>n.x+1e-5&&a.x<n.x+n.width-1e-5&&Math.max(a.y,b.y)>n.y+1e-5&&Math.min(a.y,b.y)<n.y+n.height-1e-5)hits++;}
 }}
 for(let i=0;i<ends.length;i++)for(let j=i+1;j<ends.length;j++)if(ends[i].id===ends[j].id&&Math.hypot(ends[i].p.x-ends[j].p.x,ends[i].p.y-ends[j].p.y)<12-1e-4)ports++;
 const between=(v,a,b)=>v>=Math.min(a,b)-1e-5&&v<=Math.max(a,b)+1e-5;
 for(const a of approaches)for(const b of segments){if(a.id===b.id)continue;const ah=Math.abs(a.a.y-a.b.y)<1e-5;let contact=false;if(ah===b.h){const k=ah?'x':'y',t=ah?'y':'x';contact=Math.abs(a.a[t]-b.a[t])<1e-5&&Math.min(Math.max(a.a[k],a.b[k]),Math.max(b.a[k],b.b[k]))>=Math.max(Math.min(a.a[k],a.b[k]),Math.min(b.a[k],b.b[k]))-1e-5;}else{const h=ah?a:b,v=ah?b:a;contact=between(v.a.x,h.a.x,h.b.x)&&between(h.a.y,v.a.y,v.b.y);}if(contact)errors.push('approach contact '+a.id+'/'+b.id);}
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){let a=segments[i],b=segments[j];if(a.id===b.id)continue;if(a.h===b.h){const k=a.h?'x':'y',t=a.h?'y':'x';if(Math.abs(a.a[t]-b.a[t])<1e-4)shared+=Math.max(0,Math.min(Math.max(a.a[k],a.b[k]),Math.max(b.a[k],b.b[k]))-Math.max(Math.min(a.a[k],a.b[k]),Math.min(b.a[k],b.b[k])));}else{if(!a.h)[a,b]=[b,a];if(b.a.x>Math.min(a.a.x,a.b.x)+1e-5&&b.a.x<Math.max(a.a.x,a.b.x)-1e-5&&a.a.y>Math.min(b.a.y,b.b.y)+1e-5&&a.a.y<Math.max(b.a.y,b.b.y)-1e-5)crossings++;}}
 const all=[...p,...groups].flatMap(n=>[{x:n.x,y:n.y},{x:n.x+n.width,y:n.y+n.height}]).concat(routes.flatMap(r=>r.points));
 const bounds=pts=>({x:Math.min(...pts.map(n=>n.x)),y:Math.min(...pts.map(n=>n.y)),width:Math.max(...pts.map(n=>n.x))-Math.min(...pts.map(n=>n.x)),height:Math.max(...pts.map(n=>n.y))-Math.min(...pts.map(n=>n.y))});
 const b=bounds(all),nb=bounds(p.flatMap(n=>[{x:n.x,y:n.y},{x:n.x+n.width,y:n.y+n.height}])),zoom=Math.min(1,(f.viewport.width-60)/(b.width+60),(f.viewport.height-60)/(b.height+60));
 const nodeEnvelopeCoverage=nb.width*nb.height*zoom*zoom/(f.viewport.width*f.viewport.height),aspectMatch=Math.min(nb.width/nb.height/(f.viewport.width/f.viewport.height),(f.viewport.width/f.viewport.height)/(nb.width/nb.height));
 const valid=!errors.length&&!nodeCollisions&&!intrusions&&!hits&&shared<1e-4&&!ports&&routes.length===f.edges.length;
 const occupied=new Set(p.map(n=>Math.min(3,Math.floor((n.x+n.width/2-nb.x)/nb.width*4))+','+Math.min(3,Math.floor((n.y+n.height/2-nb.y)/nb.height*4)))).size;
 return {valid,errors,nodeCollisions,groupIntrusions:intrusions,nodeHits:hits,sharedLength:Math.round(shared),portConflicts:ports,crossings,bends,length:Math.round(length),zoom:+zoom.toFixed(3),displayFontPx:+(16*zoom).toFixed(1),nodeEnvelopeCoverage:+nodeEnvelopeCoverage.toFixed(3),nodeAreaCoverage:+(p.reduce((s,n)=>s+n.width*n.height,0)*zoom*zoom/(f.viewport.width*f.viewport.height)).toFixed(3),occupiedCells4x4:occupied,aspectMatch:+aspectMatch.toFixed(3),bounds:b};
}
async function elk(f){const t=performance.now(),o=await new ELK().layout({id:'root',layoutOptions:{'elk.algorithm':'layered','elk.direction':f.viewport.width>f.viewport.height?'RIGHT':'DOWN','elk.edgeRouting':'ORTHOGONAL','elk.spacing.nodeNode':'70','elk.layered.spacing.nodeNodeBetweenLayers':'100','elk.layered.mergeEdges':'false','elk.randomSeed':'17'},children:f.nodes.map(n=>({...n})),edges:f.edges.map(e=>({id:e.id,sources:[f.nodes[e.from].id],targets:[f.nodes[e.to].id]}))});return {positions:f.nodes.map(n=>o.children.find(c=>c.id===n.id)),routes:o.edges.map(e=>({id:e.id,points:e.sections?.flatMap(s=>[s.startPoint,...(s.bendPoints||[]),s.endPoint])||[]})),placementMs:performance.now()-t,solverStatus:'HEURISTIC'};}
function webcola(f){const t=performance.now(),nodes=f.nodes.map((n,i)=>({...n,x:100+(i%4)*340,y:100+Math.floor(i/4)*220})),links=f.edges.map(e=>({source:e.from,target:e.to,length:330}));
 // Soft cohesion is deliberately NOT a claim of hard overlapping-group support.
 for(const g of f.groups)for(let a=0;a<g.members.length;a++)for(let b=a+1;b<g.members.length;b++)links.push({source:g.members[a],target:g.members[b],length:260});
 new cola.Layout().size([f.viewport.width,f.viewport.height]).nodes(nodes).links(links).avoidOverlaps(true).linkDistance(e=>e.length).start(30,30,60,0,false);
 return {positions:nodes.map(n=>({id:n.id,label:n.label,width:n.width,height:n.height,x:n.x-n.width/2,y:n.y-n.height/2})),placementMs:performance.now()-t,solverStatus:'HEURISTIC_SOFT_GROUPS'};}
async function avoid(f,r){const t=performance.now(),{AvoidLib}=await import('libavoid-js');await AvoidLib.load();const A=AvoidLib.getInstance(),router=new A.Router(2);
 router.setRoutingParameter(A.RoutingParameter.idealNudgingDistance,16);router.setRoutingParameter(A.RoutingParameter.shapeBufferDistance,12);router.setRoutingParameter(A.RoutingParameter.crossingPenalty,100);router.setRoutingParameter(A.RoutingParameter.fixedSharedPathPenalty,10000);
 for(const opt of ['nudgeOrthogonalSegmentsConnectedToShapes','penaliseOrthogonalSharedPathsAtConnEnds','nudgeOrthogonalTouchingColinearSegments','nudgeSharedPathsWithCommonEndPoint'])router.setRoutingOption(A.RoutingOption[opt],true);
 const shapes=r.positions.map(n=>new A.ShapeRef(router,new A.Rectangle(new A.Point(n.x,n.y),new A.Point(n.x+n.width,n.y+n.height))));
 const lists=r.positions.map(()=>({left:[],right:[],top:[],bottom:[]})),ends=[];
 for(const e of f.edges)for(const [i,j,key]of [[e.from,e.to,'source'],[e.to,e.from,'target']]){const n=r.positions[i],o=r.positions[j],dx=o.x+o.width/2-n.x-n.width/2,dy=o.y+o.height/2-n.y-n.height/2,side=Math.abs(dx)>=Math.abs(dy)?dx>0?'right':'left':dy>0?'bottom':'top',end={e:e.id,i,key,side};lists[i][side].push(end);ends.push(end);}
 for(let i=0;i<lists.length;i++)for(const [side,list]of Object.entries(lists[i]))list.forEach((end,k)=>{const u=(k+1)/(list.length+1),x=side==='left'?0:side==='right'?1:u,y=side==='top'?0:side==='bottom'?1:u,pinId=ends.indexOf(end)+1;new A.ShapeConnectionPin(shapes[i],pinId,x,y,true,0,{top:1,bottom:2,left:4,right:8}[side]);end.conn=new A.ConnEnd(shapes[i],pinId);});
 const conns=f.edges.map(e=>({e,c:new A.ConnRef(router,ends.find(v=>v.e===e.id&&v.key==='source').conn,ends.find(v=>v.e===e.id&&v.key==='target').conn)}));
 router.processTransaction();const routes=conns.map(({e,c})=>{const line=c.displayRoute(),points=[];for(let i=0;i<line.size();i++){const p=line.at(i);points.push({x:p.x,y:p.y});}return {id:e.id,points};});router.delete();return {...r,routes,routingMs:performance.now()-t};
}

module.exports={frames,metrics,elk,webcola,avoid};
