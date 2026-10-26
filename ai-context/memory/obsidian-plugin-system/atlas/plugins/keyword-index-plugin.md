# Plugin: keyword-index-plugin

status: draft_mvp
updated: 2026-07-14

## Role

status: confirmed_by_memory

Keyword Index is the symbolic entrance layer for the knowledge system.

It manages keyword capsules, drawers, BUS note growth, keyword notes, and cross-plugin keyword jumps.

## Owns

status: confirmed_by_memory

- `keyword_index.json` keyword records.
- Keyword capsules and drawers.
- Keyword-note registration and opening.
- Keyword nodeKey parsing/reveal behavior.
- BUS note creation behavior under keyword/drawer context.

## Subconcept Rule

status: confirmed_by_user

Subconcepts use `+SCON.` under drawer-folder context, such as:

`R...+BUS002...+SCON.电影`

Current user rule:

- subconcept belongs under a drawer folder;
- subconcept cannot directly contain another subconcept;
- subconcept can contain drawers;
- drawers under subconcept can contain subconcepts;
- UI should show subconcepts as capsule-like regions and hide `SCON.`.

First-letter locating prefixes may be used for visible grouping, for example `SCON.L雷达` displays under group `L` with visible label `雷达`. The raw identity remains `SCON.L雷达`.

## Provides

status: confirmed_by_memory

- Keyword node reveal/open API.
- Keyword notes for a keyword/drawer node.
- Antinet-oriented keyword identity and sort metadata.
- BUS note creation and tab placement behavior.
- SCON first-letter visible grouping without changing raw path identity.
- Drawer/subconcept ordering by direct node ATOM address where available, with descendant minimum ATOM address only as fallback for nodes without a direct anchor.

## Consumes

status: confirmed_by_memory

- EVA `openNode` as the primary cross-plugin jump route.
- Obsidian workspace leaf semantics for opening BUS-created notes.

## Guardrails

status: confirmed_by_memory

- Do not mix Mandala keywords into `keyword_index.json`; Mandala has separate keyword storage.
- Consumer plugins should not directly manipulate Keyword Index DOM.
- Cross-plugin keyword jump should prefer EVA `openNode(nodeKey)`.
- BUS note opening position depends on active leaf unless explicitly anchored to last markdown leaf.
- SCON visible grouping must not change raw `SCON.` path parts, nodeKey encoding, drawer expansion keys, EVA identity, or keyword JSON schema.
- Drawer and subconcept sorting may use note ATOM addresses, but parent drawer position must be decided by its own direct anchor when present; child/subdrawer addresses must not pull the parent ahead of its tree position. Unaddressed drawers should retain descendant-address fallback and then the existing BUS-number and label fallback.

## SCON Display Identity Boundary

status: confirmed_by_memory

SCON locator prefixes are display aids. `SCON.L雷达` can render as group `L` and label `雷达`, but the internal state, nodeKey, raw suffix path parts, and EVA identity still use the raw `SCON.L雷达` path. Ordinary English names such as `LLM` are not stripped as locator prefixes.

## Drawer Address Sort

status: confirmed_by_code

Keyword drawer and subconcept trees distinguish direct node anchors from descendant anchors. A drawer's peer-level position is decided by the minimum ATOM address of notes directly attached to that drawer when available. The minimum descendant ATOM address is retained as fallback only for drawers without a direct anchor. Addressed nodes sort by Antinet-style natural code order; addressed nodes sort before unaddressed nodes; unaddressed nodes preserve existing BUS-number and label fallback behavior.

This prevents a child drawer or subconcept with an earlier ATOM address from pulling its parent drawer ahead of the parent's own tree position. Example: `BUS030.822雷达的工程调查` is positioned by its direct anchor `ATOM@121.001.007.002.245.030`, while child drawer `BUS001A.工作流雷达之前的制卡` may carry `ATOM@121.001.007.002.231.018` only inside the `BUS030` subtree.

## Symbol Dialogue View

status: confirmed_by_user

Keyword Index has two complementary reading surfaces:

- the full network is the system-wide symbolic intake and editing entrance;
- Symbol Dialogue is a bounded current-attention work surface.

This lets the user mark a small number of notes while retaining enough local context to understand and enrich the selected symbolic region.

status: confirmed_by_code

Strict parsed frontmatter boolean `符号对话: true` is a local-context seed, not a final per-note allowlist. A seed retains the keyword capsule and keyword ancestors, then projects its drawer neighborhood through composable node capabilities rather than a mutually exclusive scalar precedence:

