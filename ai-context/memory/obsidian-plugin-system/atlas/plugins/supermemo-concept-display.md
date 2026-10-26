# Plugin: supermemo-concept-display

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
created: 2026-08-22

## Role

status: confirmed_by_user_and_code

SuperMemo Concept Display provides complementary cognition surfaces inside one plugin. The capsule surface manages Concept objects and their existing Concept-to-Concept hierarchy. The subject structure tree builds the global SuperMemo framework as an independent layer, then assigns each Concept to at most one structure node. The Antinet tree organizes Keyword Index objects through EVA relations, while the meaning-capsule surface turns each active mount relation into a locally named cognitive entry.

The two layers must not be conflated: a Concept remains a card-making and recall object, while a structure node expresses where that Concept sits in the whole subject architecture.

## Owns

status: confirmed_by_code

- Existing shared Concept records under `localStorage[supermemo_concepts_final_v3]`.
- Independent subject-tree nodes, permanent tree/stable-ID reservations and one-node Concept assignments under `supermemo_concept_structure_tree_v1`.
- Tree-only environment state under `supermemo_concept_structure_tree_ui_v1`.
- Bounded cross-key recovery evidence under `supermemo_concept_structure_tree_tx_v1`.

## Provides

status: confirmed_by_code

- Existing `胶囊` surface for Concept hierarchy, notes, keywords and editing.
- New `主体结构树` Tab with arbitrary-depth nodes, search, zoom, collapse, viewport restoration, archive/restore and an assignment inspector.
- New `Antinet 框架` Tab with an independent arbitrary-depth tree and EVA Meta keyword/drawer mounts; each mount may have a local alias without changing Keyword Index ownership.
- New `义胶囊` Tab that projects every active Antinet-to-Keyword relation and groups valid aliases by their uppercase locator letter. The suffix may contain Han text, Latin letters and digits, such as `J记录2` or `FFlight11`; source keywords and Antinet breadcrumbs remain searchable projection evidence without occupying a visible annotation row.
- Parent-node moves preserve the entire descendant branch by changing only the moved node's parent pointer. The candidate picker excludes self, descendants and archived nodes, shows breadcrumb paths, and filters them through a searchable input.
- Capsule-to-tree reveal that expands ancestors, selects the exact structure node and pulse-highlights the Concept row.
- Tree-to-capsule reveal from assigned Concept rows and the structure inspector, with exact one-shot capsule highlighting and latest-request-wins sequencing.
- Read-only capsule assignment indicators: `已挂树`, `已挂树·已归档` and `结构失联`, projected from the existing subject-tree assignment store.
- Stable Concept identity that survives Concept rename and never reuses historical reservations.
- Explicit import/delete transaction recovery, strict candidate validation and fail-closed malformed/future schemas.
- Plugin-owned Tree input dialogs for add, rename and move, with explicit cancellation, IME-safe submission and lifecycle cleanup.
- Numeric-aware node-name ordering at every Tree depth; stored `order` remains only a same-name stability fallback.

## Consumes

status: confirmed_by_code

- No Mandala, Workspace, EVA, Ontology or Project Overview business data.
- `obsidian-sma-client` remains a read-only consumer of the existing shared Concept root; additive `stableId` fields do not change its hierarchy semantics.

## Contract Model

```text
Concept capsule hierarchy
  Concept stableId ──single assignment──> Subject structure node

Subject structure tree
  structure node ──contains──> child structure nodes
  structure node ──projects──> assigned Concepts
```

- Tree node and Concept are separate stable objects.
- Rename changes labels, not stable identity.
- Ordinary structure deletion is archive/restore, not purge.
- UI restoration writes only the UI owner; opening/restoring never writes Concept or Tree business state.
- Cross-key deletion/import uses a bounded transaction lock; incomplete or invalid evidence blocks conflicting writes.

## Guardrails

status: confirmed_by_code

- Missing stores render empty state with zero write; malformed/future stores retain raw localStorage and fail closed.
- Tree mutations use revision/CAS and readback verification.
- First assignment adds only one `stableId` field to one freshly read raw Concept record.
- Import rejects unknown bundle versions, missing/malformed Trees, duplicate IDs/stable IDs, missing/cyclic Concept parents and assignments without an active Concept.
- Invalid transaction locks can be cleared only after fresh Concept/Tree consistency proof and CAS; business data is never modified by lock clearing.
- Large-tree rendering occurs only while the Tree Tab is open.
- Obsidian plugin entry files must not use plugin-local top-level relative `require`; Electron resolves it from the renderer rather than the plugin directory. Fixed companion modules load only from fixed plugin paths through the vault adapter, and pure modules receive an explicit rejecting `require`.
- Electron does not provide browser `window.prompt`; Tree input uses an owner-local Promise dialog whose single active instance settles exactly once on submit, cancel, Escape, rerender or cleanup.
- Desktop Tree mode consumes the remaining ItemView height and gives scrolling to the Tree viewport and inspector. Capsule and manager surfaces retain their shared panel class and own normal vertical scrolling; narrow windows return to natural document flow.
- Tree sibling order is a pure projection: `label` with numeric/base comparison, then stored `order`, then stable node ID. Existing stores require no migration or writeback.
- Antinet sibling order follows the same pure name-based projection. Antinet tree data and UI state are separate localStorage owners, while EVA owns cross-plugin mount relations and Keyword Index owns keyword data.
- A meaning capsule is identified by EVA `relationId`, not by its alias. New alias writes require `^[A-Z][\p{Script=Han}A-Za-z0-9]+$`; missing and historical nonconforming aliases remain visible under `#` and are never silently rewritten. Existing mixed-character aliases that satisfy the expanded rule become valid projections without migration or writeback.
- Mounted-keyword clicks and source jumps are separate UI contracts: ordinary tree clicks reveal the local meaning capsule; capsule body clicks return to and highlight the exact Antinet node/mount; explicit source actions alone open the Keyword Index owner. EVA Meta mode keeps its capture behavior.
- Concept/tree navigation is also bidirectional but remains a projection: tree rows reveal Concept capsules, the existing capsule action reveals the assigned tree node, and assignment badges never mutate either owner while rendering.

