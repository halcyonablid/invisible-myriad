## 0.3.18 日课标签汇总排序

由新到旧：日期降序，同日编号数值降序；由旧到新则日期及编号升序。重复编号以原文位置同方向排序；未分条历史文字在同日有编号记录之后。未阅/已阅分区及标签筛选共用此顺序，仅调整汇总呈现，不改原记录、编号、已阅身份或返回原文位置。

## 0.3.17 · 斜杠编号与完整标签列表

首个减号前的编号支持 `/` 分级，按 ATOM 地址规则排序和配色；兼容点号义名。显示名称与原文标签身份分离，不迁移笔记。

## 0.3.16 日课标签编号配色

插标签弹窗和汇总左标签栏共用ATOM编号格式分组淡色，取义名优先的地址；去除交替斑马纹。完整日课候选集合先计算颜色再投影筛选，搜索/日期不会重新分组；选中态保持清晰。无新增后台读取或业务格式变化。

## 0.3.15 日课标签地址列表

插入标签弹窗与标签汇总左栏采用单列；普通展示有义名用义名，无义名用原标签。原名在管理与原文编辑界面核对。地址取可见名称去掉开头 # 后第一个减号前的编号；支持点分段、字母/数字后缀和 @/+ 组合。点号增加展示深度，字母/数字后缀维持同层，按地址分段自然排序，父地址在子地址之前；没有地址的名称接在编号标签后。深层缩进只限显示宽度，不修改完整地址。

日课自身 # 至空白的标签解析已支持点号；义名也允许点号。这个展示层级不同于 Obsidian 原生标签用 / 的层级。实际插入、筛选、数量与已阅仍绑定原标签，修改显示地址不改原文。搜索保留义名和原名匹配。选择弹窗保留每批80项加载、来源/选区检查和既有保存路径，无全库扫描或后台引擎。

## 0.3.14 日课标签栏加宽

日课标签汇总桌面左侧标签栏由190px加宽至285px（1.5倍），便于浏览长标签与义名。宽度不超过640px时继续使用原有上下布局。筛选、计数、编辑及保存逻辑保持。

## 0.3.13 每日评论按填写的记录时间排序

日期列下方的 comment 汇总按编辑框“记录时间”从早到晚排列。修改该时间后重新排序；首次创建与最后修改时间均不参与。相同时间按记录 ID 稳定排列；异常时间放到末尾。日期归属、评分块排序、原文和保存逻辑保持。此规则替代 0.3.7 的首次录入顺序。

## 0.3.9 日课条目复制

正文和日期可鼠标选择；复制正文按钮复制完整可读正文，不受长文折叠影响。标签/图片引用不混入此纯文本正文，剪贴板失败显示提示。

## 0.3.8 标签数量统计未阅

左侧全部、未打标签及标签徽标仅统计当前日期/搜索范围内未阅记录。标已阅后扣除、恢复后加回；零未阅标签保留，仍可查看已阅内容。

## 0.3.7 评论按原始录入顺序

每日评论按完整创建时间排序：跨日补记仍归属原日期，但排在之前录入的内容后。编辑不改变顺序；旧记录无有效创建时间时回退时间块完整日期时间。不改记录数据。

## 0.3.4 日课标签操作布局

标签汇总左列（含全部/未打标签）文字左对齐，右侧数量独立徽标、不参与文字换行；日课插入标签、标签汇总移至输入框下方，与图片按钮同组，窄宽自动换行。原保存/标签/图片/高度逻辑不变。

## 0.3.3 标签末行与日课输入高度

标签选择与汇总编辑只整理本次条目：正文中的真实标签统一到末尾独立一行、下一编号之前；其他条目不变，不自动迁移历史。输入框挂载/恢复草稿/宽度变化后测量高度，隐藏时不写高度，关闭释放；不通过伪造input保存触发撑高。

## 0.3.2 日课光标插入标签

记录标题旁新增“插入标签”：搜索、多选同来源已有日课标签，确认后在原光标处插入。保留选中文字、图片及未存输入，沿原日课草稿/保存链；本条已有标签不重复添加。编号头、代码或链接内不插入，提示先移动光标。候选仅按需读取并增量解析，搜索零I/O，不混入下一步待办标签。

## 0.3.1 时间块今日定位

原生时间块页首次打开或切换日期范围时，将今日列中心放在横向视口38.2%处（边缘按可滚动范围限制）。同范围刷新/保存保留手动横滚；无今日则不改变日期范围。只使用页面内存，无后台轮询或额外数据读取。隐藏页尺寸就绪后定位一次；手动操作及关闭取消待处理定位。

# Mandala Time Blocks

## 0.2.3 — 九宫格去类型

九宫格节点不再需要选择类型；类型管理、类型筛选、类型图标和节点的类型配色已移除。原类型筛选页改为“节点目录”，保留搜索、树形层级、定位、互联、编辑及历史入口。

九宫格 / 81 格展开及其切换、图片封面、层级导航、拖拽、关键词、笔记绑定、文件快捷方式和周追踪仍保留。节点历史、关联时间轴、记录计数及改名历史继续可用。独立 Timeline、时间块、日课、周追踪及安全审计不受本次改动影响。

旧环境状态中的 filter/types 页面映射到节点目录；旧类型筛选不再隐藏节点。EVA 节点地址及旧定位入口继续有效。节点编辑器的“关闭”保护已修改输入；清空原有内容需要点击“保存节点”并确认。保存失败时保留窗口，已有“输入恢复箱”继续保存文本输入。

