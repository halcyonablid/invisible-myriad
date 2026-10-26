# Atlas Glossary

status: active
created: 2026-06-24

This glossary records canonical high-risk system terms. It is intentionally not a general dictionary.

## 项目纵深管理

- canonical_term: 项目纵深管理
- type: plugin_view / project_interface
- owner: project-execution-overview
- meaning: Project Overview 的项目界面，按列投影 Workspace、九宫格、Keyword、范式积累、GTD、Collection Card、Timeline、EVA 等证据。
- not: 不等于周追踪；不等于单一任务列表；不等于项目纵向管理。
- related: Project Overview, AI context export, evidence ledger

## 项目纵向管理

- canonical_term: 项目纵向管理
- aliases: 项目执行计划
- type: upper_level_project_plan
- owner: mandala-time-blocks
- meaning: 按 Workspace 主键保存的上层项目界面，包含最终愿景、价值取向、当前现实、下一步行动、关键里程碑+日期。
- not: 不按周分行；不是项目管理按周汇总；不是普通本周计划。
- related: 周追踪, 项目管理：按周汇总, Workspace 主键

## 项目执行计划

- canonical_term: 项目纵向管理
- type: alias_or_ui_tab
- owner: mandala-time-blocks
- meaning: 周追踪 modal 中的项目上层计划 tab；语义上等同项目纵向管理。
- not: 不要误解为每周执行计划列表。

## 项目管理：按周汇总

- canonical_term: 项目管理：按周汇总
- type: weekly_summary_tab
- owner: mandala-time-blocks
- meaning: 周追踪 modal 中按 Workspace 主键汇总某一周项目状态的 tab。
- not: 不等于项目纵向管理；不保存最终愿景/价值取向这类上层字段。

## 周追踪

- canonical_term: 周追踪
- type: weekly_tracking_workbench
- owner: mandala-time-blocks
- meaning: 目标/项目的周尺度计划、完成、交接、复盘界面。项目侧联动同名 Workspace 主键的项目管理按周汇总和项目纵向管理。
- not: 不是唯一当前状态裁判；可能因为用户未及时填写而不完整。

## 范式积累

- canonical_term: 范式积累
- type: project_overview_column
- owner: project-execution-overview projection over ordinary notes / workspace material
- meaning: 事实、调查材料、历史过程、项目环境和可复用知识资产。
- not: 不等于明确下一步待办；不等于 GTD 启发。

## GTD

- canonical_term: GTD
- type: heuristic_action_prompt
- owner: GTD / DataviewJS layer
- meaning: 启发式自我提示，帮助发现可能值得做什么。
- not: 不等于已承诺任务；不等于 Collection Card。

## Collection Card

- canonical_term: Collection Card
- type: explicit_next_action_layer
- owner: collection-card-view
- meaning: 更明确的下一步、具体待办或由前面上下文派生出的行动项。
- not: 不等于范式积累事实材料；不等于纯启发。

## Workspace 主键

- canonical_term: Workspace 主键
- type: project_anchor
- owner: project-execution-overview / workspace-mount context
- meaning: 项目或执行容器的主锚点，用于 Project Overview 分组、项目周追踪和项目纵向管理联动。
- not: 不保证每个 Workspace 主键都一定是狭义项目；可能是领域、资源或容器。

## Context Capsule Key / 操作上下文主键

- canonical_term: Context Capsule Key
- aliases: 操作上下文主键, 操作级关键词, 胶囊级关键词
- type: cross_plugin_operational_identity
- owner: PEO 声明与描述符投影 / 各消费插件本地绑定；永久身份 registry 尚未生产接入
- meaning: 跨插件共享的操作对象标识与描述，包含 `contextKeyId`、编号地址、canonical label、颜色和图标。当前描述符仍可能使用名称派生 ID；完整 subject 引用与未来永久 contextId 需区分。PEO 管理声明和改名协调，消费插件拥有本地内容。
- not: 不等于 Obsidian note 级 Keyword；不等于 Workspace tab；不等于 GTD 待办；不接管 Mandala、Workspace、Collection Card、SuperMemo 等插件业务内容。
- related: Project Overview, Workspace Mount, Keyword symbolic interface, cross-plugin contracts

## Effective Operational Context Key / 有效操作上下文主键

- canonical_term: Effective Operational Context Key
- aliases: 有效操作上下文主键, 当前有效操作上下文主键
- type: derived_current_eligibility_projection
- provider: mandala-time-blocks bounded final aggregator
- meaning: 项目域与目标域操作上下文主键的当前有效投影；项目依赖 Workspace 根载体，目标依赖完整 Mandala owner 及唯一正向 GTD 顶层承载证据，两域共享 PEO 唯一当前声明和Mandala未停止追踪门禁（编号前缀不表达生命周期）；旧 Kill 仅作历史诊断，不再否决资格。完整规则见 [有效资格](knowledge/effective-operational-context-key.md)。
- not: 不是新的主键或 owner；不等于所有 Context Capsule Keys；不由 Timeline 历史、显示标题或单个插件的 retained row 单独决定。
- related: Context Capsule Key, Workspace 主键, FW-018, FW-019

