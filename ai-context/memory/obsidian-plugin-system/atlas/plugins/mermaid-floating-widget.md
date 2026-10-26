# Mermaid Floating Widget

status: confirmed_by_code
created: 2026-10-03
scope: v0.1.26 runtime audit; v0.1.27 repository candidate and bounded diagnostics

## 2026-10-03 v0.1.27 repository candidate

status: repository_verified_deployment_pending
evidence_status: confirmed_by_code / confirmed_by_test; native_unknown

此节补充上面的 v0.1.26 审计。仅前两项候选优化已在开发副本实现：相关节点收集使用每次遍历内的 first-by-id、点号孩子和状态转移邻接表，按对象身份展开闭包；前缀节点查询使用内存有序行表，保留 startsWith、中文 locale 稳定排序、输出字段及 create/delete/rename/rebuild 失效。首次构建和增删维护有成本，不等于每种操作都更快。未引入持久化映射表、暖结构缓存或改变启动重建/预热策略。

公共 API version 1 保持原成员，新增 `window.mermaidFloatingWidgetApi.performance.start({seconds:60}) / report() / stop()`；默认关闭，最长300秒、500事件、事件JSON估算128KiB、100待结束span。按 render/prefix-query/prewarm-job、缓存状态和 unfinished 区分，白名单导出无路径/正文，旧日志不变。`loadedVersion` 应为0.1.27；旧加载模块没有 performance 成员。阶段完成不代表真实 fresh interactive user_ready。诊断卸载清理且不落盘；完整操作说明见插件 README。

隔离验证：648组 main/core 遍历输入结果与旧版相同，646组完整图、折叠图、Mermaid文本及点击映射相同；另一个重复编号随机样本在两个文件的旧版/新版后续构图中均超时，保留为既有未解决问题，不能称为完整图通过。2,580次前缀输出对照、会话/上限/脱敏/关闭及晚回调测试、原22项索引生命周期和A1隔离检查通过。真实库未用于合成测试，原生画面和总耗时仍待用户采样。

证据与代价：`state/staging/mermaid-perf-c-20261003/slice-c-results.json` 保留7轮交替样本；遍历计时使用同一JS realm，早期跨realm计时已标注 superseded，不作为速度依据。5万行前缀查询的暖查询降低工作量；冷建索引与增删维护单独报告。仅为合成函数测量，不能据此声称截图图形或全工作流提速比例。main/core 基线差异被保留，未整体重新打包。

