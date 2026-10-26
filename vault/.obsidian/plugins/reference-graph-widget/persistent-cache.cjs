'use strict';
// Plugin-private disposable evidence; never a business index or source of fresh graph truth.
function createStore(app, manifest, nodeRequire) {
  const fs=nodeRequire('fs').promises,path=nodeRequire('path'),crypto=nodeRequire('crypto');
  const maxBytes=24*1024*1024;let scope=null,directory='',filename='',sequence=0;
  const hash=value=>crypto.createHash('sha256').update(value,'utf8').digest('hex');
  const relative=p=>typeof p==='string'&&!!p&&!p.includes('\\')&&!path.isAbsolute(p)&&!p.split('/').some(s=>!s||s==='.'||s==='..')&&!/^[A-Za-z]:/.test(p);
  const nativeValid=n=>Array.isArray(n)&&n.length===7&&n.every(v=>typeof v==='string'&&/^\d+$/.test(v))&&[0,1,4,5,6].every(i=>BigInt(n[i])>0n);
  const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const line=n=>Number.isSafeInteger(n)&&n>0;
  function bodyValid(v){return plain(v)&&Object.keys(v).every(k=>['links','annotations','warnings'].includes(k))&&Array.isArray(v.links)&&Array.isArray(v.annotations)&&Array.isArray(v.warnings)&&v.links.length+v.annotations.length+v.warnings.length<=100000
    &&v.links.every(x=>plain(x)&&typeof x.target==='string'&&line(x.line))
    &&v.annotations.every(x=>plain(x)&&typeof x.target==='string'&&['关系','自指'].includes(x.kind)&&typeof x.text==='string'&&line(x.line)&&line(x.referenceLine))
    &&v.warnings.every(x=>plain(x)&&line(x.line)&&typeof x.reason==='string');}
  function fileValid(e){return plain(e)&&relative(e.path)&&/\.(md|excalidraw)$/i.test(e.path)&&typeof e.stamp==='string'&&/^\d+(\.\d+)?:\d+$/.test(e.stamp)&&typeof e.parserHash==='string'&&/^[a-f0-9]{64}$/.test(e.parserHash)&&nativeValid(e.native)&&bodyValid(e.value);}
  function graphValid(e){
    if(!plain(e)||typeof e.settings!=='string'||e.settings.length>65536||typeof e.signature!=='string'||!plain(e.graph)||e.graph.annotationAmbiguous)return false;
    try{const settings=JSON.parse(e.settings);if(!Array.isArray(settings)||settings.length!==2||!settings.every(plain))return false;}catch(_){return false;}
    const g=e.graph;if(!Array.isArray(g.nodes)||!Array.isArray(g.edges)||!plain(g.stats)||g.nodes.length>10000||g.edges.length>50000)return false;
    const ids=new Set();for(const n of g.nodes){if(!plain(n)||typeof n.id!=='string'||!n.id||ids.has(n.id)||(n.filePath!=null&&n.filePath!==''&&!relative(n.filePath)))return false;ids.add(n.id);}
    if(!g.nodes.every(n=>['name','atomCode','nodeKey'].every(k=>n[k]==null||typeof n[k]==='string')&&(n.comments==null||(Array.isArray(n.comments)&&n.comments.every(c=>plain(c)&&typeof c.text==='string'&&typeof c.targetId==='string'&&line(c.line))))&&(n.annotationWarnings==null||(Array.isArray(n.annotationWarnings)&&n.annotationWarnings.every(w=>plain(w)&&line(w.line)&&typeof w.reason==='string')))))return false;
    if(!g.edges.every(x=>plain(x)&&typeof x.from==='string'&&typeof x.to==='string'&&ids.has(x.from)&&ids.has(x.to)&&(x.labels==null||(Array.isArray(x.labels)&&x.labels.every(v=>typeof v==='string')))&&(x.evidence==null||(Array.isArray(x.evidence)&&x.evidence.every(v=>plain(v)&&line(v.line)&&typeof v.text==='string'&&relative(v.filePath))))))return false;
    if(!['totalNodes','totalEdges','maxLevel'].every(k=>Number.isSafeInteger(g.stats[k])&&g.stats[k]>=0))return false;
    if(!Array.isArray(e.queries)||e.queries.length>512||!e.queries.every(q=>relative(q)&&g.nodes.some(n=>n.filePath===q)))return false;
    return true;
  }
  function payloadValid(data){return plain(data)&&Array.isArray(data.files)&&data.files.length<=512&&data.files.every(fileValid)&&new Set(data.files.map(e=>e.path)).size===data.files.length&&Array.isArray(data.graphs)&&data.graphs.length<=16&&data.graphs.every(graphValid)
    &&Buffer.byteLength(JSON.stringify(data.files),'utf8')<=16*1024*1024&&Buffer.byteLength(JSON.stringify(data.graphs),'utf8')<=8*1024*1024;}
  async function init(engine,guard){
    const token=++sequence;scope=null;const base=app.vault.adapter?.getBasePath?.()||app.vault.adapter?.basePath;if(!base||!manifest.dir||!guard())return false;
    const vault=await fs.realpath(base),dir=await fs.realpath(path.resolve(vault,manifest.dir));if(!guard()||token!==sequence||vault.startsWith('\\\\')||!dir.startsWith(vault+path.sep))return false;
    const probe=path.join(dir,'.reference-cache-probe-'+crypto.randomBytes(8).toString('hex'));let created=false,device;
    try{await fs.writeFile(probe,'0',{flag:'wx',mode:0o600});created=true;const a=await fs.stat(probe,{bigint:true});await new Promise(r=>setTimeout(r,20));if(!guard())return false;await fs.writeFile(probe,'1');await fs.utimes(probe,Number(a.atimeNs)/1e9,Number(a.mtimeNs)/1e9);const b=await fs.stat(probe,{bigint:true});if(a.dev<=0n||a.ino<=0n||a.birthtimeNs<=0n||b.ctimeNs<=a.ctimeNs||a.dev!==b.dev||a.ino!==b.ino||a.birthtimeNs!==b.birthtimeNs||a.size!==b.size)return false;device=String(a.dev)}finally{if(created)await fs.unlink(probe).catch(()=>{})}
    if(!guard()||token!==sequence)return false;directory=dir;filename=path.join(dir,'session-snapshot.json');scope={version:1,vault,directory,device,engineHash:hash(engine),pluginVersion:manifest.version,platform:nodeRequire('process').platform};return true;
  }
  async function proof(file){const current=scope;if(!current||!relative(file))return null;try{const real=await fs.realpath(path.join(current.vault,file));if(!real.startsWith(current.vault+path.sep))return null;const s=await fs.stat(real,{bigint:true}),n=[s.dev,s.ino,s.size,s.mode,s.birthtimeNs,s.ctimeNs,s.mtimeNs].map(String);return current===scope&&s.isFile()&&String(s.dev)===current.device&&nativeValid(n)?n:null}catch(_){return null}}
  async function load(guard){const current=scope;if(!current||!guard())return null;try{const st=await fs.stat(filename);if(!st.isFile()||st.size>maxBytes||!guard())return null;const bytes=await fs.readFile(filename);if(bytes.length>maxBytes||!guard()||scope!==current)return null;const envelope=JSON.parse(bytes.toString('utf8')),p=envelope.payload;if(!plain(p)||hash(JSON.stringify(p))!==envelope.sha256||JSON.stringify(p.scope)!==JSON.stringify(current)||!payloadValid(p.data))return null;return p.data}catch(e){if(e.code!=='ENOENT')console.warn('[ReferenceGraphWidget][persistent-cache.ignored]',{reason:e.code||'invalid-cache'});return null}}
  async function save(data,guard){const current=scope;if(!current||!guard()||!payloadValid(data))return false;const payload={scope:current,data},raw=JSON.stringify({payload,sha256:hash(JSON.stringify(payload))});if(Buffer.byteLength(raw,'utf8')>maxBytes)return false;const temp=path.join(directory,'.session-snapshot-'+crypto.randomBytes(8).toString('hex')+'.tmp');let created=false;try{if(!guard())return false;await fs.writeFile(temp,raw,{flag:'wx',mode:0o600});created=true;if(!guard()||current!==scope)return false;if(await fs.readFile(temp,'utf8')!==raw)throw Error('readback');if(!guard()||current!==scope)return false;await fs.rename(temp,filename);created=false;return guard()&&current===scope&&await fs.readFile(filename,'utf8')===raw}finally{if(created)await fs.unlink(temp).catch(()=>{})}}
  return {init,proof,load,save,hash,fileValid,graphValid,bodyValid,ready:()=>!!scope,reset(){sequence++;scope=null},same:(a,b)=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>v===b[i])};
}
module.exports={createStore};
