# Atlas Index

status: active
created: 2026-06-24

This file is the reading navigation for Atlas pages. It is different from `framework/registry.md`: registry tracks durable entrances and provenance; this index helps an agent decide what to read.

## Start

- `README.md` - Atlas entry and status vocabulary.
- `purpose.md` - why the Atlas exists and what it is for.
- `schema.md` - page types, maintenance rules, and terminology rules.
- `log.md` - Atlas maintenance events.

## System Overview

- `00-system-map.md` - macro layers, ownership principles, shared entity concepts.
- `contracts.md` - cross-plugin contracts and data ownership.
- `api-registry.md` - cross-plugin API inventory, provider/consumer direction, read/write boundary, status, and evidence.
- `unknowns-register.md` - open questions and cognition gaps.

## Plugins

- [主键管理中心 context-key-manager](plugins/context-key-manager.md) - 身份/名称/绑定关系的唯一权威（C1–C3 已部署；v6 显式升级；Collection 首次替换），内容数据仍归各 owner。
- [Mermaid Floating Widget](plugins/mermaid-floating-widget.md) - address/state-transition semantics, current index/render ownership and bounded performance audit; no new optimization deployed.

- [Daily Note Review](plugins/daily-note-review.md) - separate created/modified days, retained private edit history, source-labelled latest-mtime backfill and identity-checked navigation; runtime deployment pending.
- [View Group Hub](plugins/view-group-hub.md) - native leaf grouping, eight members with Daily below Ontology; preserves environment-only ownership.
- [ATOM 侧栏导航](plugins/atom-note-sidebar.md) - complete read-only ATOM address index, virtual right sidebar and main-note reveal; deployed with loaded-host smoke pending.
- `plugins/supermemo-concept-display.md` - Concept capsule management plus an independent whole-subject structure tree and single Concept assignment.
- `plugins/temporal-framework.md` - strategic Time x Outcome planning, stage gates, coverage and manual completion paint.
- `plugins/personal-fund-ledger.md` - append-only fund transaction ledger, reversal audit workflow, and draft-protected correction modal.
- `plugins/ontology-meta-hub.md` - read-only cross-owner Ontology discovery, grouping and exact source navigation.
- `plugins/project-execution-overview.md` - managed primary-key groups and source-owned evidence projection.
- `plugins/state-capsules.md` - environment-state capture and cross-plugin restore orchestration.
- `plugins/gtd-task-manager.md` - GTD-owned projects, tags, next actions, and context-key navigation.
- [下一步行动台 NAW](plugins/next-action-workbench.md) - 幕后行动元数据服务（别名/完成/标签/行动结构/行动台名称）；日常界面是 Collection 行动视图。
- `plugins/mandala-time-blocks.md`
- `plugins/timeline-planner.md` - Timeline-owned items, day slots, wave order, milestones, and bounded read-only projections.
- `plugins/workspace-mount.md`
- `plugins/keyword-index-plugin.md` - symbolic intake/editing network, drawer/BUS/SCON behavior, and the Symbol Dialogue current-attention projection.
- `plugins/eva-cross-view-relations.md`
- `plugins/eva-incremental-indexer.md` - ATOM 派生索引生产者（EVA_Notes/Links/Indexes/State）、写入链与 IDX-W1 合并写入计划；与 eva-cross-view-relations 无关。
- `plugins/collection-card-view.md`
- [Reference Graph Widget](plugins/reference-graph-widget.md) - annotated collective projection, address groups and reusable geometry cache.

## Workflows

- [对话绘图](workflows/dialogue-graph-drawing.md) - original groups, directed relations, frozen drawings, route clearance and Skill activation.

- `workflows/project-coaching.md` - AI project coaching evidence packet.
- `workflows/planning-record-execute-review.md` - primary-key connected weekly record, vertical management, Timeline allocation, evidence projection, and daily-practice loop.
- `workflows/keyword-antinet-bus.md` - keyword, BUS, subconcept workflow.

## Knowledge Foundations

- [统一主键管理与宿体](knowledge/unified-context-key-management.md) — 已部署项目管理入口、永久身份原型与独立宿体建议的证据边界；关联FW-026、CKM-U01～03。

