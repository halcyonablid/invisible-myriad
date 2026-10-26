# Workflow: Plan, Record, Execute, Review

status: draft_mvp
updated: 2026-07-29

## Purpose

status: confirmed_by_memory

The system's planning tables are cognitive hardware: layout shapes the user's ability to continue, compare, and adjust work.

## Layers

status: confirmed_by_memory

- Daily lesson: daily order, completion, today's plan, today's summary, transition from yesterday.
- Goal weekly tracking: direction and continuation for Mandala/goal anchors.
- Workspace weekly tracking: project/execution anchor continuity.
- Project plan: upper-level project design fields, not week rows.

## Key Design Principle

status: confirmed_by_memory

Similar-looking tables can belong to different layers. Keep their data buckets distinct.

## Weekly Context Pattern

status: confirmed_by_memory

Weekly summary benefits from carrying forward:

- previous week's plan;
- previous week's completion;
- previous handoff;
- this week's plan;
- this week's execution;
- next week's plan.

The handoff structure makes `x(t+1) = f(x(t))` visible in the interface.

## Observation-Bounded Temporal History

status: confirmed_by_code

Daily and weekly records are two resolutions of the same record practice:

- The daily slice preserves the day's operating posture, lesson completion, plan, comment, score, and immediate experience.
- The weekly slice preserves the primary-key roster visible that week, the titles observed then, weekly intent, execution, comment, and handoff.
- Stable owner identity connects the same entity across slices; the historical title and interpretation remain properties of the old slice.

This produces an observation-bounded form of historical completeness:

```text
captured then -> preserve in detail
not captured then -> do not fabricate later
renamed or stopped now -> do not rewrite the old slice
```

The system therefore records not only what eventually happened, but also what the user could see, name, plan, and judge at that time. Current owner information may help as an explicitly marked fallback, but it must not silently replace historical evidence.

Runtime-confirmed implementation:

- Mandala schema v3 freezes goal and Workspace roster membership, historical display title provenance, and lifecycle observations by ISO week.
- A stop week remains a visible closeout slice even when its weekly row or execution-plan row is empty; later weeks exclude the stopped entity from active candidates.
- Timeline rereads Mandala lifecycle state through the owner API, includes the stop date, and hides later item range, day-slot, and milestone projections in memory without deleting retained Timeline history. For project-domain forward allocation, it additionally consumes Mandala's final Effective Operational Context Key snapshot rather than treating Timeline retention or non-stopped tracking as admission evidence.
- Stable owner identity remains the continuity key through stop, resume, rename, and later review.
- Legacy evidence without a complete roster remains explicitly partial rather than being reconstructed from today's active set.

The runtime/dev/mirror implementation was synchronized and the user confirmed the Mandala + Timeline historical behavior in actual Obsidian on 2026-07-24.

## Exit, Archive, And Review

status: confirmed_by_user_and_code_with_open_system_gap

Exit should reduce present-tense cognitive load without making the past inaccessible.

```text
active object
  -> explicit owner lifecycle decision
  -> removed from forward-looking projection
  -> retained stable identity and captured history
  -> visible through killed/stopped/historical review path
  -> optional revive/resume under the same identity
```

An inactive object is not safely archived merely because its rows remain in JSON. If it cannot be found from a documented UI or owner API, cannot explain its inactive state, or cannot reconnect to old weekly evidence, it has become ghost data.

Current review routes are intentionally owner-specific:

- Project Overview Kill Mode reviews and revives killed primary identities with retained evidence.
- Mandala historical weeks preserve the roster, labels, plans, judgments, and stop-week closeout captured then.
- Timeline preserves raw placement and milestone history while excluding post-stop future projections.

The cross-plugin rule is preservation plus discoverability, not one shared owner. A future unified retired-primary-key browser may aggregate these owner snapshots read-only, but it must not merge Kill and `不再推进`, rewrite historical titles, or become a second owner of source history.

Current work surfaces and historical observation surfaces therefore apply different projections over the same stable identity:

```text
current vertical plan = active attention set
historical weekly summary = captured observation set
```

An explicit stop, a freshly confirmed Kill, or a freshly and completely confirmed owner absence may remove an identity from the current vertical plan without deleting its plan row or weekly history. Historical weekly UI must explain the boundary with separate closeout, current-stopped, and Kill markers. Temporary provider failure, stale cache, partial owner data, or malformed owner structure is uncertainty, not an exit decision; current-plan filtering must fail open in those cases.

For Timeline's *new* project allocation path, the safety direction is stricter: a missing or incomplete final Effective Operational Context snapshot blocks new project candidates and hides the current project lane, rather than widening it with an uncertain historical pool. Existing Timeline dates and milestones remain retained and discoverable through the explicit read-only historical-project route.

