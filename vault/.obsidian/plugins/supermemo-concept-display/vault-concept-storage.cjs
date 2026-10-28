"use strict";
// Vault owner storage. No legacy/global-storage reads and no implicit initialization.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DATA = new Set(['supermemo_concepts_final_v3', 'supermemo_concept_structure_tree_v1',
  'supermemo_concept_structure_tree_tx_v1', 'supermemo_antinet_structure_tree_v1',
  'supermemo_antinet_meaning_projects_v1', 'supermemo_concept_pages_v1']);
const UI = new Set(['supermemo_concept_structure_tree_ui_v1', 'supermemo_antinet_structure_tree_ui_v1']);
const DRAFT = 'supermemo_tree_node_comment_draft_v1:';
const FILES = Object.freeze({data:'vault-concept-data.json', ui:'vault-concept-ui.json', drafts:'vault-concept-drafts.json'});
function fail(code) { throw Object.assign(new Error('[SuperMemo 独立存储] ' + code + '；原数据保留，请勿重置。'), {code}); }
function group(key) {
  if (DATA.has(key)) return 'data';
  if (UI.has(key)) return 'ui';
  if (key.startsWith(DRAFT) && key.length > DRAFT.length && key.length < 512) return 'drafts';
  fail('UNSUPPORTED_KEY');
}
function object(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function validate(v, kind) {
  if (!object(v) || v.schemaVersion !== 1 || v.group !== kind || !Number.isSafeInteger(v.revision)
      || v.revision < 0 || !object(v.values)) fail('INVALID_STORAGE');
  if (Object.keys(v.values).length > 5000) fail('KEY_LIMIT');
  for (const [k,x] of Object.entries(v.values)) if (group(k) !== kind || typeof x !== 'string') fail('INVALID_KEY_VALUE');
  return v;
}
function access({basePath, pluginDir}) {
  if (typeof basePath !== 'string' || !path.isAbsolute(basePath) || typeof pluginDir !== 'string'
      || path.isAbsolute(pluginDir) || pluginDir.split(/[\\/]/).some(p=>!p || p==='.' || p==='..' || p.includes(':'))) fail('INVALID_DIRECTORY');
  const base=path.resolve(basePath), dir=path.resolve(base,pluginDir);
  if (path.relative(base,dir).startsWith('..') || dir===base) fail('OUTSIDE_VAULT');
  function check(p, required=false) {
    for (let q=p;;q=path.dirname(q)) {
      try {
        const st=fs.lstatSync(q);
        if (st.isSymbolicLink() || (st.isFile() && st.nlink!==1)) fail('LINK_REFUSED');
        if (q===p && !st.isFile()) fail('NOT_REGULAR_FILE');
      } catch(e) { if(e.code!=='ENOENT') throw e; if(q===p && required) fail('STORAGE_MISSING'); }
      if (q===path.dirname(q)) break;
    }
  }
  // Check directory ancestry without treating directories as owner files.
  const realBase=fs.realpathSync(base), realDir=fs.realpathSync(dir);
  if (path.relative(realBase,base)!=='' || path.relative(realDir,dir)!=='') fail('LINK_REFUSED');
  const file=kind=>path.join(dir,FILES[kind]);
  function read(kind) {
    const p=file(kind);check(p,true);
    if (fs.statSync(p).size>50*1024*1024) fail('STORAGE_SIZE_LIMIT');
    const raw=fs.readFileSync(p,'utf8');let value;
    try {value=JSON.parse(raw);} catch (_) {fail('STORAGE_JSON_INVALID');}
    return {raw,value:validate(value,kind)};
  }
  return {check,file,read};
}
function createStorage(options) {
  const a=access(options), observed=new Map();
  const stats={reads:0,readBytes:0,writes:0,noops:0,dataWriteBytes:0,uiWriteBytes:0,draftsWriteBytes:0,maxWriteMs:0};
  function read(kind) {const r=a.read(kind);stats.reads++;stats.readBytes+=Buffer.byteLength(r.raw);return r;}
  for (const kind of Object.keys(FILES)) read(kind);
  function getItem(key) {key=String(key);const value=read(group(key)).value.values[key] ?? null;observed.set(key,value);return value;}
  function mutate(key,value) {
    const started=performance.now();key=String(key);const kind=group(key),file=a.file(kind),lock=file+'.lock';
    a.check(lock);let fd;
    try {fd=fs.openSync(lock,'wx');} catch(e) {if(e.code==='EEXIST') fail('STORAGE_LOCKED');throw e;}
    let tmp, tempCreated=false;
    try {
      const current=read(kind),live=current.value.values[key]??null;
      if ((observed.has(key) && observed.get(key)!==live) || (!observed.has(key) && live!==null)) fail('STORAGE_CONFLICT');
      if (live===value) {stats.noops++;observed.set(key,value);return;}
      if (value===null) delete current.value.values[key];else current.value.values[key]=value;
      current.value.revision++;
      const serialized=JSON.stringify(validate(current.value,kind));
      if (Buffer.byteLength(serialized)>50*1024*1024) fail('STORAGE_SIZE_LIMIT');
      tmp=file+'.tmp-'+crypto.randomUUID();a.check(tmp);
      const out=fs.openSync(tmp,'wx');tempCreated=true;
      try {fs.writeFileSync(out,serialized,'utf8');fs.fsyncSync(out);}finally{fs.closeSync(out);}
      if (a.read(kind).raw!==current.raw) fail('STORAGE_CHANGED');
      // Windows scanners may briefly hold the destination. Bounded immediate retries only;
      // every attempt rechecks the source bytes. Never delete the destination or report queued success.
      for (let attempt=0;;attempt++) {
        if (a.read(kind).raw!==current.raw) fail('STORAGE_CHANGED');
        a.check(file,true);a.check(tmp,true);
        try { fs.renameSync(tmp,file);tmp=null;break; }
        catch(e) { if (attempt>=4 || !['EPERM','EBUSY','EACCES'].includes(e.code)) throw e; }
      }
      if (a.read(kind).raw!==serialized) fail('READBACK_MISMATCH');
      observed.set(key,value);stats.writes++;stats[kind+'WriteBytes']+=Buffer.byteLength(serialized);
    } finally {
      // Only remove the temporary path created by this call; never recover another writer's lock.
      try {if(tmp && tempCreated && fs.existsSync(tmp)) fs.unlinkSync(tmp);} finally {fs.closeSync(fd);fs.unlinkSync(lock);}
      stats.maxWriteMs=Math.max(stats.maxWriteMs,performance.now()-started);
    }
  }
  function keys() {return Object.keys(FILES).flatMap(kind=>Object.keys(read(kind).value.values));}
  return Object.freeze({getItem,setItem:(k,v)=>mutate(k,String(v)),removeItem:k=>mutate(k,null),
    key:i=>keys()[i]??null,get length(){return keys().length;},diagnostics:()=>Object.freeze({...stats})});
}
// Read-only consumer contract. Does not require the display plugin to be enabled or its view opened.
function readConceptRoot(options) {return access(options).read('data').value.values.supermemo_concepts_final_v3??null;}
module.exports={createStorage,readConceptRoot,validate,FILES};
