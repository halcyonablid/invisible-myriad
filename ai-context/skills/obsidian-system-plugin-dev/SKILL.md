---
name: obsidian-system-plugin-dev
description: 开发、改造、排障和延展用户这套 Obsidian 系统插件与宏观框架的专用技能。用于处理 `state-capsules`、`workspace-mount`、`collection-card-view`、`eva-cross-view-relations`、`operation-audit-trail`、Project Overview、Mandala、Keyword、MemPalace、AI context export 及其相关协议时，要求先读长期框架入口并判断环境态、内容态、派生态、跨插件协议、UI contract、宏观层级和依赖方契约影响面，再按通信、跳转、关键词 BUS、页面稳定性、审计留痕与日志标准执行，避免 restore-time writeback、危险归一化、跨插件串线、历史数据破坏和滚动补偿失控。当修改任一系统插件的协议、API、事件、bridge、UI contract、data schema、command、输入类 modal 或可被其他插件依赖的行为时，必须识别依赖插件并评估匹配修改；当存在运行库/runtime、开发库/dev、镜像库/mirror 或多套同名插件目录时，必须先证明实际 Obsidian vault/runtime 绝对路径，再做 SHA-256 哈希对齐、备份、canonical 判定、diff/功能哨兵和同步方向记录，默认以已证明的实际运行库为准；当修改评论、说明、备注、长文本等输入类 modal 时，必须保护隐式关闭路径中的已修改内容。
---

# Obsidian System Plugin Dev

## 安装位置与项目资源

本目录是开发 Skill 的可移植发布副本，references 随包提供；工作流中的原始全局 Skill 仍为维护来源。先读 ../../README.md，按本地克隆路径绑定环境。

`system_workspace_root` = 本资料包根目录的绝对路径（GitHub 中为 `ai-context/`，本机为归档文件夹）。本Skill中prompts、memory、scripts、tools和state等工作流相对路径以该根解析，scripts/tools命令必须明确以该根为工作目录；它不是Obsidian vault。本分享包没有原作者的活动 state 或完整工具链；必须先确认当前任务的项目、可用工具及用户授权，再决定是否执行工程命令。该根缺失时先定位正确工作流，不能猜测vault或执行写入。

Framework/Atlas等跨目录链接指向此工作流资源；Skill内部references相对本全局目录解析。新方法Skill是可选设计参考，链接缺失时说明方法未加载，按本Skill现有规则继续适用工作，不伪称已读；工程硬门所需规则缺失时先定位再执行依赖动作。

## Overview

先把这类工作视为“在已有系统约束里扩展能力”，不是普通单插件功能开发。任何改动都先判断它触及的是：

1. 环境态
2. 内容态
3. 派生态
4. 跨插件协议
5. UI-only 稳定性
6. 依赖方契约影响面
7. 输入类 modal 防丢
8. 三边目录一致性 / runtime canonical
9. 多实例实际运行库识别 / feature sentinel
10. 宏观框架 / AI context export / 项目效能教练读取流
11. 典型工作流的端到端响应、后台成本与可观测性；未来新插件从设计时规划测试点，在实现中接入适用边界，在验收时验证其开销和反馈路径。

如果判断错边界，后面的实现通常都会错。

同时遵守 [@prompts/rules/workflow_core.md](<../../prompts/rules/workflow_core.md>)。复杂、长链路、可中断或需要跨 agent 接力的 Obsidian 插件工程，同时遵守 [@prompts/rules/project_continuity.md](<../../prompts/rules/project_continuity.md>)。不要把通用流程规则复制进这个 skill。

## Workflow

### 0. 先进入宏观框架环境

当任务涉及“Obsidian 插件系统整体框架”、持续维护框架、利用框架、项目效能教练、AI context export、Project Overview / Mandala / Workspace / EVA / Keyword / MemPalace 协同，或任何系统级插件设计时，先读长期框架入口。

当用户说“用框架落一下”、提供新的插件使用经验、解释某个插件/函数/编号/UI 设计原因，或要求把经验转成框架状态更新时，必须读取 `memory/obsidian-plugin-system/framework/update-protocol.md`，按 observation -> claim -> source status -> update target -> Bayesian update label -> trace 执行。

本发布包的框架根目录是 `ai-context/memory/obsidian-plugin-system/framework/`。优先读：

1. [framework/entry-index.md](<../../memory/obsidian-plugin-system/framework/entry-index.md>)
2. [framework/question-map.md](<../../memory/obsidian-plugin-system/framework/question-map.md>)
3. [atlas/README.md](<../../memory/obsidian-plugin-system/atlas/README.md>)

涉及用户系统专有名词时，先读 [atlas/glossary.md](<../../memory/obsidian-plugin-system/atlas/glossary.md>) 和 [atlas/aliases.md](<../../memory/obsidian-plugin-system/atlas/aliases.md>)，不要凭意译合并概念。高风险词包括：项目纵深管理、项目纵向管理、项目执行计划、项目管理：按周汇总、周追踪、范式积累、GTD、Collection Card、Workspace 主键、Keyword/BUS/SCON、Mermaid 网络地址、EVA relation、AI context export。

需要阅读完整说明时，再读 [obsidian_plugin_system_framework.md](<../../output/reports/obsidian_plugin_system_framework.md>)。当前为 global skill，框架相对路径按本Skill顶部已绑定的 system_workspace_root 解析；不使用任意当前工作目录推断框架位置。

### 0.1 Atlas maintenance / LLM Wiki 熵减触发

当用户明确说“跑一次 Atlas 维护”“检查 LLM Wiki 健康度”“框架熵减一下”“检查术语漂移”“检查 Atlas 索引”等，先执行 P0 维护检查：

```powershell
py scripts\atlas_index_check.py
py scripts\atlas_term_drift_check.py
```

这两个脚本只读扫描框架/Atlas/Skill，并只写 `results/atlas_index_check.json` 与 `results/atlas_term_drift_check.json`。它们不自动修复、不写 runtime、不碰业务 JSON。

当用户明确说“跑 P1 Atlas 维护”“检查陈旧声明”“检查来源追溯”“检查更新协议守门”“用框架落一下之前先守门”等，执行 P1 维护检查：

