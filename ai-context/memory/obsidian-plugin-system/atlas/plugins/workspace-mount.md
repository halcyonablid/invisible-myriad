# Plugin: workspace-mount

## 2026-10-24 默认来源解析与canonical读取边界

source_status: confirmed_by_code（r29及真实数据隔离调用）；native_effect: pending；update_type: corrects/refines。

新读取分支必须保留owner默认短名解析语义，不能把原始配置直接当canonical路径。默认来源需要同时守住原始配置、解析器/元数据入口引用、解析结果和TFile身份；显式canonical请求继续精确核验，不受无关默认设置变化影响。异步前后重解析可防同名映射变化，但应如实计元数据枚举成本，不能沿用PEO缓存纯读零扫描结论。此小修不改变内容owner/资格/持久化，不解决全部启动pending。

证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r29-project-startup/FINAL-CODE.md、PREFLIGHT.md；实时排期只见state/PLAN.md。

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-03

## Role

status: confirmed_by_memory

Workspace Mount is the project material and tab/item carrier layer.

It provides workspace tabs, item structures, bound notes, and material containers used by Project Overview as execution anchors or evidence sources.

## Owns

status: confirmed_by_memory

- Workspace tabs and tab items.
- Workspace item bound note behavior.
- Live Workspace environment/view state exposed through the passive direct-control API.
- Workspace content JSON, distinct from state-capsules environment state.
- Paradigm tag keyword sidecar data for the paradigm panel.

## Provides

### Context-key rename scope correction — 2026-10-01

User explicitly limits cross-plugin rename to **Tab capsule keywords**. Paradigm tag keywords, project-entry comment declarations, Tab names and source titles are excluded from normal rename, same-address repair and failed-job recovery. Prior code included the first two excluded stores; do not treat its historical capability as current authorization. Recovery implementation passed independent review and is deployed to runtime/dev/mirror; native reload and interaction remain pending; details and evidence live in [Context Capsule Key](../knowledge/context-capsule-key.md).

The owner-local V2 recovery API freezes Tab carrier/source identity, rereads persisted assignments and shares serialization with Tab keyword saving. No UI activation is required to read/commit. This is distinct from Workspace ordinary item keywords and paradigm content.

status: confirmed_by_memory

- Bound note lookup/open APIs for workspace nodes.
- Workspace item identities consumed by EVA and Project Overview.
- Project/material containers that may appear in Project Overview columns.
- Read-only project-entry title snapshot for Mandala Workspace weekly summary fallback.
- Canonical source-note resolution for global APIs that create, ensure, open, wait for, or snapshot Workspace project entries.
- Paradigm tag keyword entries inside the Workspace Mount paradigm panel: one keyword resolves to one paradigm tag, while one paradigm tag may own multiple keywords.
- Paradigm item comment keyword entries inside the Workspace Mount paradigm panel: keywords parsed from `---` blocks in paradigm item comments resolve directly to the owning paradigm item row.
- A versioned `ontologyIndexProvider` for bounded paradigm-owner discovery, summary, pagination, standard Ontology opening and exact source reveal.
- A passive direct-control surface at `window.__workspaceMountPluginApi.getBridge()` / `ensureBridge()`; the returned live bridge exposes `getState()` / `applyState()` without an active Workspace BUS lease, heartbeat, watchdog, or mutation-time publication.

## Ontology Discovery Provider

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending

- Family `workspace-paradigm` lists every canonical paradigm item in the declared source scope, including valid empty Ontology owners.
- Summary does not leak structure or body. Paged descriptors hydrate bounded recursive structure counts only for returned rows.
- Provider-owned strict reads distinguish missing owner data from corrupt JSON; malformed/stale cursors fail closed.
- Open/reveal revalidates stable `sourceNotePath + paradigmId + itemId`, provider lease and cancellation before modal or focus side effects.
- Workspace remains both formal paradigm owner and editor owner. Ontology Meta Hub is only the consumer/reducer.

## User Practice

status: confirmed_by_user

- New Workspace Mount project entries in the Project Overview workspace project-list tab are intentionally inserted at the top. This is the user's habitual workflow and should not be treated as a sort/order bug.
- Workspace Mount ordinary child entries are intentionally inserted as the first child of the selected parent, while the "add same-level below" action inserts the new entry immediately after the current entry in the same sibling order. This preserves both quick top-capture for children and in-place expansion for peer notes.
- Workspace Mount item-add icon semantics are shared by ordinary Tab entries, paradigm definition entries, and mounted paradigm rows: `＋` means add a same-level entry after the current row, while `↳＋` means add a child entry under the current row. Mounted paradigm rows expose both local Tab actions (`＋` / `↳＋`) and definition-source writeback actions (`源＋` / `源↳＋`) so local expansion and source-paradigm expansion are not conflated.
- Workspace item ids such as `item_m...` are implementation ids. User-facing summary views should resolve them to readable project titles when possible.
- Paradigm tag keywords are used as stable one-to-one symbolic handles for paradigm-tag meanings. They reduce ambiguity when a broad paradigm tag covers multiple paradigms, because clicking a keyword has a unique expected target.
- Paradigm item comment keywords are lightweight local locating handles. The user can write a block such as `---` / `009B- 631所报一下VOR需求` / `---` inside a paradigm item's comment; Workspace Mount projects it into the paradigm panel as a clickable entry that expands the item's owning paradigm editor and scrolls to the item.

## Consumes

status: confirmed_by_memory

- EVA relation system for cross-view relations.
- Mandala add-project calls as triggers, without accepting Mandala's source note as Workspace ownership.

## Guardrails

status: confirmed_by_memory

- Restore should apply environment/view state only; it must not normalize or rewrite business JSON.
- Bound note APIs should be used by aggregators instead of duplicating note-binding logic.
- User-facing UI should show readable titles, not raw item ids.
- If a downstream consumer needs Workspace project titles and Project Overview's derived snapshot is unavailable, prefer Workspace Mount's owner read-only snapshot API over direct JSON reads.
- Workspace Mount global APIs should resolve missing or configured `sourceNotePath` values to the full canonical source path before calling view open/wait/create/snapshot flows.
- Do not let a caller's Mandala `sourceNotePath` become the owner source for Workspace project primary keys.
- Do not mix paradigm tag keywords with Tab item keyword trees or `Workspace_TabCapsuleKeywords.json`. Paradigm tag keywords belong to the paradigm panel and resolve to `paradigmTagsById` tag ids.

