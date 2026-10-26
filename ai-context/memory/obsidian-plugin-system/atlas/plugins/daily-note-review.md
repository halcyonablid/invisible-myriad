# Plugin: daily-note-review

status: confirmed_by_code
updated: 2026-09-30
delivery: staged_and_repository_verified_runtime_pending

## Role and boundaries

Daily Note Review is a read-only projection of notes and current Keyword positions, with a private owner-maintained daily edit journal. It belongs to review/evidence navigation. View Group Hub only hosts its native `daily-note-review-view` leaf; the Hub does not own activity records.

The user confirmed separate created/modified lists and retention of each edited day (`confirmed_by_user`, 2026-09-30). Original runtime 0.1.0 used ctime plus an optional latest-mtime fallback; it could not retain all edit days. Candidate 0.2.0 adds three tabs: 当天创建, 当天修改, and the existing N-day keyword window.

## Ownership and evidence semantics

- Owns `.obsidian/plugins/daily-note-review/activity-history.jsonl`: versioned logical append-only start/edit/rename/delete events. No note text is stored. No edits to Markdown, YAML, Keyword/EVA stores.
- Observed edit evidence uses the local event-receipt date, once per note/day, with time labelled 首次记录. Same-day new notes appear only in creation mode.
- Bootstrap and restart can seed only each note's current latest mtime, explicitly marked 按最后修改时间补入. Disabled-period intermediate edits are unknown. Sync/plugin writes also count; this is not a manual-edit attribution log.
- Constructor inventory snapshot precedes capture. The provider is constructed after layout readiness, avoiding initial vault discovery as new-note events. Immutable event snapshots replay in order after asynchronous journal load, including rename/delete races.
- Observed file/folder renames follow retained identity; deletes preserve historical rows. Observed create breaks the previous same-path identity even with equal ctime. Open/tree re-resolve identity at click time.
- Offline rename and replacement retaining the same path/ctime cannot be fully identified. Unavailable notes remain readable as history. Date buckets are retained when timezone changes. Keyword grouping uses current metadata, not historical keyword snapshots.

## Persistence and UI contracts

Serial owner writes use atomic adapter.process over validated current bytes, append only missing event IDs, then read back. Repeated edits on the same day do not write per keystroke. Corruption/read/write errors fail closed, retain pending events and offer retry; no truncate/repair guessing. Unload flush is best effort, not a crash guarantee. Include the journal in backups; deployment must never replace it.

Opening/restoring the leaf only reads evidence. Date index is in memory; startup seed reads metadata, not note bodies. Visible refresh preserves date/tab/scroll anchor; hidden prewarm marks dirty until activation. Closed/older render success and failure cannot commit stale DOM.

## Dependencies and compatibility

- Consumes Keyword index/current frontmatter, ATOM ancestor positions, and EVA Tree navigation. BUS drawers are not grouping anchors; existing inherited grouping is retained.
- Provides unchanged `window.__dailyNoteReviewPluginApi`, `daily-note-review:review-meta-changed`, and view/command identifiers. Keyword Index consumes Review Meta API/event; no matching consumer patch required.
- N-day keyword / Review Meta logic and permanent Keyword jump methods are byte-identical to the baseline. Legacy `includeModifiedFallback` now has explicit UI scope: latest-mtime supplementation in that window, not the daily journal.
- Bounded runtime dependency scan: top-level plugin main.js for API/event/view/setting identifiers, skipping files over 8 MB. Hits were Daily, Keyword, Hub. This is bounded evidence, not proof of all possible external consumers.

## Verification / next evidence

Node actual-class tests cover retained multi-day edits, seed provenance, retry/corrupt protection, startup and write races, rename/delete/path reuse, and click-time guards. Edge mocked-host tests cover three tabs, full-name rows, read-only open, refresh stability and Hub placement. A 12,000-file synthetic seed reads zero bodies; timings are not native-vault performance claims.

Next: task-specific runtime deployment, plugin reload, user-paced Hub switching and actual modified-note daily retention. Native loaded-host behavior remains `unknown`.

Source: [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-178)（外部来源未随包提供）, reviewed candidate and tests in `state/staging/daily-review-history-20260930/`.


## 2026-09-30 approved runtime deployment

Daily Note Review 0.2.0 reviewed program files are now deployed to the sole open NEWERA vault, D:/han/最新的/NEWERA2024年4月17日/NEWERA. Runtime/Dev/Mirror deployed-file hashes agree. Existing enablement/settings and activity history were left untouched; source code hash verification does not prove a native reload. Reload the two plugins or restart Obsidian to activate. Real daily restart/history and user-paced view-group switching remain native acceptance items. Source status confirmed_by_code; user authorization confirmed_by_user; update refines. [Deployment evidence](../../../../REFERENCE_BOUNDARIES.md#ref-179)（外部来源未随包提供）.


## 2026-10-03 Note opening at source tab-group end

status: confirmed_by_code
delivery: repository_verified_runtime_pending
source: user request and reviewed Daily main.js; update: refines

Note titles and Open buttons pass their actual DailyNoteReviewView leaf through the existing click-time identity resolver. A new active Note tab is appended after all siblings of that current source parent, including pinned/deferred tabs. A moved source uses its current parent; a detached/foreign/null source or missing placement APIs fails visibly. No active-leaf fallback. EVA Tree success stays unchanged; unavailable/rejected Tree fallback opens Note through the same source-scoped route. Calls omitting the optional source argument preserve legacy opening behavior. No new Keyword dependency, public API/event/schema change, or journal/note/settings mutation. Keyword Review Meta and View Group Hub need no matching change.

Eight actual-class mocked navigation tests and the existing twelve-category history regression pass; activity history and render/scroll code remain byte-identical. Native position/activation requires deployment and user-paced acceptance. Source: ../../change-records/2026/2026-10/20261003-daily-note-tab-end.md.


### 2026-10-03 Daily Note tab-end approved deployment

status: runtime_deployed_native_acceptance_pending
User explicitly confirmed this Daily Note Review deployment. Reviewed main.js synchronized from dev to the sole-open registered NEWERA vault. Runtime/dev/mirror SHA-256 agree. Fresh byte backup and independent pre-deployment review retained. No note, settings or activity-history files copied or modified by deployment. Plugin reload and native rightmost-tab acceptance remain pending. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-daily-note-tab-end-deployment.md.
