# Complex Project Continuity Rules

> Single source for long, complex project continuity when the work may exceed one chat context. This rule extends the current analysis workflow without turning temporary project state into long-term Atlas, Framework, MemPalace, or Skill knowledge.

## Purpose

Use this rule when a task is too large, multi-stage, detail-heavy, or interruption-prone for one conversation context to reliably preserve all decisions.

The goal is to make the next agent able to resume from files, not memory.

## Start And Resume Boundary

`python scripts/start_analysis.py "<topic>" --task-type ... --sources ...` may be used as the startup gate for a complex project, but it only initializes `state/INPUT_PROFILE.yaml`, `state/STATUS.yaml`, and `state/LOG.md`.

It is not a full restore mechanism and does not replace project checkpoints.

When `project_workspaces/active-project.json` identifies an active project, `start_analysis.py --force` is not a project switch. Do not use it to replace the active project state. Use the Project Workspace Manager protocol below.

For a complex project, the durable resume surface is:

1. `state/STATUS.yaml`
2. `state/INPUT_PROFILE.yaml`
3. `state/MATERIAL_AUDIT.md`
4. `state/PLAN.md`
5. `state/RESEARCH_SUMMARY.md`
6. `state/CARD_LIBRARY.md`
7. `state/INDEPENDENT_VERIFICATION.md`
8. `state/LOG.md`
9. `results/card_audit.json` when cards are involved

## Project Checkpoints

Write a checkpoint before any of these events:

1. context is likely to become too long;
2. the task is paused or switched;
3. a verifier handoff is requested;
4. a plan changes after new evidence;
5. a multi-file or high-risk modification is about to start;
6. a phase finishes and the next owner must resume.

A checkpoint should update the narrowest necessary files:

1. `state/MATERIAL_AUDIT.md`: active Question Map, evidence map, missing inputs, and scope limits.
2. `state/PLAN.md`: current plan, next action, risks, stop conditions, card saturation target if applicable.
3. `state/RESEARCH_SUMMARY.md`: QA Register, decisions already made, assumptions, and what is still open.
4. `state/CARD_LIBRARY.md`: mappings for project cards already created.
5. `state/INDEPENDENT_VERIFICATION.md`: latest verifier verdict, findings, and required actions.
6. `state/LOG.md`: concise process trace, commands, checkpoints, and handoff summary.

Do not create free-form checkpoint files inside `state/cards/`.

## Multi-Project Workspace Protocol

Use this protocol when more than one complex project must remain discoverable, queryable, and resumable.

### Ownership

- Active `state/` is the sole mutable project owner.
- `project_workspaces/projects/<project_id>/state/` is a sealed last-committed checkpoint, not a live mirror.
- The manager performs no background synchronization.
- `project-seed-archive` is a separate frozen-export layer and does not manage active threads.

### Versioned Projection

V1 required project-owned files are `STATUS.yaml`, `INPUT_PROFILE.yaml`, `MATERIAL_AUDIT.md`, `PLAN.md`, `RESEARCH_SUMMARY.md`, `INDEPENDENT_VERIFICATION.md`, and `LOG.md`.

Optional projected files are `CARD_LIBRARY.md`, `SOURCES.md`, `CRITICAL_REVIEW.md`, `ANALYSIS_OUTLINE.md`, and `ITERATIONS.md` when present in `PROJECTION.json`.

`state/cards/`, `state/backups/`, `state/verification_inputs/`, agent state, historical alternates, `results/`, `output/`, `knowledge/`, and `memory/` remain repository-global in V1. Project checkpoints may reference them but do not switch or copy them. Every root-level `state/*` entry must be explicitly classified; an unknown entry blocks mutation.

### Integrity And Lifecycle

- `resumable`: required files, schema, paths and hashes validate; switch/resume allowed.
- `partial`: missing required or referenced evidence; inspect only.
- `inspection_only`: retained for inquiry/provenance; never activated.
- `corrupt`: schema/path/hash invalid; recovery or repair required.

Lifecycle (`active`, `paused`, `completed`, `archived`) is separate from integrity. CLI input cannot force a project to become resumable.

### Commands

```powershell
py scripts/project_workspace.py inventory-state
py scripts/project_workspace.py list
py scripts/project_workspace.py inspect --project <id>
py scripts/project_workspace.py checkpoint --note "<note>"
py scripts/project_workspace.py switch --project <id> --ack-writers-quiescent
py scripts/project_workspace.py resume --project <id> --ack-writers-quiescent
py scripts/project_workspace.py recover --ack-writers-quiescent
```

Before switch/resume/recover, close or wait for agents that can write project files. The manager lock serializes manager operations only; it cannot stop arbitrary writers. The acknowledgement flag is mandatory and must not be passed casually.

### Transaction Safety

