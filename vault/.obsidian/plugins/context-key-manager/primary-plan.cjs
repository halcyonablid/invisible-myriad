'use strict';
const {createHash}=require('node:crypto');
const L=require('./legacy-goal-receipts.cjs');
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const fail=x=>{throw Error(x)},fields=(x,ks)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join('|')!==ks.slice().sort().join('|'))fail('MANDALA_PLAN_SCHEMA')};
const path=p=>{if(typeof p!=='string'||!p||p.length>2048||p!==p.trim()||/[\\:\x00-\x1f]/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'))fail('MANDALA_PLAN_PATH');return p};
function subject(s){fields(s,['domain','ownerId','sourceScope','primaryNodeKey']);path(s.sourceScope);if(s.domain!=='goal'||s.ownerId!=='mandala-time-blocks'||typeof s.primaryNodeKey!=='string')fail('MANDALA_PLAN_SUBJECT');let parts;try{parts=s.primaryNodeKey.slice(8).split('|').map(decodeURIComponent)}catch{fail('MANDALA_PLAN_SUBJECT')}
 if(!s.primaryNodeKey.startsWith('jump:v1:')||parts.length!==5||parts[0]!==s.ownerId||parts[1]!==s.sourceScope||parts[2]!=='node'||parts[3]!=='mandala'||!parts[4]||parts[4]==='root'||parts[4]!==parts[4].trim()||/[\x00-\x1f]/.test(parts[4])||s.primaryNodeKey.slice(8)!==parts.map(encodeURIComponent).join('|'))fail('MANDALA_PLAN_SUBJECT');return parts[4];}
const label=s=>{if(typeof s!=='string'||s!==s.trim()||s.length>512||/[\x00-\x1f]/.test(s))fail('MANDALA_PLAN_LABEL');const m=/^([0-9]{3}[a-zA-Z0-9]*)\s*[-－—]\s*(\S.*)$/.exec(s);if(!m)fail('MANDALA_PLAN_LABEL');return m[1].toUpperCase()};
const digest=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const receiptKey=p=>hash([p.ownerId,p.subject,p.oldLabel,p.newLabel,p.preconditionHash]);
function validate(p){fields(p,['version','ownerId','subject','oldLabel','newLabel','sourcePaths','before','preconditionHash','receiptKey',...(p.version===3?['legacy']:[])]);subject(p.subject);fields(p.sourcePaths,['db','keywords','weeklyGoals']);fields(p.before,['db','keywords','receiptHash']);if(p.version===3)L.descriptor(p.legacy);
 if(![2,3].includes(p.version)||p.ownerId!=='mandala-time-blocks'||label(p.oldLabel)!==label(p.newLabel)||p.oldLabel.toLocaleLowerCase()===p.newLabel.toLocaleLowerCase()||new Set([p.subject.sourceScope,...Object.values(p.sourcePaths).map(path)]).size!==4||!Object.values(p.before).every(digest)||p.preconditionHash!==hash([p.sourcePaths,p.before,...(p.version===3?[p.legacy]:[])])||p.receiptKey!==receiptKey(p))fail('MANDALA_PLAN_INVALID');return p;}
const peoReceiptKey=p=>hash([p.ownerId,p.subject,p.oldLabel,p.newLabel,p.preconditionHash,...(p.version===2?[p.legacy]:[])]);
function validatePeoLegacy(p){fields(p,['version','ownerId','subject','oldLabel','newLabel','preconditionHash','receiptKey','legacy']);subject(p.subject);L.descriptor(p.legacy);if(p.version!==2||p.ownerId!=='project-execution-overview'||label(p.oldLabel)!==label(p.newLabel)||p.oldLabel.toLocaleLowerCase()===p.newLabel.toLocaleLowerCase()||!digest(p.preconditionHash)||p.receiptKey!==peoReceiptKey(p))fail('PEO_LEGACY_PLAN_INVALID');return p;}
// Strict subject rule shared by the center claim command and the PEO/Mandala projections (union of both former rules).
function strictSubject(s,code='STRICT_SUBJECT_INVALID'){const bad=()=>fail(code);try{fields(s,['domain','ownerId','sourceScope','primaryNodeKey']);path(s.sourceScope)}catch{bad()}
 if(typeof s.primaryNodeKey!=='string'||!s.primaryNodeKey.startsWith('jump:v1:'))bad();let p;try{p=s.primaryNodeKey.slice(8).split('|').map(decodeURIComponent)}catch{bad()}
 if(p.length!==5||p.some(x=>!x||x!==x.trim()||/[\x00-\x1f]/.test(x))||p.map(encodeURIComponent).join('|')!==s.primaryNodeKey.slice(8)||p[1]!==s.sourceScope)bad();
 if(!(s.domain==='project'&&s.ownerId==='workspace-mount'&&p[0]==='workspace-mount-view'&&p[2]==='tab')&&!(s.domain==='goal'&&s.ownerId==='mandala-time-blocks'&&p[0]===s.ownerId&&p[2]==='node'&&p[3]==='mandala'&&p[4]!=='root'))bad();return s;}
module.exports={hash,fields,path,subject,label,digest,receiptKey,validate,peoReceiptKey,validatePeoLegacy,strictSubject};
