# Effective Operational Context Key / 有效操作上下文主键

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
updated: 2026-10-13
source_status: confirmed_by_user_and_code

## Canonical Definition

`有效操作上下文主键`不是一种新的主键，也不是新的业务数据 owner。它是现有 `Context Capsule Key / 操作上下文主键` 在“当前是否仍可进入前向工作”问题上的派生有效性投影。

有效集合分成项目域与目标域；两者共享评论声明与追踪生命周期门禁；历史 Kill 仅用于诊断，但载体证据和稳定身份不同。

一个项目域操作上下文主键只有同时满足以下条件，才进入有效集合：

1. Workspace Mount 的 `项目清单和执行待办事项汇总` 当前根层仍存在该条目载体；
2. Project Overview 的该 Workspace 条目评论中存在完整的 `--- ... ---` 操作上下文主键声明；
3. 声明中恰好有一个当前主键；多个当前声明必须 fail closed。2026-10-13 起（policy `tracking-only-v2`）编号前缀不再表达生命周期：`9XX` 不再是归档声明，退出前向工作只靠明确停止追踪；
4. Mandala / 九宫格项目周追踪中存在该项目的计划载体，并且当前未停止追踪。

可写成：

```text
有效操作上下文主键
= 当前 Workspace 根条目载体
∧ 完整的 Project Overview 评论声明
∧ 恰好一个当前声明（编号前缀不表达生命周期）
∧ Mandala 项目追踪存在且未停止
```

一个目标域操作上下文主键只有同时满足以下条件，才进入有效集合：

1. Mandala 当前 owner 快照中仍存在该完整稳定节点；
2. 该 Mandala 主键节点存在恰好一条正向 `承载` 边，目标是 GTD 顶层项目节点；反向边、普通关系、GTD 子节点、零条或多条候选均不成立；
3. Project Overview 的该 Mandala 主键评论中存在完整的 `--- ... ---` 操作上下文主键声明；
4. 声明中恰好有一个当前主键（`9XX` 不再自动归档）；
5. Mandala 目标执行计划中存在该 owner，并且当前未停止追踪。

可写成：

```text
目标域有效操作上下文主键
= 当前 Mandala 稳定节点
∧ 唯一正向 Mandala → GTD 顶层项目「承载」
∧ 完整且唯一的 Project Overview 评论声明
∧ Mandala 目标追踪存在且未停止
```

因此，“有一个九宫格节点”本身不等于目标主键；“有一个同名 GTD 节点”也不构成证明。资格只按稳定 node key 与 EVA 正向关系证据判断，不按标题拼接。

这一定义是当前资格判断，不重写历史。Timeline 中仍然存在的条目、里程碑或周记录只证明曾经发生过安排，不会反向授予当前有效资格。

## Identity And Metadata

- 最终项目身份是完整 Workspace `jump:v1` node key；它是跨本轮聚合仍需冻结的稳定 target identity。
- 最终目标身份是完整 Mandala `jump:v1:mandala-time-blocks|...|node|mandala|<nodeId>` node key；Timeline 的旧 `mandala-time-blocks::goal::<nodeId>` 仅是兼容映射，不替代资格身份。
- Workspace node key 中的 notePath 必须由 Workspace owner 自己的 canonical sourceNotePath 产生；Mandala 的 `九宫格目标.md` sourceNotePath 不能覆盖或重造 Workspace 的 `④workspace挂载.md` 身份。Mandala 先取得 Workspace 快照，再把快照返回的 sourceNotePath 与完整 node key 交给 Project Overview 校验。
- 评论中的 Context Capsule Key 描述符是操作语义与显示元数据，不替代完整 Workspace target identity。
- GTD 顶层项目 node key 与 EVA `承载` 关系是目标域的载体证据，不成为新的目标 owner；目标 owner 仍是 Mandala 稳定节点。顶层资格必须由 GTD owner 输出的结构字段共同证明：`Type=project`、`Top Level=true`、`Parent ID` 为空；不得从 `pathLabel`、标题或路径文字反推。
- 显示名称、评论文字、历史 `9XX` 声明和 Timeline 条目都不能单独作为稳定身份。
- 当前有效集合是派生投影；Workspace、Project Overview、Mandala 仍分别拥有自己的业务数据与生命周期证据。

