"use strict";
// Production adapter for NamingService (C1). Participants are discovered through app.plugins, never through views.
// Every object NamingService may act on (attestation, capture, prepare, session) is issued here and recorded in a
// private WeakMap; NamingService only accepts objects this module issued for this adapter (C1 R9/A4).
const crypto=require('node:crypto');
const {hash}=require('./naming-store.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),fail=x=>{throw Error(x)};
const adapters=new WeakSet(),issued=new WeakMap();
const OWNERS=['context-key-manager','project-execution-overview','mandala-time-blocks','workspace-mount','gtd-task-manager','collection-card-view'];
const CONSUMERS=['workspace-mount','gtd-task-manager','collection-card-view'];
const STEP={'peo-declaration':'project-execution-overview','mandala-primary':'mandala-time-blocks'};

function createAdapter({app,center}){
 if(!app||typeof center?.status!=='function')fail('naming-adapter-config');
 // Evidence is read-only. A stuck owner may not hold the modal forever, and retry may not queue duplicate reads.
 const reads=new Map();
 async function readEvidence(id,part,c,guard,idg){
  guard();idg();
  if(reads.get(id)?.part===part)fail('owner-read-pending:'+id);
  const budget=Math.min(10000,typeof guard.remainingMs==='function'?guard.remainingMs():10000);
  if(budget<=0)fail('owner-evidence-timeout:'+id);
  const entry={part};reads.set(id,entry);let timer;
  const job=Promise.resolve().then(()=>{guard();idg();return part.evidence(copy(c));});
  const cleanup=()=>{if(reads.get(id)===entry)reads.delete(id)};
  job.then(cleanup,cleanup);
  try{
   const result=await Promise.race([job,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('owner-evidence-timeout:'+id)),budget);})]);
   guard();idg();return result;
  }finally{clearTimeout(timer)}
 }
 // Snapshot of the participant set; the lease proves the same plugin objects and participant objects are still installed.
 function collect(){
  const set={'context-key-manager':{plugin:null,part:center}};
  for(const id of OWNERS.slice(1)){const plugin=app.plugins?.plugins?.[id],part=typeof plugin?.getCenterNamingParticipantV1==='function'?plugin.getCenterNamingParticipantV1():null;
   if(!part||part.ownerId!==id)fail('writer-fence-missing:'+id);set[id]={plugin,part}}
  return set;
 }
 function fences(set){
  const {FENCES}=require('./naming-service.cjs');
  return OWNERS.map(id=>{const s=set[id].part.status();if(s?.ownerId!==id||s.mode!=='ready'||typeof s.generation!=='string'||!s.generation||JSON.stringify([...s.capabilities].sort())!==JSON.stringify([...FENCES[id]].sort()))fail('writer-fence-missing:'+id);return {ownerId:id,mode:'ready',generation:s.generation,capabilities:[...s.capabilities]}});
 }
 function identity(set,rows){
  return ()=>{for(const id of OWNERS.slice(1)){const plugin=app.plugins?.plugins?.[id];if(plugin!==set[id].plugin||plugin.getCenterNamingParticipantV1()!==set[id].part)fail('writer-fence-changed:'+id)}
   const now=OWNERS.map(id=>set[id].part.status());rows.forEach((r,i)=>{if(now[i].mode!=='ready'||now[i].generation!==r.generation)fail('writer-fence-changed:'+r.ownerId)});return true};
 }
 const sign=(x,kind,extra={})=>{issued.set(x,{adapter,kind,...extra});return x};
 const adapter=Object.freeze({
  // Upgrade gate: all six participants report every capability right now.
  async attest(){const set=collect(),rows=fences(set);const g=identity(set,rows);return sign({fences:rows,guard:g},'attest')},
  async capture(c,guard){
   const set=collect(),rows=fences(set),idg=identity(set,rows),s=c.subjects[0],goal=s.domain==='goal',ev={};
   for(const id of OWNERS.slice(1)){ev[id]=await readEvidence(id,set[id].part,c,guard,idg);guard();idg()}
   if(goal&&ev['mandala-time-blocks'].applicable!==true)fail('mandala-source-not-current');
   if(goal&&ev['project-execution-overview'].lineageHash!==ev['mandala-time-blocks'].lineageHash)fail('legacy-lineage-mismatch');
   const pending=[...ev['project-execution-overview'].pending,...ev['mandala-time-blocks'].pending];
   if(pending.length)throw Object.assign(Error('legacy-writers-not-quiescent:'+pending.map(p=>p.source+'#'+p.id+'('+p.status+')').join(',')),{pendingJobs:copy(pending),sourceScope:s.sourceScope});
   const digests=Object.fromEntries(OWNERS.slice(1).map(id=>[id,ev[id].digest]));
   const evidence={version:1,complete:true,pending:[],subject:copy(s),bindings:copy(c.bindings),label:c.canonicalLabel,declarationHash:hash(digests['project-execution-overview']),fences:rows,owners:digests};
   // Lease: identity plus a synchronous re-read of every participant's content digest (C1 R3).
   // Participants read the center snapshot while recomputing their digest, and inside the center's exclusive write that
   // read re-runs this lease; the nested call is the same check already in progress, so it returns at once.
   let checking=false;
   const lease=()=>{if(checking)return true;checking=true;try{idg();for(const id of OWNERS.slice(1))if(set[id].part.digestNow(copy(c))!==digests[id])fail('claim-evidence-changed:'+id);return true}finally{checking=false}};
   return sign({evidence,guard:lease},'capture',{contextId:c.contextId,evidenceHash:hash(evidence)});
  },
  async prepare(c,newLabel,guard){
   const set=collect(),rows=fences(set),idg=identity(set,rows),order=[...(c.subjects[0].domain==='goal'?['mandala-time-blocks']:[]),'project-execution-overview',...CONSUMERS],plans=[];
   for(const id of order){plans.push(await set[id].part.prepare(copy(c),newLabel));guard();idg()}
   return sign({plans,guard:idg},'prepare',{contextId:c.contextId,plansHash:hash(plans)});
  },
  // Fixed frozen plans go back to their original owners; fences are generated now from the real participants.
  async open(c,guard,namespace){
   const set=collect(),rows=fences(set),idg=identity(set,rows),part=row=>set[STEP[row.id]||row.id].part;
   const session={contextId:c.contextId,namespace,pendingHash:hash(c.naming.pending),fences:rows,guard:idg,
    inspect:(row,txId)=>part(row).inspect(row,txId),apply:(row,txId,lease)=>part(row).apply(row,txId,lease)};
   return sign(session,'session',{contextId:c.contextId});
  }
 });
 adapters.add(adapter);return adapter;
}
// Accepts only an object this module issued, for this adapter, of this kind, unchanged since issue.
function verify(adapter,kind,x,contextId=null){
 const r=x&&issued.get(x);if(!adapters.has(adapter)||!r||r.adapter!==adapter||r.kind!==kind)fail('production-adapter-proof-invalid');
 if(contextId!==null&&r.contextId!==contextId)fail('production-adapter-proof-invalid');
 if(kind==='capture'&&hash(x.evidence)!==r.evidenceHash||kind==='prepare'&&hash(x.plans)!==r.plansHash)fail('production-adapter-proof-invalid');
 return true;
}
const isAdapter=a=>adapters.has(a);
module.exports={createAdapter,verify,isAdapter,OWNERS};
