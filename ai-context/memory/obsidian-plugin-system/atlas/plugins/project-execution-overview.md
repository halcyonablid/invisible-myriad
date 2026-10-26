# Plugin: project-execution-overview

## 2026-10-24 r28原生续期误判（当前进度）

source_status: confirmed_by_code（r28候选与隔离反例）；native_effect: pending；update_type: corrects / refines。

本轮找到一条已复现的失效链：九宫格epoch/contentRevision不变而checkedAt/expiresAt续期，PEO的精确时间比较使仍在原有效期内的结果变stale。仅修PEO展示guard，保留数据/来源/方法/健康围栏和原截止；构建期间续期也将公开expiresAt限制在捕获截止。无业务写权限变化。

正常凭证续期与业务修订必须区分；允许相对捕获锚点的有界重叠续期，不延长旧snapshot/pass截止。公开expiresAt应不晚于私有guard的硬截止，否则消费者定时刷新可能晚于实际失效。保留pending/真实修订/来源变化的撤销及保存时重新核验。此处为契约结论，不声称全部启动问题已解决。

证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r28-native-startup/RENEWAL-FINAL-INDEPENDENT.md、EVIDENCE-CORRECTION.md、native-trace-1792843282367-83d73a5a.json、release-manifest.json。9定向、15回归、4变异及独立6边界通过；16安装/回退演练通过，均不等于原生性能证据。

实时状态与顺序只回state/PLAN.md，历史阶段文字不替代当前计划。

## 2026-10-24 仓库候选：普通目录、来源与有效资格的边界

source_status: confirmed_by_code（sealed r21候选及合成宿主）；update_type: refines / corrects；未部署。

本节更新下方A1a/A3“尚未接线”的阶段描述：仓库候选已有Workspace、Collection、GTD和九宫格消费者接线及来源/资格联动证据；这不表示运行库已经切换，也不关闭自动UI和原生性能待证。

普通目录是图导航观察与当前配置来源有效对象的有界并集。后台以项目/目标各自既有final display API补足未进入图起点或导航上限的有效对象；项目范围是Workspace项目条目，目标范围是九宫格目标追踪行，既有500上限仍适用。`coverage: observed-navigation`仍是追踪观察范围，独立`keyDirectoryCoverage/currentConfiguredScope/qualificationRevisions`说明补充来源和修订；目录不是完整注册表、最终全量有效集或写授权。

身份按domain+canonical primaryNodeKey接合；检查原始merged sources后再处理显示ID，冲突不按名称或编号静默合并。资格不完整不等于停止追踪，未知/其他来源/Timeline导航保留；明确已停止的同ID旧选项才可由有效新对象替代，历史内容不改。业务数据继续由原owner保存，PEO是派生目录提供者。

纯读检查固定配置/方法、精确文件lookup和映射代际，不扫描、不调用final。来源解析与失效selector必须使用一致的匹配规则：独审曾复现Workspace/Collection后缀解析改源但缓存未撤销，修补及失败反例留存。后台补充仍有IO，不能把100次纯读零新增IO换算为创建提速。

