# 多代理工作流核心规则

> 唯一信息源：围绕当前仓库根目录运行的全流程规范。所有代理、命令与脚本都应通过 `@prompts/rules/workflow_core.md` 获取本节内容，并同时遵守 `@prompts/rules/runtime_environment.md`。

## 冲突优先级
1. **技术准确 + 适航合规**：所有结论均需引用 `manuals/`、`knowledge/`、`state/cards/` 或其他显式证据，输出中标注“需原厂授权/适航审批”的场景不得省略。
2. **知识沉淀与追溯**：任何新结论都要更新 `knowledge/index.json`、`knowledge/ata_tree.md`、`knowledge/pn_registry.csv`、`knowledge/glossary.md` 以及 `snapshots/`、`knowledge/changelog.md`（按任务记录差异）。
3. **三层工作流**：严格遵循技术层（手册解析+可修性）→ 战略层（能力对标+投资分析）→ 数据层（可靠性统计+改进建议）；不得跳步。
4. **实用性**：所有输出面向工程/管理决策，必须附行动建议、责任人、时间轴、风险/补救。
5. **产出者 ≠ 审查者**：关键计划、规则/Skill 修改、跨文件修复、关键终稿在执行或交付前，必须由独立 `verifier` agent 做核查；在调查、计划与独立核查完成前，禁止直接修改目标文件。

## 状态文件与目录权限
- `state/STATUS.yaml`：Step 00–09 状态机，`current_stage` 决定流程推进；`awaiting_user_input` 记录待答问题。
- `state/INPUT_PROFILE.yaml`：任务元数据（`task_type`、`input_mode`、`user_material_refs`、`analysis_scope`、`structure_locked`、`external_research`、`actual_run_directory`、`notes`）。修改后要在 `state/LOG.md` 盖章并运行 `python scripts/update_agent_state.py --agent workflow`。
- `state/MATERIAL_AUDIT.md`：Question Map、Concept Priority、资料饱和度与风险；`card_saturation_target` 推导也写入 `state/PLAN.md`。
- `state/PLAN.md`：阶段目标、风险表、饱和条件公式（含 `card_saturation_target`、灯号规则、停手证据）。
- `state/cards/`：唯一的第二大脑树；`state/CARD_LIBRARY.md` 仅存映射、统计、card_audit 摘要。
- `state/CRITICAL_REVIEW.md` / `state/RESEARCH_SUMMARY.md` / `state/SOURCES.md`：批判问答、阶段性摘要与来源登记的唯一出口。
- `state/INDEPENDENT_VERIFICATION.md`：独立 verifier agent 的 findings、verdict 与下一步动作。
- 复杂项目 checkpoint / resume 遵守 `@prompts/rules/project_continuity.md`：`start_analysis.py` 只负责启动，项目续跑状态必须由 `state/MATERIAL_AUDIT.md`、`state/PLAN.md`、`state/RESEARCH_SUMMARY.md`、`state/CARD_LIBRARY.md`、`state/INDEPENDENT_VERIFICATION.md` 与 `state/LOG.md` 共同承载。
- `knowledge/`、`manuals/`、`strategy/`、`reliability/`、`parts/`、`airworthiness/`、`output/`、`log/`、`snapshots/`：写入者需遵守 `CLAUDE.md` 中的责任矩阵，任何写操作必须限定在当前仓库。

