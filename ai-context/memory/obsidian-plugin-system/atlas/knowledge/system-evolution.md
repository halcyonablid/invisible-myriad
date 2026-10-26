# 系统演进史：从工作流规则到主键管理中心（2026-06 — 2026-10）

status: summary（叙事索引，不是新的事实源）
created: 2026-10-21
update: new page

## 怎么读这一页

- 本页**只做串联**：按阶段说明系统往哪里走、关键决定和转折是什么。每一条都链接到事实来源，以来源为准；本页与来源冲突时以来源为准。
- 事实来源分工：
  - 工程改动事实：[工程变更记录目录](../../../../REFERENCE_BOUNDARIES.md#ref-034)（外部来源未随包提供）（`python scripts/change_records_index.py` 生成，覆盖全部记录卡）；规则见 `prompts/rules/workflow_core.md`“工程变更记录卡”。
  - 认知变化：[Atlas 日志](../log.md)；框架问题：[Question Map](../../framework/question-map.md)、`framework/maintenance-log.md`。
  - 当前排期：只在活动项目 `state/PLAN.md`（现为 `context-key-bus-management-20261012`），本页不排期。
- 记录规模（2026-10-21 生成时）：873 张记录卡；6 月 82、7 月 123、8 月 99、9 月 220、10 月 349。
- 阶段划分是本页的归纳（inferred），不是任何规则文件的正式分期。

## 阶段一（2026-06 下旬）：先立规矩——变更留痕、备份守门、Atlas 成形

- **关键决定**：每次实际改动程序/规则/Skill 都必须写工程变更记录卡，并先做字节级备份。最早一批记录卡就是规则本身：
  [记录卡规则](../../../../REFERENCE_BOUNDARIES.md#ref-035)（外部来源未随包提供）、
  [固定备份流程](../../../../REFERENCE_BOUNDARIES.md#ref-036)（外部来源未随包提供）、
  [轻量备份闸门](../../../../REFERENCE_BOUNDARIES.md#ref-037)（外部来源未随包提供）。
- **知识层成形**：Atlas 采用 LLM Wiki 形态与术语层（Atlas 日志 06-24、06-25 “LLM Wiki Operating Model”）；提出 Context Capsule Key（别名“操作上下文主键”，见 [glossary](../glossary.md)）概念与严格匹配、编辑方向（06-25 各节，见 [context-capsule-key](context-capsule-key.md)）；关键词作为“符号端口”而非松散标签（[keyword-symbolic-interface](keyword-symbolic-interface.md)，FW-008）。
- **首批插件改动**：PEO AI 上下文导出（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-038)（外部来源未随包提供））、Mandala 周追踪表中的“项目执行计划”改为 Workspace 项目主键纵向管理表（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-039)（外部来源未随包提供））等。
- **意义**：后面四个月能追溯，靠的是这一阶段定下的“改动必留痕、先备份再写”。

## 阶段二（2026-07）：Mandala 日课/周计划与主键生命周期

- **重心**：Mandala（日课、周追踪、目标执行计划、状态图）与 Workspace 挂载（范式条目关键词）是 7 月改动最多的两个插件（按范围字段或文件名含插件名统计，记录卡分别约 49、25 张；只按范围字段精确匹配则为 21、16 张）。
- **性能路线第一次出现**：PEO 构建模型改为分片流水线（[AI 上下文分片](../../../../REFERENCE_BOUNDARIES.md#ref-040)（外部来源未随包提供）、[分片流水线](../../../../REFERENCE_BOUNDARIES.md#ref-041)（外部来源未随包提供）；Atlas 07-06 “Cross-Plugin Aggregation Performance”，FW-015）。
- **主键开始有“生命周期”**：PEO 主键 Kill 模式（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-042)（外部来源未随包提供））；“退出的主键仍可被发现、但不制造幽灵数据”原则（Atlas 07-24，FW-018）；Mandala 当前计划与历史生命周期分开投影（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-043)（外部来源未随包提供））。
- **长期项目可续跑**：项目连续性 Skill（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-044)（外部来源未随包提供），FW-016）。
- **转折**：主键从“标签”变成有身份、有退出、有历史的对象——这是 10 月主键管理中心的前史。

