# Reference Graph Widget

status: active
updated: 2026-09-27

## Collective projection

Source status: confirmed_by_user (meaning), confirmed_by_code (staged implementation only).

The user distinguishes a bare reference network from a collective that explains what each direction discusses. A linked list entry may have subordinate `关系` and `自指` fields. `关系` describes the source-to-target edge. `自指` describes the source note itself in that reference context; several such statements remain individually traceable. Markdown owns both texts. The graph is their read-only projection, not another owner or a card relocation mechanism.

Actual dot-address ancestry in the current neighborhood forms nested groups. `+` state continuation does not become dot ancestry. Group boundaries and real reference/EVA edges remain different layers. An unordered visual path can carry two directions, with separate semantic identities and details. Duplicate incoming/outgoing discovery of the same directed reference is one relationship.

The staged collective view uses the installed Ontology weighted constraint-grid helper as an optional, bounded geometry service. It does not read or write Hub business JSON or dialogue-layout.json. Missing capabilities, unsupported self loops or size/validation failures leave the original reference view available. This is heuristic layout, not a global optimality claim.

## Derived cache ownership

Source status: confirmed_by_user (explicit request to save and reuse unchanged graphs), confirmed_by_code (staged implementation).

This request supersedes the older no-SVG-cache recommendation for this specific feature. The implementation stores geometry JSON, not SVG or screenshots, under the reference plugin's `reference-graph-layout-cache/` directory. Source graph and annotations are rechecked before reuse. Canonical semantic projection, dimensions, groups, provider fingerprint and renderer policy determine the key. A fixed solver viewport is part of that policy; actual window resizing fits the same geometry. Current selection/highlight is not persisted into geometry.

Cache reads independently validate node/path identity, dimensions, grid, grouping and routing; a persisted success flag is insufficient. Hash files avoid a shared mutable index. Hard per-file size limits and best-effort bounded eviction keep this derived asset separate from settings and user content. JSON Asset Registry classifies it as `derived-cache` without acquiring mutation ownership.

## Delivery evidence

