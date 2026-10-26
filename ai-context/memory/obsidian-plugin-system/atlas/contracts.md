# Cross-Plugin Contracts

status: draft_mvp
updated: 2026-07-09

## Contract Rule

status: confirmed_by_memory

If a plugin exposes identity, jump, sorting, or data ownership behavior used by another plugin, treat it as a contract. Do not change it silently.

Important contract types:

- global API method;
- `nodeKey` shape;
- JSON schema key;
- command id;
- DOM/data selector used for reveal;
- console event used as diagnostic sentinel;
- ordering snapshot;
- read-only export shape.

## EVA openNode Contract

status: confirmed_by_memory

Cross-plugin jumps should prefer:

```js
await eva.openNode(nodeKey)
```

Provider-specific APIs are fallback paths. Consumers should not guess provider DOM or copy provider reveal logic.

Known consumers:

- project-execution-overview;
- daily-note-review;
- mandala-time-blocks in relation workflows;
- keyword-index-plugin for keyword node identity.

## Project Overview as Aggregator

status: confirmed_by_memory

Project Overview may:

- render grouped evidence;
- manage Context Capsule Key identity fields (`contextKeyId`, address, canonical label, color, icon);
- provide project/goal order snapshots;
- call source plugin read-only APIs;
- copy a current-model AI context packet;
- open source plugin nodes through EVA or provider APIs.

Project Overview should not:

- directly write Mandala weekly tracking JSON;
- directly write keyword index JSON;
- directly write workspace mount business JSON;
- expand EVA graph beyond bounded preview without explicit limits.

## Provider Snapshot Contract Family

status: inferred
updated: 2026-07-07

When a plugin provides data for another plugin's aggregation, export, coaching, or overview surface, prefer a provider-owned snapshot contract family instead of direct business JSON access.

This family unifies protocol principles, not method names. Each plugin may expose domain-specific snapshot subtypes; do not force Mandala, Keyword, or future providers to implement `getContextCapsuleCarrierSnapshot()` unless that exact Context Capsule carrier domain applies.

Core rule:

- Summary first: return stable identity, labels, source type, counts, status, and revision before expensive details.
- Detail on demand: hydrate comments, long text, relation neighborhoods, rich metadata, or heavy child trees only when the consumer explicitly asks or the UI makes that region visible.
- Owner API only: consumers and aggregators call the source plugin's read-only API. They must not read, repair, normalize, or migrate source business JSON.
- Bounded by request shape: snapshots must respect explicit target keys, limits, cursor-like options, detail level, and include/exclude flags.
- Empty shape on miss: absence of a local carrier or target should return an empty compatible response, not a full-corpus fallback.
- Deterministic reduce: aggregators may run independent provider reads in parallel, but grouping, ordering, de-duplication, and display semantics must reduce by stable keys.

Contract layers:

1. Identity / list snapshot: returns minimal `nodeKey`, label, source plugin/type, order/order path, count, and revision-like metadata.
2. Summary snapshot: returns lightweight `items` and optionally target buckets for one or more requested targets.
3. Detail hydration: returns heavier detail for known item keys, visible groups, or explicit user requests.

Core envelope fields may include:

- `ok`;
- `pluginId` or `providerId`;
- `source` and `snapshotType`;
- `items`;
- `targets`;
- `totalCount`;
- `returnedCount` or `count`;
- `limit`;
- `hasMore`;
- `cursor` or `nextCursor`;
- `revision`;
- `timingMs`;
- `indexVersion`;
- `fromIndex`;
- `reason`;
- `diagnostics`.

Subtype fields are chosen by domain. Examples include `contextKey`, `contextKeys`, `targetType`, `targetKey`, `nodeKey`, `nodeKeys`, `sourceType`, `order`, `orderPath`, `detailLevel`, and `includeChildren`. These are not all mandatory for every provider.

Bulk snapshot rule:

- Bulk responses should preserve semantic ownership by returning `targets[normalizedTargetKey]` buckets when more than one target is requested.
- Each bucket should preserve the old single-target response shape where possible.
- Top-level `items/count` in a bulk response are compatibility or diagnostics fields only; aggregators should consume bucketed `targets` for semantic归属 when present.

Cursor and revision rule:

- `cursor`, `nextCursor`, and `revision` are opaque provider-owned values unless a separate versioned pagination contract says otherwise.
- Consumers may use them for cache keys, stale detection, and follow-up requests, but must not parse them as business identity.

Performance and invalidation boundary:

- Snapshot calls must not activate provider views, reveal leaves, move focus, or start UI workflows.
- Provider-side indexes for this family should be in-memory / runtime-derived from owner data. They must not create persistent index JSON unless a separate owner-owned storage contract is approved.
- Provider change events are cache invalidation signals only. They must not command automatic overview rebuild, eager hydration, provider view activation, or cross-plugin writes.
- Snapshot contracts should expose diagnostics for truncation, stale caches, unavailable providers, or unsupported detail levels rather than silently hiding evidence.
- If a descriptor label is a live projection of another owner, its provider revision/cursor digest must include the final stable-key-to-label projection. A rename therefore invalidates old pagination without turning the label into identity.
- Global refresh must invalidate consumer-local descriptor snapshots before the provider is reread. A generation token must prevent an older in-flight snapshot from repopulating cache after invalidation.
- Cross-plugin label enrichment is owner-identity-source-bound and non-activating. Consumers derive the allowed provider source-note set from the stable owner identities being described, not from an aggregator/Mandala document scope; they reject labels outside that set and treat an explicit empty set as admitting none. They may read an already-open matching provider view, but must not activate a hidden view solely to obtain a display name.

Known subtype:

- `Context Capsule Carrier Snapshot Contract` is the confirmed-by-code subtype currently implemented by Workspace Mount, Collection Card View, and GTD.

Candidate future subtypes:

- Mandala planning / daily / weekly / goal-execution summary snapshots.
- Keyword symbolic entrance / keyword-note / drawer topology snapshots.

Partial confirmed subtype:

- Timeline-Mandala planning milestone bridge. Mandala now exports planning targets for Timeline import, while Timeline owns imported items and milestone snapshots.

These candidate subtypes are roadmap items, not current runtime facts.

Adoption gate:

- First document the domain subtype and owner boundary in this file and `api-registry.md`.
- Then add a narrow provider API that can return summary rows without activating views or hydrating long text.
- Then add diagnostics / sentinels for empty-match behavior, target bucket ownership, opaque cursors, and cache invalidation.
- Only after runtime or code evidence exists may the concrete API be marked `confirmed_by_code`.

## Timeline-Mandala Planning Milestone Bridge Contract

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-04

Timeline Planner may import Mandala goal/project planning targets as schedulable Timeline items, and Mandala may project Timeline milestone安排 back into daily lessons and weekly tracking through read-only chips.

Ownership:

- Mandala Time Blocks owns goal nodes, project/workspace planning rows, daily lessons, weekly tracking rows, and their business JSON.
- Timeline Planner owns Timeline items, day-block matrix placement, milestones, and `Timeline_Data.json`.
- Mandala must not directly write Timeline item or milestone JSON.
- Timeline must not directly write Mandala daily lesson or weekly tracking JSON.

Known APIs:

```js
await window.__mandalaTimeBlocksPluginApi.listTimelinePlanningTargets(options)
await window.__mandalaTimeBlocksPluginApi.openWeeklyTrackingDashboard(nodeRef, options)
await window.__timelinePlannerPluginApi.importMandalaPlanningTargets(options)
await window.__timelinePlannerPluginApi.ensureExternalItems(items, options)
await window.__timelinePlannerPluginApi.getPlanningMilestoneSnapshot(options)
await window.__timelinePlannerPluginApi.renderEmbeddedTimeline(container, options)
await window.__mandalaTimeBlocksPluginApi.getTimelinePlanningMilestones(options)
```

Boundary:

- `listTimelinePlanningTargets()` is Mandala read-only export. It may summarize goal/project plan rows and labels, but it does not create Timeline records.
- `openWeeklyTrackingDashboard()` is a Mandala-owned jump API. Timeline may expose `打开周追踪` only for imported Mandala items with a valid stable `externalSource` identity: goals use their raw Mandala node id and projects use a complete Workspace `jump:v1` node key. The consumer resolves `sourceKey || sourceId`, never a display title. Timeline passes `readOnlyNavigation: true`, so the initial owner render must not implicitly create a missing weekly row or perform fallback writes; Mandala may still flush already-edited Mandala drafts to prevent user-input loss, and later explicit edit/save/add/stop actions retain normal owner-write behavior.
- `importMandalaPlanningTargets()` and `ensureExternalItems()` are Timeline owner-write APIs. They may create or update Timeline items with an `externalSource` identity for Mandala targets.
- `getPlanningMilestoneSnapshot()` is Timeline read-only export. It returns milestone rows only for Timeline items whose `externalSource.sourcePlugin` is Mandala. Rows carry strict date, weekday, canonical seven-stage id/label/range/order and stable Timeline-item/milestone identity. Ordering is date -> stage -> milestone name -> milestone id; missing or unknown stages sort after all seven stages for the same date.
- `renderEmbeddedTimeline()` is a Timeline-owned embedded-view API. Mandala may pass `viewMode` (`dayblock` / `wave`) and `sourceFilter` (`all` / `project` / `goal`) and provide a host container, but Timeline remains the owner of rendering, interactions, time blocks, milestones, and Timeline JSON writes.
- Mandala UI projection is read-only. Daily/weekly chips may include item and milestone names. In `项目执行计划`, the Timeline projection appears inside `关键里程碑+日期` for the exact Workspace primary while preserving the existing editable legacy textarea beneath it.
- Project Overview is an additional read-only consumer. It projects Timeline-owned milestones into the retained `Timeline` evidence column of matching Workspace/Mandala primary-key groups. These derived child records do not enter EVA, comments, Meta capture, relation editing, drag/manual/first-seen order, Project Overview settings, or source business JSON.
- Project Overview no longer exposes a standalone `Timeline 视图`; current grouping modes are Workspace and Mandala. Legacy settings or State Capsule requests for `timeline` normalize in memory to Workspace without rewriting saved state. The `Timeline` evidence column remains because time-limit evidence still belongs around each primary key.
- Timeline unavailable or no matching milestones should degrade to empty compatible shapes, not throw into Mandala render or create fallback writes.

Trace:

- `api-registry.md`
- `change-records/2026/2026-07/20260709-201500-timeline-mandala-milestone-bridge.md`

## Mandala-Timeline Tracking Exit And History Contract

status: runtime_synced_user_verified
updated: 2026-07-25

Mandala owns tracking lifecycle and observation-bounded weekly rosters. Timeline owns raw Timeline items, day-slot placement, milestones, and the non-destructive projection used to display Mandala-owned lifecycle boundaries.

Owner and consumer direction:

- Mandala persists stable goal/Workspace identities, weekly roster capture metadata, historical titles, `status`, `stoppedAt`, and `resumedAt` in Mandala-owned data.
- `listTimelinePlanningTargets({ includeStopped: true })` is the authoritative read path for Timeline lifecycle hydration.
- `mandala-time-blocks:tracking-lifecycle-changed` is a lightweight dirty event emitted only after a successful Mandala save.
- Timeline coalesces event bursts, invalidates its lifecycle snapshot, rereads the Mandala owner API, and refreshes connected standalone/embedded surfaces. The event payload is not source data.

Historical and projection boundary:

1. Stable owner IDs connect the same entity across weeks; historical labels and judgments stay with the old slice.
2. Stopping in week W keeps W visible as a closeout week. Later weeks exclude the stopped entity from active candidates unless it is resumed.
3. Timeline includes the local stop date, then filters later effective item range, `daySlots`, and milestones from cloned render data.
4. Timeline raw history is not truncated by projection. Edit flows reload the raw item and merge only the explicit editable-field whitelist.
5. Active imported Mandala items may roll their open planning horizon; stopped items do not roll forward.
6. Legacy weeks without complete owner capture remain partial and must not be fabricated from the current active roster.
7. No polling, hidden Workspace activation, cross-owner JSON write, or display-name identity fallback is permitted.
8. `目标执行计划` and `项目执行计划` are current projections, so currently stopped identities leave those surfaces immediately; their stored plan rows are retained.
9. Historical goal/project weekly summaries retain captured identities and separately expose stop-week closeout, current stopped state, and Project Overview Kill evidence.
10. Project Overview Kill can hide a current plan row only from a successful fresh lifecycle snapshot. Stale cached Kill state after a failed read is badge evidence, not an authoritative removal decision.
11. Current owner absence can hide a plan row only when Mandala or Workspace supplies a fresh, structurally complete owner snapshot. Missing, failed, malformed, partial, or stale evidence fails open.

Trace:

- `api-registry.md`
- `plugins/mandala-time-blocks.md#historical-roster-and-tracking-exit`
- `workflows/planning-record-execute-review.md#observation-bounded-temporal-history`
- `change-records/2026/2026-07/20260724-001800-mandala-timeline-observation-history.md`

## Context Key Center Authority Contract（主键管理中心权威契约）

status: deployed_native_partially_accepted
updated: 2026-10-20
source_status: confirmed_by_code（已部署代码）+ confirmed_by_user（005A/036G001 改名、v6 升级、012F 首次替换的原生验收）

- **权威划分**：中心（`context-key-manager`）是已接管对象的**身份、名称和绑定关系**的唯一权威。各插件仍拥有自己的**内容数据**和**最终写入器**。在切换点之后，同一字段只有一个写入方；旧入口要么转调中心，要么拒绝，不允许双写两份权威。
- **写前核验**：参与插件写入受管字段之前，必须用 `getNamingProjectionAuthorityV1()` 取得快照并完成核验，核验对象包括归属、pending、存储/绑定格式。快照不可用或格式不认识时，拒绝写入，并保留输入草稿。
- **回执字段**：中心协调写入的回执字段（`centerNamingProjectionV1`、`centerBindingReceiptsV1`）不得被普通保存改动；回执必须由中心的状态证明（anchor / pending / 墓碑）。
- **格式升级**：存储帧版本与绑定格式只能由用户在中心入口显式升级。旧版代码遇到新格式时必须拒绝，不能猜测；新旧插件不得混合部署。
- **通知事件**：中心作业结束且锁释放后，派发 `context-key-manager:naming-settled-v1`；消费者据此从已提交的文件刷新，不得在锁内读取半成品。
- **完整接口与当前范围**：见 [plugins/context-key-manager.md](plugins/context-key-manager.md)。追踪（P2-D）、创建（P2-E）尚未移交，仍按原契约执行。

## Effective Operational Context Key Contract

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-09-02
source_status: confirmed_by_user_and_code

`Effective Operational Context Key / 有效操作上下文主键` is a domain-specific current-eligibility projection, not a new identity or lifecycle owner.

Project eligibility is the exact intersection of:

1. a current root carrier in Workspace Mount `项目清单和执行待办事项汇总`;
2. one complete Project Overview comment declaration;
3. exactly one current declaration (since 2026-10-13 `tracking-only-v2`, number prefixes such as `9XX` no longer archive a declaration);
4. an existing, non-stopped Mandala project tracking plan.

Legacy Project Overview Kill is retained as historical diagnostics only; since the 2026-10-13 `tracking-only` policy it no longer vetoes eligibility. Stop/resume tracking is the only active lifecycle switch.

Goal eligibility is the exact intersection of:

