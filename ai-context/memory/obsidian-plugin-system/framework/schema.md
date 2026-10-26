# Framework Schema

status: active
updated: 2026-06-25

## Page Types

| Type | File | Role |
| --- | --- | --- |
| entry | `entry-index.md` | First operational entry for framework-related work. |
| purpose | `purpose.md` | Why this control-plane wiki exists and where its boundary with Atlas sits. |
| schema | `schema.md` | Rules for framework page types, status, updates, and boundaries. |
| index | `index.md` | Compact reading navigation for framework pages. |
| registry | `registry.md` | Durable entrances and provenance pointers. |
| question_map | `question-map.md` | Long-lived control questions and active gaps. |
| protocol | `update-protocol.md` | How observations become claims, updates, and trace. |
| maintenance_log | `maintenance-log.md` | Compact history of framework-level maintenance decisions. |

## Status Fields

Use simple status fields in framework pages:

- `active_entry`: read first for a workflow.
- `active`: current and maintained.
- `draft`: usable but not yet stabilized.
- `superseded`: replaced by a newer framework file.
- `archived`: kept only for history.

Avoid complex status vocabularies in framework pages. Detailed claim status belongs in Atlas.

## Update Rules

Update framework files when a change affects:

- entry order;
- evidence routing;
- update protocol;
- long-term framework questions;
- durable source registry;
- maintenance decision history;
- boundary between framework, Atlas, cards, change-records, skills, or runtime.

Do not update framework files merely because a new plugin fact, workflow detail, term definition, or project observation was discovered. Those usually belong in Atlas, experience cards, change-records, or the active project workspace.

## Boundary Rules

| Content | Destination |
| --- | --- |
| Concept definition, plugin role, workflow model, terminology, Mermaid address semantics | `memory/obsidian-plugin-system/atlas/` |
| Entry order, update protocol, registry, long-term framework question, maintenance decision | `memory/obsidian-plugin-system/framework/` |
| Concrete engineering change, backup, hash, verification, rollback source | `memory/obsidian-plugin-system/change-records/` |
| Reusable experience, practice insight, coaching lesson | `memory/obsidian-plugin-system/cards/` |
| Temporary project analysis and OPS origin cards | active `state/` project files |
| Runtime plugin code or business JSON | actual runtime only after runtime guardrails and explicit confirmation |

## Anti-Drift Rules

1. Do not make `framework/` a second Atlas.
2. Do not copy long Atlas explanations into framework pages.
3. Do not put engineering change logs into framework maintenance notes except as short references.
4. Do not register framework pages in `state/CARD_LIBRARY.md`.
5. Do not treat framework navigation output as proof of code facts.
6. If a framework update changes the knowledge model, check whether Atlas, Question Map, or Skill also needs an explicit update.
7. If a reusable operating model is broader than one workflow, record the knowledge model in Atlas and keep framework updates to entry, registry, question, protocol, or guardrail changes.