## 运行与目录约束
- 用户若指定“实际运行目录”，只能读取并在 `state/LOG.md` 标注“只读分析”；任何写入要求都需退回确认。
- Windows 平台运行 Python 需使用 `py`，例如 `py tools/pdf_ingest.py`；Shell 脚本仍使用 `bash scripts/run_analysis_stage.sh --stage writer --run`。
- 在 Windows PowerShell 下，对**源码类文本文件**（代码、脚本、规则、配置、prompt、template）做直接文件读取排查时，默认优先使用 Node 显式按 UTF-8 读取，例如：`$path='prompts/rules/workflow_core.md'; node -e "const fs=require('fs'); process.stdout.write(fs.readFileSync(process.argv[1], 'utf8'))" "$path"`；只有在已显式声明编码或已完成字节级确认时，才允许依赖 PowerShell 文本读取结果。
- 在 Codex Windows 环境中，若本地 shell / 子 agent 工具调用返回 `windows sandbox: spawn setup refresh`，必须先归类为 **sandbox 进程启动层故障**，不得据此判断目标文件路径错误、内容损坏或编码异常。
- 对上述 sandbox 启动故障，只有在当前审批策略允许、命令是只读动作、目标路径明确、重试命令与失败命令同范围时，才允许用 `require_escalated` 对同一条命令重试一次；若提权不可用或命令会写入/删除/覆盖文件，必须记录 `BLOCK` 或转入 staging/人工确认，不得扩大权限绕过。
- 若独立 verifier 的工具读取也触发同一 sandbox 故障，可以使用“嵌入证据 no-tool verifier”作为降级方案；该方案只能验证所提供摘录、校验结果和约束之间的一致性，不能宣称等同于完整文件直读验证。报告中必须明确标注 `verified from embedded evidence only`，并保留此前工具读取 `BLOCK` 记录。
- 构造嵌入证据 verifier 时，优先使用英文/ASCII prompt，避免 Windows PowerShell 管道导致中文 prompt 破坏性乱码；若需要保存验证包，应放在 `state/verification_inputs/<slug>/`，并包含来源路径、摘录边界、生成命令、时间戳以及可行时的 hash/校验摘要，不得批量复制运行库业务数据。
- 不得向仓库外写入、不得引用仓库外脚本、不得把仓库外绝对路径写入默认命令模板；所有命令以当前仓库根目录为上下文，例如 `python scripts/start_analysis.py`、`bash scripts/run_analysis_stage.sh --stage writer --run`。
- 若用户明确要求对仓库外目标执行回写，必须先在当前仓库内完成计划、补丁草案与 verifier 核查，并获得用户二次确认；在此之前，所有仓库外目标都视为只读。
- 大型 PDF/Word 解析必须登记 `knowledge/index.json.ingest_segments`，并在 `state/LOG.md` 记录分段进度，未完成前不得标记 DONE。
- 对以下场景，必须先完成调查与计划，再新开 `verifier` agent 独立核查，最后才能动手执行：工作流/规则/Skill 修改，多文件根因修复，关键终稿交付。
- 独立核查阶段允许写入 `state/LOG.md`、`state/PLAN.md`、`state/INDEPENDENT_VERIFICATION.md`；除非用户明确要求且风险可控，否则在 verifier verdict 之前不得改目标文件。
- 满足以下任一条件的文件，按高风险文件处理：仓库外路径、文本编码异常/乱码、位于 `dist/`/`build/`/`out/`/`release/`、文件名包含 `.min.`/`bundle`/`generated`、文本文件大于 `200 KB`、内容含 `sourceMappingURL`。
- 同一目标文件在同一轮修改中，若出现连续 `2` 次 `apply_patch` 匹配失败，或任意 `1` 次补丁落到错误语义块/非预期函数体，必须立即停手，转入 staging 校对或重新规划，不得继续直接试错。
- 对高风险文件，禁止直接在目标文件上试错；必须先在当前仓库内建立 staging 副本，并在 staging 上完成修改、验证与最小 diff 审阅。
- 对高风险文件或仓库外回写，落盘前必须同时满足四项门槛：字节级备份已保存到当前仓库、staging 副本验证通过、最小 diff 已预览、验证命令已通过；缺一项即不得落盘。
- 对 Obsidian 插件代码/样式/manifest、规则文件、Skill 文件、跨插件协议、运行库同步脚本或其他系统工程文件执行任何实际修改前，必须先做轻量字节级备份门禁：把将被修改的目标文件复制到当前仓库 `state/backups/<scope>-<short-slug>-YYYYMMDD-HHMMSS/`，并在同目录保存 `hashes-before.json`，逐项记录原绝对路径、备份路径、修改前 SHA-256 和预期 `rollback_source`。
- 该固定备份流程适用于单文件小改、仓库内规则/Skill 修改、runtime/dev/mirror 三边同步和高风险 staging 回写；只读分析、方案讨论、console 排障、未写文件 verifier 不触发。若涉及仓库外 actual runtime、runtime/dev/mirror 三边、编码异常、大文件、bundle/generated 等高风险文件，必须使用本文件和 `obsidian-system-plugin-dev` 中更严格的三边备份或 staging 字节级备份流程；轻量备份门禁不得降低既有门槛。
- 修改完成后必须补 `hashes-after.json` 或在工程变更记录卡中写明 after SHA-256、验证命令和回滚来源；若确实不适用备份，必须在计划、日志和工程变更记录卡中写明 `not_applicable` 的具体理由。
- 触发上述停手条件后，禁止使用 shell 整文件改写、编码转换脚本或其他“兜底覆盖”方式绕过 `apply_patch`/staging 流程；只能先完成备份、staging 修复与复核，再决定是否回写目标文件。
- 对编码高风险文件，除四项门槛外，还必须补做一次语义核对：关键路径常量、文件名常量、用户可见文案与原始来源逐项对照，确认不存在路径失效、常量乱码或界面文案污染。

