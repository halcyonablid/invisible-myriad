# Unknowns Register

status: draft_mvp
updated: 2026-07-07

This file records the cognition gap between user practice, code facts, and current AI understanding.

## High Priority Questions

1. What exactly distinguishes `范式积累` from ordinary workspace tab items in the user's daily practice?
   - status: confirmed_by_user
   - current understanding: In project coaching, `范式积累` is fact/material/environment/history evidence and reusable knowledge assets. It is not the committed next-action list.

2. Which plugin should be considered the primary source for a project's "current stage" when Mandala project plan, Workspace bound notes, Collection Card, and GTD all contain clues?
   - status: partially_confirmed_by_user
   - current understanding: For current-state diagnosis, prioritize same-key project execution plan / 项目纵向管理 and weekly tracking / 周追踪, then explicit Collection Card next actions, while using historical notes and `范式积累` for facts and background. Weekly tracking can be incomplete if the user has not updated it, so the coach must align the tentative conclusion with the user.
   - remaining unknown: Exact conflict arbitration when project execution plan, weekly tracking, Collection Card, and note evidence disagree.

3. How should `subconcept` under keyword drawers interact with Antinet topology ordering?
   - status: partially_confirmed_by_code
   - current understanding: Drawer and SCON subtree order uses the subtree minimum ATOM address where available. Addressed nodes sort by Antinet-style natural order and before unaddressed nodes; unaddressed nodes keep BUS-number and label fallback. SCON first-letter locators affect display grouping only, not raw identity.
   - remaining unknown: Whether SCON should become a first-class global review/search dimension, and how AI context export should represent multiple keyword/subconcept contexts without flattening symbolic ports.

4. Does every Workspace primary correspond to a project, or can it represent an area/resource/container that should not receive project coaching?
   - status: unknown
   - why: Project Overview uses workspace primary as execution anchor, but not every anchor may be a project.

5. Which GTD and Collection Card items are "action prompts" versus "already committed work"?
   - status: confirmed_by_user
   - current understanding: GTD is heuristic prompting and self-activation. Collection Card is the clearer committed or concrete next-action layer, though individual cards still need source labels and recency checks.

6. What fields in Mandala project plan have highest authority for AI coaching?
   - status: confirmed_by_user
   - current understanding: `最终愿景/价值取向/当前现实/下一步行动/关键里程碑+日期` are upper-level design fields, not weekly rows.

7. When a note links to multiple keywords, should AI coaching preserve all keyword contexts or ask the user to select one context?
   - status: inferred
   - current understanding: interactive selection is desired in UI, while AI context export may list all contexts with source labels.

8. Which historical plugin cards are obsolete because code has since changed?
   - status: unknown
   - why: The atlas currently synthesizes memory cards and recent discussion; it needs periodic code verification before strong claims.

9. How should AI coaching adjudicate conflicting current-state evidence across project execution plan, weekly tracking, Collection Card, GTD, and historical notes?
   - status: active_unknown
   - current understanding: Collect all necessary evidence first, preserve source roles, mark stale or possibly under-entered sources, then align with the user before finalizing.
   - why: Weekly tracking is strongly heuristic and recent, but it can be under-filled when the user relies on the project management plugin view instead.

10. How far should AI coaching traverse from one note into the numbered-note network?
   - status: active_unknown
   - current understanding: Use a bounded traversal budget: decode address, inspect parent/nearby siblings when relevant, follow explicit relations and keyword entrances only when they answer the coaching question, then stop once the diagnosis and next actions are sufficiently supported.
   - why: The system's value depends on reading the note's address and surrounding network, but over-traversal creates noise, delay, and false certainty.

11. How should complete Mermaid address semantics interact with COACH and graph-reading workflows?
   - status: active_unknown
   - current understanding: Mermaid numbering is now an Atlas foundation. `ATOM@...`, `+`, `.`, and `subgraph` carry different meanings and should be separated from real references, EVA relations, and layout helpers.
   - why: User confirmed complete Mermaid numbering knowledge is a system foundation, but several details still need calibration against current plugin code and real graph examples.

12. How should Context Capsule Key identity edits synchronize outward from Project Overview to bound consumer carriers?
   - status: active_unknown
   - current understanding: The earlier low-priority rename decision is superseded by the user's explicit implementation/deployment request. Project-domain naming, frozen owner plans and partial-failure recovery are deployed (`confirmed_by_code`); see [unified management](knowledge/unified-context-key-management.md) and FW-010.
   - remaining unknown: Reloaded-host rename acceptance and remaining domain/consumer coverage. User-confirmed Daqian stop/resume is separate evidence; no permanent identity migration is implied.
   - boundary: Consumer-local names remain local; a Mandala UI may delegate an explicit request to PEO without becoming a second declaration writer.

