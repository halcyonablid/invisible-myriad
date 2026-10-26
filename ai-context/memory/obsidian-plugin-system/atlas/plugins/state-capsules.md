# Plugin: state-capsules

## 2026-10-22 用户确认：State Capsules退出当前开发范围

- observation / source：用户明确“state capsules已经是舍弃了的设计了，不用管它呀”；与2026-09-03不再用于状态切换的既有记录一致。
- claim / source status：confirmed_by_user；本项目不再为State Capsules新增开发、迁移、兼容核查或启用smoke，不将其设为验收/部署依赖。这是用户设计与工作范围的事实，不是本轮卸载或全代码退役的事实。
- supersession：本条覆盖FW-020/FW-021及本项目旧计划、旧交付材料内State Capsules的未来smoke/接线/兼容待办。旧技术契约和已封存源码/测试/终审仍作历史证据；不重写旧seal。generic BUS与owner-local Snapshot相关问题不因本条自动关闭。
- boundary：Workspace、PEO、Collection的主键Tab/胶囊及历史回看不是state-capsules插件，仍属现有工作流；历史数据、Snapshot和旧记录保留，不删除、不卸载、不修改vault。
- Bayesian update：corrects当前开发范围误用旧依赖；最窄更新为本插件页与Framework当前范围澄清。实际顺序只读state/PLAN.md。
- trace：results/context-key-bus-management-20261012/sync-bus-r/state-capsules-scope-correction/REVIEW.md及verification.json；仅文档核验PASS。


status: runtime_dev_mirror_synced_static_verified_plugin_disabled_ui_smoke_pending
updated: 2026-09-03

## Role

status: confirmed_by_user_and_code

State Capsules stores manually maintained launch baselines and restores their environment/view state across participating plugins other than Workspace Mount in Repository Dev. A capsule is a stable starting point for a recurring kind of journey, not an automatically advancing record of where the previous journey stopped. It does not own Workspace, GTD, Project Overview, Mandala, Collection Card, EVA, or note content.

A capsule keyword is also an operation-context signal. During GTD restore, State Capsules passes its normalized Context Capsule Key labels to the GTD owner; it does not interpret GTD business records itself and the keyword cannot automatically move the saved baseline forward.

## Starting-Point Semantics

status: confirmed_by_user_and_code

The user names this operating model `狄拉克海上的涟漪模式` (Ripples on the Dirac Sea mode). The deliberately small set of typical capsules is the stable sea of reusable departure conditions; each live work journey is a transient ripple. A new capsule is created only when a genuinely reusable new departure condition has emerged, so ordinary interaction carries no obligation to preserve a readable future checkpoint after every move.

- Switching from capsule A to capsule B restores B's saved baseline without capturing or overwriting A.
- The live journey after restore is transient. Repeated switching always starts from the last explicitly maintained baseline.
- Only `Save current state as new capsule` and `Overwrite active capsule` may capture live environment state into a baseline.
- Typical starting states and incidental live states remain visibly different in the user's mental model even though the main UI does not add a new mode control. The distinction is behavioral: typical states are explicitly maintained; incidental states disappear when another starting point is selected.
- Complexity grows progressively and only under user intent. New capsules represent durable differentiation, not the automatic accumulation of every journey endpoint.
- A successful switch persists only `activeCapsuleId`. This is a pointer to the selected starting point, not a mutation of any capsule snapshot.
- Pointer persistence requires readback. A mismatch restores the previous in-memory pointer and attempts a persisted pointer rollback.
- Restore or verify warnings do not cause an automatic baseline update. The selected capsule remains the intended starting point even when one participating plugin restores only partially.
- The former public Project Overview snapshot mutation methods `updateActiveProjectExecutionOverviewState` and `updateAllProjectExecutionOverviewStates` are superseded and absent from the State Capsules API. External plugins may read the active saved state, but they may not silently advance capsule baselines.