## 守门脚本与命令
- `python scripts/start_analysis.py "<主题>" [--task-type ... --sources ...]`：初始化任务、更新 `state/STATUS.yaml.current_stage`→`step01`、写入 `state/LOG.md`。
- 对超长复杂项目，`start_analysis.py` 是启动门而非完整恢复机制；阶段末、切换任务、进入 verifier 前按 `@prompts/rules/project_continuity.md` 写 checkpoint。
- 多项目线程使用 `@skills/project-workspace-manager/SKILL.md`：多个 sealed checkpoint 可以并存，但任一时刻只有活动 `state/` 可写。已有活动项目时，不得用 `start_analysis.py --force` 静默覆盖；先 checkpoint，再按 `project_continuity.md` 的事务协议 switch/resume。
- `python3 tools/card_audit.py --output results/card_audit.json`：检查卡片树（卡数、字符、索引/反链），coordinator 与 researcher 都需运行并贴日志首尾 3 行。
- `bash scripts/run_analysis_stage.sh --stage <research|writer|editor|...> --run`：串联 `tools/card_audit.py`、`tools/analysis_quality_guard.py`、`tools/quote_guard.py`；命令输出（开头+结尾）必须粘贴到日志"执行动作"段。
- `python scripts/qa_state.py <request|resolve>`：维护 `awaiting_user_input` 状态。
- **`python scripts/archive_project.py --from-input-profile`**：项目火种归档（见 `@skills/project-seed-archive/SKILL.md`）。将 segments、原始材料、状态文件、卡片库归档到 `data/processed/{项目名}/`，生成 `PROJECT_MANIFEST.json`。触发时机：项目结束、用户要求保存环境、需要回溯原始材料时。
- **`py scripts/project_workspace.py ...`**：活动项目线程管理（见 `@skills/project-workspace-manager/SKILL.md`）。用于索引、只读 inspect、checkpoint、受保护切换和中断恢复；它与完成后冻结导出的 project-seed-archive 不是同一生命周期。
- `archive_project.py --restore-from` 当前未实现并会显式失败；活动项目恢复与切换使用 `project_workspace.py resume`。
- 关键改造或终稿交付前，按 `@skills/independent_verifier/SKILL.md` 新开 `verifier` agent；核查结论写回 `state/INDEPENDENT_VERIFICATION.md`。
- **`py scripts/novel_thread.py list|brief|switch|new`** 与 **`py scripts/novel_studio_beliefs.py ...`**：小说共创线程与信念账本（见 `@skills/novel-author/SKILL.md`、`@skills/novel-author-dm/SKILL.md`），门禁见本文件“Novel Studio 创作数据轻量门禁”。