## Evidence

- Repository Dev: `workspaces/26- supermemoconcept的改进/插件/supermemo-concept-display/`.
- Backup and hashes: `state/backups/supermemo-concept-tree-20260822-172500/`.
- Tree input/full-height backup and Dev hashes: `state/backups/supermemo-concept-tree-input-layout-20260822-190357/`.
- Model regression: `supermemo-concept-tree-model.test.js`.
- Storage/fault injection: `supermemo-concept-tree-storage.test.js`.
- Obsidian restricted-loader regression: `supermemo-concept-loader.test.js`.
- Final verifier Ptolemy `01a028b4-4f26-75f1-84ad-2765a4066b0d`: `PASS`, no P0/P1 and no blocking P2.
- Antinet model and UI regression: `supermemo-antinet-tree-model.test.js` and `supermemo-concept-tree-storage.test.js`; the latter covers searchable parent selection, self/descendant exclusion, archived-node exclusion, cancel/no-op zero-write behavior and top-level moves.

## Deployment State

Runtime/Mirror `0.2.0` were synchronized, but loaded Obsidian evidence exposed an Electron renderer resolution defect before `onload`: `require("./supermemo-concept-tree-model")` could not resolve. After explicit confirmation, Repository Dev `0.2.1` was synchronized to Runtime and Mirror through a five-file allowlist. Loaded `0.2.1` then exposed two UI defects: Electron rejected `window.prompt`, so Tree add appeared inert, and the Tree workspace did not consume the remaining ItemView height. Version `0.2.2` replaced prompt with a lifecycle-safe owner dialog and filled the desktop Tree surface without stealing capsule/manager scrolling. Version `0.2.3` then changed only the pure Tree sibling projection to numeric-aware node-name ordering, preserving stored order as a same-name fallback. Its five-file deployment aligns `5/5` across Dev/Runtime/Mirror; 18 syntax checks and nine loader/model/storage suites pass, and three `data.json` sentinels remain unchanged. Independent deployment verifier Ptolemy returned `PASS`; loaded Tree ordering and wide/narrow/resize UI smoke remain pending.

Bayesian update: `adds` the subject-structure layer, `splits` Concept hierarchy from whole-system subject architecture and `refines` the Obsidian companion-module loading, Electron input/layout and non-destructive Tree projection boundaries. Source status is `confirmed_by_user_and_code`; Dev, Runtime and Mirror disk state is verified at `0.2.3`.

## Antinet Move Semantics

```yaml
claim:
  statement: "在主体结构树和 Antinet 树中，移动节点只改变该节点的 parentId；其后代继续保持原父子链，因此整棵分支随根节点一起移动。移动目标通过带面包屑路径的可搜索选择器确定。"
  layer: "符号入口 / 拓扑地址"
  owner: "supermemo-concept-display"
  provider: "supermemo-concept-display tree models"
  consumer: "SuperMemo Concept Display UI"
  contract_type: "UI contract / localStorage data model"
  source_status: "confirmed_by_user_and_code"
  evidence: "用户要求节点与分支一起移动；moveTreeNode/moveNode 仅更新移动节点 parentId；候选过滤和搜索选择器已由代码与回归测试证明。"
  affects_question: "FW-004"
  update_type: "refines"
```

This is a local tree operation, not a Concept reassignment or EVA relation rewrite. The picker is deliberately bounded to active nodes and excludes the moved node's descendant set, preventing cycles while keeping the existing branch context intact.

## Deployment Update

- After explicit user confirmation on 2026-08-23, the verified `0.3.0` allowlist was synchronized to the proven Runtime and Repository Mirror.
- Eight files align across Dev/Runtime/Mirror: `main.js`, `supermemo-concept-display-engine.js`, both tree models, `styles.css`, `manifest.json`, `versions.json` and `README.md`.
- Runtime/Mirror syntax checks and feature sentinels pass; both manifests report `0.3.0`. Existing `data.json` files remained byte-identical.
- Deployment backup and hashes: `state/backups/supermemo-antinet-deploy-20260823-001500/`.
- Loaded Obsidian UI smoke remains pending plugin reload.

## 2026-08-23 - Antinet Keyword Relation Compatibility

status: runtime_mirror_synced_static_verified_ui_smoke_pending

