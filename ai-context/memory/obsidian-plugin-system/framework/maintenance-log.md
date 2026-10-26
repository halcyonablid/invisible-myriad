# Framework Maintenance Log

## 2026-10-22 S3-A3 发布端候选证据

Framework/Atlas update check: updated。Observation：用户要求继续并保持PLAN/Atlas/Framework一致。Claim：真实聚合链存在隐含sync getter→旧ensure反馈，新增observer路径必须传入冻结别名；最终发布前应清除外来迭代器副作用并复核代数。source_status=confirmed_by_code（候选/隔离测试）；update=refines。非原生性能结论，非运行API升级。

Targets：PEO页、MapReduce页、BUS-U02与FW-027。主线顺序只在state/PLAN.md；未改Skill/契约registry或日常/实验vault。Trace：results/context-key-bus-management-20261012/sync-bus-r/a3/，工程记录20261022-sync-bus-r-a3-publisher.md。消费者、全owner修订号和原生延迟仍open。

## 2026-10-22 修订号候选与运行基线回归

Framework/Atlas update check: updated。Observation：用户要求继续实验推进、Mermaid路径、回归唯一PLAN并同步Atlas/Framework。Claim：当前日常/新实验PEO已回到d0ebcaeb，旧TV部署描述只保留历史；A0/A1候选证据与实际运行协议分离，A2源码接线仍未部署。source_status=confirmed_by_user（范围）+confirmed_by_code（冻结磁盘与候选），性能unknown。update=corrects+refines。

Targets：Atlas PEO页校正环境，MapReduce页落成熟版本/写settlement边界，unknowns登记BUS-U01～03；Framework FW-027/024只维护问题/证据，不复制执行计划。PLAN包含唯一当前次序与Mermaid。S1.5调查暂停，不宣称创建超时已修。

Trace：results/context-key-bus-management-20261012/sync-bus-r/a2/PROPOSAL.md、PREFLIGHT.md、NAV-DEPENDENCIES.md、candidate-manifest.json；工程记录20261022-sync-bus-r-a2-host.md。Skill/规则不变，运行contract/API registry不升格；真实实验接线验收后再更新协议状态。

## 2026-10-03 Mermaid query/traversal performance candidate

Framework/Atlas update check: updated / refines, FW-005/FW-011/FW-024. [Mermaid Atlas](../atlas/plugins/mermaid-floating-widget.md) records the bounded v0.1.27 repository implementation: per-traversal adjacency reuse, mutation-aware in-memory prefix search and default-off Console sessions. Numbering, graph order, folding/click identities, persistence schema, startup integrity and prewarm isolation remain unchanged. Reports separate cold/warm queries, cache state, prewarm and unfinished spans; closed/late work cannot enter a new session. First build and incremental maintenance costs remain visible. Synthetic equivalence and inherited duplicate-number downstream timeout are documented separately from native unknowns; no workflow speedup claim. Runtime deployment/native reload are pending. Trace: [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-307)（外部来源未随包提供）. No Question Map, Skill or owner-contract change beyond additive diagnostic API.


## 2026-10-03 Mermaid Floating Widget performance audit

Framework/Atlas update check: `updated`, update `refines`, related FW-005/FW-011/FW-024. Current three-way aligned runtime code and synthetic production-function work counts support bounded optimization candidates in [Mermaid Floating Widget](../atlas/plugins/mermaid-floating-widget.md). Preserve the existing [numbering semantics](../atlas/knowledge/mermaid-address-semantics.md); do not equate state-transition levels with ATOM sidebar format colors. Separate historical 161-node SVG timings, current static facts, synthetic counts and unknown native timing. Existing July scroll/prewarm isolation and dirty-asset maintenance remain prior work. No Mermaid implementation, cache, setting, ownership or Skill change; no Question Map status change. Independent review precedes landing; documentation backup: `state/backups/mermaid-audit-docs-20261003/`.

## 2026-10-03 ATOM v1.0.4 approved deployment

Framework/Atlas update check: `updated`; `supersedes` deployment-pending status, no control-plane model change. User approved copying reviewed main/manifest/README to NEWERA and mirror. Fresh byte backup and exact source/target drift checks preceded copying; all three now match including unchanged styles. Enablement and templater sentinels unchanged. [ATOM sidebar](../atlas/plugins/atom-note-sidebar.md) contains the durable status; `state/backups/atom-color-deploy-20261003/` contains hashes and rollback bytes. Native reload/interaction pending; no app restart or plugin reload performed.

## 2026-10-03 ATOM format correction candidate