## 目录写入责任（节选）
| 角色 | 可写目录 / 文件 |
|------|----------------|
| orchestrator | `state/STATUS.yaml`、`state/LOG.md`、`snapshots/`、`log/step-XX.md` |
| coordinator | `state/MATERIAL_AUDIT.md`、`state/PLAN.md`、`state/INPUT_PROFILE.yaml`（同步后盖章） |
| researcher | `state/cards/`、`state/RESEARCH_SUMMARY.md`、`state/CARD_LIBRARY.md` 映射、`knowledge/*`、`results/card_audit.json` |
| critical_reviewer | `state/CRITICAL_REVIEW.md`、`state/LOG.md` 摘要 |
| verifier | `state/INDEPENDENT_VERIFICATION.md`、`state/LOG.md` 摘要 |
| outliner | `state/ANALYSIS_OUTLINE.md` |
| writer | `manuals/`、`strategy/`、`reliability/`、`output/reports/`、`results/*.json`（writer 阶段） |
| editor | `output/checklists/quality_checklist.json`、`state/ITERATIONS.md`、`docs/status.md` |
| coding agent | `memory/obsidian-plugin-system/change-records/`（仅工程变更记录卡） |
| novel-author / novel-author-dm | `novels/**`、`memory/novel-studio/` 豁免白名单路径（见“Novel Studio 创作数据轻量门禁”） |

遵循以上通用规则，再结合 `@prompts/rules/runtime_environment.md`、`@prompts/rules/second_brain.md`、`@prompts/rules/logbook_and_guards.md`、`@prompts/rules/handoff_templates.md`，即可避免信息分裂并保持单一权威来源。

## Obsidian 插件系统宏观框架入口

`memory/obsidian-plugin-system/framework/` 是 Obsidian 插件系统宏观框架的长期入口与维护环境。它用于保存框架入口、长期 Question Map、origin project cards 登记和维护日志；`state/cards/` 中的 OPS 卡保留为本轮项目现场产物，不作为长期唯一入口。

当任务涉及 Obsidian 插件系统框架维护、框架应用、项目效能教练、Project Overview AI context export、Atlas / MemPalace / change-records 协同、跨插件 ownership 判断或系统级插件设计时，先读：

1. `memory/obsidian-plugin-system/framework/entry-index.md`
2. `memory/obsidian-plugin-system/framework/question-map.md`
3. `memory/obsidian-plugin-system/atlas/README.md`
4. 需要时再读 `output/reports/obsidian_plugin_system_framework.md`

框架文件只提供宏观分层、数据所有权、读取顺序、证据回路和维护索引；不得覆盖 `workflow_core.md`、`runtime_environment.md`、`second_brain.md` 或 `obsidian-system-plugin-dev` 的硬门禁。若未来更新框架入口、迁移框架卡、修改规则或 Skill，仍必须按规则/Skill 修改流程执行 verifier、备份、after hash 和工程变更记录。

重大 Obsidian 插件系统变动完成后，除工程变更记录卡外，还要评估是否更新：

1. `memory/obsidian-plugin-system/framework/registry.md`
2. `memory/obsidian-plugin-system/framework/question-map.md`
3. `memory/obsidian-plugin-system/framework/maintenance-log.md`
4. `memory/obsidian-plugin-system/atlas/`

## Obsidian 插件经验 MemPalace 固化流程

### Obsidian 插件修改前版本一致性门禁

当任务涉及修改 Obsidian 插件程序文件时，动手前必须先做只读版本一致性核查；该门禁仅适用于 Obsidian 插件代码、样式、manifest 等程序文件，不适用于普通文档、研究资料、业务 JSON 运行数据或非插件任务。

核查范围以本次计划修改的插件和目标程序文件为准。先证明实际 runtime，再比较三处 SHA-256：
1. canonical dev：`workspaces/26- supermemoconcept的改进/插件/<plugin>/...`
2. dev mirror：`workspaces/NEWERA/.obsidian/plugins/<plugin>/...`
3. runtime：用户指定的实际运行库 `.obsidian/plugins/<plugin>/...`

若存在多套同名插件目录（实际 vault、旧故事库、历史仓库、当前仓库 `workspaces/`、mirror、备份/staging、日期归档等），必须先列出所有候选实例并证明 actual runtime 的绝对路径。不得仅凭目录名、`.obsidian/plugins` 形状、当前 `cwd`、最近修改时间、文件大小或“看起来像运行库”判定 runtime。证明证据可以包括：用户明确指认、Obsidian console 的 `app.vault.adapter.basePath`、manifest id、插件启用状态、运行日志行号/功能现象、settings/data 与 vault 内容匹配。