```powershell
py scripts\atlas_stale_claims_check.py
py scripts\atlas_source_trace_check.py
py scripts\atlas_update_protocol_check.py
```

P1 脚本只读扫描 Atlas / framework / change-records / cards / repo-local skills，并只写 `results/atlas_stale_claims.json`、`results/atlas_source_trace_check.json`、`results/atlas_update_protocol_check.json`。P1 的 `YELLOW` 默认表示复核队列或 checklist 提醒，不表示自动失败；不得借 P1 输出自动改写 Atlas、Question Map、业务 JSON、runtime 或 `state/cards`。

当用户明确说“跑 P2 Atlas 维护”“Atlas lint”“生成 Atlas 索引草稿”“同步 Question Map/Unknowns”“检查 Question Map 和 unknowns 是否分裂”等，执行 P2 维护检查：

```powershell
py scripts\atlas_question_map_sync_check.py
py scripts\atlas_index_suggest.py
py scripts\atlas_lint.py
```

P2 仍然不自动修复。`atlas_question_map_sync_check.py` 只写 `results/atlas_question_map_sync.json`；`atlas_index_suggest.py` 只生成 `results/atlas_index_suggested.md` 和 `results/atlas_index_suggested.json`，不覆盖 `atlas/index.md`；`atlas_lint.py` 只汇总已有 `results/atlas_*.json`，不运行子脚本、不间接刷新其他结果。P2 的 `YELLOW` 表示整体健康提醒、索引草稿差异、Question Map/Unknowns 同步机会或下游检查已有 warning/note。

当用户明确说“查 Atlas”“Atlas 查询”“用 Atlas 先查某概念”“不要全库乱扫，先查 Atlas”等，执行 P3 查询入口：

```powershell
py scripts\atlas_query.py "<concept>"
```

P3 是 Atlas-first 查询入口，不是全库搜索器。它只在 repo-local Atlas / framework / change-records / memory cards / repo-local Skill 入口的 allowlist 内做轻量 markdown 查询，只写 `results/atlas_query_last.json`，不扫描 runtime、业务 JSON、`state/cards`、`workspaces/` 或 MemPalace 卡。P3 查询结果用于定位 canonical term、aliases、相关 Atlas 页面、open unknowns、经验卡和工程记录候选；它不等于代码事实，也不替代后续证据读取。

### 0.1.1 MemPalace / Atlas 查询边界

当 MemPalace 用于 Obsidian 插件系统经验召回时，必须优先使用当前仓库专用入口：

```powershell
.\scripts\mempalace_search_obsidian_plugin_memory.ps1 "<query>"
.\scripts\mempalace_restore_obsidian_plugin_memory.ps1
```

这两个脚本负责 MemPalace 向量搜索、HNSW/Chroma 故障识别、timeout、`-MaxResults` 和 bounded `rg` fallback。若 MemPalace 索引失败或超时，不得手工对 repo root、`workspaces/`、`state/backups/`、`memory/mempalace_data*`、历史 vault、runtime-like 目录、`.git` 或 `node_modules` 做全量 `rg`；只能通过脚本的 `-Room all|atlas|cards|change-records|framework|sources` 白名单进入 `memory/obsidian-plugin-system/{atlas,cards,change-records,framework,sources}`。需要查源码依赖时，另按契约影响面扫描执行，并记录关键词、范围和结论；不要把“经验召回”扩大成“全仓代码事实扫描”。

当本轮要把 Obsidian 插件经验真实 mine 进 MemPalace 时，必须同时遵守 `@prompts/rules/workflow_core.md` 的“Obsidian 插件 MemPalace 向量索引事务式发布门禁”：真实 mine 先写 staging palace，只有 staging 通过 `status`、相关 `search` 和 HNSW segment 完整性检查后，才允许备份 current、保留 previous-good 并发布；若专用脚本尚未实现 staging/manifest/previous-good 机制，只能执行 dry-run、制卡和只读回验，不得原地改写正式 palace。

MemPalace staging 的健康必须同时覆盖 client 生命周期、语义召回和物理索引：真实 mine 在同一个 `PersistentClient` 内完成 drawers/closets finalize 并关闭 client，再由全新进程执行 expected-source 的 unfiltered + room-filtered 双查询；SQLite 中每个 `VECTOR` segment 必须与同名完整 HNSW 目录一一对应。`status`、drawer 数、SQLite embeddings、四个 HNSW 文件或普通搜索任一单项成功都不足以证明可召回；`Error finding id` 和 room filter 失败是发布阻断项。SQLite-only reconstruction 只可隔离诊断，不得直接发布。

交付和 verifier 记录中必须区分三种状态：`已制卡` 表示 markdown 源已写入 `memory/obsidian-plugin-system/cards/` 或相关来源目录；`已 mine` 表示真实 mine 完成且 manifest 记录了 SQLite / metadata / embeddings / HNSW 状态；`可召回` 表示发布后的 current palace 能用相关关键词 search 命中。`metadata`、`embeddings`、`chroma.sqlite3` 或 dry-run 成功不能单独证明 `可召回`。

当完成重大框架、Skill、插件协议、COACH 经验、AI context export、Mermaid 地址语义或跨插件 ownership 更新，而用户没有明确要求维护时，在收尾时建议运行 Atlas maintenance；若本次改变了长期 claim、来源链或更新协议路径，则建议同时运行 P1；若本次新增 Atlas 页面、长期问题或 unknown，则建议运行 P2。不要让每次小改都强制跑维护。

### 0.2 Framework / Atlas update check

每次 Obsidian 插件开发、排障、runtime/dev/mirror 同步、跨插件契约修改、用户实践语义确认或系统级框架维护结束前，必须做一次 `Framework/Atlas update check`。这不是要求每次都写 Atlas，而是要求每次留下可审计判定。

若本轮产生新的 ownership、provider/consumer、contract/schema/event/command、JSON ownership、runtime 同步经验、regression sentinel、用户实践语义、可复用排障路径、失败模式或防呆规则，必须读取 `memory/obsidian-plugin-system/framework/update-protocol.md`，按 observation -> claim -> source status -> update target -> trace 选择最窄落点。

判定结果只能是：