旧 `type`、`typeIds` 和 `Mandala_Types.json` 原样保留兼容，本次不批量清除或重写。普通九宫格新增节点不再赋予类型；受管理的目标创建事务保留旧默认字段形状，以支持未完成事务的严格回验和恢复，这些字段不再显示为节点分类。

本版以已核实的日常运行库 0.2.2 为程序基线，保留其独立时间框、时间分类及主键协作实现。部署不复制业务 JSON、用户配置、关系索引或草稿。

## 早期切片说明（历史参考，类型相关内容已被 0.2.3 取代）

Development-only first plugin slice for turning the Mandala goal grid into a time-block tagging and color-block tracking workflow.

## Data Files

The plugin intentionally does **not** reuse legacy `TimeLog_*` names.

- `MandalaTimeBlocks_Records.json`
- `MandalaTimeBlocks_Settings.json`
- `MandalaTimeBlocks_Migration.json`

The Mandala tree remains read-only in this first slice:

- `Mandala_Database.json` is the structure source.
- `Mandala_Types.json` is display metadata only.

## Current Slice

- Plain Obsidian plugin delivery: `manifest.json`, `main.js`, `styles.css`.
- Single-instance draggable floating widget.
- Source binding via `defaultSourceNotePath`.
- Leaf-only Mandala picker.
- Quick capture, full edit, daily color overview, branch/leaf filtering.
- Legacy `TimeLog_Database.json` staging import, manual mapping, and commit.
- Multi-type node tags via `typeIds[]` with legacy `type` mirror.
- GTD-style nested type capsules for multi-select filtering and type add/edit/delete/drag reparenting in one interface.
- Per-node Obsidian note binding with vault-note picker and direct open actions.
- EVA Cross View Relations integration for Mandala node entries: node-tree rows can open the relation editor, external relation jumps reveal the type filter/manage interface with the target node highlighted, and relation mounts are rendered inline under the node row with indented special UI.

## Compatibility Notes

- `Mandala_Types.json` keeps the top-level `typeId -> config` shape and adds `parentId` / `order` fields for the capsule tree.
- `Mandala_Database.json` keeps legacy `type` while using `typeIds[]` as the canonical multi-tag field.
- Node note bindings are stored as vault-relative `{ "path": "...md", "ctime": ... }` objects.
- EVA relation node keys use `viewType="mandala-time-blocks"`, `scopeType="node"`, `scopeId="mandala"`, and `itemId=<nodeId>`; indexes are derived from the current Mandala node tree and can be rebuilt without migrating existing workspace/GTD/collection relations.


## 0.3.0 日课逐则标签汇总
原日课记录标题旁打开唯一标签汇总页签。行首三位数字、减号和空格开始一则；#标签到空白结束。标签页支持日期/文本/单个、任一、全部标签筛选，逐则编辑与批量增删、全日期改名合并，预览确认后由原日课owner保存。返回原文复用原日课页。草稿保存在插件设置，恢复不自动提交；有未保存日课或图片任务时阻止批量写入。按需逐日解析、首屏最多30则，筛选不重读日课文件。


## 0.3.5 日课标签已阅与今日筛选

标签汇总新增独立已阅按钮及批量标记/恢复，未阅优先、已阅折叠。已阅与批量选择分离，跨标签共用，按来源/日期/编号正文内容版本保存至Mandala设置；改标签保留，改正文或编号回到未阅，相同编号与正文歧义不标记。日课原文不改。两组各30则按需显示，折叠的已阅组不创建卡片。只看今天按钮将起止日期设为点击时本地今天，保留标签与搜索条件，不增加文件读取。


## 0.3.6 时间块逐日评论

原生时间块记录页点击日期，在该列下方展开略宽的comment圆点列表，仅呈现原文，按记录时间升序；一次只显示一天，再点收起。只读投影上方已显示的完整时间块，空评论跳过，长文字保留换行，30条增量显示。横向跟随日期列，保留原评分图、拖放、今日定位及明细编辑；不写业务数据或设置。


## 0.3.10 标签义名

标签旁的「⋯」可设置界面义名。义名只保存在本插件；Mandala 按日课来源隔离，经验回看按当前库隔离。搜索同时匹配义名和原标签，按展示名排序，未阅数仍以原标签统计。插入操作写入原标签。

「修改原文标签」使用独立输入和预览：Mandala 为当前来源全日期（含已阅），经验回看为当前日期与笔记搜索范围（含已阅）；条目上的「编辑原文标签」仍只改本条。原文改名后旧义名保留供撤销恢复，目标标签保留自己的义名。关闭义名弹窗会保留独立草稿，点击保存才生效。


## 0.3.11 义名混合排序修复

原标签与义名统一按去掉开头 # 的显示名称自然排序，不按是否设置义名分组。例：001、003、义名003C、006。原标签、义名保存值、筛选与插入身份不变。经验回看选标签弹窗及同层抽屉也使用此规则，层级不变。


## 0.3.12 日课条目编号突出显示

在“记录、想法、路点与线索”编辑区，为既有解析器识别到的 `001- ` 等条目开头增加浅金色底纹与描边。识别与“插入标签”共用：行首三位数字、减号、一个空格后接非空白正文，代码等遮蔽区域不标记。编号和正文没有被改写，输入、撤销、选区及图片保存仍使用原 textarea。只对当前编辑值做本地视觉投影，不扫描笔记；连续输入合并处理，中文组词时隐藏标记，完成后更新。
