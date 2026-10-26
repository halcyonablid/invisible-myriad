# Context Capsule Key / 操作上下文主键

status: confirmed_by_user
created: 2026-06-25
updated: 2026-10-13
owner: project-execution-overview declaration and descriptor projection; permanent registry not yet in production
layer: cross_plugin_operational_identity

## Claim

Context Capsule Key is the operation-level shared identity for a task, project, or work context across multiple plugins. It is not an Obsidian note-level Keyword and not a plugin tab. It is a capsule-level symbolic key that lets different plugins face the same operating object.

The user-facing Chinese term is `操作上下文主键`. English canonical term is `Context Capsule Key`.

## Effective Project / Goal Subsets

`Effective Operational Context Key / 有效操作上下文主键` is the derived current-eligibility projection for project and goal domains. Projects use exact Workspace carriers; goals use exact Mandala owners and unique forward EVA/GTD carrier evidence. Both require a PEO declaration and non-stopped Mandala tracking; legacy Kill is historical diagnostics only. See [the canonical eligibility contract](effective-operational-context-key.md).

The 2026-10-13 [unified-management status](unified-context-key-management.md) separates the current project-domain management entrance from future dual-domain directory and permanent identity service. A descriptor contextKeyId may still be label-derived; deployment of rename recovery is not deployment of a persistent identity registry.

## Why It Exists

The user's system has several plugins that can all point to the same working context:

- Project Overview / 项目执行总览;
- Workspace Mount;
- Mandala / 九宫格;
- GTD;
- Collection Card;
- State Capsules;
- SuperMemo concept management;
- Keyword and ordinary note networks.

Before this concept, a new task often had to be manually created in each plugin: create the plugin's local tab/node/tag first, then set the same upper-level keyword in each place. That made the shared symbol fragile and easy to forget.

Context Capsule Key separates identity from local content. The key can exist first as a shared upper-level operation symbol. Consumer plugins may then either bind local content to it or show it as a virtual waiting capsule.

## Field Contract

status: confirmed_by_code

Project Overview exposes the read-only key list through:

```js
window.__projectExecutionOverviewPluginApi.getContextCapsuleKeys()
window.__projectExecutionOverviewPluginApi.getContextCapsuleKeysSync()
```

Each item is limited to identity fields:

- `contextKeyId`;
- `address`;
- `canonicalLabel`;
- `displayLabel`;
- `color`;
- `icon`.

Current trial uses Project Overview's keyword-derived identity. Addressed keys include the full display label in the derived id hash, so `003- A` and `003- B` do not collapse merely because the address is the same. Persistent registry IDs may still be needed later if keys need rename history, merge, split, deletion semantics, or durable identity independent of label changes.

## Address Matching Rule

status: confirmed_by_user

The address is the complete prefix before the separator `- `, including letter suffixes.

Examples:

- `036- 写作，打磨技艺` has address `036`.
- `036B- 写作，打磨技艺` has address `036B`.

These are different Context Capsule Keys even if their canonical label is the same. When a local consumer keyword contains an address, matching must use the full display label, not address alone:

- first parse the address and canonical label;
- then match by exact `displayLabel`, such as `036B- 写作，打磨技艺`;
- if an address is present but not matched, stop;
- do not fall back to matching the canonical label alone.
- do not treat address equality alone as synchronized, because `003- A` and `003- B` are different operating contexts.

Standalone address compatibility is also part of the owner projection. A declaration consisting only of an exact address token such as `036G001A` is projected with `address = 036G001A`; ordinary unaddressed labels remain addressless. This compatibility enrichment must preserve an already-issued label-derived `contextKeyId`, so it does not silently migrate identity from `cck_label_*` to `cck_addr_*`. Structured `address - label` declarations retain the existing addressed identity behavior. Standalone `9XX` tokens such as `900` and `900A` remain historical/archive declarations; `009` and `90A` are not classified as `9XX`.

