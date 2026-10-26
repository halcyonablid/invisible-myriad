# Release Guardrails

## 1. 进入实现前的必过清单

### 三张图

1. 系统边界图
2. host / bridge / bus 关系图
3. tx / persist / restore / verify 时序图

### 先回答的硬问题

1. 谁是状态源头
2. 谁是状态消费者
3. 哪些字段属于环境态
4. 哪些字段属于内容态
5. 是否需要旧 key / 旧结构兼容
6. 是否会影响历史数据可见性

## 2. 发布门禁 10 条

1. 环境态 / 内容态边界已明确
2. restore 路径不写业务 JSON
3. host 身份字段已明确
4. bridge 接口已收口
5. tx / verify / summary 日志齐全
6. queued 路径可闭环
7. 历史数据兼容策略已写明
8. 审计留痕接入点已明确
9. 多实例 / 多 host 测试已做
10. 已经过独立 verifier

## 3. 手工验证矩阵

至少覆盖：

1. 单 host 正常 capture / restore
2. 多 host 并存
3. host reload / remount
4. queued restore
5. workspace -> GTD / collection 跳转
6. GTD -> workspace / collection 跳转
7. collection -> workspace / GTD 跳转
8. TOC / 面板开合时的页面稳定性
9. 旧数据在新 UI 下仍可见
10. capsule 切换后不触发内容态污染

## 4. 非破坏性迁移

结构升级默认遵守：

1. 旧字段可读
2. 旧数据可映射显示
3. 新逻辑不覆盖旧业务数据
4. 如果需要迁移，先明确迁移点、失败回退和盘上兼容

## 5. 运行目录边界

1. 用户指定实际运行目录时，默认只读分析
2. 先在当前仓库形成补丁和验证
3. 未经确认，不写回运行环境

## 6. Windows / UTF-8 约束

1. 源码类文本排查优先用 Node 显式按 UTF-8 读取
2. 避免被 PowerShell 默认编码误导
3. 高风险编码文件先 staging，再回写

## 7. Verifier-before-merge

以下场景是硬门槛：

1. 规则 / Skill 修改
2. 协议修改
3. 多文件根因修复
4. 高风险保存 / 恢复路径
5. 最终交付前

没有 verifier 结论，不进入最终落盘。