- Observation: Antinet had two existing EVA outgoing relations to Keyword Index, but the inspector displayed zero mounts because the historical records used EVA's default `引用` relation type rather than the newer `antinet-keyword-mount` type.
- Contract refinement: SuperMemo remains a consumer of EVA's read-only relation snapshot. It accepts the formal Antinet mount type and, only when the target resolves to Keyword Index, reads the legacy `引用` type as a compatibility projection. It does not rewrite, delete or migrate historical EVA records.
- New writes: the Antinet Meta capture call passes `{ reason: 'antinet-mount', relationType: 'antinet-keyword-mount' }`; the synchronized EVA provider now preserves that options object and writes the requested relation type.
- Evidence: Runtime data contained 390 relations, two Antinet-to-Keyword relations and zero formal `antinet-keyword-mount` records. Dev/Runtime/Mirror provider and consumer hashes now align; EVA `data.json` stayed byte-identical.
- Framework/Atlas update: `updated`, Bayesian label `refines`. No owner or persisted-data boundary changed; this records a backward-compatible provider/consumer contract correction.

## 2026-08-23 - Antinet Meaning Capsules

status: runtime_mirror_synced_static_verified_ui_smoke_pending

- Observation: mounted Antinet keywords need a compact local cognition surface whose title expresses the keyword's meaning in its current tree position, while preserving both the tree context and the owning Keyword Index object.
- Projection contract: each active Antinet-to-Keyword EVA relation becomes one meaning capsule. SuperMemo owns only the relation-local alias and last-known label already stored in `mountPresentationByRelationId`; no Keyword or EVA relation data is copied or migrated.
- Naming contract: valid new aliases use `uppercase locator letter + Han text`, such as `J记录`. The locator letter drives alphabet navigation and ordering. Missing or historical nonconforming aliases remain visible under `#` with an adjustment state.
- Navigation contract: ordinary mounted-keyword clicks reveal the corresponding meaning capsule; capsule body or locate action expands Antinet ancestors and highlights the exact node plus mount row; the explicit source action opens the Keyword Index capsule. Meta capture remains a separate interaction mode.
- UI state: `activeSurface=meanings` is environment state and may persist. Search and pending reveal requests remain session-only. Opening or rendering the surface performs no owner write.
- Evidence: Repository Dev `0.4.0` syntax, loader, model and storage/UI suites pass, including alias admission, legacy alias projection, ordinary/Meta click separation, source action isolation and bidirectional reveal.
- Framework/Atlas update: `updated`, Bayesian label `refines`; no new owner, persisted schema or Question Map entry is introduced.
- Deployment: after explicit user confirmation, the five-file SuperMemo `0.4.0` allowlist was synchronized to the proven Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align `5/5`; Runtime syntax passes. EVA and Keyword business-data sentinels remain byte-identical.
- Rollback evidence: `state/backups/supermemo-antinet-meaning-deploy-20260823-224736/`. Loaded Obsidian interaction smoke remains pending plugin reload.

## 2026-08-23 - Concept Tree/Capsule Bidirectional Reveal

status: runtime_mirror_synced_static_verified_ui_smoke_pending

- Observation: a Concept visible inside the subject structure tree needs a direct route back to its capsule, and the capsule needs to show whether it is already mounted in the tree.
- Projection contract: tree Concept rows and inspector entries reveal the exact capsule. Capsules derive `已挂树`, `已挂树·已归档` or `结构失联` from the existing assignment store; no assignment or Concept data is duplicated.
- Stability contract: reveal highlights are session-only and latest-request-wins. Missing Concepts or missing structure nodes fail closed and perform zero owner writes.
- Visual refinement: meaning capsules wrap compactly; subject/Antinet node names remain complete, left-aligned and multiline; the enlarged Tree toolbar and inspector no longer overlap the canvas.
- Evidence: Repository Dev syntax and focused loader/model/storage/UI/EVA routing suites pass. Independent verifier Carver returned `PASS` with no P0/P1/P2 findings.
- Deployment: after explicit confirmation, engine and stylesheet were synchronized to Actual Runtime and Repository Mirror. Dev/Runtime/Mirror hashes align `2/2`; Runtime/Mirror syntax and focused Dev UI/storage regression pass; EVA/Keyword sentinels remain unchanged. Deployment backup: `state/backups/supermemo-concept-tree-capsule-navigation-deploy-20260823-233624/`.
- Framework/Atlas update: `updated`, Bayesian label `refines`; no owner, persisted schema, Question Map, Skill or rule change.

## 2026-09-04 - Compact Meaning Capsules And Mixed Alias Suffixes

## 2026-09-15 - Project Meaning Capsules (deployed bytes, native smoke pending)

- User-confirmed semantics: multiple named project pages; dropdown switch; a relation-local meaning capsule can belong to multiple projects without duplicating its alias, EVA relation or Keyword object.
- SuperMemo owns a separate localStorage content key `supermemo_antinet_meaning_projects_v1` (schemaVersion 1, revision, projectsById, relationProjects, draftsByView). The existing Antinet tree store and EVA/Keyword owners remain unchanged. Absence projects legacy relations into 默认义胶囊 without startup writes. 全部 supports discovery.
- Meta capture retains the existing provider protocol: an explicitly armed view/session snapshots relation IDs, then handles capture-target after EVA clears source identity; the new relation receives a project membership chooser. Individual toggles fresh-read and verify writes. Cross-project reveal selects a containing project.
- Project name drafts are view-scoped; recovery cannot overwrite different nonempty current input. Invalid/future content stores reject writes rather than normalizing.
- Evidence status: confirmed_by_user + confirmed_by_code; update label refines. Disk deployment only; native Obsidian Meta and reload smoke remains pending. No claim of cross-device localStorage synchronization.
- Deployment trace: `state/backups/supermemo-meaning-projects-deploy-20260915-200412/`; engine/styles aligned in all three roles. See `change-records/2026/2026-09/20260915-200412-supermemo-meaning-projects-deploy.md`. No Question Map or Skill change; existing provider/consumer protocol preserved.

