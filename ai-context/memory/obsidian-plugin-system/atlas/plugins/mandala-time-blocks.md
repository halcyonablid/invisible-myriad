# Plugin: mandala-time-blocks

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-04

## 2026-09-13 — Keyword Disclosure and81 Images Deployed

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code

The whole nine-grid keyword index now defaults collapsed behind a native triangle summary. Expansion lives only in plugin-instance memory. The81 projection reuses existing node images through visible-only resolution, per-render node dedup and a shared four-read queue across render generations. Disposal prevents stale image results from repainting; full titles retain contrast on image backgrounds including hover/focus. Node data, nine-grid image behavior and existing owner actions remain unchanged. Structural drag stays nine-grid-only.

This `refines` and supersedes the image limitation in the dated initial81 release below. User confirmed deployment; runtime/dev/mirror main42878F16 and styles521F981D match. Only code/styles copied. Evidence and rollback: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260913-003240-mandala-fold-images-deploy.md`. Native reload/acceptance remains pending. Framework control-plane and Question Map unchanged.

## 2026-09-12 — Nine / Eighty-One Grid UI Deployed

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_user_and_code

The user requested an additional81-cell UI, not a new node schema. The candidate keeps the original nine-grid renderer and adds a separate81-cell projection: the central3×3 shows the current node and eight child slots; eight surrounding3×3 groups show each corresponding child and its eight child slots. Repeated appearances reference the same Mandala node identity. Empty parent groups never create descendants on render; missing/dangling references do not overwrite occupied slots.

The view-size preference is a separate in-memory plugin field, not persisted dashboardState. Toggling re-renders only the grid pane and does not call business saves, provisioning, bridge publication or full dashboard reload. The81 view keeps full wrapped titles, branch boundaries, current-node navigation and owner action menus. Structural drag and image-heavy legacy presentation remain in9;81 omits eager image/history hydration. No effective-key eligibility, JSON ownership or cross-plugin API changes.

Trace: active project `mandala-nine-eightyone-ui-20260912`; verified source `state/staging/mandala81-ui-20260912/`; implementation record `memory/obsidian-plugin-system/change-records/2026/2026-09/20260912-mandala81-ui.md`; deployment record `memory/obsidian-plugin-system/change-records/2026/2026-09/20260912-mandala81-deploy.md`. User confirmed deployment; runtime/dev/mirror main5A9E46EB and styles5E765429 match. `refines` the planning/design UI contract; Framework control-plane rules and Question Map unchanged. Native Obsidian reload/acceptance remains pending; only code/styles synchronized, no data/manifest writes.

## Role

status: confirmed_by_memory

Mandala is the planning, daily lesson, weekly tracking, and project plan owner.

It is both a goal/design surface and the persistence owner for the user's daily-weekly planning records.

## Owns

status: confirmed_by_memory

- Daily lesson items and daily completion/planning/review records.
- Daily score records and daily score entry blocks for lesson, Workspace, and goal domains.
- Goal weekly tracking rows.
- Workspace primary weekly tracking rows.
- Project plan panels.
- Goal execution plan rows for Mandala / 九宫格 primary keys.
- Independent recursive Ontology documents for goal longitudinal primary keys, plus one shared recursive Schema authority with owner-local table instances for project longitudinal primary keys.
- Mandala keyword data in separate Mandala-owned JSON.

## JSON Storage Partition Contract

status: confirmed_by_code

Mandala does not persist all features in one monolithic JSON. Files are resolved beside the configured source note and partitioned by owner-local business domain:

| JSON | Stable responsibility |
| --- | --- |
| `Mandala_Database.json` | Mandala node tree and node-owned content. |
| `Mandala_Types.json` | Node type configuration. |
| `Mandala_Keywords.json` | Mandala keyword lookup and node-keyword ownership. |
| `Mandala_WeeklyGoals.json` | Goal/Workspace weekly tracking, current execution-plan rows, lifecycle state, and observation-bounded historical rosters. |
| `Mandala_DailyLessons.json` | Daily-lesson item pools, references, per-date mode, daily entries, and daily/weekly lesson comments. |
| `Mandala_DailyCompletionOntology.json` | One shared daily-completion Ontology schema authority plus sparse, independent recursive table instances keyed by date. |
| `Mandala_LongitudinalOntology.json` | Independent goal-primary Ontology documents plus one project-primary recursive Schema authority and owner-local project table instances, all keyed by stable longitudinal owner identity. |
| `Mandala_DailyScores.json` | Lesson, Workspace, and goal score blocks. |
| `MandalaTimeBlocks_Records.json` | Time-block records. |
| `MandalaTimeBlocks_Settings.json` | Source-local date range, filters, widget configuration, and source-note settings. |
| `MandalaTimeBlocks_Migration.json` | Migration staging, audit, and compatibility state. |

Persistence boundary:

1. Upper-level operations constrain the semantic record or field being changed, but physical persistence serializes the entire owning JSON shard; the current implementation does not perform database-style partial JSON writes. The daily-completion and longitudinal Ontology shards use guarded staging/readback/publication/rollback writers rather than the generic direct `writeJson()` path.
2. `loadAll()` loads the base runtime set in parallel: source settings, records, migration state, Mandala structure/types/keywords, and daily scores. Weekly tracking and daily lessons use their own load paths when related surfaces or operations require them; `loadAll()` does not read every Mandala JSON at once.
3. `TimeLog_Database.json` is a legacy compatibility/import source, not a current active business shard. Plugin-directory `data.json` stores plugin/UI environment state and is not part of the source-folder business partition set.
4. Domain partitioning limits unrelated write amplification and failure scope, but it does not by itself prove that storage is never a performance bottleneck.
5. Further partitioning has no fixed byte threshold. It requires measured attribution across Vault read/write, parse, normalization, stringify, indexing/event effects, and rerender cost while preserving stable identity, historical discoverability, migration safety, and one-owner semantics.

Cross-plugin consumers must continue to use Mandala owner APIs or bounded snapshots. The partition map is not permission to scan, join, repair, or write Mandala JSON directly.

Trace: runtime `main.js` constants, `getPaths()`, `readJson()`, `writeJson()`, and `loadAll()`; Atlas log `2026-07-29 - Mandala JSON Partition And Read/Write Snapshot`.

## Layering

status: confirmed_by_memory

- Daily lessons: order base and embodied execution.
- Goals: direction, judgment, continuation, and pruning.
- Projects: resource scheduling and delivery progress.

These layers may appear together in one view, but should not share the same data bucket simply because they look like tables.

## Daily-Weekly Record Semantics

status: confirmed_by_code

Mandala's daily and weekly surfaces are two time resolutions of the user's record practice:

1. Daily records preserve fine-grained posture, action, score, comment, and experience.
2. Weekly records preserve the primary-key field visible at that time, the week's interpretation, execution, and handoff.
3. Stable owner identities answer whether two slices refer to the same entity; historical labels and comments answer how the entity appeared to the user then.
4. Stopping tracking, leaving the current candidate set, or being killed in Project Overview is a future-facing lifecycle decision. It must not erase a captured day/week slice.
5. Historical completeness is observation-bounded: preserve captured evidence in detail, mark incomplete legacy evidence as partial, and never infer an uncaptured old roster from today's active set.

This design requirement is now implemented and user-verified in the synchronized runtime. The historical roster remains observation-bounded: complete current captures may freeze a roster, while legacy or incomplete evidence stays marked partial.

## Provides

status: confirmed_by_memory

- Weekly goal table modal.
- Persisted weekly tracking dashboard tab via `openWeeklyTrackingDashboard`.
- Workspace weekly tracking APIs.
- Project plan APIs consumed by Project Overview AI export.
- Private external-editor owner callbacks for goal/project longitudinal Ontology documents; no Ontology body is added to public plan APIs.
- Reveal/open behavior for Mandala nodes through EVA.
- Read-only Timeline planning targets with stable external identity and lifecycle fields through `listTimelinePlanningTargets({ includeStopped: true })`.
- Final bounded Effective Operational Context Key snapshot through `listEffectiveOperationalContextKeys()`, combining current Workspace carriers, Project Overview comment-declaration/Kill evidence and Mandala's own non-stopped project tracking.
- Lightweight `mandala-time-blocks:tracking-lifecycle-changed` dirty events after successful owner saves.

## Consumes

status: confirmed_by_memory

- Project Overview primary order snapshots for summary sorting.
- Workspace Mount read-only project-entry snapshot as a fallback for Workspace weekly summary and Ontology project-owner titles.
- Project Overview workspace context for cross-tab weekly modal context.
- EVA open/reveal contracts for cross-plugin relations.
- Workspace Mount project-entry creation / context-tab APIs as owner APIs for Workspace carriers.
- Workspace Mount `getProjectOverviewWorkspaceEntrySnapshotV2()` and Project Overview `getWorkspaceOperationalContextKeySnapshot()` as bounded read-only inputs to the final effective-key transaction.

## Effective Operational Context Key Projection

status: runtime_synced_static_verified_ui_smoke_pending

Mandala is the final aggregator but not a second owner of Workspace or Project Overview data. A project is current only when a complete Workspace `jump:v1` carrier has exactly one current Project Overview declaration (no `9XX` archive or Kill veto since `tracking-only-v2`), and the corresponding Mandala project plan exists and is not stopped.

The provider reads Workspace, Project Overview and Mandala revision/provider-generation triplets twice, retries one torn read at most once, and enforces 2-second step, 5-second total and 500-target bounds. It never activates hidden views, polls, scans the full Vault, reads another plugin's JSON directly or stores a stale eligibility cache. The result is used internally for the Ontology ordinary project-primary projection and externally by Temporal Framework and Next Action Workbench. `listTimelinePlanningTargets()` remains the separate history/planning projection for Timeline.

Exited owners remain retained/history objects. Current Ontology is narrowed by the effective projection; historical Ontology remains read-only and discoverable. This refines FW-018 without creating a unified cross-owner archive or moving lifecycle ownership.

## Guardrails

status: confirmed_by_memory

- Goal rows and Workspace rows must use separate key domains and buckets.
- Workspace primary keys must not be parsed as Mandala node ids.
- Workspace weekly summary must display readable Workspace project titles when available; raw `item_m...` ids are regression sentinels, not acceptable primary UI labels.
- `mandala-project-primary` Ontology descriptors must resolve the current readable Workspace title by stable owner alias at query time. Stored plan-row titles are fallback snapshots only; a live rename changes display/search/sort/revision without changing the Ontology stable reference or writing Mandala/Workspace business data.
- Project-title resolution is Workspace-source-bound and non-activating. The allowed source-note set comes from each current project row's parsed stable `nodeId`, not from the Mandala owner note in the Ontology scope. Reject Project Overview labels outside that set, prefer an already-open matching Workspace view when available, and never open a hidden view merely to improve a label. If the set is explicitly empty, admit no historical Workspace label; if no live proof exists, retain a readable stored title or stable owner fallback with diagnostics.
- Missing current-tab context should hide that current tab, not show a disabled misleading tab.
- Project plan upper-level fields are not weekly rows.
- Project execution plan may display Project Overview / Collection Card evidence as read-only projection, but Mandala remains owner only of its project-plan persistence.
- Embedded multi-line evidence cards must not inherit fixed-height button styling; text overlap is a semantic UI regression because it corrupts the planning evidence surface.
- Daily score and stopped-tracking behavior should preserve historical records while pruning future candidates according to date-aware lifecycle rules.
- Fluctuation charts should keep primary-key visual identity stable; color should identify the item, while score/value should be represented by text or position.
- Daily score charts are block records, not only one scalar per date/key. One date + one primary key may contain multiple score entries, each with its own score and note.
- Daily lesson operating mode is Mandala-owned state. The eleven current postures use separate Mandala-owned item pools, while the per-date mode selects the active daily surface. Daily scoring keeps all eleven packs under the existing `lesson` score domain and must not create another score owner.
- Daily lesson day comment semantics should stay broad: the persisted `adjustment` / legacy `summary` text is not only a narrow review or correction field. It is the user's daily comment field for experiences, thoughts, waypoints, clues, and adjustment notes.
- Weekly tracking tables should expose a compact two-field review shape after `本周目标`: `完成&待办` for completion / remaining work, and `记录和comment` for progress notes, blockers, evaluation, and old reflections. The legacy `reflection` field remains readable but should be merged into the comment surface instead of remaining a separate column.
- Goal weekly summary may be a direct editing surface for Mandala-owned goal weekly rows. Summary editing must reuse the same row bucket and `upsertWeeklyGoalRows` persistence path as the per-goal detail page, rather than creating a second summary-only data owner.
- Workspace weekly summary may be a direct editing surface for Mandala-owned Workspace weekly rows. Summary editing must reuse the same row bucket and `upsertWorkspaceWeeklyGoalRows` persistence path as the per-Workspace detail page, rather than creating a second summary-only data owner.
- Mandala may trigger Workspace project creation, but must not pass Mandala's `九宫格目标.md` / Mandala `sourceNotePath` as the Workspace owner source.
- Mandala's own `sourceNotePath` is local Mandala provenance for Mandala-owned rows, not Workspace Mount ownership.
- Weekly tracking should be available as a persisted dashboard tab, not only as a one-off modal; Project Overview should prefer `openWeeklyTrackingDashboard` when entering weekly tracking.
- Weekly tracking dashboard subtabs should preserve their own scroll positions as dashboard environment state. Restoring a subtab should not force the user back to the top if they previously left that subtab mid-table.
- Goal execution plan rows should remain separate from Workspace project execution plan rows. Mandala owns `goalPlanRowsByKey` for 九宫格主键 planning fields, while the existing Workspace-facing project execution plan remains in `projectPlanRowsByKey`.
- Goal execution plan may display Project Overview / Collection Card evidence as a read-only projection in the next-plan cell, but Mandala remains owner only of its own goal-plan persistence.
- Goal/project longitudinal Ontology is stored outside `Mandala_WeeklyGoals.json`. Ordinary plan text saves, lifecycle filtering, stop, Kill, and owner-missing projection changes must not rewrite or delete the Ontology shard.
- Goal longitudinal Ontology identity is source note + `goal` + Mandala node id. Project identity is source note + `project` + Workspace stable identity alias; title, row order, and latest-row choice are forbidden identity substitutes.
- A populated longitudinal Ontology action uses the standard outside-corner status dot. Empty and unknown states do not show the dot; unknown must fail closed instead of implying content.
- Goal summary and goal execution plan rows should prefer Project Overview's Mandala primary-key order. If no live order snapshot is available, Mandala may ask Project Overview to build the `mandala` grouping model as a read-only fallback before falling back to local Mandala tree path order.
- Historical goal and Workspace rosters must be keyed by stable owner identity, not display title. Current owner state may enrich the current week but must not rewrite a frozen old-week title, cohort, or lifecycle observation.
- Stopping tracking is a closeout boundary: the stop week remains visible and marked, later weeks leave the active candidate set, and resuming reuses the same stable identity.
- `目标执行计划` and `项目执行计划` are current, forward-facing vertical-management projections. They exclude currently stopped, freshly confirmed killed, and freshly confirmed owner-missing identities without deleting their stored plan rows.
- Owner absence may hide a current plan row only from a fresh, structurally complete owner snapshot. Missing APIs, read failures, partial snapshots, malformed Mandala trees, and stale lifecycle caches must fail open rather than manufacture an exit decision.
- Historical goal/project weekly summaries retain the captured row and distinguish stop-week `停止追踪 · 本周收口`, earlier-week `当前已停止追踪`, and independent Project Overview `已 Kill` evidence. A later resume removes only the current-stopped marker; it does not rewrite the old closeout observation.
- The tracking lifecycle event is a dirty hint only. Consumers must reread `listTimelinePlanningTargets()` and must not treat the event payload as the authoritative historical record.
- A matching Workspace `workspace-data-saved` event is likewise only a dirty hint for Ontology titles. Mandala coalesces the signal and asks the Hub to refresh; the Hub must invalidate its local descriptor snapshot before rereading the provider.

## Historical Roster And Tracking Exit

status: runtime_synced_user_verified

Mandala persists observation-bounded weekly history in schema v3:

- `goalRosterByWeek` freezes the Mandala goal identities observed in each ISO week.
- `workspaceRosterByWeek` freezes the Workspace project identities observed in each ISO week.
- `rosterCaptureByWeek` records whether source capture was complete or partial and preserves source diagnostics.
- roster entries retain `displayTitle`, `titleProvenance`, `statusAtWeek`, `stoppedAt`, and `resumedAt` as properties of that week.

The stop/resume contract applies to goal and Workspace domains:

1. Stop in week W preserves W's retained row and closeout evidence. When the current final effective snapshot excludes the key, weekly summary and execution-plan surfaces expose that evidence through their explicit read-only archive instead of deleting it or keeping it in the editable current table.
2. W+1 excludes the entity from active candidates unless it is resumed and the complete upstream effective-key chain is valid again.
3. Resume reuses the original stable owner identity; it does not create a replacement historical entity.
4. Old weeks prefer their frozen roster lifecycle evidence over the latest owner state.
5. Missing or incomplete legacy capture is disclosed in UI and print rather than silently repaired from current data.

After a successful lifecycle save, Mandala emits `mandala-time-blocks:tracking-lifecycle-changed`. Timeline coalesces the signal, rereads the Mandala owner snapshot, and refreshes connected surfaces without polling or hidden Workspace activation.

Trace:

- `atlas/contracts.md#mandala-timeline-tracking-exit-and-history-contract`
- `change-records/2026/2026-07/20260724-001800-mandala-timeline-observation-history.md`

