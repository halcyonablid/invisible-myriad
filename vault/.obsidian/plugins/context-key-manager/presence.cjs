'use strict';
// One durable namespace sentinel, not an operation log. Only explicit naming
// upgrade creates it. Keeping it outside the registry detects lost registry roots.
const fs=require('node:fs'),path=require('node:path'),{hash}=require('./v3-store.cjs');
const fail=x=>{throw Error(x)};
function stat(p){try{return fs.lstatSync(p)}catch(e){if(e.code==='ENOENT')return null;throw e}}
function location(store){let current=store.root;while(true){const st=stat(current);if(st?.isSymbolicLink())fail('presence-symlink');const parent=path.dirname(current);if(parent===current)break;current=parent}const p=path.join(path.dirname(store.root),path.basename(store.root)+'-presence.json');if(stat(p)?.isSymbolicLink())fail('presence-symlink');return p}
function read(store){const p=location(store),st=stat(p);if(!st)return null;if(!st.isFile()||st.size>1024)fail('presence-invalid');let x;try{x=JSON.parse(fs.readFileSync(p,'utf8'))}catch{fail('presence-invalid')}
 if(!x||Object.keys(x).sort().join('|')!=='namespace|version'||x.version!==1||!/^registry_[a-f0-9-]{36}$/.test(x.namespace))fail('presence-invalid');return x;
}
function inspect(store,state){
 let exists,marker;try{exists=!!stat(store.root);if(exists||stat(location(store)))state.seen=true;marker=read(store)}catch(e){state.seen=true;throw e}
 const frames=[];for(const name of ['current.json','mirror.json','pending.json']){const raw=store.read(name);if(!raw)continue;let x;try{x=JSON.parse(raw)}catch{continue}frames.push(...(name==='pending.json'?[x.base,x.target]:[x]))}
 for(const f of frames.filter(Boolean)){
  if(marker&&typeof f.state?.namespace==='string'&&f.state.namespace!==marker.namespace)fail('presence-namespace-conflict');
  if([4,6].includes(f.version)&&!marker)fail('presence-required-maintenance');
 }
 return {marker,exists,seen:state.seen,signature:hash({root:exists,marker,seen:state.seen,registry:store.scan().digest})};
}
function ensure(store,namespace){
 const old=read(store);if(old){if(old.namespace!==namespace)fail('presence-namespace-conflict');return}
 if(!/^registry_[a-f0-9-]{36}$/.test(namespace))fail('presence-namespace');const p=location(store),bytes=JSON.stringify({version:1,namespace});
 store.fault('before-presence-create');const fd=fs.openSync(p,'wx');try{store.fault('after-presence-open');fs.writeFileSync(fd,bytes,'utf8');store.fault('after-presence-write');fs.fsyncSync(fd);store.fault('after-presence-sync')}finally{fs.closeSync(fd)}
 if(read(store)?.namespace!==namespace)fail('presence-readback');store.fault('after-presence-readback');
}
module.exports={location,read,inspect,ensure};