13. Which Mandala and Keyword domains should expose provider snapshot subtypes?
   - status: active_unknown
   - current understanding: Workspace Mount, Collection Card View, and GTD currently have confirmed Context Capsule carrier snapshot APIs. Mandala and Keyword should gradually follow the Provider Snapshot Contract Family principles only where a domain-specific summary/detail owner API makes sense.
   - remaining unknown: For Mandala, whether the first subtype should cover daily lessons, weekly tracking, project plan rows, goal execution plan rows, or AI coaching summaries. For Keyword, whether the first subtype should cover keyword-note lookup, drawer/SCON topology, symbolic entrance summaries, or AI context export. They should not be forced into `getContextCapsuleCarrierSnapshot()` unless the Context Capsule carrier subtype truly applies.
   - next evidence needed: A concrete consumer need, a bounded request key, and a summary-only return shape for the first Mandala or Keyword subtype, plus a verifier check that it will not add first-render load or direct business JSON reads.
   - why: This prevents the contract family from becoming an over-abstracted universal method while still giving the system a path toward consistent summary-first, detail-on-demand, owner-API communication.

14. How should every exited primary key remain discoverable without returning to the active working set?
   - status: active_unknown
   - current understanding: Project Overview Kill Mode, Mandala historical week rosters/stop-week closeout, and Timeline's non-destructive stop projection provide owner-specific review paths. Stable identity connects old evidence without forcing inactive objects back into current planning.
   - remaining unknown: Whether the system needs one read-only retired-primary-key archive spanning Project Overview Kill, Mandala `不再推进`, source-missing historical identities, and Timeline retained history; what minimum provenance fields it must expose; and how it avoids becoming a second data owner.
   - why: Persisting inactive rows without a bounded UI/API discovery path creates ghost data rather than useful history.

15. Should Workspace Mount content snapshots be retired, archived to a cold sidecar, or retained as an explicit recovery feature?
   - status: active_unknown
   - current understanding: State Capsules is no longer used for state switching (`confirmed_by_user`), but Workspace Snapshot is independently owned content-copy behavior (`confirmed_by_code`). A bounded Dev/Mirror/Runtime scan found no direct external consumers, and a synthetic fixture shows snapshot fields can materially enlarge serialized owner state. The safe candidate is layered retirement, not immediate deletion.
   - remaining unknown: Whether real Workspace snapshots exist; whether any are still used or valued; their actual byte and latency contribution; and whether read-only compatibility, cold archival, or explicit deletion best fits the user's retained-data preference.
   - why: Removing the active surface may reduce future cost, while deleting historical content without inventory, backup, explicit confirmation and migration verification could destroy recoverable user data.

16. How much real-host performance is recovered by retiring the State Capsules-to-Workspace environment bridge while preserving Workspace content snapshots?
   - status: active_unknown
   - current understanding: Actual Runtime, Repository Dev and Repository Mirror now implement the paired retirement and align on the verified hashes. State Capsules no longer captures/applies/verifies Workspace state and preserves legacy `workspaceMount` values as deep-cloned, read-only inert data. Workspace Mount no longer registers or heartbeats the Workspace-specific BUS host, runs its watchdog, accepts queued BUS apply, or publishes deep-cloned state after mutations. Its passive Global API/direct live bridge, the shared generic BUS, and the independent content Snapshot feature remain intact. The dual-bundle synthetic harness confirms those boundaries but is not a real-host benchmark.
   - remaining unknown: Real Obsidian idle cost, mutation-time savings at the user's actual Workspace size, and loaded-UI side effects after plugin reload. State Capsules is currently disabled in Actual Runtime, so its loaded behavior has not been exercised.
   - why: The implementation removes both producer and consumer work in Repository Dev without conflating active transport with passive control or content Snapshot ownership. Performance magnitude still requires real-host measurement.