## 阶段三（2026-08）：时间框架、本体（Ontology）与“有效操作主键”

- **新插件**：Temporal Framework（战略 Time × Outcome，8 月约 32 张记录卡〔按范围或文件名统计〕，[起点](../../../../REFERENCE_BOUNDARIES.md#ref-045)（外部来源未随包提供））；Ontology Meta Hub。
- **本体生命周期**：Ontology 历史生命周期与日完成实例（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-046)（外部来源未随包提供）；Atlas 08-02）；Timeline 里程碑成为主键时限证据（Atlas 08-04）。
- **关键概念**：“有效操作上下文主键（Effective Operational Context Key）”——所有面向未来的消费者必须对当前项目域/目标域主键集合严格一致（FW-019，[effective-operational-context-key](effective-operational-context-key.md)）。9 月初落地到 Mandala/Timeline/目标域（[Mandala/Timeline 部署](../../../../REFERENCE_BOUNDARIES.md#ref-047)（外部来源未随包提供）、[目标域部署](../../../../REFERENCE_BOUNDARIES.md#ref-048)（外部来源未随包提供））。

## 阶段四（2026-09）：Ontology 主线、退役旧总线、各插件专精、性能逐个清点

- **退役 CapsuleBridge 激活桥**：Workspace、Collection 的 active bridge 退役，Tab 切换移出业务事务（[Workspace](../../../../REFERENCE_BOUNDARIES.md#ref-049)（外部来源未随包提供）、[Collection](../../../../REFERENCE_BOUNDARIES.md#ref-050)（外部来源未随包提供）；FW-020～FW-023）。
- **Ontology 是 9 月最大的工作线**（9 月约 60 张记录卡，8 月另有约 30 张）：状态图（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-051)（外部来源未随包提供））、凹形网格自动布局（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-052)（外部来源未随包提供））、日树、对话绘图与原位布局（Atlas 09-23 各节）、节点/连线悬停联动（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-053)（外部来源未随包提供））、路由分离。见 [ontology-meta-hub](../plugins/ontology-meta-hub.md)。
- **其他新视图与专精**：SuperMemo Concept 页面（09-20）、ATOM 侧栏（09-27，[页](../plugins/atom-note-sidebar.md)）、EVA 分支树（09-28，[页](../plugins/eva-branch-sidebar.md)）、Hub 三栏菜单（09-30）。同期还有仓库内非 Obsidian 项目（Garmin 循时、novel-studio）的记录卡。
- **性能逐项清点**：EVA 关系编辑器性能（09-29 已实施部署，[记录](../../../../REFERENCE_BOUNDARIES.md#ref-054)（外部来源未随包提供）；存储改写、按提供方合并等进一步优化当时暂缓，10-21 的原生证据推翻了这个暂缓判断）、关键词 BUS 确认后性能、时间视图/日课/周追踪原生 Tab 与重启缓存（09-30～10-01 一组“approved installation”）；10-01 提出“整体工作流性能与未来新插件观测”（FW-024）。

## 阶段五（2026-10-05 — 10-11）：大千统一内核

- **决定**：在实验库“大千”中把多插件的创建、追踪、资格判断收拢到统一内核，同时**保留原视图**（FW-025；[unified-core-transition](unified-core-transition.md)）。
- **推进方式**：P2 原型 → P3 只读 → P4（B1 仓库基础、B2 入口保护与创建服务、C1～C7 原方法适配）→ D 系列把 GTD、Workspace、PEO 原界面逐项接到内核（Atlas 日志 10-07～10-10 约 60 节；记录卡如 [P2 原型](../../../../REFERENCE_BOUNDARIES.md#ref-055)（外部来源未随包提供）、[P4 共享内核](../../../../REFERENCE_BOUNDARIES.md#ref-056)（外部来源未随包提供））。
- **转折（10-11）**：整体对账后确认“仓库证据不等于整链/真实宿主验收”，改为功能等价 + 性能论证的边界说明（Atlas 10-11；[记录](../../../../REFERENCE_BOUNDARIES.md#ref-057)（外部来源未随包提供））。10-12 一批 native 宿主/MVP 记录（如 [native core chain](../../../../REFERENCE_BOUNDARIES.md#ref-058)（外部来源未随包提供）、[trial deploy](../../../../REFERENCE_BOUNDARIES.md#ref-059)（外部来源未随包提供））。

## 阶段六（2026-10-12 — 至今）：主键管理中心

活动项目 `context-key-bus-management-20261012`（唯一计划 `state/PLAN.md`）。

- **P1（10-12）管理入口 → 0.1～0.3 宿体（10-13）**：先有管理面板，再有独立“主键管理中心”（context-key-manager）与当前来源追踪目录（[P1 部署](../../../../REFERENCE_BOUNDARIES.md#ref-060)（外部来源未随包提供）、[0.3 部署](../../../../REFERENCE_BOUNDARIES.md#ref-061)（外部来源未随包提供））。
- **追踪权威与地址退役（10-13）**：停止/恢复追踪由 Mandala 记录、PEO 投影；Kill/9XX 地址退役；Workspace/Collection/GTD 原生只读历史回看 N1～N3（[追踪权威](../../../../REFERENCE_BOUNDARIES.md#ref-062)（外部来源未随包提供）、[地址退役](../../../../REFERENCE_BOUNDARIES.md#ref-063)（外部来源未随包提供））。
- **P2 永久身份（10-13 起）**：中心持久身份库 identity-v3（[持久存储](../../../../REFERENCE_BOUNDARIES.md#ref-064)（外部来源未随包提供））。P3 双域（项目/目标）管理与创建恢复（10-14）。
- **P2-A/P2-B（10-14～10-15）**：双库只读盘点；中心身份宿体代码与部署前验证完成，10-15 独立终审 PASS（`state/PLAN.md`“2026-10-14 当前执行入口”）。
- **10-15 热修复（EVA 性能支线的前因）**：EVA `data.json` 约 37 MB 超过 32 MiB 上限导致全部保存失败；同批修复管理中心加载失败、改用 createRequire（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-065)（外部来源未随包提供）；经验卡 [相对 require 与体积上限](../../../../REFERENCE_BOUNDARIES.md#ref-066)（外部来源未随包提供））。
- **P2-C 命名权威移交（10-15～10-17）**：命名移交内部核心与恢复协议（如 [中心适配](../../../../REFERENCE_BOUNDARIES.md#ref-067)（外部来源未随包提供）、[命名激活](../../../../REFERENCE_BOUNDARIES.md#ref-068)（外部来源未随包提供））。下文 C1、C2 是 P2-C 内部的切片编号（`state/PLAN.md`“2026-10-15 P2-C 命名权威激活链路”“C2 整合收尾”），不是与 P2/P3 平行的体系；C3 也是 P2-C 的切片（绑定批次，`state/PLAN.md` P2-C 链路）。
- **C2（10-16～10-19）**：登记与改名由中心做主；原生验收中暴露并修复旧改名入口误入、目标域关键词残留等缺陷（[C2 完成](../../../../REFERENCE_BOUNDARIES.md#ref-069)（外部来源未随包提供）、[原生修复第二批](../../../../REFERENCE_BOUNDARIES.md#ref-070)（外部来源未随包提供））。
- **C3（10-18～10-20）**：中心与六个参与插件的版本协商、绑定格式、窄切片部署，再到 Y1 Collection 完整操作集（[窄切片](../../../../REFERENCE_BOUNDARIES.md#ref-071)（外部来源未随包提供）、[Y1](../../../../REFERENCE_BOUNDARIES.md#ref-072)（外部来源未随包提供））。
  - **范围收窄（用户决定，10-20）**：Workspace/GTD 不做替换/解除，F 多来源不做，目标只需新增与改名。
- **P2-E（10-21）**：新建项目/目标完成后自动登记、由中心管名（[记录](../../../../REFERENCE_BOUNDARIES.md#ref-073)（外部来源未随包提供）；记录卡写于部署时，原生结果见 `state/PLAN.md`“主线进度与插入工作包”：大千原生通过，NEWERA 待验）。
- **性能支线（10-21）**：原生探针证实 EVA 关系中心是跨插件放大器 → EVA-P1（Collection 只在必要时重新注册，[记录](../../../../REFERENCE_BOUNDARIES.md#ref-074)（外部来源未随包提供））。原生复测见 `state/PLAN.md`“EVA-P1 完成”与 [EVA 页](../plugins/eva-cross-view-relations.md)：切 Tab 顺滑（用户确认），但**新增待办路径没有改善**；PEO 追踪可见性假广播 → PEO-TV1（实现与终审中）；EVA 索引器频繁写盘 → IDX-W1（已入计划）。见 [EVA 关系中心](../plugins/eva-cross-view-relations.md)、[EVA 索引器](../plugins/eva-incremental-indexer.md)。

## 贯穿始终的几条原则（来源见各链接）

1. **产出者 ≠ 审查者**：关键计划、跨文件修复、终稿先过独立 verifier（`CLAUDE.md` 章程；`state/INDEPENDENT_VERIFICATION.md`）。
2. **部署 ≠ 验收**：磁盘部署之后还要原生验收，仓库测试不能代替真实宿主（FW-025、FW-026）。
3. **先备份再写、留回滚字节**：每批部署都有字节备份、哈希和回执（阶段一规则）。
4. **主键是有身份、有生命周期的对象**：从 7 月的 Kill/退出原则到 10 月的永久身份与中心命名。
5. **性能要原生证据**：仓库计时与模拟负载不等于真实卡顿（FW-024；10-21 的 Console 探针方法）。

## 已知缺口

- 记录卡格式不统一（数字以 [目录](../../../../REFERENCE_BOUNDARIES.md#ref-075)（外部来源未随包提供）“总览”与 2026-10-21 独立核查 `results/system-evolution-verification-20261021.md` 为准）：补录前 223 张没有 frontmatter，85 张在 `change-records/` 根目录。10-11 起仍有一批不符合模板：没有 frontmatter 的约 63 张（2026-10 子目录 32、根目录 31，夹杂分布而非集中在最近），另有约 81 张有 frontmatter 但缺少必填字段。C3/Y1、P2-E、EVA-P1 三张当时也没有 frontmatter。**2026-10-21 用户确认后已补录这 63 张**：只在文件开头新增 frontmatter（标 `frontmatter_backfill`，正文未改，备份 `state/backups/change-records-frontmatter-20261021-192456`，脚本 `results/frontmatter-backfill-20261021/backfill.py`）；补录后无 frontmatter 剩 160 张（均为 10-11 之前的早期格式），缺必填字段的约 81 张未处理。
- 本页阶段划分与“转折”是归纳；细节以记录卡、Atlas 日志、PLAN 为准。

## Trace

- 生成材料：`scripts/change_records_index.py` 输出、`atlas/log.md` 节标题（06-24～10-21）、`framework/question-map.md` FW-001～026、`state/PLAN.md`。
- 用户请求（2026-10-21）：“B. 写一页系统演进史……每个阶段链接到对应的记录卡、Atlas 节和 PLAN，标出关键决定和转折”，完成后由独立 verifier 校验。
