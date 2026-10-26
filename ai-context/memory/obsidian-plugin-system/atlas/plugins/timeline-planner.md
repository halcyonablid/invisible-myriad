# Plugin: timeline-planner

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-09-01

Timeline Planner owns Timeline items, date ranges, `daySlots`, the seven canonical time stages, milestones, and `Timeline_Data.json`. Consumers may request bounded read-only projections; they do not gain write ownership.

## Canonical Daily Wave Order

The visible wave UI and the primary-wave owner snapshot use one pure `buildTimelineDailyWaveOrder()` helper. For each day, active items inherit the previous day's surviving order; newly active items append by creation time/name/stable id; scheduled items then move ahead by canonical time-stage order while preserving inherited order inside a stage.

`getPrimaryWaveOrderSnapshot({ date })` replays from persisted `settings.viewRange` start through the requested date. A custom end earlier than the date does not replace the replay start. Invalid/future/over-bound starts, item/date/operation limits, malformed evidence, or truncation return incomplete evidence so consumers can fall back without using a partial rank.

The canonical snapshot excludes `schedule` rows, includes ordinary/manual rows while calculating inherited positions, ignores transient tag/only-scheduled/Mandala-domain UI filters, and only then projects strict Mandala goal/project identities. Duplicate stable identities retain the topmost rank and remain diagnosed.

The API is read-only: it does not activate a Timeline view, save range state, or write `Timeline_Data.json`.

## Effective Operational Context Admission

status: confirmed_by_user_and_code

Timeline owns its own items, `daySlots`, milestones and historical date evidence; it is not allowed to infer whether a retained project is still eligible for forward time allocation.

- Project import/default lane obtain candidates only from Mandala's complete `listEffectiveOperationalContextKeys()` v1 snapshot; goal import/default lane use the complete `listEffectiveGoalOperationalContextKeys()` v1 snapshot. The consumer validates the matching full Workspace or Mandala `jump:v1` identity, envelope, active lifecycle and duplicates before admitting the batch. Failure is fail-closed and never falls back to the wider `listTimelinePlanningTargets()` pool.
- A valid final target is mapped to Timeline's established `mandala-time-blocks::project::<Workspace jump:v1>` external key. This updates a retained Timeline item if it exists rather than duplicating project history under a new key.
- A valid goal target maps to Timeline's established `mandala-time-blocks::goal::<Mandala nodeId>` external key while retaining the full Mandala eligibility source key; same label across domains cannot merge identity.
- An item that later drops out of its domain's final snapshot remains in `Timeline_Data.json` with dates, slots and milestones intact. Normal forward surfaces hide it; explicit project/goal history routes are read-only. A historical item cannot be reallocated, receive a milestone, or be edited from Timeline.

This makes Timeline a time-allocation consumer of the common current eligibility projection while preserving its independent historical record ownership.

Trace: `change-records/2026/2026-08/20260805-weekly-abc-today-wave-order.md`.


## 2026-09-30 Timeline collection cleanup and native group entry

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

User requests that Timeline stop duplicating collection aggregation now available in Next Action Workbench. Timeline 0.1.1 removes the private collection-tab helpers, Project Overview buildOverviewModel reader, tab button and render branch. Stale projectWorkspaceA session mode falls back to Gantt. Gantt, calendar, dayblock, wave, retained history and effective-context admission remain. This removes a selected-tab aggregation cost; it is not measured proof of faster startup or other views.

Existing native timeline-planner-view is consumed by View Group Hub. Timeline source resolution remains plugin-wide; no independent per-leaf source contract is invented. Native engine context sets readOnlyInitialization:true: missing owner stores return memory defaults, read/parse failures reject without resetting data. Explicit owner mutations remain available. Embedded callers retain their previous default because this flag is native-only; public APIs and exports remain compatible. Environment tag-filter localStorage may still update. No new restore-time business JSON write is admitted.

Runtime installation is pending separate task-specific approval; loaded native UI/scroll/multiwindow and switching latency remain unverified. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-271)（外部来源未随包提供）.


## 2026-09-30 Timeline cleanup and grouped entry — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. Timeline 0.1.1 and View Group Hub 0.2.3 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-272)（外部来源未随包提供）.


## 2026-09-30 Time-view performance and historical capture boundary

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Timeline 0.1.2 coalesces same-turn native leaf and connected lifecycle refresh requests. A request arriving during work receives a trailing latest-state pass, and callers await the full drain. Failure clears the latch for retry. Engine mode/zoom renders serialize within each engine instance and await Mermaid; initial engine completion now includes its first diagram. Native host close/source checks and per-render epochs suppress stale success/error/delayed-SVG annotations. This is not a plugin-global Mermaid lock, SVG cache, incremental Gantt renderer or elimination of all source reads. Existing lifecycle caches, eligibility projections, embedded APIs, four modes and collection-tab removal remain. Native read-only initialization remains native-only. Hub prewarming is unchanged, as explicitly accepted by the user.

Runtime installation awaits separate package approval. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-273)（外部来源未随包提供）.


## 2026-09-30 Time-view performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “Ok就请部署”. Mandala 0.1.11 and Timeline 0.1.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-274)（外部来源未随包提供）.