1. an existing exact Mandala stable node owner;
2. exactly one forward EVA `承载` edge from that Mandala primary to a GTD node whose owner-provided structure says `Type=project`, `Top Level=true`, and empty `Parent ID`;
3. one complete Project Overview comment declaration with exactly one current key (no `9XX` archive semantics since `tracking-only-v2`);
4. an existing, non-stopped Mandala goal tracking plan (legacy Kill: diagnostics only).

A standalone Mandala node, title/path-equal GTD node, reverse relation, ordinary relation, GTD child, missing structural metadata, missing carrier or ambiguous carrier is not a valid goal primary.

Known APIs:

```js
await window.__workspaceMountPluginApi.getProjectOverviewWorkspaceEntrySnapshotV2(options)
await window.__projectExecutionOverviewPluginApi.getWorkspaceOperationalContextKeySnapshot(options)
await window.__projectExecutionOverviewPluginApi.getMandalaOperationalContextKeySnapshot(options)
await window.__evaCrossViewRelationsPluginApi.getOutgoingRelationBatchSnapshot(options)
await window.__gtdTaskManagerPluginApi.getContextCapsuleTopLevelProjectCarrierBatchSnapshot(options)
await window.__mandalaTimeBlocksPluginApi.listEffectiveOperationalContextKeys(options)
await window.__mandalaTimeBlocksPluginApi.listEffectiveGoalOperationalContextKeys(options)
```

Provider and transaction boundary:

- Workspace Mount owns the current carrier and complete Workspace `jump:v1` target identity. Its snapshot is a bounded direct data read or an already-loaded view read; it must not activate a hidden leaf.
- Project Overview owns comment declaration parsing, Context Capsule descriptor metadata, legacy Kill diagnostics (since 2026-10-13 numeric prefixes such as `9XX` carry no lifecycle meaning). Each retained comment-block occurrence receives a deterministic owner/keyword/occurrence evidence ID, so two distinct declaration occurrences are counted separately even when display text and address match. This `declarationEvidenceId` is cardinality evidence only; it never replaces the logical `contextKeyId` derived from the Context Capsule Key itself. It returns no comment body and writes no source data.
- EVA owns exact outbound relation cardinality and exposes one bounded batch snapshot for the requested Mandala owners and exact relation type. The revision covers only the request scope and matching outbound evidence; reverse, ordinary and unrelated relations neither enter the count nor churn the scoped revision.
- GTD owns Context Capsule tag resolution and active top-level project structure. Its dedicated batch snapshot performs one owner-local index pass, returns exact tag/project cardinality and a unique project only when both are singular, and requires a live matching GTD source host. A detached/stale engine fails closed and must not be invoked.
- Project Overview owns the deterministic reduction: direct comment/Kill evidence + one EVA batch + one GTD batch. It validates the complete envelopes with strict raw types, validates `uniqueItem` against the diagnostic sample, and never builds the global Project Overview graph merely to prove target eligibility.
- Mandala owns project/goal tracking lifecycle and publishes separate final v1 aggregates. Goal evidence preserves Mandala stable identity and consumes Project Overview's bounded owner-API reduction rather than recomputing cross-owner data.
- Each upstream step is limited to 2 seconds, the whole transaction to 5 seconds, and one snapshot to 500 targets. Missing, failed, malformed, incomplete, truncated, over-limit, stale-host or inconsistent evidence fails closed with diagnostics. Global PEO graph caps are no longer part of target carrier proof because the proof reads only the requested owner scope.
- The full Workspace `jump:v1` key remains project identity; the full Mandala `jump:v1` key remains goal identity. Context descriptor, GTD carrier, path label, historical declaration and Timeline title remain metadata/evidence.
- Workspace owns the source note encoded in that `jump:v1` key. Mandala must not pass its own `九宫格目标.md` path as a Workspace identity scope; it first accepts Workspace's canonical snapshot sourceNotePath, then forwards that exact scope and the full owner keys to Project Overview.
- No provider or consumer may grant eligibility from title matching, retained rows, Timeline presence, old caches, direct cross-owner JSON reads, polling or full-vault scans.

Consumer boundary:

- Ontology's dedicated effective family projects both final domain snapshots, including empty-content owners; retained project/goal documents remain available through their historical families.
- Temporal Framework and Next Action Workbench require complete project and goal snapshots for a combined new-candidate set. Either domain failing closes the batch; provider failure remains a lifecycle-refresh no-op for existing Next Action memberships.
- Timeline Planner admits both project and goal forward allocation from their final snapshots. Its boundary validates the same complete envelope as Temporal/Next: bounded counts/limit, valid generation/time, equal non-empty source scope/path, diagnostics array, per-target stable identity/aliases, and `evidenceRevision === snapshot.revision`. `totalCount` may exceed `count` because it records all inspected upstream owners, but it may never be smaller and must fit the declared limit. Retained Timeline data is history only, stays read-only when ineligible and cannot authorize current eligibility.

Compatibility:

- no business JSON schema migration or restore-time writeback;
- Project Overview may enrich an exact standalone address declaration such as `036G001A` with a non-empty `contextKey.address`, but must preserve its existing label-derived `contextKeyId`; structured `address - label` identity derivation is unchanged, ordinary labels remain addressless, and standalone `9XX` declarations remain historical;
- no deletion of stopped/Killed/source-missing Ontology, Temporal, Next Action or Timeline history;
- consumer equality is checked by revisioned stable identities, never by a fixed expected count;
- detailed semantics and the current read-only audit live in `knowledge/effective-operational-context-key.md`.

## Context Capsule Carrier Snapshot Contract

status: confirmed_by_code
updated: 2026-07-07

Project Overview may derive same-Context-Capsule-Key carrier evidence by calling source plugin read-only snapshot APIs during overview model construction. This is a derived display/evidence edge, not an EVA manual relation and not a source-plugin data migration.

Known provider APIs:

```js
await window.__workspaceMountPluginApi.getContextCapsuleCarrierSnapshot(options)
await window.__collectionCardViewPluginApi.getContextCapsuleCarrierSnapshot(options)
await window.__gtdTaskManagerPluginApi.getContextCapsuleCarrierSnapshot(options)
```

Boundary:

- Workspace Mount, Collection Card View, and GTD own their source records and snapshot logic.
- Project Overview owns the derived overview model, diagnostics, de-duplication, and column projection.
- EVA remains the owner of explicit manual relations; default same-key carrier evidence must not be written into EVA as a fake relation.
- Provider APIs should return bounded snapshots and should fail with an empty `items` shape rather than throwing into Project Overview's build pipeline.
- Provider snapshot APIs are background read APIs. They must not call visible view activation / reveal flows such as `activateView()`, `setViewState(... active: true)`, or `revealLeaf()` just to answer Project Overview's model-build request.
- Provider snapshot limits are protection valves, not truth boundaries. For same-key carrier inclusion, the fairness unit is the Context Capsule Key target, not the provider as a whole; provider-global hard caps can create order-dependent starvation.
- Provider snapshots should preserve the old `items` return shape while also returning lightweight metadata: `totalCount`, `returnedCount`, `count`, `limit`, `hasMore`, `cursor`, `revision`, and `timingMs`. This lets Project Overview know that more source evidence exists without forcing full hydration during the first render.
- Provider snapshots may accept `contextKeys` for bulk requests. Bulk responses must keep per-target ownership and fairness by returning `targets[normalizedContextKey]` buckets, where each bucket preserves the old snapshot shape. Top-level `items/count` in a bulk response are diagnostics only; Project Overview must consume the bucketed `targets` for semantic归属 and fall back to old per-target calls when `targets` is missing.
- Provider-side indexing for this contract is in-memory / runtime-derived from the provider's own loaded or data-read source structures. It must not create persistent index JSON and must not migrate business JSON.
- A provider-owned data-read fallback is allowed when it prevents view activation, but the aggregator must still call the owner API rather than reading the provider's business JSON directly.
- Cross-plugin aggregation performance rules are maintained in `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md`.

Cache / invalidation rule:

- Aggregators may cache provider snapshot responses by `providerId`, normalized sorted context keys, `limit`, `source`, `summaryOnly`, and any shape-changing options such as `cursor`, `detailLevel`, or `includeChildren`.
- Provider plugins may emit `context-capsule-carrier:changed` after owner-write/save paths that can change carrier evidence. The event is a lightweight invalidation / dirty hint only; consumers must not treat it as source data or as proof that visible evidence changed.
- The event payload should stay lightweight: `providerId`, `revision`, optional `contextKeys`, `reason`, and `timestamp`.
- Receivers such as Project Overview may invalidate matching cache entries and mark the provider/key dirty. A visible consumer may then coalesce the event burst, probe only its currently visible Context Capsule targets through the provider owner snapshot API, and rebuild only after complete projection evidence changed or remained uncertain. Hidden/closed views must schedule no timer or provider work. The event must never activate provider views, trigger eager hidden hydration or polling, bypass owner APIs, or write another plugin's business data.
- Projection equality must bind ordered stable carrier fields and completeness/truncation metadata. Provider failure, missing target buckets, malformed counts/cursors, `hasMore`, or truncation cannot certify unchanged; the old committed model remains visible and dirty/retryable.
- Provider events should be debounced so consecutive local writes collapse into one invalidation signal.

Trace:

- `change-records/2026/2026-07/20260706-190200-gtd-context-carrier-snapshot-api.md`
- `change-records/2026/2026-07/20260706-191200-provider-snapshot-no-focus.md`
- `change-records/2026/2026-07/20260706-212400-project-overview-context-carrier-fair-limit.md`
- `change-records/2026/2026-07/20260707-001800-provider-carrier-summary-no-activate.md`
- `change-records/2026/2026-07/20260707-012323-project-overview-provider-indexing.md`
- `change-records/2026/2026-07/20260707-201141-cross-plugin-snapshot-cache-invalidation.md`
- `change-records/2026/2026-07/20260707-204658-provider-snapshot-contract-family.md`
- `change-records/2026/2026-07/20260715-163048-project-overview-phase2b1-carrier-auto-refresh.md`

## Cross-Plugin Aggregation Pipeline Contract

status: confirmed_by_memory
updated: 2026-07-06

Cross-plugin aggregation should be modeled as a bounded MapReduce-style pipeline:

- Map: source plugins expose read-only snapshots, identity lists, counts, or cursors through owner APIs.
- Reduce: the aggregator de-duplicates, sorts, groups, projects columns, records diagnostics, and preserves deterministic semantics.
- Backstop: limits may protect rendering and memory, but must not silently define what counts as true source evidence.

Boundary:

- Aggregators such as Project Overview must not read or write source plugin business JSON to optimize speed.
- Provider snapshots must not activate provider views, mutate visible focus, or trigger reveal/open flows.
- Shards may run with bounded concurrency, but semantic operations such as start-record selection, BFS expansion, grouping, and user-facing ordering must reduce deterministically.
- Failures should degrade into diagnostics, missing evidence, or duplicate-but-visible evidence; they must not hide source evidence incorrectly.
- Limit names and diagnostics should distinguish `per-query`, `per-target-per-provider`, provider total diagnostics, and model-global backstops.

Trace:

- `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md`
- `change-records/2026/2026-07/20260706-212400-project-overview-context-carrier-fair-limit.md`
- `change-records/2026/2026-07/20260707-001800-provider-carrier-summary-no-activate.md`

## Context Capsule Key Contract

status: confirmed_by_code

Project Overview exposes a read-only identity contract for operation-level context capsules:

```js
await window.__projectExecutionOverviewPluginApi.getContextCapsuleKeys()
window.__projectExecutionOverviewPluginApi.getContextCapsuleKeysSync()
```

Each key is limited to identity fields:

- `contextKeyId`;
- `address`;
- `canonicalLabel`;
- `displayLabel`;
- `color`;
- `icon`.

Address parsing is strict when the local consumer keyword contains an address. The complete prefix before `- ` is the address, including suffix letters such as `036B`; consumers must match addressed keys by exact full `displayLabel`, not by address alone, and must not fall back to canonical-label matching after extracting a non-matching address.

Consumer plugins may project these keys as virtual / waiting capsules and may bind local content to a key. They must not use this contract to write another plugin's business JSON.

Implemented consumers:

- Workspace Mount displays Project Overview keys as synced / virtual tab capsule keywords. Context Capsule Key chips display only the key itself; Workspace Tab binding remains tooltip/click behavior rather than visible key-suffix text. Workspace Mount separately owns paradigm tag keyword carriers in `Workspace_ParadigmTagKeywords.json`. Current PEO rename/repair/recovery writes ONLY Tab capsule keywords; paradigm keywords, project-entry comments and carrier titles are excluded (2026-10-01 scope correction, retained in the 2026-10-13 panel).
- Mandala displays synced node keywords and virtual waiting capsules in keyword locating surfaces.
- GTD displays synced tag keywords and virtual waiting capsules in tag keyword index surfaces. GTD Context Capsule Key chips display only the key itself; tag binding remains tooltip/click behavior rather than visible `key -> tag` text.
- Collection Card View displays synced tab keywords, local-only tab keywords, and virtual waiting capsules in Tab keyword surfaces. Collection Card Context Capsule Key chips display only the key itself; Tab binding remains tooltip/click behavior rather than visible tab-name suffix text.
- State Capsules displays synced capsule keywords, local-only capsule keywords, and virtual waiting capsules in capsule keyword index surfaces. State Capsules virtual chips are read-only and are not persisted into `data.json`.

Current write boundary: Project Overview owns declaration editing and confirmed rename coordination; this is not proof of a production permanent-ID registry. A caller UI may explicitly delegate to PEO, while consumer-local edits must not silently rewrite shared declarations. The approved direction is `Project Overview identity edit -> explicit sync to bound consumer carriers`; the forbidden direction is `consumer local edit -> implicit registry rewrite -> propagate to other plugins`.

Provisioning exception: an explicit add-project workflow may ask consumer plugins to create or reuse their own local carriers through owner APIs. This is not passive rendering writeback and not identity ownership transfer.

Current provisioning carriers:

- Workspace Mount `ensureProjectContextTab(options)`: root Tab named by `projectName`, with `contextKey` as tab capsule keyword.
- Collection Card View `ensureProjectContextTab(options)`: root Tab named by `projectName`, with `contextKey` as tab capsule keyword.
- GTD `ensureProjectContextTag(options)`: top-level tag named by `projectName`, with `contextKey` as tag keyword; also creates or reuses a top-level GTD project named by `projectName`, appends new projects to the end, applies the tag to the project, and returns the GTD project `projectNodeKey` for EVA linking.
- Mandala add-project orchestrates this provisioning but does not auto-create a Mandala node for ordinary Workspace project creation because grid placement is user-semantic.
- Mandala add-Mandala-context-goal workflow may create a Mandala-owned node only after the user explicitly chooses the parent node in the Mandala selector. The new node uses the first empty non-core slot under that parent, writes the Context Capsule Key into the Mandala-owned node comment block and `Mandala_Keywords.json`, and calls the other plugins only through their owner APIs. It must not write Workspace Mount, Collection Card, GTD, Project Overview, EVA, or Keyword business JSON directly.
- A fully linked Mandala context goal follows this owner chain:
  - Mandala owns the Mandala node and weekly goal row;
  - GTD owns the initial project item carrier and returns its EVA `projectNodeKey`;
  - EVA owns the Mandala-node-to-GTD-project relation through `ensureRelation(input)`;
  - Project Overview owns overview-level Mandala meta/comment through `syncMandalaContextGoalMeta(nodeKey, meta)`.

