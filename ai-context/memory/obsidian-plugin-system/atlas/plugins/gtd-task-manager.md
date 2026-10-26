# Plugin: gtd-task-manager

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-01
deployment_note: 2026-09-01 goal-domain top-level carrier evidence synchronized; loaded UI smoke pending

## Role

status: confirmed_by_user_and_code

GTD owns its project, next-action, tag, comment, schedule, hierarchy, and GTD view-state semantics. Other plugins may request bounded snapshots, owner-side provisioning, bridge capture/restore, or node reveal; they must not read or write GTD business JSON directly.

## Context Capsule Navigation

Under the explicit `context-keyword-project-v1` bridge policy, GTD treats State Capsule keywords as context locators rather than tag-filter state.

1. Normalize capsule keywords against Project Overview Context Capsule Keys.
2. Resolve matching GTD tag-keyword carriers.
3. Union active projects using those tags, including owner projects of tagged active actions.
4. Choose the intended project by:
   - saved `anchorProjectId`;
   - owner project of `anchorItemId`;
   - nearest GTD list position;
   - DOM position nearest saved scroll;
   - deterministic first candidate.
5. Render normal unfiltered GTD and restore the chosen project in `gtd-section-projects`.

No keyword/tag/project match restores the capsule's old GTD view context in normal unfiltered mode. It does not create a tag, project, action, or relationship.

## Bridge Host Identity

Each open GTD view registers a bridge with stable runtime `hostId`, `notePath`, and view identity. The plugin API resolves a bridge by target note and active leaf.

Unresolved multiple-host ambiguity fails closed. `ensureCapsuleBridge()` activates a GTD view only when the resolution status is `missing`; it never turns an ambiguous set into an arbitrary active choice.

## Compatibility

- New context navigation is opt-in through `navigationPolicy`.
- Existing callers without the policy retain mode, preset, tag-filter, expanded-filter and view-context behavior. Historical pinned-scroll fields remain bridge-compatible but no longer trigger automatic visible-position restoration.
- Clearing filters for context navigation is transient and does not rewrite the persisted tag-filter preference.
- Generation guards cancel or neutralize stale delayed restore work during rapid capsule switching.

## Guardrails

- Restore and reveal paths do not call GTD business writers.
- Provider snapshot APIs remain background reads and do not activate GTD views.
- Context Capsule Key identity remains owned by Project Overview; GTD owns only local tag-keyword carriers.

Trace: `change-records/2026/2026-08/20260801-151030-state-capsules-peo-gtd-context-restore.md`.

## Manual Scroll Pin Retirement

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-18

- The floating `GTD 已固定 / GTD Pin` control, its click writer, styling and automatic startup restore timers are retired from `gtd-task-manager`.
- Ordinary GTD view-context persistence and explicit anchor/relation navigation remain unchanged.
- Historical `pinnedScroll` storage, bridge capability, capsule capture and explicitly requested capsule apply remain compatible. The plugin does not delete or migrate old values, and they no longer choose the visible position automatically.
- Plugin load, view close and plugin unload idempotently remove a legacy `.gtd-floating-pin-btn` and its registered cleanup callback, covering hot reload from an older loaded bundle.

User-facing meaning: the bottom-right fixed-position button disappears without deleting historical capsule data or weakening normal GTD context restoration.

Bayesian update: `corrects` the obsolete GTD manual-pin interaction and `refines` the distinction between compatibility data and automatic UI restoration. After explicit confirmation, Dev/Runtime/Mirror program hashes align; six syntax checks and both scroll-pin regressions pass, while Runtime settings and manifest remain byte-identical. Loaded Obsidian smoke remains pending GTD plugin reload.


## Logical source compatibility for context rename (2026-10-13)

status: confirmed_by_user_and_code; native rename retest pending

The user confirmed NEWERA uses the independent gtd-task-manager plugin. Its view can use a logical source path plus an explicit data folder without an actual Markdown note. The rename adapter must respect this existing view contract; it must not create a placeholder note or silently choose another legacy GTD page.

Missing-note compatibility is limited to GTD, an explicit safe nonempty dataFolder, and the exact default logical anchor under that folder. Real-note sources retain their existing behavior. Other owner modules retain their source-note existence requirement. GTD validates the full sourceNotePath/dataPath/keywordPath tuple before and after reads and inside the atomic write callback, plus service liveness after reads. A changed folder cannot reuse a stale plan even when its source path stays the same.