## Selective Synchronization Performance Guardrail

status: confirmed_by_code

runtime_evidence: runtime_synced_p1_host_verified

Workspace Mount performance work should reduce actual normalization and paradigm-projection work, not add polling, background hydration, persistent cache files, or deferred work that merely hides foreground cost.

The confirmed Phase 2B dispatcher follows these rules:

- Mutation scope is fail-closed: unknown, malformed, stale, repair, load, cross-Tab, paradigm-definition and business-domain mutations use full synchronization.
- A selective request is trusted only when its projection token matches the exact Workspace data reference, source note path, canonical data path, load request epoch and non-empty current revision.
- The final trust decision occurs inside the same-dataPath writer queue after authoritative reread. The raw authoritative `lastModified` must be present and exactly match the trusted revision; normalization must not manufacture trust for a file whose raw revision is absent.
- Reload, source/path changes and Bridge memory replacement invalidate projection trust. Trust is rebound only after a successful full load or committed transaction; callback or write failure preserves the prior live data and trust state.
- `none` is an exact production allowlist. In addition to active Tab selection, Tab-tree collapse and paradigm-tree collapse, an Ontology owner-body save may request `none` because mounted projections do not consume Ontology body or source-item `updatedAt`.
- Ontology `none` remains fail-closed: token identity, data reference, source, path, load epoch or revision mismatch automatically falls back to full synchronization and repairs all Tabs.
- The `tabs` mode is tested dispatcher infrastructure but has no production caller. A future caller requires its own dynamic equivalence evidence, performance measurement and verifier gate.
- The optimization preserves schema, public APIs, events, persistence format, ownership and deterministic visible behavior.

Evidence: `memory/obsidian-plugin-system/change-records/2026/2026-07/20260713-150417-workspace-mount-phase2b-selective-paradigm-sync.md` and `memory/obsidian-plugin-system/change-records/2026/2026-07/20260727-193444-workspace-mount-ontology-p1-trusted-projection-skip.md`. Bayesian update: `refines` the existing ownership and restore guardrails with queue-time authoritative revision proof for an additional exact allowlist entry.

Host evidence after deployment confirms the Ontology allowlist path with `requestedMode=none`, `appliedMode=none` and `tabCount=0`; diagnostics completed with no pending work. This validates P1's work-elimination contract, but it does not establish end-to-end latency success. A later concise snapshot containing two Ontology transactions measured separate `workspace.audit.finish` spans of `2.1 s` and `10.2 s`, confirming that the external audit provider can dominate close latency after Workspace projection work has been removed. Operation Audit Trail remains the owner of any physical audit-write optimization; Workspace Mount must retain its synchronous audit call contract.

## API Source Path Boundary

status: confirmed_by_memory

Workspace Mount owns the source note for Workspace project entries. When a global API call omits `sourceNotePath`, Workspace Mount resolves its configured default source note through the same source-file path resolution used by the view. The resolved full path is then used consistently for activation, waiting, creation, context-tab ensuring, and Project Overview snapshot APIs.

This allows Mandala to trigger one-click add-project without passing `九宫格目标.md` as a Workspace source. It also prevents basename/full-path mismatches such as `④workspace挂载.md` versus the full vault path from causing `workspace-view-unavailable`.

## Paradigm Tag Keywords

status: confirmed_by_user_and_code

Workspace Mount owns `Workspace_ParadigmTagKeywords.json` as a sidecar content file resolved relative to the source note folder.

Contract:

- The store is keyed by normalized keyword.
- One keyword can bind to only one Workspace Mount paradigm tag.
- One paradigm tag can own multiple keywords.
- Keyword clicks resolve `keyword -> paradigmTagId`, then reuse the existing paradigm tag filter chain. The tag filter state remains tag-id based.
- The sidecar is content-side Workspace Mount data, not state-capsules environment state.
- The sidecar is distinct from `Workspace_TabCapsuleKeywords.json` and from Tab ordinary item keyword trees.

User-facing meaning: a paradigm tag can still be a broad grouping/filtering structure, while a paradigm tag keyword acts as a unique symbolic port into a specific tag meaning.

## Paradigm Item Comment Keywords

status: confirmed_by_user_and_code

Workspace Mount can derive lightweight paradigm item keywords directly from paradigm item comments.

Contract:

- The source remains the paradigm item `comment` field in Workspace Mount's normal content JSON.
- A keyword block is delimited by standalone `---` lines.
- Each non-empty line inside such a block becomes a clickable paradigm item keyword.
- The panel renders these comment-derived keywords in the same capsule/drawer visual grammar as Tab item keyword drawers, but under distinct `workspace-paradigm-item-keyword-*` classes.
- When a paradigm is mounted under a Workspace Tab, the mounted paradigm block also renders a scoped `本范式条目关键词` drawer. This scoped drawer only collects mounted items whose `sourceParadigmMountScopeId` belongs to that paradigm node in the current Tab.
- Clicking the keyword opens the paradigm panel, clears tag filters if needed, expands the owning paradigm's item editor, and scrolls to the concrete paradigm item row.
- Clicking a scoped keyword leaf inside a Tab-mounted paradigm block scrolls to the corresponding mounted Workspace item in that Tab, not to a cross-paradigm filter.
- Tab-mounted scoped keyword leaves should display user-facing paradigm item titles only, following the Keyword Index leaf-entry style; internal paradigm item ids such as `pgItem_...` are implementation details and should not be shown in the mounted projection.
- Each concrete paradigm item row also renders its own comment-derived keywords inline. The same inline chips appear on the mounted Workspace item row when the paradigm item is projected into a Tab.
- Each paradigm row in the paradigm management panel renders a scoped `条目关键词` summary area that aggregates comment-derived keywords from that paradigm's own items.
- Paradigm item comment keywords are not rendered as a top-level global index in the paradigm panel toolbar. The toolbar-level index belongs to paradigm tags and paradigm tag keywords; item comment keywords stay scoped to their owning paradigm row, concrete item row, or Tab-mounted paradigm projection.
- Workspace item reveal accepts mounted paradigm items as reveal targets, so scoped mounted keyword clicks can scroll to `sourceType: "paradigm"` rows.
- No new sidecar JSON is created.
- These keywords are distinct from `Workspace_ParadigmTagKeywords.json`, Tab capsule keywords, and Context Capsule Keys.
- They do not use Tab keyword BUS behavior or Tab keyword drawer expansion state.

