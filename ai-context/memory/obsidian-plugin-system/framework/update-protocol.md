# Framework Update Protocol

status: active
created: 2026-06-24

## Purpose

This protocol defines what to do when the user says:

- "用框架落一下"
- "这个插件使用经验帮我落到框架"
- "这个插件为什么这样设计，用框架记录一下"
- "这个编号原则 / 函数设计 / UI 意义请结合框架更新"

The goal is not to create an isolated note. The goal is to update the shared framework state: current prior, new evidence, changed claim, updated question map, and future execution rule if needed.

## Core Model

Treat the framework as a Bayesian-style system:

- Prior: current Atlas, Question Map, structure guide, reports, OPS cards, experience cards, change records, and code graph.
- Evidence: user's new observation, source code, runtime behavior, console output, existing memory, or Understand Anything graph.
- Claim: a precise statement derived from the evidence.
- Status: source confidence and confirmation level.
- Update: the concrete framework file, card, atlas map, question, or skill rule that changes.
- Trace: record what changed and why, so the next agent can inherit the state.

## Update Flow

### 1. Capture Observation

Write the observation in the user's terms first.

Ask only if the meaning cannot be safely inferred. Otherwise preserve the user's vocabulary and mark ambiguity as `unknown` or `needs_user_practice_evidence`.

Minimum fields:

- observation:
- source:
- affected plugin or workflow:
- user-facing meaning:
- suspected layer:

### 2. Locate Framework Prior

Before writing a new card, read the relevant prior:

1. `framework/entry-index.md`
2. `framework/question-map.md`
3. `framework/registry.md`
4. `atlas/README.md`
5. Relevant Atlas file:
   - `atlas/00-system-map.md`
   - `atlas/contracts.md`
   - `atlas/unknowns-register.md`
   - `atlas/plugins/*.md`
   - `atlas/workflows/*.md`
6. Existing experience cards or change records if the topic has history.
7. Understand Anything snapshot or source code if the claim depends on implementation details.

### 3. Convert Observation Into Claim

Convert the observation into one or more framework claims.

Each claim should be:

- small enough to verify;
- attached to a layer;
- attached to an owner/provider/consumer if cross-plugin;
- marked with a source status;
- connected to an existing or new question.

Use this shape:

```yaml
claim:
  statement:
  layer:
  owner:
  provider:
  consumer:
  contract_type:
  source_status:
  evidence:
  affects_question:
  update_type:
```

If provider/consumer does not apply, write `not_applicable`.

### 4. Mark Source Status

Use the same status vocabulary as Atlas:

- `confirmed_by_user`: explicitly stated by the user.
- `confirmed_by_code`: verified in code, public API, or generated code graph.
- `confirmed_by_memory`: supported by existing cards, reports, or change records.
- `inferred`: synthesized from multiple clues but not directly confirmed.
- `unknown`: known gap needing user or code verification.

Do not upgrade `inferred` or `unknown` without a source.

### 5. Decide Update Target

Choose the narrowest durable target:

| Situation | Update target |
| --- | --- |
| New stable system role, layer, ownership rule | `atlas/00-system-map.md` |
| New provider/consumer/API/nodeKey/schema/export contract | `atlas/contracts.md` |
| New unanswered or partly answered question | `framework/question-map.md` and/or `atlas/unknowns-register.md` |
| New reusable practice or design lesson | `memory/obsidian-plugin-system/cards/YYYY-MM-DD-<slug>.md` |
| Actual file/program/rule/skill modification | `memory/obsidian-plugin-system/change-records/YYYY/YYYY-MM/...md` |
| New implementation guardrail or repeatable execution rule | `skills/obsidian-system-plugin-dev/SKILL.md` through backup + verifier + engineering record |
| New code evidence from current runtime snapshot | `atlas/README.md` or relevant plugin/contract file, plus Understand snapshot notes |
| Pure temporary project analysis | active `state/` project files, not long-term framework unless it changes the model |

If the update spans multiple targets, state the order and why.

### 6. Apply Bayesian Update Label

Every framework landing should say how it changes the prior:

- `reinforces`: strengthens an existing claim.
- `refines`: narrows or clarifies an existing claim.
- `corrects`: changes an existing claim.
- `splits`: separates one broad claim into multiple claims.
- `adds_unknown`: creates a new open question.
- `supersedes`: replaces an older claim or milestone.
- `no_model_change`: records evidence but does not change the framework model.

### 7. Preserve Trace

Each landing should leave a trace:

- which prior files were read;
- which claim changed;
- which status was assigned;
- which file was updated;
- whether `question-map.md` or `unknowns-register.md` changed;
- whether Skill/rules need future update;
- whether code evidence was used.

For small experience landings, this trace can live inside the new experience card. For framework-wide changes, also update `maintenance-log.md`.

## Experience Landing Template

Use this template for new cards under `memory/obsidian-plugin-system/cards/`.

````markdown
# <Short Title>

## Observation

<User's observation in user vocabulary.>

## Framework Prior

- Read:
- Existing claim:
- Related question:
- Related Atlas file:

## Claim Update

```yaml
claim:
  statement:
  layer:
  owner:
  provider:
  consumer:
  contract_type:
  source_status:
  evidence:
  affects_question:
  update_type:
```

## Explanation

<Explain why this observation matters and how it should be understood inside the plugin system.>

## Update Target

- Updated file/card:
- Not updated and why:

## Trace

- prior_read:
- evidence_used:
- question_map_effect:
- atlas_effect:
- skill_or_rule_effect:
- remaining_unknowns:
````

## Design Explanation Template

Use this when the user asks why a plugin, function, numbering rule, or UI form is designed this way.

````markdown
# <Plugin Or Design Principle>

## Design Question

<What is being explained?>

## Current Prior

- Layer:
- Owner:
- Provider:
- Consumer:
- Existing contract:
- Existing unknown:

## Evidence

- user_practice:
- code_evidence:
- memory_evidence:
- runtime_behavior:

## Claim

```yaml
claim:
  statement:
  layer:
  owner:
  provider:
  consumer:
  contract_type:
  source_status:
  evidence:
  affects_question:
  update_type:
```

## Why This Design Exists

<Explain in terms of ownership, workflow pressure, symbolic meaning, and implementation constraint.>

## Framework Consequence

<What should future Codex agents do differently because this is now known?>

## Remaining Unknowns

<What still needs user, code, or memory evidence?>
````

## Guardrails

1. Do not turn every observation into an Atlas claim. Use Atlas only for stable, reusable system model facts.
2. Do not move OPS origin cards. Register or cite them instead.
3. Do not mix engineering change records with design/experience cards.
4. Do not mark code behavior as `confirmed_by_code` unless source code, runtime log, public API, or Understand graph was actually checked.
5. Do not mark user practice as code truth. Use `confirmed_by_user` for lived usage semantics.
6. Do not update Skill/rules casually. If a new experience changes execution behavior, follow backup + verifier + engineering record.
7. Do not write to runtime plugin files as part of framework landing.
8. Do not let Project Overview, Atlas, or Codex become a second owner of another plugin's business JSON.

## Minimal User-Facing Summary

After landing an experience, report:

1. what claim was added or changed;
2. where it was written;
3. whether Atlas / Question Map / Skill changed;
4. what remains unknown.
