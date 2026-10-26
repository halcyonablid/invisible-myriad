# Verify Allows Evolution

## 1. 目标

定义非破坏性 restore 的 verify 合同，避免把正常演化误判为失败。

## 2. 核心不变量

1. 强校验字段与漂移字段必须分层
2. verify 可以允许自然演化，但不能允许 host 命中错误
3. verify 放宽不能替代实现修正
4. restore 语义先纯化，再谈 verify 策略

## 3. 建议分层

### 最小对象

1. `StrongVerifySet`
2. `DriftAdvisorySet`
3. `VerifyVerdict`

### 字段分类

#### `strong_verify_only`

1. `notePath`
2. `dataPath`
3. host / scope 绑定结果

#### `drift_advisory_only`

1. 自然演化的 tab / collapse / 运行时排序差异
2. 不影响主恢复目标的 UI 漂移

#### `diagnostic_only`

1. `mismatchFields`
2. drift sample

#### `content_state_forbidden_in_capsules`

1. 为了 verify 方便而临时拼接的全量内容镜像

### 强校验

用于判定事务是否可接受。

### 漂移告警

用于表示运行中自然演化、但主恢复目标已达成。

建议显式保留类似：

1. `operational-match-with-drift`

## 4. 必须服从的横切标准

1. [../../standards/system-boundaries.md](../../standards/system-boundaries.md)
2. [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)
3. [../../appendices/console-ops-runbook.md](../../appendices/console-ops-runbook.md)

## 5. 明确禁止

1. 用严格 digest 否定正常运行时演化
2. 用 verify 放宽掩盖 restore-time writeback
3. mismatch 时只给结论，不给字段级定位

## 6. 拒收条件

1. host / note / data 绑定错误却只记为 drift
2. `verify.result` 缺少 `mismatchFields`
3. 为了 drift 判读输出全量大对象
4. 用放宽 verify 掩盖 restore-time writeback

## 7. 验收标准

1. 强校验 mismatch 时能明确给出 `FAIL`
2. 只有自然演化时，能明确给出 `operational-match-with-drift`
3. drift 日志只输出计数与 sample，不输出全量数组或正文
4. 结论与日志字段能被 console 标准直接判读

## 8. 本协议特有回归项

1. 正常自然演化时不再制造伪失败
2. 真正 host / note / data 绑定错误仍会被挡成失败
3. `WARN` 与 `FAIL` 的分界可被排障者稳定复现

日志/裁决字段必须符合 [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)。通用发布门禁与回归矩阵以 [../../standards/release-guardrails.md](../../standards/release-guardrails.md) 为准。