工程记录：[Slice C](../../../../REFERENCE_BOUNDARIES.md#ref-229)（外部来源未随包提供）。Runtime/mirror仍是v0.1.26；v0.1.27部署需要具体补丁审查后的用户确认。


## 编号与职责入口

编号语义继续以 [Mermaid 网络地址](../knowledge/mermaid-address-semantics.md) 为入口：`.` 表示子集/内部层级，`+` 表示状态转移，二者交替的语义不能简化成一个点号深度。`subgraph` 是脉络容器，不替代可点击的笔记节点。节点、状态转移关系、真实引用与布局辅助边必须保持区别。

当前插件是只读图投影和视口交互的 owner；Vault/metadata/Dataview 提供笔记与字段，插件拥有可重建的 fold/reference/node 索引与 SVG cache，不能把缓存当作业务真相。`window.mermaidFloatingWidgetApi` 提供折叠、引用、前缀节点和渲染缓存接口。节点点击、居中、缩放、折叠和可读标签属于现有 UI contract。

## v0.1.26 审计证据边界

2026-10-03 注册的 open NEWERA vault、Obsidian 窗口标题及既有部署证据证明实际运行目录为 `D:/han/最新的/NEWERA2024年4月17日/NEWERA`。插件 v0.1.26 的 main.js、core-script.js、manifest、README 在 runtime、`workspaces/26- supermemoconcept的改进/插件/mermaid-floating-widget` 与 `workspaces/NEWERA/.obsidian/plugins/mermaid-floating-widget` 哈希一致。main.js SHA-256 为 `afd83ff8abb9f3bde86e348be9e5817e8d99ce3ac12fafdc3c98f41a37bf4654`；core-script.js 为 `ad2252ce414866eda695e6b61c9ee528bd278ad35c1f9633da3df409e8eab1f6`。以运行 main.js 为实现证据，不从较旧说明或独立 core 文件反推 bundle 的全部行为。

本次只读代码、少量配置及派生文件大小，没有读取派生索引全文，没有执行插件 onload、真实笔记遍历或重建，没有修改 Mermaid 程序、缓存和设置。磁盘版本不证明当前进程已加载字节；当前图的真实耗时分布仍 `unknown`。

## 已存在的优化

- 节点索引优先于 Dataview 全量查询、最近 SVG 缓存和后台预热已存在。不要再次把增加这些机制当作新优化。
- [Slice A1](../../../../REFERENCE_BOUNDARIES.md#ref-230)（外部来源未随包提供） 已移除纯滚动时的完整标签重建，使用拖尾视口保存和私有预热运行态。旧 5 月文档中的保存/恢复 global 状态方案已被私有 host 隔离替代。
- [Slice B](../../../../REFERENCE_BOUNDARIES.md#ref-231)（外部来源未随包提供） 已合并重复事件、按脏资产保存、单次写入串行化、有界重试及卸载门禁。历史用户实际使用正常；没有足够当前量化证据将其称为已测得的整体性能收益。

## v0.1.26 审计候选（进展见 v0.1.27 节）

以下事实是 `confirmed_by_code`；建议是待验证设计，没有实施或承诺加速比例。

| 位置（main.js） | 现状 | 候选改进及必须保留的约束 |
| --- | --- | --- |
| `collectRelevantNodes` 2130，点号后代 2105 | 每次递归孩子都用 `allNodes.filter`；状态转移闭包扩张时重建映射并重复遍历后代 | 单次构图建立 nodeById、点号孩子、状态转移邻接关系，工作队列只展开新节点；保留原收集顺序、深度边界及 `. / +` 判定，不能直接把所有 parentId 当同一种边。 |
| `getNodeEntriesByPrefix` 6942 | 每次 Object.values 全节点索引，再 filter/sort；查询局部图也受全索引规模影响 | owner 内建立可增量维护的前缀查询结构或按 revision 的查询复用；保留现有 startsWith 覆盖、排序/重复编号行为及 create/rename/delete 失效，不能偷偷改成另一种前缀语义或截断结果。 |
| `renderDiagram` 4973–5196 | cache 查询发生在 files、nodes、graph、fold、body reference、Mermaid code 之后 | 若暖图前处理显著，按数据 revision 复用解析/结构结果；必须纳入引用、折叠、设置、版本及当前节点身份，不能把 stale preview 当 fresh ready。 |
| `queueFullIndexWarmup` 6004、`buildAssetSnapshot` 6353 | 启动约1.5秒后安排启用的 fold/node/reference 全量重建，各自枚举候选文件；引用逐文件读取与 stat 核验 | 测量启动后台窗口后，评估合并候选清单、分批工作及可靠变更验证；不得直接删除重建或弱化离线变更/引用一致性检查。 |

SVG 冷渲染和标签几何仍可能是主要等待来源。旧 `docs/cards/009-svg-render-cache-implementation.md`、`011-render-cache-prewarm-bounds-and-center-zoom.md` 记录过 161 节点下扫描十几毫秒、Mermaid 渲染超过 3 秒；这是 `confirmed_by_memory` 的历史样本，不能当作本次截图的实测。优先以当前 phases 判断冷渲染和暖图哪个阶段值得改；不要为提速自动关闭用户认可的预热、去掉子图/边/标题或降低完整性。

## 隔离工作量验证

证据：`results/mermaid-performance-audit-20261003.json`。直接从当前 main.js 提取相关生产函数到 VM，使用合成单层树，仅覆写输入数组 filter/find 做计数，没有运行 DOM/Vault/插件生命周期。

| 输入节点 | 返回节点 | allNodes.filter 次数 | 筛选判断总数 |
| ---: | ---: | ---: | ---: |
| 101 | 101 | 102 | 10,302 |
| 1,001 | 1,001 | 1,002 | 1,003,002 |
| 3,001 | 3,001 | 3,002 | 9,009,002 |

总数包括每个节点的子节点扫描及末尾一次状态转移筛选，不全是 `isChildRelation` 调用。合成前缀查询结果固定 200 条，全索引为 1,000 / 10,000 / 50,000 时，Object.values 读取条目数分别为 1,000 / 10,000 / 50,000。计数证明扩展成本，不证明当前最大瓶颈或修复后的速度。

## 真实场景验证入口

现有配置 enableTiming/index/cache/readable-labels 均为 true。无需安装或默认新增持续插桩：使用现有 `[MermaidFloatingWidget][render.timing.summary]` / `render.timing.phase`，查看 `files.query`、`nodes.prepare`、`graph.build`、`fold.compute`、`body-reference.analyze`、`mermaid-code.generate`、`mermaid.render` 或 `mermaid.render-cache.hit`、`view.finalize`。

分别记录首次打开、同图关闭重开、一次正常编辑后的重开；给后台预热一个固定观察窗口（例如10秒），配合 `render-cache.prewarm.start/done`、index rebuild 与 owner 的 indexDiagnostics 差值。时间窗口到期未完记 unfinished；不自动关闭预热。summary 不是完整验收：还要检查图身份、新鲜度、节点打开和视角稳定。任何优化应以图结构/顺序/点击映射等价、端到端等待、后台成本和退出清理共同判断。

## Framework trace

Update `refines`，关联既有 FW-005（编号语义）、FW-011（维护哨兵）、FW-024（性能可观测性）。读取 Framework 入口/协议、Atlas 编号章节、历史图经验和7月工程记录后形成这份审计。未更改 Question Map 状态、编号语法、Skill 或 ownership。新页不进入 state/cards 或 CARD_LIBRARY；未进行 MemPalace mine。


## 2026-10-03 v0.1.28 大图交互与白标签候选

status: repository_verified_deployment_pending
evidence_status: confirmed_by_code / confirmed_by_test; native_unknown

在 v0.1.27 基础上优化用户已显示大图后的交互：main 的白色 subgraph 可读标签复用静态元数据和当前图内元素，只写变化位置/字号/内容；保留文字、白底/阴影/blur、阈值、数量上限、避让和自然滚动。一个待执行 rAF 合并多次请求；render 开始及窗口关闭释放观察器、监听器、图引用和 label cache，generation/closed 标记阻止晚回调重装旧图。独立 core 没有白标签层，继续保留该差异。

main/core 同步批量点击绑定和引用着色建立临时 DOM 查找表，保留原逗号选择器按 DOM 顺序第一个匹配及特殊 ID 回退；不是跨渲染缓存。cluster 矩形按关联调用读一次。编号、图/折叠生成、全部节点边、点击 simpleId、SVG freshness、后台预热和持久化协议未变，无依赖插件需匹配改动。

同一默认关闭 Console performance API 新增 view.zoom/view.bounds/view.scroll、label.layout/label.dom 数值事件及 windowObservations 汇总。长任务/帧间隔属于整个窗口，包含其他插件，不是 Mermaid 专属或 GPU 时间；visibilitychange 清除跨隐藏期的帧基线。stop/timeout/restart/unload 释放观察器、rAF、visibility listener，旧会话回调不污染新会话。loadedVersion 应为0.1.28，完整用户测试与复制报告命令见插件 README。

隔离真实 Chrome：20组标签文字/title/css/顺序等价，重复编号、嵌套碰撞、阈值、设置/字体变化、滚动坐标、5次鼠标滚轮缩放结果一致；60次 main/core 节点查找等价；旧C/B22/A1继续通过。100个标签稳定刷新12次，旧版创建1200元素/替换层12次，新版均0；标签逐次耗时波动，不能据此声称帧率已提升。600/1000节点生成SVG的点击、完整着色SVG和cluster关联结果相同，1000节点3轮中位绑定1256→10.2ms、引用着色1149.2→43.5ms；仅局部合成SVG测量，非全工作流倍速。cluster读取10000→100，但关联总耗时未稳定下降，浏览器布局仍有成本。

另行保留冷渲染待办：从本机 Obsidian 包提取的 Mermaid 测试引擎默认源码长度上限下，长编号300节点夹具能返回错误SVG而非抛错；仅测试提高limits才渲染600/1000节点。生产limits、缓存错误SVG识别未在本次改动，不能宣称所有大图冷渲染已解决。继承的重复编号随机夹具下游超时也仍保留。原生实际大图交互验收待部署、用户重载后采样。

工程记录：[Slice D](../../../../REFERENCE_BOUNDARIES.md#ref-232)（外部来源未随包提供）。本节以v0.1.28更新当前候选说明，前节v0.1.27保留为历史；runtime/mirror仍v0.1.26，未部署或自动重载。


## 2026-10-03 v0.1.28 已部署，待用户重载验收

status: disk_deployed_reload_pending

用户确认后，已将最终审核的0.1.28 main.js/core-script.js/manifest.json/README.md 从候选同步到已证明的 NEWERA 实际运行库和 mirror；dev/runtime/mirror 四文件逐一 SHA-256 一致。未复制 settings、派生JSON、SVG cache或笔记；未自动重载插件。本节更新上面的 deployment_pending 状态，历史测试限制保持有效。

用户下一步：重载 Mermaid Floating Widget，打开已有大图待显示完成，Console start({seconds:60})，进行 Ctrl+滚轮缩放、普通滚动和折叠/展开，然后 stop()/report() 复制报告；loadedVersion应为0.1.28。磁盘部署不证明当前进程已载入新字节或原生流畅度达标。

工程记录：[0.1.28 deployment](../../../../REFERENCE_BOUNDARIES.md#ref-233)（外部来源未随包提供）。


## 2026-10-03 v0.1.29 白签绑定头领与更新开销

status: repository_verified_deployment_pending
source_status: confirmed_by_code
user_contract_status: confirmed_by_user
test_evidence: synthetic_browser_test; native_pending
update_type: refines

用户截图箭头确认：白签应在各自 subgraph 头领正上方，便于将名称与入口对应；节点状态色不改变身份。main 的白签现在用 sg.baseNode 对应 simpleId 的严格 DOM 匹配取得头领顶边中心，底边上留8px；长标题向上展开，碰撞向上避让。缺失头领才回退 cluster 原锚点，禁止 M1→M10/文字包含误匹配。v1可选锚点缓存失效并从当前SVG重采v2，不清SVG缓存或改编号。边界仍由现有滚动视口裁剪，不自动移动节点/视口；数量上限及字体显示阈值保留。

每次白签更新先集中读取几何/滚动位置，计算全部位置后批量写样式；现有标签信息日志每层最多每秒1次。600/1000节点、36标签的隔离Chrome对照，滚动读取72→2，写样式后读取70→0；旧算法仅缓存滚动坐标的控制组视觉输出相同，三轮中位耗时分别5.5→1.9ms、3.3→1.6ms。完整候选中位2.3/1.8ms包含有意的头领定位变化，不能作为同输出倍速结论。原生用户反馈0.1.28已顺滑，约105秒报告只保留500事件且丢弃798，label.dom保留样本最大90.2ms；不能据此判定GPU原因或全会话分布。

performance报告新增有界phaseTotals：统计整个采样窗已接受的阶段观察，包括被events缓冲淘汰的明细；不覆盖MAX_PENDING拒绝的span和未观测工作，rejectedSpans单列。label.dom新增位置计算/DOM写入/日志处理的同步耗时及日志次数。旧API/字段保留、默认关闭，无额外持久化；总和/峰值不能推算中位数或P95，嵌套时间不能相加。对外依赖扫描仅本插件main命中相关白签/锚点/诊断字段，core保持原有无白签差异且字节不变。

证据与回滚：[工程记录](../../../../REFERENCE_BOUNDARIES.md#ref-234)（外部来源未随包提供）。当前只完成仓库dev候选，runtime/mirror仍0.1.28。独立浏览器检查覆盖头领位置、多行/边缘/嵌套、颜色覆盖、缺头回退、缓存升级、点击、缩放/滚动/折叠及释放；原生位置和性能待部署重载后用户Console采样。冷绘制引擎limits/错误SVG缓存与继承重复编号超时继续列为原有待办。


## 2026-10-03 v0.1.29 已部署，待用户重载

status: disk_deployed_reload_pending
source_status: confirmed_by_code
update_type: refines

用户确认本次0.1.29后，白签移至各自头领上方、批量读取坐标后更新标签、日志限频和有界phaseTotals报告已部署至已证明的NEWERA运行库和mirror。仅同步main.js、manifest.json、README.md；core字节未变。dev/runtime/mirror四文件逐项SHA-256相同。先前repository_verified_deployment_pending推进为disk_deployed_reload_pending；未自动重载或修改启用设置、笔记、索引、缓存。部署时community列表包含插件：False；这不证明当前进程加载状态。

用户重载后核对报告loadedVersion0.1.29，打开原有大图，分别采样10–15秒缩放/滚动和折叠/展开，检查白签与头领对应、节点点击和视口稳定性。隔离测试不替代本轮原生验收，既有冷渲染限制与碰撞/视口边界仍适用。[部署记录](../../../../REFERENCE_BOUNDARIES.md#ref-235)（外部来源未随包提供）包含备份、回滚和三边哈希。