如果无法证明 actual runtime，状态必须记为 `canonical_unknown`：只能做只读分析、哈希对比、diff 摘要和补丁草案，不得写入或同步任何候选目录。用户说“运行库为准”时，也必须先绑定到一个绝对路径，不能把抽象 runtime 套到任意 runtime-like 目录。

若三处文件 hash 一致，且 actual runtime 已证明，才可进入修改计划。若任一处缺失或不一致，必须先停手并向用户报告：不一致文件、各处路径、hash、建议以哪一处作为 source of truth；未经用户确认，不得继续修改或同步覆盖。

同步前还必须做 diff + feature sentinel。哈希只能证明不同，不能证明谁更新；diff 摘要要说明将新增/丢失的关键功能。已知哨兵包括：`project-execution-overview` 的 Workspace 主键项目执行计划入口、workspace 项目名解析、fallback/EVA 只读链路；`mandala-time-blocks` 的周追踪 Workspace 项目名不得退化为 `item_m...` 码。用户可见标题退化为内部 id（如 `item_m...`、`tab_ws_...`、裸 nodeKey）视为 regression sentinel，必须阻断扩大同步。

进入实际修改或同步前，必须为本轮会被编辑或覆盖的目标文件创建字节级备份；三边存在时要备份 runtime/dev/mirror 中将被改动或同步覆盖的对应文件，备份目录使用 `state/backups/<plugin>-<short-slug>-YYYYMMDD-HHMMSS/`，并写入 `hashes-before.json`。回滚来源必须指向 actual runtime 的同步前版本；若只改仓库内 dev 文件，则指向该文件的同步前备份。

该核查是只读动作，不代表允许写入运行环境。任何仓库外 runtime 回写仍必须遵守 `runtime_environment.md` 与本文件的仓库外回写门槛：当前仓库内补丁草案、verifier 独立核查、用户二次确认、备份路径、回滚来源与验证命令齐备后，才可受控回写。

当任务涉及本仓库的 Obsidian 插件系统开发、排障、跨插件通信、JSON 数据协议、UI 复刻或运行环境发布时，必须把 MemPalace 作为经验闭环使用：

1. 开发前先读 `memory/obsidian-plugin-system/framework/entry-index.md`，再通过 `scripts/mempalace_search_obsidian_plugin_memory.ps1` 或 `scripts/mempalace_restore_obsidian_plugin_memory.ps1` 搜索中央 MemPalace 的 `obsidian_plugin_system` 经验，避免重复踩坑。
2. 结合 `obsidian-system-plugin-dev` skill 区分环境态、内容态、派生态、跨插件协议、UI-only 状态与宏观框架层级。
3. 修改完成后，把关键经验写成短卡片放入 `memory/obsidian-plugin-system/cards/`。
4. 将已有散落经验源同步到 `memory/obsidian-plugin-system/sources/`，不要只停留在插件自己的 `docs/cards/`。
5. 运行 `scripts/mempalace_mine_obsidian_plugin_memory.ps1 -DryRun` 预览；真实入库必须遵守下方事务式发布门禁，不能直接污染正式 palace。
6. 用相关关键词搜索回验，确认经验能被召回；交付时必须区分“已制卡”“已 mine”“可召回”三种状态。
7. 涉及规则、跨插件协议、批量经验入库、框架入口更新或最终交付前，启动独立 verifier 核查是否已保存、已入库、可召回、已更新长期框架入口。

### Obsidian 插件 MemPalace 向量索引事务式发布门禁

真实 mine 不能直接原地写入正式 `memory/mempalace_data` 或任何当前正在被 search/restore 使用的 palace。必须先构建 staging palace，待 staging 验收通过后再发布；若当前脚本尚不支持 staging 发布，本轮只能执行 dry-run、制卡和只读验证，不得运行会改写正式 palace 的真实 mine。

staging 验收至少包含：