典型跨插件开发与性能验收入口：[从有效操作上下文主键到下一步行动](workflows/operational-context-to-next-action.md)。包含双域 owner 协作、提交与投影完成的区别，以及未来新插件观测规范路由；真实宿主整体性能基线待采集。

- `knowledge/mermaid-address-semantics.md` - Mermaid numbering, `+`, `.`, subgraph, relation layers, and graph-reading boundaries.
- `knowledge/keyword-symbolic-interface.md` - keyword as symbolic communication port, note as signal carrier, Antinet/ATOM address space, and the full-network/current-attention distinction.
- `knowledge/context-capsule-key.md` - operation-level shared identity key across Project Overview, Workspace Mount, Mandala, GTD, and future consumers.
- `knowledge/effective-operational-context-key.md` - separate project-domain and goal-domain current eligibility: projects derive from a Workspace carrier; goals derive from an exact Mandala owner plus one forward GTD top-level carrier; both require a Project Overview declaration and Mandala non-stopped tracking; legacy Kill is diagnostics only.
- `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md` - cross-plugin aggregation performance, shard/reduce boundaries, fair limits, diagnostics, and no-full-scan guardrails.
- `knowledge/llm-wiki-operating-model.md` - durable files as cognitive hardware, Skill as activation signal, and maintenance/query tooling as the operating loop.
- `knowledge/generative-context-reconstruction.md` - active blank-paper task reconstruction, artifact-centered working memory, query-driven historical hydration, and the artifact-production/evidence-audit mode split.
- `knowledge/recent-maintenance-sentinels.md` - recent reusable guardrails for UI readability, interactive scale, date-aware lifecycle, primary-key visual identity, read-only evidence projection, and runtime canonical discipline.

## Terms

- `glossary.md` - canonical high-risk system terms.
- `aliases.md` - aliases, historical names, and forbidden conflations.

## Reading Patterns

For project coaching:

1. `glossary.md` and `aliases.md` for terms.
2. `workflows/project-coaching.md`.
3. Relevant plugin pages.
4. `knowledge/keyword-symbolic-interface.md` if keyword entry, BUS, SCON, or note-branch traversal matters.
5. `knowledge/context-capsule-key.md` if operation-level shared capsule keys, virtual waiting capsules, or cross-plugin task context identity matters.
6. `knowledge/effective-operational-context-key.md` if current project/goal eligibility, split Ontology effective-family counts, Mandala planning, Timeline allocation, Temporal import or Next Action candidate refresh matters.
7. `knowledge/mermaid-address-semantics.md` if note network or graph address semantics matter.
8. `knowledge/cross-plugin-aggregation-mapreduce-pipeline.md` if Project Overview, AI context export, provider snapshots, shard pipelines, or performance / completeness tradeoffs matter.
9. `knowledge/generative-context-reconstruction.md` when the question is how to restart work, reduce context-preload cost, keep a real artifact central, or decide whether system evidence should lead or follow.

For plugin development:

1. `00-system-map.md`.
2. `contracts.md`.
3. `api-registry.md` if the task involves API calls, owner APIs, read-only snapshots, jump/reveal, adapters, or internal shard pipelines.
4. Relevant plugin page.
5. Relevant workflow or knowledge page.
6. `unknowns-register.md` for unresolved risks.

- [EVA 分支树：独立右侧栏、真实树线与当前 Mermaid 定位](plugins/eva-branch-sidebar.md)


- [系统演进史：从工作流规则到主键管理中心（2026-06 — 2026-10）](knowledge/system-evolution.md) — 按阶段串联关键决定与转折，链接记录卡、Atlas 日志与 PLAN；工程改动全表见 `../change-records-index.md`（`python scripts/change_records_index.py` 生成）。
- **（废案 2026-10-26）** [大千统一内核：现状、已审设计与分批移交](knowledge/unified-core-transition.md) — 原视图接线、功能等价优化和性能证据边界；FW-024/025。唯一当前计划仍在活动state，仓库验证不等于整链/真实host/部署。