- Mutating operations use an exclusive manager lock with txid, PID, host, operation and timestamp.
- Switch is a journaled per-file transaction, not a whole-`state/` directory replacement.
- Back up every projected active file and its prior-existence state before replacement or removal.
- Remove a target-absent optional file so the previous project's state cannot leak into the target.
- Validate the installed canonical content manifest, then update the active pointer last.
- Keep manager events outside project `state/LOG.md`.
- Reject unresolved transactions, unknown schemas, path escape, reparse points, insufficient disk, case-insensitive ID collisions and unclassified state entries.
- Recovery restores each projected file from rollback. Unknown phases or sharing violations preserve evidence and require explicit recovery.

### Read Without Switching

Prefer `inspect --project <id>` for historical questions, project idea review, verifier history, or next-action lookup. Inspection must not modify the active pointer or project mtimes. Switch only when work must continue on that project's mutable state.

Before starting a new long-running Material Audit, run `project_workspace.py brief` and include a concise historical-thread report: active project, paused/completed/inspection-only projects, integrity, checkpoint age, missing evidence, and recorded next action. Then checkpoint the active project before creating the new thread.

Before resuming a historical project, run `drift-audit --project <id>`. Checkpoints record a control-plane hash surface covering Rules, relevant Skills, Framework entrances, and Atlas entrances. Any detected drift, or a checkpoint that predates this surface, requires an independent verifier to state which old assumptions no longer match the current system and how the plan must be re-baselined. Restoring bytes alone never certifies that an old plan remains valid.

Only research conclusions, concept nodes, or durable evidence cards may enter `state/cards/`, and they must fully follow `prompts/rules/second_brain.md`: ATOM address, `parent_atom`, front matter, backlinks, `CARD_LIBRARY`, and `card_audit`.

## Project-Specific Knowledge Vs Long-Term Knowledge

Temporary project knowledge defaults to the active `state/` project files.

Do not promote project notes into long-term layers just because they helped the current task.

Promotion requires all of the following:

1. the claim is reusable beyond the current project;
2. source status is explicit: `confirmed_by_user`, `confirmed_by_code`, `confirmed_by_memory`, `inferred`, or `unknown`;
3. the narrow target is selected through `memory/obsidian-plugin-system/framework/update-protocol.md`;
4. the update target is appropriate:
   - Framework: entry order, update protocol, long-term questions, maintenance decisions;
   - Atlas: stable roles, concepts, ownership, contracts, terminology, unknowns;
   - `memory/obsidian-plugin-system/cards/`: reusable experience or design practice;
   - `memory/obsidian-plugin-system/change-records/`: actual engineering change facts;
   - MemPalace: only after card/source preparation and the MemPalace transaction gate;
   - `obsidian-system-plugin-dev` Skill: only mature guardrails that should change future execution behavior.

Pure temporary project analysis remains in active `state/` files.

## Verifier Role In Complex Projects

For complex projects, verifier checks more than feasibility. It must judge whether the project can be resumed without hidden chat context.

Verifier must check:

1. `resume_completeness`: can a new agent read the checkpoint files and know current objective, evidence, plan, risks, next action, and blockers?
2. `question_map_integrity`: do Question Map lights, card budgets, `CARD_LIBRARY`, and `results/card_audit.json` agree?
3. `promotion_boundary`: did temporary project knowledge stay in `state/`, and were only mature reusable claims promoted?
4. `target_selection`: if anything was promoted, was the target Framework, Atlas, card, change record, MemPalace, or Skill chosen correctly?
5. `write_safety`: for rule, Skill, code, runtime, or high-risk files, are backup, hashes, verifier verdict, verification command, and rollback source recorded?
6. `handoff_quality`: are required actions specific enough for the next owner to execute?

Verifier output goes to `state/INDEPENDENT_VERIFICATION.md`, with a concise summary in `state/LOG.md`.

## Resume Handoff Template

Use this compact block in `state/LOG.md` or the relevant handoff file:

```yaml
complex_project_checkpoint:
  checkpoint_id: CP-YYYYMMDD-HHMMSS
  objective:
  current_stage:
  input_profile:
    task_name:
    task_type:
    actual_run_directory:
  artifacts:
    material_audit:
    plan:
    research_summary:
    card_library:
    independent_verification:
    card_audit:
  question_map_status:
    green: []
    yellow: []
    red: []
  decisions_made: []
  open_questions: []
  next_actions: []
  promotion_boundary:
    state_only: []
    candidates_for_long_term: []
    promoted: []
  risks: []
  verifier_required: YES|NO
```

## Non-Goals

This rule does not make `start_analysis.py` a complete restore tool.

This rule does not bypass the second-brain card rules.

This rule does not allow direct MemPalace mine, runtime writeback, rule modification, or Skill modification without their existing gates.
