# System Boundaries

## 1. 先分三类状态

### 环境态

只描述“当前怎么看”：

1. `activeTabId`
2. 折叠状态
3. TOC 开关 / 面板开关
4. 页面滚动位置
5. 显式 focus / pending focus 这类瞬时 UI 阀门

### 内容态

是真实业务内容：

1. Tab / 条目 / 评论 / 绑定
2. 范式定义与挂载关系
3. 普通条目关键词绑定
4. 业务 JSON 里的对象结构

### 派生态

是根据内容态计算出来的中间结构：

1. 索引
2. 树视图
3. 统计
4. 关键词树
5. 显示用映射

派生态可以重建，但不能借“重建”之名污染内容态。

## 2. State Capsules 的职责

`state-capsules` 的职责是恢复环境态阀门，不是时间回溯器。

它应该做：

1. 解析目标 host
2. 获取 bridge
3. 应用环境态
4. 校验 live host 上的结果

它不应该做：

1. 向业务 JSON 写回内容
2. 因 `verify` 失败回写空值
3. 因 restore 成功触发保存
4. 在 capsule restore 中重排 `workspace-mount` 内容

## 3. Workspace Mount 的 restore 边界

正确路径：

1. 只读加载业务数据
2. 绑定正确 host
3. 在内存 / UI 中应用环境态
4. render
5. 发布 bridge state changed

禁止路径：

1. `restore -> normalize -> save`
2. `restore -> merge old snapshot -> save`
3. `restore -> fallback current active host -> save`

## 4. 为什么 restore-time writeback 危险

它会制造这类假象：

1. 条目没删，但因为旧结构被重新写回，看起来“消失”
2. tab 位置被旧快照重放，新增内容落到用户看不到的位置
3. 历史关键词或挂载关系仍在盘里，但显示链路被旧结构覆盖

根本原则：

1. `capture env-only` 不等于 `restore safe`
2. 安全性取决于 `applyState()` 是否还会改写业务 JSON

## 5. 内容态扩展的硬规则

凡是新增字段，都先判断属于哪类：

1. 环境态：可以进入 capsule bridge state
2. 内容态：必须走业务插件自己的持久化链
3. 派生态：可以缓存，但必须可重建，不得当业务真值

## 6. 非破坏性更新

以后任何结构升级都默认：

1. 旧数据仍能读
2. 旧 key 仍能识别
3. 旧平面结构可投影到新 UI
4. 没迁移完成之前，不得让历史数据“看不见”

## 7. 直接适用的判断句

遇到疑问时，先问：

1. 这是“我此刻怎么看”，还是“东西本身是什么”
2. 这个字段丢了会影响展示，还是会改写业务真相
3. 这次修复是在恢复视图，还是在偷偷重建内容

只要答案偏向后者，就不要放进 `state-capsules`。
