# Plugin: collection-card-view and GTD

status: draft_mvp
updated: 2026-06-23

## Role

status: confirmed_by_user

Collection Card and GTD represent action-facing layers, but with different meanings.

- GTD is a heuristic prompt layer: it helps the user think of what should be done.
- Collection Card is more downstream: it often lists derived to-dos based on previous columns and relations.

## Owns

status: inferred

- Collection Card owns collection card items and their display state.
- GTD owns GTD task records and view state.

## Provides

status: confirmed_by_memory

- Relation nodes consumed by EVA and Project Overview.
- Jump targets that require stable bridge/reveal behavior.

## Guardrails

status: confirmed_by_memory

- Cross-plugin jumps should use EVA/open bridge semantics, not direct DOM guessing.
- View position stability matters because GTD and Collection views can rerender after jumps.
- State restoration should separate environment state from content state.

## Unknowns

- How to distinguish a GTD idea prompt from a committed next action.
- How Collection Card priority should be ranked against Mandala project plan and weekly tracking.

## Passive Owner API And Active Bridge Retirement

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-09-03

- `confirmed_by_user`: Collection Card should be controlled only when a caller deliberately invokes its owner API; it should not continuously broadcast UI/environment changes to State Capsules or other bridge consumers.
- `confirmed_by_code`: Repository Dev no longer calls the State Capsules Collection cache/host API, registers/unregisters a Collection host on the generic BUS, publishes `window.collectionCardCapsuleBridge`, or constructs/deep-clones the full bridge state during scroll capture and render-tail synchronization.
- The shared `window.__collectionCardViewPluginApi` remains because EVA, Mandala, Project Overview and other consumers depend on non-bridge owner capabilities. Passive `getBridge()` / `ensureBridge()` and live `getState()` / `applyState()` / `getHostIdentity()` remain caller-initiated.
- Host selection is exact and fail closed: exact note path only; active-ready preference among multiple exact hosts; unresolved ambiguity and not-ready return no bridge; `ensureBridge()` opens a host only when the requested scope is missing.
- Retarget safety gives a non-empty live view path authority over stale serialized leaf state. Serialized `state.sourceNotePath` is only a fallback when the live path is absent.
- Passive apply changes current in-memory/UI state and does not persist Collection business JSON. Existing content ownership, carrier snapshots, navigation and other owner APIs remain outside this retirement.
- Repository Dev, Actual Runtime and Repository Mirror now match the independently verified candidate. Static hashes, syntax, no-write harness and protected sentinels pass; real-host latency and loaded behavior remain `unknown` until plugin reload and focused smoke testing.

Trace: `change-records/2026/2026-09/20260903-152245-collection-card-active-bridge-retirement-dev.md`; deployment: `change-records/2026/2026-09/20260903-182900-collection-card-active-bridge-deployment.md`; backup: `state/backups/collection-card-active-bridge-deploy-20260903-180815/`.

Bayesian update: `supersedes + refines`; deployment evidence adds `no_model_change`.

## Active Tab And Context Primary Key Performance Optimization

status: runtime_dev_mirror_phase1_synced_static_final_verified_ui_smoke_pending
updated: 2026-09-04
framework_question: FW-023