- Candidate: `state/staging/reference-collective-20260927/`; baseline backups: `state/backups/reference-collective-20260927/`.
- [Engineering trace](../../../../REFERENCE_BOUNDARIES.md#ref-264)（外部来源未随包提供）.
- [Address semantics](../knowledge/mermaid-address-semantics.md), [dialogue drawing](../workflows/dialogue-graph-drawing.md).
- On 2026-09-27, after explicit user approval, the five reviewed files were deployed to the proven NEWERA runtime. Runtime/Dev/Mirror hashes match; independent deployment verification PASS. [Deployment trace](../../../../REFERENCE_BOUNDARIES.md#ref-265)（外部来源未随包提供）. Native plugin reload and loaded-host acceptance remain pending; browser fixtures and solver replay are not native Obsidian acceptance.

2026-09-29 loading correction: user observed old diagram flashing before collective view. Code confirmed eager Mermaid generation/rendering and100ms post-render wait before collective mount/cache access. Candidate starts collective directly and lazily initializes legacy renderer only on explicit 原引用图 selection, then reuses it within that widget. A separate legacy host owns all pan handlers; serialized switching and closed-host checks prevent late work from reopening UI. Missing collective keeps legacy fallback; ambiguous/error states retain mode switch. Semantic source validation and geometry cache identity/ownership unchanged. Browser mock-host + actual solver smoke confirms zero eager Mermaid calls, one explicit legacy draw, cache reopen without extra solve, close-during-render cleanup. Real host speed not yet timed.

Publication2026-09-29: reviewed core-script.js synchronized to Runtime/Dev/Mirror SHA256 59820FE2CC17BB9B4D8D4802F8F386CA0B7F5CFAA39A26F690691137E17D1D0C. Independent syntax/core-smokePASS. Native reload pending. Trace change-records/2026/2026-09/20260929-reference-lazy-render.md.

2026-09-29 shared-layout and full-label correction (confirmed_by_code; browser fixture verified): canonical projection sorts stable node identities, semantic edges and visual paths before IDs/hashing; generated discovery semantic IDs are excluded. The same graph reached from another node reuses geometry and applies current selection at draw time. Different BFS neighborhoods still invalidate; older ordering caches can miss once. Relation text is complete with wrapping, collision-aware local placement or full side callouts with leaders; callout boxes avoid prior captions. Cache ownership/validation and Markdown ownership unchanged. Only collective-graph.cjs deployed Runtime/Dev/Mirror after independent PASS. Native reload/acceptance pending. Trace: change-records/2026/2026-09/20260929-reference-shared-cache-labels.md.

2026-09-29 readable popup correction (confirmed_by_user screenshot; confirmed_by_code): previous vertical captions were displaced along Y and collided with their own vertical route. Placement now uses perpendicular offsets (left/right for vertical, above/below for horizontal), bounded width/fraction/gap candidates, and unchanged collision/full-text fallback checks. Default camera uses readable scale1.15 centered on current node; R fits all, details are initially collapsed and revealed on request. Resize preserves camera center and scale; observer cleaned on redraw/dispose. Popup occupies viewport minus16px with8px top/right inset. Geometry/cache/provider contract unchanged. Runtime/Dev/Mirror core-script.js + collective-graph.cjs synchronized after independent PASS. Browser fixtures/actual solver tested; native acceptance pending. Trace: change-records/2026/2026-09/20260929-reference-readable-popup.md.

2026-09-29 session lookup and background verification (confirmed_by_code; verified browser/mock host + actual solver): plugin owns bounded ephemeral raw-parser and graph-snapshot caches. Exact validated query uses path/settings/epoch and30s freshness bound; node membership is only a preview candidate, never proof of identical neighborhood or active EVA overlay. Path-specific one-use graph hint supports graph navigation. Per-file raw parsing is shared, but link destinations are resolved again each build. Vault create/modify/delete/rename, metadata resolved and EVA changes invalidate graph epoch conservatively, including new incoming links from outside graph. Rename/delete/refresh clear snapshots; pending generations cannot repopulate invalid entries. No persistent new index or business writes.
Cached graph paints before background verification; pre-popup JSON title load removed. Changed graph prepares offscreen and replaces old only when ready/current; failures retain old with explicit status. Camera sampled at commit preserves latest pan. Plugin close/unload cancels publication and cleans listeners/observers/timers. Explicit refresh bypasses session cache. Four production files deployed after independent PASS. Session cache resets on reload; geometry disk cache survives unchanged. Native latency unmeasured. Trace: change-records/2026/2026-09/20260929-reference-session-cache.md.


## 2026-10-01 Cross-restart reference evidence and graph previews

status: repository_verified_runtime_pending
source_status: confirmed_by_code
update: refines

Reference Graph Widget 0.1.1 extends the previous session-only parser/graph cache with owner-private session-snapshot.json. Existing persistent geometry is unchanged. On first explicit graph opening, native capability and scope are checked and bounded disk evidence is loaded. Unchanged body parse results may be reused after current file evidence matches; every graph restored from disk is an unverified preview, followed by a current links/backlinks/EVA rebuild. A persisted signature cannot certify the old graph. No startup whole-vault scan is added.

Scope includes real vault/plugin directory, device, platform, plugin version and executed engine/parser hashes. Same-device native identity, size, mode, birth/change/modified times plus host stamp protect reuse; a temporary capability probe checks change-time behavior and is removed. Metadata evidence is not cryptographic content attestation. Unsupported native storage falls back to session-only behavior; missing per-file proof requires fresh vault.read. Epoch/engine/disposal guards reject late hydration and publication. Offline same-size edits with restored mtime, replacement and deletion are covered by local NTFS fixtures.

Limits: envelope24 MiB, parsed-body entries512 /16 MiB, graphs16 /8 MiB; caches are disposable and bounded, not business storage. JSON business sources are not persisted as parsed-body evidence. Checksum, scope, path and rendering-field schema failures discard cache. Writes are serial and coalesced over1 second; unload cancels queued writes, so very recent cache work may need regeneration. Write failure leaves graph use operational. Existing graph events, commands and geometry protocol remain unchanged. Registry0.1.4 classifies only the exact cache path as derived-cache; it does not restore the cache.

Evidence:16 native filesystem fixture groups, existing session/lifecycle regressions and mocked-browser restart preview/incoming/EVA checks. No native UI speed claim. [Engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-266)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Reference Graph Widget0.1.1 and JSON Asset Registry0.1.4 reviewed program/document bytes installed in proven NEWERA runtime. The first explicit graph use seeds the bounded restart cache; later openings may reuse unchanged parsed sources after native proof checks. Restored graphs are previews and rebuild current links/backlinks/EVA. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-267)（外部来源未随包提供）.