## Goal Execution Plan Rows

status: repository_dev_verified_runtime_mirror_pending

The weekly tracking modal has a `目标执行计划` tab for Mandala / 九宫格 primary keys.

Current user-facing columns:

1. `九宫格主键`
2. `愿景`
3. `获得到的知识`
4. `当前情况`
5. `下一步计划`

Storage contract:

- `Mandala_WeeklyGoals.json` stores these rows in Mandala-owned `goalPlanRowsByKey`.
- The row key is local Mandala provenance plus Mandala node id.
- The stored row fields are `vision`, `knowledge`, `currentSituation`, `nextPlan`, `displayTitle`, and `updatedAt`.
- Active Mandala weekly-goal node states are current candidates. Stopped nodes, freshly confirmed killed nodes, and nodes absent from a fresh structurally complete Mandala owner snapshot are excluded from the current `目标执行计划` projection even when a stored plan row has content; the row remains persisted for history, resume, and audit.

Projection contract:

- The `下一步计划` cell can display related Collection Card entries by reading the Project Overview mandala-mode model and grouping records whose `primaryColumnId` is `mandala`.
- Clicking those chips asks Project Overview to reveal the Collection Card node in `mandala` grouping mode.
- This is read-only evidence projection. It does not let Mandala write Collection Card, Project Overview, EVA, GTD, Workspace, or Keyword business JSON directly.
- Row order should follow Project Overview's `mandala` primary-key order, matching the target weekly summary surface. A read-only Project Overview model fallback is allowed when the live order snapshot is empty.
- Project Overview Kill evidence may remove a current row only after a successful fresh lifecycle read. A stale trusted badge cache remains explanatory historical evidence but must not hide current-plan data after provider failure.

## Project Execution Plan Collection Card Evidence

status: runtime_synced_static_verified_ui_smoke_pending

The Workspace-facing `项目执行计划` keeps Collection Card next actions as a read-only evidence layer above Mandala's editable `下一步行动` field.

Current contract:

1. Mandala reads Project Overview groups whose `primaryColumnId` is `workspace` and maps `columns.collection` by the Workspace stable primary key.
2. If the active Project Overview model already contains Workspace groups, Mandala may reuse it. If the active model is a Mandala/goal or other non-Workspace grouping, Mandala must call `buildOverviewModelForMode("workspace")` instead of treating that unrelated model as an empty Workspace result.
3. The fallback builds an in-memory, read-only Project Overview model. It does not activate Project Overview, switch its visible grouping, or write Project Overview, Collection Card, Workspace, EVA, or Mandala business data.
4. Full Workspace node identity is preferred; the existing owner-compatible stable alias remains a rename-tolerant fallback. No title-only guess creates a relation.
5. Collection Card items render above the matching project's `下一步行动` textarea. Opening a card uses Project Overview reveal/open behavior and does not copy the card into Mandala persistence.
6. A stale active Workspace model created before Collection Card evidence became available can still be incomplete. Refreshing/reloading Project Overview and then Mandala is the current recovery path; explicit model freshness metadata remains a possible future refinement.

Trace: `change-records/2026/2026-07/20260731-134500-mandala-structured-field-image-albums.md`.

## Daily Lesson Eleven-State Modes

status: confirmed_by_code

The daily lesson tab can switch a single date among eleven operating modes. This is a date-aware posture selection, not a global deactivation of items in the other pools.

Current contract:

1. `listDailyLessonItems()` remains the normal daily lesson API by default.
2. The eleven item pools are `normal`, `stress`, `kaioken`, `adjust`, `health`, `recuperation`, `new_home`, `free_energy`, `social_conduct`, `self_restraint`, and `checklist`; generated ids use side-specific stable prefixes. The current display mappings include `normal` / `余度管理`, `social_conduct` / `为人处世与修行`, and `checklist` / `核查清单`. Existing internal ids remain stable when display labels change.
3. Per-date mode is stored in Mandala daily lesson state, not in Project Overview, Workspace Mount, or Daily Scores.
4. Daily scoring reuses `lessonScoresByKey`; side items remain separate lesson item ids, not new score domains.
5. The daily score modal initializes from the selected date's mode but exposes a modal-local eleven-pack selector. Selecting a score pack must not change or seed the actual daily-lesson mode.
6. Existing historical scores remain visible in charts. A historical block can initialize its own pack, while cross-pack forced visibility is rejected after the user changes packs.
7. The weekly paper print view is an exception to the one-side display rule: it prints all eleven pools for the selected date and allows natural pagination while keeping each state heading with its table.
8. `health` / `健康积分` derives one point from each completed health item in `daysByDate[*].entriesByItemId[*].done`. Selected-day and cumulative totals are projections, not a separate persisted ledger.
9. Health defaults cover small sleep, activity, and diet increments and seed idempotently only when the user explicitly selects Health Credit.
10. `recuperation` / `休养生息` is a recovery-to-baseline posture. Its defaults seed idempotently only when explicitly selected and do not add Health Credit points.
11. The daily-score fluctuation surface keeps the existing top-level `lesson` / Workspace / goal tabs. Inside `lesson`, eleven real-state tabs select one state graph at a time; inactive state graphs are not rendered in parallel.
12. The selected lesson graph state is dashboard environment state. The graph's today, empty-day, and existing-score entry points open the corresponding score pack without changing the date's daily-lesson mode.
13. `new_home` / `新家的建设` is an adaptation-and-option-building posture. Its two defaults seed idempotently only when explicitly selected, and completed items do not add Health Credit.
14. In the lesson score modal, hovering or keyboard-focusing an item name exposes a custom context tooltip carrying its `timeRange` as `预计时间段` and `priorExperience` as `此前经验`. Workspace and goal score labels keep their prior non-tooltip, non-focusable path.
15. `free_energy` / `主动管理自由能` is a controlled-adaptation posture. Its six defaults scan prediction mismatch, identify necessary discomfort, choose perceptual versus active inference, create bounded small surprise, split work into successful micro-predictions, and update the model from results. Defaults seed idempotently only when explicitly selected; scoring, graphs, print, normalization, and opening the view do not seed or change the selected day's mode.
16. `social_conduct` / `为人处世与修行` is a cooperation-and-conduct posture. Its five defaults cover avoiding preventable burden, aligning expectations and boundaries, clear timely response, reliable delivery with early warning, and considerate closeout. Defaults seed idempotently only when explicitly selected.
17. `self_restraint` / `限制项和能量配置` is a bounded restriction-and-energy-allocation posture for recurring personal behaviors and planned energy spending that need explicit limits rather than more encouragement. This is a presentation rename from `限制项专项整改`; stable identity `self_restraint`, item ids, score keys, historical records, and persisted business data are unchanged, so no migration is performed. Its two existing defaults timebox non-essential outings and protect planned meal timing. Defaults seed idempotently only when explicitly selected; read, normalization, scoring, graph, and print paths do not seed the bucket.
18. `checklist` / `核查清单` is a recurring inspection posture for persistent responsibility queues that should be reviewed without duplicating each queue as a goal/project primary key. Its stable default `checklist_external_communication_closeout` / `外部沟通闭环巡检` seeds idempotently only when the user explicitly selects this state. It checks pending replies, expected counterparty replies, due follow-ups, and retained evidence; any concrete action returns to the corresponding project or Collection Card.
19. `全部状态` is a score-graph-only view, not a twelfth daily mode or score pack. It reuses all canonical lesson items and one shared `side::itemId` color map; generic scoring follows the selected date's real mode, while an existing block opens its canonical owner pack.
20. Score colors remain unique across state boundaries for the rendered canonical item set. The first 24 high-contrast fills are retained, then deterministic cached maximin selection expands through HSL candidates; texture is supplemental and never substitutes for fill uniqueness.

User-facing meaning: Mandala's daily lesson surface selects today's operating posture. Margin Management (`余度管理`) carries deliberate habits while foregrounding available capacity, pressure response protects margin, Kaioken concentrates force, Systematic Construction recalibrates the system, Health Credit makes small cross-domain health actions visibly cumulative without turning them into medical promises, Recuperation suspends overdraw until the user's baseline is restored, New Home Construction adapts habits while using an environment's initial asymmetric opportunities to establish foundations for later success, Active Free-Energy Management deliberately pays small controlled surprise now to reduce larger future mismatch, Conduct And Cultivation (`为人处世与修行`) keeps cooperation clear, reliable, considerate, and properly closed out, Restriction And Energy Allocation (`限制项和能量配置`) gives recurring costly behaviors explicit frequency, timing, and energy boundaries, and Checklist (`核查清单`) repeatedly scans persistent responsibility queues so concrete follow-up actions can return to their real project/card owners.

Framework update trace:

- prior_read: `framework/entry-index.md`, `framework/update-protocol.md`, this plugin Atlas page.
- evidence_used: user-confirmed Health Credit, Recuperation, New Home Construction, Active Free-Energy Management, Social Conduct, Restriction And Energy Allocation, and Checklist meanings; deployed runtime code; focused behavior, graph, tooltip, DOM, Ontology-v2, print, navigation, historical-prefix, reverse-reference, and business-JSON read-only harnesses; independent post-change verification.
- source_status: `confirmed_by_user_and_code`.
- update_type: `corrects` the deployed ten-state claim and `refines` the daily posture model into eleven explicit modes plus one-at-a-time state graphs, an all-state score view, global canonical color identity, score-context recall, and persistent-responsibility inspection.
- question_map_effect: none; no unresolved ownership question was introduced.
- skill_or_rule_effect: none; existing owner-data, verifier, backup, and runtime synchronization rules covered the change.

## Daily Lesson As Posture Formula

status: confirmed_by_user

Daily lessons are not only a baseline habit / fallback table. They are also the system's posture and formula calibration layer.

Current model:

1. The daily lesson surface asks what operating posture the user should enter today: low-margin recovery, middle-margin compounding, high-margin unfolding, pressure defense, sleep downshift, or reality delivery.
2. Weekly goal tracking and project tracking are expression layers: they show how the current formula lands on concrete goals, Workspace keys, project plans, and next actions.
3. Records, daily scores, comments, waypoints, and clues are evidence layers: they show whether the current formula is working and whether it should be revised.
4. If weekly tracking expression becomes confused, COACH should first inspect whether the daily posture formula is wrong or missing, rather than immediately pushing harder execution.

This refines the earlier baseline model:

```text
old view:
  daily lesson = baseline / defense
  weekly tracking = progress / gain

refined view:
  daily lesson = formula / readiness / posture calibration
  weekly tracking = expression of that formula
  records and scores = feedback for formula revision
```

Potential future UI:

- `今日系统姿态`
- `高余度展开模式`
- `注意力主权防御`
- `愿景显影投资`
- `吸收壁防御：保复利链条`

These are design candidates, not current runtime requirements.

## Daily-Lesson Canonical References

status: confirmed_by_user_and_code

Each daily-lesson state has a fixed composition of native canonical items and optional direct references to canonical items owned by another state.

Identity and persistence contract:

1. A reference stores only the canonical `itemId`; it is not a copied item definition.
2. Canonical definitions remain in the eleven owner buckets: `normal`, `stress`, `kaioken`, `adjust`, `health`, `recuperation`, `new_home`, `free_energy`, `social_conduct`, `self_restraint`, and `checklist`.
3. Each state's direct references are stored in Mandala-owned `referencesBySide`. References do not recursively import another state's references.
4. Current-state projection merges native items and direct references, dedupes by canonical item id, and sorts by item name.
5. Editing definition fields through a reference writes to the canonical owner bucket. Completion and note continue to write once under `daysByDate[date].entriesByItemId[itemId]`.
6. Switching states on one date does not invalidate records made under an earlier state.
7. Unlinking a reference does not stop, delete, or copy the canonical item and does not remove historical records.
8. Dangling, self, or ambiguous references are preserved by normalization, skipped by projection, and exposed as removable diagnostics. Ordinary read/render paths do not silently repair business JSON.
9. A canonical row's `被 X、Y 面引用` status is derived at render time by reversing the existing `referencesBySide` relation in `DAILY_LESSON_SIDE_ORDER`. It is ordered, deduped, excludes the owner side, and is emitted only when the canonical identity resolves uniquely. No reverse index, copied item body, or render-time write is persisted.

Projection boundaries:

- Weekly overview reduces by canonical item id and displays the item once under its native owner state.
- Daily scoring and weekly printing remain canonical-pool-only; references do not become duplicate score candidates or print sections.
- Health Credit derives from unambiguous canonical health ownership. Completing a health item through another state's reference contributes one date-level point, while placing a non-health reference in Health Credit does not turn it into a health item.
- Daily render reads with `loadDailyLessons(false)`; default seeding and reference mutations occur only through explicit user actions.

UI contract:

- Native rows keep the existing appearance and stop/restore action.
- Reference rows carry a distinct reference marker and owner-state badge.
- A native canonical row referenced by other states carries a visually distinct read-only `被...面引用` badge; the reference row continues to carry `引用自...面`.
- Reference rows expose `取消引用`, not canonical stop/delete.

Framework update trace:

- prior_read: `framework/entry-index.md`, `framework/update-protocol.md`, this Atlas page, release guardrails.
- evidence_used: user-confirmed state/reference semantics, deployed runtime code, focused harness, actual 62-item / 33-day read-only business-data smoke, independent post-change verifier.
- source_status: `confirmed_by_user_and_code`.
- update_type: `refines` the eleven-state daily posture model by separating canonical ownership, state-local forward projection, and read-only reverse relationship visibility.
- question_map_effect: none; the identity, weekly, scoring, Health Credit, and invalid-reference boundaries are resolved.
- skill_or_rule_effect: none; existing owner-data, no-render-write, backup, verifier, and runtime synchronization rules covered the change.

## Absorbing Barrier And Compounding Chain

status: confirmed_by_user

In stress / low-margin mode, Mandala should treat an absorbing-barrier state as a compounding-chain survival risk.