证据：[r21覆盖与成本](../../../../REFERENCE_BOUNDARIES.md#ref-238)（外部来源未随包提供）、[独立终审](../../../../REFERENCE_BOUNDARIES.md#ref-239)（外部来源未随包提供）。自动创建/恢复事件到四页面、二级内容/历史跳转、真实首次创建与恢复耗时仍待验。当前任务顺序仅见[活动PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-240)（外部来源未随包提供）；下方TV/S1.5部署记录保留为历史，当前日常/实验基线见其2026-10-22校正。State Capsules已被用户弃用，不作为本轮接线或验收依赖。


## 2026-10-22 S2-A1a：同批目录与纯读消费边界

source_status: confirmed_by_code（仓库候选和隔离测试）；update: refines；未部署，不代表运行协议。

Collection/Workspace的渲染还会经同步键列表及异步refreshSoon进入旧导航；仅替换逐标签判断不足以关闭重复计算。候选把原nav builder的12字段主键目录与停止状态一起冻结发布，沿用原身份、去重、排序；目录为observed-navigation投影，不是完整注册表、有效项集合或写授权。同编号的不同身份仍独立。

纯消费者每同步frame读一次；目录和标签校验/复制成本仍存在。unknown与未证实停止分开；跨await必须重新验证provider、源、同一快照和租期；冻结Set对象并不能保护其内容，因此Set只封装于闭包。真实UI、生命周期和历史只读fence尚未接线；同内容续租可能不发事件，到期处理需重新读取当前快照，不能由旧timer直接判失效或无条件刷新。

证据：[A1a交付](../../../../REFERENCE_BOUNDARIES.md#ref-241)（外部来源未随包提供）、[独立终审](../../../../REFERENCE_BOUNDARIES.md#ref-242)（外部来源未随包提供）。本节只保留工程证据；阶段次序回到[当前PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-243)（外部来源未随包提供）。


## 2026-10-22 PEO 发布端只读快照候选证据

source_status: confirmed_by_code（仓库候选与隔离测试）；update: refines。未部署，不代表运行API。

A3新发布路径显式携带捕获别名，断开载体收集→旧sync键列表→ensure的反馈；真实方法隔离测试显示新路径旧ensure为0，默认旧路径保留。低层持久方法保留原体，以嵌套屏障观察settlement。查询只读已冻结快照，显式refresh才激活有限需求窗口；tracking失效可复用同代导航。实际API/方法/回退对象引用只是观察向量，尚非所有owner内容revision；30秒租期、未知态和证据校验仍必要。

不改变provider ownership、身份、追踪或历史。当前消费者未切换，完整导航与EVA整份clone仍在；不得由此宣称新增变快。source/窗口重置的旧flight晚到、特殊数组重入、时钟回拨已加入回归。证据：[A3交付](../../../../REFERENCE_BOUNDARIES.md#ref-244)（外部来源未随包提供）、[独立终审](../../../../REFERENCE_BOUNDARIES.md#ref-245)（外部来源未随包提供）。调度仅由[当前PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-246)（外部来源未随包提供）维护。

## 2026-10-22 当前环境校正与修订号候选

source_status: confirmed_by_code（磁盘基线/仓库候选），confirmed_by_user（日常/实验隔离决定）；update: corrects + refines。

此前TV1/TV2/S1.5-A章节是历史部署记录，不代表当前NEWERA。用户要求回到PEO早期版本后，新实验从日常库重新全量复制：PEO `d0ebcaeb…`、Collection EVA-P1 `85bead92…`；新实验路径 `D:/han/实验库/NEWERA-性能实验-20261022`，旧TV1/S15A实验另备份。当前日常/新实验不含TV1/TV2/S1.5-A。全量基线证据见[重建复核](../../../../REFERENCE_BOUNDARIES.md#ref-247)（外部来源未随包提供）。其他历史根目录不能据此推断一致。

当前S3/S2是实验候选路线：A0纯读快照、A1追踪内容指纹已仓库独立验证；A2已生成真实Mandala源码接线候选，未安装，当时A2阶段PEO与消费者尚未接线；A3仓库发布端证据见上节，运行消费者未改。指纹ready只证明观察窗口的原始字节一致，不证明业务资格、实时磁盘真值或写权限。providerGeneration、sourceScope、contentRevision必须分别校验。周追踪状态版本不覆盖EVA关系、PEO声明、载体绑定、节点与名称全部依赖。

跟踪[FW-027问题与证据](../../framework/question-map.md)及[依赖矩阵](../../../../REFERENCE_BOUNDARIES.md#ref-248)（外部来源未随包提供）；执行顺序只在[当前PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-249)（外部来源未随包提供）。纯读计数下降不能当作创建耗时已下降，原生配对性能与超时原因仍unknown。不得因候选存在而删除旧刷新兜底。

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-09-01

## Role

status: confirmed_by_memory

Project Overview is the execution aggregate and evidence projection layer.

It groups project-related entities across Workspace, Mandala, Keyword, GTD, Collection Card, Timeline, and ordinary notes. It is not the owner of all underlying content; it renders and exports a bounded view.

From the user's management perspective, a group capsule is the managed goal/project object and the columns are its source-owned evidence. Project Overview is therefore comparable to a project dossier desk: it brings records carrying the same primary-key context into one view without moving them into a new Project Overview database. Clicking an entry still returns to its owner.

This distinguishes three things that should not be conflated:

- the primary key names the object being managed;
- source-plugin items and notes carry concrete action, material, fact, or experience;
- Project Overview owns the projection, navigation, lifecycle display metadata, comments, and bounded export, not the source content.

Source: `output/reports/项目与目标如何记录和安排-表达梳理稿.md` (`confirmed_by_user`).

## Column Semantics

status: confirmed_by_memory

- Workspace: execution anchor.
- Mandala / 九宫格: goal or design anchor.
- Keyword: index symbol and tree entry.
- 范式积累: ordinary notes, investigation facts, work environment, knowledge assets.
- GTD: heuristic next-step prompts.
- Collection Card: downstream derived to-dos.
- Timeline: date or sequence evidence.

## Provides

status: confirmed_by_memory

- Visible project evidence groups.
- Bounded two-hop relation preview.
- Workspace primary order snapshot for Mandala weekly summaries.
- Mandala primary order snapshot for target summaries.
- Keyword and Mandala jump entry points through EVA/provider APIs.
- Read-only AI context export for current project group.
- Archived `9XX` keyword display toggle in the top Keywords navigation.
- Narrow owner APIs for overview-level meta/comment sync:
  - Workspace project entries through `syncWorkspaceProjectEntryMeta(nodeKey, meta)`;
  - Mandala context goals through `syncMandalaContextGoalMeta(nodeKey, meta)`.

## Consumes

status: confirmed_by_memory

- EVA relation graph and `openNode`.
- Mandala read-only APIs for weekly/project tracking context.
- Keyword Index note and jump APIs.
- Workspace Mount bound note APIs.
- Collection/GTD relation nodes.
- Mandala `openWeeklyTrackingDashboard` when available, with fallback to legacy weekly table opening.
- Workspace Mount canonical source note resolution and project-entry snapshots.

## Guardrails

status: confirmed_by_memory

- Do not directly write source plugin business JSON.
- Do not trust raw external group objects for AI export; resolve through current rendered model.
- Keep graph preview bounded; two-hop preview is not an infinite graph browser.
- Do not show raw `jump:v1` or `item_m...` IDs as user-facing project names.
- Use source plugin APIs for note binding and carrier-note de-duplication.
- Treat only canonical Workspace Mount source records as Workspace start records; filter non-canonical historical Workspace-like records rather than rewriting business data.
- Hide duplicate ordinary notes only when an exact Keyword or Workspace carrier path exists in the current rendered model.
- Do not let explicit-primary relations alone hide ordinary notes.
- Move parsed `9XX` Context Capsule Keys out of the main Keywords row into the archived display toggle while keeping them clickable.
- Build AI context export from read-only shards over the current rendered `view.model` / `group`; do not rebuild the overview model or read source business JSON during export.
- When structuring the visible overview model as shards, keep `resolveStartRecords`, bounded graph expansion, carrier-note suppression, and relation grouping as deterministic merge/post-processing boundaries.
- Overview-level meta/comment sync APIs may write Project Overview settings only. They must not create or modify Mandala, Workspace, GTD, Collection Card, EVA, or Keyword source records.

## Mandala Context Goal Meta Sync

status: confirmed_by_user_and_code

Project Overview exposes a Mandala-specific narrow write API:

```js
await window.__projectExecutionOverviewPluginApi.syncMandalaContextGoalMeta(nodeKey, meta)
```

Purpose:

- find the Mandala-mode group whose primary node is the given Mandala `nodeKey`;
- set the Project Overview group capsule level from `importanceGroup`;
- write Project Overview's own comment block containing the Context Capsule Key;
- refresh overview views while preserving scroll.

Boundary:

- This API does not create Mandala nodes, GTD project items, Workspace entries, Collection Card tabs, or EVA relations.
- It is parallel to `syncWorkspaceProjectEntryMeta`, but scoped to grouping mode `mandala`.
- If the Mandala group does not yet exist in the overview model, callers should first ensure the cross-plugin carrier relation exists and then retry or accept a missed sync diagnostic.

## Workspace Start Source Boundary

status: confirmed_by_memory

Project Overview is an aggregator, so a `workspace-mount-view` node key is not by itself enough to make a record a Workspace start. Workspace start records must come from the canonical Workspace Mount source note resolved through Workspace Mount settings / API behavior.

Non-canonical records created under Mandala's `九宫格目标.md` are historical evidence and may still exist in data, but they should not become Workspace primary groups.

## Carrier-Note Suppression Boundary

status: confirmed_by_user

Ordinary notes remain visible unless the current Project Overview model has an exact Keyword keyword-note path or Workspace bound-note path for the same normalized path.

If a note is only explicitly related to the current primary / Workspace start, and no carrier path exists, it stays visible in the ordinary-note evidence column. This protects real standalone notes while still avoiding duplicate display for notes that are already reachable through a Keyword drawer/capsule or Workspace bound note.

Keyword carrier detection must use the resolved base column id, not only raw `columnId === "keyword"`, so keyword-derived rows can still expose their keyword-note carrier paths for ordinary-note suppression.

## AI Context Export Shards

status: confirmed_by_user_and_code

The current runtime/dev/mirror implementation collects AI export evidence as read-only shards: primary/comment, column evidence, relation evidence, Mandala tracking context, and Context Capsule Key/cache diagnostics.

The markdown export keeps the older sections (`Column Semantics`, `Primary`, `Evidence By Column`, `Mandala Project Tracking`, `Relations In Group`, `Coach Use`) and adds compatible source diagnostics such as `export_shards` and `source_cache`.

Boundary: this is an export-path refactor over the current rendered model. It does not create a new Project Overview business JSON owner, does not rebuild the model from hidden loaders, and does not migrate Workspace, Mandala, Keyword, EVA, Collection Card, or GTD data.

Mandala structured-field images preserve this boundary. In AI context export, Project Overview projects Mandala project-plan `valueDirection` into readable text plus `[图片 N 张，见 Obsidian 附件]` and does not expose raw embed tokens. The canonical Mandala API value remains unchanged; Project Overview neither edits that field nor owns its attachments.

## Build Model Shard Pipeline

status: runtime_synced_verified

The current runtime/dev/mirror implementation introduces a first-stage build-model shard scaffold without changing data ownership or grouping semantics.

`buildOverviewModelFromResolved()` now delegates to:

- `collectOverviewBuildShards()`: source, start records, Workspace start records, and seed records;
- `mergeOverviewBuildShards()`: deterministic merge, bounded graph expansion, external carrier attachment, carrier-note suppression, column fill, relation grouping, diagnostics, and timeline post-processing.

External carrier attachment is split into Keyword and Workspace carrier shards, joined with `Promise.allSettled`. Each shard still scans items serially to avoid API fan-out. Keyword carrier detection keeps `resolveBaseColumnId(item) === "keyword"`; Workspace bound-note detection keeps `!isOrdinaryNoteRecord(item) && baseColumnId === "workspace"`.

Boundary: this patch does not add Workspace/Mandala/Keyword/GTD/Collection business JSON reads, does not write business JSON, and does not parallelize graph expansion or grouping.

## Aggregation Performance And Fair Limits

status: confirmed_by_memory
updated: 2026-07-06

Project Overview performance work should preserve evidence completeness rather than hide cost behind arbitrary hard limits.

The 2026-07-06 context-carrier fair-limit fix refined the build model prior:

- provider snapshot limits are per-query or per-target protection valves;
- provider-global accepted-record caps can starve later Context Capsule Key targets;
- `count` fields may remain diagnostics, but admission rules should use the semantic fairness unit;
- grouping, column projection, and source ownership remain deterministic reduce steps.

Preferred direction:

- summary first, detail later;
- visible/current group first when hydration is needed;
- bounded provider snapshots rather than direct JSON scans;
- clear diagnostics for omitted, failed, stale, or truncated evidence;
- model-global backstops only as safety guards, not as a substitute for correct ownership and reduce semantics.

Trace:

- `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md`
- `change-records/2026/2026-07/20260706-212400-project-overview-context-carrier-fair-limit.md`

## Effective Goal Carrier Batch Reduction

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-09-02

Project Overview proves target-domain carrier eligibility without constructing its global display graph:

- it parses only the requested Mandala owners' PEO comments and Kill state;
- it requests one exact outbound `承载` batch from EVA and one Context Capsule-to-top-level-project batch from GTD;
- it validates provider envelopes and bucket counts with strict raw types, then checks each singular result against its diagnostic sample;
- it accepts a carrier only when EVA's sole target equals GTD's sole active top-level project node;
- provider absence, stale GTD host, duplicate edge/tag/project, malformed evidence or source mismatch fails closed.

This separates the eligibility reducer from PEO's global graph caps and prevents repeated per-label PEO reads in GTD. All APIs are bounded to 500 requests, read-only, no-activation and no-cross-owner-write.

## Context Carrier Hydration Scaffold

status: runtime_synced_verified
updated: 2026-07-07

Project Overview now has a first implementation slice for the MapReduce performance direction without changing provider API contracts.

Implementation shape:

- `collectContextCapsuleCarrierShards(model, options)` records per-provider and per-context summary diagnostics such as observed count, accepted count, truncation, `hasMore`, revision/cursor when provided, and timing.
- `reduceContextCapsuleCarrierRecords()` owns deterministic de-duplication and derived edge insertion by `contextKey + primaryNodeKey + nodeKey`.
- `attachContextCapsuleDefaultCarrierEdges()` logs hydration policy, provider summaries, timing, and has-more diagnostics.
- Workspace Mount, GTD, and Collection Card now preserve the old `getContextCapsuleCarrierSnapshot(options)` API name while returning provider summary metadata (`totalCount`, `returnedCount`, `count`, `limit`, `hasMore`, `cursor`, `revision`, `timingMs`).
- Workspace Mount's no-open-view case now uses a provider-owned data-read fallback for this snapshot instead of activating the Workspace Mount view.

Boundary:

- This is scaffold and diagnostics, not true post-render background hydration yet.
- The provider API return shape is backward-compatible: old consumers can still read `items`, while Project Overview can now read count/cursor/has-more diagnostics.
- EVA manual relations remain separate explicit evidence and are not written by the default carrier path.
- The injection point remains before external jump targets, ordinary-note suppression, column fill, and group construction, preserving existing reduce semantics.

Trace:

- `change-records/2026/2026-07/20260706-235200-project-overview-mapreduce-hydration-scaffold.md`
- `change-records/2026/2026-07/20260707-001800-provider-carrier-summary-no-activate.md`

## Context Capsule Default Carrier Edges

status: confirmed_by_code
updated: 2026-07-06

Project Overview can attach default same-Context-Capsule-Key carrier evidence during model construction through provider snapshots:

- Workspace Mount: `window.__workspaceMountPluginApi.getContextCapsuleCarrierSnapshot(options)`;
- Collection Card View: `window.__collectionCardViewPluginApi.getContextCapsuleCarrierSnapshot(options)`;
- GTD: `window.__gtdTaskManagerPluginApi.getContextCapsuleCarrierSnapshot(options)`.

Implementation shape:

- `getContextCarrierProviders()` lists the providers;
- `collectContextCapsuleCarrierShards()` reads them with `Promise.allSettled`;
- `attachContextCapsuleDefaultCarrierEdges()` normalizes records, de-duplicates by node key, and adds derived edges before column fill and relation grouping.

Boundary: these are derived Project Overview display/evidence edges. They do not replace EVA manual relations, do not write source plugin JSON, and do not change `startRecords`, bounded expansion, or grouping semantics.

Provider snapshot calls must not activate or reveal provider views. Project Overview may call these providers during model construction, so visible focus changes would create a UI ping-pong between source plugins.

Trace:

- `change-records/2026/2026-07/20260706-190200-gtd-context-carrier-snapshot-api.md`
- `change-records/2026/2026-07/20260706-191200-provider-snapshot-no-focus.md`

## Visible Context Carrier Auto Refresh

status: runtime_synced_verified
updated: 2026-07-15

Project Overview Phase 2B1 consumes the existing Workspace Mount, Collection Card View, and GTD `context-capsule-carrier:changed` events as conservative dirty hints.

Implementation shape:

- event bursts are coalesced without polling;
- hidden or closed Project Overview leaves retain dirty state but create no timer, provider probe, model build, or render;
- visible leaves derive visible Context Capsule targets from the committed model/group projection and probe them through the provider owner snapshot API;
- a SHA-256 fingerprint covers ordered stable projection content plus completeness/truncation metadata;
- equal complete evidence causes zero build/render, while changed or uncertain evidence schedules one scroll-preserving latest-wins refresh;
- stale, hidden, closed, or superseded builds cannot commit;
- provider failure retains the old committed model and remains retryable on a real external event, explicit refresh, or visibility transition.

Boundary:

- This is a Project Overview consumer change only. Workspace Mount, Collection Card View, and GTD APIs/events were not changed.
- No direct provider business JSON reads, provider view activation, polling, eager hidden hydration, persistent index, or cross-owner write was added.
- EVA manual relations and the deterministic full-model reduce remain intact.
- Runtime/dev/mirror code and syntax/hash evidence are confirmed. The user reloaded Project Overview and confirmed automatic provider-carrier freshness in actual Obsidian. Hidden-view/UI-only/failure/scroll subcases remain code-harness evidence unless separately observed.

Trace:

- `change-records/2026/2026-07/20260715-163048-project-overview-phase2b1-carrier-auto-refresh.md`

## 9XX Keyword Archive Display

status: superseded_2026-10-13 — 编号前缀不再归档；顶部改为「查看已停止追踪」只读回看（原分组/列卡片/连接），点击条目经目标 owner `openHistoryNodeV1` 打开历史条目。见 [有效资格](../knowledge/effective-operational-context-key.md)。以下为历史规则。

The top Keywords navigation treats parsed addresses matching `^9\d{2}` as archived display chips. They move into an `已归档` toggle and remain clickable.

Non-9XX addresses such as `009A` and `036B` stay in the main row. This display rule does not alter the source project groups or underlying data.

## Unknowns

## Primary-Key Lifecycle Kill Mode

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-07-23

Project Overview now owns reversible active/killed metadata for Workspace project primaries and Mandala goal primaries.

- Identity uses `domain + primaryNodeKey`, so label rename does not orphan lifecycle state.
- Normal mode filters only final all-killed group projection; mixed groups remain visible and the complete model is retained.
- Kill Mode exposes killed groups with Kill/revive controls and hydrates newly visible dirty provider evidence without activating provider views.
- Context Capsule identity APIs remain complete. Global keyword navigation keeps one visible row per keyword while retaining all source identities for any-active lifecycle selection.
- The public lifecycle facade is read-only. Internal mutation persists first, commits settings, queues the revision event, then renders each Project Overview leaf as isolated best-effort work.
- AI context export may include `primary_lifecycle` status as Project Overview-owned metadata without deleting evidence.
- Kill Mode is also the anti-ghost-data read path: killed identities and their retained source evidence remain inspectable and revivable instead of becoming settings-only records.
- If a current source later disappears, historical evidence should retain stable identity and historical labels with an explicit source-missing boundary; it must not degrade into an unexplained current item or be silently discarded.
- Project Overview Kill does not by itself provide a system-wide retired-primary-key archive. Cross-plugin historical discovery remains a separate open design question.

Trace: `change-records/2026/2026-07/20260723-120847-project-overview-primary-key-kill-mode.md`.

## State Capsule Primary-Tab Restore

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-01

Project Overview capsule state v2 captures selected primary-key Tabs by scope. Each selection stores both the current derived `groupId` and stable `primaryNodeKey`; restore resolves exact group, then stable primary identity, then the first currently visible group.

`activeScopeKey` restores grouping mode and normal/Kill scope in memory. Normal scope filters an all-killed group before selection, so a stale capsule cannot revive or reveal it as active. Kill scope remains an explicit inspection surface and restoration does not mutate lifecycle metadata.

Restoration selects the Tab with `scrollToTop: false` and refreshes with vertical-scroll preservation. This replaces the older mental model of restoring Project Overview by scrolling a long parallel page.

Trace: `change-records/2026/2026-08/20260801-151030-state-capsules-peo-gtd-context-restore.md`.

## Unknowns

- Whether each Workspace primary should be coachable as a project.
- How to rank conflicting evidence across GTD, Collection Card, Mandala project plan, Workspace notes, and ordinary notes.

## Timeline Milestone Evidence Projection

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-04

Project Overview now has two primary grouping views only: Workspace and Mandala. The obsolete standalone `Timeline 视图` is removed because Timeline milestones are no longer managed as independent Project Overview primaries. A legacy `timeline` grouping request from settings or State Capsules normalizes to Workspace in memory without writeback.

The `Timeline` evidence column remains. During one model build, Project Overview requests one bounded Timeline owner snapshot and attaches matching milestone child evidence to the exact Workspace/Mandala primary group. Each child shows milestone name, date, weekday, time-stage label and range, and exports the same schedule through AI context `pathLabel`.

Virtual milestone identity is `timelineItemId + milestoneId`. Ordering is date -> canonical stage -> name -> milestone id. The existing Timeline item stays as parent/source evidence; the virtual child is read-only, consumes no graph node/edge budget, and cannot enter EVA, relations, comments, Meta capture, drag/manual/first-seen order, settings or business JSON.

Trace: `change-records/2026/2026-08/20260804-timeline-milestone-time-limit-projection.md`.

## Weekly Ordering Metadata Projection

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-05

The existing Mandala and Workspace primary-order snapshots now add `capsuleLevel` and `capsuleLevelRank` while preserving `index`, `groupId`, title, `nodeKey`, and `nodeId`. Project Overview remains the sole owner of the `A -> B -> C -> CZ -> 0` capsule level.

The Mandala snapshot also retains optional `memberNodeKeys/memberNodeIds/memberIdentityConflict` diagnostics for surrounding `group.columns.mandala` evidence. These fields are not managed primary identities and are not authoritative inputs to Mandala goal ordering. The ordering contract is the snapshot entry's own `primaryNodeKey/nodeId`, capsule level and Project Overview index; ordinary member overlap may be diagnosed without invalidating that primary contract.

This additive metadata lets Mandala order weekly summaries without reading Project Overview settings or JSON. It does not change Project Overview's own primary-key Tabs, vertical order, manual order, lifecycle state, or persistence.

Trace: `change-records/2026/2026-08/20260805-weekly-abc-today-wave-order.md`; corrected by `change-records/2026/2026-08/20260805-goal-primary-abc-timeline-order.md`.


## 2026-10-01 Headless weekly ordering provider

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Additive getWorkspacePrimaryOrderSnapshotAsync() obtains the owner model through getPrimaryCollectionProjectionModel('workspace'), independent of opened PEO leaves. Same-mode concurrent requests share the existing in-flight build; the settled result is not a persistent eligibility cache. EVA-unavailable or max-nodes/max-edges models reject. Returned leading-primary/index/capsule rank semantics match the old synchronous getWorkspacePrimaryOrderSnapshot(), which remains unchanged for existing consumers. Mandala weekly project-plan order and collection reads use the same concurrent build. Non-leading group-member rank expansion is not implemented.

User observed order recover after opening PEO (confirmed_by_user); old sync API dependence on live view/last-known order is confirmed_by_code. This supports a readiness explanation but does not prove every historical fallback had this cause. Declaration/Kill ownership and final Mandala eligibility API are unchanged. [Engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-250)（外部来源未随包提供）.


## 2026-10-01 Weekly native performance — approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this reviewed package with “请部署”. Mandala0.1.12, PEO0.1.6 and Hub0.2.6 main.js/manifest.json are installed in the proven NEWERA runtime. Program hashes match reviewed Dev/Mirror candidates. No business JSON/settings/index copied and no plugin reload triggered. Prior ownership and safety contracts remain; native UI/latency acceptance is still pending. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-251)（外部来源未随包提供）.


## 2026-10-21 PEO-TV1：追踪可见性假变化广播（已部署四根，原生验收待做）

- Observation（confirmed_by_user，TV-ATTRIB 探针 204 s）：`context-key-tracking-visibility:changed` 5 次派发全部是假变化——定时器仅因缓存满 30 s（api、来源、providerGeneration、navGeneration 均未变）清空并派发，重算后签名相同又派发；每轮主线程阻塞 2–4 s，即“空闲时周期性卡一下”。新增待办本身未触发。
- 代码事实（confirmed_by_code）：Mandala `providerGeneration` 只在 onload 赋值；事件消费方为 Collection、Workspace、**GTD**（gtd-engine.js 6664，整页重绘）；`isContextKeywordStoppedV1` 另被三者共 13 处使用；`getContextCapsuleKeysSync` 另有 Mandala、State-capsules 调用。
- 设计（v2/v2.1，预审 BLOCK→复审 PASS_WITH_ACTIONS）：过期仍可读（120 s 上限）、后台重算仅在 120 s 内有查询时进行、签名加入主键集合指纹（主键增删改才派发，补回 GTD 刷新）、失败退避保留旧缓存（3 次计数失败才降级）、降级回答后成功必补发；api/来源变化与卸载保持原行为。事件名与 detail 不变，语义收紧为“确实变化/降级/身份变化/卸载”。
- 实现：只改 PEO main.js（newera/dev/mirror d0ebcaeb→bca3959e，daqian 35dd5aa4→026348eb）；单元改后 64/64、改前应失败 44/44；回归两根各 25/25。部署与原生验收待做；部署后再更新 contracts。Trace：`results/context-key-bus-management-20261012/peo-tv1/`。
- 2026-10-21 部署（confirmed_by_code）：用户授权、Obsidian 零进程，四根 4/4 读回一致（newera/dev/mirror 79f3fbea…，大千 5d4a855a…），管理中心存储不变。终审 A1 降级自恢复、A2 PEO 自身读取不补发已含在内。原生效果未验证。变更记录：change-records/2026/2026-10/20261021-193313-project-execution-overview-peo-tv1-tracking-visibility.md。

## 2026-10-21 PEO-TV2：追踪重算复用当前代导航（已部署四根，原生验收待做）

- Observation（confirmed_by_user，TV-VERIFY）：TV1 后卡顿主要来自追踪重算中的主键导航重建（两种分组模式完整总览模型，起始长任务约 3 s）。
- 决定：v1“EVA changed/命名完成→导航失效 + 全局 5 分钟”被预审 BLOCK（失效清空缓存使同步主键读取空、频繁失效构建饥饿、4 条写入口无事件）；改为方案 B：只在追踪重算中复用当前代导航（≤5 分钟），其他调用方 30 s 规则与失效路径不变。事件驱动失效归 SYNC-BUS S3。
- 代价：主键在只靠同步读取的 GTD、state-capsules 中最多晚 5 分钟（含 PEO 自身托管新建、中心改名）；常用布局通常 30 s 级。
- 部署（confirmed_by_code）：四根 4/4（newera/dev/mirror 7fcaa446…，大千 8731706c…），存储不变。Trace：results/context-key-bus-management-20261012/peo-tv2/；变更记录 20261021-213244-project-execution-overview-peo-tv2-nav-reuse.md。
- 2026-10-21 原生与回滚（confirmed_by_user）：TV2 使空闲期后台重算与长任务归零，但导航不再被后台保鲜，新增/新建时当场完整重建（长任务 20 s / 38.9 s），用户感觉更慢，已回滚到 TV1（变更记录 20261021-230345-…-peo-tv2-rollback.md）。refines：减少触发次数只挪动成本；导航重建本身过重是独立问题，见 PLAN SYNC-BUS S1.5。

## 2026-10-22 S1.5-A：EVA 回退外观读实时状态（已部署四根，原生对比待做）

- 事实（confirmed_by_code，预审更正）：EVA 公开 api 不暴露 `searchNodes`，PEO `getOverviewReadSource` 必然回退，旧实现每次总览构建 `clone(evaPlugin.state)` 整份 EVA 状态（37 MB）。
- 改动：回退外观直接读实时状态、每次调用从 state 取表、输出仍 clone；死代码 getEvaForRead 不变。给 EVA 补 searchNodes 会改走实时 api 并截断 5000 节点，另立。
- 部署：四根 4/4（newera/dev/mirror da90f948…，大千 575e6b64…）；部署前原生基线已记录。Trace：results/context-key-bus-management-20261012/s1-5/；变更记录 20261022-005703-…。

### 2026-10-24 自动适配器链补充（r22，confirmed_by_code / refines）

现有候选在初始化合成宿主中，两域创建/中断恢复通过既有通知自动更新目录及四消费者，操作后未调用测试index/sync/refresh。停追恢复和同宿主消费者重挂载通过；屏蔽所有通知则新键不出现。这个证据补足此前强制刷新限制，但仍不是原生按钮、完整DOM或进程重启验证；内容/输入、非追踪资格变化和性能待验。程序保持sealed r21不变。见[r22自动链证据](../../../../REFERENCE_BOUNDARIES.md#ref-252)（外部来源未随包提供），实时排期只看活动PLAN。

### 2026-10-24 保留载体停止分类反例（r23，confirmed_by_code / refines）

目录选项消失与本地保留Tab停止分类是两个验收面。r23合成真实创建/视图方法反例：配置域补入、未进入observed导航的新项目与目标停止后，PEO有效目录移除但停止标签为空；Collection正常条目仍显示，历史入口返回false。不能将r22适配器key列表通过外推为内容历史通过。需以稳定主体+来源+当前停止证据及可信命名补足发布；不以缺项、泛ineligible或复用编号判停止。测试与边界见[r23证据](../../../../REFERENCE_BOUNDARIES.md#ref-253)（外部来源未随包提供）。候选未部署；执行安排仍只在活动PLAN。

### 2026-10-24 配置域停止见证补齐（r24，confirmed_by_code / refines）

r23反例已在仓库候选修复：Mandala从既有稳定观察附加当前主体、声明及明确追踪状态；PEO结合原导航按稳定主体处理停止标签及同名/旧标签冲突。一般资格失败不等于停止；缺版本或缺证据拒绝ready，未来需Mandala+PEO配对部署/回退。两域实际方法组合已验证隐藏、冷发布历史精确定位只读、恢复与陈旧绑定拒写；仅合成服务，不外推全库唯一性或原生性能。见[r24证据](../../../../REFERENCE_BOUNDARIES.md#ref-254)（外部来源未随包提供）。实时安排只在PLAN。

### 2026-10-24 非追踪声明生命周期（r25，confirmed_by_code / refines）

既存legacy主体通过PEO实际评论owner撤销声明时，普通有效目录与四消费者自动撤销旧键；仍active的追踪和保留载体不等于stopped。恢复相同声明后身份/内容/绑定与编辑草稿保持。带创建receipt的对象清空声明被保护拒绝；完整管理中心改名/载体绑定同步不可用单独改评论替代。本证据限合成宿主/方法组合，非原生UI性能；见[r25覆盖](../../../../REFERENCE_BOUNDARIES.md#ref-255)（外部来源未随包提供）。唯一排期仍为PLAN。

### 2026-10-24 管理中心改名事务（r26，confirmed_by_code / refines）

真实Registration/Claim及NamingService事务在合成宿主中完成两域改名和同事务中断恢复：稳定主体/载体保持，关键词投影更新，四消费者目录自动更新。Collection条目/笔记与草稿保留，显式重开后能精确定位；不能推为全部插件二级内容已验。GTD通知触发真实提取hydration回调，完整engine/原生性能未验。未验换绑或替换Tab，未部署。[证据与边界](../../../../REFERENCE_BOUNDARIES.md#ref-256)（外部来源未随包提供）。阶段安排仅见PLAN。

## 2026-10-24 r27实验发布与回退

r27：实验库七程序成组部署完成、113程序磁盘哈希对齐；原生加载/功能/性能仍待验。锁定r24六覆盖+r1其余，共113程序，实际替换项七个，其余106依赖仅核验；本次实验程序前像单独备份，非TV1/S15A旧备份。16项隔离安装/回退/中断/漂移拒绝演练通过，93脚本语法检查通过；独立终审见同目录FINAL-INDEPENDENT.md，不累加为原生性能证据。日常NEWERA程序保持原样，业务JSON/笔记/身份/任务/布局不在部署写集。State Capsules排除、S1.5暂缓。

下一步：实验库冷启动确认basePath与加载能力，按NATIVE-ACCEPTANCE.md验收两域创建/恢复、改名重开、停追历史、输入与各插件二级内容定位，并记录首次创建/恢复的分段耗时。

证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r27-experiment-package/README.md、release-manifest.json；唯一排期state/PLAN.md。

维护判定：updated（仅工程阶段来源链接）；无新ownership、架构或性能claim，不在长期层维护第二套排期。历史阶段快照不被当作实时状态。


## 2026-10-24 r30：主键目录提前续期（confirmed_by_code / corrects+refines，原生待验）

- observation（confirmed_by_user）：r29后Collection/GTD/Workspace周期待核验，就绪→不可点→就绪循环；冷启动准备慢。
- claim（confirmed_by_code）：PEO观察目录的发布截止＝min(构建开始时Mandala追踪凭证截止, 导航缓存截止)；Mandala凭证TTL与续期间隔同为30s且同内容续期不通知，因此目录剩余寿命常只有数秒。旧发布方到期不重建、消费者到期才请求，导航按30s年龄作废使每次刷新冷重建——这是周期待核验的直接机制。r28修的只是guard比较，不是这个机制。
- update（corrects r28/S2对"静默续租"的假设）：发布方须**到期前续期**，且续期只认真实读取/显式刷新需求、须拿到更新的owner凭证、截止须推进；续期不得延长已发布对象或放宽guard。导航复用以epoch/deps/来源观察为键，年龄只作漏事件兜底（300s），显式刷新>30s重建。
- 诊断入口：`app.plugins.plugins['project-execution-overview'].trackingSnapshotHost.diagnostics()`（只记时间/计数/错误码）。
- 边界：仓库/假时钟证据+终审PASS；原生是否消除周期、冷启动首建耗时均pending。[r30证据](../../../../REFERENCE_BOUNDARIES.md#ref-257)（外部来源未随包提供）、[终审](../../../../REFERENCE_BOUNDARIES.md#ref-258)（外部来源未随包提供）。


## 2026-10-25 r31：导航构建阶段与追踪凭证分离（confirmed_by_code + 原生采样 / corrects，原生验收待做）

- observation：r30 后稳态续期正常（confirmed_by_user），但冷启动首个 ready 需 100–260 s，长导航构建"完成即作废"。
- claim（confirmed_by_code + console-bridge 原生）：PEO 主键导航构建＝对每种分组模式完整构建总览（启动期 24–77 s）。r30 及之前，导航阶段沿用构建开始时的 Mandala 凭证 guard，`requestRefresh` 在途检查与构建完成自检要求该凭证未过期，于是超过凭证剩余寿命（0–30 s）的构建必然作废。PEO 写入与窗口事件不是来源。
- update（corrects r28"续期不得延长原截止"在导航阶段的推论）：导航阶段只看导航来源（含 Mandala 修订 epoch 等身份）；导航完成后重新捕获 owner 凭证供证据阶段使用，发布截止仍 ≤ 该凭证截止，不延长任何已发布对象。证据失败但来源未变只重做证据；刷新遇旧导航先复用恢复 ready 再后台重建。
- 诊断：`trackingSnapshotHost.diagnostics()` 中 invalidate 事件含 `scope/source`（health / 事件名 / refresh-flight / nav-source / evidence-guard / deps / write / api / host）。
- 边界：仓库证据 + 终审 PASS（v1 BLOCK 后修复）；冷启动原生收益待验。[r31 证据](../../../../REFERENCE_BOUNDARIES.md#ref-259)（外部来源未随包提供）、[终审](../../../../REFERENCE_BOUNDARIES.md#ref-260)（外部来源未随包提供）。


## 2026-10-25 r32：EVA 适配器刷新中（health pending）与目录可读性（confirmed_by_code / corrects，原生待验）

EVA `registerAdapter`/`refreshAdapterIndex` 在首个 await 前同步 `indexHealth.begin` → `getAdapterIndexHealthV1` 立即 `pending`（revision 不变）。PEO 旧版读取/来源检查要求 EVA ready，因此任何视图（GTD 渲染帧内尤甚）登记适配器都会让已发布目录瞬时不可读；GTD `run()` 结尾 `isCurrent` 失败→横幅+点击拦截→重绘再登记形成循环。r32：读取/来源检查只比较 EVA `[providerGeneration,revision]` 戳，构建门仍要求 ready；revision 变化（语义 finish、首次 settle、issue、unregister、detach、close，前提为从 ready 出发）仍撤销。[r32 证据](../../../../REFERENCE_BOUNDARIES.md#ref-261)（外部来源未随包提供）


## 2026-10-25 r33：创建期间重建风暴与续跑（confirmed_by_code + 原生 ACC-4）

- observation（confirmed_by_user + 原生）：新建主键时卡；项目创建4分08秒、目标约70分钟反复续跑；创建后目录数分钟不可用。
- claim：放大链＝创建写入与 GTD 核验都派发 carrier-changed → PEO 每事件整套重建且作废构建仍跑完 → 与创建步骤争用 → 15s 核验超时 → 续跑全量重验。r33 后：创建期间持写暂停构建、突发失效合并（距上次<1.5s，≤8s）、观察者导航构建阶段检查点中止、写入派生需求、有效目录不被错误覆盖；续跑跳过已验证步骤（写入前复核前驱）、只读核验超时重试；暂停原因附步骤/owner 详情。
- 原生 ACC-4：项目23s、目标约127s、0暂停、创建期间构建0次。导航构建95–232s，耗时集中于 carrier-edges（23–65s/模式）与 external-jumps（14–87s/模式）。剩余：创建结束后 naming-settled 滞后到达致目录约6.5分钟 stale（写入派生需求60s窗口不足）。
- 诊断：`trackingSnapshotHost.diagnostics()` 新增 `nav-stage{stage,ms}`、`error{sub,kept,expired}`、`drop{stage:superseded}`。[r33 证据](../../../../REFERENCE_BOUNDARIES.md#ref-262)（外部来源未随包提供）、[终审](../../../../REFERENCE_BOUNDARIES.md#ref-263)（外部来源未随包提供）。

## r34 写入后需求窗口（2026-10-25，实验库）

- 发布器写入派生需求独立为 postWriteUntil（释放后 300s，不被 refresh 缩短），写入释放参与突发安静期；原生创建后 97s ready（此前约 6.5 分钟）。工程记录 change-records/2026/2026-10/20261025-r34-post-write-demand.md。

## r35 外部跳转阶段（2026-10-25，实验库）

- 外部跳转对 keyword-index `getKeywordNotesForNode` 与 workspace-mount `getBoundNoteForNode` 逐条串行调用（两组并行）；r35 起 provider 内部文本全等复用解析结果，中位 7.7s→1.65s。上游 ok:false 发布 `DIRECTORY_SOURCE_NOT_READY`（暂时性 reason 健康重试）。工程记录 change-records/2026/2026-10/20261025-r35-nav-external-reads.md。

## 日常 NEWERA 已为 r36（2026-10-26，D1）

- 日常库 PEO 等 7 程序已迁移为实验库 r36 字节，keyword-index 为日常适配版+K1；SuperMemo 未动。开发源镜像 `workspaces/26-…/插件` 落后，禁止从其部署到日常库。工程记录 change-records/2026/2026-10/20261026-d1-daily-migration.md。
