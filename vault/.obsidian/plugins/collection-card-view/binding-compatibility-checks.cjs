'use strict';
// Read-only implementation/lifecycle checks; not a sandbox against arbitrary Node code.
const fail=s=>{throw Error(s)};
function pinPrototype(value,proto){
 const pairs=Object.getOwnPropertyNames(proto).filter(k=>k!=='constructor'&&typeof proto[k]==='function').map(k=>{
  const f=value?.[k];if(typeof f!=='function'||Function.prototype.toString.call(f)!==Function.prototype.toString.call(proto[k]))fail('binding-implementation-mismatch:'+k);return [k,f];
 });return ()=>{for(const [k,f] of pairs)if(value[k]!==f)fail('binding-method-changed:'+k);return true};
}
function pinMethods(obj,required=[]){const names=new Set(required);for(let p=obj;p&&p!==Object.prototype;p=Object.getPrototypeOf(p))for(const k of Object.getOwnPropertyNames(p))if(k!=='constructor'&&typeof Object.getOwnPropertyDescriptor(p,k)?.value==='function')names.add(k);const pairs=[...names].map(k=>[k,obj[k]]);return ()=>{for(const k of required)if(typeof obj?.[k]!=='function')fail('binding-method-missing:'+k);for(const [k,f] of pairs)if(obj[k]!==f)fail('binding-writer-method-changed:'+k);return true};}
function validator(S){const s={version:3,namespace:'compatibility-only',generation:'compatibility-only',revision:0,contexts:[],binding:{format:S.BINDING_FORMAT,pending:null,results:[],anchors:[],...(S.BINDING_FORMAT===2?{released:[]}:{})}};S.validate(s);for(const change of [x=>x.binding.pending={},x=>x.binding.anchors=[{}],x=>x.version=99,x=>x.binding.format=S.BINDING_FORMAT+1,x=>x.binding.format=0]){const x=JSON.parse(JSON.stringify(s));change(x);let denied=false;try{S.validate(x)}catch{denied=true}if(!denied)fail('binding-validator-incomplete');}}
function pinAuthority(resolve,root){const api=resolve(),base=root();if(!api||typeof api.availability!=='function'||typeof api.assertAvailability!=='function')fail('binding-authority-unavailable');const methods=pinMethods(api),a=api.availability();api.assertAvailability(a);if(a.state==='unavailable')fail('binding-authority-unavailable');return ()=>{methods();if(resolve()!==api||root()!==base)fail('binding-authority-changed');const n=api.availability();api.assertAvailability(n);if(n.state==='unavailable'||n.generation!==a.generation)fail('binding-authority-changed');return true};}
module.exports={pinPrototype,pinMethods,validator,pinAuthority};
