# Plugin: eva-cross-view-relations

status: draft_mvp
updated: 2026-06-23

## Role

status: confirmed_by_memory

EVA Cross View Relations is the cross-plugin relation and node identity layer.

It indexes known plugin items, stores relations, edits relation records, and routes cross-plugin jumps through `openNode(nodeKey)`.

## Owns

status: confirmed_by_memory

- Cross-view relation records.
- Node index records by stable `nodeKey`.
- Relation editor modal behavior.
- Adapter refresh and missing-endpoint pruning policy.

## Provides

status: confirmed_by_memory

- `openNode(nodeKey)` routing.
- Relation editor for source/target nodes.
- Known-view adapters for Workspace, Mandala, Keyword, Collection/GTD, and note-like nodes.
- `ensureRelation(input)` owner API for idempotently creating a relation between two already-known node keys.
- EVA Meta Capture commands / API for manually capturing A then B nodes into a relation.

## Consumes

status: confirmed_by_memory

- Provider plugin item lists or registered opener APIs.
- Provider plugin semantics for reveal/open.

## Guardrails

status: confirmed_by_memory

- Do not prune relations when a provider index is temporarily empty or untrusted.
- Do not turn a provider's transient loading failure into permanent relation deletion.
- Keep tree reveal and note open semantics separate when relevant.
- Use custom confirmation modal for destructive relation deletion.
- `ensureRelation(input)` should deduplicate exact same-direction source / target / relationType pairs before writing.
- Consumer plugins may request a relation through `ensureRelation(input)`, but they must not write EVA relation JSON directly.

## Unknowns

- Which relation types should be treated as action, evidence, containment, or loose association for AI coaching.
- Whether relation strength/meaning should be exported explicitly in future context packets.

## 2026-08-23 - Meta Capture Relation-Type Options

status: runtime_mirror_synced_static_verified_ui_smoke_pending

- Provider contract: `startMetaCapture` accepts either the legacy string reason or an options object with `reason` and `relationType`. The provider normalizes both forms and stores the requested relation type for the subsequent capture.
- Compatibility: existing relations are not migrated. Consumers that introduce a formal relation type may read a narrowly scoped legacy default type when the target provider proves the expected view identity.
- Evidence: the previous Runtime wrapper discarded SuperMemo's options object and reset capture to `引用`; the synchronized provider preserves `antinet-keyword-mount`. Runtime/Mirror `main.js` hashes align and `data.json` is unchanged.
- Framework/Atlas update: `updated`, Bayesian label `refines`; this is a provider/consumer contract clarification with no schema migration.

## 2026-08-23 - Keyword Known-View Fail-Closed Routing

status: runtime_mirror_synced_static_verified_ui_smoke_pending

- Observation: when the Keyword Index opener is unavailable, generic note fallback interprets `data/keyword_index.json` as a file target and may hand it to an external editor instead of locating a Keyword capsule.
- Routing refinement: `keyword-index-plugin` is a recognized semantic view. EVA calls `window.__keywordIndexPluginApi.openNode(nodeKey)` and, if that API is absent, throws or returns false, clears pending focus and ends the jump as failed. It must not continue to `openNotePath()` for the backing JSON.
- Compatibility: node keys, relation records, adapters and business JSON are unchanged. Other known and note-like view types retain their existing fallback behavior.
- Evidence: Repository Dev syntax and cross-plugin routing sentinels pass; Runtime/Mirror remain unchanged pending explicit deployment.
- Framework/Atlas update: `updated`, Bayesian label `refines`; no API or schema version change is introduced.
- Deployment: after explicit user confirmation, the verified EVA `main.js` was synchronized to the proven Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align at `A34EF7ED...A2E2A3F1`; Runtime syntax passes, and all three EVA `data.json` files retain their distinct pre-deployment hashes.
- Rollback evidence: `state/backups/supermemo-antinet-meaning-deploy-20260823-224736/`. Loaded Keyword API routing smoke remains pending plugin reload.

