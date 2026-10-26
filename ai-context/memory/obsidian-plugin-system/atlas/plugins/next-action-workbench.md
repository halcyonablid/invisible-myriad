# Plugin: next-action-workbench（下一步行动台，NAW）

status: active
updated: 2026-10-14
source_status: confirmed_by_code（NEWERA runtime main.js c226fb08…，data.json 2026-10-14 只读统计）+ confirmed_by_user（2026-10-14 标签保存需重载 NAW）

## 一句话

现在用户日常看到的"下一步行动台"界面是 **Collection Card 的行动视图**（`collection-action-view`，View Group Hub 的"下一步行动台"入口也指向它）；**NAW 插件退到幕后，充当这个界面的"行动元数据服务"**：保存每条下一步待办在某个主键下的别名、完成状态、标签、行动结构，以及主键的行动台名称，并代为查询主键资格。

## 分工

| 内容 | owner | 存放 |
| --- | --- | --- |
| 下一步待办本身（标题、所在 Collection 标签/层级） | Collection Card | Collection 数据 JSON |
| 新增下一步待办 | Collection Card（action-entry.cjs，幂等请求） | Collection 数据 JSON |
| 主键是否"有效"（能出现在行动台） | Mandala 最终有效快照；NAW 只转查 | 不落 NAW |
| 主键×待办的别名、完成、标签；主键的行动台名称；每条待办的行动结构（Ontology）及草稿 | **NAW** | `.obsidian/plugins/next-action-workbench/data.json` |
| 行动台界面（目标/项目/标签筛选 tab、按钮、弹窗） | Collection Card（action-mode.cjs） | 无（视图状态在 workspace） |

所以 Collection 行动视图上的按钮分两类：**新增待办、返回来源**走 Collection 自己；**完成、修改显示名、编辑标签、打开行动结构、修改行动台名称**都调用 NAW 的接口写 NAW 的 store。两者都必须是同一发布版本，否则会出现"未知行动操作"一类错误（2026-10-14 实例：只重载了 Collection）。

## NAW 对 Collection 行动视图提供的接口

`app.plugins.plugins['next-action-workbench']` 上：

- `getCollectionActionTargets({fresh})`：向 Mandala 查目标/项目两域当前有效主键（只读，不导入）。
- `getCollectionActionMetadata({sourceNotePath,offset})`：分页返回每个主键下待办的 `alias / completed / tags / hasOntology`。
- `getCollectionActionName(membershipId)`：主键的行动台名称（本地名）。
- `editCollectionAction(options, 'name'|'alias'|'complete'|'ontology'|'tags')`：首次操作某条待办时先登记身份（membership、sourceCard、link），再经串行 `mutateStore`（读→改→存→回读校验）写入，成功后广播 `collection-action-metadata:changed`，行动视图据此只刷新元数据。
- 计时诊断：`startCollectionInteractionMeasurement / getCollectionInteractionMeasurement`。

## NAW store 里有什么（2026-10-14 NEWERA 只读统计）

`data.json` 约 2.8 MB，revision 2194：

- `memberships` 40：曾进入行动台的主键（含已停追/移出的历史，不删）。
- `sourceCards` 113 / `membershipSourceLinks` 114：待办身份（`jump:v1:collection-card-view|笔记|tab|标签id|条目id`）及"主键×待办"关联，`completedAt` 在 link 上。
- `sourceAliases` 14、`sourceTags` 2（2026-10-14 新增）、`keywords` 129 / `membershipKeywords` 16（行动台名称）。
- `ontologies` 108：每条待办的行动结构；`recoveryDrafts` / `recoveryAuthorities` / `newActionDrafts`：编辑与新增的草稿保护。
- `reservedIds`、`uiState`：身份防重用与旧独立视图的界面状态。

## NAW 自己的独立视图（仍在，但已非主入口）

功能区 `list-checks` 图标与命令"打开下一步行动台"打开 NAW 原生视图：手动"导入"主键、按 PEO `getPrimaryCollectionCardSnapshot` 投影刷新来源、移出主键、经 PEO `revealItemNodeConfirmed` 返回来源、读取诊断命令。它与 Collection 行动视图共用同一份 store，但新功能（标签筛选、按名称排序、一排按钮）只做在 Collection 行动视图。另外 NAW 后台监听 Mandala 追踪变化与 PEO 改名事件以刷新已导入主键，并依赖 Workspace Mount 提供的 Ontology 编辑器打开行动结构。

## 维护注意

- 改 Collection 行动视图上的"元数据"功能，通常要同时改 NAW（存储/接口）和 Collection（界面），发布后**两个插件都要重载**；Collection 标签弹窗在检测到旧版 NAW 时提供"一键重载下一步行动台"。
- dev 副本 `src/` 不含 `getCollectionAction*/editCollectionAction` 等 Collection 接口（运行时 main.js 有手工改动），直接跑 `build.mjs` 会抹掉这些接口；先把接口回补到 `src/` 再构建。
- 大千库的 NAW 是另一版本（e1e14f7c），且无 Collection 行动视图；NEWERA 的标签/排序改动未同步到大千。

## 未决

- 是否把 NAW 的"行动元数据服务"并入 Collection、让 NAW 独立视图退役：可消除双插件版本耦合，但涉及 2.8 MB store 迁移与 Ontology 草稿保护，未评估。
- NAW 独立视图是否仍有人使用（导入/移出/诊断），未确认。

Trace：change-records/2026/2026-10/20261014-collection-action-sort-by-name.md、20261014-collection-action-tags.md；工作流见 [从有效操作上下文主键到下一步行动](../workflows/operational-context-to-next-action.md)。
