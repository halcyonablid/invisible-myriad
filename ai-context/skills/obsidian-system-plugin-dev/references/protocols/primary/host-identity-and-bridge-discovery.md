# Host Identity And Bridge Discovery

## 1. 目标

定义“插件实例是谁、怎样被找到、怎样被正确路由”。

## 2. 核心不变量

1. host 是真实视图实例，不是插件类型
2. note-scoped host 必须把 `notePath` 作为硬约束
3. bridge discovery 要从“找笔记”转成“找 view”
4. 全局 bridge 单例只能做兼容兜底，不能做主身份源
5. retarget 后必须允许旧 scope 注销

## 3. 最小身份字段

### 最小对象

1. `HostIdentity`
2. `BridgeRegistryEntry`
3. `HostResolveResult`

### 字段分类

#### `identity_key`

1. `scopeType`
2. `scopeKey`
3. `notePath`

#### `diagnostic_only`

1. `hostId`
2. `leaseId`
3. `registrationEpoch`
4. `sourceNotePath`
5. `workspaceRootPath`

原则：

1. `HostIdentity` 的 equality 默认只认 `scopeType + scopeKey + notePath`
2. `workspaceRootPath / sourceNotePath` 只做来源定位与审计，不参与 host 唯一性比较
3. `hostId / leaseId / registrationEpoch` 只用于运行时路由与诊断，不进入 capsule 持久态

## 4. 必须服从的横切标准

1. [../../standards/system-boundaries.md](../../standards/system-boundaries.md)
2. [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)
3. [../../standards/release-guardrails.md](../../standards/release-guardrails.md)

## 5. 覆盖范围

1. `workspace-mount`
2. `collection-card-view`
3. `state-capsules`
4. `eva-cross-view-relations`

## 6. 明确禁止

1. markdown-only 宿主推断
2. active view fallback
3. “第一个可用实例” fallback
4. 没有唯一 host 时继续 capture / restore

## 7. 拒收条件

1. `note-scope` 缺 `notePath`
2. 同一 `scopeType + scopeKey + notePath` 命中多个可用 host
3. retarget 后旧 scope 仍注册且无法裁决当前 active host
4. 试图用 `workspaceRootPath` 或 `sourceNotePath` 代替 identity key 判定唯一 host

## 8. 验收标准

1. 多 host 并存时，`host.resolve` 仍能唯一命中正确 host
2. retarget 后旧 scope 不再参与后续 capture / restore
3. capture / restore / jump 三条链路命中同一 identity 语义
4. 诊断字段可见，但不混入 capsule 内容态或 identity equality

## 9. 本协议特有回归项

1. 同一 notePath 打开多个 leaf，只允许一个 active host 被本事务采用
2. 切换 sourceNotePath / workspaceRootPath 后，旧 scope 不再被命中
3. `host.resolve` 输出能明确区分 `identity_key` 与 `diagnostic_only`

日志/裁决字段必须符合 [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)。通用发布门禁与回归矩阵以 [../../standards/release-guardrails.md](../../standards/release-guardrails.md) 为准。

## 10. 历史来源

需要补背景时，看：

1. [../../legacy/cross-plugin-protocols.md](../../legacy/cross-plugin-protocols.md)