## 2026-09-29 performance audit (historical pre-deployment baseline)

This section records the earlier audit only. Its implementation proposal and old hash are superseded by the implementation section below; retain its measurements as baseline evidence.

status: confirmed_by_code (current runtime source and read-only local measurement); update_type: refines.

Pre-deployment runtime `main.js` SHA256 `31FED7AA01859CD8D085B8CB4720DD2A9585D6A1EA631F1A901C69125D76E2E8` matches Dev/Mirror. Canonical source is registered open NEWERA, not archived or story-vault candidates.

- Relation editor `onOpen` awaits sequential `refreshAllAdapters` before first render. Each adapter refresh repeatedly scans the global node index, recreates records and sorts/serializes before deciding whether anything changed.
- Search input calls full modal `render` per keystroke. `searchNodes` constructs/lowercases text per record, scans all nodes and sorts all matches before limiting returned results.
- Single-node relation snapshot scans all relations; this is structurally linear but not the leading measured cost at the current relation count.
- Save queue clones the complete state before saving and dispatches changes after persistence. Preserve this durability/order contract when optimizing; no storage schema split is authorized by this audit.

Read-only dataset counts:18,154 nodes,420 relations,12 adapter IDs (largest10,398),38,107,602-byte JSON. Local Node function benchmark (not live Obsidian UI):20-run medians empty search79.12ms, search维修29.78ms, one-node relation snapshot0.19ms;5-run whole-state JSON clone median257.07ms. Results indicate optimization priorities, not end-to-end latency or achieved speedup.

Recommended first scope (inferred design proposal, not implemented): stable search order and precomputed text with same substring/sort/limit contract; update only result region with debounce and protected draft/focus; display existing index before background adapter refresh and deduplicate in-flight refresh. Then consider per-adapter membership to avoid repeated global scans. Preserve empty/untrusted-provider protection and save/after-save event semantics. Relation adjacency indexing is lower priority at current counts.

Audit only: no EVA plugin code or business data changed. Independent review confirmed source/counts and priority; benchmark values are producer measurements. Evidence: `state/staging/eva-performance-audit-20260929/PLAN.md`; trace: `change-records/2026/2026-09/20260929-eva-performance-audit.md`.


## 2026-09-29 relation editor performance implementation
status: deployed_static_and_mock_browser_verified_native_reload_pending; source_status: confirmed_by_code; update_type: refines.

- First scope implemented: render saved index before background refresh; coalesce concurrent refreshAllAdapters only. Individual provider refresh remains independent. Invalid/empty provider protection retained, late results after unload/adapter replacement ignored.
- Form DOM is stable. Search has 100 ms IME-aware debounce and updates only results; relation changes update relation lists without replacing inputs. Search catalog stores sorted records and searchable text in memory, invalidated on index mutation/remap/load. Public result order/filter/limit/cloning contract retained.
- Submission locks duplicate save/delete/reset and waits existing persistence before clearing. Failure retains draft and relation ID for retry. Explicit dirty-close confirmation; forced close/unload stores a vault/source-scoped localStorage draft, restored for review on reopening (no automatic business write). Same-source editor API opens reuse the existing window. Draft recovery is separate from state-capsules and business JSON.
- Full-state JSON clone/save remains; native end-to-end latency has not been measured. Current read-only 18,154-node search comparison preserves results. Local function-level warm search is faster; exact timings in staging unit-results.json are not whole-UI speedup claims.
- Runtime/dev/mirror main.js aligned at 7A9A6AAC3D56F12DAB87F1083F40B996862E5C38491DB5D06E7DA13B44F6ABFF. Deployment left each data.json byte-identical. No schema/API signature/changed-event ordering change; Reference Graph and other adapter consumers need no matching patch.
- Verification: syntax, real-data search equivalence and async index guards, headless Edge with mocked Obsidian host (IME/focus, save retry ID, pending edits, delete/reset lock, close/late refresh, unload draft recovery, duplicate editor). Independent reviewer PASS; native Obsidian reload still required.
Evidence: state/staging/eva-editor-perf-20260929; record: change-records/2026/2026-09/20260929-eva-editor-performance.md. Framework control-plane rules applied without changing framework schema.

