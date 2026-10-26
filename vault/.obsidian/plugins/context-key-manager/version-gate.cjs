'use strict';
const fail=x=>{throw Error(x)};
function inspect(store,allowNaming=false,allowBinding=false){
 if(allowBinding===true&&allowNaming!==true)fail('binding-version-requires-naming');
 const binding=allowNaming===true&&allowBinding===true;
 const frames=[];let pending=false;
 for(const name of ['current.json','mirror.json','pending.json']){
  const raw=store.read(name);if(raw===null)continue;
  let x;try{x=JSON.parse(raw)}catch{continue}
  if(!x||typeof x!=='object')continue;
  if(name==='pending.json'){
   pending=true;
   if(Object.hasOwn(x,'version')&&x.version!==3)fail('unsupported-pending-version');
  }
  const values=name==='pending.json'?[x.base,x.target]:[x];
  for(const f of values){
   if(!f||typeof f!=='object')continue;
   const v=f.version,s=f.state?.schemaVersion;
   if(Object.hasOwn(f,'version')&&!(v===3||allowNaming&&v===4||binding&&v===6))fail('unsupported-frame-version');
   if(f.state&&Object.hasOwn(f.state,'schemaVersion')&&!(s===1||allowNaming&&s===2||binding&&s===4))fail('unsupported-state-version');
   if(v!==undefined&&s!==undefined&&!((v===3&&s===1)||(allowNaming&&v===4&&s===2)||(binding&&v===6&&s===4)))fail('frame-state-version-mismatch');
   if(binding&&v===6&&f.state&&Object.hasOwn(f.state,'binding')&&!require('./binding-transition.cjs').READABLE_FORMATS.includes(f.state.binding?.format))fail('unsupported-binding-format');
   if(name!=='pending.json'&&v!==undefined)frames.push(v);
  }
 }
 if(allowNaming&&new Set(frames).size>1){
  // A raw WAL is not proof. Original replay/slot/namespace validation must pass.
  if(!pending)fail('mixed-version-without-wal');
  const p=store.pending(store.read('pending.json'));
  if(p.kind!=='command'||!((p.base?.version===3&&p.target?.version===4)||(binding&&p.base?.version===4&&p.target?.version===6&&p.command?.kind==='upgrade-binding')))fail('mixed-version-without-upgrade-wal');
  const {hash}=require('./v3-store.cjs');
  for(const name of ['current.json','mirror.json']){
   const raw=store.read(name);if(raw===null)continue;
   let f;try{f=JSON.parse(raw)}catch{continue}
   if(![p.baseHash,p.targetHash].includes(hash(f)))fail('mixed-version-wal-slot-conflict');
  }
 }
}
module.exports={inspect};
