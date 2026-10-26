# Paradigm Mount Identity And Toc State Chain

## 1. 目标

定义范式挂载、mounted identity roundtrip、TOC / 定位 / 展开态的稳定合同。

## 2. 核心不变量

1. root binding 与 included 关系分开算
2. mounted roundtrip 字段必须稳定
3. TOC 不只是滚动入口，而是定位状态链的一部分
4. 定位要先展开必需层级，再 focus 目标
5. 高风险写操作必须后置

## 3. 主状态链

### 最小对象

1. `MountedIdentity`
2. `TocState`
3. `PendingFocus`

### 字段分类

#### `identity_key`

1. `mountedIdentityKey`
2. `collapseKey`
3. `pendingFocusKey`

#### `env_state_only`

1. `tocMode`
2. `panelVisible`
3. `tagFilterState`
4. `pendingFocusKey`

#### `diagnostic_only`

1. `rootParadigmIds`
2. `rootMap`

#### `content_state_forbidden_in_capsules`

1. 挂载关系明细真值
2. 范式内容编辑结果
3. 任何为 restore-time 写回准备的重算映射

至少要明确：

1. mounted identity
2. collapse key
3. pending focus
4. TOC mode
5. panel visibility
6. tag filter visibility / state bucket

## 4. 必须服从的横切标准

1. [../../standards/system-boundaries.md](../../standards/system-boundaries.md)
2. [../../standards/release-guardrails.md](../../standards/release-guardrails.md)
3. [local-write-view-stability.md](local-write-view-stability.md)

## 5. 相关附录

视觉语义参考：

1. [../../appendices/paradigm-panel-visual-state-semantics.md](../../appendices/paradigm-panel-visual-state-semantics.md)

## 6. 明确禁止

1. 对所有 included 节点直接开放高风险写操作
2. 只做“滚动过去”而不保状态链
3. 把 TOC 状态和别的状态桶随意混并

## 7. 拒收条件

1. 直接把 `rootMap` 一类运行时映射当作 capsule 持久态真值
2. 未展开必需层级就直接执行定位
3. 把 mounted roundtrip 验收降级成“看起来能滚过去”
4. 用 TOC 临时显示结构回写真实挂载关系

## 8. 验收标准

1. mounted identity roundtrip 稳定
2. `tocMode / panelVisible / pendingFocusKey` roundtrip 稳定
3. 点击 TOC / 范式节点时，先展开必需层级，再 focus 到正确区域
4. `rootParadigmIds / rootMap` 仅用于运行时定位与诊断，不进入 capsule 内容态

## 9. 本协议特有回归项

1. direct / inherited / copy 三类节点在 TOC 与 panel 的状态链一致
2. 切 `paradigm / tab` 两种 TOC 模式后，pending focus 仍能落到目标区域
3. tag filter 状态桶不污染 TOC collapse / pending focus 状态

日志/裁决字段必须符合 [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)。通用发布门禁与回归矩阵以 [../../standards/release-guardrails.md](../../standards/release-guardrails.md) 为准。
