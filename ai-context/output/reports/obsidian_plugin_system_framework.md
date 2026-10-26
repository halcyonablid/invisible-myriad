# Obsidian 插件系统整体框架

> 任务：插件系统的整体框架建立  
> 版本：2026-06-24 第一阶段报告  
> 边界：本报告只使用当前仓库材料、Atlas、经验卡、工程记录和只读 runtime 证据；没有写入实际 Obsidian 运行库。

## 一句话总图

这套系统不是一组零散插件，而是一个会反身更新的第二大脑操作环境：关键词提供入口，Workspace 承载项目材料，Mandala 承载计划和周追踪，EVA 负责跨插件关系与跳转，Project Overview 把证据投影成执行总览和 AI context export，GTD / Collection 给出下一步行动启发，MemPalace 与 Atlas 保存经验并反过来约束下一次插件开发。

更短一点说：底层是插件和 JSON，上层是符号、流程和判断方式。真正要建设的不是“又多一个功能”，而是让这些功能长成一套可继承的方法论。

## 为什么要建立这个框架

当前最大的难点不是插件数量，而是认知分布在不同地方：

- 用户知道每个插件在实践中是什么意思。
- 代码知道函数、数据结构和事件怎么跑。
- AI 只能看到被导出、被记录、被解释过的证据。

如果没有框架，AI 每次都要临时扫 JSON、猜 nodeKey、问用户“这个条目是什么意思”。如果有框架，AI 可以先读系统地图、证据包和经验卡，再进入具体项目。这样 Obsidian 就不只是资料库，而是你和 AI 共同使用的第二大脑。

## 宏观分层

| 层级 | 代表插件/系统 | 它负责什么 | 不应该让它负责什么 |
| --- | --- | --- | --- |
| 符号入口 | keyword-index-plugin | 关键词、胶囊、抽屉、BUS、subconcept | 不直接管理项目周追踪 |
| 拓扑地址 | Antinet / ATOM notes | 知识树位置、编号、概念顺序 | 不替代项目执行视图 |
| 材料承载 | workspace-mount | 项目 tab、条目、绑定 note、材料容器 | 不替代 EVA 关系图 |
| 计划追踪 | mandala-time-blocks | 日课、周追踪、项目执行计划、上层设计字段 | 不让聚合器直接写它的数据 |
| 关系跳转 | eva-cross-view-relations | nodeKey 身份、跨插件关系、`openNode(nodeKey)` | 不让消费插件猜 DOM 跳转 |
| 执行聚合 | project-execution-overview | 项目证据总览、排序、入口按钮、AI context export | 不成为所有 JSON 的第二主人 |
| 行动启发 | GTD / collection-card-view | 启发下一步行动、待办、collection cards | 不替代事实证据来源 |
| 记忆传承 | MemPalace / Atlas / change-records | 经验卡、工程记录、系统地图、可召回知识 | 不混入业务运行数据 |
| 代码理解 | Understand snapshot | 只读快照图谱，帮助 AI 读代码结构 | 不直接跑 live vault，不写 runtime |

这张表的核心是所有权：每层都要清楚“我管什么”。一旦聚合器开始偷偷修别人的 JSON，或者旧 dev 目录覆盖 runtime，系统就会变得不可追溯。

## 契约与数据所有权

跨插件协作靠契约，不靠猜。

几个关键原则：

- Mandala 拥有日课、周追踪、项目执行计划等计划类持久化内容。
- Keyword Index 拥有关键词、抽屉、BUS、subconcept 等入口结构。
- Workspace Mount 拥有 workspace tab / item / bound note 的结构语义。
- EVA 拥有关系身份和跨插件跳转，消费者优先用 `eva.openNode(nodeKey)`。
- Project Overview 是聚合器和证据投影器，可以读、排序、跳转、导出，但不应该直接写 Mandala / Keyword / Workspace 的业务 JSON。

所以后续改任何插件前，都要先问：

1. 这个字段或 API 的 provider 是谁？
2. 哪些 consumer 依赖它？
3. 这是事件、nodeKey、JSON schema、command id、DOM selector、排序快照，还是导出格式？
4. 改完以后旧入口还能不能兼容？

这就是为什么之前出现“项目名退化成 `item_m...` 码”时，它不是小 UI 瑕疵，而是契约哨兵报警：用户可见符号被内部 id 污染，说明 provider / consumer 的边界没有对齐。

## 环境边界

系统里至少有五种环境，它们不能混成一团：

| 环境 | 用途 | 本项目边界 |
| --- | --- | --- |
| actual runtime | 用户当前 Obsidian 真正运行的 `.obsidian/plugins` | 只读事实来源 |
| dev | 开发副本 | 可作为未来补丁工作区 |
| mirror | 当前仓库里的 runtime-like 镜像 | 只能作对照，不能自动当真 runtime |
| Understand snapshot | 从 runtime 安全抽取的代码/说明快照 | 可分析，不回写 |
| memory / Atlas | 经验、规则、工程记录、系统地图 | 本项目主要写入区 |

本轮已确认实际运行库是：

`D:\han\最新的\NEWERA2024年4月17日\NEWERA\.obsidian\plugins`

