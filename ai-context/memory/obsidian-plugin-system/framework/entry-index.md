# Framework Entry Index

status: active_entry
updated: 2026-06-24

## Start Here

For any task involving the Obsidian plugin system macro framework, use this order:

1. Read this file.
2. Read `purpose.md` and `schema.md` if the task may change the framework itself or its boundary with Atlas.
3. If the user says "用框架落一下" or gives new plugin experience/design evidence, read `update-protocol.md`.
4. Read `question-map.md` for active long-term questions.
5. Read `registry.md` to find durable entrances and source provenance.
6. Read `index.md` when you need a compact framework reading route.
7. Read `../atlas/README.md`, `../atlas/index.md`, and the specific Atlas file needed.
8. If specialized system terms are involved, read `../atlas/glossary.md` and `../atlas/aliases.md` before interpreting or translating them.
9. Trigger `skills/obsidian-system-plugin-dev/SKILL.md` for implementation, debugging, runtime sync, AI context export, or cross-plugin contract work.

Framework is the control-plane wiki: it decides how to enter, update, and guard the system. Atlas is the knowledge-plane wiki: it carries concept facts, plugin roles, workflows, contracts, terminology, and synthesized claims. Do not copy Atlas facts into framework pages.

## First-Stage Framework Report

- Report: `output/reports/obsidian_plugin_system_framework.md`
- Outline: `state/ANALYSIS_OUTLINE.md`
- Source task: `OBSIDIAN-PLUGIN-SYSTEM-FRAMEWORK-2026-06-24`

The report is a readable first-stage explanation. It is not higher priority than `prompts/rules/*` or `obsidian-system-plugin-dev`.

## Long-Term Rule

Do not rely on the current `state/` project worksite as the only framework entrance. `state/cards` OPS cards are origin artifacts. This directory is the persistent index.

## Core Reading Paths

- Framework purpose: `memory/obsidian-plugin-system/framework/purpose.md`
- Framework schema: `memory/obsidian-plugin-system/framework/schema.md`
- Framework index: `memory/obsidian-plugin-system/framework/index.md`
- Framework registry: `memory/obsidian-plugin-system/framework/registry.md`
- Framework long-term questions: `memory/obsidian-plugin-system/framework/question-map.md`
- Framework update protocol: `memory/obsidian-plugin-system/framework/update-protocol.md`
- Framework maintenance log: `memory/obsidian-plugin-system/framework/maintenance-log.md`
- Atlas entry: `memory/obsidian-plugin-system/atlas/README.md`
- Atlas purpose: `memory/obsidian-plugin-system/atlas/purpose.md`
- Atlas schema: `memory/obsidian-plugin-system/atlas/schema.md`
- Atlas index: `memory/obsidian-plugin-system/atlas/index.md`
- Atlas terminology: `memory/obsidian-plugin-system/atlas/glossary.md`
- Atlas aliases: `memory/obsidian-plugin-system/atlas/aliases.md`
- System map: `memory/obsidian-plugin-system/atlas/00-system-map.md`
- Contracts: `memory/obsidian-plugin-system/atlas/contracts.md`
- Unknowns: `memory/obsidian-plugin-system/atlas/unknowns-register.md`

## Practical Use

- For conversational drawings of existing system graphs: use `skills/dialogue-graph-drawing/SKILL.md` and `../atlas/workflows/dialogue-graph-drawing.md`; apply this framework's update protocol to preserve reusable drawing experience. The repository Skill source was installed globally on 2026-09-23; source maintenance and installation status remain distinct.

- For project coaching: start with Project Overview AI context export, then Workspace / Mandala / EVA evidence, then ordinary notes, then MemPalace / Atlas / change-records.
- For plugin design: classify the layer, identify owner/provider/consumer/contract, then apply runtime/dev/mirror guardrails.
- For framework landing: use `update-protocol.md` to convert observation into claim, mark source status, update Atlas / Question Map / cards, and leave trace.
- For framework maintenance: update this directory first, then Atlas or experience cards if the framework meaning changed.
- For terminology-sensitive work: preserve canonical terms from `atlas/glossary.md` and resolve aliases through `atlas/aliases.md`; do not rely on loose paraphrase.


## 复杂插件项目的当前计划入口

系统知识与长期约束从 Framework/Atlas 进入；选新子批前按 `skills/obsidian-system-plugin-dev/SKILL.md` 0.4 确认 `project_workspaces/active-project.json`，读取对应活动 `state/PLAN.md` 当前有效部分和 `state/MATERIAL_AUDIT.md`，核对整体覆盖、阻塞与优先级，再执行子批。PLAN 是该活动项目唯一任务计划，MATERIAL_AUDIT 提供证据与问题依据，STATUS 及长期阶段摘要是投影；历史 sealed checkpoint 按 Project Workspace Manager 只读/续跑协议处理。Atlas/Framework 中的历史 next-action 可能滞后，不能取代当前计划；PLAN 的任务顺序权威不覆盖用户指令、事实证据或 Rules/Skill 硬门禁。实时计划只在活动项目维护，长期层只维护入口与规则。

## 2026-10-07 大千统一内核长期入口（废案 2026-10-26：路线已放弃，仅作历史；见 change-records/2026/2026-10/20261026-daqian-route-abandoned.md）

[统一内核过渡](../atlas/knowledge/unified-core-transition.md)：原视图/唯一owner原则、已实现优化与待验证假设、仓库验证/同候选整链/真实host边界。关联FW-024/025与DQ-U01..03；当前进度和优先级必须转到活动项目PLAN/MATERIAL_AUDIT，不从本入口历史阶段推断排期或部署授权。
