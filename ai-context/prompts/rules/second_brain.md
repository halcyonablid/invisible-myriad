# 第二大脑与 Question Map 统一规则

> 唯一信息源：所有与 `state/cards/`、Question Map、card_audit 相关的工作均引用此文件。

## 规则与 skill 的关系
- 本文件是卡片、Question Map、配额、入口、守门的唯一规则源；若与 skill 说明不一致，一律以本规则为准。
- `skills/second_brain` 仅提供执行提醒和流程示意，默认遵循本规则；命令/代理提示引用本文件并可调用该 skill，但不得覆盖本规则。
- `memory/obsidian-plugin-system/change-records/` 下的工程变更记录卡不属于本文件管理的第二大脑研究卡，不进入 `state/cards/`、`state/CARD_LIBRARY.md`、Question Map、card_audit 或饱和度统计。
- `memory/obsidian-plugin-system/framework/` 下的 Obsidian 插件系统宏观框架文件也不属于 `state/cards` 第二大脑研究卡，不进入 `state/CARD_LIBRARY.md`、本轮 Question Map、card_saturation_target 或 `card_audit`。它可以登记长期框架 Question Map、origin project cards 和入口索引，但不得替代本文件规定的 `state/cards` 制卡/审计流程。
- `memory/novel-studio/` 下的证据条目（`ER-*`）、信念节点与边、Atlas（知识页、类别页、经验页）、原始资料 `sources/`、会话流水与快照、学习评估记录 `evaluation/`，以及 `novels/<id>/` 小说工作区，不属于本文件管理的第二大脑研究卡，不进入 `state/cards/`、`state/CARD_LIBRARY.md`、Question Map、card_saturation_target 或 card_audit。`novels/<id>/facts/` 中现实题材的外部来源登记在该书 `facts/sources.jsonl`，本文件“SOURCES.md 来源登记”条款对其不适用。门禁见 `prompts/rules/workflow_core.md`“Novel Studio 创作数据轻量门禁”。
- 复杂项目 checkpoint 遵守 `prompts/rules/project_continuity.md`：普通续跑状态默认写入 `state/MATERIAL_AUDIT.md`、`state/PLAN.md`、`state/RESEARCH_SUMMARY.md`、`state/CARD_LIBRARY.md`、`state/INDEPENDENT_VERIFICATION.md` 与 `state/LOG.md`；只有研究结论、概念节点或证据卡才可进入 `state/cards/`，且必须完整遵守本文件规则。

## 入口与巡检
- 唯一入口：`state/cards/卡片-工作用/项目/18-战略视图迭代/18E-GTD夹子/18E1-下一步代办事项清单文件夹/下一步代办的liner chain/表格形式索引.md`。
- researcher（或任何建卡代理）在处理输入前，必须：
  1. 打开上述索引，记录本轮关键词、母节点、兄弟节点。
  2. 在 `state/LOG.md`（独角戏"观察输入/内心思考"处）写明"Question ID → 索引关键词 → 母节点地址 → 巡检完成时间 → 遍历深度"。
  3. 完成骨架卡巡检与创建后，才可进入文档解析。

## Question Map 与饱和度
- coordinator 在 `state/MATERIAL_AUDIT.md` 与 `state/PLAN.md` 维护 Question Map：
  - 每个 Question ID 包含 `parent_atom`、`card_budget`（张数或字符）与启发式灯号规则（绿=闭环；黄=待补证；红=缺证必须返工）。
  - `card_saturation_target = Σ(card_budget) + 概念骨架卡`，写入 `state/PLAN.md`，并在 `state/LOG.md` 引用问答编号。
- researcher 每次建卡前在日志记录“Question ID → 预算消耗 → 当前灯号 → 证据引用”，并在 `state/CARD_LIBRARY.md` `logic_status` 列同步“green/yellow/red”说明。
- Step 08 进入条件：`results/card_audit.json` 达到 `card_saturation_target`、Question Map 全部绿灯或获批黄灯、`state/PLAN.md` 饱和证据已写明、`state/CRITICAL_REVIEW.md` 无红灯。

## 卡片创建
每张新卡片必须从已有卡片生长出来——**卡片不能独立存在，它的地址编号来源于与母卡的逻辑关系**。

### 制卡流程
1. **检索母卡**：先在 `state/cards/` 检索，找到与当前问题/洞见最相关的已有卡片
2. **确定逻辑关系**：
   - **同级延伸**：新卡与母卡是并列观点 → 母地址 + 新同级编号
   - **子集深化**：新卡是母卡的延伸/细节/应用 → 母地址 + `.xxx`（三位数字）
