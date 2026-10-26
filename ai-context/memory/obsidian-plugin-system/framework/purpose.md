# Framework Purpose

status: active
updated: 2026-06-25

## Purpose

The framework is a thin control-plane wiki for the Obsidian plugin system.

It answers:

- how an agent should enter the system;
- how an agent should choose the right evidence path;
- how new observations become durable framework updates;
- how to guard runtime, business data, terminology, and source provenance;
- how to keep Atlas, experience cards, change records, and skills in their proper roles.

It should stay small, procedural, and hard-edged.

## Boundary With Atlas

Atlas is the knowledge-plane wiki. It answers what the system is: concepts, plugin roles, workflows, contracts, terminology, numbering semantics, unknowns, and synthesized claims.

Framework is the control plane. It answers how to operate the knowledge system: entry order, update protocol, registries, long-term questions, maintenance decisions, and guardrails.

Do not duplicate Atlas concept pages inside `framework/`.

If a page mainly answers "what is this?", it belongs in `atlas/`.

If a page mainly answers "what should the agent do next, and under which rule?", it belongs in `framework/`.

## Design Principle

Framework should be small enough that an agent can read it before serious work without consuming the whole context window.

It should be strict enough that future agents do not:

- flatten specialized terms into loose paraphrases;
- treat temporary project state as durable system knowledge;
- update Atlas without source status and trace;
- scan broad runtime or business data before checking the declared entrances;
- mix engineering change records, experience cards, and framework claims.

## Success Criteria

The framework succeeds when it can quickly tell an agent:

1. where to start;
2. which durable sources matter;
3. what not to touch;
4. when to update Atlas, Question Map, Skill, cards, or change-records;
5. what remains unknown.
