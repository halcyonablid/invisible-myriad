# Atlas Schema

status: active
created: 2026-06-24

## Layer Contract

Use this Atlas as a lightweight LLM Wiki style synthesis layer:

| Layer | Role | Mutability |
| --- | --- | --- |
| Raw sources | Original or copied source material | Do not rewrite during Atlas maintenance |
| Cards | Reusable experiences, design lessons, practice observations | Add or update when a reusable lesson changes |
| Change records | Engineering fact ledger for actual file modifications | Add one per engineering change |
| Atlas | Maintained synthesis and navigation layer | Update when a stable system model changes |
| Rules / Skills | Execution constraints and agent behavior | Update only through verifier + backup + change record |

## Page Types

| Page type | Folder | Purpose |
| --- | --- | --- |
| `entry` | `atlas/README.md` | Atlas overview and core navigation |
| `purpose` | `atlas/purpose.md` | Why the Atlas exists and what it serves |
| `schema` | `atlas/schema.md` | Page types, status vocabulary, update rules |
| `index` | `atlas/index.md` | Reading navigation across Atlas pages |
| `log` | `atlas/log.md` | Atlas maintenance events |
| `system_map` | `atlas/00-system-map.md` | Top-level layer and ownership synthesis |
| `contract` | `atlas/contracts.md` | Provider/consumer and data ownership contracts |
| `plugin` | `atlas/plugins/*.md` | Per-plugin role map |
| `workflow` | `atlas/workflows/*.md` | End-to-end cross-plugin workflow |
| `knowledge` | `atlas/knowledge/*.md` | System foundations shared across plugins |
| `terms` | `atlas/glossary.md`, `atlas/aliases.md` | Canonical terms and alias drift control |
| `unknowns` | `atlas/unknowns-register.md` | Active cognition gaps |

## Status Vocabulary

Use the shared Atlas vocabulary:

- `confirmed_by_user`
- `confirmed_by_code`
- `confirmed_by_memory`
- `inferred`
- `unknown`
- `active_unknown`

Do not upgrade a claim to code truth unless code, runtime output, generated code graph, or public API was checked.

## Required Updates

When adding or materially changing an Atlas page:

1. Update `atlas/index.md`.
2. Add a short entry to `atlas/log.md`.
3. If it changes the long-term framework, update `framework/registry.md` or `framework/question-map.md`.
4. If it changes agent behavior, update the relevant Skill through verifier + backup + engineering change record.

## Terminology Rule

When a term appears in `atlas/glossary.md` or `atlas/aliases.md`, future agents should use the canonical term and preserve the user's exact term in evidence quotes.

Do not paraphrase high-risk system terms into generic English or generic Chinese labels.

