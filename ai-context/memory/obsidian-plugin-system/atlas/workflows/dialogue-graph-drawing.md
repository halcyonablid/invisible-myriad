# 对话绘图 / Dialogue Graph Drawing

status: active
updated: 2026-09-23

## User semantics

Source status: confirmed_by_user. Update: corrects + refines.

The user wants drawings based strictly on their actual groups, nodes and directed connections, including multiple group memberships. The rejected four editorial columns did not meet that requirement even though original group badges remained. A visual enclosure or heading communicates a classification; preserving raw membership metadata alone does not preserve that meaning.

Ontology Meta Hub's 对话布局 is a single authored, frozen drawing maintained through conversation. Opening the drawing shows the saved version. Live additions and other live graph changes do not silently enter it. A conversation update can deliberately revise the drawing with a new bounded source snapshot. Source graph ownership remains with Hub; this projection is not a second live graph owner.

## Readability experience

### 2026-09-23 In-place canvas correction

Source status: confirmed_by_user. Update: corrects/refines. The user rejected opening the saved layout in a separate window: the drawing belongs in the existing graph canvas, with its existing right-side node/edge/group details, comments and attachments. Frozen membership/labels/geometry and live owner details are separate concerns. A stable-ID lookup may read current details; explicit user actions use the original owner mutation path. Opening/selecting a saved picture does not itself change owner data or the slot. Archived/missing identities need an explicit unavailable message, and reciprocal directions can be partly unavailable without silently replacing identities.

After the user explicitly confirmed deployment, the independently reviewed inline implementation from `state/staging/ontology-dialogue-inline-20260923/` was published to Runtime/Dev/Mirror, and the revised repository Skill was synchronized globally on 2026-09-23. File-level verification passes; native loaded-host acceptance awaits reload. This supersedes the modal as the intended interaction, not the original-group or single-slot requirements. Switching back restores the original canvas view; ordinary detail refresh retains the frozen picture. The native group list addresses current owner details while the picture keeps saved groups and memberships.

Source status: confirmed_by_user for the crowded-line observation; inferred for general layout guidance; confirmed_by_code only for the staged checks described in the engineering record.

Separate route identity and visual clearance. Non-overlapping paths can still be too close to follow. Inspect full paths, short endpoint approaches, bends, arrowheads, group headers and card interiors. Size routing corridors for actual occupancy, then recheck at the intended zoom. Enlarging the canvas can make an apparently improved drawing unreadable when fitted to the same viewport.

Group-preserving monotone corridor expansion is one useful local technique when the existing ordering is already valid: keep card sizes and membership, expand empty bands, move paths and recompute frames, then validate all geometry. It is not a universal layout algorithm. Repositioning and rerouting remain options; do not bake a particular number of columns or pixel gap into user semantics.

Different Hub transitions have independent paths; reciprocal directions can use one visual path with two arrows and separate edge identities. See [independent route experience](../../../../REFERENCE_BOUNDARIES.md#ref-294)（外部来源未随包提供）. Hover tracing supports reading, but does not replace improving the default full drawing.

## Activation and maintenance

Repository Skill: [dialogue-graph-drawing](../../../../REFERENCE_BOUNDARIES.md#ref-295)（外部来源未随包提供）. Use it for conversational drawing or revision of existing system graphs. It reads Framework, this workflow and the relevant plugin page; plugin implementation also uses obsidian-system-plugin-dev. The publication-time repository Skill was installed in the user global Skill directory on 2026-09-23 after explicit confirmation, with matching files at that publication. The inline-corrected SKILL.md is now installed globally and matches the repository source (SHA-256 `9a30f57c23149c1c5029c3826a1d27f720328158849a3188f82339bf94687433`); agents/openai.yaml remains unchanged.

Maintain stable meanings here and implementation status in [ontology-meta-hub](../plugins/ontology-meta-hub.md). Framework holds navigation and update policy; the Skill holds repeatable execution decisions. Temporary coordinates, user node labels, test fixtures and metrics stay in the active project. Follow [update protocol](../../framework/update-protocol.md), including source status and updated/not_updated/deferred outcomes. This workflow applies the existing [LLM Wiki operating model](../knowledge/llm-wiki-operating-model.md); it does not require a new Skill per Atlas page.

## Evidence and limits

- User conversation 2026-09-23: rejected invented four columns; required actual groups/nodes/connections; identified dense lines; requested skill-creator and durable Atlas/Framework maintenance.
- Engineering trace: [strict groups and spacing](../../../../REFERENCE_BOUNDARIES.md#ref-296)（外部来源未随包提供）.
- Published source: repository `state/staging/ontology-dialogue-groups-20260923/`; publication is recorded separately in `change-records/2026/2026-09/20260923-145734-dialogue-layout-publication.md`. Native loaded-host acceptance remains pending.
- The supplied WeChat link could not be retrieved in this session. No article-specific claim is used as evidence.
- Question Map: existing FW-009 covers this activation/maintenance loop; no new macro question is required.

- Inline publication trace: [original-canvas publication](../../../../REFERENCE_BOUNDARIES.md#ref-297)（外部来源未随包提供）. Saved slot and business data were not changed.


### 2026-09-30 Current-state drawing refresh (candidate)

Source: confirmed_by_user request to redraw Ontology state transitions through this Skill. A new conversation update deliberately recaptures the current active state/group/edge projection; old archived endpoints do not silently reappear from the previous frozen slot. Exact excluded identities and raw original memberships remain in bounded staging provenance. Comment/position-only source revision changes should be distinguished from node/edge/group semantic drift before publication.

Current candidate was checked using the installed renderer in headless Edge with mocked Obsidian; full/detail screenshots and complete-route measures are project artifacts in state/staging/ontology-dialogue-refresh-20260930. Tested opening/selection/zoom/return and owner-detail action isolation do not prove native loaded-host acceptance. No new generalized layout algorithm claim; selecting a narrower feasible arrangement improved this particular graph without reclassifying user groups.

Status: candidate_only; existing frozen slot unchanged. Trace: [drawing record](../../../../REFERENCE_BOUNDARIES.md#ref-298)（外部来源未随包提供）. Existing Skill is sufficient and was not changed.


### 2026-09-30 对话图稿已替换
用户明确批准替换后，revision 2062 的 15 节点 / 21 关系 / 8 分组图稿已同步 Runtime、Dev、Mirror 的 dialogue-layout.json；三处 SHA-256 均为 `84a0beaa6d62b07178c60ecbf3953110b8ed06ae01e685c75538aabc148306ad`。发布前语义漂移检查通过，插件其余顶层文件逐字节哈希保持不变。仅替换冻结图稿，不修改实时图、评论、附件及插件代码。备份与 rollback_source：`D:\han\学习的文件夹\8- 自己的系统设计与开发\卡片对话式工作流\agent-end-to-end-blog-writing-main\state\backups\ontology-dialogue-release-2026-09-30T03-03-41-851Z`；before_hashes 见其中 hashes-before.json，after_hashes 与 verification 见 state/staging/ontology-dialogue-refresh-20260930/deployment.json。配套教练说明：output/reports/ontology-state-transition-coach-20260930.md，区分设计关系、自述与待验证假设。状态 confirmed_by_code（磁盘部署），未声称原生 Obsidian 界面验证。
