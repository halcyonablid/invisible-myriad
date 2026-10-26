# Plugin: view-group-hub

status: confirmed_by_code
updated: 2026-09-30
delivery: staged_and_repository_verified_runtime_pending

## Role

Environment-only native-leaf grouping and switching. Two menu columns group execution/collection and time/ontology views. Candidate 0.2.1 adds 每日 Note 回看 immediately below Ontology 元表格 in 时间与本体 (`confirmed_by_user`). Eight member leaves plus one controller retain their own owners and lifecycle.

## Contract

- Daily member: plugin id `daily-note-review`, view type `daily-note-review-view`, key `dailyReview`, sourceBound false. Uses the registered native view, not an opener command that could select a different leaf.
- Hub owns grouping UI and managed leaf/source identity only. It never owns/writes Daily history, notes, Keyword, Ontology, or other member business data.
- Existing same-stack adoption, source-bound Workspace/Collection checks, duplicate ambiguity, serialized idle prewarm, focus authority, deadline/cancellation, missing-owner disablement and native-header fail-open remain unchanged.
- Ordinary retained-member switching activates the existing leaf, without `setViewState`, creating another leaf or owner open API. Explicit repair remains necessary for closed members.
- Counts derive from MEMBERS; ordinary switching evidence now requires two user-paced rounds across all eight members (16 samples). Do not interpret old seven-member samples as coverage of the new member.

## Verification and evidence boundary

Extended original Node behavior suite passes (8-member partition, 16-sample coverage, lifecycle/focus/source/fail-open). Edge mocked-host menu verifies order under Ontology and missing/enabled Daily states. Native header integration, loaded-owner refresh cost and real user-paced switching remain `unknown`, pending runtime deployment/reload. No native speed claim is made.

Related: [Daily Note Review](daily-note-review.md), [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-275)（外部来源未随包提供）.


## 2026-09-30 approved runtime deployment

View Group Hub 0.2.1 reviewed program files are now deployed to the sole open NEWERA vault, D:/han/最新的/NEWERA2024年4月17日/NEWERA. Runtime/Dev/Mirror deployed-file hashes agree. Existing enablement/settings and activity history were left untouched; source code hash verification does not prove a native reload. Reload the two plugins or restart Obsidian to activate. Real daily restart/history and user-paced view-group switching remain native acceptance items. Source status confirmed_by_code; user authorization confirmed_by_user; update refines. [Deployment evidence](../../../../REFERENCE_BOUNDARIES.md#ref-276)（外部来源未随包提供）.


## 2026-09-30 Time-block entry (repository candidate 0.2.2)

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code

Adds 时间块记录 immediately below 每日 Note 回看 in 时间与本体. Nine native member leaves plus the controller; two-round switching evidence now requires 18 samples. Member key timeBlocks consumes Mandala view type mandala-time-blocks-capture-view and getTimeCaptureSourceNotePath(). Mandala remains the sole record/draft owner. Collection Card is an adjacent member, not the owner of this menu or the new time-block view.

Selection checks current source before focusing a retained time-block leaf; changed or cleared source requires explicit repair/configuration and preserves the old leaf/draft. Missing-source guidance points to Mandala settings. Matching retained selection does not reset view state. Mocked tests verify ordering, unavailable-provider state and source rejection; native switching/latency remains unknown. Runtime still has the earlier deployed 0.2.1 until separately approved installation.

Update: refines existing environment-only grouping contract. [Mandala provider](mandala-time-blocks.md); [engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-277)（外部来源未随包提供）.


## 2026-09-30 Time-block native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK就请部署”. Mandala 0.1.9 and View Group Hub 0.2.2 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-278)（外部来源未随包提供）.


## 2026-09-30 Timeline collection cleanup and native group entry

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Candidate 0.2.3 adds Timeline 时间线 as the second member in 时间与本体: 时间框架 -> Timeline 时间线 -> 下一步行动台 -> Ontology 元表格 -> 每日 Note 回看 -> 时间块记录. Ten native members, 20 samples for two-round user-paced switching evidence. Member timeline uses plugin timeline-planner, existing viewType timeline-planner-view, sourceBound:false to reflect the owner's plugin-wide source behavior. Hub never calls activateView (which can refresh planning dates), reads owner JSON, or resets retained native state on ordinary switching. Existing timeBlocks source guard and all member compatibility are preserved.

Runtime installation is pending separate task-specific approval; loaded native UI/scroll/multiwindow and switching latency remain unverified. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-279)（外部来源未随包提供）.


## 2026-09-30 Timeline cleanup and grouped entry — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. Timeline 0.1.1 and View Group Hub 0.2.3 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-280)（外部来源未随包提供）.


## 2026-09-30 日课 native tab and performance boundaries

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

