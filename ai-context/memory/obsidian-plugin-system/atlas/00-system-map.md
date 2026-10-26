# Obsidian Plugin System Map

status: draft_mvp
updated: 2026-08-15

## System Thesis

status: inferred

The system is not a set of isolated plugins. It is a layered second-brain operating environment:

1. Keyword and Antinet layers provide symbolic entrances and topology.
2. Workspace and notes carry project materials, facts, and work environment.
3. Mandala carries planning, tracking, daily lessons, and weekly review content.
4. EVA relations carry cross-view relation identity and jump routing.
5. Project Overview aggregates evidence into an execution dashboard and AI context packet.
6. Collection/GTD layers generate or hold downstream action prompts.
7. Next Action Workbench projects the currently observed action frontier and gives each imported action an owner-local space for progressive decomposition.
8. MemPalace preserves engineering memory, reusable experience, and this atlas.
9. SuperMemo Concept Display separates card-oriented Concept hierarchy from the whole-subject structure used to understand where each Concept belongs.

The practical goal is shared cognition: the user should not need to re-explain the system every time, and Codex should not need to scan unrelated JSON to understand a project.

## Main Roles

| Layer | Main Plugin Or System | Role | Status |
| --- | --- | --- | --- |
| Symbol entrance | keyword-index-plugin | Keyword capsules, drawers, BUS, subconcept, keyword-note links | confirmed_by_memory |
| Ontology keyword entrance | keyword-index-plugin sidecar + ontology-meta-hub | `okw-` keyword capsules, Ontology target navigation and per-owner tag management | repository_dev_verified_runtime_pending |
| Topology | antinet-tree-structure / ATOM notes | Whole-library keyword/topology order and note address space | confirmed_by_memory |
| Symbolic interface | Keyword + Antinet/ATOM notes | User-system communication port: keyword as symbol, note entries as signal carriers, numbered tree as address space | confirmed_by_user |
| Mermaid address semantics | Mermaid subgraphs / reference-graph-widget / ATOM notes | Address grammar, `+` state transitions, `.` child depth, subgraph containers, and relation-layer separation | confirmed_by_user |
| Goal and project planning | mandala-time-blocks | Daily lessons, weekly goal tracking, workspace weekly tracking, project plan panels | confirmed_by_memory |
| Strategic time architecture | temporal-framework | Year/quarter/month/week TimeBox planning, stage-outcome decomposition, typed dependencies, placement, coverage, manual completion paint and explicitly selected boolean effectiveness | runtime_synced_static_and_loaded_ui_verified |
| Project material carrier | workspace-mount | Workspace/project tabs, bound notes, paradigm/material containers | confirmed_by_memory |
| Relation and jump layer | eva-cross-view-relations | Cross-plugin relation index, nodeKey identity, openNode routing | confirmed_by_memory |
| Execution aggregate | project-execution-overview | Grouped project evidence, seven-column overview, project order snapshots, AI context export | confirmed_by_memory |
| Action prompts | GTD / collection-card-view | Heuristic next actions and downstream derived to-dos | confirmed_by_memory |
| Action frontier | next-action-workbench | Imports active-primary Collection Card actions, preserves source membership, hosts independent per-action Ontology decomposition, and returns to the exact source row | confirmed_by_code |
| Engineering memory | MemPalace and memory/obsidian-plugin-system | Experience cards, change records, reports, atlas | confirmed_by_code |
| SuperMemo subject architecture | supermemo-concept-display | Keeps Concept capsules and an independent recursive subject structure in one plugin, joined by one stable assignment per Concept | repository_dev_verified_runtime_pending |

## Ownership Principle

status: confirmed_by_memory

Content state belongs to the source plugin. Aggregators may project, sort, jump, and export, but should not become second owners of another plugin's JSON.

Examples:

- Mandala owns weekly tracking rows and project plan content.
- Keyword Index owns `keyword_index.json` keyword records.
- Workspace Mount owns workspace tab/item structures and bound note semantics.
- EVA owns relations and cross-view node identity.
- Project Overview owns comments, grouping/projection state, and evidence export; it should consume source APIs rather than directly writing source data.
- Next Action Workbench owns only its imported-membership projection, recovery drafts and per-source-card local Ontology. Collection Card remains owner of source action content, Project Overview remains owner of grouping/reveal behavior, and the Workbench does not register its local Ontologies with Ontology Meta Hub.

## Shared Entity Concepts

