# ATOM 侧栏导航

status: confirmed_by_code
created: 2026-09-27
deployment_status: v1_0_4_synced_runtime_reload_pending

2026-10-03 approved deployment: user explicitly said “请部署”. Reviewed main.js, manifest.json and README.md were backed up and copied to the proven NEWERA runtime and repository mirror. Four-file hash table (including unchanged styles.css) is equal across all three. Enablement, template, creation script and styles sentinels are unchanged. Evidence: `state/backups/atom-color-deploy-20261003/deployment-result.json`. Running Obsidian was not reloaded; native loaded-host acceptance remains pending. This supersedes the repository-only status below.

## 2026-10-03 v1.0.4 same-level format correction

Repository candidate verified; runtime/mirror remain v1.0.3 pending deployment confirmation. This supersedes the earlier “unimplemented” status for the format correction only. `format` now collapses numeric-leading uppercase alphanumeric runs such as `001`, `001A`, `001A001` and `002` to `N`. Dots still distinguish depth; last-`@` type prefixes and letter-leading legacy runs retain original normalization (`AI@` -> `LL@`, `A1` -> `LN`). Existing sorting, first-representative hash, bucket traversal, indexed-keyword override and virtual UI remain unchanged. No persistent color mapping, settings or business file is introduced.

User confirms their normal A/B creation workflow does not replace a group's first address; record this as `confirmed_by_user` operating context. Under that condition the original traversal maintains existing group colors. A group first created at a new depth receives its first color. Initial unification of formerly separate formats can change their prior differing colors. This is not a promise about arbitrary historical renames/imports.

Validation: six model tests including a 5,514-row original-traversal differential with only its format equivalence corrected, real screenshot addresses, depth/type boundaries, order independence, normal append stability, indexed override and cancellation. The original fixture is unchanged. Chromium mock-host suite covers full 20k navigation, natural row heights, anchors, repeated reveal, dependency loading, unload and zero business writes; native loaded-host acceptance remains pending.

A transient sort-token cache was evaluated and rejected: five alternating warmed Node measurements with equal complete projection outputs yielded ~394 -> 278 ms median for 20k deep addresses but ~1495 -> 2083 ms for 3k mixed prefixes. Final implementation retains original sorting; no general speed improvement is claimed. Evidence: `state/staging/atom-color-fix-20261003/performance-results.json`, retained candidate and benchmark script. Backup: `state/backups/atom-color-fix-20261003/`. Update: `corrects` + `refines`; no ownership/Skill/Question Map change.

## Role and ownership

The user requested a right-sidebar plugin derived from `ATOM视图啦.md`, with a configurable hotkey that locates the main editor's current note. The user explicitly rejected the original 5000-note truncation. Destination NEWERA was confirmed. On 2026-09-27 the user explicitly approved deployment: four reviewed files now match across runtime/dev/mirror, and the ID was added to the on-disk enablement list. The user confirmed the plugin appeared after refresh and supplied its working list screenshot.

The role is read-only navigation of the Antinet / ATOM address space described in [Keyword symbolic interface](../knowledge/keyword-symbolic-interface.md), not a second Keyword owner or a content editor. Vault owns Markdown; Dataview owns parsed metadata/index; `atom-note-sidebar` owns only its in-memory projection, pending reveal, and viewport. There are no business JSON files, content writes, delete/archive controls, or persistent business IDs.

## Eligibility and projection

Preserve the original source's exact `file.name.startsWith("ATOM@")`, `antinet === "atom"`, and `/ATOM@(.*?)- (.+)/` parsing rules. Dataview public API retains inline-field compatibility. `atomle` and “树的结构” do not filter rows; strict boolean `索引关键词已录入` only changes color. Sort uses Dataview name comparison with full-path tie breaking. Original address-format colors were differentially verified against the cap-lifted original algorithm.

The whole eligible set is indexed; only viewport rows plus overscan are rendered. This applies the [MapReduce performance prior](../knowledge/cross-plugin-aggregation-mapreduce-pipeline.md): distinguish semantic coverage from UI rendering bounds. Public Dataview path enumeration occurs once per full rebuild; candidate hydration, stable merge sorting and color projection yield to the event loop. Metadata events update affected page entries, and semantically unchanged events do not rebuild the projection. Index memory/initial work still scales with note count; provider synchronous API costs remain a limitation.

## Contracts

| Contract | Value / behavior |
| --- | --- |
| Plugin | `atom-note-sidebar` |
| View | `atom-note-sidebar-view`, right sidebar |
| Command | `atom-note-sidebar:open-and-reveal-current` |
| Provider | Dataview `pagePaths`, `page`, `compare`; metadata update/delete/rename/index-ready events |
| Host | Validated recent Markdown leaf in `workspace.rootSplit`, captured before sidebar activation |
| Identity | Full file path for the derived row; rename invalidates old path and indexes new path |
| Scroll | Explicit reveal centers target (very tall rows align at top); ordinary changes preserve path+offset anchor |
| DOM | Scoped `.atom-sidebar`; no global table selectors |
| Persistence | None owned by plugin; Obsidian manages layout and shortcut bindings |