24 targeted tests, 46 rename regressions and 24 independent probes passed. Read-only NEWERA preview found Workspace1/Collection1 and GTD no-match0; no-match does not certify GTD matched-carrier synchronization. User-operated reload and native confirmation remain required. No settings, fake notes, bindings or business data were created by this fix.

Bayesian update: refines the owner-source boundary; corrects the rename adapter's assumption that every GTD logical source must be a physical note. Trace: results/context-key-bus-management-20261012/gtd-logical-source/ and change-records/2026/2026-10/20261013-gtd-logical-source-rename-fix.md.


## 2026-10-22 S2-A1d-1：候选启动生命周期证据

Observation：旧host先dispose/empty再等待runner；晚到engine仍能启动repair、注册API与监听。Claim：仅检查host最后renderSeq不足，需配对engine自身启动边界核验。候选host编译等待保留旧engine，输入保护后才提交；source tuple包含逻辑path和dataFolder，使用独立mountGeneration。双向hostLifecycleVersion=1配对必需；owner ready不依赖PEO快照。

Source status：confirmed_by_code（仓库候选/真实启动代码的fake-host测试），独立终审PASS（s2-a1d/FINAL.md），未部署。启动后API/监听安装失败只清自身实例；旧UI回调失效，已发owner写和真实完成通知不取消。原C2恢复路径保留；原生强制关闭防丢未由fake-host证明。

