# Mandala Time Blocks

## 0.2.3 — 九宫格去类型

九宫格节点不再需要选择类型；类型管理、类型筛选、类型图标和节点的类型配色已移除。原类型筛选页改为“节点目录”，保留搜索、树形层级、定位、互联、编辑及历史入口。

九宫格 / 81 格展开及其切换、图片封面、层级导航、拖拽、关键词、笔记绑定、文件快捷方式和周追踪仍保留。节点历史、关联时间轴、记录计数及改名历史继续可用。独立 Timeline、时间块、日课、周追踪及安全审计不受本次改动影响。

旧环境状态中的 filter/types 页面映射到节点目录；旧类型筛选不再隐藏节点。EVA 节点地址及旧定位入口继续有效。节点编辑器的“关闭”保护已修改输入；清空原有内容需要点击“保存节点”并确认。保存失败时保留窗口，已有“输入恢复箱”继续保存文本输入。

旧 `type`、`typeIds` 和 `Mandala_Types.json` 原样保留兼容，本次不批量清除或重写。普通九宫格新增节点不再赋予类型；受管理的目标创建事务保留旧默认字段形状，以支持未完成事务的严格回验和恢复，这些字段不再显示为节点分类。

本版以已核实的日常运行库 0.2.2 为程序基线，保留其独立时间框、时间分类及主键协作实现。部署不复制业务 JSON、用户配置、关系索引或草稿。

## 早期切片说明（历史参考，类型相关内容已被 0.2.3 取代）

Development-only first plugin slice for turning the Mandala goal grid into a time-block tagging and color-block tracking workflow.

## Data Files

The plugin intentionally does **not** reuse legacy `TimeLog_*` names.

- `MandalaTimeBlocks_Records.json`
- `MandalaTimeBlocks_Settings.json`
- `MandalaTimeBlocks_Migration.json`

The Mandala tree remains read-only in this first slice:

- `Mandala_Database.json` is the structure source.
- `Mandala_Types.json` is display metadata only.

## Current Slice

- Plain Obsidian plugin delivery: `manifest.json`, `main.js`, `styles.css`.
- Single-instance draggable floating widget.
- Source binding via `defaultSourceNotePath`.
- Leaf-only Mandala picker.
- Quick capture, full edit, daily color overview, branch/leaf filtering.
- Legacy `TimeLog_Database.json` staging import, manual mapping, and commit.
- Multi-type node tags via `typeIds[]` with legacy `type` mirror.
- GTD-style nested type capsules for multi-select filtering and type add/edit/delete/drag reparenting in one interface.
- Per-node Obsidian note binding with vault-note picker and direct open actions.
- EVA Cross View Relations integration for Mandala node entries: node-tree rows can open the relation editor, external relation jumps reveal the type filter/manage interface with the target node highlighted, and relation mounts are rendered inline under the node row with indented special UI.

## Compatibility Notes

- `Mandala_Types.json` keeps the top-level `typeId -> config` shape and adds `parentId` / `order` fields for the capsule tree.
- `Mandala_Database.json` keeps legacy `type` while using `typeIds[]` as the canonical multi-tag field.
- Node note bindings are stored as vault-relative `{ "path": "...md", "ctime": ... }` objects.
- EVA relation node keys use `viewType="mandala-time-blocks"`, `scopeType="node"`, `scopeId="mandala"`, and `itemId=<nodeId>`; indexes are derived from the current Mandala node tree and can be rebuilt without migrating existing workspace/GTD/collection relations.
