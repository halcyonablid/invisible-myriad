# Workflow: Keyword, Antinet, BUS, and Subconcept

status: draft_mvp
updated: 2026-07-02

## Purpose

status: confirmed_by_user

Keywords are not only tags. They are entrance symbols into the user's Antinet/ATOM knowledge structure.

They also operate as the user's symbolic communication interface with the library: the user starts from a keyword, enters a concrete tree position, and reads or updates the note signals below that symbolic port.

## Current Pattern

status: confirmed_by_memory

- Antinet/ATOM topology provides a whole-library ordering source.
- Keyword Index renders keyword capsules and drawers.
- BUS supports sequential note growth under a keyword/drawer context.
- Cross-plugin keyword jumps should use EVA `openNode(nodeKey)` before provider fallback.
- Notes below keyword/drawer/BUS/SCON contexts act as signal carriers, not just child files.
- Mermaid address and EVA relation layers can extend the keyword port into visual and cross-view relation space.

## Symbolic Interface Reading Rule

status: confirmed_by_user

When entering from a keyword, first preserve the keyword as the symbolic port. Then inspect the intended local topology: drawer, BUS, SCON, ATOM address, note branch, and relation layer.

Do not flatten a keyword into a loose text tag before this topology is understood.

## Drawer-First World Miniature Model

status: confirmed_by_user

中文术语：抽屉优先的世界微缩模型。

When the user is organizing a large world-facing domain that is not yet well understood, prefer a drawer-first miniature model over immediate capsule proliferation.

The intended practical hierarchy is:

```text
capsule keyword / upper symbolic frame
  -> drawers as visible containers for world regions
  -> BUS and notes as concrete signal growth
```

Use this rule when the user wants to build an overview of possible world interfaces, not merely enrich a single mature concept.

Operational implications:

1. A drawer can be valuable even when it is sparse, because it preserves the macro map.
2. A note should be placed by the interface it opens for the user, not only by topic.
3. Do not assume a symbol should become a capsule keyword immediately.
4. Promote a drawer or repeated construct into a capsule keyword only when it has enough internal structure, repeat use, and cross-drawer recall power.
5. Future COACH or AI context export should preserve the difference between "drawer as miniature model" and "capsule as mature symbolic port."

## Interactive Tree Scale Guard

status: confirmed_by_code

When rendering Antinet / ATOM tree views interactively, default to the user's local starting point and require an explicit widening action for parent-group or larger scopes.

Large tree rendering should use budgets, cancellation, and partial status rather than unbounded fanout. This preserves the symbolic entrance as an actionable local port instead of turning every entry into a full-library scan.

## Subconcept Extension

status: confirmed_by_user

Subconcepts are represented by `+SCON.` under drawer-folder context.

Example:

`...+BUS002.周四晚上去看了火遮眼，然后带着我的腰包去散步+SCON.电影`

The user rule currently says:

- subconcept belongs under drawer folders;
- subconcept cannot directly contain another subconcept;
- subconcept can contain drawers;
- drawers under subconcept can contain subconcepts;
- UI hides `SCON.` and renders subconcepts as capsule-like areas.

SCON display locators can group visible subconcepts without changing identity. Example: `SCON.L雷达` uses `L` as the visible group locator and `雷达` as the display label, while raw path identity remains `SCON.L雷达`.

## Drawer And Subconcept Topology Order

status: confirmed_by_code

Keyword drawer and SCON subtree order follows the Antinet / ATOM address space when covered notes expose addresses:

1. compute the subtree's minimum ATOM address;
2. sort addressed drawers/subconcepts by natural address order;
3. sort addressed nodes before unaddressed nodes;
4. keep existing BUS-number and label fallback for unaddressed nodes.

This rule aligns drawer review order, EVA records, and the Antinet tree perception without rewriting the keyword JSON schema or raw `SCON.` path identities.

## Display Identity Boundary

status: confirmed_by_memory

Visible SCON grouping, rounded UI, open width, and display label cleanup are presentation contracts. They must not change:

- `nodeKey` encoding;
- `drawerExpanded` keys;
- raw suffix path parts;
- raw `SCON.` path parts;
- EVA identity;
- keyword JSON schema.

## Why Direct Subconcept Under Subconcept Is Restricted

status: inferred

The restriction keeps the hierarchy alternating between concept-like symbols and drawer-like containers. It avoids an unbounded mini-tree that duplicates the full Antinet structure inside a drawer and makes sorting/reveal semantics harder.

## Open Questions

status: unknown

- Should a subconcept appear in global keyword review windows?
- Should subconcept be searchable as a keyword or only nested under its parent drawer?
- How should a note tied to multiple keyword/subconcept contexts choose jump target?
- How should AI context export represent keyword symbolic ports without losing the signal/tree distinction?
- How should AI context export represent intentionally sparse drawers that function as world-miniature containers rather than ordinary empty categories?