- drawer ancestors remain structural and do not expose unrelated direct notes;
- the selected drawer retains its complete descendant subtree;
- same-level ordinary drawer and SCON peers remain as shallow nodes with direct notes only;
- unrelated branches remain hidden;
- multiple seeds merge deterministically by combining `ancestor`, `shallow`, and `full` capabilities;
- when one node is both a shallow peer for one seed and an ancestor of another deep seed, it retains its direct notes and still traverses only the branches needed to reach that deep seed.

The projection is transient and read-only over existing Keyword registrations and Obsidian metadata cache. It does not add fields to `keyword_index.json`, change nodeKey/EVA identity, or add a second writer. Full mode performs no dialogue metadata projection work.

Global scan, scan preview and quick keyword management remain full-mode actions. Existing BUS continuation may appear inside the projected local tree only after projected-prefix authorization; numbering and collision avoidance still use the complete Keyword repository and the existing owner modal/write path.

## Symbol Dialogue Metadata Readiness

status: confirmed_by_code

Symbol Dialogue seeds depend on Obsidian MetadataCache, while keyword registrations remain owned by `keyword_index.json`. A registered note is a seed only when the parsed cache exposes strict boolean `符号对话: true`.

Initial projection must therefore be refreshed after MetadataCache emits `resolved`; a temporarily missing cache entry must not remain projected as a durable false result for the lifetime of the view. Indexed Markdown `changed` events continue to trigger the same debounced projection refresh.

The refresh is read-only over notes and keyword data. It preserves the current view scroll container when that original container remains connected and owned by the view, cancels pending timeout/frame work on mode change or view close, and emits `[KeywordIndex][symbol-dialogue.metadata-refresh]` diagnostics with trigger reason and projection statistics.

Bayesian update: `refines` the existing Symbol Dialogue claim by adding metadata-readiness and view-lifecycle requirements.

Trace: `change-records/2026/2026-07/20260715-121321-keyword-index-plugin-symbol-dialogue-metadata-resolved.md`.

## Unknowns

- Whether subconcept should become a first-class global review/search dimension beyond its current drawer-local topology.
- Whether subconcept should be indexed as a first-class EVA node type or represented through existing keyword drawer nodeKey conventions.

## Ontology Keyword Sidecar

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-09

Keyword Index also owns the Ontology Keyword sidecar at `data/ontology_keyword_index.json`. This is deliberately separate from `keyword_index.json`: ordinary note keywords, BUS/drawer topology and Ontology-object keywords cannot overwrite or silently migrate one another.

The sidecar exposes `window.__keywordIndexPluginApi.ontologyKeywordIndex` to the Ontology Meta Hub. Its records use `okw-...` ids and structured `ontology-owner-ref:v1` targets containing provider, scope, family, stable-ref version and structured stable ref. A target may have multiple active keywords; an active keyword label may bind to only one target.

Deletion is a tombstone operation. `deleted`, `targetSnapshot`, deletion metadata and `reservedIds` preserve history; provider unavailability or an unresolved target is displayed as unavailable/orphan evidence and never auto-deletes the keyword. Mutations use the sidecar owner queue, CAS and write/read validation.

The sidecar publishes ready, unavailable and changed lifecycle events. Consumers must use the API rather than reading or writing the sidecar directly.

## Ontology Keyword Locator Prefix

status: confirmed_by_user_and_code_and_memory
updated: 2026-08-09

Ontology keyword labels follow the manual locator convention `大写字母 + 关键词正文`, with no separator, for example `C操作上下文主键汇总`. The leading ASCII letter is category/location metadata; it is not part of the semantic keyword body.

The raw label remains the stored and externally returned identity. API consumers may use runtime-derived `groupLetter` and `displayLabel` fields for navigation and presentation, but those fields must not be persisted or used to migrate `ontology_keyword_index.json`. Existing legacy labels without a valid prefix remain readable.

Create and rename require one leading `A-Z` letter followed immediately by a non-whitespace body. Semantic uniqueness is checked on the stripped body, so changing only the locator letter cannot create a second active meaning such as both `C厂家询价` and `Q厂家询价`. Search matches both raw label and semantic body.

Bayesian update: `refines` the Ontology Keyword sidecar contract by separating stable raw identity, manual category location and semantic display text.

Deployment status: verified Dev bytes are synchronized to actual Runtime and Mirror. Runtime syntax and locator feature sentinels pass; loaded Obsidian interaction smoke remains pending plugin reload.

## Ontology Keyword In-Place Rename

status: repository_dev_verified_runtime_pending
updated: 2026-08-09

`updateKeyword(id, patch)` is the owner-native rename path. A successful rename keeps the same `okw-...` id, Ontology `target`, `targetSnapshot`, `createdAt` and reserved-id history; only the raw label, normalized label key, locator sort key and `updatedAt` change.