User-facing meaning: comments can carry tiny local locator handles for concrete paradigm entries without forcing the user to create a full tag, sidecar keyword, or capsule-level symbol.

## Paradigm Ontology Recursive Tables

status: confirmed_by_code

runtime_evidence: runtime_synced_recursive_ui_and_p1_host_verified

Workspace Mount paradigm definition items may own an embedded Ontology document. The definition-source `pgItem_*` remains the single owner; mounted paradigm rows resolve the same document through `sourceParadigmItemId` and do not copy it.

Contract:

- The document separates shared form from instance content through stable `schemasById` and `tablesById` identities.
- A column may declare one `childSchemaId`; cells in that column may each own an independent nested table instance through `nestedTableId` while retaining ordinary parent-cell `value` text.
- Recursive navigation labels identify the parent row rather than the parent cell. The row name is the normalized value from the current first ordered column (`columnOrder[0]`); a structurally valid blank name falls back to `第 N 行`, while malformed row/column ownership fails closed instead of exposing a misleading label.
- Column labels are presentation fields. Renaming a column does not change `columnId`, `childSchemaId`, nested table identity, or nested content.
- A column may carry an optional multiline `description` explaining why the column exists, what belongs in it and how completion is judged. Missing means empty; clearing removes the field, so merely opening an old document does not migrate it or change its hash.
- Column-description editing is a child input modal admitted against frozen `schemaId + columnId`. Save rechecks owner writability, active/archive state, Shared-Schema authority and the full document byte limit; rejection keeps the input open. Parent close/forced teardown first settles the child into the parent draft, while parent minimize is blocked until the child is saved or its changed input is explicitly discarded through confirmation.
- Ontology document schema v2 separates active `columnOrder` from `archivedColumnOrder`. Ordinary column deletion now archives and hides the column while retaining its stable ID, direct values, image references, child-schema link and every recursive table instance.
- Archived columns remain available through two separate paths: `查看归档` projects their text, compact image album and existing recursive child tables read-only without changing the draft, while explicit restore reactivates the same stable ID. Read-only status follows the complete `parentCellRef` ancestor chain, so every descendant reached through an archived column remains inspectable but cannot mutate rows, columns, text, images or child tables. Archived albums disable add, paste, drop and confirmed removal; low-level image removal, queue admission and asynchronous preparation repeat the same guard. Rename and restore preserve `columnId`; every new column receives a fresh ID and all current/retired IDs remain in document-level `reservedColumnIds`.
- Provider schema compatibility is additive: it reads v1-v2 and writes v2. A v1 document is upgraded only in the editor draft and is not persisted until an owner save; an old v1-only provider rejects or read-only protects v2.
- Row deletion is narrower than column lifecycle in this release: any direct text/image content or any non-empty recursive branch blocks deletion before confirmation and before mutation. Only a fully empty row and empty nested scaffolding may be physically removed.
- The modal uses a recovery draft plus an authoritative data-path mutation queue; normal dirty close commits at most once, and conflicts preserve the draft instead of overwriting newer formal data.
- Ontology owner-body edits request no paradigm synchronization only when queue-time authoritative projection trust passes. Any missing or stale evidence falls back to full synchronization. Full render, recovery, audit and the single authoritative owner-JSON write remain unchanged.
- No polling, background index, business sidecar, persistent cache or write-on-render behavior is introduced.

User-facing meaning: recursive sub-tables can be treated as editable local detail without turning completed content into invisible orphan data. Empty scaffolding remains disposable; actual recorded content requires an explicit cleanup decision.

Deletion and external-owner boundary:

- A paradigm item that owns any non-null `ontology` value cannot be deleted. The guard is ownership-based rather than content-based, so schema-only documents and malformed primitive/array values also fail closed.
- The same guard covers direct item deletion, deleting an ancestor subtree, deleting through a mounted projection, and deleting the source paradigm. Deleting a reference-copy paradigm remains allowed because it does not remove source items; deleting a category remains allowed because it reparents paradigms without deleting them.
- Mounted deletion freezes the mounted item, Tab, source paradigm/item, mount scope, and binding root. It rechecks that identity from authoritative transaction data and derives the deletion source and subtree only there. Any identity, Ontology, or subtree drift cancels the confirmation with zero completed business writes.
- `window.__workspaceMountPluginApi.ontologyEditor` is a versioned UI/provider contract for external owners. It supplies the recursive editor, one-cell initial document, validation/hash helpers, image album, optional column descriptions, CAS conflict handling, provider-generation leases, single-live-editor admission and durable-close coordination; it does not become owner of an external plugin's formal Ontology or recovery store.

Evidence: `memory/obsidian-plugin-system/change-records/2026/2026-07/20260727-133148-workspace-mount-paradigm-ontology-deployment.md` and `memory/obsidian-plugin-system/change-records/2026/2026-07/20260727-193444-workspace-mount-ontology-p1-trusted-projection-skip.md`. Bayesian update: `refines` Workspace Mount's paradigm ownership, no-ghost-data and selective-synchronization guardrails. Framework Question Map and Skill remain unchanged because this is a plugin-specific contract implemented under existing release rules.

## Paradigm Ontology Cell Image References

status: confirmed_by_code

runtime_evidence: runtime_synced_hidden_embed_projection_single_footer_static_verified_ui_smoke_pending

Ontology value cells may combine ordinary text, one or more local image references, and a recursive child table under Ontology schema version 2; v2 adds column lifecycle metadata without changing the cell image-reference format.

Contract:

- Image references are stored as Obsidian Markdown/wiki embeds inside the existing `cell.value`. Workspace JSON stores reference text only; image bytes remain vault attachments.
- External image imports use Obsidian's attachment APIs to choose an available attachment path, create the binary file, and generate a source-note-relative Markdown link. Dragging an existing vault image creates a reference without copying the file.
- Accepted external formats are PNG, JPEG, WebP, GIF, and BMP after MIME, extension, and magic-signature checks. SVG and unknown/active formats are rejected. Limits are 20 files per batch, 25 MiB per file, and 100 MiB per batch using actual buffer bytes.
- A value cell with images renders one compact album launcher rather than one inline tile per image. The launcher uses the first resolvable image as its cover, reports the total count, and bounds unresolved-count display; the large child album owns the complete scrollable thumbnail set, captions, preview, add, drop, paste, and confirmed removal controls.
- The textarea is a visible-text projection, not a second content field: parser-recognized image embeds remain in canonical `cell.value` but are hidden from the editor. Text input re-resolves the live cell by stable identity, preserves exact hidden-token order and duplicate count, and transfers manually typed image embeds into the hidden projection once. Rendering performs no canonical write or whitespace normalization.
- The compact album and cell actions share one footer row whose DOM, visual, and keyboard order is stable: `创建子表/进入子表` first at the left edge, `删除子表` immediately after it when present, the album as the flexible middle region, and `添加图片` fixed at the right edge. At the existing 220 px minimum cell width the album alone may shrink or hide secondary cover/open affordances; all action buttons remain fully visible, fixed-size and non-wrapping. Empty image projections collapse, and row deletion remains in the independent row-tools column.
- The cell textarea and its open album accept clipboard images. Image `clipboardData.items` take precedence over `files`; multiple images preserve order, nameless files receive unique MIME-derived names, ordinary text-only paste remains native, and blob/base64 data never enters `cell.value` or Workspace JSON.
- The album is an ephemeral child view over the parent Ontology draft. It owns no draft copy, recovery record, import queue, JSON writer, attachment deletion path, sidecar, or schema. One parent keeps at most one live album per stable cell identity.
- A cell with non-empty `nestedTableId` receives an established visual state even when the child table is structurally empty. This state is a read-only projection of `nestedTableId`; rendering, opening, or refreshing it performs no data normalization or write.
- Removing one album tile removes only that exact embed token after confirmation; it never deletes the vault attachment.
- Every thumbnail removal must pass through a destructive confirmation modal. Cancel, `Esc`, backdrop/implicit close, and confirmation failure leave the draft unchanged. The operation freezes `{tableId,rowId,columnId,start,end,token}`, re-resolves that exact occurrence after confirmation, and fails closed if the draft, target, pending-import state, recovery conflict, parent close, or forced teardown changes while confirmation is open.
- Imports are serialized per modal and re-resolve the target by stable `tableId`, `rowId`, and `columnId` after every asynchronous boundary. Close and forced teardown immediately invalidate child albums and reject new imports, while every batch admitted before the latch retains a parent-owned admission token and drains before final save/close. UI-render failure cannot cancel owner work or leak admission/pending state.
- Pending album deletion confirmation also carries a child lifecycle token. If the album or parent becomes invalid while confirmation is open, deletion fails closed; an already-admitted import is not cancelled merely because the child view closes.
- External creation follows prepare -> durable recovery -> binary create -> final-link recovery. Once a binary may exist, either formal Ontology data or the latest durable recovery retains a full-path reference.
- Recovery persist and clear are serialized as detached plugin-data snapshots. Live recovery state is published only after its corresponding save succeeds; current session authority filters stale in-process records.
- Forced teardown joins one terminal Promise. It accepts an exact durable recovery, falls back to one CAS-protected owner commit only for an ordinary non-conflicting draft, and fails closed before modal finish, leaf detach, or API cleanup when both persistence paths fail.
- Multi-modal view close and plugin unload use a prepare-all barrier before any modal is finish-closed.
- Destructive-action confirmations report relevant image-reference counts, but deleting a reference or table structure never assumes ownership of attachment-file deletion.

User-facing meaning: Ontology cells can carry visual evidence alongside text and recursive detail while preserving Obsidian's normal local-attachment model and the system's no-ghost-data boundary.

Evidence: `memory/obsidian-plugin-system/change-records/2026/2026-07/20260729-091500-workspace-mount-ontology-cell-images.md`, `memory/obsidian-plugin-system/change-records/2026/2026-07/20260729-183000-workspace-mount-ontology-image-removal-confirmation.md`, `memory/obsidian-plugin-system/change-records/2026/2026-08/20260801-002000-workspace-mount-ontology-compact-album-clipboard.md`, `memory/obsidian-plugin-system/change-records/2026/2026-08/20260801-010500-workspace-mount-ontology-hidden-image-footer.md`, `memory/obsidian-plugin-system/change-records/2026/2026-08/20260801-013000-workspace-mount-ontology-footer-nested-first.md`, and `memory/obsidian-plugin-system/change-records/2026/2026-08/20260802-ontology-history-lifecycle-daily-completion.md`. Bayesian update: `refines` the existing Ontology content, recovery, teardown, no-ghost-data, child-view, editor-projection, recursive-action UI and schema-lifecycle contracts.

## Cross-Owner Ontology Cell References

status: runtime_synced_static_verified_ui_smoke_pending

