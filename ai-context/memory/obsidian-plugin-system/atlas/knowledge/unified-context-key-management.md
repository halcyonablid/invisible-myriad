# 有效操作上下文主键的统一管理与宿体

status: active
updated: 2026-10-13
source_status: claims marked individually below
update_type: corrects / splits / refines / adds_unknown

## 用户问题与证据边界

`confirmed_by_user`：用户要求实现有效操作上下文主键的统一管理，并追问集中管理是否需要一个宿体、是否需要独立插件；随后要求更新 Atlas 和 Framework。用户已确认大千实验库三个 P1 能力存在且停止/恢复追踪可用。该证据不覆盖新改名操作、NEWERA实机结果或全部下游消费者。

`confirmed_by_code`：当前已部署项目域的单主键管理入口、改名与恢复实现；部署 receipt 和独立复核确认 NEWERA、大千实验库及对应开发/镜像代码字节。`unknown`：新代码在当前 Obsidian 进程是否已重载，以及新改名的真实交互、全链路收敛与性能。测试通过和磁盘部署分别是工程证据，不升级为用户实践证据。

## 三种不同职责

| 概念 | 当前事实 | 边界 |
| --- | --- | --- |
| 主键所指对象 | 项目用完整 Workspace jump 身份；目标用完整 Mandala jump 身份，并保留 owner/source | 当前对象引用不等于跨插件永久 contextId |
| 操作上下文描述符 | PEO 从声明投影 contextKeyId、编号、名称等；已有路径仍含 label 派生 ID | 改名同步通过不证明永久身份 registry 已接入 |
| 管理宿体 | 承载管理界面、查询与正式命令入口的位置 | 可以由现有插件承载，也可提取独立插件；界面宿体不自动成为所有业务数据 owner |

以上身份事实为 `confirmed_by_code`；宿体职责划分是本次 `inferred` 的设计澄清。资格规则的唯一说明仍是 [有效操作上下文主键](effective-operational-context-key.md)，本页不另建资格公式。

## 当前实现：项目域单主键管理

`confirmed_by_code`，范围截至 2026-10-13 已审部署：

| 环节 | 现有 owner / 实现 | 明确范围 |
| --- | --- | --- |
| 管理入口、停止/恢复追踪 | Mandala 的项目执行计划 → 管理主键 | 绑定完整 Workspace nodeKey 与 Mandala 追踪来源；恢复仅改变追踪，仍须重新核验资格 |
| 修改主键名称 / 同步进度 | 入口转调 PEO 拥有的名称管理面板 | 当前 manager 只接受项目域 Workspace subject；目标域尚未接入同样的集中管理写入口 |
| 声明保存与改名协调 | PEO 当前评论声明 writer 与已有 rename journal | 预览后确认，持久 intent → 声明保存并回读 → 原计划的 owner verify/commit/verify；不移动业务数据所有权 |
| 已有绑定同步 | Workspace、GTD、Collection 等各自的 V2 owner | 按冻结来源/载体核验，缺能力阻止确认；已排除、无匹配与已核验分别显示，不由 journal complete 推断全插件均有匹配 |
| 行动台名称与生命周期 | NAW 读取 PEO 声明名称及 Mandala 资格 | 停止追踪时也能更新精确 membership 的 lastKnownLabel；本地名称、行动、inactive 状态保留，恢复后沿用原 membership |
| 资格聚合 | Mandala 原双域最终快照 | Temporal 仍按原入口查询；本批未新增其改名实时订阅 |

新管理面板仅改声明名称、保留原编号及其余评论；旧评论编辑窗口使用冲突检查和持久草稿保护。Workspace 只同步 Tab capsule keyword，不改 Tab 标题、范式关键词或项目条目评论。各 owner 已完成的更新不会因另一个 owner 失败而回滚；重试先核验，只有原计划/声明仍可验证才继续。旧版 pending 也须核验原冻结计划和当前声明后才能接管。

这是现有插件联合承载的管理链路，尚不是全量主键目录。有效资格概念已覆盖项目/目标双域，当前管理写入口的项目域范围不能据此扩成双域。

## 独立宿体与永久身份：建议、原型和待证条件

`inferred`：推荐的最终形态是独立、轻量的主键管理中心，集中目录、查询、命令与恢复进度；现有行内按钮可继续作为进入同一中心的快捷入口。用户要求明确宿体与统一管理，并不等于已批准某个插件 ID、数据 schema、完整迁移方案或实施顺序。

