"use strict";
const fs=require('node:fs'),path=require('node:path');
const old=require('./v3-store.cjs'),model=require('./naming-model.cjs');
const {Store,hash,seal,uuid}=old;
const fail=x=>{throw Error(x);};
const publications=new WeakMap(),bindingEnabled=new WeakSet(),bindingChecks=new WeakMap();
const binding=require('./binding-model.cjs');
const bindingCommand=q=>q.kind==='upgrade-binding'||q.kind.startsWith('binding-');
const sync=fn=>{const r=fn();if(r&&typeof r.then==='function'){Promise.resolve(r).catch(()=>{});fail('sync-required')}if(r===false)fail('check-denied');};
class NamingStore extends Store {
  constructor(root,options={}){super(root,options);if(options.enableBinding===true)bindingEnabled.add(this);}
  assertWritable(){}
  beforeCommit(base,target,command,guard){guard();if(bindingCommand(command)){const check=bindingChecks.get(this);if(!bindingEnabled.has(this)||!check)fail('binding-check-required');sync(check);guard();}}
  lock(...args){this.assertWritable();const token=super.lock(...args),p=publications.get(this);if(p)p.token=token;return token;}
  execute(input,digest,guard=()=>{}){
    this.assertWritable();if(publications.has(this))fail('naming-writer-active');
    // The legacy controller may only publish fully replayed v3 intent. Naming
    // changes use exclusive(), never this older whole-operation entry point.
    const p=this.pending(JSON.stringify(input));
    if(p.target.version!==3||p.target.state.schemaVersion!==1||p.base&&(p.base.version!==3||p.base.state.schemaVersion!==1))fail('naming-exclusive-writer-required');
    this.assertKnownVersions();const status=this.status();
    if(status.digest!==digest)fail('store-changed');
    if(p.kind==='initialize'){if(status.status!=='unconfigured')fail('already-initialized');}
    else if(status.status!=='ready'||hash(status.frame)!==p.baseHash)fail('legacy-wal-base-changed');
    if(status.frame&&status.frame.version!==3)fail('legacy-writer-retired');
    let first=true;
    const check=()=>{
      this.assertWritable();guard();
      // Re-check after callbacks and lock acquisition. A valid old WAL must not
      // be paired with a fresh digest to erase or fork the current registry.
      const now=this.scan();
      for(const name of ['current.json','mirror.json']){
        const raw=now.raw[name],value=raw===null?null:hash(this.frame(JSON.parse(raw)));
        const allowed=first?[p.baseHash]:[p.baseHash,p.targetHash];
        if(!allowed.includes(value))fail('legacy-wal-base-changed');
      }
      if(first&&now.raw['pending.json'])fail('legacy-wal-already-pending');
      if(!first&&(!now.raw['pending.json']||hash(this.pending(now.raw['pending.json']))!==hash(p)))fail('legacy-wal-changed');
      first=false;
    };
    publications.set(this,{target:p.target,guard:check});
    try{return super.execute(p,digest,check)}finally{publications.delete(this)}
  }
  publish(name,frame){
    this.assertWritable();const p=publications.get(this);if(!p?.token)fail('naming-publication-permit-required');
    this.owned(p.token);p.guard();this.owned(p.token);this.frame(frame);
    if(!['current.json','mirror.json'].includes(name))fail('naming-publication-path');
    const expected=p.target||this.pending(this.read('pending.json')).target;
    if(hash(frame)!==hash(expected))fail('naming-publication-target');
    return super.publish(name,frame);
  }
  recover(plan,guard=()=>{}){
    this.assertWritable();if(publications.has(this))fail('naming-writer-active');
    const check=()=>{this.assertWritable();guard();};
    publications.set(this,{target:plan.kind==='pending'?plan.pending?.target:plan.target,guard:check});
    try{return super.recover(plan,check)}finally{publications.delete(this)}
  }
  frame(x) {
    const {checksum,...body}=x;if(checksum!==hash(body))fail('checksum-invalid');
    if(x.version===3){super.frame(x);return x;}
    if(!((x.version===4&&x.state?.schemaVersion===2)||(bindingEnabled.has(this)&&x.version===6&&x.state?.schemaVersion===4)))fail('frame-version-invalid');
    if(x.version===6)binding.validate(x.state);else model.validate(x.state);
    // Reuse v3 receipt, observation, capacity validation without accepting its writer.
    const legacy=seal({...body,version:3,state:model.bare(x.version===6?binding.prior(x.state):x.state)});super.frame(legacy);
    if(Buffer.byteLength(JSON.stringify(x))>this.maxBytes)fail('registry-capacity');return x;
  }
  assertKnownVersions(){
    require('./version-gate.cjs').inspect(this,true,bindingEnabled.has(this));
    // Unknown schemas may be newer data, not corrupt data. Do not let the old
    // parser's catch-and-classify path turn them into mirror-repair candidates.
    for(const name of ['current.json','mirror.json','pending.json']){
      const raw=this.read(name);if(!raw)continue;let x;try{x=JSON.parse(raw);}catch{continue;}
      const frames=name==='pending.json'?[x.base,x.target]:[x];
      for(const f of frames){if(!f||typeof f!=='object')continue;
        if(Object.hasOwn(f,'version')&&!(bindingEnabled.has(this)?[3,4,6]:[3,4]).includes(f.version))fail('unknown-frame-version');
        if(f.state&&Object.hasOwn(f.state,'schemaVersion')&&!(bindingEnabled.has(this)?[1,2,4]:[1,2]).includes(f.state.schemaVersion))fail('unknown-state-version');
      }
      if(name==='pending.json'&&Object.hasOwn(x,'version')&&x.version!==3)fail('unknown-pending-version');
    }
  }
  status(){this.assertKnownVersions();return super.status();}
  next(base,command,observation) {
    this.frame(base);
    if(['register','bind'].includes(command.kind)){
      if(base.version!==3||base.state.schemaVersion!==1)fail('legacy-writer-retired');
      return super.next(base,command,observation);
    }
    if(!/^r\d+_[0-9a-f-]{36}$/.test(command.requestId)||Number(command.requestId.slice(1).split('_')[0])!==command.expectedRevision)fail('request-revision-invalid');
    if(command.kind==='upgrade-binding'&&!bindingEnabled.has(this))fail('binding-not-enabled');
    const modern=base.version===6||command.kind==='upgrade-binding';
    const state=modern?binding.apply(base.state,command):model.apply(base.state,command);
    const observations=command.kind==='register-identity'?{...base.observations,[command.contextId]:JSON.parse(JSON.stringify(command.observation))}:base.observations;
    return this.frame(seal({version:modern?6:4,state,receipts:[...base.receipts,{requestId:command.requestId,commandHash:hash(command),revision:state.revision,...(command.contextId?{contextId:command.contextId}:{})}].slice(-128),observations}));
  }
  // The SAME v3 writer lock spans every awaited owner operation and every state
  // publication. A second controller/process cannot apply projections concurrently.
  async exclusive(task,guard=()=>{},expectedDigest=null) {
    this.assertWritable();if(publications.has(this))fail('naming-writer-active');
    const s=this.status();if(s.status!=='ready')fail(s.status);
    if(expectedDigest!==null&&s.digest!==expectedDigest)fail('store-changed');
    const token=this.lock(s.digest);let clean=false,frame=s.frame;
    const lease=()=>{this.owned(token);guard();};
    publications.set(this,{token,guard:()=>{this.assertWritable();lease();}});
    const commit=payload=>{
      lease();const raw=this.scan();
      if(raw.raw['pending.json']||hash(JSON.parse(raw.raw['current.json']))!==hash(frame)||hash(JSON.parse(raw.raw['mirror.json']))!==hash(frame))fail('exclusive-store-changed');
      const command={...payload,namespace:frame.state.namespace,expectedRevision:frame.state.revision,requestId:`r${frame.state.revision}_${uuid()}`};
      const target=this.next(frame,command);
      this.beforeCommit(frame,target,command,lease);lease();
      const p=seal({version:3,kind:'command',confirmed:true,namespace:frame.state.namespace,base:frame,baseHash:hash(frame),target,targetHash:hash(target),command,observation:null});
      this.write('pending.json',Buffer.from(JSON.stringify(p)),true);this.fault('after-pending');
      frame=this.finish(p,lease);return frame;
    };
    try{this.fault('after-lock');const result=await task({read:()=>frame,commit,guard:lease});lease();clean=true;return result;}
    finally{publications.delete(this);
      // C2 gate: an in-process failure keeps the writer lock (and so blocks every participant until maintenance)
      // only when the store cannot be proven consistent. Proven consistent = authority still open, lock still ours,
      // known versions (incl. presence), no WAL, and current/mirror both equal the last frame this transaction
      // published. Any exception while checking counts as "not proven". A crash never reaches this block.
      let release=clean;
      if(!clean){try{this.assertWritable();this.owned(token);this.assertKnownVersions();const now=this.scan();
        release=!now.raw['pending.json']&&!!now.raw['current.json']&&!!now.raw['mirror.json']&&hash(JSON.parse(now.raw['current.json']))===hash(frame)&&hash(JSON.parse(now.raw['mirror.json']))===hash(frame);}catch{release=false}}
      // The caller always sees the original error: a failure to remove the lock on the failure path is swallowed
      // (the lock simply stays and the store reports recovery-required, exactly as before).
      if(clean)this.release(token,true);else{try{this.release(token,release)}catch{}}
    }
  }
  // Internal only. Production adapter must supply its issued synchronous guard.
  async upgradeBinding(check){
    if(!bindingEnabled.has(this))fail('binding-not-enabled');if(typeof check!=='function')fail('check-required');
    return this.exclusive(tx=>{bindingChecks.set(this,check);try{return tx.commit({kind:'upgrade-binding'})}finally{bindingChecks.delete(this)}},()=>sync(check));
  }
  // C3 explicit upgrade (R3/R4): the previewed v4 base (digest, frame hash, namespace, revision) is re-checked inside the
  // writer lock before any WAL. Participant checks run once in beforeCommit, before the pending record exists. After
  // the WAL is written only lock ownership and host liveness are asserted: the fixed WAL target is replayed by
  // maintenance without calling any owner, so a participant change can no longer alter the outcome.
  async upgradeBindingFrom(expected,check,live){
    if(!bindingEnabled.has(this))fail('binding-not-enabled');if(typeof check!=='function'||typeof live!=='function')fail('check-required');
    if(!expected||typeof expected.digest!=='string'||typeof expected.frameHash!=='string')fail('upgrade-expected-required');
    return this.exclusive(tx=>{
      const f=tx.read();
      if(f.version!==4||hash(f)!==expected.frameHash||f.state.namespace!==expected.namespace||f.state.revision!==expected.revision||f.state.binding!==undefined)fail('upgrade-base-changed');
      bindingChecks.set(this,check);try{return tx.commit({kind:'upgrade-binding'})}finally{bindingChecks.delete(this)}
    },()=>sync(live),expected.digest);
  }
  // C3 Y1 explicit binding-format migration (1 -> 2) on a v6 store: same in-lock recheck and pre-WAL participant check
  // as upgradeBindingFrom; the WAL target is fixed, so only lock ownership and host liveness are asserted afterwards.
  async formatUpgradeFrom(expected,check,live){
    if(!bindingEnabled.has(this))fail('binding-not-enabled');if(typeof check!=='function'||typeof live!=='function')fail('check-required');
    if(!expected||typeof expected.digest!=='string'||typeof expected.frameHash!=='string')fail('upgrade-expected-required');
    return this.exclusive(tx=>{
      const f=tx.read();
      if(f.version!==6||hash(f)!==expected.frameHash||f.state.namespace!==expected.namespace||f.state.revision!==expected.revision||f.state.binding?.format!==1)fail('upgrade-base-changed');
      bindingChecks.set(this,check);try{return tx.commit({kind:'binding-format-upgrade'})}finally{bindingChecks.delete(this)}
    },()=>sync(live),expected.digest);
  }
  async bindingExclusive(contextId,task){
    if(!bindingEnabled.has(this))fail('binding-not-enabled');
    return this.exclusive(async tx=>{
      const read=()=>{const f=tx.read();if(f.version!==6)fail('binding-upgrade-required');const s=f.state,c=s.contexts.find(c=>c.contextId===contextId);if(!c)fail('context-missing');return JSON.parse(JSON.stringify({contextId,namespace:s.namespace,revision:s.revision,pending:s.binding.pending,completed:Object.fromEntries(s.binding.results.filter(r=>r.contextId===contextId&&r.status==='completed').map(r=>[r.txId,r.planHash])),bindings:c.bindings}))};
      read();return task({read,guard:tx.guard,commit:(q,check)=>{if(typeof check!=='function')fail('check-required');if(!['begin','finish','cancel'].includes(q.kind))fail('binding-command');bindingChecks.set(this,check);try{return tx.commit({...JSON.parse(JSON.stringify(q)),kind:'binding-'+q.kind,contextId})}finally{bindingChecks.delete(this)}}});
    });
  }
  // Naming WAL already fixes accepted intent/progress. Replaying it only repairs
  // the center snapshot; it NEVER invokes an owner or resumes projection work.
  previewRecovery(){this.assertKnownVersions();const p=super.previewRecovery();if(p.kind==='pending'&&[4,6].includes(p.pending.target.version))p.needsProvider=false;return p;}
}
module.exports={NamingStore,hash,uuid};