Long-form semantics are maintained in `knowledge/context-capsule-key.md`.

## State Capsule Starting-Point And Context Restore Contract

status: repository_dev_static_verified_runtime_pending
updated: 2026-08-17

State Capsules owns manually maintained launch baselines and orchestrates restoration of their captured environment/view state. Each participating plugin remains the owner of interpreting and applying its local state.

This baseline lifecycle is canonically named `狄拉克海上的涟漪模式`: a bounded set of typical starting states is maintained deliberately, while ordinary live journeys remain transient. The model reduces complexity by allowing new durable states to emerge progressively instead of requiring every interaction to leave behind a future-readable checkpoint.

Baseline lifecycle contract:

- a capsule snapshot is a stable starting point, not the latest automatic checkpoint of a journey;
- switching capsules restores the destination baseline and must not capture or overwrite the source capsule;
- only explicit `Save current state as new capsule` and `Overwrite active capsule` operations may capture live environment state into a baseline;
- switching may persist `activeCapsuleId` only. The pointer identifies the currently selected starting point and is not a baseline revision;
- pointer persistence must be read back; mismatch restores the previous in-memory pointer and attempts persisted rollback;
- a switch leaves capsule snapshots, `updatedAt` fields and capsule order unchanged;
- restore warnings, partial provider restore and verification drift never authorize automatic baseline mutation;
- external APIs may read saved capsule state but must not expose generic active/all-capsule snapshot writers. The former `updateActiveProjectExecutionOverviewState` and `updateAllProjectExecutionOverviewStates` methods are superseded.

Project Overview restore contract:

- capsule schema v2 stores selected `groupId` plus stable `primaryNodeKey` by grouping/normal-Kill scope;
- restore order is `groupId -> primaryNodeKey -> first visible group`;
- active grouping and normal/Kill scope are restored in memory without saving settings;
- normal scope excludes all-killed groups before selection; Kill scope is inspection only and does not revive lifecycle state;
- selected primary-key Tab changes without resetting vertical page scroll.

GTD restore contract:

- State Capsules passes an explicit `context-keyword-project-v1` policy and normalized capsule keywords;
- GTD resolves its own tag-keyword carriers and matching active projects, then returns to normal unfiltered view rather than restoring a tag-filtered view;
- multiple matching projects use saved `anchorProjectId`, owner of `anchorItemId`, GTD list position, DOM distance from saved scroll, then deterministic order;
- no match restores the old GTD view context with diagnostics and creates no data;
- only the explicit policy ignores captured legacy tag filters. Other callers retain legacy bridge behavior.

Host/transaction boundary:

- GTD bridge selection is note-path and host-identity aware;
- multiple hosts require a unique active host, otherwise restoration fails closed without activating an arbitrary leaf;
- delayed restore work is generation-owned so an older capsule cannot overwrite a newer one;
- restore must not write, normalize, repair, create, kill, revive, or migrate Project Overview/GTD business records.

Trace: `change-records/2026/2026-08/20260801-151030-state-capsules-peo-gtd-context-restore.md`.

Starting-point correction trace: `change-records/2026/2026-08/20260817-state-capsules-starting-point-semantics.md`.

## Workspace Source Ownership Contract

## Primary-Key Lifecycle Kill Contract

status: runtime_synced_static_verified_ui_smoke_pending

Project Overview owns a reversible lifecycle registry for Workspace project primary keys and Mandala goal primary keys. The canonical identity is `domain + primaryNodeKey`; display labels and Context Capsule Key text are metadata and may change without changing lifecycle identity.

Contract:

- Normal Project Overview projection hides a group only when every primary identity in that group is killed. Mixed groups fail open and remain visible.
- Kill Mode is transient view state. It keeps the complete reduced model, provider evidence, EVA relations, and killed groups available for inspection and revive actions.
- Kill/revive changes lifecycle metadata only. It must not delete source items, provider JSON, EVA relations, Mandala weekly history, or Project Overview evidence.
- Global keyword navigation merges all same-keyword source identities before lifecycle projection. A keyword remains visible when any source is active; all-killed sources are hidden only from normal navigation.
- Project Overview exposes lifecycle state through a read-only snapshot API and one coalesced owner event. Lifecycle mutation remains internal to Project Overview.
- Mandala consumes lifecycle state read-only for `已 Kill` badges and new-score admission. A successful fresh snapshot may suppress a new Workspace/Goal score block, but it must not translate Kill into Mandala's `不再推进`, write Project Overview settings or weekly tracking JSON, delete historical scores, rerender whole weekly surfaces, or flush unrelated drafts.
- Score admission requires request-scoped fresh Kill evidence and complete Workspace identity matching. Stale, missing, or failed Kill evidence fails open; Mandala-owned stopped state remains a separate authoritative new-write boundary.
- Existing score history remains visible/editable/deletable after stop or Kill. Add-click and final persistence revalidate owner/lifecycle state, and lifecycle events invalidate in-flight admissions.
- Killed data must not become storage-only state. Kill Mode is the explicit inspection/revive path, and historical owner records remain readable through their own historical surfaces.
- A future cleanup or archive refactor must preserve `domain + primaryNodeKey`, lifecycle status/provenance, and at least one bounded read path before removing an item from an active projection.

Trace:

- `change-records/2026/2026-07/20260723-120847-project-overview-primary-key-kill-mode.md`

## Lifecycle Discoverability And No-Ghost-Data Principle

status: confirmed_by_user_and_code_with_open_system_gap
updated: 2026-07-24

Every persisted inactive managed object must have an owner-defined discovery path. Hiding from an active view is valid only when identity, lifecycle evidence, retained history, and a review route survive.

Contract boundary:

- Project Overview Kill, Mandala `不再推进`, source deletion, and Timeline range projection are distinct owner decisions; one owner must not silently infer or write another owner's lifecycle state.
- Active views may exclude exited objects to protect forward attention.
- Historical day/week slices must retain what was captured then. Current rename, stop, kill, or source absence must not rewrite the old roster, label, plan, comment, or judgment.
- Retained raw Timeline slots/milestones and source evidence may be hidden from future projections, but must not be silently deleted as a side effect of exit.
- Any archive/review UI should expose stable identity, historical label fallback, lifecycle state, source owner, and the evidence/time boundary that explains why the object is inactive.
- Data with no current source may still be valid historical evidence. It must be marked as historical/source-missing rather than shown as an unexplained broken current item.
- If no UI or documented owner API can retrieve a persisted inactive object, the system must treat that as lifecycle discoverability debt, not successful cleanup.

Current confirmed read paths:

- Project Overview killed identities: Kill Mode and read-only lifecycle snapshot.
- Mandala stopped identities: stop-week closeout plus historical weekly roster/slices and `includeStopped` owner API.
- Timeline stopped projections: raw Timeline history retained; future effective projection ends after the inclusive stop date.

Runtime disk deployment verified; loaded UI smoke pending:

- Mandala inactive daily-item owners: each Daily Lessons side has a read-only `查看归档` projection over its own canonical `active === false` owners. View/hide is session-local and write-free; cross-side references are excluded; explicit restore reactivates the same stable owner and preserves date history, references, images and Ontology. The daily-only candidate is byte-aligned across Actual Runtime and Repository Mirror and independently verified; Repository Dev's separate Goal-owner filter remains intentionally undeployed. Because Obsidian was already running, the claim is disk-deployed/static-verified rather than loaded-UI-verified until reload.

Open gap: there is no confirmed unified archive that lists every retired primary key across Project Overview, Mandala, and Timeline. This remains a Framework/Atlas unknown rather than an implied runtime feature.

Trace:

- `plugins/project-execution-overview.md#primary-key-lifecycle-kill-mode`
- `plugins/mandala-time-blocks.md#historical-roster-and-tracking-exit`
- `workflows/planning-record-execute-review.md#exit-archive-and-review`
- `cards/2026-07-24-primary-key-exit-discoverability-no-ghost-data.md`

## Workspace Source Ownership Contract

status: confirmed_by_memory

Mandala may trigger Workspace project creation from weekly tracking or project-plan surfaces, but Workspace Mount owns the Workspace project primary carrier and source note.

Boundary:

- Mandala must not pass its own `九宫格目标.md` / Mandala `sourceNotePath` as the Workspace Mount owner source when creating Workspace project entries or context tabs.
- Workspace Mount global APIs must resolve a missing or configured `sourceNotePath` to the canonical full source note path before opening, waiting for, creating, or snapshotting Workspace entries.
- Project Overview must treat only canonical Workspace Mount source records as Workspace start records; non-canonical historical node keys such as `workspace-mount-view|.../九宫格目标.md|...` are filtered from Workspace starts rather than cleaned from business data.
- Mandala can keep its own source path as local provenance for Mandala-owned rows, but that provenance is not Workspace ownership.

Trace:

- `change-records/2026/2026-06/20260626-005650-mandala-peo-workspace-source-boundary.md`
- `change-records/2026/2026-06/20260626-012500-workspace-mount-api-source-path.md`

## Mandala Tracking Ownership

status: confirmed_by_memory

Mandala owns:

- daily lesson state;
- goal weekly tracking;
- workspace primary weekly tracking;
- project plan panels.
- goal execution plan rows for Mandala / 九宫格 primary keys.

Project Overview can provide entry buttons and order snapshots, but Mandala owns tracking persistence.

Workspace weekly tracking and goal weekly tracking can share row shape, but they must use separate key domains and buckets.

Goal execution plan rows and Workspace project execution plan rows must also use separate buckets:

- `goalPlanRowsByKey`: Mandala / 九宫格 primary-key planning fields (`愿景`, `获得到的知识`, `当前情况`, `下一步计划`);
- `projectPlanRowsByKey`: Workspace primary-key project execution planning fields.

Project Overview may provide read-only Collection Card evidence for either surface, but the display of Collection Card chips is not a write contract and does not transfer ownership of Collection Card, EVA, GTD, Workspace, Keyword, or Project Overview source data to Mandala.

## Workspace Project Title Snapshot Contract

status: confirmed_by_code

Workspace Mount exposes a read-only owner API for Workspace project-entry labels:

```js
await window.__workspaceMountPluginApi.getProjectOverviewWorkspaceEntrySnapshot(options)
```

Mandala may consume this as a fallback when rendering Workspace weekly summary / project-plan tables. The purpose is to avoid leaking raw implementation ids such as `item_m...` into user-facing weekly summaries when Project Overview's derived order/title snapshot is unavailable or incomplete.

Boundary:

- Workspace Mount owns Workspace item titles and the snapshot API.
- Mandala owns weekly tracking rows and must not directly read or mutate Workspace Mount business JSON.
- Project Overview remains an aggregator / order snapshot source, not the only possible title fallback.
- Workspace Mount's habit of inserting new project entries at the top of the project-list tab is confirmed user practice and should not be treated as a regression.

## Project Overview Carrier-Note Suppression Contract

status: confirmed_by_user

Project Overview may suppress an ordinary note in the `范式积累` / ordinary-note column only when the current rendered model has an exact carrier path for that note through Keyword keyword notes or Workspace bound notes.

Boundary:

- A relation to the current primary / workspace start item is not enough to hide the ordinary note.
- If Workspace has no bound note for the path and Keyword has no keyword/drawer note for the path, the ordinary note remains visible.
- Suppression is path-exact and applies only to ordinary-note projection; it must not hide Keyword rows, Workspace rows, or carrier rows against each other.

Trace:

- `change-records/2026/2026-06/20260629-191830-project-overview-carrier-note-explicit-primary.md`

## Project Overview 9XX Archive Display Contract

status: superseded_2026-10-13（`tracking-only-v2`：9XX 托盘改为「已停止追踪」历史入口，按明确停追证据而非编号前缀分类；以下为历史规则）

Project Overview top keyword navigation follows the shared archived Context Capsule Key display rule: parsed addresses matching `^9\d{2}` move out of the main Keywords row into an archived toggle while remaining clickable.

Boundary:

- `901- ...` and `900A- ...` are archived display chips.
- `009A- ...`, `036B- ...`, and `99- ...` are not `9XX` archived chips.
- This is a presentation rule for the top Keywords navigation; it does not delete, archive, or hide the underlying project group rows or source data.

Trace:

- `change-records/2026/2026-06/20260627-113257-project-overview-9xx-keyword-archive.md`

## Keyword Topology Order

status: confirmed_by_memory

Keyword ordering for cross-plugin review should use Antinet/ATOM topology where available:

`keyword.sortKey / Antinet topology > current note ATOM code > text fallback`

This keeps keyword review, keyword navigation, and Antinet tree perception aligned.

Drawer and SCON subtree order should use the subtree minimum ATOM address where available. Addressed drawers sort before unaddressed drawers; unaddressed drawers keep the existing BUS-number and label fallback. Display locators such as `SCON.L雷达 -> L / 雷达` affect visible grouping and labels only; they must not change raw `SCON.` path parts, `nodeKey`, expansion keys, EVA identity, or keyword JSON schema.

Trace:

- `change-records/2026/2026-06/20260627-104917-keyword-subconcept-letter-groups.md`
- `change-records/2026/2026-06/20260629-002630-keyword-drawer-address-sort.md`

## JSON Ownership Contract

status: confirmed_by_memory

Known JSON ownership examples:

- `keyword-index-plugin` owns `data/keyword_index.json`.
- `mandala-time-blocks` owns Mandala daily/weekly/project tracking JSON, including `Mandala_DailyCompletionOntology.json` for shared completion Schema plus date-keyed recursive instances and `Mandala_LongitudinalOntology.json` for independent goal-primary documents plus a shared project-primary Schema authority with owner-local instances.
- `workspace-mount` owns workspace mount data.
- `workspace-mount` owns `Workspace_ParadigmTagKeywords.json`, a content-side sidecar where one keyword uniquely binds to one paradigm tag.
- `eva-cross-view-relations` owns relation data.
- `json-asset-registry` is read-only for other JSON and only writes its own registry, snapshots, and report.

No plugin should repair, normalize, or migrate another plugin's JSON as a side effect of restore, export, or view rendering.

## AI Context Export Contract

status: confirmed_by_memory

The current Project Overview AI context export is a read-only evidence packet. It should be built from the currently rendered model and source plugin read-only APIs.

Implementation rule:

- The export path may collect independent read-only shards in parallel from the already rendered `view.model` / `group`: primary/comment evidence, column evidence, in-group relations, Mandala read-only tracking context, and Context Capsule Key / cache diagnostics.
- Shard collection must use the current model as its evidence boundary; it must not rebuild the overview model, trigger global keyword navigation rebuilds, or read source plugin business JSON directly.
- Shard failures may be reported as export diagnostics while preserving the older markdown sections and `export_version`.

It must not call:

- `loadData`;
- `saveData`;
- fallback loaders;
- direct `data.json` reads;
- adapter filesystem reads;
- business JSON writes.

The export is a bridge between the visible system state and AI coaching, not a hidden rebuild pipeline.

Trace:

- `change-records/2026/2026-07/20260704-project-overview-ai-context-shards.md`

## Project Overview Build Model Shard Contract

status: confirmed_by_code

Project Overview may structure its visible model build as read-only shards, but the shard boundary is an implementation scaffold over the existing deterministic graph projection, not permission to introduce new data owners.