A1d-2仍需实际内存快照、内部drawer全局清理与编辑保护、history/pending导航成功传播。EVA提供方晚到注册顺序无取消契约，旧descriptor失效即空/false，不按id猜测卸载。无创建延迟收益结论。Trace：[本批方案](../../../../REFERENCE_BOUNDARIES.md#ref-184)（外部来源未随包提供）。唯一排期在state/PLAN。


## 2026-10-22 S2-A1d-2a候选进度

Observation → claim：main若先改共享runtimeSource再检查输入，会使原host先失效；owner可用和导航下级成功是不同结果。A1d-2a main-only仓库候选将source admission前置、完整tuple跨await复核、观察到的下级false向上传递，并按明确来源/方法获取owner。source status=真实main方法VM/模拟host，独立终审中、未部署。31项实现＋13项独立补测及前批回归通过，engine字节未改，因此快照/抽屉/history/实际定位仍未完成。Bayesian label=refines入口边界，非原生性能或运行协议升级。Trace：results/context-key-bus-management-20261012/sync-bus-r/s2-a1d2；唯一排期state/PLAN。


A1d-2a恢复对账：候选44项（31实现＋13独立）与18变异、旧回归通过。当前基线21/22匹配；日常Keyword的1项变化已与独立Antinet部署receipt前后hash对应，非本包写入，保留该改动及原冻结期望。部署/整链前仍需核对新Keyword兼容，不能标22项未变。上次中断前终审报告尚未落盘，本轮完成文档封存并重新独立复核。


A1d-2a最终对账：新独立/root/a1d2a_resume_final终审 **PASS（仅仓库候选）**，报告s2-a1d2/FINAL.md。44项去重/18变异及回归通过；21/22原基线一致，Keyword单项已溯源独立Antinet部署并保留。候选main=29d4d39735bd2638c723a8f1fcd0a913de8cd3844abd8e2c890fe57c49c43602，engine=12bf618552f7311cd23d984b99d0becd949c6ec9e489f716b3d9db22deebfd4f。按审查许可机械回填PASS与重seal，未部署、无原生速度结论；下一步A1d-2b，唯一排期state/PLAN.md。


## 2026-10-22 FW-027 refined：GTD实际engine候选证据

Observation：渲染读快照仍会触发输入覆盖/历史误写/虚假跳转风险，编辑期间持有的数组index与数据读取前检查也不能证明提交安全。Claim：同批查询须配合实例UI状态、明确pending限制、exact target焦点回执；编辑会话冻结稳定身份和内容基线，原始证据在owner现有提交回调内比较，成功回执和失效UI分开处理。

Source status=仓库候选源码、真实engine/main的headless浏览器夹具和独立反例，独立终审PASS（A1d-2b/FINAL.md，仅仓库候选）；不是Obsidian原生或性能结论。Bayesian label=refines FW-027，运行协议与原生速度仍unknown。最窄落点为Atlas GTD插件页；trace：results/context-key-bus-management-20261012/sync-bus-r/s2-a1d2b/{PROPOSAL,DELIVERY,test-results,FINAL}。最终结论以实际FINAL为准；无FINAL时不能推断PASS。生命周期只验证document隐藏，不承诺非激活leaf零成本。当前排期只从state/PLAN读取。


## 2026-10-24 r30：待核验自愈（confirmed_by_code / refines，原生待验）

PEO目录续期会在同内容下替换快照对象而不通知；跨越替换的"取pass→等待→再核验"流程会显示待核验，旧版只能等签名变化或用户点"重新核验"。r30在同构 `createLifecycle` 增加内部可选 `isPending`：目录ready且视图仍待核验时重绘一次，仍经原输入/加载/弹窗保护，重绘次数不超过check次数，自愈最长约一个周期（≤30s）。消费者位于 `gtd-engine.js`（不是 main.js）的 `GtdTrackingModule`；`current()` 含 `!pending`。非公开契约。[证据](../../../../REFERENCE_BOUNDARIES.md#ref-185)（外部来源未随包提供）


## 2026-10-25 r32：EVA 适配器刷新中（health pending）与目录可读性（confirmed_by_code / corrects，原生待验）

EVA `registerAdapter`/`refreshAdapterIndex` 在首个 await 前同步 `indexHealth.begin` → `getAdapterIndexHealthV1` 立即 `pending`（revision 不变）。PEO 旧版读取/来源检查要求 EVA ready，因此任何视图（GTD 渲染帧内尤甚）登记适配器都会让已发布目录瞬时不可读；GTD `run()` 结尾 `isCurrent` 失败→横幅+点击拦截→重绘再登记形成循环。r32：读取/来源检查只比较 EVA `[providerGeneration,revision]` 戳，构建门仍要求 ready；revision 变化（语义 finish、首次 settle、issue、unregister、detach、close，前提为从 ready 出发）仍撤销。[r32 证据](../../../../REFERENCE_BOUNDARIES.md#ref-186)（外部来源未随包提供）


## 2026-10-25 r33：创建核验不再无谓派发（confirmed_by_code / corrects）

GTD engine `publish`（创建 inspect/commit 共用）此前无条件 `invalidateCarrierInput()`+重绘+派发 `context-capsule-carrier:changed`，核验也会触发 PEO 重建。r33 起仅在内存实际变化时执行；已合并且相同为空操作，冲突仍抛 `GTD_CREATE_MEMORY_CONFLICT`。另记：GTD 创建步骤依赖 GTD 视图引擎（视图未开时 `FULL_INSPECT_UNAVAILABLE`），反复尝试可能残留内存冲突，重启可清除——设计限制，未改。[证据](../../../../REFERENCE_BOUNDARIES.md#ref-187)（外部来源未随包提供）

## 2026-10-27 r40/D3：外部跳转先显示 GTD 再定位（confirmed_by_code / corrects）

PEO→GTD 跳转"切过来但不滚动"的根因：`activateView` 在 GTD 叶子仍为后台标签（display:none）时定位，最后才 `revealLeaf`；隐藏时 `focusGtdRelationTarget` 回落 `window.scrollBy` 并返回 true，`revealGtdNodeKey` 写下伪回执。r40 起：
- engine `revealGtdNodeKey`：目标 `getClientRects().length===0` 不算成功（共享 `focusGtdRelationTarget`、history、quick-nav 不变）。
- main `activateView`（仅 navigate 且有 key）：隐藏预跑（reusable 每次 apply）→ 回执已成立照旧 reveal → 目标不在 DOM 则不 reveal、返回 false（EVA 失败重试不抢焦点）→ 目标在则 `await revealLeaf` → `waitLayoutV1`（叶子窗口 rAF 与主窗口 100ms 计时器竞速）→ 复核 → 无条件 apply → 回执。engine 意图、无 key 路径不变。
- 已知剩余：DeferredView 重启后后台标签跳转可能无反应；EVA pendingFocus/localPendingNodeKey 残留可能"幽灵跳转"；等布局窗口内第二次点击被拒；非布局失败可能先显示后 false；目标缺失时待核验横幅残留（r39 既有）。
- 部署：实验库（r40）、日常与大千（D3，用户授权跳过实验库验收、不要 zip），三库 GTD main.js 95d8c57f / gtd-engine.js 46580384。证据：results/context-key-bus-management-20261012/sync-bus-r/integration-r40-gtd-jump-reveal/、daily-daqian-migration-d3/。