## Project Overview Restore

Project Overview now restores its selected primary-key Tab instead of treating the saved location as a vertical scroll target.

- Capsule schema v2 records each scope's `groupId` and stable `primaryNodeKey`.
- Restore resolves `groupId -> primaryNodeKey -> first visible group`.
- `activeScopeKey` restores the in-memory grouping mode and normal/Kill view scope.
- Normal scope cannot reveal an all-killed primary. Kill scope may inspect it without changing lifecycle state.
- Tab selection preserves vertical page scroll; only the capsule strip may bring the selected pill into horizontal view.

## GTD Restore

State Capsules requests `navigationPolicy: context-keyword-project-v1` and supplies `contextKeywords`.

- GTD resolves keywords to its owner-side tag ids and projects matching active projects.
- The destination is always normal, unfiltered GTD: tag-manager/KaioKen mode is disabled, tag filters are cleared transiently, and focus/first-class filters are off.
- A saved legacy `gtd.tagFilters` field remains readable but is ignored only under this explicit policy. Other bridge callers retain legacy behavior.
- Multiple matching projects are resolved from saved anchor and scroll context; no match restores the old view context and logs a bounded diagnostic.

## Host Boundary

GTD bridges are routed by `notePath` through `window.__gtdTaskManagerPluginApi`.

- one matching host: use it;
- multiple matching hosts with one active: use the active host;
- unresolved multiple-host ambiguity: fail closed and do not activate an arbitrary leaf;
- no matching host: GTD may activate one view and resolve again.

The legacy global `window.gtdCapsuleBridge` remains a compatibility surface only when the owner plugin API is unavailable.

## Guardrails

- Restore is environment state only and performs no business JSON write, normalization, repair, lifecycle mutation, or record creation.
- Switching performs no live capture and does not change capsule snapshots, capsule order, or capsule `updatedAt` values.
- Delayed GTD restore timers are generation-owned; an older capsule cannot overwrite a newer navigation.
- Missing/killed Project Overview primaries and missing GTD keyword/tag/project matches degrade to visible fallback state rather than recreating data.

Trace: `change-records/2026/2026-08/20260801-151030-state-capsules-peo-gtd-context-restore.md`.

Starting-point correction trace: `change-records/2026/2026-08/20260817-state-capsules-starting-point-semantics.md`.

## Current-Use Status And Workspace Snapshot Boundary (Earlier Prior)

status: superseded_by_repository_dev_workspace_control_retirement
updated: 2026-09-03

- `confirmed_by_user`: the user no longer uses State Capsules for state switching. This corrects the current-practice prior only; it is not a code deprecation, schema migration, data-deletion instruction, or claim that the plugin has no historical compatibility value.
- `confirmed_by_user` + `confirmed_by_code`: the original design intentionally made State Capsules the orchestrator/consumer of Workspace Mount environment state. The provider exposes `activeTabId`, `tabOrder`, Tab-tree and item collapse maps, keyword-drawer expansion, paradigm-mount collapse maps, pinned-scroll state, and `visibleUiState`. Current State Capsules capture deliberately projects only `activeTabId`, `tabCount`, Tab-tree/item collapse, both paradigm-mount collapse maps, pinned scroll and `visibleUiState` (including `showSnapshotPanel`); it does not persist `tabOrder` or keyword-drawer expansion. Restore passes the stored object to `applyState()`, so a legacy capsule that already contains those two provider fields can still replay them.
- This broader environment-state contract is distinct from Workspace Mount content snapshots: State Capsules does not create, restore, delete, or own `snapshotsById` / `snapshotOrderByTab` content snapshots.
- Workspace Mount content snapshots are a separate owner-local feature. State Capsules leaving the active workflow therefore removes one assumed reason to invest in capsule-driven switching, but does not by itself authorize removal of Workspace Snapshot data or behavior.
- Current policy is compatibility preservation: do not add new current-workflow reliance on State Capsules, and do not infer destructive cleanup from the user-practice change. The user's current-use exit makes the State Capsules-to-Workspace environment bridge a performance-retirement candidate, but does not itself retire that bridge. Any paired code change requires a separately verified and explicitly authorized implementation phase; retained capsule `workspaceMount` fields must remain readable and inert rather than being silently deleted.