Allowed first-stage shard boundaries:

- source / EVA read source selection;
- start records already resolved by the existing mode logic;
- Workspace start records and seed records;
- external carrier attachment through Keyword and Workspace read-only APIs.

Deterministic merge boundary:

- `resolveStartRecords()` order remains mode-owned and must not depend on a newly precomputed Workspace start set.
- `expandRecordsIntoModel()`, `addRecordToModel()`, `addRelationEdge()`, `suppressCarriedOrdinaryNotes()`, and `buildRelationGroups()` remain ordered merge/post-processing steps.
- External carrier shards may run with `Promise.allSettled`, but each shard must avoid unbounded per-item API fan-out.
- Carrier shard failure must degrade toward visible duplicate ordinary notes rather than mistaken hiding.

The build-model shard pipeline must not directly read or write Workspace, Mandala, Keyword, GTD, Collection Card, or EVA business JSON beyond the pre-existing EVA fallback path.

Trace:

- `change-records/2026/2026-07/20260704-project-overview-build-shard-pipeline.md`
## External Ontology Editor Owner Contract

status: confirmed_by_code
runtime_evidence: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-04

Workspace Mount exposes `window.__workspaceMountPluginApi.ontologyEditor` as a versioned editor provider. Mandala daily-lesson items, date-level daily completion records, and goal/project longitudinal primary keys are explicit external owners.

1. The external plugin remains sole owner of formal Ontology data, canonical identity, owner mutation queue, recovery records, and conflict decisions.
2. Workspace Mount owns editor rendering, recursive schema/table mechanics, hash/validation helpers, image-album interactions, provider-generation leases, and close orchestration.
3. `openExternalEditor()` requires bounded owner callbacks for formal commit, recovery load/persist/clear, owner-alive checks, attachment creation/linking, and preview. The provider must not discover or write external business JSON.
4. Both parties check `apiVersion`, schema range, `hashVersion`, and provider generation. Awaited boundaries recheck owner/provider leases before opening, committing, clearing recovery, or finishing close.
5. CAS conflict responses include the owner's current formal Ontology and hash. Recovery is keyed by owner namespace, canonical source/side, stable item identity, and base hash; stale sessions cannot overwrite or clear newer recovery.
6. Owner unload closes its external editors through a prepare-all barrier. Failure to preserve a dirty draft blocks destructive owner teardown.
7. Clean open/close and render paths are write-free. Attachment removal deletes only the exact reference after confirmation and never deletes the vault file.

This is a UI/provider contract, not shared data ownership. Adding another external owner requires its own canonical identity, owner callbacks, recovery store, writer-preservation tests, and unload proof.

## Ontology Historical Lifecycle Contract

status: confirmed_by_code
runtime_evidence: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-02

1. Ontology document schema v2 distinguishes active columns from archived columns. Ordinary delete archives/hides; restore reactivates the same stable ID and historical content graph.
2. `reservedColumnIds` is authoritative for current and retired IDs. Rename/restore never changes ID and new columns never reuse a reserved ID.
3. Archived columns retain direct text, image-reference tokens, `childSchemaId`, per-row `nestedTableId`, recursive tables, timestamps and parent links. Archived content still counts toward total-cell and byte limits.
4. Active-column and total-column limits are distinct. Hiding columns is not storage deletion.
5. Non-empty row deletion fails closed when any direct text/image content or non-empty recursive branch exists. Physical purge is outside the ordinary editor contract.
6. Provider API v1 advertises `schemaVersionMin=1`, `schemaVersionMax=2`, `writeSchemaVersion=2`, `column-lifecycle-archive-v1`, `stable-column-id-reservation-v1`, and `nonempty-row-delete-guard-v1` additively.
7. A v1 document may be upgraded in a draft, but read/render/compatibility projection does not write. A v1-only provider must reject or read-only protect v2 instead of interpreting archived columns as active.
8. External owners retain formal-data, recovery, CAS and unload authority. Schema/document lifecycle support does not transfer JSON ownership to Workspace Mount.
9. Archived columns have a non-writing history projection. Viewing archived text, image albums and existing recursive child tables does not reactivate the column, change its ID or mark the draft dirty. Read-only status propagates through the complete `parentCellRef` chain, and both UI controls and low-level image mutation/admission paths fail closed for an archived cell or descendant branch.
10. An external owner commit freezes its canonical source and owner-file path before asynchronous reads. It rechecks the live source/path immediately before publication and writes/rereads only the frozen owner path; a source switch fails closed and must never redirect the old draft into the newly selected source directory.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260802-ontology-history-lifecycle-daily-completion.md`.

## Mandala Longitudinal Primary-Key Ontology Contract

status: confirmed_by_code
runtime_evidence: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-09

1. Formal data belongs only to Mandala's dedicated `Mandala_LongitudinalOntology.json`; Workspace Mount supplies recursive editor mechanics and never discovers or writes this shard directly. Goal-primary owners retain independent complete Ontologies; project-primary owners share one recursive Schema authority and retain owner-local table instances.
2. Goal identity is the canonical tuple `(sourceNotePath, goal, Mandala node id)`. Project identity is `(sourceNotePath, project, workspaceIdentityAlias(nodeId))`. Titles and projection order are display evidence only.
3. Current-plan visibility and durable knowledge lifecycle are separate. Stop, Kill, and owner-missing filtering may remove the current row projection but cannot erase or migrate the retained Ontology.
4. Ordinary plan persistence remains in `Mandala_WeeklyGoals.json` and has no Ontology field. The Ontology mutation queue and safe writer are independent, so plan text and Ontology commits cannot overwrite one another.
5. Opening, rendering, content-state projection, clean close, v1 projection and missing-shard load are write-free. A v1 goal save remains v1; the first successful project save alone converts the shard to v2 in one guarded publication.
6. Project v2 stores goal documents, one project Schema authority/identity and owner-local project instances separately. The initial authority preserves the exact existing `schemaaddr:v2` identity and recursive Schema ids of `电路板外委工艺要求`; display title is not identity.
7. Stored pretty-JSON bytes are admitted before any write, bounded at 64 MiB, and rechecked by the writer. Loader admission uses `stat` before read and a second byte check after read.
8. Public plan, Timeline, Project Overview, Collection Card, score, print, AI, and recovery-export projections must not expose Ontology bodies, image references, schema graphs, or recovery drafts.
9. The compact action stays inside the existing primary-key cell. `populated` alone shows the standard outside-corner status dot; `empty` and `unknown` do not. Status refresh after editor close is local and revalidates DOM, tab, source, shard, domain, and owner identity.
10. A project commit checks shared-Schema CAS, current-instance CAS, full projection hash and raw-file CAS separately. Schema changes validate every retained current/historical project instance and reject atomically if any nested table would become invalid; row-only writes leave the authority revision unchanged.
11. Schema-only writes preserve all project instances and goal documents byte-semantically, emit the authority-change event only on a real Schema change, and route through navigation owner -> seed owner -> stable current owner. Historical-only authority is read-only.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260804-002500-mandala-longitudinal-primary-key-ontology.md`; refined by `memory/obsidian-plugin-system/change-records/2026/2026-08/20260809-123218-mandala-time-blocks-project-shared-schema.md`.

## Weekly Primary Ordering Projection Contract

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-05

1. Project Overview owns capsule level and original primary order; Timeline owns the canonical daily wave; Mandala owns weekly rows and the deterministic reduce.
2. Weekly summary order is `capsuleLevelRank -> presentInTodayWave -> todayWaveRank -> Project Overview index -> stable identity`, calculated separately for goals and projects.
3. Timeline UI and owner API must share one wave-order helper. Owner snapshots replay from persisted range start through today and ignore transient UI filters.
4. Ordinary/manual Timeline rows may affect inherited vertical position but never become Mandala primary rows. Schedule rows are excluded.
5. Goal joins use exact Mandala IDs. Project joins use complete Workspace jump keys. Title and alias-only matching are forbidden.
6. Missing, rejected, malformed, truncated, over-bound, or legacy-incomplete provider evidence triggers whole-request fallback to Project Overview order. Partial Timeline ranks must not be mixed into the result.
7. The projection applies to goal/project weekly summary UI, current goal/project vertical-management UI, and their matching print sections. Vertical management still applies its own current-row visibility filter; scores, rosters, lifecycle state, Project Overview Tabs, and Timeline persistence remain unchanged.
8. Sorting is render-time and write-free. Historical selected-week content is not rewritten through today's attention lens.
9. Goal ordering consumes only each Project Overview Mandala group's `primaryNodeKey/nodeId` and capsule metadata. Optional `memberNodeKeys/memberNodeIds/memberIdentityConflict` fields describe surrounding group evidence; they do not create managed goal primaries, confer ABC inheritance, or invalidate primary ordering when ordinary evidence appears in multiple groups. Primary key/id disagreement, illegal primary metadata, contradictory duplicate primary evidence, or provider-level incompleteness still makes the whole request fall back. A legacy primary-only snapshot remains readable when its metadata is internally valid.
10. When provider evidence is otherwise valid, a visible goal row without exact PEO primary metadata is a bounded row-level absence, not authority to hide or delete it and not a reason to discard valid ranks for matched goals. Matched goals retain the composite order; unmatched goals remain visible in a deterministic tail (`PEO fallback rank -> stable identity`) and carry `当前未进入 PEO 目标主键集合` in UI and print. This partial behavior is goal-only: project rows with missing metadata retain whole-request fallback. Diagnostics keep complete internal membership but expose at most 12 unmatched IDs.

Trace: `change-records/2026/2026-08/20260805-weekly-abc-today-wave-order.md`; corrected by `change-records/2026/2026-08/20260805-goal-primary-abc-timeline-order.md`.
# Ontology Discovery And Meta Hub Contract

status: runtime_trial_deployed_migration_verified_ui_acceptance_pending
updated: 2026-08-21

## Ownership

- Workspace Mount owns paradigm Ontology documents and remains the standard recursive editor provider.
- Mandala owns daily-item, daily-record and longitudinal goal/project Ontology documents.
- Ontology Meta Hub owns discovery UI, transient provider leases and its own local symbolic projection: one persistent automatic source code plus an optional manual override per stable family/source-group, and one optional local alias per stable Ontology owner. It never owns formal Ontology content and never reads owner JSON directly.
- Project Overview remains an execution aggregator and is not the host or source of truth for this cross-workflow index.

## Provider V1

Each provider exposes `contractVersion`, request/response/descriptor/stable-ref versions, provider generation/instance identity, explicit families/capabilities, and these methods:

- `listScopes()`
- `getSummary(options)`
- `listEntries(options)`
- `openOntology(stableRef, { signal })`
- `revealSource(stableRef, { signal })`

Descriptors may contain stable identity, source label/path, optional stable `sourceGroupId/sourceGroupLabel`, purpose, usage, content/lifecycle/orphan/source-availability states, update time and bounded recursive structure counts. They must not contain formal Ontology bodies, recovery records or drafts. Hub v1 retains `purpose/usage` for compatibility but does not render a repeated purpose/usage table column.

Providers may advertise additive `source-group-facets-v1`. Its `getSummary()` response returns a complete stable source catalog and filtered counts inside each family summary; `listEntries()` then accepts the selected `sourceGroupId`. Workspace groups paradigm owners by stable `paradigmId` and displays the paradigm name, never one capsule per paradigm item. Mandala groups daily items by canonical side and uses explicit completion/goal-plan/project-plan source identities for the other families.

## Hub Local Symbolic Projection

- `ontology-meta-hub/data.json` owns only `ontologyLocalProjection`. Source priors are keyed by stable `providerId + canonical scopeId + familyId + sourceGroupId`; owner aliases are keyed by the canonical structured owner identity used by the Hub. Labels, row indexes and provider generations are snapshots or proof inputs, never identity.
- Projection schema v2 separates immutable `autoPrefix` from optional `manualPrefix`. Missing automatic codes are allocated as exactly three uppercase letters (`AAA ... ZZZ`) in stable `sourceGroupId` order only after a concrete-family view proves a complete descriptor snapshot and a complete unfiltered source catalog. There is no predefined label-to-code mapping.
- Automatic allocation is one serialized atomic batch. Before commit, Hub revalidates provider generation, lease, canonical scope, `sourceGroupsComplete` and the stable catalog fingerprint. Capacity exhaustion rejects the whole batch; automatic writes do not recursively refresh views. Startup, registration, restore, diagnostics and all-family summaries never allocate.
- Automatic codes remain reserved when sources disappear and are not reused while hidden by a manual override. `恢复自动分配` removes only `manualPrefix` and reveals the original `autoPrefix`; legacy v1 `prefix` values normalize as manual overrides. A future schema version remains readable but refuses local writes.
- The rendered address is the compact composition of source code and the user-entered object number/name, for example `BAA` + `011- 朱建明` -> `BAA011- 朱建明`. Prefix and body are separate DOM spans. Objects without aliases use the same prefix plus provider title, and search covers compact address, alias, original title, source and prefix.
- Local names affect only Hub display, search and deterministic ordering. Clearing an owner alias removes only that local projection and never renames, deletes or rewrites Workspace, Mandala, Keyword or formal Ontology data.
- Standalone and Mandala-embedded Hub surfaces share the same projection owner and single-editor registry. Implicit close and plugin unload drain pending local-name saves before teardown; failed saves do not close the editor.
- Schema-v2 downgrade is not code-only. After v2 has written `autoPrefix/manualPrefix`, an old v1 reader remains safely read-only but cannot render those fields. A reversible trial therefore preserves the pre-trial Hub `main.js`, `styles.css` and owner-local `data.json`; a downgrade first archives the trial-ending v2 data, then restores all three pre-trial files.

## Snapshot And Cursor Rules

- Scope is explicit and canonical. Contract v1 makes no whole-Vault completeness claim.
- Multi-family providers may advertise `combined-family-summary-v1`; otherwise Hub calls summary separately for each declared family and never sends an empty family to a legacy provider.
- Cursor binding includes provider generation, owner revision, scope, family, sort version, query, states, historical mode and, when supported, `sourceGroupId`. Nonempty malformed or mismatched cursors fail with `STALE_CURSOR`; they never restart at page one.
- Owner corruption fails with `ONTOLOGY_OWNER_READ_FAILED`; missing files may represent an empty store only when the owner contract defines absence as valid.
- Family-specific construction must not traverse unrelated owner families. Structure hydration is limited to descriptors on the returned page.
- Family rail counts apply query, state and historical filters but intentionally exclude the currently selected source group. Source-capsule counts apply the same filters while excluding their own source selection. Only the entry page applies `sourceGroupId`.
- Source facets come from the provider's complete owner set, not the current result page. A search may reduce a source count to zero without deleting the source identity or clearing the active capsule. Top-level or family-level incomplete/truncated summaries disable source capsules and force an unfiltered entry fallback.
- A selected family builds one bounded complete descriptor snapshot across provider pages, cached by provider generation/lease plus state/history filters. Search, source selection and local-name ordering reduce that in-memory snapshot; typing does not rescan all pages. Manual refresh and provider lifecycle changes invalidate the cache. Cursor loops, page limits, entry limits or generation drift fail closed instead of presenting a partially sorted queue.

## Identity And Historical Rules