Hub supplies the record snapshot through optional `expectedLabel` and `expectedUpdatedAt`. Keyword Index checks those fields inside the serialized mutation after reading the current sidecar, so two windows in the same provider generation cannot silently overwrite one another. A stale snapshot fails with `ONTOLOGY_KEYWORD_STALE`; ordinary mutation-queue, whole-file CAS, backup and write/read validation remain in force.

Submitting the unchanged raw label returns without writing or increasing the sidecar revision. Changed labels still pass the existing `A-Z + body` and semantic-body uniqueness rules.

Bayesian update: `refines` the existing sidecar mutation contract without changing index version, record identity, owner binding or deletion history.


## 2026-09-29 external reveal performance audit

Audit status: read_only_code_review_and_mock_host_measurement; update_type: `refines`. No performance patch is implemented by this audit.

Observation (`confirmed_by_user`): “可能有的时候从别处跳转过来，然后滚动到对应位置，这个过程会有延迟一下”。Relevant layers: symbolic entrance, relationship jump, derived projection and UI stability. Keyword remains sole owner of its registrations and permanent identities; EVA routes navigation to the Keyword owner.

Pre-change code facts (`confirmed_by_code`, audit baseline; implemented follow-up below):

- `openEvaNode` and `revealKeywordById` reload the index, expand the target context, render the entire view, then wait a fixed 80 ms before target lookup and smooth scrolling. When no view exists, activation invokes `onOpen`, which also reloads and renders: the first-open path performs two loads and two renders. This is a code-path finding, not a measured native cold-start latency.
- `render` clears the DOM and reference caches. Search input, capsule/drawer toggles and the broad EVA changed listener can cause full rendering. Full-mode `getChildren` scans all keywords each time and sorts only matching children.
- Closed note drawers and nested drawer bodies are hidden with CSS after their content is generated. Lazy construction could reduce work, but external reveal must instantiate the complete target path before locating it.
- Each relation button eagerly builds `getKeywordCommentContext`; drawer contexts rebuild the keyword/source suffix tree to compute note counts. That context is used in the Meta button click handler. Reading it freshly on click is a narrower candidate than changing persisted identities or tree semantics.
- Relation buttons obtain snapshots individually; EVA currently scans its relation collection for each snapshot. Registration also recomputes the complete `listEvaItems` inventory for logging after adapter registration already consumed it. Stable identity lookups already have a WeakMap/revision cache; write validation remains intentional.

Measurement boundary: current read-only input has 551 active keywords, 2,050 note registrations and 2,395 identity nodes, approximately 3.62 MB. Real Edge with a mocked Obsidian host produced 30,244 DOM elements, including 1,408 hidden note rows. Instrumented initial-render method calls were 551 child queries, 2,394 relation-button renders, 550 note-drawer renders and 2,049 note-row renders; these are call counts, not unique semantic object counts. Existing-view jump produced one load/one render; the simulated first-open lifecycle produced two/two. Reload IO was stubbed and the cold-path fixture reused the view; do not report these times as native Obsidian latency. Node VM pure-function costs are separate non-additive measurements.

Candidate order (`inferred`, not deployed):

1. Defer click-only Meta context computation; share one current index load and carry pending target through first render. Use revision/dirty/stat validation for external changes, not a permanently stale cache.
2. Reuse current target DOM when valid; instantiate only closed target branches when needed. Keep full data/search/BUS inventory and navigation ancestors even if DOM is lazy.
3. Replace unconditional delay with render-ready/connected-target synchronization and latest-request cancellation. Preserve primary anchors and the external-jump transition from Symbol Dialogue to full mode. Smooth-animation preference can be evaluated separately from computational delay.
4. Reuse parent/children and suffix-tree/count projections per revision; update relation badges locally. Stable search input/IME debounce and avoiding inventory recount for diagnostics are follow-up candidates.

Guardrails: unchanged nodeKey/permanent identity, raw BUS/SCON paths, direct-anchor sorting, full inventory, metadata readiness and source ownership; keep identity reconciliation, CAS, backups and post-confirmation source revalidation. A rename-triggered whole-vault scan is a separate potential hotspot, not established as the reported reveal delay. No fixed item limit is proposed.

Remaining unknown: actual native opening/reveal latency and savings after a future patch; relative costs under the user's open views and index freshness. [FW-011](../../framework/question-map.md) carries this follow-up. [Audit plan](../../../../REFERENCE_BOUNDARIES.md#ref-188)（外部来源未随包提供）, [function measurements](../../../../REFERENCE_BOUNDARIES.md#ref-189)（外部来源未随包提供）, [browser measurements](../../../../REFERENCE_BOUNDARIES.md#ref-190)（外部来源未随包提供）, [runtime inventory](../../../../REFERENCE_BOUNDARIES.md#ref-191)（外部来源未随包提供）, [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-192)（外部来源未随包提供）.

