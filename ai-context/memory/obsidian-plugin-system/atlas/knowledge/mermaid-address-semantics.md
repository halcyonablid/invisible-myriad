# Atlas Chapter: Mermaid Address Semantics

status: draft_core
created: 2026-06-24
source_status: confirmed_by_user_and_memory

## Purpose

This chapter records a system foundation: Mermaid diagrams in the user's Obsidian system are not only pictures. They can encode Antinet / ATOM address semantics, state transitions, lineage containers, real references, EVA relations, and layout helpers.

Future agents must not treat Mermaid source, `ATOM@...` addresses, `+` segments, `.` segments, or `subgraph` blocks as merely visual or technical syntax. They are part of the user's meaning layer.

## Prior Sources

status: confirmed_by_memory

- `memory/obsidian-plugin-system/cards/2026-06-04-mermaid-nested-subgraph-lineage-experience.md`
- `memory/obsidian-plugin-system/cards/2026-06-04-reference-graph-atom-address-layout.md`
- `memory/obsidian-plugin-system/cards/2026-06-18-antinet-keyword-topology-order-shared-sort.md`
- `memory/obsidian-plugin-system/cards/2026-06-23-gcores-antinet-obsidian-reference-for-project-coach.md`
- User confirmation on 2026-06-24: complete Mermaid numbering knowledge is important enough to become an Atlas chapter.

## Core Claim

status: confirmed_by_user

Mermaid address knowledge is a system foundation. It should be understood as a bridge between lower-level plugin rendering and upper-level symbolic cognition.

The address layer tells the system:

- where a note or concept grows from;
- which local lineage or state transition it belongs to;
- whether a relationship is structural, referential, EVA-derived, or only a layout helper;
- how far an AI coach or graph reader should traverse before stopping.

## Address Grammar

status: confirmed_by_memory

### `ATOM@...`

`ATOM@...` is a meaning-bearing address, not a random id.

- It provides tree position and lineage.
- Parent and nearby sibling notes may explain the local context.
- Sorting by address stabilizes graph shape across different entry notes.

### `.`

`.` expresses child / subset / internal subgraph depth.

Example interpretation:

```text
A.001
```

This means a child or internal member under the current address context.

### `+`

`+` expresses a state-transition or continuation segment.

Example interpretation:

```text
A+001
```

This means a new transition head or continuation, not merely a deeper child.

### `.` and `+` together

The relationship between `.` and `+` is not equivalent to simple depth counting.

Known rule from prior Mermaid experience:

1. `+` marks a state-transition segment.
2. `.` marks child / subgraph internal depth.
3. A switch from a `.` run to a `+` run starts a deeper transition layer.
4. A switch from a `+` run to a `.` run enters members under that transition head, but does not by itself start a new transition layer.
5. A deeper transition head can grow from a member inside a previous transition subgraph.

## Mermaid `subgraph` Semantics

status: confirmed_by_memory

`subgraph` is a lineage container. It should not replace the note node itself.

Use this distinction:

```text
subgraph -> container / lineage / context
node     -> clickable note or concept identity
edge     -> relationship between identities
```

Recommended form:

```text
subgraph A_lineage
  A["A"]
  subgraph B_lineage
    B["A.B"]
  end
end
```

Avoid treating a subgraph label as the note identity. The note should still be a node so that clicking, highlighting, and evidence attribution remain stable.

## Relation Layers

status: confirmed_by_memory

Mermaid graphs can contain several kinds of relations. They must not be collapsed into one generic edge.

| Layer | Meaning | Recommended visual / handling |
| --- | --- | --- |
| Address lineage | ATOM / Antinet structural growth | container nesting or solid structural edge |
| State transition | `+` continuation / state movement | transition grouping or labeled flow |
| Real reference | markdown wikilink / note reference | dashed reference edge |
| EVA relation | cross-plugin relation identity | dashed labeled edge |
| Keyword topology | symbolic entrance / sort position | source ordering or entry marker |
| Layout helper | invisible node or helper edge | never treated as business meaning |

## Stable Graph Shape Rule

status: confirmed_by_memory

When rendering a local reference graph, graph shape should not change merely because the user opened the graph from a different node in the same tight cluster.

Preferred strategy:

1. Build the local reference neighborhood.
2. Choose the earliest visible ATOM address as a local canonical seed.
3. Use ATOM address sorting for stable node order.
4. Use address lineage / subgraph nesting as the main shape.
5. Overlay real references and EVA relations as relation layers.
6. Keep current-note highlighting as post-render DOM state when possible; do not let it alter Mermaid source.

Avoid full-vault scans for canonicalization. Use local neighborhoods and known plugin indexes.

## AI Reading Rule

status: confirmed_by_user

When an AI coach or framework reader enters from one note:

1. Decode the address grammar first.
2. Identify whether `+` means a state transition or continuation layer.
3. Identify whether `.` means local child / subgraph membership.
4. Inspect the parent, nearby siblings, and direct linked notes only when they change the coaching or design question.
5. Treat `subgraph` as context container, not as the note itself.
6. Keep real references, EVA relations, and layout helpers separate.
7. Stop before exhaustive graph walking.

