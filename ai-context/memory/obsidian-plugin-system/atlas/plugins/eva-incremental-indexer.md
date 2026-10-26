# EVA 增量索引器（eva-incremental-indexer）

status: confirmed_by_code + confirmed_by_user（原生计时）
created: 2026-10-21
update: new page（此前只在 eva-branch-sidebar、antinet 卡片中作为上游出现）

## 角色与归属

- ATOM 笔记（文件名匹配 `^ATOM@`）的**派生索引**生产者。业务真源是 Vault 内 Markdown；索引可由启动全量扫描重建（`fullScanOnStartup:true`）。
- 输出目录 `项目/18-战略视图迭代/18E-GTD夹子/18E1-下一步代办事项清单文件夹/下一步代办的liner chain/`：`EVA_Indexer_State.json`（约 30.8 MB）、`EVA_Notes.json`（约 20 MB）、`EVA_Links.json`（约 1.9 MB）、`EVA_Indexes.json`（约 1.9 MB）。
- 与 eva-cross-view-relations（跨视图关系中心，自有 38 MB data.json）**无代码关系**，名字相近但是两个系统。
- 读者（只读，2026-10-21 NEWERA 扫描）：eva-branch-sidebar（EVA_Notes，改写后 250 ms 重读重解析）、eva-tree-view（EVA_Indexes 仅关键词提示）、PEO、workspace-mount、keyword-index-plugin（缓存失效）、reference-graph-widget（另读 EVA_Links，缓存失效）、json-asset-registry（登记）。atom-note-sidebar 走 Dataview，不读本索引。
- 库根另有 2026-02-28 旧 `EVA_*.json`（约 34 MB）与 `EVA_Builder_Cache.json`（15.7 MB，03-31）：归属未核，只登记不动（CLN-1）。

## 写入链（confirmed_by_code，NEWERA main.js 387–520、662–700、985–1106）

1. vault create/modify/rename/delete → 入队 → 防抖 800 ms → flush。
2. `processUpsertByPath` 比较含 `mtime`：内容未变的保存也判为变化。
3. 变化时 `saveStateFile` 与 `exportState` 对四个文件整体 `JSON.stringify(…, null, 2)`、`cachedRead` 读回比较、`vault.modify` 整写；EVA_Notes/EVA_Indexes 含 `updated` 时间戳，每次必写。

## 原生实测（2026-10-21，TV-ATTRIB 探针，confirmed_by_user）

编辑一条 ATOM 笔记约 19 s：8 轮 flush 全部 changed，每轮墙钟 1.8–3.3 s，约 430 MB 写入；同期只有 1 个 ≥200 ms 长任务（276 ms）。结论：主线程影响轻，代价是持续整写磁盘。

## 计划

工作包 **IDX-W1**（用户 2026-10-21“把频繁写盘这一项落入之后的plan里面吧”，排在 PEO-TV1 之后）：IDX-3 合并写入为主，IDX-2 内存哈希比较、IDX-1 内容未变不写随同；开工前扫描读者新鲜度依赖并请用户确认可接受滞后。权威排期在活动 `state/PLAN.md`。Trace：`results/context-key-bus-management-20261012/atom-eva-indexer-review-20261021.md`。