User-confirmed theory:

1. Munger side: compounding requires staying in the game. The core stress-mode danger is not merely discomfort, but paths that interrupt continuity and future optionality.
2. Taleb side: when margin is low, time-tested principles should outrank intense short-term impulses.
3. System side: absorbing-barrier states can make upper-level symbols feel false or powerless, but that low-margin state should not be allowed to issue final judgment on the whole system.

Practice protocol:

```text
low-margin / absorbing-barrier signal
  -> do not judge life vision or system truth
  -> preserve attention sovereignty
  -> avoid non-exitable high-pull scripts
  -> keep one compounding link alive
  -> defer formula revision until margin returns
```

COACH implication:

- If the user says prior insights feel like empty words, COACH should not debate the truth of the whole system inside the low-margin state.
- It should switch to symbol preservation and compounding-chain protection.
- The minimum win can be "today did not exit the game."

## Daily Score Entry Blocks

status: confirmed_by_user_and_code

Daily score graphs are a record-block surface, not only a per-day scalar score surface.

Current contract:

1. `Mandala_DailyScores.json` remains Mandala-owned content data.
2. The three score domains remain separate buckets: `lessonScoresByKey`, `workspaceScoresByKey`, and `goalScoresByKey`.
3. The record key remains `sourceNotePath::domain::date::itemId`, so color identity and primary-key grouping stay stable.
4. Each keyed record may contain `entries[]`. Each entry is one score block with `id`, `score`, `note`, `createdAt`, and `updatedAt`; in the UI, `note` is presented as the score reason (`打分理由`), not as an optional hidden technical remark.
5. Legacy records with only top-level `score` / `note` are read as one legacy entry. No bulk JSON migration is required.
6. New saves keep top-level `score` / `note` as a compatibility summary while using `entries[]` as the source for multiple blocks.
7. The score modal's main surface is a compact per-key block index: one row per primary key, existing score entries rendered as horizontal button-sized chips, and a right-side `新增` action for appending another block.
8. Single-block editing happens in a child modal. Existing chips open that block's editor; `新增` opens a fresh block editor. The child modal owns score, score reason (`打分理由`), delete, and implicit-close save.
9. The chart renders one color block per entry. Multiple entries for the same key on the same day appear as multiple blocks with the same item color.
10. Clicking a chart block opens the score modal for that date/key and then opens/focuses the corresponding entry editor.
11. The main score modal is an index / launcher and no longer keeps large inline textareas for every primary key row; this preserves low row height when many primary keys are visible.

Boundary:

- This does not create a fourth score domain or transfer score ownership to Workspace Mount, Project Overview, or Keyword.
- Daily lesson pressure-flip rules still decide lesson candidates. For Workspace/Goal primary keys, Mandala stopped-tracking state and a fresh Project Overview Kill snapshot jointly gate only new score blocks; historical entries remain visible, editable, and deletable.
- A valid stopped date is inclusive: the key may receive a score on or before that date, but not after it. Missing or malformed stopped dates fail closed for new score writes without hiding history.
- Fresh Kill evidence blocks new score blocks for every date. Missing, failed, or stale Project Overview evidence fails open for Kill, while Mandala-owned stopped state remains authoritative.
- Workspace Kill matching uses the complete stable jump identity; Goal matching uses the stable Mandala node id. Raw Workspace `itemId` or Tab aliases cannot retire another Tab's score candidate.
- Add-click and final persistence both reread owner state and request-scoped Kill evidence. Lifecycle events invalidate in-flight admissions, and entry persistence serializes stable `entryId` mutations against the latest store so concurrent editors do not overwrite one another.
- Notes without a score are treated as blank draft material and are not persisted as chart blocks.

## Daily Lesson Day Comment

status: confirmed_by_user

The daily lesson text field formerly labeled `心得与调整` should be understood as a broad day-comment field.

It can include:

- what happened today;
- thoughts and reflections;
- waypoints / 路点;
- clues / 线索;
- evaluation of what was done;
- adjustment ideas for tomorrow or the next cycle.

The UI label may use `记录、想法、路点与线索` to reflect this broader meaning. This is a user-facing semantic label change only. The underlying persisted fields remain `adjustment` with legacy fallback to `summary`.

### Day Comment Image Album Contract

status: confirmed_by_code

The day-comment field may also contain one or more ordinary Obsidian image embeds. This extends the existing text field instead of introducing an image-array schema or a second owner.

Current contract:

1. `adjustment` remains the authoritative field, with legacy `summary` fallback. Text and image embeds coexist in that field.
2. External images are imported through Obsidian's attachment-path and binary APIs; existing vault images are referenced by path. The plugin does not own or delete the attachment file.
3. The daily page renders one compact album launcher with a count/cover treatment. It does not expand every image inline. A scrollable modal owns the thumbnail grid and full-image preview.
4. Removing an image always requires a confirmation modal. Cancel, `Esc`, backdrop close, and other implicit-close paths preserve the reference. Confirmation removes one exact embed reference only and never removes the vault attachment.
5. Before any binary creation, the complete intended attachment reference is made durable. All `Mandala_DailyLessons.json` mutations share the owner queue, and close/unload admission gates prevent asynchronous image work from escaping persistence ownership.
6. External-file retry identity uses content SHA-256 so a failed item cannot be confused with another file or silently cleared by an unrelated successful write.
7. Previous-day context, weekly overview, and print projections strip image embed tokens from text-only summaries; the album remains available on the owning daily page.
8. The current-day `记录、想法、路点与线索` textarea is also the clipboard image paste target. Text-only paste remains native; when image data is present, the paste event imports images only through the existing external-image queue.
9. Clipboard `items` are authoritative when readable image files are available, while `files` is fallback only. This prevents one clipboard image from being imported twice through two browser representations and preserves multi-image order.
10. Clipboard paste does not create blob URLs, base64 payloads, or direct embed text. Nameless clipboard files receive a MIME-derived temporary name and still pass the existing extension, MIME, signature, size, SHA-256, owner-queue, and lifecycle checks.

Boundary:

- No `images[]` field, schema version, sidecar JSON, score domain, provider/consumer API, or cross-plugin owner is introduced.
- Reference removal is deliberately separate from attachment-file deletion, preserving historical evidence and avoiding orphaned or accidentally destroyed files.

Trace: `change-records/2026/2026-07/20260729-180000-mandala-daily-comment-album.md`; `change-records/2026/2026-07/20260729-212500-mandala-daily-comment-clipboard-paste.md`.

### Structured Field Image Album Contract

status: confirmed_by_user_and_code

The compact local-image album pattern also applies to three existing structured text fields:

1. Daily lesson item `priorExperience`, shown as `此前的经验`.
2. Goal-plan row `goalPlanRowsByKey[*].knowledge`, shown as `获得到的知识`.
3. Project-plan row `projectPlanRowsByKey[*].valueDirection`, shown as `价值取向`.

The project field is deliberately `valueDirection`; this extension does not add a project `knowledge` field and does not alter `currentReality`.

Current contract:

1. Images remain ordinary Obsidian embeds inside the authoritative text field. No `images[]`, sidecar business JSON, or new content owner is introduced.
2. Each field exposes one compact count/cover launcher. Its modal supports multiple images, Obsidian attachment selection, external or Vault drag-and-drop, clipboard image paste, and exact-reference removal after explicit confirmation.
3. Removing a reference never deletes the Vault attachment file. A referenced daily lesson writes through its canonical `ownerSide + itemId`, so every state that cites the same item observes the same prior-experience field.
4. External import first saves the text draft, then persists a complete provisional full-path embed, then creates the binary, and finally replaces the provisional token with the source-relative embed.
5. Weekly goal/project writes use latest-read field-level RMW. Owner-missing, source-changed, same-field stale, and conflicting multi-window drafts fail closed without creating a row or overwriting unrelated fields.
6. Recoverable drafts live in versioned Mandala plugin state under `structuredFieldDraftStore`; they do not become Mandala business content. Settings and draft updates share one serialized plugin-data RMW queue.
7. Close/drain holds an admission lock, retry-required failures remain isolated by owner and operation, and deleting an image first flushes dirty text. If the user types again while a save is pending, only the submitted snapshot becomes persisted; the newer value remains dirty and recoverable.
8. Timeline, score-tooltip, print, and Project Overview AI projections strip raw image embed tokens and retain readable text plus `[图片 N 张，见 Obsidian 附件]`. Stable identity, lifecycle, ordering, and owner APIs otherwise remain unchanged.

Boundary:

- `Mandala_DailyLessons.json` and `Mandala_WeeklyGoals.json` keep their existing ownership and schemas.
- Project Overview consumes only the bounded export projection; its canonical Mandala read path still receives the original field value and it does not become a second owner.

Trace: `change-records/2026/2026-07/20260731-133000-mandala-structured-field-image-albums.md`.

## Daily Lesson Week State Transfer

status: confirmed_by_user_and_code

The daily lesson page's `周计划状态转移` surface should mirror the daily four-column state-transfer shape.

Current user-facing columns:

1. `本周计划`
2. `完成情况`
3. `记录、想法、路点与线索`
4. `下周计划`

Storage compatibility:

- `plan` stores `本周计划`.
- `execution` stores `完成情况`.
- `record` stores the broad weekly record / thoughts / waypoints / clues field.
- `nextWeekPlan` stores `下周计划`.
- Legacy `summary` remains readable as a fallback for `记录、想法、路点与线索` when it differs from `execution`, but old `summary == execution` duplicates are treated as legacy repetition and are not forced into the new record column.

Boundary:

- This is the daily lesson weekly state-transfer record under Mandala daily lessons.
- It is separate from the goal / Workspace weekly tracking tables documented below.
- No bulk `Mandala_DailyLessons.json` migration is required; new values are written through normal page save / autosave paths.

## Weekly Tracking Column Semantics

status: confirmed_by_user_and_code

Goal and Workspace weekly tracking tables use the same compact weekly review layout:

1. `本周目标`: what this key is trying to move this week.
2. `完成&待办`: completed work plus remaining / to-do work.
3. `记录和comment`: progress notes, blockers, situational comments, evaluation, and legacy reflections.
4. `下周三大事`: handoff into the next week.

Compatibility rule:

- Existing `blockers` data is read as `记录和comment`.
- Existing `reflection` data is also read into `记录和comment`.
- When the weekly row is saved through the current UI, the merged comment is persisted to `blockers` and `reflection` is written empty.
- No bulk business JSON migration is required; the merge happens through normal edit/save paths.

This applies to:

