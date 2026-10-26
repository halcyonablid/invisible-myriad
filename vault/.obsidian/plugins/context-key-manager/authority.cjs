'use strict';
// One authority for the entire registry, including while the writer owns its lock.
// No watcher turns the writer's own commits into external invalidations.
const {NamingStore,hash,uuid}=require('./naming-store.cjs');
const presence=require('./presence.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),fail=x=>{throw Error(x)};
const sessions=new WeakMap(),authorities=new WeakSet();
class CoordinatedStore extends NamingStore {
 // C1 R14: one frame read touches several files and each read re-walks every ancestor directory for links. Within one
 // synchronous run that walk cannot see a different answer than a walk right before the run, so it is done once per
 // run and forgotten at the next microtask. Every new run (and every await boundary) walks again.
 safe(){if(this.safeRun)return;super.safe();this.safeRun=true;queueMicrotask(()=>{this.safeRun=false})}
 assertWritable(){const owner=sessions.get(this);if(!owner||owner.closed)fail('authority-closed');}
 assertKnownVersions(){super.assertKnownVersions();presence.inspect(this,sessions.get(this));}
 status(){const s=super.status(),p=presence.inspect(this,sessions.get(this));if(s.status==='unconfigured'&&p.seen)return {...s,status:'storage-missing'};return s;}
 frame(frame){const f=super.frame(frame);if([4,6].includes(f.version)){const m=presence.read(this);if(!m)fail('presence-required-maintenance');if(m.namespace!==f.state.namespace)fail('presence-namespace-conflict')}return f;}
 next(base,command,observation){
  // Constructing a preview target is read-only; marker creation belongs to the
  // confirmed locked commit below, before any v4 WAL publication.
  if(command.kind==='upgrade-naming'){
   const plain=new NamingStore(this.root,{maxBytes:this.maxBytes,maxContexts:this.maxContexts});return plain.next(base,command,observation);
  }
  return super.next(base,command,observation);
 }
 beforeCommit(base,target,command,guard){super.beforeCommit(base,target,command,guard);guard();this.assertWritable();if(base.version===3&&target.version===4&&command.kind==='upgrade-naming')presence.ensure(this,target.state.namespace);this.assertKnownVersions();this.frame(target);guard();}
 async exclusive(task,guard=()=>{},expectedDigest=null){
  const owner=sessions.get(this);if(!owner||owner.closed)fail('authority-closed');
  return super.exclusive(async tx=>{
   if(owner.active)fail('authority-writer-already-active');
   const active={tx};owner.active=active;
   try{return await task(tx)}finally{if(owner.active===active)owner.active=null}
  },()=>{if(owner.closed)fail('authority-closed');guard()},expectedDigest);
 }
}
function createAuthority(root,options={}){
 const state={closed:false,active:null,generation:uuid(),seen:false},store=new CoordinatedStore(root,options),issued=new WeakMap(),availabilityProofs=new WeakMap();sessions.set(store,state);
 function current(){
  if(state.closed)fail('authority-closed');
  if(state.active){
   store.assertKnownVersions();
   const {tx}=state.active;tx.guard();const frame=tx.read(),raw=store.scan();
   // A runner never exposes its frame if disk or ownership drifted.
   if(raw.raw['pending.json']||hash(JSON.parse(raw.raw['current.json']))!==hash(frame)||hash(JSON.parse(raw.raw['mirror.json']))!==hash(frame))fail('authority-active-frame-drift');
   return {frame,digest:raw.digest};
  }
  const s=store.status();if(s.status!=='ready')fail('authority-'+s.status);return {frame:s.frame,digest:s.digest};
 }
 const api=Object.freeze({
  availability(){
   if(state.closed)fail('authority-closed');const p=presence.inspect(store,state),s=state.active?{status:'ready'}:store.status();
   const value={version:1,state:s.status==='unconfigured'&&!p.seen?'unconfigured':s.status==='ready'?'configured':'unavailable',generation:state.generation,reason:s.status};
   availabilityProofs.set(value,{signature:p.signature,hash:hash(value)});return value;
  },
  assertAvailability(value){const proof=availabilityProofs.get(value);if(state.closed)fail('authority-closed');if(!proof||proof.hash!==hash(value)||value.generation!==state.generation||proof.signature!==presence.inspect(store,state).signature)fail('authority-availability-stale');return true;},
  snapshot(){const s=current(),frame=s.frame;
   const result={version:frame.version===6?3:1,...(frame.version===6?{revision:frame.state.revision,binding:copy(frame.state.binding)}:{}),namespace:frame.state.namespace,generation:state.generation,contexts:frame.state.contexts.map(c=>({...copy(c),naming:copy(c.naming||{authority:'legacy',pending:null})}))};
   issued.set(result,{generation:state.generation,digest:s.digest,payloadHash:hash(result)});return result;
  },
  assertCurrent(snapshot){const proof=issued.get(snapshot);if(!proof||proof.generation!==state.generation||snapshot.generation!==state.generation||proof.payloadHash!==hash(snapshot))fail('authority-snapshot-unissued');const now=current();if(now.digest!==proof.digest||snapshot.namespace!==now.frame.state.namespace)fail('authority-snapshot-stale');return true;}
 });
 // The identity controller shares this reader and writer. It must bypass its
 // cached pre-runner frame while an exclusive naming transaction is active.
 const readView=()=>{if(state.closed)fail('authority-closed');if(state.active){const v=current();return {status:'ready',digest:v.digest,frame:copy(v.frame)}}return store.status();};
 const authority=Object.freeze({store,api,readView,get writing(){return !!state.active},close(){state.closed=true;state.generation=uuid();},get closed(){return state.closed}});authorities.add(authority);return authority;
}
module.exports={createAuthority,isAuthority:authority=>authorities.has(authority)};