This prevents `036B- 写作，打磨技艺` from being marked synchronized with `036- 写作，打磨技艺`, and prevents same-address/different-label capsules from being collapsed.

## Ownership Boundary

status: confirmed_by_user

Project Overview currently owns declarations, descriptor projection and confirmed rename coordination (`confirmed_by_code`). The earlier identity-registry wording described intended ownership, not a production permanent-ID registry. Mandala hosts the project-row management entrance and delegates naming to PEO; consumers retain their local business content. Independent-host extraction remains a design recommendation; see [unified management](unified-context-key-management.md).

Project Overview may:

- expose keys as a read-only API;
- expose identity descriptors while preserving full subject references; label-derived contextKeyId is not guaranteed permanent;
- act as management entrance for key naming, address, color, and icon;
- help consumers display virtual waiting capsules.
- push/sync identity changes outward to already bound consumer carriers through explicit owner APIs when that protocol is implemented.

Project Overview must not:

- write Mandala business JSON;
- write GTD task/tag/keyword JSON;
- write Workspace Mount business JSON;
- create plugin tabs, nodes, tags, tasks, or cards automatically in consumers.

Consumer plugins may:

- read the key list;
- match addressed local keywords by full display label;
- match unaddressed local keywords by canonical label when that is intentional local shorthand;
- mark matched local capsules as `同步`;
- show missing keys as `虚位`;
- show local-only plugin capsules as `本地`;
- sort bound and virtual capsules together by address/name;
- keep local click behavior for bound content.
- create or reuse local carrier records through their own owner APIs when the user explicitly invokes a provisioning workflow.

Consumer plugins must not:

- treat virtual capsules as real local records;
- save virtual capsules into business JSON by rendering them;
- auto-create missing local content during passive rendering;
- become a second identity owner.
- rename or edit Context Capsule Key identity and propagate that change back to other plugins.

## Identity Edit Rule

status: confirmed_by_user

Context Capsule Key identity edits are single-owner edits. The canonical place to rename or change address / label / color / icon is Project Overview / 项目执行总览.

If a user changes a local carrier label inside Workspace Mount, GTD, Collection Card, or Mandala, that is local plugin content unless the future Project Overview sync protocol explicitly handles it. It must not silently rewrite the Context Capsule Key registry or other plugins.

The confirmed rename flow preserves this single-owner direction; a UI in Mandala delegates to PEO rather than writing a second registry:

`Project Overview identity edit -> explicit sync to bound consumer carriers`

The forbidden direction is:

`consumer local edit -> implicit Context Capsule Key identity edit -> propagate to all plugins`

This keeps Project Overview as the management host and prevents multi-owner conflicts.

## Historical v1 Rename Propagation Protocol

status: confirmed_by_code
updated: 2026-06-26

The following describes the earlier comment-editor v1 path. The new management-panel path previews first, then persists intent, saves/verifies the declaration, and runs frozen V2 owner plans; see [current management](unified-context-key-management.md).

Context Capsule Key rename propagation v1 is single-owner and confirmation-gated:

1. The user edits the key inside Project Overview's own comment block.
2. Project Overview detects a single-key rename only when one old key is removed and one new key is added in the `--- key ---` metadata block.
3. Project Overview saves its own comment first, then dry-runs consumer owner APIs and shows a confirmation modal.
4. If confirmed, Project Overview sends `renameContextCapsuleKey({ oldDisplayLabel, newDisplayLabel, source: "project-execution-overview", dryRun: false })`.
5. Consumers only update exact stored keyword matches for `oldDisplayLabel`; they do not match by address alone and do not create missing carriers.
6. If the user chooses "仅保存项目总览", consumers are not changed.

Implemented v1 consumers:

- Workspace Mount: updates exact matching Tab capsule keyword assignments.
- GTD: updates exact matching tag keyword assignments through `gtd-engine.js`.
- Collection Card View: updates exact matching Tab capsule keyword assignments.
- State Capsules: updates exact matching capsule `keywords` entries through `window.__stateCapsulesPluginApi`.