1. `mempalace status` 成功返回 room/drawer 统计。
2. 至少一个与本轮新增经验相关的 `mempalace search` 成功召回目标卡或目标来源。
3. HNSW segment 完整性检查通过：segment 目录不为空，且 `header.bin`、`data_level0.bin`、`length.bin`、`link_lists.bin` 存在；只有 `index_metadata.pickle` 或空 segment 目录一律视为失败。
4. 明确记录 SQLite / metadata / embeddings 与 HNSW 的状态，不得把 `chroma.sqlite3` 存在、metadata 存在、embeddings 数量增加或 dry-run 通过当作 HNSW 健康。

`dry-run` 只证明源扫描、路由和 drawer 规划，不运行真实 embedding / Chroma compactor / HNSW 持久化，因此不能证明真实 mine 可发布。首次采用新的 Chroma/MemPalace 版本、client 生命周期或 mine helper 时，必须先通过两类 smoke：一类使用预计算 embeddings 跨过实际 `hnsw:sync_threshold` 且覆盖 drawers/closets 两个 collection 和至少两个 room；另一类使用最小真实 Markdown 来源验证 source/wing/room/closet 语义。smoke 不能写 current。

真实 staging mine 必须在同一个 Chroma `PersistentClient` 生命周期内完成 drawers/closets 写入、`count/get/query` finalize，并显式关闭 client；随后必须由全新进程 reopen。fresh-process 验收对每个高区分度 expected source 同时执行 unfiltered 与对应 `--room` filtered search，禁止 fallback，且必须同时满足 exit code 0、无 `Search error` / `Internal error` / `Error finding id`、命中 expected source。普通搜索成功不能替代 room-filter 健康。

HNSW 物理检查必须从 SQLite `segments` 表中的每个 `scope=VECTOR` segment 反查同名物理目录，并逐一核对 drawers/closets collection 的 `header.bin`、`data_level0.bin`、`length.bin`、`link_lists.bin`；缺失 segment、只存在 `index_metadata.pickle`、孤儿 HNSW 目录或只检查到一个完整目录都不得放行。SQLite-only 重建、删除坏 segment 后自动回填、drawer 数正常或四文件出现，只能作为隔离诊断，未经重新从源 mine 和独立 verifier 不得发布。

发布前必须保留 `previous-good` 和时间戳备份；发布动作应当是“已验收 staging -> 备份 current -> 原子切换/受控替换 -> 再次 status/search 回验”。失败的 staging 必须隔离到 `corrupt` 或 `failed-staging` 目录，不得覆盖 current 或 previous-good。

真实 mine 或发布命令超时时，先观察进程、CPU、锁文件、目标文件最后修改时间和日志；shell timeout 不等于 mine 失败。确认仍在运行时应等待或记录 `running`，不得立即重复 mine、移动 current、删除 HNSW segment 或启动第二个写入进程。只有确认无写入进程且 staging 验收失败，才可执行隔离/重建。

每次真实 mine 都必须生成 manifest / mine log，至少记录：时间、source 目录、palace/staging/current/previous-good 路径、源文件数量、关键源文件 hash 摘要、执行脚本/helper SHA-256、current preflight 稳定语义指纹、命令、exit code、SQLite collection/embedding/segment 映射、每个 VECTOR segment 的 HNSW 文件状态、filtered/unfiltered status/search 验证词、成功/失败结论和回滚来源。没有 manifest 的旧运行不能作为“已 mine 可召回”的证据。

MemPalace 向量索引失败、HNSW/Chroma 报错、超时或不可用时，不得退回到 repo root、`workspaces/`、`state/backups/`、`memory/mempalace_data*`、历史 vault、`.git`、`node_modules` 或 runtime-like 目录做全量 `rg`。Obsidian 插件系统经验查询只能使用上述专用脚本的 bounded fallback；fallback 的扫描入口固定为 `memory/obsidian-plugin-system/{atlas,cards,change-records,framework,sources}`，并通过 `-Room` 白名单、`-MaxResults` 和 `-TimeoutSeconds` 收敛。若需要查源码或运行库事实，必须另按契约影响面扫描或 runtime/dev/mirror 门禁执行，不得把记忆召回失败扩大成全仓搜索。

### Obsidian 插件工程变更记录卡

工程变更记录卡用于记录“这次程序到底改了什么”，与设计理念卡、经验卡和 `state/LOG.md` 分工不同：

