"use strict";
const {createHash}=require('crypto');
const {Buffer}=require('buffer');
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const fail=code=>{throw Object.assign(Error(code),{code});};
function strictJson(raw){
 const result=JSON.parse(raw),stack=[];let m;const tokens=/"(?:\\[\s\S]|[^"\\])*"|[{}\[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g;
 while((m=tokens.exec(raw))){const t=m[0],top=stack[stack.length-1];
  if(t==='{'||t==='['){stack.push({object:t==='{',key:true,seen:new Set()});if(stack.length>128)fail('TRACKING_JSON_DEPTH');}
  else if(t==='}'||t===']')stack.pop();
  else if(t===','){if(top?.object)top.key=true;}
  else if(t===':'){if(top?.object)top.key=false;}
  else if(top?.object&&top.key&&t[0]==='"'){const k=JSON.parse(t);if(top.seen.has(k))fail('TRACKING_JSON_DUPLICATE_KEY');top.seen.add(k);}
 }
 return result;
}
function pathValid(p){return typeof p==='string'&&p.length>0&&p.length<=4096&&p===p.trim()&&!p.includes('\\')&&!p.includes('\0')&&!/^[A-Za-z]:|^\//.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');}
function identity(domain,key,source){
 if(!['project','goal'].includes(domain)||typeof key!=='string'||key.length>16384||!key.startsWith('jump:v1:'))fail('TRACKING_IDENTITY_INVALID');
 let a;try{a=key.slice(8).split('|').map(decodeURIComponent);}catch{fail('TRACKING_IDENTITY_INVALID');}
 if(a.length!==5||a.some(x=>!x||x!==x.trim()||x.includes('\0'))||!pathValid(a[1])||'jump:v1:'+a.map(encodeURIComponent).join('|')!==key)fail('TRACKING_IDENTITY_INVALID');
 if(domain==='project'&&(a[0]!=='workspace-mount-view'||a[2]!=='tab'))fail('TRACKING_IDENTITY_INVALID');
 if(domain==='goal'&&(a[0]!=='mandala-time-blocks'||a[2]!=='node'||a[3]!=='mandala'||a[1]!==source))fail('TRACKING_SOURCE_MISMATCH');
 return domain==='project'?key:a[4];
}
async function readTracking(c,request){
 const paths={...c.paths()},generation=c.generation;
 if(request?.contractVersion!==1)fail('TRACKING_CONTRACT_UNSUPPORTED');
 if(!pathValid(paths.sourceNotePath)||!pathValid(paths.weeklyGoals)||!request||request.sourceNotePath!==paths.sourceNotePath)fail('TRACKING_SOURCE_MISMATCH');
 if(!Array.isArray(request.subjects)||request.subjects.length>500)fail('TRACKING_REQUEST_LIMIT');
 const subjects=request.subjects.map(x=>({domain:x?.domain,nodeKey:x?.nodeKey})),seen=new Set();
 for(const s of subjects){s.id=identity(s.domain,s.nodeKey,paths.sourceNotePath);const k=s.domain+'::'+s.nodeKey;if(seen.has(k))fail('TRACKING_DUPLICATE_IDENTITY');seen.add(k);}
 const guard=()=>{const now=c.paths();if(!c.live()||now.sourceNotePath!==paths.sourceNotePath||now.weeklyGoals!==paths.weeklyGoals)fail('TRACKING_SOURCE_CHANGED');};
 guard();if(!await c.adapter.exists(paths.weeklyGoals))fail('TRACKING_FILE_MISSING');guard();
 const raw=await c.adapter.read(paths.weeklyGoals);guard();
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>8*1024*1024)fail('TRACKING_STORE_LIMIT');
 let data;try{data=strictJson(raw);}catch(e){if(e.code)throw e;fail('TRACKING_JSON_INVALID');}
 if(!plain(data)||data.version!==3||!plain(data.workspaceNodeStatesByKey)||!plain(data.nodeStatesByKey))fail('TRACKING_SCHEMA_INVALID');
 const maps={project:new Map(),goal:new Map()};let ignoredLegacyProjectRecords=0;
 for(const domain of ['project','goal']){
  const entries=Object.entries(data[domain==='project'?'workspaceNodeStatesByKey':'nodeStatesByKey']);if(entries.length>5000)fail('TRACKING_STORE_LIMIT');
  for(const [k,v] of entries){
   if(!plain(v)||!pathValid(v.sourceNotePath)||typeof v.nodeId!=='string'||!v.nodeId||v.nodeId!==v.nodeId.trim()||v.nodeId.includes('\0')||k!==`${v.sourceNotePath}::${v.nodeId}`||!['active','stopped'].includes(v.status))fail('TRACKING_RECORD_INVALID');
   if(domain==='project'){try{identity(domain,v.nodeId,v.sourceNotePath);}catch{ignoredLegacyProjectRecords++;continue;}}
   if(v.sourceNotePath!==paths.sourceNotePath)continue;
   if(maps[domain].has(v.nodeId))fail('TRACKING_DUPLICATE_IDENTITY');
   maps[domain].set(v.nodeId,v.status);
  }
 }
 guard();const after=await c.adapter.read(paths.weeklyGoals);guard();if(after!==raw)fail('TRACKING_REVISION_CHANGED');
 return {contractVersion:1,snapshotType:'mandala-context-tracking-states-v1',evidenceType:'raw-tracking-only',coveredScope:'requested-exact-subjects',ignoredLegacyProjectRecords,ok:true,complete:true,sourceScope:paths.sourceNotePath,providerGeneration:generation,revision:createHash('sha256').update(raw).digest('hex'),generatedAt:new Date().toISOString(),limit:500,count:subjects.length,totalCount:subjects.length,returnedCount:subjects.length,hasMore:false,truncated:false,items:subjects.map(s=>({domain:s.domain,nodeKey:s.nodeKey,trackingSource:paths.sourceNotePath,status:maps[s.domain].get(s.id)||'unrecorded',explicit:maps[s.domain].has(s.id)}))};
}
module.exports={readTracking,identity};
