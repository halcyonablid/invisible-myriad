'use strict';
const {frames}=require('./math.cjs');
const overlaps=(a,b)=>a.x<b.x+b.width-1e-5&&a.x+a.width>b.x+1e-5&&a.y<b.y+b.height-1e-5&&a.y+a.height>b.y+1e-5;
function validInput(f,p){return Array.isArray(p)&&p.length===f.nodes.length&&p.every((n,i)=>n&&n.id===f.nodes[i].id&&[n.x,n.y,n.width,n.height].every(Number.isFinite)&&n.width===f.nodes[i].width&&n.height===f.nodes[i].height&&n.width>0&&n.height>0);}
function conflicts(f,p){const out=[];for(const g of frames(f,p))for(let i=0;i<p.length;i++)if(!g.members.includes(i)&&overlaps(g,p[i]))out.push({type:'group',g,i});for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)if(overlaps(p[i],p[j]))out.push({type:'node',i,j});return out;}
function repair(f,original,{maxExpansions=5000,maxDepth=10,beamWidth=24,timeoutMs=2000}={}){
 const started=performance.now();if(!validInput(f,original))return {status:'SKIP_ERROR',candidates:[],explored:0};
 const key=p=>p.map(n=>`${n.x.toFixed(4)},${n.y.toFixed(4)}`).join(';');
 function state(p){const cs=conflicts(f,p),all=[...p,...frames(f,p)],w=Math.max(...all.map(n=>n.x+n.width))-Math.min(...all.map(n=>n.x)),h=Math.max(...all.map(n=>n.y+n.height))-Math.min(...all.map(n=>n.y));const fit=Math.min(1,(f.viewport.width-60)/(w+60),(f.viewport.height-60)/(h+60)),displacement=p.reduce((s,n,i)=>s+Math.abs(n.x-original[i].x)+Math.abs(n.y-original[i].y),0);return {p,cs,key:key(p),cost:displacement+1000*(1-fit),fit,displacement};}
 const initial=state(original.map(n=>({...n})));if(!initial.cs.length)return {status:'UNCHANGED',candidates:[initial.p],explored:0,repairMs:performance.now()-started};
 const compare=(a,b)=>a.cs.length-b.cs.length||a.cost-b.cost||a.key.localeCompare(b.key,'en');
 let beam=[initial],explored=0,status='EXHAUSTED';const seen=new Set([initial.key]),finals=[];
 outer:for(let depth=0;depth<maxDepth;depth++){
  const next=[];
  for(const s of beam){
   const moves=[];
   const outside=(i,b)=>{const n=s.p[i];moves.push([i,'x',b.x-n.width-28],[i,'x',b.x+b.width+28],[i,'y',b.y-n.height-28],[i,'y',b.y+b.height+28]);};
   for(const c of s.cs.slice(0,4)){
    if(c.type==='node'){outside(c.i,s.p[c.j]);outside(c.j,s.p[c.i]);}
    else {outside(c.i,c.g);const intruder=s.p[c.i];for(const i of c.g.members){const n=s.p[i];moves.push([i,'x',intruder.x-n.width-42],[i,'x',intruder.x+intruder.width+42],[i,'y',intruder.y-n.height-42],[i,'y',intruder.y+intruder.height+70]);}}
   }
   for(const [i,axis,value]of moves){
    if(explored>=maxExpansions){status='EXPANSION_LIMIT';break outer;}if(performance.now()-started>timeoutMs){status='TIME_LIMIT';break outer;}
    const p=s.p.map(n=>({...n}));p[i][axis]=value;const k=key(p);if(seen.has(k))continue;seen.add(k);explored++;const v=state(p);if(!v.cs.length)finals.push(v);else next.push(v);
   }
  }
  if(finals.length>=4){status='FOUND';break;}next.sort(compare);beam=next.slice(0,beamWidth);if(!beam.length)break;
 }
 finals.sort((a,b)=>a.cost-b.cost||a.key.localeCompare(b.key,'en'));
 return {status:finals.length?(status==='TIME_LIMIT'?'FOUND_AT_TIME_LIMIT':'FOUND'):status,candidates:finals.slice(0,4).map(v=>v.p),explored,repairMs:performance.now()-started};
}
module.exports={repair,conflicts,validInput};