3. **生成文件名**：`ATOM@<新地址>- <标题>.md`
4. **登记 parent_atom**：front-matter 必须写明 `parent_atom: ATOM@<母地址>`
5. **路径**：文件落在 `.../下一步代办的liner chain` 及其子分支

### 地址编号规则
- **同级**：`ATOM@121.001.007.002.105` 的兄弟 → `ATOM@121.001.007.002.106`
- **子集**：`ATOM@121.001.007.002.105` 的子卡 → `ATOM@121.001.007.002.105.001`

**地址本身就是血缘记录——通过地址可以回溯到所有祖先卡片。**

### Front-matter 模板
Front-matter 字段必须存在（允许空数组）：
```yaml
---
qishiriqidate: YYYY-MM-DD
qishiriqitime: HH:MM:SS
atomle: true
antinet: atom
树的结构: true
索引关键词已录入: true
parent_atom: ATOM@<父地址>
question_ref: Q&A#xxx
tags: [示例, 可为空]
related: [示例, 可为空]
链接当前文件的: {"notes":[]}
---
```

### 引用与链接
- 正文引用使用 `[[ATOM@...- 标题]]`
- 被引用的卡片 front-matter `链接当前文件的` 需同步更新
- 若新卡成为集合或索引枢纽，回写 `.../表格形式索引.md` 并在日志注明

### CARD_LIBRARY 登记
`state/CARD_LIBRARY.md` 列出 `id | question_ref | 路径 | segment_id | logic_status | 索引/反链状态 | card_audit 时间戳`

## 原文引用与推演标注
引用外部资料或已有内容时，必须明确区分：
- **原文摘录**：`原文摘录：……（来源：<SOURCES.md 条目编号或路径>）`
- **推演/推理**：`推演（非原话）：……（依据：哪些原文/哪些前提）`

此规则确保追溯链清晰，避免"张冠李戴"。

## SOURCES.md 来源登记
所有外部引用必须在 `state/SOURCES.md` 登记来源条目，包括：
- 标题
- 作者/发布方
- URL（若在线）
- 发布日期
- 检索时间
- 关联卡片/Question ID
- 可信度评估

## 文档解析与分段
- 大型 PDF/Word 需在 `knowledge/index.json.ingest_segments` 登记 `{segment_id, page_range, status, updated_at}`，并在 `state/MATERIAL_AUDIT.md` 写出分段表。
- 解析顺序必须与 `segment_id` 一致；每处理完一段，更新 `status` 与日志（含 Question ID）。
- 若需 OCR：记录工具、模型、批大小、WER 估计；输出文本放入 `data/processed/ocr/<segment>.txt`，并在日志写明。

## 归档与追溯（火种保存）
- 项目归档使用 `@skills/project-seed-archive/SKILL.md` skill，执行 `python scripts/archive_project.py --from-input-profile`。
- 卡片 front-matter 中的 `segment_id` 字段需指向归档后的路径：`data/processed/{项目名}/raw_segments/{segment_id}.txt`。
- `state/CARD_LIBRARY.md` 记录 segment 与卡片的映射关系，归档时同步更新到 `PROJECT_MANIFEST.json`。
- **追溯链**：`用户问题 → 卡片引用 → segment_id → PROJECT_MANIFEST.json → 原始解析材料`。
- 项目结束后，所有解析材料集中在 `data/processed/{项目名}/`，支持后续问答回溯。

## 阶段性产物
- `state/RESEARCH_SUMMARY.md`：维护 QA Register（问题描述、概念卡、回答卡列表、灯号、下一步建议）、阶段性贝叶斯迭代表、风险/缺口、检索时间、资料过期提醒。
- `state/SOURCES.md`：所有来源条目包括标题、URL、发布日期、检索时间、关联卡片/Question ID、可信度。
- `knowledge/changelog.md`：记录新增/更新的手册条目、P/N、概念卡。

## 守门
- 每轮研究结束运行 `python3 tools/card_audit.py --output results/card_audit.json`，并在日志贴首尾行；`atom_cards_total`、`atom_chars_no_ws`、`missing_fields` 必须满足 Question Map 指标。
- 将 card_audit 结果摘要同步到 `state/PLAN.md`（饱和状态）与 `state/MATERIAL_AUDIT.md`（Question Map 进度）。
- 若灯号为红或 `card_budget` ≥90%，必须在日志提出补救方案或等待协调。

遵循以上规则可确保第二大脑单一入口、可追溯问答链与饱和判定一致。