Mandala remains read-only for rename propagation in v1 because Mandala node placement is semantically meaningful and should not be rewritten by a global rename flow.

Consumer APIs reject non-Project Overview sources with `unsupported-source`. Consumer-side local label edits therefore remain local content and do not become global identity edits.

## Same-Address Repair Protocol

status: confirmed_by_code
updated: 2026-06-26

Rename propagation v1 needs an exact `oldDisplayLabel`. A partial runtime state can occur when Project Overview / Workspace source metadata has already moved to the new key, while GTD or Collection Card still holds the old key with the same address. In that case there may be no reliable old key left in Project Overview's current source record.

Project Overview therefore also exposes a repair path:

1. Project Overview saves or observes one canonical addressed key in its comment block.
2. It dry-runs consumer APIs with `syncContextCapsuleKey({ displayLabel, source: "project-execution-overview", dryRun: true })`.
3. Consumers only match local carriers whose parsed address equals the canonical key address and whose full `displayLabel` is different.
4. Consumers return conflicts if the target full display label is already bound to another local carrier.
5. Project Overview asks for confirmation before executing the same API with `dryRun: false`.

This protocol is only for repairing stale same-address consumer carriers after a Project Overview owner-side key edit. It does not weaken the normal synchronization rule: passive UI matching still requires the full display label, not address alone.

Implemented repair consumers:

- Workspace Mount: repairs Tab capsule keyword assignments only. User correction on 2026-10-01 excludes project-entry comment lines and paradigm tag keywords from normal rename, repair and recovery alike. Older implementation included these fields; the reviewed recovery candidate narrows both legacy entry points. This is a scope correction, not authorization to modify historical comments.
- GTD: repairs tag keyword assignments through `gtd-engine.js`.
- Collection Card View: repairs Tab capsule keyword assignments.
- State Capsules: repairs capsule `keywords` entries when the address matches but the stored full display label is stale.

## UI Semantics

### Confirmed rename recovery (2026-10-01)

status: runtime_dev_mirror_deployed_native_acceptance_pending
source_status: confirmed_by_code

User's naming convention already distinguishes labels. The priority is recovery from partial success, not broader matching. PEO coordinates a durable confirmed job in its own `context-key-renames.json`; Workspace/Collection/GTD remain owners of their keyword sidecars. Workspace writes ONLY Tab capsule keywords, Collection writes Tab keywords, GTD writes tag keyword bindings. No Tab/project/tag title, Workspace paradigm keyword or project-entry comment is part of this flow.

The deployed `contextCapsuleRenameV2` owner API supports prepare, commit and authoritative verify. A plan freezes the owner source and existing carrier; PEO persists the confirmed intent and each provider plan before writes. Owner commit uses an owner queue, fresh target checks, byte backup and file compare-and-swap; reread confirms persistence. Missing provider/read failure remains pending. Existing successful participants are verified without repeated mutation; completion requires all participating owners verified or freshly proved no-match. Disabled State Capsules is explicitly excluded at confirmation; enabled providers lacking V2 remain pending rather than falsely successful.

Persistent status and the `context-key-rename-recovery` command expose outstanding work. Restart/provider-ready and bounded retries attempt recovery; manual retry remains available. Changed/cleared current declarations block stale jobs; a confirmed successor supersedes the previous job and retains proven targets and old labels for A-to-B-to-C recovery. Unknown same-address repair requires a fresh preview/confirmation, never silent address rediscovery on retry. No distributed atomicity or rollback of already successful owners is claimed.

