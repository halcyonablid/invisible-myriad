# Atlas Log

## 2026-10-22 S3-A3 发布端候选证据

Framework/Atlas update check: updated。Observation：用户要求继续并保持PLAN/Atlas/Framework一致。Claim：真实聚合链存在隐含sync getter→旧ensure反馈，新增observer路径必须传入冻结别名；最终发布前应清除外来迭代器副作用并复核代数。source_status=confirmed_by_code（候选/隔离测试）；update=refines。非原生性能结论，非运行API升级。

Targets：PEO页、MapReduce页、BUS-U02与FW-027。主线顺序只在state/PLAN.md；未改Skill/契约registry或日常/实验vault。Trace：results/context-key-bus-management-20261012/sync-bus-r/a3/，工程记录20261022-sync-bus-r-a3-publisher.md。消费者、全owner修订号和原生延迟仍open。

## 2026-10-22 修订号候选与运行基线回归

Framework/Atlas update check: updated。Observation：用户要求继续实验推进、Mermaid路径、回归唯一PLAN并同步Atlas/Framework。Claim：当前日常/新实验PEO已回到d0ebcaeb，旧TV部署描述只保留历史；A0/A1候选证据与实际运行协议分离，A2源码接线仍未部署。source_status=confirmed_by_user（范围）+confirmed_by_code（冻结磁盘与候选），性能unknown。update=corrects+refines。

Targets：Atlas PEO页校正环境，MapReduce页落成熟版本/写settlement边界，unknowns登记BUS-U01～03；Framework FW-027/024只维护问题/证据，不复制执行计划。PLAN包含唯一当前次序与Mermaid。S1.5调查暂停，不宣称创建超时已修。

Trace：results/context-key-bus-management-20261012/sync-bus-r/a2/PROPOSAL.md、PREFLIGHT.md、NAV-DEPENDENCIES.md、candidate-manifest.json；工程记录20261022-sync-bus-r-a2-host.md。Skill/规则不变，运行contract/API registry不升格；真实实验接线验收后再更新协议状态。

status: active
created: 2026-06-24

This log records Atlas maintenance events. It is not an engineering change record; detailed file modifications live under `memory/obsidian-plugin-system/change-records/`.

## 2026-07-29 - Mandala Weekly And Vertical Plan Cross-Navigation

status: runtime_synced_static_verified

- Refined the Mandala plugin page and planning workflow with bidirectional stable-identity navigation between goal/project weekly summaries and their current execution-plan rows.
- Registered that the affordance lives inside the existing primary-key heading, preserves historical-week context, stays within its owner domain, and does not merge weekly and vertical-plan ownership.
- Registered explicit row focus as stronger than ordinary delayed tab-scroll restoration, with generation-owned cancellation and stale-request protection.
- Preserved truthful absence: historical stopped, killed, or source-missing keys are not recreated merely to satisfy navigation into a current-plan projection.

Bayesian update: `refines` the integrated primary-key workflow and Mandala UI contract with runtime-synchronized code evidence.

Boundary:

- No API, event, command, bridge, schema, business JSON, glossary, alias, Question Map, or Skill rule changed.
- Runtime/dev/mirror changed only `main.js` and `styles.css`; business-data sentinels were unchanged across deployment.

## 2026-07-24 - Primary-Key Exit Discoverability And No-Ghost-Data Principle

status: confirmed_by_user_and_code_with_open_system_gap

- Refined lifecycle exit from simple active-view suppression into a five-part boundary: leave active projection, retain stable identity, preserve captured history, expose lifecycle provenance, and keep a bounded review path.
- Registered Project Overview Kill Mode, Mandala historical weeks/stop-week closeout, and Timeline non-destructive stop projection as current owner-specific review routes.
- Defined persisted inactive state with no UI/documented owner-API retrieval path as lifecycle discoverability debt, not successful cleanup.
- Kept a unified cross-plugin retired-primary-key archive as an explicit unknown rather than claiming it already exists.

Bayesian update: `refines` existing Kill and observation-bounded history claims, and `adds_unknown` for system-wide retired-object discovery.

Boundary:

- No plugin code, API, schema, business JSON, Skill, or rule changed.
- Kill and Mandala `不再推进` remain separate owner decisions.

## 2026-07-24 - Register Integrated Primary-Key Management Chain

status: confirmed_by_user

- Registered `output/reports/项目与目标如何记录和安排-表达梳理稿.md` as the durable long-form source for the user's project/goal record-and-arrangement logic.
- Refined the system map with the managed-primary-key layer and separated weekly observation, project execution plan / 项目纵向管理, Timeline allocation, Project Overview evidence projection, and source-owned notes/items.
- Clarified Project Overview as a project dossier desk rather than a second database or owner of Workspace, GTD, Collection Card, Timeline, Mandala, Keyword, EVA, or note content.
- Connected daily lessons as a parallel recurring-practice record form without conflating daily-lesson items with project primary keys.

Bayesian update: `refines` and integrates existing claims; it does not introduce a new API or ownership contract.

Boundary:

- Framework Question Map and Skill behavior are unchanged.
- No runtime plugin or business JSON was modified by this Atlas landing.

## 2026-07-24 - Observation-Bounded History Runtime Confirmation

status: runtime_synced_user_verified

- Promoted the 2026-07-23 observation-bounded history design from a user-confirmed requirement to synchronized, user-verified runtime behavior.
- Registered Mandala schema v3 goal/Workspace weekly rosters, historical title/lifecycle freezing, stop-week closeout, later-week exit, and stable-ID resume semantics.
- Registered Timeline's owner-API lifecycle hydration, coalesced dirty event, inclusive stop-date projection, and non-destructive raw-history boundary.
- Updated the planning workflow, Mandala plugin page, cross-plugin contract, API registry, and originating experience card.

Bayesian update: `confirms` the prior design claim with code, verifier, deployment, and user smoke evidence.

Boundary:

- Project Overview Kill remains an independent lifecycle decision.
- Legacy incomplete weeks remain partial; this update does not claim that uncaptured history can be reconstructed.
- No business JSON, plugin code, rule, or Skill was modified during this knowledge closure.

## 2026-07-23 - Observation-Bounded Daily And Weekly History

status: confirmed_by_user

- Refined the planning-record-execute-review workflow: daily and weekly records are two time resolutions of one user record practice.
- Added the observation boundary: preserve what was captured then in detail, do not fabricate uncaptured history, and do not let current rename/stop/kill state overwrite an old slice.
- Clarified the identity split: stable owner ID carries cross-period continuity; historical title, plan, comment, and judgment belong to the recorded day/week slice.
- Added the Mandala design requirement while explicitly leaving complete historical-roster runtime behavior pending code and runtime verification.

Bayesian update: `refines` the existing cognitive-hardware and daily/weekly layering claims.

Boundary:

- No runtime plugin, business JSON, API contract, rule, or Skill was changed.
- Framework Question Map and Atlas unknowns were not changed; legacy completeness remains an evidence boundary rather than a claim of reconstructed history.

## 2026-07-09 - Timeline-Mandala Planning Milestone Bridge

status: confirmed_by_code

- Added a confirmed Timeline-Mandala planning milestone bridge contract.
- Mandala exports goal/project planning targets through a read-only owner API.
- Timeline imports those targets through Timeline-owned item writes and exposes read-only milestone snapshots.
- Mandala daily lessons and weekly summaries project Timeline milestones as read-only chips containing both item name and milestone name.
- Updated `contracts.md` and `api-registry.md`.

Boundary:

- This does not make Timeline the owner of Mandala weekly/daily JSON.
- This does not make Mandala the owner of Timeline items or milestones.
- Broader Mandala summary snapshots for Project Overview / COACH / AI context export remain roadmap.

## 2026-07-07 - Provider Carrier Summary / No-Activate Snapshot

status: confirmed_by_code

- Updated Workspace Mount, Collection Card View, and GTD context-carrier snapshot API records after runtime/dev/mirror code sync.
- Provider snapshots now preserve the old `items` shape while returning `totalCount`, `returnedCount`, `count`, `limit`, `hasMore`, `cursor`, `revision`, and `timingMs` metadata.
- Workspace Mount can answer Project Overview's no-open-view context-carrier snapshot through provider-owned data read, without activating or revealing the Workspace Mount view.
- Updated `contracts.md`, `api-registry.md`, `plugins/project-execution-overview.md`, and `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md`.
- Boundary: this is provider summary/no-activate support plus Project Overview diagnostics. True visible-first / expanded-group background hydration UI is still a future step.

## 2026-07-06 - Cross-Plugin Aggregation Performance

status: confirmed_by_user_and_memory

- Added `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md` as the Atlas topic for fast, complete cross-plugin aggregation.
- Updated `contracts.md`, `api-registry.md`, and `plugins/project-execution-overview.md` with provider snapshot fairness, bounded MapReduce-style shard/reduce boundaries, and no-full-scan guardrails.
- Added framework question `FW-015` so performance / completeness tradeoffs remain a long-term system topic.
- Updated repo-local and global `obsidian-system-plugin-dev` Skill with a short cross-plugin aggregation performance guardrail.
- Boundary: this is a framework / Atlas / Skill rule update. It does not modify runtime plugin code, business JSON, cache, settings, EVA relation data, or vault notes.

## 2026-06-24 - LLM Wiki Shape And Terminology Layer

Reason:

- User noted that Atlas may become hard to retrieve and maintain as it grows.
- User also noted that specialized terms can drift when future agents paraphrase them instead of preserving canonical meaning.

Actions:

- Added `purpose.md`, `schema.md`, `index.md`, and `log.md`.
- Added `glossary.md` and `aliases.md`.
- Updated Atlas and framework entry points so future agents consult terminology before interpreting high-risk system terms.

Boundary:

- No runtime plugin files were changed.
- No business JSON or vault data was modified.
- This is a maintenance-shape update, not a raw source rewrite.

## 2026-06-25 - Keyword Symbolic Interface

Reason:

- User clarified that keywords are symbols used as the communication interface between the user and the whole Obsidian library.
- The notes below keywords are signal carriers, while the Antinet/ATOM tree gives the concrete address space.

Actions:

- Added `knowledge/keyword-symbolic-interface.md`.
- Updated Atlas index, system map, glossary, and keyword workflow to preserve the keyword-as-symbolic-port model.
- Registered the knowledge chapter in framework registry and question map.

Boundary:

- No runtime plugin files were changed.
- No business JSON, settings, cache, EVA relation data, or vault note data was modified.
- This is a knowledge-model update; it does not change Keyword Index ownership.

## 2026-06-25 - LLM Wiki Operating Model

Reason:

- User asked whether the LLM Wiki mode itself should be landed into framework hardware, not only learned by Skill.
- Independent verifier recommended a light Atlas knowledge chapter with framework registry/question-map trace.

Actions:

- Added `knowledge/llm-wiki-operating-model.md`.
- Updated Atlas index and glossary.
- Registered the model in framework registry and question map.

Boundary:

- Atlas records the operating model as knowledge.
- Framework only registers and tracks the control-plane implications.
- No runtime plugin files, business JSON, cache, settings, EVA relation data, or vault note data was modified.

## 2026-06-25 - Context Capsule Key Trial Contract

Reason:

- User clarified that several plugins share an operation-level capsule keyword layer that is not the same as note-level Keyword.
- User wanted Project Overview to host the management key while Workspace Mount and later consumers align to that key, with unbound consumers showing virtual waiting capsules.

Actions:

- Added `Context Capsule Key / 操作上下文主键` to the glossary.
- Added the Project Overview read-only `getContextCapsuleKeys()` contract.
- Recorded Workspace Mount as the first consumer trial: it projects unbound keys as virtual tab capsule keywords and marks matched local keys as synchronized.

Boundary:

- The trial only syncs identity fields: `contextKeyId`, address, canonical label, color, and icon.
- Project Overview does not write Workspace Mount business JSON.
- Workspace Mount does not create tabs automatically from virtual keys.
- Other plugins are not yet connected to this contract.
## 2026-06-25 - Context Capsule Key Atlas Chapter

status: confirmed_by_user

- Added `knowledge/context-capsule-key.md` as the durable Atlas chapter for `Context Capsule Key / 操作上下文主键`.
- Updated `index.md`, `contracts.md`, and framework `registry.md` so future agents read the concept as a cross-plugin operation identity, not as an Obsidian note-level Keyword or a plugin tab.
- Recorded current consumers: Workspace Mount, Mandala, and GTD.
- Added the address-strict matching rule: `036` and `036B` are different addresses even when their canonical label is the same.
- Boundary: Project Overview owns identity fields; consumers project synced / virtual capsules without writing business JSON.

## 2026-06-25 - Context Capsule Key Strict Matching And Intentional Stance

status: confirmed_by_memory

- Refined `knowledge/context-capsule-key.md`: addressed keys synchronize by exact full `displayLabel`, not by address alone.
- Added the three UI states: `同步`, `本地`, and `虚位`.
- Recorded the Daniel Dennett intentional stance interpretation: virtual capsules make the system present a pending operating context before local plugin content exists.
- Updated `contracts.md` to include Collection Card View as a read-only consumer and to mark Project Overview as the single identity write owner for now.
- Boundary: consumer-side rename propagation is not implemented; future bidirectional sync needs conflict handling, confirmation, and audit.

## 2026-06-25 - Context Capsule Key Provisioning And Edit Direction

status: confirmed_by_memory

- Refined `knowledge/context-capsule-key.md` and `contracts.md`.
- Recorded explicit provisioning as different from passive virtual-capsule rendering: Mandala add-project may ask Workspace Mount, Collection Card View, and GTD to create/reuse local carriers through their own owner APIs.
- Recorded GTD's default carrier shape: top-level tag named by `projectName`, `contextKey` as tag keyword, and a top-level GTD project named by `projectName` appended at the end and tagged with that tag.
- Clarified edit direction: Context Capsule Key identity edits must originate in Project Overview and sync outward; consumer local edits must not implicitly rename the shared identity or propagate to other plugins.
- Boundary: Mandala still does not auto-create a Mandala node because grid placement is semantically meaningful.

## 2026-06-25 - Workspace Title Fallback And Project Entry Order Practice

status: confirmed_by_user_and_code

- Updated `plugins/workspace-mount.md`, `plugins/mandala-time-blocks.md`, and `contracts.md`.
- Recorded Workspace Mount's Project Overview project-list behavior: new project entries intentionally insert at the top; this is confirmed user practice, not a sorting bug.
- Recorded the Workspace Project Title Snapshot contract: Mandala may use Workspace Mount's read-only owner API as a fallback for Workspace weekly summary / project-plan labels when Project Overview's snapshot is unavailable.
- Recorded raw `item_m...` display in Mandala Workspace weekly summary as a regression sentinel.
- Demoted Context Capsule Key sync-rename from active build target to low-priority deferred question because the user confirmed renames are rare and the feature is not very practical.

## 2026-06-26 - Context Capsule Same-Address Repair Protocol

status: confirmed_by_code

- Refined `knowledge/context-capsule-key.md` with the same-address repair protocol for stale consumer carriers.
- Recorded the boundary: passive synchronization still requires exact full `displayLabel`; address equality is used only inside Project Overview-confirmed repair APIs.
- Implemented consumers are Workspace Mount, GTD, and Collection Card View.
- Boundary: no passive rendering path creates or rewrites consumer carriers; repair requires Project Overview owner-side detection, dry-run, and user confirmation.

## 2026-06-26 - State Capsules Context Capsule Key Consumer

status: confirmed_by_code

- Refined `knowledge/context-capsule-key.md` with State Capsules as an implemented Context Capsule Key consumer.
- State Capsules now projects Project Overview keys into its capsule keyword index as synced / local-only / virtual waiting chips.
- Project Overview rename and same-address repair now include State Capsules through `window.__stateCapsulesPluginApi`.
- Boundary: State Capsules only updates existing local capsule `keywords` when Project Overview explicitly calls its owner API; virtual chips are read-only and are not persisted into `data.json`.

## 2026-06-30 - Recent Maintenance Sentinels

status: confirmed_by_memory

- Added `knowledge/recent-maintenance-sentinels.md` to synthesize recent Mandala, Project Overview, Collection Card, and Antinet maintenance experience.
- Recorded recurring guardrails: UI readability sentinels, bounded interactive fanout, date-aware lifecycle, primary-key visual identity, read-only evidence projection, runtime/dev/mirror canonical discipline, and verifier-style review.
- Updated `plugins/mandala-time-blocks.md` with project-plan Collection Card projection, stopped-date, daily-score, and embedded-card readability guardrails.
- Updated `workflows/keyword-antinet-bus.md` with an interactive tree scale guard.
- Boundary: this Atlas landing changes future agent prior; it does not modify runtime plugins or business JSON.

## 2026-06-30 - 2026-06-26 To 2026-06-29 Gap Landing

status: confirmed_by_memory

- Filled Atlas gaps from engineering records dated 2026-06-26 through 2026-06-29.
- Updated `contracts.md` with Workspace source ownership, Project Overview carrier-note suppression, 9XX archived keyword display, and Keyword drawer/SCON topology-order contracts.
- Updated plugin pages for Project Overview, Workspace Mount, Mandala, and Keyword Index.
- Updated `workflows/keyword-antinet-bus.md` with SCON display identity and subtree address-order rules.
- Updated `unknowns-register.md` so SCON topology order is no longer fully unknown; remaining questions focus on global review/search and AI context export representation.
- Boundary: this was Atlas / Framework wiki landing only. Runtime plugin changes remain documented in their original engineering change records; no runtime plugin files, business JSON, cache, settings, EVA indexes, or vault notes were modified.

## 2026-07-01 - Mandala Daily Lesson Low-Margin Flip

status: confirmed_by_user_and_code

- Updated `plugins/mandala-time-blocks.md` with Mandala-owned daily lesson pressure-response flip semantics.
- Updated `knowledge/recent-maintenance-sentinels.md` with a low-margin fallback guardrail: fallback modes should be date-aware, reversible, and continuity-preserving.
- Added `../cards/2026-07-01-mandala-low-margin-flip-intentional-stance.md` as the design/experience landing card.
- Boundary: repo-local dev/mirror code was staged and verified, then external actual runtime was written back after user confirmation. Runtime/dev/mirror hashes match for `main.js` and `styles.css`.

## 2026-07-01 - MemPalace Recall Bounded Fallback

status: confirmed_by_code

- Added a durable guardrail for Obsidian plugin system memory recall: MemPalace failure may fall back only to the dedicated wrapper's allowlist, not to full repo search.
- The bounded recall allowlist is `memory/obsidian-plugin-system/atlas`, `cards`, `change-records`, `framework`, and `sources`.
- Updated repo-local and global `obsidian-system-plugin-dev` Skill so future agents do not convert HNSW / Chroma vector-index failures into unbounded `rg` over `workspaces`, backups, vector DBs, historical vaults, or runtime-like directories.
- Boundary: this is a recall-path / maintenance guardrail. It does not repair the MemPalace vector index and does not modify source memory markdown, runtime plugin files, or business JSON.

## 2026-07-01 - Mandala Daily Score Flip-Side Modal Filter

status: confirmed_by_user_and_code

- Refined Mandala daily score semantics: charts may preserve historical normal and stress-response keys, but the score-entry modal follows the selected date's flip side.
- Normal daily lesson dates show normal lesson items as new-score candidates; flipped low-margin dates show stress-response items as new-score candidates.
- Existing historical blocks remain editable through focused block opening without making the default score-entry modal mix both pools.
- Boundary: runtime/dev/mirror `main.js` changed only; no daily lesson or daily score JSON schema/data was modified.

## 2026-07-02 - Antinet Drawer-First World Miniature Model

status: confirmed_by_user

- Refined `knowledge/keyword-symbolic-interface.md` with the user's drawer-first miniature-model practice: when building an unfamiliar world-facing domain, drawers can act as visible local models that hold weak signals before a symbol is mature enough to become a capsule keyword.
- Updated `workflows/keyword-antinet-bus.md` with an operational rule: prefer drawer-first organization for early large-domain world modeling, and promote to capsule keyword only after internal structure, repeat use, and cross-drawer recall power emerge.
- Added cross-wing source cards: `memory/world-interface-framework/cards/drawer-first-world-miniature-model.md` and `memory/obsidian-plugin-system/cards/2026-07-02-antinet-drawer-first-world-miniature-model.md`.
- Boundary: this is an Atlas / user-practice model update. It does not change Keyword Index schema, runtime plugin files, business JSON, or MemPalace vector indexes.

## 2026-07-03 - Mandala Daily Lesson Day Comment Label

status: confirmed_by_user_and_code

- Refined `plugins/mandala-time-blocks.md` with the broader semantic meaning of the daily lesson `adjustment` / legacy `summary` field: it is a daily comment field that may hold experiences, thoughts, waypoints, clues, evaluation, and adjustments.
- Updated Mandala runtime/dev/mirror visible labels from `心得与调整` to `记录、想法、路点与线索`, and adjusted the print/export hint accordingly.
- Boundary: this is a user-facing label and Atlas semantics update. It does not rename persisted fields, change `Mandala_DailyLessons.json`, alter daily lesson schema, or migrate historical data.

## 2026-07-03 - Mandala Workspace Weekly Summary Inline Editing

status: confirmed_by_code

- Refined `plugins/mandala-time-blocks.md` with the contract that `项目管理：按周汇总` may act as an inline editor for Mandala-owned Workspace weekly rows.
- Updated Mandala runtime/dev/mirror `main.js` so the workspace weekly summary table renders editable textareas for 本周目标、完成情况、进展记录&卡点、下周三大事、心得/调整, adds a `保存按周汇总` action, and flushes drafts on switch / refresh / open / close through `upsertWorkspaceWeeklyGoalRows`.
- Boundary: no business JSON, schema, Project Overview ordering contract, Workspace Mount ownership, stopped-tracking lifecycle, or Project Overview / Workspace display-title fallback was changed.

## 2026-07-03 - Mandala Goal Weekly Summary Inline Editing

status: confirmed_by_code

- Refined `plugins/mandala-time-blocks.md` with the contract that `目标管理：按周汇总` may act as an inline editor for Mandala-owned goal weekly rows.
- Updated Mandala runtime/dev/mirror `main.js` so the goal weekly summary table renders editable textareas for 本周目标、完成情况、进展记录&卡点、下周三大事、心得/调整, adds a `保存按周汇总` action, and flushes drafts on switch / refresh / open / close through `upsertWeeklyGoalRows`.
- Boundary: no business JSON, schema, Project Overview ordering contract, goal stopped-tracking lifecycle, Workspace row bucket, or Workspace Mount ownership was changed.

## 2026-07-03 - Mandala Weekly Tracking Column Merge

status: confirmed_by_user_and_code

- Refined `plugins/mandala-time-blocks.md` with the current weekly table semantics: `完成&待办` carries completion plus remaining work; `记录和comment` carries progress notes, blockers, comments, evaluation, and legacy reflection content.
- Updated Mandala runtime/dev/mirror `main.js` across goal detail, goal summary, Workspace detail, Workspace summary, and weekly print tables.
- Compatibility: existing `reflection` values are displayed in `记录和comment`; saving through the current UI persists the merged text to `blockers` and clears `reflection`. No bulk business JSON migration was run.
- Boundary: goal rows and Workspace rows remain separate buckets; no Project Overview / Workspace Mount ownership, ordering contract, stopped-tracking lifecycle, daily lesson schema, or business JSON files were changed directly.

## 2026-07-03 - Workspace Mount Paradigm Tag Keywords

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` with Workspace Mount-owned paradigm tag keyword semantics: one keyword binds to one paradigm tag; one paradigm tag may own multiple keywords.
- Updated `contracts.md` so Workspace Mount's `Workspace_ParadigmTagKeywords.json` is recognized as a local Context Capsule Key-compatible carrier for explicit Project Overview rename/sync propagation, without transferring identity ownership to Workspace Mount.
- Runtime/dev/mirror `workspace-mount` now load/save the new sidecar, expose modal editing from the paradigm tag edit modal, render a paradigm-panel keyword index, and keep keyword clicks mapped back to existing tag-id filters.
- Updated `json-asset-registry` so `Workspace_ParadigmTagKeywords.json` is classified as Workspace Mount content-side JSON.
- Follow-up hotfix after user test fixed three UI/save regressions: empty tag assignment modal from an undefined `return toc`, missing view-side `paradigmTagKeywordsPath`, and category picker labels falling back to `pgCat_...` ids when passed category objects.
- Boundary: no existing business JSON was migrated or pre-created; `Workspace_Items.json`, `Workspace_TabCapsuleKeywords.json`, Tab ordinary keyword trees, Project Overview identity registry, Mandala, and state-capsules environment state were not made second owners of this sidecar.

## 2026-07-03 - Mandala Daily Lesson Weekly State Transfer Four Columns

status: confirmed_by_user_and_code

- Refined `plugins/mandala-time-blocks.md` with the daily lesson page's week-state transfer semantics: the weekly section should mirror the daily four-column state-transfer shape.
- Updated Mandala runtime/dev/mirror `main.js` and `styles.css` so `周计划状态转移` renders `本周计划`、`完成情况`、`记录、想法、路点与线索`、`下周计划`.
- Added explicit week-level `record` storage with legacy `summary` fallback only when it is not merely the old duplicated execution text.
- Boundary: this belongs to Mandala daily lesson weekly state transfer, not the goal / Workspace weekly tracking table schema. No `Mandala_DailyLessons.json` bulk migration or business JSON direct edit was run.

## 2026-07-03 - Mandala Weekly Paper Print Includes Both Daily Lesson Sides

status: confirmed_by_user_and_code

- Refined `plugins/mandala-time-blocks.md` with a print-specific exception to the daily lesson flip-side display rule.
- The interactive daily lesson tab still follows the selected date's normal/stress flip state.
- The weekly paper print view now explicitly reads both normal daily lesson items and stress-response daily lesson items, and renders separate `普通日课执行` and `压力应对日课执行` tables.
- Boundary: runtime/dev/mirror `main.js` changed only. No daily lesson JSON, daily score JSON, flip state, scoring modal filter, or weekly tracking row schema was changed.

## 2026-07-03 - Workspace Mount Paradigm Item Comment Keywords

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` with Workspace Mount-owned paradigm item comment keyword semantics.
- Runtime/dev/mirror `workspace-mount/main.js` now parses standalone `---` delimited blocks inside paradigm item comments; each non-empty line becomes a local clickable paradigm item keyword in the paradigm panel.
- Keyword clicks open the paradigm panel, clear tag filters if needed, expand the owning paradigm item editor, and scroll to the concrete paradigm item row.
- Boundary: no new sidecar JSON was created; existing paradigm item comments remain the source. This does not change Tab capsule keywords, `Workspace_ParadigmTagKeywords.json`, Context Capsule Keys, Project Overview ownership, or business JSON by migration.

## 2026-07-03 - Workspace Mount Paradigm Item Keyword Drawer Style

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` with the UI contract that paradigm item comment keywords should share the capsule/drawer visual grammar of Tab item keyword drawers.
- Runtime/dev/mirror `workspace-mount/main.js` now groups comment-derived paradigm item keywords by keyword, renders each group as an always-expanded drawer, and keeps concrete item leaf clicks on `revealParadigmItemTarget`.
- Runtime/dev/mirror `workspace-mount/styles.css` adds `workspace-paradigm-item-keyword-*` layout rules for drawer shells, wrapped keyword labels, and item leaf title/meta text.
- Boundary: this is UI contract alignment only. It does not use Tab keyword BUS actions, Tab keyword drawer expansion state, `Workspace_TabCapsuleKeywords.json`, `Workspace_ParadigmTagKeywords.json`, Project Overview identity ownership, or business JSON migration.

## 2026-07-03 - Workspace Mount Scoped Mounted Paradigm Item Keywords

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` with the user's correction that paradigm item comment keywords should also appear inside the Tab-mounted paradigm block, not only in the paradigm panel index.
- Runtime/dev/mirror `workspace-mount/main.js` now renders `本范式条目关键词` inside each expanded mounted paradigm group when that group has mounted items whose source paradigm item comments contain `---` keyword blocks.
- Scoped mounted keyword leaves scroll to the corresponding mounted Workspace item in the current Tab via `revealWorkspaceItem`, so the keyword acts on the current paradigm block rather than on a cross-paradigm tag filter.
- Boundary: this is distinct from paradigm tag keywords and tag filters. No business JSON or sidecar JSON was changed, and the scoped drawer does not use Tab keyword BUS behavior or Tab keyword drawer expansion state.

## 2026-07-03 - Workspace Mount Paradigm Item Inline Keywords And Mounted Reveal

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` after user clarified that the visible object is the concrete paradigm item row itself.
- Runtime/dev/mirror `workspace-mount/main.js` now renders comment-derived keyword chips inline on definition-source paradigm item rows and on Tab-mounted projected paradigm item rows.
- Runtime/dev/mirror `workspace-mount/main.js` also allows `revealWorkspaceItem` to reveal `sourceType: "paradigm"` rows and expands the mounted paradigm scope for root mounted items.
- Boundary: this still reads existing paradigm item comments only. No sidecar JSON, business JSON migration, Tab keyword BUS behavior, Tab keyword drawer state, or paradigm tag filter behavior changed.

## 2026-07-04 - Workspace Mount Paradigm Row Item Keyword Summary

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` after user clarified that the paradigm management panel's paradigm row itself should also show a gathered keyword area.
- Runtime/dev/mirror `workspace-mount/main.js` now aggregates comment-derived keywords from a paradigm's own items and renders them in a `条目关键词` summary area on the paradigm row.
- Clicking a summary chip reveals the first matching definition-source paradigm item through `revealParadigmItemTarget`.
- Boundary: this is a read-only UI projection over existing paradigm item comments. It does not aggregate child paradigms, create sidecar JSON, modify business JSON, or touch Tab keyword BUS / drawer state.