- Workspace family: canonical paradigm item id under one declared source scope.
- Daily item family: canonical side owner only; references do not create duplicate owners.
- Daily record family: exact `daysByDate union instancesByDate`.
- Longitudinal families: current plan rows union retained formal documents. A retained document without a current row is `historical-orphan` and source-unavailable.
- Historical orphans may open only through forced read-only editor mode and receive no commit, recovery-persist or recovery-clear callback.

## Navigation And Concurrency

- Hub delegates every open/reveal action to the owner. It does not query owner DOM.
- Daily item/date focus and longitudinal goal/project focus are one-shot owner-managed requests. Goal/project reveal uses Mandala's registered vertical-plan rows and exact stable identities.
- Hub query generation, provider generation and registration lease are checked around asynchronous work.
- Hub deadline/view-close cancellation propagates `AbortSignal`. First-party owners check it before and after asynchronous boundaries and again before modal/focus side effects.
- Mandala source-note changes and Workspace provider/view drift fail closed; stale requests cannot be redirected to a newly selected owner source.

## Compatibility And Degradation

- Provider-before-Hub and Hub-before-provider load order are supported through globals plus ready/unavailable events.
- A new provider generation atomically replaces the old lease; old unload events cannot unregister it.
- One unavailable/failed provider degrades only its families. Existing visible rows become stale rather than being treated as deleted owner data.
- Future providers extend by registering new family descriptors; Hub schema and owner JSON do not need centralized migration.

## Verification State

- Repository-dev syntax and focused regression pass.
- Independent verifier `019fd566-bb60-74c1-bbcb-437ef733fe6e` returned final `PASS` after exact longitudinal source focus was added.
- The preceding local symbolic projection is Runtime/Mirror synchronized. The automatic three-letter schema-v2 extension is Repository Dev only pending final verification and explicit deployment confirmation.

## Ontology Cell Reference And Schema Lineage Contract

status: runtime_synced_static_verified_ui_smoke_pending

Provider: Ontology Meta Hub plus registered Workspace/Mandala owner providers.

Consumers: Workspace Mount shared Ontology editor and Mandala external-owner routes.

Contract:

- Cell identity remains canonical `celladdr:v1`. Schema authority identity is canonical `schemaaddr:v2`; providers canonicalize compatible v1 aliases before graph proof so one authority cannot appear as two nodes.
- Meta mode captures a clean formal source A and a current writable schema-v3 target B. Historical, read-only, v2 and recovery-only targets fail closed.
- `cell.reference` projects source content live. While the reference induces recursive form reuse, A is the sole formal Schema owner and B stores only a mapped projection for B-owned instances.
- Formal writes remain owner-native. Hub performs complete paginated outbound/schema-edge proof, cycle and inbound-deletion checks, then invokes exactly one owner CAS commit.
- Hub stores no persistent edge index and writes no EVA relation. Incomplete proof can report only a lower bound and can authorize only the narrow preservation-only unlink that forks B locally without deleting any cell or Schema address.
- Editor adapters bind the owner provider generation and lease at creation. `getWriteState()` and `subscribeWriteState()` fail closed on Hub unload, owner drift/downgrade, or unavailable/incompatible proof participants.
- A shared editor's own provider generation is host metadata, not an address-owner lease. Adapter routing strips caller-supplied generation/lease fields: capture remains constrained to the frozen editor owner, while live reference resolution and exact opening select the current provider from the referenced cell address.
- Frozen owner identity and global write availability are separate gates. Owner drift invalidates every adapter operation; an unavailable proof participant blocks capture/commit but still permits owner-valid live reads, exact navigation and explicitly incomplete backlink reduction.
- Dynamic read-only applies to reference/lineage-bearing documents; reference-free documents do not lose ordinary editability.
- Mutation permission is rechecked after every awaited destructive confirmation and before draft mutation.
- B cannot add, rename, archive, restore or delete source-owned Schema structure. `编辑共享结构` resolves and opens A's exact native Schema-only CAS editor; ordinary B table instances and cell content remain B-owned.
- Optional column `description` is part of Schema authority. A may edit it in the native table or Schema-only editor; B and archived/read-only projections may only view it. Clone/reconcile propagates multiline description updates and explicit clearing recursively without touching B-owned rows, values, images or table instances.
- Source changes reconcile recursively into B without overwriting B rows, values or images. An unchanged authority revision/hash is a no-op; unsafe divergence fails closed.
- On final unlink, active lineage never remains: local instances, legacy divergence, downstream dependency or incomplete proof produce an independent local fork; complete proof of no use prunes the blank projection. Detached source evidence moves to bounded document provenance, and full provenance capacity rejects rather than evicts.

Compatibility:

- Ontology schema v1/v2 remains readable under existing upgrade paths. Reference writes require the shared engine and all first-party owner writers to support schema v3, reference contract v1 and Schema-address canonicalization.
- Replacement providers receive a new lease; an adapter bound to an older owner lease never revives under the replacement.
- Runtime/mirror synchronization remains separately gated after repository-dev verification. For the daily cross-date binding refinement below, explicit synchronization completed on 2026-08-11; only loaded-UI interaction smoke remains pending.

### Shared Schema Authority And Detach

status: repository_dev_static_verified_runtime_pending
updated: 2026-08-17

- Workspace Mount provides `canonicalizeSchemaAddress`, `resolveSchema` and exact `openSchema`; Ontology Meta Hub canonicalizes every Schema edge before proof and coordinates, but never owns Schema content.
- Schema-only mode edits columns and recursive child Schemas without creating a fake table or row. A/B requests route to the same owner authority and native owner CAS/lease.
- External editor admission permits one live editor per normalized owner address. Duplicate sequential/concurrent opens reuse the first admitted callback bundle and exact handle, fan out close notifications after registry removal, and reject reuse while ordinary close or forced teardown is pending.
- Mandala daily completion dates share one source-level Schema authority while retaining date-isolated instances. Ordinary date commits and Schema-only commits share one authority lease/queue; Schema-only publication preserves `instancesByDate` exactly and emits an authority-addressed change event.
- A Shared-Schema binding belongs to the stable parent-column/Schema lineage, not to one row, one date, a column label, or an exclusive whole-column slot. Different date instances may therefore reference different source cells from the same source column while reusing the same recursive Schema authority.
- Daily-record detach is owner-policy gated. A pending binding is retained unless the current mutation contains a structured explicit reference removal for the matching stable parent-column ID and Mandala can prove that no current or historical date instance still carries a reference through that column. Malformed historical reference state fails closed as possibly referenced.
- If an earlier ordinary save incorrectly forked a still-equivalent Shared Schema, Workspace Mount may recover only `sourceLineage` metadata from the latest uniquely ordered `shared-schema-detached / forked-local` provenance event. Recovery requires strict recursive equivalence among the local Schema graph, the provenance snapshot and the current formal source projection, including names, active/archive order, column identity/type/lifecycle, topology and mapping. It never rewrites rows, values, images, tables, instances or stable IDs; any drift rejects the recovery.
- Daily regular commits CAS the selected date and the aggregate of all other date instances. Schema-only commits CAS the complete `instancesByDate` projection. Raw-file CAS and authoritative reread remain the final publication gates.
- Reconcile removes an A-deleted child projection only when B has no instance and the child has one parent. Existing instances or multiple parents reject and roll back the whole reconcile.
- Formal detach outcomes are `binding-retained`, `forked-local` and `blank-pruned`. Only complete proof can authorize `blank-pruned`; incomplete proof is admitted solely for one direct-reference removal whose final diff preserves all Schema/cell addresses.

Trace: repository-dev code and regressions under `workspaces/26- supermemoconcept的改进/插件/`; verifier `019fda36-df0e-78e1-92de-8cb4d44db112` final `PASS`; daily cross-date binding retention and provenance recovery verifier `019feb55-ecbf-74e0-865e-47ba33348bcc` final `PASS`.

## Temporal Framework Strategic Planning Contract

status: static_deployed_loaded_smoke_pending
updated: 2026-09-04

Temporal Framework owns strategic future outcomes, their outline forest, typed relations, calendar Placement, explicit no-deployment coverage decisions, gate policies and manual completion paint. It consumes managed goal/project identity but never becomes a second owner of Mandala, Workspace, Project Overview or Timeline records.

The model has five independent parts:

1. Outcome outline forest: parent/child decomposition and drill navigation.
2. Typed Outcome relations: `precedes`, `requires` and `contributes_to`; each relation type receives independent cycle validation.
3. Placement: one active calendar interval and one declared home TimeBox scale per active outcome.
4. Framework meaning: user-defined framework items, dated framework milestones and append-only bindings that project one effective framework position without changing execution ownership.
5. Manual effectiveness: an independent boolean projection for the small set of active Outcomes the user explicitly confirms as currently taking effect.

Framework meaning contract:

- Framework items have no type field. A membership may have zero or one `frameworkItemId`.
- One goal/project or outcome node may have at most one active milestone binding. Historical unbound bindings remain readable and IDs are never reused.
- An outcome has a framework milestone only through its own active direct outcome binding. Parent outcome bindings, membership bindings and framework-item assignment never propagate a milestone to that outcome.
- An outline parent from another membership never supplies milestone identity. No binding or projection may rewrite `membershipId`, `outlineParentId`, Placement, completion or relation state.
- Structured Time projection is `TimeBox -> framework item/unassigned -> membership -> membership-local horizontal Outcome tree`. Every admitted node is derived from one strictly validated own Placement for that TimeBox; same-membership active ancestors may appear only as context. Direct milestones annotate their own nodes and provide contextual indexes without becoming grouping containers or propagating to children.
- One outcome may have at most one active direct binding. One milestone may bind many different outcomes or memberships. Milestone indexes group bindings by membership, show same-membership ancestor paths as read-only context and jump to the real Outcome tree; context ancestors are never treated as bindings.
- Membership reassignment, unassignment or exit is blocked while the membership or any owned outcome has an active framework-milestone binding.
- Active milestones must remain inside the framework boundary. Archived milestones and unbound bindings do not block later boundary changes.
- Store schema v1 remains readable without load-time migration. The first explicit framework-item or Outcome-effectiveness mutation atomically upgrades to v2; v1 cannot contain v2 events, and v1-only readers must reject v2.

Manual effectiveness contract:

- One `effect-set` event contains only the common event envelope plus `{ outcomeId, effective:boolean }`. It has no reason, note, start date, expected date or lifecycle form.
- Same-value requests are rejected before schema upgrade, ordinal allocation or event append. Setting true requires an active Outcome; an archived true flag may still be explicitly set false.
- Archive hides an effective Outcome but preserves history. Restore reveals its latest flag. Effectiveness never blocks archive, parent relinking, framework-item reassignment or milestone bind/unbind.
- The dedicated projection is `framework item/unassigned -> owning membership -> merged membership-local ancestor tree`. Each effective Outcome appears once in that tree; its own active direct milestone is a node annotation, not a grouping level. Membership or ancestor milestone bindings never propagate. Archived ancestors remain contextual, and cross-membership/framework-item boundaries are labelled.
- Ancestor traversal has visited-set and fixed-depth guards. Shared ancestors merge inside the same framework-item/membership tree. Missing, cyclic or truncated evidence produces diagnostics rather than guessed structure.

Outcome overview tree contract:

- Each active goal/project membership projects one complete membership-local Outcome forest in a full-row horizontal tree. Stable Outcome identity and `outlineParentId` remain authoritative; the SuperMemo-inspired branch grammar is presentation only and creates no cross-plugin ownership or data dependency.
- Every valid active local descendant is accounted for exactly once as a rendered card or, beyond the fixed depth guard, explicit continuation evidence. Missing, archived, cross-membership, cross-framework and deterministically cut cycle parents are visible boundary evidence; they never justify guessing a parent or dropping a node.
- Default-expanded branch state is current-View memory only. Collapse keeps descendants prebuilt, uses accessible expanded/control/count semantics and performs one synchronous membership-viewport anchor compensation. It never writes Store, `data.json`, environment state or State Capsules.
- Time focus selects only Outcomes whose own single valid active Placement overlaps the selected TimeBox, then adds active same-membership ancestors as context. It does not reuse descendant-inclusive Time projection matching and does not admit siblings or foreign-membership descendants.
- Tree width is owned by the membership-local viewport with bounded paint/layout containment. Existing Outcome cards remain the rendering owner for actions, Placement, direct-only milestone annotation, state, return highlighting and navigation.
- Time and Outcome tree collapse are separate current-View sets. A Time branch key includes framework, TimeBox, membership and Outcome so one spanning Outcome never couples stages or duplicates control IDs. Neither collapse set is captured or persisted; historical Time expansion-depth preferences remain inert compatibility data.
- A one-shot current-period navigation intent may locate today's canonical TimeBox after the Time DOM and TOC exist. Manual `timePath`, search/TOC explicit anchors and Outcome highlight have priority. The intent never mutates `timePath`, Store, `data.json` or environment state and never repeats on ordinary rerender or tree toggle.

Milestone progress contract:

- Progress is derived only in existing framework-milestone cards from `milestone-create.createdAt` in the Store timezone through the current `targetDate`; no progress value is persisted.
- Before establishment is 0%; target day is explicit due at 100%; after target remains overdue at 100% and never auto-completes. A target before establishment is `确立时已逾期`; invalid timestamp/timezone is unavailable.

Placement mutation contract:

- Child intervals use half-open containment inside the immediate parent Placement. Parent resize/move must continue to contain every placed active child.
- `precedes` requires source interval end no later than target start; `requires` requires source effective due date earlier than target start; `contributes_to` requires contributor effective due date no later than gate effective due date.
- These rules apply to new relations, new Placements, Placement moves/resizes and parent relinking. They do not enter `validateProjection()`: historical hierarchy or relation conflicts remain readable and are emitted as repair diagnostics.
- A timing-invalid new relation is never persisted merely to obtain a relation ID. If both endpoints have Placements, one candidate transaction may add the structurally valid relation and replace both Placements together. Candidate relation plus both replacement Placements are validated in one temporary projection; one owner `save(expectedRevision)` appends the relation event and two distinct move events, or appends nothing. The parent relation draft is explicitly deferred while the child joint-adjustment Modal is open, and child cancellation writes no business Store data.
- Rail interactions capture Store revision at pointer/keyboard start. Only a changed, successful release appends one Placement event; `pointercancel`, lost capture, Escape, rerender and unload append nothing.

TimeBox is derived from `timezone + calendar + policyVersion + scale + [startDate, endDateExclusive)`. Year, quarter, month and week are projection scales, not persisted ownership containers. Drilling the Time dimension must preserve the Outcome focus; drilling the Outcome dimension must preserve the Time focus.

Ownership boundary:

- Mandala owns goal/project planning rows. New Temporal project membership admission uses the final `listEffectiveOperationalContextKeys()` projection; `listTimelinePlanningTargets()` remains the separate Timeline/history projection.
- Temporal Framework stores only its own membership copy of `providerId/domain/sourceScope/sourceKey/identityVersion`, creation label and last-known label.
- Temporal Framework never derives Mandala goal owner ids or Workspace project aliases. To open the Ontology belonging to an outcome's managed primary key, it calls Mandala's read-only `resolvePlanningTargetOntologyOwner()` capability and passes the returned provider-native `stableRef` unchanged to `openOntology()`.
- Mandala resolves current and retained historical owners inside the requested source scope and family. Zero matches and ambiguous matches fail closed; the resolver does not create an owner, write Ontology data or mutate planning rows.
- Timeline owns short-range items, day slots, wave order and milestones. Timeline readiness, elapsed time or milestone completion must never automatically paint a strategic outcome.
- Project Overview remains an evidence aggregator and is not the storage home for strategic outcomes.