| Concept | Meaning | Source Of Truth | Status |
| --- | --- | --- | --- |
| Managed primary key | Stable identity for a goal or project as a managed object across weekly tracking, upper-level planning, Timeline allocation, historical review, and evidence projection; it is neither a task row nor a note | Owning goal/project plugin identity plus user practice | confirmed_by_user |
| Keyword | Entrance symbol into Antinet/knowledge structure | keyword-index-plugin / keyword_index.json | confirmed_by_memory |
| Keyword symbolic interface | Keyword as the user's communication port into the whole library; note entries below it are signal carriers in the numbered address space | Atlas knowledge chapter / user practice | confirmed_by_user |
| Drawer | Keyword sub-area or scoped container | keyword-index-plugin | confirmed_by_memory |
| BUS | Sequential note growth pattern under keyword/drawer context | keyword-index-plugin | confirmed_by_memory |
| Subconcept | `+SCON.` child concept under drawer folders | keyword-index-plugin | confirmed_by_user |
| Mandala node | Goal/design anchor in nine-grid/goal tree | mandala-time-blocks | confirmed_by_memory |
| Workspace primary | Project/execution anchor derived from workspace/project overview grouping | project-execution-overview / workspace-mount context | confirmed_by_memory |
| Ordinary note | Markdown note relation item, often investigation fact or material | EVA note adapter / vault | confirmed_by_memory |
| Paradigm accumulation | Column for ordinary notes, investigation facts, and work environment evidence | project-execution-overview | confirmed_by_user |
| Project plan | Upper-level project design fields, not weekly rows | mandala-time-blocks | confirmed_by_user |
| Weekly tracking | Week-grained rows for target/project continuity | mandala-time-blocks | confirmed_by_memory |
| Observed action frontier | Current active-primary Collection Card actions visible through bounded provider evidence; it is not a proof that every possible next action has been captured | next-action-workbench projection over owner APIs | confirmed_by_user_and_code |
| Mermaid address | Visual-symbolic address layer where `ATOM@...`, `+`, `.`, and `subgraph` encode lineage, state transition, and containment | Atlas knowledge chapter / prior experience cards | confirmed_by_user |
| Strategic outcome | A verifiable future result owned by Temporal Framework and associated with one imported managed primary-key identity; it is not a task, Timeline item, milestone or primary key | temporal-framework append-only event store | confirmed_by_code |
| TimeBox | A derived calendar interval at year, quarter, month or week scale; it is a projection and never owns outcomes | temporal-framework calendar policy | confirmed_by_code |
| Subject structure node | A stable SuperMemo whole-framework location independent from Concept objects; it may contain child structure nodes and project assigned Concepts | supermemo-concept-display Tree owner | confirmed_by_user_and_code |

## Managed-Object And Evidence Layers

status: confirmed_by_user

A goal or project primary key names the object being managed. The records around it remain separated by function:

- weekly tracking preserves a week-bounded observation, plan, execution, judgment, and handoff;
- project execution plan / 项目纵向管理 preserves the object's upper-level direction and current whole-state understanding;
- Timeline allocates future time and attention and records planned milestones;
- Temporal Framework designs the larger future outcome architecture across year/quarter/month/week without taking over Timeline day slots or milestones;
- Project Overview projects source-owned actions, materials, facts, and experience around the same managed object;
- Antinet notes and source-plugin records remain concrete evidence carriers under their respective owners.

Stable identity connects these interfaces without making the primary key, Timeline, or Project Overview a second owner of the underlying records.

Source: `output/reports/项目与目标如何记录和安排-表达梳理稿.md`.

## Lifecycle Visibility Principle

status: confirmed_by_user

Exiting a managed primary key is a projection change, not silent erasure. A stopped or killed object should leave forward-looking active views while retaining stable identity, captured history, and a bounded route back to the record.

Persisted inactive data becomes ghost data when it still occupies storage but no ordinary interface or documented owner API can find it, explain why it exited, or reconnect it to historical evidence. The minimum lifecycle outcome is therefore:

1. absent from the normal active projection;
2. present in an explicit killed/stopped/history projection;
3. labelled with owner, lifecycle state, and stop/kill evidence where captured;
4. connected by stable identity to old weekly slices and retained source evidence;
5. reversible when the owning lifecycle supports revive/resume.

Current implementation provides Project Overview Kill Mode, Mandala historical weeks/closeout state, and Timeline's non-destructive stopped projection. A unified cross-plugin retired-primary-key archive is not yet a confirmed system capability.

## Runtime Boundary

status: confirmed_by_memory

When editing running Obsidian plugins, the proven actual runtime has previously been:

`D:\han\最新的\NEWERA2024年4月17日\NEWERA\.obsidian\plugins`

Runtime/dev/mirror alignment is required for plugin code edits. This atlas task does not edit runtime plugins.

## Current MVP Boundary

status: confirmed_by_user

This first atlas version only writes current repository memory documents under:

`memory/obsidian-plugin-system/atlas/`

It does not modify:

- Obsidian runtime plugin code;
- `main.js`, `styles.css`, or `manifest.json`;
- business JSON;
- rules or skills.


## 2026-10-07 大千统一内核过渡（原 owner 尚未移交）

> 废案（2026-10-26，confirmed_by_user）：该路线已放弃，以下仅作历史；当前路线见有效操作上下文主键 BUS（r36）。

source_status: confirmed_by_user / confirmed_by_memory; target_behavior: inferred; update_type: refines / reinforces

用户要求共同业务数据、原视图/功能保留、固定 ID 及可改/重复编号。P4-A 接管/身份/存储方案已独立核查，但实际原 owner 未因此改变；未迁域仍属原 owner，NAW 不代表 GTD，结构编辑器不代表全部 Workspace。原生可写数据统一另按 P4-E 验收。详见[统一内核过渡](knowledge/unified-core-transition.md)，那里分列代码快照、仓库验证、设计及 unknown。既有本页历史 runtime/部署条目不是本项目 NEWERA 访问/写入授权。