This is a bounded interpretation rule, not permission to crawl the whole vault.

## Implementation Guardrails

status: confirmed_by_memory

- Do not save Mermaid SVG or cache files unless the plugin explicitly owns that cache and has load-shedding.
- Do not reintroduce full-vault scans such as broad `app.vault.getFiles()` for every graph render.
- Do not write EVA JSON, keyword JSON, workspace JSON, or business note data while rendering or interpreting a graph.
- Keep subgraph ids and node ids in separate namespaces.
- Invisible nodes and helper edges must never enter click maps, EVA identities, or business relations.
- If a plugin changes Mermaid address semantics, update this Atlas chapter and related Skill rules.

## Open Questions

status: active_unknown

- How should `+SCON.` subconcept addresses interact with Mermaid transition semantics?
- When should address lineage be expressed by nested subgraph only, and when should an explicit solid `address-tree` edge also be shown?
- How large should the local traversal budget be for AI coaching when a note sits inside a dense Mermaid / EVA / keyword network?
- Which parts of this grammar are confirmed by current code versus by historical experience cards and user practice?



## Whole-expansion layout exits (2026-10-03)

status: confirmed_by_user

The user confirms that the successor head of P must follow the complete expansion of P's containing subgraph. When that scope contains encoded A -> B continuation, propagate B's expanded terminal members outward as the scope's exit. A deeper earlier A does not outrank a later B. Dot membership, member-origin nested heads and head-origin same-container continuation remain distinct. Parallel A+001 and A+002 are not an inferred serial sequence; retain both branch exits. Invisible helpers impose layout constraints only; direct business state indicators remain.

implementation_status: repository_candidate_native_pending

The 0.1.30 candidate computes indexed bottom-up exit frontiers, projects folded heads as visible exits and rebuilds helpers after pruning. Ambiguous identity/containment suppresses unreliable helpers; missing intermediate members are conservative partial branches. The new pass is bounded by the collected graph and frontier sizes, not a new vault traversal. Synthetic tests and the locally extracted Mermaid engine verify the deeper-A/later-B fixture and folded-B variant; this does not prove every native graph's geometry or performance.

trace: `state/staging/mermaid-encoding-exit-f-20261003/`; engineering record `memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-mermaid-encoding-exit-f.md`. Update type: corrects the depth-score heuristic; refines FW-005. Runtime deployment and user acceptance are separate evidence.


### 2026-10-03 0.1.30 deployment status

status: disk_deployed_reload_pending
source_status: confirmed_by_code

After the user's explicit approval, the reviewed whole-expansion exit implementation was deployed to the proven NEWERA runtime and repository mirror; all four plugin files match dev SHA-256. This advances the earlier repository_candidate_native_pending state for code deployment only. User reload and native large-graph acceptance remain pending. No note/config/index/cache changes or automatic reload. Trace: `../../change-records/2026/2026-10/20261003-153140-mermaid-0.1.30-deployment.md`.


### Representative exit refinement (2026-10-03, 0.1.31)

status: confirmed_by_user

The user rejects the all-frontier drawing because it pulls parallel branches toward the right-hand successor like right alignment. Retain the encoded frontier analysis but draw only one representative exit -> one helper shared by the same P's distinct successors. Other terminal members keep business edges without the added convergence constraints. This supersedes the earlier requirement to draw every parallel exit.

implementation_status: repository_candidate_native_pending

The candidate ranks terminal units by complete expanded path span, carrying nested spans and preceding state expansion forward; ties use stable lexical address order only as layout choice. It is a topology heuristic, not a guarantee of pixel-rightmost position. Two actual-file fixtures (62 and 19 notes, after user repaired duplicate numbering) reduce helper edges 27->6 and 18->7; every tested state successor remains beyond its source cluster. Native UI acceptance pending; no note edits. Trace: `state/staging/mermaid-representative-g-20261003/`; engineering record `20261003-mermaid-representative-g.md`. Update type: corrects + refines; FW-005.


## 2026-10-03 temporary 0.1.29 layout comparison

status: comparison_29_disk_restored_reload_pending

User requested viewing 0.1.29 before deploying the reviewed 0.1.31. Runtime/mirror four plugin files restored from verified byte backups; dev/candidate stay 0.1.31. No note, setting, cache/index or UI reload changes. Wait for user to finish the 0.1.29 inspection before the already-authorized 0.1.31 deployment. The two selectors differ (depth score vs expanded-path representative); pixel-equivalent layout is not asserted. This is temporary comparison state, not withdrawal of the G design. Evidence: `state/staging/mermaid-representative-g-20261003/RESTORE29.json`; engineering record `20261003-155720-mermaid-restore29-comparison.md`.


### 2026-10-03 0.1.31 deployment status

status: disk_deployed_reload_pending
source_status: confirmed_by_code

After the user's explicit approval, the reviewed representative exit and shared-helper implementation was deployed to the proven NEWERA runtime and repository mirror; all four plugin files match dev SHA-256. This advances the earlier repository_candidate_native_pending state for code deployment only. User reload and native large-graph acceptance remain pending. No note/config/index/cache changes or automatic reload. Trace: `../../change-records/2026/2026-10/20261003-160419-mermaid-0.1.31-deployment.md`.