All Temporal Framework business mutations are append-only events ordered by `commitRevision + ordinal`. IDs are never reused. Reframe, unassign, revoke, unpaint and coverage changes append compensating events. Current state is a reducer projection. The owner store uses candidate/journal/previous/readback recovery; load and environment restore do not create or rewrite `Temporal_Framework.json`.

Outcome retirement is append-only `archive` plus Placement `unassign` when a current Placement exists. It does not erase or cascade to child outcomes. An active child whose parent is archived remains visible as a warned local root. Relation selection is grouped by managed primary key and ordered by complete outline path; archived outcomes are excluded from new relation admission.

Structured Time projection always preserves local tree structure: each TimeBox validates Outcomes against their own single active Placement, groups them by framework item and membership, adds only same-membership ancestor context, and renders the horizontal tree with compact typed-relation chips. Outcome focus intersects that validated set and does not select another visual grammar. Missing or foreign parents remain explicit boundary evidence rather than fabricated Placement. Flat chronology exists only through the explicit `timeProjection=list` lens.

Stage-gate readiness is derived from contributor completion plus owner-selected `all` or `threshold_count` policy. Final gate completion remains a separate manual paint event. Past-but-unpainted outcomes remain visible and receive overdue treatment rather than automatic completion or deletion.

The deployed `window.__temporalFrameworkPluginApi` may capture and restore only view mode (`time`, `outcome`, or `effect`), selected framework, Time breadcrumb, Outcome breadcrumb, scale and relation lens. Unknown modes fall back to `time`; restore is environment-only and must return `contentWrite: false`. State Capsules does not currently consume this API, so Temporal Framework view state is not yet included in capsule capture/restore.

Trace: repository-dev `workspaces/26- supermemoconcept的改进/插件/temporal-framework`; direct-milestone implementation/deployment backups `state/backups/temporal-direct-milestone-tree-ui-20260813-135144` and `state/backups/temporal-direct-milestone-tree-deploy-20260813-141453`; effectiveness implementation/deployment backups `state/backups/temporal-milestone-progress-effect-view-20260817-132500` and `state/backups/temporal-milestone-effect-deploy-20260817-134728`; Outcome-overview tree implementation backup `state/backups/temporal-outcome-overview-tree-20260830-010434` and deployment backup `state/backups/temporal-outcome-tree-deploy-20260830-041500`; Time-tree Repository Dev backup `state/backups/temporal-time-horizontal-tree-20260904-181000`, plan verdict `state/verification_inputs/temporal-time-view-horizontal-tree-20260904/PLAN_VERDICT.md`, final verdict `state/verification_inputs/temporal-time-view-horizontal-tree-20260904/FINAL_VERDICT.md`, documentation recheck `state/verification_inputs/temporal-time-view-horizontal-tree-20260904/DOCUMENTATION_RECHECK.md` and deployment backup `state/backups/temporal-time-tree-deploy-20260904-183802`. After explicit user confirmation and an independent deployment preflight `PASS`, only verified `main.js` was synchronized. Dev/Runtime/Mirror now align at `BABCE50EEA798526DEE7A30AFE212155863B277CEA09B6DC7B5F846E66E86181`; protected Runtime content remained byte-identical. Loaded Obsidian interaction smoke remains pending reload.

## Ontology Keyword Index Contract

status: repository_dev_verified_runtime_pending
updated: 2026-08-10

The Ontology Keyword sidecar is owned by `keyword-index-plugin`; `ontology-meta-hub` is its UI/index consumer, while Workspace Mount and Mandala remain Ontology owner/provider boundaries.

The additive API is `window.__keywordIndexPluginApi.ontologyKeywordIndex` with `listKeywords`, `listKeywordsForTarget`, `createKeyword`, `updateKeyword`, `removeKeyword`, `rebindKeyword`, `getRevision` and `getDiagnostics`. The owner publishes `ontology-keyword-index:ready`, `ontology-keyword-index:unavailable` and `ontology-keyword-index:changed` with provider identity/generation and revision only.

Persisted target identity is `ontology-owner-ref:v1`:

```json
{
  "addressVersion": "ontology-owner-ref:v1",
  "targetKind": "owner",
  "providerId": "...",
  "scopeId": "...",
  "familyId": "...",
  "stableRefVersion": "...",
  "stableRef": {}
}
```

Titles, row order, array indexes, provider generation, lease tokens and stringified opaque objects are not identity. Records use `okw-` ids; one target accepts many labels, an active label accepts one target, and duplicate binding is rejected. Delete is a retained tombstone with `targetSnapshot`; ids enter `reservedIds` and are never reused. Consumers must not directly read/write the sidecar or infer deletion from provider unavailability.

The Hub Keyword capsule is a discovery locator. It must not invoke `openOntology` directly: the consumer resolves the exact structured owner identity through bounded provider pages, derives any source-group selection from the matched descriptor, and only then atomically switches the Hub family/source projection and highlights the owner row. Incomplete scans, provider/lease drift, unavailable summaries or incomplete declared source facets leave the current surface unchanged. The sidecar API and persisted target schema are unchanged by this UI contract.

### Backlink Proof Sharing And Incomplete-Zero Semantics

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-07

- Backlink display is a Hub-owned deterministic reduce over bounded owner-provider pages. Multiple visible cells share one in-flight proof; they do not each launch a whole-provider scan.
- A complete in-memory proof may be reused until a formal reference mutation or provider lifecycle change invalidates it. An incomplete proof receives only a short retry cooldown and cannot become a durable negative index.
- Exact `被引用 N 处` wording requires a complete proof. An incomplete result uses `至少 N 处引用 / 索引尚未完整验证`, or `未发现引用 / 索引尚未完整验证` when no edge was observed.
- Provider-specific timeout/failure reasons remain diagnostics. Incomplete proof never authorizes source deletion, column deletion, row deletion or reference-bearing rewrite.
- Provider-set changes invalidate both the shared proof generation and strict mutation epoch. A transaction cannot commit against a participant set that became incomplete while it was running.
- Backlink display descriptors are provider-owned, bounded labels only. The readable path is `source / Ontology object / parent column / child column / ...`; row labels and row ids never enter the normal display lineage. Canonical cell addresses retain row ids for exact identity and navigation, and Chinese row/column-id wording is only a legacy fallback when no descriptor can be resolved.
- A fresh editor session invalidates the display proof so renamed owners or columns can be reflected. If this happens during an older scan, every waiting read discards the stale generation and joins exactly one current-generation rescan; mutation proofs remain fail-closed rather than rolling forward implicitly.
- The Meta capture pointer is a transient selection affordance. Outside Meta mode it is hidden without layout space; provenance, incoming backlinks and error diagnostics remain independently visible.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260807-ontology-reference-proof-save-hotfix.md`; `memory/obsidian-plugin-system/change-records/2026/2026-08/20260807-024008-ontology-readable-backlinks-meta-pointer.md`.

## Next Action Workbench Frontier And Confirmed Source Reveal Contract

### Action entry from the Workbench (2026-09-16 candidate)

status: staging_verified_runtime_pending

Workbench may initiate creation of a root action under its selected effective primary. Collection Card owns the content write. `prepareOperationalRootItem` resolves the exact current domain/sourceScope/primaryNodeKey through the final Mandala snapshot, then resolves its stable contextKeyId through current PEO descriptors and the Collection-owned Tab keyword binding. Empty bound Tabs are valid. Missing, multiple, stale or malformed bindings fail closed; local Workbench names and historical aliases never authorize writes.

`createOperationalRootItem` accepts the prepared destination, title and durable requestId. It revalidates the destination, appends a root item and an idempotency receipt to the original Collection JSON atomically, and returns the canonical Collection nodeKey. The additive `actionEntryReceipts` field remains Collection-owned and survives ordinary saves. A receipt replay never recreates a subsequently deleted item. Ordinary view persistence and action creation share a per-file queue; matching hosts receive updated content while keeping their active Tab and collapse state. Binding saves share that queue. The new path does not activate or change the selected Collection Tab.

Workbench owns `newActionDrafts[membershipId]` in its own store, including the request identity and prepared destination. Implicit closure retains input. Unknown write outcomes keep the request frozen for retry; only a confirmed absent receipt permits editing/re-preparation. A committed write and a failed projection refresh are separate outcomes. Creation emits an immediate dirty hint; Workbench refreshes only the selected membership, confirms the returned nodeKey is observed and allows one further refresh for a pre-existing in-flight projection. Completion, aliases and Ontology retain their existing ownership.

Contract impact: Collection Card provider and Next Action Workbench consumer change together; Mandala final snapshots, PEO projection APIs, EVA and Workspace interfaces are unchanged. No runtime data migration. Native loaded-host smoke remains pending deployment. Tests and reproducible candidate build: `state/staging/next-action-create/`.

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-15

Next Action Workbench is an execution-frontier owner, not a completeness oracle. It imports currently observable Collection Card actions only for active Mandala goal/project memberships and presents them as material for progressive decomposition. The UI may say `当前已观察到的执行前沿`; it must not claim that no action is missing merely because the current import completed.

Ownership and identity:

- Collection Card remains owner of source card text and node identity. Mandala/Project Overview remain owners of active managed-primary identity and grouping evidence.
- Workbench stores its own membership links, observation health, recovery drafts and one independent Ontology document per actual source Collection Card. These Ontologies begin at `1 x 1`, share no Schema, and are intentionally excluded from Ontology Meta Hub registration.
- A source link is identified by managed-primary membership plus Collection Card `nodeKey`. The same card observed under several primaries remains a many-to-many source relation; missing evidence is assessed per link rather than by globally deleting the card.
- Truncated, unavailable or stale provider evidence cannot prove absence and cannot authorize destructive pruning.

Confirmed return-source navigation:

- Project Overview provides additive `revealItemNodeConfirmed(nodeKey, options)`. A caller supplies `primaryNodeKey` and optional `primaryAliases`; goal membership requests `mandala` grouping and project membership requests `workspace` grouping.
- Resolution is strict: Project Overview must match both the requested primary identity and Collection Card `nodeKey`. It must not fall back to another group that happens to contain the same card.
- Success means the target row was actually revealed and highlighted, not merely queued. Activation, grouping-mode persistence, refresh and reveal share one bounded request session and deadline.
- A newer request supersedes the older one. Timeout, view close, refresh failure and plugin unload cancel the request, prevent stale refresh commits and restore the baseline grouping mode when the request changed it. Unload rollback is awaited before teardown completes.
- Navigation is environment-state only. It does not edit Collection Card, Mandala, Workspace, Project Overview business content or Workbench Ontology data.

### Primary-group Source Projection And Ordering Refinement

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-16

- Managed-primary identity and Collection Card capsule identity are distinct. Workbench membership labels and stable refs identify the goal/project primary; `carrierId/carrierLabel/contextKey` identify the source Collection Card capsule. Neither label may be used as the other's lookup key or fallback identity.
- Project Overview provides additive `getPrimaryCollectionCardSnapshot(options)`. It resolves `group.columns.collection` by exact `primaryNodeKey`, using aliases only as a compatibility fallback. Multiple alias matches return `ambiguous-primary`.
- A found group with an empty Collection column is complete zero only when EVA is available and the overview model is below node/edge hard limits. Provider failure, timeout, unavailable EVA, missing primary or truncated model preserve the Workbench's old membership links and cannot mark them source-missing.
- Project Overview flattens internal carrier fields into the Workbench source-bucket contract. Concurrent requests in one Workbench refresh share one in-flight overview build per grouping domain.
- Mandala's `listTimelinePlanningTargets({ orderPolicy: "next-action-workbench-v1" })` is an opt-in ordering projection. It orders capsule levels `0 -> A -> B -> C -> CZ`, then uses Timeline's current-day wave rank within one level, then stable Project Overview order. Calls without that policy keep their previous order.
- Workbench renders separate `目标主键` and `项目主键` Tabs with independent selection state. Source rows may additionally show `胶囊：<carrierLabel>`; this is provenance, not the primary title.

### Effective Operational Context Admission And Lifecycle Refinement

status: repository_dev_verified_runtime_pending
updated: 2026-08-31

- New project candidates come only from Mandala's complete v1 `listEffectiveOperationalContextKeys()` final snapshot. Workbench no longer combines `listTimelinePlanningTargets()` with an independent Project Overview lifecycle read.
- Import preserves the existing membership object and user-owned local fields while updating observed source identity/label and eligibility revision.
- After a successful complete snapshot, an existing project membership missing from the final set becomes inactive with `reason: not-in-effective-operational-context-snapshot`, the observed eligibility revision and observation time. Reappearance clears the inactive reason without creating another identity.
- Provider failure, timeout, incomplete/truncated evidence or unsupported contract version is a no-op for existing membership lifecycle. It may block new admission, but cannot deactivate everything.
- The frozen v1 envelope includes `generatedAt/providerGeneration/revision` plus bounded count fields; every target must carry one full Workspace `jump:v1` identity and `contextKey.contextKeyId/address/canonicalLabel/displayLabel`. A non-project, inactive, malformed, revision-mismatched or duplicate-owner target invalidates the whole snapshot. Workbench must not silently filter/deduplicate an invalid snapshot into a smaller apparently successful set.
- Existing source links, completion state, aliases, Ontology and history remain retained. Eligibility refresh does not delete Workbench data or write Workspace, Project Overview or Mandala business JSON.

### Primary Local Name And Completion View Refinement

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-19

- Next Action Workbench owns one optional local display name per imported primary membership. The retained v1 fields `keywords` and `membershipKeywords` are interpreted as a history-preserving name store, not as a classification index: one membership has zero or one current name binding.
- `目标清单` and `项目清单` directly display `local name || source primary label` and sort the complete mixed named/unnamed list alphabetically by that final display name. On desktop the list is a single left-hand column beside the action workspace; below `760px` it stacks above the workspace. It is not a keyword filter rail or a Collection Card capsule list.
- The left list does not become an independent scroll owner. Long labels wrap in place, while `.next-action-workbench-view` remains the page scroll owner so list and action context move together.
  - Scoped exception (2026-10-14, user request): in Collection Card's 下一步行动台 (`.collection-action-mode`, window width ≥761px) the left key list is sticky below the toolbar and scrolls on its own, keeping its scroll across re-renders; picking a key brings the item list into view. NAW's standalone view is unchanged. Trace: change-records/2026/2026-10/20261014-collection-action-tags.md (fix3).
- The local name never changes Mandala, Project Overview, Collection Card, global Keyword or Ontology Meta Hub data. When the local name differs, the source primary label remains visible as secondary identity and remains searchable.
- Name replacement creates a fresh membership-scoped, never-reused ID and atomically replaces the current binding. Clearing removes only the binding. Historical definitions and all reserved IDs remain intact; legacy multi-bindings retain the first valid ID in original array order without deleting later definitions.
- Completion is local to a membership plus source-card link (`completedAt`), not to the shared Collection Card source. A completed link moves into an `已完成` section with a visible completion state and can be reopened; the same card under another primary remains independent.
- The same membership-plus-source-card relation may own one optional Workbench-local action alias. Display and ordering use `local alias || source card label`; when an alias exists, the original source label remains visible and searchable. Pending and completed sections use the same deterministic comparator.
- Relation aliases live in the independent root `sourceAliases[linkId]` map rather than inside refresh-rebuilt source links. This preserves aliases across complete, truncated, missing and recovered source observations and across rollback to an older v1 bundle that rebuilds links but retains unknown root fields.
- Name editors are keyed by typed owner keys (`primary:<membershipId>` or `source:<linkId>`). One owner has one editor; close-in-flight saves remain registered until settled, and plugin unload drains active and closing saves before teardown.
- Local-name writes and completion use the existing Workbench transaction/readback path. The name modal auto-saves edited input, including implicit close paths. No bridge, provider, source JSON or other plugin change is required. Search matches local names, source primary labels and source-card labels.
- Repository Dev build and all Workbench regressions pass for the corrected local-name semantics; Runtime/Mirror synchronization is handled by the associated change record.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260819-next-action-primary-keywords.md`; correction backup `state/backups/next-action-local-name-20260819-153240`; deployment backup `state/backups/next-action-local-name-deploy-20260819-155357`; final verifier Hooke `01a018fb-96df-7002-98e3-41b6c7f20c3b`.

