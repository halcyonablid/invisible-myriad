"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),model=require('./identity-model.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x)), uuid=()=>crypto.randomUUID();
const live=globalThis[Symbol.for('context-identity.v3.writers')] ||= new Set();
const files=['current.json','mirror.json','pending.json','writer.lock'];
const fail=s=>{throw Error(s);};
function seal(body){return {...body,checksum:hash(body)};}
function unseal(x){const {checksum,...body}=x;if(checksum!==hash(body))fail('checksum-invalid');return body;}
class Store {
 constructor(root,options={}){if(!path.isAbsolute(root))fail('absolute-store-required');this.root=path.resolve(root);this.maxBytes=options.maxBytes||16*1024*1024;this.maxContexts=options.maxContexts||5000;this.fault=options.fault||(()=>{});}
 safe(){let p=this.root;while(true){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('symlink-store-forbidden');const parent=path.dirname(p);if(parent===p)break;p=parent;}}
 read(name){this.safe();const p=path.join(this.root,name);if(!fs.existsSync(p))return null;const st=fs.lstatSync(p);if(!st.isFile()||st.isSymbolicLink()||st.size>this.maxBytes*3)fail('unsafe-or-oversize-file');return fs.readFileSync(p);}
 scan(){const raw=Object.fromEntries(files.map(n=>[n,this.read(n)]));return {raw,digest:hash(files.map(n=>[n,raw[n]===null?null:hash(raw[n])]))};}
 signature(){this.safe();return hash(files.map(n=>{try{const s=fs.lstatSync(path.join(this.root,n));return [n,s.ino,s.size,s.mtimeMs,s.ctimeMs,s.isSymbolicLink()];}catch(e){if(e.code==='ENOENT')return [n,null];throw e;}}));}
 frame(x){unseal(x);if(x.version!==3)fail('frame-version-invalid');model.validate(x.state);if(!Array.isArray(x.receipts)||x.receipts.length>128||!x.observations||typeof x.observations!=='object'||Array.isArray(x.observations))fail('frame-schema-invalid');if(x.state.contexts.length>this.maxContexts||Buffer.byteLength(JSON.stringify(x))>this.maxBytes)fail('registry-capacity');const ids=new Set();for(const r of x.receipts){if(!/^r\d+_[0-9a-f-]{36}$/.test(r.requestId)||!Number.isSafeInteger(r.revision)||r.revision<1||r.revision>x.state.revision||Number(r.requestId.slice(1).split('_')[0])!==r.revision-1||ids.has(r.requestId)||!/^\w{64}$/.test(r.commandHash))fail('receipt-invalid');ids.add(r.requestId);}for(const c of x.state.contexts){const o=x.observations[c.contextId];if(!o||o.kind!=='committed-owner-observation'||!/^\w{64}$/.test(o.digest)||typeof o.observedAt!=='string')fail('observation-invalid');}return x;}
 parsed(raw){if(raw===null)return null;try{return this.frame(JSON.parse(raw));}catch(e){return {error:e.message};}}
 next(base,command,observation){if(!/^r\d+_[0-9a-f-]{36}$/.test(command.requestId)||Number(command.requestId.slice(1).split('_')[0])!==command.expectedRevision)fail('request-revision-invalid');const state=model.apply(base.state,command);const observations={...base.observations,[command.contextId]:clone(observation)};return this.frame(seal({version:3,state,receipts:[...base.receipts,{requestId:command.requestId,commandHash:hash(command),revision:state.revision,contextId:command.contextId}].slice(-128),observations}));}
 pending(raw){const p=JSON.parse(raw);unseal(p);if(p.version!==3||p.confirmed!==true)fail('pending-unconfirmed');this.frame(p.target);if(p.targetHash!==hash(p.target)||p.namespace!==p.target.state.namespace)fail('pending-target-invalid');if(p.kind==='initialize'){if(p.base!==null||p.baseHash!==null||p.command!==null||p.target.state.revision!==0||p.target.state.contexts.length||p.target.receipts.length||Object.keys(p.target.observations).length)fail('pending-init-invalid');}else if(p.kind==='command'){this.frame(p.base);if(hash(p.base)!==p.baseHash||p.base.state.namespace!==p.namespace||hash(this.next(p.base,p.command,p.observation))!==p.targetHash)fail('pending-replay-invalid');}else fail('pending-kind-invalid');return p;}
 status(){const s=this.scan(),a=this.parsed(s.raw['current.json']),b=this.parsed(s.raw['mirror.json']);if(s.raw['writer.lock']||s.raw['pending.json'])return {status:'recovery-required',digest:s.digest};if(!a&&!b)return {status:fs.existsSync(this.root)?'storage-missing':'unconfigured',digest:s.digest};if(a&&!a.error&&b&&!b.error&&a.checksum===b.checksum)return {status:'ready',digest:s.digest,frame:a};return {status:'recovery-required',digest:s.digest};}
 lockRecord(raw){if(!raw||raw.length>2048)fail('lock-invalid');const x=JSON.parse(raw);if(!Number.isInteger(x.pid)||x.pid<=0||!/^[0-9a-f-]{36}$/.test(x.token))fail('lock-invalid');return x;}
 dead(record){if(live.has(record.token))fail('writer-active');if(record.pid!==process.pid){try{process.kill(record.pid,0);fail('writer-active');}catch(e){if(e.code!=='ESRCH')throw e;}}}
 owned(token){const raw=this.read('writer.lock');if(!raw||this.lockRecord(raw).token!==token||!live.has(token))fail('writer-ownership-lost');}
 lock(expected,allowStale=false,initialization=null){
  this.safe();const rootExisted=fs.existsSync(this.root),initial=this.scan();if(initial.digest!==expected)fail('store-changed');
  fs.mkdirSync(this.root,{recursive:true});
  const extras=fs.readdirSync(this.root).filter(n=>/^(lock-|reclaim-)/.test(n));if(extras.length>=32)fail('abandoned-lock-capacity-external-maintenance-required');
  const old=initial.raw['writer.lock'],token=uuid(),ticket='lock-'+token+'.tmp',claims=[];let acquired=false,claimed=false;
  if(old&&!allowStale)fail('writer-locked');live.add(token);
  try {
   const initAllowed=initialization&&(!rootExisted||(old&&allowStale&&this.lockRecord(old).intent==='initialize'&&this.lockRecord(old).namespace===initialization.namespace));
   this.write(ticket,Buffer.from(JSON.stringify({pid:process.pid,token,intent:initAllowed?'initialize':'write',namespace:initAllowed?initialization.namespace:null})),true);
   this.fault('after-lock-ticket');
   if(old){
    let record=this.lockRecord(old);this.dead(record);
    for(let depth=0;;depth++){
     if(depth>=8)fail('recovery-claim-capacity');
     const claim='reclaim-'+record.token+'.json';
     try{fs.linkSync(path.join(this.root,ticket),path.join(this.root,claim));claims.push(claim);claimed=true;this.fault('after-reclaim');break;}
     catch(e){if(e.code!=='EEXIST')throw e;record=this.lockRecord(this.read(claim));this.dead(record);claims.push(claim);}
    }
    // The immutable token-specific claim serializes every remover of this old lock.
    // A dead claim is followed through another exclusive claim, never overwritten.
    if(hash(this.read('writer.lock')||'')!==hash(old))fail('writer-lock-changed');
    if(this.scan().digest!==expected)fail('store-changed');
    fs.unlinkSync(path.join(this.root,'writer.lock'));this.fault('after-old-lock-remove');
   }
   fs.linkSync(path.join(this.root,ticket),path.join(this.root,'writer.lock'));acquired=true;
   this.owned(token);
   const locked=this.scan();
   for(const name of files.slice(0,3))if(hash(locked.raw[name]||'')!==hash(initial.raw[name]||''))fail('store-changed-after-lock');
   return token;
  } catch(e){if(acquired)this.release(token,true);else live.delete(token);throw e;}
  finally {
   if(fs.existsSync(path.join(this.root,ticket)))fs.unlinkSync(path.join(this.root,ticket));
   // An unsuccessful contender must not remove another contender's claim.
   if(!claimed||(old&&hash(this.read('writer.lock')||'')===hash(old)))claims.length=0;
   for(const claim of claims.reverse()){
    const raw=this.read(claim);if(!raw)continue;const r=this.lockRecord(raw);
    if(r.token!==token){try{this.dead(r);}catch{continue;}}
    fs.unlinkSync(path.join(this.root,claim));
   }
  }
 }

