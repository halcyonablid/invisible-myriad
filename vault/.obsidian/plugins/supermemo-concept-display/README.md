## 0.4.5 抽屉滚动稳定性

保留0.4.4库内展开/折叠/页码记忆。自动页完成后保留原滚动容器，按稳定ID更新变化的节点和子栏；缓存淘汰、来源失效同步清理界面、检查器及已加载搜索。保持可见节点位置，补偿不产生恢复写回；已有用户滚动待保存时同步补偿后的坐标。

可见内容优先，上下各最多一屏的邻近区域提前读取；不是全历史预加载。40完整页及必要祖先缓存规则、隐藏不请求、串行/manual优先/代际拒旧/恢复零写仍有效。编辑说明时不替换或关闭弹窗，关闭后补发布。

轻量浏览器相同8请求滚动对照：整壳重绘8→0，树组合32→8；两次均未出现50ms以上帧间隔，故不宣称原生帧率提速已验证。请重启Obsidian统一加载0.4.5，再确认真实大库手感。UI仍为库级最后显式写入者，旧writer共存不保证新增记忆字段保留。

## 0.4.4 · 记住展开位置与页码

已展开的逻辑分支和页码保存在当前库的Antinet UI记录中。重开先恢复上次操作路径，再恢复可视区域内曾展开的分支；隐藏页面、折叠分支和从未展开的来源不自动读取。恢复串行分帧，源内容仍只读、仅存在有界缓存。读取前显示“未加载”，不再把它显示成0。

来源结构变化时恢复可确认的祖先，不为寻找旧节点扫描全部页。此前0.4.3已保存的展开ID可恢复第一页，但旧版没有记录过的页码无法补出。此记忆为库级最后一次显式UI状态，非独立窗口历史；请重启Obsidian统一加载0.4.4，旧版UI writer不保证保留新增字段。恢复过程不写业务数据或UI；你的点击、翻页、滚动才保存UI意图。

## 0.4.3 · Antinet 抽屉分页

与 Keyword Index 0.1.24 配套：所有挂载入口保留，展开时读取直接子级，每页50项。手工抽屉锚点未加载时以原名保留；搜索/复制范围为框架、挂载和已加载抽屉。无内容迁移，私有库存储及100天颜色规则不变。

# SuperMemo Concept Display

Obsidian community plugin for managing SuperMemo Concepts and their complementary structure views:

- `胶囊`: preserves the original Concept hierarchy and editing workflow.
- `主体结构树`: builds an independent subject framework and assigns each Concept to at most one structure node.
- `Antinet 框架`: builds an independent framework tree first, then mounts Keyword Index keywords or drawers onto selected Antinet nodes through EVA Meta.
- `义胶囊`: projects every active Antinet-to-Keyword mount as a relation-local meaning capsule, grouped by its uppercase locator letter.

## Structure Tree

- Create, rename, move, collapse, archive and restore structure nodes at any depth.
- Move a node together with its existing descendant branch; the move picker excludes the node's own branch and filters valid parent paths through a searchable input.
- Search both structure nodes and Concepts.
- Assign or move a Concept from the node inspector.
- Reveal a Concept from its capsule and highlight its exact tree location.
- Restore zoom, selected node, collapsed branches and active Tab independently from business data.
- Keep archived branches and assignments available for inspection and recovery.

## Data Ownership

Current versions use vault-local `vault-concept-data.json`, `vault-concept-ui.json` and `vault-concept-drafts.json` through `vault-concept-storage.cjs`. Legacy logical keys are preserved inside these files; the plugin does not read or write the old shared browser localStorage. Content, environment state and drafts remain separate owners. Main logical keys:

- `supermemo_concepts_final_v3`: Concept records owned by this vault. Other plugins must use an explicitly compatible owner API; shared-browser storage is not an integration channel.
- `supermemo_concept_structure_tree_v1`: structure nodes, stable-ID reservations and Concept assignments.
- `supermemo_concept_structure_tree_ui_v1`: active Tab, selection, collapse, search and zoom state.
- `supermemo_concept_structure_tree_tx_v1`: bounded recovery evidence for cross-key operations.
- `supermemo_antinet_structure_tree_v1`: Antinet nodes and relation-local alias/last-known-label presentation.
- `supermemo_antinet_structure_tree_ui_v1`: Antinet selection, collapse, search and zoom state.