## 2026-09-29 external reveal performance implementation

Deployment status: `runtime_dev_mirror_synced_static_verified_ui_smoke_pending`. Source status: `confirmed_by_code`; reported navigation delay and implementation authorization: `confirmed_by_user`. Update type: `refines`. This follow-up implements the bounded reveal subset of the preceding audit; its remaining candidates are not deployment claims.

Keyword still owns registrations, identities and target resolution. EVA and other consumers keep the same public jump APIs, node keys and result semantics. Ontology Keyword sidecar, identity transactions, write validation and BUS allocation are unchanged.

- External navigation serializes fresh file reads and reuses a normalized snapshot only when resolved path and complete source text are identical. Missing, invalid or failed reads clear that reusable entry. Explicit refresh/mutation loads still normalize afresh. This cache is session-local and does not skip disk freshness checks.
- A navigation-created view defers its own initial render so the requested ancestors and drawers are opened before one display pass. Ordinary opening still initializes normally. Existing connected target DOM is reused only when snapshot, mode, query, expansion, scan preview and comments match; changed context rebuilds once.
- Closed note/drawer bodies are constructed when opened; complete data and EVA inventory remain available. Child lists are indexed per snapshot. Meta context is computed and target availability rechecked when its button is clicked.
- External reveal centers immediately after a paint-ready check instead of adding an unconditional 80 ms wait. Latest-request generations cancel obsolete focus, including nested fallback, close and unload paths. Requested BUS/SCON/root-note paths are materialized; exiting Symbol Dialogue for a reveal does not rewrite the preferred mode. This is explicit navigation, not a background scroll-restoration loop.

Verification: real Edge with a mocked Obsidian workspace/adapter and read-only real data changed cold navigation from two reads/two renders to one/one; unchanged warm navigation performs one read/zero renders. Fully expanded note-row order/count (2,050), EVA element order and full public inventory match the baseline. Tests cover ordinary open, fallback-by-ID versus fail-closed nodeKey, external content changes, explicit reload, errors/recovery, nested paths, Meta freshness, rapid requests, deferred abort, close/unload and ten unchanged API/write/BUS sentinels. These results do not establish native Obsidian latency or UI acceptance.

Runtime/Dev/Mirror `main.js` SHA-256: `ccb2c5055f5176f7c65fd4c82b282011a338eed13f50ffabc88426778e0d50ce`. Only this code file was deployed. Settings, both Keyword data files and plugin enablement hashes remained unchanged during deployment. Native reload and user interaction timing remain open under FW-011. Search/IME redesign, local EVA badge updates, inventory recount and rename scan work remain deferred.