## Ownership And Provider Chain

| Layer | Owner | Responsibility |
| --- | --- | --- |
| Carrier and stable target | Workspace Mount | 提供当前根层 Workspace 项目条目、完整 `jump:v1` 身份和可读路径标签。 |
| Context declaration and legacy diagnostics | Project Overview | 从评论解析操作上下文主键声明（编号不表达归档），保留历史 Kill 诊断，不以此否决资格；不接管 Workspace 或 Mandala JSON。 |
| Goal carrier relation | GTD Task Manager + EVA | GTD 以稳定 node key 及 `Type / Top Level / Parent ID` 结构字段证明顶层项目，EVA 拥有 Mandala → GTD 的正向 `承载` 关系；标题、`pathLabel` 相同不替代结构与关系证据。 |
| Tracking lifecycle and final aggregate | Mandala Time Blocks | 分别结合当前项目/目标追踪状态，执行有界一致性读取，并发布两个域的最终有效集合。 |
| Effective Ontology projection | Mandala / Ontology Meta Hub | 以 `项目有效操作上下文主键` 与 `目标有效操作上下文主键` 两个独立 family 分域投影最终有效集合；无论对应 Ontology 为空或已有内容，都必须显示。 |
| Historical Ontology envelope | Mandala / Ontology Meta Hub | 原有 `项目主键`、`目标主键` family 只作为长期知识包络；正常发现页不再展示，显式 History 只读显示退出对象，不反向进入有效集合。 |
| Admission consumers | Temporal Framework, Next Action Workbench | 只把最终有效集合用于新候选和后续有效性刷新；不自行重算上游规则。 |
| Timeline allocation consumer and historical time evidence | Timeline Planner | 项目域的新导入与默认可排块集合只接收最终有效集合；保留历史条目、日期、周记录和里程碑，但只读呈现且不授予有效资格。 |

## Public Read Contracts

```js
await window.__workspaceMountPluginApi.getProjectOverviewWorkspaceEntrySnapshotV2(options)
await window.__projectExecutionOverviewPluginApi.getWorkspaceOperationalContextKeySnapshot(options)
await window.__projectExecutionOverviewPluginApi.getMandalaOperationalContextKeySnapshot(options)
await window.__evaCrossViewRelationsPluginApi.getOutgoingRelationBatchSnapshot(options)
await window.__gtdTaskManagerPluginApi.getContextCapsuleTopLevelProjectCarrierBatchSnapshot(options)
await window.__mandalaTimeBlocksPluginApi.listEffectiveOperationalContextKeys(options)
await window.__mandalaTimeBlocksPluginApi.listEffectiveGoalOperationalContextKeys(options)
```

`listEffectiveOperationalContextKeys()` 与 `listEffectiveGoalOperationalContextKeys()` 分别是项目域和目标域的最终 v1 契约。项目域聚合 Workspace、Project Overview 与 Mandala；目标域聚合 Mandala owner/追踪、Project Overview 评论声明，以及 PEO 对 EVA/GTD owner 批量快照的确定性归约。EVA 一次返回请求 owner 的原始正向 `承载` 基数；GTD 一次返回 Context Capsule Key 对应的 active 顶层项目载体；PEO 不再构建全局图来证明局部唯一性。两者都执行有界一致性读取并冻结 `revision + providerGeneration`。不得靠隐藏 leaf 激活、陈旧 GTD engine、轮询、全 Vault 扫描、标题匹配或直接读取其他 owner 的 JSON 完成聚合。并发相同请求只复用 in-flight Promise，不把旧结果当作资格缓存。

