# Console Logging Standard

## 1. 目标

通信和恢复类日志必须能回答：

1. 这笔事务是谁
2. 命中了哪个 host
3. 失败在哪一段
4. mismatch 在哪些字段
5. queued 是否真正闭环

## 2. 命名规则

推荐前缀：

`[PluginNamespace][FeatureArea][tx:<txId>][eventName]`

例如：

1. `[StateCapsules][workspaceMount][tx:capsule_tx_xxx][host.resolve]`
2. `[EVARelations][jump][tx:jump_xxx][open.direct-result]`

## 3. 事务最小字段

每笔事务默认至少要有：

1. `txId`
2. `status`
3. `reasonCodes`
4. `warnings`
5. `scopeType`
6. `scopeKey`
7. `notePath`
8. `hostId`

## 4. 校验关键字段

做 verify 时，至少保证可见：

1. `mismatchFields`
2. `digestMatch` 或等价裁决
3. `fieldMatches` 或等价字段级结果
4. `candidates`（发生 host 歧义时）

queued 路径还要有：

1. `queueId`
2. `pending_consumed`
3. `applied-after-queue`
4. `applied-after-queue-verified`
5. `queue-verify-timeout` / `queue-verify-mismatch`

## 5. 事件枚举建议

至少统一这些名字，不要混写：

1. `switch.start`
2. `host.resolve`
3. `capture.result`
4. `persist.result`
5. `readback.result`
6. `restore.result`
7. `verify.result`
8. `summary`

## 6. PASS / WARN / FAIL

### PASS

1. 事务走通
2. verify 成功

### WARN

1. 主链成功，但存在需要继续观察的异常
2. queued 路径最终闭环但不是直达成功

### FAIL

1. host 解析失败
2. capture / persist / restore / verify 任一关键环失败
3. verify 明确 mismatch

## 7. 高风险信号

看到以下任一项，就不要轻易判“功能正常”：

1. 没有 `txId`
2. `host.resolve` 未明确命中 host
3. host 歧义但未输出 `candidates`
4. capture 缺字段但未显式写 `missingFields`
5. verify mismatch 但没有 `mismatchFields`
6. queued 路径没有闭环事件

## 8. 禁止日志写法

1. 把大对象整坨打到 console
2. 把内容态正文、大数组、大映射直接塞进日志
3. 混用 `verifyResult`、`verify-result`、`verify.result`
4. fallback 命中 host 但日志里不写

## 9. 直接判读原则

最终以：

1. `verify.result`
2. `summary.finalVerdict`

为准，不以“看起来像成功”的局部日志为准。
