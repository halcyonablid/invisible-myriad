# Queued Restore Runtime Protection

## 1. 目标

定义 queued restore 怎样从“曾经 apply 过”变成“最终稳定落地”。

## 2. 核心不变量

1. `queued` 不等于成功
2. queued 被消费，不等于最终状态稳定
3. 必须有 runtime guard 保护刚恢复的环境态
4. 最终真相以后续 `bridgeState / cachedState` 为准
5. queue 元信息不能污染 capsule 持久态

## 3. 闭环要素

### 最小对象

1. `QueuedEntry`
2. `RuntimeRestoreGuard`
3. `QueueVerifyResult`

### 字段分类

#### `identity_key`

1. `queueId`
2. `scopeType`
3. `scopeKey`

#### `diagnostic_only`

1. `hostId`
2. `source`
3. `queuedAt`
4. `attempts`

#### `env_state_only`

1. `bridgeState`
2. `cachedState`
3. `guardUntil`

#### `content_state_forbidden_in_capsules`

1. queue 元信息本体
2. runtime guard 中间态

闭环要素：

1. `queueId`
2. `pending_consumed`
3. `applied-after-queue`
4. `applied-after-queue-verified`
5. `queue-verify-timeout`
6. `queue-verify-mismatch`

## 4. 必须服从的横切标准

1. [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)
2. [../../standards/release-guardrails.md](../../standards/release-guardrails.md)
3. [../../appendices/console-ops-runbook.md](../../appendices/console-ops-runbook.md)

## 5. 明确禁止

1. 把 queued 当作成功证明
2. 只看 `lastApplied`
3. 没有 guard 就让旧 runtime 状态抢回去

## 6. 拒收条件

1. queued 后没有闭环事件却仍宣称恢复成功
2. `pending_consumed` 后允许旧 runtime 值覆盖目标环境态
3. 把 queue 元信息回写进 capsule 持久态
4. 用 `lastApplied` 代替 `bridgeState / cachedState` 作为最终真相

## 7. 验收标准

1. `pending_consumed -> applied-after-queue -> applied-after-queue-verified` 主链完整
2. guard 生效期间旧值不会把目标 tab / scroll 顶回去
3. `bridgeState = cachedState` 且 host usable 时，才算最终稳定落地

## 8. 本协议特有回归项

1. host not ready 进入 queued 后，host reload 仍能稳定落到目标状态
2. queued 完成后再次 `host_register / state_sync` 不会顶回旧值
3. timeout / mismatch 能被明确区分，不混成同一种 warning

日志/裁决字段必须符合 [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)。通用发布门禁与回归矩阵以 [../../standards/release-guardrails.md](../../standards/release-guardrails.md) 为准。
