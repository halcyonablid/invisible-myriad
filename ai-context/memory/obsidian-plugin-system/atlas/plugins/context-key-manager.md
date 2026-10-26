# Plugin: context-key-manager（主键管理中心）

status: active
updated: 2026-10-20
source_status:
- 已部署代码（NEWERA runtime 及各根；C3 部署回执行摘要 5ebbf4d5…）：confirmed_by_code
- 原生验收（005A 改名、036G001 接管与改名、v6 升级、012F 首次替换）：confirmed_by_user
- 未接管的部分：unknown / planned

## 一句话

主键管理中心是**有效操作上下文主键的身份与命名宿体**。它持有永久 contextId、正式名称、主体（subject）与各插件的绑定关系（binding）。名称和绑定的变更由它协调六个参与插件共同完成。卡片、条目、任务、评论等**内容数据不进中心**，仍归各插件所有。

## 中心持有什么、不持有什么（2026-10-20）

| 层面 | 当前权威 | 说明 |
|---|---|---|
| 身份登记（contextId、subject、bindings 清单） | **中心** | 存储在 `.obsidian/plugins/context-key-manager/identity-v3/`（current、mirror 双槽，pending WAL，recovery 归档上限 4 份，外加 `identity-v3-presence.json`） |
| 正式名称（改名） | **中心**：限已接管（naming.authority=center）的对象 | C2 起，改名只能在中心的“名称与同步”中进行，六方按计划写入。PEO 旧改名入口和目标改名入口对中心维护的对象一律拒绝，并引导到中心。未接管的对象（例如 036J）仍走原入口。 |
| 绑定（主键挂在哪个 Tab 或标签上） | **部分**：中心记录全部绑定，但只有 Collection 单来源的“首次替换”可以由中心变更（C3 窄切片） | 新增、解除、再次替换，以及 Workspace/GTD 的绑定变更、目标域、多来源，都还没接（Y1 及后续批次） |
| 新建项目/目标（创建） | **未接**（P2-E） | PEO 创建协调器逐个插件写入，不写中心存储；创建计划未完成时，会拦住涉及该对象的绑定操作 |
| 追踪（停止/恢复、管理追踪） | **未接**（P2-D） | 仍由 Mandala 和原入口负责 |
| 内容数据 | **永远不在中心** | 由 Collection、GTD、Workspace、Mandala、PEO 各自的数据文件承载 |

## 存储版本与升级（只能由用户显式触发，绝不自动升级）

| 帧版本 | state schema | 含义 |
|---|---|---|
| v3 | 1 | 旧只读登记 |
| v4 | 2 | C1/C2 中心命名权威（claim、rename、pending、verified） |
| v6 | 4 | C3：在 v4 基础上加 `binding` 区 `{format, pending, results, anchors}`；format 1 只支持“首次替换” |

- **v4→v6**：在中心总入口点“预览升级存储（启用绑定管理）→ 确认”。旧版中心读到 v6 会报 `unsupported-frame-version`，参与方的保存保护也随之失效。
- **回退**：只有“升级后中心没有任何写入”时才能回退；否则只能向前修复。
- **升级前备份**：先备份 identity-v3 目录和 presence。
- **NEWERA 现状**：已于 2026-10-20 由用户亲手升级到 v6 / format 1。
- **大千**：原先没有中心存储。2026-10-20 用户在大千通过“核对并登记身份”初始化了存储（v4），并登记了 036R（原入口管理）；随后在总入口亲手升级到 v6 / format 1。这是“从零登记 → 升级”路径的原生证据（confirmed_by_user）。
- **规划中的 format 2**：Y1，详见 PLAN。新代码可读 1 和 2、只写 2；1→2 同样是显式迁移命令。

## 对外契约（confirmed_by_code）

| 契约 | 提供方 → 使用方 | 用途 |
|---|---|---|
| `getNamingProjectionAuthorityV1()` | 中心 → 五个参与插件 | 参与方的写入器在每次保存前取快照（版本 1 对应 v3/v4 帧；版本 3 对应 v6 帧，带 `binding`；见 authority.cjs:56），用来核验对象归属、有没有未完成的同步、格式版本 |
| `contextIdentityApi`（`listIdentitiesV1` / `getIdentityV1` / `resolveIdentityReferenceV1` / `resolveLegacyIdentityV1` / `refreshIdentitiesV1` / `subscribeInvalidationV1`） | 中心 → 读方 | 只读的已登记身份查询（`authority:'registered-identity-only'`） |
| `getCenterNamingParticipantV1()` | PEO、Mandala、Workspace、GTD、Collection → 中心 | C2 命名参与方：evidence、prepare、inspect、apply；另有 `bindingCompatibility` 兼容证明，以及 PEO 的 `bindingPending`（旧 job 和创建计划的拦截） |
| `getCenterBindingParticipantV1()` | Collection → 中心 | C3 绑定写入器，只能由中心私有签发的 permit 驱动；status.operation 为 `same-source-project-first-replace` |
| `getCenterNamingConsumerV1` / `createEngineCenterPublisherV1` | GTD 等消费者内部 | 中心改名落盘后，引擎负责刷新 |
| 事件 `context-key-manager:naming-settled-v1`（window） | 中心 → 消费者 | 命名或绑定作业连同其锁收束之后派发。GTD 据此从已提交的文件刷新引擎内存，无需重启 |
| 业务文件中的回执字段 | 中心协调 → owner 文件 | `centerNamingProjectionV1`：C2 改名回执，写在 Collection、Workspace、GTD 的关键词文件以及 PEO、Mandala 数据中。`centerBindingReceiptsV1`：C3 绑定回执，只写在 Collection 关键词文件中。普通保存不得改动这两类回执。 |

