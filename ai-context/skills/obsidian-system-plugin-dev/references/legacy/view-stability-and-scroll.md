> LEGACY
>
> 本文件仅保留为历史来源，不再作为主引用入口。
>
> 现在的 canonical 入口请先看：
> 1. [../protocols/00-protocol-index.md](../protocols/00-protocol-index.md)
> 2. [../protocols/primary/local-write-view-stability.md](../protocols/primary/local-write-view-stability.md)
> 3. [../appendices/paradigm-panel-visual-state-semantics.md](../appendices/paradigm-panel-visual-state-semantics.md)

# View Stability And Scroll

## 1. 稳定性的判断标准

页面上下位置稳定，不是只看旧 `scrollTop` 有没有塞回去，而是看用户视角是否留在原来阅读区域。

分两层检查：

1. 数值稳定
2. 视角稳定

## 2. 锚点恢复优先

当上方结构高度会变化时，纯 `scrollTop` 恢复不够。

正确思路：

1. UI-only rerender 前找当前视口里的锚点元素
2. 记录它的稳定标识和相对视口偏移
3. rerender 后优先让同一锚点回到原相对位置
4. 找不到锚点时，才退回普通 `scrollTop`

常见锚点候选：

1. 范式面板行
2. 分类行
3. 挂载组头
4. 普通条目
5. Tab section

## 3. 显式定位优先

以下链路优先级高于普通滚动恢复：

1. 跨插件 jump
2. 关键词定位
3. 范式 reveal
4. 任何 `pendingParadigmFocus` / `pending focus`

如果显式定位失败，可以回退到稳定位置，但不要假装 reveal 成功。

## 4. 典型高风险场景

1. TOC 开合
2. 范式面板开合
3. `范式面板 / Tab里面` 模式切换
4. sticky 工具条附近高度变化
5. 本地保存后多轮延时 scroll restore 抢夺
6. 为了打开目标页而把源页无关区域顶回顶部

## 5. Jump 对滚动的边界

跳转应该：

1. 打开目标宿主
2. 切到目标 tab / 区域
3. reveal 目标
4. 保持源视图其他无关区域不要被补偿逻辑顶回顶部

不要为了目标页面成功而牺牲其它视图的阅读位置稳定。

## 6. 手工回归矩阵

每次改页面布局或滚动逻辑，至少回归：

1. 在范式面板中部滚动一半，开 / 关 TOC，当前范式行仍在原位置附近
2. 在普通条目区中部滚动一半，开 / 关 TOC，当前条目仍在原位置附近
3. 开启范式面板后切换 `范式面板 / Tab里面`，页面不突然回顶
4. 开启次级面板时，不出现上跳
5. 存在 `pending focus` 的跳转场景，显式定位优先
6. 已 Pin 的场景，用户主动固定的位置仍能恢复

## 7. 明确禁止

1. 多轮延时 restore 反复抢页面位置
2. 只看 `scrollTop` 数值就判断“修好了”
3. UI-only rerender 抢占显式 reveal / focus 链路
