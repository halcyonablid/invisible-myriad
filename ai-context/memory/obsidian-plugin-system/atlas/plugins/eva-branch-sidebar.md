# EVA 分支树（左侧边栏）

status: confirmed_by_code
created: 2026-09-28
deployment_status: v1_0_3_installed_pending_reload

## User distinction and role

User confirmed this sidebar conversion of `templater/召唤树状图.md` is different from the existing page-based EVA Tree View. Keep both identities and entry points. The source snapshot is `state/backups/eva-branch-sidebar-new-20260928/original-template.md`. New ID `eva-branch-sidebar`; view `eva-branch-sidebar-view`; command `eva-branch-sidebar:open-and-locate`. This is a topology-address read-only navigation projection, not a data owner.

Provider EVA incremental indexer owns EVA_Notes; consume its diagnostics notesPath read-only, unique filename fallback only when provider absent. Notes remain Vault-owned. Sidebar owns ephemeral branch, folds, emphasis and display window; no schema/writeback/second JSON owner. See [Mermaid address semantics](../knowledge/mermaid-address-semantics.md).

## Current Mermaid emphasis

Observation (confirmed_by_user): green markers on many Mermaid starts do not adequately distinguish the currently relevant one. `corrects/refines`: keep green for all starts but add a strong outline/left bar and explicit current-role badge. Exact current start = 当前对应图. Hidden descendant = nearest actual Mermaid start, 当前笔记所属图. Generic hidden/depth/fold ancestor must not be labelled as a Mermaid owner without evidence. Duplicate address ancestors remain explicitly ambiguous. Path is the file identity.

## Coverage and performance

Preserve original ATOM prefix, dot-main-branch/depth, natural sort, computed hide boolean priority, start overrides, keywords and important-row markers. No new antinet/tree-flag filter. Model is complete; 401 post-filter rows per display window with explicit prev/next navigation. Titles stay on one line and remain horizontally reachable. Cached lightweight global projection and branch/path/code maps avoid repeated source reads when invoking or switching branches. Source changes invalidate cache with an epoch and a250ms event debounce; stale errors remain visible. Local keyboard handlers do not intercept editor typing.

Evidence: repository model and Chromium20k tests plus real-index-results.json. Two workloads are distinct: simulated20k latest initial178ms/warm23.5ms; real10306-note19.6MB read/parse/projection about0.75s underNode. Actual Obsidian post-deployment latency remains unverified. JSON parse and sort remain synchronous first-load costs. No change to existing EVA Tree View or other consumers.

Framework update check: updated at this narrow plugin role/contract page, no control-plane rule or new ownership. Source statuses: user distinctions/strong emphasis confirmed_by_user; implementation confirmed_by_code; timing limited to recorded test environments. No MemPalace mine.

User correction: original │ / ├─ structure lines and folding triangles are required, not replaceable by indentation alone. Render true depth (no eight-level cap), allow horizontal scrolling for deep trees while keeping full titles on one line. This refines the navigation UI contract; current-Mermaid visual priority remains separate from lineage cues.

Deployment 2026-09-28: user explicitly confirmed. Verified NEWERA registry open:true; three runtime file SHA-256 hashes match reviewed release; enabled list preserves59 previous entries and appends eva-branch-sidebar. Old EVA Tree View sentinel hashes unchanged. Actual live load awaits Obsidian refresh. Evidence: workspaces/eva-branch-sidebar/release/deployment.json.

2026-09-28 correction (confirmed_by_user + confirmed_by_code): v1.0.0 failed to load in Obsidian. Its index method load(source) shadowed inherited Component.load(). Browser fixture invoked onload directly and missed the conflict. Fix renames it loadIndex; regression exercises inherited load/unload, registration and zero index reads before opening. Old bundle fails new test;1.0.1 passes. Reference: https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts . Earlier simulated timing is not evidence of successful actual startup.

2026-09-28 user correction: prefer left sidebar, compact single-line rows, exact-depth highlight with cancellation. This supersedes earlier right-sidebar/wrapping preference. v1.0.2 changes opening to leftSplit/getLeftLeaf, retains command ID, cleans old right plugin view only after successful left reveal. Right-click selects one depth or toggles it off; clear button/Esc removes only level highlighting, N/M replaces depth rather than accumulating. Browser assertions cover these behaviors and preserve current/Mermaid markers. Source: user screenshot + code/tests; actual Obsidian UI pending refresh after deployment.

1.0.3 user refinements: compact header/footer padding; ordinary current-role message goes into summary tooltip, diagnostic messages remain visible. Stable command ID toggles left sidedock collapse/expand; toolbar locate does not toggle, reopening reuses view/cache and locates main note. Public WorkspaceSidedock collapsed/collapse/expand APIs used. Current-row background no longer injects orange: border/bold/badge mark current, green identifies Mermaid starts, orange denotes exact-depth selection only. Browser evidence: header24px, bottom0 in fixture, collapse/reopen and cache reuse pass. Obsidian theme/zoom may change actual measurements.

## 2026-10-21 上游写入频率（eva-incremental-indexer）

Observation（confirmed_by_code，NEWERA runtime 只读）：上游索引器在 ATOM 笔记 mtime 变化时即判定变化（内容未变也算），防抖 800 ms 后整写状态 30.8 MB 与 EVA_Notes 20 MB 等约 54 MB（先读回比较；EVA_Notes 含 `updated` 时间戳，每次必写）。本插件打开时随每次改写 250 ms 后重读并同步 `JSON.parse` 20 MB。`refines` 上文“首次加载”成本判断：编辑 ATOM 笔记期间它是重复成本。候选：BR-1 视图不可见时只标脏；上游 IDX-1/IDX-2 更优先。ATOM 侧栏（atom-note-sidebar）走 Dataview，不受影响。Trace：results/context-key-bus-management-20261012/atom-eva-indexer-review-20261021.md。原生耗时未测。

2026-10-21 原生实测（confirmed_by_user，TV-ATTRIB 探针）：编辑 ATOM 笔记约 19 s 内索引器 8 轮整写，每轮墙钟 1.8–3.3 s，约 430 MB；同期只有 1 个 ≥200 ms 长任务（276 ms）——主线程阻塞轻，主要是磁盘重写。内容确有变化，“内容未变不写”对打字无效；节流合并（IDX-3）才是主杠杆。
