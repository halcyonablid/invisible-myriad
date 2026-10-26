'use strict';
// Bounded derived state; optional owner-private disk evidence. Disk graphs are previews only.
function createSession(app, limits={}) {
  const maxGraphs=limits.maxGraphs||16,maxGraphBytes=limits.maxGraphBytes||8*1024*1024;
  const maxFiles=limits.maxFiles||512,maxFileBytes=limits.maxFileBytes||16*1024*1024;
  const files=new Map(),graphs=new Map(),members=new Map(),queries=new Map(),listeners=new Set();
  let epoch=0,disposed=false,serial=0,hint=null,engine='',fileBytes=0,graphBytes=0;
  const counters={reads:0,parses:0,fileHits:0,snapshotHits:0,diskFileHits:0,diskGraphs:0};
  const store=limits.persistence||null,coldFiles=new Map();let restorePromise=null,restoredEngine='',saveTimer=null,writeTail=Promise.resolve(),dirty=0,hydrating=false;
  function schedule(){if(!store?.ready()||disposed||hydrating)return;dirty++;if(saveTimer)return;saveTimer=setTimeout(()=>{saveTimer=null;void persistNow();},1000);}
  function snapshot(){
    const selected=new Map(coldFiles);for(const e of files.values())if(e.native&&e.parserHash)selected.set(e.path,{path:e.path,stamp:e.stamp,native:e.native,parserHash:e.parserHash,value:e.value});
    const fs=[...selected.values()].filter(e=>store.fileValid(e)).slice(-maxFiles),gs=[];
    for(const e of graphs.values()){const paths=[];for(const [key,q]of queries)if(q.id===e.id){const [p,cfg]=JSON.parse(key);if(cfg===e.settings)paths.push(p)}const item={settings:e.settings,signature:e.signature,graph:e.graph,queries:paths,previewOnly:true};if(store.graphValid(item))gs.push(item)}
    return {files:fs,graphs:gs.slice(-maxGraphs)};
  }
  function persistNow(){
    if(!store?.ready()||disposed)return Promise.resolve(false);const generation=epoch,identity=engine,revision=dirty;
    const guard=()=>!disposed&&epoch===generation&&engine===identity&&dirty===revision;
    const task=writeTail.catch(()=>{}).then(async()=>{if(!guard())return false;return store.save(snapshot(),guard)}).catch(e=>{console.warn('[ReferenceGraphWidget][persistent-cache.save-skipped]',{reason:e.code||'cache-write-failed'});return false});writeTail=task;return task;
  }
  async function restore(){
    if(!store||disposed||!engine)return false;if(restoredEngine===engine)return true;if(restorePromise)return restorePromise;
    const generation=epoch,identity=engine,guard=()=>!disposed&&epoch===generation&&engine===identity;
    restorePromise=(async()=>{try{if(!await store.init(identity,guard)||!guard())return false;const data=await store.load(guard);if(!guard())return false;restoredEngine=identity;if(!data)return true;hydrating=true;
      for(const e of data.files)coldFiles.set(e.path,e);trimFiles();
      for(const e of data.graphs){for(const p of e.queries){const id=put(p,e.settings,e.graph,e.signature,epoch);if(id){graphs.get(id).restored=true;queries.set(JSON.stringify([p,e.settings]),{id,epoch:-1,time:0})}}}
      counters.diskGraphs=graphs.size;return true;
    }catch(e){console.warn('[ReferenceGraphWidget][persistent-cache.unavailable]',{reason:e.code||'unsupported'});return false}finally{hydrating=false;restorePromise=null}})();return restorePromise;
  }
  const clone=x=>JSON.parse(JSON.stringify(x));
  function dropGraph(id){const entry=graphs.get(id);if(!entry)return;graphs.delete(id);graphBytes-=entry.bytes;for(const p of entry.paths){const ids=members.get(p);ids?.delete(id);if(!ids?.size)members.delete(p);}for(const [k,v]of queries)if(v.id===id)queries.delete(k);if(hint?.id===id)hint=null;}
  function clearFiles(){files.clear();coldFiles.clear();fileBytes=0;}
  function invalidate(kind,path){if(disposed)return;epoch++;if(kind==='rename'||kind==='delete'||kind==='engine'||kind==='refresh'){clearFiles();for(const id of [...graphs.keys()])dropGraph(id);}else if(path){coldFiles.delete(path);for(const [k,v]of files)if(v.path===path){files.delete(k);fileBytes-=v.bytes;}}schedule();for(const fn of listeners)fn();}
  async function parsed(file,kind,parser,force=false){
    const start=epoch,identity=engine,stampOf=()=>file.stat&&Number.isFinite(file.stat.mtime)&&Number.isFinite(file.stat.size)?file.stat.mtime+':'+file.stat.size:null;
    const stamp=stampOf(),key=kind+'\0'+file.path,hit=files.get(key),nativeMode=!!store?.ready()&&kind==='body';
    const parserHash=nativeMode?store.hash(String(parser)):null,native=nativeMode?await store.proof(file.path):null;
    const valid=()=>!disposed&&epoch===start&&engine===identity&&stamp===stampOf();
    if(!valid())throw Error('reference-source-changed');
    if(force){coldFiles.delete(file.path);files.delete(key);if(hit)fileBytes-=hit.bytes;}
    if(!force&&stamp&&hit?.stamp===stamp&&(nativeMode?store.same(hit.native,native):!hit.native)&&(!hit.parserHash||hit.parserHash===parserHash)){
      files.delete(key);files.set(key,hit);counters.fileHits++;return clone(hit.value);
    }
    const disk=!force&&coldFiles.get(file.path);coldFiles.delete(file.path);
    if(nativeMode&&disk&&stamp===disk.stamp&&parserHash===disk.parserHash&&store.same(native,disk.native)){
      const entry={...disk,bytes:JSON.stringify(disk.value).length*2};if(files.has(key))fileBytes-=files.get(key).bytes;files.set(key,entry);fileBytes+=entry.bytes;trimFiles();counters.fileHits++;counters.diskFileHits++;return clone(entry.value);
    }
    if(files.has(key)){fileBytes-=files.get(key).bytes;files.delete(key);}
    counters.reads++;const raw=await (force||nativeMode||!app.vault.cachedRead?app.vault.read(file):app.vault.cachedRead(file));
    const after=nativeMode&&native?await store.proof(file.path):null;
    if(nativeMode&&(!valid()||(native&&!store.same(native,after))))throw Error('reference-source-changed');
    counters.parses++;const value=parser(raw),bytes=raw.length*2+JSON.stringify(value).length*2;
    if(valid()&&stamp&&bytes<=maxFileBytes){files.set(key,{path:file.path,stamp,value,bytes,native:after,parserHash:nativeMode?parserHash:null});fileBytes+=bytes;trimFiles();schedule();}
    return clone(value);
  }
  function trimFiles(){let coldBytes=[...coldFiles.values()].reduce((n,e)=>n+JSON.stringify(e.value).length*2,0);while(coldFiles.size&&(coldFiles.size+files.size>maxFiles||coldBytes+fileBytes>maxFileBytes)){const k=coldFiles.keys().next().value;coldBytes-=JSON.stringify(coldFiles.get(k).value).length*2;coldFiles.delete(k);}while(files.size>maxFiles||fileBytes>maxFileBytes){const k=files.keys().next().value;fileBytes-=files.get(k).bytes;files.delete(k);}}
  function find(path,settings){
    const exact=queries.get(JSON.stringify([path,settings]));let entry;
    const preferred=hint;hint=null;
    if(preferred?.path===path){const e=graphs.get(preferred.id);if(e?.settings===settings&&e.paths.includes(path))entry=e;}
    if(!entry&&exact)entry=graphs.get(exact.id);
    if(!entry)for(const id of [...(members.get(path)||[])].reverse()){const e=graphs.get(id);if(e?.settings===settings){entry=e;break;}}
    if(!entry)return null;
    graphs.delete(entry.id);graphs.set(entry.id,entry);counters.snapshotHits++;
    const fresh=!entry.restored&&exact?.id===entry.id&&exact.epoch===epoch&&Date.now()-exact.time<30000&&!entry.dynamic;
    return {id:entry.id,signature:entry.signature,graph:clone(entry.graph),fresh};
  }
  function put(path,settings,graph,signature,start){
    if(disposed||epoch!==start||graph.annotationAmbiguous)return null;
    const paths=[...new Set(graph.nodes.map(n=>n.filePath).filter(Boolean))];
    if(!paths.includes(path))return null;
    const bytes=JSON.stringify(graph).length*2+signature.length*2;if(bytes>maxGraphBytes)return null;
    let entry=[...graphs.values()].find(e=>(hydrating||!e.restored)&&e.settings===settings&&e.signature===signature);
    if(!entry){entry={id:'g'+(++serial),settings,graph:clone(graph),signature,paths,bytes,dynamic:graph.nodes.some(n=>n.nodeKey)};graphs.set(entry.id,entry);graphBytes+=bytes;for(const p of paths){if(!members.has(p))members.set(p,new Set());members.get(p).add(entry.id);}}
    else {graphs.delete(entry.id);graphs.set(entry.id,entry);}
    entry.restored=false;
    queries.set(JSON.stringify([path,settings]),{id:entry.id,epoch,time:Date.now()});
    while(queries.size>512)queries.delete(queries.keys().next().value);
    while(graphs.size>maxGraphs||graphBytes>maxGraphBytes)dropGraph(graphs.keys().next().value);
    schedule();return graphs.has(entry.id)?entry.id:null;
  }
  return {
    get epoch(){return epoch;},counters,parsed,find,put,invalidate,restore,persistNow,
    setEngine(source){if(engine&&engine!==source){store?.reset();clearTimeout(saveTimer);saveTimer=null;restoredEngine='';invalidate('engine');}engine=source;},
    hint(path,id){if(graphs.get(id)?.paths.includes(path))hint={path,id};},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    inspect(){return {epoch,files:files.size,fileBytes,graphs:graphs.size,graphBytes,queries:queries.size,members:members.size,listeners:listeners.size};},
    dispose(){disposed=true;epoch++;clearTimeout(saveTimer);saveTimer=null;store?.reset();clearFiles();for(const id of [...graphs.keys()])dropGraph(id);listeners.clear();hint=null;engine='';}
  };
}
module.exports={createSession};
