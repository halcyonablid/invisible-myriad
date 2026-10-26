# Obsidian System Atlas

status: draft_mvp
created: 2026-06-23
scope: current repository memory documents only

## Purpose

This atlas is the shared system map for the user's Obsidian plugin ecosystem.

It exists to reduce the mismatch between:

- the user's tacit operating knowledge;
- Codex-readable plugin code, change records, and experience cards;
- AI coaching workflows that need a bounded context instead of scanning every JSON and note.

The atlas is not a runtime plugin and does not own business data. It is a human-readable and AI-callable memory layer built from existing memory, code facts, and user-confirmed semantics.

## Status Vocabulary

Use one of these statuses for every important claim:

- `confirmed_by_code`: verified in plugin code or public API.
- `confirmed_by_memory`: supported by existing memory cards, reports, or change records.
- `confirmed_by_user`: explicitly stated by the user in conversation.
- `inferred`: reasonable synthesis from multiple sources, but not yet directly confirmed.
- `unknown`: a known gap that needs user or code verification.

Do not upgrade an `inferred` or `unknown` claim to confirmed without a source.

## Core Files

- `purpose.md`: why this Atlas exists, what problems it serves, and what it does not own.
- `schema.md`: page types, status vocabulary, update rules, and terminology rules.
- `index.md`: reading navigation for Atlas pages; different from `framework/registry.md`.
- `log.md`: Atlas maintenance events; different from engineering change records.
- `00-system-map.md`: top-level map of roles, layers, and data ownership.
- `contracts.md`: cross-plugin contracts, boundaries, and API ownership rules.
- `unknowns-register.md`: questions that mark the current human/AI cognition gap.
- `plugins/*.md`: per-plugin role maps.
- `workflows/*.md`: end-to-end workflows across plugins.
- `knowledge/*.md`: cross-plugin knowledge foundations such as Mermaid address semantics.
- `glossary.md`: canonical high-risk system terms.
- `aliases.md`: alias mappings, historical names, and forbidden conflations.

## Scale And Terminology Guard

status: confirmed_by_user

This Atlas follows a lightweight LLM Wiki pattern:

- raw sources remain evidence;
- Atlas pages are maintained synthesis;
- schema and terminology files prevent drift;
- durable answers should update existing pages instead of creating unmanaged note piles.

When a task involves specialized system terms, read `glossary.md` and `aliases.md` before paraphrasing.

## Understand Anything Runtime Snapshot

status: confirmed_by_code

Use this repository command to rebuild a latest code/docs graph from the actual Obsidian runtime plugin set without writing into the live vault:

```powershell
node scripts/run_understand_runtime_plugin_snapshot.mjs
```

Latest generated snapshot:

- runtime source: `D:\han\最新的\NEWERA2024年4月17日\NEWERA\.obsidian\plugins`
- staging root: `workspaces/understand-runtime-obsidian-plugins-20260623-120452`
- graph: `workspaces/understand-runtime-obsidian-plugins-20260623-120452/.understand-anything/knowledge-graph.json`
- summary: `workspaces/understand-runtime-obsidian-plugins-20260623-120452/understand-run-summary.json`

The script copies only a curated set of plugin code/docs into `workspaces/`, excludes business JSON/runtime data/cache/vendor/archive folders, then calls the local Understand Anything core API. It is a deterministic snapshot graph, not the full LLM `/understand` multi-agent pass.

If the full Understand Anything skill flow is needed, run it against the staging root, not the live Obsidian runtime:

```text
/understand <staging-root> --full --no-auto-update --language zh
```

## Guardrails

- This atlas may cite runtime paths and plugin APIs, but it does not modify runtime plugins.
- It must not edit Obsidian business JSON, cache JSON, EVA index files, or user settings.
- Engineering change records remain in `memory/obsidian-plugin-system/change-records/`.
- Reusable implementation experience remains in `memory/obsidian-plugin-system/cards/`.
- This atlas is the synthesis layer: it links and organizes those facts into a shared operating model.