`mermaid-floating-widget` reads the old `ATOM视图啦.md` table in an existing feature. The old note remains unchanged. Its DOM-based feature has not been redirected to this virtual list; future integration needs an explicit provider contract rather than scanning offscreen rows that do not exist in the DOM.

## Evidence and remaining validation

- Source: `workspaces/atom-note-sidebar/plugin.js`, `model.js`, `README.md`.
- Original snapshot: `state/backups/atom-note-sidebar-new-20260927/original-atom-view.md`.
- Tests: exact filters, 5514-row original-color differential, 20000 complete rows, adversarial prefixes, bounded actual Chromium DOM, incremental no-op, anchors, main/side/pinned host isolation, queued indexing and unload. Chromium tests use simulated Obsidian/Dataview APIs; no actual-vault latency claim.
- Engineering record: [20260927 ATOM sidebar](../../../../REFERENCE_BOUNDARIES.md#ref-175)（外部来源未随包提供）.
- Open evidence: reload the running Obsidian process, theme/layout and hotkey smoke, actual Dataview startup behavior and real-vault performance.
- Deployment trace: [20260927 installation](../../../../REFERENCE_BOUNDARIES.md#ref-176)（外部来源未随包提供）.

Update label: `extend`; source status: `confirmed_by_user` for request and no-cap requirement, `confirmed_by_code` for repository implementation. No change to Framework control-plane ownership rules and no MemPalace mine.

## Full names (2026-09-27 correction)

Observation: the user requires complete names in the list itself; a two-line ellipsis and hover title are insufficient. Source: user screenshot and explicit request. Update label: `corrects`.

The 1.0.1 implementation measures visible natural-height rows (minimum 72px), caches heights per path/name, and uses cumulative offsets with binary search for virtualization. Width/font changes invalidate measurements; visible-row ResizeObserver updates are bounded and preserve the reading anchor. The full eligible set remains indexed. Tests cover 20k rows, 1857px titles, narrow/wide sidebar, font changes, hidden/reopened panels, insertion above a tall row, and zero idle repaint loops. This is a UI-only contract correction; existing Dataview ownership, command IDs, and downstream consumers remain unchanged. Source status: `confirmed_by_code` and Chromium mock-host validation, actual updated-vault rendering still requires reload.

Framework update check: `updated` at this narrow Atlas plugin page; no control-plane rule change or new long-term question.

## 2026-10-03 Address format colors versus semantic depth

### Subsequent user clarification: numbering and inherited colors

This clarification supersedes the earlier `unknown` about suffix depth below. The user confirms method A creates a same-level note and method B descends one level. The user also confirms the intended color contract: same level, same color; adding notes preserves existing colors; traverse existing notes and reuse their colors by paradigm. The user describes this as recursive traversal. These are `confirmed_by_user` design requirements, not proof that the current implementation fulfills them.

Read-only source evidence (`confirmed_by_code`): runtime `templater/create_similar_note.md` invokes `tp.user.create_similar_note(tp)`; Templater configuration points to `scripts`, and `scripts/create_similar_note.js` implements A by incrementing a numeric/letter suffix, or extending with `A` / `001` on conflict, without adding a dot. B appends `.001`. `getParentCode` strips only the last dot segment. Thus `...001A` and `...002` have the same parent and level. Isolated pure-helper execution confirms this; no note creation or runtime write was executed.

The original snapshot `state/backups/atom-note-sidebar-new-20260927/original-atom-view.md`, lines 244–294, implements the dotted case using a `while` loop: take the first sorted remaining address, derive its color by hash, apply that color to matching formats, and repeat with the remainder. The sidebar projection optimizes this grouping process. This is iterative grouping within one calculation, not an explicit recursive parent/child tree walk or a stored cross-rebuild color lookup. User intent about inheritance should be preserved without relabelling implementation evidence as recursion.

The immediate mismatch is the `NL` versus `N` format comparison: it separates two notes that the creation workflow treats as same-level. Representative-dependent colors also do not guarantee stability when a group's first address changes. These findings supersede any proposal to assign a fresh arbitrary depth palette. A correction must respect existing-color inheritance and the user's stability requirement. The concrete traversal/matching correction, resolution of existing multiple colors at one level, and any persistence design remain undecided and unimplemented. No new data owner or storage schema is approved. Existing indexed-keyword override is a separate current behavior, not silently removed.

Update label: `corrects` (suffix-depth uncertainty) and `refines` (intended color contract versus implemented grouping). Framework trace: 2026-10-03 numbering clarification; independent verifier PASS for this narrowed explanation; documentation backup and hashes: `state/backups/atom-level-color-contract-20261003/`. Plugin, template, runtime, Question Map and Skill remain unchanged.

Observation (`confirmed_by_user`): the screenshot circles rows 4047 and 4048, ending in `001A` and `002`; the user expects these two entries to have the same color. Whether `A` adds semantic depth remains `unknown`; do not silently reinterpret the user's wording as a confirmed general depth rule.

Code evidence (`confirmed_by_code`): `workspaces/atom-note-sidebar/model.js` functions `format`, `colorHash`, and `projection`, plus `plugin.js` row rendering and `styles.css`. Both addresses have 11 dot-separated segments:

- `121.001.007.002.105.001.009.008.001.001.001A` becomes `N.N.N.N.N.N.N.N.N.N.NL`.
- `121.001.007.002.105.001.009.008.001.001.002` becomes `N.N.N.N.N.N.N.N.N.N.N`.

For these ordinary dotted numeric-prefix addresses, digit runs become `N`, uppercase letters become `L`, and dots remain. The two shapes differ despite equal dot depth. Dotted-address groups receive the hash-derived palette slot of their first unassigned address in address order, rather than each row independently hashing itself. Thus `002` and `003` share a group, while `001A` does not. The palette has 32 slots (including a repeated RGB); different groups can still share a visible color. Changing a group's representative may change its color. The implementation also has a prefix-length bucket detail for mixed address formats; this example must not be generalized into a new universal address grammar. Undotted addresses use sequential format-group palette assignment instead.

Strict boolean `索引关键词已录入 === true` overrides the normal color with `rgba(0,47,167,0.5)`. Current-row CSS adds a box shadow, not a different background color. This explains the code path, not the exact full-vault RGB or every screenshot border: only isolated sample projection was executed, not the live Dataview projection.

Read-only deployment evidence: the registered NEWERA vault is `open=true`, the Obsidian process window names the `001A` note in NEWERA, and on-disk enablement includes this plugin. Runtime `D:/han/最新的/NEWERA2024年4月17日/NEWERA/.obsidian/plugins/atom-note-sidebar`, dev `workspaces/atom-note-sidebar`, and mirror `workspaces/NEWERA/.obsidian/plugins/atom-note-sidebar` have identical SHA-256 for main.js (`a3c22c5c8e0b05547ef318c7e9bf0925bacf09bd0b86eaae8646459e9a0c31e4`), styles.css (`d0b172d1b984b45f06f36a544eaa322723bff7cdbe8d681350d8ea15f265ba00`), and manifest.json (`43950a11ec23b831d241ca55887185b491be4c238dd337b1c94fe77f92f5e0d0`). This does not prove the in-memory loaded version. No runtime, plugin source, business data, or settings were modified.

Framework claim update: `refines`. Layer: topology-address read-only visual projection; owner: atom-note-sidebar; provider: Dataview; consumer: sidebar reader. Existing “original address-format colors” means shape grouping, not a guarantee of semantic-depth colors. Future changes must first establish the desired treatment of letter suffixes and the grouping key; do not infer semantic hierarchy from the current palette. Existing FW-004 covers this observation-to-claim update; Question Map, ownership, and Skill rules are unchanged. Trace: Framework maintenance log, independent verifier entry dated 2026-10-03, and `state/backups/atom-color-explanation-20261003-1790991045469/`.

2026-09-28 user correction: short rows must occupy actual rendered line height rather than reserving two lines. Removed72px CSS minimum and72px measurement floor;72 remains only an unmeasured estimate. Existing prefix-offset virtualization, resize invalidation and path/in-row anchor restoration retained. Chromium confirms1/2/4-line rows41/73/137px under test enlarged font, adjacent offsets match without gaps;20k navigation, resize and idle stability pass. This supersedes earlier minimum-row-height assumption. Runtime visual confirmation pending reload.


## 2026-10-03 Subtle ordinary ATOM tint adjustment

status: repository_verified_runtime_pending
evidence_status: confirmed_by_user (slightly deepen only), confirmed_by_code
update: refines / no_model_change

Ordinary ATOM row background opacity changes from 0.10 to 0.12. Palette RGB values, corrected format grouping, representative hash, traversal, sorting and indexed-keyword override rgba(0,47,167,0.5) remain byte-for-byte unchanged. Generated bundle differs only in this opacity literal. Six existing model tests pass, including 5514-row traversal comparison with only output opacity adapted; original oracle fixture unchanged. This is a subtle visual adjustment, not an algorithm or ownership change. Runtime is unchanged pending this feature-specific deployment approval. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-atom-subtle-tint.md.


## 2026-10-03 ATOM subtle tint approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk), confirmed_by_user (OK就请部署)
update: supersedes / no_model_change

Approved ordinary row background opacity0.10->0.12 deployed to actual NEWERA. Only main.js copied; RGB palette, grouping, hashing, sorting, indexed0.5 marker, styles, manifest and README remain unchanged. Fresh byte backups, exact one-literal diff, runtime syntax, four-file three-way hashes and three protected runtime files verified. Main SHA-256: d723d655d074ecef31cbbcdced22f8945247e1729ac05d3dd702b93fd1f369c8. Existing six model regressions and independent implementation review passed. Actual loaded Obsidian was not reloaded; native visual confirmation pending user reload. Supersedes this tint package's deployment-pending status. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-atom-subtle-tint-deployment.md.