任何 provider 缺失、超时、结构不完整、截断、版本不支持、超过上限、修订不一致或多个当前声明，最终契约都 fail closed。失败结果必须带原因和诊断；消费者不得退回显示名匹配、Timeline 存在性或旧缓存来放行。

## Consumer Rules

| Consumer | Effective-set use | Historical behavior |
| --- | --- | --- |
| Ontology 项目有效操作上下文主键 | 只投影项目域最终有效集合；条目资格不依赖 Ontology 内容状态，空表也必须出现。 | 不含已停止、Workspace 载体消失或声明失效的项目；项目快照不完整时项目域 fail closed。 |
| Ontology 目标有效操作上下文主键 | 只投影目标域最终有效集合；必须以完整 Mandala owner 与 GTD/EVA 承载证据建立身份，空表也必须出现。 | 不含已停止、Mandala/GTD 承载消失或声明失效的目标；目标快照不完整时目标域 fail closed。 |
| Ontology 历史项目/目标主键 | 原有长期知识包络，不再作为有效集合的计数或候选来源。 | 既有/退出对象仍可在显式 History 中只读发现；旧关键词、深链与保存状态继续解析原 family identity。 |
| Mandala 项目/目标执行计划 | 当前纵向表和打印表只展示各自最终有效集合；不得把“未停止追踪”单独当作前向工作资格。 | `查看已不追踪 / 归档` 只读展示未进入有效集合的保留计划；不删除周记录或纵向字段。 |
| Mandala 项目/目标按周汇总 | 所选周当前表只展示 `当周 retained rows ∩ 对应域当前 final snapshot`；打印中的周汇总复用与执行计划相同的双域快照。快照不完整时当前表 fail closed。 | `查看已不追踪 / 归档` 只读展示所选周已留存但当前已退出有效集合的记录；不补造当周未观察到的行，不进入 dirty/readers/save payload。 |
| Temporal Framework | 新导入候选必须同时取得完整项目域与目标域快照；任一域不可用，整批候选 fail closed。 | 已有 membership 和战略历史不删除、不自动退出；标签快照与 owner 数据不回写。 |
| Next Action Workbench | 新候选和 membership lifecycle 刷新使用双域最终快照；身份由 `domain + sourceScope + sourceKey` 隔离。 | 既有行动与历史保留；任一 provider 失败时刷新为 no-op，不能把全部对象误判为 inactive。 |
| Timeline Planner | 项目域和目标域的导入、默认可见时间池及排块/里程碑/编辑动作只接收各自最终有效集合。final target 映射回既有 project/goal external key，以更新而非复制已有 Timeline 事项。任一对应快照缺失、超时或不完整时该域候选 fail closed，不得退回宽泛周追踪池。 | 既有 Timeline 条目、日期、周记录和里程碑不删除；显式历史路径只读显示。退出有效集合的项目或目标不能再排块、加里程碑或编辑，也不能因 Timeline 仍有记录而回到有效集合。 |

消费者必须验证 `contractVersion`、`generatedAt/providerGeneration/revision`、完整性、截断状态、数量、每个 target 的正确 domain/active 状态、该域完整 `jump:v1` 身份、`contextKey.contextKeyId/address/canonicalLabel/displayLabel`、evidence revision 与唯一 owner。任一 target 非法或重复都必须整批拒绝；双域候选消费者还必须在任一域不可用时整批 fail closed。不得静默过滤/去重后把缩小集合当作成功，也不得把当前一次诊断计数写成固定产品常量。

## Compatibility And Zero-Write Boundary

1. 本契约没有迁移或改写 Workspace、Project Overview、Mandala、Timeline、Temporal 或 Next Action 的业务 JSON。
2. 旧 Timeline/周追踪/Temporal membership/Next Action membership 继续可读。
3. Ontology 以只读派生 family `项目有效操作上下文主键` 和 `目标有效操作上下文主键` 分域投影两个最终快照；其行由对应快照直接生成，空内容不影响资格。原有 `项目主键`、`目标主键` 退出正常发现，仅在显式 History 中保持只读可发现性，符合 FW-018。
4. Project Overview 评论依旧是用户内容态；本次只读解析，不改变评论保存、关闭或草稿行为。
5. 2026-09-04 的按周汇总对齐已落入 Repository Dev；Runtime、Repository Mirror 与业务 JSON 未被该切片改动，等待独立部署确认。