Evidence: `state/verification_inputs/context-rename-recovery-20261001/`; deployment and loaded-host acceptance are recorded separately. Historical v1 paragraphs above describe prior behavior where explicitly marked; this implementation does not change current effective-set qualification. Disk deployment on 2026-10-01 aligns 33 files across runtime/dev/mirror; 27 recovery tests and 30 deployed syntax checks pass. Native reload and interaction remain unverified. The live workspace.json changed during the deployment window; the other 77 protected files did not. No causal claim is made for the workspace change. See DEPLOYMENT_RESULT.json and DEPLOY_REVIEW.md in that evidence directory.

status: confirmed_by_user

There are three main UI states:

- `同步`: the consumer has local content whose full key display label matches a Context Capsule Key.
- `本地`: the consumer has a local keyword/capsule that does not currently match Project Overview's Context Capsule Key registry.
- `虚位`: Project Overview has the key, but this consumer has no local content bound to it yet.

The visual distinction is important because it gives the system an intentional stance in Daniel Dennett's sense: the interface behaves as if the system can hold a pending intention toward a task. The key is already recognized as a possible operating context even before every plugin has local content. The virtual capsule is a prompt and affordance, not a created record.

For Workspace Mount, GTD, and Collection Card View, Context Capsule Key chips should display only the key itself. The UI should not visibly render the bound Workspace Tab name, GTD tag label, or Collection Card Tab name after the key. Local binding may remain in tooltip and click behavior.

The current write boundary is single-owner: Project Overview is the stable management place for renaming or editing Context Capsule Key identity. Consumers are read/project surfaces plus owner-side local carrier writers for Project Overview-confirmed rename propagation. Cross-plugin rename propagation from a consumer plugin is not implemented and remains forbidden without a separate bidirectional sync protocol with conflict handling, confirmation, and audit trail.

## Provisioning Workflow

status: confirmed_by_code

Mandala weekly project-plan add-project can act as a provisioning trigger, but not as the identity owner. The flow is:

1. user enters `projectName`, `contextKey`, and importance group;
2. Workspace Mount creates the Workspace project entry through its owner API;
3. Project Overview records / exposes the Context Capsule Key identity;
4. consumer plugins create or reuse local carriers through their own owner APIs.

Current local carriers:

- Workspace Mount: root Tab named by `projectName`, with `contextKey` as tab capsule keyword.
- Collection Card View: root Tab named by `projectName`, with `contextKey` as tab capsule keyword.
- GTD: top-level tag named by `projectName`, with `contextKey` as tag keyword; GTD also creates or reuses a top-level project named by `projectName`, appends it to the project list when new, and tags that project with the same GTD tag.
- Mandala: does not auto-create a Mandala node because node placement in the grid is semantically meaningful and should be chosen by the user.

This is explicit provisioning, not passive virtual-capsule rendering. A virtual capsule still remains non-persistent until a user workflow or owner API creates the local carrier.

## Current Consumers

status: confirmed_by_code

Implemented consumers:

- Workspace Mount: displays synced tab capsule keywords and virtual waiting capsules.
- Mandala: displays synced node keywords and virtual waiting capsules in keyword locating surfaces.
- GTD: displays synced tag keywords and virtual waiting capsules in tag keyword index surfaces.
- Collection Card View: displays synced tab keywords, local-only tab keywords, and virtual waiting capsules in Tab keyword surfaces.
- State Capsules: displays synced capsule keywords, local-only capsule keywords, and virtual waiting capsules in capsule keyword index surfaces. Virtual chips are read-only and are not written into `data.json`.
- Project Overview confirmed rename propagation: Workspace Mount, GTD, Collection Card View, and State Capsules can rename already-bound local carriers through explicit owner APIs.

Trial boundary:

- Start from Project Overview + Workspace Mount.
- Extend to Mandala and GTD after the first trial.
- Extend to Collection Card View as a read-only consumer after the strict full-label matching rule is clarified.
- Extend to State Capsules as a read-only/owner-synced consumer after the Project Overview rename/repair protocol proves stable.
- Do not extend consumer-initiated writeback / rename propagation until the bidirectional sync protocol exists.
- Do not extend to SuperMemo or Keyword plugin until the current contract proves stable.

