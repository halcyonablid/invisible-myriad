'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
exports.open=function(owner,source){
 const vault=owner.app.vault.adapter.getBasePath?.();if(!vault)throw Error('BOARD_DRAFT_VAULT');
 const base=path.resolve(vault),dir=path.resolve(base,owner.manifest.dir||`${owner.app.vault.configDir||'.obsidian'}/plugins/mandala-time-blocks`);
 const relative=path.relative(base,dir);if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw Error('BOARD_DRAFT_PATH');
 const folder=path.join(dir,'.board-create-drafts-v1');fs.mkdirSync(folder,{recursive:true});
 const file=path.join(folder,crypto.createHash('sha256').update(JSON.stringify([base,source])).digest('hex')+'.json');
 const valid=d=>d?.version===1&&d.source===source&&typeof d.title==='string'&&d.title.length<=120&&/^board-[0-9a-f-]{36}$/.test(d.id)&&/^board-request-[0-9a-f-]{36}$/.test(d.requestId);
 if(!fs.existsSync(file)){
  const d={version:1,source,title:'',id:'board-'+crypto.randomUUID(),requestId:'board-request-'+crypto.randomUUID()};
  try{fs.writeFileSync(file,JSON.stringify(d),{encoding:'utf8',flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}
 }
 let raw=fs.readFileSync(file,'utf8'),value=JSON.parse(raw);if(!valid(value))throw Error('BOARD_DRAFT_INVALID');
 const check=()=>{if(fs.readFileSync(file,'utf8')!==raw)throw Error('BOARD_DRAFT_CHANGED')};
 return {get value(){return JSON.parse(JSON.stringify(value))},save(title){check();const next={...value,title};if(!valid(next))throw Error('BOARD_DRAFT_INPUT');
  const encoded=JSON.stringify(next),temp=file+'.'+crypto.randomUUID()+'.tmp';
  fs.writeFileSync(temp,encoded,{encoding:'utf8',flag:'wx'});try{check();fs.renameSync(temp,file)}catch(e){try{fs.unlinkSync(temp)}catch(_){}throw e}raw=encoded;value=next;
 },flush(){check();const fd=fs.openSync(file,'r+');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}check();},clear(){check();fs.unlinkSync(file)}};
};