 write(name,bytes,exclusive=false){const p=path.join(this.root,name);if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('symlink-file-forbidden');const fd=fs.openSync(p,exclusive?'wx':'w');try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
 publish(name,frame){const temp=name+'.tmp';this.write(temp,Buffer.from(JSON.stringify(frame)));fs.renameSync(path.join(this.root,temp),path.join(this.root,name));}
 release(token,success){live.delete(token);if(success){const raw=this.read('writer.lock');if(raw&&JSON.parse(raw).token===token)fs.unlinkSync(path.join(this.root,'writer.lock'));}}
 finish(p,guard){guard();this.publish('current.json',p.target);this.fault('after-current');guard();this.publish('mirror.json',p.target);this.fault('after-mirror');if(hash(JSON.parse(this.read('current.json')))!==p.targetHash||hash(JSON.parse(this.read('mirror.json')))!==p.targetHash)fail('readback-failed');this.fault('after-readback');fs.unlinkSync(path.join(this.root,'pending.json'));this.fault('after-pending-remove');return p.target;}
 execute(p,digest,guard=()=>{}){let success=false;const token=this.lock(digest,false,p.kind==='initialize'?{namespace:p.namespace}:null);try{this.fault('after-lock');guard();this.write('pending.json',Buffer.from(JSON.stringify(p)),true);this.fault('after-pending');const frame=this.finish(p,()=>{this.owned(token);guard();});success=true;return frame;}finally{this.release(token,success);}}
 initialize(namespace,digest,guard){if(!/^registry_[0-9a-f-]{36}$/.test(namespace))fail('namespace-invalid');if(this.status().status!=='unconfigured')fail('already-initialized');const target=seal({version:3,state:model.empty(namespace),receipts:[],observations:{}});return this.execute(seal({version:3,kind:'initialize',confirmed:true,namespace,base:null,baseHash:null,target,targetHash:hash(target),command:null}),digest,guard);}
 commit(command,observation,digest,guard){const s=this.status();if(s.status!=='ready')fail(s.status);const old=s.frame.receipts.find(r=>r.requestId===command.requestId);if(old){if(old.commandHash!==hash(command))fail('request-reused');return s.frame;}if(s.digest!==digest)fail('store-changed');const target=this.next(s.frame,command,observation);return this.execute(seal({version:3,kind:'command',confirmed:true,namespace:s.frame.state.namespace,base:s.frame,baseHash:hash(s.frame),target,targetHash:hash(target),command:clone(command),observation:clone(observation)}),digest,guard);}
 previewRecovery(){const s=this.scan(),a=this.parsed(s.raw['current.json']),b=this.parsed(s.raw['mirror.json']);const valid=[a,b].filter(x=>x&&!x.error);let p=null;if(s.raw['pending.json'])p=this.pending(s.raw['pending.json']);if(p){for(const f of valid){if(f.state.namespace!==p.namespace)fail('namespace-conflict');if(![p.baseHash,p.targetHash].includes(hash(f)))fail('pending-fork');}const published=valid.some(f=>hash(f)===p.targetHash);return {digest:s.digest,kind:'pending',pending:p,needsProvider:p.kind==='command'&&!published};}if(valid.length===2&&a.checksum!==b.checksum)fail('unproven-fork');if(!valid.length){if(!a&&!b&&s.raw['writer.lock']){const lock=this.lockRecord(s.raw['writer.lock']);if(lock.intent!=='initialize'||!/^registry_[0-9a-f-]{36}$/.test(lock.namespace))fail('no-provable-snapshot');return {digest:s.digest,kind:'empty-initialize',target:seal({version:3,state:model.empty(lock.namespace),receipts:[],observations:{}}),needsProvider:false};}fail('no-provable-snapshot');}return {digest:s.digest,kind:valid.length===2?'unlock':'mirror-repair',target:valid[0],needsProvider:false};}
 recover(plan,guard=()=>{}){if(this.scan().digest!==plan.digest)fail('store-changed');const fresh=this.previewRecovery();if(hash(fresh)!==hash(plan))fail('recovery-plan-changed');const before=this.scan();let success=false;const token=this.lock(plan.digest,true,plan.kind==='empty-initialize'?{namespace:plan.target.state.namespace}:null);try{const originalGuard=guard;guard=()=>{this.owned(token);originalGuard();};guard();const recovery=path.join(this.root,'recovery');if(fs.existsSync(recovery)&&fs.lstatSync(recovery).isSymbolicLink())fail('symlink-recovery-forbidden');fs.mkdirSync(recovery,{recursive:true});if(fs.readdirSync(recovery).length>=4)fail('recovery-backup-capacity');const dest=path.join(recovery,uuid());fs.mkdirSync(dest);const hashes={};for(const n of files){const raw=before.raw[n];if(raw){const fd=fs.openSync(path.join(dest,n),'wx');try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}hashes[n]=hash(raw);}}for(const n of fs.readdirSync(this.root).filter(n=>/^(?:lock-[0-9a-f-]{36}\.tmp|reclaim-[0-9a-f-]{36}\.json)$/.test(n))){const raw=this.read(n);const r=this.lockRecord(raw);try{this.dead(r);}catch{continue;}const fd=fs.openSync(path.join(dest,n),'wx');try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}hashes[n]=hash(raw);if(hash(this.read(n))!==hash(raw))fail('abandoned-lock-changed');fs.unlinkSync(path.join(this.root,n));}fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({sourceDigest:plan.digest,hashes}));this.fault('after-repair-backup');let result;if(plan.kind==='pending')result=this.finish(plan.pending,guard);else{this.publish('current.json',plan.target);this.fault('repair-after-current');guard();this.publish('mirror.json',plan.target);this.fault('repair-after-mirror');if(hash(JSON.parse(this.read('current.json')))!==hash(plan.target)||hash(JSON.parse(this.read('mirror.json')))!==hash(plan.target))fail('repair-readback-failed');result=plan.target;}success=true;return result;}finally{this.release(token,success);}}
}
module.exports={Store,hash,seal,uuid,model};