The paragraph above records the pre-implementation prior from earlier on 2026-09-03. It is retained as decision history and is superseded for Repository Dev by the current section below.

## Repository Dev Workspace Control Retirement

status: runtime_dev_mirror_synced_static_verified_plugin_disabled_ui_smoke_pending
updated: 2026-09-03

- `confirmed_by_user`: State Capsules is no longer the controller for Workspace Mount state switching.
- `confirmed_by_code`: Repository Dev no longer captures, resolves, applies, verifies, retries, or counts Workspace state through `workspaceCapsuleBridge`. A newly saved capsule writes an empty `workspaceMount` object; overwrite carries an existing legacy value forward by deep clone; restore reports it as `historical-read-only` / `workspace-control-retired`, with verification `not-applicable`.
- Legacy `workspaceMount` values remain readable, round-trip-safe and inert. They are not silently normalized, erased, or replayed into Workspace Mount.
- Workspace Mount's passive direct-control surface remains independent: callers that deliberately obtain the live bridge through `window.__workspaceMountPluginApi.getBridge()` or `ensureBridge()` can still call its `getState()` / `applyState()` methods. State Capsules no longer invokes that surface.
- Workspace Mount content Snapshot remains outside this contract. State Capsules does not own or alter `snapshotsById`, `snapshotOrderByTab`, or Snapshot create/preview/restore behavior.
- Actual Runtime, Repository Dev and Repository Mirror now align on the retired Workspace-control implementation. Actual Runtime's `community-plugins.json` currently does not enable State Capsules, so this is static deployment/hash evidence rather than a loaded State Capsules UI result. Real-host performance remains unmeasured.

Trace: `change-records/2026/2026-09/20260903-121700-workspace-active-bridge-retirement-staging.md`; deployment: `change-records/2026/2026-09/20260903-143500-workspace-active-bridge-deployment.md`.

Bayesian update: `confirmed_by_user` corrects the current-use prior; `confirmed_by_code` reinforces the implementation boundary; the future retirement path remains `inferred`.

## Collection Control Retirement

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-03

- `confirmed_by_code`: State Capsules Repository Dev no longer captures, resolves, opens/ensures, applies, queues, verifies, warns about, or writes back Collection Card environment state.
- A new capsule writes `collectionCard: {}`. Overwrite deep-clones and carries forward the previous historical value exactly; normalize/save/reload preserves unknown nested historical keys.
- Restore reports `historical-read-only` / `collection-card-control-retired`. Historical values may appear in preview but do not participate in path resolution, active-file decisions, host control, verification or business-data access.
- Collection's passive owner API remains available to deliberate external callers, but State Capsules no longer invokes it. GTD capture/restore and the generic BUS implementation remain independent and unchanged in this slice.
- Physically present but unreachable Collection compatibility helpers remain as a non-blocking cleanup candidate. They are not instantiated/exported and start no timer; their later removal must not be conflated with generic BUS or GTD retirement.
- Actual Runtime, Repository Dev and Repository Mirror now align on the retired Collection-control implementation. State Capsules remains disabled in Actual Runtime, so this is static deployment/hash evidence and not a loaded State Capsules smoke result.

Trace: `change-records/2026/2026-09/20260903-152245-collection-card-active-bridge-retirement-dev.md`; deployment: `change-records/2026/2026-09/20260903-182900-collection-card-active-bridge-deployment.md`.

Bayesian update: `supersedes + refines`; deployment evidence adds `no_model_change`. GTD and generic BUS decisions remain separate active questions.