## Current Read-Only Audit

2026-08-31 对已证明 Actual Runtime 的项目域只读审计得到：72 个当前 Workspace 根载体，37 个具有评论声明，39 个具有 active Mandala plan；应用完整交集与声明级 `9XX` 规则后是 20 个项目域有效操作上下文主键。这个 `20` 只是当时的数据诊断，不是测试常量，也不保证未来仍相同。目标域数量必须由新的完整目标快照动态给出，不能从九宫格节点数、GTD 标题数或 Timeline 历史数推断。

用户指出的 `item_mpqmipsxcwe63 / hbit好了，我可以总结一下` 虽然有 Workspace 载体、active Mandala plan 和 Timeline 历史，但没有 Project Overview 评论中的完整操作上下文主键声明，因此不属于有效集合。

## Verification And Trace

- implementation plan: `state/verification_inputs/ontology-effective-operational-context-keys-20260830/IMPLEMENTATION_PLAN.md`
- focused plan recheck: `state/verification_inputs/ontology-effective-operational-context-keys-20260830/EXPANDED_PLAN_FOCUSED_RECHECK.md`
- implementation backup: `state/backups/effective-operational-context-keys-dev-20260831-042453`
- framework/docs backup: `state/backups/effective-operational-context-contract-docs-20260831-090900`
- staging: `state/staging/effective-operational-context-keys-20260831-042453`
- repository tests: Workspace / Project Overview / Mandala syntax, Temporal Framework full suite, Next Action Workbench full suite, and focused Ontology Meta Hub regressions pass.
- final verifier: `state/verification_inputs/ontology-effective-operational-context-keys-20260830/POST_CHANGE_VERDICT.md` is `PASS` with P0=0, P1=0 and one non-blocking test-backup P2.
- deployment evidence: after explicit confirmation, the five verified `main.js` bundles are synchronized across Repository Dev, actual Runtime and Repository Mirror. Hashes align `15/15`, syntax aligns `15/15`, feature sentinels pass `30/30`, full Temporal/Next and three Ontology/Hub integration suites pass, and the 39-file silent copy window has zero protected-data changes. Deployment backup: `state/backups/effective-operational-context-keys-deploy-20260831-160309`; independent verdict: `DEPLOYMENT_VERDICT.md`, static acceptance `PASS_WITH_ACTIONS` with P0=0/P1=0/P2=1.
- remaining evidence: the currently loaded Obsidian process must reload the five plugins or restart before loaded interaction/exact-set smoke can be claimed.
- 2026-09-01 goal-domain extension backup: `state/backups/goal-effective-context-dev-20260901-110947`; Repository Dev PEO/Mandala/Timeline focused regressions and full Temporal/Next suites pass. Final independent verifier returned `PASS`, P0=0/P1=0/P2=0, on the frozen 31-file after-hash set.
- 2026-09-01 deployment: the user explicitly confirmed deployment. Seven code-only assets were synchronized Dev → Actual Runtime + Repository Mirror under `state/backups/goal-effective-context-deploy-20260901-133547`. Dev/Runtime/Mirror are 21/21 hash-aligned; syntax is 21/21; focused regressions are 3/3; Temporal is 10/10; Next Action is 6/6; all 66 environment/runtime-denylist/business-data sentinels remain byte-identical. Deployment verifier returned `PASS`, P0=0/P1=0/P2=1 and marked the result deliverable. Loaded Obsidian UI smoke remains pending reload.

## Framework Claim