## 0.1.29 与 0.1.31 算法对照及当前证据（2026-10-03）

source_status: confirmed_by_code（算法）；inferred（截图视觉比较）
update_type: refines + supersedes（仅更新此前临时恢复、待比较的状态；保留历史过程）
affects_question: FW-005
owner: mermaid-floating-widget
layer: 派生图布局；不改变笔记编码或业务关系

### 两版都选一个出口，但选择规则不同

| 项目 | 0.1.29 | 0.1.31（包含 0.1.30 的编码出口改造） |
| --- | --- | --- |
| 出口选择 | 递归扫描成员及嵌套 subgraph，取 `编号中点的数量 + subgraph 嵌套层数 × 10` 最大者。 | 按编码的最后一个 `.` / `+` 建立局部前驱关系，自底向上汇总子图展开路径，从终端候选中选一个代表。 |
| A 深、B 在 A 后面 | 深度评分可能选中较早但嵌套更深的 A 成员。 | 若编码明确构成 A → B，A 不再是局部终端，B 的路径累计 A 的展开，再向外传递 B 的展开末端。 |
| 同分处理 | 严格大于才替换，保留先遍历到的候选。 | 展开跨度相同时按去掉前缀后的地址字符串字典序选代表；此规则不表示业务先后，也不是自然数排序。 |
| 同一 P 多个并列后继 | 每个后继分别查找出口，并建立自己的隐形节点。 | 按 P 分组，一个代表出口 → 一个共享隐形节点 → 各个去重后的安全后继头领。其他终端成员不增加汇聚约束。 |
| 折叠 | 过滤已有节点和边，不重新选择展开出口，可能留下辅助连接半段。 | 先生成可见投影，再重建出口与辅助边；折叠的头领代表其收起部分。 |
| 缓存 | 没有本次出口算法版本字段。 | `layoutExitVersion: 2` 参与配置与缓存校验，普通和应急缓存均拒绝不匹配的旧条目。 |

31 的展开跨度是拓扑启发式：普通节点自身跨度为 0，子图单元携带内部跨度；沿局部边推进时累计源单元的跨度，头领到头领的延续计 2 步，其他局部连接计 1 步；终端总跨度最大者成为代表。它不是读取渲染后的像素坐标来寻找最右节点，不能保证任意宽度、交叉连接下都获得几何最右出口。并列 `P+001`、`P+002` 不因编号大小被推断成串行。

隐形节点是布局辅助，连接它的虚线仍可见；P 到后继的业务状态关系保留。31 同时按地址确定所属容器，避免原先部分容器父关系依赖遍历时序。编码解析、业务节点身份及白签/缩放优化不属于此次出口选择规则变化。

### 性能与边界

31 使用索引和自底向上的摘要复用，减少同一 P 多个后继反复扫描源子图的工作。对有 k 个安全后继的 P，29 通常生成 k 个辅助节点和 2k 条辅助边；31 生成 1 个辅助节点和 k+1 条辅助边。这里不宣称整体算法严格线性，也没有原生环境 29 对 31 的耗时基准。

0.1.30 曾把全部终端出口连接到辅助节点，造成并列分支像右对齐。31 保留终端集合用于分析，只绘制一个代表的入边。已有真实文件重建测试的辅助边 `27→6`、`18→7` 是 **30 对 31**，不可当成 29 对 31 的性能结果。

缺失中间成员会标记 partial；循环或不可解析关系不强行选出口。继承自 30 的全局重复编号保护仍存在：相关节点出现重复身份时，可能抑制整图辅助出口，而不只是有问题的分支。本轮实际样例中的重复编号由用户修复；31 没有实现重复编号问题的局部隔离。

### 当前比较结果与后续验证

用户明确标注的 29 截图，以及切换 31 后提供的截图，显示这张图的主要分组、展开顺序与右侧后继位置整体接近；微小位置变化可能受视口或缩放影响。这是截图观察（inferred），不证明两版选中了相同节点，也不证明所有图的布局等价。已完成 31 的磁盘部署和本张图的截图比较；没有随截图取得 Console 版本报告，深 A / 后 B、并列后继、折叠边界的原生验收仍需单独记录。此前“恢复 29 后等待切换”的文字是历史状态。

代码证据：`state/staging/mermaid-encoding-exit-f-20261003/baseline/main.js` 的 `getTrueDeepestNode`；`state/staging/mermaid-representative-g-20261003/candidate/main.js` 的 `rebuildLayoutExitHelpers`、`acceptLayoutExitCache`。回归证据：G 的 `test-results.json`（40 项）、`browser-results.json`、`synthetic-browser-results.json`。部署记录：[0.1.31 部署](../../../../REFERENCE_BOUNDARIES.md#ref-033)（外部来源未随包提供）。截图源：`codex-clipboard-a6217530-8acc-42e8-ba4f-fba99d51e777.png`（29）、`codex-clipboard-98d0f1eb-82bb-4889-8095-5586a913d1e7.png`（切换 31 后）。
