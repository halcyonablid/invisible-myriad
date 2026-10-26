---
type: engineering_change_record
date: 2026-10-26
scope: 大千统一内核路线（项目 daqian-unified-core-20261006；库 D:/han/最新的/大千-协作实验版-20261005）
status: abandoned
source_status: confirmed_by_user
---

# 大千统一内核路线作废与归档说明

## 结论

用户（2026-10-26）："大千其实那时候做的是把所有数据汇集一起的，但是那个路径感觉扩展性和实施难度，后续更新成本都不如目前的R36……这是废案了，后续不会再用了。"
因此大千统一内核路线**作废**；当前唯一路线是有效操作上下文主键 BUS（实验库 r27–r36，D1 已迁移日常库）。大千实验版**不部署 r36**，保持原状，仅归档。

## 这条路线做过什么（2026-10-03 至 10-22）

- 目标：在独立的"大千-协作实验版"里，用统一内核把 Workspace/PEO/GTD/Collection/NAW/Mandala 的业务数据汇集到一个权威里，逐域迁移 owner，保留原五视图（P4-B/C/D、N1/N2、GTD D1b–D3b12 等批次，见 atlas/knowledge/unified-core-transition.md 历史段落与同期 change-records `*daqian*`）。
- 大千专有插件（只在大千库）：`daqian-coordination-kernel`（大千协作内核：阶段协调、可选刷新合并、有界诊断，不拥有业务数据）、`daqian-core-shadow`（只读观察固定项目身份与两来源）、`daqian-unified-core-lab`（保留原五视图、连接统一内核；仓库验证候选，实际宿主验收未完成）。
- 共用插件中的"大千实验室适配层"：PEO、Workspace Mount、GTD、Collection、Mandala 各插入 `dqKernel/dqObserve/dqRefresh/dqOwner`，把创建/载体/刷新调用交给内核观察与协调；注释声明不改持久化字段与原接口，内核缺席时行为同原版。
- 大千 PEO 另含 10-21/22 的 PEO-TV1/TV2/S1.5-A 追踪实验（主线后由 r24 封存版取代）。
- 10-12 主键管理 P1 曾以"定向合入、保留协调内核适配"方式部署到大千。
- 同期提出的 GTD 相对创建、PEO 重要度、动作创建等功能已在主线中，不是大千独有。

## 为什么放弃

用户判断：数据汇集到统一内核的路径扩展性差、实施难度高、后续更新成本高；r36 路线（各插件保持 owner、主键 BUS 只读快照与推式失效、按需优化）更可持续。

## 归档与备份

- 整库备份：`state/backups/daqian-abandoned-archive-20261026-113335/大千-协作实验版-20261005.zip`（61,454,787 字节，sha256 e063ebbfda8677330db1a48667728fc2f23ff07318dda93ffd5b0436bfc0f43a，4559 文件，testzip 通过，抽样哈希一致）；逐文件清单 `manifest.json`。范围：`D:/han/最新的/大千-协作实验版-20261005/` 下的 `大千-协作实验版`（库）与 `大千统一内核-本机配置`。
- 仓库内历史：项目工作区 `project_workspaces/projects/daqian-unified-core-20261006`（登记表 lifecycle 仍为 paused；项目管理器无"作废"命令，作废以本记录与 Atlas/Framework 标注为准）、`memory/obsidian-plugin-system/change-records/2026/2026-10/*daqian*`、Atlas 页 `atlas/knowledge/unified-core-transition.md`（已标 abandoned）。
- 未改动：大千库本身（只读归档）；旧库 `D:/han/最新的/大千-20261005/大千`（更早版本，不含主键管理插件）未纳入本次归档，状态不变；项目 `daqian-offline-writing-20261003`（离线写作应用）为另一项目，不在本次作废范围。

## 文档无效化

Atlas：unified-core-transition 标 `status: abandoned` 并加横幅；index、00-system-map 标注；unknowns DQ-U01/02/03 → closed_abandoned。Framework：question-map FW-025 → abandoned、章节标注；entry-index、registry 标注；maintenance-log 记录。活动 PLAN 顶部加作废说明。改前备份 `state/backups/daqian-deprecate-docs-20261026-113552`。

Framework/Atlas update check：updated（如上）。未 mine。