## 2026-07-04 - Workspace Mount Remove Global Paradigm Item Keyword Index

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` after user clarified the layer boundary: the paradigm panel toolbar is managed by paradigm tags and paradigm tag keywords, while paradigm item comment keywords belong under their owning paradigm/item layer.
- Runtime/dev/mirror `workspace-mount/main.js` no longer renders the top-level `范式条目关键词` index in the paradigm panel toolbar.
- Kept the per-paradigm row `条目关键词` summary, concrete item inline keyword chips, and Tab-mounted scoped keyword drawer/reveal behavior.
- Boundary: no business JSON, sidecar JSON, tag filter semantics, Tab keyword BUS state, or `Workspace_ParadigmTagKeywords.json` behavior changed.

## 2026-07-04 - Workspace Mount Mounted Paradigm Keyword Polish

status: confirmed_by_user_and_code

- Refined `plugins/workspace-mount.md` with the mounted projection display rule that paradigm item ids are implementation details and should not appear in the Tab-mounted `本范式条目关键词` leaf UI.
- Runtime/dev/mirror `workspace-mount/main.js` now renders mounted scoped keyword leaves with the user-facing item title only.
- Runtime/dev/mirror `workspace-mount/styles.css` adds scoped mounted-keyword styling so the leaves visually stay close to the Keyword Index plugin style.
- Boundary: click-to-scroll behavior, keyword parsing, mounted item identity, source item id storage, business JSON, sidecar JSON, and paradigm tag keyword/filter semantics were not changed.

## 2026-07-04 - Mandala Daily Score Entry Blocks

status: confirmed_by_user_and_code

- Refined `plugins/mandala-time-blocks.md` with the user's correction that daily scoring should be a repeatable record-block surface: one date + one primary key can have multiple score entries, each with its own score and note.
- Runtime/dev/mirror `mandala-time-blocks/main.js` now normalizes daily score records to version 2 with `entries[]`, while reading legacy top-level `score` / `note` records as one legacy entry.
- A verifier-driven compatibility fix also parses legacy raw daily-score keys when the value lacks `sourceNotePath`, `date`, or `itemId`, so old key-shaped records remain visible.
- The score modal now edits blocks: existing entries can be modified/deleted, new blocks can be added, implicit close autosaves, and date switching saves the previous date before rerendering.
- Daily score charts now render one color block per entry; multiple entries for the same key keep the same item color and clicking a block focuses that entry in the modal.
- Boundary: the three Mandala score buckets remain separate (`lesson`, `workspace`, `goal`); no business JSON bulk migration, new score owner, Project Overview ownership, Workspace ownership, or Keyword ownership was introduced.
- Follow-up UI fix: the score entry `note` is explicitly labeled `打分理由`, and the score-block modal now uses scoped layout classes so the reason textarea is visible instead of being squeezed by the old single-score grid.
- Follow-up compact UX: the main score modal now acts as a compact horizontal block index, with each primary key row showing button-sized score chips and a right-side `新增` action. Existing chips and `新增` open a child block editor; closing the child editor saves score and `打分理由`, while blank new blocks remain unpersisted.

## 2026-07-04 - Project Overview AI Context Shards

status: confirmed_by_code

- Refined `contracts.md` and `plugins/project-execution-overview.md` with the AI context export shard rule.
- Runtime/dev/mirror `project-execution-overview/main.js` now routes `buildGroupAiContextMarkdown()` through `collectGroupAiContextShards()`, using `Promise.allSettled` over primary/comment, column evidence, in-group relations, Mandala read-only tracking context, and Context Capsule Key/cache diagnostics.
- The export keeps `export_version` and older markdown sections while adding compatible `export_shards` / `source_cache` diagnostics.
- Restored the carrier-note suppression staged patch after runtime baseline回流: Keyword note carrier detection now uses `resolveBaseColumnId(item)` / `baseColumnId` so keyword-derived rows still expose drawer/capsule note paths.
- Boundary: this patch does not read or write business JSON, does not rebuild the overview model during AI export, and does not call global keyword navigation rebuild from the export path.

## 2026-07-04 - Project Overview Build Model Shard Pipeline

status: runtime_synced_verified

- Added the Project Overview build-model shard contract to `contracts.md`.
- Refined `plugins/project-execution-overview.md` with the first-stage build-model shard scaffold.
- Runtime/dev/mirror `project-execution-overview/main.js` now routes `buildOverviewModelFromResolved()` through `collectOverviewBuildShards()` and `mergeOverviewBuildShards()`.
- External carrier attachment is split into `attachKeywordCarrierShard()` and `attachWorkspaceBoundNoteCarrierShard()`, joined through `Promise.allSettled`.
- Guarded semantics from agent#2 verifier: `resolveStartRecords()` order is unchanged; graph expansion and relation grouping remain serial; `suppressCarriedOrdinaryNotes()` still runs after carrier shards.
- Boundary: this patch does not add business JSON reads/writes, does not parallelize BFS/grouping, and does not introduce new Workspace, Mandala, Keyword, GTD, Collection Card, or EVA ownership.

## 2026-07-14 - Keyword Symbol Dialogue Seeded Neighborhood

status: runtime_synced_verified

- Refined `plugins/keyword-index-plugin.md` with the distinction between the full symbolic intake/editing network and the Symbol Dialogue current-attention surface.
- Refined `knowledge/keyword-symbolic-interface.md` with the user-confirmed seed-based local neighborhood practice.
- Code/runtime claim: strict `符号对话: true` registrations seed structural ancestors, the selected full drawer subtree and shallow same-level ordinary drawer/SCON peers; unrelated branches remain hidden.
- Local BUS continuation requires projected-prefix authorization, while numbering and writing remain owned by the complete Keyword repository and existing writer.
- User confirmed the deployed plugin has no problem in actual Obsidian.
- Bayesian update: `refines` the existing Keyword symbolic-port claim.
- Framework effect: none. Existing FW-008 already covers Keyword symbolic-interface interpretation; no new control-plane rule or ownership contract was introduced.
- Question Map / Unknowns effect: none. This resolves the local projection shape without creating a new unresolved system question.
- Skill effect: none. Existing Obsidian runtime, ownership, verifier and three-copy synchronization gates were sufficient.
- Trace: prior read included `framework/entry-index.md`, `framework/update-protocol.md`, `atlas/plugins/keyword-index-plugin.md`, `atlas/knowledge/keyword-symbolic-interface.md`, the Iteration 2 change record and generated verifier evidence.
- Boundary: no Keyword business JSON, API, nodeKey, command, event, scanner rule or second writer was added.

## 2026-07-04 - Mandala Weekly Tracking Subtab Scroll Restore

status: runtime_synced_verified

- Refined `plugins/mandala-time-blocks.md` with weekly tracking dashboard subtab scroll state.
- Runtime/dev/mirror `mandala-time-blocks/main.js` now stores weekly tracking scroll offsets in `dashboardState.weeklyTrackingScrollByTab`.
- Weekly subtab switches call a before-change hook to remember the outgoing tab's scroll, and weekly tracking render completion restores the active tab/context scroll.
- Top-level dashboard tab switching records the outgoing scroll before changing tabs and avoids old DOM scroll from overwriting the new tab state.
- Boundary: this is UI environment state in plugin settings. It does not change `Mandala_WeeklyGoals.json`, weekly row schemas, row content, Project Overview ownership, or Workspace/GTD/Collection contracts.

## 2026-07-04 - Mandala Dashboard Scroll Host Stability

status: runtime_synced_verified

- Refined `plugins/mandala-time-blocks.md` after user reported that daily lessons and weekly tracking still reopened at the top.
- Runtime/dev/mirror `mandala-time-blocks/main.js` now uses the actual visible modal scroll host for existing `contentScrollTop` and `weeklyTrackingScrollByTab`.
- Restore uses delayed retries so Obsidian modal layout can settle before writing `scrollTop`.
- Save guards avoid overwriting a nonzero remembered position with `0` while the modal host is hidden or not scrollable.
- Follow-up correction: runtime/dev/mirror now binds scroll listeners to the actual dashboard modal scroll hosts while open, debounces writes into existing scroll fields, and uses `lastDashboardScrollTop` when closing via backdrop / outside click.
- Boundary: no new dashboard scroll-state bucket was added; no visible UI control, business JSON, weekly row schema, daily lesson schema, or score data changed.

## 2026-07-04 - Mandala Daily Posture Formula

status: confirmed_by_user

- Added `cards/2026-07-04-mandala-daily-posture-formula-and-weekly-expression.md`.
- Refined `plugins/mandala-time-blocks.md` with the model that daily lessons are a posture/formula calibration layer, while weekly tracking and project tracking are expression layers.
- Updated framework `question-map.md` with FW-012 so future agents track how daily posture, attention sovereignty, low-margin recovery, high-margin unfolding, and COACH readings should steer concrete goal tracking.
- Boundary: no runtime plugin, business JSON, daily lesson schema, or weekly tracking schema was changed.

## 2026-07-05 - Mandala Absorbing Barrier And Compounding Chain

status: confirmed_by_user

- Added `cards/2026-07-05-cycle-compounding-absorbing-barrier-symbol-preservation.md`.
- Refined `plugins/mandala-time-blocks.md` with the model that stress / low-margin mode should treat absorbing barriers as compounding-chain survival risks.
- Updated framework `question-map.md` FW-012 and `registry.md`.
- Core principle: low-margin states should not be allowed to judge the whole system; time-tested principles and continuity preservation outrank intense short-term impulses.
- Boundary: no runtime plugin, business JSON, daily lesson schema, or weekly tracking schema was changed.

## 2026-07-05 - Mandala Context Goal Creation

status: runtime_synced_verified

- Refined `contracts.md` with the Mandala add-Mandala-context-goal provisioning exception.
- Refined `plugins/mandala-time-blocks.md` with the Mandala-owned context goal creation contract.
- Runtime/dev/mirror `mandala-time-blocks/main.js` now adds a `一键新增九宫格主键目标` action in the project-plan toolbar.
- The workflow opens the Mandala node selector first, then creates the new node under the selected parent in the first empty non-core slot.
- The new node writes the Context Capsule Key to Mandala-owned `comment` and `Mandala_Keywords.json`, creates the current weekly goal row, and calls Workspace Mount / Collection Card / GTD owner APIs to create or reuse local carriers.
- Mandala relation records now include node keywords in read-only `searchText` / `metaFields` so Project Overview and EVA can discover the key from Mandala's evidence surface.
- Boundary: no Workspace Mount, Collection Card, GTD, Project Overview, EVA, Keyword, or business JSON files were edited directly; runtime/dev/mirror code was synchronized after backup and syntax checks.

Follow-up carrier relation refinement:

- GTD `ensureProjectContextTag()` now returns the created/reused project item's EVA `projectNodeKey`.
- EVA exposes `ensureRelation(input)` as an owner API that deduplicates exact same source / target / relationType triples before writing.
- Project Overview exposes `syncMandalaContextGoalMeta(nodeKey, meta)` as a Mandala-mode peer to `syncWorkspaceProjectEntryMeta()`.
- Mandala's context-goal workflow now asks EVA to create a `承载` relation from the Mandala node key to the GTD project node key, then asks Project Overview to write overview-level Mandala comment/meta.
- Boundary: Mandala still does not write GTD, EVA, or Project Overview business JSON directly; it calls owner APIs and logs missed external link results.

## 2026-07-05 - Mandala Goal Execution Plan Table

status: runtime_synced_verified

- Refined `plugins/mandala-time-blocks.md` with the new `目标执行计划` surface for Mandala / 九宫格 primary keys.
- Refined `contracts.md` so Mandala goal execution plan rows and Workspace project execution plan rows stay in separate buckets.
- Runtime/dev/mirror `mandala-time-blocks/main.js` now stores goal plan rows in Mandala-owned `goalPlanRowsByKey`.
- The weekly tracking modal adds a `目标执行计划` tab with columns `愿景`, `获得到的知识`, `当前情况`, and `下一步计划`.
- The `下一步计划` cell reads related Collection Card evidence from Project Overview's mandala-mode grouping and reveals those cards through Project Overview in `mandala` mode.
- Boundary: no Collection Card, Project Overview, EVA, GTD, Workspace, Keyword, or business JSON files were edited directly; runtime/dev/mirror code was synchronized after backup and syntax checks.

Follow-up order refinement:

- `目标执行计划` and `目标管理：按周汇总` now use the same Project Overview Mandala primary-key order helper.
- If the live Project Overview order snapshot is empty, Mandala asks Project Overview to build the `mandala` grouping model and derives the row order from that read-only model before falling back to local Mandala tree path order.
- Boundary: this changes ordering source only. It does not change `goalPlanRowsByKey`, weekly row data, Collection Card data, Project Overview settings, EVA relations, or other business JSON.

## 2026-07-06 - API Registry Landing

status: atlas_updated

- Added `api-registry.md` as the Atlas API inventory for cross-plugin API direction, provider/consumer, type, purpose, read/write boundary, status, and evidence.
- Registered the new page in `atlas/index.md` and framework `registry.md`.
- Recorded the separation of responsibilities:
  - `contracts.md` owns rules, ownership, boundaries, and forbidden behavior;
  - `api-registry.md` owns API inventory and operational lookup;
  - `plugins/*.md` own per-plugin roles and local guardrails;
  - `framework/registry.md` owns durable entrances only.
- Boundary: this was Atlas/framework documentation only. No runtime plugin code, Skill rule, business JSON, or engineering change record was modified.

## 2026-07-06 - Project Overview Context Carrier Hydration Scaffold

status: runtime_synced_verified

- Runtime/dev/mirror `project-execution-overview/main.js` now records richer context-carrier Map shard diagnostics: provider summaries, context summaries, accepted/observed counts, truncation / has-more hints, optional cursor/revision fields, and timing.
- The context-carrier reduce step is now explicit in `reduceContextCapsuleCarrierRecords()`, preserving de-dup by node key and derived edge semantics.
- This is a Project Overview-only scaffold slice; Workspace/GTD/Collection provider API shapes were not changed.
- Boundary: no business JSON, provider settings/cache JSON, EVA relation data, Workspace/GTD/Collection runtime code, or true post-render background mutation was changed.

## 2026-07-15 - Project Overview Visible Carrier Auto Refresh Phase 2B1

status: runtime_synced_verified

- Project Overview now treats Workspace Mount, Collection Card View, and GTD carrier-change events as dirty hints, coalesces bursts, and probes only currently visible Context Capsule targets through owner snapshot APIs.
- Equal complete SHA-256-bound projections cause zero model build/render. Changed or uncertain projections trigger one scroll-preserving latest-wins refresh.
- Hidden/closed views schedule zero timers/probes/builds/renders; provider failure retains the old committed model and dirty state.
- Runtime, NEWERA mirror, and dev-like `main.js` are synchronized at `EF90DA8E...E98`; all three passed `node --check`.
- Boundary: no provider contract/code, business JSON, settings, cache JSON, persistent index, EVA manual relation, polling, provider activation, or eager hidden hydration was changed.
- Evidence status: code/deployment `confirmed_by_code`; core automatic freshness in actual Obsidian `confirmed_by_user`. Hidden-view/UI-only/failure/scroll subcases remain code-harness evidence unless separately observed.

## 2026-07-21 - Generative Context Reconstruction And Artifact-Centered Work

status: confirmed_by_user

- Added `cards/2026-07-21-generative-context-reconstruction-artifact-centered-work.md` to preserve the user's two practice observations: blank-paper active reconstruction loads the current task better than passive historical explanation, and a real artifact should occupy working memory instead of system intermediate-product accumulation.
- Added `knowledge/generative-context-reconstruction.md` as the maintained Atlas synthesis.
- Split task entry modes in `workflows/project-coaching.md`:
  - artifact production / continuation begins with active reconstruction and query-driven history;
  - evidence audit / diagnosis may begin with bounded AI context export.
- Registered the Atlas page and provenance card in `framework/registry.md`; updated `atlas/index.md`.
- Bayesian update: `refines` the cognitive-hardware prior and `splits` artifact-production from evidence-audit entry modes.
- Source status: user-practice claims are `confirmed_by_user`; general psychological mechanism remains unclaimed.
- Question Map / unknowns effect: none. The mode distinction is resolved inside the user's current practice scope.
- Skill / rules effect: none. One confirmed personal practice does not justify a universal hard gate.
- Boundary: no plugin code, runtime/dev/mirror, business JSON, API, schema, Skill or rule was modified.

## 2026-07-22 - SuperMemo Plan Focused Surface Removes Relation Button

status: runtime_synced_static_verified

- Removed the visible `关系` action from both planning and execution cards in the SuperMemo Plan owner renderer; the same result applies to the standalone view and Mandala embedded host.
- Preserved the EVA adapter/API, existing relation data, inbound `openNode()` focus path, relation indexing, and refresh compatibility.
- Refined `api-registry.md`: the embedded owner surface now lists decomposition, planning, execution, progress, and review, without claiming a visible relation control.
- Runtime/dev/mirror `supermemo-plan-engine.js` are aligned at SHA-256 `A53BAF2361E6807FC5FC28D0FCE590EAA3A6C9F6B87FD23C0CADBABDBFE22C93`; all three passed `node --check` and structural sentinels.
- Source status: UI intent `confirmed_by_user`; deployment and compatibility symbols `confirmed_by_code`; actual Obsidian UI smoke remains pending.
- Boundary: no business JSON, schema, relation data, Mandala code, EVA code, Skill, rule, Question Map, unknowns register, glossary, or framework registry was changed.

## 2026-07-23 - Project Overview Primary-Key Lifecycle Kill Mode

status: runtime_synced_static_verified_ui_smoke_pending

- Added reversible lifecycle ownership in Project Overview for Workspace project and Mandala goal primary keys, keyed by `domain + primaryNodeKey`.
- Normal mode hides only all-killed groups; Kill Mode preserves full provider/EVA evidence and supports revive without deleting history.
- Added the read-only `getPrimaryKeyLifecycleSnapshot(options)` API and coalesced lifecycle event; mutation remains private to Project Overview.
- Mandala now renders read-only `已 Kill` badges on standalone and embedded weekly surfaces without writing stopped-tracking state or weekly JSON.
- Corrected same-mode duplicate-keyword extraction so all source identities survive until any-active projection while the UI still shows one merged keyword row.
- Runtime/dev/mirror are synchronized at Project Overview `main.js` `04ADFD...4794`, styles `D5BB59...6543`, Mandala `main.js` `26BA42...361`, and styles `BEAEF0...141C`; syntax and post-writeback hashes passed.
- Bayesian update: `refines` OPS-002 ownership/API boundaries. Question Map and unknowns are unchanged because no unresolved system question was introduced.
- Boundary: business JSON, settings, EVA relations, provider data, Mandala tracking history, rules, Skill, glossary, aliases, and framework registry were not modified.

## 2026-07-23 - Mandala Six-State Daily Lessons And State Graph Tabs

status: runtime_synced_static_verified_ui_smoke_pending

- Renamed the `normal` and `adjust` display labels to `有意识习惯培养` and `系统性建设` while preserving their internal ids and historical score keys.
- Added the Mandala-owned `recuperation` / `休养生息` item pool, per-date mode, reference side, and four idempotent recovery defaults; recuperation completion does not add Health Credit.
- Kept the three top-level score domains unchanged. Inside the lesson graph, six state tabs now render one state graph at a time and remember the selected state.
- The current graph's today, empty-day, and existing-score entry points initialize the matching score pack without changing the actual daily-lesson mode.
- Runtime/dev/mirror `main.js` and `styles.css` are synchronized at `6CA06E...3301` and `307178...E08F`; syntax, schema/reference, score-key, static contract, and behavior-level fake DOM tests passed.
- Bayesian update: `corrects` the former five-state/five-pack Atlas claim and `refines` the lesson fluctuation chart into a two-level tab contract.
- Boundary: no business JSON, Daily Scores schema, score key, cross-plugin API, Project Overview, Workspace, GTD, Collection, EVA, Keyword, rule, or Skill was changed. Actual Obsidian narrow-window and print smoke remain pending.

## 2026-07-23 - Mandala New Home State And Score Context Tooltip

status: runtime_synced_static_verified_ui_smoke_pending

- Added the seventh Mandala-owned daily posture `new_home` / `新家的建设` after the existing six states, preserving all earlier internal ids, score keys, order, and color mappings.
- Added two explicit-selection-only, idempotent defaults for adapting life habits and exploring initial asymmetric opportunities; New Home completion contributes zero Health Credit.
- Extended daily, weekly overview, score-tab, historical-prefix, print, and reference projections to seven states. Only one lesson graph renders at a time.
- Lesson score item names now expose `预计时间段` and `此前经验` through a custom hover/focus tooltip. Workspace and goal score labels retain their prior behavior.
- Runtime/dev/mirror `main.js` and `styles.css` are synchronized at `E6FAAB...2F1D` and `CA8C49...6BEE`; syntax, real-data read-only normalization, score-key/color regression, seven-state graph/print, and tooltip DOM tests passed.
- Bayesian update: `corrects` the obsolete six-state claim and `refines` score-time context recall. No framework layer, cross-plugin API, score domain, or unresolved Question Map item was introduced.
- Boundary: no business JSON, Daily Scores schema, score key, Project Overview, Workspace, GTD, Collection, EVA, Keyword, rule, or Skill was modified. Actual Obsidian UI smoke remains pending.

## 2026-07-25 - Mandala Current Plan Versus Historical Lifecycle Projection

status: runtime_synced_static_verified_ui_smoke_pending

- Refined Mandala's lifecycle projection: `目标执行计划` and `项目执行计划` are current attention surfaces, while goal/project weekly summaries are historical observation surfaces.
- Current plans exclude stopped, freshly confirmed killed, and freshly/structurally confirmed owner-missing identities without deleting stored plan rows or historical weekly evidence.
- Historical weekly UI and print distinguish `停止追踪 · 本周收口`, `当前已停止追踪`, and `已 Kill`.
- Added fail-open evidence boundaries: stale Kill cache, provider failure, partial Workspace data, and malformed/incomplete Mandala owner structure cannot manufacture source absence.
- Runtime/dev/mirror `main.js` / `styles.css` are synchronized at `6AE1DBF0...E37B0A` / `AB497960...A27925`; all three syntax checks and four lifecycle/history/import contracts passed after user-confirmed deployment. Actual Obsidian UI smoke remains pending.
- Bayesian update: `refines` the existing tracking-exit and no-ghost-data model. Framework Question Map `FW-018` remains the active long-term question; no new unknown or Skill/rule change is required.
- Boundary: synchronization changed only Mandala `main.js` and `styles.css`; no business JSON, settings, manifest, cache, Timeline code, or other plugin file was modified.

## 2026-07-26 - Mandala Social Conduct And All-State Score Graph

status: runtime_synced_static_verified_ui_smoke_pending

- Added the ninth Mandala-owned daily posture `social_conduct` / `为人处世之道` with five explicit-selection-only, idempotent defaults for reliable and considerate cooperation.
- Added `全部状态` as a score-graph-only view. It is not a tenth daily mode or score pack and does not alter the selected date's real mode.
- Replaced 24-color wraparound with one global canonical `side::itemId` mapping and deterministic cached maximin expansion. Tests produced unique fills for 24, 25, 72 and 128 canonical items and stable mappings for reversed input.
- Runtime/dev/mirror `main.js` and `styles.css` are synchronized at `C5024061...B079` and `ED054BC5...0945`; all three passed `node --check` after deployment.
- Old eight-state data normalized read-only with zero writes. Daily Lessons, Daily Scores and plugin `data.json` retained their pre-deployment hashes.
- Bayesian update: `corrects` the obsolete eight-state claim and `refines` score-chart navigation and visual identity. No new owner, score domain, API, schema, Question Map item, Skill rule, glossary entry, or alias was introduced.
- Boundary: only Mandala code and the Atlas/Framework maintenance trail changed. Actual Obsidian visual/interaction smoke remains pending after plugin reload.

## 2026-07-27 - Timeline Import UI Parity Across Standalone And Mandala Embed

status: runtime_synced_static_verified_ui_smoke_pending

- Confirmed that Timeline's standalone `导入九宫格目标/项目` and Mandala's embedded `同步事项` already called the same Timeline owner API but previously supplied different date defaults and followed different post-import refresh paths.
- Timeline now resolves omitted import dates to the standalone UI contract: current custom-range start or current ISO-week start, with the open end at today plus one month; explicit valid dates still win.
- One effective option set now drives both the Mandala owner snapshot and Timeline item ensure step, so candidates cannot fall back to a different weekly horizon.
- Successful import reloads standalone Timeline leaves and connected embedded sessions, prunes disconnected sessions, and skips the separate date-maintenance write path.
- Runtime/dev/mirror Timeline `main.js` are aligned at `38D6B4A9...DBA85`; syntax, isolated import-parity harness and independent post-change verifier passed. `Timeline_Data.json` was unchanged by deployment.
- Bayesian update: `refines` the existing Timeline-Mandala owner-write API postcondition; no ownership, schema, event, identity, Question Map or Framework model changed.
- Boundary: only Timeline `main.js`, the API registry, Atlas maintenance log and engineering records changed. Mandala, `timeline-engine.js`, business JSON, styles, settings and manifests were not modified.

## 2026-07-27 - Workspace Mount Ontology P1 Trusted Projection Skip

status: runtime_synced_host_verified_latency_attribution_pending

- Real host full-sync baseline measured Ontology click-to-close at `103.7 ms`; the bound 1,874,762-byte business JSON remained unchanged.
- Ontology owner-body saves now request `paradigmSync:none`, but the effective decision is made only inside the writer queue after authoritative reread.
- Trust requires token identity, current data reference, source note, canonical data path, load epoch, non-empty current revision and exact raw authoritative revision. Missing or mismatched evidence automatically falls back to full synchronization.
- A read-only 187-Tab / 1,509-item fixture produced exact full/none canonical equality. Twenty paired samples isolated the removed projection work without writing the real business JSON.
- Runtime/dev/mirror `main.js` are aligned at `8DF0C9D7...52DC0803`; all three passed syntax and feature-sentinel checks. Ontology and diagnostics regressions passed.
- Bayesian update: `refines` the existing Selective Synchronization Performance Guardrail and Ontology contract. No new owner, API, schema, Question Map item, unknown, Framework layer, Skill or rule was introduced.
- Post-deployment host diagnostics confirmed `requestedMode=none`, `appliedMode=none`, `tabCount=0`, valid completion and zero pending work. The real dirty/recovery/audit close took `28,636.4 ms`; the owner transaction was `4,019.4 ms` and four plugin-data saves totaled `2,374.2 ms`.
- A concise follow-up snapshot contained two Ontology transactions and measured separate `workspace.audit.finish` spans of `2,112.6 ms` and `10,210.5 ms`. Runtime attribution is therefore confirmed: the external audit provider can dominate close latency after Workspace projection work has been eliminated.
- Operation Audit Trail code currently serializes each record by saving sequence settings and read-rewriting both complete log files. A native-append optimization belongs to that provider and requires its own verifier/deployment cycle; Workspace Mount's synchronous audit contract is unchanged.
- Bayesian update: `reinforces` the selective synchronization contract and `refines` the remaining latency from an inferred Workspace-side tail into a confirmed provider-side audit cost.
- Boundary: full render, viewport restoration, recovery, audit, the single authoritative main JSON write, styles, manifest, settings and business JSON were unchanged. No plugin file was modified during this evidence review.

## 2026-07-27 - Mandala Score Candidate Lifecycle Exit Boundary

status: runtime_synced_static_verified_ui_smoke_pending

- Project/goal new-score candidates now respect both Mandala stopped-tracking state and fresh Project Overview Kill evidence without deleting or hiding historical score blocks.
- Stopped dates are inclusive; malformed/missing dates fail closed for new writes. Kill evidence is request-scoped and fail-open when missing, failed, or stale.
- Add-click and final persistence reread owner/Kill evidence. Both lifecycle events invalidate in-flight admission revisions while connected modal refresh remains coalesced.
- Score entry writes now serialize stable `entryId` mutations against the latest store, preserving concurrent new blocks and historical edit/delete behavior.
- Runtime/dev/mirror Mandala `main.js` align at `11034979...7919`; all three pass syntax checks. Weekly Goals, Daily Scores, plugin `data.json`, and styles retained their exact before hashes.
- Bayesian update: `refines` the existing score-block and primary-key lifecycle contracts. It does not create a new score domain, owner, schema, Framework question, unknown, Skill, or rule.
- Boundary: Project Overview and Timeline code were not modified. Actual Obsidian interaction smoke remains pending after plugin reload.

## 2026-07-27 - Mandala Restriction Remediation Tenth State

status: runtime_synced_static_verified_ui_smoke_pending

- Added the tenth Mandala-owned daily posture `self_restraint` / `限制项专项整改` after the existing nine states without changing their ids or order.
- Added two explicit-selection-only, idempotent defaults: `非必要外出闲逛限额` and `按时用餐边界`. Ordinary read, normalization, scoring, graph, print, and modal-open paths do not seed the new bucket.
- Extended canonical references, weekly overview, print, ten score packs, ten one-at-a-time state graphs, the all-state graph, historical state inference, and state-specific styling.
- Runtime/dev/mirror `main.js` and `styles.css` align at `CA6C1BFC...1D2BD` and `8D8E8071...F673B`; all three passed `node --check` after user-confirmed deployment.
- Daily Lessons, Daily Scores, and runtime plugin `data.json` retained their exact pre-deployment hashes.
- Bayesian update: `corrects` the obsolete nine-state claim and `refines` the existing daily-posture/reference/score-view contract. No new owner, score domain, API, schema version, Question Map item, unknown, Skill rule, glossary entry, or alias was introduced.
- Boundary: only Mandala code and the Atlas/Framework maintenance trail changed. Actual Obsidian visual/interaction smoke remains pending after plugin reload.

## 2026-07-29 - Workspace Mount Ontology Cell Image References

status: runtime_synced_static_verified_ui_smoke_pending

- Ontology schema remains v1. Image embeds live in existing `cell.value`, so text, multiple local images, and recursive child tables can coexist without a new business sidecar or attachment array.
- External files use Obsidian attachment path/link APIs; existing vault images are referenced without copying. PNG/JPEG/WebP/GIF/BMP signatures and actual-byte limits are enforced; SVG is rejected.
- The UI adds bounded thumbnails, full preview, unresolved tiles, drag/select import, and exact per-token removal. Removing a reference never deletes the vault attachment.
- A modal-owned serial queue, stable cell identity, prepare/final recovery, protected full-path records, authority-filtered immutable recovery transactions, terminal teardown Promise, and prepare-all close barrier protect attachment references and drafts across every asynchronous close/unload order.
- Ten independent verifier rounds closed parser, stale-token, byte-limit, prepare/create/finalize, target-loss, owner-commit, recovery durability, authority, clear-transaction, and multi-modal teardown races. Round 10 returned PASS with no P0/P1/P2.
- Runtime/dev/mirror `main.js` and `styles.css` align at `A5CE1E55...6B41B0` and `03FE1383...1D759`; all three pass syntax and feature/CSS sentinels. Ontology and diagnostics regressions pass.
- `Workspace_Items.json`, plugin `data.json`, manifests, tests, notes, attachments, caches, and indexes were not synchronized or modified by deployment.
- Bayesian update: `refines` Workspace Mount's existing Ontology content/recovery/no-ghost-data contract. Question Map, unknowns, cross-plugin contracts, Skill, rules, glossary, aliases, and registry remain unchanged. Actual Obsidian drag/drop and reload smoke remain pending.

## 2026-07-29 - Mandala Daily Comment Image Album

status: runtime_synced_static_verified_ui_smoke_pending

- Mandala's `记录、想法、路点与线索` field now accepts one or multiple ordinary Obsidian image embeds while retaining `adjustment` / legacy `summary` as the only persisted field.
- The daily surface uses one compact album launcher; a scrollable modal owns thumbnails and full preview so multiple daily images do not occupy the whole lesson page.
- Image removal always requires explicit confirmation, removes one exact reference only, and never deletes the vault attachment. Cancel, `Esc`, backdrop close, and failed submit preserve the reference.
- Attachment import uses durable-reference-before-binary, content SHA-256 retry identity, one Daily Lessons owner queue, and close/unload admission gates.
- Runtime/dev/mirror `main.js` and `styles.css` align at `A61BB2F6...03A3` and `27AEA27F...03D2`; three syntax checks, contract harness, CSS structure, feature sentinels, and no-attachment-delete scans passed.
- Bayesian update: `refines` the existing Mandala day-comment and no-ghost-data contract. It does not add a schema, owner, API, score domain, Question Map item, unknown, Skill rule, glossary term, or alias.
- Boundary: `Mandala_DailyLessons.json`, manifests, settings, attachment files, caches, indexes, and other plugins were not synchronized or modified. Actual Obsidian picker/drag/preview/removal/reload smoke remains pending.

## 2026-07-29 - Workspace Mount Ontology Image Removal Confirmation

status: runtime_synced_static_verified_ui_smoke_pending

- Ontology image thumbnail removal now always enters the existing Workspace destructive confirmation modal before changing the draft.
- Cancel, common implicit close, confirmation rejection, draft/target drift, active/final close, forced teardown, recovery conflict, and pending import all fail closed with no reference removal.
- Confirmation freezes the stable cell identity plus exact token span/text. Duplicate embeds and double confirmation can remove at most one selected occurrence.
- Confirmed removal changes only `cell.value`; explicit deletion-API counters remain zero and attachment binary bytes remain unchanged.
- Runtime/dev/mirror `main.js` align at `AAD67337...039B43`; three syntax checks, full Ontology tests, diagnostics and production no-hook loading passed. Styles, manifests, plugin data and `Workspace_Items.json` retained their exact before hashes.
- Bayesian update: `refines` the existing Workspace Mount Ontology image/no-ghost-data contract. No new owner, schema, API, event, Question Map item, unknown, Skill rule, glossary term or alias was introduced.

## 2026-07-29 - Mandala Daily Comment Clipboard Image Paste

status: runtime_synced_static_verified_ui_smoke_pending

- The existing `记录、想法、路点与线索` textarea now accepts clipboard images through direct paste while ordinary text paste remains native.
- Image-bearing and mixed clipboard payloads import images only. `clipboardData.items` takes precedence over `files`, preventing duplicate import while preserving multiple-image order.
- Clipboard files reuse the established external-image validation, SHA-256 identity, owner queue, draft flush, durable-reference-before-binary, and close/unload gates. No blob/base64/embed text is inserted directly into the textarea.
- Runtime/dev/mirror `main.js` align at `3B38A506...31D5C`; all three pass `node --check` and the focused clipboard plus existing album contract harness.
- `Mandala_DailyLessons.json`, `styles.css`, manifests, settings, attachment files, caches, indexes, and other plugins retained their pre-deployment hashes or were excluded from synchronization.
- Bayesian update: `refines` the existing Mandala day-comment image-input contract. No new schema, owner, API, Question Map item, unknown, Skill rule, glossary term, alias, or registry entry was introduced.
- Boundary: actual Obsidian single-image, multi-image, text-only, and mixed clipboard smoke remains pending after plugin reload.

## 2026-07-29 - Mandala JSON Partition And Read/Write Snapshot

status: confirmed_by_code_with_dated_runtime_measurement
captured_at: 2026-07-29 21:44 +08:00

Stable claim update:

- Mandala is already partitioned by owner-local domain rather than stored in one JSON. The canonical partition responsibilities are now recorded in `plugins/mandala-time-blocks.md`.
- `readJson()` reads and parses the full selected shard; `writeJson()` pretty-serializes and overwrites the full selected shard. Semantic mutation scope may be narrow even though physical persistence remains whole-shard.
- `loadAll()` loads the base runtime set in parallel but excludes `Mandala_WeeklyGoals.json` and `Mandala_DailyLessons.json`; those use feature-specific load paths.
- `TimeLog_Database.json` is a legacy compatibility/import source. Plugin-directory `data.json` is UI/environment state, not a source-folder business shard.

Dated source-folder size snapshot:

| File | Bytes | KiB |
| --- | ---: | ---: |
| `Mandala_Database.json` | 81,974 | 80.05 |
| `Mandala_Types.json` | 1,134 | 1.11 |
| `Mandala_Keywords.json` | 9,987 | 9.75 |
| `Mandala_WeeklyGoals.json` | 874,591 | 854.09 |
| `Mandala_DailyLessons.json` | 312,838 | 305.51 |
| `Mandala_DailyScores.json` | 44,213 | 43.18 |
| `MandalaTimeBlocks_Records.json` | 138,101 | 134.86 |
| `MandalaTimeBlocks_Settings.json` | 412 | 0.40 |
| `MandalaTimeBlocks_Migration.json` | 109,079 | 106.52 |

Read-only in-memory benchmark:

| File | `JSON.parse` median | `JSON.stringify(..., null, 2)` median |
| --- | ---: | ---: |
| `Mandala_Database.json` | 0.433 ms | 0.453 ms |
| `Mandala_WeeklyGoals.json` | 2.034 ms | 1.935 ms |
| `Mandala_DailyLessons.json` | 0.790 ms | 0.845 ms |

Method and limits:

- Node.js `v18.20.8`; 20 warm-up iterations followed by 201 measured iterations per file; median reported.
- Source: the proven runtime source-note folder under the active NEWERA vault.
- The benchmark reads each file into memory before timing. It excludes Vault/disk read and write, Obsidian file watchers, normalization, owner queues, indexing/event effects, and UI rerender.
- These sizes and timings are a dated diagnostic snapshot, not a sharding threshold and not proof that storage can never become a bottleneck. A future split requires end-to-end attribution rather than file size alone.

Trace:

- `prior_read`: Framework entry/update protocol, repo-local `obsidian-system-plugin-dev`, Mandala Atlas page, JSON ownership contract, runtime code.
- `evidence_used`: runtime constants and path/read/write/load implementations plus read-only size and in-memory timing probes.
- `update_type`: `refines`.
- `source_status`: stable contract `confirmed_by_code`; sizes/timings `dated_runtime_measurement`.
- `question_map_effect`: none.
- `skill_or_rule_effect`: none.
- `framework_effect`: none.
- `mempalace_effect`: none; not mined and no recall claim made.

## 2026-07-30 - Workspace Mount Ontology Breadcrumb Row Identity

status: runtime_synced_static_verified_ui_smoke_pending

- Nested-table breadcrumbs now identify each ancestor by the immediate parent row's current first ordered column instead of by the cell text that owns `nestedTableId`.
- Row labels reuse the existing display normalization: trim the whole value, take the first line, and limit it to 32 UTF-16 code units. A valid blank row name falls back to `第 N 行`.
- Missing or malformed row order, parent row, first-column definition/cell, or parent-cell closure fails closed. Navigation resolution does not mutate Ontology data, ids, timestamps, schemas, or parent references.
- Runtime/dev/mirror `main.js` align at `82E04E06...F0979DE`; all three pass `node --check`, and the full Ontology plus performance-diagnostics suites pass after deployment.
- Canonical source-note `Workspace_Items.json`, the separate plugin-directory same-name JSON, plugin `data.json`, `styles.css`, and `manifest.json` retained their pre-deployment hashes.
- Bayesian update: `refines` the existing Workspace Mount Ontology navigation contract. No schema, API, event, command, ownership, Question Map item, unknown, Skill rule, glossary term, or alias changed.
- Boundary: MemPalace was not mined. Actual Obsidian breadcrumb rendering and ancestor-click smoke remains pending after plugin reload.
## 2026-07-31 - Mandala Daily-State Display Renames

status: runtime_synced_static_verified_ui_smoke_pending

- Renamed the `social_conduct` display label from `为人处世之道` to `为人处世与修行` and the `normal` display label from `有意识习惯培养` to `余度管理` across Daily Lessons, Daily Score projections, print headings, and add-item surfaces.
- Preserved stable state ids, item buckets and ids, references, score keys, historical records, schema, CSS identity, commands, events, and cross-plugin contracts. The Chinese labels are not persisted in Daily Lessons or Daily Scores, so no business-data migration was needed.
- Runtime/dev/mirror `main.js` align at `2E046829...A8805B`; all three pass syntax and the focused rename harness. Styles, manifest, and Daily Scores retained their sentinels. Running Obsidian independently changed `data.json` and Daily Lessons during deployment; those valid user/runtime writes were preserved.
- Bayesian update: `refines` the Mandala daily-posture display semantics. Question Map, unknowns, registry, glossary, aliases, Skill, rules, ownership, APIs, and MemPalace remain unchanged.
- Boundary: actual Obsidian UI smoke remains for selectors, score tabs/cards/graphs, print, add-item titles, and the `social_conduct` side badge after plugin reload.
## 2026-07-31 - Mandala Primary-Key Detail Navigation

status: runtime_synced_static_verified_ui_smoke_pending

- Extended the existing stable-identity cross-navigation contract from summary/plan rows to goal and Workspace project per-key detail headers.
- Each detail header now exposes `周汇总` and `纵向管理`; the destination remains same-domain, row-focused, centered, highlighted, and governed by the existing latest-request and scroll-restore rules.
- Added detail-save failure containment: rejected owner writes restore dirty state, show Notice, and block pending focus/tab switch. Clean navigation writes nothing; dirty navigation saves the source once.
- Runtime/dev/mirror align at `main.js=45B6A16A...2951D` and `styles.css=82458809...BF0C`; syntax, old navigation regression, and the new route/UI/write-boundary harness pass.
- Bayesian update: `refines` the existing primary-key continuity and Mandala UI contract. No schema, API, event, command, ownership, lifecycle, business-data, Question Map, unknown, Skill, rule, glossary, alias, or MemPalace change.
- Boundary: Obsidian independently updated Weekly Goals and plugin UI state during synchronization; both remain valid and were not copied or rolled back by deployment. Actual click smoke remains pending after plugin reload.

## 2026-07-31 - Mandala Structured-Field Image Albums

status: runtime_synced_static_verified_ui_smoke_pending

- Extended the existing compact Obsidian attachment album to daily lesson `priorExperience`, goal-plan `knowledge`, and project-plan `valueDirection`; the project field boundary was explicitly confirmed by the user.
- Preserved the existing string fields and business JSON ownership. No project `knowledge`, `images[]`, sidecar JSON, attachment deletion, or `currentReality` change was introduced.
- Added field-level owner-safe RMW, persistent recovery drafts, multi-window conflict refusal, provisional-reference-before-binary ordering, close admission locks, retry-failure isolation, and deferred-save snapshot protection.
- Timeline, score, print, and Project Overview AI projections expose readable text plus image count instead of raw embed tokens. Project Overview remains a read-only consumer at the export boundary.
- A follow-up corrected two verifier findings with a strict structured-field domain/field allowlist and a Timeline projection limited to goal `knowledge` / project `valueDirection`; `currentReality` remains ordinary text.
- The same follow-up restored project-plan Collection Card evidence when the active Project Overview model is not Workspace-grouped: Mandala now builds a read-only `workspace` model rather than reusing an unrelated goal model as an empty result.
- Runtime/dev/mirror align at final `Mandala main.js=1A50811C...A697D`, `styles.css=1816E9E1...CF67`, and `Project Overview main.js=DC6F2823...D4E8E`; 8 syntax checks, 4 focused tests, and 3 legacy suites pass.
- Deployment copied 9 initial code files plus 3 follow-up Mandala `main.js` files only. Daily Lessons and Weekly Goals retained identical immediate pre/post deployment hashes and timestamps in both guarded windows; their live content was never copied or rolled back.
- Bayesian update: `refines` existing Mandala owner-local image and input-safety contracts plus Project Overview export projection. No macro layer, ownership, schema, API, event, command, Question Map, unknown, Skill, rule, glossary, alias, or MemPalace change.
- Boundary: actual Obsidian album interaction and project-plan Collection Card smoke remain pending after reloading Project Overview and Mandala. The diagnostic sentinel is `weekly-project-plan.collection-cards.read.workspaceCount > 0`.

## 2026-08-01 - Workspace Mount Ontology Compact Album And Clipboard Paste

status: runtime_synced_static_verified_ui_smoke_pending

- Replaced the Ontology cell's all-thumbnail projection with one compact cover/count launcher and a large scrollable child album containing every preview, caption, unresolved tile, add/drop/paste action, and confirmed exact-reference removal.
- Added direct clipboard image paste to both the cell textarea and open album. Image items take precedence over files, multiple images retain order, text-only paste remains native, nameless images receive unique MIME-derived names, and no blob/base64 enters Workspace JSON.
- Child albums remain ephemeral views over the parent draft. Parent close/forced teardown invalidates them immediately; pending deletion confirmations fail closed, while every image batch admitted before close drains through a parent-owned admission token before final save.
- A non-empty `nestedTableId` now projects a stable established state for the parent cell, including structurally empty child tables. Rendering this state performs no write.
- Runtime/dev/mirror align at `main.js=AB369D8A...773A2C` and `styles.css=3DE78449...9858DC`; three syntax checks, the full Ontology suite, diagnostics, CSS `541/541`, exact attachment no-delete checks, and business-data sentinels passed after deployment.
- Bayesian update: `refines` Workspace Mount's existing Ontology image, child-view, recovery, teardown, and no-ghost-data contracts. No schema, owner, cross-plugin API, event, command, sidecar, Question Map item, unknown, Skill rule, glossary term, alias, or MemPalace claim was introduced.
- Boundary: actual Obsidian album layout, picker/drop/paste, confirmed removal, empty/populated child-table marker, parent close, and reload smoke remain pending after plugin reload.
## 2026-08-01 - Workspace Mount Ontology Hidden Image Projection And Single Footer

status: runtime_synced_static_and_geometry_verified_ui_smoke_pending

- Ontology textarea now hides parser-recognized image embed tokens while canonical `cell.value` retains the exact references. The visible projection does not globally trim or collapse whitespace, and render/rerender performs no write.
- Text input re-resolves the live cell from stable `{tableId,rowId,columnId}`, preserves hidden token order and duplicates, transfers manually typed image embeds once, and restores a stripped projection after rejected writes.
- The compact album launcher and nested/delete-nested/image-add actions now share one footer row. A layout-capable Chromium check passed at 220 px for image/no-image x nested/no-nested; controls do not overlap, wrap, clip or overflow, and row deletion remains outside the cell footer.
- Runtime/dev/mirror align at `main.js=B4A3EF63...26174` and `styles.css=0D0FF82E...3C86A`. Three syntax checks, full Ontology tests, performance diagnostics, production no-hook load and geometry tests pass. Canonical and plugin-directory Workspace JSON, plugin `data.json`, and manifest retained their pre-deployment hashes.
- Bayesian update: `refines` the existing Workspace Mount Ontology image/editor-projection and compact-layout contracts. No schema, owner, provider/consumer, cross-plugin API, event, command, Question Map item, unknown, Skill rule, glossary term, alias or MemPalace claim changed.
- Boundary: actual Obsidian reload smoke remains pending for hidden textarea embeds, album opening, one-row footer, paste/import and confirmed reference removal.

## 2026-08-01 - Workspace Mount Ontology Nested Action First

status: runtime_synced_static_and_geometry_verified_ui_smoke_pending

- Refined the single-row Ontology footer so DOM, visual, and keyboard order agree: `创建子表/进入子表` is always first at the left edge, `删除子表` follows when present, the album occupies the flexible middle, and `添加图片` stays fixed at the right edge.
- Removed the obsolete action wrapper without changing handlers, data schema, save/recovery paths, attachment ownership, or row-delete ownership.
- Runtime/dev/mirror align at `main.js=24FA9822...2568C` and `styles.css=08519583...B6D7`. Three syntax checks, full Ontology tests, performance diagnostics, production no-hook load, and Chromium 220 px four-state geometry tests pass.
- Canonical and plugin-directory Workspace JSON, plugin `data.json`, and manifest retained their exact pre-deployment hashes.
- Bayesian update: `refines` the existing Workspace Mount recursive-action and compact-footer UI contract. Question Map, unknowns, registry, contracts, Skill, rules, glossary, aliases, and MemPalace remain unchanged.
- Boundary: actual Obsidian reload smoke remains pending for the footer order under the user's active theme.

## 2026-08-01 - Mandala Daily Ontology And Workspace Ontology Deletion Lock

status: runtime_synced_static_verified_ui_smoke_pending

- Mandala daily-lesson canonical items now own independent recursive Ontology documents. Reference rows open the canonical owner; clean first open/close writes nothing; ordinary daily writers preserve formal Ontology values.
- Workspace Mount exposes a versioned external editor provider while Mandala retains formal data, CAS, recovery, canonical identity, and unload authority. Recovery failure blocks destructive owner teardown.
- Workspace paradigm items with any non-null Ontology now have a hard deletion lock across direct, ancestor, mounted, and source-paradigm paths. Reference-copy and category-reparent operations remain available.
- Mounted deletion freezes full projection identity and rechecks authoritative transaction data; source, Tab, scope, binding, Ontology, or subtree drift cancels with zero completed business writes.
- Runtime/dev/mirror align at Workspace `main.js=5EE65F30...B4AD57E`, Mandala `main.js=65E7CF41...E76802B0`, and Mandala `styles.css=99E85FB5...A612113`. Six deployed syntax checks and all nine dynamic suites passed; business JSON, plugin data, and manifests retained their exact pre-deployment hashes.
- Bayesian update: `refines` Workspace no-ghost-data deletion safety and `adds` a bounded external-owner Ontology editor contract. Question Map, unknowns, glossary, aliases, Skill, rules, and MemPalace remain unchanged.

## 2026-08-01 - State Capsules Project Overview Tab And GTD Context Restore

status: runtime_synced_static_verified_ui_smoke_pending

- Project Overview capsule schema v2 now stores `groupId + primaryNodeKey` by scope and restores the selected primary-key Tab through exact id, stable identity, then first-visible fallback while preserving vertical scroll.
- Active Project Overview grouping/normal-Kill scope is restored in memory. Normal scope cannot reveal an all-killed primary; Kill scope inspection performs no lifecycle mutation.
- State Capsules now supplies normalized capsule keywords under an explicit GTD navigation policy. GTD resolves owner-side tag carriers and returns to its normal unfiltered project surface instead of restoring tag filters.
- Multi-project ambiguity uses saved project/item anchors, GTD list position, DOM distance from saved scroll, then deterministic order. No match restores the old local view context and creates no data.
- GTD bridge hosts are routed by note path and active host identity. Unresolved multiple-host ambiguity fails closed; rapid restore timers are generation-owned.
- Runtime/dev/mirror align at State Capsules `E4FFC831...26D0B`, GTD main `BB0323A5...66288`, GTD engine `2A71DD09...0E138`, and Project Overview `F0C5D5AF...AD5A9`.
- Twelve deployed syntax checks, 25 dynamic/static contract checks, independent verifier PASS, and seven business/manifest sentinels passed.
- Bayesian update: `refines` Context Capsule Key restore semantics and cross-plugin environment-state routing. Question Map, unknowns, Skill, rules, glossary, aliases, and MemPalace remain unchanged.
- Boundary: actual Obsidian capsule-switch smoke remains pending after reloading State Capsules, GTD, and Project Overview.
## 2026-08-02 - Ontology Historical Lifecycle And Daily Completion Instances

status: runtime_synced_static_verified_ui_smoke_pending

- Upgraded the generic Workspace Ontology document to schema v2 with active/archive/restore column lifecycle, document-level reserved IDs, v1 draft migration and non-empty row deletion refusal.
- Added Mandala's owner-local `Mandala_DailyCompletionOntology.json`: one shared schema authority, sparse independent date instances, split schema/date CAS, provider-generation and owner/source/date checks, durable recovery and safe staged publication.
- Clean open/render/history projection remains write-free. Deployment did not create the new JSON and preserved DailyLessons, Workspace Items and both plugin `data.json` hashes.
- Registered the new owner JSON in JSON Asset Registry and promoted the durable-data lifecycle guard into `obsidian-system-plugin-dev`.
- Runtime/dev/mirror align at Workspace `main.js=387ADBF...44153C`, Mandala `main.js=7DD3AFF...FA07D`, Mandala `styles.css=3A3D18C...753FE`, and Registry `main.js=BA2C28B...BAF1C`.
- Bayesian update: `refines` the external Ontology provider and historical-data contracts and `adds` a date-instance Mandala owner. Question Map and unknowns remain unchanged; actual Obsidian UI smoke is pending after plugin reload.

## 2026-08-02 - Ontology Lifecycle Final Verifier Remediation

status: runtime_synced_static_verified_ui_smoke_pending

- Initial post-change verifier reproduced a Mandala source/path TOCTOU, found that archived columns required restore before inspection, and identified legacy physical-delete test expectations.
- Mandala now freezes owner source/path across commit, rechecks before publication, and writes/rereads only the frozen path. The regression test switches source during an asynchronous read and proves `ONTOLOGY_OWNER_STALE` with no old-file change and no new-directory file.
- Workspace Ontology now separates non-writing `查看归档` from restore. Archived text and existing child tables remain inspectable, image albums remain viewable, and text/schema/image/subtable mutations are disabled through both parent-cell and album paths.
- A second verifier found that archived-parent descendants and direct image mutation entry points needed deeper guards. Archive read-only now follows the entire parent chain and is enforced again by image removal, queue admission and async preparation; dynamic tests cover both bypasses.
- The complete Ontology suite now passes under archive/retain semantics. Runtime/dev/mirror align at Workspace `7C3B2BBC...7F18C` / CSS `D94BE83E...90AB4` and Mandala `D61DD6FC...AC168`. The final Workspace-only code sync preserved all five immediate before/after business sentinels exactly. Earlier live Obsidian writes to DailyLessons/Mandala settings were retained, and the new completion JSON remains absent.
- Bayesian update: `refines` the historical lifecycle and external-owner commit contracts. No owner, API version, schema version, Question Map, unknown, glossary, alias, or MemPalace claim changed.
- Fresh final verifier verdict: `PASS`; no blocking code-contract finding remains. Actual Obsidian interaction smoke is still pending.

## 2026-08-04 - Mandala Longitudinal Primary-Key Ontology

status: runtime_synced_static_verified_ui_smoke_pending

- Added a compact standard recursive Ontology action to every visible primary key in `目标执行计划` and `项目执行计划` without adding a table column.
- Added Mandala-owned `Mandala_LongitudinalOntology.json`; goal owners use stable Mandala node identity and project owners use the Workspace stable identity alias. Stop, Kill, current filtering, and owner absence never delete retained Ontology.
- Kept ordinary plan rows and every public plan/Timeline/Project Overview/score/print/AI projection free of Ontology bodies and recovery drafts.
- Hardened publication with source/provider/owner leases, alias collision refusal, whole-file CAS, exact stored-byte admission, pre-read size checks, atomic no-replace native publication, containment checks, and non-destructive rollback evidence.
- Populated buttons now use the standard Workspace-style outside-corner status dot requested by the user; empty and unknown states remain unmarked.
- Runtime/dev/mirror align at Mandala `main.js=43F7CDE7...F8FBB9`, `styles.css=E32FB7F7...D099565`, and Registry `main.js=BB0F01A1...BFC863`. Eight staging checks, six deployed syntax checks, and final independent verifier `PASS` completed.
- The bounded code-only deployment preserved all five immediate business sentinels. `Mandala_LongitudinalOntology.json` remained absent, proving deployment and clean projection did not create formal data.
- Bayesian update: `adds` a bounded longitudinal primary-key external Ontology owner and `refines` stable-identity/historical-retention/UI-state contracts. Question Map and unknowns remain unchanged; actual Obsidian interaction smoke remains pending after reload.

## 2026-08-04 - Mandala Checklist State And Canonical Referred-By Visibility

status: runtime_synced_static_verified_ui_smoke_pending

- Added the eleventh real Daily Lessons state `checklist` / `核查清单` with stable default `checklist_external_communication_closeout` / `外部沟通闭环巡检`.
- The state is registered in Mandala-owned Daily Lessons buckets, explicit-only idempotent seeding, CRUD, references, weekly overview, eleven-section print, score pack/state tab, all-state graph, historical `checklist_` score inference, and distinct state/row CSS.
- Canonical rows now derive ordered/deduped `被 X、Y 面引用` visibility from the existing forward `referencesBySide`; reference rows keep `引用自 X 面`. No reverse index, copied canonical content, or read/render writeback is introduced.
- Self, stale, ambiguous and duplicate references fail closed for the reverse badge. A stopped canonical item can still show its truthful reverse relationship when historical evidence causes it to remain visible.
- Runtime/dev/mirror align at Mandala `main.js=BC5063B1...45747B` and `styles.css=1291719C...E1571`. Three deployed syntax checks and current checklist, Daily Ontology v2, Daily Completion Ontology and weekly-navigation regressions pass; independent verifier `019fca95-ba5a-7d43-a0af-687c9eadb115` returned `PASS`.
- Daily Lessons and all five other business JSON sentinels remained unchanged through deployment/read-only verification. Running Obsidian independently refreshed plugin `data.json`; that environment-state write was retained and not part of deployment.
- Bayesian update: `corrects` the ten-state runtime prior to eleven states and `refines` canonical-reference visibility. Question Map, unknowns, Skill, rules, glossary, aliases, contracts and MemPalace remain unchanged; actual Obsidian UI smoke is pending after plugin reload.
## 2026-08-04 - Timeline Milestones Become Primary-Key Time-Limit Evidence

- Timeline remains sole owner of items, day slots, milestones and `Timeline_Data.json`.
- Added bounded schedule metadata and deterministic date -> seven-stage -> name -> id ordering to the repository-dev owner snapshot.
- Mandala `项目执行计划` and Project Overview consume that snapshot once per render/model build through exact stable identity.
- Project Overview removed standalone Timeline grouping while retaining the read-only Timeline evidence column; legacy mode normalizes in memory to Workspace.
- Fresh post-change verification passed after fail-closed Mandala provider remediation. Runtime/mirror sync and actual Obsidian UI smoke remain pending.
- User-confirmed runtime/mirror synchronization completed after fresh drift checks. Runtime/dev/mirror align on all five code assets; deployed syntax, the focused projection contract and four lifecycle regressions pass, and four business JSON sentinels remained unchanged. Actual Obsidian UI smoke remains pending after plugin reload.
- 2026-08-05: Added the Phase 12 weekly primary-order projection. Timeline exports a bounded canonical today-wave snapshot, Project Overview adds capsule level metadata, and Mandala reduces `ABC -> today wave -> PEO -> stable id` only for weekly summaries and their print sections. Runtime/dev/mirror synchronization, deployed syntax/contracts and business-JSON sentinels are verified; actual Obsidian UI smoke remains pending after plugin reload. Trace: `change-records/2026/2026-08/20260805-weekly-abc-today-wave-order.md`.
- 2026-08-05: Added Phase 13 vertical/weekly order parity. Mandala current goal/project vertical-management Tabs and print sections reuse the Phase 12 current-attention reducer after current-row visibility filtering. The repository-dev candidate is independently verified; runtime/mirror remain on the deployed Phase 12 hash pending explicit confirmation. Trace: `change-records/2026/2026-08/20260805-vertical-plan-current-attention-order.md`.
- 2026-08-05: Phase 13 code-only synchronization completed after explicit user confirmation. Runtime/dev/mirror Mandala `main.js` align at `503BDE60864B96F8337AA658A6706BF0976E96152987C64C7994E832E7DC3AAD`; deployed syntax and focused/lifecycle contracts pass. Business JSON was not copied or written; current runtime data hashes are recorded in the engineering change record. Atlas index is `GREEN`; existing term-drift advisory remains `YELLOW` with 3 warnings and 0 errors. UI smoke is pending plugin reload.
- 2026-08-05: Phase 14 fixes target-only fallback after UI smoke showed projects ordered correctly but goals still reported incomplete ABC evidence. Project Overview now exports additive Mandala group-member identities; Mandala gives those non-primary goals their group's ABC/PEO metadata and keeps per-goal Timeline ranks. Conflict and visible-row completeness remain whole-request fail-closed. Repository dev is independently verified; runtime/mirror sync is pending explicit confirmation. Trace: `change-records/2026/2026-08/20260805-goal-member-abc-timeline-order.md`.
- 2026-08-05: Phase 14 code-only runtime/mirror synchronization completed after explicit confirmation. Mandala and Project Overview each align across runtime/dev/mirror; deployed syntax and focused ordering contract pass. Project Overview `data.json` was autonomously refreshed by running Obsidian during the copy window and its current bytes were preserved. Deployment verifier found no P0/P1. Goal weekly/vertical UI smoke remains pending after reloading both plugins.
- 2026-08-05: Actual UI smoke corrected the Phase 14 goal-membership hypothesis. Project Overview's Mandala navigation groups are the managed goal primaries themselves; `group.columns.mandala` entries are surrounding evidence and may legitimately overlap. Mandala repository dev now joins ABC only from each snapshot entry's primary identity, then joins Timeline's today-wave rank on the same goal id. Member conflicts are bounded diagnostics, while primary identity/metadata conflicts and visible-primary gaps still fail closed. Staging syntax and focused contracts pass; independent plan and post-change verifiers have no remaining P0/P1. Runtime/mirror synchronization remains explicitly gated. Trace: `change-records/2026/2026-08/20260805-goal-primary-abc-timeline-order.md`.
- 2026-08-05: After explicit confirmation, Phase 15 synchronized Mandala `main.js` to actual runtime and mirror. Runtime/dev/mirror align at `BD2C10B56A5990876F96A17D45AD19D86379B4FCD8F12FC64FC55362912BCF15`; deployed syntax, primary-only feature sentinels and the focused order contract pass. Mandala, Timeline, Project Overview and State Capsules business JSON remained byte-identical. Deployment verifier found no P0/P1; actual goal weekly-summary and goal execution-plan UI smoke remains pending after reload.
- 2026-08-05: Phase 17 refines visible-goal completeness after diagnosis found 40 exact matches and 9 Mandala rows outside the current valid PEO primary set. The verified repository-dev reducer preserves every row, orders matched goals by `ABC -> Timeline -> PEO -> id`, places unmatched goals in a marked deterministic tail, and leaves project whole-request fallback unchanged. No owner API or business JSON changed; runtime/mirror synchronization and actual UI smoke remain pending. Trace: `change-records/2026/2026-08/20260805-190502-mandala-time-blocks-goal-partial-order-preserve-unmatched.md`.
- 2026-08-05: After explicit confirmation, Phase 17 synchronized Mandala `main.js` to actual runtime and mirror. All three roles align at `3D18D217640012281E70745F0E573D573D040862FDB3820BB8245DC480D7B5F3`; three syntax checks and eight contract/regression suites pass. The deployment command copied code only. Running Obsidian independently updated Timeline data during the verification window, and the new bytes were retained. Actual UI smoke remains pending after reloading Mandala.
- 2026-08-06: Added repository-dev `ontology-meta-hub` as a standalone read-only discovery/reduce/navigation layer rather than a Project Overview tab. Workspace and Mandala expose five owner families through revision-bound cursor providers; Hub stores no Ontology body or second index. Historical orphans remain owner-held and forced read-only, while exact daily/paradigm/goal/project source navigation stays owner-controlled and cancellation/source drift fail closed. Independent verifier `019fd566-bb60-74c1-bbcb-437ef733fe6e` returned final `PASS`; runtime deployment and Obsidian UI smoke remain pending explicit confirmation. Trace: `change-records/2026/2026-08/20260806-ontology-meta-hub.md`.
- 2026-08-06: Extended repository-dev Ontology Meta Hub from read-only discovery into transient cross-owner cell-reference coordination. Added canonical cell/schema addresses, `Mod+Shift+M` A->B capture, live provenance/backlinks, structure-only recursive schema lineage, complete graph proof and owner-native CAS commits. Workspace and all four Mandala owner families share dynamic generation/lease read-only protection; pending destructive confirmations recheck capability before mutation. Independent verifier `019fd5f4-e192-7721-98db-00393bc2340b` returned final `PASS`; staging and repository-dev syntax/integration suites pass. Runtime, mirror and business JSON remain untouched. Bayesian update: `refines` the Hub from purely read-only navigation to non-owning transaction coordination while preserving owner boundaries and EVA separation. Trace: `change-records/2026/2026-08/20260806-ontology-cell-reference-coordination.md`.
- 2026-08-06: After explicit confirmation, synchronized the verified Hub/Workspace/Mandala compatibility set to actual runtime and mirror. Six code assets align across all three roles; nine syntax checks, three manifest parses and two focused regressions pass. Eight business/environment sentinels remained byte-identical. Hub is installed but intentionally not written into `community-plugins.json` while Obsidian is running; reload/enable and UI smoke remain pending. The deployment changes evidence status only and does not revise ownership or reference semantics.
- 2026-08-06: Added repository-dev `source-group-facets-v1` for Ontology Meta Hub. The five-family rail now reports counts under the active query/state/history filters; owner-provided source capsules refine only the current family, with Workspace grouped by stable paradigm id/name rather than paradigm item. The repeated purpose/usage column was removed from UI while descriptor compatibility remains. Complete provider facets, source-bound cursors, zero-match identity retention and unfiltered degradation prevent page-derived or stale-source results. Desktop title/search, capsule rail and table header use explicit sticky stacking; narrow screens keep only the title/search bar sticky. Final verifier `019fd699-3cd8-7cc1-8855-42f8b27a2756` returned `PASS`; runtime/mirror synchronization remains pending explicit confirmation. Bayesian update: `refines` the discovery contract without changing owner data or primary contract version. Trace: `change-records/2026/2026-08/20260806-190402-ontology-meta-hub-source-capsules.md`.
- 2026-08-06: Corrected repository-dev Ontology editor-adapter generation routing after runtime diagnostics proved a Mandala owner modal was forwarding the shared Workspace editor generation. Hub now strips caller credentials, injects the frozen owner lease for capture, routes live/open operations by address owner, and keeps owner-staleness separate from global write availability so incomplete backlink reads still degrade honestly. Final verifier `019fd7b1-de01-7f93-8dcc-7a7beb602157` returned `PASS` after two compatibility findings were remediated. Bayesian update: `refines` the existing adapter lease contract; no owner, schema or persistent-data model changed. Runtime/mirror remain unchanged pending explicit deployment confirmation.
- 2026-08-07: After explicit user confirmation, synchronized only Ontology Meta Hub `main.js` for the adapter-generation routing fix to actual runtime and mirror. Runtime/dev/mirror align at `D453932A...DD62A13`; three syntax checks, four feature sentinels and the focused Hub regression pass. Eight plugin/environment/business sentinels retained exact before/after hashes. Deployment verifier `019fd7d8-cbf1-7852-a39c-3e5677cf61d9` returned `PASS_WITH_ACTIONS`, with no P0/P1/P2; Obsidian was already running, so restart and actual Meta A/B smoke remain pending.
- 2026-08-06: After explicit confirmation, synchronized the verified Ontology source-capsule compatibility set and Mandala reference-negotiation hotfix to actual runtime and mirror. Hub `main.js/styles.css`, Workspace `main.js`, and Mandala `main.js` align across all three roles; deployed syntax and both focused regressions pass. Eight business/environment sentinels remained byte-identical, and deployment verifier `019fd781-64ea-76a2-b02c-03d8247e4ea7` returned `PASS`. This is a deployment-status update only: ownership, provider contract semantics, schema and lifecycle claims are unchanged. Actual Obsidian reload smoke remains pending. Trace: `change-records/2026/2026-08/20260806-190402-ontology-meta-hub-source-capsules.md`.
- 2026-08-07: Runtime console evidence showed both Ontology reference providers available but timing out because each visible cell launched another whole-system backlink reduction. Repository dev now shares one single-flight proof, retains only complete proofs, cools incomplete retries for 2 seconds, exposes provider-specific incomplete diagnostics, and hides cell capture outside Meta mode. Mandala daily-item Ontology commits now use an owner/provider-scoped editor lease so an editor opened outside the closed Dashboard can save without reopening unrelated writes. Independent verifier returned `PASS_WITH_ACTIONS` with no P0/P1; runtime/mirror remain unchanged pending explicit confirmation and UI smoke. Trace: `change-records/2026/2026-08/20260807-ontology-reference-proof-save-hotfix.md`.
- 2026-08-07: After explicit confirmation, synchronized the verified reference-proof/save compatibility set to runtime and mirror: Hub `main.js`, Workspace `main.js/styles.css`, and Mandala `main.js`. All four assets align across runtime/dev/mirror; nine syntax checks, feature sentinels and two focused regressions pass. Eight business/environment sentinels remained byte-identical. Deployment verifier `019fd822-aeee-75f3-8725-8c7ee65a56e2` returned `PASS_WITH_ACTIONS` with no P0/P1/P2. Obsidian was already running, so complete restart and actual B-save/A-backlink/Meta-pointer smoke remain pending.
- 2026-08-07: Refined repository-dev Ontology backlinks and Meta affordance. Incoming labels now follow `source / Ontology object / column lineage` and exclude row labels/ids except a Chinese legacy-ID fallback; providers attach bounded `fromDescriptor` data during their Map stage, while Hub identity, cycles and deletion proofs still use canonical addresses. Read-only backlink scans now roll forward to one current-generation proof when a new editor invalidates an in-flight display proof. The Meta pointer is hidden with no layout footprint outside A/B capture, without suppressing provenance, backlinks or diagnostics. Staging and repository-dev syntax/Hub/Workspace regressions pass; independent verifier `019fd856-0ec9-77f3-a215-001dbcdaffa8` returned `PASS`. Runtime and mirror remain unchanged pending explicit confirmation. Bayesian update: `refines`; source status: `confirmed_by_user` plus `confirmed_by_code`.
- 2026-08-07: After explicit user confirmation, synchronized the readable-backlink/Meta-pointer compatibility set to actual runtime and mirror. Hub `main.js`, Workspace `main.js/styles.css`, and Mandala `main.js` now align across runtime/dev/mirror; nine syntax checks, both focused regressions and feature sentinels pass. Eight business/environment files stayed byte-identical during the copy window. Deployment verifier `019fd9a7-3e72-7242-bc7b-7b351b55510c` returned `PASS` with no P0/P1/P2. Obsidian restarted afterward at 08:38; interaction smoke remains pending. Bayesian update: `no_model_change`, deployment confidence only.
- 2026-08-08: Framework update check `updated`. Workspace Mount's shared Ontology editor now has a transient rectangular content clipboard: exact text and same-file image references may cross tables/owner modals, while nested tables, Meta references, Shared Schema, lineage and provenance are structurally excluded. Empty-target all-or-nothing paste, plugin/vault-generation scope, TTL/capacity/hash checks and transactional rollback refine the editor/material layer without adding a persistent owner or provider contract. Repository Dev and focused regressions are verified; verifier `019fdfc2-41c7-7c82-a915-9758018d93a0` returned `PASS`. Runtime/Mirror and UI smoke remain pending explicit confirmation. Bayesian label: `refines`; Question Map, unknowns, glossary, aliases, Skill/rules and MemPalace are unchanged.
- 2026-08-08: Deployment update `no_model_change`. After explicit confirmation, the verified Workspace rectangular clipboard `main.js/styles.css` were synchronized to actual Runtime and Mirror. Three-role alignment is `6/6`, feature sentinels `10/10`, five syntax checks and both Runtime regressions pass, and eight fresh business/environment sentinels remain unchanged. Deployment verifier `019fe070-b807-7231-90c6-49a3eba168eb` returned `PASS`. Obsidian predates deployment, so interaction smoke remains pending reload/restart.
- 2026-08-08: Framework update check `updated`. Reversible Mandala daily stop state now suppresses only Ontology discovery projection; stable owner identity, formal Ontology, Cell/Schema resolution and relationships remain intact. The existing Hub refresh API updates open views after stop/restore. Repository Dev and regressions are verified; Runtime/Mirror await confirmation. Bayesian label: `refines`; Question Map, unknowns, glossary, aliases and Skill/rules are unchanged.
- 2026-08-08: Deployment update `no_model_change`. After explicit confirmation, only Mandala `main.js` was synchronized to actual Runtime and Mirror; all three roles align at `EAF30B8C...17D6ECAD`, syntax and isolated Runtime regressions pass. Five sentinels retained exact hashes; running Obsidian independently updated `Workspace_Items.json`, `workspace-mount/data.json` and `Mandala_DailyLessons.json` after the baseline, and those current bytes were preserved. UI smoke remains pending reload/restart.
- 2026-08-09: Added repository-dev Ontology Keyword indexing. Keyword Index owns a separate `ontology_keyword_index.json` sidecar with structured owner refs, `okw-` ids, one-to-many target labels, tombstone deletion and reserved IDs. Ontology Meta Hub adds a keyword rail/tab, compact per-owner tag management, bounded target selection and provider-routed exact navigation. Ordinary keyword topology, Ontology owners and business JSON remain separate. Syntax, existing integrations and the dedicated sidecar regression pass; Runtime/Mirror await explicit deployment confirmation. Trace: `change-records/2026/2026-08/20260809-ontology-keyword-index.md`.
- 2026-08-09: Refined repository-dev Ontology Keyword labels to the established manual `A-Z + semantic body` locator convention. Raw labels remain sidecar identities; `groupLetter` and stripped `displayLabel` are runtime-derived only, semantic duplicate checks ignore the locator, and legacy unprefixed records remain readable. Hub now renders wrapping category capsules plus an existing-category-only sticky right rail without owning a second scroll container. Code and regressions pass; independent verifier `019fe56e-57f4-70a2-9c31-edcf8f6b0656` returned `PASS`. Runtime/Mirror and all business JSON remain unchanged pending explicit confirmation. Bayesian update: `refines`; source status: `confirmed_by_user_and_code_and_memory`.
- 2026-08-09: After explicit confirmation, synchronized only Keyword Index `main.js` and Hub `main.js/styles.css` from verified Dev to actual Runtime and Mirror. All nine role/file hashes align, four deployed syntax checks and locator/category-navigation sentinels pass, and focused Keyword/Hub/Workspace regressions pass. Five present business/environment files retained exact hashes; Hub `data.json` remained absent. Deployment backup: `state/backups/ontology-keyword-deploy-20260809-154548`. Independent deployment verifier returned `PASS_WITH_ACTIONS` with only the now-remediated documentation P1. Bayesian update: `no_model_change`; loaded Obsidian UI smoke remains pending plugin reload.
- 2026-08-09: Added repository-dev in-place Ontology Keyword rename. Hub now exposes `改名` separately from `改绑`; the prefilled modal calls owner `updateKeyword` and preserves input on failure. Keyword Index performs same-generation record snapshot admission with `expectedLabel/expectedUpdatedAt`, preserves id/target/history, and treats unchanged labels as zero-write. Syntax and focused Keyword/Hub/Workspace regressions pass; Runtime/Mirror await explicit synchronization confirmation. Bayesian update: `refines`; source status: `confirmed_by_user_and_code`.
- 2026-08-10: Corrected repository-dev Ontology Keyword capsule navigation. Capsules now show only the locator badge and semantic keyword; clicking performs a bounded exact `ontology-owner-ref:v1` scan, selects the verified family/source projection and temporarily highlights the owner row instead of opening the editor. Independent generation/lease cancellation, cursor completeness guards and atomic failure rollback cover standalone and Mandala-embedded Hub surfaces. Focused Hub, Keyword and Workspace regressions pass; Runtime/Mirror remain unchanged pending explicit synchronization. Bayesian update: `corrects` direct-open behavior and `refines` Hub discovery navigation; source status: `confirmed_by_user_and_code`.
- 2026-08-11: Added repository-dev Temporal Framework as a new strategic time-architecture owner. The Time x Outcome workbench consumes Mandala stable goal/project identity, while owning only strategic outcomes, outline/typed relations, Placement, gate policies, no-deployment coverage and manual completion paint. TimeBoxes remain derived year/quarter/month/week intervals; Timeline retains short-range scheduling and cannot auto-complete strategic outcomes. Engine/store/UI/Mandala contract regressions pass; final verifier `019ff0c9-a6b7-7e80-b497-68abfef4734e` returned `PASS`. Runtime/Mirror deployment remains pending explicit confirmation. Bayesian update: `adds` a missing planning layer. Question Map, Unknowns, glossary, aliases and Skill/rules remain unchanged.
- 2026-08-11: Refined repository-dev Temporal outcome ownership navigation. Mandala now resolves a planning identity to its provider-native current or historical goal/project Ontology owner; Temporal forwards that stable reference without deriving Workspace aliases. Outcome create/revise/detail surfaces open the owning primary-key Ontology without closing drafts, outcome modals use a wider surface, and invalid planning candidates are filtered at the consumer boundary. Full regressions and final verifier `019ff18a-207b-7ee1-8ba2-97fb6d4ed485` pass. Runtime/Mirror remain unchanged pending explicit synchronization. Bayesian update: `refines`; no Question Map, unknown, glossary, alias or Skill change.
- 2026-08-12: After explicit confirmation, synchronized Temporal `main.js/styles.css` and Mandala `main.js` to the proven Runtime and repository Mirror. All nine role/file hashes align, the full suite, six syntax checks and 20 feature sentinels pass. Ten of eleven business/settings sentinels remained byte-identical; running Obsidian only reordered the final two enabled-plugin ids while preserving the exact set, and later Temporal owner writes were preserved. Deployment verifier `019ff1a5-9be0-7740-b398-e3f882cc5b5c` returned `PASS_WITH_ACTIONS` with no P0/P1. Bayesian update: `no_model_change`; UI smoke remains pending.
- 2026-08-16: Refined repository-dev Next Action Workbench source projection after confirming that a managed-primary name and a Collection Card capsule name are different identities. Workbench now reads each primary's EVA-reduced Collection column through Project Overview stable identity, preserves old links on incomplete evidence, and displays capsule labels only as provenance. Mandala adds an action-workbench-only `0/A/B/C/CZ -> Timeline today -> PEO` order policy, while goal/project Tabs retain primary names and independent selection. Full tests and three syntax checks pass; final verifier `01a00660-e3cd-7e23-a417-0fa231a83636` returned `PASS`. Runtime/Mirror remain unchanged pending explicit confirmation. Bayesian update: `refines`; Question Map, Unknowns, Skill/rules and MemPalace are unchanged.
- 2026-08-16: After explicit confirmation, synchronized the verified source-projection set to actual Runtime and repository Mirror: Project Overview `main.js`, Mandala `main.js`, and Workbench `main.js/styles.css`. All twelve role/file hashes align, six deployed syntax checks and the full Workbench suite pass, and 24 business/environment sentinels remained byte-identical. Deployment verifier `01a00671-1802-7042-8631-b28f3c8eb05e` returned `PASS`. Bayesian update: `no_model_change`; Obsidian predates deployment, so loaded UI smoke remains pending restart.
- 2026-08-17: Added the Repository Dev Temporal Framework milestone-progress and manual-effectiveness candidate. Existing milestone cards derive non-persisted progress from `milestone-create.createdAt` in Store timezone to current `targetDate`; the new `正在生效` mode is driven only by reason-free `effect-set { outcomeId, effective }` facts and groups selected active Outcomes by framework item, own direct milestone, membership and complete guarded ancestor branch. Same-value toggles are zero-write; archive hides without clearing; direct milestone identity is never inherited. Full nine-group tests pass and final verifier Dewey `01a00e26-4e4a-7a13-b69a-49726e71e91f` returned PASS with no findings. Runtime/Mirror remain unchanged pending explicit deployment. Bayesian update: `adds` an independent manual attention/effectiveness projection and `refines` milestone time cognition without changing completion semantics.
- 2026-08-17: Temporal Framework milestone-progress and manual-effectiveness deployment is now closed. Dev/Runtime/Mirror static assets align, protected Runtime data remained byte-identical, and independent deployment verification passed. The user then confirmed the loaded Obsidian interaction works as intended. Source status: `confirmed_by_user` plus existing `confirmed_by_code`; Bayesian update: `reinforces` the effectiveness UI claim and `no_model_change` for ownership, schema and lifecycle. Trace: `change-records/2026/2026-08/20260817-temporal-framework-milestone-progress-effectiveness.md` and `state/backups/temporal-effect-loaded-smoke-framework-update-20260817-141807`.
- 2026-08-22: Repository Dev now resolves `mandala-project-primary` Ontology descriptor names from the current Workspace identity projection instead of treating saved plan-row labels as authoritative. Audit proved all 70 unique owners remain resolvable. The 73 saved rows contain 25 blank/raw, four stale-readable and 44 current titles; after stable-identity deduplication, this is 22 raw-title owners, four stale-title owners and 44 current-title owners, so the defect is provenance drift rather than corruption. A final self-audit corrected the source boundary: allowed title/event sources are parsed from stable project `nodeId` values (70 rows use `④workspace挂载.md`; three retained duplicates use the older path), never substituted from the Mandala owner scope `九宫格目标.md`. Rename changes Hub display/search/sort and provider revision while stable refs and owner JSON remain unchanged. Matching Workspace saves coalesce refresh; Hub invalidates local snapshots and blocks stale in-flight cache repopulation. Syntax and focused/cross-plugin suites pass; Runtime/Mirror remain unchanged pending final verifier and explicit deployment confirmation. Trace: `change-records/2026/2026-08/20260822-013107-ontology-live-project-title-projection.md`.
- 2026-08-22: After post-change verifier `PASS / ALLOW` and explicit user confirmation, synchronized only the daily-only Mandala candidate and shared Hub candidate to Actual Runtime and Repository Mirror. Runtime/Mirror align at Mandala `A3810682...3209` and Hub `627D5190...243D7`; four syntax checks and focused regression pass, six fresh data/business sentinels stayed byte-identical, Daily Lessons archive remains present, and the unrelated 25-line Goal filter remains absent. Deployment backup: `state/backups/ontology-live-project-titles-deploy-20260822-071736`. Bayesian update: `no_model_change`; loaded UI smoke awaits Obsidian reload.
- 2026-08-22: Added `plugins/supermemo-concept-display.md` and indexed its stable ownership model: Concept capsules remain card/review objects, the subject structure tree is an independent architecture owner, and one stable Concept identity bridges the two. Repository Dev is verified; Runtime/Mirror and loaded UI smoke remain pending. Source status: `confirmed_by_user_and_code`; Bayesian update: `adds` + `splits`.
- 2026-08-30: Temporal Framework Outcome overview no longer defines membership roots as the complete result. Repository Dev now projects every valid active membership-local descendant into a SuperMemo-inspired horizontal tree, with explicit parent-boundary/cycle/depth evidence, own-Placement Time focus plus ancestor context, default-expanded per-View collapse memory and membership-local overflow. Runtime/Mirror remain unchanged pending explicit confirmation. Atlas update: `refines`; no Store schema, owner, public API, State Capsules or cross-plugin data contract change.
- 2026-08-30: After explicit user confirmation, synchronized only Temporal Framework `main.js/styles.css` from the independently verified Dev candidate to the proven actual Runtime and repository Mirror. All three roles align at bundle `BDD4171E...A51F25` and stylesheet `74CE2CB6...B51434`; five tree feature sentinels, deployed syntax and 10/10 tests pass. Four Runtime business/draft sentinels remain byte-identical and transaction artifacts remain absent. Atlas update: `reinforces`; loaded tree/resize smoke remains pending.
- 2026-08-31: Framework/Atlas update check `updated`. Added `knowledge/effective-operational-context-key.md` and synchronized glossary, aliases, contracts, API registry, Mandala/Temporal plugin pages, index, FW-019 and registry. The user-confirmed definition is a derived current project eligibility projection: current Workspace root carrier + complete Project Overview comment declaration with exactly one non-`9XX` current key + non-Killed lifecycle + present/non-stopped Mandala project tracking. Mandala publishes the bounded final snapshot; Ontology current, Temporal new admission and Next Action admission/lifecycle refresh consume it, while Timeline and retained owner history never grant eligibility. Bayesian update: `splits` all Context Capsule Keys from their effective current subset and `refines` FW-018 current/history boundaries. Final verifier `/root/verify_effective_keys_final` returned `PASS` after closing three contract P1s through frozen field completion and whole-snapshot malformed/duplicate rejection; P0=0, P1=0, P2=1 non-blocking test-backup limitation. Actual Runtime/Mirror remain on identical pre-change hashes and business JSON is untouched; deployment still requires fresh explicit confirmation and loaded UI smoke.
- 2026-08-31: After explicit deployment confirmation, synchronized only the five verified Effective Operational Context Key `main.js` bundles for Workspace Mount, Project Overview, Mandala, Temporal Framework and Next Action Workbench to the proven actual Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align `15/15`, syntax aligns `15/15`, feature sentinels pass `30/30`, full Temporal/Next and three Ontology/Hub suites pass, and the 39-file silent copy window records zero protected-data changes. Later writes to Mandala/Next Action plugin data and Timeline data came from already-running owners and were preserved. Independent deployment verifier returned `PASS_WITH_ACTIONS`, P0=0/P1=0/P2=1 only for loaded UI smoke. Bayesian update: `no_model_change`; this strengthens deployment evidence without changing the established ownership or eligibility model.
- 2026-09-01: Framework/Atlas update check `updated`. Extended Effective Operational Context Key to the goal domain without weakening the project rule. An eligible goal is the exact current Mandala node with exactly one forward EVA `承载` to a GTD top-level project, exactly one non-`9XX` Project Overview declaration, non-Kill lifecycle and non-stopped Mandala goal tracking. Ontology effective discovery includes empty-content goals; Mandala goal planning, Timeline, Temporal and Next Action consume the final goal snapshot. Repository Dev tests pass; Runtime/Mirror and business JSON remain untouched pending independent verification and explicit deployment. Bayesian update: `splits + refines`.
- 2026-09-01: Goal-domain final-review remediation keeps the same model while closing its proof gaps: PEO preserves separate comment declaration occurrences through deterministic evidence IDs; GTD supplies `Type / Top Level / Parent ID` so carrier admission is structural; unavailable/truncated EVA models close the whole goal snapshot; effective Ontology routing uses the stable domain so projects retain shared Schema authority while goals resolve retained owner-local documents without rebuilding the current family. Repository Dev focused/full suites pass; Runtime/Mirror remain unchanged. Bayesian update: `refines` implementation evidence, no model change.
- 2026-09-01: Follow-up hardening separates PEO `declarationEvidenceId` from logical `contextKeyId`, derives goal Schema resolution lifecycle from the retained local goal-plan state, and raises Timeline's consumer validation to the same complete envelope used by Temporal/Next. `totalCount >= count` is intentional because the producer reports inspected upstream owners separately from admitted targets. Runtime/Mirror remain unchanged. Bayesian update: `refines`, no model change.
- 2026-09-01: Final independent verification of the frozen goal-domain candidate returned `PASS`, P0=0/P1=0/P2=0. It rechecked 31/31 hashes, syntax/focused/full suites, source→bundle equivalence, cross-domain fail-close and old-byte Runtime/Mirror alignment. Bayesian update: `reinforces`; Repository Dev is admissible, while deployment still requires a fresh explicit confirmation and deployment gate.
- 2026-09-01: The user-confirmed goal-domain Effective Operational Context Key extension is deployed code-only to the proved Actual Runtime and Repository Mirror. Seven allowlisted JavaScript assets are 21/21 hash-aligned across Dev/Runtime/Mirror; 66 frozen environment, runtime-denylist and liner-chain business-data sentinels remain unchanged. Syntax and all focused/full suites pass; independent deployment verifier returned `PASS`, P0=0/P1=0/P2=1, deliverable. Loaded UI smoke remains pending Obsidian reload. Bayesian update: `refines`; no owner or schema change.
- 2026-09-02: Atlas compatibility correction: Project Overview now projects an exact standalone Context Capsule address (for example `036G001A`) into `contextKey.address` while preserving the previously issued label-derived identity. Structured `address - label` keys and ordinary labels are unchanged; pure `9XX` tokens remain historical. The correction restores complete effective-goal snapshots for strict consumers without changing the Effective Operational Context Key intersection, lifecycle ownership or persisted schemas. Runtime/Dev/Mirror static hashes align; loaded UI smoke is pending.
- 2026-09-02: After explicit user confirmation, deployed the Ontology current-family split code-only: normal discovery now exposes separate `项目有效操作上下文主键` and `目标有效操作上下文主键`, retained project/goal envelopes remain read-only in History, and the old mixed family stays hidden for compatibility. Current source codes continue to use persisted automatic defaults with user manual overrides taking precedence. Only Hub/Mandala `main.js` files were synchronized; Dev/Runtime/Mirror align 6/6, deployed syntax, feature sentinels and Hub regressions pass. Two allowlist-external Runtime host-state files changed later and were preserved rather than overwritten; 16 other protected files stayed byte-identical. Status: `runtime_synced_static_verified_ui_smoke_pending`; Bayesian update: `splits + refines`.

## 2026-09-03 - State Capsules Current-Use Exit And Workspace Snapshot Retirement Candidate

- Observation: the user no longer uses State Capsules for state switching and asked that this be communicated to the whole system through Atlas and Framework.
- Shared-prior interpretation: “notify all” means durable control-plane documentation inherited by future agents and maintainers; it does not mean a runtime broadcast, plugin event, or business-data write.
- `confirmed_by_user`: State Capsules is outside the user's current switching practice. This corrects current usage only and does not deprecate code or authorize data cleanup.
- `confirmed_by_user` + `confirmed_by_code`: Workspace Mount content snapshots are independently owned by `snapshotsById` / `snapshotOrderByTab`; restore creates a new Tab and fresh item IDs. Separately, `workspaceCapsuleBridge` exposes broad Workspace environment state. Current State Capsules capture persists active Tab/count, Tab/item collapse, paradigm-mount collapse, pinned scroll and `visibleUiState` (including `showSnapshotPanel`), but omits provider fields `tabOrder` and keyword-drawer expansion; restore remains compatible when legacy state already contains them. It does not call content-snapshot create/restore/delete.
- `confirmed_by_code`, bounded scope: the current Repository Dev, Mirror and proven Runtime code surfaces contain no direct external consumer of those Workspace Snapshot methods or storage keys. This is not a global absence claim.
- `confirmed_by_code`, synthetic only: an 8-Tab / 256-item / 8-snapshot fixture attributed `176,965 / 550,202` serialized bytes (`32.16%`) to snapshot fields. No real business JSON was read, and no production speed claim follows.
- `inferred`: Workspace Snapshot is a layered retirement candidate—retire active/default creation first, preserve old fields read-only, then inventory and explicitly decide archival/deletion. Real snapshot existence and retained user value remain `unknown`.
- Updated shared surfaces: `plugins/state-capsules.md`, `plugins/workspace-mount.md`, `contracts.md`, `unknowns-register.md`, `log.md`, `../framework/question-map.md`, and `../framework/maintenance-log.md`.
- Safety: no plugin, Runtime, Dev, Mirror, bridge, API, schema, UI contract, or business/environment data was changed. Backup: `state/backups/workspace-snapshot-retirement-framework-20260903-105449/`.
- User correction and performance refinement: removing only State Capsules-side Workspace calls reduces explicit save/switch work, which is rarely incurred if capsules are unused. Workspace Mount itself still starts a roughly two-second watchdog/heartbeat and publishes a deep-cloned bridge state after every successful data update. A synthetic no-subscriber scaling probe measured p50/p95 publication time of `0.1214/0.1997 ms` at 256 items, `0.4732/0.7123 ms` at 1,024, and `2.2099/2.8127 ms` at 4,096; this is current-bundle synthetic evidence only. The preferred first candidate is therefore a paired retirement of this specific environment bridge on both sides while preserving independent content Snapshot behavior and legacy capsule fields. Real-host benefit remains `unknown`.

## 2026-09-03 - Repository Dev Workspace Active Bridge Retirement

- `confirmed_by_user`: State Capsules no longer controls Workspace Mount state switching; intentional control is now the passive API model.
- `confirmed_by_code`: Repository Dev removes the Workspace-specific active BUS transport on both sides—State Capsules capture/apply/verify/retry/stats and Workspace Mount registration/lease heartbeat/watchdog/queued apply/mutation publication. The four modified Dev assets exactly match the independently verified staging candidate and pass syntax plus dual-bundle isolation checks.
- Preserved boundaries: `window.__workspaceMountPluginApi.getBridge()` / `ensureBridge()` still returns the live direct bridge for deliberate `getState()` / `applyState()` calls; the generic BUS and its one-time initialization remain; Workspace content Snapshot behavior is unchanged; legacy capsule `workspaceMount` payloads round-trip as deep-cloned, read-only inert data.
- Deployment boundary: Actual Runtime and Repository Mirror remain on the earlier active bridge hashes. No Runtime/Mirror files or business/environment JSON were written, and no real-host performance or loaded-UI claim is made.
- Bayesian update: `supersedes + refines` the earlier Repository Dev candidate only. Content Snapshot disposition remains an independent active unknown.
- Trace: `change-records/2026/2026-09/20260903-121700-workspace-active-bridge-retirement-staging.md`; framework backup `state/backups/workspace-active-bridge-retirement-framework-dev-20260903-123500/`.

## 2026-09-03 - Workspace Active Bridge Runtime/Mirror Deployment

- After the user explicitly confirmed deployment, the verified Repository Dev `main.js` and `README.md` for Workspace Mount and State Capsules were synchronized to the proven Actual Runtime and Repository Mirror.
- Dev/Runtime/Mirror align 12/12 on the four target hashes. Six syntax checks, the dual-bundle harness and static passive-API/generic-BUS/content-Snapshot/legacy-field sentinels pass.
- Thirteen business/environment/diagnostic/backup denylist sentinels and eighteen non-target styles/manifest/versions sentinels remained byte-identical. No JSON, Snapshot data, plugin registry or setting was copied or written.
- Runtime enablement evidence: Workspace Mount is enabled; State Capsules is disabled. Deployment is therefore static/hash verified, not a loaded State Capsules smoke result. Reloaded Workspace UI and real-host performance remain `unknown`.
- Bayesian update: `no_model_change`; this raises deployment confidence without changing the passive-control contract or content-Snapshot ownership.
- Trace: `change-records/2026/2026-09/20260903-143500-workspace-active-bridge-deployment.md`; backup: `state/backups/workspace-active-bridge-deploy-20260903-141500/`.

## 2026-09-03 - Repository Dev Collection Active Bridge Retirement

- `confirmed_by_user`: Collection Card should expose deliberate passive API control instead of proactively broadcasting environment/UI state.
- `confirmed_by_code`: Collection Repository Dev stops State Capsules cache/host updates, generic BUS host registration/unregister, legacy global bridge publication, and scroll/render-time bridge-state cloning. State Capsules stops Collection capture/path resolution/apply/queue/verify/warning/writeback.
- Compatibility: `window.__collectionCardViewPluginApi` and passive live bridge remain; exact multi-host resolution fails closed, including stale serialized state after retarget. New capsules write `{}` and old unknown `collectionCard` keys deep-clone round-trip as inert history. Passive apply writes no business JSON; GTD and generic BUS implementation are unchanged.
- Evidence: four Dev targets equal the verified candidate, syntax/harness pass, byte backup and rollback are complete, and the post-change verifier returned `PASS` with P0/P1 zero.
- Boundary: Actual Runtime and Repository Mirror remain on control hashes; real-host benefit and loaded behavior remain `unknown`. State Capsules is disabled in Runtime.
- Bayesian update: `supersedes + refines` the Collection active-bridge prior for Repository Dev only.
- Trace: `change-records/2026/2026-09/20260903-152245-collection-card-active-bridge-retirement-dev.md`; backup `state/backups/collection-card-active-bridge-retirement-dev-20260903-151929/`.

## 2026-09-03 - Collection Active Bridge Runtime/Mirror Deployment

- After explicit user authorization and an independent preflight `ALLOW`, exactly eight allowlisted `main.js` / `README.md` destinations for Collection Card and State Capsules were synchronized from verified Repository Dev to Actual Runtime and Repository Mirror.
- Dev/Runtime/Mirror target hashes align 12/12; syntax passes 6/6; the no-write dual-bundle harness passes; all 55 protected sentinels remain byte-identical.
- Collection is enabled and State Capsules remains disabled. This is static deployment evidence only; loaded-host behavior and real-vault performance remain open.
- No GTD, Workspace Mount, generic BUS implementation, business JSON, Snapshot data, settings, registry, style, manifest, version, diagnostic, backup or other plugin file was written.
- Bayesian update: `no_model_change`; FW-021 advances from deployment-pending to reload/smoke/performance-pending.
- Trace: `change-records/2026/2026-09/20260903-182900-collection-card-active-bridge-deployment.md`; backup `state/backups/collection-card-active-bridge-deploy-20260903-180815/`.

## 2026-09-04 - Repository Dev Workspace Lightweight Active Tab Switching

- `confirmed_by_code`: ordinary Workspace active-Tab selection now stays in view environment state, requests best-effort Obsidian layout persistence, and rerenders only active-dependent regions. It performs zero owner JSON read/write, zero carrier dirty event and zero complete Workspace render.
- Transaction boundary: genuine content mutations keep the existing owner queue/write/event path and carry the live Tab without allowing stale queued commits, source switches, peer hosts or same-Tab clicks to overwrite newer intent.
- Lifecycle evidence: source-scoped generation overlays, Tab/generation scroll guards, per-host selection preservation and missing-anchor full-render fallback close the reload, A→B→C, multi-host and source-A/source-B races found during independent review.
- Snapshot and API boundary: content Snapshot storage/schema/create/preview/restore/delete are unchanged; the existing Snapshot panel remains an active-region renderer. Passive global/bridge API names and boolean behavior stay compatible; no bridge, timer or cross-plugin write was added.
- Evidence: frozen candidate and Repository Dev align at `CF1457EAE9AA0372B5964999CF8BA5CD1088EAB52CD9FA6BAC71869EB4BF52E4`; syntax and `19/19` deterministic tests pass; post-Dev independent verifier returned `PASS` with P0/P1 zero.
- Deployment boundary: Actual Runtime and Repository Mirror remain at `CF97B6077B9AE66FEC494FE7CB9A77B2890CF559C19A287B686634E48C2111C6`. No Runtime/Mirror, business JSON, Snapshot data, settings or registry was written; deployment still requires explicit confirmation.
- Bayesian update: `refines` the environment-state/owner-transaction boundary. Real-host latency and loaded UI behavior remain `unknown`.
- Trace: `change-records/2026/2026-09/20260904-011900-workspace-mount-active-tab-fastpath-dev.md`; framework backup `state/backups/workspace-mount-active-tab-framework-20260904-012235/`.

## 2026-09-04 - Workspace Lightweight Active Tab Runtime/Mirror Deployment

- After explicit user confirmation and an independent `PASS / ALLOW` preflight, the verified Repository Dev Workspace Mount `main.js` was synchronized to exactly Actual Runtime and Repository Mirror.
- Runtime/Dev/Mirror align at `CF1457EAE9AA0372B5964999CF8BA5CD1088EAB52CD9FA6BAC71869EB4BF52E4`; syntax passes 3/3, the deterministic active-Tab suite passes 19/19, and active-transition, active-section, view-persistence, Snapshot, passive-API, owner-transaction and carrier-event sentinels remain present.
- `styles.css`, `manifest.json`, `README.md`, business JSON, Snapshot data, settings, registry, diagnostics and other plugins were outside the write set. Their recorded before/after fingerprints remained byte-identical.
- Workspace Mount is enabled in the proven Actual Runtime vault, but no reload command was issued. This is static/hash verification only; loaded-host layout persistence, rapid-switch behavior and real-vault latency remain `unknown`.
- Bayesian update: `no_model_change`; deployment strengthens the already established active-Tab environment-state contract.
- Trace: `change-records/2026/2026-09/20260904-014000-workspace-mount-active-tab-deployment.md`; backup `state/backups/workspace-mount-active-tab-deploy-20260904-013500/`; post-deployment verifier `PASS`, P0/P1/P2 zero.
- 2026-09-04: Collection Card active-Tab performance investigation landed under `FW-023`. User practice confirms long stalls on normal and Operation Context Primary Key Tab clicks. Code evidence confirms both changed paths converge on whole-model persistence and full view reconstruction; the current 63 visible keyword assignments produce exactly 64 synchronous Project Overview key projections per keyword-index rebuild, plus an async refresh that may rebuild all grouping modes after the provider's 30-second cache expires. Actual-scale aggregate statistics and repeated microbenchmarks rank repeated provider projection and full DOM work above JSON mechanics, but loaded-host causal attribution remains unknown. First candidate is one provider snapshot per keyword-index rebuild followed by an ordinary partial-switch path with zero provider refresh/write/event/full-shell render. Explicit reveal semantics remain protected. Bayesian update: `refines + adds_unknown`; no plugin/runtime/business data changed.
- 2026-09-04: Collection Card active-Tab Phase 1 landed in Repository Dev after independent `PASS`. Ordinary and Context Primary Key selection now avoid owner writes/events and reuse the current Provider-key cache; same-Tab ordinary click is a no-op, and a full keyword-index rebuild uses one sync snapshot plus first-match-preserving maps. The deterministic matrix covers reload/reopen, dual host/source retarget, pending and failed Provider recovery, duplicate keys, relation focus, scroll and preview lifecycle. The 20-switch actual-scale-shape ledger changes writes/events/sync/async Provider calls from `20/20/1280/20` to `0/0/0/0`, while full-shell render remains `20`; therefore partial rendering and loaded-host measurement stay open. Dev is `8CEA7E6...2575`; Runtime/Mirror remain `86FA2AC...F7C13`. No business JSON or stylesheet was written. Bayesian update: `refines + no_model_change`.
- 2026-09-04: After explicit user confirmation and fresh deployment verifier `ALLOW`, Collection Card Phase 1 `main.js` was synchronized byte-for-byte from verified Repository Dev to proven Actual Runtime and Repository Mirror. All three roles align at `8CEA7E6...2575`; syntax 3/3, the expanded Phase 1 matrix and the earlier bridge/passive API regression pass. Protected sentinels are 14/15 byte-identical and both business sidecars are unchanged. The actual vault enablement file was concurrently rewritten after baseline; it remains valid with 58 ids and `collection-card-view` enabled exactly once, and was not a deployment target, so causality is not inferred. Mirror's pre-existing stylesheet divergence was preserved. This is static deployment only: the loaded Obsidian process has not been reloaded, full-shell render remains, and real-host latency is still unknown. No business JSON, sidecar, style, manifest, README, versions, enablement or other plugin was written by the deployment. Bayesian update: `reinforces + no_model_change`.
- 2026-09-04: Mandala Repository Dev now aligns both goal/project selected-week summaries with the corresponding final Effective Operational Context Key snapshots and adds independent read-only `查看已不追踪 / 归档` modes. The editable set is observation-bounded (`retained rows for the selected week ∩ current final snapshot`); archive rows do not enter dirty readers or saves. Snapshot failures fail closed, rejected summary saves restore dirty, and weekly print reuses one snapshot per domain across summary and execution-plan sections. Candidate independent review and Dev tests pass; Runtime/Mirror remain on the prior hash pending explicit deployment. Bayesian update: `refines + no_model_change`; FW-018/FW-019 become consistent across all Mandala weekly forward-work surfaces.
- 2026-09-04: After explicit confirmation and a fresh `PASS / ALLOW` deployment preflight, only Mandala `main.js` was synchronized to proven Actual Runtime and Repository Mirror. Runtime/Dev/Mirror align at `C57136B...DFD00`; syntax 3/3 and both focused regression families pass for all three deployed byte sets, while 22/22 protected non-target/business files remained unchanged. This is static deployment only: the running Obsidian host was not reloaded, so goal/project weekly-summary filtering, independent read-only archive toggles and print parity still require loaded-host UI smoke. Bayesian update: `reinforces + no_model_change`.
- 2026-09-04: After explicit confirmation and a fresh `PASS / ALLOW_DEPLOYMENT` preflight, SuperMemo Concept Display compact meaning-capsule engine/styles/README were synchronized to proven Actual Runtime and Repository Mirror. Runtime/Dev/Mirror align at `50CF1037...F0431`, `F1CF4272...70190`, `088ADD71...303E`; both isolated deployed-byte probes pass syntax plus four suites, and 13/13 protected registry/business/non-target sentinels remain unchanged. No localStorage or owner/EVA/Keyword data was written. Static deployment does not prove the loaded host; wide/medium/narrow density, keyboard, exact body reveal and source action remain smoke-test pending. Bayesian update: `reinforces + no_model_change` for FW-004.
- 2026-09-15: SuperMemo meaning projects now distinguish historical absence from an explicit unassigned membership. `一般构型义胶囊` is parallel to project pages; a new unambiguous Meta mount starts with no page selected and remains discoverable in `全部义胶囊`. Missing legacy membership still projects to the general page without migration. Repository staging is verified; Runtime/Dev/Mirror remain unchanged pending explicit deployment. Bayesian update: `refines`; no owner/schema/protocol/Question Map change.
- 2026-09-15: After explicit deployment confirmation, SuperMemo's verified unassigned-Meta engine was synchronized to Actual Runtime, Dev and Mirror at `18B5C648…2CCF`. Role-isolated syntax/meaning-project probes pass and non-target program sentinels remain byte-identical. The deployment copied one engine file and wrote no business data; loaded Obsidian Meta/UI smoke remains pending. Bayesian update: `reinforces`; no model change.

- 2026-09-20: Reviewed ordinary SuperMemo Concept capsule multi-page requirements against the existing Antinet meaning-page design. User confirmed multi-membership and one shared subject-tree assignment. Added a clearly implementation-pending section to plugins/supermemo-concept-display.md, separating confirmed intent/current code from proposed membership/projection/identity/delete/import/export rules. No plugin or business-data changes. Independent review PASS; Bayesian label refines.

- 2026-09-20: Ordinary SuperMemo Concept multi-page implementation verified in repository Dev/Mirror, runtime deployment pending. StableId-based multi-membership projects one global hierarchy/tree assignment; added page owner, v3 bundle and delete/import recovery. Five test suites and independent review PASS; browser preview uses synthetic data. Framework/Atlas update: updated; evidence_status: confirmed_by_code; Bayesian label: refines; FW-004 unchanged. Trace: change-records/2026/2026-09/20260920-supermemo-concept-pages-implementation.md.


## 2026-09-20 Concept pages deployment
User explicitly confirmed “请部署”. Verified current sole-open runtime vault and unchanged baselines; copied only the independently reviewed engine/styles patch. Runtime/Dev/Mirror SHA-256 now agree; syntax and five isolated deployed-byte suites PASS. Protected runtime files unchanged. No business JSON, localStorage, settings or other plugin code written. Loaded-host smoke awaits plugin reload. Backup and full three-role hashes: D:\han\学习的文件夹\8- 自己的系统设计与开发\卡片对话式工作流\agent-end-to-end-blog-writing-main\state\backups\supermemo-concept-pages-deploy-20260920-064546. Framework/Atlas update: updated; evidence_status: confirmed_by_code; Bayesian label: reinforces + no_model_change.

## 2026-09-23 对话绘图：用户否定四列，按原分组语义修订；扩槽并调整端口，保存短线和缩放验证。Atlas工作流/Hub页已更新，Framework entry/registry登记Skill与工作流，FW-009/宏观模型不变。Skill仓库源已创建，未全局安装；插件仍staging。工程记录：20260923-dialogue-groups-spacing-skill.md。

## 2026-09-23 用户确认后发布对话布局：Hub main/styles/slot、Registry main/README同步三边，全局dialogue-graph-drawing两文件安装，共17目标。6完整目录仅allowlist变化、业务数据/启用配置不变；未自动reload，native验收待完成。发布记录：memory/obsidian-plugin-system/change-records/2026/2026-09/20260923-145734-dialogue-layout-publication.md。

## 2026-09-23 对话图稿原位显示修正：固定拓扑/几何与live原生详情分开，点击同ID节点/边/组复用原面板与明确owner动作；无弹窗，新增内容不进图稿。Atlas workflow/Hub、仓库Skill已更新；全局Skill与runtime尚未发布。Framework入口/Question Map不变，既有FW-009继续覆盖。


## 2026-09-23 原位对话布局已部署
用户明确“好，请部署”后，同步 Hub main/styles 三边与全局绘图 SKILL.md，共7文件；已保存槽位、业务数据、Registry与启用配置不变。固定图稿与原生实时详情同界面；候选独立核查、部署哈希和37个直接插件文件清单核对通过，发布后独立复核另记。备份：state\backups\dialogue-inline-publish-20260923T073114Z。工程记录：memory\obsidian-plugin-system\change-records\2026\2026-09\20260923-153400-dialogue-inline-publication.md。Framework/Atlas update check: updated；confirmed_by_user + confirmed_by_code；reinforces + no_model_change；FW-009及入口不变。尚未重载原生 Obsidian。


## 2026-09-23 凹形自动布局可绘制性修复（候选）
观察：用户报告边界角接触失败；当前28节点/11组复现。claim：生成器必须预先约束读图器拒绝的自碰角/拐角上限，保留独立验证。Atlas Hub页及工程记录更新；固定对话槽位与UI不改。Framework/Atlas update check: updated；confirmed_by_user + confirmed_by_code；corrects + no_model_change；Framework入口/Question Map和绘图Skill无需修改，现有流程覆盖算法修复。Trace: memory\obsidian-plugin-system\change-records\2026\2026-09\20260923-170925-concave-boundary-rescue.md。最终审查/新补丁部署确认待完成。


## 2026-09-24 凹形算法修复已部署
用户明确确认后，两个凹形helper同步三边共6文件；52个插件直接文件清单仅白名单变化，main/UI、其它算法、已保存图稿、业务数据和启用配置不变。实际Runtime helper隔离计算约8.4秒通过原父级校验，硬冲突0，普通交叉仍有；未应用到真实图。下次自动布局启动新helper读取修复，无需替换main。备份：D:\han\学习的文件夹\8- 自己的系统设计与开发\卡片对话式工作流\agent-end-to-end-blog-writing-main\state\backups\concave-rescue-publish-20260923T161422Z。工程记录：memory\obsidian-plugin-system\change-records\2026\2026-09\20260923-171700-concave-rescue-publication.md。Framework/Atlas update check: updated；confirmed_by_user + confirmed_by_code；reinforces + no_model_change；既有入口/Question Map/Skill未改。原生点击验收待完成。
# 2026-09-27 ATOM sidebar role addition

Update label `extend`, statuses `confirmed_by_user` / `confirmed_by_code`. Added `plugins/atom-note-sidebar.md` and index entry: full eligible ATOM set, Dataview-owned field semantics, bounded virtual DOM, main-note explicit reveal, no business writes. Existing mermaid-floating-widget old-note dependency is preserved, not implicitly migrated. Repository tests and independent final review pass; NEWERA deployment/loaded smoke pending. Repo-local Obsidian Skill applied; Framework ownership rules unchanged. Trace: `../change-records/2026/2026-09/20260927-atom-note-sidebar.md`.


## 2026-09-27 ATOM sidebar deployment
User approved deployment. Four reviewed files installed in NEWERA and repo mirror, all three-way SHA256 equal; only atom-note-sidebar appended to fresh enablement list. Backups and deployment-result.json: state/backups/atom-sidebar-deploy-20260927. Framework model unchanged; loaded runtime/UI/hotkey smoke pending, no claim of restart.


## 2026-09-29 EVA relation editor performance — Framework landing

Framework/Atlas update check: `updated`; update_type: `refines`. [Plugin page](plugins/eva-cross-view-relations.md) distinguishes historical pre-deployment audit from deployed code, session-local search caching from persistent recovery drafts, and function/mock-host evidence from native acceptance. [FW-011](../framework/question-map.md) and [Framework maintenance log](../framework/maintenance-log.md) now point to this evidence and remaining native validation. Source status: user symptom `confirmed_by_user`, implementation `confirmed_by_code`, real-host latency `unknown`. Existing deployment record: [20260929-eva-editor-performance](../../../REFERENCE_BOUNDARIES.md#ref-143)（外部来源未随包提供）. No new Atlas page, public contract or Skill rule; no runtime/business data write in this landing.


## 2026-09-29 Keyword external reveal performance audit

Update check `updated`; label `refines`. [Keyword page](plugins/keyword-index-plugin.md) now records the user's cross-view jump delay, code-level repeated load/render and hidden drawer generation, click-only context calculation, and bounded mock-host/function evidence. Proposals remain `inferred`; native improvement is `unknown`. [FW-011](../framework/question-map.md) points to the evidence; no plugin code, business data or Skill rules changed. [Record](../../../REFERENCE_BOUNDARIES.md#ref-144)（外部来源未随包提供）.

- 2026-09-29: Keyword external reveal performance implementation deployed to proven NEWERA Runtime/Dev/Mirror after independent code review and regression checks. Navigation keeps a fresh read, eliminates duplicate first-open rendering, reuses eligible connected DOM, lazily creates closed drawer contents and derives Meta context on click. Full expanded note order/count, public inventory, BUS/SCON and cancellation checks pass in isolated Edge/Node tests. Native reload/timing remains pending. Framework FW-011 now requests that evidence; source facts remain in the Keyword plugin page. Bayesian update: `refines`; trace: [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-145)（外部来源未随包提供）.

- 2026-09-29: Keyword BUS quick-create diagnosis separates durable owner mutation from EVA publication and display completion. Unmodified-code/Map-IO reproduction shows five loads, two inventories and three refreshes for one view; the third refresh is after modal close. Stale modal claims of no index write are recorded. No runtime/plugin/data changes; native phase timings remain unknown. Atlas Keyword page and FW-011/Framework maintenance updated, `confirmed_by_code` + user symptom, Bayesian `refines`. [Documentation record](../../../REFERENCE_BOUNDARIES.md#ref-146)（外部来源未随包提供）.

- 2026-09-29: Keyword full-scan candidate uses bounded fresh concurrent reads with unchanged second-pass and transaction guards, shared manual feedback/single-flight, one successful EVA publication and callback-derived log count. Runtime deployment pending. Corrected the preceding BUS diagnostic: its mock refresh injected repository reads, so five loads is not a production count. Native key delivery and native speedup remain unknown. Update labels: refines/corrects. [Record](../../../REFERENCE_BOUNDARIES.md#ref-147)（外部来源未随包提供）.

- 2026-09-29: User approved deployment of the reviewed Keyword scan optimization. Proven active NEWERA runtime main.js now matches Dev/Mirror and staged candidate `e6cfd2a737a35dadd9979815eaa9d7c10080e91b56ded40061b267507ea36449`. Syntax/hash checks pass; no business-data/settings writes. Native reload/shortcut/timing pending. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-148)（外部来源未随包提供）.


## 2026-09-30 Daily review retained edit days and View Group entry

- observation: 用户要求创建与修改分开回看，并明确选择“保留每日修改记录”；入口位于 Ontology 下方。confirmed_by_user。
- update: refines daily-review evidence semantics and native-view ownership. Added [Daily Note Review](plugins/daily-note-review.md) and [View Group Hub](plugins/view-group-hub.md), plus index links. Daily owns a private metadata-only history journal; Hub remains environment-only.
- source status: confirmed_by_code from reviewed staged code and Node/Edge mock-host tests. Dev/Mirror landed; runtime not deployed. Native reload/restart and timing remain unknown; no historical editing completeness or manual-edit attribution claim.
- trace: [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-149)（外部来源未随包提供）; FW-011 and framework maintenance log. No Skill/schema rule or business-store ownership migration, no MemPalace mine.

- 2026-09-30: User confirmed Daily Review deployment. Eight reviewed Daily/Hub program files deployed to proven NEWERA, identical to Dev/Mirror; ten protected settings/history/data/program observations unchanged. Native reload remains pending. Framework/Atlas updated/refines, no ownership change. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-150)（外部来源未随包提供）.

- 2026-09-30: Keyword scan historical comparison corrects “old incremental” assumption: old scanner traversed all metadata cache entries; September fresh double-read path guarded permanent identities. Approved optimization now reuses session source contributions with invalidation/final guards, keeps full reconciliation and publication, adds full-fresh command and strict no-change owner-write skip. Deployed main bytes match three ways; native reload/timing unknown. Update refines/corrects, [Keyword page](plugins/keyword-index-plugin.md), [record](../../../REFERENCE_BOUNDARIES.md#ref-151)（外部来源未随包提供）.


## 2026-09-30 — Time-block capture native entry

Refined Mandala and View Group Hub plugin pages and native-view contract. User practice: records choose project/goal primary context; legacy nine-grid filters and technical source metadata leave capture UI. Code evidence: repository candidate and mocked-host tests. Runtime deployment/native acceptance remain pending. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-152)（外部来源未随包提供）.


## 2026-09-30 Time-block native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Mandala 0.1.9 and View Group Hub 0.2.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-153)（外部来源未随包提供）.


## 2026-09-30 Timeline collection cleanup and native group entry

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Refined Timeline and View Group Hub plugin pages/contracts: redundant collection projection removed; Timeline joins right-column second position. Source status confirmed_by_user for workflow and slowdown observation, confirmed_by_code for candidate behavior. Seven loader checks, 15 Edge mocked-host checks and existing Timeline/Hub regression support the candidate; native latency remains unmeasured.

Runtime installation is pending separate task-specific approval; loaded native UI/scroll/multiwindow and switching latency remain unverified. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-154)（外部来源未随包提供）.


## 2026-09-30 Timeline cleanup and grouped entry — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. Timeline 0.1.1 and View Group Hub 0.2.3 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-155)（外部来源未随包提供）.


## 2026-09-30 日课 native tab and performance boundaries

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

User requests Mandala 日课 in the grouped native tabs, with performance attention. Refined Mandala/Hub pages and contracts with native daily ownership, shared persistence/local UI boundaries, source protection, draft recovery and measured mock IO/render counts. Existing Timeline right-second entry and time-block entry are retained. Repository evidence is not native UI acceptance.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-156)（外部来源未随包提供）.


## 2026-09-30 日课 native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK请部署”. Mandala 0.1.10 and View Group Hub 0.2.4 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-157)（外部来源未随包提供）.


## 2026-09-30 Time-view performance and historical capture boundary

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

User confirmed that view-group prewarm provides good switching experience and acceptable initialization. Refined Mandala/Timeline/contracts with lazy capture detail paging, snapshot-only historical access, local committed projection and coalesced Timeline renders. User cutoff memory was checked against actual records (no post-cutoff legacy bindings found). Mocked tests establish bounded DOM work and ordering, not actual Obsidian speed measurements. Initial independent code review caught quick timestamp and concurrent range-save regressions; both received targeted tests and fixes.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-158)（外部来源未随包提供）.


## 2026-09-30 Time-view performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “Ok就请部署”. Mandala 0.1.11 and Timeline 0.1.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-159)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

User distinguishes execution-time tools (next action, Ontology, time blocks, daily lessons) from review/long-term planning tools (time framework, Timeline, Daily Note Review). Hub menu now expresses that distinction in three columns; left collection group stays intact. Existing prewarm is explicitly preserved. Original Hub behavior regression and mocked Edge wide/narrow visual checks passed; actual Obsidian styling/reload remains acceptance work.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-160)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. View Group Hub 0.2.5 are installed in the proven NEWERA runtime; the three changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-161)（外部来源未随包提供）.


## 2026-09-30 Keyword BUS post-confirm performance

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

User locates BUS latency after confirming creation. Read-only actual-data VM audit identifies three Keyword refreshes and awaited EVA projection/save; implementation removes duplicate UI work and one unchanged normalization pass, while retaining integrity checks. Existing persistence regression and targeted event/source/cache/failure tests pass. Mock timings exclude real filesystem writes, rendered DOM, native openFile and other plugin event fanout; no overall percentage or native speed claim. Runtime installation remains a separate approved step.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-162)（外部来源未随包提供）.

Failure refinement: if both creation refresh and final drain fail, retain the deferred invalidation outside released batch ownership; the next explicit refresh or EVA event retries it, with no repeated note creation.


## 2026-09-30 Keyword BUS post-confirm performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Keyword Index 0.1.22 is installed in the proven NEWERA runtime; the two changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-163)（外部来源未随包提供）.


2026-10-01: Weekly native page and headless PEO ordering implemented in repository candidates with independent code PASS. Observation: user sees ordering recover after opening PEO. Claim: old ordering provider depends on a live view, while effective eligibility is a separate cross-owner projection; source status confirmed_by_user + confirmed_by_code, update refines, affected questions FW-011/FW-019. No historical incident root asserted beyond evidence. Mandala/PEO/Hub contracts updated; runtime pending. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-164)（外部来源未随包提供）.


## 2026-10-01 Weekly native performance — approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this reviewed package with “请部署”. Mandala0.1.12, PEO0.1.6 and Hub0.2.6 main.js/manifest.json are installed in the proven NEWERA runtime. Program hashes match reviewed Dev/Mirror candidates. No business JSON/settings/index copied and no plugin reload triggered. Prior ownership and safety contracts remain; native UI/latency acceptance is still pending. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-165)（外部来源未随包提供）.


2026-10-01: User observed restart scan read 8552 / reuse 0 (confirmed_by_user). Session Map lifetime explains lack of restart reuse (confirmed_by_code). Keyword 0.1.23 repository candidate adds guarded disposable parsed-source persistence; Registry 0.1.3 classifies its exact path. Refines FW-011 and previous session-cache facts. Fifteen native filesystem fixture groups and nine scanner regression groups pass; native Obsidian timing unmeasured, runtime pending. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-166)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Keyword0.1.23 and JSON Asset Registry0.1.3 reviewed program/document bytes installed in proven NEWERA runtime. The first successful scan seeds the new cache; later ordinary scans may reuse unchanged sources across restart. Complete inventory/native proofs/identity/EVA work remains. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-167)（外部来源未随包提供）.


## 2026-10-01 Weekly source resolution correction

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: corrects

User observed Hub weekly source-note-unproven-configure-settings. Runtime Mandala source is configured and exists; Hub0.2.6 accidentally omitted weeklyTracking in three Mandala-specific branches. Hub0.2.7 includes weeklyTracking alongside timeBlocks/dailyLessons for getExpectedSourcePath, repair notice and select-time source checks. Mandala getTimeCaptureSourceNotePath remains source authority; saved Hub identities cannot override it. Missing owner source stays unavailable, wrong-source leaves/drafts remain retained pending explicit repair. This corrects the earlier weekly integration claim; no new schema, source discovery scan, Mandala change or business write. Node behavior regression passes; native reload pending. Framework/Atlas update check: updated, FW-019 consumer contract correction. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-168)（外部来源未随包提供）.


## 2026-10-01 Weekly source fix approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this repair package with “确认”. Hub0.2.7 main/manifest installed in proven NEWERA runtime. Weekly source lookup, repair notice and source-switch guard now share the Mandala owner path used by daily lessons/time blocks. Existing source note and business data remain unchanged; old leaves/drafts retained. No native reload or live UI acceptance claimed. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-169)（外部来源未随包提供）.


## 2026-10-01 Weekly tab switching refinement

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: refines

Mandala0.1.13 addresses user-reported four-tab switching lag. Shared legacy/native renderer skips clicking the already active tab; project rows and effective-key reads run concurrently and drain both on failure. Native host alone uses an exact-weekly-file read snapshot limited to one render, initialized after saves and discarded in finally or before write attempts. Repeated readers parse those bytes once and receive independent clones; final fresh disk evidence still rejects changes. No cross-render cache or PEO/Timeline eligibility/order cache. Legacy flush remains; native redundant base-render flush is skipped only for a truthy matching host token after the host flush barrier. Source-switch, CAS, old editor/recovery retention and real upstream lookups remain.

Native weekly recovery button is hidden when the current source has zero stored/in-memory recoveries and otherwise shows count. Recovery panels remain readonly/copyable and repeated opening replaces that panel. Render phase metrics contain tab/timings only (save barrier, initial read, page build, verification, commit); asynchronous textarea layout/paint is outside this metric. Node12 and Edge23 fixture checks pass, including previous safety regressions and scoped-read freshness/clone/write-error tests. No live-vault timing claim; full DOM rebuild and upstream model cost remain. Framework/Atlas update check: updated/refines FW-011 and existing save/source contracts; no authority/schema change. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-170)（外部来源未随包提供）.


## 2026-10-01 Weekly switching optimization approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “请部署”. Mandala0.1.13 main/manifest installed in proven NEWERA runtime. Native weekly page shares one render-scoped weekly read and skips an authenticated redundant flush; shared tabs ignore current-tab clicks and project reads drain concurrently. Recovery entry displays only when source-matched drafts exist, with count. Final disk verification, source guards and draft protection remain. No cross-render eligibility cache, business/settings copying, native reload or live speed claim. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-171)（外部来源未随包提供）.


2026-10-01: User requests Reference Graph Widget restart reuse (confirmed_by_user). Code confirms geometry already persistent, session parser/graph state previously ephemeral. Version0.1.1 adds bounded native-proof body evidence plus always-unverified graph previews; Registry0.1.4 exact classification. Refines earlier session-only fact and FW-011. Fixture verification completed; actual UI speed and runtime deployment pending. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-172)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Reference Graph Widget0.1.1 and JSON Asset Registry0.1.4 reviewed program/document bytes installed in proven NEWERA runtime. The first explicit graph use seeds the bounded restart cache; later openings may reuse unchanged parsed sources after native proof checks. Restored graphs are previews and rebuild current links/backlinks/EVA. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-173)（外部来源未随包提供）.


## 2026-10-01 整体工作流性能与未来新插件观测

source_status: confirmed_by_user; code observations are scoped in the workflow page
update: refines + adds_unknown

用户要求整体性能与扩展性，并澄清测试点应从未来新插件设计时考虑。新增 [主键到行动工作流](workflows/operational-context-to-next-action.md)，资格引用 canonical，有界观测方法路由到 repo-local Skill。行动台已提交但刷新失败是用户观察；8秒来源等待与三次刷新是代码事实，近期优化导致退化仍 unknown。未给现有插件插桩或部署。 [工程记录](../../../REFERENCE_BOUNDARIES.md#ref-174)（外部来源未随包提供）。


## 2026-10-07 大千统一内核入口补录

observation: 用户询问 Atlas/Framework 是否已更新并授权继续开发。
prior: Atlas schema/index/system-map/contracts/unknowns/glossary/aliases；Framework entry-index/update-protocol/registry/question-map。
claim_change: confirmed_by_user 原则、confirmed_by_memory 已审设计、confirmed_by_code 窄源码证据分别登记；未来目标 inferred、实际迁移 unknown。
update_type: refines / reinforces / adds_unknown
targets: 新统一内核过渡页、9 导航/契约/问题/日志；FW-025 和 DQ-U01/02/03。
backup_path: state/backups/daqian-p4b1-landing-20261007-082331
preflight: results/daqian-unified-core-20261006/p4/native-foundation/p4b1/preflight-review-v2.md（PASS，必修0；只批准仓库计划）。
final_review: pending implementation and landing review
engineering_record: 本轮最终工程账将记录于 change-records/2026/2026-10，暂不引用尚不存在的 PASS。
rules_skills: 不改；glossary/aliases 已核对无新 canonical 术语。MemPalace 未 mine。
不改现行 owner/API/真实业务/runtime，不重写旧来源；长期补录不表示 native 实施。


## 2026-10-07T16:04:36.479277+08:00 P4-B1 仓库证据回填完成

update_type: refines / reinforces；source_status: confirmed_by_code（限定仓库）。
claim: 单U01 repository foundation 独立核查通过；实际原owner/native/迁移仍未开始。
evidence: results/daqian-unified-core-20261006/p4/native-foundation/p4b1/source-manifest-v9.json；implementation-review-v2.md（SHA 247895e350b9670b8c6e79633bc6ab9915adfd1c48bf5962999658e713a5c076）；Node62/62、独立边界37/37，0fail/cancel/skip。
backup_path: state/backups/daqian-p4b1-final-longterm-20261007-160436
engineering_records: memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-160436-daqian-p4b1-atlas-framework.md；memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-160436-daqian-p4b1-repository-foundation.md
targets: 统一内核过渡页+两维护日志；9既有长期prefix保留、FW-025/DQ-U01/02/03继续active。
prior pending与旧初审/失败不改；Skill/规则/glossary/aliases未修改；MemPalace未mine。



## 2026-10-07T17:20:20.863969+08:00 P4-B2 第一批源码入口保护证据

update_type: refines / reinforces
observation: 用户要求继续推进统一内核开发。
prior: 已审P4-A设计及B1合成基础；六原owner实际业务仍未移交。
claim_change: 六main固定hash编译、20来源探针（14原方法/1受控timer/5片段）、17组Node回归通过，独立实现v2 PASS/必修0；2初审finding已修复。三个原onload存在UI替身缺口，未知任务排空/创建幂等/held资格/U01正式投影仍未完成，B2/P4整体in_progress，migration not_started。
evidence: results/daqian-unified-core-20261006/p4/native-foundation/p4b2/implementation-review-v2.md；source-manifest-v2.json；source-probe-report-v2.json；integration-tests-v2.tap；independent-impl-evidence-v2.json。
backup_path: state/backups/daqian-p4b2-longterm-20261007-172020
engineering_record: memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-172020-daqian-p4b2-readonly-entry.md；memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-172020-daqian-p4b2-atlas-framework.md
targets: 统一内核页现状句/B2行/限定新段，两维护日志追加；Framework大日志先staging和prefix验证后复制。
unchanged: 原source/UI/CSS/命令、B1、其他长期页、FW-025/DQ-U01/02/03问题状态；规则Skill/glossary/aliases不改，MemPalace未mine。NEWERA和实验库本轮访问0；本证据不授予native激活/迁移。


## 2026-10-07T18:28:24.417098+08:00 | 大千 B2 第二批服务

update_type: refines / reinforces

P4-B2第二批可靠创建与持有式资格服务仓库候选已独立PASS、必修0；26项回归通过。六个独立owner存储共用提交队列，创建按固定身份及回执恢复，资格持有至Action确认。原Workspace/PEO/GTD主流程尚未接线，U01正式投影和完整输入排空待完成；B2/P4仍进行中，未部署、未迁移，两实际库本轮IO0，原视图不变。

先持久化创建plan/完整intent/固定ID，各owner业务与回执同journal确认；phase落后查原回执，重复编号或名称不合并。共同broker持有资格直到Action witness确认，受控失效排队，disconnect立即冻结。确认可查询不等于可续写；残留lease、unknown、崩溃broker不自动清锁。只有正常close后可重开写；健康锁中的已确认Action可显式对账，未确认grant保留输入并阻塞。

六owner为新协议存储，不是原插件已移交；单U01存储槽位不等于U02业务迁移。GTD tag/keyword/Markdown、完整追踪、U01正式投影及原主流程仍未接线。FW-025与DQ-U01/02/03继续active。MemPalace仅fallback查询未mine；不新增研究卡。

review: results/daqian-unified-core-20261006/p4/native-foundation/p4b2-services/implementation-review-v2.md
manifest: results/daqian-unified-core-20261006/p4/native-foundation/p4b2-services/source-manifest-v2.json
backup_path: state/backups/daqian-b2-services-longterm-20261007-182824
engineering_record: memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-182824-daqian-p4b2-services-atlas-framework.md

下一步：继续B2：U01正式读写投影与完整输入/任务排空适配；再接C原Workspace/PEO和D原GTD主流程。先核对冻结源并形成可核查适配草案，保留原视图/身份/备注/历史。当前服务仅仓库候选，不自动安装或迁移；NEWERA不访问不修改。


## 2026-10-07T19:39:52.851315+08:00 | 大千B2第三批native投影

update_type: refines / reinforces

P4-B2第三批原Collection/NAW/Workspace完整结构编辑器已接仓库native持久投影，31项测试（17原流程+14新边界）通过，独立实现PASS/必修0。注册入口有受保护关闭及恢复日志；原UI/adapter/44依赖字节不变。Workspace主视图/PEO/GTD尚未接线，全旧writer排空与实际移交待完成；B2/P4进行中、未部署/迁移，两实际库IO0。

完整七源通过原schema5 reducer构建新genesis；读写经NativeStore根登记、journal/witness和原请求回执。受保护关闭延迟owner退休，保存原完整编辑器最后草稿；失败输入另存recoveryLog不冒充正式成功。恢复记录已确认但残留lease报告durable但frozen并附回执；unknown不能再持久化时明确memory_only拒关闭。没有自动清锁/强制重开。

仅注册三入口的仓库持久适配；Workspace完整结构编辑器不等于主视图，NAW不是GTD。U02 SetContextFields仍拒绝，缓存label不授予资格；trackingComplete/readyForHandoff=false。真实DOM/宿主卸载、性能收益、生产迁移未验。FW-025/DQ-U01/02/03保持active；MemPalace fallback查询未mine，0研究卡/CARD不改。

review: results/daqian-unified-core-20261006/p4/native-foundation/p4b2-projection/implementation-review-v2.md
source_manifest: results/daqian-unified-core-20261006/p4/native-foundation/p4b2-projection/source-manifest-v3.json
backup_path: state/backups/daqian-u01-projection-longterm-20261007-193952
engineering_record: memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-193952-daqian-u01-projection-atlas-framework.md

下一步：推进C：按原Workspace/PEO调用链形成U02完整身份与独立声明字段适配，接可靠创建/资格服务并补对应旧writer及输入排空；随后D接GTD完整project/tag/keyword/Markdown流程。原视图保留，U01三入口仓库投影已实现，不自动安装或迁移；NEWERA不访问不修改。


## 2026-10-07T20:23:20.083842+08:00 | P4-C1 existing-project boundary

source_status: confirmed_by_code / confirmed_by_memory; update_type: refines / reinforces

P4-C1已有项目适配候选完成：原Workspace项目列表读取、原PEO备注及停用/恢复方法已在仓库适配层验证；独立声明字段和导航按完整来源身份读取。17项测试通过，F1无变化请求回执缺口修复后独立PASS。不是完整原界面接线；C/P4仍进行中。 七个仓库repoctx身份与完整membership.primaryRef保留，不替代观察器或生产ID；U02是独立隔离候选，尚未和U01统一装配。原UI/CSS不改；真实创建、实时追踪资格、metadata modal/事件接线、全旧writer排空、GTD完整流程和原生验收仍未完成。trackingComplete/readyForHandoff=false；两实际库IO0，未部署/未迁移。
证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-workspace-peo/implementation-review-v2.md；工程记录：memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-202320-daqian-p4c-atlas-framework.md。FW-025/DQ-U01/02/03保持active；无MemPalace mine。


## 2026-10-07T21:01:21.598770+08:00 | P4-C2 creation and atomic metadata

source_status: confirmed_by_code / confirmed_by_memory; update_type: refines / reinforces

P4-C2原创建与元数据适配完成：同一U02候选已接原Workspace创建方法，固定请求身份，原PEO重要性读写及名称/声明/重要性原子提交；输入控制器保留关闭和保存竞态中的草稿。38项测试通过（C1原17+C2新增21），F1/F2修复后独立PASS。C/P4整体仍进行中。 只在仓库方法适配层验证，原插件/UI/CSS不改；新项目memberships为空且actionable=false。原生DOM/元数据modal/事件BUS、完整多owner创建、实时追踪资格、全旧writer排空、U01/U02统一装配及GTD仍待完成。repoctx不替代生产或观察器ID；仅支持有冻结证据的单项目PEO分组，不声称实时EVA分组已验证。trackingComplete/readyForHandoff=false；NEWERA与实验库IO0，未部署/迁移。
证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-provisioning/implementation-review-v2.md；工程记录：memory/obsidian-plugin-system/change-records/2026/2026-10/20261007-210121-daqian-p4c2-atlas-framework.md。FW-025/DQ-U01/02/03保持active；无MemPalace mine。


## 2026-10-07T23:28:54.556198+08:00 | P4-C3追踪与资格证据

P4-C3原追踪方法与资格证据适配完成：同U02持久化原Mandala启用/停止/恢复，原资格聚合读取Workspace、PEO独立声明及追踪证据；55项测试通过（原38+新增17），独立实现核查PASS。

仅仓库候选方法验证，原数据样本无周追踪；首次显式命令才建立空v3追踪数据，不由membership缓存推断。calendar=utc-v1为仓库确定性回放，不等于真实Obsidian本地moment；原UI/CSS/源码不改。qualificationEvidenceAttached=true，但actionWriteAuthorized/heldGrantAttached/liveTrackingAttached/fullUIAttached/trackingComplete/readyForHandoff=false。U01/U02未统一装配，生产数据/完整创建/旧writer排空/GTD未完成；NEWERA与实验库IO0，未部署/迁移，C/P4仍进行中。

下一步：继续P4-C：先统一U01/U02行动与身份写入权威，把资格持有到行动提交；再接原UI/provider/事件与对应writer及输入排空，验证真实宿主日历；随后P4-D完整GTD。C1/C2/C3仓库方法不重复开发，不自动安装迁移，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-tracking/implementation-review-v1.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-tracking/tests-v1.tap；results/daqian-unified-core-20261006/p4/native-foundation/p4c-tracking/source-manifest-v1.json。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改。既有P4A审计缺口保留，不报全库全绿。MemPalace bounded fallback，无mine。


## 2026-10-08T00:18:56.872737+08:00 | P4-C4共同权威与行动提交

P4-C4共同权威与行动提交仓库候选完成：fresh combined session以单journal/FIFO串联U01/U02，原Mandala资格经完整身份绑定至原Collection创建，条目与membership link一次确认。当前仅一个有完整证据的既有membership/tab绑定；25项测试通过，独立核查PASS。

六个新增组装文件，旧U01/U02/C3候选保持冻结，不自动adopt旧session或迁移业务。共同版本投影与权限/代际检查在异步后及最终sink复核；unknown/残留lease冻结，新写不能绕过保留ID/回执。原Workspace结构编辑器关闭恢复已仓库验证；U02权限撤销后有未决请求时恢复关闭也会拒绝，保留owner/pending，需恢复权限后关闭；其他项目绑定与完整创建、原主视图/provider/event、全writer排空、真实周数据/moment日历、完整GTD仍未完成。combinedAuthority/heldActionCommit仅仓库限定true；fullUIAttached/realObsidian/trackingComplete/readyForHandoff=false。NEWERA/实验库IO0，未部署，C/P4进行中。

下一步：继续P4-C：为其余项目补完整身份membership/carrier绑定及完整创建链路，再把原主视图/provider/事件接入共同权威并验证旧writer与输入排空、真实宿主日历；之后P4-D完整GTD。C1至C4已验仓库方法不重复开发；不自动安装迁移、不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-authority/implementation-review-v1.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-authority/tests-v2.tap；results/daqian-unified-core-20261006/p4/native-foundation/p4c-authority/source-manifest-v1.json。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改。既有P4A审计缺口保留，不报全库全绿。沿用C3 MemPalace bounded fallback证据，本轮无mine。


## 2026-10-08T00:46:36.751423+08:00 | P4-C5身份关联与载体准备

P4-C5身份关联和Workspace/Collection载体准备仓库候选完成：18项新增测试+25项C4回归，独立边界5项通过，独立实现核查PASS。另两个有声明项目可以显式建立独立载体和membership，四个未声明条目不自动提升。

新建入口一次提交原Workspace主键、PEO元数据、原Mandala追踪、Workspace/Collection独立载体及membership；creationComplete=false，GTD tag/project/keyword/Markdown未接入。既有项目绑定不重启追踪，不改既有绑定或历史同名载体。固定身份限定关键词索引不等于旧关键词BUS，全局关键词原字节保留。当前包8文件中3修改2新增，C4历史manifest保留，新读者兼容v1，旧读者拒绝Project命令；35冻结依赖未改。主UI/provider/event、全writer/输入排空、真实日历、完整GTD仍待完成；readyForHandoff=false。C5阶段NEWERA/实验库IO0，未部署。

下一步：用户已授权继续整个顺序：先接GTD项目/标签/关键词/Markdown载体使完整创建成立，再接原Workspace/PEO主界面并验证旧writer和输入安全排空，随后完整GTD业务。C5已验身份和双载体不重做；NEWERA禁止访问，不自动安装或迁移。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-expansion/implementation-review.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-expansion/tests-c5-v1.tap；results/daqian-unified-core-20261006/p4/native-foundation/p4c-expansion/source-manifest-v2.json。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改。既有P4A审计缺口保留，不报全库全绿。沿用C3 MemPalace bounded fallback证据，本轮无mine。


## 2026-10-08T01:30:44.615619+08:00 | P4-C6完整创建数据事务

P4-C6完整项目创建数据事务仓库候选完成：15项新增测试+43项C4/C5回归通过，独立实现v2核查PASS。显式导入八份GTD快照后，原Workspace/PEO/Mandala/Collection和原完整GTD引擎在一次journal/witness提交中形成新项目数据。

repositoryDataCreationComplete=true仅指仓库数据事务；creationComplete=false、fullUIAttached=false、readyForHandoff=false。旧同名项目/标签/全局关键词/Windows文件名冲突拒绝，重复编号不同标签可用；固定ID及历史悬空引用占用拒绝。旧记录/标签顺序和未知字段保全，原JSON字节留在导入历史，改写JSON重新序列化。原UI状态写入隔离丢弃。当前包12文件，C4/C5历史manifest保留，原35依赖未改；主UI/provider/event、全writer/输入排空、实际日历、完整GTD任务域仍待完成。NEWERA无访问；实验库仅此前只读核对5插件文件及8份GTD样本，无回写，无安装。

下一步：继续用户已授权顺序：接原Workspace/PEO主界面并验证旧writer和输入安全排空，随后完整GTD任务/层级/状态/归档工作流。C5关联和C6数据创建已验不重做；NEWERA禁止访问，不自动安装或迁移。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-gtd-creation/implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-gtd-creation/tests-c6-v2.tap；results/daqian-unified-core-20261006/p4/native-foundation/p4c-gtd-creation/source-manifest-v3.json。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改。既有P4A审计缺口保留，不报全库全绿。沿用本会话先前C5调查的bounded fallback证据，本C6批次未新运行查询，未mine。


## 2026-10-08T07:19:49.224353+08:00 | P4-C7原主界面已接流程

P4-C7原Workspace/PEO主界面已接流程仓库候选通过：Node12项+历史58项、Chrome17项与unknown场景通过，独立实现v2 PASS；原View/CSS/Modal保留，已接备注、条目标题、重要性、终止/恢复和完整创建API。

仅仓库验证：完整创建API-only，任意Workspace结构/附件/范式/快照和原Mandala周表未接，真实已加载旧writer/input排空未证。旧写sink前置拒绝，关闭等待队列/输入恢复；unknown保留窗口和owner。恢复记录绑定owner和不可变目标，显式认领、重复恢复保护、已知失败持久化后退出。fullUIAttached/realObsidian/readyForHandoff=false。当前17文件，35旧依赖及原25插件源不改。实验库仅只读核对WS5/PEO4、复制3文档并证明3侧文件不存在，无回写；NEWERA无访问。

下一步：继续完整GTD：已在p4d-gtd/INVESTIGATION.md只读列出原任务、层级、归档、标签、笔记、输入和旧sink；先独立核查事务与原UI适配计划，再实施。真实旧插件退出和安装留待具体已审包及runtime门禁；不自动迁移。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-main-ui/implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-main-ui/tests-main-ui-v3.tap；results/daqian-unified-core-20261006/p4/native-foundation/p4c-main-ui/source-manifest-v4.json。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改。既有P4A审计缺口保留，不报全库全绿。沿用本会话先前C5调查的bounded fallback证据，本C7批次未新运行查询，未mine。


## 2026-10-08T09:45:16.149864+08:00 | P4-D1a GTD任务事务

P4-D1a六类GTD任务事务仓库候选通过：13项新增与70项历史回归通过，独立实现PASS。创建工作篮任务、创建固定项目ID行动、日程、截止、完成和恢复调用原完整GTD引擎五方法，在统一journal/witness确认；新增稳定任务ID及projectId映射。

D1a只覆盖六类数据事务，原GTD任务UI、层级/排序、标签/BUS、笔记、删除、项目归档/恢复/改名/转换仍待D1b/D2/D3；repositoryFullGtd/realObsidian/readyForHandoff=false。原stage仅DB一次写，全部文件及silent normalization检查，历史raw/未知字段保留，DB重序列化。既有task按原project名称唯一性检查，不冒充完整历史ID映射。固定+08日历不声称历史夏令时或实际moment兼容。原20文件候选，35依赖/25原源保持；实际运行旧writer退出未证，NEWERA无访问，本批实验库无访问/写入。

下一步：继续D1b任务层级/排序和项目归档恢复，再D2标签关键词笔记与跨域改名、D3原完整GTD UI及输入/writer退出；具体schema与原业务缺陷窄补丁先独立核查。C5-C7成果不重做；未安装，不自动迁移。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd/d1a-implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd/tests-d1a-v4.tap；results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd/source-manifest-v5.json。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改。既有P4A审计缺口保留，不报全库全绿。沿用本会话先前C5调查的bounded fallback证据，本D1a批次未新运行查询，未mine。


## 2026-10-08T10:32:10.078187+08:00 | N1 原生数据与身份准备

N1原生接入准备已独立复核PASS：限定18数据源及1份固定binding的只读快照，保留实验库原7个ctx身份；11项测试、98项独立检查通过，85个文件哈希吻合。

N1为仓库内材料与身份准备模块，共5个新源码文件；不是完整genesis、安装包或业务权威移交。两次读取一致不等于原子快照或旧writer停止；migrationReady/writerQuiesced/authorityActivated=false。实验库本批只读，运行库写入0，NEWERA访问0。原UI未改，旧20文件/35依赖/25原源冻结；P4身份与行动观察包已安装的历史状态不代表统一内核已部署。

下一步：优先N2：显式实验数据genesis及原生durable storage/host；再N3：原Workspace/PEO接入、实际旧writer和输入安全交接及具体安装包。先审导入映射、独立host trust根和runtime路径方案，不能将.sessions或fixture直接改路径部署。D1b/D2/D3完整GTD仍待续做。仅授权实验库为目标，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-runtime-n1/implementation-review-v2.md、tests-v2.tap、source-manifest-v2.json、capture-receipt.json。初审sourceType遗漏BLOCK保留；备份后对已注册和未登记根补严格tab类型校验，修复复核PASS。实际只读范围为已授权实验库固定18源和binding，15数据源存在/3缺失，7身份全保留，无missing/unregistered。Q01/Q12绿，Q02–11黄，研究卡0；CARD_LIBRARY不改。不新增MemPalace查询或mine；不因本批通过宣称整体完成。


## 2026-10-08T11:04:32.779251+08:00 | N2 第一批原生存储

N2第一批原生存储factory仓库候选已独立复核PASS：新增8文件，显式根与seed绑定、独立host registry/witness及journal回执，保留原ctx数据。首轮17项测试全通过，修复后2项初始化容量边界通过；独立窄边界复核通过。

本批完成原生持久化模块，不含真实业务genesis、生产host配置、原UI接线、旧writer交接或安装。显式seed测试不是实际业务迁移。残留lease/未知尾阻止新写，确认回执可查；不自动清锁，不声称断电目录元数据持久性或双端同时回退可检测。原N1/共同权威/依赖/原插件源码冻结。实验库与NEWERA本批IO0。既有P4观察包已部署状态保持，统一数据内核仍未部署。

下一步：继续N2：以N1冻结实验材料和原ctx建立显式真实业务genesis，消除U01/U02及组合reducer的fixture初始化依赖，核查声明/追踪/membership/GTD映射与缺失关联材料；再形成受信生产host配置并接入新storage。随后N3原Workspace/PEO和旧writer/input交接及具体安装包；D1b/D2/D3完整GTD继续保留待办。不得直接改路径部署或重新生成ctx，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-runtime-n2-storage/implementation-review-v2.md、source-manifest-v2.json、vendor-v2.diff、tests-v1.tap、tests-envelope-v2.tap。独立初审发现完整genesis加digest后超限检查过晚，原BLOCK及复现保留；2文件备份后把完整record检查移至anchor/reserve前并补窄边界回归，v2复核PASS。Q01/Q12绿、Q02–11黄，研究卡0；CARD_LIBRARY不改，不新增MemPalace查询或mine。


## 2026-10-08T11:30:27.440067+08:00 | D1b GTD层级排序和归档恢复

D1b四类GTD结构事务仓库候选已独立复核PASS：任务层级/同级排序/跨项目子树移动、项目层级排序及归档/恢复，通过原完整引擎与纯预期差异核对进入共同journal。14项新增测试与83项历史回归通过。

本批只覆盖GTD数据事务，归档GTD项目不等于Workspace/PEO终止或Mandala停用；有active子项目或恢复会产生无效父链时拒绝。完整GTD UI、标签关键词/笔记/删除/改名/转换、原生业务genesis和production host、旧writer/input交接仍未完成。完整排序profile绑定Node/V8/Unicode/ICU及Collator options，环境改变拒绝D1b回放，旧D1a三字段回放保持。原ctx/任务ID和历史保全，DB重新序列化。实验库/NEWERA本批IO0，未安装；既有P4观察包部署状态保持。

下一步：继续D2标签/关键词、关联笔记以及改名/删除/转换等剩余GTD操作，再接D3原GTD主界面。N2真实业务genesis/production host组装与N3旧writer安全交接仍是部署前必需待办；原视图保留，先独立核查具体跨文件事务，不直接改路径部署，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d1b/implementation-review-v2.md、source-manifest-v7.json、implementation-v2.diff、tests-d1b-v2.tap、tests-regression-v1.tap。原恢复count写后报错在冻结方法隔离复现并窄补加载副本；独立初审两项BLOCK（排序profile不全、异常binding被当空）经2文件备份修复后PASS。旧失败证据保留。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改；不新增MemPalace查询或mine。


## 2026-10-08T12:18:16.152752+08:00 | D2a GTD普通标签关键词和笔记绑定

D2a三类GTD元数据事务仓库候选已独立复核PASS：条目标签添加/移除、普通标签关键词替换及已有导入笔记绑定/解除，通过原完整GTD引擎差异核对进入共同journal。最终18项新增测试通过；窄修复前97项历史回归通过。

本批只覆盖普通标签和导入材料目录内的笔记绑定，ctime=null，未证明真实vault全量笔记解析。上下文主键标签/关键词及规范分隔符变体被保护，需后续跨插件事务；原Markdown字节不改，未知关键词wrapper及保留条目字段保全。标签定义管理、删除/改名/转换、评论/标志及原输入防丢、原GTD UI、原生业务genesis/production host、旧writer/input交接仍未完成。D2a metadata profile绑定归一化运行环境；旧D1a/D1b回放保持。实验库/NEWERA本批IO0，未安装；现有P4观察包部署状态保持。

下一步：继续D2b标签定义管理、改名/删除/转换、评论/标志等剩余GTD操作及跨上下文联动，再接D3原GTD主界面并验证输入防丢。N2真实业务genesis/production host组装与N3旧writer安全交接仍是部署前必需；保留原视图，不直接改路径部署，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2a/implementation-review-v2.md、source-manifest-v2.json、implementation-v2.diff、tests-d2a-v2.tap、tests-regression-v1.tap。原标签选择/关键词保存/笔记绑定方法在隔离宿主验证；独立初审BLOCK的损坏GTD绑定和外部关联字段校验不足已按窄修复审核补齐，两文件备份及失败证据保留；普通元数据与上下文主键区分，旧D1a/D1b持久回放通过。此前各批失败与修复证据保留。Q01/Q12绿、Q02–11黄，研究卡0，CARD_LIBRARY不改；不新增MemPalace查询或mine。


## 2026-10-08T13:39:16.259383+08:00 | D2b1 GTD普通标签定义生命周期

D2b1四类普通GTD标签定义事务仓库候选已独立复核PASS：创建、编辑、层级排序与删除，经原TagDefinitionModal保存、原顶层移动和原管理器删除方法核对进入共同journal。最终17项新增测试通过；窄修复前115项历史回归通过。

本批限定普通标签/分类标签；编辑保留固定ID，关键词和未知字段保全。上下文标签、祖先和子树受保护；create/edit/move按原方法全组重编号普通order，保留相对顺序，delete不重编号且预检未来受保护order不变。删除须无子标签/条目使用/关键词。只验证原modal保存路径，另一个inline编辑入口的排序差异、隐式关闭防丢和真实UI仍未整合。条目/项目改名删除转换、评论/标志、跨上下文联动、原生genesis/production host、旧writer/input交接仍未完成。旧D1a/D1b/D2a行为回归通过；实验库/NEWERA本批IO0，未安装，既有观察包部署状态保持。

下一步：继续D2b条目/项目改名、删除、转换及评论/标志与跨上下文联动，随后D3原GTD主界面接入、两套标签编辑入口行为协调和输入防丢验证。N2真实业务genesis/production host与N3旧writer安全交接仍是部署前必需；保留原视图，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2b1/implementation-review-v2.md、source-manifest-v2.json、implementation-v2.diff、tests-tags-v3.tap、tests-regression-v1.tap。初版测试发现新隔离host对options.value设置未生效，因共享shim属性不可写；新stage改用defineProperty，原程序和共享host不改。失败测试及test-host-fix保留。独立v1 BLOCK的历史/当前序列化carrier ID保留遗漏经两文件备份修复，原反例与版本证据保留。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改，无新增MemPalace查询/mine。


## 2026-10-08T14:11:23.666155+08:00 | D2b2 GTD普通条目生命周期

D2b2四类普通GTD条目生命周期仓库候选已独立复核PASS：条目改名、无联动笔记的普通项目改名、无当前引用叶子/空项目删除、工作篮根叶子转入已有项目。经原renameItem/deleteItem/moveInboxItem进入共同journal，固定ID保留。最终16项新增测试通过；引用扫描窄修复前132项历史回归通过。

本批只支持已导入当前材料范围；保守检查当前文件/JSON转义引用和跨owner引用，历史快照保留。禁止上下文项目及保护标签变更、带笔记/引用/任何状态子项的删除及子树转换；taskBindings缺失与空映射分别保留，转换按固定项目ID登记。原工作篮升级新项目分支存在清空content后创建文件的问题，尚未接入。关联笔记与跨上下文改名删除、评论/标志、完整原UI/输入防丢、真实genesis/production host和旧writer交接仍待完成。本批实验库/NEWERA均IO0，未部署，既有观察包状态保持。

下一步：继续补评论/标志及工作篮升级新项目的可靠事务，随后补关联笔记与共享上下文生命周期、D3原GTD主界面和输入防丢。N2真实业务genesis/production host、N3旧writer安全交接仍是部署前必需；保留原视图，不访问NEWERA。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2b2/implementation-review-v2.md、source-manifest-v3.json、implementation-v3.diff、tests-lifecycle-v4.tap、tests-regression-v1.tap。首轮测试4pass/7fail/4cancel，失败包含原引擎DB键序与oracle差异及context拒绝优先级；同时将绑定篡改测试调整为与baseline确有差异的样例；经独立复核后仅在完整业务内容核对通过后规范提交DB序列化，其他文件逐字节校验。失败TAP、诊断及两文件备份保留。独立v1 BLOCK复现8例序列化Unicode当前引用遗漏，随后两文件独立计划核查/备份修复，最多32层递归且深度异常拒绝操作；最终16测试通过，132历史回归为该窄修复前口径。新增测试一次computed key语法笔误修正，v3失败输出保留。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。MemPalace查询5秒超时，限定Atlas fallback，未mine。


## 2026-10-08T15:04:21.664312+08:00 | D2b3 GTD评论、标志、工作篮升级与草稿服务

D2b3评论、三类标志和普通工作篮升级新项目的仓库事务已独立核查PASS；另补可恢复评论草稿服务。升级保留原固定ID，项目记录与原模板项目笔记一次提交。最终21项新增测试通过；草稿恢复窄修前148项历史回归通过。

评论按原文和属性哈希保存，清空需明确确认；标志支持isFirstClass/isFocusSession/isDimmed，折叠状态不在本批。升级仅限普通活动工作篮根叶子，阻止上下文/关联笔记/当前引用/子项和名称路径冲突，不创建共享Workspace/PEO上下文。草稿是仓库服务，已测保存并发、失败保留、固定请求恢复和只读读取；尚未接原评论弹窗，不能声称真实X/Esc/卸载防丢完成。原界面设计保留，关联笔记/共享上下文生命周期、D3完整原GTD主界面、真实业务genesis/production host和旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核，既有观察包状态保持。

下一步：接入D3原GTD界面及评论弹窗持久草稿消费者，验证真实关闭/取消/Esc/遮罩/视图与插件卸载；保留原界面并明确保存期间输入策略。补关联笔记/共享上下文生命周期，再完成N2真实业务genesis/production host与N3旧writer交接及实验库受控试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2b3/implementation-review.md、source-manifest-v1.json、implementation-v1.diff、tests-workflow-v2.tap、tests-regression-v1.tap。首轮17/19：缺失flag会触发原引擎自愈，保持beforeRows拒绝并修正测试；只读草稿链完整性不等于攻击者可重封整链时的身份认证，改测namespace与显式itemId重开。独立RD1发现恢复比较需覆盖完整sealed候选（含seq/prevDigest/digest），经两文件计划核查/备份修复；saved草稿还必须查询权威confirmed回执。保留初始BLOCK、失败TAP及修复证据。最终21项通过；148历史回归在草稿窄修前，不宣称之后重跑。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。MemPalace本轮GTD comment draft只读查询成功，3项Atlas结果，无mine。


## 2026-10-08T16:34:36.273682+08:00 | D3a 原GTD首批界面接线

D3a原GTD首批界面接线仓库候选已独立核查PASS：沿用完整原渲染器、评论窗口和工作篮选择框，接评论、三类标志、转入已有项目及升级新项目。最终18项界面测试通过；适配器窄修前21项草稿/业务服务回归通过。

这是隔离Chrome与Obsidian壳层的原UI验证，不是实际Obsidian运行验收。评论窗口已在仓库接草稿服务，取消/遮罩/X/Esc/程序关闭和受控view/plugin卸载均经测试；磁盘失败保持窗口，未知或过期pending草稿只读恢复。窗口生命周期只允许一个GTD宿主；未接线Modal和inline编辑入口拒绝录入，原布局保留。其他GTD任务/层级/元数据/标签/生命周期的界面入口仍待接入；关联笔记/共享上下文生命周期、真实业务genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，统一内核未部署，既有观察包状态保持。

下一步：推进D3b原GTD其余已验证业务命令的界面接线，保留原布局，补创建/任务排程完成/层级/元数据标签及生命周期输入保护；再补关联笔记/共享上下文和N2真实genesis/production host、N3旧writer交接，之后实验库受控试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3a/implementation-review-v2.md、source-manifest-v2.json、implementation-v2.diff、browser-v3.tap、service-regression-v1.tap、原界面截图。初轮12项中4项失败，原因含刷新断言时机、壳层未呈现title的选择器和未打开tagform；经独立计划核查/备份后修复适配器完整close任务跟踪、终态后晚到DOM新草稿接续与清空分支保护，补过期chooser拒绝。独立初审F1/F2 BLOCK后按RR1–RR4修补：已删除条目的草稿可只读复制、相同草稿重复打开共享一次请求、不同草稿拒绝串线；关闭排空自己创建的窗口。终态后晚到输入仅按原回执revision续开，第三方更新后反复重试仍拒绝覆盖；冲突时DOM保留可复制，不承诺冻结期程序输入已持久化。最终18界面测试通过；21服务回归在适配器窄修前，服务代码未改。旧drawer仅作synthetic class哨兵，不宣称原live drawer已测。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。MemPalace GTD comment modal close只读查询成功，无mine。


## 2026-10-08T19:10:47.368697+08:00 | D3b1 原任务日期与完成回退

D3b1原GTD任务日程、截止日期、完成与回退四入口已在仓库候选独立核查PASS；沿用原按钮/日期窗口/完成确认。最终15项新界面测试通过；日期默认值及focus窄修前18项D3a界面回归、13项任务服务回归通过。

仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。关闭/取消不改日期，专用清除按钮提交null；错误保留日期，重试沿用原revision，unknown保留原请求并拒绝owner退出。任务按固定ID完成/回退；项目日期与项目生命周期UI、创建/层级/元数据标签等入口仍待接入。刷新只补偿一个仍存在的可见锚点，显式定位/用户滚动或焦点移动优先，丢失锚点不强拉旧位置。实验库与NEWERA均IO0；统一内核未部署。

初轮14项中2项失败保留：原QuickPrompt默认值未被壳层写入DOM，以及滚动用例在页面底部未实际移动；经独立计划核查与字节备份后窄修。D3a回归原位运行曾刷新旧original-gtd-main.png/original-comment-modal.png，旧图不再作为原字节冻结证据；受影响路径/当前hash/本轮复制来源见screenshot-provenance.json。历史TAP/源码manifest/核查结论未重写；当前视觉验收采用本轮新日期/确认截图。MemPalace查询超时后bounded Atlas fallback，无mine。

下一步：D3b2先补无正式记录的新建任务/项目草稿与可靠创建UI，再接层级/元数据标签/项目生命周期等剩余原GTD入口；随后关联笔记/共享上下文、N2真实genesis/production host与N3旧writer交接，之后实验库受控试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b1/implementation-review.md、source-manifest-v2.json、implementation-v2.diff、browser-v2.tap、两份regression-v1 TAP及原日期/确认截图。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-08T20:05:27.941583+08:00 | D3b2 根创建与创建草稿

D3b2原GTD工作篮任务、普通项目、下一步行动的根创建入口及指定项目根行动已在仓库候选独立核查PASS；保留原QuickPrompt与项目选择窗口，关闭只留草稿，明确提交才创建。普通项目条目和原模板笔记由同一事务保存。

仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。层级插入仍关闭；普通GTD项目不自动成为共享Workspace/PEO/Collection上下文。创建pending仅首次派发，后续查询原请求，not_found/unknown不重新创建；pending持久化到派发间崩溃会保留只读草稿，需后续人工处理。saved后的晚到输入独立carryover只读保留。实验库与NEWERA均IO0；统一内核未部署，完整GTD/真实host/旧writer交接未完成。

最终31项创建界面、17项创建服务通过；13项旧task和21项workflow服务在关闭握手修复前通过（合计service-v2为46项含初版12creation），关闭握手修复后、最终化窄修前33项原UI回归通过。独立核查曾BLOCK空白关闭和丢弃晚到DOM，现prepare/finalize持有owner并绑定精确快照/token，before/after丢弃写盘失败同token修复；独立v2又发现空白丢弃genesis失败与release回执丢失，最终化精确双状态修复和completed-token幂等回执已补齐；保留原BLOCK及失败TAP。旧新建禁用断言已在结果副本适配；旧workflow随机首个context可能先触发linked-note guard，独立同fixture新旧一致且不写数据，新增无同名笔记遮挡context负例。未改历史测试或旧截图；当前两张创建截图已人工查看。MemPalace只读查询成功，无mine。

下一步：D3b3接原GTD层级、元数据标签及普通项目生命周期等剩余UI，先独立核查范围与依赖；再处理关联笔记/共享上下文生命周期、N2真实genesis与production host、N3旧writer安全交接，然后才进入大千实验库受控试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b2/implementation-review.md、source-manifest-v3.json、implementation-v3.diff、browser-v4.tap、service-v4.tap、service-v2.tap、regression-ui-v3.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-08T20:51:41.505290+08:00 | D3b3a 原结构与普通项目归档回退

D3b3a原GTD任务移动、项目排序、普通项目归档与回退四入口已复用原界面和原业务引擎，经已有统一命令通道接入，仓库候选独立核查PASS。

仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。共享项目的直接结构/归档、祖先及移动子树仍关闭；原排序允许间接共享同级仅sortOrder变化，其余字段不得改变。层级创建、元数据标签、其他编辑和关联笔记/共享生命周期仍待接入。实验库与NEWERA均IO0，未部署统一内核；完整GTD、真实host及旧writer交接未完成。

21项本批界面与边界测试、64项原UI副本回归及14项原结构测试通过。四文件修改，42源总数不变，其余38源及35依赖/25固定原始源未改。独立核查证据见implementation-proof.json。初版20项17通过/3项样例准备错误：非法项目名、未创建真实共享绑定、同级移动未触发共享排序；调整样例后各自窄复验通过，并新增unknown用例。v4另修测试把U02共同版本号误作业务内容比较，v5显式核验共同版本加1并比较其余全部字段；v5另修项目child测试坐标为原项目行右侧72%以上（任务仍用原40像素阈值），v6通过；产品源码保持v1不变；独立3项探针通过，原失败TAP与脚本版本保留；截图仅写本批目录，原项目确认窗口和拖动后层级截图已查看，无截断遮挡。MemPalace只读查询超时，使用有界Atlas回退，无mine。

下一步：D3b3b继续复用原GTD标签/元数据入口与其余作者输入流程，先核查范围与依赖；后续处理关联笔记/共享上下文生命周期、N2真实genesis与production host、N3旧writer安全交接，再进入大千实验库受控试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3a/implementation-review.md、source-manifest-v1.json、implementation-v1.diff、browser-v1/v2/v3/v4/v5/v6.tap、structure-v1.tap、regression-ui-v1.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T00:20:59.843915+08:00 | D3b3b 原普通标签与已有笔记绑定

D3b3b原GTD普通标签添加/移除、已有笔记绑定/显式清除入口已复用原界面和现有元数据服务，经统一命令接入，仓库候选独立核查PASS。

仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收；TagSuggester原class复用，截图是壳层按钮列表而非原生搜索外观。标签定义/关键词作者输入、层级创建、其他编辑和共享上下文生命周期、真实genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核；完整GTD未完成。

本批21项界面与边界检查（v1 19通过，另2项选择器样例错误经v2限定modal/summary后通过）、64项原UI副本回归、4项结构/归档UI代表回归、18项元数据服务通过。四文件修改，42源总数不变，其余38源及35依赖/25固定原始源未改。独立2项针对性探针通过，证据见implementation-proof.json；原失败TAP/脚本保留。截图仅写本批目录，已查看笔记选择无截断遮挡；标签截图不作为原生视觉验收。MemPalace有界只读Atlas检索成功，无mine。

下一步：D3b3c先审原GTD标签关键词编辑入口，复用已有setTagKeywords服务并保护作者输入关闭/失败/unknown；标签定义管理及其余UI继续分批。之后完成共享生命周期、N2真实genesis/production host和N3旧writer交接，再进入大千实验库受控试用。下一步行动台及Ontology结构编辑器已有候选，ontology-meta-hub元表格尚未接入。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3b/implementation-review.md、source-manifest-v1.json、implementation-v1.diff、browser-v1/v2.tap、metadata-v1.tap、regression-ui-v1.tap、regression-structure-v1.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T01:02:26.862670+08:00 | D3b3c 原标签关键词作者输入

D3b3c原GTD标签关键词编辑已复用原TagDefinitionModal和规范化helper，通过独立作者草稿接入已有setTagKeywords服务，仓库候选独立核查PASS。

仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。原表单保留，关键词以外定义字段/导航暂时禁用；尚未实现完整标签定义编辑。pending只查询原请求，not_found也不重发；dispatch前中断的人工处理仍待后续。层级创建、其他编辑、共享生命周期、真实genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核；完整GTD未完成。

v2的20项原关键词界面与输入生命周期测试、15项草稿服务测试通过；保留v1的64项未改原UI副本回归证据，独立8项探针通过。初次v1 PASS被追加关闭顺序核查BLOCK取代，按已审最小修复备份并只改关键词UI后，以v2独立PASS为当前结论。每次重试均先核对最终原文并结束输入再释放，关闭失败后的晚到原文保留可复制。5个既有源改动+3个新typed关键词draft/session/UI，45源；其余37源及35依赖/25固定原始源不改。业务元数据domain/stage、旧comment/create草稿不改。复制回归中仅将新建标签入口预期改为挂载前拒绝，原历史脚本未改。截图已查看窗口输入和底部操作无截断；壳层createEl的value选项呈现不代表原生验收。服务首次v2运行缺少浏览器模块环境变量而失败，保留service-v2.tap；补环境后service-v2b.tap为当前通过证据，源未修改。独立核查见implementation-proof-v2.json。MemPalace有界Atlas检索成功，无mine。

下一步：D3b3d先核查并接入原GTD标签定义管理（已有服务的新增/编辑/排序/删除），复用原程序并保护多字段作者输入；随后其余GTD编辑/层级创建、共享生命周期、真实host与旧writer交接，再进入大千实验库受控试用。Ontology表格编辑器已有仓库候选，ontology-meta-hub仍单独待接；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3c/implementation-review-v2.md、source-manifest-v2.json、implementation-v1.diff、browser-v2.tap、service-v2b.tap、regression-ui-v1.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T01:43:39.586043+08:00 | D3b3d 原标签定义管理

D3b3d原GTD普通标签定义管理已复用原TagDefinitionModal及管理器，将新建/编辑/排序/删除接入已有统一服务；独立多字段草稿保护已验证，仓库候选独立核查PASS。

仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。原名称/图标/颜色/父级/分类/关键词表单及管理器保留；固定ID只读并由已有服务生成，项目身份/受保护标签仍拒绝普通标签写入。使用项目导航暂时禁用。pending只查询原请求，not_found也不重发。其余条目编辑、层级创建、共享生命周期、真实genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核；完整GTD未完成。

v2源码下21项原标签定义UI、20项旧关键词独立入口UI、18项定义草稿服务及4项独立故障探针通过。48项早期服务合集中含原标签服务17/旧关键词服务15，保留其未改模块证据；64项原UI副本回归通过。第一轮两项测试假设修正：domain是普通分类，子级按钮使用实际文字而非壳层未支持title；旧关键词重复打开测试改为独立keyword API，完整原配置入口由新增UI覆盖。v1独立核查发现无效父级在owner申请后才校验，保留BLOCK及复现，v2备份后先校验初始表单再申请owner。6个既有源改动+3新typed定义draft/session/UI，48源；其余39源及35依赖/25固定原始源不改。业务tags/metadata服务与原始程序不改；keyword-session只增主session控制的强制只读恢复。查看截图确认原表单与操作无截断。MemPalace有界Atlas检索成功，无mine。

下一步：D3b3e先审并接入原GTD其余条目编辑入口（复用已有生命周期/工作流服务并保护作者输入），随后补层级创建、共享生命周期、真实host与旧writer交接，再进入大千实验库受控试用。Ontology表格编辑器已有仓库候选，ontology-meta-hub仍单独待接；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3d/implementation-review-v2.md、source-manifest-v2.json、implementation-v1.diff、browser-v3.tap、service-v3.tap、regression-ui-v1.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T02:24:35.922652+08:00 | D3b3e 原重命名与归档删除

D3b3e原GTD普通条目重命名与原归档删除入口已接入已有统一生命周期服务；复用原QuickPrompt和ConfirmModal，独立名称草稿保护及候选源码通过独立核查。

仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。共享项目及其祖先链保护继续生效；关联笔记、当前引用及子级等仍由原服务拒绝，不提供关联笔记同步重命名。普通项目改名成功证据仅合成生命周期服务，原浏览器项目入口验证共享项目拒绝。原删除按钮只在归档条目出现。名称为空或未变拒绝，不隐式删除；pending固定且unknown/not_found重入只查询。层级创建、共享生命周期、其余未接入口、真实host/genesis及旧writer交接待完成。实验库与NEWERA均IO0，统一内核未部署，完整GTD未完成。

名称草稿服务15项、原生命周期服务16项通过；原重命名浏览器15项通过，原归档删除独立补测1项通过；原创建31/评论与首批入口18/标签定义21共70项回归已覆盖：初跑69项通过，1项旧断言仍把已开放铅笔当未开放，修正为打开重命名后关闭且零业务改动，单项补测通过。保留service-v1的两项测试夹具错误（class展开丢方法、伪造链保留旧摘要），修正副本v2全部通过；browser-v1误在活动行寻找原删除按钮，v2首次展开归档后刷新会折叠，v3每次确认原归档展开后补测通过。源码未因测试修正改变。5改3增，51源；原43源、35依赖、25固定原程序不改。名称原文与trim业务值分离，固定ID不变；原Enter关闭前提交回调已阻断，prepare-finalDOM-nativeClose-release顺序保护输入；失败关闭/释放可恢复。原界面截图已查看，无表单截断。无MemPalace mine。

下一步：D3b4先核查并补原同级/子级创建入口与可靠创建草稿，再核对剩余GTD入口清单及共享项目生命周期；之后接真实host、验证旧writer安全退出，完成部署前验收后推进大千实验库试用。Ontology表格编辑器已有仓库候选，ontology-meta-hub仍未接入；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3e/implementation-review-v1.md、source-manifest-v1.json、implementation-v1.diff、browser-v1.tap、browser-delete-v3.tap、service-v2.tap、regression-ui.tap、regression-lifecycle.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T02:57:06.822537+08:00 | D3b4 原同级与子级创建

D3b4原GTD普通同级项目、同级任务和子任务入口已接入统一内核，复用原addNewItem与QuickPrompt；固定层级记录和独立创建草稿保护已通过候选源码独立核查。

仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。原项目＋新增同级项目，原任务＋/↳新增同级/子任务；原项目↳仍为根下一步行动，不新增子项目按钮。子项目创建已具备服务/私有适配能力，仅原引擎服务验证。共享目标/祖先继续拒绝；同级根项目排序只允许原算法附带重排共享兄弟的sortOrder。scope固定记录目标及祖先ID/类型/父级/项目ID，移动后重核版本也拒绝旧范围。新增命令不可交给旧读取器，原命令与草稿不变。剩余原入口、共享生命周期、真实host/genesis及旧writer交接待完成。实验库与NEWERA均IO0，统一内核未部署，完整GTD未完成。

层级创建服务16项、修复后的原层级浏览器14项、原根创建UI31项通过。独立v1核查发现草稿身份字段顺序导致原按钮无法恢复（F1 BLOCK），只修复UI结构身份键后复核通过；保留v1失败与v2修复证据。原任务/结构服务回归除一处测试副本的__dirname指向旧位置外均通过，修正副本定位后单项补测通过，历史失败证据保留。原创建逻辑在隔离原引擎中执行；项目笔记/数据库/任务membership一次事务提交，父级与兄弟排序逐项核对，固定ID和请求幂等、未知结果只查、关闭防丢已验证。计划独立核查要求导出既有compare及固定祖先scope，两项落实后PASS。7改4增55源，44旧源及35依赖/25固定原程序不改；gtd-structure-domain只导出原compare。原界面截图已查看，无截断。无MemPalace mine。

下一步：D3b5先核对剩余原GTD入口清单，补项目日期/其他仍受限入口并区分跨插件关系与Meta捕获；随后处理共享生命周期、真实host和旧writer排空，完成部署前验收后进入大千实验库受控试用。Ontology表格编辑器已有仓库候选，ontology-meta-hub仍未接入；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b4/implementation-review-v2.md、source-manifest-v2.json、implementation-v1.diff、implementation-v2.diff、browser-v2.tap、regression-root-ui.tap、service-v1.tap、regression-domain.tap、regression-structure-fix.tap。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T03:14:18.963518+08:00 | D3b5 原项目日期与入口清单

D3b5原GTD普通项目日程与截止日期已接入统一内核，复用原日期按钮和原日期处理函数；设置、明确清除和取消已验证。

仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。只改变所选普通活动项目的日期，任务、子项目、笔记、绑定与历史保持原值；共享目标或祖先继续拒绝。任务schedule/deadline命令与旧记录语义不变；新增scheduleProject/deadlineProject不能交给旧读取器。日期取消放弃未提交选择，空白无效；未知结果目前安全阻塞后续操作和退出，尚无通用用户恢复入口。两库IO0，未部署，完整GTD未完成。

项目日期服务10项、原项目日期界面7项、任务/结构回归27项和原任务日期相关界面5项通过。服务v1把数据库JSON键排序误当字段变化导致断言失败，v2仅修正测试为数据库对象深等，其他文件/元数据逐字节验证；失败日志保留，生产源码未因该测试变化。5改0增55源，50旧源及35依赖/25原快照不变；已做独立计划、实现和备份核查。原日期弹窗截图已查看。无研究卡或MemPalace mine；经验搜索向量超时后使用限定目录回退，不宣称向量可召回。

下一步：D3b6按入口审计优先接普通任务/项目折叠的可靠状态保存，并明确打开并创建笔记的边界；随后补通用未知结果恢复、共享生命周期、真实host/genesis及旧writer交接，完成部署验收后进入实验库受控试用。EVA关系/Meta捕获与ontology-meta-hub仍未接入，Ontology表格已有独立仓库候选。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b5/implementation-review-v1.md、source-manifest-v1.json、implementation-v1.diff、browser-v1.tap、regression-task-ui-v1.tap、service-v2.tap、regression-domain-v1.tap、ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T09:49:07.977002+08:00 | D3b6 显式折叠与恢复边界

D3b6原GTD普通任务和项目的显式折叠/展开已接入统一内核；保留原箭头、summary及键盘操作，页面恢复临时展开不回写业务字段。

仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。新setCollapsed保存原isCollapsed字段，固定ID与revision、普通目标及祖先资格、精确单字段校验；旧setFlag不扩张。共享目标改值仍拒绝，相同已存值只协调显示、不发命令，不代表修改权限。QuickNav/restore展开保持环境态。forceAutomation开关不等于实际恢复；局部折叠刷新在没有显式导航和实际恢复时跳过旧视角重放。未知提交结果仍仅安全阻塞，暂无通用恢复入口。两库IO0、未部署、完整GTD未完成。

折叠服务8项、原界面10项、原workflow回归21项、原项目日期回归7项通过；原界面截图已检查。6改0增55源，49旧源及35依赖/25原快照不变；独立计划要求区分forceAutomation与实际恢复，并验证开启automation后的最终DOM及延迟窗口。字节备份、独立实现核查完成。独立补测5个场景与旧reader拒绝新操作检查通过；独立v1/v2测试数据构造失败日志保留，保护场景以修正fixture后的v3通过为准，不宣称v2整套通过。无规则/Skill/研究卡或MemPalace mine；经验搜索使用此前向量超时后的限定目录回退。

下一步：D3b7补打开并创建缺失笔记的可靠流程，随后补通用未知结果恢复、共享生命周期、真实host/genesis及旧writer交接，再进入实验库受控试用。EVA关系/Meta捕获与ontology-meta-hub仍未接入，Ontology表格已有独立仓库候选。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b6/implementation-review-v1.md、source-manifest-v1.json、implementation-v1.diff、browser-v1.tap、regression-project-date-v1.tap、service-v1.tap、regression-workflow-v1.tap、ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T10:18:30.070112+08:00 | D3b7 标题笔记创建与EVA计划

D3b7原GTD界王拳截止日期卡的标题笔记打开/创建已接入统一内核仓库候选；复用原helper，只创建缺失笔记，不自动写入noteBinding或修改任务数据库。EVA Cross Relations已列入独立后续接入计划。

仅仓库Chrome/Obsidian壳层测试；未部署、两库IO0。普通活动条目与祖先资格、固定ID/revision、唯一安全标题路径、冲突拒绝和精确文件差异校验，当前/历史文件与目录前缀冲突拒绝；已有笔记纯导航允许只读/共享，不代表共享写入接入。确认回执固定路径，较新导航和关闭抑制迟到跳转。通用未知结果恢复仍待补，当前保留安全阻塞；完整GTD、EVA关系/Meta、ontology-meta-hub及真实host/旧writer交接仍未完成。

标题笔记服务11项、原界面10项、任务回归13项、折叠界面回归10项通过。5既有源改动+2新模块共57源，50旧源及35依赖/25固定快照不改。v1/v2原helper隔离环境误拦非目标只读查询及ViewState sidecar修改，原失败/中止日志保留；v3只放行这两类环境行为，业务modify仍拒绝，独立v3发现文件/隐含目录冲突，保留BLOCK与复现；v4经补充计划核查后备份两文件补上current/history及已有笔记UI路径结构检查，最终独立实现复核见v4证据。任务13/折叠10回归在v2阶段通过，v4仅改新笔记路径检查，最终受影响21项重跑通过。原界王拳截图已检查。独立v4补测8项通过，含只读共享导航与服务拒绝、固定回执路径、新导航优先、目录冲突及旧reader边界；独立早期fixture错误和v3 BLOCK历史均保留。无规则/Skill/研究卡或mine；经验查询使用有界Atlas回退。

下一步：D3b8补通用未知提交结果的查询与恢复入口；之后完善共享身份/生命周期，单独接入EVA Cross Relations关系事务、原chips/编辑器/跳转与固定ID验收，再分项接EVA Meta。随后真实host/genesis、旧writer安全交接及实验库受控试用。Ontology表格候选与ontology-meta-hub分开；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b7/implementation-review-v4.md、source-manifest-v4.json、implementation-v1.diff、browser-v4.tap、regression-collapse-v2.tap、service-v4.tap、regression-task-v2.tap、ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T10:53:20.584085+08:00 | D3b8 通用操作结果查询与恢复

D3b8已给原GTD通用操作补上持久操作记录、保存结果查询和精确本地记录修复；确认回执后可恢复页面，查询不会重复提交或补做迟到的笔记跳转。

仅仓库Chrome/Obsidian壳层候选，两个运行库IO0、未部署。原业务内核和native journal未改。保存前持久意图、固定requestId/revision、两份独立本地追加记录逐项对齐、完整链及历史精确回执重验；同步互斥排除并行提交与恢复竞态。健康的not_found只允许已结束且明确失败的本次派发自动释放；重开的待确认操作须用户明确确认才能释放；启动时单边缺失、截断或非对称记录继续阻断，仅活进程exact attempt可完成本地双链写入；真正unknown tail或残留writer lease继续阻断，不伪造witness、不删除lease、不重派业务命令。完整GTD、共享身份/生命周期、EVA关系/Meta、ontology-meta-hub及真实host/旧writer交接仍待完成。

服务18项、原界面8项、标题笔记界面回归10项、任务回归13项通过。4既有源+1新模块共58源，53旧源及35依赖/25固定快照不改。初次service-v1未设置Playwright路径，失败和取消日志保留，环境补齐后service-v2通过；独立v1发现整个ledger丢失后重开误判、日期/绑定丢回执文案错误和关闭残留恢复入口，BLOCK及原失败探针保留；经补充计划与3源字节备份后，v2增独立anchor全链对齐、真实pending envelope检查、准确文案和节点清理，再跑service-v3及browser-v2/note-v2。两链之一缺失/截断/半写均拒绝启动，全部本地完整性元数据一致删除或重写不在该模型保障范围；不掩盖历史失败。v1截图被v2重跑覆盖，原截图字节不可复验；旧proof及其余23项证据保留，限制见historical-evidence-note.md，v2图另存。原界面截图已检查，独立对抗核查见本轮implementation-review-v2.md。无规则/Skill/研究卡或mine；经验查询沿用有界Atlas回退。

下一步：D3b9先完善共享项目身份与生命周期约束及原入口；随后按D3b7 ENTRY_AUDIT既定计划，独立接EVA Cross Relations原关系数据/端点/消费者→固定ID关系事务→原chips/编辑器/跳转→改名改编号/缺失端点/过期版本验收，再分项接EVA Meta。真实host/genesis、native未知日志恢复及旧writer安全交接完成后再受控试用；Ontology表格候选不等于ontology-meta-hub。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b8/implementation-review-v2.md、source-manifest-v2.json、implementation-v1.diff、browser-v2.tap、regression-note-v2.tap、service-v3.tap、regression-task-v1.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T11:32:06.365850+08:00 | D3b9 共享根项目资格与原日期折叠入口

D3b9已为有明确固定ID关联的共享根项目接入资格投影，以及原GTD日期/截止日期和显式折叠入口；通过新命令复用原实现，只改所选项目字段。

仅仓库Chrome/Obsidian壳层候选，两库IO0、未部署。UI捕获固定ref/revision，服务与回放重算绑定、PEO生命周期和追踪资格；正常不合资格项目保留ref与原因，损坏/缺失/重复/跨项目关联停止处理。PEO停用主键不等于GTD归档项目；未自动合并两种语义。旧普通命令及旧回放边界不变。已有项目显式关联、共享改名/改编号传播、归档/恢复、嵌套结构和通用任务写入资格尚未补齐；EVA、真实host/旧writer交接及native未知日志处理仍待完成，不能称完整共享生命周期或可部署。

共享服务11项、原界面6项、普通项目日期回归7项、折叠回归10项和保存结果查询回归8项通过。5既有源+1新模块共59源，53旧源及35依赖/25固定快照不改。service-v1因primaryRef来源范围误用Workspace而非既有Mandala来源被严格检查拒绝，1通过9失败日志保留；按原计划修正为tracking.SOURCE，另加生成共享项目缺失绑定检查，改前字节备份及v2差异保留；service-v2通过；v2独立核查BLOCK发现绑定目标互换、专用页串线与重复成员关系，v3按现有固定身份规则严格重算并补充回放证明，service-v3通过。browser-v1保留5通过1失败，诊断证明模拟点击导致DOM与已存状态不同；browser-v2先从已确认状态刷新后再测展开，保持全部防写与最终两次命令断言。独立核查详见implementation-review-v3.md；最终v3源码再跑普通界面三组回归25项通过（regression-final-v2.tap）；原界面截图使用本批独立版本名。无规则/Skill/研究卡或mine；经验查询使用Atlas有界fallback。

下一步：D3b10继续补已有项目显式固定ID关联与共享改名/改编号传播、归档/恢复边界；明确PEO停用与GTD归档各自行为，覆盖其他任务写入资格。随后优先完成真实Obsidian host、启动/重启/中断处理和旧writer交接，形成限定范围实验试用包；EVA关系与Meta按独立计划逐项接入，未验收前不称全部整合。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b9/implementation-review-v3.md、source-manifest-v3.json、implementation-v1.diff、browser-v2.tap、regression-dates-v1.tap、regression-collapse-v1.tap、regression-recovery-v1.tap、service-v3.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T12:23:48.464857+08:00 | D3b10 已有项目明确关联与共享归档恢复

D3b10已接入已有GTD根项目与既有Workspace/Collection固定身份的明确关联，以及原GTD共享项目归档/恢复入口；关联只登记身份，不重写原数据或合并名称编号。

仅仓库候选，两库IO0、未部署。关联采用双向记录与独立导入/专用页来源证明；损坏、缺失、重复、跨项目关联停止处理。日期、折叠与GTD归档/恢复走资格服务；PEO停用、停止追踪与GTD归档互不等同。关联后的原控件仍保留，但尚未接入资格服务的评论、标志、标签、笔记、任务和结构写入会被拒绝；旧日志回放不变，不能称完整GTD。跨载体改名/改编号传播、嵌套共享结构、通用任务资格、EVA/Meta、真实host与旧writer交接仍待补齐。

最终源码61项（6旧改+2新，53旧源不改），35依赖/25固定快照不改。原始service-v1的owner用例业务断言通过但teardown误用旧token，10通过1失败；新版测试修正清理逻辑后通过。独立v1 BLOCK发现首次关联信任错误Collection tab；v2改用固定seed/provisioning来源，但导入workspaceTabId:null与seed ref equality仍遗漏；v3按已审解释补齐，19项独立检查通过。旧失败证据保留。最终root服务37项（新12、共享回归11、结构回归14）、原界面20项（新6、共享回归6、保存查询回归8）通过。源码备份及每版差异有记录；无规则/Skill/研究卡或mine，经验查询为Atlas有界fallback。

下一步：D3b11补跨载体改名/改编号同步，明确已有项目的标签和笔记等承载归属，不按显示名推断；随后为评论/标志/任务等原入口补资格服务并恢复相应操作。保留PEO停用与GTD归档边界，再优先完成真实Obsidian host、启动/重启/中断和旧writer交接，形成限定范围试用包；EVA/Meta按独立计划接入，不作为首轮限定试用的全部前提。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b10/implementation-review-v2.md、source-manifest-v3.json、implementation-v1.diff、browser-final-v2.tap、independent-final-v3.tap、carrier-v2.diff、absence-v3.diff、service-final-v4.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T13:10:40.758281+08:00 | D3b11a 共享元数据归属预检与固定关系索引

D3b11a完成共享项目改名/改编号的只读归属预检，并补齐已有明确关联GTD项目在主界面中的固定ID关系索引；未实现改名提交。

仅仓库候选，两库IO0、未部署。新建项目按专用页/标签/笔记/关键词指针检查；已有项目关联只证明身份，不因同名推定标签和笔记归属。预检始终canCommit:false，planningReady不是写入授权，引用和碰撞检查仅覆盖仓库导入的现态/历史材料。旧writer、PEO/Workspace局部元数据写入仍可能造成分歧，需后续统一事务和提交门禁；本轮仅报告分歧。原视图不改版；日期/折叠/归档恢复资格保留，其他共享写入仍待补齐。

新服务16项与修复补充5项、独立反例回归7项共28项通过；现有服务回归49项、原GTD界面回归6项通过。独立v1 BLOCK发现六类遗漏（历史标签/关键词/其他声明、大小写笔记链接/Collection评论/历史笔记绑定）；v2按已审计划补齐，最终独立核查见implementation-review-v2.md，早期失败证据保留。生成/已有身份关系、未导入GTD状态、损坏拒绝、停用/归档可见、纯读取不改文件、未知结果拒绝已覆盖。源码3改1增，62源；原reducers/commands/冻结程序不改，无规则/Skill/研究卡/mine。

下一步：D3b11b实现生成项目的共同队列元数据事务，逐项核验后一次提交跨载体名称/编号/笔记路径与关键词；为已有项目显式选择和登记标签/笔记归属，不按名称猜测。补追踪当前标题和笔记引用处理政策、旧PEO/Workspace局部写入准入保护、可靠草稿和原编辑入口。随后补共享评论/标志/任务资格，再做真实host/旧writer交接和限定范围实验试用。EVA/Meta独立排期，不作为首轮限定试用全部前提；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11a/implementation-review-v2.md、source-manifest-v2.json、implementation-v1.diff、repair-v2.diff、regression-browser-v1.tap、service-final-v3.tap、regression-service-v1.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T13:52:01.789156+08:00 | D3b11b 共享元数据原子提交与旧入口保护

D3b11b已实现生成项目改名/改编号的统一原子提交：Workspace、PEO声明、专用载体、GTD项目/任务、标签、笔记路径、关键词和当前追踪标题同步，固定ID不变。

仅仓库候选，两库IO0、未部署。仅接受统一内核生成且归属已证明的专用项目；已有明确关联项目的标签/笔记所有权仍未证明，改名继续拒绝。保留正文、历史周册、生命周期、别名和扩展字段；未知引用、编码异常、额外关键词、共享标签、子项目等保守拒绝。引用扫描仅覆盖仓库导入现态/历史，未进行真实库引用审计。原界面未改版；原改名输入框、可靠草稿和已有项目归属选择留待D3b11c。

新服务17项、独立反例9项及补充版本/行动同步2项合计28项通过；服务回归49项、原GTD界面回归6项、独立旧日志兼容1项通过。独立核查发现两类阻断（URI解码后的JSON引用绕过、声明/视图扩展字段被替换），已修复并反例验证，并补版本损坏/溢出拒绝，早期失败证据保留。初次服务测试负例污染共享测试对象已隔离；两项旧回归的局部元数据写入预期按新门禁改为拒绝/走原子命令。源码5改2增、64源、57旧源不变；旧reducers及历史命令apply不改。无需修改规则/Skill，无研究卡/mine。

下一步：D3b11c将生成项目的原Workspace/PEO/GTD改名入口接到统一元数据命令，复用原输入界面并补齐可靠草稿、结果查询和退出恢复；对已有项目显式选择与登记专用标签/笔记/关键词归属，不按同名猜测。随后补共享评论/标志/任务资格，再做真实host与旧writer交接、实验库限定试用。EVA cross relations按端点审计→固定ID关系事务→原chips/跳转/编辑器顺序，ontology-meta-hub/Meta独立排期；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11b/review-v2.md、source-manifest-v3.json、implementation-v3.diff、repair-v2.diff、regression-browser-v2.tap、service-final-v4.tap、regression-service-v2.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T14:47:15.870583+08:00 | D3b11c 原编辑器接线与可靠共享草稿

D3b11c已将生成项目的原Workspace改名窗口、PEO明确名称/编号入口和原GTD改名窗口接入统一元数据事务，三个入口按固定ID共用可靠三字段草稿；原评论保持原用途。

仅仓库候选，两库IO0、未部署。仅统一内核生成且专用载体归属已证明的项目可统一改名/改编号；已有明确关联项目仍需登记标签/笔记/关键词所有权。原视图与模态框复用；PEO新增明确入口，不再从备注猜身份。unknown只查询，不重发；确认未保存后显式重启新请求，确认保存后的较新输入保留carryover。现有draft编辑窗口遇权限丢失且未进入pending时会保守拒绝退出并保留输入；已关闭的草稿可只读恢复。锁仅同broker/process，未宣称跨进程；未持久化的突发进程死亡输入不保证恢复。真实host和旧writer交接未验证。

三字段草稿服务15项、新原界面5项与既有GTD界面6项合计11项、pending/unknown界面2项、旧原子服务19项通过；独立最终8项及确认期间新输入反例通过；原Workspace/PEO回归17项标志通过。修复确认期间新输入被覆盖、丢弃确认文案歧义及RPC字段顺序误判；早期工具环境、测试目录读取和确认时序失败证据均保留。源码7改3增、67源、57旧源不变；旧draft格式、核心/reducers/事务服务未修改。无需修改规则/Skill，无研究卡/mine。

下一步：D3b11d补已有明确关联项目的标签/笔记/关键词归属选择与登记，继续拒绝按同名猜测；同时明确限定试用的功能清单，再准备真实host与旧writer退出交接、实验库部署及用户试用。共享评论/标志/任务资格仍需分域补齐。EVA cross relations依次做原关系/端点审计、固定ID关系事务、原chips/跳转/编辑器；ontology-meta-hub/Meta独立排期，不以全部完成为限定试用前提。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11c/review-v1.md、source-manifest-v4.json、implementation-v3.diff、repair-v2.diff、browser-final-v4.tap、service-v3.tap、regression-atomic-v1.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T15:16:29.309178+08:00 | D3b11d 已有项目资源归属登记

D3b11d已为已有明确关联的项目接入原GTD资源归属登记入口：逐项选择项目、标签、笔记及GTD/Workspace/集合卡关键词，以固定ID登记可核验的归属证据。

仅仓库候选，两库IO0、未部署。登记只新增归属证据，不修改名称、编号、正文、评论、历史或原关键词配置；同名不代表归属，其他项目共用资源不可登记。当前资源变化后显示待重新确认，必须显式确认且携带旧记录摘要；损坏记录拒绝。已有项目整体改名仍未开放，需另行接入已登记资源的原子事务与引用审计。未知保存结果只查询；原视图和选择/确认窗口复用。真实host和旧writer退出交接尚未验证。

服务15项、原GTD登记界面5项、原编辑器/已有项目关联/保存恢复回归13项通过；独立领域13项、双项目排他1项、六选择阶段关闭6项、旧回放兼容1项通过。修复显式null归属表被当作缺省的问题，最终确认补齐项目及目标页ID。早期测试语法、共享测试样本被负例污染以及环境失败证据保留，最终采用service-v3及独立v2证据。源码5改1增、68源、62旧源不变；原插件输入、旧核心/reducer与草稿格式不变。无规则/Skill修改，无研究卡/mine。

下一步：D3b11e为已登记资源的已有项目补齐原子改名/改编号事务、引用审计和原编辑器资格接入；随后按TRIAL_SCOPE冻结限定操作清单与原生安装包，验证真实host、旧writer退出、实验库部署及用户试用。共享评论/标志/任务资格继续分域补齐。EVA cross relations按端点审计、固定ID关系事务、原chips/跳转/编辑器推进；ontology-meta-hub/Meta独立排期。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11d/review-v1.md、source-manifest-v1.json、implementation-v1.diff、repair-v2.diff、browser-v1.tap、service-v3.tap、regression-browser-v1.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T15:54:39.222733+08:00 | D3b11e 已有项目原子名称编辑

D3b11e已将已登记归属的已有项目统一名称/编号编辑接入原Workspace、PEO和GTD入口；显式字段、选定标签与三个视图关键词在同一事务中更新，固定ID保留，归属证据同步续链。

仅仓库候选，两库IO0、未部署。原笔记文件名、路径、正文、评论、历史及周观察标题保留；登记项目的原GTD笔记入口按固定路径打开。共享资源、额外别名、过期归属、重名或未审引用会拒绝保存并保留草稿；不承诺任意已有项目可改名。旧备注声明是历史文字，Main已接入消费者读取当前显式声明与固定ID。原PEO两类operational snapshot在仓库Main明确incomplete/不可用，尚未成为统一provider；完整AI export及外部旧解析消费者未验收，必须在native接管清单中处理。未知结果只查询；v1旧草稿/命令不变，adopted使用v2独立命令。

服务及兼容43项（新13、生成项目草稿15、归属登记15）、新原界面4项、既有编辑器/关联/保存恢复13项通过，原Main回归17项标志通过；独立领域11、Main消费者/草稿2、旧重放1通过。收紧首标题审计豁免并修复原PEO读取旧备注与关键词缓存滞后；早期计划V3 BLOCK、探针与独立测试失败均保留，最终采用V4 PASS和最终TAP。源码7改1增、69源、61旧源不变；原插件、核心、旧reducer/生成事务不变。无规则/Skill改动，无研究卡/mine。

下一步：D3b12冻结限定试用操作、原插件入口及读写/API接管清单，形成原生可安装候选包；补接或明确停用旧PEO operational snapshot及其他旧解析入口，演练旧writer队列退出、晚到回调、重启/草稿恢复，再按用户既有授权证明大千实验库路径与版本、备份/哈希后部署及原生验收。NEWERA不访问。共享评论/标志/任务资格继续分域补齐，EVA按端点审计→固定ID关系事务→原chips/编辑器/跳转，ontology-meta-hub/Meta另排。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11e/review-v1.md、source-manifest-v1.json、implementation-v2.diff、repair-v3.diff、repair-v4.diff、browser-final-v2.tap、service-final-v2.tap、regression-browser-v1.tap、D3b7/ENTRY_AUDIT.md。Q01/Q12绿、Q02–11黄，研究卡0，CARD不改。


## 2026-10-09T17:41:03.567094+08:00 | D3b12a Workspace operational snapshot

D3b12a已补齐仓库Main中PEO的Workspace operational snapshot：每次读取当前统一权威，以固定ID和显式声明返回项目，保持原接口格式、请求顺序和资格语义。

只完成仓库候选的读取接口接管，两库IO0，未部署。编号可重复可修改；旧备注不重写、不再决定此接口身份。未知/歧义/错误归属、非live权威返回incomplete空结果；暂停写权限也保守不可用。关闭成功或失败均使此前在途读取失效，含digest等待；新实例provider generation变化。Mandala目标快照仍不可用，完整有效上下文汇总/AI导出未验收。Core仍依赖fixture、仓库源和隔离浏览器；完整native genesis、ctx身份保留、native storage接入、实际旧writer退出、可安装包及真实host验收尚未完成。

新增快照浏览器9项、原项目编辑器回归4项通过，原Main17项检查通过且pageErrors为0；独立核查见review.md及implementation-proof.json。Main回归中的3次legacyWrites是故意触发并被拒绝的测试。源码仅2处修改（Main adapter和README），69源中67源不变；业务reducer、原插件、历史证据均不改。

下一步：D3b12b先做有范围的原生试用接管审计：按既有授权只读证明实验库实际路径、插件/已加载版本及来源哈希，列完整限定provider/writer清单。补保留ctx身份的native genesis及业务验证器、去除fixture/Playwright部署依赖、接native storage/真实host；再制作候选包、旧writer退出和恢复演练、备份哈希后部署实验库验收。NEWERA不访问。Mandala目标/EVA关系与Meta另排，不能把候选接口测试称为全内核已部署。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12a/review.md、source-manifest.json、HANDOFF_INVENTORY.md、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T18:22:59.894723+08:00 | D3b12b durable import rehearsal

D3b12b已只读核实实验库路径与38个选定插件文件，并把真实来源采集接入N2持久化导入演练：7个既有ctx身份、15份原文件字节和3个缺省槽位可在独立Node进程中完整重开。

仅仓库副本导入演练，实验库只读、写入0，NEWERA访问0，未部署。原始编号、标题、正文及ID均保留，不使用fixture种子或Playwright执行导入。源库与演练vault/trust目录双向隔离；捕获digest、binding、seed哈希和身份均固定。只有read/source接口，未知尾部、宿主或存储锁、非genesis命令拒绝读取；初始化残留不自动覆盖。sourcePolicy表示历史采集来源，不能证明当前源未变。关联笔记和全业务genesis仍不完整，authorityActivated/migrationReady/writerQuiesced/readyForHandoff均false。磁盘启用清单不是内存loaded版本证明，真实旧writer退出尚未完成。

新增导入测试14项、原N1回归11项及N2回归全部通过；独立测试与核查见review.md/implementation-proof.json。真实采集原字节37563、7身份均保留，跨进程proof见real-import-reopen-v2.json。源码3增、85源中82旧源不变；旧Core、原插件、N1/N2算法及业务reducer不改。WRITER_HANDOFF记录了各owner具体队列/计时器/保存路径，未冒充完整writer排空证明。

下一步：D3b12c补齐限定域的完整来源依赖与原生业务genesis/验证器，保留ctx身份，将已有reducer和原UI明确操作迁出fixture/仓库路径/Playwright依赖，接真实host及native store。随后证明实验库loaded版本、旧writer退出及草稿/未知结果恢复，再审包、备份哈希并按既有授权安装验收。NEWERA不访问；EVA/Meta和完整Mandala另排。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12b/review.md、source-manifest.json、WRITER_HANDOFF.md、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T18:46:52.619324+08:00 | D3b12c1 native PEO comment rehearsal

D3b12c1已打通真实采集副本的第一条原生业务事务：按原ctx固定身份修改PEO评论、可靠保存，并在独立进程重开后保持7身份和原始来源不变。

仅仓库隔离演练，本轮实验库与NEWERA访问均0、未部署。只开放peo.comment，沿用原评论长度/去空白/清空规则；不从评论提取身份或声明，不开放元数据、创建、生命周期和GTD写入。PEO其他字段、Workspace和原始18槽位/15文件保留；4个Workspace笔记绑定列为未采集依赖。独立声明尚未导入，declarationStatus为unresolved，fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。历史confirmed回执不代表当前可写，host/store锁或未知尾部冻结现态，关闭只释放自己的broker锁。旧writer退出、真实UI/host和完整业务genesis仍待完成。

新业务测试13项、导入回归14项、原Workspace回归17项及独立反例8项通过，共52项；核查见review.md和implementation-proof.json。原评论处理结果与旧reducer逐项对照；跨进程proof见native-business-reopen-v2.json。新运行路径不加载fixture/bootstrap/Playwright/仓库session工具。源码4增、89源中85旧源不变。v1测试共享policy被负例污染已改为逐例复制；独立v1将对象键排序误判为身份变化，v2改为集合比较并finally关闭，保留失败及核查自有broker清理证据；无规则/Skill修改，无研究卡/mine。

下一步：D3b12c2继续补完整限定域业务genesis：明确独立声明的可信导入/确认方式与来源依赖；将原有业务reducer和适配器从fixture/仓库执行环境迁出，接真实host与原界面。随后验证旧writer队列/计时器/草稿退出，审包、备份并按既有授权部署实验库。PEO评论链路只是首项，不代表完整Workspace/PEO/GTD已原生化；EVA/Meta和完整Mandala另排。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c1/review.md、source-manifest.json、native-business-reopen-v2.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T20:40:21.201211+08:00 | D3b12c2 explicit declaration import

D3b12c2已接通独立声明的一次性原生导入：真实采集的3个明确声明按原ctx身份保存，两个001仍为两个项目；另4个缺失声明保持待确认。

仅仓库隔离演练，本轮实验库与NEWERA访问均0，未部署、未接真实界面。导入须显式提交经核对的声明提案，绑定capture/source/comment哈希、评论存在性、完整ref和当前版本；无歧义且当前评论未变才可导入。旧PEO评论全文、Workspace及原始来源保留，导入后普通评论修改不改变独立声明或身份。声明导入不等于项目资格/追踪准入。旧seed和评论日志兼容，capabilities另报当前支持操作；读取/打开不自动导入。新增命令写入后的日志不能用旧程序强行回放，必须保留并用兼容程序打开。完整业务初始化、原UI/host、旧writer退出仍未完成；fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

新声明测试10项、既有原生业务回归13项、原Workspace回归17项和独立反例7项通过，共47项；独立核查见review.md和implementation-proof.json。旧声明解析器纯函数经逐项对照；三个声明跨进程重开、原7ctx身份和来源不变，旧D3b12c1 journal兼容。源码3改2增、91源中86旧源不变；原seed/评论语义、N1/N2存储算法和原插件未变。无规则/Skill修改、无研究卡/mine。

下一步：D3b12c3补齐限定域来源依赖及跨域业务初始化，把原有Workspace/PEO/GTD和集合卡/行动台的业务reducer与适配器从固定测试数据/仓库环境迁出；独立声明缺失者保留待确认，不能从标题猜测。随后接原界面host，验证旧writer队列/计时器/草稿安全退出，再审包备份并按已有授权部署实验库。NEWERA不访问；EVA/Meta与完整Mandala独立排期。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c2/review.md、source-manifest.json、declarations-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T21:15:48.115663+08:00 | D3b12c3 domains and GTD association

D3b12c3已实现9份捕获业务文档的原生初始化，并按原固定ID验证集合卡—行动台关系；新增显式GTD项目ID关联，仓库演练中3个ctx与3个GTD项目可可靠保存并跨进程重开。

仅仓库保留采集与隔离演练，本轮两实际库IO0、未部署。4张集合卡、1条行动台关系链、6条GTD记录/4个项目原样保留，不按同名或编号猜GTD关联。显式关联仅登记身份，不证明标签/笔记/关键词归属，不改原业务行。7处Workspace/Collection笔记绑定对应6条唯一路径，正文及Mandala周追踪未采集，GTD笔记依赖未知，3个optional缺省不替换为空对象；环境态和未知字段作为原始证据保留，尚未开放对应业务编辑。旧seed及评论/声明日志兼容；新增命令必须由兼容读者回放，禁止删记录迁就旧版本。fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false；原UI/host与旧writer退出待完成。

新域初始化测试10项、声明回归10项、评论业务回归13项及独立反例8项通过，共41项；核查见review.md/implementation-proof.json。原始来源与7ctx身份保留，三关联跨进程proof见domains-reopen.json。源码4改2增、93源中87旧源不变；既有声明测试仅按已审窄增更新当前能力列表，其历史coverage断言不改。未改变原插件/N1/N2存储算法，无规则/Skill修改、无研究卡/mine。

下一步：D3b12c4按限定试用范围补齐缺失来源依赖，先明确需要采集的关联笔记和周追踪文件；然后继续将业务reducer/资格服务接到原生数据，区分环境态与业务态并接原UI host。GTD身份关联不等于资源归属；未关联项目保持待选择。验证旧writer队列/计时器/草稿退出后，再审包备份并按已有授权部署实验库。NEWERA不访问；EVA/Meta及完整Mandala另排。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c3/review.md、source-manifest.json、domains-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T21:38:02.338640+08:00 | D3b12c4 bounded dependency capture and native import

D3b12c4已补齐6份直接绑定笔记和Mandala周追踪来源，共7文件9100字节；按独立digest显式导入原生演练，原7ctx、9域文档及3条GTD身份关联保持不变，跨进程重开一致。

仅实验库限定只读补采，binding及18个旧来源两轮hash/存在性一致；无实际库写入，NEWERA访问0，未部署。7绑定对应6笔记，补充包保留原字节、缺省和未知字段；读取错误不冒充缺失，路径别名/越界/大小写碰撞拒绝。补充导入独立state.dependencies，不改变旧seed、capture、domains snapshot或历史coverage。两轮一致不是原子快照，原来源hash不证明以后仍未变。周追踪保留为证据，资格未评估；GTD笔记/正文链接及完整依赖闭包未覆盖。未开放笔记/周追踪编辑、全域业务、原UI/host或旧writer退出；fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff仍false。

新依赖测试8项、域回归10项、声明回归10项、采集回归11项、旧导入回归14项通过，共53项生产者测试，加7项独立反例共60项通过；核查见review.md/implementation-proof.json。source-manifest记录95源，6改2增、87旧源不变；两个旧测试仅更新当前capabilities断言，历史seed/replay不改。初次preflight语法/路径错误已修复并保留失败证据，v2采集4项通过；独立审查发现Windows设备别名缺口，已窄修regex并通过4项定向复验；回归生成的旧路径proof已另存本批并恢复到前轮原hash。N2算法/原插件不改，无规则/Skill/研究卡/mine修改。

下一步：D3b12c5继续将原有资格服务和业务reducer接到原生数据，明确周追踪节点到ctx的原ID关系以及停止追踪规则；再接原Workspace/PEO/GTD界面host并验证旧writer队列/计时器/草稿安全退出。限定直接依赖采集不等于全依赖闭包；GTD笔记及EVA/Meta/完整Mandala另排。包审查与回滚准备完成后按既有授权部署实验库，NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c4/review.md、source-manifest.json、dependencies-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T23:08:48.320963+08:00 | D3b12c5 native qualification and tracking

D3b12c5已将既有资格语义和开始/停止/恢复追踪接入原生内核：3个已有项目资格可读，停止目标后2个、恢复后3个；固定ID、原数据和GTD关联保持，跨进程重开一致。

仅仓库演练，本轮两实际库IO0、未部署、原界面未改。资格以完整Workspace载体、已导入非9xx声明、active生命周期及active追踪共同判定，目标桶/计划行/名册/GTD关联单独存在均不授予资格。缺失来源返回unavailable，版本/来源/引用/状态歧义拒绝而不修源；旧alias不自动合并。明确tracking.set才创建native tracking工作副本，保留原capture/dependencies/domains历史快照和正文；只更新目标节点、上层计划标题/时间及当周名册，未知字段/其他项目/历史周保留。采用既有UTC-v1演练日历，真实host本地moment日历适配待做。actionWriteAuthorized/heldGrantAttached/realHostAttached及fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

原生追踪10项、原追踪回归17项、依赖回归8项、声明回归10项、域回归10项通过，共55项生产者测试，加独立9项共64项通过；独立核查及反例见review.md/implementation-proof.json。直接原setter对照覆盖空标题回退、节点清空与名册历史时间回退，旧setter会trim已有计划非目标正文并补空串的副作用已显式收窄，已有plan仅标题/更新时间变更，正文空白与缺失性保留，BLOCK-v1及修正证据留存；UTC跨时区/跨年稳定；资格与原snapshot候选ID对照一致。源码5改3增98源，90旧源不变；2个normalizer保留冻结原来源hash，生产路径无VM/bootstrap/fixture，旧原插件/N2算法不改。备份启动曾因review格式断言失败，新文件草稿误先生成但无旧源码写入，移入results后完成正式备份再生成，详见backup-sequencing-note；旧回归proof已定向写本批，无历史proof覆盖。无规则/Skill/研究卡/mine修改。

下一步：D3b12c6继续将原Workspace/PEO可靠创建、元数据和生命周期业务接入native store，并复用原接口准备UI host；按已保留数据逐项检验完整引用、原业务语义和防丢。资格证据不等于held行动写入许可；GTD全业务、真实host日历/loaded版本、旧writer队列/草稿退出仍待补齐，完成审包和回滚准备后按已有授权部署实验库。NEWERA不访问；EVA/Meta/完整Mandala另排。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c5/review.md、source-manifest.json、tracking-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-09T23:42:27.348481+08:00 | D3b12c6 native new-project business

D3b12c6已接通仓库原生新项目的创建、信息修改和Kill/恢复，并与既有追踪/资格服务闭环：创建后8个身份，追踪后4个有效项目，Kill后3个、恢复后4个；改名/改编号保留固定ID，跨进程重开一致。

仅仓库新项目业务演练，本轮两实际库IO0、未部署、原界面未改。仅新建且未关联GTD/NAW的native项目可修改元数据/生命周期；旧imported项目和共享项目均明确拒绝，等待ownership接入。创建保留原Workspace条目结构、备注原文、PEO重要程度规则；声明独立字段不写评论。ctx使用scope/vault/request派生UUIDv8，创建来源由资格/GTD消费者验证；保留旧7身份和capture/域/依赖快照，历史seed覆盖不改。创建不自动追踪、不授予行动写入资格、不创建GTD/Collection资源。元数据仅标题/声明/重要程度及既有追踪上层计划标题时间；Kill/恢复只改目标生命周期，保留未知字段及其他行。真实host日历、UI和输入草稿/旧writer退出均待做，readyForHandoff/fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced保持false。

项目业务13项、原Workspace/PEO回归38项、追踪回归10项、声明回归10项、域回归10项，共81项生产者测试，加独立9项共90项通过；独立测试/核查与重开见review.md/implementation-proof.json。直接原Workspace创建及PEO重要程度/生命周期oracle对照；显式证明旧lifecycle全表normalize会trim/drop unknown，native只更新目标并保留原始内容。固定ID、重复001、原文/历史保留、来源伪造/冲突/共享拒绝、CAS/重试、host lease及unknown均有证据。早期预检time反例未改变真实结果，测试修正为已有tracking plan后核验时间影响resultHash，前轮失败tap保留。源码7改2增100源，91旧源不变；生产路径无VM/bootstrap/fixture，N1/N2和旧插件算法不改。旧proof定向输出本批且原hash保持；无规则/Skill/研究卡/mine修改。

下一步：D3b12c7补齐既有项目及共享项目的ownership证据和元数据/生命周期事务，再接原Workspace/PEO界面host及可靠输入草稿，验证loaded版本/真实日历和旧writer退出。当前native新项目API不是全量试用入口；GTD完整业务/行动写入许可与EVA/Meta/完整Mandala另待接入。完成限定试用审包与回退准备后按既有授权部署实验库；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c6/review.md、source-manifest.json、projects-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-10T00:16:09.799668+08:00 | D3b12c7 native shared ownership and PEO state

D3b12c7已接通原生内核中既有/共享项目的显式资源归属登记、PEO重要程度修改和Kill/恢复：三个项目按固定身份登记，两个001不合并；有效项目3→2→3，持久化与跨进程重开一致。

本批两实际库IO0、未部署、原界面未改。登记需显式GTD项目/标签/三组关键词，验证独占页签、原声明/单项目组证据、NAW双向关联和不可变身份；登记不修改载体。重要程度和生命周期仅更新目标PEO字段；Kill不是GTD归档，不停止追踪、不删除行动卡关系。共享改名仍不可用：当前依赖包缺GTD项目笔记内容或已确认不存在证据，不能保证改名后笔记定位。哈希是事务一致性证据，不是授权签名。原C6新建项目与共享操作边界保留；actionWriteAuthorized、readyForHandoff、fullBusinessGenesis、originalUIAttached、authorityActivated、writerQuiesced保持false。

既有项目13项、C6项目/追踪回归23项、声明/域回归20项、原Workspace/PEO集成17项，共73项生产者测试；独立10项，共83项通过。直接原PEO方法对照，覆盖重复编号、显式ID、未知字段/原文/历史保留、双向NAW拒绝、来源伪造/资源共享/别名/陈旧登记、CAS/重试/lease/unknown及新进程重开。源码6改4增104源，94旧源不变；C6旧日志snapshot/qualification不变，历史proof哈希保留。独立核查发现并修复了null登记表、外来登记证据缺字段和负生命周期版本三项拒绝边界，失败证据保留，最终回归通过。无规则/Skill/研究卡/mine修改。

下一步：D3b12c8先对实验库GTD项目笔记定位/引用作有界只读取证，补齐内容或不存在证据，再接共享元数据改名。随后接原Workspace/PEO界面host、可靠输入草稿、真实日历/loaded版本与旧writer退出；完成限定试用审包和回退后按既有授权部署实验库。NEWERA不访问。GTD完整业务/行动写入许可及EVA/Meta/完整Mandala另待接入。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c7/review.md、source-manifest.json、existing-projects-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-10T00:42:07.156206+08:00 | D3b12c8 GTD candidate note evidence and native import

D3b12c8已将三个GTD项目的候选笔记正文（279字节）和另一项目的确切路径缺失记录，经过只读双轮核对后可靠导入原生内核；原文、typed项目ID、路径角色与旧数据保持，跨进程重开一致。

本批实验库仅只读采集：正式60次读取/30唯一路径，初查5次；运行库写入0，NEWERA IO0，未部署、原界面未改。候选笔记不等于已确认身份，确切路径缺失不等于全库没有同名笔记。原GTD按名称metadataCache和ctime回退尚待真实host验证；当前包不模拟全库解析、不追正文链接。state.gtdNotes独立保存，不改历史domains/dependencies/PEO/Workspace/ownership。canRename、noteIdentityAdopted、fullReferenceClosure、businessEditingReady和原authority/UI/writer/移交标志保持false。

GTD笔记11项、C7既有项目13项、声明/域回归20项、原依赖回归8项，共52项生产者测试；独立10项，共62项通过。覆盖26来源锚点、重复路径/角色、typedID、缺失与读取错误区分、unsafe名称/绑定/大小写冲突、UTF8/base64/hash/预算/来源漂移、导入最小范围、幂等/revision/lease/unknown及新进程重开；旧C7snapshot/qualification/ownership不变。源码5改2增106源，99旧源不变；历史proof哈希保留。初轮测试筛选意外匹配依赖正式包的测试，包尚未采集导致ENOENT；修正筛选并完成采集后最终通过，保留初轮证据。独立复核补出了基础路径大小写别名、依赖路径大小写别名、合并白名单超限三项拒绝反例，统一到采集与回放共用的纯校验并复测。无规则/Skill/研究卡/mine修改。

下一步：D3b12c9建立原生当前业务域变更层，保留历史捕获快照，再接共享项目元数据事务及消费者。笔记采用显式确认的路径与固定项目身份关联，保留正文和路径；原GTD项目打开入口须使用该绑定，不能继续只按新名字找文件。补引用/别名歧义、原Workspace/PEO界面与可靠草稿、真实日历/loaded版本和旧writer退出后，再按既有授权准备实验库试用部署。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c8/review.md、source-manifest.json、gtd-notes-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-10T01:59:57.905099+08:00 | D3b12c9 shared metadata transactions

D3b12c9补入共享项目笔记显式接纳和改名改编号事务：固定ctx身份、笔记路径与正文不变，当前Workspace/Collection/GTD/关键词/行动台标签原子更新，历史捕获快照保持。

仅仓库原生业务事务，两个实际库IO0、未部署、原界面未改。新增readCurrentDomains/readProjectNote给后续host消费；当前展示数据与历史证据分开。重复编号允许，完整名称/声明冲突、笔记外来占用、无来源声明、过期归属及异常嵌套结构拒绝。canRename仍不代表运行界面可用；原UI/authority/writerQuiesced/readyForHandoff保持false。

生产者80项、独立9项，共89项通过；计数来自冻结证据。源码8改3增，共109源，98旧源未变。验证三样本、两001、改名再改名/无变化、固定笔记、typed行动归属、标签和NAW更新、来源/归属/当前域异常、幂等/lease/unknown/新进程恢复与旧版本重放。原评论/ontology/历史追踪保留，无规则/Skill/研究卡/mine修改。

下一步：D3b12c10接原Workspace/PEO/GTD host的当前域读取与固定笔记打开，保留原UI交互，补可靠草稿恢复和旧writer退出证据；全库引用/别名歧义、真实日历与loaded版本核查后，再按已有授权准备实验库试用部署。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c9/review.md、source-manifest.json、shared-metadata-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-10T02:24:46.028962+08:00 | D3b12c10 original views read-only hosts

D3b12c10已在仓库隔离浏览器宿主中接通原Workspace/PEO/GTD的只读当前数据，复用原界面与样式，固定项目身份打开已接纳笔记。

两个实际库IO0、未部署。原界面显示当前名称/编号/标签；旧备注等历史正文保持。编辑入口在输入前拒绝，旧写入sink拒绝；宿主校验身份/revision，关闭排空迟到刷新及笔记请求。同realm重复宿主拒绝。原界面真实接入、authorityActivated/writerQuiesced/readyForHandoff均false；此轮不能作为可编辑试用包。

生产者8项、独立11项，共19项通过；浏览器15项检查通过、0页面错误。源码1改5增，共114源，108旧源未变；固定三笔记、Workspace刷新滚动稳定、跨host隔离、revision/关闭迟到/刷新排空/summary typed身份均验证。无规则/Skill/研究卡/mine修改。

下一步：D3b12c11接原Workspace/PEO/GTD的写入控件与可靠草稿恢复，随后验证旧writer安全退出及真实loaded版本；完成真实宿主核查后，按既有授权准备实验库部署试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c10/review.md、source-manifest.json、native-read-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-10T02:42:57.635837+08:00 | D3b12c11 PEO comment modal and durable drafts

D3b12c11补入原PEO评论框与原生持久草稿：逐次输入保存草稿，关闭/取消保留未提交文本，明确保存或清空才更新正式评论，恢复按固定ref。

仅仓库隔离浏览器中的原PEO CommentModal与受限宿主连接测试；未把完整C10只读主界面切换为可写，Workspace/GTD编辑仍待。两实际库IO0、未部署。已确认草稿可跨进程恢复，未确认按键不保证强退恢复；旧writer退出/真实加载版本未验证。原界面真实接入、authorityActivated/writerQuiesced/readyForHandoff均false。

生产者8项、独立14项，共22项通过；浏览器10项检查通过、0页面错误。源码3改4增，共118源，111旧源未变。草稿版本CAS、评论基线冲突、隐式清空不删除、回执丢失原请求重查、保存期间新输入保留、关闭排空和新进程恢复均验证；C9旧journal重放hash不变。无规则/Skill/研究卡/mine修改。

下一步：D3b12c12将已验证PEO评论/草稿服务接进完整C10原主视图宿主，补刷新与恢复入口稳定性；再逐项接Workspace改名/创建和GTD编辑，随后旧writer安全退出、真实loaded版本及实验库试用部署。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c11/review.md、source-manifest.json、comment-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。


## 2026-10-10T03:15:55.061151+08:00 | D3b12c12 full original main views with fixed-ref comment recovery

D3b12c12把C11评论与持久草稿服务接入完整原Workspace/PEO主视图：原PEO评论按钮按固定ref编辑，恢复入口绑定草稿原项目，确认后刷新原评论预览。

仅仓库浏览器挂载完整原视图，两个实际库IO0、未部署。Workspace其他写入/GTD编辑/真实旧writer退出仍待。仅登记的评论modal开放，其他旧写入入口拒绝；主宿主固定身份校验、分阶段关闭和失败重试不等于真实运行移交。原界面真实接入、authorityActivated/writerQuiesced/readyForHandoff均false。

生产者8项、独立9项，共17项通过；浏览器13项检查通过、0页面错误。源码1改4增，共122源，117旧源未变。原评论按钮、分组切换后固定项目恢复、原评论预览更新、Workspace滚动稳定、dirty-close失败保留/重试、同realm重挂载和新页面/进程恢复均验证。C9历史journal重放hash不变。无规则/Skill/研究卡/mine修改。

下一步：D3b12c13接原Workspace项目名称/编号编辑与可靠草稿，沿用固定身份和已验证原生共享改名事务；再补完整创建和GTD编辑。真实旧writer安全退出、loaded版本核查完成后再部署实验库试用。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c12/review.md、source-manifest.json、main-comments-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。

流程偏差已补救：备份脚本首次因核查结论格式断言失败，两份新文件过早写出；已保留至results草案，补齐备份/不存在登记后复写，旧源码未受影响。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c12/backup-gate-recovery.json。


## 2026-10-10T03:43:36.264861+08:00 | D3b12c13 original Workspace metadata editing with fixed-ref drafts

D3b12c13接入原Workspace重命名入口和原TextModal三字段编辑，按固定身份保存项目名称/编号/显示标签；隐式关闭保留草稿，显式保存复用C9共享事务并原子结束草稿。C12评论能力保留。

仅仓库浏览器验证完整原视图，两实际库IO0、未部署。完整创建/GTD编辑/真实旧writer退出仍待。逐事件草稿加全日志重放耗时明显，输入性能尚未达试用验收。未满足资格与ownership的业务保存拒绝并保留草稿；其他旧写入继续拒绝。originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

生产者10项、独立16项，共26项通过；旧评论回归16项通过；浏览器14项检查通过、0页面错误。源码3改6增，共128源，119旧源未变。原重命名入口、三字段恢复、固定身份共享改名、笔记路径保留、关闭失败重试、重挂载/新页面/进程恢复及C12评论回归均验证。C9历史journal重放hash不变。无规则/Skill/研究卡/mine修改。

下一步：D3b12c14补原主界面完整创建流程，再接完整GTD编辑。保持固定身份、原界面设计、可靠草稿和原子关联事务；试用前补草稿输入防抖/批量落盘性能验证，关闭仍强制flush；真实旧writer安全退出及loaded版本核查完成后再部署实验库。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c13/review.md、source-manifest.json、main-metadata-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。

本轮先核查计划并成功完成3旧/6新备份登记，再写目标源码；C12历史流程偏差留在原阶段记录，本轮未重复。


## 2026-10-10T03:55:48.464081+08:00 | D3b12c14 original metadata modal coalescing with forced close flush

D3b12c14完成原Workspace三字段输入的草稿合并保存前置修复：180ms停顿合并，in-flight期间只保留dirty，不逐键排任务；关闭/显式保存立即flush并确认。固定身份、原输入框和原持久事务不改。

仅仓库原WM TextModal受控transport验证，两实际库IO0、未部署。减少重复读取不等于优化单次native journal重放；本轮无新的journal端到端性能结论。完整创建/GTD编辑/真实writer退出仍待，originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

生产者8项、独立8项，共16项通过；旧UI/业务回归42项通过；原modal受控transport浏览器9项通过、0页面错误。相同60input对照reads60→1、puts均1，最新原文一致。源码2改2增，共130源，126旧源未变，native后端全未改。延迟未到关闭flush、失败重试、unknown原请求、新输入、关闭后timer均覆盖。无规则/Skill/研究卡/mine修改。

下一步：D3b12c15恢复完整创建：先规划原子Workspace/PEO、Collection专用载体、GTD/标签关键词、追踪、行动台成员及新笔记provenance，再接原主界面。继续GTD编辑与native journal输入响应性验证；真实旧writer退出/loaded版本通过后才部署实验库。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c14/review.md、source-manifest.json、coalescing-browser.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。

本轮按C13已登记性能前置项调整顺序，先独立核查并备份2旧/登记2新，再修改；完整创建未伪称完成。


## 2026-10-10T04:37:00.829625+08:00 | D3b12c15 original complete creation in original Workspace UI

D3b12c15完成原Workspace创建入口接统一事务：固定身份、根条目/PEO重要度、Workspace与Collection专用页签、GTD项目/标签关键词、追踪、行动台成员、新笔记及所有权一次创建；关闭保留三字段草稿。创建后改名和评论沿用已有服务。

仅仓库候选与新journal/原WM、PEO浏览器验证，两实际库IO0、未部署。完整GTD编辑及真实writer退出尚未完成；originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

生产者10项、独立10项，共20项通过；既有UI/业务回归135项通过；原完整WM/PEO浏览器12项通过、0页面错误，新journal fresh-process reopen一致。源码9改6增，共136源，121旧源未变。原C9捕获和旧journal保留，生成来源单独验证。

下一步：D3b12c16推进完整GTD原界面编辑接统一服务，先盘点新增/编辑/完成/归档等写入口及依赖，再验证原事务行为；同时保留原UI。真实旧writer退出与loaded版本验收完成后才部署实验库；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c15/review.md、source-manifest.json、main-creation-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。

独立计划PASS及9旧备份/6新absence登记后修改；实现、原界面和新journal分别核验。最初并行测试碰到共用C9 lease，改串行回归通过；未删除lease或修改旧journal。


## 2026-10-10T05:16:37.322138+08:00 | D3b12c16 original GTD task lifecycle

D3b12c16接通原GTD工作篮/项目根行动创建、任务内容编辑、日程/截止、完成确认与恢复，共7个操作。沿原UI和固定ID，草稿先保存、明确确认才改业务；未知结果重试同请求；项目共享改名后任务绑定保持。

仅仓库候选、新journal与原GTD浏览器验证，两实际库IO0、未部署。完整GTD评论/标志/层级/项目归档及真实writer退出仍待；originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。数字0仅后端支持，原engine会改写0，含此ID的原UI挂载会拒绝且不写业务。

生产者10项、独立20项，共30项通过；既有UI/业务回归41项通过；原GTD浏览器12项通过、0页面错误，新journal fresh-process reopen一致。源码6改7增，共143源，130旧源未变。原C9捕获和旧journal保留，生成来源单独验证。

下一步：D3b12c17推进原GTD评论/标志及后续层级、项目归档的统一事务，先盘点原入口与跨视图依赖，分批接入并保留原UI。试用前还需测量并改善原生日志回放造成的交互延迟；真实旧writer退出与loaded版本验收完成后才部署实验库；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c16/review.md、source-manifest.json、gtd-task-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。

独立计划PASS及6旧备份/7新absence登记后修改。独立核查复现关闭失败后不可恢复，修复关闭互斥/失败复位/已关闭editor移除；原浏览器又发现对象字段顺序造成草稿身份误判，改为规范化比较。修复后7项UI独立测试通过，并以最终源码重新完整运行浏览器。首次失败证据保留。数字0原UI限制如上，未改变冻结bundle。


## 2026-10-10T14:17:40.220420+08:00 | D3b12c17 original GTD comments and flags

D3b12c17在原GTD评论框与原标志按钮上接入评论保存/清空、星标、专注及淡化三个标志。共用C16固定ID/host/草稿/回执，隐式关闭保留原文，明确保存才更新；清空已有评论须确认，标志重试按显式值设置。项目和任务均可使用，项目不注册task binding。

仅仓库候选、新journal与原GTD浏览器验证，两实际库IO0、未部署。完整GTD层级/项目归档等及真实writer退出仍待；originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。数字0仅后端支持，原UI仍拒绝改写0的捕获；日志回放延迟待试用前评估。

生产者11项、独立21项，共32项通过；既有UI/业务回归18项通过；原GTD浏览器12项通过、0页面错误，新journal fresh-process reopen一致。源码8改3增，共146源，135旧源未变。原C9捕获和旧journal保留，生成来源单独验证。

下一步：D3b12c18接原GTD层级/相对创建等后续操作，先核定原语义及固定身份、跨项目归属、循环拒绝；项目归档需共享事务另行推进。试用前测量改善原生日志回放延迟，真实旧writer退出及loaded验收完成后才部署实验库；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c17/review.md、source-manifest.json、gtd-workflow-reopen.json、implementation-proof.json。Q01/Q12绿、Q02–11黄；研究卡0，CARD不改。

独立计划PASS及8旧备份/3新absence登记后修改；旧C16工作流和原评论框沿用。浏览器首个进程因测试断言需匹配原实际样式而中止，旧C9已释放后才停止，仅保留新仓库rehearsal；最终另建新journal验证，未删除lease或写旧journal。


## 2026-10-11 整体对账与功能等价性能论证落地

Observation：用户要求更新Atlas/Framework，原功能保留但可以改变实现方式提升性能。source_status：confirmed_by_user；冻结报告confirmed_by_memory；宿主刷新分类/投影循环confirmed_by_code；未实施收益inferred，真实host/完整整链仍unknown。
Update：corrects过渡页C17陈旧顶部；refines原表格仓库接线证据；splits日志字节、恢复重放、界面刷新和真实响应。FW-024/025与DQ-U01..03不关闭，入口导航同步。当前任务顺序只在活动PLAN/MATERIAL_AUDIT，本记录不是next-action。周追踪/日课/元表格常用意义保留；三个退役插件仍排除。
Trace：读framework entry-index/update-protocol/question-map/registry及Atlas README/schema/index/log/unknowns/过渡页和活动计划。更新8长期页；不改代码/Skill/runtime、不新增研究卡/经验卡、不mine。完整来源在过渡页，备份/hash/独审见 results/daqian-unified-core-20261006/atlas-framework-update-20261011 和 memory/obsidian-plugin-system/change-records/20261011-atlas-framework-core-performance.md。

## 2026-10-13 统一主键管理、永久身份与宿体对账

Observation：用户追问集中管理宿体与剩余计划，并要求更新Atlas/Framework。confirmed_by_user仅包括统一管理需求及大千P1停止/恢复证据；confirmed_by_code为已部署项目域管理/改名恢复；独立轻量宿体为inferred建议，永久身份生产接入及新改名原生验收仍unknown。

Update：corrects旧registry既成事实、项目域限定与rename deferred、Workspace范式关键词改名范围；splits对象subject、描述符及宿体；refines项目写入口与双域资格；adds_unknown CKM-U01～03/FW-026，FW-010更新证据入口。详情统一在[统一主键管理与宿体](knowledge/unified-context-key-management.md)。Framework只维护问题/导航/trace，不复制排期；不改Skill、运行插件、业务JSON或旧大千sealed项目。

Trace：prior包括entry-index/update-protocol/schema、两主键知识页、术语、contracts、工作流与unknowns；证据为本项目已审源码、部署receipt与用户陈述。14长期页修改前字节备份、hash与独立核查证据在 `results/context-key-bus-management-20261012/atlas-framework-update-20261013/`；工程事实另记change-record，不新增研究卡或MemPalace经验卡。

## 2026-10-13 Kill/9XX 资格漂移更正与地址退役部署

Observation：用户确认 Kill 只作历史诊断、不作资格条件，按 PLAN 最新执行并部署。source_status：confirmed_by_user（方向）+ confirmed_by_code（tracking-only-v2 候选、RELEASE-RECHECK PASS、deployment.json）。
Update：corrects —— EOCK 公式/claim、contracts、glossary、index、api-registry、context-capsule-key、mandala/PEO 插件页、工作流页、统一管理页、unknowns CKM-U03、FW-019 去除 non-Kill 与 9XX 归档门禁；PEO/contracts 的 9XX 托盘节标 superseded；新增同日地址退役节（含“PEO 回看→owner 按需历史，不全局广播”）。
Trace：备份 state/backups/eock-kill-9xx-drift-docs-20261013-054551；工程记录 change-records/2026/2026-10/20261013-address-retirement-release.md。native 验收待完成，FW-019/026、CKM-U01～03 保持开放。

## 2026-10-13 N1 Workspace 原生只读回看

Observation：用户反馈 owner 历史回看界面简陋；选择原生界面只读回看、先 Workspace。Update：refines 统一管理页（停追历史回看的 owner 侧呈现）。Trace：change-records/2026/2026-10/20261013-workspace-native-history.md；FINAL-REVIEW PASS。可复用经验候选（deferred）：视图级"会话覆盖层 + 捕获围栏 + 外部入口先退出"模式，待 N2/N3 复用后再沉淀为经验卡。

## 2026-10-13 N2 Collection 原生只读回看

Update：refines 统一管理页。Trace：change-records/2026/2026-10/20261013-collection-native-history.md。经验候选（deferred，N3 后沉淀）：owner 视图历史回看三分法——UI 入口方法体内拒绝 / 不触及会话的外部写入 SAFE / 改变显示的定位与桥接先退出并兜底重绘；判定依据是"写入是否会携带会话值"。

## 2026-10-13 G1 GTD 简化

Observation：用户确认 GTD 界面状态持久化不再需要、state-capsules 已不用。claim（confirmed_by_code）：GTD 视图上下文自动化本就关闭，日常成本是每次引擎启动重写 GTD_ViewState.json 与 localStorage 读写；已删除并改为内存态，胶囊桥接口退役。Update：adds_unknown GTD-U01（大千实验快照补丁风险）。Trace：change-records/2026/2026-10/20261013-gtd-simplification-g1.md。经验候选（deferred）：评估性能前先核对功能开关的实际取值，避免把关闭路径的成本算成日常成本。

## 2026-10-13 N3 GTD 原生只读回看

Update：refines 统一管理页（三 owner 原生历史回看完成）。Trace：change-records/2026/2026-10/20261013-gtd-native-history-n3.md。经验候选（deferred，待原生验收后沉淀为经验卡）：owner 原生只读历史回看的通用模式——会话只在内存、写入分「UI 入口无视深度拒绝 / 底层写入按外部调用深度放行」两级、导航意图先退出、取引擎意图保留、复用活视图前按文件修订号判新鲜度且只刷新自写文件。

## 2026-10-14 新增 NAW 插件页

Observation：用户问"下一步行动台插件现在起到什么作用"，并曾因只重载 Collection 遇到"未知行动操作"。claim（confirmed_by_code）：Hub 的"下一步行动台"入口指向 Collection 行动视图；NAW 作为该视图的行动元数据服务（别名/完成/标签/行动结构/行动台名称 + 资格转查），独立视图仍在但非主入口。Update：adds plugins/next-action-workbench.md；adds_unknown（页内未决）：是否并入 Collection、独立视图是否仍在用。Trace：change-records/2026/2026-10/20261014-collection-action-tags.md。


## 2026-10-21 EVA bottleneck evidence + P2-E

Observation：用户报告新增下一步待办后卡顿，并请求以 Atlas 和 Framework 为参照分析 EVA。claim（confirmed_by_user+code）：Collection 每次 render 都会触发 EVA 全量 adapter 刷新；内容有变化时还会触发 38 MB 全量保存和 changed 广播。Update：EVA 插件页新增 2026-10-21 节（contradicts 09-29 的暂缓判断），context-key-manager 页新增 P2-E 节，FW-024/FW-026 记录进展。Trace：results/context-key-bus-management-20261012/naw-freeze-analysis-20261021.md。

## 2026-10-21 ATOM/EVA 分支树/索引器只读评估 + PEO-TV1 预审

Observation：用户问 ATOM 侧栏与 EVA 分支树是否经 EVA 绘制。claim（confirmed_by_code）：ATOM 侧栏只用 Dataview；EVA 分支树只读 eva-incremental-indexer 的 EVA_Notes.json，与 eva-cross-view-relations 无关；索引器每次 ATOM 保存整写约 54 MB。Update：eva-branch-sidebar 页新增上游写入频率节；FW-024 记录。PEO-TV1 设计预审 BLOCK（providerGeneration 说法错、漏 GTD），待原生归因。Trace：results/context-key-bus-management-20261012/atom-eva-indexer-review-20261021.md、peo-tv1/PEO-TV1-PREFLIGHT.md。


## 2026-10-21 PEO-TV1 原生归因与实现；新增 eva-incremental-indexer 页；IDX-W1 入计划

Observation：TV-ATTRIB 探针证实 PEO 追踪可见性派发全部为 30 s 年龄路径假变化；索引器编辑时 19 s 整写约 430 MB。Update：project-execution-overview 页新增 PEO-TV1 节；新建 plugins/eva-incremental-indexer.md 并入 index；FW-024 记录。用户决定把频繁写盘列为 PEO-TV1 之后的工作包 IDX-W1。Trace：results/context-key-bus-management-20261012/peo-tv1/、atom-eva-indexer-review-20261021.md。


## 2026-10-21 系统演进史页与工程变更记录目录

Observation：用户问是否有忠实记录整个系统发展的东西，并要求做目录（A）与演进史（B）。Update：新增 `scripts/change_records_index.py`（只读扫描 873 张记录卡，生成 `memory/obsidian-plugin-system/change-records-index.md`，放在 change-records/ 之外以免挤占 Atlas 检查脚本的“最近记录”名额）；新增 knowledge/system-evolution.md（六阶段归纳，status summary）并入 index。发现（经独立核查更正）：223 张记录卡无 frontmatter、85 张在根目录；10-11 起无 frontmatter 约 63 张（子目录 32、根目录 31），另约 81 张缺必填字段。独立 verifier：results/system-evolution-verification-20261021.md（PASS_WITH_ACTIONS，已按 9 条修订）。


## 2026-10-21 PEO-TV1 原生验收（部分）与 SYNC-BUS 立项

Observation（confirmed_by_user，TV-VERIFY）：TV1 部署后 676 s 内派发 0 次；卡顿转为后台重算中的主键导航重建（起始长任务约 3 s）与高频查询（约 16 万次）。claim（confirmed_by_code）：导航只在 PEO 自身写入时失效，其余靠 30 s 年龄。Update：Framework 新增 FW-027；PLAN 新主线 SYNC-BUS（S0–S4），S1 PEO-TV2 设计预审中；BUS-R 盘点草稿。停止/恢复追踪原生补测待做。Trace：results/context-key-bus-management-20261012/peo-tv2/、sync-bus/。

## 2026-10-22 S2-A1a 仓库候选推进

Observation：Collection/Workspace同步键列表和render内async刷新仍回到旧PEO导航。Claim（refines，confirmed_by_code）：要消除查询触发计算，键目录与追踪状态须来自同批快照；unknown不授予active或写资格，静默续租不能只信任旧timer。A1a同批12字段目录+纯frame完成并独立代码终审PASS；真实消费者接线未做。87项+6变异及前批回归通过，日常/实验22唯一源码未变；无部署。PLAN、审计/续跑/STATUS、PEO/MapReduce、FW-027/BUS-U02已同步；运行API registry不提升。下一门按PLAN冻结真实Collection UI/history/lifecycle接线。证据：s2-a1/DELIVERY.md、FINAL.md；工程记录20261022-sync-bus-s2-a1a-directory.md。


## 2026-10-22 S2-A1b Collection 候选证据

- observation：Collection实际view的同步键目录/逐标签读取及渲染内refreshSoon会走旧导航；本批将其接入A1a同批快照并与生命周期需求调度分开。
- claim / source status：仓库源码候选与方法级模拟DOM/时钟测试支持“该view每同步render一份快照，旧查询计数0”；未部署，不是原生性能结论，也未提升运行协议登记。
- update target / Bayesian label：**refines FW-027 / BUS-U02**。查询纯读还须配合unknown保留画面、输入保留、加载隔离和跨await跳转复核；“不清DOM”同时要求保存期间禁用原输入控件。弹窗关闭早于其调用方业务完成，不能据此自动换源。
- trace：`results/context-key-bus-management-20261012/sync-bus-r/s2-a1b/PREFLIGHT.md`、`main.diff`、`test-results.json`、`verifier-final-extra.cjs`；本批独立终审PASS，见同目录 `FINAL.md`；仍仅仓库候选。唯一执行次序以 `state/PLAN.md` 为准。
- 未关闭：Workspace/GTD/九宫格/State Capsules真实接线；全owner内容版本/漏事件；原生输入、滚动、历史跨插件跳转及创建首次/恢复耗时。30秒lease fallback仍可能构建完整导航，底层flight不支持取消；并非空闲零计算。


## 2026-10-24 r30主键目录提前续期与待核验自愈（历史阶段）

observation：r29后项目主键可见（confirmed_by_user），但Collection/GTD/Workspace周期待核验、冷启动慢；SuperMemo实验库只读（schema 2）。claim：目录截止受owner凭证剩余寿命限制且到期才重建、导航按年龄冷重建（confirmed_by_code）；SuperMemo业务内容在跨库共享localStorage（confirmed_by_code+user）。update_type：corrects/refines；targets：Atlas PEO、四消费者页、SuperMemo页、unknowns BUS-U04/SM-U01；Framework FW-027与维护日志。原生效果pending。证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r30-directory-renewal/README.md、FINAL-INDEPENDENT.md。


## 2026-10-25 r31导航构建阶段守卫与凭证分离（历史阶段）

observation：r30 后冷启动仍极慢、长构建反复作废；用户提出 Console 固定命令+自动回读的协作方式（console-bridge）。claim：导航阶段沿用会过期的追踪凭证导致长构建必然作废（confirmed_by_code + 原生采样）。update_type：corrects；targets：Atlas PEO 页、unknowns BUS-U05；Framework FW-027、维护日志。原生收益 pending。证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r31-nav-phase-guard/README.md、FINAL-INDEPENDENT.md；results/context-key-bus-management-20261012/console-bridge/。


## 2026-10-25 r32 EVA适配器刷新中不再使目录不可读（历史阶段）

observation：r31后冷启动显著改善（confirmed_by_user），GTD横幅常驻、Tab点击无反应。claim：EVA适配器刷新同步置health pending、PEO读取检查要求ready导致消费者循环待核验（confirmed_by_code）。update_type：corrects；targets：Atlas PEO/GTD/EVA页、log；Framework FW-027、维护日志。原生pending。证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r32-health-pending/README.md、FINAL-INDEPENDENT.md。


## 2026-10-25 r33 创建风暴修复与换行缺陷修复（当前有效）

observation：新建主键卡、创建后长时间待核验（confirmed_by_user）。claim：创建写入/核验事件放大 PEO 重建、续跑全量重验（confirmed_by_code+原生）；构建工具文本模式写入改换行（confirmed_by_code，经规范与实测无运行时影响）。update_type：corrects；targets：Atlas PEO/GTD 页、unknowns BUS-U05、log；Framework FW-027、维护日志。原生 ACC-4 已确认主要收益。证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r33-creation-storm/README.md；results/context-key-bus-management-20261012/console-bridge/out/acc4-1792939351695.json。
