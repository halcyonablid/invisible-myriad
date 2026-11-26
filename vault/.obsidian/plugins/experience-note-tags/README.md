## 0.1.11 · 斜杠编号与完整标签列表

首个减号前的编号支持 `/` 分级，按 ATOM 地址规则排序和配色；兼容点号义名。显示名称与原文标签身份分离，不迁移笔记。
经验插标签弹窗直接列出所有实际标签，取消抽屉与翻页，三列从上到下阅读；支持搜索，窄屏改为两列或一列。新标签输入完整路径；旧抽屉草稿自动还原为显式路径。

## 0.1.10 选择标签按列阅读

待选区保留三列（中宽两列、窄屏一列），按地址排序后从上到下填满第一列，再填第二、第三列。键盘顺序与视觉阅读顺序一致；沿原60项分页，颜色及标签身份不变。

## 0.1.9 标签地址展示

经验回看标签栏保持单列，选择弹窗右侧待选区按用户后续要求改为宽屏三列、中宽两列、窄屏一列，均义名优先，按首个减号前地址自然排序，点号分层、字母后缀同层。原文标签身份、/抽屉、多选、分页、草稿、片段更新时间不变。点号可用于义名，本批不扩展原文标签语法。编号底色沿用ATOM编号格式分组/首代表哈希/淡色调色板，在完整经验标签目录上计算后用于筛选结果；无编号保持主题底色。颜色是局部目录投影，不保证与全库ATOM的绝对RGB相同；首代表变化可能改变组色。没有新增持久化或后台扫描。

## 0.1.8：片段更新时间

新收录和通过本插件实际增删、重命名原标签时，在原起始标记的下一行记录 `<!-- experience:tags-updated at=UTC时间 -->`。原片段 ID、已阅状态和正文不变；日期筛选/排序优先使用“片段更新时间”，同日按具体时刻排序。时间按查看设备的本地日期显示，悬停可查看具体时刻。

旧片段没有记录时，显示“笔记建立日期（或文件创建日期）· 暂无片段更新时间”，沿用旧日期，不自动补今天。重复添加、同名改名、空操作、义名/已阅变更不更新时间。手工在正文里改标签不自动补时间。时间注释不进入卡片正文或复制文本；编辑器一次撤销、批量撤销都恢复标签和时间。

没有后台全库轮询；沿用现有增量索引。升级后首次打开按原队列刷新派生缓存，后续复用缓存。旧版仍能读取片段，但不理解新的更新时间，可能显示注释；程序回退不等于日期功能兼容，不自动恢复业务数据。

## 0.1.7：含逗号的经验标签

新建框每次添加一个标签，英文逗号 `,`、中文逗号 `，`、顿号 `、` 保留在名称中；多个标签逐个添加。批量编辑仍以空白分隔。名称不含空白，`/` 保留层级含义；逗号前须有文字、下划线或短横线，以便通过原生标签缓存发现笔记。插件在经验片段内统一识别完整名称；Obsidian 自带标签面板或其他插件可能按其自身规则处理英文逗号。

不合并历史已拆标签，不修改义名或已阅状态。旧派生索引首次打开时按原有两路队列更新，未打开界面时不读正文。

## 0.1.4 经验标签抽屉与块范围

收录弹窗拓宽至最多1200px：左侧逐层抽屉、右侧标签勾选、完整路径搜索、底部已选与提交。斜杠构成层级；虚拟父层只导航，真实父标签在该层可单独选择，不会递归勾选子标签。新标签默认放在当前路径；以 # 开头输入完整路径时从根层级创建，避免重复前缀。每层/搜索分页60项，长名字换行。候选仅来自有效经验起止标记内的标签，与普通正文旧标签隔离；这里数字为全部经验片段使用数（含已阅），正常回看侧栏仍为未阅数。

