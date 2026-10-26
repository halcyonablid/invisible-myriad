# Obsidian Plugin System Framework

status: active_entry
created: 2026-06-24
scope: long-lived framework environment for the user's Obsidian plugin ecosystem

## Purpose

This directory is the long-lived home for the Obsidian plugin system framework.

It exists because `state/` is a project worksite: Material Audit, Question Map, cards, and reports may rotate when a new engineering project starts. The plugin-system framework needs a stable environment that survives those project turnovers.

The framework is a thin LLM wiki for the control plane. It should stay small and strict: it tells an agent how to enter, route evidence, update durable state, and keep boundaries. It is not the Atlas knowledge layer.

## Directory Roles

- `entry-index.md`: the first file to read when using or maintaining the framework.
- `purpose.md`: why the control-plane wiki exists and how it differs from Atlas.
- `schema.md`: page types, status fields, update rules, and anti-drift rules.
- `index.md`: compact reading navigation for framework pages.
- `question-map.md`: long-lived framework questions and their current status.
- `registry.md`: origin project cards, reports, Atlas files, skills, and rules that define the framework.
- `update-protocol.md`: observation -> claim -> source status -> update target -> trace.
- `maintenance-log.md`: compact history of framework maintenance decisions.

## Boundary

This directory is not `state/cards`.

Do not register these files in `state/CARD_LIBRARY.md`, do not count them in `card_audit`, and do not use `ATOM@` filenames here. Existing OPS cards under `state/cards` stay in place as origin project cards. This framework directory indexes them without moving or renaming them.

## Relationship To Atlas

- `framework/` answers: how to enter, how to decide, how to update, how to guard, and which durable sources matter.
- `atlas/` answers: what the Obsidian plugin ecosystem currently looks like, including layers, contracts, roles, workflows, terms, Mermaid address semantics, and unknowns.

If a page mainly explains a concept, plugin role, workflow, term, or system claim, it belongs in `atlas/`. If a page mainly tells an agent what procedure to follow, what file to update, or what boundary to respect, it belongs in `framework/`.

## Update Rule

Update this directory when a change affects the macro framework, cross-plugin ownership, AI context export, Project Overview coaching workflow, or the long-term understanding of how the plugin ecosystem should be used.

Do not expand this directory into a second Atlas. When in doubt, keep framework pages short and route knowledge content to Atlas, experience cards, or change records.
