# Cross-Plugin Aggregation MapReduce Pipeline

## 2026-10-22 S2-A1a：同批目录与纯读消费边界

source_status: confirmed_by_code（仓库候选和隔离测试）；update: refines；未部署，不代表运行协议。

Collection/Workspace的渲染还会经同步键列表及异步refreshSoon进入旧导航；仅替换逐标签判断不足以关闭重复计算。候选把原nav builder的12字段主键目录与停止状态一起冻结发布，沿用原身份、去重、排序；目录为observed-navigation投影，不是完整注册表、有效项集合或写授权。同编号的不同身份仍独立。

纯消费者每同步frame读一次；目录和标签校验/复制成本仍存在。unknown与未证实停止分开；跨await必须重新验证provider、源、同一快照和租期；冻结Set对象并不能保护其内容，因此Set只封装于闭包。真实UI、生命周期和历史只读fence尚未接线；同内容续租可能不发事件，到期处理需重新读取当前快照，不能由旧timer直接判失效或无条件刷新。

证据：[A1a交付](../../../../REFERENCE_BOUNDARIES.md#ref-026)（外部来源未随包提供）、[独立终审](../../../../REFERENCE_BOUNDARIES.md#ref-027)（外部来源未随包提供）。本节只保留工程证据；阶段次序回到[当前PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-028)（外部来源未随包提供）。


status: active
created: 2026-07-06

## Purpose

status: confirmed_by_user

This page records how the Obsidian plugin system should make cross-plugin aggregation fast without losing source evidence.

The motivating user requirement is: do not rely on arbitrary hard limits, and do not let plugin-to-plugin communication make Obsidian slower. Use a MapReduce-style pipeline where source plugins provide bounded read snapshots and the aggregator performs deterministic merge/projection.

## Prior

status: confirmed_by_memory

The existing framework already says:

- Project Overview is an aggregator and evidence projection layer, not a second owner of Workspace, Mandala, GTD, Collection Card, Keyword, or EVA business data.
- Source plugins own their data and expose narrow read-only or owner-write APIs.
- AI context export and overview model construction already use shard-like internal pipelines.
- Context Capsule carrier snapshots are read-only provider APIs consumed by Project Overview.

Trace:

- `../contracts.md`
- `../api-registry.md`
- `../plugins/project-execution-overview.md`
- `../../change-records/2026/2026-07/20260706-212400-project-overview-context-carrier-fair-limit.md`

## Core Model

status: inferred

Cross-plugin aggregation should be understood as:

```text
provider-owned source data
        ↓ Map
bounded read-only snapshot / count / cursor / identity shard
        ↓
aggregator deterministic reduce
        ↓
dedupe / group / sort / project / diagnose / render / export
```

This is MapReduce-style, not a command to build a generic distributed-computing framework inside Obsidian. The point is to separate source ownership, read boundaries, and deterministic projection.

## Provider Responsibilities

status: confirmed_by_code

Provider plugins should:

- own their business JSON and source records;
- expose narrow read-only snapshot APIs for aggregation;
- make snapshot calls background-safe, with no view activation or reveal side effects;
- return empty result shapes instead of throwing into an aggregator build pipeline when a local carrier is absent;
- prefer indexed lookup by context key, tag id, tab id, note path, or node key instead of repeated full data scans;
- expose count / hasMore / cursor / revision where the result set may be large.

Provider plugins should not:

- let UI filtering semantics leak into provider snapshot semantics;
- open visible leaves, focus tabs, or mutate user state to answer a background read request;
- write aggregator state or another plugin's business JSON.

## Aggregator Responsibilities

status: confirmed_by_memory

Aggregator plugins such as Project Overview should:

- call provider owner APIs instead of reading provider business JSON directly;
- define the current model / selected group / explicit target list as the evidence boundary;
- run independent provider shards with bounded concurrency;
- reduce results deterministically by stable keys such as `contextKey`, `sourcePlugin`, `nodeKey`, path, and source type;
- record diagnostics for unavailable, failed, truncated, stale, or omitted shards;
- degrade to visible missing evidence or duplicate-but-safe evidence rather than hiding source evidence incorrectly.

Aggregator plugins should not:

- use provider-global hard caps as a correctness rule;
- hide evidence just because a provider shard failed;
- parallelize semantic BFS, grouping, or order-sensitive logic without a deterministic reduce boundary;
- directly scan all runtime JSON or vault files as a substitute for source plugin APIs.

## Limit Taxonomy

status: confirmed_by_memory

Limit names must match their semantic unit.

| Limit Type | Meaning | Safe Use |
| --- | --- | --- |
| `per-query` | Maximum records returned by one provider API call. | Protects a single request. |
| `per-target-per-provider` | Maximum records accepted from one provider for one context target. | Fairness unit for same-key carrier inclusion. |
| `per-provider-total diagnostic` | Total records observed or accepted from a provider across targets. | Good for logging; risky as an admission cap. |
| `model-global backstop` | Maximum total nodes / edges / rendered records in the aggregate model. | Last safety guard, not a definition of truth. |
| `visible-first hydration` | Prioritize currently visible or expanded groups before background detail loading. | Improves perceived speed without losing source evidence. |

## Fairness Rule

status: confirmed_by_memory

The 2026-07-06 Project Overview fair-limit fix showed that a provider-global accepted-record cap can starve later Context Capsule Key targets.

Rule:

> Hard limits must attach to the semantic fairness unit. For same-Context-Capsule-Key carrier evidence, that unit is the target key plus provider, not the provider as a whole.

This is confirmed for the current Project Overview context-carrier case. Applying it to every future cross-plugin pipeline remains an inference and should be tested against real cases.

## Performance Strategy

status: inferred

Preferred strategy:

1. Summary first: fetch ids, labels, counts, revision, and status before heavy details.
2. Detail later: hydrate comments, relation neighborhoods, or rich metadata only when needed.
3. Visible first: prioritize the current group or expanded panel before background groups.
4. Provider indexed: ask each owner plugin to maintain its own lookup surface instead of making aggregators scan source JSON.
5. Deterministic reduce: allow shard parallelism, but keep grouping, ordering, and display semantics stable.
6. Revision cache: cache provider snapshots by provider, target context keys, limit, source, summary/detail shape, and cursor-like options; invalidate by provider-owned change events instead of repeating identical cross-plugin calls.
7. Event invalidation: provider change events should be debounced and lightweight. They are dirty hints, not source data or direct rebuild commands. A visible consumer may use them to schedule one bounded owner-API projection probe and rebuild only when complete evidence changed or remained uncertain; hidden/closed consumers do no scheduled work.
8. Fail soft: show diagnostics and missing evidence states; avoid silent hiding.
9. Measure before tightening: console diagnostics, shard statuses, counts, timings, and user-observed slowness should guide limits.

## Provider Snapshot Contract Roadmap

status: inferred
updated: 2026-07-07

The next system-level direction is to treat provider snapshots as a contract family across Workspace, GTD, Collection Card, Mandala, Keyword, and future providers.

This roadmap should not be read as a runtime implementation claim. The currently confirmed concrete subtype is Context Capsule carrier snapshots from Workspace Mount, Collection Card View, and GTD. Mandala and Keyword should be evaluated as domain subtypes before any API is added.

Phases:

1. Contract vocabulary: document shared summary-first / detail-on-demand / owner-API / bounded-read rules, with core envelope fields separated from subtype fields.
2. Contract sentinel: add lightweight diagnostics or tests that verify provider snapshots do not fall back to full-corpus scans, view activation, persistent index JSON, or provider-global starvation.
3. Cursor background hydration: when a provider reports `hasMore`, schedule cursor follow-up only for visible or explicitly expanded targets first.
4. Domain subtype design: decide which Mandala and Keyword domains deserve snapshot APIs, and which should remain jump/reveal or UI-only.
5. Virtual rendering / visible-first scheduling: keep large aggregate models possible while rendering only the visible window and hydrating nearby details.
6. Workerized reduce: consider only if profiling shows deterministic reduce CPU, not provider reads or DOM rendering, remains the bottleneck.

Promotion gates:

- Do not implement a new provider snapshot subtype until the owner plugin's domain boundary is named.
- Do not add a new first-render provider call unless it can return summary-only data and bounded diagnostics.
- Do not add background hydration until visible-first scheduling and cancellation / staleness behavior are specified.
- Do not use the shared vocabulary to justify direct business JSON reads by aggregators.

Contract-family field guidance:

- Core envelope: `ok`, `pluginId/providerId`, `source`, `snapshotType`, `items`, `targets`, `totalCount`, `returnedCount/count`, `limit`, `hasMore`, `cursor/nextCursor`, `revision`, `timingMs`, `indexVersion`, `fromIndex`, `reason`, `diagnostics`.
- Subtype fields: `contextKey`, `contextKeys`, `targetType`, `targetKey`, `nodeKey`, `nodeKeys`, `sourceType`, `order`, `orderPath`, `detailLevel`, `includeChildren`, or other provider-domain fields.
- Bulk target responses: use `targets[normalizedTargetKey]` buckets as the semantic source for reduce; top-level `items/count` are compatibility or diagnostics.
- Opaque cursors and revisions: consumers may cache or request follow-up by them, but must not parse them as stable business identity.

Performance guard:

- The contract family must reduce load by allowing summaries, caches, target buckets, and visible-first hydration. It must not increase load by asking every provider for every detail on first render.
- No provider-global hard cap may become the truth boundary for a multi-target aggregation.
- No consumer may use the unified contract vocabulary as permission to read another plugin's business JSON.

## Anti-Patterns

status: confirmed_by_memory

- Full repository, full vault, full runtime, or full business JSON scan during ordinary render.
- Provider snapshot API that activates a visible view just to read data.
- Empty local carrier matching turning into full-corpus fallback.
- Provider-global cap that silently excludes later targets.
- Limit names that hide their fairness unit.
- Parallelism that changes user-visible order or grouping.
- "Optimization" that makes the aggregator a second owner of source plugin data.
- Treating a contract family as a forced universal method name.
- Treating `cursor`, `nextCursor`, or `revision` as parseable business identity without a versioned contract.
- Marking Mandala or Keyword snapshot APIs as implemented before code/runtime evidence exists.

## Current Evidence

status: confirmed_by_memory

Observed and recorded cases:

- GTD empty-match guard: no matched local tag must return an empty snapshot, not 200 full-corpus items.
- Provider snapshot no-focus rule: background aggregation must not bounce between GTD and Collection views.
- Project Overview context-carrier fair limit: provider-global 80 cap starved later Workspace carrier targets; fixed by per-target-per-provider admission.
- Project Overview build-model shards: shard scaffold may parallelize source reads, but deterministic start records, bounded graph expansion, suppression, grouping, and timeline post-processing remain reduce boundaries.
- Provider summary/no-activate slice: Workspace Mount, GTD, and Collection Card preserve the old snapshot API while returning count/cursor/has-more/revision/timing metadata; Workspace Mount can answer the no-open-view case through provider-owned data read without activating its view.
- Provider-side indexing slice: Workspace Mount, Collection Card View, and GTD now accept bulk `contextKeys` snapshot requests and return per-target `targets` buckets from in-memory provider-owned indexes; Project Overview first tries one bulk call per provider and falls back to old per-target calls when a provider does not return `targets`.
- Next-step roadmap card: after provider indexing, continue with contract sentinels, cursor-based background hydration, visible-first scheduling, virtual rendering, and only later workerized reduce if profiling still shows CPU bottleneck.
- Project Overview render-continuity Phase 1: before full virtual rendering or eager background hydration, preserve perceived continuity by building the next root off-DOM, swapping only when ready, marking retained old UI busy, gating performance diagnostics behind `window.__PEO_PERF_DIAG === true`, and throttling non-forced link redraw while keeping final forced redraws after render, scroll stop, and reveal.
- Cross-plugin snapshot cache / invalidation Phase 1: Project Overview caches Context Capsule carrier snapshot responses at the aggregator boundary, keyed by provider and request shape; Workspace Mount, Collection Card View, and GTD emit debounced `context-capsule-carrier:changed` events after owner writes; Project Overview invalidates matching cache entries only and does not auto-rebuild. GTD carrier revision was upgraded from note-path-only to a lightweight data signature based on current note path, active item counts, tag count, keyword count, keyword `updatedAt`, and max item stamp.
- Project Overview carrier auto-refresh Phase 2B1: after cache invalidation, visible leaves coalesce dirty events and compare complete owner-API carrier projections before deciding whether a latest-wins full refresh is necessary. Equal complete projections produce zero builds/renders; hidden/closed leaves produce zero timers/probes; failure or incomplete evidence retains the old model and remains dirty/retryable. Runtime/dev/mirror code is synchronized; actual Obsidian interaction smoke remains pending.
- Provider Snapshot Contract Family rule: current provider optimization lessons should be generalized as protocol vocabulary and roadmap first, while keeping Mandala and Keyword as domain subtype candidates rather than forcing them into the Context Capsule carrier API name.
- Effective-goal carrier batch slice: PEO now reduces one bounded EVA outbound-relation batch and one bounded GTD top-level-carrier batch instead of building the global PEO graph or asking PEO once per GTD label. Provider revisions are request-scoped, GTD engines carry a DOM-live lease, and stale/malformed/non-singular evidence fails closed. This is a concrete owner-API Map/Reduce subtype, not permission for consumers to read EVA/GTD JSON directly.

Trace:

- `../../change-records/2026/2026-07/20260706-205211-gtd-context-carrier-empty-match-guard.md`
- `../../change-records/2026/2026-07/20260706-191200-provider-snapshot-no-focus.md`
- `../../change-records/2026/2026-07/20260706-212400-project-overview-context-carrier-fair-limit.md`
- `../../change-records/2026/2026-07/20260707-001800-provider-carrier-summary-no-activate.md`
- `../../change-records/2026/2026-07/20260707-012323-project-overview-provider-indexing.md`
- `../../change-records/2026/2026-07/20260707-172050-project-overview-render-continuity-phase1.md`
- `../../change-records/2026/2026-07/20260707-201141-cross-plugin-snapshot-cache-invalidation.md`
- `../../change-records/2026/2026-07/20260707-204658-provider-snapshot-contract-family.md`
- `../../change-records/2026/2026-07/20260707-205800-provider-snapshot-contract-adoption-gates.md`
- `../../change-records/2026/2026-07/20260715-163048-project-overview-phase2b1-carrier-auto-refresh.md`
- `../../cards/2026-07-07-project-overview-indexing-next-steps.md`
- `../plugins/project-execution-overview.md`

## Open Questions

status: active

- Should the count/cursor/has-more metadata from provider snapshot APIs become a formal versioned contract with pagination resume semantics, or remain a backward-compatible convention?
- Should Project Overview add a carrier-specific model-global backstop such as `maxCarrierRecords` while preserving per-target fairness?
- Which provider indexes are worth materializing first: Context Capsule Key, Workspace source note path, tag keyword, Collection Card tab keyword, or EVA node key?
- How should background hydration report progress without creating UI noise?
- Which diagnostics should graduate into automated regression sentinels?
- Which Mandala and Keyword domains should become provider snapshot subtypes without flattening their planning and symbolic-topology ownership?

## 2026-10-22 修订号与纯读的证据边界（FW-027）

source_status: confirmed_by_code（限定仓库候选与冻结baseline），update: refines。

- owner仍持有业务数据；聚合器读取有来源和版本的证据，consumer按一轮render取一次内存快照。读取不可隐式调度重建；显式刷新负责合并请求。版本不是业务身份。
- 服务实例generation、来源scope和内容revision不同。raw文件指纹可用于比较证据，但ready不是schema合法、追踪有效或CAS写许可；过期需显式stale。
- 安全写可能在target发布后reject，失效与读回不能只放success分支；早return Promise也须settled后释放写入屏障。同一物理文件跨scope、service重新注册不能丢在途写。
- 阶段证据：A0/A1为已独立验证的隔离模块，A2为真实Mandala源码仓库staging；运行接口与消费者未部署，端到端性能unknown。定时内容指纹有磁盘/哈希成本，不能称零成本版本服务。

Trace：[A1终审](../../../../REFERENCE_BOUNDARIES.md#ref-029)（外部来源未随包提供）、[A2预审](../../../../REFERENCE_BOUNDARIES.md#ref-030)（外部来源未随包提供）、[导航依赖](../../../../REFERENCE_BOUNDARIES.md#ref-031)（外部来源未随包提供）。这些边界细化既有Map/Reduce，不改变内容ownership或历史回看语义。


## 2026-10-22 A3 发布边界补证（FW-027）

status: confirmed_by_code；update: refines；范围仅仓库候选。复用旧聚合器时必须检查隐藏的反向查询：本例载体目标收集会通过sync key getter触发旧ensure。以一次构建捕获的只读别名显式贯通所有支路，不能跨await临时替换方法/全局suppress。发布之前将外来结果复制为普通值再核验epoch，避免Array species/iterator在最终guard之后重入。

纯读快照≠廉价producer，也≠全部owner强一致。A3依旧完整构建导航/回退clone，实际API及fallback表引用变化可检出，原地变化/外部磁盘变化仍受事件与有限租期约束。捕获实际getter解析结果，不假定每种provider都是window优先。未知、过期、空证据严格区分；owner指纹ready仍必须结合schema与业务证据。当前[候选与验证](../../../../REFERENCE_BOUNDARIES.md#ref-032)（外部来源未随包提供）未部署；所有owner闭包与原生性能仍open。


## 2026-10-22 S2-A1b Collection 候选证据

- observation：Collection实际view的同步键目录/逐标签读取及渲染内refreshSoon会走旧导航；本批将其接入A1a同批快照并与生命周期需求调度分开。
- claim / source status：仓库源码候选与方法级模拟DOM/时钟测试支持“该view每同步render一份快照，旧查询计数0”；未部署，不是原生性能结论，也未提升运行协议登记。
- update target / Bayesian label：**refines FW-027 / BUS-U02**。查询纯读还须配合unknown保留画面、输入保留、加载隔离和跨await跳转复核；“不清DOM”同时要求保存期间禁用原输入控件。弹窗关闭早于其调用方业务完成，不能据此自动换源。
- trace：`results/context-key-bus-management-20261012/sync-bus-r/s2-a1b/PREFLIGHT.md`、`main.diff`、`test-results.json`、`verifier-final-extra.cjs`；本批独立终审PASS，见同目录 `FINAL.md`；仍仅仓库候选。唯一执行次序以 `state/PLAN.md` 为准。
- 未关闭：Workspace/GTD/九宫格/State Capsules真实接线；全owner内容版本/漏事件；原生输入、滚动、历史跨插件跳转及创建首次/恢复耗时。30秒lease fallback仍可能构建完整导航，底层flight不支持取消；并非空闲零计算。