## 关键机制（只写长期规则，实现细节见 change-records）

- **六方协商**：每条中心命令都会重新核对六个插件的模块路径、实现指纹和代际，任一方变化即拒绝；状态码形如 `binding-factory-changed`、`binding-writer-changed`。
- **门控**：host 的 `BINDING_SERVICE_INSTALLED` 只有部署变体为 true；仓库候选为 false。升级入口与 BindingService 共用同一个门控。
- **绑定事务**：preview 令牌 → begin（WAL）→ Collection 写入器备份并写入 → finish。中途中断时可以续跑；只有在 before 态才能取消。pending 期间，全库的保存与改名暂停。
- **单一权威**：同一个字段在切换点之后只有一个写入方，旧入口要么转调中心，要么拒绝。中心只协调名称与绑定，内容写入仍由 owner 写入器执行，写入器每次写前都向中心核验。

## 原生验收证据（confirmed_by_user）

- 2026-10-19：NEWERA 项目 005A 在中心改名，中心与各插件显示一致；036G001 接管后改名两次，不重启即生效。
- 2026-10-20：用户亲手把存储升级到 v6；012F 首次 Collection 替换成功，点击主键跳到新 Tab，原 Tab 和条目保留。关闭后重开核对一致：中心绑定为 tab_mvgdj1jrkjitd，Workspace 和 GTD 的绑定未变，六方均已就绪。
- 2026-10-20：大千插件加载正常；从零完成登记与升级（v6 / format 1），current 与 mirror 一致，presence 已写入。

## 已知限制与后续

- 替换只改“主键 → Tab”的映射，**不迁移 Tab 内容**。原 Tab 保留原名，容易误解。Y1 会给已不再绑定的 Tab 加标注。
- 再次替换、新增、解除、Workspace/GTD 绑定、目标域、多来源、追踪（P2-D）、创建（P2-E）、P4 尚未完成。顺序以 `state/PLAN.md` 为准。
- 对应的未决问题：[CKM-U01～U03](../unknowns-register.md)、[FW-026](../../framework/question-map.md)。历史过程见 [统一主键管理](../knowledge/unified-context-key-management.md)。

## 2026-10-21 P2-E：新建项目/目标完成后自动登记并由中心维护名称

status: deployed（四根 12/12，rowsDigest 19ac3200…）；native: 大千 accepted / NEWERA pending；source_status: confirmed_by_code + confirmed_by_user（大千）。

- **新增对外契约**：
  - 中心 `getCreatedContextAdoptionV1()` → `{status, statuses, adopt}`：只按 txId 定位，计划事实来自 PEO 新增的只读接口 `readManagedContextCreationFactsV1()`（链校验日志）；登记与接管只经已审的 RegistrationService 与 NamingService。
  - PEO 创建弹窗在 complete 后自动 adopt，显示结果摘要；失败时显示可读原因与“继续登记/接管”；“未完成的创建”列出已完成但未接管的任务（按中心存储动态判定，不按时间）。
  - `openManagedContextCreationV1`、`listManagedContextCreationsV1` 保持不变；Mandala 入口自动一致。
- **定位与对账**：
  - 有效行须满足 `nodeKey`、`ownerSourceScope`、`providerScope` 三者都精确等于计划；
  - 登记前、接管前都核对绑定与计划三载体是否集合相等；
  - 主体结构无效时报 `subject-mismatch`；任何不一致均零写入。
- **大千原生（用户）**：项目 099T- 与目标 099T001- 建成即为 center；身份和绑定等于计划；真实有效行字段为测试替身字段的超集；两者在中心改名成功并同步到各插件。
- **用户确认的语义**：中心改名只改主键名；条目标题（Mandala node.title、GTD tag.label 等）不随之改变，不立项。
- **限制**：真实创建到 adopt 的全链路只有原生证据；目标域没有非替身证据。A9 非 BLOCK 缺口：编号复用、改名 pending 时并发、binding.pending/recovery-required、目标关系未同步。已由中心管名、后又替换过 Collection 绑定的对象，提示文案会误写成“已停止”。
- **Trace**：`results/context-key-bus-management-20261012/p2e-creation/`（P2E-CONTRACT、P2E-PREFLIGHT、P2E-FINAL、P2E-DELIVERY）；change-record `2026/2026-10/20261021-021116-p2e-creation-adoption-deploy.md`。