- Workspace Mount remains the shared schema-v3 recursive Ontology engine and editor provider for both Workspace-owned paradigms and Mandala external owners.
- The editor accepts a Hub adapter for canonical cell/schema addresses, Meta capture, live source/backlink projections, exact jumps and formal-commit coordination.
- A referenced cell keeps its own ordinary text and images. While bound, A is the sole Schema owner; B's mapped projection hosts only B-owned rows and table instances.
- Source child Schemas reconcile recursively through stable mappings. B cannot mutate source-owned columns or create a new child Schema where A declares none; the UI and engine both reject that bypass.
- `编辑共享结构` opens A's exact `schemaaddr:v2` Schema-only editor. It permits structural edits without creating fake table/row instances and commits through A's native CAS/lease.
- Shared-Schema graphs are partitioned before reconciliation into `activeRoots`, `pendingDetachRoots`, and `invalidOrphanRoots`. Active roots still resolve and follow the formal source; pending-detach roots deliberately skip source resolution; invalid or malformed roots fail closed.
- On unlink, active lineage is removed recursively. Finalization is graph-level rather than parent-column-level: each reachable pending-detach graph is finalized once, preserving real local schema state as an independent fork or returning a proven-unused projection to an ordinary blank/local state. Detached source evidence remains bounded provenance, not a live `结构取自` relation.
- Primitive or otherwise malformed explicit `reference` properties are rejection evidence, not equivalent to an absent reference. This prevents damaged reference metadata from bypassing active-binding and close guards.
- If A removes a child Schema, reconcile prunes B's unused single-parent projection and records provenance. Any B instance or multiple parent dependency blocks and byte-equivalently rolls back the reconcile.
- Reference-bearing or lineage-bearing editors subscribe to Hub write capability. Provider generation/lease drift, unload, downgrade or incomplete proof participation immediately changes the open Modal to `引用能力已降级，只读保护`.
- Dynamic read-only cancels pending recovery timers, rejects new/in-flight image work at mutation boundaries, invalidates child albums, disables inputs/structure/save controls and blocks unlink/recovery/formal commit.
- Destructive confirmation uses a frozen draft hash plus a post-confirmation mutation-capability recheck, closing the race where a provider downgrades while confirmation is open.
- Plain Ontologies without reference or lineage state remain ordinarily editable when Hub reference capability is absent.
- Pending-detach UI is explicit: it shows `待解除` and hides source-open/manual-refresh actions that would incorrectly imply a still-active authority. Active bindings keep both actions.
- Dirty close is recovery-first. X, `Esc`, overlay close, and programmatic close may finish only after recovery succeeds; the editor also exposes `保留草稿并关闭` and `放弃草稿并关闭`. Unresolved active bindings cannot be bypassed by forced teardown, while late reconcile/refresh completions are lifecycle-token guarded from mutating a closed draft.
- Every rejected Shared-Schema operation emits `[Workspace Mount][ontology.shared-schema-rejected]` with schema/graph ids, source and target addresses, stage, code, message, pending-detach and save-block state, parent evidence, and aggregate reasons. The visible warning remains concise; Console carries the diagnostic basis.

Evidence: repository-dev engine/editor tests; Shared-Schema verifier `019fda36-df0e-78e1-92de-8cb4d44db112` final `PASS`; detach/close hotfix verifier `019fdb3d-daa0-76f2-8d2d-aab2fd638690` final `PASS`; and three-way deployed Workspace hash `29738D64DCBF44D672F7448007B12C459DBD82B4BE1E54A4AFA9D5A6F407C5C8`. Bayesian update: `corrects` stale retained-lineage and parent-column finalization semantics, and `refines` the shared-editor close/recovery/diagnostic boundary. Runtime interaction smoke remains pending after the next Obsidian launch.

## Unknowns

- Operational boundary between workspace tab items and Project Overview `范式积累` evidence needs user calibration.
- Whether certain workspace containers are project anchors versus reference/material areas.

## Ontology Nested-Table View Continuity And Minimize

status: repository_dev_static_verified_runtime_pending
updated: 2026-08-17

Workspace Mount's shared Ontology editor preserves the last valid nested-table context and can temporarily minimize an open editor without changing Ontology content ownership.

Contract:

- The editor stores an independent plugin-data sidecar named `paradigmOntologyViewState`. It records only the owner key, current table identity/path, generation, session identity and update time; it does not copy cell content, Schema, references, recovery drafts or scroll position.
- Reopening resolves context in this order: explicit focus cell, explicit focus Schema, saved nested table, nearest still-valid saved ancestor, then root table. Missing or restructured descendants therefore fail back to a valid ancestor instead of blocking the editor.
- Local Workspace owners and external owners that use the shared editor both route view-state persistence through Workspace Mount via `viewStatePlugin`; the formal Ontology and recovery Store remain with their existing owners.
- Navigation persistence is debounced and flushed on close/unload. `generation + sessionId` authority prevents an older modal from overwriting a newer modal's location; authority drift during plugin-data save triggers rejection and repair rather than stale in-memory publication.
- Sidecar retention is bounded to 512 records and 365 days. Pruning affects only navigation memory.
- External editor identity is the complete normalized tuple `ownerNamespace + ownerKey + canonicalSide + sourceNotePath`. Sequential and concurrent duplicate opens reuse one frozen handle, one generation and the first admitted writer callbacks; later callers only add close subscribers and exact focus requests. Owner-close barriers wait for matching in-flight recovery reads.
- Minimize hides the complete Obsidian modal container, releases its modal key scope once and adds an independent restore chip to a fixed tray. Multiple minimized Ontologies keep separate chips.
- A dirty minimized editor shows a non-shrinking warning icon and visible `未保存` cue on its own restore chip. Clean and dirty chips do not share state.
- Clicking the parent Ontology backdrop minimizes rather than saving or closing. Explicit `保存并关闭`, `Esc`, the close control and programmatic close retain the recovery-first close contract.
- Restore reacquires the modal scope once and returns to the same live editor and nested table. Close or plugin unload removes restore UI and rebalances scope even when the modal is minimized.
- Minimize is not close: it does not commit, discard, clone or suspend the draft. Existing dirty-close, recovery-first, CAS, reference and Shared-Schema protections continue to govern final close.

User-facing meaning: an Ontology can remain available while the user edits another Obsidian surface, and reopening it resumes at the last nested table rather than forcing repeated traversal from the root.

Evidence: repository-dev code and focused Ontology regressions; implementation verifier Huygens `01a00f0a-c682-7bc2-84ef-e169aead9e24` and lifecycle/column-description plan verifier Kepler `01a013b2-87d0-73d0-937e-f465bc789611` returned `PASS_WITH_ACTIONS`, and required actions were incorporated. Bayesian update: `refines` the existing recursive navigation, column-Schema and modal lifecycle contracts without changing formal ownership, reference semantics, recovery ownership or State Capsules boundaries. Runtime/Mirror synchronization and loaded Obsidian smoke remain pending explicit confirmation.

## Corrupt Shared-Schema Address Recovery

status: runtime_synced_static_verified_user_smoke_passed
updated: 2026-08-07