### Prior 2026-09-04 details

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending

- Observation: when the number of meaning capsules grows, the duplicate circular locator letter, repeated source/path annotation rows and separate target button consume space without adding a distinct action. The capsule body already performs the exact Antinet relation reveal.
- UI contract: the compact capsule keeps the alias, edit action and explicit Keyword Index source action. Clicking the capsule body still expands Antinet ancestors and highlights the exact `relationId`; the duplicate `locate-fixed` action is removed. Alphabet navigation and group headings remain.
- Projection contract: original Keyword labels and Antinet breadcrumbs remain in the read-only search projection but are no longer rendered as annotation rows. Stable `data-antinet-meaning-relation-id` and pending-reveal behavior remain unchanged.
- Naming contract: the first ASCII uppercase letter remains the locator. The suffix now accepts Han text, ASCII letters and digits. Lowercase locator starts, an empty suffix, whitespace and punctuation remain invalid. Existing qualifying mixed aliases require no migration and rendering/searching performs zero owner writes.
- Density contract: wide and medium surfaces keep fit-content wrapping and inline actions; only truly narrow surfaces may occupy the available row width, while long mixed aliases remain ellipsized rather than widening the parent.
- Evidence: after explicit user confirmation and a fresh `PASS / ALLOW_DEPLOYMENT` preflight, engine/styles/README were synchronized to the proven Actual Runtime and Repository Mirror. Runtime/Dev/Mirror align at `50CF1037...F0431`, `F1CF4272...70190` and `088ADD71...303E`; deployed-byte syntax plus storage/UI, loader and both model suites pass for isolated Runtime/Mirror probes, and 13/13 protected sentinels remain unchanged.
- Deployment boundary: this is static disk evidence only. No plugin reload, owner data, EVA/Keyword data, registry, localStorage, API/event/schema/bridge or model file was written. Loaded-host wide/medium/narrow density, keyboard focus, exact body reveal and source-action smoke remain pending.
- Rollback: `state/backups/supermemo-antinet-meaning-compact-ui-deploy-20260904-143900/`, using role-local Runtime/Mirror copies only.
- Framework/Atlas update: `updated`; Bayesian label `refines + no_model_change`. FW-004 is refined without a new Question Map or ownership change.

## 2026-09-15 - Explicit Unassigned Meta Membership

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending

- User-confirmed semantics: `一般构型义胶囊` is a real meaning-capsule page parallel to named project pages, not the automatic destination for every new Meta mount.
- Compatibility projection: a historical relation with no `relationProjects[relationId]` key continues to appear in `一般构型义胶囊` without migration or restore-time writeback. An explicit empty array means unassigned and appears only in `全部义胶囊` until the user chooses one or more pages.
- Meta write contract: only an unambiguous single newly mounted relation receives an explicit empty membership through the existing fresh-read/CAS owner mutation. Existing or concurrently assigned membership is never overwritten; ambiguous multi-relation deltas are not initialized.
- Failure boundary: failure to persist the project membership does not roll back or rewrite the successful EVA/Antinet relation. The UI reports that mounting succeeded but assignment must be retried.
- Evidence: staged syntax, five regression suites and headless UI preview pass. After explicit confirmation, the verified engine was synchronized to Runtime/Dev/Mirror at `18B5C648…2CCF`; all three isolated deployed-byte probes, syntax checks and protected program sentinels pass.
- Deployment boundary: only `supermemo-concept-display-engine.js` was copied. No localStorage, EVA relation, Keyword data, Antinet tree, plugin settings or other business data was read back and rewritten; the plugin was not automatically reloaded.
- Rollback: `state/backups/supermemo-meaning-unassigned-deploy-20260915-213222/` contains role-local pre-deployment engine bytes and the full hash ledger.
- Framework/Atlas update: `updated`, Bayesian label `refines`; no owner, schema version, EVA/Keyword protocol or Question Map change.


## 2026-09-20 - Ordinary Concept Capsule Pages (requested; not implemented)

implementation_status: requirements_reviewed_implementation_pending

### Confirmed user intent

status: confirmed_by_user

- The ordinary 胶囊 surface should support multiple named pages, analogous to the existing 义胶囊 page selector.
- One Concept capsule may belong to multiple pages simultaneously.
- All pages use the same Concept object and the same assignment in the shared 主体结构树. Pages do not create separate subject trees or duplicate Concepts.
- The screenshot's Antinet 框架 is the plugin's right-hand topology surface. Atlas and Framework are the repository's knowledge and governance layers used to review this request; they are not another plugin tree.

### Current implementation evidence

status: confirmed_by_code

- The ordinary renderDisplayView/renderCapsule path renders Concept parent/child nesting without named-page membership. Existing meaning pages instead key membership by EVA relationId in their own store.
- Concept stableId is allocated lazily by ensureConceptStableId; legacy Concepts may not have it. Render/read must not allocate identities or rewrite content.
- The v2 export contains sharedConceptStore, structureTree and treeUi; it does not yet carry the proposed Concept-page membership.
- deleteConcept currently starts the cross-owner deletion transaction only when a tree assignment exists. A future page-membership owner must also be covered even for a Concept with no tree assignment.
- The SMA client at workspaces/26- supermemoconcept的改进/插件/obsidian-sma/obsidian-sma-client/main.js consumes the shared Concept storage key. Page filtering must not replace the shared root with a filtered subset.
- Actual Runtime, Dev and Mirror engine SHA-256 at review: 18b5c648667d44ea3e38d6b974391ca5b787461cb60b9731f5808cd394482ccf. No plugin files or business stores changed in this review.

