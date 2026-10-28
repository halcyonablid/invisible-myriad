# 当前共享版本与历史边界

最新整库内容同步：2026-10-28，共 4312 个文件。文件以 `../vault-manifest.json` 为准；以下插件比对与使用说明保留其原注明的核对日期。

维护者确认（2026-10-27）：大千用于分享从 NEWERA 同步的插件。共享库继续更新；历史“一统内核”方案已废弃。

本次核对了共享库中 57 个插件的 main.js，全部与当时 NEWERA 对应文件的 SHA-256 一致。manifest.json、styles.css 的逐项比较见 [机器可读清单](plugin-compatibility.json)。这是发布时点的文件比对，不证明业务数据、用户配置或运行行为完全相同。

本次相较上一公开提交更新 Collection、PEO、Workspace 的 main.js 及 GTD 的 gtd-engine.js，共 4 个程序文件；完整共享库仍包含 4,292 个文件。使用变化与已知限制见 [PEO 自治更新](PEO_AUTONOMY.md)。

本次发布依据当前源库的一致快照；最新使用说明优先读 PEO_AUTONOMY.md。其余 Atlas/Framework 仍为已有知识快照，不应把旧状态直接当成本版行为。

## 给 AI 的判定规则

1. 回答“这个库现在有什么”时，以本表和仓库 vault/.obsidian/plugins 的实际代码为证据；需要内部模块时继续读取相关文件。
2. Atlas/Framework 中 r27–r36、一统内核、大千实验批次等术语属于各自时期的记录，不能仅凭文档出现就判断当前库仍走该路线。
3. 一统内核的废案标注继续保留；历史记录中“保持原状、仅归档”描述当时处置，当前共享库定位以维护者本次说明为准。
4. 技术所有权、协议和实现是否适配应逐项核对，不自动将整个 NEWERA 或本包所有历史状态视为共享库状态。
5. 不把本分享包的业务配置当作使用者自己的配置；开发前重新确认实际运行库、依赖方和回退办法。

## 当前插件清单

| 插件 ID | 名称 | 版本 | 启用 | main.js 与 NEWERA 一致 |
|---|---|---|---|---|
| advanced-canvas | Advanced Canvas | 3.2.0 | 是 | 是 |
| antinet-tree-structure | Antinet 树的结构 | 0.1.2 | 是 | 是 |
| atom-note-sidebar | ATOM 侧栏导航 | 1.0.4 | 是 | 是 |
| better-export-pdf | Better Export PDF | 1.11.0 | 是 | 是 |
| better-search-views | Better Search Views | 0.3.0 | 是 | 是 |
| calendar | Calendar | 1.5.10 | 是 | 是 |
| cmdr | Commander | 0.5.4 | 是 | 是 |
| collection-card-view | Collection Card View | 0.1.1 | 是 | 是 |
| context-key-manager | 主键管理中心 | 0.3.1 | 是 | 是 |
| create-similar-note | 相似笔记 · Similar Note | 1.0.0 | 是 | 是 |
| daily-note-review | Daily Note Review | 0.2.0 | 是 | 是 |
| dataview | Dataview | 0.5.68 | 是 | 是 |
| eva-branch-sidebar | EVA 分支树 | 1.0.3 | 是 | 是 |
| eva-cross-view-relations | EVA Cross View Relations | 0.1.1 | 是 | 是 |
| eva-incremental-indexer | EVA Incremental Indexer | 0.1.0 | 是 | 是 |
| eva-tree-view | EVA Tree View | 0.1.4 | 是 | 是 |
| file-tree-alternative | File Tree Alternative | 2.6.0 | 是 | 是 |
| floating-toc | floating toc | 2.7.1 | 是 | 是 |
| gtd-task-manager | GTD Task Manager | 0.1.2 | 是 | 是 |
| highlightr-plugin | Highlightr | 1.2.2 | 是 | 是 |
| keyword-index-plugin | Keyword Index Plugin | 0.1.23 | 是 | 是 |
| mandala-time-blocks | Mandala Time Blocks | 0.1.14 | 是 | 是 |
| mermaid-floating-widget | Mermaid Floating Widget | 0.1.32 | 是 | 是 |
| mermaid-tools | Mermaid Tools | 1.4.1 | 是 | 是 |
| metadata-menu | Metadata Menu | 0.8.12 | 是 | 是 |
| modalforms | Modal forms | 1.70.2 | 否 | 是 |
| mononote | Mononote | 1.2.2 | 是 | 是 |
| next-action-workbench | 下一步行动台 | 0.1.0 | 是 | 是 |
| nldates-obsidian | Natural Language Dates | 0.6.2 | 是 | 是 |
| note-folder-autorename | Note Folder Autorename | 0.1.2 | 是 | 是 |
| obsidian-bulk-rename-plugin | Bulk Rename | 0.5.2 | 是 | 是 |
| obsidian-excalidraw-plugin | Excalidraw | 2.28.1 | 否 | 是 |
| obsidian-excel-to-markdown-table | Excel to Markdown Table | 0.4.0 | 是 | 是 |
| obsidian-heading-shifter | Heading Shifter | 1.10.2 | 是 | 是 |
| obsidian-minimal-settings | Minimal Theme Settings | 9.0.0 | 是 | 是 |
| obsidian-pandoc | Pandoc Plugin | 0.4.1 | 否 | 是 |
| obsidian-style-settings | Style Settings | 1.0.9 | 是 | 是 |
| obsidian-tabs | Obsidian Tabs | 1.0.7 | 是 | 是 |
| obsidian-text-format | Text Format | 3.1.0 | 否 | 是 |
| obsidian-zoom | Zoom | 1.1.2 | 否 | 是 |
| obsidian42-brat | BRAT | 1.0.6 | 否 | 是 |
| ontology-meta-hub | Ontology Meta Hub | 0.1.0 | 是 | 是 |
| outliner-md | Outliner.md | 0.1.12 | 否 | 是 |
| pane-relief | Pane Relief | 0.5.9 | 是 | 是 |
| periodic-notes | Periodic Notes | 0.0.17 | 是 | 是 |
| project-execution-overview | Project Execution Overview | 0.1.7 | 是 | 是 |
| recent-files-obsidian | Recent Files | 1.7.10 | 否 | 是 |
| reference-graph-widget | Reference Graph Widget | 0.1.1 | 是 | 是 |
| supermemo-concept-display | SuperMemo Concept Display | 0.4.0 | 是 | 是 |
| supermemo-plan | SuperMemo Plan | 0.1.0 | 是 | 是 |
| tag-wrangler | Tag Wrangler | 0.6.5 | 是 | 是 |
| templater-obsidian | Templater | 2.25.1 | 否 | 是 |
| temporal-framework | 时间框架 | 0.1.0 | 是 | 是 |
| timeline-planner | Timeline Planner | 0.1.2 | 是 | 是 |
| tray | Tray | 0.3.5 | 否 | 是 |
| view-group-hub | View Group Hub | 0.2.7 | 是 | 是 |
| workspace-mount | Workspace Mount | 0.1.4 | 是 | 是 |