- A durable recovery draft whose `schemaaddr:v2.authorityStableRef` has already collapsed to a non-object value such as `"[object Object]"` remains blocked by ordinary reconcile/save admission. Workspace never invents the missing authority or edits formal owner data to make the address look valid.
- The editor may offer `保留当前结构并转为本地` only when the modal came from durable recovery, the failure chain is address-related, and recursive parent-cell proof finds zero valid references and zero malformed reference evidence. Any extant A -> B reference keeps the action hidden and the draft fail-closed.
- The explicit action recursively removes active Shared-Schema lineage from the affected local graph, preserves tables/cells/images and bounded provenance, validates the resulting local document, and persists a replacement recovery draft. It performs zero formal commits.
- Recovery persistence failure rolls the modal draft back byte-equivalently. A later `保存并关闭` is a separate owner-CAS publication; recovery never bypasses the normal owner lease, conflict or formal validation gates.

User-facing meaning: once the user has explicitly removed the last valid reference, a corrupted historical draft can become an ordinary local Ontology again. If any reference evidence remains, Workspace refuses to guess.

Bayesian update: `refines` recovery-first close and Shared-Schema detach safety. This historical recovery deployment used Workspace hash `AE349D4B...8D14741`; deployment verifier `019fdc88-fafe-7e90-ab1f-0b30f9e68fab` returned `PASS`, and the user later confirmed the intended interaction worked. The current Workspace artifact has since advanced to `7F2C677F...5AE9E9` for the 2026-08-08 exact-jump highlight deployment; that newer UI smoke remains pending until Workspace Mount is reloaded.

## Exact Ontology Cell Jump Highlight

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-08

- Exact Ontology navigation still resolves the canonical table/row/column address, centers the target and focuses its textarea after 120 ms.
- Workspace now keeps an independent `is-jump-highlight` cue for 2.4 seconds so the user can identify the destination cell after a cross-Ontology jump.
- Focus and highlight timers belong to the modal, remove themselves after firing and are cleared on repeated focus or close. Reduced-motion disables animation while retaining the static cue.
- The cue uses outline/background and does not replace existing reference/backlink `box-shadow` evidence. Address contracts, reference graphs, Schema authority, saves and owner JSON are unchanged.

Bayesian update: `refines` exact-navigation feedback only. Repository-dev and Runtime regressions confirm the lifecycle boundary; three-role hashes align and deployment verifier `019fdd72-985e-7b70-aa35-15d0f6cf90c7` returned `PASS`. UI smoke remains pending plugin reload or restart.

## Ontology Rectangular Content Clipboard

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-08

Workspace Mount's shared recursive Ontology editor provides a transient rectangular content clipboard for every owner surface that embeds the editor.

Contract:

- A selection is an existing `m x n` rectangle identified by stable table/row/column ids.
- The payload contains exact body text and source-resolved image attachment identities only. It never contains child tables, `nestedTableId`, Meta references, Shared Schema, lineage, backlinks or provenance.
- Images continue to reference the same Obsidian attachment files; target-relative embeds are regenerated and round-trip checked before paste.
- Destination shape must already exist and every target cell must be empty under raw fail-closed occupancy. No overwrite, merge or automatic row/column creation exists.
- The clipboard lives only on one loaded Workspace plugin instance, is scoped to the canonical vault path and Workspace editor generation, expires after 30 minutes, is capped at 4096 cells/1 MiB and clears on unload.
- Paste rechecks draft/lifecycle/order/clipboard/image state after confirmation and commits through clone-validate-swap with rollback-safe recovery scheduling.
- Range and Meta modes are mutually exclusive. Outside Range mode, native textarea/image clipboard, child-table and Meta behavior remain unchanged.

This capability refines the material-carrying/editor layer. It does not create a persistent owner, index, recurring-template system or new Workspace/Mandala provider contract.

Evidence: repository-dev Workspace code/styles and focused Workspace/Hub regressions; final verifier `019fdfc2-41c7-7c82-a915-9758018d93a0` `PASS`. After explicit confirmation, Runtime/Dev/Mirror align `6/6`, feature sentinels pass `10/10`, both Runtime regressions pass and eight business/environment sentinels remain unchanged. Deployment verifier `019fe070-b807-7231-90c6-49a3eba168eb` returned `PASS`. Actual UI smoke remains pending plugin reload or restart.

## Manual Scroll Pin Retirement

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-17

Workspace Mount no longer exposes or consumes its own manual workspace scroll pin.

Contract:

- The floating `.workspace-pin-btn` and its click-based persistent writes are retired from Workspace Mount surfaces. The separate `gtd-task-manager` implementation has its own retirement record and lifecycle.
- Ordinary current-session restoration remains available through the in-memory `ephemeralScrollByViewKey` projection.
- Explicit navigation and focus still outrank scroll restoration, including the existing temporary restoration-suspension window.
- Historical `pinnedScrollByViewKey` data is preserved as compatibility-only state. Defaults, normalization, bridge capture/apply and State Capsules round-trip remain intact, but Workspace no longer uses those values to choose a visible scroll position.
- No migration or cleanup rewrites historical plugin data. Hot reload only removes an already-mounted legacy `.workspace-pin-btn` DOM element.

User-facing meaning: Workspace Mount no longer contributes a fixed-position control; normal in-session return behavior remains, and old capsule/plugin data is not destroyed.

Bayesian update: `corrects` the old persistent-pin interaction and `refines` the Workspace scroll-restoration boundary. Dev, Runtime and Mirror program hashes align; loaded Obsidian UI smoke remains pending Workspace Mount reload.

## Ontology Read-only Tree Panorama

status: repository_dev_verified_runtime_pending
updated: 2026-08-19

Workspace Mount's recursive Ontology editor now has an additive `全景树` surface for overview work. It is a read-only Mermaid projection in the same Modal, not a second Ontology owner or an editable graph store.

Contract:

- The current live draft is projected without commit, normalization, schema migration or State Capsules writeback. Returning to `返回表格` restores the same nested table and unsaved draft.
- The root table is the panorama root. Each row becomes a row node, active columns form the row's ordered content chain, and a cell-owned `nestedTableId` branches to its child table. Only root-reachable tables through active columns are shown by default; archived columns and branches beneath them remain hidden in this projection.
- Cell labels strip image embed tokens and show only `图片 ×N`; attachment paths, internal image identities and child-table metadata are not exposed as label text. Mermaid-sensitive punctuation is escaped and labels are bounded.
- The projection has deterministic node, edge, source-byte and label limits. If a limit or malformed/repeated branch is encountered, the UI shows a visible `全景已截断` node and keeps the reason in the in-modal summary; no silent claim of completeness is made.
- Tree mode is mutually exclusive with Schema-only, Ontology Meta capture, rectangular Range operations, pending image import, active image album and unresolved column-description input. It hides mutation controls and the footer. Read-only Ontology remains viewable.
- Mermaid rendering uses an independent Obsidian `MarkdownRenderer` child and a render epoch. Late asynchronous completion is ignored after return, external focus, close or unload; cleanup removes component, pointer, wheel and fit scheduling resources.
- The viewport supports zoom buttons, fit/reset behavior, `Ctrl+wheel` zoom and pointer drag/pan. Zoom and pan are transient surface state and are not persisted as business data or environment state. Minimize/restore preserves the live panorama and defers fitting while hidden.
- External exact-cell or Schema focus exits panorama before changing table context, so cross-plugin reveal still lands in the editable surface.

User-facing meaning: Ontology can serve both as a deliberate framework-design table and as a temporary whole-structure view. The panorama reduces visual navigation cost without making the read-only overview a competing source of truth.

Evidence: Repository Dev staging projection tests and complete Ontology engine regression; independent implementation verifier Halley `01a01887-5bd7-7aa3-82a4-b7ec3178acd2` returned initial `PASS_WITH_ACTIONS` with no P0/P1/P2, then final `PASS` after the suggested interaction tests and reset control were added. Bayesian update: `refines` the Ontology projection/editor boundary. No new owner, business schema, bridge, provider generation, persistent cache or State Capsules field is introduced. Runtime/Mirror synchronization and loaded Obsidian UI smoke remain pending explicit confirmation.

## Workspace Content Snapshot Boundary And Layered Retirement Candidate

status: active_behavior_retirement_candidate_no_data_action
updated: 2026-09-03

Current facts:

- `confirmed_by_code`: Workspace Mount owns `snapshotsById` and `snapshotOrderByTab`, exposes content-snapshot create/restore/delete behavior, and restores a snapshot as a new Tab with fresh item identities. This is content duplication, not environment-state switching.
- `confirmed_by_user` + `confirmed_by_code`: State Capsules deliberately orchestrates Workspace environment switching through `workspaceCapsuleBridge`. Workspace Mount's provider state includes active Tab/order, Tab and item collapse maps, keyword-drawer expansion, paradigm-mount collapse maps, pinned-scroll state, and `visibleUiState`. Current State Capsules capture projects that provider state down to active Tab/count, Tab/item collapse, both paradigm-mount collapse maps, pinned scroll and `visibleUiState` (including `showSnapshotPanel`); it omits `tabOrder` and keyword-drawer expansion, although Workspace restore can still apply them when present in legacy stored state. State Capsules neither calls Workspace content-snapshot create/restore/delete nor owns snapshot content.
- A bounded scan of the current Repository Dev, Mirror and proven Runtime plugin code found no direct external consumer of the Workspace Snapshot methods or storage keys. This is a bounded code-surface result, not a universal claim that no historical, manual, or future use exists.
- A synthetic 8-Tab / 256-item / 8-snapshot fixture attributed 176,965 of 550,202 serialized bytes (`32.16%`) to the snapshot fields. This is synthetic size evidence only; it is not a measurement of real business data, UI latency, or production speed.

Decision boundary:

- Workspace Snapshot is an `inferred` optimization and retirement candidate, not a completed retirement.
- The safe candidate sequence is: stop or hide active/default creation entry and cease creating new snapshots; retain old fields as readable compatibility data; only after read-only real-data inventory, backup, explicit user disposition and migration verification, archive or delete historical snapshot data.
- Normalization or saving must not silently drop `snapshotsById` or `snapshotOrderByTab`. Existing create/restore/delete behavior remains factual current behavior until a separately authorized code change lands.
- Unknowns remain: whether real snapshots exist, whether any are still valued for content-level restore, and whether cold sidecar archival or explicit deletion is the right terminal disposition.

Bayesian update: the ownership split is `confirmed_by_code`; the bounded no-consumer scan and synthetic size probe reinforce investigation priority; the layered retirement path is `inferred`; real-data existence and user value remain `unknown`.

### State Capsules Bridge Performance Candidate

- `confirmed_by_code`: every open Workspace Mount view starts a bridge watchdog and host lease heartbeat on a roughly two-second cadence. Each successful `updateWorkspaceData()` renders and then calls `publishBridgeBusStateChanged()`, which constructs `getBridgeState()` and deep-clones the environment maps before publication. This producer work occurs even when no subscriber consumes the event.
- A bounded scan of the current Repository Dev, Mirror and proven Runtime code surfaces found the exact `workspaceCapsuleBridge` channel only in State Capsules and Workspace Mount. This supports a paired retirement candidate; it does not authorize removing the shared generic bridge bus used by unrelated contracts.
- A current-bundle synthetic no-subscriber probe measured the per-publication path at p50/p95 `0.1214/0.1997 ms` for 256 items and a 5,331-byte bridge payload; `0.4732/0.7123 ms` for 1,024 items and 19,085 bytes; and `2.2099/2.8127 ms` for 4,096 items and 74,102 bytes (300 samples per size). This shows size-dependent work in the synthetic model, not real Obsidian latency or a guaranteed production speedup.
- Expected effect: removing only State Capsules-side capture/apply/verify reduces explicit capsule save/switch work but has little ordinary-session effect when capsules are unused. Disabling the Workspace Mount side of this one bridge as well—registration, watchdog/heartbeat and mutation-time publication—should yield a small steady-state saving that grows with Workspace size and mutation frequency. At the 256-item fixture it is minor beside the hundreds-of-milliseconds full save/render path; real-host measurement is still required.
- Candidate boundary: preserve the independent Workspace content Snapshot feature; preserve legacy capsule `workspaceMount` data as inert readable compatibility; remove no generic bus or unrelated provider/API path; make no silent business-data rewrite.

This subsection records the pre-implementation candidate prior from earlier on 2026-09-03. Repository Dev's current state is defined by the superseding section below.

### Repository Dev Active Bridge Retirement

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-03

