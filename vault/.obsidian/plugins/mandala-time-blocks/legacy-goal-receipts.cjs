'use strict';
const {createHash}=require('node:crypto');
const fail=x=>{throw Error(x)},plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':plain(x)?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex'),same=(a,b)=>stable(a)===stable(b);
const fields=(x,keys)=>{if(!plain(x)||Object.keys(x).sort().join('|')!==keys.slice().sort().join('|'))fail('LEGACY_GOAL_SCHEMA')};
function descriptor(x){fields(x,['receiptHash','lineageHash']);if(!Object.values(x).every(v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)))fail('LEGACY_GOAL_DIGEST');return x;}
const label=x=>{if(typeof x!=='string'||x!==x.trim()||x.length>512||/[\x00-\x1f]/.test(x))fail('LEGACY_GOAL_LABEL');const m=/^([0-9]{3}[a-zA-Z0-9]*)\s*[-－—]\s*\S/.exec(x);if(!m)fail('LEGACY_GOAL_LABEL');return m[1].toUpperCase()};
function evidence(list,subject,owner){
 if(list===undefined)return undefined;
 if(!['peo','mandala'].includes(owner)||subject?.domain!=='goal'||subject.ownerId!=='mandala-time-blocks')fail('LEGACY_GOAL_SUBJECT');
 let id;try{id=decodeURIComponent(subject.primaryNodeKey.split('|')[4])}catch{fail('LEGACY_GOAL_SUBJECT')}
 if(subject.primaryNodeKey!=='jump:v1:'+['mandala-time-blocks',subject.sourceScope,'node','mandala',id].map(encodeURIComponent).join('|')||!id||id==='root')fail('LEGACY_GOAL_SUBJECT');
 if(!Array.isArray(list)||!list.length||list.length>256)fail('LEGACY_GOAL_CHAIN');const seen=new Set(),lineage=[];
 for(let i=0;i<list.length;i++){const r=list[i];fields(r,['version','txId',owner==='peo'?'nodeKey':'nodeId','sourceNotePath','oldLabel','newLabel']);
  if(r.version!==1||r.sourceNotePath!==subject.sourceScope||(owner==='peo'?r.nodeKey!==subject.primaryNodeKey:r.nodeId!==id)||typeof r.txId!=='string'||!/^goal-rename-[a-zA-Z0-9-]{8,80}$/.test(r.txId)||seen.has(r.txId)||label(r.oldLabel)!==label(r.newLabel)||r.oldLabel.toLowerCase()===r.newLabel.toLowerCase()||i&&list[i-1].newLabel!==r.oldLabel)fail('LEGACY_GOAL_CHAIN');seen.add(r.txId);
  lineage.push({version:r.version,txId:r.txId,sourceNotePath:r.sourceNotePath,oldLabel:r.oldLabel,newLabel:r.newLabel});
 }return {receiptHash:hash(list),lineageHash:hash(lineage)};
}
function match(list,subject,owner,expected){if(expected!==undefined)descriptor(expected);const actual=evidence(list,subject,owner);if(!same(actual,expected))fail('LEGACY_GOAL_EVIDENCE_CHANGED');return actual;}
function entry(data,field,key){if(!Object.hasOwn(data,field))return undefined;if(!plain(data[field]))fail('LEGACY_GOAL_CONTAINER');return Object.hasOwn(data[field],key)?data[field][key]:undefined;}
module.exports={descriptor,evidence,match,entry,hash,same};