```yaml
claim:
  statement: Effective Operational Context Key is the bounded, fail-closed current eligibility projection for project and goal domains; projects derive from Workspace carrier, while goals derive from an exact Mandala owner plus one forward EVA carrier to a GTD top-level project; both also require a unique Project Overview declaration and Mandala non-stopped tracking; legacy Kill is historical diagnostics only and never vetoes eligibility (policy tracking-only); Timeline history never grants eligibility.
  layer: execution aggregation / planning admission
  owner: existing owners remain Workspace Mount, Project Overview, and Mandala Time Blocks
  provider: Mandala Time Blocks final project/goal aggregators
  consumer: Ontology, Mandala planning surfaces, Temporal Framework, Next Action Workbench, Timeline Planner
  contract_type: bounded read-only snapshot
  source_status: confirmed_by_user_and_code
  evidence: user-confirmed source flow, repository implementation/tests, read-only actual-runtime audit
  affects_question: FW-018, FW-019
  update_type: splits + refines; 2026-10-13 corrects (Kill removed from eligibility)
```

## Ontology Discovery Family

`mandala-effective-project-operational-context` 与 `mandala-effective-goal-operational-context` 是 Mandala 提供、Ontology Meta Hub 展示的两个只读发现 family。它们不创建第二个 owner、Schema 或业务文档：项目 family 以完整 Workspace `jump:v1` 定位原项目，目标 family 以完整 Mandala `jump:v1` 定位原目标，各自只呈现对应最终快照的合格 target。内容状态（已有内容 / 空表 / 不可知）只影响状态徽标，绝不影响有效条目是否出现。

旧 `mandala-effective-operational-context` 保留为隐藏兼容入口，继续解析既有关键词、深链和保存状态，但不再出现在正常发现列表。`mandala-project-primary`、`mandala-goal-primary` 也从正常发现退出，在显式 History 中分别作为历史项目/目标知识包络只读展示。因此不得用这些 family 的显示数量互相校验，更不得从 Timeline、旧 Ontology 文档或历史主键反推当前资格。

Ontology 来源码沿用当前新版双轨契约：系统可生成 `autoPrefix` 作为默认值，用户设置的 `manualPrefix` 始终优先；两者均持久化，清除手工值后恢复原自动值。新增有效项目/目标 family 不改变该分配、覆盖、重载或解析规则；旧版“只能自动分配”不作为当前行为回迁。

## 2026-09-02 Runtime Deployment Closure

用户明确确认后，`ontology-meta-hub/main.js` 与 `mandala-time-blocks/main.js` 已按 Repository Dev → 已证明 Actual Runtime + Repository Mirror 的方向同步。三个角色的 Hub 哈希统一为 `58C5DAC2EA5B3340A6093B0706FC7E8AC07AD40CDAF221124F0D1D0D87CECEAE`，Mandala 哈希统一为 `BDF763775531516DEFE592950840B6C0FAB5162D674521527678A6A6271F3A23`；Runtime/Mirror 语法、功能哨兵及完整 Hub 回归通过。

部署只写入上述两个 `main.js`。部署后的延迟审计观察到 Actual Runtime 的 Ontology `data.json` 与 `.obsidian/community-plugins.json` 被正在运行的 Obsidian 主机另行保存；它们不在复制 allowlist 中，未被部署流程覆盖或回滚。其余 16 个受保护文件保持原哈希。静态部署已完成，当前加载进程的页面级交互 smoke 仍需重载 `ontology-meta-hub` 与 `mandala-time-blocks`（或重启 Obsidian）后确认。

## Mandala Goal Tracking Surface

`目标执行计划` 的当前表与打印投影只消费 `listEffectiveGoalOperationalContextKeys()`。归档路径保留未进入最终目标集合的计划行，并保持只读。恢复追踪只能恢复 Mandala 自己的追踪状态；若 GTD 顶层承载、PEO 声明等资格证据仍不完整，目标仍不会进入当前有效集合。

`目标管理：按周汇总` 同样消费该最终快照，但不会依据快照补造历史行。默认表是所选周 Mandala 已留存 goal rows 与当前最终目标集合的交集；退出记录通过该页独立的 `查看已不追踪 / 归档` 只读查看。归档行没有 textarea、不会进入 `goalSummaryRows`，保存失败会恢复 dirty 并阻止模式切换。

