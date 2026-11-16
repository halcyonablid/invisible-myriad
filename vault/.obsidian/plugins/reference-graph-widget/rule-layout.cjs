'use strict';
const NW=280,LW=200,PAD=20,GAP=276;
const collator=new Intl.Collator('en',{numeric:true});
function ancestor(a,b){return typeof a==='string'&&!!a&&typeof b==='string'&&b.startsWith(a+'.')&&!b.slice(a.length+1).includes('+');}
function compare(a,b){a=String(a);b=String(b);return collator.compare(a,b)||(a<b?-1:a>b?1:0);}
function layout(graph,sizes,options={}) {
  const nodes=graph.nodes.map(n=>({...n,w:NW,h:sizes.nodes[n.id]||110})).sort((a,b)=>compare(a.atomCode||a.id,b.atomCode||b.id)||compare(a.id,b.id));
  const byId=new Map(nodes.map(n=>[n.id,n])),parents=new Map(),children=new Map(nodes.map(n=>[n.id,[]])),addressWarnings=[];
  if(options.groupByLevel!==false)for(const n of nodes){let candidates=[];for(const other of nodes)if(other!==n&&ancestor(other.atomCode,n.atomCode)){if(!candidates.length||other.atomCode.length>candidates[0].atomCode.length)candidates=[other];else if(other.atomCode.length===candidates[0].atomCode.length)candidates.push(other);}if(candidates.length===1){const p=candidates[0];parents.set(n.id,p.id);children.get(p.id).push(n.id);}else if(candidates.length>1)addressWarnings.push('编号 '+candidates[0].atomCode+' 对应多个笔记，'+n.atomCode+' 未自动归组。');}
  const edges=graph.edges.map((e,i)=>({...e,index:i+1})),adj=new Map(nodes.map(n=>[n.id,new Set()]));
  for(const e of edges)if(byId.has(e.from)&&byId.has(e.to)&&e.from!==e.to)adj.get(e.from).add(e.to);
  for(const [child,parent] of parents)adj.get(parent).add(child); // invisible placement constraint, not a reference edge
  let serial=0;const indices=new Map(),low=new Map(),stack=[],active=new Set(),components=[];
  function visit(id){indices.set(id,serial);low.set(id,serial++);stack.push(id);active.add(id);for(const to of adj.get(id)){if(!indices.has(to)){visit(to);low.set(id,Math.min(low.get(id),low.get(to)));}else if(active.has(to))low.set(id,Math.min(low.get(id),indices.get(to)));}if(low.get(id)===indices.get(id)){const c=[];let v;do{v=stack.pop();active.delete(v);c.push(v);}while(v!==id);c.sort((a,b)=>ancestor(byId.get(a).atomCode,byId.get(b).atomCode)?-1:ancestor(byId.get(b).atomCode,byId.get(a).atomCode)?1:compare(byId.get(a).atomCode||a,byId.get(b).atomCode||b)||compare(a,b));components.push(c);}}
  for(const n of nodes)if(!indices.has(n.id))visit(n.id);
  // Follow a simple cycle in edge order while keeping visible address ancestors before descendants.
  for(let ci=0;ci<components.length;ci++)if(components[ci].length>1){const original=components[ci],remaining=new Set(original),ordered=[];while(remaining.size){const eligible=original.filter(id=>remaining.has(id)&&!remaining.has(parents.get(id))),previous=ordered.at(-1),next=eligible.find(id=>previous&&adj.get(previous).has(id))||eligible[0];ordered.push(next);remaining.delete(next);}components[ci]=ordered;}
  const comp=new Map();components.forEach((c,i)=>c.forEach(id=>comp.set(id,i)));const dag=components.map(()=>new Set()),incoming=components.map(()=>0),base=components.map(()=>0);
  for(const [id,targets]of adj)for(const to of targets){const a=comp.get(id),b=comp.get(to);if(a!==b&&!dag[a].has(b)){dag[a].add(b);incoming[b]++;}}
  const queue=incoming.map((v,i)=>v===0?i:null).filter(v=>v!=null);for(let i=0;i<queue.length;i++){const c=queue[i];for(const d of dag[c]){base[d]=Math.max(base[d],base[c]+components[c].length);if(--incoming[d]===0)queue.push(d);}}
  const rank=new Map();components.forEach((c,i)=>c.forEach((id,j)=>rank.set(id,base[i]+j)));
  function tree(id) {
    const n=byId.get(id),kids=children.get(id).map(tree);if(!kids.length)return {id,members:[id],height:n.h,relative:new Map([[id,0]])};
    const inside=Math.max(n.h,kids.reduce((s,k)=>s+k.height,0)+Math.max(0,kids.length-1)*32),relative=new Map([[id,PAD+18+(inside-n.h)/2]]);let y=PAD+18;
    for(const k of kids){for(const [nid,dy]of k.relative)relative.set(nid,y+dy);y+=k.height+32;}
    return {id,members:[id,...kids.flatMap(k=>k.members)],height:inside+PAD*2+18,relative};
  }
  const units=nodes.filter(n=>!parents.has(n.id)).map(n=>tree(n.id));
  for(const u of units){u.lo=Math.min(...u.members.map(id=>rank.get(id)));u.hi=Math.max(...u.members.map(id=>rank.get(id)));u.set=new Set(u.members);u.neighbors=edges.filter(e=>u.set.has(e.from)!==u.set.has(e.to)).map(e=>u.set.has(e.from)?e.to:e.from);}
  const placed=[],pending=new Set(units),position=new Map();
  while(pending.size){
    const choices=[...pending].sort((a,b)=>b.members.length-a.members.length||b.neighbors.filter(id=>position.has(id)).length-a.neighbors.filter(id=>position.has(id)).length||b.neighbors.length-a.neighbors.length||compare(byId.get(a.id).atomCode||a.id,byId.get(b.id).atomCode||b.id));
    const u=choices[0];pending.delete(u);const known=u.neighbors.map(id=>position.get(id)).filter(Boolean),desired=known.length?Math.max(0,known.reduce((s,p)=>s+p.y+p.h/2,0)/known.length-u.height/2):0;
    const blockers=placed.filter(p=>u.lo<=p.hi&&u.hi>=p.lo),ys=[desired,0,...blockers.flatMap(p=>[p.y-u.height-38,p.y+p.height+38])].filter(y=>y>=0);
    ys.sort((a,b)=>Math.abs(a-desired)-Math.abs(b-desired)||a-b);u.y=ys.find(y=>blockers.every(p=>y+u.height+28<=p.y||y>=p.y+p.height+28));
    if(u.y==null)u.y=Math.max(0,...blockers.map(p=>p.y+p.height+38));placed.push(u);
    for(const id of u.members){const n=byId.get(id);n.x=48+rank.get(id)*(NW+GAP);n.y=48+u.y+u.relative.get(id);position.set(id,n);}
  }
  const groups=[];
  function group(id){for(const child of children.get(id))group(child);if(!children.get(id).length)return;const descendants=[];function walk(v){descendants.push(v);for(const c of children.get(v))walk(c);}walk(id);const rects=descendants.map(v=>byId.get(v));for(const g of groups)if(descendants.includes(g.id))rects.push(g);const x=Math.min(...rects.map(r=>r.x))-PAD,y=Math.min(...rects.map(r=>r.y))-PAD-14,w=Math.max(...rects.map(r=>r.x+r.w))-x+PAD,h=Math.max(...rects.map(r=>r.y+r.h))-y+PAD;groups.push({id,label:'ATOM '+byId.get(id).atomCode,x,y,w,h,members:descendants});}
  for(const u of units)group(u.id);
  const overlaps=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
  const headers=groups.map(g=>({x:g.x+8,y:g.y+4,w:Math.min(NW-16,g.w-16),h:14,kind:'header',id:g.id}));
  const labels=[],labelByEdge=new Map();
  for(const e of [...edges].sort((a,b)=>rank.get(a.from)-rank.get(b.from)||((byId.get(a.from).y+byId.get(a.to).y)-(byId.get(b.from).y+byId.get(b.to).y))||a.index-b.index)){
    if(!e.labels?.length)continue;const a=byId.get(e.from),b=byId.get(e.to),h=sizes.edges[e.index-1]||36;
    const x=a.x+NW+38,y0=Math.max(16,(a.y+a.h/2+b.y+b.h/2)/2-h/2),rect={edgeIndex:e.index,x,y:y0,w:LW,h,text:e.labels.join('\n')};
    const obstacles=[...nodes,...headers,...labels].filter(o=>x<o.x+o.w+8&&x+LW+8>o.x);
    const ys=[y0,16,...obstacles.flatMap(o=>[o.y-h-12,o.y+o.h+12])].filter(y=>y>=16).sort((a,b)=>Math.abs(a-y0)-Math.abs(b-y0)||a-b);
    rect.y=ys.find(y=>obstacles.every(o=>!overlaps({...rect,y},o,7)))??Math.max(16,...obstacles.map(o=>o.y+o.h+12));labels.push(rect);labelByEdge.set(e.index,rect);
  }
  const allObstacles=[...nodes.map(n=>({...n,kind:'node'})),...labels.map(l=>({...l,kind:'label',id:'label'+l.edgeIndex})),...headers];
  const minY=Math.min(0,...allObstacles.map(o=>o.y))-28,maxY=Math.max(200,...allObstacles.map(o=>o.y+o.h))+28;
  const occupancy={h:new Map(),v:new Map()},verticalObstacles=new Map(),horizontalObstacles=new Map();let tested=0;
  function segments(points){return points.slice(1).map((p,i)=>[points[i],p]).filter(([a,b])=>a[0]!==b[0]||a[1]!==b[1]);}
  function blocked(points){for(const [a,b]of segments(points)){const vertical=a[0]===b[0],key=vertical?a[0]:a[1],cache=vertical?verticalObstacles:horizontalObstacles;if(!cache.has(key))cache.set(key,allObstacles.filter(o=>vertical?key>o.x+1&&key<o.x+o.w-1:key>o.y+1&&key<o.y+o.h-1));for(const o of cache.get(key)){tested++;if(vertical?Math.max(a[1],b[1])>o.y+1&&Math.min(a[1],b[1])<o.y+o.h-1:Math.max(a[0],b[0])>o.x+1&&Math.min(a[0],b[0])<o.x+o.w-1)return true;}}return false;}
  function occupancyScore(points,save=false){let cost=0;for(const[a,b]of segments(points)){const vertical=a[0]===b[0],axis=vertical?'v':'h',fixed=vertical?a[0]:a[1],lo=Math.min(vertical?a[1]:a[0],vertical?b[1]:b[0]),hi=Math.max(vertical?a[1]:a[0],vertical?b[1]:b[0]),key=Math.round(fixed/5);if(save){if(!occupancy[axis].has(key))occupancy[axis].set(key,[]);occupancy[axis].get(key).push({fixed,lo,hi});}else for(const k of [key-1,key,key+1])for(const old of occupancy[axis].get(k)||[]){const length=Math.min(hi,old.hi)-Math.max(lo,old.lo);if(length>2&&Math.abs(fixed-old.fixed)<5)cost+=length+40;}}return cost;}
  function crossingScore(points){let count=0;for(const[a,b]of segments(points)){const vertical=a[0]===b[0],fixed=vertical?a[0]:a[1],lo=Math.min(vertical?a[1]:a[0],vertical?b[1]:b[0]),hi=Math.max(vertical?a[1]:a[0],vertical?b[1]:b[0]);for(const[key,lines]of occupancy[vertical?'h':'v']){if(key*5<lo-5||key*5>hi+5)continue;for(const old of lines)if(old.fixed>lo+1&&old.fixed<hi-1&&fixed>old.lo+1&&fixed<old.hi-1)count++;}}return count;}
  function route(a,b,edgeIndex) {
    const candidates=[],x0=a[0]+24,x1=b[0]-24;
    if(a[0]<=b[0])for(const dx of [0,8,16,24,32,40]){const x=Math.min(x1,x0+dx);candidates.push([a,[x,a[1]],[x,b[1]],b]);}
    const middle=(a[1]+b[1])/2;
    const near=allObstacles.filter(o=>o.x<Math.max(x0,x1)&&o.x+o.w>Math.min(x0,x1)).flatMap(o=>[o.y-12,o.y+o.h+12]).sort((y,z)=>Math.abs(y-middle)-Math.abs(z-middle)).slice(0,8);
    const ys=[middle,...near,minY-edgeIndex*7,maxY+edgeIndex*7];
    for(const y of ys)candidates.push([a,[x0,a[1]],[x0,y],[x1,y],[x1,b[1]],b]);
    // Alternate escape rails handle ports next to nested group headings or neighboring captions.
    for(const offset of [16,32])for(const y of [minY-edgeIndex*7,maxY+edgeIndex*7])candidates.push([a,[a[0]+offset,a[1]],[a[0]+offset,y],[b[0]-offset,y],[b[0]-offset,b[1]],b]);
    let best=null;const valid=[];
    for(const points of candidates){if(blocked(points))continue;const length=segments(points).reduce((s,[p,q])=>s+Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1]),0),overlap=occupancyScore(points),crossings=crossingScore(points);valid.push({points,length,overlap,crossings});if(!overlap&&!crossings&&points.length===4){best=points;break;}}
    if(!best&&valid.length){const shortest=Math.min(...valid.map(c=>c.length));valid.sort((a,b)=>{const eligible=c=>c.length<=shortest*1.8+60;return Number(eligible(b))-Number(eligible(a))||(a.overlap*4+a.crossings*140+a.length+a.points.length*8)-(b.overlap*4+b.crossings*140+b.length+b.points.length*8);});best=valid[0].points;}
    // The final outside channels are always outside node columns and label bodies.
    if(!best)throw Error('无法在本次图中为关系 '+edgeIndex+' 安全安排线路');
    occupancyScore(best,true);return best;
  }
  const out=new Map(),inc=new Map();for(const e of edges){if(!out.has(e.from))out.set(e.from,[]);out.get(e.from).push(e.index);if(!inc.has(e.to))inc.set(e.to,[]);inc.get(e.to).push(e.index);}
  const port=(n,list,index)=>n.y+n.h/2+(list.indexOf(index)-(list.length-1)/2)*Math.min(12,(n.h-24)/(list.length+1));
  const routed=[];for(const e of edges){const a=byId.get(e.from),b=byId.get(e.to),start=[a.x+a.w,port(a,out.get(e.from),e.index)],end=[b.x,port(b,inc.get(e.to),e.index)],label=labelByEdge.get(e.index);let points;
    if(label){const left=[label.x,label.y+label.h/2],right=[label.x+label.w,label.y+label.h/2];points=[...route(start,left,e.index),right,...route(right,end,e.index).slice(1)];}else points=route(start,end,e.index);
    routed.push({...e,points,stem:[]});
  }
  const minX=Math.min(0,...groups.map(g=>g.x),...routed.flatMap(e=>e.points.map(p=>p[0]))),minCanvasY=Math.min(0,...groups.map(g=>g.y),...routed.flatMap(e=>e.points.map(p=>p[1]))),dx=20-minX,dy=20-minCanvasY;
  for(const rect of [...nodes,...groups,...labels]){rect.x+=dx;rect.y+=dy;}for(const e of routed)e.points=e.points.map(([x,y])=>[x+dx,y+dy]);
  const width=Math.max(600,...nodes.map(n=>n.x+n.w+30),...groups.map(g=>g.x+g.w+30),...labels.map(l=>l.x+l.w+30),...routed.flatMap(e=>e.points.map(p=>p[0]+30))),height=Math.max(350,...nodes.map(n=>n.y+n.h+30),...groups.map(g=>g.y+g.h+30),...labels.map(l=>l.y+l.h+30),...routed.flatMap(e=>e.points.map(p=>p[1]+30)));
  return {nodes,groups,labels,edges:routed,width,height,version:'address-reference-v2',diagnostics:{routeObstacleChecks:tested,addressWarnings}};
}
module.exports={layout,ancestor};