## AI Coaching Use

status: inferred

AI should read planning tables as state transition evidence:

- What was intended?
- What happened?
- What changed?
- What is the next smallest viable action?
- What should be pruned or stopped?

For historical review, AI should first select the relevant day or ISO week and read that slice's roster and labels. It should not reconstruct the past from today's active primary-key set.

## Integrated Primary-Key Workflow

status: confirmed_by_user

The same managed goal/project identity participates in several interfaces, but each interface answers a different question:

| Interface | Question |
| --- | --- |
| Weekly tracking | What did I intend, observe, do, learn, and hand off in this week? |
| Project execution plan / 项目纵向管理 | Where is this object going, what is its current whole-state reality, and what is the next action? |
| Timeline | When will it receive future time and attention, and what milestone should that allocation reach? |
| Project Overview / 项目纵深管理 | What source-owned actions, materials, facts, and experience already surround this managed object? |

The primary key supplies continuity, while the records remain owned by their source layers. This permits cross-interface planning and review without flattening weekly history, future allocation, project-level judgment, and evidence into one table.

The interface should make that continuity operational. In Mandala, the same goal or project key can move directly between its weekly summary row and current vertical-plan row in both directions. Its per-key multi-week detail page can also locate the same identity in either aggregate surface through explicit `周汇总` and `纵向管理` actions. The jump follows stable owner identity rather than display title, preserves the selected historical week as source context, and stays inside the goal or project domain. If historical evidence has no selected-week summary or current active-plan counterpart, the absence is explained rather than repaired by recreating the object. Dirty detail-page navigation saves the source exactly once before switching; a rejected save restores dirty state and keeps the user on the source page.

Daily lessons use a parallel record form for repeated practices: a daily-lesson item acts as the recurring managed item, stable execution experience provides standing guidance, and the day's note records local experience. It is not a project primary key and should not be forced into the project workflow merely because both are recordable objects.

Source: `output/reports/项目与目标如何记录和安排-表达梳理稿.md`.

Bayesian update: `refines` the prior planning-layer model by connecting weekly record, vertical management, future allocation, evidence projection, and daily practice without merging their ownership.

## Time-Limit Evidence Projection

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-04

Timeline milestones are the time-limit interpretation of a managed goal/project, not a second project primary-key system. Timeline remains the owner of milestone/date/day-slot facts. Mandala `项目执行计划` and the Project Overview `Timeline` evidence column consume that owner snapshot read-only.

The shared reading order is chronological and operational: date first, then the seven daily stages, then milestone name and stable id. An unassigned or unknown stage stays visible after the seven scheduled stages for that date. This lets the user read what must happen first without converting Project Overview into another Timeline editor.

Project Overview therefore retains Timeline as an evidence column while retiring Timeline as a standalone grouping mode. Old mode state falls back to Workspace in memory; source history and saved capsule bytes remain untouched.

## Strategic Time Architecture

status: repository_dev_verified_runtime_update_pending
updated: 2026-08-11

Temporal Framework adds a scale above weekly tracking and short-range Timeline scheduling. It answers a different question: given the complete set of managed goal/project identities, what outcomes must exist in each future year, quarter, month and week so the whole plan is not missing a mission-bearing interval?

The workflow is:

1. Import active Mandala goal/project identities into a Temporal Framework membership set.
2. Create strategic outcomes under those memberships, with acceptance criteria and optional outline children.
3. Place each outcome into one calendar interval and a declared home scale.
4. Add bounded relation lenses for chronological order, readiness requirements and parallel convergence into stage gates.
5. Open a parent outcome and place children directly on its interval rail. Child creation inherits the parent span; segment, boundary and target-date controls refine it while hierarchy and typed relations constrain admissible dates.
6. Mark an otherwise empty primary-key/TimeBox intersection as explicit `本阶段无部署` when that absence is intentional.
7. Manually paint completion only after the result is actually achieved; elapsed-but-unpainted outcomes remain visible for replanning.
8. Move into Timeline only when a strategic outcome needs short-range dated milestones or day-stage allocation. Timeline evidence may inform review but cannot close the strategic outcome automatically.

The UI supports both Time-first and Outcome-first reading. Two independent breadcrumbs preserve context while the user drills either dimension. This avoids forcing time granularity and outcome decomposition into one brittle nested tree.

When an Outcome focus is active, the Time view deliberately becomes a local structural lens: each TimeBox nests only the focused outcomes whose own Placements intersect it and carries typed relation chips to peers inside or outside the box. This is a bounded SpaceSniffer-like projection, not a second stored hierarchy. Returning to all outcomes restores the flat chronological view.