`confirmed_by_code`：P2 已有只读盘点及隔离的 identity-model 原型，包含 contextId、subjects、bindings 和别名，但没有生产持久 writer 或运行库迁移。仓库内已形成独立只读宿体候选包，部署/实机验收边界见下文。

`unknown` / 待实施：

- 永久 contextId 与既有完整 subject、各插件 carrier 的明确映射及同编号/同名冲突处理；编号或标题相同不能证明同一对象。
- 项目/目标统一目录、状态原因与历史入口；目录可显示不可用分域，但不能用部分目录放行双域候选。
- 身份写入权的单一持有者及移交协议：现有计划建议先由 PEO 承载窄持久身份服务，再评估提取；旧 writer 退出后才转移，避免两套 registry 并行写。
- 新增项目/目标、停止/恢复追踪及历史回看的集中命令与部分失败恢复；既有插件局部能力不等于统一中心已具备这些流程。（2026-10-13 更正：Kill/解除 Kill 不再是生命周期命令，旧 Kill 只作历史诊断。）
- 全消费者接入及真实宿主性能、重启恢复、历史可发现性证据。

这些缺口对应 [CKM-U01～03](../unknowns-register.md) 与 [FW-026](../../framework/question-map.md)。具体排期和授权回到 [活动 PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-076)（外部来源未随包提供）；本页不产生新的执行计划，也不将大千统一内核原型视作 NEWERA 的身份服务。

## Evidence / Trace