17. Which remaining CapsuleBridge paths should retire into passive owner APIs, and is the shared generic BUS still justified after Collection exits?
   - status: active_unknown
   - current understanding: Repository Dev, Actual Runtime and Repository Mirror now implement the paired Collection retirement. Collection no longer publishes to State Capsules, registers a generic BUS host, exposes the legacy global bridge, or deep-clones full bridge state on scroll/render. State Capsules treats historical `collectionCard` as deep-cloned read-only inert data. The passive owner API remains, with exact notePath, active-ready preference, ambiguity/not-ready fail-close, missing-only ensure and stale serialized-state protection. GTD and the generic BUS implementation remain unchanged.
   - remaining unknown: Real Collection interaction savings in the loaded vault; single/multi-host and retarget behavior under Obsidian timing; whether any dynamic/computed or console consumer still needs the generic BUS; whether the now producer-free Runtime BUS should retire after deployment; and whether GTD should later exit State Capsules control for architecture rather than performance. Physically removing unreachable State Capsules Collection helpers is also deferred.
   - next evidence needed: Plugin reload plus loaded-host single/multi/not-ready/retarget smoke, State Capsules enablement smoke for new/overwrite/history/restore if desired, real-host before/after timing, and an independent generic-BUS/GTD gate.
   - why: Similar bridge names do not imply similar costs. Retirement should follow measured active work and owner API safety rather than architectural symmetry alone.

## Atlas Maintenance Questions

1. Should this atlas eventually get a generated index or JSON sidecar for AI context export?
   - status: inferred
   - current view: likely useful, but not part of MVP.

2. Should Project Overview expose a system-wide atlas context API, or should a separate skill read atlas files?
   - status: inferred
   - current view: start with files and skill usage; add plugin API only after stable semantics.

3. Should engineering change records automatically ask whether an atlas patch is needed?
   - status: inferred
   - current view: yes for cross-plugin contracts, plugin role changes, data ownership changes, or workflow changes.

4. Should Mermaid address semantics get code-level verification against the current runtime reference graph and antinet plugins?
   - status: inferred
   - current view: yes before treating all grammar details as `confirmed_by_code`.


## 大千统一内核迁移待证（2026-10-07）

| ID | 问题 | 状态 | 验证路径 |
| --- | --- | --- | --- |
| DQ-U01 | 已迁unit的全部旧writer/loader/raw-reader/消费者是否封闭？ | closed_abandoned（2026-10-26 大千路线废案） | 原UI隔离/回调接线只证限定候选；真实host旧writer排空与loaded核对仍未完成。FW-025；当前调度见活动PLAN，[过渡页](knowledge/unified-core-transition.md) |
| DQ-U02 | 根登记、witness、unknown恢复与功能等价优化能否满足真实host响应和规模？ | closed_abandoned（2026-10-26 大千路线废案） | 路径/热读/增量日志已有仓库证据；字节收益不等于延迟收益。按同场景测读取/刷新/投影/可见响应与持久确认；快速快照/分段历史保留另待信任证明，目录flush/断电未验。FW-024/025，[过渡页](knowledge/unified-core-transition.md) |
| DQ-U03 | 原视图/实时资格/来源/表格/草稿/关闭能否在同一候选完成核心闭环及常用入口兼容？ | closed_abandoned（2026-10-26 大千路线废案） | 原NAW/Workspace表格已有189安全测试与8浏览器限定证据，不相加称完整整链；周追踪、日课、ontology元表格中枢及实际host仍待各自验收。FW-019/025，[过渡页](knowledge/unified-core-transition.md) |

## 统一主键管理待证（2026-10-13）

长期事实入口：[统一主键管理与宿体](knowledge/unified-context-key-management.md)。对应FW-026；活动排期只在当前PLAN。

| ID | 问题 | 状态 | 需要的证据 |
| --- | --- | --- | --- |
| CKM-U01 | 如何从当前声明/派生描述符过渡到永久contextId及明确subject/carrier绑定？ | active_unknown | 2026-10-20 部分关闭：生产 identity-v3 已持有永久 contextId、subjects、bindings（P2-B 起），NEWERA 已登记 5 个对象。仍开放：全量旧身份迁移、同号异名消歧，以及未登记对象的批量接入 |
| CKM-U02 | 如何将已部署管理中心从目录/命令入口升级为主键核心数据唯一宿体？ | active_unknown | 2026-10-20：身份与命名已移交中心（C1/C2，限已接管对象）；绑定只移交了 Collection 首次替换（C3）。仍开放：绑定完整操作集（Y1 起）、Workspace/GTD、目标域、多来源，追踪（P2-D）与创建（P2-E）的移交。见 plugins/context-key-manager.md |
| CKM-U03 | 如何验证完整管理生命周期、所有消费者和真实宿主恢复/性能？ | active_unknown | 新改名实机验收；停止/恢复追踪、新增、停追历史回看的集中流程（Kill/revive 已退出生命周期，仅历史诊断）；各consumer实际匹配/能力/回读、历史可发现性。no-match/excluded不能当全系统同步通过 |

