# Communication Preflight Checklist

## 1. 用途

新 bridge、新 capsule 类型、新 bus 事件、新通信插件，默认先过这张表。

## 2. 必查项

1. host 身份是否唯一
2. 是否禁止 active view fallback
3. 环境态 / 内容态是否分清
4. bridge 最小接口是否定稿
5. 拒收规则是否写清
6. restore 后是否 verify
7. queued 是否闭环
8. console 字段是否标准化
9. 测试矩阵是否覆盖多 host / mismatch / timeout
10. 是否已有独立 verifier

## 3. 正式来源

完整模板背景来自：

1. `64-跨插件通信插件开发前必过checklist模板-20260409.md`