1. `state/LOG.md` 记录本轮代理过程、命令和守门上下文。
2. `memory/obsidian-plugin-system/cards/` 只记录可复用经验、原则、设计理念和跨任务启发；需要 dry-run 后 mine 到 MemPalace。
3. `memory/obsidian-plugin-system/change-records/` 记录每次实际程序/规则/Skill 改动的事实账本；默认不参与 `state/cards/`、`CARD_LIBRARY.md`、Question Map 或 MemPalace mine，除非另行提炼成经验卡。

触发条件：只要本轮实际修改了 Obsidian 插件程序文件、插件样式、manifest、规则文件、Skill 文件、跨插件协议、运行库同步脚本或其他会影响系统行为的工程文件，交付前必须新增一张独立工程变更记录卡。纯只读分析、方案讨论、console 排障、未写文件的 verifier 不触发；若同一轮包含多个互不相关改动，应拆成多张记录卡；同一功能链路的多文件联动可合并为一张。

备份要求：触发工程变更记录卡的同一批目标文件，实际修改前必须已有字节级备份和 `before_hashes`；修改完成后必须补 `after_hashes`、验证命令和 `rollback_source`。若因纯新增文件没有 before hash，写 `new_file`；若文件被删除，写删除前 hash 并在 `after_hashes` 标注 `deleted`。不得用“改动很小”跳过备份；若确实 `not_applicable`，必须说明原因，例如纯新增文件或只读 verifier 没有目标文件可备份。

目录与命名：

1. 目录：`memory/obsidian-plugin-system/change-records/YYYY/YYYY-MM/`
2. 文件名：`YYYYMMDD-HHMMSS-<plugin-or-scope>-<short-slug>.md`
3. `plugin-or-scope` 使用插件 id 或规则域名，例如 `project-execution-overview`、`mandala-time-blocks`、`workflow-rules`。

每张工程变更记录卡必须包含：

```yaml
---
record_type: engineering_change_record
created_at: YYYY-MM-DD HH:mm:ss +08:00
scope: <plugin-or-rule-scope>
plugins: [<plugin-id-or-empty>]
files_changed: []
runtime_path: <actual-runtime-or-empty>
change_summary: <one-line-summary>
reason: <why-this-change-was-needed>
before_hashes: {}
after_hashes: {}
backup_path: <backup-path-or-empty>
verification: []
rollback_source: <path-or-empty>
touched_business_data: false
related_experience_cards: []
---
```

正文必须用短段落写清：改动背景、改动点、验证结果、已知剩余风险、回滚方式。不得粘贴大量 diff 或完整源码；只引用关键文件路径、hash、备份目录和验证命令。若本轮没有触碰 runtime/dev/mirror，`runtime_path` 可写 `not_applicable`；但只要触发了工程变更记录卡，`backup_path`、`before_hashes`、`after_hashes` 和 `rollback_source` 默认必填，只有纯新增文件可在对应 before hash 中写 `new_file`。

混淆防护：

1. 工程变更记录卡只回答“本次做了什么”，不写成长篇方法论。
2. 若从本次改动中总结出可复用判断，应另建 `memory/obsidian-plugin-system/cards/` 经验卡，并按 MemPalace dry-run/mine 流程处理。
3. 工程变更记录卡可以链接经验卡；经验卡可以反链变更记录卡，但二者不能互相替代。
4. 工程变更记录卡不得放入 `state/cards/`，不得登记到 `state/CARD_LIBRARY.md`，不得计入 card_audit 或 Question Map 饱和度。

MemPalace 环境保持集中在 `D:\han\学习的文件夹\10- mempalace记忆宫殿`，当前仓库只维护 `memory/obsidian-plugin-system/` 作为经验输入入口，不复制完整 MemPalace 环境。

## Novel Studio 创作数据轻量门禁

适用范围：由 `skills/novel-author` 与 `skills/novel-author-dm` 驱动的小说共创会话。写小说需要心流，因此创作数据与系统工程文件分开管理：回合之间只记证据，会话结束统一做一次 Framework/Atlas update check，只有修改 Skill、脚本或规则时才走独立核查。唯一例外：回合之间可以登记带把握度的猜测：作者假设或竞争信念（`new-belief --origin author_assumption|rival`，impact ≥ 2，每会话合计最多 4 条，写下预测、p 与理由，不写 Atlas、不摄入），让它在用户反应之前入账。

