# Workflow: Project Coaching Evidence Packet

status: draft_mvp
updated: 2026-07-21

## Purpose

status: confirmed_by_user

The user wants Codex to act as an effectiveness coach by reading a project through the Obsidian system, not by forcing the user to manually explain every plugin context.

## Entry Mode Split

status: confirmed_by_user

Project coaching and task continuation do not share one universal default entrance.

### Artifact Production / Continuation

When the user is trying to resume and change a real artifact, begin with active reconstruction: the user writes the current problem, target artifact, current understanding and next concrete edit before reading system history. Project Overview, Workspace, Keyword and other historical surfaces are then queried by questions generated from that artifact.

Do not lead with a complete project-history explanation by default. It can turn task initiation into passive context ingestion and system meta-work.

### Evidence Audit / Diagnosis

When the explicit task is to diagnose project state, compare sources, identify stale evidence or prepare a coaching judgment, the bounded AI context export may be the first entry. The evidence packet still needs to produce a target diagnosis, decision, plan or other artifact.

See `../knowledge/generative-context-reconstruction.md`.

## Current Best Evidence-Audit Entry

status: confirmed_by_memory

Use Project Overview's current project group AI context export.

The packet should include:

- visible project group identity;
- Workspace execution anchor;
- Mandala goal/design anchor;
- keywords;
- ordinary notes and `范式积累`;
- GTD prompts;
- Collection Card derived to-dos;
- Timeline evidence;
- Mandala project plan and weekly tracking where available;
- diagnostics and truncation notices.

## Evidence Authority Model

status: confirmed_by_user

Project coaching must preserve the user's column semantics. The Project Overview / 项目纵深管理 board is a project interface, not a generic list of tasks. Each column has a different evidence authority:

- Workspace: project primary key and execution container.
- Project execution plan / 项目纵向管理: stable upper-level project interface for final vision, value orientation, current reality, next action, and milestone.
- Weekly tracking / 周追踪: same-key weekly continuity, linking `项目管理：按周汇总` and `项目执行计划`; strong evidence for current activity, but it may be incomplete if the user has not updated it.
- Keyword: symbolic entrance into the numbered Antinet tree and conceptual topology.
- `范式积累`: facts, investigation material, project environment evidence, historical process notes, and reusable knowledge assets.
- GTD: heuristic self-prompts about what may be worth doing.
- Collection Card: explicit next actions / concrete to-do items derived from the surrounding context.
- Timeline: chronological sequence and dated evidence.
- EVA relations: cross-plugin relation graph and duplicate-node clues; useful for discovery, not sole intent.

For current-state diagnosis, do not let historical notes override fresher project-plan or weekly-tracking evidence. Also do not treat weekly tracking as an absolute judge: when it is sparse, stale, or possibly under-entered, collect the other columns, state the conflict, and align with the user before finalizing the coaching conclusion.

## Coaching Alignment Loop

status: confirmed_by_user

The practical loop is:

1. Receive a target project key or an exported evidence packet, such as a markdown file under a `coach调试` folder.
2. Build a read-only evidence ledger by source column and recency.
3. Separate current-state evidence, fact/material evidence, heuristic prompts, explicit to-dos, and historical background.
4. Produce a tentative diagnosis, including confidence and stale/missing evidence warnings.
5. Ask the user to confirm or correct the main current-state claim before treating it as settled.

This loop prevents the AI coach from becoming a one-shot judge. The user and the evidence packet together form the final current-state reading.

## Note Network Traversal Budget

status: confirmed_by_user

The hardest part of project coaching is not merely finding one note. It is entering the user's numbered-note network from one note, understanding what the address means, reading the surrounding notes and linked notes, and stopping before the search becomes excessive.

Use a bounded traversal:

1. Decode the note's address as structure, not as a random id.
2. Read the parent / branch header / nearby sibling notes when they explain local context.
3. Follow explicit links, EVA relations, and keyword entrances only when they answer the coaching question.
4. Prefer high-signal neighbors over exhaustive graph walking.
5. Stop when the current-state claim, factual assets, and next-action options are sufficiently supported, or when new nodes repeat rather than change the diagnosis.

Reference context: the user's Antinet implementation follows the pattern that Index points to selective entrance nodes, Address carries tree position, Tree provides local lineage, and Link should remain meaningful rather than exhaustive. See `https://www.gcores.com/articles/202870`.

## Guardrails

status: confirmed_by_memory

- Export should be read-only.
- Do not rebuild all plugin data during export.
- Do not write business JSON.
- Preserve source plugin ownership in the evidence packet.
- Label uncertain or missing sources.

## Next Atlas Improvement

status: inferred

Create a repeatable project coaching template that asks:

- What is the project?
- What evidence is fresh?
- What is stale or missing?
- What is the next smallest concrete action?
- What should be reviewed with the user because evidence is ambiguous?
- Which evidence source is current but incomplete, and which historical source is rich but stale?