## 2026-10-13 GTD 简化后的大千实验快照风险

| ID | Question | Status | Evidence needed |
| --- | --- | --- | --- |
| GTD-U01 | 大千 `daqian-unified-core-lab` 的 gtd-ui-loader.cjs 对冻结 GTD 引擎快照（2b703db7）打约 50 处精确锚点补丁，其中约 15 处落在 G1 删除的视图上下文/胶囊桥代码；若用简化后的引擎（1694c376）刷新该快照，补丁必然失败。何时、以何种方式让实验插件跟随新引擎？ | open | 刷新快照前单独成批：盘点锚点、改写或退役对应补丁、实验插件 GTD 视图回归。证据：results/context-key-bus-management-20261012/gtd-simplification/PLAN-REVIEW.md、FINAL-REVIEW.md |

## 修订号与内存查询待证（2026-10-22，FW-027/FW-024）

| ID | 问题 | 状态 | 证据缺口 |
| --- | --- | --- | --- |
| BUS-U01 | 如何覆盖owner写入、来源/provider换代和无事件的外部修改？ | active_unknown | r1–r21仓库证据已覆盖部分保存观察、来源lease与映射事件；全owner内容revision、无通知外改及原生规模仍未证明。候选/部署/加载分开，见[PEO边界](plugins/project-execution-overview.md)。 |
| BUS-U02 | 哪些改变应使导航而非仅追踪证据失效？ | active_unknown | 四消费者已有候选接线；r21将当前配置有效对象补入普通目录，并修补后缀来源映射失效。强制index/refresh链不证明自动创建恢复通知到UI；最终资格后续变化、二级内容与历史定位仍待证。见[工作流验收](workflows/operational-context-to-next-action.md)。 |
| BUS-U03 | 内存查询减少工作后能否真正缩短新增及创建恢复耗时？ | active_unknown | 旧包也偏慢且常需第二次创建（用户证据）；A0计数并非真实延迟。需实验库同场景配对测visible/durable/恢复，无回归后再决定日常推广。S1.5当前暂停，执行次序只在活动PLAN。 |
| BUS-U04 | 导航年龄兜底300s下，健康检查未覆盖来源（Collection、timeline、keyword-index等）的无事件变化多久进入目录、是否可接受？ | active_unknown | r30以epoch/deps/来源观察复用导航，年龄仅兜底；显式/待核验刷新>30s重建。需原生观察漏事件实例与用户感知，再决定补事件或缩短兜底。[r30](../../../REFERENCE_BOUNDARIES.md#ref-292)（外部来源未随包提供） |
| BUS-U05 | 导航构建本身（每种分组模式完整总览，9–77 s）如何做成轻量增量，使 EVA changed/首次登记与 Mandala 周计划写入不再触发整套重建？ | active_unknown | r31 后剩余主要耗时；S4 方向。证据见 [r31](../../../REFERENCE_BOUNDARIES.md#ref-293)（外部来源未随包提供） 与 console-bridge 原生采样。 2026-10-25 r33 原生分段：carrier-edges 23–65s/模式、external-jumps 14–87s/模式，其余阶段<1s；首要优化点。 |
| SM-U01 | SuperMemo业务内容存于跨库共享localStorage，何时、如何按库隔离并迁移旧数据？ | deferred_by_user | 2026-10-24 confirmed_by_code+user（实验库读到schema 2）；用户选择暂不处理；见[SuperMemo页](plugins/supermemo-concept-display.md)。 |

### 2026-10-22 BUS-U02 补充证据（refines）

S2-A1a同批目录与纯读frame已仓库验证，不关闭BUS-U02或S2。真实consumer仍需覆盖旧sync键getter和async refreshSoon、unknown/历史只读、静默续租与可见叶子调度；每frame仍有验证复制成本。证据：`results/context-key-bus-management-20261012/sync-bus-r/s2-a1/FINAL.md`；实时顺序以活动PLAN为准。


## 2026-10-22 S2-A1b Collection 候选证据

- observation：Collection实际view的同步键目录/逐标签读取及渲染内refreshSoon会走旧导航；本批将其接入A1a同批快照并与生命周期需求调度分开。
- claim / source status：仓库源码候选与方法级模拟DOM/时钟测试支持“该view每同步render一份快照，旧查询计数0”；未部署，不是原生性能结论，也未提升运行协议登记。
- update target / Bayesian label：**refines FW-027 / BUS-U02**。查询纯读还须配合unknown保留画面、输入保留、加载隔离和跨await跳转复核；“不清DOM”同时要求保存期间禁用原输入控件。弹窗关闭早于其调用方业务完成，不能据此自动换源。
- trace：`results/context-key-bus-management-20261012/sync-bus-r/s2-a1b/PREFLIGHT.md`、`main.diff`、`test-results.json`、`verifier-final-extra.cjs`；本批独立终审PASS，见同目录 `FINAL.md`；仍仅仓库候选。唯一执行次序以 `state/PLAN.md` 为准。
- 未关闭：Workspace/GTD/九宫格/State Capsules真实接线；全owner内容版本/漏事件；原生输入、滚动、历史跨插件跳转及创建首次/恢复耗时。30秒lease fallback仍可能构建完整导航，底层flight不支持取消；并非空闲零计算。

### 2026-10-24 候选阶段校正（refines BUS-U01/U02；BUS-U03保持open）

上方2026-10-22补充及S2-A1b段落为当时证据，不作为当前未接线清单。State Capsules已弃用，不再是消费者验收依赖。r21目录补充通过独审但未部署；完整自动链和原生性能没有由这些局部证据关闭。唯一执行顺序见活动state/PLAN.md；trace见PEO页的r21证据链接。

## BUS-U05 补充（2026-10-25 ACC-5）

- 状态：open。r34 后创建后恢复已解决；剩余观察：EVA changed→health 抖动致 NAVIGATION_HEALTH_NOT_READY；e01 上游 ok:false 误标为 DIRECTORY_FINAL_ENVELOPE；空闲 PEO 自身 write 作废构建（来源待查）；热态导航构建 8–43s、冷启动 125s；长任务合计 50s/最长 8.8s。A5 残余（滞后事件晚于释放 300s）未观察到。证据 results/context-key-bus-management-20261012/console-bridge/out/acc5-1792942532326.json。

## BUS-U05 / SM-U01 补充（2026-10-25 ACC-6）

- BUS-U05：open。r35 后外部跳转中位 1.65s；剩余关键词索引每条整读 3.6MB 文本（728 次/56s）、carrier-edges 未命中 48–64s、console.info 22644 次、getMarkdownFiles 9190 次；E4 空闲保存本次未复现。
- SM-U01：deferred_by_user（再次确认）。confirmed_by_code：日常库 SuperMemo antinet 模型 SCHEMA_VERSION=2、实验库为 1，共享 localStorage 键 supermemo_antinet_structure_tree_v1 已为 schema 2 → 实验库 ANTINET_SCHEMA_FUTURE 只读保护；该保护同时阻止实验库改写日常库共享数据。

## D1 日常库迁移围栏（2026-10-26）

- 开发源镜像 `workspaces/26- supermemoconcept的改进/插件/` 的 7 个程序仍为 r27 前像（PEO、collection 已与日常版不一致）；D1 之后该镜像落后于日常库，**禁止从它部署到日常库**（会悄悄回退）。是否同步镜像为独立决策。证据 results/context-key-bus-management-20261012/sync-bus-r/daily-migration-d1/PREFLIGHT-VERIFY.md（A6）。

## PEO / Mandala 前像备份上限（2026-10-26，r39）

- PEO：确认事务前像备份（.goal-peo-*.before.json，每份约 2.4MB）同组 64 份/64MB 上限曾导致创建永久停在 peo-declaration（PEO_WRITER_BACKUP_CAPACITY）；r39 起到上限时最旧的移入 `.goal-peo-archive/`（不删除）。日常库在 D2 迁移前仍为旧行为（18 份/42.6MB，约 8 次事务余量）。
- open：Mandala `CENTER_GOAL_BACKUP_CAPACITY` 有相同的 64 份/64MB 上限（`.center-goal-*.before.json`），两库目前 0 份，暂不紧急；缩小前像（firstSeenOrderByScope 约占 2MB）属契约变更，r40 以后评估。证据 results/context-key-bus-management-20261012/sync-bus-r/integration-r39-peo-backup-retention/。
