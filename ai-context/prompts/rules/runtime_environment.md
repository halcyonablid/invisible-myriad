# 运行环境与目录边界规则

> 本文件定义当前仓库的主运行环境、兼容层边界以及跨目录限制。所有入口文档应引用本文件，避免平台相关说明分散。

## 主运行环境
- 当前仓库的**主运行环境**是 **Codex CLI**。
- [`/mnt/d/han/学习的文件夹/7- codex来跑/卡片对话式工作流/agent-end-to-end-blog-writing-main/AGENTS.md`](../../REFERENCE_BOUNDARIES.md#ref-349)（外部来源未随包提供） 是 Codex CLI 的主入口说明。
- [`/mnt/d/han/学习的文件夹/7- codex来跑/卡片对话式工作流/agent-end-to-end-blog-writing-main/CLAUDE.md`](../../REFERENCE_BOUNDARIES.md#ref-350)（外部来源未随包提供） 保留为项目章程与流程宪章，不再视为运行时绑定文件。

## `.claude/` 兼容层
- `.claude/agents/*.md`、`.claude/commands/*.md`、`.claude/settings*.json`、`.claude/hooks/*` 保留为 **legacy Claude 兼容层**。
- `.claude/` 中的内容可以作为角色参考、历史命令说明或迁移背景，但**不是**当前仓库的唯一事实来源。
- 若 `.claude/` 与 `prompts/rules/*.md`、`AGENTS.md`、脚本行为不一致，以 `prompts/rules/*.md`、`AGENTS.md` 与仓库内脚本的当前实现为准。
- 需要“独立核查”时，优先使用当前仓库工作流里的 `verifier` agent 与 `skills/independent_verifier/SKILL.md`；不再把“外部 Codex 校验子流程”写成默认依赖。

## 当前仓库与“实际运行目录”
- 所有计划、代码修改、文档修改、脚本调整都**只能发生在当前仓库内**。
- 如果用户额外指定“实际运行目录”，只能执行：
  - 读取
  - 核查现状
  - 在当前仓库内记录分析结论
- 对“实际运行目录”默认**不得写入、不得改名、不得生成文件、不得调用仓库外脚本进行修改**；只有在“当前仓库内已有补丁草案 + verifier 独立核查完成 + 用户二次确认 + 已记录回滚来源与验证命令”四项同时满足时，才可执行受控回写。

## 高风险文件熔断
- 满足以下任一条件的目标文件，视为高风险文件：
  - 位于 `actual_run_directory` 或任何仓库外路径
  - 存在乱码、非稳定 UTF-8、未知文本编码、混合换行或明显编码回写风险
  - 位于 `dist/`、`build/`、`out/`、`release/` 等构建目录，或文件名包含 `.min.`、`bundle`、`generated`
  - 文本文件单文件大于 `200 KB`
  - 文件内容包含 `sourceMappingURL` 等构建产物痕迹
- 高风险文件禁止直接在目标文件上试错；必须先在当前仓库内创建 staging 副本做最小修改、diff 预览与验证，通过后才可决定是否回写目标文件。
- 只要出现编码不稳或高风险文件判定，禁止使用 `Get-Content` + `Set-Content`、`Out-File`、重定向覆盖等整文件重写方式直接覆盖源文件。
- 在 Windows PowerShell 5.1 下，任何“无 BOM UTF-8 + 含非 ASCII 字符”的文本文件默认按编码高风险处理；除非已经做过字节级确认，否则不得依据终端显示结果直接编辑或回写。
- 发现 mojibake、乱码常量、路径字符串异常或终端显示与编辑器显示不一致时，必须先做字节级确认，区分“显示链路问题”与“源码已被错误重编码”；在结论明确前不得继续修改目标文件。
- 对编码高风险文件，禁止让默认编码的 `Get-Content` 参与任何可回写链路；只读检查也应显式声明编码，或改用字节级/UTF-8 安全方式读取。
- 在 Windows PowerShell 下，对**源码类文本文件**（代码、脚本、规则、配置、prompt、template）的直接文件读取，若目标本应为 UTF-8 且需要可靠查看非 ASCII 内容，默认优先使用 Node 显式按 UTF-8 读取，例如：`$path='prompts/rules/runtime_environment.md'; node -e "const fs=require('fs'); process.stdout.write(fs.readFileSync(process.argv[1], 'utf8'))" "$path"`。
- 上一条仅是**默认观察链路**，不覆盖上位编码安全约束：若文件编码未知、疑似非 UTF-8、已出现显示异常，仍必须先做字节级确认；在确认前，不得把 Node 的 UTF-8 输出直接视为“源文件编码已确认”。
- 对上述源码类文本文件，默认编码的 `Get-Content` 输出不得作为可靠依据参与代码排查、规则核对或后续修改判断。

## 路径与执行边界
- 任何运行说明、命令示例、守门说明，都必须以**当前仓库根目录**为上下文，不得依赖仓库外可执行文件路径。
- 允许引用仓库内相对路径，如 `scripts/start_analysis.py`、`tools/card_audit.py`、`state/INPUT_PROFILE.yaml`。
- 不允许把仓库外绝对路径写入权限白名单、默认命令模板、hook 配置或自动化脚本。

## 状态字段基准
- `state/INPUT_PROFILE.yaml` 与 `state/AGENT_STATE.yaml.workflow` 的**规范字段**为：
  - `task_type`
  - `input_mode`
  - `external_research`
  - `structure_locked`
  - `user_material_refs`
  - `analysis_scope`
  - `actual_run_directory`
  - `notes`
  - `last_confirmed_by`
  - `last_confirmed_at`
- 旧字段名如 `structure_lock`、`document_sources` 属于 legacy alias；脚本可兼容读取，但文档与后续写入必须使用规范字段名。

## 并行与视觉能力边界
- 若运行环境支持子代理或并行执行，可以并行处理独立任务；若不支持，必须退回串行执行，不能把并行能力写成硬前提。
- 涉及 PDF 图像、扫描件、页面截图等视觉识别任务时，应明确标注：
  - 该步骤需要人工复核，或
  - 需要具备视觉能力的运行时/模型配合
- 不得默认假设 Codex CLI 一定具备与 Claude Read/Claude Vision 完全等价的能力。

## 对用户的路径呈现
- 当需要向用户说明修改计划、受影响文件或风险点时，应优先给出**当前仓库内的绝对路径**。
- 这样做的目的是让用户立即判断目标是否属于当前仓库，避免把“实际运行目录”与“当前仓库”混淆。
