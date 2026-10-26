'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const fail=s=>{throw Error(s)},hash=s=>crypto.createHash('sha256').update(s).digest('hex');
// Local-vault implementation only. No async adapter read is treated as evidence
// at the synchronous final publication callback. No source names are guessed.
function createLocalIO(app,pluginDir,resolveScope,live){
 const base=app.vault.adapter.getBasePath?.();if(!base||!path.isAbsolute(base))fail('consumer-local-vault-required');const root=path.resolve(base);
 function location(relative){
  if(typeof relative!=='string'||!relative||relative.trim()!==relative||/^(?:[a-z]:|\/)/i.test(relative)||relative.includes('\\')||/[\x00-\x1f:<>"|?*]/.test(relative)||relative.split('/').some(x=>['','.','..'].includes(x)||/[. ]$/.test(x)))fail('consumer-unsafe-path');
  const p=path.resolve(root,...relative.split('/'));if(!p.startsWith(root+path.sep))fail('consumer-outside-vault');
  let test=p;while(true){let st;try{st=fs.lstatSync(test)}catch(e){if(e.code!=='ENOENT')throw e}if(st?.isSymbolicLink())fail('consumer-symlink');const parent=path.dirname(test);if(parent===test)break;test=parent}
  return p;
 }
 function read(relative){live();const p=location(relative),st=fs.lstatSync(p);if(!st.isFile()||st.size>8*1024*1024)fail('consumer-file-size');return fs.readFileSync(p,'utf8')}
 const backupRoot=pluginDir+'/center-rename-backups';location(backupRoot);
 return {
  resolveScope,
  sameFile(a,b){live();const x=location(a),y=location(b);if(!fs.existsSync(x)||!fs.existsSync(y))return false;const sx=fs.statSync(x,{bigint:true}),sy=fs.statSync(y,{bigint:true});return sx.dev===sy.dev&&sx.ino===sy.ino},
  read,
  readOptional(file){const p=location(file);live();try{fs.lstatSync(p)}catch(e){if(e.code==='ENOENT')return null;throw e}return read(file)},
  async backup(file,raw,txId){
   live();if(!/^[a-f0-9-]{36}$/.test(txId))fail('consumer-backup-transaction');if(read(file)!==raw)fail('consumer-backup-source-changed');
   const dir=location(backupRoot),relative=backupRoot+'/'+txId+'-'+hash(file).slice(0,16)+'-'+hash(raw)+'.json',dest=location(relative);
   if(fs.existsSync(dest)){if(read(relative)!==raw)fail('consumer-backup-conflict');return}
   const entries=fs.existsSync(dir)?fs.readdirSync(dir):[];let bytes=0;
   for(const name of entries){const p=location(backupRoot+'/'+name),s=fs.lstatSync(p);if(!s.isFile())fail('consumer-backup-structure');bytes+=s.size}
   if(entries.length>=64||bytes+Buffer.byteLength(raw)>64*1024*1024)fail('consumer-backup-capacity');
   live();fs.mkdirSync(dir,{recursive:true});const fd=fs.openSync(dest,'wx');try{fs.writeFileSync(fd,raw,'utf8');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}if(read(relative)!==raw)fail('consumer-backup-verification');
  },
  async process(file,callback){
   // No await between final authority/carrier validation and rename. Calling
   // vault.process would introduce an async publication gap after its callback.
   live();const dest=location(file),optional=()=>{try{fs.lstatSync(location(file))}catch(e){if(e.code==='ENOENT')return null;throw e}return read(file)},current=optional(),next=callback(current);
   if(typeof next!=='string'||Buffer.byteLength(next)>8*1024*1024)fail('consumer-file-size');
   const temp=file+'.center-'+crypto.randomUUID()+'.tmp',tempPath=location(temp);
   try{
    const fd=fs.openSync(tempPath,'wx');try{fs.writeFileSync(fd,next,'utf8');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
    live();if(optional()!==current)fail('consumer-process-disk-drift');
    // Invoke the private permission again at the actual final publication point.
    if(callback(current)!==next)fail('consumer-publication-changed');live();
    if(optional()!==current)fail('consumer-process-disk-drift');location(file);location(temp);
    if(current===null){fs.linkSync(tempPath,dest);fs.unlinkSync(tempPath)}else fs.renameSync(tempPath,dest);
   }finally{if(fs.existsSync(tempPath))fs.unlinkSync(tempPath)}
   const target=app.vault.getAbstractFileByPath?.(file);if(target)app.vault.trigger?.('modify',target);
   return next;
  }
 };
}
module.exports={createLocalIO};