## Mandala Project Tracking Surface

`项目执行计划` 的当前表是 final snapshot 的展示消费者，不能以“Mandala 中 state 为 active”替代全部资格。该页面和其打印投影共用同一 complete snapshot：快照不可用时当前表为空并提示，而不是回退到更宽的 tracking 集合。

同一页面的 `查看已不追踪 / 归档` 是保留数据的只读路径。它展示不在当前 final snapshot 的既有项目计划行；其中 `已停止追踪` 是确定的 Mandala 生命周期原因，其余显示为“未进入当前有效操作上下文主键集合”，避免将 `9XX`、声明缺失、Workspace 载体消失或上游快照问题误判成同一种业务原因。该路径不自动恢复追踪、不写入历史字段，也不能授权前向计划编辑。

`项目管理：按周汇总` 的默认表是所选周 retained Workspace weekly rows 与当前项目域 final snapshot 的交集。该页有独立的只读归档按钮；归档记录不进入 `workspaceSummaryRows` 或写路径。打印先并行读取目标/项目快照各一次，再由按周汇总和执行计划共同复用，防止同一张纸出现两套资格口径。

## 2026-10-13 管理入口与只读资格的边界

source_status: confirmed_by_code；update_type: refines / splits

[统一主键管理与宿体](unified-context-key-management.md)记录本次项目域管理面板、改名与恢复，以及尚未实现的永久身份服务/独立宿体。上述 Compatibility And Zero-Write Boundary 是历史资格读取切片的边界；它不表示新增管理命令永远只读。资格快照继续只读；用户显式确认后，追踪由Mandala写、声明由PEO写、已有绑定由各V2 owner写。停止/改名不授予资格，恢复仍重新检查全部条件。

资格模型是项目/目标双域；本批集中管理写入口仅项目域。Temporal未新增实时订阅。代码已部署不替代原生验收，用户证据目前仅明确大千P1停止/恢复与能力探测。


2026-10-13 部署补充：policy=`tracking-only-v1`；上述定义对应本次磁盘部署，原生重载验收待完成。周追踪历史回看保留，PEO已停追视图只读且限当前来源图可识别对象。证据：tracking-authority-review/RELEASE-REVIEW.md 与 deployment.json。

## 2026-10-13 地址退役与停追胶囊隐藏（tracking-only-v2）

source_status: confirmed_by_code + confirmed_by_user（方向）；update_type: corrects

用户要求退役「9XX = 归档」语义：编号前缀不再表达生命周期，唯一主动开关是 Mandala 停止/恢复追踪；旧 Kill 仅历史诊断。原盘点 16 个 9XX 声明 owner 已由用户在原 owner 界面明确停追（只读回读确认），未做前缀批量迁移或业务 JSON 改写。PEO/Mandala/NAW 采用互认的 `tracking-only-v2`，混版资格结果 fail closed。

消费者表现：Workspace、Collection、GTD 中所有显式绑定都判定为停追的真实 Tab/标签胶囊在日常界面隐藏，子载体经隐藏祖先上提；混合/本地/未知绑定保持可见。各插件提供「查看已停止追踪」入口与只读历史面板。PEO 停追回看沿用原分组/列卡片/连接只读渲染，点击条目经 `openHistoryNodeV1` 让目标 owner 按需进入会话级历史面板（不是全局广播、不恢复追踪、不写选择/展开）；DOM 实际命中后才算成功。完整 provider 快照与 EVA 索引不随 UI 隐藏过滤。

状态：NEWERA、大千实验库、开发副本、mirror 共 28 份代码文件磁盘部署并回读一致；loaded_state=unknown，native_acceptance=pending。证据：`results/context-key-bus-management-20261012/address-retirement/` 的 FINAL-REVIEW.md、RELEASE-RECHECK.md（PASS）、deployment.json。
