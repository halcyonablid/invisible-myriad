# 大千共享库 · AI 阅读入口

这份资料包配套 [invisible-myriad](https://github.com/halcyonablid/invisible-myriad)。**大千当前是分享 NEWERA 插件的 Obsidian 库。废弃的是历史“一统内核”方案，不是当前共享库或其中插件。** 此定位由维护者于 2026-10-27 确认。

## 先给 AI 这句话

> 请先读 ai-context/README.md 和 CURRENT_BASELINE.md，再按问题查 Framework、Atlas 和开发 Skill。大千是 NEWERA 插件分享库；不要把已废弃的一统内核方案当成现行架构。说明答案来自哪份文档、是否核对了当前插件代码；未知项不要当成已实现。

在本机归档文件夹中使用时，把上面的 `ai-context/` 替换为本文件所在目录即可。

最新更新：[PEO 自治：内容编辑豁免与使用边界](PEO_AUTONOMY.md)。

## 推荐阅读顺序

1. [当前共享版本与历史边界](CURRENT_BASELINE.md)：这份库是什么、与 NEWERA 的核对范围。
2. [Framework 入口](memory/obsidian-plugin-system/framework/entry-index.md)：系统边界、阅读路线和证据规则。
3. [Atlas 总览](memory/obsidian-plugin-system/atlas/README.md) → [系统图](memory/obsidian-plugin-system/atlas/00-system-map.md) → [索引](memory/obsidian-plugin-system/atlas/index.md)。
4. 先核对 [术语](memory/obsidian-plugin-system/atlas/glossary.md) 与 [别名](memory/obsidian-plugin-system/atlas/aliases.md)，再读对应插件和工作流页面。
5. 实施开发、排障或同步时读 [开发 Skill](skills/obsidian-system-plugin-dev/SKILL.md) 及其 references；普通使用问答不必执行工程流程。
6. [整体框架报告](output/reports/obsidian_plugin_system_framework.md) 提供较长解释，历史部分需结合当前代码。

## 按问题找资料

- 如何使用、插件如何协作：Atlas 的 `plugins/`、`workflows/`、`knowledge/`。
- 名词、主键、所有者、跨插件协议：Atlas 的 glossary、aliases、contracts、对应 knowledge 页面。
- 怎么修改或诊断：开发 Skill 的协议、稳定性、日志、发布和运行库识别规则。
- 大千和统一内核的关系：CURRENT_BASELINE 和随包保留的 [历史路线说明](memory/obsidian-plugin-system/change-records/2026/2026-10/20261026-daqian-route-abandoned.md)。

可选本地查询（Python 3；从本资料包根目录运行）：

```powershell
py scripts/atlas_query.py "主键"
py scripts/atlas_query.py "GTD"
```

查询只定位本包文档，并写 `results/atlas_query_last.json`；不会读取或修改 Obsidian 库。没有 Python 也可让 AI 直接读取 Markdown。

## 路径绑定与资料边界

- GitHub 布局：`ai-context/` 是本资料包；`vault/` 是可用 Obsidian 共享库。在 Obsidian 中打开 `vault/`。
- 本机布局：本归档文件夹旁的 `大千-协作实验版/` 是共享库。应按实际位置绑定，不能把开发者旧机器路径当作执行目标。
- Atlas/Framework 为当前工作流的发布快照；开发 Skill 连同 17 份 references 一起提供。已将可识别的工作流与 Skill 绝对 Markdown 链接改为包内相对链接。
- 历史正文、终端示例和出处中的旧绝对路径仍是历史证据，不是可直接运行的命令。
- 附带的 prompts/rules 是 Skill 的来源规则材料，包含原作者工作流的专用工具要求；本分享仓库不等于完整开发工作流，不应因普通问答自动创建原作者 state、执行外部写入或假装工具已安装。
- 未包含全量 change-records/cards/sources、活动计划/state、MemPalace 数据库或完整开发工程。涉及这些缺失材料时标明“本包未提供”，按 [引用边界](REFERENCE_BOUNDARIES.md) 定位；不能捏造已查阅证据。
- 使用者的新需求、当前源码和可复验事实必须与历史声明逐项核对；插件入口文件哈希一致不代表用户配置、笔记或宿主运行状态一致。

[来源与文件哈希](package-manifest.json)记录发布文件、来源哈希与适配信息。后续更新资料包时应同时刷新插件版本清单，避免文档与共享库脱节。
