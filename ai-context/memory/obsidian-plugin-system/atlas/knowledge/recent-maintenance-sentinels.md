# Recent Maintenance Sentinels And Interactive Guardrails

status: draft_mvp
updated: 2026-07-14

## Core Claim

status: confirmed_by_memory

Recent Obsidian plugin maintenance shows a repeating pattern: many failures are not isolated bugs, but sentinel violations in the LLM Wiki operating model.

The system should treat these as durable guardrails:

- bound interactive expansion before rendering or scanning;
- preserve source ownership when projecting evidence across plugins;
- make lifecycle rules date-aware instead of only status-aware;
- make stress / low-margin fallback modes date-aware instead of globally replacing the user's normal execution system;
- keep visual identity stable by primary key;
- treat UI overlap, raw IDs, and unreadable labels as regression sentinels;
- prove actual runtime and keep runtime/dev/mirror hashes aligned before and after changes;
- use verifier-style review when a change alters cross-plugin behavior or high-risk UI semantics.
- do not recompute content-coordinate overlays on pure scroll;
- isolate hidden prewarm runtime state from the visible interactive owner.

## Evidence Batch

status: confirmed_by_memory

This page synthesizes the recent change-record batch:

- `20260630-093031-mandala-daily-score-graphs-peo-carrier-suppression-staged.md`
- `20260630-105450-mandala-daily-score-subtabs-modal.md`
- `20260630-111957-mandala-project-plan-collection-cards.md`
- `20260630-113958-mandala-daily-score-date-aware-stopped.md`
- `20260630-114918-mandala-daily-score-key-colors.md`
- `20260630-115413-mandala-project-plan-card-reveal.md`
- `20260630-115852-mandala-daily-score-high-contrast-key-colors.md`
- `20260630-173643-antinet-tree-freeze-guard.md`
- `20260630-184451-mandala-collection-card-wrap.md`
- `20260714-201511-mermaid-floating-widget-slice-a1-scroll-prewarm-isolation.md`

## Claims

### 1. Interactive Scope Must Default To Smaller Safe Regions

status: confirmed_by_code

The Antinet tree freeze came from defaulting a current deep note into its parent group, which expanded a local intention into about 9438 ATOM candidates. Interactive graph views should default to the user's local starting point and require an explicit control to widen scope.

Required guardrails:

- local-first default;
- explicit widen button;
- record/node/edge/source budgets;
- cancellation token for stale renders;
- partial graph metadata and status text;
- no oversized fallback content written into render cache.

### 2. Project Evidence Projection Is Read-Only Unless Ownership Says Otherwise

status: confirmed_by_code

Mandala may show Project Overview / Collection Card evidence inside the `项目执行计划` surface, but Mandala does not become the owner of Collection Card business data. It may read, display, and reveal through provider APIs; it must not write Project Overview, Workspace, or Collection Card JSON as a convenience side effect.

### 3. Lifecycle Rules Need Date Semantics

status: confirmed_by_code

For daily score candidates, `stoppedAt` is not the same as invisible forever:

- `stoppedAt` day remains scoreable;
- dates after `stoppedAt` are not new-score candidates;
- days with existing historical scores remain editable.

This pattern should be reused for stopped / inactive / archived planning items: preserve historical evidence while pruning future candidate generation.

### 4. Visual Identity Should Follow Primary Key, Not Momentary Value

status: confirmed_by_user

Daily score color semantics were corrected from score-based coloring to primary-key-based coloring. In fluctuation views, the same item should retain a stable visual identity across days; the score is shown by position/text, not by changing the item color.

When many keys appear in one chart, same-screen contrast matters more than naive hash color assignment.

### 4.1 Low-Margin Fallback Should Preserve Continuity

status: confirmed_by_user

The Mandala daily lesson pressure-response flip refines the date-aware lifecycle rule: a low-margin day should be allowed to switch from normal project-forward daily lessons to stress-response recovery items without deleting, stopping, or globally replacing the normal daily lesson pool.

Required guardrails:

- flip state belongs to a date, not to all future days;
- recovery items are tracked as their own stable keys;
- the score graph may include both normal and recovery keys, but the default score-entry modal should follow the selected date's flip side instead of mixing both pools;
- historical score blocks remain editable through focused entry when the user opens the block itself;
- color assignment should differentiate normal and recovery keys while keeping each key traceable across days.

This is an intentional-stance design pattern: when the user marks the system as low-margin, the interface should push toward preserving余度 and continuity instead of continuing to demand the previous high-execution plan.

### 5. UI Regression Sentinels Are Semantic, Not Cosmetic

status: confirmed_by_code

Unreadable UI states are system regressions because they corrupt the evidence surface:

- raw `item_m...` or naked internal ids as primary labels;
- text overlap in embedded cards;
- long labels not wrapping;
- nested buttons or inherited Obsidian button heights causing card text collision;
- table cells that do not allow `min-width:0` / wrapping where evidence must be read.

If a card-like item needs multi-line text, do not assume a native `button` is safe. Use a semantic card container such as `div role="button" tabindex="0"` with explicit click and keyboard handling when Obsidian button styles impose fixed-height or centered layouts.

### 6. Runtime Canonical Discipline Is Part Of The Knowledge System

status: confirmed_by_memory

The LLM Wiki can only improve future behavior if code facts are tied to the actual runtime. Recent work repeatedly used:

- actual Obsidian vault runtime proof;
- runtime/dev/mirror candidate listing;
- before hash backups;
- code-only sync scope;
- `node --check`;
- after hash equality;
- engineering change records.

This is not bookkeeping only. It is how the framework prevents stale dev or mirror copies from overwriting the user's real working system.

### 7. Pure Scroll Must Not Rebuild Stable Content Geometry

status: confirmed_by_code_and_user

Mermaid readable-subgraph labels are absolute children of the diagram content container. Their coordinate conversion returns content-space positions, so inner scroll offsets cancel and outer scrolling moves the graph and overlay together.

Required guardrails:

- do not rerun anchor lookup, collision placement and label DOM replacement for pure inner/outer scroll;
- retain refresh for install, actual zoom, resize and changed transformed bounds;
- coalesce high-frequency persistence instead of synchronously writing localStorage on every scroll event;
- keep an immediate final save on close and invalidate delayed callbacks during cleanup.

### 8. Hidden Prewarm Must Not Become A Second Interactive State Owner

status: confirmed_by_code_and_user

A hidden prewarm run may reuse the production render pipeline, but it must not overwrite the visible widget's mutable runtime state.

At minimum, private-host or suppress:

- graph zoom/scroll/pan state;
- dismissed fold state;
- node-id maps and click callbacks;
- save/toggle globals;
- localStorage persistence timers and writes.

If prewarm does not need interaction, omit Mermaid global click directives entirely. Reusing render computation does not grant ownership of visible interaction state.

## Future Agent Checklist

status: inferred

When a future task touches Mandala, Project Overview, Collection Card, Keyword/Antinet, or cross-plugin evidence surfaces, check:

1. Is this source owner, read-only projection, or derived display?
2. Could this UI inherit fixed dimensions, no-wrap behavior, raw ids, or overlap from host styles?
3. Does a stopped / inactive / archived item need date-aware historical visibility?
4. Does a chart encode item identity or changing value, and is that choice semantically correct?
5. Is a fallback / pressure mode date-aware, reversible, and continuity-preserving instead of a global overwrite?
6. Could this interaction trigger unbounded graph/tree/list expansion?
7. Is widening scope explicit and cancellable?
8. Are runtime/dev/mirror hashes and backups recorded before and after?
9. Is a scroll/resize/zoom listener recomputing geometry that has not actually changed?
10. Can hidden prewarm, preview, hydration, or measurement overwrite visible-window state or global callbacks?

## Framework Effect

status: inferred

This page refines FW-001 and OPS-006: `obsidian-system-plugin-dev` should continue to use Atlas and change records as reusable prior, but these claims should become hard Skill rules only after repeated recurrence or a high-risk class demands it.