块边界由自带 markdown-it 15.0.3 对当前编辑器快照解析，不依赖其他插件、不使用滞后的保存元数据偏移。支持常规 Markdown 根块及独立行 $$、%% 结构；并不宣称覆盖全部 Obsidian 扩展语法。未闭合或边界位于受保护结构内会提示而不改正文。含脚注定义的笔记暂不自动补齐新片段，避免割断脚注续段；已有经验片段内仍可加标签。已有经验片段内添加标签仍保留其范围，不追溯扩大历史片段。只有确认才修改，一次撤销可恢复。关闭保留标签、新输入、搜索和抽屉位置；源内容已变化则拒绝提交并保留草稿。

## 0.1.3 展开全文

长片段折叠显示摘要，点击“展开全文”才读取完整无标签正文，卡片随页面增长，不再内部滚动；支持收起和取消等待。同页刷新复用完整内容与展开状态，原文变化失效，换页或关闭视图释放。复制仍为完整无标签正文。

## 0.1.2 卡片展示

卡片不再显示文件路径。正文预览隐藏与底部标签栏重复的已识别标签，标签独占行随之移除；代码、链接和普通文字不按井号猜测删除。复制片段保留完整正文与 Markdown，去掉全部已识别标签。仅改变展示，不改笔记。

# 经验回看 0.1.4

一个明确标定的经验片段是一张卡，同一篇长笔记可以有多个片段。普通正文标签不会把整篇笔记自动变成条目。只提供已阅/未阅，无训练评分、复习计划；无其他插件运行依赖。

## 收录与回看

在编辑器选中内容，运行“经验回看：收录经验片段 / 添加标签”。可在 Obsidian 设置 → 快捷键设置组合键，也可从右键菜单进入。弹窗展示按块补齐后的实际收录范围，可搜索经验标签、多选或新建。确认后自动加入独立行起止标记和随机 ID，原文保留，标签放在片段末尾独立行。部分段落会补齐整个段落；引用、callout、表格、围栏代码收录完整结构。列表为保持顶层标记安全而收录整个外层列表，并在弹窗常显提示。原生 ^block-id 保留在原块之后、标签之前。选区触及多个块时收录首尾完整块和中间内容。一条编辑器撤销可恢复。

光标在已有片段内时，此命令为该片段追加标签，已有标签不重复。Ctrl/Command+Enter 确认，输入法组词时不提交。没有选区且不在片段内时提示先选内容。

标记格式：独立行 `<!-- experience:start id=自动生成的ID -->`，选中正文和标签，独立行 `<!-- experience:end -->`。普通 Markdown HTML 注释在阅读模式隐藏。不要手动复制同一 ID 在一篇笔记内创建多段；重复、嵌套、未闭合标记会报错并禁止自动修改。代码、属性及受保护注释中的示例标记不构成条目。为保证范围准确，含原始 HTML 的笔记暂不自动识别或修改片段（HTML 注释标记、代码示例和自动链接除外）；界面会报告原因。未闭合代码或不安全选区也会被拒绝，请使用普通 Markdown 正文。

左侧数字仅计当前日期/名称搜索范围内的未阅片段，零未阅标签保留。单标签、任一包含、全部包含；右侧未阅/已阅分组，每组每页30个。标签栏每页100个，弹窗候选每页60个，不限制收录总数。文字可选择复制。

“复制片段”取完整片段内部（保留 Markdown，去掉正文标签），不含标记、相邻内容。“返回原文”重新解析 ID，在经验回看所在标签组的末尾新开原文标签页并定位片段开始行，保留列表上下文；不创建分屏，不覆盖已有笔记标签。来源视图在读取中关闭或换组时取消跳转；连续点击只让当前来源最新请求激活，过期请求已打开的标签保留在后台。摘要最多1400字；超过1 MiB的来源笔记不自动读取摘要，仍可复制片段/返回原文。

日期优先来源笔记 qishiriqidate（设置可改），严格 YYYY-MM-DD 或 YYYY/MM/DD；缺失/无效回退文件创建日期并标注。复制/导入可能改变文件日期。搜索限笔记名称/路径，没有默认扫描全文。今天/近20天按操作时本地日，日期闭区间。

