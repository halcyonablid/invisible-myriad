# Local Write View Stability

## 1. 目标

定义本地写入、TOC / 面板开合、UI-only rerender 之后怎样保持视角稳定。

## 2. 核心不变量

1. 本地写数据默认不抢回旧 `scrollTop`
2. “显式定位”和“稳定保持”必须拆开
3. 上方结构高度变化时，优先锚点恢复
4. `pending focus` / reveal 链路优先于普通滚动补偿

## 3. 主策略

### 最小对象

1. `ScrollAnchor`
2. `StableRerenderContext`
3. `ExplicitFocusRequest`

### 字段分类

#### `identity_key`

1. `anchorType`
2. `anchorKey`

#### `env_state_only`

1. `relativeTop`
2. `hasPendingFocus`
3. `shouldRestorePinnedScrollAfterRender`

#### `diagnostic_only`

1. 锚点命中来源
2. 本轮是否走了普通 scroll restore

#### `content_state_forbidden_in_capsules`

1. 任何为滚动恢复临时记录的 DOM 层对象

1. 本地写入后默认不自动 scroll restore
2. 使用 `rerenderPreservingScroll()` 一类 UI-only 恢复路径
3. 先找锚点元素，再恢复相对偏移
4. 找不到锚点时才退回普通滚动恢复

## 4. 必须服从的横切标准

1. [../../standards/release-guardrails.md](../../standards/release-guardrails.md)
2. [../../appendices/console-ops-runbook.md](../../appendices/console-ops-runbook.md)

## 5. 历史来源

旧稿保留在：

1. [../../legacy/view-stability-and-scroll.md](../../legacy/view-stability-and-scroll.md)

## 6. 明确禁止

1. 多轮延时 restore 抢页面
2. 为了目标页打开成功而把源页顶回顶部
3. 只看数值稳定，不看视角稳定

## 7. 拒收条件

1. 本地写入后默认抢回旧 `scrollTop`
2. `pending focus` 存在时仍执行普通 scroll 补偿
3. 锚点恢复成功后仍继续调度旧 scroll restore
4. 只用数值稳定证明“页面稳定”

## 8. 验收标准

1. 新增条目后页面不上跳
2. TOC / 面板开合后当前阅读锚点仍在原位置附近
3. 显式定位链路优先于普通滚动补偿
4. bulk transfer / 本地编辑 / 切 tab 三类路径不会互相抢页面位置

## 9. 本协议特有回归项

1. 条目在当前视口上方插入时，页面不被旧 `scrollTop` 顶走
2. `TOC` 开合、`范式面板 / Tab里面` 切换时视角稳定
3. 已 pin 与显式 jump 并存时，仍以显式定位为先

日志/裁决字段必须符合 [../../standards/console-logging-standard.md](../../standards/console-logging-standard.md)。通用发布门禁与回归矩阵以 [../../standards/release-guardrails.md](../../standards/release-guardrails.md) 为准。