- prior_read：Framework entry-index/update-protocol/schema/question-map/registry；Atlas schema、两主键知识页、glossary/aliases、contracts、工作流与unknowns。
- 代码证据：[P1 接线](../../../../REFERENCE_BOUNDARIES.md#ref-077)（外部来源未随包提供）、[改名与NAW接线](../../../../REFERENCE_BOUNDARIES.md#ref-078)（外部来源未随包提供）、[PEO管理实现](../../../../REFERENCE_BOUNDARIES.md#ref-079)（外部来源未随包提供）、[隔离身份原型](../../../../REFERENCE_BOUNDARIES.md#ref-080)（外部来源未随包提供）。
- 部署及验收边界：[交付说明](../../../../REFERENCE_BOUNDARIES.md#ref-081)（外部来源未随包提供）、[部署回执](../../../../REFERENCE_BOUNDARIES.md#ref-082)（外部来源未随包提供）、[独立部署核验](../../../../REFERENCE_BOUNDARIES.md#ref-083)（外部来源未随包提供）、[工程记录](../../../../REFERENCE_BOUNDARIES.md#ref-084)（外部来源未随包提供）。
- 原型范围：[P2盘点](../../../../REFERENCE_BOUNDARIES.md#ref-085)（外部来源未随包提供），其“尚未验收”的历史描述以本页明确列出的后续用户证据细化，盘点本身不证明迁移。
- update_type：`corrects` 修正已存在永久registry及改名仍deferred的陈旧表述；`splits` 分开对象身份、描述符和宿体；`refines` 区分项目管理写入口与双域资格；`adds_unknown` 登记永久身份、独立宿体和全量管理剩余证据。
- Framework 仅同步长期问题、入口与维护trace；不改 Skill、规则、运行插件或业务JSON。


## 2026-10-13 0.1只读宿体候选阶段（未部署）

`confirmed_by_code`：新增独立插件 `context-key-manager` 0.1.0（主键管理中心），仓库内三文件安装候选包（目录模块已内联main.js）已生成并核验字节一致，具备独立命令、ribbon和ItemView入口。它只消费Mandala已有双域有效快照，按domain、追踪来源和完整nodeKey区分对象；项目的Mandala追踪来源与Workspace对象来源分开显示。同名不合并，不把现有contextKeyId升级为永久身份。

H1状态为“可安装候选已形成、Obsidian实机加载未验收”。H2仅展示当前有效项目/目标，停止追踪、Kill、归档、历史与全量目录仍缺契约。H3管理命令、原恢复链与生产身份bootstrap未接入；H4 NEWERA/大千部署与原生验收未完成。原Mandala/PEO管理入口继续使用，无业务owner移交或新registry写入。

证据：[宿体README](../../../../REFERENCE_BOUNDARIES.md#ref-086)（外部来源未随包提供）、[包清单与hash](../../../../REFERENCE_BOUNDARIES.md#ref-087)（外部来源未随包提供）、[隔离测试](../../../../REFERENCE_BOUNDARIES.md#ref-088)（外部来源未随包提供）。测试使用候选代码契约与synthetic数据，不能替代当前加载版本或真实双库验收。

update_type: refines；prior“独立宿体未形成”细分为代码候选已形成与生产未部署。CKM-U01～03及FW-026继续开放，执行顺序仍以活动PLAN为准。


## 2026-10-13 0.2项目管理委托候选（未部署）

confirmed_by_code：宿体项目行已通过Mandala公开inspect/open接口打开原项目管理面板；原面板负责停止/恢复与改名转PEO，宿体没有新增业务writer。来源绑定为Mandala追踪scope+Workspace完整nodeKey，管理服务generation不与目录generation混用。超时/视图epoch/API失效防止迟到打开，changed在旧查询结束后fresh刷新。

内存“本次会话管理过的项目”保留最多50个入口，让停止后仍可fresh核验重新进入；这是非持久回访记录，不是历史目录或当前资格。原名称为上次记录，插件重载清空。H3仅项目入口委托候选；目标管理、全量历史/归档、生产永久身份bootstrap和H4仍未完成。未进行双库部署或native验收，FW-026/CKM问题继续开放。

证据：[0.2说明](../../../../REFERENCE_BOUNDARIES.md#ref-089)（外部来源未随包提供）、[包/hash](../../../../REFERENCE_BOUNDARIES.md#ref-090)（外部来源未随包提供）、[委托测试](../../../../REFERENCE_BOUNDARIES.md#ref-091)（外部来源未随包提供）。update_type: refines，上一段0.1仅为历史阶段，不把候选进展升级为生产事实。


## 2026-10-13 H2 当前来源项目追踪目录（0.3 候选）

独立宿体 context-key-manager 0.3 增加项目追踪记录分区；Mandala 新公开 listProjectTrackingDirectoryV1 只读枚举当前来源的持久追踪索引，含 active/stopped。名称为上次记录，不作为身份或资格；停追后重建宿体可再次发现并委托原面板恢复。全历史、归档、Kill、目标管理和生产永久身份仍未完成。

双库分别在各自基线上生成候选，保留大千适配，未写运行库或业务JSON。provider28、directory11、management11、Chrome13通过；Chrome重建宿体是隔离夹具，不代表真实重启验收。独立终审证据：results/context-key-bus-management-20261012/tracking-directory/FINAL-REVIEW.md。0.3尚未部署，H4/native仍开放。


## 2026-10-13 H4 0.3 双库磁盘部署

context-key-manager 0.3 已安装至用户已证明的 NEWERA 和大千实验库；Mandala 已接公开追踪目录。13份代码文件落盘回读一致：4份Mandala main（NEWERA/runtime/dev/mirror；大千独立）及双运行库+mirror各3份新宿体文件。Mandala manifest/styles保持，未修改业务JSON或community-plugins.json，未自动重载/启用。

已形成独立宿体且磁盘已部署；loaded_state=unknown，native_acceptance=pending。用户需分别重载Mandala、启用主键管理中心；若尚未加载前批改名代码，再重载PEO/NAW。验收重点为停止→宿体重载→追踪记录发现→恢复，再验证原改名/同步恢复。完整步骤和只读Console见 results/context-key-bus-management-20261012/tracking-directory/deployment/ACCEPTANCE.md。

事实来源：同目录receipt.json及独立FINAL-REVIEW.md。P2生产身份、目标管理、全历史/归档/Kill仍开放。H4仅关闭磁盘部署，未关闭原生验收。


## 2026-10-13 — 改名日志已有目标文件修复

NEWERA 用户实测 009G 新声明已保存，但 Workspace / GTD / Collection 仍旧名称；随后名称管理报 Destination file already exists。只读核对：正式日志 pending、三消费者 prepared/attempts 0；tmp 中首消费者 committing，故同步在消费者提交前被日志持久化挡住，不能记为原生验收通过。

PEO journal 原 adapter.rename(tmp, path) 不兼容 Obsidian 已存在目的文件。修复为保留原文双核对、tmp/prev 回读，再 write 正式文件并精确回读成功后继续。此方案不是原子替换或 CAS；最后核对至写入仍有并发窗口。半写导致正式文件损坏时必须封闭，重载不会自动修复，也绝不提升 tmp/prev。

17 项定向测试（严格 rename、写入故障、丢回执、恢复去重等）与 46 项双库隔离联合回归通过。独立报告：results/context-key-bus-management-20261012/journal-existing-destination/PRE-REVIEW.md、FINAL-REVIEW.md。四处 journal 代码已备份并同步；未改业务数据或运行现有恢复任务。

下一步：保存输入，重载 Project Execution Overview，打开原 009G 的“修改主键名称 / 同步进度”，重新核验/恢复原已确认同步。验收需三消费者 verified 且原载体显示新名；当前仍 awaiting native acceptance。现有有效正式 pending 记录可恢复，不重新创建改名。P2 持久身份迁移、目标管理及完整历史不因此完成。


## 2026-10-13 当前方向覆盖：追踪权威与 PEO 停追历史投影

用户已明确确认 NEWERA PEO、Workspace、GTD、Collection 改名、关闭重开后内容及绑定保留；记录为该条原生链用户验收通过，不推断大千同样通过或永久ID已投产。

用户进一步明确：停止/恢复追踪是主键管理的主动启停；PEO胶囊随明确停追被动隐藏，开关看停追历史，Kill不再反向否决全系统有效资格。这覆盖先前P3-A新增Kill按钮计划。results/.../p3-lifecycle所有代码候选均未测试完成/未终审/未部署，已标SUPERSEDED，禁止沿旧方向发布。

本次仅评估新方向，不宣称实现。现行Atlas公式和生产代码仍含!Kill；目标规则保留载体、声明、唯一非9XX和目标承载关系检查，把追踪作为唯一主动生命周期开关。PEO不在读取/恢复时自动写killed；缺记录/无效/服务不可用不冒充明确停追。混合组按完整subject分别投影。原历史数据和入口需兼容。

后续优先：只读盘点旧Kill与追踪冲突及直接消费者；设计不反调PEO资格的双域追踪证据契约；接PEO当前/停追历史投影；按已核实迁移决定协调移除Kill资格门禁。旧killed且active对象不能静默重新有效或自动转stopped。已有final调用PEO，PEO显示读取独立原始追踪证据，避免循环。项目目录当前仅来源内持久索引，目标与完整历史仍有缺口。

P3新增项目/目标、创建中途恢复继续开放；P2永久身份仍非生产。评估与独立核查：results/context-key-bus-management-20261012/tracking-authority-review/ASSESSMENT.md、REVIEW.md。Framework/Atlas update check=updated：统一管理知识页追加用户确认的目标方向，与旧生产事实区分；canonical公式不冒充已切换。未改任何运行库或业务JSON。


## 2026-10-13 Tracking authority coordinated release

本批在 NEWERA、大千实验库、开发副本与 mirror 分别按原基线部署 Mandala、PEO 和 NAW 代码；新增原始追踪证据 reader 与 PEO 只读投影模块。磁盘已回读核验；loaded_state=unknown，native_acceptance=pending，需用户保存输入后重启 Obsidian 或重载上述三个插件。未写业务 JSON、历史周记录、评论或绑定。

停止/恢复追踪是唯一主动生命周期开关；当前资格仍要求原载体、完整唯一声明（地址退役后 9XX 不再归档，见下节），以及目标的 GTD/EVA 承载证据。旧 Kill 只保留历史诊断，setter停用；PEO 默认隐藏明确停追对象，提供只读“查看已停止追踪”。未知状态保留正常对象并提示不可核验，不能冒充停追；历史仅覆盖当前来源图中可识别的已停追胶囊，不是完整历史目录。周追踪现有归档、按周回看、原内容和日期规则保留。恢复管理沿用原完整nodeKey，不新建或改绑对象。

009J由用户在原owner界面停止追踪后，独立原始读取确认NEWERA历史Kill25项全部stopped，大千0项；没有自动按Kill批量迁移。双向policy guard拒绝混版资格结果；NAW已同步适配已停追对象改名读取，只更新名称。先前P3 Kill按钮候选保持SUPERSEDED。

验证：raw reader33、投影16、生产方法集成48、NAW20项；12份既有目标资格/周汇总回归；双库真实只读probe；候选语法检查。验证为隔离生产方法与mock DOM，不是原生Obsidian UI端到端。独立终审与发布回执见 results/context-key-bus-management-20261012/tracking-authority-review/RELEASE-REVIEW.md、deployment.json；业务零写入与历史helper原样检查纳入回归。

后续：用户原生验收停止→PEO隐藏→历史回看→恢复→重开、周追踪旧周回看；大千单独验收。P3新增项目/目标与创建中途恢复、目标集中管理入口和P2永久身份生产迁移仍未完成。

## 2026-10-13 地址退役 + 停追胶囊隐藏 + owner 按需历史（磁盘部署）

`tracking-only-v2` 已在 NEWERA/大千/dev/mirror 磁盘部署（28 文件，独立复核 PASS）。设计回答“PEO 回看时其他插件要不要同时进入回看”：不全局广播；PEO 回看点击条目时，目标 owner（Workspace/Collection/GTD）按需打开会话级只读历史面板，校验 source/条目归属并以 DOM 命中确认，返回/换 source/关闭/卸载即清除。规则细节见 [有效资格](effective-operational-context-key.md) 同日节。native 验收待用户重载后完成；P3 新增/创建恢复、目标集中管理、P2 永久身份仍未完成。

## 2026-10-13 Workspace 原生只读历史回看（N1，磁盘部署）

source_status: confirmed_by_code；native 待验收。PEO 回看或停追关键词进入 Workspace 时，同一视图以原生渲染器显示停追 Tab 子树（只读提示条、目标高亮），会话只在内存；交互围栏 + 弹窗前拒绝保证不写不丢稿；外部写入/桥接/定位入口先退出回看再执行；持久化与共享状态只读持久 Tab。Collection、GTD 仍为通用历史面板（N2/N3 待做）。证据：results/context-key-bus-management-20261012/native-history-workspace/。

## 2026-10-13 Collection 原生只读历史回看（N2，磁盘部署）

source_status: confirmed_by_code；native 待验收。Collection 与 Workspace 同模式，但因写入始终复制真实 activeTabId，外部写入（建项目 Tab、改名/同步、行动创建）在回看中照常执行且不退出回看；仅定位/桥接恢复先退出。GTD 仍为通用历史面板（N3）。证据：results/context-key-bus-management-20261012/native-history-collection/。

## 2026-10-13 GTD 原生只读回看（N3，磁盘部署）

source_status: confirmed_by_code；native 待验收。PEO 停追回看点 GTD 条目与 GTD 内停追标签均进入 GTD 原生普通视图的只读会话（内存全局快照、退出恢复）；外部 API 写入（Mandala 建标签、PEO 改名/同步）按深度放行且不退出回看；跳转在数据文件未变时复用活引擎（按文件 mtime:size 判定），否则完整重载。至此 Workspace、Collection、GTD 的停追历史回看均为原生界面。证据：results/context-key-bus-management-20261012/native-history-gtd/。


## 2026-10-14 历史回看用户确认；P3 创建恢复候选

source_status: confirmed_by_user（历史回看/跨插件跳转）；staging_verified（下述局部创建候选，未部署）。用户表示“看历史的内容，然后跳转过去，各个插件的，都已经做好了”；提高对应行为的信心，不推断具体运行库、全部只读围栏或边缘测试已通过。

P3 按用户要求继续。仓库候选已实现持久创建意图与逐步回读，以及 Workspace 项目主对象/Tab/关键词、Collection Tab/关键词的原 ID 提交。两个 owner 的旧保存路径会拒绝丢失既有创建 receipt 的陈旧快照；受管写使用 owner 队列与原子回调核验，并保留历史会话。159 项隔离测试通过，未向运行库发布；这不是 P3 完整闭环或永久身份 P2。

后续仍需 GTD、Mandala 追踪/固定周次与目标父槽位、PEO/EVA、管理入口/草稿保护/显式继续和双域最终资格。audit/UI 完成状态必须与业务核验分开；初始缺失 sidecar 在未知提交后仍缺失须停止核验而非猜测重建。

trace: [本批工程记录](../../../../REFERENCE_BOUNDARIES.md#ref-092)（外部来源未随包提供）；results/context-key-bus-management-20261012/p3-creation/OWNER-INDEPENDENT-REVIEW.md。Bayesian update: 历史跳转增加用户实践证据；局部失败恢复增加隔离代码证据，不提升为生产事实。


## 2026-10-14 P3 双域管理与创建恢复：部署前完成

source_status: staging_verified；runtime_deployment: not_done_this_batch；native_acceptance: not_run_for_this_batch。此节覆盖前述局部owner候选的待办状态，不覆盖已部署历史功能及既有用户验收事实，也不宣称P2永久身份服务已投产。

独立宿体 context-key-manager 提供项目/目标管理、新增与未完成创建入口；宿体不写业务内容，委托 PEO 的改名/创建事务协调，再由 Mandala、Workspace、GTD、Collection、EVA 原owner提交。目标管理、停止/恢复与持久目录已接通；目标改名使用固定身份与原声明/载体，不退回评论区手改。

创建先持久确认意图，固定来源、周、目标父节点/格位、主对象及载体ID、GTD笔记和EVA关系。逐步inspect/commit/readback，重开列表不自动恢复；显式继续只补可证明未完成的步骤。最终需要本域真实有效资格；目标还须精确EVA→GTD承载。丢回执时只核对原对象；损坏、已核验后漂移、尝试后笔记缺失等不明情况暂停，不猜测重建。纯刷新/审计失败提示与业务状态分离，同目标草稿冲突保留并暂停。

保留tracking-only-v2：追踪为唯一主动生命周期，历史回看和跨插件按需历史跳转保留，Kill/9XX不成为有效性开关。部署前证据：完整创建24、双域真实资格各3、合包目标改名15、真实弹窗8、独立writer/共存测试；133文件包/52原基线路径核验。隔离adapter与headless测试不等于原生Obsidian验收。

Trace：[工程记录](../../../../REFERENCE_BOUNDARIES.md#ref-093)（外部来源未随包提供）；results/context-key-bus-management-20261012/p3-creation/DELIVERY.md、P3-COMPLETION-FINAL-REVIEW.md。Bayesian update: refines，从局部owner候选推进到整合staging证据；部署/原生仍未知。


## 2026-10-14 P3 已部署，待重载及原生验收

用户明确批准后，独立部署脚本预审 PASS；冻结四基线包已发布到 NEWERA、大千实验库、对应开发副本与 mirror。133 个代码/依赖/manifest/style 文件逐一回读一致，其中实际更新 69 个。部署仅涉及七插件代码清单，不写业务 JSON、笔记、追踪记录或 EVA 关系。字节备份和逐文件前后哈希见 deployment-receipt.json 指向的 state/backups/p3-deployment 目录。

source_status: disk_deployed_verified；loaded_state: unknown_reload_required；本批新增/目标改名 native_acceptance: pending。既有用户确认的改名、历史回看/跳转验收范围保持，不外推到本批新功能。下一步保存输入并重启 Obsidian，在两个库分别验收管理中心新增项目、新增九宫格目标、未完成创建的显式继续及目标改名。P4未开始，P2永久身份生产接入仍单列。

部署证据：results/context-key-bus-management-20261012/p3-creation/DEPLOYMENT.md 和 deployment-receipt.json。此记录更新当前状态，前文“未部署”保留为当时历史证据。


## 2026-10-14 双追踪目录报错修复已部署

NEWERA 用户实测有效目标30项，但项目/目标追踪目录均报 IDENTITY_STORAGE_AMBIGUOUS。只读确认历史目标状态表有Workspace地址，项目表有非Workspace地址及alias冲突。修复只读目录逐行验证并隔离异常/关联冲突；完整schema、limit、读取漂移仍拒绝，管理写入严格校验保持。宿体仅对追踪目录接受明确partial合同，显示可核验项及隔离数量/原因，不能将部分目录升级为完整有效集合。

82检查与独立攻击探针通过；真实NEWERA文件只内存投影77项目/60目标可核验状态，业务文件字节未变。12代码文件已部署到NEWERA、大千实验、各自dev/mirror并回读一致，原字节备份见deployment.json。source_status=disk_deployed_verified，loaded_state=unknown_reload_required，native_acceptance=pending。本次不新增业务日志、不迁移或删除旧记录，不包含性能优化。受污染存储上的管理写入仍可能严格暂停，目录修复不代表P3全验收。

Trace：results/context-key-bus-management-20261012/tracking-directory-repair/DELIVERY.md、manifest.json、deployment.json、FINAL-REVIEW.md；engineering record：memory/obsidian-plugin-system/change-records/2026/2026-10/20261014-tracking-directory-repair.md。


## 2026-10-14 当前后续主线：中心数据权威移交，再接全消费者

confirmed_by_user：用户明确确认管理中心应成为主键核心数据宿体，并要求更新后续事项。目标为中心唯一持有永久contextId、正式名称/编号、subject/binding映射和subject级当前追踪状态，向消费者提供统一API；业务正文、载体、周记录与成果由原owner保留。confirmed_by_code：当前中心仍查询Mandala并委托PEO/原owner，P2生产authority未切换；本次仅计划更新。

移交逐字段/命令关闭旧writer或转调，不双写两份权威。当前运行权威持续到各切换点；有效资格仍由追踪状态与各owner新鲜证据决定，中心代理完整资格快照不能把partial目录当准入。停止后对象、绑定与历史保留；Kill/9XX继续不作为生命周期入口。必要去重/恢复信息保留，存储形式及增长先评审，不新增全量重复行为日志。

当前未知：旧身份基数/跨域异常及精确映射、路径变更、既有pending兼容、中心存储/单writer/追踪迁移、全部消费者接线与两库原生验收。NEWERA截图25项目/30目标、77/60部分追踪记录只提升目录显示证据，不提升管理写入或大千验收。P4盘点/Temporal问题保留，执行顺序回state/PLAN.md。

Update: refines；核心宿体为user_confirmed_target，implementation=planned_not_implemented。Trace：[本次工程记录](../../../../REFERENCE_BOUNDARIES.md#ref-094)（外部来源未随包提供）、state/PLAN.md最新节；FW-026、CKM-U01～03仍开放。


## 2026-10-15～10-20 中心权威分阶段落地（P2-B → C1/C2 → C3 窄切片）

source_status: confirmed_by_code（各批部署回执）+ confirmed_by_user（下列原生验收）。本节**覆盖** 10-14 节中“planned_not_implemented”的状态；更早各节保留为当时的历史证据。

| 阶段 | 落地内容 | 状态 |
|---|---|---|
| P2-B（10-15） | 独立中心存储 identity-v3：永久 contextId、subjects、bindings；双槽加 WAL，presence | 已部署 |
| C1+C2（10-17） | 中心命名权威（v4）：接管 → 改名预览 → 确认 → 继续同步；六个参与插件的写入器在写前向中心核验；旧改名入口拒绝或重定向；管理中心界面 | 已部署；10-19 原生验收：005A 改名、036G001 接管加两次改名 |
| C2 原生修复（10-19） | PEO 旧改名与目标改名的重定向；Mandala 孤儿关键词收窄；GTD 改名后从提交文件刷新（naming-settled-v1）；管理追踪的歧义放宽 | 已部署，用户验收通过 |
| C3 窄切片（10-20） | 显式升级 v4→v6（binding format 1）；Collection 单来源首次替换（BindingService，六方协商） | 已部署。用户亲手完成升级，012F 替换验收通过；关闭后重开的核对待做 |

**当前权威边界**：身份和名称已由中心做主（仅限已接管的对象）；绑定只接了 Collection 首次替换；创建（P2-E）、追踪（P2-D）和 P4 仍沿用原 owner；内容数据永远不进中心。权威划分与接口见 [plugins/context-key-manager.md](../plugins/context-key-manager.md)。

**用户实践语义（confirmed_by_user，2026-10-20）**：
- 用户发现替换后原 Tab 的条目没有跟过来，原 Tab 仍保留旧名。这说明替换只改映射，C3 的原则是“保留原内容及历史”。
- 用户认为只换 Tab 本身用途有限。实际价值在于新增、修复后重新绑定、解除，以及“带内容迁移的替换”。最后一项超出 C3 原范围，需另行立项。
- 下一批 Y1 已定为 Collection 完整操作集（format 2）。

update_type：supersedes（10-14 节中“未实施”的状态）；refines（权威按层划分）；adds_unknown（内容迁移需求）。工程事实见 change-records：
- 20261019-200000-peo-legacy-rename-redirect
- 20261019-210000-peo-goal-rename-redirect
- 20261019-220000-mandala-goal-keyword-orphan
- 20261019-230000-c2-native-batch2
- 20261020-071000-c3-narrow-slice-deploy