- `目标管理：九宫格主键`;
- `目标管理：按周汇总`;
- `项目管理：Workspace 主键`;
- `项目管理：按周汇总`;
- weekly print layout.

## Display Fallback

status: confirmed_by_code

For Workspace weekly summary / project-plan tables, Mandala should resolve labels in this order:

1. Project Overview workspace primary order snapshot.
2. Workspace Mount owner read-only project-entry snapshot.
3. transient local labels created during the current add-project flow.
4. raw node id only as last-resort diagnostic fallback.

This preserves Mandala as the weekly tracking owner while letting Workspace Mount remain the source for Workspace item titles.

## Workspace Creation Trigger Boundary

status: confirmed_by_memory

Mandala weekly tracking and project-plan surfaces can be the user's trigger point for one-click project creation. The created Workspace project primary, however, belongs to Workspace Mount and must be created under Workspace Mount's canonical source note.

Mandala must call Workspace Mount without substituting its own Mandala source path as Workspace ownership. This keeps the trigger surface and carrier ownership separate.

## Mandala Context Goal Creation

status: confirmed_by_user_and_code

Mandala project-plan surfaces can also be the trigger point for creating a Mandala-owned operation context goal.

Current contract:

1. The user first chooses a parent node through the Mandala node selector. This preserves grid placement as user-semantic structure rather than automatic background placement.
2. Mandala creates the new node under that parent in the first empty non-core grid slot. A full parent node blocks creation and asks the user to choose another parent; existing children must never be overwritten.
3. The new Mandala node stores the Context Capsule Key in two Mandala-owned places:
   - node `comment` contains a parseable `--- contextKey ---` block;
   - `Mandala_Keywords.json` stores the key as the node keyword and rebuilds `keywordToNode`.
4. Mandala may then call Workspace Mount, Collection Card, and GTD owner APIs to create or reuse their local carriers for the same `projectName` / `contextKey`.
5. GTD's owner API returns the created/reused initial project item's EVA `projectNodeKey`.
6. Mandala asks EVA, through `ensureRelation(input)`, to link the Mandala node key to the GTD project node key with relation type `承载`.
7. Mandala asks Project Overview, through `syncMandalaContextGoalMeta(nodeKey, meta)`, to write overview-level Mandala comment/meta after the EVA carrier relation exists.
8. Mandala relation records should project node keywords into read-only `searchText` / `metaFields`, so Project Overview and EVA can discover the key through Mandala's evidence surface without reading Mandala business JSON directly.

Only the complete result of this workflow can become a goal-domain Effective Operational Context Key. The current node must still exist, the exact forward `承载` edge must uniquely reach one GTD top-level project node, Project Overview must expose exactly one current declaration, and the Mandala goal plan must remain non-stopped (legacy Kill is diagnostics only since 2026-10-13). Standalone grid nodes and merely same-named GTD nodes remain ordinary nodes, not goal primaries.

Boundary:

- This workflow creates a Mandala goal key, not a Workspace primary project entry.
- It does not transfer Context Capsule Key identity ownership away from Project Overview.
- It does not directly write Workspace Mount, Collection Card, GTD, Project Overview, EVA, or Keyword business JSON.
- It does not bulk-migrate existing Mandala nodes or keyword data.
- If GTD, EVA, or Project Overview owner APIs are unavailable, Mandala logs the missed external link result instead of writing those plugins' data directly.

## Weekly Tracking Dashboard Entry

status: confirmed_by_memory

Weekly tracking is a persisted Mandala dashboard tab next to daily lessons, not only a transient modal. Project Overview weekly buttons should prefer Mandala's `openWeeklyTrackingDashboard(nodeRef, options)` API and fall back to `openWeeklyGoalTable` only when the newer dashboard API is unavailable.

## Project Plan Timeline Milestone Projection

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-04

`项目执行计划` consumes one bounded Timeline milestone snapshot per render and indexes it by complete Workspace primary identity. The `关键里程碑+日期` cell shows Timeline-owned milestone name, date, weekday, seven-stage label and time range in deterministic date/stage/name/id order. The existing Mandala-owned milestone textarea remains editable compatibility content and is not overwritten.

Exact full Workspace jump identity wins. Compatibility aliases are used only when current owner evidence proves one source and one owner identity; ambiguity fails closed and emits one bounded diagnostic per render map. Missing, rejected, `ok:false`, or malformed Timeline snapshots yield no chips and no fallback write.

Trace: `change-records/2026/2026-08/20260804-timeline-milestone-time-limit-projection.md`.

## Weekly Tracking Subtab Scroll State

status: confirmed_by_user_and_code

The weekly tracking dashboard remembers scroll position per weekly subtab/context as UI environment state.

Current behavior:

1. `weeklyTrackingTab` still remembers which weekly subtab was active.
2. `weeklyTrackingScrollByTab` stores scroll offsets separately for summary tabs and node-specific tabs.
3. Before switching weekly subtabs or leaving the dashboard tab, Mandala records the current scroll offset.
4. After reopening or rerendering the weekly tracking dashboard, Mandala restores the scroll offset for the active weekly subtab/context.
5. Scroll capture/restore must use the actual visible modal scroll host and must not overwrite a nonzero remembered position with `0` while the modal layout is hidden or not yet scrollable. Restoration may retry after short delays so Obsidian modal layout can settle.
6. Because users often close the dashboard by clicking outside the modal, Mandala also listens to the active modal scroll hosts while the dashboard is open and writes the latest real scroll event back through the existing state fields before close.

Boundary:

- This is dashboard environment state in plugin settings, not weekly tracking content.
- It does not alter `Mandala_WeeklyGoals.json`, row schemas, row ordering, or weekly tracking save behavior.
- The daily lesson dashboard tab still uses the existing `contentScrollTop` environment state; the stability/live-remember rule above also applies to that ordinary dashboard scroll path without introducing a separate daily scroll state.

## Primary-Key Detail, Weekly Summary, And Vertical Plan Cross-Navigation

status: runtime_synced_static_verified_ui_smoke_pending

The weekly tracking workbench provides direct, stable-identity navigation among three representations of the same managed identity:

- `目标管理：按周汇总` <-> `目标执行计划` for exact Mandala node identity;
- `项目管理：按周汇总` <-> `项目执行计划` for validated Workspace identity, with exact identity preferred before owner-compatible alias matching.
- `目标管理：九宫格主键` -> the matching goal weekly-summary row or goal execution-plan row;
- `项目管理：Workspace 主键` -> the matching project weekly-summary row or project execution-plan row.

Summary/plan rows keep the compact icon inside the existing primary-key heading cell. Per-key detail headers expose two compact icon-and-label actions, `周汇总` and `纵向管理`. Neither form adds another table column. Navigation preserves the selected historical week, changes only within the same goal/project domain, centers and briefly highlights the matching row, and keeps the existing `打开` drill-down path intact.

This is an identity-and-view contract, not a new data relation or owner. Weekly summaries remain observation-bounded historical slices; execution plans remain current forward-looking projections. A stopped, killed, or source-missing historical key may therefore have no current-plan destination. That outcome produces a bounded explanation and must not recreate, resume, or reactivate the key.

Explicit row focus takes precedence over ordinary per-tab scroll restoration. Pending focus is generation-owned, cancelled on close/rerender/unload or abandoned navigation, and must never let an older request clear a newer target or let delayed restore timers overwrite a successful jump.

Detail navigation flushes only an existing dirty source page before switching. Clean navigation performs no business write; a dirty detail page performs one owner save. If that save rejects, the dirty flag is restored, the user receives a Notice, and no pending focus or tab switch is admitted. Destination rendering does not create a stopped, killed, source-missing, or selected-week-absent row.

Trace: `change-records/2026/2026-07/20260730-000352-mandala-weekly-plan-cross-navigation.md`; `change-records/2026/2026-07/20260731-112500-mandala-primary-key-detail-navigation.md`.

## Workspace Weekly Summary Editing

status: confirmed_by_code

The `项目管理：按周汇总` view can act as an inline editor for the selected week.

Current contract:

1. The row source remains Mandala's Workspace weekly row store.
2. The editable current table is exactly the selected week's retained Workspace rows intersected with `listEffectiveOperationalContextKeys()`; an unavailable or invalid snapshot fails closed.
3. `查看已不追踪 / 归档` shows the selected week's retained rows outside that final snapshot. Archive rows are read-only, contain no textarea and never enter `workspaceSummaryRows` or a save payload.
4. The summary view writes through `upsertWorkspaceWeeklyGoalRows(nodeId, rows)`, the same owner-side persistence path used by the per-Workspace detail page.
5. The summary view keeps Project Overview / Workspace Mount ordering and readable title resolution as display evidence only; neither plugin becomes the row owner.
6. Switching week, refreshing, opening a row, switching tabs, closing the modal or entering archive flushes summary drafts before rerender / navigation. A rejected upsert restores `workspaceSummaryDirty`, notifies that the draft remains, rethrows, and prevents the archive switch.
7. The `打开` button remains only on editable current rows as a drill-down path to the per-Workspace detail page.

User-facing meaning: the weekly project management table is no longer only a read-only overview. It can be used as the actual weekly planning and review entry surface while preserving the existing detail-page fallback.

## Goal Weekly Summary Editing

status: repository_dev_verified_runtime_mirror_pending

The `目标管理：按周汇总` view can act as an inline editor for the selected week.

Current contract:

1. The row source remains Mandala's goal weekly row store.
2. The editable current table is exactly the selected week's retained goal rows intersected with `listEffectiveGoalOperationalContextKeys()`; an unavailable or invalid snapshot fails closed.
3. `查看已不追踪 / 归档` shows the selected week's retained rows outside that final snapshot. Archive rows are read-only, contain no textarea and never enter `goalSummaryRows` or a save payload.
4. The summary view writes through `upsertWeeklyGoalRows(nodeId, rows)`, the same owner-side persistence path used by the per-goal detail page.
5. Project Overview ordering remains display evidence only; Project Overview does not become the row owner.
6. Switching week, refreshing, opening a row, switching tabs, closing the modal or entering archive flushes summary drafts before rerender / navigation. A rejected upsert restores `goalSummaryDirty`, notifies that the draft remains, rethrows, and prevents the archive switch.
7. The `打开` button remains only on editable current rows as a drill-down path to the per-goal detail page.

User-facing meaning: the target-management weekly table can be used as the actual weekly planning and review entry surface, not only as a read-only rollup.

## Unknowns

## Project Overview Kill Read Boundary

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-07-27

Mandala consumes Project Overview primary-key lifecycle as read-only evidence for weekly badges and new-score admission. Project Overview remains the Kill owner; Mandala remains the stopped-tracking and score owner.