## State Capsule Starting-Point Restore Semantics

status: repository_dev_static_verified_runtime_pending
updated: 2026-08-17

State Capsule keywords now do more than appear as synchronized chips: they are the bounded semantic input for restoring GTD context.

State Capsules passes the normalized key labels to GTD. GTD remains the owner of resolving those labels to local tag ids and projects. The key therefore identifies an operating context without becoming a GTD filter or transferring ownership of GTD records to State Capsules.

When one key maps to multiple GTD projects, the capsule's saved anchor and scroll context disambiguate the intended project. The resulting view is normal and unfiltered. A missing carrier or project does not trigger provisioning; GTD falls back to the capsule's old local view context and logs the boundary.

Project Overview uses the same continuity principle for its primary-key Tabs: derived `groupId` is attempted first, stable `primaryNodeKey` is the identity fallback, and lifecycle visibility is revalidated at restore time.

This refines the Context Capsule Key from a shared display/binding identity into a restore-time context locator while preserving single-owner data boundaries.

The locator does not make the capsule a moving checkpoint. A State Capsule is a manually maintained launch baseline: switching restores that baseline but never saves the journey being left. The key may help GTD and other owners locate the intended context during restore, but it cannot capture live state, advance the baseline, or write a replacement snapshot. Only the user's explicit save-new or overwrite-active action changes the baseline.

`activeCapsuleId` records which starting point is selected. It is not evidence that the selected baseline was rewritten, and Context Capsule Key rename/repair remains identity metadata maintenance rather than journey capture.

## Relation To Keyword

status: confirmed_by_user

Context Capsule Key is operation-level and meta-operational. Keyword is note/tree-level symbolic entrance.

Keyword:

- points into the user's Antinet / ATOM / ordinary note network;
- is managed by the keyword system;
- acts as a symbolic communication port into note material.

Context Capsule Key:

- points to an operating context across plugins;
- is managed by Project Overview identity fields;
- acts as a shared upper-level capsule that plugins can align to.

The two can have the same label or address, but they are not the same ownership layer.

## Open Questions

- Should `contextKeyId` become a persistent UUID independent of address and label?
- Existing confirmed rename journal/audit and draft protection are implemented; merge/split and permanent-ID audit semantics remain open.
- Should consumer-side edits ever propagate back to Project Overview, or should Context Capsule Key identity remain single-owner?
- How should the implemented project rename/verified recovery extend to the remaining domains and consumers while preserving their local semantics? See CKM-U03, FW-010 and FW-026.
- When should a virtual capsule prompt the user to bind local content, and which plugin owns that creation flow?
- How should this extend to State Capsules, SuperMemo concept management, and Keyword without creating data ownership confusion?

## Sources

- User observation on 2026-06-25: capsule-level keywords are shared operation symbols across State Capsules, Project Overview, GTD, Mandala, Collection Card, Workspace Mount, Collection Card plugin, and SuperMemo concept management.
- Engineering change record: `memory/obsidian-plugin-system/change-records/2026/2026-06/20260625-152500-context-capsule-key-trial.md`.
- Runtime code contract in Project Overview: `getContextCapsuleKeys()` and `getContextCapsuleKeysSync()`.
- Runtime consumer pattern in Workspace Mount, then Mandala and GTD second-batch consumer implementation.
- User observation on 2026-06-25: virtual Context Capsule Keys make the system feel more intentional because plugins can display a pending operating context before local content exists.
- Engineering updates on 2026-06-25: Mandala, GTD, and Collection Card View were aligned on full-display-label matching and `同步` / `本地` / `虚位` UI semantics.
- User correction on 2026-06-25: GTD provisioning should create a top-level tag named by project name and create/reuse the corresponding GTD project at the end of the project list with that tag applied.
- User correction on 2026-06-25: Context Capsule Key edits should be made from Project Overview and synchronized outward; consumer-side edits should not implicitly become identity edits.