1. `updated`：写明已更新的 `framework/`、`atlas/`、`memory/obsidian-plugin-system/cards/` 或 `change-records/` 目标。
2. `not_updated`：写明只是一次性工程事实、没有可复用经验、没有框架模型变化，或已被既有协议覆盖。
3. `deferred`：写明延期原因、候选目标、缺少的证据和下次触发条件。

用框架先判断本次工作属于哪一层：符号入口、拓扑地址、材料承载、计划追踪、关系跳转、执行聚合、行动启发、记忆传承、代码理解。再进入具体插件实现或排障。

如果任务涉及 Project Overview / Mandala / Workspace / EVA / Keyword 之间的关系，修改前必须回答：

1. provider 是谁？
2. consumer 是谁？
3. contract 类型是什么？
4. 旧数据、旧入口和旧 UI 是否兼容？

Project Overview 默认是聚合器和证据投影器，不直接成为 Mandala、Keyword 或 Workspace 业务 JSON 的第二主人。AI 使用框架理解项目时，优先读取 Project Overview AI context export、Workspace / Mandala / EVA 证据、MemPalace / Atlas / change-records；只有证据包不足时，才说明原因并进入源码或 JSON。

跨插件聚合或性能优化任务必须先区分 Map/Reduce 边界：provider 通过 owner API 提供 bounded read-only snapshot / count / cursor / identity；Project Overview 等 aggregator 只负责 deterministic reduce、去重、排序、分组、诊断和降级显示。不得为了提速退化为全库/全 JSON/全 runtime 扫描，也不得用 provider-global hard limit 掩盖语义饥饿；limit taxonomy 至少说明 `per-query`、`per-target-per-provider`、provider total diagnostics、model-global backstop。相关长期规则见 `memory/obsidian-plugin-system/atlas/knowledge/cross-plugin-aggregation-mapreduce-pipeline.md`。

### 0.3 Complex project checkpoint / resume gate

当 Obsidian 插件任务跨多个插件、多个阶段、多个 agent，或上下文风险已经高到下一位 agent 无法只靠聊天记录恢复时，先按 `@prompts/rules/project_continuity.md` 建立复杂项目 checkpoint。这里的 checkpoint 是项目续跑面，不替代工程变更记录卡，也不替代 Framework/Atlas update check。

以下场景默认触发 checkpoint：

1. 跨 Project Overview / Mandala / Workspace / EVA / Keyword / MemPalace / COACH 的联动修改或排障。
2. 修改任一对外契约：bridge API、event、command id、DOM/data hook、setting key、JSON schema、console/audit event、UI contract。
3. 需要证明 actual runtime、处理 runtime/dev/mirror 不一致、做三边哈希、diff、功能哨兵或同步方向记录。
4. 涉及 restore/capsule、queued focus、跨视图跳转、业务 JSON ownership、输入类 modal 防丢或高风险保存路径。
5. 进入 verifier handoff、计划因新证据改变、任务暂停/切换、阶段完成后需要下一位 owner 接手。

以下场景不强制触发 checkpoint：只读快速定位、无接力风险的一次性 console 排障、单文件小范围说明性修正、无 runtime/协议/多插件影响的小 UI 调整。若小修在执行中扩展为上面的触发场景，再补 checkpoint。

checkpoint 只更新最小必要的 `state/` 续跑面：`state/MATERIAL_AUDIT.md`、`state/PLAN.md`、`state/RESEARCH_SUMMARY.md`、`state/CARD_LIBRARY.md`、`state/INDEPENDENT_VERIFICATION.md`、`state/LOG.md`，必要时包含 `results/card_audit.json`。普通续跑状态、临时分析和 handoff 片段不得写入 `state/cards/`；只有研究结论、概念节点或 durable evidence card 才按 `prompts/rules/second_brain.md` 进入 `state/cards/`。

项目专用知识默认留在 active `state/` 文件。只有可复用、证据状态明确、并通过 `memory/obsidian-plugin-system/framework/update-protocol.md` 选定最窄落点的成熟 claim，才 promotion 到 Framework、Atlas、`memory/obsidian-plugin-system/cards/`、change-records、MemPalace 或本 Skill。复杂项目 verifier 必须额外检查 `resume_completeness`、`promotion_boundary`、`target_selection`、`write_safety` 和 `handoff_quality`。

### 0.4 整体计划对账与子批优先级门禁

对本 Skill 处理的跨插件、分阶段或可续跑项目，执行链必须是：长期入口 → 确认当前项目 → 整体计划与证据对账 → 选择优先级 → 子批执行。读取 Framework/Atlas 后，不能直接沿用上一子批的“下一步”。长期入口负责系统边界、职责、契约和知识来源；当前计划决定工作范围、顺序及完成条件。

**唯一计划与读取顺序**：先按 `@prompts/rules/project_continuity.md` 及 Project Workspace Manager 确认 `project_workspaces/active-project.json` 与当前任务对应；读取当前活动 `state/INPUT_PROFILE.yaml`、`state/PLAN.md` 的当前有效部分、`state/MATERIAL_AUDIT.md`、`state/STATUS.yaml`、必要的研究摘要/独立结论及 LOG 尾部。`state/PLAN.md` 是当前活动项目唯一执行计划，包含整体目标、范围、优先级、依赖、停止条件和验收口径；`MATERIAL_AUDIT.md` 是材料、Question Map、证据缺口和风险的权威审计面，为 PLAN 的决策提供依据，不另设执行顺序。`STATUS.yaml`、checkpoint next-action、子批 PLAN、Atlas/Framework 阶段摘要及历史报告只投影或细化当前计划，不能各自成为第二套总计划。这里的计划权威不覆盖用户指令和 `prompts/rules/*` 的硬门禁。

若当前任务不是活动项目，不把其他项目的 state 当成本任务依据；历史查询使用 inspect，确需切换/续跑按既有 checkpoint/switch/resume/drift-audit 流程处理。未登记的短任务不为此强制建立复杂项目；任务扩为系统级多批工程时再按 0.3 建立活动计划。多个历史版本保留作溯源，执行时定位明确标示的当前有效计划，不能只按最后一条日志或文件 mtime 猜顺序。