但确认路径不等于允许写入。本项目只做框架建设和报告，不同步运行库，不复制业务 JSON，不生成 live vault 图谱。

以后如果真的要改插件，就要切换到 `obsidian-system-plugin-dev` 的工程门禁：证明 actual runtime，列出候选实例，做 SHA-256、diff、功能哨兵、备份、verifier，再决定是否同步。

## 上层符号：形式会塑造内容

你前面提到“形式落成之后，内容的模式也被提升”，这个判断很关键。

插件的 UI 和表格不是外观。它们像认知硬件：

- “上周计划 + 完成情况 + 上周交接”放在同一列，会迫使每周计划具有连续性。
- 项目执行计划独立放在项目主键上方，会把“上层设计”从周粒度里释放出来。
- 范式积累列接普通 note，会让调查事实和工作环境直接进入项目判断。
- AI context export 把当前可见模型导出，会让 AI 从“乱扫文件”变成“读证据包”。

这就是从底层程序到上层符号的过程。底层实现只是按钮、表格、JSON、API；上层符号是“交接”“项目主键”“范式积累”“证据包”“复盘周期”。当这些符号稳定下来，它们会反过来指导插件继续长什么样。

## AI 效能教练的读取流程

未来让 Codex 充当项目效能教练时，不应该从全库硬扫开始。更好的读取顺序是：

1. 先读 Project Overview 的 AI context export，拿到当前项目证据包。
2. 再看项目主键对应的 Workspace / Mandala / EVA 关系。
3. 如果需要事实材料，再打开范式积累里的普通 note。
4. 如果需要概念入口，用 Keyword Index / Antinet 找到相关关键词和编号树位置。
5. 如果需要历史经验，再查 MemPalace、Atlas、change-records。
6. 最后才考虑直接查源码或 JSON，而且必须说明为什么证据包不够。

这样 AI 的角色就不是“搜索机器”，而是读一个结构化账本：它看到计划、执行、事实、关系、历史经验，然后给出下一步建议。

## 意识体式反馈回路

这套系统会成长，关键在于每次开发都把经验留下来：

1. 修改前：搜索 MemPalace 和 Atlas，确认有没有踩过同类坑。
2. 修改中：证明 runtime / dev / mirror 边界，识别契约影响面。
3. 修改后：用功能哨兵验证用户可见行为。
4. 工程记录：在 `memory/obsidian-plugin-system/change-records/` 写本次实际改了什么。
5. 经验提炼：如果出现可复用判断，另写经验卡，dry-run 后 mine 到 MemPalace。
6. 框架更新：必要时更新 Atlas、Question Map、Skill。

这就是你说的“意识体”感：不是某个插件有意识，而是系统能把经历转化为规则，再用规则影响下一轮行动。

## 当前未知问题

未知问题要分三类，不要混在一起：

| 类型 | 例子 | 补证方式 |
| --- | --- | --- |
| code unknown | 某 API、排序、nodeKey 真实实现是否如此 | 读源码、跑快照、console 验证 |
| memory unknown | 以前是否总结过类似经验 | 搜 MemPalace、Atlas、change-records |
| user-practice unknown | 某个栏目在你真实工作流里到底代表什么 | 由用户补充实践语义，再制卡 |

很多关键问题不是代码不知道，而是“用户知道但 AI 还没有结构化知道”。这正是 Atlas 和 Question Map 要解决的认知不匹配。

## 第一阶段 MVP

本阶段的 MVP 不是“把所有插件彻底说明完”，而是建立一个可继续生长的框架。

当前已完成：

- 8 个 Question Map 均进入 GREEN。
- 已建立 `.009.001` 至 `.009.008` 八张框架卡。
- 已登记 [#OPS-001] 至 [#OPS-022] 来源。
- 已复跑 `card_audit`：`atom_cards_total=2192`，`atom_chars_no_ws=2964601`。
- 已形成本报告和 `state/ANALYSIS_OUTLINE.md`。
- 已明确 actual runtime 只读。

剩余不是“补一个大而全文档”，而是进入下一轮有目标的建设：

- 用一个真实项目，比如“工程调查做PPT”，测试 AI context export 是否足够支撑效能教练。
- 把本报告提炼到 Atlas 中，形成更短的系统入口说明。
- 按工程流程升级 repo-local `skills/obsidian-system-plugin-dev/SKILL.md`，让仓库内 skill 与全局 skill 的经验一致。
- 如果 Project Overview 的 AI context export 还缺 Mandala / Keyword / EVA 某些证据，再以插件接口方式补，不让 AI 回到乱扫 JSON。

## 结论

这套插件系统的方向已经很清楚：它不是单纯提高记录效率，而是在建设一个“可运行的认知结构”。底层插件负责保存、投影、跳转和导出；上层符号负责让用户和 AI 都知道这些东西意味着什么。

下一步最值得做的，不是继续堆功能，而是让每个功能都拥有清楚的位置：它属于哪一层，拥有哪种数据，暴露什么契约，服务哪个判断动作，产生什么经验回流。这样插件系统就会从工具集合，逐渐长成一套可继承的工作方法。
