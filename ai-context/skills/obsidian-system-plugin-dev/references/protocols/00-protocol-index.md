# Protocol Index

## 1. 关系总则

这一层是后续开发的主协议树。

规则分四层：

1. `protocols/primary/`
   主协议，属于 canonical source
2. `protocols/domain/`
   领域协议，服务特定功能面
3. `standards/`
   横切硬标准，所有主协议共同服从
4. `appendices/`
   视觉语义、检查清单、运维判读等附录

`legacy/` 只保留旧稿，不再作为主引用入口。

## 2. 一级主协议

1. [host-identity-and-bridge-discovery.md](primary/host-identity-and-bridge-discovery.md)
   宿主身份、bridge 发现、host 选择、jump 主链
2. [paradigm-mount-identity-and-toc-state-chain.md](primary/paradigm-mount-identity-and-toc-state-chain.md)
   范式挂载身份、mounted roundtrip、TOC / 定位状态链
3. [queued-restore-runtime-protection.md](primary/queued-restore-runtime-protection.md)
   queued restore、runtime guard、最终稳定落地
4. [verify-allows-evolution.md](primary/verify-allows-evolution.md)
   强校验、漂移告警、非破坏性 verify 合同
5. [local-write-view-stability.md](primary/local-write-view-stability.md)
   本地写入、rerender、锚点恢复、显式定位优先

## 3. 领域协议

1. [keyword-bus-pattern.md](domain/keyword-bus-pattern.md)
   Tab 普通条目关键词胶囊、抽屉、BUS

## 4. 横切标准

1. [../standards/system-boundaries.md](../standards/system-boundaries.md)
2. [../standards/audit-trail-protocol.md](../standards/audit-trail-protocol.md)
3. [../standards/console-logging-standard.md](../standards/console-logging-standard.md)
4. [../standards/release-guardrails.md](../standards/release-guardrails.md)

## 5. 二级附录

1. [../appendices/paradigm-panel-visual-state-semantics.md](../appendices/paradigm-panel-visual-state-semantics.md)
2. [../appendices/communication-preflight-checklist.md](../appendices/communication-preflight-checklist.md)
3. [../appendices/console-ops-runbook.md](../appendices/console-ops-runbook.md)

## 6. 迁移原则

1. 新开发默认先看主协议，再补横切标准
2. 标准不要散写进每个主协议全文，避免双写漂移
3. 旧稿若仍被引用，先放 `legacy/`，迁完再删
