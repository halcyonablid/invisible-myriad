# 大千统一内核：现状、已审设计与分批移交

> **废案（2026-10-26，confirmed_by_user）**：大千"统一内核/把所有数据汇集到一起"路线已放弃，后续不再使用。用户判断其扩展性、实施难度与后续更新成本均不如当前有效操作上下文主键 BUS 路线（实验库 r27–r36，已于 D1 迁移至日常库）。本页仅作历史溯源，不再作为当前入口或排期依据。备份与说明：[change-records/2026/2026-10/20261026-daqian-route-abandoned.md](../../change-records/2026/2026-10/20261026-daqian-route-abandoned.md)。


status: abandoned (2026-10-26, superseded by context-key BUS r36 route)
updated: 2026-10-11
project: daqian-unified-core-20261006
update_type: refines / reinforces / adds_unknown

这页是长期认知入口，区分原系统、仓库候选与实际移交。截至2026-10-11原行动结构UI批次，多个原视图已获限定仓库接线证据；完整同候选核心闭环、真实Obsidian验收与新统一内核部署仍未完成。下方C17及更早段落是历史证据，不是当前排期。

当前执行顺序只读取活动项目的 [PLAN](../../../../REFERENCE_BOUNDARIES.md#ref-095)（外部来源未随包提供） 当前有效部分与 [MATERIAL_AUDIT](../../../../REFERENCE_BOUNDARIES.md#ref-096)（外部来源未随包提供）；先核对 [活动项目指针](../../../../REFERENCE_BOUNDARIES.md#ref-097)（外部来源未随包提供）。本页不维护第二份待办或自动next-action。

## 2026-10-11 证据边界与功能等价优化

observation: 用户要求“原来的功能，改变实现方式提升性能”，并要求回到整体计划后更新Atlas和Framework。
layer: 内容态owner / 派生视图与环境态 / 保存恢复协议。
owner: 已迁业务字段的native reducer；provider: native typed services及受域约束的原Workspace表格provider；consumer: Workspace、PEO、GTD、Collection、NAW原视图（各自只按已有证据范围）。
affects_question: FW-024、FW-025；DQ-U01、DQ-U02、DQ-U03。
update_type: corrects / refines / splits。

### 原功能与实现方式分开看

source_status: confirmed_by_user（原界面/使用需求保留、内核逐域扩充、核心闭环后部署、周追踪/日课/元表格常用）；inferred（按此推导的等价优化判据）。

功能等价不仅是同样的按钮和结果，还包含固定身份、排序/关联、资格、草稿、幂等、冲突、未知结果及关闭重开语义。独立插件时代各自读取/计算/刷新可有隔离理由；统一内核后可研究共享已验证读取、临时索引及精确刷新，不能因此把消费者变成第二写者。NAW与GTD身份不自动合并，Workspace内嵌表格与ontology元表格中枢不能互相代表。

用户采用先核心闭环再部署、随后反馈生长的路线，不要求首次部署前复刻全部长尾；具体发布边界和先后只在活动PLAN维护。State Capsules、JSON资产登记、审计留痕三个旧插件明确排除于本项目，不能从旧表格重新纳入；内核自身回执/恢复记录仍保留。

### 已有证据不等于全链验收

source_status: confirmed_by_memory（下列冻结报告和独立终审）。

- [原Collection来源返回](../../../../REFERENCE_BOUNDARIES.md#ref-098)（外部来源未随包提供）：固定来源路由与原NAW→原Collection返回；不是所有旧卡关联已迁完。
- [ontology正式服务](../../../../REFERENCE_BOUNDARIES.md#ref-099)（外部来源未随包提供） 与 [原表格UI接线](../../../../REFERENCE_BOUNDARIES.md#ref-100)（外部来源未随包提供）：正式owner仍为workbench.ontologies；原NAW按钮、Workspace Modal、列说明、压缩保存、草稿和关闭恢复接typed服务。UI批次189安全测试（含13新增）和8原浏览器检查，canonical新增13烟测另证相同源码；[最终独立核查](../../../../REFERENCE_BOUNDARIES.md#ref-101)（外部来源未随包提供）通过。浏览器不是actual root/Obsidian，root生命周期另由Node证明，不能相加称同候选整链。原冲突按钮未由这8项单列验收；附件/外部引用仍受限并保留输入。
- [路径解析](../../../../REFERENCE_BOUNDARIES.md#ref-102)（外部来源未随包提供） 与 [正常读取分层](../../../../REFERENCE_BOUNDARIES.md#ref-103)（外部来源未随包提供）：减少重复解析/语义重放，保留路径、资格和已确认字节检查。阶段秒数为单次隔离采样，不是最新实际响应结论。
- [增量日志](../../../../REFERENCE_BOUNDARIES.md#ref-104)（外部来源未随包提供）：新初始化v2命令增量、每32条完整快照；v1不自动迁移。两个配对样本日志字节减少92.86%和87.76%，历史回执/草稿保留；冷恢复仍全语义重放，热读仍核验完整字节，10000文件上限未改变。字节缩减不证明启动或UI响应同比缩短。

### 待验证的减负方向（不是第二份实施计划）

| 方向 | 证据状态与边界 | 等价性应检验什么 |
| --- | --- | --- |
| 精确只读分类 | confirmed_by_code：截至本次证据，ontology通道不在宿主只读路由表，read/status也安排全域刷新。合成调度计数只证明放大，不是UI测速 | 分类与实际执行必须使用同一份冻结请求，不能把重试当只读；排队期间改method/value仍拒绝 |
| 草稿消费者与按依赖刷新 | inferred：现有全域刷新可研究细分，尚未实现 | 先登记所有真正依赖者；unknown、刷新失败及代际失效保守处理，不能漏更或用全局revision替代全部环境证据 |
| 行动台本次投影临时索引 | confirmed_by_code：当前每项目重复filter links/origins及扫描Collection items；收益inferred | 原排序、去重、完整性/truncated、来源缺失历史、unknown字段和ontology原记录相同；不是宣称整个算法已线性化 |
| 共用操作内快照、减少全量复制 | inferred；部分主界面单次快照已有历史证据，跨域进一步共享未验 | 保持point-in-time一致和原UI可变对象隔离；异步/写入/代际边界重核，不跨调用滥用缓存 |
| 合并重复query/load、快照快速恢复 | unknown：需证明授权、租约、幂等、旧回执/草稿和恢复信任；不能直接读取最后快照跳过历史 | 同数据量/操作/结果配对测量，分别记录可见响应与持久确认、读字节/次数、投影CPU、尾部延迟及重复操作增长 |

代码定位：[宿主刷新分类](../../../../REFERENCE_BOUNDARIES.md#ref-105)（外部来源未随包提供）、[行动台投影](../../../../REFERENCE_BOUNDARIES.md#ref-106)（外部来源未随包提供）、[store查询与提交](../../../../REFERENCE_BOUNDARIES.md#ref-107)（外部来源未随包提供）。源码可变，字节哈希见本次 [更新清单](../../../../REFERENCE_BOUNDARIES.md#ref-108)（外部来源未随包提供）。上述提速方向尚未作为本次程序修改，不承诺倍率。

### Trace

prior_read: framework entry-index/update-protocol/question-map/registry；Atlas README/schema/index/log/unknowns及本页；活动PLAN/MATERIAL_AUDIT。
claim_change: corrects 陈旧C17当前摘要；refines 原UI接线的证据边界；splits 日志体积、语义重放、界面调度与用户可见延迟。
question_map_effect: FW-024/FW-025保持active；DQ-U01..03保持active_unknown，补来源与判据。
rules_skills: no_model_change；现有Skill整体对账/原输入保护已覆盖，本次不修改规则或Skill。
runtime_and_memory: 新内核未部署；本次实际库/NEWERA IO0，未打开历史journal，未mine。

以下用户原则继续有效；之后的原系统快照、P4分批路线及日期章节是保留的历史证据，历史“下一步”不得用于选择新子批。

## 用户确认的原则

source_status: confirmed_by_user

- 一套权威业务数据通过原有各个视图展示和操作；保留原设计中已包含的使用需求，不借内核接入重做界面。
- 固定ID负责识别对象；编号/名称可修改、允许存量重复编号，不按同编号/同名自动合并。
- 主键是独立字段；普通备注/历史声明全文保留，不能继续把普通评论作为已迁字段的另一份可写主数据。
- 数据内核按域扩充。服务适配、域业务移交、原视图接入、统一插件装包各自验收；NAW不是GTD，完整Workspace结构编辑器不是Workspace全部业务。
- 本项目NEWERA不访问、不修改；允许的后续实验目标为用户指认“大千-协作实验版-20261005”，具体外部包仍走已审文件/目标及对应确认。历史Atlas记载的NEWERA runtime不是本项目自动授权。

证据：项目 [INPUT_PROFILE](../../../../REFERENCE_BOUNDARIES.md#ref-109)（外部来源未随包提供） 的用户边界及 [P4-A ownership](../../../../REFERENCE_BOUNDARIES.md#ref-110)（外部来源未随包提供）。活动state可变；冻结P4-A方案/终审另作为设计来源，下文导航不依赖聊天。

## 原系统及已核验范围

source_status: confirmed_by_code（仅明确源快照）；confirmed_by_memory（已审报告）

六主要原owner仍各有保存链。Collection main内嵌create的vault.process、NAW整plugin-data保存、Workspace prepared/forced-teardown fallback、PEO整settings及rename journal别名IO、Mandala fs/link/卸载保存、GTD动态engine读自愈都在 [source-review](../../../../REFERENCE_BOUNDARIES.md#ref-111)（外部来源未随包提供） 有行级证据。67顶层代码快照来自17相关插件；静态disk snapshot不证明actual loaded build、pending queue或唯一writer。11份原程序基线byte匹配；有界literal扫描不穷尽任意动态/外部writer。

原Collection→原NAW→原完整Workspace结构编辑器在单个schema5仓库authority完成限定验证，既有Node61/61、Chrome28/28来自 [冻结终审](../../../../REFERENCE_BOUNDARIES.md#ref-112)（外部来源未随包提供）。Chrome realObsidian=false；此候选未部署/未迁移。Workspace主视图、原PEO/GTD流程、正文/附件/原生Mermaid和完整消费者仍待接入。观察插件用户确认固定ID/刷新重开，只证明观察范围。

## 已审设计与未来owner

source_status: confirmed_by_memory（P4-A设计审批）；inferred（尚未实现/验收的目标行为）

首批U01取实验自身冻结证据：Collection完整所选容器5Tab/4Card/3keyword assignments，加NAW已有1membership/sourceCard/link/ontology槽位；未发现关联的三卡不造link。U02以同membership完整primaryRef及Workspace原item证据建立项目身份/声明与创建资格服务，不把其余Workspace/Mandala/GTD主数据全部迁入。

移交后core唯一拥有已迁字段；未迁域保持原owner。完整保存单位、普通评论/未知扩展/历史/草稿/绑定引用lossless保留，环境恢复不写业务。地址、label-hash、route和观察ID是不同证据，生产identity必须完整source binding/根registry持久登记，不能复用别的实验store UID。

保存候选为native-v1 exact-seq immutable journal＋独立host witness/根注册表；按actual vault根＋unit查唯一authority，不让丢manifest或新随机ID绕过旧head。record→witness→publish确认，未知结果查原回执不重放。资格/lifecycle/generation/权限/epoch全部无效化在同仲裁保护至确认点；原owner尚未兑现能力时拒绝前向操作并保留输入。多host并发、突然断电、恶意外部文件改写不冒充已支持。

完整设计来源：[P4-A入口](../../../../REFERENCE_BOUNDARIES.md#ref-113)（外部来源未随包提供）、[OWNERSHIP](../../../../REFERENCE_BOUNDARIES.md#ref-114)（外部来源未随包提供）、[CONTRACTS](../../../../REFERENCE_BOUNDARIES.md#ref-115)（外部来源未随包提供）、[STORAGE](../../../../REFERENCE_BOUNDARIES.md#ref-116)（外部来源未随包提供）、[v2终审](../../../../REFERENCE_BOUNDARIES.md#ref-117)（外部来源未随包提供） PASS/必修0、SHA256 28f2e51f83da0337cfb320a06769e8694b61fb3367e13d9b2b16d08da8bec8ae。设计核查不等于程序已实现。

## 历史分批路线与当时验证缺口（不作当前排期）

| 批次 | 作用 | 当前证据边界 |
| --- | --- | --- |
| P4-A | 字段/owner、已见writer/consumer、生产身份、可信保存恢复方案 | 设计独立PASS；实际围栏/存储未由此实现 |
| P4-B1 | 仓库基础保存、根登记/身份、writer fence与故障测试 | repository_verified；单U01、realObsidian=false，独立62+37通过；原owner尚未移交 |
| P4-B2 | 各原owner真实保存链、创建幂等/资格grant/加载排空 | 前三批readonly入口、创建/held服务及原三入口native投影已仓库验证；全旧writer排空、原主流程接线及实际移交待完成 |
| P4-C/D | 原Workspace/PEO主视图、真实GTD及完整项目流程 | 未完成，仍属P4，不推迟验收至P5 |
| P4-E | 已审具体实验包、迁移与增量回退、实际loaded/native验收 | 未开始，通过才说该批实验数据已统一 |
| P5/P6 | 完整追踪/目标/时间等逐域移交；最后一个模块化插件包 | 未来路线，不提前归并各原owner |

现有项目/目标有效资格规则仍以 [Effective Operational Context Key](effective-operational-context-key.md) 为canonical来源；新字段方案不放松Workspace载体、唯一声明、非Kill/未停止追踪和目标域明确承载门禁。性能以 [工作流观测](../workflows/operational-context-to-next-action.md) 及Skill为准，未宣称原生提速。

长期问题：FW-025；相关既有FW-010名称传播恢复、FW-019有效集合、FW-024性能。新增DQ-U01/U02/U03在 [unknowns](../unknowns-register.md) 逐项追踪；不覆盖其旧维护分支的历史部署事实。

## 本次长期落地 Trace

prior: framework entry-index/update-protocol/registry/question-map；Atlas schema/index/00-system-map/contracts/unknowns/glossary/aliases。
observation: 用户明确询问Atlas/Framework是否已更新，并授权继续补录及开发。
claim_change: 已确认原则与审批里程碑现在登记，未来owner/storage目标仍标设计及unknown；补原来只有state/results的长期入口。
targets: 本页、Atlas导航/日志/概览/契约/unknowns，Framework入口/registry/FW-025/maintenance trace。
rules_skills: 本次不改；已有独立核查/备份/工程账及runtime门禁照用。
code_evidence: 仅冻结源码与仓库候选证据，无当前runtime读写。
MemPalace: 未mine；登记Atlas不等于向量可召回。


## 2026-10-07 P4-B1 仓库实现证据

source_status: confirmed_by_code（只限repository-foundation）；implementation_status: repository_verified；deployment_status: not_deployed；native_host_acceptance: not_started。

十五新增候选文件与一个测试脚手架已冻结：[source-manifest-v9](../../../../REFERENCE_BOUNDARIES.md#ref-118)（外部来源未随包提供）；[独立实现终审v2](../../../../REFERENCE_BOUNDARIES.md#ref-119)（外部来源未随包提供） PASS/必修0，SHA256 247895e350b9670b8c6e79633bc6ab9915adfd1c48bf5962999658e713a5c076。标准完整Node62/62与独立新边界37/37，fail/cancel/skip0；旧初审3必修、Windows复制步骤failfast和其失败证据均保留。

确证能力为固定合成session中单U01：sealed根anchor先于reservation，每次load/commit校验；immutable exact-seq journal与独立witness、语义replay和原request回执；确认损坏拒绝伪confirmed，unknown suffix冻结新写。随机identity完整binding/永久reserved；七源历史、评论/未知字段/正文引用与草稿保留。普通叶编辑只限Collection title/comment/emoji，NAW本地名/alias/completion、ontology base/hash/同步synthetic校验走专用服务；固定ID与可变编号分开。

raw fence为私有同session能力、双端真实组件边界与根祖先保护，拒点前缀绕过、外session、BASE顶层、硬链接/junction；scalar own/plain ID阻断继承项/数组强转，拒绝不改global prototype/历史/草稿/磁盘。共同held仲裁和store lease只属于受测合成service，不是actual legacy wrappers/provider分布式grants，也不是任意Node代码的OS沙箱。

仍未支持多unit/adopt、真实旧owner幂等/加载排空/实时资格、原Workspace/PEO/GTD完整流程、正文附件/编辑隐式关闭、actual Electron/多窗口/断电。实际业务迁移和具体实验包未开始；本轮两真实库访问0。FW-025与DQ-U01/02/03继续active，不据此关闭原生未知项。下一步B2具体owner接管；C/D/E依次验收，原UI功能必须补齐保留。


## 2026-10-07 P4-B2 第一批：原源码只读入口保护

source_status: confirmed_by_code（限定仓库合成宿主）；deployment_status: not_deployed；native_host_acceptance: not_started；B2整体in_progress。

九个新增候选文件由 [source-manifest-v2](../../../../REFERENCE_BOUNDARIES.md#ref-120)（外部来源未随包提供） 冻结；[独立实现终审v2](../../../../REFERENCE_BOUNDARIES.md#ref-121)（外部来源未随包提供） PASS/必修0。六个原main固定hash编译；[20个来源探针](../../../../REFERENCE_BOUNDARIES.md#ref-122)（外部来源未随包提供）分为14原方法、1受控timer、5深分支片段；17组Node测试通过。Collection/NAW/Workspace原onload在最小宿主跑通，PEO/Mandala/GTD有UI替身缺口，不计原生UI通过。原source/CSS/命令字节不改。

readonly façade覆盖原保存入口、动态helper/engine读码白名单和代际/关闭拒绝。GTD旧函数吞写错误返回[]仍被外层判失败。Mandala首temp被拒不等于后续发布/回滚执行；片段单独记录完整源/行/片段hash/注入依赖，rollback-link只重放调用点和明确合成依赖。未知promise和原UI草稿未闭合，trackingComplete/drained/readyForHandoff恒false；没有activation/reload接口。

独立初审2项粘性源码失败/稳定owner身份缺口已修复：终审17组通过；另41个吞错路径反例、4身份修改及5fake-host反例均拒绝，4原保存入口独立新实例核查通过。没有据此认证真实文件写入、物理链接/TOCTOU、原UI排空或原生提速。

仍须完成可靠创建回执、提交期间held资格仲裁和U01正式读写投影，然后C/D原Workspace/PEO/GTD完整主流程与E具体实验包/迁移/native验收。原owner未移交、NEWERA与实验库本轮IO0。FW-025及DQ-U01/02/03继续active，MemPalace未mine。


## 2026-10-07 P4-B2 第二批：可靠创建与持有式资格服务

source_status: confirmed_by_code（仓库候选）；deployment_status: not_deployed；realObsidian: false；B2/P4: in_progress。

P4-B2第二批可靠创建与持有式资格服务仓库候选已独立PASS、必修0；26项回归通过。六个独立owner存储共用提交队列，创建按固定身份及回执恢复，资格持有至Action确认。原Workspace/PEO/GTD主流程尚未接线，U01正式投影和完整输入排空待完成；B2/P4仍进行中，未部署、未迁移，两实际库本轮IO0，原视图不变。

先持久化创建plan/完整intent/固定ID，各owner业务与回执同journal确认；phase落后查原回执，重复编号或名称不合并。共同broker持有资格直到Action witness确认，受控失效排队，disconnect立即冻结。确认可查询不等于可续写；残留lease、unknown、崩溃broker不自动清锁。只有正常close后可重开写；健康锁中的已确认Action可显式对账，未确认grant保留输入并阻塞。

六owner为新协议存储，不是原插件已移交；单U01存储槽位不等于U02业务迁移。GTD tag/keyword/Markdown、完整追踪、U01正式投影及原主流程仍未接线。FW-025与DQ-U01/02/03继续active。MemPalace仅fallback查询未mine；不新增研究卡。

证据：[实现终审](../../../../REFERENCE_BOUNDARIES.md#ref-123)（外部来源未随包提供）、[源码清单](../../../../REFERENCE_BOUNDARIES.md#ref-124)（外部来源未随包提供）、[26项测试](../../../../REFERENCE_BOUNDARIES.md#ref-125)（外部来源未随包提供）。独立7项核查通过（含19固定输入hash核对、4种错误目录及F1修复）。

下一步：继续B2：U01正式读写投影与完整输入/任务排空适配；再接C原Workspace/PEO和D原GTD主流程。先核对冻结源并形成可核查适配草案，保留原视图/身份/备注/历史。当前服务仅仓库候选，不自动安装或迁移；NEWERA不访问不修改。


## 2026-10-07 P4-B2第三批：原三入口native持久投影

source_status: confirmed_by_code（仓库候选）；realObsidian: false；deployment_status: not_deployed。

P4-B2第三批原Collection/NAW/Workspace完整结构编辑器已接仓库native持久投影，31项测试（17原流程+14新边界）通过，独立实现PASS/必修0。注册入口有受保护关闭及恢复日志；原UI/adapter/44依赖字节不变。Workspace主视图/PEO/GTD尚未接线，全旧writer排空与实际移交待完成；B2/P4进行中、未部署/迁移，两实际库IO0。

完整七源通过原schema5 reducer构建新genesis；读写经NativeStore根登记、journal/witness和原请求回执。受保护关闭延迟owner退休，保存原完整编辑器最后草稿；失败输入另存recoveryLog不冒充正式成功。恢复记录已确认但残留lease报告durable但frozen并附回执；unknown不能再持久化时明确memory_only拒关闭。没有自动清锁/强制重开。

仅注册三入口的仓库持久适配；Workspace完整结构编辑器不等于主视图，NAW不是GTD。U02 SetContextFields仍拒绝，缓存label不授予资格；trackingComplete/readyForHandoff=false。真实DOM/宿主卸载、性能收益、生产迁移未验。FW-025/DQ-U01/02/03保持active；MemPalace fallback查询未mine，0研究卡/CARD不改。

证据：[最终核查](../../../../REFERENCE_BOUNDARIES.md#ref-126)（外部来源未随包提供）、[31项测试](../../../../REFERENCE_BOUNDARIES.md#ref-127)（外部来源未随包提供）、[7源清单](../../../../REFERENCE_BOUNDARIES.md#ref-128)（外部来源未随包提供）。

下一步：推进C：按原Workspace/PEO调用链形成U02完整身份与独立声明字段适配，接可靠创建/资格服务并补对应旧writer及输入排空；随后D接GTD完整project/tag/keyword/Markdown流程。原视图保留，U01三入口仓库投影已实现，不自动安装或迁移；NEWERA不访问不修改。


## P4-C1：已有项目原方法适配（仓库限定）

source_status: confirmed_by_code / confirmed_by_memory
update_type: refines / reinforces

P4-C1已有项目适配候选完成：原Workspace项目列表读取、原PEO备注及停用/恢复方法已在仓库适配层验证；独立声明字段和导航按完整来源身份读取。17项测试通过，F1无变化请求回执缺口修复后独立PASS。不是完整原界面接线；C/P4仍进行中。 七个仓库repoctx身份与完整membership.primaryRef保留，不替代观察器或生产ID；U02是独立隔离候选，尚未和U01统一装配。原UI/CSS不改；真实创建、实时追踪资格、metadata modal/事件接线、全旧writer排空、GTD完整流程和原生验收仍未完成。trackingComplete/readyForHandoff=false；两实际库IO0，未部署/未迁移。

证据：[实现终审](../../../../REFERENCE_BOUNDARIES.md#ref-129)（外部来源未随包提供）、[测试17项](../../../../REFERENCE_BOUNDARIES.md#ref-130)（外部来源未随包提供）、[程序清单](../../../../REFERENCE_BOUNDARIES.md#ref-131)（外部来源未随包提供）。独立声明与普通备注分离；无变化请求也保留可重放回执；未知尾部/残留锁拒绝继续写入。FW-025/DQ-U01/02/03保持active。


## P4-C2：创建与原子元数据适配（仓库限定）

source_status: confirmed_by_code / confirmed_by_memory
update_type: refines / reinforces

P4-C2原创建与元数据适配完成：同一U02候选已接原Workspace创建方法，固定请求身份，原PEO重要性读写及名称/声明/重要性原子提交；输入控制器保留关闭和保存竞态中的草稿。38项测试通过（C1原17+C2新增21），F1/F2修复后独立PASS。C/P4整体仍进行中。 只在仓库方法适配层验证，原插件/UI/CSS不改；新项目memberships为空且actionable=false。原生DOM/元数据modal/事件BUS、完整多owner创建、实时追踪资格、全旧writer排空、U01/U02统一装配及GTD仍待完成。repoctx不替代生产或观察器ID；仅支持有冻结证据的单项目PEO分组，不声称实时EVA分组已验证。trackingComplete/readyForHandoff=false；NEWERA与实验库IO0，未部署/迁移。

证据：[实现终审](../../../../REFERENCE_BOUNDARIES.md#ref-132)（外部来源未随包提供）、[测试38项](../../../../REFERENCE_BOUNDARIES.md#ref-133)（外部来源未随包提供）、[程序清单](../../../../REFERENCE_BOUNDARIES.md#ref-134)（外部来源未随包提供）。独立声明与普通备注分离；无变化请求也保留可重放回执；未知尾部/残留锁拒绝继续写入。FW-025/DQ-U01/02/03保持active。


当前程序包：[C2 v2八文件清单](../../../../REFERENCE_BOUNDARIES.md#ref-135)（外部来源未随包提供）；[C1 v5清单](../../../../REFERENCE_BOUNDARIES.md#ref-136)（外部来源未随包提供）为历史基线，原报告保留，不再代表当前修改后的程序字节。


## P4-C3：原追踪与资格证据（仓库限定）

source_status: confirmed_by_code
update_type: refines / reinforces

P4-C3原追踪方法与资格证据适配完成：同U02持久化原Mandala启用/停止/恢复，原资格聚合读取Workspace、PEO独立声明及追踪证据；55项测试通过（原38+新增17），独立实现核查PASS。 仅仓库候选方法验证，原数据样本无周追踪；首次显式命令才建立空v3追踪数据，不由membership缓存推断。calendar=utc-v1为仓库确定性回放，不等于真实Obsidian本地moment；原UI/CSS/源码不改。qualificationEvidenceAttached=true，但actionWriteAuthorized/heldGrantAttached/liveTrackingAttached/fullUIAttached/trackingComplete/readyForHandoff=false。U01/U02未统一装配，生产数据/完整创建/旧writer排空/GTD未完成；NEWERA与实验库IO0，未部署/迁移，C/P4仍进行中。

原项目资格是声明有效、生命周期未停用且Mandala追踪存在且未停止，不能拿简化服务原型的doing条件替代。命令版本化UTC日历用于确定性重放；无周数据时不从缓存推断。原fallback具体实例存在周桶与entry.weekId不同，本批不修原算法，也不声称真实moment已验证。

证据：[实现核查](../../../../REFERENCE_BOUNDARIES.md#ref-137)（外部来源未随包提供）、[测试55项](../../../../REFERENCE_BOUNDARIES.md#ref-138)（外部来源未随包提供）、[当前十文件](../../../../REFERENCE_BOUNDARIES.md#ref-139)（外部来源未随包提供）。FW-025/DQ-U01/02/03保留active；未新增Question Map或Unknown。


## P4-C4：共同权威与行动提交（仓库单绑定）

source_status: confirmed_by_code
update_type: refines / reinforces

P4-C4共同权威与行动提交仓库候选完成：fresh combined session以单journal/FIFO串联U01/U02，原Mandala资格经完整身份绑定至原Collection创建，条目与membership link一次确认。当前仅一个有完整证据的既有membership/tab绑定；25项测试通过，独立核查PASS。 六个新增组装文件，旧U01/U02/C3候选保持冻结，不自动adopt旧session或迁移业务。共同版本投影与权限/代际检查在异步后及最终sink复核；unknown/残留lease冻结，新写不能绕过保留ID/回执。原Workspace结构编辑器关闭恢复已仓库验证；U02权限撤销后有未决请求时恢复关闭也会拒绝，保留owner/pending，需恢复权限后关闭；其他项目绑定与完整创建、原主视图/provider/event、全writer排空、真实周数据/moment日历、完整GTD仍未完成。combinedAuthority/heldActionCommit仅仓库限定true；fullUIAttached/realObsidian/trackingComplete/readyForHandoff=false。NEWERA/实验库IO0，未部署，C/P4进行中。

完整primaryRef与既有source-card link证明固定Collection tab，窄投影只在此证据成立后生成；不依赖显示编号或同名猜测。资格与行动在共同队列中保持至witness，权限即时撤销及代际变化拒绝在途写。已确认请求可查回原回执，未知尾冻结不重复创建。U02当前声明投影到U01，旧缓存不反向授予身份。

证据：[实现核查](../../../../REFERENCE_BOUNDARIES.md#ref-140)（外部来源未随包提供）、[测试25项](../../../../REFERENCE_BOUNDARIES.md#ref-141)（外部来源未随包提供）、[六文件组装清单](../../../../REFERENCE_BOUNDARIES.md#ref-142)（外部来源未随包提供）。C3十文件冻结依赖未改；FW-025/DQ-U01/02/03保留active，无新增Question Map/Unknown。


## P4-C5：身份关联与双载体准备（仓库候选）

source_status: confirmed_by_code
update_type: refines / reinforces

P4-C5身份关联和Workspace/Collection载体准备仓库候选完成：18项新增测试+25项C4回归，独立边界5项通过，独立实现核查PASS。另两个有声明项目可以显式建立独立载体和membership，四个未声明条目不自动提升。 新建入口一次提交原Workspace主键、PEO元数据、原Mandala追踪、Workspace/Collection独立载体及membership；creationComplete=false，GTD tag/project/keyword/Markdown未接入。既有项目绑定不重启追踪，不改既有绑定或历史同名载体。固定身份限定关键词索引不等于旧关键词BUS，全局关键词原字节保留。当前包8文件中3修改2新增，C4历史manifest保留，新读者兼容v1，旧读者拒绝Project命令；35冻结依赖未改。主UI/provider/event、全writer/输入排空、真实日历、完整GTD仍待完成；readyForHandoff=false。C5阶段NEWERA/实验库IO0，未部署。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-expansion/implementation-review.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-expansion/source-manifest-v2.json。FW-025和DQ-U01/02/03仍active。


## P4-C6：完整创建数据事务（仓库候选）

source_status: confirmed_by_code
update_type: refines / reinforces

P4-C6完整项目创建数据事务仓库候选完成：15项新增测试+43项C4/C5回归通过，独立实现v2核查PASS。显式导入八份GTD快照后，原Workspace/PEO/Mandala/Collection和原完整GTD引擎在一次journal/witness提交中形成新项目数据。 repositoryDataCreationComplete=true仅指仓库数据事务；creationComplete=false、fullUIAttached=false、readyForHandoff=false。旧同名项目/标签/全局关键词/Windows文件名冲突拒绝，重复编号不同标签可用；固定ID及历史悬空引用占用拒绝。旧记录/标签顺序和未知字段保全，原JSON字节留在导入历史，改写JSON重新序列化。原UI状态写入隔离丢弃。当前包12文件，C4/C5历史manifest保留，原35依赖未改；主UI/provider/event、全writer/输入排空、实际日历、完整GTD任务域仍待完成。NEWERA无访问；实验库仅此前只读核对5插件文件及8份GTD样本，无回写，无安装。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-gtd-creation/implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-gtd-creation/source-manifest-v3.json。FW-025和DQ-U01/02/03仍active。


## P4-C7：原主界面已接流程（仓库候选）

source_status: confirmed_by_code
update_type: refines / reinforces

P4-C7原Workspace/PEO主界面已接流程仓库候选通过：Node12项+历史58项、Chrome17项与unknown场景通过，独立实现v2 PASS；原View/CSS/Modal保留，已接备注、条目标题、重要性、终止/恢复和完整创建API。 仅仓库验证：完整创建API-only，任意Workspace结构/附件/范式/快照和原Mandala周表未接，真实已加载旧writer/input排空未证。旧写sink前置拒绝，关闭等待队列/输入恢复；unknown保留窗口和owner。恢复记录绑定owner和不可变目标，显式认领、重复恢复保护、已知失败持久化后退出。fullUIAttached/realObsidian/readyForHandoff=false。当前17文件，35旧依赖及原25插件源不改。实验库仅只读核对WS5/PEO4、复制3文档并证明3侧文件不存在，无回写；NEWERA无访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4c-main-ui/implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-foundation/p4c-main-ui/source-manifest-v4.json。FW-025和DQ-U01/02/03仍active。


## P4-D1a：GTD任务事务（仓库候选）

source_status: confirmed_by_code
update_type: refines / reinforces

P4-D1a六类GTD任务事务仓库候选通过：13项新增与70项历史回归通过，独立实现PASS。创建工作篮任务、创建固定项目ID行动、日程、截止、完成和恢复调用原完整GTD引擎五方法，在统一journal/witness确认；新增稳定任务ID及projectId映射。 D1a只覆盖六类数据事务，原GTD任务UI、层级/排序、标签/BUS、笔记、删除、项目归档/恢复/改名/转换仍待D1b/D2/D3；repositoryFullGtd/realObsidian/readyForHandoff=false。原stage仅DB一次写，全部文件及silent normalization检查，历史raw/未知字段保留，DB重序列化。既有task按原project名称唯一性检查，不冒充完整历史ID映射。固定+08日历不声称历史夏令时或实际moment兼容。原20文件候选，35依赖/25原源保持；实际运行旧writer退出未证，NEWERA无访问，本批实验库无访问/写入。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd/d1a-implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd/source-manifest-v5.json。FW-025和DQ-U01/02/03仍active。


## N1：原生接入材料与身份保全

source_status: confirmed_by_code
update_type: refines / reinforces

N1原生接入准备已独立复核PASS：限定18数据源及1份固定binding的只读快照，保留实验库原7个ctx身份；11项测试、98项独立检查通过，85个文件哈希吻合。 N1为仓库内材料与身份准备模块，共5个新源码文件；不是完整genesis、安装包或业务权威移交。两次读取一致不等于原子快照或旧writer停止；migrationReady/writerQuiesced/authorityActivated=false。实验库本批只读，运行库写入0，NEWERA访问0。原UI未改，旧20文件/35依赖/25原源冻结；P4身份与行动观察包已安装的历史状态不代表统一内核已部署。

证据：results/daqian-unified-core-20261006/p4/native-runtime-n1/implementation-review-v2.md；results/daqian-unified-core-20261006/p4/native-runtime-n1/source-manifest-v2.json。旧fixture会生成repoctx，不能直接替换已有ctx；N1只保留身份与原材料，不推断声明/追踪/GTD关系。FW-025、DQ-U01/02/03继续active。


## N2第一批：原生存储factory

source_status: confirmed_by_code
update_type: refines / reinforces

N2第一批原生存储factory仓库候选已独立复核PASS：新增8文件，显式根与seed绑定、独立host registry/witness及journal回执，保留原ctx数据。首轮17项测试全通过，修复后2项初始化容量边界通过；独立窄边界复核通过。 本批完成原生持久化模块，不含真实业务genesis、生产host配置、原UI接线、旧writer交接或安装。显式seed测试不是实际业务迁移。残留lease/未知尾阻止新写，确认回执可查；不自动清锁，不声称断电目录元数据持久性或双端同时回退可检测。原N1/共同权威/依赖/原插件源码冻结。实验库与NEWERA本批IO0。既有P4观察包已部署状态保持，统一数据内核仍未部署。

明确初始seed/hash及vault/scope/根身份，journal与host witness分离；完整记录包括digest的预算必须在首写前检查。证据：results/daqian-unified-core-20261006/p4/native-runtime-n2-storage/implementation-review-v2.md、source-manifest-v2.json。此层不能代替业务导入或旧writer退出。FW-025、DQ-U01/02/03继续active。


## D1b：GTD层级排序和项目归档恢复

source_status: confirmed_by_code
update_type: refines / reinforces

D1b四类GTD结构事务仓库候选已独立复核PASS：任务层级/同级排序/跨项目子树移动、项目层级排序及归档/恢复，通过原完整引擎与纯预期差异核对进入共同journal。14项新增测试与83项历史回归通过。 本批只覆盖GTD数据事务，归档GTD项目不等于Workspace/PEO终止或Mandala停用；有active子项目或恢复会产生无效父链时拒绝。完整GTD UI、标签关键词/笔记/删除/改名/转换、原生业务genesis和production host、旧writer/input交接仍未完成。完整排序profile绑定Node/V8/Unicode/ICU及Collator options，环境改变拒绝D1b回放，旧D1a三字段回放保持。原ctx/任务ID和历史保全，DB重新序列化。实验库/NEWERA本批IO0，未安装；既有P4观察包部署状态保持。

固定ID限定原GTD项目操作，跨项目后代及已有taskBindings同事务更新；恢复不复活手工完成任务，异常关联映射不能降级为空。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d1b/implementation-review-v2.md、source-manifest-v7.json。FW-025、DQ-U01/02/03继续active。


## D2a：普通GTD标签关键词与导入笔记绑定

source_status: confirmed_by_code
update_type: refines / reinforces

D2a三类GTD元数据事务仓库候选已独立复核PASS：条目标签添加/移除、普通标签关键词替换及已有导入笔记绑定/解除，通过原完整GTD引擎差异核对进入共同journal。最终18项新增测试通过；窄修复前97项历史回归通过。 本批只覆盖普通标签和导入材料目录内的笔记绑定，ctime=null，未证明真实vault全量笔记解析。上下文主键标签/关键词及规范分隔符变体被保护，需后续跨插件事务；原Markdown字节不改，未知关键词wrapper及保留条目字段保全。标签定义管理、删除/改名/转换、评论/标志及原输入防丢、原GTD UI、原生业务genesis/production host、旧writer/input交接仍未完成。D2a metadata profile绑定归一化运行环境；旧D1a/D1b回放保持。实验库/NEWERA本批IO0，未安装；现有P4观察包部署状态保持。

上下文关键词按canonicalLabel、规范displayLabel及外部映射保护，不能按同编号合并。原方法归一化输出先完整核验再恢复已知保留字段；note binding限精确已导入路径，禁止basename自动选中。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2a/implementation-review-v2.md、source-manifest-v2.json。FW-025、DQ-U01/02/03继续active。


## D2b1：普通GTD标签定义生命周期

source_status: confirmed_by_code
update_type: refines / reinforces

D2b1四类普通GTD标签定义事务仓库候选已独立复核PASS：创建、编辑、层级排序与删除，经原TagDefinitionModal保存、原顶层移动和原管理器删除方法核对进入共同journal。最终17项新增测试通过；窄修复前115项历史回归通过。 本批限定普通标签/分类标签；编辑保留固定ID，关键词和未知字段保全。上下文标签、祖先和子树受保护；create/edit/move按原方法全组重编号普通order，保留相对顺序，delete不重编号且预检未来受保护order不变。删除须无子标签/条目使用/关键词。只验证原modal保存路径，另一个inline编辑入口的排序差异、隐式关闭防丢和真实UI仍未整合。条目/项目改名删除转换、评论/标志、跨上下文联动、原生genesis/production host、旧writer/input交接仍未完成。旧D1a/D1b/D2a行为回归通过；实验库/NEWERA本批IO0，未安装，既有观察包部署状态保持。

标签ID独立于名称；旧标签全局order重编号按原modal/move行为核对，保护主键载体与完整关联。删除不自动清理关键词，分类标签关键词通过定义编辑显式清空。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2b1/implementation-review-v2.md、source-manifest-v2.json。FW-025、DQ-U01/02/03继续active。


## D2b2：普通GTD条目生命周期

source_status: confirmed_by_code
update_type: refines / reinforces

D2b2四类普通GTD条目生命周期仓库候选已独立复核PASS：条目改名、无联动笔记的普通项目改名、无当前引用叶子/空项目删除、工作篮根叶子转入已有项目。经原renameItem/deleteItem/moveInboxItem进入共同journal，固定ID保留。最终16项新增测试通过；引用扫描窄修复前132项历史回归通过。 本批只支持已导入当前材料范围；保守检查当前文件/JSON转义引用和跨owner引用，历史快照保留。禁止上下文项目及保护标签变更、带笔记/引用/任何状态子项的删除及子树转换；taskBindings缺失与空映射分别保留，转换按固定项目ID登记。原工作篮升级新项目分支存在清空content后创建文件的问题，尚未接入。关联笔记与跨上下文改名删除、评论/标志、完整原UI/输入防丢、真实genesis/production host和旧writer交接仍待完成。本批实验库/NEWERA均IO0，未部署，既有观察包状态保持。

原引擎保留，通过严格oracle进入统一事务；名称不替代固定身份。当前引用与历史证据分离，导入材料中无引用不代表真实库无引用。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2b2/implementation-review-v2.md、source-manifest-v3.json。FW-025、DQ-U01/02/03继续active。


## D2b3：评论、标志、普通工作篮升级与草稿服务

source_status: confirmed_by_code
update_type: refines / reinforces

D2b3评论、三类标志和普通工作篮升级新项目的仓库事务已独立核查PASS；另补可恢复评论草稿服务。升级保留原固定ID，项目记录与原模板项目笔记一次提交。最终21项新增测试通过；草稿恢复窄修前148项历史回归通过。 评论按原文和属性哈希保存，清空需明确确认；标志支持isFirstClass/isFocusSession/isDimmed，折叠状态不在本批。升级仅限普通活动工作篮根叶子，阻止上下文/关联笔记/当前引用/子项和名称路径冲突，不创建共享Workspace/PEO上下文。草稿是仓库服务，已测保存并发、失败保留、固定请求恢复和只读读取；尚未接原评论弹窗，不能声称真实X/Esc/卸载防丢完成。原界面设计保留，关联笔记/共享上下文生命周期、D3完整原GTD主界面、真实业务genesis/production host和旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核，既有观察包状态保持。

原界面尚无本批草稿服务消费者；普通GTD项目升级不等于共享上下文创建。草稿已保存状态不能代替权威回执。草稿链保护完整性，不宣称对可重封整链写入者的身份认证。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d2b3/implementation-review.md、source-manifest-v1.json。FW-025、DQ-U01/02/03继续active。


## D3a：原GTD首批界面接线

source_status: confirmed_by_code
update_type: refines / reinforces

D3a原GTD首批界面接线仓库候选已独立核查PASS：沿用完整原渲染器、评论窗口和工作篮选择框，接评论、三类标志、转入已有项目及升级新项目。最终18项界面测试通过；适配器窄修前21项草稿/业务服务回归通过。 这是隔离Chrome与Obsidian壳层的原UI验证，不是实际Obsidian运行验收。评论窗口已在仓库接草稿服务，取消/遮罩/X/Esc/程序关闭和受控view/plugin卸载均经测试；磁盘失败保持窗口，未知或过期pending草稿只读恢复。窗口生命周期只允许一个GTD宿主；未接线Modal和inline编辑入口拒绝录入，原布局保留。其他GTD任务/层级/元数据/标签/生命周期的界面入口仍待接入；关联笔记/共享上下文生命周期、真实业务genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，统一内核未部署，既有观察包状态保持。

原窗口形态保留；同一browser window不复用宿主；草稿持久化与权威回执分层不变。普通项目转换不创建共享上下文。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3a/implementation-review-v2.md、source-manifest-v2.json及两张截图。FW-025、DQ-U01/02/03继续active。


## D3b1：任务日期与完成回退原界面

source_status: confirmed_by_code
update_type: refines / reinforces

D3b1原GTD任务日程、截止日期、完成与回退四入口已在仓库候选独立核查PASS；沿用原按钮/日期窗口/完成确认。最终15项新界面测试通过；日期默认值及focus窄修前18项D3a界面回归、13项任务服务回归通过。 仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。关闭/取消不改日期，专用清除按钮提交null；错误保留日期，重试沿用原revision，unknown保留原请求并拒绝owner退出。任务按固定ID完成/回退；项目日期与项目生命周期UI、创建/层级/元数据标签等入口仍待接入。刷新只补偿一个仍存在的可见锚点，显式定位/用户滚动或焦点移动优先，丢失锚点不强拉旧位置。实验库与NEWERA均IO0；统一内核未部署。

取消与null-clear分离，原匿名Enter处理由实例捕获拦截；不改原源码、不启用原全局延时恢复、不把环境态写入业务JSON。证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b1/implementation-review.md、source-manifest-v2.json与browser-v2.tap。初轮14项中2项失败保留：原QuickPrompt默认值未被壳层写入DOM，以及滚动用例在页面底部未实际移动；经独立计划核查与字节备份后窄修。D3a回归原位运行曾刷新旧original-gtd-main.png/original-comment-modal.png，旧图不再作为原字节冻结证据；受影响路径/当前hash/本轮复制来源见screenshot-provenance.json。历史TAP/源码manifest/核查结论未重写；当前视觉验收采用本轮新日期/确认截图。MemPalace查询超时后bounded Atlas fallback，无mine。 FW-025、DQ-U01/02/03继续active。


## D3b2：根创建与关闭留草稿

source_status: confirmed_by_code
update_type: refines / reinforces

D3b2原GTD工作篮任务、普通项目、下一步行动的根创建入口及指定项目根行动已在仓库候选独立核查PASS；保留原QuickPrompt与项目选择窗口，关闭只留草稿，明确提交才创建。普通项目条目和原模板笔记由同一事务保存。 仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。层级插入仍关闭；普通GTD项目不自动成为共享Workspace/PEO/Collection上下文。创建pending仅首次派发，后续查询原请求，not_found/unknown不重新创建；pending持久化到派发间崩溃会保留只读草稿，需后续人工处理。saved后的晚到输入独立carryover只读保留。实验库与NEWERA均IO0；统一内核未部署，完整GTD/真实host/旧writer交接未完成。

最终31项创建界面、17项创建服务通过；13项旧task和21项workflow服务在关闭握手修复前通过（合计service-v2为46项含初版12creation），关闭握手修复后、最终化窄修前33项原UI回归通过。独立核查曾BLOCK空白关闭和丢弃晚到DOM，现prepare/finalize持有owner并绑定精确快照/token，before/after丢弃写盘失败同token修复；独立v2又发现空白丢弃genesis失败与release回执丢失，最终化精确双状态修复和completed-token幂等回执已补齐；保留原BLOCK及失败TAP。旧新建禁用断言已在结果副本适配；旧workflow随机首个context可能先触发linked-note guard，独立同fixture新旧一致且不写数据，新增无同名笔记遮挡context负例。未改历史测试或旧截图；当前两张创建截图已人工查看。MemPalace只读查询成功，无mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b2/implementation-review.md、source-manifest-v3.json。FW-025、DQ-U01/02/03继续active。普通GTD项目身份不能因入口相似就等同共享上下文；关闭窗口结束作者输入后才释放草稿所有权。


## D3b3a：原结构与普通项目归档回退

source_status: confirmed_by_code
update_type: refines / reinforces

D3b3a原GTD任务移动、项目排序、普通项目归档与回退四入口已复用原界面和原业务引擎，经已有统一命令通道接入，仓库候选独立核查PASS。 仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。共享项目的直接结构/归档、祖先及移动子树仍关闭；原排序允许间接共享同级仅sortOrder变化，其余字段不得改变。层级创建、元数据标签、其他编辑和关联笔记/共享生命周期仍待接入。实验库与NEWERA均IO0，未部署统一内核；完整GTD、真实host及旧writer交接未完成。

21项本批界面与边界测试、64项原UI副本回归及14项原结构测试通过。四文件修改，42源总数不变，其余38源及35依赖/25固定原始源未改。独立核查证据见implementation-proof.json。初版20项17通过/3项样例准备错误：非法项目名、未创建真实共享绑定、同级移动未触发共享排序；调整样例后各自窄复验通过，并新增unknown用例。v4另修测试把U02共同版本号误作业务内容比较，v5显式核验共同版本加1并比较其余全部字段；v5另修项目child测试坐标为原项目行右侧72%以上（任务仍用原40像素阈值），v6通过；产品源码保持v1不变；独立3项探针通过，原失败TAP与脚本版本保留；截图仅写本批目录，原项目确认窗口和拖动后层级截图已查看，无截断遮挡。MemPalace只读查询超时，使用有界Atlas回退，无mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3a/implementation-review.md、source-manifest-v1.json。FW-025、DQ-U01/02/03继续active。用户偏好（confirmed_by_user，本轮明确继续）：保留和复用已有GTD程序。代码事实（confirmed_by_code）：原渲染、拖动几何和业务算法复用，新增边界适配。统一数据内核不要求重造原功能。共享项目的间接同级顺序重排只允许sortOrder变化，不扩展其生命周期权限。


## D3b3b：原普通标签与已有笔记绑定

source_status: confirmed_by_code
update_type: refines / reinforces

D3b3b原GTD普通标签添加/移除、已有笔记绑定/显式清除入口已复用原界面和现有元数据服务，经统一命令接入，仓库候选独立核查PASS。 仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收；TagSuggester原class复用，截图是壳层按钮列表而非原生搜索外观。标签定义/关键词作者输入、层级创建、其他编辑和共享上下文生命周期、真实genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核；完整GTD未完成。

本批21项界面与边界检查（v1 19通过，另2项选择器样例错误经v2限定modal/summary后通过）、64项原UI副本回归、4项结构/归档UI代表回归、18项元数据服务通过。四文件修改，42源总数不变，其余38源及35依赖/25固定原始源未改。独立2项针对性探针通过，证据见implementation-proof.json；原失败TAP/脚本保留。截图仅写本批目录，已查看笔记选择无截断遮挡；标签截图不作为原生视觉验收。MemPalace有界只读Atlas检索成功，无mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3b/implementation-review.md、source-manifest-v1.json。FW-025、DQ-U01/02/03继续active。用户偏好（confirmed_by_user，本轮明确继续）：保留和复用已有程序及界面，在统一数据内核基础上扩充功能。代码事实（confirmed_by_code）：原TagSuggester、笔记选择器和元数据业务阶段复用；所有旧绑定显示/打开只按投影精确路径，不再按同名/ctime静默改指。搜索定位文字为环境输入，取消不改变绑定；标签关键词等作者输入仍待独立接入。未来插件可先独立试验再整合是架构建议（inferred），涉及共享数据时仍需使用统一权威服务；包装拆合与数据权威分开。Ontology结构编辑器与ontology-meta-hub不是同一范围，后者未接入。


## D3b3c：原标签关键词作者输入

source_status: confirmed_by_code
update_type: refines / reinforces

D3b3c原GTD标签关键词编辑已复用原TagDefinitionModal和规范化helper，通过独立作者草稿接入已有setTagKeywords服务，仓库候选独立核查PASS。 仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。原表单保留，关键词以外定义字段/导航暂时禁用；尚未实现完整标签定义编辑。pending只查询原请求，not_found也不重发；dispatch前中断的人工处理仍待后续。层级创建、其他编辑、共享生命周期、真实genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核；完整GTD未完成。

v2的20项原关键词界面与输入生命周期测试、15项草稿服务测试通过；保留v1的64项未改原UI副本回归证据，独立8项探针通过。初次v1 PASS被追加关闭顺序核查BLOCK取代，按已审最小修复备份并只改关键词UI后，以v2独立PASS为当前结论。每次重试均先核对最终原文并结束输入再释放，关闭失败后的晚到原文保留可复制。5个既有源改动+3个新typed关键词draft/session/UI，45源；其余37源及35依赖/25固定原始源不改。业务元数据domain/stage、旧comment/create草稿不改。复制回归中仅将新建标签入口预期改为挂载前拒绝，原历史脚本未改。截图已查看窗口输入和底部操作无截断；壳层createEl的value选项呈现不代表原生验收。服务首次v2运行缺少浏览器模块环境变量而失败，保留service-v2.tap；补环境后service-v2b.tap为当前通过证据，源未修改。独立核查见implementation-proof-v2.json。MemPalace有界Atlas检索成功，无mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3c/implementation-review-v2.md、source-manifest-v2.json。FW-025、DQ-U01/02/03继续active。原TagDefinitionModal和两个纯关键词规范化helper复用；关键词之外的定义字段/使用项目跳转暂时gated。raw text草稿与规范化后的业务keywords分开，取消只保留草稿；显式save/clear才提交。pending意图固定且仅初次dispatch，unknown/not_found重入只查原回执；prepared-close在最终DOM检查和结束输入后释放owner。代码事实仅限仓库候选，不将完整表格编辑器或Ontology元表格插件边界合并。


## D3b3d：原标签定义管理

source_status: confirmed_by_code
update_type: refines / reinforces

D3b3d原GTD普通标签定义管理已复用原TagDefinitionModal及管理器，将新建/编辑/排序/删除接入已有统一服务；独立多字段草稿保护已验证，仓库候选独立核查PASS。 仅隔离Chrome与Obsidian壳层验证，不是实际Obsidian验收。原名称/图标/颜色/父级/分类/关键词表单及管理器保留；固定ID只读并由已有服务生成，项目身份/受保护标签仍拒绝普通标签写入。使用项目导航暂时禁用。pending只查询原请求，not_found也不重发。其余条目编辑、层级创建、共享生命周期、真实genesis/production host及旧writer交接仍待完成。实验库与NEWERA均IO0，未部署统一内核；完整GTD未完成。

v2源码下21项原标签定义UI、20项旧关键词独立入口UI、18项定义草稿服务及4项独立故障探针通过。48项早期服务合集中含原标签服务17/旧关键词服务15，保留其未改模块证据；64项原UI副本回归通过。第一轮两项测试假设修正：domain是普通分类，子级按钮使用实际文字而非壳层未支持title；旧关键词重复打开测试改为独立keyword API，完整原配置入口由新增UI覆盖。v1独立核查发现无效父级在owner申请后才校验，保留BLOCK及复现，v2备份后先校验初始表单再申请owner。6个既有源改动+3新typed定义draft/session/UI，48源；其余39源及35依赖/25固定原始源不改。业务tags/metadata服务与原始程序不改；keyword-session只增主session控制的强制只读恢复。查看截图确认原表单与操作无截断。MemPalace有界Atlas检索成功，无mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3d/implementation-review-v2.md、source-manifest-v2.json。FW-025、DQ-U01/02/03继续active。原TagDefinitionModal与标签管理器复用，使用项目跳转暂时gated。多字段原文草稿与规范化业务值分开，创建ID固定；原父级选择保持身份与筛选词分别保存。跨编辑器保留草稿扫描异常fail closed；初始表单和父级校验在申请owner之前；拖动版本取dragstart，删除版本取确认前。取消只保留草稿，显式save/clear才提交。pending意图固定且仅初次dispatch，unknown/not_found重入只查原回执；prepared-close在最终DOM检查和结束输入后释放owner。代码事实仅限仓库候选，不将完整表格编辑器或Ontology元表格插件边界合并。


## D3b3e：原重命名与归档删除

source_status: confirmed_by_code
update_type: refines / reinforces

D3b3e原GTD普通条目重命名与原归档删除入口已接入已有统一生命周期服务；复用原QuickPrompt和ConfirmModal，独立名称草稿保护及候选源码通过独立核查。 仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。共享项目及其祖先链保护继续生效；关联笔记、当前引用及子级等仍由原服务拒绝，不提供关联笔记同步重命名。普通项目改名成功证据仅合成生命周期服务，原浏览器项目入口验证共享项目拒绝。原删除按钮只在归档条目出现。名称为空或未变拒绝，不隐式删除；pending固定且unknown/not_found重入只查询。层级创建、共享生命周期、其余未接入口、真实host/genesis及旧writer交接待完成。实验库与NEWERA均IO0，统一内核未部署，完整GTD未完成。

名称草稿服务15项、原生命周期服务16项通过；原重命名浏览器15项通过，原归档删除独立补测1项通过；原创建31/评论与首批入口18/标签定义21共70项回归已覆盖：初跑69项通过，1项旧断言仍把已开放铅笔当未开放，修正为打开重命名后关闭且零业务改动，单项补测通过。保留service-v1的两项测试夹具错误（class展开丢方法、伪造链保留旧摘要），修正副本v2全部通过；browser-v1误在活动行寻找原删除按钮，v2首次展开归档后刷新会折叠，v3每次确认原归档展开后补测通过。源码未因测试修正改变。5改3增，51源；原43源、35依赖、25固定原程序不改。名称原文与trim业务值分离，固定ID不变；原Enter关闭前提交回调已阻断，prepare-finalDOM-nativeClose-release顺序保护输入；失败关闭/释放可恢复。原界面截图已查看，无表单截断。无MemPalace mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b3e/implementation-review-v1.md、source-manifest-v1.json。FW-025、DQ-U01/02/03继续active。复用原QuickPrompt时拦截原Enter先关闭后回调顺序；名称原文与规范化值分开，固定身份和版本取打开时刻，删除版本取确认前；保存未确认只查询原意图。prepared-close在最终DOM检查和结束输入后释放owner。候选验证不扩张为真实运行库验收。


## D3b4：原同级与子级创建

source_status: confirmed_by_code
update_type: refines / reinforces

D3b4原GTD普通同级项目、同级任务和子任务入口已接入统一内核，复用原addNewItem与QuickPrompt；固定层级记录和独立创建草稿保护已通过候选源码独立核查。 仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。原项目＋新增同级项目，原任务＋/↳新增同级/子任务；原项目↳仍为根下一步行动，不新增子项目按钮。子项目创建已具备服务/私有适配能力，仅原引擎服务验证。共享目标/祖先继续拒绝；同级根项目排序只允许原算法附带重排共享兄弟的sortOrder。scope固定记录目标及祖先ID/类型/父级/项目ID，移动后重核版本也拒绝旧范围。新增命令不可交给旧读取器，原命令与草稿不变。剩余原入口、共享生命周期、真实host/genesis及旧writer交接待完成。实验库与NEWERA均IO0，统一内核未部署，完整GTD未完成。

层级创建服务16项、修复后的原层级浏览器14项、原根创建UI31项通过。独立v1核查发现草稿身份字段顺序导致原按钮无法恢复（F1 BLOCK），只修复UI结构身份键后复核通过；保留v1失败与v2修复证据。原任务/结构服务回归除一处测试副本的__dirname指向旧位置外均通过，修正副本定位后单项补测通过，历史失败证据保留。原创建逻辑在隔离原引擎中执行；项目笔记/数据库/任务membership一次事务提交，父级与兄弟排序逐项核对，固定ID和请求幂等、未知结果只查、关闭防丢已验证。计划独立核查要求导出既有compare及固定祖先scope，两项落实后PASS。7改4增55源，44旧源及35依赖/25固定原程序不改；gtd-structure-domain只导出原compare。原界面截图已查看，无截断。无MemPalace mine。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b4/implementation-review-v2.md、source-manifest-v2.json。FW-025、DQ-U01/02/03继续active。原addNewItem仍承担创建行为，固定层级scope包含锚点及祖先关系并进入命令/草稿/replay；显式重新核对版本也不会自动跟随已移动祖先。根创建兼容，原层级排序函数只导出复用；输入原文在独立草稿中保护，未知结果只查询原意图。prepared-close在最终DOM检查和结束输入后释放owner。候选验证不扩张为真实运行库验收。


## D3b5：原项目日期与入口清单

source_status: confirmed_by_code
update_type: refines / reinforces

D3b5原GTD普通项目日程与截止日期已接入统一内核，复用原日期按钮和原日期处理函数；设置、明确清除和取消已验证。 仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。只改变所选普通活动项目的日期，任务、子项目、笔记、绑定与历史保持原值；共享目标或祖先继续拒绝。任务schedule/deadline命令与旧记录语义不变；新增scheduleProject/deadlineProject不能交给旧读取器。日期取消放弃未提交选择，空白无效；未知结果目前安全阻塞后续操作和退出，尚无通用用户恢复入口。两库IO0，未部署，完整GTD未完成。

项目日期服务10项、原项目日期界面7项、任务/结构回归27项和原任务日期相关界面5项通过。服务v1把数据库JSON键排序误当字段变化导致断言失败，v2仅修正测试为数据库对象深等，其他文件/元数据逐字节验证；失败日志保留，生产源码未因该测试变化。5改0增55源，50旧源及35依赖/25原快照不变；已做独立计划、实现和备份核查。原日期弹窗截图已查看。无研究卡或MemPalace mine；经验搜索向量超时后使用限定目录回退，不宣称向量可召回。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b5/implementation-review-v1.md、source-manifest-v1.json。FW-025、DQ-U01/02/03继续active。项目日期独立命令复用原setItemSchedule/setItemDeadline，旧任务日期命令边界不扩张。固定ID与点击时revision定位项目，严格日期和单字段结果校验；不把日期传播到子级。共享项目与祖先资格继续拒绝。ENTRY_AUDIT明确旧折叠写入、缺失笔记创建、自愈、EVA关系/Meta、运行态sidecar与通用未知结果恢复的差异。候选验证不扩张为真实运行库验收。


## D3b6：显式折叠与恢复边界

source_status: confirmed_by_code
update_type: refines / reinforces

D3b6原GTD普通任务和项目的显式折叠/展开已接入统一内核；保留原箭头、summary及键盘操作，页面恢复临时展开不回写业务字段。 仅仓库Chrome与Obsidian壳层候选，不是实际Obsidian验收。新setCollapsed保存原isCollapsed字段，固定ID与revision、普通目标及祖先资格、精确单字段校验；旧setFlag不扩张。共享目标改值仍拒绝，相同已存值只协调显示、不发命令，不代表修改权限。QuickNav/restore展开保持环境态。forceAutomation开关不等于实际恢复；局部折叠刷新在没有显式导航和实际恢复时跳过旧视角重放。未知提交结果仍仅安全阻塞，暂无通用恢复入口。两库IO0、未部署、完整GTD未完成。

折叠服务8项、原界面10项、原workflow回归21项、原项目日期回归7项通过；原界面截图已检查。6改0增55源，49旧源及35依赖/25原快照不变；独立计划要求区分forceAutomation与实际恢复，并验证开启automation后的最终DOM及延迟窗口。字节备份、独立实现核查完成。独立补测5个场景与旧reader拒绝新操作检查通过；独立v1/v2测试数据构造失败日志保留，保护场景以修正fixture后的v3通过为准，不宣称v2整套通过。无规则/Skill/研究卡或MemPalace mine；经验搜索使用此前向量超时后的限定目录回退。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b6/implementation-review-v1.md、source-manifest-v1.json。FW-025、DQ-U01/02/03继续active。setCollapsed复用原toggleCollapse，且不扩张旧setFlag字段。任务箭头与project summary可信鼠标/键盘激活才保存；DOM toggle/restore/reveal只显示，避免restore-time writeback。局部刷新仅在没有显式导航和实际恢复时跳过旧视角重放，其他刷新沿用原逻辑。共享改值仍拒绝，same-value刷新为纯显示例外。候选验证不扩张为真实运行库验收。


## D3b7：原标题笔记创建；EVA独立计划

source_status: confirmed_by_code
update_type: refines / reinforces

D3b7原GTD界王拳截止日期卡的标题笔记打开/创建已接入统一内核仓库候选；复用原helper，只创建缺失笔记，不自动写入noteBinding或修改任务数据库。EVA Cross Relations已列入独立后续接入计划。 仅仓库Chrome/Obsidian壳层测试；未部署、两库IO0。普通活动条目与祖先资格、固定ID/revision、唯一安全标题路径、冲突拒绝和精确文件差异校验，当前/历史文件与目录前缀冲突拒绝；已有笔记纯导航允许只读/共享，不代表共享写入接入。确认回执固定路径，较新导航和关闭抑制迟到跳转。通用未知结果恢复仍待补，当前保留安全阻塞；完整GTD、EVA关系/Meta、ontology-meta-hub及真实host/旧writer交接仍未完成。

标题笔记服务11项、原界面10项、任务回归13项、折叠界面回归10项通过。5既有源改动+2新模块共57源，50旧源及35依赖/25固定快照不改。v1/v2原helper隔离环境误拦非目标只读查询及ViewState sidecar修改，原失败/中止日志保留；v3只放行这两类环境行为，业务modify仍拒绝，独立v3发现文件/隐含目录冲突，保留BLOCK与复现；v4经补充计划核查后备份两文件补上current/history及已有笔记UI路径结构检查，最终独立实现复核见v4证据。任务13/折叠10回归在v2阶段通过，v4仅改新笔记路径检查，最终受影响21项重跑通过。原界王拳截图已检查。独立v4补测8项通过，含只读共享导航与服务拒绝、固定回执路径、新导航优先、目录冲突及旧reader边界；独立早期fixture错误和v3 BLOCK历史均保留。无规则/Skill/研究卡或mine；经验查询使用有界Atlas回退。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入→真实host/旧writer交接与实验部署。用户已明确要求补进计划；当前尚未实现。

下一步：D3b8补通用未知提交结果的查询与恢复入口；之后完善共享身份/生命周期，单独接入EVA Cross Relations关系事务、原chips/编辑器/跳转与固定ID验收，再分项接EVA Meta。随后真实host/genesis、旧writer安全交接及实验库受控试用。Ontology表格候选与ontology-meta-hub分开；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b7/implementation-review-v4.md、source-manifest-v4.json、ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b8：持久操作记录与保存结果查询

source_status: confirmed_by_code
update_type: refines / reinforces

D3b8已给原GTD通用操作补上持久操作记录、保存结果查询和精确本地记录修复；确认回执后可恢复页面，查询不会重复提交或补做迟到的笔记跳转。 仅仓库Chrome/Obsidian壳层候选，两个运行库IO0、未部署。原业务内核和native journal未改。保存前持久意图、固定requestId/revision、两份独立本地追加记录逐项对齐、完整链及历史精确回执重验；同步互斥排除并行提交与恢复竞态。健康的not_found只允许已结束且明确失败的本次派发自动释放；重开的待确认操作须用户明确确认才能释放；启动时单边缺失、截断或非对称记录继续阻断，仅活进程exact attempt可完成本地双链写入；真正unknown tail或残留writer lease继续阻断，不伪造witness、不删除lease、不重派业务命令。完整GTD、共享身份/生命周期、EVA关系/Meta、ontology-meta-hub及真实host/旧writer交接仍待完成。

服务18项、原界面8项、标题笔记界面回归10项、任务回归13项通过。4既有源+1新模块共58源，53旧源及35依赖/25固定快照不改。初次service-v1未设置Playwright路径，失败和取消日志保留，环境补齐后service-v2通过；独立v1发现整个ledger丢失后重开误判、日期/绑定丢回执文案错误和关闭残留恢复入口，BLOCK及原失败探针保留；经补充计划与3源字节备份后，v2增独立anchor全链对齐、真实pending envelope检查、准确文案和节点清理，再跑service-v3及browser-v2/note-v2。两链之一缺失/截断/半写均拒绝启动，全部本地完整性元数据一致删除或重写不在该模型保障范围；不掩盖历史失败。v1截图被v2重跑覆盖，原截图字节不可复验；旧proof及其余23项证据保留，限制见historical-evidence-note.md，v2图另存。原界面截图已检查，独立对抗核查见本轮implementation-review-v2.md。无规则/Skill/研究卡或mine；经验查询沿用有界Atlas回退。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入→真实host/旧writer交接与实验部署。用户已明确要求补进计划；当前尚未实现。

下一步：D3b9先完善共享项目身份与生命周期约束及原入口；随后按D3b7 ENTRY_AUDIT既定计划，独立接EVA Cross Relations原关系数据/端点/消费者→固定ID关系事务→原chips/编辑器/跳转→改名改编号/缺失端点/过期版本验收，再分项接EVA Meta。真实host/genesis、native未知日志恢复及旧writer安全交接完成后再受控试用；Ontology表格候选不等于ontology-meta-hub。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b8/implementation-review-v2.md、source-manifest-v2.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b9：共享固定身份资格与日期折叠

source_status: confirmed_by_code
update_type: refines / reinforces

D3b9已为有明确固定ID关联的共享根项目接入资格投影，以及原GTD日期/截止日期和显式折叠入口；通过新命令复用原实现，只改所选项目字段。 仅仓库Chrome/Obsidian壳层候选，两库IO0、未部署。UI捕获固定ref/revision，服务与回放重算绑定、PEO生命周期和追踪资格；正常不合资格项目保留ref与原因，损坏/缺失/重复/跨项目关联停止处理。PEO停用主键不等于GTD归档项目；未自动合并两种语义。旧普通命令及旧回放边界不变。已有项目显式关联、共享改名/改编号传播、归档/恢复、嵌套结构和通用任务写入资格尚未补齐；EVA、真实host/旧writer交接及native未知日志处理仍待完成，不能称完整共享生命周期或可部署。

共享服务11项、原界面6项、普通项目日期回归7项、折叠回归10项和保存结果查询回归8项通过。5既有源+1新模块共59源，53旧源及35依赖/25固定快照不改。service-v1因primaryRef来源范围误用Workspace而非既有Mandala来源被严格检查拒绝，1通过9失败日志保留；按原计划修正为tracking.SOURCE，另加生成共享项目缺失绑定检查，改前字节备份及v2差异保留；service-v2通过；v2独立核查BLOCK发现绑定目标互换、专用页串线与重复成员关系，v3按现有固定身份规则严格重算并补充回放证明，service-v3通过。browser-v1保留5通过1失败，诊断证明模拟点击导致DOM与已存状态不同；browser-v2先从已确认状态刷新后再测展开，保持全部防写与最终两次命令断言。独立核查详见implementation-review-v3.md；最终v3源码再跑普通界面三组回归25项通过（regression-final-v2.tap）；原界面截图使用本批独立版本名。无规则/Skill/研究卡或mine；经验查询使用Atlas有界fallback。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b10继续补已有项目显式固定ID关联与共享改名/改编号传播、归档/恢复边界；明确PEO停用与GTD归档各自行为，覆盖其他任务写入资格。随后优先完成真实Obsidian host、启动/重启/中断处理和旧writer交接，形成限定范围实验试用包；EVA关系与Meta按独立计划逐项接入，未验收前不称全部整合。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b9/implementation-review-v3.md、source-manifest-v3.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b10：已有项目固定身份关联及归档恢复

source_status: confirmed_by_code
update_type: refines / reinforces

D3b10已接入已有GTD根项目与既有Workspace/Collection固定身份的明确关联，以及原GTD共享项目归档/恢复入口；关联只登记身份，不重写原数据或合并名称编号。 仅仓库候选，两库IO0、未部署。关联采用双向记录与独立导入/专用页来源证明；损坏、缺失、重复、跨项目关联停止处理。日期、折叠与GTD归档/恢复走资格服务；PEO停用、停止追踪与GTD归档互不等同。关联后的原控件仍保留，但尚未接入资格服务的评论、标志、标签、笔记、任务和结构写入会被拒绝；旧日志回放不变，不能称完整GTD。跨载体改名/改编号传播、嵌套共享结构、通用任务资格、EVA/Meta、真实host与旧writer交接仍待补齐。

最终源码61项（6旧改+2新，53旧源不改），35依赖/25固定快照不改。原始service-v1的owner用例业务断言通过但teardown误用旧token，10通过1失败；新版测试修正清理逻辑后通过。独立v1 BLOCK发现首次关联信任错误Collection tab；v2改用固定seed/provisioning来源，但导入workspaceTabId:null与seed ref equality仍遗漏；v3按已审解释补齐，19项独立检查通过。旧失败证据保留。最终root服务37项（新12、共享回归11、结构回归14）、原界面20项（新6、共享回归6、保存查询回归8）通过。源码备份及每版差异有记录；无规则/Skill/研究卡或mine，经验查询为Atlas有界fallback。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b11补跨载体改名/改编号同步，明确已有项目的标签和笔记等承载归属，不按显示名推断；随后为评论/标志/任务等原入口补资格服务并恢复相应操作。保留PEO停用与GTD归档边界，再优先完成真实Obsidian host、启动/重启/中断和旧writer交接，形成限定范围试用包；EVA/Meta按独立计划接入，不作为首轮限定试用的全部前提。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b10/implementation-review-v2.md、source-manifest-v3.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b11a：共享元数据归属预检与固定关系索引

source_status: confirmed_by_code
update_type: refines / reinforces

D3b11a完成共享项目改名/改编号的只读归属预检，并补齐已有明确关联GTD项目在主界面中的固定ID关系索引；未实现改名提交。 仅仓库候选，两库IO0、未部署。新建项目按专用页/标签/笔记/关键词指针检查；已有项目关联只证明身份，不因同名推定标签和笔记归属。预检始终canCommit:false，planningReady不是写入授权，引用和碰撞检查仅覆盖仓库导入的现态/历史材料。旧writer、PEO/Workspace局部元数据写入仍可能造成分歧，需后续统一事务和提交门禁；本轮仅报告分歧。原视图不改版；日期/折叠/归档恢复资格保留，其他共享写入仍待补齐。

新服务16项与修复补充5项、独立反例回归7项共28项通过；现有服务回归49项、原GTD界面回归6项通过。独立v1 BLOCK发现六类遗漏（历史标签/关键词/其他声明、大小写笔记链接/Collection评论/历史笔记绑定）；v2按已审计划补齐，最终独立核查见implementation-review-v2.md，早期失败证据保留。生成/已有身份关系、未导入GTD状态、损坏拒绝、停用/归档可见、纯读取不改文件、未知结果拒绝已覆盖。源码3改1增，62源；原reducers/commands/冻结程序不改，无规则/Skill/研究卡/mine。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b11b实现生成项目的共同队列元数据事务，逐项核验后一次提交跨载体名称/编号/笔记路径与关键词；为已有项目显式选择和登记标签/笔记归属，不按名称猜测。补追踪当前标题和笔记引用处理政策、旧PEO/Workspace局部写入准入保护、可靠草稿和原编辑入口。随后补共享评论/标志/任务资格，再做真实host/旧writer交接和限定范围实验试用。EVA/Meta独立排期，不作为首轮限定试用全部前提；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11a/implementation-review-v2.md、source-manifest-v2.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b11b：共享元数据原子提交与旧入口保护

source_status: confirmed_by_code
update_type: refines / reinforces

D3b11b已实现生成项目改名/改编号的统一原子提交：Workspace、PEO声明、专用载体、GTD项目/任务、标签、笔记路径、关键词和当前追踪标题同步，固定ID不变。 仅仓库候选，两库IO0、未部署。仅接受统一内核生成且归属已证明的专用项目；已有明确关联项目的标签/笔记所有权仍未证明，改名继续拒绝。保留正文、历史周册、生命周期、别名和扩展字段；未知引用、编码异常、额外关键词、共享标签、子项目等保守拒绝。引用扫描仅覆盖仓库导入现态/历史，未进行真实库引用审计。原界面未改版；原改名输入框、可靠草稿和已有项目归属选择留待D3b11c。

新服务17项、独立反例9项及补充版本/行动同步2项合计28项通过；服务回归49项、原GTD界面回归6项、独立旧日志兼容1项通过。独立核查发现两类阻断（URI解码后的JSON引用绕过、声明/视图扩展字段被替换），已修复并反例验证，并补版本损坏/溢出拒绝，早期失败证据保留。初次服务测试负例污染共享测试对象已隔离；两项旧回归的局部元数据写入预期按新门禁改为拒绝/走原子命令。源码5改2增、64源、57旧源不变；旧reducers及历史命令apply不改。无需修改规则/Skill，无研究卡/mine。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b11c将生成项目的原Workspace/PEO/GTD改名入口接到统一元数据命令，复用原输入界面并补齐可靠草稿、结果查询和退出恢复；对已有项目显式选择与登记专用标签/笔记/关键词归属，不按同名猜测。随后补共享评论/标志/任务资格，再做真实host与旧writer交接、实验库限定试用。EVA cross relations按端点审计→固定ID关系事务→原chips/跳转/编辑器顺序，ontology-meta-hub/Meta独立排期；NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11b/review-v2.md、source-manifest-v3.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b11c：原编辑器接线与可靠共享草稿

source_status: confirmed_by_code
update_type: refines / reinforces

D3b11c已将生成项目的原Workspace改名窗口、PEO明确名称/编号入口和原GTD改名窗口接入统一元数据事务，三个入口按固定ID共用可靠三字段草稿；原评论保持原用途。 仅仓库候选，两库IO0、未部署。仅统一内核生成且专用载体归属已证明的项目可统一改名/改编号；已有明确关联项目仍需登记标签/笔记/关键词所有权。原视图与模态框复用；PEO新增明确入口，不再从备注猜身份。unknown只查询，不重发；确认未保存后显式重启新请求，确认保存后的较新输入保留carryover。现有draft编辑窗口遇权限丢失且未进入pending时会保守拒绝退出并保留输入；已关闭的草稿可只读恢复。锁仅同broker/process，未宣称跨进程；未持久化的突发进程死亡输入不保证恢复。真实host和旧writer交接未验证。

三字段草稿服务15项、新原界面5项与既有GTD界面6项合计11项、pending/unknown界面2项、旧原子服务19项通过；独立最终8项及确认期间新输入反例通过；原Workspace/PEO回归17项标志通过。修复确认期间新输入被覆盖、丢弃确认文案歧义及RPC字段顺序误判；早期工具环境、测试目录读取和确认时序失败证据均保留。源码7改3增、67源、57旧源不变；旧draft格式、核心/reducers/事务服务未修改。无需修改规则/Skill，无研究卡/mine。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b11d补已有明确关联项目的标签/笔记/关键词归属选择与登记，继续拒绝按同名猜测；同时明确限定试用的功能清单，再准备真实host与旧writer退出交接、实验库部署及用户试用。共享评论/标志/任务资格仍需分域补齐。EVA cross relations依次做原关系/端点审计、固定ID关系事务、原chips/跳转/编辑器；ontology-meta-hub/Meta独立排期，不以全部完成为限定试用前提。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11c/review-v1.md、source-manifest-v4.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b11d：已有项目资源归属登记

source_status: confirmed_by_code
update_type: refines / reinforces

D3b11d已为已有明确关联的项目接入原GTD资源归属登记入口：逐项选择项目、标签、笔记及GTD/Workspace/集合卡关键词，以固定ID登记可核验的归属证据。 仅仓库候选，两库IO0、未部署。登记只新增归属证据，不修改名称、编号、正文、评论、历史或原关键词配置；同名不代表归属，其他项目共用资源不可登记。当前资源变化后显示待重新确认，必须显式确认且携带旧记录摘要；损坏记录拒绝。已有项目整体改名仍未开放，需另行接入已登记资源的原子事务与引用审计。未知保存结果只查询；原视图和选择/确认窗口复用。真实host和旧writer退出交接尚未验证。

服务15项、原GTD登记界面5项、原编辑器/已有项目关联/保存恢复回归13项通过；独立领域13项、双项目排他1项、六选择阶段关闭6项、旧回放兼容1项通过。修复显式null归属表被当作缺省的问题，最终确认补齐项目及目标页ID。早期测试语法、共享测试样本被负例污染以及环境失败证据保留，最终采用service-v3及独立v2证据。源码5改1增、68源、62旧源不变；原插件输入、旧核心/reducer与草稿格式不变。无规则/Skill修改，无研究卡/mine。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b11e为已登记资源的已有项目补齐原子改名/改编号事务、引用审计和原编辑器资格接入；随后按TRIAL_SCOPE冻结限定操作清单与原生安装包，验证真实host、旧writer退出、实验库部署及用户试用。共享评论/标志/任务资格继续分域补齐。EVA cross relations按端点审计、固定ID关系事务、原chips/跳转/编辑器推进；ontology-meta-hub/Meta独立排期。NEWERA不访问。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11d/review-v1.md、source-manifest-v1.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b11e：已有项目原子名称编辑

source_status: confirmed_by_code
update_type: refines / reinforces

D3b11e已将已登记归属的已有项目统一名称/编号编辑接入原Workspace、PEO和GTD入口；显式字段、选定标签与三个视图关键词在同一事务中更新，固定ID保留，归属证据同步续链。 仅仓库候选，两库IO0、未部署。原笔记文件名、路径、正文、评论、历史及周观察标题保留；登记项目的原GTD笔记入口按固定路径打开。共享资源、额外别名、过期归属、重名或未审引用会拒绝保存并保留草稿；不承诺任意已有项目可改名。旧备注声明是历史文字，Main已接入消费者读取当前显式声明与固定ID。原PEO两类operational snapshot在仓库Main明确incomplete/不可用，尚未成为统一provider；完整AI export及外部旧解析消费者未验收，必须在native接管清单中处理。未知结果只查询；v1旧草稿/命令不变，adopted使用v2独立命令。

服务及兼容43项（新13、生成项目草稿15、归属登记15）、新原界面4项、既有编辑器/关联/保存恢复13项通过，原Main回归17项标志通过；独立领域11、Main消费者/草稿2、旧重放1通过。收紧首标题审计豁免并修复原PEO读取旧备注与关键词缓存滞后；早期计划V3 BLOCK、探针与独立测试失败均保留，最终采用V4 PASS和最终TAP。源码7改1增、69源、61旧源不变；原插件、核心、旧reducer/生成事务不变。无规则/Skill改动，无研究卡/mine。

EVA接入顺序：原关系数据/端点/依赖审计→固定ID关系事务→保留原chips/编辑器/跨视图跳转→改名改编号/缺失端点/过期版本验收→Meta独立接入。真实host/旧writer交接与限定范围实验试用另行验收，可先覆盖已通过的功能，不以EVA/Meta全部接入为前提。用户已明确要求补进计划；当前尚未实现。

下一步：D3b12冻结限定试用操作、原插件入口及读写/API接管清单，形成原生可安装候选包；补接或明确停用旧PEO operational snapshot及其他旧解析入口，演练旧writer队列退出、晚到回调、重启/草稿恢复，再按用户既有授权证明大千实验库路径与版本、备份/哈希后部署及原生验收。NEWERA不访问。共享评论/标志/任务资格继续分域补齐，EVA按端点审计→固定ID关系事务→原chips/编辑器/跳转，ontology-meta-hub/Meta另排。

证据：results/daqian-unified-core-20261006/p4/native-foundation/p4d-gtd-d3b11e/review-v1.md、source-manifest-v1.json、D3b7/ENTRY_AUDIT.md。FW-025及DQ-U01/02/03继续active。


## D3b12a：当前项目声明快照与接管边界

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12a已补齐仓库Main中PEO的Workspace operational snapshot：每次读取当前统一权威，以固定ID和显式声明返回项目，保持原接口格式、请求顺序和资格语义。 只完成仓库候选的读取接口接管，两库IO0，未部署。编号可重复可修改；旧备注不重写、不再决定此接口身份。未知/歧义/错误归属、非live权威返回incomplete空结果；暂停写权限也保守不可用。关闭成功或失败均使此前在途读取失效，含digest等待；新实例provider generation变化。Mandala目标快照仍不可用，完整有效上下文汇总/AI导出未验收。Core仍依赖fixture、仓库源和隔离浏览器；完整native genesis、ctx身份保留、native storage接入、实际旧writer退出、可安装包及真实host验收尚未完成。

新增快照浏览器9项、原项目编辑器回归4项通过，原Main17项检查通过且pageErrors为0；独立核查见review.md及implementation-proof.json。Main回归中的3次legacyWrites是故意触发并被拒绝的测试。源码仅2处修改（Main adapter和README），69源中67源不变；业务reducer、原插件、历史证据均不改。

 observation: 原Main快照曾明确不可用；当前仓库候选可按原消费者契约读取，关闭失败也必须作废此前的在途读取。
claim: 当前编号与名称由显式声明提供，固定ID不变；部分provider通过测试不等于完整聚合或native移交完成。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12a/review.md、HANDOFF_INVENTORY.md、implementation-proof.json。
update target: 本页及既有维护日志；FW-025、DQ-U01/02/03继续active。

下一步：D3b12b先做有范围的原生试用接管审计：按既有授权只读证明实验库实际路径、插件/已加载版本及来源哈希，列完整限定provider/writer清单。补保留ctx身份的native genesis及业务验证器、去除fixture/Playwright部署依赖、接native storage/真实host；再制作候选包、旧writer退出和恢复演练、备份哈希后部署实验库验收。NEWERA不访问。Mandala目标/EVA关系与Meta另排，不能把候选接口测试称为全内核已部署。


## D3b12b：真实来源持久化演练与原生接管边界

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12b已只读核实实验库路径与38个选定插件文件，并把真实来源采集接入N2持久化导入演练：7个既有ctx身份、15份原文件字节和3个缺省槽位可在独立Node进程中完整重开。 仅仓库副本导入演练，实验库只读、写入0，NEWERA访问0，未部署。原始编号、标题、正文及ID均保留，不使用fixture种子或Playwright执行导入。源库与演练vault/trust目录双向隔离；捕获digest、binding、seed哈希和身份均固定。只有read/source接口，未知尾部、宿主或存储锁、非genesis命令拒绝读取；初始化残留不自动覆盖。sourcePolicy表示历史采集来源，不能证明当前源未变。关联笔记和全业务genesis仍不完整，authorityActivated/migrationReady/writerQuiesced/readyForHandoff均false。磁盘启用清单不是内存loaded版本证明，真实旧writer退出尚未完成。

新增导入测试14项、原N1回归11项及N2回归全部通过；独立测试与核查见review.md/implementation-proof.json。真实采集原字节37563、7身份均保留，跨进程proof见real-import-reopen-v2.json。源码3增、85源中82旧源不变；旧Core、原插件、N1/N2算法及业务reducer不改。WRITER_HANDOFF记录了各owner具体队列/计时器/保存路径，未冒充完整writer排空证明。

 observation: 真实实验库选定代码38文件与冻结基线一致；真实采集可在隔离native存储跨进程重开，宿主lease也必须使读结果不可用。
claim: 原始身份与字节可持久保留；原生存储初始化成功不等于完整业务genesis、旧writer退出或authority激活。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12b/review.md、WRITER_HANDOFF.md、implementation-proof.json。
update target: 本页及既有维护日志；FW-025、DQ-U01/02/03继续active。

下一步：D3b12c补齐限定域的完整来源依赖与原生业务genesis/验证器，保留ctx身份，将已有reducer和原UI明确操作迁出fixture/仓库路径/Playwright依赖，接真实host及native store。随后证明实验库loaded版本、旧writer退出及草稿/未知结果恢复，再审包、备份哈希并按既有授权安装验收。NEWERA不访问；EVA/Meta和完整Mandala另排。


## D3b12c1：原生评论事务与完整业务接管边界

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c1已打通真实采集副本的第一条原生业务事务：按原ctx固定身份修改PEO评论、可靠保存，并在独立进程重开后保持7身份和原始来源不变。 仅仓库隔离演练，本轮实验库与NEWERA访问均0、未部署。只开放peo.comment，沿用原评论长度/去空白/清空规则；不从评论提取身份或声明，不开放元数据、创建、生命周期和GTD写入。PEO其他字段、Workspace和原始18槽位/15文件保留；4个Workspace笔记绑定列为未采集依赖。独立声明尚未导入，declarationStatus为unresolved，fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。历史confirmed回执不代表当前可写，host/store锁或未知尾部冻结现态，关闭只释放自己的broker锁。旧writer退出、真实UI/host和完整业务genesis仍待完成。

新业务测试13项、导入回归14项、原Workspace回归17项及独立反例8项通过，共52项；核查见review.md和implementation-proof.json。原评论处理结果与旧reducer逐项对照；跨进程proof见native-business-reopen-v2.json。新运行路径不加载fixture/bootstrap/Playwright/仓库session工具。源码4增、89源中85旧源不变。v1测试共享policy被负例污染已改为逐例复制；独立v1将对象键排序误判为身份变化，v2改为集合比较并finally关闭，保留失败及核查自有broker清理证据；无规则/Skill修改，无研究卡/mine。

observation: 保留真实来源ctx身份的PEO评论可写入N2存储并跨进程重放。
claim: 原生业务逐域移交需要独立genesis和语义重放；历史成功回执不等于现态可写，不能从普通评论恢复独立声明。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c1/review.md、implementation-proof.json。
update target: 本页及既有维护日志；FW-025继续active。

下一步：D3b12c2继续补完整限定域业务genesis：明确独立声明的可信导入/确认方式与来源依赖；将原有业务reducer和适配器从fixture/仓库执行环境迁出，接真实host与原界面。随后验证旧writer队列/计时器/草稿退出，审包、备份并按既有授权部署实验库。PEO评论链路只是首项，不代表完整Workspace/PEO/GTD已原生化；EVA/Meta和完整Mandala另排。NEWERA不访问。


## D3b12c2：旧声明的一次性导入与独立字段

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c2已接通独立声明的一次性原生导入：真实采集的3个明确声明按原ctx身份保存，两个001仍为两个项目；另4个缺失声明保持待确认。 仅仓库隔离演练，本轮实验库与NEWERA访问均0，未部署、未接真实界面。导入须显式提交经核对的声明提案，绑定capture/source/comment哈希、评论存在性、完整ref和当前版本；无歧义且当前评论未变才可导入。旧PEO评论全文、Workspace及原始来源保留，导入后普通评论修改不改变独立声明或身份。声明导入不等于项目资格/追踪准入。旧seed和评论日志兼容，capabilities另报当前支持操作；读取/打开不自动导入。新增命令写入后的日志不能用旧程序强行回放，必须保留并用兼容程序打开。完整业务初始化、原UI/host、旧writer退出仍未完成；fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

新声明测试10项、既有原生业务回归13项、原Workspace回归17项和独立反例7项通过，共47项；独立核查见review.md和implementation-proof.json。旧声明解析器纯函数经逐项对照；三个声明跨进程重开、原7ctx身份和来源不变，旧D3b12c1 journal兼容。源码3改2增、91源中86旧源不变；原seed/评论语义、N1/N2存储算法和原插件未变。无规则/Skill修改、无研究卡/mine。

observation: 显式导入绑定原ctx和来源证据，后续评论编辑不改变声明。
claim: 历史评论可以作为一次性迁移证据，但不能成为已迁字段的持续可写权威；声明与业务资格分开。旧genesis和历史能力记录不因新命令而改写。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c2/review.md、implementation-proof.json、parser-provenance.json。
update target: 本页和既有日志，FW-025继续active。

下一步：D3b12c3补齐限定域来源依赖及跨域业务初始化，把原有Workspace/PEO/GTD和集合卡/行动台的业务reducer与适配器从固定测试数据/仓库环境迁出；独立声明缺失者保留待确认，不能从标题猜测。随后接原界面host，验证旧writer队列/计时器/草稿安全退出，再审包备份并按已有授权部署实验库。NEWERA不访问；EVA/Meta与完整Mandala独立排期。


## D3b12c3：捕获业务初始化与显式GTD关联

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c3已实现9份捕获业务文档的原生初始化，并按原固定ID验证集合卡—行动台关系；新增显式GTD项目ID关联，仓库演练中3个ctx与3个GTD项目可可靠保存并跨进程重开。 仅仓库保留采集与隔离演练，本轮两实际库IO0、未部署。4张集合卡、1条行动台关系链、6条GTD记录/4个项目原样保留，不按同名或编号猜GTD关联。显式关联仅登记身份，不证明标签/笔记/关键词归属，不改原业务行。7处Workspace/Collection笔记绑定对应6条唯一路径，正文及Mandala周追踪未采集，GTD笔记依赖未知，3个optional缺省不替换为空对象；环境态和未知字段作为原始证据保留，尚未开放对应业务编辑。旧seed及评论/声明日志兼容；新增命令必须由兼容读者回放，禁止删记录迁就旧版本。fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false；原UI/host与旧writer退出待完成。

新域初始化测试10项、声明回归10项、评论业务回归13项及独立反例8项通过，共41项；核查见review.md/implementation-proof.json。原始来源与7ctx身份保留，三关联跨进程proof见domains-reopen.json。源码4改2增、93源中87旧源不变；既有声明测试仅按已审窄增更新当前能力列表，其历史coverage断言不改。未改变原插件/N1/N2存储算法，无规则/Skill修改、无研究卡/mine。

observation: 捕获原文可初始化原生域，并由已有节点引用验证关系；GTD关联须显式选择双方固定ID。
claim: 完整原文保留不等于全域可编辑；身份关联不证明标签/笔记归属，未采集依赖必须显式列缺口。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c3/review.md、implementation-proof.json、domains-reopen.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c4按限定试用范围补齐缺失来源依赖，先明确需要采集的关联笔记和周追踪文件；然后继续将业务reducer/资格服务接到原生数据，区分环境态与业务态并接原UI host。GTD身份关联不等于资源归属；未关联项目保持待选择。验证旧writer队列/计时器/草稿退出后，再审包备份并按已有授权部署实验库。NEWERA不访问；EVA/Meta及完整Mandala另排。


## D3b12c4：直接依赖补采与原生显式导入

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c4已补齐6份直接绑定笔记和Mandala周追踪来源，共7文件9100字节；按独立digest显式导入原生演练，原7ctx、9域文档及3条GTD身份关联保持不变，跨进程重开一致。 仅实验库限定只读补采，binding及18个旧来源两轮hash/存在性一致；无实际库写入，NEWERA访问0，未部署。7绑定对应6笔记，补充包保留原字节、缺省和未知字段；读取错误不冒充缺失，路径别名/越界/大小写碰撞拒绝。补充导入独立state.dependencies，不改变旧seed、capture、domains snapshot或历史coverage。两轮一致不是原子快照，原来源hash不证明以后仍未变。周追踪保留为证据，资格未评估；GTD笔记/正文链接及完整依赖闭包未覆盖。未开放笔记/周追踪编辑、全域业务、原UI/host或旧writer退出；fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff仍false。

新依赖测试8项、域回归10项、声明回归10项、采集回归11项、旧导入回归14项通过，共53项生产者测试，加7项独立反例共60项通过；核查见review.md/implementation-proof.json。source-manifest记录95源，6改2增、87旧源不变；两个旧测试仅更新当前capabilities断言，历史seed/replay不改。初次preflight语法/路径错误已修复并保留失败证据，v2采集4项通过；独立审查发现Windows设备别名缺口，已窄修regex并通过4项定向复验；回归生成的旧路径proof已另存本批并恢复到前轮原hash。N2算法/原插件不改，无规则/Skill/研究卡/mine修改。

observation: 原18来源未漂移时可窄范围补采直接依赖，原字节通过显式事务可靠保存。
claim: 直接依赖补齐不等于全依赖闭包，周追踪原文不等于资格判定；补充证据不得静默改写历史seed和原域快照。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c4/review.md、implementation-proof.json、dependencies-reopen.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c5继续将原有资格服务和业务reducer接到原生数据，明确周追踪节点到ctx的原ID关系以及停止追踪规则；再接原Workspace/PEO/GTD界面host并验证旧writer队列/计时器/草稿安全退出。限定直接依赖采集不等于全依赖闭包；GTD笔记及EVA/Meta/完整Mandala另排。包审查与回滚准备完成后按既有授权部署实验库，NEWERA不访问。


## D3b12c5：原生资格与追踪事务

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c5已将既有资格语义和开始/停止/恢复追踪接入原生内核：3个已有项目资格可读，停止目标后2个、恢复后3个；固定ID、原数据和GTD关联保持，跨进程重开一致。 仅仓库演练，本轮两实际库IO0、未部署、原界面未改。资格以完整Workspace载体、已导入非9xx声明、active生命周期及active追踪共同判定，目标桶/计划行/名册/GTD关联单独存在均不授予资格。缺失来源返回unavailable，版本/来源/引用/状态歧义拒绝而不修源；旧alias不自动合并。明确tracking.set才创建native tracking工作副本，保留原capture/dependencies/domains历史快照和正文；只更新目标节点、上层计划标题/时间及当周名册，未知字段/其他项目/历史周保留。采用既有UTC-v1演练日历，真实host本地moment日历适配待做。actionWriteAuthorized/heldGrantAttached/realHostAttached及fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

原生追踪10项、原追踪回归17项、依赖回归8项、声明回归10项、域回归10项通过，共55项生产者测试，加独立9项共64项通过；独立核查及反例见review.md/implementation-proof.json。直接原setter对照覆盖空标题回退、节点清空与名册历史时间回退，旧setter会trim已有计划非目标正文并补空串的副作用已显式收窄，已有plan仅标题/更新时间变更，正文空白与缺失性保留，BLOCK-v1及修正证据留存；UTC跨时区/跨年稳定；资格与原snapshot候选ID对照一致。源码5改3增98源，90旧源不变；2个normalizer保留冻结原来源hash，生产路径无VM/bootstrap/fixture，旧原插件/N2算法不改。备份启动曾因review格式断言失败，新文件草稿误先生成但无旧源码写入，移入results后完成正式备份再生成，详见backup-sequencing-note；旧回归proof已定向写本批，无历史proof覆盖。无规则/Skill/研究卡/mine修改。

observation: 已有资格与追踪规则可通过固定引用和单一native revision迁入，原setter细节须直接对照。
claim: 资格须组合载体/声明/lifecycle/追踪证据，不能由名册或GTD关联推定；原setter与测试wrapper可能在空值处理上不同，迁移须对照原方法。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c5/review.md、implementation-proof.json、tracking-reopen.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c6继续将原Workspace/PEO可靠创建、元数据和生命周期业务接入native store，并复用原接口准备UI host；按已保留数据逐项检验完整引用、原业务语义和防丢。资格证据不等于held行动写入许可；GTD全业务、真实host日历/loaded版本、旧writer队列/草稿退出仍待补齐，完成审包和回滚准备后按已有授权部署实验库。NEWERA不访问；EVA/Meta/完整Mandala另排。


## D3b12c6：原生新项目创建与状态事务

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c6已接通仓库原生新项目的创建、信息修改和Kill/恢复，并与既有追踪/资格服务闭环：创建后8个身份，追踪后4个有效项目，Kill后3个、恢复后4个；改名/改编号保留固定ID，跨进程重开一致。 仅仓库新项目业务演练，本轮两实际库IO0、未部署、原界面未改。仅新建且未关联GTD/NAW的native项目可修改元数据/生命周期；旧imported项目和共享项目均明确拒绝，等待ownership接入。创建保留原Workspace条目结构、备注原文、PEO重要程度规则；声明独立字段不写评论。ctx使用scope/vault/request派生UUIDv8，创建来源由资格/GTD消费者验证；保留旧7身份和capture/域/依赖快照，历史seed覆盖不改。创建不自动追踪、不授予行动写入资格、不创建GTD/Collection资源。元数据仅标题/声明/重要程度及既有追踪上层计划标题时间；Kill/恢复只改目标生命周期，保留未知字段及其他行。真实host日历、UI和输入草稿/旧writer退出均待做，readyForHandoff/fullBusinessGenesis/originalUIAttached/authorityActivated/writerQuiesced保持false。

项目业务13项、原Workspace/PEO回归38项、追踪回归10项、声明回归10项、域回归10项，共81项生产者测试，加独立9项共90项通过；独立测试/核查与重开见review.md/implementation-proof.json。直接原Workspace创建及PEO重要程度/生命周期oracle对照；显式证明旧lifecycle全表normalize会trim/drop unknown，native只更新目标并保留原始内容。固定ID、重复001、原文/历史保留、来源伪造/冲突/共享拒绝、CAS/重试、host lease及unknown均有证据。早期预检time反例未改变真实结果，测试修正为已有tracking plan后核验时间影响resultHash，前轮失败tap保留。源码7改2增100源，91旧源不变；生产路径无VM/bootstrap/fixture，N1/N2和旧插件算法不改。旧proof定向输出本批且原hash保持；无规则/Skill/研究卡/mine修改。

observation: 新建项目的固定身份、创建来源和原业务规则已能在单一native事务保存；与旧/共享项目的ownership必须区别。
claim: 原始规则可复用为native最小delta；声明消费者必须验证创建来源；新建成功不等于追踪就绪，关联共享资源后不能继续使用单域修改路径。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c6/review.md、implementation-proof.json、projects-reopen.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c7补齐既有项目及共享项目的ownership证据和元数据/生命周期事务，再接原Workspace/PEO界面host及可靠输入草稿，验证loaded版本/真实日历和旧writer退出。当前native新项目API不是全量试用入口；GTD完整业务/行动写入许可与EVA/Meta/完整Mandala另待接入。完成限定试用审包与回退准备后按既有授权部署实验库；NEWERA不访问。


## D3b12c7：共享资源归属与PEO状态事务

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c7已接通原生内核中既有/共享项目的显式资源归属登记、PEO重要程度修改和Kill/恢复：三个项目按固定身份登记，两个001不合并；有效项目3→2→3，持久化与跨进程重开一致。 本批两实际库IO0、未部署、原界面未改。登记需显式GTD项目/标签/三组关键词，验证独占页签、原声明/单项目组证据、NAW双向关联和不可变身份；登记不修改载体。重要程度和生命周期仅更新目标PEO字段；Kill不是GTD归档，不停止追踪、不删除行动卡关系。共享改名仍不可用：当前依赖包缺GTD项目笔记内容或已确认不存在证据，不能保证改名后笔记定位。哈希是事务一致性证据，不是授权签名。原C6新建项目与共享操作边界保留；actionWriteAuthorized、readyForHandoff、fullBusinessGenesis、originalUIAttached、authorityActivated、writerQuiesced保持false。

既有项目13项、C6项目/追踪回归23项、声明/域回归20项、原Workspace/PEO集成17项，共73项生产者测试；独立10项，共83项通过。直接原PEO方法对照，覆盖重复编号、显式ID、未知字段/原文/历史保留、双向NAW拒绝、来源伪造/资源共享/别名/陈旧登记、CAS/重试/lease/unknown及新进程重开。源码6改4增104源，94旧源不变；C6旧日志snapshot/qualification不变，历史proof哈希保留。独立核查发现并修复了null登记表、外来登记证据缺字段和负生命周期版本三项拒绝边界，失败证据保留，最终回归通过。无规则/Skill/研究卡/mine修改。

observation: 三个既有项目可通过显式资源ID登记后修改PEO状态，当前捕获包尚不能证明共享改名所需GTD笔记依赖。
claim: 固定身份、资源归属、操作资格分别验证；PEO Kill和GTD归档必须保留原语义区别；缺失笔记证据时不能扩大到改名。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c7/review.md、implementation-proof.json、existing-projects-reopen.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c8先对实验库GTD项目笔记定位/引用作有界只读取证，补齐内容或不存在证据，再接共享元数据改名。随后接原Workspace/PEO界面host、可靠输入草稿、真实日历/loaded版本与旧writer退出；完成限定试用审包和回退后按既有授权部署实验库。NEWERA不访问。GTD完整业务/行动写入许可及EVA/Meta/完整Mandala另待接入。


## D3b12c8：GTD候选笔记证据与原生导入

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c8已将三个GTD项目的候选笔记正文（279字节）和另一项目的确切路径缺失记录，经过只读双轮核对后可靠导入原生内核；原文、typed项目ID、路径角色与旧数据保持，跨进程重开一致。 本批实验库仅只读采集：正式60次读取/30唯一路径，初查5次；运行库写入0，NEWERA IO0，未部署、原界面未改。候选笔记不等于已确认身份，确切路径缺失不等于全库没有同名笔记。原GTD按名称metadataCache和ctime回退尚待真实host验证；当前包不模拟全库解析、不追正文链接。state.gtdNotes独立保存，不改历史domains/dependencies/PEO/Workspace/ownership。canRename、noteIdentityAdopted、fullReferenceClosure、businessEditingReady和原authority/UI/writer/移交标志保持false。

GTD笔记11项、C7既有项目13项、声明/域回归20项、原依赖回归8项，共52项生产者测试；独立10项，共62项通过。覆盖26来源锚点、重复路径/角色、typedID、缺失与读取错误区分、unsafe名称/绑定/大小写冲突、UTF8/base64/hash/预算/来源漂移、导入最小范围、幂等/revision/lease/unknown及新进程重开；旧C7snapshot/qualification/ownership不变。源码5改2增106源，99旧源不变；历史proof哈希保留。初轮测试筛选意外匹配依赖正式包的测试，包尚未采集导致ENOENT；修正筛选并完成采集后最终通过，保留初轮证据。独立复核补出了基础路径大小写别名、依赖路径大小写别名、合并白名单超限三项拒绝反例，统一到采集与回放共用的纯校验并复测。无规则/Skill/研究卡/mine修改。

observation: 原GTD同时使用同目录项目名路径、metadataCache名称查找和显式路径/ctime回退，三个实际样本存在同目录笔记。
claim: 候选路径、确认身份和全局引用闭包是不同证据；缺失必须限于精确路径。历史导入快照保持不可变，业务改名需要独立当前域及依赖消费者，不能修改快照冒充事务完成。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c8/review.md、capture-summary.json、gtd-notes-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c9建立原生当前业务域变更层，保留历史捕获快照，再接共享项目元数据事务及消费者。笔记采用显式确认的路径与固定项目身份关联，保留正文和路径；原GTD项目打开入口须使用该绑定，不能继续只按新名字找文件。补引用/别名歧义、原Workspace/PEO界面与可靠草稿、真实日历/loaded版本和旧writer退出后，再按既有授权准备实验库试用部署。NEWERA不访问。


## D3b12c9：当前业务域与共享项目改名事务

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c9补入共享项目笔记显式接纳和改名改编号事务：固定ctx身份、笔记路径与正文不变，当前Workspace/Collection/GTD/关键词/行动台标签原子更新，历史捕获快照保持。 仅仓库原生业务事务，两个实际库IO0、未部署、原界面未改。新增readCurrentDomains/readProjectNote给后续host消费；当前展示数据与历史证据分开。重复编号允许，完整名称/声明冲突、笔记外来占用、无来源声明、过期归属及异常嵌套结构拒绝。canRename仍不代表运行界面可用；原UI/authority/writerQuiesced/readyForHandoff保持false。

生产者80项、独立9项，共89项通过；计数来自冻结证据。源码8改3增，共109源，98旧源未变。验证三样本、两001、改名再改名/无变化、固定笔记、typed行动归属、标签和NAW更新、来源/归属/当前域异常、幂等/lease/unknown/新进程恢复与旧版本重放。原评论/ontology/历史追踪保留，无规则/Skill/研究卡/mine修改。

observation: 三个显式归属样本的现名缓存分布在Workspace/Collection/GTD/tag/keyword/NAW，笔记旧路径仍可稳定使用。
claim: 固定身份与路径无需随展示名称重写；改名须同一事务更新被证明归属的当前缓存并保留来源和历史证据，原视图稍后消费当前层。不能将仓库能力等同运行移交。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c9/review.md、shared-metadata-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c10接原Workspace/PEO/GTD host的当前域读取与固定笔记打开，保留原UI交互，补可靠草稿恢复和旧writer退出证据；全库引用/别名歧义、真实日历与loaded版本核查后，再按已有授权准备实验库试用部署。NEWERA不访问。


## D3b12c10：原Workspace/PEO/GTD只读宿主

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c10已在仓库隔离浏览器宿主中接通原Workspace/PEO/GTD的只读当前数据，复用原界面与样式，固定项目身份打开已接纳笔记。 两个实际库IO0、未部署。原界面显示当前名称/编号/标签；旧备注等历史正文保持。编辑入口在输入前拒绝，旧写入sink拒绝；宿主校验身份/revision，关闭排空迟到刷新及笔记请求。同realm重复宿主拒绝。原界面真实接入、authorityActivated/writerQuiesced/readyForHandoff均false；此轮不能作为可编辑试用包。

生产者8项、独立11项，共19项通过；浏览器15项检查通过、0页面错误。源码1改5增，共114源，108旧源未变；固定三笔记、Workspace刷新滚动稳定、跨host隔离、revision/关闭迟到/刷新排空/summary typed身份均验证。无规则/Skill/研究卡/mine修改。

observation: 原视图可直接消费同一原生快照的当前投影；渲染器确定性缺省值仅作展示，旧名称href需由固定身份路由接管。
claim: 可复用原界面并更换数据宿主，不必重造界面。只读成功不代表写入、草稿或真实旧writer已退出；投影能力和运行移交必须分开证明。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c10/review.md、native-read-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c11接原Workspace/PEO/GTD的写入控件与可靠草稿恢复，随后验证旧writer安全退出及真实loaded版本；完成真实宿主核查后，按既有授权准备实验库部署试用。NEWERA不访问。


## D3b12c11：原PEO评论框与持久草稿

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c11补入原PEO评论框与原生持久草稿：逐次输入保存草稿，关闭/取消保留未提交文本，明确保存或清空才更新正式评论，恢复按固定ref。 仅仓库隔离浏览器中的原PEO CommentModal与受限宿主连接测试；未把完整C10只读主界面切换为可写，Workspace/GTD编辑仍待。两实际库IO0、未部署。已确认草稿可跨进程恢复，未确认按键不保证强退恢复；旧writer退出/真实加载版本未验证。原界面真实接入、authorityActivated/writerQuiesced/readyForHandoff均false。

生产者8项、独立14项，共22项通过；浏览器10项检查通过、0页面错误。源码3改4增，共118源，111旧源未变。草稿版本CAS、评论基线冲突、隐式清空不删除、回执丢失原请求重查、保存期间新输入保留、关闭排空和新进程恢复均验证；C9旧journal重放hash不变。无规则/Skill/研究卡/mine修改。

observation: 原PEO onClose合成保存，需要在调用前取消该行为；异步回执和较新输入必须与已确认保存意图区分。
claim: 草稿与正式评论分开提交，可保留原编辑框和隐式关闭习惯；持久草稿需固定身份、版本与业务基线，未知回执必须先查询原请求。隔离modal验证不等于完整主界面或真实旧writer移交。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c11/review.md、comment-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c12将已验证PEO评论/草稿服务接进完整C10原主视图宿主，补刷新与恢复入口稳定性；再逐项接Workspace改名/创建和GTD编辑，随后旧writer安全退出、真实loaded版本及实验库试用部署。NEWERA不访问。


## D3b12c12：完整原主视图评论与恢复

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c12把C11评论与持久草稿服务接入完整原Workspace/PEO主视图：原PEO评论按钮按固定ref编辑，恢复入口绑定草稿原项目，确认后刷新原评论预览。 仅仓库浏览器挂载完整原视图，两个实际库IO0、未部署。Workspace其他写入/GTD编辑/真实旧writer退出仍待。仅登记的评论modal开放，其他旧写入入口拒绝；主宿主固定身份校验、分阶段关闭和失败重试不等于真实运行移交。原界面真实接入、authorityActivated/writerQuiesced/readyForHandoff均false。

生产者8项、独立9项，共17项通过；浏览器13项检查通过、0页面错误。源码1改4增，共122源，117旧源未变。原评论按钮、分组切换后固定项目恢复、原评论预览更新、Workspace滚动稳定、dirty-close失败保留/重试、同realm重挂载和新页面/进程恢复均验证。C9历史journal重放hash不变。无规则/Skill/研究卡/mine修改。

observation: 完整原视图有自身modal门禁、刷新队列及关闭状态；评论草稿必须在视图关闭前确认，恢复目标不能来自当前选中分组；持久化可能重排ref字段顺序，身份比较应按字段内容而非序列化顺序。
claim: 复用原界面需同时接通固定身份路由、受限modal能力和分阶段关闭；已关闭视图不等于后台已关闭。恢复入口须携带草稿原项目身份，分组切换和重挂载不能改变目标。仓库完整视图验证仍不代表真实writer移交。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c12/review.md、main-comments-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c13接原Workspace项目名称/编号编辑与可靠草稿，沿用固定身份和已验证原生共享改名事务；再补完整创建和GTD编辑。真实旧writer安全退出、loaded版本核查完成后再部署实验库试用。NEWERA不访问。


## D3b12c13：原Workspace名称编号编辑与草稿恢复

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c13接入原Workspace重命名入口和原TextModal三字段编辑，按固定身份保存项目名称/编号/显示标签；隐式关闭保留草稿，显式保存复用C9共享事务并原子结束草稿。C12评论能力保留。 仅仓库浏览器验证完整原视图，两实际库IO0、未部署。完整创建/GTD编辑/真实旧writer退出仍待。逐事件草稿加全日志重放耗时明显，输入性能尚未达试用验收。未满足资格与ownership的业务保存拒绝并保留草稿；其他旧写入继续拒绝。originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

生产者10项、独立16项，共26项通过；旧评论回归16项通过；浏览器14项检查通过、0页面错误。源码3改6增，共128源，119旧源未变。原重命名入口、三字段恢复、固定身份共享改名、笔记路径保留、关闭失败重试、重挂载/新页面/进程恢复及C12评论回归均验证。C9历史journal重放hash不变。无规则/Skill/研究卡/mine修改。

observation: 原单值文本框的按钮及Enter都有旧提交路径；三字段编辑必须同时替换输入监听与显式提交，隐式关闭只保存原文。
claim: 元数据编辑应复用关联事务，以固定身份/业务base校验和草稿终态同事务提交；草稿分域防止评论与元数据混读。恢复不写业务，原文不因校验失败丢弃。仓库验证不代表真实writer移交。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c13/review.md、main-metadata-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c14补原主界面完整创建流程，再接完整GTD编辑。保持固定身份、原界面设计、可靠草稿和原子关联事务；试用前补草稿输入防抖/批量落盘性能验证，关闭仍强制flush；真实旧writer安全退出及loaded版本核查完成后再部署实验库。NEWERA不访问。


## D3b12c14：原Workspace输入合并与关闭确认

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c14完成原Workspace三字段输入的草稿合并保存前置修复：180ms停顿合并，in-flight期间只保留dirty，不逐键排任务；关闭/显式保存立即flush并确认。固定身份、原输入框和原持久事务不改。 仅仓库原WM TextModal受控transport验证，两实际库IO0、未部署。减少重复读取不等于优化单次native journal重放；本轮无新的journal端到端性能结论。完整创建/GTD编辑/真实writer退出仍待，originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

生产者8项、独立8项，共16项通过；旧UI/业务回归42项通过；原modal受控transport浏览器9项通过、0页面错误。相同60input对照reads60→1、puts均1，最新原文一致。源码2改2增，共130源，126旧源未变，native后端全未改。延迟未到关闭flush、失败重试、unknown原请求、新输入、关闭后timer均覆盖。无规则/Skill/研究卡/mine修改。

observation: 每个input排一个异步保存，即使最终只写一份相同原文，也会引发多次昂贵读取；合并应覆盖timer与in-flight期间。
claim: dirty合并与关闭强制flush必须成对设计；commit期间新输入保留为新草稿。性能证据区分请求数、journal延迟和真实运行响应，不由受控transport推断实际库已可试用。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c14/review.md、coalescing-browser.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c15恢复完整创建：先规划原子Workspace/PEO、Collection专用载体、GTD/标签关键词、追踪、行动台成员及新笔记provenance，再接原主界面。继续GTD编辑与native journal输入响应性验证；真实旧writer退出/loaded版本通过后才部署实验库。NEWERA不访问。


## D3b12c15：原Workspace完整创建

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c15完成原Workspace创建入口接统一事务：固定身份、根条目/PEO重要度、Workspace与Collection专用页签、GTD项目/标签关键词、追踪、行动台成员、新笔记及所有权一次创建；关闭保留三字段草稿。创建后改名和评论沿用已有服务。 仅仓库候选与新journal/原WM、PEO浏览器验证，两实际库IO0、未部署。完整GTD编辑及真实writer退出尚未完成；originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。

生产者10项、独立10项，共20项通过；既有UI/业务回归135项通过；原完整WM/PEO浏览器12项通过、0页面错误，新journal fresh-process reopen一致。源码9改6增，共136源，121旧源未变。原C9捕获和旧journal保留，生成来源单独验证。

observation: 原创建动作包含专用载体、关键词、追踪和笔记，不只是根条目。
claim: 完整创建必须在一个事务中建立这些关联，生成来源与原capture区分；后续重命名沿固定ID操作，笔记路径保留。提交期间新输入应转为同一项目的修改草稿，避免二次创建。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c15/review.md、main-creation-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c16推进完整GTD原界面编辑接统一服务，先盘点新增/编辑/完成/归档等写入口及依赖，再验证原事务行为；同时保留原UI。真实旧writer退出与loaded版本验收完成后才部署实验库；NEWERA不访问。


## D3b12c16：原GTD任务闭环

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c16接通原GTD工作篮/项目根行动创建、任务内容编辑、日程/截止、完成确认与恢复，共7个操作。沿原UI和固定ID，草稿先保存、明确确认才改业务；未知结果重试同请求；项目共享改名后任务绑定保持。 仅仓库候选、新journal与原GTD浏览器验证，两实际库IO0、未部署。完整GTD评论/标志/层级/项目归档及真实writer退出仍待；originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。数字0仅后端支持，原engine会改写0，含此ID的原UI挂载会拒绝且不写业务。

生产者10项、独立20项，共30项通过；既有UI/业务回归41项通过；原GTD浏览器12项通过、0页面错误，新journal fresh-process reopen一致。源码6改7增，共143源，130旧源未变。原C9捕获和旧journal保留，生成来源单独验证。

observation: 原GTD的任务操作可沿用原界面，但原代码依赖旧载体读写。
claim: 原任务入口接纯原生事务；任务绑定固定projectId，共享改名只更新显示标题。单字段草稿保留原文，创建后的新输入转同任务修改，未知结果复用原请求。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c16/review.md、gtd-task-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c17推进原GTD评论/标志及后续层级、项目归档的统一事务，先盘点原入口与跨视图依赖，分批接入并保留原UI。试用前还需测量并改善原生日志回放造成的交互延迟；真实旧writer退出与loaded版本验收完成后才部署实验库；NEWERA不访问。


## D3b12c17：原GTD评论和标志

source_status: confirmed_by_code
update_type: refines / reinforces

D3b12c17在原GTD评论框与原标志按钮上接入评论保存/清空、星标、专注及淡化三个标志。共用C16固定ID/host/草稿/回执，隐式关闭保留原文，明确保存才更新；清空已有评论须确认，标志重试按显式值设置。项目和任务均可使用，项目不注册task binding。 仅仓库候选、新journal与原GTD浏览器验证，两实际库IO0、未部署。完整GTD层级/项目归档等及真实writer退出仍待；originalUIAttached/authorityActivated/writerQuiesced/readyForHandoff均false。数字0仅后端支持，原UI仍拒绝改写0的捕获；日志回放延迟待试用前评估。

生产者11项、独立21项，共32项通过；既有UI/业务回归18项通过；原GTD浏览器12项通过、0页面错误，新journal fresh-process reopen一致。源码8改3增，共146源，135旧源未变。原C9捕获和旧journal保留，生成来源单独验证。

observation: 原评论框隐式关闭会返回编辑文字，原标志入口采用toggle。
claim: 评论关闭先持久化草稿并阻断旧自动保存；清空取消保留原文，明确保存才提交。标志传显式目标值并重试同请求，不重复toggle。固定项目身份与任务binding各守原边界。
source: results/daqian-unified-core-20261006/p4/native-foundation/p4d-d3b12c17/review.md、gtd-workflow-reopen.json、implementation-proof.json。
update target: 本页及既有日志，FW-025继续active。

下一步：D3b12c18接原GTD层级/相对创建等后续操作，先核定原语义及固定身份、跨项目归属、循环拒绝；项目归档需共享事务另行推进。试用前测量改善原生日志回放延迟，真实旧writer退出及loaded验收完成后才部署实验库；NEWERA不访问。