### Proposed design and implementation gates

status: proposed_not_implemented

- Keep page definitions/membership in a separate SuperMemo-owned store; reference Concept stableId, not editable labels or an EVA relationId. Meaning-page and Concept-page memberships remain distinct.
- Keep content, Concept parent/child hierarchy and single subject-tree assignment global. Page selection is a UI projection; removing membership is not Concept deletion or tree unassignment.
- Preserve necessary ancestors as display context for selected descendants. Context ancestors do not acquire page membership, and selecting a parent does not silently write membership to its entire subtree. Exact ancestor presentation remains a UI design choice.
- Tree-to-capsule reveal must make the target visible by choosing a containing page or the all-capsules view. Do not report successful reveal when a page filter hides the target.
- Decide and test general-page, missing-membership, explicit-empty and new-Concept defaults before implementation; existing meaning-page semantics are a useful precedent, not additional user confirmation for every Concept rule.
- Allocate stable IDs only on explicit mutations through the existing reservation/CAS protections. Rename, deletion/recreation, stale views and imported identities must not inherit another Concept's membership by label.
- Extend deletion, import/export and recovery boundaries to include page ownership. Deletion must handle membership even without a tree assignment; imports must not silently leave stale membership or lose page definitions. Preserve old bundles and shared-root consumers.
- Read/render/restore must perform zero Concept/tree content writes. Mutation failure preserves input and original stores; malformed/future membership schemas fail closed.

Framework/Atlas update check: updated. Bayesian label: refines. User intent is confirmed; the architecture above is a proposal, not deployed functionality. Existing FW-004 covers this UI/work-practice refinement; no new Question Map or Skill rule is introduced. Trace: change-records/2026/2026-09/20260920-supermemo-concept-pages-framework-review.md.


## 2026-09-20 Ordinary Concept pages: repository implementation

status: repository_implemented_runtime_deployment_pending
evidence_status: confirmed_by_code

Supersedes the implementation-pending status of the preceding design review for repository Dev/Mirror only. Actual Runtime remains on the verified baseline until secondary deployment confirmation.

- Ordinary capsules now have an all-pages view, default page, named pages, rename/create controls and a checkbox membership picker. One Concept can appear on multiple pages while retaining one global hierarchy and one subject-tree assignment.
- New owner key: `supermemo_concept_pages_v1`, schemaVersion 1, revision, pagesById, memberships keyed by Concept stableId, draftsByView. No shared Concept root schema, tree model, EVA relation or Antinet meaning-page key changes. SMA remains a shared-root reader.
- Historical missing membership resolves virtually to the default page without writeback. Explicit [] is unassigned and visible in all-capsules. Newly created Concepts start unassigned, with the membership picker open.
- Projection contains selected Concepts plus their necessary ancestor paths; ancestors are marked context, forced visible and do not gain membership. Tree reveal chooses a containing page or all-capsules. Current page lives in existing tree UI state.
- Membership uses fresh reads, root/page CAS and readback. Stable identity allocation occurs only on explicit mutation after live-journal checks. Uniform Concept save CAS prevents stale edits from erasing newly assigned identity; edit conflicts retain input.
- Concept deletion journal removes page membership even for [] and even without a tree assignment. Failed cleanup retains the journal. Export bundle v3 includes pages; v2/legacy imports explicitly reset page definitions/memberships/drafts. Page writes participate in import rollback and retry recovery.
- Malformed/future page stores refuse relevant writes. Inline page-name drafts persist per view; read/render does not write Concept/tree content.

Verification: five JS suites passed; independent verifier PASS; synthetic-data browser clicks covered new page, multiple memberships, removing one membership, switching to another page with the same tree badge. Loaded Obsidian/runtime UI smoke remains pending. The storage-test CSS sentinel was corrected to the pre-existing September 15 full-title wrapping contract, not a new CSS behavior.

Framework/Atlas update check: updated; Bayesian label: refines; existing FW-004 remains applicable. Trace: ../change-records/2026/2026-09/20260920-supermemo-concept-pages-implementation.md.


## 2026-09-20 Concept pages deployment
User explicitly confirmed “请部署”. Verified current sole-open runtime vault and unchanged baselines; copied only the independently reviewed engine/styles patch. Runtime/Dev/Mirror SHA-256 now agree; syntax and five isolated deployed-byte suites PASS. Protected runtime files unchanged. No business JSON, localStorage, settings or other plugin code written. Loaded-host smoke awaits plugin reload. Backup and full three-role hashes: D:\han\学习的文件夹\8- 自己的系统设计与开发\卡片对话式工作流\agent-end-to-end-blog-writing-main\state\backups\supermemo-concept-pages-deploy-20260920-064546. Framework/Atlas update: updated; evidence_status: confirmed_by_code; Bayesian label: reinforces + no_model_change.


## 2026-09-27 Tree node comments (repository verified, runtime deployment pending)

status: repository_implemented_runtime_deployment_pending
evidence_status: confirmed_by_code

