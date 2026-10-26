'use strict';
// Archiving never restores or publishes registry state. All write plans stay private.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FILE=/^(?:current\.json|mirror\.json|pending\.json|writer\.lock|lock-[0-9a-f-]{36}\.tmp|reclaim-[0-9a-f-]{36}\.json)$/;
const fail=m=>{throw Error(m);};
function createArchive(store,isLive=()=>true,{now=Date.now,rename=fs.renameSync}={}){
 const plans=new Map();
 function live(){if(!isLive())fail('archive-service-closed');}
 function safe(p){let x=path.resolve(p);for(;;){let st;try{st=fs.lstatSync(x);}catch(e){if(e.code!=='ENOENT')throw e;}if(st&&(st.isSymbolicLink()||!st.isDirectory()))fail('archive-unsafe-directory');const parent=path.dirname(x);if(parent===x)break;x=parent;}}
 const recovery=path.join(store.root,'recovery'),archive=path.join(store.root,'recovery-archive');
 function inspect(id){
  if(!UUID.test(id))fail('archive-invalid-id');const dir=path.join(recovery,id);safe(dir);
  const names=fs.readdirSync(dir).sort();if(names.length>38||!names.includes('manifest.json'))fail('archive-incomplete-backup');
  const read=n=>{const p=path.join(dir,n),st=fs.lstatSync(p);if(!st.isFile()||st.isSymbolicLink()||st.size>store.maxBytes*3)fail('archive-unsafe-file');return fs.readFileSync(p);};
  const raw=read('manifest.json');if(raw.length>16384)fail('archive-manifest-too-large');const m=JSON.parse(raw);
  if(!m||Object.keys(m).sort().join(',')!=='hashes,sourceDigest'||!/^([0-9a-f]{64})$/.test(m.sourceDigest)||!m.hashes||Array.isArray(m.hashes)||typeof m.hashes!=='object')fail('archive-invalid-manifest');
  const keys=Object.keys(m.hashes).sort();if(!keys.length||keys.some(n=>!FILE.test(n)||!/^[0-9a-f]{64}$/.test(m.hashes[n]))||JSON.stringify(names)!==JSON.stringify([...keys,'manifest.json'].sort()))fail('archive-file-set-mismatch');
  let bytes=raw.length;for(const n of keys){const b=read(n);bytes+=b.length;if(hash(b)!==m.hashes[n])fail('archive-hash-mismatch');}
  return {id,bytes,manifestHash:hash(raw),sourceDigest:m.sourceDigest};
 }
 function list(){live();safe(recovery);safe(archive);if(!fs.existsSync(recovery))return [];const names=fs.readdirSync(recovery);if(names.length>64)fail('archive-directory-capacity');return names.map(id=>{try{return {...inspect(id),ok:true};}catch(e){return {id,ok:false,reason:e.message};}});}
 function state(){const s=store.status();if(s.status==='ready')return {status:s.status,digest:s.digest};if(s.status!=='recovery-required')fail('archive-store-unavailable');const p=store.previewRecovery();return {status:s.status,digest:s.digest,initialization:p.kind==='empty-initialize'?{namespace:p.target.state.namespace}:null};}
 function preview(id){live();safe(archive);const before=state(),item=inspect(id);if(fs.existsSync(path.join(archive,id)))fail('archive-destination-exists');plans.clear();const token=crypto.randomUUID();plans.set(token,{before,item,expires:now()+120000});return {token,id:item.id,bytes:item.bytes,destination:'recovery-archive/'+id};}
 function confirm(token){
  live();const p=plans.get(token);plans.delete(token);if(!p||p.expires<now())fail('archive-preview-expired');
  const before=state();if(JSON.stringify(before)!==JSON.stringify(p.before)||JSON.stringify(inspect(p.item.id))!==JSON.stringify(p.item))fail('archive-preview-changed');
  safe(archive);const dest=path.join(archive,p.item.id);if(fs.existsSync(dest))fail('archive-destination-exists');
  const lock=store.lock(before.digest,true,before.initialization);let moved=false;
  try{
   live();store.owned(lock);safe(recovery);safe(archive);
   if(JSON.stringify(inspect(p.item.id))!==JSON.stringify(p.item))fail('archive-preview-changed');
   if(!fs.existsSync(archive))fs.mkdirSync(archive);safe(archive);if(fs.existsSync(dest))fail('archive-destination-exists');
   rename(path.join(recovery,p.item.id),dest);moved=true;
   return {archived:true,id:p.item.id,destination:dest,recoveryRequired:before.status!=='ready'};
  }finally{store.release(lock,before.status==='ready');}
 }
 return Object.freeze({list,preview,confirm});
}
module.exports={createArchive};