Opening or restoring the view performs no business write. Missing data renders an empty state, while malformed or future data fails closed instead of being normalized or replaced.

## Files

- `main.js`: Obsidian ItemView and settings wrapper.
- `supermemo-concept-display-engine.js`: capsule and structure-tree UI, persistence and recovery workflow.
- `supermemo-concept-tree-model.js`: pure tree lifecycle, validation, assignment and transaction model.
- `supermemo-antinet-tree-model.js`: manual framework and disposable drawer projection model.
- `vault-concept-storage.cjs`: vault-local content/UI/draft storage facade.
- `styles.css`: plugin host and structure-tree layout.

The following regression files belong to the development checkout, not the installed package:
- `supermemo-concept-tree-model.test.js`: pure model regression tests.
- `supermemo-concept-tree-storage.test.js`: storage/CAS/transaction fault-injection tests.
- `supermemo-concept-loader.test.js`: Obsidian restricted-loader and zero-write startup regressions.

Version `0.2.1` loads the pure tree model through the vault adapter instead of a plugin-local top-level `require`, which Electron's renderer cannot resolve relative to the plugin directory.

Version `0.2.2` replaces unsupported Tree `window.prompt` calls with a draft-safe plugin dialog and lets the desktop Tree workspace fill the available ItemView height while retaining natural narrow-screen scrolling.

Version `0.2.3` sorts every level of the subject structure tree by node name with numeric-aware comparison while preserving stored order as a same-name stability fallback.

Version `0.3.0` adds the Antinet framework surface. At its introduction, Antinet nodes and UI state used separate logical keys (now held in vault-local files) (`supermemo_antinet_structure_tree_v1` and `supermemo_antinet_structure_tree_ui_v1`). Keyword data remains owned by `keyword-index-plugin`; cross-plugin mounts remain owned by EVA Cross View Relations; Antinet stores only node structure and per-relation presentation aliases/last-known labels.

The intended workflow is: create the Antinet framework tree, select a framework node as EVA Meta source A, then select a Keyword Index keyword or drawer as B. Mounted keyword rows now enter the local meaning-capsule surface; the explicit source action opens Keyword through EVA. Local aliases do not rename the source keyword. Missing external endpoints remain visible as stale mounts until explicitly unmounted.

Version `0.4.0` adds the meaning-capsule projection. A meaning alias uses an uppercase locator letter followed by Han text, Latin letters, or digits, such as `J记录2`, `FFlight11`, or `F飞机拆下原因11`; the first letter drives grouping and navigation. The compact capsule shows the alias and essential actions only. Original Keyword labels and full Antinet breadcrumbs remain searchable projection data but are not repeated as visible annotation rows. Clicking the capsule returns to and highlights the exact Antinet mount, so no duplicate locate button is rendered; the explicit source action still opens the owning Keyword Index capsule. EVA Meta mode retains its original capture behavior.

## Verification

```powershell
node --check main.js
node --check supermemo-concept-display-engine.js
node --check supermemo-concept-tree-model.js
node supermemo-concept-loader.test.js
node supermemo-concept-tree-model.test.js
node supermemo-concept-tree-storage.test.js
node supermemo-antinet-tree-model.test.js
node ../eva-cross-view-relations/eva-keyword-routing.test.js
```


## 0.4.6 胶囊返回树定位
显式返回Antinet树目标优先于旧抽屉恢复，直接定位并在附近按需加载期间保持目标位置。手动滚动、新跳转、切换页面或来源失效立即取消定位。保留分页、缓存和滚动优化，不加载全树。


## 0.4.7 Antinet挂载层精简
关键词保留在手工节点下的挂载行；其子抽屉直接绘制在下一层，不再重复关键词。原展开/分页/重试控件归挂载行；已确认空来源不画空分支，未读来源保留展开入口。逻辑身份、分页与展开记忆、手工抽屉锚点和关键词跳转保留，不加载全树。