Layout refinement trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260820-next-action-left-list-layout.md`; backup `state/backups/next-action-left-list-20260820-130021`.

Action-alias refinement trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260820-next-action-source-alias.md`; backup `state/backups/next-action-source-alias-20260820-140252`.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260816-next-action-workbench-source-projection.md`; implementation backup `state/backups/next-action-workbench-source-projection-20260815-172009`; deployment backup `state/backups/next-action-workbench-source-projection-deploy-20260816-011734`; final implementation verifier `01a00660-e3cd-7e23-a417-0fa231a83636`; deployment verifier `01a00671-1802-7042-8631-b28f3c8eb05e`.

Compatibility and verification:

- Existing Project Overview callers remain compatible because the API is additive. Workbench fails closed with a visible unavailable/failure state when the confirmed-reveal capability is absent or does not confirm the exact target.
- Repository tests cover source-link identity, recovery revision/session/generation guards, strict duplicate-card navigation, superseded/timeout/view-close/unload cancellation and unload after grouping-mode change.
- Dev/Runtime/Mirror program hashes align and deployed syntax/tests pass. Project Overview business `data.json` hashes remained unchanged across deployment. Loaded Obsidian interaction smoke remains pending plugin reload.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260815-154720-next-action-workbench-return-source.md`; deployment backup `state/backups/next-action-workbench-deploy-20260815-161312`; verifier `01a00476-f6ec-70f1-8215-9dd395a1884a`.

## Mandala Project Tracking Membership And Ontology History

status: repository_dev_verified_runtime_pending
updated: 2026-08-22

