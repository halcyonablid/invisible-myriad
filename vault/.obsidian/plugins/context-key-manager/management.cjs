"use strict";
const {ownerScope}=require("./directory.cjs");
const MANAGEMENT_CAPABILITIES=Object.freeze({
  project:Object.freeze({inspect:"getProjectContextManagementSnapshotV1",open:"openProjectContextManagerV1",label:"项目"}),
  goal:Object.freeze({inspect:"getGoalContextManagementSnapshotV1",open:"openGoalContextManagerV1",label:"目标"})
});
function managementCapabilities(domain){return Object.hasOwn(MANAGEMENT_CAPABILITIES,domain)?MANAGEMENT_CAPABILITIES[domain]:null;}
function managementRef(row){
  if(!row||!managementCapabilities(row.domain)||typeof row.providerScope!=="string"||!row.providerScope.trim()||row.providerScope.length>8192)throw Error("invalid-management-ref");
  const source=ownerScope(row.nodeKey,row.domain);
  if(source!==row.ownerSourceScope||(row.domain==="goal"&&source!==row.providerScope))throw Error("management-source-mismatch");
  return Object.freeze({identity:JSON.stringify([row.domain,row.providerScope,row.nodeKey]),domain:row.domain,nodeKey:row.nodeKey,providerScope:row.providerScope,ownerSourceScope:source,label:typeof row.label==="string"?row.label:"名称不可用"});
}
// Delegates UI only. The original owner modal owns all confirmations and writes.
class Management {
  constructor(directory,{timeoutMs=10000}={}){this.directory=directory;this.timeoutMs=timeoutMs;this.closed=false;this.job=null;this.recent=[];this.listeners=new Set();this.refreshQueued=false;}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  emit(){if(!this.closed)for(const fn of this.listeners){try{fn();}catch{}}}
  message(value){this.status=value;this.emit();}
  available(row,api){
    try{const saved=managementRef(row),cap=managementCapabilities(saved.domain);return !this.closed&&api===this.directory.getApi()&&typeof api?.[cap.inspect]==="function"&&typeof api?.[cap.open]==="function";}catch{return false;}
  }
  async open(row,api,live=()=>true){
    if(this.closed||this.job)return false;
    let saved,cap;
    try{saved=managementRef(row);cap=managementCapabilities(saved.domain);}catch{this.message("管理来源或对象身份无效，请刷新目录。");return false;}
    if(api!==this.directory.getApi()||!this.available(saved,api)){this.message(`${cap.label}管理服务尚未就绪，请刷新目录或重载对应插件。`);return false;}
    const ref=Object.freeze({nodeKey:saved.nodeKey,sourceNotePath:saved.providerScope});
    saved=Object.freeze({...saved,api});
    const inspect=api[cap.inspect],open=api[cap.open];
    const job={api,phase:"inspect",expired:false};this.job=job;this.message(`正在核验${cap.label}管理来源…`);
    job.timer=setTimeout(()=>{job.expired=true;if(this.job===job)this.message("管理核验超时；原请求结束前不重复发送。");},this.timeoutMs);
    const finish=()=>{clearTimeout(job.timer);if(this.job===job){this.job=null;this.emit();}};
    let notified=false,openedOkay=false;
    const onClosed=changed=>{
      if(notified)return;notified=true;
      if(this.closed||this.job!==job)return;
      finish();this.message("管理面板已关闭。");
      if(changed===true&&this.directory.getApi()===api)this.requestRefresh(api);
    };
    try{
      const s=await inspect.call(api,{...ref});
      clearTimeout(job.timer);
      if(this.closed||job.expired||!live()||this.job!==job||this.directory.getApi()!==api||api[cap.inspect]!==inspect||api[cap.open]!==open){if(!this.closed&&!job.expired)this.message("来源或页面已变化，请重新打开。");return false;}
      if(s?.contractVersion!==1||s.nodeKey!==ref.nodeKey||s.sourceNotePath!==ref.sourceNotePath||typeof s.providerGeneration!=="string"||!s.providerGeneration||typeof s.revision!=="string"||!s.revision||!["active","stopped"].includes(s.tracking?.status)||!["eligible","ineligible","unavailable"].includes(s.eligibility?.status)||!Array.isArray(s.eligibility.reasons)||!s.eligibility.reasons.every(reason=>typeof reason==="string"))throw Error("invalid-management-snapshot");
      job.phase="open";
      const opened=open.call(api,{...ref},{onClosed});
      if(opened!==true)throw Error("owner-open-not-confirmed");
      openedOkay=true;
      if(!this.closed){this.recent=[saved,...this.recent.filter(r=>r.identity!==saved.identity)].slice(0,50);if(!notified)this.message("请在原管理面板中操作；这里不会直接修改业务数据。");else this.emit();}
      return true;
    }catch(error){if(!this.closed)this.message("无法打开管理面板（"+String(error?.code||error?.message||"未知原因").slice(0,120)+"），请核对来源或重新刷新。");return false;}
    finally{if(!openedOkay||notified)finish();}
  }
  requestRefresh(api){
    if(this.refreshQueued||this.closed)return;this.refreshQueued=true;
    const pending=this.directory.busy?this.directory.flight:Promise.resolve();
    Promise.resolve(pending).catch(()=>{}).then(()=>{
      this.refreshQueued=false;
      if(this.closed||this.directory.closed||this.directory.getApi()!==api)return;
      if(this.directory.busy){this.requestRefresh(api);return;}
      void this.directory.refresh();
    });
  }
  dispose(){this.closed=true;if(this.job)clearTimeout(this.job.timer);this.job=null;this.listeners.clear();this.recent=[];}
}
module.exports={Management,managementCapabilities,managementRef};