### Framework evidence route and remaining validation

- Layer: 关系跳转 / UI-only 稳定性 / 派生索引；EVA owns relations and index, adapter providers supply node records, Reference Graph consumes snapshots. This landing introduces no additional owner.
- User observation (`confirmed_by_user`): opening/refreshing the relation maintenance interface felt slow. Implementation and isolated tests (`confirmed_by_code`) support the narrower claim that stable controls, bounded result rendering and a session-local search catalog remove repeated work; the localStorage recovery draft is separate from that cache.
- Native Obsidian opening/search/save latency after reload is `unknown`. Search cache is rebuilt after restart; saved index remains available. Full-state JSON persistence remains a possible save-time cost, so successful function benchmarks do not close the native performance question.
- Framework question: [FW-011](../../framework/question-map.md); next evidence is loaded-host opening, IME/search, relation save, close/unload recovery and latency observation. Do not promote a storage rewrite or per-provider refresh coalescing without new evidence.
- Durable deployment evidence: [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-180)（外部来源未随包提供）. Tests: [unit results](../../../../REFERENCE_BOUNDARIES.md#ref-181)（外部来源未随包提供）, [browser results](../../../../REFERENCE_BOUNDARIES.md#ref-182)（外部来源未随包提供）. These use a real browser with a mocked Obsidian host, not native host acceptance.

## 2026-10-21 native evidence: EVA is the system-wide bottleneck on Collection edits

status: confirmed_by_user（原生 Console 测量）+ confirmed_by_code（NEWERA runtime 源码）；update_type: **contradicts** the 2026-09-29 hold（“没有新证据前，不推进存储改写或按提供方合并刷新”）——新证据已出现。

- **观察**：从 Collection 下一步行动台新增一条待办，保存本身很快，但随后 Obsidian 会卡一阵。两次原生探针测到：长任务合计 7.7 s（单个最长 1.5 s）；`eva-cross-view-relations:changed` 派发时监听者同步耗时 675 ms，并与最长的长任务（1.43 s）重合；`集合卡数据.json` 出现两次修改事件；Mandala 有效列表只调用 1 次（404 ms），不是主因。
- **根因链（代码）**：
  - Collection 视图每次 `render()` 结尾都执行 `void this.syncRelationAdapter()`（Collection main.js 4104/4156），即调用 EVA `registerAdapter`，进而触发 `refreshAdapterIndex`。
  - `refreshAdapterIndex` 会：删除并重建该 adapter 的全部节点；对全部记录做 zh-Hans-CN 排序；新旧列表整体 `JSON.stringify` 后比较；扫描全部关系。
  - 有变化时 `flushSavedState("index")` 会对整个约 38 MB 的 state 做 `cloneJson` 并 `saveData`，随后广播 changed，PEO 等插件整页刷新。
  - 因此，纯 UI 渲染（切换 Tab、新增后的视图刷新）也会触发 EVA 全量刷新；内容有变化时还会触发 38 MB 全量写入。
- **结论**：EVA 作为跨插件关系中心，工作量与节点总数和 state 总大小成正比，触发频率却由提供方的渲染频率决定。这是全系统的放大器。它与 FW-023（Collection 整壳重渲染）和 FW-024（等价工作流去重）直接相关。
- **建议方向（设计建议，未实施）**：
  - P1：Collection 只在节点签名变化时同步 adapter（单飞 + 防抖），只改 Collection；
  - P2：EVA 增量刷新（Map 比较，不做排序和整体 stringify）；
  - P3：索引类变更合并延迟保存，关系类变更仍立即保存；拆分派生索引需另立项，并先扫描 `data.json` 的消费方；
  - P4：消费方对 changed 防抖，或跳过纯 index 原因的变化。
- **Unknowns**：两次修改事件是一次写盘还是两次写盘；第一次新增失败的原因（需要 `[CollectionCard][action-entry]` 的 warn 原因）。
- **Evidence**：`results/context-key-bus-management-20261012/naw-freeze-analysis-20261021.md`，探针 `naw-freeze-probe.js`、`naw-freeze-probe2.js`。本轮只做了诊断，没有改任何插件代码或数据。
- **存储引擎评估（2026-10-21，用户问“改成 SQLite 会不会好些”）**：只有“每次全量写入约 38 MB”这一层与存储格式有关；不必要的触发（P1）和全量重算（P2）与格式无关。
  - 原生 SQLite：需要针对 Obsidian 所用 Electron 版本编译的原生模块，分发和升级风险高，移动端不可用。
  - sql.js：持久化时要导出整个库，仍是全量写入。
  - IndexedDB：可以增量写入，但数据不在 vault 内，不随同步和备份，依赖 `data.json` 的读取方也要改。
  - 结论（inferred，待 P1 复测）：优先 P3 式拆分，即“关系”（约 420 条，用户内容）立即保存，“派生节点索引”（约 18k 条，可重建）合并延迟保存或启动时重建。只有在此之后仍不够时，才按契约级立项评估 IndexedDB 或 SQLite。

## 2026-10-21 EVA-P1 deployed: Collection re-registers only on real node change

status: deployed four roots (rowsDigest 57ce6c01…)；native: confirmed_by_user（切换 Tab 明显顺滑）+ Console 复测；update_type: refines.

- **改动**：Collection `syncRelationAdapter` 只在节点签名（`listRelationItems` 加 adapterId、notePath、viewLabel）、视图实例或 EVA api 对象变化时重新注册；关系编辑器和 Meta 捕获强制同步；关闭视图时把同一笔记的节点归属移交给其他打开的视图。EVA 本身未改。
- **原生效果**：
  - 切换 Tab 时不再触发 EVA 全量刷新，用户确认体感顺滑；
  - “新增下一步待办”的长任务合计约 3.9 s，与改前约 3.6 s 持平。原因是新增本身改变了节点，EVA 全量刷新和 38 MB 保存仍要发生一次，这属于 P2/P3 范围。
  - 部署后重启的首次新增出现过一个 24 s 长任务，暖态复测没有再现，判为冷启动开销（inferred）。
- **新发现（只读，待确认）**：每次新增都会出现 PEO 的 `context-key-tracking-visibility:changed` 广播，Collection 和 Workspace 的处理合计 882 ms，与一个 1.2 s 长任务重合。PEO 只在“已停止追踪集合”的签名变化时广播；新增待办并不改变追踪状态，推断是写入时读取失败（unknown）再恢复造成的假变化。
- **Trace**：
  - change-record `2026/2026-10/20261021-053059-eva-p1-collection-relation-adapter-sync.md`；
  - `results/context-key-bus-management-20261012/eva-p1/`（DESIGN、PREFLIGHT、FINAL、DELIVERY）。


## 2026-10-25 r32：EVA 适配器刷新中（health pending）与目录可读性（confirmed_by_code / corrects，原生待验）

EVA `registerAdapter`/`refreshAdapterIndex` 在首个 await 前同步 `indexHealth.begin` → `getAdapterIndexHealthV1` 立即 `pending`（revision 不变）。PEO 旧版读取/来源检查要求 EVA ready，因此任何视图（GTD 渲染帧内尤甚）登记适配器都会让已发布目录瞬时不可读；GTD `run()` 结尾 `isCurrent` 失败→横幅+点击拦截→重绘再登记形成循环。r32：读取/来源检查只比较 EVA `[providerGeneration,revision]` 戳，构建门仍要求 ready；revision 变化（语义 finish、首次 settle、issue、unregister、detach、close，前提为从 ready 出发）仍撤销。[r32 证据](../../../../REFERENCE_BOUNDARIES.md#ref-183)（外部来源未随包提供）