- Subject structure and Antinet framework nodes now have optional plain-text `comment`, with Add/Edit description in the right inspector and a dedicated multiline editor. Prompts suggest question, inclusion and exclusion boundaries; text remains free-form.
- This content belongs to the node owner, `supermemo-concept-display`. It does not change Concept notes, page membership, meaning aliases, EVA relations or Keyword content.
- Missing comments are read as empty without migration. Comment-only writes preserve raw root/node fields and absent defaults; only target comment/updatedAt and root revision/updatedAt change. Existing rename/move/archive normalization preserves the optional string. Invalid comment types fail closed.
- Recovery storage uses independent `supermemo_tree_node_comment_draft_v1:<draftId>` keys per editor. Escape, overlay, close and rerender retain drafts. Ordinary close refuses to discard input if persistence fails; forced unload with unavailable storage cannot guarantee persistence. Copy is available. Recovery forks editor identity, and stale/orphaned drafts never silently bind to same-name nodes.
- Explicit save checks current node identity, lifecycle, subject transaction lock and base comment. Web Locks serialize cooperating comment editors; old non-comment writers retain existing optimistic safeguards. Unsupported lock environments refuse save and retain drafts. Clearing an existing comment and discarding a draft require explicit confirmation.
- Subject-tree comments travel in the existing Concept bundle's structure tree. Antinet remains outside that bundle; this change does not claim full Antinet export.
- Six JS suites passed; independent final code verifier PASS after missing-lifecycle compatibility correction. Isolated Edge full-engine synthetic smoke passed both inspectors, multiline input, Escape/reload/recovery/save and two-window conflict. Actual Obsidian reload/Web Locks compatibility remains pending.
- Runtime is unchanged; Dev and Mirror match the reviewed staging bytes. Deployment requires the existing secondary user confirmation.

Framework/Atlas update check: updated; Bayesian label: refines; existing FW-004 covers this input/work-practice change. No new framework rule or cross-plugin owner. Trace: `memory/obsidian-plugin-system/change-records/2026/2026-09/20260927-supermemo-node-comments.md`. Test/screenshot packet: `state/verification_inputs/supermemo-node-comments-20260927/`.


## 2026-09-27 Node comments deployment

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
evidence_status: confirmed_by_code

User explicitly authorized deployment. Re-proved the sole-open NEWERA runtime via Obsidian registry, enabled manifest and live window title; baseline hashes remained unchanged. Copied exactly the reviewed engine, styles and two tree models after fresh three-role byte backups. Runtime/Dev/Mirror SHA-256 agree. Six tests against isolated deployed-byte copies PASS; independent deployment verifier PASS. No live localStorage, business JSON, settings, EVA or Keyword data written. Existing non-target plugin sidecars were unchanged.

Reload the plugin before loaded-host UI and Web Locks acceptance. This is disk deployment, not a claim that the already-running view has loaded the patch. Prior synthetic Edge smoke remains separate evidence. Framework/Atlas update check: updated; reinforces, no_model_change. Trace: ../change-records/2026/2026-09/20260927-supermemo-node-comments-deployment.md.


## 2026-09-28 Assigned-only ordinary capsule filter

status: repository_implemented_runtime_deployment_pending
evidence_status: confirmed_by_code

- Ordinary 胶囊 toolbar provides 只看已挂主体结构树. This is a view projection intersected with direct membership of the selected Concept page, not a new content owner. Only assignments to existing subject nodes match; archived-node assignments retain their archived badge, while missing-node assignments do not match.
- Unmatched ancestors and descendants are hidden. A matching Concept whose direct parent is hidden becomes a display root; stored parentId, sibling order, stableId, assignments and page memberships remain unchanged. Direct matching parent-child nesting is retained.
- The boolean conceptTreeAssignedOnly belongs to the existing tree UI state and defaults to false. Explicit reveal of an unmatched capsule clears the filter; successful Concept creation clears it even if later page-membership initialization fails. Unreadable/invalid tree evidence shows an explicit diagnostic.
- Seven Node suites and isolated full-engine Edge synthetic UI smoke passed: exact matches, nested gaps, page intersection, archive/missing, persistence/reopen, reveal/new-item escape, narrow viewport and keyboard. Filter/render does not write Concept, page or tree content. Actual loaded Obsidian acceptance remains pending deployment/reload.
- Repository Dev/Mirror engine matches the reviewed staging patch; Actual Runtime remains unchanged pending secondary user confirmation. No external API, owner schema, EVA/Keyword/SMA consumer change.

Framework/Atlas update check: updated (this narrow Atlas claim); Bayesian label refines, no_model_change. Framework entry/question-map/registry/update-protocol and Atlas prior were reviewed; existing FW-004 covers this projection refinement, so no Question Map or Skill rule changed. Trace: memory/obsidian-plugin-system/change-records/2026/2026-09/20260928-supermemo-assigned-filter.md.


## 2026-09-28 Assigned-only filter deployment

status: runtime_dev_mirror_synced_static_verified_ui_smoke_pending
evidence_status: confirmed_by_code

User explicitly confirmed deployment. Sole-open NEWERA runtime identity and fresh baseline were verified; independent deployment review PASS / ALLOW_DEPLOYMENT. Only the reviewed engine was copied to Runtime. Runtime/Dev/Mirror now agree at SHA-256 17717fb3652a080392620dabb91e6391a00bf71ebb9bee65c40ffc2854db5385. Seven isolated deployed-byte suites and syntax PASS; 10 non-target Runtime sidecars unchanged. The initial storage probe lacked its sibling EVA source fixture; adding the read-only code fixture resolved it without altering deployed code. No business JSON, settings or live localStorage was written. Plugin reload and actual loaded-host smoke remain pending.

