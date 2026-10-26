'use strict';
const {hash,uuid}=require('./naming-store.cjs'),model=require('./identity-model.cjs'),{strictSubject}=require('./primary-plan.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),fail=x=>{throw Error(x)};
// A new identity is only an observation. Claiming naming authority remains a separate C1 operation.
class RegistrationService{
 constructor(naming,provider){this.naming=naming;this.provider=provider;}
 preview(row){return this.naming.work(async guard=>{
  const input=copy(row),{status}=this.naming.read();if(![4,6].includes(status.frame.version))fail('registration-v4-required');
  const evidence=await this.provider.observe(input,()=>{try{guard();return true;}catch{return false;}});guard();strictSubject(evidence.subject);
  const key=model.subjectKey(evidence.subject),existing=status.frame.state.contexts.find(c=>c.subjects.some(s=>model.subjectKey(s)===key));
  if(existing)return {kind:'existing',contextId:existing.contextId,label:existing.canonicalLabel};
  const payload={kind:'register-identity',contextId:'ctx_'+uuid(),canonicalLabel:evidence.row.label,subjects:[evidence.subject],bindings:evidence.bindings,observation:evidence.observation};
  this.naming.store.next(status.frame,{...copy(payload),namespace:status.frame.state.namespace,expectedRevision:status.frame.state.revision,requestId:`r${status.frame.state.revision}_${uuid()}`});
  return this.naming.keep({kind:'register-identity',payload,row:evidence.row,digest:status.digest,evidenceDigest:evidence.digest});
 });}
 confirm(token){return this.naming.work(async guard=>{
  const p=this.naming.take(token,'register-identity'),{status}=this.naming.read();if(![4,6].includes(status.frame.version)||status.digest!==p.digest)fail('store-changed');
  const evidence=await this.provider.observe(copy(p.row),()=>{try{guard();return true;}catch{return false;}});guard();
  if(evidence.digest!==p.evidenceDigest||hash(evidence.subject)!==hash(p.payload.subjects[0])||hash(evidence.bindings)!==hash(p.payload.bindings))fail('registration-evidence-changed');
  this.naming.trustedAdapter();const att=await this.naming.adapter.attest();guard();this.naming.activation('attest',att);
  const lease=()=>{guard();evidence.guard();att.guard();};lease();
  const result=await this.naming.store.exclusive(tx=>{lease();return tx.commit(copy(p.payload));},lease,p.digest);
  this.naming.invalidate();const c=result.state.contexts.find(c=>c.contextId===p.payload.contextId);if(!c||c.naming.authority!=='legacy')fail('registration-readback-invalid');
  return {ok:true,contextId:c.contextId,label:c.canonicalLabel,nameAuthority:'legacy'};
 });}
}
module.exports={RegistrationService};
