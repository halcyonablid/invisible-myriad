> LEGACY
>
> 本文件仅保留为历史来源，不再作为主引用入口。
>
> 现在的 canonical 入口请先看：
> 1. [../protocols/00-protocol-index.md](../protocols/00-protocol-index.md)
> 2. [../protocols/primary/host-identity-and-bridge-discovery.md](../protocols/primary/host-identity-and-bridge-discovery.md)
> 3. [../protocols/primary/queued-restore-runtime-protection.md](../protocols/primary/queued-restore-runtime-protection.md)
> 4. [../protocols/primary/verify-allows-evolution.md](../protocols/primary/verify-allows-evolution.md)

# Cross-Plugin Protocols

## 1. Host / Bridge / Bus

### Host

一个真实打开的插件视图实例，不是插件类型。

关键身份字段至少要清楚：

1. `scopeType`
2. `scopeKey`
3. `notePath`
4. `hostId`
5. 需要时补 `leaseId`、`registrationEpoch`

### Bridge

插件对外暴露的最小接口层。上层只通过 bridge 交互。

### Bus

全局注册表和消息路由器，只负责：

1. 注册 host
2. 找到正确 host
3. 路由 bridge 消息

不要让 bus 代替插件保存业务状态。

## 2. 身份解析硬规则

1. 没有明确 `scopeType + scopeKey`，不能注册 host
2. 没有明确 `scopeType + scopeKey`，不能 restore
3. note-scope 缺 `notePath`，直接拒收
4. 不允许用“当前活动视图”猜目标 host
5. 多 host 并存时，不唯一就失败，不要兜底猜测

## 3. 统一事务链

通信/恢复类链路至少按这条事务思路看：

1. `switch.start`
2. `host.resolve`
3. `capture.result`
4. `persist.result`
5. `readback.result`
6. `restore.result`
7. `verify.result`
8. `summary`

每条事务都要有 `txId`。

## 4. Jump 通用协议

跳转只解决“打开正确上下文并定位到条目”，不包办全部状态恢复。

最小对象：

1. `nodeKey`
2. `viewType`
3. `notePath`
4. 视图内对象稳定 id

最小语义：

1. 先打开正确宿主
2. 保证目标 tab / 面板 / 父层级可见
3. 再 reveal 目标条目
4. 最后才做滚动对齐

## 5. Pending Focus 规则

1. 显式定位优先于普通滚动恢复
2. `pending focus` 必须带足够上下文，至少能区分 `viewType::notePath`
3. 如果目标元素找不到，可以退回稳定位置，但不要伪造 reveal 成功
4. queued 路径也必须有消费、验证和超时结果

## 6. Adapter 生命周期

每个参与跳转的插件都要明确：

1. 何时 register adapter
2. 何时 unregister
3. 视图切换 / reload 后如何续命
4. 索引存在但实例失效时如何拒收

## 7. 旧 key 兼容

新协议上线后：

1. 解析器必须兼容旧 key
2. 新旧 key 并行期不要打断历史关系
3. 兼容逻辑只负责解析，不要悄悄改写历史记录

## 8. 明确禁止

1. 上层直接摸下层 DOM 恢复状态
2. 通过激活视图猜 host
3. adapter 不带身份字段就对外开放
4. verify mismatch 但 summary 仍宣称 PASS