Framework/Atlas update: updated; reinforces / no_model_change. Backup: state/backups/supermemo-assigned-filter-deploy-20260928031513. Trace: ../change-records/2026/2026-09/20260928-supermemo-assigned-filter-deployment.md.


## 2026-10-01 Meaning capsule navigation choices

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code; request confirmed_by_user
update: refines

The meaning capsule external-link control exposes the same two choices on hover, keyboard focus and click: 打开 Keyword Index and 直接打开 Note. The first retains EVA.openNode(targetNodeKey); the second uses Keyword's existing public getKeywordNotesForNode(targetNodeKey) and openKeywordNote(path). Keyword remains the authority for stable identity, keyword/drawer scope and real note paths; SuperMemo does not decode addresses, guess the first note or open the Keyword carrier note. Zero notes gives feedback, one unique path opens directly, multiple unique paths produce a titled path-disambiguated chooser. Hover/focus performs no repository query.

Menus belong to the source view, stay within its document viewport, flip above near the bottom, and close on Escape, outside interaction, source scroll, resize, search redraw, full render or unload. Outstanding reads are discarded after close, source detachment or provider replacement. Existing meaning-body tree reveal and explicit Meta capture remain separate. No persisted schema, owner data, provider API or consumer migration changes.

Evidence: seven Node regressions and full-engine isolated Edge synthetic checks; native Obsidian reload/multiwindow/zoom/real-data acceptance not yet performed. Runtime remains unchanged pending this feature's own deployment approval. Existing FW-004 covers the navigation distinction; no new Question Map or Skill rule. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-supermemo-meaning-navigation.md.


## 2026-10-01 Meaning navigation approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (请部署)
update: reinforces / no_model_change

User approved the reviewed two-file meaning navigation package. Runtime/Dev/Mirror engine and styles now match the reviewed hashes. Fresh byte backups, runtime syntax, seven isolated deployed-byte regression suites and nine unchanged non-target file sentinels pass. Only engine/styles were copied to the proven NEWERA runtime. No user business data/settings/index/cache written; native reload, multiwindow/zoom and actual UI acceptance remain pending. This supersedes the previous deployment-pending status for this feature. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261001-supermemo-meaning-navigation-deployment.md.


## 2026-10-03 Antinet mounted keyword navigation choices

status: repository_verified_runtime_pending
evidence_status: confirmed_by_code; request confirmed_by_user
update: refines

Antinet 框架检查器中已挂载关键词的 external-link 按钮复用义胶囊的双选菜单：打开 Keyword Index / 直接打开 Note。悬停、键盘焦点和点击均可展开；菜单的无障碍名称为 Antinet 关键词跳转。单个 Note 直接打开，多个 Note 按实际路径去重后由用户选择，无 Note 或 owner 接口不可用时给出提示。

关系跳转层沿用 EVA.openNode(targetNodeKey)，材料承载层沿用 Keyword Index 的 getKeywordNotesForNode(targetNodeKey) 与 openKeywordNote(path)。SuperMemo 只投影选项，不解析关键词地址、不猜首条笔记、不接管业务数据。树上挂载正文的义胶囊定位和 Meta 捕获语义保持原样。共同菜单继续保护失效异步结果、源视图清理和键盘交互；悬停不查询 owner。

Repository fixture verification is separate from deployed/native evidence. Runtime is unchanged pending feature-specific secondary approval; real Obsidian reload, multiple windows and real-data acceptance remain pending. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-antinet-navigation.md.

### Meaning page scroll retention

User additionally requests retaining vertical reading position across page switches. Each engine/view session keeps a bounded 80-entry LRU map keyed by rendered project ID and normalized search query. Before DOM replacement, capture the old page using its frozen key; restore the meaning panel and its known owning plugin host after synchronous rendering. Explicit pending capsule reveal skips restoration and retains priority. Empty/new pages begin at zero; switching back restores the old page; cleanup releases all positions. This is ephemeral view environment state, not business content or persisted settings; plugin reload/new view starts a fresh session. Desktop and narrow host scroll, exact visual anchor, project/search separation and explicit reveal verified with synthetic browser fixtures.


## 2026-10-03 Antinet navigation and meaning scroll approved deployment

status: runtime_dev_mirror_synced_native_reload_pending
evidence_status: confirmed_by_code (disk bytes), confirmed_by_user (OK就请部署)
update: supersedes / no_model_change

The user authorized this reviewed package. Only supermemo-concept-display-engine.js was copied to the proven NEWERA runtime after a fresh baseline check and byte backup. Runtime/Dev/Mirror engine now agree at SHA-256 d76a50ab167cee006eba518e049da3134eb81d1f1c19f338ef3b8f3914e20ff6; all seven production files agree across the three roles. Runtime syntax, seven isolated regression suites run against deployed bytes, and ten unchanged non-target runtime file hashes pass. Atlas/Framework trace records deployment, without changing ownership or schemas.

Both Antinet Index/Note choices and per-view-session meaning project/search scroll retention are installed on disk. Existing loaded Obsidian code has not been reloaded or tested; user-controlled plugin reload/restart and real-data/multiwindow acceptance remain pending. Positions reset when the engine/view session ends. No business JSON/settings/index/cache copied or modified. This supersedes deployment-pending statements for this package. Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-antinet-navigation-deployment.md.