- Workspace rows match the `workspace` lifecycle domain; goal rows match `mandala`.
- `已 Kill` remains explanatory status on weekly surfaces. In the score modal, a fresh Kill snapshot suppresses only new score blocks; it does not call either stopped-tracking API, delete historical scores, or modify `Mandala_WeeklyGoals.json`.
- Owner-event bursts are coalesced. Mandala fetches one trusted snapshot and patches connected badge elements without rerendering the dashboard/table or flushing drafts.
- Open Workspace/Goal score modals also consume Project Overview and Mandala lifecycle dirty events. Events synchronously invalidate pending admissions while visual refresh remains coalesced.
- Snapshot failure or API absence retains the last trusted badge state but cannot authorize score filtering. Score admission uses its own request-scoped fresh result and lifecycle revision.
- Plugin unload removes both lifecycle listeners, cancels timers, invalidates requests/admissions, and clears the lifecycle cache.
- The user still decides manually whether a killed project/goal should become `不再推进` in Mandala.

Trace: `change-records/2026/2026-07/20260723-120847-project-overview-primary-key-kill-mode.md`; `change-records/2026/2026-07/20260727-225827-mandala-score-primary-lifecycle.md`.

## Unknowns

- Which project plan field should dominate AI coaching when it conflicts with weekly tracking.
- Whether Mandala project plans should eventually expose a compact AI-oriented summary API.

## Daily Lesson Item Ontology

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-01

Each canonical Mandala daily-lesson item may own an independent recursive Ontology document in `Mandala_DailyLessons.json`. A referenced row opens the canonical item's Ontology rather than creating a reference-local copy.

- Mandala owns the formal Ontology, canonical side/item identity, mutation queue, CAS decision, and recovery records in plugin data.
- Workspace Mount supplies the versioned external Ontology editor through `window.__workspaceMountPluginApi.ontologyEditor`; it receives owner callbacks and never writes Mandala business JSON or becomes a second recovery owner.
- First open starts with one empty row and one editable `未命名列`. Clean open/close performs no formal or recovery write.
- Recursive child schemas, per-row child-table instances, text, image albums, clipboard import, confirmed exact-reference removal, and attachment no-delete reuse the Workspace editor contract.
- Every Mandala daily-item writer preserves an existing Ontology value, including adjustment and structured-field paths. Unknown/malformed values remain opaque until the editor can validate them; ordinary writes must not normalize them away.
- Owner/provider generation leases, current-formal conflict responses, recovery authority, and unload barriers fail closed. If durable recovery cannot be preserved, Mandala rejects destructive owner teardown rather than silently closing the editor.

User-facing meaning: every daily lesson can accumulate its own expandable procedural knowledge without moving that knowledge into Workspace ownership or losing it through ordinary daily edits.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260801-133216-mandala-daily-ontology-workspace-delete-lock.md`.

## Daily Completion Ontology

status: confirmed_by_code
base_runtime_evidence: runtime_synced_static_verified_ui_smoke_pending
cross_date_reference_refinement: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-11

The daily `完成情况` field now has a separate recursive Ontology entry without replacing its existing text area.

- Mandala owns `Mandala_DailyCompletionOntology.json`; Workspace Mount remains only the versioned editor provider.
- One `schemaAuthority` is shared across dates. `instancesByDate[date]` owns that date's independent recursive table graph, so schema edits propagate conceptually while text, image references and child-table content remain date-local.
- Historical instances are sparse. Opening an older date may materialize missing cells in the in-memory editor projection, but read/render/projection completion never writes the JSON. Only saving that date persists its completed projection.
- Commit CAS separately checks shared-schema hash, selected-date instance hash, provider generation, and owner/source/date identity. A conflict returns the current formal projection and preserves the draft.
- A date instance does not own or reserve an entire shared parent column. References are evaluated through stable parent-column IDs, so one date may reference the first source row and another date may reference a different row from the same source column while both reuse the same recursive Schema.
- Ordinary saves do not imply unlink. Workspace reports structured removed-reference evidence to the Mandala owner policy; Mandala retains a pending Shared-Schema binding whenever the matching stable column was not explicitly unlinked, another date still references it, reference state is malformed, or the date-instance snapshot drifted during the transaction.
- A previously incorrect local fork may recover its lineage only when the local recursive Schema, the latest detached provenance snapshot and the current source authority are strictly equivalent. Recovery restores metadata only and preserves every date-local row, text, image, table instance and stable ID.
- Regular date commits additionally CAS the aggregate hash of all other date instances; Schema-only commits CAS all instances. This prevents a close/save in one date from silently detaching or overwriting another date's binding state.
- A completion commit freezes `sourceNotePath` and `Mandala_DailyCompletionOntology.json` path before asynchronous reads, rechecks both immediately before publication, and writes/rereads only that frozen path. Switching Mandala source while a save is in flight fails with `ONTOLOGY_OWNER_STALE`; an old-source draft cannot be redirected into the new source directory.
- Shared-schema edits do not batch-rewrite every historical date instance. The safe writer stages and validates serialized JSON, publishes by rename, verifies authoritative reread, and restores the previous file on failure.
- The new JSON is created only by the first successful owner commit. Plugin deployment, clean open/close, rendering and history inspection do not create it.
- Date-level recovery uses the existing durable plugin-data recovery store under a distinct owner namespace and participates in the provider close/unload barrier.

User-facing meaning: every day is one independent historical observation surface, while the table form can evolve once and remain consistent across dates.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260802-ontology-history-lifecycle-daily-completion.md`; refined by `memory/obsidian-plugin-system/change-records/2026/2026-08/20260811-084227-daily-shared-schema-reference-retention.md`. Bayesian update: `refines` Mandala's daily-record and JSON-partition model, including cross-date Shared-Schema retention and provenance repair. Question Map and unknowns remain unchanged because ownership and conflict boundaries are closed by code, tests and independent verification.

## Longitudinal Primary-Key Ontology

status: confirmed_by_user_and_code
runtime_evidence: runtime_synced_user_verified
updated: 2026-08-09

ui_verification:
  date: 2026-08-09
  result: confirmed
  scope: 用户打开多个项目主键后确认各入口显示同一套递归 Schema 构型
  boundary: 仅确认项目主键共享结构；项目文字、图片、行实例、嵌套实例仍各自独立，目标主键 Ontology 不受影响

Every visible primary key in `目标执行计划` and `项目执行计划` now has a compact standard Ontology action inside the existing primary-key cell. No extra table column is introduced.

1. Mandala owns `Mandala_LongitudinalOntology.json`. Goal-primary owners retain independent complete recursive Ontology documents. Project-primary owners share one recursive Schema authority while retaining independent document/table/row/cell instances. Workspace Mount remains the external editor provider only.
2. Goal owner identity is `sourceNotePath + goal + nodeId`. Project owner identity is `sourceNotePath + project + workspaceIdentityAlias(nodeId)`. Display title, array position, current ordering, and latest-row choice are not identity.
3. The existing recursive Schema of project primary `电路板外委工艺要求` is the initial project-family authority. Its exact pre-migration `schemaaddr:v2`, document id and Schema ids remain stable; the title is evidence only and is never persisted as identity.
4. Missing shard, opening, rendering, status inspection, and clean close are write-free. The shard is created only by the first meaningful successful owner commit.
5. The v2 shard keeps goal records in `documentsByOwnerKey`, the project Schema in `projectSchemaAuthority`, its durable identity in `projectSchemaAuthorityIdentity`, and owner-local project instances in `projectInstancesByOwnerKey`. A v1 read never writes; the first successful project save performs one guarded v1-to-v2 publication. A goal save against v1 remains v1 and preserves the legacy project record.
6. The 64 MiB admission limit is checked against the exact pretty-serialized byte sequence before adapter I/O and checked again at the safe-writer boundary. Loader size admission occurs before materialization and repeats after read for growth races.
7. Stop, Kill, current projection filtering, and complete owner absence may hide a current longitudinal row but never delete its Ontology. Resume reconnects through the same stable identity.
8. Ontology bodies and recovery drafts do not enter `listGoalPlanRows()`, `listProjectPlanWorkspaceRows()`, Timeline, Project Overview, Collection Card, scoring, printing, AI summaries, or ordinary plan JSON.
9. Button state is `populated / empty / unknown`. Only populated shows the standard outside-corner dot with a background-colored border, matching the Workspace Ontology status marker; empty and unknown never light it.
10. A project row/content/image/nested-table save changes only that owner's instance unless the Schema graph itself changed. Schema-only save preserves every project instance and every goal document; all current and historical project instances must validate against the candidate Schema before publication.
11. Schema CAS, current-project instance CAS, full projected Ontology hash and raw JSON CAS are checked separately. Disjoint project row writers may commit against an unchanged authority; stale Schema or instance drafts fail closed with split recovery evidence.
12. Project Schema-only navigation prefers the requested current project, then the current seed owner, then stable owner-key order. If no current project exists, historical authority remains discoverable read-only and no writable owner is invented.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260804-002500-mandala-longitudinal-primary-key-ontology.md`; refined by `memory/obsidian-plugin-system/change-records/2026/2026-08/20260809-123218-mandala-time-blocks-project-shared-schema.md`. Bayesian update: `corrects` the old all-owner-independent persistence claim and `splits` goal independence from project-family Schema sharing. The latest user UI evidence confirms the project-primary shape in the deployed interface; it does not upgrade content synchronization to a shared state. Question Map and unknowns remain unchanged because the ownership, migration and conflict contracts are closed by code, regression evidence and independent verification.

## Weekly ABC And Today-Wave Projection

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-05

Goal and project weekly-summary rows and current vertical-management rows now use one read-only current-attention ordering lens: Project Overview capsule level `A -> B -> C -> CZ -> 0`, then Timeline's complete today-wave position inside each level, then Project Overview index and stable identity. Goal IDs and complete Workspace jump keys are reduced separately; titles never participate in the join.

Rows absent from today's wave remain after present peers in the same level. Historical weekly content, selected-week ownership, lifecycle markers, and row bytes remain unchanged. Vertical management first applies its current active/owner/lifecycle visibility filter, then uses the same ordering on the remaining rows; therefore its rows are a filtered subsequence of the corresponding weekly order. The same ordering applies to weekly-summary and current vertical-management printing. Scoring, roster capture, lifecycle candidates, and Project Overview itself keep their previous ordering.

Timeline failure, malformed identity, truncation, or Project Overview provider evidence without internally valid capsule metadata cause an all-or-nothing fallback to the prior Project Overview order. Mandala never consumes a partial Timeline wave snapshot.

Mandala goal weekly-summary and vertical-plan rows are managed goal identities. Their ABC evidence comes directly from the matching Project Overview Mandala group's `primaryNodeKey/nodeId`; their within-level rank comes from Timeline's matching goal identity. Ordinary `group.columns.mandala` members are surrounding evidence, not additional goal primaries. Member overlap therefore does not invalidate ordering. Primary identity disagreement and illegal or contradictory advertised primary metadata still fail closed for the whole request.

Current Mandala data may also contain visible goal rows that are not present in the current valid PEO primary set. Mandala does not interpret that absence as deletion authority: matched goals continue to use `ABC -> Timeline -> PEO -> id`, while unmatched rows remain visible in a deterministic tail and receive the neutral marker `当前未进入 PEO 目标主键集合` in weekly summary, goal execution plan and print. The row-level partial contract applies only to goals; project rows retain all-or-nothing fallback when metadata coverage is incomplete. No owner API, lifecycle state, history, Ontology or business JSON is changed by this projection.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260805-weekly-abc-today-wave-order.md`; corrected by `memory/obsidian-plugin-system/change-records/2026/2026-08/20260805-goal-primary-abc-timeline-order.md` and refined by `memory/obsidian-plugin-system/change-records/2026/2026-08/20260805-190502-mandala-time-blocks-goal-partial-order-preserve-unmatched.md`.
# Ontology Discovery Provider

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-06

