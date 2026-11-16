'use strict';
const FIELD='mandalaBoardsV1',CAPABILITY='mandala-declared-forest-v1';
const isBoardRootId=id=>typeof id==='string'&&/^board-[0-9a-f-]{36}$/.test(id);
const slots=new Set(['0','1','2','3','5','6','7','8']);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x),copy=x=>JSON.parse(JSON.stringify(x));
function fail(code){throw Object.assign(Error(code),{code})}
function roots(db){
 if(!plain(db)||!plain(db.root)||db.root.id!=='root'||!plain(db.root.children))fail('BOARD_DB_ROOT');
 const meta=db.root[FIELD];if(meta===undefined)return ['root'];
 if(!plain(meta)||meta.version!==1||!Array.isArray(meta.rootIds)||meta.rootIds.length<1||meta.rootIds.length>128||meta.rootIds[0]!=='root')fail('BOARD_CATALOG_SCHEMA');
 const ids=meta.rootIds;if(new Set(ids).size!==ids.length)fail('BOARD_CATALOG_DUPLICATE');
 if(ids.slice(1).some(id=>!isBoardRootId(id)))fail('BOARD_CATALOG_ID_FORMAT');
 for(const id of ids)if(typeof id!=='string'||!id||id!==id.trim()||['__proto__','prototype','constructor'].includes(id)||!own(db,id)||!plain(db[id])||db[id].id!==id||!plain(db[id].children))fail('BOARD_CATALOG_ROOT_MISSING');
 const set=new Set(ids);for(const node of Object.values(db))for(const child of Object.values(node?.children||{}))if(set.has(child))fail('BOARD_ROOT_HAS_PARENT');
 return [...ids];
}
function inspect(db){
 const rootIds=roots(db),rootSet=new Set(rootIds),incoming=new Map(),diagnostics=[];
 for(const [id,node]of Object.entries(db)){
  if(!plain(node)||node.id!==id||!plain(node.children)){diagnostics.push({code:'node-schema',id});continue}
  for(const [slot,child]of Object.entries(node.children)){
   if(child==null||child==='')continue;
   if(!slots.has(slot))diagnostics.push({code:'invalid-slot',id,slot,child});
   if(typeof child!=='string'||!own(db,child)){diagnostics.push({code:'missing-child',id,slot,child});continue}
   const refs=incoming.get(child)||[];refs.push({nodeId:child,parentNodeId:id,slotIndex:Number(slot),rawSlot:slot});incoming.set(child,refs);
  }
 }
 const boardByNode=new Map(),unassigned=new Set();
 function ancestry(id){
  if(!own(db,id))fail('BOARD_NODE_MISSING');const chain=[],seen=new Set();let at=id;
  while(true){
   if(!plain(db[at])||db[at].id!==at||!plain(db[at].children))fail('BOARD_NODE_SCHEMA');
   if(rootSet.has(at))break;
   if(seen.has(at))fail('BOARD_TREE_CYCLE');seen.add(at);
   const refs=incoming.get(at)||[];if(refs.length!==1)fail('BOARD_PARENT_AMBIGUOUS');
   if(!slots.has(refs[0].rawSlot))fail('BOARD_SLOT_INVALID');
   chain.push({nodeId:at,parentNodeId:refs[0].parentNodeId,slotIndex:refs[0].slotIndex});at=refs[0].parentNodeId;
  }
  if((incoming.get(at)||[]).length)fail('BOARD_ROOT_HAS_PARENT');
  return {rootId:at,ancestry:chain};
 }
 // Memoize ownership in a single walk per edge. Full ancestry is only materialized
 // for an actual write target / directory path, never once per rendered cell.
 const rejected=new Map();
 function assign(id){
  const chain=[],seen=new Set();let at=id,root,code;
  while(true){
   if(boardByNode.has(at)){root=boardByNode.get(at);break}
   if(rejected.has(at)){code=rejected.get(at);break}
   const node=db[at];
   if(!plain(node)||node.id!==at||!plain(node.children)){code='BOARD_NODE_SCHEMA';break}
   if(rootSet.has(at)){
    if((incoming.get(at)||[]).length)code='BOARD_ROOT_HAS_PARENT';else{root=at;boardByNode.set(at,at)}break;
   }
   if(seen.has(at)){code='BOARD_TREE_CYCLE';break}seen.add(at);chain.push(at);
   const refs=incoming.get(at)||[];if(refs.length!==1){code='BOARD_PARENT_AMBIGUOUS';break}
   if(!slots.has(refs[0].rawSlot)){code='BOARD_SLOT_INVALID';break}at=refs[0].parentNodeId;
  }
  for(const k of chain)if(code)rejected.set(k,code);else boardByNode.set(k,root);
  if(code)rejected.set(id,code);else boardByNode.set(id,root);
 }
 for(const id of Object.keys(db)){
  const refs=incoming.get(id)||[];
  if(rootSet.has(id)&&refs.length||!rootSet.has(id)&&refs.length!==1)diagnostics.push({code:'parent-count',id,refs});
  assign(id);if(rejected.has(id)){unassigned.add(id);diagnostics.push({code:rejected.get(id),id})}
 }
 return {rootIds,rootSet,incoming,boardByNode,unassigned,diagnostics,ancestry};
}
function isRoot(db,id){return roots(db).includes(id)}
function rootFor(db,id){return inspect(db).ancestry(id).rootId}
function assertOrdinary(db,id){if(isRoot(db,id))fail('BOARD_ROOT_IS_CONTAINER');return inspect(db).ancestry(id)}
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(plain(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x)}
function transition(before,after,{allowNewRoot=false}={}){
 const a=inspect(before),b=inspect(after),oldProblems=new Set(a.diagnostics.map(stable));
 for(const error of b.diagnostics)if(!oldProblems.has(stable(error)))fail('BOARD_NEW_TOPOLOGY_ERROR');
 for(const id of a.unassigned)if(stable(before[id])!==stable(after[id])||stable(a.incoming.get(id)||[])!==stable(b.incoming.get(id)||[]))fail('BOARD_LEGACY_COMPONENT_CHANGED');
 for(const error of a.diagnostics)if(error.id&&stable(before[error.id])!==stable(after[error.id]))fail('BOARD_LEGACY_COMPONENT_CHANGED');
 for(const id of a.rootIds)if(!b.rootSet.has(id))fail('BOARD_ROOT_REMOVAL_UNSUPPORTED');
 for(const id of b.rootIds)if(!a.rootSet.has(id)&&(!allowNewRoot||own(before,id)))fail('BOARD_ROOT_REGISTRATION_INVALID');
 for(const [id,root]of a.boardByNode)if(own(after,id)&&b.boardByNode.get(id)!==root)fail('BOARD_CROSS_TREE_MOVE');
 return b;
}
function add(db,{id,title,requestId}){
 if(!isBoardRootId(id)||!/^board-request-[0-9a-f-]{36}$/.test(requestId)||typeof title!=='string'||!title.trim()||title.trim().length>120)fail('BOARD_CREATE_INPUT');
 const list=roots(db);
 if(own(db,id)){
  const receipt=db[id].mandalaBoardCreationV1;
  if(!list.includes(id)||!plain(receipt)||receipt.version!==1||receipt.requestId!==requestId)fail('BOARD_ID_COLLISION');
  return {db:copy(db),id,noOp:true};
 }
 if(list.length>=128)fail('BOARD_CAPACITY');
 const next=copy(db);next.root[FIELD]={...(next.root[FIELD]||{}),version:1,rootIds:[...list,id]};
 next[id]={id,title:title.trim(),note:'',children:{},comment:'',image:'',shortcuts:[],noteBinding:null,renameHistory:[],mandalaBoardCreationV1:{version:1,requestId}};
 transition(db,next,{allowNewRoot:true});return {db:next,id,noOp:false};
}
function parentDirectory(db){
 const graph=inspect(db),out=[];
 for(const [id,node]of Object.entries(db)){
  const boardRootId=graph.boardByNode.get(id);if(!boardRootId||!plain(node.children))continue;
  const emptySlots=[...slots].filter(slot=>!node.children[slot]).map(Number);if(!emptySlots.length)continue;
  const chain=graph.ancestry(id).ancestry.map(e=>e.nodeId).reverse(),names=chain.map(k=>String(db[k].title||k));
  const boardTitle=String(db[boardRootId].title||boardRootId),nodePath=names.join(' / ');
  out.push({id,boardRootId,boardTitle,path:nodePath,emptySlots,label:boardTitle+(nodePath?' / '+nodePath:' / 中心')});
 }
 return out;
}
module.exports={FIELD,CAPABILITY,isBoardRootId,roots,inspect,isRoot,rootFor,assertOrdinary,transition,add,parentDirectory};
