# Console Ops Runbook

## 1. 用途

这是运维判读附录，用来教排障时先看什么、后看什么。

## 2. 标准顺序

1. 先看 `summary`
2. 再看 `verify.result`
3. 如果有 queued，再看 queued 是否闭环
4. 最后回头看 `host.resolve`

## 3. 快速判断

### 绿色

1. `summary.finalVerdict = PASS`
2. `verify` 成功，或 queued 闭环后成功

### 黄色

1. `WARN`
2. `skipped`
3. queued 延迟但后续闭环

### 红色

1. `FAIL`
2. mismatch
3. timeout
4. host unresolved / ambiguous

## 4. 原则

1. 不要因为 `applyStateStatus = applied` 就直接判成功
2. 也不要因为 `lastApplied` 成功就判当前状态正确


## 5. Console 记录优先的用户协作测试

这是本用户的测试偏好（2026-10-02）：首选已有诊断开关记录一次真实操作，代理分析摘要；备用是代理提供代码、用户在 Console 执行。默认不控制用户电脑。代理能否读取运行中 Console 取决于已有工具；没有直连通道时，由用户复制摘要或保存到约定本地文件后交付，不能声称能自动读取或自动保存。

### 一次测试的交付与反馈

1. 先从实际代码确认命令/API存在、适用链路、loaded capability 和采集范围。读取诊断的 buildId 不一定能证明其他补丁已加载。
2. 给用户明确的“开始记录 → 操作一次 → 停止并导出”步骤；开始会清空旧记录时先提醒保存上一轮。优先已存在的诊断命令/开关，代码探测不得触发创建、删除、保存、重载或迁移。
3. 用户按场景操作；代理不为省事自动点击、批量造数据或重启应用。诊断停止不等于后台任务被取消。
4. 导出本轮必要摘要及对应 transaction 的结果，按 [性能观测规范](../standards/workflow-performance-observability.md) 的限量与内容边界处理；不关闭业务审计，不默认代理全局 console 或无限记录所有插件。
5. 分别报告磁盘部署、进程已加载能力、owner返回、最终正确界面及下一次交互。用户视觉确认是实践证据；只有日志时，界面验收保留未验证。

若无现成观测接口，先给只读能力探测和已审阅的局部、有界临时脚本，说明范围、截止、停止/清理方法与副作用；需要永久插桩时走正常开发核查/部署流程。任何函数包裹须保持 this/参数/返回/异常语义，可撤销且不叠加；不要把 monkey patch 当默认方案。诊断机制本身不能授权跨目录写入或重载。

### 已存在的行动台读取诊断（2026-10-02 代码核实）

命令面板：`开始行动台读取诊断（60秒）` → 刷新一次来源或重试新增准备 → `停止并复制行动台读取诊断`。命令 ID 分别为 `next-action-workbench:start-read-diagnostics`、`next-action-workbench:copy-read-diagnostics`。前者清空上一轮，仅在内存记录，60秒截止、最多500事件/262144字节；后者停止并复制摘要。将摘要交付代理分析即可。

备用 Console 开始代码（只开启已有内存 collector，重新开始会清空上一轮）：

```js
(() => {
  const p = typeof app === "undefined" ? null : app.plugins?.plugins?.["next-action-workbench"];
  const d = p?.diagnostics;
  if (!["start", "stop", "snapshot"].every(k => typeof d?.[k] === "function")) {
    return "行动台读取诊断尚未加载，请先确认插件状态";
  }
  d.start();
  return "已开始60秒读取诊断，请操作一次，然后停止导出";
})();
```

停止并读取摘要（用户选择复制输出；无网络发送、无自动文件写入）：

```js
(() => {
  const d = typeof app === "undefined" ? null : app.plugins?.plugins?.["next-action-workbench"]?.diagnostics;
  if (typeof d?.stop !== "function" || typeof d?.snapshot !== "function") return "诊断接口不可用";
  d.stop();
  return JSON.stringify(d.snapshot(), null, 2);
})();
```

### 返回来源跳转的单独验收

上述 collector 目前不记录完整导航链路，不能拿它的空事件证明跳转成功/失败。当前补丁另有 `[NextActionWorkbench][navigation][tx:...][result]` / `[failed]` 日志；用户可在 Console 过滤 `[NextActionWorkbench][navigation]`，点一次“返回来源”，反馈该次 status 和是否打开正确 Collection Card Tab/条目。原始日志可能含来源路径，反馈只取必要字段，不要求导出全部 Console。

确认进程加载的路由（只读方法特征探测，不是精确bundle hash或实机成功证明）：

```js
(() => {
  const p = typeof app === "undefined" ? null : app.plugins?.plugins?.["next-action-workbench"];
  if (typeof p?.revealSource !== "function") return "行动台未加载";
  const code = p.revealSource.toString();
  if (code.includes("api.openNode(") && !code.includes("revealItemNodeConfirmed")) return "已加载 Collection Card 路由能力；待点击验证";
  if (code.includes("revealItemNodeConfirmed")) return "仍加载旧的项目执行总览路由；本次不会自动重载";
  return "未知版本，需要重新核对代码";
})();
```

用户执行后还需确认目标 Tab、条目及下一次交互。磁盘已部署但尚未证实进程新版本时，保留 `loaded_unknown`；不要悄悄用 UI 控制完成剩余测试。