- `confirmed_by_code`: Repository Dev removes the Workspace-specific `workspaceCapsuleBridge` host registration, lease heartbeat, watchdog, queued BUS apply path, and mutation-time `state/changed` publication. Opening a Workspace view creates no Workspace bridge timers, and closing it has no Workspace bridge lease to retire.
- The passive Global API remains available at `window.__workspaceMountPluginApi.getBridge()` / `ensureBridge()`. It resolves the live view bridge directly, and callers can deliberately invoke `getState()` / `applyState()`.
- The shared generic bridge BUS and its one-time Workspace plugin initialization remain available for unrelated channels. This change retires only the Workspace-specific active transport.
- Workspace content Snapshot remains byte-for-byte outside the retirement slice: `snapshotsById`, `snapshotOrderByTab`, create/preview/restore behavior and restore-as-new-Tab semantics are unchanged.
- The paired Repository Dev State Capsules change no longer captures/applies/verifies Workspace state and preserves legacy `workspaceMount` payloads as deep-cloned, read-only inert compatibility data.
- Actual Runtime, Repository Dev and Repository Mirror now align on the retired active Workspace bridge. Workspace Mount is enabled in Actual Runtime, but the copy does not reload the already-running plugin; loaded UI behavior and real-host idle/mutation benefit remain `unknown` until reload and smoke measurement.

Bayesian update: `supersedes + refines` the earlier bridge-retirement candidate for Repository Dev only. It does not change the independent content-Snapshot retirement question.

Trace: `change-records/2026/2026-09/20260903-121700-workspace-active-bridge-retirement-staging.md`; deployment: `change-records/2026/2026-09/20260903-143500-workspace-active-bridge-deployment.md`.

## Lightweight Active Tab Switching

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-04

- `confirmed_by_code`: Repository Dev treats `activeTabId` as live environment state on the ordinary click path. A valid new selection updates a source-scoped, generation-stamped in-memory overlay, asks Obsidian for best-effort layout persistence when available, and rerenders only active-dependent Tab chrome, subtitle, TOC and content sections.
- Ordinary switching does not read or write `Workspace_Items.json`, emit `context-capsule-carrier:changed`, run legacy migration, register a bridge, or rebuild the complete Workspace DOM. A same-Tab click returns before generation, layout-save, Snapshot-panel lookup and render work.
- Genuine content mutations retain the existing owner transaction, persistence and carrier-event boundary. They seed the transaction with the initiating view's live Tab, allow the operation itself to choose another Tab, and reconcile against any newer user selection after commit.
- Reload, source switch and multiple live views are guarded independently: overlays are source-scoped; stale load/scroll tasks carry Tab and generation guards; a peer commit preserves each peer host's valid local Tab; a commit begun on source A cannot install or render into source B.
- Missing active-region anchors fall back to the existing full renderer while suppressing stale outgoing-scroll capture. Passive bridge/global API names and boolean behavior remain compatible. Workspace content Snapshot storage, schema and create/preview/restore/delete behavior are unchanged; the existing Snapshot panel may still be rerendered as one active-dependent region.
- Deterministic evidence: frozen candidate, Repository Dev, Actual Runtime and Repository Mirror align at `CF1457EAE9AA0372B5964999CF8BA5CD1088EAB52CD9FA6BAC71869EB4BF52E4`; syntax passes 3/3; active-Tab suite `19/19 PASS`; deployment verifier `PASS` with P0/P1/P2 zero. Protected business, Snapshot, setting, registry and non-target program fingerprints remained byte-identical.

User-facing meaning: changing the active Workspace Tab becomes a lightweight view transition rather than a whole-owner save and full-page reconstruction, while content changes and Snapshot operations retain their original durability semantics.

Bayesian update: the implementation `refines` the Workspace environment/content boundary; deployment adds `no_model_change` evidence. Synthetic counters prove avoided work, not production latency; loaded-host behavior and real-vault speed remain `unknown` until plugin reload and smoke measurement.

Trace: `change-records/2026/2026-09/20260904-011900-workspace-mount-active-tab-fastpath-dev.md`; deployment `change-records/2026/2026-09/20260904-014000-workspace-mount-active-tab-deployment.md`; staging `state/staging/workspace-mount-active-tab-fastpath-20260904-120000/`; deployment backup `state/backups/workspace-mount-active-tab-deploy-20260904-013500/`.


## 2026-10-22 S2-A1c 候选证据：真实视图内存查询

- observation → claim（confirmed candidate evidence）：full render、active-tab局部重建和关键词目录需要同一同步frame；局部重绘若可见语义已变化，必须转完整重绘，不能把旧胶囊树当成新状态。静默续租可复用画面，但交互续租必须核对provider、reader、来源和验证后的完整可见语义。
- Workspace文本编辑位于Modal（含最小化ontology）；host刷新不能把C2“备份成功”当作无编辑。候选拒绝编辑中换源、不在modal关闭时排队换源，保留既有owner写入与输入恢复。历史仍保留全部后代，异步失效不卸掉只读限制。
- source status：仅仓库候选/实际方法fakeDOM，独立终审及文档对账PASS（s2-a1c/FINAL.md），未部署/未原生验收。provider租期fallback仍可能完整重建，不证明新建主键提速。
- trace：[本批方案与义务](../../../../REFERENCE_BOUNDARIES.md#ref-289)（外部来源未随包提供）、[验证](../../../../REFERENCE_BOUNDARIES.md#ref-290)（外部来源未随包提供）。排期只由state/PLAN.md决定。


## 2026-10-24 r30：待核验自愈（confirmed_by_code / refines，原生待验）

PEO目录续期会在同内容下替换快照对象而不通知；跨越替换的"取pass→等待→再核验"流程会显示待核验，旧版只能等签名变化或用户点"重新核验"。r30在同构 `createLifecycle` 增加内部可选 `isPending`：目录ready且视图仍待核验时重绘一次，仍经原输入/加载/弹窗保护，重绘次数不超过check次数，自愈最长约一个周期（≤30s）。`main.js` 内 `__WorkspaceTrackingLifecycle`；`render()`→`_renderImpl()`→`adapter.run()`→`prepare()`。非公开契约。[证据](../../../../REFERENCE_BOUNDARIES.md#ref-291)（外部来源未随包提供）