Framework/Atlas update check: `updated`, `corrects` + `refines`, FW-004. Narrow implementation and user operating assumption are recorded in [ATOM sidebar](../atlas/plugins/atom-note-sidebar.md#2026-10-03-v104-same-level-format-correction). Same-level numeric suffix formats unify without persistent mapping; ordinary A/B additions do not replace the representative according to the user. Sort-token caching was tested and rejected for mixed-prefix regression. Repository-only candidate, no runtime/mirror deployment or native-host acceptance claim. Existing ownership and control-plane rules unchanged. Backup/evidence: `state/backups/atom-color-fix-20261003/`, `state/staging/atom-color-fix-20261003/`.

## 2026-10-03 ATOM numbering and inherited-color clarification

Framework/Atlas update check: `updated`; `corrects` + `refines`, existing FW-004. User clarifies method A stays at the same level, B descends, and colors should inherit existing paradigm colors while remaining stable as notes are added; user describes recursive traversal. The [ATOM Atlas page](../atlas/plugins/atom-note-sidebar.md#subsequent-user-clarification-numbering-and-inherited-colors) records template/script evidence resolving suffix-depth uncertainty and distinguishes original iterative grouping from recursive tree traversal or cross-rebuild color memory. This supersedes the preceding unknown and any fresh arbitrary depth-palette suggestion. Implementation and historical-color conflict policy remain undecided; no runtime, rule, Skill, ownership or schema change. Independent narrowed-plan PASS; byte backups and before/after hashes in `state/backups/atom-level-color-contract-20261003/`.

## 2026-10-03 ATOM address color explanation

Framework/Atlas update check: `updated`; update label `refines`. Read entry-index, registry, Question Map, update-protocol, Atlas entry/index/terminology and ATOM plugin prior. Narrow code claims and the user's two-row same-color expectation are recorded in [ATOM sidebar](../atlas/plugins/atom-note-sidebar.md#2026-10-03-address-format-colors-versus-semantic-depth). Format shape is distinct from semantic depth; letter-suffix depth remains unknown. Existing FW-004 applies; no new control-plane rule, Question Map entry, Skill change, or runtime write. Independent plan verifier PASS; documentation backup: `state/backups/atom-color-explanation-20261003-1790991045469/`. Isolated projection and three-way disk hashes are evidence, not loaded-host acceptance.

## 2026-08-23 - SuperMemo Antinet Runtime Deployment

- The user explicitly confirmed deployment of the verified SuperMemo Concept Display `0.3.0` candidate.
- Runtime and Repository Mirror now align with Repository Dev across the eight-file allowlist; Runtime/Mirror syntax checks and feature sentinels pass, and existing `data.json` bytes remain unchanged.
- Deployment backup: `state/backups/supermemo-antinet-deploy-20260823-001500/`. Loaded Obsidian UI smoke remains pending reload.
- Framework update: `updated`, Bayesian label `reinforces`; no new owner, provider or Question Map entry.

## 2026-08-22 - SuperMemo Antinet Move and Parent Search

Reason:

- The user needed a structure node and its descendant branch to move together, with a searchable parent-node picker for large trees.
- The implementation changes only the moved node's `parentId`; it excludes self, descendants and archived targets, preserves top-level/current-parent choices during filtering, and rejects archived source nodes.

Evidence:

- Repository Dev `0.3.0` code and focused model/UI regressions pass.
- Runtime and Repository Mirror remain unchanged pending explicit deployment confirmation.

Bayesian update: `refines` the existing tree topology and non-destructive mutation claim; no new owner or Question Map entry.

## 2026-07-29 - Route Mandala Cross-Surface Identity Navigation

Reason:

- The user needed the same goal/project primary key to remain easy to locate when moving between weekly observation and current vertical management.
- The implemented behavior is durable evidence for the existing integrated-primary-key model, but it does not create a new owner, protocol, or framework-level control question.

Actions:

- Routed the substantive UI and workflow claim to the Mandala Atlas plugin page and planning-record-execute-review workflow.
- Recorded the deployment and verification evidence in Atlas log and an engineering change record.
- Kept Framework Question Map, registry, unknowns, glossary, aliases, Skill, and rules unchanged.

Bayesian update: `refines` the existing primary-key continuity model; no macro-framework model change.

Boundary:

- Weekly history and current execution plans remain separate projections with separate semantics.
- No business JSON, schema, bridge, API, event, command, or cross-plugin ownership changed.

## 2026-07-24 - Register Exit Discoverability And No-Ghost-Data Guard

Reason:

- The user clarified that lifecycle exit must not leave inactive records as invisible storage residue.
- Exited projects/goals must stop burdening current work while remaining historically reviewable.

Actions:

- Routed the mature lifecycle principle into the Atlas system map, lifecycle contract, Project Overview page, and planning/history workflow.
- Added FW-018 and an Atlas unknown for a possible read-only unified retired-primary-key archive.
- Added a design card preserving the user's no-ghost-data requirement and the boundary between current cleanup and historical memory.

Bayesian update: `refines` current lifecycle/history claims and `adds_unknown` for unified cross-owner discovery.

Boundary:

- Current owner-specific paths are real: Project Overview Kill Mode, Mandala historical weeks/closeout, and Timeline retained history.
- A unified archive is not claimed as implemented.
- No plugin, API, schema, Skill, rule, business JSON, or runtime file changed.

## 2026-07-24 - Register Integrated Primary-Key Management Source

Reason:

- The user produced a long-form synthesis that connects project/goal identity, weekly records, upper-level project management, future Timeline allocation, daily lessons, and Project Overview evidence projection.
- The logic already existed in several Atlas pages, but the complete chain had no durable source entrance.

Actions:

- Registered the report in Framework registry as a durable source entrance.
- Routed substantive claims to the Atlas system map, Project Overview plugin page, and planning workflow.
- Kept Framework Question Map unchanged because the report integrates and refines established claims rather than opening a new control-plane question.

Bayesian update: `refines` the existing system model and improves source traceability.

Boundary:

- No Skill/rule behavior, API contract, runtime plugin, or business JSON changed.
- Framework stores the route; Atlas stores the synthesis; the report remains the full readable argument.

## 2026-07-24 - Close Observation-Bounded History Implementation

Reason:

- The Mandala + Timeline project completed deployment and the user confirmed the historical behavior in actual Obsidian.
- The 2026-07-23 Framework entry still separated the user-confirmed model from an unverified implementation, so the long-term control plane needed a final evidence-state update.

Actions:

- Kept the substantive implementation facts in the narrow Atlas workflow/plugin/contract/API pages.
- Promoted the originating experience card's runtime claim and linked the engineering change record.
- Closed the project-state handoff while preserving legacy partial-capture and cross-owner boundaries.

Bayesian update: `confirms` the previously registered observation-bounded record-practice model.

Boundary:

- Framework registry and Question Map are unchanged; no new durable entrance or unresolved control-plane question was introduced.
- No glossary/alias, Skill, rule, plugin code, or business JSON change was needed for this closure.
- The separate Mandala score-scroll CSS remediation is an engineering UI record and does not alter the Framework model.

## 2026-07-23 - Register Observation-Bounded Record Practice

Reason:

- The user confirmed that Mandala daily records, weekly tracking, and historical primary-key rosters are one record method at different time scales.
- The durable model needed to preserve both the user's notion of a detailed past and the boundary that only captured evidence may be called historical evidence.

Actions:

- Routed the substantive model to the Atlas planning workflow and Mandala plugin page instead of duplicating it in Framework.
- Added and registered `memory/obsidian-plugin-system/cards/2026-07-23-observation-bounded-daily-weekly-history.md` as the reusable user-practice source.
- Recorded stable identity as the continuity carrier and historical labels/comments as properties of the old time slice.

Bayesian update: `refines` the existing planning-as-cognitive-hardware model.

Boundary:

- Framework Question Map is unchanged because no new unresolved control-plane question was introduced.
- The complete historical-week roster remains an active implementation and verification concern, not a code fact established by this framework update.
- No runtime plugin, business JSON, API, rule, or Skill was modified.

## 2026-06-24 - Long-Term Framework Home

Reason:

- The first-stage framework was created during a Material Audit / Question Map project under `state/`.
- Future projects may replace or rotate the `state/` worksite.
- The framework needs a long-lived home that can survive project turnover.

Actions:

- Created `memory/obsidian-plugin-system/framework/`.
- Added entry index, registry, long-term question map, and maintenance log.
- Registered existing OPS cards as origin project cards without moving them.
- Updated top-level rules and `obsidian-system-plugin-dev` so future framework work starts from this directory.

Boundary:

- No runtime plugin files were changed.
- No OPS cards were moved, renamed, or deleted.
- `framework/` files do not enter `state/CARD_LIBRARY.md` or `card_audit`.

## 2026-06-24 - Framework Structure Guide Card

Reason:

- User asked for a detailed explanation of how Atlas, first-stage report, Question Map, OPS cards, memory cards, change records, Understand Anything snapshots, and Skill fit together.
- The framework needed a reusable guide for future requests such as "use the framework to land this plugin usage experience" or "use the framework to land this design principle".

Actions:

- Added `memory/obsidian-plugin-system/cards/2026-06-24-framework-structure-atlas-report-question-map.md`.
- Registered the guide card in `framework/registry.md`.
- Included a Mermaid structure map and a Bayesian-style update interpretation.

Boundary:

- No runtime plugin files were changed.
- No OPS cards were moved, renamed, or deleted.
- This is a reusable framework explanation card, not an engineering change record.

## 2026-06-24 - Framework Update Protocol

Reason:

- User confirmed the framework should behave like a Bayesian-style system: existing Atlas / Question Map / cards act as prior, new observations become evidence, and the framework state should update instead of producing isolated notes.
- The framework needed an explicit protocol for "用框架落一下" requests.

Actions:

- Added `memory/obsidian-plugin-system/framework/update-protocol.md`.
- Updated `framework/entry-index.md` so framework landing requests read the update protocol before updating Atlas / Question Map / cards.
- Registered the protocol in `framework/registry.md`.
- Added FW-004 to `framework/question-map.md`.

Boundary:

- No runtime plugin files were changed.
- No OPS cards were moved, renamed, or deleted.
- This protocol guides future framework updates; it does not itself modify Atlas claims except by registering the protocol path and question.

## 2026-06-24 - Project Coaching Evidence Authority

Reason:

- User corrected the MKV-A coaching read: current blockers are `工作单编写` and `培训 PPT`, not the older test-bench/HBIT issue.
- User clarified that Project Overview / 项目纵深管理 columns have different roles: Workspace is the project container, 项目纵向管理 is the upper-level project interface, 周追踪 is same-key weekly continuity, 范式积累 is facts/material/history, GTD is heuristic prompting, and Collection Card is explicit next actions.
- User also clarified that weekly tracking can be under-entered, so the coach must collect all necessary evidence and align with the user before treating a current-state claim as settled.
- User added that note-network traversal is the hardest part: from one note, the coach must understand the address, nearby notes, and relation notes without over-expanding.

Actions:

- Added an experience card for project coaching evidence authority and the alignment loop.
- Updated `atlas/workflows/project-coaching.md` from a rough priority draft to a column-specific evidence authority model.
- Updated `atlas/unknowns-register.md` and `framework/question-map.md` to record what is confirmed and what remains open.
- Updated `skills/obsidian-project-effectiveness-coach/` so future coaching uses source classes instead of flattening all plugin columns into tasks.
- Added a bounded note-network traversal budget to Atlas and COACH references, with the Gcores Antinet article as external context.

Boundary:

- No runtime plugin files were changed.
- No business JSON, cache, settings, EVA index, or Obsidian vault data were modified.
- This is a framework and Skill behavior update, with a separate engineering change record under `memory/obsidian-plugin-system/change-records/`.

## 2026-06-24 - Mermaid Address Semantics Atlas Chapter

Reason:

- User clarified that complete Mermaid numbering knowledge is a system foundation, not merely a COACH note traversal detail.
- Existing memory already contained Mermaid nested subgraph, reference graph ATOM address layout, Antinet topology order, and Gcores Antinet reference cards.

Actions:

- Added `memory/obsidian-plugin-system/atlas/knowledge/mermaid-address-semantics.md`.
- Registered the chapter in `framework/registry.md`.
- Updated `atlas/README.md`, `atlas/00-system-map.md`, `framework/question-map.md`, and `atlas/unknowns-register.md`.
- Promoted Mermaid address semantics into the Atlas layer: `ATOM@...`, `+`, `.`, `subgraph`, relation layers, graph shape stability, and AI reading boundaries.

Boundary:

- No runtime plugin files were changed.
- No business JSON, cache, settings, EVA index, or vault note data were modified.
- Historical experience cards remain source evidence; the Atlas chapter is the synthesis layer.

## 2026-06-24 - Atlas LLM Wiki Shape And Terminology Contract

Reason:

- User wanted the Atlas to remain retrievable and maintainable as it grows, referencing LLM Wiki / Karpathy-style maintained markdown knowledge layers.
- User also observed that specialized system terms can drift when future agents paraphrase them instead of preserving canonical meanings.

Actions:

- Added `atlas/purpose.md`, `atlas/schema.md`, `atlas/index.md`, and `atlas/log.md`.
- Added `atlas/glossary.md` and `atlas/aliases.md`.
- Updated `atlas/README.md`, `framework/entry-index.md`, `framework/registry.md`, and `framework/question-map.md`.
- Updated repo-local `obsidian-system-plugin-dev` and `obsidian-project-effectiveness-coach` skills to consult the terminology layer.

Boundary:

- No runtime plugin files were changed.
- No business JSON, cache, settings, EVA index, or vault note data were modified.
- Global `obsidian-system-plugin-dev` exists but was not synchronized in this step; this repository-local update records the intended behavior for this project framework first.

## 2026-06-25 - Framework Control-Plane Wiki Shape

Reason:

- User asked whether framework should also become an LLM Wiki like Atlas.
- The settled direction is that framework should be a small, strict control-plane wiki, while Atlas remains the larger knowledge-plane wiki.
- The framework needed explicit boundaries so future agents do not duplicate Atlas concept content inside `framework/`.

Actions:

- Added `memory/obsidian-plugin-system/framework/purpose.md`.
- Added `memory/obsidian-plugin-system/framework/schema.md`.
- Added `memory/obsidian-plugin-system/framework/index.md`.
- Updated `entry-index.md`, `README.md`, `registry.md`, and `question-map.md` to describe framework as a thin control-plane wiki.
- Added FW-007 to track how framework stays small and hard while leaving factual knowledge to Atlas.

Boundary:

- No Atlas knowledge pages were changed.
- No runtime plugin files were changed.
- No business JSON, cache, settings, EVA index, or vault note data were modified.
- This is framework control-layer maintenance, not Atlas knowledge-layer maintenance.

## 2026-06-25 - Keyword Symbolic Interface Knowledge Model

Reason:

- User clarified a core Obsidian-system idea: keywords are symbols and communication interfaces, while the note entries below them are signals.
- The user enters the whole library by first finding the keyword, then descending into the concrete tree position and local note network.

Actions:

- Added `memory/obsidian-plugin-system/atlas/knowledge/keyword-symbolic-interface.md`.
- Updated Atlas index, system map, glossary, keyword workflow, and Atlas log.
- Registered the new Atlas chapter in `framework/registry.md`.
- Added FW-008 to `framework/question-map.md`.

Boundary:

- The knowledge model belongs to Atlas; framework only registers and tracks it.
- No runtime plugin files were changed.
- No business JSON, cache, settings, EVA index, or vault note data was modified.

## 2026-06-25 - Context Capsule Key Strict Matching And Intentional Stance

Reason:

- User observed that same address with different label must not count as synchronization in GTD, Mandala, or Collection Card View.
- User also framed virtual Context Capsule Keys through Daniel Dennett's intentional stance: a plugin can show that it is ready to face a task even before local content exists.

Actions:

- Updated Atlas `knowledge/context-capsule-key.md` and `contracts.md`.
- Clarified the three-state UI model: `同步`, `本地`, `虚位`.
- Clarified current write boundary: Project Overview is the single identity owner; consumer-side rename propagation is not implemented.

Boundary:

- Framework records the control-plane implication; Atlas carries the concept explanation.
- Runtime plugin changes are recorded separately in engineering change records.
- No business JSON, cache, settings, EVA index, or vault note data was modified by this framework landing.

## 2026-06-25 - Context Capsule Key Provisioning And Single-Owner Edit Direction

Reason:

- User clarified that GTD provisioning should follow GTD's own project workflow: create a top-level tag named by the project name, create/reuse the GTD project at the end of the project list, and apply the tag to that project.
- User also clarified that Context Capsule Key edits should not be accepted from arbitrary consumer plugins. The identity write path is Project Overview first, then explicit sync outward.

Actions:

- Updated Atlas `knowledge/context-capsule-key.md` and `contracts.md`.
- Recorded the provisioning exception: explicit add-project workflow can create local carriers through owner APIs, while passive virtual-capsule rendering remains non-persistent.
- Recorded the single-owner edit direction: `Project Overview -> consumers` is the intended sync path; `consumer -> registry -> all consumers` is forbidden without a future audited protocol.

Boundary:

- Framework records the control-plane implication; Atlas carries the concept explanation.
- Runtime GTD code changes are recorded separately in engineering change records.
- No business JSON, cache, settings, EVA index, or vault note data was modified by this framework landing.

## 2026-06-25 - Workspace Title Fallback And Rename Sync Priority

Reason:

- User clarified that Workspace Mount inserting new project entries at the top is habitual and correct.
- Mandala Workspace weekly summary showed raw `item_m...` ids again, so the framework needs to remember this as a UI regression sentinel and cross-plugin read contract.
- User confirmed Context Capsule Key sync rename is not very practical because keys are rarely renamed.

Actions:

- Updated Atlas plugin pages for Workspace Mount and Mandala.
- Updated Atlas contracts with the Workspace Project Title Snapshot read-only fallback contract.
- Updated Atlas log.
- Updated `framework/question-map.md` and `atlas/unknowns-register.md` to demote Context Capsule Key sync-rename to low-priority deferred.

## 2026-07-05 - COACH Feynman Anti-Self-Deception Decision Module

Reason:

- User asked where COACH exists, whether it is a skill, whether it can grow into decision / personal development / self-schema coaching, and whether the provided `费曼的主张.pdf` capability can be assigned to COACH.
- The existing project coach skill is a real repo-local skill, but the broader COACH layer is a modular combination of skill behavior, Obsidian framework/Atlas memory, World Interface COACH heuristics, and future specialized coach modules.

Actions:

- Added `memory/obsidian-plugin-system/cards/2026-07-05-coach-feynman-anti-self-deception-decision-module.md`.
- Registered the card in `framework/registry.md`.
- Added FW-013 to `framework/question-map.md`.
- Updated `skills/obsidian-project-effectiveness-coach/SKILL.md` with a bounded Feynman anti-self-deception decision check while preserving its read-only project evidence boundary.
- Cross-linked World Interface construct `memory/world-interface-framework/cards/feynman-intellectual-honesty-anti-self-deception.md`.

Boundary:

- No runtime plugin files were changed.
- No Obsidian vault business JSON, settings, cache, EVA index, or user note data was modified.
- No real MemPalace mine was run.
- This grows COACH by module rather than converting the project effectiveness skill into a broad life-advice skill.

Boundary:

- Framework records the control-plane priority and maintenance implication.
- Atlas carries the plugin facts and contract details.
- Runtime plugin changes are recorded separately in engineering change records.
- No business JSON, cache, settings, EVA index, or vault note data was modified by this framework landing.

## 2026-06-26 - Context Capsule Key Rename Propagation V1

Reason:

- User confirmed that the three most common consumer plugins being coordinated is already useful.
- User requested Project Overview-originated Context Capsule Key rename propagation after confirmation, while keeping consumer-side edits local.

Actions:

- Updated Atlas `knowledge/context-capsule-key.md`.
- Recorded v1 protocol: Project Overview detects single-key comment-block renames, dry-runs Workspace Mount / GTD / Collection Card, asks for confirmation, then sends exact old/new full display labels to consumer owner APIs.
- Recorded boundary: Mandala stays read-only in v1; consumers reject non-Project Overview rename sources.

Boundary:

- Framework records the control-plane trace only; Atlas carries the protocol knowledge.
- Runtime plugin changes are recorded separately in engineering change records.
- No business JSON, cache, settings, EVA index, or vault note data was modified by this framework landing.

## 2026-06-27 - Project Overview Group Levels Return To Global Importance

Reason:

- User clarified that Project Overview `0 / A / B / C / CZ` should again mean global project importance.
- The older 2026-06-01 State Capsule-owned mixed rule no longer fits the newer Context Capsule Key model, where Project Overview is the main project identity and importance control surface.

Actions:

- Updated runtime Project Overview behavior so `0 / A / B / C / CZ` all persist in Project Overview settings.
- Project Overview now ignores historical `state-capsules` `projectExecutionOverview.groupCapsuleLevels` overlays during active capsule restore.
- Kept State Capsules API compatibility in place; no State Capsules code or business JSON was modified.

Boundary:

- State Capsules remains responsible for environment/view restoration.
- Project Overview owns global project importance grouping.
- Historical capsule group data is left untouched and can be audited later if user wants a controlled migration.

## 2026-06-30 - Recent Maintenance Sentinels As LLM Wiki Prior

Reason:

- User clarified that the recent work should be integrated into the Atlas LLM Wiki and framework-like wiki, not only recorded as separate engineering changes.
- The relevant batch included Mandala daily score views, date-aware stopped tracking, primary-key color identity, Project Overview / Collection Card projection into Mandala project plans, reveal behavior, embedded card wrapping, Antinet tree freeze protection, runtime/dev/mirror discipline, and verifier-style review.

Actions:

- Added `memory/obsidian-plugin-system/atlas/knowledge/recent-maintenance-sentinels.md`.
- Added `memory/obsidian-plugin-system/cards/2026-06-30-recent-maintenance-sentinels.md`.
- Updated Atlas index/log, Mandala plugin page, Keyword/Antinet workflow, framework registry, and framework question map.
- Added FW-011 to track when recurring Atlas sentinels should graduate into hard `obsidian-system-plugin-dev` Skill rules or automated lint checks.

Boundary:

- This is a knowledge/control-plane update, not a runtime plugin change.
- Existing runtime modifications remain documented in engineering change records.
- The Skill was not edited in this pass; the new Atlas page is durable prior, and FW-011 controls future promotion into hard rules.

## 2026-06-30 - Framework / Atlas Update Check Skill Gate

Reason:

- User pointed out that recent plugin work can modify runtime behavior while only the same-day engineering record gets written, leaving Atlas / Framework wiki updates from earlier days incomplete.
- The `obsidian-system-plugin-dev` Skill is the right activation surface for this guard because it is invoked during Obsidian plugin development, cross-plugin protocol work, runtime sync, and framework maintenance.
- The repo-local Skill and global installed Skill were not hash-identical; the repo-local Skill contained newer Atlas maintenance rules, so the repo-local Skill was treated as the current canonical candidate for this pass.

Actions:

- Updated `skills/obsidian-system-plugin-dev/SKILL.md` with a mandatory `Framework/Atlas update check`.
- The check uses three auditable outcomes: `updated`, `not_updated`, and `deferred`.
- Clarified that engineering change records, experience cards, Atlas pages, and Framework pages have separate duties and cannot replace one another.
- Left `memory/obsidian-plugin-system/framework/update-protocol.md` and `prompts/rules/workflow_core.md` unchanged because existing rules already define the detailed landing protocol and backup/change-record requirements.

Boundary:

- This is a Skill / framework maintenance change, not a runtime plugin change.
- No Obsidian runtime plugin files, business JSON, cache, settings, EVA indexes, or vault note data were modified.
- The global installed Skill under `C:/Users/h0414/.codex/skills/obsidian-system-plugin-dev/` was not overwritten in this pass because its hash differed from the repo-local Skill before modification.

## 2026-06-30 - Repo-Local Skill Synced To Global Installed Skill

Reason:

- User confirmed that the repo-local and global installed Skill should normally be hash-aligned before synchronized modification.
- A read-only comparison found that the global installed Skill had no nonblank content absent from the repo-local Skill; the repo-local Skill contained the newer Atlas maintenance and Framework / Atlas update-check rules.
- User explicitly requested synchronization after this comparison.

Actions:

- Backed up both Skill instances and `framework/maintenance-log.md`.
- Copied `skills/obsidian-system-plugin-dev/SKILL.md` to `C:/Users/h0414/.codex/skills/obsidian-system-plugin-dev/SKILL.md`.
- Verified both Skill files now share SHA-256 `3E5067D79EA848905A02DD04A22794FB3E5E3530D716AA70A462DF7CF0A2C8A8`.

Boundary:

- Sync direction was repo-local Skill -> global installed Skill.
- No runtime Obsidian plugin files, business JSON, cache, settings, EVA indexes, or vault note data were modified.

## 2026-06-30 - Atlas / Framework Gap Landing For 2026-06-26 To 2026-06-29

Reason:

- User asked to use the Obsidian plugin development Skill to land the recent unsynchronized experience into the Atlas wiki and Framework wiki.
- Earlier review found that some 2026-06-26 to 2026-06-29 engineering records had not yet been promoted into durable Atlas claims, while 2026-06-30 recent sentinels had already been landed.

Actions:

- Updated Atlas contracts for Workspace source ownership, Project Overview carrier-note suppression, 9XX archived keyword display, and Keyword drawer/SCON topology order.
- Updated Atlas plugin pages for Project Overview, Workspace Mount, Mandala, and Keyword Index.
- Updated the Keyword / Antinet / BUS workflow and Unknowns Register.
- Updated Atlas log with the gap landing trace.

Boundary:

- Framework records this as a control-plane maintenance trace only; detailed plugin facts live in Atlas.
- Original runtime modifications remain documented in their engineering change records.
- No runtime plugin code, business JSON, cache, settings, EVA indexes, or vault note data were modified by this landing.

## 2026-07-01 - Mandala Low-Margin Flip Design Landing

Reason:

- User requested a Mandala daily lesson pressure-response mode for low-margin / high-pressure days.
- The design changes the system's intentional stance: when the user marks today as low-margin, the daily lesson surface should steer toward recovery, minimum maintenance, and tomorrow handoff instead of continuing to demand the normal project-forward pool.

Actions:

- Updated `memory/obsidian-plugin-system/atlas/plugins/mandala-time-blocks.md`.
- Updated `memory/obsidian-plugin-system/atlas/knowledge/recent-maintenance-sentinels.md`.
- Added `memory/obsidian-plugin-system/cards/2026-07-01-mandala-low-margin-flip-intentional-stance.md`.

Boundary:

- Framework records the control-plane trace; detailed plugin ownership and scoring semantics live in Atlas.
- Repo-local dev/mirror plugin code was staged and verified.
- External actual Obsidian runtime was written back after user confirmation; runtime/dev/mirror hashes match for `main.js` and `styles.css`.

## 2026-07-01 - Obsidian MemPalace Bounded Recall Guard

Reason:

- MemPalace vector search for the Obsidian plugin system can fail with HNSW / Chroma index errors.
- The unsafe operational failure mode was not source-memory loss, but agents falling back to unbounded repo-wide `rg` over `workspaces/`, backup directories, vector DB directories, historical vaults, and runtime-like trees.

Actions:

- Updated the repo-local and global `obsidian-system-plugin-dev` Skill with a MemPalace / Atlas query boundary.
- Updated `prompts/rules/workflow_core.md` so Obsidian plugin memory recall must use the dedicated search / restore scripts and their bounded fallback.
- Replaced the Obsidian plugin MemPalace search wrapper with a timeout-aware MemPalace-first flow and an allowlisted `rg` fallback.
- Updated the restore wrapper to pass through `Room`, `MaxResults`, `TimeoutSeconds`, `FallbackOnly`, and `NoFallback`.

Boundary:

- Framework records this as a control-plane maintenance trace; detailed engineering facts live in the change record.
- No Obsidian runtime plugin files, business JSON, cache, settings, EVA indexes, or vault note data were modified.
- Source memory markdown remains safe; this change only hardens recall behavior when the vector index is unavailable.

## 2026-07-01 - Mandala Daily Score Flip-Side Entry Filter

Reason:

- User observed that the daily score modal mixed normal daily lesson items and stress-response flipped items.
- The existing Atlas contract already treated flip state as date-aware, so the implementation needed to distinguish chart history from score-entry candidates.

Actions:

- Updated Mandala `main.js` so the daily score modal follows the selected date's flip side.
- Normal dates now expose normal lesson items as new-score candidates; flipped dates expose stress-response items as new-score candidates.
- Existing historical chart blocks can still open a focused modal for the clicked item.
- Updated Atlas Mandala notes and recent maintenance sentinels with this chart-vs-entry boundary.

Boundary:

- No Mandala daily lesson or daily score business JSON was modified.
- Runtime/dev/mirror `main.js` were synchronized after backup and verification.

## 2026-07-04 - Mandala Posture Formula Question

Reason:

- User confirmed a higher-level design model: daily lessons are not only baseline defense, but the posture/formula calibration layer; weekly goal tracking and project tracking are the expression of that formula.
- The design affects future COACH readings and possible Mandala UI design, but does not require immediate runtime code changes.

Actions:

- Added FW-012 to `question-map.md`.
- Added `memory/obsidian-plugin-system/cards/2026-07-04-mandala-daily-posture-formula-and-weekly-expression.md`.
- Registered the card in `framework/registry.md`.
- Updated `atlas/plugins/mandala-time-blocks.md` and `atlas/log.md`.

Boundary:

- This is a framework / Atlas design landing only.
- No runtime plugin code, business JSON, cache, settings, EVA indexes, or vault note data were modified.

## 2026-07-05 - Absorbing Barrier And Compounding Chain Landing

Reason:

- User clarified that "吸收壁" is grounded in Munger-style compounding theory: the core danger is not a bad mood, but leaving the compounding game.
- User also connected the defense rule to Taleb: time-tested principles should carry more weight than intense low-margin impulses.
- This refines Mandala stress mode and future COACH behavior.

Actions:

- Added `memory/obsidian-plugin-system/cards/2026-07-05-cycle-compounding-absorbing-barrier-symbol-preservation.md`.
- Updated FW-012 in `question-map.md` to include absorbing-barrier / compounding-chain preservation.
- Registered the new design card in `registry.md`.
- Updated `atlas/plugins/mandala-time-blocks.md` and `atlas/log.md`.

Boundary:

- This is a framework / Atlas design landing only.
- No runtime plugin code, business JSON, cache, settings, EVA indexes, or vault note data were modified.

## 2026-07-05 - COACH Feynman And Source-Grounded Growth Gate

Reason:

- User asked to modify COACH so it can use the capability from `费曼的主张.pdf`.
- User clarified that future COACH growth should come from reliable materials, detailed user self-description, confirmed system experience, or repeated practice evidence, not from a purposeless scaffold.
- Personal vision, purpose, principles, values, self-schema, and personal-development coaching should wait for user-provided source packets and discussion before becoming durable COACH behavior.

Actions:

- Added `memory/obsidian-plugin-system/cards/2026-07-05-coach-feynman-anti-self-deception-decision-module.md`.
- Updated `framework/question-map.md` with FW-013 and the source-grounded COACH growth rule.
- Updated `skills/obsidian-project-effectiveness-coach/SKILL.md` with a bounded Feynman decision check and a COACH growth gate.

Boundary:

- No runtime plugin code, Obsidian vault business JSON, cache, settings, EVA indexes, or real MemPalace mine were modified.
- The current project coach remains read-only and modular; future personal COACH modules require source material and user confirmation.

## 2026-07-05 - COACH Health Compounding Module

Reason:

- User asked COACH to support health management and health habit building.
- User provided a health-compounding source packet and an anti-inflammatory lifestyle practice source packet.
- This satisfies the source-grounded COACH growth gate, but the module must stay within lifestyle coaching and outside diagnosis, treatment, medication, lab interpretation, or clinician override.

Actions:

- Added `memory/obsidian-plugin-system/cards/2026-07-05-coach-health-compounding-anti-inflammatory-habit-module.md`.
- Added `memory/world-interface-framework/cards/health-compounding-anti-inflammatory-lifestyle.md`.
- Updated `skills/obsidian-project-effectiveness-coach/SKILL.md` with a bounded Health Compounding / Anti-Inflammatory Habit module.
- Updated `memory/world-interface-framework/coach/README.md` with COACH activation and guardrails.
- Updated `framework/question-map.md` with FW-014 and refined FW-013.

Boundary:

- No runtime plugin code, Obsidian vault business JSON, cache, settings, EVA indexes, or real MemPalace mine were modified.
- Health habits are treated as body infrastructure for compounding continuity, not as medical advice.

## 2026-07-11 - Multi-Project Workspace Continuity

Reason:

- Replacing the single active `state/` preserved only an ad hoc backup, not an indexed, switchable, resumable project thread.
- `project-seed-archive` is a frozen-export concern and its restore path was not implemented.

Actions:

- Added FW-016 for addressable multi-project continuity.
- Established the control model: one mutable active `state/`, multiple sealed project checkpoints, read-only historical inspection, journaled switch/recovery, and a separate archive lifecycle.
- Added the repository `project-workspace-manager` Skill and CLI as the execution surface.

Boundary:

- This is a workflow-control refinement, not a new Obsidian plugin ownership/API claim.
- Atlas was not updated; repeated use must establish a stable system claim before promotion.

## 2026-07-15 - Project Overview Carrier Auto Refresh Phase 2B1

Reason:

- Workspace Mount, Collection Card View, and GTD could invalidate Project Overview's carrier cache, but visible evidence remained stale until manual refresh.
- Direct event-to-full-refresh would amplify UI-only saves and waste work, especially when Project Overview was hidden.

Actions:

- Deployed a consumer-only visible-target conservative probe in Project Overview after independent plan and post-change verification.
- Established the control rule: provider events mark evidence dirty; visible consumers compare complete owner-API projections; only changed or uncertain evidence may cause one latest-wins refresh.
- Recorded hidden/closed zero-work, failure retention, SHA-256 projection equality, scroll preservation, and no-polling/no-direct-JSON boundaries in Atlas contracts and the MapReduce knowledge page.

Boundary:

- Runtime/dev/mirror Project Overview code is synchronized and syntax/hash verified.
- Workspace Mount, Collection Card View, GTD, EVA, Mandala, and Keyword code/contracts were not modified in this slice.
- The user reloaded Project Overview and confirmed automatic provider-carrier freshness in actual Obsidian, so the slice is now `runtime_synced_verified`. Hidden-view/UI-only/failure/scroll subcases remain code-harness evidence unless separately observed.
## 2026-07-18 - MemPalace HNSW semantic publication guard

- Recorded `FW-017` after a 338-file staging mine produced complete SQLite rows but failed fresh-process HNSW reopen.
- Strengthened the control plane so counts, SQLite rows, or HNSW file presence cannot substitute for filtered and unfiltered expected-source recall.
- Added threshold-crossing smoke and drawers/closets VECTOR segment mapping requirements.
- Real mine is temporarily blocked because Local Chroma 1.5.7 does not implement indexing drain status and fresh-process threshold smoke still fails.
- Framework/Atlas update decision: `updated` for Framework Question Map, workflow rule, Skill, and experience card; `not_updated` for Atlas root-cause claims because the compactor timing explanation remains a hypothesis.

## 2026-07-23 - Project Overview Primary-Key Lifecycle Kill Mode

Reason:

- Completed primary keys accumulated indefinitely in the normal execution overview, making historical load compete with forward-looking work.
- Mandala already owns a separate manual `不再推进` decision, so Project Overview lifecycle could not silently reuse or mutate that state.

Actions:

- Refined OPS-002 with a reversible Project Overview-owned lifecycle registry and a read-only Mandala badge consumer.
- Registered the snapshot/event in Atlas API registry and documented final-projection filtering, any-active keyword merge, full evidence retention, and no-delete/no-cross-owner-write boundaries.
- Recorded actual synchronized deployment and independent verifier evidence in the engineering change record.

Bayesian update: `refines` existing ownership and aggregator-projection claims; it does not create a new framework layer.

Boundary:

- Question Map and unknowns remain unchanged because the lifecycle ownership question is resolved for the current Workspace/Mandala scope.
- No Skill/rule change is needed; existing ownership, backup, verifier, runtime/dev/mirror, and event-coalescing guardrails covered the work.
- MemPalace result remains `not mined`: prior recall used bounded fallback, and this deployment is recorded in Atlas/change-records without claiming semantic palace recall.

## 2026-07-23 - Mandala Six-State Daily Lessons And State Graph Tabs

Reason:

- The user's daily operating postures now include a recovery-to-baseline `休养生息` state in addition to the existing five states.
- Rendering all state fluctuation graphs together mixed semantics and occupied unnecessary visual and rendering space.

Actions:

- Corrected the Mandala Atlas prior from five states/pools/packs to six, preserving the stable internal ids and existing `lesson` score domain.
- Recorded the two-level score navigation contract: three unchanged top-level domains, then six lesson-state tabs with one graph rendered at a time.
- Recorded the explicit recovery boundary: Recuperation is Mandala-owned, seeds idempotently on explicit selection, and does not add Health Credit.
- Synchronized runtime/dev/mirror after byte backups, independent verification, syntax checks, score-key regression, schema/reference regression, and behavior-level fake DOM checks.

Bayesian update: `corrects` the obsolete five-state claim and `refines` the daily-score UI contract. No new framework layer or unresolved ownership question was introduced.

Boundary:

- Question Map, unknowns, glossary, aliases, Skill, rules, and cross-plugin contracts remain unchanged.
- No business JSON or Daily Scores schema was modified. Actual Obsidian narrow-window and print smoke remain pending.

## 2026-07-23 - Mandala New Home State And Score Context Tooltip

Reason:

- The user's operating-posture model now includes `新家的建设`: adapting changed life habits while using a new environment's initial asymmetric opportunities to establish success conditions.
- Daily score item names alone did not reliably reload the action context, so lesson scores needed bounded recall of expected timing and prior experience.

Actions:

- Corrected the Mandala Atlas prior from six to seven daily states/pools/packs while preserving existing score ownership and internal identities.
- Recorded the lesson-only hover/focus context tooltip contract and its non-effect on Workspace/goal score labels.
- Synchronized runtime/dev/mirror after byte backups, independent verification, read-only real-data normalization, and seven-state/tooltip/print regression checks.

Bayesian update: `corrects` the obsolete six-state claim and `refines` the existing daily-posture model. No new framework layer or unresolved ownership question was introduced.

Boundary:

- Question Map, unknowns, glossary, aliases, Skill, rules, and cross-plugin contracts remain unchanged.
- No business JSON or Daily Scores schema was modified. Actual Obsidian UI smoke remains pending.

## 2026-07-25 - Mandala Current/Historical Lifecycle Projection

Reason:

- The current `项目执行计划` / `目标执行计划` surfaces were still showing exited identities, while historical weekly summaries needed explicit lifecycle explanations rather than disappearance.
- A provider outage or malformed owner snapshot must not be mistaken for a deliberate exit.

Actions:

- Refined the Atlas planning model into current attention projection versus historical observation projection.
- Recorded separate stop-week closeout, current-stopped, and Project Overview Kill markers.
- Added the evidence rule that current source absence requires a fresh, structurally complete owner snapshot; stale, failed, partial, or malformed evidence fails open.
- Recorded independently verified repository-dev promotion, then user-confirmed runtime/dev/mirror code-only synchronization with matching hashes and post-write regressions.

Bayesian update: `refines` the existing exit/discoverability contract and reinforces `FW-018`; it does not create a new framework layer or owner.

Boundary:

- Framework Question Map and unknowns are unchanged because `FW-018` already carries the unified retired-key discoverability gap.
- Skill and rules are unchanged; the repo-local `obsidian-system-plugin-dev` ownership, backup, verifier, fail-open, and runtime synchronization gates covered the work.
- Runtime and mirror changed only for Mandala `main.js` and `styles.css`; no business JSON, settings, manifest, cache, Timeline code, glossary, alias, or framework registry was modified. Actual Obsidian UI smoke remains pending.

## 2026-07-26 - Mandala Social Conduct And All-State Score Graph

Reason:

- The user added `为人处世之道` as a ninth daily operating posture and needed an all-state score graph whose item colors stay distinct beyond the former 24-color limit.

Actions:

- Corrected the Mandala Atlas prior from eight to nine real daily states and nine score packs.
- Recorded `全部状态` as a score-view-only projection, not a tenth mode or pack.
- Recorded canonical `side::itemId` color ownership and deterministic cached maximin expansion beyond 24 fills.
- Synchronized runtime/dev/mirror after byte backups, explicit user confirmation, read-only business-data guards, focused 24/25/72/128 tests, and independent post-change verifier `PASS`.

Bayesian update: `corrects` the obsolete eight-state claim and `refines` existing score-view and visual-identity contracts; it does not create a new framework layer or owner.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill and rules are unchanged; existing ownership, backup, verifier and runtime-sync gates covered the work.
- No business JSON, Daily Scores schema, score key, manifest, setting, cache, Timeline code or other plugin file was modified.
- MemPalace remains `not mined`; the bounded recall had no direct hit, so no recall or mine claim is made.

## 2026-07-27 - Mandala Score Candidate Lifecycle Exit Boundary

Reason:

- Exited project/goal identities still appeared as new-score candidates, while historical score evidence needed to remain reviewable and editable.
- Async add/save windows and concurrent score editors required explicit write-boundary protection rather than UI filtering alone.

Actions:

- Refined the Atlas score-block and Kill contracts: Mandala consumes fresh Project Overview Kill evidence read-only for new-score admission while retaining separate ownership of stopped state and scores.
- Recorded inclusive stop-date semantics, stale Kill fail-open, malformed stop-date fail-closed, complete Workspace identity matching, dual-event admission invalidation, and historical edit/delete preservation.
- Recorded serialized stable-entry mutation against the latest score store so concurrent editors cannot overwrite one another.
- Synchronized only verified Mandala `main.js` to runtime/dev/mirror after byte backups, three verifier cycles, explicit user confirmation, syntax/hash checks, and business-data guards.

Bayesian update: `refines` the existing exit/discoverability and score-record contracts. No new framework layer, owner, Question Map item, unknown, glossary term, alias, Skill, or rule was introduced.

Boundary:

- Project Overview and Timeline code, styles, manifest, settings, Weekly Goals, Daily Scores, plugin `data.json`, cache, and index files were not modified.
- Actual Obsidian interaction smoke remains pending after plugin reload.

## 2026-07-27 - Mandala Restriction Remediation Tenth State

Reason:

- The user needs a dedicated daily posture for recurring behaviors that should be limited or avoided, such as time-consuming non-essential outings and habitually late meals.
- This is a bounded correction surface, not another encouragement list, score domain, or cross-plugin owner.

Actions:

- Corrected the Mandala Atlas prior from nine to ten real daily states and ten score packs while preserving all existing state ids, ordering, score keys, and historical records.
- Recorded `self_restraint` / `限制项专项整改` as an explicit-selection-only posture with stable defaults, canonical ownership, reference support, weekly/print projection, score graphs, and zero-write read paths.
- Synchronized verified `main.js` and `styles.css` to runtime/dev/mirror after byte backups, plan and post-change verifier passes, explicit user confirmation, syntax/hash checks, and business-data guards.

Bayesian update: `corrects` the obsolete nine-state claim and `refines` the existing daily-posture model; it does not create a new framework layer or owner.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules are unchanged; existing ownership, backup, verifier, modal-save, and runtime-sync gates covered the work.
- No business JSON, manifest, settings, cache, score schema, score domain, or other plugin was modified.
- MemPalace remains `not mined`; this deployment is preserved through Atlas and the engineering change record without claiming semantic palace recall.

## 2026-07-29 - Workspace Mount Ontology Cell Image References

Reason:

- The user needs recursive Paradigm Ontology cells to accept one or multiple local images through Obsidian's attachment model while retaining text and nested tables.
- Attachment creation and modal teardown introduce a durable-reference boundary: once a binary may exist, the system must never lose every reference to it or mistake volatile recovery state for durable state.

Actions:

- Refined the Workspace Mount Atlas Ontology contract with schema-v1 image embeds, attachment API ownership, validation/limit policy, exact-reference removal, thumbnail/unresolved UI, serial import identity, prepare/final recovery, authority-filtered recovery transactions, terminal teardown, and multi-modal prepare barriers.
- Synchronized only verified `main.js` and `styles.css` to runtime/dev/mirror after explicit user confirmation and role-specific byte backups.
- Preserved manifests, plugin data, business JSON, notes, tests, attachments, caches, and indexes. Post-write hashes, syntax, Ontology tests, diagnostics, feature sentinels, and CSS sentinels passed.

Bayesian update: `refines` the existing Workspace Mount Ontology and no-ghost-data claims; it does not change the macro framework model, ownership layer, provider/consumer map, or cross-plugin contract.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged because existing owner-local content, implicit-close, backup, verifier, and runtime synchronization guardrails covered the work.
- MemPalace status is `not mined`; this engineering deployment is preserved in Atlas and the engineering change record without making a recall claim.
- Actual Obsidian drag/drop, picker, preview, unresolved-tile, reload, and attachment-folder smoke remains pending.

## 2026-07-29 - Mandala Daily Comment Image Album

Reason:

- The user's daily `记录、想法、路点与线索` may need several images, but expanding all previews would displace the daily-work surface.
- Image removal and asynchronous attachment import needed explicit ownership boundaries so implicit modal close could not erase a reference or delete historical evidence.

Actions:

- Refined the Mandala Atlas day-comment contract: ordinary image embeds coexist in the existing `adjustment` / legacy `summary` text field, with no new schema or owner.
- Recorded the compact launcher, scrollable gallery, full preview, explicit removal confirmation, exact-reference-only removal, attachment non-deletion, durable-reference-before-binary, owner queue, close/unload gate, and SHA-256 retry identity contracts.
- Synchronized verified `main.js` and `styles.css` to runtime/dev/mirror after explicit user confirmation and role-specific byte backups. Three-way hashes, syntax checks, contract harness, CSS structure, feature sentinels, no-delete scans, and business-data guards passed.

Bayesian update: `refines` the existing Mandala day-comment and no-ghost-data claims; it does not change the macro framework model, ownership layer, provider/consumer map, or cross-plugin contract.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged because existing owner-local content, implicit-close, attachment-reference, backup, verifier, and runtime synchronization guardrails cover the work.
- MemPalace status is `not mined`; this deployment is preserved in Atlas and the engineering change record without making a recall claim.
- Actual Obsidian image picker, multi-image drag/drop, gallery scrolling, full preview, cancellation paths, confirmed reference removal, attachment retention, reload, weekly projection, and print smoke remain pending.

## 2026-07-29 - Workspace Mount Ontology Image Removal Confirmation

Reason:

- Ontology image removal initially bypassed the confirmation modal even though row, column, subtable, and Mandala image removal already treated destructive reference changes as explicit decisions.
- A confirmation alone was insufficient unless the exact token and parent modal lifecycle were revalidated after the asynchronous wait.

Actions:

- Routed every Ontology thumbnail removal through the existing Workspace confirmation modal and preserved false-by-default implicit-close semantics.
- Froze stable cell identity plus exact token span/text; added post-confirmation checks for draft/target drift, pending import, recovery conflict, ordinary/final close and forced teardown.
- Added rejection containment, duplicate/double-confirm guards, explicit attachment deletion-API counters and binary-byte equality tests.
- Synchronized only verified `main.js` to runtime/dev/mirror after user confirmation and role-specific byte backups. Three-way hashes, syntax, full Ontology tests, diagnostics and excluded-data guards passed.

Bayesian update: `refines` the existing Workspace Mount Ontology image-reference and no-ghost-data claims; it does not change the macro framework model, ownership layer, provider/consumer map or cross-plugin contract.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill and rules remain unchanged because existing destructive-confirmation, modal-close, attachment-ownership, backup, verifier and runtime synchronization guardrails cover the work.
- MemPalace status is `not mined`; this deployment is preserved in Atlas and the engineering change record without making a recall claim.
- Separate Obsidian-native `Esc` and backdrop interaction smoke remains pending after plugin reload; both share the statically and harness-verified false-by-default modal close path.

## 2026-07-30 - Workspace Mount Ontology Breadcrumb Row Identity

Reason:

- A child-table breadcrumb displayed the owning parent-cell prose, such as `详见子表`, which did not identify which parent row the user had entered.
- Ontology has no separate row-title field; the current first ordered column is the existing visible row-name convention.

Actions:

- Refined the Workspace Mount Atlas Ontology contract so each recursive breadcrumb ancestor uses the immediate parent row's first ordered cell value, with a valid-empty fallback of `第 N 行`.
- Preserved exact `parentCellRef` closure validation and made malformed row/column structure fail closed. Navigation remains a read-only projection with zero Ontology mutation.
- Synchronized verified `main.js` to runtime/dev/mirror after user confirmation and role-specific byte backups. Three-way hashes, three syntax checks, full Ontology tests, diagnostics, and five excluded-data sentinels passed.

Bayesian update: `refines` the existing Workspace Mount Ontology navigation claim; it does not change the macro framework model, ownership layer, provider/consumer map, schema, or cross-plugin contract.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged because existing owner-local UI projection, fail-closed validation, backup, verifier, and runtime synchronization guardrails covered the work.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian breadcrumb rendering, deep recursion, ancestor click, and valid-empty fallback smoke remains pending after plugin reload.

## 2026-07-29 - Mandala Daily Comment Clipboard Image Paste

Reason:

- The user needed a lower-friction path from screenshots and copied images into the existing daily comment album without adding a second editor or persistent paste zone.

Actions:

- Refined the Mandala Atlas day-comment image contract: the existing `记录、想法、路点与线索` textarea is the paste target, ordinary text paste remains native, and image-bearing paste reuses the existing validated image queue.
- Recorded clipboard representation precedence, multi-image ordering, mixed-content image-only behavior, nameless-file normalization, and the prohibition on direct blob/base64/embed insertion.
- Synchronized verified `main.js` only to runtime/dev/mirror after explicit user confirmation and role-specific byte backups. Three-way hashes, three syntax checks, the focused clipboard/album harness, and the business-data guard passed.

Bayesian update: `refines` the existing Mandala day-comment and no-ghost-data claims; it does not change the macro framework model, ownership layer, provider/consumer map, or cross-plugin contract.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged because the existing owner-local input, attachment-reference, backup, verifier, and runtime synchronization guardrails covered the extension.
- MemPalace status is `not mined`; this engineering deployment is preserved in Atlas and the engineering change record without making a recall claim.
- Actual Obsidian clipboard interaction smoke remains pending after plugin reload.
## 2026-07-31 - Mandala Daily-State Display Renames

Reason:

- The user refined the meaning exposed by two existing daily postures: `normal` should foreground margin management, and `social_conduct` should include both conduct and cultivation.

Actions:

- Updated the current Mandala Atlas fact to `normal` / `余度管理` and `social_conduct` / `为人处世与修行`.
- Synchronized only independently verified `main.js` display-string candidates to runtime/dev/mirror after explicit confirmation. Stable ids, business JSON, score identity, history, schema, ownership, APIs, events, commands, styles, and manifest were not changed.

Bayesian update: `refines` the daily-posture display semantics without changing the macro framework model or persistence contracts.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged because the existing stable-identity, backup, verifier, and three-way runtime synchronization guardrails covered the work.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian UI smoke remains pending after plugin reload.

## 2026-08-01 - Workspace Mount Ontology Recursive Action Priority

Reason:

- The one-row footer was structurally sound, but album-first placement weakened the recurring `创建子表/进入子表` action and produced a different keyboard priority from the intended workflow.

Actions:

- Refined the Workspace Mount Atlas UI contract to require one shared order across DOM, visual layout, and keyboard traversal: nested action, optional nested delete, album, image add.
- Preserved the album as the only flexible middle region and kept image add fixed at the far right. Removed only the obsolete action wrapper.
- Synchronized verified `main.js` and `styles.css` to runtime/dev/mirror after explicit confirmation. Syntax, full Ontology, diagnostics, no-hook, Chromium geometry, three-way hashes, and business-data guards passed.

Bayesian update: `refines` the existing owner-local recursive Ontology and compact-footer UI contract; no macro-framework, ownership, provider/consumer, schema, lifecycle, or cross-plugin contract changed.

Boundary:

- Framework Question Map, unknowns, registry, contracts, glossary, aliases, Skill, and rules remain unchanged because existing UI-contract, verifier, backup, and runtime synchronization guardrails cover the change.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian theme smoke remains pending after plugin reload.
## 2026-07-31 - Extend Mandala Primary-Key Continuity From Detail Pages

Reason:

- Weekly summary and vertical-plan rows already navigated by stable identity, but per-key multi-week detail pages had no row-focused route back to either aggregate representation.

Actions:

- Refined the Mandala Atlas and planning workflow so goal/project detail headers can locate the same stable key in the same-domain weekly summary or vertical plan without adding a table column.
- Preserved observation-bounded history and truthful absence: stopped, killed, source-missing, or selected-week-absent rows are explained rather than recreated.
- Recorded save-before-navigation containment: clean navigation has zero business writes; dirty detail navigation has one owner save; rejection restores dirty state and blocks the switch.

Bayesian update: `refines` the integrated primary-key continuity model and owner-local UI contract; no macro-framework, ownership, schema, API, event, command, or lifecycle change.

Boundary:

- Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged because existing stable-identity, no-ghost-data, input-save, scroll-stability, verifier, backup, and runtime synchronization guardrails covered the extension.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian click and responsive-layout smoke remains pending after plugin reload.

## 2026-07-31 - Mandala Structured-Field Image Albums

Reason:

- The user needed the existing compact local-image album pattern on three durable context fields while preserving their distinct semantics: daily `此前的经验`, goal `获得到的知识`, and project `价值取向`.
- Async attachment work increased the risk that modal close, image deletion, multi-window edits, or typing during a pending save could lose the newer text version.

Actions:

- Extended ordinary Obsidian-embed storage without adding image-array schemas or a second content owner. Added file selection, Vault/external drag-and-drop, clipboard paste, compact gallery, and confirmed exact-reference removal.
- Added owner-safe field RMW, persistent draft recovery, provisional-reference-before-binary ordering, close admission locks, retry-failure isolation, and submitted-snapshot checks for all three fields.
- Added a bounded Project Overview AI export projection for project `valueDirection`; raw embeds remain in the canonical Mandala value and Project Overview remains read-only.
- Synchronized only 9 verified code files to runtime/dev/mirror after user confirmation. Business JSON and plugin `data.json` were excluded and immediate pre/post business-data guards were identical.
- A post-deployment follow-up added the strict three-field allowlist, preserved `currentReality` as ordinary text, and corrected the project-plan Collection Card read path: a non-Workspace active Project Overview model now triggers a read-only Workspace model build instead of yielding an accidental empty projection.
- Final runtime/dev/mirror hashes align at Mandala `main.js=1A50811C...A697D`, Mandala `styles.css=1816E9E1...CF67`, and Project Overview `main.js=DC6F2823...D4E8E`. Independent verification found no P0/P1; only real-UI reload smoke remains.

Bayesian update: `refines` the existing Mandala owner-local attachment/input contracts and Project Overview export boundary. It does not change the macro framework model, business-data ownership, cross-plugin API, event, command, or schema.

Boundary:

- Framework Question Map, unknowns, registry, contracts, glossary, aliases, Skill, and rules remain unchanged because existing attachment ownership, content-modal, provider/consumer, backup, verifier, and three-way synchronization guardrails cover the work.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian UI smoke remains pending after reloading Project Overview and Mandala. The project-plan evidence check should confirm `weekly-project-plan.collection-cards.read.workspaceCount > 0`.

## 2026-08-01 - Workspace Mount Ontology Compact Album And Clipboard Paste

Reason:

- Rendering every Ontology image directly in the parent table displaced text and recursive-table controls, while file selection and drag/drop did not cover the user's clipboard-first screenshot workflow.
- The child album and parent close boundary needed an explicit distinction between rejecting new work and draining work already admitted before close.

Actions:

- Refined the Workspace Mount Atlas contract with a single compact launcher, a scrollable ephemeral child album, textarea/album clipboard paste, exact confirmed removal, and `nestedTableId`-only established state.
- Preserved the definition-source Ontology `cell.value` as the sole content owner and Obsidian vault/FileManager as binary owner. No child draft, queue, writer, sidecar, schema, blob/base64 storage, or attachment deletion path was added.
- Added parent-issued child lifecycle tokens and image admission tokens. Close/forced teardown invalidates child views and rejects new work immediately, drains every pre-close admission, and isolates UI-render failure from owner-transaction cleanup.
- Synchronized only verified `main.js` and `styles.css` to runtime/dev/mirror after user confirmation and role-matched byte backups. Three-way hashes, syntax, full Ontology tests, diagnostics, CSS structure, and business-data guards passed.

Bayesian update: `refines` the existing Workspace Mount Ontology content, child-view, recovery, teardown, and no-ghost-data claims; it does not change the macro framework model, ownership layer, provider/consumer map, or cross-plugin contract.

Boundary:

- Framework Question Map, unknowns, registry, contracts, glossary, aliases, Skill, and rules remain unchanged because existing owner-local content, input-modal, attachment ownership, verifier, backup, and runtime synchronization guardrails cover the extension.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian album/paste/removal/child-state/reload smoke remains pending.
## 2026-08-01 - Workspace Mount Ontology Editor Projection Refinement

Reason:

- The compact Ontology album made raw image embed lines redundant in the text editor, and the separate album/action rows consumed unnecessary vertical space.

Actions:

- Refined the Workspace Mount Atlas contract so canonical `cell.value` remains the sole content owner while textarea hides recognized image embeds as a write-free visible projection.
- Recorded live-cell resolution, exact hidden-token preservation, bounded whitespace handling and single-transfer behavior for manually typed embeds.
- Recorded one-row album/action footer geometry with album-first shrinkage at the 220 px minimum cell width; established child-table state and independent row-delete ownership remain unchanged.
- Synchronized verified `main.js` and `styles.css` to runtime/dev/mirror after explicit confirmation and role-matched byte backup. Syntax, full Ontology, diagnostics, no-hook and real Chromium geometry checks passed; business-data sentinels remained unchanged.

Bayesian update: `refines` the existing owner-local content projection and compact Ontology UI contract; no macro-framework, ownership, provider/consumer, schema or cross-plugin contract changed.

Boundary:

- Framework Question Map, unknowns, registry, contracts, glossary, aliases, Skill and rules remain unchanged because existing content-owner, input-modal, verifier, backup and runtime synchronization guardrails cover the work.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian UI smoke remains pending after plugin reload.

## 2026-08-01 - Mandala Daily Ontology External Ownership And Workspace Deletion Safety

Reason:

- Daily lesson items need the same expandable recursive knowledge form as Workspace paradigm items without moving Mandala-owned records into Workspace ownership.
- A hard-earned Ontology must not disappear through direct, ancestor, mounted, or whole-paradigm deletion, including schema-only or malformed-but-present documents.

Actions:

- Registered Mandala as formal/recovery owner and Workspace Mount as versioned editor provider through bounded callbacks, CAS/current-formal conflict responses, generation leases, and unload recovery barriers.
- Added owner-preservation coverage across daily writers and a write-free one-cell initial editor.
- Added ownership-based Workspace deletion locks plus authoritative mounted-identity and subtree rechecks.
- Synchronized only the independently verified three-file allowlist to runtime/dev/mirror after explicit user confirmation and role-matched backups. Code hashes, syntax, nine dynamic suites, and business-data guards passed.

Bayesian update: `adds` the external Ontology editor owner/provider contract and `refines` the existing no-ghost-data deletion boundary. The macro layer model does not change.

Boundary:

- Atlas plugin pages, contracts, API registry, and log were updated. Framework Question Map, unknowns, registry, glossary, aliases, Skill, and rules remain unchanged.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian reload/UI smoke remains pending.

## 2026-08-01 - State Capsule Restore Semantics Aligned To Current Views

Reason:

- Project Overview changed from a long parallel page to primary-key Tabs, so scroll-based capsule restoration no longer represented the user's actual navigation model.
- GTD Context Capsule Keys represent operating context, but restoring a saved tag-filtered view hid unrelated projects and did not reliably identify the intended project when one tag belonged to several projects.

Actions:

- Refined the Atlas with dedicated State Capsules and GTD plugin pages, a cross-plugin restore contract, public bridge/API entries, Project Overview Tab semantics, and Context Capsule Key restore meaning.
- Synchronized only four verified code artifacts across runtime/dev/mirror after role-matched backup, dynamic contract tests, business-data sentinels, one failed verifier remediation, and a fresh final verifier PASS.
- Preserved restore as environment state: no Project Overview/GTD business JSON, lifecycle state, manifest, or persisted GTD tag-filter preference was written.

Bayesian update: `refines` the prior. Context Capsule Keys are now confirmed restore-time context locators as well as display/binding identities; Project Overview selection continuity is stable-primary based rather than scroll-position based.

Boundary:

- Framework Question Map and Atlas unknowns remain unchanged because the implemented owner/consumer/host/race contract is closed by code and tests.
- Skill/rules remain unchanged; existing restore-time no-write, host identity, multi-instance, backup, verifier, and three-way synchronization rules already cover the pattern.
- MemPalace is not mined; no recall claim is made.
- Actual Obsidian UI smoke remains pending after plugin reload.
## 2026-08-02 - Ontology Historical Lifecycle And Daily Completion

Reason:

- Ontology columns and historical date records require a lifecycle that preserves captured knowledge instead of turning ordinary delete into irreversible physical removal.
- Daily `完成情况` needs one evolving table form with independent content for every date.

Actions:

- Refined Atlas ownership/provider contracts for Ontology schema v2, archive/restore, stable ID reservation, row deletion refusal and v1-v2 compatibility.
- Registered Mandala's shared-schema/date-instance storage and safe owner writer without making Workspace Mount or Atlas a second business-data owner.
- Promoted the reusable lifecycle rule into the repo-local Obsidian development Skill and added the JSON to the read-only asset registry.
- Synchronized independently tested runtime/dev/mirror bundles after byte-level backups and preserved all guarded business data.

Bayesian update: `refines` the historical-data and external-editor prior and `adds` a bounded date-instance owner pattern. No Question Map or unknown change is needed because ownership, compatibility, concurrency and no-write-on-read boundaries are implemented and covered by focused tests.

Boundary:

- The new business JSON remains absent until the user's first successful date Ontology save.
- Actual Obsidian interaction smoke remains pending after reload; MemPalace is not mined and no recall claim is made.

## 2026-08-02 - Ontology Verifier Remediation: Frozen Owner Path And Read-Only Archive

Reason:

- The first post-change verifier proved that an asynchronous Mandala save could observe a newly selected source path after reading the old owner, and that restore was incorrectly the only way to inspect archived columns.

Actions:

- Refined the external-owner contract so source/path identity is frozen before asynchronous work, rechecked before publication, and never recalculated as the write target.
- Added a non-writing archived-history projection that keeps text, image albums and nested tables inspectable while disabling every mutation path, including child album paste/removal.
- Follow-up verification moved that protection below presentation: archive read-only now propagates through the full parent-table chain, while direct image removal, queue admission and asynchronous image preparation independently fail closed.
- Migrated the legacy full suite from physical column deletion to archive/retain semantics and added a deterministic source-switch regression test.
- Synchronized the remediated Workspace and Mandala bundles to runtime/dev/mirror; final code hashes align. Later running-Obsidian writes to DailyLessons/Mandala settings were detected and retained. A final bounded Workspace-only sync captured all five business sentinels immediately before and after and found them identical; the new completion owner JSON remained absent.

Bayesian update: `refines` existing historical-data, no-ghost-data and external-owner concurrency guardrails; no new macro layer or data owner is introduced.

Boundary:

- Fresh final independent verification passed with no blocking findings. Actual Obsidian interaction smoke remains pending. MemPalace is not mined and no recall claim is made.

## 2026-08-04 - Longitudinal Primary Keys Gain Durable Cognitive Envelopes

Reason:

- A goal or project can accumulate valuable cognition before conditions permit execution. Current-plan visibility and durable knowledge history therefore cannot share the same deletion/filter lifecycle.
- The longitudinal execution-plan surface needed the same recursive Ontology affordance as other managed items while preserving Mandala as the sole business owner.

Actions:

- Added a dedicated Mandala longitudinal Ontology owner shard keyed by stable goal/project identity, with Workspace Mount retained as editor provider only.
- Separated ordinary plan text, lifecycle projection, recovery drafts, and formal Ontology persistence. Stop/Kill/source absence hides current rows without deleting accumulated cognition.
- Added bounded CAS publication, source/provider/owner leases, alias collision protection, exact serialized-byte limits, native containment/no-replace publication, rollback evidence, and strict downstream body isolation.
- Reused the standard one-cell recursive editor and the populated-only outside-corner status marker inside existing primary-key cells.
- Synchronized only verified code/CSS to runtime/dev/mirror after explicit confirmation. Immediate business sentinels remained unchanged and the new shard stayed absent until first meaningful save.

Bayesian update: `adds` the durable cognitive-envelope owner pattern for longitudinal managed identities and `refines` the external Ontology provider, stable-identity, history-retention, and content-state UI contracts. The macro layer model does not change.

Boundary:

- Atlas plugin/contract pages and log were updated. Framework Question Map, unknowns, glossary, aliases, Skill, and rules remain unchanged because existing durable-data lifecycle rules already cover the design.
- Final independent verifier passed after exact-byte admission remediation. Actual Obsidian click/save/reload smoke is pending; MemPalace is not mined and no recall claim is made.

## 2026-08-04 - Checklist Posture And Read-Only Reverse Reference Projection

Reason:

- Persistent responsibility queues such as vendor-email follow-up need a recurring inspection protocol without duplicating an existing goal/project or Collection Card owner.
- Once a canonical daily item is reused by another posture, the owner surface needs to reveal that relationship without creating a second persisted relation owner.

Actions:

- Corrected the Mandala Atlas from ten to eleven Daily Lessons states and registered `checklist` / `核查清单` as the recurring inspection posture.
- Added the stable explicit-only default `外部沟通闭环巡检`, while keeping concrete follow-up actions in their corresponding project or Collection Card.
- Refined canonical references: `referencesBySide` remains the sole persisted forward relation; `被 X、Y 面引用` is an ordered/deduped read-only reverse projection with fail-closed self/stale/ambiguous handling.
- Synchronized only independently verified Mandala `main.js` and `styles.css` to runtime/dev/mirror after byte backups and explicit continuation confirmation. Syntax, focused state/reference, Ontology v2 and navigation regressions passed; business JSON remained unchanged.

Bayesian update: `corrects` the deployed ten-state prior and `refines` the daily-posture and canonical-reference models. The macro layer, JSON ownership, score domain, Ontology provider contract and cross-plugin ownership do not change.

Boundary:

- Framework Question Map, Atlas unknowns, contracts, registry, glossary, aliases, Skill and rules remain unchanged because the implementation closes the ownership and invalid-reference cases under existing no-render-write and stable-identity guardrails.
- MemPalace status is `not mined`; no recall claim is made.
- Actual Obsidian UI smoke remains pending after reloading Mandala.
## 2026-08-04 - Timeline Milestone Time-Limit Projection

Reason:

- Milestone date and daily stage are the source-owned time-limit interpretation of a managed goal/project.
- Project Overview no longer needs an independent Timeline-primary browsing mode after milestone evidence is attached directly to the corresponding Workspace/Mandala primary.

Actions:

- Extended the Timeline owner snapshot with weekday, seven-stage label/range/order, bounded diagnostics and deterministic date/stage/name/id ordering.
- Added one-read-per-render projections to Mandala `项目执行计划` and Project Overview's retained Timeline evidence column.
- Removed Project Overview standalone Timeline grouping, with write-free legacy mode fallback to Workspace.
- Kept virtual milestone evidence out of EVA, comments, Meta, relation editing, drag/manual/first-seen order, settings and all business JSON.
- Promoted five independently verified artifacts to repository dev only. Runtime/mirror synchronization and actual Obsidian smoke remain pending.
- After explicit user confirmation, synchronized the five verified assets to actual runtime and mirror. Fresh prewrite baselines, three-side SHA-256 alignment, deployed syntax, five contract suites and four unchanged business-data sentinels close the code deployment; actual Obsidian UI smoke remains pending after plugin reload.

Bayesian update: `refines` the Timeline/Mandala ownership contract and Project Overview evidence model. Timeline stays the sole owner; Project Overview remains a read-only aggregator.

Boundary:

- Question Map and unknowns remain unchanged because ordering, ownership, degradation and compatibility paths are closed in code/tests.
- Skill/rules remain unchanged; existing owner-snapshot, no-render-write, verifier, backup and three-way synchronization rules cover this pattern.
- MemPalace is not mined; no recall claim is made.
- 2026-08-05: Framework update check `updated`. Registered Timeline's canonical daily-wave owner projection, Project Overview's additive capsule-level snapshot metadata, and Mandala's weekly-only deterministic reduce. The change refines current-attention ordering without changing historical ownership, vertical management, scoring, lifecycle, or business JSON. After explicit user confirmation, four code assets were synchronized to runtime/dev/mirror with role-correct backups; deployed syntax and six contract/regression suites passed, and all four business JSON sentinels remained byte-identical. Actual Obsidian UI smoke remains pending after plugin reload.
- 2026-08-05: Phase 13 refined the current-attention ordering contract: Mandala goal/project vertical-management Tabs and their print sections now use the same `ABC -> Timeline today wave -> PEO -> stable id` order as the corresponding weekly summaries. Current vertical management still filters stopped, killed and missing-owner rows before sorting; historical rows, lifecycle ownership, Ontology, scores and rosters remain unchanged. Request-level metadata completeness, Workspace alias-aware identity and injected print snapshots were verified. Repository dev is updated; runtime/mirror synchronization remains explicitly gated and actual UI smoke remains pending.
- 2026-08-05: Phase 13 runtime synchronization completed after explicit confirmation. Runtime/dev/mirror Mandala code aligns at the verified candidate hash; the deployment changed code only and preserved the observed business-data files. The ordering contract is now deployed, while actual UI smoke remains pending after plugin reload. Deployment backup, data sentinels and verifier evidence are recorded in the engineering change record.
- 2026-08-05: Phase 14 refines provider coverage rather than ordering policy. Project Overview's Mandala group snapshot now carries optional member identities, allowing Mandala non-primary goals to inherit the owning group's ABC/PEO evidence while Timeline continues to order each goal by its own stable identity. Legacy snapshots remain compatible; duplicate ownership, key/id conflict and visible-row incompleteness fail closed. Repository dev and focused tests are verified; runtime/mirror remain gated.
- 2026-08-05: Phase 14 is synchronized to runtime/dev/mirror for Mandala and Project Overview after explicit confirmation. Code hashes, syntax and the focused contract pass; no deployment command wrote business JSON. A concurrent Project Overview environment-state save was retained and documented. Actual goal-table UI smoke remains pending after plugin reload.
- 2026-08-05: Framework update check `updated`. User UI evidence corrected Phase 14's inferred ownership model: each Project Overview Mandala group primary is the managed goal key, while ordinary `columns.mandala` members remain evidence only. Mandala's repository-dev reducer now uses primary-only ABC metadata plus Timeline's same-goal today-wave rank, with primary-level fail-closed validation and bounded console diagnostics. This `corrects` the member-inheritance claim without changing Project Overview ownership, Timeline ownership, Mandala persistence, project ordering or historical data. Runtime/mirror synchronization remains behind explicit confirmation; MemPalace was consulted but not mined.
- 2026-08-05: Phase 15 code-only synchronization completed after explicit confirmation. Mandala runtime/dev/mirror now share the verified primary-only reducer hash; syntax, focused contracts, feature sentinels and four unchanged business-data hashes close deployment. The framework claim is runtime-synced; user-visible goal order remains pending reload smoke.
- 2026-08-05: Phase 17 `refines` the goal ordering fallback after runtime diagnosis found 40 exact PEO goal-primary matches and 9 visible Mandala rows outside the current PEO primary set. Repository dev now preserves every row, applies `ABC -> Timeline -> PEO -> id` to matched goals, places unmatched goals in a marked deterministic tail, and leaves project whole-request fallback unchanged. Eight contract/regression suites and an independent verifier passed; four business JSON hashes remained unchanged. Runtime/mirror synchronization and actual UI smoke remain pending.
- 2026-08-05: Phase 17 runtime/mirror synchronization completed after explicit confirmation and role-correct backup. Runtime/dev/mirror code hashes align; deployed syntax and all eight suites pass. The code-only deployment preserved Mandala Weekly Goals, Project Overview and State Capsules sentinels; a concurrent Timeline owner write was detected and retained. Only actual Obsidian UI smoke remains.
- 2026-08-06: Framework update check `updated`. Added a standalone Ontology Meta Hub at the discovery/navigation layer with the model `owner map -> bounded descriptor -> Hub reduce -> owner open/reveal`. This `adds` a cross-owner knowledge-navigation layer while preserving Workspace/Mandala formal ownership and Project Overview's execution-only boundary. Provider scopes, unions, cursor revisions, historical read-only state, exact owner focus, load-order leases, cancellation and strict corruption handling are confirmed by repository-dev code and focused tests. Runtime deployment and actual Obsidian smoke remain pending; Question Map, unknowns, glossary, aliases, Skill and MemPalace are unchanged because no unresolved architectural claim or new execution guardrail remains.
- 2026-08-06: Framework update check `updated`. Registered the Ontology cell-reference contract: Hub coordinates but does not own content/edges; Workspace supplies the shared recursive editor; Mandala retains four formal owner families. Stable `celladdr:v1`/`schemaaddr:v1`, complete-proof owner CAS, structure-only lineage, dynamic provider-lease read-only and post-confirmation mutation rechecks are confirmed by repository-dev code/tests and final verifier PASS. This `refines` the existing Ontology Meta Hub claim and preserves Project Overview, EVA and owner-JSON boundaries. Question Map, unknowns, glossary, aliases, Skill and rules remain unchanged; runtime/mirror deployment and actual Obsidian UI smoke are pending explicit confirmation.
- 2026-08-06: Framework update check `updated`. Runtime Console evidence separated the shared Workspace editor generation namespace from the Mandala address-owner provider lease. Repository-dev Hub adapters now normalize this boundary: caller credentials are discarded, capture is owner-frozen, cross-provider read/open follows the actual cell address, stale owner adapters never revive, and incomplete proof participation blocks writes without suppressing degraded reads. This `refines` the existing reference-coordination contract; Question Map, unknowns, glossary, aliases, Skill and rules are unchanged. Runtime/mirror deployment remains separately gated.
- 2026-08-07: Framework update check `updated` for deployment evidence only. The verified Hub adapter-routing bytes now align across runtime/dev/mirror, while all eight bounded business/environment sentinels are unchanged. This is `no_model_change`: owner, schema, lease and degraded-read claims remain as recorded on 2026-08-06. Actual Obsidian UI smoke remains pending because the running process predates the disk copy.
- 2026-08-06: The verified Ontology Hub/reference compatibility set is now synchronized to runtime/dev/mirror after explicit confirmation, role-correct backup and unchanged eight-file business/environment sentinels. This updates deployment confidence from repository-dev evidence to static runtime evidence without changing the framework model. Actual UI smoke remains pending after reloading Obsidian and enabling the newly installed Hub.

## 2026-08-07 - Ontology Backlink Proof And Editor-Scoped Save Admission

status: runtime_synced_static_verified_ui_smoke_pending

- User console evidence corrected the meaning of `references: []`: both providers were available but timed out, so the result was an incomplete proof rather than a complete zero.
- Refined the cross-plugin reduce contract to share one bounded in-flight proof across visible cells, retain only complete proof results, and expose incomplete provider reasons without authorizing destructive operations.
- Refined content-owner save admission: an independently open daily-item Ontology editor receives a private owner/provider lease instead of depending on or reopening the Daily Lessons Dashboard's global write gate.
- Repository-dev syntax and focused regressions pass. Independent verifier `019fd7e9-37aa-79a3-8a6f-546da8da35ba` returned `PASS_WITH_ACTIONS`; no P0/P1.
- Bayesian update: `refines` existing Map/Reduce, proof-sensitive UI and owner-scoped write-admission contracts. No new owner, persistent index, schema version or EVA relation is introduced.
- Runtime/mirror, owner JSON and plugin data remain untouched. Explicit deployment confirmation and actual Obsidian smoke are still required.
- Deployment update: after explicit confirmation, the four verified code assets now align across runtime/dev/mirror. Eight business/environment sentinels stayed byte-identical and deployment verifier `019fd822-aeee-75f3-8725-8c7ee65a56e2` found no P0/P1/P2. This changes deployment confidence only (`no_model_change`); full Obsidian restart and interaction smoke remain pending.
- 2026-08-07: Framework update check `updated`. The Ontology reference display contract is refined to `source -> Ontology object -> column lineage`; rows stay in stable addresses and do not become human breadcrumb semantics. Provider Map stages supply bounded descriptors and Hub Reduce renders them without N+1 owner resolution. Read-only proof requests roll forward across editor-generation invalidation, while mutation proof gates remain unchanged. Meta pointers occupy no space outside A/B capture and do not hide existing relation evidence. Evidence is repository-dev code, focused regressions and verifier `019fd856-0ec9-77f3-a215-001dbcdaffa8` `PASS`. Runtime deployment and actual Obsidian smoke remain pending; Question Map, unknowns, glossary, aliases and Skill are unchanged because this refines an existing contract rather than adding an unresolved concept or execution guardrail.
- 2026-08-07: Deployment update `no_model_change`. The verified readable-backlink and Meta-pointer assets are synchronized across actual runtime, repository dev and mirror after fresh role-specific backups and eight unchanged business/environment sentinels. Deployment verifier `019fd9a7-3e72-7242-bc7b-7b351b55510c` returned `PASS`; Obsidian subsequently restarted at 08:38. Remaining evidence gap is only the actual UI interaction smoke.
- 2026-08-07: Framework update check `updated`. User-confirmed semantics correct the former retained-lineage model: while A is referenced, A is the sole Schema authority and B is a mapped local projection; after final unlink B either forks independently when used/uncertain or becomes blank only under complete zero-use proof. Repository dev adds canonical `schemaaddr:v2`, exact owner-native Schema-only editing, recursive reconcile, bounded provenance, proof-sensitive detach and one cross-date Mandala completion Schema authority/lease. Hub remains coordinator, Workspace remains shared engine/editor provider, and Mandala retains formal owner JSON. This `corrects` the unlink claim and `refines` ownership/CAS contracts; Question Map, unknowns, glossary, Skill and rules are unchanged because code/tests close the behavior under existing safety rules. Verifier `019fda36-df0e-78e1-92de-8cb4d44db112` returned final `PASS`; runtime/mirror and business JSON remain untouched pending explicit confirmation.

## 2026-08-07 - Shared Schema Detach/Close Hotfix And Runtime Synchronization

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: unlinking after an unsaved edit could leave a stale formal Shared-Schema marker, repeatedly fail source resolution, and trap the editor in a close/reopen loop. The visible warning lacked enough structured evidence to diagnose which graph or guard rejected the operation.
- Corrected claim: Shared-Schema lifecycle is graph-level. A draft partitions roots into active, pending-detach and invalid-orphan sets; pending-detach graphs do not resolve the former source and are finalized once at formal save, while malformed explicit reference evidence fails closed.
- Recovery/close now precedes modal destruction. X, `Esc`, overlay close and programmatic close cannot discard an unresolved dirty draft; explicit keep/discard controls make the exceptional paths visible, and late asynchronous results are invalidated after close.
- Rejected operations publish `[Workspace Mount][ontology.shared-schema-rejected]` with graph, address, stage, reason and parent evidence. This refines the diagnostic contract without moving formal ownership to Hub or Mandala.
- The Workspace hotfix and Mandala display rename `限制项和能量配置` were synchronized from proven Dev to actual Runtime and Mirror. Workspace and Mandala hashes align three ways at `29738D64...07C5C8` and `627915A7...ABD55`; eight business/environment sentinels remained byte-identical.
- Independent post-change and deployment verification both returned `PASS`. Bayesian update: `corrects` parent-column detach finalization and stale live-source assumptions, and `refines` recovery-first close and rejection diagnostics.

Boundary:

- Mandala's rename is presentation-only; `self_restraint`, item identities, scores and history remain unchanged, with no migration.
- Question Map, unknowns, glossary, aliases, Skill and rules remain unchanged. Existing no-ghost-data, recovery, structured-console, verifier, backup and three-way deployment rules already govern the reusable behavior.
- MemPalace was not mined. Actual unlink/save/reopen interaction smoke remains pending after the next Obsidian launch.

## 2026-08-07 - Structured Schema Authority And Corrupt-Draft Escape Hatch

status: runtime_synced_static_verified_restart_smoke_pending

- Observation: runtime rejection diagnostics showed `schemaaddr:v2.authorityStableRef: "[object Object]"`; the address could not resolve and correctly blocked reconcile/save.
- Root cause confirmed by code: Hub display-style normalization had stringified an opaque authority object, while Mandala's editor binding omitted the Schema-specific authority fields needed by daily completion.
- Claim update: opaque address refs retain structured type end to end. A lossy legacy string is never reconstructed or silently repaired. Only a durable recovery draft with zero valid and zero malformed recursive reference evidence may be explicitly converted to a local structure.
- Owner/provider/consumer: Mandala remains the formal daily owner and supplies authority; Hub preserves/canonicalizes the address and coordinates; Workspace supplies editor recovery and owner-CAS boundaries.
- Repository-dev changes and focused regressions passed; independent verifier `019fdc88-fafe-7e90-ab1f-0b30f9e68fab` returned `PASS`, no P0/P1/P2. Runtime, mirror and all business JSON remain unchanged pending separate deployment confirmation.

Bayesian update: `refines` the existing Shared-Schema authority/recovery contract. Atlas Hub, Workspace and Mandala pages were updated. Framework Question Map, Atlas unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged because ownership and safety behavior are closed by code/tests under existing guardrails.

Deployment update: after explicit user confirmation, only Hub, Mandala and Workspace `main.js` were copied from verified Dev to actual Runtime and Mirror. Three-way code hashes align `9/9`; nine syntax checks and Dev/Runtime focused regressions pass; eight environment/business sentinels remain byte-identical. Independent deployment verifier `019fdc88-fafe-7e90-ab1f-0b30f9e68fab` returned `PASS`, no P0/P1/P2. This is `no_model_change`; Obsidian was running from pre-deployment bytes, so restart interaction smoke remains pending.

## 2026-08-08 - Ontology Exact Navigation Feedback And Filter Projection

status: runtime_synced_static_verified_ui_smoke_pending

- Runtime evidence update: the user confirmed the prior Shared-Schema and structured-authority recovery workflow behaves as intended after restart and interaction testing. This closes that smoke gate without any new data write.
- Framework update check: `updated`. Exact owner navigation now includes a bounded destination-cell feedback phase: address resolution and owner routing are unchanged, while Workspace owns a 2.4-second visual highlight and modal-lifecycle timer cleanup.
- `已有内容` source capsules are a Hub view projection over already-filtered owner facets. Specific sources with non-positive or malformed counts are omitted; synthetic `全部` remains visible. If a selected source becomes hidden, Hub clears it and reloads the unfiltered family page.
- Bayesian label: `refines`. This adds navigation observability and filter-state coherence without changing formal owners, provider contracts, reference graphs, Schema authority, persistence or business JSON.
- Repository-dev syntax and both focused regressions pass. Independent verifier `019fdd52-b9e6-73b2-b15c-b0d273b7d08d` returned `PASS`, no P0/P1/P2.
- Question Map, unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.
- Deployment update: after explicit confirmation, verified Dev bytes for Hub `main.js` and Workspace `main.js/styles.css` were copied to actual Runtime and Mirror. Three-role hashes align `9/9`, deployed feature sentinels pass `12/12`, eight business/environment sentinels remain unchanged, and Runtime regressions pass. Deployment verifier `019fdd72-985e-7b70-aa35-15d0f6cf90c7` returned `PASS`. This is `no_model_change`; Obsidian still needs plugin reload or restart for UI smoke because its processes predate the disk copy.

## 2026-08-08 - Ontology Rectangular Content Clipboard

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: recurring daily reuse sometimes needs an explicit finite `m x n` content copy, not a recurring template or Schema/reference clone.
- Claim update: Workspace Mount's shared editor may carry exact cell text and same-file image identities through one transient, vault/editor-generation-scoped clipboard. Structural and relational state is excluded by construction.
- Safety: fixed existing shape, raw-empty destinations only, all-or-nothing rejection, post-confirmation rechecks, clone-validate-swap, rollback-safe recovery scheduling, bounded diagnostics and no owner JSON write until the existing save lifecycle.
- Interaction: drag or first/last selection, cross-modal navigation, explicit target arming, confirmation, cancel-with-clipboard-retained, explicit clear and pseudo-element conflict/success cues. Range and Meta remain mutually exclusive.
- Repository Dev syntax, Workspace regression and Hub/Mandala integration regression pass. Verifier `019fdfc2-41c7-7c82-a915-9758018d93a0` returned final `PASS`, no P0/P1/P2.

Bayesian update: `refines` the Workspace material/editor layer. No persistent owner, recurring-template lifecycle, provider API, address/schema contract or business JSON is introduced. Question Map, unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged. Runtime/Mirror deployment and real Obsidian UI smoke are separately gated.

Deployment update: after explicit user confirmation, only Workspace `main.js/styles.css` were copied from verified Dev to actual Runtime and Mirror. Three-role hashes align `6/6`, feature sentinels pass `10/10`, five syntax checks and both isolated Runtime regressions pass, and eight fresh business/environment sentinels remain byte-identical. Deployment verifier `019fe070-b807-7231-90c6-49a3eba168eb` returned `PASS`, no P0/P1/P2. Bayesian label: `no_model_change`; only deployment confidence changed. Actual UI smoke remains pending because Obsidian processes predate the copy.

## 2026-08-08 - Inactive Daily Ontology Discovery Projection

- Classified the change as a Mandala owner-provided read-only discovery projection, not a Hub ownership or data-schema change.
- Recorded the reusable lifecycle rule: reversible stop may hide a directory row while stable owner identity, formal Ontology and relationship resolution remain intact.
- Framework/Atlas update check: `updated` at `atlas/plugins/mandala-time-blocks.md`, Atlas log and the dedicated engineering change record. No glossary, alias, Question Map, Unknowns or Skill rule change was needed.
- Deployment update `no_model_change`: the inactive-daily discovery projection was synchronized code-only across Mandala Runtime/Dev/Mirror (`3/3`) and passed syntax plus isolated Runtime regressions. No formal owner, contract, Schema or business-data claim changed. Five sentinels stayed byte-identical; later running-Obsidian writes to `Workspace_Items.json`, `workspace-mount/data.json` and `Mandala_DailyLessons.json` were preserved. Loaded UI smoke remains pending reload/restart.
## 2026-08-09 - Project-Primary Shared Recursive Schema Authority

Reason:

- Project primaries use one standard cognitive-envelope form, but the previous longitudinal owner model forced each project to recreate the same recursive Schema.
- The user selected the existing recursive Schema of `电路板外委工艺要求` as the initial project-family authority while explicitly keeping goal-primary Ontologies independent.

Actions:

- Refined Mandala's longitudinal shard into independent goal documents plus one project Schema authority and owner-local project table instances.
- Preserved the seed's exact pre-existing `schemaaddr:v2` identity and recursive Schema ids; no Hub production change or read-time migration was introduced.
- Added guarded v1/v2 reading, project-only atomic migration, split Schema/instance/raw CAS, all-current-and-historical-instance admission, Schema-only instance preservation, deterministic writable-owner routing and zero-project bootstrap.
- Updated the Mandala plugin Atlas and cross-plugin contract page. Framework registry, Question Map and unknowns remain unchanged because no new entrance or unresolved ownership question was introduced.

Evidence:

- Repository Dev Mandala and focused integration regression.
- Workspace Ontology editor regression.
- Independent staging verifier final `PASS`, P0/P1/P2 none.
- After explicit user confirmation, only Mandala `main.js` was synchronized from verified Dev to actual Runtime and Mirror. All three code copies align at `EFDB96865CE3BB6011E39850EC5054DDBA59516449ED04D4E319B43735284984`; the business shard remains unchanged at `936F2F61E6C2EA0174A0221FB5A862D9C2DB5301090541196C1DE678F65A4EE8`. Runtime syntax, Dev integration regression and Workspace regression pass. At deployment time, loaded UI smoke remained pending plugin reload/restart.

Post-deployment user verification (2026-08-09):

- The user opened multiple project primary keys and confirmed that each displays the same recursive Schema configuration.
- This confirms deployed project-primary Schema-shape reuse only. Project text, images, rows, nested instances and historical content remain owner-local; goal-primary Ontologies remain independent.
- Source status: `confirmed_by_user_and_code`.
- Bayesian update: `no_model_change`; this raises runtime confidence without changing ownership, Schema authority, CAS, lifecycle or data-retention claims.
- No Question Map, Unknowns, Skill/rules, program files, Runtime/Mirror files or business JSON were changed in this evidence landing.

Bayesian update: `corrects` the prior claim that all longitudinal owners store independent full documents and `splits` goal-primary independence from project-primary shared structure. Source status: `confirmed_by_user_and_code`. MemPalace status: `not mined`.

## 2026-08-09 - Ontology Keyword Sidecar And Meta Hub Index

status: runtime_synced_static_verified_ui_smoke_pending

- Added an additive Ontology Keyword capability. `keyword-index-plugin` owns `data/ontology_keyword_index.json`; ordinary `keyword_index.json` remains untouched. `ontology-meta-hub` adds a Keyword rail/tab, bounded target selection, per-owner tag management and lease-routed navigation.
- Contract: structured `ontology-owner-ref:v1`, `okw-` ids, one-to-many target-to-label binding, one-to-one active label binding, tombstone deletion, reserved IDs, CAS/write-read validation and ready/unavailable/changed lifecycle events.
- Repository Dev syntax, existing Hub/Mandala/Workspace regressions and the dedicated sidecar lifecycle test pass. No Runtime/Mirror code or business JSON was changed. Runtime deployment and actual Obsidian UI smoke remain explicitly gated by user confirmation.
- Bayesian update: `adds` a keyword-index sidecar owner and `refines` Ontology discovery/navigation without changing Ontology formal ownership, Schema/reference semantics or ordinary keyword topology. Question Map, Unknowns, glossary, aliases, Skill and rules remain unchanged because existing owner/provider, history-retention, backup and runtime gates cover the behavior.

## 2026-08-09 - Ontology Keyword Locator Categories

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: the user uses a leading capital letter as a manual location/category code, such as `C操作上下文主键汇总`; the letter is not semantic keyword text. The Keyword Index precedent already preserves raw locator identity while removing the prefix in presentation.
- Claim update: Ontology Keyword raw labels retain `A-Z + body`; category and display body are runtime-derived API fields. Semantic uniqueness is based on the stripped body, while search accepts both raw and stripped forms. Existing unprefixed legacy records stay readable and no sidecar migration occurs.
- Hub consequence: the Keyword view provides wrapping horizontal category capsules and an existing-category-only sticky right rail. Standalone and Mandala-embedded surfaces scroll their existing owner container; Hub introduces no nested vertical scroll owner.
- Boundary evidence: the affected Mandala daily item had no persisted `ontology` field before the keyword was created. The separate sidecar did not delete Ontology data, and this work does not write or normalize Mandala, Workspace or ordinary Keyword business JSON.
- Verification: repository-dev syntax, dedicated Keyword regression, Hub regression and Workspace editor regression pass. Independent verifier `019fe56e-57f4-70a2-9c31-edcf8f6b0656` returned `PASS`, with no P0/P1/P2.
- Bayesian update: `refines`. Source status: `confirmed_by_user_and_code_and_memory`. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged. Runtime/Mirror deployment and loaded UI smoke remain gated by explicit confirmation.

Deployment update:

- After explicit confirmation, synchronized the three verified code/style assets to actual Runtime and Mirror. Dev/Runtime/Mirror align `9/9`; four deployed JavaScript syntax checks, locator/category sentinels and three focused regressions pass.
- `ontology_keyword_index.json`, ordinary `keyword_index.json`, Keyword plugin `data.json`, `Mandala_DailyLessons.json` and `Workspace_Items.json` retained exact before/after hashes; Hub `data.json` remained absent. No business JSON was copied, normalized or written.
- Deployment backup and rollback source: `state/backups/ontology-keyword-deploy-20260809-154548`. Independent deployment verifier returned `PASS_WITH_ACTIONS`; its documentation-status P1 was remediated before delivery.
- Bayesian update: `no_model_change`. Runtime confidence changed; owner, sidecar schema, Ontology routing and locator semantics did not. Loaded standalone/embedded Hub UI smoke remains pending plugin reload.

## 2026-08-09 - Ontology Keyword In-Place Rename

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: the Ontology keyword manager exposed target rebinding and deletion but no way to rename an assigned keyword, even though Keyword Index already owned an update path.
- Claim update: rename is an owner-native in-place mutation. It preserves `okw-...` identity, target, target snapshot, creation time and reserved-id history; the Hub remains a consumer and never implements delete/recreate.
- Concurrency refinement: Hub sends the opened record's `label/updatedAt`; Keyword Index checks that snapshot inside its serialized mutation before existing CAS/backup/readback publication. Same-generation stale windows fail closed, and unchanged labels do not write or increment revision.
- Interaction: the raw locator label is prefilled; format, semantic duplicate, provider-generation, record-stale and CAS failures retain the modal and input. Success alone refreshes the parent manager and closes.
- Verification: repository-dev syntax and focused Keyword, Hub and Workspace regressions pass. Runtime/Mirror and business JSON remain unchanged pending explicit confirmation.
- Bayesian update: `refines`. Source status: `confirmed_by_user_and_code`. Framework Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

## 2026-08-10 - Ontology Keyword Hub-Local Exact Navigation

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: keyword capsules were visually overloaded with target/source address lines and opened the Ontology editor directly, while the desired role is an index that returns the user to the matching object in the Hub meta table.
- Claim correction: the capsule projects only `locator badge + semantic keyword`. Its click is a Hub-local discovery jump; explicit row actions remain the owner-open and source-reveal commands.
- Navigation contract: Hub compares the full `ontology-owner-ref:v1` identity, scans bounded family pages, derives the source capsule from the exact matched owner descriptor, revalidates complete source facets, then atomically switches family/source and highlights the row. It never matches titles.
- Failure semantics: independent jump generation/lease checks, provider cancellation, cursor-loop/empty-continuation/page/entry guards and incomplete-source refusal preserve the current Keyword page on failure. Standalone `.omh-page` and embedded `.mtb-widget-body` remain the only scroll owners.
- Verification: repository-dev Hub syntax plus Hub, Keyword and Workspace focused regressions pass. Plan verifier `019fe72d-70f2-7930-a4b9-7c386e493b0e` returned `PASS_WITH_ACTIONS`; all P1 actions were incorporated before final verification. Runtime/Mirror and business JSON remain unchanged pending explicit synchronization.
- Bayesian update: `corrects` the prior direct-open interaction and `refines` the existing discovery/navigation layer. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

## 2026-08-11 - Daily Shared-Schema Cross-Date Reference Retention

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: the 2026-08-07 daily record referenced the first row of a daily-item Ontology column; the 2026-08-10 record then attempted to reference the second row of that same source column and was incorrectly treated as colliding with an unrelated local child Schema.
- Claim update: a Shared-Schema binding is attached to stable parent-column/Schema lineage, not an exclusive row/date/whole-column slot. Different dates may reference different source rows in the same source column while reusing one recursive authority.
- Save boundary: ordinary saves retain pending bindings. Detach requires a structured explicit reference-removal diff for the same stable parent-column ID plus owner proof that no date instance still references it; malformed or drifting evidence fails closed.
- Recovery boundary: an earlier erroneous fork can recover lineage metadata only after strict three-way recursive equivalence among local Schema, bounded provenance and current source authority. Content, images, rows, table instances and stable IDs remain untouched.
- Repository verification: Workspace and Hub/Mandala regressions pass, both JavaScript bundles pass syntax checks, and independent verifier `019feb55-ecbf-74e0-865e-47ba33348bcc` returned `PASS` with no P0/P1.
- Deployment update: after explicit user confirmation, only Workspace Mount and Mandala `main.js` were copied from verified Dev to actual Runtime and Mirror. Dev/Runtime/Mirror align at `5D7C01450A3BC8276ED21FF1CD5891B3D74FD5C46615420DFFA7CA39807C96D4` and `F620F005801E9E73A28CCA38E8792764D2C45F2497BB6D5803E55F86BB82021D`; six syntax checks, both focused regressions and all six feature-sentinel comparisons pass. All six business/settings sentinels were byte-identical across the deployment copy window. Later normal Obsidian activity changed only both plugin-local `data.json` sentinels; the four business shards remained equal. Deployment backup: `state/backups/ontology-daily-shared-schema-reference-deploy-20260811-085642`; loaded-UI smoke remains pending plugin reload or Obsidian restart.
- Post-deployment verifier round 1: `019fee58-eaa9-7cb2-a01f-6e93a81d7e1d` found no code/hash/backup defect but returned `FAIL` because `atlas/contracts.md` still carried a repository-dev status and because current plugin `data.json` state had advanced after the deployment-window snapshot. The Atlas status was corrected to `runtime_synced_static_verified_ui_smoke_pending`; sentinel wording now distinguishes deployment-copy evidence from later owner-native environment-state writes.
- Final post-deployment verification: after the canonical status and after-hash manifest remediation, verifier `019fee58-eaa9-7cb2-a01f-6e93a81d7e1d` returned `PASS`; P0/P1/P2 none.
- Bayesian update: `refines` the existing Shared Schema authority/detach and daily-record ownership contracts. Source status: `confirmed_by_user_and_code`. Question Map, Unknowns, registry, Skill/rules and MemPalace remain unchanged because no new owner, entrance or unresolved system question was introduced.

## 2026-08-11 - Personal Fund Ledger Reversal Modal

status: repository_dev_verified_runtime_confirmation_pending

- Observation: the user entered a 2026-08-11 purchase under the wrong fund, but the row-level `冲销` action appeared inert.
- Root cause: the action depended on native `window.prompt()`, which is not a reliable Obsidian Electron input surface.
- Claim update: transaction corrections remain append-only. The original transaction is retained, a linked reversal and audit event are appended, and the intended correct-fund purchase is entered separately.
- Repository Dev now uses the plugin's draft-protected `FormModal`, binds the draft to the original record ID/hash, requires and trims the reason, rejects duplicate reversal, and explains that reversal does not automatically transfer the investment.
- Verification: plugin build, XIRR fixtures, parity/store/draft/reversal/UI regressions, and bundle syntax pass. Runtime `ledger.json` remains byte-identical to the pre-change observation.
- Independent verifier `019ff039-ae83-7611-be5f-83ac90def027` returned `PASS`, with no P0/P1/P2; loaded Obsidian interaction smoke remains a post-deployment P3.
- Bayesian update: `adds` a narrow owner page and `refines` the reusable correction UI contract. Question Map, Unknowns, glossary, aliases, Skill/rules, Runtime, Mirror, and business JSON remain unchanged pending explicit deployment confirmation.

Deployment update:

- After explicit user confirmation, only verified `main.js` and `styles.css` were copied from Repository Dev to Actual Runtime and Mirror.
- Dev/Runtime/Mirror align at `5B32067EB45947CCD712A8D98FE0070C4CCA5CC87848E6D966CE509AC99E92C5` and `907A9C188ADB7E65507DEC50AF6EADDCFAFAFF0FB9576DC76F8BBF96E821B539`.
- Three bundle syntax checks, the full Repository Dev test suite, and deployed reversal sentinels pass. Seven Runtime business/environment files were byte-identical across the deployment copy window; `ledger.json` remained `B117359B496C231AA1A5EF99A19BDE53652F55F8CB415E37A549792C64C865B0`.
- Deployment backup: `state/backups/personal-fund-ledger-reversal-deploy-20260811-175951`. Independent deployment verifier `019ff045-68d1-74a1-9971-c5745f7b8480` returned `PASS`, no P0/P1/P2.
- Bayesian update: `no_model_change`; deployment confidence changed, while owner, append-only correction semantics, data schema, Question Map, Unknowns, Skill/rules, and business data did not. Loaded UI smoke remains pending plugin reload.

## 2026-08-12 - Temporal Joint Relation Adjustment

status: repository_dev_verified_runtime_confirmation_pending

- Observation: a relation conflict may require moving both endpoint outcomes together; editing one endpoint at a time can be blocked by the invalid intermediate state and risks an asymmetric repair workflow.
- Claim update: relation-conflict repair is one owner-local atomic transaction. A temporary joint projection replaces both Placements simultaneously, validates shapes, framework bounds, hierarchy containment and every active relation touching either endpoint, then appends two move events only after all admission checks pass.
- UI update: the conflict diagnostic opens a bounded conflict list and a large shared-axis two-track Modal. Both intervals, start/end boundaries and effective due dates support pointer and keyboard adjustment; an `aria-live` text verdict accompanies red/green state.
- Persistence boundary: one `TemporalStore.save(expectedRevision)` writes both events under one revision. Stale revision, one invalid endpoint, third-party relation conflict, hierarchy conflict or final Store rejection leaves current hash, revision, ordinal and event count unchanged.
- Verification: full Repository Dev build, engine/store/Mandala/UI contract suites and generated bundle syntax pass. Plan verifier `019ff42b-cd16-79c3-bef1-81951b0d9b74` returned `PASS_WITH_ACTIONS`; all actions were incorporated before final verification.
- Final verification: verifier `019ff43c-c79b-7400-9229-9601d8e579f0` returned `PASS` after canonical TimeBox-address and realtime full-admission test remediation; P0/P1/P2 none.
- Bayesian update: `refines` the existing Temporal scheduling-admission contract. Owner/provider/consumer and JSON schema do not change; Question Map, Unknowns, Skill/rules and MemPalace remain unchanged. Runtime and Mirror remain untouched pending explicit deployment confirmation.

Deployment update:

- After explicit user confirmation, only Temporal Framework `main.js` and `styles.css` were synchronized from verified Repository Dev to the proven actual Runtime and repository Mirror.
- Dev/Runtime/Mirror align at `C67C21A560A24AD3260457A374B955C6F1CCFE6FCB5D758CA2090F50736C2243` and `F01A719B289F366C45914FC19F025E881B7D32BFE401E5A3C2750B773B9C6567`.
- The full Repository Dev test suite, three bundle syntax checks and 16 x 2 deployed feature sentinels pass. All 47 business/environment sentinels remained byte-identical across the deployment window.
- Deployment backup: `state/backups/temporal-combined-deploy-20260812-125209`. Independent verifier `019ff454-d87f-7521-96aa-1040dda54c15` returned `PASS_WITH_ACTIONS` with no P0/P1; the only action was documentation status closure, now completed. Loaded Obsidian interaction smoke remains pending plugin reload.
- Bayesian update: `no_model_change`; deployment raises runtime confidence without changing ownership, JSON schema, relation semantics or State Capsules integration status.

## 2026-08-11 - Temporal Framework Repository Dev

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: weekly tracking and Timeline preserve local temporal facts but do not provide a complete top-down future outcome architecture across year, quarter, month and week.
- Claim update: Temporal Framework is a separate strategic planning owner based on orthogonal Time and Outcome dimensions. It consumes stable Mandala goal/project identities and does not take ownership of Mandala, Workspace, Project Overview or Timeline data.
- Implementation: append-only event reducer, recoverable owner store, draft-protected direct-entry modals, Time-first/Outcome-first views, independent breadcrumbs, typed relation lenses, stage gates, explicit no-deployment coverage and manual paint/unpaint.
- Contract update: Mandala Repository Dev adds `sourceScope`, `sourceNotePath` and `identityVersion: 1` to planning-target rows and snapshot without removing existing fields.
- Verification: plugin build and focused engine/store/UI/Mandala contract tests pass. Implementation verifier `019ff0c9-a6b7-7e80-b497-68abfef4734e` returned `PASS`; Runtime/Dev/Mirror static deployment gates also pass.
- Bayesian update: `adds` the strategic time-architecture layer and `refines` the planning-record-execute-review workflow. Source status: `confirmed_by_user_and_code`. MemPalace vector search fell back to the bounded allowlist and found no prior dedicated Temporal Framework claim.

Deployment update:

- After explicit confirmation, synchronized the verified Temporal Framework release set and additive Mandala identity contract to the proven actual Runtime and repository Mirror. All 15 role/file hashes align, six bundle syntax checks, three manifest parses, the full focused test suite and 24 feature sentinels pass; eight business/settings sentinels remained byte-identical.
- Deployment backup: `state/backups/temporal-framework-deploy-20260811-204031`. Independent deployment verifier `019ff0d8-f7a7-7422-b8cc-7a40200e1a76` returned `PASS`, no P0/P1. Bayesian update: `no_model_change`; this raises deployment confidence without changing ownership, lifecycle, State Capsule or append-only contracts. Actual Obsidian enable/reload interaction smoke remains pending.

## 2026-08-11 - Temporal Outcome To Owner Ontology

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: a strategic outcome needs direct access to the Ontology of its owning goal/project primary key, while project owner aliases and retained historical owners remain Mandala-owned identity semantics.
- Claim update: Temporal must not derive or persist Mandala Ontology addresses. Mandala resolves the stable planning tuple to one provider-native `stableRef`; zero and ambiguous matches fail closed.
- UI update: outcome create/revise/detail surfaces expose the owner Ontology action without submitting or closing drafts; outcome modals use a wider surface; invalid planning candidates are filtered again in Temporal.
- Verification: full Temporal build/regressions and Mandala syntax pass; plan verifier `019ff139-c6a3-7310-a13c-df35a967dcd6` returned `PASS_WITH_ACTIONS`, final verifier `019ff18a-207b-7ee1-8ba2-97fb6d4ed485` returned `PASS`.
- Bayesian update: `refines` the cross-plugin identity-routing contract. Source status: `confirmed_by_user_and_code`. Question Map, unknowns, glossary, aliases, Skill/rules and MemPalace are unchanged.

Deployment update:

- After explicit confirmation, copied only Temporal Framework `main.js/styles.css` and Mandala `main.js` from verified Repository Dev to actual Runtime and repository Mirror.
- All nine role/file hashes align; the full focused suite, six syntax checks and 20 deployed feature sentinels pass. Deployment backup: `state/backups/temporal-outcome-ontology-deploy-20260812-001500`.
- Ten of eleven business/settings sentinels remained byte-identical. Running Obsidian reordered only the final two ids in `community-plugins.json` while preserving the exact enabled-plugin set; the current file was preserved. Three later Temporal owner writes occurred after the deployment snapshot and were also preserved.
- Independent deployment verifier `019ff1a5-9be0-7740-b398-e3f882cc5b5c` returned `PASS_WITH_ACTIONS` with no P0/P1. Bayesian update: `no_model_change`; loaded Modal/jump UI smoke remains pending.

## 2026-08-12 - Temporal Outcome Horizontal Containment

status: runtime_disk_synced_static_verified_ui_smoke_pending

- Observation: vertical TimeBox chronology should remain the temporal frame, while outcome hierarchy is clearer when read horizontally as parent containers with side-by-side children and recursively nested descendants.
- Claim update: Outcome-focused Time view now separates the two axes visually. TimeBoxes remain vertically ordered; each focused TimeBox occupies the available row and renders a bounded horizontal recursive-containment forest. Ordinary global Time view remains unchanged.
- Responsive contract: child grids use `minmax(min(100%, 240px), 1fr)`, wrap without horizontal scrolling, preserve long-title and relation-chip wrapping, and keep the existing missing-parent path, date ordering, relation semantics and 32-level recursion guard.
- Verification: full Repository Dev build/test and bundle syntax pass. Plan verifier `019ff1b4-b3b1-7410-8620-ffbc38a3413a` returned `PASS_WITH_ACTIONS`; all implementation actions were incorporated. Browser visual smoke could not initialize because the system C drive had zero free bytes, so loaded Obsidian UI smoke remains pending.
- Bayesian update: `refines` the existing Temporal UI projection contract. Source status: `confirmed_by_user_and_code`. Ownership, data schema, public API, Question Map, Unknowns, Skill/rules, Runtime, Mirror and business JSON remain unchanged.
- Follow-up observation: `全部主键` cannot remain a relation-blind inventory. It now keeps the flat TimeBox list while projecting active same-framework relations under both endpoints, including peers in other TimeBoxes. Endpoint wording is translated into the current card's viewpoint, stable-sorted, conflict-aware and read-only.
- Follow-up verification: pure engine tests cover outgoing/incoming endpoints, inactive and cross-framework rejection, cross-TimeBox retention, historical conflict projection and unchanged projection hash. UI contracts cover the shared renderer and global wrapper. Plan verifier `019ff1c0-d34f-7d50-8b5f-9ca175dca86b` returned `PASS_WITH_ACTIONS`; all actions were incorporated.
- Final verification: verifier `019ff120-429c-7472-858e-78f19064a3a3` found only an incomplete two-stage rollback record. After both backup roots and a six-file per-source mapping were added, recheck returned `PASS` with no P0/P1/P2. Bayesian label remains `refines`; no model or ownership change occurred.
- Deployment update: after explicit confirmation, verified Temporal `main.js` and `styles.css` were synchronized to actual Runtime and repository Mirror. Dev/Runtime/Mirror align at `DC2C71D5...CD14D` and `828D9554...E1714`; full tests, three syntax checks and eight feature sentinels pass. Twelve business/environment sentinels were byte-identical across the deployment window. Backup: `state/backups/temporal-horizontal-relations-deploy-20260812-060345`. Bayesian update: `no_model_change`; loaded Obsidian UI smoke remains pending.
- Post-deployment documentation recheck: verifier `019ff120-429c-7472-858e-78f19064a3a3` confirmed the deployment-state remediation and returned `PASS` with no P0/P1/P2.

## 2026-08-12 - Temporal Global Structured Time Projection

status: runtime_synced_static_verified_ui_smoke_pending

- User practice corrected the prior global-Time assumption: relation chips under a flat list do not expose outcome structure clearly enough when `全部主键` is selected.
- Repository Dev now keeps TimeBoxes vertically chronological and full width, groups each TimeBox by stable target membership, and renders a local horizontal recursive containment forest inside each group. A view-only `时间清单` switch preserves strict chronological scanning.
- Cross-membership children remain explicit local roots with full paths and parent jumps; long placements are projected independently into each overlapping TimeBox. Historical duplicate relation tuples merge only in read projection and retain every relation ID, while new active duplicate tuples are rejected before append.
- Full tests and bundle syntax pass. Plan verifier `019ff3fa-6fc6-7541-bd81-01bfdf02d75c` returned `PASS_WITH_ACTIONS`; all required actions were incorporated. Backup: `state/backups/temporal-global-structure-20260812-112500`.
- Bayesian update: `corrects` the old global-flat default while preserving the flat list as an optional environment-only lens. Data schema, ownership, event format, Runtime, Mirror and business JSON remain unchanged.
- Final verifier `019ff413-d4cb-7a62-99d9-af5a35093c8e` rechecked the P2 remediation and returned `PASS`; P0/P1/P2 none. Loaded UI smoke remains post-deployment.

## 2026-08-12 - Temporal Non-Destructive Boundary And Local Expansion

status: runtime_synced_static_verified_ui_smoke_pending

- User confirmed that framework start/end may change only when all existing dated content remains valid; historical data must never be trimmed, moved or deleted automatically.
- Repository Dev adds pure boundary-conflict projection plus one append-only framework revise event. Active Placements must remain contained; canonical Coverage may partly intersect but may not be fully excluded; malformed or old-policy Coverage fails closed. Membership planning windows remain import-time snapshots.
- The structured Time projection now has per-outcome `0..32` local expansion depth. Roots default to one layer, inherited budget decreases recursively, and a child's explicit depth can independently reveal its next layer. A collapsed node is visually distinct and reports the hidden descendant count. Preferences persist in plugin `data.json`, never in `Temporal_Framework.json`.
- Plan verifiers returned `PASS_WITH_ACTIONS`; all P1/P2 actions were incorporated. Full build, engine, store, Mandala and UI-contract tests pass using repository-local D-drive temp and npm-cache directories after the system C-drive reported `ENOSPC`.
- Framework/Atlas update check: `updated`; Bayesian label `refines`. Ownership, public API, Mandala contract, event bucket schema and State Capsule integration remain unchanged. Runtime, Mirror and business JSON remain untouched pending final verification and explicit deployment confirmation.

Deployment update:

- After explicit user confirmation, synchronized only verified `main.js` and `styles.css` to the proven actual Runtime and repository Mirror. Backup: `state/backups/temporal-boundary-expansion-deploy-20260812-135927`.
- Dev/Runtime/Mirror hashes align at `9BC160DD...BA1F0` and `11A6D28C...E3BA3`; full tests, three bundle syntax checks and deployed feature sentinels pass. All twelve tracked business, draft and settings paths stayed byte-identical.
- Bayesian update: `no_model_change`; deployment raises runtime confidence without changing ownership or event contracts. Loaded boundary-editor, local `+/-`, collapsed cue and restart-memory smoke remain pending plugin reload.

## 2026-08-12 - Temporal Local TimeBox Navigation

status: runtime_synced_static_verified_ui_smoke_pending

- User practice clarified that Time mode is read through a current temporal anchor such as W31/W32, while each TimeBox may contain a large recursive outcome structure. A full framework TOC would be noisy and a floating overlay would obscure the work surface.
- Repository Dev adds a non-overlapping local navigation rail derived from the same TimeBox array and active scale. It selects the TimeBox crossed by the viewport reading line and shows at most seven labels (`current ±3`), updating only the rail DOM on scroll.
- Explicit rail jumps use the actual `contentEl` scroll container, dynamic sticky occlusion and a pending explicit anchor that outranks ordinary view-preserving restoration. Every render and View close disposes listeners, ResizeObserver and RAF ownership.
- Desktop uses a narrow right column; mobile moves the rail into normal flow and wraps labels without horizontal scrolling. Current state uses marker, text, color and `aria-current=location`.
- Pure tests cover 0/1/6/7/8 TimeBoxes, edge windows, giant TimeBoxes, gaps and clamping. The full build, engine, store, bridge, TOC, UI and Mandala contract suite plus bundle syntax pass.
- Framework/Atlas update check: `updated`; Bayesian label `refines` the Time-first navigation and local-write view-stability contracts. No business data, public API, State Capsule field, Runtime or Mirror was changed.

Deployment update:

- After explicit confirmation, synchronized only verified `main.js` and `styles.css` to the proven actual Runtime and repository Mirror. Deployment backup: `state/backups/temporal-local-time-toc-deploy-20260812-192554`.
- Dev/Runtime/Mirror align at `B1CC99034EF97DD6E48A47CFADEA30C3920462AB293181F7CBAE0244E417913A` for `main.js`, `B1CC6DAB22FF1C8AA24BC41D5C63F4573EC1CC44BB1F973BA9F83018F4F1EF7D` for `styles.css`, and `78C5E097AB62EA2A28730C64D7C0369CB786005140649D24674B1D9CA2529F70` for `manifest.json`.
- The full seven-group test suite, all three bundle syntax checks and deployed TOC sentinels pass. Business-before/after mismatch count is `0`; Runtime owner Store, previous Store, drafts and plugin settings were preserved.
- Framework/Atlas update check: `updated`; deployment is `no_model_change`. Independent deployment verifier `019ff5be-8f2b-7851-a61f-6cdb1b85b7ac` accepted the deployment evidence with documentation actions; after incorporation, its final recheck returned `PASS` with no P0/P1/P2. Loaded Obsidian scroll, scale-switch, click-position and responsive smoke remains pending plugin reload.

## 2026-08-13 - Temporal Membership Exit And Primary Root

status: repository_dev_verified_runtime_pending

- Observation: an included goal/project with no outcomes needs a non-destructive way to leave the time framework, and Time structure should visibly read as `TimeBox -> goal/project -> recursive outcomes`.
- Claim update: Temporal owns membership lifecycle. Exit is append-only and does not alter Mandala. It is allowed only when the membership has never formed an outcome and has no active no-deployment coverage; reimport reinstates the same lifetime identity.
- UI update: goal/project membership is now the explicit structured-Time root with a separate outcome body. Cross-membership parent jumps and responsive wrapping remain intact.
- Verification: D-drive-isolated full suite and bundle syntax pass. Independent verifier `019ff8e9-37d9-79b2-b8e1-ff151fc38ae2` returned `PASS_WITH_ACTIONS`, no P0/P1; its documentation-only P2 is incorporated here and in project state/Atlas/change-records.
- Framework/Atlas update check: `updated`; Bayesian label `refines`. Source status: `confirmed_by_user_and_code`. Ownership, Mandala provider contract, JSON schema, public API, Question Map, Unknowns, Skill/rules and MemPalace are unchanged. Runtime and Mirror remain on the prior aligned release pending explicit deployment confirmation.

## 2026-08-13 - Temporal Framework Items And Effective Positions

status: runtime_synced_static_verified_ui_smoke_pending

- User introduced one semantic layer above goals/projects: an untyped framework item representing a user-defined upper intent, with dated statements in the form `YYYY-MM-DD，我应该能够达成 XXX`.
- Store schema v2 adds append-only framework-item, milestone and binding events. v1 remains readable without load-time migration and upgrades only inside the first explicit new-capability transaction; old v1-only readers reject v2.
- Membership and binding remain separate. A goal/project belongs to zero or one framework item, while one active target may bind to at most one milestone. Active bindings block reassignment, unassignment and exit; unbind preserves history.
- Outcome execution ownership is unchanged. Effective location priority is direct outcome milestone, nearest same-membership ancestor milestone, membership milestone, framework-item direct position and unassigned. Cross-membership parentage never supplies inherited framework position.
- Time projection is `TimeBox -> framework item -> milestone/direct position -> membership -> local outcome forest`. Each Placement enters exactly one position; a child whose execution parent resolves elsewhere becomes a path-labelled local root without data duplication.
- UI adds framework-item and milestone lifecycle modals, assignment drag/drop plus keyboard/touch select fallback, milestone binding/unbinding, boundary conflict visibility and responsive no-horizontal-scroll groups. All writes use draft protection and `expectedRevision`.
- Full six-group tests and source/generated syntax checks pass. Executable regressions cover position priority/fallback, one-position projection, v1/v2 compatibility, historical binding validation, boundary blocking and stale DnD zero-write hash preservation.
- Independent verifier `019ff958-9cc6-77c2-a951-16babf9e56cc` initially blocked missing milestone/direct Time grouping, then returned `PASS` after pure position grouping and transaction regressions were added; P0/P1/P2 none.
- Backups: `state/backups/temporal-framework-items-20260813-120500`, `state/backups/temporal-framework-node-location-20260813-112159`, and `state/backups/temporal-framework-items-docs-20260813-122945`.
- Framework/Atlas update check: `updated`; Bayesian label `adds` for the model change.

Deployment update:

- After explicit user confirmation, synchronized only verified `main.js` and `styles.css` to the proven actual Runtime and repository Mirror. Deployment backup: `state/backups/temporal-framework-items-deploy-20260813-125207`.
- Dev/Runtime/Mirror align at `E1D4090...D739927` and `E4542B72...1B55C5`; manifest remains aligned and unchanged. Full six-group tests, three bundle syntax checks and deployed framework-item sentinels pass. Six business/settings sentinels remained byte-identical.
- Independent deployment verifier `019ff977-bc1c-72a1-9b6b-210512068ae9` returned `PASS_WITH_ACTIONS`, no P0/P1; its documentation-only P2 is incorporated. Bayesian update: `no_model_change`; loaded Obsidian item/milestone/assignment/binding and layered-Time UI smoke remains pending plugin reload.

## 2026-08-13 - Temporal Direct Milestones And Preserved Execution Trees

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: milestone-position grouping visually detached a directly bound child outcome from its execution parent. User clarified that an outcome without its own direct binding has no milestone; a milestone may gather many outcomes.
- Claim correction: framework-item assignment, membership milestone binding and outcome execution parentage are independent. No milestone propagates to an outcome. Time projection preserves `framework item -> membership -> execution tree`, while direct milestone bindings appear as node annotations and contextual indexes.
- UI update: each milestone groups direct bindings by membership and reconstructs same-membership ancestor context without duplicating editable outcomes. Cross-membership parents are explicit jumps. Outcome overview adds a framework-item TOC with reading-position highlight and mobile wrapping; it is UI-only.
- Verification: full six-group suite, source/generated syntax and deployment evidence pass. Verifier `019ff9a2-7bfc-7e23-b398-042892fd0862` returned final implementation and deployment `PASS`; P0/P1/P2 none. Backups: `state/backups/temporal-direct-milestone-tree-ui-20260813-135144` and `state/backups/temporal-direct-milestone-tree-deploy-20260813-141453`.
- Bayesian update: `corrects` the previous inherited-position and milestone-grouping contract. Source status: `confirmed_by_user_and_code`. Store schema v2, event history, ownership, public API, Question Map, Unknowns, Skill/rules and MemPalace are unchanged. Loaded Obsidian UI smoke remains pending plugin reload.
## 2026-08-13 - Temporal milestone visual hierarchy refinement

- Status: `not_updated` for Framework/Atlas model; Runtime/Mirror statically synchronized and verified, loaded UI smoke pending.
- Observation: loaded UI made milestone cards and their directly bound outcomes difficult to distinguish from contextual execution-tree nodes.
- Action: strengthened only the existing milestone/direct-binding presentation contract with non-color hierarchy, persistent labels and keyboard focus. Store ownership, direct-binding semantics, projection topology and business JSON remain unchanged.
- Evidence: implementation backup `state/backups/temporal-milestone-binding-emphasis-20260813-145111`; deployment backup `state/backups/temporal-milestone-binding-emphasis-deploy-20260813-151114`; full Temporal test suite passes; verifier `019ff9a2-7bfc-7e23-b398-042892fd0862` returned implementation `PASS` and deployment `PASS_WITH_ACTIONS` with documentation-only P2 incorporated.

## 2026-08-13 - Temporal direct milestone meaning projection reach

- Status: `not_updated` for Framework/Atlas model; Runtime/Mirror statically synchronized and verified, loaded UI smoke pending.
- Observation: the direct-milestone context tree was visually clear, but compact Time cards and Outcome detail shared an unaccented framework-meaning renderer.
- Action: use the existing direct-only source marker to project one shared, accessible milestone information block across those two surfaces. Ordinary framework attribution and all persistence contracts remain unchanged.
- Evidence: implementation backup `state/backups/temporal-direct-milestone-meaning-emphasis-20260813-163102`; deployment backup `state/backups/temporal-direct-milestone-meaning-deploy-20260813-164903`; full suite and deployed sentinels pass; verifier `019ff9a2-7bfc-7e23-b398-042892fd0862` returned implementation `PASS` and deployment `PASS_WITH_ACTIONS` with documentation-only P2 incorporated.

## 2026-08-13 - Temporal compact milestone content overflow correction

- Status: `not_updated` for Framework/Atlas model; Runtime/Mirror statically synchronized and verified, loaded UI smoke pending.
- Observation: direct milestone data was complete, but compact descendant cards clipped the dated achievement sentence after the first visual row.
- Action: switch only the compact meaning presentation to an explicit two-row grid and remove local card clipping while retaining outer Time-container boundaries.
- Evidence: implementation backup `state/backups/temporal-direct-milestone-meaning-overflow-20260813-174843`; deployment backup `state/backups/temporal-direct-milestone-overflow-deploy-20260813-175813`; full suite and deployed layout sentinels pass; verifier `019ff9a2-7bfc-7e23-b398-042892fd0862` returned deployment `PASS_WITH_ACTIONS` with documentation-only P2 incorporated.

## 2026-08-14 - Temporal Milestone-Driven Ordering Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only the verified Temporal `main.js` from Repository Dev to the proven actual Runtime and repository Mirror. Backup: `state/backups/temporal-membership-milestone-order-deploy-20260814-105858`.
- Dev/Runtime/Mirror align at `9C9E76AE7B841ED2AA53E0E42AD42A7CEC4F41835C9F64D8816330E3EC3BE542`; unchanged styles and manifest remain aligned. Full six-group tests, three bundle syntax checks and deployed ordering sentinels pass.
- Seven Runtime business/transaction sentinels remained byte-identical across the copy window; journal and candidate remained absent.
- Deployment verifier `019ff9a2-7bfc-7e23-b398-042892fd0862` returned `PASS_WITH_ACTIONS`, no P0/P1. Documentation-only P2 actions are incorporated; loaded ordering smoke remains pending plugin reload.
- Framework/Atlas update check: `updated` for runtime-confidence evidence; Bayesian label `no_model_change`. Ownership, Store schema, event history, public API and cross-plugin contracts are unchanged.

## 2026-08-14 - Temporal Outcome Search And Explicit Location

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: as the outcome inventory grows across framework items, goals/projects, hierarchy paths and repeated TimeBox projections, rediscovery requires a direct outcome locator rather than manual scanning.
- Repository Dev adds a UI-only outcome search projection with normalized multi-context matching, a hard 20-result bound, fail-closed historical evidence and deterministic earliest valid placement evidence.
- Selecting a scheduled result reuses the explicit TimeBox anchor priority, applies a temporary text-plus-outline target cue and never writes owner state. Unscheduled or unresolved targets degrade to Outcome detail. Query and active selection remain View memory and are excluded from State Capsules and plugin data.
- Full seven-group tests and syntax checks pass. Verifier `019ff9a2-7bfc-7e23-b398-042892fd0862` returned final `PASS` after one hard-limit remediation, with P0/P1/P2 none.
- Framework/Atlas update check: `updated`; Bayesian label `refines` the explicit-navigation and local UI projection contract. Ownership, Store schema, event history, API, Mandala provider relationship and State Capsules remain unchanged. Runtime and Mirror await explicit deployment confirmation.

## 2026-08-14 - Temporal New-Relation Joint Adjustment

status: repository_dev_static_verified_runtime_pending

- Observation: relationship timing conflicts should be repairable at the moment a new `precedes`, `requires` or `contributes_to` relation is proposed, without first persisting an invalid relation or abandoning the relation form.
- Claim update: candidate relation structure and candidate timing are separate admission stages. A structurally valid candidate plus both replacement Placements may commit as one owner transaction containing one relation event and two distinct move events; any stale, malformed or final-validation failure leaves the business Store unchanged.
- UI/draft update: the parent relation Modal uses an explicit deferred-commit state while the large two-track adjustment Modal is active. Canceling the child preserves both drafts and writes no business Store data; success completes and clears both sessions. Missing endpoint Placement fails closed with an explicit reason.
- Verification: full D-drive-isolated seven-group suite and source/generated syntax checks pass. Independent verifier `019ff958-9cc6-77c2-a951-16babf9e56cc` returned final `PASS` after the duplicate source/target event-ID P2 was closed; no blocking finding remains.
- Backups: `state/backups/temporal-new-relation-joint-adjust-20260814-135927` and `state/backups/temporal-new-relation-joint-adjust-docs-20260814-213511`.
- Framework/Atlas update check: `updated`; Bayesian label `refines`. Source status: `confirmed_by_code`. Store schema, ownership, public API, Mandala contract, Runtime business data and State Capsules are unchanged. Runtime and Mirror remain untouched pending explicit deployment confirmation.

## 2026-08-14 - Temporal Outcome Search And New-Relation Joint Adjustment Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only the cumulative verified Temporal `main.js` and `styles.css` from Repository Dev to the proven actual Runtime and repository Mirror. Deployment backup: `state/backups/temporal-outcome-search-new-relation-deploy-20260814-222012`.
- Dev/Runtime/Mirror align at bundle `0DA658B3A823B912DDB6675916A4E588F0782A8FC871CC3F4BD0FB17DE552BA2`, stylesheet `57A48EA520F74F45BA814AA908A54A152DE594304B269948AEE677C7409423F5` and manifest `78C5E097AB62EA2A28730C64D7C0369CB786005140649D24674B1D9CA2529F70`.
- Full seven-group tests and three bundle syntax checks pass. Independent deployment verifier `01a000aa-a7c1-7a72-aa7a-afe82141c068` confirmed 72/72 deployed feature sentinels, complete rollback copies and unchanged Runtime business/transaction sentinels; journal and candidate remain absent.
- Loaded Obsidian search, target-highlight, conflicting-new-relation, cancel/draft-recovery and atomic-save smoke remains pending plugin reload.
- Framework/Atlas update check: `updated` for runtime-confidence evidence; Bayesian label `no_model_change`. The durable search and atomic candidate-relation contracts were already recorded by the two implementation entries; ownership, Store schema, API, Mandala contract and State Capsules remain unchanged.

## 2026-08-14 - Temporal Recursive Conflict-Closure Tracks

status: repository_dev_static_verified_runtime_pending

- Observation: a fixed A/B editor can resolve its triggering relation while simultaneously violating B's child containment or another active relation, leaving save disabled without exposing every outcome that must move together.
- Claim update: joint adjustment is a violated-edge closure, not a full connected-component traversal. It starts from A/B and recursively adds only outcomes on currently violated active containment or relation edges. Unrelated historical conflicts stay outside; discovered tracks remain visible with a resolved state after their local conflict clears.
- Persistence update: displayed tracks and changed Placements are separate sets. Admission projects all displayed candidates simultaneously, while one owner transaction writes only semantically changed Placements as `0..N` consecutive events. New-relation mode adds its relation event in the same revision. Global event-ID preflight and final Store admission preserve zero partial writes.
- UI update: the large Modal uses a vertically scrollable multi-track editor, sticky expandable time axis, discovery reasons, explicit blockers, dynamic changed-item save count and legacy two-track draft migration. Axis expansion occurs after an interaction and never during `pointermove`.
- Verification: full seven-group suite and source/generated syntax checks pass. Focused regressions cover recursive child/relation discovery, unrelated conflict exclusion, superseded relation projection, unchanged displayed tracks, event-ID collision rollback, explicit missing-child/missing-relation-placement/unavailable-endpoint blockers, initial-schedule compatibility and shared revision/ordinal ordering. Final verifier `01a000e8-51b0-7252-b1a9-b7372aeadb56` returned `PASS`, P0/P1/P2 none.
- Backup: `state/backups/temporal-conflict-closure-20260814-230900`. Repository Dev bundle is `B9D0544B42AB3E7562284579E004409F78C9BF98EDBC16925E0D386AF1652757`; stylesheet is `F96AC8FA7A537123205760F2A33B63D53C308D410A765B371F9202724C38D53A`. This implementation checkpoint was subsequently synchronized to Runtime and Mirror by the deployment entry below.
- Framework/Atlas update check: `updated`; Bayesian label `refines`. Store schema, owner boundary, public API, Mandala contract, State Capsules and business data are unchanged.

## 2026-08-15 - Temporal Recursive Conflict-Track Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only verified Temporal `main.js` and `styles.css` from Repository Dev to the proven actual Runtime and repository Mirror. Deployment backup: `state/backups/temporal-recursive-conflict-tracks-deploy-20260815-004527`.
- Dev/Runtime/Mirror align at bundle `B9D0544B42AB3E7562284579E004409F78C9BF98EDBC16925E0D386AF1652757`, stylesheet `F96AC8FA7A537123205760F2A33B63D53C308D410A765B371F9202724C38D53A` and unchanged manifest `78C5E097AB62EA2A28730C64D7C0369CB786005140649D24674B1D9CA2529F70`.
- Full seven-group tests, all source/deployed syntax checks, 24 multi-track/blocker and nine CSS state sentinels pass. Nine Runtime business/transaction sentinels remained identical across the deployment verification window.
- Deployment verifier `019ff977-bc1c-72a1-9b6b-210512068ae9` returned `PASS_WITH_ACTIONS`, no P0/P1. Documentation status is closed; loaded recursive-track UI smoke remains pending plugin reload.
- Framework/Atlas update check: `updated` for runtime-confidence evidence; Bayesian label `no_model_change`. Ownership, Store schema, public API, Mandala contract and State Capsules are unchanged.

## 2026-08-15 - Next Action Workbench And Confirmed Source Reveal

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: Collection Card actions are useful raw material but often still need progressive decomposition at the immediate action frontier. The user needs a separate workbench and an exact way back to the source row without replacing the existing Timeline summary.
- Claim: Next Action Workbench owns only the observed active-primary projection, recovery drafts and independent per-source-card Ontology. It does not promise completeness and does not register these local Ontologies with Ontology Meta Hub.
- Cross-plugin contract: Project Overview now exposes an additive confirmed reveal keyed by managed-primary identity plus Collection Card `nodeKey`. Goal routes use `mandala`, project routes use `workspace`; actual highlight is required, and cancellation/failure restores request-owned grouping changes.
- Deployment evidence: Dev/Runtime/Mirror hashes align; full Workbench tests and deployed syntax checks pass; Project Overview business JSON sentinels remained byte-identical. Backup: `state/backups/next-action-workbench-deploy-20260815-161312`.
- Framework/Atlas update check: `updated`; Bayesian label `adds`. Updated `atlas/00-system-map.md`, `atlas/contracts.md` and `atlas/api-registry.md`. Question Map, Unknowns, Skill/rules and MemPalace are unchanged. Loaded Obsidian UI smoke remains pending plugin reload.

## 2026-08-16 - Next Action Workbench Primary Projection Repair

status: repository_dev_static_verified_runtime_pending

- Observation: managed-primary names and Collection Card capsule names had been conflated in the Workbench source query, producing a genuine complete zero for primaries whose actions were related through EVA rather than a same-named capsule.
- Claim update: primary identity drives Project Overview grouped projection; capsule identity remains source provenance only. The Workbench must never query a capsule with the primary display label or use that label as a source-context fallback.
- Contract update: Project Overview adds bounded `getPrimaryCollectionCardSnapshot`; Mandala adds opt-in `next-action-workbench-v1` ordering with capsule level `0/A/B/C/CZ`, Timeline-today rank inside each level and stable PEO fallback. Existing callers retain their default order.
- UI update: separate goal/project primary Tabs retain independent selection and show source capsule labels only as `胶囊：...` metadata.
- Verification: full five-group Workbench suite and three bundle syntax checks pass. Fresh verifier `01a00660-e3cd-7e23-a417-0fa231a83636` returned `PASS` after closing the legacy primary-label context fallback and adding symmetric goal/project ordering tests.
- Runtime boundary: Repository Dev is the only new candidate. Proven Runtime and repository Mirror remain on their previous aligned hashes until explicit deployment confirmation.
- Framework/Atlas update check: `updated`; Bayesian label `refines`. Updated `atlas/contracts.md`, `atlas/api-registry.md` and `atlas/log.md`. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace are unchanged.

## 2026-08-16 - Next Action Workbench Primary Projection Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only Project Overview `main.js`, Mandala `main.js`, and Workbench `main.js/styles.css` from verified Repository Dev to the proven Runtime and repository Mirror.
- Dev/Runtime/Mirror align for all four assets. Runtime and Mirror each pass three `node --check` commands; the complete five-group Workbench suite passes after deployment.
- Twenty-four plugin-data, owner-data and absence sentinels retained exact before/after hashes. No Project Overview, Mandala, Workbench, Ontology, weekly, daily or keyword business JSON was copied or rewritten.
- Deployment backup: `state/backups/next-action-workbench-source-projection-deploy-20260816-011734`. Independent deployment verifier `01a00671-1802-7042-8631-b28f3c8eb05e` returned `PASS`.
- Framework/Atlas update check: `updated` for deployment confidence; Bayesian label `no_model_change`. Ownership and contract semantics remain unchanged. Obsidian started before deployment, so loaded interaction smoke remains pending restart.

## 2026-08-17 - State Capsules As Manually Maintained Starting Points

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending

- Observation: the user's recurring A/B/C states are departure points for new journeys. Automatically saving the state being left turns a stable departure point into an ever-moving checkpoint and makes repeated use less predictable.
- Claim correction: State Capsules owns manually maintained launch baselines. Switching restores the destination baseline, performs no live capture, and persists only the selected `activeCapsuleId` pointer. Only explicit save-new and overwrite-active operations may redefine a baseline.
- Canonical concept: the user names this `狄拉克海上的涟漪模式`. Typical starting states form the deliberately maintained stable layer; each live journey is a transient ripple. New capsules appear only when a genuinely reusable starting condition emerges, so complexity grows progressively and ordinary operations carry no checkpoint-curation burden.
- Cross-plugin boundary: Context Capsule Keys remain restore-time locators; they cannot advance a baseline. Generic Project Overview snapshot mutation methods on the State Capsules public API are superseded so another plugin cannot silently rewrite one or all baselines.
- Safety evidence: active-pointer writes use a dedicated main-Store persistence path, require readback and attempt rollback on mismatch; they never write `note-event-log.json` and leave capsule snapshots, order and `updatedAt` unchanged. Existing Store schema and UI remain compatible, and no business-data migration is required. Clean API installation also prevents removed writer methods from surviving an abnormal hot reload.
- Framework/Atlas update check: `updated`; Bayesian label `corrects` the lifecycle and `refines` its cognitive model. Updated `atlas/plugins/state-capsules.md`, `atlas/contracts.md`, `atlas/knowledge/context-capsule-key.md`, `atlas/glossary.md` and `atlas/aliases.md`. Question Map, Unknowns, Skill/rules and MemPalace are unchanged.
- Prior read: `framework/entry-index.md`, `framework/update-protocol.md`, `atlas/plugins/state-capsules.md`, `atlas/contracts.md`, `atlas/knowledge/context-capsule-key.md`, release guardrails and system boundaries. Source status: `confirmed_by_user_and_code`.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260817-state-capsules-starting-point-semantics.md`; backup `state/backups/state-capsules-starting-point-20260817-100932`; plan verifier Raman `01a00d73-7962-7752-a5ea-43a93ce68ee5` returned `PASS_WITH_ACTIONS` with no P0.
- Final verifier Anscombe `01a00daa-8ca8-79c2-9bbb-05d0f0c2d2d7` returned `PASS / ALLOW` with no P0/P1/P2 after the dedicated pointer-persistence and clean hot-reload API remediation. Runtime, Dev and Mirror `main.js` align at `B64157FE...8FF1B7`; their README files align at `C840C029...E4BAEB`. Three-way syntax and the 38-check focused contract pass, while all six `data.json` / `note-event-log.json` sentinels remained byte-identical. Loaded Obsidian smoke remains pending plugin reload.

## 2026-08-17 - Temporal Outcome Return To Owning Primary

status: repository_dev_static_verified_runtime_pending

- Observation: returning from an Outcome detail to `全部主键` rebuilt the overview at its beginning, forcing the user to rediscover the goal/project card that supplied the Outcome.
- UI contract: the View now captures a one-shot `{ frameworkId, membershipId, outcomeId, token }` navigation intent, renders the overview root, positions the exact membership card below sticky controls and briefly highlights it. Newer navigation supersedes older tokens; invalid, inactive, malformed or cross-framework evidence fails closed.
- Boundary: the intent and highlight are View memory only. Temporal business Store, `data.json`, environment capture, State Capsules, Mandala and all public APIs are unchanged.
- Verification: the focused navigation-state regression covers single consumption, supersede semantics and invalid evidence; the full Temporal build plus engine, Store, Mandala bridge, Time TOC, Outcome search, UI and Mandala contract suites pass.
- Runtime boundary: Repository Dev is the only new candidate. Proven Runtime and repository Mirror remain aligned on the previous release until explicit deployment confirmation.
- Framework/Atlas update check: `updated`; Bayesian label `refines` the Temporal View navigation contract. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace are unchanged.

## 2026-08-17 - Temporal Milestone Progress And Manual Effectiveness Deployment

status: runtime_synced_static_and_loaded_ui_verified

- After explicit user confirmation, synchronized only verified Temporal Framework `main.js` and `styles.css` from Repository Dev to the proven actual Runtime and repository Mirror.
- Dev/Runtime/Mirror align at bundle `E1E3AF00BD63BEAF866CDD6C84413CD506CBA05DA0A0ED7380FC0CD48F96232B`, stylesheet `8ECA3352FA1CE43A942CA4BFED5922920D4314AE3D56C210B5FA038440B7D045` and unchanged manifest `78C5E097AB62EA2A28730C64D7C0369CB786005140649D24674B1D9CA2529F70`.
- Six protected Runtime Store/draft/settings/manifest sentinels remained byte-identical. Deployment backup: `state/backups/temporal-milestone-effect-deploy-20260817-134728`.
- Framework/Atlas deployment update: `updated`, Bayesian label `no_model_change`; ownership and boolean-effectiveness semantics are unchanged, while deployment confidence increased.
- Independent deployment verifier Dewey `01a00e26-4e4a-7a13-b69a-49726e71e91f` returned `PASS`, with no P0/P1. Its documentation-placement P2 was remediated.
- User-practice evidence: the user confirmed the loaded Obsidian interaction is working as intended. Source status: `confirmed_by_user`; Bayesian label: `reinforces`. No deployment blocker remains. Framework-update backup: `state/backups/temporal-effect-loaded-smoke-framework-update-20260817-141807`.

## 2026-08-17 - Temporal Outcome Return Deployment

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only Temporal Framework `main.js` and `styles.css` from verified Repository Dev to the proven actual Runtime and repository Mirror.
- Dev/Runtime/Mirror align at bundle `8267AFF23DA9541EF83A02D49EB9575E8F4B8741048867A6A85503A0138EA751` and stylesheet `74FB195A0C426A13A925565575936A00F6E0B2D43FE2B6BE66BBFF6A29728831`; manifest remains unchanged and aligned.
- Three bundle syntax checks and the full eight-group Temporal test suite pass. Nine protected Runtime/Mirror settings, Store, draft, previous-file, recovery and metadata sentinels remain byte-identical.
- Deployment backup: `state/backups/temporal-outcome-return-deploy-20260817-130000`. Loaded return position and temporary highlight smoke remain pending Temporal Framework plugin reload.
- Independent deployment verifier Anscombe `01a00daa-8ca8-79c2-9bbb-05d0f0c2d2d7` returned `PASS` with no P0/P1. The update-protocol checklist P2 was remediated and all seven checks for this change record are now present.
- Framework/Atlas update check: `updated` for deployment confidence; Bayesian label `no_model_change`.

## 2026-08-17 - Temporal Milestone Progress And Manual Effectiveness

status: repository_dev_static_verified_runtime_pending

- Observation: milestone dates need an immediate time-progress cue inside their existing cards, while a small manually chosen set of Outcomes needs a separate “正在生效” reading surface. The latter is an explicit yes/no judgment, not an incubation timeline or form.
- Claim: milestone progress is a read-only projection from milestone establishment instant in Store timezone to current target date and never implies completion. Outcome effectiveness is a reason-free append-only boolean fact independent of Placement, completion paint and framework meaning.
- Historical projection at this checkpoint: `framework item/unassigned -> own direct milestone/unbound -> owning membership -> guarded complete ancestor branch`. Milestones did not inherit, but milestone-first grouping split one outcome tree; the later `Temporal Effectiveness Tree Merge` record supersedes that grouping contract while preserving the original implementation history.
- Safety at the implementation checkpoint: same-value requests fail before schema migration and ordinal allocation; active-framework and ancestor evidence fail closed; the toggle uses explicit confirmation and one revision-admitted Store transaction. Runtime, Mirror and all business files were untouched at that checkpoint; the later deployment section above supersedes the pending runtime state.
- Verification: complete nine-group `npm test` PASS; final verifier Dewey `01a00e26-4e4a-7a13-b69a-49726e71e91f` returned `PASS` with no P0/P1/P2 after removing progress from the new Effectiveness grouping panels and making `effect-set` strictly reason-free.
- Framework/Atlas update check: `updated`; Bayesian labels `adds` and `refines`. Updated Temporal plugin Atlas, strategic planning contract, API registry and Atlas log. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace are unchanged.
- Trace: implementation backup `state/backups/temporal-milestone-progress-effect-view-20260817-132500`; the later deployment and user-confirmed loaded-smoke evidence above supersede this historical Repository Dev-only checkpoint.

## 2026-08-17 - Temporal Framework Documentation Verification Closure

status: runtime_synced_static_and_loaded_ui_verified

- Independent remediation verifier Dewey `01a00e26-4e4a-7a13-b69a-49726e71e91f` returned `PASS`; P0/P1/P2 findings: none.
- The durable design record now explicitly agrees with the deployed behavior: five independent parts, milestone progress as a derived read-only cue, `正在生效` as a manual reason-free boolean, direct-milestone-only identity, and no current State Capsules consumption.
- The loaded Obsidian interaction was already confirmed by the user. The eight Framework/Atlas hashes were rechecked against the current files; no plugin code or business data was changed during this closure.
- Documentation backup: `state/backups/temporal-framework-documentation-verifier-closure-20260817-142500`.

## 2026-08-17 - Workspace Ontology Nested Context And Minimize

status: repository_dev_static_verified_runtime_pending

- Observation: deep recursive Ontologies reopened at the root, and a full modal could not remain available while the user edited another Obsidian surface.
- Claim update: Workspace Mount now owns a bounded plugin-data view sidecar that remembers only the last valid nested table. Resolution prefers explicit focus, then saved context, nearest valid ancestor and root. It does not store scroll position or mutate Ontology business content.
- UI lifecycle: an Ontology modal can minimize into an independent restore tray chip. Minimize hides the complete container and balances Obsidian modal scope; restore returns to the same live draft and nested table. Multiple minimized modals remain independent, and close/unload removes all restore UI.
- Safety: generation/session authority rejects stale modal writes; post-save authority drift is repaired; dirty-close, recovery, CAS, Shared-Schema and owner boundaries remain unchanged.
- Verification: Workspace bundle syntax, complete Ontology engine tests, Ontology Meta Hub regression and CSS structure checks pass. Huygens `01a00f0a-c682-7bc2-84ef-e169aead9e24` returned `PASS_WITH_ACTIONS`; all requested actions were incorporated.
- Runtime boundary: only Repository Dev has changed. Runtime, Mirror, business JSON, Ontology documents and State Capsules remain untouched pending explicit deployment confirmation.

Bayesian update: `refines` the existing Workspace Ontology recursive-navigation and modal-lifecycle claim. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

## 2026-08-17 - Temporal Effectiveness Tree Merge

status: repository_dev_static_verified_runtime_pending

- Observation: when a parent Outcome and its child were both manually marked `正在生效`, different direct milestones or one unbound node split them into separate panels even though they belonged to one local outcome tree.
- Claim update: Effectiveness projection is now `framework item/unassigned -> membership -> merged local outcome tree`. Direct milestone is a node annotation, not a group key; same/different milestones and either one-sided unbound case remain in one tree.
- Boundary rule: traversal stops before a foreign membership or framework-item ancestor. The local root receives an explicit external-parent jump and boundary badges, so the foreign Outcome is not duplicated as a full node.
- Safety: Store schema, `effect-set`, `setOutcomeEffective`, parentage, membership, milestone bindings and public API are unchanged. Projection remains read-only, deterministic and diagnostic for missing ancestors, cycles and depth limits.
- Verification: source-first build, bundle syntax and all nine test groups pass. Focused regressions cover same/different milestones, both one-sided unbound variants, shared-ancestor deduplication, cross-boundary references, unbind/rebind stability, input-order perturbation, archive/restore and zero projection mutation.
- Independent verification: Ramanujan `01a00f21-32fc-73c2-98d9-0bd4ddd1b157` and Mill `01a00f2e-80e1-7520-9529-42b166c5b495` returned `PASS_WITH_ACTIONS`, no P0. Their implementation actions are incorporated; only engineering-record closure and post-deployment loaded UI smoke remained.
- Runtime boundary: Dev bundle/styles are the new candidate. Actual Runtime and repository Mirror remain on the previous aligned release pending explicit deployment confirmation.

Bayesian update: `corrects` the milestone-first Effectiveness grouping claim and `refines` direct-milestone, local-tree and cross-boundary projection semantics. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

## 2026-08-17 - Workspace Ontology And Temporal Effectiveness Tree Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only `main.js` and `styles.css` for Workspace Mount and Temporal Framework from verified Repository Dev to the proven actual Runtime and repository Mirror.
- Workspace Mount three-role hashes align at `130A9F7129DAA28F80B9B64D48422A629A587D02573B29755F0BCAE927756022` and `C14216BF28483509FF6A8B4228FE6684256369649C375745B5501A6FE2E9B334`.
- Temporal Framework three-role hashes align at `8435F62FC42DA5C2AE78EB55E60A5BAFA171D84677E0808358E34192BDC7F85B` and `971BD04951B070EDF722352162FA4F3C697F3704EB10A010613A89673621B5B5`.
- Six bundle syntax checks, both focused Ontology suites and all nine Temporal suites pass. Workspace and Temporal manifests remained unchanged.
- Workspace `data.json`, both Workspace business JSON files and Temporal `data.json` remained byte-identical. Deployment backup: `state/backups/ontology-temporal-deploy-20260817-193906`.
- Independent deployment verifier Faraday `01a00f88-de5b-78e1-b4d3-42c027cfd401` returned `PASS`, with no P0/P1/P2 findings.
- Framework/Atlas update check: `updated` for deployment confidence only; Bayesian label `no_model_change`. Loaded Obsidian interaction smoke remains pending plugin reload.

## 2026-08-17 - Workspace Manual Scroll Pin Retirement

status: repository_dev_static_verified_runtime_pending

- Observation: the floating `GTD 已固定` control is no longer needed and consumes visible workspace area.
- Claim update: manual persistent scroll pinning is retired. Workspace now restores only the current loaded session's ephemeral position, while explicit focus/navigation retains priority.
- Compatibility boundary: `pinnedScrollByViewKey` remains in defaults, normalization, State Capsules capture/apply and bridge capability advertisement, but is no longer read for UI restoration and receives no new click-based writes.
- Data safety: no historical pin data is deleted or migrated; hot reload removes only orphan legacy button DOM. Runtime, Mirror and business JSON remain untouched pending explicit confirmation.
- Verification scope: focused scroll-retirement regression, Workspace bundle syntax, Ontology engine and Meta Hub regressions.

Bayesian update: `corrects` the obsolete manual-pin interaction and `refines` scroll-restoration precedence. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

## 2026-08-18 - Workspace Ontology Single-Editor Lifecycle And Column Description

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: repeated opening of one Ontology owner could create two live modals and transfer recovery authority away from the older draft; minimized dirty windows also lacked a visible unsaved cue. The user additionally needs each column to explain its purpose through a dedicated modal.
- Claim update: one normalized owner address admits one live external editor and one first-admitted writer bundle. Duplicate requests reuse the same frozen handle, while close barriers include in-flight recovery reads and fan out close subscribers only after registry removal.
- UI lifecycle: backdrop click minimizes the parent Ontology without persistence. Dirty restore chips show `未保存`. A pending column-description child modal blocks parent minimize and is settled before parent close or forced teardown; failed admission keeps its textarea alive, and changed text requires explicit confirmation before it can be discarded.
- Schema refinement: optional multiline `column.description` is hash/compact/recovery/CAS-visible, missing means empty, and clearing removes the field. Shared-Schema clone/reconcile propagates description update/clear; mirror, archived and read-only projections remain view-only.
- Safety: no Ontology schema/hash/API version bump, no load-time migration, no business JSON rewrite and no Runtime/Mirror write. New additive capabilities are `single-live-editor-per-owner-v1` and `column-description-v1`.
- Verification: bundle syntax and complete Ontology engine suite pass, including sequential/concurrent duplicate open, close barrier, callback fanout, dirty-chip isolation, backdrop minimize, description capacity/read-only rejection, confirmed discard protection, parent-child close ordering and Shared-Schema description propagation. Final implementation verifier Erdos `01a0140b-93fc-7a00-8188-f680f23fe14d` returned `PASS` after its P1 input-protection finding was remediated.

Bayesian update: `refines` Workspace Ontology modal admission, input protection and column-Schema semantics. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

- Deployment update: after explicit confirmation, only verified Workspace Mount `main.js/styles.css` were synchronized to the proven Runtime and repository Mirror. Three-way hashes, three syntax checks, four regression suites and Runtime business-data sentinels passed; loaded Obsidian UI smoke remains pending plugin reload.

## 2026-08-17 - Workspace Manual Scroll Pin Retirement Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only Workspace Mount `main.js` and `styles.css` from verified Repository Dev to the proven actual Runtime and repository Mirror.
- Dev/Runtime/Mirror hashes align: `main.js` `C50F90DF...6DB333`, `styles.css` `61E961DE...7F906D`; manifest remained unchanged at `D61B8EBF...FB4755A`.
- All three bundles passed `node --check`; the focused scroll-retirement test, Ontology engine suite and Ontology Meta Hub regression passed.
- Runtime `data.json`, `Workspace_Items.json` and `Workspace_TaskNoteBindings.json` retained their exact deployment-baseline hashes. Deployment backup: `state/backups/workspace-retire-scroll-pin-deploy-20260817-213000`.
- Framework/Atlas update check: `updated`; Bayesian label `no_model_change`. Loaded Obsidian smoke remains pending Workspace Mount reload.

## 2026-08-18 - GTD Manual Scroll Pin Retirement

status: repository_dev_static_verified_runtime_pending

- Observation: the bottom-right `GTD 已固定 / GTD Pin` control is owned by `gtd-task-manager`; the earlier Workspace retirement did not remove this independent implementation.
- Claim update: GTD no longer mounts the floating button, writes a pinned position from UI, styles the control or automatically restores historical pins at startup.
- Compatibility boundary: `pinnedScroll` storage and State Capsules bridge round-trip remain available for historical compatibility and explicitly requested apply, while ordinary view-context and explicit navigation keep their existing precedence.
- Hot-reload safety: plugin load, GTD view close and plugin unload remove old button DOM and invoke the prior loaded bundle's cleanup callback idempotently.
- Verification: both GTD bundles pass `node --check`; focused retirement regression passes. Runtime, Mirror and GTD business data remain untouched pending explicit synchronization confirmation.

Bayesian update: `corrects` GTD's obsolete manual-pin interaction and `refines` plugin ownership documentation. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace remain unchanged.

## 2026-08-18 - GTD Manual Scroll Pin Retirement Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized only verified `main.js` and `gtd-engine.js` from Repository Dev to the proven actual Runtime and repository Mirror.
- Dev/Runtime/Mirror align at `DC0D5E1A...67626E5` for `main.js` and `22D1273B...953270` for `gtd-engine.js`.
- All six bundles pass `node --check`; GTD and Workspace scroll-pin retirement regressions pass; retired implementation sentinels are absent in Runtime and Mirror.
- Runtime `data.json` and Runtime/Mirror manifests retain their exact deployment-baseline hashes. Deployment backup: `state/backups/gtd-scroll-pin-retirement-deploy-20260818-190500`.
- Independent deployment verifier Carson `01a0147e-261e-7230-8868-eb0fed7f8d04` returned initial `PASS_WITH_ACTIONS`, no P0/P1. After closing the rollback-source and status-consistency P2 findings, the final remediation recheck returned `PASS`.
- Framework/Atlas update check: `updated` for deployment confidence only; Bayesian label `no_model_change`. Loaded Obsidian UI smoke remains pending GTD plugin reload.

## 2026-08-19 - Workspace Ontology Tree Panorama

status: repository_dev_verified_runtime_pending

- Observation: Ontology is useful for deliberate framework design, but a recursive table also needs a temporary whole-structure view for overview work.
- Claim update: Workspace Mount now exposes an additive `全景树` mode inside the existing Ontology Modal. The mode is a read-only Mermaid projection of the live draft; table editing, formal ownership, Shared-Schema semantics and recovery persistence remain unchanged.
- Projection contract: root table -> row -> active-column chain, with cell-owned nested tables branching from their owning cell. Archived columns are omitted by default. Image labels show counts only, and Mermaid labels are bounded and escaped.
- Safety contract: deterministic node/edge/source limits produce a visible truncation node; Meta, Range, pending image, album and description-input states block entry. External focus exits tree mode before table mutation, and close/unload invalidates render epochs and child resources.
- Interaction contract: zoom out, fit, zoom in, reset, `Ctrl+wheel` zoom and pointer drag/pan are transient viewport state. Minimize/restore keeps the live surface without persisting zoom or pan.
- Implementation: Repository Dev `main.js`, `styles.css` and Ontology regression test updated from staging. Runtime/Mirror and business JSON remain untouched pending explicit synchronization confirmation.
- Verification: `node --check` for bundle/test and complete `ontology-engine.test.js` pass. Independent verifier Halley `01a01887-5bd7-7aa3-82a4-b7ec3178acd2` returned initial `PASS_WITH_ACTIONS`, no P0/P1/P2; after its suggested interaction tests and reset control were added, final recheck returned `PASS`.
- Framework/Atlas update: `updated`, Bayesian label `refines`. No new owner, bridge, provider generation, business schema, persistent cache or State Capsules field. Loaded Obsidian smoke is pending plugin reload after synchronization.

## 2026-08-19 - Next Action Workbench Primary Keyword And Completion View

status: superseded_by_local_name_correction

- Observation: Collection Card capsule labels identify source provenance, but they do not provide an intuitive project/goal list in the Next Action Workbench. Imported primary keys need local keywords and a local completion surface.
- Superseded claim: this entry recorded the initial multi-keyword classification interpretation. The user corrected that interpretation in the immediately following `Next Action Workbench Local Name Correction` entry; it must not be used as the current contract.
- Completion boundary: `completedAt` belongs to the membership plus source-card link. It moves the item into a visible `已完成` section without modifying Collection Card source content; a shared card under another primary remains independent.
- Ownership boundary: Workbench owns `keywords`, `membershipKeywords`, completion state and keyword UI state in its own store. Mandala and Project Overview continue to own active primary identity/order; Collection Card View continues to own source-card text; global Keyword and Ontology Meta Hub are not touched.
- Compatibility: old stores normalize missing keyword/completion fields to empty state; removing a keyword binding keeps its definition and reserved ID. Assignment and completion use the existing transaction/readback path.
- Verification: Repository Dev `npm test` passes after the build, including store, recovery, Project Overview, Mandala ordering and UI-contract suites. Final verifier Noether `01a018d4-c8c1-7212-8455-f9c928a85037` returned `PASS_WITH_ACTIONS`, no P0/P1; its README, trace and hash P2 actions are closed.
- Framework/Atlas update: `updated`, Bayesian label `refines`; no bridge or provider change. Runtime and Repository Mirror remain unchanged.

## 2026-08-19 - Next Action Workbench Local Name Correction

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: the user corrected the earlier interpretation. The Workbench keyword is not a category applied to primary keys; it is the primary key's local name inside the Workbench, and the alphabetically ordered renamed list is the user's project/goal list.
- Claim correction: each imported membership has zero or one current local name. The UI removes keyword filter capsules and presents a regular responsive grid whose cells show `local name || source primary label`; source identity remains secondary and searchable.
- History contract: legacy multi-bindings keep the first valid ID in original array order. Replacement allocates a membership-scoped new ID; clearing only detaches. All historical definitions and reserved IDs remain retained and never reused.
- Input safety: the local-name modal auto-saves edited text, including implicit close paths. Completion state and all provider/consumer contracts remain unchanged.
- Verification: Repository Dev full `npm test` passes after the correction. Framework/Atlas update check: `updated`; Bayesian label `corrects` the prior multi-keyword classification claim without changing ownership boundaries.
- Deployment: after final verifier Hooke `01a018fb-96df-7002-98e3-41b6c7f20c3b` returned `PASS`, synchronized only `main.js` and `styles.css` to the proven Runtime and Repository Mirror. All three program hashes align; Runtime `data.json` retained exact before/after SHA-256. Deployment backup: `state/backups/next-action-local-name-deploy-20260819-155357`.
- Post-deployment recheck by the same independent verifier: `PASS`, no P0/P1/P2; program hashes, backup manifests, current Runtime data sentinel and documentation status all align.

## 2026-08-19 - Workspace Ontology Tree Panorama Deployment

status: runtime_synced_static_verified_ui_smoke_pending

- After explicit confirmation, synchronized the verified Workspace Mount `main.js`, `styles.css` and unchanged manifest from Repository Dev to the proven actual Runtime and repository Mirror.
- Dev/Runtime/Mirror hashes align: `main.js` `06E429BD...3ED1F285`, `styles.css` `6AD493FD...D2D3CBFE`, manifest `D61B8EBF...3FB4755A`.
- Three-side `node --check`, Ontology engine, Meta Hub and Keyword regressions passed. Runtime/Mirror business sentinels remained unchanged.
- Runtime `data.json` contains only expected `paradigmOntologyViewState` updates for table position and session metadata; no schema, row, column or formal-content delta.
- Deployment backup: `state/backups/workspace-ontology-tree-panorama-deploy-20260819-140338`.
- Independent deployment verifier Pauli `01a0189f-ba6c-7c72-8789-8d5b95a60fb3` returned final `PASS`, P0/P1/P2 none.
- Framework/Atlas update: `updated`, Bayesian label `refines`. Reload `Workspace Mount` to complete loaded Obsidian UI smoke; no other plugin restart is required.

## 2026-08-20 - Next Action Workbench Left List Layout

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: the renamed project/goal inventory reads as a checklist and should remain visible as one vertical list beside the active action workspace.
- UI contract refinement: desktop now uses a bounded left inventory rail plus flexible right workspace; the inventory is one column, long names wrap, and the page retains a single scroll owner. Below `760px`, the layout stacks vertically.
- Behavioral boundary: alphabetical ordering, local names, selected membership, completion state, Ontology documents and all source/provider contracts are unchanged.
- Verification: Repository Dev `npm test` and both source/bundle syntax checks pass. Backup: `state/backups/next-action-left-list-20260820-130021`.
- Framework/Atlas update: `updated`, Bayesian label `refines`.
- Deployment: synchronized only verified `main.js` and `styles.css` to the proven Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align; Runtime `data.json` retained exact SHA-256 `2FA95B3FA844A7245CF40E32AF63D2DA6D2034552A5D6F0C1FAF23417A62B024`.
- Independent verifier Beauvoir `01a01d87-7246-7031-a652-d82102deaf3c` returned `PASS_WITH_ACTIONS`, no P0/P1; deployment evidence, after-hash record and corrected status field close its documentary P2 actions. Loaded Obsidian visual smoke remains pending plugin reload.

## 2026-08-20 - Next Action Workbench Source Action Alias

status: runtime_synced_static_verified_ui_smoke_pending

- Observation: next-action entries need Workbench-local formulations for execution clarity while preserving Collection Card source ownership and original text.
- Contract refinement: one optional alias belongs to one membership-plus-source-card relation. Display, search and deterministic ordering use the alias locally; original source identity remains visible and searchable.
- Compatibility boundary: aliases live in independent root `sourceAliases`, so old v1 link refresh cannot erase them. Source refresh, missing/recovery state and shared-source membership relations remain non-destructive.
- Input safety: primary names and action aliases use typed single-owner auto-save editors; implicit close and unload drain pending saves before teardown.
- Verification: Repository Dev full `npm test` and source syntax checks pass, including executable name-editor lifecycle tests for reuse, closing state, freeze and unload drain. Backup: `state/backups/next-action-source-alias-20260820-140252`.
- Framework/Atlas update: `updated`, Bayesian label `refines`.
- Pre-deployment verifier Beauvoir `01a01d87-7246-7031-a652-d82102deaf3c` returned `PASS`, P0/P1/P2 none; the verified Repository Dev candidate then entered explicit-confirmation deployment.
- Deployment after explicit confirmation: synchronized only verified `main.js` and `styles.css` to the proven Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align at `70DA562D...80B98` and `8538C465...0F4D6`; both deployed bundles pass syntax checks and feature sentinels.
- Runtime `data.json` immediate before/after SHA-256 remained `B49346EF2ACF845CAEBAA224465893417FF53BD643178AFB663A840E7A352D47`. Deployment backup: `state/backups/next-action-source-alias-deploy-20260820-142903`. Loaded UI smoke remains pending plugin reload.
- Post-deployment verifier Beauvoir `01a01d87-7246-7031-a652-d82102deaf3c` confirmed program/data/manifest evidence with no P0/P1; its status-field P2 was corrected here.

## 2026-08-20 - Ontology Meta Hub Local Symbolic Projection

status: repository_dev_verified_runtime_pending

- Observation: Ontologies imported from Workspace and Mandala need a Hub-local cognitive address without renaming or reorganizing the source objects. Each stable source capsule supplies a prior letter, and each Ontology owner may add a local alias after that prior.
- Ownership refinement: Hub now owns only `ontologyLocalProjection` in its own `data.json`. Source priors use stable provider/canonical-scope/family/source-group keys; owner aliases use canonical structured owner identity. Formal Ontology content, Workspace/Mandala business data and global Ontology Keywords remain separate owners.
- UI and ordering: source capsules use separate select/edit controls, assigned priors follow spreadsheet order `A ... Z, AA ...`, and rows display `A · alias` with the provider title retained as secondary identity. Compact `Aalias` remains searchable together with alias, original title and source.
- Bounded reduce: the selected family loads one complete provider descriptor snapshot under page/entry/cursor/generation guards, then caches it for local search, source filtering and deterministic ordering. Manual refresh or provider lifecycle change invalidates the snapshot; incomplete scans fail closed.
- Input safety: one stable source/object has one local editor. Explicit clear/save, Esc, backdrop, programmatic close and plugin unload all drain the serialized Hub-local write before teardown; save failure keeps the editor open.
- Verification: preflight verifier Galileo `01a01e52-e9e0-7141-89a2-35da8121918a` returned `PASS_WITH_CHANGES`; requested constraints were implemented. Final verifier Lagrange `01a01e6e-1763-7b03-8a5d-091627db555d` first blocked scope lookup, future-field retention and unload-failure teardown, then returned `PASS` with no P0/P1/P2 after focused fixes. Syntax, Hub regression, Keyword isolation and the local-projection test all pass. Backup: `state/backups/ontology-meta-hub-local-projection-20260820-164807`.
- Framework/Atlas update: `updated`, Bayesian label `refines`. This corrects the broad prior “Hub owns no persisted data” to “Hub owns no formal Ontology/provider data, but may own its explicit local symbolic projection.”
- Deployment after explicit user confirmation: synchronized only verified `main.js` and `styles.css` to the proven Runtime and Repository Mirror. Three-side hashes align at `28841800...5D33D1` and `5736EBFA...146345`; Runtime/Mirror syntax and local-projection feature sentinels pass, and no `data.json` exists in any of the three plugin directories. Deployment backup: `state/backups/ontology-meta-hub-local-projection-deploy-20260820-173651`; loaded UI smoke remains pending plugin reload.

## 2026-08-20 - Ontology Meta Hub Automatic Source Codes

status: runtime_trial_deployed_migration_verified_ui_acceptance_pending

- Observation: source capsules need a prior code without a hand-maintained source-to-code map. The source code and the user-entered object number/name are separate parts that Hub composes into addresses such as `BAA011- 朱建明`.
- Claim update: Hub projection schema v2 separates persistent `autoPrefix` from optional `manualPrefix`. Automatic codes use `AAA-ZZZ`, allocate by stable source identity only after a concrete family proves a complete catalog, and are never moved or reused after disappearance or override.
- Transaction guard: the serialized commit rechecks provider generation, lease, canonical scope and catalog fingerprint; drift, incomplete proof, future schema or capacity exhaustion produces no write. Automatic allocation bypasses recursive view refresh.
- Compatibility: v1 `prefix` reads as a manual override. `恢复自动分配` removes only the override and reveals the original automatic reservation. Prefix and manually entered alias remain separate DOM spans but render compactly.
- Evidence: preflight verifier Gauss `01a01ea0-7853-7101-aaf2-42ac90261e42` returned `PASS_WITH_CHANGES`; final deployment preflight verifier `/root/ontology_auto_source_verifier` returned `PASS_WITH_ACTIONS`, with no P0 or functional-code P1. Requested safeguards are implemented with focused and broad regressions. Implementation backup: `state/backups/ontology-meta-hub-auto-source-codes-20260820-180953`.
- Framework/Atlas update check: `updated`; Bayesian label `corrects` the earlier manual-prior-only numbering model and `refines` Hub-local symbolic projection. This 2026-08-20 repository-candidate phase remained undeployed until the separately recorded 2026-08-21 Runtime trial below.

## 2026-08-21 - Ontology Meta Hub Automatic Source-Code Runtime Trial

status: runtime_trial_deployed_migration_verified_ui_acceptance_pending

- After explicit user confirmation and final preflight, synchronized only the verified Hub `main.js` and `styles.css` from Repository Dev staging to the proven actual Runtime and Repository Mirror. Dev/Runtime/Mirror program hashes align; manifests were unchanged and no provider/business JSON was copied.
- The deployment copy window left Hub `data.json` byte-identical. After reload/use, the Hub owner legitimately upgraded its local projection from schema v1 to v2: all eight manual codes and two owner aliases survived, and 52 automatic three-letter reservations were valid and unique inside their three provider/scope/family namespaces.
- Downgrade contract: save the trial-ending v2 projection, then restore the pre-trial Runtime code, style and `data.json` together. Code-only rollback is insufficient because the old reader cannot render v2 prefix fields and correctly refuses writes to a newer schema.
- Backup/rollback source: `state/backups/ontology-meta-hub-auto-source-trial-deploy-20260821-113611`; staging: `state/staging/ontology-meta-hub-auto-source-trial-20260821-113611`.
- Framework/Atlas update check: `updated`, Bayesian label `refines`. No new owner/provider/consumer or Question Map entry was introduced; the stable schema-v2 model already existed, and this trace advances Runtime evidence plus downgrade semantics. Loaded UI acceptance remains pending user confirmation.

## 2026-08-21 - Mandala Daily-Item Archive Review

status: repository_dev_verified_runtime_pending

- Observation: stopping a daily lesson retained its canonical owner, historical date entries, references, images and Ontology, but most inactive owners had no direct Daily Lessons discovery path unless the selected historical date already contained a record.
- Contract refinement: every Daily Lessons side now projects its own inactive canonical owners through `查看归档 (N)`. References stay cross-side projections and do not become archive objects; restore reactivates the same owner instead of creating a replacement.
- Zero-write boundary: the archive table body is pre-rendered and excluded from editable `pageRows`. View/hide changes only DOM visibility and a session-local Set, so it neither saves pending drafts nor manufactures a current-day empty entry.
- Evidence: plan verifier `/root/daily_archive_plan_verifier` returned `PASS`; staging and Repository Dev syntax plus Ontology Meta Hub regressions pass, including side/reference isolation, read-only rows, session reset and same-owner preservation. Next Action Workbench and Temporal Framework full suites also pass for the combined candidate. Daily-only deployment verifier `/root/daily_archive_deploy_final_verifier` returned `PASS_WITH_ACTIONS` with no blocker; only loaded-UI smoke remains after reload.
- Deployment boundary: the user authorized only the Daily Lessons change. Actual Runtime and Repository Mirror now carry the daily-only hash `D1DFD7BB...21F5`; Repository Dev keeps the separately verified Goal-owner filter at combined hash `2C01599A...614848`. The 25 Goal-only lines are absent from deployed code. Five business-data sentinels remained byte-identical.
- Framework/Atlas update: `updated`, Bayesian label `refines`. FW-018 remains open because this owner-specific Mandala read path is not a unified retired-primary-key archive across plugins.
- Repository implementation backup: `state/backups/mandala-daily-item-archive-20260821-140730`; daily-only deployment backup: `state/backups/mandala-daily-item-archive-daily-only-deploy-20260821-155259`; verified daily-only staging: `state/staging/mandala-daily-item-archive-daily-only-20260821-155029`.

## 2026-08-22 - Ontology Project Live-Title Projection

status: runtime_and_mirror_synced_static_verified_ui_smoke_pending

- Observation: among 73 retained project-plan rows, 25 saved rows had blank/raw stable `item_*` titles, four had readable labels behind current Workspace names, and 44 were current. The 25 raw rows include three old source-path duplicates, so the deduplicated 70-owner view contains 22 raw-title owners, four stale-title owners and 44 current-title owners. Every owner still resolved in Workspace, so this was label provenance drift rather than data loss or corruption.
- Contract refinement: `mandala-project-primary` descriptors now resolve current names through a live Workspace identity projection whose allowed source notes are parsed from the current stable project `nodeId` values, not borrowed from the Mandala owner scope. Stored plan-row names remain fail-open fallbacks; stable references, longitudinal documents and owner JSON are unchanged.
- Refresh semantics: a save event from one of those project-encoded Workspace sources coalesces a Mandala/Hub refresh; the Mandala owner scope is not admitted merely because it owns the table, although it remains valid when a current project `nodeId` independently encodes the same path. Unencoded or unrelated-source events do not refresh. Hub invalidates its local descriptor snapshot before reread, and an invalidated in-flight load cannot restore stale labels. The final owner/title projection participates in provider revision and cursor validation, so rename updates search/sort and makes an old cursor stale.
- Boundary: resolution does not activate a hidden Workspace view, rejects another source scope, and performs no owner-store write. Repository Dev and daily-only staging passed syntax, focused Hub/Ontology regression, Next Action Workbench suites and Temporal Framework suites; the npm wrapper itself was blocked by zero free space on `C:`, while its underlying test commands passed using a workspace-local temp directory.
- Implementation backup: `state/backups/ontology-live-project-titles-20260822-013107`; staging: `state/staging/ontology-live-project-titles-20260822-013107`. After independent `PASS / ALLOW` and explicit confirmation, deployment backup `state/backups/ontology-live-project-titles-deploy-20260822-071736` captured fresh Runtime/Mirror bytes and six sentinels. Runtime/Mirror now align at Mandala `A3810682...3209` and Hub `627D5190...243D7`; all six data/business sentinels are unchanged and the 25-line Goal filter is excluded. Loaded UI smoke remains pending Obsidian reload.
- Framework/Atlas update: `updated`, Bayesian label `refines`. No new owner, provider, persisted schema or Question Map entry is introduced.

## 2026-08-22 - Ontology Project Tracking-Parity Projection

status: repository_dev_verified_runtime_pending

- Observation: retained project plan rows were correctly preserving stopped history, but Ontology treated retention as current membership. Timeline already applied a terminal non-stopped admission after its stop-week-capable intermediate row projection, so the two current surfaces diverged.
- Contract refinement: Mandala now owns one shared final project admission for Timeline and current Ontology. Inclusive tracking rows, legacy plans and persisted instances remain the history graph; current, historical-attached and historical-orphan states are explicit and source availability follows the same matrix.
- Safety: every historical project owner uses the external read-only editor with no formal commit, recovery or shared-Schema writer. Stop/resume preserves stable identity and content. No owner JSON schema, API version or business data changes.
- Hub refinement: ordinary filters are current-only, History is explicit, ephemeral state is atomic, and keyword navigation broadly locates then revalidates in the committed current/history mode with complete rollback on failure.
- Evidence: plan verifier `/root/ontology_project_tracking_parity_plan_verifier` returned `PASS_WITH_ACTIONS`; all actions were absorbed before editing. Repository Dev plus Runtime-preserving and combined staging pass syntax and the full focused regression. The live read-only fixture proves dynamic set equality at 38 current owners, with 34 stopped retained history owners and zero project orphan in that snapshot.
- Deployment boundary: Actual Runtime and Repository Mirror remain unchanged. Runtime-preserving and combined candidates retain the exact pre-existing `25 insertions / 0 deletions` Dev-only Goal-filter difference. A new post-change verifier and explicit user confirmation are required before synchronization.
- Framework/Atlas update: `updated`, Bayesian label `refines`. No new owner/provider, persisted schema or Question Map entry; this closes a projection-consistency defect inside the existing lifecycle model.

Backup: `state/backups/ontology-project-tracking-parity-20260822-105345`; staging: `state/staging/ontology-project-tracking-parity-20260822-105345`; trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260822-105345-ontology-project-tracking-parity.md`.
- 2026-08-22: Framework update check `updated`. Added SuperMemo Concept Display as a durable Atlas plugin entry. The user-confirmed model separates the existing Concept capsule hierarchy from an independent whole-subject structure tree; one stable Concept identity may be assigned to at most one structure node. Repository Dev `0.2.0` is verified with strict four-owner storage boundaries, zero-write load, revision/CAS, archive/restore, exact reveal and fault-injected transaction recovery. Final verifier Ptolemy `01a028b4-4f26-75f1-84ad-2765a4066b0d` returned `PASS`. Runtime/Mirror remain unchanged pending explicit deployment. Bayesian update: `adds` and `splits`; Question Map, unknowns, glossary, aliases and Skill/rules are unchanged.
- 2026-08-22: Framework update check `updated`. Loaded Runtime `0.2.0` exposed a reusable Obsidian loader boundary: a community plugin entry cannot assume Node-relative resolution for plugin-local top-level `require`, because Electron resolves from the renderer. Repository Dev `0.2.1` now loads the fixed pure model file through `vault.adapter`, explicitly rejects nested `require`, validates the model contract before engine startup and proves negative-path zero writes. Bayesian update: `refines`; no owner/schema/Question Map change. Runtime/Mirror hotfix awaits explicit confirmation.
- 2026-08-22: The user explicitly confirmed the loader hotfix deployment. Dev/Runtime/Mirror now align on `0.2.1` for the five-file hotfix allowlist; three `data.json` sentinels remain unchanged, 18 syntax checks and nine loader/model/storage runs pass, and independent deployment verifier Ptolemy returned `PASS` with no P0/P1. Loaded UI smoke remains the only pending evidence.
- 2026-08-22: Framework update check `updated`. Loaded Runtime `0.2.1` proved two reusable Electron UI boundaries: browser `window.prompt` is unavailable, and a full-height ItemView must preserve the shared panel class while assigning scroll ownership per surface. Repository Dev `0.2.2` now uses one lifecycle-safe Promise dialog for Tree add/rename/move, preserves capsule/manager scrolling, fills the desktop Tree surface and restores narrow natural flow. Interaction tests cover overlay, single-instance settlement, four-owner cancellation zero writes, rename and real parent/top-level moves. Ptolemy returned final `PASS` with P0/P1/P2 clear. Runtime/Mirror remain `0.2.1` pending explicit deployment. Bayesian update: `refines`; no owner/schema/Question Map change.
- 2026-08-22: The user explicitly confirmed Tree input/full-height hotfix deployment. Six allowlisted files now align across Dev/Runtime/Mirror at `0.2.2`; SHA-256 is `6/6`, syntax checks `18/18`, loader/model/storage suites `9/9`, and `data.json` sentinels `3/3 unchanged`. Independent deployment verifier Ptolemy returned `PASS`; only loaded Obsidian wide/narrow/live-resize smoke remains.
- 2026-08-22: Framework update check `updated`. The user required the SuperMemo subject Tree to follow node-name order rather than creation order. Version `0.2.3` changes the pure sibling projection to numeric/base `label -> stored order -> stable ID`; it performs no migration or restore-time writeback and leaves node identity, parentage, assignment, move and archive semantics intact. Five files align across Dev/Runtime/Mirror, syntax is `18/18`, tests `9/9`, and data sentinels `3/3 unchanged`. Plan, implementation and deployment verifier Ptolemy all returned `PASS`. Bayesian update: `refines`; no owner/schema/Question Map change.
- 2026-08-22: Framework update check `updated`. SuperMemo Concept Display `0.3.0` adds the Antinet framework surface and confirms a reusable tree move contract: moving a node changes only its parent pointer, so all descendants move with the branch; the parent picker presents breadcrumb paths, excludes self/descendants/archived candidates, and supports text search. Repository Dev implementation and focused regressions are complete; Runtime/Mirror remain pending explicit deployment confirmation. Bayesian update: `refines`; no new cross-plugin owner or Question Map entry.
- 2026-08-23: Framework update check `updated`. Antinet's existing EVA links were stored with the default `引用` type because the Runtime provider discarded the consumer's capture options. The provider now preserves an explicit relation type, while SuperMemo narrowly reads legacy `引用` only for Keyword Index targets and continues writing `antinet-keyword-mount`; no EVA data migration or deletion occurs. Dev/Runtime/Mirror static hashes align and `data.json` remains byte-identical. Bayesian update: `refines`; no new owner, schema or Question Map entry.
- 2026-08-23: Framework update check `updated`. Repository Dev SuperMemo `0.4.0` adds a relation-local `义胶囊` surface for every active Antinet-to-Keyword mount. Valid new aliases use an uppercase locator letter plus Han text, such as `J记录`; missing or historical nonconforming aliases remain visible under `#`. Tree-to-capsule and capsule-to-tree reveal are local context navigation, while explicit source actions alone cross to Keyword Index. EVA also treats Keyword Index as a semantic known view and fails closed instead of opening its backing JSON. Ownership remains Keyword Index data / EVA relation / SuperMemo local presentation; no business JSON or persisted schema changed. Bayesian update: `refines`; Question Map and Skill/rules are unchanged.
- 2026-08-23: After explicit deployment confirmation, SuperMemo `0.4.0` and the EVA Keyword fail-closed router were synchronized to the proven Runtime and Repository Mirror. Six program-file hashes align across Dev/Runtime/Mirror, Runtime syntax passes, and four EVA/Keyword business-data sentinels are byte-identical to their pre-deployment values. Deployment backup and full hashes: `state/backups/supermemo-antinet-meaning-deploy-20260823-224736/`. Framework/Atlas update check remains `updated`; this adds deployment evidence without changing the established ownership claim.
- 2026-08-23: Framework update check `updated`. Repository Dev SuperMemo adds exact subject-tree Concept row/inspector to Concept-capsule reveal and projects `已挂树`, `已挂树·已归档` or `结构失联` on capsules from the existing assignment owner. The reverse capsule-to-tree action remains explicit. Reveal highlights are session-only and latest-request-wins; missing identities fail closed with zero writes. The same UI refinement makes meaning capsules compact/wrapping and preserves complete multiline tree labels without toolbar/inspector overlap at enlarged zoom. Independent verifier Carver returned `PASS`; Runtime/Mirror remain unchanged pending explicit confirmation. Bayesian update: `refines`; no owner, schema, Question Map, Skill or rule change.
- 2026-08-23: After explicit deployment confirmation, the verified SuperMemo engine and stylesheet were synchronized to the proven Actual Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align `2/2`; Runtime/Mirror engine syntax and focused Dev storage/UI regression pass. Three EVA/Keyword business-data sentinels remain byte-identical. Independent deployment verifier Carver returned `PASS` with no P0/P1/P2. Deployment backup: `state/backups/supermemo-concept-tree-capsule-navigation-deploy-20260823-233624/`. Framework/Atlas update remains `updated`; only loaded Obsidian interaction smoke is pending.
- 2026-08-30: Framework update check `updated`. Temporal Framework's Outcome overview is refined from a root-only card grid into a complete membership-local horizontal Outcome tree. SuperMemo Concept contributes only the visual branch grammar; Temporal retains identity, hierarchy, Placement, direct milestones, actions and state. Time focus is own-Placement overlap plus same-membership ancestor context; collapse is per-View and write-free; deep/cyclic/boundary evidence fails visibly. Repository Dev static tests pass, while Runtime/Mirror and loaded UI remain pending explicit confirmation. Bayesian update: `refines`; Question Map, owner boundaries, Store schema, public API and State Capsules are unchanged.
- 2026-08-30: The user explicitly confirmed deployment of the verified Temporal Outcome-overview tree. Only `main.js/styles.css` were synchronized to the proven Runtime and repository Mirror; three-role hashes and feature sentinels align, 10/10 tests and deployed syntax pass, and all four protected Runtime data/draft files remain byte-identical. Framework update check: `updated`, Bayesian label `reinforces`; loaded wide/narrow/resize and interaction fluidity smoke remains pending.

## 2026-08-31 - Effective Operational Context Key Contract

status: repository_dev_verified_runtime_pending

- Observation: Project Ontology, Temporal Framework and Next Action Workbench had been deriving “active project” from different retained or historical projections. A Workspace carrier, Project Overview comment declaration, Project Overview lifecycle, Mandala tracking lifecycle and Timeline history are distinct evidence layers; Timeline can retain an object after its Workspace carrier or operation context is gone.
- Claim: `有效操作上下文主键` is the derived current project eligibility projection, not a new identity or owner. It requires a current Workspace root carrier, a complete Project Overview comment declaration with exactly one non-`9XX` current declaration, a non-Killed Project Overview lifecycle, and an existing/non-stopped Mandala project plan. `009` remains current; `9XX` means `^9\d{2}` archive at declaration level.
- Provider/consumer update: Workspace and Project Overview provide bounded read-only snapshots; Mandala double-reads revision/provider-generation evidence and publishes the final v1 snapshot. Ontology current, Temporal new admission and Next Action admission/successful lifecycle refresh consume that snapshot. Timeline and explicit History remain non-authorizing historical evidence.
- Safety: full Workspace `jump:v1` remains stable project identity; Context Capsule descriptor is metadata. Missing, partial, truncated, over-limit, timed-out or torn evidence fails closed for admission. No hidden activation, polling, full-Vault scan, stale eligibility cache, direct cross-owner JSON read/write, migration or history deletion.
- Evidence: source status `confirmed_by_user_and_code`. The user confirmed the source flow and `9XX` meaning; Repository Dev implementation and focused/full suites pass. A read-only Actual Runtime audit yielded 72 current Workspace carriers, 37 comment declarations, 39 active Mandala plans and 20 final keys after the complete intersection; counts are diagnostics, never constants.
- Framework/Atlas update: `updated`. Added the dedicated Atlas knowledge page, glossary/alias distinction, contract/API entries, Mandala/Temporal consumer notes, FW-019 and registry entry. Bayesian update is `splits + refines`: it separates all Context Capsule identities from the effective current subset and narrows FW-018's current/history boundary.
- Verification closure: the first final review found three P1 contract gaps (missing frozen fields and silent target filtering/de-duplication). Repository Dev now emits `generatedAt` plus the complete Context descriptor and makes Temporal/Next reject the whole malformed or duplicate snapshot. Final verifier `/root/verify_effective_keys_final` returned `PASS`, P0=0/P1=0/P2=1 non-blocking test-backup limitation.
- Deployment closure: after explicit confirmation, only Workspace Mount, Project Overview, Mandala, Temporal and Next Action `main.js` were synchronized to actual Runtime and Repository Mirror. Three-role hashes are `15/15`, syntax is `15/15`, feature sentinels are `30/30`, full Temporal/Next and three Ontology/Hub suites pass, and 39 protected files had zero copy-window byte changes. Later owner-state writes were preserved. Independent deployment verdict is `PASS_WITH_ACTIONS`, P0=0/P1=0/P2=1 only because loaded UI smoke still requires plugin reload/restart. Bayesian update: `no_model_change` for the framework model; deployment evidence is reinforced.

### 2026-08-31 - Explicit Effective-Context Ontology Discovery

- User observation: the retained `项目主键` Ontology count mixed long-term history, empty and populated documents, so it could not answer the operational question “which keys are currently valid?”. The desired view must retain a valid item even when no Ontology content has been created.
- Refinement: Mandala adds a read-only `mandala-effective-operational-context` family, and Ontology Meta Hub registers it as `有效操作上下文主键`. It is populated directly from Mandala's complete final snapshot, independently of document content. The pre-existing `项目主键` family remains the historical knowledge envelope; History remains explicit/read-only.
- Safety: the new family neither writes nor migrates Workspace, Project Overview, Mandala, Timeline, Temporal, Next Action or Ontology content. It reuses the full Workspace stable identity; a failed/incomplete final snapshot or an ambiguous Workspace source scope yields no effective rows rather than an inferred subset.
- Framework/Atlas update: `updated`, Bayesian label `refines`. FW-019 now distinguishes the operational discovery family from the historical project envelope. Repository Dev tests and syntax checks are pending final verification; Actual Runtime and Repository Mirror remain unchanged until explicit deployment confirmation.

### 2026-09-01 - Mandala Current/Archive Project-Plan Split

- User observation: Mandala's 项目执行计划 still showed the broader current tracking set rather than the final effective operation-context set, while stopped/archived project plans had no dedicated view path.
- Refinement: the current project-plan surface and its print projection now consume only Mandala's complete final effective snapshot. The UI adds `查看已不追踪 / 归档 (N)`: it is a read-only retained view of all non-effective project-plan rows. A stopped row is labeled `已停止追踪`; other exclusions are conservatively labeled `未进入当前有效操作上下文主键集合` instead of guessing their upstream reason.
- Safety: archive viewing performs no business-data writes, does not reactivate tracking and does not grant a historical row entry to the current table. An incomplete snapshot fail-closes the current table but keeps retained rows reviewable in the archive view. Runtime/Mirror remain unchanged pending explicit deployment confirmation.

Trace: `memory/obsidian-plugin-system/atlas/knowledge/effective-operational-context-key.md`; `state/verification_inputs/ontology-effective-operational-context-keys-20260830/IMPLEMENTATION_PLAN.md`; `state/verification_inputs/ontology-effective-operational-context-keys-20260830/DEPLOYMENT_VERDICT.md`; `state/backups/effective-operational-context-keys-dev-20260831-042453`; `state/backups/effective-operational-context-contract-docs-20260831-090900`; `state/backups/effective-operational-context-keys-deploy-20260831-160309`.

### 2026-09-01 - Timeline Effective-Context Allocation Split

- User observation: Timeline still exposed many retained historical project keys in the time-resource grid, so a past project could appear to remain allocatable.
- Refinement: Timeline project import and its default project lane now consume only Mandala's complete final `listEffectiveOperationalContextKeys()` v1 snapshot. The consumer validates the full envelope and maps each accepted final target back to Timeline's legacy project external key to update rather than duplicate its retained item.
- Safety: snapshot failure closes the project candidate/lane; it never falls back to the broad `listTimelinePlanningTargets()` project pool. The latter remains only a lifecycle/history read. Existing historical Timeline items, time slots and milestones are retained behind an explicit read-only `查看历史项目时间安排` route and cannot receive a new time block, milestone or edit.
- Framework/Atlas update: `updated`, Bayesian label `refines`. This completes the intended forward-consumer alignment for Timeline while preserving owner-specific historical evidence. Repository Dev regression/syntax pass; Runtime/Mirror remain unchanged pending explicit deployment confirmation.

### 2026-09-01 - Goal-Domain Effective Operational Context Alignment

- User clarification: a standalone Mandala node is not a goal primary. The one-click goal-primary workflow creates the exact Mandala node, a same-named GTD top-level project carrier, a forward EVA `承载` edge from Mandala to GTD, and the Project Overview comment declaration.
- Contract refinement: a goal-domain Effective Operational Context Key requires the current exact Mandala owner, exactly one forward carrier edge to a GTD top-level project, exactly one current non-`9XX` Project Overview declaration, non-Kill lifecycle, and a present/non-stopped Mandala goal plan. Reverse/ordinary/child/missing/ambiguous carrier evidence fails closed; titles never join identity.
- Provider/consumer update: Project Overview publishes bounded Mandala comment/lifecycle/carrier evidence; Mandala publishes `listEffectiveGoalOperationalContextKeys()`. The Ontology effective family now projects eligible goals even when content is empty, Mandala goal planning/print use the final set, and Timeline/Temporal/Next Action consume the goal snapshot alongside the project snapshot. Combined candidate consumers fail closed when either domain is incomplete.
- Safety: goal identity is the complete Mandala `jump:v1`; GTD and EVA remain carrier/relation owners. Existing goal/project Ontology, Mandala plans, Timeline items, Temporal memberships and Next Action data are retained. History is read-only and cannot grant eligibility. No business JSON, Runtime or Mirror was written.
- Evidence: Repository Dev PEO and Mandala focused goal regressions, Timeline focused effective-context regression, and full Temporal/Next Action suites pass. Final independent verifier returned `PASS`, P0=0/P1=0/P2=0, including 31/31 frozen hashes and source→bundle checks. Backup: `state/backups/goal-effective-context-dev-20260901-110947`; engineering trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260901-110947-goal-effective-operational-context.md`. Runtime deployment remains a separate explicit-confirmation gate.
- Final-review remediation: every comment declaration occurrence receives a deterministic owner/keyword/occurrence evidence ID and cardinality is never collapsed by display text; GTD now publishes `Parent ID` and `Top Level`, so PEO validates top-level project carriers structurally instead of inferring from `pathLabel`; PEO rejects unavailable or `max-nodes / max-edges` truncated EVA models; effective-family Ontology schema/revision routing distinguishes project shared authority from goal owner-local documents by stable domain, and goal Schema resolution reads the retained owner-local document rather than requiring a current-family snapshot rebuild. Focused regressions cover repeated same-label declarations, child/title-only carriers, EVA truncation, goal document resolution and preserved project shared authority.
- Consumer hardening: the declaration occurrence ID is kept separate from the logical Context Capsule `contextKeyId`; active goal-plan Schema resolution no longer labels every effective goal historical; Timeline now validates the full bounded snapshot envelope and target `evidenceRevision` like Temporal/Next. A larger `totalCount` remains valid because it denotes inspected upstream owners, while `count/returnedCount` denote the effective subset.
- Framework/Atlas update: `updated`; Bayesian label `splits + refines`. FW-019 now covers separate project and goal evidence chains under one current-eligibility model.
- 2026-09-01: Deployed the dual-domain Effective Operational Context Key implementation after explicit user confirmation. Exactly seven JavaScript assets were synchronized Repository Dev → proved Actual Runtime + Repository Mirror; no JSON, manifest, style, source, test or business-data file was copied. Fresh backup `state/backups/goal-effective-context-deploy-20260901-133547` proves 21/21 three-role hash alignment and 66/66 unchanged environment/runtime-denylist/business-data sentinels. Syntax 21/21, focused regressions 3/3, Temporal 10/10 and Next Action 6/6 pass. Independent deployment verifier returned `PASS` and marked the result deliverable. Status: `runtime_synced_static_verified_ui_smoke_pending`; trace: `change-records/2026/2026-09/20260901-133547-goal-effective-operational-context-deployment.md`.

### 2026-09-02 - Effective Goal Carrier Owner-Batch Proof

- Observation: the complete `body care` chain existed, yet target effective keys could collapse to zero because Project Overview tried to prove a local carrier through its global display graph; GTD also repeatedly called the PEO identity snapshot while rendering many labels.
- Refinement: EVA now owns an exact outbound-relation batch snapshot and GTD owns an exact Context Capsule-to-active-top-level-project batch snapshot. Project Overview reduces its own comment/Kill evidence plus one call to each owner, with strict schema/cardinality/sample validation. Detached GTD engines immediately fail their live lease and cannot be read.
- Performance boundary: each batch is capped at 500, scans its owner data once, does not activate a leaf, does not poll and does not write business data. GTD UI paths reuse one prefetched PEO Context Capsule identity lookup per render/navigation instead of issuing per-label reads.
- Evidence: Repository Dev matches the independently verified staging candidate; four syntax checks, seven focused regressions and the existing EVA keyword routing regression pass. Independent verifier verdict `PASS` with no blocking findings.
- Framework/Atlas update: `updated`; Bayesian label `refines + corrects`. It corrects the obsolete global-PEO-graph proof path while reinforcing the existing owner-API Map/Reduce model. Runtime/Mirror remain unchanged and require a fresh explicit deployment confirmation.
- Deployment closure: after explicit user confirmation, exactly four allowlisted JavaScript files were synchronized Dev → Actual Runtime + Repository Mirror. Three-role code hashes align 12/12, syntax passes 12/12, seven focused regressions and EVA keyword routing pass, six feature sentinels resolve in all three roles, and 33/33 protected non-target files remain byte-identical. Independent verifier returned `PASS_WITH_ACTIONS`; the only remaining action is loaded Obsidian UI smoke. Bayesian update: `no_model_change` for ownership and eligibility; deployment evidence is reinforced.
- 2026-09-02: Corrected the Project Overview Context Capsule descriptor boundary for exact standalone addresses. Tokens such as `036G001A` now expose their normalized address while retaining the existing label-derived `contextKeyId`; structured declarations are unchanged, ordinary labels stay addressless, and standalone `9XX` tokens remain archived. This repairs strict effective-goal consumers (Timeline, Temporal Framework and Next Action Workbench) without weakening their fail-closed snapshot validation or changing Mandala tracking, owner schemas or business data. Only Project Overview `main.js` was deployed; Dev/Runtime/Mirror align at `e84b193b9ddcff8a4fe1f947c650e8c7b66dddb15b2ec5c6ba09d72a8303f4d2`. Bayesian update: `corrects`; loaded UI smoke remains pending plugin reload.

### 2026-09-02 - Ontology Effective Project/Goal Family Split

- Observation: Ontology normal discovery still exposed retained `项目主键`、`目标主键` and one mixed effective family, so current project and goal eligibility could not be read independently from historical knowledge envelopes.
- Refinement: Mandala now publishes `mandala-effective-project-operational-context` and `mandala-effective-goal-operational-context`; Ontology Meta Hub exposes them as `项目有效操作上下文主键` and `目标有效操作上下文主键`. Each family consumes only its complete final snapshot and retains empty Ontology owners. The old mixed family remains hidden for compatibility; original project/goal primary families move to explicit read-only History.
- Compatibility: old keyword targets, deep links, source-group identity and saved family state remain resolvable. The current source-prefix model remains `manualPrefix` over `autoPrefix`; both are retained and persisted, and no old auto-only behavior is reintroduced.
- Evidence: Repository Dev bundles are byte-equal to the independently verified staging candidate; both syntax checks, the full Hub regression and focused effective-goal regression pass. Runtime/Mirror remain unchanged pending a separate explicit deployment confirmation. Bayesian update: `splits + refines`; FW-018/FW-019 ownership and fail-closed evidence rules are unchanged.

### 2026-09-02 - Ontology Effective Project/Goal Family Split Deployment

- User authorization: explicit `OK的话请部署` after the independent final verifier returned PASS.
- Deployment: synchronized only `ontology-meta-hub/main.js` and `mandala-time-blocks/main.js` from Repository Dev to the proved Actual Runtime and Repository Mirror. Dev/Runtime/Mirror align 6/6: Hub `58C5DAC2EA5B3340A6093B0706FC7E8AC07AD40CDAF221124F0D1D0D87CECEAE`, Mandala `BDF763775531516DEFE592950840B6C0FAB5162D674521527678A6A6271F3A23`.
- Verification: Runtime/Mirror syntax 4/4, feature sentinels 6/6 and full Hub regressions against both deployed candidate roots pass. The deployed contract separates current project and goal families, preserves hidden mixed-family compatibility and keeps `manualPrefix` over the persisted automatic default.
- Safety: deployment did not copy JSON, manifest, stylesheet, README, cache, index or business data. A delayed post-deploy audit observed host-side changes to Actual Runtime Ontology `data.json` and `.obsidian/community-plugins.json`; both were outside the allowlist and were preserved. The other 16 protected files remained byte-identical.
- Trace: `state/backups/ontology-effective-domain-families-deploy-20260902-155755`; engineering record `memory/obsidian-plugin-system/change-records/2026/2026-09/20260902-ontology-effective-domain-family-split.md`. Bayesian update remains `splits + refines`; status is `runtime_synced_static_verified_ui_smoke_pending`.

## 2026-09-03 - State Capsules Current-Use Exit And Workspace Snapshot Layered Retirement Prior

- Trigger: user confirmed that State Capsules is no longer used for state switching and requested a system-wide Atlas/Framework update.
- Interpretation: the shared control plane is the notification mechanism. Future agents and maintainers should inherit this prior; no runtime event or cross-plugin message was added.
- Evidence split:
  - `confirmed_by_user`: current State Capsules switching practice has ended; this corrects the usage prior only.
  - `confirmed_by_user` + `confirmed_by_code`: State Capsules remains the Workspace environment-state orchestrator/consumer through `workspaceCapsuleBridge`. Workspace Mount exposes active Tab/order, collapse maps, keyword-drawer expansion, paradigm-mount collapse, pinned scroll and visible UI; current State Capsules capture keeps active Tab/count, collapse, pinned scroll and visible UI but omits `tabOrder` and keyword-drawer expansion. Restore remains legacy-compatible when those omitted fields already exist. Workspace Mount separately owns content snapshots and restores them as new Tabs with fresh item identities.
  - `confirmed_by_code`, bounded scan: no direct external consumer of Workspace Snapshot methods/storage keys was found across current Dev/Mirror/proven Runtime code surfaces.
  - `confirmed_by_code`, synthetic only: snapshots accounted for `176,965 / 550,202` bytes (`32.16%`) in one fixed synthetic fixture; this does not characterize real business data or production speed.
  - `inferred`: first retire active/default creation, then preserve compatibility reads, and only after inventory/backup/explicit disposition/migration verification archive or delete data.
  - `unknown`: whether real snapshots exist, remain useful, or should end in a cold sidecar versus explicit deletion.
- Framework decision: State Capsules current-use exit, retirement of its still-active Workspace environment bridge, and Workspace content Snapshot retirement are three separate decisions. The first performance candidate is the paired two-sided environment-bridge removal while preserving content Snapshot and inert legacy capsule fields. No silent normalization/save loss is permitted, and no code or data phase is authorized by this record.
- Updated: both plugin Atlas pages, Atlas contracts/unknowns/log, Framework Question Map, and this maintenance log. Generic glossary/alias files were deliberately not changed because “snapshot” has multiple legitimate system meanings and a broad alias would reintroduce conflation.
- Trace: `state/PLAN.md`; plan verifier `/root/snapshot_retirement_framework_plan_verifier` verdict `PASS_WITH_ACTIONS`; backup `state/backups/workspace-snapshot-retirement-framework-20260903-105449/`; engineering change record `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-105449-workspace-mount-snapshot-retirement-framework.md`.
- Write boundary: documentation and state only. Plugin source, actual Runtime, Repository Dev/Mirror, business/environment JSON, snapshot inventory, migration, archive and deletion remained untouched.
- Performance evidence: Workspace Mount currently maintains a roughly two-second bridge watchdog/heartbeat and constructs a deep-cloned environment payload after each successful data mutation. A no-subscriber synthetic scaling probe on the current bundle measured p50/p95 `0.1214/0.1997 ms` (256 items), `0.4732/0.7123 ms` (1,024), and `2.2099/2.8127 ms` (4,096), 300 samples each. This supports `inferred` priority only; real-host improvement remains `unknown`.

## 2026-09-03 - Workspace Active Bridge Retirement In Repository Dev

- Decision: State Capsules no longer controls Workspace Mount state switching. The retained control model is passive and caller-initiated through Workspace Mount's Global API/direct live bridge.
- Repository Dev implementation: State Capsules removes Workspace capture/apply/verify/retry/stat paths; Workspace Mount removes only the Workspace-specific BUS registration, heartbeat/watchdog, queued BUS apply and mutation-time state publication.
- Preserved contracts: `window.__workspaceMountPluginApi.getBridge()` / `ensureBridge()` and live `getState()` / `applyState()` remain; the generic bridge BUS and its one-time initialization remain; Workspace content Snapshot create/preview/restore and storage remain unchanged; legacy capsule `workspaceMount` data remains deep-cloned, readable and inert.
- Evidence: exact candidate-to-Dev hashes, syntax checks and a dual-bundle isolation harness pass. The harness confirms removed call/timer/publication paths and compatibility behavior; its timing is synthetic only.
- Boundary: Actual Runtime and Repository Mirror remain on the earlier active implementation pending a separate explicit deployment confirmation. Real-host performance and loaded Obsidian UI behavior remain `unknown`; no business/environment JSON was read or written by this landing.
- Framework/Atlas update: `supersedes + refines` the earlier Dev candidate while retaining it as dated decision history. FW-020 remains active for deployment/smoke/performance evidence, and the content-Snapshot inventory/disposition question remains separate.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-121700-workspace-active-bridge-retirement-staging.md`; backup `state/backups/workspace-active-bridge-retirement-framework-dev-20260903-123500/`.

## 2026-09-03 - Workspace Active Bridge Runtime/Mirror Deployment

- Authorization: the user explicitly requested deployment after Repository Dev, Framework and final state verification passed; a fresh independent deployment preflight returned `ALLOW` after completing the denylist.
- Deployment: exactly eight Runtime/Mirror targets were synchronized from Repository Dev—`main.js` and `README.md` for Workspace Mount and State Capsules. No style, manifest, version, JSON, cache, diagnostic, backup, registry, setting or other plugin file was written.
- Evidence: Dev/Runtime/Mirror target hashes align 12/12; `node --check` passes 6/6; the dual-bundle harness and static contract sentinels pass; thirteen protected and eighteen non-target program sentinels remained byte-identical.
- Runtime boundary: Workspace Mount is enabled, while State Capsules is currently disabled. The deployment is static/hash verified; loaded plugin behavior and real-host performance remain open until reload/enable smoke.
- Framework effect: `no_model_change`. FW-020 advances from deployment-pending to loaded-smoke/performance-pending; the passive-control contract, generic BUS preservation, inert legacy fields and independent content-Snapshot question are unchanged.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-143500-workspace-active-bridge-deployment.md`; backup `state/backups/workspace-active-bridge-deploy-20260903-141500/`.

## 2026-09-03 - Collection Active Bridge Retirement In Repository Dev

- Decision: Collection Card now follows the same architectural direction as Workspace Mount where active environment-state broadcast is unnecessary: caller-initiated passive owner API control remains, while the paired Collection/State Capsules active channel retires.
- Repository Dev implementation: Collection stops State Capsules cache/host updates, generic BUS host registration/unregister, legacy global publication and scroll/render-time bridge-state cloning. State Capsules stops Collection capture, path resolution, host ensure, apply, queue, warning and verification.
- Safety: exact notePath resolution prefers an active-ready host, fails closed on ambiguity/not-ready, opens only missing scopes, and treats a non-empty live path as authoritative over stale serialized state after retarget. Passive apply writes no Collection business JSON.
- Compatibility: new capsules store `{}`; overwrite and generic round-trip preserve historical unknown keys as read-only inert data. The shared Collection API, GTD and generic BUS implementation remain. Unreachable State Capsules Collection helpers are a separate non-blocking cleanup candidate.
- Evidence: independently verified staging and Repository Dev hashes, syntax, dual-bundle harness, retarget regression, byte backup and rollback all pass. Post-change verifier returned `PASS`, P0/P1 zero.
- Boundary: Runtime/Mirror retain the earlier implementation and require separate user authorization. Synthetic timings do not establish real-host performance; State Capsules is disabled in Runtime.
- Framework/Atlas update: `supersedes + refines` FW-021 and the paired Collection/State Capsules contract without changing system ownership, GTD or generic BUS policy.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-152245-collection-card-active-bridge-retirement-dev.md`; Framework backup `state/backups/collection-card-active-bridge-framework-dev-20260903-153645/`.

## 2026-09-03 - Collection Active Bridge Runtime/Mirror Deployment

- Authorization: the user explicitly authorized deployment after Repository Dev and shared-state verification; the fresh independent preflight reached `ALLOW` after three record-completeness actions closed.
- Deployment: exactly eight Runtime/Mirror `main.js` / `README.md` targets for Collection Card and State Capsules were synchronized from verified Repository Dev.
- Evidence: target hashes align 12/12 across Dev/Runtime/Mirror, syntax passes 6/6, the no-write dual-bundle harness passes, and 55/55 protected sentinels remain unchanged.
- Boundary: Collection is enabled, State Capsules remains disabled, and no loaded-host or real-performance claim follows. GTD, Workspace Mount, generic BUS implementation, business/Snapshot data, settings and all non-target files remained outside the write set.
- Framework effect: `no_model_change`. FW-021 now waits on reload, focused host smoke, real-host timing, and independent GTD/generic-BUS decisions.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260903-182900-collection-card-active-bridge-deployment.md`; deployment backup `state/backups/collection-card-active-bridge-deploy-20260903-180815/`; framework backup `state/backups/collection-card-active-bridge-deploy-framework-20260903-182429/`.

## 2026-09-04 - Workspace Lightweight Active Tab Switching In Repository Dev

- Trigger: the user selected active-Tab switching as the next Workspace Mount performance implementation.
- Claim: active Tab is live environment state on the ordinary interaction path, not a reason by itself to run the owner-data transaction. Genuine content mutations remain authoritative for business persistence and carrier events.
- Repository Dev implementation: a source-scoped generation overlay, active-region renderer, best-effort host layout persistence, guarded scroll restoration and mutation reconciliation replace the old immediate owner write plus full render.
- Correctness boundary: same-Tab clicks are true no-ops; A→B→C stale scroll tasks, overlapping genuine mutations, source-switch commits, peer-host selection and intentional create/close/reveal/Snapshot-restore Tab changes are covered by deterministic regression tests.
- Preserved contracts: passive Global API/direct bridge signatures, Workspace content Snapshot behavior, owner JSON schema, genuine mutation events and all other plugins remain unchanged.
- Evidence: Repository Dev equals frozen candidate at `CF1457EAE9AA0372B5964999CF8BA5CD1088EAB52CD9FA6BAC71869EB4BF52E4`; syntax and 19/19 tests pass; post-Dev verifier returned `PASS` (`P0=0`, `P1=0`, one non-blocking historical-report P2 now corrected).
- Framework/Atlas effect: `refines` the environment-state versus content-state boundary; adds FW-022 and a Workspace plugin contract section. Real-host speed is not inferred from synthetic counters.
- Boundary: Actual Runtime and Repository Mirror remain unchanged at the control hash pending explicit deployment confirmation. No business JSON, Snapshot data, settings or registry was written.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-011900-workspace-mount-active-tab-fastpath-dev.md`; backup `state/backups/workspace-mount-active-tab-framework-20260904-012235/`.

## 2026-09-04 - Workspace Lightweight Active Tab Runtime/Mirror Deployment

- Authorization: the user explicitly requested deployment after Repository Dev and shared-state verification passed; fresh deployment preflight returned `PASS / ALLOW` with P0/P1/P2 zero.
- Deployment: only Workspace Mount `main.js` was copied from verified Repository Dev to Actual Runtime and Repository Mirror. Runtime/Dev/Mirror now align at `CF1457EAE9AA0372B5964999CF8BA5CD1088EAB52CD9FA6BAC71869EB4BF52E4`.
- Evidence: syntax 3/3, deterministic active-Tab regression 19/19 and feature/compatibility sentinels pass. The post-deployment verifier returned `PASS`, P0/P1/P2 zero.
- Protected boundary: styles, manifest, README, versions, business JSON, Snapshot data, task bindings, diagnostics, plugin registry/settings and other plugins retained their predeployment fingerprints.
- Framework effect: `no_model_change`. FW-022 advances to static deployment complete and waits on plugin reload, loaded-host layout/rapid-switch smoke and real-vault timing.
- Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-014000-workspace-mount-active-tab-deployment.md`; deployment backup `state/backups/workspace-mount-active-tab-deploy-20260904-013500/`; framework backup `state/backups/workspace-mount-active-tab-deploy-framework-20260904-014500/`.
- 2026-09-04: Framework update check `updated`. Added `FW-023` and refined the Collection Card Atlas page from passive-bridge ownership alone to the local interaction-cost boundary. Actual Runtime/Dev/Mirror code and aggregate business-data scale were inspected read-only. Ordinary and bound Context Primary Key Tab changes converge on full persistence/full reconstruction; current keyword cardinality yields 64 synchronous Project Overview key projections per keyword-index rebuild, and render also schedules a potentially all-mode async refresh after provider-cache expiry. This is a confirmed work-amplification chain, not yet a loaded-host root-cause timing claim. The implementation gate protects explicit reveal/focus/scroll semantics and forbids inventing a provider generation contract. Independent plan verifier closed actions and returned `PASS`; no Skill/rule/plugin/runtime/business-data file changed. Bayesian update: `refines + adds_unknown`.

## 2026-09-04 — FW-023 Collection Card Phase 1 static deployment

- observation: the user explicitly authorized deployment after Repository Dev Phase 1 and its final verifier had passed.
- claim: Actual Runtime, Repository Dev and Repository Mirror now carry the same verified Phase 1 `main.js`; ordinary selection-path write/event/provider work is removed, while full-shell rendering and loaded-host latency remain open.
- source_status: `confirmed_by_user` + `confirmed_by_code` + `confirmed_by_test`.
- update_targets: `framework/question-map.md` FW-023, `atlas/plugins/collection-card-view.md`, `atlas/log.md`, deployment engineering record and active project state.
- protected_boundary: only Runtime/Mirror `collection-card-view/main.js` were synchronized; 14/15 non-target sentinels remained byte-identical and both real business sidecars were unchanged. The actual vault enablement file was concurrently rewritten after baseline, remains valid with `collection-card-view` enabled, and was neither normalized nor attributed to the deployment. Mirror stylesheet drift was intentionally preserved.
- bayesian_update: `reinforces + no_model_change`.
- trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-105000-collection-card-active-tab-phase1-deployment.md`; backup `state/backups/collection-card-active-tab-phase1-deploy-20260904-103730/`.

## 2026-09-04 — FW-019 Mandala weekly-summary consumer alignment

- observation: goal/project execution plans already consumed the final effective-key snapshots, while the two weekly-summary consumers and their print sections still used wider local visibility rules; both summary pages lacked an explicit retained-history path.
- claim: Repository Dev now makes each editable summary `selected-week retained rows ∩ current final domain snapshot`, with exited retained rows available through an independent read-only archive. Historical weeks remain observation-bounded and no current key fabricates a past row.
- source_status: `confirmed_by_user` + `confirmed_by_code` + `confirmed_by_test`.
- failure_boundary: invalid snapshots fail closed; rejected draft writes restore dirty and prevent archive switching; archive rows have no inputs/readers/save path.
- compatibility: existing Mandala owner JSON, APIs, events, schema, tracking lifecycle, execution-plan archive and other plugins are unchanged. Print reuses one final snapshot per domain for summary and plan sections.
- deployment_boundary: Repository Dev is verified at `C57136B...DFD00`; proven Actual Runtime and Repository Mirror remain at `BDF76377...A23` until a separate deployment confirmation and preflight.
- bayesian_update: `refines + no_model_change` for FW-018/FW-019.
- trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-114500-mandala-weekly-summary-effective-context-dev.md`; backup `state/backups/mandala-weekly-summary-effective-context-20260904-113601/`.

## 2026-09-04 — FW-019 Mandala weekly-summary Runtime/Mirror deployment

- authorization: the user explicitly confirmed deployment after the Repository Dev result; a fresh deployment verifier returned `PASS / ALLOW` with P0=0 and P1=0.
- deployment: only Actual Runtime and Repository Mirror `mandala-time-blocks/main.js` were synchronized from the verified Repository Dev bundle. Runtime/Dev/Mirror now align at `C57136B...DFD00`.
- evidence: syntax passes 3/3; the weekly-summary effective-context contract and the existing effective-goal regression pass for Dev plus isolated copies of both deployed destinations; 22/22 non-target and business-data sentinels remained byte-identical.
- boundary: no business JSON, plugin settings, manifest, stylesheet, README, versions, registry, Snapshot data or other plugin was written. The loaded Obsidian process was not reloaded, so goal/project summary, archive-toggle and print UI smoke remain pending.
- bayesian_update: `reinforces + no_model_change`; FW-019 advances from Repository Dev evidence to static three-role deployment evidence.
- trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-120500-mandala-weekly-summary-effective-context-deployment.md`; deployment backup `state/backups/mandala-weekly-summary-effective-context-deploy-20260904-115242/`; documentation backup `state/backups/mandala-weekly-summary-effective-context-deploy-docs-20260904-120218/`.

## 2026-09-04 — FW-004 SuperMemo compact Antinet meaning capsules

- observation: the user expects many meaning capsules and identified four density/admission problems: redundant target button, visible source/path annotations, a duplicated circular locator letter, and rejection of aliases whose suffix contains letters or digits.
- claim: a meaning capsule should expose one primary navigation affordance per semantic action. The capsule body remains the exact Antinet reveal; only edit and explicit Keyword Index source actions remain. Provenance stays searchable without occupying the compact visible block.
- source_status: `confirmed_by_user` + `confirmed_by_code` + `confirmed_by_test`.
- ownership_boundary: SuperMemo still owns only relation-local presentation; EVA owns relations and Keyword Index owns keywords. Stable `relationId`, external API, events, schema and business data are unchanged.
- responsive_boundary: wide/medium views preserve fit-content wrapping and inline actions; only ≤520px may use the full available row. Long Han/Latin/digit aliases ellipsize without parent overflow.
- alias_boundary: the first ASCII uppercase locator is unchanged; the suffix accepts Han, ASCII letters and digits. Existing qualifying values become valid by projection with no migration or restore-time writeback.
- update_targets: `atlas/plugins/supermemo-concept-display.md`, this maintenance entry, Repository Dev change record and active project state. Question Map, Unknowns, glossary, aliases, Skill/rules and MemPalace are unchanged.
- bayesian_update: `refines + no_model_change` for FW-004.
- trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-141545-supermemo-antinet-meaning-compact-ui-dev.md`; backup `state/backups/supermemo-antinet-meaning-compact-ui-20260904-141248/`.

## 2026-09-04 — FW-004 SuperMemo compact meaning-capsule Runtime/Mirror deployment

- authorization: the user explicitly confirmed deployment after Repository Dev final verification; a fresh deployment verifier returned `PASS / ALLOW_DEPLOYMENT` with P0=0 and P1=0.
- deployment: only Actual Runtime and Repository Mirror `supermemo-concept-display-engine.js`, `styles.css` and `README.md` were synchronized from the verified Repository Dev candidate. The three roles now align on all three declared source hashes.
- evidence: pre-copy no-drift passed; Runtime/Mirror isolated deployed-byte probes pass syntax, storage/UI, loader, Concept model and Antinet model suites; compact-UI/alias/navigation sentinels pass; 13/13 registry, business-data and non-target plugin sentinels remain byte-identical.
- boundary: no owner localStorage, EVA/Keyword `data.json`, registry, main/model/manifest/version/test, Vault content, API/event/schema/bridge or other plugin file was written. Static copy did not reload or execute the plugin, so loaded-host UI smoke remains pending.
- bayesian_update: `reinforces + no_model_change`; FW-004 advances from Repository Dev evidence to static three-role deployment evidence without a new Question Map or Unknown.
- trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260904-144850-supermemo-antinet-meaning-compact-ui-deployment.md`; backup `state/backups/supermemo-antinet-meaning-compact-ui-deploy-20260904-143900/`.
- 2026-09-15: Framework update check `updated`. SuperMemo meaning-page semantics distinguish historical missing membership from explicit unassigned `[]`: the former remains backward-compatible in `一般构型义胶囊`, while a new unambiguous Meta mount initially selects no page and is visible through `全部义胶囊`. The successful EVA/Antinet mount is not rolled back if membership persistence fails. Repository staging is verified; deployment is pending explicit confirmation. Bayesian update: `refines`; ownership, schema version, provider protocol and Question Map are unchanged.
- 2026-09-15: After explicit confirmation, the independently verified SuperMemo engine implementing unassigned new Meta membership was synchronized to the proven Runtime, Dev and Mirror. All three align at `18B5C648…2CCF`; isolated deployed-byte probes, syntax, five regression suites and protected program sentinels pass. The one-file allowlist excluded all business data and no automatic plugin reload occurred. Backup: `state/backups/supermemo-meaning-unassigned-deploy-20260915-213222/`. Framework/Atlas update remains `updated`; Bayesian label `reinforces + no_model_change`.

- 2026-09-20: Reviewed ordinary SuperMemo Concept capsule multi-page requirements against the existing Antinet meaning-page design. User confirmed multi-membership and one shared subject-tree assignment. Added a clearly implementation-pending section to ../atlas/plugins/supermemo-concept-display.md, separating confirmed intent/current code from proposed membership/projection/identity/delete/import/export rules. No plugin or business-data changes. Independent review PASS; Bayesian label refines.
  FW-004 remains the routing question; no Question Map or Skill changes.

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


## 2026-09-29 EVA relation maintenance performance evidence landing

- observation: 用户反馈“打开 eva cross relations 的关联界面刷新会慢”，要求只维护关系时减少拖慢，并明确本次工作更新 Atlas 与 Framework (`confirmed_by_user`).
- prior_read: entry-index, update-protocol, question-map (FW-011), registry, Atlas README/index/plugin page, and the deployment engineering record.
- claim: performance maintenance should separate first display, derived-index refresh, local rendering and durable save; input safety and ownership remain constraints. This is an `inferred` reusable interpretation of this case, update_type `refines`, not a newly mandatory Skill rule.
- evidence: implementation/source tests are `confirmed_by_code`; see [EVA Atlas page](../atlas/plugins/eva-cross-view-relations.md) and [deployment record](../../../REFERENCE_BOUNDARIES.md#ref-308)（外部来源未随包提供）. Plugin-level implementation facts stay in Atlas.
- future entry: follow FW-011 to the plugin page and regression evidence before proposing further optimization. Native reload performance remains `unknown`; gather loaded-host evidence before changing full-state persistence or widening refresh coalescing.
- update targets: existing EVA Atlas page and Atlas log; FW-011 next-evidence cell and this maintenance log. No new question ID or separate unknown-register entry: native validation is recorded under the existing question and plugin evidence route.
- trace: update check `updated`; framework schema/registry/entry-index and Skill/rules unchanged because existing entry paths and safety gates cover this case. No runtime or business JSON changes. This follow-up has its own backed-up engineering record: [20260929-eva-framework-landing](../../../REFERENCE_BOUNDARIES.md#ref-309)（外部来源未随包提供）.


## 2026-09-29 Keyword cross-view reveal audit

- observation/source: 用户明确从别处跳转到 Keyword 并滚动定位有时延迟，`confirmed_by_user`。
- prior_read: framework entry/update-protocol/question-map/registry, Atlas Keyword page/glossary/aliases, Skill and Keyword BUS protocol; runtime proven by open vault registry, with matching Dev/Mirror code hashes.
- claim: evaluate navigation as load -> prepare target -> render -> locate -> scroll, and separate click-only derivation from display work. This is an `inferred` prioritization lesson (`refines`), not a new hard rule. Verified implementation details stay in [Keyword Atlas](../atlas/plugins/keyword-index-plugin.md).
- evidence/status: source and isolated measurement method are `confirmed_by_code`; native end-to-end timing and future speedup remain `unknown`. First-open duplicate work was reproduced in a mock host; counts do not claim live UI acceptance.
- next route: existing FW-011 now links the audit; before any implementation, preserve permanent identity/SCON/BUS/primary-anchor contracts and choose a bounded warm/cold navigation regression matrix. No new long-term question is needed; the unknown remains attached to that route.
- trace: Framework/Atlas check `updated`; four documentation targets, backup/hash and independent review in [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-310)（外部来源未随包提供）. Runtime/business JSON/Skill/schema unchanged; no optimization deployed in this audit.

## 2026-09-29 Keyword reveal implementation evidence landing

- observation: 用户确认执行外部跳转定位提速，承接上方 audit；`confirmed_by_user`。
- prior_read: entry-index/update-protocol, FW-011, Keyword Atlas and audit evidence, Skill/runtime/Keyword BUS and view-stability gates.
- claim: derived-view reuse should have explicit freshness, context and lifecycle conditions; lazy DOM must preserve full owner inventory and materialize the requested path. This case strengthens the existing navigation-safety interpretation (`inferred`, update_type `refines`); it does not introduce a new mandatory Skill rule.
- evidence: reviewed source, isolated Edge/Node regressions and deployment hashes are `confirmed_by_code`; implementation detail and ownership remain in [Keyword Atlas](../atlas/plugins/keyword-index-plugin.md). Native loaded-host timing is still `unknown`.
- next route: FW-011 now moves from proposed patch to native reload and interaction evidence. Wider search/provider/persistence work remains outside this implementation.
- trace: Framework/Atlas check `updated`; Keyword Atlas/log plus FW-011/this log. No new question, unknown ID, framework schema, Skill or business-data ownership change. [Engineering record](../../../REFERENCE_BOUNDARIES.md#ref-311)（外部来源未随包提供） carries backups, three-way hashes and rollback.

## 2026-09-29 Keyword BUS creation diagnostic landing

- observation: 用户报告顺延 BUS 新增节点慢，截图停留在创建中，要求使用 Atlas/Framework；`confirmed_by_user`。
- prior_read: entry/update-protocol, FW-011/registry, Keyword Atlas and Keyword-Antinet-BUS workflow, glossary/aliases, Skill/BUS/view-stability/release gates; bounded MemPalace atlas search.
- claim: performance evidence should distinguish navigation from owner mutation, durable completion, derived publication and UI completion. This diagnosis refines the existing maintenance question (`inferred`, `refines`), without promoting a new mandatory rule. Provider/consumer implementation facts stay in [Keyword Atlas](../atlas/plugins/keyword-index-plugin.md).
- evidence/status: call graph and isolated reproduction are `confirmed_by_code`; native phase costs and loaded plugin version remain `unknown`. The third reproduced refresh is post-close and cannot all be charged to the creating button. No optimization has been implemented in this audit.
- next route: FW-011 now includes BUS-specific phase evidence and bounded proposals, retaining full identity/inventory and owner persistence safeguards. If modal wording/progress changes, apply existing input-protection rules.
- trace: Framework/Atlas check `updated`; four documentation files and [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-312)（外部来源未随包提供）. No production plugin or business-data writes, no new question/unknown ID, no Skill/schema/ownership change.


## 2026-09-29 Keyword scan latency implementation checkpoint

- Observation: scan shortcut seems silent and full scan takes too long; confirmed_by_user. Prior: entry/update protocol, FW-011, registry, Keyword Atlas/glossary/aliases, Skill and release/view-stability gates.
- Update: refines the separation between invisible work, full fresh source validation, durable persistence and derived fanout; corrects interpretation of mock-generated repository-load counts. Implementation facts stay in [Keyword Atlas](../atlas/plugins/keyword-index-plugin.md).
- Status: staging code and isolated regression verified; runtime deployment, OS shortcut delivery and native improvement unknown/pending. FW-011 records the next evidence; no new hard Skill rule, schema, ownership or MemPalace claim.
- Trace: four documentation updates plus [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-313)（外部来源未随包提供）; backups and candidate hashes therein. No runtime/business-data/settings writes during this stage.


## 2026-09-29 Keyword scan deployment

User approved the reviewed candidate. Actual runtime was re-proven via open:true vault registry and baseline hash. Only Keyword main.js was written externally; runtime/dev/mirror hashes and syntax match. FW-011 moves from deployment pending to native reload/hotkey/timing evidence pending. Atlas retains algorithm and evidence boundaries; no framework schema/Skill change. Fresh eight-file backup and protected-file observations are in the [deployment record](../../../REFERENCE_BOUNDARIES.md#ref-314)（外部来源未随包提供）.


## 2026-09-30 Daily review evidence and environment-only view grouping

- observation: 用户常在已有笔记上修改，希望独立每日修改栏目，并保留每一天的记录；confirmed_by_user。
- prior: entry/update-protocol, FW-011, Atlas roles/contracts/glossary, Skill runtime/release/view stability gates.
- claim/update: refines existing review/evidence and environment-state boundaries. A latest-mtime projection cannot reconstruct all edited days; retained provider evidence must be distinguished from backfill. Opening/restoring a leaf is not an edit event. Implementation facts belong in [Daily Atlas](../atlas/plugins/daily-note-review.md) and [Hub Atlas](../atlas/plugins/view-group-hub.md).
- evidence/status: code review plus Node/Edge mocked-host regressions confirmed_by_code; repository Dev/Mirror landed, runtime/reload pending. Two startup/path-reuse review findings were fixed and retested before landing. No native timing assertion.
- next: FW-011 routes to actual reload/restart history and user-paced eight-member switching. No new mandatory Skill rule or framework model; Framework/Atlas check updated.
- trace: [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-315)（外部来源未随包提供）. No note/Keyword/EVA/settings/runtime writes or MemPalace publication.


## 2026-09-30 Daily Review deployment evidence

- Observation: user explicitly requested deploying the completed daily review; confirmed_by_user. Prior entry/update protocol/FW-011 and plugin Atlas were applied.
- Update: refines delivery state of the existing owner-history/environment-view boundary. [Daily](../atlas/plugins/daily-note-review.md) and [Hub](../atlas/plugins/view-group-hub.md) record approved runtime files; code and exact hash evidence confirmed_by_code, native loaded behavior unknown. Existing FW-011 native acceptance route still applies; no new model or Skill rule.
- Trace: [deployment record](../../../REFERENCE_BOUNDARIES.md#ref-316)（外部来源未随包提供）, fresh byte backups and protected-file checks. Framework/Atlas update check updated. No business note/index/history/settings writes from deployment.


## 2026-09-30 Keyword source-cache deployment and metadata identity boundary

- Observation: scans remain slow; user explicitly says September metadata changes must remain findable in other views, and approves implementation/deployment. confirmed_by_user. Prior entry/update-protocol/FW-011, Keyword Atlas, Skill/release/runtime gates applied.
- Claim/update: refines source acquisition versus durable identity/projection boundary; corrects assumption that old cached-metadata traversal was plugin incremental scanning. Optimization may reuse proven per-file derivations while preserving owner reconciliation and publication; no new hard rule/model. Algorithm and source trust bounds stay in [Keyword Atlas](../atlas/plugins/keyword-index-plugin.md).
- Evidence: immutable historical sources, actual-method synthetic regression, independent code/deployment reviews and exact hashes confirmed_by_code; native latency/loaded host unknown. FW-011 asks for cold/warm/changed-note and publication phase evidence.
- Trace: [engineering record](../../../REFERENCE_BOUNDARIES.md#ref-317)（外部来源未随包提供）, backups, explicit user deployment approval and protected-state checks. Framework/Atlas check updated. No identity schema/ownership or Skill change, no MemPalace mine.


## 2026-09-30 Ontology state comment attachments

- Observation: user requests clipboard image comments analogous to Mandala daily notes (confirmed_by_user).
- Update: extends Hub-local comment UI, refines distinction between image references and Ontology table mounts; no provider/schema ownership change. Contract and failure semantics live in [Ontology Atlas](../atlas/plugins/ontology-meta-hub.md).
- Evidence: candidate syntax and 13 actual modal-method regressions confirmed_by_code; native paste and forced-exit behavior not established. Repository implementation only; runtime pending approval. Existing framework input-preservation and owner boundaries apply, no new Skill rule.
- Trace: [change record](../../../REFERENCE_BOUNDARIES.md#ref-318)（外部来源未随包提供）. No MemPalace mine or business-data rewrite.


2026-09-30 Ontology comment-image deployment: confirmed_by_user approval; approved candidate copied to proven NEWERA runtime, code/styles hashes match Dev/Mirror; protected plugin data unchanged. Refines delivery state only; native-host paste/close remains unknown pending reload. Trace: change-records/2026/2026-09/20260930-ontology-comment-images.md and staging deployment.json.


## 2026-09-30 Ontology album projection refinement

- Observation: user screenshot shows raw attachment links and expects the daily-note album, not merely single-image preview (confirmed_by_user).
- Update: corrects previous incomplete UI interpretation. Preserve serialized content while presenting separate text/image projections; child album shares parent editor persistence. Contract details live in [Ontology Atlas](../atlas/plugins/ontology-meta-hub.md); no provider/schema ownership change.
- Evidence: syntax and24 modal-method regressions confirmed_by_code; native-host album UI unknown. Repository implementation only; runtime pending approval. Existing input-preservation/owner boundaries apply; no new Skill rule.
- Trace: [change record](../../../REFERENCE_BOUNDARIES.md#ref-319)（外部来源未随包提供）. No MemPalace mine or business-data rewrite.


2026-09-30 Ontology album correction deployed: prior explicit deployment authorization continues for user-reported discrepancy in same image-comment feature. Runtime matches reviewed Dev/Mirror; protected data unchanged;24 regression tests and syntax pass. Native album size/focus remains unknown until reload. Trace change-records/2026/2026-09/20260930-ontology-comment-album.md.


## 2026-09-30 Ontology dialogue drawing refresh

- Observation: user asks to draw current state transitions through dialogue-graph-drawing (confirmed_by_user).
- Update: applies/refines existing FW-009 frozen authored-projection and live-owner boundary; no new ownership/model or Skill rule. Atlas workflow records current validation scope and source drift distinction; coordinates and measures remain staged project artifacts.
- Evidence: exact identity/member/direction checks and installed-renderer headless browser regressions confirmed_by_code; native loaded-host acceptance unknown; old authored slot unchanged until concrete preview approval.
- Trace: [record](../../../REFERENCE_BOUNDARIES.md#ref-320)（外部来源未随包提供）. Atlas updated, Framework trace updated, Skill not_updated (existing method covers task), MemPalace not mined.


### 2026-09-30 对话图稿已替换
用户明确批准替换后，revision 2062 的 15 节点 / 21 关系 / 8 分组图稿已同步 Runtime、Dev、Mirror 的 dialogue-layout.json；三处 SHA-256 均为 `84a0beaa6d62b07178c60ecbf3953110b8ed06ae01e685c75538aabc148306ad`。发布前语义漂移检查通过，插件其余顶层文件逐字节哈希保持不变。仅替换冻结图稿，不修改实时图、评论、附件及插件代码。备份与 rollback_source：`D:\han\学习的文件夹\8- 自己的系统设计与开发\卡片对话式工作流\agent-end-to-end-blog-writing-main\state\backups\ontology-dialogue-release-2026-09-30T03-03-41-851Z`；before_hashes 见其中 hashes-before.json，after_hashes 与 verification 见 state/staging/ontology-dialogue-refresh-20260930/deployment.json。配套教练说明：output/reports/ontology-state-transition-coach-20260930.md，区分设计关系、自述与待验证假设。状态 confirmed_by_code（磁盘部署），未声称原生 Obsidian 界面验证。


## 2026-09-30 — Mandala capture native tab recovery

Observation (confirmed_by_user): place time-block capture under Daily Note Review in the grouped native-view menu; use effective project/goal context and remove legacy capture filters/source diagnostics. Prior read: entry-index, question-map, registry, update-protocol, Atlas README/glossary/aliases and the two plugin pages.

Update refines OPS-002 and FW-011/FW-019 evidence: the environment menu routes to the owner-native view, while Mandala retains content/draft persistence. Facts land in [Mandala](../atlas/plugins/mandala-time-blocks.md), [View Group Hub](../atlas/plugins/view-group-hub.md) and [contracts](../atlas/contracts.md), not duplicated into control-plane rules. Source status confirmed_by_code applies to repository candidate/mock tests only; deployment and native acceptance are pending. Question Map and unknown-register entries unchanged because existing open native acceptance questions cover the gap. No Skill/rule change or MemPalace mine. [Engineering trace](../../../REFERENCE_BOUNDARIES.md#ref-321)（外部来源未随包提供）.


## 2026-09-30 Time-block native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Mandala 0.1.9 and View Group Hub 0.2.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-322)（外部来源未随包提供）.


## 2026-09-30 Timeline collection cleanup and native group entry

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Observation: user already uses Next Action Workbench for collection aggregation and requests removing the Timeline duplicate, plus a right-second native navigation entry. Prior read: entry-index, question-map, registry, update-protocol, Atlas Timeline/Hub contracts and source. Update refines existing owner/consumer boundary and FW-011 maintenance evidence. Narrow facts land in Atlas plugin pages/contracts; no Skill or conceptual framework rule changes. Question Map/unknown register remain unchanged because native acceptance/performance gaps are already open. No state cards or MemPalace mine. Business JSON remains owner-held; environment prewarm must not initialize/reset it.

Runtime installation is pending separate task-specific approval; loaded native UI/scroll/multiwindow and switching latency remain unverified. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-323)（外部来源未随包提供）.


## 2026-09-30 Timeline cleanup and grouped entry — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. Timeline 0.1.1 and View Group Hub 0.2.3 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-324)（外部来源未随包提供）.


## 2026-09-30 日课 native tab and performance boundaries

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Observation (confirmed_by_user): 日课 should also be reached from the view group, and performance matters. Prior: framework entry-index/question-map/registry/update-protocol, Atlas glossary/aliases and Mandala/Hub owner contracts. Claim/refinement (confirmed_by_code): grouped navigation is environment state; Mandala remains the sole daily content and draft authority. Native host isolation requires shared content queues and symmetric stale-page protection across the old modal and new tab.

Update target: Atlas provider/consumer/contracts/log above. Existing OPS-002 and FW-011/FW-019 cover ownership, restore-time read-only behavior and native acceptance; no invented new research question or duplicated control-plane rule. Evidence: core conflict/CAS/strict-read tests, actual canonical file read-only schema acceptance, and mocked Edge rendering/close/image/recovery tests. Performance evidence is bounded: current-day milestone request and 25 retained opens with no additional reads/renders, while initial group prewarming remains. Actual native switching, popup integration, multiwindow and app shutdown are unknown. No Skill/rule changes or MemPalace mine.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-325)（外部来源未随包提供）.


## 2026-09-30 日课 native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK请部署”. Mandala 0.1.10 and View Group Hub 0.2.4 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-326)（外部来源未随包提供）.


## 2026-09-30 Time-view performance and historical capture boundary

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Observation (confirmed_by_user): preserve view-group prewarming; optimize collapsed time-block detail generation and save refresh; seal records before September 15; choose safe Timeline improvements. Prior: framework entry-index/question-map/registry/update-protocol and Atlas Mandala/Timeline/Hub ownership contracts. Observation (confirmed_by_code, read-only audit): 172 historical plus seven current records; all seven current bindings are primary-key contexts.

Claim/refinement: historical compatibility belongs in a read-only date partition using saved snapshots; active capture need not load structural owner data merely to display records. Committed content remains CAS authority, while retained UI is derived state requiring generation ordering and current mutable callbacks. Asynchronous rendering optimization must preserve trailing invalidations and host lifetime boundaries. Update targets: Atlas provider pages/contracts/log. Evidence: strict-read/archive/CAS tests, bounded DOM paging, retained inputs, save/range concurrency and Timeline asynchronous drain/close/source tests. Actual native latency and multiwindow acceptance remain unknown. Existing ownership/UI-stability framework questions apply; no new research card, rule, Skill edit or MemPalace mine. Update: refines; trace: engineering record linked below.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-327)（外部来源未随包提供）.


## 2026-09-30 Time-view performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “Ok就请部署”. Mandala 0.1.11 and Timeline 0.1.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-328)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Observation (confirmed_by_user): separate execution-time tools from review and long-term planning in the view-group menu. Prior: Hub environment-only grouping, source identities and accepted prewarm policy. Claim (confirmed_by_code): menu presentation can change independently of the stable member/bootstrap catalog; no new cross-plugin business protocol is needed. Update targets: Atlas Hub, contracts and log. Update: refines existing environment/content boundary, not a new architecture or research question. Evidence: unchanged full member definitions/order, existing lifecycle/source tests, wide/narrow mocked-browser menu bounds and routing. Native theme rendering remains unknown; no performance improvement claimed. Trace: engineering record below.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-329)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. View Group Hub 0.2.5 are installed in the proven NEWERA runtime; the three changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-330)（外部来源未随包提供）.


## 2026-09-30 Keyword BUS post-confirm performance

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Observation (confirmed_by_user): Keyword BUS creation waits too long after confirmation. Observation (confirmed_by_code): creation publishes EVA change, then refreshes all Keyword views, then expands/re-renders the originating view. Claim: merge derived UI work under the existing serialized owner action and prepare expansion before refresh, while preserving trailing invalidations and source/lifetime checks. Prior: stable identity/CAS ownership, UI continuity and EVA publication contracts. Update: refines; targets: Atlas Keyword/contracts/log. Evidence: real-data read-only audit (three to one normal-case refreshes), transaction/cache/event/source regressions; publication remains awaited. Native timing remains unknown; no new architecture, research card, rule or Skill change. Trace: engineering evidence below.

Runtime installation awaits separate package approval. [Engineering evidence](../../../REFERENCE_BOUNDARIES.md#ref-331)（外部来源未随包提供）.

Failure refinement: if both creation refresh and final drain fail, retain the deferred invalidation outside released batch ownership; the next explicit refresh or EVA event retries it, with no repeated note creation.


## 2026-09-30 Keyword BUS post-confirm performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Keyword Index 0.1.22 is installed in the proven NEWERA runtime; the two changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-332)（外部来源未随包提供）.


2026-10-01 — Framework/Atlas update check: updated. Observation: weekly order recovered after PEO opened (confirmed_by_user); old synchronous rank read uses live model/last-known (confirmed_by_code). Refines FW-011 performance and FW-019 responsibility boundaries. Atlas plugin entries/contracts now distinguish eligibility from sorting and record native host/recovery and same-round model reuse. No new owner, Skill or research card. Repository implementation verified; actual runtime and native timing pending. [Engineering trace](../../../REFERENCE_BOUNDARIES.md#ref-333)（外部来源未随包提供）.


## 2026-10-01 Weekly native performance — approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this reviewed package with “请部署”. Mandala0.1.12, PEO0.1.6 and Hub0.2.6 main.js/manifest.json are installed in the proven NEWERA runtime. Program hashes match reviewed Dev/Mirror candidates. No business JSON/settings/index copied and no plugin reload triggered. Prior ownership and safety contracts remain; native UI/latency acceptance is still pending. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-334)（外部来源未随包提供）.


2026-10-01 — Framework/Atlas update check: updated. Restart-cache observation refines FW-011: durable derived evidence can reduce repeated body parsing while full inventory/owner reconciliation remains. Atlas Keyword/contracts/log record owner, invalidation, proof limits and Registry consumer contract. No framework ownership or Skill change. Source status confirmed_by_user + confirmed_by_code; metadata evidence is not cryptographic freshness. Repository verification complete, deployment/native latency pending. [Engineering record](../../../REFERENCE_BOUNDARIES.md#ref-335)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Keyword0.1.23 and JSON Asset Registry0.1.3 reviewed program/document bytes installed in proven NEWERA runtime. The first successful scan seeds the new cache; later ordinary scans may reuse unchanged sources across restart. Complete inventory/native proofs/identity/EVA work remains. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-336)（外部来源未随包提供）.


## 2026-10-01 Weekly source resolution correction

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: corrects

User observed Hub weekly source-note-unproven-configure-settings. Runtime Mandala source is configured and exists; Hub0.2.6 accidentally omitted weeklyTracking in three Mandala-specific branches. Hub0.2.7 includes weeklyTracking alongside timeBlocks/dailyLessons for getExpectedSourcePath, repair notice and select-time source checks. Mandala getTimeCaptureSourceNotePath remains source authority; saved Hub identities cannot override it. Missing owner source stays unavailable, wrong-source leaves/drafts remain retained pending explicit repair. This corrects the earlier weekly integration claim; no new schema, source discovery scan, Mandala change or business write. Node behavior regression passes; native reload pending. Framework/Atlas update check: updated, FW-019 consumer contract correction. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-337)（外部来源未随包提供）.


## 2026-10-01 Weekly source fix approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this repair package with “确认”. Hub0.2.7 main/manifest installed in proven NEWERA runtime. Weekly source lookup, repair notice and source-switch guard now share the Mandala owner path used by daily lessons/time blocks. Existing source note and business data remain unchanged; old leaves/drafts retained. No native reload or live UI acceptance claimed. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-338)（外部来源未随包提供）.


## 2026-10-01 Weekly tab switching refinement

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: refines

Mandala0.1.13 addresses user-reported four-tab switching lag. Shared legacy/native renderer skips clicking the already active tab; project rows and effective-key reads run concurrently and drain both on failure. Native host alone uses an exact-weekly-file read snapshot limited to one render, initialized after saves and discarded in finally or before write attempts. Repeated readers parse those bytes once and receive independent clones; final fresh disk evidence still rejects changes. No cross-render cache or PEO/Timeline eligibility/order cache. Legacy flush remains; native redundant base-render flush is skipped only for a truthy matching host token after the host flush barrier. Source-switch, CAS, old editor/recovery retention and real upstream lookups remain.

Native weekly recovery button is hidden when the current source has zero stored/in-memory recoveries and otherwise shows count. Recovery panels remain readonly/copyable and repeated opening replaces that panel. Render phase metrics contain tab/timings only (save barrier, initial read, page build, verification, commit); asynchronous textarea layout/paint is outside this metric. Node12 and Edge23 fixture checks pass, including previous safety regressions and scoped-read freshness/clone/write-error tests. No live-vault timing claim; full DOM rebuild and upstream model cost remain. Framework/Atlas update check: updated/refines FW-011 and existing save/source contracts; no authority/schema change. [Trace](../../../REFERENCE_BOUNDARIES.md#ref-339)（外部来源未随包提供）.


## 2026-10-01 Weekly switching optimization approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “请部署”. Mandala0.1.13 main/manifest installed in proven NEWERA runtime. Native weekly page shares one render-scoped weekly read and skips an authenticated redundant flush; shared tabs ignore current-tab clicks and project reads drain concurrently. Recovery entry displays only when source-matched drafts exist, with count. Final disk verification, source guards and draft protection remain. No cross-render eligibility cache, business/settings copying, native reload or live speed claim. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-340)（外部来源未随包提供）.


2026-10-01 — Framework/Atlas update check: updated/refines FW-011. Reference restart caching separates reusable parsing evidence from current graph truth: old graph preview must rebuild live relationships. Persist only bounded disposable evidence, coalesce writes, fail safely on unavailable proof or cache corruption. Atlas owner/contracts/log updated; no identity/PEO/Mandala authority change. Repository verified; deployment/native performance pending. [Engineering record](../../../REFERENCE_BOUNDARIES.md#ref-341)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Reference Graph Widget0.1.1 and JSON Asset Registry0.1.4 reviewed program/document bytes installed in proven NEWERA runtime. The first explicit graph use seeds the bounded restart cache; later openings may reuse unchanged parsed sources after native proof checks. Restored graphs are previews and rebuild current links/backlinks/EVA. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../REFERENCE_BOUNDARIES.md#ref-342)（外部来源未随包提供）.


## 2026-10-01 工作流性能与新插件扩展性

Framework/Atlas update check: updated. User observation and explicit requirement refine FW-001/FW-011 and add FW-024: measure complete user workflows, preserve owner boundaries, budget background work and instrumentation, implement applicable observation points in future new plugins. Registry routes to the new Skill reference and Atlas workflow; FW-019 eligibility remains canonical. Three distinct agents perform plan analysis, feasibility review and final validation. External Anthropic/huashu-flash methods inform paired comparison and regression sentinels, not measured system benefits. No runtime plugin edits, global Skill installation or telemetry collection. [Engineering record](../../../REFERENCE_BOUNDARIES.md#ref-343)（外部来源未随包提供）.


## 2026-10-01 Meaning capsule dual navigation

Framework/Atlas update check: updated; refines / no_model_change. Observation: user requests choosing Keyword Index or Note from the meaning capsule arrow. Read prior entry-index, registry, Question Map, update-protocol, Atlas entry/index/terminology/plugin and current owner APIs. Narrow claims live in atlas/plugins/supermemo-concept-display.md and atlas/contracts.md; existing FW-004 remains sufficient. No new ownership, schema or Skill rule. Evidence is repository code and isolated tests; runtime deployment/native smoke pending. Engineering trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-supermemo-meaning-navigation.md.


## 2026-10-01 Meaning navigation approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (请部署)
update: reinforces / no_model_change

User approved the reviewed two-file meaning navigation package. Runtime/Dev/Mirror engine and styles now match the reviewed hashes. Fresh byte backups, runtime syntax, seven isolated deployed-byte regression suites and nine unchanged non-target file sentinels pass. Only engine/styles were copied to the proven NEWERA runtime. No user business data/settings/index/cache written; native reload, multiwindow/zoom and actual UI acceptance remain pending. This supersedes the previous deployment-pending status for this feature. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-supermemo-meaning-navigation-deployment.md.


## 2026-10-01 Context rename recovery deployment

status: disk_deployed_native_acceptance_pending
evidence_status: confirmed_by_code
update: supersedes / no_model_change

User authorized deployment after final implementation PASS. The reviewed 11-file allowlist now matches runtime/dev/mirror (33 hashes, 30 syntax checks); 27 recovery regressions pass. Workspace scope stays Tab keywords only. PEO coordinates durable progress; each provider remains its keyword owner. The live workspace.json changed during the copy window, while the other 77 protected files remained unchanged. The deployment script never writes that file; cause is unproven. No native reload or real business rename was performed. Collection source/build remains noncanonical and must not be used to rebuild over the reviewed bundle. Trace: state/verification_inputs/context-rename-recovery-20261001/DEPLOYMENT_RESULT.json and DEPLOY_REVIEW.md. Engineering record: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-194116-context-rename-recovery-deployment.md.


## 2026-10-03 Antinet mounted keyword dual navigation

Framework/Atlas update check: updated. Observation (confirmed_by_user): Antinet 已挂载关键词也需要像义胶囊一样选择 Keyword Index 或 Note；用户明确要求落入 Atlas 和 Framework，并指定仓库内技能。Prior read: entry-index, question-map, registry, update-protocol, Atlas README/glossary/aliases, plugin page and contracts; implementation follows repo-local skills/obsidian-system-plugin-dev.

Claim (confirmed_by_code): Antinet inspector reuses the existing meaning navigation menu while Keyword remains note owner and EVA retains Index routing. Layer: 符号入口 / 关系跳转 / 材料承载. Bayesian update: refines / no_model_change. Narrow durable targets: atlas/plugins/supermemo-concept-display.md and atlas/contracts.md. Existing FW-004 covers this update protocol application; no new long-term question, ownership or schema, so Question Map, registry and Skill are unchanged.

Repository verification evidence is recorded separately from runtime acceptance: state/staging/supermemo-antinet-navigation-20261003. Runtime remains read-only pending secondary confirmation; no business JSON/settings/index/cache written. Engineering trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-antinet-navigation.md.

Additional observation (confirmed_by_user): switching away from the meaning page resets vertical position. Claim (confirmed_by_code): source-view session owns bounded page/query viewport memory; explicit reveal takes precedence, no business persistence. This refines the existing UI stability boundary, so existing FW-004 and Skill cover it. Synthetic validation: 7 Node suites, 15 navigation cases, 9 scroll cases including exact visual anchor and narrow owning-host restoration. An early narrow probe was blocked by a fixture Notice overlay; corrected test waits for expiry and performs pointer-coordinate click. No production focus interception retained. Native host acceptance remains pending.


## 2026-10-03 Antinet navigation and meaning scroll approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (OK就请部署)
update: supersedes / no_model_change

The user authorized this reviewed package. Only supermemo-concept-display-engine.js was copied to the proven NEWERA runtime after a fresh baseline check and byte backup. Runtime/Dev/Mirror engine now agree at SHA-256 d76a50ab167cee006eba518e049da3134eb81d1f1c19f338ef3b8f3914e20ff6; all seven production files agree across the three roles. Runtime syntax, seven isolated regression suites run against deployed bytes, and ten unchanged non-target runtime file hashes pass. Atlas/Framework trace records deployment, without changing ownership or schemas.

Both Antinet Index/Note choices and per-view-session meaning project/search scroll retention are installed on disk. Existing loaded Obsidian code has not been reloaded or tested; user-controlled plugin reload/restart and real-data/multiwindow acceptance remain pending. Positions reset when the engine/view session ends. No business JSON/settings/index/cache copied or modified. This supersedes deployment-pending statements for this package. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-antinet-navigation-deployment.md.


## 2026-10-03 Subtle ordinary ATOM tint adjustment

status: repository_verified_runtime_pending
evidence_status: confirmed_by_user (slightly deepen only), confirmed_by_code
update: refines / no_model_change

Ordinary ATOM row background opacity changes from 0.10 to 0.12. Palette RGB values, corrected format grouping, representative hash, traversal, sorting and indexed-keyword override rgba(0,47,167,0.5) remain byte-for-byte unchanged. Generated bundle differs only in this opacity literal. Six existing model tests pass, including 5514-row traversal comparison with only output opacity adapted; original oracle fixture unchanged. This is a subtle visual adjustment, not an algorithm or ownership change. Runtime is unchanged pending this feature-specific deployment approval. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-atom-subtle-tint.md.

Framework prior: existing ATOM plugin page and FW-004 update protocol; narrow claim lives in the plugin Atlas. No Question Map, registry or Skill change is needed.


## 2026-10-03 ATOM subtle tint approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk), confirmed_by_user (OK就请部署)
update: supersedes / no_model_change

Approved ordinary row background opacity0.10->0.12 deployed to actual NEWERA. Only main.js copied; RGB palette, grouping, hashing, sorting, indexed0.5 marker, styles, manifest and README remain unchanged. Fresh byte backups, exact one-literal diff, runtime syntax, four-file three-way hashes and three protected runtime files verified. Main SHA-256: d723d655d074ecef31cbbcdced22f8945247e1729ac05d3dd702b93fd1f369c8. Existing six model regressions and independent implementation review passed. Actual loaded Obsidian was not reloaded; native visual confirmation pending user reload. Supersedes this tint package's deployment-pending status. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-atom-subtle-tint-deployment.md.


## 2026-10-03 SuperMemo Note at source tab-group end

status: repository_verified_runtime_pending
evidence_status: confirmed_by_user (far-right tab destination); confirmed_by_code
update: refines

Observation: user asks SuperMemo Direct Note to open at the end of the tab strip, not adjacent to its current tab. Interpreted as a new rightmost tab in the source group, preserving all existing tabs. Prior: framework entry/update-protocol/FW-004, Atlas ownership/contracts/API registry and repo-local obsidian-system-plugin-dev. Claim: explicit source identity is necessary for deterministic tab placement across multiple groups. Keyword remains note-open owner; SuperMemo supplies its ItemView leaf. Narrow API/provider/consumer pages and contracts updated. Existing FW-004 is sufficient; Question Map/Skill unchanged.

Validation: seven existing SuperMemo suites, six source-group/provider cases and fifteen synthetic menu cases pass. These are mock/synthetic evidence, not actual Obsidian placement proof. No runtime files written, new package-specific deployment confirmation required. Official API reference: https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts (createLeafInParent, iterateAllLeaves, WorkspaceLeaf.parent).

Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-note-tab-end.md.


### 2026-10-03 Note tab-end deployment
status: runtime_deployed_native_acceptance_pending
User explicitly confirmed deployment of this package. SuperMemo main/engine and Keyword main synchronized from reviewed dev to proven NEWERA runtime; runtime/dev/mirror SHA-256 agree. No business data changed. Host/plugin reload and actual rightmost-tab placement remain user acceptance pending. Evidence: state/staging/supermemo-note-tab-end-20261003/deployment.json.


## 2026-10-03 Mermaid Slice D：已显示大图的交互与标签生命周期

- 范围：FW-005 / FW-011 / FW-024 的性能观测、派生视图与页面稳定性细化。用户反馈主要是图已显示后缩放/滚动/折叠卡顿，并指出白色 subgraph 标签；据此区分冷渲染、重绘绑定与后续标签刷新，未改编号范式。
- 实现候选0.1.28：标签文字元数据/元素复用、同帧请求合并、替换/关闭时完整释放；main/core 当次批量DOM查找复用，保持现有选择器首个DOM匹配与点击身份；白标签仅main拥有，未用core覆盖其功能。无内容/环境态写回，无schema或跨插件协议变更。
- 观测边界：Console性能开关默认关闭；新增阶段仍有界且脱敏。窗口长任务/可见页面帧间隔只是全窗口指标，嵌套阶段不能累加；后台零帧场景必须通过visibilitychange重置基线，避免把离开窗口时间判为交互卡顿。
- 证据分层：隔离Chrome输出等价和稳定刷新DOM创建1200→0证实减少重复工作；600/1000节点实际生成SVG的绑定/着色局部耗时改善不等于原生整图速度。cluster矩形读取10000→100但总关联时间未稳定改善。白标签逐次计时未证实稳定加速；原生大图重载后Console采样仍待用户完成。
- 未混入修复：冷渲染引擎limits/错误SVG识别、继承重复编号随机夹具下游超时另行登记；没有提高生产限制、删除节点、自动折叠或禁用预热。大图测试引擎来自本机包，不证明当前Obsidian进程已加载相同字节。
- 状态：repository_verified_deployment_pending；runtime/mirror0.1.26保持只读。下一步为审核后具体包部署确认及用户重载验收。详见 [工程记录](../../../REFERENCE_BOUNDARIES.md#ref-344)（外部来源未随包提供） 与 [插件Atlas](../atlas/plugins/mermaid-floating-widget.md)。不进入研究卡或MemPalace。


## 2026-10-03 Mermaid0.1.28 部署闭环

- 用户对已审核具体版本确认后，白标签/大图绑定/遍历与有界Console诊断包同步到已证明的NEWERA运行库及mirror。dev/runtime/mirror四代码说明文件哈希逐一相同，业务/派生JSON未复制，原生插件未自动重载。
- 状态推进到disk_deployed_reload_pending；不把磁盘同步或隔离SVG证据等同于原生user_ready。用户重载后按README采样已显示大图的缩放/滚动/折叠，核对loadedVersion0.1.28、标签位置、点击身份与视口稳定性。
- before/after、备份、回滚与三边哈希见 [部署记录](../../../REFERENCE_BOUNDARIES.md#ref-345)（外部来源未随包提供）。本节替代上面部署待确认状态，保留冷渲染/标签真实帧率等证据边界。


## 2026-10-03 Mermaid Slice E：头领可读标签与有界累计观察

- observation/source：用户标注截图将白签连到各自头领；0.1.28原生报告显示已明显顺滑但标签阶段仍有峰值，详细事件缓冲已淘汰部分数据。截图语义confirmed_by_user；部分报告是实机观察，代码事实confirmed_by_code；合成对照的evidence_type=synthetic_browser_test，原生0.1.29验收待完成。
- claim/layer/owner：FW-005 / FW-011 / FW-024 的派生UI与观测细化；mermaid-floating-widget拥有白签位置和可选锚点缓存。头领身份按sg.baseNode，颜色覆盖不能改变白签归属；v2可选元数据从现有SVG重算，无业务数据归一化。
- update_type：refines；固定白签的头领关联，批量读几何后写样式减少交错布局；500条详细缓冲之外增加固定白名单key累计汇总，明确只覆盖接受的观察，单列拒绝span。保留默认关闭、生命周期清理和窗口级指标不能归因单插件的边界。
- evidence limit：600/1000节点局部SVG测试减少滚动读取72→2并消除70次写后读取；局部同步计时不等于GPU绘制/原生整体倍速。边界标题仍随滚动视口裁剪，不为标签改变相机。全部节点边、. / +编号、折叠和跳转生成保持。
- target_selection/trace：最窄落点为[插件Atlas](../atlas/plugins/mermaid-floating-widget.md)、此维护记录、[独立工程账本](../../../REFERENCE_BOUNDARIES.md#ref-346)（外部来源未随包提供）。Framework/Atlas update check=updated；无新Question/Skill/研究卡/MemPalace写入。status=repository_verified_deployment_pending；0.1.29原生验收待用户重载，runtime/mirror现为0.1.28。


## 2026-10-03 Mermaid0.1.29 部署闭环

- 用户已对审阅后的具体版本确认部署，三份代码/说明同步至已证明的NEWERA运行库和mirror，core保持字节相同；三边四文件哈希闭环。备份及新记录见[工程账本](../../../REFERENCE_BOUNDARIES.md#ref-347)（外部来源未随包提供）。
- Framework/Atlas update check=updated；本节只推进工程状态到disk_deployed_reload_pending，既有refines声明与证据边界不变。没有新Question/Skill/MemPalace写入，没有改业务数据、启用配置或自动重载。
- native_acceptance=pending：用户重载后检查头领上方白签和10–15秒交互Console报告；phaseTotals仅覆盖接受的阶段观察，窗口级指标不能归因于单插件。


## 2026-10-03 Mermaid whole-expansion exit rule / FW-005

- observation: User confirms P's successor should follow the B expansion at the end of P's subgraph, using address encoding rather than nesting-depth scores.
- prior/claim: Atlas Mermaid address grammar already separates dot members and plus continuation; refined layout exit rule now lives in `../atlas/knowledge/mermaid-address-semantics.md#whole-expansion-layout-exits-2026-10-03`.
- source_status: confirmed_by_user for semantics; repository candidate and synthetic Mermaid geometry evidence only for implementation; native acceptance pending.
- update_type: corrects + refines; target: Atlas chapter, no Framework model or ownership change.
- trace: `state/staging/mermaid-encoding-exit-f-20261003/`; change-record `20261003-mermaid-encoding-exit-f.md`. No runtime deployment in this change.


## 2026-10-03 Mermaid 0.1.30 deployment / FW-005

- User approved the concrete independently reviewed release. Four plugin files now match across dev/runtime/mirror; state is disk_deployed_reload_pending.
- Framework/Atlas update check: updated status only; address semantics and earlier synthetic evidence unchanged. Native geometry/performance still pending user reload and Console report.
- Backup, three-way hashes and rollback: `../change-records/2026/2026-10/20261003-153140-mermaid-0.1.30-deployment.md`. No business data, enablement or automatic reload changes.


## 2026-10-03 Mermaid representative exits / FW-005

- observation: User reports all-exit convergence visually right-aligns parallel members and requests one representative plus one shared helper per P.
- update_type: corrects + refines. Atlas `../atlas/knowledge/mermaid-address-semantics.md` carries the refined rule; Framework model unchanged.
- source_status: user-confirmed intent, repository candidate with real-file isolated Mermaid evidence; native pending. Actual files read only; duplicate numbering repaired by user before fixtures.
- trace: `state/staging/mermaid-representative-g-20261003/`; change record `20261003-mermaid-representative-g.md`. No new-version deployment in this step.


## 2026-10-03 temporary 0.1.29 layout comparison

status: comparison_29_disk_restored_reload_pending

User requested viewing 0.1.29 before deploying the reviewed 0.1.31. Runtime/mirror four plugin files restored from verified byte backups; dev/candidate stay 0.1.31. No note, setting, cache/index or UI reload changes. Wait for user to finish the 0.1.29 inspection before the already-authorized 0.1.31 deployment. The two selectors differ (depth score vs expanded-path representative); pixel-equivalent layout is not asserted. This is temporary comparison state, not withdrawal of the G design. Evidence: `state/staging/mermaid-representative-g-20261003/RESTORE29.json`; engineering record `20261003-155720-mermaid-restore29-comparison.md`.


## 2026-10-03 Mermaid 0.1.31 deployment / FW-005

- User approved the concrete independently reviewed release. Four plugin files now match across dev/runtime/mirror; state is disk_deployed_reload_pending.
- Framework/Atlas update check: updated status only; address semantics and earlier synthetic evidence unchanged. Native geometry/performance still pending user reload and Console report.
- Backup, three-way hashes and rollback: `../change-records/2026/2026-10/20261003-160419-mermaid-0.1.31-deployment.md`. No business data, enablement or automatic reload changes.


## 2026-10-03 — Mermaid 29/31 algorithm comparison (FW-005)

- Observation: user supplied the 29 screenshot, switched to 31, supplied a second screenshot, then requested a durable algorithm comparison.
- Prior read: entry-index, registry, question-map, update-protocol and the existing Mermaid address semantics chapter and release records.
- Update: refines + supersedes only the historical temporary-29 / awaiting-comparison state. [Atlas comparison](../atlas/knowledge/mermaid-address-semantics.md#0129-与-0131-算法对照及当前证据2026-10-03) owns the algorithm facts and limitations; FW-005 remains active.
- Source status: confirmed_by_code for the versioned selectors/cache/fold behavior; inferred for the pair's visually similar overall layout. Screenshot evidence does not establish identical exit IDs or a Console-confirmed loaded version.
- Next evidence: native deep-A/later-B, parallel successors and fold cases; native 29-vs-31 timing remains unmeasured. Global duplicate-identity suppression remains an explicit Atlas limitation.
- No Skill/rule change or plugin/runtime mutation. This landing separates 30-vs-31 fixture counts from the 29-vs-31 comparison. Trace: state/staging/mermaid-29-31-atlas-20261003; engineering record below.
- Engineering record: [20261003-091437-mermaid-29-31-atlas](../../../REFERENCE_BOUNDARIES.md#ref-348)（外部来源未随包提供）.


## 2026-10-03 Daily Note Review source-group-end navigation

Observation: user requests Daily Note Review use the same rightmost Note placement as SuperMemo. Prior: framework entry/update protocol, FW-004 and Atlas Daily ownership plus source-leaf navigation precedent. Claim: pass the exact originating review leaf through identity resolution, then append to its current group; do not infer the active leaf. Layer: environment-only navigation; owner: Daily; provider: Obsidian workspace; consumer: Daily view; contract: local UI navigation. Source status: confirmed_by_user for requested placement, confirmed_by_code for implementation. Update: refines/no_model_change.

Atlas daily plugin page updated; no new Question Map, API registry or Skill entry required. History/data ownership, Review Meta and Hub identifiers preserved. Mock navigation/history regressions pass; repository delivery only, runtime and native acceptance pending feature-specific confirmation. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-daily-note-tab-end.md.


### 2026-10-03 Daily Note tab-end approved deployment

status: runtime_deployed_native_acceptance_pending
User explicitly confirmed this Daily Note Review deployment. Reviewed main.js synchronized from dev to the sole-open registered NEWERA vault. Runtime/dev/mirror SHA-256 agree. Fresh byte backup and independent pre-deployment review retained. No note, settings or activity-history files copied or modified by deployment. Plugin reload and native rightmost-tab acceptance remain pending. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-daily-note-tab-end-deployment.md.


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


## 2026-10-10 | 整体计划对账与子批优先级规则

Observation：用户指出近期 GTD 子批惯性推进，要求长期入口 → 当前项目 → 整体优先级 → 子批执行，并明确 PLAN 为唯一任务计划、MATERIAL_AUDIT 为证据审计面。Claim update：refines；用户要求 confirmed_by_user，已有规则缺少该显式决策门禁 confirmed_by_memory。Skill 新 0.4 增加触发点、全模块证据/阻塞对账、优先理由、陈旧入口和冲突处理；Framework entry-index 只引用读取链，不复制活动项目计划。仓库 Skill 是用户确认开发维护源，global 仅接收本次新增段，保留旧差异。实际修改、独立核查、备份/hash/回滚见本轮工程记录。该条是规则更新 trace，非项目里程碑完成或 next-action。

工程记录：`memory/obsidian-plugin-system/change-records/2026/2026-10/20261010-080338-obsidian-skill-global-priority.md`。计划核查与最终核查分别见本轮 results 的 PLAN-REVIEW.md、IMPLEMENTATION-REVIEW.md。


## 2026-10-11 整体对账与功能等价性能论证落地

Observation：用户要求更新Atlas/Framework，原功能保留但可以改变实现方式提升性能。source_status：confirmed_by_user；冻结报告confirmed_by_memory；宿主刷新分类/投影循环confirmed_by_code；未实施收益inferred，真实host/完整整链仍unknown。
Update：corrects过渡页C17陈旧顶部；refines原表格仓库接线证据；splits日志字节、恢复重放、界面刷新和真实响应。FW-024/025与DQ-U01..03不关闭，入口导航同步。当前任务顺序只在活动PLAN/MATERIAL_AUDIT，本记录不是next-action。周追踪/日课/元表格常用意义保留；三个退役插件仍排除。
Trace：读framework entry-index/update-protocol/question-map/registry及Atlas README/schema/index/log/unknowns/过渡页和活动计划。更新8长期页；不改代码/Skill/runtime、不新增研究卡/经验卡、不mine。完整来源在过渡页，备份/hash/独审见 results/daqian-unified-core-20261006/atlas-framework-update-20261011 和 memory/obsidian-plugin-system/change-records/20261011-atlas-framework-core-performance.md。

## 2026-10-13 统一主键管理、永久身份与宿体对账

Observation：用户追问集中管理宿体与剩余计划，并要求更新Atlas/Framework。confirmed_by_user仅包括统一管理需求及大千P1停止/恢复证据；confirmed_by_code为已部署项目域管理/改名恢复；独立轻量宿体为inferred建议，永久身份生产接入及新改名原生验收仍unknown。

Update：corrects旧registry既成事实、项目域限定与rename deferred、Workspace范式关键词改名范围；splits对象subject、描述符及宿体；refines项目写入口与双域资格；adds_unknown CKM-U01～03/FW-026，FW-010更新证据入口。详情统一在[统一主键管理与宿体](../atlas/knowledge/unified-context-key-management.md)。Framework只维护问题/导航/trace，不复制排期；不改Skill、运行插件、业务JSON或旧大千sealed项目。

Trace：prior包括entry-index/update-protocol/schema、两主键知识页、术语、contracts、工作流与unknowns；证据为本项目已审源码、部署receipt与用户陈述。14长期页修改前字节备份、hash与独立核查证据在 `results/context-key-bus-management-20261012/atlas-framework-update-20261013/`；工程事实另记change-record，不新增研究卡或MemPalace经验卡。


## 2026-10-13 独立主键管理宿体候选进度

- observation：用户继续PLAN后续；形成context-key-manager 0.1.0只读候选包。
- claim/evidence_status：confirmed_by_code，仅代码/包及隔离测试；native未验证。
- update_target：atlas/knowledge/unified-context-key-management.md，区分H1候选、H2有效项切片与H3/H4待做。
- trace：results/context-key-bus-management-20261012/host/；窄文档独立预审host_preflight通过，修改前已备份。
- FW-026与CKM-U01～03不关闭；未转移生产writer，不生成全量目录、资格或部署成功断言。活动PLAN是唯一执行计划。


## 2026-10-13 主键宿体0.2委托候选

observation：继续PLAN，把项目管理入口接入独立宿体。confirmed_by_code：仅候选模块/原Modal synthetic夹具和包；update_target为Atlas统一主键管理页；trace为results/context-key-bus-management-20261012/host-management/。区分原owner委托、会话refs与完整历史，不移交writer，不关闭FW026；生产和native仍未知。两页窄更新通过host_management_preflight，修改前备份。


## 2026-10-13 H2 当前来源项目追踪目录（0.3 候选）

独立宿体 context-key-manager 0.3 增加项目追踪记录分区；Mandala 新公开 listProjectTrackingDirectoryV1 只读枚举当前来源的持久追踪索引，含 active/stopped。名称为上次记录，不作为身份或资格；停追后重建宿体可再次发现并委托原面板恢复。全历史、归档、Kill、目标管理和生产永久身份仍未完成。

双库分别在各自基线上生成候选，保留大千适配，未写运行库或业务JSON。provider28、directory11、management11、Chrome13通过；Chrome重建宿体是隔离夹具，不代表真实重启验收。独立终审证据：results/context-key-bus-management-20261012/tracking-directory/FINAL-REVIEW.md。0.3尚未部署，H4/native仍开放。


## 2026-10-13 H4 0.3 双库磁盘部署

context-key-manager 0.3 已安装至用户已证明的 NEWERA 和大千实验库；Mandala 已接公开追踪目录。13份代码文件落盘回读一致：4份Mandala main（NEWERA/runtime/dev/mirror；大千独立）及双运行库+mirror各3份新宿体文件。Mandala manifest/styles保持，未修改业务JSON或community-plugins.json，未自动重载/启用。

已形成独立宿体且磁盘已部署；loaded_state=unknown，native_acceptance=pending。用户需分别重载Mandala、启用主键管理中心；若尚未加载前批改名代码，再重载PEO/NAW。验收重点为停止→宿体重载→追踪记录发现→恢复，再验证原改名/同步恢复。完整步骤和只读Console见 results/context-key-bus-management-20261012/tracking-directory/deployment/ACCEPTANCE.md。

事实来源：同目录receipt.json及独立FINAL-REVIEW.md。P2生产身份、目标管理、全历史/归档/Kill仍开放。H4仅关闭磁盘部署，未关闭原生验收。


## 2026-10-13 Tracking authority coordinated release

本批在 NEWERA、大千实验库、开发副本与 mirror 分别按原基线部署 Mandala、PEO 和 NAW 代码；新增原始追踪证据 reader 与 PEO 只读投影模块。磁盘已回读核验；loaded_state=unknown，native_acceptance=pending，需用户保存输入后重启 Obsidian 或重载上述三个插件。未写业务 JSON、历史周记录、评论或绑定。

停止/恢复追踪是唯一主动生命周期开关；当前资格仍要求原载体、完整唯一非9XX声明，以及目标的 GTD/EVA 承载证据。旧 Kill 只保留历史诊断，setter停用；PEO 默认隐藏明确停追对象，提供只读“查看已停止追踪”。未知状态保留正常对象并提示不可核验，不能冒充停追；历史仅覆盖当前来源图中可识别的已停追胶囊，不是完整历史目录。周追踪现有归档、按周回看、原内容和日期规则保留。恢复管理沿用原完整nodeKey，不新建或改绑对象。

009J由用户在原owner界面停止追踪后，独立原始读取确认NEWERA历史Kill25项全部stopped，大千0项；没有自动按Kill批量迁移。双向policy guard拒绝混版资格结果；NAW已同步适配已停追对象改名读取，只更新名称。先前P3 Kill按钮候选保持SUPERSEDED。

验证：raw reader33、投影16、生产方法集成48、NAW20项；12份既有目标资格/周汇总回归；双库真实只读probe；候选语法检查。验证为隔离生产方法与mock DOM，不是原生Obsidian UI端到端。独立终审与发布回执见 results/context-key-bus-management-20261012/tracking-authority-review/RELEASE-REVIEW.md、deployment.json；业务零写入与历史helper原样检查纳入回归。

后续：用户原生验收停止→PEO隐藏→历史回看→恢复→重开、周追踪旧周回看；大千单独验收。P3新增项目/目标与创建中途恢复、目标集中管理入口和P2永久身份生产迁移仍未完成。

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


## 2026-10-14 P3 部署前收尾

Observation：用户要求P3部署前工作全部完成。Update：refines；source_status=staging_verified，未提升为运行库/原生事实。知识事实维护在[统一主键管理](../atlas/knowledge/unified-context-key-management.md)同日最新节；实施与验收边界见results/context-key-bus-management-20261012/p3-creation/DELIVERY.md。Trace：change-records/2026/2026-10/20261014-p3-predeployment-completion.md。保留P2永久身份生产接入与P4的独立边界，本次不新增通用规则或经验卡。


## 2026-10-14 P3 四基线部署

Update: refines；source_status=disk_deployed_verified；loaded_state=unknown_reload_required；本批原生验收待完成，保留此前用户验收范围。当前事实见[统一主键管理](../atlas/knowledge/unified-context-key-management.md)最新部署节；Trace：results/context-key-bus-management-20261012/p3-creation/DEPLOYMENT.md、change-records/2026/2026-10/20261014-p3-deployment.md。

## 2026-10-14 双追踪目录兼容修复

Update: refines；source_status=disk_deployed_verified，native待验收。事实见[统一主键管理](../atlas/knowledge/unified-context-key-management.md)最新节；Trace：change-records/2026/2026-10/20261014-tracking-directory-repair.md。


## 2026-10-14 主键核心数据宿体目标确认

Update: refines；用户确认中心数据权威目标，实施仍planned_not_implemented。事实/边界见[统一主键管理](../atlas/knowledge/unified-context-key-management.md)最新节，FW-026保持开放；排期只在活动PLAN。Trace：change-records/2026/2026-10/20261014-context-authority-roadmap.md。


## 2026-10-20 主键管理中心长期层补齐（10-15～10-20 欠账）

Observation：用户要求把过程中做成的内容及时更新到 Atlas 和 Framework，避免版本迭代多了以后追不上。用户问 Skill 是否有此要求。回答：Skill 0.2 要求每一轮都做 Framework/Atlas update check，Skill 第 5 节要求每次修改都写工程记录卡。前几批对长期层多次标了 deferred，C3 部署也还没有变更记录卡，属于欠账。

Update：
- 新增 [Atlas 插件页 context-key-manager](../atlas/plugins/context-key-manager.md)：权威划分、存储版本与显式升级、对外契约、原生验收证据、限制。
- 在 contracts.md 新增“Context Key Center Authority Contract”。
- 在 index.md 登记该插件页。
- 统一管理知识页追加 10-15～10-20 分阶段节（supersedes 10-14 的“未实施”状态）。
- 更新 CKM-U01、CKM-U02，并在 FW-026 记录进展。
- 新增 C3 部署工程记录卡，以及经验卡 20261020-multi-root-deploy-packaging-lessons。

source_status：
- confirmed_by_code：已部署代码与回执；
- confirmed_by_user：005A、036G001、v6 升级、012F 替换的原生验收；
- 仍为 unknown：大千验收；关闭后重开的核对。

Trace：prior_read 包括 update-protocol、entry-index、question-map、统一管理页、unknowns、contracts。没有修改 Skill、规则或运行插件。经验卡尚未 mine（只到“已制卡”）。

后续约定：每个部署批次或用户验收完成后，在同一轮内完成 change-record 加 Atlas update check，不再累积 deferred。

## 2026-10-21 P2-E 部署与大千验收；EVA 被确认为系统级瓶颈

Observation（用户原话）：
- P2-E 方面：“大千里面项目创建OK”“九宫格也创建OK”“改名都做到啦”；“主键能改名就行”，即不需要条目标题跟着改。
- 卡顿方面：“新增下一步待办……增加完事之后会卡一阵子”；“eva-cross-view-relations 这个是瓶颈吗？……参考之前的 atlas 和 framework 看看，并且更新”。

Claim 与 source_status：
- P2-E 已部署（confirmed_by_code）；大千原生验收通过（confirmed_by_user）；NEWERA 尚未验收（unknown）。
- EVA 是 Collection 编辑后卡顿的主要来源（confirmed_by_user 原生 Console + confirmed_by_code）。这推翻了 2026-09-29 对“存储改写和按提供方合并刷新”的暂缓判断，因为新证据已经出现。

Update：
- Atlas EVA 插件页新增 2026-10-21 节；
- Atlas context-key-manager 页新增 P2-E 节；
- FW-024、FW-026 追加进展；
- 分析报告 `results/context-key-bus-management-20261012/naw-freeze-analysis-20261021.md`。

Bayesian：
- EVA 节为 contradicts（推翻暂缓判断）；
- P2-E 为 refines（细化统一管理路线）。

Trace：
- prior_read：Atlas EVA 页 2026-09-29 两节、FW-023/024/026、update-protocol；
- 备份：`state/backups/atlas-framework-eva-p2e-20261021-042315`；
- 本轮没有修改 Skill 和插件代码。EVA 优化方案尚未实施，P1–P4 待用户选择后立项。

2026-10-21：FW-024 补记 eva-incremental-indexer 整写放大（代码证据，未实测）与 PEO-TV1 预审 BLOCK；无规则或归属变更。
2026-10-21：新建 Atlas 插件页 eva-incremental-indexer（补缺）；PEO 页记 PEO-TV1 归因与实现；FW-024 补原生归因与 IDX-W1。无规则、Skill 或归属变更。

2026-10-21：新增 FW-027（推送式刷新/修订号总线 SYNC-BUS），记录起因证据与风险；排期只在活动 PLAN。无规则或 Skill 变更。

## 2026-10-22 S2-A1a 仓库候选推进

Observation：Collection/Workspace同步键列表和render内async刷新仍回到旧PEO导航。Claim（refines，confirmed_by_code）：要消除查询触发计算，键目录与追踪状态须来自同批快照；unknown不授予active或写资格，静默续租不能只信任旧timer。A1a同批12字段目录+纯frame完成并独立代码终审PASS；真实消费者接线未做。87项+6变异及前批回归通过，日常/实验22唯一源码未变；无部署。PLAN、审计/续跑/STATUS、PEO/MapReduce、FW-027/BUS-U02已同步；运行API registry不提升。下一门按PLAN冻结真实Collection UI/history/lifecycle接线。证据：s2-a1/DELIVERY.md、FINAL.md；工程记录20261022-sync-bus-s2-a1a-directory.md。


## 2026-10-22 S2-A1b Collection 候选证据

- observation：Collection实际view的同步键目录/逐标签读取及渲染内refreshSoon会走旧导航；本批将其接入A1a同批快照并与生命周期需求调度分开。
- claim / source status：仓库源码候选与方法级模拟DOM/时钟测试支持“该view每同步render一份快照，旧查询计数0”；未部署，不是原生性能结论，也未提升运行协议登记。
- update target / Bayesian label：**refines FW-027 / BUS-U02**。查询纯读还须配合unknown保留画面、输入保留、加载隔离和跨await跳转复核；“不清DOM”同时要求保存期间禁用原输入控件。弹窗关闭早于其调用方业务完成，不能据此自动换源。
- trace：`results/context-key-bus-management-20261012/sync-bus-r/s2-a1b/PREFLIGHT.md`、`main.diff`、`test-results.json`、`verifier-final-extra.cjs`；本批独立终审PASS，见同目录 `FINAL.md`；仍仅仓库候选。唯一执行次序以 `state/PLAN.md` 为准。
- 未关闭：Workspace/GTD/九宫格/State Capsules真实接线；全owner内容版本/漏事件；原生输入、滚动、历史跨插件跳转及创建首次/恢复耗时。30秒lease fallback仍可能构建完整导航，底层flight不支持取消；并非空闲零计算。

## 2026-10-24 r21候选证据同步与自动链待证

- observation：活动PLAN已至r21，Atlas/FW仍有A1a/b消费者未接线描述；用户要求同步并继续。
- prior：entry-index/update-protocol、FW-027、PEO页、有效主键canonical定义、工作流页及BUS-U01～03。
- claim/source status：confirmed_by_code仅限sealed r21候选及合成测试；普通目录并集不等于最终有效集或写权限，自动事件到UI与原生性能仍unknown。
- update target/label：refines/corrects PEO页、工作流页、BUS-U01/U02与FW-027；历史部署证据保留，State Capsules不再是新验收依赖。Framework只维护问题和入口，不复制产品细节/实时计划。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r22-auto-chain/；r21/COVERAGE与FINAL-INDEPENDENT是代码证据。无Skill新硬规则、研究卡或MemPalace mine；执行次序仍state/PLAN.md。

- r22证据补充：自动创建/恢复通知到四适配器在合成宿主通过，长期问题保持open；没有修改产品候选。具体事实见Atlas PEO/工作流的r22补充，当前安排回到PLAN，不在Framework复制阶段计划。

## 2026-10-24 r23停止历史证据修订

- observation：两域实际创建后的配置补充键停止后，目录缺项但停止标签为空；实际Collection条目仍可见，历史拒绝。
- claim/source status：confirmed_by_code仅限当前候选合成方法链；非原生事故或性能结论。
- prior/update target/Bayesian label：refines r22列表适配器证据边界；Atlas PEO及操作上下文工作流登记反例，FW-027仍open，不另立规则或重复计划。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r23-view-content/COVERAGE.md、FINAL-INDEPENDENT.md；产品未修改，下一任务只看PLAN。无研究卡或mine。

## 2026-10-24 r24配置域停止发布证据

- observation：r23两域反例经版本化当前owner见证补齐后，同一内容历史入口通过。
- claim/source status：confirmed_by_code仅仓库候选/合成方法链，非原生性能或全库唯一性。
- prior/target/Bayesian label：refines Atlas PEO及操作上下文工作流的停止可见性契约与配对版本要求；FW-027仍open，排期只看PLAN。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r24-stopped-publication/COVERAGE.md、FINAL-INDEPENDENT.md与候选hash。无研究卡/mine，不复制阶段计划或扩大规则。

## 2026-10-24 r25声明资格与追踪区分

- observation：两域既存legacy声明撤销/恢复经实际owner自动更新目录；托管创建清空声明拒绝，内容/输入保留。
- claim/source status：confirmed_by_code，仅合成方法链；一般资格撤销不等于停追。
- prior/target/Bayesian label：refines Atlas PEO及操作上下文工作流；FW-027原生/性能仍open，不改变既有资格权威。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r25-owner-changes/COVERAGE.md、owner-change-results.json、FINAL-INDEPENDENT.md。无产品变化，不复制阶段排期，不mine。

## 2026-10-24 r26命名事务与消费者证据

- observation：真实管理中心改名及中断恢复保持身份/绑定，四目录自动更新；Collection内容定位限定通过。
- claim/source status：confirmed_by_code，合成宿主；GTD提取回调与宿主服务不等于完整engine。
- prior/target/Bayesian label：refines Atlas PEO和操作上下文工作流；FW-027原生/性能未知不关闭，不新增架构或排期副本。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r26-center-rename/COVERAGE.md、rename-results.json、FINAL-INDEPENDENT.md。无产品/真实库变化，无mine。

## 2026-10-24 r27实验发布与回退

r27：实验库七程序成组部署完成、113程序磁盘哈希对齐；原生加载/功能/性能仍待验。锁定r24六覆盖+r1其余，共113程序，实际替换项七个，其余106依赖仅核验；本次实验程序前像单独备份，非TV1/S15A旧备份。16项隔离安装/回退/中断/漂移拒绝演练通过，93脚本语法检查通过；独立终审见同目录FINAL-INDEPENDENT.md，不累加为原生性能证据。日常NEWERA程序保持原样，业务JSON/笔记/身份/任务/布局不在部署写集。State Capsules排除、S1.5暂缓。

下一步：实验库冷启动确认basePath与加载能力，按NATIVE-ACCEPTANCE.md验收两域创建/恢复、改名重开、停追历史、输入与各插件二级内容定位，并记录首次创建/恢复的分段耗时。

证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r27-experiment-package/README.md、release-manifest.json；唯一排期state/PLAN.md。

维护判定：updated（仅工程阶段来源链接）；无新ownership、架构或性能claim，不在长期层维护第二套排期。历史阶段快照不被当作实时状态。


## 2026-10-24 r28原生续期误判（当前进度）

observation：用户实验库多个页面待核验，原生窗口捕获同语义续期；claim：语义修订与凭证时间分开，公开截止和guard实际截止一致；source_status：confirmed_by_code，原生修复效果pending。prior：普通目录来源lease；update_type：corrects/refines；target：Atlas PEO页。FW-027原生/性能保持open；不新增排期副本。

证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r28-native-startup/RENEWAL-FINAL-INDEPENDENT.md、EVIDENCE-CORRECTION.md、native-trace-1792843282367-83d73a5a.json、release-manifest.json。9定向、15回归、4变异及独立6边界通过；16安装/回退演练通过，均不等于原生性能证据。



## 2026-10-24 r29项目来源兼容与启动验收（当前有效）

observation：重开后项目查询失败、持续待核验；claim：默认配置短名与canonical来源是两层，分支兼容需保留解析及映射当前性；source_status：confirmed_by_code，native_effect pending；prior：Workspace来源lease；update_type：corrects/refines；target：Atlas Workspace页。FW-027原生响应仍open，不把待核验强行改为ready。

证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r29-project-startup/FINAL-CODE.md、FINAL-INDEPENDENT.md、full-chain-results.json、source-tests.json、mutant-results.json、NATIVE-OBSERVATION.md、release-manifest.json。17定向、3查询形式、4变异及独立5边界；单写引擎6项实际演练，未累加历史测试。短名初次Workspace请求6次元数据枚举、2raw/1stat；完整Mandala双观察共6次枚举、6raw/4stat，0写入/激活；不是零扫描，不据此声称启动更快。



## 2026-10-24 r30 FW-027 续期机制更新

- prior_read：Atlas PEO页r28/r29节、unknowns BUS-U01～03、FW-027、r28 NATIVE-OBSERVATION。
- observation：用户报告r29后周期待核验与冷启动慢；SuperMemo实验库只读。
- claim/status：目录周期失效机制（confirmed_by_code）；SuperMemo共享localStorage（confirmed_by_code+confirmed_by_user）。
- update：FW-027 corrects/refines；Atlas PEO/Collection/Workspace/GTD/Mandala/SuperMemo页；unknowns新增BUS-U04、SM-U01。question_map_effect：FW-027补充，不新增FW。skill_or_rule_effect：暂不改Skill；若原生证实，可考虑把"凭证约束的发布须到期前续期+消费者自愈"提为性能可观测规范示例。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r30-directory-renewal/；工程记录change-records/2026/2026-10/20261024-r30-directory-renewal.md。


## 2026-10-25 r31 FW-027 分阶段守卫 + console-bridge 原生采样方法

- prior_read：Atlas PEO r28–r30 节、FW-027、BUS-U01～04。
- observation：用户原生反馈冷启动慢、周期待核验；用户提出"输入一段指令、等一会自动去看"的 Console 协作方式。
- claim/status：长导航构建必然作废的机制（confirmed_by_code + 原生采样）。方法层：console-bridge（固定一行命令执行受审 task.js，结果写回仓库 out/，代理监视并自动读取）在本用户宿主测试偏好下有效（confirmed_by_user，多轮使用）。
- update：FW-027 corrects；Atlas PEO 页、unknowns BUS-U05；工程记录 change-records/2026/2026-10/20261025-r31-nav-phase-guard.md。skill_or_rule_effect：deferred——候选把 console-bridge 写入 Skill 的 Console 记录优先协作说明（需 Skill 修改流程：备份+verifier）；下次触发：用户确认长期采用。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r31-nav-phase-guard/；results/context-key-bus-management-20261012/console-bridge/。


## 2026-10-25 r32 FW-027 读取期检查与上游瞬时状态

- prior_read：Atlas PEO/GTD/EVA 页、FW-027、r31 原生采样。
- observation：GTD 横幅常驻、Tab 点击无反应（confirmed_by_user）。
- claim/status：上游 EVA 适配器刷新同步置 pending，PEO 读取期检查要求 ready → 消费者循环待核验（confirmed_by_code）。
- update：FW-027 corrects；Atlas PEO/GTD/EVA 页与 log；工程记录 change-records/2026/2026-10/20261025-r32-health-pending.md。question_map_effect：FW-027 补充。skill_or_rule_effect：deferred——候选通用规则"读取期一致性检查只比较版本戳，不把同版本的瞬时状态当变化；构建/写入门另行要求就绪"，待原生确认后经 Skill 修改流程评估。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r32-health-pending/。

## 2026-10-25 console-bridge 写入 dev skill（r31 deferred → applied）

- observation：用户确认"Console 固定命令 + 自动读取结果"以后都这样配合（confirmed_by_user）。
- update：全局 Skill SKILL.md §2.4.1 与 console-ops-runbook §5/§5.1；独立核查 PASS（R1）。工程记录 change-records/2026/2026-10/20261025-skill-console-bridge.md。
- trace：results/context-key-bus-management-20261012/console-bridge/SKILL-UPDATE-VERIFY.md。


## 2026-10-25 r33 FW-027 + 工具缺陷登记

- prior_read：Atlas PEO/GTD 页、FW-027、BUS-U05、ACC-1/2/2c/3 原生采样。
- observation：新建主键卡（confirmed_by_user）；构建工具换行缺陷（自查发现）。
- update：FW-027 corrects；Atlas PEO/GTD 页、unknowns BUS-U05 分段数据；工程记录 change-records/2026/2026-10/20261025-r33-creation-storm.md。skill_or_rule_effect：deferred——候选在 dev skill 发布门禁中加入"构建/同步脚本必须按字节读写并核对换行/原始字节差异，差异须基于原始字节生成"，待用户确认后走 Skill 修改流程。
- trace：results/context-key-bus-management-20261012/sync-bus-r/integration-r33-creation-storm/；results/context-key-bus-management-20261012/console-bridge/out/acc4-1792939351695.json。


## 2026-10-25 Skill 换行门禁写入（r33 deferred → applied）

- update：全局 Skill SKILL.md §2.6 第 9 条、release-guardrails §6 第 4–8 条；独立核查 R1 PASS。工程记录 change-records/2026/2026-10/20261025-skill-eol-gate.md。
- deferred：§6 第 6 条措辞与 Hard No 新增项，待下次 Skill 修改一并核查。

## 2026-10-25 r34 写入后需求窗口

- update：PEO 页、unknowns BUS-U05 补充、工程记录 20261025-r34-post-write-demand.md；更正 r33 记录 PEO 哈希。console-bridge 首次拿到 refresh/失效来源/子码级诊断，验证该测试方式价值（已在 Skill）。

## 2026-10-25 r35 外部跳转

- update：PEO 页、unknowns BUS-U05/SM-U01、工程记录 20261025-r35-nav-external-reads.md。经验：聚合器逐条调用只读 provider 时检查 provider 是否每次整读整解析。


## 2026-10-26 Antinet 自动抽屉文档收尾

observation: 用户要求补齐已部署自动抽屉功能的Atlas与Framework说明（confirmed_by_user）。
prior_read: entry-index、update-protocol、question-map FW-004、registry、Atlas README/contracts/两插件页/unknowns SM-U01、10-22经验卡及部署/独审/测试记录。
update_type: refines / supersedes；source_status: confirmed_by_code（部署候选与接口），confirmed_by_memory（部署记录）。

补齐[SuperMemo功能与持久归属](../atlas/plugins/supermemo-concept-display.md)、[Keyword提供方](../atlas/plugins/keyword-index-plugin.md)、[跨插件契约](../atlas/contracts.md#antinet-drawer-projection-v1)；将已有经验卡与交付说明中的runtime pending更正为10-22已部署、原生验收pending。Framework保留入口、决策与证据链，接口正文由Atlas维护。

trace: results/antinet-drawer-projection/{deployment.json,CODE-REVIEW.md,verification.json,docs-review.md}；文档备份见同目录docs-backup-path.txt，变更记录见docs-change-record-path.txt。
question_map_effect: FW-004既有更新协议的一次应用，无新增长期问题；SM-U01 deferred_by_user不变，10-24/25跨库共享风险和r35迁移约束保留。registry已有Atlas入口足以定位，无需新增入口。skill_or_rule_effect: no_model_change，未修改Skill或规则。
remaining_unknowns: 尚无完整原生交互验收；10-24读取schema2不替代该验收。未重新部署、未读取或修改业务数据；不把10-22哈希证据当作10-26全库同步证据。

## 2026-10-26 D1 日常库迁移

- update：工程记录 20261026-d1-daily-migration.md、PEO 页、keyword-index 页（日常独有适配）、unknowns（开发源镜像围栏）。经验：实际运行库迁移前的副本彩排 + 绑定哈希的用户确认。

## 2026-10-26 大千统一内核路线作废

- update：用户确认大千"把所有数据汇集一起"的统一内核路线为废案（扩展性、实施难度、后续更新成本不如 r36 路线）。Atlas unified-core-transition 标 abandoned 并加横幅；index/system-map 标注；DQ-U01..03 closed_abandoned；FW-025 abandoned；entry-index/registry 标注。大千实验版整库备份 state/backups/daqian-abandoned-archive-20261026-113335。工程记录 change-records/2026/2026-10/20261026-daqian-route-abandoned.md。