Evidence: [plan](../../../../REFERENCE_BOUNDARIES.md#ref-193)（外部来源未随包提供）, [browser results](../../../../REFERENCE_BOUNDARIES.md#ref-194)（外部来源未随包提供）, [unit results](../../../../REFERENCE_BOUNDARIES.md#ref-195)（外部来源未随包提供）, [deployment](../../../../REFERENCE_BOUNDARIES.md#ref-196)（外部来源未随包提供）, [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-197)（外部来源未随包提供）.

## 2026-09-29 BUS quick-create latency diagnosis

Status: `read_only_code_review_and_mock_host_measurement`; no BUS optimization is implemented in this diagnosis. Observation (`confirmed_by_user`): creating a new node through BUS stays on “创建中…” for too long. Update type: `refines` the performance prior by separating external reveal from owner mutation and projection completion.

Current source (`confirmed_by_code`) creates a Markdown note, not a Workspace Tab item. Keyword owns the note/index registration and permanent identities; EVA consumes the complete owner inventory and owns its derived node index/relations. The earlier reveal patch did not optimize this creation pipeline.

The waiting chain is: owner mutation queue -> fresh raw snapshot and BUS tail/identity checks -> allocate ATOM address and create note -> reconcile identities -> verified backup, transaction journal, index CAS/write/readback -> reload owner snapshot -> register/publish to EVA -> archive journal -> refresh Keyword views -> open the note -> return and close the modal. The initiating view then expands the new BUS and refreshes again. Thus the note may already exist while the button still says “创建中…”. A failed registration preserves the new note and reports `indexPending`; do not retry by blindly creating a duplicate.

With one Keyword view and EVA enabled, the read-only harness reproduces five repository loads, two complete `listEvaItems` calls and three view refreshes. Refresh one is triggered by EVA's changed event, refresh two by the create method, and refresh three by the post-close expansion callback. The third is not part of the modal's awaited create duration. The second inventory traversal exists solely to log `items: this.listEvaItems().length`. Correction from the subsequent scan review: the harness deliberately omits DOM painting and injects a repository load into every mock refresh. Actual KeywordIndexView.refresh() only reloads when passed reload:true; these three production refresh paths do not pass it. Therefore five is a harness count, not the production owner-load count; the unmodified BUS path has two explicit loads (commit and EVA registration).

Data at audit: 551 keywords, 2,395 identity records, 3,620,520-byte Keyword index and 36,744,153-byte on-disk EVA state. Changed Keyword inventory causes EVA to clone/save its global state and emit a global changed event. Identity retention validation also uses nested node searches, and address preview searches the Markdown file list. These are potential costs with different safety obligations, not justification to delete validation or truncate inventory.

Measurement boundary: unmodified production methods in a Node VM, with read-only real input and all business writes redirected to an in-memory Map. Two runs measured creation about 1.7–1.8 s and nested EVA publication about 1.3 s. Native disk writes, DOM rendering, actual `openFile` and other plugins' event listeners are excluded. Inclusive timings overlap; do not sum them or infer native stage percentages. Source/data hashes remained unchanged. Runtime/dev/mirror Keyword main hashes agree at `ccb2c5055f5176f7c65fd4c82b282011a338eed13f50ffabc88426778e0d50ce`; this proves file consistency, not which version is loaded in the running UI.

Both modal help texts claiming that `keyword_index.json` is not written are stale: the current successful path durably registers the note. This diagnosis records the mismatch; UI wording has not yet been patched.

Candidate order (`inferred`, not implemented): avoid the logging-only second inventory; reuse explicitly valid owner snapshots across publish/refresh; prepare the new BUS expansion and coalesce self-origin EVA plus explicit/callback refresh without losing external events or other open views. Consider stage-specific feedback and retryable projection after durable owner completion only with lifecycle/failure tests. Keep complete inventory, permanent keys, raw BUS/SCON paths, current BUS-tail check, backups/CAS/readback and partial-create recovery. Any modal edit must include dirty-input/close/unload protection.

Native per-phase timings are still `unknown`: queue wait, disk transactions, EVA save/event fanout, actual rendering and Markdown opening need distinct evidence before claiming the dominant real-host cause or a speedup. The existing FW-011 carries this next step; no new schema or Skill rule is introduced.

Trace: [diagnostic plan](../../../../REFERENCE_BOUNDARIES.md#ref-198)（外部来源未随包提供）, [harness](../../../../REFERENCE_BOUNDARIES.md#ref-199)（外部来源未随包提供）, [latest measurements](../../../../REFERENCE_BOUNDARIES.md#ref-200)（外部来源未随包提供）, [runtime inventory](../../../../REFERENCE_BOUNDARIES.md#ref-201)（外部来源未随包提供）, [documentation change record](../../../../REFERENCE_BOUNDARIES.md#ref-202)（外部来源未随包提供）.


## 2026-09-29 full scan performance and manual entry feedback

Status: `runtime_dev_mirror_synced_static_verified_ui_smoke_pending`; independent final review is recorded in the linked engineering record. Observation (`confirmed_by_user`): the scan shortcut appears unresponsive, the toolbar scan does update, and the wait is long. Update type: `refines` performance evidence and `corrects` the earlier BUS mock load-count interpretation. Keyword remains the note/index/permanent-identity owner; EVA remains its derived inventory consumer.

Runtime baseline facts (`confirmed_by_code`): command `scan-and-save-keyword-index` and toolbar both invoke scanner.scanAndSave, with command/toolbar audit reasons only. Neither reason changes manual reconciliation semantics. The registered shortcut is Alt+Mod+Shift+2; the other key-2 binding lacks Alt, so it is not an exact duplicate. Native OS key delivery remains `unknown`. The old command shows no immediate progress and does not catch errors for a user notice. Every full scan uses sequential fresh reads twice; the latest inspected metadata counted 16,601 Markdown files. The second pass is a post-confirmation source guard, not disposable work.

Deployed implementation (`confirmed_by_code`, native acceptance pending):

- Read at most eight files concurrently with allSettled; drain a failed batch before releasing the owner queue. Parse and merge in original vault order. Both full fresh-read passes, filename/YAML keyword semantics, complete scope, map-signature check and identity reconciliation remain. No persistent or cross-scan stale cache and no total-result cap. Periodic event-loop yield keeps progress updates possible.
- The unchanged command id and toolbar share a manual-scan helper. It immediately shows a persistent phase/count Notice, merges repeated manual requests, reports errors/cancellation/completion, and clears feedback on completion or unload. Rename scans keep the existing independent serialized owner queue; neither rename scheduling nor automatic identity confirmation semantics change. This is not proof the OS delivers the user's shortcut.
- The durable transaction already reloads the owner and publishes EVA. Scan removes the extra owner reload and only repeats publication when the first publication failed. It retains its explicit view refresh. registerEvaIntegration gets its diagnostic item count from the real listItems callback rather than enumerating everything again; later callback invocations still derive fresh inventory. Since EVA catches inventory callback failures internally, Keyword captures that exception and rethrows after registration, so failed publication still triggers the preserved retry.
- Progress and scan.timings are diagnostic only; queue/scan stages do not alter business schemas, persisted identities, backup/CAS/readback/journal safeguards or user hotkeys. No BUS modal or BUS allocation change; the shared registration logging improvement also applies to other owner calls.

Verification: production methods in Node VM plus 16,601 synthetic Markdown fixtures preserve complete keyword map and insertion/note order; out-of-order read completion, concurrency bound, drained read failure, progress-callback error isolation, two fresh passes, source changes, invalid YAML value, cancellation, CAS conflict and persistent-owner/failed-projection retry pass. Real EVA registerAdapter/refreshAdapterIndex code is tested with a swallowed first callback failure and successful retry. The small real-transaction fixture retains four writes and changes two scanner/transaction loads to one and two successful publications to one; it stubs publication cost and does not claim full native call counts. Fifteen source sentinels preserve identity, transactions, BUS, API, rename and navigation. Prior Edge reveal suite still passes, including 2,053 current real-data note rows and full EVA inventory equivalence. These are mocked-host tests, not native acceptance.

512-file simulated-latency read benchmark: approximately 7.96s serial vs 1.69s batched (4.7x for this fixture). Timer scheduling and native IO differ; do not use this as an expected real-vault speedup. Native queue/read/reconciliation/persist/event fanout/render timings remain FW-011 evidence to collect after plugin reload. The earlier BUS harness injected reloads on mock refresh: its five-load count and inclusive times do not establish production loads or native phase proportions.

Trace: [plan](../../../../REFERENCE_BOUNDARIES.md#ref-203)（外部来源未随包提供）, [verification](../../../../REFERENCE_BOUNDARIES.md#ref-204)（外部来源未随包提供）, [Edge regression](../../../../REFERENCE_BOUNDARIES.md#ref-205)（外部来源未随包提供）, [change record](../../../../REFERENCE_BOUNDARIES.md#ref-206)（外部来源未随包提供）. Follow-up deployment authorized by the user: only reviewed main.js was copied to the active runtime; Runtime/Dev/Mirror SHA-256 is `e6cfd2a737a35dadd9979815eaa9d7c10080e91b56ded40061b267507ea36449`. Business data, settings and hotkeys were not written by this deployment. See the [deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-207)（外部来源未随包提供）. Native reload, shortcut delivery and timing remain unverified.


## 2026-09-30 scan source reuse with permanent identity preserved

Status: deployed program bytes; native reload/timing pending. User reports scans still slow and explicitly requires metadata renames to remain findable elsewhere (confirmed_by_user). Historical correction (confirmed_by_code): Aug 9 runtime backup and pre-Sep18 source use the same whole-vault metadataCache.getFileCache traversal; this was not plugin-owned incremental scanning. Sep18 permanent-identity scanner changed to direct body reads twice, plus reconciliation/transactions and awaited EVA publication. Sep29's max-eight IO preserved both passes, reducing concurrency cost without reducing read volume. Old writer already had backup/readback; do not describe old safety as absent. Immutable historical audit reproduces 0 body reads/16,605 metadata lookups versus 33,210 body reads on current baseline, including unchanged repeat; these are API counts in a mock host, not native seconds.

Current ordinary scan keeps two complete logical maps and the existing strict YAML/name parser, permanent identity reconciliation, missing-history retention, CAS/backup/journal/readback and EVA update/retry. It caches only successful fresh-read contributions within this plugin session, guarded by file reference/path/name/ctime/mtime/size plus source-event epochs. Listeners are installed before cache population; create/modify/delete/rename invalidates affected entries, folder events invalidate all. Config/source manifests are checked after scans and immediately before owner write across asynchronous backup/journal/CAS work. Changed sources/config abort, not commit a stale map. No persistent cache or total-result cap.

The existing shortcut/toolbar command remains scan-and-save-keyword-index. New additive command scan-and-verify-keyword-index (完整校验关键词索引（重新读取全部笔记）) forces both fresh-read passes; a full request queues after an ordinary scan instead of being downgraded. Progress reports read/reuse counts. First scan after restart recalibrates; warm scans still traverse/reconcile the complete inventory but read only changed/uncertain files. Missing stat or event integration falls back to fresh reads. Undelivered external events combined with identical stats/reference cannot prove byte freshness; use full verification for that case.

Strict no-change detection compares all owner fields, note paths/names/suffix/type/order, registry except revision, UI/manual/unknown fields and meaningful scan scope/count metadata. Only diagnostic timestamp/reason and synthetic revision bump are ignored. After current-owner bytes/pending-journal/source guards, unchanged runs skip owner rewriting but still load owner, publish EVA with retry and refresh views. lastScanAt therefore means the last persisted changing scan, while current completion appears in Notice/console. Real metadata/base/drawer/path changes follow full durable transaction; both registries validate before indexed retained-ID/nodeKey proof. API/BUS/reveal/automatic rename policy and identity helper modules are unchanged.

Verification: production-method VM tests use 16,605 fixture files: cold N body reads, warm unchanged 0, three changed files 3; full verification 2N. Map/order equivalence, strict YAML errors, missing stat/events, per-file/folder/name/scope invalidation, configuration and in-flight changes through backup/journal, foreign owner CAS/pending recovery, cancellation/unload, actual base/drawer renames keeping permanent endpoints, fresh EVA inventory and real EVA swallowed-failure retry pass. Edge reveal fixture passes (2,053 expanded note rows); its older navigation baseline is a regression harness, not a new scan speed ratio. No native Obsidian latency or shortcut delivery measured.

Runtime/Dev/Mirror main SHA-256: dd4a9186338b62b7bc36e3867a2e734775afba697179c4c12eea8eb9f421bb76. Only main.js copied, all 18 protected deployment states unchanged. Identity-transaction/stable-identity helpers, user business/settings/hotkey files untouched by deployment. Framework FW-011 retains native phase/loaded behavior follow-up; wider EVA fanout optimization awaits that evidence. Update refines/corrects; source confirmed_by_code and user symptom, native improvement unknown.

Trace: [historical audit](../../../../REFERENCE_BOUNDARIES.md#ref-208)（外部来源未随包提供）, [implementation plan](../../../../REFERENCE_BOUNDARIES.md#ref-209)（外部来源未随包提供）, [regressions](../../../../REFERENCE_BOUNDARIES.md#ref-210)（外部来源未随包提供）, [Edge regression](../../../../REFERENCE_BOUNDARIES.md#ref-211)（外部来源未随包提供）, [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-212)（外部来源未随包提供）.


## 2026-09-30 Keyword BUS post-confirm performance

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Keyword 0.1.22 narrows BUS post-confirm work: coalesce EVA-change and explicit creation refresh in a BUS-local batch admitted inside the existing identity queue; prepare the originating live/source-matched view expansion before that refresh and skip the old second callback render only on successful refresh. Consume invalidations before awaiting render and drain trailing events, including during note opening; finally release the batch. Other EVA events retain immediate refresh behavior. BUS registration can reuse the just-committed normalized snapshot only after fresh path/raw-byte/index-reference checks. The normalized keyword mutations in scanner/reconcile/edit/BUS paths use independent projected clones or loadRawIndexForWrite parsed snapshots, not the cached repository object. Transaction modules, allocation/parent lookup, modal contents and durable awaited EVA publication remain unchanged. Phase metrics contain timings only. VM real-data audit gives three refreshes before, one after in the normal case; native DOM/disk/fanout performance is unmeasured. Large EVA projection/serialization remains awaited and is not claimed solved.

Runtime installation awaits separate package approval. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-213)（外部来源未随包提供）.

Failure refinement: if both creation refresh and final drain fail, retain the deferred invalidation outside released batch ownership; the next explicit refresh or EVA event retries it, with no repeated note creation.


## 2026-09-30 Keyword BUS post-confirm performance — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Keyword Index 0.1.22 is installed in the proven NEWERA runtime; the two changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-214)（外部来源未随包提供）.


## 2026-10-01 Cross-restart source contribution cache

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Keyword 0.1.23 extends the September 30 session-only cache with private scan-source-cache.json in its plugin directory. This supersedes the earlier no-persistent-cache limitation, not permanent identity authority. Only parsed keyword contributions and file evidence are persisted after successful scan-and-save; no note bodies, identities or business index copies. First successful scan after installation seeds the cache. Ordinary opening/restoration does not initialize or write it; explicit scan/preview lazily loads it, and only completed scan-and-save publishes it.

Scope includes real vault/plugin path, scan settings, plugin version, parser digest, platform and filesystem device. Envelope checksum/schema and current full file inventory are validated. A bounded private-file capability probe confirms change-time support, cleans itself up, and fails closed; same-device native file identity/size/mode/birth/change/modified timestamps must match alongside Obsidian metadata. Offline same-size edits with restored mtime were detected on local NTFS fixtures. This is metadata evidence, not cryptographic content freshness or proof against forged timestamps. Unsupported adapters/filesystems, missing evidence, corrupt cache or changed scope fall back to fresh reads. Existing source-event guards and explicit full verification remain; full verification clears in-memory/disk candidate maps and rereads both passes. Cache I/O failure does not fail a successful business commit.

Two complete logical scans, identity reconciliation, durable owner transaction, EVA publication and view refresh remain. Unchanged-restart fixtures show zero note-body reads, not zero inventory/stat work or instantaneous UI. No native UI latency measured. Limits (64 MiB, 100000 entries, 10000 contributions per entry) constrain disposable persistence only, never truncate the business index. JSON Asset Registry 0.1.3 adds an exact-path derived-cache classification; it does not restore this cache. Existing public API, BUS, identity modules, automatic rename policy and onload scan policy remain unchanged.

Evidence: [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-215)（外部来源未随包提供）.


## 2026-10-01 Restart-cache approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this package with “OK就请部署”. Keyword0.1.23 and JSON Asset Registry0.1.3 reviewed program/document bytes installed in proven NEWERA runtime. The first successful scan seeds the new cache; later ordinary scans may reuse unchanged sources across restart. Complete inventory/native proofs/identity/EVA work remains. Metadata evidence is not cryptographic freshness. Business data/settings/cache files were not copied; no native reload or live speed measurement. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-216)（外部来源未随包提供）.


## 2026-10-03 SuperMemo Note at source tab-group end

status: repository_verified_runtime_pending
evidence_status: confirmed_by_user (far-right tab destination); confirmed_by_code
update: refines

Keyword Index publishes additive openKeywordNoteAtTabEnd(noteOrPath, sourceLeaf). It validates a real TFile and a source leaf still registered in its own workspace, counts exact-parent sibling leaves and calls createLeafInParent(parent, count), then opens with active:true. A moved source uses its current group. No active-view fallback or tab reuse. Existing openKeywordNote(noteOrPath) still uses getLeaf("tab"), preserving Project Overview and other consumers. No business data or persisted schema change. New provider and SuperMemo consumer must be deployed/reloaded together; native tab-placement acceptance pending.

Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-note-tab-end.md.


### 2026-10-03 Note tab-end deployment
status: runtime_deployed_native_acceptance_pending
User explicitly confirmed deployment of this package. SuperMemo main/engine and Keyword main synchronized from reviewed dev to proven NEWERA runtime; runtime/dev/mirror SHA-256 agree. No business data changed. Host/plugin reload and actual rightmost-tab placement remain user acceptance pending. Evidence: state/staging/supermemo-note-tab-end-20261003/deployment.json.

## 日常库独有的 SuperMemo 抽屉投影适配（2026-10-25，confirmed_by_user + confirmed_by_code）

- 用户确认：日常库 NEWERA 的 keyword-index-plugin/main.js（sha f9c952ee…，mtime 2026-10-22 20:28）是为 SuperMemo Concept Display 接入关键词抽屉做的有效改装。
- 代码：相对实验库 r34/r35 基线（279083df…）纯新增 54 行——公共 API `drawerProjectionContractVersion: 1`、`getDrawerProjection({nodeKey,maxNodes})`（只读、按 `repository.index` 同一性与 identityRegistry.revision 缓存）、`keyword-index:drawer-projection-changed` 事件（onload/onunload/refreshEvaAdapter）。消费者：supermemo-concept-display 引擎。
- 迁移约束：日常库升级时以日常版为基线，只移植 r35 K1（`getKeywordNotesForNode` 用 `load({reuseUnchanged:true})`）；K1 保持 index 对象同一性，使抽屉投影缓存不再被每次查询作废，兼容且有益。实验库不含此适配（实验库 SuperMemo 亦为旧版）。


### 2026-10-26 抽屉投影契约补齐

source_status: confirmed_by_code; status: runtime_deployed_native_acceptance_pending; update_type: refines

10-22 已部署的 `drawerProjectionContractVersion: 1` / `getDrawerProjection({nodeKey,maxNodes})` 是 scoped 同步只读结构接口，复用 Keyword 的抽屉解析、原始 SCON 路径和排序；不要求 consumer 从显示标题或扁平 EVA 记录重建层级。返回状态、完整性、永久身份能力、根身份、revision 与带父身份的节点列表。完整字段及缓存边界见[契约](../contracts.md#antinet-drawer-projection-v1)，手动扩展归属见[SuperMemo 页](supermemo-concept-display.md)。

`keyword-index:drawer-projection-changed` 供 consumer 失效视图，onload/onunload/refreshEvaAdapter 发布；缓存同时检查普通索引对象、identity revision、keyword/notes 引用，不以 ontology revision 替代。保留上节10-25日常库适配与r35迁移约束，不能用不含投影适配的实验版覆盖日常版。

证据：[10-22 部署记录](../../../../REFERENCE_BOUNDARIES.md#ref-217)（外部来源未随包提供）及同目录代码独审/测试。本文确认已部署契约，不追加未经验证的原生验收结论。
