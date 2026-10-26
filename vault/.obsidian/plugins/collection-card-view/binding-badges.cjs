'use strict';
// C3 Y1 R11: read-only "no longer bound to a key" tabs for one Collection source. Never writes; any doubt -> no badge.
// A tab qualifies only when it exists, is nobody's current binding nor a pending target, has no keyword mapping in this
// source, AND the center proves it was bound before: a release tombstone (format 2), or the beforeRef of an ANCHORED
// binding receipt (one hop; covers format-1 history such as the first replace).
const K=require('./binding-transition.cjs');
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function unboundTabIds({snapshot,keywordData,sourceNotePath,tabsById}){
 const out=new Set();
 try{
  const s=snapshot;if(!plain(s)||s.version!==3||!plain(s.binding)||!K.READABLE_FORMATS.includes(s.binding.format)||!sourceNotePath||!plain(tabsById)||!plain(keywordData))return out;
  const here=r=>plain(r)&&r.ownerId==='collection-card-view'&&r.sourceScope===sourceNotePath;
  const blocked=new Set();
  for(const c of s.contexts||[])for(const b of c.bindings||[])if(here(b))blocked.add(b.carrierId);
  const p=s.binding.pending;if(p)for(const r of [p.beforeRef,p.afterRef])if(here(r))blocked.add(r.carrierId);
  for(const e of Object.values(keywordData[K.MAP]||{}))if(plain(e)&&e.tabId)blocked.add(e.tabId);
  const was=new Set();
  for(const r of s.binding.released||[])if(here(r.ref))was.add(r.ref.carrierId);
  const receipts=plain(keywordData[K.NEW])?keywordData[K.NEW]:{};
  for(const a of s.binding.anchors||[]){if(!here(a.ref))continue;const r=receipts[a.ref.carrierId];if(r&&K.hash(r)===a.receiptHash&&here(r.beforeRef))was.add(r.beforeRef.carrierId)}
  for(const id of was)if(!blocked.has(id)&&plain(tabsById[id]))out.add(id);
 }catch{out.clear()}
 return out;
}
module.exports={unboundTabIds};