## 2026-10-03 SuperMemo Note at source tab-group end

status: repository_verified_runtime_pending
evidence_status: confirmed_by_user (far-right tab destination); confirmed_by_code
update: refines

Antinet and meaning-capsule Direct Note actions append a new active Note tab at the right end of the originating SuperMemo tab group. The actual ItemView leaf is carried through engine context, then sent with the selected exact note path to Keyword's new openKeywordNoteAtTabEnd(path, sourceLeaf). Existing tabs, including pinned/deferred leaves, are counted and preserved. Multiple notes still require explicit selection; Index navigation, local tree reveal and meaning session scroll remain unchanged. If the source is closed or the new provider interface is missing, navigation reports failure rather than silently opening beside an unrelated active tab. Native host placement awaits deployment/reload acceptance.

Trace: memory/obsidian-plugin-system/change-records/2026/2026-10/20261003-supermemo-note-tab-end.md.


### 2026-10-03 Note tab-end deployment
status: runtime_deployed_native_acceptance_pending
User explicitly confirmed deployment of this package. SuperMemo main/engine and Keyword main synchronized from reviewed dev to proven NEWERA runtime; runtime/dev/mirror SHA-256 agree. No business data changed. Host/plugin reload and actual rightmost-tab placement remain user acceptance pending. Evidence: state/staging/supermemo-note-tab-end-20261003/deployment.json.


## 2026-10-24 存储边界：业务内容在跨库共享的 localStorage（confirmed_by_code + confirmed_by_user）

- observation：实验库 SuperMemo Antinet 显示 `ANTINET_SCHEMA_FUTURE` 只读保护；用户在实验库 Console 读取 `supermemo_antinet_structure_tree_v1` 的 `schemaVersion` 返回 2。
- claim：本插件用裸 `window.localStorage` 保存概念页、主体结构树（含事务）、Antinet 框架、义胶囊等 7 个键，键名不含库标识；Obsidian 的 localStorage 位于 `%APPDATA%/obsidian/Local Storage/leveldb/`，按程序共享、不按库隔离。日常库第2版插件已把共享数据升到 schema 2，实验库旧版（schema 1）按设计拒写进入只读。
- 对比：PEO/EVA 草稿与 Mandala/GTD 输入恢复箱的键带库路径（已隔离）；GTD/Timeline 标签预设、Mermaid 图状态等只是界面偏好共享。
- 影响：在数据隔离前，任一库对这些键的写入都会改到另一库所见内容；不要在实验库编辑 SuperMemo 内容。隔离需键名带库标识+旧数据迁移，另案；用户 2026-10-24 选择暂不处理（SM-U01）。


## 2026-10-26 补齐：Antinet 自动抽屉与手动子树（10-22 已部署）

source_status: confirmed_by_user + confirmed_by_code
status: runtime_deployed_native_acceptance_pending
update_type: refines / supersedes

挂载关键词 A 后，组合树自动展示其后续 B、C 抽屉，包括中间无直接笔记的抽屉和 SCON；挂载 B 时只展开 B 的后续层级。自动抽屉可承接手动框架节点，手动节点继续支持说明、移动、归档和挂关键词。集合入口聚合来源，原笔记不搬迁、不复制；既有手动节点不按标题自动合并。

Keyword 是抽屉来源 owner/provider；EVA 保存真实挂载关系；SuperMemo 是来源投影 consumer，同时拥有新增的手动框架内容。自动抽屉不作为持久框架节点逐个写入，也不批量注册为 EVA 对象。具体接口见[抽屉投影契约](../contracts.md#antinet-drawer-projection-v1)。

Antinet schema 2 保留手动节点真实 `parentId` 作为持久所有权父节点，另用 `drawerAnchor={relationId,sourceNodeKey,lastKnownLabel}` 记录显示附着。挂载位置与永久来源身份共同区分同源多处挂载。经 Keyword 身份事务确认的改名/移动可保持关联；直接改 frontmatter 不等于身份迁移。无永久身份时可查看来源，但不能新增持久附着。失联、取消挂载、来源超出作用域或预算截断均保留手动后代，显示待恢复入口；“移动”可重新附着或移回普通父节点。

组合树统一用于绘制、搜索、定位、折叠和带来源的 Markdown 导出。抽屉默认折叠；循环按当前来源祖先链停止展开。预算限制自动来源读取和投影，全部持久手动节点仍保留，因此不是严格总 DOM 上限。不能把不完整快照当作源删除。

读取 schema 1 时仅在内存兼容，不因打开/刷新写回；实际编辑保存 schema 2 后，旧版 writer 进入只读保护。上节跨库共享 localStorage 与 [SM-U01](../unknowns-register.md) 的 deferred_by_user 状态继续有效，本功能没有完成按库隔离。10-24 读到 schema 2 只是存储版本证据，不是自动抽屉完整原生验收。

证据：[代码独审](../../../../REFERENCE_BOUNDARIES.md#ref-268)（外部来源未随包提供）、[测试](../../../../REFERENCE_BOUNDARIES.md#ref-269)（外部来源未随包提供）、[10-22 部署](../../../../REFERENCE_BOUNDARIES.md#ref-270)（外部来源未随包提供）。部署当时5文件四边哈希一致，9测试脚本与4语法检查通过；不据此宣称10-26当前文件仍全相同。原生重载/完整交互验收尚缺记录。