View Group Hub 0.2.4 adds 日课 below 时间块记录 in the right 时间与本体 column. Timeline stays right second. There are eleven members and twenty-two minimum per-member grouped/baseline performance samples. dailyLessons consumes Mandala native view type mandala-daily-lessons-view and the existing getTimeCaptureSourceNotePath source-identity provider; no new business data reader is added to Hub. Source mismatch/clear prevents selection and keeps old-source leaves/drafts. Retained selection uses setActiveLeaf only. The existing explicit-repair and prewarm policy is preserved; first initialization still has renderer cost. Collection Card is an adjacent member, not this menu owner.

Runtime installation awaits separate package approval. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-281)（外部来源未随包提供）.


## 2026-09-30 日课 native tab — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “OK请部署”. Mandala 0.1.10 and View Group Hub 0.2.4 are installed in the proven NEWERA runtime; the five changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-282)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

View Group Hub 0.2.5 presents three display groups: 执行与收集 (项目执行总览 / Workspace Mount / GTD 待办事项 / Collection Card); 执行过程 (下一步行动台 / Ontology 元表格 / 时间块记录 / 日课); 回顾与长期规划 (时间框架 / Timeline 时间线 / 每日 Note 回看). This supersedes the earlier two-column display placement. Timeline is second within the rightmost review/planning column. Display GROUPS is separated from the original MEMBERS catalog; all eleven member definitions, source contracts and catalog/bootstrap/prewarm order remain exactly unchanged. Wide menus use three top-aligned columns and one spanning repair action; at <=720px, existing single-column fallback remains with viewport-bounded scroll. Controller headings and group count reflect the same three display groups. No owner plugin or business data changes.

Runtime installation awaits separate package approval. [Engineering evidence](../../../../REFERENCE_BOUNDARIES.md#ref-283)（外部来源未随包提供）.


## 2026-09-30 Hub three-column menu — approved installation

Latest delivery status: runtime_dev_mirror_synced_native_reload_pending. User explicitly authorized this reviewed package with “请部署”. View Group Hub 0.2.5 are installed in the proven NEWERA runtime; the three changed program files match the reviewed repository candidates. Ownership, compatibility and user-data boundaries above remain unchanged. Native reload, real UI/scroll/multiwindow and user-paced switching acceptance remain unverified; mocked-host evidence is not native acceptance. Update: refines; evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment authorization). [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-284)（外部来源未随包提供）.


## 2026-10-01 Weekly tracking member

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code
update: refines

Hub 0.2.6 adds weeklyTracking / 周追踪 below 每日 Note 回看 in 回顾与长期规划, opening Mandala mandala-weekly-tracking-view with mandalaSourceNotePath source binding. The original eleven-member catalog order is unchanged; the new twelfth member is appended for bootstrap/prewarm. Hub remains environment-only and does not own weekly business data. [Engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-285)（外部来源未随包提供）.


## 2026-10-01 Weekly native performance — approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this reviewed package with “请部署”. Mandala0.1.12, PEO0.1.6 and Hub0.2.6 main.js/manifest.json are installed in the proven NEWERA runtime. Program hashes match reviewed Dev/Mirror candidates. No business JSON/settings/index copied and no plugin reload triggered. Prior ownership and safety contracts remain; native UI/latency acceptance is still pending. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-286)（外部来源未随包提供）.


## 2026-10-01 Weekly source resolution correction

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code, confirmed_by_user
update: corrects

User observed Hub weekly source-note-unproven-configure-settings. Runtime Mandala source is configured and exists; Hub0.2.6 accidentally omitted weeklyTracking in three Mandala-specific branches. Hub0.2.7 includes weeklyTracking alongside timeBlocks/dailyLessons for getExpectedSourcePath, repair notice and select-time source checks. Mandala getTimeCaptureSourceNotePath remains source authority; saved Hub identities cannot override it. Missing owner source stays unavailable, wrong-source leaves/drafts remain retained pending explicit repair. This corrects the earlier weekly integration claim; no new schema, source discovery scan, Mandala change or business write. Node behavior regression passes; native reload pending. Framework/Atlas update check: updated, FW-019 consumer contract correction. [Trace](../../../../REFERENCE_BOUNDARIES.md#ref-287)（外部来源未随包提供）.


## 2026-10-01 Weekly source fix approved installation

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (deployment approval)
update: refines

User approved this repair package with “确认”. Hub0.2.7 main/manifest installed in proven NEWERA runtime. Weekly source lookup, repair notice and source-switch guard now share the Mandala owner path used by daily lessons/time blocks. Existing source note and business data remain unchanged; old leaves/drafts retained. No native reload or live UI acceptance claimed. [Deployment record](../../../../REFERENCE_BOUNDARIES.md#ref-288)（外部来源未随包提供）.
