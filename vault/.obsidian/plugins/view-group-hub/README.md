## 0.2.10 日课标签汇总

回看栏顺序：经验回看、周追踪、每日 Note 回看、日课标签汇总。新增第15个 native leaf 成员，来源由 Mandala 当前设置提供；保留原日课按钮和命令。复用同栈同来源页面，普通选择不重设 view state；关闭后使用显式修复。来源切换保留旧页和草稿。Mandala 自身激活刷新沿用原逻辑，首次加载有读取成本。

# 0.2.9 回看与规划分列

当前4列14成员：回看为经验回看、周追踪、每日 Note 回看；规划为 Timeline、九宫格、时间框架。原执行两列及旧成员预热顺序不变。经验owner未安装/启用时沿现有不可用提示；不复用其引擎，不写业务数据。经验正文索引需实际激活才扫描，隐藏预热不读取正文。repo/runtime分别保留原nextAction契约，不可互换。

# View Group Hub

`view-group-hub` visually replaces eight adjacent native tab headers with one stable `视图组` header while retaining nine genuine Obsidian leaves internally: one controller and eight members.

The hover/focus panel has two columns:

- 执行与收集：Project Execution Overview, Workspace Mount, GTD Task Manager, Collection Card View
- 时间与本体：Temporal Framework, Next Action Workbench, Ontology Meta Hub, Daily Note Review（每日 Note 回看）

Hover or keyboard-focus the `视图组` header to select an already-open member. The selection path only activates the retained leaf; it does not create a leaf, call `setViewState`, call an owner opener, or run `ItemView.onOpen`.

## Safety boundary

- The Hub owns grouping UI and managed leaf identity only.
- It never reads or writes member business JSON, settings, caches, indexes or source notes.
- It never creates synthetic leaves, moves member DOM, rewrites the private workspace layout tree or closes unmanaged duplicates.
- If tab-header discovery or identity proof fails, native member headers are restored.
- Closing the controller restores native headers and leaves member views open.
- The only MutationObserver is bounded to the controller tab-header container; it never observes member view content.

## Preload behavior

No work happens merely because the plugin loads. Prewarm begins only when the Hub controller leaf is restored or explicitly opened. Existing members in the same stack are adopted first. Missing members are created one at a time in idle slices. Ready members become usable progressively. Cold bootstrap has a 12-second total deadline in addition to the per-member timeout; leaving the controller stops later creation instead of taking focus back.

Workspace Mount and Collection Card are source-bound. A missing member is created only when its normalized `sourceNotePath` was adopted previously or explicitly configured. Unknown source identity fails closed.

An explicitly configured source path overrides the previously adopted identity; the settings page also provides a clear action. If the user leaves the controller while prewarm is waiting, remaining creation pauses instead of reclaiming focus.

After bootstrap, closing a member with `Ctrl+W` or another native command marks it unavailable. Layout changes never silently recreate it; use `修复视图组` explicitly.

## Performance verification

The controller no longer exposes a prominent A/B button. The high-frequency command shows an explicit warning because it switches owner views about 200 times and is not an ordinary-use measurement. The failed 2026-08-24 run remains failed evidence.

For ordinary switching, make two user-paced rounds across all eight members with at least 750 ms dwell, then run `Report recent ordinary View Group Hub switching`. It requires all eight members, handler/event-to-active p95 <= 250 ms and no sample >= 500 ms.

The command `Measure View Group Hub switching` compares the same preloaded leaves with native headers visible and grouped. Required gates:

- Hub handler CPU p95 <= 8 ms
- event-to-active-leaf p95 <= 16 ms
- retained first-paint p95 regression <= 16 ms
- no observed grouped long task >= 50 ms (conservative gate because browser Long Task entries cannot attribute Hub versus owner)

Owner visibility-transition refresh and interaction-ready time remain separate loaded-Obsidian smoke evidence.

The repository behavior harness covers the exact two-group partition, single-flight reconcile, timeout cleanup, native-close fail-closed behavior, stale-generation retention, focus-authority preservation, fail-open cleanup and a 200-switch stability cycle. Same-stack rendering and owner routing remain mandatory loaded-Obsidian smoke gates before Runtime deployment.

Daily Note Review is a source-unbound native member below Ontology. Daily owns its private activity history; Hub opening/restoring the leaf does not record edits. The ordinary switching gate now requires 16 samples. Candidate Node and Edge mocked-host checks pass; native deployment/reload remains pending.