**触发点**：开始/恢复复杂项目、选择每一个新子批、上一批验收失败或新证据改变依赖/范围/风险、用户改变目标/指出偏离，以及准备阶段交付或部署时，必须重新做整体对账。同一个已审子批内的常规读取、补丁、测试不重复完整盘点；若其范围扩大或发现整体冲突，再触发本门禁。未触发重决策时可以引用仍有效的已审对账，说明没有新增变化。

**选择前必须回答并记录**：

1. 当前总体目标、交付范围和完成标准是什么？本子批对应 PLAN 哪个工作包？
2. 范围内每个模块/跨视图链目前到哪一层：开发接入、完整主流程接管、实际加载/部署验收？原有入口、数据 owner、消费者和未接能力有哪些证据与 unknown？未知不得计完成，不能凭插件名出现或几个按钮通过认定整插件接管。
3. 当前整体阻塞、依赖与最高风险是什么？本批解除哪个阻塞，与其他模块的待办比较为何现在优先？按数据/身份安全、必需前置依赖和当前交付闭环判断，不能以熟悉某插件、测试容易或上一批已经排过作为优先理由；可并行与暂缓项要有依据。
4. 本批完成后能关闭哪项整体验收，仍不能关闭哪些项？实际验收所需的旧 writer 退出、消费者联动、性能、恢复/回退和原功能保留是否仍有缺口？

对账写入或引用已有 PLAN 的对应决策和 MATERIAL_AUDIT 的证据/问题条目，过程摘要留在既有 LOG；模块表可引用其原清单并只更新变化，不新建第二份总计划、调度状态或每轮重复复制全表。子批 PLAN 必须引用当前整体工作包、范围和放行条件，不得自行扩大、缩小或替换整体目标。

**冲突与陈旧入口**：Atlas/Framework 可能滞后；其中的阶段 next-action 与当前 PLAN 不一致时，以当前 PLAN 选择工作，不把旧摘要回写成当前顺序。若 PLAN 与 MATERIAL_AUDIT 的证据/风险、STATUS 投影或独立核查结论不一致，先只读查证、标出冲突和缺证，按既有独立核查及备份流程修正 PLAN/审计或投影；不得随意挑一个版本、静默缩围或继续依赖冲突的子批。用户最新指令需要改变计划时，先形成可审的修订，依既有门禁落实；不以文档陈旧向用户重复索取已给授权。

**完成与交付**：局部测试通过、测试数量、Atlas lint 通过和安装文件复制均不能代替整体功能/真实宿主验收。每批结束更新或引用 PLAN 的整体验收进展和 MATERIAL_AUDIT 的证据变化，报告本批解除的整体阻塞、未闭环模块及下一优先动作的依据。Framework/Atlas 只维护稳定知识、长期入口和当前项目定位方式；项目阶段快照标明来源与历史性，实时顺序回到当前 PLAN，不在长期层维护另一份活动计划。独立 verifier 须核查计划权威一致、整体覆盖、优先理由、子批边界及完成声明没有越过证据。

### 0.4.1 从真实入口推进最小纵向闭环

新功能、插件整合或多批改造在完成 0.4 对账后，优先选择一条从用户实际入口贯穿业务服务、权威保存及可见结果的窄路径（tracer bullet），尽早验证真实宿主和已知消费者。不要按“先做完全部存储，再做全部服务，最后接原界面”长期堆积未集成能力。数据安全和必需基础设施可以先行，但应在当前 PLAN 说明它解除哪个具体闭环阻塞，以及何时回到该入口验收，不另设计划。

选中的路径沿用原入口、术语及交互；按适用性覆盖按钮/命令→输入→资格与固定身份→owner 服务→可靠保存→消费者展示→关闭重开。无持久写入的任务采用对应可见结果，不虚构保存步骤。控制台、夹具或人工注入可用于诊断，不能代替用户可达的创建入口；界面已显示、接口通过和业务闭环通过分别报告。技术环境暂不具备真实宿主条件时标明未验，不要求为凑闭环擅自部署或访问运行库。