1. **写入范围**：小说会话只写 `novels/**` 与下方白名单中的 `memory/novel-studio/**` 路径；不写 `state/*`、`project_workspaces/**`，不需要 checkpoint 当前活动工程项目。`novels/active.json` 是小说线程指针，与 `project_workspaces/active-project.json`（工程项目线程指针）相互独立，不构成第二个活动项目。
2. **豁免白名单**（创作数据，不属于系统工程文件；不触发独立 verifier、字节级备份、工程变更记录卡、card_audit，也不写 `state/LOG.md` 独角戏）：
   - `novels/**`
   - `memory/novel-studio/sessions/**`、`evidence/**`（含 `ledger-events.jsonl`）、`beliefs/**`、`evaluation/**`（学习成绩单、评审记录、趋势页与评审报告；成绩单与趋势页由脚本生成）、`atlas/**`（知识页、类别页、经验页等页面内容；页面格式由非豁免的 `framework/schema.md` 规定）、`.snapshots/**`
   - `memory/novel-studio/sources/**`：原始资料，只增不改（已有文件不改写，更正时新增文件）
   - `memory/novel-studio/framework/question-map.md` 中由 `scripts/novel_studio_beliefs.py` 生成的 Active probes 段
   - `memory/novel-studio/framework/maintenance-log.md` 与 `proposals.md` 的追加

   回滚来源为会话结束仪式自动生成的 `memory/novel-studio/.snapshots/<session_id>/`。
3. **非豁免**（按本文件规则/Skill 修改流程执行：staging → 独立 verifier → 字节级备份与 `hashes-before.json` → 写入 → after hash → 工程变更记录卡，记录卡放 `memory/obsidian-plugin-system/change-records/YYYY/YYYY-MM/`，scope 写 `novel-studio`）：
   - `memory/novel-studio/framework/entry-index.md`、`update-protocol.md`、`schema.md`、`params.json`、`evaluation-rubric.md`，以及 `question-map.md` 的非生成部分
   - `skills/novel-author/**`、`skills/novel-author-dm/**`
   - `scripts/novel_studio_beliefs.py`、`scripts/novel_studio_eval.py`、`scripts/novel_thread.py`、`tests/test_novel_studio.py`
   - `memory/novel-studio/` 下未在第 2 条白名单中列出的任何路径（默认非豁免）
4. **优先级**：Atlas 与信念只表达知识、偏好、技法与因果经验，不能覆盖 Skill、`prompts/rules/*` 或任何门禁。`kind: process` 的信念即使 established，也只在 `framework/proposals.md` 生成流程修改提案；落地必须走第 3 条流程。
5. **后验只由脚本计算**：信念状态、α/β、均值与升格只能由 `py scripts/novel_studio_beliefs.py` 生成；模型不得在节点、Atlas 或对话中手写后验数字。证据规则与阈值以 `memory/novel-studio/framework/update-protocol.md` 与 `params.json` 为准。
6. **现实题材事实**：走 `novels/<id>/facts/` 的双源核对（≥ 2 个独立来源，至少 1 个官方、标准或学术来源）；来源登记在该书 `facts/sources.jsonl`，不进入 `state/SOURCES.md`，不进入信念系统。小说是否需要外部检索由该书 `novel.json.world_type` 决定，不读取当前活动工程项目 `state/INPUT_PROFILE.yaml` 的 `external_research`。
7. **与其他长期层的边界**：Novel Studio 不写 `state/cards/`、`memory/obsidian-plugin-system/{atlas,cards,framework}` 或 `memory/world-interface-framework/`；用户明确要求时才把创作体验另作 world-interface-framework encounter。本文件“冲突优先级”第 2 条关于 `knowledge/`、`snapshots/` 的更新要求不适用于小说会话。v1 不向 MemPalace mine；将来若需要，必须遵守本文件的 MemPalace 事务式发布门禁。