## Context Key Center / 主键管理中心

- canonical_term: Context Key Center
- aliases: 主键管理中心, context-key-manager, 中心, 名称与同步（对象页入口名）
- type: identity_and_naming_authority_host
- provider: context-key-manager（identity-v3 存储）
- meaning: 已接管主键的永久身份（contextId）、正式名称与插件绑定关系的唯一权威；改名与绑定变更由它协调六个参与插件按计划写入，参与插件写前向它核验。
- not: 不是内容数据的 owner（卡片、条目、任务、评论仍归各插件）；不决定有效资格（仍由 Mandala 追踪与各 owner 证据决定）；尚未接管追踪（P2-D）与创建（P2-E）。“接管”指 naming.authority=center，未接管对象（“原入口管理”）仍走原入口。
- related: Effective Operational Context Key, [plugins/context-key-manager.md](plugins/context-key-manager.md), CKM-U01～03, FW-026

## 狄拉克海上的涟漪模式

- canonical_term: 狄拉克海上的涟漪模式
- aliases: 起点模式, 涟漪模式, 典型状态模式
- type: state_capsule_operating_model
- owner: state-capsules user practice / Atlas knowledge
- meaning: 只手动维护少量可反复复用的典型行程起点；每次恢复后的实际操作是暂态涟漪，切换时不自动保存。只有出现真正值得长期区分的新起点时才新增胶囊，使系统结构渐进生成。
- not: 不等于自动保存最近位置；不等于每次切换都制造快照；不要求用户在每一时刻为了未来界面可读性整理当前行程。
- related: State Capsules, Context Capsule Key, activeCapsuleId, manually maintained launch baseline

## Keyword / 关键词胶囊

- canonical_term: Keyword
- type: symbolic_entry
- owner: keyword-index-plugin
- meaning: Antinet / 编号树入口符号，是用户与整个库沟通的符号端口，不是普通 tag。
- not: 不应被当作搜索标签或普通分类名。
- related: Keyword symbolic interface, BUS, SCON, Mermaid 网络地址

## Keyword symbolic interface / 关键词符号接口

- canonical_term: Keyword symbolic interface
- aliases: 关键词符号接口, 关键词作为系统沟通接口
- type: knowledge_model
- owner: Atlas knowledge / keyword-index-plugin user practice
- meaning: 关键词作为符号端口，下面的 note 条目作为信号承载，Antinet/ATOM 编号树作为地址空间；用户通过先找到关键词再下到具体树位置来和整个库沟通。
- not: 不等于普通标签搜索；不等于 Project Overview 或 COACH 拥有关键词数据。
- related: Keyword, BUS, SCON, Mermaid 网络地址, EVA relation

## BUS

- canonical_term: BUS
- type: keyword_drawer_growth_pattern
- owner: keyword-index-plugin
- meaning: 关键词或抽屉下的序列化增长路径，常用于承载连续经验或事件。
- not: 不等于普通文件夹名。

## SCON / Subconcept

- canonical_term: SCON
- aliases: subconcept, 子概念
- type: keyword_subconcept
- owner: keyword-index-plugin
- meaning: 抽屉文件夹下通过 `+SCON.` 表达的子概念胶囊。
- not: 不应直接无限嵌套 subconcept；具体规则见 keyword-antinet-bus workflow。

## Mermaid 网络地址

- canonical_term: Mermaid 网络地址
- type: visual_symbolic_address
- owner: Atlas knowledge / reference-graph-widget / antinet-tree practice
- meaning: Mermaid 图中 `ATOM@...`、`+`、`.`、`subgraph` 等共同表达的地址、状态转移、子图层级和容器语义。
- not: 不只是图形布局；不只是字符串 id。

## EVA relation

- canonical_term: EVA relation
- type: cross_view_relation
- owner: eva-cross-view-relations
- meaning: 跨插件关系层，用于连接不同 view/node/note 的关系身份和跳转线索。
- not: 不是内容源本身；不自动成为用户意图的唯一事实源。

## AI context export

- canonical_term: AI context export
- type: read_only_evidence_packet
- owner: project-execution-overview
- meaning: 给 AI/COACH 的只读项目证据包，保留来源列、关系、诊断和截断信息。
- not: 不是业务 JSON 的写入口；不是让 AI 直接接管插件数据。

## LLM Wiki operating model

- canonical_term: LLM Wiki operating model
- aliases: LLM Wiki 模式, Atlas Wiki 模式
- type: knowledge_operating_model
- owner: Atlas knowledge / framework control plane / skill activation
- meaning: 用稳定 markdown 文件作为认知硬件，用 Skill 作为运行时激活信号，用 framework 更新协议、Atlas 索引、查询和 lint 工具维持可读、可追溯、可迭代的长期知识层。
- not: 不等于普通笔记集合；不等于只让 Skill 学会；不应把 framework 扩写成第二个 Atlas。
- related: Atlas, framework, Skill, update protocol, P0/P1/P2/P3 maintenance