Mandala exposes four bounded Ontology discovery families to Ontology Meta Hub while retaining sole ownership of all formal data:

- `mandala-daily-record`: exact union of persisted daily rows and completion Ontology date instances.
- `mandala-daily-item`: canonical side items only; cross-state references resolve to the same owner.
- `mandala-goal-primary`: current goal plan rows union retained longitudinal documents.
- `mandala-project-primary`: current project plan rows union retained longitudinal documents with Workspace alias-aware identity.

Owner reads are strict and write-free. Current rows and retained documents are unioned so stopping/Killing/removing a current projection does not erase cognition. Detached retained documents are reported as historical orphans and can open only through Workspace's forced read-only external editor.

Source navigation is owner-controlled: daily records focus the completion section for the exact date; daily items focus the canonical owner row; goal/project entries open `goalPlan/projectPlan` and apply one-shot exact row focus through the existing weekly-surface registry. Source-note changes, provider replacement and aborted Hub actions fail closed before modal/focus side effects.

Ontology Meta Hub never reads `Mandala_DailyLessons.json`, `Mandala_DailyCompletionOntology.json`, `Mandala_WeeklyGoals.json` or `Mandala_LongitudinalOntology.json` directly.

## Mandala Ontology Cell Reference Participation

status: runtime_synced_static_verified_ui_smoke_pending

- Daily records, daily items, goal primaries and project primaries retain Mandala-owned formal persistence and recovery lifecycles.
- Mandala passes canonical owner context and the Hub adapter into Workspace Mount's shared editor; it does not duplicate the recursive engine or transfer owner JSON to the Hub.
- Daily completion dates resolve to one source-level `schemaaddr:v2` Schema authority; the date is navigation/instance context, not Schema identity.
- Ordinary date commits and Schema-only commits share one authority lease and queue. The Schema-only writer CAS-checks only admitted authority fields, preserves every serialized `instancesByDate` entry exactly, rereads, and emits `ontology-schema-authority:changed`.
- A second writable date/Schema route for the same authority is refused. Split failure, raw CAS conflict, owner/provider drift and authoritative-reread mismatch publish no half state.
- All Mandala external-owner Modals inherit live source/backlink UI, structure-only schema lineage, exact jumps, dynamic provider downgrade read-only and post-confirmation mutation rechecks.
- Public weekly/vertical plans, Timeline, Project Overview, print and score projections do not expose Ontology bodies, recovery drafts or embedded reference graph storage.

Evidence: Mandala/Hub regressions, independent verifier `019fda36-df0e-78e1-92de-8cb4d44db112` final `PASS`, detach/close verifier `019fdb3d-daa0-76f2-8d2d-aab2fd638690` final `PASS`, and three-way deployed Mandala hash `627915A7AA5B918F97F52CD43F8ED4F207E8867B3D1409DA613A950C697ABD55`. Bayesian update: `refines` the existing shared-date Schema authority and lease model; runtime interaction smoke remains pending.

## Daily-Item Ontology Editor Commit Lease

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-07

- A daily-item Ontology editor may remain open after the Daily Lessons Dashboard closes. Its formal commit uses a private lease bound to owner identity, provider generation and `daily-ontology-commit` operation.
- Lease admission is synchronous before queued asynchronous work. Closing the editor stops new admission but retains the permit until already admitted work drains.
- The lease does not reopen Mandala's page-global mutation gate and cannot authorize unrelated text, image, page or owner writes.
- Provider/owner drift, unload and base-hash conflict still reject publication. Recovery remains owner-held and the editor keeps the draft on failure.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260807-ontology-reference-proof-save-hotfix.md`.

## External Editor Schema Authority Passthrough

status: runtime_synced_static_verified_restart_smoke_pending
updated: 2026-08-07

- Mandala's external Ontology editor binding passes both the ordinary document owner authority and the optional Schema-specific authority into the Hub adapter.
- Daily completion uses its source-level shared Schema authority for `schemaaddr:v2`; the selected date remains instance/navigation context and cannot be substituted as Schema identity. Daily items and longitudinal documents continue to use their ordinary owner authority.
- Authority refs remain structured opaque values across Mandala -> Hub -> Workspace. No adapter layer may stringify them for logging, display or transport.
- This correction is code-only. It does not migrate, normalize or rewrite Mandala formal business JSON or durable recovery data. Existing malformed recovery drafts remain governed by Workspace's explicit proof-gated local-fork recovery.

Bayesian update: `refines` Mandala's external-editor and cross-date Schema-authority contract. Repository Dev, Runtime and Mirror now share the verified Mandala hash `C9D7C1AF...A329888`; deployment verifier `019fdc88-fafe-7e90-ab1f-0b30f9e68fab` returned `PASS`. The existing malformed recovery draft remains untouched; actual Obsidian interaction smoke is pending after a full restart.

## Inactive Daily-Item Discovery Visibility

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-08

- `active === false` hides a canonical daily lesson from Mandala's Ontology Hub summary, source capsules, counts and paged directory.
- This is a projection rule, not deletion or lifecycle conversion. Cell/Schema resolution, Meta references, Shared Schema lineage, revision vectors, open/reveal and formal Ontology remain available.
- Restoring the same owner makes it visible again. Stop/restore refreshes open Hub views through the existing API after persistence.
- Ontology Meta Hub remains a generic consumer and does not read Mandala owner JSON directly.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260808-183200-mandala-inactive-daily-ontology-visibility.md`.

Deployment: after explicit confirmation, Mandala `main.js` is aligned across actual Runtime, Dev and Mirror at `EAF30B8C...17D6ECAD`. Static syntax and Runtime integration regressions pass. Concurrent running-Obsidian writes to `Workspace_Items.json`, `workspace-mount/data.json` and `Mandala_DailyLessons.json` were preserved; no business JSON was deployed or rolled back. Loaded UI smoke remains pending reload/restart.

## Daily-Item Archive Review

status: runtime_disk_synced_static_verified_ui_smoke_pending
updated: 2026-08-21

- Daily Lessons adds a per-side `查看归档 (N)` / `隐藏归档 (N)` path for canonical owners whose `active === false`. Cross-side references remain projections and never become archive owners.
- Archive rows are pre-rendered in a separate read-only table body. View/hide changes only session-local DOM visibility; it does not flush, rerender, queue a draft, enter editable `pageRows`, create a current-day entry, or write plugin/business data.
- An inactive owner already visible because the selected historical date has a real entry or an exact source focus is not duplicated in the archive section. The count still represents every inactive canonical owner on the selected side.
- Archive rows retain the existing Ontology action and an explicit `恢复` action. Restore uses the same Mandala owner ID and existing mutation queue, preserving historical date entries, references, structured images and formal Ontology; Hub visibility returns only after successful persistence.
- No JSON schema, provider API, command, event, bridge or ownership boundary changes. The feature is a missing lifecycle-discovery UI over data Mandala already retains.
- After the user confirmed only the Daily Lessons change, Actual Runtime and Repository Mirror received a verified daily-only candidate at `D1DFD7BB...21F5`. Repository Dev intentionally remains at `2C01599A...614848` with the separately verified 25-line Goal-owner filter; those Goal lines are absent from Runtime/Mirror. Static syntax, archive sentinels, the Ontology Meta Hub regression, byte backups and five unchanged business-data sentinels pass. Loaded UI smoke remains pending Obsidian reload.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260821-140730-mandala-daily-item-archive-review.md`.

## Planning Primary Ontology Owner Resolver

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-11

- `ontologyIndexProvider.resolvePlanningTargetOntologyOwner()` accepts the stable planning tuple supplied by `listTimelinePlanningTargets()` and resolves it inside the requested Mandala source scope.
- Goal identities remain node-id based. Project identities are normalized by Mandala's existing Workspace alias authority; consumers do not copy that algorithm.
- The resolver returns a clone of the provider-native current or retained historical `stableRef`. Zero and ambiguous matches fail closed, and provider generation plus abort admission are rechecked around the request.
- This is read-only identity routing. It creates no Ontology owner, writes no planning row and changes no business JSON.

Bayesian update: `refines` the existing Ontology provider contract for the Temporal consumer. Source status: `confirmed_by_code`; final verifier `019ff18a-207b-7ee1-8ba2-97fb6d4ed485` returned `PASS`. Dev/Runtime/Mirror now align at `0D23013E...E282733`; deployment verifier `019ff1a5-9be0-7740-b398-e3f882cc5b5c` found no P0/P1, with loaded UI smoke pending.

## Project Ontology Current-Tracking Parity

status: repository_dev_verified_runtime_pending
updated: 2026-08-22

- `mandala-project-primary` current membership is the same final stable-identity set returned by Timeline project planning targets with `includeStopped:false`. Both consume one owner-side final admission after newest-lifecycle alias reduction; a stopped closeout row may survive the intermediate weekly projection but cannot remain current in either consumer.
- Retention and membership are separate. Active state-only owners may be current without a persisted plan body. Stopped or legacy plan-only owners are `historical + attached + unavailable`; instance-only owners are `historical + orphan + unavailable`. Stopping never deletes plan text, formal Ontology, stable references or title evidence, and resume restores the same owner identity.
- Every historical project owner opens through the forced read-only external editor. It receives no document commit, recovery persistence or shared-Schema writer. Current-only source reveal is unavailable for historical owners until a history-aware exact source route exists.
- Inclusive tracking rows participate in Workspace source discovery, current-name projection, canonical `sourceOwnerId` and provider revision, so state-only owners receive the same title protections as plan-backed owners.
- Repository Dev and both staging baselines pass the full focused regression. The current read-only Runtime fixture dynamically proves Timeline current = Ontology current = 38, with 34 retained stopped owners in History. These counts are evidence, not a fixed contract.
- Actual Runtime and Repository Mirror remain unchanged pending independent post-change verification and explicit deployment confirmation. The Runtime-preserving and combined candidates retain the exact pre-existing 25-line Dev-only Goal-filter difference.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260822-105345-ontology-project-tracking-parity.md`.