需要论证切片、模块职责或领域语言时，按需使用仓库 [演进式软件设计 Skill](../../REFERENCE_BOUNDARIES.md#ref-351)（外部来源未随包提供）。该 Skill 提供设计方法，不覆盖本 Skill 的 runtime、ownership、备份与 verifier 约束，也不替代 PLAN/MATERIAL_AUDIT。优先复用原程序和已审服务；将重复编排收敛到职责清晰的接口，但不让聚合器接管其他 owner 的数据，不以 deep modules 为由建万能内核或自动重构。

系统术语仍以 0 节指定的 Atlas glossary/aliases 为唯一入口；新词先核对现有定义及上下文，必要修订走现有框架更新协议。提问只针对会改变用户操作、数据语义、范围或风险的未决选择；能够从现有材料和代码回答的问题先调查，不设置问题数量指标。每条纵向链通过后，再依据整体 PLAN 和用户反馈扩展下一条，而不是无限整理架构。

### 1. 先分类，再读参考

按任务类型加载 references：

- 新开发系统插件，或改动跨插件工作流、加载/保存/刷新/缓存/预热等性能敏感路径：
  先读 [references/standards/workflow-performance-observability.md](references/standards/workflow-performance-observability.md)，确定用户就绪终点、owner/provider/consumer、观测点、响应与后台成本的对照方法。新插件交付应包含实际接入的最小观测点及启停/采集方法，不能只给计划；简单纯 UI 修改按影响面选取交互检查，不要求全库性能基准。
  有效操作上下文主键及待办协作示例见 [Atlas 工作流](<../../memory/obsidian-plugin-system/atlas/workflows/operational-context-to-next-action.md>)；资格以其引用的 canonical 定义为准。局部读取减少、模拟测试通过或磁盘部署完成不能等同于真实宿主整体变快。
- 改 `state-capsules`、`workspace-mount` capture/restore、tab/capsule 状态恢复：
  先读 [references/protocols/00-protocol-index.md](references/protocols/00-protocol-index.md)
  再读 [references/standards/system-boundaries.md](references/standards/system-boundaries.md)
- 改 bridge、host、bus、跨插件通信、三方跳转、pending focus：
  先读 [references/protocols/00-protocol-index.md](references/protocols/00-protocol-index.md)
  再读 [references/protocols/primary/host-identity-and-bridge-discovery.md](references/protocols/primary/host-identity-and-bridge-discovery.md) 和 [references/standards/console-logging-standard.md](references/standards/console-logging-standard.md)
- 改插件对外协议、API、事件、bridge、UI contract、data schema、command 或可被其他插件依赖的行为：
  先读 [references/standards/release-guardrails.md](references/standards/release-guardrails.md)
  补 [references/appendices/communication-preflight-checklist.md](references/appendices/communication-preflight-checklist.md)
  同时搜索依赖方关键词并记录 `keyword -> hit/miss -> conclusion`：插件名、事件名、API 方法名、DOM/data 属性、setting key、JSON schema key、console/audit event、command id。优先用 `rg -n --fixed-strings` 扫描 `.obsidian/plugins/*`、相关 repo 插件目录、README、manifest、settings、schema，并逐项记录关键词、路径、调用方向和结论。
- 改 Tab 普通条目关键词、胶囊、抽屉、BUS 递增、关键词定位：
  先读 [references/protocols/domain/keyword-bus-pattern.md](references/protocols/domain/keyword-bus-pattern.md)
- 改 TOC、范式面板、sticky 区、滚动恢复、rerender 稳定性：
  先读 [references/protocols/primary/local-write-view-stability.md](references/protocols/primary/local-write-view-stability.md)
  必要时补 [references/appendices/paradigm-panel-visual-state-semantics.md](references/appendices/paradigm-panel-visual-state-semantics.md)
- 改评论、说明、备注、长文本等用户原创内容输入 modal，或任何关闭 modal 可能导致已输入内容丢失的路径：
  先按内容态输入保存处理，不把它当成普通 UI-only modal；必须检查 save/onSubmit、onClose、遮罩/旁边点击、右上关闭、Esc、程序性 `close()`、视图卸载/插件卸载等关闭路径。若写业务 JSON，同时参考 [references/standards/release-guardrails.md](references/standards/release-guardrails.md)；若保存后触发 rerender，再参考 [references/protocols/primary/local-write-view-stability.md](references/protocols/primary/local-write-view-stability.md)。
- 改留痕、监管、防丢、跨插件操作审计：
  先读 [references/standards/audit-trail-protocol.md](references/standards/audit-trail-protocol.md)
- 改规则、Skill、跨文件协议、多插件联动、高风险保存路径：
  先读 [references/standards/release-guardrails.md](references/standards/release-guardrails.md)
  补 [references/appendices/communication-preflight-checklist.md](references/appendices/communication-preflight-checklist.md)

### 2. 先做 preflight，再写代码

如果改动涉及通信、恢复、跳转、保存、协议或多文件联动，先补齐三张图：

1. 系统边界图
2. host / bridge / bus 关系图
3. tx / persist / restore / verify 时序图

如果这三张图说不清，先不要写实现。

同时把下面两份 reference 视为同级硬门槛，不是“做完再看”：

1. [references/standards/release-guardrails.md](references/standards/release-guardrails.md)
2. [references/protocols/primary/local-write-view-stability.md](references/protocols/primary/local-write-view-stability.md)

也就是说，发布门禁 10 条、手工验证矩阵、滚动稳定回归，默认必须过。

### 2.4.1 本用户的宿主测试偏好：Console 记录优先

开发后的真实宿主测试，默认由用户操作页面，代理通过现有诊断开关/命令采集的有界 Console 摘要分析结果；其次提供经审阅、可复制的代码由用户执行。不要默认接管鼠标键盘、打开 DevTools 代输代码或为验收重启应用；只有用户明确要求电脑控制时才采用。此偏好适用于本用户的插件开发，不推广为所有项目的限制。

具体启停、采集与验收方法见 [Console Ops Runbook](references/appendices/console-ops-runbook.md#5-console-记录优先的用户协作测试)。仍需完成适用的验证矩阵；视觉/交互结果可由用户确认，未获得证据就标未验证，不用接口返回代替实机通过。

### 2.5 先做契约影响面扫描

如果改动可能改变任一插件对外契约，先形成契约影响面清单，再写实现：

1. 明确 provider 插件、changed contracts、contract type。
2. contract type 至少从这些类型中判断：event、bridge API、command id、DOM/data hook、setting key、JSON schema、console/audit event、UI contract。
3. 列出 consumer plugins、调用路径、依赖的契约字段或选择器。
4. 对每个 consumer 判断：必须同步修改、可由兼容层覆盖、或不受影响。
5. 对 breaking change 优先考虑 compatibility shim、双读/双写、旧 key 读取、新旧事件并行期；如果不可兼容，必须给出 provider + consumer 同步修改计划和回归验证矩阵。
6. 如果没有发现依赖方，也要记录搜索关键词、命中/未命中结果和结论，不要只凭记忆判断。
7. 涉及契约影响面或多插件匹配修改时，按既有 verifier-before-merge / 独立核查流程做计划核查和修改后核查。

### 2.6 先做三边哈希对齐，再改运行插件

如果任务涉及正在运行的 Obsidian 插件，先确认是否存在三套目录：

1. runtime / 运行库：用户实际 Obsidian vault 的 `.obsidian/plugins/*`。
2. dev / 开发库：当前项目或工作区里的插件源码/开发副本。
3. mirror / 镜像库：当前项目中用于模拟 vault 的 `.obsidian/plugins/*`。

只要三边同时存在，必须先做这些动作，再改代码：

1. 列出目标插件和目标文件，先按文件类别分类。
2. 对可同步文件计算 SHA-256：至少覆盖 `main.js`、`styles.css`、engine/source-like JS、manifest、README/说明类文件；按任务需要扩展。
3. 默认以 runtime 为 canonical。若三边哈希不一致，先把 runtime 视为用户真实运行态事实，不得用旧 dev 或 mirror 覆盖 runtime。
4. 如果用户明确指定非 runtime canonical，必须记录指定目录、为什么不用 runtime、runtime 与该目录的差异风险、是否先备份 runtime、最终是否仍要做三边哈希验证。
5. 修改前必须备份三边中将被改动或被同步覆盖的文件，优先放到当前项目 `state/backups/<scope>-<short-slug>-YYYYMMDD-HHMMSS/`，并写入 `hashes-before.json`。
6. 不一致时的默认方向是：`runtime -> dev/mirror baseline 回流 -> 修改 -> 验证 -> 同步 runtime/dev/mirror -> 再哈希确认`。
7. 三边同步只针对已分类为代码/样式/说明的文件；业务 JSON、索引 JSON、缓存 JSON、SVG cache、用户设置数据、运行态派生文件默认排除，不得随手复制。
8. 最终必须输出三边哈希表，不能只说“已同步”。

### 2.6.1 先证明实际运行库，再做哈希同步

当同名插件目录超过一套，或用户反馈“重启后仍是旧版本”“运行库/开发库不一致”“功能像被旧分支覆盖”，三边规则前必须先进入多实例识别：

1. 先列出所有候选插件实例，至少包括用户当前 Obsidian vault、当前仓库 `workspaces/`、历史仓库、旧故事库、mirror、备份/staging、日期归档和压缩包解压副本。
2. 不得仅凭目录名、`.obsidian/plugins` 形状、当前 `cwd`、最近修改时间、文件大小或“看起来像运行库”判定 runtime。
3. 实际 runtime 必须绑定到一个绝对路径，并由证据支持：用户明确指认、`app.vault.adapter.basePath`/Obsidian 当前打开 vault、manifest id、插件启用状态、运行日志行号/功能现象、settings/data 与 vault 内容匹配等。
4. 若无法证明哪个目录是实际运行库，状态为 `canonical_unknown`，只能做只读分析、哈希对比、diff 摘要和补丁草案；不得向任何候选目录写入或同步。
5. 用户说“运行库为准”时，必须先把“运行库”解析为绝对路径；不能把抽象 runtime 套到任意 runtime-like 目录。
6. 对联动插件必须成对/成组识别实际 runtime。例如 Project Overview 与 Mandala 周追踪互相依赖时，不得只确认其中一个插件目录后同步另一个。
7. 同步源必须通过 source eligibility：不是 backup、不是 memory/sources、不是旧日期分支、不是历史 aha 仓库、不是 mirror、不是 zip 解压副本，除非用户明确指定并记录风险。
8. 默认同步方向是：`actual runtime -> staging/dev baseline -> patch -> verify -> actual runtime/dev/mirror sync`。任何非 actual runtime 向 actual runtime 回写，都必须有 diff 摘要、功能哨兵、verifier 结论和用户二次确认。
9. 同步前必须做 diff/功能哨兵，不得只看 SHA-256。哈希只能证明不同，不能证明谁更新。
10. 功能哨兵要覆盖本次风险面；已知哨兵包括：`project-execution-overview` 的 Workspace 主键项目执行计划入口、workspace 项目名解析、fallback/EVA 只读链路；`mandala-time-blocks` 的周追踪 Workspace 项目名不得退化为 `item_m...` 码。
11. 任何用户可见标题退化为内部 id（如 `item_m...`、`tab_ws_...`、裸 nodeKey）都视为 regression sentinel，必须阻断扩大同步并回到 diff/contract 排查。
12. 实际修改或同步前，必须把将被编辑或被覆盖的目标文件字节级备份到当前项目 `state/backups/<scope>-<short-slug>-YYYYMMDD-HHMMSS/`，并写入 `hashes-before.json`；三边存在时备份 runtime/dev/mirror 对应文件，单库修改时备份该单库目标文件。
13. 备份记录必须包含每个被覆盖文件的原始 SHA-256、绝对路径、备份路径和回滚来源；回滚来源必须是实际 runtime 的同步前版本，而不是旧 dev/mirror。若只改仓库内 dev 文件，回滚来源指向该文件的同步前备份。

### 3. 先保护历史数据，再扩展

默认要求：

1. 旧 key 兼容
2. 历史数据可读
3. 旧平面结构可以被新 UI 显示
4. 不因视图恢复、滚动补偿、校验失败去改写业务 JSON
5. 对持久化对象、schema 字段和用户内容，设计阶段必须明确 `active -> archived/retired -> restored -> purged` 生命周期；具有历史价值的普通“删除”默认实现为归档/隐藏，而不是物理移除。
6. 重命名只改变显示属性，不改变稳定 ID；新增对象或 schema 字段必须生成新 ID，当前 ID 与已归档/退役 ID 均不得复用。保留一份 owner 级 `reservedIds`（或等价权威集合），不能把“不太可能碰撞”当作生命周期契约。
7. 普通 UI 必须提供归档内容的可辨识、查看和恢复路径。历史文字、图片引用、递归子表及其父子关系随稳定 ID 保留；若暂未实现行归档，至少拒绝删除含直接文本、图片或任意非空递归子表的行。
8. `purge` 只允许作为独立维护操作：执行前重新读取权威数据，扫描所有实例/反向引用/递归子表/附件影响，要求明确确认、字节级备份、审计记录和可验证回滚；普通编辑器不得偷偷兼任 purge。
9. schema 生命周期升级必须声明 reader/writer 版本范围。旧 reader 遇到新 schema 必须拒绝写入或只读打开，不能把归档字段当成活动字段；兼容投影、读取、渲染和结构补齐不得写回业务 JSON。

### 4. 先有监管，再放大能力

涉及跨插件协议、排障、恢复、queued 路径或高风险保存时：

1. console 事件名和字段必须标准化
2. 关键业务动作要有审计留痕
3. verifier-before-merge 是硬门禁，不是可选优化

### 5. 修改完成后留一张工程变更记录卡

只要本轮实际修改了 Obsidian 插件程序文件、样式、manifest、规则文件、Skill 文件、跨插件协议或运行库同步脚本，交付前必须按 `@prompts/rules/workflow_core.md` 的 `engineering_change_record` 流程新增一张独立工程变更记录卡：

1. 路径：`memory/obsidian-plugin-system/change-records/YYYY/YYYY-MM/YYYYMMDD-HHMMSS-<plugin-or-scope>-<short-slug>.md`
2. 内容只写事实账本：改动背景、文件、修改前备份、before/after hash、验证、回滚来源和剩余风险。
3. 不把它放入 `state/cards/`、`state/CARD_LIBRARY.md`、Question Map 或 card_audit。
4. 不把它当作 MemPalace 经验卡；若本次改动产生可复用经验，应另写 `memory/obsidian-plugin-system/cards/` 经验卡并走 dry-run/mine。
5. 写入前必须已经按 `@prompts/rules/workflow_core.md` 备份将被修改的系统工程文件；涉及 actual runtime/dev/mirror 或高风险文件时，使用更严格的三边/staging 备份流程，不得用轻量备份降低门槛。

同时根据影响范围评估是否更新 `memory/obsidian-plugin-system/framework/registry.md`、`question-map.md`、`maintenance-log.md` 或 `atlas/`。框架文件是长期入口，不进入 `state/cards`、`CARD_LIBRARY.md` 或 card_audit。

产物职责必须分开：`change-records/` 只记录本次工程事实账本；`memory/obsidian-plugin-system/cards/` 记录可复用经验和设计教训；`atlas/` 记录稳定的插件事实、契约、ownership、workflow、术语和 unknown；`framework/` 记录控制平面入口、更新协议、Question Map、registry 和 maintenance trace。四者不能互相替代。

## Mandatory Guardrails

### State Capsules 边界

1. `state-capsules` 只恢复环境态阀门，不接管业务内容。
2. 校验失败时，不得写回空值、半成品或“看起来更整齐”的归一化结果。
3. `restore` 可以只读装载、绑定 host、做诊断；不得借机 `normalize + save` 业务 JSON。

### Workspace Mount 边界

1. `workspace-mount` 的 capsule restore 路径必须是 `load -> bind host -> apply in memory/UI -> render`。
2. 不要在 restore 路径里做“顺手保存”“顺手重排”“顺手补默认值”。
3. Tab 普通条目关键词与范式关键词完全隔离，不共字段、不共状态桶。

### Communication / Jump 边界

1. 不允许靠“当前激活视图”猜目标 host。
2. 不允许跳过 bridge 直接碰下层 DOM 或内部状态。
3. `pending focus`、显式 reveal、queued restore 都必须可诊断、可闭环。

### Contract / Dependency 边界

1. 改一个插件的对外契约时，不得只验证 provider 插件本身。
2. 不得静默改名事件、字段、方法、DOM hook、CSS/data selector、command id 或 JSON key。
3. 不得让 consumer 插件靠旧契约“碰巧还能跑”来判定完成。
4. breaking change 必须有兼容策略，或有明确的 provider + consumer 同步修改计划。
5. 验证矩阵至少覆盖 provider 主流程、已知 consumer 主流程、跨插件跳转/恢复/审计链路。

### Runtime / Dev / Mirror 三边一致性边界

1. runtime 是用户实际运行事实；当用户说“运行库为准”或三边不一致且用户未指定其他 canonical 时，必须以 runtime 为准。
2. dev 只有在与 runtime 哈希一致，或 runtime 已回流为 baseline 后，才能作为编辑工作区。
3. mirror 只用于同步/对照/本地验证，不得把 mirror 当事实来源。
4. 三边哈希不一致时，不得自动互相覆盖；必须先判断文件类别、插件归属、运行库是否包含用户新增修改。
5. 可同步范围默认限于插件代码、样式和说明类文件，例如 `main.js`、`styles.css`、engine/source-like JS、manifest、README/说明文件。
6. 默认不同步业务 JSON、用户数据 JSON、EVA index、relations、cache、SVG cache、插件设置数据和其他运行态派生文件；这些文件若确需处理，必须另按内容态/派生态规则单独说明、备份和验证。
7. `runtime -> dev/mirror baseline` 只表示代码和样式基线回流，不代表复制运行库业务状态。
8. 回写或同步 runtime 前必须有备份；高风险文件应先在 staging 副本验证，不在运行库上试错。
9. 最终验证必须覆盖同一批文件的 runtime/dev/mirror SHA-256 一致性；不能只验证一个库。
10. 如果用户明确指定非 runtime canonical，交付时必须说明原因、风险、备份路径和最终哈希状态。

### Input Modal Draft Safety 边界

1. 评论、说明、备注、长文本、正文片段、审计说明等用户原创内容 modal，默认采用“关闭即保护输入”的策略。
2. 用户没有点击保存，但通过遮罩/旁边点击、右上关闭、Esc、Obsidian modal close、程序性 `close()` 或视图/插件卸载离开时，如内容已变更，应尝试持久化或进入可靠草稿队列。
3. “保存”按钮只是显式提交入口，不应是唯一防丢入口。
4. 该规则只适用于用户正在编辑的内容态文本；不适用于确认框、选择器、只读预览、危险操作确认、短暂筛选器、临时搜索框或纯 UI 设置弹窗。
5. 显式放弃必须有明确语义，例如 `Discard` / `放弃修改`；不能把普通 `取消` 默认为丢弃。若存在 dirty 内容，显式放弃前应二次确认或清楚标注会丢弃修改。
6. 新建评论/说明为空或仅空白时，关闭不应创建空业务记录；新建 modal 已有输入但尚无稳定目标记录时，默认进入可靠草稿队列，不静默创建正式业务记录，除非该功能明确采用 autosave 模型。
7. 已有评论/字段被清空时，不能把隐式关闭当作删除确认；删除或清空应走显式删除/清空流程，或至少二次确认。
8. 未改动内容关闭时不写业务 JSON，避免无意义更新时间戳、排序或审计噪声。
9. 防抖保存不能成为唯一保障；`onClose` 应 flush pending debounce，或保存关闭时的最终同步快照。
10. 可靠草稿队列必须可重开恢复，不能只是内存变量；至少记录 owner plugin、record/modal/field key、时间戳或版本信息、诊断状态，不得存入 `state-capsules` 或 restore 状态。
11. `onClose` 异步保存失败时不得静默丢失：至少保留持久草稿、给出 console/audit 诊断，并提供可恢复路径。
12. `onClose` 最终快照不得盲写覆盖打开 modal 后已被别处更新的同一记录；至少基于 record id + revision/mtime/hash 或等价机制检测，冲突时保留草稿并诊断。
13. console/audit 诊断不得记录完整长文本正文；可记录字段名、长度、hash、record id、失败原因。
14. 写业务 JSON 时只更新目标字段/目标记录，不得借 modal close 顺手 normalize、重排、迁移、补默认值或覆盖无关字段。
15. modal close 保存属于用户内容态写入，不得混入 restore/capsule 路径，也不得由 `state-capsules` 或 `workspace-mount` 代替业务插件保存。

### Scroll / Stability 边界

1. UI-only rerender 不能抢走显式定位链路。
2. 页面稳定看的是“视角稳定”，不是只看旧 `scrollTop`。
3. 不要为了目标页跳转而把源页无关区域顶回顶部。

### Release / Regression 边界

1. 发布门禁 10 条默认必过，不是可选清单。
2. 跨视图跳转、queued 路径、TOC / 面板开合、滚动稳定回归默认必测。
3. 没过手工验证矩阵时，不要因为“局部功能看起来能用”就收工。

## Deliverables

默认交付应包含：

新插件及性能敏感工作流还须按 [工作流性能与可观测性规范](references/standards/workflow-performance-observability.md) 提供适用的场景卡、实际测试点/诊断启停与反馈采集方法、端到端及后台对照证据和未测项。性能诊断不替代已有事务/审计日志；仅静态或夹具验证时明确整体收益待验证。可复用协作事实进入 Atlas，长期测量问题和规则入口进入 Framework，原始样本与版本对照进入工程证据。

1. 实现改动
2. 协议/经验落盘或引用更新
3. 最小验证结果
4. 如果是高风险链路，补 console 观察点和手工回归清单
5. 若涉及对外契约，交付契约影响面清单：provider、changed contracts、contract types、consumer plugins、required matching changes、compatibility strategy、verification matrix
6. 若修改输入类 modal，交付关闭路径验证结果：保存按钮、遮罩/旁边点击、右上关闭、Esc、程序性 `close()`、视图卸载/插件卸载、debounce 未 flush、异步保存失败、dirty 清空、未 dirty 关闭、业务 JSON 最小写入范围
7. 若涉及 runtime/dev/mirror 三边插件文件，交付 canonical 判定、三边哈希表、备份路径、同步方向、变更文件清单、验证命令结果，并明确说明是否未触碰业务 JSON/缓存/索引/用户设置数据
8. 若本轮实际修改了程序、规则、Skill 或协议文件，补备份路径、before/after hash、验证命令、回滚来源和工程变更记录卡路径
9. 若本轮改变了系统级框架、跨插件 ownership、AI context export 或项目效能教练读取方式，说明是否更新了 `memory/obsidian-plugin-system/framework/` 和 `atlas/`；若未更新，说明理由
10. 若触发复杂项目 checkpoint，交付 checkpoint id、更新过的 state 文件、当前 objective/stage、下一步动作、open questions、`verifier_required` 和 `promotion_boundary`
11. `Framework/Atlas update check`：
    - `status`: `updated` / `not_updated` / `deferred`
    - `reason`: 为什么需要或不需要落盘
    - `targets`: 已更新或候选的 framework / atlas / cards / change-records 文件
    - `evidence_status`: `confirmed_by_user` / `confirmed_by_code` / `confirmed_by_memory` / `inferred` / `unknown`
    - 若为 `deferred`，必须写明缺少证据、候选目标和下次触发条件

12. 若触发 0.4，交付整体对账摘要：当前活动项目及 PLAN 有效部分、MATERIAL_AUDIT 证据依据、各模块缺口/整体阻塞、子批对应工作包与优先理由、本批关闭的整体验收和剩余项；引用现有记录，不新建第二套计划。

## Hard No

以下做法一律视为高风险反模式：

1. 因 `verify` 失败向业务文件回写空对象、空数组或默认值
2. 在 capsule restore 中执行业务数据归一化、重排或写盘
3. 用 DOM 猜 host、猜 tab、猜作用域
4. 把 Tab 普通条目关键词混入范式系统
5. 上线新 UI 后让旧数据“看不见但还在盘里”
6. 没有 `txId` / `mismatchFields` / queued 闭环日志就宣称通信链路稳定
7. 没有 verifier 结论就直接改规则、Skill、协议或跨文件核心逻辑
8. 评论/说明/长文本 modal 只在点击保存时落盘，隐式关闭直接丢弃已修改内容
9. 把普通 `取消` 当作无提示丢弃 dirty 内容
10. `onClose` 保存失败后静默关闭并丢失草稿
11. 借 modal close 保存顺手重写、归一化、重排或迁移业务 JSON
12. 实际修改程序、规则、Skill、协议或同步脚本前未做字节级备份和 before hash
13. 未做三边哈希检查、备份和 canonical 判定，就修改或同步正在运行的插件
14. 用旧 dev 覆盖 runtime，或把 mirror 当作事实来源覆盖 runtime
15. 未按文件类别分类就批量同步三边目录
16. 借 runtime/dev/mirror 对齐顺手复制、修复、清空或迁移业务 JSON、索引、缓存、SVG cache、用户设置或运行态派生文件
17. 用户已声明“运行库为准”后仍把 dev 当 canonical
18. 把长期框架文件当作 `state/cards` 研究卡迁移或登记，导致 card_audit / CARD_LIBRARY / 既有反链被破坏

## Local System Knowledge: JSON Asset Registry

- The vault/system now has a dedicated read-only plugin named `json-asset-registry`.
- Purpose: inventory JSON assets, map each JSON file to the plugin/program that maintains it, record purpose/risk, compute SHA-256 hashes, create snapshots, and write a Markdown handoff report for Obsidian developers.
- Boundary: it must only read business JSON files. It may only write its own files under `.obsidian/plugins/json-asset-registry/`: `json-assets-registry.json`, `snapshots/*.json`, and `json-assets-report.md`.
- Focus systems: `mandala-time-blocks`, `keyword-index-plugin`, GTD DataviewJS, `collection-card-view`, `workspace-mount`, `state-capsules`, `project-execution-overview`, Timeline DataviewJS, SuperMemo concept display, and EVA relations.
- When another plugin adds or renames JSON files, update `json-asset-registry` focus rules and README; do not let it repair, migrate, normalize, or restore business JSON.

- JSON Asset Registry focus rules also include \\eva-incremental-indexer\\: \\EVA_Notes.json\\, \\EVA_Links.json\\, \\EVA_Indexes.json\\, and \\EVA_Indexer_State.json\\ as derived/index-state assets, distinct from \\eva-cross-view-relations\\ relationship data.