## 修改与恢复

单个/批量标签修改只作用于所选片段。边栏重命名/合并限当前日期和名称搜索范围内含该标签的片段，先预览再确认。同篇多个片段合并一次全文比较后写入，片段外字节不变。每批最多100片段、预览快照约8 MiB；单篇超过2 MiB或正在Markdown编辑器打开时跳过并说明，可改用编辑器命令。编辑器收录同样保留单篇约2 MiB的安全上限。

每篇写前保存完整 before/after 意图。Vault.process 比较全文后写入；失败逐篇报告，整批不保证原子性。正文已写但回执失败会明确显示，意图保留。撤销上次修改只恢复当前仍等于本批 after 的内容，后续编辑不覆盖。全部跳过/备份失败不覆盖原撤销入口。transactions 中恢复文件不自动清理，含原文，应按笔记同样保管。

弹窗关闭保留输入草稿，恢复不会自动写入旧笔记。原文/来源改变或卸载后禁止继续提交。已阅/草稿/设置存自有 data.json；已阅按路径、文件创建身份和片段 ID 隔离，运行中改名迁移、删除清除，同 ID 跨文件副本不继承。

## 性能与视图组

官方元数据用于发现正文标签候选。首次实际打开视图，最多两路后台读取识别片段，显示剩余数、待界定和标记错误。解析每200行或长行每12000字让出执行。派生索引 fragment-index-v2.json 只存来源版本和片段 ID/范围/标签，不存正文/摘要；未改文件重启复用，变化逐文件重建。删除派生缓存可重新识别。

Hub 隐藏预热不启动候选正文扫描。经验视图成为活动叶或收录弹窗打开时，复用缓存并以最多两路逐步识别尚未确认的文件；两种消费者都离开后暂停，不退回全库普通标签。摘要与扫描共用两路额度，摘要缓存120项/1 MiB。可开启最近100项、不含笔记标识的诊断。隔离测试不能代表真实库帧率。

View Group Hub 0.2.9 的“回看”列通过原生 experience-note-tags-view 接入。本插件不读取 Hub、Mandala 或其他插件的代码/数据，独立安装可用。

安装文件为 main.js、manifest.json、styles.css。0.1.4本批提供安装包及开发源码；运行库部署以对应发布记录为准。


### Third-party notice: markdown-it

Copyright (c) 2014 Vitaly Puzrin, Alex Kocharin.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.


### Third-party notice: entities

Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


### Third-party notice: linkify-it

Copyright (c) 2015 Vitaly Puzrin.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.


### Third-party notice: mdurl

Copyright (c) 2015 Vitaly Puzrin, Alex Kocharin.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

--------------------------------------------------------------------------------

.parse() is based on Joyent's node.js `url` code:

Copyright Joyent, Inc. and other Node contributors. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.


### Third-party notice: punycode.js

Copyright Mathias Bynens <https://mathiasbynens.be/>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


### Third-party notice: uc.micro

Copyright Mathias Bynens <https://mathiasbynens.be/>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## 0.1.5 标签义名

标签旁的「⋯」可设置界面义名。义名只保存在本插件；Mandala 按日课来源隔离，经验回看按当前库隔离。搜索同时匹配义名和原标签，按展示名排序，未阅数仍以原标签统计。插入操作写入原标签。

「修改原文标签」使用独立输入和预览：Mandala 为当前来源全日期（含已阅），经验回看为当前日期与笔记搜索范围（含已阅）；条目上的「编辑原文标签」仍只改本条。原文改名后旧义名保留供撤销恢复，目标标签保留自己的义名。关闭义名弹窗会保留独立草稿，点击保存才生效。


## 0.1.6 义名混合排序修复

原标签与义名统一按去掉开头 # 的显示名称自然排序，不按是否设置义名分组。例：001、003、义名003C、006。原标签、义名保存值、筛选与插入身份不变。经验回看选标签弹窗及同层抽屉也使用此规则，层级不变。