- Contract owner: Mandala Time Blocks. Timeline, Ontology Meta Hub, Next Action and Temporal consumers must not independently infer project tracking membership from retained `projectPlanRowsByKey`.
- Current membership is the normalized stable Workspace-owner set admitted by Mandala's final Timeline project-target rule with `includeStopped:false`: valid full Workspace identity, newest lifecycle record per alias, terminal non-stopped state and usable target label. The intermediate weekly row projection is not membership authority because it may retain a stopped row in its stop week.
- Retained plan rows and formal project instances are history evidence, not current-membership proof. Descriptor matrix: active final-admitted owner = `current/attached/available`; stopped or legacy plan-only owner = `historical/attached/unavailable`; instance-only owner = `historical/orphan/unavailable`.
- Stable owner alias, `stableRef`, formal Ontology content and shared project Schema survive stop/resume. Historical navigation is read-only and must not receive document commit, recovery persistence or Schema-only authority through a current sibling.
- Hub filter requests must keep `states` and `includeHistorical` atomic. Ordinary filters are current-only; explicit History is history-only. An identity jump may scan broadly only for discovery and must revalidate under the final committed mode before changing the surface.
- This is a read-time classification refinement. No business JSON schema, provider contract version, stable-ref version or owner persistence format changes.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260822-105345-ontology-project-tracking-parity.md`.

## State Capsules Current-Use Exit And Workspace Content Snapshot Separation

status: documentation_contract_no_runtime_change
updated: 2026-09-03

- State Capsules owns environment/UI starting-point capture and restore. The user's current practice no longer uses that surface for state switching (`confirmed_by_user`), while the implementation contract remains present (`confirmed_by_code`). Workspace Mount's provider/apply surface is broad, but current State Capsules capture persists a narrower projection: `activeTabId`, `tabCount`, Tab-tree/item collapse, both paradigm-mount collapse maps, pinned scroll and `visibleUiState`. Provider fields `tabOrder` and keyword-drawer expansion are omitted by current capture; restore can still apply them only when they already exist in legacy stored state.
- Workspace Mount owns content snapshots through `snapshotsById` and `snapshotOrderByTab`; restore materializes a new Tab with fresh item identities. This is independent of State Capsules, whose Workspace state includes only environment/UI values such as snapshot-panel visibility.
- A bounded Dev/Mirror/Runtime code scan found no direct external consumer of Workspace Snapshot methods or storage keys. This narrows the known dependency surface but does not prove absence of manual value, historical data, or unscanned consumers.
- No schema, API, bridge, UI behavior, or business data changes are made by this documentation contract. Existing State Capsules and Workspace Snapshot code behavior remains authoritative until separately changed.

If Workspace Snapshot is retired later, the non-destructive order is:

1. retire or disable the active/default creation surface and stop producing new snapshots;
2. preserve historical fields as readable compatibility data while measuring the resulting hot-path effect;
3. inventory real data read-only, create a byte-level backup, obtain explicit user disposition, and verify migration before any archive or deletion.

Silent field loss through normalization, load/save, repair, or unrelated migration is prohibited. The sequence is an `inferred` candidate roadmap, not authorization to modify code or data.

The Workspace environment bridge has its own independent retirement decision. If authorized later, both sides must change together: State Capsules stops Workspace capture/apply/verification, while Workspace Mount stops only the `workspaceCapsuleBridge` registration, watchdog/heartbeat and mutation-time state publication. Legacy capsule `workspaceMount` values remain readable and inert. This paired slice must not remove the independent Workspace content Snapshot feature, the shared generic bridge bus, or unrelated provider/API contracts. Static code shows a plausible steady-state saving; its real-host magnitude remains unconfirmed.

The section above is the preserved pre-implementation decision prior. It is superseded by the synchronized Runtime/Dev/Mirror implementation and remains only as dated decision history.

## Repository Dev Workspace Active-Bridge Retirement Contract

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-03

- `confirmed_by_user`: State Capsules no longer controls Workspace Mount state switching.
- `confirmed_by_code`: the paired Repository Dev implementation removes State Capsules Workspace capture/apply/verification/retry/stat paths and Workspace Mount's Workspace-specific BUS registration, heartbeat/watchdog, queued BUS apply and mutation-time publication.
- Passive control is the retained contract. `window.__workspaceMountPluginApi.getBridge()` / `ensureBridge()` resolves the live Workspace bridge directly; deliberate callers may still use `getState()` / `applyState()` without an active Workspace BUS transport.
- The shared generic bridge BUS and one-time initialization remain for unrelated channels. Removing or changing them is outside this contract.
- New capsules store `{}` for `workspaceMount`. Existing legacy values remain deep-cloned, readable and inert through load, overwrite and resave; restore exposes `historical-read-only` / `workspace-control-retired` and `verify.status: not-applicable` rather than applying them.
- Workspace Mount content Snapshot is unchanged and independently owned. `snapshotsById`, `snapshotOrderByTab`, Snapshot UI and create/preview/restore behavior are not part of this retirement.
- Actual Runtime, Repository Dev and Repository Mirror are aligned on the verified candidate hashes. Syntax, dual-bundle isolation and static contract sentinels pass; real-host performance and loaded UI behavior remain `unknown`. State Capsules is currently disabled in Actual Runtime and must not be described as loaded-smoke verified.

Bayesian update: `supersedes + refines` the earlier active contract; deployment evidence is `no_model_change`. Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-121700-workspace-active-bridge-retirement-staging.md`; deployment: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-143500-workspace-active-bridge-deployment.md`.

## Collection Passive Owner API Contract

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-03

- Collection Card no longer performs active State Capsules cache/host updates, generic BUS host registration, lease/unregister work, legacy global bridge publication, or scroll/render-time full state cloning for capsule transport.
- The retained contract is caller-initiated owner control through `window.__collectionCardViewPluginApi`. Existing non-bridge methods remain part of the shared API; `getBridge()` / `ensureBridge()` return a live passive bridge whose `getState()` / `applyState()` operate only when called.
- Host identity is exact-notePath and fail closed. A unique ready exact host resolves; an active ready exact host wins among several; unresolved ambiguity and an existing not-ready host return `null`; `ensureBridge()` opens a host only for a missing scope.
- A non-empty live view path outranks stale serialized leaf state after retarget. Serialized state may identify a host only when the live path is absent.
- State Capsules no longer consumes this bridge. New `collectionCard` fields are empty; historical values are deep-cloned through overwrite and generic store round-trips but are read-only and inert during restore.
- Passive apply is an environment/UI operation and must not write Collection business JSON. Collection source content, Context Capsule carrier snapshots, provisioning, navigation and other owner contracts are unchanged.
- GTD behavior and the shared generic BUS implementation are explicitly outside this contract. Unreachable State Capsules Collection compatibility helpers are a separate P2 cleanup, not an active transport.
- Repository Dev, Actual Runtime and Repository Mirror align on the verified implementation. Static hashes, six syntax checks, the no-write harness and 55 protected sentinels pass. Synthetic fixture timings establish avoided operations only, not production latency; State Capsules remains disabled in Actual Runtime.

Bayesian update: `supersedes + refines`; deployment evidence adds `no_model_change`. Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-152245-collection-card-active-bridge-retirement-dev.md`; deployment: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-182900-collection-card-active-bridge-deployment.md`.


## 2026-09-30 Mandala capture native-view contract (repository candidate)

Source status: confirmed_by_code; update: refines; runtime deployment pending. Provider/owner Mandala exposes native view type `mandala-time-blocks-capture-view` and `getTimeCaptureSourceNotePath()`; command `mandala-time-blocks:open-time-blocks-tab` is a standalone user entry. View state carries `sourceNotePath` and `captureId`. Consumer View Group Hub member `timeBlocks` uses provider source proof and native leaf creation/selection, never reads/writes record JSON or draft bodies. Selection and repair retain old-source leaves; restore creates no business file. Original modal/EVA APIs remain additive-compatible. See [provider](plugins/mandala-time-blocks.md), [consumer](plugins/view-group-hub.md) and [engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-001)（外部来源未随包提供）.


## 2026-09-30 Time-block native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Mandala 0.1.9 and View Group Hub 0.2.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-002)（外部来源未随包提供）.


## 2026-09-30 Timeline collection cleanup and native group entry

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Provider Timeline continues to own timeline-planner-view and all time-allocation JSON. Consumer View Group Hub adds environment member timeline without changing Timeline external APIs or claiming per-leaf source identity. Private Timeline-to-Project-Overview collection projection is removed; Next Action Workbench remains the user's aggregation entry and is unchanged. Native engine readOnlyInitialization is an internal context option, not a new cross-plugin persistence authority. Native empty/corrupt opens do not create/reset business files; embedded behavior and explicit edits retain existing contracts.

Runtime installation is pending separate task-specific approval; loaded native UI/scroll/multiwindow and switching latency remain unverified. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-003)（外部来源未随包提供）.


## 2026-09-30 Timeline cleanup and grouped entry — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. Timeline 0.1.1 and View Group Hub 0.2.3 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-004)（外部来源未随包提供）.


## 2026-09-30 日课 native tab and performance boundaries

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Mandala → View Group Hub adds member dailyLessons / view mandala-daily-lessons-view / command open-daily-lessons-tab; sourceBound true uses the same configured Mandala source identity as timeBlocks. View state contains sourceNotePath, dailyId and date, not draft bodies. Mandala owns daily JSON, UI sessions, recovery drafts, queues and Ontology authority. Hub owns only grouping, leaf adoption/selection and source identity checks. Legacy modal/EVA entry APIs remain available. Daily read/write contract is strengthened: strict read-only defaults, evidence-backed CAS, and symmetric modal/native sparse field-conflict protection. Image and ontology consumers remain on owner mutation APIs; provider registrations/identities are not cloned by native UI sessions.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-005)（外部来源未随包提供）.


## 2026-09-30 日课 native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK请部署”. Mandala 0.1.10 and View Group Hub 0.2.4 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-006)（外部来源未随包提供）.


## 2026-09-30 Time-view performance and historical capture boundary

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Time-view performance refines internal rendering and the user-requested capture date boundary; public view types, source identity APIs, primary-key chooser protocols and Hub member order do not change. Mandala alone owns time-record JSON and mutation queues. Before-2026-09-15 time records are a read-only capture/history partition in the same store; archived objects are not rebound, deleted or migrated on open. A successful current save publishes a fresh committed projection only to its owning native leaf; root CAS remains authority. Timeline owns lifecycle refresh coalescing and per-engine async rendering; no new provider, cross-plugin cache or business store is introduced. Hub remains an environment/grouping consumer and its prewarm policy is preserved.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-007)（外部来源未随包提供）.


## 2026-09-30 Time-view performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “Ok就请部署”. Mandala 0.1.11 and Timeline 0.1.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-008)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Hub 0.2.5 changes display grouping only: execution/collection4, execution-process4, review/planning3. Member keys, view types, source-setting bindings, retained-leaf selection, explicit repair and original prewarm order stay unchanged. GROUPS is a presentation projection over the frozen MEMBERS catalog; member providers require no matched changes. This supersedes old menu-column placement, not any content ownership or native view contract.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-009)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. View Group Hub 0.2.5 are installed in the proven NEWERA runtime; the three changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-010)（外部来源未随包提供）.


## 2026-09-30 Keyword BUS post-confirm performance

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Keyword BUS refresh batching is private derived-UI scheduling within the identity owner queue. It does not alter stable identity, registry schema, CAS, pending journal, backups/readback, publication retries, allocation or source note content. EVA adapter contract and awaited listItems/publication completion remain unchanged; no EVA provider edits are required. Source/live origin guards protect ephemeral expansion state; direct API callers without origin still refresh views. A transient originViewRefreshed result allows the existing modal callback to omit duplicate rendering only after successful live-source refresh. No serialized view reference is added.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-011)（外部来源未随包提供）.

Failure refinement: if both creation refresh and final drain fail, retain the deferred invalidation outside released batch ownership; the next explicit refresh or EVA event retries it, with no repeated note creation.


## 2026-09-30 Keyword BUS post-confirm performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Keyword Index 0.1.22 is installed in the proven NEWERA runtime; the two changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-012)（外部来源未随包提供）.


## 2026-10-01 Weekly native host / headless ordering refinement

status: repository_verified_runtime_pending
source_status: confirmed_by_code
update: refines

Mandala adds view mandala-weekly-tracking-view and command open-weekly-tracking-tab; Hub binds sourceNotePath and retains the real leaf. Native opening/restore never initializes missing business JSON or captures weekly rosters. Per-leaf ordinary recovery lives in Mandala plugin data weeklyViewDrafts, with source/view/tab/week/owner and copyable controls; not state-capsules. Whole-weekly-file render-baseline CAS rejects external changes, and save/refresh/close barriers prevent deletion of recovery while writes are pending.

PEO adds async getWorkspacePrimaryOrderSnapshotAsync(): same leading-primary rank semantics as synchronous API, fresh owner model independent of open leaves, shared same-mode in-flight construction, unavailable/truncated models reject. Mandala weekly helper prefers async; failures do not use stale sync fallback. Sorting and eligibility remain separate: Workspace owns project carrier, PEO declaration/Kill, Mandala tracking/final effective-set projection. No eligibility caching, business migration or grouped-member inference is introduced. Print uses the same ordering helper.

Evidence: [weekly implementation record](../../../REFERENCE_BOUNDARIES.md#ref-013)（外部来源未随包提供）.


## 2026-10-01 Weekly native performance — approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this reviewed package with “请部署”. Mandala0.1.12, PEO0.1.6 and Hub0.2.6 main.js/manifest.json are installed in the proven NEWERA runtime. Program hashes match reviewed Dev/Mirror candidates. No business JSON/settings/index copied and no plugin reload triggered. Prior ownership and safety contracts remain; native UI/latency acceptance is still pending. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-014)（外部来源未随包提供）.


## 2026-10-01 Keyword restart-cache ownership

status: repository_verified_runtime_pending
source_status: confirmed_by_code
update: refines

Keyword owns .obsidian/plugins/keyword-index-plugin/scan-source-cache.json as disposable parsed-source evidence. It is not a registry of permanent identity and no consumer may treat it as the keyword_index.json authority. JSON Asset Registry classifies this exact path as derived-cache; registry reads/classifies only. Cache scope/native proof/checksum/schema failure means fresh source reads; successful identity/EVA flow precedes optional cache publication. No cross-plugin API or identity schema change. Metadata reuse is not a content-hash guarantee; explicit full verification remains the authoritative reread option. Runtime deployment remains pending. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-015)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Keyword0.1.23 and JSON Asset Registry0.1.3 reviewed program/document bytes installed in proven NEWERA runtime. The first successful scan seeds the new cache; later ordinary scans may reuse unchanged sources across restart. Complete inventory/native proofs/identity/EVA work remains. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-016)（外部来源未随包提供）.


## 2026-10-01 Weekly source resolution correction

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: corrects

User observed Hub weekly source-note-unproven-configure-settings. Runtime Mandala source is configured and exists; Hub0.2.6 accidentally omitted weeklyTracking in three Mandala-specific branches. Hub0.2.7 includes weeklyTracking alongside timeBlocks/dailyLessons for getExpectedSourcePath, repair notice and select-time source checks. Mandala getTimeCaptureSourceNotePath remains source authority; saved Hub identities cannot override it. Missing owner source stays unavailable, wrong-source leaves/drafts remain retained pending explicit repair. This corrects the earlier weekly integration claim; no new schema, source discovery scan, Mandala change or business write. Node behavior regression passes; native reload pending. Framework/Atlas update check: updated, FW-019 consumer contract correction. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-017)（外部来源未随包提供）.


## 2026-10-01 Weekly source fix approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this repair package with “确认”. Hub0.2.7 main/manifest installed in proven NEWERA runtime. Weekly source lookup, repair notice and source-switch guard now share the Mandala owner path used by daily lessons/time blocks. Existing source note and business data remain unchanged; old leaves/drafts retained. No native reload or live UI acceptance claimed. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-018)（外部来源未随包提供）.


## 2026-10-01 Weekly tab switching refinement

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: refines

Mandala0.1.13 addresses user-reported four-tab switching lag. Shared legacy/native renderer skips clicking the already active tab; project rows and effective-key reads run concurrently and drain both on failure. Native host alone uses an exact-weekly-file read snapshot limited to one render, initialized after saves and discarded in finally or before write attempts. Repeated readers parse those bytes once and receive independent clones; final fresh disk evidence still rejects changes. No cross-render cache or PEO/Timeline eligibility/order cache. Legacy flush remains; native redundant base-render flush is skipped only for a truthy matching host token after the host flush barrier. Source-switch, CAS, old editor/recovery retention and real upstream lookups remain.

Native weekly recovery button is hidden when the current source has zero stored/in-memory recoveries and otherwise shows count. Recovery panels remain readonly/copyable and repeated opening replaces that panel. Render phase metrics contain tab/timings only (save barrier, initial read, page build, verification, commit); asynchronous textarea layout/paint is outside this metric. Node12 and Edge23 fixture checks pass, including previous safety regressions and scoped-read freshness/clone/write-error tests. No live-vault timing claim; full DOM rebuild and upstream model cost remain. Framework/Atlas update check: updated/refines FW-011 and existing save/source contracts; no authority/schema change. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-019)（外部来源未随包提供）.


## 2026-10-01 Weekly switching optimization approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “请部署”. Mandala0.1.13 main/manifest installed in proven NEWERA runtime. Native weekly page shares one render-scoped weekly read and skips an authenticated redundant flush; shared tabs ignore current-tab clicks and project reads drain concurrently. Recovery entry displays only when source-matched drafts exist, with count. Final disk verification, source guards and draft protection remain. No cross-render eligibility cache, business/settings copying, native reload or live speed claim. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-020)（外部来源未随包提供）.


## 2026-10-01 Reference restart-cache ownership

status: repository_verified_runtime_pending
source_status: confirmed_by_code
update: refines

Reference Graph Widget owns .obsidian/plugins/reference-graph-widget/session-snapshot.json as disposable parser evidence and unverified graph previews. It has no authority over note links, EVA relations, identity or geometry caches. Registry0.1.4 classifies that exact path derived-cache. Native metadata proof is required for body reuse; disk graph freshness is never inherited across restart. Current owner sources must be rebuilt even when a preview appears immediately. No public API/event/schema changes for consumers. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-021)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Reference Graph Widget0.1.1 and JSON Asset Registry0.1.4 reviewed program/document bytes installed in proven NEWERA runtime. The first explicit graph use seeds the bounded restart cache; later openings may reuse unchanged parsed sources after native proof checks. Restored graphs are previews and rebuild current links/backlinks/EVA. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-022)（外部来源未随包提供）.


## 2026-10-01 SuperMemo meaning capsule Note consumer

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code

SuperMemo meaning navigation additionally consumes Keyword Index's existing getKeywordNotesForNode(targetNodeKey) / openKeywordNote(path) public APIs. The owner resolves keyword/drawer scope and supplies real note paths; SuperMemo only deduplicates by path and asks the user when more than one remains. Index navigation continues through EVA.openNode, and capsule-body reveal stays local to Antinet. Hover does not load the repository. API signatures, identities, owner schema and the existing Project Overview consumer are unchanged. Runtime deployment and native acceptance remain pending. Update refines; trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-supermemo-meaning-navigation.md.


## 2026-10-01 Meaning navigation approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (请部署)
update: reinforces / no_model_change

User approved the reviewed two-file meaning navigation package. Runtime/Dev/Mirror engine and styles now match the reviewed hashes. Fresh byte backups, runtime syntax, seven isolated deployed-byte regression suites and nine unchanged non-target file sentinels pass. Only engine/styles were copied to the proven NEWERA runtime. No user business data/settings/index/cache written; native reload, multiwindow/zoom and actual UI acceptance remain pending. This supersedes the previous deployment-pending status for this feature. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-supermemo-meaning-navigation-deployment.md.


## 2026-10-03 Antinet inspector reuses Keyword navigation contract

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

SuperMemo Antinet inspector and meaning capsules share the same temporary navigation component. Provider: Keyword Index (note identity/list/open), EVA (Index navigation); consumer: SuperMemo. Exact mount.targetNodeKey is passed to existing APIs. User explicitly chooses Index or Note; no owner read on hover, zero notes reports absence, one real path opens, multiple unique paths require selection. Local aliases do not become Note paths.

Changed contract: source UI offers two destinations with context-specific accessible label; existing helper default, DOM classes, EVA/Keyword APIs, JSON schemas and identities are unchanged. Project Overview also consumes the same Keyword APIs and requires no matching change. Explicit inspector navigation bypasses Meta capture; tree-body Meta capture remains separate. No persisted or restore-time write added. Existing shared menu lifecycle invalidates late results after close, redraw or provider replacement. Runtime and native-host acceptance pending. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-antinet-navigation.md.

Meaning viewport memory is private to the source engine session (maximum 80 project/query entries). It samples only its own panel/known plugin host, never provider DOM or active workspace inference. No public API/selector/schema addition; explicit reveal overrides restoration. Position memory does not survive plugin reload.


## 2026-10-03 Antinet navigation and meaning scroll approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (OK就请部署)
update: supersedes / no_model_change

The user authorized this reviewed package. Only supermemo-concept-display-engine.js was copied to the proven NEWERA runtime after a fresh baseline check and byte backup. Runtime/Dev/Mirror engine now agree at SHA-256 d76a50ab167cee006eba518e049da3134eb81d1f1c19f338ef3b8f3914e20ff6; all seven production files agree across the three roles. Runtime syntax, seven isolated regression suites run against deployed bytes, and ten unchanged non-target runtime file hashes pass. Atlas/Framework trace records deployment, without changing ownership or schemas.

Both Antinet Index/Note choices and per-view-session meaning project/search scroll retention are installed on disk. Existing loaded Obsidian code has not been reloaded or tested; user-controlled plugin reload/restart and real-data/multiwindow acceptance remain pending. Positions reset when the engine/view session ends. No business JSON/settings/index/cache copied or modified. This supersedes deployment-pending statements for this package. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-antinet-navigation-deployment.md.


## 2026-10-03 SuperMemo Note at source tab-group end

status: repository_verified_runtime_pending
evidence_status: confirmed_by_user (far-right tab destination); confirmed_by_code
update: refines

Provider Keyword Index; consumer SuperMemo Concept Display. Additive navigation contract: openKeywordNoteAtTabEnd(noteOrPath, sourceLeaf) -> Promise<boolean>. Caller supplies its actual live source leaf, never an inferred active leaf. The provider validates file and source identity and creates a new tab after all siblings in that source group. Missing source/API returns false with Notice; file-open exceptions propagate to consumer failure handling. Existing openKeywordNote remains backward compatible; Project Overview requires no change. SuperMemo requires the new method and does not silently fall back to the old position. No persisted leaf identity, JSON mutation, provider DOM access or closed-tab restoration.

Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-note-tab-end.md.


### 2026-10-03 Note tab-end deployment
status: runtime_deployed_native_acceptance_pending
User explicitly confirmed deployment of this package. SuperMemo main/engine and Keyword main synchronized from reviewed dev to proven NEWERA runtime; runtime/dev/mirror SHA-256 agree. No business data changed. Host/plugin reload and actual rightmost-tab placement remain user acceptance pending. Evidence: state/staging/supermemo-note-tab-end-20261003/deployment.json.


## 2026-10-07 大千统一内核过渡（原 owner 尚未移交）

source_status: confirmed_by_user / confirmed_by_memory; target_behavior: inferred; update_type: refines / reinforces

用户要求共同业务数据、原视图/功能保留、固定 ID 及可改/重复编号。P4-A 接管/身份/存储方案已独立核查，但实际原 owner 未因此改变；未迁域仍属原 owner，NAW 不代表 GTD，结构编辑器不代表全部 Workspace。原生可写数据统一另按 P4-E 验收。详见[统一内核过渡](knowledge/unified-core-transition.md)，那里分列代码快照、仓库验证、设计及 unknown。既有本页历史 runtime/部署条目不是本项目 NEWERA 访问/写入授权。

## 2026-10-13 项目主键管理与改名协调

source_status: confirmed_by_code；update_type: refines / corrects

入口和范围见[统一主键管理](knowledge/unified-context-key-management.md)，具体接口见[API registry](api-registry.md)。Mandala绑定完整Workspace主键并写本域追踪；PEO预览、持久intent、声明回读后经各owner冻结计划同步。项目域UI入口不等于双域管理或永久registry；独立宿体仍为建议。

`project-execution-overview:context-key-renamed-v1` 提供 `{version:1,nodeKey,sourceScope}`，sourceScope指Workspace源；NAW的membership scope指Mandala源，不能直接混用。事件仅触发失效，NAW按完整subject重新读取声明名称并独立查询资格；停止追踪者的来源名称也可更新，本地名及inactive状态不因此改变。Temporal仍按既有查询路径读取。

恢复保留部分成功并先verify，source/声明/计划漂移不盲重放；已核验、无匹配、未启用排除是不同结果。旧评论窗口不能覆盖新声明，冲突时保留持久草稿。代码落盘/用户重载/原生验收分别记录。


<a id="antinet-drawer-projection-v1"></a>
## 2026-10-26 Antinet drawer projection v1

source_status: confirmed_by_user + confirmed_by_code
status: runtime_deployed_native_acceptance_pending
update_type: refines / supersedes

Provider/owner: Keyword Index；consumer: SuperMemo Concept Display；真实挂载关系 owner: EVA。`window.__keywordIndexPluginApi.drawerProjectionContractVersion === 1` 提供同步只读 `getDrawerProjection({nodeKey,maxNodes})`。它不执行仓库load/save或EVA注册；返回 `contractVersion,status,complete,stableIdentity,rootNodeKey,nodes`，ready快照还含 `revision`。节点含 `nodeKey,parentNodeKey,label,kind,type,pathParts,stableIdentity`；kind区分drawer/bus-drawer/subconcept，pathParts保留原始SCON片段。挂载抽屉只返回后续结构，root-notes不伪造新业务抽屉。

来源不可用与 `complete:false` 不能解释为删除。provider默认最多1500节点，请求范围限制1–5000、遍历深度48；consumer组合树默认2000预算与64个挂载来源预算。手动节点始终保留，超限会提示，不能据此承诺固定总DOM数。折叠限制可见结构，不代表每次只向provider查询一层。

缓存基于普通 `repository.index` 对象及identityRegistry.revision，条目再核对keyword/notes引用；`keyword-index:drawer-projection-changed` 在onload/onunload/refreshEvaAdapter通知consumer。该通知不是业务写入请求，也不是ontology关键词事件。

Consumer的自动节点仅为派生态。schema2手动节点以真实parentId保留所有权，以drawerAnchor记录relationId、sourceNodeKey、lastKnownLabel；创建/重新附着前需可用永久身份及有效挂载作用域。source显示名不能替代身份。经来源身份事务确认的改名可延续，未确认的手改路径须保留失联子树；同源不同挂载的手动扩展相互独立。移回普通父级仅清该节点anchor，后代保留；归档按真实所有权树处理。不得为每个自动抽屉创建持久节点/EVA关系/义胶囊。

UI、搜索、折叠、检查器与目录导出使用组合视图；重复来源沿祖先链停止展开，保留来源入口。导出标注自动/待恢复、源身份及不完整提示。schema1只读入内存兼容，编辑才落schema2，旧版拒写；此迁移没有解决跨库localStorage共享，参见[SM-U01](unknowns-register.md)。

证据：[独审](../../../REFERENCE_BOUNDARIES.md#ref-023)（外部来源未随包提供）、[部署](../../../REFERENCE_BOUNDARIES.md#ref-024)（外部来源未随包提供）、[实现经验](../../../REFERENCE_BOUNDARIES.md#ref-025)（外部来源未随包提供）。10-22程序落盘已经完成，原生功能验收仍待证据。
