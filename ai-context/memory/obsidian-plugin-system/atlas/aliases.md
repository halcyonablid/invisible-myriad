# Atlas Aliases

status: active
created: 2026-06-24

Use this file to prevent term drift. Preserve the user's canonical terms unless a synonym is explicitly mapped here.

## Alias Map

| Alias / phrase | Canonical term | Allowed meaning | Danger |
| --- | --- | --- | --- |
| 项目执行计划 | 项目纵向管理 | Mandala 周追踪里的上层项目计划 tab | 不要理解成每周计划 |
| 项目计划 | 项目纵向管理 | Only when referring to final vision / value / current reality / next action / milestone fields | Too generic; ask or inspect context |
| 项目管理表 | ambiguous | Could mean 项目管理：按周汇总 or 项目纵向管理 | Must disambiguate |
| 周计划表 | 周追踪 | Only when referring to weekly tracking modal | Do not collapse target and project buckets |
| 项目界面 | 项目纵深管理 | Only when referring to Project Overview project interface | Could also mean Mandala project plan |
| 普通 note 事实列 | 范式积累 | Project Overview fact/material/history evidence column | Do not convert to action list |
| 明确待办 | Collection Card | Concrete next action evidence | Do not confuse with GTD prompts |
| 启发式待办 | GTD | Heuristic prompt layer | Do not treat as committed work |
| 关键词 | Keyword | Keyword capsule / symbolic entry | Do not treat as ordinary tag |
| 子概念 | SCON | `+SCON.` subconcept under drawer-folder context | Do not infer arbitrary nested concept trees |
| Mermaid 地址 | Mermaid 网络地址 | Visual-symbolic address layer | Do not treat as layout only |
| 起点模式 | 狄拉克海上的涟漪模式 | State Capsules 的手动典型起点模型 | 不要理解为自动保存最近行程终点 |
| 涟漪模式 | 狄拉克海上的涟漪模式 | Stable starting states plus transient live journeys | 不要把每次涟漪都固化成胶囊 |
| 典型状态模式 | 狄拉克海上的涟漪模式 | 只有值得长期复用的状态才显式固化 | 不要与普通瞬时状态混同 |
| active 操作上下文主键 | Effective Operational Context Key / 有效操作上下文主键 | 项目域或目标域各自通过完整载体证据、PEO声明与生命周期、Mandala追踪门禁的当前有效投影；规则见knowledge/effective-operational-context-key.md | 不要只按 Timeline 存在、Mandala retained row、显示标题或非空评论判断 |

## Forbidden Conflations

- Do not conflate `项目纵深管理` with `项目纵向管理`.
- Do not conflate `项目纵向管理` with `项目管理：按周汇总`.
- Do not conflate `周追踪` with a complete and always-current source of truth.
- Do not conflate `范式积累` with `Collection Card`.
- Do not conflate `GTD` with committed action items.
- Do not conflate `Keyword` with a tag.
- Do not conflate `EVA relation` with the source plugin's owned content.
- Do not conflate Mermaid `subgraph` containers with note node identities.
- Do not conflate a transient State Capsules journey with a maintained starting-point capsule.
- Do not conflate every `Context Capsule Key` with the narrower `Effective Operational Context Key` current projection.
- Do not conflate Timeline history or a retained Mandala plan row with current effective eligibility.

## Agent Behavior

When a user uses a term from this file:

1. Prefer the canonical term in reasoning and summaries.
2. Preserve the user's exact wording when quoting evidence.
3. If a term is ambiguous, state the ambiguity and inspect source context before deciding.
4. If a new alias appears repeatedly, add it here through the Atlas update protocol.