## 2026-09-30 Time-block capture native tab (repository candidate)

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code

User confirms time-block records now select an effective project/goal primary context. The capture page removes the technical source-path/leaf-count card and historical branch/leaf selectors; hidden legacy filter values are retained but no longer constrain capture results. Historical record bindings remain visible and editable; other Mandala tools retain their ownership and behavior.

Mandala 0.1.9 registers native ItemView `mandala-time-blocks-capture-view`, command `mandala-time-blocks:open-time-blocks-tab`, and provider method `getTimeCaptureSourceNotePath()`. View state contains sourceNotePath and captureId; each leaf owns its quick-input draft and render generation. Quick drafts are Mandala-owned plugin data (timeCaptureDrafts), not capsule environment state. Opening/restoring an empty view does not create business files or migrate keywords. Explicit record mutations use the owner queue and compare-and-swap protections; incomplete pending edits use the existing draft-safe record modal.

View Group Hub consumes the source identity and native view type only. The old modal, EVA view type and non-capture tabs remain compatible. Node and Edge mocked-host checks cover source drift, concurrent saves, retained historical records and recoverable drafts. Native reload, real multiwindow behavior and user-paced switching remain unverified.

Update: refines; layers: symbolic entry and execution capture; owner/provider: Mandala; consumer: View Group Hub; related questions: OPS-002, FW-011, FW-019. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-218)（外部来源未随包提供）.


## 2026-09-30 Time-block native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Mandala 0.1.9 and View Group Hub 0.2.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-219)（外部来源未随包提供）.


## 2026-09-30 日课 native tab and performance boundaries

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Mandala 0.1.10 adds native ItemView `mandala-daily-lessons-view` and command `mandala-time-blocks:open-daily-lessons-tab`. The complete existing daily lesson renderer (day/week transitions, modes, references, archive, item fields, images and Ontology entry points) runs in an isolated leaf session. The legacy modal and EVA/ontology navigation APIs remain. Sessions register no second provider; Mandala retains sole content/draft ownership, shared daily mutation queue, CAS evidence, authority leases and plugin-data queue. UI readers, page baselines, image lifecycle and admission are local to each host. View state is sourceNotePath/dailyId/date; drafts are Mandala plugin data dailyViewDrafts, never capsule environment content.

Both legacy and native daily page saves use per-host canonical baselines and sparse three-way field merges. Disjoint fields merge; changed conflicting fields and deleted/re-owned items reject. Daily-store reads are strict, missing defaults remain in memory, and writes require raw-read WeakMap evidence plus atomic CAS and source guard. No read normalizes data back to disk. Existing root image/ontology daily mutations use the same loader/writer. Open reads the daily owner store and completion-ontology state, requests only selected-day Timeline milestones, and never loadAll. Retained focus makes zero extra read/render calls in the 25-open mocked test; group bootstrap retains its existing prewarm policy. No measured native startup or UI latency claim.

Native drafts are debounced and persisted before content commit, drained before close, and re-snapshotted after accepted image work. A business conflict may close after the latest full draft is durably stored and image work is resolved; the notice explicitly says draft-only. Failed draft persistence retains the session and exposes its in-memory recovery in a later page. Incomplete image work retains its original retry closure and can be retried from a reopened page; unload cleanup refuses to continue after unresolved close. This is not an OS/process-exit veto or a guarantee under failed storage. Recovery is explicit and conflict checked; conflicting drafts remain copyable. Native multiwindow/window migration, real provider/editor integration and full app shutdown remain user acceptance gaps.

Runtime installation awaits separate package approval. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-220)（外部来源未随包提供）.


## 2026-09-30 日课 native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK请部署”. Mandala 0.1.10 and View Group Hub 0.2.4 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-221)（外部来源未随包提供）.


## 2026-09-30 Time-view performance and historical capture boundary

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Mandala 0.1.11 scopes both native and modal capture reading to source identity, strict time-record JSON and capture settings. Current capture no longer requires or reads the Mandala DB/type/keyword structure. Effective-primary-key chooser validation and other structural tools remain unchanged. User explicitly requests sealing records before 2026-09-15: the read-only audit found 179 records, 172 before the cutoff (161 legacy, 11 primary), seven since the cutoff all primary. This is a date partition, not a classification migration. A read-only history modal pages saved labels/comments/duration/score in batches of 50; original objects remain in the owner file. Unknown/invalid dates remain in current pending. Current range is clamped in memory on read; both capture CAS paths reject changing any sealed object, backdated creation and current-to-history movement. Active writes preserve historical semantic content and unknown fields; serialization may change whole-file whitespace. Opening/history viewing writes nothing.

Closed overview details create zero table rows. Expansion pages 50 rows and every row remains reachable. Native successful record CAS publishes its fresh snapshot to the owning live state, invalidates old refresh generations, then locally redraws pending and only changed day columns. Displayed-context palette identity participates in invalidation. Quick fields, unsaved range fields and detail expansion/page state are retained; quick timestamp and draft reset together after commit. Range CAS publishes committed settings into that same state, preventing concurrent record/range saves from choosing an obsolete range. Explicit toolbar refresh remains a strict reload. The whole record file still must be parsed/CAS-written: no IO-byte or native latency improvement is claimed. Existing drafts, source guards, CAS, daily lesson sessions and Hub prewarm remain.

Runtime installation awaits separate package approval. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-222)（外部来源未随包提供）.


## 2026-09-30 Time-view performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “Ok就请部署”. Mandala 0.1.11 and Timeline 0.1.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-223)（外部来源未随包提供）.


## 2026-10-01 Weekly native view and render performance

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Mandala 0.1.12 provides source-bound ItemView mandala-weekly-tracking-view and command open-weekly-tracking-tab, retaining six weekly surfaces and leaf tab/week/owner state. Native restore reads only, does not capture current-week rosters implicitly, and bypasses loadAll. Project surfaces skip unrelated goal-tree/all-goal-row reads; textarea sizing batches writes/reads/writes. Ordinary native saves use the shared weekly mutation queue with render-baseline whole-file CAS, durable copy-only recovery, source checks, serialized flush entries and save-before-render/close barriers; retained focus preserves controls. Existing structured clear confirmation and image drain remain. Hub prewarm is retained.

PEO additive async workspace order is preferred by weekly order helpers (including print); only absent API permits old sync compatibility. API failure leaves ordering evidence incomplete; it never widens effective eligibility. Project execution-plan sorting and collection projections share one in-flight PEO workspace model. Original ABC then Timeline order and whole-table fallback for missing ranks remain; no guessed group-member levels. Native latency remains unmeasured. [Engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-224)（外部来源未随包提供）.


## 2026-10-01 Weekly native performance — approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this reviewed package with “请部署”. Mandala0.1.12, PEO0.1.6 and Hub0.2.6 main.js/manifest.json are installed in the proven NEWERA runtime. Program hashes match reviewed Dev/Mirror candidates. No business JSON/settings/index copied and no plugin reload triggered. Prior ownership and safety contracts remain; native UI/latency acceptance is still pending. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-225)（外部来源未随包提供）.


## 2026-10-01 Weekly tab switching refinement

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: refines

Mandala0.1.13 addresses user-reported four-tab switching lag. Shared legacy/native renderer skips clicking the already active tab; project rows and effective-key reads run concurrently and drain both on failure. Native host alone uses an exact-weekly-file read snapshot limited to one render, initialized after saves and discarded in finally or before write attempts. Repeated readers parse those bytes once and receive independent clones; final fresh disk evidence still rejects changes. No cross-render cache or PEO/Timeline eligibility/order cache. Legacy flush remains; native redundant base-render flush is skipped only for a truthy matching host token after the host flush barrier. Source-switch, CAS, old editor/recovery retention and real upstream lookups remain.

Native weekly recovery button is hidden when the current source has zero stored/in-memory recoveries and otherwise shows count. Recovery panels remain readonly/copyable and repeated opening replaces that panel. Render phase metrics contain tab/timings only (save barrier, initial read, page build, verification, commit); asynchronous textarea layout/paint is outside this metric. Node12 and Edge23 fixture checks pass, including previous safety regressions and scoped-read freshness/clone/write-error tests. No live-vault timing claim; full DOM rebuild and upstream model cost remain. Framework/Atlas update check: updated/refines FW-011 and existing save/source contracts; no authority/schema change. [Trace](../../../../REFERENCE_BOUNDARIES.md#ref-226)（外部来源未随包提供）.


## 2026-10-01 Weekly switching optimization approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “请部署”. Mandala0.1.13 main/manifest installed in proven NEWERA runtime. Native weekly page shares one render-scoped weekly read and skips an authenticated redundant flush; shared tabs ignore current-tab clicks and project reads drain concurrently. Recovery entry displays only when source-matched drafts exist, with count. Final disk verification, source guards and draft protection remain. No cross-render eligibility cache, business/settings copying, native reload or live speed claim. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-227)（外部来源未随包提供）.


## 2026-10-24 r30：待核验自愈（confirmed_by_code / refines，原生待验）

PEO目录续期会在同内容下替换快照对象而不通知；跨越替换的"取pass→等待→再核验"流程会显示待核验，旧版只能等签名变化或用户点"重新核验"。r30在同构 `createLifecycle` 增加内部可选 `isPending`：目录ready且视图仍待核验时重绘一次，仍经原输入/加载/弹窗保护，重绘次数不超过check次数，自愈最长约一个周期（≤30s）。九宫格主键投影 `./lifecycle.cjs`/`./ui-host.cjs` 模块；`isPending` 读 `root.dataset.snapshotState`；`m.invalid` 不自愈，凭证发布方未改。非公开契约。[证据](../../../../REFERENCE_BOUNDARIES.md#ref-228)（外部来源未随包提供）