- `confirmed_by_user`: clicking a normal Collection Tab or an Operation Context Primary Key Tab can block for a long time in actual use.
- `confirmed_by_code`: an ordinary Tab click enters `persist`, which deep-clones and sanitizes the complete Collection model, rewrites the complete owner JSON, emits the existing owner change event and runs a full view render.
- `confirmed_by_code`: a bound Operation Context Primary Key / keyword chip enters `revealTabCapsule`; when selection or ancestor expansion changes, it reaches the same `persist` path after an additional sanitized preview.
- `confirmed_by_code`: full render empties and reconstructs the complete Collection view, including the full Tab tree, keyword index, floating TOC, current item tree/listeners, preview lifecycle and relation/focus tails.
- `measured_runtime_aggregate`: the current real sidecar has 63 visible keyword assignments; contents were not copied.
- `confirmed_by_code`: one keyword-index rebuild invokes the Project Overview synchronous key projection once for virtual keys and once per visible bound assignment (`1 + N`). The provider rebuilds and sorts its complete key projection on each call. Combining the code formula with measured `N = 63` gives 64 current calls (`derived_from_code_and_runtime_aggregate`).
- `confirmed_by_code`: every keyword-index render also schedules the provider's async key refresh. When Project Overview's 30-second global-keyword cache is stale, its code rebuilds overview models for all grouping modes. Whether this is the dominant loaded-host stall remains `unknown` until Electron/Obsidian profiling.
- `measured_runtime_aggregate`: actual aggregate scale is 105 Tabs, 204 items and 74 keyword assignments; labels, IDs and note contents were excluded.
- `measured_local_microbench`: repeated JSON microbenchmarks show that the 147 KB model clone/parse/stringify work is measurable but too small by itself to explain a long freeze on the investigation machine; repeated provider projection and full DOM work rank above JSON micro-optimization. This is not a loaded Obsidian timing.
- `confirmed_by_code`: Repository Dev Phase 1 keeps ordinary active-Tab selection in view memory, avoids the owner save/event path, and gives an ordinary same-Tab click a true no-op. A later genuine owner mutation still carries the current valid active Tab through its already-required save.
- `confirmed_by_code`: a full keyword-index rebuild now acquires at most one synchronous Provider snapshot and reuses first-match-preserving display-label/alias maps; ordinary and Context Primary Key switch renders reuse the current cache and launch no sync or async Provider call.
- `measured_synthetic_actual_scale_shape`: after four warmups, 20 alternating switches reduced operation counts from 20 owner writes / 20 events / 1280 sync calls / 20 async calls to zero for all four. Single-process jsdom p50/p95 changed from about 208/247 ms to 94/111 ms; these values are regression evidence only, not loaded Obsidian performance.
- The final ordinary partial Tab switch target is zero provider refresh and zero full-shell render. Same-Tab no-op is limited to ordinary clicks. Context Primary Key, relation, pending-focus and passive API reveal paths must preserve exact source scope, ancestor expansion, focus, scroll and highlight even when the target Tab is already active.
- `confirmed_by_test`: reload/reopen, source retarget during pending Provider completion, dual-host isolation, empty/failing Provider recovery, duplicate first-match behavior, relation changed/same-target focus, page/TOC scroll, preview Component unload/recreate, detached stale Markdown completion and genuine persistence all pass.
- After explicit deployment confirmation and an independent `ALLOW`, Runtime/Dev/Mirror `main.js` align at `8CEA7E6DAC62D9D9A69B777351B5DFBC3CF8DE762AEF5B2BA6898FB21B7C2575`. Three syntax checks, the deterministic Phase 1 matrix and prior bridge/passive regression pass. Fourteen of fifteen protected sentinels remain byte-identical, including both business sidecars. The actual vault enablement file was concurrently rewritten after baseline; it remains valid and still enables `collection-card-view`, with no deployment causality inferred. No stylesheet or business JSON was written.
- Phase 1 deliberately retains full-shell reconstruction (about 1,710 created/removed fixture nodes per changed ordinary switch). The next slice is active-region partial rendering with the same focus/scroll/preview correctness gates; loaded-host attribution and latency improvement remain unknown.

Trace: Dev landing `change-records/2026/2026-09/20260904-102200-collection-card-active-tab-phase1-dev.md`; deployment `change-records/2026/2026-09/20260904-105000-collection-card-active-tab-phase1-deployment.md`; deployment backup: `state/backups/collection-card-active-tab-phase1-deploy-20260904-103730/`.

Bayesian update: `refines + no_model_change`. The implementation confirms the previously ranked work-amplification chain; the unresolved loaded-host attribution remains open under `FW-023`.


## 2026-10-22 S2-A1b Collection 候选证据

- observation：Collection实际view的同步键目录/逐标签读取及渲染内refreshSoon会走旧导航；本批将其接入A1a同批快照并与生命周期需求调度分开。
- claim / source status：仓库源码候选与方法级模拟DOM/时钟测试支持“该view每同步render一份快照，旧查询计数0”；未部署，不是原生性能结论，也未提升运行协议登记。
- update target / Bayesian label：**refines FW-027 / BUS-U02**。查询纯读还须配合unknown保留画面、输入保留、加载隔离和跨await跳转复核；“不清DOM”同时要求保存期间禁用原输入控件。弹窗关闭早于其调用方业务完成，不能据此自动换源。
- trace：`results/context-key-bus-management-20261012/sync-bus-r/s2-a1b/PREFLIGHT.md`、`main.diff`、`test-results.json`、`verifier-final-extra.cjs`；本批独立终审PASS，见同目录 `FINAL.md`；仍仅仓库候选。唯一执行次序以 `state/PLAN.md` 为准。
- 未关闭：Workspace/GTD/九宫格/State Capsules真实接线；全owner内容版本/漏事件；原生输入、滚动、历史跨插件跳转及创建首次/恢复耗时。30秒lease fallback仍可能构建完整导航，底层flight不支持取消；并非空闲零计算。


## 2026-10-24 r30：待核验自愈（confirmed_by_code / refines，原生待验）

PEO目录续期会在同内容下替换快照对象而不通知；跨越替换的"取pass→等待→再核验"流程会显示待核验，旧版只能等签名变化或用户点"重新核验"。r30在同构 `createLifecycle` 增加内部可选 `isPending`：目录ready且视图仍待核验时重绘一次，仍经原输入/加载/弹窗保护，重绘次数不超过check次数，自愈最长约一个周期（≤30s）。`main.js` 内 `__CollectionTrackingLifecycle`；适配器传 `isPending:()=>pending`。非公开契约。[证据](../../../../REFERENCE_BOUNDARIES.md#ref-177)（外部来源未随包提供）
